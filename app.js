// ============ Contract Config ============
const GOVERNANCE_ADDR = "0x4b73515d2DfEfd5aaaDA2286227A2cBC6DbB903e";
const TOKEN_ADDR = "0x3B7b8dF8f95166a919Ec4C252Ca71a06561DDF98";

const GOVERNANCE_ABI = [
  "function registerContent(bytes32 hash) public",
  "function attestReport(bytes32 hash, bool passed, string reason) public",
  "function getReportStatus(bytes32 hash) public view returns (bool,bool,bool,address,uint64,string)"
];
const TOKEN_ABI = ["function balanceOf(address account) external view returns (uint256)"];

// ============ Globals ============
let provider = null, signer = null, governance = null, token = null, feedInterval = null;

// ============ Utils ============
function toBytes32FromString(str) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
}
function toBytes32FromData(obj) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify(obj)));
}
async function initContracts() {
  governance = new ethers.Contract(GOVERNANCE_ADDR, GOVERNANCE_ABI, signer);
  token = new ethers.Contract(TOKEN_ADDR, TOKEN_ABI, signer);
}

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
    await initContracts();
    console.log("✅ Wallet connected:", addr);
  } catch (err) {
    console.error("❌ Wallet connection failed:", err);
    alert("Wallet connection failed: " + err.message);
  }
}

async function disconnectWallet() {
  provider = signer = governance = token = null;
  document.getElementById("walletAddress").innerText = "Not connected";
  document.getElementById("uploadResult").innerText = "";
  document.getElementById("statusResult").innerText = "";
  document.getElementById("dataFeed").innerText = "[No data yet]";
  document.getElementById("balanceResult").innerText = "Balance: 0 GRT";
  document.getElementById("impactResult").innerText = "CO₂ Reduction: 0 tons";
  console.log("🔌 Disconnected");
}

// ============ Upload ============
async function uploadReport() {
  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) return alert("Please select a file!");
  const file = fileInput.files[0];
  const hash = toBytes32FromString(file.name);

  try {
    const tx = await governance.registerContent(hash);
    await tx.wait();
    document.getElementById("uploadResult").innerText =
      `✅ Uploaded\nFile: ${file.name}\nHash: ${hash}\nTx: ${tx.hash}`;
    const copyBtn = document.getElementById("copyUploadHash");
    copyBtn.style.display = "inline-block";
    copyBtn.onclick = () => navigator.clipboard.writeText(hash);
  } catch (err) {
    document.getElementById("uploadResult").innerText = `❌ Upload failed: ${err.message}`;
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

// ============ IoT Data ============
function randomESGData() {
  return {
    carbon: (Math.random() * 100).toFixed(2),
    energy: (Math.random() * 500).toFixed(2),
    water: (Math.random() * 50).toFixed(2),
    ts: new Date().toISOString()
  };
}
async function pushESGData() {
  const data = randomESGData();
  const hash = toBytes32FromData(data);
  try {
    const tx = await governance.registerContent(hash);
    await tx.wait();
    const feedEl = document.getElementById("dataFeed");
    feedEl.innerText =
      `✅ ESG Data Uploaded @ ${data.ts}\nCarbon: ${data.carbon}, Energy: ${data.energy}, Water: ${data.water}\nHash: ${hash}\nTx: ${tx.hash}\n\n` +
      feedEl.innerText;
  } catch (err) { console.error("Upload failed:", err); }
}
function startFeed() {
  if (feedInterval) return;
  pushESGData(); feedInterval = setInterval(pushESGData, 60 * 1000);
}
function stopFeed() { if (feedInterval) clearInterval(feedInterval); feedInterval = null; }

// ============ Token & Balance ============
async function checkBalance() {
  if (!token || !signer) return alert("Not connected");
  const addr = await signer.getAddress();
  const bal = await token.balanceOf(addr);
  const balance = ethers.utils.formatUnits(bal, 18);
  document.getElementById("balanceResult").innerText = `Balance: ${balance} GRT`;
  document.getElementById("impactResult").innerText = `CO₂ Reduction: ${(balance * 0.2).toFixed(1)} tons`;
}
function resetBalance() {
  document.getElementById("balanceResult").innerText = "Balance: 0 GRT";
  document.getElementById("impactResult").innerText = "CO₂ Reduction: 0 tons";
  document.querySelectorAll(".status-item .detail").forEach(el => el.innerText = "--");
  document.querySelectorAll(".status-item .mark").forEach(el => el.innerText = "-");
}

// ============ Event Bindings ============
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectButton").onclick = connectWallet;
  document.getElementById("disconnectButton").onclick = disconnectWallet;
  document.getElementById("uploadButton").onclick = uploadReport;
  document.getElementById("checkStatus").onclick = checkStatus;
  document.getElementById("startFeed").onclick = startFeed;
  document.getElementById("stopFeed").onclick = stopFeed;
  document.getElementById("checkBalance").onclick = checkBalance;
  document.getElementById("resetBalance").onclick = resetBalance;
});
