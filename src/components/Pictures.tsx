import type { LightState } from '../types';

const LIT = { red: '#ff3b30', yellow: '#ffcc00', green: '#2fd158' };
const DIM = { red: '#4a1d1b', yellow: '#4a3d12', green: '#163d22' };

function lamps(state: LightState) {
  return {
    red: state === 'red' || state === 'redyellow',
    yellow: state === 'yellow' || state === 'redyellow' || state === 'flash',
    green: state === 'green' || state === 'greenflash',
    blinkYellow: state === 'flash',
    blinkGreen: state === 'greenflash',
  };
}

/** Светофор: внутри SVG (x, y — центр корпуса) или отдельной картинкой. */
export function LightBody({ state, arrowRight, x = 0, y = 0, s = 1 }: { state: LightState; arrowRight?: 'on' | 'off'; x?: number; y?: number; s?: number }) {
  const l = lamps(state);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-13} y={-36} width={26} height={72} rx={7} fill="#222" stroke="#000" strokeWidth={1.5} />
      <circle cx={0} cy={-22} r={8.5} fill={l.red ? LIT.red : DIM.red} />
      <circle cx={0} cy={0} r={8.5} fill={l.yellow ? LIT.yellow : DIM.yellow} className={l.blinkYellow ? 'blink' : undefined} />
      <circle cx={0} cy={22} r={8.5} fill={l.green ? LIT.green : DIM.green} className={l.blinkGreen ? 'blink' : undefined} />
      {arrowRight && (
        <g>
          <rect x={13} y={10} width={24} height={24} rx={6} fill="#222" stroke="#000" strokeWidth={1.5} />
          <circle cx={25} cy={22} r={8.5} fill={arrowRight === 'on' ? LIT.green : DIM.green} />
          <path d="M19 22 H29 M25 18 L30 22 L25 26" stroke="#111" strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </g>
      )}
      {(l.red || l.yellow || l.green) && (
        <circle
          cx={0}
          cy={l.red ? -22 : l.green ? 22 : 0}
          r={13}
          fill={l.red ? LIT.red : l.green ? LIT.green : LIT.yellow}
          opacity={0.18}
        />
      )}
    </g>
  );
}

export function TrafficLight({ state, arrowRight, size = 150 }: { state: LightState; arrowRight?: 'on' | 'off'; size?: number }) {
  return (
    <svg viewBox="-45 -45 110 90" width={size * 1.2} height={size} role="img" aria-label="Светофор">
      <LightBody state={state} arrowRight={arrowRight} />
    </svg>
  );
}

/** Регулировщик, вид спереди. */
export function Officer({ pose, size = 170 }: { pose: 'side' | 'up' | 'forward'; size?: number }) {
  const arm = { stroke: '#24346b', strokeWidth: 11, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <svg viewBox="0 0 160 170" width={size} height={size} role="img" aria-label="Регулировщик">
      <ellipse cx={80} cy={162} rx={46} ry={6} fill="#000" opacity={0.12} />
      {/* ноги */}
      <rect x={62} y={112} width={14} height={48} rx={5} fill="#1b2550" />
      <rect x={84} y={112} width={14} height={48} rx={5} fill="#1b2550" />
      {/* туловище и жилет */}
      <rect x={56} y={58} width={48} height={60} rx={12} fill="#24346b" />
      <path d="M58 70 L80 92 L102 70 V100 H58 Z" fill="#c6ff3d" opacity={0.95} />
      <rect x={58} y={96} width={44} height={6} fill="#e9e9e9" />
      {/* руки */}
      {pose === 'side' && (
        <>
          <path d="M60 68 H20" {...arm} />
          <path d="M100 68 H140" {...arm} />
          <rect x={6} y={64} width={18} height={7} rx={3} fill="#fff" stroke="#111" />
          <rect x={10} y={64} width={4} height={7} fill="#111" />
        </>
      )}
      {pose === 'up' && (
        <>
          {/* правая рука регулировщика — слева на рисунке */}
          <path d="M60 66 L52 22" {...arm} />
          <rect x={46} y={2} width={7} height={20} rx={3} fill="#fff" stroke="#111" />
          <rect x={46} y={8} width={7} height={4} fill="#111" />
          <path d="M100 68 L108 112" {...arm} />
        </>
      )}
      {pose === 'forward' && (
        <>
          <path d="M60 68 L36 84" {...arm} />
          <rect x={20} y={82} width={18} height={7} rx={3} fill="#fff" stroke="#111" transform="rotate(-30 29 85)" />
          <path d="M100 68 L108 112" {...arm} />
        </>
      )}
      {/* голова */}
      <circle cx={80} cy={40} r={17} fill="#ffd2a8" />
      <path d="M60 30 Q80 10 100 30 Z" fill="#1b2550" />
      <rect x={58} y={28} width={44} height={6} rx={3} fill="#111" />
      <circle cx={74} cy={42} r={2} fill="#333" />
      <circle cx={86} cy={42} r={2} fill="#333" />
      <path d="M74 49 Q80 53 86 49" stroke="#a0522d" strokeWidth={2} fill="none" />
    </svg>
  );
}

/** Инструктор по вождению. */
export function Instructor({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Инструктор">
      <circle cx={32} cy={32} r={31} fill="#ffe7c2" />
      <path d="M8 60 Q32 40 56 60 Z" fill="#1cb0f6" />
      <circle cx={32} cy={28} r={13} fill="#ffd2a8" />
      <path d="M19 24 Q20 12 32 12 Q44 12 45 24 Q40 18 32 18 Q24 18 19 24 Z" fill="#6b4226" />
      <rect x={22} y={25} width={8} height={6} rx={2} fill="none" stroke="#333" strokeWidth={1.6} />
      <rect x={34} y={25} width={8} height={6} rx={2} fill="none" stroke="#333" strokeWidth={1.6} />
      <path d="M30 28 H34" stroke="#333" strokeWidth={1.6} />
      <path d="M26 36 Q32 39 38 36" stroke="#6b4226" strokeWidth={3} fill="none" strokeLinecap="round" />
    </svg>
  );
}
