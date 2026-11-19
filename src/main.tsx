import React, { Suspense, lazy, useEffect, useState } from 'react';
// Betűtípusok saját tárhelyről (nincs adattovábbítás a Google felé, offline is működik)
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/700.css';
import ReactDOM from 'react-dom/client';
import { Landing, type Entry } from './landing/Landing';
import { BRAND, getLang } from './i18n/lang';
import { registerServiceWorker } from './lib/pwa';

registerServiceWorker();

/** A főzőpult külön csomagban töltődik – a landing gyors marad. */
const loadApp = () => import('./App');
const App = lazy(loadApp);
const Privacy = lazy(() => import('./legal/Privacy'));
let prefetched = false;
const prefetchApp = () => {
  if (prefetched) return;
  prefetched = true;
  void loadApp();
};

type Route = { page: 'landing' } | { page: 'privacy' } | { page: 'app'; entry: Entry };

function parse(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  if (h === 'privacy') return { page: 'privacy' };
  if (h === 'app') return { page: 'app', entry: 'app' };
  if (h === 'app/tour') return { page: 'app', entry: 'tour' };
  if (h === 'app/recipes') return { page: 'app', entry: 'recipes' };
  if (h.startsWith('app/recipe/')) return { page: 'app', entry: `recipe:${h.slice('app/recipe/'.length)}` };
  return { page: 'landing' };
}

function Loading() {
  return (
    <div className="boot-loader" role="status" aria-label="Loading">
      <span>🍺</span>
    </div>
  );
}

function Root() {
  const [route, setRoute] = useState<Route>(() => parse(location.hash));

  useEffect(() => {
    const onHash = () => {
      setRoute(parse(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (route.page === 'app') document.title = BRAND[getLang()].name;
  }, [route]);

  const go = (e: Entry) => {
    location.hash = e === 'app' ? '#/app' : e.startsWith('recipe:') ? `#/app/recipe/${e.slice(7)}` : `#/app/${e}`;
  };

  if (route.page === 'landing') return <Landing go={go} prefetch={prefetchApp} />;
  if (route.page === 'privacy')
    return (
      <Suspense fallback={<Loading />}>
        <Privacy onBack={() => (history.length > 1 ? history.back() : (location.hash = '#/'))} />
      </Suspense>
    );
  return (
    <Suspense fallback={<Loading />}>
      <App entry={route.entry} onHome={() => (location.hash = '#/')} />
    </Suspense>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
