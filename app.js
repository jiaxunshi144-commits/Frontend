// ============ Contract Config ============
const GOVERNANCE_ADDR = "0x4b73515d2DfEfd5aaaDA2286227A2cBC6DbB903e"; // governance contract
const TOKEN_ADDR = "0x3B7b8dF8f95166a919Ec4C252Ca71a06561DDF98";   // green token contract

const GOVERNANCE_ABI = [
  "function registerContent(bytes32 hash) public",
  "function attestReport(bytes32 hash, bool passed, string reason) public",
  "function getReportStatus(bytes32 hash) public view returns (bool,bool,bool,address,uint64,string)"
];

const TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)"
];

// ============ Globals ============
let provider = null;
let signer = null;
let governance = null;
let token = null;

// ============ Utils ============
function toBytes32FromString(str) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
}

async function initContracts() {
  governance = new ethers.Contract(GOVERNANCE_ADDR, GOVERNANCE_ABI, signer);
  token = new ethers.Contract(TOKEN_ADDR, TOKEN_ABI, signer);
}

// ============ Core Functions ============
async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask!");
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();

  const addr = await signer.getAddress();
  document.getElementById("walletAddress").innerText = "Connected: " + addr;
  await initContracts();
}

async function disconnectWallet() {
  provider = null;
  signer = null;
  governance = null;
  token = null;

  document.getElementById("walletAddress").innerText = "Not connected";
  document.getElementById("uploadResult").innerText = "";
  document.getElementById("attestResult").innerText = "";
  document.getElementById("statusResult").innerText = "";

  console.log("🔌 Disconnected from wallet");
}

// Upload report (Enterprise role)
async function uploadReport() {
  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) {
    alert("Please select a file!");
    return;
  }
  const file = fileInput.files[0];
  const hash = toBytes32FromString(file.name);

  try {
    const tx = await governance.registerContent(hash);
    await tx.wait();
    document.getElementById("uploadResult").innerText =
      `✅ Uploaded\nFile: ${file.name}\nHash: ${hash}\nTx: ${tx.hash}`;
  } catch (err) {
    document.getElementById("uploadResult").innerText = `❌ Upload failed: ${err.message}`;
  }
}

// Attestation (Auditor role)
async function attestReport(passed) {
  const hash = document.getElementById("hashInput").value;
  const reason = document.getElementById("reasonInput").value || "";

  if (!hash) {
    alert("Enter a file hash!");
    return;
  }

  try {
    const tx = await governance.attestReport(hash, passed, reason);
    await tx.wait();
    document.getElementById("attestResult").innerText =
      `✅ Attested (${passed ? "Approved" : "Rejected"})\nTx: ${tx.hash}`;
  } catch (err) {
    document.getElementById("attestResult").innerText = `❌ Attestation failed: ${err.message}`;
  }
}

// Check report status
async function checkStatus() {
  const hash = document.getElementById("statusHash").value;
  if (!hash) {
    alert("Enter a file hash!");
    return;
  }

  try {
    const status = await governance.getReportStatus(hash);
    document.getElementById("statusResult").innerText =
      JSON.stringify(status, null, 2);
  } catch (err) {
    document.getElementById("statusResult").innerText = `❌ Query failed: ${err.message}`;
  }
}

// ============ Event Bindings ============
window.addEventListener("DOMContentLoaded", function () {
  document.getElementById("connectButton").onclick = connectWallet;
  document.getElementById("disconnectButton").onclick = disconnectWallet;
  document.getElementById("uploadButton").onclick = uploadReport;
  document.getElementById("attestPass").onclick = () => attestReport(true);
  document.getElementById("attestFail").onclick = () => attestReport(false);
  document.getElementById("checkStatus").onclick = checkStatus;
});
