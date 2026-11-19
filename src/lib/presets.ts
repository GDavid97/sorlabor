import type { Recipe } from '../types';
import type { Preset } from '../data/presets';
import { uid } from './catalog';
import { newRecipe } from './storage';
import { t } from '../i18n';
import { presetDesc, presetName } from './names';

/** Beépített receptből szerkeszthető, új recept (saját azonosítóval, kalibrált berendezéssel). */
export function recipeFromPreset(p: Preset): Recipe {
  const base = newRecipe(p.method ?? 'biab');
  return {
    ...base,
    name: presetName(p),
    styleId: p.styleId,
    mashTemp: p.mashTemp,
    boilMin: p.boilMin ?? 60,
    fermentables: p.malts.map(([id, kg]) => ({ uid: uid(), id, kg })),
    hops: p.hops.map(([id, g, use, time]) => ({ uid: uid(), id, g, use, time })),
    yeastId: p.yeast,
    adjuncts: (p.adjuncts ?? []).map(([id, amount, use, time]) => ({ uid: uid(), id, amount, use, time })),
    water: {
      ...base.water,
      targetId: p.water?.targetId ?? base.water.targetId,
      sourceId: p.water?.sourceId ?? base.water.sourceId,
      salts: { ...base.water.salts, ...(p.water?.salts ?? {}) },
    },
    carbVols: p.carbVols ?? null,
    notes: `${t('Beépített recept: {name}.', { name: presetName(p) })}\n${presetDesc(p)}`,
    updatedAt: Date.now(),
  };
}
