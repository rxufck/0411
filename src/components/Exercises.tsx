import type { Question } from '../types';
import { Illustration } from './Illustration';

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
  const locked = status === 'right' || status === 'wrong';
  return (
    <div className="exercise">
      {q.image && <Illustration img={q.image} />}
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
            <button key={i} className={cls} disabled={locked || out} onClick={() => onSelect(i)} data-ok={import.meta.env.DEV && i === q.correct ? '' : undefined}>
              <span className="opt-key">{LETTERS[i] ?? i + 1}</span>
              <span className="opt-text">{o}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
