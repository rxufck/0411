import { useState } from 'react';
import { CITY_TASKS } from '../data/city';
import { QUESTIONS } from '../data/questions';
import { SIGNS } from '../data/signs';
import { Scene } from '../components/Scene';
import { Illustration } from '../components/Illustration';
import { Sign } from '../components/Sign';
import { Inspector, SignScene, TopicThumb } from '../components/Art';
import { TOPICS } from '../data/course';

/** Служебная страница (#gallery): все сцены и знаки разом — для проверки контента. */
export function Gallery() {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="gallery">
      <button onClick={() => setPlaying((p) => !p)}>{playing ? 'Стоп' : 'Анимация'}</button>
      <h2>Персонаж и иллюстрации</h2>
      <div className="gallery-row" data-id="art">
        {(['happy', 'cheer', 'sad', 'think', 'wow'] as const).map((m) => (
          <Inspector key={m} mood={m} size={140} />
        ))}
        <div style={{ width: 320 }}>
          <SignScene sign={{ id: '2.1' }} />
        </div>
        {TOPICS.map((t) => (
          <TopicThumb key={t.topic} thumb={t.thumb} />
        ))}
      </div>
      <h2>Знаки</h2>
      <div className="gallery-row">
        {SIGNS.map((s) => (
          <div key={s.id} className="gallery-item">
            <Sign sign={{ id: s.id, value: s.value }} size={90} />
            <small>{s.id}</small>
          </div>
        ))}
      </div>
      <h2>Город</h2>
      <div className="gallery-row">
        {CITY_TASKS.map((t) => {
          const correct = t.options.find((o) => o.correct);
          return (
            <div key={t.id} className="gallery-item" data-id={t.id}>
              <Scene
                scene={playing && t.sceneAfter ? t.sceneAfter : t.scene}
                paths={t.kind === 'path' ? t.options.map((o) => ({ id: o.id, move: o.move! })) : undefined}
                play={playing}
                playerMove={t.kind === 'path' ? correct?.move : undefined}
              />
              <small>
                {t.id}: {t.command}
              </small>
            </div>
          );
        })}
      </div>
      <h2>Вопросы с картинками</h2>
      <div className="gallery-row">
        {QUESTIONS.filter((q) => q.image && q.image.kind !== 'sign').map((q) => (
          <div key={q.id} className="gallery-item">
            <Illustration img={q.image!} />
            <small>{q.text}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
