import type { Question } from '../types';
import { ticketCard, ticketHint } from './units';

// Подсказка к вопросу берётся из карточки теории, которая этот вопрос объясняет.
// Если в карточке несколько правил, выбираем то, что ближе всего к словам вопроса и ответов:
// так подсказка про ту же ситуацию, а не про соседнюю.

const stems = (s: string) =>
  new Set(
    (s.toLowerCase().replace(/ё/g, 'е').match(/[а-я]{4,}/g) ?? [])
      .filter((w) => !['следует', 'поступить', 'можно', 'нужно', 'какие', 'какой', 'данной', 'ситуации', 'вашим', 'ваши', 'вами'].includes(w))
      .map((w) => w.slice(0, 5)),
  );

/** Подсказка не должна пересказывать верный ответ: считаем, какая доля его слов в неё попала. */
const leaks = (hint: string, answer: string) => {
  const a = [...stems(answer)];
  if (a.length < 2) return false;
  const h = stems(hint);
  return a.filter((w) => h.has(w)).length / a.length >= 0.6;
};

export function hintFor(q: Question): string {
  if (q.hint) return q.hint;
  const ref = ticketCard(q.id);
  const base = ticketHint(q.id);
  const pointer = ref ? `Перечитай карточку «${ref.card.title}» в блоке «${ref.unit.title}»: там есть нужное правило.` : 'Вспомни теорию этого блока и выбери самый безопасный вариант.';
  const safe = (h: string | undefined) => (h && !leaks(h, q.options[q.correct]) ? h : undefined);
  if (!ref || !ref.card.points?.length) return safe(base) ?? pointer;
  const words = stems(`${q.text} ${q.options.join(' ')}`);
  let best = '';
  let top = 0;
  for (const point of ref.card.points) {
    const score = [...stems(point)].filter((w) => words.has(w)).length;
    if (score > top) {
      top = score;
      best = point;
    }
  }
  return (top >= 4 ? safe(best) : undefined) ?? safe(base) ?? pointer;
}

/** Номер одного неверного варианта, который подсказка убирает (не трогает уже выбранный). */
export function optionToDrop(q: Question, keep: number | null, already: number[]): number | null {
  const wrong = q.options.map((_, i) => i).filter((i) => i !== q.correct && i !== keep && !already.includes(i));
  if (q.options.length - already.length <= 2 || !wrong.length) return null;
  return wrong[Math.floor(Math.random() * wrong.length)];
}
