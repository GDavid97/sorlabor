import { useState, type MouseEvent } from 'react';
import type { BrewSession, Reading } from '../types';
import { dayOf, fermentStatus } from '../lib/ferment';
import { parseGravity } from '../lib/sessions';
import { uid } from '../lib/catalog';
import { t, dateTimeStr } from '../i18n';
import { OptNum, fmt, fmtSG } from './ui';

// ---------------- Kis vonaldiagram (egy sorozat, egy tengely) ----------------

interface Pt { x: number; y: number; label: string }

function MiniChart({
  points, xMax, yMin, yMax, yFmt, refLine, band, today, title, height = 170,
}: {
  points: Pt[];
  xMax: number;
  yMin: number;
  yMax: number;
  yFmt: (v: number) => string;
  refLine?: { y: number; label: string };
  band?: { lo: number; hi: number; label: string };
  today?: number;
  title: string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 600;
  const H = height;
  const m = { l: 52, r: 14, t: 12, b: 26 };
  const px = (x: number) => m.l + (x / Math.max(1, xMax)) * (W - m.l - m.r);
  const py = (y: number) => m.t + (1 - (y - yMin) / Math.max(1e-9, yMax - yMin)) * (H - m.t - m.b);
  const yTicks = Array.from({ length: 4 }, (_, i) => yMin + ((yMax - yMin) * i) / 3);
  const step = xMax <= 10 ? 1 : xMax <= 21 ? 3 : xMax <= 42 ? 7 : 14;
  const xTicks = Array.from({ length: Math.floor(xMax / step) + 1 }, (_, i) => i * step);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ');
  const h = hover !== null ? points[hover] : null;

  const onMove = (e: MouseEvent<SVGRectElement>) => {
    if (!points.length) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    let best = 0;
    points.forEach((p, i) => { if (Math.abs(px(p.x) - x) < Math.abs(px(points[best].x) - x)) best = i; });
    setHover(best);
  };

  return (
    <figure className="mini-chart">
      <figcaption>{title}</figcaption>
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={title}>
          {band && (
            <rect x={m.l} width={W - m.l - m.r} y={py(Math.min(yMax, band.hi))} height={Math.max(0, py(Math.max(yMin, band.lo)) - py(Math.min(yMax, band.hi)))} className="mc-band">
              <title>{band.label}</title>
            </rect>
          )}
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={m.l} x2={W - m.r} y1={py(v)} y2={py(v)} className="mc-grid" />
              <text x={m.l - 8} y={py(v)} className="mc-axis" textAnchor="end" dominantBaseline="middle">{yFmt(v)}</text>
            </g>
          ))}
          {xTicks.map((v) => (
            <text key={v} x={px(v)} y={H - 6} className="mc-axis" textAnchor="middle">{t('{n}. nap', { n: v })}</text>
          ))}
          {refLine && refLine.y >= yMin && refLine.y <= yMax && (
            <g>
              <line x1={m.l} x2={W - m.r} y1={py(refLine.y)} y2={py(refLine.y)} className="mc-ref" />
              <text x={W - m.r - 4} y={py(refLine.y) - 6} className="mc-ref-label" textAnchor="end">{refLine.label}</text>
            </g>
          )}
          {today !== undefined && today <= xMax && (
            <g>
              <line x1={px(today)} x2={px(today)} y1={m.t} y2={H - m.b} className="mc-today" />
              <text x={px(today) + 4} y={m.t + 10} className="mc-ref-label">{t('ma')}</text>
            </g>
          )}
          {points.length > 1 && <path d={path} className="mc-line" />}
          {points.map((p, i) => (
            <circle key={i} cx={px(p.x)} cy={py(p.y)} r={hover === i ? 6 : 4.5} className="mc-dot" />
          ))}
          {h && <line x1={px(h.x)} x2={px(h.x)} y1={m.t} y2={H - m.b} className="mc-cross" />}
          <rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
        </svg>
        {h && (
          <div className="tooltip" style={{ left: `${(px(h.x) / W) * 100}%`, top: `${(py(h.y) / H) * 100}%`, transform: 'translate(-50%, calc(-100% - 12px))' }}>
            <b>{yFmt(h.y)}</b> · {h.label}
          </div>
        )}
      </div>
    </figure>
  );
}

// ---------------- Erjedéskövető panel ----------------

const toLocalInput = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function FermentTracker({ session, onChange }: { session: BrewSession; onChange: (p: Partial<BrewSession>) => void }) {
  const st = fermentStatus(session);
  const [when, setWhen] = useState(() => toLocalInput(Date.now()));
  const [sg, setSg] = useState<number | undefined>();
  const [temp, setTemp] = useState<number | undefined>();
  const [note, setNote] = useState('');

  const add = () => {
    if (sg === undefined && temp === undefined && !note.trim()) return;
    const tms = new Date(when).getTime() || Date.now();
    const r: Reading = { id: uid(), t: tms, sg, temp, note: note.trim() || undefined };
    onChange({ readings: [...(session.readings ?? []), r] });
    setSg(undefined);
    setTemp(undefined);
    setNote('');
    setWhen(toLocalInput(Date.now()));
  };
  const remove = (id: string) => onChange({ readings: (session.readings ?? []).filter((r) => r.id !== id) });

  const lastDay = st.readings.length ? dayOf(st.start, st.readings[st.readings.length - 1].t) : 0;
  const planEnd = st.plan.length ? Math.max(...st.plan.map((p) => p.days[1])) : 14;
  const xMax = Math.max(7, Math.ceil(Math.max(lastDay, Math.min(st.dayNow, planEnd + 7), Math.min(planEnd, 28))));

  const sgPts: Pt[] = [
    { x: 0, y: st.og, label: `OG · ${t('{n}. nap', { n: 0 })}` },
    ...st.readings.filter((r) => r.sg !== undefined).map((r) => ({ x: dayOf(st.start, r.t), y: r.sg!, label: dateTimeStr(r.t) })),
  ];
  const tempPts: Pt[] = st.readings.filter((r) => r.temp !== undefined).map((r) => ({ x: dayOf(st.start, r.t), y: r.temp!, label: dateTimeStr(r.t) }));
  const temps = tempPts.map((p) => p.y).concat(st.yeastRange ?? []);
  const tMin = Math.floor(Math.min(...(temps.length ? temps : [15])) - 2);
  const tMax = Math.ceil(Math.max(...(temps.length ? temps : [22])) + 2);

  const stateMsg: Record<typeof st.state, { cls: string; text: string }> = {
    empty: { cls: 'info', text: t('Add meg az első mérést – a sűrűségből az app kiszámolja, hol tart az erjedés.') },
    active: { cls: 'info', text: t('Az erjedés halad – {p}%-nál jár a cél FG felé.', { p: fmt((st.progress ?? 0) * 100, 0) }) },
    slow: { cls: 'warn', text: t('Lassan halad: 3 nap alatt alig esett a sűrűség. Emeld 1–2 fokkal a hőt, és óvatosan forgasd meg a fermentort.') },
    stuck: { cls: 'warn', text: t('Elakadt erjedés? A sűrűség 2 napja nem változik, de még messze van a céltól ({fg}). Emeld a hőt az élesztő tartományának tetejére, rázd fel az élesztőt, végső esetben adj friss élesztőt.', { fg: fmtSG(st.targetFg) }) },
    done: { cls: 'good', text: t('Kierjedt! A sűrűség stabil a cél közelében – jöhet a hideg derítés, majd a palackozás.') },
  };
  const msg = stateMsg[st.state];

  return (
    <div className="ferment">
      <div className="ferment-kpis">
        <div className="fk"><span className="label">{t('Erjedés napja')}</span><b>{t('{n}. nap', { n: Math.floor(st.dayNow) })}</b></div>
        <div className="fk"><span className="label">{t('Jelenlegi SG')}</span><b>{st.last ? fmtSG(st.last.sg) : '–'}</b><small>{t('cél')} {fmtSG(st.targetFg)}</small></div>
        <div className="fk"><span className="label">{t('Erjedési fok')}</span><b>{st.attenuation !== undefined ? `${fmt(st.attenuation, 0)}%` : '–'}</b></div>
        <div className="fk"><span className="label">{t('Alkohol eddig')}</span><b>{st.abv !== undefined ? `${fmt(st.abv, 1)}%` : '–'}</b></div>
        {st.progress !== undefined && (
          <div className="fk wide">
            <span className="label">{t('Haladás a cél FG felé')}</span>
            <div className="fbar"><div style={{ width: `${st.progress * 100}%` }} /></div>
          </div>
        )}
      </div>

      <div className={`alert ${msg.cls === 'good' ? 'info good-alert' : msg.cls}`}>{msg.cls === 'good' ? '✅' : msg.cls === 'warn' ? '⚠' : '📈'} {msg.text}</div>
      {st.tempWarn && st.yeastRange && (
        <div className="alert warn" style={{ marginTop: 6 }}>
          🌡 {st.tempWarn === 'high'
            ? t('Túl meleg: az élesztő ajánlott tartománya {a}–{b} °C. Melegen fuzel- és oldószeres ízek jöhetnek.', { a: st.yeastRange[0], b: st.yeastRange[1] })
            : t('Túl hideg: az élesztő ajánlott tartománya {a}–{b} °C. Hidegen lelassul vagy leáll az erjedés.', { a: st.yeastRange[0], b: st.yeastRange[1] })}
        </div>
      )}

      <div className="ferment-todo">
        <div>
          <div className="label">{t('Ma')}</div>
          {st.current.length ? st.current.map((s, i) => <div key={i} className="todo-item now"><b>{s.title}</b> <span className="pill">{s.time}</span>{s.temp && <span className="pill temp">{s.temp}</span>}</div>)
            : <div className="muted small">{t('Nincs külön teendő – hagyd dolgozni az élesztőt.')}</div>}
        </div>
        {st.next && (
          <div>
            <div className="label">{t('Következő')}</div>
            <div className="todo-item"><b>{st.next.title}</b> <span className="pill">{st.next.time}</span>{st.next.temp && <span className="pill temp">{st.next.temp}</span>}</div>
          </div>
        )}
      </div>

      <div className="ferment-charts">
        <MiniChart
          title={t('Sűrűség (SG)')}
          points={sgPts}
          xMax={xMax}
          yMin={Math.min(st.targetFg, ...sgPts.map((p) => p.y)) - 0.004}
          yMax={Math.max(st.og, ...sgPts.map((p) => p.y)) + 0.004}
          yFmt={fmtSG}
          refLine={{ y: st.targetFg, label: t('cél FG') }}
          today={st.dayNow}
        />
        <MiniChart
          title={t('Hőfok (°C)')}
          points={tempPts}
          xMax={xMax}
          yMin={tMin}
          yMax={tMax}
          yFmt={(v) => `${fmt(v, Math.abs(v % 1) > 0.01 ? 1 : 0)} °C`}
          band={st.yeastRange ? { lo: st.yeastRange[0], hi: st.yeastRange[1], label: t('Az élesztő ajánlott tartománya') } : undefined}
          today={st.dayNow}
        />
      </div>

      <div className="reading-form">
        <label className="field"><span className="label">{t('Időpont')}</span><input type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} /></label>
        <div className="field"><span className="label">SG</span><OptNum value={sg} parse={parseGravity} suffix="SG" placeholder="1,012" onChange={setSg} ariaLabel="SG" /></div>
        <div className="field"><span className="label">{t('Hőfok')}</span><OptNum value={temp} suffix="°C" placeholder="19" onChange={setTemp} ariaLabel={t('Hőfok')} /></div>
        <label className="field grow"><span className="label">{t('Jegyzet')}</span><input className="input" value={note} placeholder={t('pl. hidegkomló bement, krausen leesett…')} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} /></label>
        <button className="btn primary" onClick={add} disabled={sg === undefined && temp === undefined && !note.trim()}>＋ {t('Mérés hozzáadása')}</button>
      </div>

      {st.readings.length > 0 && (
        <table className="data readings">
          <thead><tr><th>{t('Időpont')}</th><th className="r">{t('Nap')}</th><th className="r">SG</th><th className="r">°C</th><th>{t('Jegyzet')}</th><th /></tr></thead>
          <tbody>
            {[...st.readings].reverse().map((r) => (
              <tr key={r.id}>
                <td>{dateTimeStr(r.t)}</td>
                <td className="r muted">{fmt(dayOf(st.start, r.t), 1)}</td>
                <td className="r">{r.sg !== undefined ? fmtSG(r.sg) : '–'}</td>
                <td className="r">{r.temp !== undefined ? fmt(r.temp, 1) : '–'}</td>
                <td className="muted">{r.note ?? ''}</td>
                <td className="r"><button className="icon-btn" aria-label={t('Mérés törlése')} onClick={() => remove(r.id)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {st.last && session.measurements.fg !== st.last.sg && (
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn sm" onClick={() => onChange({ measurements: { ...session.measurements, fg: st.last!.sg } })}>
            {t('Utolsó mérés ({sg}) legyen az FG', { sg: fmtSG(st.last.sg) })}
          </button>
        </div>
      )}
    </div>
  );
}
