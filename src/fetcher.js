import axios from "axios";
import https from "https";



// Custom HTTPS Agent yang bypass SSL verification
// (workaround untuk ISP/firewall yang intercept SSL)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Create axios instance dengan timeout configuration
const axiosInstance = axios.create({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
  httpsAgent: httpsAgent,
});

// Retry logic dengan exponential backoff
async function fetchWithRetry(url, config, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[${new Date().toISOString()}] Attempt ${attempt}/${maxRetries}: Fetching from Binance API...`,
      );
      const res = await axiosInstance.get(url, config);
      return res;
    } catch (error) {
      lastError = error;
      console.error(
        `[${new Date().toISOString()}] Attempt ${attempt} failed [${error.code}]: ${error.message}`,
      );

      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

export async function getKlines(
  symbol = "BTCUSDT",
  interval = "15m",
  limit = 100,
) {
  const baseUrl = process.env.BINANCE_BASE_URL;
  const res = await fetchWithRetry(`${baseUrl}/api/v3/klines`, {
    params: { symbol, interval, limit },
  });

  return res.data.map((candle) => ({
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5]),
  }));
}
