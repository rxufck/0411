import { useState } from 'react';
import { TOPICS } from '../data/course';
import { ACHIEVEMENTS, DAILY_TASKS, STREAK_REWARD } from '../data/goals';
import { levelInfo, topicAccuracy, useProgress } from '../store';
import { Avatar, BackBtn, BadgeIcon, Btn, InfoRow, Modal, Section, TopicBadge } from '../components/UI';
import { UiIcon } from '../components/Icons';

export function ProfileScreen({ onDaily }: { onDaily: () => void }) {
  const { p, setName, setSettings, reset } = useProgress();
  const lv = levelInfo(p.xp);
  const [allAch, setAllAch] = useState(false);
  const [settings, setSettingsOpen] = useState(false);
  const [editName, setEditName] = useState(false);
  const [resetAsk, setResetAsk] = useState(false);
  const [nameDraft, setNameDraft] = useState(p.name);

  const acc = topicAccuracy(p);
  let seen = 0;
  let right = 0;
  Object.values(acc).forEach((a) => {
    seen += a!.seen;
    right += a!.right;
  });
  const rated = TOPICS.map((t) => ({ t, a: acc[t.topic] }))
    .filter((x) => x.a && x.a.seen >= 3)
    .map((x) => ({ ...x, pct: Math.round((x.a!.right / x.a!.seen) * 100) }))
    .sort((a, b) => a.pct - b.pct);
  const hardest = rated[0];
  const favorite = rated[rated.length - 1];
  const weak = rated.filter((r) => r.pct < 85).slice(0, 3);
  const unlocked = ACHIEVEMENTS.filter((a) => a.done(p));

  return (
    <div className="page">
      <div className="card goal-card prof-card-new">
        <div className="prof-top">
          <Avatar size={64} name={p.name} />
          <div className="prof-info">
            {editName ? (
              <form
                className="name-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  setName(nameDraft.trim().slice(0, 20));
                  setEditName(false);
                }}
              >
                <input autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Твоё имя" />
                <button className="mini-btn" aria-label="Сохранить"><BadgeIcon id="check" dark /></button>
              </form>
            ) : (
              <button className="prof-name" onClick={() => setEditName(true)}>
                {p.name || 'Без имени'} <span><BadgeIcon id="pencil" dark /></span>
              </button>
            )}
            <small className="muted">
              {lv.title}, уровень {lv.level}
            </small>
          </div>
          <button className="mini-btn" onClick={() => setSettingsOpen(true)} aria-label="Настройки">
            <BadgeIcon id="gear" dark />
          </button>
        </div>
        <div className="mini-bar big">
          <div style={{ width: `${lv.progress * 100}%` }} />
        </div>
        <small className="muted">
          {p.xp} из {lv.to} XP до следующего уровня
        </small>
      </div>

      <Section title="Итоги" sub="Как идёт обучение" tone="green">
        <InfoRow tone="gold" icon="fire" title="Дней подряд" sub="Сколько дней ты занимаешься без пропусков" value={p.streak} />
        <InfoRow tone="green" icon="check" title="Правильных ответов" value={`${seen ? Math.round((right / seen) * 100) : 0}%`} />
        <InfoRow tone="blue" icon="trophy" title="Экзамены сданы" value={`${p.exams.filter((e) => e.passed).length} из ${p.exams.length}`} />
        <InfoRow tone="purple" icon="puzzle" title="Самая сложная тема" value={hardest ? hardest.t.title : '—'} />
        <InfoRow tone="teal" icon="star" title="Любимая тема" value={favorite && favorite !== hardest ? favorite.t.title : '—'} />
      </Section>

      <Section title="Достижения" sub={`Получено ${unlocked.length} из ${ACHIEVEMENTS.length}`} tone="gold">
        <div className="card">
          <div className="badges">
            {ACHIEVEMENTS.slice(0, 5).map((a) => (
              <Badge key={a.id} id={a.id} color={a.color} on={a.done(p)} />
            ))}
          </div>
        </div>
        <InfoRow tone="gold" icon="medal" title="Все достижения" sub="Что уже получено и что осталось" onClick={() => setAllAch(true)} />
      </Section>

      <Section title="Слабые темы" sub="Над чем стоит поработать" tone="red">
        {weak.length === 0 ? (
          <div className="card">
            <p className="muted">Пока нечего подтягивать. Отвечай на вопросы — и здесь появится подсказка, что повторить.</p>
          </div>
        ) : (
          weak.map((w) => (
            <div key={w.t.topic} className="topic-row static">
              <TopicBadge topic={w.t.topic} size={48} />
              <span className="topic-row-text">
                <b>{w.t.title}</b>
                <small>Верных ответов: {w.pct}%</small>
                <span className="topic-row-bar">
                  <i style={{ width: `${w.pct}%`, background: '#d03d3d' }} />
                </span>
              </span>
            </div>
          ))
        )}
      </Section>

      <Section title="Задания" tone="blue">
        <InfoRow tone="blue" icon="target" title="Ежедневные задания" sub={`Выполнено ${DAILY_TASKS.filter((t) => t.progress(p) >= t.goal).length} из ${DAILY_TASKS.length}`} onClick={onDaily} />
      </Section>

      {allAch && (
        <Modal onClose={() => setAllAch(false)}>
          <h2>Достижения</h2>
          <div className="ach-list">
            {ACHIEVEMENTS.map((a) => (
              <div key={a.id} className={`ach ${a.done(p) ? 'on' : ''}`}>
                <Badge id={a.id} color={a.color} on={a.done(p)} />
                <div>
                  <b>{a.title}</b>
                  <small className="muted">{a.desc}</small>
                </div>
              </div>
            ))}
          </div>
          <Btn wide onClick={() => setAllAch(false)}>
            Закрыть
          </Btn>
        </Modal>
      )}

      {resetAsk && (
        <Modal onClose={() => setResetAsk(false)}>
          <h2>Сбросить прогресс?</h2>
          <p>Весь прогресс будет удалён. Это действие нельзя отменить.</p>
          <Btn big wide variant="red" onClick={() => (reset(), setResetAsk(false), setSettingsOpen(false))}>
            Сбросить
          </Btn>
          <Btn wide variant="ghost" onClick={() => setResetAsk(false)}>
            Отмена
          </Btn>
        </Modal>
      )}

      {settings && (
        <Modal onClose={() => setSettingsOpen(false)}>
          <h2>Настройки</h2>
          <div className="settings">
            <label className="toggle">
              <input type="checkbox" checked={p.settings.sound} onChange={(e) => setSettings({ sound: e.target.checked })} />
              <span><UiIcon id="bell" size={18} /> Звуки</span>
            </label>
            <Btn
              variant="ghost"
              onClick={() => setResetAsk(true)}
            >
              Сбросить прогресс
            </Btn>
          </div>
          <p className="muted small">Вопросы составлены по Правилам дорожного движения РФ. Перед экзаменом сверяйтесь с актуальной редакцией ПДД.</p>
          <Btn wide onClick={() => setSettingsOpen(false)}>
            Готово
          </Btn>
        </Modal>
      )}
    </div>
  );
}

const ACH_ICON: Record<string, string> = { first: 'check', theory: 'cards', signs: 'alert', perfect: 'target', streak3: 'fire', streak7: 'medal', exam: 'ticket', master: 'trophy' };

function Badge({ id, color, on }: { id: string; color: string; on: boolean }) {
  return (
    <div className={`ach-badge ${on ? 'on' : ''}`} style={on ? { background: color, boxShadow: '0 3px 0 rgba(0,0,0,.25)' } : undefined}>
      <BadgeIcon id={ACH_ICON[id] ?? 'star'} />
    </div>
  );
}

export function DailyScreen({ onBack }: { onBack: () => void }) {
  const { p, claimDaily, addFlag, addXp } = useProgress();
  const streakDone = p.streak >= STREAK_REWARD.days;
  const streakClaimed = p.flags.includes(STREAK_REWARD.flag);
  const ICONS = ['bolt', 'cards', 'alert'];
  return (
    <div className="page">
      <div className="page-head">
        <BackBtn onClick={onBack} />
        <h1 className="page-title">Задания на день</h1>
      </div>
      <InfoRow tone="gold" icon="fire" title="Дней подряд" sub={p.streak ? 'Продолжай в том же духе' : 'Пройди любой блок, чтобы начать'} value={p.streak} />
      <Section title="Сегодня" sub="Выполни задания и забери опыт" tone="blue">
        {DAILY_TASKS.map((t, k) => {
          const v = Math.min(t.goal, t.progress(p));
          const done = v >= t.goal;
          const claimed = p.daily.claimed.includes(t.id);
          return (
            <div key={t.id} className="topic-row static">
              <span className="topic-badge" style={{ background: done ? '#388201' : '#137aaa', boxShadow: done ? '0 3px 0 #2d6801' : '0 3px 0 #0f6288', width: 48, height: 48 }}>
                <BadgeIcon id={done ? 'check' : ICONS[k % ICONS.length]} />
              </span>
              <span className="topic-row-text">
                <b>{t.title}</b>
                <small>
                  {v} из {t.goal}
                </small>
                <span className="topic-row-bar">
                  <i style={{ width: `${(v / t.goal) * 100}%`, background: done ? '#388201' : '#137aaa' }} />
                </span>
              </span>
              {done && !claimed ? (
                <Btn className="pill" variant="green" onClick={() => claimDaily(t.id, t.xp)}>
                  +{t.xp} XP
                </Btn>
              ) : (
                <span className="row-value">{claimed ? 'Получено' : `+${t.xp} XP`}</span>
              )}
            </div>
          );
        })}
      </Section>
      <Section title="Награда за серию" sub={`${STREAK_REWARD.days} дней подряд`} tone="gold">
        <div className="topic-row static">
          <span className="topic-badge" style={{ background: '#aa6400', boxShadow: '0 3px 0 #885000', width: 48, height: 48 }}>
            <BadgeIcon id="star" />
          </span>
          <span className="topic-row-text">
            <b>+{STREAK_REWARD.xp} XP и стикер «Неделя за рулём»</b>
            <small>Занимайся {STREAK_REWARD.days} дней подряд: сейчас {Math.min(p.streak, STREAK_REWARD.days)} из {STREAK_REWARD.days}</small>
          </span>
          {streakDone && !streakClaimed && (
            <Btn
              className="pill"
              variant="green"
              onClick={() => {
                addFlag(STREAK_REWARD.flag);
                addXp(STREAK_REWARD.xp);
              }}
            >
              Забрать
            </Btn>
          )}
          {streakClaimed && <span className="row-value">Получено</span>}
        </div>
      </Section>
    </div>
  );
}
