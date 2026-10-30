import type { Illustration as Img } from '../types';
import { Sign } from './Sign';
import { Officer, TrafficLight } from './Pictures';
import { type PathMark, Scene } from './Scene';
import { CityBackdrop, SignScene } from './Art';

export function Illustration({ img, marks }: { img: Img; marks?: Record<string, PathMark> }) {
  switch (img.kind) {
    case 'sign':
      return (
        <div className="illus illus-card">
          <SignScene sign={img.sign} />
        </div>
      );
    case 'signs':
      return (
        <div className="illus illus-card illus-signs">
          {img.signs.map((s, i) => (
            <div key={i} className="sign-num">
              <Sign sign={s} size={104} />
              <span>{s.id}</span>
            </div>
          ))}
        </div>
      );
    case 'light':
      return (
        <div className="illus illus-card illus-over">
          <svg viewBox="0 0 320 180" className="sign-scene">
            <CityBackdrop />
          </svg>
          <div className="illus-overlay">
            <TrafficLight state={img.state} arrowRight={img.arrowRight} size={140} />
          </div>
        </div>
      );
    case 'officer':
      return (
        <div className="illus illus-card illus-over">
          <svg viewBox="0 0 320 180" className="sign-scene">
            <CityBackdrop />
          </svg>
          <div className="illus-overlay">
            <Officer pose={img.pose} size={160} />
          </div>
        </div>
      );
    case 'scene':
      return (
        <div className="illus illus-scene">
          <Scene scene={img.scene} paths={img.paths} marks={marks} />
          <div className="scene-caption">
            <span className="dot-red" /> красный автомобиль — ваш
          </div>
        </div>
      );
    case 'photo':
      return (
        <div className="illus illus-card illus-photo">
          <img src={img.src} alt="Иллюстрация к вопросу" loading="lazy" />
        </div>
      );
    case 'emoji':
      return <div className="illus illus-emoji">{img.emoji}</div>;
  }
}
