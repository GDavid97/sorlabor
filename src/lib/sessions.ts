import type { BrewMethod, BrewSession, CalibrationProfile, Recipe } from '../types';
import { computeStats } from './calc';
import { uid } from './catalog';

const SESSIONS_KEY = 'sorlabor.sessions.v1';
const CALIB_KEY = 'sorlabor.calibration.v1';

function safeGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, v: string) {
  try {
    localStorage.setItem(key, v);
  } catch {
    /* nem elérhető */
  }
}

export function loadSessions(): BrewSession[] {
  try {
    return JSON.parse(safeGet(SESSIONS_KEY) ?? '[]');
  } catch {
    return [];
  }
}
export const saveSessions = (s: BrewSession[]) => safeSet(SESSIONS_KEY, JSON.stringify(s));

export function newSession(r: Recipe): BrewSession {
  const s = computeStats(r);
  return {
    id: uid(),
    recipeId: r.id,
    recipeName: r.name,
    recipe: JSON.parse(JSON.stringify(r)),
    predicted: {
      og: s.og,
      fg: s.fg,
      preBoilSG: 1 + ((s.og - 1) * s.volumes.postBoilL) / s.volumes.preBoilL,
      efficiency: r.efficiency,
      attenuation: s.attenuation,
    },
    startedAt: Date.now(),
    status: 'brewing',
    stepIndex: 0,
    doneSteps: [],
    firedAlerts: [],
    timer: null,
    measurements: {},
    notes: '',
  };
}

/** Sűrűség normalizálása: 1050 → 1.050, 12.5 (°P) → SG, 1.05 → 1.050 */
export function parseGravity(v: number): number | undefined {
  if (!Number.isFinite(v) || v <= 0) return undefined;
  if (v > 900) return v / 1000; // 1050
  if (v >= 0.98 && v < 1.2) return v; // SG
  if (v < 40) return 1 + v / (258.6 - (v / 258.2) * 227.1); // °Plato
  return undefined;
}

const PTS = 385.6;

/** Mért értékekből számolt mutatók egy főzésre */
export function sessionMetrics(sess: BrewSession) {
  const r = sess.recipe;
  const st = computeStats(r);
  const m = sess.measurements;
  let grainPot = 0;
  let fixedPts = 0;
  let extractPts = 0;
  for (const f of st.fermentables) {
    const p = (f.malt.yield / 100) * PTS * f.kg;
    if (f.malt.category === 'extract') {
      fixedPts += p;
      extractPts += p;
    } else if (f.malt.category === 'sugar') fixedPts += p;
    else grainPot += p;
  }
  const brewhouseEff =
    m.og && m.batchL && grainPot > 0 ? (((m.og - 1) * 1000 * m.batchL - fixedPts) / grainPot) * 100 : undefined;
  const mashEff =
    m.preBoilSG && m.preBoilL && grainPot > 0
      ? (((m.preBoilSG - 1) * 1000 * m.preBoilL - (r.method === 'extract' ? extractPts : 0)) / grainPot) * 100
      : undefined;
  const boilOffLph = m.preBoilL && m.postBoilL && r.boilMin > 0 ? (m.preBoilL - m.postBoilL) / (r.boilMin / 60) : undefined;
  const kettleLossL = m.postBoilL && m.batchL ? m.postBoilL - m.batchL : undefined;
  const attenuation = m.og && m.fg ? ((m.og - m.fg) / (m.og - 1)) * 100 : undefined;
  const abv = m.og && m.fg ? (m.og - m.fg) * 131.25 : undefined;
  return { brewhouseEff, mashEff, boilOffLph, kettleLossL, attenuation, abv, predicted: sess.predicted, stats: st };
}

const avg = (xs: (number | undefined)[]) => {
  const v = xs.filter((x): x is number => x !== undefined && Number.isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined;
};

/** Az utolsó 5 főzés átlaga módszerenként */
export function calibrationFrom(sessions: BrewSession[], method: BrewMethod): CalibrationProfile {
  const recent = sessions
    .filter((s) => s.recipe.method === method)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 5)
    .map(sessionMetrics);
  const eff = avg(recent.map((m) => m.brewhouseEff));
  const boil = avg(recent.map((m) => m.boilOffLph));
  const kettle = avg(recent.map((m) => m.kettleLossL));
  const n = recent.filter((m) => m.brewhouseEff !== undefined || m.boilOffLph !== undefined || m.kettleLossL !== undefined).length;
  const r1 = (x?: number) => (x === undefined ? undefined : Math.round(x * 10) / 10);
  return {
    efficiency: eff === undefined ? undefined : Math.round(Math.max(30, Math.min(95, eff))),
    boilOffLph: boil === undefined ? undefined : r1(Math.max(0, boil)),
    kettleLossL: kettle === undefined ? undefined : r1(Math.max(0, kettle)),
    n,
    updatedAt: Date.now(),
  };
}

/** Élesztőnkénti mért látszólagos erjedési fok */
export function yeastAttenuationStats(sessions: BrewSession[]) {
  const map = new Map<string, number[]>();
  for (const s of sessions) {
    const m = sessionMetrics(s);
    if (m.attenuation === undefined || !s.recipe.yeastId) continue;
    map.set(s.recipe.yeastId, [...(map.get(s.recipe.yeastId) ?? []), m.attenuation]);
  }
  return map;
}

// ---- Alapértelmezett (kalibrált) berendezés profil új receptekhez ----

export type SavedDefaults = Partial<Record<BrewMethod, CalibrationProfile>>;

export function loadDefaults(): SavedDefaults {
  try {
    return JSON.parse(safeGet(CALIB_KEY) ?? '{}');
  } catch {
    return {};
  }
}
export function saveDefault(method: BrewMethod, p: CalibrationProfile | null) {
  const d = loadDefaults();
  if (p) d[method] = p;
  else delete d[method];
  safeSet(CALIB_KEY, JSON.stringify(d));
}

/** Kalibrált értékek alkalmazása egy receptre */
export function applyCalibration(r: Recipe, p: CalibrationProfile): Recipe {
  return {
    ...r,
    efficiency: p.efficiency ?? r.efficiency,
    equipment: {
      ...r.equipment,
      boilOffLph: p.boilOffLph ?? r.equipment.boilOffLph,
      kettleLossL: p.kettleLossL ?? r.equipment.kettleLossL,
    },
  };
}
