import fs from "fs/promises";
import path from "path";

const STATE_FILE = path.join(process.cwd(), "state.json");
const TRADES_FILE = path.join(process.cwd(), "trades.json");

async function ensureFile(filePath, defaultContent) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2));
  }
}

export async function loadState() {
  await ensureFile(STATE_FILE, {});
  const data = await fs.readFile(STATE_FILE, "utf-8");
  return JSON.parse(data);
}

export async function saveState(state) {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

export async function loadTrades() {
  await ensureFile(TRADES_FILE, []);
  const data = await fs.readFile(TRADES_FILE, "utf-8");
  return JSON.parse(data);
}

export async function saveTrades(trades) {
  await fs.writeFile(TRADES_FILE, JSON.stringify(trades, null, 2));
}
