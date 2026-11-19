import type { TourStep } from './Tour';
import type { PlanTab } from './Plans';
import { t, brand } from '../i18n';

/** Egy bekezdés, amiben a **félkövér** részek kiemelve jelennek meg. */
function P({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return <p className={className}>{parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : p))}</p>;
}

export function buildTourSteps({ setPlanTab, presetCount }: { setPlanTab: (t: PlanTab) => void; presetCount: number }): TourStep[] {
  const name = brand().name;
  return [
    {
      title: t('Üdv a {name}ban!', { name }) + ' 🍺',
      body: (
        <>
          <P text={t('Itt rakod össze a söröd receptjét a hopline.hu alapanyagaiból, és az app azonnal kiszámolja, milyen sör lesz belőle – plusz a teljes főzési és erjesztési menetrendet.')} />
          <P className="muted small" text={t('A bemutatóhoz egy mintarecept (amerikai pale ale) van betöltve. Lapozhatsz a ← → billentyűkkel is.')} />
        </>
      ),
    },
    {
      target: 'setup',
      title: t('1. Alapbeállítások'),
      body: (
        <>
          <P text={t('**Célstílus:** válassz egy BJCP stílust (pl. IPA, Pilsner) – az app jelzi, mi lóg ki belőle. Üresen is hagyhatod, ha csak kísérletezel.')} />
          <P text={t('**Módszer, batch, hatásfok:** BIAB/Brewzilla, klasszikus vagy kivonatos főzés, és hány liter kerüljön a fermentorba – a ⚖ kapcsolóval minden hozzávaló arányosan skálázódik. A **cefrézési hőfok** a testet szabályozza (64 °C száraz, 68 °C testes).')} />
        </>
      ),
    },
    {
      target: 'ingredients',
      title: t('2. Hozzávalók'),
      body: (
        <>
          <P text={t('Négy fül: **maláták**, **komlók**, **élesztő**, **ízesítők**. A katalógusban keress vagy szűrj, és a **+** gombbal add hozzá.')} />
          <P text={t('Soronként állíthatod a mennyiséget, a komló idejét és felhasználását (forralás, whirlpool, hidegkomló). Tipp: a ↑ ↓ nyilakkal léptetheted a számokat.')} />
        </>
      ),
    },
    {
      target: 'summary',
      title: t('3. Élő számítások'),
      body: <P text={t('Minden változtatásra frissül: **OG/FG** (sűrűség), **alkohol**, **IBU** (keserűség), **szín** és a keserű–édes egyensúly (BU:GU). A pohár a sör várható színét mutatja, a zöld sávok a célstílus tartományát.')} />,
    },
    {
      target: 'style',
      title: t('4. Stílusegyezés és javaslatok'),
      body: <P text={t('Százalékban látod, mennyire talál a recept a célstílusra, és **konkrét tippeket** kapsz (pl. „+9 g Magnum 60 percnél”). Alatta az is látszik, milyen más stílusokra hasonlít – egy kattintással átállíthatod.')} />,
    },
    {
      target: 'flavor',
      title: t('5. Ízprofil'),
      body: <P text={t('Becsült ízprofil 9 tengelyen: maláta, karamell, pörkölt, gyümölcs, komló, fűszer, füst, keserűség, test. Vidd az egeret egy pontra a részletekért.')} />,
    },
    {
      target: 'describe',
      title: t('6. Milyen sör lett?'),
      body: <P text={t('Emberi nyelvű összefoglaló a sörről, és figyelmeztetések, ha valami gyanús (pl. túl sok speciális maláta, vagy az élesztő alkoholtűrése).')} />,
    },
    {
      target: 'plan',
      title: t('7. Főzési terv'),
      before: () => setPlanTab('brew'),
      body: <P text={t('A generált előírás: **vízmennyiségek**, beütési hőfok, cefrepihenők, forralási ütemterv. A többi fülön: **erjesztés & palackozás** (hőfokprofil, priming cukor), **vízkémia** (sók, pH) és **bevásárlólista** hopline linkekkel.')} />,
    },
    {
      target: 'brew-btn',
      title: t('8. Főzőnap mód'),
      body: <P text={t('Főzés napján ezzel indítsd: teljes képernyős, lépésenkénti vezetés **visszaszámlálóval** és **hangjelzéssel** minden komló-hozzáadásnál. Menet közben beírod a mért értékeket, és korrekciós tippeket kapsz.')} />,
    },
    {
      target: 'plan',
      title: t('9. Napló és kalibráció'),
      before: () => setPlanTab('log'),
      body: <P text={t('A főzések mért értékei itt gyűlnek. Pár főzés után az app kiszámolja a **saját rendszered** valódi hatásfokát és veszteségeit – egy kattintással alkalmazod, így a számítások egyre pontosabbak.')} />,
    },
    {
      target: 'library',
      title: t('10. Receptek és mentés'),
      before: () => setPlanTab('brew'),
      body: <P text={t('A **Receptek** alatt {n} beépített, bevált recept vár kezdőtől profiig, és itt vannak a saját mentett receptjeid is. A **Mentés** a könyvtáradba teszi a receptet, az **Export** BeerXML-t és nyomtatható főzőlapot is ad.', { n: presetCount })} />,
    },
    {
      target: 'help',
      title: t('Készen állsz!') + ' 🎉',
      body: <P text={t('A bemutatót bármikor újraindíthatod a **?** gombbal, a nyelvet és a témát pedig mellette válthatod. Hogyan kezdenéd?')} />,
    },
  ];
}
