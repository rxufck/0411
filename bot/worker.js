// Бот-приветствие: отвечает на /start и зовёт в мини-приложение.
// Работает как Cloudflare Worker. Токен бота хранится только в секретах Worker, не в коде.
//
// Переменные (Settings → Variables and Secrets):
//   BOT_TOKEN       секрет, токен от @BotFather
//   WEBHOOK_SECRET  секрет, любая длинная случайная строка
//   APP_URL         адрес приложения, например https://silly-daifuku-f3831e.netlify.app

const send = (env, chatId, text, extra = {}) =>
  fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, ...extra }),
  });

export default {
  async fetch(req, env) {
    if (req.method !== 'POST') return new Response('ok');
    // Принимаем запросы только от Telegram: он подставляет секрет, который мы задали в setWebhook.
    if (req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });

    const update = await req.json();
    const msg = update.message;
    if (msg?.text?.startsWith('/start')) {
      const name = msg.from?.first_name ? `, ${msg.from.first_name}` : '';
      await send(
        env,
        msg.chat.id,
        `Привет${name}! Заходи, порешай тесты.\n\nОдин блок занимает минут пять: коротко теория и настоящие вопросы из билетов ГИБДД с подсказками. Начни с первого, а к экзамену придёшь уверенным.`,
        { reply_markup: { inline_keyboard: [[{ text: 'Открыть тренажёр', web_app: { url: env.APP_URL } }]] } },
      );
    }
    return new Response('ok');
  },
};
