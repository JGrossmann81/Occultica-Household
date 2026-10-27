/* Hortica photos: stored on this device (IndexedDB), resized small. Optional Garden Sage leaf diagnosis uses your own API key. */
function pdb() { return new Promise((res, rej) => { try { const r = indexedDB.open('hortica-photos', 1); r.onupgradeneeded = () => r.result.createObjectStore('p'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }); }
async function pput(id, blob) { const d = await pdb(); return new Promise((res, rej) => { const t = d.transaction('p', 'readwrite'); t.objectStore('p').put(blob, id); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); }
async function pget(id) { const d = await pdb(); return new Promise((res, rej) => { const q = d.transaction('p').objectStore('p').get(id); q.onsuccess = () => res(q.result || null); q.onerror = () => rej(q.error); }); }
async function pdel(id) { const d = await pdb(); return new Promise(res => { const t = d.transaction('p', 'readwrite'); t.objectStore('p').delete(id); t.oncomplete = () => res(); t.onerror = () => res(); }); }
async function shrink(file, max) {
  max = max || 900; const url = URL.createObjectURL(file);
  try { const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; }); const sc = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return await new Promise(res => c.toBlob(b => res(b), 'image/jpeg', .8)); }
  finally { URL.revokeObjectURL(url); }
}
const photosOf = o => S.photos.filter(f => (!o.p || f.p === o.p) && (!o.g || f.g === o.g) && (!o.k || f.k === o.k));
function photoAdder(o, label) { return '<label class="btn filebtn">' + (label || '📷 Add photo') + '<input type="file" accept="image/*" capture="environment" data-chg="photoPick" data-p="' + esc(o.p || '') + '" data-g="' + esc(o.g || '') + '" data-k="' + esc(o.k || '') + '" hidden></label>'; }
CHG.photoPick = async el => {
  const f = el.files && el.files[0]; if (!f) return; const p = el.dataset.p, g = el.dataset.g, k = el.dataset.k;
  try { const b = await shrink(f), id = uid(); await pput(id, b); S.photos.push({ id, p, g, k, d: dkey(), note: '' }); save(); toast('Photo saved on this device.'); if (sheetOpen() && g && k) { const gg = S.gardens.find(x => x.id === g); if (gg) { const a = k.split(','); tileSheet(gg, +a[0], +a[1]); } } else if (sheetOpen()) { photoView(id); } else render(); }
  catch (e) { toast('Could not save that photo on this device.'); }
};
function thumbs(list, n) { return list.slice(-(n || 12)).reverse().map(f => '<button class="thumb" data-act="photoView" data-v="' + f.id + '" aria-label="Photo"><img data-ph="' + f.id + '" alt=""></button>').join(''); }
async function hydratePhotos(root) { for (const im of $$('img[data-ph]:not([data-ok])', root || document)) { im.dataset.ok = 1; try { const b = await pget(im.dataset.ph); if (b) im.src = URL.createObjectURL(b); } catch (e) {} } }
new MutationObserver(() => { if ($('img[data-ph]:not([data-ok])')) hydratePhotos(); }).observe(document.documentElement, { childList: true, subtree: true });
function photoShelfHTML() { const L = S.photos; return '<section class="card"><div class="ct"><span>📷 Photos</span><span class="tag">' + L.length + '</span></div>' + (L.length ? '<div class="thumbs">' + thumbs(L, 18) + '</div>' : '<p class="dim sm">Open any tile and tap Add photo to build a picture diary. Photos stay on this device.</p>') + '<p class="sm dim">A photo of a sick leaf can go to the Garden Sage (needs your own API key in Settings).</p></section>'; }
function tilePhotos(g, k, p) { const L = photosOf({ g: g.id, k }); return '<h3 class="h3">📷 Photos</h3>' + (L.length ? '<div class="thumbs">' + thumbs(L, 8) + '</div>' : '') + '<div class="row wrap">' + photoAdder({ p, g: g.id, k }) + '</div>'; }
ACT.photoView = async el => {
  const f = S.photos.find(x => x.id === el.dataset.v); if (!f) return;
  openSheet('Photo', '<img class="bigphoto" data-ph="' + f.id + '" alt=""><p class="sm dim">' + (f.p ? esc(pName(f.p)) + ' · ' : '') + fmtDY(pd(f.d)) + '</p><label class="fl">Note<input class="in" id="phn" value="' + esc(f.note || '') + '" data-chg="phNote" data-v="' + f.id + '"></label>' + (S.settings.apiKey ? '<button class="btn gold block" data-act="photoSage" data-v="' + f.id + '">🌿 Ask the Garden Sage what is wrong</button><div id="phres"></div>' : '<div class="flag"><b>Want a diagnosis?</b><br><span class="sm">Add your Anthropic key in Settings and the Garden Sage can look at this photo. Meanwhile, the Fix tab walks you through symptoms.</span><br><button class="mini" data-act="goTab" data-v="fix">Open Fix</button></div>') + '<button class="btn danger block" data-act="photoDel" data-v="' + f.id + '">Delete photo</button>');
};
CHG.phNote = el => { const f = S.photos.find(x => x.id === el.dataset.v); if (f) { f.note = el.value; save(); } };
ACT.photoDel = async el => { await pdel(el.dataset.v); S.photos = S.photos.filter(x => x.id !== el.dataset.v); save(); closeSheet(); toast('Photo deleted.'); };
function blobB64(b) { return new Promise(res => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.readAsDataURL(b); }); }
ACT.photoSage = async el => {
  const f = S.photos.find(x => x.id === el.dataset.v), box = $('#phres'); box.innerHTML = '<p class="sm dim">The Sage is looking…</p>';
  try { const b = await pget(f.id), data = await blobB64(b), q = 'Look at this photo from my garden' + (f.p ? ' (' + pName(f.p) + ')' : '') + '. ' + (f.note ? 'My note: ' + f.note + '. ' : '') + 'What looks wrong, how sure are you, and what should I do? Give organic-first steps and say what else to check.'; const t = await sageAsk(q, data); box.innerHTML = '<div class="bub sage"><p class="sm">' + mdLite(t) + '</p></div><p class="foot">A photo cannot confirm a diagnosis. For crop loss, ask your local extension office.</p>'; }
  catch (e) { box.innerHTML = '<div class="flag ask"><b>No answer</b><br><span class="sm">' + (e.status === 401 ? 'Anthropic did not accept the key.' : e.message === 'Failed to fetch' ? 'No connection.' : esc(e.message)) + '</span></div>'; }
};
