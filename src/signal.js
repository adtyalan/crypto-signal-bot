export function generateSignal({ rsi, macd }) {
  if (rsi < 30 && macd.MACD > macd.signal) {
    return "BUY";
  }

  if (rsi > 70 && macd.MACD < macd.signal) {
    return "SELL";
  }

  return "HOLD";
}
