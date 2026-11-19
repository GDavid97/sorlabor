import type { Recipe, FlavorAxis, Malt, Hop, HopLine } from '../types';
import { getMalt, getHop, getYeast, getAdjunct } from './catalog';
import { t, dec } from '../i18n';
import { maltName, yeastName } from './names';

/** Gravitációs pont / (kg · L) 100%-os kihozatalnál (szacharóz ≈ 46,2 PPG). */
const PTS_PER_KG_L = 385.6;

export const FLAVOR_AXES: { key: FlavorAxis; label: string; hint: string }[] = [
  { key: 'malty', label: 'Malátás', hint: 'kenyér, keksz, kenyérhéj' },
  { key: 'sweet', label: 'Édes / karamell', hint: 'karamell, toffee, maradék édesség' },
  { key: 'roast', label: 'Pörkölt', hint: 'kávé, csokoládé, égetett' },
  { key: 'fruit', label: 'Gyümölcsös', hint: 'citrus, trópusi, észterek, gyümölcs' },
  { key: 'hoppy', label: 'Komlós-gyantás', hint: 'fenyő, gyanta, virág, fű' },
  { key: 'spice', label: 'Fűszeres', hint: 'bors, szegfű, rozs, fűszerek' },
  { key: 'smoke', label: 'Füstös / fás', hint: 'füst, tölgy, vanília' },
  { key: 'bitter', label: 'Keserű', hint: 'IBU és keserű–édes egyensúly' },
  { key: 'body', label: 'Testesség', hint: 'FG, dextrinek, zab' },
];

export interface FermentableRow {
  uid: string;
  malt: Malt;
  kg: number;
  pct: number;
  pts: number; // OG-hoz adott gravitációs pont
}

export interface HopRow {
  line: HopLine;
  hop: Hop;
  ibu: number;
}

export interface Volumes {
  batchL: number;
  postBoilL: number;
  preBoilL: number;
  grainKg: number; // cefrézendő/áztatandó gabona
  absorbedL: number;
  totalWaterL: number;
  mashWaterL: number;
  spargeWaterL: number;
  packagedL: number;
}

export interface Stats {
  empty: boolean;
  og: number;
  fg: number;
  abv: number;
  ibu: number;
  srm: number;
  ebc: number;
  buGu: number;
  attenuation: number;
  plato: number;
  kcalPer500: number;
  totalKg: number;
  fermentables: FermentableRow[];
  hops: HopRow[];
  fruitPts: number;
  flavor: Record<FlavorAxis, number>;
  volumes: Volumes;
  tags: Set<string>;
  catPct: Record<string, number>;
  warnings: string[];
}

export const sgToPlato = (sg: number) => -616.868 + 1111.14 * sg - 630.272 * sg * sg + 135.997 * sg * sg * sg;

const sat = (raw: number, k = 5) => (raw <= 0 ? 0 : 10 * (1 - Math.exp(-raw / k)));
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Tinseth kihasználtság */
export function tinsethUtil(gravity: number, minutes: number) {
  const bigness = 1.65 * Math.pow(0.000125, gravity - 1);
  const time = (1 - Math.exp(-0.04 * minutes)) / 4.15;
  return bigness * time;
}

export function hopIbu(line: HopLine, hop: Hop, gravity: number, volumeL: number, boilMin: number) {
  let util = 0;
  if (line.use === 'boil') util = tinsethUtil(gravity, Math.min(line.time, boilMin));
  else if (line.use === 'fwh') util = tinsethUtil(gravity, boilMin) * 1.1;
  else if (line.use === 'whirlpool') util = tinsethUtil(gravity, Math.min(line.time, 40)) * 0.3;
  else util = 0;
  return (util * (hop.alpha / 100) * line.g * 1000) / volumeL;
}

/** Komló aroma súly a felhasználás módja szerint */
function aromaWeight(line: HopLine) {
  switch (line.use) {
    case 'dry': return 1.4;
    case 'whirlpool': return 1.0;
    case 'fwh': return 0.25;
    case 'boil':
      if (line.time <= 5) return 1.0;
      if (line.time <= 10) return 0.75;
      if (line.time <= 20) return 0.5;
      if (line.time <= 30) return 0.2;
      return 0.05;
  }
}

export function computeVolumes(r: Recipe, grainKg: number): Volumes {
  const eq = r.equipment;
  const postBoilL = r.batchL + eq.kettleLossL;
  const preBoilL = postBoilL + (eq.boilOffLph * r.boilMin) / 60;
  const absorbedL = grainKg * eq.absorptionLpkg;
  let mashWaterL = 0;
  let spargeWaterL = 0;
  let totalWaterL = preBoilL + absorbedL;
  if (r.method === 'biab') {
    mashWaterL = totalWaterL;
  } else if (r.method === 'classic') {
    mashWaterL = grainKg * eq.mashRatio;
    spargeWaterL = Math.max(0, totalWaterL - mashWaterL);
  } else {
    // kivonatos: áztató víz része a teljes forralt víznek
    mashWaterL = grainKg * eq.mashRatio;
    totalWaterL = preBoilL + absorbedL;
    spargeWaterL = Math.max(0, totalWaterL - mashWaterL);
  }
  return {
    batchL: r.batchL,
    postBoilL,
    preBoilL,
    grainKg,
    absorbedL,
    totalWaterL,
    mashWaterL,
    spargeWaterL,
    packagedL: Math.max(0, r.batchL - eq.fermenterLossL),
  };
}

export function computeStats(r: Recipe): Stats {
  const warnings: string[] = [];
  const tags = new Set<string>();
  const raw: Record<FlavorAxis, number> = {
    malty: 0, sweet: 0, roast: 0, fruit: 0, hoppy: 0, spice: 0, smoke: 0, bitter: 0, body: 0,
  };

  // ---- Erjeszthetők ----
  const lines = r.fermentables
    .map((l) => ({ l, malt: getMalt(l.id) }))
    .filter((x): x is { l: typeof x.l; malt: Malt } => !!x.malt && x.l.kg > 0);
  const totalKg = lines.reduce((s, x) => s + x.l.kg, 0);
  const eff = r.efficiency / 100;

  let fermPts = 0;
  let nonFermPts = 0;
  let mcu = 0;
  const catPct: Record<string, number> = {};
  const fermentables: FermentableRow[] = lines.map(({ l, malt }) => {
    const e = malt.category === 'extract' || malt.category === 'sugar' ? 1 : eff;
    const pts = ((malt.yield / 100) * PTS_PER_KG_L * l.kg * e) / r.batchL;
    if (malt.nonFermentable) nonFermPts += pts; else fermPts += pts;
    const lov = (malt.ebc / 1.97 + 0.76) / 1.3546;
    mcu += (l.kg * 2.20462 * lov) / (r.batchL * 0.264172);
    const pct = totalKg > 0 ? l.kg / totalKg : 0;
    catPct[malt.category] = (catPct[malt.category] ?? 0) + pct * 100;
    for (const [axis, v] of Object.entries(malt.flavor) as [FlavorAxis, number][]) raw[axis] += v * pct;
    malt.tags?.forEach((t) => tags.add(t));
    if (pct * 100 > malt.maxPct + 0.5) {
      warnings.push(t('{name}: {pct}% – ajánlott max. {max}%.', { name: maltName(malt), pct: (pct * 100).toFixed(0), max: malt.maxPct }));
    }
    return { uid: l.uid, malt, kg: l.kg, pct: pct * 100, pts };
  });

  const wheatPct = fermentables.filter((f) => f.malt.tags?.includes('wheat')).reduce((s, f) => s + f.pct, 0);
  if (wheatPct >= 40) tags.add('wheat40');

  // ---- Gyümölcs cukortartalom ----
  let fruitPts = 0;
  for (const a of r.adjuncts) {
    const adj = getAdjunct(a.id);
    if (!adj) continue;
    adj.tags?.forEach((t) => tags.add(t));
    if (adj.sugarPct && adj.unit === 'g') {
      fruitPts += ((adj.sugarPct / 100) * PTS_PER_KG_L * (a.amount / 1000)) / r.batchL;
    }
    const scale = a.amount / Math.max(1e-6, adj.dosePerL * r.batchL);
    for (const [axis, v] of Object.entries(adj.flavor) as [FlavorAxis, number][]) raw[axis] += v * scale;
  }

  const ogPts = fermPts + nonFermPts;
  const og = 1 + ogPts / 1000;

  // ---- Erjedési fok ----
  const yeast = getYeast(r.yeastId);
  let att = yeast ? (yeast.attenuation[0] + yeast.attenuation[1]) / 200 : 0.75;
  if (r.method === 'extract') att -= 0.03;
  else att += (66 - r.mashTemp) * 0.015;
  att -= (catPct.caramel ?? 0) * 0.002;
  att += (catPct.sugar ?? 0) * 0.003;
  if (r.adjuncts.some((a) => a.id === 'amylase')) att += 0.12;
  att = clamp(att, 0.45, 0.98);
  const fgPts = fermPts * (1 - att) + nonFermPts;
  const fg = 1 + fgPts / 1000;
  const abv = (og - fg) * 131.25 + fruitPts * 0.131;

  // ---- Keserűség ----
  const ibuVol = r.batchL + r.equipment.kettleLossL;
  const hops: HopRow[] = r.hops
    .map((line) => ({ line, hop: getHop(line.id) }))
    .filter((x): x is { line: HopLine; hop: Hop } => !!x.hop && x.line.g > 0)
    .map(({ line, hop }) => ({ line, hop, ibu: hopIbu(line, hop, og, ibuVol, r.boilMin) }));
  const ibu = hops.reduce((s, h) => s + h.ibu, 0);
  const buGu = ogPts > 0 ? ibu / ogPts : 0;

  // Komló aroma
  for (const h of hops) {
    const x = aromaWeight(h.line) * (h.line.g / r.batchL) * 1.5;
    raw.fruit += (x * h.hop.fruit) / 10;
    raw.hoppy += (x * (h.hop.resin * 0.6 + h.hop.floral * 0.6 + h.hop.spicy * 0.3)) / 10;
    raw.spice += (x * h.hop.spicy * 0.3) / 10;
  }

  // Élesztő
  if (yeast) {
    raw.fruit += yeast.ester * 0.6;
    raw.spice += yeast.phenol * 0.7;
  }

  // ---- Szín ----
  const srm = mcu > 0 ? 1.4922 * Math.pow(mcu, 0.6859) : 0;
  const ebc = srm * 1.97;

  // ---- Ízprofil ----
  const flavor = {} as Record<FlavorAxis, number>;
  flavor.malty = sat(raw.malty);
  flavor.roast = sat(raw.roast);
  flavor.fruit = sat(raw.fruit);
  flavor.hoppy = sat(raw.hoppy, 4);
  flavor.spice = sat(raw.spice);
  flavor.smoke = sat(raw.smoke);
  const residual = Math.max(0, fgPts - 8) * 0.4;
  flavor.sweet = clamp(sat(raw.sweet + residual) - Math.max(0, buGu - 0.8) * 3, 0, 10);
  const bitterBase = Math.min(10, ibu / 8) * 0.5 + Math.min(10, buGu * 11) * 0.5;
  flavor.bitter = clamp(bitterBase + raw.bitter * 0.5 + flavor.roast * 0.1, 0, 10);
  flavor.body = clamp((fgPts - 4) / 1.6 + raw.body * 0.8 + Math.max(0, abv - 7) * 0.3, 0, 10);
  if (totalKg === 0) (Object.keys(flavor) as FlavorAxis[]).forEach((k) => (flavor[k] = 0));

  // ---- Volumen ----
  const grainKg = fermentables
    .filter((f) => f.malt.category !== 'extract' && f.malt.category !== 'sugar')
    .reduce((s, f) => s + f.kg, 0);
  const volumes = computeVolumes(r, grainKg);

  // ---- Figyelmeztetések ----
  if (r.method === 'extract') {
    const base = fermentables.filter((f) => ['base', 'flaked'].includes(f.malt.category) && !f.malt.tags?.includes('acid'));
    if (base.length) warnings.push(t('Kivonatos módban az alapmaláták/pelyhek csak cefrézve (mini-mash 66 °C, 45-60 perc) adnak extraktot – az áztatás nem elég.'));
  } else if (totalKg > 0 && (catPct.extract ?? 0) > 0) {
    warnings.push(t('Malátakivonatot all-grain recepthez is adhatsz – a forraláshoz kerül, 100% kihozatallal számolva.'));
  }
  if (yeast && abv > yeast.alcoholTol) warnings.push(t('A becsült {abv}% meghaladja a(z) {yeast} alkoholtűrését (~{tol}%).', { abv: dec(abv, 1), yeast: yeastName(yeast), tol: yeast.alcoholTol }));
  if (r.method === 'biab' && grainKg > 0 && volumes.mashWaterL / grainKg < 2.5) warnings.push(t('Nagyon sűrű cefre – ellenőrizd a berendezés kapacitását.'));
  const ryeOat = (catPct.flaked ?? 0) + fermentables.filter((f) => f.malt.tags?.includes('rye')).reduce((s, f) => s + f.pct, 0);
  if (r.method !== 'extract' && ryeOat > 20) warnings.push(t('Sok rozs/pehely: rizshéj (kb. 3-5% a gabonára) segít a szűrésben.'));
  if (yeast?.kind === 'saison' && (yeast.id === 'be134' || yeast.id === 'belle-saison')) warnings.push(t('Diastaticus élesztő: palackban tovább erjedhet – pontos FG mérés és alapos fertőtlenítés!'));

  const plato = sgToPlato(og);
  const fgPlato = sgToPlato(fg);
  // Kalória (ASBC) 500 ml-re
  const re = 0.1808 * plato + 0.8192 * fgPlato;
  const abw = (0.79 * abv) / fg;
  const kcalPer500 = ((6.9 * abw + 4.0 * (re - 0.1)) * fg * 3.55) * (500 / 355);

  return {
    empty: totalKg === 0,
    og, fg, abv, ibu, srm, ebc, buGu,
    attenuation: att * 100,
    plato,
    kcalPer500: totalKg ? kcalPer500 : 0,
    totalKg,
    fermentables,
    hops,
    fruitPts,
    flavor,
    volumes,
    tags,
    catPct,
    warnings,
  };
}

// ---- Szín → HEX ----
const SRM_HEX = [
  '#FFE699', '#FFD878', '#FFCA5A', '#FFBF42', '#FBB123', '#F8A600', '#F39C00', '#EA8F00', '#E58500', '#DE7C00',
  '#D77200', '#CF6900', '#CB6200', '#C35900', '#BB5100', '#B54C00', '#B04500', '#A63E00', '#A13700', '#9B3200',
  '#952D00', '#8E2900', '#882300', '#821E00', '#7B1A00', '#771900', '#701400', '#6A0E00', '#660D00', '#5E0B00',
  '#5A0A02', '#600903', '#520907', '#4C0505', '#470606', '#440607', '#3F0708', '#3B0607', '#3A070B', '#36080A',
];

export function srmToHex(srm: number) {
  if (srm <= 1) return SRM_HEX[0];
  if (srm >= 40) return SRM_HEX[39];
  const lo = Math.floor(srm);
  const t = srm - lo;
  const a = SRM_HEX[lo - 1];
  const b = SRM_HEX[lo];
  const mix = (i: number) =>
    Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${mix(1)}${mix(3)}${mix(5)}`;
}

export function colorName(ebc: number) {
  if (ebc < 6) return t('szalmasárga');
  if (ebc < 10) return t('világos arany');
  if (ebc < 16) return t('aranyszínű');
  if (ebc < 26) return t('borostyán');
  if (ebc < 40) return t('mély borostyán / rézvörös');
  if (ebc < 60) return t('gesztenyebarna');
  if (ebc < 80) return t('sötétbarna');
  return t('fekete');
}
