import type { Adjunct, BeerStyle, Hop, Malt, Yeast } from '../types';
import type { Preset } from '../data/presets';
import { getLang, t, td } from '../i18n';

export const maltName = (m: Malt) => td('malts', m.id, 'name', m.name);
export const maltDesc = (m: Malt) => td('malts', m.id, 'desc', m.desc);
export const hopName = (h: Hop) => td('hops', h.id, 'name', h.name);
export const hopDesc = (h: Hop) => td('hops', h.id, 'desc', h.desc);
export const hopOrigin = (h: Hop) => t(h.origin);
export const hopDescriptors = (h: Hop) => h.descriptors.map((d) => t(d));
export const yeastName = (y: Yeast) => y.name;
export const yeastDesc = (y: Yeast) => td('yeasts', y.id, 'desc', y.desc);
export const adjName = (a: Adjunct) => td('adjuncts', a.id, 'name', a.name);
export const adjDesc = (a: Adjunct) => td('adjuncts', a.id, 'desc', a.desc);
export const brandName = (b: string) => (b === 'Bolti' ? t('Bolti') : b);

/** Stílusnév: magyarul a magyar név, angolul a BJCP név, németül a német fordítás (ha van). */
export const styleName = (s: BeerStyle) =>
  getLang() === 'hu' ? s.nameHu : td('styles', s.id, 'name', s.name);
export const styleDesc = (s: BeerStyle) => td('styles', s.id, 'desc', s.desc);
export const styleGroup = (s: BeerStyle | string) => t(typeof s === 'string' ? s : s.group);

export const presetName = (p: Preset) => td('presets', p.id, 'name', p.name);
export const presetDesc = (p: Preset) => td('presets', p.id, 'desc', p.desc);
export const levelName = (l: Preset['level']) => t(l);
