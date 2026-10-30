import type { ReactNode } from 'react';
import type { SignRef } from '../types';

// Дорожные знаки РФ, нарисованные вручную в поле 100×100.
const RED = '#e1251b';
const BLUE = '#1f5fbf';
const YEL = '#ffcc00';
const BLK = '#1d1d1b';

const Triangle = ({ children }: { children?: ReactNode }) => (
  <>
    <path d="M50 9 L93 84 H7 Z" fill="#fff" stroke={RED} strokeWidth={9} strokeLinejoin="round" />
    {children}
  </>
);

const Ring = ({ fill = '#fff', children }: { fill?: string; children?: ReactNode }) => (
  <>
    <circle cx={50} cy={50} r={44} fill={fill} stroke={RED} strokeWidth={10} />
    {children}
  </>
);

const BlueDisc = ({ children }: { children?: ReactNode }) => (
  <>
    <circle cx={50} cy={50} r={45} fill={BLUE} stroke="#fff" strokeWidth={3} />
    {children}
  </>
);

const BlueSquare = ({ children }: { children?: ReactNode }) => (
  <>
    <rect x={6} y={6} width={88} height={88} rx={8} fill={BLUE} stroke="#fff" strokeWidth={3} />
    {children}
  </>
);

/** Перечёркивание знаков «конец зоны». */
const EndStripes = ({ color = BLK }: { color?: string }) => (
  <g stroke={color} strokeWidth={2.4}>
    {[-12, -6, 0, 6, 12].map((o) => (
      <line key={o} x1={78 + o} y1={22 + o} x2={22 + o} y2={78 + o} />
    ))}
  </g>
);

const EndRing = ({ children }: { children?: ReactNode }) => (
  <>
    <circle cx={50} cy={50} r={45} fill="#fff" stroke="#9a9a9a" strokeWidth={2} />
    {children}
  </>
);

const Slash = () => <line x1={24} y1={24} x2={76} y2={76} stroke={RED} strokeWidth={9} strokeLinecap="round" />;

/** Пешеход-пиктограмма. */
export function Walker({ x = 50, y = 50, s = 1, color = BLK }: { x?: number; y?: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={color} strokeWidth={6} strokeLinecap="round" fill="none">
      <circle cx={2} cy={-24} r={6} fill={color} stroke="none" />
      <path d="M1 -15 L-2 6" />
      <path d="M0 -11 L-11 0 M0 -11 L11 -2" />
      <path d="M-2 6 L-11 22 M-2 6 L9 21" />
    </g>
  );
}

function CarFront({ x, color }: { x: number; color: string }) {
  return (
    <g transform={`translate(${x} 52)`} fill={color}>
      <path d="M-10 -6 L-7 -15 H7 L10 -6 Z" />
      <rect x={-14} y={-7} width={28} height={12} rx={3} />
      <rect x={-13} y={4} width={6} height={6} rx={1.5} />
      <rect x={7} y={4} width={6} height={6} rx={1.5} />
    </g>
  );
}

function TurnArrow({ dir, color = BLK, w = 11 }: { dir: 'right' | 'left'; color?: string; w?: number }) {
  return (
    <g transform={dir === 'left' ? 'translate(100 0) scale(-1 1)' : undefined}>
      <path d="M40 80 V52 Q40 40 52 40 H62" fill="none" stroke={color} strokeWidth={w} strokeLinejoin="round" />
      <path d="M60 25 L80 40 L60 55 Z" fill={color} />
    </g>
  );
}

const UpArrow = ({ color = '#fff' }: { color?: string }) => (
  <path d="M50 16 L71 42 H58 V84 H42 V42 H29 Z" fill={color} />
);

function Roundabout() {
  const r = 22;
  const arcs = [0, 120, 240].map((a0) => {
    // Круговое движение против часовой стрелки.
    const a1 = a0 + 80;
    const p = (a: number) => [50 + r * Math.cos((a * Math.PI) / 180), 50 - r * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    const tip = p(a1 + 22);
    const n = (a: number, k: number) => [
      50 + (r + k) * Math.cos((a * Math.PI) / 180),
      50 - (r + k) * Math.sin((a * Math.PI) / 180),
    ];
    const [ax, ay] = n(a1, 9);
    const [bx, by] = n(a1, -9);
    return (
      <g key={a0}>
        <path d={`M${x0} ${y0} A${r} ${r} 0 0 0 ${x1} ${y1}`} fill="none" stroke="#fff" strokeWidth={8} />
        <path d={`M${ax} ${ay} L${tip[0]} ${tip[1]} L${bx} ${by} Z`} fill="#fff" />
      </g>
    );
  });
  return <>{arcs}</>;
}

function Truck({ color = BLK }: { color?: string }) {
  return (
    <g fill={color}>
      <rect x={18} y={36} width={40} height={24} rx={2} />
      <path d="M60 44 H72 L80 52 V60 H60 Z" />
      <circle cx={30} cy={64} r={6} />
      <circle cx={70} cy={64} r={6} />
    </g>
  );
}

function Bus({ color = '#fff' }: { color?: string }) {
  return (
    <g>
      <rect x={20} y={32} width={60} height={30} rx={5} fill={color} />
      {[26, 39, 52, 65].map((x) => (
        <rect key={x} x={x} y={37} width={10} height={10} rx={1} fill={BLUE} />
      ))}
      <circle cx={33} cy={63} r={6} fill={color} stroke={BLUE} strokeWidth={2.5} />
      <circle cx={67} cy={63} r={6} fill={color} stroke={BLUE} strokeWidth={2.5} />
    </g>
  );
}

const DRAW: Record<string, (value?: string | number) => ReactNode> = {
  '1.1': () => (
    <Triangle>
      <g fill={BLK}>
        <rect x={30} y={50} width={40} height={6} />
        <rect x={30} y={62} width={40} height={6} />
        {[32, 46, 60].map((x) => (
          <rect key={x} x={x} y={44} width={6} height={30} />
        ))}
      </g>
    </Triangle>
  ),
  '1.2': () => (
    <Triangle>
      <g fill={BLK}>
        <rect x={30} y={50} width={36} height={16} rx={2} />
        <rect x={56} y={40} width={12} height={26} />
        <rect x={34} y={42} width={6} height={9} />
        <circle cx={38} cy={70} r={5} />
        <circle cx={58} cy={70} r={5} />
      </g>
    </Triangle>
  ),
  '1.8': () => (
    <Triangle>
      <rect x={42} y={33} width={16} height={43} rx={4} fill={BLK} />
      <circle cx={50} cy={42} r={5} fill={RED} />
      <circle cx={50} cy={54.5} r={5} fill={YEL} />
      <circle cx={50} cy={67} r={5} fill="#19a84a" />
    </Triangle>
  ),
  '1.11.1': () => (
    <Triangle>
      <path d="M42 76 V56 Q42 44 54 42" fill="none" stroke={BLK} strokeWidth={8} />
      <path d="M52 32 L66 42 L52 52 Z" fill={BLK} />
    </Triangle>
  ),
  '1.17': () => (
    <Triangle>
      <path d="M22 72 H34 Q50 44 66 72 H78 V76 H22 Z" fill={BLK} />
    </Triangle>
  ),
  '1.22': () => (
    <Triangle>
      <g fill={BLK}>
        {[30, 40, 50, 60].map((x) => (
          <rect key={x} x={x} y={72} width={6} height={4} />
        ))}
      </g>
      <Walker x={50} y={55} s={0.75} />
    </Triangle>
  ),
  '1.23': () => (
    <Triangle>
      <Walker x={42} y={58} s={0.72} />
      <Walker x={60} y={62} s={0.55} />
    </Triangle>
  ),
  '1.25': () => (
    <Triangle>
      <Walker x={46} y={58} s={0.7} />
      <path d="M56 50 L66 74" stroke={BLK} strokeWidth={4} />
      <path d="M58 76 Q68 64 78 76 Z" fill={BLK} />
    </Triangle>
  ),
  '2.1': () => (
    <>
      <rect x={21} y={21} width={58} height={58} transform="rotate(45 50 50)" fill="#fff" stroke="#bbb" strokeWidth={2} />
      <rect x={31} y={31} width={38} height={38} transform="rotate(45 50 50)" fill={YEL} stroke={BLK} strokeWidth={1.5} />
    </>
  ),
  '2.2': () => (
    <>
      <rect x={21} y={21} width={58} height={58} transform="rotate(45 50 50)" fill="#fff" stroke="#bbb" strokeWidth={2} />
      <rect x={31} y={31} width={38} height={38} transform="rotate(45 50 50)" fill={YEL} stroke={BLK} strokeWidth={1.5} />
      <g stroke={BLK} strokeWidth={3}>
        <line x1={72} y1={24} x2={24} y2={72} />
        <line x1={76} y1={28} x2={28} y2={76} />
        <line x1={68} y1={20} x2={20} y2={68} />
      </g>
    </>
  ),
  '2.3.1': () => (
    <Triangle>
      <rect x={45} y={36} width={10} height={40} fill={BLK} />
      <rect x={30} y={53} width={40} height={5} fill={BLK} />
    </Triangle>
  ),
  '2.4': () => <path d="M7 14 H93 L50 90 Z" fill="#fff" stroke={RED} strokeWidth={9} strokeLinejoin="round" />,
  '2.5': () => (
    <>
      <path
        d="M31 6 H69 L94 31 V69 L69 94 H31 L6 69 V31 Z"
        fill={RED}
        stroke="#fff"
        strokeWidth={3}
      />
      <text x={50} y={60} textAnchor="middle" fontSize={27} fontWeight={900} fill="#fff" fontFamily="Arial, sans-serif">
        STOP
      </text>
    </>
  ),
  '2.6': () => (
    <Ring>
      <path d="M36 22 V66" stroke={BLK} strokeWidth={8} />
      <path d="M26 62 L36 80 L46 62 Z" fill={BLK} />
      <path d="M64 78 V36" stroke={RED} strokeWidth={8} />
      <path d="M54 38 L64 20 L74 38 Z" fill={RED} />
    </Ring>
  ),
  '2.7': () => (
    <BlueSquare>
      <path d="M36 22 V66" stroke={RED} strokeWidth={8} />
      <path d="M26 62 L36 80 L46 62 Z" fill={RED} />
      <path d="M64 78 V36" stroke="#fff" strokeWidth={8} />
      <path d="M54 38 L64 20 L74 38 Z" fill="#fff" />
    </BlueSquare>
  ),
  '3.1': () => (
    <>
      <circle cx={50} cy={50} r={45} fill={RED} stroke="#fff" strokeWidth={2} />
      <rect x={18} y={42} width={64} height={16} fill="#fff" />
    </>
  ),
  '3.2': () => <Ring />,
  '3.4': () => (
    <Ring>
      <g transform="translate(5 2) scale(0.9)">
        <Truck />
      </g>
    </Ring>
  ),
  '3.18.1': () => (
    <Ring>
      <TurnArrow dir="right" />
      <Slash />
    </Ring>
  ),
  '3.18.2': () => (
    <Ring>
      <TurnArrow dir="left" />
      <Slash />
    </Ring>
  ),
  '3.19': () => (
    <Ring>
      <path d="M60 80 V46 A13 13 0 0 0 34 46 V56" fill="none" stroke={BLK} strokeWidth={10} />
      <path d="M22 54 H46 L34 72 Z" fill={BLK} />
      <Slash />
    </Ring>
  ),
  '3.20': () => (
    <Ring>
      <CarFront x={34} color={RED} />
      <CarFront x={66} color={BLK} />
    </Ring>
  ),
  '3.21': () => (
    <EndRing>
      <CarFront x={34} color="#8a8a8a" />
      <CarFront x={66} color="#8a8a8a" />
      <EndStripes />
    </EndRing>
  ),
  '3.24': (v) => (
    <Ring>
      <text x={50} y={63} textAnchor="middle" fontSize={38} fontWeight={800} fill={BLK} fontFamily="Arial, sans-serif">
        {v ?? 40}
      </text>
    </Ring>
  ),
  '3.25': (v) => (
    <EndRing>
      <text x={50} y={63} textAnchor="middle" fontSize={38} fontWeight={800} fill="#8a8a8a" fontFamily="Arial, sans-serif">
        {v ?? 40}
      </text>
      <EndStripes />
    </EndRing>
  ),
  '3.27': () => (
    <Ring fill={BLUE}>
      <line x1={24} y1={24} x2={76} y2={76} stroke={RED} strokeWidth={9} />
      <line x1={76} y1={24} x2={24} y2={76} stroke={RED} strokeWidth={9} />
    </Ring>
  ),
  '3.28': () => (
    <Ring fill={BLUE}>
      <line x1={24} y1={24} x2={76} y2={76} stroke={RED} strokeWidth={9} />
    </Ring>
  ),
  '3.31': () => (
    <EndRing>
      <EndStripes />
    </EndRing>
  ),
  '4.1.1': () => (
    <BlueDisc>
      <UpArrow />
    </BlueDisc>
  ),
  '4.1.2': () => (
    <BlueDisc>
      <TurnArrow dir="right" color="#fff" />
    </BlueDisc>
  ),
  '4.1.3': () => (
    <BlueDisc>
      <TurnArrow dir="left" color="#fff" />
    </BlueDisc>
  ),
  '4.1.4': () => (
    <BlueDisc>
      <path d="M40 84 V30" stroke="#fff" strokeWidth={10} />
      <path d="M26 34 L40 14 L54 34 Z" fill="#fff" />
      <path d="M40 66 Q40 52 54 52 H64" fill="none" stroke="#fff" strokeWidth={10} />
      <path d="M62 40 L80 52 L62 64 Z" fill="#fff" />
    </BlueDisc>
  ),
  '4.2.1': () => (
    <BlueDisc>
      <path d="M32 30 L66 64" stroke="#fff" strokeWidth={11} />
      <path d="M52 72 L76 74 L74 50 Z" fill="#fff" />
    </BlueDisc>
  ),
  '4.3': () => (
    <BlueDisc>
      <Roundabout />
    </BlueDisc>
  ),
  '4.5.1': () => (
    <BlueDisc>
      <Walker x={50} y={56} s={1} color="#fff" />
    </BlueDisc>
  ),
  '5.5': () => (
    <BlueSquare>
      <UpArrow />
    </BlueSquare>
  ),
  '5.16': () => (
    <BlueSquare>
      <Bus />
    </BlueSquare>
  ),
  '5.19.1': () => (
    <BlueSquare>
      <path d="M50 14 L88 84 H12 Z" fill="#fff" />
      <g fill={BLK}>
        {[30, 40, 50, 60].map((x) => (
          <rect key={x} x={x} y={74} width={6} height={5} />
        ))}
      </g>
      <Walker x={52} y={58} s={0.75} />
    </BlueSquare>
  ),
  '5.21': () => (
    <BlueSquare>
      <path d="M18 50 L36 34 L54 50 V70 H18 Z" fill="#fff" />
      <rect x={31} y={56} width={10} height={14} fill={BLUE} />
      <Walker x={66} y={58} s={0.55} color="#fff" />
      <rect x={58} y={70} width={26} height={8} rx={3} fill="#fff" />
      <circle cx={63} cy={80} r={3} fill="#fff" />
      <circle cx={79} cy={80} r={3} fill="#fff" />
    </BlueSquare>
  ),
  '5.22': () => (
    <BlueSquare>
      <path d="M18 50 L36 34 L54 50 V70 H18 Z" fill="#fff" />
      <rect x={31} y={56} width={10} height={14} fill={BLUE} />
      <Walker x={66} y={58} s={0.55} color="#fff" />
      <rect x={58} y={70} width={26} height={8} rx={3} fill="#fff" />
      <line x1={86} y1={14} x2={14} y2={86} stroke={RED} strokeWidth={7} />
    </BlueSquare>
  ),
  '5.23.1': (v) => (
    <>
      <rect x={4} y={26} width={92} height={48} rx={4} fill="#fff" stroke={BLK} strokeWidth={3} />
      <text x={50} y={56} textAnchor="middle" fontSize={13} fontWeight={800} fill={BLK} fontFamily="Arial, sans-serif">
        {v ?? 'ДОРОЖНЫЙ'}
      </text>
    </>
  ),
  '5.24.1': (v) => (
    <>
      <rect x={4} y={26} width={92} height={48} rx={4} fill="#fff" stroke={BLK} strokeWidth={3} />
      <text x={50} y={56} textAnchor="middle" fontSize={13} fontWeight={800} fill={BLK} fontFamily="Arial, sans-serif">
        {v ?? 'ДОРОЖНЫЙ'}
      </text>
      <line x1={90} y1={30} x2={10} y2={70} stroke={RED} strokeWidth={5} />
    </>
  ),
  '6.4': () => (
    <BlueSquare>
      <text x={50} y={74} textAnchor="middle" fontSize={64} fontWeight={800} fill="#fff" fontFamily="Arial, sans-serif">
        P
      </text>
    </BlueSquare>
  ),
};

export const SIGN_IDS = Object.keys(DRAW);

export function Sign({ sign, size = 80, className, x, y }: { sign: SignRef; size?: number; className?: string; x?: number; y?: number }) {
  const draw = DRAW[sign.id];
  return (
    <svg viewBox="0 0 100 100" x={x} y={y} width={size} height={size} className={className} role="img" aria-label={`Знак ${sign.id}`}>
      {draw ? draw(sign.value) : <text x={50} y={55} textAnchor="middle">{sign.id}</text>}
    </svg>
  );
}

/** Знак внутри другого SVG (для сцен). */
export function SignInScene({ sign, x, y, size }: { sign: SignRef; x: number; y: number; size: number }) {
  const draw = DRAW[sign.id];
  const k = size / 100;
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${k})`}>
      <rect x={46} y={92} width={8} height={30} fill="#666" />
      {draw?.(sign.value)}
    </g>
  );
}
