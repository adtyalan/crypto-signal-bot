export function calculateSLTP(symbol, signal, indicators) {
  const { lastClose, data } = indicators;
  // Ambil 10 candle terakhir untuk cari high/low
  const recentCandles = data.slice(-10);
  
  let sl, tp;
  const riskReward = 2;

  if (signal === "BUY") {
    // SL = Low terendah dari 10 candle terakhir
    const low = Math.min(...recentCandles.map(c => c.low));
    sl = low * 0.998; // Buffer 0.2%
    const risk = lastClose - sl;
    tp = lastClose + (risk * riskReward);
  } else if (signal === "SELL") {
    // SL = High tertinggi dari 10 candle terakhir
    const high = Math.max(...recentCandles.map(c => c.high));
    sl = high * 1.002; // Buffer 0.2%
    const risk = sl - lastClose;
    tp = lastClose - (risk * riskReward);
  }

  return { entry: lastClose, sl, tp, rr: riskReward };
}

export function evaluateTrades(trades, currentPrices) {
  let updated = false;
  const closedTrades = [];

  const newTrades = trades.map(trade => {
    if (trade.status !== "OPEN") return trade;

    const currentPrice = currentPrices[trade.symbol];
    if (!currentPrice) return trade;

    if (trade.signal === "BUY") {
      if (currentPrice >= trade.tp) {
        trade.status = "WIN";
        updated = true;
        closedTrades.push(trade);
      } else if (currentPrice <= trade.sl) {
        trade.status = "LOSS";
        updated = true;
        closedTrades.push(trade);
      }
    } else if (trade.signal === "SELL") {
      if (currentPrice <= trade.tp) {
        trade.status = "WIN";
        updated = true;
        closedTrades.push(trade);
      } else if (currentPrice >= trade.sl) {
        trade.status = "LOSS";
        updated = true;
        closedTrades.push(trade);
      }
    }

    return trade;
  });

  return { newTrades, updated, closedTrades };
}

export function calculateWinrate(trades) {
  const closed = trades.filter(t => t.status === "WIN" || t.status === "LOSS");
  if (closed.length === 0) return 0;
  const wins = closed.filter(t => t.status === "WIN").length;
  return (wins / closed.length) * 100;
}
