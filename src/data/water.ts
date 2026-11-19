import type { WaterProfile, Equipment, BrewMethod } from '../types';

export interface NamedWater extends WaterProfile {
  id: string;
  name: string;
  note?: string;
}

/** Kiinduló vízprofilok (ppm). A csapvíz értékek tájékoztató becslések – kérd le a szolgáltatódtól! */
export const SOURCE_WATERS: NamedWater[] = [
  { id: 'ro', name: 'Desztillált / RO víz', ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 },
  { id: 'budapest', name: 'Budapesti csapvíz (becslés)', ca: 65, mg: 18, na: 15, so4: 60, cl: 30, hco3: 260,
    note: 'Közepesen kemény, viszonylag magas lúgosság.' },
  { id: 'soft', name: 'Lágy hegyvidéki víz', ca: 20, mg: 5, na: 5, so4: 15, cl: 10, hco3: 70 },
  { id: 'hard', name: 'Kemény alföldi víz (becslés)', ca: 90, mg: 30, na: 40, so4: 80, cl: 50, hco3: 400 },
  { id: 'custom', name: 'Egyéni (saját vízelemzés)', ca: 50, mg: 10, na: 10, so4: 50, cl: 30, hco3: 150 },
];

/** Célprofilok sörtípusonként. */
export const TARGET_WATERS: NamedWater[] = [
  { id: 'pilsen', name: 'Pilseni lágy (pilsner, helles)', ca: 10, mg: 3, na: 3, so4: 10, cl: 10, hco3: 15 },
  { id: 'balanced', name: 'Kiegyensúlyozott', ca: 70, mg: 8, na: 15, so4: 80, cl: 80, hco3: 40 },
  { id: 'hoppy', name: 'Komlós / West Coast IPA', ca: 110, mg: 10, na: 15, so4: 250, cl: 50, hco3: 30 },
  { id: 'neipa', name: 'NEIPA / lágy komlós', ca: 100, mg: 10, na: 15, so4: 75, cl: 150, hco3: 30 },
  { id: 'malty', name: 'Malátás (bock, märzen, scottish)', ca: 60, mg: 8, na: 20, so4: 50, cl: 100, hco3: 60 },
  { id: 'dark', name: 'Sötét (stout, porter)', ca: 80, mg: 10, na: 25, so4: 60, cl: 110, hco3: 150 },
  { id: 'belgian', name: 'Belga', ca: 60, mg: 8, na: 15, so4: 60, cl: 70, hco3: 40 },
];

export const EQUIPMENT_DEFAULTS: Record<BrewMethod, { equipment: Equipment; efficiency: number; label: string; desc: string }> = {
  biab: {
    label: 'All-grain – egyedényes (BIAB / Brewzilla)',
    desc: 'Teljes vízmennyiséggel cefrézés zsákban vagy malátacsőben, opcionális átmosással.',
    efficiency: 70,
    equipment: { boilOffLph: 3, kettleLossL: 2, fermenterLossL: 1, absorptionLpkg: 0.8, mashRatio: 3 },
  },
  classic: {
    label: 'All-grain – klasszikus (cefrekád + átmosás)',
    desc: 'Külön cefrézőkád hamis fenékkel, batch vagy fly sparge.',
    efficiency: 75,
    equipment: { boilOffLph: 4, kettleLossL: 1.5, fermenterLossL: 1, absorptionLpkg: 1.0, mashRatio: 3 },
  },
  extract: {
    label: 'Malátakivonatos (+ áztatott speciális maláta)',
    desc: 'Kivonatból, a speciális malátákat csak áztatod.',
    efficiency: 60,
    equipment: { boilOffLph: 3, kettleLossL: 1, fermenterLossL: 1, absorptionLpkg: 1.0, mashRatio: 3 },
  },
};
