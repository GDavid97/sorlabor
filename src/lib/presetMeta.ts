import type { Preset } from '../data/presets';
import { getAdjunct, getStyle } from './catalog';

export type Family = 'lager' | 'hoppy' | 'wheat' | 'dark' | 'belgian' | 'ale';

/** Magyar kulcsok – megjelenítéskor t() */
export const FAMILY_LABEL: Record<Family, string> = {
  lager: 'Lagerek',
  hoppy: 'IPA & pale ale',
  wheat: 'Búzasörök',
  dark: 'Sötét sörök',
  belgian: 'Belga & farmház',
  ale: 'Angol & amber ale',
};

export function presetFamily(p: Preset): Family {
  const st = getStyle(p.styleId);
  const g = st?.group ?? '';
  if (g === 'Stoutok & porterek' || p.styleId === '8B' || p.styleId === '20B') return 'dark';
  if (g === 'Világos lagerek' || g === 'Borostyán & sötét lagerek') return 'lager';
  if (g === 'Búzasörök') return 'wheat';
  if (g === 'Belga sörök') return 'belgian';
  if (g === 'IPA' || p.styleId === '18B' || p.styleId === '18A') return 'hoppy';
  return 'ale';
}

/** Ízesített-e (fűszer, kávé, kakaó, tölgy, gyümölcs, méz, laktóz, vanília…) */
export function isFlavored(p: Preset): boolean {
  const flavorAdj = (p.adjuncts ?? []).some(([id]) => {
    const a = getAdjunct(id);
    return !!a && ['spice', 'coffee', 'oak', 'fruit'].includes(a.category);
  });
  const flavorMalt = p.malts.some(([id]) => ['sugar-honey', 'sugar-lactose', 'sugar-candi-dark'].includes(id));
  return flavorAdj || flavorMalt;
}

/** Kiemelt receptek (landing, galéria eleje) */
export const FEATURED = ['p-apa', 'p-neipa', 'p-pils', 'p-weizen', 'p-stout', 'p-mocha', 'p-milkshake', 'p-cherrystout'];
