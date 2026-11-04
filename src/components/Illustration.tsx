import type { Illustration as Img } from '../types';

/** Фото из официального билета ГИБДД. */
export function Illustration({ img }: { img: Img }) {
  return (
    <div className="illus illus-card illus-photo">
      <img src={img.src} alt="Фото к вопросу" loading="lazy" />
    </div>
  );
}
