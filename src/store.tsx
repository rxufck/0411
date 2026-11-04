import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { TopicId } from './types';
import { cloudLoad, cloudSave } from './telegram';

export interface ExamRecord {
  date: string;
  passed: boolean;
  errors: number;
  total: number;
}

/** Статистика по вопросу для интервального повторения (система Лейтнера). */
export interface QStat {
  topic: TopicId;
  seen: number;
  right: number;
  /** Коробка 0..4: чем выше, тем реже повторяем. */
  box: number;
  due: string;
}

export interface Daily {
  date: string;
  steps: number;
  signs: number;
  fixed: number;
  claimed: string[];
}

export interface Progress {
  name: string;
  onboarded: boolean;
  xp: number;
  streak: number;
  lastActive: string | null;
  today: { date: string; xp: number };
  /** Сколько из четырёх отмечаемых шагов пройдено в теме (0..4). */
  steps: Partial<Record<TopicId, number>>;
  /** Пройденные шаги в виде «тема:шаг» — шаги можно проходить в любом порядке. */
  done: string[];
  /** Лучший результат контрольной. */
  best: Partial<Record<TopicId, number>>;
  stats: Record<string, QStat>;
  mistakes: string[];
  hearts: number;
  heartsAt: number;
  daily: Daily;
  flags: string[];
  exams: ExamRecord[];
  /** Лучший результат по официальным билетам: число ошибок. */
  tickets: Record<number, number>;
  bookmarks: string[];
  settings: { sound: boolean; voice: boolean; dailyGoal: number };
}

const KEY = 'pdd-quest-v2';
const OLD_ORDER = ['theory', 'practice', 'practice2', 'control'];
export const MAX_HEARTS = 5;
export const HEART_MS = 20 * 60 * 1000;
const BOX_DAYS = [0, 1, 3, 7, 16];

export const todayStr = (d = new Date()) => d.toISOString().slice(0, 10);
const addDays = (days: number) => todayStr(new Date(Date.now() + days * 86400000));

const freshDaily = (): Daily => ({ date: todayStr(), steps: 0, signs: 0, fixed: 0, claimed: [] });

const initial = (): Progress => ({
  name: '',
  onboarded: false,
  xp: 0,
  streak: 0,
  lastActive: null,
  today: { date: todayStr(), xp: 0 },
  steps: {},
  done: [],
  best: {},
  stats: {},
  mistakes: [],
  hearts: MAX_HEARTS,
  heartsAt: Date.now(),
  daily: freshDaily(),
  flags: [],
  exams: [],
  tickets: {},
  bookmarks: [],
  settings: { sound: true, voice: true, dailyGoal: 50 },
});

/** Сердечки восстанавливаются по одному каждые 20 минут. */
export function heartsNow(p: Pick<Progress, 'hearts' | 'heartsAt'>, now = Date.now()) {
  if (p.hearts >= MAX_HEARTS) return { hearts: MAX_HEARTS, nextIn: 0 };
  const gained = Math.floor((now - p.heartsAt) / HEART_MS);
  const hearts = Math.min(MAX_HEARTS, p.hearts + gained);
  return { hearts, nextIn: hearts >= MAX_HEARTS ? 0 : HEART_MS - ((now - p.heartsAt) % HEART_MS) };
}

function withHearts(p: Progress, delta: number): Progress {
  const now = Date.now();
  const { hearts } = heartsNow(p, now);
  const next = Math.max(0, Math.min(MAX_HEARTS, hearts + delta));
  // Сохраняем «накопленное» время до следующего сердечка.
  const carry = hearts >= MAX_HEARTS ? 0 : (now - p.heartsAt) % HEART_MS;
  return { ...p, hearts: next, heartsAt: now - (next >= MAX_HEARTS ? 0 : carry) };
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    return normalize(JSON.parse(raw));
  } catch {
    return initial();
  }
}

function normalize(saved: Partial<Progress>): Progress {
  try {
    const p = { ...initial(), ...saved } as Progress;
    // Старый формат: шаги шли строго по порядку, переводим в список пройденных.
    if (!p.done.length)
      p.done = (Object.entries(p.steps) as [TopicId, number][]).flatMap(([t, n]) => OLD_ORDER.slice(0, n).map((k) => `${t}:${k}`));
    if (p.today.date !== todayStr()) p.today = { date: todayStr(), xp: 0 };
    if (p.daily.date !== todayStr()) p.daily = freshDaily();
    const y = addDays(-1);
    if (p.lastActive && p.lastActive !== todayStr() && p.lastActive !== y) p.streak = 0;
    return p;
  } catch {
    return initial();
  }
}

// ───────────── Уровни ─────────────
const LEVELS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];
const TITLES = ['Новичок', 'Ученик', 'Пешеход-профи', 'Знаток знаков', 'Юный водитель', 'Уверенный водитель', 'Мастер дороги', 'Почти инструктор', 'Инструктор', 'Легенда ПДД'];

export function levelInfo(xp: number) {
  let lvl = 0;
  while (lvl + 1 < LEVELS.length && xp >= LEVELS[lvl + 1]) lvl++;
  const from = LEVELS[lvl];
  const to = LEVELS[lvl + 1] ?? from + 1000;
  return { level: lvl + 1, title: TITLES[lvl], from, to, progress: (xp - from) / (to - from) };
}

interface Store {
  p: Progress;
  addXp: (n: number) => void;
  record: (id: string, topic: TopicId, ok: boolean, opts?: { sign?: boolean }) => void;
  completeStep: (topic: TopicId, kind: string, score?: number) => void;
  fixMistake: (id: string) => void;
  addMistakes: (ids: string[], topicOf: (id: string) => TopicId | undefined) => void;
  loseHeart: () => void;
  claimDaily: (id: string, xp: number) => void;
  addFlag: (f: string) => void;
  addExam: (r: ExamRecord) => void;
  recordTicket: (ticket: number, errors: number) => void;
  toggleBookmark: (id: string) => void;
  setName: (n: string) => void;
  finishOnboarding: () => void;
  setSettings: (s: Partial<Progress['settings']>) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

function touchDay(p: Progress): Progress {
  const t = todayStr();
  return {
    ...p,
    today: p.today.date === t ? p.today : { date: t, xp: 0 },
    daily: p.daily.date === t ? p.daily : freshDaily(),
  };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<Progress>(load);

  // В Telegram прогресс живёт ещё и в облаке аккаунта: при запуске берём более свежую копию.
  const synced = useRef(false);
  useEffect(() => {
    cloudLoad().then((c) => {
      synced.current = true;
      if (!c) return;
      const local = Number(localStorage.getItem(KEY + '-t') ?? 0);
      if (c.t > local) {
        try {
          setP(normalize(JSON.parse(c.data)));
        } catch {
          /* облачная копия повреждена — остаёмся на локальной */
        }
      }
    });
  }, []);

  useEffect(() => {
    try {
      const json = JSON.stringify(p);
      const t = Date.now();
      localStorage.setItem(KEY, json);
      localStorage.setItem(KEY + '-t', String(t));
      if (synced.current) cloudSave(json, t);
    } catch {
      /* приватный режим — прогресс просто не сохранится */
    }
  }, [p]);

  const addXp = useCallback((n: number) => {
    setP((p0) => {
      const p = touchDay(p0);
      const t = todayStr();
      const streak = p.lastActive === t ? p.streak : p.lastActive === addDays(-1) ? p.streak + 1 : 1;
      return { ...p, xp: p.xp + n, today: { date: t, xp: p.today.xp + n }, lastActive: t, streak };
    });
  }, []);

  const store = useMemo<Store>(
    () => ({
      p,
      addXp,
      record: (id, topic, ok, opts) =>
        setP((p0) => {
          const p = touchDay(p0);
          const s = p.stats[id] ?? { topic, seen: 0, right: 0, box: 0, due: todayStr() };
          const box = ok ? Math.min(4, s.box + 1) : 0;
          const stat: QStat = { topic, seen: s.seen + 1, right: s.right + (ok ? 1 : 0), box, due: addDays(BOX_DAYS[box]) };
          const mistakes = ok ? p.mistakes : p.mistakes.includes(id) ? p.mistakes : [...p.mistakes, id];
          const daily = ok && opts?.sign ? { ...p.daily, signs: p.daily.signs + 1 } : p.daily;
          return { ...p, stats: { ...p.stats, [id]: stat }, mistakes, daily };
        }),
      completeStep: (topic, kind, score) =>
        setP((p0) => {
          const p = touchDay(p0);
          const key = `${topic}:${kind}`;
          const done = p.done.includes(key) ? p.done : [...p.done, key];
          const best = score !== undefined ? { ...p.best, [topic]: Math.max(p.best[topic] ?? 0, score) } : p.best;
          return {
            ...p,
            done,
            steps: { ...p.steps, [topic]: OLD_ORDER.filter((k) => done.includes(`${topic}:${k}`)).length },
            best,
            daily: { ...p.daily, steps: p.daily.steps + 1 },
          };
        }),
      fixMistake: (id) =>
        setP((p0) => {
          const p = touchDay(p0);
          if (!p.mistakes.includes(id)) return p;
          // Исправленная ошибка возвращает сердечко.
          return withHearts({ ...p, mistakes: p.mistakes.filter((m) => m !== id), daily: { ...p.daily, fixed: p.daily.fixed + 1 } }, 1);
        }),
      addMistakes: (ids, topicOf) =>
        setP((p) => {
          const stats = { ...p.stats };
          ids.forEach((id) => {
            const t = topicOf(id);
            if (!t) return;
            const s = stats[id] ?? { topic: t, seen: 0, right: 0, box: 0, due: todayStr() };
            stats[id] = { ...s, seen: s.seen + 1, box: 0, due: todayStr() };
          });
          return { ...p, stats, mistakes: Array.from(new Set([...p.mistakes, ...ids])) };
        }),
      loseHeart: () => setP((p) => withHearts(p, -1)),
      claimDaily: (id, xp) => {
        setP((p) => (p.daily.claimed.includes(id) ? p : { ...p, daily: { ...p.daily, claimed: [...p.daily.claimed, id] } }));
        addXp(xp);
      },
      addFlag: (f) => setP((p) => (p.flags.includes(f) ? p : { ...p, flags: [...p.flags, f] })),
      addExam: (r) => setP((p) => ({ ...p, exams: [r, ...p.exams].slice(0, 30), flags: r.passed && !p.flags.includes('exam') ? [...p.flags, 'exam'] : p.flags })),
      recordTicket: (ticket, errors) => setP((p) => ({ ...p, tickets: { ...p.tickets, [ticket]: Math.min(errors, p.tickets[ticket] ?? Infinity) } })),
      toggleBookmark: (id) => setP((p) => ({ ...p, bookmarks: p.bookmarks.includes(id) ? p.bookmarks.filter((b) => b !== id) : [...p.bookmarks, id] })),
      setName: (n) => setP((p) => ({ ...p, name: n })),
      finishOnboarding: () => setP((p) => ({ ...p, onboarded: true })),
      setSettings: (s) => setP((p) => ({ ...p, settings: { ...p.settings, ...s } })),
      reset: () => setP({ ...initial(), onboarded: true }),
    }),
    [p, addXp],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useProgress(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('ProgressProvider missing');
  return s;
}

// ───────────── Статистика ─────────────

export function topicAccuracy(p: Progress) {
  const acc: Partial<Record<TopicId, { seen: number; right: number }>> = {};
  Object.values(p.stats).forEach((s) => {
    const a = (acc[s.topic] ??= { seen: 0, right: 0 });
    a.seen += s.seen;
    a.right += s.right;
  });
  return acc;
}

/** Вопросы, которые пора повторить по интервалам. */
export function dueQuestions(p: Progress) {
  const t = todayStr();
  return Object.entries(p.stats)
    .filter(([, s]) => s.due <= t && s.box < 4)
    .map(([id]) => id);
}
