import type { Recipe } from '../types';
import { getYeast } from './catalog';
import { colorName, FLAVOR_AXES, type Stats } from './calc';
import { t, dec } from '../i18n';
import { hopDescriptors, hopName, yeastName } from './names';

/** Emberi nyelvű leírás az összerakott sörről. */
export function describeBeer(r: Recipe, s: Stats): string[] {
  if (s.empty) return [t('Adj hozzá malátát vagy kivonatot – a sör leírása itt jelenik meg.')];
  const out: string[] = [];
  const strength =
    s.abv < 3.5 ? t('könnyű, alacsony alkoholtartalmú')
      : s.abv < 5 ? t('könnyen iható, session erősségű')
        : s.abv < 6.5 ? t('közepes erősségű')
          : s.abv < 8.5 ? t('erős')
            : t('nagyon erős, melegítő alkoholú');
  const balance =
    s.buGu < 0.35 ? t('kifejezetten malátás-édeskés')
      : s.buGu < 0.55 ? t('malátás felé hajló')
        : s.buGu < 0.75 ? t('kiegyensúlyozott')
          : s.buGu < 1.0 ? t('határozottan keserű')
            : t('nagyon keserű, komlódomináns');
  out.push(t('{color}, {strength} sör ({abv}% alkohol), {balance} egyensúllyal.', {
    color: capital(colorName(s.ebc)), strength, abv: dec(s.abv, 1), balance,
  }));

  const ranked = FLAVOR_AXES.filter((a) => a.key !== 'body' && a.key !== 'bitter')
    .map((a) => ({ ...a, v: s.flavor[a.key] }))
    .filter((a) => a.v >= 3)
    .sort((a, b) => b.v - a.v)
    .slice(0, 3);
  if (ranked.length) {
    out.push(t('Domináns jegyek: {list}.', { list: ranked.map((a) => `${t(a.label).toLowerCase()} (${t(a.hint)})`).join('; ') }));
  }

  const body = s.flavor.body;
  const bodyTxt = body < 3 ? t('könnyű, vizes-száraz') : body < 5 ? t('közepesen könnyű') : body < 7 ? t('közepes, kerek') : t('telt, krémes');
  const finish = s.fg < 1.008 ? t('csontszáraz') : s.fg < 1.012 ? t('száraz') : s.fg < 1.018 ? t('enyhén édeskés') : t('édes, likőrös');
  out.push(t('Teste {body}, a lecsengés {finish}.', { body: bodyTxt, finish }));

  const aromaHops = s.hops.filter((h) => h.line.use !== 'boil' || h.line.time <= 20);
  if (aromaHops.length) {
    const desc = Array.from(new Set(aromaHops.flatMap((h) => hopDescriptors(h.hop)))).slice(0, 6);
    out.push(t('A komlóaromát {hops} adja: {desc}.', { hops: uniq(aromaHops.map((h) => hopName(h.hop))).join(', '), desc: desc.join(', ') }));
  }

  const y = getYeast(r.yeastId);
  if (y) {
    const char =
      y.ester >= 6 && y.phenol >= 5 ? t('gyümölcsös-fűszeres élesztőkarakter (észterek és fenolok)')
        : y.ester >= 5 ? t('gyümölcsös észterek')
          : y.phenol >= 5 ? t('fűszeres, borsos fenolok')
            : t('tiszta, semleges erjedés – a maláta és komló dominál');
    out.push(t('Élesztő: {yeast} → {char}.', { yeast: yeastName(y), char }));
  } else {
    out.push(t('Még nincs élesztő kiválasztva – az ízprofil és az FG becslése általános értékkel számol.'));
  }
  return out;
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const uniq = <T,>(a: T[]) => Array.from(new Set(a));
