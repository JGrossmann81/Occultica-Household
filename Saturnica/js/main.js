/* Saturnica boot. */
function boot() {
  load();
  document.addEventListener('click', e => { const b = e.target.closest('#tabs button'); if (b) setTab(b.dataset.tab); });
  render(); if (S.setup) { checkin(); render(); }
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
}
window.addEventListener('DOMContentLoaded', boot);
