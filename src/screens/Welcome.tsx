import { useState } from 'react';
import { useProgress } from '../store';
import { Btn } from '../components/UI';
import { UiIcon } from '../components/Icons';
import { telegramName } from '../telegram';

export function Logo({ small }: { small?: boolean }) {
  return (
    <div className={`logo-big ${small ? 'small' : ''}`}>
      <span className="logo-pdd">ПДД</span>
      <span className="logo-quest">квест</span>
    </div>
  );
}

const SLIDES = [
  { title: 'Изучи правила.\nСтань уверенным водителем!', text: '' },
  {
    title: 'Учись по блокам',
    text: 'Каждая тема поделена на небольшие блоки: сначала короткая теория, потом настоящие вопросы из билетов с подсказками. В конце темы — контрольная.',
  },
  { title: 'Как тебя зовут?', text: 'Так мы будем обращаться к тебе в приложении.' },
];

export function Welcome() {
  const { p, setName, finishOnboarding } = useProgress();
  const [i, setI] = useState(0);
  const [name, setNameDraft] = useState(p.name || telegramName());

  const go = () => {
    if (i < SLIDES.length - 1) return setI(i + 1);
    setName(name.trim().slice(0, 20));
    finishOnboarding();
  };

  return (
    <div className="welcome">
      <div className="welcome-inner" key={i}>
        {i === 0 && <Logo />}
        <h2 className="welcome-title">{SLIDES[i].title}</h2>
        {SLIDES[i].text && <p className="welcome-text">{SLIDES[i].text}</p>}
        {i === 1 && (
          <div className="welcome-steps">
            {([['book', 'Теория блока'], ['ticket', 'Билеты с подсказками'], ['flag', 'Контрольная темы']] as const).map(([ic, s], k) => (
              <div key={k} className="welcome-step" style={{ animationDelay: `${k * 0.12}s` }}>
                <UiIcon id={ic} size={22} /> {s}
              </div>
            ))}
          </div>
        )}
        {i === 2 && (
          <input className="name-input" autoFocus value={name} onChange={(e) => setNameDraft(e.target.value)} placeholder="Например, Аня" maxLength={20} onKeyDown={(e) => e.key === 'Enter' && go()} />
        )}
      </div>
      <div className="welcome-foot">
        <Btn big wide variant="yellow" onClick={go}>
          {i === 0 ? 'Начать' : i === SLIDES.length - 1 ? 'Поехали!' : 'Дальше'}
        </Btn>
        <div className="dots">
          {SLIDES.map((_, k) => (
            <span key={k} className={k === i ? 'on' : ''} />
          ))}
        </div>
      </div>
    </div>
  );
}
