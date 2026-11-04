/** Фото из официального билета ГИБДД. */
export interface Illustration {
  kind: 'photo';
  src: string;
}

export type TopicId =
  | 'basics'
  | 'warning'
  | 'priority'
  | 'prohib'
  | 'mandatory'
  | 'markings'
  | 'lights'
  | 'maneuver'
  | 'speed'
  | 'stop'
  | 'pedestrians'
  | 'crossroads'
  | 'zones'
  | 'lighting'
  | 'transport'
  | 'misc';

export interface Question {
  id: string;
  topic: TopicId;
  text: string;
  image?: Illustration;
  options: string[];
  correct: number;
  explanation: string;
  rule?: string;
  /** Наводящая подсказка — не раскрывает ответ, а напоминает правило. */
  hint?: string;
}

/** Карточка теории: объясняем правило, показываем картинку и сразу проверяем понимание. */
export interface TheoryCard {
  title: string;
  text: string;
  points?: string[];
  image?: Illustration;
  remember?: string;
  rule?: string;
  check?: { q: string; options: string[]; explain: string };
}

/** Упражнение внутри урока: вопрос с вариантами ответа. */
export type Exercise = { type: 'mc'; q: Question };
