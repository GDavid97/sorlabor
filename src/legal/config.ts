/**
 * Az adatvédelmi tájékoztató adatai – ÉLESÍTÉS ELŐTT TÖLTSD KI!
 * (Név és elérhetőség kötelező: a GDPR szerint az adatkezelőnek azonosíthatónak kell lennie.)
 */
export const LEGAL = {
  /** Az üzemeltető (adatkezelő) neve – magánszemélyként a saját neved */
  operatorName: '[Üzemeltető neve]',
  /** Kapcsolattartási e-mail cím (pl. egy külön postafiók a domainhez) */
  email: '[kapcsolat@sorlabor.hu]',
  /** A tárhelyszolgáltató (adatfeldolgozó) – Cloudflare Pages esetén ez maradhat */
  hosting: {
    name: 'Cloudflare, Inc. (Cloudflare Pages)',
    address: '101 Townsend St, San Francisco, CA 94107, USA',
    /** EU-n kívüli szolgáltató? (ha magyar/EU-s tárhelyre költözöl, állítsd false-ra és írd át a fenti adatokat) */
    outsideEU: true,
    privacyUrl: 'https://www.cloudflare.com/privacypolicy/',
  },
  /** A tájékoztató utolsó módosítása */
  updated: '2026-11-16',
};

export const isLegalFilled = () => !LEGAL.operatorName.startsWith('[') && !LEGAL.email.startsWith('[');
