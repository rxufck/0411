import type { Exercise, Question, SignRef, TopicId } from '../types';
import { QUESTIONS } from './questions';
import { SIGNS } from './signs';
import { THEORY } from './theory';
import { ticketsReady, type TicketDB, type TicketQuestion } from './tickets';

// ───────────── Структура курса ─────────────
// Этап (группа глав ПДД) → тема → 4 шага обучения:
// теория с самопроверкой → практика с подсказками → закрепление → контрольная.

export interface Topic {
  topic: TopicId;
  title: string;
  subtitle: string;
  chapter: string;
  emoji: string;
  color: string;
  shade: string;
  thumb: { sign?: SignRef; emoji?: string; light?: boolean };
}

export const TOPICS: Topic[] = [
  { topic: 'basics', title: 'Основы и обязанности', subtitle: 'Водитель, пешеход, пассажир', chapter: 'Гл. 1, 2, 4, 5', emoji: '🚗', color: '#58cc02', shade: '#46a302', thumb: { emoji: '🚗' } },
  { topic: 'warning', title: 'Предупреждающие знаки', subtitle: 'Треугольники об опасности', chapter: 'Прил. 1, раздел 1', emoji: '⚠️', color: '#ff9600', shade: '#cc7800', thumb: { sign: { id: '1.23' } } },
  { topic: 'priority', title: 'Знаки приоритета', subtitle: 'Кто главный на дороге', chapter: 'Прил. 1, раздел 2', emoji: '🔶', color: '#ffb800', shade: '#d69a00', thumb: { sign: { id: '2.1' } } },
  { topic: 'prohib', title: 'Запрещающие знаки', subtitle: 'Что нельзя делать', chapter: 'Прил. 1, раздел 3', emoji: '⛔', color: '#ff4b4b', shade: '#d33131', thumb: { sign: { id: '3.1' } } },
  { topic: 'mandatory', title: 'Предписывающие и особые', subtitle: 'Синие знаки', chapter: 'Прил. 1, разделы 4–6', emoji: '🔵', color: '#1cb0f6', shade: '#1899d6', thumb: { sign: { id: '4.1.1' } } },
  { topic: 'markings', title: 'Дорожная разметка', subtitle: 'Линии на асфальте', chapter: 'Прил. 2', emoji: '🛣️', color: '#7b8aa3', shade: '#5f6c84', thumb: { emoji: '🛣️' } },
  { topic: 'lights', title: 'Светофор и регулировщик', subtitle: 'Сигналы и жесты', chapter: 'Гл. 3, 6', emoji: '🚦', color: '#2fbf71', shade: '#239a5a', thumb: { light: true } },
  { topic: 'maneuver', title: 'Манёвры', subtitle: 'Повороты, развороты, перестроения', chapter: 'Гл. 8, 9', emoji: '↪️', color: '#ce82ff', shade: '#a568cc', thumb: { emoji: '↪️' } },
  { topic: 'speed', title: 'Скорость и обгон', subtitle: 'Как быстро и когда обгонять', chapter: 'Гл. 10, 11', emoji: '💨', color: '#00cd9c', shade: '#00a47d', thumb: { sign: { id: '3.24', value: 60 } } },
  { topic: 'stop', title: 'Остановка и стоянка', subtitle: 'Где можно встать', chapter: 'Гл. 12', emoji: '🅿️', color: '#2b70c9', shade: '#225aa1', thumb: { sign: { id: '6.4' } } },
  { topic: 'crossroads', title: 'Перекрёстки', subtitle: 'Кто проедет первым?', chapter: 'Гл. 13', emoji: '✖️', color: '#ff7a3d', shade: '#cc6231', thumb: { sign: { id: '2.3.1' } } },
  { topic: 'pedestrians', title: 'Пешеходы и переезды', subtitle: 'Пропусти пешехода, берегись поезда', chapter: 'Гл. 14, 15', emoji: '🚶', color: '#ff86d0', shade: '#cc6ba6', thumb: { sign: { id: '5.19.1' } } },
  { topic: 'zones', title: 'Магистрали и жилые зоны', subtitle: 'Особые территории', chapter: 'Гл. 16, 17', emoji: '🏘️', color: '#8f6bff', shade: '#7052d6', thumb: { sign: { id: '5.21' } } },
  { topic: 'lighting', title: 'Свет и сигналы', subtitle: 'Фары, клаксон, аварийка', chapter: 'Гл. 7, 19', emoji: '💡', color: '#f5b400', shade: '#c99400', thumb: { emoji: '💡' } },
  { topic: 'transport', title: 'Буксировка и перевозки', subtitle: 'Трос, пассажиры, груз', chapter: 'Гл. 20–23', emoji: '🚛', color: '#a0785a', shade: '#7f5f47', thumb: { emoji: '🚛' } },
  { topic: 'misc', title: 'Безопасность и первая помощь', subtitle: 'Если что-то случилось', chapter: 'Гл. 2, 7, первая помощь', emoji: '⛑️', color: '#e5484d', shade: '#b8393d', thumb: { emoji: '⛑️' } },
];

export const STAGES: { title: string; subtitle: string; topics: TopicId[] }[] = [
  { title: 'Основы', subtitle: 'Кто есть кто на дороге', topics: ['basics'] },
  { title: 'Дорожные знаки', subtitle: 'Все группы знаков', topics: ['warning', 'priority', 'prohib', 'mandatory'] },
  { title: 'Разметка и сигналы', subtitle: 'Линии, светофоры, регулировщик', topics: ['markings', 'lights'] },
  { title: 'Движение по дороге', subtitle: 'Манёвры, скорость, стоянка', topics: ['maneuver', 'speed', 'stop'] },
  { title: 'Перекрёстки и пешеходы', subtitle: 'Самые важные ситуации', topics: ['crossroads', 'pedestrians'] },
  { title: 'Особые условия', subtitle: 'Магистрали, свет, перевозки', topics: ['zones', 'lighting', 'transport'] },
  { title: 'Безопасность', subtitle: 'Если случилось ДТП', topics: ['misc'] },
];

export const topicById = (t: TopicId) => TOPICS.find((x) => x.topic === t)!;

export type StepKind = 'theory' | 'practice' | 'practice2' | 'control';

export const STEPS: { kind: StepKind; title: string; icon: string; desc: string }[] = [
  { kind: 'theory', title: 'Теория', icon: '📖', desc: 'Читаем правило и сразу проверяем себя' },
  { kind: 'practice', title: 'Практика с подсказками', icon: '💡', desc: 'Ошибся — получи подсказку и попробуй ещё раз' },
  { kind: 'practice2', title: 'Закрепление', icon: '🔁', desc: 'Новые вопросы, знаки и пары' },
  { kind: 'control', title: 'Контрольная', icon: '🏁', desc: '10 вопросов без подсказок, нужно 8 верных' },
];

export const CONTROL_SIZE = 10;
export const CONTROL_PASS = 8;

/** Тема открыта, если в предыдущей пройдены теория и практика. */
export function isUnlocked(i: number, steps: Partial<Record<TopicId, number>>) {
  return i === 0 || (steps[TOPICS[i - 1].topic] ?? 0) >= 2;
}

// ───────────── Банк вопросов ─────────────

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const sample = <T,>(arr: T[], k: number) => shuffle(arr).slice(0, k);

/** Вопросы «Как называется этот знак?» — по одному на каждый знак. */
export const SIGN_QUESTIONS: Question[] = SIGNS.map((s) => {
  const same = SIGNS.filter((o) => o.topic === s.topic && o.id !== s.id && o.name !== s.name);
  return {
    id: `sign-${s.id}`,
    topic: s.topic,
    text: 'Как называется этот знак?',
    image: { kind: 'sign', sign: { id: s.id, value: s.value } },
    options: [s.name, ...sample(same, 3).map((o) => o.name)],
    correct: 0,
    explanation: s.desc,
    rule: `Знак ${s.id}`,
    hint: 'Посмотри на форму и цвет знака — они подсказывают группу.',
  };
});

/** Вопросы «Проверь себя» из теории тоже попадают в практику и повторение. */
export const THEORY_QUESTIONS: Question[] = (Object.keys(THEORY) as TopicId[]).flatMap((t) =>
  THEORY[t].flatMap((c, i) =>
    c.check
      ? [{ id: `th-${t}-${i}`, topic: t, text: c.check.q, options: c.check.options, correct: 0, explanation: c.check.explain, rule: c.rule, hint: c.remember, image: c.image }]
      : [],
  ),
);

export const ALL_QUESTIONS = [...QUESTIONS, ...SIGN_QUESTIONS, ...THEORY_QUESTIONS];
export const findQuestion = (id: string): Question | undefined =>
  id.startsWith('t-') ? ticketsReady()?.byId.get(id) : ALL_QUESTIONS.find((q) => q.id === id);
export const topicQuestions = (t: TopicId) => QUESTIONS.filter((q) => q.topic === t);

/** Перемешивает варианты ответа (кроме вопросов с буквами траекторий). */
export function shuffleOptions(q: Question): Question {
  // В официальных билетах порядок ответов как на экзамене — не трогаем.
  if (q.id.startsWith('t-') || (q.image?.kind === 'scene' && q.image.paths)) return q;
  const order = shuffle(q.options.map((_, i) => i));
  return { ...q, options: order.map((i) => q.options[i]), correct: order.indexOf(q.correct) };
}

const SIGN_TOPICS: TopicId[] = ['warning', 'priority', 'prohib', 'mandatory'];
const mc = (q: Question): Exercise => ({ type: 'mc', q: shuffleOptions(q) });

function signExercises(topic: TopicId, k: number): Exercise[] {
  const topicSigns = SIGNS.filter((s) => s.topic === topic);
  const target = topicSigns[Math.floor(Math.random() * topicSigns.length)];
  const others = sample(topicSigns.filter((s) => s.id !== target.id), 3);
  const find: Exercise = {
    type: 'findSign',
    id: `find-${target.id}`,
    target: target.name,
    choices: shuffle([target, ...others]).map((s) => ({ id: s.id, value: s.value })),
    explanation: target.desc,
  };
  const match: Exercise = {
    type: 'match',
    id: `match-${topic}-${k}`,
    pairs: sample(topicSigns, 4).map((s) => ({ sign: { id: s.id, value: s.value }, name: s.name })),
  };
  const names = sample(SIGN_QUESTIONS.filter((q) => q.topic === topic), 2).map(mc);
  return [names[0], find, names[1], match].filter(Boolean);
}

/** Практика: вопросы из теории (закрепляем только что прочитанное) + банк темы. */
export function buildPractice(topic: TopicId, round: 1 | 2): Exercise[] {
  const bank = shuffle(topicQuestions(topic));
  const half = Math.ceil(bank.length / 2);
  // Первый раунд и закрепление берут разные половины банка.
  const part = round === 1 ? bank.slice(0, half) : bank.slice(half).concat(bank.slice(0, Math.max(0, 5 - (bank.length - half))));
  const theory = sample(THEORY_QUESTIONS.filter((q) => q.topic === topic), round === 1 ? 2 : 1).map(mc);
  const main = part.slice(0, SIGN_TOPICS.includes(topic) ? 4 : 6).map(mc);
  if (!SIGN_TOPICS.includes(topic)) return round === 1 ? [...theory, ...main] : shuffle([...theory, ...main]);
  const s = signExercises(topic, round);
  return round === 1 ? [...theory, s[0], ...main.slice(0, 2), s[1], ...main.slice(2), s[3]].filter(Boolean) : shuffle([...theory, ...main, ...s]);
}

/** Контрольная: только вопросы, без подсказок. Часть вопросов — из настоящих билетов ГИБДД. */
export function buildControl(topic: TopicId): Exercise[] {
  const pool = [...topicQuestions(topic), ...SIGN_QUESTIONS.filter((q) => q.topic === topic)];
  const extra = THEORY_QUESTIONS.filter((q) => q.topic === topic);
  const official = sample(officialByTopic(topic), 3);
  const picked = [...official, ...sample(pool, CONTROL_SIZE - official.length)];
  if (picked.length < CONTROL_SIZE) picked.push(...sample(extra, CONTROL_SIZE - picked.length));
  return shuffle(picked).map(mc);
}

/** Повторение темы: всё вперемешку. */
export function buildReview(topic: TopicId): Exercise[] {
  return sample([...topicQuestions(topic), ...THEORY_QUESTIONS.filter((q) => q.topic === topic)], 8).map(mc);
}

export function buildRandomTicket(): Exercise[] {
  return sample(QUESTIONS, 20).map(mc);
}

// ───────────── Экзамен в формате ГИБДД ─────────────
// 20 вопросов в 4 тематических блоках по 5. Можно ошибиться не более двух раз
// и не дважды в одном блоке. За каждую ошибку — +5 вопросов из того же блока
// и +5 минут; в дополнительных вопросах ошибаться нельзя.

export const EXAM_BLOCKS: { title: string; topics: TopicId[] }[] = [
  { title: 'Знаки и общие положения', topics: ['basics', 'warning', 'priority', 'prohib', 'mandatory'] },
  { title: 'Разметка, сигналы, манёвры', topics: ['markings', 'lights', 'maneuver', 'lighting'] },
  { title: 'Скорость, остановка, пешеходы', topics: ['speed', 'stop', 'pedestrians', 'zones'] },
  { title: 'Перекрёстки и безопасность', topics: ['crossroads', 'misc', 'transport'] },
];

const blockPool = (b: number) => QUESTIONS.filter((q) => EXAM_BLOCKS[b].topics.includes(q.topic));

export interface ExamQuestion {
  q: Question;
  block: number;
  extra: boolean;
}

export function buildExam(): ExamQuestion[] {
  return EXAM_BLOCKS.flatMap((_, b) => sample(blockPool(b), 5).map((q) => ({ q: shuffleOptions(q), block: b, extra: false })));
}

export function buildExtra(block: number, used: Set<string>): ExamQuestion[] {
  const pool = blockPool(block).filter((q) => !used.has(q.id));
  return sample(pool, 5).map((q) => ({ q: shuffleOptions(q), block, extra: true }));
}

// ───────────── Официальные билеты ─────────────

export const officialByTopic = (topic: TopicId): TicketQuestion[] => ticketsReady()?.questions.filter((q) => q.topic === topic) ?? [];

/** Вопросы для тренировки: сначала те, что ещё не встречались или были с ошибкой. */
export function pickFresh<T extends Question>(pool: T[], k: number, seen: (id: string) => number): T[] {
  return shuffle(pool)
    .sort((a, b) => seen(a.id) - seen(b.id))
    .slice(0, k);
}

/** Экзамен по случайному официальному билету; блоки — вопросы 1–5, 6–10, 11–15, 16–20. */
export function buildOfficialExam(db: TicketDB): { ticket: number; items: ExamQuestion[] } {
  const ticket = 1 + Math.floor(Math.random() * db.byTicket.length);
  return { ticket, items: db.byTicket[ticket - 1].map((q) => ({ q, block: Math.floor((q.num - 1) / 5), extra: false })) };
}

/** Дополнительные 5 вопросов из того же тематического блока других билетов. */
export function buildOfficialExtra(db: TicketDB, block: number, used: Set<string>): ExamQuestion[] {
  const pool = db.questions.filter((q) => Math.floor((q.num - 1) / 5) === block && !used.has(q.id));
  return sample(pool, 5).map((q) => ({ q, block, extra: true }));
}
