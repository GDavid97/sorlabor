import { useState, type ReactNode } from 'react';
import type { BrewSession, Recipe, Salts, WaterProfile } from '../types';
import { BrewLog } from './BrewLog';
import type { Stats } from '../lib/calc';
import { brewDayPlan, fermentationPlan, packagingPlan, yeastPitch, type Step } from '../lib/plan';
import { SALT_INFO, ratioLabel, saltName, suggestSalts, targetProfile, waterResult } from '../lib/water';
import { SOURCE_WATERS, TARGET_WATERS } from '../data/water';
import { loadPriceOverrides, savePriceOverrides, shoppingList, type PriceOverrides } from '../lib/shopping';
import { loadCosts, overheads, saveCosts, shippingCost, type CostSettings } from '../lib/costs';
import { getStyle } from '../lib/catalog';
import { t } from '../i18n';
import { Field, Num, OptNum, Tabs, fmt, fmtHuf, fmtSG } from './ui';

type Update = (fn: (r: Recipe) => Recipe) => void;
export type PlanTab = 'brew' | 'ferment' | 'water' | 'shop' | 'log' | 'notes';

export interface LogProps {
  sessions: BrewSession[];
  setSessions: (s: BrewSession[]) => void;
  onResume: (id: string) => void;
}

export function PlanPanel({ recipe, stats, update, log, tab, setTab }: { recipe: Recipe; stats: Stats; update: Update; log: LogProps; tab: PlanTab; setTab: (t: PlanTab) => void }) {
  return (
    <div className="card bottom">
      <Tabs<PlanTab>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'brew', label: `🔥 ${t('Főzőnap')}` },
          { id: 'ferment', label: `⏳ ${t('Erjesztés & palackozás')}` },
          { id: 'water', label: `💧 ${t('Vízkémia')}` },
          { id: 'shop', label: `🛒 ${t('Bevásárlólista')}` },
          { id: 'log', label: `📒 ${t('Napló & kalibráció')}`, count: log.sessions.length },
          { id: 'notes', label: `📝 ${t('Jegyzet')}` },
        ]}
      />
      {tab === 'brew' && <BrewDay recipe={recipe} stats={stats} update={update} />}
      {tab === 'ferment' && <Ferment recipe={recipe} stats={stats} update={update} />}
      {tab === 'water' && <Water recipe={recipe} stats={stats} update={update} />}
      {tab === 'shop' && <Shopping recipe={recipe} stats={stats} />}
      {tab === 'log' && <BrewLog recipe={recipe} update={update} {...log} />}
      {tab === 'notes' && (
        <textarea
          className="input"
          rows={8}
          placeholder={t('Főzési jegyzetek, mért értékek, kóstolási jegyzet…')}
          value={recipe.notes}
          onChange={(e) => update((r) => ({ ...r, notes: e.target.value }))}
        />
      )}
    </div>
  );
}

export function Timeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="timeline">
      {steps.map((s, i) => (
        <li className="tl" key={i}>
          <span className={`dot ${s.tag ?? 'info'}`} />
          <div className="tl-head">
            <strong>{s.title}</strong>
            {s.time && <span className="pill">{s.time}</span>}
            {s.temp && <span className="pill temp">{s.temp}</span>}
          </div>
          {s.detail && <p>{s.detail}</p>}
        </li>
      ))}
    </ol>
  );
}

function Vol({ label, v, sub }: { label: string; v: string; sub?: string }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value" style={{ fontSize: 19 }}>{v}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

// ---------------- Főzőnap ----------------

function BrewDay({ recipe, stats, update }: { recipe: Recipe; stats: Stats; update: Update }) {
  if (stats.empty) return <div className="empty">{t('Adj hozzá erjeszthető alapanyagot a főzési terv elkészítéséhez.')}</div>;
  const plan = brewDayPlan(recipe, stats);
  const v = stats.volumes;
  const eq = recipe.equipment;
  const setEq = (k: keyof typeof eq) => (val: number) => update((r) => ({ ...r, equipment: { ...r.equipment, [k]: val } }));
  return (
    <>
      <div className="vol-grid">
        <Vol label={t('Összes víz')} v={`${fmt(v.totalWaterL, 1)} L`} />
        {recipe.method !== 'biab' && <Vol label={recipe.method === 'extract' ? t('Áztató víz') : t('Cefrevíz')} v={`${fmt(v.mashWaterL, 1)} L`} />}
        {recipe.method === 'classic' && <Vol label={t('Átmosó víz')} v={`${fmt(v.spargeWaterL, 1)} L`} />}
        <Vol label={t('Forralás előtt')} v={`${fmt(v.preBoilL, 1)} L`} />
        <Vol label={t('Forralás után')} v={`${fmt(v.postBoilL, 1)} L`} />
        <Vol label={t('Fermentorba')} v={`${fmt(v.batchL, 1)} L`} />
        <Vol label={t('Palackozható')} v={`${fmt(v.packagedL, 1)} L`} sub={t('≈ {n} × 0,5 l', { n: Math.floor(v.packagedL / 0.5) })} />
      </div>
      <details>
        <summary>⚙ {t('Berendezés beállítások (veszteségek, elpárolgás)')}</summary>
        <div className="equip">
          <Field label={t('Elpárolgás')}><Num value={eq.boilOffLph} step={0.5} min={0} suffix={t('L/óra')} onChange={setEq('boilOffLph')} /></Field>
          <Field label={t('Üst veszteség')}><Num value={eq.kettleLossL} step={0.5} min={0} suffix="L" onChange={setEq('kettleLossL')} /></Field>
          <Field label={t('Fermentor veszteség')}><Num value={eq.fermenterLossL} step={0.5} min={0} suffix="L" onChange={setEq('fermenterLossL')} /></Field>
          <Field label={t('Gabona elnyelés')}><Num value={eq.absorptionLpkg} step={0.1} min={0} suffix="L/kg" onChange={setEq('absorptionLpkg')} /></Field>
          {recipe.method !== 'biab' && <Field label={t('Cefre arány')}><Num value={eq.mashRatio} step={0.1} min={2} suffix="L/kg" onChange={setEq('mashRatio')} /></Field>}
        </div>
      </details>
      {plan.notes.length > 0 && (
        <div className="alerts" style={{ marginBottom: 14 }}>
          {plan.notes.map((n, i) => <div className="alert info" key={i}>💡 {n}</div>)}
        </div>
      )}
      <div className="plan-cols">
        <div>
          <h3 style={{ marginTop: 0 }}>{recipe.method === 'extract' ? t('Áztatás / előkészítés') : t('Cefrézés')}</h3>
          <Timeline steps={plan.mash} />
        </div>
        <div>
          <h3 style={{ marginTop: 0 }}>{t('Forralás & hűtés')}</h3>
          <Timeline steps={plan.boil} />
        </div>
      </div>
    </>
  );
}

// ---------------- Erjesztés ----------------

function Ferment({ recipe, stats, update }: { recipe: Recipe; stats: Stats; update: Update }) {
  const plan = fermentationPlan(recipe, stats);
  const pitch = yeastPitch(recipe, stats);
  const pack = packagingPlan(recipe, stats);
  const style = getStyle(recipe.styleId);
  return (
    <div className="plan-cols">
      <div>
        <div className="row" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>{t('Erjesztési terv')}</h3>
          <span className="spacer" />
          {plan.totalDays > 0 && <span className="pill">{t('≈ {n} nap palackozásig', { n: plan.totalDays })}</span>}
        </div>
        {pitch && (
          <div className="grid-3" style={{ marginBottom: 14 }}>
            <Vol label={t('Élesztő')} v={t('{n} csomag', { n: pitch.packs })} sub={`${pitch.packs} × ${fmt(pitch.yeast.packG, pitch.yeast.packG % 1 ? 1 : 0)} g`} />
            <Vol label={t('Adagolás')} v={`${fmt(pitch.gPerHl, 0)} g/hl`} sub={t('~{n} g kell', { n: fmt(pitch.needG, 0) })} />
            <Vol label={t('Cél FG')} v={fmtSG(stats.fg)} sub={t('{n}% erjedési fok', { n: fmt(stats.attenuation, 0) })} />
          </div>
        )}
        <Timeline steps={plan.steps} />
      </div>
      <div>
        <h3 style={{ marginTop: 0 }}>{t('Palackozás / szénsavasítás')}</h3>
        <Field label={`${t('Cél szénsav (CO₂ térfogat)')}${style ? ` · ${t('stílus')}: ${fmt(style.carb[0], 1)}–${fmt(style.carb[1], 1)}` : ''}`}>
          <div className="row">
            <input
              type="range"
              min={1.5}
              max={4.2}
              step={0.1}
              value={pack.vols}
              onChange={(e) => update((r) => ({ ...r, carbVols: parseFloat(e.target.value) }))}
              style={{ flex: 1, accentColor: 'var(--accent)' }}
              aria-label={t('Cél CO2 térfogat')}
            />
            <b className="big" style={{ fontSize: 20, minWidth: 48, textAlign: 'right' }}>{fmt(pack.vols, 1)}</b>
            {recipe.carbVols !== null && <button className="btn sm ghost" onClick={() => update((r) => ({ ...r, carbVols: null }))}>auto</button>}
          </div>
        </Field>
        <div className="grid-3" style={{ margin: '12px 0' }}>
          <Vol label={t('Szőlőcukor')} v={`${fmt(pack.dextrose, 0)} g`} sub={t('{l} L sörre', { l: fmt(pack.L, 1) })} />
          <Vol label={t('Kristálycukor')} v={`${fmt(pack.sucrose, 0)} g`} sub={t('{g} g / 0,5 l palack', { g: fmt(pack.sucrose / Math.max(1, pack.L) / 2, 1) })} />
          <Vol label={t('Keg nyomás')} v={`${fmt(pack.keg, 1)} bar`} sub={t('4 °C-on, kényszer-szénsav')} />
        </div>
        <Timeline
          steps={[
            { tag: 'pack', title: t('Cukoroldat'), detail: t('Főzd fel a cukrot ~200 ml vízzel, hűtsd le, és a palackozó edénybe öntve fejtsd rá a sört (ne keverd fel az üledéket). Maradék CO₂ {co2} vol ({t} °C-os erjedés alapján).', { co2: fmt(pack.resid, 2), t: pack.maxTemp }) },
            { tag: 'pack', title: t('Palackozás'), detail: t('≈ {n} db 0,5 l-es palack. 2–3 cm légrést hagyj, kupakolj.', { n: pack.bottles }) },
            { tag: 'ferment', title: t('Palackos utóerjesztés'), time: t('2 hét'), temp: '18–22 °C', detail: t('Szobahőn alakul ki a szénsav. Utána tedd hidegre.') },
            { tag: 'cool', title: t('Érlelés & fogyasztás'), detail: pack.aging },
          ]}
        />
      </div>
    </div>
  );
}

// ---------------- Vízkémia ----------------

const IONS: { k: keyof WaterProfile; label: string; max: number }[] = [
  { k: 'ca', label: 'Kalcium (Ca)', max: 200 },
  { k: 'mg', label: 'Magnézium (Mg)', max: 40 },
  { k: 'na', label: 'Nátrium (Na)', max: 150 },
  { k: 'so4', label: 'Szulfát (SO₄)', max: 400 },
  { k: 'cl', label: 'Klorid (Cl)', max: 250 },
  { k: 'hco3', label: 'Hidrogén-karbonát (HCO₃)', max: 400 },
];

function Water({ recipe, stats, update }: { recipe: Recipe; stats: Stats; update: Update }) {
  if (stats.empty) return <div className="empty">{t('Adj hozzá malátát a vízkémiai számításhoz.')}</div>;
  const w = waterResult(recipe, stats);
  const tg = targetProfile(recipe);
  const setSalt = (k: keyof Salts) => (v: number) => update((r) => ({ ...r, water: { ...r.water, salts: { ...r.water.salts, [k]: v } } }));
  const setCustom = (k: keyof WaterProfile) => (v: number) => update((r) => ({ ...r, water: { ...r.water, custom: { ...r.water.custom, [k]: v } } }));
  const phPos = ((w.mashPh - 5.0) / (5.9 - 5.0)) * 100;
  const phOk = w.mashPh >= 5.2 && w.mashPh <= 5.6;
  const srcNote = SOURCE_WATERS.find((s) => s.id === recipe.water.sourceId)?.note;
  return (
    <>
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <Field label={t('Kiinduló víz')}>
          <select className="select" value={recipe.water.sourceId} onChange={(e) => update((r) => ({ ...r, water: { ...r.water, sourceId: e.target.value } }))}>
            {SOURCE_WATERS.map((s) => <option key={s.id} value={s.id}>{t(s.name)}</option>)}
          </select>
        </Field>
        <Field label={t('Célprofil')}>
          <select className="select" value={recipe.water.targetId} onChange={(e) => update((r) => ({ ...r, water: { ...r.water, targetId: e.target.value } }))}>
            {TARGET_WATERS.map((s) => <option key={s.id} value={s.id}>{t(s.name)}</option>)}
          </select>
        </Field>
      </div>
      {recipe.water.sourceId === 'custom' && (
        <div className="equip">
          {IONS.map((i) => <Field key={i.k} label={t(i.label)}><Num value={recipe.water.custom[i.k]} min={0} suffix="ppm" onChange={setCustom(i.k)} /></Field>)}
        </div>
      )}
      <div className="plan-cols">
        <div>
          <div className="row" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>{t('Vízkezelő sók')}</h3>
            <span className="spacer" />
            <button className="btn sm primary" onClick={() => update((r) => ({ ...r, water: { ...r.water, salts: suggestSalts(r, stats) } }))}>✨ {t('Javaslat a célprofilhoz')}</button>
          </div>
          <div className="equip">
            {(Object.keys(SALT_INFO) as (keyof typeof SALT_INFO)[]).map((k) => (
              <Field key={k} label={saltName(k)}><Num value={recipe.water.salts[k]} step={0.5} min={0} suffix="g" onChange={setSalt(k)} /></Field>
            ))}
            <Field label={t('Tejsav 80%')}><Num value={recipe.water.salts.lactic} step={0.5} min={0} suffix="ml" onChange={setSalt('lactic')} /></Field>
          </div>
          <div className="small muted">
            {t('A sók a teljes {l} L főzővízre számolva.', { l: fmt(w.L, 1) })} {srcNote ? `${t('Kiinduló víz:')} ${t(srcNote)}` : ''}
          </div>

          <h3>{t('Becsült cefre pH')}</h3>
          <div className="row">
            <span className="big">{fmt(w.mashPh, 2)}</span>
            <span className={`status ${phOk ? 'ok' : 'high'}`}>
              {phOk ? `✓ ${t('ideális (5,2–5,6)')}` : w.mashPh > 5.6 ? `↑ ${t('túl magas')}` : `↓ ${t('túl alacsony')}`}
            </span>
          </div>
          <div className="gauge"><div className="mark" style={{ left: `${Math.max(0, Math.min(100, phPos))}%` }} /></div>
          <div className="gauge-scale"><span>{fmt(5.0, 1)}</span><span>{fmt(5.2, 1)}</span><span>{fmt(5.4, 1)}</span><span>{fmt(5.6, 1)}</span><span>{fmt(5.9, 1)}</span></div>
          {w.lacticSuggest > recipe.water.salts.lactic + 0.2 && (
            <div className="alert info" style={{ marginTop: 10 }}>
              💡 {t('5,4-es pH-hoz kb. {ml} ml 80%-os tejsav kell összesen', { ml: fmt(w.lacticSuggest, 1) })}
              <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => setSalt('lactic')(Math.round(w.lacticSuggest * 2) / 2)}>{t('Beállít')}</button>
            </div>
          )}
          {w.lacticSuggest / w.L > 0.25 && (
            <div className="alert warn" style={{ marginTop: 8 }}>
              ⚠ {t('Ennyi tejsav már érezhetően savanykás lehet. Magas lúgosságú víznél jobb a csapvizet desztillált/RO vízzel hígítani (pl. 50:50), és utána finomhangolni.')}
            </div>
          )}
          <div className="small muted" style={{ marginTop: 6 }}>{t('Maradék lúgosság (RA): {ra} ppm CaCO₃. Egyszerűsített modell – pH-mérővel ellenőrizd!', { ra: fmt(w.ra, 0) })}</div>
        </div>
        <div>
          <h3 style={{ marginTop: 0 }}>{t('Ionok (ppm)')}</h3>
          <table className="data">
            <thead><tr><th>{t('Ion')}</th><th className="r">{t('Kiinduló')}</th><th className="r">{t('Eredmény')}</th><th className="r">{t('Cél')}</th><th style={{ width: '30%' }} /></tr></thead>
            <tbody>
              {IONS.map((i) => (
                <tr key={i.k}>
                  <td>{t(i.label)}</td>
                  <td className="r muted">{fmt(w.src[i.k], 0)}</td>
                  <td className="r"><b>{fmt(w.out[i.k], 0)}</b></td>
                  <td className="r muted">{fmt(tg[i.k], 0)}</td>
                  <td>
                    <div className="ion-bar">
                      <div className="fill" style={{ width: `${Math.min(100, (w.out[i.k] / i.max) * 100)}%` }} />
                      <div className="tgt" style={{ left: `${Math.min(100, (tg[i.k] / i.max) * 100)}%` }} title={t('cél')} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <div className="label">{t('SO₄ : Cl arány')}</div>
              <div className="big">{fmt(w.ratio, 2)}</div>
            </div>
            <div className="muted">→ {ratioLabel(w.ratio)}</div>
          </div>
          {w.out.ca < 40 && recipe.water.targetId !== 'pilsen' && <div className="alert warn" style={{ marginTop: 8 }}>⚠ {t('Kevés kalcium (< 40 ppm): rosszabb enzimműködés és tisztulás.')}</div>}
          {w.out.na > 150 && <div className="alert warn" style={{ marginTop: 8 }}>⚠ {t('Magas nátrium: sós, kemény íz.')}</div>}
        </div>
      </div>
    </>
  );
}

// ---------------- Bevásárlólista ----------------

function Shopping({ recipe, stats }: { recipe: Recipe; stats: Stats }) {
  const [overrides, setOverrides] = useState<PriceOverrides>(loadPriceOverrides);
  const [costs, setCostsState] = useState<CostSettings>(loadCosts);
  const setPrice = (key: string, v: number | undefined) => {
    const next = { ...overrides };
    if (v === undefined) delete next[key];
    else next[key] = v;
    setOverrides(next);
    savePriceOverrides(next);
  };
  const setCost = <K extends keyof CostSettings>(k: K, v: CostSettings[K]) => {
    const next = { ...costs, [k]: v };
    setCostsState(next);
    saveCosts(next);
  };

  const { lines, total, usedTotal, hoplineTotal } = shoppingList(recipe, stats, overrides);
  if (!lines.length) return <div className="empty">{t('A bevásárlólista a hozzávalókból készül.')}</div>;
  const groups = Array.from(new Set(lines.map((l) => l.group)));
  const L = Math.max(1, stats.volumes.packagedL);
  const ship = shippingCost(hoplineTotal, costs);
  const over = overheads(recipe, stats, costs, fmt);
  const overTotal = over.reduce((a, o) => a + o.cost, 0);
  const real = usedTotal + overTotal;
  const perBottle = real / L / 2;
  const saving = costs.refBeerPrice > 0 ? 1 - perBottle / costs.refBeerPrice : 0;
  const leftover = Math.max(0, total - usedTotal);
  const copy = () => {
    const txt = lines.map((l) => `${l.name} – ${l.buy}`).join('\n');
    navigator.clipboard?.writeText(txt).catch(() => undefined);
  };

  return (
    <>
      <div className="cost-kpis">
        <Vol
          label={t('Bevásárlás most')}
          v={fmtHuf(total + ship)}
          sub={ship ? t('ebből szállítás: {n}', { n: fmtHuf(ship) }) : t('ebből hopline: {n}', { n: fmtHuf(hoplineTotal) })}
        />
        <Vol label={t('Ez a főzés valójában')} v={fmtHuf(real)} sub={t('felhasznált alapanyag {a} + rezsi {b}', { a: fmtHuf(usedTotal), b: fmtHuf(overTotal) })} />
        <Vol label={t('0,5 l-es palackonként')} v={fmtHuf(perBottle)} sub={t('{n} / liter', { n: fmtHuf(real / L) })} />
        <div className={`kpi compare ${saving > 0 ? 'good' : 'bad'}`}>
          <div className="label">{t('Bolti kézműves sörhöz képest')}</div>
          <div className="value" style={{ fontSize: 19 }}>{saving > 0 ? `−${fmt(saving * 100, 0)}%` : `+${fmt(-saving * 100, 0)}%`}</div>
          <div className="sub">{t('{a} vs. {b} / 0,5 l', { a: fmtHuf(perBottle), b: fmtHuf(costs.refBeerPrice) })}</div>
        </div>
      </div>
      {leftover > 50 && (
        <div className="alert info" style={{ marginBottom: 12 }}>
          💡 {t('A csomagokból kb. {n} értékű alapanyag megmarad a következő főzésekre – ezt a valós költség nem tartalmazza.', { n: fmtHuf(leftover) })}
        </div>
      )}

      <table className="data shop-table">
        <thead>
          <tr>
            <th>{t('Termék')}</th>
            <th className="r">{t('Kell')}</th>
            <th className="r">{t('Vásárolni')}</th>
            <th className="r">{t('Egységár')}</th>
            <th className="r">{t('Felhasznált')}</th>
            <th className="r">{t('Vásárlás')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <FragmentGroup key={g} name={t(g)} cols={7}>
              {lines.filter((l) => l.group === g).map((l) => (
                <tr key={l.key}>
                  <td>{l.name}{l.external && <span className="tag" style={{ marginLeft: 6 }}>{t('bolti')}</span>}</td>
                  <td className="r muted">{l.need}</td>
                  <td className="r">{l.buy}</td>
                  <td className="r">
                    <div className="price-cell">
                      <OptNum
                        value={l.unitPrice}
                        onChange={(v) => setPrice(l.key, v === undefined || v === l.defaultUnitPrice ? undefined : v)}
                        suffix={l.unitLabel}
                        ariaLabel={t('{name} egységára', { name: l.name })}
                      />
                      {l.overridden && (
                        <button
                          className="icon-btn reset"
                          onClick={() => setPrice(l.key, undefined)}
                          title={t('Vissza a becsült árra ({n})', { n: fmtHuf(l.defaultUnitPrice) })}
                          aria-label={t('Ár visszaállítása')}
                        >↺</button>
                      )}
                    </div>
                  </td>
                  <td className="r muted">{fmtHuf(l.usedCost)}</td>
                  <td className="r">{fmtHuf(l.cost)}</td>
                  <td className="r">{l.url && <a href={l.url} target="_blank" rel="noreferrer" className="small">hopline ↗</a>}</td>
                </tr>
              ))}
            </FragmentGroup>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={4}>{t('Alapanyagok összesen')}</td><td className="r">{fmtHuf(usedTotal)}</td><td className="r">{fmtHuf(total)}</td><td /></tr>
          {ship > 0 && <tr><td colSpan={5} className="muted">{t('Szállítás')}</td><td className="r">{fmtHuf(ship)}</td><td /></tr>}
        </tfoot>
      </table>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="calib">
          <h3 style={{ margin: '0 0 8px' }}>🔌 {t('Rezsi és egyéb költségek (ez a főzés)')}</h3>
          <table className="data">
            <tbody>
              {over.map((o) => (
                <tr key={o.label}><td>{t(o.label)}</td><td className="muted small">{o.detail}</td><td className="r">{fmtHuf(o.cost)}</td></tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={2}>{t('Rezsi összesen')}</td><td className="r">{fmtHuf(overTotal)}</td></tr></tfoot>
          </table>
        </div>
        <details className="calib cost-settings">
          <summary>⚙ {t('Költség beállítások')}</summary>
          <div className="equip" style={{ marginTop: 8, marginBottom: 0 }}>
            <Field label={t('Energia ára')}><Num value={costs.energyPrice} min={0} step={5} suffix="Ft/kWh" onChange={(v) => setCost('energyPrice', v)} /></Field>
            <Field label={t('Fűtőteljesítmény')}><Num value={costs.heaterKw} min={0.5} step={0.1} suffix="kW" onChange={(v) => setCost('heaterKw', v)} /></Field>
            <Field label={t('Víz + csatorna')}><Num value={costs.waterPrice} min={0} step={50} suffix="Ft/m³" onChange={(v) => setCost('waterPrice', v)} /></Field>
            <Field label={t('Hűtő- és mosóvíz')}><Num value={costs.extraWaterL} min={0} step={10} suffix="L" onChange={(v) => setCost('extraWaterL', v)} /></Field>
            <Field label={t('Kiszerelés')}>
              <select className="select" value={costs.packaging} onChange={(e) => setCost('packaging', e.target.value as CostSettings['packaging'])}>
                <option value="bottle">{t('Palack')}</option>
                <option value="keg">{t('Keg')}</option>
              </select>
            </Field>
            {costs.packaging === 'bottle' && (
              <Field label={t('Kupak')}><Num value={costs.capPrice} min={0} step={1} suffix="Ft/db" onChange={(v) => setCost('capPrice', v)} /></Field>
            )}
            <Field label={t('Fertőtlenítő / főzés')}><Num value={costs.sanitizer} min={0} step={50} suffix="Ft" onChange={(v) => setCost('sanitizer', v)} /></Field>
            <Field label={t('Szállítási díj')}><Num value={costs.shipping} min={0} step={100} suffix="Ft" onChange={(v) => setCost('shipping', v)} /></Field>
            <Field label={t('Ingyenes szállítás')}><Num value={costs.freeShippingFrom} min={0} step={1000} suffix={t('Ft-tól')} onChange={(v) => setCost('freeShippingFrom', v)} /></Field>
            <Field label={t('Bolti kézműves sör')}><Num value={costs.refBeerPrice} min={0} step={50} suffix="Ft/0,5 l" onChange={(v) => setCost('refBeerPrice', v)} /></Field>
          </div>
          <div className="small muted" style={{ marginTop: 8 }}>
            {t('A beállítások minden receptre érvényesek. Az energiaigény becslés: felfűtés, cefre tartása, forralás.')}
          </div>
        </details>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <span className="small muted">
          {t('Az árak tájékoztató becslések (2026) – írd át a sajátodra a táblázatban, az app megjegyzi. A pontos árakat és készletet a hopline.hu-n ellenőrizd.')}
        </span>
        <span className="spacer" />
        <button className="btn sm" onClick={copy}>📋 {t('Lista másolása')}</button>
      </div>
    </>
  );
}

function FragmentGroup({ name, children, cols = 5 }: { name: string; children: ReactNode; cols?: number }) {
  return (
    <>
      <tr className="group"><td colSpan={cols}>{name}</td></tr>
      {children}
    </>
  );
}
