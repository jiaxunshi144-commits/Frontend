// ============ Contract Config ============
const GOVERNANCE_ADDR = "0xcc288c7cbfb3b69968dc248cd043bd548fc1af01"; // governance
const TOKEN_ADDR = "0x4d92958296787c267b84428d7f415d9ae9781898";   // token

const GOVERNANCE_ABI = [
  "function registerContent(bytes32 hash) public",
  "event ReportRegistered(bytes32 indexed contentHash, address indexed sender, uint256 timestamp)"
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

// ============ Core ============
async function connectWallet() {
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
  document.getElementById("balanceResult").innerText = "Balance: 0 GRT";
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
  } catch (err) {
    console.error("Upload failed:", err);
  }
}

function startFeed() {
  if (feedInterval) return;
  pushESGData(); // immediate
  feedInterval = setInterval(pushESGData, 60 * 1000); // every 1 min
}

function stopFeed() {
  if (feedInterval) clearInterval(feedInterval);
  feedInterval = null;
}

async function checkBalance() {
  if (!token || !signer) return alert("Not connected");
  const addr = await signer.getAddress();
  const bal = await token.balanceOf(addr);
  document.getElementById("balanceResult").innerText =
    `Balance: ${ethers.utils.formatUnits(bal, 18)} GRT`;
}

// ============ Bindings ============
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectButton").onclick = connectWallet;
  document.getElementById("disconnectButton").onclick = disconnectWallet;
  document.getElementById("startFeed").onclick = startFeed;
  document.getElementById("stopFeed").onclick = stopFeed;
  document.getElementById("checkBalance").onclick = checkBalance;
});
