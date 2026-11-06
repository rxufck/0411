import { openPaywall, usePremium } from '../premium';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildOfficialExam, buildOfficialExtra, EXAM_BLOCKS, type ExamQuestion, findQuestion } from '../data/course';
import { useTickets } from '../data/tickets';
import { useProgress } from '../store';
import { play } from '../sound';
import { Illustration } from '../components/Illustration';
import { BadgeIcon, Btn, CloseBtn, Confetti, Modal, ProfileHeader, Sheet } from '../components/UI';
import { UiIcon } from '../components/Icons';

const BASE_MIN = 20;

type Phase = 'intro' | 'run' | 'extra-info' | 'result';

export function ExamScreen({
  onExit,
  onTicket,
  onOfficialTopic,
  onMarathon,
  onQuestionNo,
  onBookmarks,
  onMistakes,
  onProfile,
}: {
  onExit: () => void;
  onTicket: (n: number) => void;
  onOfficialTopic: (name: string) => void;
  onMarathon: () => void;
  onQuestionNo: (n: number) => void;
  onBookmarks: () => void;
  onMistakes: () => void;
  onProfile: () => void;
}) {
  const [chooser, setChooser] = useState<null | 'tickets' | 'topics' | 'num'>(null);
  const prem = usePremium();
  // Платные в экзамене только «Вопросы по номеру» и «Вопросы по темам».
  const openPaid = (c: 'topics' | 'num') => (prem.active ? setChooser(c) : openPaywall());
  const { db, error } = useTickets();
  const [ticketNo, setTicketNo] = useState<number | null>(null);
  const { p, addExam, addMistakes, addXp } = useProgress();
  const [phase, setPhase] = useState<Phase>('intro');
  const [items, setItems] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [cur, setCur] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [extraBlocks, setExtraBlocks] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<{ passed: boolean; reason: string } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => setPicked(null), [cur]);
  const startRef = useRef(0);

  const start = () => {
    if (!db) return;
    const official = buildOfficialExam(db);
    const qs = official.items;
    setTicketNo(official.ticket);
    setItems(qs);
    setAnswers(qs.map(() => null));
    setCur(0);
    setExtraBlocks([]);
    setVerdict(null);
    startRef.current = Date.now();
    setDeadline(Date.now() + BASE_MIN * 60000);
    setPhase('run');
  };

  // Таймер.
  useEffect(() => {
    if (phase !== 'run') return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [phase]);

  const left = Math.max(0, Math.round((deadline - now) / 1000));

  const finish = (passed: boolean, reason: string, final: ExamQuestion[], ans: (number | null)[]) => {
    const wrong = final.filter((it, i) => ans[i] !== it.q.correct).map((it) => it.q.id);
    addMistakes(wrong, (id) => findQuestion(id)?.topic);
    addExam({ date: new Date().toISOString(), passed, errors: wrong.length, total: final.length });
    addXp(passed ? 30 : 5);
    play(passed ? 'finish' : 'wrong', p.settings.sound);
    setVerdict({ passed, reason });
    setPhase('result');
  };

  useEffect(() => {
    if (phase === 'run' && left === 0) finish(false, 'Время вышло.', items, answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, phase]);

  const evaluate = (ans: (number | null)[]) => {
    const errBase = [0, 0, 0, 0];
    let errExtra = 0;
    items.forEach((it, i) => {
      if (ans[i] === it.q.correct) return;
      if (it.extra) errExtra++;
      else errBase[it.block]++;
    });
    const totalBase = errBase.reduce((a, b) => a + b, 0);
    if (errExtra > 0) return finish(false, 'Ошибка в дополнительных вопросах.', items, ans);
    if (errBase.some((e) => e >= 2)) return finish(false, 'Две ошибки в одном тематическом блоке.', items, ans);
    if (totalBase > 2) return finish(false, 'Больше двух ошибок в основных вопросах.', items, ans);
    if (totalBase === 0) return finish(true, 'Ни одной ошибки — блестяще!', items, ans);
    // Нужны дополнительные вопросы — если их ещё не давали.
    if (extraBlocks.length === 0) {
      const blocks = errBase.flatMap((e, b) => (e ? [b] : []));
      const used = new Set(items.map((it) => it.q.id));
      const extra = blocks.flatMap((b) => (db ? buildOfficialExtra(db, b, used) : []));
      setExtraBlocks(blocks);
      setItems([...items, ...extra]);
      setAnswers([...ans, ...extra.map(() => null)]);
      setDeadline((d) => d + blocks.length * 5 * 60000);
      setCur(items.length);
      setPhase('extra-info');
      return;
    }
    finish(true, 'Дополнительные вопросы решены без ошибок!', items, ans);
  };

  const answer = (i: number) => {
    if (answers[cur] !== null) return;
    const ans = [...answers];
    ans[cur] = i;
    setAnswers(ans);
    const nextIdx = ans.findIndex((a, k) => a === null && k > cur);
    const any = nextIdx >= 0 ? nextIdx : ans.findIndex((a) => a === null);
    if (any >= 0) setCur(any);
    else evaluate(ans);
  };

  const skip = () => {
    const nextIdx = answers.findIndex((a, k) => a === null && k > cur);
    const any = nextIdx >= 0 ? nextIdx : answers.findIndex((a, k) => a === null && k !== cur);
    if (any >= 0) setCur(any);
  };

  const blockName = (b: number) => EXAM_BLOCKS[b].title.toLowerCase();

  const lastExams = useMemo(() => p.exams.slice(0, 5), [p.exams]);

  if (phase === 'intro') {
    const passedCount = p.exams.filter((e) => e.passed).length;
    return (
      <div className="page exam-hub">
        <ProfileHeader onProfile={onProfile} />
        <div className="goal-card">
          <div className="goal-top">
            <span className="goal-ico"><UiIcon id="trophy" size={26} /></span>
            <div>
              <b>Экзамен ГИБДД</b>
              <small>Настоящий билет из 40: 20 вопросов, 20 минут, не больше 2 ошибок</small>
            </div>
          </div>
          <Btn big wide variant="green" onClick={start} disabled={!db}>
            {db ? 'Начать экзамен' : error ? 'Билеты не загрузились' : 'Загружаем билеты…'}
          </Btn>
          {error && <p className="muted small">Не удалось загрузить билеты. Обнови страницу.</p>}
        </div>
        {db && (
          <div className="course">
            <section className="stage">
              <header className="stage-head" style={{ borderColor: '#388201' }}>
                <h2>Тренировка по билетам</h2>
                <small>Те же вопросы, что на экзамене, без таймера</small>
              </header>
            <button className="topic-row" onClick={() => setChooser('tickets')}>
              <span className="topic-badge" style={{ background: '#137aaa', boxShadow: '0 3px 0 #0f6288', width: 48, height: 48 }}><BadgeIcon id="ticket" /></span>
              <span className="topic-row-text">
                <b>Билеты 1–40</b>
                <small>{`Решено ${Object.keys(p.tickets).length} из 40, без ошибок ${Object.values(p.tickets).filter((e) => e === 0).length}`}</small>
              </span>
              <span className="chev">›</span>
            </button>
            <button className="topic-row" onClick={() => openPaid('num')}>
              <span className="topic-badge" style={{ background: '#21844e', boxShadow: '0 3px 0 #1a6a3e', width: 48, height: 48 }}><BadgeIcon id="hash" /></span>
              <span className="topic-row-text">
                <b>Вопросы по номеру</b>
                <small>Все первые, все вторые и так далее: по 40 вопросов</small>
              </span>
              <span className="chev">›</span>
            </button>
            <button className="topic-row" onClick={() => openPaid('topics')}>
              <span className="topic-badge" style={{ background: '#7052d6', boxShadow: '0 3px 0 #5a42ac', width: 48, height: 48 }}><BadgeIcon id="list" /></span>
              <span className="topic-row-text">
                <b>Вопросы по темам</b>
                <small>{`${db.topics.length} тем, как в билетах ГИБДД`}</small>
              </span>
              <span className="chev">›</span>
            </button>
            <button className="topic-row" onClick={onMarathon}>
              <span className="topic-badge" style={{ background: '#aa6400', boxShadow: '0 3px 0 #885000', width: 48, height: 48 }}><BadgeIcon id="bolt" /></span>
              <span className="topic-row-text">
                <b>Марафон</b>
                <small>{`Все ${db.questions.length} вопросов по 50 за подход, сначала новые`}</small>
              </span>
              <span className="chev">›</span>
            </button>
            </section>
            <section className="stage">
              <header className="stage-head" style={{ borderColor: '#d03d3d' }}>
                <h2>Мои вопросы</h2>
                <small>Что стоит повторить</small>
              </header>
            <button className="topic-row" onClick={onMistakes}>
              <span className="topic-badge" style={{ background: '#d03d3d', boxShadow: '0 3px 0 #a63131', width: 48, height: 48 }}><BadgeIcon id="alert" /></span>
              <span className="topic-row-text">
                <b>Ошибки</b>
                <small>{`${p.mistakes.length} на повторение`}</small>
              </span>
              <span className="chev">›</span>
            </button>
            <button className="topic-row" onClick={onBookmarks} disabled={!p.bookmarks.length}>
              <span className="topic-badge" style={{ background: '#137aaa', boxShadow: '0 3px 0 #0f6288', width: 48, height: 48 }}><BadgeIcon id="star" /></span>
              <span className="topic-row-text">
                <b>Закладки</b>
                <small>{p.bookmarks.length ? `${p.bookmarks.length} вопр.` : 'Отмечай ☆ в вопросах'}</small>
              </span>
              <span className="chev">›</span>
            </button>
            </section>
          </div>
        )}
        <details className="card rules-details">
          <summary>Как устроен экзамен</summary>
          <ul>
            <li>Билет из 20 вопросов в 4 тематических блоках по 5 вопросов.</li>
            <li>Можно ошибиться не больше двух раз, и не дважды в одном блоке.</li>
            <li>За каждую ошибку — +5 дополнительных вопросов из того же блока и +5 минут. В них ошибаться нельзя.</li>
            <li>Правильные ответы покажем в конце, как на настоящем экзамене.</li>
          </ul>
        </details>
        {lastExams.length > 0 && (
          <div className="card history">
            <h3>
              Последние попытки, сдано {passedCount} из {p.exams.length}
            </h3>
            {lastExams.map((e, i) => (
              <div key={i} className="history-row">
                <span>{e.passed ? <><UiIcon id="check" size={16} /> Сдал</> : <><UiIcon id="cross" size={16} /> Не сдал</>}</span>
                <span className="muted">
                  ошибок: {e.errors} из {e.total}
                </span>
                <span className="muted">{new Date(e.date).toLocaleDateString('ru-RU')}</span>
              </div>
            ))}
          </div>
        )}
        {chooser === 'tickets' && db && (
          <Sheet onClose={() => setChooser(null)} title="Билеты ГИБДД">
            <div className="ticket-legend muted small">
              <span className="tl ok" /> без ошибок <span className="tl warn" /> 1–2 ошибки <span className="tl bad" /> больше 2
            </div>
            <div className="ticket-grid">
              {db.byTicket.map((_, i) => {
                const e = p.tickets[i + 1];
                const cls = e === undefined ? '' : e === 0 ? 'ok' : e <= 2 ? 'warn' : 'bad';
                return (
                  <button
                    key={i}
                    className={`ticket-cell ${cls}`}
                    onClick={() => {
                      setChooser(null);
                      onTicket(i + 1);
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </Sheet>
        )}
        {chooser === 'num' && db && (
          <Sheet onClose={() => setChooser(null)} title="Вопросы по номеру">
            <p className="muted small">Выбери номер вопроса в билете: получишь все 40 вопросов с этим номером.</p>
            <div className="ticket-grid">
              {Array.from({ length: 20 }, (_, i) => (
                <button
                  key={i}
                  className="ticket-cell"
                  onClick={() => {
                    setChooser(null);
                    onQuestionNo(i + 1);
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </Sheet>
        )}
        {chooser === 'topics' && db && (
          <Sheet onClose={() => setChooser(null)} title="Вопросы по темам">
            <div className="topic-list">
              {db.topics
                .map((name) => ({ name, n: db.questions.filter((q) => q.official.includes(name)).length }))
                .sort((a, b) => b.n - a.n)
                .map(({ name, n }) => (
                  <button
                    key={name}
                    className="topic-pick"
                    onClick={() => {
                      setChooser(null);
                      onOfficialTopic(name);
                    }}
                  >
                    <span>
                      <b>{name}</b>
                      <small className="muted">{n} вопр.</small>
                    </span>
                  </button>
                ))}
            </div>
          </Sheet>
        )}
      </div>
    );
  }

  if (phase === 'result' && verdict) {
    const wrong = items.map((it, i) => ({ it, a: answers[i] })).filter(({ it, a }) => a !== it.q.correct);
    const secs = Math.round((Date.now() - startRef.current) / 1000);
    return (
      <div className="page exam-result">
        {verdict.passed && <Confetti />}
        <div className={`verdict ${verdict.passed ? 'ok' : 'bad'}`}>
          <span className="finish-badge">{verdict.passed ? <UiIcon id="check" size={44} /> : <UiIcon id="cross" size={44} />}</span>
          <h1>{verdict.passed ? 'Экзамен сдан!' : 'Экзамен не сдан'}</h1>
          <p>{verdict.reason}</p>
          <p className="muted">
            Ошибок: {wrong.length}, вопросов: {items.length}, время: {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
          </p>
        </div>
        {wrong.length > 0 && (
          <>
            <h2 className="section-title">Разбор ошибок</h2>
            {wrong.map(({ it, a }) => (
              <div key={it.q.id} className="card review">
                <div className="review-q">{it.q.text}</div>
                {it.q.image && <Illustration img={it.q.image} />}
                {a !== null && a !== undefined ? (
                  <div className="review-wrong"><UiIcon id="cross" size={16} /> Ваш ответ: {it.q.options[a]}</div>
                ) : (
                  <div className="review-wrong"><UiIcon id="cross" size={16} /> Нет ответа</div>
                )}
                <div className="review-right"><UiIcon id="check" size={16} /> Правильно: {it.q.options[it.q.correct]}</div>
                <div className="feedback-expl">{it.q.explanation}</div>
                {it.q.rule && <div className="feedback-rule"><UiIcon id="book" size={16} /> {it.q.rule}</div>}
              </div>
            ))}
            <p className="muted center">Эти вопросы добавлены в «Работу над ошибками».</p>
          </>
        )}
        <Btn big wide variant="blue" onClick={start}>
          Ещё попытка
        </Btn>
        <Btn wide variant="ghost" onClick={() => setPhase('intro')}>
          Назад
        </Btn>
      </div>
    );
  }

  const it = items[cur];
  return (
    <div className="screen-full exam-run">
      <div className="exam-top">
        <CloseBtn onClick={() => setLeaving(true)} />
        <div className="exam-ticket">
          {ticketNo ? `Билет ${ticketNo}, вопрос` : 'Вопрос'} {cur + 1} из {items.length}
          {it?.extra && <span className="extra-tag">доп.</span>}
        </div>
        <div className={`timer ${left < 120 ? 'timer-low' : ''}`}>
          <UiIcon id="clock" size={18} /> {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
        </div>
      </div>
      <div className="exam-grid">
        {items.map((x, i) => (
          <button
            key={i}
            className={`cell ${i === cur ? 'cur' : ''} ${answers[i] !== null ? 'ans' : ''} ${x.extra ? 'extra' : ''}`}
            onClick={() => answers[i] === null && setCur(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {it && (
        <div className="exam-body" key={cur}>
          <div className="exam-block muted">
            Блок {it.block + 1}: {blockName(it.block)}
          </div>
          {it.q.image && <Illustration img={it.q.image} />}
          <h2 className="ex-title">{it.q.text}</h2>
          <div className="options">
            {it.q.options.map((o, i) => (
              <button key={i} className={`option ${picked === i ? 'selected' : ''}`} onClick={() => (play('tap', p.settings.sound), setPicked(i))} disabled={answers[cur] !== null} data-ok={import.meta.env.DEV && i === it.q.correct ? '' : undefined}>
                <span className="opt-key">{i + 1}</span>
                <span className="opt-text">{o}</span>
              </button>
            ))}
          </div>
          <div className="exam-actions">
            <Btn variant="white" onClick={skip}>
              Пропустить
            </Btn>
            <Btn big variant="green" disabled={picked === null} onClick={() => picked !== null && answer(picked)}>
              Ответить
            </Btn>
          </div>
        </div>
      )}
      {leaving && (
        <Modal onClose={() => setLeaving(false)}>
          <h2>Прервать экзамен?</h2>
          <p>Результат не сохранится.</p>
          <Btn big wide variant="red" onClick={() => (setLeaving(false), setPhase('intro'), onExit())}>
            Прервать
          </Btn>
          <Btn wide variant="ghost" onClick={() => setLeaving(false)}>
            Продолжить экзамен
          </Btn>
        </Modal>
      )}
      {phase === 'extra-info' && (
        <Modal>
          <h2>Дополнительные вопросы</h2>
          <p>
            Есть ошибки в блоке{extraBlocks.length > 1 ? 'ах' : ''}: {extraBlocks.map((b) => `${b + 1} (${blockName(b)})`).join(', ')}.
          </p>
          <p>
            Добавлено <b>{extraBlocks.length * 5} вопросов</b> и <b>{extraBlocks.length * 5} минут</b>. Здесь ошибаться нельзя!
          </p>
          <Btn big wide variant="blue" onClick={() => setPhase('run')}>
            Продолжить
          </Btn>
        </Modal>
      )}
    </div>
  );
}
