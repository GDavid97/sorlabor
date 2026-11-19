import { useMemo, useState } from 'react';
import { PRESETS, LEVEL_ORDER, type Preset } from '../data/presets';
import { recipeFromPreset } from '../lib/presets';
import { computeStats } from '../lib/calc';
import { getStyle } from '../lib/catalog';
import { FAMILY_LABEL, FEATURED, isFlavored, presetFamily, type Family } from '../lib/presetMeta';
import { BeerGlass } from './Results';
import { fmt, fmtSG } from './ui';
import { t } from '../i18n';
import { levelName, presetDesc, presetName, styleName } from '../lib/names';

type Cat = 'all' | 'style' | 'flavored' | Family;
type Level = 'all' | Preset['level'];

/** Beépített receptek galériája – kategória- és szintszűrővel, kereséssel. */
export function PresetPicker({
  onPick,
  styleId,
  limit,
  compact,
}: {
  onPick: (p: Preset) => void;
  styleId?: string | null;
  limit?: number;
  compact?: boolean;
}) {
  const hasStyleMatch = !!styleId && PRESETS.some((p) => p.styleId === styleId);
  const [cat, setCat] = useState<Cat>(hasStyleMatch ? 'style' : 'all');
  const [level, setLevel] = useState<Level>('all');
  const [q, setQ] = useState('');

  const rows = useMemo(
    () =>
      PRESETS.map((p) => ({
        p,
        s: computeStats(recipeFromPreset(p)),
        style: getStyle(p.styleId),
        family: presetFamily(p),
        flavored: isFlavored(p),
        featured: FEATURED.indexOf(p.id),
      })),
    [],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, flavored: rows.filter((r) => r.flavored).length };
    rows.forEach((r) => (c[r.family] = (c[r.family] ?? 0) + 1));
    return c;
  }, [rows]);

  let list = rows.filter(
    (r) =>
      (cat === 'all' ? true : cat === 'style' ? r.p.styleId === styleId : cat === 'flavored' ? r.flavored : r.family === cat) &&
      (level === 'all' || r.p.level === level) &&
      (!q || `${presetName(r.p)} ${r.style ? styleName(r.style) : ''} ${presetDesc(r.p)}`.toLowerCase().includes(q.toLowerCase())),
  );
  // kiemeltek elöl, aztán szint szerint
  list = list.sort((a, b) => {
    const fa = a.featured < 0 ? 99 : a.featured;
    const fb = b.featured < 0 ? 99 : b.featured;
    return cat === 'all' && !q ? fa - fb || LEVEL_ORDER[a.p.level] - LEVEL_ORDER[b.p.level] : LEVEL_ORDER[a.p.level] - LEVEL_ORDER[b.p.level];
  });
  if (limit) list = list.slice(0, limit);

  return (
    <div className={`preset-gallery ${compact ? 'compact' : ''}`}>
      {!compact && (
        <div className="preset-filters">
          <div className="chips" style={{ margin: 0 }}>
            <button className={`chip ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>{t('Mind')} <span className="chip-n">{counts.all}</span></button>
            {hasStyleMatch && <button className={`chip ${cat === 'style' ? 'active' : ''}`} onClick={() => setCat('style')}>★ {t('Célstílushoz')}</button>}
            <button className={`chip flavored ${cat === 'flavored' ? 'active' : ''}`} onClick={() => setCat('flavored')}>🍒 {t('Ízesített')} <span className="chip-n">{counts.flavored}</span></button>
            {(Object.keys(FAMILY_LABEL) as Family[]).map((f) => (
              <button key={f} className={`chip ${cat === f ? 'active' : ''}`} onClick={() => setCat(f)}>
                {t(FAMILY_LABEL[f])} <span className="chip-n">{counts[f] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="row" style={{ gap: 8 }}>
            <div className="chips" style={{ margin: 0 }}>
              {(['all', 'kezdő', 'haladó', 'profi'] as const).map((l) => (
                <button key={l} className={`chip ${level === l ? 'active' : ''}`} onClick={() => setLevel(l)}>{l === 'all' ? t('Minden szint') : levelName(l)}</button>
              ))}
            </div>
            <span className="spacer" />
            <input className="input" style={{ maxWidth: 260 }} placeholder={t('Keresés a receptekben…')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      )}
      {list.length === 0 && <div className="empty">{t('Nincs a szűrésnek megfelelő recept.')}</div>}
      <div className={`preset-grid ${compact ? 'compact' : ''}`}>
        {list.map(({ p, s, style, flavored }) => (
          <button className="preset" key={p.id} onClick={() => onPick(p)} title={t('Betöltés szerkeszthető receptként')}>
            <div className="preset-glass" style={{ background: `radial-gradient(circle at 50% 70%, ${glow(s.srm)}, transparent 70%)` }}>
              <BeerGlass srm={s.srm} size={compact ? 34 : 48} />
            </div>
            <div className="preset-body">
              <strong className="preset-name">{presetName(p)}</strong>
              <div className="small muted">{style?.code} · {style ? styleName(style) : ''}</div>
              <div className="preset-badges">
                <span className={`badge lvl-${p.level}`}>{levelName(p.level)}</span>
                {flavored && <span className="badge flavored">🍒 {t('ízesített')}</span>}
                {p.method === 'extract' && <span className="badge info">{t('kivonatos')}</span>}
              </div>
              {!compact && <div className="small preset-desc">{presetDesc(p)}</div>}
              <div className="preset-stats">
                <span><b>{fmt(s.abv, 1)}%</b></span>
                <span>{fmt(s.ibu, 0)} IBU</span>
                <span>{fmt(s.ebc, 0)} EBC</span>
                {!compact && <span>OG {fmtSG(s.og)}</span>}
              </div>
            </div>
            <span className="preset-go" aria-hidden>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** a pohár mögötti halvány fény a sör színéből */
function glow(srm: number) {
  const a = srm < 8 ? '242,169,59' : srm < 20 ? '200,100,20' : '120,40,10';
  return `rgba(${a},0.22)`;
}
