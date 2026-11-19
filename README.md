# Sörlabor · BeerLab · Bierlabor – otthoni sörfőzés laborpontossággal

React + Vite webapp: maláták, komlók, élesztők és ízesítők (hopline.hu kínálata alapján) dinamikus összeállítása,
élő számításokkal és főzési/erjesztési előírással.

## Indítás

```bash
npm install
npm run dev      # fejlesztői szerver, megnyitja a böngészőt
npm run build    # éles build a dist/ mappába
```

## Oldalak
- **`/` – Landing page**: animált, sörös témájú kezdőoldal (töltődő pohár buborékokkal és habbal, beúszó szekciók, sörszín-skála), HU/EN/DE.
- **`#/app` – Főzőpult** (EN: Brewhouse, DE: Sudhaus): a munkaoldal. `#/app/tour` bemutatóval, `#/app/recipes` a beépített receptekkel nyílik.

Teljesítmény: a landing külön, kicsi csomag (~54 KB gzip JS, ~3 KB CSS); a főzőpult kódja és stílusa lusta betöltésű, a landing megjelenése után a háttérben előtöltődik. Az animációk csak `transform`/`opacity` alapúak, a hős animációi megállnak, ha nem látszanak, és a „csökkentett mozgás” beállításnál kikapcsolnak. A betűtípusok nem blokkolják a megjelenést.

## Funkciók
- **Receptépítő**: katalógus kereséssel és kategória-szűrővel (Viking, Weyermann maláták; komlók; Fermentis/Lallemand/Mangrove Jack's élesztők; fűszerek, kávé, tölgyfa, derítők).
- **Számolt értékek**: OG, FG, alkohol, IBU (Tinseth), szín (EBC, Morey), BU:GU, kalória, a sör színe pohárban.
- **Ízprofil radar** és szöveges „Milyen sör lett?” leírás.
- **BJCP 2021 stílusegyezés**: célstílus tartományok, %-os egyezés, konkrét javaslatok (pl. „+9 g Magnum 60 percnél”).
- **Főzőnap**: vízmennyiségek, beütési hőfok, cefrézési pihenők, forralási ütemterv (BIAB/Brewzilla, klasszikus, kivonatos).
- **Erjesztés & palackozás**: élesztőadag, hőfokprofil, diacetil pihenő, hidegkomlózás, lagerezés, priming cukor, keg nyomás.
- **Vízkémia**: sók, ionok, SO₄:Cl arány, becsült cefre pH, tejsav javaslat.
- **Bevásárlólista**: becsült árak, kiszerelésre kerekítve, hopline keresés linkekkel.
- **▶ Főzőnap mód**: teljes képernyős, lépésenkénti vezetés (előkészítés → cefrézés → mérés → forralás → hűtés → beoltás) nagy visszaszámlálóval, hangjelzéssel és kiemeléssel minden komló/adalék hozzáadásnál, kipipálható listákkal, ébren tartott képernyővel. Az állapot mentődik – újratöltés után is folytatható.
- **📒 Napló & kalibráció**: mért értékek (forralás előtti SG/térfogat, forralás utáni térfogat, OG, fermentorba töltött térfogat, FG) a tervezett mellett; azonnali korrekciós javaslatok (hosszabb forralás / DME / vízzel hígítás). Az utolsó 5 főzésből számolt valódi hatásfok, elpárolgás és üstveszteség egy kattintással a receptre alkalmazható, vagy alapértelmezett lehet az új recepteknél. Élesztőnkénti mért erjedési fok.
- **⭐ Beépített receptek**: 31 bevált, stílushű recept kezdőtől profiig – klasszikusok (APA, IPA, NEIPA, pilsnerek, Helles, Kölsch, bécsi lager, Märzen, Rauchbier, Schwarzbier, búzasörök, ESB, ír vörös, stoutok, porter, saison, dubbel, tripel…) és ízesítettek (mokka porter, hordós imperial stout, fűszeres téli ale, mangós milkshake IPA, málnás búza, meggyes stout, mézes-levendulás blonde) – betöltés után szerkeszthetők. Forrás: `src/data/presets.ts`.
- **❓ Bemutató új felhasználóknak**: első indításkor üdvözlő ablak, majd 12 lépéses, kiemeléses körbevezetés egy mintarecepttel; a fejléc `?` gombjával bármikor újraindítható.
- **🌗 Világos / sötét téma**: a fejléc 🌙/☀️ gombjával – Rendszer szerint, Sötét vagy Világos; a választás megmarad.
- **📲 Telepíthető, offline is működik (PWA)**: manifest + saját generált service worker (`pwa-plugin.ts`) – minden build verziózott gyorsítótárat kap, a teljes app (a főzőpult is) offline elérhető. Éles buildben aktív: `npm run build && npm run preview`.
- **💰 Árak és valós költség**: tételenként felülírható egységár (megjegyzi), „Bevásárlás most” (egész csomagok + szállítás) vs. „Ez a főzés valójában” (felhasznált mennyiség + rezsi: energia, víz, fertőtlenítő, kupak), palackonkénti ár, összevetés bolti kézműves sörrel, maradék alapanyag értéke.
- **📈 Erjedéskövetés**: mérések (idő, SG, hőfok, jegyzet), sűrűség- és hőfokgrafikon a cél FG-vel és az élesztő tartományával, napi teendők az erjesztési tervből, figyelmeztetés lassú / elakadt erjedésre és rossz hőfokra, „kierjedt” felismerés.
- **🌐 Többnyelvű (HU / EN / DE)**: a fejléc nyelvválasztójával; az első indításkor a böngésző nyelve alapján választ. Nyelvenként saját márkanév (Sörlabor / BeerLab / Bierlabor – `src/i18n/index.ts` → `BRAND`), helyi szám- és dátumformátum.
- **Mentés / export**: böngészőben tárolt receptkönyvtár, JSON export/import, BeerXML export, nyomtatható főzőlap.

## Adatok
A katalógus a `src/data/` mappában van (sima TypeScript tömbök) – szabadon bővíthető.
Az árak és a műszaki értékek tipikus/becsült értékek; a pontos alfasavat a komló csomagolásán, az árakat a hopline.hu-n ellenőrizd.

## Fordítás
- A felület szövegei `t('magyar szöveg')` hívásokkal fordíthatók; a kulcs maga a magyar szöveg (`src/i18n/en.ts`, `src/i18n/de.ts`).
- Katalógus-, stílus- és receptleírások: `src/i18n/data.ts` (azonosító szerint).
- Ellenőrzés: `npm run i18n:check` – kiírja a hiányzó vagy felesleges fordításokat.

## Hostolás (ingyenes: Cloudflare Workers, statikus fájlok)
1. Az üzemeltető adatai a `src/legal/config.ts` fájlban vannak (név, kapcsolattartási e-mail) – ezek jelennek meg az adatvédelmi tájékoztatóban (`#/privacy`).
2. Élő cím: https://sorlabor.dgapps.workers.dev – a Worker beállításait a `wrangler.jsonc` adja.
   - **Automatikus telepítés:** a Worker be van kötve a GitHub-tárolóhoz (Cloudflare Workers Builds), minden push a `main` ágra kimegy. Build command: `npm run build` · Deploy command: `npx wrangler deploy`
   - Kézi telepítés: `npm run build && npx wrangler deploy`
3. **Saját domain:** a `wrangler.jsonc`-ba: `"routes": [{ "pattern": "sorlabor.hu", "custom_domain": true }]` (a `"workers_dev": true` maradjon benne, különben a workers.dev cím kikapcsol). A gyökérdomainhez a domaint fel kell venni a Cloudflare-re (ingyenes csomag), és a .hu regisztrátornál a névszervereket a Cloudflare által megadottakra kell állítani. A `www.sorlabor.hu` és az ékezetes `sörlabor.hu` (`xn--srlabor-90a.hu`) 301-gyel irányítható a fő címre.
4. A HTTPS automatikus. A gyorsítótár- és biztonsági fejléceket a `public/_headers` fájl állítja be (Cloudflare Workers / Pages / Netlify); Apache alapú magyar tárhelyen ugyanezt a `public/.htaccess` végzi.

**Adatvédelem:** nincs süti, nincs analitika, a betűtípusok saját tárhelyről jönnek (nincs adattovábbítás a Google felé), szigorú CSP minden külső forrást tilt. A felhasználói adatok csak a böngészőben tárolódnak; az adatvédelmi oldalon egy gombbal törölhetők.
