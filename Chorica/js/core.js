/* Chorica core: storage, dates, chore schedules, money, and the text codes that carry chore lists
   (parent to kid) and check-offs (kid to parent). No server: everything lives on each phone. */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad2 = n => String(n).padStart(2, '0');
const dkey = d => { d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const weekStart = k => { const d = parseKey(k), w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return dkey(d); }; // Monday
const fmtDay = k => parseKey(k).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
const money = v => (v < 0 ? '-$' : '$') + Math.abs(v).toFixed(Math.abs(v) % 1 ? 2 : 0);
const round2 = v => Math.round(v * 100) / 100;
const DAYN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const KEY = 'chorica.v1';
let S = null;
const UI = { tab: 'home', ktab: 'today', as: null };
const ACT = {};
function blank() { return { v: 1, role: null, fam: { parent: '', pin: '', payday: 5, missed: 'roll', fine: 0, streak: 0 }, kids: [], chores: [], done: [], pay: [], bonus: [], sent: {}, me: null, bal: null, taken: [], status: {}, goal: null, lastList: 0, settings: {} }; }
function load() { try { const r = localStorage.getItem(KEY); S = r ? JSON.parse(r) : blank(); } catch (e) { S = blank(); } const b = blank(); Object.keys(b).forEach(k => { if (S[k] === undefined) S[k] = b[k]; }); Object.keys(b.fam).forEach(k => { if (S.fam[k] === undefined) S.fam[k] = b.fam[k]; }); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { let n = 0; (S.done || []).forEach(d => { if (d.ph) { d.ph = null; d.photo = true; n++; } }); try { localStorage.setItem(KEY, JSON.stringify(S)); if (n) toast('Phone storage was full, so saved photos were removed. Everything else is safe.', 5000); } catch (x) { toast('Could not save (storage full?)'); } } }
const isParent = () => S.role === 'parent';
const kidById = id => S.kids.find(k => k.id === id);
const choreById = id => S.chores.find(c => c.id === id);

/* ---------- presets ---------- */
const PRESETS = [
  ['🧺', 'Laundry: wash, dry, fold, put away', 3, 'days', [6], ['Sort lights and darks', 'Wash and dry', 'Fold', 'Put it all away']],
  ['🍽️', 'Dishes', 1, 'daily', null, ['Clear the table', 'Load or wash the dishes', 'Wipe the counters', 'Empty the sink']],
  ['🗑️', 'Take out the garbage', 1, 'days', [2, 5], ['Kitchen and bathroom bins', 'New bags in', 'Cans to the curb on pickup day']],
  ['♻️', 'Recycling out', 0.5, 'weekly', null, null],
  ['💩', 'Pick up dog poop in the yard', 2, 'weekly', null, ['Whole yard, corners too', 'Bag it and bin it', 'Wash your hands']],
  ['🐕', 'Walk the dog', 1, 'daily', null, null],
  ['🦴', 'Feed the pets', 0.5, 'daily', null, null],
  ['🪶', 'Dusting', 2, 'weekly', null, ['Shelves and tables', 'TV stand and screens (dry cloth)', 'Window sills', 'Baseboards in one room']],
  ['🚽', 'Clean a bathroom', 5, 'weekly', null, ['Toilet inside and out', 'Sink and faucet', 'Mirror', 'Tub or shower', 'Sweep and mop the floor', 'Empty the trash']],
  ['🧹', 'Vacuum or sweep', 2, 'weekly', null, null],
  ['🪣', 'Mop the floors', 3, 'weekly', null, null],
  ['🛏️', 'Make your bed', 0.25, 'daily', null, null],
  ['🧸', 'Clean your room', 2, 'weekly', null, ['Clothes in the hamper', 'Floor clear', 'Desk tidy', 'Trash out']],
  ['🌱', 'Water the garden', 1, 'days', [1, 3, 5], null],
  ['🍂', 'Rake leaves or yard work', 5, 'once', null, null],
  ['🚗', 'Wash the car', 5, 'once', null, null],
  ['🍳', 'Help cook dinner', 1, 'weekly', null, null],
  ['🛒', 'Put groceries away', 0.5, 'weekly', null, null]
];
const ICONS = ['🧺', '🍽️', '🗑️', '♻️', '💩', '🐕', '🐈', '🦴', '🪶', '🚽', '🧹', '🪣', '🛏️', '🧸', '🌱', '🍂', '🚗', '🍳', '🛒', '🪟', '🧼', '📚', '🎹', '🏃', '👶', '🧊', '🪴', '📦', '🔧', '✨', '⭐', '💪'];
const EMOJI = ['🦊', '🐺', '🦁', '🐯', '🐼', '🐸', '🦄', '🐙', '🦉', '🐬', '🌟', '🔥', '⚡', '🎧', '🎮', '⚽'];

/* ---------- schedules ---------- */
const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
const REPS = [['daily', 'Every day'], ['days', 'Certain days'], ['weekly', 'Once a week'], ['biweekly', 'Every 2 weeks'], ['monthly', 'Once a month'], ['once', 'One time']];
function repLabel(r) { if (!r) return ''; if (r.t === 'daily') return 'Every day'; if (r.t === 'weekly') return 'Once a week'; if (r.t === 'biweekly') return 'Every 2 weeks'; if (r.t === 'monthly') return 'Once a month'; if (r.t === 'once') return r.date ? 'Once, by ' + fmtDay(r.date) : 'One time'; if (r.t === 'days') return (r.days || []).slice().sort().map(d => DAYN[d]).join(', '); return ''; }
/* every-2-weeks periods are counted from the week the chore was created */
function biStart(c, k) { const a = weekStart(c.start || k), n = Math.floor(daysBetween(a, weekStart(k)) / 14); return addDays(a, n * 14); }
/* the "occurrence key" a check-off belongs to: a date, a week, a 2-week period, a month, or the single one-time job */
function occKey(c, k) { const r = c.rep || {}; if (r.t === 'weekly') return 'w' + weekStart(k); if (r.t === 'biweekly') return 'b' + biStart(c, k); if (r.t === 'monthly') return 'm' + k.slice(0, 7); if (r.t === 'once') return 'once'; return k; }
/* last day of the occurrence that contains day k (when it becomes "missed") */
function occEnd(c, k) { const r = c.rep || {}; if (r.t === 'weekly') return addDays(weekStart(k), 6); if (r.t === 'biweekly') return addDays(biStart(c, k), 13); if (r.t === 'monthly') { const d = parseKey(k); return dkey(new Date(d.getFullYear(), d.getMonth() + 1, 0)); } if (r.t === 'once') return r.date || null; return k; }
function dueOn(c, k) {
  const r = c.rep || {}; if (c.active === false) return false; if (c.start && k < c.start) return false;
  if (r.t === 'once' && r.date && k > r.date) return false; if (['daily', 'weekly', 'biweekly', 'monthly', 'once'].includes(r.t)) return true; if (r.t === 'days') return (r.days || []).includes(parseKey(k).getDay()); return false;
}
function occStart(c, k) { const r = c.rep || {}; if (r.t === 'weekly') return weekStart(k); if (r.t === 'biweekly') return biStart(c, k); if (r.t === 'monthly') return k.slice(0, 7) + '-01'; if (r.t === 'once') return c.start || k; return k; }
/* take turns: the kid whose turn it is, decided once at the start of each chore period */
function turnKid(c, k) {
  if (!c.turns || !Array.isArray(c.kids) || c.kids.length < 2) return null; k = occStart(c, k); const a = c.turnStart || c.start || k;
  const i = c.turns === 'day' ? daysBetween(a, k) : Math.floor(daysBetween(weekStart(a), weekStart(k)) / 7); const n = c.kids.length; return c.kids[((i % n) + n) % n];
}
/* with a day: is it this kid's job that day (rotation-aware); without a day: is the kid on this chore at all */
function forKid(c, kidId, k) { if (c.kids === 'any') return true; if (!Array.isArray(c.kids) || !c.kids.includes(kidId)) return false; if (k && c.turns && c.kids.length > 1) return turnKid(c, k) === kidId; return true; }
const kidName = id => (kidById(id) || {}).name || ((S.names || {})[id]) || 'someone';
/* status of one chore for one kid on one day: todo | pending | approved | rejected | taken (someone else did an "anyone" chore) */
function stateOf(c, kidId, k) {
  const key = occKey(c, k), mine = S.done.filter(d => d.chore === c.id && d.key === key && d.kid === kidId && d.status !== 'rejected').sort((a, b) => b.ts - a.ts)[0];
  if (mine) return { st: mine.status, d: mine };
  const rej = S.done.filter(d => d.chore === c.id && d.key === key && d.kid === kidId && d.status === 'rejected').sort((a, b) => b.ts - a.ts)[0];
  if (c.kids === 'any' || c.turns) { const other = S.done.find(d => d.chore === c.id && d.key === key && d.kid !== kidId && d.status !== 'rejected') || (S.taken || []).find(t => t.chore === c.id && t.key === key); if (other) return { st: 'taken', by: other.kid ? kidName(other.kid) : other.by, d: other }; }
  if (c.rep && c.rep.t === 'once' && S.done.some(d => d.chore === c.id && d.key === 'once' && d.status === 'approved')) return { st: 'taken' };
  return { st: 'todo', rej };
}
const missedMode = () => S.fam.missed || 'roll';
/* chores a kid did not do in an occurrence that has already ended, between two days (inclusive) */
function missedBetween(kidId, from, to, kidStart) {
  const out = [], seen = new Set(), today = dkey(); to = to < addDays(today, -1) ? to : addDays(today, -1);
  for (let k = from; k <= to; k = addDays(k, 1)) S.chores.forEach(c => {
    if (c.kids === 'any' || !dueOn(c, k) || !forKid(c, kidId, k) || (kidStart && k < kidStart) || (c.since && k < c.since)) return; const end = occEnd(c, k); if (!end || end !== k || end >= today) return;
    const key = occKey(c, k), sig = c.id + '|' + key; if (seen.has(sig)) return; seen.add(sig);
    if (S.done.some(d => d.chore === c.id && d.key === key && d.kid === kidId && d.status !== 'rejected')) return;
    if (c.rep && c.rep.t === 'once' && S.done.some(d => d.chore === c.id && d.key === 'once' && d.status === 'approved')) return;
    out.push({ c, k, key });
  });
  return out;
}
const MAKEUP_DAYS = 7;
function todayList(kidId, k) {
  k = k || dkey(); const old = Date.now() - 3 * 86400000;
  const L = S.chores.filter(c => forKid(c, kidId, k) && dueOn(c, k)).map(c => Object.assign({ c, k }, stateOf(c, kidId, k))).filter(x => !(x.c.rep && x.c.rep.t === 'once' && ((x.st === 'taken' && !x.d) || (x.st === 'approved' && x.d && (x.d.decidedTs || x.d.ts) < old))));
  if (missedMode() === 'roll') missedBetween(kidId, addDays(k, -MAKEUP_DAYS), addDays(k, -1), kidStartOf(kidId)).forEach(m => { const st = stateOf(m.c, kidId, m.k); if (st.st === 'todo') L.push(Object.assign({ c: m.c, k: m.k, late: true }, st)); });
  return L;
}
const kidStartOf = id => { const x = isParent() ? kidById(id) : S.me; return (x && x.added) || null; };

/* ---------- money (parent ledger is the truth) ---------- */
function ledger(kidId) {
  const earned = round2(S.done.filter(d => d.kid === kidId && d.status === 'approved').reduce((s, d) => s + (d.amt || 0), 0));
  const bonus = round2(S.bonus.filter(b => b.kid === kidId).reduce((s, b) => s + b.amt, 0));
  const paid = round2(S.pay.filter(p => p.kid === kidId).reduce((s, p) => s + p.amt, 0));
  const pending = round2(S.done.filter(d => d.kid === kidId && d.status === 'pending').reduce((s, d) => s + ((choreById(d.chore) || {}).amt || 0), 0));
  return { earned, bonus, paid, owed: round2(earned + bonus - paid), pending, total: round2(earned + bonus) };
}

/* ---------- codes: CHORICA1.<base64url of gzip JSON> ---------- */
const b64u = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = t => { t = t.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; return Uint8Array.from(atob(t), c => c.charCodeAt(0)); };
async function gz(u8, on) { const C = on ? CompressionStream : DecompressionStream; return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new C('gzip'))).arrayBuffer()); }
async function encode(obj) { const raw = new TextEncoder().encode(JSON.stringify(obj)); if (typeof CompressionStream === 'function' && !(S && S.settings && S.settings.plain)) { try { return 'CHORICAZ1.' + b64u(await gz(raw, true)); } catch (e) { } } return 'CHORICA1.' + b64u(raw); }
async function decode(code) {
  code = String(code || '').trim(); const m = code.match(/CHORICAZ?1\.[A-Za-z0-9_\-]+/); if (!m) throw new Error('That is not a Chorica code. Copy the whole message.');
  const c = m[0]; if (c.startsWith('CHORICAZ1.')) { if (typeof DecompressionStream !== 'function') throw new Error('This phone is too old to open that code. Update it to iOS 16.4 or newer, or ask the sender to turn on "Codes for older phones" in Chorica Settings.'); return JSON.parse(new TextDecoder().decode(await gz(unb64u(c.slice(10)), false))); }
  return JSON.parse(new TextDecoder().decode(unb64u(c.slice(9))));
}
const appLink = code => location.origin + location.pathname.replace(/index\.html$/, '') + '#' + code;
async function shareCode(title, text, code) {
  const msg = text + '\n' + appLink(code);
  try { if (navigator.share) { await navigator.share({ title, text: msg }); return 'shared'; } } catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
  try { await navigator.clipboard.writeText(msg); toast('Copied. Paste it into a text message.', 4000); return 'copied'; } catch (e) { }
  return 'manual';
}
