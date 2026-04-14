# Dokumentasi Teknis (V2): Crypto Signal Bot

Dokumen ini merinci teknis implementasi sistem pendukung keputusan trading yang memiliki kesadaran status (state-aware) dan pelacakan performa.

## 1. Stack & Alur (V2)
Bot kini beroperasi sebagai **Trading Decision Support System** yang menyimpan history dan mengevaluasi hasil trade.

## 2. Struktur Modul Baru
*   `src/index.js`: Orkestrator utama.
*   `src/fetcher.js`: Pengambil data API.
*   `src/indicators.js`: Penghitung RSI, MACD, dan **EMA 50**.
*   `src/signal.js`: Keputusan BUY/SELL dengan **Trend Filter**.
*   `src/storage.js`: (Baru) Manajemen database MongoDB untuk status dan riwayat trade.
*   `src/tradeEngine.js`: (Baru) Penghitung SL/TP, evaluasi WIN/LOSS, dan kalkulasi winrate.

## 3. Layer Persistensi Data
Sistem menggunakan **MongoDB** untuk menyimpan data secara persisten, memungkinkan skalabilitas dan integritas data yang lebih baik dibandingkan file lokal.

### Koleksi `states`
Menyimpan sinyal terakhir per simbol untuk mencegah spam notifikasi.
- **Fields:** `symbol`, `signal`, `updatedAt`

### Koleksi `trades`
Menyimpan riwayat dan status trade untuk evaluasi performa.
- **Fields:** `id`, `symbol`, `signal`, `entry`, `sl`, `tp`, `rr`, `status`, `timestamp`, `createdAt`, `updatedAt`

## 4. Algoritma & Logika Diperbarui

### Trend Filter (EMA 50)
Harga penutupan terakhir harus berada di atas EMA 50 untuk konfirmasi **BUY**, dan di bawah EMA 50 untuk **SELL**.

### Manajemen Risiko (SL/TP)
*   **SL (Stop Loss):** Dihitung berdasarkan harga terendah/tertinggi baru-baru ini (*recent low/high*).
*   **TP (Take Profit):** Dihitung dengan rasio minimal 1:2 dari resiko (RR 1:2).

### Anti-Spam (State Tracking)
Notifikasi hanya dikirim jika `Sinyal Baru !== Sinyal Sebelumnya`.

## 5. Evaluasi & Performa
Setiap siklus (15 menit), bot akan:
1.  Memeriksa semua trade dengan status `OPEN`.
2.  Bandingkan harga terkini dengan SL dan TP.
3.  Update status menjadi `WIN` atau `LOSS`.
4.  Hitung `Winrate = Total Win / Total Closed Trades`.

---
## 6. Backtesting Mode (Rencana Kedepan)
Implementasi flag `MODE=backtest` untuk menjalankan simulasi pada data historis dan menghasilkan laporan performa tanpa mengirim notifikasi asli.
