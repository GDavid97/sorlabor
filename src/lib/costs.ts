import type { Recipe } from '../types';
import type { Stats } from './calc';

/** Rezsi- és egyéb költség beállítások (globális, minden receptre érvényes). */
export interface CostSettings {
  /** Ft/kWh (gáznál is megadható egyenértékes ár) */
  energyPrice: number;
  /** a főzőüst fűtőteljesítménye kW */
  heaterKw: number;
  /** víz + csatorna Ft/m³ */
  waterPrice: number;
  /** hűtésre, takarításra használt víz literben (főzésenként) */
  extraWaterL: number;
  packaging: 'bottle' | 'keg';
  /** kupak ára Ft/db */
  capPrice: number;
  /** fertőtlenítő / tisztítószer főzésenként */
  sanitizer: number;
  /** szállítási díj és ingyenes szállítás határa */
  shipping: number;
  freeShippingFrom: number;
  /** bolti kézműves sör ára 0,5 l-re (összehasonlításhoz) */
  refBeerPrice: number;
}

export const DEFAULT_COSTS: CostSettings = {
  energyPrice: 45,
  heaterKw: 2.5,
  waterPrice: 1000,
  extraWaterL: 60,
  packaging: 'bottle',
  capPrice: 15,
  sanitizer: 250,
  shipping: 1990,
  freeShippingFrom: 25000,
  refBeerPrice: 990,
};

const KEY = 'sorlabor.costs.v1';
export function loadCosts(): CostSettings {
  try {
    return { ...DEFAULT_COSTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { ...DEFAULT_COSTS };
  }
}
export function saveCosts(c: CostSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* nem elérhető */
  }
}

/**
 * Energiaigény becslése (kWh):
 * víz felfűtése a cefrézéshez, felfűtés forrásig, cefrepihenők tartása, forralás.
 */
export function energyKwh(r: Recipe, s: Stats, c: CostSettings) {
  const cp = 4.186 / 3600; // kWh / (L·°C)
  const eff = 0.85;
  const v = s.volumes;
  const startT = 15;
  let heat = 0;
  let hold = 0;
  if (r.method === 'extract') {
    heat = (v.preBoilL * cp * (100 - startT)) / eff;
    hold = c.heaterKw * 0.5 * 0.15; // áztatás ~30 perc
  } else {
    const strike = r.mashTemp + 4;
    heat = (v.totalWaterL * cp * (strike - startT) + v.preBoilL * cp * (100 - r.mashTemp)) / eff;
    hold = c.heaterKw * (75 / 60) * 0.15; // ~75 perc cefre, kb. 15% kitöltési tényezővel
  }
  const boil = c.heaterKw * (r.boilMin / 60) * 0.8;
  return heat + hold + boil;
}

export interface OverheadItem {
  /** magyar kulcs – megjelenítéskor t() */
  label: string;
  detail: string;
  cost: number;
}

export function overheads(r: Recipe, s: Stats, c: CostSettings, fmt: (n: number, d?: number) => string): OverheadItem[] {
  const kwh = energyKwh(r, s, c);
  const waterL = s.volumes.totalWaterL + c.extraWaterL;
  const bottles = Math.ceil(s.volumes.packagedL / 0.5);
  const items: OverheadItem[] = [
    { label: 'Energia', detail: `≈ ${fmt(kwh, 1)} kWh × ${fmt(c.energyPrice, 0)} Ft`, cost: kwh * c.energyPrice },
    { label: 'Víz', detail: `${fmt(waterL, 0)} L × ${fmt(c.waterPrice, 0)} Ft/m³`, cost: (waterL / 1000) * c.waterPrice },
    { label: 'Fertőtlenítő, tisztítószer', detail: '', cost: c.sanitizer },
  ];
  if (c.packaging === 'bottle') items.push({ label: 'Kupak', detail: `${bottles} × ${fmt(c.capPrice, 0)} Ft`, cost: bottles * c.capPrice });
  return items;
}

export function shippingCost(purchase: number, c: CostSettings) {
  return c.shipping > 0 && (c.freeShippingFrom <= 0 || purchase < c.freeShippingFrom) ? c.shipping : 0;
}
