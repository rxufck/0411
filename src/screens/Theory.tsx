import { useState } from 'react';
import type { TheoryCard, TopicId } from '../types';
import { topicById } from '../data/course';
import { useProgress } from '../store';
import { play } from '../sound';
import { Illustration } from '../components/Illustration';
import { BackBtn, Btn, CloseBtn, Confetti, ProgressBar } from '../components/UI';
import { UiIcon } from '../components/Icons';

const plural = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'карточка' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'карточки' : 'карточек');

/**
 * Теория блока: карточки по одной, без вопросов — просто читаем и листаем дальше.
 */
export function Theory({
  topic,
  startAt = 0,
  readOnly,
  onClose,
  onDone,
  cards,
  title,
  doneText = 'Теперь закрепим на практике — с подсказками.',
}: {
  topic: TopicId;
  startAt?: number;
  readOnly?: boolean;
  onClose: () => void;
  onDone?: () => void;
  cards: TheoryCard[];
  title?: string;
  doneText?: string;
}) {
  const { p } = useProgress();
  const t = topicById(topic);
  const name = title ?? t.title;
  const [i, setI] = useState(Math.min(startAt, cards.length - 1));
  const [phase, setPhase] = useState<'read' | 'done'>('read');
  const card = cards[i];

  const next = () => {
    if (i + 1 >= cards.length) {
      if (readOnly) return onClose();
      play('finish', p.settings.sound);
      setPhase('done');
      return;
    }
    setI(i + 1);
  };

  if (phase === 'done') {
    return (
      <div className="screen-full finish">
        <Confetti />
        <span className="finish-badge"><UiIcon id="check" size={44} /></span>
        <h1 className="finish-title">Теория пройдена!</h1>
        <p className="muted">
          {name}: {cards.length} {plural(cards.length)}. {doneText}
        </p>
        <div className="xp-badge">+10 XP</div>
        <Btn big wide variant="yellow" onClick={onDone}>
          Далее
        </Btn>
      </div>
    );
  }

  return (
    <div className="screen-full theory">
      <div className="lesson-top">
        {i > 0 ? <BackBtn onClick={() => setI(i - 1)} /> : <CloseBtn onClick={onClose} />}
        <div className="lesson-top-mid">
          <div className="lesson-top-title">
            <UiIcon id="book" size={18} /> Теория, {i + 1} из {cards.length}
          </div>
          <ProgressBar value={(i + 1) / cards.length} color={t.color} />
        </div>
        {i > 0 && <CloseBtn onClick={onClose} />}
      </div>

      <div className="lesson-body" key={i}>
        <div className="theory-card">
          <div className="theory-chip" style={{ background: t.color }}>
            {name}
          </div>
          {card.image && <Illustration img={card.image} />}
          <h2 className="theory-title">{card.title}</h2>
          <p className="theory-text">{card.text}</p>
          {card.points && (
            <ul className="theory-points">
              {card.points.map((pt, k) => (
                <li key={k}>{pt}</li>
              ))}
            </ul>
          )}
          {card.remember && (
            <div className="remember">
              <span className="remember-ico"><UiIcon id="bulb" size={26} /></span>
              <div>
                <b>Запомни</b>
                <div>{card.remember}</div>
              </div>
            </div>
          )}
          {card.rule && <div className="rule-chip"><UiIcon id="book" size={16} /> ПДД: {card.rule}</div>}
        </div>

      </div>

      <div className="lesson-footer idle">
        <div className="footer-inner">
          <Btn big wide variant="green" onClick={next}>
              {i + 1 >= cards.length ? (readOnly ? 'Закрыть' : 'Завершить') : 'Дальше'}
          </Btn>
        </div>
      </div>
    </div>
  );
}
