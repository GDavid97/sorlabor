import type { Adjunct } from '../types';

/**
 * Ízesítők, fűszerek, kávé, tölgyfa, derítők, tápsók.
 * `flavor` = ízhatás a tipikus adagolásnál (dosePerL); arányosan skálázódik.
 */
export const ADJUNCTS: Adjunct[] = [
  // ---- Fűszerek ----
  { id: 'coriander', name: 'Koriandermag', category: 'spice', unit: 'g', dosePerL: 0.8, defaultUse: 'boil', defaultTime: 5,
    flavor: { spice: 4, fruit: 2 }, tags: ['coriander'], priceHuf: 900, packAmount: 50,
    desc: 'Frissen törve, forralás utolsó 5 percében. Citrusos-fűszeres – Witbier alapja.' },
  { id: 'orange-bitter', name: 'Keserű narancshéj (Curaçao)', category: 'spice', unit: 'g', dosePerL: 0.8, defaultUse: 'boil', defaultTime: 5,
    flavor: { fruit: 3, bitter: 1 }, tags: ['orange'], priceHuf: 1100, packAmount: 50,
    desc: 'Szárított keserű narancshéj, enyhe keserűség és narancsos aroma.' },
  { id: 'orange-sweet', name: 'Édes narancshéj', category: 'spice', unit: 'g', dosePerL: 1, defaultUse: 'boil', defaultTime: 5,
    flavor: { fruit: 4 }, tags: ['orange'], priceHuf: 1100, packAmount: 50,
    desc: 'Illatos narancsos jegy, Witbier, Belgian Blonde.' },
  { id: 'chamomile', name: 'Kamillavirág', category: 'spice', unit: 'g', dosePerL: 0.3, defaultUse: 'flameout', defaultTime: 0,
    flavor: { hoppy: 3, spice: 1 }, priceHuf: 800, packAmount: 50,
    desc: 'Virágos, mézes – Witbier, Saison.' },
  { id: 'cinnamon', name: 'Fahéj (rúd)', category: 'spice', unit: 'g', dosePerL: 0.25, defaultUse: 'boil', defaultTime: 5,
    flavor: { spice: 4, sweet: 1 }, priceHuf: 900, packAmount: 50,
    desc: 'Téli sörök, karácsonyi ale. Óvatosan adagold!' },
  { id: 'clove', name: 'Szegfűszeg', category: 'spice', unit: 'g', dosePerL: 0.05, defaultUse: 'boil', defaultTime: 5,
    flavor: { spice: 4 }, priceHuf: 800, packAmount: 30,
    desc: 'Nagyon intenzív – néhány szem 20 L-re.' },
  { id: 'ginger', name: 'Gyömbér (szárított)', category: 'spice', unit: 'g', dosePerL: 0.5, defaultUse: 'boil', defaultTime: 10,
    flavor: { spice: 4, fruit: 1 }, priceHuf: 900, packAmount: 50,
    desc: 'Csípős-citrusos, téli és fűszeres sörökhöz.' },
  { id: 'vanilla', name: 'Vaníliarúd', category: 'spice', unit: 'db', dosePerL: 0.1, defaultUse: 'secondary', defaultTime: 7,
    flavor: { sweet: 4 }, priceHuf: 1500, packAmount: 1,
    desc: 'Hosszában felvágva, alkoholba áztatva, utóerjesztéskor 5-10 napig. Stout, Porter.' },
  { id: 'pepper', name: 'Fekete bors', category: 'spice', unit: 'g', dosePerL: 0.1, defaultUse: 'boil', defaultTime: 5,
    flavor: { spice: 4 }, priceHuf: 700, packAmount: 50,
    desc: 'Saisonokhoz extra borsosság.' },
  { id: 'lavender', name: 'Levendula', category: 'spice', unit: 'g', dosePerL: 0.1, defaultUse: 'flameout', defaultTime: 0,
    flavor: { hoppy: 3 }, priceHuf: 900, packAmount: 30,
    desc: 'Virágos, nagyon kis mennyiségben.' },

  // ---- Kávé, kakaó ----
  { id: 'coffee', name: 'Specialty kávébab', category: 'coffee', unit: 'g', dosePerL: 2.5, defaultUse: 'secondary', defaultTime: 1,
    flavor: { roast: 5, sweet: 1 }, tags: ['coffee'], priceHuf: 3500, packAmount: 250,
    desc: 'Durvára törve hidegen áztatva 24-48 órát a fermentorban. Stout, Porter.' },
  { id: 'cacao-nibs', name: 'Kakaóbab töret (nibs)', category: 'coffee', unit: 'g', dosePerL: 5, defaultUse: 'secondary', defaultTime: 7,
    flavor: { roast: 4, sweet: 1 }, priceHuf: 2500, packAmount: 250,
    desc: 'Csokoládés jegyek, 5-10 nap utóerjesztésben.' },

  // ---- Tölgyfa ----
  { id: 'oak-french', name: 'Tölgyfa chips – francia, közepes pörkölés', category: 'oak', unit: 'g', dosePerL: 2, defaultUse: 'secondary', defaultTime: 14,
    flavor: { smoke: 5, sweet: 1 }, tags: ['oak'], priceHuf: 1500, packAmount: 100,
    desc: 'Vaníliás, fűszeres hordós karakter. Előtte gőzöld/ forrázd le. 1-3 hét.' },
  { id: 'oak-american', name: 'Tölgyfa chips – amerikai, erős pörkölés', category: 'oak', unit: 'g', dosePerL: 2, defaultUse: 'secondary', defaultTime: 14,
    flavor: { smoke: 6, sweet: 2 }, tags: ['oak'], priceHuf: 1500, packAmount: 100,
    desc: 'Kókuszos, vaníliás, karamelles – bourbon hordó jelleg. Imperial Stout.' },

  // ---- Gyümölcs (nem hopline) ----
  { id: 'raspberry', name: 'Málna (fagyasztott)', category: 'fruit', unit: 'g', dosePerL: 100, defaultUse: 'secondary', defaultTime: 7,
    flavor: { fruit: 6 }, sugarPct: 5, external: true, priceHuf: 3000, packAmount: 1000,
    desc: 'Fagyasztva-kiolvasztva, főerjedés után. Új erjedést indít! (bolti termék)' },
  { id: 'sour-cherry', name: 'Meggy (magozott, fagyasztott)', category: 'fruit', unit: 'g', dosePerL: 150, defaultUse: 'secondary', defaultTime: 10,
    flavor: { fruit: 6, sweet: 1 }, sugarPct: 10, external: true, priceHuf: 2500, packAmount: 1000,
    desc: 'Klasszikus Kriek-jelleg. Főerjedés után. (bolti termék)' },
  { id: 'mango-puree', name: 'Mangópüré', category: 'fruit', unit: 'g', dosePerL: 100, defaultUse: 'secondary', defaultTime: 5,
    flavor: { fruit: 6, sweet: 1 }, sugarPct: 14, external: true, priceHuf: 3500, packAmount: 1000,
    desc: 'Milkshake / NEIPA. Pasztőrözött püré. (bolti termék)' },

  // ---- Derítők, tápsó, enzim ----
  { id: 'whirlfloc', name: 'Whirlfloc tabletta', category: 'fining', unit: 'db', dosePerL: 0.05, defaultUse: 'boil', defaultTime: 15,
    flavor: {}, priceHuf: 90, packAmount: 1,
    desc: 'Ír moha alapú derítő, forralás utolsó 15 percében. 1 db / 20 L.' },
  { id: 'irish-moss', name: 'Ír moha', category: 'fining', unit: 'g', dosePerL: 0.25, defaultUse: 'boil', defaultTime: 15,
    flavor: {}, priceHuf: 900, packAmount: 50,
    desc: 'Fehérjék kicsapatása forralás végén.' },
  { id: 'gelatin', name: 'Zselatin', category: 'fining', unit: 'g', dosePerL: 0.25, defaultUse: 'secondary', defaultTime: 2,
    flavor: {}, priceHuf: 600, packAmount: 20,
    desc: 'Hidegderítés palackozás előtt 2-3 nappal.' },
  { id: 'nutrient', name: 'Élesztő tápsó', category: 'nutrient', unit: 'g', dosePerL: 0.5, defaultUse: 'boil', defaultTime: 10,
    flavor: {}, priceHuf: 900, packAmount: 50,
    desc: 'Erőteljesebb, tisztább erjedés – erős söröknél és sok cukornál ajánlott.' },
  { id: 'amylase', name: 'Gluco-amiláz enzim', category: 'enzyme', unit: 'ml', dosePerL: 0.1, defaultUse: 'secondary', defaultTime: 0,
    flavor: { body: -4 }, priceHuf: 1600, packAmount: 10,
    desc: 'Extra száraz sörhöz (Brut IPA, light): a nem erjeszthető dextrineket bontja.' },
];

export const ADJUNCT_CATEGORY_LABEL: Record<Adjunct['category'], string> = {
  spice: 'Fűszerek',
  coffee: 'Kávé & kakaó',
  oak: 'Tölgyfa',
  fruit: 'Gyümölcs',
  fining: 'Derítők',
  nutrient: 'Tápsó',
  enzyme: 'Enzim',
};
