// Сервер бота «ПДД»: приветствие, подписка в Telegram Stars, напоминания.
// Работает как Cloudflare Worker. Токен бота хранится только в секретах Worker, не в коде.
//
// Нужно в Settings → Variables and Secrets:
//   BOT_TOKEN       секрет, токен от @BotFather
//   WEBHOOK_SECRET  секрет, любая длинная строка из букв и цифр
// В Bindings: KV namespace с именем переменной KV.
// В Settings → Trigger Events: Cron «0 16 * * *» (19:00 по Москве) для вечерних напоминаний.
//
// Подключение бота: открыть https://<worker>/setup?key=<WEBHOOK_SECRET> (один раз и после смены кода).

const APP = 'https://rxufck.github.io/0411/';
const ORIGIN = 'https://rxufck.github.io';
const PRICE = 1; // Stars в месяц
const PERIOD = 2592000; // 30 дней, единственный период подписки в Telegram
const SILENT_AFTER_DAYS = 14;
const DAILY = `${APP}daily/`; // виджеты «Тест на сегодня», делает scripts/make-widgets.cjs

const api = (env, method, body) =>
  fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const cors = { 'access-control-allow-origin': ORIGIN, 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, OPTIONS' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...cors } });

const enc = new TextEncoder();
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
const hex = (b) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');

/** Проверяет подпись initData мини-приложения. Возвращает пользователя или null. */
async function verify(env, initData) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    const check = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n');
    const secret = await hmac(enc.encode('WebAppData'), env.BOT_TOKEN);
    if (hex(await hmac(secret, check)) !== hash) return null;
    return JSON.parse(params.get('user'));
  } catch {
    return null;
  }
}

const getUser = async (env, id) => (await env.KV.get(`u:${id}`, 'json')) ?? {};
const putUser = (env, id, data) => env.KV.put(`u:${id}`, JSON.stringify(data));

const todayUtc = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

function reminderText(u) {
  const t = todayUtc();
  if (u.exam && daysBetween(t, u.exam) >= 0 && daysBetween(t, u.exam) <= 14) {
    const n = daysBetween(t, u.exam);
    return n === 0 ? 'Сегодня экзамен. Реши пару билетов для разминки.' : `До экзамена ${n} дн. Реши сегодня несколько билетов.`;
  }
  if (u.streak > 0) return `Серия ${u.streak} дн. Загляни на пять минут, чтобы не потерять её.`;
  return 'Сегодня ещё не занимался. Реши один блок за пять минут.';
}

const openBtn = (text) => ({ inline_keyboard: [[{ text, web_app: { url: APP } }]] });

/**
 * «Тест на сегодня»: интерактивный виджет Telegram (Bot API sendWidget) с вопросом и разбором.
 * Если виджет не отправился (метод недоступен, нет клиента), уходит обычное сообщение-напоминание.
 * Ответ 403 (бот заблокирован) возвращаем как есть. С u.dbg возвращаем ответ sendWidget для отладки.
 */
async function sendToday(env, chatId, u) {
  try {
    const n = Number(await (await fetch(`${DAILY}n.txt`)).text());
    const day = Math.floor(Date.now() / 86400000) % n;
    const html = await (await fetch(`${DAILY}${day}.html`)).text();
    const me = (await (await api(env, 'getMe', {})).json()).result.username;
    const r = await api(env, 'sendWidget', { chat_id: chatId, html: html.replace('%BOT%', me), caption: reminderText(u) });
    if (r.ok || r.status === 403 || u.dbg) return r;
  } catch {
    /* виджет недоступен: ниже обычное сообщение */
  }
  return api(env, 'sendMessage', { chat_id: chatId, text: reminderText(u), reply_markup: openBtn('Открыть тренажёр') });
}

async function remind(env) {
  const t = todayUtc();
  let cursor;
  do {
    const page = await env.KV.list({ prefix: 'u:', cursor });
    cursor = page.list_complete ? undefined : page.cursor;
    for (const { name } of page.keys) {
      const id = name.slice(2);
      const u = await getUser(env, id);
      if (u.off || u.last === t || u.sent === t) continue;
      if (u.last && daysBetween(u.last, t) > SILENT_AFTER_DAYS) continue;
      const r = await sendToday(env, Number(id), u);
      if (r.status === 403) u.off = true; // человек заблокировал бота
      else u.sent = t;
      await putUser(env, id, u);
    }
  } while (cursor);
}

async function handleUpdate(env, up) {
  if (up.pre_checkout_query) {
    await api(env, 'answerPreCheckoutQuery', { pre_checkout_query_id: up.pre_checkout_query.id, ok: true });
    return;
  }
  const msg = up.message;
  if (!msg) return;
  const id = msg.from?.id;
  if (msg.successful_payment) {
    const u = await getUser(env, id);
    const exp = msg.successful_payment.subscription_expiration_date;
    u.until = (exp ? exp * 1000 : Date.now() + PERIOD * 1000);
    await putUser(env, id, u);
    await api(env, 'sendMessage', { chat_id: msg.chat.id, text: 'Спасибо! Экзамен и разбор ошибок открыты.', reply_markup: openBtn('Открыть тренажёр') });
    return;
  }
  const text = msg.text ?? '';
  if (text.startsWith('/stop')) {
    const u = await getUser(env, id);
    u.off = true;
    await putUser(env, id, u);
    await api(env, 'sendMessage', { chat_id: msg.chat.id, text: 'Напоминания отключены. Чтобы вернуть их, напиши /start.' });
  } else if (text.startsWith('/today')) {
    await sendToday(env, msg.chat.id, {});
  } else if (text.startsWith('/start')) {
    const u = await getUser(env, id);
    u.off = false;
    await putUser(env, id, u);
    const name = msg.from?.first_name ? `, ${msg.from.first_name}` : '';
    await api(env, 'sendMessage', {
      chat_id: msg.chat.id,
      text: `Привет${name}! Заходи, порешай тесты.\n\nОдин блок занимает минут пять: коротко теория и настоящие вопросы из билетов ГИБДД с подсказками. Начни с первого, а к экзамену придёшь уверенным.\n\nЕсли напоминания не нужны, напиши /stop.`,
      reply_markup: openBtn('Открыть тренажёр'),
    });
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

    if (req.method === 'GET' && url.pathname === '/setup' && url.searchParams.get('key') === env.WEBHOOK_SECRET) {
      const r = await api(env, 'setWebhook', { url: url.origin, secret_token: env.WEBHOOK_SECRET, allowed_updates: ['message', 'pre_checkout_query'] });
      return new Response(await r.text());
    }
    // Проба виджета: https://<worker>/send?key=<WEBHOOK_SECRET>&to=<id чата> возвращает ответ sendWidget.
    if (req.method === 'GET' && url.pathname === '/send' && url.searchParams.get('key') === env.WEBHOOK_SECRET) {
      const r = await sendToday(env, Number(url.searchParams.get('to')), { dbg: 1 });
      return new Response(await r.text());
    }
    if (req.method !== 'POST') return new Response('ok');

    // Запросы приложения
    if (url.pathname === '/api/status' || url.pathname === '/api/invoice') {
      const body = await req.json().catch(() => ({}));
      const user = await verify(env, body.initData ?? '');
      if (!user) return json({ error: 'auth' }, 401);
      const u = await getUser(env, user.id);
      if (url.pathname === '/api/status') {
        if (typeof body.examDate === 'string' || body.examDate === null) u.exam = body.examDate;
        if (typeof body.lastActive === 'string') u.last = body.lastActive.slice(0, 10);
        if (Number.isFinite(body.streak)) u.streak = body.streak;
        await putUser(env, user.id, u);
        return json({ until: u.until ?? 0 });
      }
      const r = await api(env, 'createInvoiceLink', {
        title: 'Подписка на месяц',
        description: 'Экзамен ГИБДД и разбор ошибок. Продлевается каждые 30 дней, отменить можно в настройках Telegram.',
        payload: 'sub',
        currency: 'XTR',
        prices: [{ label: 'Месяц', amount: PRICE }],
        subscription_period: PERIOD,
      });
      const d = await r.json();
      return d.ok ? json({ url: d.result }) : json({ error: 'invoice' }, 502);
    }

    // Обновления от Telegram
    if (req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
    await handleUpdate(env, await req.json());
    return new Response('ok');
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(remind(env));
  },
};
