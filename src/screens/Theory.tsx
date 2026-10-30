import { useEffect, useMemo, useRef, useState } from 'react';
import type { TopicId } from '../types';
import { THEORY } from '../data/theory';
import { shuffle, topicById } from '../data/course';
import { useProgress } from '../store';
import { play } from '../sound';
import { Illustration } from '../components/Illustration';
import { Inspector } from '../components/Art';
import { BackBtn, Btn, CloseBtn, Confetti, ProgressBar } from '../components/UI';
import { LETTERS } from '../components/Exercises';

/**
 * Теория темы: карточки по одной. После каждой — вопрос «Проверь себя»,
 * без верного ответа дальше не пройти (ошибся — читаешь пояснение и пробуешь снова).
 * В режиме справки (readOnly) вопросов нет — можно просто перелистывать.
 */
export function Theory({
  topic,
  startAt = 0,
  readOnly,
  onClose,
  onDone,
}: {
  topic: TopicId;
  startAt?: number;
  readOnly?: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  const { p } = useProgress();
  const cards = THEORY[topic];
  const t = topicById(topic);
  const [i, setI] = useState(Math.min(startAt, cards.length - 1));
  const [phase, setPhase] = useState<'read' | 'check' | 'done'>('read');
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number[]>([]);
  const card = cards[i];
  const checkRef = useRef<HTMLDivElement>(null);
  // Вопрос появляется под карточкой — прокручиваем к нему.
  useEffect(() => {
    if (phase === 'check') checkRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [phase, i]);

  // Варианты проверки перемешиваем один раз на карточку.
  const order = useMemo(() => (card.check ? shuffle(card.check.options.map((_, k) => k)) : []), [card]);
  const solved = picked !== null && order[picked] === 0;

  const next = () => {
    if (i + 1 >= cards.length) {
      if (readOnly) return onClose();
      play('finish', p.settings.sound);
      setPhase('done');
      return;
    }
    setI(i + 1);
    setPhase('read');
    setPicked(null);
    setWrong([]);
  };

  const pick = (k: number) => {
    if (solved) return;
    setPicked(k);
    if (order[k] === 0) play('correct', p.settings.sound);
    else {
      play('wrong', p.settings.sound);
      setWrong((w) => [...w, k]);
    }
  };

  if (phase === 'done') {
    return (
      <div className="screen-full finish">
        <Confetti />
        <Inspector mood="cheer" size={170} />
        <h1 className="finish-title">Теория пройдена!</h1>
        <p className="muted">
          {t.title}: {cards.length} карточек. Теперь закрепим на практике — с подсказками.
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
        {i > 0 ? <BackBtn onClick={() => (setI(i - 1), setPhase('read'), setPicked(null), setWrong([]))} /> : <CloseBtn onClick={onClose} />}
        <div className="lesson-top-mid">
          <div className="lesson-top-title">
            📖 Теория · {i + 1} из {cards.length}
          </div>
          <ProgressBar value={(i + (phase === 'check' && solved ? 1 : 0)) / cards.length} color={t.color} />
        </div>
        {i > 0 && <CloseBtn onClick={onClose} />}
      </div>

      <div className="lesson-body" key={i}>
        <div className="theory-card">
          <div className="theory-chip" style={{ background: t.color }}>
            {t.emoji} {t.title}
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
              <span className="remember-ico">💡</span>
              <div>
                <b>Запомни</b>
                <div>{card.remember}</div>
              </div>
            </div>
          )}
          {card.rule && <div className="rule-chip">📖 ПДД: {card.rule}</div>}
        </div>

        {phase === 'check' && card.check && (
          <div className="self-check" ref={checkRef}>
            <div className="self-check-head">
              <Inspector mood={solved ? 'cheer' : wrong.length ? 'think' : 'happy'} size={56} />
              <div>
                <small>Проверь себя</small>
                <b>{card.check.q}</b>
              </div>
            </div>
            <div className="options">
              {order.map((orig, k) => {
                let cls = 'option';
                if (wrong.includes(k)) cls += ' crossed';
                if (solved && k === picked) cls += ' correct';
                return (
                  <button key={k} className={cls} disabled={solved || wrong.includes(k)} onClick={() => pick(k)} data-ok={import.meta.env.DEV && orig === 0 ? '' : undefined}>
                    <span className="opt-key">{LETTERS[k]}</span>
                    <span className="opt-text">{card.check!.options[orig]}</span>
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className={`check-note ${solved ? 'ok' : 'bad'}`}>
                {solved ? '✔ Верно! ' : '✖ Не совсем. Перечитай карточку выше и попробуй ещё раз. '}
                {solved && card.check.explain}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="lesson-footer idle">
        <div className="footer-inner">
          {phase === 'read' && card.check && !readOnly ? (
            <Btn big wide onClick={() => setPhase('check')}>
              Понятно, проверить себя
            </Btn>
          ) : phase === 'check' && !solved ? (
            <Btn big wide disabled>
              Выбери ответ
            </Btn>
          ) : (
            <Btn big wide variant={phase === 'check' ? 'yellow' : 'green'} onClick={next}>
              {i + 1 >= cards.length ? (readOnly ? 'Закрыть' : 'Завершить') : 'Дальше'}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
