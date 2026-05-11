# Dokumentasi Sistem: Crypto Signal Bot (Cloudflare Workers Edition)

Dokumen ini merinci teknis implementasi dan panduan operasional bot sinyal crypto yang berjalan di infrastruktur **Cloudflare Workers**.

---

## 1. Arsitektur & Teknologi
Bot ini telah dimigrasikan dari Node.js tradisional (Render.com) ke arsitektur **Serverless** untuk efisiensi biaya dan performa di edge.

*   **Runtime:** Cloudflare Workers (dengan `nodejs_compat_v2`).
*   **Database:** MongoDB Atlas (Persistensi State & Trade).
*   **Trigger:** Cloudflare Cron Triggers (setiap 15 menit).
*   **Notifikasi:** Telegram Bot API.
*   **Data Source:** Binance Public API.

---

## 2. Struktur Modul
*   `src/index.js`: Entry point utama dengan handler `scheduled` (untuk cron) dan `fetch` (untuk trigger manual via URL).
*   `src/fetcher.js`: Mengambil data K-line menggunakan native `fetch` API.
*   `src/indicators.js`: Menghitung indikator teknis (RSI, MACD, EMA 50).
*   `src/signal.js`: Logika pengambilan keputusan sinyal (BUY/SELL/HOLD).
*   `src/storage.js`: Manajemen koneksi MongoDB Atlas (Singleton pattern dengan penanganan close connection).
*   `src/tradeEngine.js`: Perhitungan SL/TP (RR 1:1.5), evaluasi trade OPEN, dan kalkulasi winrate.
*   `src/notifier.js`: Pengiriman notifikasi ke Telegram menggunakan native `fetch`.

---

## 3. Layer Persistensi (MongoDB)
Data disimpan secara terpusat di MongoDB Atlas agar status bot tetap terjaga meskipun dijalankan dalam environment stateless (serverless).

### Koleksi `states`
Menyimpan sinyal terakhir per simbol untuk mencegah spam notifikasi.
- **Fields:** `symbol`, `signal`, `updatedAt`

### Koleksi `trades`
Menyimpan riwayat trade untuk pelacakan performa.
- **Fields:** `id`, `symbol`, `signal`, `entry`, `sl`, `tp`, `rr`, `status`, `timestamp`

---

## 4. Panduan Manajemen Trading Pair
Pada versi Cloudflare, konfigurasi dilakukan melalui file `wrangler.toml` dan Cloudflare Secrets.

### Cara Mengubah Pair
1.  Buka file `wrangler.toml` di root project.
2.  Cari bagian `[vars]` dan ubah nilai `TRACKED_SYMBOLS`.
    *   *Contoh:* `TRACKED_SYMBOLS = "BTCUSDT,ETHUSDT,SOLUSDT"`
3.  Simpan file dan jalankan perintah deploy:
    ```bash
    npm run deploy
    ```

### Dampak Perubahan Pair
| Aksi | Efek pada Aplikasi | Efek pada MongoDB |
| :--- | :--- | :--- |
| **Tambah Pair** | Bot mulai memantau pair baru di siklus 15 menit berikutnya. | Menambah dokumen baru di koleksi `states`. |
| **Hapus/Ganti Pair** | Bot berhenti mengambil data untuk pair lama. | **PENTING:** Jika ada trade `OPEN` pada pair yang dihapus, trade tersebut akan "nyangkut" (tidak akan pernah TP/SL karena harganya tidak dipantau lagi). |

---

## 5. Operasional & Troubleshooting

### Melihat Log (Real-time)
Gunakan Wrangler CLI untuk memantau aktivitas bot yang sedang berjalan di Cloudflare:
```bash
npx wrangler tail
```

### Mengelola Variabel Sensitif (Secrets)
Jika perlu mengubah Token Telegram atau URI MongoDB, gunakan perintah berikut:
```bash
echo "NILAI_BARU" | npx wrangler secret put NAMA_VARIABLE
```
*Daftar Secret:* `MONGO_URI`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

### Penanganan Trade "Nyangkut"
Jika kamu menghapus pair saat masih ada trade OPEN:
1.  Buka **MongoDB Atlas**.
2.  Cari koleksi `trades`.
3.  Ubah manual status trade tersebut dari `OPEN` menjadi `CANCELLED` agar winrate tetap akurat.

---

## 6. Algoritma Keputusan (Day Trading Aggressive)
Bot menggunakan strategi momentum berbasis crossover EMA dengan konfirmasi MACD dan RSI untuk frekuensi sinyal tinggi.

*   **Logic BUY:** `EMA 9 > EMA 20` AND `MACD > Signal` AND `RSI > 40`.
*   **Logic SELL:** `EMA 9 < EMA 20` AND `MACD < Signal` AND `RSI < 60`.
*   **Anti-Spam:** Notifikasi hanya dikirim jika ada perubahan status sinyal atau ada trade yang tertutup.
*   **Risk Management (Scalping):**
    *   **Stop Loss (SL):** Dihitung dari Low/High terdekat (5 candle terakhir) dengan buffer 0.1%.
    *   **Take Profit (TP):** Menggunakan rasio keuntungan (RR) **1:1.5** dari risiko untuk memastikan target lebih cepat tercapai di market yang volatile.

---

## 7. Sistem Pelaporan (Performance Tracking)
Bot memiliki sistem pelaporan otomatis yang matang untuk mempermudah evaluasi strategi:

### Metrik Performa
- **Winrate:** Rasio kemenangan terhadap total trade tertutup.
- **W/L Count:** Visualisasi eksplisit jumlah trade yang menyentuh TP (W) dan SL (L).
- **Total PnL:** Akumulasi profit/loss dalam persentase (%). Kalkulasi didasarkan pada selisih harga entry dan exit.

### Format Laporan (Telegram)
Laporan dikirimkan dalam format yang rapi menggunakan bullet points beranak:
- **Header:** Ringkasan statistik global dan timestamp.
- **Trade Notification:** Notifikasi instan saat trade berpindah status dari OPEN ke WIN/LOSS.
- **Market Status:** Pohon status per simbol yang dipantau (Indikator, Trend 1H, dan Rencana Trading).

