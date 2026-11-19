import type { AdjunctUse, BrewMethod, HopUse, Recipe } from '../types';

/** Tömör recept leírás: [id, kg] / [id, g, használat, idő] / [id, mennyiség, használat, idő] */
export interface Preset {
  id: string;
  name: string;
  styleId: string;
  level: 'kezdő' | 'haladó' | 'profi';
  method?: BrewMethod;
  desc: string;
  mashTemp: number;
  boilMin?: number;
  malts: [string, number][];
  hops: [string, number, HopUse, number][];
  yeast: string;
  adjuncts?: [string, number, AdjunctUse, number][];
  water?: { targetId: string; sourceId?: string; salts?: Partial<Recipe['water']['salts']> };
  carbVols?: number;
}

export const PRESETS: Preset[] = [
  {
    id: 'p-apa', name: 'Klasszikus amerikai pale ale', styleId: '18B', level: 'kezdő', mashTemp: 66,
    desc: 'Az első all-grain főzéshez ideális: egyszerű gabonaszámla, Cascade grapefruit és virág, tiszta US-05.',
    malts: [['vik-pale', 4.4], ['wey-caramunich1', 0.3], ['wey-carapils', 0.2]],
    hops: [['magnum', 16, 'boil', 60], ['cascade', 30, 'boil', 10], ['cascade', 40, 'whirlpool', 20], ['cascade', 40, 'dry', 4]],
    yeast: 'us05', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'hoppy' },
  },
  {
    id: 'p-apa-extract', name: 'Kivonatos pale ale (első főzés)', styleId: '18B', level: 'kezdő', method: 'extract', mashTemp: 66,
    desc: 'Cefrézés nélkül, malátakivonatból – egy nagy fazék és egy fermentor elég hozzá. Az áztatott karamellmaláta ad színt és testet.',
    malts: [['dme-extralight', 3.0], ['wey-caramunich1', 0.3]],
    hops: [['magnum', 16, 'boil', 60], ['cascade', 30, 'boil', 10], ['amarillo', 30, 'whirlpool', 20], ['cascade', 30, 'dry', 4]],
    yeast: 'us05', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'hoppy', sourceId: 'ro' },
  },
  {
    id: 'p-wcipa', name: 'West Coast IPA', styleId: '21A', level: 'haladó', mashTemp: 65,
    desc: 'Száraz, ropogós, fenyős-citrusos: Simcoe, Centennial és Citra. Magas szulfátos víz a karcos keserűséghez.',
    malts: [['vik-pale', 5.6], ['wey-carapils', 0.2], ['vik-cara30', 0.2]],
    hops: [['magnum', 18, 'boil', 60], ['simcoe', 25, 'boil', 10], ['centennial', 40, 'whirlpool', 20], ['simcoe', 30, 'whirlpool', 20], ['citra', 50, 'dry', 4], ['simcoe', 30, 'dry', 4]],
    yeast: 'us05', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'hoppy' },
  },
  {
    id: 'p-neipa', name: 'Hazy IPA (NEIPA)', styleId: '21C', level: 'haladó', mashTemp: 66,
    desc: 'Zavaros, krémes, gyümölcslészerű: zab és búza a testért, Citra + Mosaic biotranszformációs hidegkomlózással.',
    malts: [['vik-pale', 4.8], ['flake-oat', 0.8], ['wey-wheat', 0.6], ['wey-carapils', 0.2]],
    hops: [['magnum', 8, 'boil', 60], ['citra', 50, 'whirlpool', 20], ['mosaic', 50, 'whirlpool', 20], ['citra', 60, 'dry', 3], ['mosaic', 40, 'dry', 3]],
    yeast: 'verdant', water: { targetId: 'neipa' }, carbVols: 2.3,
  },
  {
    id: 'p-pils', name: 'Cseh pilsner', styleId: '3B', level: 'profi', mashTemp: 67, boilMin: 90,
    desc: 'Aranyszín, gazdag kenyeres maláta, hármas Saaz komlózás. Lágy víz és hideg, türelmes erjesztés + lagerezés kell hozzá.',
    malts: [['wey-bohem', 4.6], ['wey-carapils', 0.25], ['wey-acid', 0.1]],
    hops: [['saaz', 60, 'boil', 60], ['saaz', 40, 'boil', 20], ['saaz', 40, 'boil', 5]],
    yeast: 'm84', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'pilsen', sourceId: 'ro', salts: { cacl2: 0.5 } },
  },
  {
    id: 'p-helles', name: 'Müncheni Helles', styleId: '4A', level: 'profi', mashTemp: 65, boilMin: 90,
    desc: 'Finom, kenyeres világos lager, alig érezhető nemes komlóval – az egyszerűség művészete.',
    malts: [['wey-pils', 3.8], ['wey-munich1', 0.35], ['wey-carapils', 0.15]],
    hops: [['hallertau-mf', 35, 'boil', 60], ['hallertau-mf', 15, 'boil', 15]],
    yeast: 'w3470', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'pilsen', sourceId: 'ro', salts: { cacl2: 1 } },
  },
  {
    id: 'p-marzen', name: 'Märzen (Oktoberfest)', styleId: '6A', level: 'haladó', mashTemp: 66,
    desc: 'Borostyán, kenyérhéjas bécsi és müncheni maláta, száraz befejezés. Ősszel a legjobb.',
    malts: [['wey-vienna', 2.5], ['wey-munich1', 2.0], ['wey-pils', 0.5], ['wey-caramunich1', 0.2]],
    hops: [['hallertau-mf', 40, 'boil', 60], ['tettnang', 15, 'boil', 20]],
    yeast: 'w3470', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'malty' },
  },
  {
    id: 'p-weizen', name: 'Bajor búzasör (Hefeweizen)', styleId: '10A', level: 'kezdő', mashTemp: 67,
    desc: 'Banán és szegfűszeg, krémes hab, alig keserű. 18-19 °C-on erjesztve egyensúlyos lesz.',
    malts: [['wey-wheat', 2.6], ['wey-pils', 1.8]],
    hops: [['hallertau-mf', 20, 'boil', 60]],
    yeast: 'munich-classic', water: { targetId: 'balanced' }, carbVols: 3.6,
  },
  {
    id: 'p-wit', name: 'Belga Witbier', styleId: '24A', level: 'kezdő', mashTemp: 65,
    desc: 'Frissítő nyári sör korianderrel és narancshéjjal, malátázatlan búzától selymes és zavaros.',
    malts: [['wey-pils', 2.5], ['flake-wheat', 1.7], ['flake-oat', 0.3]],
    hops: [['hallertau-mf', 25, 'boil', 60]],
    yeast: 't58', adjuncts: [['coriander', 16, 'boil', 5], ['orange-bitter', 16, 'boil', 5]], water: { targetId: 'balanced' },
  },
  {
    id: 'p-red', name: 'Ír vörös ale', styleId: '15A', level: 'kezdő', mashTemp: 66,
    desc: 'Rézvörös, karamelles-pirítós, száraz befejezés egy csipet pörkölt árpától.',
    malts: [['vik-pale', 3.6], ['wey-carared', 0.35], ['wey-caramunich2', 0.15], ['wey-roastbarley', 0.06]],
    hops: [['ekg', 30, 'boil', 60], ['ekg', 15, 'boil', 15]],
    yeast: 's04', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'malty' },
  },
  {
    id: 'p-stout', name: 'Zabos stout kávéval', styleId: '16B', level: 'kezdő', mashTemp: 67,
    desc: 'Selymes, testes, csokis-kávés stout zabbal; a végén hidegen áztatott specialty kávéval.',
    malts: [['vik-pale', 3.9], ['flake-oat', 0.6], ['vik-choc', 0.3], ['wey-roastbarley', 0.25], ['wey-caramunich2', 0.3]],
    hops: [['ekg', 50, 'boil', 60]],
    yeast: 's04', adjuncts: [['coffee', 50, 'secondary', 1]], water: { targetId: 'dark' },
  },
  {
    id: 'p-milkstout', name: 'Milk stout vaníliával', styleId: '16A', level: 'haladó', mashTemp: 68,
    desc: 'Édes, krémes desszertsör laktózzal és vaníliarúddal – tejeskávé és csokoládé.',
    malts: [['vik-pale', 3.8], ['sugar-lactose', 0.5], ['vik-choc', 0.35], ['wey-roastbarley', 0.15], ['wey-caramunich2', 0.3], ['flake-oat', 0.3]],
    hops: [['ekg', 40, 'boil', 60]],
    yeast: 's04', adjuncts: [['vanilla', 2, 'secondary', 7]], water: { targetId: 'dark' },
  },
  {
    id: 'p-tripel', name: 'Belga tripel', styleId: '26C', level: 'haladó', mashTemp: 65,
    desc: 'Arany, erős, mégis száraz és könnyed: pilsner maláta + szőlőcukor, fűszeres-gyümölcsös belga élesztő.',
    malts: [['wey-pils', 5.2], ['wey-carahell', 0.2], ['sugar-dextrose', 1.0]],
    hops: [['magnum', 15, 'boil', 60], ['saaz', 30, 'boil', 15]],
    yeast: 'be256', adjuncts: [['nutrient', 10, 'boil', 10], ['whirlfloc', 1, 'boil', 15]], water: { targetId: 'belgian' },
  },
  {
    id: 'p-kveik', name: 'Nyári kveik blonde', styleId: '18A', level: 'kezdő', mashTemp: 66,
    desc: 'Hűtés nélkül is tiszta: Voss kveik 30-35 °C-on 4 nap alatt kierjed. Narancsos, könnyed.',
    malts: [['vik-pale', 3.4], ['vik-vienna', 0.6], ['wey-carapils', 0.15]],
    hops: [['magnum', 8, 'boil', 60], ['mandarina', 30, 'whirlpool', 20], ['mandarina', 30, 'dry', 3]],
    yeast: 'voss', water: { targetId: 'balanced' },
  },

  // ===================== További klasszikusok =====================
  {
    id: 'p-gpils', name: 'Német pils', styleId: '5D', level: 'profi', mashTemp: 65, boilMin: 90,
    desc: 'Szalmasárga, ropogósan száraz, határozott nemes komlókeserűséggel – Hallertauer és Tettnanger.',
    malts: [['wey-pils', 3.9], ['wey-carapils', 0.15], ['wey-acid', 0.1]],
    hops: [['magnum', 14, 'boil', 60], ['hallertau-mf', 30, 'boil', 15], ['tettnang', 30, 'boil', 5]],
    yeast: 'w3470', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'pilsen', sourceId: 'ro', salts: { gypsum: 0.5, cacl2: 0.5 } },
  },
  {
    id: 'p-kolsch', name: 'Kölsch', styleId: '5B', level: 'haladó', mashTemp: 65,
    desc: 'Kölni felsőerjesztésű, lagerezett sör: finoman gyümölcsös, nagyon tiszta, könnyed. Hűvös erjesztés + 2-3 hét hideg érlelés.',
    malts: [['wey-pils', 3.6], ['wey-wheat', 0.3], ['wey-vienna', 0.2]],
    hops: [['hallertau-mf', 40, 'boil', 60], ['tettnang', 15, 'boil', 10]],
    yeast: 'k97', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'pilsen', sourceId: 'ro', salts: { cacl2: 1 } },
  },
  {
    id: 'p-vienna', name: 'Bécsi lager', styleId: '7A', level: 'haladó', mashTemp: 67,
    desc: 'Vöröses borostyán, pirítós-kenyérhéjas, elegáns malátás lager – az Osztrák–Magyar Monarchia klasszikusa.',
    malts: [['wey-vienna', 3.4], ['wey-munich1', 0.8], ['wey-carared', 0.2], ['wey-caramunich2', 0.25]],
    hops: [['hallertau-mf', 35, 'boil', 60], ['saaz', 20, 'boil', 15]],
    yeast: 'w3470', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'malty' },
  },
  {
    id: 'p-esb', name: 'Extra Special Bitter (ESB)', styleId: '11C', level: 'kezdő', mashTemp: 66,
    desc: 'Angol kocsmaklasszikus: kekszes-karamelles maláta, földes-virágos East Kent Goldings, enyhén gyümölcsös élesztő.',
    malts: [['vik-pale', 4.0], ['wey-caramunich1', 0.35], ['wey-melanoidin', 0.15]],
    hops: [['challenger', 33, 'boil', 60], ['ekg', 25, 'boil', 15], ['ekg', 25, 'boil', 2]],
    yeast: 's04', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'balanced' }, carbVols: 2.0,
  },
  {
    id: 'p-amber', name: 'Amerikai amber ale', styleId: '19A', level: 'kezdő', mashTemp: 66,
    desc: 'Karamell és citrus egyensúlya: Munich és karamellmaláták, Centennial és Cascade komlózás.',
    malts: [['vik-pale', 4.0], ['wey-munich1', 0.5], ['vik-cara100', 0.45], ['vik-cara300', 0.08]],
    hops: [['magnum', 12, 'boil', 60], ['centennial', 25, 'boil', 10], ['cascade', 30, 'whirlpool', 20]],
    yeast: 'us05', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'balanced' },
  },
  {
    id: 'p-saison', name: 'Farmhouse saison', styleId: '25B', level: 'haladó', mashTemp: 64,
    desc: 'Csontszáraz, borsos-citrusos belga farmház sör. Az élesztőt engedd szabadon felmelegedni 26-28 °C-ig.',
    malts: [['wey-pils', 3.6], ['wey-wheat', 0.5], ['wey-munich2', 0.6], ['sugar-dextrose', 0.25]],
    hops: [['magnum', 14, 'boil', 60], ['celeia', 30, 'boil', 10], ['saaz', 30, 'whirlpool', 15]],
    yeast: 'belle-saison', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'belgian' }, carbVols: 3.0,
  },
  {
    id: 'p-dubbel', name: 'Belga dubbel', styleId: '26B', level: 'haladó', mashTemp: 66,
    desc: 'Mély borostyán, mazsolás-aszalt szilvás, karamelles apátsági sör sötét kandiszirupból és Abbey malátából.',
    malts: [['wey-pils', 4.2], ['wey-munich2', 0.6], ['wey-abbey', 0.3], ['wey-caramunich3', 0.1], ['sugar-candi-dark', 0.4]],
    hops: [['magnum', 12, 'boil', 60], ['saaz', 20, 'boil', 15]],
    yeast: 'be256', adjuncts: [['nutrient', 10, 'boil', 10], ['whirlfloc', 1, 'boil', 15]], water: { targetId: 'belgian' },
  },
  {
    id: 'p-schwarz', name: 'Schwarzbier', styleId: '8B', level: 'profi', mashTemp: 67,
    desc: 'Fekete, mégis könnyed lager: héjatlanított Carafa adja a színt és a lágy pörkölést, égett keserűség nélkül.',
    malts: [['wey-pils', 2.5], ['wey-munich1', 1.5], ['wey-carafa2', 0.2], ['wey-caramunich1', 0.2]],
    hops: [['magnum', 13, 'boil', 60], ['hallertau-mf', 20, 'boil', 15]],
    yeast: 'w3470', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'dark' },
  },
  {
    id: 'p-rauch', name: 'Bambergi füstölt sör', styleId: '6B', level: 'haladó', mashTemp: 67,
    desc: 'Bükkfán füstölt maláta adja a sonkás-tábortüzes karaktert, alatta gazdag Märzen-maláta.',
    malts: [['wey-smoked', 3.1], ['wey-munich1', 1.5], ['wey-caramunich2', 0.3], ['wey-carafa1', 0.08]],
    hops: [['hallertau-mf', 50, 'boil', 60]],
    yeast: 'w3470', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'malty' },
  },
  {
    id: 'p-ryeipa', name: 'Rozs IPA', styleId: '21B-rye', level: 'haladó', mashTemp: 65,
    desc: 'Fűszeres rozsmaláta és fenyős-citrusos amerikai komlók – szárazabb, borsosabb IPA.',
    malts: [['vik-pale', 4.3], ['wey-rye', 1.0], ['vik-cara50', 0.25]],
    hops: [['magnum', 25, 'boil', 60], ['simcoe', 25, 'boil', 10], ['chinook', 40, 'whirlpool', 20], ['simcoe', 40, 'dry', 4]],
    yeast: 'us05', adjuncts: [['whirlfloc', 1, 'boil', 15]], water: { targetId: 'hoppy' },
  },

  // ===================== Ízesített sörök =====================
  {
    id: 'p-mocha', name: 'Mokka porter', styleId: '20A', level: 'kezdő', mashTemp: 67,
    desc: 'Csokoládés-kávés porter kakaóbab-töretttel és hidegen áztatott specialty kávéval – mint egy jeges mokka.',
    malts: [['vik-pale', 4.3], ['wey-munich1', 0.4], ['vik-choc', 0.35], ['wey-caramunich2', 0.3], ['wey-carafa2', 0.1]],
    hops: [['magnum', 17, 'boil', 60], ['ekg', 20, 'boil', 15]],
    yeast: 'us05', adjuncts: [['cacao-nibs', 100, 'secondary', 7], ['coffee', 50, 'secondary', 1]], water: { targetId: 'dark' },
  },
  {
    id: 'p-barrel', name: 'Hordós imperial stout', styleId: '20C', level: 'profi', mashTemp: 67,
    desc: 'Óriási, olajos imperial stout amerikai tölgyfa chipsszel és vaníliával – bourbon-hordós jelleg hordó nélkül. Hónapokig érlelhető.',
    malts: [['vik-pale', 6.8], ['wey-munich1', 0.6], ['flake-oat', 0.5], ['vik-choc', 0.3], ['wey-roastbarley', 0.2], ['wey-caramunich3', 0.25]],
    hops: [['magnum', 50, 'boil', 60], ['ekg', 25, 'boil', 15]],
    yeast: 'us05', adjuncts: [['nutrient', 10, 'boil', 10], ['oak-american', 40, 'secondary', 14], ['vanilla', 2, 'secondary', 7]],
    water: { targetId: 'dark' }, carbVols: 1.9,
  },
  {
    id: 'p-winter', name: 'Fűszeres téli ale', styleId: '19A', level: 'kezdő', mashTemp: 67,
    desc: 'Karácsonyi borostyán ale fahéjjal, gyömbérrel, narancshéjjal és mézzel – mint a forralt bor, csak sörben. A méz bolti termék.',
    malts: [['vik-pale', 3.8], ['wey-munich1', 0.6], ['vik-cara150', 0.45], ['sugar-honey', 0.4]],
    hops: [['magnum', 16, 'boil', 60], ['ekg', 20, 'boil', 15]],
    yeast: 'nottingham', adjuncts: [['cinnamon', 5, 'boil', 5], ['ginger', 8, 'boil', 10], ['orange-sweet', 15, 'boil', 5], ['clove', 1, 'boil', 5]],
    water: { targetId: 'malty' },
  },
  {
    id: 'p-milkshake', name: 'Mangós milkshake IPA', styleId: '21C', level: 'haladó', mashTemp: 65,
    desc: 'Krémes, gyümölcslészerű hazy IPA laktózzal, vaníliával és mangópürével, trópusi komlókkal. A mangópüré bolti termék.',
    malts: [['vik-pale', 4.6], ['flake-oat', 0.8], ['wey-wheat', 0.5], ['sugar-lactose', 0.3]],
    hops: [['magnum', 8, 'boil', 60], ['citra', 50, 'whirlpool', 20], ['galaxy', 30, 'whirlpool', 20], ['citra', 50, 'dry', 3], ['el-dorado', 30, 'dry', 3]],
    yeast: 'verdant', adjuncts: [['mango-puree', 1500, 'secondary', 5], ['vanilla', 1, 'secondary', 5]],
    water: { targetId: 'neipa' }, carbVols: 2.3,
  },
  {
    id: 'p-raspwheat', name: 'Málnás búzasör', styleId: '1D', level: 'kezdő', mashTemp: 66,
    desc: 'Könnyed, rózsaszínes nyári búzasör tiszta élesztővel, hogy a málna domináljon. A málna bolti termék (fagyasztott).',
    malts: [['wey-wheat', 2.2], ['wey-pils', 1.8], ['wey-carapils', 0.15]],
    hops: [['magnum', 9, 'boil', 60], ['hallertau-blanc', 20, 'boil', 5]],
    yeast: 'us05', adjuncts: [['raspberry', 2000, 'secondary', 7]], water: { targetId: 'balanced' },
  },
  {
    id: 'p-cherrystout', name: 'Meggyes stout', styleId: '20B', level: 'haladó', mashTemp: 67,
    desc: 'Étcsokoládés stout savanykás meggyel – mint egy feketeerdő torta. A meggy bolti termék (magozott, fagyasztott).',
    malts: [['vik-pale', 4.6], ['vik-choc', 0.35], ['wey-roastbarley', 0.25], ['wey-caramunich2', 0.3], ['flake-oat', 0.3]],
    hops: [['magnum', 26, 'boil', 60], ['ekg', 20, 'boil', 15]],
    yeast: 'us05', adjuncts: [['sour-cherry', 2500, 'secondary', 10], ['cacao-nibs', 60, 'secondary', 7]], water: { targetId: 'dark' },
  },
  {
    id: 'p-lavender', name: 'Mézes-levendulás blonde', styleId: '18A', level: 'kezdő', mashTemp: 65,
    desc: 'Aranyszőke, könnyed ale méz és egy leheletnyi levendula virágosságával. A méz bolti termék.',
    malts: [['wey-pils', 3.2], ['vik-vienna', 0.4], ['wey-carahell', 0.15], ['sugar-honey', 0.3]],
    hops: [['magnum', 10, 'boil', 60], ['saphir', 25, 'boil', 5]],
    yeast: 'us05', adjuncts: [['lavender', 2, 'flameout', 0], ['chamomile', 5, 'flameout', 0]], water: { targetId: 'balanced' },
  },
];

export const LEVEL_ORDER = { kezdő: 0, haladó: 1, profi: 2 } as const;
