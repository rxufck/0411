import type { Illustration, TheoryCard } from '../../types';
import IMG from './img.json';

// Блоки темы: билеты ГИБДД разбиты на небольшие группы по смыслу, у каждой своя теория.
// Порядок обучения в блоке: короткая теория с самопроверкой, затем все билеты блока
// с подсказками. Билет связан с карточкой, которая его объясняет: её «Запомни»
// становится подсказкой к билету. Билеты указаны первыми шестью знаками id.

export interface UnitCard extends TheoryCard {
  /** Билеты карточки: первые шесть знаков id. */
  tickets?: string[];
  /** Свои подсказки к отдельным билетам, если «Запомни» карточки к ним не подходит. */
  hints?: Record<string, string>;
}

export interface Unit {
  id: string;
  title: string;
  subtitle: string;
  cards: UnitCard[];
}

/** Фото из билета: первые шесть знаков id билета или полное имя файла без расширения. */
const imgMap = IMG as Record<string, string>;
export const photo = (file: string): Illustration => ({ kind: 'photo', src: `${import.meta.env.BASE_URL}tickets/img/${imgMap[file] ?? file}.webp` });

/** Список билетов одной строкой: «a1b2c3 d4e5f6». */
export const ids = (s: string) => s.split(/\s+/).filter(Boolean);
