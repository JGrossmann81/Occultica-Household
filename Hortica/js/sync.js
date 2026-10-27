/* Hortica sync and sharing. No server, no account.
   - Folder sync: on Chrome and Edge (Windows, Mac, Android) pick a file inside OneDrive, Dropbox or Google Drive; Hortica merges and saves to it, and any device pointed at the same file stays in step.
   - Share a garden: turn one map into a short code or a file and send it to anyone. */
const _saveRaw = save, gHash = {};
function stamp() { S.gardens.forEach(g => { const h = JSON.stringify([g.cells, g.name, g.w, g.h, g.ft, g.soil, g.kind, g.over, g.room]); if (gHash[g.id] === undefined) { gHash[g.id] = h; if (!g.mod) g.mod = Date.now(); } else if (gHash[g.id] !== h) { gHash[g.id] = h; g.mod = Date.now(); } }); Object.keys(S.seeds || {}).forEach(k => { const s = S.seeds[k], h = JSON.stringify([s.q, s.y, s.note]); if (s._h !== h) { s._h = h; s.t = Date.now(); } }); }
var save = function () { try { stamp(); S.mod = Date.now(); } catch (e) {} _saveRaw(); syncSoon(); };
const SYNC_SKIP = ['wx', 'wxn', 'chat'];
function syncPayload() { const o = {}; Object.keys(S).forEach(k => { if (SYNC_SKIP.indexOf(k) < 0) o[k] = S[k]; }); o.settings = Object.assign({}, S.settings, { apiKey: '' }); o.sync = undefined; return { fmt: 'hortica-sync', t: Date.now(), by: S.me || '', S: o }; }
function mergeInto(R) { // merge a remote state R into S: newest garden wins, logs are unions
  const L = S; R.tomb = R.tomb || {};
  Object.keys(R.tomb).forEach(id => { L.tomb[id] = Math.max(L.tomb[id] || 0, R.tomb[id]); });
  const gm = {}; L.gardens.forEach(g => { gm[g.id] = g; });
  (R.gardens || []).forEach(rg => { const lg = gm[rg.id]; if (L.tomb[rg.id] && L.tomb[rg.id] >= (rg.mod || 0)) return; if (!lg) { L.gardens.push(rg); gm[rg.id] = rg; } else if ((rg.mod || 0) > (lg.mod || 0)) { Object.keys(lg).forEach(k => delete lg[k]); Object.assign(lg, rg); } });
  L.gardens = L.gardens.filter(g => !(L.tomb[g.id] && L.tomb[g.id] >= (g.mod || 0)));
  const un = (a, b, key) => { const seen = {}; a.forEach(x => { seen[key(x)] = 1; }); b.forEach(x => { if (!seen[key(x)]) a.push(x); }); return a; };
  L.harv = un(L.harv || [], R.harv || [], x => x.id); L.photos = un(L.photos || [], R.photos || [], x => x.id);
  L.hist = un(L.hist || [], R.hist || [], x => x.g + '|' + x.y + '|' + x.at);
  L.log = un(L.log || [], R.log || [], x => x.d + x.msg).sort((a, b) => a.d < b.d ? 1 : a.d > b.d ? -1 : 0).slice(0, 120);
  Object.keys(R.seeds || {}).forEach(k => { const a = L.seeds[k], b = R.seeds[k]; if (!a || (b.t || 0) > (a.t || 0)) L.seeds[k] = b; });
  if (R.gopher) { L.gopher.ev = un(L.gopher.ev || [], R.gopher.ev || [], x => x.id); L.gopher.kills = Math.max(L.gopher.kills || 0, R.gopher.kills || 0); L.gopher.best = Math.max(L.gopher.best || 0, R.gopher.best || 0); Object.keys(R.gopher.ach || {}).forEach(k => { L.gopher.ach[k] = L.gopher.ach[k] || R.gopher.ach[k]; }); }
  Object.keys(R.watered || {}).forEach(k => { if (!L.watered[k] || R.watered[k] > L.watered[k]) L.watered[k] = R.watered[k]; }); Object.keys(R.done || {}).forEach(k => { if (R.done[k]) L.done[k] = true; });
  if ((R.mod || 0) > (L.mod || 0)) { if (R.loc && R.loc.lat) L.loc = Object.assign({}, L.loc, R.loc); if (R.start) L.start = R.start; if (R.curBy) { Object.keys(R.curBy).forEach(k => { if (!L.gardens.some(g => g.id === L.curBy[k]) && L.gardens.some(g => g.id === R.curBy[k])) L.curBy[k] = R.curBy[k]; }); } }
  L.gardens.forEach(g => { gHash[g.id] = undefined; });
  if (!L.setup && R.setup) L.setup = true;
}
/* --- file handle storage --- */
function sdb() { return new Promise((res, rej) => { try { const r = indexedDB.open('hortica-sync', 1); r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }); }
async function hGet() { try { const d = await sdb(); return await new Promise(res => { const q = d.transaction('h').objectStore('h').get('file'); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); } catch (e) { return null; } }
async function hPut(h) { const d = await sdb(); return new Promise(res => { const t = d.transaction('h', 'readwrite'); h ? t.objectStore('h').put(h, 'file') : t.objectStore('h').delete('file'); t.oncomplete = () => res(); t.onerror = () => res(); }); }
let syncH = null, syncBusy = false, syncTimer = null, syncState = { ok: null, msg: '' };
const canFS = () => !!(window.showSaveFilePicker && window.showOpenFilePicker);
async function syncNow(opts) {
  if (!syncH || syncBusy) return false; syncBusy = true;
  try {
    let perm = await syncH.queryPermission({ mode: 'readwrite' }); if (perm !== 'granted' && opts && opts.ask) perm = await syncH.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') { syncState = { ok: false, msg: 'Paused: tap to allow access to the sync file.' }; return false; }
    const f = await syncH.getFile(), txt = await f.text(); let remote = null; if (txt.trim()) { try { const j = JSON.parse(txt); if (j.fmt === 'hortica-sync' && j.S && j.S.gardens) remote = j.S; } catch (e) {} }
    if (remote) mergeInto(remote);
    const w = await syncH.createWritable(); await w.write(JSON.stringify(syncPayload())); await w.close();
    S.sync.t = Date.now(); S.sync.on = true; _saveRaw(); syncState = { ok: true, msg: 'In sync ' + tm(new Date()) }; return true;
  } catch (e) { syncState = { ok: false, msg: 'Sync problem: ' + (e && e.message ? e.message : e) }; return false; }
  finally { syncBusy = false; if (sheetOpen() && $('#syncbody')) $('#syncbody').innerHTML = syncHTML(); }
}
function syncSoon() { if (!syncH || !S.sync.on) return; clearTimeout(syncTimer); syncTimer = setTimeout(() => { syncNow().then(ok => { if (ok && !sheetOpen() && S.setup) render(); }); }, 4000); }
async function syncBoot() {
  if (!canFS()) return; syncH = await hGet(); if (!syncH) return; S.sync.on = true; const ok = await syncNow(); if (ok) { if (!sheetOpen()) render(); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && syncH) syncNow().then(ok => { if (ok && !sheetOpen() && S.setup) render(); }); });
}
function syncChip() { if (!syncH || syncState.ok !== false) return ''; return '<section class="card alert"><b>🔄 Sync paused.</b> <span class="sm">' + esc(syncState.msg) + '</span> <button class="mini" data-act="syncResume">Resume</button></section>'; }
ACT.syncResume = async () => { const ok = await syncNow({ ask: true }); toast(ok ? 'Synced.' : syncState.msg); render(); };
ACT.syncPick = async () => {
  try {
    const mode = $('#syncmode') ? $('#syncmode').value : 'new'; let h;
    if (mode === 'open') [h] = await window.showOpenFilePicker({ types: [{ description: 'Hortica sync file', accept: { 'application/json': ['.json'] } }] });
    else h = await window.showSaveFilePicker({ suggestedName: 'hortica-sync.json', types: [{ description: 'Hortica sync file', accept: { 'application/json': ['.json'] } }] });
    syncH = h; await hPut(h); S.sync.on = true; const ok = await syncNow({ ask: true }); toast(ok ? 'Sync is on. Merged and saved.' : 'Could not sync: ' + syncState.msg, 4000); render(); if ($('#syncbody')) $('#syncbody').innerHTML = syncHTML();
  } catch (e) { if (e && e.name !== 'AbortError') toast('Could not set up sync: ' + e.message, 4000); }
};
ACT.syncOff = async () => { syncH = null; await hPut(null); S.sync.on = false; _saveRaw(); $('#syncbody').innerHTML = syncHTML(); toast('Sync stopped. Your data stays on this device.'); };
ACT.syncGo = async () => { toast('Syncing…'); const ok = await syncNow({ ask: true }); toast(ok ? 'In sync.' : syncState.msg); render(); $('#syncbody') && ($('#syncbody').innerHTML = syncHTML()); };

/* --- share one garden --- */
async function gz(str) { if (!window.CompressionStream) return 'P' + btoa(unescape(encodeURIComponent(str))); const cs = new CompressionStream('gzip'), w = cs.writable.getWriter(); w.write(new TextEncoder().encode(str)); w.close(); const buf = new Uint8Array(await new Response(cs.readable).arrayBuffer()); let s = ''; buf.forEach(b => { s += String.fromCharCode(b); }); return 'Z' + btoa(s); }
async function ungz(code) { const t = code[0], b = atob(code.slice(1)); if (t === 'P') return decodeURIComponent(escape(b)); const u = Uint8Array.from(b, c => c.charCodeAt(0)), ds = new DecompressionStream('gzip'), w = ds.writable.getWriter(); w.write(u); w.close(); return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer()); }
function sharePack(g) { const base = baseOf(g) || g, gs = [base].concat(overlaysOf(base)), clean = x => ({ id: x.id, name: x.name, w: x.w, h: x.h, ft: x.ft, soil: x.soil, kind: x.kind, over: x.over, room: x.room, cells: Object.keys(x.cells).reduce((o, k) => { o[k] = { p: x.cells[k].p, s: 'plan' }; return o; }, {}) }); return { v: 1, app: 'hortica', by: (S.loc && S.loc.name) || '', gardens: gs.map(clean) }; }
async function shareCode(g) { return 'HORTICA1:' + await gz(JSON.stringify(sharePack(g))); }
async function importShare(code) {
  code = String(code).replace(/\s+/g, ''); if (code.indexOf('HORTICA1:') !== 0) throw new Error('That does not look like a Hortica share code.');
  const o = JSON.parse(await ungz(code.slice(9))); if (!o || o.app !== 'hortica' || !Array.isArray(o.gardens) || !o.gardens.length || o.gardens.length > 6) throw new Error('That share code is damaged.');
  const idmap = {}; o.gardens.forEach(x => { idmap[x.id] = uid(); }); let n = 0;
  o.gardens.forEach(x => { const kind = ['herb', 'flower', 'fungi'].concat(LAND_ORDER).indexOf(x.kind) >= 0 ? x.kind : undefined, g = newGarden(String(x.name || 'Shared garden').slice(0, 40) + (o.by ? ' (from ' + String(o.by).slice(0, 30) + ')' : ' (shared)'), clamp(+x.w || 8, 1, 60), clamp(+x.h || 6, 1, 60), clamp(+x.ft || 1, .5, 12)); g.id = idmap[x.id]; if (kind) g.kind = kind; if (SOILS[x.soil]) g.soil = x.soil; if (x.over && idmap[x.over]) g.over = idmap[x.over]; if (kind === 'fungi' && x.room) g.room = { t: +x.room.t || 68, h: +x.room.h || 70, where: x.room.where === 'out' ? 'out' : 'in' };
    Object.keys(x.cells || {}).forEach(k => { const m = /^(\d+),(\d+)$/.exec(k), p = x.cells[k] && x.cells[k].p; if (m && +m[1] < g.w && +m[2] < g.h && (PBY[p] || SPECIAL[p])) g.cells[k] = { p, s: 'plan' }; }); S.gardens.push(g); n++; });
  setCur(S.gardens.find(g => g.id === idmap[o.gardens[0].id])); save(); return n;
}
ACT.shareOpen = async el => { const g = G(); if (!g) return; const code = await shareCode(g); UI.shareCode = code; if ($('#sharebox')) { $('#sharebox').value = code; $('#sharelen').textContent = code.length + ' characters'; } };
ACT.shareCopy = async () => { const code = UI.shareCode || await shareCode(G()); try { await navigator.clipboard.writeText(code); toast('Share code copied. Paste it into a text or email.'); } catch (e) { const t = $('#sharebox'); if (t) { t.select(); toast('Select and copy the code.'); } } };
ACT.shareSend = async () => { const code = UI.shareCode || await shareCode(G()); if (navigator.share) { try { await navigator.share({ title: 'Hortica garden: ' + G().name, text: code }); return; } catch (e) { if (e.name === 'AbortError') return; } } ACT.shareCopy(); };
ACT.shareFile = async () => { const code = UI.shareCode || await shareCode(G()); try { const b = new Blob([code], { type: 'text/plain' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (G().name || 'garden').replace(/[^\w]+/g, '-') + '.hortica.txt'; document.body.appendChild(a); a.click(); a.remove(); toast('Saved. Send that file to a friend.'); } catch (e) { toast('Could not save the file.'); } };
ACT.shareImport = async () => { const t = $('#impbox').value; try { const n = await importShare(t); closeSheetQuiet(); UI.tab = 'garden'; render(); toast('Imported ' + n + ' map' + (n > 1 ? 's' : '') + '. Look under your garden list.', 4500); } catch (e) { $('#impmsg').textContent = e.message || 'Could not read that code.'; } };
CHG.impFile = el => { const f = el.files && el.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { $('#impbox').value = String(r.result); }; r.readAsText(f); };

function syncHTML() {
  const on = !!(syncH && S.sync.on);
  return '<div class="flag"><b>🔄 Keep two devices in step</b><br><span class="sm">' + (canFS() ? 'Pick a file inside a folder that OneDrive, Dropbox or Google Drive already syncs between your devices. Hortica merges your maps, harvest log, seed shelf and gopher log into it, and any device pointed at the same file stays current. Photos stay on the device they were taken on.' : 'This browser cannot sync to a folder (iPhone and Safari cannot). Use Chrome or Edge on a computer or Android phone for automatic sync, or use the share code below and Export and Import in Settings.') + '</span></div>' +
    (canFS() ? (on ? '<p class="sm ' + (syncState.ok === false ? 'warn' : 'ok') + '">' + esc(syncState.msg || ('Sync is on. Last synced ' + (S.sync.t ? fmtD(new Date(S.sync.t)) + ' ' + tm(new Date(S.sync.t)) : 'never') + '.')) + '</p><div class="row wrap"><button class="btn gold" data-act="syncGo">Sync now</button><button class="btn danger" data-act="syncOff">Stop syncing</button></div>' : '<label class="fl">This is…<select class="in" id="syncmode"><option value="new">My first device (create the sync file)</option><option value="open">Another device (open the existing sync file)</option></select></label><button class="btn gold block" data-act="syncPick">Choose the sync file</button>') : '') +
    '<div class="flag"><b>📤 Share this garden with someone</b><br><span class="sm">Sends the layout of <b>' + esc((G() || {}).name || 'your map') + '</b> (and its flower layer). They get their own copy to adjust. Your harvests, photos and private notes are not included.</span></div>' +
    '<div class="row wrap"><button class="btn" data-act="shareSend">Send…</button><button class="btn" data-act="shareCopy">Copy code</button><button class="btn" data-act="shareFile">Save file</button></div><textarea class="in" id="sharebox" rows="3" readonly placeholder="Tap Send, Copy or Save to make a code"></textarea><p class="sm dim" id="sharelen"></p>' +
    '<div class="flag"><b>📥 Got a share code?</b></div><textarea class="in" id="impbox" rows="3" placeholder="Paste the code that starts with HORTICA1:"></textarea><label class="btn filebtn">Open a saved file<input type="file" accept=".txt,text/plain" data-chg="impFile" hidden></label><button class="btn gold block" data-act="shareImport">Import this garden</button><p class="sm warn" id="impmsg"></p>';
}
ACT.syncOpen = () => { openSheet('🔄 Sync and share', '<div id="syncbody">' + syncHTML() + '</div>'); if (G()) shareCode(G()).then(c => { UI.shareCode = c; const b = $('#sharebox'); if (b) { b.value = c; $('#sharelen').textContent = c.length + ' characters'; } }); };
