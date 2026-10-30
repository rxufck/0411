import { useState } from 'react';
import { SIGN_GROUPS, SIGNS, type SignInfo } from '../data/signs';
import { Sign } from '../components/Sign';
import { SignScene } from '../components/Art';
import { BackBtn, Btn, Modal } from '../components/UI';

export function SignsGuide({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState<SignInfo | null>(null);
  return (
    <div className="page">
      <div className="page-head">
        <BackBtn onClick={onBack} />
        <h1 className="page-title">Справочник знаков</h1>
      </div>
      <p className="muted">Нажми на знак, чтобы узнать, что он значит.</p>
      {SIGN_GROUPS.map((g) => (
        <section key={g.topic}>
          <h2 className="section-title" style={{ color: g.color }}>
            {g.title}
          </h2>
          <div className="guide-grid">
            {SIGNS.filter((s) => s.topic === g.topic).map((s) => (
              <button key={s.id} className="guide-card" onClick={() => setOpen(s)}>
                <Sign sign={{ id: s.id, value: s.value }} size={68} />
                <span className="guide-id">{s.id}</span>
                <span className="guide-name">{s.name}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      {open && (
        <Modal onClose={() => setOpen(null)}>
          <div className="modal-scene">
            <SignScene sign={{ id: open.id, value: open.value }} />
          </div>
          <div className="muted">Знак {open.id}</div>
          <h2>{open.name}</h2>
          <p>{open.desc}</p>
          <Btn wide onClick={() => setOpen(null)}>
            Понятно
          </Btn>
        </Modal>
      )}
    </div>
  );
}
