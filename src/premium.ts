// Подписка в Telegram Stars. Статус хранит сервер бота; здесь только запрос и кэш.
import { useSyncExternalStore } from 'react';
import { initData, inTelegram, openInvoice } from './telegram';

const SERVER = 'https://pdd-bot.r4ufism.workers.dev';
const CACHE = 'pdd-premium-until';

export const PRICE_STARS = 150;

interface State {
  until: number;
  busy: boolean;
  error: string;
}

const readCache = () => {
  try {
    return Number(localStorage.getItem(CACHE) ?? 0);
  } catch {
    return 0;
  }
};

let state: State = { until: readCache(), busy: false, error: '' };
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  if (patch.until !== undefined) {
    try {
      localStorage.setItem(CACHE, String(patch.until));
    } catch {
      /* кэш необязателен */
    }
  }
  listeners.forEach((l) => l());
}

async function post(path: string, body: Record<string, unknown>) {
  const r = await fetch(SERVER + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ initData: initData(), ...body }),
  });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

/** Сообщает серверу дату экзамена и последнее занятие (для напоминаний) и узнаёт статус подписки. */
export async function syncStatus(info: { examDate: string | null; lastActive: string | null; streak: number }) {
  if (!inTelegram()) return;
  try {
    const d = await post('/api/status', info);
    set({ until: Number(d.until) || 0 });
  } catch {
    /* без сети остаёмся на последнем известном статусе */
  }
}

export async function subscribe() {
  if (!inTelegram() || state.busy) return;
  set({ busy: true, error: '' });
  try {
    const { url } = await post('/api/invoice', {});
    const status = await openInvoice(url);
    if (status === 'paid') {
      // Платёж доходит до сервера через бота за секунды: спрашиваем несколько раз.
      for (let i = 0; i < 8 && state.until < Date.now(); i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const d = await post('/api/status', {});
        set({ until: Number(d.until) || 0 });
      }
    } else if (status === 'failed') set({ error: 'Оплата не прошла. Попробуй ещё раз.' });
  } catch {
    set({ error: 'Не получилось открыть оплату. Проверь интернет и попробуй ещё раз.' });
  } finally {
    set({ busy: false });
  }
}

/** Вне Telegram всё открыто. Внутри: нужна действующая подписка. */
export function usePremium() {
  const s = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
  const active = !inTelegram() || s.until > Date.now();
  return { active, until: s.until, busy: s.busy, error: s.error };
}
