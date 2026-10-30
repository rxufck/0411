import { useId } from 'react';
import type { SignRef } from '../types';
import { Sign } from './Sign';
import { LightBody } from './Pictures';

export type InspectorMood = 'happy' | 'cheer' | 'sad' | 'think' | 'wow';

/** Подпись-эмоция над головой маскота: картинка одна, настроение передаёт значок и движение. */
const MOOD_BADGE: Partial<Record<InspectorMood, string>> = { sad: '😕', think: '🤔', wow: '❗' };

/** Маскот — молодой инспектор ДПС (3D-рендер, public/mascot). */
export function Inspector({ mood = 'happy', size = 160 }: { mood?: InspectorMood; size?: number }) {
  const badge = MOOD_BADGE[mood];
  return (
    <span className={`inspector inspector-${mood}`} style={{ width: size }} role="img" aria-label="Инспектор">
      <img src={`${import.meta.env.BASE_URL}mascot/inspector.webp`} alt="" width={size} height={Math.round((size * 595) / 480)} draggable={false} />
      {badge && (
        <span className="inspector-badge" style={{ fontSize: Math.max(14, size * 0.16) }}>
          {badge}
        </span>
      )}
    </span>
  );
}

/** Городской фон: небо, дома, деревья и дорога в перспективе. Поле 320×180. */
export function CityBackdrop({ road = true }: { road?: boolean }) {
  const id = useId();
  return (
    <g>
      <defs>
        <linearGradient id={`sky${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8fd3ff" />
          <stop offset="1" stopColor="#e3f5ff" />
        </linearGradient>
      </defs>
      <rect width={320} height={180} fill={`url(#sky${id})`} />
      <g fill="#fff" opacity={0.9}>
        <ellipse cx={52} cy={30} rx={22} ry={8} />
        <ellipse cx={66} cy={25} rx={14} ry={9} />
        <ellipse cx={240} cy={22} rx={20} ry={7} />
        <ellipse cx={254} cy={18} rx={12} ry={8} />
      </g>
      {/* дальние дома */}
      <g fill="#b7d9f2">
        {[
          [10, 60, 26, 60],
          [40, 46, 20, 74],
          [64, 70, 30, 50],
          [100, 38, 18, 82],
          [196, 50, 22, 70],
          [224, 64, 30, 56],
          [260, 40, 20, 80],
          [286, 66, 30, 54],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx={2} />
        ))}
      </g>
      {/* ближние дома с окнами */}
      {[
        [0, 82, 46, 50, '#e6eef8'],
        [44, 70, 34, 62, '#8fb7e6'],
        [236, 76, 40, 56, '#d9e7f7'],
        [272, 88, 48, 44, '#9cc3ec'],
      ].map(([x, y, w, h, c], i) => (
        <g key={i}>
          <rect x={x as number} y={y as number} width={w as number} height={h as number} fill={c as string} />
          {Array.from({ length: Math.floor((h as number) / 12) }, (_, r) =>
            Array.from({ length: Math.floor((w as number) / 11) }, (_, k) => (
              <rect key={`${r}-${k}`} x={(x as number) + 4 + k * 11} y={(y as number) + 5 + r * 12} width={6} height={7} fill="#ffffff" opacity={0.7} />
            )),
          )}
        </g>
      ))}
      {/* трава и деревья */}
      <rect y={128} width={320} height={52} fill="#9bd86a" />
      {[18, 70, 250, 300].map((x, i) => (
        <g key={x}>
          <rect x={x - 2} y={120} width={4} height={14} fill="#7a5233" />
          <circle cx={x} cy={114} r={i % 2 ? 12 : 10} fill="#4cb944" />
          <circle cx={x - 3} cy={110} r={5} fill="#6fd25e" />
        </g>
      ))}
      {road && (
        <>
          <path d="M138 128 H182 L270 180 H50 Z" fill="#5d6673" />
          <path d="M132 128 H138 L50 180 H36 Z M182 128 H188 L284 180 H270 Z" fill="#dcdcdc" />
          <path d="M160 132 L160 138 M160 146 L160 156 M160 166 L160 180" stroke="#fff" strokeWidth={3} />
        </>
      )}
    </g>
  );
}

/** Знак на фоне города — крупная картинка к вопросу. */
export function SignScene({ sign }: { sign: SignRef }) {
  const wide = sign.id.startsWith('5.23') || sign.id.startsWith('5.24');
  return (
    <svg viewBox="0 0 320 180" className="sign-scene" role="img" aria-label={`Знак ${sign.id}`}>
      <CityBackdrop />
      <rect x={196} y={70} width={6} height={100} rx={2} fill="#8a96a3" />
      <circle cx={199} cy={68} r={60} fill="#fff" opacity={0.25} />
      <Sign sign={sign} x={wide ? 144 : 154} y={wide ? 20 : 22} size={wide ? 110 : 90} />
    </svg>
  );
}

/** Круглая миниатюра темы для пути обучения. */
export function TopicThumb({ thumb, size = 76, locked }: { thumb: { sign?: SignRef; emoji?: string; light?: boolean }; size?: number; locked?: boolean }) {
  const id = useId();
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`topic-thumb ${locked ? 'locked' : ''}`}>
      <defs>
        <clipPath id={`c${id}`}>
          <circle cx={50} cy={50} r={46} />
        </clipPath>
      </defs>
      <g clipPath={`url(#c${id})`}>
        <g transform="translate(-60 -10) scale(0.7)">
          <CityBackdrop />
        </g>
        <rect y={0} width={100} height={100} fill="#fff" opacity={0.08} />
        {thumb.sign && (
          <>
            <rect x={48} y={52} width={4} height={40} fill="#8a96a3" />
            <Sign sign={thumb.sign} x={24} y={10} size={52} />
          </>
        )}
        {thumb.emoji && (
          <text x={50} y={66} textAnchor="middle" fontSize={44}>
            {thumb.emoji}
          </text>
        )}
        {thumb.light && <LightBody state="green" x={50} y={48} s={0.85} />}
      </g>
      <circle cx={50} cy={50} r={46} fill="none" stroke="#fff" strokeWidth={5} />
    </svg>
  );
}
