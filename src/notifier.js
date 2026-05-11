export async function sendMessage(text, env) {
  try {
    const token = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.warn("⚠️ Telegram Token atau Chat ID tidak ditemukan di environment variables");
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.description || "Gagal mengirim pesan");
    }
  } catch (error) {
    console.error("❌ Gagal mengirim pesan ke Telegram:", error.message);
  }
}
