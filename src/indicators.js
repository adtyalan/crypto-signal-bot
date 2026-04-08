import { RSI, MACD, EMA } from "technicalindicators";

export function calculateIndicators(data) {
  const closes = data.map((d) => d.close);

  const rsi = RSI.calculate({
    values: closes,
    period: 14,
  });

  const macd = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
  });

  const ema50 = EMA.calculate({
    values: closes,
    period: 50,
  });

  return {
    rsi: rsi[rsi.length - 1],
    macd: macd[macd.length - 1],
    ema50: ema50[ema50.length - 1],
    lastClose: closes[closes.length - 1],
    data: data, // Keep full data for SL/TP calculation
  };
}
