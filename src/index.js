import { getKlines } from "./fetcher.js";
import { calculateIndicators, calculateTrend1h } from "./indicators.js";
import { generateSignal } from "./signal.js";
import { sendMessage } from "./notifier.js";
import { loadState, saveState, loadTrades, saveTrades, closeDb } from "./storage.js";
import { calculateSLTP, evaluateTrades, calculateStats } from "./tradeEngine.js";

function formatPair(symbol) {
  if (symbol.endsWith("USDT")) {
    return `${symbol.slice(0, -4)}/USDT`;
  }
  return symbol;
}

async function runBot(env) {
  try {
    const TRACKED_SYMBOLS = (env.TRACKED_SYMBOLS || "BTCUSDT")
      .split(",")
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean);

    const INTERVAL = env.SIGNAL_INTERVAL || "15m";
    const KLINE_LIMIT = Number(env.KLINE_LIMIT || 100);

    const state = await loadState(env);
    let trades = await loadTrades(env);
    
    const results = [];
    const currentPrices = {};
    const tradeNotifications = [];

    for (const symbol of TRACKED_SYMBOLS) {
      try {
        const data = await getKlines(symbol, INTERVAL, KLINE_LIMIT, env);
        const indicators = calculateIndicators(data);
        const lastClose = indicators.lastClose;
        currentPrices[symbol] = lastClose;

        // 1.5 Ambil data 1H untuk Trend Filter
        const data1h = await getKlines(symbol, "1h", 100, env);
        const trend1h = calculateTrend1h(data1h);
        const signal = generateSignal(indicators, trend1h);

        // 1. Evaluasi trade OPEN yang ada
        const { newTrades, updated, closedTrades } = evaluateTrades(trades, currentPrices);
        trades = newTrades;
        closedTrades.forEach(t => {
          const pnlSign = t.pnl >= 0 ? "+" : "";
          tradeNotifications.push(`🎯 *Trade Closed*: ${formatPair(t.symbol)}\n   • Status: ${t.status}\n   • Exit: ${lastClose}\n   • PnL: ${pnlSign}${t.pnl.toFixed(2)}%`);
        });

        // 2. Cek Sinyal Baru (Anti-Spam)
        const previousSignal = state[symbol];
        
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
          ema9: indicators.ema9,
          ema20: indicators.ema20,
          ema50: indicators.ema50,
          lastClose,
          tradePlan,
          previousSignal,
          trend1h
        });

      } catch (symbolError) {
        console.error(`Error processing ${symbol}:`, symbolError.message);
        results.push({ symbol, signal: "ERROR", error: symbolError.message });
      }
    }

    // Kalkulasi Statistik
    const stats = calculateStats(trades);
    const timestamp = new Date().toLocaleString("id-ID", { hour12: false, timeZone: "Asia/Jakarta" });

    // Build Message
    const lines = [];
    results.forEach(res => {
      if (res.signal === "ERROR") {
        lines.push(`• *${formatPair(res.symbol)}*: ❌ ERROR\n  └ ${res.error}`);
        return;
      }

      const signalEmoji = res.signal === "BUY" ? "🟢 BUY" : res.signal === "SELL" ? "🔴 SELL" : "⚪ HOLD";
      const hotEmoji = res.signal !== res.previousSignal ? "🔥" : "";
      
      lines.push(`• *${formatPair(res.symbol)}*: ${signalEmoji} ${hotEmoji}`);
      lines.push(`  ├ Trend 1H: ${res.trend1h === "BULLISH" ? "📈" : "📉"} ${res.trend1h}`);
      lines.push(`  ├ RSI: ${res.rsi.toFixed(2)}`);
      lines.push(`  ├ EMA: 9(${res.ema9.toFixed(0)}), 20(${res.ema20.toFixed(0)}), 50(${res.ema50.toFixed(0)})`);
      
      if (res.tradePlan) {
        lines.push(`  └ *Plan*: Ent(${res.tradePlan.entry.toFixed(2)}), SL(${res.tradePlan.sl.toFixed(2)}), TP(${res.tradePlan.tp.toFixed(2)}) [RR ${res.tradePlan.rr}]`);
      }
    });

    const pnlSign = stats.pnl >= 0 ? "+" : "";
    const finalMessage = [
      `🚀 *Crypto Signal V2 (${INTERVAL})*`,
      `📅 ${timestamp} WIB`,
      `📊 Winrate: *${stats.rate.toFixed(2)}%* (${stats.wins}W - ${stats.losses}L)`,
      `💰 Total PnL: *${pnlSign}${stats.pnl.toFixed(2)}%*`,
      "",
      ...tradeNotifications,
      tradeNotifications.length > 0 ? "" : null,
      "🔍 *Status Market*:",
      ...lines,
    ].filter(l => l !== null).join("\n");

    console.log(finalMessage);
    
    const hasChange = results.some(r => r.signal !== r.previousSignal) || tradeNotifications.length > 0;
    
    if (hasChange) {
      await sendMessage(finalMessage, env);
    }

    // Save Persistensi
    await saveState(state, env);
    await saveTrades(trades, env);

    // Close DB to prevent hanging
    await closeDb();

  } catch (err) {
    console.error("Error in runBot loop:", err);
    await closeDb();
  }
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runBot(env));
  },
  // Optional: untuk testing via HTTP request
  async fetch(request, env, ctx) {
    await runBot(env);
    return new Response("Bot executed successfully!");
  }
};
