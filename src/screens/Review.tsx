import { useState } from 'react';
import type { TopicId } from '../types';
import { findQuestion, TOPICS } from '../data/course';
import { dueQuestions, topicAccuracy, useProgress } from '../store';
import { Inspector, TopicThumb } from '../components/Art';
import { Btn } from '../components/UI';

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};
export const errorsWord = (n: number) => `${n} ${plural(n, 'ошибка', 'ошибки', 'ошибок')}`;

export function ReviewScreen({
  onMistakes,
  onTopicReview,
  onTheory,
  onSigns,
}: {
  onMistakes: (ids: string[]) => void;
  onTopicReview: (t: TopicId) => void;
  onTheory: (t: TopicId) => void;
  onSigns: () => void;
}) {
  const { p } = useProgress();
  const [tab, setTab] = useState<'mistakes' | 'all'>('mistakes');
  const byTopic = new Map<TopicId, string[]>();
  p.mistakes.forEach((id) => {
    const q = findQuestion(id);
    if (!q) return;
    byTopic.set(q.topic, [...(byTopic.get(q.topic) ?? []), id]);
  });
  const due = Array.from(new Set([...dueQuestions(p), ...p.mistakes])).filter((id) => findQuestion(id));
  const acc = topicAccuracy(p);

  return (
    <div className="page">
      <h1 className="page-title">Повторение</h1>
      <div className="seg">
        <button className={tab === 'mistakes' ? 'on' : ''} onClick={() => setTab('mistakes')}>
          Ошибки
        </button>
        <button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>
          Все темы
        </button>
      </div>

      {tab === 'mistakes' && (
        <>
          {due.length > 0 && (
            <div className="card due-card">
              <Inspector mood="think" size={70} />
              <div>
                <b>Пора повторить: {due.length}</b>
                <small className="muted">
                  Вопросы с ошибками и те, что пора освежить в памяти. Каждая исправленная ошибка возвращает ❤️.
                </small>
              </div>
              <Btn onClick={() => onMistakes(due.slice(0, 10))}>Начать</Btn>
            </div>
          )}
          {byTopic.size === 0 && (
            <div className="empty">
              <Inspector mood="cheer" size={140} />
              <h3>Ошибок нет!</h3>
              <p className="muted">Когда ошибёшься в уроке или на экзамене, вопрос появится здесь, чтобы ты его закрепил.</p>
            </div>
          )}
          {[...byTopic.entries()].map(([t, ids]) => {
            const topic = TOPICS.find((x) => x.topic === t)!;
            return (
              <div key={t} className="card rev-row">
                <TopicThumb thumb={topic.thumb} size={56} />
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

      {tab === 'all' && (
        <>
          <button className="card rev-row clickable" onClick={onSigns}>
            <TopicThumb thumb={{ sign: { id: '2.1' } }} size={56} />
            <div className="rev-text">
              <b>Справочник знаков</b>
              <small className="muted">Все знаки с объяснениями</small>
            </div>
            <span className="chev">›</span>
          </button>
          {TOPICS.map((t) => {
            const a = acc[t.topic];
            const pct = a && a.seen ? Math.round((a.right / a.seen) * 100) : null;
            const opened = (p.steps[t.topic] ?? 0) > 0;
            return (
              <div key={t.topic} className="card rev-row">
                <TopicThumb thumb={t.thumb} size={56} />
                <div className="rev-text">
                  <b>{t.title}</b>
                  {pct === null ? (
                    <small className="muted">{opened ? 'Ещё нет ответов' : 'Тема не начата'}</small>
                  ) : (
                    <div className="acc-row">
                      <div className="acc-bar">
                        <div style={{ width: `${pct}%`, background: pct >= 80 ? '#2bb24c' : pct >= 50 ? '#ffb800' : '#ff5a5f' }} />
                      </div>
                      <small>{pct}%</small>
                    </div>
                  )}
                </div>
                <div className="rev-btns">
                  <button className="mini-btn" onClick={() => onTheory(t.topic)} title="Теория">
                    📖
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
