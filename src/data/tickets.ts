import { useEffect, useState } from 'react';
import type { Question, TopicId } from '../types';
import { ticketTopic } from './units';

// Официальные экзаменационные билеты ГИБДД (категории A, B, M): 40 билетов по 20 вопросов.
// Файл public/tickets/ab.json готовит scripts/import-tickets.py; грузим его только когда нужен.

interface RawQuestion {
  id: string;
  t: number;
  n: number;
  q: string;
  a: string[];
  c: number;
  tip: string;
  rule: string | null;
  img: string | null;
  topics: number[];
}

export interface TicketQuestion extends Question {
  ticket: number;
  num: number;
  official: string[];
}

export interface TicketDB {
  source: string;
  topics: string[];
  questions: TicketQuestion[];
  byTicket: TicketQuestion[][];
  byId: Map<string, TicketQuestion>;
}

// Тема билета — тема блока, где он разобран (units). Эти таблицы нужны только для билетов,
// которые ещё не попали ни в один блок.
const TOPIC_MAP: Record<string, TopicId> = {
  'Общие положения': 'basics',
  'Общие обязанности водителей': 'basics',
  'Ответственность водителя': 'basics',
  'Дорожная разметка': 'markings',
  'Сигналы светофора и регулировщика': 'lights',
  'Применение специальных сигналов': 'lights',
  'Начало движения, маневрирование': 'maneuver',
  'Расположение транспортных средств на проезжей части': 'maneuver',
  'Скорость движения': 'speed',
  'Обгон, опережение, встречный разъезд': 'speed',
  'Остановка и стоянка': 'stop',
  'Проезд перекрестков': 'crossroads',
  'Приоритет маршрутных транспортных средств': 'crossroads',
  'Пешеходные переходы и места остановок маршрутных транспортных средств': 'pedestrians',
  'Движение через железнодорожные пути': 'pedestrians',
  'Движение по автомагистралям': 'zones',
  'Движение в жилых зонах': 'zones',
  'Пользование внешними световыми приборами и звуковыми сигналами': 'lighting',
  'Применение аварийной сигнализации и знака аварийной остановки': 'lighting',
  'Буксировка механических транспортных средств': 'transport',
  'Перевозка людей и грузов': 'transport',
  'Учебная езда и дополнительные требования к движению велосипедистов': 'transport',
  'Неисправности и условия допуска транспортных средств к эксплуатации': 'misc',
  'Безопасность движения и техника управления автомобилем': 'misc',
  'Оказание доврачебной медицинской помощи': 'misc',
};

const SIGN_GROUP: Record<string, TopicId> = { '1': 'warning', '2': 'priority', '3': 'prohib', '4': 'mandatory', '5': 'mandatory', '6': 'mandatory', '7': 'mandatory', '8': 'mandatory' };

function courseTopic(names: string[], text: string): TopicId {
  const specific = names.find((n) => n !== 'Дорожные знаки' && TOPIC_MAP[n]);
  if (specific) return TOPIC_MAP[specific];
  if (names.includes('Дорожные знаки')) {
    const m = text.match(/знак\w*\s*«?(\d)\.\d/i);
    return m ? SIGN_GROUP[m[1]] ?? 'prohib' : 'prohib';
  }
  return TOPIC_MAP[names[0]] ?? 'basics';
}

let db: TicketDB | null = null;
let loading: Promise<TicketDB> | null = null;
const listeners = new Set<(d: TicketDB) => void>();

export const ticketsReady = () => db;

export function loadTickets(): Promise<TicketDB> {
  if (db) return Promise.resolve(db);
  loading ??= fetch(`${import.meta.env.BASE_URL}tickets/ab.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((raw: { source: string; topics: string[]; questions: RawQuestion[] }) => {
      const questions = raw.questions.map((r): TicketQuestion => {
        const official = r.topics.map((i) => raw.topics[i]);
        return {
          id: `t-${r.id}`,
          topic: ticketTopic(`t-${r.id}`) ?? courseTopic(official, `${r.tip} ${r.rule ?? ''}`),
          text: r.q,
          options: r.a,
          correct: r.c,
          explanation: r.tip,
          rule: r.rule ?? undefined,
          image: r.img ? { kind: 'photo', src: `${import.meta.env.BASE_URL}tickets/img/${r.img}` } : undefined,
          ticket: r.t,
          num: r.n,
          official,
        };
      });
      const byTicket: TicketQuestion[][] = Array.from({ length: 40 }, () => []);
      questions.forEach((q) => byTicket[q.ticket - 1].push(q));
      byTicket.forEach((t) => t.sort((a, b) => a.num - b.num));
      db = { source: raw.source, topics: raw.topics, questions, byTicket, byId: new Map(questions.map((q) => [q.id, q])) };
      listeners.forEach((l) => l(db!));
      return db;
    })
    .catch((e) => {
      loading = null;
      throw e;
    });
  return loading;
}

/** Хук: база билетов (или null, пока грузится). */
export function useTickets(): { db: TicketDB | null; error: boolean } {
  const [state, setState] = useState<{ db: TicketDB | null; error: boolean }>({ db, error: false });
  useEffect(() => {
    if (db) return;
    const on = (d: TicketDB) => setState({ db: d, error: false });
    listeners.add(on);
    loadTickets().catch(() => setState({ db: null, error: true }));
    return () => {
      listeners.delete(on);
    };
  }, []);
  return state;
}

export const isTicketQuestion = (q: Question): q is TicketQuestion => q.id.startsWith('t-');
