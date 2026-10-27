/* Hortica boot. */
function boot() {
  load(); if (!S.setup) setFrostEstimate();
  document.addEventListener('click', e => { const b = e.target.closest('#tabs button'); if (b) setTab(b.dataset.tab); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S.setup && !sheetOpen()) refreshWx().then(() => { if (!sheetOpen() && (UI.tab === 'plan' || UI.tab === 'garden')) render(); }); });
  render(); syncBoot();
  if (S.setup) refreshWx().then(() => { maybeNotify(); if (!sheetOpen() && (UI.tab === 'plan' || UI.tab === 'garden')) render(); });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
}
window.addEventListener('DOMContentLoaded', boot);
