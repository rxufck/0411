import type { TopicId } from '../../types';
import { BASICS } from './basics';
import { CROSSROADS } from './crossroads';
import { LIGHTING } from './lighting';
import { LIGHTS } from './lights';
import { MANDATORY } from './mandatory';
import { MANEUVER } from './maneuver';
import { MARKINGS } from './markings';
import { MISC } from './misc';
import { PEDESTRIANS } from './pedestrians';
import { PRIORITY } from './priority';
import { PROHIB } from './prohib';
import { SPEED } from './speed';
import { STOP } from './stop';
import { TRANSPORT } from './transport';
import { WARNING } from './warning';
import { ZONES } from './zones';
import type { Unit, UnitCard } from './types';

export type { Unit, UnitCard } from './types';

export const UNITS: Record<TopicId, Unit[]> = {
  basics: BASICS,
  warning: WARNING,
  priority: PRIORITY,
  prohib: PROHIB,
  mandatory: MANDATORY,
  markings: MARKINGS,
  lights: LIGHTS,
  maneuver: MANEUVER,
  speed: SPEED,
  stop: STOP,
  pedestrians: PEDESTRIANS,
  crossroads: CROSSROADS,
  zones: ZONES,
  lighting: LIGHTING,
  transport: TRANSPORT,
  misc: MISC,
};

export const topicUnits = (topic: TopicId): Unit[] => UNITS[topic];
export const unitTickets = (u: Unit) => new Set(u.cards.flatMap((c) => c.tickets ?? []));

const HINTS = new Map<string, string>();
const TOPIC_OF = new Map<string, TopicId>();
export interface CardRef {
  topic: TopicId;
  unit: Unit;
  card: UnitCard;
  index: number;
}
const CARD_OF = new Map<string, CardRef>();
for (const [topic, list] of Object.entries(UNITS) as [TopicId, Unit[]][]) {
  for (const u of list) {
    u.cards.forEach((c, index) => {
      for (const t of c.tickets ?? []) {
        TOPIC_OF.set(t, topic);
        CARD_OF.set(t, { topic, unit: u, card: c, index });
        const h = c.hints?.[t] ?? c.remember;
        if (h) HINTS.set(t, h);
      }
    });
  }
}

/** Подсказка к билету: своя или «Запомни» из карточки, которая его объясняет. */
export const ticketHint = (qid: string) => HINTS.get(qid.slice(2, 8));
/** Тема билета определяется блоком, в котором он разобран. */
export const ticketTopic = (qid: string): TopicId | undefined => TOPIC_OF.get(qid.slice(2, 8));

/** Карточка теории, которая объясняет билет. */
export const ticketCard = (qid: string): CardRef | undefined => CARD_OF.get(qid.slice(2, 8));
