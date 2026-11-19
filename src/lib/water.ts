import type { Recipe, Salts, WaterProfile } from '../types';
import { SOURCE_WATERS, TARGET_WATERS } from '../data/water';
import type { Stats } from './calc';
import { t } from '../i18n';

/** ppm, ha 1 g sót 1 L vízben oldunk */
export const SALT_INFO: Record<Exclude<keyof Salts, 'lactic'>, { name: string; ions: Partial<WaterProfile> }> = {
  gypsum: { name: 'Gipsz (CaSO₄)', ions: { ca: 232.8, so4: 557.7 } },
  cacl2: { name: 'Kalcium-klorid (CaCl₂)', ions: { ca: 272.6, cl: 482.3 } },
  epsom: { name: 'Keserűsó (MgSO₄)', ions: { mg: 98.6, so4: 389.6 } },
  nacl: { name: 'Konyhasó (NaCl)', ions: { na: 393.4, cl: 606.6 } },
  bicarb: { name: 'Szódabikarbóna (NaHCO₃)', ions: { na: 273.7, hco3: 726.4 } },
};

export const saltName = (k: keyof typeof SALT_INFO) => t(SALT_INFO[k].name);

/** 1 ml 80%-os tejsav ≈ 10,6 mEq */
const LACTIC_MEQ_PER_ML = 10.6;

export function sourceProfile(r: Recipe): WaterProfile {
  if (r.water.sourceId === 'custom') return r.water.custom;
  return SOURCE_WATERS.find((w) => w.id === r.water.sourceId) ?? SOURCE_WATERS[0];
}

export function targetProfile(r: Recipe) {
  return TARGET_WATERS.find((w) => w.id === r.water.targetId) ?? TARGET_WATERS[1];
}

/** Alapértelmezett célprofil a stílus/szín/keserűség alapján */
export function suggestTargetId(s: Stats, styleId: string | null): string {
  if (styleId && ['3B', '5D', '4A'].includes(styleId)) return 'pilsen';
  if (styleId === '21C') return 'neipa';
  if (styleId?.startsWith('2') && s.buGu > 0.7) return 'hoppy';
  if (s.ebc > 50) return 'dark';
  if (s.buGu > 0.75) return 'hoppy';
  if (s.buGu < 0.45) return 'malty';
  return 'balanced';
}

export function waterResult(r: Recipe, s: Stats) {
  const src = sourceProfile(r);
  const L = Math.max(1, s.volumes.totalWaterL);
  const out: WaterProfile = { ...src };
  for (const [k, info] of Object.entries(SALT_INFO) as [keyof typeof SALT_INFO, (typeof SALT_INFO)[keyof typeof SALT_INFO]][]) {
    const g = r.water.salts[k];
    for (const [ion, ppm] of Object.entries(info.ions) as [keyof WaterProfile, number][]) out[ion] += (ppm * g) / L;
  }
  // Tejsav a lúgosságot csökkenti
  const alkMeqL = (out.hco3 / 61) - (r.water.salts.lactic * LACTIC_MEQ_PER_ML) / L;
  out.hco3 = Math.max(0, alkMeqL * 61);

  const alkCaCO3 = alkMeqL * 50; // lehet negatív
  const ra = alkCaCO3 - out.ca / 3.5 - out.mg / 7;
  const ratio = out.cl > 0 ? out.so4 / out.cl : out.so4 > 0 ? 99 : 0;

  // Desztillált vizes cefre pH a gabonaszámla alapján (súlyozott becslés)
  let phDi = 5.75;
  if (s.fermentables.length) {
    let wsum = 0;
    let acc = 0;
    for (const f of s.fermentables) {
      const m = f.malt;
      if (m.category === 'extract' || m.category === 'sugar') continue;
      const lov = m.ebc / 2.65;
      let ph = 5.75;
      if (m.tags?.includes('acid')) ph = 3.5;
      else if (m.category === 'base') ph = 5.75 - 0.004 * m.ebc;
      else if (m.category === 'flaked') ph = 5.9;
      else if (m.category === 'caramel') ph = 5.22 - 0.00504 * lov;
      else if (m.category === 'roasted') ph = 4.7;
      else if (m.category === 'special') ph = 5.5 - 0.002 * m.ebc;
      acc += ph * f.kg;
      wsum += f.kg;
    }
    if (wsum > 0) phDi = acc / wsum;
  }
  const thickness = s.volumes.grainKg > 0 ? s.volumes.mashWaterL / s.volumes.grainKg : 3;
  const k = 0.0018 * Math.sqrt(thickness / 3);
  const mashPh = phDi + ra * k;
  // tejsav javaslat 5,4-re
  let lacticSuggest = 0;
  if (mashPh > 5.45) {
    const dRa = (mashPh - 5.4) / k; // ppm CaCO3
    lacticSuggest = ((dRa / 50) * L) / LACTIC_MEQ_PER_ML + r.water.salts.lactic;
  }
  return { src, out, ra, ratio, mashPh, phDi, lacticSuggest, L };
}

/** Gipsz + CaCl2 javaslat a célprofil SO4/Cl értékeihez (egyszerű közelítés) */
export function suggestSalts(r: Recipe, s: Stats): Salts {
  const src = sourceProfile(r);
  const t = targetProfile(r);
  const L = Math.max(1, s.volumes.totalWaterL);
  const gypsum = Math.max(0, ((t.so4 - src.so4) * L) / 557.7);
  const cacl2 = Math.max(0, ((t.cl - src.cl) * L) / 482.3);
  const round = (x: number) => Math.round(x * 10) / 10;
  return { ...r.water.salts, gypsum: round(gypsum), cacl2: round(cacl2), epsom: 0, nacl: 0, bicarb: 0 };
}

export function ratioLabel(ratio: number) {
  if (ratio >= 3) return t('nagyon komlós / száraz-keserű');
  if (ratio >= 1.5) return t('komlós, ropogós');
  if (ratio >= 0.8) return t('kiegyensúlyozott');
  if (ratio >= 0.5) return t('malátás, kerek');
  return t('nagyon malátás / lágy-teltebb');
}
