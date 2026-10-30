import { useCallback, useEffect, useState } from 'react';
import type { Exercise, TopicId } from '../types';
import { CONTROL_PASS } from '../data/course';
import { useProgress } from '../store';
import { play } from '../sound';
import { FindSign, LETTERS, MatchPairs, MultipleChoice, type Status } from '../components/Exercises';
import { Inspector } from '../components/Art';
import { BackBtn, Btn, Confetti, fmtMs, ProgressBar, StatTile, useHearts } from '../components/UI';
import { Theory } from './Theory';
import { isTicketQuestion } from '../data/tickets';

export type LessonMode = 'practice' | 'control' | 'review' | 'quiz';

export interface LessonResult {
  xp: number;
  correct: number;
  total: number;
  /** Сколько заданий решено до конца (меньше total, если урок прерван). */
  answered: number;
  passed: boolean;
}

const PRAISE = ['Отлично!', 'Супер!', 'Так держать!', 'Верно!', 'Молодец!', 'Великолепно!'];
const SIGN_TOPICS: TopicId[] = ['warning', 'priority', 'prohib', 'mandatory'];

const exId = (e: Exercise) => (e.type === 'mc' ? e.q.id : e.id);

export function Lesson({
  mode,
  title,
  color,
  topic,
  exercises,
  onClose,
  onFinish,
  onRestart,
  onReview,
}: {
  mode: LessonMode;
  title: string;
  color: string;
  topic?: TopicId;
  exercises: Exercise[];
  onClose: () => void;
  onFinish: (r: LessonResult) => void;
  onRestart?: () => void;
  onReview?: () => void;
}) {
  const { p, record, loseHeart, fixMistake, toggleBookmark } = useProgress();
  const sound = p.settings.sound;
  const usesHearts = mode === 'practice' || mode === 'control';
  const canHint = mode === 'practice';
  const { hearts, nextIn } = useHearts();

  const [queue, setQueue] = useState<Exercise[]>(exercises);
  const [pos, setPos] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [crossed, setCrossed] = useState<number[]>([]);
  const [hintShown, setHintShown] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [matchDone, setMatchDone] = useState(false);
  const [requeued, setRequeued] = useState<Set<string>>(new Set());
  const [solved, setSolved] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [xp, setXp] = useState(0);
  const [gained, setGained] = useState(0);
  const [praise, setPraise] = useState(PRAISE[0]);
  const [phase, setPhase] = useState<'play' | 'done' | 'failed'>('play');
  const [theoryOpen, setTheoryOpen] = useState(false);
  const [startedAt] = useState(Date.now());

  const ex = queue[pos];
  const total = exercises.length;
  const q = ex?.type === 'mc' ? ex.q : null;
  const canCheck = (status === 'idle' || status === 'retry') && !sheet && (ex?.type === 'match' ? matchDone : selected !== null && !crossed.includes(selected));

  const finalize = useCallback(
    (ok: boolean, clean: boolean) => {
      // Итог по заданию: статистика, ошибки, сердечки, опыт.
      if (q) {
        const isSign = SIGN_TOPICS.includes(q.topic);
        record(q.id, q.topic, ok && clean, { sign: isSign });
        if (mode === 'review' && ok) fixMistake(q.id);
      }
      if (ok) {
        const g = clean ? 5 : 2;
        setGained(g);
        setXp((x) => x + g);
        setSolved((s) => s + 1);
        if (clean) setFirstTry((f) => f + 1);
        setPraise(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
        play('correct', sound);
      } else {
        setGained(0);
        play('wrong', sound);
        if (usesHearts) loseHeart();
        const id = ex ? exId(ex) : '';
        // В практике и повторении ошибочное задание вернётся в конце урока.
        if ((mode === 'practice' || mode === 'review') && ex && !requeued.has(id)) {
          setRequeued((r) => new Set(r).add(id));
          setQueue((qq) => [...qq, ex]);
        }
        if (mode === 'control' || mode === 'quiz') setSolved((s) => s + 1);
      }
      setStatus(ok ? 'right' : 'wrong');
      setSheet(true);
    },
    [q, ex, mode, record, fixMistake, sound, usesHearts, loseHeart, requeued],
  );

  const check = useCallback(() => {
    if (!ex || !canCheck) return;
    if (ex.type === 'match') return finalize(true, true);
    const ok = ex.type === 'mc' ? selected === ex.q.correct : ex.choices[selected!]?.id === ex.id.replace('find-', '');
    if (ok) return finalize(true, crossed.length === 0 && !hintShown);
    // В практике первая ошибка — не провал: подсказка и вторая попытка.
    if (canHint && crossed.length === 0) {
      play('wrong', sound);
      setCrossed([selected!]);
      setStatus('retry');
      setSheet(true);
      return;
    }
    finalize(false, false);
  }, [ex, canCheck, selected, crossed, hintShown, canHint, sound, finalize]);

  const next = useCallback(() => {
    if (usesHearts && hearts <= 0) {
      setPhase('failed');
      return;
    }
    const last = pos + 1 >= queue.length;
    if (last) {
      play('finish', sound);
      setPhase('done');
      return;
    }
    setPos(pos + 1);
    setSelected(null);
    setStatus('idle');
    setCrossed([]);
    setHintShown(false);
    setSheet(false);
    setMatchDone(false);
  }, [usesHearts, hearts, pos, queue.length, sound]);

  const tryAgain = () => {
    setSheet(false);
    setSelected(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'play' || theoryOpen) return;
      if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
        if (!sheet) check();
        else if (status === 'retry') tryAgain();
        else next();
      }
      const n = Number(e.key);
      if (!sheet && n >= 1 && n <= 4 && ex && ex.type !== 'match') {
        const count = ex.type === 'mc' ? ex.q.options.length : ex.choices.length;
        if (n <= count && !crossed.includes(n - 1)) setSelected(n - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, theoryOpen, sheet, status, check, next, ex, crossed]);

  const correctTotal = mode === 'control' || mode === 'quiz' ? firstTry : solved;
  const passed = mode === 'control' ? firstTry >= CONTROL_PASS : true;
  const bonus = mode === 'control' ? (passed ? 20 + (firstTry === total ? 10 : 0) : 0) : mode === 'practice' ? 10 : 5;

  if (theoryOpen && topic) return <Theory topic={topic} readOnly onClose={() => setTheoryOpen(false)} />;

  if (phase === 'done') {
    const acc = Math.round((firstTry / total) * 100);
    const secs = Math.round((Date.now() - startedAt) / 1000);
    const finalXp = xp + bonus;
    return (
      <div className="screen-full finish">
        {passed && <Confetti />}
        <Inspector mood={passed ? 'cheer' : 'sad'} size={170} />
        {mode === 'control' ? (
          <>
            <h1 className={`finish-title ${passed ? '' : 'bad'}`}>{passed ? 'Контрольная сдана!' : 'Пока не сдано'}</h1>
            <div className={`score-ring ${passed ? 'ok' : 'bad'}`}>
              {firstTry}/{total}
            </div>
            <p className="muted">
              {passed
                ? firstTry === total
                  ? 'Ни одной ошибки — тема освоена на отлично!'
                  : 'Тема освоена. Ошибки добавлены в «Повторение».'
                : `Нужно минимум ${CONTROL_PASS} верных ответов. Повтори теорию и попробуй снова — у тебя получится!`}
            </p>
          </>
        ) : (
          <>
            <h1 className="finish-title">{mode === 'review' ? 'Повторение завершено!' : 'Урок пройден!'}</h1>
            <p className="muted">{title}</p>
          </>
        )}
        <div className="tiles">
          <StatTile label="опыт" value={`+${finalXp}`} icon="💎" />
          <StatTile label="точность" value={`${Math.min(100, acc)}%`} icon="🎯" />
          <StatTile label="время" value={`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`} icon="⏱" />
        </div>
        <Btn big wide variant="yellow" onClick={() => onFinish({ xp: finalXp, correct: correctTotal, total, answered: total, passed })}>
          Далее
        </Btn>
        {!passed && onRestart && (
          <Btn wide variant="ghost" onClick={onRestart}>
            Попробовать ещё раз
          </Btn>
        )}
      </div>
    );
  }

  if (phase === 'failed') {
    return (
      <div className="screen-full finish">
        <Inspector mood="sad" size={170} />
        <h1 className="finish-title bad">Сердечки закончились</h1>
        <p className="muted">
          Не беда! Новое сердечко появится через <b>{fmtMs(nextIn)}</b>. А пока исправь ошибки в «Повторении» — за каждую исправленную ошибку вернётся сердечко.
        </p>
        {onReview && (
          <Btn big wide onClick={onReview}>
            Исправить ошибки
          </Btn>
        )}
        <Btn wide variant="ghost" onClick={() => onFinish({ xp, correct: correctTotal, total, answered: solved, passed: false })}>
          Выйти
        </Btn>
      </div>
    );
  }

  if (!ex) return null;

  const correctText = q ? `${LETTERS[q.correct]}. ${q.options[q.correct]}` : ex.type === 'findSign' ? `знак ${ex.id.replace('find-', '')}` : '';
  const explanation = q ? q.explanation : ex.type === 'findSign' ? ex.explanation : 'Все пары собраны!';
  const hint = q?.hint ?? (q?.rule ? `Вспомни правило: ${q.rule}.` : 'Посмотри на форму и цвет знаков.');

  return (
    <div className="screen-full lesson">
      <div className="lesson-top">
        <BackBtn onClick={onClose} />
        <div className="lesson-top-mid">
          <div className="lesson-top-title">
            {title} · {Math.min(pos + 1, total)} из {total}
          </div>
          <ProgressBar value={solved / total} color={color} />
        </div>
        {usesHearts ? (
          <div className={`hearts ${status === 'wrong' ? 'shake' : ''}`}>
            ❤️ <b>{hearts}</b>
          </div>
        ) : null}
      </div>

      <div className="lesson-body" key={pos}>
        {pos >= total && <div className="retry-banner">🔁 Возвращаемся к вопросу с ошибкой</div>}
        {q && isTicketQuestion(q) && (
          <div className="ticket-cap">
            <span>
              🎫 Билет {q.ticket}, вопрос {q.num}
            </span>
            <button className={`star ${p.bookmarks.includes(q.id) ? 'on' : ''}`} onClick={() => toggleBookmark(q.id)} aria-label="В закладки">
              {p.bookmarks.includes(q.id) ? '★' : '☆'}
            </button>
          </div>
        )}
        {ex.type === 'mc' && <MultipleChoice q={ex.q} selected={selected} status={sheet ? status : status === 'retry' ? 'retry' : 'idle'} crossed={crossed} onSelect={(i) => (play('tap', sound), setSelected(i))} />}
        {ex.type === 'findSign' && (
          <FindSign target={ex.target} choices={ex.choices} correctId={ex.id.replace('find-', '')} selected={selected} status={sheet ? status : 'idle'} onSelect={(i) => (play('tap', sound), setSelected(i))} />
        )}
        {ex.type === 'match' && <MatchPairs pairs={ex.pairs} onDone={() => (play('correct', sound), setMatchDone(true))} onMiss={() => play('wrong', sound)} />}

        {canHint && !sheet && ex.type !== 'match' && (
          <div className="hint-row">
            {hintShown ? (
              <div className="hint-bubble">
                <span>💡</span>
                <div>
                  {hint}
                  {topic && (
                    <button className="link" onClick={() => setTheoryOpen(true)}>
                      Открыть теорию →
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button className="hint-btn" onClick={() => setHintShown(true)}>
                💡 Подсказка <small>(меньше XP)</small>
              </button>
            )}
          </div>
        )}
      </div>

      {!sheet ? (
        <div className="lesson-footer idle">
          <div className="footer-inner">
            <Btn big wide disabled={!canCheck} onClick={check}>
              Проверить
            </Btn>
          </div>
        </div>
      ) : (
        <div className={`fb-sheet ${status}`}>
          <div className="fb-inner">
            {status === 'retry' ? (
              <>
                <div className="fb-head">
                  <Inspector mood="think" size={70} />
                  <div>
                    <h3>Почти! Подумай ещё раз</h3>
                    <p className="muted">Этот вариант неверный. Вот подсказка:</p>
                  </div>
                </div>
                <div className="fb-expl hint">
                  <span className="fb-ico">💡</span>
                  <div>{hint}</div>
                </div>
                <div className="fb-btns">
                  {topic && (
                    <Btn variant="white" onClick={() => setTheoryOpen(true)}>
                      📖 Теория
                    </Btn>
                  )}
                  <Btn big variant="orange" onClick={tryAgain}>
                    Попробовать ещё
                  </Btn>
                </div>
              </>
            ) : (
              <>
                <div className="fb-head">
                  <Inspector mood={status === 'right' ? 'cheer' : 'sad'} size={70} />
                  <div>
                    <h3>{status === 'right' ? praise : 'Неправильно'}</h3>
                    {status === 'right' ? (
                      <div className="fb-xp">
                        <span>★</span> +{gained} XP
                      </div>
                    ) : (
                      correctText && (
                        <p className="fb-answer">
                          Правильный ответ: <b>{correctText}</b>
                        </p>
                      )
                    )}
                  </div>
                </div>
                <div className="fb-expl">
                  <span className="fb-ico">i</span>
                  <div>
                    <b>Объяснение</b>
                    <div>{explanation}</div>
                    {q?.rule && <div className="fb-rule">📖 ПДД: {q.rule}</div>}
                  </div>
                </div>
                <div className="fb-btns">
                  {status === 'wrong' && topic && (
                    <Btn variant="white" onClick={() => setTheoryOpen(true)}>
                      📖 Теория
                    </Btn>
                  )}
                  <Btn big variant="yellow" onClick={next}>
                    Далее
                  </Btn>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
