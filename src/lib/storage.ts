import type { BrewMethod, Recipe } from '../types';
import { EQUIPMENT_DEFAULTS } from '../data/water';
import { getAdjunct, getHop, getMalt, getStyle, getYeast, uid } from './catalog';
import type { Stats } from './calc';
import { applyCalibration, loadDefaults } from './sessions';
import { t, brand } from '../i18n';

const CURRENT_KEY = 'sorlabor.current.v1';
const LIBRARY_KEY = 'sorlabor.library.v1';

export function newRecipe(method: BrewMethod = 'biab'): Recipe {
  const cal = loadDefaults()[method];
  const base = baseRecipe(method);
  return cal ? applyCalibration(base, cal) : base;
}

function baseRecipe(method: BrewMethod): Recipe {
  const d = EQUIPMENT_DEFAULTS[method];
  return {
    id: uid(),
    name: t('Új sör'),
    styleId: null,
    batchL: 20,
    method,
    efficiency: d.efficiency,
    boilMin: 60,
    mashTemp: 66,
    equipment: { ...d.equipment },
    fermentables: [],
    hops: [],
    yeastId: null,
    adjuncts: [],
    water: {
      sourceId: 'budapest',
      custom: { ca: 50, mg: 10, na: 10, so4: 50, cl: 30, hco3: 150 },
      targetId: 'balanced',
      salts: { gypsum: 0, cacl2: 0, epsom: 0, nacl: 0, bicarb: 0, lactic: 0 },
    },
    carbVols: null,
    notes: '',
    updatedAt: Date.now(),
  };
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, val: string) {
  try {
    localStorage.setItem(key, val);
  } catch {
    /* tárhely nem elérhető */
  }
}

/** Hiányzó mezők pótlása régebbi / importált recepteknél */
export function normalize(r: Partial<Recipe>): Recipe {
  const base = baseRecipe(r.method ?? 'biab');
  return {
    ...base,
    ...r,
    equipment: { ...base.equipment, ...(r.equipment ?? {}) },
    water: {
      ...base.water,
      ...(r.water ?? {}),
      salts: { ...base.water.salts, ...(r.water?.salts ?? {}) },
      custom: { ...base.water.custom, ...(r.water?.custom ?? {}) },
    },
    fermentables: (r.fermentables ?? []).filter((f) => getMalt(f.id)),
    hops: (r.hops ?? []).filter((h) => getHop(h.id)),
    adjuncts: (r.adjuncts ?? []).filter((a) => getAdjunct(a.id)),
  } as Recipe;
}

export function loadCurrent(): Recipe | null {
  const raw = safeGet(CURRENT_KEY);
  if (!raw) return null;
  try {
    return normalize(JSON.parse(raw));
  } catch {
    return null;
  }
}
export const saveCurrent = (r: Recipe) => safeSet(CURRENT_KEY, JSON.stringify(r));

export function loadLibrary(): Recipe[] {
  const raw = safeGet(LIBRARY_KEY);
  if (!raw) return [];
  try {
    return (JSON.parse(raw) as Partial<Recipe>[]).map(normalize);
  } catch {
    return [];
  }
}
export const saveLibrary = (list: Recipe[]) => safeSet(LIBRARY_KEY, JSON.stringify(list));

export function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const fileSafe = (s: string) => s.replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim().replace(/\s+/g, '_') || 'recept';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** BeerXML 1.0 export (BeerSmith, Brewfather, Brewer's Friend importálja) */
export function toBeerXml(r: Recipe, s: Stats): string {
  const style = getStyle(r.styleId);
  const yeast = getYeast(r.yeastId);
  const typeMap: Record<string, string> = { extract: 'Extract', sugar: 'Sugar', flaked: 'Adjunct' };
  const ferm = r.fermentables
    .map((f) => {
      const m = getMalt(f.id)!;
      return `      <FERMENTABLE><NAME>${esc(m.name)}</NAME><VERSION>1</VERSION><TYPE>${typeMap[m.category] ?? 'Grain'}</TYPE><AMOUNT>${f.kg}</AMOUNT><YIELD>${m.yield}</YIELD><COLOR>${(m.ebc / 1.97).toFixed(1)}</COLOR><SUPPLIER>${esc(m.brand)}</SUPPLIER></FERMENTABLE>`;
    })
    .join('\n');
  const useMap = { boil: 'Boil', fwh: 'First Wort', whirlpool: 'Aroma', dry: 'Dry Hop' } as const;
  const hops = r.hops
    .map((h) => {
      const hop = getHop(h.id)!;
      const time = h.use === 'dry' ? h.time * 1440 : h.use === 'fwh' ? r.boilMin : h.time;
      return `      <HOP><NAME>${esc(hop.name)}</NAME><VERSION>1</VERSION><ALPHA>${hop.alpha}</ALPHA><AMOUNT>${h.g / 1000}</AMOUNT><USE>${useMap[h.use]}</USE><TIME>${time}</TIME><FORM>Pellet</FORM></HOP>`;
    })
    .join('\n');
  const miscs = r.adjuncts
    .map((a) => {
      const adj = getAdjunct(a.id)!;
      const use = a.use === 'secondary' ? 'Secondary' : a.use === 'mash' ? 'Mash' : 'Boil';
      const type = adj.category === 'fining' ? 'Fining' : adj.category === 'spice' ? 'Spice' : 'Flavor';
      const amt = adj.unit === 'g' ? a.amount / 1000 : a.amount;
      return `      <MISC><NAME>${esc(adj.name)}</NAME><VERSION>1</VERSION><TYPE>${type}</TYPE><USE>${use}</USE><TIME>${a.use === 'secondary' ? a.time * 1440 : a.time}</TIME><AMOUNT>${amt}</AMOUNT><AMOUNT_IS_WEIGHT>${adj.unit === 'g'}</AMOUNT_IS_WEIGHT></MISC>`;
    })
    .join('\n');
  const y = yeast
    ? `      <YEAST><NAME>${esc(yeast.name)}</NAME><VERSION>1</VERSION><TYPE>${yeast.kind === 'lager' ? 'Lager' : yeast.kind === 'wheat' ? 'Wheat' : 'Ale'}</TYPE><FORM>Dry</FORM><AMOUNT>${yeast.packG / 1000}</AMOUNT><AMOUNT_IS_WEIGHT>true</AMOUNT_IS_WEIGHT><LABORATORY>${esc(yeast.brand)}</LABORATORY><ATTENUATION>${(yeast.attenuation[0] + yeast.attenuation[1]) / 2}</ATTENUATION><MIN_TEMPERATURE>${yeast.temp[0]}</MIN_TEMPERATURE><MAX_TEMPERATURE>${yeast.temp[1]}</MAX_TEMPERATURE></YEAST>`
    : '';
  const st = style
    ? `    <STYLE><NAME>${esc(style.name)}</NAME><VERSION>1</VERSION><CATEGORY>${esc(style.group)}</CATEGORY><CATEGORY_NUMBER>${style.code.replace(/\D/g, '')}</CATEGORY_NUMBER><STYLE_LETTER>${style.code.replace(/\d/g, '')}</STYLE_LETTER><STYLE_GUIDE>BJCP 2021</STYLE_GUIDE><TYPE>${style.yeast.includes('lager') ? 'Lager' : 'Ale'}</TYPE><OG_MIN>${style.og[0]}</OG_MIN><OG_MAX>${style.og[1]}</OG_MAX><FG_MIN>${style.fg[0]}</FG_MIN><FG_MAX>${style.fg[1]}</FG_MAX><IBU_MIN>${style.ibu[0]}</IBU_MIN><IBU_MAX>${style.ibu[1]}</IBU_MAX><COLOR_MIN>${style.srm[0]}</COLOR_MIN><COLOR_MAX>${style.srm[1]}</COLOR_MAX></STYLE>`
    : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<RECIPES>
  <RECIPE>
    <NAME>${esc(r.name)}</NAME>
    <VERSION>1</VERSION>
    <TYPE>${r.method === 'extract' ? 'Extract' : 'All Grain'}</TYPE>
    <BREWER>${esc(brand().name)}</BREWER>
    <BATCH_SIZE>${r.batchL}</BATCH_SIZE>
    <BOIL_SIZE>${s.volumes.preBoilL.toFixed(1)}</BOIL_SIZE>
    <BOIL_TIME>${r.boilMin}</BOIL_TIME>
    <EFFICIENCY>${r.efficiency}</EFFICIENCY>
    <OG>${s.og.toFixed(3)}</OG>
    <FG>${s.fg.toFixed(3)}</FG>
    <NOTES>${esc(r.notes)}</NOTES>
${st}
    <FERMENTABLES>
${ferm}
    </FERMENTABLES>
    <HOPS>
${hops}
    </HOPS>
    <YEASTS>
${y}
    </YEASTS>
    <MISCS>
${miscs}
    </MISCS>
  </RECIPE>
</RECIPES>
`;
}
