import { useEffect, useState } from 'react';
import { BRAND, LANGS, getLang, setLang, type Lang } from '../i18n/lang';
import { LEGAL, isLegalFilled } from './config';
import { PRIVACY_TEXT } from './text';
import '../landing/landing.css';
import './privacy.css';

/** Minden, az app által ezen az eszközön tárolt adat törlése (localStorage, offline cache, service worker). */
export async function deleteAllLocalData() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sorlabor.'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* nem elérhető */
  }
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('sorlabor')).map((k) => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    /* nem elérhető */
  }
}

export default function Privacy({ onBack }: { onBack: () => void }) {
  const [lang, setLangState] = useState<Lang>(getLang());
  const [done, setDone] = useState(false);
  const tx = PRIVACY_TEXT[lang];
  const brand = BRAND[lang];

  useEffect(() => {
    document.title = `${tx.title} – ${brand.name}`;
    window.scrollTo(0, 0);
  }, [tx.title, brand.name]);

  const onDelete = async () => {
    if (!confirm(tx.deleteConfirm)) return;
    await deleteAllLocalData();
    setDone(true);
  };

  return (
    <div className="landing privacy">
      <header className="l-nav">
        <a className="l-brand" href="#/" aria-label={brand.name}>
          <span className="l-mark">🍺</span>
          <span>{brand.name}</span>
        </a>
        <div className="l-nav-right">
          <div className="l-lang" role="group" aria-label="Nyelv / Language / Sprache">
            {LANGS.map((l) => (
              <button key={l.id} className={lang === l.id ? 'on' : ''} aria-pressed={lang === l.id} onClick={() => { setLang(l.id); setLangState(l.id); }}>
                {l.id.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="l-btn small" onClick={onBack}>← {tx.back}</button>
        </div>
      </header>

      <main className="pv-main">
        <h1>{tx.title}</h1>
        <div className="pv-updated">{tx.updated}: {new Date(LEGAL.updated).toLocaleDateString(LANGS.find((l) => l.id === lang)!.locale)}</div>
        {!isLegalFilled() && <div className="pv-warn">⚠ {tx.notFilled}</div>}

        <section className="pv-summary">
          <h2>{tx.summaryTitle}</h2>
          <ul>{tx.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </section>

        {tx.sections.map((sec, i) => (
          <section key={i} className="pv-section">
            <h2>{sec.h}</h2>
            {sec.p.map((p, j) => <p key={j}>{p}</p>)}
            {i === 1 && (
              <table className="pv-table">
                <thead><tr><th>{tx.storageTable.head[0]}</th><th>{tx.storageTable.head[1]}</th></tr></thead>
                <tbody>{tx.storageTable.rows.map(([a, b]) => <tr key={a}><td>{a}</td><td>{b}</td></tr>)}</tbody>
              </table>
            )}
          </section>
        ))}

        <section className="pv-delete">
          <h2>🗑 {tx.deleteTitle}</h2>
          <p>{tx.deleteText}</p>
          {done ? <div className="pv-done">✓ {tx.deleteDone}</div> : <button className="l-btn pv-del-btn" onClick={onDelete}>{tx.deleteBtn}</button>}
        </section>
      </main>
    </div>
  );
}
