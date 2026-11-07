import { useEffect, useState } from 'react';
import type { Illustration as Img } from '../types';

/**
 * Фото из официального билета ГИБДД.
 * Если картинка не загрузилась (плохая связь, сбой хостинга), сама пробует ещё два раза,
 * а потом показывает кнопку «Загрузить ещё раз» вместо пустой рамки.
 */
export function Illustration({ img }: { img: Img }) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setAttempt(0);
    setFailed(false);
  }, [img.src]);

  const src = attempt ? `${img.src}?r=${attempt}` : img.src;

  return (
    <div className="illus illus-card illus-photo">
      {failed ? (
        <button
          className="illus-retry"
          onClick={() => {
            setFailed(false);
            setAttempt((n) => n + 1);
          }}
        >
          Фото не загрузилось. Нажми, чтобы загрузить ещё раз
        </button>
      ) : (
        <img
          src={src}
          alt="Фото к вопросу"
          onError={() => {
            if (attempt < 2) setTimeout(() => setAttempt((n) => n + 1), 600 * (attempt + 1));
            else setFailed(true);
          }}
        />
      )}
    </div>
  );
}
