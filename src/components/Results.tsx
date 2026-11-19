import { useState } from 'react';
import type { Recipe } from '../types';
import { FLAVOR_AXES, colorName, srmToHex, type Stats } from '../lib/calc';
import { getStyle } from '../lib/catalog';
import { describeBeer } from '../lib/describe';
import { matchStyle, paramLabel, rankStyles, styleHints, type ParamCheck } from '../lib/style';
import { srmToEbc } from '../data/styles';
import { t } from '../i18n';
import { styleDesc, styleName } from '../lib/names';
import { fmt, fmtSG } from './ui';

type Update = (fn: (r: Recipe) => Recipe) => void;

// ---------------- Pohár ----------------

export function BeerGlass({ srm, size = 110 }: { srm: number; size?: number }) {
  const color = srm > 0 ? srmToHex(srm) : 'transparent';
  const id = `g${Math.round(srm * 10)}`;
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 100 140" role="img" aria-label={t('Sörszín: {ebc} EBC', { ebc: fmt(srm * 1.97, 0) })}>
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.25" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <path d="M14 18 L86 18 L78 132 Q50 136 22 132 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect x="0" y="34" width="100" height="110" fill={color} />
        <rect x="0" y="34" width="100" height="110" fill={`url(#${id})`} />
        {srm > 0 && (
          <>
            <rect x="0" y="16" width="100" height="20" fill="#f6ecd8" />
            <circle cx="30" cy="70" r="1.4" fill="#fff" opacity="0.5" />
            <circle cx="62" cy="95" r="1.1" fill="#fff" opacity="0.45" />
            <circle cx="45" cy="112" r="1.2" fill="#fff" opacity="0.4" />
          </>
        )}
      </g>
      <path d="M14 18 L86 18 L78 132 Q50 136 22 132 Z" fill="none" stroke="var(--glass-stroke)" strokeWidth="2" />
    </svg>
  );
}

// ---------------- KPI-k ----------------

function RangeBar({ value, range, domain }: { value: number; range?: [number, number]; domain: [number, number] }) {
  const [lo, hi] = domain;
  const pos = (v: number) => `${Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100))}%`;
  return (
    <div className="range" aria-hidden>
      {range && <div className="band" style={{ left: pos(range[0]), width: `calc(${pos(range[1])} - ${pos(range[0])})` }} />}
      <div className="mark" style={{ left: pos(value) }} />
    </div>
  );
}

const statusText = (c?: ParamCheck) => (!c ? null : c.status === 'ok' ? `✓ ${t('ok')}` : c.status === 'low' ? `↓ ${t('alacsony')}` : `↑ ${t('magas')}`);

export function Summary({ recipe, stats }: { recipe: Recipe; stats: Stats }) {
  const style = getStyle(recipe.styleId);
  const m = style && !stats.empty ? matchStyle(style, stats, recipe) : null;
  const p = (k: ParamCheck['key']) => m?.params.find((x) => x.key === k);
  const dom = (r: [number, number] | undefined, pad: number, min = 0): [number, number] =>
    r ? [Math.max(min, r[0] - pad), r[1] + pad] : [min, min + pad * 4];

  const kpis = [
    { key: 'og' as const, label: 'OG', value: fmtSG(stats.og), sub: `${fmt(stats.plato, 1)} °P`, v: stats.og, range: style?.og, domain: style ? dom(style.og, 0.012, 1) : ([1.03, 1.1] as [number, number]) },
    { key: 'fg' as const, label: 'FG', value: fmtSG(stats.fg), sub: t('{n}% erjedési fok', { n: fmt(stats.attenuation, 0) }), v: stats.fg, range: style?.fg, domain: style ? dom(style.fg, 0.006, 0.995) : ([1.0, 1.03] as [number, number]) },
    { key: 'abv' as const, label: t('Alkohol'), value: `${fmt(stats.abv, 1)}%`, sub: t('{n} kcal / 0,5 l', { n: fmt(stats.kcalPer500, 0) }), v: stats.abv, range: style?.abv, domain: style ? dom(style.abv, 1.5) : ([0, 12] as [number, number]) },
    { key: 'ibu' as const, label: t('Keserűség'), value: `${fmt(stats.ibu, 0)} IBU`, sub: 'Tinseth', v: stats.ibu, range: style?.ibu, domain: style ? dom(style.ibu, 15) : ([0, 100] as [number, number]) },
    { key: 'srm' as const, label: t('Szín'), value: `${fmt(stats.ebc, 0)} EBC`, sub: colorName(stats.ebc), v: stats.srm, range: style?.srm, domain: style ? dom(style.srm, 6) : ([0, 40] as [number, number]) },
  ];

  return (
    <div className="card">
      <div className="summary">
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <BeerGlass srm={stats.srm} />
        </div>
        <div className="kpis">
          {kpis.map((k) => {
            const c = p(k.key);
            return (
              <div className="kpi" key={k.key}>
                <div className="label">
                  <span>{k.label}</span>
                  {c && <span className={`status ${c.status}`}>{statusText(c)}</span>}
                </div>
                <div className="value">{stats.empty ? '–' : k.value}</div>
                <div className="sub">{stats.empty ? ' ' : k.sub}</div>
                {!stats.empty && <RangeBar value={k.v} range={k.range} domain={k.domain} />}
              </div>
            );
          })}
          <div className="kpi">
            <div className="label"><span>BU:GU</span></div>
            <div className="value">{stats.empty ? '–' : fmt(stats.buGu, 2)}</div>
            <div className="sub">{stats.empty ? ' ' : stats.buGu < 0.45 ? t('malátás') : stats.buGu < 0.7 ? t('kiegyensúlyozott') : t('keserű')}</div>
            {!stats.empty && <RangeBar value={stats.buGu} domain={[0, 1.4]} range={[0.45, 0.7]} />}
          </div>
        </div>
      </div>
      {style && !stats.empty && (
        <div className="small muted" style={{ marginTop: 10 }}>
          {t('A zöld sávok a(z) {style} BJCP tartományát mutatják (szín: {a}–{b} EBC).', {
            style: styleName(style), a: fmt(srmToEbc(style.srm[0]), 0), b: fmt(srmToEbc(style.srm[1]), 0),
          })}
        </div>
      )}
    </div>
  );
}

// ---------------- Leírás ----------------

export function Description({ recipe, stats }: { recipe: Recipe; stats: Stats }) {
  const lines = describeBeer(recipe, stats);
  return (
    <div className="card">
      <h2>🍺 {t('Milyen sör lett?')}</h2>
      <ul className="desc-list">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
      {stats.warnings.length > 0 && (
        <div className="alerts" style={{ marginTop: 12 }}>
          {stats.warnings.map((w, i) => <div className="alert warn" key={i}>⚠ {w}</div>)}
        </div>
      )}
    </div>
  );
}

// ---------------- Ízprofil radar ----------------

export function FlavorRadar({ stats }: { stats: Stats }) {
  const [hover, setHover] = useState<number | null>(null);
  const size = 300;
  const c = size / 2;
  const R = 108;
  const n = FLAVOR_AXES.length;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + Math.cos(a) * (R * v) / 10, c + Math.sin(a) * (R * v) / 10] as const;
  };
  const values = FLAVOR_AXES.map((a) => stats.flavor[a.key]);
  const poly = values.map((v, i) => pt(i, Math.max(0.15, v)).join(',')).join(' ');
  const h = hover !== null ? { axis: FLAVOR_AXES[hover], v: values[hover], p: pt(hover, values[hover]) } : null;

  return (
    <div className="card">
      <h2>🎯 {t('Ízprofil')}</h2>
      <div className="radar-wrap">
        <div style={{ position: 'relative' }}>
          <svg viewBox={`-62 -8 ${size + 124} ${size + 16}`} width="100%" style={{ maxWidth: 400, display: 'block', margin: '0 auto' }} role="img" aria-label={t('Ízprofil radar diagram')}>
            {[2.5, 5, 7.5, 10].map((ring) => (
              <polygon
                key={ring}
                points={FLAVOR_AXES.map((_, i) => pt(i, ring).join(',')).join(' ')}
                fill="none"
                stroke="var(--border)"
                strokeWidth={ring === 10 ? 1.2 : 0.8}
              />
            ))}
            {FLAVOR_AXES.map((a, i) => {
              const [x, y] = pt(i, 10);
              const [lx, ly] = pt(i, 12.4);
              return (
                <g key={a.key}>
                  <line x1={c} y1={c} x2={x} y2={y} stroke="var(--border)" strokeWidth="0.8" />
                  <text
                    x={lx}
                    y={ly}
                    fontSize="10.5"
                    textAnchor={Math.abs(lx - c) < 8 ? 'middle' : lx > c ? 'start' : 'end'}
                    dominantBaseline="middle"
                    fill={hover === i ? 'var(--text)' : 'var(--text-2)'}
                    fontWeight={hover === i ? 600 : 400}
                  >
                    {t(a.label)}
                  </text>
                </g>
              );
            })}
            {!stats.empty && (
              <>
                <polygon points={poly} fill="rgba(242,169,59,0.22)" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
                {values.map((v, i) => {
                  const [x, y] = pt(i, Math.max(0.15, v));
                  return (
                    <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
                      <circle cx={x} cy={y} r="12" fill="transparent" />
                      <circle cx={x} cy={y} r={hover === i ? 5.5 : 4} fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
                    </g>
                  );
                })}
              </>
            )}
          </svg>
          {h && (
            <div className="tooltip" style={{ left: `${((h.p[0] + 62) / (size + 124)) * 100}%`, top: `${((h.p[1] + 8) / (size + 16)) * 100}%`, transform: 'translate(-50%, calc(-100% - 12px))' }}>
              <div><b>{t(h.axis.label)}</b>: <b>{fmt(h.v, 1)}</b> / 10</div>
              <div style={{ opacity: 0.75 }}>{t(h.axis.hint)}</div>
            </div>
          )}
        </div>
        <div className="radar-values">
          {FLAVOR_AXES.map((a, i) => (
            <div key={a.key} className={hover === i ? 'hl' : ''} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} title={t(a.hint)}>
              <span>{t(a.label)}</span>
              <b>{stats.empty ? '–' : fmt(values[i], 1)}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="small muted" style={{ marginTop: 8 }}>{t('Becsült, relatív intenzitás (0–10) a hozzávalók, az élesztő és a számolt értékek alapján.')}</div>
    </div>
  );
}

// ---------------- Stílus egyezés ----------------

function ScoreRing({ score }: { score: number }) {
  const r = 26;
  const C = 2 * Math.PI * r;
  const color = score >= 80 ? 'var(--good)' : score >= 55 ? 'var(--warn)' : 'var(--bad)';
  return (
    <svg className="score-ring" viewBox="0 0 64 64" role="img" aria-label={t('Egyezés {n}%', { n: score })}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${(C * score) / 100} ${C}`} transform="rotate(-90 32 32)" />
      <text x="32" y="33" textAnchor="middle" dominantBaseline="middle" fontSize="15" fontWeight="700" fill="var(--text)">{score}%</text>
    </svg>
  );
}

const fmtParam = (k: ParamCheck['key'], v: number) =>
  k === 'og' || k === 'fg' ? fmtSG(v) : k === 'abv' ? `${fmt(v, 1)}%` : k === 'srm' ? `${fmt(v * 1.97, 0)} EBC` : fmt(v, 0);
const fmtRange = (k: ParamCheck['key'], r: [number, number]) =>
  k === 'srm' ? `${fmt(r[0] * 1.97, 0)}–${fmt(r[1] * 1.97, 0)}` : k === 'og' || k === 'fg' ? `${fmtSG(r[0])}–${fmtSG(r[1])}` : k === 'abv' ? `${fmt(r[0], 1)}–${fmt(r[1], 1)}` : `${r[0]}–${r[1]}`;

export function StyleMatchCard({ recipe, stats, update }: { recipe: Recipe; stats: Stats; update: Update }) {
  const style = getStyle(recipe.styleId);
  const top = rankStyles(stats, recipe, 6);
  const m = style && !stats.empty ? matchStyle(style, stats, recipe) : null;
  const hints = m ? styleHints(m, stats, recipe) : [];

  return (
    <div className="card">
      <h2>🏅 {t('Stílus (BJCP 2021)')}</h2>
      {style && (
        <>
          <div className="match-head">
            {m && <ScoreRing score={m.score} />}
            <div>
              <div className="label">{t('Célstílus')} · {style.code}</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 19 }}>{styleName(style)}</div>
              <div className="muted small">{styleDesc(style)}</div>
            </div>
          </div>
          {m ? (
            <>
              <div className="checks">
                {m.params.map((p) => (
                  <div className="check" key={p.key} title={`${t('Stílus')}: ${fmtRange(p.key, p.range)}`}>
                    <span className={`ico ${p.status}`}>{p.status === 'ok' ? '✓' : p.status === 'low' ? '↓' : '↑'}</span>
                    <div>
                      <div>{paramLabel(p.key)}</div>
                      <div className="muted">{fmtParam(p.key, p.value)} · {t('cél')} {fmtRange(p.key, p.range)}</div>
                    </div>
                  </div>
                ))}
              </div>
              {hints.length > 0 ? (
                <>
                  <h3 style={{ marginTop: 4 }}>{t('Javaslatok')}</h3>
                  <ul className="hints">{hints.map((h, i) => <li key={i}>{h}</li>)}</ul>
                </>
              ) : (
                <div className="alert info">🎉 {t('Minden paraméter stílusban van!')}</div>
              )}
            </>
          ) : (
            <div className="style-info" style={{ marginTop: 12 }}>
              {t('Kezdd el összerakni a receptet – itt látod majd, mi lóg ki a stílusból.')}
              <div className="ranges">
                <span>OG <b>{fmtRange('og', style.og)}</b></span>
                <span>FG <b>{fmtRange('fg', style.fg)}</b></span>
                <span>IBU <b>{fmtRange('ibu', style.ibu)}</b></span>
                <span>{t('Szín')} <b>{fmtRange('srm', style.srm)} EBC</b></span>
                <span>{t('Alkohol')} <b>{fmtRange('abv', style.abv)}%</b></span>
              </div>
            </div>
          )}
        </>
      )}
      {!style && stats.empty && <div className="empty">{t('Válassz célstílust fent, vagy kezdj szabadon kísérletezni.')}</div>}
      {top.length > 0 && (
        <>
          <h3>{style ? t('Amire még hasonlít') : t('Amire a recepted hasonlít')}</h3>
          <div className="top-matches">
            {top
              .filter((x) => x.style.id !== style?.id)
              .slice(0, 5)
              .map((x) => (
                <button className="tm" key={x.style.id} onClick={() => update((r) => ({ ...r, styleId: x.style.id }))} title={t('Beállítás célstílusnak')}>
                  <span>
                    <span className="muted small">{x.style.code}</span> {styleName(x.style)}
                  </span>
                  <span className="bar"><div style={{ width: `${x.score}%` }} /></span>
                  <span className="pctv">{x.score}%</span>
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
