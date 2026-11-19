import { useMemo, useState } from 'react';
import type { Recipe, HopUse, AdjunctUse, Malt, Hop, Adjunct } from '../types';
import { MALTS, MALT_CATEGORY_LABEL } from '../data/malts';
import { HOPS, HOP_TYPE_LABEL } from '../data/hops';
import { YEASTS, YEAST_KIND_LABEL } from '../data/yeasts';
import { ADJUNCTS, ADJUNCT_CATEGORY_LABEL } from '../data/adjuncts';
import { getAdjunct, getHop, getMalt, getStyle, getYeast, uid } from '../lib/catalog';
import { srmToHex, type Stats } from '../lib/calc';
import { t } from '../i18n';
import {
  adjDesc, adjName, brandName, hopDesc, hopDescriptors, hopName, hopOrigin, maltDesc, maltName, styleName, yeastDesc, yeastName,
} from '../lib/names';
import { Num, Tabs, fmt } from './ui';

type Tab = 'malt' | 'hop' | 'yeast' | 'adj';
type Update = (fn: (r: Recipe) => Recipe) => void;

const round05 = (x: number) => Math.max(0.05, Math.round(x * 20) / 20);
const has = (text: string, q: string) => text.toLowerCase().includes(q.toLowerCase());
const ebc = (n: number) => fmt(n, n % 1 ? 1 : 0);

function defaultKg(m: Malt, r: Recipe) {
  const k = r.batchL / 20;
  const hasBase = r.fermentables.some((f) => getMalt(f.id)?.category === 'base');
  switch (m.category) {
    case 'base': return round05((hasBase ? 1 : 4) * k);
    case 'caramel': return round05(0.3 * k);
    case 'roasted': return round05(0.15 * k);
    case 'special': return round05(0.3 * k);
    case 'flaked': return round05(0.5 * k);
    case 'extract': return m.packKg;
    case 'sugar': return round05(0.4 * k);
  }
}

export function IngredientPanel({ recipe, stats, update }: { recipe: Recipe; stats: Stats; update: Update }) {
  const [tab, setTab] = useState<Tab>('malt');
  return (
    <div className="card">
      <div className="card-head">
        <h2>🌾 {t('Hozzávalók')}</h2>
        <span className="muted small">{t('Kattints a + gombra a katalógusban')}</span>
      </div>
      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'malt', label: t('Maláták & cukrok'), count: recipe.fermentables.length },
          { id: 'hop', label: t('Komlók'), count: recipe.hops.length },
          { id: 'yeast', label: t('Élesztő'), count: recipe.yeastId ? 1 : 0 },
          { id: 'adj', label: t('Ízesítők & adalékok'), count: recipe.adjuncts.length },
        ]}
      />
      {tab === 'malt' && <MaltTab recipe={recipe} stats={stats} update={update} />}
      {tab === 'hop' && <HopTab recipe={recipe} stats={stats} update={update} />}
      {tab === 'yeast' && <YeastTab recipe={recipe} update={update} />}
      {tab === 'adj' && <AdjTab recipe={recipe} update={update} />}
    </div>
  );
}

// ---------------- Maláták ----------------

function MaltTab({ recipe, stats, update }: { recipe: Recipe; stats: Stats; update: Update }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Malt['category'] | 'all'>(recipe.method === 'extract' ? 'extract' : 'all');
  const list = MALTS.filter((m) => (cat === 'all' || m.category === cat) && has(m.name + maltName(m) + m.brand + maltDesc(m), q));
  const add = (m: Malt) =>
    update((r) => ({ ...r, fermentables: [...r.fermentables, { uid: uid(), id: m.id, kg: defaultKg(m, r) }] }));

  return (
    <>
      {stats.fermentables.length === 0 ? (
        <div className="empty">
          {t('Még nincs maláta.')} {recipe.method === 'extract' ? t('Kezdd malátakivonattal.') : t('Kezdd egy alapmalátával (pl. Pilsner vagy Pale Ale).')}
        </div>
      ) : (
        <div className="lines">
          {stats.fermentables.map((f) => (
            <div className="line malt" key={f.uid}>
              <div className="swatch" style={{ background: srmToHex(f.malt.ebc / 1.97) }} title={`${ebc(f.malt.ebc)} EBC`} />
              <div className="line-name">
                <strong title={maltDesc(f.malt)}>{maltName(f.malt)}</strong>
                <small>
                  {t(MALT_CATEGORY_LABEL[f.malt.category])} · {ebc(f.malt.ebc)} EBC · {f.malt.yield}%
                  {f.malt.nonFermentable ? ` · ${t('nem erjeszthető')}` : ''}
                </small>
              </div>
              <Num
                value={f.kg}
                step={0.05}
                min={0}
                suffix="kg"
                ariaLabel={t('{name} mennyiség', { name: maltName(f.malt) })}
                onChange={(kg) => update((r) => ({ ...r, fermentables: r.fermentables.map((x) => (x.uid === f.uid ? { ...x, kg } : x)) }))}
              />
              <div className="pct">
                {fmt(f.pct, 1)}%
                <div className="pctbar"><div style={{ width: `${Math.min(100, f.pct)}%` }} /></div>
              </div>
              <button className="icon-btn" aria-label={t('Törlés')} onClick={() => update((r) => ({ ...r, fermentables: r.fermentables.filter((x) => x.uid !== f.uid) }))}>✕</button>
            </div>
          ))}
          <div className="row small muted" style={{ justifyContent: 'flex-end', paddingRight: 36 }}>
            {t('Összesen:')} <b style={{ color: 'var(--text)' }}>{fmt(stats.totalKg, 2)} kg</b>
          </div>
        </div>
      )}
      <div className="catalog">
        <div className="row">
          <input className="input" placeholder={t('Keresés a malátákban…')} value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} />
        </div>
        <div className="chips">
          <button className={`chip ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>{t('Mind')}</button>
          {(Object.keys(MALT_CATEGORY_LABEL) as Malt['category'][]).map((c) => (
            <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{t(MALT_CATEGORY_LABEL[c])}</button>
          ))}
        </div>
        <div className="catalog-list">
          {list.map((m) => (
            <div className="cat-item" key={m.id}>
              <div style={{ minWidth: 0 }}>
                <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                  <span className="swatch" style={{ width: 10, height: 14, background: srmToHex(m.ebc / 1.97), flex: 'none' }} />
                  <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{maltName(m)}</strong>
                </div>
                <div className="desc" title={maltDesc(m)}>{maltDesc(m)}</div>
              </div>
              <div className="meta">{ebc(m.ebc)} EBC<br />max {m.maxPct}%</div>
              <button className="add-btn" aria-label={t('{name} hozzáadása', { name: maltName(m) })} onClick={() => add(m)}>+</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ---------------- Komlók ----------------

export const HOP_USE_LABEL: Record<HopUse, string> = {
  boil: 'Forralás',
  fwh: 'First wort',
  whirlpool: 'Whirlpool 80°C',
  dry: 'Hidegkomló',
};

function HopTab({ recipe, stats, update }: { recipe: Recipe; stats: Stats; update: Update }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState<Hop['type'] | 'all'>('all');
  const list = HOPS.filter(
    (h) => (type === 'all' || h.type === type) && has(h.name + hopOrigin(h) + h.descriptors.join(' ') + hopDescriptors(h).join(' '), q),
  );
  const k = recipe.batchL / 20;
  const add = (h: Hop) =>
    update((r) => {
      const first = r.hops.length === 0 || h.type === 'bitter';
      return {
        ...r,
        hops: [
          ...r.hops,
          first
            ? { uid: uid(), id: h.id, g: Math.max(5, Math.round((20 * k * 12) / h.alpha)), use: 'boil', time: 60 }
            : { uid: uid(), id: h.id, g: Math.round(25 * k), use: 'boil', time: 10 },
        ],
      };
    });
  const setLine = (u: string, patch: Partial<Recipe['hops'][number]>) =>
    update((r) => ({ ...r, hops: r.hops.map((x) => (x.uid === u ? { ...x, ...patch } : x)) }));

  const rows = [...recipe.hops].sort((a, b) => order(a) - order(b));
  return (
    <>
      {rows.length === 0 ? (
        <div className="empty">{t('Még nincs komló. Az első hozzáadott komló 60 perces keserítő adag lesz.')}</div>
      ) : (
        <div className="lines">
          {rows.map((line) => {
            const hop = getHop(line.id)!;
            const ibu = stats.hops.find((h) => h.line.uid === line.uid)?.ibu ?? 0;
            return (
              <div className="line hop" key={line.uid}>
                <div className="line-name">
                  <strong title={hopDesc(hop)}>{hopName(hop)}</strong>
                  <small>{fmt(hop.alpha, 1)}% α · {hopDescriptors(hop).slice(0, 3).join(', ')}</small>
                </div>
                <Num value={line.g} step={5} min={0} suffix="g" ariaLabel={t('{name} gramm', { name: hopName(hop) })} onChange={(g) => setLine(line.uid, { g })} />
                <select
                  className="select"
                  aria-label={t('Felhasználás')}
                  value={line.use}
                  onChange={(e) => {
                    const use = e.target.value as HopUse;
                    const time = use === 'dry' ? 4 : use === 'whirlpool' ? 20 : use === 'fwh' ? recipe.boilMin : 10;
                    setLine(line.uid, { use, time });
                  }}
                >
                  {(Object.keys(HOP_USE_LABEL) as HopUse[]).map((u) => <option key={u} value={u}>{t(HOP_USE_LABEL[u])}</option>)}
                </select>
                {line.use === 'fwh' ? (
                  <span className="muted small right">{t('{n} perc', { n: recipe.boilMin })}</span>
                ) : (
                  <Num
                    value={line.time}
                    step={line.use === 'dry' ? 1 : 5}
                    min={0}
                    max={line.use === 'dry' ? 21 : line.use === 'boil' ? recipe.boilMin : 60}
                    suffix={line.use === 'dry' ? t('nap') : t('perc')}
                    ariaLabel={t('Idő')}
                    onChange={(time) => setLine(line.uid, { time })}
                  />
                )}
                <div className="ibu-pill">{line.use === 'dry' ? '—' : `${fmt(ibu, 1)} IBU`}</div>
                <button className="icon-btn" aria-label={t('Törlés')} onClick={() => update((r) => ({ ...r, hops: r.hops.filter((x) => x.uid !== line.uid) }))}>✕</button>
              </div>
            );
          })}
          <div className="row small muted" style={{ justifyContent: 'flex-end', paddingRight: 36 }}>
            {t('Összesen:')} <b style={{ color: 'var(--text)' }}>{fmt(recipe.hops.reduce((s, h) => s + h.g, 0), 0)} g · {fmt(stats.ibu, 0)} IBU</b>
          </div>
        </div>
      )}
      <div className="catalog">
        <input className="input" placeholder={t('Keresés: név, eredet, aroma (pl. maracuja, fenyő)…')} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips">
          <button className={`chip ${type === 'all' ? 'active' : ''}`} onClick={() => setType('all')}>{t('Mind')}</button>
          {(Object.keys(HOP_TYPE_LABEL) as Hop['type'][]).map((ty) => (
            <button key={ty} className={`chip ${type === ty ? 'active' : ''}`} onClick={() => setType(ty)}>{t(HOP_TYPE_LABEL[ty])}</button>
          ))}
        </div>
        <div className="catalog-list">
          {list.map((h) => (
            <div className="cat-item" key={h.id}>
              <div style={{ minWidth: 0 }}>
                <strong>{hopName(h)}</strong> <span className="muted small">· {hopOrigin(h)}{h.lupomax ? ' · LupoMax' : ''}</span>
                <div className="tagline">{hopDescriptors(h).map((d) => <span className="tag" key={d}>{d}</span>)}</div>
              </div>
              <div className="meta">{fmt(h.alpha, 1)}% α<br />{t(HOP_TYPE_LABEL[h.type])}</div>
              <button className="add-btn" aria-label={t('{name} hozzáadása', { name: hopName(h) })} onClick={() => add(h)}>+</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function order(h: Recipe['hops'][number]) {
  switch (h.use) {
    case 'fwh': return -1000;
    case 'boil': return -h.time;
    case 'whirlpool': return 100;
    case 'dry': return 200 + h.time;
  }
}

// ---------------- Élesztő ----------------

function YeastTab({ recipe, update }: { recipe: Recipe; update: Update }) {
  const [kind, setKind] = useState<string>('all');
  const style = getStyle(recipe.styleId);
  const sel = getYeast(recipe.yeastId);
  const list = YEASTS.filter((y) => kind === 'all' || (kind === 'style' ? style?.yeast.includes(y.kind) : y.kind === kind));
  return (
    <>
      {sel ? (
        <div className="yeast-card">
          <div className="row">
            <div>
              <strong style={{ fontSize: 15 }}>{sel.brand} {yeastName(sel)}</strong>
              <div className="muted small">{t(YEAST_KIND_LABEL[sel.kind])}</div>
            </div>
            <span className="spacer" />
            <button className="btn sm ghost" onClick={() => update((r) => ({ ...r, yeastId: null }))}>{t('Eltávolítás')}</button>
          </div>
          <p className="small" style={{ color: 'var(--text-2)', margin: '8px 0 0' }}>{yeastDesc(sel)}</p>
          <div className="spec-grid">
            <div className="spec"><div className="label">{t('Erjedési fok')}</div><b>{sel.attenuation[0]}–{sel.attenuation[1]}%</b></div>
            <div className="spec"><div className="label">{t('Hőfok')}</div><b>{sel.temp[0]}–{sel.temp[1]} °C</b></div>
            <div className="spec"><div className="label">{t('Flokkuláció')}</div><b>{t(sel.flocculation)}</b></div>
            <div className="spec"><div className="label">{t('Alkoholtűrés')}</div><b>~{sel.alcoholTol}%</b></div>
            <div className="spec"><div className="label">{t('Észter / fenol')}</div><b>{sel.ester} / {sel.phenol}</b></div>
          </div>
          {style && !style.yeast.includes(sel.kind) && (
            <div className="alert warn" style={{ marginTop: 10 }}>⚠ {t('Nem jellemző a(z) {style} stílushoz.', { style: styleName(style) })}</div>
          )}
        </div>
      ) : (
        <div className="empty">{t('Válassz egy élesztőt – ez határozza meg az erjedési fokot, a hőfokot és az ízprofil egy részét.')}</div>
      )}
      <div className="catalog">
        <div className="chips">
          <button className={`chip ${kind === 'all' ? 'active' : ''}`} onClick={() => setKind('all')}>{t('Mind')}</button>
          {style && <button className={`chip ${kind === 'style' ? 'active' : ''}`} onClick={() => setKind('style')}>★ {t('Stílushoz illő')}</button>}
          {Object.entries(YEAST_KIND_LABEL).map(([k, l]) => (
            <button key={k} className={`chip ${kind === k ? 'active' : ''}`} onClick={() => setKind(k)}>{t(l)}</button>
          ))}
        </div>
        <div className="catalog-list">
          {list.map((y) => (
            <div className={`cat-item ${recipe.yeastId === y.id ? 'selected' : ''}`} key={y.id}>
              <div style={{ minWidth: 0 }}>
                <strong>{yeastName(y)}</strong> <span className="muted small">· {y.brand}</span>
                {style?.yeast.includes(y.kind) && <span className="tag" style={{ marginLeft: 6, color: 'var(--accent-text)' }}>★ {t('stílusos')}</span>}
                <div className="desc" title={yeastDesc(y)}>{yeastDesc(y)}</div>
              </div>
              <div className="meta">{y.attenuation[0]}–{y.attenuation[1]}%<br />{y.temp[0]}–{y.temp[1]} °C</div>
              <button
                className="add-btn"
                aria-label={t('{name} kiválasztása', { name: yeastName(y) })}
                onClick={() => update((r) => ({ ...r, yeastId: y.id }))}
              >
                {recipe.yeastId === y.id ? '✓' : '+'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ---------------- Ízesítők ----------------

export const ADJ_USE_LABEL: Record<AdjunctUse, string> = {
  boil: 'Forralás',
  flameout: 'Lángoltás',
  secondary: 'Fermentorba',
  mash: 'Cefre',
};

function AdjTab({ recipe, update }: { recipe: Recipe; update: Update }) {
  const [cat, setCat] = useState<Adjunct['category'] | 'all'>('all');
  const [q, setQ] = useState('');
  const list = useMemo(
    () => ADJUNCTS.filter((a) => (cat === 'all' || a.category === cat) && has(a.name + adjName(a) + adjDesc(a), q)),
    [cat, q],
  );
  const add = (a: Adjunct) =>
    update((r) => ({
      ...r,
      adjuncts: [
        ...r.adjuncts,
        {
          uid: uid(),
          id: a.id,
          amount: a.unit === 'db' ? Math.max(1, Math.round(a.dosePerL * r.batchL)) : Math.round(a.dosePerL * r.batchL * 10) / 10,
          use: a.defaultUse,
          time: a.defaultTime,
        },
      ],
    }));
  const setLine = (u: string, patch: Partial<Recipe['adjuncts'][number]>) =>
    update((r) => ({ ...r, adjuncts: r.adjuncts.map((x) => (x.uid === u ? { ...x, ...patch } : x)) }));

  return (
    <>
      {recipe.adjuncts.length === 0 ? (
        <div className="empty">{t('Fűszerek, kávé, tölgyfa, gyümölcs, derítők és tápsó – opcionális.')}</div>
      ) : (
        <div className="lines">
          {recipe.adjuncts.map((line) => {
            const a = getAdjunct(line.id)!;
            const typical = a.dosePerL * recipe.batchL;
            return (
              <div className="line adj" key={line.uid}>
                <div className="line-name">
                  <strong title={adjDesc(a)}>{adjName(a)}</strong>
                  <small>{t('tipikus: {n} {unit} / {l} L', { n: fmt(typical, a.unit === 'db' ? 0 : 1), unit: t(a.unit), l: fmt(recipe.batchL, recipe.batchL % 1 ? 1 : 0) })}</small>
                </div>
                <Num value={line.amount} step={a.unit === 'g' && a.dosePerL >= 10 ? 50 : 1} min={0} suffix={t(a.unit)} onChange={(amount) => setLine(line.uid, { amount })} />
                <select
                  className="select"
                  aria-label={t('Felhasználás')}
                  value={line.use}
                  onChange={(e) => {
                    const use = e.target.value as AdjunctUse;
                    setLine(line.uid, { use, time: use === 'secondary' ? 5 : use === 'boil' ? 10 : 0 });
                  }}
                >
                  {(Object.keys(ADJ_USE_LABEL) as AdjunctUse[]).map((u) => <option key={u} value={u}>{t(ADJ_USE_LABEL[u])}</option>)}
                </select>
                {line.use === 'flameout' || line.use === 'mash' ? (
                  <span />
                ) : (
                  <Num value={line.time} step={1} min={0} suffix={line.use === 'secondary' ? t('nap') : t('perc')} onChange={(time) => setLine(line.uid, { time })} />
                )}
                <button className="icon-btn" aria-label={t('Törlés')} onClick={() => update((r) => ({ ...r, adjuncts: r.adjuncts.filter((x) => x.uid !== line.uid) }))}>✕</button>
              </div>
            );
          })}
        </div>
      )}
      <div className="catalog">
        <input className="input" placeholder={t('Keresés…')} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips">
          <button className={`chip ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>{t('Mind')}</button>
          {(Object.keys(ADJUNCT_CATEGORY_LABEL) as Adjunct['category'][]).map((c) => (
            <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{t(ADJUNCT_CATEGORY_LABEL[c])}</button>
          ))}
        </div>
        <div className="catalog-list">
          {list.map((a) => (
            <div className="cat-item" key={a.id}>
              <div style={{ minWidth: 0 }}>
                <strong>{adjName(a)}</strong>
                {a.external && <span className="tag" style={{ marginLeft: 6 }}>{brandName('Bolti').toLowerCase()}</span>}
                <div className="desc" title={adjDesc(a)}>{adjDesc(a)}</div>
              </div>
              <div className="meta">{fmt(a.dosePerL, a.dosePerL < 1 ? 2 : 0)} {t(a.unit)}/L<br />{t(ADJ_USE_LABEL[a.defaultUse])}</div>
              <button className="add-btn" aria-label={t('{name} hozzáadása', { name: adjName(a) })} onClick={() => add(a)}>+</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
