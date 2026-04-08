import dotenv from "dotenv";
import cron from "node-cron";
import { getKlines } from "./fetcher.js";
import { calculateIndicators } from "./indicators.js";
import { generateSignal } from "./signal.js";
import { sendMessage } from "./notifier.js";
import { loadState, saveState, loadTrades, saveTrades } from "./storage.js";
import { calculateSLTP, evaluateTrades, calculateWinrate } from "./tradeEngine.js";

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

async function runBot() {
  try {
    const state = await loadState();
    let trades = await loadTrades();
    
    const results = [];
    const currentPrices = {};
    const tradeNotifications = [];

    for (const symbol of TRACKED_SYMBOLS) {
      try {
        const data = await getKlines(symbol, INTERVAL, KLINE_LIMIT);
        const indicators = calculateIndicators(data);
        const signal = generateSignal(indicators);
        const lastClose = indicators.lastClose;
        currentPrices[symbol] = lastClose;

        // 1. Evaluasi trade OPEN yang ada
        const { newTrades, updated, closedTrades } = evaluateTrades(trades, currentPrices);
        trades = newTrades;
        closedTrades.forEach(t => {
          tradeNotifications.push(`🎯 Trade Closed: ${formatPair(t.symbol)} | Status: ${t.status} | Exit: ${lastClose}`);
        });

        // 2. Cek Sinyal Baru (Anti-Spam)
        const previousSignal = state[symbol]; // undefined pada run pertama
        
        let tradePlan = null;
        if (signal !== previousSignal) {
          state[symbol] = signal;
          
          if (signal === "BUY" || signal === "SELL") {
            tradePlan = calculateSLTP(symbol, signal, indicators);
            trades.push({
              id: Date.now().toString(),
              symbol,
              signal,
              ...tradePlan,
              status: "OPEN",
              timestamp: Date.now()
            });
          }
        }

        results.push({
          symbol,
          signal,
          rsi: indicators.rsi,
          macd: indicators.macd.MACD,
          ema50: indicators.ema50,
          lastClose,
          tradePlan,
          previousSignal
        });

      } catch (symbolError) {
        console.error(`Error processing ${symbol}:`, symbolError.message);
        results.push({ symbol, signal: "ERROR", error: symbolError.message });
      }
    }

    // Kalkulasi Winrate
    const winrate = calculateWinrate(trades);
    const timestamp = new Date().toLocaleString("id-ID", { hour12: false, timeZone: "Asia/Jakarta" });

    // Build Message
    const lines = [];
    results.forEach(res => {
      if (res.signal === "ERROR") {
        lines.push(`${formatPair(res.symbol)}: ERROR | ${res.error}`);
        return;
      }

      const signalLine = `${formatPair(res.symbol)}: ${res.signal} ${res.signal !== res.previousSignal ? "🔥" : ""}`;
      lines.push(`${signalLine} | RSI ${res.rsi.toFixed(2)} | EMA50 ${res.ema50.toFixed(1)}`);
      
      if (res.tradePlan) {
        lines.push(`   📍 Entry: ${res.tradePlan.entry} | SL: ${res.tradePlan.sl.toFixed(2)} | TP: ${res.tradePlan.tp.toFixed(2)} | RR: ${res.tradePlan.rr}`);
      }
    });

    const finalMessage = [
      `🚀 Crypto Signal V2 (${INTERVAL})`,
      `Waktu: ${timestamp} WIB`,
      `Winrate Keseluruhan: ${winrate.toFixed(2)}%`,
      "",
      ...tradeNotifications,
      tradeNotifications.length > 0 ? "" : null,
      "--- Status Market ---",
      ...lines,
    ].filter(l => l !== null).join("\n");

    console.log(finalMessage);
    
    // Kirim notifikasi jika ada sinyal baru atau trade yang closed
    const hasChange = results.some(r => r.signal !== r.previousSignal) || tradeNotifications.length > 0;
    
    if (hasChange) {
      await sendMessage(finalMessage);
    }

    // Save Persistensi
    await saveState(state);
    await saveTrades(trades);

  } catch (err) {
    console.error("Error in runBot loop:", err);
  }
}

// tiap 15 menit
cron.schedule("*/15 * * * *", runBot);

// run sekali saat start
runBot();
