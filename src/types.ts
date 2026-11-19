// ---- Katalógus típusok ----

export type MaltCategory =
  | 'base'
  | 'caramel'
  | 'roasted'
  | 'special'
  | 'flaked'
  | 'extract'
  | 'sugar';

/** Ízprofil tengelyek (0-10 skála a végeredményben). */
export type FlavorAxis =
  | 'malty'
  | 'sweet'
  | 'roast'
  | 'fruit'
  | 'hoppy'
  | 'spice'
  | 'smoke'
  | 'bitter'
  | 'body';

export type FlavorVec = Partial<Record<FlavorAxis, number>>;

export interface Malt {
  id: string;
  name: string;
  brand: string;
  category: MaltCategory;
  /** Szín EBC-ben */
  ebc: number;
  /** Extrakt kihozatal (fine grind, %) – szacharóz = 100 */
  yield: number;
  /** Max. ajánlott arány a gabonaszámlában (%) */
  maxPct: number;
  /** Nem erjeszthető (pl. laktóz, maltodextrin) */
  nonFermentable?: boolean;
  /** Ízpotencia 100%-os felhasználásnál */
  flavor: FlavorVec;
  /** Speciális címkék stílusellenőrzéshez: wheat, rye, oat, smoked, lactose, pils ... */
  tags?: string[];
  /** Becsült bruttó ár Ft / kg */
  priceHuf: number;
  /** Kiszerelés kg-ban (bevásárlólistához) */
  packKg: number;
  desc: string;
}

export type HopType = 'aroma' | 'bitter' | 'dual';

export interface Hop {
  id: string;
  name: string;
  origin: string;
  type: HopType;
  alpha: number;
  /** 0-10 intenzitás */
  fruit: number; // citrus, trópusi, bogyós
  resin: number; // gyantás, fenyős, dank
  floral: number; // virágos, gyógynövényes
  spicy: number; // fűszeres, földes
  descriptors: string[];
  /** Becsült ár Ft / 100 g */
  price100: number;
  lupomax?: boolean;
  desc: string;
}

export type YeastKind =
  | 'ale'
  | 'english'
  | 'lager'
  | 'wheat'
  | 'belgian'
  | 'saison'
  | 'kveik'
  | 'kolsch';

export interface Yeast {
  id: string;
  name: string;
  brand: string;
  kind: YeastKind;
  /** Látszólagos erjedési fok (%) */
  attenuation: [number, number];
  /** Ajánlott hőfok °C */
  temp: [number, number];
  flocculation: 'alacsony' | 'közepes' | 'magas';
  alcoholTol: number;
  /** 0-10 */
  ester: number;
  phenol: number;
  /** Csomag tömege g */
  packG: number;
  /** Milliárd sejt / csomag (becslés) */
  cellsB: number;
  priceHuf: number;
  desc: string;
}

export type AdjunctCategory =
  | 'spice'
  | 'coffee'
  | 'oak'
  | 'fruit'
  | 'fining'
  | 'nutrient'
  | 'enzyme';

export type AdjunctUse = 'boil' | 'flameout' | 'secondary' | 'mash';

export interface Adjunct {
  id: string;
  name: string;
  category: AdjunctCategory;
  unit: 'g' | 'db' | 'ml';
  /** Tipikus adagolás egységnyi / liter */
  dosePerL: number;
  defaultUse: AdjunctUse;
  /** perc (boil) vagy nap (secondary) */
  defaultTime: number;
  /** Ízhatás tipikus adagolásnál (nyers potencia) */
  flavor: FlavorVec;
  /** Erjeszthető cukortartalom (%), pl. gyümölcs */
  sugarPct?: number;
  tags?: string[];
  priceHuf: number;
  packAmount: number;
  /** Nem hopline termék (pl. bolti gyümölcs) */
  external?: boolean;
  desc: string;
}

// ---- Stílus ----

export interface BeerStyle {
  id: string;
  code: string;
  name: string;
  nameHu: string;
  group: string;
  og: [number, number];
  fg: [number, number];
  ibu: [number, number];
  srm: [number, number];
  abv: [number, number];
  carb: [number, number];
  yeast: YeastKind[];
  mashTemp: number;
  requires?: { tags: string[]; label: string }[];
  desc: string;
}

// ---- Recept ----

export type BrewMethod = 'biab' | 'classic' | 'extract';

export interface FermentableLine {
  uid: string;
  id: string;
  kg: number;
}

export type HopUse = 'boil' | 'fwh' | 'whirlpool' | 'dry';

export interface HopLine {
  uid: string;
  id: string;
  g: number;
  use: HopUse;
  /** boil/fwh: perc; whirlpool: perc; dry: nap */
  time: number;
}

export interface AdjunctLine {
  uid: string;
  id: string;
  amount: number;
  use: AdjunctUse;
  time: number;
}

export interface Salts {
  gypsum: number;
  cacl2: number;
  epsom: number;
  nacl: number;
  bicarb: number;
  lactic: number; // ml 80%
}

export interface WaterProfile {
  ca: number;
  mg: number;
  na: number;
  so4: number;
  cl: number;
  hco3: number;
}

export interface Equipment {
  boilOffLph: number;
  kettleLossL: number;
  fermenterLossL: number;
  absorptionLpkg: number;
  mashRatio: number; // L/kg (klasszikus)
}

export interface Recipe {
  id: string;
  name: string;
  styleId: string | null;
  batchL: number;
  method: BrewMethod;
  efficiency: number;
  boilMin: number;
  mashTemp: number;
  equipment: Equipment;
  fermentables: FermentableLine[];
  hops: HopLine[];
  yeastId: string | null;
  adjuncts: AdjunctLine[];
  water: {
    sourceId: string;
    custom: WaterProfile;
    targetId: string;
    salts: Salts;
  };
  carbVols: number | null;
  notes: string;
  updatedAt: number;
}

// ---- Főzési napló ----

export interface Measurements {
  preBoilSG?: number;
  preBoilL?: number;
  postBoilL?: number;
  og?: number;
  batchL?: number;
  fg?: number;
  mashPh?: number;
}

export interface BrewTimer {
  stepKey: string;
  /** ms, amikor (újra)indult; null = szünetel */
  startedAt: number | null;
  /** eddig eltelt ms a szünetek előtt */
  elapsedMs: number;
}

/** Erjedés közbeni mérés */
export interface Reading {
  id: string;
  /** időpont (ms) */
  t: number;
  sg?: number;
  temp?: number;
  note?: string;
}

export interface BrewSession {
  id: string;
  recipeId: string;
  recipeName: string;
  /** A recept pillanatképe a főzés indításakor */
  recipe: Recipe;
  predicted: { og: number; fg: number; preBoilSG: number; efficiency: number; attenuation: number };
  startedAt: number;
  finishedAt?: number;
  status: 'brewing' | 'fermenting' | 'done';
  stepIndex: number;
  doneSteps: string[];
  firedAlerts: string[];
  timer: BrewTimer | null;
  measurements: Measurements;
  notes: string;
  /** az élesztő beoltásának ideje (a főzőnap végén) */
  pitchedAt?: number;
  /** erjedéskövetés mérései */
  readings?: Reading[];
}

export interface CalibrationProfile {
  efficiency?: number;
  boilOffLph?: number;
  kettleLossL?: number;
  n: number;
  updatedAt: number;
}
