import { useState, type ReactNode } from 'react';
import type { BrewSession, Recipe } from '../types';
import { EQUIPMENT_DEFAULTS } from '../data/water';
import { getYeast } from '../lib/catalog';
import {
  applyCalibration, calibrationFrom, loadDefaults, parseGravity, saveDefault, sessionMetrics, yeastAttenuationStats,
} from '../lib/sessions';
import { t, dateTimeStr } from '../i18n';
import { yeastName } from '../lib/names';
import { OptNum, fmt, fmtSG } from './ui';
import { FermentTracker } from './FermentTracker';
import { fermentStatus } from '../lib/ferment';

type Update = (fn: (r: Recipe) => Recipe) => void;

interface Props {
  recipe: Recipe;
  update: Update;
  sessions: BrewSession[];
  setSessions: (s: BrewSession[]) => void;
  onResume: (id: string) => void;
}

const STATUS: Record<BrewSession['status'], { label: string; cls: string }> = {
  brewing: { label: 'főzés folyamatban', cls: 'warn' },
  fermenting: { label: 'erjed', cls: 'info' },
  done: { label: 'kész', cls: 'ok' },
};

export function BrewLog({ recipe, update, sessions, setSessions, onResume }: Props) {
  const [onlyThis, setOnlyThis] = useState(false);
  const [defaults, setDefaults] = useState(loadDefaults());
  const cal = calibrationFrom(sessions, recipe.method);
  const isDefault = !!defaults[recipe.method];
  const yeastStats = yeastAttenuationStats(sessions);
  const y = getYeast(recipe.yeastId);
  const yAtt = y ? yeastStats.get(y.id) : undefined;

  const list = sessions
    .filter((s) => !onlyThis || s.recipeId === recipe.id)
    .sort((a, b) => b.startedAt - a.startedAt);

  const patch = (id: string, p: Partial<BrewSession>) => setSessions(sessions.map((s) => (s.id === id ? { ...s, ...p } : s)));

  const calRows: { label: string; measured?: number; current: number; unit: string; d: number }[] = [
    { label: t('Főzőházi hatásfok'), measured: cal.efficiency, current: recipe.efficiency, unit: '%', d: 0 },
    { label: t('Elpárolgás'), measured: cal.boilOffLph, current: recipe.equipment.boilOffLph, unit: t('L/óra'), d: 1 },
    { label: t('Üstveszteség'), measured: cal.kettleLossL, current: recipe.equipment.kettleLossL, unit: 'L', d: 1 },
  ];
  const hasCal = calRows.some((r) => r.measured !== undefined);
  const differs = calRows.some((r) => r.measured !== undefined && Math.abs(r.measured - r.current) > (r.d ? 0.15 : 0.5));
  const plannedPre = (s: BrewSession) => s.recipe.batchL + s.recipe.equipment.kettleLossL + (s.recipe.equipment.boilOffLph * s.recipe.boilMin) / 60;

  const fermenting = sessions.filter((s) => s.status === 'fermenting').sort((a, b) => b.startedAt - a.startedAt);

  return (
    <>
      {fermenting.length > 0 && (
        <div className="fermenting-strip">
          <div className="label">⏳ {t('Most erjed')}</div>
          {fermenting.map((s) => {
            const st = fermentStatus(s);
            return (
              <a key={s.id} className={`ferm-chip ${st.state}`} href={`#sess-${s.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`sess-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
                <b>{s.recipeName}</b>
                <span>{t('{n}. nap', { n: Math.floor(st.dayNow) })}</span>
                {st.progress !== undefined && <span>{fmt(st.progress * 100, 0)}%</span>}
                {st.state === 'done' && <span>✅</span>}
                {(st.state === 'stuck' || st.state === 'slow' || st.tempWarn) && <span>⚠</span>}
              </a>
            );
          })}
        </div>
      )}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="calib">
          <div className="row" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>🎯 {t('Kalibráció')} – {t(EQUIPMENT_DEFAULTS[recipe.method].label)}</h3>
          </div>
          {!hasCal ? (
            <div className="muted">
              {t('Még nincs mérés ehhez a módszerhez. Indíts egy Főzőnapot, és írd be a forralás előtti / utáni térfogatot és sűrűséget meg az OG-t – a rendszered valódi hatásfoka és veszteségei itt jelennek meg (az utolsó 5 főzés átlaga).')}
            </div>
          ) : (
            <>
              <table className="data">
                <thead><tr><th>{t('Mutató')}</th><th className="r">{t('Mért átlag')}</th><th className="r">{t('Recept beállítás')}</th></tr></thead>
                <tbody>
                  {calRows.map((r) => (
                    <tr key={r.label}>
                      <td>{r.label}</td>
                      <td className="r"><b>{r.measured === undefined ? '–' : `${fmt(r.measured, r.d)} ${r.unit}`}</b></td>
                      <td className="r muted">{fmt(r.current, r.d)} {r.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="small muted" style={{ marginTop: 6 }}>{t('{n} főzés alapján.', { n: cal.n })}</div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn sm primary" disabled={!differs} onClick={() => update((r) => applyCalibration(r, cal))}>
                  {differs ? t('Alkalmazás erre a receptre') : `✓ ${t('A recept már a mért értékekkel számol')}`}
                </button>
                <button
                  className="btn sm"
                  onClick={() => {
                    saveDefault(recipe.method, isDefault ? null : cal);
                    setDefaults(loadDefaults());
                  }}
                >
                  {isDefault ? `✕ ${t('Ne legyen alapértelmezett')}` : `★ ${t('Legyen alapértelmezett az új recepteknél')}`}
                </button>
              </div>
              {isDefault && (
                <div className="small muted" style={{ marginTop: 6 }}>
                  {t('Új receptek ezzel indulnak: {eff}% hatásfok, {boil} L/óra elpárolgás.', {
                    eff: defaults[recipe.method]?.efficiency ?? '–',
                    boil: fmt(defaults[recipe.method]?.boilOffLph ?? NaN, 1),
                  })}
                </div>
              )}
            </>
          )}
        </div>
        <div className="calib">
          <h3 style={{ margin: '0 0 8px' }}>🧫 {t('Élesztő a gyakorlatban')}</h3>
          {yeastStats.size === 0 ? (
            <div className="muted">{t('Ha egy főzésnél beírod az FG-t is, itt látod, mennyire erjeszt nálad az adott élesztő a katalógusértékhez képest.')}</div>
          ) : (
            <table className="data">
              <thead><tr><th>{t('Élesztő')}</th><th className="r">{t('Mért')}</th><th className="r">{t('Katalógus')}</th></tr></thead>
              <tbody>
                {[...yeastStats.entries()].map(([id, arr]) => {
                  const yy = getYeast(id);
                  const a = arr.reduce((s, x) => s + x, 0) / arr.length;
                  return (
                    <tr key={id} style={id === y?.id ? { background: 'var(--accent-soft)' } : undefined}>
                      <td>{yy ? yeastName(yy) : id} <span className="muted small">({arr.length}×)</span></td>
                      <td className="r"><b>{fmt(a, 0)}%</b></td>
                      <td className="r muted">{yy ? `${yy.attenuation[0]}–${yy.attenuation[1]}%` : '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {y && yAtt && (
            <div className="small muted" style={{ marginTop: 6 }}>
              {t('A {yeast} nálad átlagosan {a}%-ot erjeszt – a recept {b}%-kal számol (± cefrehőfok).', {
                yeast: yeastName(y), a: fmt(yAtt.reduce((s, x) => s + x, 0) / yAtt.length, 0), b: fmt((y.attenuation[0] + y.attenuation[1]) / 2, 0),
              })}
            </div>
          )}
        </div>
      </div>

      <div className="row" style={{ marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>📒 {t('Főzések')} ({list.length})</h3>
        <span className="spacer" />
        <label className="small row" style={{ gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={onlyThis} onChange={(e) => setOnlyThis(e.target.checked)} /> {t('csak ez a recept')}
        </label>
      </div>
      {list.length === 0 && <div className="empty">{t('Még nincs főzés. A fenti „▶ Főzőnap” gombbal indíthatsz egyet.')}</div>}
      <div className="sessions">
        {list.map((s) => {
          const mt = sessionMetrics(s);
          const m = s.measurements;
          const st = STATUS[s.status];
          const plan = (v: string) => t('terv: {v}', { v });
          return (
            <div className="session" key={s.id} id={`sess-${s.id}`}>
              <div className="row">
                <strong>{s.recipeName}</strong>
                <span className={`badge ${st.cls}`}>{t(st.label)}</span>
                <span className="muted small">{dateTimeStr(s.startedAt)}</span>
                <span className="spacer" />
                {s.status === 'brewing' && <button className="btn sm primary" onClick={() => onResume(s.id)}>▶ {t('Folytatás')}</button>}
                {s.status === 'fermenting' && m.fg && <button className="btn sm" onClick={() => patch(s.id, { status: 'done', finishedAt: Date.now() })}>✓ {t('Lezárás')}</button>}
                <button
                  className="icon-btn"
                  aria-label={t('Főzés törlése')}
                  onClick={() => confirm(t('Törlöd ezt a főzést a naplóból?')) && setSessions(sessions.filter((x) => x.id !== s.id))}
                >✕</button>
              </div>
              <div className="session-grid">
                <Metric label={t('Forr. előtti SG')} plan={plan(fmtSG(s.predicted.preBoilSG))}>
                  <OptNum value={m.preBoilSG} parse={parseGravity} suffix="SG" onChange={(v) => patch(s.id, { measurements: { ...m, preBoilSG: v } })} />
                </Metric>
                <Metric label={t('Forr. előtt')} plan={plan(`${fmt(plannedPre(s), 1)} L`)}>
                  <OptNum value={m.preBoilL} suffix="L" onChange={(v) => patch(s.id, { measurements: { ...m, preBoilL: v } })} />
                </Metric>
                <Metric label={t('Forr. után')} plan={plan(`${fmt(s.recipe.batchL + s.recipe.equipment.kettleLossL, 1)} L`)}>
                  <OptNum value={m.postBoilL} suffix="L" onChange={(v) => patch(s.id, { measurements: { ...m, postBoilL: v } })} />
                </Metric>
                <Metric label="OG" plan={plan(fmtSG(s.predicted.og))}>
                  <OptNum value={m.og} parse={parseGravity} suffix="SG" onChange={(v) => patch(s.id, { measurements: { ...m, og: v } })} />
                </Metric>
                <Metric label={t('Fermentorban')} plan={plan(`${fmt(s.recipe.batchL, 1)} L`)}>
                  <OptNum value={m.batchL} suffix="L" onChange={(v) => patch(s.id, { measurements: { ...m, batchL: v } })} />
                </Metric>
                <Metric label="FG" plan={plan(fmtSG(s.predicted.fg))}>
                  <OptNum value={m.fg} parse={parseGravity} suffix="SG" onChange={(v) => patch(s.id, { measurements: { ...m, fg: v } })} />
                </Metric>
              </div>
              <div className="session-results">
                <Result label={t('Hatásfok')} v={mt.brewhouseEff} plan={s.predicted.efficiency} unit="%" />
                <Result label={t('Cefre hatásfok')} v={mt.mashEff} unit="%" />
                <Result label={t('Elpárolgás')} v={mt.boilOffLph} plan={s.recipe.equipment.boilOffLph} unit={` ${t('L/óra')}`} d={1} />
                <Result label={t('Erjedési fok')} v={mt.attenuation} plan={s.predicted.attenuation} unit="%" />
                <Result label={t('Alkohol')} v={mt.abv} plan={mt.stats.abv} unit="%" d={1} />
              </div>
              {s.status !== 'brewing' && (
                <details className="ferment-details" open={s.status === 'fermenting'}>
                  <summary>📈 {t('Erjedéskövetés')} {(s.readings?.length ?? 0) > 0 && <span className="count">{s.readings!.length}</span>}</summary>
                  <FermentTracker session={s} onChange={(p) => patch(s.id, p)} />
                </details>
              )}
              <textarea
                className="input"
                rows={2}
                style={{ minHeight: 44, marginTop: 8 }}
                placeholder={t('Jegyzet ehhez a főzéshez (mi ment jól / rosszul, kóstolás)…')}
                value={s.notes}
                onChange={(e) => patch(s.id, { notes: e.target.value })}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}

function Metric({ label, plan, children }: { label: string; plan: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      <span className="small muted">{plan}</span>
    </div>
  );
}

function Result({ label, v, plan, unit, d = 0 }: { label: string; v?: number; plan?: number; unit: string; d?: number }) {
  if (v === undefined) return null;
  const delta = plan !== undefined ? v - plan : undefined;
  return (
    <div className="res">
      <span className="muted small">{label}</span>
      <b>{fmt(v, d)}{unit}</b>
      {delta !== undefined && Math.abs(delta) >= (d ? 0.1 : 1) && (
        <span className={`small ${Math.abs(delta) > (d ? 0.5 : 4) ? 'warn-t' : 'muted'}`}>({delta > 0 ? '+' : ''}{fmt(delta, d)})</span>
      )}
    </div>
  );
}
