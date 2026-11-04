import { PRICE_STARS, subscribe, usePremium } from '../premium';
import { Btn } from './UI';
import { UiIcon } from './Icons';

/** Экран-замок: экзамен и разбор ошибок доступны по подписке. */
export function Paywall({ title }: { title: string }) {
  return (
    <div className="page paywall">
      <h1 className="page-title">{title}</h1>
      <PaywallCard />
    </div>
  );
}

export function PaywallCard() {
  const { busy, error } = usePremium();
  return (
    <>
      <div className="card paywall-card">
        <span className="paywall-ico">
          <UiIcon id="shield" size={34} />
        </span>
        <h2>Подписка на месяц</h2>
        <ul className="paywall-list">
          <li>Экзамен ГИБДД: 40 билетов, марафон и разбор по темам</li>
          <li>Разбор ошибок: повторение и подсказки, где ты ошибаешься</li>
          <li>Обучение, карточки и жизни остаются бесплатными</li>
        </ul>
        <Btn big wide disabled={busy} onClick={subscribe}>
          {busy ? 'Открываем оплату…' : `Открыть за ${PRICE_STARS} Stars в месяц`}
        </Btn>
        {error && <p className="err">{error}</p>}
        <small className="muted">Оплата в Telegram Stars. Продлевается каждые 30 дней, отменить можно в настройках Telegram.</small>
      </div>
    </>
  );
}
