import { useState } from 'react';
import type { Exercise, TopicId } from './types';
import { buildControl, buildPractice, buildReview, findQuestion, officialByTopic, pickFresh, shuffleOptions, type StepKind, STEPS, topicById } from './data/course';
import { useTickets } from './data/tickets';
import { heartsNow, useProgress } from './store';
import { Home, TopicSheet } from './screens/Home';
import { Lesson, type LessonMode } from './screens/Lesson';
import { Theory } from './screens/Theory';
import { ExamScreen } from './screens/Exam';
import { CityScreen } from './screens/City';
import { ReviewScreen } from './screens/Review';
import { DailyScreen, ProfileScreen } from './screens/Profile';
import { SignsGuide } from './screens/Other';
import { Logo, Welcome } from './screens/Welcome';
import { Inspector } from './components/Art';
import { Btn, fmtMs, Modal, NavIcon } from './components/UI';

type Tab = 'learn' | 'city' | 'exam' | 'review' | 'profile';

type Overlay =
  | { kind: 'theory'; topic: TopicId; readOnly?: boolean }
  | { kind: 'lesson'; mode: LessonMode; title: string; color: string; topic?: TopicId; step?: number; ticket?: number; exercises: Exercise[]; key: number; again?: () => void };

const TABS: { id: Tab; label: string }[] = [
  { id: 'learn', label: 'Обучение' },
  { id: 'city', label: 'Город' },
  { id: 'exam', label: 'Экзамен' },
  { id: 'review', label: 'Повторение' },
  { id: 'profile', label: 'Профиль' },
];

export default function App() {
  const store = useProgress();
  const { p, addXp, completeStep } = store;
  const [tab, setTab] = useState<Tab>('learn');
  const [page, setPage] = useState<null | 'daily' | 'signs'>(null);
  const [sheet, setSheet] = useState<TopicId | null>(null);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [noHearts, setNoHearts] = useState(false);
  // Билеты грузим сразу: нужны и экзамену, и «Повторению» (ошибки из билетов).
  const { db } = useTickets();

  if (!p.onboarded) return <Welcome />;

  const openTab = (t: Tab) => {
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

  const startStep = (topic: TopicId, kind: StepKind) => {
    const t = topicById(topic);
    const step = STEPS.findIndex((s) => s.kind === kind);
    setSheet(null);
    if (kind === 'theory') return setOverlay({ kind: 'theory', topic });
    const build = () => (kind === 'control' ? buildControl(topic) : buildPractice(topic, kind === 'practice' ? 1 : 2));
    lesson({
      mode: kind === 'control' ? 'control' : 'practice',
      title: { practice: 'Практика', practice2: 'Закрепление', control: 'Контрольная', theory: 'Теория' }[kind],
      color: t.color,
      topic,
      step,
      exercises: build(),
      again: () => startStep(topic, kind),
    });
  };

  const seen = (id: string) => p.stats[id]?.seen ?? 0;
  const quiz = (title: string, qs: { id: string }[], extra: Partial<Extract<Overlay, { kind: 'lesson' }>> = {}) =>
    reviewOrQuiz('quiz', title, qs.map((q) => q.id), extra);

  function reviewOrQuiz(mode: LessonMode, title: string, ids: string[], extra: Partial<Extract<Overlay, { kind: 'lesson' }>> = {}) {
    const ex: Exercise[] = ids.flatMap((id) => {
      const q = findQuestion(id);
      return q ? [{ type: 'mc' as const, q: shuffleOptions(q) }] : [];
    });
    if (ex.length) lesson({ mode, title, color: '#1f7cf0', exercises: ex, ...extra });
  }

  if (overlay?.kind === 'theory') {
    const { topic, readOnly } = overlay;
    return (
      <Theory
        topic={topic}
        readOnly={readOnly}
        onClose={() => setOverlay(null)}
        onDone={() => {
          addXp(10);
          completeStep(topic, 0);
          setOverlay(null);
          setSheet(topic);
        }}
      />
    );
  }

  if (overlay?.kind === 'lesson') {
    const o = overlay;
    return (
      <Lesson
        key={o.key}
        mode={o.mode}
        title={o.title}
        color={o.color}
        topic={o.topic}
        exercises={o.exercises}
        onClose={() => {
          setOverlay(null);
          if (o.topic && o.step !== undefined) setSheet(o.topic);
        }}
        onRestart={o.again}
        onReview={() => {
          setOverlay(null);
          openTab('review');
        }}
        onFinish={(r) => {
          if (r.xp > 0) addXp(r.xp);
          if (o.ticket && r.total === r.answered) store.recordTicket(o.ticket, r.total - r.correct);
          if (o.topic && o.step !== undefined && r.passed) completeStep(o.topic, o.step, o.mode === 'control' ? r.correct : undefined);
          setOverlay(null);
          if (o.topic && o.step !== undefined) setSheet(o.topic);
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
        {page === 'signs' && <SignsGuide onBack={() => setPage(null)} />}
        {!page && tab === 'learn' && <Home onTopic={setSheet} onExam={() => openTab('exam')} onDaily={() => setPage('daily')} onProfile={() => openTab('profile')} />}
        {!page && tab === 'city' && <CityScreen />}
        {!page && tab === 'exam' && (
          <ExamScreen
            onExit={() => openTab('exam')}
            onTicket={(n) => db && quiz(`Билет ${n}`, db.byTicket[n - 1], { ticket: n })}
            onOfficialTopic={(name) => db && quiz(name, pickFresh(db.questions.filter((q) => q.official.includes(name)), 20, seen))}
            onMarathon={() => db && quiz('Марафон', pickFresh(db.questions, 50, seen))}
            onBookmarks={() => reviewOrQuiz('quiz', 'Закладки', p.bookmarks)}
            onMistakes={() => openTab('review')}
          />
        )}
        {!page && tab === 'review' && (
          <ReviewScreen
            onMistakes={(ids) => reviewOrQuiz('review', 'Повторение', ids, { color: '#ff9a3c' })}
            onTopicReview={(t) => lesson({ mode: 'review', title: `Повторение: ${topicById(t).title}`, color: topicById(t).color, topic: t, exercises: buildReview(t) })}
            onTheory={(t) => setOverlay({ kind: 'theory', topic: t, readOnly: true })}
            onSigns={() => setPage('signs')}
          />
        )}
        {!page && tab === 'profile' && <ProfileScreen onDaily={() => setPage('daily')} onSigns={() => setPage('signs')} />}
      </main>

      {sheet && (
        <TopicSheet
          topic={sheet}
          onClose={() => setSheet(null)}
          onStep={(k) => startStep(sheet, k)}
          officialCount={officialByTopic(sheet).length}
          onOfficial={() => {
            const t = topicById(sheet);
            setSheet(null);
            quiz(`Билеты: ${t.title}`, pickFresh(officialByTopic(sheet), 15, seen), { color: t.color, topic: sheet });
          }}
          onReread={() => {
            setOverlay({ kind: 'theory', topic: sheet, readOnly: true });
            setSheet(null);
          }}
        />
      )}

      {noHearts && (
        <Modal onClose={() => setNoHearts(false)}>
          <Inspector mood="sad" size={120} />
          <h2>Сердечки закончились</h2>
          <p>
            Новое сердечко появится через <b>{fmtMs(heartsNow(p).nextIn)}</b>. Исправь ошибки в «Повторении» — каждая исправленная ошибка возвращает ❤️. Теорию можно читать всегда.
          </p>
          {p.mistakes.length > 0 && (
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
