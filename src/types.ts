// Направления дорог относительно центра перекрёстка.
// 0 — юг (снизу, откуда обычно едем мы), 1 — запад, 2 — север, 3 — восток.
// Индекс совпадает с числом поворотов на 90° по часовой стрелке от южной дороги.
export type Dir = 0 | 1 | 2 | 3;
export const S: Dir = 0;
export const W: Dir = 1;
export const N: Dir = 2;
export const E: Dir = 3;

export type Turn = 'left' | 'right' | 'straight' | 'uturn';

export type LightState =
  | 'red'
  | 'yellow'
  | 'green'
  | 'redyellow'
  | 'flash'
  | 'greenflash'
  | 'off';

export interface SignRef {
  id: string;
  value?: string | number;
}

export interface RoadCfg {
  /** Полос в каждом направлении. */
  lanes: number;
  center?: 'dashed' | 'solid' | 'double' | 'none';
  crosswalk?: boolean;
  stopLine?: boolean;
  light?: LightState;
  /** Дополнительная секция светофора со стрелкой направо. */
  arrowRight?: boolean;
  /** Знаки для водителей, подъезжающих по этой дороге к перекрёстку. */
  signs?: SignRef[];
  /** Знаки у выезда на эту дорогу (видны тем, кто на неё поворачивает). */
  exitSigns?: SignRef[];
  /** Стрелки разметки 1.18 по входящим полосам (0 — левая полоса). */
  arrows?: ('left' | 'right' | 'straight' | 'straight-right' | 'straight-left')[];
}

export type MoveSpec =
  | {
      turn: Turn;
      /** Полоса, в которую въезжаем после манёвра (0 — ближняя к оси). */
      toLane?: number;
      /** Ошибочная траектория: выезд на сторону встречного движения. */
      oncoming?: boolean;
      /** Перестроиться в эту полосу до перекрёстка. */
      entryLane?: number;
      /** Остановиться, не доезжая конца (доля пути, 0..1). */
      stopAt?: number;
    }
  | { points: [number, number][]; stopAt?: number };

export type VehicleKind = 'car' | 'bus' | 'truck' | 'ambulance' | 'police' | 'tram';

export interface VehicleCfg {
  id: string;
  kind?: VehicleKind;
  color?: string;
  label?: string;
  road?: Dir;
  lane?: number;
  /** Место в очереди: 0 — у стоп-линии. */
  queue?: number;
  /** Расстояние от центра вместо стандартного. */
  dist?: number;
  /** Абсолютное положение (для сцен без перекрёстка). */
  at?: { x: number; y: number; angle: number };
  signal?: 'left' | 'right' | 'hazard';
  beacon?: boolean;
  move?: MoveSpec;
  /** Порядок проезда в анимации (1 — первым). */
  step?: number;
}

export interface PedestrianCfg {
  road: Dir;
  /** Положение поперёк дороги: -1 — левый край, 1 — правый (смотря от перекрёстка). */
  pos: number;
  /** Куда идёт при анимации. */
  to?: number;
  step?: number;
  color?: string;
  /** Не на переходе, а дальше от перекрёстка на это расстояние. */
  dist?: number;
}

export interface SceneCfg {
  roads: Partial<Record<Dir, RoadCfg>>;
  vehicles?: VehicleCfg[];
  pedestrians?: PedestrianCfg[];
  /** Регулировщик в центре перекрёстка. */
  officer?: boolean;
  /** Дорожные работы / препятствие. */
  obstacles?: { x: number; y: number }[];
  /** Подсветка города: дома, деревья. */
  decor?: boolean;
}

export type Illustration =
  | { kind: 'sign'; sign: SignRef }
  | { kind: 'signs'; signs: SignRef[] }
  | { kind: 'light'; state: LightState; arrowRight?: 'on' | 'off' }
  | { kind: 'officer'; pose: 'side' | 'up' | 'forward' }
  | { kind: 'scene'; scene: SceneCfg; paths?: PathOption[] }
  | { kind: 'emoji'; emoji: string }
  /** Фото из официального билета ГИБДД. */
  | { kind: 'photo'; src: string };

export interface PathOption {
  id: string;
  move: MoveSpec;
  /** Чья траектория: по умолчанию игрока. */
  vehicle?: string;
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

/** Упражнения внутри урока (в стиле Duolingo). */
export type Exercise =
  | { type: 'mc'; q: Question }
  | { type: 'findSign'; id: string; target: string; choices: SignRef[]; explanation: string }
  | { type: 'match'; id: string; pairs: { sign: SignRef; name: string }[] };
