import { useEffect, useState } from 'react';

export type ThemePref = 'system' | 'dark' | 'light';
const KEY = 'sorlabor.theme.v1';

export function loadThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'dark' || v === 'light' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
}

const systemTheme = (): 'dark' | 'light' =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

function apply(pref: ThemePref) {
  const resolved = pref === 'system' ? systemTheme() : pref;
  document.documentElement.dataset.theme = resolved;
  return resolved;
}

/** Téma-választás: rendszer / sötét / világos – mentve, a rendszerbeállítás változását is követi. */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(loadThemePref);
  const [resolved, setResolved] = useState<'dark' | 'light'>(() => apply(loadThemePref()));

  useEffect(() => {
    setResolved(apply(pref));
    try {
      localStorage.setItem(KEY, pref);
    } catch {
      /* nem elérhető */
    }
    if (pref !== 'system' || typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-color-scheme: light)');
    const onChange = () => setResolved(apply('system'));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);

  return { pref, setPref, resolved };
}
