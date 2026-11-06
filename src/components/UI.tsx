import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { levelInfo, useProgress } from '../store';
import { UiIcon } from './Icons';
import { TOPICS } from '../data/course';
import type { TopicId } from '../types';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'green' | 'blue' | 'red' | 'ghost' | 'white' | 'yellow' | 'orange';
  big?: boolean;
  wide?: boolean;
};

export function Btn({ variant = 'green', big, wide, className, children, ...rest }: BtnProps) {
  return (
    <button {...rest} className={`btn btn-${variant} ${big ? 'btn-big' : ''} ${wide ? 'btn-wide' : ''} ${className ?? ''}`}>
      {children}
    </button>
  );
}

export function ProgressBar({ value, color = 'var(--green)' }: { value: number; color?: string }) {
  return (
    <div className="pbar">
      <div className="pbar-fill" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }}>
        <div className="pbar-shine" />
      </div>
    </div>
  );
}

export function BackBtn({ onClick, label = 'Назад', native }: { onClick: () => void; label?: string; native?: boolean }) {
  return (
    // native: в Telegram то же самое делает его собственная кнопка «Назад», вторую стрелку прячем
    <button className={`back-btn ${native ? 'back-native' : ''}`} onClick={onClick} aria-label={label}>
      <svg viewBox="0 0 24 24" width={24} height={24}>
        <path d="M15 5 L8 12 L15 19 M8 12 H20" stroke="currentColor" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button className="back-btn" onClick={onClick} aria-label="Закрыть">
      <svg viewBox="0 0 24 24" width={22} height={22}>
        <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function Modal({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Sheet({ children, onClose, title }: { children: ReactNode; onClose: () => void; title?: ReactNode }) {
  return (
    <div className="modal-back sheet-back" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        {title && (
          <div className="sheet-head">
            <div className="sheet-title">{title}</div>
            <CloseBtn onClick={onClose} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Confetti() {
  const colors = ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#ce82ff', '#ff9600'];
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 40 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 10) * 0.08}s`,
            animationDuration: `${1.6 + (i % 5) * 0.25}s`,
          }}
        />
      ))}
    </div>
  );
}

export function StatTile({ label, value, icon }: { label: string; value: ReactNode; icon: ReactNode }) {
  return (
    <div className="stat-tile">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/** Аватар — первая буква имени в кружке. */
export function Avatar({ size = 44, name }: { size?: number; name?: string }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.46 }} aria-hidden="true">
      {(name?.trim()[0] ?? 'П').toUpperCase()}
    </div>
  );
}

export const fmtMs = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Шапка как в референсе: аватар, уровень, серия, опыт. */
export function ProfileHeader({ onProfile }: { onProfile?: () => void }) {
  const { p } = useProgress();
  const lv = levelInfo(p.xp);
  return (
    <div className="phead">
      <button className="phead-user" onClick={onProfile}>
        <Avatar name={p.name} />
        <div className="phead-text">
          <b>{p.name || lv.title}</b>
          <small>Уровень {lv.level}</small>
          <div className="mini-bar">
            <div style={{ width: `${lv.progress * 100}%` }} />
          </div>
        </div>
      </button>
      <div className="phead-stats">
        <div className="phead-stat">
          <span className="ico"><UiIcon id="fire" size={22} /></span>
          <b>{p.streak}</b>
        </div>
      </div>
    </div>
  );
}

const NAV: Record<string, ReactNode> = {
  learn: <path d="M12 6.5C10.4 5 7.8 4.5 4 4.5V18c3.8 0 6.4.5 8 2 1.6-1.5 4.2-2 8-2V4.5c-3.8 0-6.4.5-8 2Zm0 0V20M7 9h2.5M7 12h2.5M14.5 9H17M14.5 12H17" />,
  exam: <path d="M7 4h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm1.8 6.2 1.4 1.4 2.6-2.8M8.8 15.4h6.4" />,
  review: <path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v4.5h-4.5" />,
  profile: <path d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20c.6-3.4 3.6-5.2 7.5-5.2s6.9 1.8 7.5 5.2" />,
};

export function NavIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {NAV[name]}
    </svg>
  );
}

/** Цветная плашка с номером темы: заменяет значок темы в списках. */
export function TopicBadge({ topic, size = 40 }: { topic: TopicId; size?: number }) {
  const i = TOPICS.findIndex((t) => t.topic === topic);
  const t = TOPICS[i];
  return (
    <span className="topic-badge" style={{ background: t.color, boxShadow: `0 3px 0 ${t.shade}`, width: size, height: size, fontSize: size * 0.46 }} aria-hidden="true">
      {i + 1}
    </span>
  );
}

const BADGES: Record<string, ReactNode> = {
  ticket: <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Zm8-1v10" />,
  hash: <path d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16" />,
  list: <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />,
  bolt: <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />,
  alert: <path d="M12 8v5m0 3.5h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />,
  star: <path d="m12 4 2.4 5 5.6.7-4.1 3.9 1 5.5L12 16.4 7.1 19.1l1-5.5L4 9.7 9.6 9 12 4Z" />,
  fire: <path d="M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm0 5h14M8 3v4m8-4v4m-6.5 9 1.8 1.8L15 14" />,
  lock: <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9Zm6 3v3" />,
  pencil: <path d="m5 19 1-4L16.5 4.5a2 2 0 0 1 3 3L9 18l-4 1Z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  trophy: <path d="M8 4h8v5a4 4 0 0 1-8 0V4Zm0 2H5a3 3 0 0 0 3 4m8-4h3a3 3 0 0 1-3 4M12 13v4m-3 3h6" />,
  puzzle: <path d="M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v4h-4v-2a2 2 0 1 0-4 0v2H6v-4h2a2 2 0 1 0 0-4H6V6h4V4Z" />,
  target: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 3.5h.01" />,
  gear: <g><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></g>,
  user: <path d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20c.6-3.4 3.6-5.2 7.5-5.2s6.9 1.8 7.5 5.2" />,
  medal: <path d="M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-2.5.2L8 21l4-2 4 2-1.5-6.8M12 6.5v3" />,
  book: <path d="M12 7c-1.6-1.6-4.2-2.2-8-2.2V18c3.8 0 6.4.6 8 2.2 1.6-1.6 4.2-2.2 8-2.2V4.8C16.2 4.8 13.6 5.4 12 7Zm0 0v13.2" />,
  flame: <path d="M12 3s5 3.5 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 1.5.8 2.5 1.8 2.5C11.3 8.5 12 6 12 3Z" />,
  flag: <path d="M6 21V4m0 1h11l-2 4 2 4H6" />,
  cards: <path d="M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm-3 3v9m16-9v9" />,
};

/** Линейный белый значок для цветной плашки. */
export function BadgeIcon({ id, dark }: { id: keyof typeof BADGES | string; dark?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={dark ? 22 : 26} height={dark ? 22 : 26} aria-hidden="true" fill="none" stroke={dark ? 'currentColor' : '#fff'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {BADGES[id]}
    </svg>
  );
}

export const PALETTE = {
  green: ['#388201', '#2d6801'],
  blue: ['#137aaa', '#0f6288'],
  gold: ['#aa6400', '#885000'],
  red: ['#d03d3d', '#a63131'],
  purple: ['#7052d6', '#5a42ac'],
  teal: ['#21844e', '#1a6a3e'],
} as const;

/** Строка списка в стиле тем: цветная плашка со значком, заголовок, подпись и необязательная полоса прогресса. */
export function InfoRow({
  tone,
  icon,
  title,
  sub,
  value,
  bar,
  onClick,
  disabled,
}: {
  tone: keyof typeof PALETTE;
  icon: string;
  title: ReactNode;
  sub?: ReactNode;
  value?: ReactNode;
  bar?: number;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const [c, s] = PALETTE[tone];
  const body = (
    <>
      <span className="topic-badge" style={{ background: c, boxShadow: `0 3px 0 ${s}`, width: 48, height: 48 }}>
        <BadgeIcon id={icon} />
      </span>
      <span className="topic-row-text">
        <b>{title}</b>
        {sub && <small>{sub}</small>}
        {bar !== undefined && (
          <span className="topic-row-bar">
            <i style={{ width: `${Math.max(0, Math.min(1, bar)) * 100}%`, background: c }} />
          </span>
        )}
      </span>
      {value !== undefined && <span className="row-value">{value}</span>}
      {onClick && <span className="chev">›</span>}
    </>
  );
  return onClick ? (
    <button className="topic-row" onClick={onClick} disabled={disabled}>
      {body}
    </button>
  ) : (
    <div className="topic-row static">{body}</div>
  );
}

/** Заголовок раздела: цветная полоса слева. */
export function Section({ title, sub, tone = 'green', children }: { title: string; sub?: string; tone?: keyof typeof PALETTE; children: ReactNode }) {
  return (
    <section className="stage">
      <header className="stage-head" style={{ borderColor: PALETTE[tone][0] }}>
        <h2>{title}</h2>
        {sub && <small>{sub}</small>}
      </header>
      {children}
    </section>
  );
}
