/**
 * A landing "Bevált receptek" szekciója – külön (lusta) csomag, mert a számításokhoz
 * a katalógus és a számítási motor kell. Csak akkor töltődik, amikor a látogató közel ér.
 */
import type { CSSProperties } from 'react';
import { PRESETS } from '../data/presets';
import { recipeFromPreset } from '../lib/presets';
import { computeStats, srmToHex } from '../lib/calc';
import { getStyle } from '../lib/catalog';
import { FEATURED, isFlavored } from '../lib/presetMeta';
import { presetDesc, presetName, styleName } from '../lib/names';
import { dec, type Lang } from '../i18n';
import type { LandingText } from './text';
import type { Entry } from './Landing';

export default function LandingRecipes({ tx, go, lang }: { tx: LandingText; go: (e: Entry) => void; lang: Lang }) {
  void lang; // nyelvváltáskor újrarenderel (a nevek a globális nyelvből jönnek)
  const items = FEATURED.map((id) => PRESETS.find((p) => p.id === id)!).filter(Boolean).map((p) => {
    const s = computeStats(recipeFromPreset(p));
    return { p, s, style: getStyle(p.styleId), flavored: isFlavored(p), color: srmToHex(s.srm) };
  });

  return (
    <>
      <div className="lr-grid">
        {items.map(({ p, s, style, flavored, color }, i) => (
          <article key={p.id} className="lr-card reveal in" style={{ '--i': i, '--beer': color } as CSSProperties}>
            <div className="lr-art" aria-hidden>
              <svg viewBox="0 0 60 90" className="lr-glass">
                <defs>
                  <clipPath id={`lr-${p.id}`}><path d="M8 6 L52 6 L46 84 Q30 88 14 84 Z" /></clipPath>
                </defs>
                <g clipPath={`url(#lr-${p.id})`}>
                  <g className="lr-liquid">
                    <rect x="0" y="0" width="60" height="100" fill={color} />
                    <rect x="0" y="0" width="60" height="100" fill="url(#lr-shade)" />
                    <circle className="lr-bubble" cx="22" cy="78" r="1.6" />
                    <circle className="lr-bubble b2" cx="34" cy="80" r="1.2" />
                    <circle className="lr-bubble b3" cx="40" cy="76" r="1.4" />
                    <rect className="lr-foam" x="0" y="-7" width="60" height="9" fill="#f6ead2" />
                  </g>
                </g>
                <path d="M8 6 L52 6 L46 84 Q30 88 14 84 Z" fill="none" stroke="rgba(255,246,230,.55)" strokeWidth="1.6" />
              </svg>
            </div>
            <div className="lr-body">
              <div className="lr-badges">
                <span className={`lr-badge lvl-${p.level}`}>{tx.recipes.levels[p.level]}</span>
                {flavored && <span className="lr-badge flav">🍒 {tx.recipes.flavored}</span>}
              </div>
              <h3>{presetName(p)}</h3>
              <div className="lr-style">{style?.code} · {style ? styleName(style) : ''}</div>
              <p>{presetDesc(p)}</p>
              <div className="lr-stats">
                <span><b>{dec(s.abv, 1)}%</b> ABV</span>
                <span><b>{dec(s.ibu, 0)}</b> IBU</span>
                <span><b>{dec(s.ebc, 0)}</b> EBC</span>
              </div>
              <button className="l-btn primary lr-brew" onClick={() => go(`recipe:${p.id}`)}>{tx.recipes.brew} →</button>
            </div>
          </article>
        ))}
      </div>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <linearGradient id="lr-shade" x1="0" x2="1">
            <stop offset="0" stopColor="#000" stopOpacity=".28" />
            <stop offset=".3" stopColor="#fff" stopOpacity=".14" />
            <stop offset=".6" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".32" />
          </linearGradient>
        </defs>
      </svg>
      <div className="l-ctas center" style={{ marginTop: 28 }}>
        <button className="l-btn ghost" onClick={() => go('recipes')}>⭐ {tx.recipes.all} →</button>
      </div>
    </>
  );
}
