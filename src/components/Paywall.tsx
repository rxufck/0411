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
  const { busy, error, trialOver } = usePremium();
  return (
    <>
      <div className="card paywall-card">
        <span className="paywall-ico">
          <UiIcon id="shield" size={34} />
        </span>
        <h2>Подписка на месяц</h2>
        {trialOver && <p className="muted">Пробный день закончился. Чтобы продолжить, оформи подписку.</p>}
        <ul className="paywall-list">
          <li>Весь курс: все темы после «Старта» с теорией и билетами</li>
          <li>Повторение: разбор ошибок и теория по темам</li>
          <li>Карточки без лимита, бесплатно только 20 за раз</li>
          <li>В экзамене: вопросы по номеру и по темам</li>
        </ul>
        <Btn big wide disabled={busy} onClick={subscribe}>
          {busy ? 'Открываем оплату…' : `Открыть за ${PRICE_STARS} Star в месяц`}
        </Btn>
        {error && <p className="err">{error}</p>}
        <small className="muted">Оплата в Telegram Stars. Продлевается каждые 30 дней, отменить можно в настройках Telegram.</small>
      </div>
    </>
  );
}
