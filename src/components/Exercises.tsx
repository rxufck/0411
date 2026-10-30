import { useEffect, useMemo, useState } from 'react';
import type { Question, SignRef } from '../types';
import { shuffle } from '../data/course';
import { Illustration } from './Illustration';
import { Sign } from './Sign';
import type { PathMark } from './Scene';

export type Status = 'idle' | 'right' | 'wrong' | 'retry';

export const LETTERS = ['А', 'Б', 'В', 'Г'];

export function MultipleChoice({
  q,
  selected,
  status,
  onSelect,
  crossed,
}: {
  q: Question;
  selected: number | null;
  status: Status;
  onSelect: (i: number) => void;
  /** Варианты, уже отброшенные после неудачной попытки. */
  crossed?: number[];
}) {
  // Для вопросов с траекториями подсвечиваем выбранную букву на картинке.
  const marks = useMemo(() => {
    if (q.image?.kind !== 'scene' || !q.image.paths) return undefined;
    const m: Record<string, PathMark> = {};
    const letter = selected !== null && q.options[selected].length <= 2 ? q.options[selected] : null;
    q.image.paths.forEach((p) => {
      m[p.id] = letter === p.id ? 'chosen' : 'idle';
    });
    return m;
  }, [q, selected]);

  const locked = status === 'right' || status === 'wrong';
  return (
    <div className="exercise">
      {q.image && <Illustration img={q.image} marks={marks} />}
      <h2 className="ex-title">{q.text}</h2>
      <div className="options">
        {q.options.map((o, i) => {
          const out = crossed?.includes(i);
          let cls = 'option';
          if (selected === i && !out) cls += ' selected';
          if (locked && i === q.correct) cls += ' correct';
          if (status === 'wrong' && selected === i) cls += ' wrong';
          if (out) cls += ' crossed';
          return (
            <button
              key={i}
              className={cls}
              disabled={locked || out}
              onClick={() => onSelect(i)}
              data-ok={import.meta.env.DEV && i === q.correct ? '' : undefined}
            >
              <span className="opt-key">{LETTERS[i] ?? i + 1}</span>
              <span className="opt-text">{o}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FindSign({
  target,
  choices,
  correctId,
  selected,
  status,
  onSelect,
}: {
  target: string;
  choices: SignRef[];
  correctId: string;
  selected: number | null;
  status: Status;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="exercise">
      <h2 className="ex-title">
        Найдите знак <span className="hl">«{target}»</span>
      </h2>
      <div className="sign-grid">
        {choices.map((s, i) => {
          let cls = 'sign-card';
          if (selected === i) cls += ' selected';
          if ((status === 'right' || status === 'wrong') && s.id === correctId) cls += ' correct';
          if (status === 'wrong' && selected === i) cls += ' wrong';
          return (
            <button key={i} className={cls} disabled={status === 'right' || status === 'wrong'} onClick={() => onSelect(i)} data-ok={import.meta.env.DEV && s.id === correctId ? '' : undefined}>
              <Sign sign={s} size={96} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MatchPairs({
  pairs,
  onDone,
  onMiss,
}: {
  pairs: { sign: SignRef; name: string }[];
  onDone: () => void;
  onMiss: () => void;
}) {
  const left = useMemo(() => shuffle(pairs.map((p, i) => ({ ...p, i }))), [pairs]);
  const right = useMemo(() => shuffle(pairs.map((p, i) => ({ ...p, i }))), [pairs]);
  const [pickL, setPickL] = useState<number | null>(null);
  const [pickR, setPickR] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [bad, setBad] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (pickL === null || pickR === null) return;
    if (pickL === pickR) {
      const next = new Set(done).add(pickL);
      setDone(next);
      setPickL(null);
      setPickR(null);
      if (next.size === pairs.length) onDone();
    } else {
      setBad([pickL, pickR]);
      onMiss();
      const t = setTimeout(() => {
        setBad(null);
        setPickL(null);
        setPickR(null);
      }, 550);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickL, pickR]);

  return (
    <div className="exercise">
      <h2 className="ex-title">Соедините знак и его название</h2>
      <div className="match">
        <div className="match-col">
          {left.map((p) => (
            <button
              key={p.i}
              className={`match-item ${pickL === p.i ? 'selected' : ''} ${done.has(p.i) ? 'done' : ''} ${bad?.[0] === p.i ? 'wrong shake' : ''}`}
              disabled={done.has(p.i)}
              onClick={() => setPickL(p.i)}
            >
              <Sign sign={p.sign} size={58} />
            </button>
          ))}
        </div>
        <div className="match-col">
          {right.map((p) => (
            <button
              key={p.i}
              className={`match-item match-text ${pickR === p.i ? 'selected' : ''} ${done.has(p.i) ? 'done' : ''} ${bad?.[1] === p.i ? 'wrong shake' : ''}`}
              disabled={done.has(p.i)}
              onClick={() => setPickR(p.i)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
