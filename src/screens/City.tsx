import { useEffect, useMemo, useState } from 'react';
import { CITY_TASKS, type CityTask } from '../data/city';
import { shuffle } from '../data/course';
import { useProgress } from '../store';
import { play, speak } from '../sound';
import { PATH_COLORS, type PathMark, Scene } from '../components/Scene';
import { Instructor } from '../components/Pictures';
import { Inspector as Mascot } from '../components/Art';
import { Btn, CloseBtn, Confetti, StatTile } from '../components/UI';

const RIDE_LEN = 8;

interface Answer {
  task: CityTask;
  ok: boolean;
}

export function CityScreen() {
  const { p } = useProgress();
  const [ride, setRide] = useState<CityTask[] | null>(null);

  if (ride) return <Ride tasks={ride} onExit={() => setRide(null)} onAgain={() => setRide(shuffle(CITY_TASKS).slice(0, RIDE_LEN))} />;

  return (
    <div className="page city-menu">
      <h1 className="page-title">Поездка по городу</h1>
      <div className="card city-hero">
        <div className="city-hero-top">
          <Instructor size={84} />
          <div className="bubble">
            Привет! Я твой инструктор, Сергей Петрович. Садись за руль — поедем по городу. Я буду говорить, куда ехать, а ты выбирай, <b>как</b> это сделать по правилам.
          </div>
        </div>
        <ul className="city-points">
          <li>🛣️ Выбирай траекторию поворота и полосу</li>
          <li>🚦 Решай, кто проедет первым</li>
          <li>🦊 Осторожно: иногда я хитрю и даю команду, которую выполнять нельзя!</li>
        </ul>
        <Btn big wide onClick={() => setRide(shuffle(CITY_TASKS).slice(0, RIDE_LEN))}>
          Поехали! 🚗
        </Btn>
      </div>
      <div className="tiles">
        <StatTile label="Поездок" value={p.rides} icon="🚗" />
        <StatTile label="Рекорд" value={`${p.bestRide}/${RIDE_LEN}`} icon="🏆" />
      </div>
    </div>
  );
}

function Ride({ tasks, onExit, onAgain }: { tasks: CityTask[]; onExit: () => void; onAgain: () => void }) {
  const { p, addXp, finishRide } = useProgress();
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [finished, setFinished] = useState(false);
  const [replay, setReplay] = useState(0);

  const task = tasks[idx];
  const options = task?.options ?? [];
  const correct = options.find((o) => o.correct)!;
  const ok = chosen === correct?.id;

  useEffect(() => {
    if (task && !finished) speak(task.command, p.settings.voice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, finished]);

  const marks = useMemo(() => {
    if (task?.kind !== 'path') return undefined;
    const m: Record<string, PathMark> = {};
    options.forEach((o) => {
      if (!checked) m[o.id] = chosen === o.id ? 'chosen' : chosen ? 'dim' : 'idle';
      else m[o.id] = o.correct ? 'correct' : o.id === chosen ? 'wrong' : 'dim';
    });
    return m;
  }, [task, options, chosen, checked]);

  const go = () => {
    if (!chosen) return;
    setChecked(true);
    setPlaying(true);
    play(ok ? 'correct' : 'wrong', p.settings.sound);
    setAnswers((a) => [...a, { task, ok }]);
  };

  const next = () => {
    if (idx + 1 >= tasks.length) {
      const score = answers.filter((a) => a.ok).length;
      finishRide(score, tasks.length);
      addXp(score * 3 + 5);
      play('finish', p.settings.sound);
      setFinished(true);
      return;
    }
    setIdx(idx + 1);
    setChosen(null);
    setChecked(false);
    setPlaying(false);
  };

  if (finished) {
    const score = answers.filter((a) => a.ok).length;
    const bad = answers.filter((a) => !a.ok);
    return (
      <div className="page ride-end">
        {score >= tasks.length - 1 && <Confetti />}
        <div className="verdict ok">
          <Mascot mood={score >= tasks.length - 2 ? 'cheer' : 'think'} size={120} />
          <h1>Поездка окончена!</h1>
          <p>
            Верных решений: <b>{score}</b> из {tasks.length}
          </p>
          <div className="stars">{'⭐'.repeat(Math.max(1, Math.round((score / tasks.length) * 3)))}</div>
        </div>
        <div className="tiles">
          <StatTile label="Опыт" value={`+${score * 3 + 5}`} icon="⚡" />
          <StatTile label="Без ошибок" value={`${Math.round((score / tasks.length) * 100)}%`} icon="🎯" />
        </div>
        {bad.length > 0 && (
          <>
            <h2 className="section-title">Что повторить</h2>
            {bad.map(({ task: t }) => (
              <div key={t.id} className="card review">
                <div className="review-q">
                  📍 {t.place}: «{t.command}»
                </div>
                <div className="review-right">✔ {t.options.find((o) => o.correct)?.label}</div>
                <div className="feedback-expl">{t.explanation}</div>
                {t.rule && <div className="feedback-rule">📖 {t.rule}</div>}
              </div>
            ))}
          </>
        )}
        <Btn big wide onClick={onAgain}>
          Ещё поездка
        </Btn>
        <Btn wide variant="ghost" onClick={onExit}>
          В меню
        </Btn>
      </div>
    );
  }

  const scene = playing && task.sceneAfter ? task.sceneAfter : task.scene;
  const playerMove = task.kind === 'path' ? correct.move : undefined;

  return (
    <div className="screen-full ride">
      <div className="lesson-top">
        <CloseBtn onClick={onExit} />
        <div className="route">
          <div className="route-line" />
          {tasks.map((_, i) => (
            <div key={i} className={`route-stop ${i < idx ? 'past' : ''} ${i === idx ? 'now' : ''} ${answers[i] ? (answers[i].ok ? 'ok' : 'bad') : ''}`} />
          ))}
          <div className="route-car" style={{ left: `${(idx / (tasks.length - 1)) * 100}%` }}>
            🚗
          </div>
        </div>
      </div>

      <div className="ride-body" key={idx}>
        <div className="ride-place">📍 {task.place}</div>
        <div className="instructor-row">
          <Instructor size={58} />
          <div className="bubble bubble-cmd">
            {task.command}
            <button className="say-again" onClick={() => speak(task.command, true)} aria-label="Повторить">
              🔊
            </button>
          </div>
        </div>
        <div className="ride-scene">
          <Scene
            key={`${idx}-${replay}`}
            scene={scene}
            paths={task.kind === 'path' ? options.map((o) => ({ id: o.id, move: o.move! })) : undefined}
            marks={marks}
            play={playing}
            playerMove={playerMove}
          />
        </div>
        <h2 className="ex-title">{task.question}</h2>
        <div className="options">
          {options.map((o) => {
            let cls = 'option';
            if (chosen === o.id) cls += ' selected';
            if (checked && o.correct) cls += ' correct';
            if (checked && chosen === o.id && !o.correct) cls += ' wrong';
            return (
              <button
                key={o.id}
                className={cls}
                disabled={checked}
                onClick={() => {
                  play('tap', p.settings.sound);
                  setChosen(o.id);
                }}
              >
                {task.kind === 'path' ? (
                  <span className="opt-key path-key" style={{ background: PATH_COLORS[o.id] }}>
                    {o.id}
                  </span>
                ) : (
                  <span className="opt-key">{o.id}</span>
                )}
                <span className="opt-text">{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`lesson-footer ${checked ? (ok ? 'right' : 'wrong') : 'idle'}`}>
        <div className="footer-inner">
          {!checked ? (
            <>
              <div className="footer-hint muted">{task.kind === 'path' ? 'Выберите траекторию на схеме' : 'Выберите действие'}</div>
              <Btn big disabled={!chosen} onClick={go}>
                Поехали!
              </Btn>
            </>
          ) : (
            <>
              <div className="feedback">
                <div className="feedback-head">
                  <span className="feedback-icon">{ok ? '✔' : '✖'}</span>
                  {ok ? 'Верно! Инструктор доволен' : 'Инструктор нажал на тормоз!'}
                </div>
                {!ok && (
                  <div className="feedback-answer">
                    Правильно: <b>{correct.label}</b>
                  </div>
                )}
                <div className="feedback-expl">{task.explanation}</div>
                {task.rule && <div className="feedback-rule">📖 {task.rule}</div>}
              </div>
              <div className="footer-btns">
                <Btn variant="white" onClick={() => setReplay((r) => r + 1)} aria-label="Повторить анимацию">
                  ↻
                </Btn>
                <Btn big variant={ok ? 'green' : 'red'} onClick={next}>
                  Дальше
                </Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
