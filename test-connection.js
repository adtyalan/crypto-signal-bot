import https from "https";

const options = {
  hostname: "api.binance.com",
  port: 443,
  path: "/api/v3/klines?symbol=BTCUSDT&interval=15m&limit=1",
  method: "GET",
};

const req = https.request(options, (res) => {
  console.log("✅ Connection successful!");
  console.log("Status Code:", res.statusCode);
  console.log("Headers:", res.headers);
});

req.on("error", (error) => {
  console.error("❌ Connection error:");
  console.error("Code:", error.code);
  console.error("Message:", error.message);
  console.error("\nFull error:", error);
});

req.end();
