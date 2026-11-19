/**
 * Könnyű nyelvkezelés (szótárak nélkül) – ezt a landing oldal is használja,
 * így nem kell betöltenie a főzőpult teljes fordítását.
 */
export type Lang = 'hu' | 'en' | 'de';
export const LANGS: { id: Lang; label: string; flag: string; locale: string }[] = [
  { id: 'hu', label: 'Magyar', flag: '🇭🇺', locale: 'hu-HU' },
  { id: 'en', label: 'English', flag: '🇬🇧', locale: 'en-GB' },
  { id: 'de', label: 'Deutsch', flag: '🇩🇪', locale: 'de-DE' },
];

/** Márka nyelvenként – egy helyen módosítható. */
export const BRAND: Record<Lang, { name: string; tagline: string }> = {
  hu: { name: 'Sörlabor', tagline: 'főzőpult · otthoni sörfőzés' },
  en: { name: 'BeerLab', tagline: 'brewhouse · home brewing' },
  de: { name: 'Bierlabor', tagline: 'Sudhaus · Heimbrauen' },
};

const KEY = 'sorlabor.lang.v1';

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'hu' || saved === 'en' || saved === 'de') return saved;
  } catch {
    /* nem elérhető */
  }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'hu').toLowerCase();
  if (nav.startsWith('hu')) return 'hu';
  if (nav.startsWith('de')) return 'de';
  return 'en';
}

let current: Lang = detect();
const listeners = new Set<(l: Lang) => void>();

export const getLang = () => current;
export const locale = () => LANGS.find((l) => l.id === current)!.locale;
export const brand = () => BRAND[current];

export function setLang(l: Lang) {
  current = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* nem elérhető */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = l;
  }
  listeners.forEach((fn) => fn(l));
}

/** Feliratkozás nyelvváltásra (pl. a landing és a főzőpult közös állapotához). */
export function onLangChange(fn: (l: Lang) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

if (typeof document !== 'undefined') document.documentElement.lang = current;
