/* Healthica emergency health card: a lock-screen picture and an offline QR code (plain text any phone camera
   can read, no app or internet needed), plus a printable wallet card. The person picks what to show. */
const ICE_SENSITIVE = new Set(['anx', 'dep', 'bipolar', 'edhist', 'minor', 'ttc', 'meno']);
const ICE_DEFAULT_ON = new Set(['t1d', 't2d', 'heart', 'arrhythmia', 'htn', 'asthma', 'kidney', 'liver', 'panc', 'celiac', 'preg', 'cancer', 'osteo', 'apnea', 'thyroid']);
const ICE = () => S.ice || (S.ice = { blood: '', medAllergy: '', contacts: [{ name: '', rel: '', phone: '' }, { name: '', rel: '', phone: '' }], doctor: '', notes: '', dob: '', hide: { meds: true }, conds: null, noAllergy: false });
function iceConds() { const c = Array.from(condSet()).filter(x => !['minor', 'edhist'].includes(x)); const on = ICE().conds; return c.map(x => ({ id: x, label: condLabel(x), on: on ? on.includes(x) : (ICE_DEFAULT_ON.has(x) && !ICE_SENSITIVE.has(x)) })); }
function iceFacts() {
  const i = ICE(), p = S.profile || {}, h = H(), R = typeof diaRisk === 'function' && typeof diaOn === 'function' && diaOn() ? diaRisk() : null;
  const food = (h.allergies || []).map(a => (ALLERGENS[a] || [a])[0]), allergies = [i.medAllergy.trim(), food.length ? 'Food: ' + food.join(', ') : ''].filter(Boolean).join('; ');
  const conds = iceConds().filter(c => c.on).map(c => c.label);
  const meds = (S.settings.medText || '').split(/[\n,;]+/).map(x => x.trim()).filter(Boolean).join(', ');
  const auto = R ? (R.insulin ? 'Uses insulin. ' : R.su ? 'Takes diabetes pills that can cause low sugar. ' : '') + 'If confused, sweaty or drowsy: check blood sugar.' : '';
  return {
    name: p.name || '', age: p.age || '', dob: i.dob, blood: i.blood, allergies: allergies || (i.noAllergy ? 'No known allergies' : 'Not recorded'), conds: conds.join(', '), meds,
    contacts: i.contacts.filter(c => c.name || c.phone), doctor: i.doctor, notes: [auto, i.notes.trim()].filter(Boolean).join(' ')
  };
}
function iceText() {
  const f = iceFacts(), hide = ICE().hide, L = ['EMERGENCY MEDICAL INFO'];
  L.push((f.name || 'Name not set') + (f.dob ? ', born ' + f.dob : f.age ? ', age ' + f.age : ''));
  if (f.blood) L.push('Blood type: ' + f.blood);
  if (!hide.allergies) L.push('Allergies: ' + f.allergies);
  if (!hide.conds && f.conds) L.push('Conditions: ' + f.conds);
  if (!hide.meds && f.meds) L.push('Medicines: ' + f.meds);
  if (f.notes) L.push('Notes: ' + f.notes);
  f.contacts.forEach(c => L.push('Emergency contact: ' + [c.name, c.rel ? '(' + c.rel + ')' : '', c.phone].filter(Boolean).join(' ')));
  if (f.doctor) L.push('Doctor: ' + f.doctor);
  L.push('Updated ' + new Date().toLocaleDateString() + ' (Healthica)');
  return L.join('\n');
}
function iceForm() {
  const i = ICE(), f = iceFacts(), cs = iceConds();
  return `<p class="sm dim">Fill this in once. The card shows on your lock screen, so anyone holding your phone can read it: only include what you are comfortable sharing.</p>
    <div class="grid2"><label class="fl">Blood type<select id="iblood" class="in">${['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => `<option ${b === i.blood ? 'selected' : ''} value="${b}">${b || 'Not sure'}</option>`).join('')}</select></label>
      <label class="fl">Date of birth (optional)<input id="idob" class="in" value="${esc(i.dob)}" placeholder="e.g. 3/14/1972"></label></div>
    <label class="fl">Medicine or other allergies<input id="imal" class="in" value="${esc(i.medAllergy)}" placeholder="e.g. penicillin (hives), latex, bee stings"></label>
    <label class="fl"><input type="checkbox" id="inoal" ${i.noAllergy ? 'checked' : ''}> I have no known allergies</label>
    ${f.allergies.includes('Food:') ? `<div class="sm dim">Food allergies from your profile are included: ${esc(f.allergies.split('Food: ')[1] || '')}.</div>` : ''}
    <label class="fl">Conditions to show</label><div class="chips c" id="iconds">${cs.length ? cs.map(c => `<button type="button" class="chip${c.on ? ' on' : ''}" data-act="iceCond" data-v="${c.id}">${esc(c.label)}</button>`).join('') : '<span class="sm dim">None in your profile.</span>'}</div>
    <div class="sm dim">Medicines come from your profile list${S.settings.medText ? ': ' + esc(f.meds) : ' (none listed yet; add them in Health profile)'}.</div>
    ${[0, 1].map(n => `<label class="fl">Emergency contact ${n + 1}</label><div class="grid2"><input id="icn${n}" class="in" value="${esc(i.contacts[n].name)}" placeholder="Name"><input id="icr${n}" class="in" value="${esc(i.contacts[n].rel)}" placeholder="Relationship"></div><input id="icp${n}" class="in" type="tel" value="${esc(i.contacts[n].phone)}" placeholder="Phone">`).join('')}
    <label class="fl">Doctor (optional)<input id="idoc" class="in" value="${esc(i.doctor)}" placeholder="Dr. Lee, 555-0100"></label>
    <label class="fl">Other notes (optional)<input id="inotes" class="in" value="${esc(i.notes)}" placeholder="Pacemaker, organ donor, speaks Spanish, service dog..."></label>
    <label class="fl"><input type="checkbox" id="ihm" ${i.hide.meds ? '' : 'checked'}> Show medicines on the lock screen (anyone holding your phone can read them)</label>
    <label class="fl"><input type="checkbox" id="ihc" ${i.hide.conds ? '' : 'checked'}> Show conditions</label>
    <button class="btn gold block" data-act="iceMake">Make my card</button>`;
}
function iceRead() {
  const i = ICE(), v = id => ($('#' + id) || { value: '' }).value.trim();
  i.blood = v('iblood'); i.dob = v('idob'); i.medAllergy = v('imal'); i.doctor = v('idoc'); i.notes = v('inotes');
  i.contacts = [0, 1].map(n => ({ name: v('icn' + n), rel: v('icr' + n), phone: v('icp' + n) }));
  i.hide.meds = !($('#ihm') || {}).checked; i.noAllergy = !!($('#inoal') || {}).checked; i.hide.conds = !($('#ihc') || {}).checked;
  i.conds = $$('#iconds .chip.on').map(c => c.dataset.v); save();
}
/* lock-screen picture: 1170 x 2532 (fits most phones; top third left clear for the clock) */
function iceCanvas() {
  const W = 1170, Hh = 2532, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const g = cv.getContext('2d'), f = iceFacts(), hide = ICE().hide;
  g.fillStyle = '#120e24'; g.fillRect(0, 0, W, Hh);
  let y = 880; const x = 80, maxW = W - 160, sans = '-apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  g.fillStyle = '#c0392b'; g.beginPath(); g.roundRect ? g.roundRect(x, y - 70, maxW, 100, 24) : g.rect(x, y - 70, maxW, 100); g.fill();
  g.fillStyle = '#fff'; g.font = `bold 54px ${sans}`; g.fillText('✚ MEDICAL INFO', x + 34, y); y += 110;
  const line = (label, text, size, color) => { if (!text) return; g.font = `bold 34px ${sans}`; g.fillStyle = '#d9b45a'; g.fillText(label.toUpperCase(), x, y); y += 52; g.font = `${size || 46}px ${sans}`; g.fillStyle = color || '#f3eee2';
    const words = String(text).split(' '); let cur = ''; words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW) { g.fillText(cur, x, y); y += (size || 46) * 1.25; cur = w; } else cur = t; }); if (cur) { g.fillText(cur, x, y); y += (size || 46) * 1.25; } y += 22; };
  g.font = `bold 64px ${sans}`; g.fillStyle = '#f3eee2'; g.fillText((f.name || '') + (f.blood ? '  ·  ' + f.blood : ''), x, y); y += 90;
  if (!hide.allergies) line('Allergies', f.allergies, 48, /^(Not recorded|No known)/.test(f.allergies) ? '#f3eee2' : '#ff9a8f');
  if (!hide.conds) line('Conditions', f.conds, 44);
  if (!hide.meds) line('Medicines', f.meds, 40);
  line('Notes', f.notes, 40);
  f.contacts.slice(0, 2).forEach((c, n) => line(n ? 'Second contact' : 'Emergency contact', [c.name, c.rel ? '(' + c.rel + ')' : '', c.phone].filter(Boolean).join(' '), 46));
  const m = iceQR(); if (!m || y > Hh - 420) return cv; const n = m.length, size = Math.min(520, Hh - y - 140), cell = Math.floor(size / (n + 8)), qs = cell * (n + 8), qx = (W - qs) / 2, qy = Math.max(y + 10, Hh - qs - 120);
  g.fillStyle = '#fff'; g.fillRect(qx, qy, qs, qs); g.fillStyle = '#000'; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) g.fillRect(qx + (c + 4) * cell, qy + (r + 4) * cell, cell, cell);
  g.font = `30px ${sans}`; g.fillStyle = '#b9b2a3'; g.textAlign = 'center'; g.fillText('Scan with any phone camera for full details', W / 2, qy + qs + 50); g.textAlign = 'left';
  return cv;
}
function iceQR() { const t = iceText(); for (const cut of [t, t.slice(0, 900), t.split('\n').filter(l => !/^(Medicines|Notes|Doctor):/.test(l)).join('\n').slice(0, 600)]) { try { return qrMatrix(cut); } catch (e) { } } return null; }
function iceSVG(px) { const m = iceQR(); if (!m) return '<div class="sm warn">Too much text for a QR code. Shorten the notes.</div>'; const n = m.length; let d = ''; m.forEach((row, r) => row.forEach((on, c) => { if (on) d += `M${c + 4} ${r + 4}h1v1h-1z`; })); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 8} ${n + 8}" width="${px}" height="${px}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`; }
function iceResult() {
  let url = ''; try { url = iceCanvas().toDataURL('image/png'); } catch (e) { }
  openSheet('Your emergency card', `<p class="sm"><b>Lock screen:</b> press and hold the picture, then Save to Photos (or tap Save picture). Then set it as your lock-screen wallpaper.</p>
    ${url ? `<img src="${url}" alt="Emergency card" style="width:100%;max-width:300px;display:block;margin:8px auto;border-radius:16px;border:1px solid var(--line)">` : ''}
    <div class="row wrap"><button class="btn gold" data-act="iceSave">Save picture</button><button class="btn" data-act="icePrint">Print wallet card</button><button class="btn" data-act="iceCopy">Copy as text</button></div>
    <section class="card inner"><div class="ct"><span>The QR code</span></div><div style="text-align:center">${iceSVG(200)}</div><div class="sm dim">Plain text, readable by any phone camera with no app and no internet. Test it with another phone.</div></section>
    <section class="card inner"><div class="sm"><b>Also fill in your phone's own emergency info</b>. Paramedics are trained to check it, and it shows without unlocking: iPhone: Health app > Medical ID. Android: Settings > Safety and emergency.</div></section>
    <button class="btn block" data-act="iceOpen">Edit card</button>`);
}
Object.assign(ACT, {
  iceOpen() { openSheet('Emergency health card', iceForm()); },
  iceCond(el) { el.classList.toggle('on'); },
  iceMake() { iceRead(); if (!S.profile.name) toast('Tip: add your name in Health profile.'); iceResult(); },
  iceSave() { const a = document.createElement('a'); a.href = iceCanvas().toDataURL('image/png'); a.download = 'emergency-card-' + ((S.profile && S.profile.name) || 'me').replace(/\W+/g, '-').toLowerCase() + '.png'; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 500); },
  iceCopy() { const t = iceText(); try { navigator.clipboard.writeText(t).then(() => toast('Copied.')); } catch (e) { toast('Could not copy.'); } },
  icePrint() {
    const f = iceFacts(), w = window.open('', '_blank'); if (!w) { toast('Allow pop-ups to print.'); return; }
    const card = `<div class="c"><div class="h">✚ MEDICAL INFO</div><b>${esc(f.name)}</b>${f.blood ? ' · ' + esc(f.blood) : ''}<div><b>Allergies:</b> ${esc(f.allergies)}</div>${!ICE().hide.conds && f.conds ? `<div><b>Conditions:</b> ${esc(f.conds)}</div>` : ''}${!ICE().hide.meds && f.meds ? `<div><b>Medicines:</b> ${esc(f.meds)}</div>` : ''}${f.notes ? `<div>${esc(f.notes)}</div>` : ''}${f.contacts.map(c => `<div><b>Call:</b> ${esc([c.name, c.rel && '(' + c.rel + ')', c.phone].filter(Boolean).join(' '))}</div>`).join('')}</div>`;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Emergency card</title><style>body{font:9pt -apple-system,Arial,sans-serif;margin:12mm}.wrap{display:flex;gap:6mm;flex-wrap:wrap}.c{width:85.6mm;height:54mm;box-sizing:border-box;border:1px dashed #999;border-radius:3mm;padding:3mm;overflow:hidden}.h{background:#c0392b;color:#fff;font-weight:700;padding:1mm 2mm;margin:-1mm -1mm 1.5mm;border-radius:2mm}.q{display:flex;align-items:center;justify-content:center}.q svg{width:44mm;height:44mm}p{color:#555}</style></head><body><p>Cut out both cards, fold along the middle and keep in your wallet. Updated ${new Date().toLocaleDateString()}.</p><div class="wrap">${card}<div class="c q">${iceSVG(160)}</div></div><script>setTimeout(function(){print()},300)<\/script></body></html>`); w.document.close();
  }
});
