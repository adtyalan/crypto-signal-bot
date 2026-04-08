import axios from "axios";

export async function sendMessage(text) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.warn("⚠️ Telegram Token atau Chat ID tidak ditemukan di .env");
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    await axios.post(url, {
      chat_id: chatId,
      text,
    });
  } catch (error) {
    console.error("❌ Gagal mengirim pesan ke Telegram:", error.response?.data?.description || error.message);
  }
}
