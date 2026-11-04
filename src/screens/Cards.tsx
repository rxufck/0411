import { useRef, useState } from 'react';
import type { Question } from '../types';
import { LETTERS } from '../components/Exercises';
import { Illustration } from '../components/Illustration';
import { BackBtn, Btn, ProgressBar } from '../components/UI';
import { UiIcon } from '../components/Icons';
import { useProgress } from '../store';
import { play } from '../sound';

const THRESHOLD = 90;

/**
 * Карточки: вопрос на лицевой стороне, ответ с пояснением — на обороте.
 * Свайп вправо — «знаю», влево — «не знаю». Не знаешь — вопрос попадает в «Повторение».
 */
export function Cards({ title, deck, onClose }: { title: string; deck: Question[]; onClose: () => void }) {
  const { p, record } = useProgress();
  const [queue, setQueue] = useState(deck);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dx, setDx] = useState(0);
  const [known, setKnown] = useState(0);
  const [missed, setMissed] = useState<Question[]>([]);
  const start = useRef<{ x: number; moved: boolean } | null>(null);

  const q = queue[pos];
  const done = pos >= queue.length;

  const answer = (ok: boolean) => {
    if (!q) return;
    record(q.id, q.topic, ok);
    play(ok ? 'correct' : 'wrong', p.settings.sound);
    if (ok) setKnown((k) => k + 1);
    else setMissed((m) => [...m, q]);
    setFlipped(false);
    setDx(0);
    setPos((i) => i + 1);
  };

  const onDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    const d = e.clientX - start.current.x;
    if (Math.abs(d) > 6) start.current.moved = true;
    setDx(d);
  };
  const onUp = () => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    if (dx > THRESHOLD) return answer(true);
    if (dx < -THRESHOLD) return answer(false);
    setDx(0);
    if (!s.moved) setFlipped((f) => !f);
  };

  const again = (cards: Question[]) => {
    setQueue(cards);
    setPos(0);
    setKnown(0);
    setMissed([]);
    setFlipped(false);
  };

  if (done) {
    return (
      <div className="screen-full finish v3 ok">
        <div className="finish-hero">
          <span className="finish-badge"><UiIcon id="check" size={52} /></span>
        </div>
        <div className="finish-body">
          <h1 className="finish-title">Колода пройдена</h1>
          <p className="muted">
            Знаю: {known}. Повторить: {missed.length}. {missed.length ? 'Эти вопросы добавлены в «Повторение».' : 'Ни одной ошибки!'}
          </p>
          {missed.length > 0 && (
            <Btn big wide variant="orange" onClick={() => again(missed)}>
              Повторить не знаю ({missed.length})
            </Btn>
          )}
          <Btn big wide variant="yellow" onClick={onClose}>
            Готово
          </Btn>
        </div>
      </div>
    );
  }

  const tilt = Math.max(-14, Math.min(14, dx / 14));
  const verdict = dx > 40 ? 'yes' : dx < -40 ? 'no' : '';

  return (
    <div className="screen-full lesson">
      <div className="lesson-top">
        <BackBtn onClick={onClose} />
        <div className="lesson-top-mid">
          <div className="lesson-top-title">
            <span>{title}</span>
            <span className="lesson-count">
              {pos + 1} из {queue.length}
            </span>
          </div>
          <ProgressBar value={pos / queue.length} color="var(--blue)" />
        </div>
      </div>

      <div className="lesson-body cards-body">
        <div
          className={`flash ${flipped ? 'flipped' : ''} ${verdict}`}
          style={{ transform: `translateX(${dx}px) rotate(${tilt}deg)`, transition: start.current ? 'none' : 'transform 0.2s' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') setFlipped((f) => !f);
            if (e.key === 'ArrowRight') answer(true);
            if (e.key === 'ArrowLeft') answer(false);
          }}
          aria-label="Карточка: нажми, чтобы перевернуть"
        >
          <span className="flash-mark yes">Знаю</span>
          <span className="flash-mark no">Не знаю</span>
          {!flipped ? (
            <>
              {q.image && <Illustration img={q.image} />}
              <h2 className="ex-title">{q.text}</h2>
              <ul className="flash-options">
                {q.options.map((o, i) => (
                  <li key={i}>
                    <b>{LETTERS[i] ?? i + 1}</b> {o}
                  </li>
                ))}
              </ul>
              <small className="muted">Нажми, чтобы увидеть ответ</small>
            </>
          ) : (
            <>
              <small className="muted">Правильный ответ</small>
              <h2 className="ex-title flash-answer">
                {LETTERS[q.correct]}. {q.options[q.correct]}
              </h2>
              <p>{q.explanation}</p>
              {q.rule && <div className="fb-rule">ПДД, {q.rule}</div>}
            </>
          )}
        </div>
        <p className="muted small center">Свайп вправо — знаю, влево — не знаю</p>
      </div>

      <div className="lesson-footer idle">
        <div className="footer-inner flash-btns">
          <Btn big variant="red" onClick={() => answer(false)}>
            Не знаю
          </Btn>
          <Btn big variant="green" onClick={() => answer(true)}>
            Знаю
          </Btn>
        </div>
      </div>
    </div>
  );
}
