import { EN } from './en';
import { DE } from './de';
import { DATA_EN, DATA_DE, type DataDict } from './data';

import { getLang, locale } from './lang';
export { LANGS, BRAND, getLang, setLang, locale, brand, onLangChange, type Lang } from './lang';

const DICTS: Record<string, Record<string, string> | null> = { hu: null, en: EN, de: DE };
const DATA: Record<string, DataDict | null> = { hu: null, en: DATA_EN, de: DATA_DE };

/**
 * Fordítás: a kulcs a magyar szöveg. {név} helyőrzők a `vars`-ból.
 * Hiányzó fordításnál a magyar szöveg jelenik meg (soha nem üres).
 */
export function t(hu: string, vars?: Record<string, string | number>): string {
  const dict = DICTS[getLang()];
  let s = (dict && dict[hu]) || hu;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return s;
}

type DataKind = keyof DataDict;
/** Katalógus/stílus/recept adat fordítása azonosító alapján. */
export function td(kind: DataKind, id: string, field: 'name' | 'desc', fallback: string): string {
  const d = DATA[getLang()];
  const entry = d?.[kind]?.[id] as { name?: string; desc?: string } | undefined;
  return entry?.[field] ?? fallback;
}

// ---- Szám- és dátumformázás a nyelvnek megfelelően ----

/** Tizedes: magyar/német vessző, angol pont. */
export function dec(n: number, d = 1): string {
  if (!Number.isFinite(n)) return '–';
  const s = n.toFixed(d);
  return getLang() === 'en' ? s : s.replace('.', ',');
}
export const sg = (n: number) => dec(n, 3);
export const huf = (n: number) => `${Math.round(n).toLocaleString(locale())} ${getLang() === 'hu' ? 'Ft' : 'HUF'}`;
export const dateStr = (ms: number) => new Date(ms).toLocaleDateString(locale());
export const dateTimeStr = (ms: number) =>
  new Date(ms).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' });
