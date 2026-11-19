import type { BrewSession, Reading } from '../types';
import { computeStats } from './calc';
import { getYeast } from './catalog';
import { fermentationPlan, type Step } from './plan';

const DAY = 86400000;

export type FermentState = 'empty' | 'active' | 'slow' | 'stuck' | 'done';

export interface FermentStatus {
  start: number;
  dayNow: number;
  og: number;
  targetFg: number;
  readings: Reading[];
  last?: Reading & { sg: number };
  attenuation?: number;
  abv?: number;
  /** 0–1: mennyit tett meg OG → cél FG úton */
  progress?: number;
  state: FermentState;
  tempWarn: 'low' | 'high' | null;
  yeastRange?: [number, number];
  plan: (Step & { days: [number, number] })[];
  current: (Step & { days: [number, number] })[];
  next?: Step & { days: [number, number] };
}

export const dayOf = (start: number, t: number) => (t - start) / DAY;

export function fermentStatus(sess: BrewSession, now = Date.now()): FermentStatus {
  const start = sess.pitchedAt ?? sess.startedAt;
  const og = sess.measurements.og ?? sess.predicted.og;
  const targetFg = sess.predicted.fg;
  const readings = [...(sess.readings ?? [])].sort((a, b) => a.t - b.t);
  const withSg = readings.filter((r): r is Reading & { sg: number } => typeof r.sg === 'number');
  const last = withSg[withSg.length - 1];
  const dayNow = Math.max(0, dayOf(start, now));

  let state: FermentState = 'empty';
  if (last) {
    // két, legalább ~2 nap különbséggel mért, (szinte) azonos érték = stabil
    const earlier = [...withSg].reverse().find((r) => last.t - r.t >= 1.7 * DAY);
    const stable = !!earlier && Math.abs(earlier.sg - last.sg) <= 0.001;
    if (stable && last.sg <= targetFg + 0.004) state = 'done';
    else if (stable) state = 'stuck';
    else {
      // lassú: az utolsó 3+ napban < 0,002 esés és még messze a cél
      const prev = [...withSg].reverse().find((r) => last.t - r.t >= 3 * DAY);
      state = prev && prev.sg - last.sg < 0.002 && last.sg > targetFg + 0.006 ? 'slow' : 'active';
    }
  }

  const y = getYeast(sess.recipe.yeastId);
  const lastTemp = [...readings].reverse().find((r) => typeof r.temp === 'number')?.temp;
  let tempWarn: FermentStatus['tempWarn'] = null;
  if (y && lastTemp !== undefined) {
    if (lastTemp < y.temp[0] - 1) tempWarn = 'low';
    else if (lastTemp > y.temp[1] + 1) tempWarn = 'high';
  }

  const plan = fermentationPlan(sess.recipe, computeStats(sess.recipe)).steps.filter(
    (s): s is Step & { days: [number, number] } => !!s.days,
  );
  const today = Math.floor(dayNow);
  const current = plan.filter((s) => s.days[0] <= today && today <= s.days[1]);
  const next = plan.filter((s) => s.days[0] > today).sort((a, b) => a.days[0] - b.days[0])[0];

  return {
    start,
    dayNow,
    og,
    targetFg,
    readings,
    last,
    attenuation: last ? ((og - last.sg) / (og - 1)) * 100 : undefined,
    abv: last ? (og - last.sg) * 131.25 : undefined,
    progress: last ? Math.max(0, Math.min(1, (og - last.sg) / Math.max(0.001, og - targetFg))) : undefined,
    state,
    tempWarn,
    yeastRange: y ? [y.temp[0], y.temp[1]] : undefined,
    plan,
    current,
    next,
  };
}
