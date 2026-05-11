// Helper function for fetch with retry and exponential backoff
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[${new Date().toISOString()}] Attempt ${attempt}/${maxRetries}: Fetching from Binance API...`,
      );
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      console.error(
        `[${new Date().toISOString()}] Attempt ${attempt} failed: ${error.message}`,
      );

      if (attempt < maxRetries) {
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
  env
) {
  const endpoints = [
    env?.BINANCE_BASE_URL || "https://api.binance.com",
    "https://api1.binance.com",
    "https://api2.binance.com",
    "https://api3.binance.com",
    "https://data-api.binance.vision"
  ];

  let lastError;
  const params = new URLSearchParams({ symbol, interval, limit: limit.toString() });

  for (const baseUrl of endpoints) {
    try {
      const url = `${baseUrl}/api/v3/klines?${params.toString()}`;
      const data = await fetchWithRetry(url);
      
      return data.map((candle) => ({
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
      }));
    } catch (error) {
      lastError = error;
      // Jika error 451, coba endpoint berikutnya segera
      if (error.message.includes("status: 451")) {
        console.warn(`⚠️ Endpoint ${baseUrl} diblokir (451). Mencoba endpoint alternatif...`);
        continue;
      }
      // Jika error lain (misal timeout), tetap throw atau lanjut sesuai retry logic di fetchWithRetry
      throw error;
    }
  }

  throw lastError;
}
