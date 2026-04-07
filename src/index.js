import dotenv from "dotenv";
import cron from "node-cron";
import { getKlines } from "./fetcher.js";
import { calculateIndicators } from "./indicators.js";
import { generateSignal } from "./signal.js";
import { sendMessage } from "./notifier.js";

dotenv.config({ override: true });

const TRACKED_SYMBOLS = (process.env.TRACKED_SYMBOLS || "BTCUSDT")
  .split(",")
  .map((symbol) => symbol.trim().toUpperCase())
  .filter(Boolean);

const INTERVAL = process.env.SIGNAL_INTERVAL || "15m";
const KLINE_LIMIT = Number(process.env.KLINE_LIMIT || 100);

function formatPair(symbol) {
  if (symbol.endsWith("USDT")) {
    return `${symbol.slice(0, -4)}/USDT`;
  }
  return symbol;
}

function formatSignalLine(result) {
  return [
    `${formatPair(result.symbol)}: ${result.signal}`,
    `RSI ${result.rsi.toFixed(2)}`,
    `MACD ${result.macd.toFixed(3)}/${result.macdSignal.toFixed(3)}`,
  ].join(" | ");
}

async function runBot() {
  try {
    const results = [];
    let buyCount = 0;
    let sellCount = 0;
    let holdCount = 0;

    for (const symbol of TRACKED_SYMBOLS) {
      try {
        const data = await getKlines(symbol, INTERVAL, KLINE_LIMIT);
        const indicators = calculateIndicators(data);
        const signal = generateSignal(indicators);

        if (signal === "BUY") buyCount += 1;
        if (signal === "SELL") sellCount += 1;
        if (signal === "HOLD") holdCount += 1;

        results.push({
          symbol,
          signal,
          rsi: indicators.rsi,
          macd: indicators.macd.MACD,
          macdSignal: indicators.macd.signal,
        });
      } catch (symbolError) {
        results.push({
          symbol,
          signal: "ERROR",
          error: symbolError.message,
        });
      }
    }

    const timestamp = new Date().toLocaleString("id-ID", {
      hour12: false,
      timeZone: "Asia/Jakarta",
    });

    const lines = results.map((result) => {
      if (result.signal === "ERROR") {
        return `${formatPair(result.symbol)}: ERROR | ${result.error}`;
      }
      return formatSignalLine(result);
    });

    const message = [
      `Crypto Signal Update (${INTERVAL})`,
      `Waktu: ${timestamp} WIB`,
      `Ringkasan: BUY ${buyCount} | SELL ${sellCount} | HOLD ${holdCount}`,
      "",
      ...lines,
    ].join("\n");

    console.log(message);
    await sendMessage(message);
  } catch (err) {
    console.error("Error in runBot:", {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      url: err.config?.url,
    });
  }
}

// tiap 15 menit
cron.schedule("*/15 * * * *", runBot);

// run sekali saat start
runBot();
