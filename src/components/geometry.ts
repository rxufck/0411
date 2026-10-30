import type { Dir, MoveSpec, SceneCfg, Turn, VehicleCfg, VehicleKind } from '../types';

// Сцена рисуется в квадрате 400×400 с центром перекрёстка в (200, 200).
// Все построения ведутся «в системе южной дороги» (едем снизу вверх),
// а потом поворачиваются на нужное число четвертей по часовой стрелке.
export const SIZE = 400;
export const C = 200;
export const LW = 24; // ширина полосы
export const FAR = 280; // точка далеко за краем сцены

export interface Vec {
  x: number;
  y: number;
}

export function rot(v: Vec, k: number): Vec {
  let { x, y } = v;
  for (let i = 0; i < ((k % 4) + 4) % 4; i++) [x, y] = [-y, x];
  return { x, y };
}

const abs = (v: Vec): Vec => ({ x: C + v.x, y: C + v.y });

export class Layout {
  constructor(public cfg: SceneCfg) {}

  lanes(d: Dir): number {
    return this.cfg.roads[d]?.lanes ?? 0;
  }
  has(d: Dir): boolean {
    return !!this.cfg.roads[d];
  }
  /** Полуширина перекрёстка по горизонтали / вертикали. */
  get bx(): number {
    return LW * Math.max(this.lanes(0), this.lanes(2));
  }
  get by(): number {
    return LW * Math.max(this.lanes(1), this.lanes(3));
  }
  /** Расстояние от центра до края пересечения проезжих частей для дороги d. */
  entry(d: Dir): number {
    return d % 2 === 0 ? this.by : this.bx;
  }
  /** Расстояние от центра до стоп-линии. */
  stop(d: Dir): number {
    const r = this.cfg.roads[d];
    return this.entry(d) + (r?.crosswalk ? 28 : 6);
  }
  half(d: Dir): number {
    return LW * this.lanes(d);
  }

  /** Точка на входящей полосе (едем к центру). Полоса 0 — у осевой. */
  inPt(d: Dir, lane: number, r: number): Vec {
    return abs(rot({ x: LW * (lane + 0.5), y: r }, d));
  }
  /** Точка на исходящей полосе (едем от центра). */
  outPt(d: Dir, lane: number, r: number): Vec {
    return abs(rot({ x: -LW * (lane + 0.5), y: r }, d));
  }
  /** Точка в локальной системе дороги d: x — вправо от оси (по ходу въезжающих), r — от центра. */
  local(d: Dir, x: number, r: number): Vec {
    return abs(rot({ x, y: r }, d));
  }
}

export const dirIn = (d: Dir): Vec => rot({ x: 0, y: -1 }, d);
export const dirOut = (d: Dir): Vec => rot({ x: 0, y: 1 }, d);

export function targetRoad(from: Dir, turn: Turn): Dir {
  const shift = { right: 3, straight: 2, left: 1, uturn: 0 }[turn];
  return ((from + shift) % 4) as Dir;
}

const add = (a: Vec, b: Vec, k = 1): Vec => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y;

type Seg = { k: 'L'; a: Vec; b: Vec } | { k: 'C'; a: Vec; c1: Vec; c2: Vec; b: Vec };

function cubicAt(a: Vec, c1: Vec, c2: Vec, b: Vec, t: number): Vec {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
}

export interface Pose {
  x: number;
  y: number;
  angle: number;
}

/** Ломаная из прямых и кривых Безье с параметризацией по длине. */
export class Path {
  readonly d: string;
  readonly length: number;
  private pts: Vec[] = [];
  private lens: number[] = [];

  constructor(public segs: Seg[]) {
    const f = (v: Vec) => `${v.x.toFixed(1)} ${v.y.toFixed(1)}`;
    let d = segs.length ? `M${f(segs[0].a)}` : '';
    for (const s of segs) {
      d += s.k === 'L' ? ` L${f(s.b)}` : ` C${f(s.c1)} ${f(s.c2)} ${f(s.b)}`;
      const n = s.k === 'L' ? 1 : 40;
      for (let i = this.pts.length ? 1 : 0; i <= n; i++) {
        const t = i / n;
        this.pts.push(s.k === 'L' ? add(s.a, sub(s.b, s.a), t) : cubicAt(s.a, s.c1, s.c2, s.b, t));
      }
    }
    let total = 0;
    this.lens = this.pts.map((p, i) => {
      if (i > 0) total += Math.hypot(p.x - this.pts[i - 1].x, p.y - this.pts[i - 1].y);
      return total;
    });
    this.d = d;
    this.length = total;
  }

  at(s: number): Pose {
    const pts = this.pts;
    if (pts.length < 2) return { x: pts[0]?.x ?? 0, y: pts[0]?.y ?? 0, angle: 0 };
    s = Math.max(0, Math.min(this.length, s));
    let i = 1;
    while (i < this.lens.length - 1 && this.lens[i] < s) i++;
    const l0 = this.lens[i - 1];
    const l1 = this.lens[i];
    const t = l1 > l0 ? (s - l0) / (l1 - l0) : 0;
    const a = pts[i - 1];
    const b = pts[i];
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      angle: (Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI,
    };
  }

  /** Точка около конца видимой части пути — для подписи буквы траектории. */
  labelPoint(lo = 0, hi = SIZE): Pose {
    // Идём с конца назад, пока не окажемся внутри видимой области.
    for (let s = this.length; s > 0; s -= 4) {
      const p = this.at(s);
      if (p.x > lo + 18 && p.x < hi - 18 && p.y > lo + 18 && p.y < hi - 18) return p;
    }
    return this.at(this.length / 2);
  }
}

export const VEH_LEN: Record<VehicleKind, number> = {
  car: 36,
  police: 36,
  ambulance: 42,
  truck: 56,
  bus: 62,
  tram: 80,
};

/** Начальное положение машины. */
export function startPose(L: Layout, v: VehicleCfg): Pose {
  if (v.at) return v.at;
  const d = v.road ?? 0;
  const len = VEH_LEN[v.kind ?? 'car'];
  const r = v.dist ?? L.stop(d) + len / 2 + 4 + (v.queue ?? 0) * (len + 10);
  const p = L.inPt(d, v.lane ?? 0, r);
  return { ...p, angle: d * 90 };
}

function catmull(points: Vec[]): Seg[] {
  const segs: Seg[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    segs.push({
      k: 'C',
      a: p1,
      c1: add(p1, sub(p2, p0), 1 / 6),
      c2: add(p2, sub(p3, p1), -1 / 6),
      b: p2,
    });
  }
  return segs;
}

/** Строит траекторию движения машины. */
export function buildPath(L: Layout, v: VehicleCfg, move: MoveSpec): Path {
  const start = startPose(L, v);
  if ('points' in move) {
    return new Path(catmull([start, ...move.points.map(([x, y]) => ({ x, y }))]));
  }
  const from = v.road ?? 0;
  const lane = v.lane ?? 0;
  const t = targetRoad(from, move.turn);
  const nT = Math.max(1, L.lanes(t));
  const defLane =
    move.turn === 'right' ? nT - 1 : move.turn === 'straight' ? Math.min(move.entryLane ?? lane, nT - 1) : 0;
  const j = Math.min(move.toLane ?? defLane, nT - 1);
  const rIn = L.entry(from);
  const rOut = L.entry(t);
  const din = dirIn(from);
  const dout = dirOut(t);
  const segs: Seg[] = [];

  let p1 = L.inPt(from, lane, rIn);
  const startR = dot(sub(start, L.inPt(from, lane, 0)), dirOut(from));
  if (move.entryLane !== undefined && move.entryLane !== lane) {
    const rb = startR > rIn + 130 ? rIn + 60 : rIn + 30;
    const pb = L.inPt(from, move.entryLane, rb);
    const k = Math.max(10, (startR - rb) * 0.5);
    segs.push({ k: 'C', a: start, c1: add(start, din, k), c2: add(pb, din, -k), b: pb });
    p1 = L.inPt(from, move.entryLane, rIn);
    segs.push({ k: 'L', a: pb, b: p1 });
  } else {
    segs.push({ k: 'L', a: start, b: p1 });
  }

  const p2 = move.oncoming ? L.inPt(t, j, rOut) : L.outPt(t, j, rOut);
  const p3 = move.oncoming ? L.inPt(t, j, FAR) : L.outPt(t, j, FAR);
  if (move.turn === 'straight') {
    segs.push({ k: 'L', a: p1, b: p2 });
  } else if (move.turn === 'uturn') {
    const k = rIn * 1.15 + 22;
    segs.push({ k: 'C', a: p1, c1: add(p1, din, k), c2: add(p2, din, k), b: p2 });
  } else {
    const delta = sub(p2, p1);
    const k1 = 0.55 * Math.abs(dot(delta, din));
    const k2 = 0.55 * Math.abs(dot(delta, dout));
    segs.push({ k: 'C', a: p1, c1: add(p1, din, k1), c2: add(p2, dout, -k2), b: p2 });
  }
  segs.push({ k: 'L', a: p2, b: p3 });
  return new Path(segs);
}
