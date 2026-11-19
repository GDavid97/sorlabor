import { Suspense, lazy, useEffect, useRef, useState, type CSSProperties } from 'react';
import { BRAND, LANGS, getLang, setLang, type Lang } from '../i18n/lang';
import { LANDING_TEXT } from './text';
import { useInstallPrompt } from '../lib/pwa';
import './landing.css';

/** A receptszekció külön csomag (katalógus + számítás) – csak a közelébe érve töltődik. */
const LandingRecipes = lazy(() => import('./LandingRecipes'));

export type Entry = 'app' | 'tour' | 'recipes' | `recipe:${string}`;

/** Sörszínek a skála-szekcióhoz (SRM → hex). */
const BEER_COLORS = ['#FFCA5A', '#FFBF42', '#EA8F00', '#DE7C00', '#C35900', '#A63E00', '#6A0E00', '#36080A'];
const BEER_EBC = [6, 8, 16, 20, 28, 35, 55, 79];

/** Buborékok: x (%), méret, időtartam, késleltetés – fix értékek, hogy ne legyen véletlen újrarenderelés. */
const BUBBLES = [
  [18, 3, 4.2, 0], [26, 2, 3.4, 1.1], [34, 2.5, 5.1, 0.4], [42, 1.6, 3.8, 2.2], [50, 3, 4.6, 1.6],
  [57, 2, 3.2, 0.7], [64, 2.6, 4.9, 2.8], [71, 1.8, 3.6, 0.2], [78, 2.4, 4.4, 1.9], [30, 1.5, 3.1, 3.1],
  [46, 2.2, 5.4, 3.6], [60, 1.4, 2.9, 2.5], [38, 2.8, 4.1, 4.2], [68, 2, 3.9, 3.9],
] as const;

const HOPS = [
  { x: '6%', y: '18%', s: 54, d: 14, delay: 0, r: -18 },
  { x: '88%', y: '12%', s: 38, d: 17, delay: 2, r: 24 },
  { x: '80%', y: '72%', s: 64, d: 19, delay: 1, r: -8 },
  { x: '12%', y: '78%', s: 34, d: 15, delay: 3, r: 32 },
  { x: '48%', y: '6%', s: 28, d: 21, delay: 4, r: 10 },
];

function Hop({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 40 50" aria-hidden>
      <path d="M20 2 C21 6 23 7 25 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((row) =>
        Array.from({ length: row === 0 || row === 4 ? 2 : 3 }).map((_, i, arr) => {
          const w = 9 - Math.abs(row - 2) * 0.8;
          const cx = 20 + (i - (arr.length - 1) / 2) * w * 0.95;
          const cy = 12 + row * 7.5;
          return <path key={`${row}-${i}`} d={`M${cx - w / 2} ${cy} Q${cx} ${cy + 9} ${cx + w / 2} ${cy} Q${cx} ${cy + 2.5} ${cx - w / 2} ${cy} Z`} fill="currentColor" />;
        }),
      )}
    </svg>
  );
}

/** A nagy, animált söröspohár a hős szekcióban. */
function HeroGlass({ label }: { label: string }) {
  return (
    <svg className="hero-glass" viewBox="0 0 220 320" role="img" aria-label={label}>
      <defs>
        <clipPath id="lp-glass">
          <path d="M34 26 L186 26 L166 298 Q110 310 54 298 Z" />
        </clipPath>
        <linearGradient id="lp-depth" x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.32" />
          <stop offset="0.28" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.38" />
        </linearGradient>
        <linearGradient id="lp-foam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="1" stopColor="#efe0c4" />
        </linearGradient>
      </defs>
      <g clipPath="url(#lp-glass)">
        <rect x="0" y="0" width="220" height="320" fill="rgba(255,255,255,0.04)" />
        <g className="liquid">
          <rect className="liquid-body" x="0" y="0" width="220" height="330" />
          <rect x="0" y="0" width="220" height="330" fill="url(#lp-depth)" />
          {BUBBLES.map(([x, r, d, delay], i) => (
            <circle
              key={i}
              className="bubble"
              cx={(x / 100) * 220}
              cy="228"
              r={r}
              style={{ '--d': `${d}s`, '--delay': `${delay}s` } as CSSProperties}
            />
          ))}
          <g className="foam">
            <rect x="0" y="-26" width="220" height="30" fill="url(#lp-foam)" />
            {[14, 40, 66, 92, 118, 144, 170, 196].map((cx, i) => (
              <circle key={cx} cx={cx} cy="4" r={i % 2 ? 13 : 16} fill="#f7ecd6" />
            ))}
          </g>
        </g>
      </g>
      <path className="glass-outline" d="M34 26 L186 26 L166 298 Q110 310 54 298 Z" fill="none" />
      <path d="M50 44 L60 280" className="glass-shine" />
    </svg>
  );
}

function SmallGlass({ color, i }: { color: string; i: number }) {
  return (
    <svg className="mini-glass" viewBox="0 0 60 90" aria-hidden style={{ '--c': color, '--i': i } as CSSProperties}>
      <defs>
        <clipPath id={`mg-${i}`}>
          <path d="M8 6 L52 6 L46 84 Q30 88 14 84 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#mg-${i})`}>
        <g className="mini-liquid">
          <rect x="0" y="0" width="60" height="100" fill={color} />
          <rect className="mini-shine" x="12" y="0" width="7" height="100" fill="#fff" />
          <circle className="mini-bubble" cx="20" cy="68" r="1.5" />
          <circle className="mini-bubble b2" cx="31" cy="70" r="1.1" />
          <circle className="mini-bubble b3" cx="39" cy="66" r="1.3" />
          <g className="mini-foam">
            <rect x="0" y="-6" width="60" height="9" fill="#f6ead2" />
            {[6, 18, 30, 42, 54].map((cx) => <circle key={cx} cx={cx} cy="3" r={5.5} fill="#f6ead2" />)}
          </g>
        </g>
      </g>
      <path d="M8 6 L52 6 L46 84 Q30 88 14 84 Z" fill="none" className="glass-outline" />
    </svg>
  );
}

/**
 * "Beúszás görgetéskor": IntersectionObserver + olcsó, passzív görgetés-ellenőrzés tartaléknak
 * (csak a még meg nem jelent elemeket nézi, elemenként egyszer fut le).
 */
function useReveal(dep: unknown) {
  useEffect(() => {
    let pending = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.in)'));
    const show = (el: Element) => {
      el.classList.add('in');
      pending = pending.filter((p) => p !== el);
    };
    const check = () => {
      if (!pending.length) return;
      const limit = window.innerHeight * 0.92;
      for (const el of [...pending]) if (el.getBoundingClientRect().top < limit) show(el);
    };
    const io =
      'IntersectionObserver' in window
        ? new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && (show(e.target), io?.unobserve(e.target))),
            { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
          )
        : null;
    pending.forEach((e) => io?.observe(e));
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    const t = window.setTimeout(check, 50);
    return () => {
      io?.disconnect();
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      clearTimeout(t);
    };
  }, [dep]);
}

export function Landing({ go, prefetch }: { go: (e: Entry) => void; prefetch: () => void }) {
  const [lang, setLangState] = useState<Lang>(getLang());
  const heroRef = useRef<HTMLElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const tx = LANDING_TEXT[lang];
  const pwa = useInstallPrompt();
  const brand = BRAND[lang];
  // nyelvváltáskor is újra átnézi az elemeket (az újonnan renderelt elemek is beússzanak)
  useReveal(lang);

  // receptszekció: csak a közelébe érve (vagy ha a böngésző ráér) töltjük be
  const recipesRef = useRef<HTMLElement>(null);
  const [showRecipes, setShowRecipes] = useState(false);
  useEffect(() => {
    if (showRecipes) return;
    const el = recipesRef.current;
    const t = window.setTimeout(() => setShowRecipes(true), 4000);
    if (!el || !('IntersectionObserver' in window)) return () => clearTimeout(t);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShowRecipes(true), { rootMargin: '900px 0px' });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, [showRecipes]);

  // a hős animációi álljanak meg, ha nem látszik (CPU/GPU kímélése)
  useEffect(() => {
    const el = heroRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setHeroVisible(e.isIntersecting), { threshold: 0.02 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // a főzőpult kódjának előtöltése, amikor a böngésző ráér
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(prefetch, { timeout: 3000 }) : window.setTimeout(prefetch, 1500);
    return () => {
      if (!w.requestIdleCallback) clearTimeout(id);
    };
  }, [prefetch]);

  useEffect(() => {
    document.title = `${brand.name} – ${tx.hero.title1} ${tx.hero.title2}`;
  }, [brand.name, tx]);

  const changeLang = (l: Lang) => {
    setLang(l);
    setLangState(l);
  };

  const cta = (e: Entry, label: string, cls = 'l-btn primary') => (
    <button className={cls} onClick={() => go(e)} onMouseEnter={prefetch} onFocus={prefetch}>
      {label}
    </button>
  );

  return (
    <div className="landing">
      <header className="l-nav">
        <a className="l-brand" href="#/" aria-label={brand.name}>
          <span className="l-mark">🍺</span>
          <span>{brand.name}</span>
        </a>
        <nav className="l-links" aria-label="Navigáció">
          <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>{tx.nav.features}</a>
          <a href="#recipes" onClick={(e) => { e.preventDefault(); document.getElementById('recipes')?.scrollIntoView({ behavior: 'smooth' }); }}>{tx.nav.recipes}</a>
          <a href="#how" onClick={(e) => { e.preventDefault(); document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }); }}>{tx.nav.how}</a>
          <a href="#colors" onClick={(e) => { e.preventDefault(); document.getElementById('colors')?.scrollIntoView({ behavior: 'smooth' }); }}>{tx.nav.colors}</a>
        </nav>
        <div className="l-nav-right">
          <div className="l-lang" role="group" aria-label="Nyelv / Language / Sprache">
            {LANGS.map((l) => (
              <button key={l.id} className={lang === l.id ? 'on' : ''} onClick={() => changeLang(l.id)} aria-pressed={lang === l.id}>
                {l.id.toUpperCase()}
              </button>
            ))}
          </div>
          {pwa.canInstall && (
            <button className="l-btn ghost small-ghost" onClick={() => void pwa.install()} title={tx.nav.install}>📲 <span className="l-hide-sm">{tx.nav.install}</span></button>
          )}
          {cta('app', tx.nav.open, 'l-btn small')}
        </div>
      </header>

      <section ref={heroRef} className={`l-hero ${heroVisible ? '' : 'paused'}`}>
        <div className="l-glow" aria-hidden />
        <div className="l-hops" aria-hidden>
          {HOPS.map((h, i) => (
            <span key={i} className="l-hop" style={{ left: h.x, top: h.y, '--d': `${h.d}s`, '--delay': `${h.delay}s`, '--r': `${h.r}deg` } as CSSProperties}>
              <Hop size={h.s} />
            </span>
          ))}
        </div>
        <div className="l-hero-inner">
          <div className="l-hero-copy">
            <div className="l-eyebrow anim-up" style={{ '--i': 0 } as CSSProperties}>{tx.hero.eyebrow}</div>
            <h1 className="anim-up" style={{ '--i': 1 } as CSSProperties}>
              {tx.hero.title1}
              <br />
              <span className="l-shine">{tx.hero.title2}</span>
            </h1>
            <p className="l-sub anim-up" style={{ '--i': 2 } as CSSProperties}>{tx.hero.sub.replace('Sörlabor', brand.name)}</p>
            <div className="l-ctas anim-up" style={{ '--i': 3 } as CSSProperties}>
              {cta('app', `${tx.hero.cta} →`)}
              {cta('tour', `▶ ${tx.hero.tour}`, 'l-btn ghost')}
            </div>
            <ul className="l-chips anim-up" style={{ '--i': 4 } as CSSProperties}>
              {tx.chips.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
          <div className="l-hero-art">
            <div className="l-glass-wrap">
              <HeroGlass label={tx.glassLabel} />
              <div className="l-glass-shadow" aria-hidden />
            </div>
          </div>
        </div>
        <button className="l-scroll" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
          <span>{tx.scroll}</span>
          <span className="l-scroll-dot" aria-hidden />
        </button>
      </section>

      <section className="l-stats">
        {tx.stats.map((s, i) => (
          <div key={i} className="l-stat reveal" style={{ '--i': i } as CSSProperties}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </section>

      <section id="features" className="l-section">
        <h2 className="reveal">{tx.features.title}</h2>
        <p className="l-section-sub reveal">{tx.features.sub}</p>
        <div className="l-features">
          {tx.features.items.map((f, i) => (
            <article key={i} className="l-card reveal" style={{ '--i': i } as CSSProperties}>
              <div className="l-card-icon" aria-hidden>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="recipes" ref={recipesRef} className="l-section l-recipes">
        <div className="l-eyebrow reveal">{tx.recipes.eyebrow}</div>
        <h2 className="reveal">{tx.recipes.title}</h2>
        <p className="l-section-sub reveal">{tx.recipes.sub}</p>
        <Suspense fallback={<div className="lr-grid">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="lr-card lr-skeleton" />)}</div>}>
          {showRecipes ? (
            <LandingRecipes tx={tx} go={go} lang={lang} />
          ) : (
            <div className="lr-grid">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="lr-card lr-skeleton" />)}</div>
          )}
        </Suspense>
      </section>

      <section id="how" className="l-section">
        <h2 className="reveal">{tx.how.title}</h2>
        <p className="l-section-sub reveal">{tx.how.sub}</p>
        <ol className="l-steps">
          {tx.how.steps.map((s, i) => (
            <li key={i} className="l-step reveal" style={{ '--i': i } as CSSProperties}>
              <span className="l-step-num">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="colors" className="l-section">
        <h2 className="reveal">{tx.colors.title}</h2>
        <p className="l-section-sub reveal">{tx.colors.sub}</p>
        <div className="l-colors reveal">
          {BEER_COLORS.map((c, i) => (
            <figure key={c} className="l-color">
              <SmallGlass color={c} i={i} />
              <figcaption>{tx.colors.beers[i]}<small>{BEER_EBC[i]} EBC</small></figcaption>
            </figure>
          ))}
        </div>
        <div className="l-spectrum reveal" aria-hidden>
          <span />
        </div>
      </section>

      <section className="l-final reveal">
        <h2>{tx.final.title}</h2>
        <p>{tx.final.sub}</p>
        <div className="l-ctas center">
          {cta('app', `${tx.final.cta} →`)}
          {cta('recipes', `⭐ ${tx.final.recipes}`, 'l-btn ghost')}
        </div>
      </section>

      <footer className="l-footer">
        <span>{brand.name}</span>
        <span>{tx.footer}</span>
        <a href="#/privacy">{tx.privacy}</a>
      </footer>
    </div>
  );
}
