/* Healthica Form Coach: simulated figure. Builds a 33-point body (the same layout the camera model returns) so the coach can be
   previewed without a camera and tested. Body frame: x = subject's left, y = up, z = forward. Angles in degrees. */
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const Lseg = { shin: .43, thigh: .44, torso: .50, upper: .30, fore: .27, neck: .22 };
const v3 = (x, y, z) => [x, y, z], vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vmul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
function ik2(H, A, L1, L2, fwd) { // knee position in the (y,z) plane, bending toward +z when fwd
  const dz = A[2] - H[2], dy = A[1] - H[1]; let d = Math.hypot(dz, dy); d = Math.min(d, L1 + L2 - 1e-3);
  const a = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)))), base = Math.atan2(dy, dz), c = [base + a, base - a].map(t => [H[0], H[1] + L1 * Math.sin(t), H[2] + L1 * Math.cos(t)]);
  return (c[0][2] > c[1][2]) === !!fwd ? c[0] : c[1];
}
function standJ(p) {
  const k = p.k == null ? 175 : p.k, kL = p.kL == null ? k : p.kL, J = {}, S = { L: 1, R: -1 };
  const lean = p.lean == null ? 3 : p.lean, hd = p.hd == null ? 5 : p.hd, za = p.za == null ? 0 : p.za;
  const leg = (kk) => { const phi = .3 * (180 - kk), th = phi - (180 - kk); const knee = [0, Lseg.shin * Math.cos(phi * D2R), za + Lseg.shin * Math.sin(phi * D2R)]; return { knee, hip: [0, knee[1] + Lseg.thigh * Math.cos(th * D2R), knee[2] + Lseg.thigh * Math.sin(th * D2R)] }; };
  const fl = leg(kL), hipY = fl.hip[1], hipZ = fl.hip[2], tilt = (p.hpt || 0) * D2R, sT = (p.sht || 0) * D2R;
  ['L', 'R'].forEach(s => {
    const sx = S[s], rear = p.lunge && s === 'R', vg = p.valg || 0;
    const hip = [sx * .09, hipY + sx * Math.sin(tilt) * .09, hipZ], ank = [sx * .11, 0, rear ? za - .8 : za];
    const kn = rear ? ik2([0, hip[1], hip[2]], [0, ank[1] + .05, ank[2]], Lseg.thigh, Lseg.shin, true) : [0, fl.knee[1], fl.knee[2]];
    J['hip' + s] = hip; J['knee' + s] = [sx * (.10 - vg), kn[1], kn[2]]; J['ank' + s] = ank; J['heel' + s] = [ank[0], .02, ank[2] - .07]; J['toe' + s] = [ank[0], .0, ank[2] + .17];
    const sh = [sx * .19, hipY + Lseg.torso * Math.cos(lean * D2R) + sx * Math.sin(sT) * .19, hipZ + Lseg.torso * Math.sin(lean * D2R)];
    J['sh' + s] = sh;
    const a = p.a == null ? 5 : p.a, aa = (s === 'R' && p.aR != null) ? p.aR : a, e = (s === 'R' && p.eR != null) ? p.eR : (p.e == null ? 172 : p.e), b = p.b || 0, al = aa * D2R, be = b * D2R;
    const u = [sx * Math.sin(al), -Math.cos(al) * Math.cos(be), Math.cos(al) * Math.sin(be)], w = p.w === 'up' ? [0, 1, 0] : [0, 0, 1], ce = Math.cos(e * D2R), se = Math.sin(e * D2R);
    const f = [-u[0] * ce + w[0] * se, -u[1] * ce + w[1] * se, -u[2] * ce + w[2] * se], el = vadd(sh, vmul(u, Lseg.upper));
    J['el' + s] = el; J['wr' + s] = vadd(el, vmul(f, Lseg.fore));
    const hz = (lean + hd) * D2R, head = [sx * .08, sh[1] + Lseg.neck * Math.cos(hz) * .95, sh[2] + Lseg.neck * Math.sin(hz)]; J['ear' + s] = [sx * .08, head[1], head[2]];
  });
  J.nose = [0, J.earL[1] - .02, J.earL[2] + .09]; return J;
}
function proneJ(p) { // push-up and plank, body along the floor, head toward +z
  const e = p.e == null ? 172 : p.e, sag = p.sag || 0, J = {}, zw = .1, aUp = -(180 - e) * D2R;
  const el = [0, Lseg.fore, zw], sh0 = [0, el[1] + Lseg.upper * Math.cos(aUp), el[2] + Lseg.upper * Math.sin(aUp)], Lb = Lseg.torso + Lseg.thigh + Lseg.shin;
  const dy = sh0[1] - .06, dz = Math.sqrt(Math.max(.01, Lb * Lb - dy * dy)), ank = [0, .06, sh0[2] - dz], u = [0, (ank[1] - sh0[1]) / Lb, (ank[2] - sh0[2]) / Lb], n = [0, u[2], -u[1]];
  const at = t => { const q = [0, sh0[1] + u[1] * t * Lb, sh0[2] + u[2] * t * Lb], o = Math.sin(Math.PI * t) * sag; return [0, q[1] - o, q[2]]; };
  const hip = at(Lseg.torso / Lb), kn = at((Lseg.torso + Lseg.thigh) / Lb);
  [['L', 1], ['R', -1]].forEach(([s, sx]) => { const x = sx * .0; J['sh' + s] = [sx * .19, sh0[1], sh0[2]]; J['el' + s] = [sx * .19, el[1], el[2]]; J['wr' + s] = [sx * .19, 0, zw]; J['hip' + s] = [sx * .09, hip[1], hip[2]]; J['knee' + s] = [sx * .10, kn[1], kn[2]]; J['ank' + s] = [sx * .11, ank[1], ank[2]]; J['heel' + s] = [sx * .11, ank[1], ank[2] - .06]; J['toe' + s] = [sx * .11, 0, ank[2] + .02]; J['ear' + s] = [sx * .08, sh0[1] + .06, sh0[2] + .2]; });
  J.nose = [0, sh0[1] + .03, sh0[2] + .3]; return J;
}
function bridgeJ(p) { // glute bridge, lying on the back, head toward -z
  const h = p.h == null ? 120 : p.h, J = {}, rho = 4 + (h - 115) * .55, r = rho * D2R, sh = [0, .08, 0];
  const hip = [0, sh[1] + Lseg.torso * Math.sin(r), Lseg.torso * Math.cos(r)], dk = (rho + (180 - h)) * D2R, kn = [0, hip[1] + Lseg.thigh * Math.sin(dk), hip[2] + Lseg.thigh * Math.cos(dk)];
  const sn = Math.max(-1, Math.min(1, (kn[1] - .05) / Lseg.shin)), g = Math.asin(sn), ank = [0, kn[1] - Lseg.shin * Math.sin(g), kn[2] - Lseg.shin * Math.cos(g)];
  [['L', 1], ['R', -1]].forEach(([s, sx]) => { J['sh' + s] = [sx * .19, sh[1], sh[2]]; J['el' + s] = [sx * .22, .06, .3]; J['wr' + s] = [sx * .24, .05, .55]; J['hip' + s] = [sx * .09, hip[1], hip[2]]; J['knee' + s] = [sx * .10, kn[1], kn[2]]; J['ank' + s] = [sx * .11, ank[1], ank[2]]; J['heel' + s] = [sx * .11, .02, ank[2] - .05]; J['toe' + s] = [sx * .11, .0, ank[2] + .15]; J['ear' + s] = [sx * .08, .1, -.2]; });
  J.nose = [0, .1, -.3]; return J;
}
const DEMO_PERIOD = { squat_s: 3.6, squat_f: 3.6, pushup: 3.2, plank: 12, lunge: 4, hinge: 4, curl: 3.2, press: 3.6, lateral: 3.6, bridge: 3.6, posture: 8 };
function demoParams(id, t) {
  const per = DEMO_PERIOD[id] || 3.6, rep = Math.floor(t / per), ph = (1 - Math.cos(2 * Math.PI * ((t % per) / per))) / 2, bad = rep % 3 === 2;
  switch (id) {
    case 'squat_s': return { kind: 'stand', view: 'side', p: { k: 172 - ph * (172 - (bad ? 118 : 84)), lean: 18 + ph * (bad ? 50 : 22) } };
    case 'squat_f': return { kind: 'stand', view: 'front', p: { k: 172 - ph * 88, valg: bad ? ph * .07 : 0, hpt: bad ? ph * 9 : 0, lean: 3 } };
    case 'pushup': return { kind: 'prone', view: 'side', p: { e: 172 - ph * (bad ? 58 : 92), sag: bad ? ph * .13 : 0 } };
    case 'plank': return { kind: 'prone', view: 'side', p: { e: 172, sag: t > 6 ? Math.min(.14, (t - 6) * .03) : 0 } };
    case 'lunge': return { kind: 'stand', view: 'side', p: { k: 172 - ph * 84, lean: bad ? 8 + ph * 24 : 6, lunge: 1, za: .4 } };
    case 'hinge': return { kind: 'stand', view: 'side', p: { k: 168 - ph * 28, lean: 5 + ph * 72, hd: bad ? 5 + ph * 38 : 6 } };
    case 'curl': return { kind: 'stand', view: 'front', p: { e: 172 - ph * 130, a: bad ? 6 + ph * 28 : 6, lean: bad ? 3 + ph * 14 : 3 } };
    case 'press': return { kind: 'stand', view: 'front', p: { a: 80 + ph * 90, e: 80 + ph * 95, aR: 80 + (bad ? ph * .7 : ph) * 90, eR: 80 + (bad ? ph * .7 : ph) * 95, w: 'up', sht: bad ? 6 : 0 } };
    case 'lateral': return { kind: 'stand', view: 'front', p: { a: 10 + ph * (bad ? 108 : 80), e: 165 } };
    case 'bridge': return { kind: 'bridge', view: 'side', p: { h: 112 + ph * ((bad ? 150 : 170) - 112) } };
    default: return { kind: 'stand', view: 'front', p: { sht: 7 * Math.sin(t / 2), hpt: 4 * Math.sin(t / 3), lean: 2 } };
  }
}
function demoFrame(id, t, W, H) {
  const d = demoParams(id, t), J = d.kind === 'prone' ? proneJ(d.p) : d.kind === 'bridge' ? bridgeJ(d.p) : standJ(d.p), side = d.view === 'side', floor = d.kind !== 'stand';
  const ppm = floor ? .78 * W / 1.9 : .8 * H / 1.8, cz = floor ? (d.kind === 'bridge' ? .15 : -.35) : 0, fy = floor ? .8 : .93;
  const proj = P => { const X = side ? P[2] - cz : P[0], depth = side ? P[0] : P[2]; return { x: .5 + (side ? X : -X) * ppm / W, y: fy - P[1] * ppm / H, z: depth * .5, wx: side ? P[2] : -P[0], wy: -P[1], wz: depth }; };
  const map = { 0: 'nose', 7: 'earL', 8: 'earR', 11: 'shL', 12: 'shR', 13: 'elL', 14: 'elR', 15: 'wrL', 16: 'wrR', 23: 'hipL', 24: 'hipR', 25: 'kneeL', 26: 'kneeR', 27: 'ankL', 28: 'ankR', 29: 'heelL', 30: 'heelR', 31: 'toeL', 32: 'toeR' };
  const near = side ? (J.shL[0] >= 0 ? 'L' : 'R') : null, L = [], Wd = [], hc = proj([0, (J.hipL[1] + J.hipR[1]) / 2, (J.hipL[2] + J.hipR[2]) / 2]);
  for (let i = 0; i < 33; i++) {
    let k = map[i]; if (!k) k = i < 11 ? 'nose' : i < 17 ? 'wrL' : i < 23 ? 'wrR' : 'nose'; if (i >= 17 && i <= 22) k = (i % 2 ? 'wrL' : 'wrR');
    const q = proj(J[k]), far = side && /R$/.test(k) && i !== 0; L.push({ x: q.x, y: q.y, z: q.z, visibility: far ? .45 : .97 }); Wd.push({ x: q.wx - hc.wx, y: q.wy - hc.wy, z: q.wz - hc.wz, visibility: far ? .45 : .97 });
  }
  return { poseLandmarks: L, poseWorldLandmarks: Wd, view: d.view, floor };
}
