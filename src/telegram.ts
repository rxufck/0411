// Мини-приложение Telegram. Вне Telegram всё здесь тихо ничего не делает.

interface TgUser {
  id: number;
  first_name?: string;
}

interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: TgUser };
  ready(): void;
  expand(): void;
  close(): void;
  disableVerticalSwipes?(): void;
  setHeaderColor?(c: string): void;
  setBackgroundColor?(c: string): void;
  setBottomBarColor?(c: string): void;
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  };
  BackButton?: { show(): void; hide(): void; onClick(cb: () => void): void; offClick(cb: () => void): void };
  CloudStorage?: {
    setItem(k: string, v: string, cb?: (err: unknown) => void): void;
    getItem(k: string, cb: (err: unknown, v?: string) => void): void;
    getItems(ks: string[], cb: (err: unknown, v?: Record<string, string>) => void): void;
    removeItems(ks: string[], cb?: (err: unknown) => void): void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

const tg = () => window.Telegram?.WebApp;

/** Мы внутри Telegram: только там у приложения есть подпись initData. */
export const inTelegram = () => !!tg()?.initData;

export const telegramName = () => tg()?.initDataUnsafe.user?.first_name ?? '';

export function initTelegram() {
  const w = tg();
  if (!w || !w.initData) return;
  w.ready();
  w.expand();
  // Свайп вниз закрывал бы приложение при прокрутке и в карточках со свайпом.
  w.disableVerticalSwipes?.();
  w.setHeaderColor?.('#f7f0e6');
  w.setBackgroundColor?.('#f7f0e6');
  w.setBottomBarColor?.('#ffffff');
  document.documentElement.classList.add('in-telegram');
}

export function haptic(kind: 'correct' | 'wrong' | 'tap') {
  const h = tg()?.HapticFeedback;
  if (!h || !inTelegram()) return;
  try {
    if (kind === 'tap') h.impactOccurred('light');
    else h.notificationOccurred(kind === 'correct' ? 'success' : 'error');
  } catch {
    /* виброотклик недоступен */
  }
}

/** Кнопка «Назад» Telegram: показываем её, пока открыт экран поверх списка. */
export function bindBack(active: boolean, onBack: () => void) {
  const b = tg()?.BackButton;
  if (!b || !inTelegram()) return () => {};
  if (!active) {
    b.hide();
    return () => {};
  }
  b.show();
  b.onClick(onBack);
  return () => b.offClick(onBack);
}

// ───────── Облако Telegram: прогресс переезжает между устройствами без своего сервера ─────────
// В облаке до 4096 знаков на ключ, поэтому JSON режем на куски.

const CHUNK = 3500;
const cloud = () => (inTelegram() ? tg()?.CloudStorage : undefined);

export function cloudLoad(): Promise<{ t: number; data: string } | null> {
  const c = cloud();
  if (!c) return Promise.resolve(null);
  return new Promise((resolve) => {
    c.getItem('meta', (err, meta) => {
      if (err || !meta) return resolve(null);
      try {
        const { t, n } = JSON.parse(meta) as { t: number; n: number };
        const keys = Array.from({ length: n }, (_, i) => `p${i}`);
        c.getItems(keys, (e2, vals) => {
          if (e2 || !vals) return resolve(null);
          resolve({ t, data: keys.map((k) => vals[k] ?? '').join('') });
        });
      } catch {
        resolve(null);
      }
    });
  });
}

let timer: ReturnType<typeof setTimeout> | undefined;

/** Сохраняет не чаще раза в пару секунд. */
export function cloudSave(json: string, t: number) {
  const c = cloud();
  if (!c) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const parts = json.match(new RegExp(`[\\s\\S]{1,${CHUNK}}`, 'g')) ?? [];
    parts.forEach((part, i) => c.setItem(`p${i}`, part));
    c.setItem('meta', JSON.stringify({ t, n: parts.length }));
  }, 2000);
}
