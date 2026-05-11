export function generateSignal({ rsi, macd, ema9, ema20, lastClose }, trend1h) {
  // ULTRA AGGRESSIVE BUY: EMA9 > EMA20 + MACD Histogram Positif + RSI Momentum
  // + FILTER: Trend 1H wajib BULLISH
  const isEmaBullish = ema9 > ema20;
  const isMacdBullish = macd.MACD > macd.signal;
  const isRsiBullish = rsi > 40;

  if (isEmaBullish && isMacdBullish && isRsiBullish && trend1h === "BULLISH") {
    return "BUY";
  }

  // ULTRA AGGRESSIVE SELL: EMA9 < EMA20 + MACD Histogram Negatif + RSI Momentum
  // + FILTER: Trend 1H wajib BEARISH
  const isEmaBearish = ema9 < ema20;
  const isMacdBearish = macd.MACD < macd.signal;
  const isRsiBearish = rsi < 60;

  if (isEmaBearish && isMacdBearish && isRsiBearish && trend1h === "BEARISH") {
    return "SELL";
  }

  return "HOLD";
}

