import { useState } from 'react';
import type { TopicId } from '../types';
import { controlPass, controlSize, isMastered, nextStep, nextUnit, STAGES, stepKey, ticketMastery, TOPICS, topicById, topicComplete, unitKey, unitMastery } from '../data/course';
import { topicUnits, type Unit } from '../data/units';
import { useTickets } from '../data/tickets';
import { todayStr, useProgress, type Progress } from '../store';
import { openPaywall, usePremium } from '../premium';
import { UiIcon } from '../components/Icons';
import { BadgeIcon, Btn, ProfileHeader, Sheet, TopicBadge } from '../components/UI';
import { DAILY_TASKS } from '../data/goals';

const plural = (n: number, one: string, few: string, many: string) =>
  n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many;

/** Доля пройденного в теме: прочитанные блоки, освоенные билеты и контрольная — поровну. */
function topicProgress(topic: TopicId, p: Progress) {
  const units = topicUnits(topic);
  const read = units.length ? units.filter((u) => p.done.includes(unitKey(topic, u))).length / units.length : 0;
  const m = ticketMastery(topic, p.stats);
  return (read + (m.total ? m.done / m.total : 0) + Number(p.done.includes(stepKey(topic, 'control')))) / 3;
}

const DAY = 86400000;

/** Дата экзамена, прогноз готовности и план на сегодня. Серия с заморозками. */
function ExamPlan({ masteredQ, totalQ }: { masteredQ: number; totalQ: number }) {
  const { p, setExamDate } = useProgress();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(p.examDate ?? '');
  const today = todayStr();
  const left = p.examDate ? Math.round((Date.parse(p.examDate) - Date.parse(today)) / DAY) : null;
  const remaining = Math.max(0, totalQ - masteredQ);
  const perDay = left !== null && left > 0 ? Math.ceil(remaining / left) : remaining;
  const doneToday = p.today.q ?? 0;
  const ready = Math.round((masteredQ / totalQ) * 100);
  const tooMuch = left !== null && left > 0 && perDay > 60;

  let title = 'Назначь дату экзамена';
  let sub = 'Посчитаем, сколько вопросов решать в день';
  if (left !== null) {
    if (left < 0) {
      title = 'Дата экзамена прошла';
      sub = 'Выбери новую дату, чтобы получить план';
    } else if (left === 0) {
      title = 'Экзамен сегодня';
      sub = `Освоено ${ready}% вопросов. Пройди пару билетов для разминки`;
    } else {
      title = `До экзамена ${left} ${plural(left, 'день', 'дня', 'дней')}`;
      sub = remaining === 0 ? 'Все вопросы освоены. Повторяй ошибки' : `Освоено ${ready}%. Нужно ${perDay} ${plural(perDay, 'вопрос', 'вопроса', 'вопросов')} в день`;
    }
  }

  return (
    <>
      <button className="plan-card" onClick={() => { setDraft(p.examDate ?? ''); setOpen(true); }}>
        <span className="plan-ico"><UiIcon id="calendar" size={24} /></span>
        <span className="plan-text">
          <b>{title}</b>
          <small>{sub}</small>
          {left !== null && left > 0 && remaining > 0 && (
            <span className="plan-bar"><i style={{ width: `${Math.min(1, doneToday / perDay) * 100}%` }} /></span>
          )}
          {left !== null && left > 0 && remaining > 0 && (
            <small className="plan-today">
              Сегодня решено {doneToday} из {perDay}
              {tooMuch ? '. Многовато, лучше сдвинуть дату' : ''}
            </small>
          )}
        </span>
        <span className="chev">›</span>
      </button>
      {p.froze === today && <div className="plan-note">Заморозка спасла твою серию. Осталось заморозок: {p.freezes}</div>}

      {open && (
        <Sheet onClose={() => setOpen(false)} title="Дата экзамена">
          <p className="muted">Укажи день, на который записан экзамен. Приложение распределит вопросы по дням.</p>
          <input className="plan-date" type="date" min={today} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="plan-freeze">
            <UiIcon id="shield" size={20} />
            <span>
              Заморозок серии: <b>{p.freezes}</b>. Они закрывают пропущенные дни. Новая даётся за каждые 7 дней подряд, максимум 3.
            </span>
          </div>
          <Btn
            wide
            disabled={!draft}
            onClick={() => {
              setExamDate(draft);
              setOpen(false);
            }}
          >
            Сохранить
          </Btn>
          {p.examDate && (
            <Btn
              variant="white"
              wide
              onClick={() => {
                setExamDate(null);
                setOpen(false);
              }}
            >
              Убрать дату
            </Btn>
          )}
        </Sheet>
      )}
    </>
  );
}

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
  const prem = usePremium();
  const { db } = useTickets();
  const dailyDone = DAILY_TASKS.filter((t) => t.progress(p) >= t.goal).length;
  const complete = (t: TopicId) => topicComplete(t, p.done, p.stats);
  const current = TOPICS.find((t) => !complete(t.topic))?.topic;
  const totalQ = db?.questions.length ?? 800;
  const masteredQ = db ? db.questions.filter((q) => isMastered(p.stats, q.id)).length : 0;
  const cleanTickets = Object.values(p.tickets).filter((e) => e === 0).length;
  const passed = p.exams.some((e) => e.passed);

  return (
    <div className="home">
      <ProfileHeader onProfile={onProfile} />

      <div className="progress-card">
        <div className="pc-stats">
          <div className="pc-stat">
            <small>Освоено вопросов</small>
            <b>
              {masteredQ}
              <span> из {totalQ}</span>
            </b>
            <span className="pc-bar"><i style={{ width: `${(masteredQ / totalQ) * 100}%` }} /></span>
          </div>
          <div className="pc-stat">
            <small>Билетов без ошибок</small>
            <b>
              {cleanTickets}
              <span> из 40</span>
            </b>
            <span className="pc-bar gold"><i style={{ width: `${(cleanTickets / 40) * 100}%` }} /></span>
          </div>
        </div>
        <button className="pc-daily" onClick={onDaily}>
          <BadgeIcon id="target" />
          <span>
            <b>Задания на день</b>
            <small>Выполнено {dailyDone} из {DAILY_TASKS.length}</small>
          </span>
          <span className="chev">›</span>
        </button>
      </div>

      {prem.trialLeft > 0 && (
        <button className="plan-note plan-note-btn" onClick={openPaywall}>
          <span>
            Пробный день: весь курс открыт ещё {Math.max(1, Math.ceil(prem.trialLeft / 3600000))} ч. <u>Условия подписки</u>
          </span>
          <span className="chev">›</span>
        </button>
      )}
      <ExamPlan masteredQ={masteredQ} totalQ={totalQ} />

      <div className="course">
        {STAGES.map((st, si) => {
          const done = st.topics.filter(complete).length;
          return (
            <section key={st.title} className="stage">
              <header className="stage-head" style={{ borderColor: st.color }}>
                <h2>
                  {si + 1}. {st.title}
                </h2>
                <small>
                  {st.subtitle}. Пройдено {done} из {st.topics.length}
                </small>
              </header>
              {st.topics.map((tid) => {
                const t = topicById(tid);
                const isDone = complete(tid);
                const prog = topicProgress(tid, p);
                const units = topicUnits(tid).length;
                return (
                  <button key={tid} className={`topic-row ${tid === current ? 'current' : ''} ${isDone ? 'done' : ''}`} onClick={() => onTopic(tid)}>
                    <TopicBadge topic={tid} size={48} />
                    <span className="topic-row-text">
                      <b>{t.title}</b>
                      <small>
                        {units} {plural(units, 'блок', 'блока', 'блоков')}. {isDone ? 'Освоено' : `Пройдено ${Math.round(prog * 100)}%`}
                      </small>
                      <span className="topic-row-bar">
                        <i style={{ width: `${(isDone ? 1 : prog) * 100}%`, background: isDone ? 'var(--green)' : t.color }} />
                      </span>
                    </span>
                    {isDone ? (
                      <span className="topic-row-state"><UiIcon id="check" size={22} /></span>
                    ) : tid === current ? (
                      <span className="topic-row-go" style={{ background: t.color, boxShadow: `0 3px 0 ${t.shade}` }}>
                        {prog > 0 ? 'Продолжить' : 'Начать'}
                      </span>
                    ) : !prem.active && si > 0 ? (
                      <span className="topic-row-lock">Подписка</span>
                    ) : (
                      <span className="chev">›</span>
                    )}
                  </button>
                );
              })}
            </section>
          );
        })}

        <button className="topic-row exam-row" onClick={onExam}>
          <span className="topic-badge exam-badge"><UiIcon id="trophy" size={24} /></span>
          <span className="topic-row-text">
            <b>Экзамен ГИБДД</b>
            <small>{passed ? 'Сдан' : `40 билетов по 20 вопросов. Без ошибок: ${cleanTickets} из 40`}</small>
          </span>
          <span className="chev">›</span>
        </button>
      </div>
    </div>
  );
}

/** Карточка темы: блоки с теорией и билетами, затем контрольная. */
export function TopicSheet({
  topic,
  onClose,
  onControl,
  onUnit,
  onReread,
}: {
  topic: TopicId;
  onClose: () => void;
  onControl: () => void;
  onUnit: (u: Unit) => void;
  onReread: () => void;
}) {
  const { p } = useProgress();
  const { db } = useTickets();
  const t = topicById(topic);
  const best = p.best[topic];
  const rec = nextStep(topic, p.done, p.stats);
  const units = topicUnits(topic);
  const recUnit = nextUnit(topic, p.done, p.stats);
  const controlDone = p.done.includes(stepKey(topic, 'control'));
  const controlNow = rec === 'control';
  const size = controlSize(topic);
  const pill = (current: boolean, done: boolean) => (
    <span className={`step-pill ${current ? 'on' : ''}`} style={current ? { background: t.color, boxShadow: `0 4px 0 ${t.shade}` } : undefined}>
      {current ? 'Начать' : done ? <UiIcon id="repeat" size={18} /> : <UiIcon id="chevron" size={18} />}
    </span>
  );
  return (
    <Sheet onClose={onClose}>
      <div className="tsheet-head">
        <TopicBadge topic={topic} size={64} />
        <div>
          <small className="muted">{t.chapter} ПДД</small>
          <h2>{t.title}</h2>
          <p className="muted">{t.subtitle}</p>
        </div>
      </div>
      <div className="steps">
        {units.map((u, i) => {
          const um = unitMastery(topic, u, p.stats);
          const read = p.done.includes(unitKey(topic, u));
          const done = read && um.total > 0 && um.done === um.total;
          const current = recUnit === u;
          return (
            <button key={u.id} className={`step ${done ? 'done' : current ? 'current' : ''}`} onClick={() => onUnit(u)} disabled={!db}>
              <div className="step-ico" style={current ? { background: t.color, boxShadow: `0 4px 0 ${t.shade}` } : undefined}>
                {done ? <UiIcon id="check" size={26} /> : <UiIcon id={read ? 'ticket' : 'book'} size={26} />}
              </div>
              <div className="step-text">
                <b>
                  {i + 1}. {u.title}
                </b>
                <small>{read ? 'Билеты блока с подсказками' : `Сначала теория: ${u.cards.length} ${plural(u.cards.length, 'карточка', 'карточки', 'карточек')}`}</small>
                <span className="step-bar">
                  <span className="step-bar-track">
                    <i style={{ width: `${um.total ? (um.done / um.total) * 100 : 0}%`, background: t.color }} />
                  </span>
                  <em>{db ? `освоено ${um.done} из ${um.total}` : 'загружаем билеты…'}</em>
                </span>
              </div>
              {pill(current, done)}
            </button>
          );
        })}
        <button className={`step ${controlDone ? 'done' : controlNow ? 'current' : ''}`} onClick={onControl} disabled={!db}>
          <div className="step-ico" style={controlNow ? { background: t.color, boxShadow: `0 4px 0 ${t.shade}` } : undefined}>
            {controlDone ? <UiIcon id="check" size={26} /> : <UiIcon id="flag" size={26} />}
          </div>
          <div className="step-text">
            <b>{units.length + 1}. Контрольная</b>
            <small>
              {size} {plural(size, 'вопрос', 'вопроса', 'вопросов')} по всей теме, нужно {controlPass(size)} верных
              {best !== undefined ? `. Лучший результат: ${best}/${size}` : ''}
            </small>
          </div>
          {pill(controlNow, controlDone)}
        </button>
      </div>
      <Btn variant="white" wide onClick={onReread}>
        <UiIcon id="book" size={20} /> Перечитать теорию
      </Btn>
    </Sheet>
  );
}
