import { useState } from 'react';
import { useProgress } from '../store';
import { CityBackdrop, Inspector } from '../components/Art';
import { Btn } from '../components/UI';

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
    title: 'Учись по шагам',
    text: 'Каждая тема — это теория с картинками, практика с подсказками, закрепление и контрольная. Ошибки не страшны: подскажем и объясним.',
  },
  { title: 'Как тебя зовут?', text: 'Инспектор будет обращаться к тебе по имени.' },
];

export function Welcome() {
  const { p, setName, finishOnboarding } = useProgress();
  const [i, setI] = useState(0);
  const [name, setNameDraft] = useState(p.name);

  const go = () => {
    if (i < SLIDES.length - 1) return setI(i + 1);
    setName(name.trim().slice(0, 20));
    finishOnboarding();
  };

  return (
    <div className="welcome">
      <div className="welcome-bg">
        <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMax slice">
          <CityBackdrop />
        </svg>
      </div>
      <div className="welcome-inner" key={i}>
        {i === 0 && <Logo />}
        <h2 className="welcome-title">{SLIDES[i].title}</h2>
        {SLIDES[i].text && <p className="welcome-text">{SLIDES[i].text}</p>}
        {i === 1 && (
          <div className="welcome-steps">
            {['📖 Теория', '💡 Практика', '🔁 Закрепление', '🏁 Контрольная'].map((s, k) => (
              <div key={k} className="welcome-step" style={{ animationDelay: `${k * 0.12}s` }}>
                {s}
              </div>
            ))}
          </div>
        )}
        {i === 2 && (
          <input className="name-input" autoFocus value={name} onChange={(e) => setNameDraft(e.target.value)} placeholder="Например, Аня" maxLength={20} onKeyDown={(e) => e.key === 'Enter' && go()} />
        )}
        <div className="welcome-hero">
          <Inspector mood={i === 2 ? 'wow' : 'cheer'} size={i === 0 ? 250 : 190} />
        </div>
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
