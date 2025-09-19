// ============ Contract Config ============
const GOVERNANCE_ADDR = "0x4b73515d2DfEfd5aaaDA2286227A2cBC6DbB903e";
const GOVERNANCE_ABI = [
  "function attestReport(bytes32 hash, bool passed, string reason) public",
  "function getReportStatus(bytes32 hash) public view returns (bool,bool,bool,address,uint64,string)"
];

// ============ Globals ============
let provider = null, signer = null, governance = null;

// ============ Modal ============
function openModal(id) { document.getElementById(id).style.display = "flex"; }
function closeModal(id) { document.getElementById(id).style.display = "none"; }

// ============ Wallet ============
async function connectWallet() {
  try {
    if (!window.ethereum) return alert("Please install MetaMask!");
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    const addr = await signer.getAddress();
    document.getElementById("walletAddress").innerText = "Connected: " + addr;
    governance = new ethers.Contract(GOVERNANCE_ADDR, GOVERNANCE_ABI, signer);
    console.log("✅ Wallet connected:", addr);
  } catch (err) {
    console.error("❌ Wallet connection failed:", err);
    alert("Wallet connection failed: " + err.message);
  }
}

async function disconnectWallet() {
  provider = signer = governance = null;
  document.getElementById("walletAddress").innerText = "Not connected";
  document.getElementById("attestResult").innerText = "";
  document.getElementById("statusResult").innerText = "";
  console.log("🔌 Disconnected");
}

// ============ Attestation ============
async function attestReport(passed) {
  const hash = document.getElementById("hashInput").value;
  const reason = document.getElementById("reasonInput").value || "";
  if (!hash) return alert("Enter a file hash!");

  try {
    const tx = await governance.attestReport(hash, passed, reason);
    await tx.wait();
    document.getElementById("attestResult").innerText =
      `✅ Attested (${passed ? "Approved" : "Rejected"})\nTx: ${tx.hash}`;

    const copyBtn = document.getElementById("copyAttestHash");
    copyBtn.style.display = "inline-block";
    copyBtn.onclick = () => navigator.clipboard.writeText(hash);
  } catch (err) {
    document.getElementById("attestResult").innerText = `❌ Attestation failed: ${err.message}`;
  }
}

// ============ Status ============
async function checkStatus() {
  const hash = document.getElementById("statusHash").value;
  if (!hash) return alert("Enter a file hash!");

  try {
    const status = await governance.getReportStatus(hash);
    document.getElementById("statusResult").innerText = JSON.stringify(status, null, 2);

    const copyBtn = document.getElementById("copyStatusHash");
    copyBtn.style.display = "inline-block";
    copyBtn.onclick = () => navigator.clipboard.writeText(hash);
  } catch (err) {
    document.getElementById("statusResult").innerText = `❌ Query failed: ${err.message}`;
  }
}

// ============ Event Bindings ============
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectButton").onclick = connectWallet;
  document.getElementById("disconnectButton").onclick = disconnectWallet;
  document.getElementById("attestPass").onclick = () => attestReport(true);
  document.getElementById("attestFail").onclick = () => attestReport(false);
  document.getElementById("checkStatus").onclick = checkStatus;
});
