import { closePaywall, PRICE_STARS, subscribe, usePremium } from '../premium';
import { Btn, Sheet } from './UI';
import { UiIcon } from './Icons';

/** Окно подписки поверх любого экрана: открывается, когда человек нажал на платную часть. */
export function PaywallHost() {
  const { paywall, subscribed } = usePremium();
  if (!paywall || subscribed) return null;
  return (
    <Sheet onClose={closePaywall} title="Подписка">
      <PaywallCard />
      <Btn wide variant="ghost" onClick={closePaywall}>
        Не сейчас
      </Btn>
    </Sheet>
  );
}

export function PaywallCard() {
  const { busy, error, trialOver, trialLeft } = usePremium();
  return (
    <>
      <div className="card paywall-card">
        <span className="paywall-ico">
          <UiIcon id="shield" size={34} />
        </span>
        <h2>Подписка на месяц</h2>
        {trialOver && <p className="muted">Пробный день закончился. Чтобы продолжить, оформи подписку.</p>}
        {trialLeft > 0 && <p className="muted">Пробный день ещё идёт: сейчас всё открыто. Подписка понадобится потом.</p>}
        <ul className="paywall-list">
          <li>Весь курс: все темы после «Старта» с теорией и билетами</li>
          <li>Повторение: разбор ошибок и теория по темам</li>
          <li>Карточки без лимита, бесплатно только 20 за раз</li>
          <li>В экзамене: вопросы по номеру и по темам</li>
        </ul>
        <dl className="paywall-terms">
          <div><dt>Цена</dt><dd>{PRICE_STARS} Star в месяц</dd></div>
          <div><dt>Срок</dt><dd>30 дней, продлевается автоматически</dd></div>
          <div><dt>Отмена</dt><dd>В любой момент в настройках Telegram, раздел «Подписки»</dd></div>
          <div><dt>Оплата</dt><dd>Telegram Stars, внутри Telegram</dd></div>
        </dl>
        <Btn big wide disabled={busy} onClick={subscribe}>
          {busy ? 'Открываем оплату…' : `Открыть за ${PRICE_STARS} Star в месяц`}
        </Btn>
        {error && <p className="err">{error}</p>}
      </div>
    </>
  );
}
