/**
 * Fordítás-ellenőrző: kigyűjti a t('…') kulcsokat és a fordítandó adatmezőket,
 * és kiírja, mi hiányzik az angol / német szótárból.
 * Futtatás: npm run i18n:check
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { EN } from '../src/i18n/en';
import { DE } from '../src/i18n/de';
import { DATA_EN, DATA_DE } from '../src/i18n/data';
import { MALTS, MALT_CATEGORY_LABEL } from '../src/data/malts';
import { HOPS, HOP_TYPE_LABEL } from '../src/data/hops';
import { YEASTS, YEAST_KIND_LABEL } from '../src/data/yeasts';
import { ADJUNCTS, ADJUNCT_CATEGORY_LABEL } from '../src/data/adjuncts';
import { STYLES } from '../src/data/styles';
import { PRESETS } from '../src/data/presets';
import { SOURCE_WATERS, TARGET_WATERS, EQUIPMENT_DEFAULTS } from '../src/data/water';
import { FAMILY_LABEL } from '../src/lib/presetMeta';

const keys = new Set<string>();
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? (f === 'i18n' ? [] : walk(p)) : /\.tsx?$/.test(f) ? [p] : [];
  });

const CALL = /\bt\(\s*'((?:[^'\\]|\\.)*)'/g;
const FIELD = /\b(?:label|hint): '((?:[^'\\]|\\.)*)'/g;

for (const file of walk('src')) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(CALL)) keys.add(m[1].replace(/\\'/g, "'"));
  // label/hint mezők a komponensekben és a számítási modulokban definiált táblákban
  if (/components|lib[\\/](calc|style|brewmode|water|costs)\.ts/.test(file)) {
    for (const m of src.matchAll(FIELD)) keys.add(m[1]);
  }
}
const add = (...xs: (string | undefined)[]) => xs.forEach((x) => x && keys.add(x));
Object.values(MALT_CATEGORY_LABEL).forEach((x) => add(x));
Object.values(FAMILY_LABEL).forEach((x) => add(x));
Object.values(HOP_TYPE_LABEL).forEach((x) => add(x));
Object.values(YEAST_KIND_LABEL).forEach((x) => add(x));
Object.values(ADJUNCT_CATEGORY_LABEL).forEach((x) => add(x));
HOPS.forEach((h) => add(h.origin, ...h.descriptors));
YEASTS.forEach((y) => add(y.flocculation));
ADJUNCTS.forEach((a) => add(a.unit));
STYLES.forEach((s) => {
  add(s.group);
  s.requires?.forEach((r) => add(r.label));
});
PRESETS.forEach((p) => add(p.level));
[...SOURCE_WATERS, ...TARGET_WATERS].forEach((w) => add(w.name, w.note));
Object.values(EQUIPMENT_DEFAULTS).forEach((e) => add(e.label, e.desc));
[
  'Előkészítés', 'Cefrézés', 'Forralás', 'Hűtés', 'Mérés', 'Erjesztés', 'Bolti',
  'Gipsz (CaSO₄)', 'Kalcium-klorid (CaCl₂)', 'Keserűsó (MgSO₄)', 'Konyhasó (NaCl)', 'Szódabikarbóna (NaHCO₃)',
  'Maláták & erjeszthetők', 'Komlók', 'Élesztő', 'Ízesítők & adalékok', 'Vízkezelés',
  // App THEME_OPTS, HOP_USE_LABEL / ADJ_USE_LABEL, PARAM_LABEL értékei
  'Rendszer szerint', 'Sötét', 'Világos', 'Hidegkomló', 'Lángoltás', 'Cefre', 'Végső sűrűség (FG)', 'Keserűség (IBU)',
].forEach((x) => add(x));
// nem fordítandó (márkanevek, nyelvnevek, mértékegységek)
['Magyar', 'English', 'Deutsch', 'g', 'ml', 'First wort', 'Whirlpool 80°C'].forEach((x) => keys.delete(x));

const missing = (dict: Record<string, string>) => [...keys].filter((k) => !(k in dict));
const unused = (dict: Record<string, string>) => Object.keys(dict).filter((k) => !keys.has(k));

type D = typeof DATA_EN;
const dataMissing = (d: D) => [
  ...MALTS.filter((m) => !d.malts[m.id]?.desc).map((m) => `malt:${m.id}`),
  ...HOPS.filter((h) => !d.hops[h.id]?.desc).map((h) => `hop:${h.id}`),
  ...YEASTS.filter((y) => !d.yeasts[y.id]?.desc).map((y) => `yeast:${y.id}`),
  ...ADJUNCTS.filter((a) => !d.adjuncts[a.id]?.desc || !d.adjuncts[a.id]?.name).map((a) => `adj:${a.id}`),
  ...STYLES.filter((s) => !d.styles[s.id]?.desc).map((s) => `style:${s.id}`),
  ...PRESETS.filter((p) => !d.presets[p.id]?.desc || !d.presets[p.id]?.name).map((p) => `preset:${p.id}`),
];

const out = process.argv[2];
if (out) writeFileSync(out, [...keys].map((k) => JSON.stringify(k)).join(',\n'));
console.log(`kulcsok: ${keys.size}`);
let bad = 0;
for (const [l, dict, data] of [['en', EN, DATA_EN], ['de', DE, DATA_DE]] as const) {
  const mis = missing(dict);
  const un = unused(dict);
  const dm = dataMissing(data);
  bad += mis.length + dm.length;
  console.log(`${l}: hiányzó ${mis.length}, felesleges ${un.length}, adat hiány ${dm.length}`);
  if (mis.length && mis.length < 300) console.log('  hiányzik:', mis);
  if (un.length) console.log('  felesleges:', un.slice(0, 30));
  if (dm.length && dm.length < 60) console.log('  adat:', dm);
}
process.exitCode = bad ? 1 : 0;
