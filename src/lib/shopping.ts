import type { Recipe } from '../types';
import { getAdjunct, getHop, getMalt, hoplineSearchUrl } from './catalog';
import { SALT_INFO, saltName } from './water';
import { t, dec } from '../i18n';
import { adjName, hopName, maltName } from './names';
import { yeastPitch } from './plan';
import type { Stats } from './calc';

/** Felhasználói árak (felülírják a katalógus becslését). Kulcs pl. "malt:vik-pale". */
export type PriceOverrides = Record<string, number>;

export interface ShopLine {
  /** egyedi kulcs az ár felülírásához */
  key: string;
  /** csoport kulcs (magyar – megjelenítéskor t()) */
  group: string;
  name: string;
  need: string;
  buy: string;
  /** egységár (Ft) és mértékegysége */
  unitPrice: number;
  defaultUnitPrice: number;
  unitLabel: string;
  overridden: boolean;
  /** vásárlási költség (egész csomagok) */
  cost: number;
  /** ténylegesen felhasznált mennyiség költsége */
  usedCost: number;
  url?: string;
  external?: boolean;
}

/** Vízkezelő sók és tejsav becsült kiszerelése / ára */
const SALT_PACK = { g: 250, price: 900 };
const LACTIC_PACK = { ml: 100, price: 1200 };

/** Komló kiszerelések: 30/50/100 g – a legolcsóbb lefedő kombináció */
function hopPacks(g: number, price100: number) {
  const packs = [
    { g: 100, p: price100 },
    { g: 50, p: price100 * 0.55 },
    { g: 30, p: price100 * 0.36 },
  ];
  let best = { cost: Infinity, combo: [] as number[] };
  for (let a = 0; a <= Math.ceil(g / 100); a++)
    for (let b = 0; b <= 2; b++)
      for (let c = 0; c <= 2; c++) {
        const total = a * 100 + b * 50 + c * 30;
        if (total < g) continue;
        const cost = a * packs[0].p + b * packs[1].p + c * packs[2].p;
        if (cost < best.cost) best = { cost, combo: [a, b, c] };
      }
  const [a, b, c] = best.combo;
  const parts = [a && `${a}×100 g`, b && `${b}×50 g`, c && `${c}×30 g`].filter(Boolean).join(' + ');
  return { cost: best.cost, label: parts };
}

const n0 = (x: number) => dec(x, x % 1 ? 1 : 0);

export function shoppingList(r: Recipe, s: Stats, overrides: PriceOverrides = {}) {
  const lines: ShopLine[] = [];
  const price = (key: string, def: number) => ({ unit: overrides[key] ?? def, def, over: key in overrides });

  // maláták összevonva
  const malts = new Map<string, number>();
  r.fermentables.forEach((f) => malts.set(f.id, (malts.get(f.id) ?? 0) + f.kg));
  for (const [id, kg] of malts) {
    const m = getMalt(id);
    if (!m || kg <= 0) continue;
    const key = `malt:${id}`;
    const p = price(key, m.priceHuf);
    const packs = Math.ceil(kg / m.packKg - 1e-6);
    const external = m.brand === 'Bolti';
    lines.push({
      key,
      group: 'Maláták & erjeszthetők',
      name: maltName(m),
      need: `${dec(kg, 2)} kg`,
      buy: m.packKg === 1 ? `${packs} kg` : `${packs} × ${n0(m.packKg)} kg`,
      unitPrice: p.unit, defaultUnitPrice: p.def, unitLabel: 'Ft/kg', overridden: p.over,
      cost: packs * m.packKg * p.unit,
      usedCost: kg * p.unit,
      url: external ? undefined : hoplineSearchUrl(m.name),
      external,
    });
  }

  const hops = new Map<string, number>();
  r.hops.forEach((h) => hops.set(h.id, (hops.get(h.id) ?? 0) + h.g));
  for (const [id, g] of hops) {
    const h = getHop(id);
    if (!h || g <= 0) continue;
    const key = `hop:${id}`;
    const p = price(key, h.price100);
    const pk = hopPacks(g, p.unit);
    lines.push({
      key, group: 'Komlók', name: hopName(h), need: `${n0(g)} g`, buy: pk.label,
      unitPrice: p.unit, defaultUnitPrice: p.def, unitLabel: 'Ft/100 g', overridden: p.over,
      cost: pk.cost, usedCost: (g / 100) * p.unit,
      url: hoplineSearchUrl(h.name),
    });
  }

  const pitch = yeastPitch(r, s);
  if (pitch) {
    const key = `yeast:${pitch.yeast.id}`;
    const p = price(key, pitch.yeast.priceHuf);
    lines.push({
      key, group: 'Élesztő', name: `${pitch.yeast.brand} ${pitch.yeast.name}`,
      need: t('{n} csomag', { n: pitch.packs }), buy: `${pitch.packs} × ${n0(pitch.yeast.packG)} g`,
      unitPrice: p.unit, defaultUnitPrice: p.def, unitLabel: t('Ft/csomag'), overridden: p.over,
      cost: pitch.packs * p.unit, usedCost: pitch.packs * p.unit,
      url: hoplineSearchUrl(pitch.yeast.name),
    });
  }

  const adj = new Map<string, number>();
  r.adjuncts.forEach((a) => adj.set(a.id, (adj.get(a.id) ?? 0) + a.amount));
  for (const [id, amt] of adj) {
    const a = getAdjunct(id);
    if (!a || amt <= 0) continue;
    const key = `adj:${id}`;
    const p = price(key, a.priceHuf);
    const packs = Math.ceil(amt / a.packAmount - 1e-6);
    const per = a.packAmount === 1 ? t(a.unit) : `${a.packAmount} ${t(a.unit)}`;
    lines.push({
      key, group: 'Ízesítők & adalékok', name: adjName(a),
      need: `${n0(amt)} ${t(a.unit)}`,
      buy: a.packAmount === 1 ? `${packs} ${t(a.unit)}` : `${packs} × ${a.packAmount} ${t(a.unit)}`,
      unitPrice: p.unit, defaultUnitPrice: p.def, unitLabel: `Ft/${per}`, overridden: p.over,
      cost: packs * p.unit, usedCost: (amt / a.packAmount) * p.unit,
      url: a.external ? undefined : hoplineSearchUrl(a.name),
      external: a.external,
    });
  }

  const salts = r.water.salts;
  for (const [k, info] of Object.entries(SALT_INFO) as [keyof typeof SALT_INFO, (typeof SALT_INFO)[keyof typeof SALT_INFO]][]) {
    if (salts[k] <= 0) continue;
    const key = `salt:${k}`;
    const p = price(key, SALT_PACK.price);
    lines.push({
      key, group: 'Vízkezelés', name: saltName(k), need: `${n0(salts[k])} g`, buy: `1 × ${SALT_PACK.g} g`,
      unitPrice: p.unit, defaultUnitPrice: p.def, unitLabel: `Ft/${SALT_PACK.g} g`, overridden: p.over,
      cost: p.unit, usedCost: (salts[k] / SALT_PACK.g) * p.unit,
      url: hoplineSearchUrl(info.name.split(' (')[0]),
    });
  }
  if (salts.lactic > 0) {
    const key = 'salt:lactic';
    const p = price(key, LACTIC_PACK.price);
    lines.push({
      key, group: 'Vízkezelés', name: t('Tejsav 80%'), need: `${n0(salts.lactic)} ml`, buy: `1 × ${LACTIC_PACK.ml} ml`,
      unitPrice: p.unit, defaultUnitPrice: p.def, unitLabel: `Ft/${LACTIC_PACK.ml} ml`, overridden: p.over,
      cost: p.unit, usedCost: (salts.lactic / LACTIC_PACK.ml) * p.unit,
      url: hoplineSearchUrl('tejsav'),
    });
  }

  const total = lines.reduce((a, l) => a + l.cost, 0);
  const usedTotal = lines.reduce((a, l) => a + l.usedCost, 0);
  const hoplineTotal = lines.filter((l) => !l.external).reduce((a, l) => a + l.cost, 0);
  return { lines, total, usedTotal, hoplineTotal };
}

// ---- Felhasználói árak tárolása ----
const PRICE_KEY = 'sorlabor.prices.v1';
export function loadPriceOverrides(): PriceOverrides {
  try {
    return JSON.parse(localStorage.getItem(PRICE_KEY) ?? '{}');
  } catch {
    return {};
  }
}
export function savePriceOverrides(p: PriceOverrides) {
  try {
    localStorage.setItem(PRICE_KEY, JSON.stringify(p));
  } catch {
    /* nem elérhető */
  }
}
