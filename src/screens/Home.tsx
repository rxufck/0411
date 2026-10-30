import type { TopicId } from '../types';
import { CONTROL_PASS, CONTROL_SIZE, isUnlocked, STAGES, STEPS, type StepKind, TOPICS, topicById } from '../data/course';
import { THEORY } from '../data/theory';
import { useProgress } from '../store';
import { TopicThumb } from '../components/Art';
import { Btn, ProfileHeader, Sheet } from '../components/UI';
import { DAILY_TASKS } from '../data/goals';

const ROW = 104;
const OFFSETS = [0, 56, 92, 56, 0, -56, -92, -56];

export function Home({
  onTopic,
  onExam,
  onDaily,
  onProfile,
}: {
  onTopic: (t: TopicId) => void;
  onExam: () => void;
  onDaily: () => void;
  onProfile: () => void;
}) {
  const { p } = useProgress();
  const dailyDone = DAILY_TASKS.filter((t) => t.progress(p) >= t.goal).length;
  const allDone = TOPICS.every((t) => (p.steps[t.topic] ?? 0) >= 4);
  let n = 0;

  return (
    <div className="home">
      <ProfileHeader onProfile={onProfile} />
      <div className="path-title">
        <h1>Твой путь</h1>
        <p className="muted">Проходи темы по шагам: теория → практика → закрепление → контрольная.</p>
      </div>

      <button className="daily-chip" onClick={onDaily}>
        <span className="daily-ico">🎯</span>
        <span>
          <b>Задания на день</b>
          <small>
            Выполнено {dailyDone} из {DAILY_TASKS.length}
          </small>
        </span>
        <span className="chev">›</span>
      </button>

      {STAGES.map((st, si) => (
        <section key={si} className="stage">
          <div className="stage-head">
            <span className="stage-num">Этап {si + 1}</span>
            <b>{st.title}</b>
            <small>{st.subtitle}</small>
          </div>
          <div className="stage-path" style={{ height: st.topics.length * ROW }}>
            {st.topics.map((tid, k) => {
              const gi = TOPICS.findIndex((x) => x.topic === tid);
              const t = TOPICS[gi];
              const steps = p.steps[tid] ?? 0;
              const open = isUnlocked(gi, p.steps);
              const done = steps >= 4;
              const off = OFFSETS[gi % OFFSETS.length];
              const nextOff = OFFSETS[(gi + 1) % OFFSETS.length];
              n += 1;
              return (
                <div key={tid} className="pnode" style={{ top: k * ROW, transform: `translateX(${off}px)` }}>
                  {k < st.topics.length - 1 && (
                    <svg className="pconn" width={240} height={ROW} viewBox={`-120 0 240 ${ROW}`}>
                      <path
                        d={`M0 40 C0 ${ROW * 0.7}, ${nextOff - off} ${ROW * 0.4}, ${nextOff - off} ${ROW + 40}`}
                        stroke={(p.steps[tid] ?? 0) >= 2 ? '#7fd88a' : '#dbe5f0'}
                        strokeWidth={14}
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                  <button className={`pnode-btn ${open ? '' : 'locked'}`} disabled={!open} onClick={() => onTopic(tid)}>
                    <div className={`pnode-ring ${done ? 'done' : open && steps < 4 ? 'current' : ''}`}>
                      <TopicThumb thumb={t.thumb} size={74} locked={!open} />
                      {done && <span className="pnode-check">✓</span>}
                    </div>
                    <div className="pnode-text">
                      <b style={{ color: open ? undefined : '#9aa5b4' }}>
                        {n}. {t.title}
                      </b>
                      <span className="pnode-meta">
                        {open ? '🟢' : '🔒'} {steps}/4 {done && '⭐'}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="stage">
        <div className="stage-head">
          <span className="stage-num">Финиш</span>
          <b>Экзамен</b>
          <small>Билеты в формате ГИБДД</small>
        </div>
        <button className="pnode-btn final" onClick={onExam}>
          <div className={`pnode-ring ${allDone ? 'current' : ''}`}>
            <TopicThumb thumb={{ emoji: '🏁' }} size={74} />
          </div>
          <div className="pnode-text">
            <b>{n + 1}. Экзамен</b>
            <span className="pnode-meta">{p.exams.some((e) => e.passed) ? '✅ сдан' : '20 вопросов'}</span>
          </div>
        </button>
      </section>
    </div>
  );
}

/** Карточка темы: четыре шага обучения. */
export function TopicSheet({
  topic,
  onClose,
  onStep,
  onReread,
  onOfficial,
  officialCount,
}: {
  topic: TopicId;
  onClose: () => void;
  onStep: (k: StepKind) => void;
  onReread: () => void;
  onOfficial: () => void;
  officialCount: number;
}) {
  const { p } = useProgress();
  const t = topicById(topic);
  const steps = p.steps[topic] ?? 0;
  const best = p.best[topic];
  return (
    <Sheet onClose={onClose}>
      <div className="tsheet-head">
        <TopicThumb thumb={t.thumb} size={84} />
        <div>
          <small className="muted">{t.chapter} ПДД</small>
          <h2>{t.title}</h2>
          <p className="muted">{t.subtitle}</p>
        </div>
      </div>
      <div className="steps">
        {STEPS.map((s, i) => {
          const done = steps > i;
          const current = steps === i;
          return (
            <div key={s.kind} className={`step ${done ? 'done' : current ? 'current' : 'locked'}`}>
              <div className="step-ico" style={current ? { background: t.color } : undefined}>
                {done ? '✓' : s.icon}
              </div>
              <div className="step-text">
                <b>
                  Шаг {i + 1}. {s.title}
                </b>
                <small>
                  {s.kind === 'theory' ? `${THEORY[topic].length} карточек · ` : ''}
                  {s.kind === 'control' ? `${CONTROL_SIZE} вопросов, нужно ${CONTROL_PASS} верных` : s.desc}
                  {s.kind === 'control' && best !== undefined ? ` · лучший: ${best}/${CONTROL_SIZE}` : ''}
                </small>
              </div>
              {current && (
                <Btn onClick={() => onStep(s.kind)} className="step-go">
                  Начать
                </Btn>
              )}
              {done && (
                <button className="step-redo" onClick={() => onStep(s.kind)}>
                  ↻
                </button>
              )}
              {!done && !current && <span className="step-lock">🔒</span>}
            </div>
          );
        })}
      </div>
      {officialCount > 0 && (
        <button className="official-btn" onClick={onOfficial}>
          <span className="hub-ico blue">🎫</span>
          <span className="hub-text">
            <b>Вопросы из билетов ГИБДД</b>
            <small>{officialCount} настоящих экзаменационных вопросов по теме</small>
          </span>
          <span className="chev">›</span>
        </button>
      )}
      {steps > 0 && (
        <Btn variant="white" wide onClick={onReread}>
          📖 Перечитать теорию
        </Btn>
      )}
    </Sheet>
  );
}
