import type { Recipe } from '../types';
import type { Stats } from './calc';
import { getAdjunct, getYeast } from './catalog';
import { brewDayPlan, pitchTemp, yeastPitch } from './plan';
import { SALT_INFO, saltName } from './water';
import { t, dec, sg } from '../i18n';
import { adjName, hopName, maltName, yeastName } from './names';

export type MeasureField = 'preBoilSG' | 'preBoilL' | 'postBoilL' | 'og' | 'batchL';

export interface BrewAlert {
  key: string;
  /** perccel a forralás vége előtt */
  atMin: number;
  title: string;
  detail?: string;
}

export type BrewPhase = 'Előkészítés' | 'Cefrézés' | 'Forralás' | 'Hűtés' | 'Mérés' | 'Erjesztés';

export interface BrewStep {
  key: string;
  /** Fázis (magyar kulcs – megjelenítéskor t()) */
  phase: BrewPhase;
  title: string;
  detail?: string;
  temp?: string;
  minutes?: number;
  checklist?: string[];
  alerts?: BrewAlert[];
  measure?: MeasureField[];
  final?: boolean;
}

const f1 = (n: number) => dec(n, 1);
const f2 = (n: number) => dec(n, 2);
const g = (n: number) => dec(n, n % 1 ? 1 : 0);

export function buildBrewSteps(r: Recipe, s: Stats): BrewStep[] {
  const plan = brewDayPlan(r, s);
  const v = s.volumes;
  const steps: BrewStep[] = [];

  // ---- Előkészítés ----
  const check: string[] = [t('Fertőtlenítsd a fermentort, a fedőt, a kotyogót és mindent, ami a hűtött sörlével érintkezik.')];
  const grains = s.fermentables.filter((f) => !['extract', 'sugar'].includes(f.malt.category));
  if (grains.length) check.push(t('Mérd ki és darálj: {list}.', { list: grains.map((f) => `${maltName(f.malt)} ${f2(f.kg)} kg`).join(', ') }));
  const others = s.fermentables.filter((f) => ['extract', 'sugar'].includes(f.malt.category));
  if (others.length) check.push(t('Készítsd elő: {list}.', { list: others.map((f) => `${maltName(f.malt)} ${f2(f.kg)} kg`).join(', ') }));
  if (s.hops.length) {
    const use = (h: (typeof s.hops)[number]) =>
      h.line.use === 'dry' ? t('hidegkomló') : h.line.use === 'whirlpool' ? 'whirlpool' : h.line.use === 'fwh' ? 'FWH' : `${h.line.time}′`;
    check.push(t('Porciózd a komlókat: {list}.', { list: s.hops.map((h) => `${hopName(h.hop)} ${g(h.line.g)} g (${use(h)})`).join(', ') }));
  }
  const salts = (Object.keys(SALT_INFO) as (keyof typeof SALT_INFO)[]).filter((k) => r.water.salts[k] > 0);
  if (salts.length || r.water.salts.lactic > 0) {
    check.push(
      t('Vízkezelés: {list}.', {
        list: [
          ...salts.map((k) => `${saltName(k)} ${g(r.water.salts[k])} g`),
          ...(r.water.salts.lactic > 0 ? [`${t('tejsav')} ${g(r.water.salts.lactic)} ml`] : []),
        ].join(', '),
      }),
    );
  }
  const y = getYeast(r.yeastId);
  if (y) check.push(t('Élesztő: {yeast} – vedd ki a hűtőből, hogy szobahőmérsékletű legyen.', { yeast: yeastName(y) }));
  check.push(t('Víz: összesen {l} L.', { l: f1(v.totalWaterL) }));
  steps.push({ key: 'prep', phase: 'Előkészítés', title: t('Előkészítés'), checklist: check });

  // ---- Cefrézés / áztatás ----
  plan.mash
    .filter((m) => m.tag !== 'info' || r.method === 'extract')
    .forEach((m, i) =>
      steps.push({ key: `mash-${i}`, phase: 'Cefrézés', title: m.title, detail: m.detail, temp: m.temp, minutes: m.minutes }),
    );

  const fwh = s.hops.filter((h) => h.line.use === 'fwh');
  if (fwh.length) {
    steps.push({
      key: 'fwh',
      phase: 'Forralás',
      title: t('First wort komló'),
      detail: t('Tedd a komlót a sörlébe még felfűtés előtt.'),
      checklist: fwh.map((h) => `${hopName(h.hop)} – ${g(h.line.g)} g`),
    });
  }

  steps.push({
    key: 'measure-pre',
    phase: 'Mérés',
    title: t('Forralás előtti mérés'),
    detail: t('Keverd át, vegyél mintát, hűtsd le 20 °C-ra és mérd meg. Cél: ~{l} L, {sg} sűrűség.', { l: f1(v.preBoilL), sg: sg(1 + ((s.og - 1) * v.postBoilL) / v.preBoilL) }),
    measure: ['preBoilSG', 'preBoilL'],
  });

  // ---- Forralás ----
  const alerts: BrewAlert[] = plan.boil
    .filter((b) => b.atMin !== undefined && b.atMin <= r.boilMin)
    .map((b, i) => ({ key: `boil-a${i}`, atMin: b.atMin!, title: b.title, detail: b.detail }));
  steps.push({
    key: 'boil',
    phase: 'Forralás',
    title: t('Forralás – {n} perc', { n: r.boilMin }),
    detail: t('Indítsd az órát, amikor a sörlé erőteljesen forr. Fedő nélkül! A hozzáadásoknál hangjelzést kapsz.'),
    minutes: r.boilMin,
    alerts,
  });
  steps.push({
    key: 'measure-post',
    phase: 'Mérés',
    title: t('Forralás utáni térfogat'),
    detail: t('Opcionális, de a kalibrációhoz hasznos (elpárolgás). Cél: ~{l} L (forrón kb. 4%-kal több).', { l: f1(v.postBoilL) }),
    measure: ['postBoilL'],
  });

  const wp = plan.boil.find((b) => b.tag === 'hop' && b.minutes !== undefined);
  if (wp) {
    steps.push({ key: 'whirlpool', phase: 'Hűtés', title: wp.title, detail: wp.detail, temp: wp.temp, minutes: wp.minutes });
  }

  const pitch = y ? pitchTemp(y) : 18;
  steps.push({
    key: 'cool',
    phase: 'Hűtés',
    title: t('Hűtés és áttöltés'),
    temp: `${pitch} °C`,
    detail: t('Hűtsd le minél gyorsabban {t} °C-ra, majd töltsd át a sörlét a fertőtlenített fermentorba, és levegőztesd alaposan (rázás, loccsantás).', { t: pitch }),
  });
  steps.push({
    key: 'measure-og',
    phase: 'Mérés',
    title: t('OG és térfogat a fermentorban'),
    detail: t('Cél: {og} és {l} L. Ha eltér, alább korrekciós javaslatot kapsz.', { og: sg(s.og), l: f1(v.batchL) }),
    measure: ['og', 'batchL'],
  });

  const p = yeastPitch(r, s);
  const secondary = r.adjuncts.filter((a) => a.use === 'secondary').map((a) => getAdjunct(a.id)).filter(Boolean).map((a) => adjName(a!));
  steps.push({
    key: 'pitch',
    phase: 'Erjesztés',
    title: t('Élesztő beoltása'),
    temp: `${pitch} °C`,
    detail: p
      ? t('{packs} csomag {yeast}. Rehidratálhatod 10× tömegű 25–30 °C-os vízben 15–30 percig, vagy szórd a sörlé tetejére. Zárd le, tedd kotyogót, és tartsd {t1}–{t2} °C-on.', { packs: p.packs, yeast: yeastName(p.yeast), t1: p.yeast.temp[0], t2: p.yeast.temp[1] })
      : t('Oltsd be az élesztőt, zárd le a fermentort.'),
    checklist: [
      t('Írd fel a dátumot és az OG-t a fermentorra.'),
      ...(s.hops.some((h) => h.line.use === 'dry') ? [t('Hidegkomlózás: lásd az erjesztési tervet.')] : []),
      ...(secondary.length ? [t('Utóerjesztéshez: {list}.', { list: secondary.join(', ') })] : []),
      t('Takarítás: az üstöt és a hűtőt még most mosd el, amíg nem száradt rá.'),
    ],
    final: true,
  });
  return steps;
}

// ---------- Korrekciók ----------

/** Forralás előtti sűrűség eltérés → javaslat */
export function preBoilCorrection(r: Recipe, s: Stats, preSG?: number, preL?: number): string | null {
  if (!preSG || !preL) return null;
  const totalPts = (preSG - 1) * 1000 * preL;
  const postTarget = s.volumes.postBoilL;
  const expectedOg = 1 + totalPts / postTarget / 1000;
  const diff = expectedOg - s.og;
  if (Math.abs(diff) < 0.002) return t('👍 Jó úton jársz: várható OG ≈ {og}.', { og: sg(expectedOg) });
  if (diff < 0) {
    const neededPost = totalPts / ((s.og - 1) * 1000);
    const extraL = Math.max(0, postTarget - neededPost);
    const extraMin = (extraL / Math.max(0.5, r.equipment.boilOffLph)) * 60;
    const dmeG = ((-diff * 1000 * postTarget) / (0.95 * 385.6)) * 1000;
    return t('Várható OG ≈ {og} (alacsony). Megoldás: forralj kb. {min} perccel tovább (kevesebb, de erősebb sör), vagy adj hozzá ~{g} g szárított malátakivonatot.', { og: sg(expectedOg), min: Math.round(extraMin), g: Math.round(dmeG) });
  }
  const waterL = totalPts / ((s.og - 1) * 1000) - postTarget;
  return t('Várható OG ≈ {og} (magas). Forralás végén ~{l} L forralt víz hozzáadásával eléred a célt (több sör lesz).', { og: sg(expectedOg), l: f1(waterL) });
}

/** OG eltérés a fermentorban → javaslat */
export function ogCorrection(s: Stats, og?: number, L?: number): string | null {
  if (!og || !L) return null;
  const diff = og - s.og;
  if (Math.abs(diff) < 0.002) return t('👍 Telitalálat! OG {og}.', { og: sg(og) });
  if (diff > 0) {
    const addL = (L * (og - 1)) / (s.og - 1) - L;
    return t('Magasabb az OG ({og}). Ha a terv szerinti erősséget szeretnéd, adj hozzá ~{l} L forralt, lehűtött vizet – vagy hagyd így: erősebb sör lesz.', { og: sg(og), l: f1(addL) });
  }
  const dmeG = ((-diff * 1000 * L) / (0.95 * 385.6)) * 1000;
  return t('Alacsonyabb az OG ({og}). Feloldhatsz ~{g} g szárított malátakivonatot kevés forralt vízben – vagy hagyd így: könnyebb sör lesz. A kalibráció ebből tanul.', { og: sg(og), g: Math.round(dmeG) });
}
