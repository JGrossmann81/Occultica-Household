/* Saturnica game layer and UI plumbing: dispatch, sheets, XP, levels, medals, quests, wins, vault feeding, celebration. */
const UI = { tab: 'home', sub: {}, wiz: 0 };
const ACT = {}, CHG = {};
function openSheet(title, html, opts) {
  const sh = $('#sheet'); sh.innerHTML = '<div class="sh-bar"><b>' + esc(title) + '</b><button class="x" data-act="closeSheet" aria-label="Close">&times;</button></div><div class="sh-body">' + html + '</div>';
  sh.classList.add('open'); document.body.classList.add('noscroll'); sh.scrollTop = 0; if (opts && opts.mount) opts.mount(sh);
}
function closeSheetQuiet() { $('#sheet').classList.remove('open'); document.body.classList.remove('noscroll'); }
function closeSheet() { closeSheetQuiet(); render(); }
function sheetOpen() { return $('#sheet').classList.contains('open'); }
function toast(msg, ms) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), ms || 2800); }
document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (!el || el.disabled) return; const fn = ACT[el.dataset.act]; if (fn) { e.preventDefault(); fn(el, e); } });
document.addEventListener('change', e => { const el = e.target.closest('[data-chg]'); if (!el) return; const fn = CHG[el.dataset.chg]; if (fn) fn(el, e); });
document.addEventListener('input', e => { const el = e.target.closest('[data-inp]'); if (!el) return; const fn = CHG[el.dataset.inp]; if (fn) fn(el, e); });
ACT.closeSheet = closeSheet;
const chips = (arr, cur, act, extra) => arr.map(a => '<button class="chip' + (a[0] === cur ? ' on' : '') + '" data-act="' + act + '" data-v="' + esc(a[0]) + '" ' + (extra || '') + '>' + a[1] + '</button>').join('');

/* ---------- sound and confetti ---------- */
let ACTX = null;
function fanfare(big) {
  if (!S.settings.sound) return; try {
    ACTX = ACTX || new (window.AudioContext || window.webkitAudioContext)(); const a = ACTX, t0 = a.currentTime;
    const note = (f, t, d, type, v) => { const o = a.createOscillator(), gn = a.createGain(); o.type = type || 'triangle'; o.frequency.value = f; gn.gain.setValueAtTime(0, t0 + t); gn.gain.linearRampToValueAtTime(v || .12, t0 + t + .02); gn.gain.exponentialRampToValueAtTime(.001, t0 + t + d); o.connect(gn); gn.connect(a.destination); o.start(t0 + t); o.stop(t0 + t + d + .05); };
    if (big) { note(80, 0, .4, 'sine', .3); [523, 659, 784, 1047, 1319].forEach((f, i) => note(f, .15 + i * .09, .3)); note(1568, .65, .7, 'square', .1); }
    else { note(1319, 0, .15, 'sine', .12); note(1760, .1, .3, 'sine', .12); } // coin ching
  } catch (e) {}
  try { if (navigator.vibrate) navigator.vibrate(big ? [60, 30, 60, 30, 160] : [40]); } catch (e) {}
}
function confetti(em) {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas'); cv.className = 'confetti'; cv.width = innerWidth; cv.height = innerHeight; document.body.appendChild(cv); const c = cv.getContext('2d'), P = []; em = em || ['🪙', '💰', '⭐', '🎉', '🪐', '💎', '💵'];
  for (let i = 0; i < 70; i++) P.push({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * .5, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4, r: Math.random() * 6, vr: (Math.random() - .5) * .3, e: pick(em), s: 18 + Math.random() * 18 });
  let t = 0; (function f() { c.clearRect(0, 0, cv.width, cv.height); P.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += p.vr; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.font = p.s + 'px serif'; c.fillText(p.e, 0, 0); c.restore(); }); if (++t < 150) requestAnimationFrame(f); else cv.remove(); })();
}
function bigText(a, b, then, ms) {
  const fx = $('#fx'), reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  fx.innerHTML = '<div class="fatal"><div class="fa">' + esc(a) + '</div><div class="fb">' + esc(b) + '</div></div>'; fx.className = 'on'; fanfare(true); confetti();
  setTimeout(() => { fx.className = ''; fx.innerHTML = ''; if (then) then(); }, reduce ? 300 : (ms || 1500));
}

/* ---------- xp and levels ---------- */
function lvlOf(xp) { let i = 0; LEVELS.forEach((l, k) => { if (xp >= l[0]) i = k; }); const nx = LEVELS[i + 1]; return { n: i + 1, name: LEVELS[i][1], from: LEVELS[i][0], next: nx ? nx[0] : null, nextName: nx ? nx[1] : null }; }
function addXP(n, why) {
  const m = 1 + vaultInfo().boost, got = Math.max(1, Math.round(n * m)); const before = lvlOf(S.game.xp).n; S.game.xp += got; const L = lvlOf(S.game.xp);
  if (L.n > before) { S.game.lvl = L.n; setTimeout(() => { bigText('LEVEL UP!', '⭐ ' + L.name + ' ⭐', null, 1300); toast('Level ' + L.n + ': ' + L.name, 4000); }, 350); }
  return got;
}
function award(id) { if (S.game.med[id]) return false; S.game.med[id] = dkey(); const m = MEDBY[id]; addXP(40, 'medal'); fanfare(false); toast('🏅 Medal: ' + m[2] + '. ' + m[3] + '.', 4500); return true; }
function totalWins() { return S.wins.reduce((a, w) => a + num(w.amt), 0); }
function monthWins() { const k = mkey(); return S.wins.filter(w => w.d.slice(0, 7) === k).reduce((a, w) => a + num(w.amt), 0); }
function checkMedals() {
  const c = calc(), A = S.assets, g = S.game, L = lvlOf(g.xp).n, dp = S.debts.length, paid = S.log.filter(l => /Paid off/.test(l.msg)).length;
  const t = { first: S.inc.length > 0, budget: lineList().length >= 5, zero: c.hasInc && c.hasExp && c.surplus >= -c.inc * .02 && c.surplus <= c.inc * .05, debtlist: dp > 0, extra: S.log.some(l => /extra payment/i.test(l.msg)), pay1: paid > 0, debtfree: dp > 0 && c.cbal <= 0 && c.mbal <= 0, shield: num(A.emerg) >= 1000, fortress: c.ess > 0 && num(A.emerg) >= 3 * c.ess, ring4: c.hasInc && num(S.ret.contrib) / c.inc >= .15, millionaire: c.nw >= 1000000,
    h1: S.wins.length > 0, h100: totalWins() >= 100, h1000: totalWins() >= 1000, sold5: S.sells.filter(s => s.sold).length >= 5, streak7: g.best >= 7, streak30: g.best >= 30, goal1: S.goals.length > 0, dream3: S.goals.length >= 3, subcut: S.subs.some(s => s.cut), tier3: ['emerg', 'retire', 'invest'].some(k => vaultInfo()[k].tier >= 3), lvl5: L >= 5, lvl10: L >= 10 };
  Object.keys(t).forEach(k => { if (t[k]) award(k); });
}
function checkTiers() {
  const v = vaultInfo(), g = S.game; ['emerg', 'retire', 'invest'].forEach(k => { const prev = g.tiers[k] || 0; if (v[k].tier > prev) { g.tiers[k] = v[k].tier; if (prev || v[k].tier > 0) { addXP(60 * v[k].tier); setTimeout(() => { bigText('VAULT TIER UP!', VNAME[k] + ': ' + TIERN[v[k].tier], null, 1400); }, 300); } } else if (v[k].tier < prev) g.tiers[k] = v[k].tier; });
}
const VNAME = { emerg: '🏰 Fortress Vault', retire: '🪐 Ring Vault', invest: '👑 Crown Vault' };
function after() { checkMedals(); checkTiers(); save(); }

/* ---------- streak and quests ---------- */
function weekKey(d) { d = d || NOW(); const m = addD(d, -((d.getDay() + 6) % 7)); return dkey(m); }
function qKey(q) { return q.id + ':' + (q.per === 'd' ? dkey() : weekKey()); }
function questDone(q) { return !!S.game.q[qKey(q)]; }
function doQuest(id) { const q = QUESTS.find(x => x.id === id); if (!q || questDone(q)) return false; S.game.q[qKey(q)] = 1; const got = addXP(q.xp); toast(q.e + ' Quest done: +' + got + ' XP', 3200); return true; }
function checkin() {
  const g = S.game, t = dkey(); if (g.last === t) return; const y = dkey(addD(NOW(), -1)); g.streak = g.last === y ? g.streak + 1 : 1; g.best = Math.max(g.best, g.streak); g.last = t; addXP(5 + Math.min(g.streak, 10)); after();
  if (g.streak > 1) toast('🔥 ' + g.streak + '-day streak. Keep reigning.', 3000);
}
ACT.noSpend = () => { const t = dkey(); if (S.game.nosp.indexOf(t) >= 0) { toast('Already logged a no-spend day today.'); return; } S.game.nosp.push(t); const n = S.game.nosp.length; doQuest('qspend'); addXP(10); logIt('No-spend day'); after(); fanfare(false); toast('🧘 No-spend day #' + n + '. That is real money kept.', 3500); render(); };
function gameBar() {
  const g = S.game, L = lvlOf(g.xp), rs = ringsState(), v = vaultInfo(), p = L.next ? Math.round((g.xp - L.from) / (L.next - L.from) * 100) : 100;
  return '<button class="gbar" data-act="quests" aria-label="Quests and medals"><div class="gtop"><span class="glv">Lv ' + L.n + ' <b>' + esc(L.name) + '</b></span><span class="gstat">🔥 ' + g.streak + '</span><span class="gstat">🪐 ' + rs.count + '/7</span>' + (v.boost > 0 ? '<span class="gstat boost">⚡+' + Math.round(v.boost * 100) + '%</span>' : '') + '</div><div class="pbar"><i style="width:' + p + '%"></i></div><div class="gbot"><span>' + g.xp + ' XP</span><span>' + (L.next ? (L.next - g.xp) + ' to ' + esc(L.nextName) : 'Max level') + '</span></div></button>';
}
ACT.quests = () => {
  const dq = QUESTS.filter(q => q.per === 'd'), wq = QUESTS.filter(q => q.per === 'w'), row = q => '<div class="task' + (questDone(q) ? ' dn' : '') + '"><button class="ck" data-act="questTap" data-v="' + q.id + '" aria-label="Done">' + (questDone(q) ? '✓' : '') + '</button><div class="tt"><b>' + q.e + ' ' + esc(q.t) + '</b> <span class="tag">+' + q.xp + ' XP</span></div></div>';
  const meds = MEDALS.map(m => '<div class="medal' + (S.game.med[m[0]] ? ' got' : '') + '"><span>' + (S.game.med[m[0]] ? m[1] : '🔒') + '</span><b>' + esc(m[2]) + '</b><small>' + esc(m[3]) + '</small></div>').join('');
  const v = vaultInfo();
  openSheet('Quests and medals', '<p class="sm dim">Every dollar decision is a move in the game. Quests reset daily and weekly.' + (v.boost ? ' Your vaults give a +' + Math.round(v.boost * 100) + '% XP boost.' : ' Feed your vaults to earn an XP boost.') + '</p><h3 class="h3">Today</h3>' + dq.map(row).join('') + '<h3 class="h3">This week</h3>' + wq.map(row).join('') + '<h3 class="h3">Medals <span class="tag">' + Object.keys(S.game.med).length + '/' + MEDALS.length + '</span></h3><div class="medals">' + meds + '</div>');
};
ACT.questTap = el => { const q = QUESTS.find(x => x.id === el.dataset.v); if (['qspend', 'qextra', 'qvault', 'qhustle', 'qsell'].indexOf(q.id) >= 0 && !questDone(q)) { toast('This one completes itself when you do it in the app.'); return; } doQuest(q.id); after(); ACT.quests(); };

/* ---------- money moves ---------- */
function payDebt(id, amt, why) {
  const d = S.debts.find(x => x.id === id); if (!d || !(amt > 0)) return; const a = Math.min(amt, num(d.bal)); d.bal = Math.max(0, num(d.bal) - a); S.pays = S.pays || []; logIt((why || 'Extra payment') + ': ' + $$$(a) + ' on ' + d.n); addXP(8 + a / 20); doQuest('qextra');
  if (num(d.bal) <= 0) { logIt('Paid off ' + d.n + '!'); addXP(300); const left = S.debts.filter(x => num(x.bal) > 0).length; after(); bigText('PAID OFF!', '💀 ' + d.n + ' is dead 💀', () => { openSheet('Debt destroyed', '<div class="victory"><div class="vstone">🪦</div><h2 class="big center">' + esc(d.n) + '</h2><p class="center">The balance is zero. ' + (left ? 'Roll its payment into the next debt. ' + left + ' to go.' : 'You are DEBT FREE (except the home if you have one). Time for the Fortress.') + '</p><button class="btn gold block" data-act="closeSheet">Onward</button></div>'); }, 1500); }
  else after();
}
function feedVault(kind, amt) {
  if (!(amt > 0)) return; const A = S.assets; A[kind] = num(A[kind]) + amt; S.vlog.push({ id: uid(), d: dkey(), k: kind, amt }); logIt('Fed ' + VNAME[kind].slice(3) + ' ' + $$$(amt)); addXP(3 + amt / 25); doQuest('qvault'); const before = JSON.stringify(S.game.tiers); after(); if (before === JSON.stringify(S.game.tiers)) { fanfare(false); toast('🏺 ' + $$$(amt) + ' added to the ' + VNAME[kind].slice(3) + '.', 2800); }
}
function logWin(amt, src, to) {
  const w = { id: uid(), d: dkey(), amt, src: src || 'Side hustle', to: to || null }; S.wins.push(w); logIt('Hustle win ' + $$$(amt) + (src ? ' (' + src + ')' : '')); const xp = addXP(10 + Math.min(80, amt / 10)); doQuest('qhustle'); const rk = hrankOf(totalWins()), prev = hrankOf(totalWins() - amt); after();
  bigText(pick(WINS), '💰 +' + $$$(amt) + ' 💰', () => winSheet(w, rk, rk.name !== prev.name ? rk.name : null, xp), 1500);
}
function hrankOf(t) { let r = HRANKS[0]; HRANKS.forEach(x => { if (t >= x[0]) r = x; }); const i = HRANKS.indexOf(r), nx = HRANKS[i + 1]; return { name: r[1], from: r[0], next: nx ? nx[0] : null, nextName: nx ? nx[1] : null }; }
function winSheet(w, rk, promoted, xp) {
  const first = S.debts.filter(d => d.t !== 'mortgage' && num(d.bal) > 0).sort((a, b) => debtPlan().plan.order.findIndex(o => o.id === a.id) - debtPlan().plan.order.findIndex(o => o.id === b.id))[0];
  const c = calc(), btn = (act, label, extra) => '<button class="btn block" data-act="' + act + '" data-id="' + w.id + '" ' + (extra || '') + '>' + label + '</button>';
  openSheet('Win logged', '<div class="victory"><div class="vstone">💰</div><h2 class="big center">' + $$$(w.amt, w.amt % 1 !== 0) + ' from ' + esc(w.src) + '</h2><p class="center epi">' + esc(pick(WINLINES)) + '</p><div class="sum"><div><b>' + $$$(totalWins()) + '</b><span>career total</span></div><div><b>' + $$$(monthWins()) + '</b><span>this month</span></div><div><b>+' + xp + '</b><span>XP</span></div></div>' +
    (promoted ? '<div class="flag"><b>🎖️ PROMOTED: ' + esc(promoted) + '</b></div>' : '') + '<h3 class="h3 center">Where does this win go?</h3>' +
    (first ? btn('winTo', '⚔️ Smash ' + esc(first.n) + ' (' + $$$(num(first.bal)) + ')', 'data-to="debt:' + first.id + '"') : '') + btn('winTo', '🏰 Fortress Vault (emergency fund)', 'data-to="emerg"') + btn('winTo', '🪐 Retirement Ring', 'data-to="retire"') + btn('winTo', '👑 Crown Vault (investing)', 'data-to="invest"') + '<button class="btn block" data-act="closeSheet">Keep it for now</button></div>');
}
ACT.winTo = el => { const w = S.wins.find(x => x.id === el.dataset.id), to = el.dataset.to; if (!w) return; w.to = to; if (to.indexOf('debt:') === 0) { closeSheetQuiet(); payDebt(to.slice(5), num(w.amt), 'Hustle win sent to debt'); } else { closeSheetQuiet(); feedVault(to, num(w.amt)); } save(); render(); };
