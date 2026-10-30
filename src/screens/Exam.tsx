import { useEffect, useMemo, useRef, useState } from 'react';
import { buildExam, buildExtra, buildOfficialExam, buildOfficialExtra, EXAM_BLOCKS, type ExamQuestion, findQuestion } from '../data/course';
import { useTickets } from '../data/tickets';
import { useProgress } from '../store';
import { play } from '../sound';
import { Illustration } from '../components/Illustration';
import { Btn, CloseBtn, Confetti, Modal, Sheet } from '../components/UI';
import { CityBackdrop, Inspector as Mascot } from '../components/Art';

const BASE_MIN = 20;

type Phase = 'intro' | 'run' | 'extra-info' | 'result';

export function ExamScreen({
  onExit,
  onTicket,
  onOfficialTopic,
  onMarathon,
  onBookmarks,
  onMistakes,
}: {
  onExit: () => void;
  onTicket: (n: number) => void;
  onOfficialTopic: (name: string) => void;
  onMarathon: () => void;
  onBookmarks: () => void;
  onMistakes: () => void;
}) {
  const [chooser, setChooser] = useState<null | 'tickets' | 'topics'>(null);
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
  const startRef = useRef(0);

  const start = () => {
    // Настоящий билет ГИБДД; если база не загрузилась — билет из вопросов курса.
    const official = db ? buildOfficialExam(db) : null;
    const qs = official ? official.items : buildExam();
    setTicketNo(official?.ticket ?? null);
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
      const extra = blocks.flatMap((b) => (db && ticketNo ? buildOfficialExtra(db, b, used) : buildExtra(b, used)));
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
    play('tap', p.settings.sound);
    const ans = [...answers];
    ans[cur] = i;
    setAnswers(ans);
    setTimeout(() => {
      const nextIdx = ans.findIndex((a, k) => a === null && k > cur);
      const any = nextIdx >= 0 ? nextIdx : ans.findIndex((a) => a === null);
      if (any >= 0) setCur(any);
      else evaluate(ans);
    }, 350);
  };

  const skip = () => {
    const nextIdx = answers.findIndex((a, k) => a === null && k > cur);
    const any = nextIdx >= 0 ? nextIdx : answers.findIndex((a, k) => a === null && k !== cur);
    if (any >= 0) setCur(any);
  };

  const blockName = (b: number) => (ticketNo ? `вопросы ${b * 5 + 1}–${b * 5 + 5}` : EXAM_BLOCKS[b].title.toLowerCase());

  const lastExams = useMemo(() => p.exams.slice(0, 5), [p.exams]);

  if (phase === 'intro') {
    const passedCount = p.exams.filter((e) => e.passed).length;
    return (
      <div className="page exam-hub">
        <h1 className="page-title">Экзамен</h1>
        <div className="exam-hero">
          <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMax slice">
            <CityBackdrop />
          </svg>
          <div className="exam-hero-man">
            <Mascot mood="happy" size={150} />
          </div>
        </div>
        <h2 className="hub-title">Билеты ГИБДД</h2>
        <p className="muted">Настоящие экзаменационные билеты категорий A, B, M — те же вопросы, что на экзамене в ГИБДД.</p>
        <Btn big wide variant="blue" onClick={start} disabled={!db && !error}>
          {db || error ? 'Начать экзамен' : 'Загружаем билеты…'}
        </Btn>
        <div className="card exam-facts">
          <span className="fact-check">✓</span>
          <b>{db ? 'Случайный билет из 40 · 20 минут' : '20 вопросов · 20 минут'}</b>
          <small>Можно ошибиться не больше 2 раз, +5 вопросов за ошибку</small>
        </div>
        {error && <p className="muted small">Не удалось загрузить билеты — экзамен пройдёт на вопросах курса.</p>}
        {db && (
          <>
            <button className="card hub-item" onClick={() => setChooser('tickets')}>
              <span className="hub-ico blue">🎫</span>
              <span className="hub-text">
                <b>Билеты 1–40</b>
                <small>
                  Решено {Object.keys(p.tickets).length} из 40 · без ошибок {Object.values(p.tickets).filter((e) => e === 0).length}
                </small>
              </span>
              <span className="chev">›</span>
            </button>
            <button className="card hub-item" onClick={() => setChooser('topics')}>
              <span className="hub-ico green">🧭</span>
              <span className="hub-text">
                <b>Вопросы по темам</b>
                <small>{db.topics.length} тем, как в билетах ГИБДД</small>
              </span>
              <span className="chev">›</span>
            </button>
            <button className="card hub-item" onClick={onMarathon}>
              <span className="hub-ico yellow">🏃</span>
              <span className="hub-text">
                <b>Марафон</b>
                <small>Все {db.questions.length} вопросов по 50 за подход, сначала новые</small>
              </span>
              <span className="chev">›</span>
            </button>
            <div className="hub-row">
              <button className="card hub-item" onClick={onMistakes}>
                <span className="hub-ico red">🧠</span>
                <span className="hub-text">
                  <b>Ошибки</b>
                  <small>{p.mistakes.length} на повторение</small>
                </span>
              </button>
              <button className="card hub-item" onClick={onBookmarks} disabled={!p.bookmarks.length}>
                <span className="hub-ico blue">★</span>
                <span className="hub-text">
                  <b>Закладки</b>
                  <small>{p.bookmarks.length ? `${p.bookmarks.length} вопр.` : 'Отмечай ☆ в вопросах'}</small>
                </span>
              </button>
            </div>
          </>
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
              Последние попытки · сдано {passedCount} из {p.exams.length}
            </h3>
            {lastExams.map((e, i) => (
              <div key={i} className="history-row">
                <span>{e.passed ? '✅ Сдал' : '❌ Не сдал'}</span>
                <span className="muted">
                  ошибок: {e.errors} из {e.total}
                </span>
                <span className="muted">{new Date(e.date).toLocaleDateString('ru-RU')}</span>
              </div>
            ))}
          </div>
        )}
        {db && <p className="muted small center">{db.source}</p>}
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
          <Mascot mood={verdict.passed ? 'cheer' : 'sad'} size={120} />
          <h1>{verdict.passed ? 'Экзамен сдан!' : 'Экзамен не сдан'}</h1>
          <p>{verdict.reason}</p>
          <p className="muted">
            Ошибок: {wrong.length} · Вопросов: {items.length} · Время: {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
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
                  <div className="review-wrong">✖ Ваш ответ: {it.q.options[a]}</div>
                ) : (
                  <div className="review-wrong">✖ Нет ответа</div>
                )}
                <div className="review-right">✔ Правильно: {it.q.options[it.q.correct]}</div>
                <div className="feedback-expl">{it.q.explanation}</div>
                {it.q.rule && <div className="feedback-rule">📖 {it.q.rule}</div>}
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
        <CloseBtn onClick={() => (confirm('Прервать экзамен? Результат не сохранится.') ? (setPhase('intro'), onExit()) : undefined)} />
        <div className="exam-ticket">
          {ticketNo ? `Билет ${ticketNo} · ` : ''}Вопрос {cur + 1} из {items.length}
          {it?.extra && <span className="extra-tag">доп.</span>}
        </div>
        <div className={`timer ${left < 120 ? 'timer-low' : ''}`}>
          ⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
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
          {it.q.image ? <Illustration img={it.q.image} /> : <div className="exam-noimg">Вопрос без иллюстрации</div>}
          <h2 className="ex-title">{it.q.text}</h2>
          <div className="options">
            {it.q.options.map((o, i) => (
              <button key={i} className={`option ${answers[cur] === i ? 'selected' : ''}`} onClick={() => answer(i)} disabled={answers[cur] !== null} data-ok={import.meta.env.DEV && i === it.q.correct ? '' : undefined}>
                <span className="opt-key">{i + 1}</span>
                <span className="opt-text">{o}</span>
              </button>
            ))}
          </div>
          <div className="exam-actions">
            <Btn variant="white" onClick={skip}>
              Пропустить
            </Btn>
          </div>
        </div>
      )}
      {phase === 'extra-info' && (
        <Modal>
          <Mascot mood="think" size={90} />
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
