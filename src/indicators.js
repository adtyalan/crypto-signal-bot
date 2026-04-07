import { RSI, MACD } from "technicalindicators";

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

  return {
    rsi: rsi[rsi.length - 1],
    macd: macd[macd.length - 1],
  };
}
