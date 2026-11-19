import type { Lang } from '../i18n/lang';

/** A landing oldal szövegei – külön, kis szótár, hogy a landing gyorsan betöltődjön. */
export interface LandingText {
  nav: { features: string; recipes: string; how: string; colors: string; open: string; install: string };
  hero: { eyebrow: string; title1: string; title2: string; sub: string; cta: string; tour: string; recipes: string };
  chips: string[];
  glassLabel: string;
  scroll: string;
  features: { title: string; sub: string; items: { icon: string; title: string; text: string }[] };
  how: { title: string; sub: string; steps: { title: string; text: string }[] };
  colors: { title: string; sub: string; beers: string[] };
  recipes: { eyebrow: string; title: string; sub: string; brew: string; all: string; flavored: string; levels: Record<'kezdő' | 'haladó' | 'profi', string> };
  stats: { value: string; label: string }[];
  final: { title: string; sub: string; cta: string; recipes: string };
  footer: string;
  privacy: string;
}

const HU: LandingText = {
  nav: { features: 'Funkciók', recipes: 'Receptek', how: 'Hogyan működik', colors: 'Sörszínek', open: 'Főzőpult', install: 'Telepítés' },
  hero: {
    eyebrow: 'Otthoni sörfőzés, laborpontossággal',
    title1: 'Főzd meg a',
    title2: 'tökéletes söröd.',
    sub: 'Rakd össze a receptet maláta, komló és élesztő szerint – a Sörlabor azonnal kiszámolja, milyen sör lesz belőle, és lépésről lépésre végigvezet a főzőnapon.',
    cta: 'Főzőpult megnyitása',
    tour: 'Bemutató indítása',
    recipes: 'Bevált receptek',
  },
  chips: ['OG · FG · IBU · EBC élőben', 'BJCP stílusegyezés', 'Főzőnap időzítővel'],
  glassLabel: 'Animált söröspohár',
  scroll: 'Görgess tovább',
  features: {
    title: 'Minden, ami egy jó főzéshez kell',
    sub: 'A recepttől a palackozásig – egy helyen, valós számításokkal.',
    items: [
      { icon: '🌾', title: 'Receptépítő', text: 'Weyermann és Viking maláták, 35 komló, 30 élesztő, fűszerek és adalékok a hopline.hu kínálatából.' },
      { icon: '📊', title: 'Élő számítások', text: 'Sűrűség, alkohol, keserűség, szín és ízprofil – minden változtatásra azonnal frissül.' },
      { icon: '🏅', title: 'Stílusegyezés', text: '45 BJCP stílus, százalékos egyezés és konkrét tippek: mit adj hozzá, mit vegyél el.' },
      { icon: '🔥', title: 'Főzőnap mód', text: 'Lépésenkénti vezetés visszaszámlálóval és hangjelzéssel minden komló-hozzáadásnál.' },
      { icon: '🎯', title: 'Kalibráció', text: 'A mért értékekből megtanulja a saját rendszered hatásfokát – főzésről főzésre pontosabb.' },
      { icon: '💧', title: 'Vízkémia & bevásárlás', text: 'Sók, cefre pH, és bevásárlólista becsült árakkal, hopline linkekkel.' },
    ],
  },
  how: {
    title: 'Három lépés a sörig',
    sub: 'Kezdőként egy bevált recepttel, haladóként a saját ötleteddel.',
    steps: [
      { title: 'Tervezd meg', text: 'Válassz célstílust és hozzávalókat, vagy tölts be egyet a 31 beépített receptből.' },
      { title: 'Főzd meg', text: 'A főzőnap mód végigvezet a cefrézéstől a hűtésig, időzítőkkel és mérési pontokkal.' },
      { title: 'Finomítsd', text: 'Rögzítsd a mért értékeket – a következő sör már a saját rendszeredre szabva készül.' },
    ],
  },
  colors: {
    title: 'Szalmasárgától a fekete stoutig',
    sub: 'A szín a malátákból számolódik – így néz ki néhány klasszikus.',
    beers: ['Pilsner', 'Hefeweizen', 'Pale Ale', 'IPA', 'Märzen', 'Ír vörös', 'Porter', 'Stout'],
  },
  recipes: {
    eyebrow: '31 bevált recept',
    title: 'Válassz egyet, és már főzheted is',
    sub: 'Kipróbált, stílushű receptek kezdőtől profiig – klasszikusok és ízesített különlegességek. Egy kattintás, és a főzőpult mindent kiszámol hozzá.',
    brew: 'Megfőzöm',
    all: 'Mind a 31 recept',
    flavored: 'ízesített',
    levels: { kezdő: 'kezdő', haladó: 'haladó', profi: 'profi' },
  },
  stats: [
    { value: '140+', label: 'alapanyag' },
    { value: '45', label: 'BJCP stílus' },
    { value: '31', label: 'beépített recept' },
    { value: '3', label: 'nyelv' },
  ],
  final: {
    title: 'Ideje begyújtani az üstöt.',
    sub: 'Ingyenes, regisztráció nélkül, minden adat a böngésződben marad.',
    cta: 'Irány a főzőpult',
    recipes: 'Bevált recepttel kezdek',
  },
  footer: 'Alapanyagok a hopline.hu kínálata alapján. Az értékek becslések – mérj, jegyzetelj, kísérletezz.',
  privacy: 'Adatvédelmi tájékoztató',
};

const EN: LandingText = {
  nav: { features: 'Features', recipes: 'Recipes', how: 'How it works', colors: 'Beer colours', open: 'Brewhouse', install: 'Install' },
  hero: {
    eyebrow: 'Home brewing with lab precision',
    title1: 'Brew your',
    title2: 'perfect beer.',
    sub: 'Build your recipe from malt, hops and yeast – BeerLab instantly calculates what kind of beer it will be and guides you step by step through brew day.',
    cta: 'Open the brewhouse',
    tour: 'Take the tour',
    recipes: 'Proven recipes',
  },
  chips: ['OG · FG · IBU · EBC live', 'BJCP style matching', 'Brew day with timers'],
  glassLabel: 'Animated beer glass',
  scroll: 'Scroll on',
  features: {
    title: 'Everything a great brew day needs',
    sub: 'From recipe to bottling – in one place, with real calculations.',
    items: [
      { icon: '🌾', title: 'Recipe builder', text: 'Weyermann and Viking malts, 35 hops, 30 yeasts, spices and additives from the hopline.hu range.' },
      { icon: '📊', title: 'Live calculations', text: 'Gravity, alcohol, bitterness, colour and flavour profile – updated instantly on every change.' },
      { icon: '🏅', title: 'Style matching', text: '45 BJCP styles, a percentage match and concrete tips on what to add or remove.' },
      { icon: '🔥', title: 'Brew day mode', text: 'Step-by-step guidance with a countdown and a sound alert for every hop addition.' },
      { icon: '🎯', title: 'Calibration', text: 'Learns your system’s real efficiency from your measurements – more accurate with every brew.' },
      { icon: '💧', title: 'Water & shopping', text: 'Salts, mash pH, and a shopping list with estimated prices and hopline links.' },
    ],
  },
  how: {
    title: 'Three steps to beer',
    sub: 'Start with a proven recipe as a beginner, or your own idea when you’re ready.',
    steps: [
      { title: 'Plan it', text: 'Pick a target style and ingredients, or load one of the 31 built-in recipes.' },
      { title: 'Brew it', text: 'Brew day mode guides you from mash to chill, with timers and measurement points.' },
      { title: 'Refine it', text: 'Log your measurements – your next beer is tuned to your own system.' },
    ],
  },
  colors: {
    title: 'From straw to jet-black stout',
    sub: 'Colour is calculated from the malts – here’s how a few classics look.',
    beers: ['Pilsner', 'Hefeweizen', 'Pale Ale', 'IPA', 'Märzen', 'Irish Red', 'Porter', 'Stout'],
  },
  recipes: {
    eyebrow: '31 proven recipes',
    title: 'Pick one and start brewing',
    sub: 'Tested, true-to-style recipes from beginner to pro – classics and flavoured specialities. One click and the brewhouse calculates everything for you.',
    brew: 'Brew this',
    all: 'All 31 recipes',
    flavored: 'flavoured',
    levels: { kezdő: 'beginner', haladó: 'intermediate', profi: 'pro' },
  },
  stats: [
    { value: '140+', label: 'ingredients' },
    { value: '45', label: 'BJCP styles' },
    { value: '31', label: 'built-in recipes' },
    { value: '3', label: 'languages' },
  ],
  final: {
    title: 'Time to fire up the kettle.',
    sub: 'Free, no sign-up, all your data stays in your browser.',
    cta: 'Into the brewhouse',
    recipes: 'Start with a proven recipe',
  },
  footer: 'Ingredients based on the hopline.hu range. All values are estimates – measure, take notes, experiment.',
  privacy: 'Privacy policy',
};

const DE: LandingText = {
  nav: { features: 'Funktionen', recipes: 'Rezepte', how: 'So funktioniert’s', colors: 'Bierfarben', open: 'Sudhaus', install: 'Installieren' },
  hero: {
    eyebrow: 'Heimbrauen mit Laborpräzision',
    title1: 'Braue dein',
    title2: 'perfektes Bier.',
    sub: 'Stelle dein Rezept aus Malz, Hopfen und Hefe zusammen – das Bierlabor berechnet sofort, was für ein Bier daraus wird, und führt dich Schritt für Schritt durch den Brautag.',
    cta: 'Sudhaus öffnen',
    tour: 'Tour starten',
    recipes: 'Bewährte Rezepte',
  },
  chips: ['OG · FG · IBU · EBC live', 'BJCP-Stilabgleich', 'Brautag mit Timern'],
  glassLabel: 'Animiertes Bierglas',
  scroll: 'Weiter scrollen',
  features: {
    title: 'Alles, was ein guter Brautag braucht',
    sub: 'Vom Rezept bis zur Abfüllung – an einem Ort, mit echten Berechnungen.',
    items: [
      { icon: '🌾', title: 'Rezeptbaukasten', text: 'Weyermann- und Viking-Malze, 35 Hopfen, 30 Hefen, Gewürze und Zusätze aus dem Sortiment von hopline.hu.' },
      { icon: '📊', title: 'Live-Berechnungen', text: 'Dichte, Alkohol, Bittere, Farbe und Aromaprofil – bei jeder Änderung sofort aktualisiert.' },
      { icon: '🏅', title: 'Stilabgleich', text: '45 BJCP-Stile, prozentuale Übereinstimmung und konkrete Tipps, was hinzu- oder wegkommt.' },
      { icon: '🔥', title: 'Brautag-Modus', text: 'Schritt-für-Schritt-Anleitung mit Countdown und Tonsignal bei jeder Hopfengabe.' },
      { icon: '🎯', title: 'Kalibrierung', text: 'Lernt aus deinen Messwerten die echte Ausbeute deiner Anlage – mit jedem Sud genauer.' },
      { icon: '💧', title: 'Wasser & Einkauf', text: 'Salze, Maische-pH und eine Einkaufsliste mit geschätzten Preisen und hopline-Links.' },
    ],
  },
  how: {
    title: 'In drei Schritten zum Bier',
    sub: 'Als Einsteiger mit einem bewährten Rezept, später mit deiner eigenen Idee.',
    steps: [
      { title: 'Planen', text: 'Wähle Zielstil und Zutaten oder lade eines der 31 mitgelieferten Rezepte.' },
      { title: 'Brauen', text: 'Der Brautag-Modus führt dich vom Maischen bis zum Kühlen – mit Timern und Messpunkten.' },
      { title: 'Verfeinern', text: 'Erfasse deine Messwerte – das nächste Bier ist auf deine Anlage abgestimmt.' },
    ],
  },
  colors: {
    title: 'Von strohgelb bis tiefschwarz',
    sub: 'Die Farbe wird aus den Malzen berechnet – so sehen ein paar Klassiker aus.',
    beers: ['Pilsner', 'Hefeweizen', 'Pale Ale', 'IPA', 'Märzen', 'Irish Red', 'Porter', 'Stout'],
  },
  recipes: {
    eyebrow: '31 bewährte Rezepte',
    title: 'Such dir eins aus und leg los',
    sub: 'Erprobte, stiltreue Rezepte vom Einsteiger bis zum Profi – Klassiker und aromatisierte Spezialitäten. Ein Klick, und das Sudhaus berechnet alles für dich.',
    brew: 'Jetzt brauen',
    all: 'Alle 31 Rezepte',
    flavored: 'aromatisiert',
    levels: { kezdő: 'Einsteiger', haladó: 'Fortgeschritten', profi: 'Profi' },
  },
  stats: [
    { value: '140+', label: 'Zutaten' },
    { value: '45', label: 'BJCP-Stile' },
    { value: '31', label: 'Rezepte' },
    { value: '3', label: 'Sprachen' },
  ],
  final: {
    title: 'Zeit, den Kessel anzuheizen.',
    sub: 'Kostenlos, ohne Anmeldung – alle Daten bleiben in deinem Browser.',
    cta: 'Ab ins Sudhaus',
    recipes: 'Mit bewährtem Rezept starten',
  },
  footer: 'Zutaten basierend auf dem Sortiment von hopline.hu. Alle Werte sind Schätzungen – messen, notieren, experimentieren.',
  privacy: 'Datenschutz',
};

export const LANDING_TEXT: Record<Lang, LandingText> = { hu: HU, en: EN, de: DE };
