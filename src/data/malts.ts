import type { Malt } from '../types';

/**
 * Maláták, kivonatok és cukrok – a hopline.hu kínálatában szereplő márkák
 * (Weyermann, Viking) alapján, gyártói tipikus értékekkel.
 * Az árak becsültek (bruttó Ft), ellenőrizd a webshopban!
 */
export const MALTS: Malt[] = [
  // ---------- Alapmaláták ----------
  {
    id: 'vik-pils', name: 'Viking Pilsner', brand: 'Viking', category: 'base',
    ebc: 3.5, yield: 81, maxPct: 100, priceHuf: 990, packKg: 1, tags: ['pils'],
    flavor: { malty: 4, sweet: 0.5 },
    desc: 'Világos alapmaláta, tiszta, enyhén mézes-gabonás. Lagerek és világos ale-ek alapja.',
  },
  {
    id: 'wey-pils', name: 'Weyermann Pilsner', brand: 'Weyermann', category: 'base',
    ebc: 3.5, yield: 81, maxPct: 100, priceHuf: 1150, packKg: 1, tags: ['pils'],
    flavor: { malty: 4.5, sweet: 0.5 },
    desc: 'Klasszikus német pilsner maláta, friss gabonás karakter.',
  },
  {
    id: 'wey-bohem', name: 'Weyermann Bohemian Pilsner', brand: 'Weyermann', category: 'base',
    ebc: 4, yield: 80, maxPct: 100, priceHuf: 1250, packKg: 1, tags: ['pils'],
    flavor: { malty: 5.5, sweet: 1 },
    desc: 'Cseh típusú, kevésbé módosított pils maláta – teltebb, kenyeresebb. Dekokcióhoz ideális.',
  },
  {
    id: 'vik-pale', name: 'Viking Pale Ale', brand: 'Viking', category: 'base',
    ebc: 6.5, yield: 81, maxPct: 100, priceHuf: 990, packKg: 1,
    flavor: { malty: 5 },
    desc: 'Pale ale alapmaláta, kicsit sötétebb és malátásabb a pilsnernél. IPA/APA alap.',
  },
  {
    id: 'wey-pale', name: 'Weyermann Pale Ale', brand: 'Weyermann', category: 'base',
    ebc: 7, yield: 81, maxPct: 100, priceHuf: 1150, packKg: 1,
    flavor: { malty: 5.5 },
    desc: 'Teljesen módosított pale ale maláta, enyhén kekszes.',
  },
  {
    id: 'vik-vienna', name: 'Viking Bécsi', brand: 'Viking', category: 'base',
    ebc: 8, yield: 80, maxPct: 100, priceHuf: 1050, packKg: 1,
    flavor: { malty: 6.5, sweet: 1 },
    desc: 'Bécsi maláta: aranyszín, pirítós-kenyérhéj jegyek. Vienna lager, Märzen.',
  },
  {
    id: 'wey-vienna', name: 'Weyermann Vienna', brand: 'Weyermann', category: 'base',
    ebc: 8, yield: 80, maxPct: 100, priceHuf: 1200, packKg: 1,
    flavor: { malty: 6.5, sweet: 1 },
    desc: 'Bécsi maláta, finom pörkölt mogyorós jegyekkel.',
  },
  {
    id: 'wey-munich1', name: 'Weyermann Munich I.', brand: 'Weyermann', category: 'base',
    ebc: 15, yield: 80, maxPct: 100, priceHuf: 1250, packKg: 1,
    flavor: { malty: 8.5, sweet: 1 },
    desc: 'Világos müncheni maláta: intenzív kenyérhéj, malátás teltség.',
  },
  {
    id: 'wey-munich2', name: 'Weyermann Munich II.', brand: 'Weyermann', category: 'base',
    ebc: 22, yield: 79, maxPct: 100, priceHuf: 1250, packKg: 1,
    flavor: { malty: 10, sweet: 1.5 },
    desc: 'Sötét müncheni maláta: mély malátás, borostyán szín. Dunkel, Bock.',
  },
  {
    id: 'vik-munich-light', name: 'Viking Munich Light', brand: 'Viking', category: 'base',
    ebc: 16, yield: 80, maxPct: 100, priceHuf: 1050, packKg: 1,
    flavor: { malty: 8.5, sweet: 1 },
    desc: 'Világos müncheni maláta, kenyeres-malátás.',
  },
  {
    id: 'wey-wheat', name: 'Weyermann Búza (világos)', brand: 'Weyermann', category: 'base',
    ebc: 4, yield: 83, maxPct: 70, priceHuf: 1200, packKg: 1, tags: ['wheat'],
    flavor: { malty: 3, body: 3 },
    desc: 'Világos búzamaláta: kenyeres, krémes hab, jobb habtartás. Weizen, Witbier.',
  },
  {
    id: 'vik-wheat', name: 'Viking Búza', brand: 'Viking', category: 'base',
    ebc: 4, yield: 83, maxPct: 70, priceHuf: 1050, packKg: 1, tags: ['wheat'],
    flavor: { malty: 3, body: 3 },
    desc: 'Búzamaláta, puha gabonás karakter.',
  },
  {
    id: 'wey-rye', name: 'Weyermann Rozs', brand: 'Weyermann', category: 'base',
    ebc: 7, yield: 81, maxPct: 50, priceHuf: 1300, packKg: 1, tags: ['rye'],
    flavor: { malty: 4, spice: 6, body: 3 },
    desc: 'Rozsmaláta: fűszeres, kissé borsos, olajos test. Nehezen szűrhető – rizshéj javasolt 20% felett.',
  },
  {
    id: 'vik-rye', name: 'Viking Rozs', brand: 'Viking', category: 'base',
    ebc: 7, yield: 80, maxPct: 50, priceHuf: 1150, packKg: 1, tags: ['rye'],
    flavor: { malty: 4, spice: 6, body: 3 },
    desc: 'Rozsmaláta, földes-fűszeres jegyek.',
  },
  {
    id: 'wey-smoked', name: 'Weyermann Füstölt (bükkfa)', brand: 'Weyermann', category: 'base',
    ebc: 5, yield: 81, maxPct: 100, priceHuf: 1350, packKg: 1, tags: ['smoked'],
    flavor: { malty: 4, smoke: 14 },
    desc: 'Bükkfán füstölt árpamaláta (Rauchmalz). Bamberger Rauchbier karakter.',
  },
  {
    id: 'wey-smoked-wheat', name: 'Weyermann Füstölt búza', brand: 'Weyermann', category: 'base',
    ebc: 5, yield: 82, maxPct: 100, priceHuf: 1450, packKg: 1, tags: ['smoked', 'wheat'],
    flavor: { malty: 3, smoke: 10, body: 2 },
    desc: 'Tölgyfán füstölt búzamaláta – Grätzer/Grodziskie stílushoz.',
  },
  {
    id: 'vik-oat', name: 'Viking Zabmaláta', brand: 'Viking', category: 'base',
    ebc: 5, yield: 75, maxPct: 30, priceHuf: 1300, packKg: 1, tags: ['oat'],
    flavor: { malty: 3, body: 8, sweet: 1 },
    desc: 'Malátázott zab: selymes, krémes test. NEIPA, Oatmeal Stout.',
  },

  // ---------- Karamell / kristály ----------
  {
    id: 'wey-carapils', name: 'Weyermann Carapils', brand: 'Weyermann', category: 'caramel',
    ebc: 4, yield: 77, maxPct: 10, priceHuf: 1350, packKg: 1,
    flavor: { body: 25, sweet: 4 },
    desc: 'Dextrinmaláta: test és habtartás színnövelés nélkül.',
  },
  {
    id: 'wey-carahell', name: 'Weyermann Carahell', brand: 'Weyermann', category: 'caramel',
    ebc: 25, yield: 77, maxPct: 15, priceHuf: 1350, packKg: 1,
    flavor: { sweet: 25, malty: 10, body: 10 },
    desc: 'Világos karamellmaláta: mézes, édeskés, aranyszín.',
  },
  {
    id: 'wey-carared', name: 'Weyermann Carared', brand: 'Weyermann', category: 'caramel',
    ebc: 50, yield: 76, maxPct: 20, priceHuf: 1400, packKg: 1,
    flavor: { sweet: 30, malty: 8, body: 8 },
    desc: 'Vörös árnyalatot ad, karamelles. Irish Red, Amber.',
  },
  {
    id: 'wey-caramunich1', name: 'Weyermann Caramunich I.', brand: 'Weyermann', category: 'caramel',
    ebc: 90, yield: 76, maxPct: 10, priceHuf: 1400, packKg: 1,
    flavor: { sweet: 40, malty: 10, body: 6 },
    desc: 'Közepes karamell: mézes-karamelles, borostyán szín.',
  },
  {
    id: 'wey-caramunich2', name: 'Weyermann Caramunich II.', brand: 'Weyermann', category: 'caramel',
    ebc: 120, yield: 76, maxPct: 10, priceHuf: 1400, packKg: 1,
    flavor: { sweet: 45, malty: 10, body: 6, roast: 3 },
    desc: 'Sötétebb karamell, kenyérhéj és karamell.',
  },
  {
    id: 'wey-caramunich3', name: 'Weyermann Caramunich III.', brand: 'Weyermann', category: 'caramel',
    ebc: 150, yield: 75, maxPct: 10, priceHuf: 1400, packKg: 1,
    flavor: { sweet: 50, malty: 8, body: 6, roast: 5 },
    desc: 'Sötét karamell: égetett cukor, aszalt gyümölcs.',
  },
  {
    id: 'vik-cara30', name: 'Viking Caramel 30', brand: 'Viking', category: 'caramel',
    ebc: 30, yield: 76, maxPct: 15, priceHuf: 1200, packKg: 1,
    flavor: { sweet: 25, body: 8 },
    desc: 'Világos karamell, édes-mézes.',
  },
  {
    id: 'vik-cara50', name: 'Viking Caramel 50', brand: 'Viking', category: 'caramel',
    ebc: 50, yield: 76, maxPct: 15, priceHuf: 1200, packKg: 1,
    flavor: { sweet: 30, body: 7 },
    desc: 'Arany-borostyán karamell.',
  },
  {
    id: 'vik-cara100', name: 'Viking Caramel 100', brand: 'Viking', category: 'caramel',
    ebc: 100, yield: 75, maxPct: 10, priceHuf: 1200, packKg: 1,
    flavor: { sweet: 40, body: 6, roast: 2 },
    desc: 'Közepes karamell, toffee jegyek.',
  },
  {
    id: 'vik-cara150', name: 'Viking Caramel 150', brand: 'Viking', category: 'caramel',
    ebc: 150, yield: 75, maxPct: 10, priceHuf: 1200, packKg: 1,
    flavor: { sweet: 45, body: 6, roast: 4 },
    desc: 'Sötétebb karamell, mazsolás.',
  },
  {
    id: 'vik-cara200', name: 'Viking Caramel 200', brand: 'Viking', category: 'caramel',
    ebc: 200, yield: 74, maxPct: 8, priceHuf: 1200, packKg: 1,
    flavor: { sweet: 45, roast: 8, body: 5 },
    desc: 'Sötét karamell, égetett cukor.',
  },
  {
    id: 'vik-cara300', name: 'Viking Caramel 300', brand: 'Viking', category: 'caramel',
    ebc: 300, yield: 73, maxPct: 5, priceHuf: 1200, packKg: 1,
    flavor: { sweet: 40, roast: 15, body: 5 },
    desc: 'Nagyon sötét karamell, aszalt szilva, melasz.',
  },
  {
    id: 'wey-caraaroma', name: 'Weyermann Caraaroma', brand: 'Weyermann', category: 'caramel',
    ebc: 400, yield: 75, maxPct: 10, priceHuf: 1450, packKg: 1,
    flavor: { sweet: 45, malty: 15, roast: 10 },
    desc: 'Intenzív malátás-karamelles aroma, vörösesbarna szín.',
  },

  // ---------- Pörkölt / festő ----------
  {
    id: 'vik-coffee', name: 'Viking Coffee', brand: 'Viking', category: 'roasted',
    ebc: 450, yield: 72, maxPct: 10, priceHuf: 1350, packKg: 1,
    flavor: { roast: 90, sweet: 5 },
    desc: 'Kávés-mokkás pörkölt maláta.',
  },
  {
    id: 'vik-choc', name: 'Viking Chocolate', brand: 'Viking', category: 'roasted',
    ebc: 900, yield: 70, maxPct: 10, priceHuf: 1350, packKg: 1,
    flavor: { roast: 120 },
    desc: 'Csokoládés, kávés pörkölt maláta. Porter, Stout.',
  },
  {
    id: 'vik-black', name: 'Viking Black', brand: 'Viking', category: 'roasted',
    ebc: 1300, yield: 68, maxPct: 5, priceHuf: 1350, packKg: 1,
    flavor: { roast: 150, bitter: 10 },
    desc: 'Fekete maláta: éles, kesernyés pörkölt. Kis mennyiségben színezésre.',
  },
  {
    id: 'wey-carafa1', name: 'Weyermann Carafa Special I.', brand: 'Weyermann', category: 'roasted',
    ebc: 900, yield: 70, maxPct: 5, priceHuf: 1500, packKg: 1,
    flavor: { roast: 60 },
    desc: 'Héjatlanított pörkölt maláta: sötét szín, lágy pörkölés, kevés keserűség. Schwarzbier, Black IPA.',
  },
  {
    id: 'wey-carafa2', name: 'Weyermann Carafa Special II.', brand: 'Weyermann', category: 'roasted',
    ebc: 1150, yield: 70, maxPct: 5, priceHuf: 1500, packKg: 1,
    flavor: { roast: 70 },
    desc: 'Héjatlanított, sötétebb – lágy pörkölt jegyek.',
  },
  {
    id: 'wey-carafa3', name: 'Weyermann Carafa Special III.', brand: 'Weyermann', category: 'roasted',
    ebc: 1400, yield: 70, maxPct: 5, priceHuf: 1500, packKg: 1,
    flavor: { roast: 80 },
    desc: 'Legsötétebb héjatlanított pörkölt maláta, színezésre.',
  },
  {
    id: 'wey-roastbarley', name: 'Weyermann Pörkölt árpa', brand: 'Weyermann', category: 'roasted',
    ebc: 1200, yield: 70, maxPct: 10, priceHuf: 1450, packKg: 1, tags: ['roastbarley'],
    flavor: { roast: 140, bitter: 8 },
    desc: 'Malátázatlan pörkölt árpa: száraz, eszpresszós keserűség. Irish Stout kötelező eleme.',
  },

  // ---------- Speciális ----------
  {
    id: 'wey-melanoidin', name: 'Weyermann Melanoidin', brand: 'Weyermann', category: 'special',
    ebc: 70, yield: 78, maxPct: 20, priceHuf: 1400, packKg: 1,
    flavor: { malty: 45, sweet: 8, body: 6 },
    desc: 'Intenzív malátás, mézes-kenyérhéj aroma, dekokciós jelleg.',
  },
  {
    id: 'wey-abbey', name: 'Weyermann Abbey', brand: 'Weyermann', category: 'special',
    ebc: 45, yield: 77, maxPct: 25, priceHuf: 1450, packKg: 1,
    flavor: { malty: 35, sweet: 6, roast: 3 },
    desc: 'Belga apátsági karakter: kekszes, mogyorós, szárított gyümölcs.',
  },
  {
    id: 'wey-acid', name: 'Weyermann Savanyú maláta', brand: 'Weyermann', category: 'special',
    ebc: 5, yield: 77, maxPct: 10, priceHuf: 1400, packKg: 1, tags: ['acid'],
    flavor: { malty: 1 },
    desc: 'Tejsavas maláta a cefre pH csökkentésére (1% ≈ −0,1 pH). Pilsnerekhez.',
  },

  // ---------- Pelyhek ----------
  {
    id: 'flake-oat', name: 'Zabpehely', brand: 'Hopline', category: 'flaked',
    ebc: 2, yield: 70, maxPct: 30, priceHuf: 900, packKg: 1, tags: ['oat'],
    flavor: { body: 10, sweet: 1 },
    desc: 'Selymes, krémes test és opálos megjelenés. NEIPA, Oatmeal Stout, Witbier.',
  },
  {
    id: 'flake-barley', name: 'Árpapehely', brand: 'Hopline', category: 'flaked',
    ebc: 3, yield: 70, maxPct: 20, priceHuf: 900, packKg: 1,
    flavor: { body: 8 },
    desc: 'Habtartás és test, ír stoutokhoz klasszikus.',
  },
  {
    id: 'flake-wheat', name: 'Búzapehely', brand: 'Hopline', category: 'flaked',
    ebc: 3, yield: 72, maxPct: 40, priceHuf: 900, packKg: 1, tags: ['wheat', 'rawwheat'],
    flavor: { body: 6 },
    desc: 'Malátázatlan búza: Witbier jellegzetes zavarossága és gabonás íze.',
  },
  {
    id: 'flake-corn', name: 'Kukoricapehely', brand: 'Hopline', category: 'flaked',
    ebc: 2, yield: 78, maxPct: 30, priceHuf: 900, packKg: 1,
    flavor: { sweet: 3, body: -2 },
    desc: 'Könnyít a testen, enyhén édeskés. Amerikai lagerek, cream ale.',
  },

  // ---------- Malátakivonat ----------
  {
    id: 'lme-light', name: 'Folyékony malátakivonat – világos', brand: 'Muntons', category: 'extract',
    ebc: 8, yield: 78, maxPct: 100, priceHuf: 2900, packKg: 1.5,
    flavor: { malty: 4.5, sweet: 1 },
    desc: 'Világos LME, 1,5 kg-os doboz. Kivonatos főzéshez.',
  },
  {
    id: 'lme-amber', name: 'Folyékony malátakivonat – borostyán', brand: 'Muntons', category: 'extract',
    ebc: 25, yield: 78, maxPct: 100, priceHuf: 2900, packKg: 1.5,
    flavor: { malty: 6, sweet: 3 },
    desc: 'Borostyán LME, karamelles.',
  },
  {
    id: 'dme-extralight', name: 'Szárított malátakivonat – extra világos', brand: 'Muntons', category: 'extract',
    ebc: 5, yield: 95, maxPct: 100, priceHuf: 3200, packKg: 1,
    flavor: { malty: 4 },
    desc: 'Extra világos DME (porított).',
  },
  {
    id: 'dme-dark', name: 'Szárított malátakivonat – sötét', brand: 'Muntons', category: 'extract',
    ebc: 80, yield: 95, maxPct: 100, priceHuf: 3200, packKg: 1,
    flavor: { malty: 5, sweet: 3, roast: 6 },
    desc: 'Sötét DME, porterekhez/stoutokhoz.',
  },
  {
    id: 'dme-wheat', name: 'Szárított malátakivonat – búza', brand: 'Muntons', category: 'extract',
    ebc: 6, yield: 95, maxPct: 100, priceHuf: 3300, packKg: 1, tags: ['wheat'],
    flavor: { malty: 3, body: 2 },
    desc: 'Búza DME (kb. 55% búza, 45% árpa).',
  },

  // ---------- Cukrok ----------
  {
    id: 'sugar-dextrose', name: 'Szőlőcukor (dextróz)', brand: 'Hopline', category: 'sugar',
    ebc: 0, yield: 91, maxPct: 20, priceHuf: 1100, packKg: 1,
    flavor: { body: -15 },
    desc: '100%-ban erjeszthető, szárít, növeli az alkoholt. Belga erős sörök, Double IPA.',
  },
  {
    id: 'sugar-sucrose', name: 'Kristálycukor', brand: 'Bolti', category: 'sugar',
    ebc: 0, yield: 100, maxPct: 20, priceHuf: 450, packKg: 1,
    flavor: { body: -15 },
    desc: 'Teljesen erjeszthető, szárító hatás.',
  },
  {
    id: 'sugar-candi-dark', name: 'Belga kandiszirup – sötét', brand: 'Hopline', category: 'sugar',
    ebc: 350, yield: 72, maxPct: 15, priceHuf: 3500, packKg: 0.5,
    flavor: { sweet: 40, roast: 10, fruit: 20, body: -8 },
    desc: 'Sötét kandiszirup: mazsola, aszalt szilva, karamell. Dubbel, Quadrupel.',
  },
  {
    id: 'sugar-honey', name: 'Méz', brand: 'Bolti', category: 'sugar',
    ebc: 3, yield: 75, maxPct: 20, priceHuf: 3500, packKg: 1,
    flavor: { sweet: 8, fruit: 5, body: -10 },
    desc: 'Szinte teljesen kierjed, finom virágos jegy marad. Lángoltáskor add hozzá.',
  },
  {
    id: 'sugar-lactose', name: 'Laktóz (tejcukor)', brand: 'Hopline', category: 'sugar',
    ebc: 0, yield: 76, maxPct: 15, nonFermentable: true, priceHuf: 2400, packKg: 0.5, tags: ['lactose'],
    flavor: { sweet: 60, body: 25 },
    desc: 'Nem erjeszthető cukor: édesség és krémes test. Milk Stout, Milkshake IPA.',
  },
  {
    id: 'sugar-maltodextrin', name: 'Maltodextrin', brand: 'Hopline', category: 'sugar',
    ebc: 0, yield: 87, maxPct: 10, nonFermentable: true, priceHuf: 2200, packKg: 0.5,
    flavor: { body: 40, sweet: 5 },
    desc: 'Nem erjeszthető, testet és habtartást ad édesség nélkül.',
  },
];

export const MALT_CATEGORY_LABEL: Record<Malt['category'], string> = {
  base: 'Alapmaláták',
  caramel: 'Karamell & kristály',
  roasted: 'Pörkölt / festő',
  special: 'Speciális',
  flaked: 'Pelyhek',
  extract: 'Malátakivonat',
  sugar: 'Cukrok',
};
