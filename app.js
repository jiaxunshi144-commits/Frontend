// ============ Contract Config ============
const GOVERNANCE_ADDR = "0x4b73515d2DfEfd5aaaDA2286227A2cBC6DbB903e";
const TOKEN_ADDR      = "0x3B7b8dF8f95166a919Ec4C252Ca71a06561DDF98";

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
let feedInterval = null;

// ============ Utils ============
function toBytes32FromString(str) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
}
function randomESGData() {
  return {
    carbon: (Math.random() * 100).toFixed(2),
    energy: (Math.random() * 500).toFixed(2),
    water: (Math.random() * 50).toFixed(2),
    ts: new Date().toISOString()
  };
}
function toBytes32FromData(obj) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify(obj)));
}
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
  document.getElementById("dataFeed").innerText = "[No data yet]";
  document.getElementById("uploadResult").innerText = "";
  document.getElementById("statusResult").innerText = "";
  document.getElementById("balanceResult").innerText = "Balance: 0 GRT";
  document.getElementById("impactResult").innerText = "CO₂ Reduction: 0 tons";
  updateFinanceUI(0);
}

// ============ IoT Feed ============
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
  } catch (err) {
    console.error("Upload failed:", err);
  }
}
function startFeed() {
  if (feedInterval) return;
  pushESGData();
  feedInterval = setInterval(pushESGData, 60 * 1000);
}
function stopFeed() {
  if (feedInterval) clearInterval(feedInterval);
  feedInterval = null;
}

// ============ Enterprise Actions ============
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
  } catch (err) {
    document.getElementById("uploadResult").innerText = `❌ Upload failed: ${err.message}`;
  }
}
async function checkStatus() {
  const hash = document.getElementById("statusHash").value;
  if (!hash) return alert("Enter a file hash!");
  try {
    const status = await governance.getReportStatus(hash);
    document.getElementById("statusResult").innerText = JSON.stringify(status, null, 2);
  } catch (err) {
    document.getElementById("statusResult").innerText = `❌ Query failed: ${err.message}`;
  }
}

// ============ Balance & Finance ============
async function checkBalance() {
  if (!token || !signer) return alert("Not connected");
  const addr = await signer.getAddress();
  const bal = await token.balanceOf(addr);
  const parsed = parseFloat(ethers.utils.formatUnits(bal, 18));
  document.getElementById("balanceResult").innerText = `Balance: ${parsed} GRT`;
  document.getElementById("impactResult").innerText = `CO₂ Reduction: ${(parsed * 0.2).toFixed(1)} tons`;
  updateFinanceUI(parsed);
}
function resetBalance() {
  document.getElementById("balanceResult").innerText = "Balance: 0 GRT";
  document.getElementById("impactResult").innerText = "CO₂ Reduction: 0 tons";
  updateFinanceUI(0);
}

// ============ Finance UI with Levels ============
function updateFinanceUI(balance) {
  // Loan
  if (balance >= 200) setStatus("loanStatus", "✅", "Up to S$5M, -0.3% rate");
  else if (balance >= 100) setStatus("loanStatus", "✅", "Up to S$2M, -0.2% rate");
  else if (balance >= 50) setStatus("loanStatus", "⚡", "Up to S$1M, -0.1% rate");
  else setStatus("loanStatus", "❌", "Not eligible");

  // Bond
  if (balance >= 200) setStatus("bondStatus", "✅", "Coupon reduced by 0.2%");
  else if (balance >= 100) setStatus("bondStatus", "⚡", "Pilot eligible, coupon -0.1%");
  else setStatus("bondStatus", "❌", "Not eligible");

  // Carbon Credits
  let credits = (balance * 0.2).toFixed(1);
  let value = (credits * 5).toFixed(0);
  if (balance >= 1) setStatus("carbonStatus", "✅", `${credits} credits (~USD ${value})`);
  else setStatus("carbonStatus", "❌", "Not eligible");

  // Insurance
  if (balance >= 200) setStatus("insuranceStatus", "✅", "Premium discount 8%");
  else if (balance >= 100) setStatus("insuranceStatus", "✅", "Premium discount 5%");
  else setStatus("insuranceStatus", "❌", "Not eligible");

  // Supply Chain Finance
  if (balance >= 200) setStatus("scfStatus", "✅", "Discount rate -0.3%");
  else if (balance >= 50) setStatus("scfStatus", "✅", "Discount rate -0.2%");
  else setStatus("scfStatus", "❌", "Not eligible");
}
function setStatus(id, mark, detail) {
  document.querySelector(`#${id} .mark`).innerText = mark;
  document.querySelector(`#${id} .detail`).innerText = detail;
}

// ============ Bindings ============
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectButton").onclick = connectWallet;
  document.getElementById("disconnectButton").onclick = disconnectWallet;
  document.getElementById("startFeed").onclick = startFeed;
  document.getElementById("stopFeed").onclick = stopFeed;
  document.getElementById("uploadButton").onclick = uploadReport;
  document.getElementById("checkStatus").onclick = checkStatus;
  document.getElementById("checkBalance").onclick = checkBalance;
  document.getElementById("resetBalance").onclick = resetBalance;
});
