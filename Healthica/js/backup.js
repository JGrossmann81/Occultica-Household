/* Healthica backup codes: copy everything as one block of text (keep it in Notes or email it to yourself),
   paste it back to restore or to move to a new phone. iPhones can clear a web app's data after weeks unused. */
const BK_TAG = 'HEALTHICA1:', BK_TAGZ = 'HEALTHICAZ1:';
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
function bkAll() { // everyone on this phone (caregiver mode), or just this profile
  if (typeof profList !== 'function' || profList().length < 2) return S;
  save(); const people = profList(), data = {}; people.forEach(p => { const d = profRead(p.id); if (d) data[p.id] = d; });
  return { v: 1, multi: true, people, active: profActive(), data };
}
async function bkMake() {
  const raw = new TextEncoder().encode(JSON.stringify(bkAll()));
  if (typeof CompressionStream === 'function') {
    try { const z = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()); return BK_TAGZ + b64(z); } catch (e) { }
  }
  return BK_TAG + b64(raw);
}
async function bkRead(code) {
  code = String(code || '').replace(/\s+/g, '');
  if (code.startsWith(BK_TAGZ)) {
    if (typeof DecompressionStream !== 'function') throw new Error('This phone cannot open compressed codes. Update the browser, or use a backup file.');
    const u = unb64(code.slice(BK_TAGZ.length)); return JSON.parse(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
  }
  if (code.startsWith(BK_TAG)) return JSON.parse(new TextDecoder().decode(unb64(code.slice(BK_TAG.length))));
  if (code.startsWith('{')) return JSON.parse(code);
  throw new Error('That is not a Healthica backup code.');
}
const bkStamp = () => { S.settings.lastBackup = Date.now(); save(); };
function bkSummary(d) {
  if (d.multi) return `Household backup for ${d.people.length} people: ${d.people.map(p => esc(p.name || 'someone')).join(', ')}.`;
  const n = (d.food || []).length, w = (d.weights || []).length, l = (d.logs || []).length;
  return `${esc(d.profile && d.profile.name ? d.profile.name + "'s" : 'A')} backup: ${n} food entries, ${w} weigh-ins, ${l} log entries${d.settings && d.settings.lastBackup ? ', made ' + new Date(d.settings.lastBackup).toLocaleDateString() : ''}.`;
}
function bkRestoreAsk(d) {
  window.BKPEND = d;
  openSheet('Restore this backup?', `<p class="sm">${bkSummary(d)}</p><p class="sm warn">${d.multi ? 'This replaces everyone on this phone with the people in the backup.' : (typeof profMany === 'function' && profMany()) ? 'This adds the backup as its own person. Nobody already on this phone is changed.' : 'This replaces everything on this phone with the backup.'} Make a backup of this phone first if it has anything you want to keep.</p>
    <button class="btn gold block" data-act="bkRestoreYes">Yes, restore</button><button class="btn block" data-act="closeSheet">Cancel</button>`);
}
function openBackup() {
  const lb = S.settings.lastBackup;
  openSheet('Backup and restore', `<p class="sm dim">Everything in Healthica lives only on this phone. iPhones can erase a web app's data if it goes unused for a few weeks or storage runs low, so keep a backup somewhere safe.</p>
    <div class="sm">${lb ? 'Last backup: ' + new Date(lb).toLocaleDateString() + ' (' + ago(lb) + ')' : '<span class="warn">No backup yet.</span>'}</div>
    <section class="card inner"><div class="ct"><span>Backup code</span></div><div class="sm dim">One block of text. Paste it into Notes, or email it to yourself. It contains your health information, so keep it private.</div>
      <button class="btn gold block" data-act="bkMake">Make my backup code</button><div id="bkout"></div></section>
    <section class="card inner"><div class="ct"><span>Restore or move to a new phone</span></div><textarea id="bkin" class="in" rows="4" placeholder="Paste your backup code here"></textarea><button class="btn block" data-act="bkUse">Restore from code</button></section>
    <section class="card inner"><div class="ct"><span>Backup file</span></div><div class="sm dim">Saves a .json file to Files or Downloads.</div><div class="row wrap"><button class="btn" data-act="export">Save backup file</button><button class="btn" data-act="import">Restore from file</button></div></section>`);
}
Object.assign(ACT, {
  backup() { openBackup(); },
  async bkMake() {
    const out = $('#bkout'); out.innerHTML = '<div class="sm dim">Making...</div>';
    try {
      const code = await bkMake(); bkStamp();
      out.innerHTML = `<textarea id="bkcode" class="in" rows="5" readonly>${esc(code)}</textarea><div class="sm dim">${Math.round(code.length / 1024)} KB of text.</div><button class="btn block" data-act="bkCopy">Copy code</button>`;
      try { await navigator.clipboard.writeText(code); toast('Backup code copied. Paste it into Notes.', 4000); } catch (e) { }
    } catch (e) { out.innerHTML = '<div class="sm warn">Could not make a code. Use the backup file instead.</div>'; }
  },
  bkCopy() { const ta = $('#bkcode'); try { navigator.clipboard.writeText(ta.value).then(() => toast('Copied.'), () => { ta.focus(); ta.select(); }); } catch (e) { ta.focus(); ta.select(); } },
  async bkUse() { try { const d = await bkRead($('#bkin').value); if (!d || !(d.v || d.multi)) throw new Error('That is not a Healthica backup code.'); bkRestoreAsk(d); } catch (e) { toast(e.message && e.message.length < 120 ? e.message : 'That code did not work. Copy the whole thing and try again.', 5000); } },
  bkRestoreYes() { const d = window.BKPEND; if (!d) return;
    if (d.multi) { try { profList().forEach(p => { if (!d.people.some(q => q.id === p.id)) localStorage.removeItem(profKey(p.id)); }); d.people.forEach(p => { if (d.data[p.id]) localStorage.setItem(profKey(p.id), JSON.stringify(d.data[p.id])); }); localStorage.setItem(PROF_IDX, JSON.stringify(d.people)); localStorage.setItem(PROF_ACT, d.people.some(p => p.id === profActive()) ? profActive() : 'main'); } catch (e) { toast('Not enough space to restore everyone.'); return; } KEY = profKey(profActive()); load(); window.BKPEND = null; closeSheet(); render(); toast('Restored ' + d.people.length + ' people.'); return; }
    if (typeof profMany === 'function' && profMany()) { const id = uid(), L = profList(); L.push({ id, name: (d.profile && d.profile.name) || 'Restored', rel: 'other' }); try { localStorage.setItem(profKey(id), JSON.stringify(d)); } catch (e) { toast('Not enough space to restore.'); return; } profSaveList(L); window.BKPEND = null; profSwitch(id); toast('Restored as its own person.'); return; }
    S = d; const b = blank(); Object.keys(b).forEach(k => { if (S[k] === undefined) S[k] = b[k]; }); Object.keys(b.settings).forEach(k => { if (S.settings[k] === undefined) S.settings[k] = b.settings[k]; }); save(); window.BKPEND = null; closeSheet(); render(); toast('Backup restored.'); }
});
(function () {
  const e0 = ACT.export; ACT.export = function (el, e) { e0(el, e); bkStamp(); };
  const n0 = nudgeList; nudgeList = function () {
    const out = n0(), lb = S.settings.lastBackup || 0, first = S.food.length ? Math.min(...S.food.map(f => f.ts || Date.now())) : Date.now();
    const age = Date.now() - (lb || first);
    if ((S.food.length + S.logs.length + S.weights.length) >= 10 && age > 14 * 86400000) out.push(['Back up your data', lb ? 'Your last backup was ' + ago(lb) + '. Settings > Backup and restore.' : 'You have not made a backup yet. Settings > Backup and restore takes 10 seconds.', 'Settings']);
    return out;
  };
})();
