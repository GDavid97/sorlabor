import type { Lang } from '../i18n/lang';
import { LEGAL } from './config';

export interface PrivacyText {
  title: string;
  updated: string;
  back: string;
  summaryTitle: string;
  summary: string[];
  sections: { h: string; p: string[] }[];
  storageTable: { head: [string, string]; rows: [string, string][] };
  deleteTitle: string;
  deleteText: string;
  deleteBtn: string;
  deleteConfirm: string;
  deleteDone: string;
  notFilled: string;
}

const H = LEGAL.hosting;

const HU: PrivacyText = {
  title: 'Adatvédelmi tájékoztató',
  updated: 'Utolsó módosítás',
  back: 'Vissza',
  summaryTitle: 'Röviden',
  summary: [
    'Nem kell regisztrálni, és nem gyűjtünk rólad személyes adatot.',
    'Nincs süti, nincs látogatásmérés (analitika), nincs reklám és nincs követés.',
    'Amit az appban rögzítesz (receptek, főzési napló, árak), az csak a te eszközödön, a böngésződben tárolódik – mi nem látjuk.',
    'A tárhelyszolgáltató a működéshez szükséges, rövid ideig őrzött technikai naplót vezet (pl. IP-cím).',
  ],
  sections: [
    {
      h: '1. Ki az adatkezelő?',
      p: [
        `Az oldal üzemeltetője: ${LEGAL.operatorName}. Kapcsolat: ${LEGAL.email}.`,
        'Az oldal nem üzleti célú, ingyenesen használható sörfőző segédalkalmazás.',
      ],
    },
    {
      h: '2. A te eszközödön tárolt adatok',
      p: [
        'Az app a böngésződ helyi tárolójában (localStorage) és az offline gyorsítótárban (service worker cache) tárol adatokat, hogy a funkciók működjenek: a recepteket el tudd menteni, offline is használhasd, és megmaradjanak a beállításaid. Ezek az adatok nem kerülnek el a szerverre, mi nem férünk hozzájuk.',
        'Jogalap: ez a tárolás az általad kifejezetten kért szolgáltatás nyújtásához feltétlenül szükséges, ezért nem kell hozzá külön hozzájárulás (ePrivacy-irányelv 5. cikk (3) bekezdés, az elektronikus hírközlésről szóló 2003. évi C. törvény 155. § (4) bekezdés). Az adatok addig maradnak meg, amíg te nem törlöd őket – lent egy gombbal megteheted.',
      ],
    },
    {
      h: '3. Tárhely és szervernapló',
      p: [
        `Az oldalt a(z) ${H.name} (${H.address}) szolgálja ki adatfeldolgozóként. Az oldal letöltésekor a szolgáltató technikai adatokat kezel és naplóz: IP-cím, időpont, kért fájl, böngésző típusa. Ezekre a biztonságos és megbízható kiszolgáláshoz, valamint a visszaélések kivédéséhez van szükség.`,
        'Jogalap: jogos érdek (GDPR 6. cikk (1) f) pont). A naplókat a szolgáltató a saját szabályai szerint, rövid ideig őrzi; tartalmukhoz mi nem férünk hozzá rendszeresen, és nem használjuk fel azonosításra.',
        H.outsideEU
          ? `A szolgáltató az Európai Unión kívül (USA) is kezelhet adatot. Az adattovábbítás az EU–USA adatvédelmi keretrendszer (Data Privacy Framework) és a szolgáltató általános szerződési feltételei alapján történik. A szolgáltató tájékoztatója: ${H.privacyUrl}`
          : `A szolgáltató tájékoztatója: ${H.privacyUrl}`,
      ],
    },
    {
      h: '4. Külső oldalak',
      p: [
        'A bevásárlólistában a hopline.hu webáruházra mutató hivatkozások vannak. Ezek csak akkor nyitják meg a külső oldalt, ha rákattintasz – onnantól a hopline.hu adatkezelési tájékoztatója érvényes. Az app semmilyen adatot nem küld a hopline.hu-nak.',
        'A betűtípusok és minden más fájl a saját tárhelyünkről töltődik, harmadik fél (pl. Google) felé nem történik adattovábbítás.',
      ],
    },
    {
      h: '5. Sütik',
      p: ['Az oldal nem használ sütit (cookie-t), ezért süti-hozzájárulást sem kér.'],
    },
    {
      h: '6. A jogaid',
      p: [
        'A GDPR alapján jogod van tájékoztatást kérni, hozzáférni az adataidhoz, kérni azok helyesbítését, törlését, kezelésük korlátozását, és tiltakozni az adatkezelés ellen. Mivel a szerveren nem tárolunk rólad azonosítható adatot, az eszközödön lévő adatokat te magad bármikor törölheted.',
        `Kérdéssel vagy kéréssel írj a(z) ${LEGAL.email} címre – legkésőbb egy hónapon belül válaszolunk.`,
        'Panasszal a Nemzeti Adatvédelmi és Információszabadság Hatósághoz (NAIH) fordulhatsz: 1055 Budapest, Falk Miksa utca 9–11., www.naih.hu, ugyfelszolgalat@naih.hu. Bírósághoz is fordulhatsz; a pert a lakóhelyed szerinti törvényszék előtt is megindíthatod.',
      ],
    },
    {
      h: '7. Módosítás',
      p: ['Ha az oldal adatkezelése változik (pl. bekerül egy fiókrendszer vagy látogatásmérés), ezt a tájékoztatót előre frissítjük.'],
    },
  ],
  storageTable: {
    head: ['Mit tárol az app az eszközödön?', 'Mire kell?'],
    rows: [
      ['Az aktuális recept és a mentett receptjeid', 'hogy ne vesszen el a munkád, és visszatölthesd'],
      ['Főzési napló, erjedési mérések, kalibráció', 'a főzések követése és a számítások pontosítása'],
      ['Saját árak és költségbeállítások', 'a bevásárlólista és a költségszámítás'],
      ['Nyelv, téma, egyéb beállítások', 'hogy a választásod megmaradjon'],
      ['Az app fájljai (offline gyorsítótár)', 'hogy internet nélkül is működjön'],
    ],
  },
  deleteTitle: 'Adataid törlése ezen az eszközön',
  deleteText: 'Ezzel minden, az app által ezen a böngészőn tárolt adatot törölsz (receptek, napló, beállítások, offline gyorsítótár). A művelet nem vonható vissza – ha meg akarod tartani a receptjeidet, előbb exportáld őket.',
  deleteBtn: 'Minden adatom törlése',
  deleteConfirm: 'Biztosan törlöd az összes, ezen az eszközön tárolt adatot? Ez nem vonható vissza.',
  deleteDone: 'Kész – minden helyi adat törölve.',
  notFilled: 'Figyelem: az üzemeltető adatai még nincsenek kitöltve (src/legal/config.ts).',
};

const EN: PrivacyText = {
  title: 'Privacy policy',
  updated: 'Last updated',
  back: 'Back',
  summaryTitle: 'In short',
  summary: [
    'No sign-up, and we don’t collect personal data about you.',
    'No cookies, no analytics, no ads and no tracking.',
    'Everything you enter in the app (recipes, brew log, prices) is stored only on your device, in your browser – we can’t see it.',
    'The hosting provider keeps a short-lived technical log needed to run the site (e.g. IP address).',
  ],
  sections: [
    {
      h: '1. Who is the controller?',
      p: [
        `This site is operated by ${LEGAL.operatorName}. Contact: ${LEGAL.email}.`,
        'The site is a free, non-commercial home brewing tool.',
      ],
    },
    {
      h: '2. Data stored on your device',
      p: [
        'The app stores data in your browser’s local storage (localStorage) and offline cache (service worker cache) so its features work: saving recipes, offline use and keeping your settings. This data is never sent to the server and we have no access to it.',
        'Legal basis: this storage is strictly necessary to provide the service you explicitly requested, so no separate consent is required (ePrivacy Directive Art. 5(3)). The data stays until you delete it – you can do so with the button below.',
      ],
    },
    {
      h: '3. Hosting and server logs',
      p: [
        `The site is served by ${H.name} (${H.address}) as a processor. When you load the site, the provider processes and logs technical data: IP address, time, requested file, browser type. This is needed for secure and reliable delivery and to prevent abuse.`,
        'Legal basis: legitimate interest (GDPR Art. 6(1)(f)). The provider keeps these logs for a short period under its own rules; we do not routinely access them or use them to identify anyone.',
        H.outsideEU
          ? `The provider may also process data outside the European Union (USA). Transfers are based on the EU–US Data Privacy Framework and the provider’s terms. Provider’s policy: ${H.privacyUrl}`
          : `Provider’s policy: ${H.privacyUrl}`,
      ],
    },
    {
      h: '4. External sites',
      p: [
        'The shopping list contains links to the hopline.hu web shop. They only open the external site if you click them – from then on hopline.hu’s privacy policy applies. The app sends no data to hopline.hu.',
        'Fonts and all other files are loaded from our own hosting; no data is transferred to third parties such as Google.',
      ],
    },
    { h: '5. Cookies', p: ['The site uses no cookies and therefore asks for no cookie consent.'] },
    {
      h: '6. Your rights',
      p: [
        'Under the GDPR you have the right to information, access, rectification, erasure, restriction and to object. As we store no identifiable data about you on the server, you can delete the data on your device yourself at any time.',
        `For questions or requests, write to ${LEGAL.email} – we reply within one month.`,
        'You can lodge a complaint with the Hungarian supervisory authority (NAIH): 1055 Budapest, Falk Miksa utca 9–11, www.naih.hu, ugyfelszolgalat@naih.hu – or with the authority of your EU country of residence – and you can go to court.',
      ],
    },
    { h: '7. Changes', p: ['If data processing changes (e.g. accounts or analytics are added), this policy will be updated in advance.'] },
  ],
  storageTable: {
    head: ['What does the app store on your device?', 'Why?'],
    rows: [
      ['The current recipe and your saved recipes', 'so your work isn’t lost and you can reload it'],
      ['Brew log, fermentation readings, calibration', 'tracking your brews and refining calculations'],
      ['Your prices and cost settings', 'shopping list and cost calculation'],
      ['Language, theme and other settings', 'so your choices are remembered'],
      ['The app’s files (offline cache)', 'so it works without internet'],
    ],
  },
  deleteTitle: 'Delete your data on this device',
  deleteText: 'This deletes everything the app has stored in this browser (recipes, log, settings, offline cache). It cannot be undone – export your recipes first if you want to keep them.',
  deleteBtn: 'Delete all my data',
  deleteConfirm: 'Really delete all data stored on this device? This cannot be undone.',
  deleteDone: 'Done – all local data deleted.',
  notFilled: 'Note: operator details are not filled in yet (src/legal/config.ts).',
};

const DE: PrivacyText = {
  title: 'Datenschutzerklärung',
  updated: 'Zuletzt geändert',
  back: 'Zurück',
  summaryTitle: 'Kurz gesagt',
  summary: [
    'Keine Registrierung, und wir erheben keine personenbezogenen Daten über dich.',
    'Keine Cookies, keine Analyse, keine Werbung, kein Tracking.',
    'Alles, was du in der App eingibst (Rezepte, Brauprotokoll, Preise), wird nur auf deinem Gerät im Browser gespeichert – wir sehen es nicht.',
    'Der Hosting-Anbieter führt ein kurzlebiges technisches Protokoll, das für den Betrieb nötig ist (z. B. IP-Adresse).',
  ],
  sections: [
    {
      h: '1. Wer ist verantwortlich?',
      p: [
        `Betreiber dieser Seite: ${LEGAL.operatorName}. Kontakt: ${LEGAL.email}.`,
        'Die Seite ist ein kostenloses, nicht kommerzielles Hilfsmittel zum Heimbrauen.',
      ],
    },
    {
      h: '2. Auf deinem Gerät gespeicherte Daten',
      p: [
        'Die App speichert Daten im lokalen Speicher deines Browsers (localStorage) und im Offline-Cache (Service Worker), damit die Funktionen arbeiten: Rezepte speichern, Offline-Nutzung und deine Einstellungen. Diese Daten werden nie an den Server übertragen, wir haben keinen Zugriff darauf.',
        'Rechtsgrundlage: Diese Speicherung ist für den von dir ausdrücklich gewünschten Dienst unbedingt erforderlich, daher ist keine gesonderte Einwilligung nötig (Art. 5 Abs. 3 ePrivacy-Richtlinie, § 25 Abs. 2 TDDDG). Die Daten bleiben, bis du sie löschst – unten geht das mit einem Klick.',
      ],
    },
    {
      h: '3. Hosting und Server-Logs',
      p: [
        `Die Seite wird von ${H.name} (${H.address}) als Auftragsverarbeiter ausgeliefert. Beim Aufruf verarbeitet und protokolliert der Anbieter technische Daten: IP-Adresse, Zeitpunkt, angeforderte Datei, Browsertyp. Das ist für eine sichere, zuverlässige Auslieferung und zur Abwehr von Missbrauch nötig.`,
        'Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO). Der Anbieter speichert diese Logs nach eigenen Regeln für kurze Zeit; wir greifen nicht regelmäßig darauf zu und nutzen sie nicht zur Identifizierung.',
        H.outsideEU
          ? `Der Anbieter kann Daten auch außerhalb der EU (USA) verarbeiten. Die Übermittlung erfolgt auf Grundlage des EU-US Data Privacy Framework und der Bedingungen des Anbieters. Datenschutzerklärung des Anbieters: ${H.privacyUrl}`
          : `Datenschutzerklärung des Anbieters: ${H.privacyUrl}`,
      ],
    },
    {
      h: '4. Externe Seiten',
      p: [
        'Die Einkaufsliste enthält Links zum Webshop hopline.hu. Sie öffnen die externe Seite nur, wenn du sie anklickst – ab dann gilt die Datenschutzerklärung von hopline.hu. Die App sendet keine Daten an hopline.hu.',
        'Schriftarten und alle anderen Dateien werden von unserem eigenen Hosting geladen; es findet keine Übermittlung an Dritte wie Google statt.',
      ],
    },
    { h: '5. Cookies', p: ['Die Seite verwendet keine Cookies und fragt daher auch keine Cookie-Einwilligung ab.'] },
    {
      h: '6. Deine Rechte',
      p: [
        'Nach der DSGVO hast du das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Widerspruch. Da wir auf dem Server keine identifizierbaren Daten über dich speichern, kannst du die Daten auf deinem Gerät jederzeit selbst löschen.',
        `Bei Fragen oder Anliegen schreib an ${LEGAL.email} – wir antworten innerhalb eines Monats.`,
        'Du kannst dich bei der ungarischen Aufsichtsbehörde (NAIH, 1055 Budapest, Falk Miksa utca 9–11, www.naih.hu) oder bei der Aufsichtsbehörde deines Wohnsitzlandes beschweren und den Rechtsweg beschreiten.',
      ],
    },
    { h: '7. Änderungen', p: ['Ändert sich die Datenverarbeitung (z. B. Konten oder Analyse), wird diese Erklärung vorab aktualisiert.'] },
  ],
  storageTable: {
    head: ['Was speichert die App auf deinem Gerät?', 'Wozu?'],
    rows: [
      ['Das aktuelle Rezept und deine gespeicherten Rezepte', 'damit deine Arbeit nicht verloren geht'],
      ['Brauprotokoll, Gärmessungen, Kalibrierung', 'Sude verfolgen und Berechnungen verfeinern'],
      ['Eigene Preise und Kosteneinstellungen', 'Einkaufsliste und Kostenrechnung'],
      ['Sprache, Design und andere Einstellungen', 'damit deine Auswahl erhalten bleibt'],
      ['Die Dateien der App (Offline-Cache)', 'damit sie ohne Internet funktioniert'],
    ],
  },
  deleteTitle: 'Deine Daten auf diesem Gerät löschen',
  deleteText: 'Damit löschst du alles, was die App in diesem Browser gespeichert hat (Rezepte, Protokoll, Einstellungen, Offline-Cache). Das kann nicht rückgängig gemacht werden – exportiere vorher deine Rezepte, wenn du sie behalten willst.',
  deleteBtn: 'Alle meine Daten löschen',
  deleteConfirm: 'Wirklich alle auf diesem Gerät gespeicherten Daten löschen? Das kann nicht rückgängig gemacht werden.',
  deleteDone: 'Erledigt – alle lokalen Daten gelöscht.',
  notFilled: 'Hinweis: Die Betreiberdaten sind noch nicht ausgefüllt (src/legal/config.ts).',
};

export const PRIVACY_TEXT: Record<Lang, PrivacyText> = { hu: HU, en: EN, de: DE };
