import { useEffect, useState } from 'react';
import { bindBack } from './telegram';
import { openPaywall, syncStatus, usePremium } from './premium';
import { PaywallHost } from './components/Paywall';
import type { Exercise, Question, TopicId } from './types';
import type { TheoryCard } from './types';
import { buildControl, buildReview, buildUnitDrill, findQuestion, pickFresh, topicById, unitKey } from './data/course';
import { topicUnits, type Unit } from './data/units';
import { useTickets } from './data/tickets';
import { heartsNow, useProgress } from './store';
import { Home, TopicSheet } from './screens/Home';
import { Lesson, type LessonMode } from './screens/Lesson';
import { Theory } from './screens/Theory';
import { Cards } from './screens/Cards';
import { ExamScreen } from './screens/Exam';
import { ReviewScreen } from './screens/Review';
import { DailyScreen, ProfileScreen } from './screens/Profile';
import { Logo, Welcome } from './screens/Welcome';
import { Btn, fmtMs, Modal, NavIcon } from './components/UI';

type Tab = 'learn' | 'exam' | 'review' | 'profile';

type Overlay =
  | { kind: 'theory'; topic: TopicId; readOnly?: boolean; unit?: Unit; cards?: TheoryCard[]; title?: string }
  | { kind: 'cards'; title: string; deck: Question[] }
  | { kind: 'lesson'; mode: LessonMode; title: string; color: string; topic?: TopicId; control?: boolean; unit?: Unit; ticket?: number; exercises: Exercise[]; key: number; again?: () => void };

const TABS: { id: Tab; label: string }[] = [
  { id: 'learn', label: 'Обучение' },
  { id: 'exam', label: 'Экзамен' },
  { id: 'review', label: 'Повторение' },
  { id: 'profile', label: 'Профиль' },
];

export default function App() {
  const store = useProgress();
  const { p, addXp, completeStep } = store;
  const [tab, setTab] = useState<Tab>('learn');
  const [page, setPage] = useState<null | 'daily'>(null);
  const [sheet, setSheet] = useState<TopicId | null>(null);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [noHearts, setNoHearts] = useState(false);
  // Кнопка «Назад» Telegram закрывает верхний слой: окно темы, урок или страницу.
  useEffect(
    () =>
      bindBack(!!(sheet || overlay || page), () => {
        if (sheet) setSheet(null);
        else if (overlay) setOverlay(null);
        else setPage(null);
      }),
    [sheet, overlay, page],
  );
  // Билеты грузим сразу: нужны и экзамену, и «Повторению» (ошибки из билетов).
  const { db } = useTickets();
  // Подписка: экзамен и разбор ошибок только для платных. Заодно сообщаем боту дату экзамена для напоминаний.
  const prem = usePremium();
  useEffect(() => {
    void syncStatus({ examDate: p.examDate, lastActive: p.lastActive, streak: p.streak });
  }, [p.examDate, p.lastActive, p.streak]);

  if (!p.onboarded) return <Welcome />;

  const openTab = (t: Tab) => {
    setSheet(null);
    setTab(t);
    setPage(null);
    window.scrollTo(0, 0);
  };

  const lesson = (o: Omit<Extract<Overlay, { kind: 'lesson' }>, 'kind' | 'key'>) => {
    const needsHearts = o.mode === 'practice' || o.mode === 'control';
    if (needsHearts && heartsNow(p).hearts <= 0) {
      setNoHearts(true);
      return;
    }
    setOverlay({ kind: 'lesson', key: Date.now(), ...o });
  };

  const startControl = (topic: TopicId) => {
    const t = topicById(topic);
    if (!db) return;
    setSheet(null);
    lesson({ mode: 'control', title: 'Контрольная', color: t.color, topic, control: true, exercises: buildControl(topic), again: () => startControl(topic) });
  };

  // Блок темы: сначала его теория, потом все его билеты с подсказками.
  const unitDrill = (topic: TopicId, u: Unit) =>
    lesson({ mode: 'drill', title: u.title, color: topicById(topic).color, topic, unit: u, exercises: buildUnitDrill(topic, u, p.stats), again: () => unitDrill(topic, u) });

  const startUnit = (topic: TopicId, u: Unit) => {
    if (!db) return;
    setSheet(null);
    if (!p.done.includes(unitKey(topic, u))) return setOverlay({ kind: 'theory', topic, unit: u });
    unitDrill(topic, u);
  };

  // Платные действия: без подписки вместо них открывается предложение подписки.
  const paid = (fn: () => void) => (prem.active ? fn() : openPaywall());

  const seen = (id: string) => p.stats[id]?.seen ?? 0;
  const quiz = (title: string, qs: { id: string }[], extra: Partial<Extract<Overlay, { kind: 'lesson' }>> = {}) =>
    reviewOrQuiz('quiz', title, qs.map((q) => q.id), extra);

  function reviewOrQuiz(mode: LessonMode, title: string, ids: string[], extra: Partial<Extract<Overlay, { kind: 'lesson' }>> = {}) {
    const ex: Exercise[] = ids.flatMap((id) => {
      const q = findQuestion(id);
      return q ? [{ type: 'mc' as const, q }] : [];
    });
    if (ex.length) lesson({ mode, title, color: '#1cb0f6', exercises: ex, ...extra });
  }

  if (overlay?.kind === 'theory') {
    const { topic, readOnly, unit } = overlay;
    const cards = overlay.cards ?? (unit ? unit.cards : topicUnits(topic).flatMap((u) => u.cards));
    return (
      <Theory
        topic={topic}
        readOnly={readOnly}
        cards={cards}
        title={overlay.title ?? unit?.title}
        doneText="Теперь билеты этого блока — с подсказками."
        onClose={() => {
          setOverlay(null);
          if (unit) setSheet(topic);
        }}
        onDone={() => {
          addXp(10);
          if (!unit) {
            setOverlay(null);
            return setSheet(topic);
          }
          completeStep(topic, `u-${unit.id}`);
          unitDrill(topic, unit);
        }}
      />
    );
  }

  if (overlay?.kind === 'cards')
    return (
      <>
        <Cards title={overlay.title} deck={overlay.deck} onClose={() => setOverlay(null)} />
        <PaywallHost />
      </>
    );

  if (overlay?.kind === 'lesson') {
    const o = overlay;
    return (
      <Lesson
        key={o.key}
        mode={o.mode}
        title={o.title}
        color={o.color}
        topic={o.topic}
        theoryCards={o.unit?.cards}
        exercises={o.exercises}
        onClose={() => {
          setOverlay(null);
          if (o.topic && (o.control || o.unit)) setSheet(o.topic);
        }}
        onRestart={o.again}
        onReview={() => {
          setOverlay(null);
          openTab('review');
        }}
        onFinish={(r) => {
          if (r.xp > 0) addXp(r.xp);
          if (o.ticket && r.total === r.answered) store.recordTicket(o.ticket, r.total - r.correct);
          if (o.topic && o.control && r.passed) completeStep(o.topic, 'control', r.correct);
          if (o.control && r.total > 0 && r.correct === r.total) store.addFlag('perfect');
          setOverlay(null);
          if (o.topic && (o.control || o.unit)) setSheet(o.topic);
        }}
      />
    );
  }

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-logo">
          <Logo small />
        </div>
        {TABS.map((t) => (
          <button key={t.id} className={`nav-btn ${tab === t.id ? 'on' : ''}`} onClick={() => openTab(t.id)}>
            <NavIcon name={t.id} />
            <span className="nav-label">{t.label}</span>
            {t.id === 'review' && p.mistakes.length > 0 && <span className="nav-dot">{p.mistakes.length}</span>}
          </button>
        ))}
      </nav>
      <main className="main">
        {page === 'daily' && <DailyScreen onBack={() => setPage(null)} />}
                {!page && tab === 'learn' && <Home onTopic={setSheet} onExam={() => openTab('exam')} onDaily={() => setPage('daily')} onProfile={() => openTab('profile')} />}
        {!page && tab === 'exam' && (
          <ExamScreen
            onExit={() => openTab('exam')}
            onTicket={(n) => db && quiz(`Билет ${n}`, db.byTicket[n - 1], { ticket: n })}
            onOfficialTopic={(name) => db && quiz(name, db.questions.filter((q) => q.official.includes(name)))}
            onQuestionNo={(n) => db && quiz(`Все вопросы №${n}`, db.questions.filter((q) => q.num === n).sort((x, y) => x.ticket - y.ticket))}
            onMarathon={() => db && quiz('Марафон', pickFresh(db.questions, 50, seen))}
            onBookmarks={() => reviewOrQuiz('quiz', 'Закладки', p.bookmarks)}
            onMistakes={() => openTab('review')}
            onProfile={() => openTab('profile')}
          />
        )}
        {!page && tab === 'review' && (
          <ReviewScreen
            onMistakes={(ids) => paid(() => reviewOrQuiz('review', 'Повторение', ids, { color: '#ff9600' }))}
            onTopicReview={(t) => paid(() => lesson({ mode: 'review', title: `Повторение: ${topicById(t).title}`, color: topicById(t).color, topic: t, exercises: buildReview(t, p.stats) }))}
            onTheory={(t) => setOverlay({ kind: 'theory', topic: t, readOnly: true })}
            onCards={(title, deck) => setOverlay({ kind: 'cards', title, deck })}
            onReadCard={(topic, cards, title) => setOverlay({ kind: 'theory', topic, readOnly: true, cards, title })}
            onTrain={(title, ids) => paid(() => reviewOrQuiz('review', title, ids, { color: '#ff9600' }))}
          />
        )}
        {!page && tab === 'profile' && <ProfileScreen onDaily={() => setPage('daily')} />}
      </main>

      {sheet && (
        <TopicSheet
          topic={sheet}
          onClose={() => setSheet(null)}
          onControl={() => startControl(sheet)}
          onUnit={(u) => startUnit(sheet, u)}
          onReread={() => {
            setOverlay({ kind: 'theory', topic: sheet, readOnly: true });
            setSheet(null);
          }}
        />
      )}

      <PaywallHost />

      {noHearts && (
        <Modal onClose={() => setNoHearts(false)}>
          <h2>Жизни закончились</h2>
          <p>
            Новая жизнь появится через <b>{fmtMs(heartsNow(p).nextIn)}</b>.
            {prem.active ? ' Исправь ошибки в «Повторении»: каждая исправленная ошибка возвращает жизнь.' : ''} Теорию можно читать всегда.
          </p>
          {prem.active && p.mistakes.length > 0 && (
            <Btn
              big
              wide
              onClick={() => {
                setNoHearts(false);
                openTab('review');
              }}
            >
              Исправить ошибки
            </Btn>
          )}
          <Btn wide variant="ghost" onClick={() => setNoHearts(false)}>
            Понятно
          </Btn>
        </Modal>
      )}
    </div>
  );
}
