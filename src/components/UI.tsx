import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { heartsNow, levelInfo, useProgress } from '../store';

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

export function BackBtn({ onClick, label = 'Назад' }: { onClick: () => void; label?: string }) {
  return (
    <button className="back-btn" onClick={onClick} aria-label={label}>
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
  const colors = ['#2bb24c', '#1f7cf0', '#ffc93c', '#ff5a5f', '#9b6bff', '#ff9a3c'];
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

/** Аватар — голова инспектора в кружке. */
export function Avatar({ size = 44 }: { size?: number }) {
  return (
    <div className="avatar" style={{ width: size, height: size }}>
      <img src={`${import.meta.env.BASE_URL}mascot/inspector-head.webp`} alt="Инспектор" width={size} height={size} draggable={false} />
    </div>
  );
}

export function useHearts() {
  const { p } = useProgress();
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return heartsNow(p);
}

export const fmtMs = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Шапка как в референсе: аватар, уровень, серия, сердечки, опыт. */
export function ProfileHeader({ onProfile }: { onProfile?: () => void }) {
  const { p } = useProgress();
  const lv = levelInfo(p.xp);
  const { hearts } = useHearts();
  return (
    <div className="phead">
      <button className="phead-user" onClick={onProfile}>
        <Avatar />
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
          <span className="ico">🔥</span>
          <b>{p.streak}</b>
          <small>дней</small>
        </div>
        <div className="phead-stat">
          <span className="ico">❤️</span>
          <b>{hearts}</b>
          <small>сердец</small>
        </div>
        <div className="phead-stat">
          <span className="ico">💎</span>
          <b>{p.xp}</b>
          <small>XP</small>
        </div>
      </div>
    </div>
  );
}

const ICONS: Record<string, ReactNode> = {
  learn: <path d="M12 3 L20 6 V12 Q20 18 12 21 Q4 18 4 12 V6 Z M8.5 12 L11 14.5 L15.5 9.5" />,
  city: <path d="M4 15 L6 9 Q6.5 7.5 8 7.5 H16 Q17.5 7.5 18 9 L20 15 V18 H4 Z M4 15 H20 M7 18 V20 M17 18 V20 M7.5 12.5 H8.5 M15.5 12.5 H16.5" />,
  exam: <path d="M8 4 H16 V6 H8 Z M6 5 H5 V21 H19 V5 H18 M8 11 L10 13 L14 9 M8 17 H16" />,
  review: <path d="M12 3 L19 6 V12 Q19 18 12 21 Q5 18 5 12 V6 Z M9 12 A3 3 0 1 0 12 9 M12 9 L10.5 7.5 M12 9 L10.5 10.5" />,
  profile: <path d="M12 12 A4 4 0 1 0 12 4 A4 4 0 1 0 12 12 Z M4 21 Q4 14 12 14 Q20 14 20 21" />,
};

export function NavIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}
