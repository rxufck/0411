import type { MoveSpec, SceneCfg } from '../types';
import { car, cross, me, straight, tee } from './scenes';

export interface CityOption {
  id: string;
  label: string;
  /** Для заданий-траекторий: как поедет машина. */
  move?: MoveSpec;
  correct?: boolean;
}

export interface CityTask {
  id: string;
  place: string;
  /** Что говорит инструктор. */
  command: string;
  question: string;
  kind: 'path' | 'choice';
  scene: SceneCfg;
  /** Сцена, которая проигрывается после ответа (например, загорелся зелёный). */
  sceneAfter?: SceneCfg;
  options: CityOption[];
  explanation: string;
  rule?: string;
}

const green = { light: 'green' as const };

export const CITY_TASKS: CityTask[] = [
  {
    id: 'right-2lanes',
    place: 'Проспект Мира',
    command: 'На перекрёстке поворачиваем направо.',
    question: 'Выберите траекторию поворота',
    kind: 'path',
    scene: cross({ lanes: 2, s: green, n: green }, [me({ lane: 1, dist: 140, signal: 'right' })]),
    options: [
      { id: 'А', label: 'В правую полосу', move: { turn: 'right', toLane: 1 }, correct: true },
      { id: 'Б', label: 'В левую полосу', move: { turn: 'right', toLane: 0 } },
      { id: 'В', label: 'На встречную сторону', move: { turn: 'right', toLane: 0, oncoming: true } },
    ],
    explanation: 'Поворачивая направо, держимся как можно ближе к правому краю — въезжаем в правую полосу. Широкий заезд в левую полосу может помешать другим.',
    rule: 'п. 8.6',
  },
  {
    id: 'left-from-right',
    place: 'Улица Ленина',
    command: 'На светофоре поворачиваем налево.',
    question: 'Как правильно выполнить поворот?',
    kind: 'path',
    scene: cross({ lanes: 2, s: green, n: green }, [me({ lane: 1, dist: 170, signal: 'left' })]),
    options: [
      { id: 'А', label: 'Перестроиться в левую полосу и повернуть', move: { turn: 'left', entryLane: 0, toLane: 0 }, correct: true },
      { id: 'Б', label: 'Повернуть из правой полосы', move: { turn: 'left', toLane: 1 } },
      { id: 'В', label: 'Перестроиться и повернуть на встречную', move: { turn: 'left', entryLane: 0, toLane: 0, oncoming: true } },
    ],
    explanation: 'Налево поворачивают из крайнего левого положения. Поэтому сначала заранее перестраиваемся в левую полосу. После поворота нельзя оказаться на встречной стороне.',
    rule: 'п. 8.5, 8.6',
  },
  {
    id: 'uturn',
    place: 'Садовая улица',
    command: 'Мы проехали нужный дом. Разворачиваемся на перекрёстке.',
    question: 'Выберите траекторию разворота',
    kind: 'path',
    scene: cross({ lanes: 2 }, [me({ lane: 1, dist: 170, signal: 'left' })]),
    options: [
      { id: 'А', label: 'Перестроиться влево и развернуться', move: { turn: 'uturn', entryLane: 0 }, correct: true },
      { id: 'Б', label: 'Развернуться из правой полосы', move: { turn: 'uturn', toLane: 1 } },
    ],
    explanation: 'Разворачиваются, как и поворачивают налево, из крайней левой полосы. Разворот из правой полосы перекроет путь тем, кто едет слева.',
    rule: 'п. 8.5',
  },
  {
    id: 'lane-arrows',
    place: 'Перекрёсток у торгового центра',
    command: 'Едем прямо.',
    question: 'Посмотрите на стрелки на асфальте. Как проехать?',
    kind: 'path',
    scene: cross({ lanes: 2, s: { arrows: ['left', 'straight-right'], stopLine: true } }, [me({ lane: 0, dist: 175 })]),
    options: [
      { id: 'А', label: 'Прямо из левой полосы', move: { turn: 'straight' } },
      { id: 'Б', label: 'Перестроиться вправо и ехать прямо', move: { turn: 'straight', entryLane: 1, toLane: 1 }, correct: true },
    ],
    explanation: 'Стрелка в левой полосе разрешает только поворот налево и разворот. Прямо можно ехать только из правой полосы — перестраиваемся заранее, пропустив попутные машины.',
    rule: 'Разметка 1.18',
  },
  {
    id: 'right-hand',
    place: 'Тихий переулок',
    command: 'Едем прямо через перекрёсток.',
    question: 'Знаков и светофора нет. Как поступить?',
    kind: 'choice',
    scene: cross({}, [me({ move: { turn: 'straight' }, step: 2 }), car('А', 3, { move: { turn: 'straight' }, step: 1 })]),
    options: [
      { id: '1', label: 'Проехать первым' },
      { id: '2', label: 'Уступить автомобилю справа', correct: true },
      { id: '3', label: 'Посигналить и ехать' },
    ],
    explanation: 'Перекрёсток равнозначный — работает правило «помехи справа». Автомобиль А справа, его пропускаем.',
    rule: 'п. 13.11',
  },
  {
    id: 'left-oncoming',
    place: 'Школьная улица',
    command: 'Поворачиваем налево.',
    question: 'Навстречу едет автомобиль. Ваши действия?',
    kind: 'choice',
    scene: cross({}, [me({ signal: 'left', move: { turn: 'left' }, step: 2 }), car('А', 2, { move: { turn: 'straight' }, step: 1 })]),
    options: [
      { id: '1', label: 'Повернуть сразу — я первый подъехал' },
      { id: '2', label: 'Пропустить встречный, потом повернуть', correct: true },
    ],
    explanation: 'Поворачивая налево, уступаем встречным, которые едут прямо или направо.',
    rule: 'п. 13.12',
  },
  {
    id: 'main-road',
    place: 'Центральная улица',
    command: 'Прямо. Мы на главной дороге.',
    question: 'Справа стоит автомобиль. Кто едет первым?',
    kind: 'choice',
    scene: cross(
      { s: { signs: [{ id: '2.1' }] }, n: { signs: [{ id: '2.1' }] }, e: { signs: [{ id: '2.4' }] }, w: { signs: [{ id: '2.4' }] } },
      [me({ move: { turn: 'straight' }, step: 1 }), car('А', 3, { move: { turn: 'straight' }, step: 2 })],
    ),
    options: [
      { id: '1', label: 'Я — я на главной дороге', correct: true },
      { id: '2', label: 'Автомобиль справа' },
    ],
    explanation: 'Знак 2.1 «Главная дорога» даёт преимущество. Водитель справа стоит перед знаком «Уступите дорогу» — он пропустит вас.',
    rule: 'п. 13.9',
  },
  {
    id: 'give-way-left',
    place: 'Выезд на Кольцевую',
    command: 'Прямо через перекрёсток.',
    question: 'Перед вами знак «Уступите дорогу». Ваши действия?',
    kind: 'choice',
    scene: cross(
      { s: { signs: [{ id: '2.4' }] }, n: { signs: [{ id: '2.4' }] }, e: { signs: [{ id: '2.1' }] }, w: { signs: [{ id: '2.1' }] } },
      [me({ move: { turn: 'straight' }, step: 2 }), car('А', 1, { move: { turn: 'straight' }, step: 1 })],
    ),
    options: [
      { id: '1', label: 'Ехать — справа никого нет' },
      { id: '2', label: 'Уступить автомобилю слева', correct: true },
    ],
    explanation: 'Знаки приоритета важнее правила «помехи справа». Автомобиль А едет по главной дороге — уступаем ему, хоть он и слева.',
    rule: 'п. 13.9',
  },
  {
    id: 'green-arrow',
    place: 'Перекрёсток у вокзала',
    command: 'Поворачиваем направо.',
    question: 'Горит красный и зелёная стрелка направо. Что делаем?',
    kind: 'choice',
    scene: cross(
      { s: { light: 'red', arrowRight: true }, n: { light: 'red' }, w: { light: 'green' }, e: { light: 'green' } },
      [me({ signal: 'right', move: { turn: 'right' }, step: 2 }), car('А', 1, { move: { turn: 'straight' }, step: 1 })],
    ),
    options: [
      { id: '1', label: 'Стоять — горит красный' },
      { id: '2', label: 'Повернуть сразу — горит стрелка' },
      { id: '3', label: 'Пропустить машину слева и повернуть', correct: true },
    ],
    explanation: 'Зелёная стрелка разрешает поворот направо, но автомобиль слева едет на свой зелёный — ему нужно уступить.',
    rule: 'п. 13.5',
  },
  {
    id: 'pedestrian-turn',
    place: 'Улица Гагарина',
    command: 'Направо.',
    question: 'По переходу идёт пешеход. Как поступить?',
    kind: 'choice',
    scene: cross(
      { s: { light: 'green', crosswalk: true }, n: { light: 'green', crosswalk: true }, e: { crosswalk: true }, w: { crosswalk: true } },
      [me({ signal: 'right', move: { turn: 'right' }, step: 2 })],
      { pedestrians: [{ road: 3, pos: -0.9, to: 1.4, step: 1, color: '#ff9600' }] },
    ),
    options: [
      { id: '1', label: 'Повернуть, аккуратно объехав пешехода' },
      { id: '2', label: 'Пропустить пешехода, затем повернуть', correct: true },
    ],
    explanation: 'При повороте водитель уступает пешеходам, которые переходят дорогу, на которую он поворачивает.',
    rule: 'п. 13.1',
  },
  {
    id: 'red-right',
    place: 'Набережная',
    command: 'Поворачиваем направо, машин нет.',
    question: 'Горит красный, дополнительной стрелки нет. Выполняем команду?',
    kind: 'choice',
    scene: cross({ s: { light: 'red' }, n: { light: 'red' }, w: { light: 'green' }, e: { light: 'green' } }, [me({ signal: 'right' })]),
    sceneAfter: cross(
      { s: { light: 'green' }, n: { light: 'green' }, w: { light: 'red' }, e: { light: 'red' } },
      [me({ signal: 'right', move: { turn: 'right' }, step: 1 })],
    ),
    options: [
      { id: '1', label: 'Повернуть — ведь никого нет' },
      { id: '2', label: 'Ждать зелёного сигнала', correct: true },
    ],
    explanation: 'Инструктор проверял вас! В России поворот направо на красный запрещён, даже если дорога пустая. Ждём зелёный.',
    rule: 'п. 6.2',
  },
  {
    id: 'ambulance',
    place: 'Улица Пирогова',
    command: 'Едем прямо.',
    question: 'Слева приближается скорая помощь с сиреной. Ваши действия?',
    kind: 'choice',
    scene: cross({}, [me({ move: { turn: 'straight' }, step: 2 }), car('А', 1, { kind: 'ambulance', label: undefined, beacon: true, move: { turn: 'straight' }, step: 1 })]),
    options: [
      { id: '1', label: 'Проехать — она слева, а помеха справа' },
      { id: '2', label: 'Уступить скорой помощи', correct: true },
    ],
    explanation: 'Машине с включёнными синим маячком и сиреной уступают всегда — она спешит спасать жизнь.',
    rule: 'п. 3.2',
  },
  {
    id: 'tee-left',
    place: 'Т-образный перекрёсток у парка',
    command: 'Налево.',
    question: 'Слева и справа едут машины. Кого пропускаем?',
    kind: 'choice',
    scene: tee({}, [
      me({ signal: 'left', move: { turn: 'left' }, step: 2 }),
      car('А', 3, { move: { turn: 'straight' }, step: 1 }),
      car('Б', 1, { move: { turn: 'straight' }, step: 3 }),
    ]),
    options: [
      { id: '1', label: 'Обоих' },
      { id: '2', label: 'Только автомобиль справа (А)', correct: true },
      { id: '3', label: 'Никого — я первый' },
    ],
    explanation: 'Перекрёсток равнозначный. Уступаем тому, кто справа (А). А для автомобиля Б мы — помеха справа, поэтому он ждёт нас.',
    rule: 'п. 13.11',
  },
  {
    id: 'overtake-solid',
    place: 'Загородное шоссе',
    command: 'Грузовик медленно едет. Обгони его!',
    question: 'Посмотрите на разметку. Выполняем команду?',
    kind: 'choice',
    scene: straight({ center: 'solid' }, [
      me({ dist: 115, move: { points: [[212, 120], [212, -120]] }, step: 1 }),
      { id: 't', kind: 'truck', color: '#8e8e8e', road: 0, lane: 0, dist: 25, move: { points: [[212, 10], [212, -300]] }, step: 1 },
    ]),
    options: [
      { id: '1', label: 'Обогнать по встречной полосе' },
      { id: '2', label: 'Не обгонять: сплошная линия', correct: true },
    ],
    explanation: 'Инструктор хитрил! Сплошную линию 1.1 пересекать нельзя, значит, и обгонять здесь запрещено. Едем за грузовиком.',
    rule: 'Разметка 1.1',
  },
  {
    id: 'brick',
    place: 'Улица Пушкина',
    command: 'Сворачиваем направо.',
    question: 'Посмотрите на знак у въезда на улицу справа.',
    kind: 'choice',
    scene: cross({ e: { exitSigns: [{ id: '3.1' }] } }, [me({ signal: 'right', move: { turn: 'straight' }, step: 1 })]),
    options: [
      { id: '1', label: 'Повернуть направо' },
      { id: '2', label: 'Нельзя — «Въезд запрещён». Едем прямо и ищем объезд', correct: true },
    ],
    explanation: 'Знак 3.1 «Въезд запрещён» стоит на выезде с дороги с односторонним движением. Поворачивать туда нельзя.',
    rule: 'Знак 3.1',
  },
  {
    id: 'residential',
    place: 'Двор жилого дома',
    command: 'Заезжаем во двор.',
    question: 'С какой максимальной скоростью здесь можно ехать?',
    kind: 'choice',
    scene: straight({ signs: [{ id: '5.21' }] }, [me({ dist: 115, move: { points: [[212, -120]] }, step: 1 })], {
      pedestrians: [{ road: 2, pos: -2.4, dist: 90, color: '#1cb0f6' }],
    }),
    options: [
      { id: '1', label: '20 км/ч', correct: true },
      { id: '2', label: '40 км/ч' },
      { id: '3', label: '60 км/ч' },
    ],
    explanation: 'Знак 5.21 «Жилая зона»: не более 20 км/ч, пешеходы имеют преимущество.',
    rule: 'п. 10.2, 17.1',
  },
  {
    id: 'speed-40',
    place: 'Мост через реку',
    command: 'Едем дальше.',
    question: 'Какую максимальную скорость можно держать?',
    kind: 'choice',
    scene: straight({ signs: [{ id: '3.24', value: 40 }] }, [me({ dist: 115, move: { points: [[212, -120]] }, step: 1 })]),
    options: [
      { id: '1', label: '60 км/ч — мы в городе' },
      { id: '2', label: '40 км/ч', correct: true },
      { id: '3', label: '50 км/ч' },
    ],
    explanation: 'Знак 3.24 ограничивает скорость числом на знаке — 40 км/ч, даже если обычно в городе можно 60.',
    rule: 'Знак 3.24',
  },
  {
    id: 'stop-sign',
    place: 'Пересечение с трассой',
    command: 'Прямо. Машин не видно.',
    question: 'Перед вами знак «STOP». Как проехать?',
    kind: 'choice',
    scene: cross(
      { s: { signs: [{ id: '2.5' }], stopLine: true }, n: { signs: [{ id: '2.5' }] }, w: { signs: [{ id: '2.1' }] }, e: { signs: [{ id: '2.1' }] } },
      [me({ move: { turn: 'straight' }, step: 1 })],
    ),
    options: [
      { id: '1', label: 'Не останавливаясь — никого же нет' },
      { id: '2', label: 'Остановиться у стоп-линии, осмотреться и ехать', correct: true },
    ],
    explanation: 'Знак 2.5 требует остановиться всегда, даже если дорога пустая. Только потом можно продолжить движение.',
    rule: 'Знак 2.5',
  },
  {
    id: 'yellow-flash',
    place: 'Ночной перекрёсток',
    command: 'Прямо.',
    question: 'Светофор мигает жёлтым. Кто едет первым?',
    kind: 'choice',
    scene: cross(
      {
        s: { light: 'flash', signs: [{ id: '2.4' }] },
        n: { light: 'flash', signs: [{ id: '2.4' }] },
        w: { light: 'flash', signs: [{ id: '2.1' }] },
        e: { light: 'flash', signs: [{ id: '2.1' }] },
      },
      [me({ move: { turn: 'straight' }, step: 2 }), car('А', 1, { move: { turn: 'straight' }, step: 1 })],
    ),
    options: [
      { id: '1', label: 'Я — справа никого нет' },
      { id: '2', label: 'Автомобиль А — он на главной', correct: true },
    ],
    explanation: 'Мигающий жёлтый — перекрёсток нерегулируемый. Действуют знаки приоритета: у вас «Уступите дорогу», а А на главной.',
    rule: 'п. 6.2, 13.9',
  },
  {
    id: 'school',
    place: 'Возле школы',
    command: 'Продолжаем движение.',
    question: 'Знак «Дети», у дороги школьник. Ваши действия?',
    kind: 'choice',
    scene: straight({ signs: [{ id: '1.23' }] }, [me({ dist: 115, move: { points: [[212, -120]] }, step: 1 })], {
      pedestrians: [{ road: 2, pos: -2.1, dist: 60, color: '#ff4b4b' }],
    }),
    options: [
      { id: '1', label: 'Снизить скорость и быть готовым остановиться', correct: true },
      { id: '2', label: 'Посигналить ребёнку' },
      { id: '3', label: 'Ехать как обычно' },
    ],
    explanation: 'Рядом со школой дети могут неожиданно выбежать на дорогу. Снижаем скорость и внимательно следим за обочиной.',
    rule: 'Знак 1.23, п. 10.1',
  },
  {
    id: 'zebra',
    place: 'Пешеходный переход у библиотеки',
    command: 'Прямо.',
    question: 'К переходу подходит пешеход. Что делаем?',
    kind: 'choice',
    scene: straight({ crosswalk: true }, [me({ dist: 115, move: { points: [[212, -120]] }, step: 2 })], {
      pedestrians: [{ road: 2, pos: 1.4, to: -1.5, step: 1, color: '#ff9600' }],
    }),
    options: [
      { id: '1', label: 'Проехать перед ним, пока он не вышел' },
      { id: '2', label: 'Остановиться и пропустить пешехода', correct: true },
    ],
    explanation: 'Перед нерегулируемым переходом водитель уступает пешеходам, которые переходят дорогу или уже вступили на переход.',
    rule: 'п. 14.1',
  },
];
