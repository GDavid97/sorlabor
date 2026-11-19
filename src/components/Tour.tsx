import { useEffect, useLayoutEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { t } from '../i18n';

export interface TourStep {
  /** data-tour attribútum értéke; nélküle középre igazított kártya */
  target?: string;
  title: string;
  body: ReactNode;
  before?: () => void;
}

const PAD = 8;

export function Tour({ steps, onClose, footer }: { steps: TourStep[]; onClose: () => void; footer?: ReactNode }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);
  const step = steps[i];
  const last = i === steps.length - 1;

  // lépésváltás: előkészítés + görgetés
  useLayoutEffect(() => {
    step.before?.();
    setRect(null);
    const t = setTimeout(() => {
      const el = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
      if (!el) return;
      // magas elemnél az elejéhez görgetünk, hogy a teteje látsszon
      const tall = el.getBoundingClientRect().height > window.innerHeight * 0.7;
      el.scrollIntoView({ block: tall ? 'start' : 'center' });
    }, 30);
    // ha a sima görgetés elakadt (pl. gyors lapozás), ugorjunk oda azonnal
    const t2 = setTimeout(() => {
      const el = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 40 || r.top > window.innerHeight - 40) {
        const tall = r.height > window.innerHeight * 0.7;
        el.scrollIntoView({ block: tall ? 'start' : 'center' });
      }
    }, 900);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  // a kiemelt elem pozíciójának követése (görgetés, átméretezés, tartalomváltozás)
  useEffect(() => {
    const measure = () => {
      const el = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
      const r = el?.getBoundingClientRect() ?? null;
      setRect((prev) =>
        !r ? null : prev && Math.abs(prev.top - r.top) < 0.5 && Math.abs(prev.left - r.left) < 0.5 && Math.abs(prev.height - r.height) < 0.5 && Math.abs(prev.width - r.width) < 0.5 ? prev : r,
      );
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    measure();
    const iv = setInterval(measure, 100);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      clearInterval(iv);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [step.target, i]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && !last) setI((x) => x + 1);
      if (e.key === 'ArrowLeft' && i > 0) setI((x) => x - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i, last, onClose]);

  // buborék elhelyezése
  const width = Math.min(380, vw - 32);
  let pop: CSSProperties;
  const mobile = vw < 640;
  const offscreen = !!rect && (rect.bottom < 0 || rect.top > vh);
  if (!step.target || !rect || offscreen) {
    pop = { left: (vw - width) / 2, top: Math.max(16, vh / 2 - 140), width };
  } else if (mobile) {
    pop = { left: 16, right: 16, bottom: 16 };
  } else {
    const below = vh - rect.bottom;
    const left = Math.max(16, Math.min(vw - width - 16, rect.left + rect.width / 2 - width / 2));
    if (below > 240) pop = { left, top: rect.bottom + PAD + 10, width };
    else if (rect.top > 240) pop = { left, bottom: vh - rect.top + PAD + 10, width };
    else pop = { left: Math.max(16, Math.min(vw - width - 16, rect.right - width - 16)), bottom: 24, width };
  }

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label={t('Bemutató')}>
      {step.target && rect && !offscreen ? (
        (() => {
          // 4 sötétítő panel a kivágás körül + keret (megbízhatóbb, mint egy óriás box-shadow)
          const t = Math.max(0, rect.top - PAD);
          const l = Math.max(0, rect.left - PAD);
          const b = Math.min(vh, rect.bottom + PAD);
          const r = Math.min(vw, rect.right + PAD);
          return (
            <>
              <div className="tour-shade" style={{ top: 0, left: 0, right: 0, height: t }} />
              <div className="tour-shade" style={{ top: b, left: 0, right: 0, bottom: 0 }} />
              <div className="tour-shade" style={{ top: t, left: 0, width: l, height: b - t }} />
              <div className="tour-shade" style={{ top: t, left: r, right: 0, height: b - t }} />
              <div className="tour-ring" style={{ top: t, left: l, width: r - l, height: b - t }} />
            </>
          );
        })()
      ) : (
        <div className="tour-dim" />
      )}
      <div className="tour-pop" style={pop}>
        <div className="row">
          <span className="label">{t('Bemutató')} · {i + 1} / {steps.length}</span>
          <span className="spacer" />
          <button className="btn ghost sm" onClick={onClose}>{t('Kihagyás')} ✕</button>
        </div>
        <h3 className="tour-title">{step.title}</h3>
        <div className="tour-body">{step.body}</div>
        {last && footer}
        <div className="tour-dots" aria-hidden>
          {steps.map((_, k) => <span key={k} className={k === i ? 'on' : k < i ? 'past' : ''} />)}
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn sm" disabled={i === 0} onClick={() => setI(i - 1)}>← {t('Vissza')}</button>
          <span className="spacer" />
          {last ? (
            <button className="btn primary sm" onClick={onClose}>{t('Kezdjük!')} 🍺</button>
          ) : (
            <button className="btn primary sm" onClick={() => setI(i + 1)}>{t('Tovább')} →</button>
          )}
        </div>
      </div>
    </div>
  );
}
