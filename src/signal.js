export function generateSignal({ rsi, macd, ema50, lastClose }) {
  // BUY: RSI < 30 + MACD Cross + Price above EMA50
  if (rsi < 30 && macd.MACD > macd.signal && lastClose > ema50) {
    return "BUY";
  }

  // SELL: RSI > 70 + MACD Cross + Price below EMA50
  if (rsi > 70 && macd.MACD < macd.signal && lastClose < ema50) {
    return "SELL";
  }

  return "HOLD";
}
