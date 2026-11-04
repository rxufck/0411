import { closePaywall, PRICE_STARS, subscribe, usePremium } from '../premium';
import { Btn, Sheet } from './UI';
import { UiIcon } from './Icons';

/** Окно подписки поверх любого экрана: открывается, когда человек нажал на платную часть. */
export function PaywallHost() {
  const { paywall, active } = usePremium();
  if (!paywall || active) return null;
  return (
    <Sheet onClose={closePaywall}>
      <PaywallCard />
      <Btn wide variant="ghost" onClick={closePaywall}>
        Не сейчас
      </Btn>
    </Sheet>
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
          <li>Разбор ошибок и повторение по темам</li>
          <li>Карточки без лимита: бесплатно только 20 за раз</li>
          <li>Обучение по темам и жизни остаются бесплатными</li>
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
