import type { BeerStyle, Recipe } from '../types';
import { STYLES } from '../data/styles';
import { YEAST_KIND_LABEL } from '../data/yeasts';
import { getHop, getYeast } from './catalog';
import { tinsethUtil, type Stats } from './calc';
import { t, dec, sg } from '../i18n';
import { hopName } from './names';

export type ParamKey = 'og' | 'fg' | 'abv' | 'ibu' | 'srm';

export interface ParamCheck {
  key: ParamKey;
  value: number;
  range: [number, number];
  status: 'ok' | 'low' | 'high';
  score: number;
}

export interface StyleMatch {
  style: BeerStyle;
  score: number; // 0-100
  params: ParamCheck[];
  yeastOk: boolean | null;
  missing: string[];
}

const TOL: Record<ParamKey, number> = { og: 0.008, fg: 0.004, abv: 1, ibu: 10, srm: 4 };
const W: Record<ParamKey, number> = { og: 0.2, fg: 0.15, abv: 0.15, ibu: 0.2, srm: 0.2 };

function check(key: ParamKey, value: number, range: [number, number]): ParamCheck {
  const [lo, hi] = range;
  const tol = Math.max(hi - lo, TOL[key]);
  if (value < lo) return { key, value, range, status: 'low', score: Math.max(0, 1 - (lo - value) / tol) };
  if (value > hi) return { key, value, range, status: 'high', score: Math.max(0, 1 - (value - hi) / tol) };
  return { key, value, range, status: 'ok', score: 1 };
}

export function matchStyle(style: BeerStyle, s: Stats, r: Recipe): StyleMatch {
  const params: ParamCheck[] = [
    check('og', s.og, style.og),
    check('fg', s.fg, style.fg),
    check('abv', s.abv, style.abv),
    check('ibu', s.ibu, style.ibu),
    check('srm', s.srm, style.srm),
  ];
  let score = params.reduce((acc, p) => acc + p.score * W[p.key], 0);
  const yeast = getYeast(r.yeastId);
  const yeastOk = yeast ? style.yeast.includes(yeast.kind) : null;
  score += yeastOk === null ? 0.05 : yeastOk ? 0.1 : 0.02;
  const missing = (style.requires ?? []).filter((req) => !req.tags.some((t) => s.tags.has(t))).map((req) => req.label);
  score *= Math.pow(0.8, missing.length);
  if (yeastOk === false) score *= 0.85;
  return { style, score: Math.round(score * 100), params, yeastOk, missing };
}

export function rankStyles(s: Stats, r: Recipe, n = 5): StyleMatch[] {
  if (s.empty) return [];
  return STYLES.map((st) => matchStyle(st, s, r))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

export const PARAM_LABEL: Record<ParamKey, string> = {
  og: 'Kezdeti sűrűség (OG)',
  fg: 'Végső sűrűség (FG)',
  abv: 'Alkohol',
  ibu: 'Keserűség (IBU)',
  srm: 'Szín',
};
export const paramLabel = (k: ParamKey) => t(PARAM_LABEL[k]);

/** Konkrét, számszerű javaslatok a célstílus eléréséhez. */
export function styleHints(m: StyleMatch, s: Stats, r: Recipe): string[] {
  const hints: string[] = [];
  const eff = r.method === 'extract' ? 1 : r.efficiency / 100;
  const L = r.batchL;
  const get = (k: ParamKey) => m.params.find((p) => p.key === k)!;
  const kinds = (st: BeerStyle) => st.yeast.map((k) => t(YEAST_KIND_LABEL[k])).join(' / ');

  const og = get('og');
  if (og.status !== 'ok') {
    const target = (og.range[0] + og.range[1]) / 2;
    const dPts = (target - s.og) * 1000;
    const kg = dec(Math.abs((dPts * L) / (0.8 * 385.6 * eff)), 2);
    const what = r.method === 'extract' ? t('szárított malátakivonatot') : t('alapmalátát');
    hints.push(
      og.status === 'low'
        ? t('Túl alacsony OG: adj hozzá kb. {kg} kg {what} (cél ~{target}).', { kg, what, target: sg(target) })
        : t('Túl magas OG: vegyél el kb. {kg} kg {what}, vagy növeld a batch méretét.', { kg, what }),
    );
  }

  const ibu = get('ibu');
  if (ibu.status !== 'ok') {
    const target = (ibu.range[0] + ibu.range[1]) / 2;
    const dIbu = target - s.ibu;
    const bitterLine = r.hops.find((h) => h.use === 'boil' && h.time >= 45);
    const hop = getHop(bitterLine?.id ?? 'magnum')!;
    const util = tinsethUtil(s.og, 60);
    const g = Math.abs((dIbu * (L + r.equipment.kettleLossL)) / (util * (hop.alpha / 100) * 1000)).toFixed(0);
    hints.push(
      dIbu > 0
        ? t('Kevés keserűség: +{g} g {hop} 60 percnél ≈ +{ibu} IBU.', { g, hop: hopName(hop), ibu: dIbu.toFixed(0) })
        : t('Túl keserű: {g} g-mal kevesebb {hop} a 60 perces adagban, vagy tedd későbbre a komlót.', { g, hop: hopName(hop) }),
    );
  }

  const srm = get('srm');
  if (srm.status === 'low') {
    hints.push(
      srm.range[0] > 20
        ? t('Világos a szín: adj hozzá pörkölt malátát (pl. Carafa Special, Chocolate) – 100-200 g/20 L is sokat sötétít.')
        : t('Világos a szín: kevés karamell maláta (Caramunich, Caramel 50-150) vagy müncheni maláta segít.'),
    );
  } else if (srm.status === 'high') {
    hints.push(t('Túl sötét: csökkentsd a karamell/pörkölt malátákat, vagy cseréld világosabbra.'));
  }

  const fg = get('fg');
  if (fg.status === 'high') {
    hints.push(t('Magas FG (édes, testes): cefrézz alacsonyabban (64-65 °C), használj jobban erjesztő élesztőt, vagy cseréld a karamellmaláta egy részét cukorra.'));
  } else if (fg.status === 'low') {
    hints.push(t('Alacsony FG (nagyon száraz): cefrézz magasabban (67-69 °C), adj Carapils-t vagy zabpelyhet, vagy válassz kevésbé erjesztő élesztőt.'));
  }

  if (m.yeastOk === false) {
    hints.push(t('Az élesztő típusa nem stílusos – javasolt: {kinds}.', { kinds: kinds(m.style) }));
  } else if (m.yeastOk === null) {
    hints.push(t('Válassz élesztőt ({kinds}).', { kinds: kinds(m.style) }));
  }
  for (const miss of m.missing) hints.push(t('Hiányzik a stílusra jellemző összetevő: {what}.', { what: t(miss) }));
  return hints;
}
