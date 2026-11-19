import { MALTS } from '../data/malts';
import { HOPS } from '../data/hops';
import { YEASTS } from '../data/yeasts';
import { ADJUNCTS } from '../data/adjuncts';
import { STYLES } from '../data/styles';
import type { Malt, Hop, Yeast, Adjunct, BeerStyle } from '../types';

const index = <T extends { id: string }>(arr: T[]) => new Map(arr.map((x) => [x.id, x]));

const maltMap = index(MALTS);
const hopMap = index(HOPS);
const yeastMap = index(YEASTS);
const adjunctMap = index(ADJUNCTS);
const styleMap = index(STYLES);

export const getMalt = (id: string): Malt | undefined => maltMap.get(id);
export const getHop = (id: string): Hop | undefined => hopMap.get(id);
export const getYeast = (id: string | null): Yeast | undefined => (id ? yeastMap.get(id) : undefined);
export const getAdjunct = (id: string): Adjunct | undefined => adjunctMap.get(id);
export const getStyle = (id: string | null): BeerStyle | undefined => (id ? styleMap.get(id) : undefined);

export const hoplineSearchUrl = (name: string) =>
  `https://www.hopline.hu/shop_search.php?search=${encodeURIComponent(name)}`;

let counter = 0;
export const uid = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;
