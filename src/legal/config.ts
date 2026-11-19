/**
 * Az adatvédelmi tájékoztató adatai.
 * (Név és elérhetőség kötelező: a GDPR szerint az adatkezelőnek azonosíthatónak kell lennie.)
 */
export const LEGAL = {
  /** Az üzemeltető (adatkezelő) neve – magánszemélyként a saját neved */
  operatorName: 'Göbölyös Dávid',
  /** Kapcsolattartási e-mail cím (pl. egy külön postafiók a domainhez) */
  email: 'davidgobolyos@gmail.com',
  /** A tárhelyszolgáltató (adatfeldolgozó) */
  hosting: {
    name: 'Cloudflare, Inc. (Cloudflare Workers)',
    address: '101 Townsend St, San Francisco, CA 94107, USA',
    /** EU-n kívüli szolgáltató? (ha magyar/EU-s tárhelyre költözöl, állítsd false-ra és írd át a fenti adatokat) */
    outsideEU: true,
    privacyUrl: 'https://www.cloudflare.com/privacypolicy/',
  },
  /** A tájékoztató utolsó módosítása */
  updated: '2026-11-19',
};

export const isLegalFilled = () => !LEGAL.operatorName.startsWith('[') && !LEGAL.email.startsWith('[');
