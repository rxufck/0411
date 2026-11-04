import type { Exercise, Question, TopicId } from '../types';
import { topicUnits, unitTickets, type Unit } from './units';
import { ticketsReady, type TicketDB, type TicketQuestion } from './tickets';

// ───────────── Структура курса ─────────────
// Этап (группа глав ПДД) → тема → блоки. У каждого блока своя теория с самопроверкой
// и все его вопросы из билетов ГИБДД с подсказками. В конце темы — контрольная.
// Все темы и блоки открыты сразу; путь лишь подсказывает рекомендуемый порядок.

export interface Topic {
  topic: TopicId;
  title: string;
  subtitle: string;
  chapter: string;
  color: string;
  shade: string;
}

export const TOPICS: Topic[] = [
  { topic: 'basics', title: 'Основы и обязанности', subtitle: 'Водитель, пешеход, пассажир', chapter: 'Гл. 1, 2, 4, 5', color: '#388201', shade: '#2d6801' },
  { topic: 'lights', title: 'Светофор и регулировщик', subtitle: 'Сигналы и жесты', chapter: 'Гл. 3, 6', color: '#21844e', shade: '#1a6a3e' },
  { topic: 'warning', title: 'Предупреждающие знаки', subtitle: 'Треугольники об опасности', chapter: 'Прил. 1, раздел 1', color: '#aa6400', shade: '#885000' },
  { topic: 'priority', title: 'Знаки приоритета', subtitle: 'Кто главный на дороге', chapter: 'Прил. 1, раздел 2', color: '#966c00', shade: '#785600' },
  { topic: 'prohib', title: 'Запрещающие знаки', subtitle: 'Что нельзя делать', chapter: 'Прил. 1, раздел 3', color: '#d03d3d', shade: '#a63131' },
  { topic: 'mandatory', title: 'Предписывающие и особые', subtitle: 'Синие знаки', chapter: 'Прил. 1, разделы 4–6', color: '#137aaa', shade: '#0f6288' },
  { topic: 'markings', title: 'Дорожная разметка', subtitle: 'Линии на асфальте', chapter: 'Прил. 2', color: '#68758a', shade: '#535e6e' },
  { topic: 'maneuver', title: 'Манёвры', subtitle: 'Повороты, развороты, перестроения', chapter: 'Гл. 8, 9', color: '#955eb8', shade: '#774b93' },
  { topic: 'speed', title: 'Скорость и обгон', subtitle: 'Как быстро и когда обгонять', chapter: 'Гл. 10, 11', color: '#008364', shade: '#006950' },
  { topic: 'stop', title: 'Остановка и стоянка', subtitle: 'Где можно встать', chapter: 'Гл. 12', color: '#2b70c9', shade: '#225aa1' },
  { topic: 'crossroads', title: 'Перекрёстки', subtitle: 'Кто проедет первым?', chapter: 'Гл. 13', color: '#b8582c', shade: '#934623' },
  { topic: 'pedestrians', title: 'Пешеходы и переезды', subtitle: 'Пропусти пешехода, берегись поезда', chapter: 'Гл. 14, 15', color: '#aa598a', shade: '#88476e' },
  { topic: 'zones', title: 'Магистрали и жилые зоны', subtitle: 'Особые территории', chapter: 'Гл. 16, 17', color: '#7f5fe2', shade: '#664cb5' },
  { topic: 'lighting', title: 'Свет и сигналы', subtitle: 'Фары, клаксон, аварийка', chapter: 'Гл. 7, 19', color: '#966e00', shade: '#785800' },
  { topic: 'transport', title: 'Буксировка и перевозки', subtitle: 'Трос, пассажиры, груз', chapter: 'Гл. 20–23', color: '#936f53', shade: '#765942' },
  { topic: 'misc', title: 'Безопасность и первая помощь', subtitle: 'Если что-то случилось', chapter: 'Гл. 2, 7, первая помощь', color: '#d34247', shade: '#a93539' },
];

// Порядок — от простого к сложному: сначала термины и светофор (знакомо с детства),
// потом знаки и разметка (без них не понять остальное), затем движение по дороге,
// перекрёстки (самая трудная часть билетов) и в конце особые случаи.
export const STAGES: { title: string; subtitle: string; color: string; shade: string; topics: TopicId[] }[] = [
  { title: 'Старт', subtitle: 'Термины, обязанности, светофор', color: '#388201', shade: '#2d6801', topics: ['basics', 'lights'] },
  { title: 'Дорожные знаки', subtitle: 'Все группы знаков', color: '#aa6400', shade: '#885000', topics: ['warning', 'priority', 'prohib', 'mandatory'] },
  { title: 'Разметка и манёвры', subtitle: 'Линии, повороты, перестроения', color: '#955eb8', shade: '#774b93', topics: ['markings', 'maneuver'] },
  { title: 'Скорость и стоянка', subtitle: 'Обгон, остановка, парковка', color: '#008364', shade: '#006950', topics: ['speed', 'stop'] },
  { title: 'Перекрёстки и пешеходы', subtitle: 'Кто проедет первым', color: '#b8582c', shade: '#934623', topics: ['crossroads', 'pedestrians'] },
  { title: 'Особые условия', subtitle: 'Магистрали, свет, перевозки', color: '#7f5fe2', shade: '#664cb5', topics: ['zones', 'lighting', 'transport'] },
  { title: 'Безопасность', subtitle: 'Техника вождения, первая помощь', color: '#d34247', shade: '#a93539', topics: ['misc'] },
];

export const topicById = (t: TopicId) => TOPICS.find((x) => x.topic === t)!;

export type StepKind = 'control';

export const CONTROL_SIZE = 10;

/** Вопросов в контрольной: десять, а если в теме их меньше — все. */
export const controlSize = (topic: TopicId) => Math.min(CONTROL_SIZE, officialByTopic(topic).length || CONTROL_SIZE);
/** Для зачёта нужно 80% верных ответов с первой попытки. */
export const controlPass = (size: number) => Math.ceil(size * 0.8);

export const stepKey = (topic: TopicId, kind: StepKind) => `${topic}:${kind}`;

/** Вопрос освоен, если последний ответ на него дан верно с первой попытки. */
export const isMastered = (stats: Record<string, { box: number }>, id: string) => (stats[id]?.box ?? 0) >= 1;

export const officialByTopic = (topic: TopicId): TicketQuestion[] => ticketsReady()?.questions.filter((q) => q.topic === topic) ?? [];

export function ticketMastery(topic: TopicId, stats: Record<string, { box: number }>) {
  const pool = officialByTopic(topic);
  return { done: pool.filter((q) => isMastered(stats, q.id)).length, total: pool.length };
}

// ───────────── Блоки темы ─────────────

export const unitKey = (topic: TopicId, u: Unit) => `${topic}:u-${u.id}`;

export function unitPool(topic: TopicId, u: Unit): TicketQuestion[] {
  const ids = unitTickets(u);
  return officialByTopic(topic).filter((q) => ids.has(q.id.slice(2, 8)));
}

export function unitMastery(topic: TopicId, u: Unit, stats: Record<string, { box: number }>) {
  const pool = unitPool(topic, u);
  return { done: pool.filter((q) => isMastered(stats, q.id)).length, total: pool.length };
}

/** Все билеты блока, сначала неосвоенные. */
export function buildUnitDrill(topic: TopicId, u: Unit, stats: Record<string, { box: number; seen: number }>): Exercise[] {
  const pool = shuffle(unitPool(topic, u)).sort(
    (a, b) => Number(isMastered(stats, a.id)) - Number(isMastered(stats, b.id)) || (stats[a.id]?.seen ?? 0) - (stats[b.id]?.seen ?? 0),
  );
  return pool.map((q) => ({ type: 'mc', q }));
}

/** Первый блок, где теория не прочитана или билеты не освоены. */
export function nextUnit(topic: TopicId, done: string[], stats: Record<string, { box: number }>): Unit | null {
  for (const u of topicUnits(topic)) {
    const m = unitMastery(topic, u, stats);
    if (!done.includes(unitKey(topic, u)) || m.total === 0 || m.done < m.total) return u;
  }
  return null;
}

/** Тема пройдена полностью: все блоки, все вопросы из билетов и контрольная. */
export function topicComplete(topic: TopicId, done: string[], stats: Record<string, { box: number }>) {
  const m = ticketMastery(topic, stats);
  return !nextUnit(topic, done, stats) && m.done === m.total && done.includes(stepKey(topic, 'control'));
}

/** Следующий рекомендуемый шаг темы: блок или контрольная. */
export function nextStep(topic: TopicId, done: string[], stats: Record<string, { box: number }>): 'unit' | 'control' | null {
  if (nextUnit(topic, done, stats)) return 'unit';
  return done.includes(stepKey(topic, 'control')) ? null : 'control';
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

export const findQuestion = (id: string): Question | undefined => ticketsReady()?.byId.get(id);

const mc = (q: Question): Exercise => ({ type: 'mc', q });

/** Контрольная: вопросы темы из настоящих билетов, без подсказок. */
export function buildControl(topic: TopicId): Exercise[] {
  return sample(officialByTopic(topic), controlSize(topic)).map(mc);
}

/** Повторение темы: сначала то, что решалось хуже, потом остальное. */
export function buildReview(topic: TopicId, stats: Record<string, { box: number; seen: number }>): Exercise[] {
  return shuffle(officialByTopic(topic))
    .sort((a, b) => (stats[a.id]?.box ?? -1) - (stats[b.id]?.box ?? -1))
    .slice(0, 8)
    .map(mc);
}

// ───────────── Экзамен в формате ГИБДД ─────────────
// 20 вопросов в 4 блоках по 5. Можно ошибиться не более двух раз
// и не дважды в одном блоке. За каждую ошибку — +5 вопросов из того же блока
// и +5 минут; в дополнительных вопросах ошибаться нельзя.

export const EXAM_BLOCKS: { title: string }[] = [{ title: 'Вопросы 1–5' }, { title: 'Вопросы 6–10' }, { title: 'Вопросы 11–15' }, { title: 'Вопросы 16–20' }];

export interface ExamQuestion {
  q: Question;
  block: number;
  extra: boolean;
}

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

/** Дополнительные 5 вопросов из того же блока других билетов. */
export function buildOfficialExtra(db: TicketDB, block: number, used: Set<string>): ExamQuestion[] {
  const pool = db.questions.filter((q) => Math.floor((q.num - 1) / 5) === block && !used.has(q.id));
  return sample(pool, 5).map((q) => ({ q, block, extra: true }));
}
