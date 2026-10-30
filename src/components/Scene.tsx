import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Dir, MoveSpec, PathOption, PedestrianCfg, SceneCfg, VehicleCfg } from '../types';
import { buildPath, C, FAR, Layout, LW, Path, type Pose, SIZE, startPose, VEH_LEN } from './geometry';
import { SignInScene } from './Sign';
import { LightBody } from './Pictures';

export type PathMark = 'idle' | 'chosen' | 'correct' | 'wrong' | 'dim';

export const PATH_COLORS: Record<string, string> = {
  А: '#1cb0f6',
  Б: '#ff9600',
  В: '#ce82ff',
  Г: '#ff4b4b',
};

interface Props {
  scene: SceneCfg;
  paths?: PathOption[];
  marks?: Record<string, PathMark>;
  /** Запустить анимацию проезда. */
  play?: boolean;
  /** Траектория игрока в анимации (если отличается от заданной в сцене). */
  playerMove?: MoveSpec;
  onDone?: () => void;
  className?: string;
}

const STEP_MS = 1450;
const SPEED = 0.17; // px/ms
const ACCEL_MS = 380;

function travelled(ms: number): number {
  if (ms <= 0) return 0;
  if (ms < ACCEL_MS) return (SPEED * ms * ms) / (2 * ACCEL_MS);
  return SPEED * (ms - ACCEL_MS / 2);
}

function poly(L: Layout, d: Dir, x0: number, x1: number, r0: number, r1: number) {
  return [L.local(d, x0, r0), L.local(d, x1, r0), L.local(d, x1, r1), L.local(d, x0, r1)]
    .map((p) => `${p.x},${p.y}`)
    .join(' ');
}

function line(L: Layout, d: Dir, x0: number, r0: number, x1: number, r1: number) {
  const a = L.local(d, x0, r0);
  const b = L.local(d, x1, r1);
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}

const ROADS: Dir[] = [0, 1, 2, 3];

function Road({ L, d }: { L: Layout; d: Dir }) {
  const r = L.cfg.roads[d]!;
  const h = L.half(d);
  const e = L.entry(d);
  const stop = L.stop(d);
  const center = r.center ?? 'dashed';
  const lineStart = r.crosswalk || r.stopLine || r.light ? stop - 3 : e;
  const lines = [];
  if (center === 'dashed') lines.push(<line key="c" {...line(L, d, 0, lineStart, 0, FAR)} className="mk mk-dash" />);
  if (center === 'solid') lines.push(<line key="c" {...line(L, d, 0, lineStart, 0, FAR)} className="mk" />);
  if (center === 'double')
    lines.push(
      <line key="c1" {...line(L, d, -2.5, lineStart, -2.5, FAR)} className="mk mk-thin" />,
      <line key="c2" {...line(L, d, 2.5, lineStart, 2.5, FAR)} className="mk mk-thin" />,
    );
  for (let i = 1; i < r.lanes; i++) {
    lines.push(
      <line key={`l${i}`} {...line(L, d, LW * i, lineStart, LW * i, FAR)} className="mk mk-dash" />,
      <line key={`o${i}`} {...line(L, d, -LW * i, e, -LW * i, FAR)} className="mk mk-dash" />,
    );
  }
  return (
    <g>
      {lines}
      {r.crosswalk &&
        Array.from({ length: Math.floor((2 * h) / 10) }, (_, i) => {
          const x = -h + 3 + i * 10;
          return <polygon key={i} points={poly(L, d, x, x + 5, e + 5, e + 23)} fill="#fff" opacity={0.92} />;
        })}
      {(r.stopLine || r.light) && <line {...line(L, d, 0, stop - 2, h, stop - 2)} className="mk mk-stop" />}
      {r.arrows?.map((a, i) => {
        const p = L.inPt(d, i, stop + 34);
        return <LaneArrow key={i} kind={a} x={p.x} y={p.y} angle={d * 90} />;
      })}
    </g>
  );
}

function LaneArrow({ kind, x, y, angle }: { kind: string; x: number; y: number; angle: number }) {
  const parts: string[] = [];
  const straight = kind.includes('straight');
  if (straight) parts.push('M0 14 V-8', 'M-5 -6 L0 -14 L5 -6 Z');
  if (kind.includes('right')) parts.push(straight ? 'M0 6 Q0 -1 7 -1' : 'M0 14 V2 Q0 -4 7 -4', straight ? 'M6 -5 L12 -1 L6 3 Z' : 'M6 -8 L12 -4 L6 0 Z');
  if (kind.includes('left')) parts.push(straight ? 'M0 6 Q0 -1 -7 -1' : 'M0 14 V2 Q0 -4 -7 -4', straight ? 'M-6 -5 L-12 -1 L-6 3 Z' : 'M-6 -8 L-12 -4 L-6 0 Z');
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      {parts.map((d, i) => (
        <path key={i} d={d} fill={d.endsWith('Z') ? '#fff' : 'none'} stroke="#fff" strokeWidth={d.endsWith('Z') ? 0 : 2.6} />
      ))}
    </g>
  );
}

// Легковушки — спрайты Kenney Racing Pack (CC0); игрок всегда красный.
const CAR_SPRITES = ['car_blue_2', 'car_green_3', 'car_yellow_5', 'car_black_1', 'car_blue_5'];
const sprite = (name: string) => `${import.meta.env.BASE_URL}kenney/${name}.webp`;

function carSprite(v: VehicleCfg) {
  if (v.id === 'player') return 'car_red_1';
  let h = 0;
  for (const ch of v.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CAR_SPRITES[h % CAR_SPRITES.length];
}

export function Vehicle({ v, pose }: { v: VehicleCfg; pose: Pose }) {
  const kind = v.kind ?? 'car';
  const len = VEH_LEN[kind];
  const w = kind === 'bus' || kind === 'truck' || kind === 'tram' ? 23 : 20;
  const color =
    v.color ?? (v.id === 'player' ? '#ff4b4b' : kind === 'ambulance' || kind === 'police' ? '#ffffff' : kind === 'bus' ? '#ffc800' : '#1cb0f6');
  const sig = v.signal;
  const hl = -len / 2 + 2;
  return (
    <g transform={`translate(${pose.x} ${pose.y})`}>
      <g transform={`rotate(${pose.angle})`}>
        <rect x={-w / 2 - 1} y={-len / 2 + 2} width={w + 2} height={len} rx={7} fill="#000" opacity={0.18} />
        {kind === 'car' ? (
          <image href={sprite(carSprite(v))} x={-w / 2 - 1} y={-len / 2 - 1} width={w + 2} height={len + 2} preserveAspectRatio="none" />
        ) : (
          <rect x={-w / 2} y={-len / 2} width={w} height={len} rx={kind === 'police' ? 7 : 4} fill={color} stroke="#3c3c46" strokeWidth={1.6} />
        )}
        {kind === 'car' ? null : kind === 'truck' ? (
          <>
            <rect x={-w / 2 + 1} y={-len / 2 + 14} width={w - 2} height={len - 15} rx={2} fill="#ececec" stroke="#0002" />
            <rect x={-w / 2 + 3} y={-len / 2 + 3} width={w - 6} height={6} rx={2} fill="#bfe3ff" />
          </>
        ) : kind === 'bus' || kind === 'tram' ? (
          <>
            <rect x={-w / 2 + 3} y={-len / 2 + 3} width={w - 6} height={7} rx={2} fill="#bfe3ff" />
            <rect x={-w / 2 + 4} y={-len / 2 + 14} width={w - 8} height={len - 20} rx={2} fill="#00000014" />
          </>
        ) : (
          <>
            <rect x={-w / 2 + 2.5} y={-len / 2 + 8} width={w - 5} height={8} rx={2.5} fill="#bfe3ff" />
            <rect x={-w / 2 + 3} y={-len / 2 + 17} width={w - 6} height={len - 30} rx={2} fill="#00000012" />
            <rect x={-w / 2 + 3} y={len / 2 - 11} width={w - 6} height={5} rx={2} fill="#bfe3ff" opacity={0.8} />
          </>
        )}
        {kind === 'ambulance' && (
          <>
            <rect x={-w / 2} y={-2} width={w} height={5} fill="#ff4b4b" />
            <path d="M-2 6 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 v-4 h4 Z" fill="#ff4b4b" />
          </>
        )}
        {kind === 'police' && <rect x={-w / 2} y={-3} width={w} height={6} fill="#1f5fbf" />}
        {v.beacon && (
          <g className="beacon">
            <rect x={-6} y={-len / 2 + 18} width={5} height={4} rx={1} fill="#2f7bff" />
            <rect x={1} y={-len / 2 + 18} width={5} height={4} rx={1} fill="#ff3030" />
          </g>
        )}
        {kind !== 'car' && (
          <>
            <rect x={-w / 2 + 1.5} y={hl - 1} width={5} height={3} rx={1} fill="#fff6c2" />
            <rect x={w / 2 - 6.5} y={hl - 1} width={5} height={3} rx={1} fill="#fff6c2" />
          </>
        )}
        {(sig === 'left' || sig === 'hazard') && (
          <g className="blinker">
            <circle cx={-w / 2} cy={-len / 2 + 3} r={3.2} />
            <circle cx={-w / 2} cy={len / 2 - 3} r={3.2} />
          </g>
        )}
        {(sig === 'right' || sig === 'hazard') && (
          <g className="blinker">
            <circle cx={w / 2} cy={-len / 2 + 3} r={3.2} />
            <circle cx={w / 2} cy={len / 2 - 3} r={3.2} />
          </g>
        )}
      </g>
      {v.label && (
        <g>
          <circle r={v.label.length > 1 ? 11 : 9} fill="#fff" stroke="#1d1d1b" strokeWidth={1.5} />
          <text y={v.label.length > 1 ? 3.5 : 4.5} textAnchor="middle" fontSize={v.label.length > 1 ? 9 : 12} fontWeight={900} fill="#1d1d1b">
            {v.label}
          </text>
        </g>
      )}
    </g>
  );
}

function Pedestrian({ L, p, k }: { L: Layout; p: PedestrianCfg; k: number }) {
  const h = L.half(p.road);
  const pos = p.pos + ((p.to ?? p.pos) - p.pos) * k;
  const r = p.dist ?? L.entry(p.road) + 14;
  const pt = L.local(p.road, pos * h, r);
  return (
    <g transform={`translate(${pt.x} ${pt.y})`}>
      <ellipse cx={0} cy={9} rx={7} ry={2.5} fill="#000" opacity={0.25} />
      <circle cx={0} cy={-9} r={4.2} fill="#ffd2a8" stroke="#6b4226" strokeWidth={1} />
      <path d="M-5 -4 H5 L4 5 H-4 Z" fill={p.color ?? '#ce82ff'} />
      <path d="M-3 5 L-4 10 M3 5 L4 10" stroke="#333" strokeWidth={2.2} strokeLinecap="round" />
    </g>
  );
}

function Decor({ L }: { L: Layout }) {
  const spots: [number, number][] = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];
  const roofs = ['#ff9600', '#ce82ff', '#1cb0f6', '#ff86d0'];
  return (
    <g>
      {spots.map(([sx, sy], i) => {
        const x = C + sx * 150;
        const y = C + sy * 150;
        return (
          <g key={i}>
            <rect x={x - 32} y={y - 28} width={64} height={56} rx={6} fill="#f4efe6" stroke="#0001" />
            <rect x={x - 28} y={y - 24} width={56} height={48} rx={4} fill={roofs[i]} opacity={0.85} />
            <rect x={x - 10} y={y - 8} width={20} height={16} rx={3} fill="#ffffff66" />
          </g>
        );
      })}
      {[
        [92, 92],
        [308, 92],
        [92, 308],
        [308, 308],
        [200, 30],
        [30, 200],
        [370, 200],
      ].map(([x, y], i) => {
        // Деревья не ставим на дорогу.
        const onRoad =
          (Math.abs(x - C) < L.bx + 14 && (y < C ? L.has(2) : L.has(0))) ||
          (Math.abs(y - C) < L.by + 14 && (x < C ? L.has(1) : L.has(3)));
        if (onRoad) return null;
        return (
          <g key={`t${i}`}>
            <image href={sprite(i % 2 ? 'tree_small' : 'tree_large')} x={x - 15} y={y - 15} width={30} height={30} />
          </g>
        );
      })}
    </g>
  );
}

function OptionPath({ id, path, mark, lo, hi }: { id: string; path: Path; mark: PathMark; lo: number; hi: number }) {
  const base = PATH_COLORS[id] ?? '#1cb0f6';
  const color = mark === 'correct' ? '#58cc02' : mark === 'wrong' ? '#ff4b4b' : base;
  const end = path.labelPoint(lo, hi);
  const op = mark === 'dim' ? 0.18 : 1;
  const wide = mark === 'chosen' || mark === 'correct' || mark === 'wrong';
  return (
    <g opacity={op} className="opt-path">
      <path d={path.d} fill="none" stroke={color} strokeWidth={wide ? 11 : 8} strokeOpacity={0.3} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path.d} fill="none" stroke={color} strokeWidth={wide ? 4 : 3} strokeDasharray="8 6" strokeLinecap="round" className="dash-move" />
      <g transform={`translate(${end.x} ${end.y}) rotate(${end.angle})`}>
        <path d="M-9 4 L0 -10 L9 4 Z" fill={color} />
      </g>
    </g>
  );
}

function OptionBadge({ id, path, mark, lo, hi, idx }: { id: string; path: Path; mark: PathMark; lo: number; hi: number; idx: number }) {
  const base = PATH_COLORS[id] ?? '#1cb0f6';
  const color = mark === 'correct' ? '#58cc02' : mark === 'wrong' ? '#ff4b4b' : base;
  // Буквы разных траекторий ставим в разные точки, чтобы не перекрывались.
  const p = path.at(path.length * (0.5 + idx * 0.12));
  const end = path.labelPoint(lo, hi);
  const q = p.x > lo + 12 && p.x < hi - 12 && p.y > lo + 12 && p.y < hi - 12 ? p : end;
  return (
    <g opacity={mark === 'dim' ? 0.25 : 1} transform={`translate(${q.x} ${q.y})`}>
      <circle r={11} fill={color} stroke="#fff" strokeWidth={2.5} />
      <text y={4.5} textAnchor="middle" fontSize={13} fontWeight={900} fill="#fff">
        {id}
      </text>
    </g>
  );
}

export function Scene({ scene, paths, marks, play, playerMove, onDone, className }: Props) {
  const L = useMemo(() => new Layout(scene), [scene]);
  const vehicles = scene.vehicles ?? [];
  const [t, setT] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // Траектории машин для анимации.
  const moves = useMemo(() => {
    return vehicles.map((v) => {
      const mv = v.id === 'player' && playerMove ? playerMove : v.move;
      if (!mv) return null;
      const path = buildPath(L, v, mv);
      const step = v.step ?? 1;
      const limit = mv.stopAt !== undefined ? path.length * mv.stopAt : path.length;
      return { path, start: (step - 1) * STEP_MS, limit };
    });
  }, [L, vehicles, playerMove]);

  const optionPaths = useMemo(() => {
    return (paths ?? []).map((o) => {
      const v = vehicles.find((x) => x.id === (o.vehicle ?? 'player'));
      return { id: o.id, path: v ? buildPath(L, v, o.move) : new Path([]) };
    });
  }, [L, paths, vehicles]);

  const total = useMemo(() => {
    let end = 0;
    moves.forEach((m) => {
      if (!m) return;
      // Время, за которое машина уедет за край сцены (или до точки остановки).
      end = Math.max(end, m.start + Math.min(m.limit, 340) / SPEED + ACCEL_MS / 2);
    });
    (scene.pedestrians ?? []).forEach((p) => {
      if (p.step) end = Math.max(end, (p.step - 1) * STEP_MS + 1300);
    });
    return end;
  }, [moves, scene.pedestrians]);

  useEffect(() => {
    if (!play) {
      setT(0);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    let finished = false;
    const tick = (now: number) => {
      const el = now - t0;
      setT(el);
      if (el >= total + 150) {
        if (!finished) {
          finished = true;
          doneRef.current?.();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [play, total]);

  const signals = (d: Dir) => {
    const r = scene.roads[d]!;
    const h = L.half(d);
    const items = [];
    if (r.light) {
      const p = L.local(d, h + 15, L.entry(d) + 16);
      items.push(<LightBody key="light" state={r.light} arrowRight={r.arrowRight ? (r.light === 'red' ? 'on' : 'off') : undefined} x={p.x} y={p.y} s={0.45} />);
    }
    r.signs?.forEach((s, i) => {
      const p = L.local(d, h + 17, L.stop(d) + 36 + i * 32);
      items.push(<SignInScene key={`s${i}`} sign={s} x={p.x} y={p.y} size={26} />);
    });
    r.exitSigns?.forEach((s, i) => {
      const p = L.local(d, -(h + 17), L.entry(d) + 30 + i * 32);
      items.push(<SignInScene key={`e${i}`} sign={s} x={p.x} y={p.y} size={26} />);
    });
    return items;
  };

  const present = ROADS.filter((d) => L.has(d));
  // Узкие дороги показываем крупнее: обрезаем края сцены.
  const lo = Math.max(...present.map((d) => L.lanes(d))) <= 1 ? 50 : 0;
  const hi = SIZE - lo;
  const clipId = useId();
  const myLight = scene.roads[0]?.light;

  return (
    <svg viewBox={`${lo} ${lo} ${hi - lo} ${hi - lo}`} className={`scene ${className ?? ''}`} role="img" aria-label="Дорожная ситуация">
      <defs>
        <pattern id="grass" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#9be15d" />
          <circle cx="4" cy="4" r="1.2" fill="#86d04a" />
          <circle cx="12" cy="11" r="1.2" fill="#86d04a" />
        </pattern>
        <clipPath id={clipId}>
          <rect x={lo} y={lo} width={hi - lo} height={hi - lo} rx={18} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width={SIZE} height={SIZE} fill="url(#grass)" />
        {scene.decor !== false && <Decor L={L} />}
        {/* тротуары */}
        {present.map((d) => (
          <polygon key={`sw${d}`} points={poly(L, d, -L.half(d) - 10, L.half(d) + 10, 0, FAR)} fill="#dcdcdc" />
        ))}
        {(L.bx > 0 || L.by > 0) && present.length > 2 && (
          <rect x={C - L.bx - 10} y={C - L.by - 10} width={2 * L.bx + 20} height={2 * L.by + 20} fill="#dcdcdc" />
        )}
        {/* асфальт */}
        {present.map((d) => (
          <polygon key={`rd${d}`} points={poly(L, d, -L.half(d), L.half(d), 0, FAR)} fill="#5d6673" />
        ))}
        {present.length > 2 && <rect x={C - L.bx} y={C - L.by} width={2 * L.bx} height={2 * L.by} fill="#5d6673" />}
        {present.map((d) => (
          <Road key={`m${d}`} L={L} d={d} />
        ))}
        {scene.obstacles?.map((o, i) => (
          <g key={`ob${i}`} transform={`translate(${o.x} ${o.y})`}>
            <image href={sprite('barrier')} x={-14} y={-5} width={28} height={8} />
            <image href={sprite('cone')} x={-16} y={-14} width={9} height={9} />
            <image href={sprite('cone')} x={7} y={-14} width={9} height={9} />
          </g>
        ))}
        {optionPaths.map((o) => (
          <OptionPath key={o.id} id={o.id} path={o.path} mark={marks?.[o.id] ?? 'idle'} lo={lo} hi={hi} />
        ))}
        {(scene.pedestrians ?? []).map((p, i) => {
          const start = ((p.step ?? 1) - 1) * STEP_MS;
          const k = play && p.step ? Math.max(0, Math.min(1, (t - start) / 1300)) : 0;
          return <Pedestrian key={`p${i}`} L={L} p={p} k={k} />;
        })}
        {vehicles.map((v, i) => {
          const m = moves[i];
          let pose = startPose(L, v);
          if (play && m) pose = m.path.at(Math.min(m.limit, travelled(t - m.start)));
          return <Vehicle key={v.id} v={v} pose={pose} />;
        })}
        {scene.officer && (
          <g transform={`translate(${C} ${C})`}>
            <circle r={9} fill="#24346b" stroke="#c6ff3d" strokeWidth={3} />
            <path d="M-17 0 H17" stroke="#24346b" strokeWidth={5} strokeLinecap="round" />
            <circle r={4} fill="#1b2550" />
          </g>
        )}
        {present.map((d) => (
          <g key={`sig${d}`}>{signals(d)}</g>
        ))}
        {optionPaths.map((o, i) => (
          <OptionBadge key={`b${o.id}`} id={o.id} path={o.path} mark={marks?.[o.id] ?? 'idle'} lo={lo} hi={hi} idx={i} />
        ))}
        {myLight && (
          <g>
            <rect x={hi - 76} y={lo + 8} width={68} height={myLight && scene.roads[0]?.arrowRight ? 76 : 70} rx={12} fill="#fff" opacity={0.92} />
            <LightBody
              state={myLight}
              arrowRight={scene.roads[0]?.arrowRight ? (myLight === 'red' ? 'on' : 'off') : undefined}
              x={hi - (scene.roads[0]?.arrowRight ? 49 : 42)}
              y={lo + 38}
              s={0.62}
            />
            <text x={hi - 42} y={lo + 74} textAnchor="middle" fontSize={8} fontWeight={800} fill="#777">
              ВАШ СВЕТОФОР
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}
