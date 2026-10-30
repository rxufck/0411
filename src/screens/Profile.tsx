import { useState } from 'react';
import { TOPICS } from '../data/course';
import { ACHIEVEMENTS, DAILY_TASKS, STREAK_REWARD } from '../data/goals';
import { levelInfo, topicAccuracy, useProgress } from '../store';
import { Inspector } from '../components/Art';
import { Avatar, BackBtn, Btn, Modal, StatTile, useHearts } from '../components/UI';

export function ProfileScreen({ onDaily, onSigns }: { onDaily: () => void; onSigns: () => void }) {
  const { p, setName, setSettings, reset } = useProgress();
  const lv = levelInfo(p.xp);
  const { hearts } = useHearts();
  const [allAch, setAllAch] = useState(false);
  const [settings, setSettingsOpen] = useState(false);
  const [editName, setEditName] = useState(false);
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
      <div className="page-head">
        <h1 className="page-title">Мой прогресс</h1>
        <button className="mini-btn" onClick={() => setSettingsOpen(true)} aria-label="Настройки">
          ⚙️
        </button>
      </div>

      <div className="card prof-card">
        <Avatar size={78} />
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
              <button className="mini-btn">✓</button>
            </form>
          ) : (
            <button className="prof-name" onClick={() => setEditName(true)}>
              {p.name || 'Без имени'} <span>✏️</span>
            </button>
          )}
          <small className="muted">
            {lv.title} · Уровень {lv.level}
          </small>
          <div className="mini-bar big">
            <div style={{ width: `${lv.progress * 100}%` }} />
          </div>
          <small className="muted text-right">
            {p.xp} / {lv.to} XP
          </small>
        </div>
      </div>

      <div className="tiles">
        <StatTile icon="🔥" value={p.streak} label="дней" />
        <StatTile icon="❤️" value={hearts} label="сердец" />
        <StatTile icon="⭐" value={p.xp} label="XP" />
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Достижения</h3>
          <button className="link" onClick={() => setAllAch(true)}>
            Все
          </button>
        </div>
        <div className="badges">
          {ACHIEVEMENTS.slice(0, 5).map((a) => (
            <Badge key={a.id} icon={a.icon} color={a.color} on={a.done(p)} />
          ))}
        </div>
        <small className="muted">
          Получено {unlocked.length} из {ACHIEVEMENTS.length}
        </small>
      </div>

      <div className="card">
        <h3>Статистика</h3>
        <div className="stat-list">
          <div>
            <span>✅ Правильных ответов</span>
            <b>{seen ? Math.round((right / seen) * 100) : 0}%</b>
          </div>
          <div>
            <span>🧩 Самая сложная тема</span>
            <b>{hardest ? hardest.t.title : '—'}</b>
          </div>
          <div>
            <span>💚 Любимая тема</span>
            <b>{favorite && favorite !== hardest ? favorite.t.title : '—'}</b>
          </div>
          <div>
            <span>📝 Экзамены сданы</span>
            <b>
              {p.exams.filter((e) => e.passed).length} из {p.exams.length}
            </b>
          </div>
          <div>
            <span>🚗 Поездок по городу</span>
            <b>{p.rides}</b>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Твои слабые темы</h3>
        {weak.length === 0 ? (
          <p className="muted">Пока нечего подтягивать. Отвечай на вопросы — и здесь появится подсказка, что повторить.</p>
        ) : (
          weak.map((w) => (
            <div key={w.t.topic} className="weak-row">
              <span>
                {w.t.emoji} {w.t.title}
              </span>
              <div className="acc-bar">
                <div style={{ width: `${w.pct}%` }} />
              </div>
              <b>{w.pct}%</b>
            </div>
          ))
        )}
      </div>

      <div className="link-cards">
        <button className="card rev-row clickable" onClick={onDaily}>
          <span className="big-ico">🎯</span>
          <div className="rev-text">
            <b>Ежедневные задания</b>
            <small className="muted">Выполнено {DAILY_TASKS.filter((t) => t.progress(p) >= t.goal).length} из {DAILY_TASKS.length}</small>
          </div>
          <span className="chev">›</span>
        </button>
        <button className="card rev-row clickable" onClick={onSigns}>
          <span className="big-ico">🚸</span>
          <div className="rev-text">
            <b>Справочник знаков</b>
            <small className="muted">Все знаки с объяснениями</small>
          </div>
          <span className="chev">›</span>
        </button>
      </div>

      {allAch && (
        <Modal onClose={() => setAllAch(false)}>
          <h2>Достижения</h2>
          <div className="ach-list">
            {ACHIEVEMENTS.map((a) => (
              <div key={a.id} className={`ach ${a.done(p) ? 'on' : ''}`}>
                <Badge icon={a.icon} color={a.color} on={a.done(p)} />
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

      {settings && (
        <Modal onClose={() => setSettingsOpen(false)}>
          <h2>Настройки</h2>
          <div className="settings">
            <label className="toggle">
              <input type="checkbox" checked={p.settings.sound} onChange={(e) => setSettings({ sound: e.target.checked })} />
              <span>🔔 Звуки</span>
            </label>
            <label className="toggle">
              <input type="checkbox" checked={p.settings.voice} onChange={(e) => setSettings({ voice: e.target.checked })} />
              <span>🗣️ Голос инструктора</span>
            </label>
            <div className="goal-row">
              <span>🎯 Цель на день:</span>
              {[20, 50, 100].map((g) => (
                <button key={g} className={`chip ${p.settings.dailyGoal === g ? 'chip-on' : ''}`} onClick={() => setSettings({ dailyGoal: g })}>
                  {g} XP
                </button>
              ))}
            </div>
            <Btn
              variant="ghost"
              onClick={() => {
                if (confirm('Сбросить весь прогресс? Это действие нельзя отменить.')) reset();
              }}
            >
              Сбросить прогресс
            </Btn>
          </div>
          <p className="muted small">Вопросы составлены по Правилам дорожного движения РФ. Перед экзаменом сверяйтесь с актуальной редакцией ПДД. Машинки и деревья в сценах — Kenney (kenney.nl, CC0).</p>
          <Btn wide onClick={() => setSettingsOpen(false)}>
            Готово
          </Btn>
        </Modal>
      )}
    </div>
  );
}

function Badge({ icon, color, on }: { icon: string; color: string; on: boolean }) {
  return (
    <div className={`badge ${on ? 'on' : ''}`} style={on ? { background: color } : undefined}>
      <span>{on ? icon : '🔒'}</span>
    </div>
  );
}

export function DailyScreen({ onBack }: { onBack: () => void }) {
  const { p, claimDaily, addFlag, addXp } = useProgress();
  const streakDone = p.streak >= STREAK_REWARD.days;
  const streakClaimed = p.flags.includes(STREAK_REWARD.flag);
  return (
    <div className="page">
      <div className="page-head">
        <BackBtn onClick={onBack} />
        <h1 className="page-title">Ежедневные задания</h1>
      </div>
      <div className="card streak-card">
        <span className="streak-fire">🔥</span>
        <div>
          <b>Серия: {p.streak} дн.</b>
          <small className="muted">{p.streak ? 'Продолжай в том же духе!' : 'Пройди любой урок, чтобы начать серию.'}</small>
        </div>
      </div>
      {DAILY_TASKS.map((t) => {
        const v = Math.min(t.goal, t.progress(p));
        const done = v >= t.goal;
        const claimed = p.daily.claimed.includes(t.id);
        return (
          <div key={t.id} className={`card task ${done ? 'done' : ''}`}>
            <span className="task-check">{done ? '✓' : ''}</span>
            <div className="task-text">
              <b>{t.title}</b>
              <div className="acc-row">
                <div className="acc-bar">
                  <div style={{ width: `${(v / t.goal) * 100}%`, background: '#2bb24c' }} />
                </div>
                <small>
                  {v}/{t.goal}
                </small>
              </div>
            </div>
            {done && !claimed ? (
              <Btn className="pill" variant="yellow" onClick={() => claimDaily(t.id, t.xp)}>
                +{t.xp} XP
              </Btn>
            ) : (
              <span className={`task-xp ${claimed ? 'claimed' : ''}`}>{claimed ? 'Получено' : `⭐ +${t.xp} XP`}</span>
            )}
          </div>
        );
      })}
      <div className="card reward-card">
        <span className="reward-gift">🎁</span>
        <div>
          <b>Награда за серию</b>
          <div className="reward-xp">⭐ +{STREAK_REWARD.xp} XP</div>
          <small className="muted">Достигни {STREAK_REWARD.days} дней подряд и получи особый стикер «Неделя за рулём»!</small>
        </div>
        {streakDone && !streakClaimed && (
          <Btn
            className="pill"
            variant="yellow"
            onClick={() => {
              addFlag(STREAK_REWARD.flag);
              addXp(STREAK_REWARD.xp);
            }}
          >
            Забрать
          </Btn>
        )}
      </div>
      <div className="center">
        <Inspector mood="happy" size={110} />
      </div>
    </div>
  );
}
