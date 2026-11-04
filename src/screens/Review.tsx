import { useState } from 'react';
import type { TopicId } from '../types';
import { findQuestion, isMastered, officialByTopic, shuffle, TOPICS } from '../data/course';
import { ticketCard } from '../data/units';
import type { TheoryCard } from '../types';
import type { Question } from '../types';
import { dueQuestions, topicAccuracy, useProgress } from '../store';
import { Btn, TopicBadge } from '../components/UI';
import { UiIcon } from '../components/Icons';

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};
export const errorsWord = (n: number) => `${n} ${plural(n, 'ошибка', 'ошибки', 'ошибок')}`;

const topicNameOf = (t: TopicId) => TOPICS.find((x) => x.topic === t)?.title ?? '';

export function ReviewScreen({
  onMistakes,
  onTopicReview,
  onTheory,
  onCards,
  onReadCard,
  onTrain,
}: {
  onMistakes: (ids: string[]) => void;
  onTopicReview: (t: TopicId) => void;
  onTheory: (t: TopicId) => void;
  onCards: (title: string, deck: Question[]) => void;
  onReadCard: (topic: TopicId, cards: TheoryCard[], title: string) => void;
  onTrain: (title: string, ids: string[]) => void;
}) {
  const { p } = useProgress();
  const [tab, setTab] = useState<'mistakes' | 'cards' | 'all'>('mistakes');
  const byTopic = new Map<TopicId, string[]>();
  p.mistakes.forEach((id) => {
    const q = findQuestion(id);
    if (!q) return;
    byTopic.set(q.topic, [...(byTopic.get(q.topic) ?? []), id]);
  });
  const due = Array.from(new Set([...dueQuestions(p), ...p.mistakes])).filter((id) => findQuestion(id));
  const acc = topicAccuracy(p);

  // Где ошибаешься повторно: считаем промахи по карточкам теории, которые объясняют билеты.
  const recs = (() => {
    const m = new Map<string, { ref: NonNullable<ReturnType<typeof ticketCard>>; errors: number; ids: string[] }>();
    for (const [id, s] of Object.entries(p.stats)) {
      const errors = s.seen - s.right;
      if (errors <= 0 || !id.startsWith('t-')) continue;
      const ref = ticketCard(id);
      if (!ref) continue;
      const key = `${ref.topic}/${ref.unit.id}/${ref.index}`;
      const e = m.get(key) ?? { ref, errors: 0, ids: [] };
      e.errors += errors;
      e.ids.push(id);
      m.set(key, e);
    }
    return [...m.values()].filter((e) => e.errors >= 2).sort((a, b) => b.errors - a.errors).slice(0, 5);
  })();

  return (
    <div className="page">
      <h1 className="page-title">Повторение</h1>
      <div className="seg">
        <button className={tab === 'mistakes' ? 'on' : ''} onClick={() => setTab('mistakes')}>
          Ошибки
        </button>
        <button className={tab === 'cards' ? 'on' : ''} onClick={() => setTab('cards')}>
          Карточки
        </button>
        <button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>
          Все темы
        </button>
      </div>

      {tab === 'mistakes' && (
        <>
          {recs.length > 0 && (
            <section className="recs">
              <h2 className="section-title">Советуем повторить</h2>
              {recs.map((e) => (
                <div key={`${e.ref.unit.id}${e.ref.index}`} className="card rec-card">
                  <small className="muted">{topicNameOf(e.ref.topic)}. {e.ref.unit.title}</small>
                  <b>{e.ref.card.title}</b>
                  <small className="err">Ошибок в этой теме: {e.errors}</small>
                  <p className="muted">{e.ref.card.remember}</p>
                  <div className="rec-btns">
                    <Btn variant="white" onClick={() => onReadCard(e.ref.topic, [e.ref.card], e.ref.unit.title)}>
                      Читать теорию
                    </Btn>
                    <Btn onClick={() => onTrain(e.ref.card.title, e.ids)}>Потренировать</Btn>
                  </div>
                </div>
              ))}
            </section>
          )}
          {due.length > 0 && (
            <div className="card due-card">
              <span className="fb-badge think"><UiIcon id="repeat" size={30} /></span>
              <div>
                <b>Пора повторить: {due.length}</b>
                <small className="muted">
                  Вопросы с ошибками и те, что пора освежить в памяти.
                </small>
              </div>
              <Btn onClick={() => onMistakes(due.slice(0, 10))}>Начать</Btn>
            </div>
          )}
          {byTopic.size === 0 && (
            <div className="empty">
              <span className="finish-badge ok"><UiIcon id="check" size={44} /></span>
              <h3>Ошибок нет!</h3>
              <p className="muted">Когда ошибёшься в уроке или на экзамене, вопрос появится здесь, чтобы ты его закрепил.</p>
            </div>
          )}
          {[...byTopic.entries()].map(([t, ids]) => {
            const topic = TOPICS.find((x) => x.topic === t)!;
            return (
              <div key={t} className="card rev-row">
                <TopicBadge topic={t} size={48} />
                <div className="rev-text">
                  <b>{topic.title}</b>
                  <small className="err">{errorsWord(ids.length)}</small>
                </div>
                <Btn className="pill" onClick={() => onMistakes(ids.slice(0, 10))}>
                  Повторить
                </Btn>
              </div>
            );
          })}
        </>
      )}

      {tab === 'cards' && (
        <>
          <p className="muted">Листай вопросы как карточки: свайп вправо — знаю, влево — не знаю. Не знаешь — вопрос попадёт в «Ошибки».</p>
          {TOPICS.map((t) => {
            const pool = officialByTopic(t.topic);
            const left = pool.filter((q) => !isMastered(p.stats, q.id)).length;
            return (
              <button key={t.topic} className="topic-row" onClick={() => onCards(t.title, shuffle(pool).sort((x, y) => Number(isMastered(p.stats, x.id)) - Number(isMastered(p.stats, y.id))))} disabled={!pool.length}>
                <TopicBadge topic={t.topic} size={48} />
                <span className="topic-row-text">
                  <b>{t.title}</b>
                  <small>{pool.length ? `Осталось выучить: ${left} из ${pool.length}` : 'Билеты загружаются'}</small>
                </span>
                <span className="chev">›</span>
              </button>
            );
          })}
        </>
      )}

      {tab === 'all' && (
        <>
          {TOPICS.map((t) => {
            const a = acc[t.topic];
            const pct = a && a.seen ? Math.round((a.right / a.seen) * 100) : null;
            const opened = p.done.some((k) => k.startsWith(`${t.topic}:`));
            return (
              <div key={t.topic} className="card rev-row">
                <TopicBadge topic={t.topic} size={48} />
                <div className="rev-text">
                  <b>{t.title}</b>
                  {pct === null ? (
                    <small className="muted">{opened ? 'Ещё нет ответов' : 'Тема не начата'}</small>
                  ) : (
                    <div className="acc-row">
                      <div className="acc-bar">
                        <div style={{ width: `${pct}%`, background: pct >= 80 ? '#58cc02' : pct >= 50 ? '#ffb800' : '#ff4b4b' }} />
                      </div>
                      <small>{pct}%</small>
                    </div>
                  )}
                </div>
                <div className="rev-btns">
                  <button className="mini-btn" onClick={() => onTheory(t.topic)} title="Теория">
                    <UiIcon id="book" size={20} />
                  </button>
                  <Btn className="pill" onClick={() => onTopicReview(t.topic)}>
                    Повторить
                  </Btn>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
