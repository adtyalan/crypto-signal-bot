export function generateSignal({ rsi, macd, ema9, ema20, lastClose }) {
  // ULTRA AGGRESSIVE BUY: EMA9 > EMA20 + MACD Histogram Positif + RSI Momentum
  const isEmaBullish = ema9 > ema20;
  const isMacdBullish = macd.MACD > macd.signal;
  const isRsiBullish = rsi > 40;

  if (isEmaBullish && isMacdBullish && isRsiBullish) {
    return "BUY";
  }

  // ULTRA AGGRESSIVE SELL: EMA9 < EMA20 + MACD Histogram Negatif + RSI Momentum
  const isEmaBearish = ema9 < ema20;
  const isMacdBearish = macd.MACD < macd.signal;
  const isRsiBearish = rsi < 60;

  if (isEmaBearish && isMacdBearish && isRsiBearish) {
    return "SELL";
  }

  return "HOLD";
}

