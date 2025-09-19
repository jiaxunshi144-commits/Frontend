// ============ Contract Config ============
const GOVERNANCE_ADDR = "0x4b73515d2DfEfd5aaaDA2286227A2cBC6DbB903e";
const TOKEN_ADDR      = "0x3B7b8dF8f95166a919Ec4C252Ca71a06561DDF98";

const GOVERNANCE_ABI = [
  "function attestReport(bytes32 hash, bool passed, string reason) public"
];
const TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)"
];

// ============ Globals ============
let provider = null;
let signer = null;
let governance = null;
let token = null;

// ============ Init ============
async function initContracts() {
  governance = new ethers.Contract(GOVERNANCE_ADDR, GOVERNANCE_ABI, signer);
  token = new ethers.Contract(TOKEN_ADDR, TOKEN_ABI, signer);
}

// ============ Wallet ============
async function connectWallet() {
  if (!window.ethereum) return alert("Please install MetaMask!");
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  const addr = await signer.getAddress();
  document.getElementById("walletAddress").innerText = "Connected: " + addr;
  await initContracts();
}
async function disconnectWallet() {
  provider = signer = governance = token = null;
  document.getElementById("walletAddress").innerText = "Not connected";
  document.getElementById("resultBox").innerText = "[No action yet]";
}

// ============ Attestation ============
async function attestReport(passed) {
  const hash = document.getElementById("hashInput").value;
  const reason = document.getElementById("reasonInput").value || "";

  if (!hash) return alert("Enter a file hash!");

  try {
    const tx = await governance.attestReport(hash, passed, reason);
    await tx.wait();

    let msg = `✅ Attested (${passed ? "Approved" : "Rejected"})\nTx: ${tx.hash}`;

    if (passed) {
      // 模拟随机发放 token
      const reward = Math.floor(Math.random() * 20) + 10; // 10–30 GRT
      msg += `\n🎁 Reward simulated: ${reward} GRT`;
    }

    document.getElementById("resultBox").innerText = msg;
  } catch (err) {
    document.getElementById("resultBox").innerText = `❌ Attestation failed: ${err.message}`;
  }
}

// ============ Bindings ============
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectButton").onclick = connectWallet;
  document.getElementById("disconnectButton").onclick = disconnectWallet;
  document.getElementById("attestPass").onclick = () => attestReport(true);
  document.getElementById("attestFail").onclick = () => attestReport(false);
});
