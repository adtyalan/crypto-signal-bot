# Riwayat Perubahan Proyek: Crypto Signal Bot

Dokumen ini mencatat evolusi teknis dan strategi bot dari awal pengembangan hingga saat ini.

---

### v1.0.0 - Dasar & Render.com (Local Era)
**Timestamp:** April 2026
**Deskripsi:** Implementasi awal bot sebagai skrip Node.js tradisional yang berjalan dengan `node-cron`.
- **Infrastruktur:** Hosting di Render.com.
- **Strategi:** Simple RSI & EMA 50.
- **Notifikasi:** Telegram dasar (BUY/SELL/HOLD).
- **Penyimpanan:** File lokal `state.json` (rentan hilang saat restart server).

---

### v2.0.0 - Cloudflare & Aggressive Strategy
**Timestamp:** 11 Mei 2026, 18:30 WIB
**Deskripsi:** Migrasi besar-besaran ke arsitektur Serverless untuk meningkatkan reliabilitas dan kecepatan.
- **Infrastruktur:** Pindah ke **Cloudflare Workers**.
- **Penyimpanan:** Mengintegrasikan **MongoDB Atlas** untuk persistensi data (Stateless environment).
- **Strategi:** Scalping Agresif (EMA 9/20 Crossover + MACD + RSI > 40/60).
- **Fitur Baru:** 
  - Penanganan error 451 (Binance Geo-blocking) dengan endpoint rotasi.
  - Perhitungan SL/TP otomatis dengan Risk/Reward 1:1.5.
  - Indikator Winrate otomatis.

---

### v2.1.0 - Statistik Mendetail
**Timestamp:** 11 Mei 2026, 21:05 WIB
**Deskripsi:** Penambahan visibilitas performa pada notifikasi Telegram.
- **Update:** Menampilkan jumlah **WIN (W)** dan **LOSS (L)** secara eksplisit di sebelah winrate untuk memudahkan evaluasi saat jumlah trade masih sedikit.

---

### v3.0.0 - Multi-Timeframe Decision Support (Current)
**Timestamp:** 11 Mei 2026, 21:52 WIB
**Deskripsi:** Upgrade bot menjadi sistem pendukung keputusan (DSS) yang lebih matang untuk mengurangi noise.
- **Fitur Utama:** **Multi-Timeframe Filter (MTF)**.
- **Logika:** Sinyal eksekusi di timeframe 15m wajib dikonfirmasi oleh arah trend di timeframe 1 Jam (1H).
- **Maintenance:** Pembersihan total database (Reset Context) untuk memulai lembaran baru dengan strategi yang lebih cerdas.
