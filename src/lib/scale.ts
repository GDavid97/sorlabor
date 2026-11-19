import type { Recipe } from '../types';

const SCALE_KEY = 'sorlabor.scaleBatch.v1';

/** Lebegőpontos zaj eltávolítása, de pontosság megtartása (a kijelzés kerekít). */
const clean = (x: number) => Math.round(x * 1e6) / 1e6;

/**
 * A recept átméretezése új batch-méretre: minden hozzávaló arányosan.
 * Az idők, hőfokok, hatásfok és a fix berendezés-veszteségek nem változnak;
 * az élesztő-csomagszám magától újraszámolódik.
 */
export function scaleRecipe(r: Recipe, newBatchL: number): Recipe {
  if (!(newBatchL > 0) || !(r.batchL > 0) || newBatchL === r.batchL) return { ...r, batchL: newBatchL };
  const f = newBatchL / r.batchL;
  const s = r.water.salts;
  return {
    ...r,
    batchL: newBatchL,
    fermentables: r.fermentables.map((x) => ({ ...x, kg: clean(x.kg * f) })),
    hops: r.hops.map((x) => ({ ...x, g: clean(x.g * f) })),
    adjuncts: r.adjuncts.map((x) => ({ ...x, amount: clean(x.amount * f) })),
    water: {
      ...r.water,
      salts: {
        gypsum: clean(s.gypsum * f),
        cacl2: clean(s.cacl2 * f),
        epsom: clean(s.epsom * f),
        nacl: clean(s.nacl * f),
        bicarb: clean(s.bicarb * f),
        lactic: clean(s.lactic * f),
      },
    },
  };
}

export function loadScalePref(): boolean {
  try {
    return localStorage.getItem(SCALE_KEY) !== '0';
  } catch {
    return true;
  }
}

export function saveScalePref(on: boolean) {
  try {
    localStorage.setItem(SCALE_KEY, on ? '1' : '0');
  } catch {
    /* nem elérhető */
  }
}
