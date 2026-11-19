import type { Recipe, Yeast } from '../types';
import { getAdjunct, getYeast, getStyle } from './catalog';
import type { Stats } from './calc';
import { t, dec, sg } from '../i18n';
import { adjDesc, adjName, hopName, maltName, yeastName } from './names';

export interface Step {
  title: string;
  detail?: string;
  temp?: string;
  time?: string;
  tag?: 'mash' | 'boil' | 'hop' | 'add' | 'cool' | 'ferment' | 'dry' | 'pack' | 'info';
  /** Időzíthető lépés hossza percben (főzőnap mód) */
  minutes?: number;
  /** Forralási esemény: ennyi perccel a forralás vége előtt (FWH: boilMin+1) */
  atMin?: number;
  /** Erjesztési lépés napintervalluma (beoltástól számítva) */
  days?: [number, number];
}

const f1 = (n: number) => dec(n, 1);
const f0 = (n: number) => Math.round(n).toString();
const min = (n: number | string) => t('{n} perc', { n });
const days = (a: number | string, b?: number | string) => (b === undefined ? t('{n}. nap', { n: a }) : t('{a}–{b}. nap', { a, b }));
const unit = (u: string) => t(u);
/** idő felirat + gépi napintervallum az erjesztési lépésekhez */
const dr = (a: number, b: number = a) => ({ time: a === b ? days(a) : days(a, b), days: [a, b] as [number, number] });

/** Strike (beütési) víz hőmérséklet. R: L/kg, gabona hőfoka 20 °C. */
export function strikeTemp(target: number, ratioLpkg: number, grainTemp = 20) {
  return target + (0.41 / ratioLpkg) * (target - grainTemp);
}

// ---------- Főzőnap ----------

export function brewDayPlan(r: Recipe, s: Stats): { mash: Step[]; boil: Step[]; notes: string[] } {
  const v = s.volumes;
  const mash: Step[] = [];
  const notes: string[] = [];
  const yeast = getYeast(r.yeastId);
  const pct = (pred: (tags: string[], cat: string) => boolean) =>
    s.fermentables.filter((f) => pred(f.malt.tags ?? [], f.malt.category)).reduce((a, f) => a + f.pct, 0);
  const glucanPct = pct((tg, c) => tg.includes('rye') || tg.includes('oat') || c === 'flaked');
  const wheatPct = pct((tg) => tg.includes('wheat'));
  const pilsPct = pct((tg) => tg.includes('pils'));
  const specialty = s.fermentables.filter((f) => ['caramel', 'roasted', 'special'].includes(f.malt.category));
  const mashables = s.fermentables.filter((f) => !['extract', 'sugar'].includes(f.malt.category));

  if (r.method === 'extract') {
    const steepKg = mashables.reduce((a, f) => a + f.kg, 0);
    if (steepKg > 0) {
      const needsMash = mashables.some((f) => ['base', 'flaked'].includes(f.malt.category));
      mash.push({
        tag: 'mash',
        title: needsMash ? t('Mini-mash (részleges cefrézés)') : t('Speciális maláták áztatása'),
        temp: needsMash ? `${r.mashTemp} °C` : '66–70 °C',
        time: needsMash ? min('45–60') : min(30),
        minutes: needsMash ? 60 : 30,
        detail: t('{kg} kg darált maláta zsákban, {l} L vízben. Utána emeld ki, csepegtesd le (ne nyomkodd).', { kg: f1(steepKg), l: f1(Math.max(3, steepKg * 3)) }),
      });
    }
    mash.push({
      tag: 'info',
      title: t('Feltöltés forralási térfogatra'),
      detail: t('Töltsd fel a főzőüstöt kb. {l} L-re. Forrásközelben vedd le a tűzről, és keverd el a malátakivonatot csomómentesre, majd forrald újra.', { l: f1(v.preBoilL) }),
    });
  } else {
    const ratio = v.grainKg > 0 ? v.mashWaterL / v.grainKg : r.equipment.mashRatio;
    let firstTemp = r.mashTemp;
    const rests: Step[] = [];
    if (glucanPct > 20) {
      firstTemp = 45;
      rests.push({ tag: 'mash', title: t('Béta-glükán pihenő'), temp: '45 °C', time: min(15), minutes: 15, detail: t('Sok rozs/zab/pehely miatt – csökkenti a ragadósságot, javítja a szűrést.') });
    } else if (yeast?.kind === 'wheat' && wheatPct >= 40) {
      firstTemp = 44;
      rests.push({ tag: 'mash', title: t('Ferulasav pihenő (opcionális)'), temp: '43–45 °C', time: min(15), minutes: 15, detail: t('Több szegfűszeges fenolt ad a búzasörnek.') });
    }
    const strike = strikeTemp(firstTemp, ratio);
    mash.push({
      tag: 'mash',
      title: t('Cefrevíz melegítése'),
      temp: `${f1(strike)} °C`,
      detail: t('{l} L víz ({r} L/kg). Ha használsz, add hozzá a vízkezelő sókat most.', { l: f1(v.mashWaterL), r: f1(ratio) }),
    });
    mash.push({ tag: 'mash', title: t('Beütés'), detail: t('{kg} kg darált malátát keverd el csomómentesen. Cél hőfok: {temp} °C.', { kg: f1(v.grainKg), temp: firstTemp }) });
    mash.push(...rests);
    const bodyNote =
      r.mashTemp <= 64 ? t('száraz, jól erjeszthető cefre') : r.mashTemp >= 68 ? t('testes, dextrinben gazdag cefre') : t('kiegyensúlyozott test');
    mash.push({ tag: 'mash', title: t('Cukrosítás (fő pihenő)'), temp: `${r.mashTemp} °C`, time: min(60), minutes: 60, detail: t('{note}. 15 percenként keverd át, figyeld a hőfokot. Jódpróbával ellenőrizhető.', { note: cap(bodyNote) }) });
    mash.push({ tag: 'mash', title: t('Cefre kifőzés (mash-out)'), temp: '76–78 °C', time: min(10), minutes: 10, detail: t('Leállítja az enzimeket, hígabb, jobban folyó cefre.') });
    if (r.method === 'biab') {
      mash.push({
        tag: 'mash',
        title: t('Maláta kiemelése'),
        detail: t('Emeld ki a zsákot / malátacsövet és csepegtesd le. Brewzilla-szerű rendszernél a teljes vízből kb. {l} L-t visszatarthatsz 76 °C-os átmosásra – ez +3-5% hatásfok.', { l: f1(v.totalWaterL * 0.3) }),
      });
    } else {
      mash.push({
        tag: 'mash',
        title: t('Átmosás (sparge)'),
        temp: '76–78 °C',
        detail: t('{l} L átmosó víz. Először keringtesd vissza a sörlét, amíg tisztul (vorlauf), majd lassan mosd át. Ne menj 1,010 alá és 6,0 pH fölé.', { l: f1(v.spargeWaterL) }),
      });
    }
    mash.push({ tag: 'info', title: t('Forralás előtti mérés'), detail: t('Cél: ~{l} L, kb. {sg} sűrűség.', { l: f1(v.preBoilL), sg: sg(1 + ((s.og - 1) * v.postBoilL) / v.preBoilL) }) });
    if (specialty.length === 0 && mashables.length > 0) notes.push(t('Csak alapmalátás recept (SMaSH-jellegű) – egyszerű, a maláta és a komló tisztán érvényesül.'));
  }

  // ---- Forralás ----
  const boil: Step[] = [];
  const events: { t: number; step: Step }[] = [];
  const boilMin = r.boilMin;
  boil.push({ tag: 'boil', title: t('Forralás – {n} perc', { n: boilMin }), detail: t('Fedő nélkül, erőteljes, gördülő forrás (a DMS távozzon).') });
  if (pilsPct >= 50 && boilMin < 90) notes.push(t('Pilsner maláta ≥ 50%: a 90 perces forralás csökkenti a DMS (főtt kukorica) kockázatát.'));

  for (const h of s.hops) {
    const { line, hop } = h;
    if (line.use === 'fwh') events.push({ t: boilMin + 1, step: { tag: 'hop', title: t('{hop} – {g} g (first wort)', { hop: hopName(hop), g: line.g }), detail: t('Már a felfűtés előtt a sörlébe – lágyabb keserűség. ~{ibu} IBU', { ibu: f0(h.ibu) }), time: 'FWH' } });
    if (line.use === 'boil') {
      const kind = line.time >= 45 ? t('Keserítő') : line.time >= 15 ? t('Íz') : t('Aroma');
      events.push({ t: line.time, step: { tag: 'hop', title: `${hopName(hop)} – ${dec(line.g, line.g % 1 ? 1 : 0)} g`, time: min(line.time), detail: t('{kind} komló · ~{ibu} IBU', { kind, ibu: f0(h.ibu) }) } });
    }
  }
  for (const f of s.fermentables) {
    if (f.malt.category === 'sugar') {
      const tm = f.malt.id === 'sugar-honey' ? 0 : 10;
      events.push({ t: tm, step: { tag: 'add', title: `${maltName(f.malt)} – ${f1(f.kg)} kg`, time: tm === 0 ? t('lángoltás') : min(tm), detail: t('Keverd el teljesen, hogy ne égjen le.') } });
    }
    if (f.malt.category === 'extract' && r.method !== 'extract') {
      events.push({ t: 15, step: { tag: 'add', title: `${maltName(f.malt)} – ${f1(f.kg)} kg`, time: min(15), detail: t('Tűzről levéve keverd el, aztán forrald tovább.') } });
    }
  }
  for (const a of r.adjuncts) {
    const adj = getAdjunct(a.id);
    if (!adj) continue;
    const amt = `${dec(a.amount, a.amount % 1 ? 1 : 0)} ${unit(adj.unit)}`;
    if (a.use === 'boil') events.push({ t: a.time, step: { tag: 'add', title: `${adjName(adj)} – ${amt}`, time: min(a.time) } });
    if (a.use === 'flameout') events.push({ t: 0, step: { tag: 'add', title: `${adjName(adj)} – ${amt}`, time: t('lángoltás') } });
  }
  if (!r.adjuncts.some((a) => ['whirlfloc', 'irish-moss'].includes(a.id))) {
    notes.push(t('Tipp: 1 Whirlfloc tabletta a forralás utolsó 15 percében tisztább sört ad.'));
  }
  events.sort((a, b) => b.t - a.t);
  boil.push(...events.map((e) => ({ ...e.step, atMin: e.t })));
  boil.push({ tag: 'boil', title: t('Lángoltás (flameout)'), time: min(0) });

  const wp = s.hops.filter((h) => h.line.use === 'whirlpool');
  if (wp.length) {
    const maxT = Math.max(...wp.map((h) => h.line.time));
    boil.push({
      tag: 'hop',
      title: t('Whirlpool / hop stand'),
      temp: '80 °C',
      time: min(maxT),
      minutes: maxT,
      detail: t('Hűtsd 80 °C-ra, add hozzá: {list}. Kevergesd, majd pihentesd.', { list: wp.map((h) => `${hopName(h.hop)} ${dec(h.line.g, h.line.g % 1 ? 1 : 0)} g`).join(', ') }),
    });
  }
  const pitch = yeast ? pitchTemp(yeast) : 18;
  boil.push({
    tag: 'cool',
    title: t('Hűtés'),
    temp: `${pitch} °C`,
    detail: t('Hűtsd le gyorsan az élesztő beoltási hőfokára, majd fejtsd át kb. {l} L sörlét a fermentorba. Mérd meg az OG-t (cél: {og}), és levegőztesd alaposan.', { l: f1(v.batchL), og: sg(s.og) }),
  });

  return { mash, boil, notes };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function pitchTemp(y: Yeast) {
  if (y.kind === 'kveik') return 30;
  if (y.kind === 'lager') return y.temp[0];
  if (y.kind === 'saison') return Math.max(y.temp[0], 20);
  return y.temp[0] + 1;
}

// ---------- Élesztő mennyiség ----------

export function yeastPitch(r: Recipe, s: Stats) {
  const y = getYeast(r.yeastId);
  if (!y) return null;
  // Gyártói száraz élesztő adagolás: ale 50–80 g/hl, lager 80–120 g/hl; erős sörnél több
  const gPerHl = y.kind === 'lager' ? 100 : y.kind === 'kveik' ? 40 : 60;
  const strongFactor = s.og > 1.075 ? 1.6 : s.og > 1.065 ? 1.3 : 1;
  const needG = (gPerHl * strongFactor * r.batchL) / 100;
  const packs = Math.max(1, Math.ceil(needG / y.packG - 0.15));
  return { yeast: y, gPerHl: gPerHl * strongFactor, needG, packs };
}

// ---------- Erjesztés ----------

export function fermentationPlan(r: Recipe, s: Stats): { steps: Step[]; totalDays: number } {
  const y = getYeast(r.yeastId);
  const steps: Step[] = [];
  if (!y) return { steps: [{ tag: 'info', title: t('Válassz élesztőt az erjesztési terv elkészítéséhez.') }], totalDays: 0 };
  const strong = s.og >= 1.070;
  const dry = s.hops.filter((h) => h.line.use === 'dry');
  const secondary = r.adjuncts.filter((a) => a.use === 'secondary').map((a) => ({ a, adj: getAdjunct(a.id)! })).filter((x) => x.adj);
  const pitch = pitchTemp(y);
  const pitchInfo = yeastPitch(r, s)!;
  let day = 0;

  steps.push({
    tag: 'ferment',
    title: t('Beoltás'),
    ...dr(0),
    temp: `${pitch} °C`,
    detail: t('{packs} csomag {yeast} (gyártói adag ~{g} g). Száraz élesztőt rehidratálhatsz 10× tömegű 25–30 °C-os vízben 15–30 percig, vagy közvetlenül a sörlé tetejére szórhatod.', { packs: pitchInfo.packs, yeast: yeastName(y), g: f0(pitchInfo.needG) }),
  });

  if (y.kind === 'kveik') {
    steps.push({ tag: 'ferment', title: t('Főerjedés (kveik)'), ...dr(0, 4), temp: '30–37 °C', detail: t('Gyors, heves erjedés. Melegítő öv / meleg helyiség jó, hűteni nem kell.') });
    day = 4;
  } else if (y.kind === 'lager') {
    const primary = strong ? 12 : 8;
    steps.push({ tag: 'ferment', title: t('Főerjedés'), ...dr(0, primary), temp: `${y.temp[0]}–${y.temp[0] + 2} °C`, detail: t('Hideg, lassú, tiszta erjedés. Ne emeld a hőt az elején!') });
    steps.push({ tag: 'ferment', title: t('Diacetil pihenő'), ...dr(primary, primary + 3), temp: '16–18 °C', detail: t('Amikor ~70%-ban kierjedt (SG ≈ {sg}), emeld a hőt. Az élesztő visszaszívja a vajas diacetilt.', { sg: sg(1 + (s.og - 1) * 0.35) }) });
    day = primary + 3;
  } else if (y.kind === 'saison' || y.kind === 'belgian') {
    steps.push({ tag: 'ferment', title: t('Főerjedés – hűvös kezdés'), ...dr(0, 2), temp: `${pitch}–${pitch + 1} °C`, detail: t('Az első 48 órában kontrolláld a hőt (fuzel alkoholok ellen).') });
    const top = y.kind === 'saison' ? Math.min(y.temp[1], 28) : Math.min(y.temp[1], 24);
    steps.push({ tag: 'ferment', title: t('Szabad emelkedés'), ...dr(3, strong ? 14 : 10), temp: `→ ${top} °C`, detail: t('Engedd felmelegedni – teljes kierjedés, komplexebb észterek és fenolok.') });
    day = strong ? 14 : 10;
  } else if (y.kind === 'wheat') {
    steps.push({ tag: 'ferment', title: t('Főerjedés'), ...dr(0, 7), temp: `${y.temp[0]}–${y.temp[0] + 2} °C`, detail: t('Hűvösebben (17-18 °C) több szegfűszeg, melegebben (20-22 °C) több banán.') });
    day = 7;
  } else {
    const primary = strong ? 10 : 7;
    steps.push({ tag: 'ferment', title: t('Főerjedés'), ...dr(0, primary), temp: `${y.temp[0]}–${y.temp[0] + 2} °C`, detail: t('A hőfok az első 3 napban a legkritikusabb (az erjedés maga 3-5 °C-ot melegít).') });
    steps.push({ tag: 'ferment', title: t('Utóerjedés / tisztulás'), ...dr(primary, primary + 3), temp: `${y.temp[0] + 2}–${y.temp[1]} °C`, detail: t('Emeld meg 2 fokkal a végén, hogy biztosan kierjedjen.') });
    day = primary + 3;
  }

  if (dry.length) {
    const hazy = r.styleId === '21C' || ['verdant', 'new-england'].includes(y.id);
    const maxDays = Math.max(...dry.map((h) => h.line.time));
    const list = dry.map((h) => `${hopName(h.hop)} ${dec(h.line.g, h.line.g % 1 ? 1 : 0)} g`).join(', ');
    if (hazy) {
      steps.push({ tag: 'dry', title: t('Hidegkomlózás – biotranszformáció'), ...dr(2, 3), detail: t('Aktív erjedés alatt: {list}. Erősebb trópusi jegyek (az élesztő átalakítja a komló vegyületeit).', { list }) });
    } else {
      steps.push({ tag: 'dry', title: t('Hidegkomlózás'), ...dr(Math.max(day - maxDays, 4), Math.max(day, maxDays + 4)), detail: t('Erjedés vége felé: {list}, {n} napig. Tovább ne – fűszerű, növényi lesz.', { list, n: maxDays }) });
    }
  }
  for (const { a, adj } of secondary) {
    steps.push({
      tag: 'add',
      title: `${adjName(adj)} – ${dec(a.amount, a.amount % 1 ? 1 : 0)} ${unit(adj.unit)}`,
      time: t('{d}. naptól {n} napig', { d: day, n: a.time }),
      days: [day, day + a.time],
      detail: adjDesc(adj),
    });
    day = Math.max(day, day + Math.min(a.time, 14));
  }

  steps.push({ tag: 'info', days: [Math.max(0, day - 2), day], title: t('Végső sűrűség ellenőrzése'), detail: t('Cél FG ≈ {fg}. Két egymást követő napon azonos mérés = kész.', { fg: sg(s.fg) }) });

  if (y.kind === 'lager') {
    const weeks = Math.round(3 + Math.max(0, (s.og - 1.048) * 100));
    steps.push({ tag: 'ferment', title: t('Lagerezés (hideg érlelés)'), days: [day, day + weeks * 7], time: t('{n} hét', { n: weeks }), temp: '0–2 °C', detail: t('Naponta 1-2 fokkal hűtsd le. Ettől lesz kristálytiszta és kerek.') });
    day += weeks * 7;
  } else {
    steps.push({ tag: 'cool', title: t('Hideg derítés (cold crash)'), days: [day, day + 3], time: t('{n} nap', { n: '2–3' }), temp: '1–3 °C', detail: t('Leülepíti az élesztőt és a komlóport. Opcionálisan zselatin.') });
    day += 3;
  }
  return { steps, totalDays: day };
}

// ---------- Palackozás / szénsav ----------

export function residualCO2(tempC: number) {
  const f = tempC * 1.8 + 32;
  return 3.0378 - 0.050062 * f + 0.00026555 * f * f;
}

/** Keg nyomás (bar) adott CO2 térfogathoz és hőfokhoz. */
export function kegPressureBar(vols: number, tempC: number) {
  const T = tempC * 1.8 + 32;
  const psi = -16.6999 - 0.0101059 * T + 0.00116512 * T * T + 0.173354 * T * vols + 4.24267 * vols - 0.0684226 * vols * vols;
  return Math.max(0, psi * 0.0689476);
}

export function packagingPlan(r: Recipe, s: Stats) {
  const style = getStyle(r.styleId);
  const y = getYeast(r.yeastId);
  const vols = r.carbVols ?? (style ? (style.carb[0] + style.carb[1]) / 2 : 2.4);
  const maxTemp = y ? (y.kind === 'lager' ? 16 : y.kind === 'kveik' ? 30 : y.temp[1] - 1) : 20;
  const resid = y?.kind === 'lager' ? residualCO2(2) : residualCO2(maxTemp);
  const L = s.volumes.packagedL;
  const need = Math.max(0, vols - resid);
  const dextrose = need * L * 4.0;
  const sucrose = need * L * 3.8;
  const bottles = Math.floor(L / 0.5);
  const keg = kegPressureBar(vols, 4);
  const aging =
    s.abv >= 8 ? t('4–12 hét (vagy több) – az erős sörök érleléssel sokat javulnak.')
      : s.hops.some((h) => h.line.use === 'dry') ? t('Minél frissebben! A komlóaroma 4–8 hét alatt jelentősen elhalványul. Hidegen tárold.')
        : y?.kind === 'lager' ? t('Már lagerezve van – palackban 1–2 hét után fogyasztható.')
          : t('1–3 hét hűtve – utána a csúcson.');
  return { vols, resid, dextrose, sucrose, bottles, keg, L, aging, maxTemp: y?.kind === 'lager' ? 2 : maxTemp };
}
