import type { Recipe } from '../types';
import type { Stats } from '../lib/calc';
import { getAdjunct, getStyle, getYeast } from '../lib/catalog';
import { brewDayPlan, fermentationPlan, packagingPlan, yeastPitch, type Step } from '../lib/plan';
import { describeBeer } from '../lib/describe';
import { EQUIPMENT_DEFAULTS } from '../data/water';
import { t } from '../i18n';
import { adjName, hopName, maltName, styleName, yeastName } from '../lib/names';
import { ADJ_USE_LABEL, HOP_USE_LABEL } from './IngredientPanel';
import { fmt, fmtSG } from './ui';

function Steps({ steps }: { steps: Step[] }) {
  return (
    <table>
      <tbody>
        {steps.map((s, i) => (
          <tr key={i}>
            <td style={{ width: 18 }}>☐</td>
            <td style={{ width: 90 }}>{s.time ?? ''}</td>
            <td style={{ width: 70 }}>{s.temp ?? ''}</td>
            <td><b>{s.title}</b>{s.detail ? ` – ${s.detail}` : ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Nyomtatható főzőlap (csak nyomtatáskor látszik). */
export function PrintSheet({ recipe, stats }: { recipe: Recipe; stats: Stats }) {
  if (stats.empty) return null;
  const style = getStyle(recipe.styleId);
  const yeast = getYeast(recipe.yeastId);
  const brew = brewDayPlan(recipe, stats);
  const ferm = fermentationPlan(recipe, stats);
  const pack = packagingPlan(recipe, stats);
  const pitch = yeastPitch(recipe, stats);
  const box = <span className="box" />;
  return (
    <div className="print-only print-sheet">
      <h1>{recipe.name}</h1>
      <div>
        {style ? `${style.code} ${styleName(style)} · ` : ''}
        {t(EQUIPMENT_DEFAULTS[recipe.method].label)} · {fmt(recipe.batchL, recipe.batchL % 1 ? 1 : 0)} L · {t('{n}% hatásfok', { n: recipe.efficiency })} · {t('{n} perc forralás', { n: recipe.boilMin })}
      </div>
      <p>
        <b>OG</b> {fmtSG(stats.og)} · <b>FG</b> {fmtSG(stats.fg)} · <b>{t('Alkohol')}</b> {fmt(stats.abv, 1)}% · <b>IBU</b> {fmt(stats.ibu, 0)} ·{' '}
        <b>{t('Szín')}</b> {fmt(stats.ebc, 0)} EBC · <b>BU:GU</b> {fmt(stats.buGu, 2)}
      </p>
      <p>{describeBeer(recipe, stats).join(' ')}</p>
      <div className="cols">
        <div>
          <h2>{t('Erjeszthetők')}</h2>
          <table><tbody>
            {stats.fermentables.map((f) => <tr key={f.uid}><td>{maltName(f.malt)}</td><td>{fmt(f.kg, 2)} kg</td><td>{fmt(f.pct, 1)}%</td></tr>)}
          </tbody></table>
          <h2>{t('Komlók')}</h2>
          <table><tbody>
            {stats.hops.map((h) => (
              <tr key={h.line.uid}>
                <td>{hopName(h.hop)} ({fmt(h.hop.alpha, 1)}%)</td>
                <td>{fmt(h.line.g, h.line.g % 1 ? 1 : 0)} g</td>
                <td>{t(HOP_USE_LABEL[h.line.use])} {h.line.use === 'fwh' ? '' : `${h.line.time} ${h.line.use === 'dry' ? t('nap') : t('perc')}`}</td>
                <td>{h.line.use === 'dry' ? '' : `${fmt(h.ibu, 1)} IBU`}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
        <div>
          <h2>{t('Élesztő')}</h2>
          <div>{yeast ? `${yeast.brand} ${yeastName(yeast)} – ${t('{n} csomag', { n: pitch?.packs ?? 1 })}` : '—'}</div>
          {recipe.adjuncts.length > 0 && (
            <>
              <h2>{t('Adalékok')}</h2>
              <table><tbody>
                {recipe.adjuncts.map((a) => {
                  const adj = getAdjunct(a.id)!;
                  return <tr key={a.uid}><td>{adjName(adj)}</td><td>{fmt(a.amount, a.amount % 1 ? 1 : 0)} {t(adj.unit)}</td><td>{t(ADJ_USE_LABEL[a.use])} {a.time || ''}</td></tr>;
                })}
              </tbody></table>
            </>
          )}
          <h2>{t('Mérések')}</h2>
          <div>{t('Forralás előtti SG:')} {box} ({t('cél')} {fmtSG(1 + ((stats.og - 1) * stats.volumes.postBoilL) / stats.volumes.preBoilL)})</div>
          <div>OG: {box} ({t('cél')} {fmtSG(stats.og)}) · {t('Térfogat:')} {box} L</div>
          <div>FG: {box} ({t('cél')} {fmtSG(stats.fg)}) · {t('Dátum:')} {box}</div>
        </div>
      </div>
      <h2>{t('Vízmennyiségek')}</h2>
      <div>
        {t('Összes víz {a} L · cefre {b} L · átmosás {c} L · forralás előtt {d} L', {
          a: fmt(stats.volumes.totalWaterL, 1), b: fmt(stats.volumes.mashWaterL, 1), c: fmt(stats.volumes.spargeWaterL, 1), d: fmt(stats.volumes.preBoilL, 1),
        })}
      </div>
      <h2>{t('Cefrézés')}</h2>
      <Steps steps={brew.mash} />
      <h2>{t('Forralás')}</h2>
      <Steps steps={brew.boil} />
      <h2>{t('Erjesztés')}</h2>
      <Steps steps={ferm.steps} />
      <h2>{t('Palackozás')}</h2>
      <div>
        {t('{vol} vol CO₂ → {dex} g szőlőcukor vagy {suc} g kristálycukor {l} L-re · keg: {bar} bar 4 °C-on', {
          vol: fmt(pack.vols, 1), dex: fmt(pack.dextrose, 0), suc: fmt(pack.sucrose, 0), l: fmt(pack.L, 1), bar: fmt(pack.keg, 1),
        })}
      </div>
      {recipe.notes && (<><h2>{t('Jegyzetek')}</h2><p style={{ whiteSpace: 'pre-wrap' }}>{recipe.notes}</p></>)}
    </div>
  );
}
