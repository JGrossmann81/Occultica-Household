/* Healthica Form Coach: live camera pose tracking that coaches exercise form on the phone. Video never leaves the device.
   The pose model (MediaPipe, 33 body points with 3D estimates) downloads once and is then cached for offline use. General wellness only. */
const POSE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/';
const LM = { nose: 0, ear: [7, 8], sh: [11, 12], el: [13, 14], wr: [15, 16], hip: [23, 24], knee: [25, 26], ank: [27, 28], heel: [29, 30], toe: [31, 32] };
const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32], [27, 29], [28, 30], [7, 11], [8, 12]];
const JOINT_OF = {}; Object.keys(LM).forEach(k => { [].concat(LM[k]).forEach(i => JOINT_OF[i] = k); });
const lvl = (v, ok, warn, hiGood) => hiGood ? (v >= ok ? 0 : v >= warn ? 1 : 2) : (v <= ok ? 0 : v <= warn ? 1 : 2);
/* exercise rules. rep: start 'high' counts dips of the value; start 'low' counts rises. hi/lo are in normalized space (180 - value when start is low). */
const FX = {
  squat_s: { name: 'Squat', ex: 'Back squat', view: 'side', floor: false, key: 'knee', rep: { start: 'high', hi: 160, lo: 120 }, show: ['knee', 'k'], need: ['sh', 'hip', 'knee', 'ank'],
    place: 'Stand sideways to the phone, about 6 to 8 feet away, camera at hip height. Whole body in view.', checks: [
      { id: 'lean', label: 'Chest up', when: 'live', ph: 'work', j: ['sh', 'hip'], f: m => { const l = lvl(m.lean, 48, 62); return l && [l, 'Chest up: sit your hips back']; } },
      { id: 'depth', label: 'Depth', when: 'rep', j: ['knee', 'hip'], f: (m, r) => { const l = lvl(r.vmin, 100, 115); return [l, l === 0 ? 'Great depth' : l === 1 ? 'A little lower for full depth' : 'Go deeper: hips down to knee height']; } }] },
  squat_f: { name: 'Squat, front view', ex: 'Back squat', view: 'front', floor: false, key: 'kneeAvg', rep: { start: 'high', hi: 160, lo: 120 }, show: ['kneeAvg', 'k'], need: ['sh', 'hip', 'knee', 'ank'], both: true,
    place: 'Face the phone, about 6 to 8 feet away, camera at waist height. Whole body in view.', checks: [
      { id: 'valg', label: 'Knees out', when: 'live', ph: 'work', j: ['knee'], f: m => { const l = lvl(m.valgRel, .9, .75, true); return l && [l, 'Knees caving in: push them out over your toes']; } },
      { id: 'hips', label: 'Hips level', when: 'live', ph: 'work', j: ['hip'], f: m => { const l = lvl(m.hipTilt, 5, 8); return l && [l, 'Hips are uneven: shift weight to both feet']; } },
      { id: 'shs', label: 'Shoulders level', when: 'live', ph: 'work', j: ['sh'], f: m => { const l = lvl(m.shTilt, 5, 8); return l && [l, 'Level your shoulders']; } },
      { id: 'depth', label: 'Depth', when: 'rep', j: ['knee'], f: (m, r) => { const l = lvl(r.vmin, 100, 115); return [l, l === 0 ? 'Great depth' : l === 1 ? 'A little lower for full depth' : 'Go deeper: hips down to knee height']; } }] },
  pushup: { name: 'Push-up', ex: 'Push-up', view: 'side', floor: true, key: 'elbow', rep: { start: 'high', hi: 155, lo: 120 }, show: ['elbow', 'el'], need: ['sh', 'hip', 'ank', 'el'],
    place: 'Lay the phone on the floor sideways, about 6 feet away, in landscape. Whole body in view.', checks: [
      { id: 'line', label: 'Body in a line', when: 'live', ph: 'any', j: ['sh', 'hip', 'ank'], f: m => { const l = lvl(m.line, 168, 160, true); return l && [l, m.sag > 0 ? 'Hips sagging: squeeze glutes and abs' : 'Hips too high: lower them into one line']; } },
      { id: 'depth', label: 'Depth', when: 'rep', j: ['el'], f: (m, r) => { const l = lvl(r.vmin, 100, 115); return [l, l === 0 ? 'Great depth' : l === 1 ? 'A little lower' : 'Lower your chest: elbows to about 90 degrees']; } }] },
  plank: { name: 'Plank hold', ex: 'Plank', view: 'side', floor: true, hold: true, show: ['line', 'hip'], need: ['sh', 'hip', 'ank'],
    place: 'Lay the phone on the floor sideways, about 6 feet away, in landscape. Whole body in view.', checks: [
      { id: 'line', label: 'Body in a line', when: 'live', ph: 'any', j: ['sh', 'hip', 'ank'], f: m => { const l = lvl(m.line, 168, 160, true); return [l, l === 0 ? 'Perfect line' : m.sag > 0 ? 'Hips sagging: squeeze glutes and abs' : 'Hips too high: lower them into one line']; } }] },
  lunge: { name: 'Lunge', ex: 'Walking lunges', view: 'side', floor: false, key: 'kneeMin', rep: { start: 'high', hi: 155, lo: 120 }, show: ['kneeMin', 'k'], need: ['sh', 'hip', 'knee', 'ank'],
    place: 'Stand sideways to the phone, about 7 feet away, camera at hip height. Leave room to step.', checks: [
      { id: 'lean', label: 'Stay tall', when: 'live', ph: 'work', j: ['sh', 'hip'], f: m => { const l = lvl(m.lean, 20, 32); return l && [l, 'Stay tall: ribs over hips']; } },
      { id: 'depth', label: 'Depth', when: 'rep', j: ['knee'], f: (m, r) => { const l = lvl(r.vmin, 100, 115); return [l, l === 0 ? 'Good depth' : l === 1 ? 'Sink a little lower' : 'Lower until both knees are near 90 degrees']; } }] },
  hinge: { name: 'Hip hinge or deadlift', ex: 'Romanian deadlift', view: 'side', floor: false, key: 'hipA', rep: { start: 'high', hi: 160, lo: 135 }, show: ['hipA', 'h'], need: ['sh', 'hip', 'knee', 'ank', 'ear'], approx: true,
    place: 'Stand sideways to the phone, about 7 feet away, camera at hip height. Back-straightness is estimated, so treat it as a guide.', checks: [
      { id: 'head', label: 'Neck and chest', when: 'live', ph: 'work', j: ['ear', 'sh'], f: m => { const l = lvl(m.head, 150, 135, true); return l && [l, 'Keep your neck long and chest proud']; } },
      { id: 'knee', label: 'Hinge, not squat', when: 'live', ph: 'work', j: ['knee'], f: m => { const l = lvl(m.knee, 120, 105, true); return l && [l, 'Too much knee bend: push your hips back']; } },
      { id: 'depth', label: 'Hinge depth', when: 'rep', j: ['hip'], f: (m, r) => { const l = r.vmin <= 125 ? 0 : 1; return [l, l ? 'Hinge a bit deeper: reach mid-shin' : 'Good hinge']; } }] },
  curl: { name: 'Biceps curl', ex: 'Barbell curl', view: 'front', floor: false, key: 'elbowAvg', rep: { start: 'high', hi: 150, lo: 90 }, show: ['elbowAvg', 'el'], need: ['sh', 'hip', 'el', 'wr'], both: true,
    place: 'Face the phone, about 6 feet away, camera at chest height. Upper body in view.', checks: [
      { id: 'drift', label: 'Elbows pinned', when: 'live', ph: 'any', j: ['el'], f: m => { const l = lvl(m.drift, 20, 32); return l && [l, 'Pin your elbows to your sides']; } },
      { id: 'swing', label: 'No swinging', when: 'live', ph: 'any', j: ['sh', 'hip'], f: m => { const l = lvl(m.lean, 10, 17); return l && [l, 'Do not swing: keep your torso still']; } },
      { id: 'top', label: 'Full curl', when: 'rep', j: ['el'], f: (m, r) => { const l = lvl(r.vmin, 62, 80); return [l, l ? 'Curl a bit higher and squeeze' : 'Good curl']; } }] },
  press: { name: 'Overhead press', ex: 'Overhead press', view: 'front', floor: false, key: 'elbowAvg', rep: { start: 'low', hi: 75, lo: 25 }, show: ['elbowAvg', 'el'], need: ['sh', 'el', 'wr', 'hip'], both: true,
    place: 'Face the phone, about 6 feet away, camera at chest height. Leave room overhead.', checks: [
      { id: 'even', label: 'Arms even', when: 'live', ph: 'any', j: ['wr'], f: m => { const l = lvl(m.wristDiff, .07, .13); return l && [l, 'Press both arms evenly']; } },
      { id: 'shs', label: 'Shoulders level', when: 'live', ph: 'any', j: ['sh'], f: m => { const l = lvl(m.shTilt, 5, 8); return l && [l, 'Keep your shoulders level']; } },
      { id: 'lock', label: 'Full lockout', when: 'rep', j: ['el'], f: (m, r) => { const l = lvl(r.vmax, 165, 152, true); return [l, l ? 'Press all the way overhead' : 'Strong lockout']; } }] },
  lateral: { name: 'Lateral raise', ex: 'Lateral raise', view: 'front', floor: false, key: 'armAbd', rep: { start: 'low', hi: 145, lo: 110 }, show: ['armAbd', 'sh'], need: ['sh', 'el', 'hip'], both: true,
    place: 'Face the phone, about 6 feet away, camera at chest height. Upper body in view.', checks: [
      { id: 'even', label: 'Arms even', when: 'live', ph: 'any', j: ['wr'], f: m => { const l = lvl(m.wristDiff, .07, .13); return l && [l, 'Raise both arms evenly']; } },
      { id: 'top', label: 'Shoulder height', when: 'rep', j: ['sh', 'el'], f: (m, r) => { const l = r.vmax > 112 ? 2 : r.vmax > 102 ? 1 : r.vmax < 75 ? 1 : 0; return [l, r.vmax > 102 ? 'Stop at shoulder height' : r.vmax < 75 ? 'Lift to shoulder height' : 'Great height']; } }] },
  bridge: { name: 'Glute bridge', ex: 'Hip thrust', view: 'side', floor: true, key: 'hipA', rep: { start: 'low', hi: 60, lo: 25 }, show: ['hipA', 'h'], need: ['sh', 'hip', 'knee', 'ank'],
    place: 'Lie on your side of the phone, about 6 feet away, in landscape, so it sees you from the side.', checks: [
      { id: 'top', label: 'Full hip lift', when: 'rep', j: ['sh', 'hip', 'knee'], f: (m, r) => { const l = lvl(r.vmax, 165, 155, true); return [l, l === 0 ? 'Strong lift' : 'Squeeze glutes: lift until shoulder, hip and knee line up']; } }] },
  posture: { name: 'Posture and level check', ex: '', view: 'front', floor: false, hold: true, show: ['shTilt', 'sh'], need: ['sh', 'hip', 'ank'], both: true,
    place: 'Stand relaxed facing the phone, about 6 feet away. Whole body in view. The phone should stand upright on a level surface.', checks: [
      { id: 'shs', label: 'Shoulders level', when: 'live', ph: 'any', j: ['sh'], f: m => { const l = lvl(m.shTilt, 3, 6); return [l, l === 0 ? 'Shoulders level' : 'Level your shoulders']; } },
      { id: 'hips', label: 'Hips level', when: 'live', ph: 'any', j: ['hip'], f: m => { const l = lvl(m.hipTilt, 3, 6); return [l, l === 0 ? 'Hips level' : 'Level your hips']; } },
      { id: 'head', label: 'Head level', when: 'live', ph: 'any', j: ['ear'], f: m => { const l = lvl(m.earTilt, 4, 7); return [l, l === 0 ? 'Head level' : 'Level your head']; } }] }
};
const FX_ORDER = ['squat_s', 'squat_f', 'pushup', 'plank', 'lunge', 'hinge', 'curl', 'press', 'lateral', 'bridge', 'posture'];
const FIXES = { lean: 'Drive your chest up and sit your hips back. A lighter load can help you stay tall.', depth: 'Use a range that you can control. Slow down, and add a box or bench as a depth target.', valg: 'Press your knees out over your toes. Strengthen glutes with banded work.', hips: 'Shift weight evenly onto both feet. A mirror or one-sided strength gap may be the cause.', shs: 'Relax and level your shoulders. Check that you are not leaning to one side.', line: 'Brace your abs, squeeze your glutes, and keep one straight line from shoulders to ankles.', head: 'Keep your neck long and eyes slightly ahead of you, chest proud.', knee: 'Send your hips back like closing a car door, shins staying nearly vertical.', drift: 'Pin your elbows lightly at your sides and use a lighter weight.', swing: 'Lean slightly against a wall or use a lighter weight to stop the swing.', top: 'Move through the full range and pause briefly at the top.', even: 'Match both arms. Use lighter weights and watch the mirror image.', lock: 'Finish each press fully overhead with biceps by your ears.' };
const FC = { on: false, cfg: null, id: null, cam: false, facing: 'user', voice: true, show3d: true, yaw: .6, sm: null, st: 'top', reps: [], partial: 0, cur: null, hold: 0, holdOk: 0, last: 0, said: 0, lastCue: '', inFrame: false, sigs: '', frames: 0 };
const fcSet = () => { S.formcfg = S.formcfg || { facing: 'user', voice: true, id: 'squat_s' }; return S.formcfg; };
/* ---- measurements ---- */
function fcMetrics(P, Wd, cfg) {
  const vis = i => P[i] && (P[i].v == null ? 1 : P[i].v) > .45, pt = i => Wd && Wd[i] ? [Wd[i].x, Wd[i].y, Wd[i].z] : [P[i].x, P[i].y, 0];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = a => Math.hypot(a[0], a[1], a[2]) || 1e-6;
  const E = a => Array.isArray(a) ? a : pt(a), mid = (i, j) => { const a = pt(i), b = pt(j); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]; };
  const ang = (a, b, c) => { const u = sub(E(a), E(b)), v = sub(E(c), E(b)); return Math.acos(Math.max(-1, Math.min(1, dot(u, v) / (len(u) * len(v))))) * R2D; };
  const vert = (a, b) => { const u = sub(E(b), E(a)); return Math.acos(Math.min(1, Math.abs(u[1]) / len(u))) * R2D; };
  const tilt = (a, b) => Math.atan2(Math.abs(P[a].y - P[b].y), Math.abs(P[a].x - P[b].x) || 1e-6) * R2D;
  const sc = k => [LM.sh[k], LM.hip[k], LM.knee[k], LM.ank[k]].reduce((s, i) => s + (P[i] ? (P[i].v == null ? 1 : P[i].v) : 0), 0), k = sc(0) >= sc(1) ? 0 : 1, I = n => LM[n][k], m = { side: k };
  const F = (n, f) => { try { const v = f(); if (isFinite(v)) m[n] = v; } catch (e) { } };
  F('knee', () => ang(I('hip'), I('knee'), I('ank'))); F('kneeL', () => ang(23, 25, 27)); F('kneeR', () => ang(24, 26, 28)); m.kneeAvg = (m.kneeL + m.kneeR) / 2; m.kneeMin = Math.min(m.kneeL, m.kneeR);
  F('hipA', () => ang(mid(11, 12), mid(23, 24), mid(25, 26))); F('elbow', () => ang(I('sh'), I('el'), I('wr'))); F('elbowL', () => ang(11, 13, 15)); F('elbowR', () => ang(12, 14, 16)); m.elbowAvg = (m.elbowL + m.elbowR) / 2;
  F('lean', () => vert(mid(23, 24), mid(11, 12))); F('line', () => ang(mid(11, 12), mid(23, 24), mid(27, 28)));
  F('head', () => { const e = P[I('ear')], s = P[I('sh')], h = P[I('hip')], u = [e.x - s.x, e.y - s.y], v = [h.x - s.x, h.y - s.y]; return Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]) || 1)))) * R2D; });
  F('sag', () => { const s = P[I('sh')], h = P[I('hip')], a = P[I('ank')], t = (h.x - s.x) / ((a.x - s.x) || 1e-6), yl = s.y + t * (a.y - s.y); return (h.y - yl) / (Math.hypot(a.x - s.x, a.y - s.y) || 1); });
  F('shTilt', () => tilt(11, 12)); F('hipTilt', () => tilt(23, 24)); F('earTilt', () => tilt(7, 8));
  F('valg', () => Math.abs(P[25].x - P[26].x) / (Math.abs(P[27].x - P[28].x) || 1e-6));
  F('wristDiff', () => Math.abs(P[15].y - P[16].y) / (Math.hypot((P[11].x + P[12].x) / 2 - (P[23].x + P[24].x) / 2, (P[11].y + P[12].y) / 2 - (P[23].y + P[24].y) / 2) || 1));
  const tor = sub(mid(11, 12), mid(23, 24)), abd = (s, h, e) => { const a = tor, b = sub(pt(e), pt(s)); return Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (len(a) * len(b))))) * R2D; };
  F('armAbd', () => (180 - abd(11, 23, 13) + 180 - abd(12, 24, 14)) / 2); F('drift', () => Math.max(vert(11, 13), vert(12, 14)));
  return m;
}
/* ---- coaching engine ---- */
function fcReset() { Object.assign(FC, { lastT: null, st: 'top', reps: [], partial: 0, cur: null, hold: 0, holdOk: 0, status: {}, valgBase: null, lastCue: '', sigs: '' }); }
function fcNeeded(P, cfg, m) { const k = m.side, miss = []; cfg.need.forEach(n => { (cfg.both ? [0, 1] : [k]).forEach(s => { const i = LM[n][s]; if (!P[i] || (P[i].v == null ? 1 : P[i].v) < .45) miss.push(n); }); }); return miss.length === 0; }
function fcStep(P, Wd, tNow) {
  const cfg = FC.cfg; if (!cfg) return; const m = fcMetrics(P, Wd, cfg); FC.m = m; FC.inFrame = fcNeeded(P, cfg, m); FC.status = FC.status || {};
  if (!FC.inFrame) { FC.status = {}; return; }
  if (m.valg != null && FC.st === 'top' && (!cfg.rep || m[cfg.key] > cfg.rep.hi)) FC.valgBase = FC.valgBase ? FC.valgBase * .9 + m.valg * .1 : m.valg; if (m.valg != null && FC.valgBase) m.valgRel = m.valg / FC.valgBase;
  const live = (phase) => cfg.checks.filter(c => c.when === 'live' && (c.ph === 'any' || (c.ph === 'work' && phase))).forEach(c => { let r = null; try { r = c.f(m); } catch (e) { } FC.status[c.id] = r ? { l: r[0], cue: r[1] } : { l: 0, cue: '' }; if (r && FC.cur) { const w = FC.cur.worst[c.id]; if (!w || r[0] > w.l) FC.cur.worst[c.id] = { l: r[0], cue: r[1] }; } });
  if (cfg.hold) { live(true); const bad = cfg.checks.some(c => (FC.status[c.id] || {}).l === 2), dt = FC.lastT ? Math.max(0, Math.min(.5, (tNow - FC.lastT) / 1000)) : 0; FC.hold += dt; if (!bad) FC.holdOk += dt; FC.lastT = tNow; return; }
  FC.lastT = tNow; const R = cfg.rep, v0 = m[cfg.key]; if (v0 == null) return; const v = R.start === 'low' ? 180 - v0 : v0;
  if (FC.st === 'top') { cfg.checks.forEach(c => { if (c.when === 'live' && c.ph === 'work') FC.status[c.id] = { l: 0, cue: '' }; }); live(false); if (v < R.hi - 15) { FC.st = 'moving'; FC.cur = { vmin: v0, vmax: v0, reached: false, worst: {}, t0: tNow }; } }
  else { FC.cur.vmin = Math.min(FC.cur.vmin, v0); FC.cur.vmax = Math.max(FC.cur.vmax, v0); live(true); if (v <= R.lo) FC.cur.reached = true;
    if (v >= R.hi - 5) { const r = FC.cur; FC.cur = null; FC.st = 'top'; fcFinishRep(r, m, tNow); } }
}
function fcFinishRep(r, m, tNow) {
  const cfg = FC.cfg, R = cfg.rep; if (tNow - r.t0 < 500) return; const issues = [], res = {};
  if (!r.reached) { FC.partial++; fcSay('Go a little further', 2); fcRender(); return; }
  cfg.checks.filter(c => c.when === 'rep').forEach(c => { try { const x = c.f(m, r); if (x) r.worst[c.id] = { l: x[0], cue: x[1] }; } catch (e) { } });
  let sc = 100; Object.keys(r.worst).forEach(id => { const w = r.worst[id]; if (w.l === 2) { sc -= 25; issues.push({ id, cue: w.cue }); } else if (w.l === 1) { sc -= 10; issues.push({ id, cue: w.cue }); } }); sc = Math.max(0, sc);
  FC.reps.push({ n: FC.reps.length + 1, score: sc, issues, worstL: Object.keys(r.worst).reduce((o, k) => (o[k] = r.worst[k].l, o), {}), secs: Math.round((tNow - r.t0) / 100) / 10 });
  const top = issues.sort((a, b) => (r.worst[b.id].l) - (r.worst[a.id].l))[0]; FC.lastRep = { n: FC.reps.length, score: sc, cue: top ? top.cue : 'Good rep' };
  fcSay((FC.reps.length) + '. ' + (top ? top.cue : 'Good rep'), top ? 2 : 1);
}
function fcSay(txt, urgency) {
  const now = Date.now(); if (now - FC.said < 2200 && urgency < 3) return; FC.said = now;
  try { if (urgency >= 2 && navigator.vibrate) navigator.vibrate(urgency === 3 ? [80, 40, 80] : 60); } catch (e) { }
  if (!FC.voice || !window.speechSynthesis) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.rate = 1.05; speechSynthesis.speak(u); } catch (e) { }
}
/* ---- drawing ---- */
const COL = { ok: '#5be3a1', warn: '#f2c14e', bad: '#ff5d6c', idle: '#c9b8ff' };
function fcWorst() { const w = {}; (FC.cfg.checks || []).forEach(c => { const s = (FC.status || {})[c.id]; if (s && s.l > 0) (c.j || []).forEach(n => { w[n] = Math.max(w[n] || 0, s.l); }); }); return w; }
function fcDraw(ctx, P, W, H, mirror) {
  const cfg = FC.cfg, worst = fcWorst(), col = i => { const j = JOINT_OF[i], l = worst[j] || 0; return FC.inFrame ? (l === 2 ? COL.bad : l === 1 ? COL.warn : COL.ok) : COL.idle; };
  const X = x => mirror ? W - x : x; ctx.lineWidth = Math.max(3, W / 160); ctx.lineCap = 'round';
  BONES.forEach(([a, b]) => { if (!P[a] || !P[b] || (P[a].v < .3) || (P[b].v < .3)) return; const wa = worst[JOINT_OF[a]] || 0, wb = worst[JOINT_OF[b]] || 0, l = Math.max(wa, wb); ctx.strokeStyle = FC.inFrame ? (l === 2 ? COL.bad : l === 1 ? COL.warn : COL.ok) : COL.idle; ctx.globalAlpha = Math.min(P[a].v, P[b].v) > .5 ? .95 : .45; ctx.beginPath(); ctx.moveTo(X(P[a].x), P[a].y); ctx.lineTo(X(P[b].x), P[b].y); ctx.stroke(); });
  ctx.globalAlpha = 1; [0, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 31, 32].forEach(i => { if (!P[i] || P[i].v < .3) return; ctx.fillStyle = col(i); ctx.beginPath(); ctx.arc(X(P[i].x), P[i].y, Math.max(4, W / 100), 0, 7); ctx.fill(); });
  /* plumb line and level guides */
  if (P[23] && P[24] && P[27] && P[28]) { const mx = (P[27].x + P[28].x) / 2; ctx.strokeStyle = 'rgba(201,184,255,.35)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(mx), H * .05); ctx.lineTo(X(mx), H * .98); ctx.stroke(); ctx.setLineDash([]); }
  /* angle label */
  const m = FC.m, sh = cfg.show; if (m && sh && m[sh[0]] != null && FC.inFrame) { const k = m.side, nm = { k: 'knee', el: 'el', h: 'hip', sh: 'sh' }[sh[1]] || sh[1], idx = LM[nm] ? (cfg.both ? LM[nm][0] : LM[nm][k]) : 25, p = P[idx]; if (p) { const txt = Math.round(m[sh[0]]) + '°'; ctx.font = `bold ${Math.round(W / 16)}px system-ui,sans-serif`; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4; const tx = X(p.x) + 14, ty = p.y - 10; ctx.strokeText(txt, tx, ty); ctx.fillText(txt, tx, ty); } }
}
function fc3d(W) {
  const c = $('#fc3'); if (!c) return; c.style.display = FC.show3d && W ? 'block' : 'none'; if (!FC.show3d || !W) return; const g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,7,25,.78)'; g.fillRect(0, 0, w, h);
  const cy = Math.cos(FC.yaw), sy = Math.sin(FC.yaw), pit = .35, S = h * .36, cx = w / 2, cyy = h * .5; const pr = (x, y, z) => { const X = x * cy + z * sy, Z = -x * sy + z * cy; return [cx + X * S, cyy + (y * Math.cos(pit) - Z * Math.sin(pit)) * S]; };
  g.strokeStyle = 'rgba(201,184,255,.28)'; g.lineWidth = 1; const fy = Math.max.apply(null, [27, 28, 31, 32].map(i => W[i] ? W[i].y : 0.9)); for (let i = -2; i <= 2; i++) { let a = pr(i * .4, fy, -.8), b = pr(i * .4, fy, .8); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); a = pr(-.8, fy, i * .4); b = pr(.8, fy, i * .4); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  const worst = fcWorst(); g.lineWidth = 2.5; BONES.forEach(([a, b]) => { if (!W[a] || !W[b]) return; const l = Math.max(worst[JOINT_OF[a]] || 0, worst[JOINT_OF[b]] || 0), p = pr(W[a].x, W[a].y, W[a].z), q = pr(W[b].x, W[b].y, W[b].z); g.strokeStyle = FC.inFrame ? (l === 2 ? COL.bad : l === 1 ? COL.warn : COL.ok) : COL.idle; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); });
  const hp = pr(0, fy, 0), top = pr(0, fy - 1.7, 0); g.strokeStyle = 'rgba(255,255,255,.25)'; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(hp[0], hp[1]); g.lineTo(top[0], top[1]); g.stroke(); g.setLineDash([]);
}
/* ---- UI ---- */
function fcRender() {
  const cfg = FC.cfg; if (!cfg || !$('#fc')) return; const st = FC.status || {}, active = cfg.checks.filter(c => c.when === 'live' || true);
  let cue = '', cl = 'ok';
  if (!FC.inFrame) { cue = FC.cam || FC.demo ? 'Step back so your whole body is in view' : ''; cl = 'idle'; }
  else { let worst = null; cfg.checks.forEach(c => { const s = st[c.id]; if (s && s.l > 0 && s.cue && (!worst || s.l > worst.l)) worst = s; }); if (worst) { cue = worst.cue; cl = worst.l === 2 ? 'bad' : 'warn'; } else if (cfg.hold) { cue = 'Good form: keep holding'; } else cue = FC.lastRep ? (FC.lastRep.cue) : 'Looking good. Start when you are ready.'; }
  if (FC.inFrame && cl !== 'ok' && cue && (cue !== FC.lastCue || Date.now() - FC.said > 9000)) { FC.lastCue = cue; fcSay(cue, cl === 'bad' ? 2 : 1); } if (cl === 'ok' || !FC.inFrame) FC.lastCue = '';
  $('#fcCue').textContent = cue; $('#fcCue').className = 'fc-cue ' + cl;
  const lastIss = FC.reps.length ? FC.reps[FC.reps.length - 1].issues : null, state = c => !FC.inFrame ? -1 : c.when === 'rep' ? (lastIss ? (lastIss.some(x => x.id === c.id) ? ((FC.reps[FC.reps.length - 1].worstL || {})[c.id] || 1) : 0) : -1) : ((st[c.id] || {}).l || 0);
  const sig = cfg.checks.map(c => c.id + state(c)).join() + FC.reps.length; if (sig !== FC.sigs) { FC.sigs = sig; $('#fcChecks').innerHTML = cfg.checks.map(c => { const l = state(c); return `<span class="fc-chip ${l === -1 ? 'idle' : l === 0 ? 'ok' : l === 1 ? 'warn' : 'bad'}">${esc(c.label)}</span>`; }).join(''); }
  if (cfg.hold) { const s = Math.floor(FC.hold); $('#fcN').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); $('#fcNL').textContent = 'time'; $('#fcScore').textContent = FC.hold > 1 ? Math.round(FC.holdOk / FC.hold * 100) + '% in good form' : ''; }
  else { $('#fcN').textContent = FC.reps.length; $('#fcNL').textContent = 'reps' + (FC.partial ? ' · ' + FC.partial + ' partial' : ''); const avg = FC.reps.length ? Math.round(FC.reps.reduce((s, r) => s + r.score, 0) / FC.reps.length) : null; $('#fcScore').textContent = avg == null ? '' : 'Form ' + avg + '%' + (FC.lastRep ? ' · last ' + FC.lastRep.score : ''); }
}
function fcFeed(res, W, H) {
  const mirror = FC.facing === 'user' && FC.cam, c = $('#fcv'); if (!c) return; if (c.width !== W) { c.width = W; c.height = H; } const ctx = c.getContext('2d');
  if (!res || !res.poseLandmarks) { FC.inFrame = false; if (FC.cam) { ctx.save(); if (mirror) { ctx.translate(W, 0); ctx.scale(-1, 1); } ctx.drawImage($('#fcvid'), 0, 0, W, H); ctx.restore(); } fcRender(); fc3d(null); return; }
  const a = FC.sm ? .55 : 1, P = res.poseLandmarks.map((p, i) => { const o = FC.sm && FC.sm.P[i]; return { x: (o ? o.x + (p.x * W - o.x) * a : p.x * W), y: (o ? o.y + (p.y * H - o.y) * a : p.y * H), v: p.visibility == null ? 1 : p.visibility }; });
  const Wd = res.poseWorldLandmarks ? res.poseWorldLandmarks.map((p, i) => { const o = FC.sm && FC.sm.W && FC.sm.W[i]; return { x: o ? o.x + (p.x - o.x) * a : p.x, y: o ? o.y + (p.y - o.y) * a : p.y, z: o ? o.z + (p.z - o.z) * a : p.z }; }) : null; FC.sm = { P, W: Wd };
  fcStep(P, Wd, performance.now());
  ctx.save(); if (mirror) { ctx.translate(W, 0); ctx.scale(-1, 1); } if (FC.cam) ctx.drawImage($('#fcvid'), 0, 0, W, H); else { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#171033'); g.addColorStop(1, '#0b0820'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); } ctx.restore();
  if (FC.cam) { ctx.fillStyle = 'rgba(8,5,20,.25)'; ctx.fillRect(0, 0, W, H); }
  fcDraw(ctx, P, W, H, mirror); if (FC.demo) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = `${Math.round(W / 28)}px system-ui,sans-serif`; ctx.fillText('DEMO: simulated figure, not you', 12, H - 14); }
  fc3d(Wd); FC.yaw += .004; fcRender();
}
let fcPose = null;
function fcLoadLib() { return new Promise((res, rej) => { if (window.Pose) return res(); const s = document.createElement('script'); s.src = POSE_CDN + 'pose.js'; s.crossOrigin = 'anonymous'; const t = setTimeout(() => rej(new Error('timeout')), 60000); s.onload = () => { clearTimeout(t); window.Pose ? res() : rej(new Error('lib')); }; s.onerror = () => { clearTimeout(t); rej(new Error('net')); }; document.head.appendChild(s); }); }
function fcMsg(t) { const el = $('#fcMsg'); if (!el) return; el.textContent = t || ''; el.style.display = t ? 'flex' : 'none'; }
function fcShow(id) { FC.id = id; FC.cfg = FX[id]; fcReset(); FC.m = null; FC.sm = null; FC.inFrame = false; const o = $('#fc'); if (!o) { const d = document.createElement('div'); d.id = 'fc'; document.body.appendChild(d); }
  $('#fc').innerHTML = `<div class="fc-top"><button class="fc-b" data-act="fcClose">Close</button><b>${esc(FC.cfg.name)}</b><span><button class="fc-b" data-act="fcFlip" id="fcFlip">Flip camera</button><button class="fc-b" data-act="fcVoice" id="fcVoiceB">Voice ${FC.voice ? 'on' : 'off'}</button><button class="fc-b" data-act="fc3d">3D</button></span></div>
  <div class="fc-stage"><video id="fcvid" playsinline muted autoplay></video><canvas id="fcv" width="360" height="640"></canvas><canvas id="fc3" width="150" height="170"></canvas><div class="fc-hud"><b id="fcN">0</b><span id="fcNL">reps</span><div id="fcScore"></div></div><div id="fcMsg" class="fc-msg"></div></div>
  <div class="fc-bot"><div id="fcCue" class="fc-cue idle"></div><div id="fcChecks" class="fc-checks"></div><div class="row"><button class="btn gold" data-act="fcDone">Finish</button><button class="btn" data-act="fcResetB">Reset</button></div></div>`; $('#fc').style.display = 'flex'; document.body.classList.add('noscroll'); }
async function fcStartCam() {
  fcShow(fcSet().id); FC.demo = false; FC.on = true; fcMsg('Starting camera...');
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('nocam');
    FC.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: FC.facing }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    const v = $('#fcvid'); v.srcObject = FC.stream; await v.play(); FC.cam = true;
  } catch (e) { FC.on = false; fcMsg(''); fcStop(); const n = e && e.name; return openSheet('Camera', `<p>${n === 'NotAllowedError' ? 'Camera access was blocked. Allow the camera for Healthica in your phone or browser settings, then try again.' : n === 'NotFoundError' ? 'No camera was found on this device.' : 'The camera could not start. Make sure no other app is using it.'}</p><p class="sm dim">You can still try the demo with a simulated figure.</p><button class="btn gold block" data-act="fcDemo">Try the demo</button><button class="btn block" data-act="formOpen">Back</button>`); }
  fcMsg('Loading the coach. The first time takes a minute (about 20 MB), then it works offline.');
  try { await fcLoadLib(); if (!fcPose) { fcPose = new window.Pose({ locateFile: f => POSE_CDN + f }); fcPose.setOptions({ modelComplexity: 1, smoothLandmarks: true, enableSegmentation: false, minDetectionConfidence: .5, minTrackingConfidence: .5 }); fcPose.onResults(r => { FC.res = r; }); await fcPose.initialize(); } }
  catch (e) { fcStop(); return openSheet('Coach not ready', '<p>Healthica could not load its pose model. Connect to Wi-Fi once so it can download (about 20 MB), then try again. After that it works offline.</p><button class="btn gold block" data-act="fcDemo">Try the demo</button><button class="btn block" data-act="formOpen">Back</button>'); }
  fcMsg(''); fcSay('Ready. Get in position.', 1); fcLoop();
}
async function fcLoop() {
  if (!FC.on) return; const v = $('#fcvid');
  if (v && v.readyState >= 2 && !FC.busy) { FC.busy = true; try { FC.res = null; await fcPose.send({ image: v }); fcFeed(FC.res, v.videoWidth, v.videoHeight); } catch (e) { } FC.busy = false; }
  FC.raf = requestAnimationFrame(fcLoop);
}
function fcStartDemo() {
  fcShow(fcSet().id); FC.demo = true; FC.cam = false; FC.on = true; FC.t0 = performance.now(); fcMsg('');
  const tick = () => { if (!FC.on) return; const t = (performance.now() - FC.t0) / 1000, d = demoFrame(FC.id, t, FC.cfg.floor ? 640 : 360, FC.cfg.floor ? 360 : 640); fcFeed(d, FC.cfg.floor ? 640 : 360, FC.cfg.floor ? 360 : 640); FC.raf = requestAnimationFrame(tick); }; tick();
}
function fcStop() { FC.on = false; cancelAnimationFrame(FC.raf); try { speechSynthesis.cancel(); } catch (e) { } if (FC.stream) { FC.stream.getTracks().forEach(t => t.stop()); FC.stream = null; } FC.cam = false; const o = $('#fc'); if (o) o.style.display = 'none'; document.body.classList.remove('noscroll'); }
/* setup and summary */
function openForm() {
  const c = fcSet(), cfg = FX[c.id], rk = (typeof exRisk === 'function' && cfg.ex) ? exRisk({ name: cfg.ex }) : [], hist = (S.formSessions || []).slice(-4).reverse();
  openSheet('Form coach', `<p class="dim sm">Prop your phone up and Healthica watches your body live, checks your angles and whether you are level, counts reps, and tells you when your form is off. The video is processed on your phone only. It is never saved or uploaded.</p>
  <div class="ct"><span>Exercise</span></div><div class="chips c">${FX_ORDER.map(k => `<button class="chip ${c.id === k ? 'on' : ''}" data-act="fcPick" data-v="${k}">${esc(FX[k].name)}</button>`).join('')}</div>
  <div class="card"><b>Set up</b><div class="sm dim">${esc(cfg.place)}</div><div class="sm dim">Bright, even light and fitted clothes help the tracking. Prop the phone upright on a level surface.</div>${cfg.approx ? '<div class="sm" style="color:var(--gold)">Back position is estimated from the camera, so treat this one as a guide.</div>' : ''}
  ${rk.length ? `<div class="sm" style="color:var(--gold)">Care: this move can stress your ${esc(rk.map(r => r.area.toLowerCase()).join(', '))}. Go lighter or choose another.</div>` : ''}</div>
  <div class="ct"><span>Camera</span></div><div class="seg"><button class="${c.facing === 'user' ? 'on' : ''}" data-act="fcFace" data-v="user">Front (selfie)</button><button class="${c.facing === 'environment' ? 'on' : ''}" data-act="fcFace" data-v="environment">Back camera</button></div>
  <label class="entry" style="align-items:center"><span><input type="checkbox" id="fcvoice" ${c.voice ? 'checked' : ''}> Spoken coaching and vibration</span></label>
  <button class="btn gold block" data-act="fcStart">Start camera</button><button class="btn block" data-act="fcDemo">Try the demo (simulated figure)</button>
  <p class="sm dim">The first start downloads the pose model once (about 20 MB, best on Wi-Fi). After that it works offline. This is coaching for general wellness, not medical advice, and it can be wrong. Stop if anything hurts, and keep clear space around you.</p>
  ${hist.length ? `<div class="ct"><span>Recent sessions</span></div>${hist.map(h => `<div class="sm dim">${esc(h.date)} · ${esc(h.name)} · ${h.hold ? h.hold + ' s hold' : h.reps + ' reps'} · form ${h.score}%</div>`).join('')}` : ''}`);
}
function fcSummary() {
  const cfg = FC.cfg, reps = FC.reps, n = reps.length, avg = n ? Math.round(reps.reduce((s, r) => s + r.score, 0) / n) : (cfg.hold && FC.hold > 1 ? Math.round(FC.holdOk / FC.hold * 100) : 0), cnt = {};
  reps.forEach(r => r.issues.forEach(i => { cnt[i.id] = (cnt[i.id] || 0) + 1; })); const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).slice(0, 3);
  FC.summary = { date: dkey(), name: cfg.name, reps: n, hold: cfg.hold ? Math.round(FC.hold) : 0, score: avg };
  if (!n && !(cfg.hold && FC.hold > 3)) { fcStop(); render(); return openForm(); }
  const lab = id => (cfg.checks.find(c => c.id === id) || { label: id }).label;
  openSheet('Session summary', `<h2 class="big">${cfg.hold ? Math.round(FC.hold) + ' s' : n + ' reps'}</h2><div>Average form: <b>${avg}%</b>${FC.partial ? ` · ${FC.partial} partial rep${FC.partial > 1 ? 's' : ''}` : ''}</div>
  ${top.length ? `<div class="ct"><span>Work on</span></div>${top.map(id => `<div class="entry"><div><b>${esc(lab(id))}</b> <span class="dim sm">flagged on ${cnt[id]} of ${n} reps</span><div class="sm dim">${esc(FIXES[id] || '')}</div></div></div>`).join('')}` : '<div class="sm">No form issues flagged. Nicely done.</div>'}
  <div class="grid2"><button class="btn gold" data-act="fcSave">Save session</button><button class="btn" data-act="formOpen">Another set</button></div><p class="sm dim">Form scores are estimates from a phone camera. They guide, they do not replace a coach or clinician.</p>`);
  fcStop();
}
Object.assign(ACT, {
  formOpen() { fcStop(); openForm(); }, fcPick(el) { fcSet().id = el.dataset.v; save(); kitKeep(openForm); }, fcFace(el) { fcSet().facing = el.dataset.v; FC.facing = el.dataset.v; save(); kitKeep(openForm); },
  fcStart() { const c = fcSet(); c.voice = !!($('#fcvoice') && $('#fcvoice').checked); FC.voice = c.voice; FC.facing = c.facing; save(); closeSheetQuiet(); fcStartCam(); },
  fcDemo() { const c = fcSet(); FC.voice = $('#fcvoice') ? $('#fcvoice').checked : c.voice; closeSheetQuiet(); fcStartDemo(); },
  fcClose() { fcStop(); openForm(); }, fcDone() { fcSummary(); }, fcResetB() { fcReset(); fcRender(); },
  fcVoice() { FC.voice = !FC.voice; fcSet().voice = FC.voice; $('#fcVoiceB').textContent = 'Voice ' + (FC.voice ? 'on' : 'off'); if (!FC.voice) try { speechSynthesis.cancel(); } catch (e) { } },
  fc3d() { FC.show3d = !FC.show3d; fc3d(FC.sm && FC.sm.W); }, fcFlip() { if (!FC.cam) return toast('Flip works with the live camera.'); FC.facing = FC.facing === 'user' ? 'environment' : 'user'; fcSet().facing = FC.facing; save(); fcStop(); fcStartCam(); },
  fcSave() { S.formSessions = S.formSessions || []; if (FC.summary) S.formSessions.push(FC.summary); save(); toast('Session saved.'); closeSheet(); }
});
