import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Exercise, TheoryCard, TopicId } from '../types';
import { controlPass } from '../data/course';
import { useProgress } from '../store';
import { play } from '../sound';
import { LETTERS, MultipleChoice, type Status } from '../components/Exercises';
import { BackBtn, Btn, Confetti, ProgressBar, StatTile } from '../components/UI';
import { Theory } from './Theory';
import { UiIcon } from '../components/Icons';
import { isTicketQuestion } from '../data/tickets';
import { topicUnits } from '../data/units';
import { hintFor, optionToDrop } from '../data/hints';

export type LessonMode = 'practice' | 'control' | 'review' | 'quiz' | 'drill';

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

const exId = (e: Exercise) => e.q.id;
/** Сколько раз задание может вернуться в конец урока. */
const REQUEUE_MAX: Partial<Record<LessonMode, number>> = { practice: 1, review: 1, drill: 3 };

export function Lesson({
  mode,
  title,
  color,
  topic,
  exercises,
  onClose,
  onFinish,
  onRestart,
  theoryCards,
}: {
  mode: LessonMode;
  title: string;
  color: string;
  topic?: TopicId;
  /** Теория блока: её открывает кнопка «Теория» вместо теории всей темы. */
  theoryCards?: TheoryCard[];
  exercises: Exercise[];
  onClose: () => void;
  onFinish: (r: LessonResult) => void;
  onRestart?: () => void;
}) {
  const { p, record, fixMistake, toggleBookmark } = useProgress();
  const sound = p.settings.sound;
  const canHint = mode === 'practice' || mode === 'drill' || mode === 'review';

  const [queue, setQueue] = useState<Exercise[]>(exercises);
  const [pos, setPos] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [crossed, setCrossed] = useState<number[]>([]);
  const [hintShown, setHintShown] = useState(false);
  const [dropped, setDropped] = useState<number[]>([]);
  const [sheet, setSheet] = useState(false);
  const [requeued, setRequeued] = useState<Record<string, number>>({});
  const [solved, setSolved] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [xp, setXp] = useState(0);
  const [gained, setGained] = useState(0);
  const [praise, setPraise] = useState(PRAISE[0]);
  const [phase, setPhase] = useState<'play' | 'done'>('play');
  const [theoryOpen, setTheoryOpen] = useState(false);
  const [startedAt] = useState(Date.now());

  const ex = queue[pos];
  const total = exercises.length;
  const q = ex ? ex.q : null;
  const canCheck = (status === 'idle' || status === 'retry') && !sheet && selected !== null && !crossed.includes(selected) && !dropped.includes(selected);

  const finalize = useCallback(
    (ok: boolean, clean: boolean) => {
      // Итог по заданию: статистика, ошибки, опыт.
      if (q) {
        const isSign = SIGN_TOPICS.includes(q.topic);
        record(q.id, q.topic, ok && clean, { sign: isSign });
        if (mode === 'review' && ok) fixMistake(q.id);
      }
      const id = ex ? exId(ex) : '';
      // Ошибочное задание вернётся в конце урока; в тренировке билетов — и решённое с подсказкой.
      const again = !!ex && (!ok || (mode === 'drill' && !clean)) && (requeued[id] ?? 0) < (REQUEUE_MAX[mode] ?? 0);
      if (again) {
        setRequeued((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }));
        setQueue((qq) => [...qq, ex]);
      }
      if (ok) {
        const g = clean ? 5 : 2;
        setGained(g);
        setXp((x) => x + g);
        if (!again) setSolved((s) => s + 1);
        if (clean) setFirstTry((f) => f + 1);
        setPraise(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
        play('correct', sound);
      } else {
        setGained(0);
        play('wrong', sound);
        if (mode === 'control' || mode === 'quiz' || (mode === 'drill' && !again)) setSolved((s) => s + 1);
      }
      setStatus(ok ? 'right' : 'wrong');
      setSheet(true);
    },
    [q, ex, mode, record, fixMistake, sound, requeued],
  );

  const check = useCallback(() => {
    if (!ex || !canCheck) return;
    const ok = selected === ex.q.correct;
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
    setDropped([]);
    setSheet(false);
  }, [pos, queue.length, sound]);

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
      if (!sheet && n >= 1 && n <= 4 && ex) {
        if (n <= ex.q.options.length && !crossed.includes(n - 1) && !dropped.includes(n - 1)) setSelected(n - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, theoryOpen, sheet, status, check, next, ex, crossed, dropped]);

  const correctTotal = mode === 'control' || mode === 'quiz' ? firstTry : solved;
  const passed = mode === 'control' ? firstTry >= controlPass(total) : true;
  const bonus = mode === 'control' ? (passed ? 20 + (firstTry === total ? 10 : 0) : 0) : mode === 'practice' || mode === 'drill' ? 10 : 5;

  if (theoryOpen && topic) return <Theory topic={topic} cards={theoryCards ?? topicUnits(topic).flatMap((u) => u.cards)} title={theoryCards && title} readOnly onClose={() => setTheoryOpen(false)} />;

  if (phase === 'done') {
    const acc = Math.round((firstTry / total) * 100);
    const secs = Math.round((Date.now() - startedAt) / 1000);
    const finalXp = xp + bonus;
    return (
      <div className={`screen-full finish v3 ${passed ? 'ok' : 'bad'}`}>
        {passed && <Confetti />}
        <FinishHero mood={passed ? 'cheer' : 'sad'}>
          {mode === 'control' && (
            <span className="finish-score">
              <b>{firstTry}</b> из {total}
            </span>
          )}
        </FinishHero>
        <div className="finish-body">
        {mode === 'control' ? (
          <>
            <h1 className={`finish-title ${passed ? '' : 'bad'}`}>{passed ? 'Контрольная сдана!' : 'Пока не сдано'}</h1>
            <p className="muted">
              {passed
                ? firstTry === total
                  ? 'Ни одной ошибки — тема освоена на отлично!'
                  : 'Тема освоена. Ошибки добавлены в «Повторение».'
                : `Нужно минимум ${controlPass(total)} верных ответов. Повтори теорию и попробуй снова — у тебя получится!`}
            </p>
          </>
        ) : (
          <>
            <h1 className="finish-title">{mode === 'review' ? 'Повторение завершено!' : mode === 'drill' ? 'Тренировка пройдена!' : 'Урок пройден!'}</h1>
            <p className="muted">
              {mode === 'drill'
                ? `С первого раза: ${Math.min(firstTry, total)} из ${total}. Вопросы с ошибками вернутся в следующей тренировке, пока не будут решены без ошибок.`
                : title}
            </p>
          </>
        )}
        <div className="tiles">
          <StatTile label="опыт" value={`+${finalXp}`} icon={<UiIcon id="star" size={26} />} />
          <StatTile label="точность" value={`${Math.min(100, acc)}%`} icon={<UiIcon id="target" size={26} />} />
          <StatTile label="время" value={`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`} icon={<UiIcon id="clock" size={26} />} />
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
      </div>
    );
  }

  if (!ex) return null;

  const correctText = `${LETTERS[ex.q.correct]}. ${ex.q.options[ex.q.correct]}`;
  const explanation = ex.q.explanation;
  const hint = hintFor(ex.q);
  const showHint = () => {
    setHintShown(true);
    const d = optionToDrop(ex.q, selected, crossed);
    if (d !== null) setDropped([d]);
  };

  return (
    <div className="screen-full lesson">
      <div className="lesson-top">
        <BackBtn native onClick={onClose} />
        <div className="lesson-top-mid">
          <div className="lesson-top-title">
            <span>{title}</span>
            <span className="lesson-count">
              {Math.min(pos + 1, total)} из {total}
            </span>
          </div>
          <ProgressBar value={Math.min(1, solved / total)} color={color} />
        </div>
      </div>

      <div className="lesson-body" key={pos}>
        {pos >= total && <div className="retry-banner">
            <UiIcon id="repeat" size={20} /> Возвращаемся к вопросу с ошибкой
          </div>}
        {q && isTicketQuestion(q) && (
          <div className="ticket-cap">
            <span>
              <UiIcon id="ticket" size={20} /> Билет {q.ticket}, вопрос {q.num}
            </span>
            <button className={`star ${p.bookmarks.includes(q.id) ? 'on' : ''}`} onClick={() => toggleBookmark(q.id)} aria-label="В закладки">
              {p.bookmarks.includes(q.id) ? '★' : '☆'}
            </button>
          </div>
        )}
        <MultipleChoice q={ex.q} selected={selected} status={sheet ? status : status === 'retry' ? 'retry' : 'idle'} crossed={[...crossed, ...dropped]} onSelect={(i) => (play('tap', sound), setSelected(i))} />

        {canHint && !sheet && (
          <div className="hint-row">
            {hintShown ? (
              <div className="hint-bubble">
                <UiIcon id="bulb" size={24} />
                <div>
                  {hint}
                  {dropped.length > 0 && <small className="hint-drop">Один неверный вариант зачёркнут.</small>}
                  {topic && (
                    <button className="link" onClick={() => setTheoryOpen(true)}>
                      Открыть теорию
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button className="hint-btn" onClick={showHint}>
                <UiIcon id="bulb" size={20} /> Подсказка <small>(меньше XP)</small>
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
                  <span className="fb-badge think"><UiIcon id="bulb" size={30} /></span>
                  <div>
                    <h3>Почти! Подумай ещё раз</h3>
                    <p className="muted">Этот вариант неверный. Вот подсказка:</p>
                  </div>
                </div>
                <div className="fb-expl hint">
                  <UiIcon id="bulb" size={24} />
                  <div>{hint}</div>
                </div>
                <div className="fb-btns">
                  {topic && (
                    <Btn variant="white" onClick={() => setTheoryOpen(true)}>
                      <UiIcon id="book" size={20} /> Теория
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
                  <span className={`fb-badge ${status}`}>{status === 'right' ? <UiIcon id="check" size={30} /> : <UiIcon id="cross" size={30} />}</span>
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
                    {q?.rule && <div className="fb-rule">ПДД, {q.rule}</div>}
                  </div>
                </div>
                <div className="fb-btns">
                  {status === 'wrong' && topic && (
                    <Btn variant="white" onClick={() => setTheoryOpen(true)}>
                      <UiIcon id="book" size={20} /> Теория
                    </Btn>
                  )}
                  <Btn big variant={status === 'right' ? 'green' : 'red'} onClick={next}>
                    {status === 'right' ? 'Дальше' : 'Понятно'}
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

/** Шапка итогового экрана: крупный значок результата на цветном фоне. */
function FinishHero({ mood, children }: { mood: 'cheer' | 'sad'; children?: ReactNode }) {
  return (
    <div className="finish-hero">
      <span className="finish-badge">{mood === 'cheer' ? <UiIcon id="check" size={52} /> : <UiIcon id="cross" size={52} />}</span>
      {children}
    </div>
  );
}
