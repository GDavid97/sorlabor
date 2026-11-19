import { useEffect, useMemo, useRef, useState } from 'react';
import './styles.css';
import type { BrewMethod, BrewSession, Recipe } from './types';
import { STYLES } from './data/styles';
import { EQUIPMENT_DEFAULTS } from './data/water';
import { computeStats } from './lib/calc';
import { getStyle } from './lib/catalog';
import { suggestTargetId } from './lib/water';
import {
  download, fileSafe, loadCurrent, loadLibrary, newRecipe, normalize, saveCurrent, saveLibrary, toBeerXml,
} from './lib/storage';
import { IngredientPanel } from './components/IngredientPanel';
import { Description, FlavorRadar, StyleMatchCard, Summary, BeerGlass } from './components/Results';
import { PlanPanel, type PlanTab } from './components/Plans';
import { BrewMode } from './components/BrewMode';
import { applyCalibration, loadDefaults, loadSessions, newSession, saveSessions } from './lib/sessions';
import { PrintSheet } from './components/PrintSheet';
import { Field, Num, fmt, fmtSG } from './components/ui';
import { PresetPicker } from './components/PresetPicker';
import { Tour } from './components/Tour';
import { buildTourSteps } from './components/tourSteps';
import { PRESETS, type Preset } from './data/presets';
import { recipeFromPreset } from './lib/presets';
import { useTheme, type ThemePref } from './lib/theme';
import { loadScalePref, saveScalePref, scaleRecipe } from './lib/scale';
import { useInstallPrompt, useOnline } from './lib/pwa';
import { LANGS, brand, dateStr, getLang, setLang, t, type Lang } from './i18n';
import { presetName, styleDesc, styleGroup, styleName } from './lib/names';

const THEME_OPTS: { id: ThemePref; icon: string; label: string }[] = [
  { id: 'system', icon: '🖥', label: 'Rendszer szerint' },
  { id: 'dark', icon: '🌙', label: 'Sötét' },
  { id: 'light', icon: '☀️', label: 'Világos' },
];

const ONBOARD_KEY = 'sorlabor.onboarded.v1';
const isOnboarded = () => {
  try {
    return !!localStorage.getItem(ONBOARD_KEY);
  } catch {
    return true;
  }
};
const markOnboarded = () => {
  try {
    localStorage.setItem(ONBOARD_KEY, '1');
  } catch {
    /* nem elérhető */
  }
};

const STYLE_GROUPS = Array.from(new Set(STYLES.map((s) => s.group)));
const DEFAULT_NAMES = ['Új sör', 'New beer', 'Neues Bier'];

export default function App({ entry = 'app', onHome }: { entry?: 'app' | 'tour' | 'recipes' | `recipe:${string}`; onHome?: () => void }) {
  const [lang, setLangState] = useState<Lang>(getLang());
  const [recipe, setRecipe] = useState<Recipe>(() => loadCurrent() ?? newRecipe());
  const [library, setLibrary] = useState<Recipe[]>(() => loadLibrary());
  const [showLib, setShowLib] = useState(false);
  const [menu, setMenu] = useState<null | 'export' | 'theme' | 'lang'>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [sessions, setSessionsState] = useState<BrewSession[]>(() => loadSessions());
  const [brewId, setBrewId] = useState<string | null>(null);
  const [planTab, setPlanTab] = useState<PlanTab>('brew');
  const [libTab, setLibTab] = useState<'presets' | 'mine'>('presets');
  // az üdvözlést a landing oldal végzi; a ? gombbal később is előhozható
  const [showWelcome, setShowWelcome] = useState(false);
  const [touring, setTouring] = useState(false);
  const theme = useTheme();
  const [scaleOn, setScaleOn] = useState(loadScalePref);
  const b = brand();
  const pwa = useInstallPrompt();
  const online = useOnline();

  const stats = useMemo(() => computeStats(recipe), [recipe, lang]);
  const update = (fn: (r: Recipe) => Recipe) => setRecipe((r) => ({ ...fn(r), updatedAt: Date.now() }));

  const setBatch = (batchL: number) => update((r) => (scaleOn ? scaleRecipe(r, batchL) : { ...r, batchL }));
  const quickScale = (batchL: number) => {
    update((r) => scaleRecipe(r, batchL));
    setToast(t('Átskálázva {l} literre – minden hozzávaló arányosan ✓', { l: batchL }));
  };

  const changeLang = (l: Lang) => {
    setLang(l);
    setLangState(l);
    setMenu(null);
  };

  const setSessions = (s: BrewSession[]) => {
    setSessionsState(s);
    saveSessions(s);
  };
  const brewSession = sessions.find((s) => s.id === brewId) ?? null;
  const activeForRecipe = sessions.find((s) => s.recipeId === recipe.id && s.status === 'brewing');
  const fermentingCount = sessions.filter((s) => s.status === 'fermenting').length;
  const openLog = () => {
    setPlanTab('log');
    setTimeout(() => document.querySelector('[data-tour="plan"]')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };
  const startBrew = () => {
    if (activeForRecipe) {
      setBrewId(activeForRecipe.id);
      return;
    }
    const s = newSession(recipe);
    setSessions([s, ...sessions]);
    setBrewId(s.id);
  };
  const closeBrew = () => {
    setBrewId(null);
    setPlanTab('log');
  };

  useEffect(() => saveCurrent(recipe), [recipe]);
  useEffect(() => {
    if (!toast) return;
    const tm = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(tm);
  }, [toast]);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menu]);

  const setStyle = (id: string) =>
    update((r) => {
      const st = getStyle(id || null);
      return {
        ...r,
        styleId: id || null,
        mashTemp: st ? st.mashTemp : r.mashTemp,
        carbVols: null,
        name: DEFAULT_NAMES.includes(r.name) && st ? t('Saját {style}', { style: styleName(st) }) : r.name,
        water: { ...r.water, targetId: suggestTargetId(stats, id || null) },
      };
    });

  const setMethod = (m: BrewMethod) =>
    update((r) => {
      const next = { ...r, method: m, efficiency: EQUIPMENT_DEFAULTS[m].efficiency, equipment: { ...EQUIPMENT_DEFAULTS[m].equipment } };
      const cal = loadDefaults()[m];
      return cal ? applyCalibration(next, cal) : next;
    });

  const saveToLibrary = () => {
    const next = [recipe, ...library.filter((x) => x.id !== recipe.id)];
    setLibrary(next);
    saveLibrary(next);
    setToast(t('Recept elmentve ✓'));
  };

  const importFile = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      const arr: Partial<Recipe>[] = Array.isArray(data) ? data : [data];
      const recs = arr.map(normalize);
      const next = [...recs, ...library.filter((x) => !recs.some((r) => r.id === x.id))];
      setLibrary(next);
      saveLibrary(next);
      setRecipe(recs[0]);
      setToast(t('{n} recept importálva ✓', { n: recs.length }));
    } catch {
      setToast(t('Hibás fájl – csak a Sörlabor JSON exportja tölthető be.'));
    }
  };

  const style = getStyle(recipe.styleId);

  const openLibrary = (tab?: 'presets' | 'mine') => {
    setLibTab(tab ?? 'presets');
    setShowLib(true);
  };

  const loadPreset = (p: Preset) => {
    const unsaved = !stats.empty && !library.some((x) => x.id === recipe.id);
    if (unsaved && !confirm(t('Betöltöd: {name}? A jelenlegi, nem mentett recept felülíródik.', { name: presetName(p) }))) return;
    setRecipe(recipeFromPreset(p));
    setShowLib(false);
    setPlanTab('brew');
    setToast(t('{name} betöltve – szabadon módosíthatod ✓', { name: presetName(p) }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startTour = () => {
    markOnboarded();
    setShowWelcome(false);
    setShowLib(false);
    if (stats.empty) setRecipe(recipeFromPreset(PRESETS[0]));
    setTouring(true);
  };

  // belépés a landing oldalról: bemutató / receptek / sima főzőpult
  useEffect(() => {
    const first = !isOnboarded();
    markOnboarded();
    const direct = entry.startsWith('recipe:') ? PRESETS.find((p) => p.id === entry.slice(7)) : undefined;
    if (direct) {
      setRecipe(recipeFromPreset(direct));
      setToast(t('{name} betöltve – szabadon módosíthatod ✓', { name: presetName(direct) }));
    } else if (entry === 'tour') startTour();
    else if (entry === 'recipes') openLibrary('presets');
    else if (first && stats.empty) openLibrary('presets');
    if (entry !== 'app') history.replaceState(null, '', '#/app');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const curLang = LANGS.find((l) => l.id === lang)!;

  return (
    <div key={lang}>
      <div className="app screen-only">
        <header className="topbar">
          <button className="brand" onClick={onHome} title={t('Vissza a kezdőoldalra')} aria-label={t('Vissza a kezdőoldalra')}>
            <div className="brand-mark">🍺</div>
            <div>
              <h1>{b.name}</h1>
              <small>{b.tagline}</small>
            </div>
          </button>
          <input
            className="recipe-name"
            value={recipe.name}
            aria-label={t('Recept neve')}
            onChange={(e) => update((r) => ({ ...r, name: e.target.value }))}
          />
          <div className="top-actions">
            <button className="btn" onClick={() => { if (confirm(t('Új, üres receptet kezdesz? (A mostanit előtte mentsd el, ha kell.)'))) setRecipe(newRecipe(recipe.method)); }}>＋ {t('Új')}</button>
            <button data-tour="brew-btn" className="btn brew-btn" disabled={stats.empty} onClick={startBrew} title={stats.empty ? t('Előbb rakd össze a receptet') : t('Lépésenkénti vezetés időzítőkkel')}>
              ▶ {activeForRecipe ? t('Főzés folytatása') : t('Főzőnap')}
            </button>
            <button className="btn primary" onClick={saveToLibrary}>💾 {t('Mentés')}</button>
            <button data-tour="library" className="btn recipes-btn" onClick={() => openLibrary()} title={t('{n} beépített recept + a saját receptjeid', { n: PRESETS.length })}>⭐ {t('Receptek')} <span className="count">{PRESETS.length + library.length}</span></button>
            <div className="menu" onClick={(e) => e.stopPropagation()}>
              <button className="btn" onClick={() => setMenu(menu === 'export' ? null : 'export')} aria-haspopup="menu" aria-expanded={menu === 'export'}>⋯ {t('Export')}</button>
              {menu === 'export' && (
                <div className="menu-pop" role="menu">
                  <button onClick={() => { download(`${fileSafe(recipe.name)}.json`, JSON.stringify(recipe, null, 2), 'application/json'); setMenu(null); }}>⬇ {t('JSON export')}</button>
                  <button onClick={() => { download(`${fileSafe(recipe.name)}.xml`, toBeerXml(recipe, stats), 'application/xml'); setMenu(null); }}>⬇ BeerXML (BeerSmith, Brewfather)</button>
                  <button onClick={() => { fileRef.current?.click(); setMenu(null); }}>⬆ {t('JSON import')}</button>
                  <button onClick={() => { setMenu(null); setTimeout(() => window.print(), 50); }}>🖨 {t('Főzőlap nyomtatása')}</button>
                </div>
              )}
            </div>
            <div className="menu" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn lang-btn"
                onClick={() => setMenu(menu === 'lang' ? null : 'lang')}
                aria-haspopup="menu"
                aria-expanded={menu === 'lang'}
                aria-label={t('Nyelv')}
                title={t('Nyelv')}
              >
                🌐 {curLang.id.toUpperCase()}
              </button>
              {menu === 'lang' && (
                <div className="menu-pop" role="menu" style={{ minWidth: 170 }}>
                  {LANGS.map((l) => (
                    <button key={l.id} role="menuitemradio" aria-checked={lang === l.id} className={lang === l.id ? 'menu-on' : ''} onClick={() => changeLang(l.id)}>
                      {l.flag} {l.label} {lang === l.id && '✓'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="menu" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn help-btn"
                onClick={() => setMenu(menu === 'theme' ? null : 'theme')}
                aria-haspopup="menu"
                aria-expanded={menu === 'theme'}
                aria-label={t('Téma választása')}
                title={`${t('Téma')}: ${t(THEME_OPTS.find((o) => o.id === theme.pref)!.label)}`}
              >
                {theme.resolved === 'light' ? '☀️' : '🌙'}
              </button>
              {menu === 'theme' && (
                <div className="menu-pop" role="menu" style={{ minWidth: 190 }}>
                  {THEME_OPTS.map((o) => (
                    <button
                      key={o.id}
                      role="menuitemradio"
                      aria-checked={theme.pref === o.id}
                      className={theme.pref === o.id ? 'menu-on' : ''}
                      onClick={() => { theme.setPref(o.id); setMenu(null); }}
                    >
                      {o.icon} {t(o.label)} {theme.pref === o.id && '✓'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {pwa.canInstall && (
              <button className="btn" onClick={() => void pwa.install()} title={t('Telepítés alkalmazásként (offline is működik)')}>📲 {t('Telepítés')}</button>
            )}
            {fermentingCount > 0 && (
              <button className="btn ferment-pill" onClick={openLog} title={t('Erjedéskövetés')}>⏳ {t('{n} erjed', { n: fermentingCount })}</button>
            )}
            {!online && <span className="offline-pill" title={t('Nincs internet – az app offline is működik, minden adat a böngészőben marad.')}>⚡ {t('Offline')}</span>}
            <button data-tour="help" className="btn help-btn" onClick={() => setShowWelcome(true)} title={t('Bemutató / súgó')} aria-label={t('Bemutató / súgó')}>?</button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ''; }}
            />
          </div>
        </header>

        <section className="setup" data-tour="setup">
          <Field label={t('Célstílus (BJCP)')}>
            <select className="select" value={recipe.styleId ?? ''} onChange={(e) => setStyle(e.target.value)}>
              <option value="">— {t('Szabad kísérletezés')} —</option>
              {STYLE_GROUPS.map((g) => (
                <optgroup key={g} label={styleGroup(g)}>
                  {STYLES.filter((s) => s.group === g).map((s) => (
                    <option key={s.id} value={s.id}>{s.code} · {styleName(s)}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label={t('Főzési módszer')}>
            <select className="select" value={recipe.method} onChange={(e) => setMethod(e.target.value as BrewMethod)} title={t(EQUIPMENT_DEFAULTS[recipe.method].desc)}>
              <option value="biab">BIAB / Brewzilla</option>
              <option value="classic">{t('Klasszikus all-grain')}</option>
              <option value="extract">{t('Malátakivonatos')}</option>
            </select>
          </Field>
          <div className="field">
            <label>{t('Batch (fermentorba)')}</label>
            <Num value={recipe.batchL} min={1} max={200} step={1} suffix="L" ariaLabel={t('Batch méret literben')} onChange={setBatch} />
            <div className="scale-row">
              <label className="scale-toggle" title={t('Ha be van kapcsolva, a batch méret változtatásakor minden hozzávaló arányosan változik')}>
                <input
                  type="checkbox"
                  checked={scaleOn}
                  onChange={(e) => { setScaleOn(e.target.checked); saveScalePref(e.target.checked); }}
                />
                ⚖ {t('Hozzávalók skálázása')}
              </label>
              {!stats.empty && (
                <span className="scale-quick" role="group" aria-label={t('Gyors átskálázás')}>
                  {[10, 20, 23, 40].filter((l) => l !== recipe.batchL).slice(0, 3).map((l) => (
                    <button key={l} className="chip" onClick={() => quickScale(l)} title={t('Minden hozzávaló arányos átskálázása {l} literre', { l })}>{l} L</button>
                  ))}
                </span>
              )}
            </div>
          </div>
          <Field label={t('Hatásfok')}>
            <Num value={recipe.efficiency} min={30} max={95} step={1} suffix="%" onChange={(efficiency) => update((r) => ({ ...r, efficiency }))} />
          </Field>
          <Field label={t('Forralás')}>
            <Num value={recipe.boilMin} min={15} max={180} step={15} suffix={t('perc')} onChange={(boilMin) => update((r) => ({ ...r, boilMin }))} />
          </Field>
          <Field label={recipe.method === 'extract' ? t('Cefre (mini-mash)') : t('Cefrézési hőfok')}>
            <select className="select" value={recipe.mashTemp} onChange={(e) => update((r) => ({ ...r, mashTemp: Number(e.target.value) }))}>
              {[63, 64, 65, 66, 67, 68, 69].map((tc) => (
                <option key={tc} value={tc}>{tc} °C {tc <= 64 ? `· ${t('száraz')}` : tc >= 68 ? `· ${t('testes')}` : tc === 66 ? `· ${t('közepes')}` : ''}</option>
              ))}
            </select>
          </Field>
        </section>

        {style && stats.empty && (
          <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
            <BeerGlass srm={(style.srm[0] + style.srm[1]) / 2} size={60} />
            <div>
              <div className="label">{t('Cél')}: {style.code} · {styleGroup(style)}</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 20 }}>
                {styleName(style)} {lang !== 'en' && <span className="muted small">({style.name})</span>}
              </div>
              <div className="muted">{styleDesc(style)}</div>
              <div className="small" style={{ marginTop: 6, color: 'var(--text-2)' }}>
                OG {fmtSG(style.og[0])}–{fmtSG(style.og[1])} · IBU {style.ibu[0]}–{style.ibu[1]} · {fmt(style.srm[0] * 1.97, 0)}–{fmt(style.srm[1] * 1.97, 0)} EBC · {fmt(style.abv[0], 1)}–{fmt(style.abv[1], 1)}% · {t('javasolt cefre {t} °C', { t: style.mashTemp })}
                {style.requires && <> · {t('jellemző:')} <b>{style.requires.map((r) => t(r.label)).join(', ')}</b></>}
              </div>
            </div>
          </div>
        )}

        {stats.empty && (
          <div className="card quickstart">
            <div className="card-head">
              <div>
                <h2>⭐ {t('Kezdj egy bevált recepttel')}{style && PRESETS.some((p) => p.styleId === style.id) ? ` – ${styleName(style)}` : ''}</h2>
                <div className="muted small">{t('{n} kipróbált, stílushű recept kezdőtől profiig – egy kattintás, és már főzheted is.', { n: PRESETS.length })}</div>
              </div>
              <div className="row">
                <button className="btn primary" onClick={() => openLibrary('presets')}>{t('Mind a {n} recept', { n: PRESETS.length })} →</button>
                <button className="btn sm ghost" onClick={startTour}>▶ {t('Bemutató')}</button>
              </div>
            </div>
            <PresetPicker compact limit={8} styleId={recipe.styleId} onPick={loadPreset} />
            <div className="small muted" style={{ marginTop: 8 }}>{t('…vagy rakd össze a sajátodat lent a hozzávalók katalógusából.')}</div>
          </div>
        )}

        <main className="main">
          <div className="col">
            <div data-tour="ingredients"><IngredientPanel recipe={recipe} stats={stats} update={update} /></div>
            <div data-tour="describe"><Description recipe={recipe} stats={stats} /></div>
          </div>
          <div className="col">
            <div data-tour="summary"><Summary recipe={recipe} stats={stats} /></div>
            <div data-tour="style"><StyleMatchCard recipe={recipe} stats={stats} update={update} /></div>
            <div data-tour="flavor"><FlavorRadar stats={stats} /></div>
          </div>
        </main>

        <div data-tour="plan">
          <PlanPanel recipe={recipe} stats={stats} update={update} tab={planTab} setTab={setPlanTab} log={{ sessions, setSessions, onResume: setBrewId }} />
        </div>

        <footer className="small muted" style={{ marginTop: 20, textAlign: 'center' }}>
          {t('Alapanyagok a hopline.hu kínálata alapján, gyártói tipikus értékekkel. Az értékek becslések – mérj, jegyzetelj, és igazítsd a hatásfokot a saját rendszeredhez.')}
          <div style={{ marginTop: 6 }}>
            <a href="#/privacy">{t('Adatvédelmi tájékoztató')}</a> · {t('Nincs süti, nincs követés – az adataid csak ezen az eszközön tárolódnak.')}
          </div>
        </footer>
      </div>

      <PrintSheet recipe={recipe} stats={stats} />

      {brewSession && (
        <BrewMode
          session={brewSession}
          onChange={(s) => setSessionsState((prev) => {
            const next = prev.map((x) => (x.id === s.id ? s : x));
            saveSessions(next);
            return next;
          })}
          onClose={closeBrew}
        />
      )}

      {showLib && (
        <div className="modal-bg screen-only" onClick={() => setShowLib(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="card-head">
              <h2 style={{ fontFamily: 'var(--display)', margin: 0 }}>📚 {t('Receptek')}</h2>
              <button className="btn ghost" onClick={() => setShowLib(false)}>{t('Bezár')}</button>
            </div>
            <div className="tabs">
              <button className={`tab ${libTab === 'presets' ? 'active' : ''}`} onClick={() => setLibTab('presets')}>⭐ {t('Beépített receptek')} <span className="count">{PRESETS.length}</span></button>
              <button className={`tab ${libTab === 'mine' ? 'active' : ''}`} onClick={() => setLibTab('mine')}>{t('Saját receptjeim')} {library.length > 0 && <span className="count">{library.length}</span>}</button>
            </div>
            {libTab === 'presets' && (
              <>
                <p className="small muted" style={{ marginTop: 0 }}>{t('Bevált, stílushű receptek 20 literre. Betöltés után szabadon módosíthatod, és elmentheted a sajátodként.')}</p>
                <PresetPicker styleId={recipe.styleId} onPick={loadPreset} />
              </>
            )}
            {libTab === 'mine' && (
              <>
                {library.length === 0 && <div className="empty">{t('Még nincs mentett recept. A „Mentés” gombbal adhatsz hozzá.')}</div>}
                {library.map((r) => {
                  const s = computeStats(r);
                  const st = getStyle(r.styleId);
                  return (
                    <div className="lib-item" key={r.id}>
                      <BeerGlass srm={s.srm} size={22} />
                      <div style={{ minWidth: 0 }}>
                        <strong>{r.name}</strong>
                        <div className="small muted">
                          {st ? `${styleName(st)} · ` : ''}{fmt(s.abv, 1)}% · {fmt(s.ibu, 0)} IBU · {fmt(s.ebc, 0)} EBC · {dateStr(r.updatedAt)}
                        </div>
                      </div>
                      <div className="row">
                        <button className="btn sm primary" onClick={() => { setRecipe(r); setShowLib(false); }}>{t('Betölt')}</button>
                        <button className="btn sm" onClick={() => { const copy = { ...r, id: `${r.id}-m${Date.now().toString(36)}`, name: t('{name} (másolat)', { name: r.name }) }; setRecipe(copy); setShowLib(false); }}>{t('Másol')}</button>
                        <button
                          className="icon-btn"
                          aria-label={t('Törlés')}
                          onClick={() => {
                            if (!confirm(t('Törlöd: {name}?', { name: r.name }))) return;
                            const next = library.filter((x) => x.id !== r.id);
                            setLibrary(next);
                            saveLibrary(next);
                          }}
                        >✕</button>
                      </div>
                    </div>
                  );
                })}
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn sm" onClick={() => download('sorlabor_receptek.json', JSON.stringify(library, null, 2), 'application/json')} disabled={!library.length}>⬇ {t('Összes exportálása')}</button>
                  <button className="btn sm" onClick={() => fileRef.current?.click()}>⬆ {t('Import')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showWelcome && !touring && (
        <div className="modal-bg screen-only" onClick={() => { markOnboarded(); setShowWelcome(false); }}>
          <div className="modal welcome" onClick={(e) => e.stopPropagation()}>
            <div className="welcome-hero">🍺</div>
            <h2>{t('Üdv a {name}ban!', { name: b.name })}</h2>
            <p className="muted">{t('Ez a főzőpult: rakd össze a söröd a hopline.hu alapanyagaiból, és kapd meg hozzá a pontos főzési és erjesztési előírást.')}</p>
            <div className="lang-switch" role="group" aria-label={t('Nyelv')}>
              {LANGS.map((l) => (
                <button key={l.id} className={`chip ${lang === l.id ? 'active' : ''}`} onClick={() => changeLang(l.id)}>{l.flag} {l.label}</button>
              ))}
            </div>
            <div className="welcome-actions">
              <button className="welcome-opt primary" onClick={startTour}>
                <span className="wo-icon">▶</span>
                <span><b>{t('Bemutató indítása')}</b><small>{t('2 perces körbevezetés egy mintarecepttel')}</small></span>
              </button>
              <button className="welcome-opt" onClick={() => { markOnboarded(); setShowWelcome(false); openLibrary('presets'); }}>
                <span className="wo-icon">⭐</span>
                <span><b>{t('Bevált recepttel kezdek')}</b><small>{t('{n} beépített recept kezdőtől profiig', { n: PRESETS.length })}</small></span>
              </button>
              <button className="welcome-opt" onClick={() => { markOnboarded(); setShowWelcome(false); }}>
                <span className="wo-icon">🧪</span>
                <span><b>{t('Saját receptet rakok össze')}</b><small>{t('Üres lap: válassz célstílust és hozzávalókat')}</small></span>
              </button>
            </div>
          </div>
        </div>
      )}

      {touring && (
        <Tour
          steps={buildTourSteps({ setPlanTab, presetCount: PRESETS.length })}
          onClose={() => { setTouring(false); setPlanTab('brew'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          footer={
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn sm" onClick={() => { setTouring(false); openLibrary('presets'); }}>⭐ {t('Bevált recept')}</button>
              <button className="btn sm" onClick={() => { setTouring(false); setRecipe(newRecipe(recipe.method)); window.scrollTo({ top: 0 }); }}>🧪 {t('Üres lap')}</button>
            </div>
          }
        />
      )}

      {toast && (
        <div className="screen-only" style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--surface-3)', border: '1px solid var(--border-strong)', padding: '10px 16px', borderRadius: 10, zIndex: 60 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
