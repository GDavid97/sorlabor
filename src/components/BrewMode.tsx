import { useEffect, useMemo, useState } from 'react';
import type { BrewSession, Measurements } from '../types';
import { computeStats } from '../lib/calc';
import { buildBrewSteps, ogCorrection, preBoilCorrection, type BrewStep, type MeasureField } from '../lib/brewmode';
import { parseGravity, sessionMetrics } from '../lib/sessions';
import { beep, notify, unlockAudio } from '../lib/sound';
import { t, dateStr, getLang } from '../i18n';
import { OptNum, fmt } from './ui';

interface Props {
  session: BrewSession;
  onChange: (s: BrewSession) => void;
  onClose: () => void;
}

const MEASURE_META: Record<MeasureField, { label: string; suffix: string; gravity?: boolean }> = {
  preBoilSG: { label: 'Forralás előtti sűrűség', suffix: 'SG', gravity: true },
  preBoilL: { label: 'Forralás előtti térfogat', suffix: 'L' },
  postBoilL: { label: 'Forralás utáni térfogat', suffix: 'L' },
  og: { label: 'Kezdeti sűrűség (OG)', suffix: 'SG', gravity: true },
  batchL: { label: 'Térfogat a fermentorban', suffix: 'L' },
};

const mmss = (ms: number) => {
  const neg = ms < 0;
  const tt = Math.abs(Math.round(ms / 1000));
  const h = Math.floor(tt / 3600);
  const m = Math.floor((tt % 3600) / 60);
  const s = tt % 60;
  const body = h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return neg ? `+${body}` : body;
};

export function BrewMode({ session, onChange, onClose }: Props) {
  const lang = getLang();
  const stats = useMemo(() => computeStats(session.recipe), [session.recipe, lang]);
  const steps = useMemo(() => buildBrewSteps(session.recipe, stats), [session.recipe, stats, lang]);
  const [now, setNow] = useState(Date.now());
  const [showList, setShowList] = useState(false);
  const idx = Math.min(session.stepIndex, steps.length - 1);
  const step = steps[idx];
  const timer = session.timer;
  const running = !!timer?.startedAt;

  // óra
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(iv);
  }, []);

  // képernyő ébren tartása
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    const req = () => nav.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => undefined);
    void req();
    const onVis = () => document.visibilityState === 'visible' && req();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      void lock?.release().catch(() => undefined);
    };
  }, []);

  // időzítő állapota (bármelyik lépésé lehet – fut a háttérben is)
  const timerStep = timer ? steps.find((s) => s.key === timer.stepKey) : undefined;
  const elapsed = timer ? timer.elapsedMs + (timer.startedAt ? now - timer.startedAt : 0) : 0;
  const remaining = timerStep?.minutes ? timerStep.minutes * 60000 - elapsed : 0;

  // riasztások
  useEffect(() => {
    if (!timer || !timerStep?.minutes || !timer.startedAt) return;
    const fired: string[] = [];
    let msg: { title: string; detail?: string } | null = null;
    for (const a of timerStep.alerts ?? []) {
      if (!session.firedAlerts.includes(a.key) && remaining <= a.atMin * 60000) {
        fired.push(a.key);
        msg = msg ?? { title: a.title, detail: a.detail };
      }
    }
    const endKey = `${timerStep.key}:end`;
    if (remaining <= 0 && !session.firedAlerts.includes(endKey)) {
      fired.push(endKey);
      msg = msg ?? { title: t('{step} – lejárt az idő!', { step: timerStep.title }) };
    }
    if (fired.length) {
      beep(fired.includes(endKey) ? 4 : 3);
      if (msg) notify(`🍺 ${msg.title}`, msg.detail);
      onChange({ ...session, firedAlerts: [...session.firedAlerts, ...fired] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  // fül címe
  useEffect(() => {
    const prev = document.title;
    return () => {
      document.title = prev;
    };
  }, []);
  useEffect(() => {
    document.title = timerStep?.minutes && timer ? `${running ? '⏱' : '⏸'} ${mmss(remaining)} · ${timerStep.title}` : `🍺 ${step.title}`;
  });

  const set = (patch: Partial<BrewSession>) => onChange({ ...session, ...patch });
  const setM = (patch: Measurements) => set({ measurements: { ...session.measurements, ...patch } });

  const startTimer = (s: BrewStep) => {
    unlockAudio();
    if (timer && timer.stepKey === s.key) {
      set({ timer: { ...timer, startedAt: Date.now() } });
    } else {
      set({ timer: { stepKey: s.key, startedAt: Date.now(), elapsedMs: 0 } });
    }
  };
  const pauseTimer = () => timer?.startedAt && set({ timer: { ...timer, elapsedMs: elapsed, startedAt: null } });
  const resetTimer = (s: BrewStep) =>
    set({
      timer: null,
      firedAlerts: session.firedAlerts.filter((k) => !k.startsWith(s.key) && !(s.alerts ?? []).some((a) => a.key === k)),
      doneSteps: session.doneSteps.filter((k) => !(s.alerts ?? []).some((a) => a.key === k)),
    });

  const go = (i: number) => {
    const next = Math.max(0, Math.min(steps.length - 1, i));
    const doneSteps = i > idx && !session.doneSteps.includes(step.key) ? [...session.doneSteps, step.key] : session.doneSteps;
    set({ stepIndex: next, doneSteps });
  };
  const finish = () => {
    set({ doneSteps: [...new Set([...session.doneSteps, step.key])], status: 'fermenting', timer: null, pitchedAt: Date.now() });
    onClose();
  };
  const ack = (key: string) => set({ doneSteps: [...session.doneSteps, key] });

  // aktuális riasztások, amiket még nem nyugtáztak
  const pending = (timerStep?.alerts ?? []).filter((a) => session.firedAlerts.includes(a.key) && !session.doneSteps.includes(a.key));
  const timerElsewhere = timer && timerStep && timerStep.key !== step.key;
  const m = session.measurements;
  const metrics = sessionMetrics(session);

  // egymást követő azonos fázisú lépések csoportjai (a sorrend megmarad)
  const groups: { phase: string; items: { s: BrewStep; i: number }[] }[] = [];
  steps.forEach((s, i) => {
    const last = groups[groups.length - 1];
    if (last && last.phase === s.phase) last.items.push({ s, i });
    else groups.push({ phase: s.phase, items: [{ s, i }] });
  });

  return (
    <div className="brew-mode" role="dialog" aria-label={t('Főzőnap mód')}>
      <header className="bm-top">
        <button className="btn ghost" onClick={onClose}>✕ {t('Kilépés')}</button>
        <div className="bm-title">
          <div className="label">{t('Főzőnap')} · {dateStr(session.startedAt)}</div>
          <strong>{session.recipeName}</strong>
        </div>
        <span className="spacer" />
        {typeof Notification !== 'undefined' && Notification.permission === 'default' && (
          <button className="btn sm" onClick={() => void Notification.requestPermission().then(() => setNow(Date.now()))}>🔔 {t('Értesítések')}</button>
        )}
        <button className="btn sm" onClick={() => beep(2)} title={t('Hang teszt')}>🔊 {t('Teszt')}</button>
        <button className="btn sm bm-list-toggle" onClick={() => setShowList((v) => !v)}>☰ {t('Lépések')}</button>
      </header>

      <div className="bm-progress" aria-hidden>
        <div style={{ width: `${((idx + 1) / steps.length) * 100}%` }} />
      </div>

      <div className="bm-body">
        <nav className={`bm-steps ${showList ? 'open' : ''}`}>
          {groups.map((g, gi) => (
            <div key={gi}>
              <div className="label" style={{ margin: '10px 8px 4px' }}>{t(g.phase)}</div>
              {g.items.map(({ s, i }) => (
                <button
                  key={s.key}
                  className={`bm-step ${i === idx ? 'active' : ''} ${session.doneSteps.includes(s.key) ? 'done' : ''}`}
                  onClick={() => { set({ stepIndex: i }); setShowList(false); }}
                >
                  <span className="bm-dot">{session.doneSteps.includes(s.key) ? '✓' : i + 1}</span>
                  <span className="bm-step-name">{s.title}</span>
                  {timer?.stepKey === s.key && <span className="pill">{running ? '⏱' : '⏸'} {mmss(remaining)}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <main className="bm-main">
          {pending.length > 0 && (
            <div className="bm-alert" role="alert">
              {pending.map((a) => (
                <div key={a.key} className="bm-alert-row">
                  <div>
                    <div className="label" style={{ color: 'var(--on-accent)' }}>{t('Most add hozzá!')}</div>
                    <strong>{a.title}</strong>
                    {a.detail && <div className="small">{a.detail}</div>}
                  </div>
                  <button className="btn" onClick={() => ack(a.key)}>✓ {t('Hozzáadva')}</button>
                </div>
              ))}
            </div>
          )}

          {timerElsewhere && (
            <button className="bm-mini-timer" onClick={() => set({ stepIndex: steps.findIndex((s) => s.key === timerStep!.key) })}>
              {running ? '⏱' : '⏸'} {timerStep!.title}: <b>{mmss(remaining)}</b> — {t('ugrás')}
            </button>
          )}

          <div className="bm-card">
            <div className="row">
              <span className="pill">{t(step.phase)}</span>
              <span className="muted small">{t('{i}. lépés / {n}', { i: idx + 1, n: steps.length })}</span>
            </div>
            <h2 className="bm-step-title">{step.title}</h2>
            {step.temp && <div className="bm-temp">🌡 {step.temp}</div>}
            {step.detail && <p className="bm-detail">{step.detail}</p>}

            {step.checklist && (
              <ul className="bm-check">
                {step.checklist.map((c, i) => {
                  const k = `${step.key}#${i}`;
                  const on = session.doneSteps.includes(k);
                  return (
                    <li key={k}>
                      <label className={on ? 'on' : ''}>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => set({ doneSteps: on ? session.doneSteps.filter((x) => x !== k) : [...session.doneSteps, k] })}
                        />
                        <span>{c}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}

            {step.minutes !== undefined && (
              <div className="bm-timer">
                {(() => {
                  const mine = timer?.stepKey === step.key;
                  const rem = mine ? remaining : step.minutes * 60000;
                  const pct = mine ? Math.min(100, (elapsed / (step.minutes * 60000)) * 100) : 0;
                  return (
                    <>
                      <div className={`bm-clock ${mine && rem <= 0 ? 'over' : ''}`}>{mmss(rem)}</div>
                      <div className="bm-bar"><div style={{ width: `${pct}%` }} /></div>
                      <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
                        {mine && running ? (
                          <button className="btn big-btn" onClick={pauseTimer}>⏸ {t('Szünet')}</button>
                        ) : (
                          <button className="btn primary big-btn" onClick={() => startTimer(step)}>▶ {mine ? t('Folytatás') : t('Indítás')}</button>
                        )}
                        {mine && <button className="btn ghost" onClick={() => resetTimer(step)}>↺ {t('Nullázás')}</button>}
                      </div>
                      {timer && !mine && <div className="small muted" style={{ textAlign: 'center', marginTop: 6 }}>{t('Indítással a másik futó óra leáll.')}</div>}
                    </>
                  );
                })()}
              </div>
            )}

            {step.alerts && step.alerts.length > 0 && (
              <div className="bm-schedule">
                <div className="label">{t('Hozzáadások (hátralévő idő szerint)')}</div>
                {step.alerts.map((a) => {
                  const done = session.doneSteps.includes(a.key);
                  const fired = session.firedAlerts.includes(a.key);
                  const mine = timer?.stepKey === step.key;
                  const until = mine ? remaining - a.atMin * 60000 : (step.minutes! - a.atMin) * 60000;
                  return (
                    <div key={a.key} className={`bm-sched-row ${done ? 'done' : fired ? 'fired' : ''}`}>
                      <span className="bm-at">{t('{n} perc', { n: a.atMin })}</span>
                      <span className="bm-sched-name">{a.title}</span>
                      <span className="muted small">{done ? `✓ ${t('kész')}` : fired ? t('MOST') : t('{t} múlva', { t: mmss(until) })}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {step.measure && (
              <div className="bm-measure">
                {step.measure.map((f) => (
                  <div className="field" key={f}>
                    <label>{t(MEASURE_META[f].label)}</label>
                    <OptNum
                      big
                      value={m[f]}
                      suffix={MEASURE_META[f].suffix}
                      parse={MEASURE_META[f].gravity ? parseGravity : undefined}
                      placeholder={MEASURE_META[f].gravity ? t('pl. 1,052 vagy 1052') : t('liter')}
                      onChange={(v) => setM({ [f]: v })}
                      ariaLabel={t(MEASURE_META[f].label)}
                    />
                  </div>
                ))}
                {step.key === 'measure-pre' && (
                  <MeasureFeedback
                    lines={[
                      metrics.mashEff !== undefined ? t('Cefrézési hatásfok: {n}%', { n: fmt(metrics.mashEff, 0) }) : null,
                      preBoilCorrection(session.recipe, stats, m.preBoilSG, m.preBoilL),
                    ]}
                  />
                )}
                {step.key === 'measure-post' && metrics.boilOffLph !== undefined && (
                  <MeasureFeedback lines={[t('Mért elpárolgás: {a} L/óra (beállítva: {b})', { a: fmt(metrics.boilOffLph, 1), b: fmt(session.recipe.equipment.boilOffLph, 1) })]} />
                )}
                {step.key === 'measure-og' && (
                  <MeasureFeedback
                    lines={[
                      metrics.brewhouseEff !== undefined
                        ? t('Főzőházi hatásfok: {a}% (tervezett {b}%)', { a: fmt(metrics.brewhouseEff, 0), b: session.predicted.efficiency })
                        : null,
                      metrics.kettleLossL !== undefined ? t('Üstveszteség: {l} L', { l: fmt(metrics.kettleLossL, 1) }) : null,
                      ogCorrection(stats, m.og, m.batchL),
                    ]}
                  />
                )}
              </div>
            )}

            {step.final && (
              <div className="alert info" style={{ marginTop: 14 }}>
                {t('A végső sűrűséget (FG) az erjedés végén a Napló fülön tudod beírni – abból számolódik a valódi alkohol és az élesztő erjedési foka.')}
              </div>
            )}
          </div>

          <div className="bm-nav">
            <button className="btn big-btn" disabled={idx === 0} onClick={() => go(idx - 1)}>← {t('Előző')}</button>
            {step.final ? (
              <button className="btn primary big-btn" onClick={finish}>✓ {t('Főzés kész – irány az erjesztés')}</button>
            ) : (
              <button className="btn primary big-btn" onClick={() => go(idx + 1)}>{t('Kész, tovább')} →</button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function MeasureFeedback({ lines }: { lines: (string | null)[] }) {
  const l = lines.filter(Boolean) as string[];
  if (!l.length) return null;
  return (
    <div className="alert info" style={{ gridColumn: '1 / -1', flexDirection: 'column', gap: 4 }}>
      {l.map((x, i) => <div key={i}>{x}</div>)}
    </div>
  );
}
