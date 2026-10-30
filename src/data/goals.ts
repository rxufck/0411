import type { Progress } from '../store';
import { TOPICS } from './course';

export interface DailyTask {
  id: string;
  title: string;
  goal: number;
  xp: number;
  progress: (p: Progress) => number;
}

export const DAILY_TASKS: DailyTask[] = [
  { id: 'steps', title: 'Пройди 2 урока', goal: 2, xp: 20, progress: (p) => p.daily.steps },
  { id: 'signs', title: 'Ответь правильно на 5 вопросов о знаках', goal: 5, xp: 20, progress: (p) => p.daily.signs },
  { id: 'fix', title: 'Исправь 3 ошибки', goal: 3, xp: 20, progress: (p) => p.daily.fixed },
];

export const STREAK_REWARD = { days: 7, xp: 50, flag: 'streak7' };

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  done: (p: Progress) => boolean;
}

const stepsAt = (p: Progress, k: number) => TOPICS.filter((t) => (p.steps[t.topic] ?? 0) >= k).length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', title: 'Первый шаг', desc: 'Пройди первый шаг обучения', icon: '🚦', color: '#2bb24c', done: (p) => stepsAt(p, 1) >= 1 },
  { id: 'theory', title: 'Теоретик', desc: 'Изучи теорию пяти тем', icon: '📖', color: '#1f7cf0', done: (p) => stepsAt(p, 1) >= 5 },
  {
    id: 'signs',
    title: 'Знаток знаков',
    desc: 'Сдай контрольные по всем группам знаков',
    icon: '⚠️',
    color: '#ff9a3c',
    done: (p) => (['warning', 'priority', 'prohib', 'mandatory'] as const).every((t) => (p.steps[t] ?? 0) >= 4),
  },
  { id: 'perfect', title: 'Без ошибок', desc: 'Сдай контрольную на 10 из 10', icon: '🎯', color: '#e5484d', done: (p) => Object.values(p.best).some((b) => b === 10) },
  { id: 'streak3', title: 'Три дня подряд', desc: 'Занимайся 3 дня подряд', icon: '🔥', color: '#ff7a3d', done: (p) => p.streak >= 3 },
  { id: 'streak7', title: 'Неделя за рулём', desc: 'Серия 7 дней — особый стикер', icon: '🏅', color: '#ffb800', done: (p) => p.streak >= 7 || p.flags.includes('streak7') },
  { id: 'city', title: 'Водитель города', desc: 'Проедь маршрут без единой ошибки', icon: '🏙️', color: '#9b6bff', done: (p) => p.flags.includes('city') },
  { id: 'exam', title: 'Экзамен сдан', desc: 'Сдай экзамен в формате ГИБДД', icon: '📝', color: '#00a47d', done: (p) => p.flags.includes('exam') },
  { id: 'master', title: 'Мастер ПДД', desc: 'Пройди все темы до конца', icon: '🏆', color: '#d6a700', done: (p) => stepsAt(p, 4) === TOPICS.length },
];
