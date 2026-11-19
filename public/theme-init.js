// Téma beállítása a React betöltése előtt (ne villanjon a rossz téma)
(function () {
  var pref = 'system';
  try { pref = localStorage.getItem('sorlabor.theme.v1') || 'system'; } catch (e) {}
  var light = pref === 'light' || (pref === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches);
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
})();
