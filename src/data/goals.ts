import type { Progress } from '../store';
import { TOPICS } from './course';
import type { UiIconId } from '../components/Icons';

export interface DailyTask {
  id: string;
  title: string;
  goal: number;
  xp: number;
  progress: (p: Progress) => number;
}

export const DAILY_TASKS: DailyTask[] = [
  { id: 'steps', title: 'Пройди 2 шага обучения', goal: 2, xp: 20, progress: (p) => p.daily.steps },
  { id: 'signs', title: 'Ответь правильно на 5 вопросов о знаках', goal: 5, xp: 20, progress: (p) => p.daily.signs },
  { id: 'fix', title: 'Исправь 3 ошибки', goal: 3, xp: 20, progress: (p) => p.daily.fixed },
];

export const STREAK_REWARD = { days: 7, xp: 50, flag: 'streak7' };

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: UiIconId;
  color: string;
  done: (p: Progress) => boolean;
}

const unitsRead = (p: Progress) => p.done.filter((k) => k.includes(':u-')).length;
const controlsDone = (p: Progress, topics: readonly string[]) => topics.every((t) => p.done.includes(`${t}:control`));

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', title: 'Первый шаг', desc: 'Прочитай теорию первого блока', icon: 'lights', color: '#58cc02', done: (p) => unitsRead(p) >= 1 },
  { id: 'theory', title: 'Теоретик', desc: 'Прочитай теорию десяти блоков', icon: 'book', color: '#1cb0f6', done: (p) => unitsRead(p) >= 10 },
  {
    id: 'signs',
    title: 'Знаток знаков',
    desc: 'Сдай контрольные по всем группам знаков',
    icon: 'warn',
    color: '#ff9600',
    done: (p) => controlsDone(p, ['warning', 'priority', 'prohib', 'mandatory']),
  },
  { id: 'perfect', title: 'Без ошибок', desc: 'Сдай контрольную без единой ошибки', icon: 'target', color: '#e5484d', done: (p) => p.flags.includes('perfect') },
  { id: 'streak3', title: 'Три дня подряд', desc: 'Занимайся 3 дня подряд', icon: 'fire', color: '#ff7a3d', done: (p) => p.streak >= 3 },
  { id: 'streak7', title: 'Неделя за рулём', desc: 'Серия 7 дней — особый стикер', icon: 'medal', color: '#ffb800', done: (p) => p.streak >= 7 || p.flags.includes('streak7') },
  { id: 'exam', title: 'Экзамен сдан', desc: 'Сдай экзамен в формате ГИБДД', icon: 'sheet', color: '#00a47d', done: (p) => p.flags.includes('exam') },
  { id: 'master', title: 'Мастер ПДД', desc: 'Сдай контрольные по всем темам', icon: 'trophy', color: '#d6a700', done: (p) => controlsDone(p, TOPICS.map((t) => t.topic)) },
];
