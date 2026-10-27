/* Occultica synths for the web: shared DSP building blocks (a port of the plugins' synthcore.h and dsp.h). */
'use strict';
const PI2 = 2 * Math.PI, kPif = Math.PI;
const midiHz = (note, refA = 440) => refA * Math.pow(2, (note - 69) / 12);
const clampf = (x, lo, hi) => x < lo ? lo : (x > hi ? hi : x);
const fastTanh = x => { if (x > 3) return 1; if (x < -3) return -1; const x2 = x * x; return x * (27 + x2) / (27 + 9 * x2); };
class Noise { constructor(s) { this.s = (s || 0x9E3779B9) >>> 0; } white() { let s = this.s; s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; this.s = s; return (s | 0) / 2147483648; } }
class Adsr {
  constructor() { this.st = 0; this.v = 0; this.sus = 0.7; this.aInc = 0.01; this.dC = 0.99; this.rC = 0.99; this.sr = 48000; } // st: 0 idle, 1 att, 2 dec, 3 sus, 4 rel
  setSr(s) { this.sr = s; }
  set(a, d, s, r) { this.sus = clampf(s, 0, 1); this.aInc = 1 / Math.max(1, a * this.sr); this.dC = Math.exp(-6.9 / Math.max(1, d * this.sr)); this.rC = Math.exp(-6.9 / Math.max(1, r * this.sr)); }
  gateOn(retrig = true) { this.st = 1; if (retrig) this.v = 0; }
  gateOff() { if (this.st !== 0) this.st = 4; }
  kill() { this.st = 0; this.v = 0; }
  next() {
    switch (this.st) {
      case 0: return 0;
      case 1: this.v += this.aInc; if (this.v >= 1) { this.v = 1; this.st = 2; } break;
      case 2: this.v = this.sus + (this.v - this.sus) * this.dC; if (Math.abs(this.v - this.sus) < 1e-5) { this.v = this.sus; this.st = 3; } break;
      case 3: this.v = this.sus; break;
      case 4: this.v *= this.rC; if (this.v < 1e-5) { this.v = 0; this.st = 0; } break;
    }
    return this.v;
  }
  active() { return this.st !== 0; }
}
function polyBlep(t, dt) { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; }
class Osc {
  constructor() { this.ph = 0; this.wrapped = false; }
  saw(dt) { return 2 * this.ph - 1 - polyBlep(this.ph, dt); }
  square(dt, pw = 0.5) { let s = this.ph < pw ? 1 : -1; s += polyBlep(this.ph, dt); let t2 = this.ph + 1 - pw; if (t2 >= 1) t2 -= 1; s -= polyBlep(t2, dt); return s; }
  tri() { return 4 * Math.abs(this.ph - 0.5) - 1; }
  sine() { return Math.sin(PI2 * this.ph); }
  advance(dt) { this.ph += dt; this.wrapped = false; if (this.ph >= 1) { this.ph -= Math.floor(this.ph); this.wrapped = true; } }
}
class Ladder {
  constructor() { this.s = [0, 0, 0, 0]; this.G = 0.1; this.k = 0; this.drive = 1; }
  reset() { this.s = [0, 0, 0, 0]; }
  set(hz, res, sr, drv = 1) { hz = clampf(hz, 8, sr * 0.45); const g = Math.tan(kPif * hz / sr); this.G = g / (1 + g); this.k = clampf(res, 0, 1.12) * 4.05; this.drive = drv; }
  run(x) {
    const G = this.G, s = this.s, k = this.k, G2 = G * G, G4 = G2 * G2, a = 1 - G;
    const S = G2 * G * a * s[0] + G2 * a * s[1] + G * a * s[2] + a * s[3];
    const y4 = (G4 * x + S) / (1 + k * G4);
    let u = x - k * y4; u = fastTanh(u * this.drive) / this.drive;
    let inn = u;
    for (let i = 0; i < 4; ++i) { const y = G * inn + a * s[i]; s[i] = 2 * y - s[i]; inn = y; }
    return inn;
  }
}
class Svf {
  constructor() { this.s1 = 0; this.s2 = 0; this.a1 = 0; this.a2 = 0; this.a3 = 0; this.k = 1; this.low = 0; this.band = 0; this.high = 0; }
  reset() { this.s1 = this.s2 = 0; }
  set(hz, q, sr) { hz = clampf(hz, 8, sr * 0.45); const g = Math.tan(kPif * hz / sr); this.k = 1 / Math.max(0.4, q); this.a1 = 1 / (1 + g * (g + this.k)); this.a2 = g * this.a1; this.a3 = g * this.a2; }
  run(x) { const v3 = x - this.s2, v1 = this.a1 * this.s1 + this.a2 * v3, v2 = this.s2 + this.a2 * this.s1 + this.a3 * v3; this.s1 = 2 * v1 - this.s1; this.s2 = 2 * v2 - this.s2; this.low = v2; this.band = v1; this.high = x - this.k * v1 - v2; return this.low; }
}
class DcBlock { constructor() { this.x1 = 0; this.y1 = 0; } run(x) { const y = x - this.x1 + 0.995 * this.y1; this.x1 = x; this.y1 = y; return y; } reset() { this.x1 = this.y1 = 0; } }
class Lfo {
  constructor() { this.ph = 0; this.held = 0; this.n = new Noise(); this.wrapped = false; }
  next(hz, sr, shape) { // 0 sine, 1 triangle, 2 saw up, 3 square, 4 sample & hold
    this.ph += hz / sr; this.wrapped = false; if (this.ph >= 1) { this.ph -= Math.floor(this.ph); this.wrapped = true; if (shape === 4) this.held = this.n.white(); }
    switch (shape) { case 0: return Math.sin(PI2 * this.ph); case 1: return 4 * Math.abs(this.ph - 0.5) - 1; case 2: return 2 * this.ph - 1; case 3: return this.ph < 0.5 ? 1 : -1; default: return this.held; }
  }
}
class Chorus {
  constructor(sr) { this.sr = sr; let n = 1; while (n < Math.floor(sr * 0.06) + 8) n <<= 1; this.l = new Float32Array(n); this.r = new Float32Array(n); this.mask = n - 1; this.w = 0; this.ph = 0; }
  reset() { this.l.fill(0); this.r.fill(0); }
  rd(b, d) { const p = this.w - d, i0 = Math.floor(p), f = p - i0, a = b[i0 & this.mask], c = b[(i0 + 1) & this.mask]; return a + (c - a) * f; }
  process(io, rateHz, depth, mix) { // io = [L,R] updated in place
    this.ph += rateHz / this.sr; if (this.ph >= 1) this.ph -= 1;
    const base = this.sr * 0.012, dep = this.sr * 0.006 * depth, m1 = Math.sin(PI2 * this.ph), m2 = Math.sin(PI2 * (this.ph + 0.5));
    this.l[this.w & this.mask] = io[0]; this.r[this.w & this.mask] = io[1];
    const wl = this.rd(this.l, base + dep * m1), wr = this.rd(this.r, base + dep * m2);
    io[0] += (wl - io[0]) * mix * 0.7; io[1] += (wr - io[1]) * mix * 0.7; ++this.w;
  }
}
class DelayLine {
  constructor(maxFrames) { let n = 1; while (n < maxFrames + 4) n <<= 1; this.buf = new Float32Array(n); this.mask = n - 1; this.w = 0; }
  clear() { this.buf.fill(0); }
  push(x) { this.buf[this.w & this.mask] = x; ++this.w; }
  tap(d) { return this.buf[(this.w - 1 - d) & this.mask]; }
  read(d) {
    d = Math.min(Math.max(d, 2), this.mask - 3); const i = Math.floor(d), t = d - i;
    const y0 = this.tap(i - 2), y1 = this.tap(i - 1), y2 = this.tap(i), y3 = this.tap(i + 1);
    const c0 = y1, c1 = 0.5 * (y2 - y0), c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3, c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
    return ((c3 * t + c2) * t + c1) * t + c0;
  }
}
/* A parameter: [name, unit, min, max, default, format, log?, labels?] */
const P = (name, unit, min, max, def, fmt, log, labels) => ({ name, unit, min, max, def, fmt: fmt || '%.2f', log: !!log, labels: labels || null });
globalThis.OCC = globalThis.OCC || { engines: {} };
/* Engine base: parameters, preset writes back to the screen. */
class EngineBase {
  constructor(sr) { this.sr = sr; this.writes = []; this.noteTune = 0; this.counter = 0; }
  initParams(specs, presetId) { this.v = new Float64Array(specs.length); specs.forEach((s, i) => this.v[i] = s.def); }
  writeParam(id, x) { if (this.writes.length < 512) this.writes.push([id, x]); }
  takeWrites() { const w = this.writes; this.writes = []; return w; }
}
/* Minica - Minimoog-style monosynth with optional poly mode. Port of plugins/minica/minica.h */
(function () {
  const E = {}; ['Preset', 'O1Range', 'O1Wave', 'O2Range', 'O2Wave', 'O2Tune', 'O3Range', 'O3Wave', 'O3Tune', 'O3Kbd', 'Vol1', 'Vol2', 'Vol3', 'VolNoise', 'Overload',
    'Cutoff', 'Emphasis', 'Contour', 'KbdTrack', 'FAtt', 'FDec', 'FSus', 'AAtt', 'ADec', 'ASus', 'Release', 'Glide', 'Mode', 'Trigger',
    'LfoRate', 'LfoShape', 'VibDepth', 'FiltMod', 'Velocity', 'BendRange', 'Volume', 'FilterDrive', 'LowMidDrive', 'LowMidFreq', 'Count'].forEach((n, i) => E[n] = i);
  const rng = ["32'", "16'", "8'", "4'", "2'"], wav = ['Triangle', 'Shark tooth', 'Saw', 'Square', 'Wide pulse', 'Narrow pulse'];
  const specs = [
    P('Preset', '', 0, 9, 9, '%.0f', false, ['Fat bass', 'Lead (singing)', 'Brass', 'Funk bass', 'Pluck', 'Sync-ish lead', 'Soft pad', 'Sub bass', 'Wow sweep', 'Init']),
    P('Osc 1 range', '', 0, 4, 2, '%.0f', false, rng), P('Osc 1 wave', '', 0, 5, 2, '%.0f', false, wav),
    P('Osc 2 range', '', 0, 4, 2, '%.0f', false, rng), P('Osc 2 wave', '', 0, 5, 2, '%.0f', false, wav), P('Osc 2 tune', 'cents', -100, 100, 6, '%.0f c'),
    P('Osc 3 range', '', 0, 4, 1, '%.0f', false, rng), P('Osc 3 wave', '', 0, 5, 2, '%.0f', false, wav), P('Osc 3 tune', 'cents', -100, 100, -6, '%.0f c'),
    P('Osc 3 follows keys', '', 0, 1, 1, '%.0f', false, ['Off', 'On']),
    P('Osc 1 level', '', 0, 1, 0.8), P('Osc 2 level', '', 0, 1, 0.7), P('Osc 3 level', '', 0, 1, 0.7), P('Noise level', '', 0, 1, 0),
    P('Overload', '', 0, 1, 0.3),
    P('Cutoff', 'Hz', 30, 16000, 900, '%.0f Hz', true), P('Emphasis', '', 0, 1, 0.25), P('Contour amount', '', 0, 1, 0.5),
    P('Keyboard tracking', '', 0, 3, 2, '%.0f', false, ['Off', '1/3', '2/3', 'Full']),
    P('Filter attack', 's', 0.001, 5, 0.005, '%.3f s', true), P('Filter decay', 's', 0.005, 8, 0.45, '%.3f s', true), P('Filter sustain', '', 0, 1, 0.3),
    P('Loudness attack', 's', 0.001, 5, 0.004, '%.3f s', true), P('Loudness decay', 's', 0.005, 8, 0.6, '%.3f s', true), P('Loudness sustain', '', 0, 1, 0.8),
    P('Release', 's', 0.005, 8, 0.25, '%.3f s', true), P('Glide', 's', 0, 2, 0, '%.2f s'),
    P('Voices', '', 0, 2, 0, '%.0f', false, ['Mono', 'Poly 4', 'Poly 8']), P('Trigger', '', 0, 1, 1, '%.0f', false, ['Single (legato)', 'Multi (retrigger)']),
    P('LFO rate', 'Hz', 0.1, 25, 5.5, '%.1f Hz', true), P('LFO shape', '', 0, 3, 0, '%.0f', false, ['Triangle', 'Square', 'Saw up', 'Sample & hold']),
    P('Vibrato', '', 0, 1, 0), P('Filter mod', '', 0, 1, 0),
    P('Velocity', '', 0, 1, 0.5), P('Bend range', 'st', 0, 24, 2, '%.0f st'), P('Volume', 'dB', -24, 6, -6, '%.1f dB'),
    P('Filter drive', '', 0, 1, 0.35), P('Low-mid drive', '', 0, 1, 0), P('Low-mid focus', 'Hz', 120, 1200, 380, '%.0f Hz', true),
  ];
  const groups = [
    ['Oscillators', [E.O1Range, E.O1Wave, E.O2Range, E.O2Wave, E.O2Tune, E.O3Range, E.O3Wave, E.O3Tune, E.O3Kbd]],
    ['Mixer', [E.Vol1, E.Vol2, E.Vol3, E.VolNoise, E.Overload]],
    ['Filter', [E.Cutoff, E.Emphasis, E.Contour, E.KbdTrack, E.FAtt, E.FDec, E.FSus, E.FilterDrive, E.LowMidDrive, E.LowMidFreq]],
    ['Loudness', [E.AAtt, E.ADec, E.ASus, E.Release]],
    ['Play', [E.Mode, E.Trigger, E.Glide, E.Velocity, E.BendRange, E.Volume]],
    ['Modulation', [E.LfoRate, E.LfoShape, E.VibDepth, E.FiltMod]],
  ];
  const mkVoice = () => ({ o: [new Osc(), new Osc(), new Osc()], lad: new Ladder(), fe: new Adsr(), ae: new Adsr(), noise: new Noise(), cur: 60, target: 60, vel: 1, note: -1, gate: false, age: 0 });
  function wave(o, w, dt) {
    let s;
    switch (w) { case 0: s = o.tri(); break; case 1: s = 0.5 * (o.tri() + o.saw(dt)); break; case 2: s = o.saw(dt); break; case 3: s = o.square(dt, 0.5); break; case 4: s = o.square(dt, 0.3) - 0.4; break; default: s = o.square(dt, 0.15) - 0.7; }
    o.advance(dt); return s * 0.5;
  }
  const INIT = [0, 2, 2, 2, 2, 6, 1, 2, -6, 1, 0.8, 0.7, 0.7, 0, 0.3, 900, 0.25, 0.5, 2, 0.005, 0.45, 0.3, 0.004, 0.6, 0.8, 0.25, 0, 0, 1, 5.5, 0, 0, 0, 0.5, 2, -6];
  const PS = [
    { O1Range: 1, O2Range: 1, O3Range: 0, O1Wave: 2, O2Wave: 2, O3Wave: 3, Cutoff: 500, Emphasis: 0.3, Contour: 0.55, FDec: 0.28, FSus: 0.2, ASus: 0.9, Release: 0.15, Overload: 0.45 },
    { O1Wave: 2, O2Wave: 2, O3Wave: 3, O2Tune: 8, O3Tune: -8, Cutoff: 2600, Emphasis: 0.2, Contour: 0.25, FDec: 0.8, FSus: 0.6, ASus: 1, Glide: 0.12, VibDepth: 0.15, Release: 0.3, Trigger: 0 },
    { O1Wave: 2, O2Wave: 2, O3Wave: 2, O2Tune: 10, O3Tune: -10, Cutoff: 700, Emphasis: 0.15, Contour: 0.7, FAtt: 0.12, FDec: 0.5, FSus: 0.5, AAtt: 0.04, ASus: 0.9, Release: 0.35, Mode: 2 },
    { O1Range: 1, O2Range: 1, O3Range: 1, O1Wave: 3, O2Wave: 2, O3Wave: 0, Cutoff: 300, Emphasis: 0.45, Contour: 0.9, FDec: 0.16, FSus: 0, ADec: 0.3, ASus: 0, Release: 0.1, Trigger: 1 },
    { O1Wave: 4, O2Wave: 2, O3Wave: 0, Cutoff: 400, Emphasis: 0.35, Contour: 0.85, FDec: 0.2, FSus: 0, ADec: 0.35, ASus: 0, Release: 0.2, Mode: 1 },
    { O1Wave: 5, O2Wave: 2, O3Wave: 5, O2Tune: 14, O3Tune: -3, Cutoff: 3200, Emphasis: 0.5, Contour: 0.2, ASus: 1, Glide: 0.08, Release: 0.2 },
    { O1Wave: 0, O2Wave: 1, O3Wave: 0, O2Tune: 9, O3Tune: -9, Cutoff: 1200, Emphasis: 0.1, Contour: 0.3, FAtt: 0.6, FDec: 1.5, FSus: 0.6, AAtt: 0.5, ASus: 1, Release: 1.2, Mode: 2, VibDepth: 0.08 },
    { O1Range: 0, O2Range: 1, O3Range: 0, O1Wave: 3, O2Wave: 0, O3Wave: 0, Vol2: 0.3, Vol3: 0.4, Cutoff: 250, Emphasis: 0.1, Contour: 0.2, ASus: 1, Release: 0.12 },
    { O1Wave: 2, O2Wave: 2, O3Wave: 2, Cutoff: 200, Emphasis: 0.7, Contour: 0.9, FAtt: 0.9, FDec: 1.4, FSus: 0.1, ASus: 1, Release: 0.8, FiltMod: 0.35, LfoRate: 0.6, Mode: 2 },
    {},
  ];
  class Minica extends EngineBase {
    constructor(sr) { super(sr); this.initParams(specs); this.voice = Array.from({ length: 8 }, mkVoice); this.stack = []; this.lfo = new Lfo(); this.lm = new Svf(); this.bend = 0; this.mod = 0; this.press = 0; this.glideC = 0; this.kbd = 0.667; this.voice.forEach(v => { v.fe.setSr(sr); v.ae.setSr(sr); }); this.configure(); }
    set(id, x) { if (id < 0 || id >= E.Count) return; this.v[id] = x; if (id === E.Preset) { this.loadPreset(Math.round(x)); return; } this.configure(); }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.mod = m; } pressure(p) { this.press = p; }
    allNotesOff() { this.stack = []; for (const v of this.voice) if (v.ae.active()) { v.ae.gateOff(); v.fe.gateOff(); v.gate = false; } }
    voices() { const m = Math.round(this.v[E.Mode]); return m === 0 ? 1 : (m === 1 ? 4 : 8); }
    noteOn(note, vel) {
      const nv = this.voices(), nt = this.noteTune * 0.01, V = this.v;
      if (nv === 1) {
        this.stack = this.stack.filter(h => h.note !== note);
        const wasHeld = this.stack.length > 0 && this.voice[0].gate;
        this.stack.push({ note, vel });
        const v = this.voice[0]; v.target = note + nt; v.vel = vel;
        if (!wasHeld || v.ae.st === 0) v.cur = note + nt;
        if (!(wasHeld && V[E.Trigger] < 0.5)) { v.fe.gateOn(false); v.ae.gateOn(false); }
        v.gate = true; v.note = note; return;
      }
      let pick = -1; for (let i = 0; i < nv; ++i) if (!this.voice[i].ae.active()) { pick = i; break; }
      if (pick < 0) { let oldest = Infinity; for (let i = 0; i < nv; ++i) if (this.voice[i].age < oldest) { oldest = this.voice[i].age; pick = i; } }
      const v = this.voice[pick]; v.note = note; v.cur = v.target = note + nt; v.vel = vel; v.gate = true; v.age = ++this.counter;
      v.fe.gateOn(true); v.ae.gateOn(true);
    }
    noteOff(note) {
      if (this.voices() === 1) {
        this.stack = this.stack.filter(h => h.note !== note); const v = this.voice[0];
        if (this.stack.length) { const t = this.stack[this.stack.length - 1]; v.target = t.note; v.note = t.note; if (this.v[E.Trigger] > 0.5) { v.fe.gateOn(false); v.ae.gateOn(false); } }
        else { v.gate = false; v.fe.gateOff(); v.ae.gateOff(); }
        return;
      }
      for (let i = 0; i < 8; ++i) { const v = this.voice[i]; if (v.gate && v.note === note) { v.gate = false; v.fe.gateOff(); v.ae.gateOff(); } }
    }
    configure() {
      const V = this.v, sr = this.sr; this.glideC = V[E.Glide] <= 0.001 ? 1 : 1 - Math.exp(-1 / (V[E.Glide] * 0.35 * sr));
      const kt = [0, 0.333, 0.667, 1]; this.kbd = kt[clampf(Math.round(V[E.KbdTrack]), 0, 3)];
      for (const v of this.voice) { v.fe.set(V[E.FAtt], V[E.FDec], V[E.FSus], V[E.Release]); v.ae.set(V[E.AAtt], V[E.ADec], V[E.ASus], V[E.Release]); }
    }
    loadPreset(n) {
      const idx = clampf(n, 0, PS.length - 1), nv = INIT.slice(); while (nv.length < E.Count) nv.push(0);
      const o = PS[idx]; for (const k in o) nv[E[k]] = o[k];
      for (let i = 1; i < E.Count; ++i) { this.v[i] = nv[i]; this.writeParam(i, nv[i]); }
      this.configure();
    }
    process(outL, outR, n) {
      const V = this.v, sr = this.sr, nv = this.voices(), vol = Math.pow(10, V[E.Volume] / 20), shapeMap = [1, 3, 2, 4], shp = shapeMap[clampf(Math.round(V[E.LfoShape]), 0, 3)];
      const shift = id => (Math.round(V[id]) - 2) * 12;
      for (let i = 0; i < n; ++i) {
        const lfo = this.lfo.next(V[E.LfoRate], sr, shp), vib = lfo * (V[E.VibDepth] + this.mod * 0.6) * 0.5, fmod = lfo * (V[E.FiltMod] + this.mod * 0.5 + this.press * 0.3), bendSt = this.bend * V[E.BendRange];
        let mix = 0;
        for (let k = 0; k < nv; ++k) {
          const v = this.voice[k]; if (!v.ae.active()) continue;
          v.cur += (v.target - v.cur) * this.glideC;
          const base = v.cur + bendSt + vib;
          const f1 = midiHz(base + shift(E.O1Range)), f2 = midiHz(base + shift(E.O2Range) + V[E.O2Tune] * 0.01);
          const f3 = midiHz((V[E.O3Kbd] > 0.5 ? base : 60 + bendSt) + shift(E.O3Range) + V[E.O3Tune] * 0.01);
          let s = 0;
          s += V[E.Vol1] * wave(v.o[0], Math.trunc(V[E.O1Wave]), f1 / sr);
          s += V[E.Vol2] * wave(v.o[1], Math.trunc(V[E.O2Wave]), f2 / sr);
          s += V[E.Vol3] * wave(v.o[2], Math.trunc(V[E.O3Wave]), f3 / sr);
          if (V[E.VolNoise] > 0) s += V[E.VolNoise] * 0.6 * v.noise.white();
          const fe = v.fe.next(), ae = v.ae.next(), kt = this.kbd * (v.cur - 60) / 12, vsc = 1 - V[E.Velocity] + V[E.Velocity] * v.vel;
          const oct = V[E.Contour] * 5 * fe * (0.4 + 0.6 * vsc) + kt + fmod * 1.5;
          v.lad.set(V[E.Cutoff] * Math.pow(2, oct), Math.min(1.1, V[E.Emphasis] * 1.08), sr, 1 + V[E.Overload] * 2.5 + V[E.FilterDrive] * 9);
          const y = v.lad.run(s * (0.5 + V[E.Overload] + V[E.FilterDrive] * 1.5));
          mix += y * ae * (0.5 + 0.5 * vsc);
        }
        if (V[E.LowMidDrive] > 0.001) {
          this.lm.set(V[E.LowMidFreq], 0.8, sr); this.lm.run(mix); const band = this.lm.band * this.lm.k, d = 1 + V[E.LowMidDrive] * 14;
          mix += (fastTanh(band * d) / d * (1 + V[E.LowMidDrive] * 3) - band);
        }
        mix = fastTanh(mix * 0.9) * vol * 0.9; outL[i] = mix; outR[i] = mix;
      }
    }
  }
  OCC.engines.minica = { name: 'Minica', blurb: 'Minimoog-style analogue monosynth: three oscillators, a ladder filter and glide.', specs, groups, make: sr => new Minica(sr), E };
})();
/* Fmica - four-operator FM synth. Port of plugins/fmica/fmica.h */
(function () {
  const OpBase = 3, OpN = 8, opId = (op, k) => OpBase + op * OpN + k;
  const K = { Ratio: 0, Detune: 1, Level: 2, Atk: 3, Dec: 4, Sus: 5, Rel: 6, Vel: 7 };
  const E = { Preset: 0, Algorithm: 1, Feedback: 2 }; let nx = OpBase + 4 * OpN; ['ModDepth', 'ChorusMix', 'LfoRate', 'Vibrato', 'Tremolo', 'BendRange', 'Volume', 'CrushBits', 'CrushRate', 'CrushMix', 'Count'].forEach(n => E[n] = nx++);
  const specs = [
    P('Preset', '', 0, 13, 13, '%.0f', false, ['E.Piano', 'Tine bell', 'Slap bass', 'Brass', 'Marimba', 'FM organ', 'Clav', 'Strings-ish', 'Harp', 'Tubular bells', 'Synth lead', 'Wood flute', 'Glass pad', 'Init']),
    P('Algorithm', '', 0, 7, 0, '%.0f', false, ['4>3>2>1', '(3+4)>2>1', '4>1, 3>2>1', '4>3>1, 2>1', '(4>3)+(2>1)', '4>(1,2,3)', '4>3, 1, 2', '1+2+3+4']),
    P('Feedback', '', 0, 1, 0),
  ];
  for (let o = 0; o < 4; ++o) {
    const nm = 'Op' + (o + 1) + ' ';
    specs.push(P(nm + 'ratio', '', 0.25, 16, 1), P(nm + 'detune', 'cents', -50, 50, 0, '%.0f c'), P(nm + 'level', '', 0, 1, o === 0 ? 0.8 : 0),
      P(nm + 'attack', 's', 0.001, 5, 0.002, '%.3f s', true), P(nm + 'decay', 's', 0.005, 10, 0.6, '%.3f s', true), P(nm + 'sustain', '', 0, 1, 0.8),
      P(nm + 'release', 's', 0.005, 8, 0.25, '%.3f s', true), P(nm + 'velocity', '', 0, 1, 0.5));
  }
  specs.push(P('Mod depth', '', 0, 2, 1), P('Chorus', '', 0, 1, 0), P('LFO rate', 'Hz', 0.1, 20, 5, '%.1f Hz', true), P('Vibrato', '', 0, 1, 0), P('Tremolo', '', 0, 1, 0),
    P('Bend range', 'st', 0, 24, 2, '%.0f st'), P('Volume', 'dB', -24, 6, -6, '%.1f dB'), P('Crush bits', 'bits', 2, 16, 16, '%.1f bits'), P('Crush rate', '', 1, 32, 1, '1/%.0f', true), P('Crush mix', '', 0, 1, 1));
  const groups = [['Algorithm', [E.Algorithm, E.Feedback, E.ModDepth]]];
  for (let o = 0; o < 4; ++o) groups.push(['Operator ' + (o + 1), [0, 1, 2, 3, 4, 5, 6, 7].map(k => opId(o, k))]);
  groups.push(['Sound', [E.ChorusMix, E.LfoRate, E.Vibrato, E.Tremolo, E.BendRange, E.Volume]], ['Crusher', [E.CrushBits, E.CrushRate, E.CrushMix]]);
  const ALG = [{ mod: [2, 4, 8, 0], carrier: 1 }, { mod: [2, 12, 0, 0], carrier: 1 }, { mod: [8 | 2, 4, 0, 0], carrier: 1 }, { mod: [4 | 2, 0, 8, 0], carrier: 1 }, { mod: [2, 0, 8, 0], carrier: 5 }, { mod: [8, 8, 8, 0], carrier: 7 }, { mod: [0, 0, 8, 0], carrier: 7 }, { mod: [0, 0, 0, 0], carrier: 15 }];
  const NORM = [0, 1, 0.75, 0.6, 0.5];
  const mkVoice = () => ({ tune: 0, env: [new Adsr(), new Adsr(), new Adsr(), new Adsr()], raw4: 0, ph: [0, 0, 0, 0], ratio: [1, 1, 1, 1], level: [0, 0, 0, 0], fb: [0, 0], note: 60, vel: 1, gate: false, age: 0 });
  const on = v => v.env.some(e => e.active());
  const o = (ratio, detune, level, a, d, s, r, vel) => [ratio, detune, level, a, d, s, r, vel];
  const PSET = [
    [4, 0.0, [o(1, 0, .85, .002, 1.8, 0, .3, .4), o(1, 0, .5, .002, .6, 0, .3, .7), o(1, 3, .8, .002, 2.5, 0, .3, .4), o(14, 0, .35, .001, .12, 0, .2, .8)], .4, 0, 0],
    [4, 0.0, [o(1, 0, .8, .001, 3, 0, .5, .3), o(1, 0, .35, .001, 1.2, 0, .4, .6), o(1, 0, .7, .001, 2.5, 0, .5, .3), o(7, 0, .45, .001, .08, 0, .2, .8)], .3, 0, 0],
    [0, 0.2, [o(1, 0, .9, .001, .5, .6, .12, .3), o(1, 0, .35, .001, .25, .2, .1, .6), o(1, 0, .3, .001, .15, .1, .1, .6), o(2, 0, .35, .001, .08, 0, .1, .8)], 0, 0, 0],
    [0, 0.3, [o(1, 0, .9, .04, .5, .85, .15, .3), o(1, 0, .45, .06, .5, .7, .15, .6), o(1, 0, .3, .06, .5, .5, .15, .6), o(1, 0, .25, .05, .4, .5, .15, .6)], .15, .04, 0],
    [4, 0.0, [o(1, 0, .9, .001, .9, 0, .15, .3), o(1, 0, .25, .001, .08, 0, .1, .5), o(1, 0, .7, .001, .35, 0, .1, .3), o(4, 0, .3, .001, .05, 0, .1, .6)], 0, 0, 0],
    [7, 0.0, [o(1, 0, .7, .004, .3, 1, .08, .1), o(2, 0, .5, .004, .3, 1, .08, .1), o(4, 0, .35, .004, .3, 1, .08, .1), o(.5, 0, .55, .004, .3, 1, .08, .1)], .5, 0, 0],
    [2, 0.45, [o(1, 0, .85, .001, .35, .15, .08, .3), o(1, 0, .35, .001, .18, 0, .08, .5), o(3, 0, .35, .001, .12, 0, .08, .5), o(1, 0, .3, .001, .1, 0, .08, .6)], 0, 0, 0],
    [5, 0.25, [o(1, -6, .5, .35, .8, .9, .6, .2), o(1, 6, .5, .4, .8, .9, .6, .2), o(2, 0, .3, .3, .8, .9, .6, .2), o(1, 0, .22, .35, .8, .7, .6, .3)], .7, .06, 0],
    [1, 0.0, [o(1, 0, .9, .001, 1.6, 0, .4, .3), o(2, 0, .45, .001, .5, 0, .3, .5), o(1, 0, .15, .001, .2, 0, .3, .5), o(3, 0, .3, .001, .12, 0, .2, .7)], .2, 0, 0],
    [4, 0.0, [o(1, 0, .8, .001, 4.5, 0, 1, .2), o(3.5, 0, .4, .001, 2, 0, 1, .4), o(1, 0, .5, .001, 4, 0, 1, .2), o(3.5, 0, .35, .001, .2, 0, .6, .6)], .3, 0, 0],
    [0, 0.55, [o(1, 0, .9, .005, 1, .9, .2, .3), o(1, 0, .5, .005, 1, .8, .2, .4), o(2, 0, .3, .005, 1, .7, .2, .4), o(1, 0, .35, .005, 1, .7, .2, .4)], .35, .08, 0],
    [0, 0.1, [o(1, 0, .8, .07, .5, .9, .2, .2), o(1, 0, .12, .08, .5, .6, .2, .3), o(1, 0, .1, .05, .3, .2, .2, .3), o(1, 0, .1, .03, .2, .4, .2, .4)], .1, .1, 0],
    [6, 0, [o(1, -4, .6, .9, 1.5, .9, 1.4, .1), o(2, 4, .5, 1, 1.5, .8, 1.4, .1), o(5, 0, .3, .8, 1.5, .7, 1.4, .1), o(7, 0, .1, 1.2, 1.5, .5, 1.4, .2)], .8, .05, 0],
    [0, 0, [o(1, 0, .8, .002, .6, .8, .25, .5), o(1, 0, 0, .002, .6, .8, .25, .5), o(1, 0, 0, .002, .6, .8, .25, .5), o(1, 0, 0, .002, .6, .8, .25, .5)], 0, 0, 0],
  ];
  class Fmica extends EngineBase {
    constructor(sr) { super(sr); this.initParams(specs); this.voice = Array.from({ length: 16 }, mkVoice); this.chorus = new Chorus(sr); this.lfo = new Lfo(); this.bend = this.mod = this.press = 0; this.crushL = this.crushR = 0; this.crushCount = 0; this.voice.forEach(v => v.env.forEach(e => e.setSr(sr))); }
    set(id, x) { if (id < 0 || id >= E.Count) return; this.v[id] = x; if (id === E.Preset) { this.loadPreset(Math.round(x)); return; } this.configure(); }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.mod = m; } pressure(p) { this.press = p; }
    allNotesOff() { for (const v of this.voice) this.release(v); }
    release(v) { v.gate = false; v.env.forEach(e => e.gateOff()); }
    noteOn(note, vel) {
      let pick = -1; for (let i = 0; i < 16; ++i) if (!on(this.voice[i])) { pick = i; break; }
      if (pick < 0) { let old = Infinity; for (let i = 0; i < 16; ++i) if (this.voice[i].age < old) { old = this.voice[i].age; pick = i; } }
      const v = mkVoice(); v.env.forEach(e => e.setSr(this.sr)); this.voice[pick] = v;
      v.note = note; v.tune = this.noteTune * 0.01; v.vel = vel; v.gate = true; v.age = ++this.counter;
      const V = this.v;
      for (let o = 0; o < 4; ++o) {
        v.ratio[o] = V[opId(o, K.Ratio)] * Math.pow(2, V[opId(o, K.Detune)] / 1200); const sens = V[opId(o, K.Vel)];
        v.level[o] = V[opId(o, K.Level)] * (1 - sens + sens * vel); v.env[o].set(V[opId(o, K.Atk)], V[opId(o, K.Dec)], V[opId(o, K.Sus)], V[opId(o, K.Rel)]);
      }
      for (let o = 0; o < 4; ++o) v.env[o].gateOn(true);
    }
    noteOff(note) { for (const v of this.voice) if (v.gate && v.note === note) this.release(v); }
    configure() { const V = this.v; for (const v of this.voice) if (on(v)) for (let o = 0; o < 4; ++o) v.env[o].set(V[opId(o, K.Atk)], V[opId(o, K.Dec)], V[opId(o, K.Sus)], V[opId(o, K.Rel)]); }
    loadPreset(n) {
      const p = PSET[clampf(n, 0, 13)], put = (id, x) => { this.v[id] = x; this.writeParam(id, x); };
      put(E.Algorithm, p[0]); put(E.Feedback, p[1]);
      for (let o = 0; o < 4; ++o) for (let k = 0; k < OpN; ++k) put(opId(o, k), p[2][o][k]);
      put(E.ModDepth, 1); put(E.ChorusMix, p[3]); put(E.Vibrato, p[4]); put(E.Tremolo, p[5]); this.configure();
    }
    process(outL, outR, n) {
      const V = this.v, sr = this.sr, vol = Math.pow(10, V[E.Volume] / 20), bendSt = this.bend * V[E.BendRange];
      const A = ALG[clampf(Math.round(V[E.Algorithm]), 0, 7)], depth = V[E.ModDepth], out = [0, 0, 0, 0], amp = [0, 0, 0, 0];
      for (let i = 0; i < n; ++i) {
        const lfo = this.lfo.next(V[E.LfoRate], sr, 0), vib = lfo * (V[E.Vibrato] * 0.5 + this.mod * 0.4), trem = 1 - V[E.Tremolo] * 0.5 * (1 + lfo) * 0.8;
        let sum = 0;
        for (const v of this.voice) {
          if (!on(v)) continue;
          const base = v.note + v.tune + bendSt + vib; out[0] = out[1] = out[2] = out[3] = 0;
          for (let o = 0; o < 4; ++o) amp[o] = v.env[o].next();
          for (let o = 3; o >= 0; --o) {
            let m = 0; for (let s = 0; s < 4; ++s) if (A.mod[o] & (1 << s)) m += out[s];
            if (o === 3) m += V[E.Feedback] * 2.2 * 0.5 * (v.fb[0] + v.fb[1]);
            const hz = midiHz(base) * v.ratio[o]; v.ph[o] += hz / sr; if (v.ph[o] >= 1) v.ph[o] -= Math.floor(v.ph[o]);
            const isMod = (A.carrier & (1 << o)) === 0, lvl = v.level[o] * (isMod ? depth * 5 : 1);
            const sn = Math.sin(PI2 * v.ph[o] + m); if (o === 3) v.raw4 = sn * amp[3];
            out[o] = sn * amp[o] * lvl;
          }
          v.fb[1] = v.fb[0]; v.fb[0] = clampf(v.raw4, -1, 1);
          let c = 0, nc = 0; for (let o = 0; o < 4; ++o) if (A.carrier & (1 << o)) { c += out[o]; ++nc; }
          sum += c * NORM[nc];
        }
        sum = fastTanh(sum * 0.7) * vol * trem; outL[i] = sum; outR[i] = sum;
      }
      if (V[E.CrushBits] < 15.9 || V[E.CrushRate] > 1.01) {
        const levels = Math.pow(2, V[E.CrushBits]) * 0.5, mix = V[E.CrushMix], hold = Math.max(1, Math.round(V[E.CrushRate]));
        for (let i = 0; i < n; ++i) {
          if (this.crushCount <= 0) { this.crushL = Math.round(outL[i] * 4 * levels) / (4 * levels); this.crushR = Math.round(outR[i] * 4 * levels) / (4 * levels); this.crushCount = hold; }
          --this.crushCount; outL[i] += (this.crushL - outL[i]) * mix; outR[i] += (this.crushR - outR[i]) * mix;
        }
      }
      if (V[E.ChorusMix] > 0.001) { const io = [0, 0]; for (let i = 0; i < n; ++i) { io[0] = outL[i]; io[1] = outR[i]; this.chorus.process(io, 0.6, 0.6, V[E.ChorusMix]); outL[i] = io[0]; outR[i] = io[1]; } }
    }
  }
  OCC.engines.fmica = { name: 'Fmica', blurb: 'Four-operator FM synth with eight algorithms and classic FM sounds: electric piano, bells, bass, brass.', specs, groups, make: sr => new Fmica(sr), E };
})();
/* Rhodica - Rhodes-style electric piano. Port of plugins/rhodica/rhodica.h */
(function () {
  const E = {}; ['Preset', 'Tone', 'Bark', 'Ping', 'Decay', 'Damper', 'VelSens', 'Spread', 'TremMode', 'TremRate', 'TremDepth', 'Chorus', 'Drive', 'BendRange', 'Volume', 'Count'].forEach((n, i) => E[n] = i);
  const specs = [
    P('Preset', '', 0, 8, 8, '%.0f', false, ['Mark I', 'Stage bright', 'Mellow', 'Barky', 'Suitcase tremolo', 'Autopan wide', 'Bell pad', 'Chorus dream', 'Init']),
    P('Tone', '', 0, 1, 0.5), P('Bark', '', 0, 1, 0.4), P('Tine ping', '', 0, 1, 0.4), P('Decay', 's', 0.5, 12, 4, '%.1f s', true), P('Damper', 's', 0.02, 2, 0.12, '%.2f s', true),
    P('Velocity', '', 0, 1, 0.7), P('Key spread', '', 0, 1, 0.3), P('Tremolo', '', 0, 2, 0, '%.0f', false, ['Off', 'Tremolo', 'Autopan']), P('Trem rate', 'Hz', 0.5, 9, 4.5, '%.1f Hz', true), P('Trem depth', '', 0, 1, 0.5),
    P('Chorus', '', 0, 1, 0), P('Drive', '', 0, 1, 0.15), P('Bend range', 'st', 0, 12, 2, '%.0f st'), P('Volume', 'dB', -24, 6, -6, '%.1f dB'),
  ];
  const groups = [['Tine', [E.Tone, E.Bark, E.Ping, E.Decay, E.Damper, E.VelSens, E.Spread]], ['Amp', [E.TremMode, E.TremRate, E.TremDepth, E.Chorus, E.Drive, E.BendRange, E.Volume]]];
  const PS = [[.45, .40, .40, 4.5, .14, .7, .30, 0, 4.5, .5, .15, .15], [.75, .55, .55, 3.5, .10, .75, .30, 0, 4.5, .5, .20, .20], [.20, .15, .20, 6, .18, .6, .30, 0, 4.5, .5, .25, .05], [.55, .95, .45, 3, .10, .9, .25, 0, 4.5, .5, 0, .45],
    [.45, .45, .40, 4.5, .14, .7, .15, 1, 5.2, .55, 0, .30], [.50, .40, .40, 4.5, .14, .7, .15, 2, 3.2, .75, 0, .20], [.30, .10, .85, 10, .60, .5, .50, 0, 4.5, .5, .45, 0], [.40, .30, .35, 5, .15, .7, .40, 0, 4.5, .5, .75, .10], [.50, .40, .40, 4, .12, .7, .30, 0, 4.5, .5, 0, .15]];
  const mk = () => ({ tune: 0, gain: 1, ph: 0, ph2: 0, amp: 0, vel: 1, tA: 0, tI: 0, pan: 0, last: 0, note: 60, gate: false, age: 0 });
  class Rhodica extends EngineBase {
    constructor(sr) { super(sr); this.initParams(specs); this.voice = Array.from({ length: 20 }, mk); this.chorus = new Chorus(sr); this.lfo = new Lfo(); this.dcL = new DcBlock(); this.dcR = new DcBlock(); this.bend = this.mod = 0; }
    set(id, x) { if (id < 0 || id >= E.Count) return; this.v[id] = x; if (id === E.Preset) this.loadPreset(Math.round(x)); }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.mod = m; } pressure() { }
    allNotesOff() { for (const v of this.voice) v.gate = false; }
    noteOn(note, vel) {
      let pick = -1; for (let i = 0; i < 20; ++i) if (this.voice[i].amp < 1e-4 && !this.voice[i].gate) { pick = i; break; }
      if (pick < 0) { let old = Infinity; for (let i = 0; i < 20; ++i) if (this.voice[i].age < old) { old = this.voice[i].age; pick = i; } }
      const v = this.voice[pick] = mk(); v.note = note; v.tune = this.noteTune * 0.01; v.gate = true; v.age = ++this.counter;
      const sens = this.v[E.VelSens]; v.vel = 1 - sens + sens * vel; v.gain = Math.pow(Math.max(0.05, v.vel), 1.3); v.tI = 0; v.tA = 0; v.amp = 1e-3;
      v.pan = clampf((note - 60) / 36, -1, 1) * this.v[E.Spread] * 0.5;
    }
    noteOff(note) { for (const v of this.voice) if (v.gate && v.note === note) v.gate = false; }
    loadPreset(n) {
      const p = PS[clampf(n, 0, 8)], ids = [E.Tone, E.Bark, E.Ping, E.Decay, E.Damper, E.VelSens, E.Spread, E.TremMode, E.TremRate, E.TremDepth, E.Chorus, E.Drive];
      ids.forEach((id, i) => { this.v[id] = p[i]; this.writeParam(id, p[i]); });
    }
    process(outL, outR, n) {
      const V = this.v, sr = this.sr, vol = Math.pow(10, V[E.Volume] / 20), bendSt = this.bend * V[E.BendRange], drive = 1 + V[E.Drive] * 5;
      const damp = Math.exp(-1 / (V[E.Damper] * sr * 0.25)), tm = clampf(Math.round(V[E.TremMode]), 0, 2), td = V[E.TremDepth], bark = V[E.Bark], dmul = 1 + (drive - 1) * 0.3;
      for (let i = 0; i < n; ++i) {
        const lfo = this.lfo.next(V[E.TremRate], sr, 0); let L = 0, R = 0;
        for (const v of this.voice) {
          if (!v.gate && v.amp < 1e-5) { v.amp = 0; continue; }
          const f = midiHz(v.note + v.tune + bendSt); v.ph += f / sr; if (v.ph >= 1) v.ph -= Math.floor(v.ph);
          const keyScale = Math.pow(2, -(v.note - 60) / 30), tauA = Math.max(0.15, V[E.Decay] * keyScale) / 6.9 * 2.2, tauI = Math.max(0.08, 0.55 * keyScale);
          v.tA += 1 / sr; v.tI += 1 / sr;
          const envA = 0.55 * Math.exp(-v.tA / (tauA * 0.18)) + 0.45 * Math.exp(-v.tA / tauA);
          const reg = 1.25 - (v.note - 36) / 90;
          const idx = (0.35 + 2.6 * V[E.Tone]) * (0.25 + 0.75 * v.vel * v.vel) * reg * (0.45 + 0.9 * bark) * Math.exp(-v.tI / tauI) + 0.12 * V[E.Tone];
          let x = Math.sin(PI2 * v.ph + idx * Math.sin(PI2 * v.ph));
          const pingHz = f * 14;
          if (pingHz < sr * 0.42 && V[E.Ping] > 0) { v.ph2 += pingHz / sr; if (v.ph2 >= 1) v.ph2 -= Math.floor(v.ph2); x += V[E.Ping] * 0.32 * v.vel * Math.exp(-v.tA / 0.05) * Math.sin(PI2 * v.ph2); }
          x = x + 0.35 * bark * v.vel * x * x;
          if (!v.gate) v.amp *= damp; else v.amp = envA;
          if (v.gate) v.last = envA; else if (v.amp > v.last) v.amp = v.last;
          const y = x * v.amp * v.gain * 0.5;
          L += y * (0.5 - v.pan * 0.5 + 0.25); R += y * (0.5 + v.pan * 0.5 + 0.25);
        }
        L = this.dcL.run(L); R = this.dcR.run(R);
        L = fastTanh(L * drive) / drive * dmul; R = fastTanh(R * drive) / drive * dmul;
        if (tm === 1) { const g = 1 - td * 0.5 * (1 + lfo); L *= g; R *= g; } else if (tm === 2) { L *= 1 - td * 0.5 * (1 + lfo); R *= 1 - td * 0.5 * (1 - lfo); }
        outL[i] = L * vol; outR[i] = R * vol;
      }
      if (V[E.Chorus] > 0.001) { const io = [0, 0]; for (let i = 0; i < n; ++i) { io[0] = outL[i]; io[1] = outR[i]; this.chorus.process(io, 0.45, 0.7, V[E.Chorus]); outL[i] = io[0]; outR[i] = io[1]; } }
    }
  }
  OCC.engines.rhodica = { name: 'Rhodica', blurb: 'Rhodes-style electric piano: bell-like tines that bark when you play harder, with a tremolo amp.', specs, groups, make: sr => new Rhodica(sr), E };
})();
/* Hammerica - B-3 tonewheel organ with a rotary speaker. Port of plugins/hammerica/hammerica.h */
(function () {
  const E = {}; ['Preset', 'Bar16', 'Bar513', 'Bar8', 'Bar4', 'Bar223', 'Bar2', 'Bar135', 'Bar113', 'Bar1', 'Percussion', 'PercHarm', 'PercDecay', 'PercVol', 'KeyClick', 'Scanner',
    'Drive', 'Tone', 'LeslieOn', 'Speed', 'ModSwitch', 'HornLevel', 'DrumLevel', 'Spread', 'Depth', 'LeslieMix', 'Volume', 'TubeMode', 'TubeBass', 'TubeTreble', 'TubeXover', 'TubeMix', 'Count'].forEach((n, i) => E[n] = i);
  const specs = [
    P('Preset', '', 0, 9, 9, '%.0f', false, ['Jazz (888000000)', 'Full gospel', 'Rock', 'Ballad', 'Flutes', 'Church', 'Reeds', 'Bass & chords', 'Whiter pad', 'Init']),
    P("16'", '', 0, 8, 0, '%.0f'), P("5 1/3'", '', 0, 8, 0, '%.0f'), P("8'", '', 0, 8, 8, '%.0f'), P("4'", '', 0, 8, 0, '%.0f'), P("2 2/3'", '', 0, 8, 0, '%.0f'),
    P("2'", '', 0, 8, 0, '%.0f'), P("1 3/5'", '', 0, 8, 0, '%.0f'), P("1 1/3'", '', 0, 8, 0, '%.0f'), P("1'", '', 0, 8, 0, '%.0f'),
    P('Percussion', '', 0, 1, 0, '%.0f', false, ['Off', 'On']), P('Perc harmonic', '', 0, 1, 1, '%.0f', false, ['2nd', '3rd']),
    P('Perc decay', '', 0, 1, 0, '%.0f', false, ['Fast', 'Slow']), P('Perc volume', '', 0, 1, 0, '%.0f', false, ['Normal', 'Soft']),
    P('Key click', '', 0, 1, 0.25), P('Vibrato / chorus', '', 0, 6, 0, '%.0f', false, ['Off', 'V1', 'V2', 'V3', 'C1', 'C2', 'C3']),
    P('Drive', '', 0, 1, 0.15), P('Tone', '', 0, 1, 0.7),
    P('Leslie', '', 0, 1, 1, '%.0f', false, ['Off', 'On']), P('Speed', '', 0, 2, 1, '%.0f', false, ['Stop', 'Slow', 'Fast']),
    P('Mod wheel', '', 0, 1, 1, '%.0f', false, ['Off', 'Slow/Fast switch']),
    P('Horn level', '', 0, 1, 0.8), P('Drum level', '', 0, 1, 0.9), P('Mic spread', '', 0, 1, 0.8),
    P('Rotor depth', '', 0, 1, 0.7), P('Leslie mix', '', 0, 1, 1), P('Volume', 'dB', -24, 6, -8, '%.1f dB'),
    P('Tube mode', '', 0, 1, 0, '%.0f', false, ['Smooth', 'Aggressive']), P('Tube bass', '', 0, 1, 0), P('Tube treble', '', 0, 1, 0),
    P('Tube split', 'Hz', 100, 4000, 700, '%.0f Hz', true), P('Tube mix', '', 0, 1, 1),
  ];
  const groups = [
    ['Drawbars', [E.Bar16, E.Bar513, E.Bar8, E.Bar4, E.Bar223, E.Bar2, E.Bar135, E.Bar113, E.Bar1]],
    ['Percussion & click', [E.Percussion, E.PercHarm, E.PercDecay, E.PercVol, E.KeyClick, E.Scanner]],
    ['Preamp', [E.Drive, E.Tone, E.TubeMode, E.TubeBass, E.TubeTreble, E.TubeXover, E.TubeMix]],
    ['Leslie', [E.LeslieOn, E.Speed, E.ModSwitch, E.HornLevel, E.DrumLevel, E.Spread, E.Depth, E.LeslieMix, E.Volume]],
  ];
  const MUL = [1, 3, 2, 4, 6, 8, 10, 12, 16], DEPTH_SMP = [0, 2, 4.5, 9, 2, 4.5, 9];
  const SIN = (() => { const t = new Float32Array(4097); for (let i = 0; i <= 4096; ++i) t[i] = Math.sin(2 * Math.PI * i / 4096); return t; })();
  const sinT = ph => { ph -= Math.floor(ph); const x = ph * 4096, i = x | 0, f = x - i; return SIN[i] + (SIN[i + 1] - SIN[i]) * f; };
  function tubeCurve(x, amt, agg) {
    if (amt <= 0.001) return x;
    const g = 1 + amt * (agg ? 28 : 9); let y = fastTanh(x * g);
    if (agg) { y += 0.25 * amt * Math.sin(x * g * 3) * (1 - Math.abs(y) * 0.5); y = clampf(y, -1.2, 1.2); }
    return y * (agg ? 0.45 : 0.6) / (1 + amt) * 1.6 * (1 + (g - 1) * 0.03);
  }
  const PS = [
    { bars: [8, 8, 8, 0, 0, 0, 0, 0, 0], perc: 1, harm: 1, decay: 0, vol: 0, click: .3, scan: 0, drive: .25, leslie: 1, speed: 1 },
    { bars: [8, 8, 8, 8, 8, 8, 8, 8, 8], perc: 0, harm: 0, decay: 0, vol: 0, click: .2, scan: 3, drive: .3, leslie: 1, speed: 2 },
    { bars: [8, 8, 8, 8, 0, 0, 0, 0, 0], perc: 0, harm: 0, decay: 0, vol: 0, click: .35, scan: 0, drive: .65, leslie: 1, speed: 1 },
    { bars: [0, 0, 8, 6, 4, 2, 0, 0, 0], perc: 0, harm: 0, decay: 0, vol: 0, click: .1, scan: 5, drive: .1, leslie: 1, speed: 1 },
    { bars: [0, 0, 8, 4, 0, 0, 0, 0, 0], perc: 0, harm: 0, decay: 0, vol: 0, click: .15, scan: 1, drive: .05, leslie: 1, speed: 1 },
    { bars: [8, 8, 8, 8, 6, 6, 4, 4, 3], perc: 0, harm: 0, decay: 0, vol: 0, click: .1, scan: 4, drive: .1, leslie: 1, speed: 1 },
    { bars: [0, 0, 8, 8, 8, 8, 8, 8, 8], perc: 0, harm: 0, decay: 0, vol: 0, click: .2, scan: 0, drive: .3, leslie: 1, speed: 2 },
    { bars: [8, 0, 8, 0, 0, 0, 0, 0, 0], perc: 0, harm: 0, decay: 0, vol: 0, click: .3, scan: 0, drive: .2, leslie: 0, speed: 1 },
    { bars: [6, 0, 8, 0, 4, 0, 2, 0, 1], perc: 0, harm: 0, decay: 0, vol: 0, click: 0, scan: 6, drive: 0, leslie: 1, speed: 1 },
    { bars: [0, 0, 8, 0, 0, 0, 0, 0, 0], perc: 0, harm: 1, decay: 0, vol: 0, click: .25, scan: 0, drive: .15, leslie: 1, speed: 1 },
  ];
  const mk = () => ({ tune: 0, ph: 0, amp: 0, clickEnv: 0, note: 60, gate: false, age: 0 });
  class Hammerica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); this.voice = Array.from({ length: 24 }, mk);
      this.hornDl = [new DelayLine(1024), new DelayLine(1024)]; this.drumDl = [new DelayLine(1024), new DelayLine(1024)]; this.vibDl = new DelayLine(2048);
      this.xo = new Svf(); this.tx = new Svf(); this.click = new Noise();
      this.hornHz = 0; this.drumHz = 0; this.aH = 0; this.aD = 0; this.vibPh = 0; this.held = 0; this.percEnv = 0; this.mod = 0; this.lp = 0;
    }
    set(id, x) { if (id < 0 || id >= E.Count) return; this.v[id] = x; if (id === E.Preset) this.loadPreset(Math.round(x)); }
    modWheel(m) { this.mod = m; } pitchBend() { } pressure() { }
    allNotesOff() { for (const v of this.voice) v.gate = false; this.held = 0; }
    percOn() { return this.v[E.Percussion] > 0.5; }
    noteOn(note) {
      let pick = -1; for (let i = 0; i < 24; ++i) if (this.voice[i].gate && this.voice[i].note === note) { pick = i; break; }
      if (pick < 0) for (let i = 0; i < 24; ++i) if (this.voice[i].amp <= 1e-4 && !this.voice[i].gate) { pick = i; break; }
      if (pick < 0) { let old = Infinity; for (let i = 0; i < 24; ++i) if (this.voice[i].age < old) { old = this.voice[i].age; pick = i; } }
      const v = this.voice[pick], fresh = !(v.gate && v.note === note);
      if (fresh) { v.ph = 0; v.amp = 0; v.clickEnv = 1; }
      v.note = note; v.tune = this.noteTune * 0.01; v.gate = true; v.age = ++this.counter;
      if (this.percOn() && this.held === 0) this.percEnv = 1;
      ++this.held;
    }
    noteOff(note) { for (const v of this.voice) if (v.gate && v.note === note) { v.gate = false; if (this.held > 0) --this.held; } }
    loadPreset(n) {
      const p = PS[clampf(n, 0, 9)], put = (id, x) => { this.v[id] = x; this.writeParam(id, x); };
      for (let b = 0; b < 9; ++b) put(E.Bar16 + b, p.bars[b]);
      put(E.Percussion, p.perc); put(E.PercHarm, p.harm); put(E.PercDecay, p.decay); put(E.PercVol, p.vol); put(E.KeyClick, p.click); put(E.Scanner, p.scan); put(E.Drive, p.drive); put(E.LeslieOn, p.leslie); put(E.Speed, p.speed);
    }
    process(outL, outR, n) {
      const V = this.v, sr = this.sr, vol = Math.pow(10, V[E.Volume] / 20), bar = new Array(9);
      for (let b = 0; b < 9; ++b) { const s = Math.round(V[E.Bar16 + b]); bar[b] = s <= 0 ? 0 : Math.pow(10, -(8 - s) * 3 / 20) * 0.22; }
      const perc = this.percOn(); if (perc) bar[8] = 0;
      const pm = V[E.PercHarm] > 0.5 ? 6 : 4, pDecay = Math.exp(-1 / ((V[E.PercDecay] > 0.5 ? 0.55 : 0.18) * sr / 4.6)), pAmp = (V[E.PercVol] > 0.5 ? 0.5 : 1) * 0.5;
      const relC = Math.exp(-1 / (0.012 * sr)), attC = 1 - Math.exp(-1 / (0.003 * sr)), clickAmt = V[E.KeyClick] * 0.35, clickC = Math.exp(-1 / (0.004 * sr));
      const scn = clampf(Math.round(V[E.Scanner]), 0, 6), vibDepth = DEPTH_SMP[scn] * (sr / 48000);
      const drive = 1 + V[E.Drive] * 9, toneHz = 1500 * Math.pow(8, V[E.Tone]), toneC = 1 - Math.exp(-2 * kPif * toneHz / sr);
      let spd = clampf(Math.round(V[E.Speed]), 0, 2); if (V[E.ModSwitch] > 0.5 && this.mod > 0.5 && spd > 0) spd = 3 - spd;
      const hornTarget = spd === 0 ? 0 : (spd === 1 ? 0.8 : 6.7), drumTarget = spd === 0 ? 0 : (spd === 1 ? 0.67 : 5.9);
      const upH = hornTarget > this.hornHz, upD = drumTarget > this.drumHz;
      const hC = 1 - Math.exp(-1 / ((upH ? 0.9 : 1.6) * sr)), dC = 1 - Math.exp(-1 / ((upD ? 3.0 : 4.5) * sr));
      const spread = V[E.Spread] * 1.5708, dep = V[E.Depth], tubeAgg = V[E.TubeMode] > 0.5, leslie = V[E.LeslieOn] > 0.5, mix = V[E.LeslieMix];
      this.xo.set(800, 0.7071, sr);
      const phi = [-spread, spread], hornAm = 0.75 * dep, drumAm = 0.4 * dep, hornR = 0.17 * sr / 343 * dep, drumR = 0.09 * sr / 343 * dep;
      const hm = [0, 0], dm = [0, 0];
      for (let i = 0; i < n; ++i) {
        let s = 0; const pe = this.percEnv; this.percEnv *= pDecay; if (this.percEnv < 1e-5) this.percEnv = 0;
        for (const v of this.voice) {
          if (!v.gate && v.amp <= 1e-5) { v.amp = 0; continue; }
          v.amp = v.gate ? v.amp + (1 - v.amp) * attC : v.amp * relC;
          const f16 = midiHz(v.note + v.tune) * 0.5; v.ph += f16 / sr; if (v.ph >= 1) v.ph -= Math.floor(v.ph);
          let x = 0;
          for (let b = 0; b < 9; ++b) if (bar[b] > 0 && f16 * MUL[b] < sr * 0.45) x += bar[b] * sinT(v.ph * MUL[b]);
          if (perc && pe > 0 && f16 * pm < sr * 0.45) x += pe * pAmp * sinT(v.ph * pm);
          if (v.clickEnv > 1e-4) { x += clickAmt * v.clickEnv * this.click.white() * 0.5; v.clickEnv *= clickC; }
          s += x * v.amp;
        }
        this.vibDl.push(s);
        if (scn > 0) { this.vibPh += 6.9 / sr; if (this.vibPh >= 1) this.vibPh -= 1; const d = 12 + vibDepth * (1 + Math.sin(PI2 * this.vibPh)), w = this.vibDl.read(d); s = scn >= 4 ? 0.5 * (s + w) : w; }
        s = fastTanh(s * drive) / drive * (1 + (drive - 1) * 0.3);
        this.lp += (s - this.lp) * Math.min(1, toneC); s = this.lp;
        if (V[E.TubeBass] > 0.001 || V[E.TubeTreble] > 0.001) {
          this.tx.set(V[E.TubeXover], 0.7071, sr); this.tx.run(s); const lo = this.tx.low, hi = s - lo;
          s = s + (tubeCurve(lo, V[E.TubeBass], tubeAgg) + tubeCurve(hi, V[E.TubeTreble], tubeAgg) - s) * V[E.TubeMix];
        }
        let L = s, R = s;
        if (leslie) {
          this.hornHz += (hornTarget - this.hornHz) * hC; this.drumHz += (drumTarget - this.drumHz) * dC;
          if (hornTarget === 0 && this.hornHz < 0.003) this.hornHz = 0; if (drumTarget === 0 && this.drumHz < 0.003) this.drumHz = 0;
          this.aH += this.hornHz / sr; if (this.aH >= 1) this.aH -= 1; this.aD -= this.drumHz / sr; if (this.aD < 0) this.aD += 1;
          this.xo.run(s); const low = this.xo.low, high = -this.xo.high, th = PI2 * this.aH, td = PI2 * this.aD;
          this.hornDl[0].push(high); this.hornDl[1].push(high); this.drumDl[0].push(low); this.drumDl[1].push(low);
          for (let m = 0; m < 2; ++m) {
            const ch = Math.cos(th - phi[m]), cd = Math.cos(td - phi[m]);
            hm[m] = this.hornDl[m].read(hornR * (1 - ch) + 3) * (1 - hornAm * 0.5 * (1 - ch));
            dm[m] = this.drumDl[m].read(drumR * (1 - cd) + 3) * (1 - drumAm * 0.5 * (1 - cd));
          }
          L = hm[0] * V[E.HornLevel] + dm[0] * V[E.DrumLevel]; R = hm[1] * V[E.HornLevel] + dm[1] * V[E.DrumLevel];
          L = s + (L - s) * mix; R = s + (R - s) * mix;
        }
        outL[i] = L * vol; outR[i] = R * vol;
      }
    }
  }
  OCC.engines.hammerica = { name: 'Hammerica', blurb: 'B-3 style tonewheel organ with nine drawbars, key click and a spinning Leslie speaker.', specs, groups, make: sr => new Hammerica(sr), E };
})();
/* Odyssica - ARP Odyssey meets Buchla west coast. Port of plugins/odyssica/odyssica.h */
(function () {
  const E = {}; ['Preset', 'Osc1Wave', 'PulseWidth', 'PwmAmount', 'Osc2Wave', 'Osc2Semi', 'Osc2Fine', 'Sync', 'FmAmount', 'Osc1Level', 'Osc2Level', 'RingLevel', 'NoiseLevel',
    'Fold', 'FoldSym', 'FoldEnv', 'Mode', 'HpCutoff', 'Cutoff', 'Resonance', 'Poles', 'KeyTrack', 'FilterEnv', 'AAtt', 'ADec', 'ASus', 'ARel', 'MAtt', 'MDec', 'MSus', 'MRel',
    'LfoRate', 'LfoShape', 'LfoPitch', 'LfoFilter', 'LfoFold', 'RandRate', 'RandPitch', 'RandFilter', 'RandFold', 'RandSmooth', 'Glide', 'Drift', 'Velocity', 'Spread', 'BendRange', 'Volume', 'Count'].forEach((n, i) => E[n] = i);
  const wv = ['Saw', 'Pulse', 'Triangle', 'Sine'];
  const specs = [
    P('Preset', '', 0, 10, 10, '%.0f', false, ['Glass pluck (LPG)', 'Sync lead', 'Ring bell', 'Fold bass', 'Random bubbles', 'PWM pad', 'FM clang', 'Slow gate pad', 'Noise tick', 'Odyssey brass', 'Init']),
    P('Osc 1 wave', '', 0, 3, 0, '%.0f', false, wv), P('Pulse width', '', 0.05, 0.95, 0.5), P('PWM (LFO)', '', 0, 1, 0),
    P('Osc 2 wave', '', 0, 3, 0, '%.0f', false, wv), P('Osc 2 pitch', 'st', -24, 24, 0, '%.0f st'), P('Osc 2 fine', 'cents', -50, 50, 7, '%.0f c'),
    P('Hard sync', '', 0, 1, 0, '%.0f', false, ['Off', 'Osc 2 synced to Osc 1']), P('FM 2>1', '', 0, 1, 0),
    P('Osc 1 level', '', 0, 1, 0.8), P('Osc 2 level', '', 0, 1, 0.6), P('Ring mod level', '', 0, 1, 0), P('Noise level', '', 0, 1, 0),
    P('Fold', '', 0, 1, 0), P('Fold symmetry', '', -1, 1, 0), P('Fold env', '', -1, 1, 0),
    P('Voice', '', 0, 2, 0, '%.0f', false, ['Filter + VCA', 'Low-pass gate', 'Filter + gate']),
    P('HP cutoff', 'Hz', 20, 8000, 20, '%.0f Hz', true), P('LP cutoff', 'Hz', 40, 16000, 4000, '%.0f Hz', true), P('Resonance', '', 0, 1, 0.15),
    P('LP poles', '', 0, 1, 1, '%.0f', false, ['2-pole', '4-pole']), P('Key track', '', 0, 1, 0.5), P('Filter env', '', -1, 1, 0.4),
    P('Amp attack', 's', 0.001, 8, 0.005, '%.3f s', true), P('Amp decay', 's', 0.005, 8, 0.4, '%.3f s', true), P('Amp sustain', '', 0, 1, 0.8), P('Amp release', 's', 0.005, 10, 0.3, '%.3f s', true),
    P('Mod attack', 's', 0.001, 8, 0.003, '%.3f s', true), P('Mod decay', 's', 0.005, 8, 0.45, '%.3f s', true), P('Mod sustain', '', 0, 1, 0.2), P('Mod release', 's', 0.005, 10, 0.3, '%.3f s', true),
    P('LFO rate', 'Hz', 0.05, 30, 5, '%.2f Hz', true), P('LFO shape', '', 0, 3, 0, '%.0f', false, ['Sine', 'Triangle', 'Saw', 'Square']),
    P('LFO > pitch', 'st', 0, 12, 0, '%.1f st'), P('LFO > filter', '', 0, 1, 0), P('LFO > fold', '', 0, 1, 0),
    P('Random rate', 'Hz', 0.1, 40, 6, '%.1f Hz', true), P('Random > pitch', 'st', 0, 24, 0, '%.1f st'), P('Random > filter', '', 0, 1, 0), P('Random > fold', '', 0, 1, 0), P('Random smooth', '', 0, 1, 0),
    P('Glide', 's', 0, 2, 0, '%.2f s'), P('Drift', '', 0, 1, 0.15), P('Velocity', '', 0, 1, 0.5), P('Spread', '', 0, 1, 0.4), P('Bend range', 'st', 0, 24, 2, '%.0f st'), P('Volume', 'dB', -24, 6, -7, '%.1f dB'),
  ];
  const groups = [
    ['Oscillators', [E.Osc1Wave, E.PulseWidth, E.PwmAmount, E.Osc2Wave, E.Osc2Semi, E.Osc2Fine, E.Sync, E.FmAmount]],
    ['Mixer', [E.Osc1Level, E.Osc2Level, E.RingLevel, E.NoiseLevel]],
    ['Wavefolder', [E.Fold, E.FoldSym, E.FoldEnv]],
    ['Filter', [E.Mode, E.HpCutoff, E.Cutoff, E.Resonance, E.Poles, E.KeyTrack, E.FilterEnv]],
    ['Amp envelope', [E.AAtt, E.ADec, E.ASus, E.ARel]], ['Mod envelope', [E.MAtt, E.MDec, E.MSus, E.MRel]],
    ['LFO', [E.LfoRate, E.LfoShape, E.LfoPitch, E.LfoFilter, E.LfoFold]], ['Random', [E.RandRate, E.RandPitch, E.RandFilter, E.RandFold, E.RandSmooth]],
    ['Play', [E.Glide, E.Drift, E.Velocity, E.Spread, E.BendRange, E.Volume]],
  ];
  const mk = () => ({ o1: new Osc(), o2: new Osc(), ae: new Adsr(), me: new Adsr(), hp: new Svf(), lp: new Svf(), lad: new Ladder(), noise: new Noise(), cur: 60, target: 60, vel: 1, drift: 0, pan: 0, c: 0, g: 0, z: 0, note: 60, gate: false, age: 0 });
  const fold = x => Math.sin(x * 1.5707963);
  function wave(o, w, dt, pw) { switch (w) { case 0: return o.saw(dt) * 0.8; case 1: return (o.square(dt, pw) - (2 * pw - 1)) * 0.7; case 2: return o.tri(); default: return o.sine(); } }
  const PS = [
    { Osc1Wave: 3, Osc2Wave: 3, Osc2Semi: 12, Osc2Fine: 0, Osc1Level: .9, Osc2Level: .35, Fold: .35, FoldEnv: .5, Mode: 1, MDec: .35, MSus: 0, MRel: .25, ASus: 0, Cutoff: 9000 },
    { Osc1Wave: 0, Osc2Wave: 0, Osc2Semi: 7, Osc2Fine: 0, Sync: 1, Osc2Level: 0, Osc1Level: .8, Cutoff: 5200, Resonance: .25, FilterEnv: .3, ASus: 1, Glide: .07, LfoPitch: .25, LfoRate: 5.5, MDec: 1, MSus: .7, Spread: .15 },
    { Osc1Wave: 3, Osc2Wave: 3, Osc2Semi: 7, Osc2Fine: 14, Osc1Level: .2, Osc2Level: 0, RingLevel: .9, Mode: 1, MDec: 1.4, MSus: 0, MRel: .6, ASus: 0, Cutoff: 9000 },
    { Osc1Wave: 3, Osc2Wave: 2, Osc2Semi: -12, Osc2Fine: 0, Osc1Level: .9, Osc2Level: .4, Fold: .2, FoldEnv: .55, Cutoff: 1800, Poles: 1, FilterEnv: .3, MDec: .25, MSus: .1, ASus: .9, ARel: .1 },
    { Osc1Wave: 2, Osc2Wave: 3, Osc2Semi: 12, Osc2Fine: 0, FmAmount: .25, RandRate: 9, RandPitch: 5, RandFilter: .45, RandFold: .3, Fold: .2, Cutoff: 3000, ASus: 1, RandSmooth: 0, Mode: 0, Spread: .8 },
    { Osc1Wave: 1, Osc2Wave: 1, Osc2Semi: 0, Osc2Fine: 9, PulseWidth: .4, PwmAmount: .8, LfoRate: .35, LfoShape: 1, Cutoff: 2400, Resonance: .1, FilterEnv: .2, AAtt: .6, ASus: 1, ARel: 1.2, MAtt: .8, MDec: 1.5, MSus: .6, Spread: .9 },
    { Osc1Wave: 3, Osc2Wave: 3, Osc2Semi: 19, Osc2Fine: 3, FmAmount: .7, Osc1Level: .9, Osc2Level: 0, Fold: .3, Mode: 1, MDec: .8, MSus: 0, MRel: .5, ASus: 0, Cutoff: 9000 },
    { Osc1Wave: 0, Osc2Wave: 2, Osc2Semi: 0, Osc2Fine: 8, Mode: 1, MAtt: .9, MDec: 2.5, MSus: .55, MRel: 2, ASus: 1, Cutoff: 9000, LfoRate: .2, LfoFold: .4, Fold: .15, Spread: .9 },
    { Osc1Level: 0, Osc2Level: 0, NoiseLevel: .9, Mode: 1, MDec: .12, MSus: 0, MRel: .1, ASus: 0, HpCutoff: 300, Cutoff: 9000 },
    { Osc1Wave: 0, Osc2Wave: 1, Osc2Semi: 0, Osc2Fine: 6, PulseWidth: .35, HpCutoff: 120, Cutoff: 1100, Resonance: .2, Poles: 0, FilterEnv: .65, MAtt: .07, MDec: .5, MSus: .5, AAtt: .04, ASus: .9, ARel: .25, Spread: .3 },
    {},
  ];
  class Odyssica extends EngineBase {
    constructor(sr) { super(sr); this.initParams(specs); this.voice = Array.from({ length: 8 }, mk); this.voice.forEach(v => { v.ae.setSr(sr); v.me.setSr(sr); }); this.lfo = new Lfo(); this.rnd = new Noise(); this.randTarget = 0; this.randCur = 0; this.randPh = 0; this.bend = this.mod = this.press = 0; this.lastNote = -1; this.configure(); }
    set(id, x) { if (id < 0 || id >= E.Count) return; this.v[id] = x; if (id === E.Preset) { this.loadPreset(Math.round(x)); return; } this.configure(); }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.mod = m; } pressure(p) { this.press = p; }
    allNotesOff() { for (const v of this.voice) { v.gate = false; v.ae.gateOff(); v.me.gateOff(); } }
    active(v) { return this.v[E.Mode] < 0.5 ? v.ae.active() : (v.me.active() || v.c > 2e-4); }
    configure() { const V = this.v; for (const v of this.voice) { v.ae.set(V[E.AAtt], V[E.ADec], V[E.ASus], V[E.ARel]); v.me.set(V[E.MAtt], V[E.MDec], V[E.MSus], V[E.MRel]); } }
    noteOn(note, vel) {
      const V = this.v; let pick = -1; for (let i = 0; i < 8; ++i) if (!this.active(this.voice[i])) { pick = i; break; }
      if (pick < 0) { let old = Infinity; for (let i = 0; i < 8; ++i) if (this.voice[i].age < old) { old = this.voice[i].age; pick = i; } }
      const start = this.voice[pick].c, v = mk(); v.c = start; this.voice[pick] = v; v.ae.setSr(this.sr); v.me.setSr(this.sr);
      v.note = note; v.target = note + this.noteTune * 0.01; v.cur = V[E.Glide] > 0.001 && this.lastNote >= 0 ? this.lastNote : note + this.noteTune * 0.01; v.vel = vel; v.gate = true; v.age = ++this.counter;
      v.drift = this.rnd.white() * V[E.Drift] * 0.25; v.pan = clampf((note - 60) / 36, -1, 1) * V[E.Spread] * 0.5;
      v.ae.set(V[E.AAtt], V[E.ADec], V[E.ASus], V[E.ARel]); v.me.set(V[E.MAtt], V[E.MDec], V[E.MSus], V[E.MRel]); v.ae.gateOn(true); v.me.gateOn(true); this.lastNote = note;
    }
    noteOff(note) { for (const v of this.voice) if (v.gate && v.note === note) { v.gate = false; v.ae.gateOff(); v.me.gateOff(); } }
    loadPreset(n) {
      const nv = specs.map(s => s.def), o = PS[clampf(n, 0, 10)]; for (const k in o) nv[E[k]] = o[k];
      for (let i = 1; i < E.Count; ++i) { this.v[i] = nv[i]; this.writeParam(i, nv[i]); } this.configure();
    }
    process(outL, outR, n) {
      const V = this.v, sr = this.sr, vol = Math.pow(10, V[E.Volume] / 20), bendSt = this.bend * V[E.BendRange];
      const mode = clampf(Math.round(V[E.Mode]), 0, 2), w1 = Math.round(V[E.Osc1Wave]), w2 = Math.round(V[E.Osc2Wave]), four = V[E.Poles] > 0.5, sync = V[E.Sync] > 0.5;
      const semi2 = V[E.Osc2Semi] + V[E.Osc2Fine] * 0.01, glideC = V[E.Glide] <= 0.001 ? 1 : 1 - Math.exp(-1 / (V[E.Glide] * 0.3 * sr));
      const smoothC = 1 - Math.exp(-1 / ((0.0005 + V[E.RandSmooth] * 0.25) * sr)), modAmt = this.mod, lshape = clampf(Math.round(V[E.LfoShape]), 0, 3);
      for (let i = 0; i < n; ++i) {
        const lfo = this.lfo.next(V[E.LfoRate], sr, lshape);
        this.randPh += V[E.RandRate] / sr; if (this.randPh >= 1) { this.randPh -= 1; this.randTarget = this.rnd.white(); }
        this.randCur += (this.randTarget - this.randCur) * smoothC;
        const lfoP = lfo * (V[E.LfoPitch] + modAmt * 0.5), lfoF = lfo * (V[E.LfoFilter] + modAmt * 0.4); let L = 0, R = 0;
        for (const v of this.voice) {
          if (!this.active(v)) continue;
          v.cur += (v.target - v.cur) * glideC;
          const base = v.cur + bendSt + lfoP + this.randCur * V[E.RandPitch] + v.drift, f1 = midiHz(base), f2 = midiHz(base + semi2);
          const dt2 = Math.min(0.45, f2 / sr), s2 = wave(v.o2, w2, dt2, 0.5), fmMul = V[E.FmAmount] > 0 ? Math.pow(2, V[E.FmAmount] * 2.5 * s2) : 1;
          const dt1 = Math.min(0.45, f1 * fmMul / sr), pw = clampf(V[E.PulseWidth] + V[E.PwmAmount] * 0.4 * lfo, 0.05, 0.95), s1 = wave(v.o1, w1, dt1, pw);
          v.o1.advance(dt1); v.o2.advance(dt2); if (sync && v.o1.wrapped) v.o2.ph = 0;
          let x = s1 * V[E.Osc1Level] + s2 * V[E.Osc2Level] + s1 * s2 * V[E.RingLevel] * 1.6 + v.noise.white() * V[E.NoiseLevel] * 0.7;
          const me = v.me.next(), ae = v.ae.next(), vsc = 1 - V[E.Velocity] + V[E.Velocity] * v.vel;
          let fa = V[E.Fold] + V[E.FoldEnv] * me + lfo * V[E.LfoFold] * 0.5 + this.randCur * V[E.RandFold] * 0.5 + this.press * 0.25;
          fa = clampf(fa * (0.6 + 0.4 * vsc), 0, 1);
          if (fa > 0.001 || V[E.FoldSym] !== 0) x = fold(x * (1 + fa * 6) + V[E.FoldSym] * fa * 0.8);
          const kt = V[E.KeyTrack] * (v.cur - 60) / 12, oct = V[E.FilterEnv] * 5 * me + kt + lfoF * 3 + this.randCur * V[E.RandFilter] * 3 + this.press * 0.8;
          let y = x;
          if (V[E.HpCutoff] > 21) { v.hp.set(V[E.HpCutoff], 0.7, sr); v.hp.run(y); y = v.hp.high; }
          if (mode !== 1) {
            if (four) { v.lad.set(V[E.Cutoff] * Math.pow(2, oct), V[E.Resonance], sr, 1); y = v.lad.run(y * 0.8) * 1.15; }
            else { v.lp.set(V[E.Cutoff] * Math.pow(2, oct), 0.55 + V[E.Resonance] * 9, sr); y = v.lp.run(y); }
          }
          if (mode === 0) y *= ae * (0.45 + 0.55 * vsc);
          else {
            const target = me * (0.45 + 0.55 * vsc), rate = target > v.c ? 1 - Math.exp(-1 / (0.0012 * sr)) : 1 - Math.exp(-1 / ((0.012 + 0.09 * (1 - v.c)) * sr));
            v.c += (target - v.c) * rate; const hz = 70 * Math.pow(2, v.c * 8); v.g = 1 - Math.exp(-PI2 * Math.min(hz, sr * 0.45) / sr);
            v.z += (y - v.z) * v.g; y = v.z * Math.pow(v.c, 1.2) * 1.6;
          }
          L += y * Math.sqrt(0.5 - v.pan); R += y * Math.sqrt(0.5 + v.pan);
        }
        outL[i] = fastTanh(L * 0.8) * 1.1 * vol; outR[i] = fastTanh(R * 0.8) * 1.1 * vol;
      }
    }
  }
  OCC.engines.odyssica = { name: 'Odyssica', blurb: 'Eight-voice synth mixing the ARP Odyssey (sync, ring mod) with west-coast wavefolding and a low-pass gate.', specs, groups, make: sr => new Odyssica(sr), E };
})();
/* Kormica - Korg M3-style workstation voice with A/B programs. Port of plugins/kormica + common/wtvoice.h */
(function () {
  const kSize = 2048, kMask = 2047, kMips = 9, kMaxH = 384, kWaves = 24;
  const WNAMES = ['Sine', 'Saw', 'Square', 'Triangle', 'Pulse 25%', 'Drawbar organ', 'E.Piano', 'Clav', 'Bell', 'Vocal Ah', 'Vocal Oo', 'Vocal Ee', 'Brass', 'Strings', 'Flute', 'Clarinet', 'Digital', 'Glass', 'Synth bass', 'Metallic', 'Choir', 'Sync sweep', 'Warm pad', 'Even'];
  let TAB = null;
  const formant = (h, c, w) => { const d = (h - c) / w; return Math.exp(-d * d); };
  function recipe(w, a, p) {
    a.fill(0); p.fill(0); let seed = (12345 + w * 977) >>> 0; const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed >>> 8) / 16777216; };
    const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; ++i) if (n % i === 0) return false; return true; };
    const PI = Math.PI;
    for (let h = 1; h <= kMaxH; ++h) {
      const x = h; let v = 0, ph = 0;
      switch (w) {
        case 0: v = h === 1 ? 1 : 0; break;
        case 1: v = 1 / x; break;
        case 2: v = (h & 1) ? 1 / x : 0; break;
        case 3: v = (h & 1) ? 1 / (x * x) : 0; ph = ((h >> 1) & 1) ? PI : 0; break;
        case 4: v = Math.abs(Math.sin(PI * x * 0.25)) / x; ph = 0.5 * PI * x * 0.25; break;
        case 5: { const d = [0, 1, .8, .7, .5, 0, .4, 0, .3]; v = h < 9 ? d[h] : 0; break; }
        case 6: { const d = [0, 1, .55, .3, .18, .08, .05, .13, .04]; v = h < 9 ? d[h] : 0; break; }
        case 7: v = h <= 24 ? Math.pow(x, -0.65) * (0.25 + 0.75 * Math.abs(Math.sin(PI * x * 0.21))) : 0; break;
        case 8: { const d = [0, 1, .25, .8, .1, .6, .15, .5, .08, .35, .05, .25]; v = h < 12 ? d[h] : (h < 24 ? 0.12 / (x - 10) : 0); break; }
        case 9: v = formant(x, 5.4, 1.6) * 1 + formant(x, 8.5, 2.2) * 0.6 + formant(x, 1, 0.6) * 0.4; v /= Math.pow(x, 0.3); break;
        case 10: v = formant(x, 2.3, 1) * 1 + formant(x, 6.7, 1.8) * 0.3 + formant(x, 1, 0.5) * 0.5; break;
        case 11: v = formant(x, 2.1, 0.9) * 0.9 + formant(x, 17.7, 3.5) * 0.35 + formant(x, 1, 0.5) * 0.4; break;
        case 12: v = Math.pow(x, -0.75) * (0.4 + 1.6 * formant(x, 4, 3)); break;
        case 13: v = Math.pow(x, -1.05); ph = 0.4 * Math.sin(x * 1.7); break;
        case 14: { const d = [0, 1, .22, .08, .03, .01]; v = h < 6 ? d[h] : 0; break; }
        case 15: v = (h & 1) ? Math.pow(x, -0.9) : (h < 12 ? 0.04 / x : 0); break;
        case 16: v = h <= 32 ? (0.2 + 0.8 * rnd()) / Math.sqrt(x) : 0; ph = rnd() * 2 * PI; break;
        case 17: v = (h % 2 === 1 && h % 3 !== 0 && h <= 40) ? 1 / Math.sqrt(x) : 0; break;
        case 18: { const d = [0, 1, .7, .45, .25, .12, .06]; v = h < 7 ? d[h] : 0; break; }
        case 19: v = (isPrime(h) && h <= 60) ? 1 / Math.pow(x, 0.4) : (h === 1 ? 1 : 0); break;
        case 20: v = (formant(x, 5, 2.2) + formant(x, 9, 3) * 0.5 + formant(x, 1, 0.7) * 0.5) / Math.pow(x, 0.25); ph = rnd() * 2 * PI; break;
        case 21: v = h <= 40 ? (1 / x) * (0.15 + formant(x, 9, 3.5)) : 0; break;
        case 22: v = h <= 12 ? 1 / (x * x) : (h <= 40 ? 0.02 / x : 0); break;
        default: v = (h % 2 === 0) ? 1 / x : (h === 1 ? 0.5 : 0);
      }
      a[h] = v; p[h] = ph;
    }
  }
  function buildBank() {
    if (TAB) return TAB; TAB = new Float32Array(kWaves * kMips * kSize); const amp = new Float64Array(kMaxH + 1), ph = new Float64Array(kMaxH + 1);
    for (let w = 0; w < kWaves; ++w) {
      recipe(w, amp, ph); const acc = new Float64Array(kSize); let done = 0;
      for (let m = kMips - 1; m >= 0; --m) {
        const H = kMaxH >> m;
        for (let h = done + 1; h <= H; ++h) {
          if (amp[h] === 0) continue; const dw = 2 * Math.PI * h / kSize; let c = Math.cos(ph[h]), s = Math.sin(ph[h]); const cd = Math.cos(dw), sd = Math.sin(dw), A = amp[h];
          for (let n = 0; n < kSize; ++n) { acc[n] += A * s; const ns = s * cd + c * sd; c = c * cd - s * sd; s = ns; }
        }
        done = H; const off = (w * kMips + m) * kSize; for (let n = 0; n < kSize; ++n) TAB[off + n] = acc[n];
      }
      const o0 = (w * kMips) * kSize; let e = 0; for (let n = 0; n < kSize; ++n) e += TAB[o0 + n] * TAB[o0 + n];
      const rms = Math.sqrt(e / kSize), k = rms > 1e-9 ? 0.32 / rms : 1;
      for (let m = 0; m < kMips; ++m) { const off = (w * kMips + m) * kSize; for (let n = 0; n < kSize; ++n) TAB[off + n] *= k; }
    }
    return TAB;
  }
  const mipFor = dt => { const allowed = 0.45 / Math.max(1e-6, dt); let m = 0; while (m < kMips - 1 && (kMaxH >> m) > allowed) ++m; return m; };
  function wtRead(w, m, ph) {
    const o = (w * kMips + m) * kSize, x = ph * kSize, i = Math.floor(x), f = x - i;
    const y0 = TAB[o + ((i - 1) & kMask)], y1 = TAB[o + (i & kMask)], y2 = TAB[o + ((i + 1) & kMask)], y3 = TAB[o + ((i + 2) & kMask)];
    return y1 + 0.5 * f * (y2 - y0 + f * (2 * y0 - 5 * y1 + 4 * y2 - y3 + f * (3 * (y1 - y2) + y3 - y0)));
  }
  const kUni = 7;
  const mkPatch = () => ({ w1: 1, w2: 1, mix2: 0, semi2: 0, det2: 7, oct: 0, uni: 1, uniDet: 14, uniSpread: 0.7, ftype: 0, cut: 8000, res: 0.15, envAmt: 0, kt: 0.5, a: 0.005, d: 0.3, s: 0.8, r: 0.3, fd: 0.4, fs: 0.2, noise: 0, noiseDec: 0.03, lfoP: 0, lfoF: 0, velAmp: 0.5, velFilt: 0.3, level: 1, pan: 0 });
  class WtVoice {
    constructor() { this.ae = new Adsr(); this.fe = new Adsr(); this.sv = [new Svf(), new Svf()]; this.svR = [new Svf(), new Svf()]; this.noise = new Noise(); this.ph = new Float64Array(2 * kUni); this.note_ = 60; this.tune = 0; this.vel = 1; this.ne = 0; this.gate_ = false; this.age = 0; }
    start(p, note, vel, sr, tuneCents) {
      this.tune = tuneCents * 0.01; this.note_ = note; this.vel = vel; this.gate_ = true; this.ae.setSr(sr); this.fe.setSr(sr);
      this.ae.set(p.a, p.d, p.s, p.r); this.fe.set(0.001, p.fd, p.fs, p.r); this.ae.gateOn(true); this.fe.gateOn(true);
      this.sv[0].reset(); this.sv[1].reset(); this.svR[0].reset(); this.svR[1].reset(); this.ne = 1;
      let s = (Math.imul(note, 2654435761) + 0x9E3779B9) >>> 0; for (let i = 0; i < 2 * kUni; ++i) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; this.ph[i] = (s >>> 8) / 16777216; }
      this.noise.s = (s | 1) >>> 0;
    }
    release() { this.gate_ = false; this.ae.gateOff(); this.fe.gateOff(); }
    kill() { this.gate_ = false; this.ae.kill(); this.fe.kill(); }
    retime(p) { this.ae.set(p.a, p.d, p.s, p.r); this.fe.set(0.001, p.fd, p.fs, p.r); }
    active() { return this.ae.active(); }
    render(p, sr, lfo, bendSt, out) {
      const base = this.note_ + this.tune + p.oct * 12 + bendSt + p.lfoP * lfo, f1 = midiHz(base), f2 = midiHz(base + p.semi2 + p.det2 * 0.01);
      const U = clampf(p.uni, 1, kUni), dt1 = Math.min(0.45, f1 / sr), dt2 = Math.min(0.45, f2 / sr), m1 = mipFor(dt1 * (U > 1 ? 1.01 : 1)), m2 = mipFor(dt2 * (U > 1 ? 1.01 : 1));
      let sl = 0, srr = 0; const two = p.mix2 > 0.001, ph = this.ph;
      for (let u = 0; u < U; ++u) {
        const pos = U > 1 ? (u / (U - 1)) * 2 - 1 : 0, k = Math.pow(2, pos * p.uniDet / 1200);
        let x = wtRead(p.w1, m1, ph[u]); ph[u] += dt1 * k; if (ph[u] >= 1) ph[u] -= 1;
        if (two) { x = x * (1 - 0.5 * p.mix2) + wtRead(p.w2, m2, ph[kUni + u]) * p.mix2; ph[kUni + u] += dt2 * k; if (ph[kUni + u] >= 1) ph[kUni + u] -= 1; }
        const sp = pos * p.uniSpread, gl = Math.sqrt(0.5 * (1 - sp)), gr = Math.sqrt(0.5 * (1 + sp)); sl += x * gl; srr += x * gr;
      }
      const norm = 1 / Math.sqrt(U); sl *= norm; srr *= norm;
      if (p.noise > 0) { const n = this.noise.white() * p.noise * this.ne; this.ne *= Math.exp(-1 / (Math.max(0.002, p.noiseDec) * sr)); sl += n; srr += n; }
      const fe = this.fe.next(), ae = this.ae.next();
      if (p.ftype !== 4) {
        const oct = p.envAmt * 5 * fe + p.kt * (this.note_ - 60) / 12 + p.lfoF * lfo + p.velFilt * (this.vel - 0.5) * 2, hz = p.cut * Math.pow(2, oct), q = 0.55 + p.res * 8, s0 = this.sv[0];
        s0.set(hz, q, sr); for (const o of [this.sv[1], this.svR[0], this.svR[1]]) { o.a1 = s0.a1; o.a2 = s0.a2; o.a3 = s0.a3; o.k = s0.k; }
        const run = (a, b, x) => { a.run(x); switch (p.ftype) { case 0: return a.low; case 1: b.run(a.low); return b.low; case 2: return a.high; default: return a.band * (0.8 + p.res); } };
        sl = run(this.sv[0], this.sv[1], sl); srr = run(this.svR[0], this.svR[1], srr);
      }
      const g = ae * (1 - p.velAmp + p.velAmp * this.vel) * p.level, pl = Math.sqrt(0.5 * (1 - p.pan)), pr = Math.sqrt(0.5 * (1 + p.pan));
      out[0] += sl * g * pl * 1.414; out[1] += srr * g * pr * 1.414;
    }
  }
  /* parameters */
  const Prm = ['W1', 'W2', 'Mix', 'Semi', 'Detune', 'Oct', 'FType', 'Cut', 'Res', 'Env', 'Key', 'Att', 'Dec', 'Sus', 'Rel', 'FDec', 'FSus', 'Noise', 'LfoP', 'LfoF', 'Level', 'Pan'], PN = 22;
  const E = { Preset: 0, Mode: 1, SplitNote: 2, VelThresh: 3, LayerBal: 4, LfoRate: 5, Chorus: 6, BendRange: 7, Volume: 8, PA: 9 }; E.PB = E.PA + PN; E.Count = E.PA + 2 * PN; Prm.forEach((n, i) => E[n] = i);
  const specs = [
    P('Preset', '', 0, 15, 15, '%.0f', false, ['Grand piano', 'Bright piano', 'Warm E.Piano', 'Drawbar organ', 'Vocal pad', 'String ensemble', 'Brass', 'Clav', 'Bell', 'Synth bass', 'Digital lead', 'Glass pad', 'Strings + Brass (Layer)', 'Bass / Piano (Split)', 'Soft pad / Hard bell (Vel)', 'Init']),
    P('Mode', '', 0, 3, 0, '%.0f', false, ['Single (A)', 'Layer (A+B)', 'Split (A low, B high)', 'Velocity switch (A soft, B hard)']),
    P('Split note', '', 24, 96, 60, '%.0f'), P('Velocity threshold', '', 1, 127, 80, '%.0f'), P('Layer balance', '', -1, 1, 0),
    P('LFO rate', 'Hz', 0.1, 20, 5, '%.1f Hz', true), P('Chorus', '', 0, 1, 0), P('Bend range', 'st', 0, 24, 2, '%.0f st'), P('Volume', 'dB', -24, 6, -6, '%.1f dB'),
  ];
  for (let pg = 0; pg < 2; ++pg) {
    const pre = pg === 0 ? 'A ' : 'B ';
    specs.push(P(pre + 'wave 1', '', 0, 23, 1, '%.0f', false, WNAMES), P(pre + 'wave 2', '', 0, 23, 1, '%.0f', false, WNAMES), P(pre + 'wave 2 mix', '', 0, 1, 0), P(pre + 'wave 2 interval', 'st', -24, 24, 0, '%.0f st'), P(pre + 'detune', 'cents', -50, 50, 7, '%.0f c'),
      P(pre + 'octave', '', -2, 2, 0, '%.0f'), P(pre + 'filter', '', 0, 4, 0, '%.0f', false, ['Low-pass 12', 'Low-pass 24', 'High-pass', 'Band-pass', 'Off']),
      P(pre + 'cutoff', 'Hz', 40, 16000, 8000, '%.0f Hz', true), P(pre + 'resonance', '', 0, 1, 0.15), P(pre + 'filter env', '', -1, 1, 0), P(pre + 'key track', '', 0, 1, 0.5),
      P(pre + 'attack', 's', 0.001, 8, 0.005, '%.3f s', true), P(pre + 'decay', 's', 0.005, 10, 0.3, '%.3f s', true), P(pre + 'sustain', '', 0, 1, 0.8), P(pre + 'release', 's', 0.005, 10, 0.3, '%.3f s', true),
      P(pre + 'filter decay', 's', 0.005, 10, 0.4, '%.3f s', true), P(pre + 'filter sustain', '', 0, 1, 0.2), P(pre + 'noise', '', 0, 1, 0), P(pre + 'LFO > pitch', 'st', 0, 4, 0, '%.2f st'), P(pre + 'LFO > filter', 'oct', 0, 3, 0),
      P(pre + 'level', '', 0, 1, pg === 0 ? 1 : 0.8), P(pre + 'pan', '', -1, 1, 0));
  }
  const grp = (title, base) => [title, [E.W1, E.W2, E.Mix, E.Semi, E.Detune, E.Oct, E.FType, E.Cut, E.Res, E.Env, E.Key, E.Att, E.Dec, E.Sus, E.Rel, E.FDec, E.FSus, E.Noise, E.LfoP, E.LfoF, E.Level, E.Pan].map(i => base + i)];
  const groups = [['Performance', [E.Mode, E.SplitNote, E.VelThresh, E.LayerBal, E.LfoRate, E.Chorus, E.BendRange, E.Volume]], grp('Program A', E.PA), grp('Program B', E.PB)];
  const Pa = (w1, w2, mix, semi, det, oct, ft, cut, res, env, key, a, d, s, r, fd, fs, noise, lp, lf, level, pan) => [w1, w2, mix, semi, det, oct, ft, cut, res, env, key, a, d, s, r, fd, fs, noise, lp, lf, level, pan];
  const piano = Pa(6, 3, .3, 0, 6, 0, 1, 5500, .1, .45, .7, .002, 3, 0, .4, .6, .1, .04, 0, 0, 1, 0), bass = Pa(18, 1, .3, -12, 4, -1, 1, 900, .3, .6, .4, .002, .35, .5, .1, .25, .1, 0, 0, 0, 1, 0), bell = Pa(8, 0, .4, 19, 0, 0, 4, 8000, 0, 0, 0, .001, 4, 0, 1.2, .1, 1, .04, 0, 0, 1, 0);
  const strings = Pa(13, 13, .6, 0, 11, 0, 0, 5000, .1, .2, .5, .5, 1, .9, .8, 1.2, .7, 0, .1, 0, 1, 0), brass = Pa(12, 1, .3, 0, 6, 0, 1, 1800, .15, .6, .6, .05, .4, .8, .2, .5, .5, 0, 0, 0, 1, 0), pad = Pa(22, 13, .4, 0, 8, 0, 0, 2800, .15, .25, .4, .9, 1.5, .9, 1.4, 1.5, .6, 0, .05, 0, 1, 0);
  const init = Pa(1, 1, 0, 0, 7, 0, 0, 8000, .15, 0, .5, .005, .3, .8, .3, .4, .2, 0, 0, 0, 1, 0);
  const PRS = [
    [piano, init, 0, 60, 80, .1], [Pa(6, 5, .25, 12, 5, 0, 1, 9000, .1, .35, .8, .002, 2.2, 0, .3, .4, .2, .06, 0, 0, 1, 0), init, 0, 60, 80, .1],
    [Pa(6, 0, .4, 12, 3, 0, 0, 3500, .1, .3, .6, .003, 2, 0, .35, .7, .1, .02, 0, 0, 1, 0), init, 0, 60, 80, .4], [Pa(5, 5, .5, 12, 0, 0, 4, 8000, 0, 0, 0, .004, .1, 1, .08, .1, 1, 0, 0, 0, 1, 0), init, 0, 60, 80, .3],
    [Pa(9, 20, .5, 0, 9, 0, 0, 3000, .2, .2, .4, .8, 1, .9, 1.2, 1.5, .6, 0, .12, 0, 1, 0), init, 0, 60, 80, .5], [strings, init, 0, 60, 80, .6], [brass, init, 0, 60, 80, .15],
    [Pa(7, 2, .2, 0, 3, 0, 0, 4500, .2, .4, .7, .001, .4, .1, .1, .3, .1, .02, 0, 0, 1, 0), init, 0, 60, 80, 0], [bell, init, 0, 60, 80, .3], [bass, init, 0, 60, 80, 0],
    [Pa(16, 21, .4, 0, 8, 0, 0, 4500, .25, .35, .5, .01, .5, .8, .25, .7, .5, 0, .1, 0, 1, 0), init, 0, 60, 80, .35], [Pa(17, 22, .5, 12, 6, 0, 0, 5000, .15, .15, .4, .9, 1, .9, 1.5, 2, .7, 0, .05, 0, 1, 0), init, 0, 60, 80, .5],
    [strings, brass, 1, 60, 80, .4], [bass, piano, 2, 52, 80, .1], [pad, bell, 3, 60, 85, .4], [init, init, 0, 60, 80, 0],
  ];
  class Kormica extends EngineBase {
    constructor(sr) { super(sr); buildBank(); this.initParams(specs); this.voice = Array.from({ length: 32 }, () => ({ v: new WtVoice(), prog: 0 })); this.patch = [mkPatch(), mkPatch()]; this.chorus = new Chorus(sr); this.lfo = new Lfo(); this.bend = this.mod = this.press = 0; this.rebuild(); }
    rebuild() {
      const V = this.v, bal = V[E.LayerBal], mode = Math.round(V[E.Mode]);
      for (let pg = 0; pg < 2; ++pg) {
        const b = pg === 0 ? E.PA : E.PB, p = this.patch[pg];
        p.w1 = Math.round(V[b + E.W1]); p.w2 = Math.round(V[b + E.W2]); p.mix2 = V[b + E.Mix]; p.semi2 = V[b + E.Semi]; p.det2 = V[b + E.Detune]; p.oct = Math.round(V[b + E.Oct]);
        p.uni = 1; p.ftype = Math.round(V[b + E.FType]); p.cut = V[b + E.Cut]; p.res = V[b + E.Res]; p.envAmt = V[b + E.Env]; p.kt = V[b + E.Key];
        p.a = V[b + E.Att]; p.d = V[b + E.Dec]; p.s = V[b + E.Sus]; p.r = V[b + E.Rel]; p.fd = V[b + E.FDec]; p.fs = V[b + E.FSus]; p.noise = V[b + E.Noise] * 0.5;
        p.lfoP = V[b + E.LfoP]; p.lfoF = V[b + E.LfoF]; p.pan = V[b + E.Pan];
        p.level = V[b + E.Level] * (mode === 1 ? (pg === 0 ? Math.min(1, 1 - bal) : Math.min(1, 1 + bal)) : 1);
      }
    }
    set(id, x) { if (id < 0 || id >= E.Count) return; this.v[id] = x; if (id === E.Preset) { this.loadPreset(Math.round(x)); return; } this.rebuild(); for (const s of this.voice) if (s.v.active()) s.v.retime(this.patch[s.prog]); }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.mod = m; } pressure(p) { this.press = p; }
    allNotesOff() { for (const s of this.voice) if (s.v.active()) s.v.release(); }
    noteOn(note, vel) {
      const mode = clampf(Math.round(this.v[E.Mode]), 0, 3);
      const start = prog => {
        let pick = -1; for (let i = 0; i < 32; ++i) if (!this.voice[i].v.active()) { pick = i; break; }
        if (pick < 0) { let old = Infinity; for (let i = 0; i < 32; ++i) if (this.voice[i].v.age < old) { old = this.voice[i].v.age; pick = i; } }
        const s = this.voice[pick]; s.prog = prog; s.v.start(this.patch[prog], note, vel, this.sr, this.noteTune); s.v.age = ++this.counter;
      };
      switch (mode) { case 0: start(0); break; case 1: start(0); start(1); break; case 2: start(note < Math.round(this.v[E.SplitNote]) ? 0 : 1); break; default: start(vel * 127 < this.v[E.VelThresh] ? 0 : 1); }
    }
    noteOff(note) { for (const s of this.voice) if (s.v.active() && s.v.gate_ && s.v.note_ === note) s.v.release(); }
    loadPreset(n) {
      const p = PRS[clampf(n, 0, 15)], put = (id, x) => { this.v[id] = x; this.writeParam(id, x); };
      for (let i = 0; i < PN; ++i) { put(E.PA + i, p[0][i]); put(E.PB + i, p[1][i]); }
      put(E.Mode, p[2]); put(E.SplitNote, p[3]); put(E.VelThresh, p[4]); put(E.Chorus, p[5]); put(E.LayerBal, 0); this.rebuild();
    }
    process(outL, outR, n) {
      const V = this.v, sr = this.sr, vol = Math.pow(10, V[E.Volume] / 20), bendSt = this.bend * V[E.BendRange], io = [0, 0];
      for (let i = 0; i < n; ++i) {
        const lfo = this.lfo.next(V[E.LfoRate], sr, 0) * (0.35 + 0.65 * this.mod); io[0] = 0; io[1] = 0;
        for (const s of this.voice) if (s.v.active()) s.v.render(this.patch[s.prog], sr, lfo, bendSt, io);
        outL[i] = fastTanh(io[0] * 0.8) * 1.15 * vol; outR[i] = fastTanh(io[1] * 0.8) * 1.15 * vol;
      }
      if (V[E.Chorus] > 0.001) for (let i = 0; i < n; ++i) { io[0] = outL[i]; io[1] = outR[i]; this.chorus.process(io, 0.5, 0.65, V[E.Chorus]); outL[i] = io[0]; outR[i] = io[1]; }
    }
  }
  OCC.engines.kormica = { name: 'Kormica', blurb: 'Korg M3-style workstation: two programs with 24 wavetables, layers, splits and velocity switching.', specs, groups, make: sr => new Kormica(sr), E };
})();
/* Additica - additive synthesizer: 64 sine partials per note with two morphing spectra, tilt / even-odd / comb / formant shaping, per-partial decay, drift and unison layers. Port of plugins/additica */
(function () {
  const kP = 64, kSpecs = 8, kPoly = 16, kPool = 20, kLayers = 4, kMaxCtl = 128;
  const E = {}; ['Preset', 'SpecA', 'SpecB', 'Morph', 'Bright', 'Stretch', 'Tilt', 'EvenOdd', 'Comb', 'CombPeriod', 'Formant', 'Vowel', 'FmtShift', 'PDecay', 'PDecayTilt', 'Drift', 'Unison', 'Detune', 'Spread',
    'AmpA', 'AmpD', 'AmpS', 'AmpR', 'ModA', 'ModD', 'ModS', 'ModR', 'MorphEnv', 'BrightEnv', 'Glide', 'VibRate', 'VibDepth', 'Octave', 'Vel', 'Level', 'Count'].forEach((n, i) => E[n] = i);
  const specNames = ['Saw', 'Square', 'Bell', 'Organ', 'Vocal', 'Glass', 'Metallic', 'Brass'];
  const presetNames = ['Init Saw', 'Slow Saw Pad', 'Hollow Reed', 'Glass Bells', 'Tubular Bell', 'Choir Ah', 'Brass Swell', 'Drawbar Organ', 'Metal Pluck', 'Morph Sweep', 'Hollow Strings', 'Glass Harmonica', 'Formant Lead', 'Drone Bell'];
  const specs = [
    P('Preset', '', 0, 13, 0, '%.0f', false, presetNames),
    P('Spectrum A', '', 0, 7, 0, '%.0f', false, specNames), P('Spectrum B', '', 0, 7, 1, '%.0f', false, specNames),
    P('Morph', '', 0, 1, 0), P('Brightness', '', 0, 1, 1), P('Stretch', '', -0.2, 0.25, 0, '%+.3f'), P('Tilt', '', -1, 1, 0, '%+.2f'), P('Even/Odd', '', -1, 1, 0, '%+.2f'),
    P('Comb', '', 0, 1, 0), P('Comb Period', '', 2, 16, 6, '%.1f'), P('Formant', '', 0, 1, 0), P('Vowel', '', 0, 4, 0, '%.0f', false, ['A', 'E', 'I', 'O', 'U']),
    P('Formant Shift', 'st', -12, 12, 0, '%+.1f st'), P('Partial Decay', '', 0, 1, 0), P('Decay Tilt', '', -1, 1, 0.3, '%+.2f'), P('Drift', '', 0, 1, 0.1),
    P('Unison', '', 0, 3, 0, '%.0f', false, ['1 layer', '2 layers', '3 layers', '4 layers']), P('Detune', 'ct', 0, 50, 12, '%.1f ct'), P('Spread', '', 0, 1, 0.6),
    P('Amp Attack', 'ms', 1, 10000, 5, '%.0f ms', true), P('Amp Decay', 'ms', 5, 10000, 400, '%.0f ms', true), P('Amp Sustain', '', 0, 1, 0.8), P('Amp Release', 'ms', 5, 15000, 250, '%.0f ms', true),
    P('Mod Attack', 'ms', 1, 10000, 5, '%.0f ms', true), P('Mod Decay', 'ms', 5, 10000, 600, '%.0f ms', true), P('Mod Sustain', '', 0, 1, 0), P('Mod Release', 'ms', 5, 15000, 300, '%.0f ms', true),
    P('Env > Morph', '', -1, 1, 0, '%+.2f'), P('Env > Bright', '', -1, 1, 0, '%+.2f'), P('Glide', 'ms', 0, 2000, 0, '%.0f ms'),
    P('Vibrato Rate', 'Hz', 0.5, 12, 5.5, '%.1f Hz'), P('Vibrato Depth', 'ct', 0, 100, 0, '%.0f ct'),
    P('Octave', '', 0, 4, 2, '%.0f', false, ['-2', '-1', '0', '+1', '+2']), P('Velocity', '', 0, 1, 0.6), P('Level', 'dB', -30, 6, -9, '%+.1f dB'),
  ];
  const groups = [
    ['Spectrum', [E.SpecA, E.SpecB, E.Morph, E.Bright, E.Stretch, E.Drift]],
    ['Shape', [E.Tilt, E.EvenOdd, E.Comb, E.CombPeriod, E.Formant, E.FmtShift, E.Vowel]],
    ['Partials and unison', [E.PDecay, E.PDecayTilt, E.Unison, E.Detune, E.Spread]],
    ['Amp envelope', [E.AmpA, E.AmpD, E.AmpS, E.AmpR]],
    ['Morph / bright envelope', [E.ModA, E.ModD, E.ModS, E.ModR, E.MorphEnv, E.BrightEnv]],
    ['Play', [E.Glide, E.VibRate, E.VibDepth, E.Octave, E.Vel, E.Level]],
  ];
  /* spectra tables */
  const TA = [], TL = [], TD = [], LG = new Float64Array(kP);
  (function build() {
    const hsh = (k, s) => { let h = (Math.imul(k, 2654435761) + Math.imul(s, 40503) + 12345) >>> 0; h = (h ^ (h >>> 15)) >>> 0; h = Math.imul(h, 2246822519) >>> 0; h = (h ^ (h >>> 13)) >>> 0; return (h & 0xFFFF) / 65535; };
    const gau = (x, c, w) => { const d = (x - c) / w; return Math.exp(-0.5 * d * d); };
    const br = [1, 0.5, 1.2, 1.5, 2, 2.5, 2.67, 3, 4, 4.5, 5.33, 6, 7.2, 8, 9.2, 10.4], ba = [1, 0.7, 0.8, 0.55, 0.75, 0.4, 0.45, 0.35, 0.3, 0.25, 0.2, 0.15, 0.12, 0.1, 0.08, 0.07];
    const oa = [1, 0.9, 0.75, 0.6, 0.1, 0.35, 0.05, 0.3, 0.03, 0.2];
    for (let s = 0; s < kSpecs; ++s) { TA.push(new Float64Array(kP)); TL.push(new Float64Array(kP)); TD.push(new Float64Array(kP)); }
    for (let k = 0; k < kP; ++k) {
      const n = k + 1; LG[k] = Math.log2(n);
      for (let s = 0; s < kSpecs; ++s) {
        let a = 0, r = n, d = 1;
        switch (s) {
          case 0: a = 1 / n; d = 1 + 0.03 * n; break;
          case 1: a = (k & 1) ? 0 : 1 / n; d = 1 + 0.03 * n; break;
          case 2: if (k < 16) { r = br[k]; a = ba[k]; } else { r = 10.4 + 0.95 * (k - 15) + 0.3 * hsh(k, 2); a = 0.07 * Math.pow(0.88, k - 15); } d = 0.4 + 0.3 * Math.pow(r, 1.1); break;
          case 3: a = k < 10 ? oa[k] : 0.02 * Math.pow(0.9, k - 10); d = 0.3; break;
          case 4: { const g = 0.05 + gau(n, 5.6, 1.8) + 0.7 * gau(n, 8.4, 2.4) + 0.3 * gau(n, 18.8, 4) + 0.15 * gau(n, 26, 5); a = g / Math.pow(n, 0.8); d = 1 + 0.02 * n; break; }
          case 5: r = 0.25 * (n + 1) * (n + 1); a = Math.pow(n, -0.8) * (0.7 + 0.3 * Math.cos(0.9 * n * n)); d = 0.6 + 0.04 * n; break;
          case 6: { const nn = Math.floor((n + 1) * 0.5), b = (2 * nn + 1) * (2 * nn + 1) / 9; r = (k & 1) ? 1.41 * b : b; a = Math.pow(n, -0.7) / (1 + 0.1 * n); d = 0.8 + 0.2 * r; break; }
          default: a = Math.pow(n, -0.55) * (1 + 2.2 * gau(n, 5.5, 2.5)) / (1 + Math.pow(n / 20, 3)); d = 1 + 0.03 * n; break;
        }
        TA[s][k] = a; TL[s][k] = Math.log2(Math.max(0.01, r)); TD[s][k] = d;
      }
    }
    for (let s = 0; s < kSpecs; ++s) { let ss = 0; for (let k = 0; k < kP; ++k) ss += TA[s][k] * TA[s][k]; const nm = 1 / Math.sqrt(Math.max(1e-9, ss)); for (let k = 0; k < kP; ++k) TA[s][k] *= nm; }
  })();
  const shaping = (tilt, eo, comb, period, S) => {
    period = Math.max(2, period);
    for (let k = 0; k < kP; ++k) {
      const n = k + 1; let g = Math.pow(2, 1.5 * tilt * LG[k]);
      if (n >= 2) g *= (n & 1) ? Math.min(1, 1 - eo) : Math.min(1, 1 + eo);
      g *= 1 - comb * (0.5 - 0.5 * Math.cos(6.2831853 * k / period));
      S[k] = g;
    }
  };
  const VOW = [[800, 1150, 2900, 1, 0.55, 0.25], [400, 1600, 2700, 1, 0.6, 0.3], [270, 2140, 2950, 1, 0.4, 0.3], [450, 800, 2830, 1, 0.65, 0.15], [325, 700, 2530, 1, 0.5, 0.1]];
  const lcT = [0, 0, 0];
  const formantGains = (vowel, shiftSemis, f0, lr, g) => {
    const v = VOW[clampf(vowel, 0, 4)], sh = shiftSemis / 12, lf0 = Math.log2(Math.max(1, f0));
    for (let j = 0; j < 3; ++j) lcT[j] = Math.log2(v[j]) + sh;
    for (let k = 0; k < kP; ++k) {
      const lf = lf0 + lr[k]; let s = 0.05;
      for (let j = 0; j < 3; ++j) { const d = (lf - lcT[j]) * 5; s += v[3 + j] * Math.exp(-0.5 * d * d); }
      g[k] = s;
    }
  };
  const levelNorm = ss => Math.min(4, Math.pow(Math.max(ss, 1e-6), -0.3));
  /* presets */
  const PO = [
    {},
    { SpecA: 0, SpecB: 1, Morph: 0.25, Bright: 0.85, Tilt: -0.1, Drift: 0.35, Unison: 2, Detune: 16, Spread: 0.8, AmpA: 650, AmpD: 800, AmpS: 0.85, AmpR: 1400, ModA: 1800, ModD: 2500, ModS: 0.4, ModR: 1500, MorphEnv: 0.35, BrightEnv: 0.15, Level: -10 },
    { SpecA: 1, SpecB: 3, Morph: 0.35, EvenOdd: -0.2, Bright: 0.7, BrightEnv: 0.3, ModA: 60, ModD: 500, ModS: 0.3, AmpA: 25, AmpD: 300, AmpS: 0.8, AmpR: 160, VibRate: 5.2, VibDepth: 8, Drift: 0.12 },
    { SpecA: 5, SpecB: 2, Morph: 0.25, PDecay: 0.35, PDecayTilt: 0.5, AmpA: 2, AmpS: 1, AmpR: 2500, Drift: 0.2, Stretch: 0.02, Vel: 0.7, Unison: 1, Detune: 5, Spread: 0.7 },
    { SpecA: 2, SpecB: 6, Morph: 0.15, PDecay: 0.28, PDecayTilt: 0.35, AmpA: 1, AmpS: 1, AmpR: 3500, Drift: 0.1, Level: -8 },
    { SpecA: 4, SpecB: 3, Morph: 0.25, Formant: 0.65, Vowel: 0, Bright: 0.9, Unison: 3, Detune: 14, Spread: 0.85, Drift: 0.4, AmpA: 700, AmpD: 600, AmpS: 0.9, AmpR: 1100, VibRate: 5.0, VibDepth: 12, Level: -10 },
    { SpecA: 7, SpecB: 0, Morph: 0.1, Bright: 0.3, BrightEnv: 0.7, MorphEnv: 0.3, ModA: 220, ModD: 600, ModS: 0.75, ModR: 250, AmpA: 55, AmpD: 300, AmpS: 0.85, AmpR: 180, Unison: 1, Detune: 7, Drift: 0.1, VibRate: 5.5, VibDepth: 6, Vel: 0.8 },
    { SpecA: 3, SpecB: 1, Morph: 0, AmpA: 4, AmpD: 50, AmpS: 1, AmpR: 70, VibRate: 6.2, VibDepth: 6, Drift: 0.05, Vel: 0.2, Tilt: 0.1 },
    { SpecA: 6, SpecB: 2, Morph: 0.3, MorphEnv: 0.5, ModA: 1, ModD: 450, ModS: 0, Bright: 0.4, BrightEnv: 0.6, PDecay: 0.55, PDecayTilt: 0.6, AmpA: 1, AmpS: 1, AmpR: 400, Drift: 0.15, Level: -8 },
    { SpecA: 0, SpecB: 6, Morph: 0, MorphEnv: 1, ModA: 2800, ModD: 2000, ModS: 1, ModR: 2000, Unison: 1, Detune: 9, Spread: 0.6, AmpA: 400, AmpS: 0.9, AmpR: 1600, Drift: 0.25 },
    { SpecA: 0, Comb: 0.65, CombPeriod: 5.5, Tilt: -0.25, Bright: 0.8, Unison: 2, Detune: 11, Spread: 0.9, Drift: 0.3, AmpA: 300, AmpD: 500, AmpS: 0.9, AmpR: 700, VibRate: 5.3, VibDepth: 7 },
    { SpecA: 5, SpecB: 3, Morph: 0.15, Bright: 0.75, AmpA: 160, AmpS: 0.9, AmpR: 1600, VibRate: 5.0, VibDepth: 5, Unison: 1, Detune: 4, Drift: 0.3 },
    { SpecA: 0, SpecB: 4, Morph: 0.35, Formant: 0.75, Vowel: 2, Glide: 90, VibRate: 5.6, VibDepth: 14, AmpA: 8, AmpS: 0.85, AmpR: 160, Unison: 1, Detune: 6, Bright: 0.9 },
    { SpecA: 2, SpecB: 5, Morph: 0.5, PDecay: 0.1, PDecayTilt: 0.2, Stretch: -0.02, AmpA: 400, AmpS: 1, AmpR: 6000, Unison: 2, Detune: 9, Spread: 0.9, Drift: 0.5, Octave: 1, Level: -10 },
  ];
  const PT = PO.map((o, i) => { const v = specs.map(s => s.def); for (const k in o) v[E[k]] = o[k]; v[0] = i; return v; });

  class Rng { constructor() { this.s = 0x1234567; } bi() { let s = this.s; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; this.s = s; return (s >>> 8) * (1 / 16777216) * 2 - 1; } }
  class Voice {
    constructor(sr) {
      this.amp = new Adsr(); this.mod = new Adsr(); this.amp.setSr(sr); this.mod.setSr(sr);
      this.x = new Float64Array(kP); this.e = new Float64Array(kP); this.fm = new Float64Array(kP);
      this.c = new Float64Array(kLayers * kP); this.s = new Float64Array(kLayers * kP); this.a = new Float64Array(kLayers * kP); this.live = new Uint8Array(kLayers * kP); this.nLive = new Int32Array(kLayers);
      this.reset();
    }
    reset() {
      this.on = false; this.held = false; this.fading = false; this.note = 0; this.vel = 0.7; this.tuneCents = 0; this.age = 0; this.pitch = 60; this.tgt = 60; this.fmtVer = -1; this.quiet = 0; this.seed = 1;
      this.x.fill(0); this.fm.fill(0); this.e.fill(1); this.c.fill(0); this.s.fill(0); this.a.fill(0); this.live.fill(0); this.nLive.fill(0); this.amp.kill(); this.mod.kill();
    }
  }
  class Additica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); this.sr = sr; this.ctl = sr <= 60000 ? 64 : 128;
      this.sm = Float64Array.from(this.v); this.vo = Array.from({ length: kPool }, () => new Voice(sr)); this.started = false; this.ageCtr = 0; this.lastVoice = -1; this.lastPitch = -1;
      this.curA = 0; this.oldA = 0; this.curB = 1; this.oldB = 1; this.fa = 1; this.fb = 1; this.abDirty = true;
      const mk = () => ({ amp: new Float64Array(kP), lr: new Float64Array(kP), dec: new Float64Array(kP) }); this.effA = mk(); this.effB = mk();
      this.S = new Float64Array(kP); this.sCache = [1e9, 0, 0, 0]; this.dtilt = new Float64Array(kP); this.dtCache = 1e9; this.fmtVer = 0;
      this.lfoPh = 0; this.bend = 0; this.bendS = 0; this.mw = 0; this.press = 0; this.expr = 1; this.exprS = 1; this.vibCents = 0;
      this.mixL = new Float64Array(kMaxCtl); this.mixR = new Float64Array(kMaxCtl); this.buf = new Float64Array(kMaxCtl);
      this.tgtL = new Float64Array(kP); this.frq = new Float64Array(kP); this.cs0 = new Float64Array(kP); this.sn0 = new Float64Array(kP);
      this.idxs = new Int32Array(kP); this.cv = new Float64Array(kP); this.sv = new Float64Array(kP); this.av = new Float64Array(kP); this.dv = new Float64Array(kP); this.Cv = new Float64Array(kP); this.Sv = new Float64Array(kP);
      this.rng = new Rng(); this.lfm = new Float64Array(kP); this.smoothIds = [E.Morph, E.Bright, E.Stretch, E.Tilt, E.EvenOdd, E.Comb, E.CombPeriod, E.Formant, E.FmtShift, E.PDecayTilt, E.Drift, E.Detune, E.Spread, E.Level, E.VibDepth];
    }
    set(id, x) {
      if (id < 0 || id >= E.Count) return; const sp = specs[id]; if (!(x === x)) x = sp.def;
      x = clampf(x, sp.min, sp.max); if (sp.labels) x = Math.round(x); this.v[id] = x;
      if (!this.started) this.sm[id] = x;
      if (id === E.Preset) { this.loadPreset(x); return; }
      this.changed(id);
    }
    loadPreset(i) {
      i = clampf(Math.round(i), 0, PT.length - 1); const t = PT[i];
      for (let id = 1; id < E.Count; ++id) { this.v[id] = t[id]; if (!this.started) this.sm[id] = t[id]; this.writeParam(id, t[id]); this.changed(id); }
    }
    changed(id) {
      switch (id) {
        case E.SpecA: { const n = Math.round(this.v[E.SpecA]); if (n !== this.curA) { this.oldA = this.curA; this.curA = n; this.fa = this.started ? 0 : 1; if (!this.started) this.oldA = n; this.abDirty = true; } break; }
        case E.SpecB: { const n = Math.round(this.v[E.SpecB]); if (n !== this.curB) { this.oldB = this.curB; this.curB = n; this.fb = this.started ? 0 : 1; if (!this.started) this.oldB = n; this.abDirty = true; } break; }
        case E.Vowel: case E.FmtShift: ++this.fmtVer; break;
        case E.AmpA: case E.AmpD: case E.AmpS: case E.AmpR: case E.ModA: case E.ModD: case E.ModS: case E.ModR: this.refreshEnv(); break;
      }
    }
    refreshEnv() {
      const V = this.v;
      for (const v of this.vo) {
        if (!v.on) continue;
        const sa = v.amp.st, va = v.amp.v, rC = v.amp.rC; v.amp.set(V[E.AmpA] * 0.001, V[E.AmpD] * 0.001, V[E.AmpS], V[E.AmpR] * 0.001); v.amp.st = sa; v.amp.v = va; if (v.fading) v.amp.rC = rC;
        const sm = v.mod.st, vm = v.mod.v; v.mod.set(V[E.ModA] * 0.001, V[E.ModD] * 0.001, V[E.ModS], V[E.ModR] * 0.001); v.mod.st = sm; v.mod.v = vm;
      }
    }
    allNotesOff() { for (const v of this.vo) if (v.on && !v.fading) { v.held = false; v.amp.gateOff(); v.mod.gateOff(); } }
    pitchBend(b) { this.bend = clampf(b, -1, 1); } modWheel(m) { this.mw = clampf(m, 0, 1); } pressure(p) { this.press = clampf(p, 0, 1); }
    noteOn(note, vel) {
      this.started = true; const V = this.v, vo = this.vo;
      let cnt = 0; for (const v of vo) if (v.on && !v.fading) ++cnt;
      if (cnt >= kPoly) {
        let victim = -1, best = 1e9;
        for (let i = 0; i < kPool; ++i) { const v = vo[i]; if (v.on && !v.fading && !v.held && v.amp.v < best) { best = v.amp.v; victim = i; } }
        if (victim < 0) { let oldest = Infinity; for (let i = 0; i < kPool; ++i) { const v = vo[i]; if (v.on && !v.fading && v.age < oldest) { oldest = v.age; victim = i; } } }
        if (victim >= 0) { const v = vo[victim]; v.fading = true; v.held = false; v.amp.st = 4; v.amp.rC = Math.exp(-6.9 / Math.max(1, 0.004 * this.sr)); v.mod.gateOff(); }
      }
      let slot = -1; for (let i = 0; i < kPool; ++i) if (!vo[i].on) { slot = i; break; }
      if (slot < 0) { let best = 1e9; for (let i = 0; i < kPool; ++i) if (vo[i].fading && vo[i].amp.v < best) { best = vo[i].amp.v; slot = i; } }
      if (slot < 0) return;
      const v = vo[slot]; v.reset();
      v.on = true; v.held = true; v.note = note; v.vel = clampf(vel, 0, 1); v.tuneCents = this.noteTune; v.age = ++this.ageCtr; this.lastVoice = slot; v.seed = (Math.imul(0x9E3779B9, this.ageCtr + 1) | 1) >>> 0;
      v.amp.set(V[E.AmpA] * 0.001, V[E.AmpD] * 0.001, V[E.AmpS], V[E.AmpR] * 0.001); v.mod.set(V[E.ModA] * 0.001, V[E.ModD] * 0.001, V[E.ModS], V[E.ModR] * 0.001);
      v.amp.gateOn(); v.mod.gateOn();
      v.tgt = note + 12 * (Math.round(V[E.Octave]) - 2) + v.tuneCents * 0.01;
      v.pitch = (V[E.Glide] > 0.5 && this.lastPitch > 0) ? this.lastPitch : v.tgt; this.lastPitch = v.tgt;
      const r = this.rng; r.s = v.seed; for (let k = 0; k < kP; ++k) v.x[k] = 1.7 * r.bi();
    }
    noteOff(note) { for (const v of this.vo) if (v.on && v.held && !v.fading && v.note === note) { v.held = false; v.amp.gateOff(); v.mod.gateOff(); return; } }
    tick(m) {
      const V = this.v, sm = this.sm, dt = m / this.sr, aS = Math.exp(-dt / 0.015), ids = this.smoothIds;
      for (let q = 0; q < ids.length; ++q) { const id = ids[q]; sm[id] = V[id] + (sm[id] - V[id]) * aS; if (Math.abs(sm[id] - V[id]) < 1e-7) sm[id] = V[id]; }
      this.bendS += (this.bend - this.bendS) * (1 - Math.exp(-dt / 0.006)); this.exprS += (this.expr - this.exprS) * (1 - Math.exp(-dt / 0.01));
      if (Math.abs(this.bendS - this.bend) < 1e-7) this.bendS = this.bend; if (Math.abs(this.exprS - this.expr) < 1e-7) this.exprS = this.expr;
      if (this.fa < 1 || this.fb < 1 || this.abDirty) {
        this.fa = Math.min(1, this.fa + dt / 0.03); this.fb = Math.min(1, this.fb + dt / 0.03);
        const A = this.effA, B = this.effB, fa = this.fa, fb = this.fb, oa = this.oldA, ca = this.curA, ob = this.oldB, cb = this.curB;
        for (let k = 0; k < kP; ++k) {
          A.amp[k] = TA[oa][k] + fa * (TA[ca][k] - TA[oa][k]); A.lr[k] = TL[oa][k] + fa * (TL[ca][k] - TL[oa][k]); A.dec[k] = TD[oa][k] + fa * (TD[ca][k] - TD[oa][k]);
          B.amp[k] = TA[ob][k] + fb * (TA[cb][k] - TA[ob][k]); B.lr[k] = TL[ob][k] + fb * (TL[cb][k] - TL[ob][k]); B.dec[k] = TD[ob][k] + fb * (TD[cb][k] - TD[ob][k]);
        }
        this.abDirty = this.fa < 1 || this.fb < 1;
      }
      const sc = this.sCache;
      if (Math.abs(sc[0] - sm[E.Tilt]) > 1e-5 || Math.abs(sc[1] - sm[E.EvenOdd]) > 1e-5 || Math.abs(sc[2] - sm[E.Comb]) > 1e-5 || Math.abs(sc[3] - sm[E.CombPeriod]) > 1e-5) {
        sc[0] = sm[E.Tilt]; sc[1] = sm[E.EvenOdd]; sc[2] = sm[E.Comb]; sc[3] = sm[E.CombPeriod]; shaping(sc[0], sc[1], sc[2], sc[3], this.S);
      }
      if (Math.abs(this.dtCache - sm[E.PDecayTilt]) > 1e-5) { this.dtCache = sm[E.PDecayTilt]; for (let k = 0; k < kP; ++k) this.dtilt[k] = Math.pow(2, 0.8 * this.dtCache * LG[k]); }
      this.lfoPh += V[E.VibRate] * dt; this.lfoPh -= Math.floor(this.lfoPh);
      this.vibCents = Math.sin(6.2831853 * this.lfoPh) * (sm[E.VibDepth] + 50 * this.mw);
    }
    renderVoice(v, idx, m) {
      const V = this.v, sm = this.sm, sr = this.sr, dt = m / sr, A = this.effA, B = this.effB, S = this.S, tgtL = this.tgtL, frq = this.frq, cs0 = this.cs0, sn0 = this.sn0;
      let g = 0, mv = 0; for (let i = 0; i < m; ++i) { g = v.amp.next(); mv = v.mod.next(); }
      if (V[E.Glide] > 0.5 && !v.fading) { const tc = Math.max(0.001, V[E.Glide] * 0.001 / 4.6); v.pitch += (v.tgt - v.pitch) * (1 - Math.exp(-dt / tc)); } else v.pitch = v.tgt;
      const pitchNow = v.pitch + this.bendS * 2 + this.vibCents * 0.01;
      const f0 = 440 * Math.pow(2, (pitchNow - 69) / 12), f0Note = 440 * Math.pow(2, (v.tgt - 69) / 12);
      const morph = clampf(sm[E.Morph] + V[E.MorphEnv] * mv + this.press * 0.5, 0, 1), br = clampf(sm[E.Bright] + V[E.BrightEnv] * mv, 0, 1);
      const stretch1 = 1 + sm[E.Stretch], drift = sm[E.Drift], useDrift = drift > 0.002, fmix = sm[E.Formant], useFmt = fmix > 0.002;
      const pd = V[E.PDecay], useDec = pd > 0.001, rate = 14 * pd * pd;
      const velGain = (1 - V[E.Vel]) + V[E.Vel] * v.vel, level = Math.pow(10, sm[E.Level] / 20), gainV = g * velGain * this.exprS * level;
      if (useFmt && v.fmtVer !== this.fmtVer) {
        const lr = this.lfm; for (let k = 0; k < kP; ++k) lr[k] = (A.lr[k] + morph * (B.lr[k] - A.lr[k])) * stretch1;
        formantGains(Math.round(V[E.Vowel]), V[E.FmtShift], f0Note, lr, v.fm); v.fmtVer = this.fmtVer;
      }
      const dA = Math.exp(-dt / 0.6), dB = Math.sqrt(Math.max(0, 1 - dA * dA)) * 1.7320508;
      const r = this.rng; r.s = v.seed;
      const u = Math.round(V[E.Unison]) + 1, det = sm[E.Detune];
      const Lmax = u > 1 ? Math.pow(2, det / 1200) : 1, fLimit = 0.47 * sr, fTaper = 0.07 * sr;
      let sumsq = 0; const brOn = br < 0.9995, e = v.e, x = v.x, fmv = v.fm;
      for (let k = 0; k < kP; ++k) {
        let lr = (A.lr[k] + morph * (B.lr[k] - A.lr[k])) * stretch1, ampDr = 1;
        if (useDrift) { x[k] = dA * x[k] + dB * r.bi(); ampDr = clampf(1 + 0.5 * drift * x[k], 0, 2); lr += drift * 12 * x[(k + 7) & (kP - 1)] / 1200; }
        frq[k] = f0 * Math.pow(2, lr);
        let lv = (A.amp[k] + morph * (B.amp[k] - A.amp[k])) * S[k];
        if (useFmt) lv *= 1 + fmix * (fmv[k] - 1);
        if (brOn) lv *= Math.pow(2, -6 * (1 - br) * LG[k]);
        sumsq += lv * lv;
        if (useDec) { const lam = rate * (A.dec[k] + morph * (B.dec[k] - A.dec[k])) * this.dtilt[k]; e[k] *= Math.exp(-lam * dt); if (e[k] < 1e-6) e[k] = 0; }
        tgtL[k] = lv * e[k] * ampDr;
      }
      v.seed = r.s;
      const nm = levelNorm(sumsq) * gainV;
      for (let k = 0; k < kP; ++k) tgtL[k] *= nm;
      const w0 = 6.2831853 / sr;
      for (let k = 0; k < kP; ++k) { if (frq[k] * Lmax >= fLimit || tgtL[k] < 1e-8) { cs0[k] = 2; continue; } const w = w0 * frq[k]; cs0[k] = Math.cos(w); sn0[k] = Math.sin(w); }
      let tot = 0; const buf = this.buf, mixL = this.mixL, mixR = this.mixR, idxs = this.idxs, cv = this.cv, sv = this.sv, av = this.av, dv = this.dv, Cv = this.Cv, Sv = this.Sv, invm = 1 / m;
      for (let j = 0; j < kLayers; ++j) {
        if (j >= u && v.nLive[j] === 0) continue;
        const off = u === 1 ? 0 : (-1 + 2 * j / (u - 1)), cents = j < u ? off * det : 0, Lj = Math.pow(2, cents / 1200), lgn = j < u ? 1 / Math.sqrt(u) : 0;
        const pan = off * sm[E.Spread], ang = (pan + 1) * 0.78539816, gl = Math.cos(ang), gr = Math.sin(ang), base = j * kP, vc = v.c, vs = v.s, va = v.a, live = v.live;
        let na = 0;
        for (let k = 0; k < kP; ++k) {
          let tg = 0; const ik = base + k;
          if (cs0[k] <= 1.5) { const fj = frq[k] * Lj, tp = clampf((fLimit - fj) / fTaper, 0, 1); tg = tgtL[k] * lgn * tp * tp * (3 - 2 * tp); }
          let a = va[ik];
          if (tg < 1e-8 && a < 1e-8) { va[ik] = 0; live[ik] = 0; continue; }
          if (!live[ik]) {
            live[ik] = 1; a = 0;
            if (j === 0) { vc[ik] = 1; vs[ik] = 0; } else { const ph = 6.2831853 * (0.5 + 0.5 * r.bi()); vc[ik] = Math.cos(ph); vs[ik] = Math.sin(ph); }
          }
          let cs = 1, sn = 0;
          if (cs0[k] <= 1.5) { const w = w0 * frq[k], dl = w * (Lj - 1), d2 = dl * dl, cd = 1 - 0.5 * d2 + d2 * d2 / 24, sd = dl * (1 - d2 / 6 + d2 * d2 / 120); cs = cs0[k] * cd - sn0[k] * sd; sn = sn0[k] * cd + cs0[k] * sd; }
          idxs[na] = k; cv[na] = vc[ik]; sv[na] = vs[ik]; av[na] = a; dv[na] = (tg - a) * invm; Cv[na] = cs; Sv[na] = sn; va[ik] = tg; ++na; tot += tg;
        }
        buf.fill(0, 0, m);
        for (let q = 0; q < na; ++q) {
          let c = cv[q], s = sv[q], a = av[q]; const d = dv[q], C = Cv[q], Sn = Sv[q];
          for (let i = 0; i < m; ++i) { buf[i] += a * s; const ns = s * C + c * Sn; c = c * C - s * Sn; s = ns; a += d; }
          const r2 = c * c + s * s, f = 1.5 - 0.5 * r2, k = idxs[q]; vc[base + k] = c * f; vs[base + k] = s * f;
        }
        v.nLive[j] = na;
        for (let i = 0; i < m; ++i) { mixL[i] += buf[i] * gl; mixR[i] += buf[i] * gr; }
      }
      if (v.amp.st === 0) v.on = false;
      else if (v.amp.st === 3 && v.amp.v < 1e-5) v.on = false;
      else if (v.amp.st !== 1 && tot < 1e-7 && gainV > 0) { if (++v.quiet > 8) v.on = false; } else v.quiet = 0;
      if (!v.on) { v.fading = false; v.held = false; }
    }
    process(outL, outR, n) {
      this.started = true; let pos = 0; const mixL = this.mixL, mixR = this.mixR;
      while (pos < n) {
        const m = Math.min(this.ctl, n - pos); this.tick(m); mixL.fill(0, 0, m); mixR.fill(0, 0, m);
        for (let i = 0; i < kPool; ++i) if (this.vo[i].on) this.renderVoice(this.vo[i], i, m);
        for (let i = 0; i < m; ++i) {
          let l = mixL[i], r = mixR[i]; const al = Math.abs(l), ar = Math.abs(r);
          if (!(al < 1e6)) l = 0; if (!(ar < 1e6)) r = 0;
          if (al > 0.8 && al < 1e6) l = Math.sign(l) * (0.8 + 0.2 * fastTanh((al - 0.8) * 5));
          if (ar > 0.8 && ar < 1e6) r = Math.sign(r) * (0.8 + 0.2 * fastTanh((ar - 0.8) * 5));
          outL[pos + i] = l; outR[pos + i] = r;
        }
        pos += m;
      }
    }
  }
  OCC.engines.additica = { name: 'Additica', blurb: 'Additive synthesizer: every note is 64 sine partials with two morphing spectra (saw, square, bell, organ, vocal, glass, metallic, brass), tilt, even/odd, comb and formant shaping, per-partial decay, drift and up to four detuned layers.', specs, groups, make: sr => new Additica(sr), E };
})();
/* Grainica - granular synthesizer. Grains are cut from eight built-in generated sources (voice pad, bell, pluck, noise bed, strings, glass, breath, tine keys). Port of plugins/grainica */
(function () {
  const kSources = 8, kVoices = 8, kPool = 12, kMaxGrains = 256, kSrcRate = 32000, kSrcLen = 128000, kChunk = 256, kWindows = 6;
  const E = {}; ['Preset', 'Source', 'Position', 'Jitter', 'Scan', 'Size', 'Density', 'Spread', 'Scatter', 'Reverse', 'Window', 'Width', 'Freeze', 'KeyTrack', 'Pitch', 'Dynamics', 'Attack', 'Release', 'Level', 'Velocity', 'Count'].forEach((n, i) => E[n] = i);
  const sourceNames = ['Voice Pad', 'Bell', 'Pluck', 'Noise Bed', 'Strings', 'Glass', 'Breath', 'Tine Keys'], windowNames = ['Hann', 'Gauss', 'Triangle', 'Flat top', 'Decay', 'Swell'];
  const presetNames = ['Init Cloud', 'Frozen Choir', 'Glass Rain', 'Bell Smear', 'Pluck Dust', 'Noise Weather', 'Ensemble Shimmer', 'Breath Clouds', 'Tine Scatter', 'Reverse Swell', 'Grain Buzz', 'Freeze Drone'];
  const specs = [
    P('Preset', '', 0, 11, 0, '%.0f', false, presetNames), P('Source', '', 0, 7, 0, '%.0f', false, sourceNames),
    P('Position', '', 0, 1, 0.2, '%.3f'), P('Jitter', '', 0, 1, 0.1), P('Scan', '', -2, 2, 0, '%+.2f x'),
    P('Size', 'ms', 5, 500, 90, '%.0f ms', true), P('Density', '/s', 1, 200, 30, '%.0f /s', true), P('Pitch Spread', 'ct', 0, 1200, 10, '%.0f ct'),
    P('Scatter', '', 0, 1, 0), P('Reverse', '', 0, 1, 0), P('Window', '', 0, 5, 0, '%.0f', false, windowNames), P('Width', '', 0, 1, 0.6),
    P('Freeze', '', 0, 1, 0, '%.0f', false, ['Off', 'Frozen']), P('Key Track', '', 0, 1, 1), P('Pitch', 'st', -24, 24, 0, '%+.2f st'), P('Dynamics', '', 0, 1, 0.2),
    P('Attack', 'ms', 1, 5000, 40, '%.0f ms', true), P('Release', 'ms', 5, 10000, 400, '%.0f ms', true), P('Level', 'dB', -30, 6, -6, '%+.1f dB'), P('Velocity', '', 0, 1, 0.5),
  ];
  const groups = [
    ['Source and cloud', [E.Source, E.Position, E.Jitter, E.Scan, E.Freeze]],
    ['Grains', [E.Size, E.Density, E.Window, E.Reverse, E.Scatter, E.Dynamics]],
    ['Pitch and stereo', [E.Pitch, E.KeyTrack, E.Spread, E.Width]],
    ['Envelope and level', [E.Attack, E.Release, E.Velocity, E.Level]],
  ];
  /* ---- sources (generated on first use, 32 kHz, 128000 samples each) ---- */
  const PI = Math.PI, TP = 2 * Math.PI;
  class Rot { constructor() { this.c = 1; this.s = 0; this.C = 1; this.S = 0; } set(hz, sr, ph) { const w = TP * hz / sr; this.C = Math.cos(w); this.S = Math.sin(w); this.c = Math.cos(ph); this.s = Math.sin(ph); } next() { const y = this.s, nc = this.c * this.C - this.s * this.S; this.s = this.s * this.C + this.c * this.S; this.c = nc; return y; } }
  class GSvf { constructor() { this.ic1 = 0; this.ic2 = 0; this.a1 = 0; this.a2 = 0; this.a3 = 0; } set(hz, q, sr) { const g = Math.tan(PI * Math.min(hz, sr * 0.45) / sr), k = 1 / q; this.a1 = 1 / (1 + g * (g + k)); this.a2 = g * this.a1; this.a3 = g * this.a2; } bp(x) { const v3 = x - this.ic2, v1 = this.a1 * this.ic1 + this.a2 * v3, v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3; this.ic1 = 2 * v1 - this.ic1; this.ic2 = 2 * v2 - this.ic2; return v1; } }
  const fadeEnd = (i, N, t0) => { const x = i / N; if (x < t0) return 1; const u = (x - t0) / (1 - t0); return 0.5 + 0.5 * Math.cos(PI * u); };
  const ring = (out, i0, hz, amp, tau, phase, sr) => { const N = out.length, r = new Rot(); r.set(hz, sr, phase); let e = amp; const d = Math.exp(-1 / (tau * sr)); for (let i = i0; i < N && e > 1e-6; ++i) { out[i] += e * r.next(); e *= d; } };
  const VW = [[800, 1150, 2900, 1, 0.55, 0.25], [450, 800, 2830, 1, 0.65, 0.15], [400, 1600, 2700, 1, 0.6, 0.3], [325, 700, 2530, 1, 0.5, 0.1]];
  const vowelAt = (u, F, G) => { const x = u * 4, fl = Math.floor(x), i = fl & 3, j = (i + 1) & 3, f = x - fl, s = 0.5 - 0.5 * Math.cos(PI * f); for (let k = 0; k < 3; ++k) { F[k] = VW[i][k] * Math.pow(VW[j][k] / VW[i][k], s); G[k] = VW[i][3 + k] + s * (VW[j][3 + k] - VW[i][3 + k]); } };
  const loopNoise = (buf, N, X) => { const out = new Float64Array(N); for (let i = 0; i < N; ++i) { if (i < X) { const w = i / X, a = Math.sin(w * 1.5707963267948966), b = Math.cos(w * 1.5707963267948966); out[i] = buf[i] * a + buf[N + i] * b; } else out[i] = buf[i]; } return out; };
  const SRC = new Array(kSources).fill(null);
  function buildSource(s) {
    const N = kSrcLen, sr = kSrcRate, T = N / sr; let y = new Float64Array(N), root = 261.6256;
    switch (s) {
      case 0: {
        const f0s = [261.25, 261.75, 262.5], B64 = 64, F = [0, 0, 0], G = [0, 0, 0];
        for (let v = 0; v < 3; ++v) {
          const H = Math.min(40, Math.floor(11000 / f0s[v])), rot = []; for (let h = 0; h < H; ++h) { const r = new Rot(); r.set(f0s[v] * (h + 1), sr, 0.37 * v + 0.11 * h * h); rot.push(r); }
          let a0 = new Float64Array(H), a1 = new Float64Array(H);
          const amps = (t, A) => { vowelAt(t / T, F, G); for (let h = 0; h < H; ++h) { const f = f0s[v] * (h + 1); let g = 0.05; for (let k = 0; k < 3; ++k) { const d = Math.log2(f / F[k]) / 0.22; g += G[k] * Math.exp(-0.5 * d * d); } A[h] = g / Math.pow(h + 1, 0.8); } };
          amps(0, a0); const trem = new Float64Array(64);
          for (let i0 = 0; i0 < N; i0 += B64) {
            amps((i0 + B64) / sr, a1); const m = Math.min(B64, N - i0);
            for (let i = 0; i < m; ++i) trem[i] = 1 + 0.25 * Math.sin(TP * (v + 1) * 0.25 * (i0 + i) / sr + 1.7 * v);
            for (let h = 0; h < H; ++h) { let a = a0[h]; const d = (a1[h] - a) / B64, r = rot[h]; for (let i = 0; i < m; ++i) { y[i0 + i] += a * r.next() * trem[i]; a += d; } }
            const t = a0; a0 = a1; a1 = t;
          }
        }
        root = 261.75; break;
      }
      case 1: {
        const f0 = 261.6256, r = [0.5, 1, 1.2, 1.5, 2, 2.5, 2.67, 3, 4, 5.33, 6, 8], a = [0.6, 1, 0.8, 0.55, 0.7, 0.4, 0.35, 0.3, 0.25, 0.15, 0.1, 0.08], tau = [1.6, 1.2, 0.95, 0.75, 0.6, 0.5, 0.45, 0.4, 0.3, 0.2, 0.15, 0.1];
        const strikes = [Math.floor(0.01 * sr), Math.floor(2 * sr)], sa = [1, 0.7];
        for (let q = 0; q < 2; ++q) for (let k = 0; k < 12; ++k) { ring(y, strikes[q], f0 * r[k], a[k] * sa[q], tau[k], 0.3 * k, sr); ring(y, strikes[q], f0 * r[k] + 0.75, a[k] * sa[q] * 0.5, tau[k] * 1.1, 1.1 * k, sr); }
        const nz = new Noise(0x1234567); let lp = 0; for (let q = 0; q < 2; ++q) for (let i = 0; i < Math.floor(0.02 * sr) && strikes[q] + i < N; ++i) { lp += 0.35 * (nz.white() - lp); y[strikes[q] + i] += 0.5 * sa[q] * lp * Math.exp(-i / (0.004 * sr)); }
        for (let i = 0; i < N; ++i) y[i] *= fadeEnd(i, N, 0.88);
        root = f0; break;
      }
      case 2: {
        const f0 = 261.6256, pos = [0.12, 0.3, 0.2, 0.4], t0 = [0.02, 1, 2, 3], nz = new Noise(0x1234567);
        for (let p = 0; p < 4; ++p) {
          const i0 = Math.floor(t0[p] * sr);
          for (let n = 1; n <= 40; ++n) { const f = f0 * n * Math.sqrt(1 + 2e-5 * n * n); if (f > 11000) break; const amp = Math.abs(Math.sin(PI * n * pos[p])) / n; ring(y, i0, f, amp, 1.5 / (1 + 0.1 * Math.pow(n, 1.3)), 0.7 * n, sr); }
          let lp = 0; for (let i = 0; i < Math.floor(0.015 * sr) && i0 + i < N; ++i) { lp += 0.5 * (nz.white() - lp); y[i0 + i] += 0.25 * lp * Math.exp(-i / (0.003 * sr)); }
        }
        for (let i = 0; i < N; ++i) y[i] *= fadeEnd(i, N, 0.9);
        break;
      }
      case 3: {
        const X = 16000, buf = new Float64Array(N + X), nz = new Noise(0x1234567), s1 = new GSvf(), s2 = new GSvf(), s3 = new GSvf(); let lp = 0;
        for (let i = 0; i < N + X; ++i) {
          const t = i / sr, u = t / T;
          if ((i & 31) === 0) { s1.set(200 * Math.pow(2, 4.2 * (0.5 - 0.5 * Math.cos(TP * u))), 3, sr); s2.set(5200 * Math.pow(2, -3.2 * (0.5 - 0.5 * Math.cos(TP * (u + 0.3)))), 4, sr); s3.set(900 * Math.pow(2, 1.5 * Math.sin(TP * 2 * u)), 1.5, sr); }
          const x = nz.white(); lp += 0.05 * (x - lp);
          buf[i] = 1.4 * s1.bp(x) + 1.1 * s2.bp(x) + 0.6 * s3.bp(x) + 0.5 * lp;
        }
        y = loopNoise(buf, N, X); break;
      }
      case 4: {
        const f0s = [260.25, 261.25, 262, 263], sw = new Float64Array(N);
        for (let v = 0; v < 4; ++v) {
          const H = Math.min(26, Math.floor(11000 / f0s[v])); for (let i = 0; i < N; ++i) sw[i] = 0.7 + 0.3 * Math.sin(TP * 0.25 * (v + 1) * i / sr + 1.3 * v);
          for (let h = 0; h < H; ++h) { const r = new Rot(); r.set(f0s[v] * (h + 1), sr, 0.9 * v + 0.2 * h); const a = 1 / ((h + 1) * (1 + Math.pow((h + 1) / 11, 2))); for (let i = 0; i < N; ++i) y[i] += a * sw[i] * r.next(); }
        }
        root = 261.625; break;
      }
      case 5: {
        const f1 = 261.5, r = [1, 2.32, 4.25, 6.63, 9.38], a = [1, 0.6, 0.4, 0.25, 0.15];
        for (let k = 0; k < 5; ++k) { const f = Math.round(f1 * r[k] * 4) / 4; for (let p = 0; p < 2; ++p) { const rt = new Rot(); rt.set(f + 0.5 * p, sr, 0.8 * k + 2.1 * p); for (let i = 0; i < N; ++i) { const sw = 0.65 + 0.35 * Math.sin(TP * 0.25 * (k + 1 + p) * i / sr + 0.9 * k); y[i] += a[k] * sw * rt.next(); } } }
        root = 261.75; break;
      }
      case 6: {
        const X = 16000, buf = new Float64Array(N + X), nz = new Noise(0x1234567), f = [new GSvf(), new GSvf(), new GSvf()], t1 = new Rot(), t2 = new Rot(), F = [0, 0, 0], G = [0, 0, 0]; t1.set(261.75, sr, 0); t2.set(523.5, sr, 0.4);
        for (let i = 0; i < N + X; ++i) {
          const t = i / sr, u = t / T;
          if ((i & 31) === 0) { vowelAt((u * 0.5) % 1, F, G); for (let k = 0; k < 3; ++k) f[k].set(F[k], 9, sr); }
          const x = nz.white(), s = 3 * f[0].bp(x) + 2.2 * f[1].bp(x) + 1.2 * f[2].bp(x), gust = 0.6 + 0.4 * Math.sin(TP * 2 * u + 0.5);
          buf[i] = s * gust + 0.25 * gust * (t1.next() + 0.4 * t2.next());
        }
        y = loopNoise(buf, N, X); root = 261.75; break;
      }
      default: {
        const f0 = 261.6256, st = [Math.floor(0.02 * sr), Math.floor(2 * sr)], sa = [1, 0.8];
        for (let q = 0; q < 2; ++q) for (let i = st[q]; i < N; ++i) {
          const tt = (i - st[q]) / sr, env = Math.exp(-tt / 1.3); if (env < 1e-4) break;
          const ph = TP * f0 * tt, I = 2 * Math.exp(-tt / 0.3) + 0.35, I2 = 1.4 * Math.exp(-tt / 0.05);
          y[i] += sa[q] * env * (Math.sin(ph + I * Math.sin(ph)) + 0.3 * I2 * Math.sin(14 * ph));
        }
        for (let i = 0; i < N; ++i) y[i] *= fadeEnd(i, N, 0.9);
      }
    }
    let mean = 0; for (let i = 0; i < N; ++i) mean += y[i]; mean /= N; let e = 0, pk = 0; for (let i = 0; i < N; ++i) { const x = y[i] - mean; y[i] = x; e += x * x; pk = Math.max(pk, Math.abs(x)); }
    const rms = Math.sqrt(e / N), g = Math.min(0.2 / Math.max(1e-9, rms), 0.95 / Math.max(1e-9, pk));
    const o = new Float32Array(N + 4); for (let i = 0; i < N; ++i) o[i + 1] = y[i] * g; o[0] = o[N]; o[N + 1] = o[1]; o[N + 2] = o[2]; o[N + 3] = o[3];
    return { data: o, root };
  }
  const getSource = s => SRC[s] || (SRC[s] = buildSource(s));
  /* ---- grain windows ---- */
  const WIN = [], WMS = new Float64Array(kWindows);
  for (let w = 0; w < kWindows; ++w) {
    const win = new Float32Array(514); let ms = 0;
    const decay = q => { const a = q < 0.02 ? 0.5 - 0.5 * Math.cos(PI * q / 0.02) : 1, tail = q > 0.97 ? 0.5 + 0.5 * Math.cos(PI * (q - 0.97) / 0.03) : 1; return a * Math.exp(-5 * q) * tail; };
    for (let i = 0; i < 513; ++i) {
      const x = i / 512; let e = 0;
      switch (w) {
        case 0: e = Math.pow(Math.sin(PI * x), 2); break;
        case 1: { const g0 = Math.exp(-0.5 * Math.pow(0.5 / 0.16, 2)); e = (Math.exp(-0.5 * Math.pow((x - 0.5) / 0.16, 2)) - g0) / (1 - g0); break; }
        case 2: e = 1 - Math.abs(2 * x - 1); break;
        case 3: e = x < 0.1 ? 0.5 - 0.5 * Math.cos(PI * x / 0.1) : (x > 0.9 ? 0.5 - 0.5 * Math.cos(PI * (1 - x) / 0.1) : 1); break;
        case 4: e = decay(x); break;
        default: e = decay(1 - x);
      }
      win[i] = e; if (i < 512) ms += e * e;
    }
    win[513] = win[512]; WIN.push(win); WMS[w] = ms / 512;
  }
  /* ---- presets ---- */
  const PO = [
    {},
    { Source: 0, Position: 0.1, Jitter: 0.08, Scan: 0.05, Size: 220, Density: 24, Spread: 6, Width: 0.9, Attack: 600, Release: 1500 },
    { Source: 5, Position: 0.3, Jitter: 0.5, Scan: 0.1, Size: 45, Density: 90, Spread: 20, Scatter: 0.35, Reverse: 0.1, Window: 1, Width: 1, Attack: 20, Release: 900 },
    { Source: 1, Position: 0.02, Jitter: 0.05, Scan: 0.12, Size: 180, Density: 22, Spread: 8, Scatter: 0.15, Window: 1, Width: 0.8, Attack: 40, Release: 1800 },
    { Source: 2, Position: 0.25, Jitter: 0.5, Size: 28, Density: 110, Spread: 35, Scatter: 0.2, Window: 4, Width: 0.9, Dynamics: 0.5, Attack: 5, Release: 300 },
    { Source: 3, Position: 0.5, Jitter: 0.6, Scan: 0.25, Size: 320, Density: 45, Spread: 0, KeyTrack: 0.5, Width: 1, Attack: 1200, Release: 2500 },
    { Source: 4, Position: 0.4, Jitter: 0.2, Scan: 0.05, Size: 140, Density: 34, Spread: 12, Scatter: 0.4, Width: 0.9, Attack: 300, Release: 1600 },
    { Source: 6, Position: 0.3, Jitter: 0.4, Scan: 0.2, Size: 160, Density: 38, Spread: 8, Width: 0.8, Attack: 400, Release: 1200 },
    { Source: 7, Position: 0.02, Jitter: 0.12, Scan: 0.08, Size: 60, Density: 50, Spread: 15, Reverse: 0.3, Window: 2, Width: 0.8, Attack: 5, Release: 700 },
    { Source: 0, Position: 0.3, Jitter: 0.3, Size: 420, Density: 20, Reverse: 0.55, Window: 5, Width: 1, Attack: 900, Release: 2000 },
    { Source: 4, Position: 0.3, Jitter: 0.02, Size: 14, Density: 140, Spread: 3, Width: 0.3, Attack: 10, Release: 250 },
    { Source: 5, Position: 0.45, Jitter: 0.03, Size: 400, Density: 18, Spread: 5, Pitch: -12, Width: 1, Attack: 1500, Release: 3000 },
  ];
  const PT = PO.map((o, i) => { const v = specs.map(s => s.def); for (const k in o) v[E[k]] = o[k]; v[0] = i; return v; });

  class Rng { constructor() { this.s = 0x2545F491; } uni() { let s = this.s; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; this.s = s; return (s >>> 8) * (1 / 16777216); } bi() { return this.uni() * 2 - 1; } }
  class Grain { constructor() { this.on = false; this.voice = 0; this.delay = 0; this.len = 0; this.n = 0; this.pos = 0; this.inc = 1; this.ePh = 0; this.eInc = 0; this.gL = 0; this.gR = 0; this.win = null; this.src = null; } }
  class Vox {
    constructor(sr) { this.env = new Adsr(); this.env.setSr(sr); this.reset(); }
    reset() { this.on = false; this.held = false; this.fading = false; this.pend = false; this.note = 0; this.vel = 0.7; this.tuneCents = 0; this.scanOff = 0; this.age = 0; this.nGr = 0; this.next = 0; this.env.kill(); }
  }
  class Grainica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); this.grainCap = sr <= 52000 ? kMaxGrains : (sr <= 100000 ? 160 : 96);
      this.vo = Array.from({ length: kPool }, () => new Vox(sr)); this.gr = Array.from({ length: kMaxGrains }, () => new Grain()); this.nGr = 0; this.ageCtr = 0; this.scanIdx = 0;
      this.rng = new Rng(); this.levelS = Math.pow(10, this.v[E.Level] / 20); this.bend = 0; this.mw = 0; this.expr = 1; this.frozen = false;
      this.vL = Array.from({ length: kPool }, () => new Float64Array(kChunk)); this.vR = Array.from({ length: kPool }, () => new Float64Array(kChunk)); this.envB = Array.from({ length: kPool }, () => new Float64Array(kChunk));
      this.src = getSource(Math.round(this.v[E.Source]));
    }
    set(id, x) {
      if (id < 0 || id >= E.Count) return; const sp = specs[id]; if (!(x === x)) x = sp.def;
      x = clampf(x, sp.min, sp.max); if (sp.labels) x = Math.round(x); const old = this.v[id]; this.v[id] = x;
      if (id === E.Preset) { this.loadPreset(x); return; }
      this.changed(id, old);
    }
    loadPreset(i) { i = clampf(Math.round(i), 0, PT.length - 1); const t = PT[i]; for (let id = 1; id < E.Count; ++id) { const old = this.v[id]; this.v[id] = t[id]; this.writeParam(id, t[id]); this.changed(id, old); } }
    changed(id, old) {
      switch (id) {
        case E.Source: this.src = getSource(Math.round(this.v[E.Source])); break;
        case E.Attack: case E.Release: this.refreshEnv(); break;
        case E.Freeze: this.frozen = this.v[E.Freeze] > 0.5; if (!this.frozen && old > 0.5) for (const v of this.vo) if (v.on && v.pend) { v.pend = false; v.env.gateOff(); } break;
      }
    }
    refreshEnv() { const V = this.v; for (const v of this.vo) { if (!v.on) continue; const s = v.env.st, val = v.env.v, rC = v.env.rC; v.env.set(V[E.Attack] * 0.001, 0.001, 1, V[E.Release] * 0.001); v.env.st = s; v.env.v = val; if (v.fading) v.env.rC = rC; } }
    allNotesOff() { for (const v of this.vo) if (v.on && !v.fading) { v.held = false; v.pend = false; v.env.gateOff(); } }
    pitchBend(b) { this.bend = clampf(b, -1, 1); } modWheel(m) { this.mw = clampf(m, 0, 1); } pressure(p) { }
    killVoice(vi) { for (const g of this.gr) if (g.on && g.voice === vi) { g.on = false; --this.nGr; } const v = this.vo[vi]; v.nGr = 0; v.on = false; v.fading = false; v.held = false; v.pend = false; }
    noteOn(note, vel) {
      const vo = this.vo, V = this.v; let cnt = 0; for (const v of vo) if (v.on && !v.fading) ++cnt;
      if (cnt >= kVoices) {
        let victim = -1, best = 1e9;
        for (let i = 0; i < kPool; ++i) { const v = vo[i]; if (v.on && !v.fading && !v.held && !v.pend && v.env.v < best) { best = v.env.v; victim = i; } }
        if (victim < 0) for (let i = 0; i < kPool; ++i) { const v = vo[i]; if (v.on && !v.fading && !v.held && v.env.v < best) { best = v.env.v; victim = i; } }
        if (victim < 0) { let oldest = Infinity; for (let i = 0; i < kPool; ++i) { const v = vo[i]; if (v.on && !v.fading && v.age < oldest) { oldest = v.age; victim = i; } } }
        if (victim >= 0) { const v = vo[victim]; v.fading = true; v.held = false; v.pend = false; v.env.st = 4; v.env.rC = Math.exp(-6.9 / Math.max(1, 0.006 * this.sr)); }
      }
      let slot = -1; for (let i = 0; i < kPool; ++i) if (!vo[i].on) { slot = i; break; }
      if (slot < 0) { let best = 1e9; for (let i = 0; i < kPool; ++i) if (vo[i].fading && vo[i].env.v < best) { best = vo[i].env.v; slot = i; } if (slot >= 0) this.killVoice(slot); }
      if (slot < 0) return;
      const v = vo[slot]; v.reset(); v.on = true; v.held = true; v.note = note; v.vel = clampf(vel, 0, 1); v.tuneCents = this.noteTune; v.age = ++this.ageCtr;
      v.env.set(V[E.Attack] * 0.001, 0.001, 1, V[E.Release] * 0.001); v.env.gateOn(); v.next = 0;
    }
    noteOff(note) { for (const v of this.vo) if (v.on && v.held && !v.fading && v.note === note) { v.held = false; if (this.frozen) v.pend = true; else v.env.gateOff(); return; } }
    spawn(vi, v, delay) {
      const V = this.v, rng = this.rng, src = this.src; let nAct = 0; for (const q of this.vo) if (q.on) ++nAct;
      const cap = Math.max(32, Math.floor(this.grainCap / Math.max(1, nAct)));
      if (this.nGr >= this.grainCap || v.nGr >= Math.min(cap, this.grainCap)) return;
      let slot = -1; for (let k = 0; k < kMaxGrains; ++k) { const j = (this.scanIdx + k) & (kMaxGrains - 1); if (!this.gr[j].on) { slot = j; break; } }
      if (slot < 0) return; this.scanIdx = (slot + 1) & (kMaxGrains - 1);
      const base = V[E.Position] + v.scanOff, dev = V[E.Jitter] * 0.5 * rng.bi(); let pn = base + dev; pn -= Math.floor(pn);
      let semis = (v.note - 60) * V[E.KeyTrack] + V[E.Pitch] + this.bend * 2 + v.tuneCents * 0.01; semis += V[E.Spread] * 0.01 * rng.bi();
      if (V[E.Scatter] > 0.001 && rng.uni() < V[E.Scatter]) { const iv = [-12, 7, 12, -5, 19, 24]; semis += iv[Math.floor(rng.uni() * 5.999)]; }
      const ratio = clampf(Math.pow(2, semis / 12) * (261.6256 / src.root) * (kSrcRate / this.sr), 0.02, 8 * kSrcRate / this.sr);
      const rev = V[E.Reverse] > 0.001 && rng.uni() < V[E.Reverse];
      const len = Math.max(24, Math.floor(V[E.Size] * 0.001 * this.sr)), wi = clampf(Math.round(V[E.Window]), 0, kWindows - 1);
      const pan = V[E.Width] * rng.bi(), ang = (pan + 1) * 0.78539816;
      const overlap = V[E.Density] * V[E.Size] * 0.001, norm = 1 / Math.sqrt(Math.max(1, overlap * WMS[wi]));
      const velG = (1 - V[E.Velocity]) + V[E.Velocity] * v.vel, dyn = 1 - V[E.Dynamics] * rng.uni();
      const g = this.gr[slot]; g.on = true; g.voice = vi; g.delay = delay; g.len = len; g.n = 0; g.pos = pn * kSrcLen; g.inc = rev ? -ratio : ratio; g.ePh = 0; g.eInc = 1 / len; g.win = WIN[wi]; g.src = src.data;
      const gg = norm * velG * dyn; g.gL = Math.cos(ang) * gg; g.gR = Math.sin(ang) * gg; ++this.nGr; ++v.nGr;
    }
    process(outL, outR, n) {
      const V = this.v, sr = this.sr, srcSec = kSrcLen / kSrcRate, L = kSrcLen; let pos = 0;
      while (pos < n) {
        const m = Math.min(kChunk, n - pos), dt = m / sr;
        for (let vi = 0; vi < kPool; ++vi) {
          const v = this.vo[vi]; if (!v.on) continue;
          const e = this.envB[vi]; for (let i = 0; i < m; ++i) e[i] = v.env.next();
          if (!this.frozen) { v.scanOff += V[E.Scan] * dt / srcSec; v.scanOff -= Math.floor(v.scanOff); }
          if (v.env.st === 0 || (v.env.st === 4 && v.env.v < 1e-5)) { this.killVoice(vi); continue; }
          this.vL[vi].fill(0, 0, m); this.vR[vi].fill(0, 0, m);
          if (!v.fading) { const interval = Math.max(2, sr / V[E.Density]); while (v.next < m) { this.spawn(vi, v, Math.floor(v.next)); v.next += interval * (0.65 + 0.7 * this.rng.uni()); } v.next -= m; }
        }
        for (let gi = 0; gi < kMaxGrains; ++gi) {
          const g = this.gr[gi]; if (!g.on) continue;
          const dl = this.vL[g.voice], dr = this.vR[g.voice]; let i = g.delay; g.delay = 0;
          const run = Math.min(m - i, g.len - g.n); let p = g.pos, ep = g.ePh; const inc = g.inc, ei = g.eInc, s = g.src, w = g.win, gL = g.gL, gR = g.gR;
          for (let k = 0; k < run;) {
            const sub = Math.min(8, run - k), u0 = ep * 512, u1 = Math.min(512, (ep + ei * sub) * 512), w0 = u0 | 0, w1 = u1 | 0;
            const e0 = w[w0] + (u0 - w0) * (w[w0 + 1] - w[w0]), e1 = w[w1] + (u1 - w1) * (w[w1 + 1] - w[w1]); let env = e0; const de = (e1 - e0) / sub;
            for (let j = 0; j < sub; ++j, ++i) {
              const ip = p | 0, t = p - ip, b = ip; // s[] has one guard sample in front: source index ip lives at s[ip + 1]
              const y0 = s[b], y1 = s[b + 1], y2 = s[b + 2], y3 = s[b + 3];
              const c1 = 0.5 * (y2 - y0), c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3, c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
              const o = (((c3 * t + c2) * t + c1) * t + y1) * env; dl[i] += o * gL; dr[i] += o * gR; env += de;
              p += inc; if (p >= L) p -= L; else if (p < 0) p += L;
            }
            ep += ei * sub; k += sub;
          }
          g.pos = p; g.ePh = ep; g.n += run;
          if (g.n >= g.len) { g.on = false; --this.nGr; --this.vo[g.voice].nGr; }
        }
        this.levelS += (Math.pow(10, V[E.Level] / 20) - this.levelS) * (1 - Math.exp(-dt / 0.02));
        for (let i = 0; i < m; ++i) { outL[pos + i] = 0; outR[pos + i] = 0; }
        for (let vi = 0; vi < kPool; ++vi) {
          if (!this.vo[vi].on) continue; const e = this.envB[vi], a = this.vL[vi], b = this.vR[vi];
          for (let i = 0; i < m; ++i) { outL[pos + i] += a[i] * e[i]; outR[pos + i] += b[i] * e[i]; }
        }
        const gain = this.levelS * (0.6 + 0.4 * this.expr);
        for (let i = 0; i < m; ++i) {
          let l = outL[pos + i] * gain, r = outR[pos + i] * gain; const al = Math.abs(l), ar = Math.abs(r);
          if (!(al < 1e6)) l = 0; if (!(ar < 1e6)) r = 0;
          if (al > 0.8 && al < 1e6) l = Math.sign(l) * (0.8 + 0.2 * fastTanh((al - 0.8) * 5));
          if (ar > 0.8 && ar < 1e6) r = Math.sign(r) * (0.8 + 0.2 * fastTanh((ar - 0.8) * 5));
          outL[pos + i] = l; outR[pos + i] = r;
        }
        pos += m;
      }
    }
  }
  OCC.engines.grainica = { name: 'Grainica', blurb: 'Granular synthesizer: clouds of windowed grains cut from eight generated sources (voice pad, bell, pluck, noise bed, strings, glass, breath, tine keys) with position, scan, jitter, size, density, reverse, scatter and freeze. Sources are built on first use.', specs, groups, make: sr => new Grainica(sr), E };
})();
/* Fantica - Roland Fantom-style multi-category sound module: 41 patches built from 24 band-limited wavetables. Port of plugins/fantica + common/wtvoice.h */
(function () {
  const kSize = 2048, kMask = 2047, kMips = 9, kMaxH = 384, kWaves = 24;
  const WNAMES = ['Sine', 'Saw', 'Square', 'Triangle', 'Pulse 25%', 'Drawbar organ', 'E.Piano', 'Clav', 'Bell', 'Vocal Ah', 'Vocal Oo', 'Vocal Ee', 'Brass', 'Strings', 'Flute', 'Clarinet', 'Digital', 'Glass', 'Synth bass', 'Metallic', 'Choir', 'Sync sweep', 'Warm pad', 'Even'];
  let TAB = null;
  const formant = (h, c, w) => { const d = (h - c) / w; return Math.exp(-d * d); };
  function recipe(w, a, p) {
    a.fill(0); p.fill(0); let seed = (12345 + w * 977) >>> 0; const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed >>> 8) / 16777216; };
    const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; ++i) if (n % i === 0) return false; return true; };
    const PI = Math.PI;
    for (let h = 1; h <= kMaxH; ++h) {
      const x = h; let v = 0, ph = 0;
      switch (w) {
        case 0: v = h === 1 ? 1 : 0; break;
        case 1: v = 1 / x; break;
        case 2: v = (h & 1) ? 1 / x : 0; break;
        case 3: v = (h & 1) ? 1 / (x * x) : 0; ph = ((h >> 1) & 1) ? PI : 0; break;
        case 4: v = Math.abs(Math.sin(PI * x * 0.25)) / x; ph = 0.5 * PI * x * 0.25; break;
        case 5: { const d = [0, 1, .8, .7, .5, 0, .4, 0, .3]; v = h < 9 ? d[h] : 0; break; }
        case 6: { const d = [0, 1, .55, .3, .18, .08, .05, .13, .04]; v = h < 9 ? d[h] : 0; break; }
        case 7: v = h <= 24 ? Math.pow(x, -0.65) * (0.25 + 0.75 * Math.abs(Math.sin(PI * x * 0.21))) : 0; break;
        case 8: { const d = [0, 1, .25, .8, .1, .6, .15, .5, .08, .35, .05, .25]; v = h < 12 ? d[h] : (h < 24 ? 0.12 / (x - 10) : 0); break; }
        case 9: v = formant(x, 5.4, 1.6) * 1 + formant(x, 8.5, 2.2) * 0.6 + formant(x, 1, 0.6) * 0.4; v /= Math.pow(x, 0.3); break;
        case 10: v = formant(x, 2.3, 1) * 1 + formant(x, 6.7, 1.8) * 0.3 + formant(x, 1, 0.5) * 0.5; break;
        case 11: v = formant(x, 2.1, 0.9) * 0.9 + formant(x, 17.7, 3.5) * 0.35 + formant(x, 1, 0.5) * 0.4; break;
        case 12: v = Math.pow(x, -0.75) * (0.4 + 1.6 * formant(x, 4, 3)); break;
        case 13: v = Math.pow(x, -1.05); ph = 0.4 * Math.sin(x * 1.7); break;
        case 14: { const d = [0, 1, .22, .08, .03, .01]; v = h < 6 ? d[h] : 0; break; }
        case 15: v = (h & 1) ? Math.pow(x, -0.9) : (h < 12 ? 0.04 / x : 0); break;
        case 16: v = h <= 32 ? (0.2 + 0.8 * rnd()) / Math.sqrt(x) : 0; ph = rnd() * 2 * PI; break;
        case 17: v = (h % 2 === 1 && h % 3 !== 0 && h <= 40) ? 1 / Math.sqrt(x) : 0; break;
        case 18: { const d = [0, 1, .7, .45, .25, .12, .06]; v = h < 7 ? d[h] : 0; break; }
        case 19: v = (isPrime(h) && h <= 60) ? 1 / Math.pow(x, 0.4) : (h === 1 ? 1 : 0); break;
        case 20: v = (formant(x, 5, 2.2) + formant(x, 9, 3) * 0.5 + formant(x, 1, 0.7) * 0.5) / Math.pow(x, 0.25); ph = rnd() * 2 * PI; break;
        case 21: v = h <= 40 ? (1 / x) * (0.15 + formant(x, 9, 3.5)) : 0; break;
        case 22: v = h <= 12 ? 1 / (x * x) : (h <= 40 ? 0.02 / x : 0); break;
        default: v = (h % 2 === 0) ? 1 / x : (h === 1 ? 0.5 : 0);
      }
      a[h] = v; p[h] = ph;
    }
  }
  function buildBank() {
    if (TAB) return TAB; TAB = new Float32Array(kWaves * kMips * kSize); const amp = new Float64Array(kMaxH + 1), ph = new Float64Array(kMaxH + 1);
    for (let w = 0; w < kWaves; ++w) {
      recipe(w, amp, ph); const acc = new Float64Array(kSize); let done = 0;
      for (let m = kMips - 1; m >= 0; --m) {
        const H = kMaxH >> m;
        for (let h = done + 1; h <= H; ++h) {
          if (amp[h] === 0) continue; const dw = 2 * Math.PI * h / kSize; let c = Math.cos(ph[h]), s = Math.sin(ph[h]); const cd = Math.cos(dw), sd = Math.sin(dw), A = amp[h];
          for (let n = 0; n < kSize; ++n) { acc[n] += A * s; const ns = s * cd + c * sd; c = c * cd - s * sd; s = ns; }
        }
        done = H; const off = (w * kMips + m) * kSize; for (let n = 0; n < kSize; ++n) TAB[off + n] = acc[n];
      }
      const o0 = (w * kMips) * kSize; let e = 0; for (let n = 0; n < kSize; ++n) e += TAB[o0 + n] * TAB[o0 + n];
      const rms = Math.sqrt(e / kSize), k = rms > 1e-9 ? 0.32 / rms : 1;
      for (let m = 0; m < kMips; ++m) { const off = (w * kMips + m) * kSize; for (let n = 0; n < kSize; ++n) TAB[off + n] *= k; }
    }
    return TAB;
  }
  const mipFor = dt => { const allowed = 0.45 / Math.max(1e-6, dt); let m = 0; while (m < kMips - 1 && (kMaxH >> m) > allowed) ++m; return m; };
  function wtRead(w, m, ph) {
    const o = (w * kMips + m) * kSize, x = ph * kSize, i = Math.floor(x), f = x - i;
    const y0 = TAB[o + ((i - 1) & kMask)], y1 = TAB[o + (i & kMask)], y2 = TAB[o + ((i + 1) & kMask)], y3 = TAB[o + ((i + 2) & kMask)];
    return y1 + 0.5 * f * (y2 - y0 + f * (2 * y0 - 5 * y1 + 4 * y2 - y3 + f * (3 * (y1 - y2) + y3 - y0)));
  }
  const kUni = 7; let cacheU = -1, cacheDet = -1, cacheSp = -1; const cacheK = new Float64Array(7), cacheGl = new Float64Array(7), cacheGr = new Float64Array(7);
  const mkPatch = () => ({ w1: 1, w2: 1, mix2: 0, semi2: 0, det2: 7, oct: 0, uni: 1, uniDet: 14, uniSpread: 0.7, ftype: 0, cut: 8000, res: 0.15, envAmt: 0, kt: 0.5, a: 0.005, d: 0.3, s: 0.8, r: 0.3, fd: 0.4, fs: 0.2, noise: 0, noiseDec: 0.03, lfoP: 0, lfoF: 0, velAmp: 0.5, velFilt: 0.3, level: 1, pan: 0 });
  class WtVoice {
    constructor() { this.ae = new Adsr(); this.fe = new Adsr(); this.sv = [new Svf(), new Svf()]; this.svR = [new Svf(), new Svf()]; this.noise = new Noise(); this.ph = new Float64Array(2 * kUni); this.note_ = 60; this.tune = 0; this.vel = 1; this.ne = 0; this.gate_ = false; this.age = 0; }
    start(p, note, vel, sr, tuneCents) {
      this.tune = tuneCents * 0.01; this.note_ = note; this.vel = vel; this.gate_ = true; this.ae.setSr(sr); this.fe.setSr(sr);
      this.ae.set(p.a, p.d, p.s, p.r); this.fe.set(0.001, p.fd, p.fs, p.r); this.ae.gateOn(true); this.fe.gateOn(true);
      this.sv[0].reset(); this.sv[1].reset(); this.svR[0].reset(); this.svR[1].reset(); this.ne = 1;
      let s = (Math.imul(note, 2654435761) + 0x9E3779B9) >>> 0; for (let i = 0; i < 2 * kUni; ++i) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; this.ph[i] = (s >>> 8) / 16777216; }
      this.noise.s = (s | 1) >>> 0;
    }
    release() { this.gate_ = false; this.ae.gateOff(); this.fe.gateOff(); }
    kill() { this.gate_ = false; this.ae.kill(); this.fe.kill(); }
    retime(p) { this.ae.set(p.a, p.d, p.s, p.r); this.fe.set(0.001, p.fd, p.fs, p.r); }
    active() { return this.ae.active(); }
    render(p, sr, lfo, bendSt, out) {
      const base = this.note_ + this.tune + p.oct * 12 + bendSt + p.lfoP * lfo, f1 = midiHz(base), f2 = midiHz(base + p.semi2 + p.det2 * 0.01);
      const U = clampf(p.uni, 1, kUni), dt1 = Math.min(0.45, f1 / sr), dt2 = Math.min(0.45, f2 / sr), m1 = mipFor(dt1 * (U > 1 ? 1.01 : 1)), m2 = mipFor(dt2 * (U > 1 ? 1.01 : 1));
      let sl = 0, srr = 0; const two = p.mix2 > 0.001, ph = this.ph;
      if (cacheU !== U || cacheDet !== p.uniDet || cacheSp !== p.uniSpread) {
        cacheU = U; cacheDet = p.uniDet; cacheSp = p.uniSpread;
        for (let u = 0; u < U; ++u) { const pos = U > 1 ? (u / (U - 1)) * 2 - 1 : 0, sp = pos * p.uniSpread; cacheK[u] = Math.pow(2, pos * p.uniDet / 1200); cacheGl[u] = Math.sqrt(0.5 * (1 - sp)); cacheGr[u] = Math.sqrt(0.5 * (1 + sp)); }
      }
      for (let u = 0; u < U; ++u) {
        const k = cacheK[u];
        let x = wtRead(p.w1, m1, ph[u]); ph[u] += dt1 * k; if (ph[u] >= 1) ph[u] -= 1;
        if (two) { x = x * (1 - 0.5 * p.mix2) + wtRead(p.w2, m2, ph[kUni + u]) * p.mix2; ph[kUni + u] += dt2 * k; if (ph[kUni + u] >= 1) ph[kUni + u] -= 1; }
        sl += x * cacheGl[u]; srr += x * cacheGr[u];
      }
      const norm = 1 / Math.sqrt(U); sl *= norm; srr *= norm;
      if (p.noise > 0) { const n = this.noise.white() * p.noise * this.ne; this.ne *= Math.exp(-1 / (Math.max(0.002, p.noiseDec) * sr)); sl += n; srr += n; }
      const fe = this.fe.next(), ae = this.ae.next();
      if (p.ftype !== 4) {
        const oct = p.envAmt * 5 * fe + p.kt * (this.note_ - 60) / 12 + p.lfoF * lfo + p.velFilt * (this.vel - 0.5) * 2, hz = p.cut * Math.pow(2, oct), q = 0.55 + p.res * 8, s0 = this.sv[0], s1 = this.sv[1], r0 = this.svR[0], r1 = this.svR[1];
        s0.set(hz, q, sr);
        s1.a1 = r0.a1 = r1.a1 = s0.a1; s1.a2 = r0.a2 = r1.a2 = s0.a2; s1.a3 = r0.a3 = r1.a3 = s0.a3; s1.k = r0.k = r1.k = s0.k;
        s0.run(sl); r0.run(srr);
        switch (p.ftype) {
          case 0: sl = s0.low; srr = r0.low; break;
          case 1: s1.run(s0.low); r1.run(r0.low); sl = s1.low; srr = r1.low; break;
          case 2: sl = s0.high; srr = r0.high; break;
          default: sl = s0.band * (0.8 + p.res); srr = r0.band * (0.8 + p.res);
        }
      }
      const g = ae * (1 - p.velAmp + p.velAmp * this.vel) * p.level, pl = Math.sqrt(0.5 * (1 - p.pan)), pr = Math.sqrt(0.5 * (1 + p.pan));
      out[0] += sl * g * pl * 1.414; out[1] += srr * g * pr * 1.414;
    }
  }
  const T = [
    [6, 3, .3, 0, 5, 0, 1, 0, 1, 6000, .1, .45, .7, .002, 3.5, 0, .4, .6, .1, .05, 0, 0, .7, .1, 'Concert Grand'],
    [6, 5, .25, 12, 4, 0, 1, 0, 1, 10000, .1, .3, .8, .002, 2.5, 0, .3, .4, .2, .07, 0, 0, .8, .1, 'Bright Piano'],
    [6, 6, .5, 0, 22, 0, 1, 0, 1, 5500, .1, .3, .7, .002, 2.5, 0, .3, .5, .2, .05, 0, 0, .6, 0, 'Honky-tonk'],
    [6, 0, .4, 12, 3, 0, 1, 0, 0, 4000, .1, .3, .6, .003, 2, 0, .35, .7, .1, .02, 0, 0, .7, .35, 'Tine E.Piano'],
    [6, 8, .3, 12, 2, 0, 1, 0, 0, 6500, .1, .25, .7, .002, 2.8, 0, .4, .5, .15, .03, 0, 0, .7, .3, 'Bell E.Piano'],
    [5, 5, .5, 12, 0, 0, 1, 0, 4, 8000, 0, 0, 0, .004, .1, 1, .08, .1, 1, 0, 0, 0, .1, .3, 'Drawbar Organ'],
    [5, 2, .3, 0, 0, 0, 1, 0, 0, 5500, .1, 0, .5, .004, .1, 1, .08, .1, 1, .02, 0, 0, .1, .2, 'Rock Organ'],
    [5, 13, .5, 12, 0, 0, 1, 0, 0, 4000, .05, 0, .4, .05, .2, 1, .25, .1, 1, 0, 0, 0, .1, .5, 'Church Organ'],
    [7, 2, .2, 0, 3, 0, 1, 0, 0, 5000, .2, .4, .7, .001, .4, .1, .1, .3, .1, .02, 0, 0, .7, 0, 'Clav'],
    [4, 7, .5, 12, 6, 0, 1, 0, 0, 9000, .1, .2, .6, .001, 1.2, 0, .15, .3, .1, .02, 0, 0, .3, .1, 'Harpsichord'],
    [13, 13, .6, 0, 9, 0, 5, 18, 0, 5500, .1, .2, .5, .5, 1, .9, .8, 1.2, .7, 0, .08, 0, .3, .6, 'Studio Strings'],
    [13, 22, .5, 0, 8, 0, 5, 20, 0, 3500, .1, .2, .4, 1.1, 1.5, .9, 1.4, 1.8, .7, 0, .08, 0, .2, .6, 'Slow Strings'],
    [13, 1, .3, 0, 6, 0, 3, 10, 0, 4500, .1, .5, .6, .002, .25, 0, .15, .2, 0, .02, 0, 0, .6, .2, 'Pizzicato'],
    [12, 1, .3, 0, 6, 0, 2, 10, 1, 2200, .15, .6, .6, .05, .4, .8, .2, .5, .5, 0, 0, 0, .6, .15, 'Brass Section'],
    [12, 3, .4, 0, 5, 0, 1, 0, 0, 1600, .1, .5, .5, .1, .5, .85, .3, .6, .5, 0, .05, 0, .4, .2, 'Soft Brass'],
    [1, 1, .6, 0, 12, 0, 3, 16, 1, 2500, .2, .65, .6, .03, .4, .75, .2, .5, .4, 0, 0, 0, .6, .3, 'Synth Brass'],
    [14, 0, .3, 12, 2, 0, 1, 0, 0, 7000, .05, .1, .5, .06, .2, .9, .2, .3, .6, .03, .1, 0, .4, .15, 'Flute'],
    [15, 0, .2, 12, 2, 0, 1, 0, 0, 4000, .1, .2, .6, .04, .2, .9, .2, .3, .6, .01, .08, 0, .4, .15, 'Clarinet'],
    [12, 15, .5, 0, 3, 0, 1, 0, 3, 2200, .45, .3, .7, .05, .2, .9, .2, .3, .6, .01, .1, 0, .4, .1, 'Oboe'],
    [9, 20, .5, 0, 9, 0, 3, 14, 0, 3800, .15, .15, .5, .5, 1, .9, .9, 1.5, .7, 0, .1, 0, .3, .6, 'Choir Aahs'],
    [10, 20, .5, 0, 8, 0, 3, 14, 0, 3000, .1, .1, .5, .5, 1, .9, .9, 1.5, .7, 0, .1, 0, .3, .6, 'Choir Oohs'],
    [11, 9, .5, 0, 7, 0, 3, 16, 0, 4500, .15, .2, .5, .7, 1, .9, 1.2, 1.6, .6, 0, .12, 0, .3, .6, 'Vox Pad'],
    [1, 1, .5, 0, 10, 0, 7, 26, 0, 7000, .15, .25, .6, .01, .3, .9, .2, .5, .6, 0, .05, 0, .5, .3, 'SuperSaw Lead'],
    [2, 2, .4, 12, 5, 0, 1, 0, 0, 3500, .2, .4, .5, .005, .3, .9, .2, .5, .6, 0, .1, 0, .5, .1, 'Square Lead'],
    [21, 1, .3, 0, 8, 0, 2, 10, 0, 5500, .3, .35, .6, .01, .5, .8, .2, .7, .5, 0, .1, 0, .5, .2, 'Sync Lead'],
    [1, 2, .4, 0, 6, 0, 1, 0, 1, 1800, .25, .6, .5, .002, .25, 0, .15, .2, 0, 0, 0, 0, .6, .1, 'Mono Pluck'],
    [22, 13, .4, 0, 9, 0, 3, 12, 0, 2800, .15, .25, .4, .9, 1.5, .9, 1.4, 1.5, .6, 0, .05, 0, .2, .6, 'Warm Pad'],
    [17, 22, .5, 12, 6, 0, 2, 10, 0, 5000, .15, .15, .4, .9, 1, .9, 1.5, 2, .7, 0, .05, 0, .2, .5, 'Glass Pad'],
    [16, 22, .5, 7, 10, 0, 3, 18, 0, 2500, .3, .35, .4, 1.5, 2, .8, 2., 3.5, .4, 0, .05, .9, .2, .6, 'Evolving Pad'],
    [1, 1, .5, 0, 10, 0, 3, 15, 1, 900, .3, .8, .5, 1.8, 2.5, .8, 2, 3.5, .6, 0, 0, 0, .2, .5, 'Sweep Pad'],
    [18, 1, .3, -12, 4, -1, 1, 0, 1, 900, .3, .6, .4, .002, .35, .5, .1, .25, .1, 0, 0, 0, .6, 0, 'Synth Bass'],
    [18, 3, .4, 0, 3, -1, 1, 0, 0, 700, .1, .4, .5, .003, .9, .1, .2, .5, .1, .04, 0, 0, .7, 0, 'Fingered Bass'],
    [0, 3, .3, 0, 0, -1, 1, 0, 0, 400, .05, .1, .4, .01, .5, 1, .15, .3, 1, 0, 0, 0, .5, 0, 'Sub Bass'],
    [1, 2, .4, -12, 4, -1, 1, 0, 1, 600, .35, .8, .4, .002, .3, 0, .12, .18, 0, 0, 0, 0, .6, 0, 'Pluck Bass'],
    [8, 0, .4, 19, 0, 0, 1, 0, 4, 8000, 0, 0, 0, .001, 4, 0, 1.2, .1, 1, .04, 0, 0, .6, .3, 'Bell'],
    [0, 8, .25, 24, 3, 0, 1, 0, 4, 8000, 0, 0, 0, .002, 3, 0, .8, .1, 1, .03, .12, 0, .6, .2, 'Vibes'],
    [0, 6, .25, 12, 2, 0, 1, 0, 0, 3500, .05, .3, .6, .001, .6, 0, .15, .3, 0, .08, 0, 0, .7, 0, 'Marimba'],
    [8, 0, .3, 12, 1, 1, 1, 0, 4, 8000, 0, 0, 0, .001, 1.8, 0, .7, .1, 1, .03, 0, 0, .6, .15, 'Music Box'],
    [16, 19, .4, 7, 6, 0, 1, 0, 0, 6000, .2, .5, .5, .001, .5, 0, .2, .35, 0, .03, 0, 0, .6, .2, 'Digital Pluck'],
    [22, 2, .4, 0, 7, 0, 1, 0, 1, 2500, .2, .4, .5, .02, .4, .9, .3, .6, .6, 0, .08, 0, .5, .2, 'Warm Lead'],
    [1, 1, 0, 0, 7, 0, 1, 0, 0, 8000, .15, 0, .5, .005, .3, .8, .3, .4, .2, 0, 0, 0, .5, 0, 'Init'],
  ];
  const E = {}; ['Patch', 'Cutoff', 'Resonance', 'Attack', 'Release', 'Width', 'Ensemble', 'Touch', 'Octave', 'LfoRate', 'Vibrato', 'BendRange', 'Volume', 'Count'].forEach((n, i) => E[n] = i); E.Preset = 0;
  const specs = [
    P('Preset', '', 0, T.length - 1, T.length - 1, '%.0f', false, T.map(q => q[24])),
    P('Cutoff', '', 0, 1, 0.5), P('Resonance', '', 0, 1, 0.5), P('Attack', '', 0, 1, 0.5), P('Release', '', 0, 1, 0.5),
    P('Width', '', 0, 1, 0.5), P('Ensemble', '', 0, 1, 0.5), P('Touch', '', 0, 1, 0.5), P('Octave', '', -2, 2, 0, '%.0f'),
    P('LFO rate', 'Hz', 0.1, 12, 5.5, '%.1f Hz', true), P('Mod wheel vibrato', '', 0, 1, 0.6), P('Bend range', 'st', 0, 24, 2, '%.0f st'), P('Volume', 'dB', -24, 6, -6, '%.1f dB'),
  ];
  const groups = [
    ['Macros', [E.Cutoff, E.Resonance, E.Attack, E.Release, E.Width, E.Ensemble, E.Touch]],
    ['Performance', [E.Octave, E.LfoRate, E.Vibrato, E.BendRange, E.Volume]],
  ];
  const NV = 24;
  class Fantica extends EngineBase {
    constructor(sr) {
      super(sr); buildBank(); this.initParams(specs); this.voice = Array.from({ length: NV }, () => new WtVoice()); this.patch = mkPatch(); this.p2 = mkPatch();
      this.chorus = new Chorus(sr); this.lfo = new Lfo(); this.bend = this.mod = 0; this.chorusAmt = 0; this.io = [0, 0]; this.rebuild();
    }
    rebuild() {
      const V = this.v, q = T[clampf(Math.round(V[E.Patch]), 0, T.length - 1)], p = this.patch;
      p.w1 = q[0]; p.w2 = q[1]; p.mix2 = q[2]; p.semi2 = q[3]; p.det2 = q[4]; p.oct = q[5] + Math.round(V[E.Octave]);
      p.uni = q[6]; p.uniDet = q[7] * 2 * V[E.Width]; p.uniSpread = Math.min(1, 1.4 * V[E.Width]);
      p.ftype = q[8]; p.cut = q[9] * Math.pow(2, (V[E.Cutoff] - 0.5) * 6); p.res = clampf(q[10] + (V[E.Resonance] - 0.5) * 0.9, 0, 1); p.envAmt = q[11]; p.kt = q[12];
      const ak = Math.pow(4, (V[E.Attack] - 0.5) * 2), rk = Math.pow(4, (V[E.Release] - 0.5) * 2);
      p.a = q[13] * ak; p.d = q[14]; p.s = q[15]; p.r = q[16] * rk; p.fd = q[17]; p.fs = q[18]; p.noise = q[19] * 0.5; p.lfoP = q[20]; p.lfoF = q[21];
      p.velAmp = clampf(q[22] * 2 * V[E.Touch], 0, 1); p.velFilt = p.velAmp * 0.5;
      this.chorusAmt = clampf(q[23] + (V[E.Ensemble] - 0.5), 0, 1);
    }
    set(id, x) { if (id < 0 || id >= E.Count) return; this.v[id] = x; this.rebuild(); for (const s of this.voice) if (s.active()) s.retime(this.patch); }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.mod = m; } pressure(p) { }
    allNotesOff() { for (const s of this.voice) if (s.active()) s.release(); }
    noteOn(note, vel) {
      let pick = -1; for (let i = 0; i < NV; ++i) if (!this.voice[i].active()) { pick = i; break; }
      if (pick < 0) { let old = Infinity; for (let i = 0; i < NV; ++i) if (this.voice[i].age < old) { old = this.voice[i].age; pick = i; } }
      const s = this.voice[pick]; s.start(this.patch, note, vel, this.sr, this.noteTune); s.age = ++this.counter;
    }
    noteOff(note) { for (const s of this.voice) if (s.active() && s.gate_ && s.note_ === note) s.release(); }
    process(outL, outR, n) {
      const V = this.v, sr = this.sr, vol = Math.pow(10, V[E.Volume] / 20), bendSt = this.bend * V[E.BendRange], io = this.io;
      const p = this.p2; Object.assign(p, this.patch); p.lfoP += this.mod * V[E.Vibrato] * 0.7;
      const act = this.voice.filter(v => v.active());
      for (let i = 0; i < n; ++i) {
        const lfo = this.lfo.next(V[E.LfoRate], sr, 0); io[0] = 0; io[1] = 0;
        for (let k = 0; k < act.length; ++k) act[k].render(p, sr, lfo, bendSt, io);
        outL[i] = fastTanh(io[0] * 0.7) * 1.25 * vol; outR[i] = fastTanh(io[1] * 0.7) * 1.25 * vol;
      }
      if (this.chorusAmt > 0.001) for (let i = 0; i < n; ++i) { io[0] = outL[i]; io[1] = outR[i]; this.chorus.process(io, 0.55, 0.7, this.chorusAmt); outL[i] = io[0]; outR[i] = io[1]; }
    }
  }
  OCC.engines.fantica = { name: 'Fantica', blurb: 'Fantom-style sound module: 41 patches (pianos, organs, strings, brass, winds, voices, leads, pads, basses, mallets) from 24 wavetables, with macro knobs for cutoff, resonance, attack, release, width and ensemble.', specs, groups, make: sr => new Fantica(sr), E };
})();
/* Wraithica - theremin, musical saw, glass harmonica and waterphone in one instrument. Port of plugins/wraithica/wraithica.h
   Theremin and saw are mono-legato; glass and waterphone are 8-voice poly. Haunt = drifting double + dark reverb bloom (built in). */
(function () {
  const E = {}; ['Preset', 'Model', 'VibRate', 'VibDepth', 'Glide', 'Motion', 'Haunt', 'Breath', 'Tone', 'Attack', 'Release', 'Bend', 'Level', 'Count'].forEach((n, i) => E[n] = i);
  const ROWS = [ // name, model, vibRate, vibDepth, glide, motion, haunt, breath, tone, attack, release, bend, level
    ['Classic Theremin', 0, 5.4, 0.35, 0.10, 0.25, 0.25, 0.10, 0.45, 0.06, 0.30, 2, -6],
    ['Haunted Parlour', 0, 4.6, 0.45, 0.22, 0.45, 0.80, 0.18, 0.35, 0.18, 1.20, 2, -7],
    ['Sci-Fi Warble', 0, 7.5, 0.80, 0.05, 0.60, 0.40, 0.05, 0.75, 0.03, 0.40, 12, -7],
    ['Singing Saw', 1, 5.8, 0.55, 0.12, 0.40, 0.25, 0.20, 0.50, 0.12, 0.45, 2, -6],
    ['Carnival Wobble', 1, 6.8, 0.70, 0.08, 0.90, 0.20, 0.30, 0.60, 0.05, 0.30, 2, -7],
    ['Frozen Lake', 1, 4.2, 0.30, 0.30, 0.30, 0.90, 0.10, 0.25, 0.60, 3.00, 2, -7],
    ['Glass Chapel', 2, 4.0, 0.15, 0.04, 0.35, 0.50, 0.12, 0.50, 0.35, 1.80, 2, -8],
    ['Wet Rim', 2, 3.5, 0.20, 0.03, 0.80, 0.30, 0.35, 0.70, 0.25, 1.00, 2, -8],
    ['Seance Pad', 2, 3.0, 0.10, 0.10, 0.55, 1.00, 0.20, 0.35, 1.20, 5.00, 2, -8],
    ['Deep Water', 3, 4.0, 0.10, 0.06, 0.70, 0.55, 0.10, 0.45, 0.50, 3.00, 2, -7],
    ['Ghost Ship', 3, 3.0, 0.15, 0.15, 1.00, 0.85, 0.25, 0.60, 0.80, 5.00, 2, -7],
    ['Bowed Bowl', 3, 5.0, 0.20, 0.03, 0.30, 0.20, 0.05, 0.30, 0.25, 0.80, 2, -7],
  ];
  const d0 = ROWS[0];
  const specs = [
    P('Preset', '', 0, ROWS.length - 1, 0, '%.0f', false, ROWS.map(r => r[0])),
    P('Model', '', 0, 3, d0[1], '%.0f', false, ['Theremin', 'Musical saw', 'Glass harmonica', 'Waterphone']),
    P('Vib rate', 'Hz', 0.5, 10, d0[2], '%.1f Hz'), P('Vib depth', '', 0, 1, d0[3], '%.2f'),
    P('Glide', 's', 0.003, 3, d0[4], '%.3f s', true), P('Motion', '', 0, 1, d0[5], '%.2f'), P('Haunt', '', 0, 1, d0[6], '%.2f'),
    P('Breath', '', 0, 1, d0[7], '%.2f'), P('Tone', '', 0, 1, d0[8], '%.2f'),
    P('Attack', 's', 0.005, 4, d0[9], '%.3f s', true), P('Release', 's', 0.02, 8, d0[10], '%.2f s', true),
    P('Bend', 'st', 0, 24, d0[11], '%.0f st'), P('Level', 'dB', -30, 6, d0[12], '%+.1f dB'),
  ];
  const groups = [
    ['Instrument', [E.Preset, E.Model, E.Tone, E.Breath, E.Haunt, E.Level]],
    ['Bow & hand', [E.Attack, E.Release, E.Glide, E.Bend]],
    ['Motion', [E.VibRate, E.VibDepth, E.Motion]],
  ];
  const ST = new Float64Array(4098); for (let i = 0; i <= 4097; ++i) ST[i] = Math.sin(2 * Math.PI * i / 4096);
  const sinCyc = ph => { const x = ph * 4096; let i = Math.floor(x); const f = x - i; i &= 4095; return ST[i] + (ST[i + 1] - ST[i]) * f; };
  const rnd01 = n => 0.5 + 0.5 * n.white();
  const VIB = [90, 70, 18, 14], MGAIN = [0.55, 0.50, 0.60, 0.32];
  const GR = [1, 2.32, 4.25, 6.63], WR = [1, 1.52, 2.17, 2.83, 3.61, 4.76, 5.93, 7.31];
  const kPoly = 8, kMono = 8, kSlots = 9, kStack = 16;
  const velVol = v => 0.2 + 0.8 * v;
  const sawWeight = (k, tone, motion, wobB) => { const p = 2.2 - 1.2 * tone, d = (k - 3.5) / 1.6; let a = Math.pow(k, -p) * (1 + 0.9 * tone * Math.exp(-d * d)); a *= Math.max(0, 1 + motion * 0.8 * wobB * 0.15 * (k - 1)); return a; };
  const GB = [1, 0.40, 0.18, 0.08];
  const glassWeight = (k, tone) => k === 0 ? 1 : GB[k] * (0.15 + 1.7 * tone * tone);
  const waterWeight = (k, tone) => Math.exp(-k * (1.25 - 1.0 * tone) * 0.33) / (1 + 0.25 * k);

  class Voice {
    constructor() {
      this.ph = new Float64Array(16); this.amp = new Float64Array(16); this.beat = new Float64Array(8); this.sk = new Float64Array(8); this.skD = new Float64Array(8);
      this.shPh = new Float64Array(8); this.shRate = new Float64Array(8); this.ratioJit = new Float64Array(8);
      this.env = new Adsr(); this.noise = new Noise(); this.nsv = new Svf(); this.reset();
    }
    reset() {
      this.active = false; this.gate = false; this.killing = false; this.hasPend = false; this.model = 0; this.key = 60; this.chan = 0; this.age = 0;
      this.pModel = 0; this.pChan = 0; this.pKey = 60; this.pVel = 0; this.pTune = 0; this.kg = 1;
      this.f = 261; this.vel = 0.8; this.pitch = 60; this.tgt = 60; this.dev = 0; this.scoop = 0; this.volS = 0; this.volT = 0.8; this.t = 0;
      const sr = this.env.sr; this.env = new Adsr(); this.env.setSr(sr); this.cnt = 0;
      this.ph.fill(0); this.amp.fill(0); this.beat.fill(0); this.sk.fill(0); this.skD.fill(0); this.shPh.fill(0); this.shRate.fill(0); this.ratioJit.fill(0);
      this.vibPh = 0; this.vibFade = 0; this.wander = 0; this.wanderT = 0; this.wCnt = 0;
      this.slPh1 = 0; this.slPh2 = 0; this.slR1 = 0.5; this.slR2 = 1.5; this.slRw = 0; this.slRwT = 0; this.slCnt = 0; this.K = 1;
      this.rubPh = 0; this.rubRate = 0.5; this.pan = 0.5; this.noise.s = 0x9E3779B9; this.nsv.reset(); this.nsv.k = 1;
    }
  }
  class Sm { constructor() { this.v = 0; this.c = 0; } next(t) { this.v = t + (this.v - t) * this.c; return this.v; } }
  class Bloom {
    constructor(s) {
      this.sr = s; const k = s / 44100; const cb = [[1116, 1188, 1277, 1356], [1139, 1211, 1300, 1379]], ab = [[556, 441], [579, 464]];
      this.dl = [new DelayLine(Math.floor(s * 0.06) + 16), new DelayLine(Math.floor(s * 0.06) + 16)];
      this.cl = [[0, 0, 0, 0], [0, 0, 0, 0]]; this.al = [[0, 0], [0, 0]]; this.cd = []; this.cz = [new Float64Array(4), new Float64Array(4)]; this.cfb = [new Float64Array(4), new Float64Array(4)]; this.ad = [];
      for (let c = 0; c < 2; ++c) {
        this.cd.push([]); this.ad.push([]);
        for (let j = 0; j < 4; ++j) { this.cl[c][j] = Math.max(8, Math.round(cb[c][j] * k * 1.6)); this.cd[c].push(new DelayLine(this.cl[c][j] + 16)); }
        for (let j = 0; j < 2; ++j) { this.al[c][j] = Math.max(8, Math.round(ab[c][j] * k)); this.ad[c].push(new DelayLine(this.al[c][j] + 32)); }
      }
      this.ph1 = 0; this.ph2 = 0; this.wetMag = 0; this.rt = -1; this.lpz = [0, 0]; this.oL = 0; this.oR = 0; this.w = [0, 0]; this.clear();
    }
    clear() { for (let c = 0; c < 2; ++c) { this.dl[c].clear(); for (let j = 0; j < 4; ++j) { this.cd[c][j].clear(); this.cz[c][j] = 0; } for (let j = 0; j < 2; ++j) this.ad[c][j].clear(); this.lpz[c] = 0; } this.wetMag = 0; this.ph1 = this.ph2 = 0; }
    setRt(rt60) { if (Math.abs(rt60 - this.rt) < 1e-3) return; this.rt = rt60; for (let c = 0; c < 2; ++c) for (let j = 0; j < 4; ++j) this.cfb[c][j] = Math.min(0.97, Math.pow(10, -3 * this.cl[c][j] / (rt60 * this.sr))); }
    run(inL, inR, haunt, rt60) {
      const dl = this.dl;
      if (haunt < 1e-4) { dl[0].push(inL); dl[1].push(inR); this.oL = inL; this.oR = inR; this.wetMag *= 0.999; return; }
      this.setRt(rt60); const sr = this.sr;
      this.ph1 += 0.31 / sr; if (this.ph1 >= 1) this.ph1 -= 1; this.ph2 += 0.23 / sr; if (this.ph2 >= 1) this.ph2 -= 1;
      dl[0].push(inL); dl[1].push(inR);
      const s1 = sinCyc(this.ph1), s2 = sinCyc(this.ph2 + 0.3), ms = sr * 0.001;
      const a0 = dl[0].read(ms * (21 + 4.5 * s1)), b0 = dl[0].read(ms * (33 + 4 * s2)), a1 = dl[1].read(ms * (23 - 4.5 * s1)), b1 = dl[1].read(ms * (31 - 4 * s2));
      const cL = inL * (1 - 0.3 * haunt) + 0.5 * haunt * (a0 + b0), cR = inR * (1 - 0.3 * haunt) + 0.5 * haunt * (a1 + b1);
      const inp = 0.5 * (cL + cR) * 0.35;
      for (let c = 0; c < 2; ++c) {
        let sum = 0; const cd = this.cd[c], cz = this.cz[c], fb = this.cfb[c], cl = this.cl[c];
        for (let j = 0; j < 4; ++j) { const y = cd[j].tap(cl[j] - 1); const z = y * 0.55 + cz[j] * 0.45; cz[j] = z; cd[j].push(inp + z * fb[j]); sum += y; }
        const a = this.ad[c];
        let lenF = this.al[c][0] + 3 * s1 * (c ? -1 : 1); let vv = a[0].read(lenF); let ww = sum * 0.25 + 0.5 * vv; a[0].push(ww); let y = vv - 0.5 * ww;
        lenF = this.al[c][1] + 3 * s2; vv = a[1].read(lenF); ww = y + 0.5 * vv; a[1].push(ww); y = vv - 0.5 * ww;
        this.lpz[c] += (y - this.lpz[c]) * 0.5; this.w[c] = this.lpz[c];
      }
      const wetG = 0.9 * haunt;
      this.oL = cL + this.w[0] * wetG; this.oR = cR + this.w[1] * wetG; this.wetMag += (Math.abs(this.w[0] * wetG) - this.wetMag) * 0.002;
    }
  }

  class Wraithica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); this.vs = Array.from({ length: kSlots }, () => new Voice()); this.vs.forEach(v => v.env.setSr(sr));
      this.stack = []; this.ageCtr = 0; this.lastPitch = -1; this.bendIn = 0; this.mod = 0; this.press = 0; this.exprIn = 1; this.idle = 0; this.cleared = true;
      this.fx = new Bloom(sr); this.sm = {}; for (const k of ['tone', 'breath', 'motion', 'haunt', 'level', 'vib', 'bend', 'press', 'expr']) this.sm[k] = new Sm();
      const c = Math.exp(-1 / (0.02 * sr)); for (const k in this.sm) this.sm[k].c = c;
      const V = this.v, S = this.sm; S.tone.v = V[E.Tone]; S.breath.v = V[E.Breath]; S.motion.v = V[E.Motion]; S.haunt.v = V[E.Haunt]; S.level.v = this.lvlGain(); S.expr.v = 1;
      this.g = { tone: 0, breath: 0, motion: 0, haunt: 0, vibD: 0, bend: 0, press: 0, expr: 1 }; this.mixL = 0; this.mixR = 0; this.lfoShow = 0; this.derive();
    }
    lvlGain() { return Math.pow(10, this.v[E.Level] / 20); }
    bloomRt60() { return 1.5 + 3.5 * this.v[E.Haunt]; }
    set(id, x) {
      if (id < 0 || id >= E.Count) return; const sp = specs[id]; if (!(x === x)) x = sp.def;
      x = clampf(x, sp.min, sp.max); if (sp.labels) x = Math.round(x);
      this.v[id] = x; if (id === E.Preset) this.loadPreset(x); this.derive();
    }
    put(id, x) { this.v[id] = x; this.writeParam(id, x); }
    loadPreset(i) {
      const p = ROWS[clampf(i, 0, ROWS.length - 1)];
      for (let k = 1; k < 13; ++k) this.put(k, p[k]);
    }
    derive() {
      const sr = this.sr, V = this.v, g = Math.max(0.003, V[E.Glide]);
      this.gc = Math.exp(-1 / (g * sr)); this.volC = 1 - Math.exp(-1 / (0.015 * sr)); this.scoopC = Math.exp(-1 / (0.09 * sr)); this.killStep = 1 / (0.004 * sr);
      this.wanderC = 1 - Math.exp(-2 * Math.PI * 1.2 / sr);
      for (const v of this.vs) { v.env.setSr(sr); v.env.set(V[E.Attack], 0.01, 1, V[E.Release]); }
    }
    pitchBend(b) { this.bendIn = clampf(b, -1, 1); } modWheel(m) { this.mod = clampf(m, 0, 1); } pressure(p) { this.press = clampf(p, 0, 1); }
    allNotesOff() { this.stack = []; for (const v of this.vs) if (v.active) { v.gate = false; v.env.gateOff(); } }
    removeFromStack(ch, note) { for (let i = 0; i < this.stack.length; ++i) if (this.stack[i].chan === ch && this.stack[i].note === note) { this.stack.splice(i, 1); return true; } return false; }
    retarget(v, t) { v.dev += v.tgt - t; v.tgt = t; }
    noteOn(note, vel) {
      vel = clampf(vel, 0, 1); const tune = this.noteTune * 0.01; this.noteTune = 0; const ch = 0, V = this.v, model = Math.round(V[E.Model]);
      if (model <= 1) {
        this.removeFromStack(ch, note); const v = this.vs[kMono];
        const legato = this.stack.length > 0 && v.active && v.gate;
        if (this.stack.length < kStack) this.stack.push({ chan: ch, note, vel, tune }); else { this.stack.shift(); this.stack.push({ chan: ch, note, vel, tune }); }
        if (legato && v.model === model) { this.retarget(v, note + tune); v.key = note; v.chan = ch; v.volT = velVol(vel); }
        else this.startVoice(v, model, ch, note, vel, tune);
      } else {
        let pick = -1; const vs = this.vs;
        for (let i = 0; i < kPoly; ++i) if (!vs[i].active) { pick = i; break; }
        if (pick < 0) { let best = 1e9; for (let i = 0; i < kPoly; ++i) if (!vs[i].gate && !vs[i].killing && vs[i].env.v < best) { best = vs[i].env.v; pick = i; } }
        if (pick < 0) { let oldest = Infinity; for (let i = 0; i < kPoly; ++i) if (!vs[i].killing && vs[i].age < oldest) { oldest = vs[i].age; pick = i; } }
        if (pick < 0) pick = 0;
        const v = vs[pick];
        if (v.active) { v.killing = true; v.hasPend = true; v.pModel = model; v.pChan = ch; v.pKey = note; v.pVel = vel; v.pTune = tune; }
        else this.startVoice(v, model, ch, note, vel, tune);
      }
    }
    noteOff(note) {
      const ch = 0, vs = this.vs;
      if (this.stack.length > 0 || vs[kMono].active) {
        const top = this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
        const wasTop = top && top.chan === ch && top.note === note; const had = this.removeFromStack(ch, note); const v = vs[kMono];
        if (had && v.active && v.gate) {
          if (this.stack.length === 0) { v.gate = false; v.env.gateOff(); }
          else if (wasTop) { const h = this.stack[this.stack.length - 1]; this.retarget(v, h.note + h.tune); v.key = h.note; v.chan = h.chan; v.volT = velVol(h.vel); }
        }
      }
      for (let i = 0; i < kPoly; ++i) {
        const v = vs[i]; if (v.active && v.gate && !v.killing && v.chan === ch && v.key === note) { v.gate = false; v.env.gateOff(); }
        if (v.killing && v.hasPend && v.pChan === ch && v.pKey === note) v.hasPend = false;
      }
    }
    startVoice(v, model, ch, key, vel, tune) {
      const V = this.v, sr = this.sr, mono = model <= 1, lastP = this.lastPitch, age = ++this.ageCtr;
      const wasActive = v.active && v.model === model && mono;
      if (!wasActive) v.reset();
      v.active = true; v.gate = true; v.killing = false; v.hasPend = false; v.kg = 1; v.model = model; v.key = key; v.chan = ch; v.age = age; v.vel = vel; v.volT = velVol(vel);
      v.tgt = key + tune; v.t = 0; v.cnt = 0;
      v.noise.s = ((0x9E3779B9 ^ Math.imul(age, 2654435761)) >>> 0) || 1;
      if (!wasActive) {
        v.volS = 0; v.vibPh = 0; v.vibFade = 0; v.ph.fill(0);
        for (let k = 0; k < 8; ++k) { v.ratioJit[k] = 0.7 + 0.6 * rnd01(v.noise); v.shRate[k] = 0.15 + 1.3 * rnd01(v.noise); v.shPh[k] = rnd01(v.noise); }
        v.rubRate = 0.25 + 0.7 * rnd01(v.noise); v.rubPh = rnd01(v.noise); v.slR1 = 0.3 + 0.5 * rnd01(v.noise); v.slR2 = 1.0 + 1.3 * rnd01(v.noise);
        v.slPh1 = rnd01(v.noise); v.slPh2 = rnd01(v.noise);
        v.pan = mono ? 0.5 : clampf(0.5 + 0.35 * ((key - 60) / 30) + 0.2 * v.noise.white(), 0.1, 0.9);
        v.nsv.reset(); v.pitch = (lastP >= 0 && V[E.Glide] > 0.01 && mono) ? lastP : v.tgt;
        if (!mono && lastP >= 0 && V[E.Glide] > 0.05) v.pitch = lastP;
      }
      v.env.setSr(sr); v.env.set(V[E.Attack], 0.01, 1, V[E.Release]); v.env.gateOn(!wasActive);
      if (model === 1) v.scoop = -(0.25 + 0.75 * V[E.Motion]) * (v.pitch === v.tgt ? 1 : 0.4); else v.scoop = 0;
      if (model === 3) {
        const strike = Math.max(0, vel - 0.4) * 1.6, tau = 0.8 + 0.25 * V[E.Release];
        for (let k = 0; k < 8; ++k) { v.sk[k] = strike * waterWeight(k, V[E.Tone]); v.skD[k] = Math.exp(-(1 + 0.6 * k) / (tau * sr)); }
      }
      v.dev = v.pitch - v.tgt; this.lastPitch = v.tgt;
    }
    process(outL, outR, n) {
      if (n <= 0) return; const V = this.v, sr = this.sr, S = this.sm, g = this.g, fx = this.fx, vs = this.vs;
      const tailN = ((V[E.Haunt] > 0.001 ? this.bloomRt60() * 1.4 : 0) + 0.4) * sr;
      for (let i = 0; i < n; ++i) {
        let any = false; for (let q = 0; q < kSlots; ++q) if (vs[q].active) { any = true; break; }
        if (!any && this.idle > tailN) {
          if (!this.cleared) { fx.clear(); this.cleared = true; }
          S.tone.v = V[E.Tone]; S.breath.v = V[E.Breath]; S.motion.v = V[E.Motion]; S.haunt.v = V[E.Haunt]; S.level.v = this.lvlGain();
          outL[i] = outR[i] = 0; continue;
        }
        g.tone = S.tone.next(V[E.Tone]); g.breath = S.breath.next(V[E.Breath]); g.motion = S.motion.next(V[E.Motion]); g.haunt = S.haunt.next(V[E.Haunt]);
        g.vibD = S.vib.next(Math.min(1, V[E.VibDepth] + this.mod)); g.bend = S.bend.next(this.bendIn * V[E.Bend]); g.press = S.press.next(this.press); g.expr = S.expr.next(this.exprIn);
        const level = S.level.next(this.lvlGain());
        this.mixL = 0; this.mixR = 0;
        if (any) for (let q = 0; q < kSlots; ++q) if (vs[q].active) this.renderVoice(vs[q], g, q === kMono);
        if (any) { this.idle = 0; this.cleared = false; } else ++this.idle;
        let mL = this.mixL, mR = this.mixR;
        if (!(Math.abs(mL) < 100)) mL = 0; if (!(Math.abs(mR) < 100)) mR = 0;
        fx.run(mL, mR, g.haunt, this.bloomRt60());
        let yl = fx.oL * level, yr = fx.oR * level;
        if (!(Math.abs(yl) < 100)) yl = 0; if (!(Math.abs(yr) < 100)) yr = 0;
        outL[i] = fastTanh(yl); outR[i] = fastTanh(yr);
      }
    }
    renderVoice(v, g, isMono) {
      const V = this.v, sr = this.sr, isr = 1 / sr, lim45 = 0.45 * sr; let kgain = 1;
      if (v.killing) {
        v.kg -= this.killStep;
        if (v.kg <= 0) { if (v.hasPend) this.startVoice(v, v.pModel, v.pChan, v.pKey, v.pVel, v.pTune); else { v.reset(); } return; }
        kgain = v.kg;
      }
      v.t += isr; v.dev *= this.gc; if (Math.abs(v.dev) < 1e-6) v.dev = 0; v.pitch = v.tgt + v.dev; v.scoop *= this.scoopC;
      v.vibPh += V[E.VibRate] * isr; if (v.vibPh >= 1) v.vibPh -= 1;
      const lfo = sinCyc(v.vibPh);
      if (v.gate && v.t > 0.12) v.vibFade = Math.min(1, v.vibFade + isr / 0.45);
      const model = v.model, vibS = lfo * g.vibD * v.vibFade * VIB[model] * 0.01;
      if (--v.wCnt <= 0) { v.wCnt = Math.floor((0.4 + 0.8 * rnd01(v.noise)) * sr); v.wanderT = v.noise.white(); }
      v.wander += (v.wanderT - v.wander) * this.wanderC;
      const wanderCents = model <= 1 ? 14 * g.motion + 6 * g.haunt : 3 * g.motion + 4 * g.haunt;
      const semis = v.pitch + g.bend + v.scoop + vibS + v.wander * wanderCents * 0.01;
      let slosh = 0;
      if (model === 3) {
        v.slPh1 += v.slR1 * isr; v.slPh2 += v.slR2 * isr; if (v.slPh1 >= 1) v.slPh1 -= 1; if (v.slPh2 >= 1) v.slPh2 -= 1;
        if (--v.slCnt <= 0) { v.slCnt = Math.floor((0.5 + 1.5 * rnd01(v.noise)) * sr); v.slRwT = v.noise.white(); }
        v.slRw += (v.slRwT - v.slRw) * (this.wanderC * 1.5);
        slosh = g.motion * (34 * sinCyc(v.slPh1) + 14 * sinCyc(v.slPh2) + 26 * v.slRw);
      }
      if ((v.cnt & 3) === 0) v.f = clampf(440 * Math.pow(2, (semis - 69) / 12), 8, lim45);
      const f = v.f;
      if ((v.cnt++ & 15) === 0) this.control(v, g, f);
      let s = 0;
      switch (model) {
        case 0: {
          v.ph[0] += f * isr; if (v.ph[0] >= 1) v.ph[0] -= 1;
          const h2 = f * 2 < lim45 ? 0.12 + 0.35 * g.tone : 0, h3 = f * 3 < lim45 ? 0.05 + 0.30 * g.tone : 0;
          s = (sinCyc(v.ph[0]) + h2 * sinCyc(2 * v.ph[0] + 0.1) + h3 * sinCyc(3 * v.ph[0] + 0.3)) * 0.7;
          v.nsv.run(v.noise.white()); s += v.nsv.band * g.breath * 0.12; s *= 1 + 0.08 * g.motion * lfo; break; }
        case 1: {
          v.ph[0] += f * isr; if (v.ph[0] >= 1) v.ph[0] -= 1;
          for (let k = 0; k < v.K; ++k) s += v.amp[k] * sinCyc((k + 1) * v.ph[0] + 0.07 * k);
          v.nsv.run(v.noise.white()); s += v.nsv.band * g.breath * 0.10; s *= 1 + 0.30 * g.motion * sinCyc(v.vibPh + 0.18); break; }
        case 2: {
          const wB = 0.12 + 0.33 * g.motion;
          for (let k = 0; k < 4; ++k) {
            const a = v.amp[k]; if (a <= 0) continue;
            const fk = f * GR[k], d = 0.5 * v.beat[k];
            v.ph[2 * k] += (fk + d) * isr; v.ph[2 * k + 1] += (fk - d) * isr;
            if (v.ph[2 * k] >= 1) v.ph[2 * k] -= 1; if (v.ph[2 * k + 1] >= 1) v.ph[2 * k + 1] -= 1;
            s += a * ((1 - wB) * sinCyc(v.ph[2 * k]) + wB * sinCyc(v.ph[2 * k + 1]));
          }
          v.rubPh += v.rubRate * isr; if (v.rubPh >= 1) v.rubPh -= 1;
          s *= 1 + 0.18 * g.motion * sinCyc(v.rubPh); v.nsv.run(v.noise.white()); s += v.nsv.band * g.breath * 0.06; break; }
        default: {
          const wB = 0.3 + 0.15 * g.motion, sl = slosh * 0.000577623;
          for (let k = 0; k < 8; ++k) {
            v.sk[k] *= v.skD[k]; const a = v.amp[k] + v.sk[k]; if (a <= 1e-6) continue;
            const fk = f * WR[k] * (1 + sl * (1 + 0.12 * k)); if (fk > lim45) continue;
            v.ph[2 * k] += fk * (1 - 0.5 * v.beat[k]) * isr; v.ph[2 * k + 1] += fk * (1 + 0.5 * v.beat[k]) * isr;
            if (v.ph[2 * k] >= 1) v.ph[2 * k] -= 1; if (v.ph[2 * k + 1] >= 1) v.ph[2 * k + 1] -= 1;
            s += a * ((1 - wB) * sinCyc(v.ph[2 * k]) + wB * sinCyc(v.ph[2 * k + 1]));
          }
          v.nsv.run(v.noise.white()); s += v.nsv.band * g.breath * 0.05 * v.env.v; break; }
      }
      v.volS += (v.volT - v.volS) * this.volC;
      const vol = (v.volS + (1 - v.volS) * g.press) * g.expr, e = v.env.next(), amp = (model === 3 ? 1 : e) * vol, out = s * amp * kgain * MGAIN[model];
      const pl = Math.sqrt(1 - v.pan), pr = Math.sqrt(v.pan);
      this.mixL += out * pl * 1.414; this.mixR += out * pr * 1.414;
      if (!(out === out)) { v.reset(); return; }
      const ringing = model === 3 && v.sk[0] > 3e-4;
      if (!v.env.active() && !ringing) { v.active = false; v.gate = false; }
    }
    control(v, g, f) {
      const sr = this.sr, lim = 0.42 * sr;
      switch (v.model) {
        case 0: v.nsv.set(clampf(2800, 300, 0.4 * sr), 0.9, sr); break;
        case 1: {
          let K = 0; while (K < 12 && f * (K + 1) < lim) ++K; v.K = K; const wobB = sinCyc(v.vibPh + 0.45);
          for (let k = 0; k < K; ++k) v.amp[k] = sawWeight(k + 1, g.tone, g.motion, wobB) * 0.8;
          v.nsv.set(clampf(f * 3, 400, 0.4 * sr), 1.2, sr); break; }
        case 2:
          for (let k = 0; k < 4; ++k) { v.amp[k] = f * GR[k] < lim ? glassWeight(k, g.tone) * 0.9 : 0; v.beat[k] = (0.35 + 1.6 * g.motion) * (1 + 0.7 * k) * v.ratioJit[k]; }
          v.nsv.set(clampf(f * 5, 800, 0.4 * sr), 3.5, sr); break;
        default:
          for (let k = 0; k < 8; ++k) {
            v.shPh[k] += 16 * v.shRate[k] / sr; if (v.shPh[k] >= 1) v.shPh[k] -= 1;
            const w = waterWeight(k, g.tone);
            v.amp[k] = f * WR[k] < lim ? w * v.env.v * (0.6 + 0.4 * sinCyc(v.shPh[k])) * 0.9 : 0;
            v.beat[k] = (0.0012 + 0.0045 * g.motion) * (k + 1) * v.ratioJit[k];
          }
          v.nsv.set(clampf(f * 4, 600, 0.4 * sr), 2.5, sr);
      }
    }
  }
  OCC.engines.wraithica = { name: 'Wraithica', blurb: 'Theremin, musical saw, glass harmonica and waterphone with a built-in haunting reverb bloom. Theremin and saw play mono-legato, glass and waterphone are 8-voice.', specs, groups, make: sr => new Wraithica(sr), E };
})();
/* Voxica - vocal synthesizer (formant choir). Port of plugins/voxica/voxica.h, internal synth source only.
   The plugin's Vocoder and Talkbox modes need the host audio input; with no input connected the plugin itself falls back to the Formant synth,
   so here all three modes sound as the formant synth (the Mode / Bands / Bandwidth / Sibilance / Unvoiced / In gain params are kept for fidelity but are not in the UI groups). */
(function () {
  const E = {}; ['Preset', 'Mode', 'Source', 'Vowel', 'Vowel2', 'Morph', 'Shift', 'Tone', 'Breath', 'VibRate', 'VibDepth', 'SeqMode', 'SeqRate', 'SeqDepth', 'Choir', 'Voices', 'Glide', 'Bands', 'Bandwidth', 'Sibilance', 'Unvoiced', 'InGain', 'Attack', 'Release', 'Level', 'Count'].forEach((n, i) => E[n] = i);
  const ROWS = [ // Mode Src Vow Vow2 Morph Shift Tone Breath VibR VibD SeqM SeqR SeqD Choir Voices Glide Bands BW Sib Unv InG Att Rel Level
    ['Ah Choir', [0, 0, 0, 3, 0, 0, 0.50, 0.12, 5.2, 0.30, 0, 0.5, 0, 0.80, 1, 0.04, 3, 0.50, 0.3, 0.5, 6, 0.25, 0.60, -6]],
    ['Oo Pad', [0, 0, 4, 3, 0.3, -2, 0.30, 0.20, 4.5, 0.25, 0, 0.5, 0, 1.00, 1, 0.05, 3, 0.50, 0.3, 0.5, 6, 0.50, 1.20, -6]],
    ['Soprano Aahs', [0, 0, 0, 1, 0.2, 5, 0.70, 0.10, 6.0, 0.40, 0, 0.5, 0, 0.50, 1, 0.04, 3, 0.50, 0.3, 0.5, 6, 0.12, 0.40, -6]],
    ['Bass Voices', [0, 0, 3, 4, 0, -6, 0.45, 0.18, 4.8, 0.20, 0, 0.5, 0, 0.60, 1, 0.05, 3, 0.50, 0.3, 0.5, 6, 0.15, 0.50, -5]],
    ['Wah Vowel Sweep', [0, 1, 1, 3, 0, 0, 0.50, 0.05, 5.0, 0.20, 1, 0.8, 0.80, 0.00, 0, 0.08, 3, 0.50, 0.3, 0.5, 6, 0.02, 0.30, -7]],
    ['Vowel Steps', [0, 2, 0, 3, 0, 0, 0.50, 0.05, 5.0, 0.15, 2, 3.5, 1.00, 0.20, 1, 0.03, 3, 0.50, 0.3, 0.5, 6, 0.02, 0.30, -7]],
    ['Random Talker', [0, 1, 2, 3, 0, 0, 0.55, 0.10, 5.5, 0.20, 3, 5.0, 1.00, 0.00, 0, 0.06, 3, 0.50, 0.3, 0.5, 6, 0.02, 0.30, -7]],
    ['Whisper Voices', [0, 3, 2, 0, 0, 0, 0.50, 0.50, 5.0, 0.00, 0, 0.5, 0, 0.50, 1, 0.04, 3, 0.50, 0.3, 0.5, 6, 0.15, 0.50, -4]],
    ['Classic Vocoder', [1, 1, 0, 3, 0, 0, 0.50, 0.00, 5.0, 0.10, 0, 0.5, 0, 0.20, 1, 0.03, 3, 0.50, 0.6, 0.7, 12, 0.01, 0.20, -6]],
    ['Choral Vocoder', [1, 0, 0, 3, 0, 0, 0.50, 0.10, 5.0, 0.30, 0, 0.5, 0, 0.70, 1, 0.04, 4, 0.45, 0.5, 0.6, 12, 0.08, 0.50, -6]],
    ['Noise Vocoder', [1, 3, 0, 3, 0, 0, 0.50, 0.00, 5.0, 0.00, 0, 0.5, 0, 0.00, 1, 0.03, 4, 0.40, 0.4, 0.0, 12, 0.01, 0.20, -5]],
    ['Talkbox Lead', [2, 1, 0, 3, 0, 0, 0.50, 0.00, 5.5, 0.30, 0, 0.5, 0, 0.00, 0, 0.05, 3, 0.40, 0.5, 0.6, 12, 0.01, 0.25, -6]],
    ['Talkbox Pad', [2, 2, 0, 3, 0, 0, 0.50, 0.00, 4.8, 0.20, 0, 0.5, 0, 0.40, 1, 0.04, 3, 0.50, 0.4, 0.5, 12, 0.06, 0.50, -6]],
  ];
  const d = ROWS[0][1];
  const specs = [
    P('Preset', '', 0, ROWS.length - 1, 0, '%.0f', false, ROWS.map(r => r[0])),
    P('Mode', '', 0, 2, d[0], '%.0f', false, ['Formant synth', 'Vocoder', 'Talkbox']),
    P('Source', '', 0, 3, d[1], '%.0f', false, ['Glottal', 'Saw', 'Pulse', 'Whisper']),
    P('Vowel', '', 0, 4, d[2], '%.2f'), P('Vowel 2', '', 0, 4, d[3], '%.2f'), P('Morph', '', 0, 1, d[4], '%.2f'),
    P('Formant', 'st', -12, 12, d[5], '%+.1f st'), P('Glottal tone', '', 0, 1, d[6], '%.2f'), P('Breath', '', 0, 1, d[7], '%.2f'),
    P('Vib rate', 'Hz', 0.5, 10, d[8], '%.1f Hz'), P('Vib depth', '', 0, 1, d[9], '%.2f'),
    P('Sequence', '', 0, 3, d[10], '%.0f', false, ['Off', 'Sweep', 'Steps', 'Random']), P('Seq rate', 'Hz', 0.05, 12, d[11], '%.2f Hz', true), P('Seq depth', '', 0, 1, d[12], '%.2f'),
    P('Choir', '', 0, 1, d[13], '%.2f'), P('Voices', '', 0, 1, d[14], '%.0f', false, ['Mono legato', 'Poly 8']), P('Glide', 's', 0.003, 3, d[15], '%.3f s', true),
    P('Bands', '', 0, 4, d[16], '%.0f', false, ['8 bands', '12 bands', '16 bands', '20 bands', '24 bands']), P('Bandwidth', '', 0, 1, d[17], '%.2f'),
    P('Sibilance', '', 0, 1, d[18], '%.2f'), P('Unvoiced', '', 0, 1, d[19], '%.2f'), P('In gain', 'dB', -12, 36, d[20], '%+.0f dB'),
    P('Attack', 's', 0.005, 4, d[21], '%.3f s', true), P('Release', 's', 0.02, 8, d[22], '%.2f s', true), P('Level', 'dB', -30, 6, d[23], '%+.1f dB'),
  ];
  const groups = [
    ['Voice', [E.Preset, E.Source, E.Vowel, E.Vowel2, E.Morph, E.Shift, E.Tone, E.Breath, E.Choir, E.Voices, E.Level]],
    ['Vowel sequencer', [E.SeqMode, E.SeqRate, E.SeqDepth]],
    ['Vibrato & envelope', [E.VibRate, E.VibDepth, E.Glide, E.Attack, E.Release]],
  ];
  const ST = new Float64Array(4098); for (let i = 0; i <= 4097; ++i) ST[i] = Math.sin(2 * Math.PI * i / 4096);
  const sinCyc = ph => { const x = ph * 4096; let i = Math.floor(x); const f = x - i; i &= 4095; return ST[i] + (ST[i + 1] - ST[i]) * f; };
  const rnd01 = n => 0.5 + 0.5 * n.white();
  const VT = [
    { f: [650, 1080, 2650, 2900, 3250], a: [0, -6, -7, -8, -22], bw: [80, 90, 120, 130, 140] },
    { f: [400, 1700, 2600, 3200, 3580], a: [0, -14, -12, -14, -20], bw: [70, 80, 100, 120, 120] },
    { f: [290, 1870, 2800, 3250, 3540], a: [0, -15, -18, -20, -30], bw: [40, 90, 100, 120, 120] },
    { f: [400, 800, 2600, 2800, 3000], a: [0, -10, -12, -12, -26], bw: [40, 80, 100, 120, 120] },
    { f: [350, 600, 2700, 2900, 3300], a: [0, -20, -17, -14, -26], bw: [40, 60, 100, 120, 120] },
  ];
  function vowelAt(pos, r) {
    pos = clampf(pos, 0, 4); const i = Math.min(3, Math.floor(pos)), t = pos - i, a = VT[i], b = VT[i + 1];
    for (let k = 0; k < 5; ++k) { r.f[k] = a.f[k] * Math.pow(b.f[k] / a.f[k], t); r.a[k] = Math.pow(10, (a.a[k] + (b.a[k] - a.a[k]) * t) / 20); r.bw[k] = a.bw[k] + (b.bw[k] - a.bw[k]) * t; }
    return r;
  }
  const newF = () => ({ f: new Float64Array(5), a: new Float64Array(5), bw: new Float64Array(5) });
  class FBank {
    constructor() { this.a1 = new Float64Array(5); this.a2 = new Float64Array(5); this.a3 = new Float64Array(5); this.g = new Float64Array(5); this.s1 = new Float64Array(5); this.s2 = new Float64Array(5); }
    set(F, scale, sr) {
      for (let i = 0; i < 5; ++i) {
        const f = clampf(F.f[i] * scale, 40, 0.45 * sr), q = Math.max(0.7, f / Math.max(20, F.bw[i] * scale));
        const gg = Math.tan(kPif * f / sr), k = 1 / q; this.a1[i] = 1 / (1 + gg * (gg + k)); this.a2[i] = gg * this.a1[i]; this.a3[i] = gg * this.a2[i];
        this.g[i] = F.a[i] * k * ((i & 1) ? -1 : 1);
      }
    }
    reset() { this.s1.fill(0); this.s2.fill(0); }
    run(x) {
      let y = 0; const a1 = this.a1, a2 = this.a2, a3 = this.a3, s1 = this.s1, s2 = this.s2, g = this.g;
      for (let i = 0; i < 5; ++i) { const v3 = x - s2[i], v1 = a1[i] * s1[i] + a2[i] * v3, v2 = s2[i] + a2[i] * s1[i] + a3[i] * v3; s1[i] = 2 * v1 - s1[i]; s2[i] = 2 * v2 - s2[i]; y += g[i] * v1; }
      return y;
    }
  }
  const kVoices = 8, kStack = 16, kSubs = 4, kFormGain = 2.7;
  const velVol = v => 0.3 + 0.7 * v;
  const WL = [1, 1, 0.25, 0.8], WR = [1, 0.25, 1, 0.8], DETUNE = [0, 1, -1, 0.55];
  class Sub { constructor() { this.reset(); } reset() { this.ph = 0; this.vp = 0; this.rateMul = 1; this.cents = 0; this.drift = 0; this.driftT = 0; this.g = 0; this.dCnt = 0; } }
  class Voice {
    constructor() { this.env = new Adsr(); this.noise = new Noise(); this.sub = [new Sub(), new Sub(), new Sub(), new Sub()]; this.reset(); }
    reset() {
      this.active = false; this.gate = false; this.killing = false; this.hasPend = false; this.key = 60; this.chan = 0; this.age = 0; this.pChan = 0; this.pKey = 60; this.pVel = 0; this.pTune = 0; this.kg = 1;
      this.f = 261; this.gl = 0; this.gn = 0; this.pitch = 60; this.tgt = 60; this.dev = 0; this.vel = 0.8; this.volS = 0; this.volT = 0.8; this.vibFade = 0; this.t = 0; this.cnt = 0;
      const sr = this.env.sr; this.env = new Adsr(); this.env.setSr(sr); this.noise.s = 0x9E3779B9; for (const s of this.sub) s.reset();
    }
  }
  class Sm { constructor() { this.v = 0; this.c = 0; } next(t) { this.v = t + (this.v - t) * this.c; return this.v; } }

  class Voxica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); this.vs = Array.from({ length: kVoices }, () => new Voice()); this.vs.forEach(v => v.env.setSr(sr));
      this.stack = []; this.ageCtr = 0; this.lastPitch = -1; this.bendIn = 0; this.mod = 0; this.press = 0; this.exprIn = 1; this.idle = 0;
      this.sm = {}; for (const k of ['tone', 'breath', 'shift', 'morph', 'level', 'vib', 'bend', 'press', 'expr', 'choir', 'vow']) this.sm[k] = new Sm();
      const S = this.sm, V = this.v, c = Math.exp(-1 / (0.02 * sr));
      for (const k in S) S[k].c = c;
      S.vow.c = Math.exp(-16 / (0.006 * sr)); S.morph.c = Math.exp(-16 / (0.02 * sr)); S.shift.c = S.morph.c;
      S.tone.v = V[E.Tone]; S.breath.v = V[E.Breath]; S.shift.v = V[E.Shift]; S.morph.v = V[E.Morph]; S.level.v = this.lvlGain(); S.expr.v = 1; S.choir.v = V[E.Choir]; S.vow.v = V[E.Vowel];
      this.bankL = new FBank(); this.bankR = new FBank(); this.seqPh = 0; this.seqHeld = 0; this.seqRng = 12345; this.ctrl = 0; this.curF = vowelAt(0, newF()); this.curPos = 0; this.tmpF = newF();
      this.g = { tone: 0, breath: 0, vibD: 0, bend: 0, press: 0, expr: 1, choir: 0 }; this.sl = 0; this.sr_ = 0; this.os = new Osc(); this.derive();
    }
    lvlGain() { return Math.pow(10, this.v[E.Level] / 20); }
    set(id, x) {
      if (id < 0 || id >= E.Count) return; const sp = specs[id]; if (!(x === x)) x = sp.def;
      x = clampf(x, sp.min, sp.max); if (sp.labels) x = Math.round(x);
      this.v[id] = x; if (id === E.Preset) this.loadPreset(x); this.derive();
    }
    put(id, x) { this.v[id] = x; this.writeParam(id, x); }
    loadPreset(i) { const p = ROWS[clampf(i, 0, ROWS.length - 1)][1]; for (let k = 0; k < 24; ++k) this.put(1 + k, p[k]); }
    derive() {
      const sr = this.sr, V = this.v, g = Math.max(0.003, V[E.Glide]);
      this.gc = Math.exp(-1 / (g * sr)); this.volC = 1 - Math.exp(-1 / (0.015 * sr)); this.killStep = 1 / (0.004 * sr);
      this.subC = 1 - Math.exp(-1 / (0.03 * sr)); this.driftC = 1 - Math.exp(-2 * Math.PI * 6 / sr);
      for (const v of this.vs) { v.env.setSr(sr); v.env.set(V[E.Attack], 0.01, 1, V[E.Release]); }
    }
    pitchBend(b) { this.bendIn = clampf(b, -1, 1); } modWheel(m) { this.mod = clampf(m, 0, 1); } pressure(p) { this.press = clampf(p, 0, 1); }
    allNotesOff() { this.stack = []; for (const v of this.vs) if (v.active) { v.gate = false; v.env.gateOff(); } }
    removeFromStack(ch, note) { for (let i = 0; i < this.stack.length; ++i) if (this.stack[i].chan === ch && this.stack[i].note === note) { this.stack.splice(i, 1); return true; } return false; }
    retarget(v, t) { v.dev += v.tgt - t; v.tgt = t; }
    noteOn(note, vel) {
      vel = clampf(vel, 0, 1); const tune = this.noteTune * 0.01; this.noteTune = 0; const ch = 0, vs = this.vs;
      if (this.v[E.Voices] < 0.5) {
        this.removeFromStack(ch, note); const v = vs[0]; const legato = this.stack.length > 0 && v.active && v.gate;
        if (this.stack.length >= kStack) this.stack.shift(); this.stack.push({ chan: ch, note, vel, tune });
        if (legato) { this.retarget(v, note + tune); v.key = note; v.chan = ch; v.volT = velVol(vel); } else this.startVoice(v, ch, note, vel, tune);
      } else {
        let pick = -1;
        for (let i = 1; i < kVoices; ++i) if (!vs[i].active) { pick = i; break; }
        if (pick < 0 && !vs[0].active) pick = 0;
        if (pick < 0) { let best = 1e9; for (let i = 0; i < kVoices; ++i) if (!vs[i].gate && !vs[i].killing && vs[i].env.v < best) { best = vs[i].env.v; pick = i; } }
        if (pick < 0) { let oldest = Infinity; for (let i = 0; i < kVoices; ++i) if (!vs[i].killing && vs[i].age < oldest) { oldest = vs[i].age; pick = i; } }
        if (pick < 0) pick = 0;
        const v = vs[pick];
        if (v.active) { v.killing = true; v.hasPend = true; v.pChan = ch; v.pKey = note; v.pVel = vel; v.pTune = tune; } else this.startVoice(v, ch, note, vel, tune);
      }
    }
    noteOff(note) {
      const ch = 0, vs = this.vs;
      if (this.stack.length > 0) {
        const top = this.stack[this.stack.length - 1], wasTop = top.chan === ch && top.note === note, had = this.removeFromStack(ch, note), v = vs[0];
        if (had && v.active && v.gate && this.v[E.Voices] < 0.5) {
          if (this.stack.length === 0) { v.gate = false; v.env.gateOff(); }
          else if (wasTop) { const h = this.stack[this.stack.length - 1]; this.retarget(v, h.note + h.tune); v.key = h.note; v.chan = h.chan; v.volT = velVol(h.vel); }
          return;
        }
      }
      for (let i = 0; i < kVoices; ++i) {
        const v = vs[i]; if (v.active && v.gate && !v.killing && v.chan === ch && v.key === note) { v.gate = false; v.env.gateOff(); }
        if (v.killing && v.hasPend && v.pChan === ch && v.pKey === note) v.hasPend = false;
      }
    }
    startVoice(v, ch, key, vel, tune) {
      const V = this.v, age = ++this.ageCtr, wasActive = v.active && V[E.Voices] < 0.5;
      if (!wasActive) v.reset();
      v.active = true; v.gate = true; v.killing = false; v.hasPend = false; v.kg = 1; v.key = key; v.chan = ch; v.age = age; v.vel = vel; v.volT = velVol(vel); v.tgt = key + tune; v.t = 0; v.cnt = 0;
      v.noise.s = ((0x9E3779B9 ^ Math.imul(age, 2654435761)) >>> 0) || 1;
      if (!wasActive) {
        v.volS = 0; v.vibFade = 0; v.pitch = (this.lastPitch >= 0 && V[E.Glide] > 0.01) ? this.lastPitch : v.tgt;
        for (let s = 0; s < kSubs; ++s) { const u = v.sub[s]; u.ph = rnd01(v.noise); u.vp = rnd01(v.noise); u.rateMul = 0.88 + 0.24 * rnd01(v.noise); u.cents = DETUNE[s] * 17; u.g = s === 0 ? 1 : 0; u.drift = 0; u.driftT = 0; u.dCnt = 0; }
        v.sub[0].ph = 0;
      }
      v.env.setSr(this.sr); v.env.set(V[E.Attack], 0.01, 1, V[E.Release]); v.env.gateOn(!wasActive);
      v.dev = v.pitch - v.tgt; this.lastPitch = v.tgt;
    }
    control(g) {
      const V = this.v, S = this.sm, sr = this.sr, dt = 16 / sr; let pos = V[E.Vowel] + (V[E.Vowel2] - V[E.Vowel]) * S.morph.next(V[E.Morph]); const sm = Math.round(V[E.SeqMode]);
      if (sm !== 0) {
        const prev = this.seqPh; this.seqPh += V[E.SeqRate] * dt; const wrapped = this.seqPh >= 1; if (wrapped) this.seqPh -= Math.floor(this.seqPh);
        const d = V[E.SeqDepth];
        if (sm === 1) pos += d * 2 * sinCyc(this.seqPh);
        else if (sm === 2) pos = pos + (Math.floor(this.seqPh * 5) - pos) * d;
        else { if (wrapped || prev > this.seqPh) { this.seqRng = (Math.imul(this.seqRng, 1664525) + 1013904223) >>> 0; this.seqHeld = 4 * (this.seqRng >>> 8) / 16777216; } pos = pos + (this.seqHeld - pos) * d; }
        if (pos < 0) pos = -pos; if (pos > 4) pos = 8 - pos;
      }
      pos = clampf(pos, 0, 4); const p = S.vow.next(pos); this.curPos = p;
      const F = vowelAt(p, this.tmpF), sh = Math.pow(2, S.shift.next(V[E.Shift]) / 12), spread = 0.03 * g.choir;
      for (let i = 0; i < 5; ++i) F.f[i] = Math.min(F.f[i] * sh, 0.45 * sr);
      this.bankL.set(F, 1 - spread, sr); this.bankR.set(F, 1 + spread, sr);
    }
    process(outL, outR, n) {
      if (n <= 0) return; const V = this.v, S = this.sm, g = this.g, vs = this.vs, tailN = 0.25 * this.sr, lvT = this.lvlGain();
      for (let i = 0; i < n; ++i) {
        const gain = S.level.next(lvT);
        g.tone = S.tone.next(V[E.Tone]); g.breath = S.breath.next(V[E.Breath]); g.vibD = S.vib.next(Math.min(1, V[E.VibDepth] + this.mod)); g.bend = S.bend.next(this.bendIn * 2);
        g.press = S.press.next(this.press); g.expr = S.expr.next(this.exprIn); g.choir = S.choir.next(V[E.Choir]);
        if ((this.ctrl++ & 15) === 0) this.control(g);
        let any = false; for (let q = 0; q < kVoices; ++q) if (vs[q].active) { any = true; break; }
        if (!any && this.idle > tailN) { outL[i] = outR[i] = 0; continue; }
        this.sl = 0; this.sr_ = 0;
        if (any) for (let q = 0; q < kVoices; ++q) if (vs[q].active) this.renderVoice(vs[q], g);
        if (any) this.idle = 0; else ++this.idle;
        let yl = this.bankL.run(this.sl) * kFormGain * gain, yr = this.bankR.run(this.sr_) * kFormGain * gain;
        if (!(Math.abs(yl) < 100)) yl = 0; if (!(Math.abs(yr) < 100)) yr = 0;
        outL[i] = fastTanh(yl); outR[i] = fastTanh(yr);
      }
    }
    renderVoice(v, g) {
      const V = this.v, sr = this.sr, isr = 1 / sr; let kgain = 1;
      if (v.killing) {
        v.kg -= this.killStep;
        if (v.kg <= 0) { if (v.hasPend) this.startVoice(v, v.pChan, v.pKey, v.pVel, v.pTune); else v.reset(); return; }
        kgain = v.kg;
      }
      v.t += isr; v.dev *= this.gc; if (Math.abs(v.dev) < 1e-6) v.dev = 0; v.pitch = v.tgt + v.dev;
      if (v.gate && v.t > 0.1) v.vibFade = Math.min(1, v.vibFade + isr / 0.4);
      if ((v.cnt & 3) === 0) {
        v.f = clampf(440 * Math.pow(2, (v.pitch + g.bend - 69) / 12), 8, 0.45 * sr);
        v.gl = Math.max(0.04 + 0.30 * (1 - g.tone), 6 * v.f * isr); v.gn = 0.5 / Math.sqrt(1.2337 / 0.55 + 1.2337 / v.gl);
      }
      ++v.cnt;
      const src = Math.round(V[E.Source]), nSubs = 1 + Math.round(g.choir * 3), vibMax = 45, o = 0.55, driftCents = 2 + 10 * g.choir, detScale = g.choir, lim = 0.45 * sr, os = this.os;
      let mixL = 0, mixR = 0, gsum = 0;
      for (let s = 0; s < kSubs; ++s) {
        const u = v.sub[s], want = s < nSubs ? 1 : 0; u.g += (want - u.g) * this.subC; if (u.g < 1e-4 && want === 0) { u.g = 0; continue; }
        u.vp += V[E.VibRate] * u.rateMul * isr; if (u.vp >= 1) u.vp -= 1;
        if (--u.dCnt <= 0) { u.dCnt = Math.floor((0.08 + 0.12 * rnd01(v.noise)) * sr); u.driftT = v.noise.white() * driftCents; }
        u.drift += (u.driftT - u.drift) * this.driftC;
        const cents = sinCyc(u.vp) * g.vibD * v.vibFade * vibMax + u.drift + u.cents * detScale;
        const f = Math.min(v.f * (1 + 0.000578 * cents + 1.7e-7 * cents * cents), lim), dt = f * isr;
        u.ph += dt; if (u.ph >= 1) u.ph -= 1;
        const p = u.ph, nz = v.noise.white(); let x = 0;
        switch (src) {
          case 0: {
            const c = v.gl; let gate2 = 0;
            if (p < o) { x = 0.5 * kPif / o * sinCyc(0.5 * p / o); gate2 = sinCyc(0.5 * p / o); }
            else if (p < o + c) x = -(kPif * 0.5 / c) * sinCyc(0.25 * (p - o) / c);
            x *= v.gn; x += g.breath * nz * (0.15 + 0.85 * gate2) * 1.4; break; }
          case 1: os.ph = p; x = os.saw(dt) * 0.8 + g.breath * nz * 0.7; break;
          case 2: { os.ph = p; const pw = 0.5 - 0.35 * g.tone, dc = 2 * pw - 1; x = (os.square(dt, pw) - dc) * 1.1 / Math.max(0.3, Math.sqrt(1 - dc * dc)) + g.breath * nz * 0.7; break; }
          default: x = nz * 2.4;
        }
        x *= u.g; mixL += x * WL[s]; mixR += x * WR[s]; gsum += u.g;
      }
      const norm = 1 / Math.sqrt(Math.max(1, gsum));
      v.volS += (v.volT - v.volS) * this.volC; const vol = (v.volS + (1 - v.volS) * g.press) * g.expr, e = v.env.next(), a = e * vol * kgain * norm;
      this.sl += mixL * a; this.sr_ += mixR * a;
      if (!(a === a)) { v.reset(); return; }
      if (!v.env.active()) { v.active = false; v.gate = false; }
    }
  }
  OCC.engines.voxica = { name: 'Voxica', blurb: 'Vocal synthesizer: glottal/saw/pulse/whisper source through five morphing formants, with a choir stack and a vowel sequencer. Vocoder and talkbox presets need a live voice input; without one the plugin itself falls back to this formant synth, as here.', specs, groups, make: sr => new Voxica(sr), E };
})();
/* Clavica - five keyboards of different physics under one set of knobs. Port of plugins/clavica/clavica.h (+ clavgain.inc)
   Model: Electric Piano (tine/reed/bell/bar modes through a pickup law), Clav (string against an anvil, pickup comb), Harpsichord (quill pluck, 8'/4'/both/lute, soundboard),
          Tape Keys (flute/strings/choir/cello tape loops with varispeed, wow/flutter, dropouts, motor spin-up), String Machine (divide-down saws, registration, ensemble).
   What Attack / Position / Damping / Color mean per model:
     EP: hammer hardness / pickup closeness / tine damping / bell.  Clav: hit hardness / pickup position (comb) / damper felt / twang.
     Harpsichord: quill sharpness / pluck position / string damping / soundboard.  Tape: pinch roller / second playhead / tape age / motor (wow, flutter, spin-up).
     String Machine: swell speed / octave blend 16'-8'-4' / string filter / wave (saw to hollow).
   Voice I-IV: EP Tine,Reed,Bell,Bar; Clav Neck,Bridge,Both,Out of phase; Harpsichord 8',4',8'+4',Lute; Tape Flute,Strings,Choir,Cello; Strings Violin,Viola,Cello,Full.
   The tape loops are synthesised once on first use (per tape type) and shared. */
(function () {
  const E = {}; ['Preset', 'Model', 'Voice', 'Attack', 'Position', 'Damping', 'Color', 'Tone', 'Drive', 'Mod', 'Rate', 'Release', 'Tune', 'Level', 'Count'].forEach((n, i) => E[n] = i);
  const PN = ['- (keep)', 'Mellow Tines', 'Bark Tine', 'Reed Wurly', 'Glass Bell', 'Vibra Bar', 'Funk Clav', 'Quack Neck', 'Muted Chick', "Baroque 8'", 'Octave Sparkle', 'Lute Stop', 'Flute Tape', 'String Tape', 'Choir Tape', 'Broken Motor', 'Violin Ensemble', 'Cello Pad'];
  const specs = [
    P('Preset', '', 0, 17, 0, '%.0f', false, PN),
    P('Model', '', 0, 4, 0, '%.0f', false, ['Electric Piano', 'Clav', 'Harpsichord', 'Tape Keys', 'String Machine']),
    P('Voice', '', 0, 3, 0, '%.0f', false, ['I', 'II', 'III', 'IV']),
    P('Attack', '', 0, 1, 0.5), P('Position', '', 0, 1, 0.5), P('Damping', '', 0, 1, 0.4), P('Color', '', 0, 1, 0.5),
    P('Tone', '', 0, 1, 0.5), P('Drive', '', 0, 1, 0.2), P('Mod', '', 0, 1, 0.4), P('Rate', 'Hz', 0.1, 12, 4.5, '%.2f Hz', true),
    P('Release', 's', 0.02, 4, 0.25, '%.2f s', true), P('Tune', 'cents', -100, 100, 0, '%+.0f ct'), P('Level', 'dB', -24, 12, 0, '%+.1f dB'),
  ];
  const groups = [
    ['Instrument', [E.Preset, E.Model, E.Voice]],
    ['Playing', [E.Attack, E.Position, E.Damping, E.Color, E.Release, E.Tune]],
    ['Sound', [E.Tone, E.Drive, E.Mod, E.Rate, E.Level]],
  ];
  const kVoices = 24, kBlock = 128, kExc = 4096, kCenters = 15, kLoopLen = 48000, kTypes = 4, kLoopSr = 24000;
  const EP = 0, CLAV = 1, HARP = 2, TAPE = 3, STR = 4;
  const GAIN = new Float64Array([
    0.4754, 0.4317, 0.4480, 0.4802, 0.5250, 0.6006, 0.7022, 0.8657, 1.0846, 1.4282, 0.4936, 0.4581, 0.4991, 0.5599, 0.6420, 0.7811, 0.9654, 1.2617, 1.6614, 2.3475, 0.4530, 0.4364, 0.4634, 0.5047, 0.5606, 0.6530, 0.7749, 0.9683, 1.3635, 1.7938, 0.4677, 0.4262, 0.4410, 0.4738, 0.5182, 0.5928, 0.6938, 0.8556, 1.0706, 1.4393,
    0.1043, 0.1431, 0.2103, 0.3406, 0.5536, 1.0632, 2.0692, 6.9038, 12, 12, 0.0500, 0.0616, 0.0864, 0.1272, 0.2006, 0.3956, 1.0252, 6.2548, 12, 12, 0.0509, 0.0687, 0.0973, 0.1444, 0.2286, 0.4558, 1.1510, 5.1379, 12, 12, 0.0659, 0.0897, 0.1259, 0.1900, 0.3009, 0.5738, 1.3693, 9.9602, 12, 12,
    0.0731, 0.0908, 0.1313, 0.2007, 0.3175, 0.5830, 1.3609, 4.0015, 12, 12, 0.0500, 0.0740, 0.1087, 0.1803, 0.3503, 0.9445, 3.2915, 12, 12, 12, 0.0500, 0.0523, 0.0771, 0.1213, 0.1913, 0.3526, 0.8542, 3.8093, 12, 12, 0.0780, 0.1046, 0.1618, 0.2773, 0.6102, 1.9513, 5.6451, 12, 12, 12,
    1.0904, 1.4116, 0.9367, 0.9505, 1.0778, 1.3689, 1.1331, 1.1009, 1.4882, 1.5909, 0.7753, 0.6984, 0.7123, 0.7345, 0.7421, 0.7525, 0.7234, 0.8927, 1.0072, 1.7320, 1.0400, 1.0277, 1.0205, 1.0132, 0.9212, 0.9079, 0.9295, 1.0836, 1.3589, 2.1759, 0.7610, 0.6191, 0.6760, 0.7032, 0.6728, 0.6159, 0.6815, 0.8233, 0.9026, 1.6270,
    0.9622, 0.6089, 0.4618, 0.3280, 0.2224, 0.1942, 0.1906, 0.1692, 0.2430, 0.8162, 0.5857, 0.3792, 0.2756, 0.1962, 0.1722, 0.1443, 0.1543, 0.2086, 0.2884, 0.8450, 0.1766, 0.1532, 0.1590, 0.1870, 0.2047, 0.2191, 0.3228, 1.0463, 4.4537, 12, 0.1973, 0.1705, 0.1785, 0.1941, 0.1980, 0.2020, 0.2088, 0.2230, 0.2694, 0.7218]);
  function modelGain(model, vs, note) {
    const x = clampf((note - 24) / 10.5, 0, 8.999), i = Math.floor(x), f = x - i, b = (clampf(model, 0, 4) * 4 + clampf(vs, 0, 3)) * 10;
    return GAIN[b + i] + (GAIN[b + i + 1] - GAIN[b + i]) * f;
  }
  const PRE = [ // model, voice, attack, position, damping, color, tone, drive, mod, rate, release, tune, level
    [0, 0, 0.35, 0.35, 0.35, 0.40, 0.45, 0.10, 0.35, 4.8, 0.30, 0, 0], [0, 0, 0.78, 0.80, 0.30, 0.55, 0.55, 0.40, 0.30, 5.5, 0.20, 0, -1], [0, 1, 0.60, 0.55, 0.50, 0.40, 0.55, 0.30, 0.50, 5.5, 0.15, 0, 0],
    [0, 2, 0.45, 0.40, 0.30, 0.80, 0.60, 0.10, 0.25, 4.0, 0.40, 0, 0], [0, 3, 0.40, 0.30, 0.25, 0.50, 0.50, 0.00, 0.40, 5.0, 0.60, 0, 0], [1, 2, 0.75, 0.45, 0.45, 0.45, 0.60, 0.25, 0.00, 4.5, 0.06, 0, 0],
    [1, 0, 0.65, 0.80, 0.30, 0.65, 0.60, 0.35, 0.25, 0.8, 0.10, 0, 0], [1, 1, 0.55, 0.35, 0.85, 0.30, 0.50, 0.20, 0.00, 4.5, 0.04, 0, 1], [2, 0, 0.60, 0.50, 0.35, 0.55, 0.55, 0.00, 0.15, 1.2, 0.12, 0, 0],
    [2, 2, 0.70, 0.45, 0.40, 0.60, 0.60, 0.00, 0.25, 1.5, 0.12, 0, 0], [2, 3, 0.45, 0.30, 0.50, 0.50, 0.45, 0.05, 0.10, 1.0, 0.10, 0, 1], [3, 0, 0.55, 0.45, 0.30, 0.30, 0.50, 0.10, 0.35, 5.0, 0.35, 0, 0],
    [3, 1, 0.45, 0.60, 0.35, 0.40, 0.50, 0.15, 0.25, 4.8, 0.40, 0, 0], [3, 2, 0.40, 0.70, 0.40, 0.45, 0.55, 0.15, 0.30, 4.5, 0.45, 0, 0], [3, 3, 0.30, 0.50, 0.85, 1.00, 0.40, 0.30, 0.50, 3.0, 0.70, 0, 0],
    [4, 0, 0.35, 0.65, 0.30, 0.25, 0.55, 0.00, 0.80, 4.5, 0.40, 0, 0], [4, 2, 0.25, 0.20, 0.45, 0.20, 0.45, 0.00, 0.70, 3.5, 0.70, 0, 0]];

  // ---- small DSP helpers
  const BQ = { Peak: 0, LowShelf: 1, HighShelf: 2, LowPass: 3, HighPass: 4, BandPass: 5 };
  class Biquad {
    constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; }
    set(t, f, q, gainDb, sr) {
      f = clampf(f, 5, sr * 0.49); q = Math.max(0.05, q);
      const A = Math.pow(10, gainDb / 40), w = 2 * Math.PI * f / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * q); let B0, B1, B2, A0, A1, A2;
      switch (t) {
        case 0: B0 = 1 + al * A; B1 = -2 * cw; B2 = 1 - al * A; A0 = 1 + al / A; A1 = -2 * cw; A2 = 1 - al / A; break;
        case 1: { const s = 2 * Math.sqrt(A) * al; B0 = A * ((A + 1) - (A - 1) * cw + s); B1 = 2 * A * ((A - 1) - (A + 1) * cw); B2 = A * ((A + 1) - (A - 1) * cw - s); A0 = (A + 1) + (A - 1) * cw + s; A1 = -2 * ((A - 1) + (A + 1) * cw); A2 = (A + 1) + (A - 1) * cw - s; break; }
        case 2: { const s = 2 * Math.sqrt(A) * al; B0 = A * ((A + 1) + (A - 1) * cw + s); B1 = -2 * A * ((A - 1) + (A + 1) * cw); B2 = A * ((A + 1) + (A - 1) * cw - s); A0 = (A + 1) - (A - 1) * cw + s; A1 = 2 * ((A - 1) - (A + 1) * cw); A2 = (A + 1) - (A - 1) * cw - s; break; }
        case 3: B0 = (1 - cw) / 2; B1 = 1 - cw; B2 = (1 - cw) / 2; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; break;
        case 4: B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = (1 + cw) / 2; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; break;
        default: B0 = al; B1 = 0; B2 = -al; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al;
      }
      this.b0 = B0 / A0; this.b1 = B1 / A0; this.b2 = B2 / A0; this.a1 = A1 / A0; this.a2 = A2 / A0;
    }
    copyFrom(o) { this.b0 = o.b0; this.b1 = o.b1; this.b2 = o.b2; this.a1 = o.a1; this.a2 = o.a2; }
    run(x) { const y = this.b0 * x + this.z1; this.z1 = this.b1 * x - this.a1 * y + this.z2; this.z2 = this.b2 * x - this.a2 * y; return y; }
    reset() { this.z1 = this.z2 = 0; }
  }
  class OnePoleLP { constructor() { this.a = 0; this.z = 0; } set(hz, sr) { this.a = Math.exp(-2 * Math.PI * clampf(hz, 1, sr * 0.49) / sr); } run(x) { this.z = x * (1 - this.a) + this.z * this.a; return this.z; } reset() { this.z = 0; } }
  class OnePoleHP { constructor() { this.lp = new OnePoleLP(); } set(hz, sr) { this.lp.set(hz, sr); } run(x) { return x - this.lp.run(x); } reset() { this.lp.reset(); } }
  class Smooth { constructor() { this.cur = 0; this.target = 0; this.coef = 0.999; } setTime(s, sr) { this.coef = Math.exp(-1 / Math.max(1, s * sr)); } next() { this.cur = this.target + (this.cur - this.target) * this.coef; return this.cur; } }
  class Rng { constructor() { this.s = 0x91E10DA5; } uni() { let s = this.s; s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; this.s = s; return (s >>> 8) * (1 / 16777216); } bi() { return this.uni() * 2 - 1; } }
  // 2x oversampled nonlinearity: half-band Kaiser FIR (63 taps), zero taps skipped. The nonlinearity is the pre-amp saturator set through the fields pre/bias/tb/comp.
  class Oversampler {
    constructor() {
      const n = 63, half = 31, beta = 9, pi = Math.PI; this.n = n; this.half = half; this.h = new Float64Array(n);
      const b0 = x => { let s = 1, t = 1; for (let k = 1; k < 40; ++k) { t *= (x / (2 * k)) * (x / (2 * k)); s += t; } return s; };
      let sum = 0; for (let k = 0; k < n; ++k) { const x = k - half, sinc = x === 0 ? 0.5 : Math.sin(pi * x / 2) / (pi * x), r = 2 * k / (n - 1) - 1, w = b0(beta * Math.sqrt(Math.max(0, 1 - r * r))) / b0(beta); this.h[k] = sinc * w; sum += sinc * w; }
      for (let k = 0; k < n; ++k) this.h[k] /= sum;
      const ks = []; for (let k = (half & 1) ? 0 : 1; k < n; k += 2) if (k !== half) ks.push(k); this.ks = Int32Array.from(ks); this.hk = Float64Array.from(ks.map(k => this.h[k]));
      this.up = new Float64Array(n); this.dn = new Float64Array(n); this.pu = 0; this.pd = 0; this.pre = 1; this.bias = 0; this.tb = 0; this.comp = 1;
    }
    reset() { this.up.fill(0); this.dn.fill(0); this.pu = this.pd = 0; }
    fir(buf, pos) {
      const n = this.n, ks = this.ks, hk = this.hk; let i0 = pos - this.half; if (i0 < 0) i0 += n; let y = this.h[this.half] * buf[i0];
      for (let j = 0; j < ks.length; ++j) { let idx = pos - ks[j]; if (idx < 0) idx += n; y += hk[j] * buf[idx]; }
      return y;
    }
    sat(x) { return (Math.tanh(x * this.pre + this.bias) - this.tb) * this.comp; }
    run(x) {
      const n = this.n; this.pu = (this.pu + 1) % n; this.up[this.pu] = x * 2; const o0 = this.fir(this.up, this.pu);
      this.pu = (this.pu + 1) % n; this.up[this.pu] = 0; const o1 = this.fir(this.up, this.pu);
      const a = this.sat(o0), b = this.sat(o1);
      this.pd = (this.pd + 1) % n; this.dn[this.pd] = a; this.pd = (this.pd + 1) % n; this.dn[this.pd] = b; return this.fir(this.dn, this.pd);
    }
  }
  const apDelay = (a, w) => 1 - 2 * Math.atan2(a * Math.sin(w), 1 + a * Math.cos(w)) / w;
  const lpDelay = (a, w) => Math.atan2(a * Math.sin(w), 1 - a * Math.cos(w)) / w;
  const lpMag = (a, w) => (1 - a) / Math.sqrt(Math.max(1e-12, 1 + a * a - 2 * a * Math.cos(w)));
  const solveEta = (delay, w) => { let lo = -0.6, hi = 0.25; for (let i = 0; i < 40; ++i) { const m = 0.5 * (lo + hi); if (apDelay(m, w) > delay) lo = m; else hi = m; } return 0.5 * (lo + hi); };
  const pickupCurve = (u, d, reed) => { const lim = d - 0.12; u = clampf(u, -lim, lim); let y = u / (d - u); if (reed) y += 0.9 * u * u; return y * d * 0.5; };
  const pickupDistance = pos => { const q = 1 - clampf(pos, 0, 1); return 1.08 + 2.2 * q * q; };
  const combGain = (g, n) => Math.abs(Math.sin(3.14159265 * g * n)) * 2;
  const polyBlepF = (t, dt) => { if (t < dt) { const x = t / dt; return x + x - x * x - 1; } if (t > 1 - dt) { const x = (t - 1) / dt; return x * x + x + x + 1; } return 0; };

  // ---- tape loops: synthesised once per type, on first use, shared by every instance
  const LOOPS = { data: [null, null, null, null], freq: [new Float64Array(kCenters), new Float64Array(kCenters), new Float64Array(kCenters), new Float64Array(kCenters)] };
  function buildLoops(type) {
    if (LOOPS.data[type]) return; const L = kLoopLen, LS = kLoopSr, pi2 = 6.28318530717959, T = 4096; const sinT = new Float32Array(T); for (let i = 0; i < T; ++i) sinT[i] = Math.sin(pi2 * i / T);
    const data = new Float32Array(kCenters * L);
    for (let ci = 0; ci < kCenters; ++ci) {
      const fc = 440 * Math.pow(2, (24 + 6 * ci - 69) / 12), N = Math.max(1, Math.round(fc * L / LS)), fa = N * LS / L; LOOPS.freq[type][ci] = fa;
      const out = data.subarray(ci * L, (ci + 1) * L);
      const mk = (j, vibCyc, vibDepth, amp, f1, f2, f3, g1, g2, g3, bw, rolloff, cutoff) => ({ j, vibCyc, vibDepth, amp, f1, f2, f3, g1, g2, g3, bw, rolloff, cutoff });
      let vc, breathAmp = 0, breathLo = 2000, breathHi = 6000, amC = 1, amD = 0.1; const partialsMax = 100;
      if (type === 0) { vc = [mk(0, 10, 0.05, 1.0, 0, 0, 0, 0, 0, 0, 0, 0, 6000)]; breathAmp = 0.05; amC = 1; amD = 0.08; }
      else if (type === 1) { vc = [mk(-1, 9, 0.03, 0.8, 0, 0, 0, 0, 0, 0, 0, 1.0, 7000), mk(0, 10, 0.03, 1.0, 0, 0, 0, 0, 0, 0, 0, 1.0, 7000), mk(1, 11, 0.03, 0.9, 0, 0, 0, 0, 0, 0, 0, 1.0, 7000), mk(2, 12, 0.03, 0.7, 0, 0, 0, 0, 0, 0, 0, 1.0, 7000)]; breathAmp = 0.03; breathLo = 3000; breathHi = 9000; amC = 3; amD = 0.12; }
      else if (type === 2) { vc = [mk(-1, 10, 0.05, 1.0, 700, 1100, 2450, 1.0, 0.7, 0.35, 220, 1.0, 5500), mk(0, 11, 0.05, 0.9, 450, 800, 2400, 1.0, 0.5, 0.3, 200, 1.0, 5500), mk(1, 12, 0.05, 1.0, 700, 1150, 2500, 1.0, 0.6, 0.3, 230, 1.0, 5500), mk(2, 13, 0.05, 0.8, 550, 1800, 2500, 1.0, 0.4, 0.3, 240, 1.0, 5500), mk(0, 9, 0.05, 0.7, 330, 800, 2300, 1.0, 0.3, 0.2, 180, 1.0, 5500)]; breathAmp = 0.04; breathLo = 600; breathHi = 3000; amC = 2; amD = 0.1; }
      else { vc = [mk(-1, 7, 0.02, 0.9, 0, 0, 0, 0, 0, 0, 0, 1.3, 1500), mk(0, 8, 0.02, 1.0, 0, 0, 0, 0, 0, 0, 0, 1.3, 1500), mk(1, 9, 0.02, 0.9, 0, 0, 0, 0, 0, 0, 0, 1.3, 1500)]; breathAmp = 0.04; breathLo = 200; breathHi = 1800; amC = 3; amD = 0.2; }
      const nmax = Math.floor(Math.min(partialsMax * 1.2, Math.floor(10500 / fa))), nv = vc.length, tab = new Float32Array(T * nv);
      for (let v = 0; v < nv; ++v) {
        const c = vc[v], a = new Float64Array(nmax + 1); let norm = 0;
        for (let n = 1; n <= nmax; ++n) {
          const fn = n * fa; let amp;
          if (type === 0) { const fl = [1, 0.45, 0.2, 0.08, 0.04, 0.02, 0.01, 0.005]; amp = n <= 8 ? fl[n - 1] : 0; }
          else if (type === 2) { const g = (F, G) => { const x = (fn - F) / c.bw; return G * Math.exp(-0.5 * x * x * (F > 1500 ? 0.25 : 1.0)); }; amp = (1 / Math.pow(n, 0.6)) * (g(c.f1, c.g1) + g(c.f2, c.g2) + g(c.f3, c.g3) + 0.03) * (n === 1 ? 0.7 : 1.0); }
          else amp = 1 / Math.pow(n, c.rolloff);
          amp *= 1 / Math.sqrt(1 + Math.pow(fn / c.cutoff, 4)); a[n] = amp; norm += amp * amp;
        }
        const off = v * T, sn = Math.sqrt(Math.max(1e-9, norm));
        for (let n = 1; n <= nmax; ++n) { const am = a[n] / sn, ph0 = 0.7 * n * n + 1.3 * v, po = Math.round((ph0 % 1) * T); if (am < 1e-5) continue; for (let k = 0; k < T; ++k) tab[off + k] += am * sinT[(n * k + po) & (T - 1)]; }
      }
      const X = 800, nz = new Float32Array(L + X); let s = (0x1234567 + (type * 977 + ci * 131)) >>> 0;
      for (let i = 0; i < nz.length; ++i) { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; nz[i] = (s >>> 8) * (1 / 16777216) * 2 - 1; }
      { const hp = new Biquad(), lpf = new Biquad(); hp.set(BQ.HighPass, breathLo, 0.7, 0, LS); lpf.set(BQ.LowPass, breathHi, 0.7, 0, LS); for (let i = 0; i < nz.length; ++i) nz[i] = lpf.run(hp.run(nz[i])); }
      const nz2 = new Float32Array(L); for (let i = 0; i < L; ++i) { if (i < X) { const t = i / X; nz2[i] = nz[i] * Math.sin(0.5 * 3.14159265 * t) + nz[L + i] * Math.cos(0.5 * 3.14159265 * t); } else nz2[i] = nz[i]; }
      let nrm = 0; for (let i = 0; i < L; ++i) nrm += nz2[i] * nz2[i]; nrm = Math.sqrt(nrm / L); for (let i = 0; i < L; ++i) nz2[i] = nz2[i] / Math.max(1e-9, nrm);
      for (let i = 0; i < L; ++i) {
        const t = i / L; let sum = 0;
        for (let v = 0; v < nv; ++v) {
          const c = vc[v], cyc = (N + c.j) * t + (c.vibDepth / pi2) * Math.sin(pi2 * c.vibCyc * t), ph = cyc - Math.floor(cyc), fi = ph * T, i0 = Math.floor(fi), fr = fi - i0, o = v * T;
          const val = tab[o + (i0 & (T - 1))] + (tab[o + ((i0 + 1) & (T - 1))] - tab[o + (i0 & (T - 1))]) * fr;
          sum += c.amp * val * (1 + 0.1 * Math.sin(pi2 * (nv > 1 ? 1 + v : 1) * t + 1.7 * v));
        }
        const am = 1 + amD * Math.sin(pi2 * amC * t) + 0.5 * amD * Math.sin(pi2 * (amC + 1) * t + 0.9), bam = 0.6 + 0.4 * Math.sin(pi2 * 2 * t + 0.3);
        out[i] = sum * am + breathAmp * (type === 3 ? 3 : 1) * bam * nz2[i] * Math.sqrt(nv);
      }
      let e = 0; for (let i = 0; i < L; ++i) e += out[i] * out[i]; const g = 0.2 / Math.sqrt(Math.max(1e-12, e / L)); for (let i = 0; i < L; ++i) out[i] *= g;
      let mean = 0; for (let i = 0; i < L; ++i) mean += out[i]; mean /= L; for (let i = 0; i < L; ++i) out[i] -= mean;
    }
    LOOPS.data[type] = data;
  }

  class Loop { constructor() { this.D = 2; this.M = 0; this.eta = 0; this.ez = 0; this.lpz = 0; this.alp = 0; this.ad = 0; this.g = 0.99; this.dgF = 0.99; this.ap0 = 0; this.ap1 = 0; this.w = 0; this.buf = null; } }
  class CV {
    constructor() {
      this.mre = new Float64Array(4); this.mim = new Float64Array(4); this.mc = new Float64Array(4); this.ms = new Float64Array(4); this.lp = [new Loop(), new Loop()];
      this.exc = new Float32Array(kExc); this.sw = new Float64Array(2); this.ph = new Float64Array(2); this.sph = new Float64Array(3); this.reset();
    }
    reset() {
      this.on = false; this.gate = false; this.model = 0; this.vsel = 0; this.note = -1; this.age = 0; this.vel = 0; this.env = 0; this.rel = 1; this.relK = 1; this.fadeL = 0; this.fadeR = 0; this.lastL = 0; this.lastR = 0; this.gain = 1; this.dmp = 0;
      this.mre.fill(0); this.mim.fill(0); this.mc.fill(0); this.ms.fill(0); this.pd = 1.6; this.tz = 0; this.tenv = 0; this.tk = 0.99; this.tamp = 0; this.reed = false;
      this.ns = 1; this.tau1 = 0; this.tau2 = 0; this.n1 = 1; this.n2 = 1; this.w1 = 1; this.w2 = 0; this.sw[0] = 1; this.sw[1] = 1; this.pick = 0; this.exc.fill(0); this.exN = 0; this.exK = 0; this.exL = 0; this.bp = 1; this.clickEnv = 0; this.clickK = 0.99; this.clickAmp = 0;
      this.ph[0] = 0; this.ph[1] = 0; this.rate0 = 1; this.aEnv = 0; this.aK = 0.01; this.tlp = 0; this.dropT = 0; this.dropG = 1; this.sag = 1; this.tpan = 0; this.ltype = 0; this.lci = 0;
      this.sph[0] = this.sph[1] = this.sph[2] = 0; this.sdt = 0;
      for (const l of this.lp) { l.ez = 0; l.lpz = 0; l.ap0 = 0; l.ap1 = 0; l.w = 0; }
    }
  }

  class Clavica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); sr = this.sr; this.model = 0;
      let need = Math.floor(2 * sr / 22) + 64; this.bufLen = 1; while (this.bufLen < need) this.bufLen <<= 1; this.mask = this.bufLen - 1;
      this.pool = new Float32Array(kVoices * 2 * this.bufLen); this.voices = [];
      for (let i = 0; i < kVoices; ++i) { const v = new CV(); for (let s = 0; s < 2; ++s) v.lp[s].buf = this.pool.subarray((i * 2 + s) * this.bufLen, (i * 2 + s + 1) * this.bufLen); this.voices.push(v); }
      this.rng = new Rng(); this.busBuf = [0, 1, 2].map(() => [new Float64Array(kBlock), new Float64Array(kBlock)]); this.spd = new Float64Array(kBlock);
      this.gtime = 0; this.ensPh = 0; this.lfoPh = 0; this.slowPh = 0; this.wowPh = 0; this.flutPh = 0; this.motor = 1; this.motorTarget = 1; this.idle = 0; this.drift = 0; this.driftT = 0; this.hissLp = 0;
      this.sTone = new Smooth(); this.sDrive = new Smooth(); this.sLevel = new Smooth(); this.sTrem = new Smooth(); this.sWet = new Smooth(); this.sDry = new Smooth(); this.sBase = new Smooth(); this.sDepth = new Smooth();
      this.sTap2 = new Smooth(); this.sTap3 = new Smooth(); this.sPos = new Smooth(); this.sDamp = new Smooth(); this.sColor = new Smooth();
      this.sm = [this.sTone, this.sDrive, this.sLevel, this.sTrem, this.sWet, this.sDry, this.sBase, this.sDepth, this.sTap2, this.sTap3, this.sPos, this.sDamp, this.sColor]; this.sm.forEach(s => s.setTime(0.03, sr));
      this.snap = true; this.lastTone = -9; this.dl = [new DelayLine(Math.floor(0.04 * sr) + 8), new DelayLine(Math.floor(0.04 * sr) + 8)];
      this.dcL = new OnePoleHP(); this.dcR = new OnePoleHP(); this.dcL.set(18, sr); this.dcR.set(18, sr);
      this.osL = new Oversampler(); this.osR = new Oversampler(); this.cabL = new OnePoleLP(); this.cabR = new OnePoleLP(); this.cabL.set(7500, sr); this.cabR.set(7500, sr);
      this.dc2L = new OnePoleHP(); this.dc2R = new OnePoleHP(); this.dc2L.set(12, sr); this.dc2R.set(12, sr);
      this.toneHiL = new Biquad(); this.toneHiR = new Biquad(); this.toneLoL = new Biquad(); this.toneLoR = new Biquad(); this.regA = new Biquad(); this.regB = new Biquad(); this.regC = new Biquad();
      this.bodyBp = []; const bf = [90, 175, 310, 620, 1250], bq = [5, 6, 6, 5, 4]; for (let i = 0; i < 5; ++i) { const b = new Biquad(); b.set(BQ.BandPass, bf[i], bq[i], 0, sr); this.bodyBp.push(b); }
      this.lastReg0 = -9; this.lastReg3 = -9; this.outLev = 0; this.motor = this.motorTarget = 1 - 0.45 * this.v[E.Color]; this.idle = 3; this.tapeActive = false;
      this.modelTargets();
    }
    noteFreq(note, extra = 0) { return 440 * Math.pow(2, (note - 69) / 12 + (this.v[E.Tune] + this.noteTune + extra) / 1200); }
    set(id, x) {
      if (id < 0 || id >= E.Count) return; const sp = specs[id]; x = clampf(x, sp.min, sp.max); if (sp.labels) x = Math.round(x); this.v[id] = x;
      if (id === E.Preset) { if (x > 0) this.applyPreset(x); return; }
      if (id === E.Model) this.model = x;
      if ((id === E.Model || id === E.Voice) && Math.round(this.v[E.Model]) === TAPE) buildLoops(Math.round(this.v[E.Voice]));
      this.modelTargets();
    }
    applyPreset(p) {
      const t = PRE[clampf(p, 1, 17) - 1];
      for (let i = 0; i < 13; ++i) { this.v[E.Model + i] = t[i]; this.writeParam(E.Model + i, t[i]); }
      this.model = Math.round(this.v[E.Model]); if (this.model === TAPE) buildLoops(Math.round(this.v[E.Voice])); this.modelTargets();
    }
    modelTargets() {
      const V = this.v, mod = V[E.Mod], m = this.model;
      this.sTone.target = V[E.Tone]; this.sDrive.target = V[E.Drive]; this.sLevel.target = Math.pow(10, V[E.Level] / 20); this.sPos.target = V[E.Position]; this.sDamp.target = V[E.Damping]; this.sColor.target = V[E.Color];
      let trem = 0, wet = 0, dry = 1, base = 8, depth = 0, tap2 = 0, tap3 = 0;
      switch (m) {
        case EP: trem = mod * 0.9; break;
        case CLAV: wet = 0.5 * mod; dry = 1 - 0.4 * mod; base = 10; depth = 2.0 * mod; tap2 = 1; break;
        case HARP: wet = 0.55 * mod; dry = 1 - 0.3 * mod; base = 11; depth = 2.6 * mod; tap2 = 1; break;
        case TAPE: wet = 1; dry = 0; base = 4; depth = mod * 0.9 * Math.min(1, 5 / Math.max(0.1, V[E.Rate])); break;
        default: wet = 0.35 + 0.65 * mod; dry = 1 - 0.5 * wet; base = 10; depth = 4.0 * mod; tap2 = 1; tap3 = 1;
      }
      if (mod <= 0.001 && m !== EP) { wet = 0; dry = 1; depth = 0; }
      this.sTrem.target = trem; this.sWet.target = wet; this.sDry.target = dry; this.sBase.target = base; this.sDepth.target = depth; this.sTap2.target = tap2; this.sTap3.target = tap3;
    }
    pitchBend() { } modWheel() { } pressure() { }
    allNotesOff() { for (const v of this.voices) if (v.on) this.release(v); }
    release(v) {
      v.gate = false; if (v.model === CLAV || v.model === HARP) return;
      const T = Math.max(0.02, this.v[E.Release]), sr = this.sr; v.relK = Math.pow(10, -3 / (T * sr));
      if (v.model === TAPE) v.relK = Math.pow(10, -3 / (Math.max(0.05, T * 0.6) * sr));
    }
    noteOff(note) { for (const v of this.voices) if (v.on && v.gate && v.note === note) this.release(v); }
    noteOn(note, vel) {
      vel = clampf(vel, 0.01, 1); note = clampf(Math.round(note), 0, 127); let idx = -1, bestCost = 1e30;
      for (let i = 0; i < kVoices; ++i) {
        const v = this.voices[i]; if (!v.on) { idx = i; bestCost = -1; break; }
        const cost = (v.gate ? 1e6 : 0) + v.env * 1e3 - v.age * 1e-7 + (v.note === note ? -5e5 : 0); if (cost < bestCost) { bestCost = cost; idx = i; }
      }
      const v = this.voices[idx], fl = v.on ? v.lastL : 0, fr = v.on ? v.lastR : 0; v.reset();
      for (let s = 0; s < 2; ++s) v.lp[s].buf.fill(0);
      v.fadeL = fl; v.fadeR = fr; v.on = true; v.gate = true; v.model = this.model; v.vsel = Math.round(this.v[E.Voice]); v.note = note; v.vel = vel; v.rel = 1; v.relK = 1; v.env = 0.1;
      switch (v.model) { case EP: this.startEP(v, note, vel); break; case CLAV: this.startClav(v, note, vel); break; case HARP: this.startHarpsi(v, note, vel); break; case TAPE: this.startTape(v, note, vel); break; default: this.startStrings(v, note, vel); }
    }
    // ---- electric piano
    startEP(v, note, vel) {
      const R = [[1, 6.267, 17.55, 34.4], [1, 6.267, 17.55, 34.4], [1, 6.267, 17.55, 34.4], [1, 2.756, 5.404, 8.933]];
      const A = [[1, 0.5, 0.13, 0.05], [1, 0.3, 0.1, 0.04], [0.8, 1, 0.2, 0.08], [1, 0.55, 0.3, 0.14]];
      const T = [[1, 0.22, 0.08, 0.04], [0.55, 0.15, 0.06, 0.03], [1, 0.5, 0.12, 0.05], [1, 0.5, 0.25, 0.12]];
      const V = this.v, sr = this.sr, vs = v.vsel, f0 = this.noteFreq(note), hard = V[E.Attack], bell = V[E.Color];
      const T0 = 7 * Math.pow(2, -(note - 48) / 20) * Math.pow(2, -3.2 * V[E.Damping]), sc = 0.22 + 0.78 * Math.pow(vel, 1.25);
      for (let k = 0; k < 4; ++k) {
        const f = f0 * R[vs][k]; let amp = A[vs][k] * sc;
        if (k > 0) amp *= (0.2 + 1.1 * hard) * (0.5 + 0.5 * vel) * (k === 1 ? (0.3 + 1.4 * bell) : 1);
        if (f > sr * 0.45) amp = 0;
        const t60 = Math.max(0.02, T0 * T[vs][k]), r = Math.exp(-6.9078 / (t60 * sr)), w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr;
        v.mc[k] = r * Math.cos(w); v.ms[k] = r * Math.sin(w); v.mre[k] = 0; v.mim[k] = amp * 0.5;
      }
      v.pd = pickupDistance(V[E.Position]) + (vs === 3 ? 0.9 : 0); v.reed = vs === 1; v.tamp = 0.05 * hard * vel; v.tenv = 1; v.tk = Math.exp(-1 / (0.005 * sr)); v.gain = modelGain(EP, vs, note);
    }
    renderEP(v, m, bl, br) {
      let e2 = 0; const d = v.pd, reed = v.reed, mc = v.mc, ms = v.ms, mre = v.mre, mim = v.mim, rng = this.rng;
      for (let i = 0; i < m; ++i) {
        let u = 0;
        for (let k = 0; k < 4; ++k) { const re = mc[k] * mre[k] - ms[k] * mim[k], im = ms[k] * mre[k] + mc[k] * mim[k]; mre[k] = re; mim[k] = im; u += re; }
        let y = pickupCurve(u, d, reed);
        if (v.tenv > 1e-4) { const nz = rng.bi(); v.tz += 0.3 * (nz - v.tz); y += v.tz * v.tenv * v.tamp; v.tenv *= v.tk; }
        v.rel *= v.relK; const o = y * v.rel * v.gain + v.fadeL; v.fadeL *= 0.995; bl[i] += o; br[i] += o; e2 += o * o;
      }
      v.env = Math.max(Math.sqrt(e2 / m), v.env * 0.985);
    }
    // ---- string models
    setupLoop(s, f, T60, alp, M, ad, buf) {
      const sr = this.sr, V = this.v; alp = Math.pow(clampf(alp, 0, 0.99), 48000 / sr);
      f = clampf(f, 24, sr * 0.17); const w0 = 2 * Math.PI * f / sr, P = sr / f;
      const need = P - (M * apDelay(ad, w0) + lpDelay(alp, w0)); let Dint = Math.floor(need - 1), del = need - Dint; if (Dint < 1) { Dint = 1; del = clampf(need - 1, 1, 2); }
      if (Dint > this.bufLen / 2 - 4) { Dint = this.bufLen / 2 - 4; del = 1; }
      s.D = Dint; s.eta = solveEta(del, w0); s.alp = alp; s.ad = ad; s.M = M; s.buf = buf;
      const G = Math.pow(10, -3 / (f * Math.max(0.02, T60))); s.g = clampf(G / lpMag(alp, w0), 0, 0.99995); s.dgF = Math.pow(10, -3 / (f * Math.max(0.02, V[E.Release])));
    }
    makeExcitation(v, pole, area, beta, P) {
      const sr = this.sr, L = clampf(Math.floor(sr * 0.012), 16, kExc - 200); let z1 = 0, z2 = 0, sum = 0; const p = Math.pow(clampf(pole, 0, 0.98), 48000 / sr);
      for (let k = 0; k < L; ++k) { const x = k === 0 ? 1 : 0; z1 += (1 - p) * (x - z1); z2 += (1 - p) * (z1 - z2); v.exc[k] = z2; sum += z2; }
      const nrm = sum > 0 ? area / sum : 0; for (let k = 0; k < L; ++k) v.exc[k] *= nrm; for (let k = L; k < kExc; ++k) v.exc[k] = 0;
      v.bp = clampf(Math.round(beta * P), 1, kExc - L - 2); v.exL = L; v.exN = L + v.bp; v.exK = 0;
    }
    startClav(v, note, vel) {
      const V = this.v, sr = this.sr, f0 = clampf(this.noteFreq(note), 24, sr * 0.17), hard = V[E.Attack], P = sr / f0; v.ns = 1;
      const T60 = 3 * Math.pow(2, -(note - 48) / 24) * Math.pow(2, -2.5 * V[E.Damping]), alp = 0.02 + 0.45 * Math.pow(1 - hard, 1.5), M = P > 12 ? 2 : 0, ad = -0.5 * V[E.Color];
      this.setupLoop(v.lp[0], f0, T60, alp, M, ad, v.lp[0].buf);
      this.makeExcitation(v, 0.88 * (1 - 0.8 * hard), Math.pow(vel, 0.8) * 0.05 * (sr / f0), 0.12, P);
      const pos = V[E.Position], g1 = 0.22 + 0.28 * pos, g2 = 0.06 + 0.14 * pos; v.pick = v.vsel;
      v.tau1 = g1 * P; v.tau2 = g2 * P; v.n1 = 1 / Math.max(0.3, combGain(g1, 1)); v.n2 = 1 / Math.max(0.3, combGain(g2, 1));
      v.clickAmp = (0.03 + 0.25 * hard) * vel; v.clickEnv = 1; v.clickK = Math.exp(-1 / (0.003 * sr)); v.gain = modelGain(CLAV, v.vsel, note);
    }
    startHarpsi(v, note, vel) {
      const V = this.v, sr = this.sr, f0 = this.noteFreq(note), hard = V[E.Attack], vs = v.vsel, beta0 = vs === 3 ? 0.06 : (vs === 1 ? 0.12 : 0.14), beta = beta0 * (0.6 + 0.8 * V[E.Position]);
      v.ns = vs === 2 ? 2 : 1; let Tm = 4.5 * Math.pow(2, -(note - 48) / 20) * Math.pow(2, -2.2 * V[E.Damping]); if (vs === 3) Tm *= 0.55;
      const alp = 0.02 + 0.4 * Math.pow(1 - hard, 1.5) + (vs === 3 ? 0.2 : 0), fs0 = vs === 1 ? 2 * f0 : f0, P0 = sr / clampf(fs0, 24, sr * 0.17);
      this.setupLoop(v.lp[0], fs0, vs === 1 ? Tm * 0.6 : Tm, alp, 1, -0.1, v.lp[0].buf); v.sw[0] = 1;
      if (vs === 2) { this.setupLoop(v.lp[1], 2 * f0, Tm * 0.6, alp * 0.8, 1, -0.1, v.lp[1].buf); v.sw[1] = 0.7; }
      const velc = 0.78 + 0.22 * Math.pow(vel, 0.7);
      this.makeExcitation(v, 0.55 + 0.4 * (1 - hard) * (0.9 + 0.1 * vel) * 0.95 - 0.3 * hard * 0.6, velc * 0.05 * (sr / Math.min(sr * 0.17, Math.max(24, f0))), beta, P0);
      v.clickAmp = 0.02 + 0.06 * hard; v.clickEnv = 1; v.clickK = Math.exp(-1 / (0.004 * sr)); v.gain = modelGain(HARP, vs, note);
    }
    renderString(v, m, bl, br) {
      const msk = this.mask, clav = v.model === CLAV, dmpUp = 1 - Math.exp(-1 / (0.006 * this.sr)), rng = this.rng; let e2 = 0;
      for (let i = 0; i < m; ++i) {
        const tgt = v.gate ? 0 : 1; v.dmp += (tgt - v.dmp) * dmpUp;
        let ex = 0;
        if (v.exK < v.exN) { const k = v.exK, e0 = k < v.exL ? v.exc[k] : 0, k2 = k - v.bp, e1 = (k2 >= 0 && k2 < v.exL) ? v.exc[k2] : 0; ex = e0 - e1; ++v.exK; }
        let out = 0;
        for (let s = 0; s < v.ns; ++s) {
          const L = v.lp[s], buf = L.buf, x = buf[(L.w - L.D) & msk]; let y = x;
          { const t = L.eta * y + L.ez; L.ez = y - L.eta * t; y = t; }
          if (L.M > 0) { let t = L.ad * y + L.ap0; L.ap0 = y - L.ad * t; y = t; if (L.M > 1) { t = L.ad * y + L.ap1; L.ap1 = y - L.ad * t; y = t; } }
          y = (1 - L.alp) * y + L.alp * L.lpz; L.lpz = y;
          y = y * (L.g * (1 - v.dmp * (1 - L.dgF))) + ex;
          if (clav) {
            let pos = L.D + v.tau1, i0 = Math.floor(pos), fr = pos - i0; const l1 = buf[(L.w - i0) & msk] + (buf[(L.w - i0 - 1) & msk] - buf[(L.w - i0) & msk]) * fr;
            pos = L.D + v.tau2; i0 = Math.floor(pos); fr = pos - i0; const l2 = buf[(L.w - i0) & msk] + (buf[(L.w - i0 - 1) & msk] - buf[(L.w - i0) & msk]) * fr;
            const c1 = (x - l1) * v.n1, c2 = (x - l2) * v.n2;
            switch (v.pick) { case 0: out += c1; break; case 1: out += c2; break; case 2: out += 0.7 * (c1 + c2); break; default: out += 0.8 * (c1 - c2); }
          } else out += x * v.sw[s];
          buf[L.w & msk] = y; L.w = (L.w + 1) & msk;
        }
        if (v.clickEnv > 1e-4) { const nz = rng.bi(); out += nz * v.clickEnv * v.clickAmp * (clav ? 1 : 0.5); v.clickEnv *= v.clickK; }
        const o = out * v.gain + v.fadeL; v.fadeL *= 0.995; bl[i] += o; br[i] += o; e2 += o * o;
      }
      v.env = Math.max(Math.sqrt(e2 / m), v.env * 0.985);
    }
    // ---- tape keys
    startTape(v, note, vel) {
      const V = this.v, sr = this.sr, type = clampf(v.vsel, 0, 3), ci = clampf(Math.round((note - 24) / 6), 0, kCenters - 1); v.ltype = type; v.lci = ci; buildLoops(type);
      const f = this.noteFreq(note), fa = LOOPS.freq[type][ci];
      v.rate0 = clampf(f / fa * kLoopSr / sr, 0.05, 6);
      const off = this.rng.uni(); v.ph[0] = off * kLoopLen; v.ph[1] = (v.ph[0] + 0.37 * kLoopLen) % kLoopLen;
      const a = V[E.Attack]; v.aK = 1 - Math.exp(-1 / ((0.004 + 0.18 * Math.pow(1 - a, 1.5)) * sr)); v.aEnv = 0; v.gain = (0.75 + 0.25 * vel) * modelGain(TAPE, type, note); v.sag = 1; v.tpan = ((note - 60) / 40) * 0.3;
      v.dropT = (0.3 + 3 * this.rng.uni()) * sr; v.dropG = 1; this.tapeActive = true; this.idle = 0; this.motorTarget = 1;
    }
    renderTape(v, m, bl, br) {
      const loop = LOOPS.data[v.ltype], base = v.lci * kLoopLen, Ln = kLoopLen, sr = this.sr, V = this.v; let e2 = 0; const sp = this.sPos.cur, dmp = this.sDamp.cur, rate = v.rate0;
      const lpA = 1 - Math.exp(-2 * 3.14159265 * Math.min(0.45 * sr, 11000 * Math.pow(2, -3.4 * dmp)) / sr), dropRate = dmp * dmp * 1.2;
      const stop = !v.gate, stopK = stop ? Math.exp(-1 / (Math.max(0.05, V[E.Release] * 0.35) * sr)) : 1, spd = this.spd, rng = this.rng;
      for (let i = 0; i < m; ++i) {
        const sm = spd[i]; v.sag *= stopK; v.rel *= v.relK; if (!stop) v.aEnv += (1 - v.aEnv) * v.aK;
        const inc = rate * sm * v.sag; let s0 = 0, s1 = 0;
        for (let h = 0; h < 2; ++h) {
          let p = v.ph[h] + inc; if (p >= Ln) p -= Ln; else if (p < 0) p += Ln; v.ph[h] = p;
          const i1 = Math.floor(p), t = p - i1; const y0 = loop[base + ((i1 - 1 + Ln) % Ln)], y1 = loop[base + (i1 % Ln)], y2 = loop[base + ((i1 + 1) % Ln)], y3 = loop[base + ((i1 + 2) % Ln)];
          const c1 = 0.5 * (y2 - y0), c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3, c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2), val = ((c3 * t + c2) * t + c1) * t + y1;
          if (h === 0) s0 = val; else s1 = val;
        }
        v.dropT -= 1; let dgT = 1;
        if (v.dropT <= 0) { if (v.dropT > -0.04 * sr) dgT = 0.35; else v.dropT = (0.2 + 4 * rng.uni()) * sr / Math.max(0.05, dropRate + 0.05); if (dropRate < 0.01) { dgT = 1; v.dropT = 1e9; } }
        v.dropG += (dgT - v.dropG) * 0.01;
        const mid = (s0 + sp * s1) / (1 + sp), sd = 0.5 * sp * (s0 - s1); let l = mid + sd, r = mid - sd;
        v.tlp += lpA * ((l + r) * 0.5 - v.tlp); const damp = v.tlp - (l + r) * 0.5; l += damp; r += damp;
        const g = v.aEnv * v.rel * v.gain * v.dropG * 0.5, pl = 1 - v.tpan * 0.5, pr = 1 + v.tpan * 0.5;
        const ol = l * g * pl + v.fadeL, orr = r * g * pr + v.fadeR; v.fadeL *= 0.995; v.fadeR *= 0.995; bl[i] += ol; br[i] += orr; e2 += 0.5 * (ol * ol + orr * orr);
      }
      v.env = Math.max(Math.sqrt(e2 / m), v.env * 0.985);
    }
    // ---- string machine
    startStrings(v, note, vel) {
      const V = this.v, sr = this.sr, f = this.noteFreq(note); v.sdt = f / sr;
      for (let o = 0; o < 3; ++o) { const fo = f * (o === 0 ? 0.5 : (o === 1 ? 1 : 2)), x = this.gtime * fo; v.sph[o] = x - Math.floor(x); }
      const a = V[E.Attack]; v.aK = 1 - Math.exp(-1 / ((0.006 + 0.35 * Math.pow(1 - a, 1.4)) * sr)); v.aEnv = 0; v.gain = (0.8 + 0.2 * vel) * modelGain(STR, v.vsel, note);
    }
    renderStrings(v, m, bl) {
      const pos = this.sPos.cur, col = this.sColor.cur, w16 = clampf((0.5 - pos) * 2, 0, 1), w4 = clampf((pos - 0.5) * 2, 0, 1), w8 = 1 - 0.5 * Math.max(w16, w4); let e2 = 0;
      const dts = [v.sdt * 0.5, v.sdt, v.sdt * 2], ws = [w16 * 0.9, w8, w4 * 0.8], stop = !v.gate, sph = v.sph;
      for (let i = 0; i < m; ++i) {
        let s = 0;
        for (let o = 0; o < 3; ++o) {
          if (ws[o] <= 0) { sph[o] += dts[o]; sph[o] -= Math.floor(sph[o]); continue; }
          const t = sph[o], dt = Math.min(0.45, dts[o]); let saw = 2 * t - 1 - polyBlepF(t, dt);
          if (col > 0.001) { let t2 = t + 0.5; if (t2 >= 1) t2 -= 1; const saw2 = 2 * t2 - 1 - polyBlepF(t2, dt); saw = saw * (1 - col) + (saw - saw2) * 0.7 * col; }
          if (dts[o] > 0.45) saw = 0;
          s += saw * ws[o]; sph[o] += dts[o]; sph[o] -= Math.floor(sph[o]);
        }
        v.aEnv += ((stop ? 0 : 1) - v.aEnv) * (stop ? 0 : v.aK); v.rel *= v.relK;
        const o = s * v.aEnv * v.rel * v.gain + v.fadeL; v.fadeL *= 0.995; bl[i] += o; e2 += o * o;
      }
      v.env = Math.max(Math.sqrt(e2 / m), v.env * 0.985);
    }
    process(outL, outR, n) { let pos = 0; while (pos < n) { const m = Math.min(kBlock, n - pos); this.chunk(outL, outR, pos, m); pos += m; } }
    chunk(oL, oR, off, m) {
      const V = this.v, sr = this.sr, bb = this.busBuf, rng = this.rng;
      if (this.snap) { for (const s of this.sm) s.cur = s.target; this.snap = false; }
      for (let b = 0; b < 3; ++b) { bb[b][0].fill(0, 0, m); bb[b][1].fill(0, 0, m); }
      let anyTape = false; for (const v of this.voices) if (v.on && v.model === TAPE) { anyTape = true; break; }
      if (anyTape) this.idle = 0; else this.idle += m / sr;
      const colr = this.sColor.cur, age = this.sDamp.cur, flo = 1 - 0.45 * V[E.Color];
      this.motorTarget = (!anyTape && this.idle > 2.5) ? flo : 1;
      const kUp = 1 - Math.exp(-1 / ((0.12 + 0.5 * V[E.Color]) * sr)), kDn = 1 - Math.exp(-1 / (0.7 * sr)), dWow = 6.283185307 * 0.8 / sr, dFl = 6.283185307 * 7.3 / sr, wf = colr * (1 + age);
      for (let i = 0; i < m; ++i) {
        this.motor += (this.motorTarget - this.motor) * (this.motorTarget > this.motor ? kUp : kDn); this.wowPh += dWow; this.flutPh += dFl; if (this.wowPh > 6.283185307) this.wowPh -= 6.283185307; if (this.flutPh > 6.283185307) this.flutPh -= 6.283185307;
        this.driftT += 1; if (this.driftT > 0.05 * sr) { this.driftT = 0; this.drift += 0.4 * (rng.bi() - this.drift); }
        const mod = wf * (0.004 * Math.sin(this.wowPh) + 0.0012 * Math.sin(this.flutPh) + 0.0015 * this.drift);
        this.spd[i] = this.motor * (1 + mod);
      }
      for (const v of this.voices) {
        if (!v.on) continue; const bl = bb[0][0], br = bb[0][1];
        switch (v.model) {
          case EP: this.renderEP(v, m, bl, br); break;
          case CLAV: this.renderString(v, m, bl, br); break;
          case HARP: this.renderString(v, m, bb[1][0], bb[1][1]); break;
          case TAPE: this.renderTape(v, m, bl, br); break;
          default: this.renderStrings(v, m, bb[2][0]);
        }
        v.age += m; v.lastL = bl[m - 1]; v.lastR = br[m - 1];
        if (!isFinite(v.env)) { v.on = false; continue; }
        const strModel = v.model === CLAV || v.model === HARP;
        if (v.age > sr * 0.05 && (v.env < 3e-6 || (!v.gate && (strModel ? (v.dmp > 0.98 && v.env < 2e-5) : v.rel < 1e-4)))) { v.on = false; v.env = 0; for (let s = 0; s < 2; ++s) v.lp[s].buf.fill(0); }
      }
      if (anyTape && age > 0.01) { const hs = 0.012 * age * age; for (let i = 0; i < m; ++i) { this.hissLp += 0.35 * (rng.bi() - this.hissLp); bb[0][0][i] += this.hissLp * hs; bb[0][1][i] += this.hissLp * hs * 0.9; } }
      { const body = this.sColor.cur * 1.2, gb = [0.5, 0.5, 0.4, 0.3, 0.2], bp = this.bodyBp, b1 = bb[1][0], b1r = bb[1][1];
        for (let i = 0; i < m; ++i) { const x = b1[i]; let y = x; if (body > 1e-3) for (let k = 0; k < 5; ++k) y += body * gb[k] * bp[k].run(x); else for (let k = 0; k < 5; ++k) bp[k].run(x); b1[i] = y; b1r[i] = y; } }
      { const vs = Math.round(V[E.Voice]), dmp = this.sDamp.cur;
        if (Math.abs(this.lastReg0 - vs) > 0.5 || Math.abs(this.lastReg3 - dmp) > 0.004) {
          this.lastReg0 = vs; this.lastReg3 = dmp;
          switch (vs) { case 0: this.regA.set(BQ.HighPass, 300, 0.7, 0, sr); this.regB.set(BQ.Peak, 2800, 1.0, 3.0, sr); break; case 1: this.regA.set(BQ.HighPass, 140, 0.7, 0, sr); this.regB.set(BQ.Peak, 900, 0.9, 4.0, sr); break;
            case 2: this.regA.set(BQ.LowPass, 1100, 0.8, 0, sr); this.regB.set(BQ.LowShelf, 160, 0.7, 3.0, sr); break; default: this.regA.set(BQ.LowShelf, 120, 0.7, 2.0, sr); this.regB.set(BQ.HighShelf, 4000, 0.7, 1.5, sr); }
          this.regC.set(BQ.LowPass, Math.min(14000 * Math.pow(2, -4 * dmp), sr * 0.45), 0.7, 0, sr);
        }
        if (this.model === STR) for (let i = 0; i < m; ++i) { const y = this.regC.run(this.regB.run(this.regA.run(bb[2][0][i]))); bb[2][0][i] = y; bb[2][1][i] = y; } }
      const mdl = this.model, rate = V[E.Rate], r1 = mdl === STR ? rate / 8 : (mdl === TAPE ? rate : rate * 0.25), r2 = rate * 1.35;
      const d1 = 6.283185307 * r1 / sr, d2 = 6.283185307 * r2 / sr, dT = 6.283185307 * rate / sr, tone = this.sTone.cur;
      if (Math.abs(tone - this.lastTone) > 0.002) { this.lastTone = tone; this.toneHiL.set(BQ.HighShelf, 2400, 0.7, (tone - 0.5) * 2 * 9, sr); this.toneHiR.copyFrom(this.toneHiL); this.toneLoL.set(BQ.LowShelf, 220, 0.7, -(tone - 0.5) * 2 * 4, sr); this.toneLoR.copyFrom(this.toneLoL); }
      let peak = 0; const msr = sr * 0.001, dl0 = this.dl[0], dl1 = this.dl[1], wgt = [1, 0, 0];
      for (let i = 0; i < m; ++i) {
        let l = bb[0][0][i] + bb[1][0][i] + bb[2][0][i], r = bb[0][1][i] + bb[1][1][i] + bb[2][1][i];
        l = this.dcL.run(l); r = this.dcR.run(r);
        const tm = this.sTrem.next(), wet = this.sWet.next(), dry = this.sDry.next(), base = this.sBase.next(), depth = this.sDepth.next(), w2 = this.sTap2.next(), w3 = this.sTap3.next();
        this.lfoPh += dT; if (this.lfoPh > 6.283185307) this.lfoPh -= 6.283185307; this.slowPh += d1; if (this.slowPh > 6.283185307) this.slowPh -= 6.283185307; this.ensPh += d2; if (this.ensPh > 6.283185307) this.ensPh -= 6.283185307;
        const sl = Math.sin(this.lfoPh); l *= 1 - tm * 0.48 * (1 + sl); r *= 1 - tm * 0.48 * (1 - sl);
        if (wet > 1e-4) {
          dl0.push(l); dl1.push(r); let aL = 0, aR = 0; const fm = 0.3 * w3; wgt[1] = w2; wgt[2] = w3; const norm = 1 / (1 + w2 + w3);
          for (let k = 0; k < 3; ++k) {
            if (wgt[k] <= 1e-4) continue; const ph = k * 2.0943951;
            const sg = (1 - fm) * Math.sin(this.slowPh + ph) + fm * Math.sin(this.ensPh + ph), sg2 = (1 - fm) * Math.sin(this.slowPh + ph + 1.0471976) + fm * Math.sin(this.ensPh + ph + 1.0471976);
            aL += wgt[k] * dl0.read((base + depth * sg) * msr); aR += wgt[k] * dl1.read((base + depth * sg2) * msr);
          }
          l = l * dry + wet * aL * norm; r = r * dry + wet * aR * norm;
        } else { dl0.push(l); dl1.push(r); }
        const dr = this.sDrive.next(), pre = 1 + dr * dr * 18, bias = 0.12 * dr, tb = Math.tanh(bias), sech2 = 1 - tb * tb, comp = Math.pow(pre, 0.55) / (pre * sech2), osl = this.osL, osr = this.osR;
        osl.pre = osr.pre = pre; osl.bias = osr.bias = bias; osl.tb = osr.tb = tb; osl.comp = osr.comp = comp;
        let yl = osl.run(l), yr = osr.run(r);
        if (dr > 0.002) { const cl = this.cabL.run(yl), cr = this.cabR.run(yr), k = Math.min(1, dr * 0.9); yl += (cl - yl) * k; yr += (cr - yr) * k; } else { this.cabL.run(yl); this.cabR.run(yr); }
        yl = this.dc2L.run(yl); yr = this.dc2R.run(yr);
        yl = this.toneLoL.run(this.toneHiL.run(yl)); yr = this.toneLoR.run(this.toneHiR.run(yr));
        const lv = this.sLevel.next(); yl *= lv; yr *= lv;
        let a = Math.abs(yl); if (a >= 0.7) { const t = 0.7 + 0.3 * Math.tanh((a - 0.7) / 0.3); yl = yl < 0 ? -t : t; }
        a = Math.abs(yr); if (a >= 0.7) { const t = 0.7 + 0.3 * Math.tanh((a - 0.7) / 0.3); yr = yr < 0 ? -t : t; }
        if (!isFinite(yl) || !isFinite(yr)) { yl = yr = 0; }
        oL[off + i] = yl; oR[off + i] = yr;
        this.sPos.next(); this.sDamp.next(); this.sColor.next();
      }
      this.gtime += m / sr;
    }
  }
  OCC.engines.clavica = {
    name: 'Clavica', blurb: "Five keyboards, five little physics: electric piano (tine/reed/bell/bar through a pickup), clav, harpsichord, tape keys (varispeed loops) and a string machine. Voice I-IV picks the variant per model (EP Tine/Reed/Bell/Bar, Clav Neck/Bridge/Both/Out of phase, Harpsichord 8'/4'/both/Lute, Tape Flute/Strings/Choir/Cello, Strings Violin/Viola/Cello/Full). Attack/Position/Damping/Color change meaning per model (hardness, pickup, damper, bell/twang/body/motor/wave). Tape loops are synthesised on first use.",
    specs, groups, make: sr => new Clavica(sr), E
  };
})();
/* Pianica - modelled acoustic piano (no samples). Port of plugins/pianica/pianica.h with the pedal logic of pianohost.h.
   Felt hammer pulse -> 1..3 waveguide strings per key (dispersion allpass chain, loss filter, fractional delay) sharing a bridge, soundboard modes + short tail,
   half-pedalling dampers, sympathetic resonance, sostenuto and soft pedal, mechanical noises.
   The plugin gets pedals as MIDI CC 64/66/67; the page has no pedal input, so three switch params (Sustain, Sostenuto, Soft pedal) are appended at the end of the list
   and drive the same pedal() code (the engine also has a pedal(cc, value 0..1) method for a host that wants to call it). Notes outside MIDI 21-120 are ignored, as in the plugin. */
(function () {
  const E = {}; ['Preset', 'Hardness', 'Brightness', 'Decay', 'Aftersound', 'Detune', 'Stretch', 'Body', 'Sympathy', 'PedalNoise', 'Width', 'Level', 'Sustain', 'Sostenuto', 'SoftPedal', 'Count'].forEach((n, i) => E[n] = i);
  const PN = ['- (keep)', 'Concert Grand', 'Studio Bright', 'Felt Ballad', 'Upright', 'Honky-Tonk', 'Jazz Club', 'Cathedral', 'Muted Felt', 'Old Parlour', 'Close Mic'];
  const specs = [
    P('Preset', '', 0, 10, 0, '%.0f', false, PN),
    P('Hardness', '', 0, 1, 0.5, '%.2f'), P('Brightness', '', -1, 1, 0, '%+.2f'), P('Decay', '', 0.3, 3, 1, '%.2fx', true), P('Aftersound', '', 0, 1, 0.5, '%.2f'),
    P('Detune', 'cents', 0, 6, 1.1, '%.1f ct'), P('Stretch', '', 0, 1.5, 1, '%.2f'), P('Body', '', 0, 1, 0.5, '%.2f'), P('Sympathy', '', 0, 1, 0.4, '%.2f'),
    P('Pedal noise', '', 0, 1, 0.35, '%.2f'), P('Width', '', 0, 1, 0.6, '%.2f'), P('Level', 'dB', -24, 12, 0, '%+.1f dB'),
    P('Sustain pedal', '', 0, 1, 0, '%.0f', false, ['Up', 'Down']), P('Sostenuto pedal', '', 0, 1, 0, '%.0f', false, ['Up', 'Down']), P('Soft pedal', '', 0, 1, 0, '%.0f', false, ['Off', 'On']),
  ];
  const groups = [
    ['Hammer & strings', [E.Preset, E.Hardness, E.Brightness, E.Decay, E.Aftersound, E.Detune, E.Stretch]],
    ['Pedals', [E.Sustain, E.Sostenuto, E.SoftPedal, E.Sympathy, E.PedalNoise]],
    ['Room', [E.Body, E.Width, E.Level]],
  ];
  const kVoices = 32, kMaxStr = 3, kAp = 4, kKeys = 88, kLow = 21, kHigh = 120, kBlock = 128, kExc = 2048, kMech = 16;
  const centsStretch = n => { const x = (n - 60) / 48; return 32 * (x + 0.2 * x * x * x); };
  const inharmonicity = n => n >= 60 ? 3e-4 * Math.pow(2, (n - 60) / 9) : 3e-4 * Math.pow(2, (n - 60) / 24);
  const promptRate = (n, decay) => 1.2 * Math.pow(2, (n - 21) / 14) / Math.max(0.05, decay);
  const afterRate = (n, decay, after) => promptRate(n, decay) / (1 + 5 * after);
  const hammerSpeed = vel => 0.05 + 3.95 * Math.pow(clampf(vel, 0, 1), 1.6);
  const hammerContact = (n, vel, hard) => { const v = hammerSpeed(vel); return clampf(0.004 * Math.pow(2, -(n - 21) / 22) * Math.pow(v / 1.4, -0.45) * Math.pow(2, -(hard - 0.5) * 2.2), 0.00008, 0.012); };
  const pulseShape = (u, hard) => { if (u <= 0 || u >= 1) return 0; return Math.pow(Math.sin(3.14159265 * Math.pow(u, 0.85)), 1.4 + 2.6 * hard); };
  const stringsFor = n => n < 36 ? 1 : (n < 48 ? 2 : 3);
  const GT = [0.0686, 0.0964, 0.0882, 0.1094, 0.1188, 0.1525, 0.2147, 0.2552, 0.3815, 0.4971, 0.7988, 1.1814, 2.5168, 2.1815, 2.3725, 4.2893, 4.2893];
  const gNote = n => { const x = clampf((n - 21) / 6.6, 0, 15.999), i = Math.floor(x), f = x - i; return GT[i] + (GT[i + 1] - GT[i]) * f; };
  const apDelay = (a, w) => 1 - 2 * Math.atan2(a * Math.sin(w), 1 + a * Math.cos(w)) / w;
  const lpDelay = (a, w) => Math.atan2(a * Math.sin(w), 1 - a * Math.cos(w)) / w;
  const lpMag = (a, w) => (1 - a) / Math.sqrt(Math.max(1e-12, 1 + a * a - 2 * a * Math.cos(w)));
  const solveEta = (delay, w) => { let lo = -0.6, hi = 0.25; for (let i = 0; i < 40; ++i) { const m = 0.5 * (lo + hi); if (apDelay(m, w) > delay) lo = m; else hi = m; } return 0.5 * (lo + hi); };
  const dbToGain = db => Math.pow(10, db / 20);

  class Biquad { // band-pass and high-shelf only (RBJ), transposed direct form II
    constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; }
    bandPass(f, q, sr) { f = clampf(f, 5, sr * 0.49); q = Math.max(0.05, q); const w = 2 * Math.PI * f / sr, cw = Math.cos(w), al = Math.sin(w) / (2 * q), A0 = 1 + al; this.b0 = al / A0; this.b1 = 0; this.b2 = -al / A0; this.a1 = -2 * cw / A0; this.a2 = (1 - al) / A0; }
    highShelf(f, q, gainDb, sr) {
      f = clampf(f, 5, sr * 0.49); q = Math.max(0.05, q); const A = Math.pow(10, gainDb / 40), w = 2 * Math.PI * f / sr, cw = Math.cos(w), al = Math.sin(w) / (2 * q), s = 2 * Math.sqrt(A) * al;
      const B0 = A * ((A + 1) + (A - 1) * cw + s), B1 = -2 * A * ((A - 1) + (A + 1) * cw), B2 = A * ((A + 1) + (A - 1) * cw - s), A0 = (A + 1) - (A - 1) * cw + s, A1 = 2 * ((A - 1) - (A + 1) * cw), A2 = (A + 1) - (A - 1) * cw - s;
      this.b0 = B0 / A0; this.b1 = B1 / A0; this.b2 = B2 / A0; this.a1 = A1 / A0; this.a2 = A2 / A0;
    }
    run(x) { const y = this.b0 * x + this.z1; this.z1 = this.b1 * x - this.a1 * y + this.z2; this.z2 = this.b2 * x - this.a2 * y; return y; }
    reset() { this.z1 = this.z2 = 0; }
  }
  class Comb { constructor(maxLen) { this.d = new DelayLine(maxLen + 8); this.len = 1; this.fb = 0.5; this.damp = 0.5; this.z = 0; } run(x) { const y = this.d.tap(this.len - 1); this.z = y * (1 - this.damp) + this.z * this.damp; this.d.push(x + this.z * this.fb); return y; } clear() { this.d.clear(); this.z = 0; } }
  class OnePoleHP { constructor() { this.a = 0; this.z = 0; } set(hz, sr) { this.a = Math.exp(-2 * Math.PI * clampf(hz, 1, sr * 0.49) / sr); } run(x) { this.z = x * (1 - this.a) + this.z * this.a; return x - this.z; } reset() { this.z = 0; } }
  class Smooth { constructor() { this.cur = 0; this.target = 0; this.coef = 0.999; } setTime(s, sr) { this.coef = Math.exp(-1 / Math.max(1, s * sr)); } reset(v) { this.cur = this.target = v; } next() { this.cur = this.target + (this.cur - this.target) * this.coef; return this.cur; } }
  class Rng { constructor() { this.s = 0xA1B2C3D5; } uni() { let s = this.s; s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; this.s = s; return (s >>> 8) * (1 / 16777216); } bi() { return this.uni() * 2 - 1; } }
  class Str { constructor() { this.D = 2; this.eta = 0; this.ez = 0; this.lpz = 0; this.g = 0.99; this.w = 1; this.ap = new Float64Array(kAp); } }
  class V {
    constructor() { this.s = [new Str(), new Str(), new Str()]; this.buf = [null, null, null]; this.exc = new Float32Array(kExc); this.on = false; this.keyDown = false; this.sost = false; this.note = -1; this.age = 0; this.ns = 1; this.M = 0; this.exN = 0; this.exK = 0; this.exL = 0; this.bp = 1; this.ad = 0; this.alp = 0; this.c = 0; this.dgF = 0.99; this.dmp = 0; this.env = 0; this.outGain = 1; this.fade = 0; this.lastOut = 0; this.panL = 0.7; this.panR = 0.7; this.w = 0; }
  }
  class Mech { constructor() { this.on = false; this.env = 0; this.dec = 0.99; this.g = 0; this.a1 = 0.5; this.a2 = 0.05; this.z1 = 0; this.z2 = 0; this.pl = 0.7; this.pr = 0.7; } }
  const MH = [900, 4500, 420, 520, 380], ML = [120, 800, 60, 50, 45], MD = [0.030, 0.008, 0.040, 0.090, 0.060], MG = [2.2, 1.0, 2.6, 3.2, 1.6];
  const TAB = [ // hardness, brightness, decay, aftersound, detune, stretch, body, sympathy, pedal noise, width, level
    [0.50, 0.00, 1.0, 0.5, 1.1, 1.0, 0.50, 0.40, 0.35, 0.60, 0], [0.75, 0.35, 0.9, 0.4, 0.9, 1.0, 0.35, 0.25, 0.20, 0.70, 0], [0.20, -0.30, 1.2, 0.6, 1.0, 1.0, 0.60, 0.50, 0.40, 0.55, 0],
    [0.55, -0.10, 0.6, 0.3, 1.8, 0.6, 0.30, 0.15, 0.60, 0.35, 0], [0.70, 0.25, 0.7, 0.3, 4.2, 0.5, 0.25, 0.10, 0.40, 0.50, 0], [0.40, -0.15, 0.9, 0.5, 1.3, 0.9, 0.55, 0.35, 0.50, 0.50, 0],
    [0.45, -0.05, 1.8, 0.7, 1.0, 1.0, 0.80, 0.80, 0.15, 0.85, -1], [0.05, -0.50, 0.5, 0.2, 0.7, 1.0, 0.30, 0.10, 0.30, 0.40, 1], [0.35, -0.20, 0.8, 0.4, 3.0, 0.7, 0.50, 0.45, 0.50, 0.45, 0], [0.60, 0.15, 1.0, 0.5, 1.1, 1.0, 0.15, 0.15, 0.70, 0.80, 0]];

  class Pianica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); sr = this.sr; const need = Math.floor(sr / 20) + 32; this.bufLen = 1; while (this.bufLen < need) this.bufLen <<= 1; this.mask = this.bufLen - 1;
      this.pool = new Float32Array(kVoices * kMaxStr * this.bufLen); this.voices = [];
      for (let i = 0; i < kVoices; ++i) { const v = new V(); for (let s = 0; s < kMaxStr; ++s) v.buf[s] = this.pool.subarray((i * kMaxStr + s) * this.bufLen, (i * kMaxStr + s + 1) * this.bufLen); this.voices.push(v); }
      this.rng = new Rng(); this.pedT = 0; this.pedS = 0; this.exprT = 1; this.exprS = 1; this.sostOn = false; this.softOn = false; this.held = new Uint8Array(128);
      this.pedCoef = 1 - Math.exp(-1 / (0.012 * sr)); this.dmpDn = 1 - Math.exp(-1 / (0.03 * sr)); this.dmpUp = 1 - Math.exp(-1 / (0.012 * sr)); this.fadeDecay = Math.exp(-1 / (0.004 * sr));
      this.sy1 = new Float64Array(kKeys); this.sy2 = new Float64Array(kKeys); this.syC = new Float64Array(kKeys); this.syR2 = new Float64Array(kKeys); this.syB = new Float64Array(kKeys); this.syG = new Float64Array(kKeys); this.sympAct = false;
      for (let k = 0; k < kKeys; ++k) {
        const note = kLow + k, f = 440 * Math.pow(2, (note - 69 + centsStretch(note) / 100) / 12), w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr, T = 2.2, r = Math.exp(-6.9078 / (T * sr));
        this.syC[k] = 2 * r * Math.cos(w); this.syR2[k] = r * r; this.syB[k] = (1 - r) * 2 * Math.sin(w) * 0.7;
      }
      const bf = [62, 118, 196, 310, 470, 760], bq = [5, 5, 6, 6, 7, 7]; this.bodyL = []; this.bodyR = [];
      for (let i = 0; i < 6; ++i) { const a = new Biquad(), b = new Biquad(); a.bandPass(bf[i], bq[i], sr); b.bandPass(bf[i] * 1.025, bq[i], sr); this.bodyL.push(a); this.bodyR.push(b); }
      this.shelfL = new Biquad(); this.shelfR = new Biquad();
      const cl = [[0.0213, 0.0337], [0.0239, 0.0381]]; this.cL = []; this.cR = [];
      for (let i = 0; i < 2; ++i) { const a = new Comb(Math.floor(0.05 * sr)), b = new Comb(Math.floor(0.05 * sr)); a.len = Math.floor(cl[0][i] * sr); b.len = Math.floor(cl[1][i] * sr); this.cL.push(a); this.cR.push(b); }
      this.dcL = new OnePoleHP(); this.dcR = new OnePoleHP(); this.dcL.set(18, sr); this.dcR.set(18, sr);
      this.sLevel = new Smooth(); this.sWidth = new Smooth(); this.sBody = new Smooth(); this.sSymp = new Smooth(); this.sNoise = new Smooth(); this.sBright = new Smooth();
      this.sms = [this.sLevel, this.sWidth, this.sBody, this.sSymp, this.sNoise, this.sBright]; this.sms.forEach(s => s.setTime(0.02, sr));
      this.mech = Array.from({ length: kMech }, () => new Mech()); this.mechNext = 0; this.tmp = new Float64Array(kBlock); this.busL = new Float64Array(kBlock); this.busR = new Float64Array(kBlock); this.ped = new Float64Array(kBlock);
      this.lastBright = 99; this.snap = true; this.flushed = false;
      const V_ = this.v; this.sLevel.reset(dbToGain(V_[E.Level])); this.sWidth.reset(V_[E.Width]); this.sBody.reset(V_[E.Body]); this.sSymp.reset(V_[E.Sympathy]); this.sNoise.reset(V_[E.PedalNoise]); this.sBright.reset(V_[E.Brightness]);
    }
    set(id, x) {
      if (id < 0 || id >= E.Count) return; const sp = specs[id]; x = clampf(x, sp.min, sp.max); if (sp.labels) x = Math.round(x); this.v[id] = x;
      switch (id) {
        case E.Preset: if (x > 0) this.applyPreset(x); return;
        case E.Level: this.sLevel.target = dbToGain(x); break; case E.Width: this.sWidth.target = x; break; case E.Body: this.sBody.target = x; break;
        case E.Sympathy: this.sSymp.target = x; break; case E.PedalNoise: this.sNoise.target = x; break; case E.Brightness: this.sBright.target = x; break;
        case E.Sustain: this.pedal(64, x); break; case E.Sostenuto: this.pedal(66, x); break; case E.SoftPedal: this.pedal(67, x); break;
      }
    }
    applyPreset(p) {
      const t = TAB[clampf(p, 1, 10) - 1], V_ = this.v;
      for (let i = 0; i < 11; ++i) { V_[E.Hardness + i] = t[i]; this.writeParam(E.Hardness + i, t[i]); }
      this.sBody.target = V_[E.Body]; this.sSymp.target = V_[E.Sympathy]; this.sNoise.target = V_[E.PedalNoise]; this.sWidth.target = V_[E.Width]; this.sLevel.target = dbToGain(V_[E.Level]); this.sBright.target = V_[E.Brightness];
    }
    pitchBend() { } modWheel() { } pressure() { } expression(e) { this.exprT = clampf(e, 0, 1); }
    allNotesOff() { for (const v of this.voices) v.keyDown = false; this.held.fill(0); }
    spawnMech(kind, level, pan) {
      if (level < 1e-4) return; const sr = this.sr, m = this.mech[this.mechNext]; this.mechNext = (this.mechNext + 1) % kMech;
      m.on = true; m.env = 1; m.dec = Math.exp(-1 / (MD[kind] * sr)); m.g = level * MG[kind]; m.a1 = 1 - Math.exp(-2 * 3.14159265 * MH[kind] / sr); m.a2 = 1 - Math.exp(-2 * 3.14159265 * ML[kind] / sr); m.z1 = m.z2 = 0;
      const p = clampf(pan, -1, 1), a = (p + 1) * 0.78539816; m.pl = Math.cos(a); m.pr = Math.sin(a);
    }
    allocate() {
      let best = -1, bestCost = 1e30;
      for (let i = 0; i < kVoices; ++i) { const v = this.voices[i]; if (!v.on) return i; const cost = (v.keyDown ? 1e6 : 0) + (v.sost ? 5e5 : 0) + v.env * 1e3 - v.age * 1e-7 - (v.dmp > 0.5 ? 1e4 : 0); if (cost < bestCost) { bestCost = cost; best = i; } }
      return best < 0 ? 0 : best;
    }
    pedal(cc, value) {
      value = clampf(value, 0, 1); const nz = this.sNoise.target;
      if (cc === 64) {
        const was = this.pedT > 0.5, now = value > 0.5; this.pedT = value;
        if (now && !was) this.spawnMech(4, 0.05 * nz, 0);
        if (!now && was) { this.spawnMech(3, 0.05 * nz, 0); for (const v of this.voices) if (v.on && !v.keyDown && !v.sost && v.env > 1e-4) this.spawnMech(0, 0.03 * nz * Math.min(1, v.env * 20), (v.note - 64) / 44 * 0.5); }
      } else if (cc === 66) {
        const now = value > 0.5;
        if (now && !this.sostOn) { for (const v of this.voices) v.sost = v.on && v.keyDown; this.spawnMech(4, 0.025 * nz, 0); }
        if (!now && this.sostOn) for (const v of this.voices) v.sost = false;
        this.sostOn = now;
      } else if (cc === 67) { const now = value > 0.5; if (now !== this.softOn) this.spawnMech(4, 0.02 * nz, 0); this.softOn = now; }
    }
    noteOff(note) {
      if (note < 0 || note > 127) return; this.held[note] = 0; const nz = this.sNoise.target;
      for (const v of this.voices) if (v.on && v.note === note && v.keyDown) {
        v.keyDown = false; const damped = !v.sost && this.pedS < 0.5;
        if (damped) this.spawnMech(0, 0.03 * nz * Math.min(1, v.env * 20 + 0.05), (note - 64) / 44 * 0.5);
        this.spawnMech(1, 0.006 * nz, (note - 64) / 44 * 0.5);
      }
    }
    noteOn(note, vel) {
      note = Math.round(note); if (note < kLow || note > kHigh) return; vel = clampf(vel, 0.01, 1); let idx = -1;
      for (let i = 0; i < kVoices; ++i) if (this.voices[i].on && this.voices[i].note === note) { idx = i; break; }
      const re = idx >= 0; if (!re) idx = this.allocate();
      const v = this.voices[idx]; if (!re && v.on) v.fade = v.lastOut; else if (!re) v.fade = 0;
      this.startVoice(v, note, vel, re); this.held[note] = 1; this.spawnMech(2, 0.012 * this.sNoise.target * vel, (note - 64) / 44 * 0.5);
    }
    startVoice(v, note, vel, re) {
      const sr = this.sr, Vp = this.v;
      if (!re) { for (let s = 0; s < kMaxStr; ++s) { v.buf[s].fill(0); const st = v.s[s]; st.ez = 0; st.lpz = 0; st.ap.fill(0); } v.w = 0; v.age = 0; v.dmp = 0; }
      v.on = true; v.keyDown = true; v.sost = false; v.note = note; v.env = 0.1;
      const soft = this.softOn ? 1 : 0, ns = stringsFor(note); v.ns = ns; const B = inharmonicity(note), cents = Vp[E.Stretch] * centsStretch(note) + this.noteTune;
      const f1 = Math.min(440 * Math.pow(2, (note - 69) / 12 + cents / 1200), sr * 0.17), P = sr / f1;
      const decay = Vp[E.Decay], after = Vp[E.Aftersound], Rp = promptRate(note, decay), Ra = ns === 1 ? Math.sqrt(Rp * afterRate(note, decay, after)) : afterRate(note, decay, after);
      const fc = 700 * Math.pow(2, (note - 21) / 22), Ps = 1 / f1, hf = f => 1 + (f / fc) * (f / fc), w0 = 2 * Math.PI * f1 / sr;
      const fh = Math.max(Math.min(8 * f1, sr * 0.4), Math.min(1500, sr * 0.4)), fh2 = Math.max(fh, 1.8 * f1), wh = 2 * Math.PI * Math.min(fh2, sr * 0.45) / sr;
      const Ga0 = Math.pow(10, -0.05 * Ps * Ra * hf(f1)), Gah = Math.pow(10, -0.05 * Ps * Ra * hf(fh2)), Rt = clampf(Gah / Math.max(1e-9, Ga0), 1e-6, 1);
      let lo = 0, hi = 0.97;
      if (lpMag(0, wh) / lpMag(0, w0) > Rt) for (let i = 0; i < 40; ++i) { const m = 0.5 * (lo + hi); if (lpMag(m, wh) / lpMag(m, w0) > Rt) lo = m; else hi = m; }
      const alp = 0.5 * (lo + hi); let gloop = Ga0 * (1 / lpMag(alp, w0)); gloop = clampf(gloop, 0, 0.99995);
      let gb = 1;
      if (ns > 1) { const Gp0 = Math.pow(10, -0.05 * Ps * Rp * hf(f1)); gb = clampf(Gp0 / Math.max(1e-9, Ga0), 0.05, 1); }
      v.c = (1 - gb) / ns; v.alp = alp;
      let M = P < 8 ? 0 : (P < 14 ? 1 : (P < 24 ? 2 : kAp)), bestAd = 0, bestCost = 1e30;
      if (M > 0 && B > 1e-6) {
        const parts = [2, 3, 4, 5, 6, 8, 10, 12];
        for (let gi = 0; gi < 78; ++gi) {
          const ad = -0.0125 * gi, t1 = M * apDelay(ad, w0) + lpDelay(alp, w0); if (P - t1 < 3) continue; let cost = 0, cnt = 0;
          for (let pi = 0; pi < 8; ++pi) {
            const n = parts[pi], sn = Math.sqrt((1 + B * n * n) / (1 + B)), fn = n * f1 * sn; if (fn > 0.42 * sr) break;
            const wn = 2 * Math.PI * fn / sr, tn = M * apDelay(ad, wn) + lpDelay(alp, wn), want = sr / (f1 * sn) - sr / f1, err = ((tn - t1) - want) / (sr / (f1 * sn)); cost += err * err; ++cnt;
          }
          if (cnt > 0 && cost < bestCost) { bestCost = cost; bestAd = ad; }
        }
      }
      if (M > 0 && P - (M * apDelay(bestAd, w0) + lpDelay(alp, w0)) < 3) { bestAd = 0; M = Math.max(0, Math.min(M, Math.floor((P - 4) / 1))); }
      v.M = M; v.ad = bestAd;
      const d = Vp[E.Detune], rr = 0.75 + 0.5 * this.rng.uni(), pat3 = [-1, 0.15, 1], pat2 = [-0.5, 0.5];
      for (let s = 0; s < ns; ++s) {
        const off = (ns === 1 ? 0 : (ns === 2 ? pat2[s] : pat3[s])) * d * (s === 0 ? rr : (2 - rr)), fs = f1 * Math.pow(2, off / 1200), ws = 2 * Math.PI * fs / sr;
        const need = sr / fs - (M * apDelay(bestAd, ws) + lpDelay(alp, ws)); let Dint = Math.floor(need - 1), del = need - Dint;
        if (Dint < 1) { Dint = 1; del = clampf(need - 1, 1, 2); } if (Dint > this.bufLen - 4) { Dint = this.bufLen - 4; del = 1; }
        const st = v.s[s]; st.D = Dint; st.eta = solveEta(del, ws); st.g = gloop; st.w = 1;
      }
      if (soft > 0.5) { if (ns === 3) v.s[2].w = 0; else if (ns === 2) v.s[1].w = 0.45; }
      const Td = 0.55 * Math.pow(2, -(note - 21) / 40); v.dgF = Math.pow(10, -3 * Ps / Td);
      const hard = clampf(Vp[E.Hardness] + 0.18 * Vp[E.Brightness] - 0.3 * soft, 0, 1), vs = hammerSpeed(vel) * (soft > 0.5 ? 0.8 : 1), Tc = hammerContact(note, vel, hard) * (soft > 0.5 ? 1.35 : 1);
      const L = clampf(Math.round(Tc * sr), 4, kExc - 80); let sum = 0;
      for (let k = 0; k < L; ++k) { const u = (k + 0.5) / L, x = pulseShape(u, hard); v.exc[k] = x; sum += x; }
      const nrm = sum > 0 ? 1 / sum : 0, amp = (vs * 0.05 * (sr / f1) / ns) * nrm * gNote(note);
      for (let k = 0; k < L; ++k) v.exc[k] *= amp; for (let k = L; k < kExc; ++k) v.exc[k] = 0;
      const beta = 1 / (8 + 6 * (note - 21) / 87); v.bp = clampf(Math.round(beta * P), 1, kExc - L - 2); v.exL = L; v.exN = L + v.bp; v.exK = 0; v.outGain = 1;
      const pan = (note - 64) / 44 * 0.5, a = (pan + 1) * 0.78539816; v.panL = Math.cos(a); v.panR = Math.sin(a);
    }
    renderVoice(v, ped, m) {
      const msk = this.mask, ns = v.ns, M = v.M, ad = v.ad, alp = v.alp, oma = 1 - alp, c = v.c, tmp = this.tmp, dmpDn = this.dmpDn, dmpUp = this.dmpUp, sts = v.s, bufs = v.buf, x = [0, 0, 0]; let e2 = 0;
      for (let i = 0; i < m; ++i) {
        const tgt = (v.keyDown || v.sost) ? 0 : 1 - ped[i]; v.dmp += (tgt - v.dmp) * (tgt > v.dmp ? dmpDn : dmpUp);
        const gd = 1 - v.dmp * (1 - v.dgF); let S = 0;
        for (let s = 0; s < ns; ++s) { x[s] = bufs[s][(v.w - sts[s].D) & msk]; S += x[s]; }
        const cS = c * S; let ex = 0;
        if (v.exK < v.exN) { const k = v.exK, e0 = k < v.exL ? v.exc[k] : 0, k2 = k - v.bp, e1 = (k2 >= 0 && k2 < v.exL) ? v.exc[k2] : 0; ex = e0 - e1; ++v.exK; }
        for (let s = 0; s < ns; ++s) {
          const st = sts[s]; let y = x[s] - cS;
          { const t = st.eta * y + st.ez; st.ez = y - st.eta * t; y = t; }
          const ap = st.ap; for (let q = 0; q < M; ++q) { const t = ad * y + ap[q]; ap[q] = y - ad * t; y = t; }
          y = oma * y + alp * st.lpz; st.lpz = y; y = y * (st.g * gd) + ex * st.w; bufs[s][v.w & msk] = y;
        }
        v.w = (v.w + 1) & msk;
        const o = S * v.outGain + v.fade; v.fade *= this.fadeDecay; tmp[i] = o; e2 += o * o;
      }
      v.lastOut = tmp[m - 1]; v.age += m; const rms = Math.sqrt(e2 / m); v.env = Math.max(rms, v.env * 0.985);
      if (!isFinite(rms)) { v.on = false; return; }
      if (v.exK >= v.exN && v.age > this.sr * 0.05) {
        if (v.env < 3e-6 || (!v.keyDown && !v.sost && v.dmp > 0.98 && v.env < 2e-5)) { v.on = false; v.env = 0; for (let s = 0; s < kMaxStr; ++s) { v.buf[s].fill(0); v.s[s].ez = v.s[s].lpz = 0; v.s[s].ap.fill(0); } v.fade = 0; v.lastOut = 0; }
      }
    }
    process(outL, outR, n) { let pos = 0; while (pos < n) { const m = Math.min(kBlock, n - pos); this.chunk(outL, outR, pos, m); pos += m; } }
    chunk(oL, oR, off, m) {
      const busL = this.busL, busR = this.busR, ped = this.ped, tmp = this.tmp, sr = this.sr;
      for (let i = 0; i < m; ++i) { this.pedS += (this.pedT - this.pedS) * this.pedCoef; ped[i] = this.pedS; busL[i] = busR[i] = 0; }
      for (const v of this.voices) {
        if (!v.on) continue; this.renderVoice(v, ped, m); if (!v.on) continue;
        const pl = v.panL, pr = v.panR; for (let i = 0; i < m; ++i) { busL[i] += tmp[i] * pl; busR[i] += tmp[i] * pr; }
      }
      const symAmt = this.sSymp.target;
      if (this.pedS > 1e-3 || this.sympAct) {
        const sy1 = this.sy1, sy2 = this.sy2, syC = this.syC, syR2 = this.syR2, syB = this.syB, syG = this.syG, held = this.held;
        for (let i = 0; i < m; ++i) {
          const x = (busL[i] + busR[i]) * 0.5, p = ped[i] * (ped[i] > 0.02 ? 1 : 0); let sum = 0;
          for (let k = 0; k < kKeys; ++k) {
            const tg = held[kLow + k] ? 0 : p; syG[k] += (tg - syG[k]) * 0.002;
            const y = syB[k] * x + syC[k] * sy1[k] - syR2[k] * sy2[k]; sy2[k] = sy1[k]; sy1[k] = y; sum += syG[k] * y;
          }
          const o = sum * 0.35 * symAmt * symAmt * (0.4 + 0.6 * symAmt); busL[i] += o; busR[i] += o * 0.97;
        }
        let tot = 0; for (let k = 0; k < kKeys; ++k) { tot += Math.abs(sy1[k]) + Math.abs(sy2[k]); if (Math.abs(sy1[k]) < 1e-15 && Math.abs(sy2[k]) < 1e-15) sy1[k] = sy2[k] = 0; }
        this.sympAct = tot > 1e-10 && (this.pedS > 1e-3 || tot > 1e-6);
        if (!this.sympAct) { sy1.fill(0); sy2.fill(0); syG.fill(0); }
      }
      for (const mc of this.mech) {
        if (!mc.on) continue;
        for (let i = 0; i < m; ++i) { const nz = this.rng.bi(); mc.z1 += mc.a1 * (nz - mc.z1); mc.z2 += mc.a2 * (mc.z1 - mc.z2); const s = (mc.z1 - mc.z2) * mc.env * mc.g; mc.env *= mc.dec; busL[i] += s * mc.pl; busR[i] += s * mc.pr; }
        if (mc.env < 1e-4) mc.on = false;
      }
      if (this.snap) { for (const s of this.sms) s.cur = s.target; this.exprS = this.exprT; this.snap = false; }
      let peak = 0; const bodyL = this.bodyL, bodyR = this.bodyR, cL = this.cL, cR = this.cR;
      for (let i = 0; i < m; ++i) {
        this.exprS += (this.exprT - this.exprS) * 0.004;
        const bd = this.sBody.next(), lv = this.sLevel.next(), wd = this.sWidth.next(), br = this.sBright.next();
        if (Math.abs(br - this.lastBright) > 0.003 && (i & 31) === 0) { this.shelfL.highShelf(3000, 0.7, 9 * br, sr); const a = this.shelfL, b = this.shelfR; b.b0 = a.b0; b.b1 = a.b1; b.b2 = a.b2; b.a1 = a.a1; b.a2 = a.a2; this.lastBright = br; }
        let l = this.dcL.run(busL[i]), r = this.dcR.run(busR[i]), bl = 0, brr = 0;
        for (let q = 0; q < 6; ++q) { const g = 0.55 - 0.05 * q; bl += bodyL[q].run(l) * g; brr += bodyR[q].run(r) * g; }
        let tl = 0, tr = 0; for (let q = 0; q < 2; ++q) { tl += cL[q].run(l * 0.5); tr += cR[q].run(r * 0.5); }
        l += bd * (bl * 1.4 + tl * 0.16); r += bd * (brr * 1.4 + tr * 0.16);
        l = this.shelfL.run(l); r = this.shelfR.run(r);
        const mid = (l + r) * 0.5, side = (l - r) * 0.5 * (wd * 1.6); let yl = (mid + side) * lv * this.exprS, yr = (mid - side) * lv * this.exprS;
        let a = Math.abs(yl); if (a >= 0.7) { const t = 0.7 + 0.3 * Math.tanh((a - 0.7) / 0.3); yl = yl < 0 ? -t : t; }
        a = Math.abs(yr); if (a >= 0.7) { const t = 0.7 + 0.3 * Math.tanh((a - 0.7) / 0.3); yr = yr < 0 ? -t : t; }
        if (!isFinite(yl) || !isFinite(yr)) yl = yr = 0;
        oL[off + i] = yl; oR[off + i] = yr; peak = Math.max(peak, Math.abs(yl), Math.abs(yr));
      }
      let any = false; for (const v of this.voices) if (v.on) { any = true; break; }
      if (!any && !this.sympAct) {
        let mech = false; for (const mc of this.mech) if (mc.on) { mech = true; break; }
        if (!mech && peak < 1e-9) {
          if (!this.flushed) { for (const b of this.bodyL) b.reset(); for (const b of this.bodyR) b.reset(); this.shelfL.reset(); this.shelfR.reset(); this.dcL.reset(); this.dcR.reset(); for (const c of this.cL) c.clear(); for (const c of this.cR) c.clear(); this.flushed = true; }
        } else this.flushed = false;
      } else this.flushed = false;
    }
  }
  OCC.engines.pianica = {
    name: 'Pianica', blurb: 'Modelled acoustic piano, no samples: felt hammer, 1-3 stiff waveguide strings per key with two-stage decay, soundboard, sympathetic resonance and pedals. Pedals are switches here (Sustain, Sostenuto, Soft); the soft pedal and sostenuto act on keys pressed afterwards / held at that moment.',
    specs, groups, make: sr => new Pianica(sr), E
  };
})();
/* Brassica - modelled brass: lips buzzing against a mouthpiece, coupled to a bore (a waveguide with a lip resonator and a bell that brightens as you blow harder),
   mutes, flutter-tongue, shakes, a drone and microtonal scales. Port of plugins/brassica/brassica.h.
   The C++ 'Instrument' choice (14 instruments: trumpet ... karnay) is this engine's Preset (param 0): choosing it loads that instrument's bore, bell, breath, lips,
   vibrato and drone settings into the sliders, exactly like the plugin. Play: mod wheel = vibrato or breath (Mod wheel switch), pitch wheel = slide, Players makes a section.
   Simplified: the pitch / bore / lip-resonator update runs every 8th sample (the plugin: every 4th) to save CPU; the scope/meter read-outs of the plugin window are dropped. */
(function () {
  'use strict';
  const E = {}; ['Preset', 'Volume', 'Mute', 'Players', 'Spread', 'Breath', 'Lips', 'Buzz', 'Bright', 'Body', 'Attack', 'Release', 'Tongue', 'Flutter', 'Growl', 'VibDepth', 'VibRate', 'VibDelay', 'ModWheel', 'Legato', 'Glide', 'BendRange',
    'Shake', 'ShakeRate', 'Scoop', 'Scale', 'Tonic', 'Tune', 'Octave', 'Drone', 'DroneLevel', 'ReverbMix', 'ReverbSize', 'Count'].forEach((n, i) => E[n] = i);
  const kVoices = 8, kMaxPlayers = 8, kPool = kVoices * kMaxPlayers, kModes = 6;
  const SCALES=[{name:'12-tone equal',off:[0,0,0,0,0,0,0,0,0,0,0,0],symp:[0,2,4,5,7,9,11],n:7},
    {name:'Just (Shuddha)',off:[0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7],symp:[0,2,4,5,7,9,11],n:7},
    {name:'Raga Bhairav',off:[0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7],symp:[0,1,4,5,7,8,11],n:7},
    {name:'Raga Yaman',off:[0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7],symp:[0,2,4,6,7,9,11],n:7},
    {name:'Raga Todi',off:[0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7],symp:[0,1,3,6,7,8,11],n:7},
    {name:'Raga Kafi',off:[0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7],symp:[0,2,3,5,7,9,10],n:7},
    {name:'Pythagorean',off:[0,-9.8,3.9,-5.9,7.8,-2,11.7,2,-7.8,5.9,-3.9,9.8],symp:[0,2,4,5,7,9,11],n:7},
    {name:'Chinese pentatonic',off:[0,0,3.9,0,7.8,0,0,2,0,5.9,0,0],symp:[0,2,4,7,9,0,0],n:5},
    {name:'Japanese In',off:[0,0,0,0,0,0,0,2,0,0,0,0],symp:[0,1,5,7,8,0,0],n:5},
    {name:'Maqam Rast',off:[0,0,0,50,0,0,0,0,0,0,50,0],symp:[0,2,3,5,7,9,10],n:7},
    {name:'Maqam Bayati',off:[0,50,0,0,0,0,0,0,0,0,0,0],symp:[0,1,3,5,7,8,10],n:7},
    {name:'Maqam Hijaz',off:[0,0,0,0,0,0,0,0,0,0,0,0],symp:[0,1,4,5,7,8,10],n:7},
    {name:'Slendro-ish',off:[0,0,40,0,0,-20,0,20,0,0,-40,0],symp:[0,2,5,7,10,0,0],n:5},
    {name:'Mongolian pentatonic',off:[0,0,3.9,0,-13.7,0,0,2,0,-15.6,0,0],symp:[0,2,4,7,9,0,0],n:5}];
  
  const dbToGain = db => Math.pow(10, db / 20);
  const hashf = (x, y) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) >>> 0; h = Math.imul((h ^ (h >>> 13)) >>> 0, 1274126177) >>> 0; h = (h ^ (h >>> 16)) >>> 0; return (h & 0xFFFFFF) / 16777215; };
  const blepRes = (t, dt) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; };
  /* RBJ biquad (Peak / LowPass / HighPass), as occeffect.h */
  const BQ_PEAK = 0, BQ_LP = 3, BQ_HP = 4;
  class Biquad {
    constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; }
    set(t, f, q, gainDb, sr) {
      f = Math.min(Math.max(f, 5), sr * 0.49); q = Math.max(0.05, q);
      const A = Math.pow(10, gainDb / 40), w = 2 * Math.PI * f / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * q);
      let B0, B1, B2, A0, A1, A2;
      if (t === BQ_PEAK) { B0 = 1 + al * A; B1 = -2 * cw; B2 = 1 - al * A; A0 = 1 + al / A; A1 = -2 * cw; A2 = 1 - al / A; }
      else if (t === BQ_LP) { B0 = (1 - cw) / 2; B1 = 1 - cw; B2 = (1 - cw) / 2; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; }
      else { B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = (1 + cw) / 2; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; }
      this.b0 = B0 / A0; this.b1 = B1 / A0; this.b2 = B2 / A0; this.a1 = A1 / A0; this.a2 = A2 / A0;
    }
    run(x) { const y = this.b0 * x + this.z1; this.z1 = this.b1 * x - this.a1 * y + this.z2; this.z2 = this.b2 * x - this.a2 * y; return y; }
    reset() { this.z1 = this.z2 = 0; }
  }
  /* Freeverb-style room (avd::Rev of avoidica.h) */
  class Rev {
    constructor(sr) {
      const ct = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], at = [556, 441, 341, 225];
      this.cb = [[], []]; this.ci = [[], []]; this.cz = [[], []]; this.ab = [[], []]; this.ai = [[], []];
      for (let ch = 0; ch < 2; ++ch) {
        for (let k = 0; k < 8; ++k) { this.cb[ch].push(new Float32Array(Math.floor((ct[k] + ch * 23) * sr / 44100) + 1)); this.ci[ch].push(0); this.cz[ch].push(0); }
        for (let k = 0; k < 4; ++k) { this.ab[ch].push(new Float32Array(Math.floor((at[k] + ch * 23) * sr / 44100) + 1)); this.ai[ch].push(0); }
      }
    }
    clear() { for (let ch = 0; ch < 2; ++ch) { for (let k = 0; k < 8; ++k) { this.cb[ch][k].fill(0); this.cz[ch][k] = 0; this.ci[ch][k] = 0; } for (let k = 0; k < 4; ++k) { this.ab[ch][k].fill(0); this.ai[ch][k] = 0; } } }
    tick(ch, x, fb, damp) {
      let s = 0; const cb = this.cb[ch], ci = this.ci[ch], cz = this.cz[ch];
      for (let k = 0; k < 8; ++k) { const b = cb[k], i = ci[k], y = b[i]; const z = y * (1 - damp) + cz[k] * damp; cz[k] = z; b[i] = x + z * fb; ci[k] = i + 1 >= b.length ? 0 : i + 1; s += y; }
      const ab = this.ab[ch], ai = this.ai[ch];
      for (let k = 0; k < 4; ++k) { const b = ab[k], i = ai[k], bo = b[i]; const y = -s + bo; b[i] = s + bo * 0.5; ai[k] = i + 1 >= b.length ? 0 : i + 1; s = y; }
      return s;
    }
  }

  /* name, b0, pole, bright, breath, lips, buzz, attack, release, tongue, flutter, growl, vibRate, vibDepth, vibDelay, scoop, shake, glide, body, drone, droneDb, hp, lp, gain, [6 body modes: hz, q, dB] */
  const RAW = [
["Trumpet",117,0.18,62,62,55,18,40,120,55,0,0,5.4,18,350,0,0,40,60,0,0,150,11000,1,[[1100,4,4],[1800,5,5],[2700,4,5],[3800,4,3],[5200,3,1],[7500,3,-3]]],
["Cornet",117,0.24,52,58,52,16,45,130,50,0,0,5.2,18,350,0,0,40,62,0,0,150,9500,1,[[900,4,4],[1500,5,4],[2300,4,4],[3200,4,2],[4600,3,0],[6500,3,-3]]],
["Flugelhorn",117,0.36,38,52,48,14,55,160,40,0,0,5,20,400,0,0,50,66,0,0,130,6500,1.05,[[500,4,5],[900,5,4],[1500,4,2],[2300,4,0],[3300,3,-2],[4600,3,-5]]],
["Horn",87,0.34,42,56,48,16,70,220,40,0,0,4.8,16,450,0,0,80,70,0,0,90,6000,1.1,[[350,4,5],[700,5,5],[1100,4,4],[1700,4,2],[2600,3,-1],[3800,3,-4]]],
["Trombone",58,0.26,50,60,52,16,55,150,50,0,0,5,16,450,0,0,220,64,0,0,80,7500,1.1,[[450,4,4],[800,5,4],[1300,4,4],[2000,4,3],[3000,3,0],[4400,3,-3]]],
["Bass trombone",41,0.3,44,60,50,16,70,180,45,0,0,4.6,14,500,0,0,240,66,0,0,50,5200,1.15,[[250,4,5],[500,5,5],[900,4,4],[1400,4,3],[2200,3,-1],[3300,3,-4]]],
["Euphonium",58,0.4,34,54,46,12,70,200,35,0,0,5,22,450,0,0,100,68,0,0,60,4600,1.15,[[300,4,5],[560,5,5],[950,4,3],[1500,4,0],[2300,3,-3],[3300,3,-5]]],
["Tuba",29,0.46,28,56,44,12,90,240,40,0,0,4.2,12,600,0,0,120,70,0,0,30,2800,1.3,[[110,4,6],[220,5,5],[400,4,4],[700,4,2],[1100,3,-2],[1800,3,-6]]],
["Alphorn",44,0.42,30,54,46,14,120,320,30,0,0,4.4,12,600,0,0,160,72,3,-26,40,3600,1.2,[[200,4,5],[420,5,5],[760,4,3],[1200,4,0],[1900,3,-3],[2800,3,-6]]],
["Didgeridoo",3000,0.4,40,60,42,26,40,160,55,0,40,4,6,800,0,0,400,60,0,0,40,3800,1.25,[[180,3,5],[380,5,5],[640,4,4],[900,4,2],[1500,3,-1],[2400,3,-4]]],
["Shofar",150,0.3,46,62,54,28,30,200,70,0,0,5,8,500,10,0,90,56,0,0,100,5200,1.1,[[420,4,4],[800,5,4],[1300,4,3],[2000,4,1],[2900,3,-2],[4000,3,-5]]],
["Conch",200,0.34,34,58,46,30,80,300,60,0,0,4.8,10,600,12,0,160,66,0,0,100,3600,1.1,[[300,4,5],[620,5,5],[1000,4,2],[1600,4,0],[2400,3,-3],[3400,3,-5]]],
["Dungchen",33,0.48,26,60,44,20,180,400,40,0,20,3.6,8,700,0,0,200,72,3,-22,25,2400,1.35,[[90,4,6],[180,5,5],[320,4,4],[560,4,2],[900,3,-2],[1500,3,-6]]],
["Karnay",100,0.22,70,68,60,34,40,140,70,0,0,5.4,14,300,18,0,70,56,1,-24,120,8500,1,[[800,4,5],[1400,5,6],[2200,4,5],[3200,4,3],[4600,3,0],[6400,3,-3]]]
];
  const INST = RAW.map(r => ({ name: r[0], b0: r[1], pole: r[2], bright: r[3], breath: r[4], lips: r[5], buzz: r[6], attack: r[7], release: r[8], tongue: r[9], flutter: r[10], growl: r[11], vibRate: r[12], vibDepth: r[13], vibDelay: r[14], scoop: r[15], shake: r[16], glide: r[17], body: r[18], drone: r[19], droneDb: r[20], hp: r[21], lp: r[22], gain: r[23], m: r[24] }));
  const nI = INST.length;
  const specs = [
    P('Preset', '', 0, nI - 1, 0, '%.0f', false, INST.map(i => i.name)),
    P('Volume', 'dB', -24, 12, 0, '%.1f dB'),
    P('Mute', '', 0, 4, 0, '%.0f', false, ['Open', 'Straight', 'Cup', 'Harmon', 'Plunger']),
    P('Players', '', 0, 3, 0, '%.0f', false, ['Solo', 'Duo', 'Section 4', 'Ensemble 8']),
    P('Spread', '%', 0, 100, 40, '%.0f %'),
    P('Breath', '%', 0, 100, 62, '%.0f %'),
    P('Lips', '%', 0, 100, 55, '%.0f %'),
    P('Lip buzz', '%', 0, 100, 18, '%.0f %'),
    P('Brightness', '%', 0, 100, 62, '%.0f %'),
    P('Body', '%', 0, 100, 60, '%.0f %'),
    P('Attack', 'ms', 5, 600, 40, '%.0f ms', true),
    P('Release', 'ms', 10, 2000, 120, '%.0f ms', true),
    P('Tongue', '%', 0, 100, 55, '%.0f %'),
    P('Flutter', '%', 0, 100, 0, '%.0f %'),
    P('Growl', '%', 0, 100, 0, '%.0f %'),
    P('Vibrato depth', 'cents', 0, 100, 18, '%.0f c'),
    P('Vibrato rate', 'Hz', 2, 9, 5.4, '%.1f Hz'),
    P('Vibrato delay', 'ms', 0, 1500, 350, '%.0f ms'),
    P('Mod wheel', '', 0, 1, 0, '%.0f', false, ['Vibrato', 'Breath']),
    P('Legato', '', 0, 1, 0, '%.0f', false, ['Poly', 'Mono legato']),
    P('Glide', 'ms', 0, 800, 40, '%.0f ms'),
    P('Bend range', 'st', 1, 12, 2, '%.0f st'),
    P('Shake', '%', 0, 100, 0, '%.0f %'),
    P('Shake rate', 'Hz', 2, 10, 6, '%.1f Hz'),
    P('Scoop', '%', 0, 100, 0, '%.0f %'),
    P('Scale', '', 0, SCALES.length - 1, 0, '%.0f', false, SCALES.map(s => s.name)),
    P('Tonic', '', 0, 11, 0, '%.0f', false, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']),
    P('Tune', 'cents', -50, 50, 0, '%.0f c'),
    P('Octave', '', -2, 2, 0, '%.0f'),
    P('Drone', '', 0, 3, 0, '%.0f', false, ['Off', 'Tonic', 'Tonic-Fifth', 'Pedal']),
    P('Drone level', 'dB', -40, 0, 0, '%.0f dB'),
    P('Reverb mix', '%', 0, 100, 20, '%.0f %'),
    P('Reverb size', '%', 0, 100, 55, '%.0f %'),
  ];
  const groups = [
    ['Instrument sound', [E.Breath, E.Lips, E.Buzz, E.Bright, E.Body, E.Mute]],
    ['Articulation', [E.Attack, E.Release, E.Tongue, E.Flutter, E.Growl, E.Scoop, E.Shake, E.ShakeRate]],
    ['Expression', [E.VibDepth, E.VibRate, E.VibDelay, E.ModWheel, E.Legato, E.Glide, E.BendRange]],
    ['Section', [E.Players, E.Spread]],
    ['Scale and tuning', [E.Scale, E.Tonic, E.Tune, E.Octave]],
    ['Drone', [E.Drone, E.DroneLevel]],
    ['Output', [E.Volume, E.ReverbMix, E.ReverbSize]],
  ];
  const C0 = [0, 100, 44, 36, 31, 28, 25, 23, 21, 17, 11, 10, 9, 8, 7, 7, 7];
  const newVoice = maxLen => ({ d: new DelayLine(maxLen), z: 0, dcx: 0, dcy: 0, y1: 0, y2: 0, c1: 0, c2: 0, lg: 0, agc: 1, fol: 0, env: 0, relK: 0.001, attackK: 0.01, tong: 0, dyn: 0.7, flPh: 0, grPh: 0, trim: 0, part: 2,
    lf: 6, lfT: 6, D: 50, hz: 100, on: false, state: 0, pc: 0, startDelay: 0, group: -1, pan: 0.5, detune: 0, vibPh: 0, vibAge: 0, shPh: 0, scoopSemis: 0, age: 0, jitter: 1, pole: 0.3, seed: 1, gl: 0.707, gr: 0.707, sv: 0 });
  function clearVoice(s) { s.d.clear(); s.z = s.dcx = s.dcy = s.y1 = s.y2 = s.fol = s.tong = s.flPh = s.grPh = 0; s.agc = 1; s.env = 0; s.on = false; s.state = 0; s.pc = 0; s.startDelay = 0; s.group = -1; s.vibPh = s.vibAge = s.shPh = s.scoopSemis = s.age = 0; s.trim = 0; }
  const newGroup = () => ({ on: false, held: false, note: 0, nPl: 1, vel: 0.7, age: 0, sv: [0, 0, 0, 0, 0, 0, 0, 0] });
  const newDrn = () => ({ ph: [0, 0, 0, 0], lp1: 0, lp2: 0, lev: 0 });

  class Brassica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); this.dt = 1 / sr;
      const maxLen = Math.floor(sr / 14) + 64; this.pool = []; for (let i = 0; i < kPool; ++i) this.pool.push(newVoice(maxLen));
      this.grp = []; for (let i = 0; i < kVoices; ++i) this.grp.push(newGroup());
      this.drn = [newDrn(), newDrn(), newDrn()]; this.held = [];
      this.body = [[], []]; this.mute = [[], []]; this.hp = [new Biquad(), new Biquad()];
      for (let c = 0; c < 2; ++c) { for (let k = 0; k < kModes; ++k) this.body[c].push(new Biquad()); for (let k = 0; k < 3; ++k) this.mute[c].push(new Biquad()); }
      this.lpz = [0, 0]; this.lpA = 0.5; this.rev = new Rev(sr); this.rng = new Noise(0x9E3779B9);
      this.bend = 0; this.bendS = 0; this.mw = 0; this.mwSeen = false; this.expr = 1; this.expS = 1; this.press = 0; this.ageCtr = 0; this.nonFinite = 0;
      this.volG = 1; this.glideK = 0.01; this.glideK4 = 0.04; this.instGain = 1; this.muteOn = false; this.inst = INST[0];
      this.loadInstrument(0, false);
    }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.mw = m; this.mwSeen = true; } pressure(p) { this.press = p; }
    allNotesOff() { for (const g of this.grp) if (g.on) this.release(g); this.held.length = 0; }
    set(id, x) {
      if (id < 0 || id >= E.Count) return;
      if (id === E.Preset) { this.loadInstrument(Math.max(0, Math.min(nI - 1, Math.round(x))), true); return; }
      this.v[id] = x; this.configure();
    }
    loadInstrument(i, notify) {
      const n = INST[i], V = this.v; V[E.Preset] = i; if (notify) this.writeParam(E.Preset, i);
      const put = (id, val) => { V[id] = val; if (notify) this.writeParam(id, val); };
      put(E.Bright, n.bright); put(E.Breath, n.breath); put(E.Lips, n.lips); put(E.Buzz, n.buzz); put(E.Attack, n.attack); put(E.Release, n.release); put(E.Tongue, n.tongue); put(E.Flutter, n.flutter); put(E.Growl, n.growl);
      put(E.VibRate, n.vibRate); put(E.VibDepth, n.vibDepth); put(E.VibDelay, n.vibDelay); put(E.Scoop, n.scoop); put(E.Shake, n.shake); put(E.Glide, n.glide); put(E.Body, n.body); put(E.Drone, n.drone); put(E.DroneLevel, n.droneDb);
      this.configure();
    }
    scaleCents(note) { const pc = (((note - Math.round(this.v[E.Tonic])) % 12) + 12) % 12; return SCALES[Math.round(this.v[E.Scale])].off[pc]; }
    noteHz(note, extra) { const V = this.v; return 440 * Math.pow(2, (note + 12 * Math.round(V[E.Octave]) - 69 + (V[E.Tune] + this.scaleCents(note) + (extra || 0)) / 100) / 12); }
    configure() {
      const V = this.v, sr = this.sr, n = INST[Math.round(V[E.Preset])]; this.inst = n; const bg = V[E.Body] / 60;
      for (let c = 0; c < 2; ++c) { for (let k = 0; k < kModes; ++k) this.body[c][k].set(BQ_PEAK, n.m[k][0], n.m[k][1], n.m[k][2] * bg, sr); this.hp[c].set(BQ_HP, n.hp, 0.7, 0, sr); }
      const mt = Math.round(V[E.Mute]); this.muteOn = mt > 0;
      for (let c = 0; c < 2; ++c) {
        const m = this.mute[c];
        switch (mt) {
          case 1: m[0].set(BQ_HP, 380, 0.7, 0, sr); m[1].set(BQ_PEAK, 1700, 2.2, 8, sr); m[2].set(BQ_LP, 6500, 0.7, 0, sr); break;
          case 2: m[0].set(BQ_HP, 160, 0.7, 0, sr); m[1].set(BQ_PEAK, 650, 1.2, 4, sr); m[2].set(BQ_LP, 3200, 0.8, 0, sr); break;
          case 3: m[0].set(BQ_HP, 520, 0.8, 0, sr); m[1].set(BQ_PEAK, 2600, 3.5, 12, sr); m[2].set(BQ_PEAK, 1100, 3.0, -8, sr); break;
          case 4: m[0].set(BQ_HP, 200, 0.7, 0, sr); m[1].set(BQ_PEAK, 900, 2.5, 7, sr); m[2].set(BQ_LP, 2400, 1.2, 0, sr); break;
          default: for (let k = 0; k < 3; ++k) m[k].set(BQ_PEAK, 1000, 1.0, 0, sr); break;
        }
      }
      this.lpA = Math.exp(-2 * Math.PI * Math.min(n.lp * (0.6 + 0.8 * V[E.Bright] / 100), sr * 0.45) / sr);
      this.volG = dbToGain(V[E.Volume]); this.instGain = n.gain;
      this.glideK = V[E.Glide] < 1 ? 1 : 1 - Math.exp(-1 / (V[E.Glide] * 0.001 * sr)); this.glideK4 = this.glideK >= 1 ? 1 : 1 - Math.pow(1 - this.glideK, 8);
    }
    startVoice(s, hz, vel, player, nPl, groupIdx, seed) {
      const V = this.v, sr = this.sr, inn = this.inst, spread = V[E.Spread] * 0.01; clearVoice(s); s.on = true; s.state = 1; s.group = groupIdx; s.seed = seed;
      const h1 = hashf(seed, 1 + player), h2 = hashf(seed, 17 + player), h3 = hashf(seed, 31 + player);
      s.detune = nPl > 1 ? (h1 * 2 - 1) * 12 * spread : 0;
      s.startDelay = nPl > 1 && player > 0 ? Math.floor(h2 * spread * 0.022 * sr) : 0;
      s.pan = nPl > 1 ? 0.5 + 0.5 * ((player + 0.5) / nPl * 2 - 1) * (0.2 + 0.8 * spread) + (h3 - 0.5) * 0.08 * spread : 0.5;
      s.vibPh = h3 * 6.2832; s.jitter = 1 + (h2 - 0.5) * (nPl > 1 ? 0.16 : 0.04); s.dyn = vel; s.grPh = h1;
      s.lf = s.lfT = Math.log2(hz); s.scoopSemis = -V[E.Scoop] * 0.01 * 2; s.tong = V[E.Tongue] * 0.01 * (0.4 + 0.6 * vel);
      s.attackK = 1 / Math.max(8, V[E.Attack] * 0.001 * sr * (1.3 - 0.6 * vel)); s.relK = Math.exp(-1 / (V[E.Release] * 0.001 * sr));
      s.part = clampf(Math.round(hz / inn.b0), 2, 16); s.gl = Math.cos(s.pan * 1.5708); s.gr = Math.sin(s.pan * 1.5708); s.sv = Math.sin(s.vibPh);
    }
    noteOn(note, vel) {
      const V = this.v; vel = clampf(vel, 0.02, 1); const hz = this.noteHz(note, this.noteTune);
      if (V[E.Legato] > 0.5) {
        let g = null; for (const q of this.grp) if (q.on && q.held) { g = q; break; }
        if (g) { this.held.push(note); g.note = note; this.retarget(g, hz); return; }
      }
      const grp = this.grp, pool = this.pool; let gi = -1;
      for (let i = 0; i < kVoices; ++i) if (!grp[i].on) { gi = i; break; }
      if (gi < 0) { let oldest = Infinity; for (let i = 0; i < kVoices; ++i) if (grp[i].age < oldest) { oldest = grp[i].age; gi = i; } for (let j = 0; j < grp[gi].nPl; ++j) pool[grp[gi].sv[j]].on = false; grp[gi].on = false; }
      const nPl = 1 << clampf(Math.round(V[E.Players]), 0, 3);
      const got = []; for (let i = 0; i < kPool && got.length < nPl; ++i) if (!pool[i].on) got.push(i);
      if (got.length < nPl) {
        for (let pass = 0; pass < kVoices && got.length < nPl; ++pass) {
          let vi = -1, oldest = Infinity; for (let i = 0; i < kVoices; ++i) if (grp[i].on && i !== gi && grp[i].age < oldest) { oldest = grp[i].age; vi = i; }
          if (vi < 0) break; for (let j = 0; j < grp[vi].nPl; ++j) pool[grp[vi].sv[j]].on = false; grp[vi].on = false;
          for (let i = 0; i < kPool && got.length < nPl; ++i) if (!pool[i].on && got.indexOf(i) < 0) got.push(i);
        }
      }
      if (got.length < nPl) return;
      const g = grp[gi]; g.on = true; g.held = true; g.note = note; g.nPl = nPl; g.vel = vel; g.age = ++this.ageCtr; const seed = ((Math.imul(note, 2654435761) >>> 0) ^ (Math.imul(this.ageCtr, 40503) >>> 0)) >>> 0;
      for (let j = 0; j < nPl; ++j) { g.sv[j] = got[j]; clearVoice(pool[got[j]]); this.startVoice(pool[got[j]], hz, vel, j, nPl, gi, seed); }
      this.held.push(note);
    }
    retarget(g, hz) { for (let j = 0; j < g.nPl; ++j) { const s = this.pool[g.sv[j]]; if (!s.on) continue; s.lfT = Math.log2(hz); if (this.glideK >= 1) s.lf = s.lfT; if (s.state === 3) s.state = 2; } }
    release(g) { g.held = false; for (let j = 0; j < g.nPl; ++j) { const s = this.pool[g.sv[j]]; if (s.on && s.state !== 3) s.state = 3; } }
    noteOff(note) {
      const k = this.held.indexOf(note); if (k >= 0) this.held.splice(k, 1);
      if (this.v[E.Legato] > 0.5) {
        for (const g of this.grp) if (g.on && g.held) {
          if (this.held.length) { if (g.note === note) { g.note = this.held[this.held.length - 1]; this.retarget(g, this.noteHz(g.note)); } } else this.release(g);
          return;
        }
      }
      for (const g of this.grp) if (g.on && g.held && g.note === note) { this.release(g); return; }
    }
    stepV(s) {
      if (s.startDelay > 0) { --s.startDelay; return 0; }
      const V = this.v, inn = this.inst, sr = this.sr, mwVib = V[E.ModWheel] < 0.5, dt = this.dt; s.age += dt;
      if (s.state === 1) { s.env += s.attackK; if (s.env >= 1) { s.env = 1; s.state = 2; } } else if (s.state === 3) s.env *= s.relK;
      const dyn = (!mwVib && this.mwSeen) ? clampf(this.mw + this.press * 0.3, 0, 1) : s.dyn;
      s.tong *= 1 - 30 * dt;
      let flut = 1; if (V[E.Flutter] > 0.5) { s.flPh += 24 * dt; if (s.flPh >= 1) s.flPh -= 1; const sq = Math.sin(6.2832 * s.flPh); flut = 1 - V[E.Flutter] * 0.01 * 0.85 * clampf(sq * 2.5 + 0.5, 0, 1); }
      const growl = V[E.Growl] * 0.01; if (growl > 0) { s.grPh += (30 + 8 * s.jitter) * dt; if (s.grPh >= 1) s.grPh -= 1; }
      const pk = s.pc; s.pc = (pk + 1) & 7;
      if (pk === 0) {
        const dt4 = 8 * dt;
        if (this.glideK < 1) s.lf += (s.lfT - s.lf) * this.glideK4; else s.lf = s.lfT;
        let cents = s.detune + s.scoopSemis * 100; s.scoopSemis *= 0.99760144; if (Math.abs(s.scoopSemis) < 1e-4) s.scoopSemis = 0;
        s.vibAge += dt4; {
          const depth = V[E.VibDepth] + (mwVib ? this.mw * 60 : 0), ramp = clampf((s.vibAge - V[E.VibDelay] * 0.001) / 0.35, 0, 1);
          s.vibPh += 6.2832 * V[E.VibRate] * s.jitter * dt4; if (s.vibPh > 6.2832) s.vibPh -= 6.2832; const sv = Math.sin(s.vibPh); s.sv = sv; cents += depth * ramp * sv;
        }
        if (V[E.Shake] > 0.5) { s.shPh += V[E.ShakeRate] * s.jitter * dt4; if (s.shPh >= 1) s.shPh -= 1; const tri = s.shPh < 0.5 ? s.shPh * 2 : 2 - s.shPh * 2, ramp = clampf((s.age - 0.10) / 0.2, 0, 1); cents += tri * tri * (3 - 2 * tri) * V[E.Shake] * 0.01 * 160 * ramp; }
        cents += this.bendS * V[E.BendRange] * 100;
        const hz = Math.pow(2, s.lf + cents / 1200); s.hz = hz;
        const b01 = V[E.Bright] * 0.01; s.pole = clampf(inn.pole + (0.5 - b01) * 0.35 - (dyn - 0.5) * 0.10, 0.04, 0.8);
        const cs = C0[s.part] - (18 / s.part) * (Math.max(s.lf, 6.78) - 7.6439); s.trim = clampf(cs, -20, 140);
        const comp = s.pole / (1 - s.pole), fb = hz * Math.pow(2, -s.trim / 1200) / s.part;
        s.D = clampf(sr / fb - 2 - comp, 6, s.d.mask - 8);
        const Q = 40 + 0.5 * V[E.Lips], lipHz = Math.min(hz * Math.pow(2, -s.trim / 1200) * (1 + 0.05 * growl * Math.sin(6.2831853 * s.grPh)), sr * 0.4);
        const r = 1 - Math.PI * (lipHz / Q) / sr; s.c1 = 2 * r * Math.cos(2 * Math.PI * lipHz / sr); s.c2 = -r * r; s.lg = (1 - r) * 2 * Math.sin(2 * Math.PI * lipHz / sr) * 160;
      }
      const tongPush = 1 + s.tong * 1.2;
      let bt = (0.20 + 0.34 * (0.5 + 0.5 * dyn) * (0.7 + 0.6 * V[E.Breath] * 0.01)) * tongPush * flut; bt = Math.min(bt, 0.9);
      const mouth = bt * (0.55 + 0.45 * Math.min(1, s.env * 3)) * (1 + 0.06 * V[E.VibDepth] * 0.01 * s.sv) + this.rng.white() * V[E.Buzz] * 0.01 * 0.03 * bt;
      const dl = s.d, dbuf = dl.buf, dmask = dl.mask, dw = dl.w, Dd = s.D, di = Dd | 0, dtt = Dd - di;
      const ya = dbuf[(dw - di + 1) & dmask], yb_ = dbuf[(dw - di) & dmask], yc = dbuf[(dw - 1 - di) & dmask], yd = dbuf[(dw - 2 - di) & dmask];   // = DelayLine.read(D), inlined
      const arr = ((0.5 * (yd - ya) + 1.5 * (yb_ - yc)) * dtt + (ya - 2.5 * yb_ + 2 * yc - 0.5 * yd)) * dtt * dtt + 0.5 * (yc - ya) * dtt + yb_;
      s.z = (1 - s.pole) * arr + s.pole * s.z; const bore = 0.85 * s.z;
      const dp = mouth - bore, yy = dp * s.lg + s.c1 * s.y1 + s.c2 * s.y2; s.y2 = s.y1; s.y1 = yy; let q = yy * yy; if (q > 1) q = 1;
      const o = q * mouth + (1 - q) * bore, yb = o - s.dcx + 0.995 * s.dcy; s.dcx = o; s.dcy = yb; dbuf[dw & dmask] = yb; dl.w = dw + 1;
      let y = arr;
      s.fol += (Math.abs(y) - s.fol) * 0.003;
      const level = s.env * (0.10 + 0.90 * dyn * dyn * 0.8 + 0.1 * dyn) * (1 + s.tong * 0.5);
      const want = clampf(level * 0.28 / Math.max(s.fol, 0.002), 0, 8); s.agc += (want - s.agc) * 0.004; y *= s.agc;
      if (growl > 0) y *= 1 + 0.35 * growl * Math.sin(6.2831853 * s.grPh);
      if (!(Math.abs(y) < 20)) { clearVoice(s); ++this.nonFinite; return 0; }
      if (s.state === 3 && s.env < 1e-3) { s.on = false; s.state = 0; }
      return y;
    }
    process(outL, outR, n) {
      const V = this.v, sr = this.sr, rvMix = V[E.ReverbMix] * 0.01, droneG = dbToGain(V[E.DroneLevel]), droneMode = Math.round(V[E.Drone]);
      const grp = this.grp, pool = this.pool, hp = this.hp, body = this.body, mute = this.mute, lpz = this.lpz, lpA = this.lpA, muteOn = this.muteOn, rev = this.rev;
      const norm0 = 1 / Math.sqrt(1 << clampf(Math.round(V[E.Players]), 0, 3)), volG = this.volG * this.instGain * 0.9;
      const fbR = 0.7 + 0.28 * (V[E.ReverbSize] * 0.01), dm = 0.35;
      let sa = 0, ratio = null;
      if (droneMode > 0) { sa = this.noteHz(36 + Math.round(V[E.Tonic])); ratio = DRATIO[droneMode - 1]; }
      for (let i = 0; i < n; ++i) {
        this.bendS += (this.bend - this.bendS) * 0.01; this.expS += (this.expr - this.expS) * 0.002;
        let l = 0, r = 0, nAct = 0;
        for (let gi = 0; gi < kVoices; ++gi) {
          const g = grp[gi]; if (!g.on) continue; let any = false;
          for (let j = 0; j < g.nPl; ++j) {
            const s = pool[g.sv[j]]; if (!s.on) continue; any = true; const y = this.stepV(s); l += y * s.gl; r += y * s.gr; nAct += 1;
          }
          if (!any) g.on = false;
        }
        if (nAct > 0) { l *= norm0; r *= norm0; }
        let bl = hp[0].run(l), br = hp[1].run(r);
        for (let k = 0; k < kModes; ++k) { bl = body[0][k].run(bl); br = body[1][k].run(br); }
        if (muteOn) { for (let k = 0; k < 3; ++k) { bl = mute[0][k].run(bl); br = mute[1][k].run(br); } bl *= 1.4; br *= 1.4; }
        lpz[0] = bl * (1 - lpA) + lpz[0] * lpA; lpz[1] = br * (1 - lpA) + lpz[1] * lpA; bl = lpz[0]; br = lpz[1];
        if (droneMode > 0) {
          let dm_ = 0, dr = 0;
          for (let d = 0; d < 3; ++d) {
            const q = this.drn[d], f = sa * ratio[d] * (1 + 0.0013 * (d - 1)); let acc = 0; const dtp = f / sr;
            for (let k = 0; k < 2; ++k) { q.ph[k] += dtp * (k ? 1.004 : 1); if (q.ph[k] >= 1) q.ph[k] -= 1; let saw = 2 * q.ph[k] - 1; saw -= blepRes(q.ph[k], dtp); acc += saw * 0.5; }
            q.lp1 += (acc - q.lp1) * 0.05; q.lp2 += (q.lp1 - q.lp2) * 0.05; q.lev += (1 - q.lev) * 0.0004; const pn = 0.3 + 0.2 * d; dm_ += q.lp2 * q.lev * Math.cos(pn * 1.5708); dr += q.lp2 * q.lev * Math.sin(pn * 1.5708);
          }
          bl += dm_ * droneG * 2.2; br += dr * droneG * 2.2;
        }
        const gain = volG * this.expS;
        let ol = bl * gain, or = br * gain;
        if (rvMix > 0.001) { const x = (ol + or) * 0.015, wl = rev.tick(0, x, fbR, dm), wr = rev.tick(1, x, fbR, dm); ol = ol * (1 - rvMix * 0.3) + wl * 3 * rvMix; or = or * (1 - rvMix * 0.3) + wr * 3 * rvMix; }
        ol = Math.tanh(ol * 0.8) * 1.25; or = Math.tanh(or * 0.8) * 1.25;
        if (!(ol === ol) || !(or === or)) { ++this.nonFinite; ol = or = 0; }
        outL[i] = ol; outR[i] = or;
      }
    }
  }
  const DRATIO = [[1.0, 1.0, 0.5], [1.0, 1.5, 0.5], [0.5, 0.5, 0.25]];
  OCC.engines.brassica = { name: 'Brassica', blurb: 'Modelled brass: lips buzzing against a mouthpiece and bore, mutes, flutter-tongue, shakes, drone and microtonal scales. The Preset is the instrument (trumpet, horn, trombone, tuba, alphorn, didgeridoo, shofar, karnay ...).', specs, groups, make: sr => new Brassica(sr), E };
})();
/* Reedica - modelled woodwinds: a reed beating against a mouthpiece (a waveguide with a reed table), an air jet crossing an edge (flute, recorder, ney, shakuhachi ...),
   free reeds (sheng, khaen) and a Highland pipe with its drones. Port of plugins/reedica/reedica.h.
   The C++ 'Instrument' choice (20 instruments) is this engine's Preset (param 0): choosing it loads that instrument's model, breath, reed, air noise, vibrato, gamak and drone
   settings into the sliders, exactly like the plugin. Play: mod wheel = vibrato or breath, pitch wheel = glide (meend), Players makes a section.
   The pitch / reed update runs every 8th sample (the plugin: every 4th) to save CPU; the plugin's scope and breath meters are dropped. */
(function () {
  'use strict';
  const E = {}; ['Preset', 'Volume', 'Players', 'Spread', 'Breath', 'Reed', 'Noise', 'Bright', 'Body', 'Attack', 'Release', 'Tongue', 'Flutter', 'Membrane', 'VibDepth', 'VibRate', 'VibDelay', 'ModWheel', 'Legato', 'Glide', 'BendRange',
    'Gamak', 'GamakRate', 'Scoop', 'Scale', 'Tonic', 'Tune', 'Octave', 'Drone', 'DroneLevel', 'ReverbMix', 'ReverbSize', 'Count'].forEach((n, i) => E[n] = i);
  const kVoices = 8, kMaxPlayers = 8, kPool = kVoices * kMaxPlayers, kModes = 6;
  const SCALES=[{name:'12-tone equal',off:[0,0,0,0,0,0,0,0,0,0,0,0],symp:[0,2,4,5,7,9,11],n:7},
    {name:'Just (Shuddha)',off:[0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7],symp:[0,2,4,5,7,9,11],n:7},
    {name:'Raga Bhairav',off:[0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7],symp:[0,1,4,5,7,8,11],n:7},
    {name:'Raga Yaman',off:[0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7],symp:[0,2,4,6,7,9,11],n:7},
    {name:'Raga Todi',off:[0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7],symp:[0,1,3,6,7,8,11],n:7},
    {name:'Raga Kafi',off:[0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7],symp:[0,2,3,5,7,9,10],n:7},
    {name:'Pythagorean',off:[0,-9.8,3.9,-5.9,7.8,-2,11.7,2,-7.8,5.9,-3.9,9.8],symp:[0,2,4,5,7,9,11],n:7},
    {name:'Chinese pentatonic',off:[0,0,3.9,0,7.8,0,0,2,0,5.9,0,0],symp:[0,2,4,7,9,0,0],n:5},
    {name:'Japanese In',off:[0,0,0,0,0,0,0,2,0,0,0,0],symp:[0,1,5,7,8,0,0],n:5},
    {name:'Maqam Rast',off:[0,0,0,50,0,0,0,0,0,0,50,0],symp:[0,2,3,5,7,9,10],n:7},
    {name:'Maqam Bayati',off:[0,50,0,0,0,0,0,0,0,0,0,0],symp:[0,1,3,5,7,8,10],n:7},
    {name:'Maqam Hijaz',off:[0,0,0,0,0,0,0,0,0,0,0,0],symp:[0,1,4,5,7,8,10],n:7},
    {name:'Slendro-ish',off:[0,0,40,0,0,-20,0,20,0,0,-40,0],symp:[0,2,5,7,10,0,0],n:5},
    {name:'Mongolian pentatonic',off:[0,0,3.9,0,-13.7,0,0,2,0,-15.6,0,0],symp:[0,2,4,7,9,0,0],n:5}];
  
  const dbToGain = db => Math.pow(10, db / 20);
  const hashf = (x, y) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) >>> 0; h = Math.imul((h ^ (h >>> 13)) >>> 0, 1274126177) >>> 0; h = (h ^ (h >>> 16)) >>> 0; return (h & 0xFFFFFF) / 16777215; };
  const blepRes = (t, dt) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; };
  /* RBJ biquad (Peak / LowPass / HighPass), as occeffect.h */
  const BQ_PEAK = 0, BQ_LP = 3, BQ_HP = 4;
  class Biquad {
    constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; }
    set(t, f, q, gainDb, sr) {
      f = Math.min(Math.max(f, 5), sr * 0.49); q = Math.max(0.05, q);
      const A = Math.pow(10, gainDb / 40), w = 2 * Math.PI * f / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * q);
      let B0, B1, B2, A0, A1, A2;
      if (t === BQ_PEAK) { B0 = 1 + al * A; B1 = -2 * cw; B2 = 1 - al * A; A0 = 1 + al / A; A1 = -2 * cw; A2 = 1 - al / A; }
      else if (t === BQ_LP) { B0 = (1 - cw) / 2; B1 = 1 - cw; B2 = (1 - cw) / 2; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; }
      else { B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = (1 + cw) / 2; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; }
      this.b0 = B0 / A0; this.b1 = B1 / A0; this.b2 = B2 / A0; this.a1 = A1 / A0; this.a2 = A2 / A0;
    }
    run(x) { const y = this.b0 * x + this.z1; this.z1 = this.b1 * x - this.a1 * y + this.z2; this.z2 = this.b2 * x - this.a2 * y; return y; }
    reset() { this.z1 = this.z2 = 0; }
  }
  /* Freeverb-style room (avd::Rev of avoidica.h) */
  class Rev {
    constructor(sr) {
      const ct = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], at = [556, 441, 341, 225];
      this.cb = [[], []]; this.ci = [[], []]; this.cz = [[], []]; this.ab = [[], []]; this.ai = [[], []];
      for (let ch = 0; ch < 2; ++ch) {
        for (let k = 0; k < 8; ++k) { this.cb[ch].push(new Float32Array(Math.floor((ct[k] + ch * 23) * sr / 44100) + 1)); this.ci[ch].push(0); this.cz[ch].push(0); }
        for (let k = 0; k < 4; ++k) { this.ab[ch].push(new Float32Array(Math.floor((at[k] + ch * 23) * sr / 44100) + 1)); this.ai[ch].push(0); }
      }
    }
    clear() { for (let ch = 0; ch < 2; ++ch) { for (let k = 0; k < 8; ++k) { this.cb[ch][k].fill(0); this.cz[ch][k] = 0; this.ci[ch][k] = 0; } for (let k = 0; k < 4; ++k) { this.ab[ch][k].fill(0); this.ai[ch][k] = 0; } } }
    tick(ch, x, fb, damp) {
      let s = 0; const cb = this.cb[ch], ci = this.ci[ch], cz = this.cz[ch];
      for (let k = 0; k < 8; ++k) { const b = cb[k], i = ci[k], y = b[i]; const z = y * (1 - damp) + cz[k] * damp; cz[k] = z; b[i] = x + z * fb; ci[k] = i + 1 >= b.length ? 0 : i + 1; s += y; }
      const ab = this.ab[ch], ai = this.ai[ch];
      for (let k = 0; k < 4; ++k) { const b = ab[k], i = ai[k], bo = b[i]; const y = -s + bo; b[i] = s + bo * 0.5; ai[k] = i + 1 >= b.length ? 0 : i + 1; s = y; }
      return s;
    }
  }

  /* name, model(0 single reed,1 sax,2 double reed,3 air jet,4 free reed,5 Highland pipe), slope, offs, pole, jet, even, bright, breath, reed, noise, attack, release, tongue, flutter, membrane, vibRate, vibDepth, vibDelay,
     scoop, gamak, glide, body, drone, droneDb, hp, lp, gain, [6 body modes: hz, q, dB] */
  const RAW = [
["Clarinet",0,-0.4,0.55,0.35,0,0,55,55,50,18,55,130,45,0,0,5.2,16,450,0,0,60,60,0,0,80,7500,1,[[330,6,5],[820,8,3],[1500,6,-2],[2400,5,2],[3300,4,-1],[4600,3,-3]]],
["Alto sax",1,-0.4,0.55,0.28,0,0.3,60,58,50,24,50,160,45,0,0,5.4,26,380,6,0,70,65,0,0,100,8000,1,[[250,6,5],[600,8,4],[1100,6,3],[1900,5,3],[3000,4,1],[4400,3,-3]]],
["Tenor sax",1,-0.42,0.55,0.3,0,0.3,52,58,50,26,55,180,40,0,0,5,28,420,6,0,80,68,0,0,80,6500,1.05,[[180,6,5],[440,8,4],[850,6,3],[1500,5,3],[2400,4,1],[3600,3,-3]]],
["Oboe",2,-0.5,0.5,0.28,0,0,62,60,55,14,45,120,50,0,0,5.6,14,400,0,0,60,58,0,0,200,7500,1,[[1050,5,6],[1500,6,4],[2300,5,3],[3100,4,2],[4300,3,-1],[5800,3,-4]]],
["Bassoon",2,-0.48,0.52,0.34,0,0,46,58,50,18,70,160,45,0,0,5,16,500,0,0,80,62,0,0,60,4200,1.1,[[230,6,5],[480,7,4],[850,6,3],[1250,5,3],[1800,4,1],[2700,3,-3]]],
["Flute",3,0,0,0.55,0.35,0.15,55,55,50,30,80,150,50,0,0,5.4,18,450,0,0,90,55,0,0,180,9500,0.9,[[700,5,3],[1400,6,2],[2300,5,1],[3500,4,2],[5000,3,0],[7000,3,-3]]],
["Piccolo",3,0,0,0.45,0.3,0.12,70,58,50,24,50,110,55,0,0,6,12,300,0,0,70,55,0,0,500,11000,0.9,[[1500,5,3],[2800,6,2],[4300,5,2],[6000,4,0],[8000,3,-2],[10000,3,-4]]],
["Recorder",3,0,0,0.6,0.15,0.06,45,50,50,22,90,180,55,0,0,4.8,6,600,0,0,50,50,0,0,300,7000,0.9,[[900,5,3],[1700,6,2],[2700,5,0],[3900,4,0],[5200,3,-2],[6800,3,-4]]],
["Ocarina",3,0,0,0.75,0.04,0.01,25,45,50,14,100,200,40,0,0,4.6,8,600,0,0,60,70,0,0,300,3800,1,[[800,5,4],[1600,7,0],[2400,5,-3],[3200,4,-4],[4000,3,-5],[5000,3,-6]]],
["Duduk",2,-0.55,0.46,0.38,0,0,40,52,45,12,110,220,25,0,0,4.8,14,500,6,8,100,70,2,-26,120,4500,1.05,[[520,5,5],[980,6,5],[1400,5,3],[2000,4,1],[2800,3,-2],[3800,3,-5]]],
["Shehnai",2,-0.55,0.46,0.3,0,0,56,62,50,20,80,200,40,0,0,5.4,28,250,20,30,110,60,1,-24,160,6500,1,[[760,5,5],[1300,6,5],[1900,5,4],[2700,4,3],[3800,3,0],[5200,3,-3]]],
["Zurna",2,-0.6,0.44,0.24,0,0,72,68,55,24,60,140,60,0,0,5.6,14,250,8,14,90,60,0,0,200,9000,0.95,[[900,4,5],[1500,5,6],[2300,4,5],[3200,4,3],[4400,3,1],[6000,3,-2]]],
["Suona",2,-0.6,0.44,0.22,0,0,78,70,55,26,60,150,65,0,0,5.8,18,250,14,12,90,58,0,0,240,9500,0.95,[[1000,4,5],[1700,5,6],[2500,4,5],[3500,4,3],[4700,3,1],[6200,3,-2]]],
["Ney",3,0,0,0.62,0.55,0.3,40,52,50,55,120,240,45,0,0,4.8,20,500,10,12,100,55,3,-24,150,6500,1,[[500,5,4],[1000,6,2],[1700,5,1],[2600,4,0],[3800,3,-2],[5200,3,-4]]],
["Shakuhachi",3,0,0,0.62,0.5,0.28,38,56,50,60,110,260,40,0,0,4.4,24,550,24,8,130,50,0,0,140,5800,1,[[450,5,4],[900,6,2],[1500,5,1],[2300,4,0],[3300,3,-2],[4600,3,-4]]],
["Bansuri",3,0,0,0.66,0.4,0.2,42,50,50,45,120,260,30,0,0,5,16,450,14,22,120,60,1,-24,160,6000,1,[[550,5,4],[1050,6,2],[1700,5,1],[2500,4,0],[3600,3,-2],[4900,3,-4]]],
["Dizi",3,0,0,0.5,0.5,0.3,66,58,50,30,60,150,55,0,60,5.6,14,350,8,12,80,55,0,0,250,9500,0.95,[[900,5,3],[1700,6,3],[2700,5,2],[3800,4,3],[5200,3,1],[7000,3,-2]]],
["Sheng",4,0,0,0.5,0,0,55,55,50,12,120,230,10,0,0,4.6,6,500,0,0,100,65,0,0,150,5200,0.9,[[480,5,3],[900,6,3],[1500,5,2],[2300,4,0],[3400,3,-2],[4800,3,-4]]],
["Khaen",4,0,0,0.5,0,0,48,55,50,12,140,260,10,0,0,4.4,8,500,0,0,100,65,3,-28,120,4600,0.9,[[420,5,3],[820,6,3],[1300,5,2],[2000,4,0],[3000,3,-2],[4200,3,-4]]],
["Highland pipe",5,-0.55,0.46,0.26,0,0,70,70,60,10,60,90,30,0,0,5,0,0,0,0,40,60,3,-22,260,7500,0.95,[[750,4,6],[1250,5,6],[1900,4,5],[2800,4,4],[3900,3,1],[5300,3,-3]]]
];
  const INST = RAW.map(r => ({ name: r[0], model: r[1], slope: r[2], offs: r[3], pole: r[4], jet: r[5], even: r[6], bright: r[7], breath: r[8], reed: r[9], noise: r[10], attack: r[11], release: r[12], tongue: r[13], flutter: r[14], membrane: r[15], vibRate: r[16], vibDepth: r[17], vibDelay: r[18], scoop: r[19], gamak: r[20], glide: r[21], body: r[22], drone: r[23], droneDb: r[24], hp: r[25], lp: r[26], gain: r[27], m: r[28] }));
  const nI = INST.length;
  const specs = [
    P('Preset', '', 0, nI - 1, 0, '%.0f', false, INST.map(i => i.name)),
    P('Volume', 'dB', -24, 12, 0, '%.1f dB'),
    P('Players', '', 0, 3, 0, '%.0f', false, ['Solo', 'Duo', 'Section 4', 'Ensemble 8']),
    P('Spread', '%', 0, 100, 40, '%.0f %'),
    P('Breath', '%', 0, 100, 55, '%.0f %'),
    P('Reed', '%', 0, 100, 50, '%.0f %'),
    P('Air noise', '%', 0, 100, 18, '%.0f %'),
    P('Brightness', '%', 0, 100, 55, '%.0f %'),
    P('Body', '%', 0, 100, 60, '%.0f %'),
    P('Attack', 'ms', 5, 600, 55, '%.0f ms', true),
    P('Release', 'ms', 10, 2000, 130, '%.0f ms', true),
    P('Tongue', '%', 0, 100, 45, '%.0f %'),
    P('Flutter', '%', 0, 100, 0, '%.0f %'),
    P('Membrane', '%', 0, 100, 0, '%.0f %'),
    P('Vibrato depth', 'cents', 0, 100, 16, '%.0f c'),
    P('Vibrato rate', 'Hz', 2, 9, 5.2, '%.1f Hz'),
    P('Vibrato delay', 'ms', 0, 1500, 450, '%.0f ms'),
    P('Mod wheel', '', 0, 1, 0, '%.0f', false, ['Vibrato', 'Breath']),
    P('Legato', '', 0, 1, 0, '%.0f', false, ['Poly', 'Mono legato']),
    P('Glide', 'ms', 0, 800, 60, '%.0f ms'),
    P('Bend range', 'st', 1, 12, 2, '%.0f st'),
    P('Gamak', '%', 0, 100, 0, '%.0f %'),
    P('Gamak rate', 'Hz', 2, 10, 6, '%.1f Hz'),
    P('Scoop', '%', 0, 100, 0, '%.0f %'),
    P('Scale', '', 0, SCALES.length - 1, 0, '%.0f', false, SCALES.map(s => s.name)),
    P('Tonic', '', 0, 11, 0, '%.0f', false, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']),
    P('Tune', 'cents', -50, 50, 0, '%.0f c'),
    P('Octave', '', -2, 2, 0, '%.0f'),
    P('Drone', '', 0, 3, 0, '%.0f', false, ['Off', 'Sa-Pa', 'Sa-Ma', 'Pipes']),
    P('Drone level', 'dB', -40, 0, 0, '%.0f dB'),
    P('Reverb mix', '%', 0, 100, 18, '%.0f %'),
    P('Reverb size', '%', 0, 100, 50, '%.0f %'),
  ];
  const groups = [
    ['Instrument sound', [E.Breath, E.Reed, E.Noise, E.Bright, E.Body, E.Membrane]],
    ['Articulation', [E.Attack, E.Release, E.Tongue, E.Flutter, E.Scoop, E.Gamak, E.GamakRate]],
    ['Expression', [E.VibDepth, E.VibRate, E.VibDelay, E.ModWheel, E.Legato, E.Glide, E.BendRange]],
    ['Section', [E.Players, E.Spread]],
    ['Scale and tuning', [E.Scale, E.Tonic, E.Tune, E.Octave]],
    ['Drone', [E.Drone, E.DroneLevel]],
    ['Output', [E.Volume, E.ReverbMix, E.ReverbSize]],
  ];
  const newVoice = maxLen => ({ d: new DelayLine(maxLen), n1a: 0, n1b: 0, n2a: 0, n2b: 0, rc1: 0, rc2: 0, rg: 0, qc1: 0, qc2: 0, qg: 0, z: 0, dcx: 0, dcy: 0, lev: 0, agc: 1, fol: 0, env: 0, nz: 0, hpz: 0, bz: 0, relK: 0.001, attackK: 0.01, tong: 0, dyn: 0.7, flPh: 0,
    lf: 6, lfT: 6, D: 50, ph: [0, 0, 0], fz1: 0, fz2: 0, on: false, state: 0, pc: 0, startDelay: 0, group: -1, pan: 0.5, detune: 0, vibPh: 0, vibAge: 0, gamPh: 0, scoopSemis: 0, age: 0, jitter: 1, pole: 0.3, seed: 1 });
  function clearVoice(s) {
    s.d.clear(); s.n1a = s.n1b = s.n2a = s.n2b = 0; s.z = s.dcx = s.dcy = s.lev = s.fol = s.nz = s.hpz = s.bz = s.tong = s.flPh = s.fz1 = s.fz2 = 0; s.agc = 1; s.env = 0; s.on = false; s.state = 0; s.pc = 0; s.startDelay = 0; s.group = -1;
    s.vibPh = s.vibAge = s.gamPh = s.scoopSemis = s.age = 0; s.ph[0] = s.ph[1] = s.ph[2] = 0;
  }
  const newGroup = () => ({ on: false, held: false, note: 0, nPl: 1, vel: 0.7, age: 0, sv: [0, 0, 0, 0, 0, 0, 0, 0] });
  const newDrn = () => ({ ph: [0, 0, 0, 0], lp1: 0, lp2: 0, lev: 0 });
  const DRATIO = [[0.75, 1.0, 0.5], [0.6667, 1.0, 0.5], [0.5, 0.5, 0.25]];
  const MULS = [1.0, 1.5, 2.0], AMPS = [1, 0.42, 0.5];

  class Reedica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); this.dt = 1 / sr;
      const maxLen = Math.floor(sr / 18) + 64; this.pool = []; for (let i = 0; i < kPool; ++i) this.pool.push(newVoice(maxLen));
      this.grp = []; for (let i = 0; i < kVoices; ++i) this.grp.push(newGroup());
      this.drn = [newDrn(), newDrn(), newDrn()]; this.held = [];
      this.body = [[], []]; this.hp = [new Biquad(), new Biquad()];
      for (let c = 0; c < 2; ++c) for (let k = 0; k < kModes; ++k) this.body[c].push(new Biquad());
      this.lpz = [0, 0]; this.lpA = 0.5; this.rev = new Rev(sr); this.rng = new Noise(0x9E3779B9);
      this.bend = 0; this.bendS = 0; this.mw = 0; this.mwSeen = false; this.expr = 1; this.expS = 1; this.press = 0; this.ageCtr = 0; this.nonFinite = 0;
      this.volG = 1; this.glideK = 0.01; this.glideK4 = 0.04; this.instGain = 1; this.inst = INST[0];
      this.loadInstrument(0, false);
    }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.mw = m; this.mwSeen = true; } pressure(p) { this.press = p; }
    allNotesOff() { for (const g of this.grp) if (g.on) this.release(g); this.held.length = 0; }
    set(id, x) {
      if (id < 0 || id >= E.Count) return;
      if (id === E.Preset) { this.loadInstrument(Math.max(0, Math.min(nI - 1, Math.round(x))), true); return; }
      this.v[id] = x; this.configure();
    }
    loadInstrument(i, notify) {
      const n = INST[i], V = this.v; V[E.Preset] = i; if (notify) this.writeParam(E.Preset, i);
      const put = (id, val) => { V[id] = val; if (notify) this.writeParam(id, val); };
      put(E.Bright, n.bright); put(E.Breath, n.breath); put(E.Reed, n.reed); put(E.Noise, n.noise); put(E.Attack, n.attack); put(E.Release, n.release); put(E.Tongue, n.tongue); put(E.Flutter, n.flutter); put(E.Membrane, n.membrane);
      put(E.VibRate, n.vibRate); put(E.VibDepth, n.vibDepth); put(E.VibDelay, n.vibDelay); put(E.Scoop, n.scoop); put(E.Gamak, n.gamak); put(E.Glide, n.glide); put(E.Body, n.body); put(E.Drone, n.drone); put(E.DroneLevel, n.droneDb);
      this.configure();
    }
    scaleCents(note) { const pc = (((note - Math.round(this.v[E.Tonic])) % 12) + 12) % 12; return SCALES[Math.round(this.v[E.Scale])].off[pc]; }
    noteHz(note, extra) { const V = this.v; return 440 * Math.pow(2, (note + 12 * Math.round(V[E.Octave]) - 69 + (V[E.Tune] + this.scaleCents(note) + (extra || 0)) / 100) / 12); }
    configure() {
      const V = this.v, sr = this.sr, n = INST[Math.round(V[E.Preset])]; this.inst = n; const bg = V[E.Body] / 60;
      for (let c = 0; c < 2; ++c) { for (let k = 0; k < kModes; ++k) this.body[c][k].set(BQ_PEAK, n.m[k][0], n.m[k][1], n.m[k][2] * bg, sr); this.hp[c].set(BQ_HP, n.hp, 0.7, 0, sr); }
      this.lpA = Math.exp(-2 * Math.PI * Math.min(n.lp * (0.6 + 0.8 * V[E.Bright] / 100), sr * 0.45) / sr);
      this.volG = dbToGain(V[E.Volume]); this.instGain = n.gain;
      this.glideK = V[E.Glide] < 1 ? 1 : 1 - Math.exp(-1 / (V[E.Glide] * 0.001 * sr)); this.glideK4 = this.glideK >= 1 ? 1 : 1 - Math.pow(1 - this.glideK, 8);
    }
    startVoice(s, hz, vel, player, nPl, groupIdx, seed) {
      const V = this.v, sr = this.sr, spread = V[E.Spread] * 0.01; clearVoice(s); s.on = true; s.state = 1; s.group = groupIdx; s.seed = seed;
      const h1 = hashf(seed, 1 + player), h2 = hashf(seed, 17 + player), h3 = hashf(seed, 31 + player);
      s.detune = nPl > 1 ? (h1 * 2 - 1) * 12 * spread : 0;
      s.startDelay = nPl > 1 && player > 0 ? Math.floor(h2 * spread * 0.022 * sr) : 0;
      s.pan = nPl > 1 ? 0.5 + 0.5 * ((player + 0.5) / nPl * 2 - 1) * (0.2 + 0.8 * spread) + (h3 - 0.5) * 0.08 * spread : 0.5;
      s.vibPh = h3 * 6.2832; s.jitter = 1 + (h2 - 0.5) * (nPl > 1 ? 0.16 : 0.04); s.dyn = vel;
      s.lf = s.lfT = Math.log2(hz); s.scoopSemis = -V[E.Scoop] * 0.01 * 2; s.tong = V[E.Tongue] * 0.01 * (0.4 + 0.6 * vel);
      s.attackK = 1 / Math.max(8, V[E.Attack] * 0.001 * sr * (1.3 - 0.6 * vel)); s.relK = Math.exp(-1 / (V[E.Release] * 0.001 * sr));
      for (let k = 0; k < 3; ++k) s.ph[k] = hashf(seed, 50 + player * 3 + k);
      s.nz = this.rng.white() * 0.01;
    }
    noteOn(note, vel) {
      const V = this.v; vel = clampf(vel, 0.02, 1); const hz = this.noteHz(note, this.noteTune);
      if (V[E.Legato] > 0.5) {
        let g = null; for (const q of this.grp) if (q.on && q.held) { g = q; break; }
        if (g) { this.held.push(note); g.note = note; this.retarget(g, hz); return; }
      }
      const grp = this.grp, pool = this.pool; let gi = -1;
      for (let i = 0; i < kVoices; ++i) if (!grp[i].on) { gi = i; break; }
      if (gi < 0) { let oldest = Infinity; for (let i = 0; i < kVoices; ++i) if (grp[i].age < oldest) { oldest = grp[i].age; gi = i; } for (let j = 0; j < grp[gi].nPl; ++j) pool[grp[gi].sv[j]].on = false; grp[gi].on = false; }
      const nPl = 1 << clampf(Math.round(V[E.Players]), 0, 3);
      const got = []; for (let i = 0; i < kPool && got.length < nPl; ++i) if (!pool[i].on) got.push(i);
      if (got.length < nPl) {
        for (let pass = 0; pass < kVoices && got.length < nPl; ++pass) {
          let vi = -1, oldest = Infinity; for (let i = 0; i < kVoices; ++i) if (grp[i].on && i !== gi && grp[i].age < oldest) { oldest = grp[i].age; vi = i; }
          if (vi < 0) break; for (let j = 0; j < grp[vi].nPl; ++j) pool[grp[vi].sv[j]].on = false; grp[vi].on = false;
          for (let i = 0; i < kPool && got.length < nPl; ++i) if (!pool[i].on && got.indexOf(i) < 0) got.push(i);
        }
      }
      if (got.length < nPl) return;
      const g = grp[gi]; g.on = true; g.held = true; g.note = note; g.nPl = nPl; g.vel = vel; g.age = ++this.ageCtr; const seed = ((Math.imul(note, 2654435761) >>> 0) ^ (Math.imul(this.ageCtr, 40503) >>> 0)) >>> 0;
      for (let j = 0; j < nPl; ++j) { g.sv[j] = got[j]; clearVoice(pool[got[j]]); this.startVoice(pool[got[j]], hz, vel, j, nPl, gi, seed); }
      this.held.push(note);
    }
    retarget(g, hz) { for (let j = 0; j < g.nPl; ++j) { const s = this.pool[g.sv[j]]; if (!s.on) continue; s.lfT = Math.log2(hz); if (this.glideK >= 1) s.lf = s.lfT; if (s.state === 3) s.state = 2; } }
    release(g) { g.held = false; for (let j = 0; j < g.nPl; ++j) { const s = this.pool[g.sv[j]]; if (s.on && s.state !== 3) s.state = 3; } }
    noteOff(note) {
      const k = this.held.indexOf(note); if (k >= 0) this.held.splice(k, 1);
      if (this.v[E.Legato] > 0.5) {
        for (const g of this.grp) if (g.on && g.held) {
          if (this.held.length) { if (g.note === note) { g.note = this.held[this.held.length - 1]; this.retarget(g, this.noteHz(g.note)); } } else this.release(g);
          return;
        }
      }
      for (const g of this.grp) if (g.on && g.held && g.note === note) { this.release(g); return; }
    }
    /* one voice, one sample */
    stepV(s) {
      if (s.startDelay > 0) { --s.startDelay; return 0; }
      const V = this.v, inn = this.inst, sr = this.sr, mwVib = V[E.ModWheel] < 0.5, dt = this.dt, model = inn.model; s.age += dt;
      if (s.state === 1) { s.env += s.attackK; if (s.env >= 1) { s.env = 1; s.state = 2; } } else if (s.state === 3) s.env *= s.relK;
      const dyn = (!mwVib && this.mwSeen) ? clampf(this.mw + this.press * 0.3, 0, 1) : s.dyn;
      s.tong *= 1 - 38 * dt;
      const pressure = 0.5 + 0.5 * dyn;
      let flut = 1; if (V[E.Flutter] > 0.5) { s.flPh += 24 * dt; if (s.flPh >= 1) s.flPh -= 1; const sq = Math.sin(6.2832 * s.flPh); flut = 1 - V[E.Flutter] * 0.01 * 0.85 * clampf(sq * 2.5 + 0.5, 0, 1); }
      const pk = s.pc; s.pc = (pk + 1) & 7;
      if (pk === 0) {
        const dt4 = 8 * dt;
        if (this.glideK < 1) s.lf += (s.lfT - s.lf) * this.glideK4; else s.lf = s.lfT;
        let cents = s.detune + s.scoopSemis * 100; s.scoopSemis *= 0.99760144; if (Math.abs(s.scoopSemis) < 1e-4) s.scoopSemis = 0;
        s.vibAge += dt4; {
          const depth = V[E.VibDepth] + (mwVib ? this.mw * 60 : 0), ramp = clampf((s.vibAge - V[E.VibDelay] * 0.001) / 0.35, 0, 1);
          s.vibPh += 6.2832 * V[E.VibRate] * s.jitter * dt4; if (s.vibPh > 6.2832) s.vibPh -= 6.2832; cents += depth * ramp * Math.sin(s.vibPh);
        }
        if (V[E.Gamak] > 0.5) { s.gamPh += V[E.GamakRate] * s.jitter * dt4; if (s.gamPh >= 1) s.gamPh -= 1; const tri = s.gamPh < 0.5 ? s.gamPh * 2 : 2 - s.gamPh * 2, ramp = clampf((s.age - 0.12) / 0.25, 0, 1); cents += tri * tri * (3 - 2 * tri) * V[E.Gamak] * 0.01 * 120 * ramp; }
        cents += this.bendS * V[E.BendRange] * 100;
        const hz = Math.pow(2, s.lf + cents / 1200); s.D = hz;
        const b01 = V[E.Bright] * 0.01; s.pole = clampf(inn.pole + (0.5 - b01) * 0.5 - (dyn - 0.5) * 0.12, 0.02, 0.85);
        const comp = s.pole / (1 - s.pole);
        if (model === 3) {
          const Q = 10 + 0.4 * V[E.Reed], f2 = Math.min(2 * hz, sr * 0.45);
          let r = 1 - Math.PI * Math.max(hz / Q, 18) / sr, a1 = 2 * r * Math.cos(2 * Math.PI * hz / sr), a2 = -r * r, vr = (1 - a2) / ((1 + a2) * ((1 - a2) * (1 - a2) - a1 * a1));
          s.rc1 = a1; s.rc2 = a2; s.rg = 1 / Math.sqrt(Math.max(vr, 1e-6));
          r = 1 - Math.PI * Math.max(f2 / Q, 18) / sr; a1 = 2 * r * Math.cos(2 * Math.PI * f2 / sr); a2 = -r * r; vr = (1 - a2) / ((1 + a2) * ((1 - a2) * (1 - a2) - a1 * a1));
          s.qc1 = a1; s.qc2 = a2; s.qg = 1 / Math.sqrt(Math.max(vr, 1e-6));
        } else if (model !== 4) s.D = clampf(sr / (2 * hz) - comp, 4, s.d.mask - 8);
        s.lev = hz;
      }
      const nzAmt = V[E.Noise] * 0.01; s.nz = s.nz * 0.55 + this.rng.white() * 0.45; const airNz = s.nz;
      const tongPush = 1 + s.tong * 1.6;
      let y = 0;
      if (model <= 2 || model === 5) {
        const reed = (V[E.Reed] - 50) * 0.01;
        const offs = clampf(inn.offs + reed * 0.10, 0.30, 0.80), slope = inn.slope * (1 + reed * 0.25);
        let bt = (model === 5 ? 0.80 : 0.62 + 0.22 * pressure * (0.7 + 0.6 * V[E.Breath] * 0.01)); bt = Math.min(bt * tongPush, 1.15) * flut;
        const b = bt * (0.55 + 0.45 * Math.min(1, s.env * 3)) * (1 + nzAmt * 0.10 * airNz) * (1 + 0.08 * V[E.VibDepth] * 0.01 * Math.sin(s.vibPh));
        const arr = s.d.read(s.D); s.z = (1 - s.pole) * arr + s.pole * s.z;
        const refl = -(model === 2 || model === 5 ? 0.93 : 0.95) * s.z, pd = refl - b, tbl = clampf(offs + slope * pd, -1, 1), o = b + pd * tbl;
        s.d.push(o); y = arr;
        if (inn.even > 0) { const sq = y * y; s.bz += (sq - s.bz) * 0.001; y += inn.even * 1.6 * (sq - s.bz); }
        s.fol += (Math.abs(y) - s.fol) * 0.003;
      } else if (model === 3) {
        const hz = s.lev; s.ph[0] += hz / sr; if (s.ph[0] >= 1) s.ph[0] -= 1; const w = 6.2831853 * s.ph[0];
        const br = 0.35 + 0.65 * dyn, bgt = 0.4 + 1.2 * V[E.Bright] * 0.01, a2 = inn.jet * br * bgt, a3 = inn.even * br * bgt;
        const tone = (Math.sin(w) + a2 * Math.sin(2 * w + 0.6) + a3 * Math.sin(3 * w + 1.1) + 0.5 * a3 * Math.sin(4 * w + 0.3)) * (1 + 0.20 * V[E.VibDepth] * 0.01 * Math.sin(s.vibPh)) * flut;
        const x = this.rng.white(), q1 = x * s.rg + s.rc1 * s.n1a + s.rc2 * s.n1b; s.n1b = s.n1a; s.n1a = q1; const q2 = x * s.qg + s.qc1 * s.n2a + s.qc2 * s.n2b; s.n2b = s.n2a; s.n2a = q2;
        const air = (q1 + 0.6 * q2) * nzAmt * 0.9 * (1 + s.tong * 3);
        y = tone + air; s.fol += (Math.abs(y) - s.fol) * 0.003;
      } else {
        const hz = s.lev; let acc = 0;
        for (let k = 0; k < 3; ++k) { const f = hz * MULS[k] * (1 + 0.0007 * (k - 1)), dtp = f / sr; s.ph[k] += dtp; if (s.ph[k] >= 1) s.ph[k] -= 1; const saw = 2 * s.ph[k] - 1 - blepRes(s.ph[k], dtp); acc += AMPS[k] * (saw * 0.9 + 0.1 * airNz); }
        y = acc * 0.45 * flut * (1 + 0.2 * s.tong); s.fz1 += (y - s.fz1) * 0.45; y = s.fz1; s.fol += (Math.abs(y) - s.fol) * 0.003;
        y += airNz * nzAmt * 0.02;
      }
      const level = s.env * (0.10 + 0.90 * dyn * dyn * 0.8 + 0.1 * dyn) * (1 + s.tong * 0.6) * (model === 5 ? 0.7 : 1);
      const want = clampf(level * 0.28 / Math.max(s.fol, 0.002), 0, 8); s.agc += (want - s.agc) * 0.004; y *= s.agc;
      if (model !== 3 && model !== 4) y += airNz * nzAmt * 0.012 * level;
      if (V[E.Membrane] > 0.5) { const m = V[E.Membrane] * 0.01; s.hpz += (y - s.hpz) * 0.35; const hpx = y - s.hpz; y += m * 0.55 * Math.tanh(9 * hpx + 0.4 * y); }
      if (!(Math.abs(y) < 20)) { clearVoice(s); ++this.nonFinite; return 0; }
      if (s.state === 3 && s.env < 1e-3) { s.on = false; s.state = 0; }
      return y;
    }
    process(outL, outR, n) {
      const V = this.v, sr = this.sr, rvMix = V[E.ReverbMix] * 0.01, droneG = dbToGain(V[E.DroneLevel]), droneMode = Math.round(V[E.Drone]);
      const grp = this.grp, pool = this.pool, hp = this.hp, body = this.body, lpz = this.lpz, lpA = this.lpA, rev = this.rev;
      const norm0 = 1 / Math.sqrt(1 << clampf(Math.round(V[E.Players]), 0, 3)), volG = this.volG * this.instGain * 0.9;
      const fbR = 0.7 + 0.28 * (V[E.ReverbSize] * 0.01), dm = 0.35;
      let sa = 0, ratio = null;
      if (droneMode > 0) { sa = droneMode === 3 ? this.noteHz(60 + Math.round(V[E.Tonic])) : this.noteHz(48 + Math.round(V[E.Tonic])); ratio = DRATIO[droneMode - 1]; }
      for (let i = 0; i < n; ++i) {
        this.bendS += (this.bend - this.bendS) * 0.01; this.expS += (this.expr - this.expS) * 0.002;
        let l = 0, r = 0, nAct = 0;
        for (let gi = 0; gi < kVoices; ++gi) {
          const g = grp[gi]; if (!g.on) continue; let any = false;
          for (let j = 0; j < g.nPl; ++j) {
            const s = pool[g.sv[j]]; if (!s.on) continue; any = true; const y = this.stepV(s), gl = Math.cos(s.pan * 1.5708), gr = Math.sin(s.pan * 1.5708); l += y * gl; r += y * gr; nAct += 1;
          }
          if (!any) g.on = false;
        }
        if (nAct > 0) { l *= norm0; r *= norm0; }
        let bl = hp[0].run(l), br = hp[1].run(r);
        for (let k = 0; k < kModes; ++k) { bl = body[0][k].run(bl); br = body[1][k].run(br); }
        lpz[0] = bl * (1 - lpA) + lpz[0] * lpA; lpz[1] = br * (1 - lpA) + lpz[1] * lpA; bl = lpz[0]; br = lpz[1];
        if (droneMode > 0) {
          let dm_ = 0, dr = 0;
          for (let d = 0; d < 3; ++d) {
            const q = this.drn[d], f = sa * ratio[d] * (1 + 0.0011 * (d - 1)); let acc = 0; const dtp = f / sr;
            for (let k = 0; k < 2; ++k) { q.ph[k] += dtp * (k ? 1.004 : 1); if (q.ph[k] >= 1) q.ph[k] -= 1; let saw = 2 * q.ph[k] - 1; saw -= blepRes(q.ph[k], dtp); acc += saw * 0.5; }
            q.lp1 += (acc - q.lp1) * 0.12; q.lp2 += (q.lp1 - q.lp2) * 0.12; q.lev += (1 - q.lev) * 0.0004; const pn = 0.3 + 0.2 * d; dm_ += q.lp2 * q.lev * Math.cos(pn * 1.5708); dr += q.lp2 * q.lev * Math.sin(pn * 1.5708);
          }
          bl += dm_ * droneG * 1.6; br += dr * droneG * 1.6;
        }
        const gain = volG * this.expS;
        let ol = bl * gain, or = br * gain;
        if (rvMix > 0.001) { const x = (ol + or) * 0.015, wl = rev.tick(0, x, fbR, dm), wr = rev.tick(1, x, fbR, dm); ol = ol * (1 - rvMix * 0.3) + wl * 3 * rvMix; or = or * (1 - rvMix * 0.3) + wr * 3 * rvMix; }
        ol = Math.tanh(ol * 0.8) * 1.25; or = Math.tanh(or * 0.8) * 1.25;
        if (!(ol === ol) || !(or === or)) { ++this.nonFinite; ol = or = 0; }
        outL[i] = ol; outR[i] = or;
      }
    }
  }
  OCC.engines.reedica = { name: 'Reedica', blurb: 'Modelled woodwinds: single and double reeds, air-jet flutes (ney, shakuhachi, bansuri, dizi ...), free reeds (sheng, khaen) and a Highland pipe with drones. The Preset is the instrument.', specs, groups, make: sr => new Reedica(sr), E };
})();
/* Stringica - modelled bowed and plucked strings: a bow rubbing a string (a waveguide with a friction table), a wooden or skin body made of resonances, sympathetic strings,
   a tanpura-style drone, microtonal scales, glides and ornaments. Port of plugins/stringica/stringica.h.
   The C++ 'Instrument' choice (15 instruments: violin ... morin khuur) is this engine's Preset (param 0): it loads bow force/position, noise, vibrato, bridge buzz,
   sympathetic strings, glide and body settings into the sliders. Articulation (arco, staccato, pizzicato, tremolo, swell) is a normal parameter; the plugin's
   keyswitches C0..G0 (MIDI 24..28) also work. Mod wheel = vibrato or dynamics, pitch wheel = glide, Players makes a section. The pitch / waveguide-length update runs every 8th sample (the plugin: every 4th) to save CPU; scope and bow-meter read-outs are dropped. */
(function () {
  'use strict';
  const E = {}; ['Preset', 'Volume', 'Articulation', 'Players', 'Spread', 'BowForce', 'BowPos', 'BowNoise', 'Attack', 'Release', 'Bright', 'Body', 'BodySize', 'Buzz', 'VibDepth', 'VibRate', 'VibDelay', 'ModWheel', 'Legato', 'Glide', 'BendRange',
    'Gamak', 'GamakRate', 'Scoop', 'Scale', 'Tonic', 'Tune', 'Sympath', 'SympDecay', 'Drone', 'DroneLevel', 'DroneSpeed', 'ReverbMix', 'ReverbSize', 'Octave', 'Count'].forEach((n, i) => E[n] = i);
  const kVoices = 8, kMaxPlayers = 8, kPool = kVoices * kMaxPlayers, kModes = 10;
  const SCALES=[{name:'12-tone equal',off:[0,0,0,0,0,0,0,0,0,0,0,0],symp:[0,2,4,5,7,9,11],n:7},
    {name:'Just (Shuddha)',off:[0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7],symp:[0,2,4,5,7,9,11],n:7},
    {name:'Raga Bhairav',off:[0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7],symp:[0,1,4,5,7,8,11],n:7},
    {name:'Raga Yaman',off:[0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7],symp:[0,2,4,6,7,9,11],n:7},
    {name:'Raga Todi',off:[0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7],symp:[0,1,3,6,7,8,11],n:7},
    {name:'Raga Kafi',off:[0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7],symp:[0,2,3,5,7,9,10],n:7},
    {name:'Pythagorean',off:[0,-9.8,3.9,-5.9,7.8,-2,11.7,2,-7.8,5.9,-3.9,9.8],symp:[0,2,4,5,7,9,11],n:7},
    {name:'Chinese pentatonic',off:[0,0,3.9,0,7.8,0,0,2,0,5.9,0,0],symp:[0,2,4,7,9,0,0],n:5},
    {name:'Japanese In',off:[0,0,0,0,0,0,0,2,0,0,0,0],symp:[0,1,5,7,8,0,0],n:5},
    {name:'Maqam Rast',off:[0,0,0,50,0,0,0,0,0,0,50,0],symp:[0,2,3,5,7,9,10],n:7},
    {name:'Maqam Bayati',off:[0,50,0,0,0,0,0,0,0,0,0,0],symp:[0,1,3,5,7,8,10],n:7},
    {name:'Maqam Hijaz',off:[0,0,0,0,0,0,0,0,0,0,0,0],symp:[0,1,4,5,7,8,10],n:7},
    {name:'Slendro-ish',off:[0,0,40,0,0,-20,0,20,0,0,-40,0],symp:[0,2,5,7,10,0,0],n:5},
    {name:'Mongolian pentatonic',off:[0,0,3.9,0,-13.7,0,0,2,0,-15.6,0,0],symp:[0,2,4,7,9,0,0],n:5}];
  
  const dbToGain = db => Math.pow(10, db / 20);
  const hashf = (x, y) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) >>> 0; h = Math.imul((h ^ (h >>> 13)) >>> 0, 1274126177) >>> 0; h = (h ^ (h >>> 16)) >>> 0; return (h & 0xFFFFFF) / 16777215; };
  const blepRes = (t, dt) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; };
  /* RBJ biquad (Peak / LowPass / HighPass), as occeffect.h */
  const BQ_PEAK = 0, BQ_LP = 3, BQ_HP = 4;
  class Biquad {
    constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; }
    set(t, f, q, gainDb, sr) {
      f = Math.min(Math.max(f, 5), sr * 0.49); q = Math.max(0.05, q);
      const A = Math.pow(10, gainDb / 40), w = 2 * Math.PI * f / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * q);
      let B0, B1, B2, A0, A1, A2;
      if (t === BQ_PEAK) { B0 = 1 + al * A; B1 = -2 * cw; B2 = 1 - al * A; A0 = 1 + al / A; A1 = -2 * cw; A2 = 1 - al / A; }
      else if (t === BQ_LP) { B0 = (1 - cw) / 2; B1 = 1 - cw; B2 = (1 - cw) / 2; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; }
      else { B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = (1 + cw) / 2; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; }
      this.b0 = B0 / A0; this.b1 = B1 / A0; this.b2 = B2 / A0; this.a1 = A1 / A0; this.a2 = A2 / A0;
    }
    run(x) { const y = this.b0 * x + this.z1; this.z1 = this.b1 * x - this.a1 * y + this.z2; this.z2 = this.b2 * x - this.a2 * y; return y; }
    reset() { this.z1 = this.z2 = 0; }
  }
  /* Freeverb-style room (avd::Rev of avoidica.h) */
  class Rev {
    constructor(sr) {
      const ct = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], at = [556, 441, 341, 225];
      this.cb = [[], []]; this.ci = [[], []]; this.cz = [[], []]; this.ab = [[], []]; this.ai = [[], []];
      for (let ch = 0; ch < 2; ++ch) {
        for (let k = 0; k < 8; ++k) { this.cb[ch].push(new Float32Array(Math.floor((ct[k] + ch * 23) * sr / 44100) + 1)); this.ci[ch].push(0); this.cz[ch].push(0); }
        for (let k = 0; k < 4; ++k) { this.ab[ch].push(new Float32Array(Math.floor((at[k] + ch * 23) * sr / 44100) + 1)); this.ai[ch].push(0); }
      }
    }
    clear() { for (let ch = 0; ch < 2; ++ch) { for (let k = 0; k < 8; ++k) { this.cb[ch][k].fill(0); this.cz[ch][k] = 0; this.ci[ch][k] = 0; } for (let k = 0; k < 4; ++k) { this.ab[ch][k].fill(0); this.ai[ch][k] = 0; } } }
    tick(ch, x, fb, damp) {
      let s = 0; const cb = this.cb[ch], ci = this.ci[ch], cz = this.cz[ch];
      for (let k = 0; k < 8; ++k) { const b = cb[k], i = ci[k], y = b[i]; const z = y * (1 - damp) + cz[k] * damp; cz[k] = z; b[i] = x + z * fb; ci[k] = i + 1 >= b.length ? 0 : i + 1; s += y; }
      const ab = this.ab[ch], ai = this.ai[ch];
      for (let k = 0; k < 4; ++k) { const b = ab[k], i = ai[k], bo = b[i]; const y = -s + bo; b[i] = s + bo * 0.5; ai[k] = i + 1 >= b.length ? 0 : i + 1; s = y; }
      return s;
    }
  }

  /* name, t60 (pizzicato ring time at 200 Hz), bright, force, pos, noise, attack, release, vibRate, vibDepth, vibDelay, buzz, symp, sympDecay, scoop, gamak, glide, body, hp, lp, gain, [10 body modes: hz, q, dB] */
  const RAW = [
["Violin",1.4,60,52,22,22,55,190,5.8,24,380,0,0,4,0,0,90,60,150,9000,1,[[275,8,6],[460,10,4],[540,12,5],[720,10,2],[1050,8,-2],[1450,6,2],[2400,3,5],[3100,4,4],[4500,3,1],[6200,3,-3]]],
["Viola",1.6,52,50,22,24,70,210,5.3,24,400,0,0,4,0,0,100,62,110,8000,1,[[220,8,6],[370,10,4],[430,12,5],[600,10,2],[850,8,-2],[1200,6,2],[2000,3,4],[2700,4,3],[4000,3,0],[5500,3,-3]]],
["Cello",2,46,48,20,26,90,260,5,26,450,0,0,4,0,0,110,64,55,6500,1,[[95,8,6],[180,10,4],[230,12,5],[330,10,3],[480,8,-1],[700,6,2],[1100,3,4],[1600,4,3],[2400,3,1],[3600,3,-3]]],
["Double bass",2.6,34,46,17,32,130,320,4.4,20,500,0,0,4,0,0,130,66,28,4200,1.1,[[55,8,5],[95,10,4],[140,12,4],[210,10,2],[320,8,-1],[500,6,2],[800,3,3],[1200,4,2],[1800,3,0],[2800,3,-4]]],
["Erhu",1,72,56,14,34,70,170,5.6,34,300,6,0,3,8,0,120,55,180,8500,0.95,[[420,7,5],[650,8,3],[1000,6,2],[1500,5,5],[2200,4,7],[3200,4,5],[4500,3,2],[6000,3,-2],[900,8,-3],[7500,3,-3]]],
["Gaohu",0.9,82,58,13,34,55,150,6.2,30,250,6,0,3,6,0,100,55,280,10000,0.9,[[560,7,5],[850,8,3],[1300,6,2],[1950,5,5],[2900,4,7],[4100,4,5],[5800,3,2],[7500,3,-2],[1150,8,-3],[9000,3,-3]]],
["Haegeum",0.9,64,60,12,46,80,160,5,30,300,14,0,3,18,0,140,52,190,7500,0.95,[[380,6,4],[600,8,4],[900,7,3],[1400,5,4],[2000,4,6],[2800,4,5],[3900,3,3],[5200,3,-1],[800,8,-3],[6800,3,-4]]],
["Kokyu",1,50,46,18,30,100,230,4.8,20,420,4,0,3,14,0,160,58,220,6500,0.95,[[480,6,4],[700,8,3],[1000,6,3],[1500,5,3],[2100,4,4],[3000,3,3],[4200,3,1],[5600,3,-3],[880,8,-2],[7000,3,-4]]],
["Sarangi",2.2,60,62,10,44,60,300,5.2,18,250,42,60,7,25,0,120,66,140,9000,1,[[200,6,5],[340,8,4],[520,8,4],[800,6,3],[1300,5,4],[2000,4,6],[3000,3,5],[4300,3,3],[6000,3,0],[680,7,-2]]],
["Dilruba",2.4,54,58,12,38,90,330,5,22,300,24,45,7,20,0,140,62,120,7500,1,[[190,6,5],[320,8,4],[480,8,4],[720,6,3],[1150,5,4],[1800,4,5],[2700,3,4],[3900,3,2],[5500,3,-1],[620,7,-2]]],
["Esraj",2.8,50,56,12,36,110,380,4.8,20,320,20,40,8,18,0,160,66,100,7000,1,[[150,6,5],[260,8,4],[400,8,4],[620,6,3],[950,5,4],[1500,4,5],[2300,3,4],[3400,3,2],[4800,3,-1],[520,7,-2]]],
["Carnatic violin",1.3,70,54,20,24,50,170,5.6,28,200,0,14,5,22,0,100,58,150,9500,1,[[280,8,6],[470,10,4],[550,12,5],[740,10,2],[1060,8,-2],[1480,6,2],[2500,3,6],[3300,4,5],[4700,3,2],[6400,3,-2]]],
["Kamancheh",1.2,66,58,12,36,75,190,5.5,26,300,10,8,4,12,0,110,58,200,8500,0.95,[[250,6,4],[440,8,3],[700,7,3],[1100,6,3],[1700,5,5],[2400,4,6],[3400,3,5],[4800,3,2],[5900,3,-2],[580,7,-2]]],
["Rebab",1,40,54,12,50,90,200,4.6,26,350,22,0,3,14,0,150,56,180,5500,0.95,[[300,6,4],[520,7,4],[780,6,3],[1150,5,3],[1700,4,4],[2400,4,3],[3300,3,1],[4400,3,-2],[640,7,-2],[5800,3,-5]]],
["Morin khuur",1.8,48,56,14,44,110,280,4.2,20,450,16,10,3,10,0,140,62,75,5800,1,[[120,7,5],[250,8,4],[400,8,4],[620,6,3],[900,5,3],[1400,4,4],[2000,3,3],[3000,3,0],[520,7,-2],[4400,3,-4]]]
];
  const INST = RAW.map(r => ({ name: r[0], t60: r[1], bright: r[2], force: r[3], pos: r[4], noise: r[5], attack: r[6], release: r[7], vibRate: r[8], vibDepth: r[9], vibDelay: r[10], buzz: r[11], symp: r[12], sympDecay: r[13], scoop: r[14], gamak: r[15], glide: r[16], body: r[17], hp: r[18], lp: r[19], gain: r[20], m: r[21] }));
  const nI = INST.length;
  const specs = [
    P('Preset', '', 0, nI - 1, 0, '%.0f', false, INST.map(i => i.name)),
    P('Volume', 'dB', -24, 12, 0, '%.1f dB'),
    P('Articulation', '', 0, 4, 0, '%.0f', false, ['Arco', 'Staccato', 'Pizzicato', 'Tremolo', 'Swell']),
    P('Players', '', 0, 3, 0, '%.0f', false, ['Solo', 'Duo', 'Section 4', 'Ensemble 8']),
    P('Spread', '%', 0, 100, 40, '%.0f %'),
    P('Bow force', '%', 0, 100, 52, '%.0f %'),
    P('Bow position', '%', 0, 100, 22, '%.0f %'),
    P('Bow noise', '%', 0, 100, 22, '%.0f %'),
    P('Attack', 'ms', 5, 600, 55, '%.0f ms', true),
    P('Release', 'ms', 10, 2000, 190, '%.0f ms', true),
    P('Brightness', '%', 0, 100, 60, '%.0f %'),
    P('Body', '%', 0, 100, 60, '%.0f %'),
    P('Body size', '%', -100, 100, 0, '%.0f %'),
    P('Bridge buzz', '%', 0, 100, 0, '%.0f %'),
    P('Vibrato depth', 'cents', 0, 100, 24, '%.0f c'),
    P('Vibrato rate', 'Hz', 2, 9, 5.8, '%.1f Hz'),
    P('Vibrato delay', 'ms', 0, 1500, 380, '%.0f ms'),
    P('Mod wheel', '', 0, 1, 0, '%.0f', false, ['Vibrato', 'Dynamics']),
    P('Legato', '', 0, 1, 0, '%.0f', false, ['Poly', 'Mono legato']),
    P('Glide', 'ms', 0, 800, 90, '%.0f ms'),
    P('Bend range', 'st', 1, 12, 2, '%.0f st'),
    P('Gamak', '%', 0, 100, 0, '%.0f %'),
    P('Gamak rate', 'Hz', 2, 10, 6, '%.1f Hz'),
    P('Slide-in', '%', 0, 100, 0, '%.0f %'),
    P('Scale', '', 0, SCALES.length - 1, 0, '%.0f', false, SCALES.map(s => s.name)),
    P('Tonic', '', 0, 11, 0, '%.0f', false, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']),
    P('Tune', 'cents', -50, 50, 0, '%.0f c'),
    P('Sympathetic', '%', 0, 100, 0, '%.0f %'),
    P('Sympathetic decay', 's', 0.5, 12, 4, '%.1f s', true),
    P('Drone', '', 0, 3, 0, '%.0f', false, ['Off', 'Sa-Pa', 'Sa-Ma', 'Sa-Ni']),
    P('Drone level', 'dB', -40, 0, -18, '%.0f dB'),
    P('Drone cycle', 's', 2, 9, 4.5, '%.1f s'),
    P('Reverb mix', '%', 0, 100, 18, '%.0f %'),
    P('Reverb size', '%', 0, 100, 55, '%.0f %'),
    P('Octave', '', -2, 2, 0, '%.0f'),
  ];
  const groups = [
    ['Bow', [E.Articulation, E.BowForce, E.BowPos, E.BowNoise, E.Attack, E.Release]],
    ['Body and strings', [E.Bright, E.Body, E.BodySize, E.Buzz, E.Sympath, E.SympDecay]],
    ['Expression', [E.VibDepth, E.VibRate, E.VibDelay, E.ModWheel, E.Legato, E.Glide, E.BendRange, E.Gamak, E.GamakRate, E.Scoop]],
    ['Section', [E.Players, E.Spread]],
    ['Scale and tuning', [E.Scale, E.Tonic, E.Tune, E.Octave]],
    ['Drone', [E.Drone, E.DroneLevel, E.DroneSpeed]],
    ['Output', [E.Volume, E.ReverbMix, E.ReverbSize]],
  ];
  const newStr = maxLen => ({ neck: new DelayLine(maxLen), bridge: new DelayLine(maxLen), lpB: 0, lpN: 0, lev: 0, ring: 0, pole: 0.3, loopGain: 0.999, pendingPluck: 0, on: false, plucked: false, state: 0,
    lf: 6, lfT: 6, bowEnv: 0, bowTarget: 0, bowDyn: 0, relDamp: 1, vibPh: 0, vibAge: 0, gamPh: 0, tremPh: 0, scoopSemis: 0, age: 0, holdLeft: 0, jitter: 0, nzf: 0,
    Lb: 20, Ln: 80, pc: 0, pan: 0.5, detune: 0, gainTrim: 1, startDelay: 0, group: -1, art: 0, attackK: 0.01, relK: 0.001, swell: 1, seed: 1 });
  function clearStr(s) {
    s.neck.clear(); s.bridge.clear(); s.lpB = s.lpN = s.lev = s.ring = s.pendingPluck = 0; s.on = s.plucked = false; s.state = 0; s.bowEnv = s.bowTarget = 0; s.relDamp = 1;
    s.vibPh = s.vibAge = s.gamPh = s.tremPh = s.scoopSemis = s.age = s.holdLeft = 0; s.startDelay = 0; s.group = -1;
  }
  const newGroup = () => ({ on: false, held: false, note: 0, nPl: 1, vel: 0.7, age: 0, sv: [0, 0, 0, 0, 0, 0, 0, 0], art: 0 });
  const bowTable = (dv, slope) => { const x = Math.abs(dv) * slope + 0.75, x2 = x * x; return clampf(1 / (x2 * x2), 0.01, 0.98); };
  const DRATIOS = [0.75, 2 / 3, 0.9375];

  class Stringica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); this.dt = 1 / sr;
      const maxLen = Math.floor(sr / 18) + 64; this.pool = []; for (let i = 0; i < kPool; ++i) this.pool.push(newStr(maxLen));
      this.droneStr = []; for (let i = 0; i < 4; ++i) this.droneStr.push(newStr(maxLen));
      this.symp = []; for (let i = 0; i < 12; ++i) this.symp.push({ d: new DelayLine(Math.floor(sr / 20) + 64), z: 0, len: 100, fb: 0.999, on: false });
      this.grp = []; for (let i = 0; i < kVoices; ++i) this.grp.push(newGroup());
      this.held = []; this.body = [[], []]; this.hp = [new Biquad(), new Biquad()];
      for (let c = 0; c < 2; ++c) for (let k = 0; k < kModes; ++k) this.body[c].push(new Biquad());
      this.lpz = [0, 0]; this.lpA = 0.5; this.rev = new Rev(sr); this.rng = new Noise(0x9E3779B9);
      this.bend = 0; this.bendS = 0; this.mw = 0; this.mwSeen = false; this.expr = 1; this.expS = 1; this.press = 0; this.ageCtr = 0; this.nonFinite = 0; this.dronePh = 0; this.droneIdx = 0;
      this.volG = 1; this.glideK = 0.01; this.glideK4 = 0.04; this.instGain = 1; this.beta = 0.11; this.nSymp = 0; this.inst = INST[0];
      this.loadInstrument(0, false);
    }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.mw = m; this.mwSeen = true; } pressure(p) { this.press = p; }
    allNotesOff() { for (const g of this.grp) if (g.on) this.release(g); this.held.length = 0; }
    set(id, x) {
      if (id < 0 || id >= E.Count) return;
      if (id === E.Preset) { this.loadInstrument(Math.max(0, Math.min(nI - 1, Math.round(x))), true); return; }
      this.v[id] = x; this.configure();
    }
    loadInstrument(i, notify) {
      const n = INST[i], V = this.v; V[E.Preset] = i; if (notify) this.writeParam(E.Preset, i);
      const put = (id, val) => { V[id] = val; if (notify) this.writeParam(id, val); };
      put(E.Bright, n.bright); put(E.BowForce, n.force); put(E.BowPos, n.pos); put(E.BowNoise, n.noise); put(E.Attack, n.attack); put(E.Release, n.release); put(E.VibRate, n.vibRate); put(E.VibDepth, n.vibDepth); put(E.VibDelay, n.vibDelay);
      put(E.Buzz, n.buzz); put(E.Sympath, n.symp); put(E.SympDecay, n.sympDecay); put(E.Scoop, n.scoop); put(E.Gamak, n.gamak); put(E.Glide, n.glide); put(E.Body, n.body);
      this.configure();
    }
    scaleCents(note) { const pc = (((note - Math.round(this.v[E.Tonic])) % 12) + 12) % 12; return SCALES[Math.round(this.v[E.Scale])].off[pc]; }
    noteHz(note, extra) { const V = this.v; return 440 * Math.pow(2, (note + 12 * Math.round(V[E.Octave]) - 69 + (V[E.Tune] + this.scaleCents(note) + (extra || 0)) / 100) / 12); }
    configure() {
      const V = this.v, sr = this.sr, n = INST[Math.round(V[E.Preset])]; this.inst = n; const size = Math.pow(2, V[E.BodySize] * 0.01 * 0.4), bg = V[E.Body] / 60;
      for (let c = 0; c < 2; ++c) { for (let k = 0; k < kModes; ++k) this.body[c][k].set(BQ_PEAK, n.m[k][0] * size, n.m[k][1], n.m[k][2] * bg, sr); this.hp[c].set(BQ_HP, n.hp, 0.7, 0, sr); }
      this.lpA = Math.exp(-2 * Math.PI * Math.min(n.lp * (0.7 + 0.6 * V[E.Bright] / 100), sr * 0.45) / sr);
      this.beta = clampf(0.05 + 0.40 * Math.pow(V[E.BowPos] * 0.01, 1.3), 0.04, 0.5); this.volG = dbToGain(V[E.Volume]); this.instGain = n.gain;
      this.glideK = V[E.Glide] < 1 ? 1 : 1 - Math.exp(-1 / (V[E.Glide] * 0.001 * sr)); this.glideK4 = this.glideK >= 1 ? 1 : 1 - Math.pow(1 - this.glideK, 8);
      this.rebuildSymp();
    }
    rebuildSymp() {
      const V = this.v, sc = SCALES[Math.round(V[E.Scale])], tonic = Math.round(V[E.Tonic]), sd = V[E.SympDecay], sr = this.sr; this.nSymp = 0;
      for (const c of this.symp) c.on = false;
      if (V[E.Sympath] < 0.5) return;
      let k = 0;
      for (let d = 0; d < sc.n && k < 11; ++d) { const note = 60 + ((tonic + sc.symp[d]) % 12), hz = this.noteHz(note), q = this.symp[k++]; q.on = true; q.len = sr / hz; q.fb = Math.min(0.9998, Math.pow(10, -3 * q.len / (sr * sd))); }
      { const hz = this.noteHz(48 + tonic), q = this.symp[k++]; q.on = true; q.len = sr / hz; q.fb = Math.min(0.9998, Math.pow(10, -3 * q.len / (sr * sd))); }
      this.nSymp = k;
    }
    /* a plucked string: a triangular displacement with its corner at the pluck point, plus a little noise for the finger or nail */
    pluck(s, amp) {
      const V = this.v, hz = Math.pow(2, s.lf), beta = clampf(0.05 + 0.40 * Math.pow(V[E.BowPos] * 0.01, 1.3), 0.05, 0.5), D = Math.max(8, this.sr / hz - s.pole / (1 - s.pole) - 0.12);
      const Lb = Math.max(2, Math.round(beta * D)), Ln = Math.max(2, Math.round((1 - beta) * D)); s.neck.clear(); s.bridge.clear(); let z = 0;
      for (let i = Ln - 1; i >= 0; --i) { const x = i / Ln, tri = x < 0.5 ? x * 2 : (1 - x) * 2; z = z * 0.5 + this.rng.white() * 0.5; s.neck.push(amp * 0.5 * (tri + 0.12 * z)); }
      for (let i = Lb - 1; i >= 0; --i) { const x = i / Lb, tri = x < 0.5 ? x * 2 : (1 - x) * 2; z = z * 0.5 + this.rng.white() * 0.5; s.bridge.push(amp * 0.5 * (tri + 0.12 * z)); }
      s.ring = amp;
    }
    startString(s, hz, vel, art, plucked, player, nPl, groupIdx, seed) {
      const V = this.v, sr = this.sr, n = this.inst, spread = V[E.Spread] * 0.01; clearStr(s); s.on = true; s.plucked = plucked; s.state = 1; s.art = art; s.group = groupIdx; s.seed = seed;
      const h1 = hashf(seed, 1 + player), h2 = hashf(seed, 17 + player), h3 = hashf(seed, 31 + player);
      s.detune = nPl > 1 ? (h1 * 2 - 1) * 12 * spread : 0;
      s.startDelay = nPl > 1 && player > 0 ? Math.floor(h2 * spread * 0.022 * sr) : 0;
      s.pan = nPl > 1 ? 0.5 + 0.5 * ((player + 0.5) / nPl * 2 - 1) * (0.2 + 0.8 * spread) + (h3 - 0.5) * 0.08 * spread : 0.5;
      s.vibPh = h3 * 6.2832; s.gamPh = 0; s.tremPh = h2; s.nzf = 0; s.jitter = 1 + (h2 - 0.5) * (nPl > 1 ? 0.16 : 0.04); s.age = 0; s.vibAge = 0; s.gainTrim = 1;
      s.lf = s.lfT = Math.log2(hz); s.scoopSemis = -V[E.Scoop] * 0.01 * 2 * (plucked ? 0 : 1); s.bowDyn = vel;
      const b01 = V[E.Bright] * 0.01, f0 = hz; s.pole = clampf(0.66 - 0.60 * b01, 0.03, 0.7) * clampf(Math.pow(f0 / 300, 0.22), 0.6, 1.5); s.pole = clampf(s.pole, 0.03, 0.85);
      const t60 = plucked ? n.t60 : n.t60 * 2.6; s.loopGain = Math.min(0.99985, Math.pow(10, -3 / (t60 * f0)));
      const velA = 1.3 - 0.8 * vel; s.attackK = 1 / Math.max(8, V[E.Attack] * 0.001 * sr * velA * (art === 1 ? 0.2 : 1)); s.relK = Math.exp(-1 / (V[E.Release] * 0.001 * sr));
      s.holdLeft = art === 1 ? sr * (0.07 + 0.08 * (1 - vel)) : 1e30; s.swell = art === 4 ? 0 : 1;
      if (plucked) { s.bowEnv = 0; if (s.startDelay === 0) this.pluck(s, 0.35 + 0.65 * vel); else s.pendingPluck = 0.35 + 0.65 * vel; }
    }
    noteOn(note, vel) {
      const V = this.v;
      if (note >= 24 && note <= 28) { V[E.Articulation] = note - 24; this.writeParam(E.Articulation, V[E.Articulation]); return; }
      vel = clampf(vel, 0.02, 1); const art = Math.round(V[E.Articulation]), pz = art === 2, hz = this.noteHz(note, this.noteTune);
      if (V[E.Legato] > 0.5) {
        let g = null; for (const q of this.grp) if (q.on && q.held) { g = q; break; }
        if (g) { this.held.push(note); g.note = note; this.retarget(g, hz); return; }
      }
      const grp = this.grp, pool = this.pool; let gi = -1;
      for (let i = 0; i < kVoices; ++i) if (!grp[i].on) { gi = i; break; }
      if (gi < 0) { let oldest = Infinity; for (let i = 0; i < kVoices; ++i) if (grp[i].age < oldest) { oldest = grp[i].age; gi = i; } for (let j = 0; j < grp[gi].nPl; ++j) pool[grp[gi].sv[j]].on = false; grp[gi].on = false; }
      const nPl = 1 << clampf(Math.round(V[E.Players]), 0, 3);
      const got = []; for (let i = 0; i < kPool && got.length < nPl; ++i) if (!pool[i].on) got.push(i);
      if (got.length < nPl) {
        for (let pass = 0; pass < kVoices && got.length < nPl; ++pass) {
          let vi = -1, oldest = Infinity; for (let i = 0; i < kVoices; ++i) if (grp[i].on && i !== gi && grp[i].age < oldest) { oldest = grp[i].age; vi = i; }
          if (vi < 0) break; for (let j = 0; j < grp[vi].nPl; ++j) pool[grp[vi].sv[j]].on = false; grp[vi].on = false;
          for (let i = 0; i < kPool && got.length < nPl; ++i) if (!pool[i].on && got.indexOf(i) < 0) got.push(i);
        }
      }
      if (got.length < nPl) return;
      const g = grp[gi]; g.on = true; g.held = true; g.note = note; g.nPl = nPl; g.vel = vel; g.age = ++this.ageCtr; g.art = art; const seed = ((Math.imul(note, 2654435761) >>> 0) ^ (Math.imul(this.ageCtr, 40503) >>> 0)) >>> 0;
      for (let j = 0; j < nPl; ++j) { g.sv[j] = got[j]; clearStr(pool[got[j]]); this.startString(pool[got[j]], hz, vel, art, pz, j, nPl, gi, seed); }
      this.held.push(note);
    }
    retarget(g, hz) { for (let j = 0; j < g.nPl; ++j) { const s = this.pool[g.sv[j]]; if (!s.on) continue; s.lfT = Math.log2(hz); if (this.glideK >= 1) s.lf = s.lfT; if (s.state === 3) s.state = 2; } }
    release(g) { g.held = false; for (let j = 0; j < g.nPl; ++j) { const s = this.pool[g.sv[j]]; if (s.on && s.state !== 3) s.state = 3; } }
    noteOff(note) {
      const k = this.held.indexOf(note); if (k >= 0) this.held.splice(k, 1);
      if (this.v[E.Legato] > 0.5) {
        for (const g of this.grp) if (g.on && g.held) {
          if (this.held.length) { if (g.note === note) { g.note = this.held[this.held.length - 1]; this.retarget(g, this.noteHz(g.note)); } } else this.release(g);
          return;
        }
      }
      for (const g of this.grp) if (g.on && g.held && g.note === note) { this.release(g); return; }
    }
    /* one string, one sample */
    stepStr(s, extraCents, isDrone) {
      if (s.startDelay > 0) { if (--s.startDelay === 0 && s.pendingPluck > 0) { this.pluck(s, s.pendingPluck); s.pendingPluck = 0; } return 0; }
      const V = this.v, sr = this.sr, mwVib = V[E.ModWheel] < 0.5; s.age += this.dt;
      let vb = 0;
      if (!s.plucked) {
        const tremolo = s.art === 3;
        if (s.state === 1) { s.bowEnv += s.attackK; if (s.bowEnv >= 1) { s.bowEnv = 1; s.state = 2; } }
        else if (s.state === 2) { if (s.art === 1 && (s.holdLeft -= 1) <= 0) s.state = 3; }
        else if (s.state === 3) { s.bowEnv *= s.relK * (s.art === 1 ? 0.995 : 1); s.relDamp = Math.max(0.88, s.relDamp - 0.00008); }
        if (s.art === 4) s.swell = Math.min(1, s.swell + 1 / (0.7 * sr));
        let env = s.bowEnv * (s.art === 4 ? 0.25 + 0.75 * s.swell : 1);
        if (tremolo) { s.tremPh += 11.5 / sr; if (s.tremPh >= 1) s.tremPh -= 1; const sq = Math.sin(6.2832 * s.tremPh); env *= 0.18 + 0.82 * clampf(sq * 2.2 + 0.5, 0, 1); }
        const dynNow = (!mwVib && this.mwSeen) ? clampf(this.mw + this.press * 0.3, 0, 1) : s.bowDyn;
        s.nzf = s.nzf * 0.7 + this.rng.white() * 0.3;
        const dyn = (!mwVib && this.mwSeen) ? dynNow : s.bowDyn, dc = dyn * dyn * 0.7 + dyn * 0.3;
        const nb = V[E.BowNoise] * 0.01, scratch = s.state === 1 ? 1 + 5 * (1 - s.bowEnv) : 1;
        vb = env * (0.012 + 0.30 * dc) * (1 + nb * 0.35 * scratch * s.nzf * 2);
      }
      const pk = s.pc; s.pc = (pk + 1) & 7;
      if (pk === 0) {
        const dt4 = 8 / sr;
        if (this.glideK < 1) s.lf += (s.lfT - s.lf) * this.glideK4; else s.lf = s.lfT;
        let cents = s.detune + extraCents + s.scoopSemis * 100; s.scoopSemis *= 0.99760144; if (Math.abs(s.scoopSemis) < 1e-4) s.scoopSemis = 0;
        s.vibAge += dt4; {
          const depth = V[E.VibDepth] + (mwVib ? this.mw * 60 : 0), ramp = clampf((s.vibAge - V[E.VibDelay] * 0.001) / 0.35, 0, 1);
          s.vibPh += 6.2832 * V[E.VibRate] * s.jitter * dt4; if (s.vibPh > 6.2832) s.vibPh -= 6.2832; cents += depth * ramp * Math.sin(s.vibPh) * (s.plucked ? 0 : 1);
        }
        if (V[E.Gamak] > 0.5 && !s.plucked && !isDrone) { s.gamPh += V[E.GamakRate] * s.jitter * dt4; if (s.gamPh >= 1) s.gamPh -= 1; const tri = s.gamPh < 0.5 ? s.gamPh * 2 : 2 - s.gamPh * 2, ramp = clampf((s.age - 0.12) / 0.25, 0, 1); cents += tri * tri * (3 - 2 * tri) * V[E.Gamak] * 0.01 * 120 * ramp; }
        cents += this.bendS * V[E.BendRange] * 100;
        const hz = Math.pow(2, s.lf + cents / 1200);
        let D = sr / hz - s.pole / (1 - s.pole) - 0.12; D = clampf(D, 7, s.neck.mask - 8);
        s.Lb = Math.max(2, this.beta * D); s.Ln = Math.max(2, (1 - this.beta) * D);
      }
      const bArr = s.bridge.read(s.Lb), nArr = s.neck.read(s.Ln);
      s.lpB = (1 - s.pole) * bArr + s.pole * s.lpB; s.lpN = 0.9 * nArr + 0.1 * s.lpN;
      const damp = s.relDamp * (s.plucked && s.state === 3 ? 0.985 : 1);
      const bridgeRefl = -s.lpB * s.loopGain * damp, nutRefl = -s.lpN * 0.996 * damp;
      let newVel = 0;
      if (!s.plucked && s.bowEnv > 1e-4) { const slope = 1.8 + 4.2 * (V[E.BowForce] * 0.01) * (0.75 + 0.5 * s.bowDyn), dv = vb - (bridgeRefl + nutRefl); newVel = dv * bowTable(dv, slope) * Math.min(1, s.bowEnv * 8); }
      s.neck.push(bridgeRefl + newVel); s.bridge.push(nutRefl + newVel);
      const y = bArr;
      if (!(Math.abs(y) < 20)) { clearStr(s); ++this.nonFinite; return 0; }
      s.lev += (Math.abs(y) - s.lev) * 0.002;
      if (s.state === 3 && s.lev < 2e-5 && s.bowEnv < 1e-3) { s.on = false; s.state = 0; }
      else if (s.plucked && s.state >= 1 && s.lev < 1e-5 && s.age > 0.2) { s.on = false; s.state = 0; }   // (the plugin waits for state >= 2; a pizzicato string that has rung out is freed here too)
      return y;
    }
    process(outL, outR, n) {
      const V = this.v, sr = this.sr, sympL = V[E.Sympath] * 0.01, bz = V[E.Buzz] * 0.01, rvMix = V[E.ReverbMix] * 0.01, droneG = dbToGain(V[E.DroneLevel]), droneMode = Math.round(V[E.Drone]);
      const grp = this.grp, pool = this.pool, hp = this.hp, body = this.body, lpz = this.lpz, lpA = this.lpA, rev = this.rev, symp = this.symp, nSymp = this.nSymp;
      const norm0 = 1 / Math.sqrt(1 << clampf(Math.round(V[E.Players]), 0, 3)), volG = this.volG * this.instGain * 0.9;
      const fbR = 0.7 + 0.28 * (V[E.ReverbSize] * 0.01), dm = 0.35;
      for (let i = 0; i < n; ++i) {
        this.bendS += (this.bend - this.bendS) * 0.01; this.expS += (this.expr - this.expS) * 0.002;
        let l = 0, r = 0, dL = 0, dR = 0, nAct = 0;
        for (let gi = 0; gi < kVoices; ++gi) {
          const g = grp[gi]; if (!g.on) continue; let any = false;
          for (let j = 0; j < g.nPl; ++j) {
            const s = pool[g.sv[j]]; if (!s.on) continue; any = true; const y = this.stepStr(s, 0, false), gl = Math.cos(s.pan * 1.5708), gr = Math.sin(s.pan * 1.5708); l += y * gl; r += y * gr; nAct += 1;
          }
          if (!any) g.on = false;
        }
        if (nAct > 0) { l *= norm0; r *= norm0; }
        if (bz > 0) { l = l * (1 - 0.4 * bz) + bz * 0.12 * Math.tanh(8 * l); r = r * (1 - 0.4 * bz) + bz * 0.12 * Math.tanh(8 * r); }
        let bl = hp[0].run(l), br = hp[1].run(r);
        for (let k = 0; k < kModes; ++k) { bl = body[0][k].run(bl); br = body[1][k].run(br); }
        lpz[0] = bl * (1 - lpA) + lpz[0] * lpA; lpz[1] = br * (1 - lpA) + lpz[1] * lpA; bl = lpz[0]; br = lpz[1];
        if (sympL > 0 && nSymp > 0) {
          const m = (l + r) * 0.5; let sum = 0;
          for (let k = 0; k < nSymp; ++k) { const q = symp[k]; if (!q.on) continue; const y = q.d.read(q.len); q.z = y * 0.6 + q.z * 0.4; q.d.push(m * (1 - q.fb) * 2 + q.z * q.fb); sum += y; }
          const so = sum * sympL * 1.5; bl += so * 0.8; br += so * 0.8;
        }
        if (droneMode > 0) {
          this.dronePh += 1 / sr; const step = V[E.DroneSpeed] / 4;
          if (this.dronePh >= step) {
            this.dronePh -= step; const sa = this.noteHz(48 + Math.round(V[E.Tonic])), di = this.droneIdx, rat = di === 0 ? DRATIOS[droneMode - 1] : (di === 3 ? 0.5 : 1.0), f = sa * rat;
            const s = this.droneStr[di]; clearStr(s); s.on = true; s.plucked = true; s.state = 2; s.lf = s.lfT = Math.log2(f); s.pole = 0.18; s.loopGain = Math.min(0.9998, Math.pow(10, -3 / (3.6 * f))); s.pan = 0.35 + 0.1 * di; s.seed = 77 + di;
            this.pluck(s, 0.6 + 0.2 * hashf(this.ageCtr, di)); this.droneIdx = (di + 1) & 3;
          }
          for (let d = 0; d < 4; ++d) { const s = this.droneStr[d]; if (!s.on) continue; const y = this.stepStr(s, 0, true), gl = Math.cos(s.pan * 1.5708), gr = Math.sin(s.pan * 1.5708); dL += y * gl; dR += y * gr; }
          dL = (dL * 0.6 + 0.35 * Math.tanh(7 * dL)) * droneG * 1.4; dR = (dR * 0.6 + 0.35 * Math.tanh(7 * dR)) * droneG * 1.4; bl += dL; br += dR;
        }
        const gain = volG * this.expS;
        let ol = bl * gain, or = br * gain;
        if (rvMix > 0.001) { const x = (ol + or) * 0.015, wl = rev.tick(0, x, fbR, dm), wr = rev.tick(1, x, fbR, dm); ol = ol * (1 - rvMix * 0.3) + wl * 3 * rvMix; or = or * (1 - rvMix * 0.3) + wr * 3 * rvMix; }
        ol = Math.tanh(ol * 0.8) * 1.25; or = Math.tanh(or * 0.8) * 1.25;
        if (!(ol === ol) || !(or === or)) { ++this.nonFinite; ol = or = 0; }
        outL[i] = ol; outR[i] = or;
      }
    }
  }
  OCC.engines.stringica = { name: 'Stringica', blurb: 'Modelled bowed and plucked strings: bow friction waveguide, resonant bodies, sympathetic strings, tanpura drone, microtonal scales. The Preset is the instrument (violin to cello, erhu, sarangi, kamancheh, morin khuur ...); articulation switches arco / staccato / pizzicato / tremolo / swell.', specs, groups, make: sr => new Stringica(sr), E };
})();
/* Pipica - a pipe organ. Every pipe is a single-cycle spectrum (the "recipe" of its family: principal, flute, string or reed) read by a table lookup, so a full organ costs very little.
   Around the pipes: a wind system that sags when you pull stops and play a big chord, the tremulant, the chiff of a pipe speaking, a swell box, couplers, old tunings, and a
   room for the building the organ stands in (a port of AcousiMagica: image-source early reflections plus an 8-line feedback delay network, with the plugin's 22 places).
   Five kinds of organ: church, theatre (with percussion and traps), chamber, positive and barrel organ (which plays its own pinned tunes). Port of plugins/pipica/pipica.h + pipica_data.h.
   The C++ 'Registration' (16 whole-organ presets) is this engine's Preset (param 0). Stops are numbered per division (Great / Swell / Pedal) as in the plugin; what stop N is depends
   on the Organ type (e.g. church Great: 1 Bourdon 16', 2 Principal 8', 3 Hohlflote 8', 4 Gamba 8', 5 Octave 4', 6 Rohrflote 4', 7 Mixture IV, 8 Trumpet 8'; church Swell: 1 Stopped
   Diapason 8', 2 Salicional 8', 3 Voix Celeste 8', 4 Flute Octaviante 4', 5 Nazard 2 2/3', 6 Oboe 8', 7 Trompette 8', 8 Vox Humana 8'; church Pedal: 1 Contra Bourdon 32',
   2 Open Wood 16', 3 Subbass 16', 4 Octave 8', 5 Bass Flute 8', 6 Choral Bass 4', 7 Posaune 16', 8 Trumpet 8'). Keys at or below the Pedal split play the Pedal division.
   Differences from the plugin: no MIDI channels (the web host sends one channel) so channel 10 traps are reached through the extra 'Trap keys' switch (theatre organ with Traps on:
   keys below C2 hit the drums, one per pitch class); 'By MIDI channel' key mode therefore plays the Great. The tremulant LFO runs at its stated rate (the C++ advances it once per
   32-sample block, which makes it 32 times too slow). The room uses linear-interpolated early taps and a fixed 3-reflection order. */
(function () {
  'use strict';
  const kTab = 2048, kBands = 20, kMaxHarm = 64, kVoices = 56, kDivs = 3, kStopsPer = 8, kPlaces = 22, kRegs = 16;
  const Church = 0, Theatre = 1, Chamber = 2, Positive = 3, Barrel = 4, kTypes = 5;
  const Great = 0, Swell = 1, Pedal = 2;
  const F_Principal = 0, F_Flute = 1, F_String = 2, F_Reed = 3;
  const R_Principal = 0, R_Octave = 1, R_Diapason = 2, R_Hohl = 3, R_Gedackt = 4, R_Rohr = 5, R_Tibia = 6, R_Spitz = 7, R_OpenFlute = 8, R_Nasard = 9, R_Salicional = 10, R_Gamba = 11, R_Violin = 12,
    R_Trumpet = 13, R_Tuba = 14, R_Oboe = 15, R_Clarinet = 16, R_Regal = 17, R_Vox = 18, R_Kinura = 19, R_Count = 20;
  const P_None = 0, P_Xylophone = 1, P_Glock = 2, P_Chimes = 3, P_BassDrum = 4, P_Zimbel = 5;
  const recipeFamily = r => {
    switch (r) { case R_Principal: case R_Octave: case R_Diapason: return F_Principal; case R_Salicional: case R_Gamba: case R_Violin: return F_String;
      case R_Trumpet: case R_Tuba: case R_Oboe: case R_Clarinet: case R_Regal: case R_Vox: case R_Kinura: return F_Reed; default: return F_Flute; }
  };
  const formant = (hz, fc, bw, g) => { const x = (hz - fc) / bw; return 1 + g * Math.exp(-x * x); };
  const pw = Math.pow, ex = Math.exp;
  /* amplitude of harmonic k of a pipe whose fundamental is f0 (Hz) */
  function harmonicAmp(recipe, k, f0) {
    const K = k, hz = k * f0, odd = (k & 1) ? 1 : 0;
    switch (recipe) {
      case R_Principal: return pw(K, -1.05) * ex(-K / 14) * (k === 2 ? 1.15 : 1);
      case R_Octave: return pw(K, -0.85) * ex(-K / 20);
      case R_Diapason: return pw(K, -1.1) * ex(-K / 9) * (k < 4 ? 1.4 : 1);
      case R_Hohl: return pw(K, -1.6) * ex(-K / 5) * (odd ? 1.2 : 1);
      case R_Gedackt: return pw(K, -1.3) * ex(-K / 9) * (odd ? 1 : 0.03);
      case R_Rohr: return pw(K, -1.3) * ex(-K / 11) * (odd ? 1 : 0.05) * (1 + 1.2 * ex(-pw((K - 5) / 1.5, 2)));
      case R_Tibia: return k === 1 ? 1 : (k === 2 ? 0.16 : (k === 3 ? 0.30 : pw(K, -2.1) * ex(-K / 6)));
      case R_Spitz: return pw(K, -1.2) * ex(-K / 10);
      case R_OpenFlute: return pw(K, -2.0) * ex(-K / 6);
      case R_Nasard: return pw(K, -1.2) * ex(-K / 12) * (odd ? 1 : 0.25) * (1 + 0.8 * ex(-pw((K - 3) / 1.2, 2)));
      case R_Salicional: return pw(K, -0.7) * ex(-K / 16) * (1 + 1.5 * ex(-pw((K - 7) / 3, 2)));
      case R_Gamba: return pw(K, -0.55) * ex(-K / 22) * (1 + 2.0 * ex(-pw((K - 9) / 4, 2)));
      case R_Violin: return pw(K, -0.45) * ex(-K / 26) * (1 + 2.5 * ex(-pw((K - 11) / 3, 2)));
      case R_Trumpet: return pw(K, -0.3) * ex(-K / 30) * formant(hz, 1700, 900, 2.5);
      case R_Tuba: return pw(K, -0.3) * ex(-K / 20) * formant(hz, 500, 350, 2.5);
      case R_Oboe: return pw(K, -0.45) * ex(-K / 24) * formant(hz, 1100, 300, 3.0);
      case R_Clarinet: return pw(K, -0.8) * ex(-K / 20) * (odd ? 1 : 0.05) * formant(hz, 1600, 500, 0.8);
      case R_Regal: return pw(K, -0.4) * ex(-K / 32) * formant(hz, 2500, 700, 1.5);
      case R_Vox: return pw(K, -0.8) * ex(-K / 18) * (formant(hz, 800, 180, 3.0) + 0.5 * formant(hz, 1250, 200, 1.5));
      case R_Kinura: return pw(K, -0.3) * ex(-K / 40) * formant(hz, 2800, 900, 2.0);
    }
    return 0;
  }
  /* ---- stops */
  const S1 = (name, recipe, ratio, level, attack, release, chiff) => ({ name, recipe, ncomp: 1, comp: [{ ratio, amp: 1, cents: 0 }], level, attack, release, chiff, perc: 0 });
  const SC = (name, recipe, ratio, level, attack, release, chiff) => ({ name, recipe, ncomp: 2, comp: [{ ratio, amp: 0.8, cents: -4 }, { ratio, amp: 0.8, cents: 4 }], level, attack, release, chiff, perc: 0 });
  const SM = (name, recipe, ratios, level, attack, release, chiff) => { const comp = []; for (const x of ratios) if (comp.length < 5) comp.push({ ratio: x, amp: 1 / ratios.length * 1.6, cents: 0 }); return { name, recipe, ncomp: comp.length, comp, level, attack, release, chiff, perc: 0 }; };
  const SP = (name, kind, level) => ({ name, recipe: R_Principal, ncomp: 1, comp: [{ ratio: 1, amp: 1, cents: 0 }], level, attack: 0, release: 0.08, chiff: 0, perc: kind });
  const TBL = []; for (let t = 0; t < kTypes; ++t) TBL.push([[], [], []]);
  {
// ---- church / classical
        TBL[Church][Great] = [S1("Bourdon 16'", R_Gedackt, 0.5, 0.9, 0.04, 0.08, 0.3), S1("Principal 8'", R_Principal, 1, 1, 0.025, 0.09, 0.2), S1("Hohlflöte 8'", R_Hohl, 1, 0.9, 0.035, 0.08, 0.5),
            S1("Gamba 8'", R_Gamba, 1, 0.7, 0.09, 0.10, 0.25), S1("Octave 4'", R_Octave, 2, 0.8, 0.02, 0.07, 0.2), S1("Rohrflöte 4'", R_Rohr, 2, 0.7, 0.035, 0.07, 0.4),
            SM("Mixture IV", R_Octave, [3, 4, 5, 6], 0.55, 0.02, 0.06, 0.1), S1("Trumpet 8'", R_Trumpet, 1, 0.8, 0.012, 0.06, 0)];
        TBL[Church][Swell] = [S1("Stopped Diapason 8'", R_Gedackt, 1, 0.9, 0.04, 0.08, 0.3), S1("Salicional 8'", R_Salicional, 1, 0.7, 0.09, 0.10, 0.2), SC("Voix Céleste 8'", R_Salicional, 1, 0.6, 0.10, 0.10, 0.2),
            S1("Flûte Octaviante 4'", R_OpenFlute, 2, 0.8, 0.04, 0.07, 0.5), S1("Nazard 2 2/3'", R_Nasard, 3, 0.6, 0.04, 0.07, 0.3), S1("Oboe 8'", R_Oboe, 1, 0.75, 0.02, 0.07, 0),
            S1("Trompette 8'", R_Trumpet, 1, 0.8, 0.012, 0.06, 0), S1("Vox Humana 8'", R_Vox, 1, 0.6, 0.03, 0.08, 0)];
        TBL[Church][Pedal] = [S1("Contra Bourdon 32'", R_Gedackt, 0.25, 0.8, 0.07, 0.10, 0.1), S1("Open Wood 16'", R_Principal, 0.5, 1, 0.04, 0.09, 0.2), S1("Subbass 16'", R_Gedackt, 0.5, 0.9, 0.05, 0.09, 0.2),
            S1("Octave 8'", R_Principal, 1, 0.9, 0.03, 0.08, 0.2), S1("Bass Flute 8'", R_Hohl, 1, 0.8, 0.04, 0.08, 0.4), S1("Choral Bass 4'", R_Octave, 2, 0.8, 0.02, 0.07, 0.2),
            S1("Posaune 16'", R_Tuba, 0.5, 0.8, 0.02, 0.07, 0), S1("Trumpet 8'", R_Trumpet, 1, 0.7, 0.012, 0.06, 0)];
        // ---- theatre / cinema
        TBL[Theatre][Great] = [S1("Tibia Clausa 8'", R_Tibia, 1, 1, 0.03, 0.08, 0.5), S1("Tibia 4'", R_Tibia, 2, 0.8, 0.03, 0.07, 0.5), S1("Diaphonic Diapason 8'", R_Diapason, 1, 1, 0.03, 0.09, 0.2),
            S1("Kinura 8'", R_Kinura, 1, 0.6, 0.012, 0.06, 0), S1("Tuba Mirabilis 8'", R_Tuba, 1, 0.9, 0.012, 0.07, 0), S1("Orchestral Oboe 8'", R_Oboe, 1, 0.75, 0.02, 0.07, 0),
            S1("Vox Humana 8'", R_Vox, 1, 0.65, 0.03, 0.08, 0), SP("Xylophone", P_Xylophone, 0.9)];
        TBL[Theatre][Swell] = [S1("Concert Flute 8'", R_OpenFlute, 1, 0.9, 0.04, 0.08, 0.5), S1("Violin 8'", R_Violin, 1, 0.65, 0.08, 0.10, 0.2), SC("Viol Celeste 8'", R_Violin, 1, 0.55, 0.09, 0.10, 0.2),
            S1("Clarinet 8'", R_Clarinet, 1, 0.75, 0.02, 0.07, 0), S1("Dulciana 8'", R_Salicional, 1, 0.6, 0.07, 0.09, 0.2), S1("Quintadena 8'", R_Rohr, 1, 0.7, 0.035, 0.07, 0.4),
            SP("Glockenspiel", P_Glock, 0.8), SP("Chimes", P_Chimes, 0.8)];
        TBL[Theatre][Pedal] = [S1("Tibia 16'", R_Tibia, 0.5, 1, 0.05, 0.09, 0.3), S1("Diaphone 16'", R_Diapason, 0.5, 1, 0.03, 0.09, 0.2), S1("Bourdon 16'", R_Gedackt, 0.5, 0.9, 0.05, 0.09, 0.2),
            S1("Cello 8'", R_Violin, 1, 0.7, 0.07, 0.10, 0.2), S1("Flute 8'", R_OpenFlute, 1, 0.8, 0.04, 0.08, 0.4), S1("Tuba 16'", R_Tuba, 0.5, 0.8, 0.02, 0.07, 0),
            S1("Tibia 8'", R_Tibia, 1, 0.9, 0.04, 0.08, 0.4), SP("Bass Drum", P_BassDrum, 0.9)];
        // ---- chamber
        TBL[Chamber][Great] = [S1("Holzgedackt 8'", R_Gedackt, 1, 1, 0.04, 0.08, 0.4), S1("Rohrflöte 4'", R_Rohr, 2, 0.8, 0.035, 0.07, 0.4), S1("Principal 4'", R_Principal, 2, 0.9, 0.025, 0.07, 0.2),
            S1("Octave 2'", R_Octave, 4, 0.7, 0.02, 0.06, 0.2), S1("Quinte 1 1/3'", R_Nasard, 6, 0.5, 0.03, 0.06, 0.3), SM("Sesquialtera II", R_Nasard, [3, 5], 0.55, 0.03, 0.06, 0.3),
            S1("Sifflöte 1'", R_OpenFlute, 8, 0.45, 0.03, 0.06, 0.4), S1("Dulzian 8'", R_Regal, 1, 0.65, 0.015, 0.06, 0)];
        // ---- positive
        TBL[Positive][Great] = [S1("Gedackt 8'", R_Gedackt, 1, 1, 0.04, 0.08, 0.5), S1("Spitzflöte 4'", R_Spitz, 2, 0.8, 0.035, 0.07, 0.4), S1("Principal 4'", R_Principal, 2, 0.9, 0.025, 0.07, 0.3),
            S1("Nasat 2 2/3'", R_Nasard, 3, 0.6, 0.03, 0.06, 0.3), S1("Octave 2'", R_Octave, 4, 0.7, 0.02, 0.06, 0.2), S1("Terz 1 3/5'", R_Nasard, 5, 0.5, 0.03, 0.06, 0.3),
            S1("Regal 8'", R_Regal, 1, 0.7, 0.012, 0.05, 0), SP("Zimbelstern", P_Zimbel, 0.6)];
        // ---- barrel organ
        TBL[Barrel][Great] = [S1("Flute 8'", R_OpenFlute, 1, 1, 0.03, 0.06, 0.5), S1("Stopped 8'", R_Gedackt, 1, 0.9, 0.035, 0.06, 0.4), S1("Principal 4'", R_Principal, 2, 0.8, 0.02, 0.06, 0.3),
            S1("Piccolo 2'", R_OpenFlute, 4, 0.6, 0.02, 0.05, 0.5), S1("Flute 4'", R_Hohl, 2, 0.7, 0.03, 0.06, 0.5), S1("Regal 8'", R_Regal, 1, 0.6, 0.012, 0.05, 0),
            S1("Trumpet 8'", R_Trumpet, 1, 0.65, 0.012, 0.05, 0), S1("Bourdon 16'", R_Gedackt, 0.5, 0.7, 0.04, 0.07, 0.3)];
        TBL[Barrel][Pedal] = [S1("Bourdon 16'", R_Gedackt, 0.5, 0.9, 0.04, 0.08, 0.3), S1("Stopped Bass 8'", R_Gedackt, 1, 0.9, 0.04, 0.07, 0.3)];
        
    const none = S1('-', R_Principal, 1, 0, 0.02, 0.05, 0);
    for (let t = 0; t < kTypes; ++t) for (let d = 0; d < kDivs; ++d) while (TBL[t][d].length < kStopsPer) TBL[t][d].push(none);
  }
  const STOPCOUNT = [[8, 8, 8], [8, 8, 8], [8, 0, 0], [8, 0, 0], [8, 0, 2]];
  const stopCount = (type, d) => STOPCOUNT[clampf(type, 0, kTypes - 1)][clampf(d, 0, kDivs - 1)];
  const stopDef = (type, d, i) => TBL[clampf(type, 0, kTypes - 1)][clampf(d, 0, kDivs - 1)][clampf(i, 0, kStopsPer - 1)];
  const TYPENAMES = ['Church / Classical', 'Theatre / Cinema', 'Chamber', 'Positive', 'Barrel'];
  const TEMPNAMES = ['Equal', 'Werckmeister III', 'Valotti', 'Quarter-comma meantone'];
  const TEMPS = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, -9.775, -7.82, -5.865, -9.775, -1.955, -11.73, -3.91, -7.82, -11.73, -3.91, -7.82],
    [0, -5.865, -3.91, -1.955, -7.82, 1.955, -7.82, -1.955, -3.91, -5.865, 0, -5.865],
    [0, -23.95, -6.843, 10.265, -13.686, 3.421, -20.53, -3.422, -27.373, -10.265, 6.843, -17.108]];
  /* places: name, note, w, l, h, roof, material, rt, warm, diff, srcX, srcY, lisX, lisY, openCeil */
const PLACES = [["Dry (no room)", "No space at all", 6, 8, 3, 0, 2, 0.5, 1.0, 65, 50, 30, 50, 50, 0],
        ["Notre-Dame de Paris", "Gothic nave, rib vault; approximate", 40, 120, 33, 1, 0, 6.5, 1.0, 85, 50, 10, 50, 55, 0],
        ["Cologne Cathedral", "Tallest Gothic nave; approximate", 45, 140, 43, 1, 0, 9.0, 1.1, 85, 50, 8, 50, 55, 0],
        ["St. Peter's Basilica, Rome", "Huge domed basilica; approximate", 60, 180, 60, 2, 0, 9.5, 1.1, 80, 50, 15, 50, 60, 0],
        ["Hagia Sophia, Istanbul", "Great dome, stone and mosaic; approximate", 70, 80, 55, 2, 0, 10.5, 1.2, 80, 50, 25, 50, 60, 0],
        ["St Paul's Cathedral, London", "Wren's dome over a long nave; approximate", 50, 150, 65, 2, 0, 8.0, 1.0, 80, 50, 12, 50, 55, 0],
        ["Westminster Abbey", "Narrow, lofty, many side chapels; approximate", 35, 150, 31, 1, 0, 5.8, 0.9, 80, 50, 10, 50, 55, 0],
        ["King's College Chapel", "Long, narrow, fan vault; approximate", 12, 88, 24, 1, 0, 6.5, 1.0, 80, 50, 12, 50, 55, 0],
        ["Sainte-Chapelle, Paris", "Small, tall, walls of glass; approximate", 17, 36, 20, 1, 4, 3.2, 0.8, 85, 50, 12, 50, 65, 0],
        ["Sagrada Família, Barcelona", "Forest of columns; approximate", 45, 90, 45, 1, 1, 7.0, 1.0, 85, 50, 10, 50, 55, 0],
        ["Grace Cathedral, San Francisco", "Poured-concrete Gothic on Nob Hill; approximate", 35, 100, 28, 1, 1, 4.8, 1.0, 85, 50, 10, 50, 55, 0],
        ["Mormon Tabernacle, Salt Lake City", "Broad elliptical dome of wood; approximate", 46, 76, 20, 2, 3, 4.5, 0.9, 80, 50, 20, 50, 60, 0],
        ["Thomaskirche, Leipzig", "Bach's church, plastered hall; approximate", 25, 55, 18, 1, 2, 4.0, 0.9, 80, 50, 12, 50, 55, 0],
        ["Stephansdom, Vienna", "Gothic nave, great tower; approximate", 34, 100, 28, 1, 0, 8.5, 1.0, 85, 50, 10, 50, 55, 0],
        ["Duomo di Milano", "A forest of marble; approximate", 90, 150, 45, 1, 0, 10.0, 1.1, 85, 50, 15, 50, 60, 0],
        ["Pantheon, Rome", "Round temple, open oculus; approximate", 43, 43, 43, 2, 0, 7.0, 1.0, 70, 50, 20, 50, 60, 4],
        ["Village stone church", "Small parish church", 9, 22, 9, 1, 0, 2.6, 0.9, 85, 50, 12, 50, 60, 0],
        ["Stone chapel", "Quiet chapel for a chamber organ", 6, 14, 7, 1, 0, 2.0, 0.9, 80, 50, 15, 50, 55, 0],
        ["Home parlour", "A room with a chamber organ in the corner", 5, 6.5, 2.8, 0, 2, 0.6, 0.9, 20, 20, 60, 70, 70, 0],
        ["Cinema palace", "Velvet and plaster auditorium", 30, 40, 14, 0, 7, 1.6, 0.8, 50, 8, 50, 55, 85, 0],
        ["Castle hall", "Timber roof, stone floor", 10, 24, 9, 0, 3, 2.2, 0.9, 50, 10, 50, 60, 85, 0],
        ["Fairground (open air)", "Courtyard, the sky half open", 18, 22, 9, 0, 5, 0.8, 0.8, 50, 20, 50, 60, 85, 45]];
const TUNES = [["Ode to Joy", 104, "E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 E4:1.5 D4:.5 D4:2 E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:.5 C4:2",
         "C3:4 G2:4 C3:4 G2:4 C3:4 G2:4 C3:4 G2:2 C3:2"],
        ["Greensleeves", 96, "A3:1 C4:2 D4:1 E4:1.5 F4:.5 E4:1 D4:2 B3:1 G3:1.5 A3:.5 B3:1 C4:2 A3:1 A3:1.5 G#3:.5 A3:1 B3:2 G#3:1 E3:2 A3:1 C4:2 D4:1 E4:1.5 F4:.5 E4:1 D4:2 B3:1 G3:1.5 A3:.5 B3:1 C4:1.5 B3:.5 A3:1 G#3:1.5 F#3:.5 G#3:1 A3:3",
         "A2:3 A2:3 C3:3 G2:3 G2:3 C3:3 A2:3 E2:3 A2:3 A2:3 C3:3 G2:3 E2:3 A2:3 E2:3 A2:3"],
        ["Silent Night", 66, "G4:1.5 A4:.5 G4:1 E4:3 G4:1.5 A4:.5 G4:1 E4:3 D5:2 D5:1 B4:3 C5:2 C5:1 G4:3 A4:2 A4:1 C5:1.5 B4:.5 A4:1 G4:1.5 A4:.5 G4:1 E4:3 A4:2 A4:1 C5:1.5 B4:.5 A4:1 G4:1.5 A4:.5 G4:1 E4:3 D5:2 D5:1 F5:1.5 D5:.5 B4:1 C5:3 E5:3 C5:1 G4:1 E4:1 G4:1.5 F4:.5 D4:1 C4:3",
         "C3:3 C3:3 C3:3 C3:3 F3:3 C3:3 F3:3 C3:3 G2:3 G2:3 C3:3 C3:3 F3:3 C3:3 F3:3 C3:3 G2:3 D3:3 C3:3 C3:3"],
        ["Amazing Grace", 72, "D4:1 G4:2 B4:.5 G4:.5 B4:2 A4:1 G4:2 E4:1 D4:2 D4:1 G4:2 B4:.5 G4:.5 B4:2 A4:1 D5:3 B4:3 D5:2 B4:.5 G4:.5 B4:2 A4:1 G4:2 E4:1 D4:2 D4:1 G4:2 B4:.5 G4:.5 A4:2 G4:1 G4:3",
         "G2:3 G2:3 G2:3 C3:3 G2:3 G2:3 D3:3 G2:3 G2:3 G2:3 C3:3 G2:3 D3:3 G2:3 G2:3"]];
  /* registrations: name, type, place, stops[3], couplers, temperament, a4, trem, traps, barrelTune */
const REGS = [["Init - Principal 8'", Church, 1, [0x02, 0x00, 0x00], 0, 0, 440, 0, 0, 0],
        ["Toccata - full organ (Notre-Dame)", Church, 1, [0xD3, 0x7F, 0x4B], 0x03, 0, 440, 0, 0, 0],
        ["Quiet communion (Sainte-Chapelle)", Church, 8, [0x04, 0x03, 0x04], 0x01, 0, 440, 0, 0, 0],
        ["Bach plenum (Thomaskirche)", Church, 12, [0x72, 0x00, 0x2A], 0x02, 1, 415, 0, 0, 0],
        ["Celestial strings (Hagia Sophia)", Church, 4, [0x08, 0x07, 0x04], 0x01, 0, 440, 0, 0, 0],
        ["Dome festival (St. Peter's)", Church, 3, [0xF3, 0xDB, 0x4F], 0x07, 0, 440, 0, 0, 0],
        ["Voix humaine (Westminster Abbey)", Church, 6, [0x01, 0xA1, 0x04], 0, 2, 440, 1, 0, 0],
        ["Hymn on the hill (Grace Cathedral)", Church, 10, [0x16, 0x0B, 0x0C], 0x03, 0, 440, 0, 0, 0],
        ["Tabernacle hymn (Salt Lake)", Church, 11, [0x96, 0x4B, 0x0E], 0x03, 0, 440, 0, 0, 0],
        ["Silent-film palace (Tibia & Vox)", Theatre, 19, [0x43, 0x0F, 0x41], 0x03, 0, 440, 2, 1, 0],
        ["Kinura & Tuba (cinema)", Theatre, 19, [0x1D, 0x0A, 0x25], 0x01, 0, 440, 2, 1, 0],
        ["Chamber gedackt (parlour)", Chamber, 18, [0x03, 0, 0], 0, 1, 440, 0, 0, 0],
        ["Medieval positive (castle hall)", Positive, 20, [0xE5, 0, 0], 0, 3, 440, 0, 0, 0],
        ["Barrel organ: Ode to Joy (fairground)", Barrel, 21, [0x1B, 0, 0x03], 0, 0, 440, 0, 0, 0],
        ["Pedal thunder (Pantheon)", Church, 15, [0x01, 0x00, 0x87], 0x02, 0, 440, 0, 0, 0],
        ["Mixture shimmer (Cologne)", Church, 2, [0x52, 0x14, 0x00], 0x01, 0, 440, 0, 0, 0]];
  /* ---- the room (AcousiMagica) */
  const RM = { Scale: 0, Width: 1, Depth: 2, Height: 3, Roof: 4, Curve: 5, Topology: 6, OpenL: 7, OpenR: 8, OpenFront: 9, OpenBack: 10, OpenFloor: 11, OpenCeil: 12, Material: 13, Damping: 14, Warmth: 15, Diffusion: 16, Speed: 17,
    SrcX: 18, SrcY: 19, ListX: 20, ListY: 21, Orbit: 22, OrbitR: 23, Breathe: 24, BreatheRate: 25, Quake: 26, Inertia: 27, Order: 28, EarlyLate: 29, Freeze: 30, Spread: 31, Mix: 32, Count: 33 };
  const ROOM_DEF = [1, 50, 45, 35, 0, 50, 0, 0, 0, 0, 0, 0, 0, 2, 40, 50, 80, 343, 30, 50, 65, 50, 0, 40, 0, 0.3, 0, 150, 1, 50, 0, 100, 35];
  const MATS = [[.03, .08], [.05, .10], [.08, .15], [.12, .22], [.04, .05], [.04, .10], [.02, .04], [.30, .70], [.45, .90], [.75, 1.4]];
  const WORLD = [0.5, 1, 3, 8, 40, 250, 2000];
  function roomInputs(v) {
    const sc = WORLD[clampf(Math.round(v[RM.Scale]), 0, 6)], m = MATS[clampf(Math.round(v[RM.Material]), 0, 9)];
    return { lnLx: Math.log(sc * 1.5 * pw(12, v[RM.Width] / 100)), lnLy: Math.log(sc * 1.5 * pw(12, v[RM.Depth] / 100)), lnLz: Math.log(sc * 1.2 * pw(8, v[RM.Height] / 100)), lnC: Math.log(Math.max(20, v[RM.Speed])),
      sxF: v[RM.SrcX] / 100, syF: v[RM.SrcY] / 100, lxF: v[RM.ListX] / 100, lyF: v[RM.ListY] / 100,
      open: [v[RM.OpenL] / 100, v[RM.OpenR] / 100, v[RM.OpenFront] / 100, v[RM.OpenBack] / 100, v[RM.OpenFloor] / 100, v[RM.OpenCeil] / 100],
      alpha: clampf(m[0] + (v[RM.Damping] - 40) / 100 * 0.6, 0.005, 0.95), hf: m[1], warm: clampf(0.2 + v[RM.Warmth] / 100 * 1.6, 0.2, 2.6) };
  }
  function roomDerive(inp) {
    const g = { Lx: Math.exp(inp.lnLx), Ly: Math.exp(inp.lnLy), Lz: Math.exp(inp.lnLz), c: Math.exp(inp.lnC), alpha: [], beta: [] };
    g.V = g.Lx * g.Ly * g.Lz; g.S = 2 * (g.Lx * g.Ly + g.Lx * g.Lz + g.Ly * g.Lz);
    const area = [g.Ly * g.Lz, g.Ly * g.Lz, g.Lx * g.Lz, g.Lx * g.Lz, g.Lx * g.Ly, g.Lx * g.Ly]; let A = 0, Ahf = 0;
    for (let w = 0; w < 6; ++w) {
      const base = inp.alpha; let a = base + (1 - base) * inp.open[w], ah = base + inp.hf * 0.12 * (1 - inp.open[w]) + (1 - base) * inp.open[w];
      a = clampf(a, 0.002, 0.995); ah = clampf(ah, a, 0.995); g.alpha[w] = a; g.beta[w] = Math.sqrt(1 - a); A += area[w] * -Math.log(1 - a); Ahf += area[w] * -Math.log(1 - ah);
    }
    g.A = A; const k = 55.26 / g.c;
    g.rtMid = k * g.V / (A + 4 * 0.0005 * g.V); g.rtHf = Math.min(g.rtMid, k * g.V / (Ahf + 4 * 0.003 * g.V)); g.rtLow = g.rtMid * inp.warm;
    g.sx = clampf(inp.sxF, 0.02, 0.98) * g.Lx; g.sy = clampf(inp.syF, 0.02, 0.98) * g.Ly; g.sz = 0.35 * g.Lz;
    g.lx = clampf(inp.lxF, 0.02, 0.98) * g.Lx; g.ly = clampf(inp.lyF, 0.02, 0.98) * g.Ly; g.lz = 0.35 * g.Lz;
    return g;
  }
  /* the knob values for a place after the size and decay trims; also finds the damping that gives the decay time (the formula is monotonic in damping) */
  function roomFor(p, sizeTrim, decayTrim, mix) {
    const v = Float64Array.from(ROOM_DEF);
    const Lx = p[2] * sizeTrim, Ly = p[3] * sizeTrim, Lz = p[4] * sizeTrim; let best = 0, bestErr = 1e9, bw = 0, bd = 0, bh = 0;
    for (let world = 0; world < 6; ++world) {
      const sc = WORLD[world], w = 100 * Math.log(Lx / (1.5 * sc)) / Math.log(12), d = 100 * Math.log(Ly / (1.5 * sc)) / Math.log(12), h = 100 * Math.log(Lz / (1.2 * sc)) / Math.log(8);
      const over = x => x < 0 ? -x : (x > 100 ? x - 100 : 0), err = over(w) + over(d) + over(h);
      if (err < bestErr - 1e-9) { bestErr = err; best = world; bw = w; bd = d; bh = h; }
      if (err === 0) break;
    }
    v[RM.Scale] = best; v[RM.Width] = clampf(bw, 0, 100); v[RM.Depth] = clampf(bd, 0, 100); v[RM.Height] = clampf(bh, 0, 100);
    v[RM.Roof] = p[5]; v[RM.Curve] = 60; v[RM.Material] = p[6]; v[RM.Warmth] = p[8] * 50; v[RM.Diffusion] = p[9];
    v[RM.SrcX] = p[10]; v[RM.SrcY] = p[11]; v[RM.ListX] = p[12]; v[RM.ListY] = p[13]; v[RM.OpenCeil] = p[14]; v[RM.Mix] = mix; v[RM.EarlyLate] = 45; v[RM.Inertia] = 400;
    const target = Math.max(0.15, p[7] * decayTrim); let lo = 0, hi = 100;
    for (let it = 0; it < 30; ++it) { const mid = 0.5 * (lo + hi); v[RM.Damping] = mid; const rt = roomDerive(roomInputs(v)).rtMid; if (rt > target) lo = mid; else hi = mid; }
    v[RM.Damping] = 0.5 * (lo + hi);
    return { v, rt: roomDerive(roomInputs(v)).rtMid };
  }
  const hashRoom = x => { x >>>= 0; x ^= x >>> 16; x = Math.imul(x, 0x7feb352d) >>> 0; x ^= x >>> 15; x = Math.imul(x, 0x846ca68b) >>> 0; x ^= x >>> 16; return x >>> 0; };
  const kTick = 32, kLines = 8, kMaxTaps = 140, kMaxDelay = 7.0, kMaxFdn = 3.0;
  const HADL = [1, -1, 1, -1, 1, -1, 1, -1], HADR = [1, 1, -1, -1, 1, 1, -1, -1];
  class Room {
    constructor(sr) {
      this.sr = sr; this.v = Float64Array.from(ROOM_DEF); this.hist = new DelayLine(Math.floor(kMaxDelay * sr) + 8); this.fdn = []; for (let k = 0; k < kLines; ++k) this.fdn.push(new DelayLine(Math.floor(kMaxFdn * sr) + 8));
      // image sources of a box with up to 3 reflections, nearest first
      this.images = [];
      for (let ix = -4; ix <= 4; ++ix) for (let qx = 0; qx < 2; ++qx) for (let iy = -4; iy <= 4; ++iy) for (let qy = 0; qy < 2; ++qy) for (let iz = -4; iz <= 4; ++iz) for (let qz = 0; qz < 2; ++qz) {
        const h = Math.abs(ix - qx) + Math.abs(ix) + Math.abs(iy - qy) + Math.abs(iy) + Math.abs(iz - qz) + Math.abs(iz);
        if (h <= 3) this.images.push({ ix, iy, iz, qx, qy, qz, hits: h, ceil: Math.abs(iz) });
      }
      this.images.sort((a, b) => a.hits - b.hits);
      const T = 2 * kMaxTaps; this.dly = new Float64Array(T); this.dstep = new Float64Array(T); this.gain = new Float64Array(T); this.gstep = new Float64Array(T); this.lpA = new Float64Array(T); this.zt = new Float64Array(T);
      this.fdCur = new Float64Array(kLines).fill(100); this.fdStep = new Float64Array(kLines); this.fg = new Float64Array(kLines); this.fp = new Float64Array(kLines); this.fz = new Float64Array(kLines);
      this.zv = new Float64Array(kLines); this.dv = new Float64Array(kLines);
      this.lateDelay = 100; this.rotC = 0.8; this.rotS = 0.6; this.lateScale = 1; this.nTaps = 0; this.snap = true; this.sm = null; this.cur = null; this.active = true;
    }
    reset() { this.hist.clear(); for (const l of this.fdn) l.clear(); this.zt.fill(0); this.fz.fill(0); this.fdCur.fill(100); this.snap = true; this.nTaps = 0; this.gain.fill(0); this.gstep.fill(0); this.dstep.fill(0); }
    set(i, x) { this.v[i] = x; }
    tick(m) {
      const v = this.v, sr = this.sr, dt = m / sr, tg = roomInputs(v), sm = this.sm;
      const a = this.snap ? 1 : 1 - Math.exp(-dt / Math.max(0.003, v[RM.Inertia] * 0.001));
      if (this.snap || !sm) this.sm = tg; else {
        const f = (c, t) => c + (t - c) * a;
        sm.lnLx = f(sm.lnLx, tg.lnLx); sm.lnLy = f(sm.lnLy, tg.lnLy); sm.lnLz = f(sm.lnLz, tg.lnLz); sm.lnC = f(sm.lnC, tg.lnC);
        sm.sxF = f(sm.sxF, tg.sxF); sm.syF = f(sm.syF, tg.syF); sm.lxF = f(sm.lxF, tg.lxF); sm.lyF = f(sm.lyF, tg.lyF);
        for (let w = 0; w < 6; ++w) sm.open[w] = f(sm.open[w], tg.open[w]);
        sm.alpha = f(sm.alpha, tg.alpha); sm.hf = f(sm.hf, tg.hf); sm.warm = f(sm.warm, tg.warm);
      }
      const S = this.sm, g = roomDerive(S); this.cur = g;
      const cap = (kMaxDelay - 0.05) * sr, sps = sr / g.c, order = 2 + clampf(Math.round(v[RM.Order]), 0, 2), curve = v[RM.Curve] / 100, roof = clampf(Math.round(v[RM.Roof]), 0, 3), ear = 0.09;
      const pwr = []; for (let w = 0; w < 6; ++w) { pwr.push([1]); for (let k = 1; k < 5; ++k) pwr[w].push(pwr[w][k - 1] * g.beta[w]); }
      const hfLoss = S.hf; let nt = 0; const mx = [g.lx - ear, g.lx + ear];
      const roofGain = roof === 2 ? 1 + 1.8 * curve : (roof === 1 ? 1 + 0.3 * curve : (roof === 3 ? 1 - 0.2 * curve : 1)), apex = roof === 0 ? 1 : 1 + 0.6 * curve;
      const dly = this.dly, dstep = this.dstep, gain = this.gain, gstep = this.gstep, lpA = this.lpA;
      for (const im of this.images) {
        if (im.hits > order || nt >= kMaxTaps) continue;
        const X = 2 * im.ix * g.Lx + (im.qx ? -g.sx : g.sx), Y = 2 * im.iy * g.Ly + (im.qy ? -g.sy : g.sy), Lz = g.Lz * (im.ceil ? apex : 1), Z = 2 * im.iz * Lz + (im.qz ? -g.sz : g.sz);
        let gn = pwr[0][Math.abs(im.ix - im.qx)] * pwr[1][Math.abs(im.ix)] * pwr[2][Math.abs(im.iy - im.qy)] * pwr[3][Math.abs(im.iy)] * pwr[4][Math.abs(im.iz - im.qz)] * pwr[5][Math.abs(im.iz)];
        if (im.ceil) gn *= pw(roofGain, im.ceil);
        for (let mic = 0; mic < 2; ++mic) {
          const dx = X - mx[mic], dy = Y - g.ly, dz = Z - g.lz; let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (im.ceil && roof === 1) dist += curve * im.ceil * 0.5 * (0.5 + 0.5 * ((hashRoom(nt * 977 + mic * 131) & 255) / 255));
          if (im.ceil && roof === 3) dist += (mic ? -1 : 1) * curve * im.ceil * 0.4;
          let d = dist * sps, gg = gn / Math.max(dist, 0.25);
          if (d > cap || d < 2) { d = clampf(d, 2, cap); gg = d >= cap ? 0 : gg; }
          const fc = 16000 * Math.exp(-im.hits * hfLoss * (roof === 2 && im.ceil ? 0.4 : 1)) / (1 + dist / 120), la = Math.exp(-6.2831853 * Math.min(fc, sr * 0.45) / sr);
          const ix = mic * kMaxTaps + nt, fresh = this.snap || nt >= this.nTaps;
          if (fresh) { dly[ix] = d; dstep[ix] = 0; gain[ix] = 0; gstep[ix] = 0; }
          dstep[ix] = (d - dly[ix]) / m; gstep[ix] = (gg - gain[ix]) / m; lpA[ix] = la;
          if (fresh) { gain[ix] = gg; gstep[ix] = 0; dstep[ix] = 0; }
        }
        ++nt;
      }
      for (let t = nt; t < this.nTaps; ++t) for (let mic = 0; mic < 2; ++mic) { const ix = mic * kMaxTaps + t; gstep[ix] = (0 - gain[ix]) / m; dstep[ix] = 0; }
      this.nTaps = Math.max(nt, this.nTaps);
      if (this.nTaps > nt) { let quiet = true; for (let t = nt; t < this.nTaps; ++t) if (Math.abs(gain[t]) > 1e-4 || Math.abs(gain[kMaxTaps + t]) > 1e-4) quiet = false; if (quiet) this.nTaps = nt; }
      // the late field
      const mfp = 4 * g.V / g.S;
      const raw = [2 * g.Lx, 2 * g.Ly, 2 * g.Lz, 2 * Math.sqrt(g.Lx * g.Lx + g.Ly * g.Ly), 2 * Math.sqrt(g.Lx * g.Lx + g.Lz * g.Lz), 2 * Math.sqrt(g.Ly * g.Ly + g.Lz * g.Lz), 2 * Math.sqrt(g.Lx * g.Lx + g.Ly * g.Ly + g.Lz * g.Lz), mfp * 1.3];
      for (let k = 0; k < kLines; ++k) {
        const sec = clampf(raw[k] / g.c, 0.003 * (1 + 0.37 * k), kMaxFdn - 0.1), d = sec * sr;
        if (this.snap || this.fdCur[k] > 50000000) this.fdCur[k] = d;
        this.fdStep[k] = (d - this.fdCur[k]) / m;
        const gl = Math.min(0.99995, pw(10, -3 * sec / g.rtLow)), gh = Math.min(gl, pw(10, -3 * sec / g.rtHf));
        const r = gl > 1e-9 ? gh / gl : 0, c4 = Math.cos(6.2831853 * 4000 / sr), r2 = r * r; let p = 0;
        if (r2 < 0.999999) { const q = 1 - r2 * c4, disc = Math.max(0, q * q - (1 - r2) * (1 - r2)); p = (q - Math.sqrt(disc)) / (1 - r2); }
        this.fg[k] = gl; this.fp[k] = clampf(p, 0, 0.97);
      }
      const dDirect = Math.sqrt((g.sx - g.lx) * (g.sx - g.lx) + (g.sy - g.ly) * (g.sy - g.ly) + (g.sz - g.lz) * (g.sz - g.lz)) * sps;
      this.lateDelay = Math.min(cap, dDirect + 0.3 * (raw[7] / g.c) * sr);
      let diffusion = v[RM.Diffusion] / 100; if (roof === 2) diffusion *= 1 - 0.5 * curve;
      this.rotC = Math.cos(diffusion * 0.78539816); this.rotS = Math.sin(diffusion * 0.78539816);
      this.lateScale = Math.min(2.5, Math.sqrt(50.27 / Math.max(1, g.A)));
      this.snap = false;
    }
    process(inL, inR, outL, outR, n) {
      const v = this.v;
      if (v[RM.Mix] <= 0.0001) { for (let i = 0; i < n; ++i) { outL[i] = inL[i]; outR[i] = inR[i]; } this.active = false; return; }
      if (!this.active) { this.reset(); this.active = true; }
      const hist = this.hist, fdn = this.fdn, dly = this.dly, dstep = this.dstep, gain = this.gain, gstep = this.gstep, lpA = this.lpA, zt = this.zt, fdCur = this.fdCur, fdStep = this.fdStep, fz = this.fz, fp = this.fp, fg = this.fg, zv = this.zv, dv = this.dv;
      let done = 0;
      while (done < n) {
        const m = Math.min(kTick, n - done); this.tick(m);
        const mix = v[RM.Mix] / 100, spread = v[RM.Spread] / 100, eg = clampf(v[RM.EarlyLate] / 50, 0, 2), lg = clampf((100 - v[RM.EarlyLate]) / 50, 0, 2), lateGain = lg * this.lateScale, earlyGain = eg * 0.8;
        const nT = this.nTaps, rotC = this.rotC, rotS = this.rotS, lateDelay = Math.max(2, this.lateDelay), hbuf = hist.buf, hmask = hist.mask;
        for (let i = 0; i < m; ++i) {
          const xl = inL[done + i], xr = inR[done + i];
          hist.push(0.5 * (xl + xr));
          const w = hist.w;   // newest sample is at w - 1
          let e0 = 0, e1 = 0;
          for (let mic = 0; mic < 2; ++mic) {
            const base = mic * kMaxTaps; let e = 0;
            for (let t = 0; t < nT; ++t) {
              const ix = base + t; const d = dly[ix] + dstep[ix]; dly[ix] = d; const g = gain[ix] + gstep[ix]; gain[ix] = g;
              if (g === 0 && gstep[ix] === 0) continue;
              const id = Math.floor(d), fr = d - id, x0 = hbuf[(w - id) & hmask], x1 = hbuf[(w - 1 - id) & hmask], x = x0 + (x1 - x0) * fr;   // linear read, d samples ago (= hist.read(d))
              const la = lpA[ix], zz = x * (1 - la) + zt[ix] * la; zt[ix] = zz; e += zz * g;
            }
            if (mic) e1 = e; else e0 = e;
          }
          const in8 = hist.read(lateDelay);
          let yl = 0, yr = 0;
          for (let k = 0; k < kLines; ++k) { fdCur[k] += fdStep[k]; const z = fdn[k].read(Math.max(2, fdCur[k])); zv[k] = z; yl += HADL[k] * z; yr += HADR[k] * z; }
          for (let k = 0; k < kLines; ++k) { fz[k] = zv[k] * (1 - fp[k]) + fz[k] * fp[k]; dv[k] = fz[k] * fg[k]; }
          for (let stride = 1; stride < kLines; stride <<= 1)
            for (let base = 0; base < kLines; base += 2 * stride) for (let j = base; j < base + stride; ++j) { const u = dv[j], ww = dv[j + stride]; dv[j] = rotC * u - rotS * ww; dv[j + stride] = rotS * u + rotC * ww; }
          for (let k = 0; k < kLines; ++k) fdn[k].push(in8 * 0.35355339 + dv[k]);
          yl *= 0.35355339; yr *= 0.35355339;
          let wl = e0 * earlyGain + yl * lateGain, wr = e1 * earlyGain + yr * lateGain;
          const mid = 0.5 * (wl + wr), side = 0.5 * (wl - wr) * spread; wl = mid + side; wr = mid - side;
          outL[done + i] = xl * (1 - mix) + wl * mix; outR[done + i] = xr * (1 - mix) + wr * mix;
        }
        done += m;
      }
    }
  }
  /* ---- the tables: one cycle of each recipe for each half-octave (built when first needed, shared by all instances) */
  const SINE = new Float32Array(kTab); for (let i = 0; i < kTab; ++i) SINE[i] = Math.sin(2 * Math.PI * i / kTab);
  const tabCache = {};
  const bandLow = b => 16 * pw(2, b / 2);
  const bandFor = f => clampf(Math.floor(2 * Math.log2(Math.max(f, 16) / 16)), 0, kBands - 1);
  function getTable(sr, r, b) {
    const arr = tabCache[sr] || (tabCache[sr] = new Array(R_Count * kBands)), key = r * kBands + b; let t = arr[key]; if (t) return t;
    t = arr[key] = new Float32Array(kTab + 2);
    const fc = bandLow(b) * Math.sqrt(Math.sqrt(2)), fTop = bandLow(b + 1), K = clampf(Math.floor(0.46 * sr / fTop), 1, kMaxHarm), reed = recipeFamily(r) === F_Reed;
    for (let k = 1; k <= K; ++k) {
      const a = harmonicAmp(r, k, fc); if (a < 1e-5) continue;
      let h = (r * 7919 + k * 104729 + 17) >>> 0; h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
      const ph0 = reed ? 0 : Math.floor((h % 1000) * 0.5 / 1000 * kTab);
      for (let i = 0; i < kTab; ++i) t[i] += a * SINE[(k * i + ph0) & (kTab - 1)];
    }
    let e = 0; for (let i = 0; i < kTab; ++i) e += t[i] * t[i];
    const norm = e > 0 ? 0.25 / Math.sqrt(e / kTab) : 0; for (let i = 0; i < kTab; ++i) t[i] *= norm;
    t[kTab] = t[0]; t[kTab + 1] = t[1];
    return t;
  }
  /* ---- parameters */
  const E = { Preset: 0, Type: 1, Place: 2, RoomMix: 3, Size: 4, DecayTrim: 5, KeyMode: 6, Split: 7, StopBase: 8 };
  E.CplSwGt = E.StopBase + kDivs * kStopsPer; E.CplGtPed = E.CplSwGt + 1; E.CplSwPed = E.CplSwGt + 2; E.CplSuper = E.CplSwGt + 3; E.CplSub = E.CplSwGt + 4;
  ['SwellBox', 'TremDepth', 'TremRate', 'WindSag', 'WindFlutter', 'WindNoise', 'Chiff', 'Bright', 'Detune', 'Temper', 'A4', 'Release', 'Volume', 'LevelG', 'LevelS', 'LevelP', 'Traps', 'TrapLevel', 'BarrelTune', 'BarrelPlay', 'Crank', 'Wobble', 'TrapKeys', 'Count']
    .forEach((n, i) => E[n] = E.CplSub + 1 + i);
  const stopId = (d, i) => E.StopBase + d * kStopsPer + i;
  const specs = [
    P('Preset', '', 0, kRegs - 1, 0, '%.0f', false, REGS.map(r => r[0])),
    P('Organ type', '', 0, kTypes - 1, 0, '%.0f', false, TYPENAMES),
    P('Place', '', 0, kPlaces - 1, 1, '%.0f', false, PLACES.map(p => p[0])),
    P('Room mix', '%', 0, 100, 35, '%.0f %'), P('Room size', '%', 40, 250, 100, '%.0f %', true), P('Decay', '%', 25, 200, 100, '%.0f %', true),
    P('Keyboards', '', 0, 2, 0, '%.0f', false, ['Pedal split', 'By MIDI channel', 'Manual only']), P('Pedal split', '', 36, 72, 48, '%.0f'),
  ];
  { const dn = ['Great', 'Swell', 'Pedal']; for (let d = 0; d < 3; ++d) for (let i = 0; i < 8; ++i) specs.push(P(dn[d] + ' stop ' + (i + 1), '', 0, 1, (d === 0 && i === 1) ? 1 : 0, '%.0f', false, ['In', 'Out'])); }
  ['Swell to Great', 'Great to Pedal', 'Swell to Pedal', 'Super octave', 'Sub octave'].forEach(n => specs.push(P(n, '', 0, 1, 0, '%.0f', false, ['Off', 'On'])));
  specs.push(P('Swell shutters', '%', 0, 100, 100, '%.0f %'), P('Tremulant', '%', 0, 100, 0, '%.0f %'), P('Tremulant rate', 'Hz', 2, 9, 4.8, '%.1f Hz', true),
    P('Wind sag', '%', 0, 100, 35, '%.0f %'), P('Wind flutter', '%', 0, 100, 25, '%.0f %'), P('Wind noise', '%', 0, 100, 20, '%.0f %'),
    P('Chiff', '%', 0, 100, 45, '%.0f %'), P('Brightness', '%', 0, 100, 50, '%.0f %'), P('Pipe detune', 'cents', 0, 12, 2.5, '%.1f ct'),
    P('Tuning', '', 0, 3, 0, '%.0f', false, TEMPNAMES), P('Pitch A4', 'Hz', 392, 466, 440, '%.1f Hz'), P('Release', 'x', 0.3, 3, 1, '%.2f x', true),
    P('Volume', 'dB', -30, 6, -6, '%.1f dB'), P('Great level', 'dB', -24, 6, 0, '%.1f dB'), P('Swell level', 'dB', -24, 6, 0, '%.1f dB'), P('Pedal level', 'dB', -24, 6, 0, '%.1f dB'),
    P('Traps', '', 0, 1, 0, '%.0f', false, ['Off', 'On']), P('Traps level', 'dB', -24, 6, -3, '%.1f dB'),
    P('Barrel tune', '', 0, 3, 0, '%.0f', false, TUNES.map(t => t[0])), P('Barrel', '', 0, 1, 0, '%.0f', false, ['Stopped', 'Cranking']),
    P('Crank speed', '%', 40, 160, 100, '%.0f %'), P('Crank wobble', '%', 0, 100, 25, '%.0f %'),
    P('Trap keys', '', 0, 1, 0, '%.0f', false, ['Off', 'Keys below C2']));
  const sg = d => { const a = []; for (let i = 0; i < 8; ++i) a.push(stopId(d, i)); return a; };
  const groups = [
    ['Organ', [E.Type, E.Place, E.RoomMix, E.Size, E.DecayTrim]],
    ['Great stops', sg(Great)], ['Swell stops', sg(Swell)], ['Pedal stops', sg(Pedal)],
    ['Couplers and box', [E.CplSwGt, E.CplGtPed, E.CplSwPed, E.CplSuper, E.CplSub, E.SwellBox]],
    ['Keyboards', [E.KeyMode, E.Split, E.LevelG, E.LevelS, E.LevelP]],
    ['Wind and voicing', [E.TremDepth, E.TremRate, E.WindSag, E.WindFlutter, E.WindNoise, E.Chiff, E.Bright, E.Detune, E.Release]],
    ['Tuning', [E.Temper, E.A4]],
    ['Theatre traps', [E.Traps, E.TrapKeys, E.TrapLevel]],
    ['Barrel organ', [E.BarrelTune, E.BarrelPlay, E.Crank, E.Wobble]],
    ['Output', [E.Volume]],
  ];
  const TYPE_DEFAULTS = [[1, 0, 4.8, 35, 25, 20, 45, 50, 1.0, 0, 0], [19, 55, 6.6, 50, 20, 15, 50, 55, 0.8, 0, 1], [18, 0, 4.5, 20, 20, 25, 60, 50, 0.7, 2, 0], [20, 0, 4.5, 25, 30, 30, 70, 50, 0.6, 2, 0], [21, 0, 5, 30, 45, 35, 70, 55, 0.5, 2, 0]];
  const hash3 = (a, b, c) => { let h = (Math.imul(a >>> 0, 0x9E3779B1) ^ Math.imul((b + 0x7F4A7C15) >>> 0, 0x85EBCA6B) ^ Math.imul((c + 0x165667B1) >>> 0, 0xC2B2AE35)) >>> 0; h = (h ^ (h >>> 15)) >>> 0; h = Math.imul(h, 0x2C1B3C6D) >>> 0; h = (h ^ (h >>> 12)) >>> 0; return h; };
  const newStop = () => ({ on: false, idx: 0, env: 0, attInc: 0.01, relMul: 0.99, off: 0, ph: new Float64Array(5), pe: new Float64Array(5), hit: 0, def: null, cInc: new Float64Array(5), cAmp: new Float64Array(5), cTab: [null, null, null, null, null], pd: new Float64Array(5) });
  const newVoice = () => { const st = []; for (let i = 0; i < kStopsPer; ++i) st.push(newStop()); return { active: false, gate: false, div: 0, note: 60, key: 60, chan: 0, age: 0, f0: 261, panL: 0.7, panR: 0.7, chiffEnv: 0, chiffAmt: 0, chiffTau: 0.99, s1: 0, s2: 0, vol: 1, rng: 1, st }; };
  const newTrap = () => ({ on: false, kind: 0, t: 0, a: 1, f: 100, ph: 0, lp: 0, hp: 0 });
  const newBell = () => ({ on: false, f: 2000, t: 0, ph: [0, 0, 0] });
  const XY = [[1, 1], [3, 0.45], [6, 0.15]], GL = [[1, 1], [2.76, 0.5], [5.4, 0.3], [8.93, 0.15]], CH = [[0.5, 0.5], [1, 1], [2, 0.4], [2.76, 0.3], [4.1, 0.15]];
  const TRAPKEY = [36, 37, 38, 75, 41, 45, 42, 48, 54, 49, 70, 51];   // pitch class -> General-MIDI drum note, for the 'Trap keys' switch
  const BN = { A: 9, B: 11, C: 0, D: 2, E: 4, F: 5, G: 7 };
  /* "C#4:1.5" at position pos of s -> {note, beats, pos} (note -1 at the end) */
  function parseNote(s, pos) {
    while (s[pos] === ' ') ++pos;
    if (pos >= s.length) return { note: -1, beats: 1, pos };
    let n = BN[s[pos]]; if (n === undefined) n = 0; ++pos;
    if (s[pos] === '#') { ++n; ++pos; } else if (s[pos] === 'b') { --n; ++pos; }
    let oct = 4; if (s[pos] >= '0' && s[pos] <= '9') { oct = +s[pos]; ++pos; }
    let beats = 1; if (s[pos] === ':') { ++pos; let q = pos; while ((s[q] >= '0' && s[q] <= '9') || s[q] === '.') ++q; beats = parseFloat(s.slice(pos, q)); if (!(beats > 0)) beats = 0; pos = q; }
    return { note: 12 * (oct + 1) + n, beats, pos };
  }
  const softLimit = x => { if (!(x === x) || x === Infinity || x === -Infinity) return 0; const a = Math.abs(x); if (a <= 0.9) return x; const y = 0.9 + 0.1 * Math.tanh((a - 0.9) / 0.1); return x < 0 ? -y : y; };

  class Pipica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); this.dt = 1 / sr;
      this.room = new Room(sr); this.voice = []; for (let i = 0; i < kVoices; ++i) this.voice.push(newVoice());
      this.trap = []; for (let i = 0; i < 8; ++i) this.trap.push(newTrap()); this.bell = []; for (let i = 0; i < 6; ++i) this.bell.push(newBell());
      const mk = () => new Float64Array(kTick); this.gL = mk(); this.gR = mk(); this.sL = mk(); this.sR = mk(); this.pL = mk(); this.pR = mk(); this.rL = mk(); this.rR = mk(); this.oL = mk(); this.oR = mk(); this.tmp = mk();
      this.noise = new Noise(0x9E3779B9); this.tremPh = 0; this.flutN = 0; this.flutA = 0; this.sag = 0; this.activity = 0; this.counter = 0; this.barrelOn = false; this.bStep = 0;
      this.lpSwL = 0; this.lpSwR = 0; this.toneL = 0; this.toneR = 0; this.windN = 0; this.zimT = 0.3; this.wobPh = 0; this.swellOpen = 1; this.barrelPitch = 0;
      this.expr = 1; this.mod = 0; this.bend = 0; this.inReg = false; this.depth = 0; this.pend = new Float64Array(E.Count); this.pendHas = new Uint8Array(E.Count);
      this.bMelPos = 0; this.bBasPos = 0; this.bMelT = 0; this.bBasT = 0; this.bMelLen = 0; this.bBasLen = 0; this.bMelNote = -1; this.bBasNote = -1;
      this.applyRoom();
    }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.mod = m; } pressure(p) { } expression(e) { this.expr = e; }
    allNotesOff() { for (const v of this.voice) v.gate = false; this.stopBarrel(); }
    // ---- parameters and presets
    set(id, x) {
      if (id < 0 || id >= E.Count) return;
      const V = this.v, prev = V[id]; V[id] = x;
      if (id === E.Preset) this.loadReg(Math.max(0, Math.min(kRegs - 1, Math.round(x))));
      else if (id === E.Type && Math.round(prev) !== Math.round(x) && !this.inReg) this.loadTypeDefaults(Math.round(x));
      if (id === E.Place || id === E.RoomMix || id === E.Size || id === E.DecayTrim) this.applyRoom();
      if (id === E.BarrelPlay || id === E.BarrelTune) { if (id === E.BarrelTune || V[E.BarrelPlay] < 0.5) this.stopBarrel(); if (id === E.BarrelPlay && V[E.BarrelPlay] > 0.5) this.startBarrel(); }
    }
    put(id, x) { this.v[id] = x; this.pend[id] = x; this.pendHas[id] = 1; }
    beginPuts() { ++this.depth; }
    endPuts() { if (--this.depth > 0) return; for (let i = 0; i < E.Count; ++i) if (this.pendHas[i]) { this.writeParam(i, this.pend[i]); this.pendHas[i] = 0; } }
    loadTypeDefaults(type) {
      this.beginPuts();
      const d = TYPE_DEFAULTS[clampf(type, 0, kTypes - 1)];
      this.put(E.Place, d[0]); this.put(E.TremDepth, d[1]); this.put(E.TremRate, d[2]); this.put(E.WindSag, d[3]); this.put(E.WindFlutter, d[4]); this.put(E.WindNoise, d[5]); this.put(E.Chiff, d[6]);
      this.put(E.Bright, d[7]); this.put(E.Release, d[8]); this.put(E.KeyMode, d[9]); this.put(E.Traps, d[10]);
      for (let dd = 0; dd < kDivs; ++dd) for (let i = 0; i < kStopsPer; ++i) this.put(stopId(dd, i), 0);
      this.put(stopId(0, type === Church ? 1 : 0), 1); for (let c = E.CplSwGt; c <= E.CplSub; ++c) this.put(c, 0);
      this.put(E.Temper, 0); this.put(E.A4, 440); this.put(E.BarrelPlay, 0); this.stopBarrel(); this.applyRoom();
      this.endPuts();
    }
    loadReg(n) {
      const r = REGS[n]; this.inReg = true; this.beginPuts();
      this.put(E.Type, r[1]); this.loadTypeDefaults(r[1]);
      this.put(E.Place, r[2]);
      for (let d = 0; d < kDivs; ++d) for (let i = 0; i < kStopsPer; ++i) this.put(stopId(d, i), (r[3][d] >> i) & 1);
      for (let c = 0; c < 5; ++c) this.put(E.CplSwGt + c, (r[4] >> c) & 1);
      this.put(E.Temper, r[5]); this.put(E.A4, r[6]); this.put(E.Traps, r[8]);
      this.put(E.TremDepth, r[7] === 0 ? 0 : (r[7] === 1 ? 40 : 60)); this.put(E.TremRate, r[7] === 2 ? 6.6 : 4.8);
      this.put(E.BarrelTune, r[9]); if (r[1] === Barrel) { this.put(E.BarrelPlay, 1); this.startBarrel(); }
      this.inReg = false; this.applyRoom(); this.endPuts();
    }
    applyRoom() {
      const V = this.v, pl = Math.round(V[E.Place]), p = PLACES[clampf(pl, 0, kPlaces - 1)];
      const k = roomFor(p, V[E.Size] / 100, V[E.DecayTrim] / 100, pl === 0 ? 0 : V[E.RoomMix]);
      for (let i = 0; i < RM.Count; ++i) this.room.set(i, k.v[i]);
      this.roomRt = k.rt;
    }
    // ---- playing
    noteOn(note, vel) { this.noteOnCh(0, note, vel); }
    noteOff(note) { this.noteOffCh(0, note); }
    noteOnCh(ch, note, vel) {
      const V = this.v, type = Math.round(V[E.Type]);
      if (type === Theatre && V[E.Traps] > 0.5) {
        if (ch === 9) { this.trapHit(note); return; }
        if (V[E.TrapKeys] > 0.5 && note < 36) { this.trapHit(TRAPKEY[((note % 12) + 12) % 12]); return; }
      }
      if (ch === 9 && type === Theatre) return;
      this.route(ch, note);
    }
    noteOffCh(ch, note) { for (const v of this.voice) if (v.active && v.gate && v.chan === ch && v.key === note) v.gate = false; }
    route(ch, note) {
      const V = this.v, km = Math.round(V[E.KeyMode]); let div = Great;
      if (km === 0) div = note <= Math.round(V[E.Split]) && stopCount(Math.round(V[E.Type]), Pedal) > 0 ? Pedal : Great;
      else if (km === 1) div = ch === 1 ? Swell : (ch === 2 ? Pedal : Great);
      this.playOn(div, note, ch, note);
    }
    playOn(div, note, chan, key) {
      const V = this.v;
      this.spawn(div, note, chan, key);
      if (div === Great) {
        if (V[E.CplSwGt] > 0.5) this.spawn(Swell, note, chan, key);
        if (V[E.CplSuper] > 0.5) this.spawn(Great, note + 12, chan, key);
        if (V[E.CplSub] > 0.5) this.spawn(Great, note - 12, chan, key);
      } else if (div === Pedal) {
        if (V[E.CplGtPed] > 0.5) this.spawn(Great, note, chan, key);
        if (V[E.CplSwPed] > 0.5) this.spawn(Swell, note, chan, key);
      }
    }
    spawn(div, note, chan, key) {
      if (note < 0 || note > 127) return;
      const V = this.v, sr = this.sr, type = Math.round(V[E.Type]), cnt = stopCount(type, div), voice = this.voice;
      let any = false; for (let i = 0; i < cnt; ++i) if (V[stopId(div, i)] > 0.5) any = true;
      if (!any) return;
      let pick = -1; for (let i = 0; i < kVoices; ++i) if (!voice[i].active) { pick = i; break; }
      if (pick < 0) { let old = Infinity; for (let i = 0; i < kVoices; ++i) if (!voice[i].gate && voice[i].age < old) { old = voice[i].age; pick = i; } }
      if (pick < 0) { let old = Infinity; for (let i = 0; i < kVoices; ++i) if (voice[i].age < old) { old = voice[i].age; pick = i; } }
      const v = voice[pick] = newVoice();
      v.active = true; v.gate = true; v.div = div; v.note = note; v.key = key; v.chan = chan; v.age = ++this.counter; v.rng = (hash3(note, div, this.counter) | 1) | 0;
      const dev = TEMPS[clampf(Math.round(V[E.Temper]), 0, 3)];
      v.f0 = V[E.A4] * pw(2, (note - 69) / 12 + dev[((note % 12) + 12) % 12] / 1200) * pw(2, this.noteTune * 0.01 / 12);
      const spread = clampf((note - 60) / 48, -1, 1) * 0.22, basePan = div === Swell ? 0.2 : (div === Pedal ? -0.25 : 0), pan = clampf(basePan + spread, -1, 1);
      v.panL = Math.sqrt(0.5 * (1 - pan)); v.panR = Math.sqrt(0.5 * (1 + pan));
      let chiff = 0, lvl = 0; const rel = V[E.Release], bright = V[E.Bright] / 100;
      for (let i = 0; i < cnt; ++i) {
        if (V[stopId(div, i)] < 0.5) continue;
        const d = stopDef(type, div, i), s = v.st[i]; s.on = true; s.idx = i;
        const fund = v.f0 * d.comp[0].ratio;
        if (d.perc === P_Zimbel) { s.on = false; continue; }
        const att = Math.max(0.004, d.attack * (1.3 - 0.6 * bright) * (fund > 800 ? 0.7 : 1));
        s.attInc = 1 / (att * sr); s.relMul = Math.exp(-6.9 / (Math.max(0.01, d.release * rel) * sr));
        s.env = d.perc ? 1 : 0; s.hit = 0;
        for (let c = 0; c < 5; ++c) s.ph[c] = (hash3(note, i * 8 + c, div) & 0xFFFF) / 65536;
        s.off = ((hash3(note, i, div + 31) % 2001) - 1000) / 1000 * V[E.Detune];
        chiff += d.chiff * d.level; lvl += d.level;
      }
      v.chiffAmt = lvl > 0 ? chiff / lvl * V[E.Chiff] / 100 : 0; v.chiffEnv = 1;
      v.chiffTau = Math.exp(-1 / ((0.02 + 0.03 * (1 - Math.min(1, v.f0 / 2000))) * sr));
      v.vol = 1;
    }
    trapHit(note) {
      let kind = 1;   // 0 kick 1 snare 2 tom 3 cymbal 4 tambourine 5 wood block
      if (note === 35 || note === 36) kind = 0; else if (note === 38 || note === 40 || note === 37) kind = 1;
      else if (note >= 41 && note <= 50 && note !== 42 && note !== 44 && note !== 46 && note !== 49) kind = 2;
      else if (note === 49 || note === 51 || note === 52 || note === 55 || note === 57 || note === 59 || note === 42 || note === 44 || note === 46) kind = 3;
      else if (note === 54 || note === 70) kind = 4; else if (note === 76 || note === 77 || note === 75) kind = 5;
      let pick = 0, old = -1; for (let i = 0; i < 8; ++i) { if (!this.trap[i].on) { pick = i; old = 1e9; break; } if (this.trap[i].t > old) { old = this.trap[i].t; pick = i; } }
      const t = this.trap[pick] = newTrap(); t.on = true; t.kind = kind; t.f = kind === 2 ? 90 + (note - 41) * 14 : 100;
    }
    // ---- barrel
    startBarrel() { this.stopBarrel(); this.barrelOn = true; this.bMelPos = 0; this.bBasPos = 0; this.bMelT = this.bBasT = 0; this.bMelLen = this.bBasLen = 0; this.bMelNote = this.bBasNote = -1; }
    stopBarrel() { this.barrelOn = false; for (const v of this.voice) if (v.active && (v.chan === 14 || v.chan === 15)) v.gate = false; }
    barrelStep(which, str, chan, div, beats) {
      let t = (which ? this.bBasT : this.bMelT) + beats, len = which ? this.bBasLen : this.bMelLen, note = which ? this.bBasNote : this.bMelNote, pos = which ? this.bBasPos : this.bMelPos;
      if (note >= 0 && t >= len * 0.9) { for (const v of this.voice) if (v.active && v.gate && v.chan === chan && v.key === note) v.gate = false; note = -1; }
      if (t >= len) {
        t -= len; let r = parseNote(str, pos);
        if (r.note < 0) { pos = 0; r = parseNote(str, pos); }
        pos = r.pos; note = r.note; len = r.beats; if (r.note >= 0) this.playOn(div, r.note, chan, r.note);
        if (len <= 0) len = 0.01;
      }
      if (which) { this.bBasT = t; this.bBasLen = len; this.bBasNote = note; this.bBasPos = pos; } else { this.bMelT = t; this.bMelLen = len; this.bMelNote = note; this.bMelPos = pos; }
    }
    barrelAdvance(beats) {
      if (!this.barrelOn) return;
      const tn = TUNES[clampf(Math.round(this.v[E.BarrelTune]), 0, 3)], type = Math.round(this.v[E.Type]);
      this.barrelStep(0, tn[2], 14, Great, beats);
      this.barrelStep(1, tn[3], 15, stopCount(type, Pedal) > 0 ? Pedal : Great, beats);
    }
    // ---- audio
    process(outL, outR, n) { let done = 0; while (done < n) { const m = Math.min(n - done, kTick); this.block(outL, outR, done, m); done += m; } }
    percussion(v, st, d) {
      const sr = this.sr, np = d.perc === P_Xylophone ? 3 : (d.perc === P_Glock ? 4 : (d.perc === P_Chimes ? 5 : 1)), base = d.perc === P_Xylophone ? 2 : (d.perc === P_Glock ? 4 : (d.perc === P_Chimes ? 2 : 1));
      let y = 0;
      if (d.perc === P_BassDrum) {
        if (st.pe[0] === 0) { st.pe[0] = 1; st.pe[1] = 1; }
        const f = (45 + (v.note - 36) * 1.2) * (1 + 1.6 * st.pe[1]);
        st.ph[0] += f / sr; if (st.ph[0] > 1) st.ph[0] -= 1;
        y = Math.sin(2 * Math.PI * st.ph[0]) * st.pe[0] * 1.2; st.pe[0] *= this.percDecay(st, 0, d.perc, 100, 0); st.pe[1] *= 0.9993;
        st.env = st.pe[0] < 1e-4 ? 0 : 1;
        return y * d.level;
      }
      const tb = d.perc === P_Xylophone ? XY : (d.perc === P_Glock ? GL : CH);
      for (let p = 0; p < np; ++p) {
        if (st.pe[p] === 0) st.pe[p] = tb[p][1];
        const f = v.f0 * base * tb[p][0];
        if (f < 0.45 * sr) { st.ph[p] += f / sr; if (st.ph[p] >= 1) st.ph[p] -= 1; y += Math.sin(2 * Math.PI * st.ph[p]) * st.pe[p]; }
        st.pe[p] *= this.percDecay(st, p, d.perc, v.f0 * base, p);
      }
      if (!v.gate && d.perc !== P_Chimes) st.pe[0] *= 0.9996;
      let m = 0; for (let q = 0; q < np; ++q) m = Math.max(m, st.pe[q]);
      st.env = m < 1e-4 ? 0 : 1;
      return y * d.level * 0.5;
    }
    percDecay(st, slot, kind, freq, partial) {   // (cached per stop and partial: it only depends on the pitch)
      if (st.pd[slot] !== 0) return st.pd[slot];
      let tau = 0.3;
      switch (kind) {
        case P_Xylophone: tau = [0.35, 0.12, 0.05][Math.min(partial, 2)]; break;
        case P_Glock: tau = [1.2, 0.5, 0.25, 0.12][Math.min(partial, 3)]; break;
        case P_Chimes: tau = [6.0, 5.0, 3.6, 2.4, 1.4][Math.min(partial, 4)]; break;
        case P_BassDrum: tau = 0.28; break;
      }
      tau *= clampf(600 / Math.max(freq, 100), 0.3, 2.5);
      return st.pd[slot] = Math.exp(-6.9 / (tau * this.sr));
    }
    block(outL, outR, off, n) {
      const V = this.v, sr = this.sr, type = Math.round(V[E.Type]), gL = this.gL, gR = this.gR, sL = this.sL, sR = this.sR, pL = this.pL, pR = this.pR, tmp = this.tmp;
      gL.fill(0, 0, n); gR.fill(0, 0, n); sL.fill(0, 0, n); sR.fill(0, 0, n); pL.fill(0, 0, n); pR.fill(0, 0, n);
      // wind, tremulant, flutter: one value per block
      this.tremPh += V[E.TremRate] * (1 + 0.02 * this.flutA) * n / sr; if (this.tremPh >= 1) this.tremPh -= Math.floor(this.tremPh);
      const tl = Math.sin(2 * Math.PI * this.tremPh), td = clampf(V[E.TremDepth] / 100 + this.mod * 0.5, 0, 1);
      this.flutN = this.flutN * 0.995 + this.noise.white() * 0.0016; this.flutA = this.flutN;
      const flutC = (this.flutN * 220 + 0.6 * Math.sin(0.00031 * this.counter * 32) + 0.35 * Math.sin(0.00071 * this.counter * 32 + 1)) * (V[E.WindFlutter] / 100) * 2.5;
      this.sag += ((1 - Math.exp(-this.activity / 28)) * V[E.WindSag] / 100 - this.sag) * 0.04;
      const sagC = -this.sag * 7, sagG = 1 - 0.18 * this.sag;
      if (this.barrelOn) {
        this.wobPh += 0.7 * n / sr; if (this.wobPh > 1) this.wobPh -= 1;
        const wob = V[E.Wobble] / 100, crank = V[E.Crank] / 100 * (1 + wob * 0.12 * (Math.sin(2 * Math.PI * this.wobPh) + 0.5 * this.noise.white()));
        this.barrelAdvance(TUNES[clampf(Math.round(V[E.BarrelTune]), 0, 3)][1] / 60 * crank * n / sr);
        this.barrelPitch = wob * 8 * Math.sin(2 * Math.PI * this.wobPh);
      } else this.barrelPitch = 0;
      const swellOpen = clampf(V[E.SwellBox] / 100 * this.expr, 0, 1); this.swellOpen += (swellOpen - this.swellOpen) * 0.2;
      let act = 0; const tremAll = type !== Church, kTab_ = kTab;
      for (let vi = 0; vi < kVoices; ++vi) {
        const v = this.voice[vi]; if (!v.active) continue;
        const oL = v.div === Great ? gL : (v.div === Swell ? sL : pL), oR = v.div === Great ? gR : (v.div === Swell ? sR : pR);
        const trm = td > 0.001 && (tremAll || v.div === Swell);
        const cents = sagC + flutC + this.barrelPitch + this.bend * 200 + (trm ? td * 5 * tl : 0);
        const ampT = sagG * (trm ? 1 - td * 0.22 * (0.5 + 0.5 * tl) : 1), fscale = pw(2, cents / 1200);
        let anyOn = false;
        for (let s = 0; s < kStopsPer; ++s) {
          const st = v.st[s]; st.def = null; if (!st.on) continue;
          const d = stopDef(type, v.div, s); st.def = d; anyOn = true;
          if (d.perc) continue;
          for (let c = 0; c < d.ncomp; ++c) {
            const cc = d.comp[c], f = v.f0 * cc.ratio * fscale * pw(2, (cc.cents + st.off) / 1200);
            st.cInc[c] = f / sr * kTab_; st.cTab[c] = f < 0.46 * sr ? getTable(sr, d.recipe, bandFor(f)) : null; st.cAmp[c] = cc.amp;
          }
        }
        if (!anyOn) { v.active = false; continue; }
        tmp.fill(0, 0, n); let vact = 0;
        for (let s = 0; s < kStopsPer; ++s) {
          const st = v.st[s], d = st.def; if (!d) continue;
          if (d.perc) { for (let i = 0; i < n; ++i) tmp[i] += this.percussion(v, st, d); continue; }
          const nc = d.ncomp, lvl = d.level, gate = v.gate, attInc = st.attInc, relMul = st.relMul; let env = st.env;
          for (let i = 0; i < n; ++i) {
            if (gate) { env = env + attInc; if (env > 1) env = 1; } else { env *= relMul; if (env < 1e-5) { env = 0; if (st.on) st.hit = 1; } }
            if (env <= 0) continue;
            let y = 0;
            for (let c = 0; c < nc; ++c) {
              const tab = st.cTab[c]; if (!tab) continue;
              let ph = st.ph[c] + st.cInc[c]; if (ph >= kTab_) ph -= kTab_; st.ph[c] = ph;
              const i0 = ph | 0, fr = ph - i0; y += st.cAmp[c] * (tab[i0] + (tab[i0 + 1] - tab[i0]) * fr);
            }
            tmp[i] += y * env * lvl; vact += env * lvl;
          }
          st.env = env;
        }
        if (v.chiffEnv > 1e-4 && v.chiffAmt > 0.001) {
          const g = Math.tan(Math.PI * Math.min(v.f0 * 3.2, 9000) / sr), k = 0.45, den = 1 / (1 + g * (k + g)); let r = v.rng, s1 = v.s1, s2 = v.s2, ce = v.chiffEnv; const ca = v.chiffAmt * 0.5, ct = v.chiffTau;
          for (let i = 0; i < n; ++i) {
            if (ce <= 1e-4) break;
            r ^= r << 13; r ^= r >>> 17; r ^= r << 5; const w = r * (1 / 2147483648);
            const hp = (w - (k + g) * s1 - s2) * den, bp = g * hp + s1; s1 = g * hp + bp; const lp = g * bp + s2; s2 = g * bp + lp;
            tmp[i] += bp * ce * ca; ce *= ct;
          }
          v.rng = r; v.s1 = s1; v.s2 = s2; v.chiffEnv = ce;
        }
        for (let i = 0; i < n; ++i) { const acc = tmp[i] * ampT; oL[i] += acc * v.panL; oR[i] += acc * v.panR; }
        let alive = false; for (let s = 0; s < kStopsPer; ++s) if (v.st[s].def && v.st[s].env > 1e-5) alive = true;
        if (!alive && !v.gate) v.active = false;
        act += vact;
      }
      this.activity += (act - this.activity) * 0.2;
      this.trapsAndBells(n);
      const lvG = pw(10, V[E.LevelG] / 20), lvS = pw(10, V[E.LevelS] / 20) * (0.2 + 0.8 * pw(this.swellOpen, 0.7)), lvP = pw(10, V[E.LevelP] / 20);
      const swFc = 900 * pw(13, this.swellOpen), swA = 1 - Math.exp(-2 * Math.PI * swFc / sr);
      const toneFc = 2500 * pw(8, V[E.Bright] / 100), toneA = 1 - Math.exp(-2 * Math.PI * Math.min(toneFc, 18000) / sr);
      const vol = pw(10, V[E.Volume] / 20), windG = V[E.WindNoise] / 100 * 0.012 * Math.min(1, this.activity / 4);
      const rL = this.rL, rR = this.rR;
      for (let i = 0; i < n; ++i) {
        this.lpSwL += (sL[i] - this.lpSwL) * swA; this.lpSwR += (sR[i] - this.lpSwR) * swA;
        let L = gL[i] * lvG + this.lpSwL * lvS + pL[i] * lvP, R = gR[i] * lvG + this.lpSwR * lvS + pR[i] * lvP;
        this.windN += (this.noise.white() - this.windN) * 0.25; L += this.windN * windG; R += this.windN * windG * 0.9;
        this.toneL += (L - this.toneL) * toneA; this.toneR += (R - this.toneR) * toneA;
        rL[i] = fastTanh(this.toneL * vol); rR[i] = fastTanh(this.toneR * vol);
      }
      this.room.process(rL, rR, this.oL, this.oR, n);
      for (let i = 0; i < n; ++i) { outL[off + i] = softLimit(this.oL[i]); outR[off + i] = softLimit(this.oR[i]); }
      this.counter += 1;
    }
    trapsAndBells(n) {
      const V = this.v, sr = this.sr, gL = this.gL, gR = this.gR, lv = pw(10, V[E.TrapLevel] / 20);
      for (const t of this.trap) {
        if (!t.on) continue;
        for (let i = 0; i < n; ++i) {
          const w = this.noise.white(); let y = 0; const st = t.t;
          switch (t.kind) {
            case 0: { const f = 48 + 130 * Math.exp(-st * 40); t.ph += f / sr; y = Math.sin(2 * Math.PI * t.ph) * Math.exp(-st * 11) * 1.3; break; }
            case 1: { t.ph += 190 / sr; t.lp += (w - t.lp) * 0.6; y = (t.lp * 0.9 + Math.sin(2 * Math.PI * t.ph) * 0.4) * Math.exp(-st * 18); break; }
            case 2: { const f = t.f * (1 + 0.6 * Math.exp(-st * 30)); t.ph += f / sr; y = Math.sin(2 * Math.PI * t.ph) * Math.exp(-st * 9); break; }
            case 3: { const h = w - t.hp; t.hp += (w - t.hp) * 0.35; y = h * Math.exp(-st * 2.6) * 0.7; break; }
            case 4: { const h = w - t.hp; t.hp += (w - t.hp) * 0.55; y = h * Math.exp(-st * 14) * (0.5 + 0.5 * Math.sin(st * 200)) * 0.7; break; }
            default: { t.ph += 880 / sr; y = (Math.sin(2 * Math.PI * t.ph) * 0.8 + w * 0.1) * Math.exp(-st * 45); break; }
          }
          t.t += 1 / sr; if (t.ph > 1) t.ph -= 1;
          gL[i] += y * lv * 0.35; gR[i] += y * lv * 0.35;
        }
        if (t.t > 3) t.on = false;
      }
      // zimbelstern: little bells ring at random while it is drawn and something is playing
      const type = Math.round(V[E.Type]); let zim = false;
      for (let i = 0; i < kStopsPer; ++i) if (V[stopId(0, i)] > 0.5 && stopDef(type, Great, i).perc === P_Zimbel) zim = true;
      if (zim && this.activity > 0.05) {
        this.zimT -= n / sr;
        if (this.zimT <= 0) {
          const hz = [2093, 2349, 2637, 3136, 3520, 4186]; let k = 0; for (let i = 0; i < 6; ++i) if (!this.bell[i].on) { k = i; break; }
          const b = this.bell[k] = newBell(); b.on = true; b.f = hz[Math.floor((this.noise.white() * 0.5 + 0.5) * 5.99)] * (V[E.A4] / 440); this.zimT = 0.12 + 0.4 * (this.noise.white() * 0.5 + 0.5);
        }
      }
      const pr = [1, 2.4, 3.9], am = [1, 0.4, 0.2];
      for (const b of this.bell) {
        if (!b.on) continue;
        for (let i = 0; i < n; ++i) {
          let y = 0; for (let p = 0; p < 3; ++p) { b.ph[p] += b.f * pr[p] / sr; if (b.ph[p] > 1) b.ph[p] -= 1; y += am[p] * Math.sin(2 * Math.PI * b.ph[p]); }
          y *= Math.exp(-b.t * 3.2) * 0.05; b.t += 1 / sr; gL[i] += y * 0.7; gR[i] += y * 1.1;
        }
        if (b.t > 3) b.on = false;
      }
    }
  }
  OCC.engines.pipica = { name: 'Pipica', blurb: 'A pipe organ: table-lookup pipes in principal, flute, string and reed families, wind sag, tremulant, chiff, swell box, couplers, old tunings, 22 real-world rooms, theatre traps and a barrel organ that plays its own tunes. Preset = whole-organ registration. Stops are numbered per division; keys at or below the Pedal split play the Pedal.', specs, groups, make: sr => new Pipica(sr), E };
})();
/* Galactica - JP-8000 / SH-32 / MS-2000 style polysynth with Super Saw, arpeggiator and a 16-step sequencer. Port of plugins/galactica/galactica.h + presets.h */
(function () {
  const names = ['Preset', 'Volume', 'Voices', 'Mode', 'Glide', 'BendRange',
    'O1Wave', 'O1Table', 'O1Oct', 'O1Fine', 'O1Shape', 'O1Detune', 'O1Mix', 'O1Level',
    'O2Wave', 'O2Oct', 'O2Semi', 'O2Fine', 'O2Shape', 'O2Mode', 'O2Amount', 'O2Level',
    'SubLevel', 'SubType', 'NoiseLevel',
    'FType', 'FCut', 'FRes', 'FDrive', 'FEnv', 'FKey', 'FVel',
    'AmpA', 'AmpD', 'AmpS', 'AmpR', 'FltA', 'FltD', 'FltS', 'FltR',
    'L1Shape', 'L1Rate', 'L1Sync', 'L1Fade', 'L1Key', 'L2Shape', 'L2Rate', 'L2Sync', 'L2Fade', 'L2Key',
    'VP1Src', 'VP1Dst', 'VP1Amt', 'VP2Src', 'VP2Dst', 'VP2Amt', 'VP3Src', 'VP3Dst', 'VP3Amt', 'VP4Src', 'VP4Dst', 'VP4Amt',
    'FxType', 'FxAmount', 'FxTone', 'FxMix', 'ChMix', 'ChRate', 'ChDepth', 'DlTime', 'DlFb', 'DlTone', 'DlPing', 'DlMix', 'RvSize', 'RvDamp', 'RvMix',
    'SqMode', 'SqRate', 'SqSwing', 'SqGate', 'SqLen', 'SqDir', 'SqOct', 'SqLatch', 'SqChord', 'SqRhythm', 'SqAccent', 'SqSlide', 'SqHuman', 'M1Dest', 'M1Depth', 'M2Dest', 'M2Depth', 'M3Dest', 'M3Depth', 'StepBase'];
  const E = {}; names.forEach((n, i) => E[n] = i);
  const kSteps = 16, kF = 8; E.Tempo = E.StepBase + kSteps * kF; E.Count = E.Tempo + 1;
  const SNote = 0, SGate = 1, SFlags = 2, SProb = 3, SRatchet = 4, SM1 = 5, SM2 = 6, SM3 = 7;
  const stepParam = (s, f) => E.StepBase + s * kF + f;
  const SrcLfo1 = 1, SrcLfo2 = 2, kSrcN = 14, DstPitch = 1, DstPitch2 = 2, DstShape = 3, DstDetune = 4, DstCut = 5, DstRes = 6, DstAmp = 7, DstPan = 8, DstLfoRate = 9, DstCross = 10, kDstN = 11;
  const presetNames = ['Init', 'Solar Flare', 'Nebula Pad', 'Event Horizon', 'Pulsar', 'Warp Drive', 'Cosmic Rays', 'Red Giant', 'Comet Tail', 'Void Choir', 'Ring World', 'Moonbase Alpha'];
  const tableNames = ['Saw to square', 'Harmonic rise', 'Vowels', 'Pipe organ', 'Glass comb', 'Rusty metal', 'Choir', 'Digital grit', 'Hollow reed', 'Spectral comb', 'Buzz sweep', 'Phase ensemble'];
  const rhythmPat = ['xxxxxxxxxxxxxxxx', 'x-x-x-x-x-x-x-x-', 'x---x---x---x---', '-x-x-x-x-x-x-x-x', 'xXxxxXxxxXxxxXxx', 'x--x--x-x--x--x-', 'x-xx-xx-x-xx-xx-', 'xxx-xxx-xxx-xxx-',
    'x-x--x-x-x--x-x-', 'X--xx-x-X--xx-x-', 'xtxtxtxtxtxtxtxt', 'x-xxx-x-x-xxx-xx', 'X-x-x-xxX-x-x-xx', 'xx--xx--xx--xx--', 'x---x-x-x---x-x-', '-xx--xx--xx--xx-'];
  const chordForms = [[], [4, 7], [3, 7], [5, 7], [2, 7], [4, 7, 10], [4, 7, 11], [3, 7, 10], [3, 6], [4, 8], [7], [12], [3, 7, 10, 14], [4, 7, 14], [4, 7, 9], [3, 7, 9]];
  const srcs = ['None', 'LFO 1', 'LFO 2', 'Filter env', 'Amp env', 'Velocity', 'Key', 'Mod wheel', 'Aftertouch', 'Pitch bend', 'Motion 1', 'Motion 2', 'Motion 3', 'Random'];
  const dsts = ['None', 'Pitch', 'Osc 2 pitch', 'Osc 1 shape', 'Detune', 'Cutoff', 'Resonance', 'Amp level', 'Pan', 'LFO 1 rate', 'Cross / ring'];
  const onoff = ['Off', 'On'];
  const specs = new Array(E.Count);
  const S = (id, p) => { specs[E[id]] = p; };
  S('Preset', P('Preset', '', 0, presetNames.length - 1, 0, '%.0f', false, presetNames)); S('Volume', P('Volume', '', 0, 1, 0.7)); S('Voices', P('Voices', '', 1, 8, 8, '%.0f')); S('Mode', P('Play mode', '', 0, 2, 0, '%.0f', false, ['Poly', 'Mono', 'Legato']));
  S('Glide', P('Glide', '', 0, 1, 0)); S('BendRange', P('Bend range', 'st', 0, 24, 2, '%.0f st'));
  S('O1Wave', P('Osc 1 Wave', '', 0, 8, 0, '%.0f', false, ['Super Saw', 'Saw', 'Square', 'Triangle', 'Triangle mod', 'Feedback', 'Formant', 'Wave bank', 'Noise']));
  S('O1Table', P('Osc 1 Table', '', 0, 11, 0, '%.0f', false, tableNames)); S('O1Oct', P('Osc 1 Octave', '', -2, 2, 0, '%.0f')); S('O1Fine', P('Osc 1 Fine', 'st', -1, 1, 0, '%.2f st'));
  S('O1Shape', P('Osc 1 Shape', '', 0, 1, 0.5)); S('O1Detune', P('Osc 1 Detune', '', 0, 1, 0.4)); S('O1Mix', P('Osc 1 Super mix', '', 0, 1, 0.7)); S('O1Level', P('Osc 1 Level', '', 0, 1, 0.8));
  S('O2Wave', P('Osc 2 Wave', '', 0, 4, 0, '%.0f', false, ['Saw', 'Square', 'Triangle', 'Sine', 'Noise'])); S('O2Oct', P('Osc 2 Octave', '', -2, 2, 0, '%.0f')); S('O2Semi', P('Osc 2 Semitones', 'st', -12, 12, 0, '%.0f st'));
  S('O2Fine', P('Osc 2 Fine', 'st', -1, 1, 0.08, '%.2f st')); S('O2Shape', P('Osc 2 Pulse width', '', 0, 1, 0.5)); S('O2Mode', P('Osc 2 Mode', '', 0, 3, 0, '%.0f', false, ['Free', 'Sync', 'Ring', 'Cross FM']));
  S('O2Amount', P('Osc 2 Ring / FM amount', '', 0, 1, 0.5)); S('O2Level', P('Osc 2 Level', '', 0, 1, 0));
  S('SubLevel', P('Sub level', '', 0, 1, 0)); S('SubType', P('Sub type', '', 0, 3, 0, '%.0f', false, ['-1 oct square', '-2 oct square', '-1 oct sine', 'Subsonic'])); S('NoiseLevel', P('Noise level', '', 0, 1, 0));
  S('FType', P('Filter type', '', 0, 3, 0, '%.0f', false, ['LP 24 dB', 'LP 12 dB', 'Band pass', 'High pass'])); S('FCut', P('Cutoff', 'Hz', 20, 18000, 4000, '%.0f Hz', true)); S('FRes', P('Resonance', '', 0, 1, 0.2));
  S('FDrive', P('Drive', '', 0, 1, 0.1)); S('FEnv', P('Filter env amount', '', -1, 1, 0.3)); S('FKey', P('Key follow', '', 0, 1, 0.4)); S('FVel', P('Velocity to cutoff', '', 0, 1, 0.2));
  const en = ['Amp attack', 'Amp decay', 'Amp sustain', 'Amp release', 'Filter attack', 'Filter decay', 'Filter sustain', 'Filter release'];
  for (let i = 0; i < 8; ++i) { const sus = i % 4 === 2; specs[E.AmpA + i] = P(en[i], sus ? '' : 's', sus ? 0 : 0.001, sus ? 1 : 10, (i === 0 || i === 4) ? 0.005 : (i % 4 === 1 ? 0.3 : (sus ? (i < 4 ? 0.8 : 0.3) : 0.3)), sus ? '%.2f' : '%.3f s', !sus); }
  const lsh = ['Sine', 'Triangle', 'Saw', 'Square', 'Sample & hold', 'Smooth random'], lsync = ['Free', '4 bars', '2 bars', '1 bar', '1/2', '1/4', '1/8', '1/16'];
  for (let l = 0; l < 2; ++l) { const b = E.L1Shape + l * 5, t = l ? 'LFO 2 ' : 'LFO 1 ';
    specs[b] = P(t + 'Shape', '', 0, 5, 0, '%.0f', false, lsh); specs[b + 1] = P(t + 'Rate', 'Hz', 0.02, 30, l ? 0.7 : 5, '%.2f Hz', true); specs[b + 2] = P(t + 'Sync', '', 0, 7, 0, '%.0f', false, lsync);
    specs[b + 3] = P(t + 'Fade in', 's', 0, 5, 0, '%.2f s'); specs[b + 4] = P(t + 'Key sync', '', 0, 1, 1, '%.0f', false, onoff); }
  for (let k = 0; k < 4; ++k) { const t = 'Patch ' + (k + 1) + ' '; specs[E.VP1Src + k * 3] = P(t + 'Source', '', 0, kSrcN - 1, 0, '%.0f', false, srcs); specs[E.VP1Src + k * 3 + 1] = P(t + 'Destination', '', 0, kDstN - 1, 0, '%.0f', false, dsts); specs[E.VP1Src + k * 3 + 2] = P(t + 'Amount', '', -1, 1, 0); }
  S('FxType', P('Insert type', '', 0, 7, 0, '%.0f', false, ['Off', 'Distortion', 'Overdrive', 'Lo-Fi', 'Slicer', 'Phaser', 'Flanger', 'Ring mod'])); S('FxAmount', P('Insert amount', '', 0, 1, 0.5)); S('FxTone', P('Insert tone', '', 0, 1, 0.5)); S('FxMix', P('Insert mix', '', 0, 1, 1));
  S('ChMix', P('Chorus mix', '', 0, 1, 0.3)); S('ChRate', P('Chorus rate', 'Hz', 0.05, 6, 0.6, '%.2f Hz', true)); S('ChDepth', P('Chorus depth', '', 0, 1, 0.5));
  S('DlTime', P('Delay time', '', 0, 5, 2, '%.0f', false, ['1/4', '1/8 dotted', '1/8', '1/8 triplet', '1/16 dotted', '1/16'])); S('DlFb', P('Delay feedback', '', 0, 0.95, 0.4)); S('DlTone', P('Delay tone', '', 0, 1, 0.6));
  S('DlPing', P('Delay ping-pong', '', 0, 1, 1, '%.0f', false, onoff)); S('DlMix', P('Delay mix', '', 0, 1, 0.2)); S('RvSize', P('Reverb size', '', 0, 1, 0.6)); S('RvDamp', P('Reverb damping', '', 0, 1, 0.5)); S('RvMix', P('Reverb mix', '', 0, 1, 0.2));
  S('SqMode', P('Sequencer mode', '', 0, 3, 0, '%.0f', false, ['Off', 'Arp', 'Step', 'Arp x Step'])); S('SqRate', P('Sequencer rate', '', 0, 5, 2, '%.0f', false, ['1/4', '1/8', '1/16', '1/32', '1/8 triplet', '1/16 triplet']));
  S('SqSwing', P('Swing', '', 0, 1, 0)); S('SqGate', P('Gate length', '', 0.05, 1, 0.6)); S('SqLen', P('Pattern length', '', 1, 16, 16, '%.0f'));
  S('SqDir', P('Arp direction', '', 0, 5, 0, '%.0f', false, ['Up', 'Down', 'Up-down', 'Random', 'As played', 'Chord'])); S('SqOct', P('Arp octaves', '', 1, 4, 2, '%.0f')); S('SqLatch', P('Latch', '', 0, 1, 0, '%.0f', false, onoff));
  S('SqChord', P('Chord memory', '', 0, 15, 0, '%.0f', false, ['Off', 'Major', 'Minor', 'Sus4', 'Sus2', 'Dominant 7', 'Major 7', 'Minor 7', 'Diminished', 'Augmented', 'Power', 'Octave', 'Minor 9', 'Major add9', 'Sixth', 'Minor sixth']));
  S('SqRhythm', P('Rhythm style', '', 0, 15, 0, '%.0f', false, ['Straight 16', 'Eighths', 'Quarters', 'Offbeat', 'Accent 4', 'Tresillo', 'Syncopated', 'Triplet feel', 'Son clave', 'Accented clave', 'Tied', 'Rolling', 'Driving', 'Pairs', 'Sparse', 'Shuffle']));
  S('SqAccent', P('Accent amount', '', 0, 1, 0.6)); S('SqSlide', P('Slide time', '', 0, 1, 0.3)); S('SqHuman', P('Humanize', '', 0, 1, 0));
  for (let m = 0; m < 3; ++m) { const t = 'Motion ' + (m + 1) + ' '; specs[E.M1Dest + m * 2] = P(t + 'Destination', '', 0, kDstN - 1, 0, '%.0f', false, dsts); specs[E.M1Dest + m * 2 + 1] = P(t + 'Depth', '', 0, 1, 0.5); }
  for (let s = 0; s < kSteps; ++s) { const t = 'Step ' + (s + 1) + ' ';
    specs[stepParam(s, SNote)] = P(t + 'Note', 'st', -24, 24, 0, '%.0f st'); specs[stepParam(s, SGate)] = P(t + 'Gate', '', 0, 2, 1, '%.0f', false, ['Off', 'On', 'Tie']);
    specs[stepParam(s, SFlags)] = P(t + 'Flags', '', 0, 3, 0, '%.0f', false, ['-', 'Accent', 'Slide', 'Accent+Slide']); specs[stepParam(s, SProb)] = P(t + 'Probability', '%', 0, 100, 100, '%.0f %%');
    specs[stepParam(s, SRatchet)] = P(t + 'Ratchet', '', 1, 4, 1, '%.0f'); specs[stepParam(s, SM1)] = P(t + 'Motion 1', '', 0, 1, 0.5); specs[stepParam(s, SM2)] = P(t + 'Motion 2', '', 0, 1, 0.5); specs[stepParam(s, SM3)] = P(t + 'Motion 3', '', 0, 1, 0.5); }
  specs[E.Tempo] = P('Tempo', 'BPM', 40, 240, 120, '%.0f BPM');
  const nameToId = {}; specs.forEach((s, i) => nameToId[s.name] = i);
  const range = (a, n) => Array.from({ length: n }, (_, i) => a + i);
  const stepIds = f => range(0, kSteps).map(s => stepParam(s, f));
  const groups = [
    ['Main', [E.Volume, E.Voices, E.Mode, E.Glide, E.BendRange, E.Tempo]],
    ['Oscillator 1', range(E.O1Wave, 8)],
    ['Oscillator 2', range(E.O2Wave, 8)],
    ['Sub & Noise', [E.SubLevel, E.SubType, E.NoiseLevel]],
    ['Filter', range(E.FType, 7)],
    ['Amp envelope', range(E.AmpA, 4)], ['Filter envelope', range(E.FltA, 4)],
    ['LFO 1', range(E.L1Shape, 5)], ['LFO 2', range(E.L2Shape, 5)],
    ['Virtual patch 1-2', range(E.VP1Src, 6)], ['Virtual patch 3-4', range(E.VP3Src, 6)],
    ['Insert effect', range(E.FxType, 4)], ['Chorus', range(E.ChMix, 3)], ['Delay', range(E.DlTime, 5)], ['Reverb', range(E.RvSize, 3)],
    ['Arpeggiator / sequencer', range(E.SqMode, 13)],
    ['Motion lanes', range(E.M1Dest, 6)],
    ['Step notes', stepIds(SNote)], ['Step gates', stepIds(SGate)], ['Step flags', stepIds(SFlags)], ['Step probability', stepIds(SProb)], ['Step ratchets', stepIds(SRatchet)],
    ['Step motion 1', stepIds(SM1)], ['Step motion 2', stepIds(SM2)], ['Step motion 3', stepIds(SM3)],
  ];

  // ---- wavetable bank (built lazily, one table at a time; same recipes as modica/wavetables.h)
  const kTabN = 1024, kFrames = 16, kMips = 9, kMaxH = 256;
  const gSin = new Float64Array(2050); for (let i = 0; i < 2050; ++i) gSin[i] = Math.sin(2 * Math.PI * i / 2048);
  const fsin = cyc => { if (!(Math.abs(cyc) < 1e6)) return 0; cyc -= Math.floor(cyc); const x = cyc * 2048; let i = x | 0; if (i > 2048) i = 2048; const f = x - i; return gSin[i] + (gSin[i + 1] - gSin[i]) * f; };
  const whash = (a, b) => { let h = (Math.imul(a, 2654435761) ^ Math.imul(b, 40503) ^ 0x9E3779B9) >>> 0; h = (h ^ (h >>> 15)) >>> 0; h = Math.imul(h, 2246822519) >>> 0; h = (h ^ (h >>> 13)) >>> 0; return (h & 0xFFFF) / 65535; };
  const FV = [[800, 1150, 2900], [400, 1600, 2700], [270, 2300, 3000], [450, 800, 2830], [325, 700, 2530]], GV = [[800, 1050, 2800], [600, 1000, 2500], [300, 1800, 2900], [500, 900, 2700], [350, 650, 2400]];
  const ORG = [[1, 1, 0.8, 0, 0.5, 0, 0.3, 0.2, 0, 0], [0.2, 1, 0.3, 0.9, 0.2, 0.7, 0.2, 0.6, 0.5, 0.4]];
  const rec = { amp: 0, ph: 0 };
  function recipe(t, p, k) {
    const kk = k; let amp = 0, ph = 0;
    switch (t) {
      case 0: amp = ((k & 1) ? 1 : (1 - p)) / kk; break;
      case 1: { const lim = 1 + p * 63; amp = kk <= lim ? 1 / kk : (kk < lim + 2 ? (lim + 2 - kk) * 0.5 / kk : 0); break; }
      case 2: case 6: {
        const x = p * 4, i = Math.min(x | 0, 3), f = x - i, A = t === 2 ? FV : GV; let s = 0;
        for (let j = 0; j < 3; ++j) { const c = (A[i][j] + (A[i + 1][j] - A[i][j]) * f) / 110, bw = 1.2 + 0.25 * c, d = (kk - c) / bw; s += Math.exp(-0.5 * d * d) * (j === 0 ? 1 : 0.7); }
        amp = s / Math.pow(kk, 0.3) * (t === 6 ? 1 : 0.8); if (t === 6) ph = 0.15 * whash(k, 6); break; }
      case 3: if (k > 10) { amp = 0; break; } amp = (ORG[0][k - 1] + (ORG[1][k - 1] - ORG[0][k - 1]) * p) * 0.6; break;
      case 4: { const s = 1 + Math.floor(p * 7); amp = ((k - 1) % s === 0) ? 1 / Math.pow(kk, 0.7) : 0; break; }
      case 5: { const s = 2 + Math.floor(p * 6); amp = (1 / Math.sqrt(kk)) * ((k % s === 0) ? 0.15 : 1); ph = whash(k, 5); break; }
      case 7: { const lv = 2 + (1 - p) * 30, a = 1 / kk; amp = Math.floor(a * lv + 0.5) / lv; break; }
      case 8: { if (!(k & 1)) { amp = 0; break; } const c = 3 + p * 20, d = (kk - c) / (3 + p * 4); amp = (1 / kk) * (0.4 + 1.6 * Math.exp(-0.5 * d * d)); break; }
      case 9: amp = (1 / kk) * (0.5 + 0.5 * Math.cos(2 * Math.PI * kk * p * 0.5)); break;
      case 10: { const lim = 1 + p * 120; amp = kk <= lim ? 1 : 0; break; }
      default: amp = 1 / kk; ph = p * whash(k, 11); break;
    }
    rec.amp = amp; rec.ph = ph;
  }
  const WT = (OCC.__galaWT = OCC.__galaWT || { tabs: [], sinT: null });
  function wtTable(t) {
    let T = WT.tabs[t]; if (T) return T;
    if (!WT.sinT) { WT.sinT = new Float32Array(kTabN); for (let i = 0; i < kTabN; ++i) WT.sinT[i] = Math.sin(2 * Math.PI * i / kTabN); }
    const sinT = WT.sinT; T = new Float32Array(kMips * kFrames * (kTabN + 1));
    for (let f = 0; f < kFrames; ++f) { const p = f / (kFrames - 1); let scale = 1;
      for (let m = 0; m < kMips; ++m) {
        const off = (m * kFrames + f) * (kTabN + 1), H = kMaxH >> m;
        for (let k = 1; k <= H; ++k) { recipe(t, p, k); const a = rec.amp; if (a === 0) continue; let idx = (rec.ph * kTabN | 0) & (kTabN - 1); for (let n = 0; n < kTabN; ++n) { T[off + n] += a * sinT[idx]; idx = (idx + k) & (kTabN - 1); } }
        if (m === 0) { let pk = 1e-6; for (let n = 0; n < kTabN; ++n) pk = Math.max(pk, Math.abs(T[off + n])); scale = 0.9 / pk; }
        for (let n = 0; n < kTabN; ++n) T[off + n] *= scale; T[off + kTabN] = T[off];
      } }
    WT.tabs[t] = T; return T;
  }
  function wtRead(T, hz, sr, phase, pos) {
    let m = 0; while (m < kMips - 1 && hz * (kMaxH >> m) > 0.5 * sr) ++m;
    const fp = (pos < 0 ? 0 : (pos > 1 ? 1 : pos)) * (kFrames - 1), f0 = Math.min(fp | 0, kFrames - 2), ff = fp - f0;
    const x = (phase - Math.floor(phase)) * kTabN, i = x | 0, fr = x - i;
    const a = (m * kFrames + f0) * (kTabN + 1) + i, b = (m * kFrames + f0 + 1) * (kTabN + 1) + i;
    const va = T[a] + (T[a + 1] - T[a]) * fr, vb = T[b] + (T[b + 1] - T[b]) * fr; return va + (vb - va) * ff;
  }

  class Rng { constructor(s) { this.s = s >>> 0; } white() { let s = this.s; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; this.s = s; return (s | 0) / 2147483648; } uni() { return 0.5 + 0.5 * this.white(); } }
  class Rev { // Freeverb-style room
    constructor(sr) {
      const ct = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], at = [556, 441, 341, 225]; this.cb = []; this.ci = [[], []]; this.cz = [[], []]; this.ab = []; this.ai = [[], []];
      for (let ch = 0; ch < 2; ++ch) { this.cb.push([]); this.ab.push([]); for (let k = 0; k < 8; ++k) { this.cb[ch].push(new Float32Array(Math.floor((ct[k] + ch * 23) * sr / 44100) + 1)); this.ci[ch].push(0); this.cz[ch].push(0); }
        for (let k = 0; k < 4; ++k) { this.ab[ch].push(new Float32Array(Math.floor((at[k] + ch * 23) * sr / 44100) + 1)); this.ai[ch].push(0); } }
    }
    clear() { for (let ch = 0; ch < 2; ++ch) { for (let k = 0; k < 8; ++k) { this.cb[ch][k].fill(0); this.ci[ch][k] = 0; this.cz[ch][k] = 0; } for (let k = 0; k < 4; ++k) { this.ab[ch][k].fill(0); this.ai[ch][k] = 0; } } }
    tick(ch, inp, fb, damp) {
      let s = 0; const cb = this.cb[ch], ci = this.ci[ch], cz = this.cz[ch];
      for (let k = 0; k < 8; ++k) { const b = cb[k], i = ci[k], y = b[i]; const z = y * (1 - damp) + cz[k] * damp; cz[k] = z; b[i] = inp + z * fb; ci[k] = (i + 1 >= b.length) ? 0 : i + 1; s += y; }
      const ab = this.ab[ch], ai = this.ai[ch];
      for (let k = 0; k < 4; ++k) { const b = ab[k], i = ai[k], bo = b[i], y = -s + bo; b[i] = s + bo * 0.5; ai[k] = (i + 1 >= b.length) ? 0 : i + 1; s = y; }
      return s;
    }
  }
  const mkVoice = seed => ({ active: false, gate: false, note: 60, age: 0, quiet: 0, tick: 0, offAt: -1, vel: 0, accent: 0, pitch: 60, target: 60, slideC: 0, rnd: 0,
    ph: new Float64Array(7), ph2: 0, phSub: 0, fbz: 0, ic: new Float64Array(2), ly: new Float64Array(4), lt: new Float64Array(4), aLv: 0, fLv: 0, wrap: 0, aSt: 0, fSt: 0,
    lph: new Float64Array(2), lfade: new Float64Array(2), lsh: new Float64Array(2), lsh2: new Float64Array(2), src: new Float64Array(kSrcN), dst: new Float64Array(kDstN),
    cutHz: 1000, qk: 1, gl: 0, aA: 0, aD: 0, aR: 0, fA: 0, fD: 0, fR: 0, panL: 0.7071 * 1.41421, panR: 0.7071 * 1.41421, spread: 0, rng: new Rng(seed) });
  function resetVoice(v) {
    v.active = false; v.gate = false; v.note = 60; v.age = 0; v.quiet = 0; v.tick = 0; v.offAt = -1; v.vel = 0; v.accent = 0; v.pitch = 60; v.target = 60; v.slideC = 0; v.rnd = 0;
    v.ph.fill(0); v.ph2 = 0; v.phSub = 0; v.fbz = 0; v.ic.fill(0); v.ly.fill(0); v.lt.fill(0); v.aLv = 0; v.fLv = 0; v.wrap = 0; v.aSt = 0; v.fSt = 0;
    v.lph.fill(0); v.lfade.fill(0); v.lsh.fill(0); v.lsh2.fill(0); v.src.fill(0); v.dst.fill(0); v.cutHz = 1000; v.qk = 1; v.gl = 0;
  }

  class Galactica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); this.voice = []; for (let i = 0; i < 8; ++i) this.voice.push(mkVoice(2463534242 + i * 7919));
      this.held = []; this.phys = []; this.play = []; this.arp = []; this.arpDirty = true; this.running = false; this.pendingStart = false; this.clk = 0; this.stepLen = 12000; this.stepIdx = 0; this.arpPos = 0;
      this.nTrig = 0; this.lastSeq = -1; this.trig = []; this.mot = [0.5, 0.5, 0.5]; this.motT = [0.5, 0.5, 0.5]; this.bend = 0; this.wheel = 0; this.press = 0; this.lastPitch = 0; this.lastVel = 0.8;
      this.oL = 0; this.oR = 0; this.fx = [new Float64Array(8), new Float64Array(8)]; this.fxN = [0, 0]; this.fxPh = 0; this.rmPh = 0; this.chPh = 0; this.slPh = 0; this.slIdx = 0; this.dlz = [0, 0];
      const mk = n => new DelayLine(Math.floor(n * sr)); this.dly = [mk(2.1), mk(2.1)]; this.cho = [mk(0.06), mk(0.06)]; this.fl = [mk(0.02), mk(0.02)]; this.rev = new Rev(sr);
      this.c = {}; this.wt = null; this.wtIdx = -1;
    }
    tempo() { return this.v[E.Tempo]; }
    seqMode() { return Math.round(this.v[E.SqMode]); }
    set(id, x) {
      if (id < 0 || id >= E.Count) return; const V = this.v; V[id] = x;
      if (id === E.Preset) { this.loadPreset(Math.round(x), true); return; }
      if (id === E.SqMode) { if (this.seqMode() === 0) this.stopSeq(); }
      if (id === E.SqLatch && x < 0.5 && this.phys.length === 0) { this.play = []; this.arpDirty = true; this.stopSeq(); }
      if (id === E.SqChord || id === E.SqDir || id === E.SqOct) this.arpDirty = true;
      if (id === E.O1Table || id === E.O1Wave) this.ensureTable();
    }
    ensureTable() { if (Math.round(this.v[E.O1Wave]) === 7) { const t = clampf(Math.round(this.v[E.O1Table]), 0, 11); if (t !== this.wtIdx) { this.wt = wtTable(t); this.wtIdx = t; } } }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.wheel = m; } pressure(p) { this.press = p; }
    allNotesOff() { for (const v of this.voice) v.gate = false; this.phys = []; if (!(this.v[E.SqLatch] > 0.5)) this.play = []; this.held = []; this.arpDirty = true; this.stopSeq(); }
    noteOn(note, vel) {
      const tuned = note + this.noteTune * 0.01; this.noteTune = 0;
      if (this.seqMode() === 0) { this.playNote(note, tuned, vel, false, -1); return; }
      if (this.v[E.SqLatch] > 0.5 && this.phys.length === 0) this.play = [];
      this.phys = this.phys.filter(n => n !== note); this.phys.push(note);
      this.play = this.play.filter(n => n !== note); this.play.push(note); this.arpDirty = true; this.lastVel = vel;
      if (!this.running) { this.running = true; this.clk = 0; this.stepIdx = 0; this.arpPos = 0; this.nTrig = 0; this.pendingStart = true; }
    }
    noteOff(note) {
      this.phys = this.phys.filter(n => n !== note);
      if (this.seqMode() !== 0) { if (this.v[E.SqLatch] < 0.5) { this.play = this.play.filter(n => n !== note); this.arpDirty = true; if (this.play.length === 0) this.stopSeq(); } return; }
      this.held = this.held.filter(n => n !== note);
      const mode = Math.round(this.v[E.Mode]);
      if (mode !== 0) { const v = this.voice[0]; if (this.held.length && v.gate) { v.target = this.held[this.held.length - 1]; v.note = v.target; } else if (!this.held.length) v.gate = false; return; }
      for (const v of this.voice) if (v.active && v.gate && v.note === note && v.offAt < 0) v.gate = false;
    }
    // ---- voices
    allocVoice() {
      const mode = Math.round(this.v[E.Mode]), sm = this.seqMode(); if (mode !== 0 && sm === 0) return this.voice[0];
      const lim = sm !== 0 ? 8 : clampf(Math.round(this.v[E.Voices]), 1, 8), vs = this.voice;
      for (let i = 0; i < lim; ++i) if (!vs[i].active) return vs[i];
      let o = 0; for (let i = 1; i < lim; ++i) if (vs[i].age > vs[o].age) o = i; return vs[o];
    }
    startVoice(v, note, tuned, vel, accent, retrig) {
      const V = this.v, gl = V[E.Glide] > 0.001 && this.lastPitch > 0;
      if (retrig) { const seed = v.rng.s; resetVoice(v); v.rng.s = (seed ^ (Math.imul(note, 2654435761) + 12345)) >>> 0; v.rng.white();
        for (let k = 0; k < 7; ++k) v.ph[k] = v.rng.uni(); v.ph2 = v.rng.uni(); v.rnd = v.rng.white(); v.fSt = v.aSt = 1; v.lph[0] = v.lph[1] = 0; }
      v.active = true; v.gate = true; v.note = note; v.vel = vel; v.accent = accent ? 1 : 0; v.target = tuned; v.pitch = gl ? this.lastPitch : tuned; v.age = 0; v.quiet = 0; v.offAt = -1; v.slideC = 0; this.lastPitch = tuned;
      if (retrig) { v.lfade[0] = v.lfade[1] = 0; if (V[E.L1Key] < 0.5) v.lph[0] = v.rng.uni(); if (V[E.L2Key] < 0.5) v.lph[1] = v.rng.uni(); }
    }
    playNote(note, tuned, vel, accent, len) {
      const mode = Math.round(this.v[E.Mode]), sm = this.seqMode();
      if (mode === 2 && sm === 0 && this.voice[0].active && this.voice[0].gate) { const v = this.voice[0]; this.held.push(note); v.target = tuned; v.note = note; this.lastPitch = tuned; return; }
      if (mode !== 0 && sm === 0) this.held.push(note);
      const v = this.allocVoice(); this.startVoice(v, note, tuned, vel, accent, true); v.offAt = len;
      if (sm !== 0) this.lastSeq = this.voice.indexOf(v);
    }
    // ---- sequencer
    stepSeconds() { const b = [1, 0.5, 0.25, 0.125, 1 / 3, 1 / 6]; return 60 / Math.max(20, this.tempo()) * b[clampf(Math.round(this.v[E.SqRate]), 0, 5)]; }
    stepLenFor(idx) { const L = this.stepSeconds() * this.sr, s = this.v[E.SqSwing] * 0.5; return L * ((idx & 1) ? 1 - s : 1 + s); }
    stopSeq() { this.running = false; this.nTrig = 0; for (const v of this.voice) if (v.offAt >= 0) { v.gate = false; v.offAt = -1; } }
    rebuildArp() {
      this.arpDirty = false; this.arp = []; if (!this.play.length) return;
      const V = this.v, dir = Math.round(V[E.SqDir]); let base = this.play.slice(); if (dir !== 4) base.sort((a, b) => a - b);
      const form = chordForms[clampf(Math.round(V[E.SqChord]), 0, 15)]; let notes = [];
      for (const k of base) { notes.push(k); for (const iv of form) notes.push(k + iv); }
      if (dir !== 4) { notes.sort((a, b) => a - b); notes = notes.filter((n, i) => i === 0 || n !== notes[i - 1]); }
      const octs = clampf(Math.round(V[E.SqOct]), 1, 4), arp = [];
      for (let o = 0; o < octs; ++o) for (const n of notes) arp.push(Math.min(127, n + 12 * o));
      if (dir === 1) arp.reverse(); else if (dir === 2 && arp.length > 2) { const d = arp.slice(1, arp.length - 1).reverse(); for (const x of d) arp.push(x); }
      this.arp = arp; if (this.arpPos >= arp.length) this.arpPos = 0;
    }
    nextArpNote() {
      const arp = this.arp; if (!arp.length) return 60; const dir = Math.round(this.v[E.SqDir]); let n;
      if (dir === 3) n = arp[Math.floor(this.voice[0].rng.uni() * arp.length) % arp.length]; else { n = arp[this.arpPos % arp.length]; this.arpPos = (this.arpPos + 1) % arp.length; }
      return n;
    }
    specFor(idx) {
      const V = this.v, mode = this.seqMode();
      if (mode === 1) { const c = rhythmPat[clampf(Math.round(V[E.SqRhythm]), 0, 15)][idx % 16]; return { on: c !== '-', tie: c === 't', slide: false }; }
      const len = clampf(Math.round(V[E.SqLen]), 1, 16), sb = E.StepBase + (idx % len) * kF, g = Math.round(V[sb + SGate]), fl = Math.round(V[sb + SFlags]);
      return { on: g !== 0, tie: g === 2, slide: (fl & 2) !== 0 };
    }
    beginStep() {
      if (this.arpDirty) this.rebuildArp();
      const V = this.v, mode = this.seqMode(); this.stepLen = this.stepLenFor(this.stepIdx);
      if (mode === 0 || !this.play.length) return;
      const len = clampf(Math.round(V[E.SqLen]), 1, 16), si = this.stepIdx % len, sb = E.StepBase + si * kF;
      this.motT[0] = V[sb + SM1]; this.motT[1] = V[sb + SM2]; this.motT[2] = V[sb + SM3];
      this.nTrig = 0; const human = V[E.SqHuman], dir = Math.round(V[E.SqDir]);
      let on = true, acc = false, slide = false, tie = false, ratchet = 1, offset = 0;
      if (mode === 1) { const c = rhythmPat[clampf(Math.round(V[E.SqRhythm]), 0, 15)][this.stepIdx % 16]; on = c !== '-'; acc = c === 'X'; tie = c === 't'; }
      else { const g = Math.round(V[sb + SGate]), fl = Math.round(V[sb + SFlags]); on = g !== 0; tie = g === 2; acc = (fl & 1) !== 0; slide = (fl & 2) !== 0;
        ratchet = clampf(Math.round(V[sb + SRatchet]), 1, 4); offset = Math.round(V[sb + SNote]); if (on && this.voice[0].rng.uni() * 100 > V[sb + SProb]) on = false; }
      if (!on) return;
      if (tie && this.lastSeq >= 0 && this.voice[this.lastSeq].active && this.voice[this.lastSeq].gate) { this.voice[this.lastSeq].offAt = Math.trunc(this.stepLen * Math.max(0.5, V[E.SqGate])) + 2; return; }
      const vel = acc ? 1 : clampf(this.lastVel * 0.85, 0.2, 1), notes = [];
      if (mode === 2) notes.push(this.play[this.play.length - 1] + offset);
      else if (mode === 1 && dir === 5) { if (!this.arp.length) return; for (const n of this.arp) notes.push(n); if (notes.length > 6) notes.length = 6; }
      else notes.push(this.nextArpNote() + (mode === 3 ? offset : 0));
      const gateV = clampf(V[E.SqGate], 0.05, 1), sub = this.stepLen / ratchet; let gl = gateV >= 0.95 ? sub + 2 : Math.max(40, gateV * sub);
      if (ratchet === 1) {
        let total = this.stepLen, lastLen = 0, j = 1, tied = false;
        while (j < 16) { const sp = this.specFor(this.stepIdx + j); if (!(sp.on && sp.tie)) break; lastLen = this.stepLenFor(this.stepIdx + j); total += lastLen; tied = true; ++j; }
        if (tied) gl = total - lastLen * (1 - gateV);
        const nx = this.specFor(this.stepIdx + j); if (nx.on && nx.slide) gl = Math.max(gl, total + 2);
      }
      for (let r = 0; r < ratchet; ++r) for (const n of notes) { if (this.nTrig >= 16) break; const at = r * sub + (human > 0 ? this.voice[0].rng.uni() * human * 0.15 * this.stepLen : 0); this.trig[this.nTrig++] = { at, note: clampf(n, 0, 127), vel, accent: acc, slide: slide && r === 0, len: gl }; }
    }
    fireTrig(t) {
      const V = this.v;
      if (t.slide && this.lastSeq >= 0 && this.voice[this.lastSeq].active && this.voice[this.lastSeq].gate) {
        const v = this.voice[this.lastSeq]; v.target = t.note; v.note = t.note; v.slideC = 1 - Math.exp(-1 / (Math.max(0.002, V[E.SqSlide] * 0.3) * this.sr)); v.offAt = Math.trunc(t.len); if (t.accent) v.accent = 1; this.lastPitch = t.note; return;
      }
      this.playNote(t.note, t.note, t.vel, t.accent, Math.trunc(t.len));
    }
    seqClock() {
      const mot = this.mot, motT = this.motT; mot[0] += (motT[0] - mot[0]) * 0.004; mot[1] += (motT[1] - mot[1]) * 0.004; mot[2] += (motT[2] - mot[2]) * 0.004;
      if (!this.running || this.seqMode() === 0) return;
      if (this.pendingStart) { this.pendingStart = false; this.beginStep(); }
      const tr = this.trig;
      for (let i = 0; i < this.nTrig;) { if (this.clk >= tr[i].at) { const t = tr[i]; tr[i] = tr[--this.nTrig]; this.fireTrig(t); } else ++i; }
      this.clk += 1; if (this.clk >= this.stepLen) { this.clk -= this.stepLen; ++this.stepIdx; if (this.nTrig > 0) { const n = this.nTrig; this.nTrig = 0; for (let i = 0; i < n; ++i) this.fireTrig(tr[i]); } this.beginStep(); }
    }
    // ---- voice
    lfoShape(shape, ph, v, k, wrap) {
      switch (shape) { case 1: return 4 * Math.abs(ph - 0.5) - 1; case 2: return 2 * ph - 1; case 3: return ph < 0.5 ? 1 : -1;
        case 4: if (wrap) v.lsh[k] = v.rng.white(); return v.lsh[k];
        case 5: if (wrap) { v.lsh2[k] = v.lsh[k]; v.lsh[k] = v.rng.white(); } return v.lsh2[k] + (v.lsh[k] - v.lsh2[k]) * (0.5 - 0.5 * Math.cos(kPif * ph));
        default: return fsin(ph); }
    }
    controlTick(v) {
      const V = this.v, sr = this.sr, T = 8, lf = [0, 0], beats = [0, 16, 8, 4, 2, 1, 0.5, 0.25];
      for (let k = 0; k < 2; ++k) {
        const b = E.L1Shape + k * 5, sync = Math.round(V[b + 2]); let rate = sync > 0 ? this.tempo() / 60 / beats[sync] : V[b + 1]; if (k === 0) rate *= Math.pow(2, v.dst[DstLfoRate] * 3);
        v.lph[k] += clampf(rate, 0.001, 100) * T / sr; let wrap = false; if (v.lph[k] >= 1) { v.lph[k] -= Math.floor(v.lph[k]); wrap = true; }
        const fade = V[b + 3]; v.lfade[k] = fade > 0.001 ? Math.min(1, v.lfade[k] + T / (fade * sr)) : 1;
        lf[k] = this.lfoShape(Math.round(V[b]), v.lph[k], v, k, wrap) * v.lfade[k];
      }
      const s = v.src, mot = this.mot;
      s[0] = 0; s[1] = lf[0]; s[2] = lf[1]; s[3] = v.fLv; s[4] = v.aLv; s[5] = v.vel; s[6] = (v.note - 60) / 36; s[7] = this.wheel; s[8] = this.press; s[9] = this.bend; s[10] = (mot[0] - 0.5) * 2; s[11] = (mot[1] - 0.5) * 2; s[12] = (mot[2] - 0.5) * 2; s[13] = v.rnd;
      const d = v.dst; d.fill(0);
      for (let k = 0; k < 4; ++k) { const sc = Math.round(V[E.VP1Src + k * 3]), t = Math.round(V[E.VP1Src + k * 3 + 1]); if (sc > 0 && t > 0 && t < kDstN) d[t] += s[clampf(sc, 0, kSrcN - 1)] * V[E.VP1Src + k * 3 + 2]; }
      for (let m = 0; m < 3; ++m) { const t = Math.round(V[E.M1Dest + m * 2]); if (t > 0 && t < kDstN) d[t] += (mot[m] - 0.5) * 2 * V[E.M1Dest + m * 2 + 1]; }
      const inc = t => 1 / Math.max(1, t * sr), coef = t => 1 - Math.exp(-4 / Math.max(1, t * sr));
      v.aA = inc(V[E.AmpA]); v.aD = coef(V[E.AmpD]); v.aR = coef(V[E.AmpR]); v.fA = inc(V[E.FltA]); v.fD = coef(V[E.FltD]); v.fR = coef(V[E.FltR]);
      const acc = v.accent * V[E.SqAccent];
      const oct = Math.log2(V[E.FCut] / 1000) + V[E.FEnv] * v.fLv * 4 * (1 + acc * 0.8) + V[E.FKey] * (v.note - 60) / 12 + V[E.FVel] * (v.vel - 0.5) * 2 + d[DstCut] * 4 + acc;
      const lad = Math.round(V[E.FType]) === 0;
      v.cutHz = clampf(1000 * Math.pow(2, oct), 20, lad ? sr * 0.25 : sr * 0.45);
      const res = clampf(V[E.FRes] + d[DstRes] * 0.5, 0, 1); v.qk = lad ? res : (1 / (0.6 + res * res * 24));
      v.gl = lad ? Math.min(0.6, 1 - Math.exp(-2 * kPif * v.cutHz / sr)) : Math.tan(kPif * v.cutHz / sr);
      const pan = clampf(d[DstPan], -1, 1), a = (pan + 1) * 0.25 * kPif; v.panL = Math.cos(a) * 1.41421; v.panR = Math.sin(a) * 1.41421;
      const x = clampf(V[E.O1Detune] + d[DstDetune] * 0.5, 0, 1); v.spread = x * x;
    }
    prepBlock() {
      const V = this.v, c = this.c; c.w1 = Math.round(V[E.O1Wave]); c.w2 = Math.round(V[E.O2Wave]); c.m2 = Math.round(V[E.O2Mode]); c.ft = Math.round(V[E.FType]); c.st = Math.round(V[E.SubType]);
      c.glide = V[E.Glide] > 0.001 ? 1 - Math.exp(-1 / (Math.max(0.0005, V[E.Glide] * V[E.Glide] * 1.5) * this.sr)) : 1;
      const mix = V[E.O1Mix]; c.side = -0.73764 * mix * mix + 1.2841 * mix + 0.044372; c.cen = -0.55366 * mix + 0.99785;
      c.table = clampf(Math.round(V[E.O1Table]), 0, 11); if (c.w1 === 7 && this.wtIdx !== c.table) this.ensureTable();
    }
    renderVoice(v) {
      if (v.tick === 0) this.controlTick(v); v.tick = (v.tick + 1) & 7;
      const V = this.v, c = this.c, sr = this.sr;
      if (v.offAt >= 0 && --v.offAt < 0) v.gate = false;
      v.pitch += (v.target - v.pitch) * (v.slideC > 0 ? v.slideC : c.glide);
      // envelopes
      const gate = v.gate;
      if (gate) { if (v.fSt === 0) v.fSt = 1; if (v.aSt === 0) v.aSt = 1; } else { if (v.fSt !== 0 && v.fSt !== 3) v.fSt = 3; if (v.aSt !== 0 && v.aSt !== 3) v.aSt = 3; }
      if (v.fSt === 1) { v.fLv += v.fA; if (v.fLv >= 1) { v.fLv = 1; v.fSt = 2; } } else if (v.fSt === 2) v.fLv += (V[E.FltS] - v.fLv) * v.fD; else if (v.fSt === 3) { v.fLv -= v.fLv * v.fR; if (v.fLv < 1e-5) { v.fLv = 0; v.fSt = 0; } }
      if (v.aSt === 1) { v.aLv += v.aA; if (v.aLv >= 1) { v.aLv = 1; v.aSt = 2; } } else if (v.aSt === 2) v.aLv += (V[E.AmpS] - v.aLv) * v.aD; else if (v.aSt === 3) { v.aLv -= v.aLv * v.aR; if (v.aLv < 1e-5) { v.aLv = 0; v.aSt = 0; } }
      const aenv = v.aLv;
      if (v.aSt === 0 && !v.gate) { v.active = false; return; }
      const d = v.dst, base = v.pitch + this.bend * V[E.BendRange] + d[DstPitch] * 24, m2 = c.m2;
      // oscillator 2
      const f2 = clampf(midiHz(base + V[E.O2Oct] * 12 + V[E.O2Semi] + V[E.O2Fine] + d[DstPitch2] * 12), 0, sr * 0.45), dt2 = f2 / sr; let o2 = 0;
      if (m2 === 1 && v.wrap > 0.5) v.ph2 = 0;
      const ph2 = v.ph2;
      switch (c.w2) { case 0: o2 = 2 * ph2 - 1 - polyBlep(ph2, dt2); break;
        case 1: { const pw = clampf(V[E.O2Shape], 0.05, 0.95); o2 = ph2 < pw ? 1 : -1; o2 += polyBlep(ph2, dt2); let t2 = ph2 + 1 - pw; if (t2 >= 1) t2 -= 1; o2 -= polyBlep(t2, dt2); break; }
        case 2: o2 = 4 * Math.abs(ph2 - 0.5) - 1; break; case 3: o2 = fsin(ph2); break; default: o2 = v.rng.white(); break; }
      v.ph2 += dt2; if (v.ph2 >= 1) v.ph2 -= Math.floor(v.ph2);
      // oscillator 1
      const f1 = clampf(midiHz(base + V[E.O1Oct] * 12 + V[E.O1Fine]), 0, sr * 0.45), dt = f1 / sr, w1 = c.w1;
      const shape = clampf(V[E.O1Shape] + d[DstShape] * 0.5, 0, 1), cross = clampf(V[E.O2Amount] + d[DstCross] * 0.5, 0, 1), pmod = m2 === 3 ? o2 * cross * 0.5 : 0;
      let o1 = 0, wrapped = false, ph;
      switch (w1) {
        case 0: { const spread = v.spread, side = c.side, cen = c.cen, P0 = v.ph; let sum = 0;
          for (let k = 0; k < 7; ++k) { const ratio = 1 + SSOFF[k] * spread, dd = Math.min(0.45, dt * ratio); let p = P0[k] + pmod; p -= Math.floor(p); sum += (2 * p - 1 - polyBlep(p, dd)) * (k === 3 ? cen : side);
            P0[k] += dd; if (P0[k] >= 1) { P0[k] -= Math.floor(P0[k]); if (k === 3) wrapped = true; } }
          o1 = sum * 0.32; break; }
        case 1: ph = v.ph[0] + pmod; ph -= Math.floor(ph); o1 = 2 * ph - 1 - polyBlep(ph, dt); break;
        case 2: { ph = v.ph[0] + pmod; ph -= Math.floor(ph); const pw = 0.05 + 0.9 * shape; o1 = ph < pw ? 1 : -1; o1 += polyBlep(ph, dt); let t2 = ph + 1 - pw; if (t2 >= 1) t2 -= 1; o1 -= polyBlep(t2, dt); break; }
        case 3: ph = v.ph[0] + pmod; ph -= Math.floor(ph); o1 = 4 * Math.abs(ph - 0.5) - 1; break;
        case 4: ph = v.ph[0] + pmod; ph -= Math.floor(ph); ph += shape * 0.25 * fsin(ph * 2); ph -= Math.floor(ph); o1 = 4 * Math.abs(ph - 0.5) - 1; break;
        case 5: ph = v.ph[0] + pmod; ph -= Math.floor(ph); o1 = fsin(ph + shape * 1.8 * v.fbz); v.fbz = 0.5 * (o1 + v.fbz); break;
        case 6: { ph = v.ph[0] + pmod; ph -= Math.floor(ph); const ratio = 1 + shape * 7, win = 0.5 - 0.5 * Math.cos(2 * kPif * ph); o1 = fsin(ph * ratio) * win * 1.6; break; }
        case 7: o1 = this.wt ? wtRead(this.wt, Math.max(f1, 1), sr, v.ph[0], shape) : 0; break;
        default: o1 = v.rng.white(); break;
      }
      if (w1 !== 0) { v.ph[0] += dt; if (v.ph[0] >= 1) { v.ph[0] -= Math.floor(v.ph[0]); wrapped = true; } }
      v.wrap = wrapped ? 1 : 0;
      // mix
      let subf = clampf(midiHz(base - 12), 1, sr * 0.45); const st = c.st; if (st === 1) subf *= 0.5; if (st === 3) subf *= 0.5; v.phSub += subf / sr; v.phSub -= Math.floor(v.phSub);
      const sub = (st === 0 || st === 1) ? (v.phSub < 0.5 ? 0.7 : -0.7) : fsin(v.phSub);
      let mixv = o1 * V[E.O1Level] + o2 * V[E.O2Level] + sub * V[E.SubLevel] + v.rng.white() * V[E.NoiseLevel] * 0.5;
      if (m2 === 2) mixv += o1 * o2 * cross * 1.2;
      // filter
      const drive = 1 + V[E.FDrive] * 3; let y;
      if (c.ft === 0) {
        const ly = v.ly, lt = v.lt, g = v.gl, x = fastTanh(mixv * drive - 4 * v.qk * ly[3] * 0.95);
        ly[0] += g * (x - lt[0]); lt[0] = fastTanh(ly[0]); ly[1] += g * (lt[0] - lt[1]); lt[1] = fastTanh(ly[1]); ly[2] += g * (lt[1] - lt[2]); lt[2] = fastTanh(ly[2]); ly[3] += g * (lt[2] - lt[3]); lt[3] = fastTanh(ly[3]);
        if (!isFinite(ly[3])) { ly.fill(0); lt.fill(0); } y = ly[3] * (1 + 0.4 * V[E.FRes]) / (0.5 + 0.5 * drive);
      } else {
        const ic = v.ic, x = fastTanh(mixv * drive), g = v.gl, k = v.qk, a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2, v3 = x - ic[1], v1 = a1 * ic[0] + a2 * v3, v2 = ic[1] + a2 * ic[0] + a3 * v3;
        ic[0] = 2 * v1 - ic[0]; ic[1] = 2 * v2 - ic[1]; if (!isFinite(v2)) { ic[0] = ic[1] = 0; }
        y = c.ft === 1 ? v2 : (c.ft === 2 ? v1 * k : x - k * v1 - v2);
      }
      const amp = clampf(1 + d[DstAmp], 0, 2) * aenv * (0.35 + 0.65 * v.vel) * (1 + v.accent * V[E.SqAccent] * 0.5);
      y *= amp; if (!(Math.abs(y) < 50)) y = 0;
      this.oL += y * v.panL; this.oR += y * v.panR;
      const pk = Math.abs(y); ++v.age; if (!v.gate) { if (pk < 1e-5) { if (++v.quiet > (0.3 * sr | 0)) v.active = false; } else v.quiet = 0; }
    }
    // ---- effects + output
    process(outL, outR, n) {
      const V = this.v, sr = this.sr; this.prepBlock();
      const ft = Math.round(V[E.FxType]), fxAmt = V[E.FxAmount], fxTone = V[E.FxTone], fxMix = V[E.FxMix];
      const chMix = V[E.ChMix], chRate = V[E.ChRate], chDepth = V[E.ChDepth], dlMix = V[E.DlMix], dlFb = V[E.DlFb], dlTone = V[E.DlTone], ping = V[E.DlPing] > 0.5;
      const rvMix = V[E.RvMix], rvFb = 0.7 + 0.28 * V[E.RvSize], rvDm = V[E.RvDamp] * 0.4, vol = V[E.Volume] * 1.4, tempo = Math.max(20, this.tempo());
      const dtab = [1, 0.75, 0.5, 1 / 3, 0.375, 0.25], dlTm = clampf(60 / tempo * dtab[clampf(Math.round(V[E.DlTime]), 0, 5)] * sr, 4, 2 * sr);
      const slSamples = this.stepSeconds() * 0.5 * sr, slPat = 'xx-xxx-xx-xxx-x-', vs = this.voice, fx = this.fx;
      for (let i = 0; i < n; ++i) {
        this.seqClock();
        this.oL = 0; this.oR = 0; for (let k = 0; k < 8; ++k) { const v = vs[k]; if (v.active) this.renderVoice(v); }
        let l = this.oL * 0.5, r = this.oR * 0.5;
        if (ft !== 0) {
          const x0 = l, x1 = r; let w0 = 0, w1 = 0;
          for (let ch = 0; ch < 2; ++ch) {
            const inp = ch ? x1 : x0; let y = inp; const s = fx[ch];
            switch (ft) {
              case 1: y = fastTanh(inp * (1 + fxAmt * 14)) / (0.4 + 0.6 * fastTanh(1 + fxAmt * 3)); s[0] += (y - s[0]) * (0.05 + 0.9 * fxTone); y = s[0]; break;
              case 2: { const dd = 1 + fxAmt * 8; y = fastTanh(inp * dd + 0.15 * fxAmt) - fastTanh(0.15 * fxAmt); y /= (0.5 + 0.5 * dd * 0.3); s[0] += (y - s[0]) * (0.1 + 0.9 * fxTone); y = s[0]; break; }
              case 3: { const steps = Math.pow(2, 2 + (1 - fxAmt) * 12), hold = 1 + Math.floor((1 - fxTone) * 24); if (++this.fxN[ch] >= hold) { this.fxN[ch] = 0; s[1] = Math.round(inp * steps) / steps; } y = s[1]; break; }
              case 4: { if (ch === 0) { this.slPh += 1; if (this.slPh >= slSamples) { this.slPh -= slSamples; this.slIdx = (this.slIdx + 1) & 15; } } const tgt = slPat[this.slIdx] === 'x' ? 1 : 1 - fxAmt; s[0] += (tgt - s[0]) * 0.01; y = inp * s[0]; break; }
              case 5: { if (ch === 0) this.fxPh += (0.1 + fxTone * 3) / sr; this.fxPh -= Math.floor(this.fxPh); const f = 300 * Math.pow(12, 0.5 + 0.5 * fxAmt * fsin(this.fxPh)), t = Math.tan(kPif * Math.min(f, sr * 0.4) / sr), a = (t - 1) / (t + 1);
                let u = inp + s[5] * 0.5; for (let k = 0; k < 4; ++k) { const o = a * u + s[1 + k]; s[1 + k] = u - a * o; u = o; } if (!isFinite(u)) { s.fill(0); u = 0; } s[5] = u; y = 0.5 * (inp + u); break; }
              case 6: { if (ch === 0) this.fxPh += (0.05 + fxTone * 1.5) / sr; this.fxPh -= Math.floor(this.fxPh); const dl = (0.0035 + 0.003 * fsin(this.fxPh + ch * 0.25)) * sr, w = this.fl[ch].read(Math.max(2, dl)); this.fl[ch].push(inp + w * fxAmt * 0.8); y = 0.5 * (inp + w); break; }
              default: { if (ch === 0) this.rmPh += (20 + fxTone * fxTone * 2000) / sr; this.rmPh -= Math.floor(this.rmPh); y = inp * (1 - fxAmt) + inp * fsin(this.rmPh) * fxAmt; break; }
            }
            const wv = inp + (y - inp) * fxMix; if (ch) w1 = wv; else w0 = wv;
          }
          l = w0; r = w1;
        }
        if (chMix > 0.001) {
          this.chPh += chRate / sr; this.chPh -= Math.floor(this.chPh); const dp = chDepth * 0.004 * sr, bs = 0.012 * sr;
          this.cho[0].push(l); this.cho[1].push(r); const wl = this.cho[0].read(Math.max(2, bs + dp * fsin(this.chPh))), wr = this.cho[1].read(Math.max(2, bs + dp * fsin(this.chPh + 0.5)));
          l = l * (1 - chMix * 0.5) + wl * chMix * 0.7; r = r * (1 - chMix * 0.5) + wr * chMix * 0.7;
        }
        if (dlMix > 0.001) {
          const wl = this.dly[0].read(dlTm), wr = this.dly[1].read(dlTm), dz = this.dlz, tk = 0.05 + 0.95 * dlTone; dz[0] += (wl - dz[0]) * tk; dz[1] += (wr - dz[1]) * tk;
          this.dly[0].push(clampf(l * 0.7 + (ping ? dz[1] : dz[0]) * dlFb, -4, 4)); this.dly[1].push(clampf(r * 0.7 + (ping ? dz[0] : dz[1]) * dlFb, -4, 4));
          l += dz[0] * dlMix; r += dz[1] * dlMix;
        }
        if (rvMix > 0.001) { const x = (l + r) * 0.015, wl = this.rev.tick(0, x, rvFb, rvDm), wr = this.rev.tick(1, x, rvFb, rvDm); l = l * (1 - rvMix * 0.4) + wl * 3 * rvMix; r = r * (1 - rvMix * 0.4) + wr * 3 * rvMix; }
        l = fastTanh(l * vol); r = fastTanh(r * vol);
        if (!isFinite(l + r)) { l = r = 0; }
        outL[i] = l; outR[i] = r;
      }
    }
    // ---- presets
    loadPreset(pi, notify) {
      pi = clampf(pi, 0, presetNames.length - 1); const V = this.v, old = Float64Array.from(V);
      for (let k = 0; k < E.Count; ++k) if (k !== E.Preset && k !== E.Volume && k !== E.Tempo) V[k] = specs[k].def;
      V[E.Preset] = pi;
      const Pn = (n, x) => { const id = nameToId[n]; if (id !== undefined) V[id] = x; };
      const St = (n, note, gate, flags = 0, prob = 100, ratchet = 1, m1 = 0.5, m2 = 0.5, m3 = 0.5) => { const b = E.StepBase + n * kF; V[b + SNote] = note; V[b + SGate] = gate; V[b + SFlags] = flags; V[b + SProb] = prob; V[b + SRatchet] = ratchet; V[b + SM1] = m1; V[b + SM2] = m2; V[b + SM3] = m3; };
      const A = (...kv) => { for (let i = 0; i < kv.length; i += 2) Pn(kv[i], kv[i + 1]); };
      switch (pi) {
        case 1: A('Osc 1 Detune', 0.62, 'Osc 1 Super mix', 0.75, 'Cutoff', 6500, 'Resonance', 0.15, 'Filter env amount', 0.25, 'Amp release', 0.35, 'Glide', 0.08, 'Play mode', 2, 'Chorus mix', 0.45, 'Delay mix', 0.28, 'Reverb mix', 0.25,
          'Patch 1 Source', SrcLfo1, 'Patch 1 Destination', DstPitch, 'Patch 1 Amount', 0.012, 'LFO 1 Fade in', 0.6, 'LFO 1 Rate', 5.5); break;
        case 2: A('Osc 1 Detune', 0.55, 'Osc 1 Super mix', 0.6, 'Filter type', 1, 'Cutoff', 1800, 'Resonance', 0.2, 'Filter env amount', 0.3, 'Amp attack', 1.2, 'Amp release', 2.6, 'Filter attack', 1.4, 'Filter decay', 2.0, 'Filter sustain', 0.5,
          'Patch 1 Source', SrcLfo1, 'Patch 1 Destination', DstCut, 'Patch 1 Amount', 0.3, 'LFO 1 Shape', 1, 'LFO 1 Rate', 0.18, 'Patch 2 Source', SrcLfo2, 'Patch 2 Destination', DstPan, 'Patch 2 Amount', 0.5, 'LFO 2 Rate', 0.3,
          'Chorus mix', 0.6, 'Chorus rate', 0.3, 'Reverb size', 0.9, 'Reverb mix', 0.45, 'Delay mix', 0.15); break;
        case 3: A('Play mode', 1, 'Glide', 0.12, 'Osc 1 Wave', 5, 'Osc 1 Shape', 0.55, 'Osc 1 Octave', -1, 'Sub level', 0.6, 'Sub type', 2, 'Cutoff', 750, 'Resonance', 0.35, 'Filter env amount', 0.5, 'Filter decay', 0.35, 'Filter sustain', 0.2,
          'Amp sustain', 0.9, 'Amp release', 0.2, 'Insert type', 1, 'Insert amount', 0.3, 'Insert tone', 0.6, 'Chorus mix', 0.1, 'Delay mix', 0.1, 'Reverb mix', 0.1); break;
        case 4: A('Sequencer mode', 2, 'Sequencer rate', 2, 'Gate length', 0.55, 'Osc 1 Wave', 6, 'Osc 1 Shape', 0.35, 'Osc 2 Wave', 1, 'Osc 2 Mode', 1, 'Osc 2 Semitones', 7, 'Osc 2 Level', 0.35, 'Filter type', 1, 'Cutoff', 2600, 'Resonance', 0.3,
          'Amp decay', 0.14, 'Amp sustain', 0.35, 'Amp release', 0.16, 'Filter env amount', 0.3, 'Motion 1 Destination', DstCut, 'Motion 1 Depth', 0.6, 'Motion 2 Destination', DstShape, 'Motion 2 Depth', 0.5,
          'Delay mix', 0.3, 'Delay time', 2, 'Reverb mix', 0.2);
          { const nt = [0, 0, 12, 0, 7, 0, 10, 0, 0, 3, 0, 12, 7, 5, 0, -5]; for (let n = 0; n < 16; ++n) St(n, nt[n], (n === 1 || n === 6 || n === 13) ? 0 : 1, n % 4 === 0 ? 1 : 0, 100, 1, 0.5 + 0.45 * Math.sin(n * 0.7), 0.5 + 0.4 * Math.cos(n * 0.5), 0.5); } break;
        case 5: A('Sequencer mode', 2, 'Sequencer rate', 2, 'Gate length', 0.5, 'Osc 1 Wave', 1, 'Cutoff', 420, 'Resonance', 0.72, 'Filter env amount', 0.85, 'Filter decay', 0.22, 'Filter sustain', 0, 'Filter release', 0.1,
          'Amp decay', 0.25, 'Amp sustain', 0.55, 'Amp release', 0.08, 'Slide time', 0.35, 'Accent amount', 0.85, 'Insert type', 1, 'Insert amount', 0.3, 'Delay mix', 0.3, 'Delay time', 1, 'Reverb mix', 0.1, 'Drive', 0.4);
          { const nt = [0, 0, 12, 0, 0, 10, 0, 7, 0, 0, 12, 0, 3, 0, 5, 7], gt = [1, 1, 1, 0, 1, 1, 0, 1, 1, 2, 1, 0, 1, 1, 1, 2], fl = [1, 0, 2, 0, 0, 1, 0, 2, 1, 0, 2, 0, 0, 0, 1, 2];
            for (let n = 0; n < 16; ++n) St(n, nt[n], gt[n], fl[n], 100, 1, 0.5, 0.5, 0.5); } break;
        case 6: A('Sequencer mode', 1, 'Arp direction', 2, 'Arp octaves', 3, 'Chord memory', 7, 'Rhythm style', 3, 'Sequencer rate', 2, 'Gate length', 0.45, 'Osc 1 Detune', 0.35, 'Osc 1 Super mix', 0.6, 'Cutoff', 3500, 'Filter env amount', 0.5,
          'Filter decay', 0.2, 'Filter sustain', 0.1, 'Amp decay', 0.2, 'Amp sustain', 0.4, 'Amp release', 0.25, 'Delay time', 1, 'Delay mix', 0.38, 'Reverb mix', 0.3, 'Chorus mix', 0.3); break;
        case 7: A('Play mode', 1, 'Osc 1 Wave', 1, 'Osc 1 Level', 0.55, 'Osc 1 Octave', -1, 'Sub level', 0.85, 'Sub type', 2, 'Filter type', 1, 'Cutoff', 520, 'Resonance', 0.18, 'Filter env amount', 0.4, 'Filter decay', 0.3, 'Filter sustain', 0.4,
          'Amp sustain', 0.9, 'Amp release', 0.15, 'Insert type', 2, 'Insert amount', 0.3, 'Chorus mix', 0, 'Delay mix', 0, 'Reverb mix', 0.05); break;
        case 8: A('Osc 1 Wave', 2, 'Osc 1 Shape', 0.3, 'Osc 2 Level', 0.35, 'Osc 2 Wave', 1, 'Osc 2 Octave', 1, 'Cutoff', 1400, 'Resonance', 0.3, 'Filter env amount', 0.7, 'Filter decay', 0.3, 'Filter sustain', 0,
          'Amp decay', 0.38, 'Amp sustain', 0, 'Amp release', 0.3, 'Patch 1 Source', SrcLfo2, 'Patch 1 Destination', DstShape, 'Patch 1 Amount', 0.4, 'LFO 2 Rate', 0.6,
          'Delay time', 1, 'Delay feedback', 0.55, 'Delay mix', 0.4, 'Delay ping-pong', 1, 'Reverb mix', 0.3); break;
        case 9: A('Osc 1 Wave', 6, 'Osc 1 Shape', 0.5, 'Osc 2 Level', 0.35, 'Filter type', 1, 'Cutoff', 3200, 'Filter env amount', 0.1, 'Amp attack', 1.3, 'Amp release', 2.6, 'Patch 1 Source', SrcLfo2, 'Patch 1 Destination', DstShape, 'Patch 1 Amount', 0.45, 'LFO 2 Shape', 5, 'LFO 2 Rate', 0.4,
          'Patch 2 Source', SrcLfo1, 'Patch 2 Destination', DstPitch, 'Patch 2 Amount', 0.02, 'LFO 1 Fade in', 1.5, 'LFO 1 Rate', 5, 'Chorus mix', 0.6, 'Reverb size', 0.9, 'Reverb mix', 0.55, 'Delay mix', 0.12); break;
        case 10: A('Sequencer mode', 1, 'Arp direction', 0, 'Arp octaves', 2, 'Chord memory', 10, 'Rhythm style', 5, 'Sequencer rate', 2, 'Osc 1 Wave', 3, 'Osc 2 Wave', 3, 'Osc 2 Semitones', 7, 'Osc 2 Fine', 0.3, 'Osc 2 Mode', 2, 'Osc 2 Ring / FM amount', 0.85,
          'Osc 2 Level', 0.1, 'Cutoff', 5500, 'Amp decay', 0.18, 'Amp sustain', 0.2, 'Amp release', 0.2, 'Insert type', 5, 'Insert amount', 0.6, 'Insert mix', 0.7, 'Delay time', 2, 'Delay mix', 0.3, 'Reverb mix', 0.25); break;
        case 11: A('Sequencer mode', 3, 'Arp direction', 0, 'Arp octaves', 2, 'Chord memory', 2, 'Sequencer rate', 2, 'Gate length', 0.5, 'Osc 1 Wave', 1, 'Osc 2 Wave', 0, 'Osc 2 Mode', 1, 'Osc 2 Semitones', 7, 'Osc 2 Level', 0.5,
          'Cutoff', 1800, 'Resonance', 0.4, 'Filter env amount', 0.4, 'Filter decay', 0.2, 'Amp decay', 0.18, 'Amp sustain', 0.4, 'Motion 1 Destination', DstPitch2, 'Motion 1 Depth', 0.8, 'Motion 2 Destination', DstCut, 'Motion 2 Depth', 0.6,
          'Delay mix', 0.3, 'Delay time', 1, 'Reverb mix', 0.2);
          { const gt = [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1], rt = [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 3, 1, 2, 1, 1], on = [0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 12, 0, 0, 7, 0, 0];
            for (let n = 0; n < 16; ++n) St(n, on[n], gt[n], n % 4 === 0 ? 1 : 0, n === 9 ? 60 : 100, rt[n], 0.5 + 0.5 * Math.sin(n * 0.4), 0.5 + 0.45 * Math.sin(n * 0.9 + 1.0), 0.5); } break;
        default: break;
      }
      if (notify) for (let k = 0; k < E.Count; ++k) if (k !== E.Preset && Math.abs(V[k] - old[k]) > 1e-6) this.writeParam(k, V[k]);
      this.play = []; this.phys = []; this.held = []; this.arpDirty = true; this.stopSeq(); this.ensureTable();
    }
  }
  const SSOFF = [-0.11002313, -0.06288439, -0.01952356, 0, 0.01991221, 0.06216538, 0.10745242];
  OCC.engines.galactica = { name: 'Galactica', blurb: 'Space-age polysynth: JP-8000 Super Saw, SH-32 arpeggiator with chord memory, MS-2000 virtual patch bay and motion lanes, plus a 16-step sequencer. The arp/sequencer has its own Tempo parameter and runs while keys are held (or latched); Arp = rhythm patterns over held notes, Step = 16-step pattern playing the last key, Arp x Step = arp notes with step rhythm.', specs, groups, make: sr => new Galactica(sr), E };
})();
/* Avoidica - patchable modular-ensemble synth: 41 modules, text patch format, 16 macro knobs, 12 factory patches. Port of plugins/avoidica/avoidica.h + factory.h */
(function () {
  const kModNames = ['Note', 'Voices', 'Osc', 'FmOp', 'Noise', 'WaveT', 'Pluck', 'Grain', 'Svf', 'Ladder', 'Formant', 'Comb', 'Allpass', 'Shaper', 'Rectify', 'Mult', 'Atten', 'Mix4', 'Xfade', 'Pan', 'Math',
    'Compare', 'Logic', 'SampleHold', 'Slew', 'Quant', 'Const', 'ADSR', 'AR', 'LFO', 'Clock', 'ClockDiv', 'Seq', 'Random', 'EnvFollow', 'Delay', 'Reverb', 'Chorus', 'Phaser', 'VoiceOut', 'Master'];
  const M = {}; kModNames.forEach((n, i) => M[n] = i);
  const N_Note = 0, N_Voices = 1, N_Osc = 2, N_FmOp = 3, N_Noise = 4, N_WaveT = 5, N_Pluck = 6, N_Grain = 7, N_Svf = 8, N_Ladder = 9, N_Formant = 10, N_Comb = 11, N_Allpass = 12, N_Shaper = 13, N_Rectify = 14, N_Mult = 15, N_Atten = 16, N_Mix4 = 17, N_Xfade = 18, N_Pan = 19, N_Math = 20, N_Compare = 21, N_Logic = 22, N_SampleHold = 23, N_Slew = 24, N_Quant = 25, N_Const = 26, N_ADSR = 27, N_AR = 28, N_LFO = 29, N_Clock = 30, N_ClockDiv = 31, N_Seq = 32, N_Random = 33, N_EnvFollow = 34, N_Delay = 35, N_Reverb = 36, N_Chorus = 37, N_Phaser = 38, N_VoiceOut = 39, N_Master = 40;
  const kMaxIn = 4, kMaxOut = 8, kMaxP = 12, kVoices = 16, kKnobs = 16;
  const pd = (name, def, lo, hi) => ({ name, def, lo, hi });
  // module definitions: [name, section (0 voice, 1 master, 2 either), inputs, input defaults, outputs, params]
  const D = [
    ['Note', 0, [], [], ['pitch', 'gate', 'vel', 'key', 'mod', 'press', 'raw'], []],
    ['Voices', 1, [], [], ['l', 'r'], []],
    ['Osc', 2, ['pitch', 'fm', 'pw', 'sync'], [60, 0, 0, 0], ['out'], [pd('wave', 0, 0, 3), pd('coarse', 0, -48, 48), pd('fine', 0, -1, 1), pd('pw', 0.5, 0.02, 0.98), pd('level', 1, 0, 2)]],
    ['FmOp', 2, ['pitch', 'mod', 'idx'], [60, 0, 1], ['out'], [pd('ratio', 1, 0.125, 16), pd('index', 0, 0, 12), pd('fb', 0, 0, 1), pd('level', 1, 0, 2)]],
    ['Noise', 2, [], [], ['out'], [pd('type', 0, 0, 3), pd('level', 1, 0, 2)]],
    ['WaveT', 2, ['pitch', 'pos'], [60, 0], ['out'], [pd('table', 0, 0, 11), pd('pos', 0.3, 0, 1), pd('level', 1, 0, 2)]],
    ['Pluck', 2, ['excite', 'pitch'], [0, 60], ['out'], [pd('decay', 2, 0.1, 20), pd('damp', 0.5, 0, 1), pd('level', 1, 0, 2)]],
    ['Grain', 2, ['in', 'pos', 'shift'], [0, 0, 0], ['out'], [pd('size', 80, 10, 500), pd('density', 20, 1, 80), pd('spread', 0.3, 0, 1), pd('pitch', 0, -24, 24), pd('freeze', 0, 0, 1), pd('level', 1, 0, 2)]],
    ['Svf', 2, ['in', 'cut', 'res'], [0, 0, 0], ['lp', 'bp', 'hp', 'notch'], [pd('cut', 1000, 20, 20000), pd('res', 0.2, 0, 1)]],
    ['Ladder', 2, ['in', 'cut', 'res'], [0, 0, 0], ['out'], [pd('cut', 1500, 20, 20000), pd('res', 0.2, 0, 1), pd('drive', 1, 0.2, 8)]],
    ['Formant', 2, ['in', 'mod'], [0, 0], ['out'], [pd('vowel', 0, 0, 4), pd('q', 8, 2, 24), pd('level', 1, 0, 3)]],
    ['Comb', 2, ['in', 'mod'], [0, 0], ['out'], [pd('freq', 200, 20, 5000), pd('fb', 0.7, -0.99, 0.99), pd('damp', 0.3, 0, 1)]],
    ['Allpass', 2, ['in', 'mod'], [0, 0], ['out'], [pd('freq', 800, 20, 12000)]],
    ['Shaper', 2, ['in', 'drive'], [0, 0], ['out'], [pd('type', 0, 0, 4), pd('drive', 2, 0.1, 20), pd('level', 1, 0, 2)]],
    ['Rectify', 2, ['in'], [0], ['out'], [pd('mode', 0, 0, 2)]],
    ['Mult', 2, ['a', 'b'], [1, 1], ['out'], []],
    ['Atten', 2, ['in', 'amt'], [0, 1], ['out'], [pd('scale', 1, -64, 64), pd('offset', 0, -64, 64)]],
    ['Mix4', 2, ['a', 'b', 'c', 'd'], [0, 0, 0, 0], ['out'], [pd('la', 1, 0, 2), pd('lb', 1, 0, 2), pd('lc', 1, 0, 2), pd('ld', 1, 0, 2)]],
    ['Xfade', 2, ['a', 'b', 'x'], [0, 0, 0], ['out'], [pd('mix', 0.5, 0, 1)]],
    ['Pan', 2, ['in', 'pos'], [0, 0], ['l', 'r'], [pd('pan', 0, -1, 1)]],
    ['Math', 2, ['a', 'b'], [0, 0], ['out'], [pd('op', 0, 0, 7), pd('k', 0, -100, 100)]],
    ['Compare', 2, ['a', 'b'], [0, 0], ['out'], [pd('thr', 0.5, -1, 1)]],
    ['Logic', 2, ['a', 'b'], [0, 0], ['out'], [pd('op', 0, 0, 3)]],
    ['SampleHold', 2, ['in', 'trig'], [0, 0], ['out'], []],
    ['Slew', 2, ['in'], [0], ['out'], [pd('up', 50, 0.1, 5000), pd('down', 50, 0.1, 5000)]],
    ['Quant', 2, ['in'], [0], ['out'], [pd('scale', 1, 0, 7), pd('root', 0, 0, 11)]],
    ['Const', 2, [], [], ['out'], [pd('value', 0, -100, 100)]],
    ['ADSR', 2, ['gate'], [0], ['out'], [pd('a', 0.01, 0.001, 10), pd('d', 0.2, 0.001, 10), pd('s', 0.7, 0, 1), pd('r', 0.3, 0.001, 10)]],
    ['AR', 2, ['trig'], [0], ['out'], [pd('a', 0.002, 0.0005, 5), pd('r', 0.3, 0.002, 10)]],
    ['LFO', 2, ['rate', 'reset'], [0, 0], ['out'], [pd('shape', 0, 0, 5), pd('rate', 2, 0.01, 50), pd('phase', 0, 0, 1), pd('bipolar', 1, 0, 1), pd('level', 1, 0, 2)]],
    ['Clock', 2, ['reset'], [0], ['out'], [pd('bpm', 120, 20, 300), pd('div', 2, 0, 4), pd('sync', 0, 0, 1)]],
    ['ClockDiv', 2, ['clk', 'reset'], [0, 0], ['out'], [pd('div', 2, 1, 16)]],
    ['Seq', 2, ['clk', 'reset'], [0, 0], ['out', 'gate'], [pd('s1', 0, -24, 24), pd('s2', 0, -24, 24), pd('s3', 0, -24, 24), pd('s4', 0, -24, 24), pd('s5', 0, -24, 24), pd('s6', 0, -24, 24), pd('s7', 0, -24, 24), pd('s8', 0, -24, 24),
      pd('len', 8, 1, 8), pd('gate', 0.6, 0.05, 1), pd('glide', 0, 0, 1)]],
    ['Random', 2, ['trig'], [0], ['out'], [pd('range', 1, 0, 24), pd('smooth', 0, 0, 500)]],
    ['EnvFollow', 2, ['in'], [0], ['out'], [pd('attack', 5, 0.1, 500), pd('release', 100, 1, 2000)]],
    ['Delay', 2, ['in', 'mod'], [0, 0], ['out'], [pd('time', 350, 1, 2000), pd('fb', 0.4, 0, 0.95), pd('tone', 0.6, 0, 1), pd('mix', 0.3, 0, 1)]],
    ['Reverb', 1, ['l', 'r'], [0, 0], ['l', 'r'], [pd('size', 0.6, 0, 1), pd('damp', 0.5, 0, 1), pd('mix', 0.25, 0, 1)]],
    ['Chorus', 2, ['in'], [0], ['out'], [pd('rate', 0.4, 0.05, 8), pd('depth', 3, 0.1, 10), pd('mix', 0.5, 0, 1)]],
    ['Phaser', 2, ['in'], [0], ['out'], [pd('rate', 0.3, 0.02, 8), pd('depth', 0.8, 0, 1), pd('fb', 0.4, 0, 0.9), pd('mix', 0.5, 0, 1)]],
    ['VoiceOut', 0, ['l', 'r'], [0, 0], [], [pd('level', 0.5, 0, 2), pd('pan', 0, -1, 1)]],
    ['Master', 1, ['l', 'r'], [0, 0], [], [pd('level', 1, 0, 2)]],
  ].map(a => ({ name: a[0], section: a[1], ins: a[2], indef: a[3], outs: a[4], ps: a[5] }));
  const typeByName = n => { for (let i = 0; i < D.length; ++i) if (D[i].name === n) return i; return -1; };
  const paramOf = (d, n) => { for (let i = 0; i < d.ps.length; ++i) if (d.ps[i].name === n) return i; return -1; };

  // ---- patch parser (the same text format as the plugin)
  function parsePatch(text) {
    const R = { ok: false, errors: [], patch: { name: '', sec: [{ nodes: [], order: [], nOut: 0 }, { nodes: [], order: [], nOut: 0 }], knob: [] } }, Pa = R.patch;
    for (let k = 0; k < kKnobs; ++k) Pa.knob.push({ used: false, label: '', sec: 0, node: 0, param: 0, lo: 0, hi: 1, exp: false, pos: 0.5 });
    let cur = 0; const ids = new Map(), wires = [], inLines = [], knobLines = [], err = (ln, m) => R.errors.push('line ' + ln + ': ' + m);
    const lines = text.split('\n');
    for (let li = 0; li < lines.length; ++li) {
      const ln = li + 1; let line = lines[li]; const h = line.indexOf('#'); if (h >= 0) line = line.slice(0, h);
      const t = line.split(/\s+/).filter(x => x.length); if (!t.length) continue;
      if (t[0] === 'name') Pa.name = line.slice(line.indexOf('name') + 4).trim();
      else if (t[0] === 'voice') cur = 0; else if (t[0] === 'master') cur = 1;
      else if (t[0] === 'node') {
        if (t.length < 3) { err(ln, 'node needs an id and a type'); continue; }
        const ty = typeByName(t[2]); if (ty < 0) { err(ln, 'unknown module ' + t[2]); continue; }
        const d = D[ty]; if (d.section !== 2 && d.section !== cur) { err(ln, d.name + ' belongs to the other half'); continue; }
        if (ids.has(t[1])) { err(ln, 'duplicate id ' + t[1]); continue; }
        const n = { type: ty, id: t[1], p: new Float64Array(kMaxP), inDef: new Float64Array(kMaxIn), src: [[], [], [], []], outBase: 0 };
        d.ps.forEach((p, i) => n.p[i] = p.def); d.indef.forEach((x, i) => n.inDef[i] = x);
        for (let k = 3; k < t.length; ++k) { const eq = t[k].indexOf('='); if (eq < 0) { err(ln, 'expected name=value'); continue; }
          const pi = paramOf(d, t[k].slice(0, eq)); if (pi < 0) { err(ln, 'no parameter ' + t[k].slice(0, eq)); continue; }
          n.p[pi] = clampf(parseFloat(t[k].slice(eq + 1)) || 0, d.ps[pi].lo, d.ps[pi].hi); }
        ids.set(t[1], [cur, Pa.sec[cur].nodes.length]); Pa.sec[cur].nodes.push(n);
      }
      else if (t[0] === 'wire') { if (t.length !== 3) err(ln, 'wire needs a source and a destination'); else wires.push([ln, t[1], t[2]]); }
      else if (t[0] === 'in') { if (t.length !== 3) err(ln, 'in needs a target and a value'); else inLines.push([ln, t[1], t[2]]); }
      else if (t[0] === 'knob') knobLines.push([ln, t]);
      else err(ln, 'unknown word ' + t[0]);
    }
    const split = s => { const d = s.indexOf('.'); return d < 0 ? null : [s.slice(0, d), s.slice(d + 1)]; };
    for (const w of wires) {
      const a = split(w[1]), b = split(w[2]); if (!a || !b) { err(w[0], 'wire ends look like node.port'); continue; }
      const ia = ids.get(a[0]), ib = ids.get(b[0]); if (!ia || !ib) { err(w[0], 'wire mentions an unknown node'); continue; }
      if (ia[0] !== ib[0]) { err(w[0], 'wires cannot cross halves'); continue; }
      const na = Pa.sec[ia[0]].nodes[ia[1]], nb = Pa.sec[ib[0]].nodes[ib[1]], o = D[na.type].outs.indexOf(a[1]), i = D[nb.type].ins.indexOf(b[1]);
      if (o < 0) { err(w[0], 'no output ' + a[1]); continue; } if (i < 0) { err(w[0], 'no input ' + b[1]); continue; }
      nb.src[i].push(-(ia[1] * kMaxOut + o) - 1);
    }
    for (let s = 0; s < 2; ++s) {
      const Sx = Pa.sec[s]; let base = 0; for (const n of Sx.nodes) { n.outBase = base; base += kMaxOut; } Sx.nOut = base;
      for (const n of Sx.nodes) for (let i = 0; i < kMaxIn; ++i) n.src[i] = n.src[i].map(v => { const k = -v - 1; return Sx.nodes[Math.floor(k / kMaxOut)].outBase + k % kMaxOut; });
      const mark = new Uint8Array(Sx.nodes.length), ord = [];
      const go = i => { if (mark[i]) return; mark[i] = 1; for (let k = 0; k < kMaxIn; ++k) for (const v of Sx.nodes[i].src[k]) go(Math.floor(v / kMaxOut)); ord.push(i); };
      for (let i = 0; i < Sx.nodes.length; ++i) go(i); Sx.order = ord;
    }
    for (const l of inLines) {
      const a = split(l[1]); if (!a || !ids.has(a[0])) { err(l[0], 'in needs node.input'); continue; }
      const id = ids.get(a[0]), n = Pa.sec[id[0]].nodes[id[1]], i = D[n.type].ins.indexOf(a[1]); if (i < 0) { err(l[0], 'no input ' + a[1]); continue; } n.inDef[i] = parseFloat(l[2]) || 0;
    }
    for (const kl of knobLines) {
      const t = kl[1], ln = kl[0]; if (t.length < 7) { err(ln, 'knob needs: N Label node.param lo hi lin|exp'); continue; }
      const k = parseInt(t[1], 10) - 1; if (!(k >= 0 && k < 16)) { err(ln, 'knob number is 1..16'); continue; }
      const a = split(t[3]); if (!a || !ids.has(a[0])) { err(ln, 'knob target needs node.param'); continue; }
      const id = ids.get(a[0]), n = Pa.sec[id[0]].nodes[id[1]], pi = paramOf(D[n.type], a[1]); if (pi < 0) { err(ln, 'no parameter ' + a[1]); continue; }
      const km = Pa.knob[k]; km.used = true; km.label = t[2].replace(/_/g, ' '); km.sec = id[0]; km.node = id[1]; km.param = pi;
      km.lo = parseFloat(t[4]); km.hi = parseFloat(t[5]); km.exp = t[6] === 'exp'; if (km.exp && (km.lo <= 0 || km.hi <= 0)) { km.exp = false; err(ln, 'exp knobs need positive limits'); }
      const v = clampf(n.p[pi], Math.min(km.lo, km.hi), Math.max(km.lo, km.hi));
      km.pos = km.hi === km.lo ? 0 : clampf(km.exp ? Math.log(v / km.lo) / Math.log(km.hi / km.lo) : (v - km.lo) / (km.hi - km.lo), 0, 1);
    }
    const hasOut = Pa.sec[0].nodes.some(n => n.type === M.VoiceOut), hasMaster = Pa.sec[1].nodes.some(n => n.type === M.Master);
    if (!hasOut) R.errors.push('the voice half needs a VoiceOut'); if (!hasMaster) R.errors.push('the master half needs a Master');
    R.ok = R.errors.length === 0; return R;
  }

  const PATCHES = [
`name Init saw
voice
node n Note
node o Osc wave=0 level=0.7
node f Ladder cut=2400 res=0.15
node e ADSR a=0.005 d=0.3 s=0.7 r=0.25
node v Mult
node out VoiceOut
wire n.pitch o.pitch
wire o.out f.in
wire f.out v.a
wire e.out v.b
wire n.gate e.gate
wire v.out out.l
master
node vs Voices
node m Master
wire vs.l m.l
wire vs.r m.r
knob 1 Cutoff f.cut 40 12000 exp
knob 2 Resonance f.res 0 1 lin
knob 3 Attack e.a 0.001 3 exp
knob 4 Release e.r 0.02 4 exp
knob 5 Wave o.wave 0 3 lin
`,
`name Two-oscillator brass
voice
node n Note
node o1 Osc wave=0 level=0.6
node o2 Osc wave=0 fine=0.14 coarse=-12 level=0.6
node mx Mix4
node f Ladder cut=500 res=0.25 drive=1.4
node e1 ADSR a=0.06 d=0.4 s=0.8 r=0.3
node e2 ADSR a=0.12 d=0.5 s=0.35 r=0.4
node sw Atten scale=40
node v Mult
node out VoiceOut
wire n.pitch o1.pitch
wire n.pitch o2.pitch
wire o1.out mx.a
wire o2.out mx.b
wire mx.out f.in
wire n.gate e1.gate
wire n.gate e2.gate
wire e2.out sw.in
wire sw.out f.cut
wire f.out v.a
wire e1.out v.b
wire v.out out.l
master
node vs Voices
node ch Chorus rate=0.35 depth=4 mix=0.4
node m Master
wire vs.l ch.in
wire ch.out m.l
wire ch.out m.r
knob 1 Cutoff f.cut 80 4000 exp
knob 2 Resonance f.res 0 0.9 lin
knob 3 Swell e2.a 0.01 2 exp
knob 4 Detune o2.fine 0 0.5 lin
knob 5 Chorus ch.mix 0 1 lin
`,
`name Glass bells
voice
node n Note
node md FmOp ratio=3.5 index=3 level=1
node c FmOp ratio=1 index=1 level=0.8
node im AR a=0.001 r=1.2
node ia Atten scale=1
node am ADSR a=0.001 d=3 s=0 r=1.5
node v Mult
node out VoiceOut
wire n.pitch md.pitch
wire n.pitch c.pitch
wire n.gate im.trig
wire im.out c.idx
wire md.out c.mod
wire n.gate am.gate
wire c.out v.a
wire am.out v.b
wire v.out out.l
master
node vs Voices
node dl Delay time=420 fb=0.35 tone=0.5 mix=0.25
node rv Reverb size=0.8 damp=0.4 mix=0.3
node m Master
wire vs.l dl.in
wire dl.out rv.l
wire rv.l m.l
wire rv.r m.r
knob 1 Brightness md.index 0 8 lin
knob 2 Shimmer im.r 0.1 5 exp
knob 3 Ratio md.ratio 0.5 8 lin
knob 4 Echo dl.mix 0 0.8 lin
knob 5 Space rv.mix 0 0.8 lin
`,
`name Pluck machine
voice
node n Note
node nz Noise type=0 level=0.8
node bur AR a=0.0005 r=0.012
node ex Mult
node p Pluck decay=3 damp=0.5 level=4
node f Svf cut=5000 res=0.1
node out VoiceOut
wire n.gate bur.trig
wire nz.out ex.a
wire bur.out ex.b
wire ex.out p.excite
wire n.pitch p.pitch
wire p.out f.in
wire f.lp out.l
master
node vs Voices
node dl Delay time=330 fb=0.4 tone=0.55 mix=0.28
node rv Reverb size=0.7 damp=0.5 mix=0.2
node m Master
wire vs.l dl.in
wire dl.out rv.l
wire rv.l m.l
wire rv.r m.r
knob 1 Decay p.decay 0.3 12 exp
knob 2 Damping p.damp 0 1 lin
knob 3 Tone f.cut 500 12000 exp
knob 4 Echo dl.mix 0 0.8 lin
knob 5 Space rv.mix 0 0.8 lin
`,
`name Cloud nine
voice
node n Note
node o1 Osc wave=0 level=0.5
node o2 Osc wave=1 pw=0.4 fine=0.1 level=0.4
node mx Mix4
node gr Grain size=120 density=28 spread=0.4 pitch=0 level=1.2
node lf LFO shape=5 rate=0.4 bipolar=1 level=1
node e ADSR a=0.5 d=1 s=0.8 r=1.5
node v Mult
node out VoiceOut
wire n.pitch o1.pitch
wire n.pitch o2.pitch
wire o1.out mx.a
wire o2.out mx.b
wire mx.out gr.in
wire lf.out gr.pos
wire gr.out v.a
wire n.gate e.gate
wire e.out v.b
wire v.out out.l
master
node vs Voices
node rv Reverb size=0.9 damp=0.35 mix=0.45
node m Master
wire vs.l rv.l
wire vs.r rv.r
wire rv.l m.l
wire rv.r m.r
knob 1 Grain_size gr.size 15 500 exp
knob 2 Density gr.density 1 80 exp
knob 3 Spread gr.spread 0 1 lin
knob 4 Shift gr.pitch -12 12 lin
knob 5 Freeze gr.freeze 0 1 lin
knob 6 Space rv.mix 0 0.9 lin
`,
`name Step machine
voice
node n Note
node ck Clock bpm=124 div=2
node sq Seq s1=0 s2=12 s3=7 s4=3 s5=0 s6=10 s7=7 s8=5 len=8 gate=0.5
node tr Math op=0 k=-60
node q Quant scale=3 root=0
node o Osc wave=0 level=0.7
node ar AR a=0.001 r=0.16
node sw Atten scale=36
node f Ladder cut=300 res=0.35 drive=1.5
node e Mult
node out VoiceOut
wire n.gate ck.reset
wire n.gate sq.reset
wire ck.out sq.clk
wire sq.out tr.a
wire n.raw tr.b
wire tr.out q.in
wire q.out o.pitch
wire ck.out ar.trig
wire ar.out sw.in
wire sw.out f.cut
wire o.out f.in
wire f.out e.a
wire n.gate e.b
wire e.out out.l
master
node vs Voices
node dl Delay time=360 fb=0.45 tone=0.5 mix=0.3
node m Master
wire vs.l dl.in
wire dl.out m.l
wire dl.out m.r
knob 1 Tempo ck.bpm 60 200 lin
knob 2 Cutoff f.cut 80 3000 exp
knob 3 Resonance f.res 0 0.95 lin
knob 4 Decay ar.r 0.03 0.6 exp
knob 5 Gate sq.gate 0.1 1 lin
knob 6 Echo dl.mix 0 0.8 lin
`,
`name Snare and hat
voice
node n Note
node nz Noise type=0 level=1
node hp Svf cut=6000 res=0.3
node ae AR a=0.0005 r=0.12
node ve Mult
node tn Osc wave=3 level=0.8
node pe AR a=0.0003 r=0.05
node ps Atten scale=24
node pm Math op=0
node te AR a=0.0005 r=0.1
node tv Mult
node mx Mix4 la=0.8 lb=0.7
node out VoiceOut
wire n.gate ae.trig
wire n.gate pe.trig
wire n.gate te.trig
wire nz.out hp.in
wire hp.hp ve.a
wire ae.out ve.b
wire pe.out ps.in
wire n.raw pm.a
wire ps.out pm.b
wire pm.out tn.pitch
wire tn.out tv.a
wire te.out tv.b
wire ve.out mx.a
wire tv.out mx.b
wire mx.out out.l
master
node vs Voices
node rv Reverb size=0.35 damp=0.6 mix=0.15
node m Master
wire vs.l rv.l
wire rv.l m.l
wire rv.r m.r
knob 1 Noise_tone hp.cut 800 14000 exp
knob 2 Noise_decay ae.r 0.02 0.6 exp
knob 3 Body_decay te.r 0.03 0.5 exp
knob 4 Punch ps.scale 0 48 lin
knob 5 Room rv.mix 0 0.6 lin
`,
`name Formant choir
voice
node n Note
node o1 Osc wave=0 level=0.5
node o2 Osc wave=0 fine=0.1 level=0.5
node vib LFO shape=0 rate=5.2 bipolar=1 level=1
node vd Atten scale=0.22
node mx Mix4
node fm Formant vowel=0 q=9 level=1.4
node lf LFO shape=5 rate=0.15 bipolar=0 level=1
node ls Atten scale=3
node e ADSR a=0.7 d=1 s=0.9 r=1.2
node v Mult
node out VoiceOut
wire n.pitch o1.pitch
wire n.pitch o2.pitch
wire vib.out vd.in
wire vd.out o1.fm
wire vd.out o2.fm
wire o1.out mx.a
wire o2.out mx.b
wire mx.out fm.in
wire lf.out ls.in
wire ls.out fm.mod
wire fm.out v.a
wire n.gate e.gate
wire e.out v.b
wire v.out out.l
master
node vs Voices
node rv Reverb size=0.85 damp=0.4 mix=0.35
node m Master
wire vs.l rv.l
wire rv.l m.l
wire rv.r m.r
knob 1 Vowel fm.vowel 0 4 lin
knob 2 Sharpness fm.q 3 20 lin
knob 3 Drift ls.scale 0 4 lin
knob 4 Vibrato vd.scale 0 1 lin
knob 5 Space rv.mix 0 0.9 lin
`,
`name Table sweeper
voice
node n Note
node w WaveT table=0 pos=0.1 level=0.8
node lf LFO shape=1 rate=0.25 bipolar=0 level=0.6
node pe ADSR a=0.4 d=1.2 s=0.5 r=0.5
node mx Mix4 la=1 lb=0.3
node f Ladder cut=3200 res=0.2
node ae ADSR a=0.02 d=0.4 s=0.8 r=0.5
node v Mult
node out VoiceOut
wire n.pitch w.pitch
wire lf.out mx.a
wire pe.out mx.b
wire mx.out w.pos
wire w.out f.in
wire n.gate pe.gate
wire n.gate ae.gate
wire f.out v.a
wire ae.out v.b
wire v.out out.l
master
node vs Voices
node ph Phaser rate=0.2 depth=0.7 fb=0.3 mix=0.35
node m Master
wire vs.l ph.in
wire ph.out m.l
wire ph.out m.r
knob 1 Table w.table 0 11 lin
knob 2 Position w.pos 0 1 lin
knob 3 Sweep_rate lf.rate 0.03 4 exp
knob 4 Cutoff f.cut 200 12000 exp
knob 5 Phaser ph.mix 0 1 lin
`,
`name Sync lead
voice
node n Note
node ms Osc wave=1 level=0.1
node sl Osc wave=0 level=0.8
node e ADSR a=0.01 d=1.2 s=0.2 r=0.3
node sw Atten scale=19
node pt Math op=0
node sh Shaper type=0 drive=1.6
node ae ADSR a=0.005 d=0.4 s=0.85 r=0.25
node v Mult
node out VoiceOut
wire n.pitch ms.pitch
wire ms.out sl.sync
wire n.gate e.gate
wire e.out sw.in
wire n.pitch pt.a
wire sw.out pt.b
wire pt.out sl.pitch
wire sl.out sh.in
wire n.gate ae.gate
wire sh.out v.a
wire ae.out v.b
wire v.out out.l
master
node vs Voices
node dl Delay time=280 fb=0.3 tone=0.6 mix=0.22
node m Master
wire vs.l dl.in
wire dl.out m.l
wire dl.out m.r
knob 1 Sweep sw.scale 0 36 lin
knob 2 Sweep_time e.d 0.1 4 exp
knob 3 Drive sh.drive 0.5 8 exp
knob 4 Attack ae.a 0.002 1 exp
knob 5 Echo dl.mix 0 0.8 lin
`,
`name Ring robot
voice
node n Note
node c Osc wave=3 level=1
node mo Osc wave=0 coarse=7 fine=0.04 level=1
node rm Mult
node cb Comb freq=220 fb=0.6 damp=0.4
node mx Mix4 la=0.6 lb=0.5
node ae ADSR a=0.004 d=0.3 s=0.7 r=0.2
node v Mult
node out VoiceOut
wire n.pitch c.pitch
wire n.pitch mo.pitch
wire c.out rm.a
wire mo.out rm.b
wire rm.out mx.a
wire rm.out cb.in
wire cb.out mx.b
wire mx.out v.a
wire n.gate ae.gate
wire ae.out v.b
wire v.out out.l
master
node vs Voices
node m Master
wire vs.l m.l
wire vs.r m.r
knob 1 Interval mo.coarse -12 24 lin
knob 2 Detune mo.fine 0 1 lin
knob 3 Comb_freq cb.freq 60 2000 exp
knob 4 Comb_feedback cb.fb 0 0.95 lin
knob 5 Body mx.lb 0 1 lin
`,
`name Feedback drone
voice
node n Note
node o Osc wave=0 level=0.7
node lf LFO shape=0 rate=0.07 bipolar=1 level=1
node ls Atten scale=18
node f Svf cut=900 res=0.55
node sh Shaper type=1 drive=1.4
node fb Atten scale=1.4
node ae ADSR a=2 d=2 s=0.9 r=3
node v Mult
node out VoiceOut
wire n.pitch o.pitch
wire o.out f.in
wire lf.out ls.in
wire ls.out f.cut
wire f.bp sh.in
wire sh.out fb.in
wire fb.out o.fm
wire f.lp v.a
wire n.gate ae.gate
wire ae.out v.b
wire v.out out.l
master
node vs Voices
node dl Delay time=640 fb=0.55 tone=0.4 mix=0.35
node rv Reverb size=0.95 damp=0.3 mix=0.4
node m Master
wire vs.l dl.in
wire dl.out rv.l
wire rv.l m.l
wire rv.r m.r
knob 1 Feedback fb.scale 0 6 lin
knob 2 Cutoff f.cut 100 6000 exp
knob 3 Resonance f.res 0 0.95 lin
knob 4 Drift ls.scale 0 36 lin
knob 5 Echo dl.mix 0 0.9 lin
knob 6 Space rv.mix 0 0.9 lin
`];

  const patchNames = ['Init saw', 'Two-oscillator brass', 'Glass bells', 'Pluck machine', 'Cloud nine', 'Step machine', 'Snare and hat', 'Formant choir', 'Table sweeper', 'Sync lead', 'Ring robot', 'Feedback drone'];
  const parsed = PATCHES.map(parsePatch);
  const patchInfo = parsed.map((r, i) => ({ name: patchNames[i], ok: r.ok, errors: r.errors, knobs: r.patch.knob.map(k => k.used ? k.label : '') }));
  const E = { Preset: 0, Volume: 1, Voices: 2, Glide: 3, BendRange: 4, Knob1: 5 }; E.Tempo = E.Knob1 + kKnobs; E.Count = E.Tempo + 1;
  const specs = [P('Preset', '', 0, patchNames.length - 1, 0, '%.0f', false, patchNames), P('Volume', '', 0, 1, 0.7), P('Voices', '', 1, 16, 8, '%.0f'), P('Glide', '', 0, 1, 0), P('Bend range', 'st', 0, 24, 2, '%.0f st')];
  for (let i = 0; i < kKnobs; ++i) specs.push(P('Knob ' + (i + 1), '', 0, 1, parsed[0].patch.knob[i].used ? parsed[0].patch.knob[i].pos : 0.5));
  specs.push(P('Tempo', 'BPM', 40, 240, 120, '%.0f BPM'));
  const range = (a, n) => Array.from({ length: n }, (_, i) => a + i);
  const groups = [['Main', [E.Volume, E.Voices, E.Glide, E.BendRange, E.Tempo]], ['Macro knobs 1-8', range(E.Knob1, 8)], ['Macro knobs 9-16', range(E.Knob1 + 8, 8)]];

  // ---- shared building blocks
  const gSin = new Float64Array(2050); for (let i = 0; i < 2050; ++i) gSin[i] = Math.sin(2 * Math.PI * i / 2048);
  const fsin = cyc => { if (!(Math.abs(cyc) < 1e6)) return 0; cyc -= Math.floor(cyc); const x = cyc * 2048; let i = x | 0; if (i > 2048) i = 2048; const f = x - i; return gSin[i] + (gSin[i + 1] - gSin[i]) * f; };
  const q1k = v => v !== v ? 0 : (v > 1000 ? 1000 : (v < -1000 ? -1000 : v));
  class Rng { constructor(s) { this.s = s >>> 0; } white() { let s = this.s; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; this.s = s; return (s | 0) / 2147483648; } uni() { return 0.5 + 0.5 * this.white(); } }
  class Rev {
    constructor(sr) {
      const ct = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], at = [556, 441, 341, 225]; this.cb = []; this.ci = [[], []]; this.cz = [[], []]; this.ab = []; this.ai = [[], []];
      for (let ch = 0; ch < 2; ++ch) { this.cb.push([]); this.ab.push([]); for (let k = 0; k < 8; ++k) { this.cb[ch].push(new Float32Array(Math.floor((ct[k] + ch * 23) * sr / 44100) + 1)); this.ci[ch].push(0); this.cz[ch].push(0); }
        for (let k = 0; k < 4; ++k) { this.ab[ch].push(new Float32Array(Math.floor((at[k] + ch * 23) * sr / 44100) + 1)); this.ai[ch].push(0); } }
    }
    clear() { for (let ch = 0; ch < 2; ++ch) { for (let k = 0; k < 8; ++k) { this.cb[ch][k].fill(0); this.ci[ch][k] = 0; this.cz[ch][k] = 0; } for (let k = 0; k < 4; ++k) { this.ab[ch][k].fill(0); this.ai[ch][k] = 0; } } }
    tick(ch, inp, fb, damp) {
      let s = 0; const cb = this.cb[ch], ci = this.ci[ch], cz = this.cz[ch];
      for (let k = 0; k < 8; ++k) { const b = cb[k], i = ci[k], y = b[i], z = y * (1 - damp) + cz[k] * damp; cz[k] = z; b[i] = inp + z * fb; ci[k] = (i + 1 >= b.length) ? 0 : i + 1; s += y; }
      const ab = this.ab[ch], ai = this.ai[ch];
      for (let k = 0; k < 4; ++k) { const b = ab[k], i = ai[k], bo = b[i], y = -s + bo; b[i] = s + bo * 0.5; ai[k] = (i + 1 >= b.length) ? 0 : i + 1; s = y; }
      return s;
    }
  }
  // wavetable bank for the WaveT module (built one table at a time, same recipes as modica/wavetables.h)
  const kTabN = 1024, kFrames = 16, kMips = 9, kMaxH = 256;
  const whash = (a, b) => { let h = (Math.imul(a, 2654435761) ^ Math.imul(b, 40503) ^ 0x9E3779B9) >>> 0; h = (h ^ (h >>> 15)) >>> 0; h = Math.imul(h, 2246822519) >>> 0; h = (h ^ (h >>> 13)) >>> 0; return (h & 0xFFFF) / 65535; };
  const FV = [[800, 1150, 2900], [400, 1600, 2700], [270, 2300, 3000], [450, 800, 2830], [325, 700, 2530]], GV = [[800, 1050, 2800], [600, 1000, 2500], [300, 1800, 2900], [500, 900, 2700], [350, 650, 2400]];
  const ORG = [[1, 1, 0.8, 0, 0.5, 0, 0.3, 0.2, 0, 0], [0.2, 1, 0.3, 0.9, 0.2, 0.7, 0.2, 0.6, 0.5, 0.4]];
  const rec = { amp: 0, ph: 0 };
  function recipe(t, p, k) {
    const kk = k; let amp = 0, ph = 0;
    switch (t) {
      case 0: amp = ((k & 1) ? 1 : (1 - p)) / kk; break;
      case 1: { const lim = 1 + p * 63; amp = kk <= lim ? 1 / kk : (kk < lim + 2 ? (lim + 2 - kk) * 0.5 / kk : 0); break; }
      case 2: case 6: {
        const x = p * 4, i = Math.min(x | 0, 3), f = x - i, A = t === 2 ? FV : GV; let s = 0;
        for (let j = 0; j < 3; ++j) { const c = (A[i][j] + (A[i + 1][j] - A[i][j]) * f) / 110, bw = 1.2 + 0.25 * c, d = (kk - c) / bw; s += Math.exp(-0.5 * d * d) * (j === 0 ? 1 : 0.7); }
        amp = s / Math.pow(kk, 0.3) * (t === 6 ? 1 : 0.8); if (t === 6) ph = 0.15 * whash(k, 6); break; }
      case 3: if (k > 10) { amp = 0; break; } amp = (ORG[0][k - 1] + (ORG[1][k - 1] - ORG[0][k - 1]) * p) * 0.6; break;
      case 4: { const s = 1 + Math.floor(p * 7); amp = ((k - 1) % s === 0) ? 1 / Math.pow(kk, 0.7) : 0; break; }
      case 5: { const s = 2 + Math.floor(p * 6); amp = (1 / Math.sqrt(kk)) * ((k % s === 0) ? 0.15 : 1); ph = whash(k, 5); break; }
      case 7: { const lv = 2 + (1 - p) * 30, a = 1 / kk; amp = Math.floor(a * lv + 0.5) / lv; break; }
      case 8: { if (!(k & 1)) { amp = 0; break; } const c = 3 + p * 20, d = (kk - c) / (3 + p * 4); amp = (1 / kk) * (0.4 + 1.6 * Math.exp(-0.5 * d * d)); break; }
      case 9: amp = (1 / kk) * (0.5 + 0.5 * Math.cos(2 * Math.PI * kk * p * 0.5)); break;
      case 10: { const lim = 1 + p * 120; amp = kk <= lim ? 1 : 0; break; }
      default: amp = 1 / kk; ph = p * whash(k, 11); break;
    }
    rec.amp = amp; rec.ph = ph;
  }
  const WT = (OCC.__avoWT = OCC.__avoWT || { tabs: [], sinT: null });
  function wtTable(t) {
    let T = WT.tabs[t]; if (T) return T;
    if (!WT.sinT) { WT.sinT = new Float32Array(kTabN); for (let i = 0; i < kTabN; ++i) WT.sinT[i] = Math.sin(2 * Math.PI * i / kTabN); }
    const sinT = WT.sinT; T = new Float32Array(kMips * kFrames * (kTabN + 1));
    for (let f = 0; f < kFrames; ++f) { const p = f / (kFrames - 1); let scale = 1;
      for (let m = 0; m < kMips; ++m) {
        const off = (m * kFrames + f) * (kTabN + 1), H = kMaxH >> m;
        for (let k = 1; k <= H; ++k) { recipe(t, p, k); const a = rec.amp; if (a === 0) continue; let idx = (rec.ph * kTabN | 0) & (kTabN - 1); for (let n = 0; n < kTabN; ++n) { T[off + n] += a * sinT[idx]; idx = (idx + k) & (kTabN - 1); } }
        if (m === 0) { let pk = 1e-6; for (let n = 0; n < kTabN; ++n) pk = Math.max(pk, Math.abs(T[off + n])); scale = 0.9 / pk; }
        for (let n = 0; n < kTabN; ++n) T[off + n] *= scale; T[off + kTabN] = T[off];
      } }
    WT.tabs[t] = T; return T;
  }
  function wtRead(T, hz, sr, phase, pos) {
    let m = 0; while (m < kMips - 1 && hz * (kMaxH >> m) > 0.5 * sr) ++m;
    const fp = (pos < 0 ? 0 : (pos > 1 ? 1 : pos)) * (kFrames - 1), f0 = Math.min(fp | 0, kFrames - 2), ff = fp - f0;
    const x = (phase - Math.floor(phase)) * kTabN, i = x | 0, fr = x - i;
    const a = (m * kFrames + f0) * (kTabN + 1) + i, b = (m * kFrames + f0 + 1) * (kTabN + 1) + i;
    const va = T[a] + (T[a + 1] - T[a]) * fr, vb = T[b] + (T[b + 1] - T[b]) * fr; return va + (vb - va) * ff;
  }

  const FORM = [[730, 1090, 2440], [530, 1840, 2480], [270, 2290, 3010], [570, 840, 2410], [300, 870, 2240]], FORMG = [1, 0.6, 0.3];
  const QSC = [[12, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], [7, 0, 2, 4, 5, 7, 9, 11], [7, 0, 2, 3, 5, 7, 8, 10], [5, 0, 2, 4, 7, 9], [6, 0, 2, 4, 6, 8, 10], [7, 0, 2, 3, 5, 7, 9, 10], [7, 0, 1, 3, 5, 7, 8, 10], [7, 0, 2, 3, 5, 7, 8, 11]];
  const CLK_MUL = [1, 2, 4, 8, 3];
  const mkState = (type, sr) => {
    const st = { s: new Float64Array(16), g: new Float64Array(40), d1: null, rev: null, rng: new Rng(2463534242) };
    switch (type) {
      case N_Pluck: case N_Comb: st.d1 = new DelayLine(Math.floor(sr / 20) + 16); break;
      case N_Grain: st.d1 = new DelayLine(Math.floor(2 * sr)); break;
      case N_Delay: st.d1 = new DelayLine(Math.floor(2.1 * sr)); break;
      case N_Chorus: st.d1 = new DelayLine(Math.floor(0.06 * sr)); break;
      case N_Reverb: st.rev = new Rev(sr); break;
    }
    st.type = type; nanCache(st); return st;
  };
  const nanCache = st => { const s = st.s; // cache slots (see evalNode) start out unequal to any input
    switch (st.type) { case N_Osc: case N_FmOp: case N_WaveT: case N_AR: s[8] = NaN; break; case N_Ladder: s[8] = NaN; s[9] = NaN; break; case N_ADSR: s[8] = NaN; s[10] = NaN; break; case N_VoiceOut: s[0] = NaN; break; } };
  const resetStates = st => { for (const s of st) { s.s.fill(0); s.g.fill(0); if (s.d1) s.d1.clear(); if (s.rev) s.rev.clear(); nanCache(s); } };

  class Avoidica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); this.patch = null; this.voice = []; this.ms = []; this.mouts = null; this.cur = null; this.inb = new Float64Array(kMaxIn);
      this.bend = 0; this.mod = 0; this.press = 0; this.lastPitch = 0; this.mastL = 0; this.mastR = 0; this.seed = 1; this.kdirty = false; this.gin = new Float64Array(2);
      this.tl = 0; this.tb = 0; this.th = 0; this.load(0, false);
    }
    load(i, notify) {
      i = clampf(i, 0, patchNames.length - 1); const r = parsePatch(PATCHES[i]); if (!r.ok) return; this.patch = r.patch; this.build();
      for (let k = 0; k < kKnobs; ++k) { const km = this.patch.knob[k], x = km.used ? km.pos : 0.5; this.v[E.Knob1 + k] = x; if (notify) this.writeParam(E.Knob1 + k, x); }
    }
    build() {
      const P0 = this.patch, sr = this.sr; this.voice = [];
      for (let i = 0; i < kVoices; ++i) this.voice.push({ active: false, gate: false, note: 60, age: 0, quiet: 0, life: 0, vel: 0, pitch: 60, target: 60, st: P0.sec[0].nodes.map(n => mkState(n.type, sr)), outs: new Float64Array(P0.sec[0].nOut), oL: 0, oR: 0 });
      this.ms = P0.sec[1].nodes.map((n, i) => { const s = mkState(n.type, sr); s.rng.s = (2463534242 + i * 7919) >>> 0; return s; }); this.mouts = new Float64Array(P0.sec[1].nOut);
      for (const v of this.voice) v.st.forEach((s, i) => s.rng.s = (2463534242 + i * 7919) >>> 0);
    }
    set(id, x) {
      if (id < 0 || id >= E.Count) return; this.v[id] = x;
      if (id === E.Preset) { this.load(Math.round(x), true); return; }
      if (id >= E.Knob1 && id < E.Knob1 + kKnobs) { const km = this.patch && this.patch.knob[id - E.Knob1]; if (km && km.used) { km.pos = clampf(x, 0, 1); this.kdirty = true; } }
    }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.mod = m; } pressure(p) { this.press = p; }
    allNotesOff() { for (const v of this.voice) v.gate = false; }
    noteOn(note, vel) {
      if (!this.patch) return; const V = this.v, lim = clampf(Math.round(V[E.Voices]), 1, kVoices); let v = null;
      for (let i = 0; i < lim && !v; ++i) if (!this.voice[i].active) v = this.voice[i];
      if (!v) { let o = 0; for (let i = 1; i < lim; ++i) if (this.voice[i].age > this.voice[o].age) o = i; v = this.voice[o]; }
      const tuned = note + this.noteTune * 0.01; this.noteTune = 0; const glide = V[E.Glide] > 0.001 && this.lastPitch > 0;
      resetStates(v.st); v.outs.fill(0); v.active = true; v.gate = true; v.note = note; v.vel = vel; v.age = 0; v.target = tuned; v.pitch = glide ? this.lastPitch : tuned; v.quiet = 0; v.life = 0; this.lastPitch = tuned;
      ++this.seed; v.st.forEach((s, i) => s.rng.s = (2463534242 ^ Math.imul(this.seed, 2654435761) ^ (i * 40503 + 1)) >>> 0);
    }
    noteOff(note) { for (const v of this.voice) if (v.active && v.gate && v.note === note) v.gate = false; }
    smoothKnobs() {
      for (let k = 0; k < kKnobs; ++k) { const km = this.patch.knob[k]; if (!km.used) continue; const n = this.patch.sec[km.sec].nodes[km.node];
        const t = km.exp ? km.lo * Math.pow(km.hi / km.lo, km.pos) : km.lo + (km.hi - km.lo) * km.pos, p = n.p[km.param];
        n.p[km.param] = Math.abs(p - t) < 1e-6 * (1 + Math.abs(t)) ? t : p + (t - p) * 0.25; }
    }
    tpt(fc, q, s, i1, i2, x) {
      const sr = this.sr, g = Math.tan(kPif * clampf(fc, 10, sr * 0.45) / sr), k = 1 / q, a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2, ic1 = s[i1], ic2 = s[i2];
      const v3 = x - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3; s[i1] = 2 * v1 - ic1; s[i2] = 2 * v2 - ic2; this.tl = v2; this.tb = v1; this.th = x - k * v1 - v2;
    }
    evalNode(nd, st, vc, gin) {
      const cur = this.cur, ob = nd.outBase, P = nd.p, s = st.s, inn = this.inb, sr = this.sr, V = this.v, src = nd.src;
      for (let k = 0; k < kMaxIn; ++k) { const sl = src[k]; if (sl.length === 0) inn[k] = nd.inDef[k]; else { let a = 0; for (let j = 0; j < sl.length; ++j) a += cur[sl[j]]; inn[k] = a; } }
      const i0 = inn[0], i1 = inn[1], i2 = inn[2], i3 = inn[3], hzmax = sr * 0.45;
      switch (nd.type) {
        case N_Note: if (vc) { cur[ob] = q1k(vc.pitch + this.bend * V[E.BendRange]); cur[ob + 1] = vc.gate ? 1 : 0; cur[ob + 2] = vc.vel; cur[ob + 3] = vc.note / 127; cur[ob + 4] = this.mod; cur[ob + 5] = this.press; cur[ob + 6] = q1k(vc.pitch); } break;
        case N_Voices: cur[ob] = q1k(gin[0]); cur[ob + 1] = q1k(gin[1]); break;
        case N_Osc: {
          const xk = i0 + P[1] + P[2] + i1; if (xk !== s[8]) { s[8] = xk; s[9] = clampf(midiHz(clampf(xk, -60, 160)), 0, hzmax); } const dt = s[9] / sr; if (i3 > 0.5 && s[1] <= 0.5) s[0] = 0; s[1] = i3;
          let ph = s[0], y;
          switch (Math.round(P[0])) {
            case 0: y = 2 * ph - 1 - polyBlep(ph, dt); break;
            case 1: { const pw = clampf(P[3] + i2 * 0.5, 0.02, 0.98); y = ph < pw ? 1 : -1; y += polyBlep(ph, dt); let t2 = ph + 1 - pw; if (t2 >= 1) t2 -= 1; y -= polyBlep(t2, dt); break; }
            case 2: y = 4 * Math.abs(ph - 0.5) - 1; break;
            default: y = fsin(ph); break;
          }
          ph += dt; if (ph >= 1) ph -= Math.floor(ph); s[0] = ph; cur[ob] = q1k(y * P[4]); break; }
        case N_FmOp: {
          if (i0 !== s[8]) { s[8] = i0; s[9] = clampf(midiHz(clampf(i0, -60, 160)), 0, hzmax); } const dt = Math.min(0.45, s[9] * P[0] / sr); let ph = s[0];
          const y = fsin(ph + (i1 * P[1] * i2 + P[2] * s[2] * 1.2)); s[2] = 0.5 * (y + s[2]); ph += dt; ph -= Math.floor(ph); s[0] = ph; cur[ob] = q1k(y * P[3]); break; }
        case N_Noise: {
          const w = st.rng.white(); let y;
          switch (Math.round(P[0])) {
            case 1: s[0] = 0.99886 * s[0] + w * 0.0555179; s[1] = 0.99332 * s[1] + w * 0.0750759; s[2] = 0.969 * s[2] + w * 0.153852; s[3] = 0.8665 * s[3] + w * 0.3104856; s[4] = 0.55 * s[4] + w * 0.5329522; s[5] = -0.7616 * s[5] - w * 0.016898;
              y = (s[0] + s[1] + s[2] + s[3] + s[4] + s[5] + s[6] + w * 0.5362) * 0.11; s[6] = w * 0.115926; break;
            case 2: s[7] = clampf(s[7] + w * 0.04, -1, 1) * 0.998; y = s[7] * 3; break;
            case 3: y = st.rng.uni() < 0.0004 ? w * 3 : 0; break;
            default: y = w; break;
          }
          cur[ob] = q1k(clampf(y, -2, 2) * P[1]); break; }
        case N_WaveT: {
          if (i0 !== s[8]) { s[8] = i0; s[9] = clampf(midiHz(clampf(i0, -60, 160)), 0, hzmax); } const f = s[9], tb = clampf(Math.round(P[0]), 0, 11);
          const y = wtRead(wtTable(tb), Math.max(f, 1), sr, s[0], clampf(P[1] + i1, 0, 1)); s[0] += f / sr; s[0] -= Math.floor(s[0]); cur[ob] = q1k(y * P[2]); break; }
        case N_Pluck: {
          const f = clampf(clampf(midiHz(clampf(i1, -60, 160)), 0, hzmax), 20, sr * 0.4), a = 0.12 + 0.88 * (1 - P[1]) * (1 - P[1]) + 0.0001, t60 = Math.max(0.05, P[0]), g = Math.min(0.9995, Math.pow(10, -3 / (t60 * f)));
          const dd = Math.max(2.5, sr / f - (1 - a) / a - 0.5), y = st.d1.read(dd); s[0] += (y - s[0]) * a; if (!isFinite(y)) { st.d1.clear(); s[0] = 0; cur[ob] = 0; break; }
          st.d1.push(clampf(i0 + s[0] * g, -8, 8)); cur[ob] = q1k(y * P[2]); break; }
        case N_Grain: {
          const gg = st.g, size = Math.max(64, P[0] * 0.001 * sr); if (P[4] < 0.5) st.d1.push(i0);
          if (st.rng.uni() < P[1] / sr * (1 + 0.5 * st.rng.white())) {
            for (let i = 0; i < 8; ++i) if (gg[i * 4 + 3] <= 0) {
              gg[i * 4] = clampf((clampf(i1 * 0.5 + 0.5, 0, 1) * 1.5 + P[2] * 0.3 * st.rng.uni()) * sr, 8, 1.9 * sr);
              gg[i * 4 + 1] = Math.pow(2, (P[3] + i2 + P[2] * 0.5 * st.rng.white()) / 12); gg[i * 4 + 2] = 0; gg[i * 4 + 3] = size; break; }
          }
          let sum = 0; const fz = P[4] > 0.5 ? 0 : 1;
          for (let i = 0; i < 8; ++i) { const o = i * 4; if (gg[o + 3] <= 0) continue; const w = 0.5 - 0.5 * Math.cos(2 * kPif * gg[o + 2] / gg[o + 3]);
            const dly = clampf(gg[o] - (gg[o + 1] - fz) * gg[o + 2], 2, sr * 1.95); sum += w * st.d1.read(dly); gg[o + 2] += 1; if (gg[o + 2] >= gg[o + 3]) gg[o + 3] = 0; }
          cur[ob] = q1k(sum * P[5] / Math.sqrt(1 + P[1] * P[0] * 0.001)); break; }
        case N_Svf: {
          const fc = i1 === 0 ? P[0] : P[0] * Math.pow(2, i1 / 12), rr = clampf(P[1] + i2, 0, 1), qq = 0.6 + rr * rr * 24; this.tpt(fc, qq, s, 0, 1, i0);
          let lp = this.tl, bp = this.tb, hp = this.th; if (!isFinite(lp + bp + hp)) { s[0] = s[1] = 0; lp = bp = hp = 0; }
          cur[ob] = q1k(lp); cur[ob + 1] = q1k(bp / qq); cur[ob + 2] = q1k(hp); cur[ob + 3] = q1k(lp + hp); break; }
        case N_Ladder: {
          if (P[0] !== s[8] || i1 !== s[9]) { s[8] = P[0]; s[9] = i1; const fc = clampf(i1 === 0 ? P[0] : P[0] * Math.pow(2, i1 / 12), 20, sr * 0.25); s[10] = Math.min(0.6, 1 - Math.exp(-2 * kPif * fc / sr)); } const g = s[10], k = 4 * clampf(P[1] + i2, 0, 1.05);
          const x = fastTanh(i0 * P[2] - k * s[3] * 0.95);
          s[0] += g * (x - s[4]); s[4] = fastTanh(s[0]); s[1] += g * (s[4] - s[5]); s[5] = fastTanh(s[1]); s[2] += g * (s[5] - s[6]); s[6] = fastTanh(s[2]); s[3] += g * (s[6] - s[7]); s[7] = fastTanh(s[3]);
          if (!isFinite(s[3])) for (let i = 0; i < 8; ++i) s[i] = 0;
          cur[ob] = q1k(s[3] * (1 + 0.4 * clampf(P[1], 0, 1)) / Math.max(0.5, P[2] * 0.5 + 0.5)); break; }
        case N_Formant: {
          const vp = clampf(P[0] + i1, 0, 3.999), v0 = vp | 0, fr = vp - v0; let y = 0;
          for (let b = 0; b < 3; ++b) { const fc = FORM[v0][b] + (FORM[v0 + 1][b] - FORM[v0][b]) * fr; this.tpt(fc, P[1], s, b * 2, b * 2 + 1, i0); y += this.tb / P[1] * FORMG[b] * 2; }
          if (!isFinite(y)) { for (let i = 0; i < 6; ++i) s[i] = 0; y = 0; } cur[ob] = q1k(y * P[2]); break; }
        case N_Comb: {
          const f = clampf(P[0] * Math.pow(2, i1 / 12), 20, sr * 0.4), y = st.d1.read(Math.max(2.5, sr / f - 1)); s[0] += (y - s[0]) * (1 - P[2] * 0.9);
          if (!isFinite(y)) { st.d1.clear(); s[0] = 0; cur[ob] = 0; break; } st.d1.push(clampf(i0 + s[0] * P[1], -8, 8)); cur[ob] = q1k(y); break; }
        case N_Allpass: { const f = clampf(P[0] * Math.pow(2, i1 / 12), 20, sr * 0.45), t = Math.tan(kPif * f / sr), a = (t - 1) / (t + 1), y = a * i0 + s[0]; s[0] = i0 - a * y; cur[ob] = q1k(y); break; }
        case N_Shaper: {
          const dr = clampf(P[1] + i1, 0.1, 30), x = i0; let y;
          switch (Math.round(P[0])) { case 1: y = fsin(x * dr * 0.25); break; case 2: y = clampf(x * dr, -1, 1); break; case 3: { const steps = Math.max(2, 64 / dr); y = Math.round(x * steps) / steps; break; }
            case 4: y = Math.tanh(dr * x + 0.4) - Math.tanh(0.4); break; default: y = Math.tanh(dr * x); break; }
          cur[ob] = q1k(y * P[2]); break; }
        case N_Rectify: { const m = Math.round(P[0]); cur[ob] = q1k(m === 0 ? Math.abs(i0) : (m === 1 ? Math.max(0, i0) : Math.min(0, i0))); break; }
        case N_Mult: cur[ob] = q1k(i0 * i1); break;
        case N_Atten: cur[ob] = q1k(i0 * i1 * P[0] + P[1]); break;
        case N_Mix4: cur[ob] = q1k(i0 * P[0] + i1 * P[1] + i2 * P[2] + i3 * P[3]); break;
        case N_Xfade: { const x = clampf(P[0] + i2, 0, 1); cur[ob] = q1k(i0 + (i1 - i0) * x); break; }
        case N_Pan: { const p = clampf(P[0] + i1, -1, 1), a = (p + 1) * 0.25 * kPif; cur[ob] = q1k(i0 * Math.cos(a)); cur[ob + 1] = q1k(i0 * Math.sin(a)); break; }
        case N_Math: { const a = i0, b = i1 + P[1]; let y; switch (Math.round(P[0])) { case 1: y = a - b; break; case 2: y = a * b; break; case 3: y = Math.abs(b) < 1e-6 ? 0 : a / b; break; case 4: y = Math.min(a, b); break; case 5: y = Math.max(a, b); break;
          case 6: y = Math.abs(a - b); break; case 7: y = Math.abs(b) < 1e-6 ? 0 : a - b * Math.floor(a / b); break; default: y = a + b; break; } cur[ob] = q1k(clampf(y, -1e4, 1e4)); break; }
        case N_Compare: cur[ob] = i0 > i1 + P[0] ? 1 : 0; break;
        case N_Logic: { const a = i0 > 0.5, b = i1 > 0.5, op = Math.round(P[0]); cur[ob] = (op === 0 ? (a && b) : op === 1 ? (a || b) : op === 2 ? (a !== b) : !(a && b)) ? 1 : 0; break; }
        case N_SampleHold: if (i1 > 0.5 && s[1] <= 0.5) s[0] = i0; s[1] = i1; cur[ob] = q1k(s[0]); break;
        case N_Slew: { const t = i0 > s[0] ? P[0] : P[1]; s[0] += (i0 - s[0]) * (1 - Math.exp(-1 / (Math.max(0.0001, t * 0.001) * sr))); cur[ob] = q1k(s[0]); break; }
        case N_Quant: {
          const sc = QSC[clampf(Math.round(P[0]), 0, 7)], x = i0 - P[1], oc = Math.floor(x / 12), r = x - 12 * oc; let best = 0, bd = 1e9;
          for (let k = 1; k <= sc[0]; ++k) { const dd = Math.abs(r - sc[k]); if (dd < bd) { bd = dd; best = sc[k]; } } if (Math.abs(r - 12) < bd) best = 12;
          cur[ob] = q1k(P[1] + 12 * oc + best); break; }
        case N_Const: cur[ob] = P[0]; break;
        case N_ADSR: {
          const g = i0 > 0.5; if (g && s[1] <= 0.5) s[2] = 1; s[1] = i0; let lv = s[0];
          if (!g && s[2] !== 3 && s[2] !== 0) s[2] = 3;
          if (s[2] === 1) { lv += 1 / Math.max(1, P[0] * sr); if (lv >= 1) { lv = 1; s[2] = 2; } }
          else if (s[2] === 2) { if (P[1] !== s[8]) { s[8] = P[1]; s[9] = 1 - Math.exp(-4 / Math.max(1, P[1] * sr)); } lv += (P[2] - lv) * s[9]; }
          else if (s[2] === 3) { if (P[3] !== s[10]) { s[10] = P[3]; s[11] = 1 - Math.exp(-4 / Math.max(1, P[3] * sr)); } lv += (0 - lv) * s[11]; if (lv < 1e-5) { lv = 0; s[2] = 0; } }
          s[0] = lv; cur[ob] = lv; break; }
        case N_AR: {
          if (i0 > 0.5 && s[1] <= 0.5) s[2] = 1; s[1] = i0; let lv = s[0];
          if (s[2] === 1) { lv += 1 / Math.max(1, P[0] * sr); if (lv >= 1) { lv = 1; s[2] = 2; } } else if (s[2] === 2) { if (P[1] !== s[8]) { s[8] = P[1]; s[9] = 1 - Math.exp(-4 / Math.max(1, P[1] * sr)); } lv += (0 - lv) * s[9]; if (lv < 1e-5) { lv = 0; s[2] = 0; } }
          s[0] = lv; cur[ob] = lv; break; }
        case N_LFO: {
          if (i1 > 0.5 && s[2] <= 0.5) s[0] = P[2]; s[2] = i1; const rate = clampf(P[1] * Math.pow(2, i0), 0.001, 200); let ph = s[0], wrap = false; ph += rate / sr; if (ph >= 1) { ph -= Math.floor(ph); wrap = true; } s[0] = ph;
          let y; switch (Math.round(P[0])) { case 1: y = 4 * Math.abs(ph - 0.5) - 1; break; case 2: y = 2 * ph - 1; break; case 3: y = ph < 0.5 ? 1 : -1; break;
            case 4: if (wrap || s[3] === 0) { s[4] = st.rng.white(); s[3] = 1; } y = s[4]; break;
            case 5: if (wrap || s[3] === 0) { s[5] = s[4]; s[4] = st.rng.white(); s[3] = 1; } y = s[5] + (s[4] - s[5]) * (0.5 - 0.5 * Math.cos(kPif * ph)); break;
            default: y = fsin(ph); break; }
          cur[ob] = q1k((P[3] > 0.5 ? y : 0.5 + 0.5 * y) * P[4]); break; }
        case N_Clock: {
          const bpm = P[2] > 0.5 ? V[E.Tempo] : P[0], rate = Math.max(0.1, bpm) / 60 * CLK_MUL[clampf(Math.round(P[1]), 0, 4)];
          if (i0 > 0.5 && s[1] <= 0.5) s[0] = 0.99999; s[1] = i0; s[0] += rate / sr; let fire = false; if (s[0] >= 1) { s[0] -= Math.floor(s[0]); fire = true; } if (fire) s[2] = Math.max(2, 0.002 * sr);
          const y = s[2] > 0 ? 1 : 0; if (s[2] > 0) s[2] -= 1; cur[ob] = y; break; }
        case N_ClockDiv: {
          if (i1 > 0.5 && s[2] <= 0.5) { s[1] = 0; s[3] = 0; } s[2] = i1;
          if (i0 > 0.5 && s[4] <= 0.5) { s[0] += 1; if (s[0] >= Math.max(1, Math.round(P[0]))) { s[0] = 0; s[3] = 1; } else s[3] = 0; } s[4] = i0; cur[ob] = (i0 > 0.5 && s[3] > 0.5) ? 1 : 0; break; }
        case N_Seq: {
          const len = clampf(Math.round(P[8]), 1, 8);
          if (i1 > 0.5 && s[3] <= 0.5) { s[0] = 0; s[5] = 1; s[6] = 0; } s[3] = i1;
          s[7] += 1; if (i0 > 0.5 && s[4] <= 0.5) { if (s[5] === 0) s[0] = (s[0] + 1) % len; s[5] = 0; s[8] = s[7]; s[7] = 0; s[6] = 1; } s[4] = i0;
          const tgt = P[clampf(s[0] | 0, 0, 7)], c = P[10] > 0.001 ? 1 - Math.exp(-1 / (P[10] * 0.05 * sr)) : 1; s[1] += (tgt - s[1]) * c; if (!isFinite(s[1])) s[1] = 0;
          const per = s[8] > 0 ? s[8] : sr * 0.25, gate = s[6] > 0.5 && s[7] < P[9] * per; cur[ob] = q1k(s[1]); cur[ob + 1] = gate ? 1 : 0; break; }
        case N_Random: { if (i0 > 0.5 && s[1] <= 0.5) s[2] = st.rng.white() * P[0]; s[1] = i0; const c = P[1] > 0 ? 1 - Math.exp(-1 / (P[1] * 0.001 * sr)) : 1; s[0] += (s[2] - s[0]) * c; cur[ob] = q1k(s[0]); break; }
        case N_EnvFollow: { const x = Math.abs(i0), t = x > s[0] ? P[0] : P[1]; s[0] += (x - s[0]) * (1 - Math.exp(-1 / (Math.max(0.05, t) * 0.001 * sr))); cur[ob] = q1k(s[0]); break; }
        case N_Delay: {
          const tm = clampf(P[0] * Math.pow(2, i1), 1, 2000) * 0.001 * sr, y = st.d1.read(Math.max(2, tm)); s[0] += (y - s[0]) * (0.05 + 0.95 * P[2]);
          if (!isFinite(y)) { st.d1.clear(); s[0] = 0; cur[ob] = q1k(i0); break; } st.d1.push(clampf(i0 + s[0] * P[1], -8, 8)); cur[ob] = q1k(i0 * (1 - P[3] * 0.5) + y * P[3]); break; }
        case N_Reverb: {
          if (!st.rev) { cur[ob] = q1k(i0); cur[ob + 1] = q1k(i1); break; } const r = src[1].length ? i1 : i0, x = (i0 + r) * 0.015, fb = 0.7 + 0.28 * P[0], dm = P[1] * 0.4;
          const wl = st.rev.tick(0, x, fb, dm), wr = st.rev.tick(1, x, fb, dm); cur[ob] = q1k(i0 * (1 - P[2]) + wl * 3 * P[2]); cur[ob + 1] = q1k(r * (1 - P[2]) + wr * 3 * P[2]); break; }
        case N_Chorus: {
          s[0] += P[0] / sr; s[0] -= Math.floor(s[0]); const dly = (0.012 + 0.001 * P[1] * fsin(s[0])) * sr, y = st.d1.read(Math.max(2, dly)); st.d1.push(i0); cur[ob] = q1k(i0 * (1 - P[2] * 0.5) + y * P[2]); break; }
        case N_Phaser: {
          s[0] += P[0] / sr; s[0] -= Math.floor(s[0]); const f = 300 * Math.pow(12, 0.5 + 0.5 * P[1] * fsin(s[0])), t = Math.tan(kPif * Math.min(f, sr * 0.4) / sr), a = (t - 1) / (t + 1);
          let x = i0 + s[5] * P[2]; for (let k = 0; k < 4; ++k) { const y = a * x + s[1 + k]; s[1 + k] = x - a * y; x = y; } if (!isFinite(x)) { for (let i = 0; i < 8; ++i) s[i] = 0; x = 0; }
          s[5] = x; cur[ob] = q1k(i0 * (1 - P[3] * 0.5) + x * P[3] * 0.7); break; }
        case N_VoiceOut: if (vc) { const l = i0, r = src[1].length ? i1 : i0; if (P[1] !== s[0]) { s[0] = P[1]; const a = (clampf(P[1], -1, 1) + 1) * 0.25 * kPif; s[1] = Math.cos(a) * 1.41421; s[2] = Math.sin(a) * 1.41421; } vc.oL += l * s[1] * P[0]; vc.oR += r * s[2] * P[0]; } break;
        case N_Master: this.mastL = i0 * P[0]; this.mastR = (src[1].length ? i1 : i0) * P[0]; break;
        default: break;
      }
    }
    process(outL, outR, n) {
      const P0 = this.patch; if (!P0) { outL.fill(0, 0, n); outR.fill(0, 0, n); return; }
      const V = this.v, VS = P0.sec[0], MS = P0.sec[1], vol = V[E.Volume], sr = this.sr, vs = this.voice, gin = this.gin;
      const gl = V[E.Glide] > 0.001 ? 1 - Math.exp(-1 / (Math.max(0.0005, V[E.Glide] * V[E.Glide] * 2) * sr)) : 1, quietMax = (0.3 * sr) | 0, lifeMax = 30 * sr;
      for (let i = 0; i < n; ++i) {
        if ((i & 7) === 0 || this.kdirty) { this.smoothKnobs(); this.kdirty = false; }
        let sl = 0, sR = 0;
        for (let k = 0; k < kVoices; ++k) {
          const v = vs[k]; if (!v.active) continue; v.oL = 0; v.oR = 0; v.pitch += (v.target - v.pitch) * gl;
          this.cur = v.outs; const ord = VS.order, nodes = VS.nodes; for (let j = 0; j < ord.length; ++j) { const idx = ord[j]; this.evalNode(nodes[idx], v.st[idx], v, null); }
          sl += v.oL; sR += v.oR; const pk = Math.max(Math.abs(v.oL), Math.abs(v.oR)); ++v.life; ++v.age;
          if (!v.gate) { if (pk < 1e-5) { if (++v.quiet > quietMax) v.active = false; } else v.quiet = 0; if (v.life > lifeMax) v.active = false; }
        }
        gin[0] = sl; gin[1] = sR; this.mastL = sl; this.mastR = sR; this.cur = this.mouts;
        { const ord = MS.order, nodes = MS.nodes; for (let j = 0; j < ord.length; ++j) { const idx = ord[j]; this.evalNode(nodes[idx], this.ms[idx], null, gin); } }
        let l = fastTanh(this.mastL * vol), r = fastTanh(this.mastR * vol); if (!isFinite(l + r)) { l = r = 0; }
        outL[i] = l; outR[i] = r;
      }
    }
  }
  OCC.engines.avoidica = { name: 'Avoidica', blurb: 'Patchable modular-ensemble synth: 41 modules (oscillators, FM, wavetable, pluck, granulator, filters, shapers, envelopes, LFOs, clock, sequencer, delays, reverb...) running per note plus a master half. The 12 factory patches are the presets; the 16 macro Knobs control whatever the loaded patch maps them to (see patchInfo). Tempo only matters for patches whose Clock is synced.', specs, groups, make: sr => new Avoidica(sr), E, patchInfo };
})();
/* Modica - the laboratory: a polyphonic modular synth. Four specimens (Analog/FM/Wavetable/Noise/Bell/String/Chaos) that can modulate each other,
   two Reagent filters, 3 envelopes, 2 LFOs, Tesla (Lorenz) chaos, 16-step sequencer, 4 levers, 12 wires, 3 Apparatus pedal slots, Mutate.
   Port of plugins/modica/modica.h (+ wavetables.h, bodytables.h, noiszical/noisegen.h and a subset of the Boardica pedals). */
(function () {
  const kSrc = 4, kWires = 12, kFx = 3, kSteps = 16, kVoices = 16, kTick = 8;
  const dbToGain = db => Math.pow(10, db / 20);
  class Rng { constructor(s) { this.s = (s >>> 0) || 0x1234567; } uni() { let s = this.s; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; this.s = s; return (s >>> 8) * (1 / 16777216); } bi() { return this.uni() * 2 - 1; } }
  class Smooth { constructor() { this.cur = 0; this.target = 0; this.coef = 0.999; } setTime(s, sr) { this.coef = Math.exp(-1 / Math.max(1, s * sr)); } reset(v) { this.cur = this.target = v; } next() { this.cur = this.target + (this.cur - this.target) * this.coef; return this.cur; } }
  class OP { constructor() { this.a = 0; this.z = 0; } set(hz, sr) { this.a = Math.exp(-2 * Math.PI * clampf(hz, 1, sr * 0.49) / sr); } run(x) { this.z = x * (1 - this.a) + this.z * this.a; return this.z; } reset() { this.z = 0; } }
  class OH { constructor() { this.lp = new OP(); } set(hz, sr) { this.lp.set(hz, sr); } run(x) { return x - this.lp.run(x); } reset() { this.lp.reset(); } }
  const BQ = { Peak: 0, LowShelf: 1, HighShelf: 2, LowPass: 3, HighPass: 4, BandPass: 5 };
  class Biquad {
    constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; }
    set(t, f, q, gdb, sr) {
      f = clampf(f, 5, sr * 0.49); q = Math.max(0.05, q); const A = Math.pow(10, gdb / 40), w = 2 * Math.PI * f / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * q); let B0, B1, B2, A0, A1, A2;
      switch (t) {
        case 0: B0 = 1 + al * A; B1 = -2 * cw; B2 = 1 - al * A; A0 = 1 + al / A; A1 = -2 * cw; A2 = 1 - al / A; break;
        case 1: { const s = 2 * Math.sqrt(A) * al; B0 = A * ((A + 1) - (A - 1) * cw + s); B1 = 2 * A * ((A - 1) - (A + 1) * cw); B2 = A * ((A + 1) - (A - 1) * cw - s); A0 = (A + 1) + (A - 1) * cw + s; A1 = -2 * ((A - 1) + (A + 1) * cw); A2 = (A + 1) + (A - 1) * cw - s; break; }
        case 2: { const s = 2 * Math.sqrt(A) * al; B0 = A * ((A + 1) + (A - 1) * cw + s); B1 = -2 * A * ((A - 1) + (A + 1) * cw); B2 = A * ((A + 1) + (A - 1) * cw - s); A0 = (A + 1) - (A - 1) * cw + s; A1 = 2 * ((A - 1) - (A + 1) * cw); A2 = (A + 1) - (A - 1) * cw - s; break; }
        case 3: B0 = (1 - cw) / 2; B1 = 1 - cw; B2 = B0; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; break;
        case 4: B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = B0; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; break;
        default: B0 = al; B1 = 0; B2 = -al; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al;
      }
      this.b0 = B0 / A0; this.b1 = B1 / A0; this.b2 = B2 / A0; this.a1 = A1 / A0; this.a2 = A2 / A0;
    }
    run(x) { const y = this.b0 * x + this.z1; this.z1 = this.b1 * x - this.a1 * y + this.z2; this.z2 = this.b2 * x - this.a2 * y; return y; }
    reset() { this.z1 = this.z2 = 0; }
  }
  class Allpass { constructor(maxLen) { this.d = new DelayLine(maxLen + 8); this.len = 1; this.g = 0.5; } run(x) { const v = this.d.tap(this.len - 1), w = x + this.g * v; this.d.push(w); return v - this.g * w; } runMod(x, l) { const v = this.d.read(l), w = x + this.g * v; this.d.push(w); return v - this.g * w; } }
  class Comb { constructor(maxLen) { this.d = new DelayLine(maxLen + 8); this.len = 1; this.fb = 0.8; this.damp = 0.2; this.z = 0; } run(x) { const y = this.d.tap(this.len - 1); this.z = y * (1 - this.damp) + this.z * this.damp; this.d.push(x + this.z * this.fb); return y; } }

  /* ---- sine table, wavetable bank (built per table on first use) */
  const SIN = new Float32Array(2050); for (let i = 0; i < 2050; ++i) SIN[i] = Math.sin(2 * Math.PI * i / 2048);
  function fsin(c) { if (!(Math.abs(c) < 1e6)) return 0; c -= Math.floor(c); const x = c * 2048; let i = x | 0; if (i < 0) i = 0; if (i > 2048) i = 2048; return SIN[i] + (SIN[i + 1] - SIN[i]) * (x - i); }
  const kTabN = 1024, kFrames = 16, kMips = 9, kTables = 12, kMaxH = 256;
  const TABLE_NAMES = ['Saw to square', 'Harmonic rise', 'Vowels', 'Pipe organ', 'Glass comb', 'Rusty metal', 'Choir', 'Digital grit', 'Hollow reed', 'Spectral comb', 'Buzz sweep', 'Phase ensemble'];
  const TABS = new Array(kTables).fill(null), sinT = new Float64Array(kTabN); for (let i = 0; i < kTabN; ++i) sinT[i] = Math.sin(2 * Math.PI * i / kTabN);
  function whash(a, b) { let h = (Math.imul(a, 2654435761) ^ Math.imul(b, 40503) ^ 0x9E3779B9) >>> 0; h = (h ^ (h >>> 15)) >>> 0; h = Math.imul(h, 2246822519) >>> 0; h = (h ^ (h >>> 13)) >>> 0; return (h & 0xFFFF) / 65535; }
  const FV = [[800, 1150, 2900], [400, 1600, 2700], [270, 2300, 3000], [450, 800, 2830], [325, 700, 2530]], FC = [[800, 1050, 2800], [600, 1000, 2500], [300, 1800, 2900], [500, 900, 2700], [350, 650, 2400]];
  const R3 = [[1, 1, 0.8, 0, 0.5, 0, 0.3, 0.2, 0, 0], [0.2, 1, 0.3, 0.9, 0.2, 0.7, 0.2, 0.6, 0.5, 0.4]];
  let RA = 0, RP = 0;
  function recipe(t, p, k) {
    const kk = k; RP = 0;
    switch (t) {
      case 0: RA = ((k & 1) ? 1 : (1 - p)) / kk; break;
      case 1: { const lim = 1 + p * 63; RA = kk <= lim ? 1 / kk : (kk < lim + 2 ? (lim + 2 - kk) * 0.5 / kk : 0); break; }
      case 2: case 6: { const x = p * 4, i = Math.min(x | 0, 3), f = x - i, A = t === 2 ? FV : FC; let s = 0;
        for (let j = 0; j < 3; ++j) { const c = (A[i][j] + (A[i + 1][j] - A[i][j]) * f) / 110, bw = 1.2 + 0.25 * c, d = (kk - c) / bw; s += Math.exp(-0.5 * d * d) * (j === 0 ? 1 : 0.7); }
        RA = s / Math.pow(kk, 0.3) * (t === 6 ? 1 : 0.8); if (t === 6) RP = 0.15 * whash(k, 6); break; }
      case 3: if (k > 10) { RA = 0; break; } RA = (R3[0][k - 1] + (R3[1][k - 1] - R3[0][k - 1]) * p) * 0.6; break;
      case 4: { const s = 1 + Math.floor(p * 7); RA = ((k - 1) % s === 0) ? 1 / Math.pow(kk, 0.7) : 0; break; }
      case 5: { const s = 2 + Math.floor(p * 6); RA = (1 / Math.sqrt(kk)) * ((k % s === 0) ? 0.15 : 1); RP = whash(k, 5); break; }
      case 7: { const lv = 2 + (1 - p) * 30, a = 1 / kk; RA = Math.floor(a * lv + 0.5) / lv; break; }
      case 8: { if (!(k & 1)) { RA = 0; break; } const c = 3 + p * 20, d = (kk - c) / (3 + p * 4); RA = (1 / kk) * (0.4 + 1.6 * Math.exp(-0.5 * d * d)); break; }
      case 9: RA = (1 / kk) * (0.5 + 0.5 * Math.cos(2 * 3.14159265 * kk * p * 0.5)); break;
      case 10: { const lim = 1 + p * 120; RA = kk <= lim ? 1 : 0; break; }
      default: RA = 1 / kk; RP = p * whash(k, 11);
    }
  }
  function buildTable(t) {
    const data = new Float32Array(kMips * kFrames * (kTabN + 1)), acc = new Float64Array(kTabN);
    for (let f = 0; f < kFrames; ++f) {
      const p = f / (kFrames - 1); acc.fill(0); let done = 0;
      for (let m = kMips - 1; m >= 0; --m) {
        const H = kMaxH >> m;
        for (let k = done + 1; k <= H; ++k) { recipe(t, p, k); const a = RA; if (a === 0) continue; let idx = ((RP * kTabN) | 0) & (kTabN - 1); for (let n = 0; n < kTabN; ++n) { acc[n] += a * sinT[idx]; idx = (idx + k) & (kTabN - 1); } }
        done = H; const o = (m * kFrames + f) * (kTabN + 1); for (let n = 0; n < kTabN; ++n) data[o + n] = acc[n];
      }
      let pk = 1e-6; const o0 = f * (kTabN + 1); for (let n = 0; n < kTabN; ++n) pk = Math.max(pk, Math.abs(data[o0 + n])); const sc = 0.9 / pk;
      for (let m = 0; m < kMips; ++m) { const o = (m * kFrames + f) * (kTabN + 1); for (let n = 0; n < kTabN; ++n) data[o + n] *= sc; data[o + kTabN] = data[o]; }
    }
    return data;
  }
  function wtRead(t, hz, sr, phase, pos) {
    const d = TABS[t] || (TABS[t] = buildTable(t)); let m = 0; while (m < kMips - 1 && hz * (kMaxH >> m) > 0.5 * sr) ++m;
    const fp = Math.min(Math.max(pos, 0), 1) * (kFrames - 1), f0 = Math.min(fp | 0, kFrames - 2), ff = fp - f0, x = (phase - Math.floor(phase)) * kTabN, i = x | 0, fr = x - i;
    const oa = (m * kFrames + f0) * (kTabN + 1) + i, ob = oa + (kTabN + 1), va = d[oa] + (d[oa + 1] - d[oa]) * fr, vb = d[ob] + (d[ob + 1] - d[ob]) * fr; return va + (vb - va) * ff;
  }

  /* ---- body table (modal bell bodies) */
  const BODY = [
    ['Gong', [1, 1.59, 2.14, 2.30, 2.65, 2.92, 3.16, 3.50], [1, .8, .7, .6, .5, .4, .35, .3], [7, 5, 4, 3.5, 3, 2.5, 2, 1.6]], ['Singing bowl', [1, 2.71, 5.15, 8.43], [1, .6, .35, .2], [8, 5, 3, 2]],
    ['Church bell', [.5, 1, 1.2, 1.5, 2, 2.5, 3, 4], [.6, 1, .8, .6, .5, .35, .25, .15], [9, 7, 6, 5, 4, 3, 2.5, 2]], ['Sitar gourd', [1, 2.0, 3.02, 4.1, 5.3, 6.9], [1, .8, .7, .55, .4, .3], [3.5, 3, 2.5, 2, 1.6, 1.2]],
    ['Tabla', [1, 2, 3, 4, 5, 6], [1, .7, .5, .35, .25, .2], [.9, .7, .5, .35, .25, .2]], ['Spanish guitar', [1, 1.98, 2.97, 4.02, 5.01, 6.1], [1, .6, .5, .35, .25, .2], [2.2, 1.8, 1.4, 1.1, .8, .6]],
    ['Handpan', [1, 2.0, 3.0, 4.01], [1, .6, .35, .15], [3.5, 2.5, 1.6, .9]], ['Steel drum', [1, 2, 3, 4, 1.003, 2.004, 3.005, 4.006], [1, .8, .5, .3, .7, .55, .35, .2], [1.4, 1.1, .8, .5, 1.4, 1.1, .8, .5]],
    ['Gamelan', [1, 2.76, 5.40, 8.93, 1.006, 2.77, 5.42, 8.95], [1, .55, .3, .15, .8, .45, .25, .12], [3.2, 1.4, .6, .25, 3.2, 1.4, .6, .25]], ['Kalimba', [1, 5.4, 13.3], [1, .5, .15], [1.8, .4, .12]],
    ['Marimba bar', [1, 3.93, 9.2], [1, .5, .2], [1.2, .35, .1]], ['Wine glass', [1, 2.32, 4.25], [1, .35, .12], [5, 3, 1.5]]].map(b => ({ name: b[0], n: b[1].length, ratio: b[1], amp: b[2], t60: b[3] }));

  /* ---- noise sources (noisegen.h) */
  const NOISE_NAMES = ['White', 'Pink', 'Brown', 'Blue', 'Violet', 'Grey', 'Velvet', 'Dust', 'Vinyl crackle', 'Tape hiss', 'Mains hum', 'C64 SID', 'NES long', 'NES metallic', 'Atari / AY', 'Stepped', 'Looped buzz', 'Logistic chaos', 'Lorenz chaos', 'Henon chaos', 'Rain', 'Wind', 'Fire', 'Radio static', 'Motor', 'Fan', 'Clock ticks', 'Machinery', 'Sparks'];
  const NTypeCount = 29, NGrey = 5;
  const expMap = (t, lo, hi) => lo * Math.pow(hi / lo, clampf(t, 0, 1));
  class NoiseSrc {
    constructor() { this.rings = []; for (let i = 0; i < 4; ++i) this.rings.push({ f: 0, a: 0, p: 0 }); this.hum = new Float64Array(8); this.rng = new Rng(1); this.sr = 48000; this.loop = new Float32Array(8); }
    init(sr, seed) {
      this.sr = sr; this.rng.s = (Math.imul(seed, 2654435761) + 12345) >>> 0 || 1; this.sid = 0x7FFFF8; this.nes = 1; this.atari = 1; this.acc = 0; this.held = 0; this.lx = 0.3; this.ly = 1; this.lz = 1; this.zx = 0.1; this.zy = 0; this.zz = 0; this.hx = 0.1; this.hy = 0.1;
      const n = ((sr / 20) | 0) + 4; if (this.loop.length !== n) this.loop = new Float32Array(n); for (let i = 0; i < n; ++i) this.loop[i] = this.rng.bi(); this.lp = 0;
      this.env = 0; this.env2 = 0; this.ph = 0; this.ph2 = 0; this.lo1 = this.lo2 = this.lo3 = 0; this.bp1 = this.bp2 = 0; this.fc = 800; this.fcT = 800; this.wow = 0; this.wowT = 0; this.tick = false; for (const r of this.rings) { r.f = r.a = r.p = 0; } this.hum.fill(0);
      const c = h => Math.exp(-2 * Math.PI * h / sr); this.c1500 = c(1500); this.c40 = c(40); this.c1800 = c(1800); this.c80 = c(80); this.c2500 = c(2500); this.c6000 = c(6000); this.c60 = c(60); this.c900 = c(900); this.c70 = c(70);
    }
    poisson(per) { return this.rng.uni() < per / this.sr; }
    next(type, speed) {
      const r = this.rng, sr = this.sr;
      switch (type) {
        case 0: case 1: case 2: case 3: case 4: case 5: return r.bi() * 0.866;
        case 6: return this.poisson(expMap(speed, 20, 4000)) ? (r.uni() < 0.5 ? 1 : -1) : 0;
        case 7: return this.poisson(expMap(speed, 20, 4000)) ? r.uni() : 0;
        case 8: { // vinyl
          const g = this.rings[0]; if (this.poisson(expMap(speed, 3, 120))) { const a = r.uni(); g.a = (r.uni() < 0.5 ? 1 : -1) * a * a * a * 3; g.f = 2500 + 2000 * r.uni(); g.p = 0; }
          g.p += 2 * Math.PI * g.f / sr; const pop = Math.sin(g.p) * g.a; g.a *= Math.exp(-1 / (0.0015 * sr));
          const w1 = r.bi(); this.lo2 = r.bi() * (1 - this.c1500) + this.lo2 * this.c1500; const hiss = (w1 - this.lo2) * 0.03; this.lo3 = r.bi() * (1 - this.c40) + this.lo3 * this.c40; return pop + hiss + this.lo3 * 0.6; }
        case 9: { if (this.poisson(0.5 + 3 * speed)) this.wowT = r.bi() * 0.25; this.wow += (this.wowT - this.wow) * 0.0005; const w = r.bi(); this.lo1 = w * (1 - this.c1800) + this.lo1 * this.c1800;
          this.lo2 = r.bi() * (1 - this.c80) + this.lo2 * this.c80; return (w - this.lo1 * 0.9) * 0.9 * (1 + this.wow) + this.lo2 * 0.05; }
        case 10: { const f0 = 30 + 90 * speed; let s = 0; for (let k = 1; k <= 8; ++k) { let h = this.hum[k - 1] + 2 * Math.PI * f0 * k / sr; if (h > 2 * Math.PI) h -= 2 * Math.PI; this.hum[k - 1] = h; s += Math.sin(h) * (k & 1 ? 1 : 0.5) / Math.pow(k, 0.9); } return s * 0.45 + r.bi() * 0.004; }
        case 11: { this.acc += expMap(speed, 100, 400000) / sr; let g = 0; while (this.acc >= 1 && g++ < 64) { this.acc -= 1; const bit = ((this.sid >> 22) ^ (this.sid >> 17)) & 1; this.sid = ((this.sid << 1) | bit) & 0x7FFFFF; } if (this.acc >= 1) this.acc = 0;
          const s = this.sid, b = (((s >> 22) & 1) << 7) | (((s >> 20) & 1) << 6) | (((s >> 16) & 1) << 5) | (((s >> 13) & 1) << 4) | (((s >> 11) & 1) << 3) | (((s >> 7) & 1) << 2) | (((s >> 4) & 1) << 1) | ((s >> 2) & 1); return (b - 127.5) / 127.5 * 0.7; }
        case 12: case 13: { this.acc += expMap(speed, 100, 400000) / sr; let g = 0; const sh = type === 13 ? 6 : 1; while (this.acc >= 1 && g++ < 64) { this.acc -= 1; const fb = (this.nes & 1) ^ ((this.nes >> sh) & 1); this.nes = (this.nes >> 1) | (fb << 14); } if (this.acc >= 1) this.acc = 0; return (this.nes & 1) ? -0.6 : 0.6; }
        case 14: { this.acc += expMap(speed, 100, 400000) / sr; let g = 0; while (this.acc >= 1 && g++ < 64) { this.acc -= 1; const fb = (this.atari ^ (this.atari >> 3)) & 1; this.atari = (this.atari >> 1) | (fb << 16); } if (this.acc >= 1) this.acc = 0; return (this.atari & 1) ? 0.6 : -0.6; }
        case 15: { this.acc += expMap(speed, 20, sr * 0.5) / sr; if (this.acc >= 1) { this.acc -= Math.floor(this.acc); this.held = r.bi(); } return this.held * 0.8; }
        case 16: { const len = Math.max(4, (sr / expMap(speed, 20, 2000)) | 0); this.lp = (this.lp + 1) % len; return this.loop[this.lp] * 0.8; }
        case 17: { this.acc += expMap(speed, 200, sr) / sr; while (this.acc >= 1) { this.acc -= 1; this.lx = 3.9 * this.lx * (1 - this.lx); if (this.lx <= 0.0001 || this.lx >= 0.9999) this.lx = 0.3 + 0.4 * r.uni(); } return (this.lx * 2 - 1) * 0.9; }
        case 18: { const dt = 0.0004 + 0.012 * speed * speed; for (let i = 0; i < 2; ++i) { const dx = 10 * (this.zy - this.zx), dy = this.zx * (28 - this.zz) - this.zy, dz = this.zx * this.zy - (8 / 3) * this.zz; this.zx += dx * dt; this.zy += dy * dt; this.zz += dz * dt; }
          if (!isFinite(this.zx) || Math.abs(this.zx) > 100) { this.zx = 0.1; this.zy = 0; this.zz = 0; } return clampf(this.zx / 20, -1, 1); }
        case 19: { const a = 1 + 0.4 * speed, nx = 1 - a * this.hx * this.hx + this.hy; this.hy = 0.3 * this.hx; this.hx = nx; if (!isFinite(this.hx) || Math.abs(this.hx) > 5) { this.hx = 0.1; this.hy = 0.1; } return clampf(this.hx / 1.3, -1, 1); }
        case 20: { if (this.poisson(expMap(speed, 40, 3000))) this.env = 0.2 + r.uni(); this.env *= 0.995; const w = r.bi(); this.lo1 = w * (1 - this.c2500) + this.lo1 * this.c2500; this.lo2 = r.bi() * (1 - this.c6000) + this.lo2 * this.c6000; return (w - this.lo1) * this.env * 1.2 + this.lo2 * 0.12; }
        case 21: { if (this.poisson(0.5 + 8 * speed)) this.fcT = 150 + 1700 * r.uni(); this.fc += (this.fcT - this.fc) * (0.5 / sr * (1 + 6 * speed)); const f = 2 * Math.sin(Math.PI * this.fc / sr), q = 0.5, hp = r.bi() - this.bp2 - q * this.bp1; this.bp1 += f * hp; this.bp2 += f * this.bp1; return clampf(this.bp1, -2, 2) * 0.9; }
        case 22: { if (this.poisson(expMap(speed, 5, 150))) { this.env = 0.4 + r.uni(); this.env2 = 0.9985 + 0.0012 * r.uni(); } this.env *= this.env2 > 0 ? this.env2 : 0.998; this.lo1 = r.bi() * (1 - this.c2500) + this.lo1 * this.c2500; this.lo2 = r.bi() * (1 - this.c60) + this.lo2 * this.c60; return this.lo1 * this.env * 3 + this.lo2 * 0.5; }
        case 23: { if (this.poisson(0.3 + 4 * speed)) this.wowT = r.uni(); this.wow += (this.wowT - this.wow) * (2 / sr); if (this.poisson(0.2 + 1.5 * speed)) this.fcT = 600 + 2400 * r.uni(); this.fc += (this.fcT - this.fc) * (3 / sr);
          this.ph += 2 * Math.PI * this.fc / sr; if (this.ph > 2 * Math.PI) this.ph -= 2 * Math.PI; const wh = this.wow > 0.8 ? Math.sin(this.ph) * (this.wow - 0.8) * 2 : 0; return r.bi() * (0.25 + 0.6 * this.wow) + wh * 0.5 + (this.poisson(30) ? r.bi() * 1.5 : 0); }
        case 24: { const f0 = 5 + 95 * speed * speed; this.ph += 2 * Math.PI * f0 / sr; if (this.ph > 2 * Math.PI) this.ph -= 2 * Math.PI; let s = 0; for (let k = 1; k <= 6; ++k) s += Math.sin(this.ph * k) / k;
          this.lo1 = r.bi() * (1 - this.c900) + this.lo1 * this.c900; return s * 0.4 + this.lo1 * (0.7 + 0.5 * Math.sin(this.ph)) * 0.8; }
        case 25: { const fc = expMap(speed, 300, 4000), f = 2 * Math.sin(Math.PI * fc / sr), q = 0.12, hp = r.bi() - this.bp2 - q * this.bp1; this.bp1 += f * hp; this.bp2 += f * this.bp1; this.ph += 2 * Math.PI * (30 + 90 * speed) / sr; if (this.ph > 2 * Math.PI) this.ph -= 2 * Math.PI; return clampf(this.bp1, -3, 3) * 0.5 * (1 + 0.3 * Math.sin(this.ph)); }
        case 26: { this.acc += expMap(speed, 0.5, 20) / sr * (1 + 0.02 * r.bi()); if (this.acc >= 1) { this.acc -= 1; this.env = 1; this.tick = !this.tick; this.ph2 = 0; } this.env *= 0.99; this.ph2 += 2 * Math.PI * (this.tick ? 1700 : 1250) / sr; return (r.bi() * 0.5 + Math.sin(this.ph2)) * this.env * this.env * 0.8; }
        case 27: { if (this.poisson(expMap(speed, 0.5, 10))) { const base = 150 + 450 * r.uni(), rt = [1, 2.76, 5.4, 8.93]; for (let k = 0; k < 4; ++k) { this.rings[k].f = base * rt[k]; this.rings[k].a = 0.6 / (1 + k); this.rings[k].p = 0; } }
          let s = 0; for (let k = 0; k < 4; ++k) { const g = this.rings[k]; g.p += 2 * Math.PI * g.f / sr; s += Math.sin(g.p) * g.a; g.a *= 0.99985; } this.lo1 = r.bi() * (1 - this.c70) + this.lo1 * this.c70; return s * 0.6 + this.lo1 * 0.4; }
        default: { if (this.poisson(expMap(speed, 3, 400))) { this.fc = 500 + 8500 * r.uni() * r.uni(); this.env = 0.5 + r.uni(); } this.env *= 0.9991; const f = 2 * Math.sin(Math.PI * Math.min(this.fc, 18000) / sr), q = 0.06, hp = r.bi() - this.bp2 - q * this.bp1; this.bp1 += f * hp; this.bp2 += f * this.bp1; return clampf(this.bp1, -4, 4) * this.env * 0.35; }
      }
    }
  }
  class SlopeLadder { // coloured noise slope (for the Noiszical pedal)
    constructor() { this.n = 0; this.b0 = new Float64Array(20); this.b1 = new Float64Array(20); this.a1 = new Float64Array(20); this.gain = 1; this.z = [new Float64Array(20), new Float64Array(20)]; }
    configure(slope, sr) {
      this.n = 0; this.gain = 1; if (Math.abs(slope) < 0.02) return; const K = 2 * sr, dec = 0.3, shift = -slope * 3.3219 * dec / 20;
      for (let lf = Math.log10(15); this.n < 20; lf += dec) { const fp = Math.pow(10, lf); if (fp > sr * 0.45) break; const fz = clampf(fp * Math.pow(10, shift), 5, sr * 0.49), wp = K * Math.tan(Math.PI * fp / sr), wz = K * Math.tan(Math.PI * fz / sr);
        this.b0[this.n] = (wz + K) / (wp + K); this.b1[this.n] = (wz - K) / (wp + K); this.a1[this.n] = (wp - K) / (wp + K); ++this.n; }
      let acc = 0; const M = 512; for (let i = 1; i <= M; ++i) { const w = Math.PI * i / M; let hr = 1, hi = 0; const cr = Math.cos(w), ci = -Math.sin(w);
        for (let k = 0; k < this.n; ++k) { const nr = this.b0[k] + this.b1[k] * cr, ni = this.b1[k] * ci, dr = 1 + this.a1[k] * cr, di = this.a1[k] * ci, dd = dr * dr + di * di, qr = (nr * dr + ni * di) / dd, qi = (ni * dr - nr * di) / dd; const t = hr * qr - hi * qi; hi = hr * qi + hi * qr; hr = t; }
        acc += hr * hr + hi * hi; } this.gain = 1 / Math.sqrt(acc / M); this.z[0].fill(0); this.z[1].fill(0);
    }
    run(ch, x) { if (!this.n) return x; const z = this.z[ch]; for (let k = 0; k < this.n; ++k) { const y = this.b0[k] * x + z[k]; z[k] = this.b1[k] * x - this.a1[k] * y; x = y; } return x * this.gain; }
    reset() { this.z[0].fill(0); this.z[1].fill(0); }
  }
  /* ---- Apparatus: a subset of the Boardica pedals. Q = pedal parameter spec; dials map 0..1 onto these. */
  const Q = (name, min, max, def, log, labels) => ({ name, min, max, def, log: !!log, labels: labels || null });
  const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  class Fxd {
    constructor(sr, ps) { this.sr = sr; this.ps = ps; this.v = Float64Array.from(ps.map(p => p.def)); this.tempo = 120; }
    set(i, x) { if (i >= 0 && i < this.v.length) { this.v[i] = x; this.cfg(); } }
    cfg() { }
  }
  const FXLIST = [];
  const reg = (name, ps, cls) => FXLIST.push({ name, ps, make: sr => new cls(sr, ps) });

  const PS_BIT = [Q('Bits', 4, 16, 8), Q('Rate', 500, 48000, 12000, true), Q('Dither', 0, 1, 0, false, ['Off', 'On']), Q('Drive', 0, 24, 0), Q('Mix', 0, 100, 100), Q('Output', -24, 12, 0)];
  class Bitsmashica extends Fxd {
    constructor(sr, ps) { super(sr, ps); this.mix = new Smooth(); this.out = new Smooth(); this.drive = new Smooth(); for (const s of [this.mix, this.out, this.drive]) s.setTime(0.02, sr); this.rng = new Rng(7); this.hold = [0, 0]; this.phase = 1; this.cfg(); this.mix.reset(this.mix.target); this.out.reset(this.out.target); this.drive.reset(this.drive.target); }
    cfg() { const v = this.v; this.mix.target = v[4] / 100; this.out.target = dbToGain(v[5]); this.drive.target = dbToGain(v[3]); }
    process(iL, iR, oL, oR, n) {
      const v = this.v, step = Math.min(1, v[1] / this.sr), levels = Math.pow(2, v[0] - 1), dither = v[2] > 0.5, h = this.hold;
      for (let i = 0; i < n; ++i) {
        const dr = this.drive.next(), m = this.mix.next(), o = this.out.next(); this.phase += step;
        if (this.phase >= 1) { this.phase -= 1; for (let s = 0; s < 2; ++s) { let x = clampf((s ? iR[i] : iL[i]) * dr, -1, 1); if (dither) x += (this.rng.uni() - this.rng.uni()) / levels; h[s] = clampf(Math.round(x * levels) / levels, -1, 1); } }
        oL[i] = (iL[i] * (1 - m) + h[0] * m) * o; oR[i] = (iR[i] * (1 - m) + h[1] * m) * o;
      }
    }
  }
  reg('Bitsmashica', PS_BIT, Bitsmashica);

  const PS_BODY = [Q('Body', 0, BODY.length - 1, 0, false, BODY.map(b => b.name)), Q('Tonic', 0, 11, 0, false, KEYS), Q('Octave', -2, 3, 0), Q('Tune', -100, 100, 0), Q('Decay', 0.1, 4, 1, true), Q('Brightness', 0, 100, 60), Q('Stereo spread', 0, 100, 40), Q('Drive', 0, 100, 25), Q('Mix', 0, 100, 40)];
  class Bodica extends Fxd {
    constructor(sr, ps) { super(sr, ps); this.m = [[], []]; for (let c = 0; c < 2; ++c) for (let k = 0; k < 10; ++k) this.m[c].push(new Svf()); this.amp = new Float64Array(10); this.nm = 0; this.cfg(); }
    cfg() {
      const v = this.v, b = BODY[clampf(Math.round(v[0]), 0, BODY.length - 1)], f0 = midiHz(48 + v[1] + 12 * Math.round(v[2]) + v[3] / 100); this.nm = 0; const bright = v[5] / 100, spread = v[6] / 100 * 0.012;
      for (let k = 0; k < b.n && k < 10; ++k) { const f = f0 * b.ratio[k]; if (f > this.sr * 0.42) continue; const t60 = Math.max(0.05, b.t60[k] * v[4]), q = Math.max(0.6, 3.14159 * f * t60 / 6.91), g = 1.5 * Math.sqrt(q);
        for (let c = 0; c < 2; ++c) this.m[c][this.nm].set(f * (1 + (c ? spread : -spread)), q, this.sr); this.amp[this.nm] = g * b.amp[k] * Math.pow(0.35 + 0.65 * bright, k * 0.5) * (k === 0 ? 1 : 0.7); ++this.nm; }
    }
    process(iL, iR, oL, oR, n) {
      const v = this.v, mix = v[8] / 100, drive = 1 + v[7] / 100 * 5, nm = this.nm, m = this.m;
      for (let i = 0; i < n; ++i) {
        const x0 = fastTanh(iL[i] * drive) / drive, x1 = fastTanh(iR[i] * drive) / drive; let w0 = 0, w1 = 0;
        for (let k = 0; k < nm; ++k) { const a = m[0][k]; a.run(x0 * 0.5 + x1 * 0.5); w0 += a.band * a.k * this.amp[k]; const b = m[1][k]; b.run(x1 * 0.5 + x0 * 0.5); w1 += b.band * b.k * this.amp[k]; }
        oL[i] = iL[i] * (1 - mix * 0.5) + fastTanh(w0) * mix * 1.4; oR[i] = iR[i] * (1 - mix * 0.5) + fastTanh(w1) * mix * 1.4;
      }
    }
  }
  reg('Bodica', PS_BODY, Bodica);

  const PS_CHO = [Q('Mode', 0, 2, 0, false, ['Chorus', 'Vibrato', 'Doubler']), Q('Rate', 0.05, 8, 0.8, true), Q('Depth', 0, 100, 50), Q('Voices', 0, 2, 1, false, ['1', '2', '3']), Q('Width', 0, 100, 80), Q('Tone', 0, 100, 60), Q('Mix', 0, 100, 50)];
  class Chorusica extends Fxd {
    constructor(sr, ps) { super(sr, ps); this.line = [new DelayLine((0.08 * sr) | 0), new DelayLine((0.08 * sr) | 0)]; this.lp = [new OP(), new OP()]; this.walkS = []; for (let i = 0; i < 6; ++i) this.walkS.push(new OP()); this.walk = new Float64Array(6); this.walkCtr = 0; this.phase = 0;
      this.mix = new Smooth(); this.depth = new Smooth(); this.mix.setTime(0.03, sr); this.depth.setTime(0.05, sr); this.rng = new Rng(11); this.cfg(); this.mix.reset(this.mix.target); this.depth.reset(this.depth.target); }
    cfg() { const v = this.v; for (let s = 0; s < 2; ++s) this.lp[s].set(3000 + v[5] / 100 * 15000, this.sr); for (const w of this.walkS) w.set(1.5, this.sr); this.mix.target = v[6] / 100; this.depth.target = v[2] / 100; }
    process(iL, iR, oL, oR, n) {
      const v = this.v, mode = Math.floor(v[0]), voices = Math.floor(v[3]) + 1, width = v[4] / 100, inc = v[1] / this.sr, sr = this.sr;
      for (let i = 0; i < n; ++i) {
        this.phase += inc; if (this.phase >= 1) this.phase -= 1; const dep = this.depth.next(), m = this.mix.next(); this.line[0].push(iL[i]); this.line[1].push(iR[i]); const wet = [0, 0];
        for (let s = 0; s < 2; ++s) {
          for (let k = 0; k < voices; ++k) {
            let d;
            if (mode === 2) { if (s === 0 && k === 0 && ((++this.walkCtr) & 63) === 0) for (let j = 0; j < 6; ++j) this.walk[j] = clampf(this.walk[j] + this.rng.bi() * 0.08, -1, 1); d = (0.022 + 0.004 * k + 0.003 * s) * sr + this.walkS[s * 3 + k].run(this.walk[s * 3 + k]) * dep * 0.003 * sr; }
            else { const ph = this.phase + k / voices + (s ? 0.25 * width : 0), lfo = Math.sin(2 * Math.PI * ph), base = mode === 1 ? 0.004 : 0.007 + 0.0015 * k, sweep = mode === 1 ? 0.003 : 0.005; d = (base + sweep * dep * 0.5 * (1 + lfo)) * sr; }
            wet[s] += this.line[s].read(Math.max(2, d));
          }
          wet[s] = this.lp[s].run(wet[s] / Math.sqrt(voices));
        }
        const mid = 0.5 * (wet[0] + wet[1]), side = 0.5 * (wet[0] - wet[1]) * (0.3 + 0.7 * width), mm = mode === 1 ? 1 : m;
        oL[i] = iL[i] * (1 - mm) + (mid + side) * mm; oR[i] = iR[i] * (1 - mm) + (mid - side) * mm;
      }
    }
  }
  reg('Chorusica', PS_CHO, Chorusica);

  const PS_COMP = [Q('Threshold', -60, 0, -18), Q('Ratio', 1, 20, 4, true), Q('Attack', 0.1, 200, 10, true), Q('Release', 10, 2000, 120, true), Q('Knee', 0, 24, 6), Q('Makeup', 0, 24, 0), Q('Auto makeup', 0, 1, 0, false, ['Off', 'On']), Q('Detector', 0, 1, 0, false, ['Peak', 'RMS']), Q('Side-chain HPF', 20, 500, 20, true), Q('Mix', 0, 100, 100)];
  class Compressica extends Fxd {
    constructor(sr, ps) { super(sr, ps); this.hp = [new Biquad(), new Biquad()]; this.mix = new Smooth(); this.mk = new Smooth(); this.mix.setTime(0.02, sr); this.mk.setTime(0.02, sr); this.gr = 0; this.ms = 0; this.cfg(); this.mix.reset(this.mix.target); this.mk.reset(this.mk.target); }
    makeup() { const v = this.v; let db = v[5]; if (v[6] > 0.5) db += -v[0] * (1 - 1 / Math.max(1, v[1])) * 0.5; return dbToGain(db); }
    cfg() { const v = this.v, sr = this.sr; for (const h of this.hp) h.set(BQ.HighPass, v[8], 0.7071, 0, sr); this.atk = Math.exp(-1 / Math.max(1, v[2] * 0.001 * sr)); this.rel = Math.exp(-1 / Math.max(1, v[3] * 0.001 * sr)); this.rmsC = Math.exp(-1 / (0.01 * sr)); this.mix.target = v[9] / 100; this.mk.target = this.makeup(); }
    process(iL, iR, oL, oR, n) {
      const v = this.v, T = v[0], R = Math.max(1, v[1]), W = v[4], rms = v[7] > 0.5;
      for (let i = 0; i < n; ++i) {
        const sl = this.hp[0].run(iL[i]), sr = this.hp[1].run(iR[i]); let level;
        if (rms) { const p = 0.5 * (sl * sl + sr * sr); this.ms = p + (this.ms - p) * this.rmsC; level = Math.sqrt(this.ms); } else level = Math.max(Math.abs(sl), Math.abs(sr));
        const x = 20 * Math.log10(Math.max(level, 1e-6)), over = x - T; let y;
        if (2 * over < -W) y = x; else if (2 * Math.abs(over) <= W) { const t = over + W * 0.5; y = x + (1 / R - 1) * t * t / (2 * W); } else y = T + over / R;
        const target = y - x; this.gr = target < this.gr ? target + (this.gr - target) * this.atk : target + (this.gr - target) * this.rel;
        const g = Math.pow(10, this.gr / 20) * this.mk.next(), m = this.mix.next(); oL[i] = iL[i] * (1 - m) + iL[i] * g * m; oR[i] = iR[i] * (1 - m) + iR[i] * g * m;
      }
    }
  }
  reg('Compressica', PS_COMP, Compressica);

  const PS_DLY = [Q('Mode', 0, 1, 0, false, ['Bucket brigade', 'Tape']), Q('Time', 10, 2000, 350, true), Q('Sync', 0, 12, 0, false, ['Off', '1/32', '1/16T', '1/16', '1/16D', '1/8T', '1/8', '1/8D', '1/4T', '1/4', '1/4D', '1/2', '1 bar']),
    Q('Feedback', 0, 100, 40), Q('Tone', 0, 100, 50), Q('Character', 0, 100, 40), Q('Ping-pong', 0, 1, 0, false, ['Off', 'On']), Q('Mix', 0, 100, 30)];
  class Delayica extends Fxd {
    constructor(sr, ps) { super(sr, ps); const n = (2.6 * sr) | 0; this.line = [new DelayLine(n), new DelayLine(n)]; this.lp = [new OP(), new OP()]; this.lp2 = [new OP(), new OP()]; this.hp = [new OH(), new OH()]; this.noise = new Rng(5);
      this.time = new Smooth(); this.mix = new Smooth(); this.fb = new Smooth(); this.mix.setTime(0.03, sr); this.fb.setTime(0.03, sr); this.wow = 0; this.flut = 0; this.lastTempo = 0; this.cfg(); this.time.reset(this.time.target); this.mix.reset(this.mix.target); this.fb.reset(this.fb.target); }
    targetSamples() { const b = [0, 0.125, 1 / 6, 0.25, 0.375, 1 / 3, 0.5, 0.75, 2 / 3, 1, 1.5, 2, 4], v = this.v, s = clampf(Math.floor(v[2]), 0, 12), ms = s === 0 ? v[1] : b[s] * 60000 / Math.max(20, this.tempo); return clampf(ms * 0.001 * this.sr, 2, 2.5 * this.sr); }
    cfg() {
      const v = this.v, sr = this.sr, tape = v[0] > 0.5, tone = v[4] / 100, ms = this.targetSamples() / sr * 1000; this.time.setTime(tape ? 0.35 : 0.08, sr); this.time.target = this.targetSamples();
      const cut = tape ? 2500 + tone * 9000 : (1500 + tone * 4500) * clampf(Math.pow(300 / Math.max(ms, 30), 0.35), 0.45, 1.6);
      for (let s = 0; s < 2; ++s) { this.lp[s].set(cut, sr); this.lp2[s].set(cut * 1.6, sr); this.hp[s].set(tape ? 90 : 140, sr); } this.mix.target = v[7] / 100; this.fb.target = Math.min(0.98, v[3] / 100 * 1.02);
    }
    process(iL, iR, oL, oR, n) {
      if (this.lastTempo !== this.tempo) { this.lastTempo = this.tempo; this.cfg(); }
      const v = this.v, tape = v[0] > 0.5, ping = v[6] > 0.5, ch = v[5] / 100, sr = this.sr, wInc = 2 * Math.PI * 0.55 / sr, fInc = 2 * Math.PI * 6.5 / sr, L = this.line;
      for (let i = 0; i < n; ++i) {
        const t = this.time.next(), fb = this.fb.next(), m = this.mix.next(); let mod = 0;
        if (tape) { this.wow += wInc; this.flut += fInc; if (this.wow > 2 * Math.PI) this.wow -= 2 * Math.PI; if (this.flut > 2 * Math.PI) this.flut -= 2 * Math.PI; mod = ch * (0.0035 * Math.sin(this.wow) + 0.00035 * Math.sin(this.flut)) * sr; }
        const y0 = L[0].read(Math.max(2, t + mod)), y1 = L[1].read(Math.max(2, t + mod * 0.9)); let w0 = this.hp[0].run(this.lp2[0].run(this.lp[0].run(y0))), w1 = this.hp[1].run(this.lp2[1].run(this.lp[1].run(y1)));
        if (tape) { w0 = fastTanh(w0 * (1 + ch)) / (1 + ch); w1 = fastTanh(w1 * (1 + ch)) / (1 + ch); } else { w0 = fastTanh(w0 * 1.4) / 1.4; w0 += this.noise.bi() * 0.0006 * ch; w1 = fastTanh(w1 * 1.4) / 1.4; w1 += this.noise.bi() * 0.0006 * ch; }
        const xl = iL[i], xr = iR[i];
        if (ping) { L[0].push(0.5 * (xl + xr) + w1 * fb); L[1].push(w0 * fb); } else { L[0].push(xl + w0 * fb); L[1].push(xr + w1 * fb); }
        oL[i] = xl * (1 - m) + y0 * m; oR[i] = xr * (1 - m) + y1 * m;
      }
    }
  }
  reg('Delayica', PS_DLY, Delayica);

  const PS_EQ = [Q('Low cut', 0, 1, 0, false, ['Off', 'On']), Q('Low cut freq', 20, 1000, 40, true), Q('Low type', 0, 1, 0, false, ['Shelf', 'Bell']), Q('Low freq', 20, 1000, 100, true), Q('Low gain', -18, 18, 0), Q('Low Q', 0.3, 6, 0.7, true),
    Q('Low-mid freq', 50, 2000, 400, true), Q('Low-mid gain', -18, 18, 0), Q('Low-mid Q', 0.3, 10, 1, true), Q('Mid freq', 200, 8000, 1500, true), Q('Mid gain', -18, 18, 0), Q('Mid Q', 0.3, 10, 1, true),
    Q('High-mid freq', 1000, 16000, 4000, true), Q('High-mid gain', -18, 18, 0), Q('High-mid Q', 0.3, 10, 1, true), Q('High type', 0, 1, 0, false, ['Shelf', 'Bell']), Q('High freq', 2000, 20000, 10000, true), Q('High gain', -18, 18, 0), Q('High Q', 0.3, 6, 0.7, true),
    Q('High cut', 0, 1, 0, false, ['Off', 'On']), Q('High cut freq', 2000, 20000, 18000, true), Q('Output', -18, 18, 0)];
  class EQualica extends Fxd {
    constructor(sr, ps) { super(sr, ps); this.f = [[], []]; for (let c = 0; c < 2; ++c) for (let k = 0; k < 7; ++k) this.f[c].push(new Biquad()); this.on = new Array(7).fill(false); this.out = new Smooth(); this.out.setTime(0.02, sr); this.cfg(); this.out.reset(this.out.target); }
    cfg() {
      const v = this.v, sr = this.sr, both = (k, t, fr, q, g) => { for (const ch of this.f) { const b = ch[k], nb = new Biquad(); nb.set(t, fr, q, g, sr); b.b0 = nb.b0; b.b1 = nb.b1; b.b2 = nb.b2; b.a1 = nb.a1; b.a2 = nb.a2; } };
      if (v[0] > 0.5 && !this.on[0]) for (const ch of this.f) ch[0].reset(); this.on[0] = v[0] > 0.5; both(0, BQ.HighPass, v[1], 0.7071, 0);
      both(1, v[2] > 0.5 ? BQ.Peak : BQ.LowShelf, v[3], v[5], v[4]); this.on[1] = true; both(2, BQ.Peak, v[6], v[8], v[7]); this.on[2] = true; both(3, BQ.Peak, v[9], v[11], v[10]); this.on[3] = true; both(4, BQ.Peak, v[12], v[14], v[13]); this.on[4] = true;
      both(5, v[15] > 0.5 ? BQ.Peak : BQ.HighShelf, v[16], v[18], v[17]); this.on[5] = true; if (v[19] > 0.5 && !this.on[6]) for (const ch of this.f) ch[6].reset(); this.on[6] = v[19] > 0.5; both(6, BQ.LowPass, v[20], 0.7071, 0); this.out.target = dbToGain(v[21]);
    }
    process(iL, iR, oL, oR, n) { for (let i = 0; i < n; ++i) { let l = iL[i], r = iR[i]; for (let k = 0; k < 7; ++k) if (this.on[k]) { l = this.f[0][k].run(l); r = this.f[1][k].run(r); } const g = this.out.next(); oL[i] = l * g; oR[i] = r * g; } }
  }
  reg('EQualica', PS_EQ, EQualica);

  const PS_FLA = [Q('Rate', 0.02, 10, 0.25, true), Q('Depth', 0, 100, 70), Q('Manual', 0.2, 8, 1.5, true), Q('Feedback', -90, 90, 50), Q('Width', 0, 100, 60), Q('Mix', 0, 100, 60), Q('Mode', 0, 1, 0, false, ['Classic', 'Through-zero']), Q('Polarity', 0, 1, 0, false, ['+', '-'])];
  class Flangica extends Fxd {
    constructor(sr, ps) { super(sr, ps); const n = ((0.04 * sr) | 0) + 8; this.line = [new DelayLine(n), new DelayLine(n)]; this.dry = [new DelayLine(n), new DelayLine(n)]; this.fbz = [0, 0]; this.phase = 0; this.mix = new Smooth(); this.mix.setTime(0.03, sr); this.cfg(); this.mix.reset(this.mix.target); }
    cfg() { this.mix.target = this.v[5] / 100; }
    process(iL, iR, oL, oR, n) {
      const v = this.v, depth = v[1] / 100, fb = v[3] / 100, width = v[4] / 100, inc = v[0] / this.sr, man = v[2] * 0.001 * this.sr, pol = v[7] > 0.5 ? -1 : 1, tz = v[6] > 0.5;
      for (let i = 0; i < n; ++i) {
        this.phase += inc; if (this.phase >= 1) this.phase -= 1; const m = this.mix.next();
        for (let s = 0; s < 2; ++s) {
          const x = s ? iR[i] : iL[i], lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * (this.phase + (s ? 0.25 * width : 0))); this.line[s].push(x + fb * this.fbz[s]); let o;
          if (tz) { const D0 = Math.max(4, man * 2), d = Math.max(2, D0 * (1 + (2 * lfo - 1) * depth)); this.dry[s].push(x); const wet = this.line[s].read(d), dd = this.dry[s].read(D0); this.fbz[s] = Math.tanh(wet); o = dd * (1 - 0.5 * m) + pol * wet * 0.5 * m; }
          else { const d = Math.max(2, man * (1 + 3 * depth * lfo)), wet = this.line[s].read(d); this.fbz[s] = Math.tanh(wet); o = x * (1 - 0.5 * m) + pol * wet * 0.5 * m; }
          if (s) oR[i] = o; else oL[i] = o;
        }
      }
    }
  }
  reg('Flangica', PS_FLA, Flangica);

  const PS_LIM = [Q('Gain', 0, 24, 0), Q('Ceiling', -12, 0, -0.3), Q('Release', 10, 1000, 100, true)];
  class Limitica extends Fxd {
    constructor(sr, ps) { super(sr, ps); this.n = clampf(Math.round(0.002 * sr), 4, 512); this.dly = [new Float64Array(512), new Float64Array(512)]; this.inst = new Float64Array(512).fill(1); this.mn = new Float64Array(512).fill(1); this.pos = 0; this.sum = this.n; this.env = 1; this.gain = new Smooth(); this.gain.setTime(0.02, sr); this.cfg(); this.gain.reset(this.gain.target); }
    cfg() { this.gain.target = dbToGain(this.v[0]); this.rel = Math.exp(-1 / Math.max(1, this.v[2] * 0.001 * this.sr)); }
    process(iL, iR, oL, oR, n) {
      const ceil = dbToGain(this.v[1]), N = this.n, inst = this.inst, mnA = this.mn;
      for (let i = 0; i < n; ++i) {
        const g = this.gain.next(), l = iL[i] * g, r = iR[i] * g, pk = Math.max(Math.abs(l), Math.abs(r)), w = this.pos & 511; this.dly[0][w] = l; this.dly[1][w] = r; inst[w] = pk > ceil ? ceil / pk : 1;
        let mn = 1; for (let k = 0; k < N; ++k) { const q = inst[(this.pos - k) & 511]; if (q < mn) mn = q; }
        this.sum += mn - mnA[(this.pos - N) & 511]; mnA[w] = mn; const sm = this.sum / N; this.env = sm < this.env ? sm : sm + (this.env - sm) * this.rel;
        const rd = (this.pos - (N - 1)) & 511; oL[i] = clampf(this.dly[0][rd] * this.env, -ceil, ceil); oR[i] = clampf(this.dly[1][rd] * this.env, -ceil, ceil); ++this.pos;
      }
    }
  }
  reg('Limitica', PS_LIM, Limitica);
  const PS_NZ = []; { const defs = [1, 8, 11], lv = [-30, -60, -60]; for (let l = 0; l < 3; ++l) { const p = 'ABC'[l] + ' '; PS_NZ.push(Q(p + 'Type', 0, NTypeCount - 1, defs[l], false, NOISE_NAMES), Q(p + 'Level', -60, 12, lv[l]), Q(p + 'Tone', -6, 6, 0), Q(p + 'Speed', 0, 100, 50)); }
    PS_NZ.push(Q('Mode', 0, 4, 0, false, ['Add', 'Follow', 'Fill gaps', 'Ring', 'Dropout']), Q('Amount', 0, 100, 60), Q('Sensitivity', -60, 0, -24), Q('Attack', 0.5, 500, 10, true), Q('Release', 5, 2000, 150, true), Q('Low cut', 20, 2000, 20, true), Q('High cut', 500, 20000, 20000, true),
      Q('Drive', 0, 100, 0), Q('Width', 0, 100, 100), Q('Dry', 0, 100, 100), Q('Noise', -24, 24, 0), Q('Listen', 0, 1, 0, false, ['Mix', 'Noise only'])); }
  class Noiszical extends Fxd {
    constructor(sr, ps) { super(sr, ps); this.src = []; for (let l = 0; l < 3; ++l) { const a = []; for (let c = 0; c < 2; ++c) { const s = new NoiseSrc(); s.init(sr, l * 2 + c + 1); a.push(s); } this.src.push(a); }
      this.lad = [new SlopeLadder(), new SlopeLadder(), new SlopeLadder()]; this.grey = [[new Biquad(), new Biquad(), new Biquad()], [new Biquad(), new Biquad(), new Biquad()]]; this.cut = [[new Biquad(), new Biquad()], [new Biquad(), new Biquad()]];
      this.lvl = [new Smooth(), new Smooth(), new Smooth()]; this.noiseG = new Smooth(); this.dryG = new Smooth(); for (const s of [...this.lvl, this.noiseG, this.dryG]) s.setTime(0.02, sr);
      this.env = 0; this.gate = 1; this.dn = 0; this.started = false; for (let l = 0; l < 3; ++l) this.cfgLayer(l); this.cfgOut(); for (const s of this.lvl) s.reset(s.target); this.noiseG.reset(this.noiseG.target); this.dryG.reset(this.dryG.target); }
    cfgLayer(l) {
      const v = this.v, type = Math.round(v[l * 4]), slope = (type === 1 ? -3.0103 : type === 2 ? -6.0206 : type === 3 ? 3.0103 : type === 4 ? 6.0206 : 0) + v[l * 4 + 2]; this.lad[l].configure(slope, this.sr);
      this.lvl[l].target = v[l * 4 + 1] <= -59.9 ? 0 : dbToGain(v[l * 4 + 1]); if (!this.started) this.lvl[l].cur = this.lvl[l].target;
      if (type === NGrey) for (let c = 0; c < 2; ++c) { this.grey[c][0].set(BQ.LowShelf, 150, 0.7, 14, this.sr); this.grey[c][1].set(BQ.Peak, 3500, 0.8, -7, this.sr); this.grey[c][2].set(BQ.HighShelf, 9000, 0.7, 9, this.sr); }
    }
    cfgOut() { const v = this.v; for (let c = 0; c < 2; ++c) { this.cut[c][0].set(BQ.HighPass, v[17], 0.707, 0, this.sr); this.cut[c][1].set(BQ.LowPass, v[18], 0.707, 0, this.sr); } this.noiseG.target = dbToGain(v[22]); this.dryG.target = v[21] / 100; if (!this.started) { this.noiseG.cur = this.noiseG.target; this.dryG.cur = this.dryG.target; } }
    set(i, x) { if (i < 0 || i >= this.v.length) return; this.v[i] = x; if (i < 12) this.cfgLayer((i / 4) | 0); else this.cfgOut(); }
    process(iL, iR, oL, oR, n) {
      const v = this.v, sr = this.sr, mode = Math.round(v[12]), amt = v[13] / 100, drive = v[19] / 100, wid = v[20] / 100, thr = dbToGain(v[14]), only = v[23] > 0.5;
      const aA = Math.exp(-1 / Math.max(1, v[15] * 0.001 * sr)), aR = Math.exp(-1 / Math.max(1, v[16] * 0.001 * sr)), pre = 1 + 8 * drive, post = 1 / (1 + 1.5 * drive); this.started = true; const nz = [0, 0], s2 = [0, 0], o = [0, 0], x = [0, 0];
      for (let i = 0; i < n; ++i) {
        nz[0] = nz[1] = 0;
        for (let l = 0; l < 3; ++l) { const g = this.lvl[l].next(); if (g < 1e-5 && this.lvl[l].target < 1e-5) continue; const type = Math.round(v[l * 4]), sp = v[l * 4 + 3] / 100;
          for (let c = 0; c < 2; ++c) { let s = this.src[l][c].next(type, sp); s = this.lad[l].run(c, s); if (type === NGrey) for (let k = 0; k < 3; ++k) s = this.grey[c][k].run(s); s2[c] = s; }
          nz[0] += s2[0] * g; nz[1] += (s2[0] + (s2[1] - s2[0]) * wid) * g; }
        for (let c = 0; c < 2; ++c) { nz[c] = this.cut[c][1].run(this.cut[c][0].run(nz[c])); if (drive > 0) nz[c] = Math.tanh(nz[c] * pre) * post; }
        x[0] = iL[i]; x[1] = iR[i]; const e = 0.5 * (Math.abs(x[0]) + Math.abs(x[1])); this.env = e > this.env ? e + (this.env - e) * aA : e + (this.env - e) * aR;
        const track = Math.min(1, this.env / Math.max(1e-6, thr)), master = this.noiseG.next(), dry = this.dryG.next();
        if (mode === 4) { this.dn += (0.5 * (Math.abs(nz[0]) + Math.abs(nz[1])) / Math.max(1e-6, master) - this.dn) * 0.02; const t = amt * 0.5, target = this.dn > t * 0.5 ? 1 : 0; this.gate += (target - this.gate) * 0.02;
          for (let c = 0; c < 2; ++c) o[c] = only ? nz[c] * master * (1 - this.gate) : x[c] * dry * (1 - amt * (1 - this.gate)); }
        else if (mode === 3) { for (let c = 0; c < 2; ++c) { const ring = x[c] * nz[c] * master * 2; o[c] = only ? ring * amt : x[c] * dry * (1 - amt) + ring * amt; } }
        else { let g = 1; if (mode === 1) g = 1 - amt + amt * track; else if (mode === 2) g = 1 - amt + amt * (1 - track); for (let c = 0; c < 2; ++c) { const add = nz[c] * master * g; o[c] = only ? add : x[c] * dry + add; } }
        oL[i] = o[0]; oR[i] = o[1];
      }
    }
  }
  reg('Noiszical', PS_NZ, Noiszical);

  const PS_OD = [Q('Pre gain', -24, 24, 0), Q('Drive', 0, 100, 50), Q('Tone', 0, 100, 50), Q('Post gain', -24, 24, -6), Q('Mix', 0, 100, 100)];
  class Overdrivica extends Fxd {
    constructor(sr, ps) { super(sr, ps); this.hp = [new OH(), new OH()]; this.clip = [new OP(), new OP()]; this.tone = [new OP(), new OP()]; this.dc = [new OH(), new OH()]; this.pre = new Smooth(); this.post = new Smooth(); this.mix = new Smooth(); this.drv = new Smooth();
      for (const s of [this.pre, this.post, this.mix, this.drv]) s.setTime(0.02, sr); for (let s = 0; s < 2; ++s) { this.hp[s].set(720, sr); this.clip[s].set(5600, sr); this.dc[s].set(15, sr); } this.cfg(); for (const s of [this.pre, this.post, this.mix, this.drv]) s.reset(s.target); }
    cfg() { const v = this.v, d = v[1] / 100; for (let s = 0; s < 2; ++s) this.tone[s].set(650 * Math.pow(10, v[2] / 100), this.sr); this.pre.target = dbToGain(v[0]); this.post.target = dbToGain(v[3]); this.mix.target = v[4] / 100; this.drv.target = 1 + d * d * 150; }
    process(iL, iR, oL, oR, n) {
      for (let i = 0; i < n; ++i) {
        const pg = this.pre.next(), po = this.post.next(), m = this.mix.next(), dg = this.drv.next(); const x0 = iL[i], x1 = iR[i];
        for (let s = 0; s < 2; ++s) { const u = (s ? x1 : x0) * pg, h = this.hp[s].run(u) * dg, di = h >= 0 ? Math.tanh(h) : Math.tanh(h * 0.9) / 0.9 * 0.95; let o = this.clip[s].run(u + di); o = 4 * Math.tanh(o * 0.25); o = this.dc[s].run(this.tone[s].run(o)); const out = (s ? x1 : x0) * (1 - m) + o * po * m; if (s) oR[i] = out; else oL[i] = out; }
      }
    }
  }
  reg('Overdrivica', PS_OD, Overdrivica);

  const PS_PH = [Q('Stages', 0, 2, 1, false, ['4', '6', '8']), Q('Rate', 0.02, 10, 0.4, true), Q('Depth', 0, 100, 70), Q('Center', 100, 4000, 800, true), Q('Feedback', -90, 90, 40), Q('Width', 0, 100, 60), Q('Mix', 0, 100, 60)];
  class Phasica extends Fxd {
    constructor(sr, ps) { super(sr, ps); this.z = [new Float64Array(8), new Float64Array(8)]; this.fbz = [0, 0]; this.phase = 0; this.mix = new Smooth(); this.mix.setTime(0.03, sr); this.cfg(); this.mix.reset(this.mix.target); }
    cfg() { this.mix.target = this.v[6] / 100; }
    process(iL, iR, oL, oR, n) {
      const v = this.v, stages = 4 + 2 * Math.floor(v[0]), depth = v[2] / 100, fb = v[4] / 100, width = v[5] / 100, inc = v[1] / this.sr, sr = this.sr;
      for (let i = 0; i < n; ++i) {
        this.phase += inc; if (this.phase >= 1) this.phase -= 1; const m = this.mix.next();
        for (let s = 0; s < 2; ++s) { const inp = s ? iR[i] : iL[i], lfo = Math.sin(2 * Math.PI * (this.phase + (s ? 0.25 * width : 0))), f = clampf(v[3] * Math.pow(2, lfo * depth * 2), 20, sr * 0.45), t = Math.tan(Math.PI * f / sr), a = (t - 1) / (t + 1), z = this.z[s];
          let x = inp + fb * this.fbz[s]; for (let k = 0; k < stages; ++k) { const y = a * x + z[k]; z[k] = x - a * y; x = y; } this.fbz[s] = Math.tanh(x); const o = inp * (1 - 0.5 * m) + x * 0.5 * m; if (s) oR[i] = o; else oL[i] = o; }
      }
    }
  }
  reg('Phasica', PS_PH, Phasica);

  const REEL_M = [[55, 2.8, 1.1, 21000, 18, 0.60, 0.04, -74, 0.04, 0.02, 0.0, 200, 0.0, 3000, 0], [70, 1.9, 1.0, 16000, 20, 0.92, 0.10, -68, 0.06, 0.04, 0.9, 260, 0.7, 3200, 0], [85, 2.3, 1.2, 13000, 22, 1.15, 0.15, -66, 0.08, 0.05, 1.4, 180, -0.5, 4000, 0],
    [45, 0.6, 1.0, 22000, 16, 0.45, 0.01, -80, 0.02, 0.01, 0, 300, 0, 3000, 0], [95, 2.1, 1.3, 11000, 25, 1.0, 0.12, -62, 0.12, 0.08, 0.6, 220, 0.4, 2800, 0], [40, 0.3, 1.0, 16000, 75, 0.82, 0.05, -76, 0.03, 0.02, 0, 300, 1.8, 3500, 1]];
  const HEADMASK = [1, 2, 4, 3, 6, 5, 7, 0, 1, 2, 4, 7];
  const PS_REEL = [Q('Machine', 0, 5, 0, false, ['Studer A80', 'MCI JH-24', 'Scully 280', 'Telefunken M15', 'Revox A77', 'Nagra IV-S']), Q('Tape speed', 0, 2, 1, false, ['7.5 ips', '15 ips', '30 ips']), Q('Input', -18, 24, 0), Q('Output', -24, 12, 0), Q('Bias', -100, 100, 0),
    Q('Aggressive', 0, 1, 0, false, ['Off', 'On']), Q('Aggression', 0, 100, 50), Q('Low-mid drive', 0, 100, 0), Q('Low-mid focus', 100, 1200, 350, true), Q('Head bump', 0, 200, 100), Q('Tape age', 0, 100, 20), Q('Hiss', 0, 100, 40), Q('Wow', 0, 200, 100), Q('Flutter', 0, 200, 100), Q('Tape mix', 0, 100, 100),
    Q('Space echo', 0, 1, 0, false, ['Off', 'On']), Q('Echo mode', 0, 11, 3, false, ['1: Head 1', '2: Head 2', '3: Head 3', '4: Heads 1+2', '5: Heads 2+3', '6: Heads 1+3', '7: Heads 1+2+3', '8: Reverb only', '9: Reverb + 1', '10: Reverb + 2', '11: Reverb + 3', '12: Reverb + all']),
    Q('Repeat rate', 60, 450, 190, true), Q('Intensity', 0, 110, 35), Q('Echo level', 0, 100, 50), Q('Echo bass', -12, 12, 0), Q('Echo treble', -12, 12, 0), Q('Echo wow', 0, 100, 35), Q('Echo spread', 0, 100, 40), Q('Reverb level', 0, 100, 40), Q('Reverb decay', 0, 100, 55)];
  class Reelica extends Fxd { // tape machine + space echo (no oversampling)
    constructor(sr, ps) {
      super(sr, ps); const bq = () => [new Biquad(), new Biquad()], op = () => [new OP(), new OP()], oh = () => [new OH(), new OH()];
      this.baseDelay = Math.max(8, Math.round(0.002 * sr)); this.lat = this.baseDelay; const mk = n => [new DelayLine((n * sr) | 0), new DelayLine((n * sr) | 0)];
      this.wowD = mk(0.012); this.dryD = mk(0.02); this.loop = mk(1.9); this.springD = mk(0.12); this.springAp = [[], []]; for (let c = 0; c < 2; ++c) for (let j = 0; j < 12; ++j) this.springAp[c].push(new Allpass(8));
      this.hp = bq(); this.lmBp = bq(); this.pre = bq(); this.de = bq(); this.bump = bq(); this.mud = bq(); this.pres = bq(); this.lp = bq(); this.eBass = bq(); this.eTreb = bq();
      this.dc = oh(); this.loopHp = oh(); this.springHp = oh(); this.lpAge = op(); this.springLp = op(); this.hissLp = op(); this.loopLp = [op(), op()];
      this.gIn = new Smooth(); this.gOut = new Smooth(); this.mixS = new Smooth(); this.echoS = new Smooth(); this.revS = new Smooth(); for (const s of [this.gIn, this.gOut, this.mixS, this.echoS, this.revS]) { s.setTime(0.02, sr); }
      this.rng = new Rng(77); this.lim = 1; this.limEnv = 0; this.wowPh = 0; this.flutPh = 0; this.driftLp = 0; this.ePh = 0; this.echoT = 9000; this.echoTt = 9000; this.echoInit = false; this.springLen = [8, 8]; this.springFb = 0.7; this.hissLin = 0; this.limRel = 0.9998;
      this.cfg(); for (const s of [this.gIn, this.gOut, this.mixS, this.echoS, this.revS]) s.reset(s.target); this.echoT = this.echoTt;
    }
    cfg() {
      const v = this.v, sr = this.sr, M = REEL_M[clampf(Math.round(v[0]), 0, 5)], sp = Math.round(v[1]), bias = v[4] / 100, age = v[10] / 100;
      this.gIn.target = dbToGain(v[2]); this.gOut.target = dbToGain(v[3]); this.mixS.target = v[14] / 100; this.echoS.target = v[19] / 100; this.revS.target = v[23] / 100;
      const am = v[5] > 0.5 ? v[6] / 100 : 0, pre = 6 + 6 * am, spHf = sp === 0 ? 0.62 : sp === 2 ? 1.4 : 1, spBump = sp === 0 ? 0.5 : sp === 2 ? 2 : 1, spHiss = sp === 0 ? 1.4 : sp === 2 ? 0.7 : 1;
      for (let c = 0; c < 2; ++c) {
        this.hp[c].set(BQ.HighPass, M[4], 0.707, 0, sr); this.lmBp[c].set(BQ.BandPass, v[8], 0.7, 0, sr); this.pre[c].set(BQ.HighShelf, 3500, 0.6, pre, sr); this.de[c].set(BQ.HighShelf, 3500, 0.6, -pre, sr);
        this.bump[c].set(BQ.Peak, M[0] * spBump, M[2], M[1] * v[9] / 100, sr); this.mud[c].set(BQ.Peak, M[11], 0.8, M[10], sr); this.pres[c].set(BQ.Peak, M[13], 0.9, M[12], sr);
        this.lp[c].set(BQ.LowPass, Math.min(sr * 0.45, M[3] * spHf * (1 - 0.22 * bias)), 0.707, 0, sr); this.lpAge[c].set(Math.max(2500, 18000 * (1 - 0.8 * age) * spHf), sr);
        this.dc[c].set(8, sr); this.hissLp[c].set(2500, sr); this.loopHp[c].set(180, sr); this.loopLp[c][0].set(5200, sr); this.loopLp[c][1].set(5200, sr);
        this.eBass[c].set(BQ.LowShelf, 140, 0.7, v[20], sr); this.eTreb[c].set(BQ.HighShelf, 3500, 0.7, v[21], sr); this.springLp[c].set(2800, sr); this.springHp[c].set(180, sr);
        this.springLen[c] = Math.max(8, ((0.031 + 0.007 * c) * sr) | 0); for (let j = 0; j < 12; ++j) { this.springAp[c][j].len = 1 + (j % 3); this.springAp[c][j].g = 0.62; }
      }
      this.springFb = 0.5 + 0.42 * v[25] / 100; const hissDb = M[7] + 20 * Math.log10(spHiss), amt = v[11] / 100; this.hissLin = amt <= 0 ? 0 : Math.pow(10, hissDb / 20) * Math.pow(amt / 0.4, 1.5);
      this.echoTt = v[17] * 0.001 * sr; if (!this.echoInit) { this.echoT = this.echoTt; this.echoInit = true; } this.limRel = Math.exp(-1 / (0.08 * sr));
    }
    spring(x, out) { for (let c = 0; c < 2; ++c) { const y = this.springD[c].tap(this.springLen[c] - 1); let fb = this.springHp[c].run(this.springLp[c].run(y)); for (const a of this.springAp[c]) fb = a.run(fb); this.springD[c].push(fastTanh2(x * 0.6 + fb * this.springFb)); out[c] = y * 0.9; } }
    process(iL, iR, oL, oR, n) {
      const v = this.v, sr = this.sr, M = REEL_M[clampf(Math.round(v[0]), 0, 5)], sp = Math.round(v[1]), aggr = v[5] > 0.5, am = aggr ? v[6] / 100 : 0, bias = v[4] / 100;
      const kneeEff = M[5] * (1 - 0.3 * bias) * (1 + 2.5 * am), asym = M[6] + 0.07 * am - 0.04 * bias, hardMix = 0.45 * am, lmAmt = v[7] / 100, lmG = 1 + 9 * lmAmt, outTrim = 1 / (1 + 0.45 * am);
      const spWf = sp === 0 ? 1.5 : sp === 2 ? 0.6 : 1, wowD = M[8] * 0.01 * v[12] / 100 * spWf, fluD = M[9] * 0.01 * v[13] / 100 * spWf;
      const echoOn = v[15] > 0.5, mode = Math.round(v[16]), mask = HEADMASK[clampf(mode, 0, 11)], hasRev = mode >= 7, hiss = this.hissLin;
      const nh = ((mask & 1) ? 1 : 0) + ((mask & 2) ? 1 : 0) + ((mask & 4) ? 1 : 0), intens = v[18] / 100 * (mask ? 1 / Math.max(1, 0.62 * nh) : 0), ewow = v[22] / 100, spread = 1 + 0.09 * v[24] / 100;
      const tanA = Math.tanh(asym), norm = 1 / (kneeEff * (1 - tanA * tanA)), tape = [0, 0], dry = [0, 0], x = [0, 0], eo = [0, 0], sp2 = [0, 0];
      for (let i = 0; i < n; ++i) {
        const gi = this.gIn.next(), go = this.gOut.next(), mx = this.mixS.next();
        this.wowPh += 2 * Math.PI * 0.8 / sr; this.flutPh += 2 * Math.PI * 9.3 / sr; if (this.wowPh > 2 * Math.PI) this.wowPh -= 2 * Math.PI; if (this.flutPh > 2 * Math.PI) this.flutPh -= 2 * Math.PI;
        this.driftLp = this.driftLp * 0.99997 + this.rng.bi() * 0.00003;
        const mod = wowD / (2 * Math.PI * 0.8) * (Math.sin(this.wowPh) + 40 * this.driftLp) + fluD / (2 * Math.PI * 9.3) * Math.sin(this.flutPh), dly = this.baseDelay + mod * sr;
        x[0] = iL[i]; x[1] = iR[i];
        for (let c = 0; c < 2; ++c) {
          let u = x[c] * gi; if (lmAmt > 0.001) { const b = this.lmBp[c].run(u); u += (Math.tanh(lmG * b) / lmG - b) * lmAmt * 3; }
          u = this.hp[c].run(u); u = this.pre[c].run(u);
          { const s = kneeEff * u + asym; let t = Math.tanh(s) - tanA; if (hardMix > 0) { const h = clampf(s, -1, 1) - clampf(asym, -1, 1); t = t * (1 - hardMix) + h * hardMix; } u = t * norm; }
          u = this.dc[c].run(u); u = this.de[c].run(u); u = this.bump[c].run(u); u = this.mud[c].run(u); u = this.pres[c].run(u); u = this.lp[c].run(u); u = this.lpAge[c].run(u);
          if (M[14] > 0) { const a = Math.abs(u); this.limEnv = a > this.limEnv ? a : this.limEnv * this.limRel; } tape[c] = u;
        }
        if (M[14] > 0) { const tgt = this.limEnv > 0.7 ? 0.7 / this.limEnv : 1; this.lim += (tgt - this.lim) * (tgt < this.lim ? 0.02 : 0.0008); tape[0] *= this.lim; tape[1] *= this.lim; }
        for (let c = 0; c < 2; ++c) { this.wowD[c].push(tape[c]); this.dryD[c].push(x[c]); let w = this.wowD[c].read(Math.max(2, dly + 1)); w += hiss * this.hissLp[c].run(this.rng.bi()) * 1.6 + hiss * this.rng.bi() * 0.35; dry[c] = this.dryD[c].tap(this.lat); tape[c] = w; }
        let l = (dry[0] * (1 - mx) + tape[0] * mx) * go * outTrim, r = (dry[1] * (1 - mx) + tape[1] * mx) * go * outTrim;
        if (echoOn) {
          const el = this.echoS.next(), rv = this.revS.next(); this.echoT += (this.echoTt - this.echoT) * 0.00012; this.ePh += 2 * Math.PI * 0.62 / sr; if (this.ePh > 2 * Math.PI) this.ePh -= 2 * Math.PI;
          const wob = 1 + ewow * (0.0016 * Math.sin(this.ePh) + 0.0006 * Math.sin(this.ePh * 11.7 + 1) + 0.9 * this.driftLp), in2 = [l, r], sprIn = 0.5 * (l + r);
          for (let c = 0; c < 2; ++c) { const T = this.echoT * wob * (c ? spread : 1); let heads = 0, fb = 0;
            for (let h = 0; h < 3; ++h) if (mask & (1 << h)) { const rr = this.loop[c].read(Math.max(4, T * (h + 1))); heads += rr * (h === 0 ? 1 : h === 1 ? 0.85 : 0.7); fb += rr; }
            let f = this.loopHp[c].run(fb * intens); f = this.loopLp[c][1].run(this.loopLp[c][0].run(f)); f = Math.tanh(f * 1.35) / 1.35; this.loop[c].push(in2[c] * 0.8 + f);
            heads = this.eTreb[c].run(this.eBass[c].run(heads)); eo[c] = heads * el * 1.5; }
          sp2[0] = sp2[1] = 0; if (hasRev && rv > 0.001) this.spring(sprIn, sp2); l += eo[0] + sp2[0] * rv; r += eo[1] + sp2[1] * rv;
        }
        oL[i] = l; oR[i] = r;
      }
    }
  }
  const fastTanh2 = Math.tanh;
  reg('Reelica', PS_REEL, Reelica);

  const PS_RES = [Q('Root', 0, 11, 9, false, KEYS), Q('Scale', 0, 8, 3, false, ['Major', 'Minor', 'Dorian', 'Major pentatonic', 'Minor pentatonic', 'Whole tone', 'Hirajoshi', 'Octaves and fifths', 'Chromatic']), Q('Lowest octave', 1, 5, 2), Q('Octaves', 1, 6, 4), Q('Partials', 1, 3, 2),
    Q('Decay', 50, 12000, 2500, true), Q('Damping', 0, 100, 40), Q('Inharmonic', 0, 100, 0), Q('Spread', 0, 100, 60), Q('Mix', 0, 100, 50), Q('Level', -24, 24, 0)];
  const SCALES = [[0, 2, 4, 5, 7, 9, 11], [0, 2, 3, 5, 7, 8, 10], [0, 2, 3, 5, 7, 9, 10], [0, 2, 4, 7, 9], [0, 3, 5, 7, 10], [0, 2, 4, 6, 8, 10], [0, 2, 3, 7, 8], [0, 7], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]];
  class Resonica extends Fxd {
    constructor(sr, ps) { super(sr, ps); const N = 216; this.b0 = new Float64Array(N); this.a1 = new Float64Array(N); this.a2 = new Float64Array(N); this.y1 = new Float64Array(N); this.y2 = new Float64Array(N); this.gl = new Float64Array(N); this.gr = new Float64Array(N); this.nRes = 0; this.dirty = true; }
    cfg() { this.dirty = true; }
    build() {
      this.dirty = false; const v = this.v, sr = this.sr, s = SCALES[clampf(Math.round(v[1]), 0, 8)], root = Math.round(v[0]), lowOct = Math.round(v[2]), octs = Math.round(v[3]), parts = clampf(Math.round(v[4]), 1, 3);
      const T = v[5] * 0.001, damp = v[6] / 100, inh = v[7] / 100 * 0.02, spread = v[8] / 100; let nNotes = 0; this.nRes = 0;
      for (let o = 0; o < octs; ++o) for (const d of s) { if (nNotes >= 72) break; const midi = 12 * (lowOct + o + 1) + root + d, f0 = 440 * Math.pow(2, (midi - 69) / 12), pan = spread * Math.sin(nNotes * 2.399963), a = (pan + 1) * 0.25 * Math.PI, gl = Math.cos(a), gr = Math.sin(a);
        for (let p = 1; p <= parts; ++p) { const f = f0 * p * Math.sqrt(1 + inh * p * p * p); if (f > 0.45 * sr) continue; const Tp = T / (1 + damp * 3 * (p - 1) + damp * f0 / 2000), w = 2 * Math.PI * f / sr, r = Math.pow(10, -3 / Math.max(1, Tp * sr)), k = this.nRes++;
          this.a1[k] = 2 * r * Math.cos(w); this.a2[k] = r * r; this.b0[k] = Math.pow(1 - r, 0.88) * Math.sqrt(1 - 2 * r * Math.cos(2 * w) + r * r); this.gl[k] = gl / p; this.gr[k] = gr / p; } ++nNotes; }
      for (let k = this.nRes; k < this.y1.length; ++k) this.y1[k] = this.y2[k] = 0;
    }
    process(iL, iR, oL, oR, n) {
      if (this.dirty) this.build(); const v = this.v, mix = v[9] / 100, lvl = dbToGain(v[10]) * 2 / Math.sqrt(Math.max(1, Math.floor(v[4]))), N = this.nRes, b0 = this.b0, a1 = this.a1, a2 = this.a2, y1 = this.y1, y2 = this.y2, gl = this.gl, gr = this.gr;
      for (let i = 0; i < n; ++i) { const x = 0.5 * (iL[i] + iR[i]); let yl = 0, yr = 0; for (let k = 0; k < N; ++k) { let y = b0[k] * x + a1[k] * y1[k] - a2[k] * y2[k]; if (Math.abs(y) < 1e-20) y = 0; y2[k] = y1[k]; y1[k] = y; yl += y * gl[k]; yr += y * gr[k]; }
        oL[i] = iL[i] * (1 - mix) + Math.tanh(yl * lvl) * mix; oR[i] = iR[i] * (1 - mix) + Math.tanh(yr * lvl) * mix; }
    }
  }
  reg('Resonica', PS_RES, Resonica);

  const PS_REV = [Q('Type', 0, 2, 1, false, ['Spring', 'Plate', 'Chamber']), Q('Size', 0, 100, 50), Q('Decay', 0, 100, 55), Q('Damping', 0, 100, 40), Q('Pre-delay', 0, 250, 10), Q('Low cut', 20, 1000, 120, true), Q('High cut', 1000, 20000, 9000, true), Q('Width', 0, 100, 100), Q('Mix', 0, 100, 30)];
  class Reverbica extends Fxd {
    constructor(sr, ps) {
      super(sr, ps); this.pre = new DelayLine((0.3 * sr) | 0); const k = sr / 29761 * 1.6; this.inDiff = [0, 1, 2, 3].map(() => new Allpass((400 * k) | 0)); const two = f => [f(), f()];
      this.tankAp1 = two(() => new Allpass((950 * k) | 0)); this.tankAp2 = two(() => new Allpass((2700 * k) | 0)); this.tankD1 = two(() => new DelayLine((4500 * k) | 0)); this.tankD2 = two(() => new DelayLine((3800 * k) | 0));
      const c = sr / 44100 * 1.5; this.comb = two(() => [0, 1, 2, 3, 4, 5, 6, 7].map(() => new Comb((1700 * c) | 0))); this.roomAp = two(() => [0, 1, 2, 3].map(() => new Allpass((600 * c) | 0)));
      this.springD = two(() => new DelayLine((0.12 * sr) | 0)); this.springAp = two(() => [...Array(12)].map(() => new Allpass(8))); this.springLp = [new OP(), new OP()]; this.springHp = [new OH(), new OH()]; this.damp = [new OP(), new OP()];
      this.inLp = new OP(); this.inHp = new OH(); this.bw = new OP(); this.mix = new Smooth(); this.width = new Smooth(); this.mix.setTime(0.03, sr); this.width.setTime(0.03, sr); this.lfo = 0; this.k = 1; this.pd1 = [1, 1]; this.pd2 = [1, 1]; this.pap1 = [0, 0]; this.plateDecay = 0.5; this.springLen = [8, 8]; this.springFb = 0.7;
      this.cfg(); this.mix.reset(this.mix.target); this.width.reset(this.width.target);
    }
    cfg() {
      const v = this.v, sr = this.sr, size = 0.5 + v[1] / 100, decay = v[2] / 100, damp = v[3] / 100; this.inHp.set(v[5], sr); this.inLp.set(v[6], sr); this.mix.target = v[8] / 100; this.width.target = v[7] / 100; this.k = sr / 29761 * size;
      const dl = [142, 107, 379, 277], dg = [0.75, 0.75, 0.625, 0.625]; for (let j = 0; j < 4; ++j) { this.inDiff[j].len = Math.max(1, (dl[j] * sr / 29761) | 0); this.inDiff[j].g = dg[j]; }
      const ap1 = [672, 908], d1 = [4453, 4217], ap2 = [1800, 2656], d2 = [3720, 3163];
      for (let s = 0; s < 2; ++s) { this.pap1[s] = ap1[s] * this.k; this.tankAp1[s].g = -0.7; this.tankAp2[s].len = Math.max(1, (ap2[s] * this.k) | 0); this.tankAp2[s].g = 0.5; this.pd1[s] = Math.max(1, (d1[s] * this.k) | 0); this.pd2[s] = Math.max(1, (d2[s] * this.k) | 0); this.damp[s].set(1000 + (1 - damp) * 14000, sr); }
      this.bw.set(12000, sr); this.plateDecay = 0.2 + decay * 0.78; this.lfoInc = 2 * Math.PI * 0.9 / sr;
      const cl = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], al = [556, 441, 341, 225], c = sr / 44100 * size;
      for (let s = 0; s < 2; ++s) { for (let j = 0; j < 8; ++j) { const cb = this.comb[s][j]; cb.len = Math.max(1, ((cl[j] + s * 23) * c) | 0); cb.fb = 0.7 + decay * 0.28; cb.damp = damp * 0.6; } for (let j = 0; j < 4; ++j) { const a = this.roomAp[s][j]; a.len = Math.max(1, ((al[j] + s * 23) * c) | 0); a.g = 0.5; }
        this.springLen[s] = Math.max(8, ((0.033 + 0.007 * s) * size * sr) | 0); for (let j = 0; j < 12; ++j) { this.springAp[s][j].len = 1 + (j % 3); this.springAp[s][j].g = 0.62; } this.springLp[s].set(2500 + (1 - damp) * 3500, sr); this.springHp[s].set(180, sr); }
      this.springFb = 0.55 + decay * 0.38;
    }
    process(iL, iR, oL, oR, n) {
      const v = this.v, type = Math.round(v[0]), preLen = Math.max(1, (v[4] * 0.001 * this.sr) | 0), k = this.k, o2 = [0, 0];
      const T = (d, at) => d.tap(Math.max(1, (at * k) | 0) - 1), A = (a, at) => a.d.tap(Math.max(1, (at * k) | 0) - 1);
      for (let i = 0; i < n; ++i) {
        const dL = iL[i], dR = iR[i]; this.pre.push(0.5 * (dL + dR)); let x = this.pre.tap(preLen - 1); x = this.inLp.run(this.inHp.run(x)); let wl = 0, wr = 0;
        if (type === 1) { // plate
          x = this.bw.run(x); for (const a of this.inDiff) x = a.run(x); this.lfo += this.lfoInc; if (this.lfo > 2 * Math.PI) this.lfo -= 2 * Math.PI; const ex = 16 * k * 0.5, dc = this.plateDecay;
          const fbL = this.tankD2[1].tap(this.pd2[1] - 1) * dc, fbR = this.tankD2[0].tap(this.pd2[0] - 1) * dc;
          let l = this.tankAp1[0].runMod(x + fbL, this.pap1[0] + ex * Math.sin(this.lfo)); this.tankD1[0].push(l); l = this.damp[0].run(this.tankD1[0].tap(this.pd1[0] - 1)) * dc; l = this.tankAp2[0].run(l); this.tankD2[0].push(l);
          let r = this.tankAp1[1].runMod(x + fbR, this.pap1[1] + ex * Math.cos(this.lfo)); this.tankD1[1].push(r); r = this.damp[1].run(this.tankD1[1].tap(this.pd1[1] - 1)) * dc; r = this.tankAp2[1].run(r); this.tankD2[1].push(r);
          const D1 = this.tankD1, D2 = this.tankD2, P2 = this.tankAp2;
          wl = 0.6 * (T(D1[1], 266) + T(D1[1], 2974) - A(P2[1], 1913) + T(D2[1], 1996) - T(D1[0], 1990) - A(P2[0], 187) - T(D2[0], 1066));
          wr = 0.6 * (T(D1[0], 353) + T(D1[0], 3627) - A(P2[0], 1228) + T(D2[0], 2673) - T(D1[1], 2111) - A(P2[1], 335) - T(D2[1], 121));
        } else if (type === 2) { const inp = x * 0.15; for (let s = 0; s < 2; ++s) { let acc = 0; for (const cb of this.comb[s]) acc += cb.run(inp); for (const ap of this.roomAp[s]) acc = ap.run(acc); if (s) wr = acc; else wl = acc; } }
        else { for (let s = 0; s < 2; ++s) { const y = this.springD[s].tap(this.springLen[s] - 1); let fb = this.springHp[s].run(this.springLp[s].run(y)); for (const ap of this.springAp[s]) fb = ap.run(fb); this.springD[s].push(fastTanh(x * 0.6 + fb * this.springFb)); if (s) wr = y * 0.9; else wl = y * 0.9; } }
        const w = this.width.next(), m = this.mix.next(), mid = 0.5 * (wl + wr), side = 0.5 * (wl - wr) * w; oL[i] = dL * (1 - m) + (mid + side) * m; oR[i] = dR * (1 - m) + (mid - side) * m;
      }
    }
  }
  reg('Reverbica', PS_REV, Reverbica);
  const PS_ROT = [Q('Speed', 0, 2, 1, false, ['Stop', 'Slow', 'Fast']), Q('Drive', 0, 100, 20), Q('Crossover', 300, 2000, 800, true), Q('Horn level', 0, 1.5, 1), Q('Drum level', 0, 1.5, 1), Q('Mic spread', 0, 100, 70), Q('Rotor depth', 0, 100, 70), Q('Slow rate', 0.2, 2, 0.8), Q('Fast rate', 3, 10, 6.7), Q('Mix', 0, 100, 100)];
  class Rotica extends Fxd {
    constructor(sr, ps) { super(sr, ps); const n = ((0.01 * sr) | 0) + 16; this.horn = [new DelayLine(n), new DelayLine(n)]; this.drum = [new DelayLine(n), new DelayLine(n)]; this.xo = new Svf(); this.hornHz = 0; this.drumHz = 0; this.aH = 0; this.aD = 0.31; }
    process(iL, iR, oL, oR, n) {
      const v = this.v, sr = this.sr, spd = clampf(Math.round(v[0]), 0, 2), hornT = spd === 0 ? 0 : (spd === 1 ? v[7] : v[8]), drumT = hornT * 0.88, upH = hornT > this.hornHz, upD = drumT > this.drumHz;
      const hC = 1 - Math.exp(-1 / ((upH ? 0.9 : 1.6) * sr)), dC = 1 - Math.exp(-1 / ((upD ? 3 : 4.5) * sr)), spread = v[5] / 100 * 1.5708, dep = v[6] / 100, mix = v[9] / 100, drive = 1 + v[1] / 100 * 7;
      const phi = [-spread, spread], hornAm = 0.75 * dep, drumAm = 0.4 * dep, hornR = 0.17 * sr / 343 * dep, drumR = 0.09 * sr / 343 * dep, g = (1 + (drive - 1) * 0.3) / drive, hm = [0, 0], dm = [0, 0];
      this.xo.set(v[2], 0.7071, sr);
      for (let i = 0; i < n; ++i) {
        const x = Math.tanh(0.5 * (iL[i] + iR[i]) * drive) * g;
        this.hornHz += (hornT - this.hornHz) * hC; this.drumHz += (drumT - this.drumHz) * dC; if (hornT === 0 && this.hornHz < 0.003) this.hornHz = 0; if (drumT === 0 && this.drumHz < 0.003) this.drumHz = 0;
        this.aH += this.hornHz / sr; if (this.aH >= 1) this.aH -= 1; this.aD -= this.drumHz / sr; if (this.aD < 0) this.aD += 1;
        this.xo.run(x); const low = this.xo.low, high = -this.xo.high, th = 2 * Math.PI * this.aH, td = 2 * Math.PI * this.aD;
        this.horn[0].push(high); this.horn[1].push(high); this.drum[0].push(low); this.drum[1].push(low);
        for (let m = 0; m < 2; ++m) { const ch = Math.cos(th - phi[m]), cd = Math.cos(td - phi[m]); hm[m] = this.horn[m].read(hornR * (1 - ch) + 3) * (1 - hornAm * 0.5 * (1 - ch)); dm[m] = this.drum[m].read(drumR * (1 - cd) + 3) * (1 - drumAm * 0.5 * (1 - cd)); }
        const wl = hm[0] * v[3] + dm[0] * v[4], wr = hm[1] * v[3] + dm[1] * v[4]; oL[i] = iL[i] * (1 - mix) + wl * mix; oR[i] = iR[i] * (1 - mix) + wr * mix;
      }
    }
  }
  reg('Rotica', PS_ROT, Rotica);

  const PS_SEA = [Q('Memory', 2, 30, 16), Q('Rate', 0, 4, 2, false, ['1 beat', '1/2 bar', '1 bar', '2 bars', '4 bars']), Q('Ghost length', 0, 3, 1, false, ['1/4', '1/2', '1 beat', '2 beats']), Q('Pitch', 0, 4, 0, false, ['Same', 'Octave down', 'Octave up', 'Fifth up', 'Mixed']),
    Q('Reverse', 0, 100, 25), Q('Haze', 0, 100, 60), Q('Feedback', 0, 70, 15), Q('Density', 0, 100, 60), Q('Ghost level', -30, 6, -6), Q('Mix', 0, 100, 50)];
  class Seancica extends Fxd {
    constructor(sr, ps) { super(sr, ps); this.len = (31 * sr) | 0; this.buf = [new Float32Array(this.len), new Float32Array(this.len)]; this.w = 0; this.clock = 0; this.filled = 0; this.g = []; for (let i = 0; i < 4; ++i) this.g.push({ on: false, start: 0, age: 0, len: 0, rate: 1, dir: 1, gl: 1, gr: 1 }); this.lp = [0, 0]; this.rng = 0x2545F491; this.fbL = 0; this.fbR = 0; }
    uni() { let r = this.rng; r ^= r << 13; r ^= r >>> 17; r ^= r << 5; this.rng = r >>> 0; return (this.rng >>> 8) * (1 / 16777216); }
    read(c, pos) { const L = this.len; while (pos < 0) pos += L; while (pos >= L) pos -= L; const i = pos | 0, j = i + 1 >= L ? 0 : i + 1, t = pos - i, b = this.buf[c]; return b[i] + (b[j] - b[i]) * t; }
    launch(gl, beat, mem) {
      let g = null; for (const x of this.g) if (!x.on) { g = x; break; } if (!g) return; const v = this.v, maxBeats = Math.max(1, Math.floor((Math.min(mem, this.filled) - gl * 2) / beat)), back = Math.floor(1 + this.uni() * maxBeats) * beat;
      const pm = clampf(Math.round(v[3]), 0, 4), rates = [1, 0.5, 2, 1.5]; g.rate = pm === 0 ? 1 : (pm === 4 ? rates[(this.uni() * 4 | 0) & 3] : rates[pm - 1]); g.len = gl; g.age = 0; g.on = true; g.dir = this.uni() * 100 < v[4] ? -1 : 1;
      const span = gl * g.rate, from = this.w - back; g.start = g.dir > 0 ? from : from + span; const p = this.uni() * 2 - 1; g.gl = 0.7 * (1 - 0.5 * Math.max(0, p)); g.gr = 0.7 * (1 + 0.5 * Math.min(0, p));
    }
    process(iL, iR, oL, oR, n) {
      const v = this.v, sr = this.sr, beat = sr * 60 / Math.max(30, this.tempo), rate = [1, 2, 4, 8, 16], glen = [0.25, 0.5, 1, 2], every = beat * rate[clampf(Math.round(v[1]), 0, 4)], gl = Math.max(64, beat * glen[clampf(Math.round(v[2]), 0, 3)]);
      const mem = Math.min(this.len - 2, v[0] * sr), level = dbToGain(v[8]), mix = v[9] / 100, fb = v[6] / 100 * 0.8, haze = v[5] / 100, lpC = 1 - Math.exp(-2 * Math.PI * (18000 - 16000 * haze) / sr);
      for (let i = 0; i < n; ++i) {
        this.buf[0][this.w] = iL[i] + this.fbL * fb; this.buf[1][this.w] = iR[i] + this.fbR * fb; this.clock += 1;
        if (this.clock >= every) { this.clock -= every; if (this.filled > gl * 2 && this.uni() * 100 < v[7]) this.launch(gl, beat, mem); }
        let a = 0, b = 0;
        for (const g of this.g) if (g.on) { const pos = g.start + g.dir * g.age * g.rate, env = 0.5 - 0.5 * Math.cos(2 * Math.PI * (g.age / g.len)); a += this.read(0, pos) * env * g.gl; b += this.read(1, pos) * env * g.gr; if (++g.age >= g.len) g.on = false; }
        this.lp[0] += (a - this.lp[0]) * lpC; this.lp[1] += (b - this.lp[1]) * lpC; const gL = haze > 0.01 ? this.lp[0] : a, gR = haze > 0.01 ? this.lp[1] : b; this.fbL = gL; this.fbR = gR;
        oL[i] = iL[i] + gL * level * mix * 2; oR[i] = iR[i] + gR * level * mix * 2; if (++this.w >= this.len) this.w = 0; if (this.filled < this.len) this.filled += 1;
      }
    }
  }
  reg('Seancica', PS_SEA, Seancica);

  const PS_TRE = [Q('Mode', 0, 2, 0, false, ['Tremolo', 'Auto-pan', 'Gate']), Q('Wave', 0, 6, 0, false, ['Sine', 'Triangle', 'Square', 'Saw up', 'Saw down', 'Random', 'Smooth random']),
    Q('Sync', 0, 11, 0, false, ['Free', '4 bar', '2 bar', '1 bar', '1/2', '1/4', '1/8', '1/16', '1/32', '1/4T', '1/8T', '1/16T']), Q('Rate', 0.05, 30, 4, true), Q('Depth', 0, 100, 80), Q('Phase', 0, 180, 0), Q('Smooth', 0.1, 200, 4, true), Q('Steps', 2, 16, 8), Q('Hits', 0, 16, 3), Q('Rotate', 0, 15, 0)];
  const TCB = [0, 16, 8, 4, 2, 1, 0.5, 0.25, 0.125, 2 / 3, 1 / 3, 1 / 6];
  function hash01(a) { a = (a ^ (a >>> 16)) >>> 0; a = Math.imul(a, 0x7feb352d) >>> 0; a = (a ^ (a >>> 15)) >>> 0; a = Math.imul(a, 0x846ca68b) >>> 0; a = (a ^ (a >>> 16)) >>> 0; return (a >>> 8) / 16777216; }
  function tshape(wave, ph, steps, cycle) {
    switch (wave) { case 0: return 0.5 - 0.5 * Math.cos(2 * Math.PI * ph); case 1: return ph < 0.5 ? ph * 2 : 2 - ph * 2; case 2: return ph < 0.5 ? 1 : 0; case 3: return ph; case 4: return 1 - ph;
      default: { const x = ph * steps, i = ((x | 0) + Math.imul(cycle, steps)) >>> 0, a = hash01((Math.imul(i, 2654435761) + 17) >>> 0); if (wave === 5) return a; const b = hash01((Math.imul((i + 1) >>> 0, 2654435761) + 17) >>> 0), f = x - Math.floor(x), s = 0.5 - 0.5 * Math.cos(Math.PI * f); return a + (b - a) * s; } }
  }
  class Tremolica extends Fxd {
    constructor(sr, ps) { super(sr, ps); this.phase = 0; this.cycle = 0; this.g = [1, 1]; this.pan = 0; }
    process(iL, iR, oL, oR, n) {
      const v = this.v, sr = this.sr, mode = Math.round(v[0]), wave = Math.round(v[1]), sync = Math.round(v[2]), steps = Math.max(2, Math.round(v[7])), hits = Math.round(v[8]), rot = Math.round(v[9]), depth = v[4] / 100, offs = v[5] / 360;
      const cb = TCB[clampf(sync, 0, 11)], inc = cb > 0 ? this.tempo / 60 / cb / sr : v[3] / sr, a = Math.exp(-1 / Math.max(1, v[6] * 0.001 * sr));
      for (let i = 0; i < n; ++i) {
        this.phase += inc; if (this.phase >= 1) { this.phase -= 1; ++this.cycle; } const ph = this.phase, cyc = this.cycle;
        if (mode === 1) { const s = tshape(wave, ph, steps, cyc) * 2 - 1, target = s * depth; this.pan = target + (this.pan - target) * a; const th = (this.pan + 1) * Math.PI * 0.25; oL[i] = iL[i] * Math.cos(th) * 1.4142135; oR[i] = iR[i] * Math.sin(th) * 1.4142135; }
        else for (let c = 0; c < 2; ++c) { let p = ph + (c ? offs : 0); p -= Math.floor(p); let lvl;
          if (mode === 2) { const k = (((((p * steps) | 0) + rot) % steps) + steps) % steps, h = clampf(hits, 0, steps); lvl = ((k * h) % steps) < h ? 1 : 0; } else lvl = tshape(wave, p, steps, cyc);
          const target = 1 - depth * (1 - lvl); this.g[c] = target + (this.g[c] - target) * a; if (c) oR[i] = iR[i] * this.g[c]; else oL[i] = iL[i] * this.g[c]; }
      }
    }
  }
  reg('Tremolica', PS_TRE, Tremolica);

  const PS_WARM = [Q('Drive', 0, 30, 6), Q('Character', 0, 2, 0, false, ['Tape', 'Tube', 'Transformer']), Q('Warmth', 0, 100, 30), Q('Tone', -100, 100, 0), Q('Tape head cut', 4000, 20000, 16000, true), Q('Output', -18, 12, 0), Q('Mix', 0, 100, 100), Q('Low-mid warmth', 0, 100, 40), Q('Top smoothing', 0, 100, 30)];
  const lncosh = u => { const a = Math.abs(u); return a + Math.log1p(Math.exp(-2 * a)) - 0.6931472; };
  class Warmica extends Fxd {
    constructor(sr, ps) { super(sr, ps); const b2 = () => [new Biquad(), new Biquad()]; this.pre = b2(); this.post = b2(); this.lo = b2(); this.hi = b2(); this.lmPre = b2(); this.lmPost = b2(); this.shelf = b2(); this.head = [new OP(), new OP()]; this.smooth = [new OP(), new OP()]; this.dc = [new OH(), new OH()]; this.xp = [0, 0]; this.fp = [lncosh(0), lncosh(0)]; this.gain = 2; this.slope = 1; this.bias = 0; this.biasOut = 0; this.cfg(); }
    cfg() {
      const v = this.v, sr = this.sr, ch = clampf(Math.round(v[1]), 0, 2); this.gain = dbToGain(v[0]); this.bias = ch === 1 ? 0.35 : 0; this.biasOut = Math.tanh(this.bias); this.slope = 1 - this.biasOut * this.biasOut; const warm = v[2] * 0.01;
      for (let c = 0; c < 2; ++c) {
        if (ch === 2) { this.pre[c].set(BQ.LowShelf, 110, 0.7, 6 * warm + 3, sr); this.post[c].set(BQ.LowShelf, 110, 0.7, -(6 * warm + 3), sr); } else { this.pre[c].set(BQ.Peak, 1000, 0.7, 0, sr); this.post[c].set(BQ.LowShelf, 100, 0.7, ch === 0 ? 3.5 * warm : 1.5 * warm, sr); }
        const t = v[3] * 0.01 * 4; this.lo[c].set(BQ.LowShelf, 700, 0.7, -t, sr); this.hi[c].set(BQ.HighShelf, 700, 0.7, t, sr); const lm = v[7] * 0.01, sm = v[8] * 0.01;
        this.lmPre[c].set(BQ.Peak, 280, 0.7, 9 * lm, sr); this.lmPost[c].set(BQ.Peak, 280, 0.7, -9 * lm * 0.8, sr); this.shelf[c].set(BQ.HighShelf, 5000, 0.6, -9 * sm, sr); this.smooth[c].set(20000 - 11000 * sm, sr); this.head[c].set(ch === 0 ? v[4] : 20000, sr); this.dc[c].set(8, sr);
      }
    }
    process(iL, iR, oL, oR, n) {
      const v = this.v, mix = v[6] * 0.01, outG = dbToGain(v[5]), gain = this.gain, bias = this.bias;
      for (let i = 0; i < n; ++i) for (let c = 0; c < 2; ++c) {
        const dry = c ? iR[i] : iL[i]; const x = this.lmPre[c].run(this.pre[c].run(dry)), u = x * gain + bias, d = u - this.xp[c], f = lncosh(u); let y;
        if (Math.abs(d) < 1e-4) y = Math.tanh(0.5 * (u + this.xp[c])); else y = (f - this.fp[c]) / d; this.xp[c] = u; this.fp[c] = f;
        y = (y - this.biasOut) / (gain * this.slope); y = this.lmPost[c].run(this.post[c].run(y)); y = this.dc[c].run(y); y = this.lo[c].run(this.hi[c].run(y)); y = this.head[c].run(y); y = this.smooth[c].run(this.shelf[c].run(y));
        const o = (dry + (y - dry) * mix) * outG; if (c) oR[i] = o; else oL[i] = o;
      }
    }
  }
  reg('Warmica', PS_WARM, Warmica);

  const PS_WID = [Q('Width', 0, 200, 100), Q('Mid level', -18, 18, 0), Q('Side level', -18, 18, 0), Q('Mono below', 20, 500, 20), Q('Balance', -100, 100, 0)];
  class Widica extends Fxd {
    constructor(sr, ps) { super(sr, ps); this.lp1 = 0; this.lp2 = 0; this.cfg(); }
    cfg() { const v = this.v; this.midG = Math.pow(10, v[1] / 20); this.sideG = Math.pow(10, v[2] / 20) * v[0] * 0.01; this.monoOn = v[3] > 20.5; this.lpc = 1 - Math.exp(-6.2831853 * v[3] / this.sr); const b = v[4] * 0.01; this.gl = b > 0 ? 1 - b : 1; this.gr = b < 0 ? 1 + b : 1; }
    process(iL, iR, oL, oR, n) { for (let i = 0; i < n; ++i) { const m = 0.5 * (iL[i] + iR[i]), s = 0.5 * (iL[i] - iR[i]); let side = s; if (this.monoOn) { this.lp1 += this.lpc * (s - this.lp1); this.lp2 += this.lpc * (this.lp1 - this.lp2); side = s - this.lp2; } const mo = m * this.midG, so = side * this.sideG; oL[i] = (mo + so) * this.gl; oR[i] = (mo - so) * this.gr; } }
  }
  reg('Widica', PS_WID, Widica);
  // device list in the original Boardica order; index 0 of the dropdown is the empty rack
  FXLIST.sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
  const DEVNAMES = ['Empty rack'].concat(FXLIST.map(f => f.name)), devIdx = nm => DEVNAMES.indexOf(nm);
  /* ---- parameters */
  const kGlobal = 18, kSrcN = 16, kFiltN = 6, kSrcBase = kGlobal, kFiltBase = kSrcBase + kSrc * kSrcN, kLinkId = kFiltBase + 2 * kFiltN, kBalId = kLinkId + 1, kEnvBase = kBalId + 1, kLfoBase = kEnvBase + 12,
    kTeslaSpeed = kLfoBase + 10, kTeslaChar = kTeslaSpeed + 1, kSeqRate = kTeslaChar + 1, kSeqLen = kSeqRate + 1, kSeqGlide = kSeqLen + 1, kSeqBase = kSeqGlide + 1, kWireBase = kSeqBase + kSteps, kFxMode = kWireBase + kWires * 4,
    kFxBase = kFxMode + 1, kFxN = 11, kCount = kFxBase + kFx * kFxN, kTempo = kCount;
  const G = { Preset: 0, Volume: 1, Voices: 2, Mode: 3, Glide: 4, BendRange: 5, Tuning: 6, Tonic: 7, VelSens: 8, Age: 9, Variation: 10, Lever1: 11, Lever2: 12, Lever3: 13, Lever4: 14, Mutate: 15, MutateAmt: 16, MutateScope: 17 };
  const SP = { Type: 0, Coarse: 1, Fine: 2, Level: 3, Pan: 4, Shape: 5, Colour: 6, Mod: 7, Table: 8, Noise: 9, Body: 10, Route: 11, XSrc: 12, XAmt: 13, XMode: 14, Track: 15 };
  const TEmpty = 0, TAnalog = 1, TFm = 2, TWave = 3, TNoise = 4, TModal = 5, TString = 6, TChaos = 7;
  const MNone = 0, MEnv2 = 1, MEnv3 = 2, MLfo1 = 3, MLfo2 = 4, MTesla = 5, MSeq = 6, MVel = 7, MKey = 8, MWheel = 9, MPress = 10, MBend = 11, MExpr = 12, MLever1 = 13, MRand = 17, MSpecA = 18, MEnv1 = 22, MOne = 23, kModSrc = 24;
  const DPitch = 1, DLevel = 5, DShape = 9, DColour = 13, DMod = 17, DCross = 21, DCut1 = 25, DRes1 = 26, DDrive = 29, DPan = 30, DAmp = 31, DPitchAll = 32, DLfo1 = 33, DTesla = 35, DBal = 36, kDest = 37;
  const MS_LABELS = ['None', 'Env 2', 'Env 3', 'LFO 1', 'LFO 2', 'Tesla', 'Sequencer', 'Velocity', 'Key', 'Mod wheel', 'Aftertouch', 'Pitch bend', 'Expression', 'Lever 1', 'Lever 2', 'Lever 3', 'Lever 4', 'Voice random', 'Specimen A', 'Specimen B', 'Specimen C', 'Specimen D', 'Env 1 (amp)', 'Constant'];
  const MD_LABELS = ['None']; for (const g of ['pitch', 'level', 'shape', 'colour', 'mod', 'cross']) for (let i = 0; i < 4; ++i) MD_LABELS.push('ABCD'[i] + ' ' + g);
  MD_LABELS.push('R1 cutoff', 'R1 resonance', 'R2 cutoff', 'R2 resonance', 'Drive', 'Pan', 'Level', 'Pitch (all)', 'LFO 1 rate', 'LFO 2 rate', 'Tesla speed', 'Reagent balance');
  const PRESET_NAMES = ['Init specimen', "Frankenstein's bass", 'Tesla coil lead', "Igor's bells", 'Reanimation pad', 'Bubbling beaker', 'Lab accident', 'Sitar in the cellar', 'Mad wobble', 'Gamelan reactor', 'Doctor Noise', 'Vowel experiment'];
  const TUNINGS = ['Equal', 'Just intonation', 'Pythagorean', 'Arabic Rast', 'Arabic Bayati', 'Indian (shruti)', 'Pelog', 'Slendro'];
  const specs = new Array(kCount + 1);
  const at = (i, s) => { specs[i] = s; };
  at(0, P('Preset', '', 0, PRESET_NAMES.length - 1, 0, '%.0f', false, PRESET_NAMES)); at(1, P('Volume', 'dB', -30, 6, -9, '%.1f dB')); at(2, P('Voices', '', 1, 16, 8, '%.0f')); at(3, P('Mode', '', 0, 2, 0, '%.0f', false, ['Poly', 'Mono', 'Legato mono']));
  at(4, P('Glide', 's', 0, 2, 0, '%.2f s')); at(5, P('Bend range', 'st', 0, 24, 2, '%.0f st')); at(6, P('Tuning', '', 0, 7, 0, '%.0f', false, TUNINGS)); at(7, P('Tonic', '', 0, 11, 0, '%.0f', false, KEYS));
  at(8, P('Velocity', '', 0, 1, 0.6, '%.2f')); at(9, P('Lab age (tolerance)', '', 0, 1, 0.15, '%.2f')); at(10, P('Variation per note', '', 0, 1, 0, '%.2f'));
  for (let i = 0; i < 4; ++i) at(11 + i, P('Lever ' + (i + 1), '', 0, 1, 0, '%.2f'));
  at(15, P('Mutate', '', 0, 1, 0, '%.0f', false, ['Rest', 'MUTATE!'])); at(16, P('Mutate amount', '', 0, 1, 0.35, '%.2f')); at(17, P('Mutate scope', '', 0, 3, 0, '%.0f', false, ['Tone (specimens)', 'Reagents + envelopes', 'Wires (patch matrix)', 'Everything but apparatus']));
  for (let s = 0; s < kSrc; ++s) {
    const a = 'ABCD'[s] + ' ', b = kSrcBase + s * kSrcN;
    at(b, P(a + 'Type', '', 0, 7, s === 0 ? 1 : 0, '%.0f', false, ['Empty jar', 'Analog', 'FM', 'Wavetable', 'Noise', 'Bell body', 'String', 'Chaos'])); at(b + 1, P(a + 'Coarse', 'st', -36, 36, 0, '%.0f st')); at(b + 2, P(a + 'Fine', 'cents', -100, 100, 0, '%.0f c'));
    at(b + 3, P(a + 'Level', '', 0, 1, s === 0 ? 0.7 : 0.5, '%.2f')); at(b + 4, P(a + 'Pan', '', -1, 1, 0, '%.2f')); at(b + 5, P(a + 'Shape', '', 0, 1, 0, '%.2f')); at(b + 6, P(a + 'Colour', '', 0, 1, 0.5, '%.2f')); at(b + 7, P(a + 'Mod', '', 0, 1, 0, '%.2f'));
    at(b + 8, P(a + 'Wavetable', '', 0, 11, 0, '%.0f', false, TABLE_NAMES)); at(b + 9, P(a + 'Noise', '', 0, NTypeCount - 1, 0, '%.0f', false, NOISE_NAMES)); at(b + 10, P(a + 'Body', '', 0, BODY.length - 1, 0, '%.0f', false, BODY.map(x => x.name)));
    at(b + 11, P(a + 'Route', '', 0, 3, 0, '%.0f', false, ['Reagent 1', 'Reagent 2', 'Both', 'Direct'])); at(b + 12, P(a + 'Cross source', '', 0, 4, 0, '%.0f', false, ['None', 'Specimen A', 'Specimen B', 'Specimen C', 'Specimen D']));
    at(b + 13, P(a + 'Cross amount', '', 0, 1, 0, '%.2f')); at(b + 14, P(a + 'Cross mode', '', 0, 4, 0, '%.0f', false, ['Phase mod', 'Ring mod', 'Amp mod', 'Hard sync', 'Excite'])); at(b + 15, P(a + 'Keyboard tracking', '', 0, 1, 1, '%.2f'));
  }
  const FTYPES = ['Off', 'Ladder 24', 'SVF low', 'SVF band', 'SVF high', 'Notch', 'Comb +', 'Comb -', 'Vowel', 'Phaser'];
  for (let f = 0; f < 2; ++f) { const a = 'R' + (f + 1) + ' ', b = kFiltBase + f * kFiltN;
    at(b, P(a + 'Type', '', 0, 9, f === 0 ? 1 : 0, '%.0f', false, FTYPES)); at(b + 1, P(a + 'Cutoff', 'Hz', 20, 20000, 3000, '%.0f Hz', true)); at(b + 2, P(a + 'Resonance', '', 0, 1, 0.2, '%.2f')); at(b + 3, P(a + 'Drive', '', 0, 1, 0.1, '%.2f'));
    at(b + 4, P(a + 'Key tracking', '', 0, 1, 0.3, '%.2f')); at(b + 5, P(a + 'Env 2 amount', '', -1, 1, f === 0 ? 0.3 : 0, '%.2f')); }
  at(kLinkId, P('Reagent link', '', 0, 1, 0, '%.0f', false, ['Parallel', 'Serial'])); at(kBalId, P('Reagent balance', '', 0, 1, 0.5, '%.2f'));
  const ED = [[0.004, 0.3, 0.8, 0.3], [0.005, 0.4, 0.3, 0.3], [0.05, 0.6, 0.5, 0.5]];
  for (let e = 0; e < 3; ++e) { const a = 'Env ' + (e + 1) + ' ', b = kEnvBase + e * 4;
    at(b, P(a + 'Attack', 's', 0.001, 10, ED[e][0], '%.3f s', true)); at(b + 1, P(a + 'Decay', 's', 0.005, 10, ED[e][1], '%.3f s', true)); at(b + 2, P(a + 'Sustain', '', 0, 1, ED[e][2], '%.2f')); at(b + 3, P(a + 'Release', 's', 0.005, 12, ED[e][3], '%.3f s', true)); }
  for (let l = 0; l < 2; ++l) { const a = 'LFO ' + (l + 1) + ' ', b = kLfoBase + l * 5;
    at(b, P(a + 'Rate', 'Hz', 0.05, 40, l ? 0.7 : 4, '%.2f Hz', true)); at(b + 1, P(a + 'Sync', '', 0, 11, 0, '%.0f', false, ['Free', '1 bar', '1/2', '1/4', '1/8', '1/16', '1/32', '1/2 dotted', '1/4 dotted', '1/8 dotted', '1/4 triplet', '1/8 triplet']));
    at(b + 2, P(a + 'Shape', '', 0, 5, 0, '%.0f', false, ['Sine', 'Triangle', 'Saw', 'Square', 'Sample & hold', 'Smooth random'])); at(b + 3, P(a + 'Fade in', 's', 0, 5, 0, '%.2f s')); at(b + 4, P(a + 'Start', '', 0, 1, 0, '%.0f', false, ['Random phase', 'Restart'])); }
  at(kTeslaSpeed, P('Tesla speed', '', 0.05, 200, 3, '%.2f', true)); at(kTeslaChar, P('Tesla character', '', 0, 1, 0.45, '%.2f'));
  at(kSeqRate, P('Seq rate', '', 0, 8, 2, '%.0f', false, ['1/32', '1/16 triplet', '1/16', '1/8 triplet', '1/8', '1/4 triplet', '1/4', '1/2', '1 bar'])); at(kSeqLen, P('Seq length', '', 1, 16, 8, '%.0f')); at(kSeqGlide, P('Seq glide', '', 0, 1, 0, '%.2f'));
  for (let i = 0; i < kSteps; ++i) at(kSeqBase + i, P('Seq ' + (i + 1), '', -1, 1, 0, '%.2f'));
  for (let w = 0; w < kWires; ++w) { const a = 'Wire ' + (w + 1) + ' ', b = kWireBase + w * 4;
    at(b, P(a + 'Source', '', 0, kModSrc - 1, 0, '%.0f', false, MS_LABELS)); at(b + 1, P(a + 'Via', '', 0, kModSrc - 1, 0, '%.0f', false, MS_LABELS)); at(b + 2, P(a + 'Destination', '', 0, kDest - 1, 0, '%.0f', false, MD_LABELS)); at(b + 3, P(a + 'Amount', '', -1, 1, 0, '%.2f')); }
  at(kFxMode, P('Apparatus mode', '', 0, 1, 0, '%.0f', false, ['Series', 'Parallel']));
  for (let s = 0; s < kFx; ++s) { const a = 'App ' + (s + 1) + ' ', b = kFxBase + s * kFxN;
    at(b, P(a + 'Device', '', 0, DEVNAMES.length - 1, 0, '%.0f', false, DEVNAMES)); at(b + 1, P(a + 'On', '', 0, 1, 1, '%.0f', false, ['Off', 'On'])); at(b + 2, P(a + 'Page', '', 0, 3, 0, '%.0f', false, ['Dials 1-8', 'Dials 9-16', 'Dials 17-24', 'Dials 25-32']));
    for (let k = 0; k < 8; ++k) at(b + 3 + k, P(a + 'Dial ' + (k + 1), '', 0, 1, 0.5, '%.2f')); }
  at(kTempo, P('Tempo', 'BPM', 40, 240, 120, '%.0f BPM'));
  const E = Object.assign({ Count: kCount + 1, Tempo: kTempo, SrcBase: kSrcBase, FiltBase: kFiltBase, EnvBase: kEnvBase, LfoBase: kLfoBase, SeqBase: kSeqBase, WireBase: kWireBase, FxBase: kFxBase }, G);
  E.src = (s, p) => kSrcBase + s * kSrcN + p; E.SP = SP;
  const groups = [['Performance', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, kTempo]], ['Levers and Mutate', [11, 12, 13, 14, 15, 16, 17]]];
  for (let s = 0; s < kSrc; ++s) groups.push(['Specimen ' + 'ABCD'[s], Array.from({ length: kSrcN }, (_, i) => kSrcBase + s * kSrcN + i)]);
  groups.push(['Reagents (filters)', Array.from({ length: 12 }, (_, i) => kFiltBase + i).concat([kLinkId, kBalId])], ['Envelopes', Array.from({ length: 12 }, (_, i) => kEnvBase + i)], ['LFOs and Tesla', Array.from({ length: 12 }, (_, i) => kLfoBase + i)]);
  groups.push(['Sequencer', [kSeqRate, kSeqLen, kSeqGlide].concat(Array.from({ length: kSteps }, (_, i) => kSeqBase + i))]);
  for (let g = 0; g < 3; ++g) groups.push(['Wires ' + (g * 4 + 1) + '-' + (g * 4 + 4), Array.from({ length: 16 }, (_, i) => kWireBase + g * 16 + i)]);
  groups.push(['Apparatus', [kFxMode].concat(Array.from({ length: kFx * kFxN }, (_, i) => kFxBase + i))]);
  const NAMEID = {}; specs.forEach((s, i) => { NAMEID[s.name] = i; });
  const dialToPlain = (sp, nrm) => { nrm = clampf(nrm, 0, 1); if (sp.labels) return Math.round(nrm * (sp.labels.length - 1)); if (sp.log && sp.min > 0 && sp.max > 0) return sp.min * Math.pow(sp.max / sp.min, nrm); return sp.min + nrm * (sp.max - sp.min); };
  const plainToDial = (sp, p) => { if (sp.labels) return sp.labels.length > 1 ? clampf(p, 0, sp.labels.length - 1) / (sp.labels.length - 1) : 0; if (sp.log && sp.min > 0 && sp.max > 0) return clampf(Math.log(Math.max(p, sp.min) / sp.min) / Math.log(sp.max / sp.min), 0, 1); return sp.max === sp.min ? 0 : clampf((p - sp.min) / (sp.max - sp.min), 0, 1); };
  const TUNE_CENTS = [[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100], [0, 111.7, 203.9, 315.6, 386.3, 498.0, 590.2, 702.0, 813.7, 884.4, 996.1, 1088.3], [0, 90.2, 203.9, 294.1, 407.8, 498.0, 611.7, 702.0, 792.2, 905.9, 996.1, 1109.8],
    [0, 100, 200, 250, 350, 500, 600, 700, 800, 900, 950, 1050], [0, 100, 150, 300, 400, 500, 600, 700, 800, 900, 1000, 1100], [0, 90.2, 203.9, 294.1, 386.3, 498.0, 590.2, 702.0, 792.2, 884.4, 996.1, 1088.3],
    [0, 60, 120, 195, 270, 405, 540, 670, 727, 785, 868, 950], [0, 115, 231, 352, 474, 595, 717, 836, 955, 1075, 1138, 1169]];
  const VF = [[800, 1150, 2900], [400, 1600, 2700], [270, 2300, 3000], [450, 800, 2830], [325, 700, 2530]];

  /* ---- voice state */
  class Filt {
    constructor(sr) { this.lad = [new Ladder(), new Ladder()]; this.svf = [[new Svf(), new Svf(), new Svf()], [new Svf(), new Svf(), new Svf()]]; const n = (sr / 15) | 0; this.comb = [new DelayLine(n), new DelayLine(n)]; this.apz = [new Float64Array(5), new Float64Array(5)]; this.apc = 0; this.fb = 0; this.type = 0; this.combD = 100; this.vg = [1, 1, 1]; this.sr = sr; }
    clearState() { for (const l of this.lad) l.reset(); for (const a of this.svf) for (const s of a) s.reset(); for (let c = 0; c < 2; ++c) { this.comb[c].clear(); this.apz[c].fill(0); } }
    setup(t, hz, res, drv) {
      const sr = this.sr; this.type = t; hz = clampf(hz, 16, Math.min(20000, sr * 0.45));
      switch (t) {
        case 1: this.lad[0].set(hz, res, sr, 1 + drv * 4); this.lad[1].set(hz, res, sr, 1 + drv * 4); break;
        case 2: case 3: case 4: case 5: { const q = 0.55 + res * res * 18; for (let c = 0; c < 2; ++c) this.svf[c][0].set(hz, q, sr); break; }
        case 6: case 7: this.combD = clampf(sr / hz, 4, this.comb[0].mask - 8); this.fb = (t === 6 ? 1 : -1) * Math.min(res, 0.99) * 0.96; break;
        case 8: { const p = clampf(Math.log(hz / 40) / Math.log(12000 / 40), 0, 1) * 3.999, i = p | 0, f = p - i, q = 4 + res * 12; for (let c = 0; c < 2; ++c) for (let j = 0; j < 3; ++j) this.svf[c][j].set(VF[i][j] + (VF[i + 1][j] - VF[i][j]) * f, q, sr); this.vg[0] = 1; this.vg[1] = 0.7; this.vg[2] = 0.45; break; }
        case 9: { const g = Math.tan(kPif * hz / sr); this.apc = (g - 1) / (g + 1); this.fb = res * 0.85; break; }
      }
    }
    run(c, x) {
      switch (this.type) {
        case 1: return this.lad[c].run(x);
        case 2: return this.svf[c][0].run(x);
        case 3: { const s = this.svf[c][0]; s.run(x); return s.band * 1.4; }
        case 4: { const s = this.svf[c][0]; s.run(x); return s.high; }
        case 5: { const s = this.svf[c][0]; s.run(x); return s.low + s.high; }
        case 6: case 7: { const d = this.comb[c].read(this.combD), y = x + this.fb * d; this.comb[c].push(fastTanh(y)); return y * 0.6; }
        case 8: { let y = 0; for (let j = 0; j < 3; ++j) { const s = this.svf[c][j]; s.run(x); y += s.band * this.vg[j]; } return y * 1.2; }
        case 9: { const z = this.apz[c]; let s = fastTanh(x + this.fb * z[4]); for (let k = 0; k < 4; ++k) { const y = this.apc * s + z[k]; z[k] = s - this.apc * y; s = y; } z[4] = s; return 0.5 * (x + s); }
        default: return x;
      }
    }
  }
  class Src {
    constructor(sr, seed, i) {
      this.ph = 0; this.ph2 = 0; this.ph3 = 0; this.mph = 0; this.fbz = 0; this.out = 0; this.wrapped = false; this.lx = 1; this.ly = 1; this.lz = 1; this.tune = new Svf(); this.ns = new NoiseSrc(); this.ns.init(sr, seed * 31 + i);
      this.y1 = new Float64Array(10); this.y2 = new Float64Array(10); this.strike = 0; this.strikeLen = 1; this.strikeAmp = 0; this.burstLp = 0; this.dl = new DelayLine((sr / 15) | 0); this.lpz = 0;
      this.rng = new Noise((Math.imul(seed, 104729) + i * 977 + 5) >>> 0); this.centsOff = 0; this.held = 0; this.holdCnt = 0; this.var = [0, 0, 0];
      this.nm = 0; this.mc1 = new Float64Array(10); this.mc2 = new Float64Array(10); this.mamp = new Float64Array(10); this.sg = 0.99; this.sa = 0.5; this.sd = 100;
    }
  }
  class Voice {
    constructor(sr, seed) {
      this.gate = false; this.e1 = new Adsr(); this.e2 = new Adsr(); this.e3 = new Adsr(); this.note = 60; this.cur = 60; this.target = 60; this.vel = 1; this.age = 0; this.rnd = 0; this.rng = new Noise((Math.imul(seed, 7919) + 1) >>> 0);
      this.s = []; for (let i = 0; i < kSrc; ++i) this.s.push(new Src(sr, seed, i)); this.f = [new Filt(sr), new Filt(sr)]; this.lfoPh = [0, 0]; this.lfoHeld = [0, 0]; this.lfoSm = [0, 0]; this.lfoT = [0, 0]; this.lx = 1; this.ly = 1; this.lz = 1; this.seqT = 0;
      this.dCur = new Float64Array(kDest); this.dPrev = new Float64Array(kDest); const a4 = () => new Float64Array(4); this.semisCur = a4(); this.semisPrev = a4(); this.lvlCur = a4(); this.lvlPrev = a4(); this.shp = a4(); this.col = a4(); this.mdv = a4(); this.xam = a4(); this.gl = a4(); this.gr = a4();
      this.ageCut = 0; this.ageTime = 1; this.ampCur = 0; this.ampPrev = 0; this.e2v = 0; this.e3v = 0; this.e1v = 0; this.balG1 = 1; this.balG2 = 1; this.panG = [1, 1]; this.tick = 0; this.mod = new Float64Array(kModSrc);
      this.e1.setSr(sr); this.e2.setSr(sr); this.e3.setSr(sr); this.kill();
    }
    alive() { return this.gate || this.e1.active(); }
    release() { if (this.gate) { this.gate = false; this.e1.gateOff(); this.e2.gateOff(); this.e3.gateOff(); } }
    kill() { this.gate = false; this.e1.kill(); this.e2.kill(); this.e3.kill(); this.ampPrev = this.ampCur = 0; }
  }
  const panL = p => Math.cos((p * 0.5 + 0.5) * kPif * 0.5), panR = p => Math.sin((p * 0.5 + 0.5) * kPif * 0.5);
  const isBipolar = s => s === MLfo1 || s === MLfo2 || s === MTesla || s === MSeq || s === MBend || s === MRand || s === MKey || (s >= MSpecA && s <= MSpecA + 3);
  const LFO_BEATS = [0, 4, 2, 1, 0.5, 0.25, 0.125, 3, 1.5, 0.75, 2 / 3, 1 / 3], SEQ_BEATS = [0.125, 1 / 6, 0.25, 1 / 3, 0.5, 2 / 3, 1, 2, 4], IV = [-12, -7, -5, 0, 0, 5, 7, 12, 19];
  function oscWave(ph, pm, dt, pw, shape) {
    ph += pm; ph -= Math.floor(ph); const sw = 2 * ph - 1 - polyBlep(ph, dt); let sq = ph < pw ? 1 : -1; sq += polyBlep(ph, dt); let t2 = ph + 1 - pw; if (t2 >= 1) t2 -= 1; sq -= polyBlep(t2, dt);
    const tri = 4 * Math.abs(ph - 0.5) - 1, sn = fsin(ph), p3 = shape * 3; if (p3 < 1) return sw + (sq * 0.8 - sw) * p3; if (p3 < 2) return sq * 0.8 + (tri - sq * 0.8) * (p3 - 1); return tri + (sn - tri) * (p3 - 2);
  }
  class Modica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); this.voice = []; for (let i = 0; i < kVoices; ++i) this.voice.push(new Voice(sr, i + 1)); this.held = []; this.lastNote = -1; this.counter = 0; this.bend = 0; this.mod = 0; this.press = 0; this.expr = 1; this.mrng = 0;
      this.fx = [null, null, null]; this.fxType = [-1, -1, -1]; this.BS = 512; this.accL = new Float32Array(512); this.accR = new Float32Array(512); this.tmpL = new Float32Array(512); this.tmpR = new Float32Array(512); this.sumL = new Float32Array(512); this.sumR = new Float32Array(512);
      this.dT = new Float64Array(kDest); this.cType = new Int32Array(4); this.cRoute = new Int32Array(4); this.cX = new Int32Array(4); this.cXM = new Int32Array(4); this.cTab = new Int32Array(4); this.cNz = new Int32Array(4); this.cBody = new Int32Array(4); this.wr = [false, false, false, false];
    }
    tunedSemis(note) {
      const V = this.v, t = clampf(Math.round(V[G.Tuning]), 0, 7), tonic = clampf(Math.round(V[G.Tonic]), 0, 11), rel = note - tonic, oct = Math.floor(rel / 12), pc = rel - oct * 12; return tonic + oct * 12 + TUNE_CENTS[t][pc] * 0.01;
    }
    /* ---- parameter changes */
    set(id, x) {
      if (id < 0 || id > kCount) return; const old = this.v[id]; this.v[id] = x;
      if (id === G.Preset) { this.loadPreset(Math.round(x)); return; }
      if (id === G.Mutate) { if (x >= 0.5 && old < 0.5) { this.mutate(); this.writeParam(G.Mutate, 0); this.v[G.Mutate] = 0; } return; }
      if (id >= kFxBase && id < kCount) { const s = ((id - kFxBase) / kFxN) | 0, r = (id - kFxBase) % kFxN; if (r === 0) this.setDevice(s, Math.round(x)); else if (r === 2) this.applyFxPage(s); else if (r >= 3) this.applyDial(s, r - 3); }
    }
    setDevice(s, idx) {
      const type = idx - 1; if (type === this.fxType[s] && this.fx[s]) return; this.fx[s] = null; this.fxType[s] = -1; if (type < 0 || type >= FXLIST.length) return;
      const d = FXLIST[type]; this.fx[s] = d.make(this.sr); this.fxType[s] = type; const ps = d.ps; for (let i = 0; i < ps.length; ++i) this.fx[s].set(i, ps[i].def);
      const page = clampf(Math.round(this.v[kFxBase + s * kFxN + 2]), 0, 3);
      for (let k = 0; k < 8; ++k) { const pi = page * 8 + k; if (pi < ps.length) { const nrm = plainToDial(ps[pi], ps[pi].def); this.v[kFxBase + s * kFxN + 3 + k] = nrm; this.writeParam(kFxBase + s * kFxN + 3 + k, nrm); } }
    }
    applyDial(s, k) { if (!this.fx[s] || this.fxType[s] < 0) return; const ps = FXLIST[this.fxType[s]].ps, page = clampf(Math.round(this.v[kFxBase + s * kFxN + 2]), 0, 3), pi = page * 8 + k; if (pi < ps.length) this.fx[s].set(pi, dialToPlain(ps[pi], this.v[kFxBase + s * kFxN + 3 + k])); }
    applyFxPage(s) {
      if (!this.fx[s] || this.fxType[s] < 0) return; const ps = FXLIST[this.fxType[s]].ps, page = clampf(Math.round(this.v[kFxBase + s * kFxN + 2]), 0, 3);
      for (let k = 0; k < 8; ++k) { const pi = page * 8 + k; if (pi < ps.length) { const nrm = plainToDial(ps[pi], ps[pi].def); this.v[kFxBase + s * kFxN + 3 + k] = nrm; this.writeParam(kFxBase + s * kFxN + 3 + k, nrm); this.fx[s].set(pi, ps[pi].def); } }
    }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.mod = m; } pressure(p) { this.press = p; }
    allNotesOff() { this.held.length = 0; for (const v of this.voice) v.release(); }
    /* ---- notes */
    noteOn(note, vel) {
      const V = this.v; this.held = this.held.filter(n => n !== note); this.held.push(note);
      const mode = Math.round(V[G.Mode]), maxV = clampf(Math.round(V[G.Voices]), 1, kVoices), tuned = this.tunedSemis(note) + this.noteTune * 0.01, glide = V[G.Glide] > 0.001 && this.lastNote >= 0;
      if (mode !== 0) {
        for (let i = 1; i < kVoices; ++i) if (this.voice[i].gate) this.voice[i].release();
        const v = this.voice[0], legato = mode === 2 && v.gate; v.target = tuned; v.note = note; v.vel = vel;
        if (!legato) this.startVoice(v, note, vel, tuned, glide && v.alive()); else if (!glide) v.cur = tuned; this.lastNote = note; return;
      }
      let pick = -1; for (let i = 0; i < maxV; ++i) if (!this.voice[i].alive()) { pick = i; break; }
      if (pick < 0) { let old = Infinity; for (let i = 0; i < maxV; ++i) if (this.voice[i].age < old) { old = this.voice[i].age; pick = i; } }
      for (let i = maxV; i < kVoices; ++i) if (this.voice[i].gate) this.voice[i].release();
      this.startVoice(this.voice[pick], note, vel, tuned, false); this.lastNote = note;
    }
    noteOff(note) {
      const wasLast = this.held.length > 0 && this.held[this.held.length - 1] === note; this.held = this.held.filter(n => n !== note); const mode = Math.round(this.v[G.Mode]);
      if (mode !== 0) { const v = this.voice[0]; if (this.held.length && wasLast && v.gate) { const n = this.held[this.held.length - 1]; v.target = this.tunedSemis(n); v.note = n; if (mode === 1) this.startVoice(v, n, v.vel, v.target, this.v[G.Glide] > 0.001); this.lastNote = n; } else if (!this.held.length) v.release(); return; }
      for (const v of this.voice) if (v.gate && v.note === note) v.release();
    }
    startVoice(v, note, vel, tuned, glide) {
      const V = this.v, sr = this.sr; v.gate = true; v.note = note; v.vel = vel; v.age = ++this.counter; v.target = tuned; if (!glide) v.cur = tuned; v.rnd = v.rng.white();
      const age = V[G.Age]; v.ageCut = v.rng.white() * age * 0.15; v.ageTime = 1 + v.rng.white() * age * 0.12; const t = v.ageTime, e = kEnvBase;
      v.e1.set(V[e] * t, V[e + 1] * t, V[e + 2], V[e + 3] * t); v.e2.set(V[e + 4] * t, V[e + 5] * t, V[e + 6], V[e + 7] * t); v.e3.set(V[e + 8] * t, V[e + 9] * t, V[e + 10], V[e + 11] * t);
      v.e1.gateOn(true); v.e2.gateOn(true); v.e3.gateOn(true); v.e1v = v.e2v = v.e3v = 0;
      for (let l = 0; l < 2; ++l) { const restart = V[kLfoBase + l * 5 + 4] > 0.5; v.lfoPh[l] = restart ? 0 : (v.rng.white() * 0.5 + 0.5); v.lfoHeld[l] = v.rng.white(); v.lfoSm[l] = v.lfoHeld[l]; v.lfoT[l] = 0; }
      v.lx = 1 + v.rng.white() * 0.5; v.ly = 1 + v.rng.white() * 0.5; v.lz = 10 + v.rng.white() * 5; v.seqT = 0; v.tick = 0; v.ampPrev = v.ampCur = 0; for (const f of v.f) f.clearState();
      const varAmt = V[G.Variation];
      for (let s = 0; s < kSrc; ++s) {
        const r = v.s[s], b = kSrcBase + s * kSrcN; r.centsOff = r.rng.white() * age * 8; for (let k = 0; k < 3; ++k) r.var[k] = r.rng.white() * varAmt * 0.25;
        const p0 = age > 0.001 || varAmt > 0.001 ? r.rng.white() * 0.5 + 0.5 : 0; r.ph = p0; r.ph2 = p0 + 0.33; r.ph3 = p0 + 0.66; r.mph = 0; r.fbz = 0; r.out = 0; r.lx = 1 + r.rng.white() * 0.3; r.ly = 1; r.lz = 1; r.lpz = 0; r.tune.reset();
        r.y1.fill(0); r.y2.fill(0); r.dl.clear(); r.burstLp = 0; const type = Math.round(V[b + SP.Type]);
        if (type === TModal) { const hard = V[b + SP.Mod]; r.strikeLen = 24 + ((1 - hard) * 220 | 0); r.strike = r.strikeLen; r.strikeAmp = 0.35 * (0.4 + 0.6 * vel); }
        else if (type === TString) { const hz = midiHz(tuned); r.strikeLen = Math.max(8, (sr / Math.max(20, hz)) | 0); r.strike = r.strikeLen; r.strikeAmp = 0.8 * (0.4 + 0.6 * vel); } else r.strike = 0;
      }
    }
    /* ---- control rate */
    controlTick(v) {
      const V = this.v, sr = this.sr, tdt = kTick / sr, bps = V[kTempo] / 60, mod = v.mod;
      for (let l = 0; l < 2; ++l) {
        const b = kLfoBase + l * 5, sync = Math.round(V[b + 1]); let hz = sync === 0 ? V[b] : bps / LFO_BEATS[clampf(sync, 1, 11)]; hz *= Math.pow(2, v.dPrev[DLfo1 + l] * 3);
        v.lfoPh[l] += hz * tdt; let wrap = false; if (v.lfoPh[l] >= 1) { v.lfoPh[l] -= Math.floor(v.lfoPh[l]); wrap = true; } v.lfoT[l] += tdt; const shape = Math.round(V[b + 2]); if (wrap) v.lfoHeld[l] = v.rng.white(); let o; const ph = v.lfoPh[l];
        switch (shape) { case 0: o = Math.sin(PI2 * ph); break; case 1: o = 4 * Math.abs(ph - 0.5) - 1; break; case 2: o = 2 * ph - 1; break; case 3: o = ph < 0.5 ? 1 : -1; break; case 4: o = v.lfoHeld[l]; break; default: v.lfoSm[l] += (v.lfoHeld[l] - v.lfoSm[l]) * Math.min(1, hz * tdt * 6); o = v.lfoSm[l]; }
        const fade = V[b + 3]; mod[MLfo1 + l] = o * (fade > 0.001 ? Math.min(1, v.lfoT[l] / fade) : 1);
      }
      { const rho = 12 + 48 * V[kTeslaChar], spd = V[kTeslaSpeed] * Math.pow(2, v.dPrev[DTesla] * 3); let h = spd * tdt; const steps = Math.max(1, Math.min(20, ((h / 0.01) | 0) + 1)); h /= steps;
        for (let k = 0; k < steps; ++k) { const dx = 10 * (v.ly - v.lx), dy = v.lx * (rho - v.lz) - v.ly, dz = v.lx * v.ly - 2.6667 * v.lz; v.lx += dx * h; v.ly += dy * h; v.lz += dz * h; }
        if (!isFinite(v.lx + v.ly + v.lz) || Math.abs(v.lx) > 200) { v.lx = 1; v.ly = 1; v.lz = 10; } mod[MTesla] = clampf(v.lx / 20, -1, 1); }
      { const stepBeats = SEQ_BEATS[clampf(Math.round(V[kSeqRate]), 0, 8)]; v.seqT += bps * tdt / stepBeats; const len = clampf(Math.round(V[kSeqLen]), 1, kSteps), idx = Math.floor(v.seqT) % len, fr = v.seqT - Math.floor(v.seqT);
        const cur = V[kSeqBase + idx], prev = V[kSeqBase + (idx + len - 1) % len], g = V[kSeqGlide], t = g <= 0.001 ? 1 : Math.min(1, fr / g), sm = t * t * (3 - 2 * t); mod[MSeq] = prev + (cur - prev) * sm; if (v.seqT > 1e6) v.seqT = 0; }
      mod[MEnv2] = v.e2v; mod[MEnv3] = v.e3v; mod[MEnv1] = v.e1v; mod[MVel] = v.vel; mod[MKey] = clampf((v.note - 60) / 36, -1, 1); mod[MWheel] = this.mod; mod[MPress] = this.press; mod[MBend] = this.bend; mod[MExpr] = this.expr;
      for (let i = 0; i < 4; ++i) mod[MLever1 + i] = V[G.Lever1 + i]; mod[MRand] = v.rnd; for (let s = 0; s < kSrc; ++s) mod[MSpecA + s] = v.s[s].out; mod[MOne] = 1;
      v.dPrev.set(v.dCur); const d = this.dT; d.fill(0);
      for (let w = 0; w < kWires; ++w) { const b = kWireBase + w * 4, dst = Math.round(V[b + 2]), amt = V[b + 3]; if (dst <= 0 || dst >= kDest || amt === 0) continue; const src = Math.round(V[b]); if (src <= 0 || src >= kModSrc) continue;
        let x = mod[src]; const via = Math.round(V[b + 1]); if (via > 0 && via < kModSrc) { let m = mod[via]; if (isBipolar(via)) m = m * 0.5 + 0.5; x *= clampf(m, 0, 1); } d[dst] += x * amt; }
      v.dCur.set(d); const vs = V[G.VelSens], velScale = 1 - vs + vs * v.vel;
      for (let s = 0; s < kSrc; ++s) {
        const b = kSrcBase + s * kSrcN, r = v.s[s]; v.semisPrev[s] = v.semisCur[s]; v.lvlPrev[s] = v.lvlCur[s]; const track = V[b + SP.Track], key = v.cur + this.bend * V[G.BendRange], base = 60 + (key - 60) * track;
        v.semisCur[s] = base + V[b + SP.Coarse] + (V[b + SP.Fine] + r.centsOff) * 0.01 + d[DPitch + s] * 24 + d[DPitchAll] * 24; v.lvlCur[s] = clampf(V[b + SP.Level] + d[DLevel + s], 0, 1.5);
        v.shp[s] = clampf(V[b + SP.Shape] + d[DShape + s] + r.var[0], 0, 1); v.col[s] = clampf(V[b + SP.Colour] + d[DColour + s] + r.var[1], 0, 1); v.mdv[s] = clampf(V[b + SP.Mod] + d[DMod + s] + r.var[2], 0, 1);
        v.xam[s] = clampf(V[b + SP.XAmt] + d[DCross + s], 0, 1); const pan = clampf(V[b + SP.Pan], -1, 1); v.gl[s] = panL(pan); v.gr[s] = panR(pan);
      }
      for (let f = 0; f < 2; ++f) { const b = kFiltBase + f * kFiltN, oct = v.e2v * V[b + 5] * 5 + (v.note - 60) / 12 * V[b + 4] + d[DCut1 + f * 2] * 5 + v.ageCut, hz = V[b + 1] * Math.pow(2, oct), res = clampf(V[b + 2] + d[DRes1 + f * 2], 0, 1.1);
        v.f[f].setup(Math.round(V[b]), hz, res, clampf(V[b + 3] + d[DDrive] * 0.5, 0, 1)); }
      const bal = clampf(V[kBalId] + d[DBal], 0, 1); v.balG1 = Math.min(1, 2 * (1 - bal)); v.balG2 = Math.min(1, 2 * bal); const pan = clampf(d[DPan], -1, 1); v.panG[0] = panL(pan) * 1.414; v.panG[1] = panR(pan) * 1.414;
      v.ampPrev = v.ampCur; v.ampCur = Math.max(0, 1 + d[DAmp]) * velScale;
      // bell and string coefficients follow the pitch once per control tick
      for (let s = 0; s < kSrc; ++s) { const t = this.cType[s]; if (t !== TModal && t !== TString) continue; const hz = Math.min(midiHz(v.semisPrev[s]), sr * 0.45), r = v.s[s]; if (t === TModal) this.modalCoef(r, hz, v.shp[s], v.col[s], this.cBody[s]); else this.stringCoef(r, hz, v.shp[s], v.col[s]); }
    }
    modalCoef(r, hz, shape, colour, bi) {
      const sr = this.sr, body = BODY[bi], bright = 0.4 + clampf(shape, 0, 1) * 1.2, dscale = 0.25 * Math.pow(16, clampf(colour, 0, 1)), hzM = clampf(hz, 1, sr * 0.45); let n = 0;
      for (let k = 0; k < body.n; ++k) { const f = hzM * body.ratio[k]; if (f > sr * 0.45) break; const t60 = Math.max(0.002, body.t60[k] * dscale), rr = Math.min(0.99995, Math.exp(-6.9078 / (t60 * sr))), th = 2 * kPif * f / sr;
        r.mc1[k] = 2 * rr * Math.cos(th); r.mc2[k] = rr * rr; r.mamp[k] = body.amp[k] * Math.pow(Math.min(1, bright * 0.8), k * 0.7) * 0.5; ++n; } r.nm = n;
    }
    stringCoef(r, hz, shape, colour) {
      const sr = this.sr, sh = clampf(shape, 0, 1), co = clampf(colour, 0, 1), t60 = 0.15 * Math.pow(80, sh), a = 0.12 + 0.88 * co * co + 0.0001, f = clampf(hz, 20, sr * 0.4);
      r.sa = a; r.sg = Math.min(0.9995, Math.pow(10, -3 / (t60 * f))); r.sd = Math.max(2.5, sr / f - (1 - a) / a - 0.5);
    }
    /* ---- one specimen, one sample */
    gen(v, s, type, hz, xv, xw) {
      const r = v.s[s], sr = this.sr, shape = v.shp[s], colour = v.col[s], mod = v.mdv[s], xamt = v.xam[s], xmode = this.cXM[s], hasX = this.cX[s] > 0 && xamt > 0.0005;
      const pm = hasX && xmode === 0 ? xv * xamt * 1.5 : 0; if (hasX && xmode === 3 && xw && xamt > 0.01) { r.ph = r.ph2 = r.ph3 = 0; r.mph = 0; }
      const dt = Math.min(0.45, hz / sr); let out = 0; r.wrapped = false;
      switch (type) {
        case TAnalog: { const pw = 0.05 + 0.9 * colour;
          if (mod < 0.01) out = oscWave(r.ph, pm, dt, pw, shape);
          else { const sp = mod * 0.02; out = (oscWave(r.ph, pm, dt, pw, shape) + oscWave(r.ph2, pm, dt, pw, shape) + oscWave(r.ph3, pm, dt, pw, shape)) * 0.58;
            let w2 = r.ph2 + dt * (1 + sp); if (w2 >= 1) { w2 -= Math.floor(w2); r.wrapped = true; } let w3 = r.ph3 + dt * (1 - sp * 1.3); if (w3 >= 1) { w3 -= Math.floor(w3); r.wrapped = true; } r.ph2 = w2; r.ph3 = w3; }
          r.ph += dt; if (r.ph >= 1) { r.ph -= Math.floor(r.ph); r.wrapped = true; } break; }
        case TFm: { const ratio = 0.25 * Math.pow(2, colour * 6), idx = shape * shape * 2; r.mph += dt * ratio; if (r.mph >= 1) { r.mph -= Math.floor(r.mph); r.wrapped = true; }
          const m = fsin(r.mph + mod * 0.25 * r.fbz); r.fbz = m; out = fsin(r.ph + pm + idx * m); r.ph += dt; if (r.ph >= 1) { r.ph -= Math.floor(r.ph); r.wrapped = true; } break; }
        case TWave: { const sweep = 1 + mod * 7; let ph = r.ph + pm; ph -= Math.floor(ph); if (colour > 0.001) ph = Math.pow(ph, 1 + colour * 3); let q = ph * sweep; q -= Math.floor(q);
          out = wtRead(this.cTab[s], hz * sweep, sr, q, shape); r.ph += dt; if (r.ph >= 1) { r.ph -= Math.floor(r.ph); r.wrapped = true; } break; }
        case TNoise: { const nt = this.cNz[s];
          if (mod > 0.001) { if (--r.holdCnt <= 0) { r.held = r.ns.next(nt, shape); r.holdCnt = 1 + ((mod * mod * 60) | 0); } out = r.held; } else out = r.ns.next(nt, shape);
          if (colour > 0.01) { const q = 2 + colour * colour * 120; r.tune.set(hz, q, sr); r.tune.run(out); const tuned = r.tune.band * r.tune.k * Math.sqrt(q) * 1.6; out += (tuned - out) * Math.min(1, colour * 1.5); } break; }
        case TModal: { let e = 0; if (r.strike > 0) { const env = r.strike / r.strikeLen; e += r.rng.white() * r.strikeAmp * env; --r.strike; } if (hasX && xmode === 4) e += xv * xamt * 0.5; let sum = 0;
          for (let k = 0; k < r.nm; ++k) { const y = r.mamp[k] * e + r.mc1[k] * r.y1[k] - r.mc2[k] * r.y2[k]; if (!(Math.abs(y) < 50)) { r.y1[k] = r.y2[k] = 0; continue; } r.y2[k] = r.y1[k]; r.y1[k] = y; sum += y; } out = sum; break; }
        case TString: { const moS = clampf(mod, 0, 1); let e = 0; if (r.strike > 0) { r.burstLp += (r.rng.white() - r.burstLp) * (0.15 + 0.85 * moS); e += r.burstLp * r.strikeAmp; --r.strike; } if (hasX && xmode === 4) e += xv * xamt * 0.3;
          const y = r.dl.read(r.sd); r.lpz += (y - r.lpz) * r.sa; if (!isFinite(y) || !isFinite(e)) { r.dl.clear(); r.lpz = 0; r.burstLp = 0; out = 0; break; } r.dl.push(clampf(e + r.lpz * r.sg, -8, 8)); out = y; break; }
        default: { let h = 0.7 * hz / sr * (0.5 + colour * 1.5); const steps = Math.max(1, Math.min(8, ((h / 0.01) | 0) + 1)); h /= steps;
          for (let k = 0; k < steps; ++k) { const dx = 10 * (r.ly - r.lx), dy = r.lx * (28 - r.lz) - r.ly, dz = r.lx * r.ly - 2.6667 * r.lz; r.lx += dx * h; r.ly += dy * h; r.lz += dz * h; }
          if (!isFinite(r.lx + r.ly + r.lz) || Math.abs(r.lx) > 200) { r.lx = 1; r.ly = 1; r.lz = 10; }
          const xn = clampf(r.lx / 20, -1, 1), zn = clampf(r.lz / 50, 0, 1); out = fsin(r.ph + pm + shape * 1.5 * xn) * (1 - mod * 0.6 + mod * 0.6 * zn); r.ph += dt; if (r.ph >= 1) { r.ph -= Math.floor(r.ph); r.wrapped = true; } }
      }
      if (hasX) { if (xmode === 1) out += (out * xv - out) * xamt; else if (xmode === 2) out *= (1 - xamt) + xamt * (0.5 + 0.5 * xv); }
      return out < -4 ? -4 : (out > 4 ? 4 : out);
    }
    renderVoice(v, L, R, n) {
      const V = this.v, sr = this.sr, serial = V[kLinkId] > 0.5, types = this.cType, routes = this.cRoute, xsrcs = this.cX, wr = this.wr; let any = false;
      for (let s = 0; s < kSrc; ++s) any = any || types[s] !== TEmpty;
      const glideC = V[G.Glide] <= 0.001 ? 1 : 1 - Math.exp(-1 / (V[G.Glide] * 0.3 * sr)), f1 = v.f[0], f2 = v.f[1], maxHz = sr * 0.45;
      for (let i = 0; i < n; ++i) {
        if (v.tick === 0) this.controlTick(v);
        const fr = (v.tick + 1) / kTick; v.e1v = v.e1.next(); v.e2v = v.e2.next(); v.e3v = v.e3.next(); v.cur += (v.target - v.cur) * glideC;
        let a0l = 0, a0r = 0, a1l = 0, a1r = 0, a2l = 0, a2r = 0; wr[0] = wr[1] = wr[2] = wr[3] = false;
        if (any) for (let s = 0; s < kSrc; ++s) {
          const sp = v.s[s]; if (types[s] === TEmpty) { sp.out = 0; wr[s] = false; continue; }
          const xs = xsrcs[s]; let xv = 0, xw = false; if (xs > 0) { const q = xs - 1; xv = v.s[q].out; xw = q < s ? wr[q] : v.s[q].wrapped; }
          const semis = v.semisPrev[s] + (v.semisCur[s] - v.semisPrev[s]) * fr, hz = Math.min(midiHz(semis), maxHz);
          let o = this.gen(v, s, types[s], hz, xv, xw); wr[s] = sp.wrapped; sp.out = o; o *= v.lvlPrev[s] + (v.lvlCur[s] - v.lvlPrev[s]) * fr; const rt = routes[s], lg = v.gl[s] * 1.414, rg = v.gr[s] * 1.414;
          if (rt === 0 || rt === 2) { a0l += o * lg; a0r += o * rg; } if (rt === 1 || rt === 2) { a1l += o * lg; a1r += o * rg; } if (rt === 3) { a2l += o * lg; a2r += o * rg; }
        }
        let yl, yr;
        if (serial) { const b0 = f1.run(0, a0l), b1 = f1.run(1, a0r); yl = f2.run(0, b0 + a1l) + a2l; yr = f2.run(1, b1 + a1r) + a2r; }
        else { yl = f1.run(0, a0l) * v.balG1 + f2.run(0, a1l) * v.balG2 + a2l; yr = f1.run(1, a0r) * v.balG1 + f2.run(1, a1r) * v.balG2 + a2r; }
        const amp = v.e1v * (v.ampPrev + (v.ampCur - v.ampPrev) * fr); L[i] += yl * amp * v.panG[0]; R[i] += yr * amp * v.panG[1]; if (++v.tick >= kTick) v.tick = 0;
      }
    }
    chunk(outL, outR, n) {
      const V = this.v; this.accL.fill(0, 0, n); this.accR.fill(0, 0, n);
      for (let s = 0; s < kSrc; ++s) { const b = kSrcBase + s * kSrcN; this.cType[s] = clampf(Math.round(V[b]), 0, 7); this.cRoute[s] = clampf(Math.round(V[b + SP.Route]), 0, 3); this.cX[s] = clampf(Math.round(V[b + SP.XSrc]), 0, 4); this.cXM[s] = Math.round(V[b + SP.XMode]);
        this.cTab[s] = clampf(Math.round(V[b + SP.Table]), 0, kTables - 1); this.cNz[s] = clampf(Math.round(V[b + SP.Noise]), 0, NTypeCount - 1); this.cBody[s] = clampf(Math.round(V[b + SP.Body]), 0, BODY.length - 1); }
      for (const v of this.voice) if (v.alive()) this.renderVoice(v, this.accL, this.accR, n);
      this.applyFx(n); const vol = Math.pow(10, V[G.Volume] / 20); for (let i = 0; i < n; ++i) { outL[i] = fastTanh(this.accL[i] * vol); outR[i] = fastTanh(this.accR[i] * vol); }
    }
    applyFx(n) {
      const V = this.v, par = V[kFxMode] > 0.5; let used = 0, L = this.accL, R = this.accR; if (par) { this.sumL.fill(0, 0, n); this.sumR.fill(0, 0, n); }
      for (let s = 0; s < kFx; ++s) { const f = this.fx[s]; if (!f || V[kFxBase + s * kFxN + 1] < 0.5) continue; f.tempo = V[kTempo]; f.process(L, R, this.tmpL, this.tmpR, n); ++used;
        if (par) for (let i = 0; i < n; ++i) { this.sumL[i] += this.tmpL[i]; this.sumR[i] += this.tmpR[i]; } else { L.set(this.tmpL.subarray(0, n)); R.set(this.tmpR.subarray(0, n)); } }
      if (par && used) { const g = 1 / Math.sqrt(used); for (let i = 0; i < n; ++i) { L[i] = this.sumL[i] * g; R[i] = this.sumR[i] * g; } }
    }
    process(outL, outR, n) { for (let pos = 0; pos < n;) { const c = Math.min(n - pos, this.BS); this.chunk(outL.subarray(pos, pos + c), outR.subarray(pos, pos + c), c); pos += c; } }
    /* ---- mutate */
    mr() { let m = this.mrng; m ^= m << 13; m ^= m >>> 17; m ^= m << 5; this.mrng = m >>> 0; return (this.mrng & 0xFFFFFF) / 16777216; }
    mbi() { return this.mr() * 2 - 1; }
    put(id, val) { const sp = specs[id]; val = clampf(val, Math.min(sp.min, sp.max), Math.max(sp.min, sp.max)); if (sp.labels) val = Math.round(val); this.v[id] = val; this.set(id, val); this.writeParam(id, val); }
    nudge(id, amt) { const sp = specs[id], cur = this.v[id]; if (sp.log && sp.min > 0) this.put(id, cur * Math.pow(sp.max / sp.min, this.mbi() * amt * 0.25)); else this.put(id, cur + this.mbi() * amt * (sp.max - sp.min) * 0.5); }
    mutate() {
      const V = this.v; if (!this.mrng) this.mrng = 0x2545F491; this.mrng = (this.mrng ^ Math.imul(++this.counter, 2654435761)) >>> 0; if (!this.mrng) this.mrng = 1; const a = V[G.MutateAmt], scope = clampf(Math.round(V[G.MutateScope]), 0, 3);
      if (scope === 0 || scope === 3) for (let s = 0; s < kSrc; ++s) { const b = kSrcBase + s * kSrcN, type = Math.round(V[b]); if (type === TEmpty) continue;
        this.nudge(b + SP.Shape, a); this.nudge(b + SP.Colour, a); this.nudge(b + SP.Mod, a * 0.7); if (s > 0 && this.mr() < a) this.put(b + SP.Coarse, IV[(this.mr() * 9 | 0) % 9]); this.put(b + SP.Fine, V[b + SP.Fine] + this.mbi() * a * 15);
        if (type === TWave && this.mr() < a * 0.6) this.put(b + SP.Table, this.mr() * kTables | 0); if (type === TModal && this.mr() < a * 0.5) this.put(b + SP.Body, this.mr() * BODY.length | 0); if (type === TNoise && this.mr() < a * 0.4) this.put(b + SP.Noise, this.mr() * NTypeCount | 0);
        if (s > 0 && this.mr() < a * 0.4) { this.put(b + SP.XSrc, 1 + ((this.mr() * 4 | 0) % 4)); this.put(b + SP.XAmt, this.mr() * a); this.put(b + SP.XMode, (this.mr() * 5 | 0) % 5); } }
      if (scope === 1 || scope === 3) { for (let f = 0; f < 2; ++f) { const b = kFiltBase + f * kFiltN; if (Math.round(V[b]) === 0) continue; this.nudge(b + 1, a * 1.5); this.nudge(b + 2, a); this.nudge(b + 3, a * 0.5); this.nudge(b + 5, a); }
        for (let e = 0; e < 3; ++e) for (let k = 0; k < 4; ++k) if (e !== 0 || k !== 2) this.nudge(kEnvBase + e * 4 + k, a * 0.6); }
      if (scope === 2 || scope === 3) for (let w = 0; w < kWires; ++w) { const b = kWireBase + w * 4, used = Math.round(V[b + 2]) > 0 && V[b + 3] !== 0;
        if (used) { this.put(b + 3, V[b + 3] + this.mbi() * a * 0.5); if (this.mr() < a * 0.3) this.put(b, 1 + ((this.mr() * (kModSrc - 1) | 0) % (kModSrc - 1))); if (this.mr() < a * 0.2) this.put(b + 2, 1 + ((this.mr() * (kDest - 1) | 0) % (kDest - 1))); }
        else if (this.mr() < a * 0.2) { this.put(b, 1 + ((this.mr() * (kModSrc - 1) | 0) % (kModSrc - 1))); this.put(b + 2, 1 + ((this.mr() * (kDest - 1) | 0) % (kDest - 1))); this.put(b + 3, this.mbi() * 0.6); } }
    }
    loadPreset(idx) {
      idx = clampf(idx, 0, PRESETS.length - 1); const val = new Float64Array(kCount); for (let i = 0; i < kCount; ++i) val[i] = specs[i].def;
      for (const k in PRESETS[idx]) { const id = NAMEID[k]; if (id > 0) val[id] = PRESETS[idx][k]; }
      for (let id = 1; id < kCount; ++id) { if (id === G.Mutate || id === G.MutateAmt || id === G.MutateScope) continue; this.v[id] = val[id]; this.set(id, val[id]); this.writeParam(id, val[id]); }
    }
  }
  const D = nm => devIdx(nm);
  const PRESETS = [
    {},
    { 'A Type': 1, 'A Coarse': -12, 'A Shape': 0, 'A Level': 0.7, 'B Type': 1, 'B Coarse': -12, 'B Fine': 9, 'B Shape': 0.33, 'B Colour': 0.35, 'B Level': 0.6, 'C Type': 1, 'C Coarse': -24, 'C Shape': 1, 'C Level': 0.5, 'C Route': 3, 'R1 Cutoff': 420, 'R1 Resonance': 0.35, 'R1 Drive': 0.5, 'R1 Env 2 amount': 0.6, 'Env 2 Decay': 0.35, 'Env 2 Sustain': 0.15, 'Env 1 Release': 0.2, 'Mode': 2, 'Glide': 0.12, 'Voices': 1 },
    { 'A Type': 2, 'A Colour': 0.58, 'A Shape': 0.35, 'A Mod': 0.2, 'A Level': 0.5, 'B Type': 3, 'B Wavetable': 10, 'B Shape': 0.5, 'B Level': 0.5, 'B Cross source': 1, 'B Cross mode': 3, 'B Cross amount': 0.5, 'R1 Cutoff': 6000, 'R1 Key tracking': 0.7,
      'Wire 1 Source': 4, 'Wire 1 Destination': 10, 'Wire 1 Amount': 0.3, 'Wire 2 Source': 6, 'Wire 2 Destination': 14, 'Wire 2 Amount': 0.25, 'LFO 1 Rate': 5.5, 'Wire 3 Source': 4, 'Wire 3 Destination': 1, 'Wire 3 Amount': 0.02, 'Wire 3 Via': 10, 'Mode': 2, 'Voices': 1 },
    { 'A Type': 2, 'A Colour': 0.75, 'A Shape': 0.3, 'A Level': 0.5, 'B Type': 5, 'B Body': 2, 'B Level': 0.7, 'B Shape': 0.7, 'B Mod': 0.8, 'B Cross source': 1, 'B Cross mode': 4, 'B Cross amount': 0.5, 'A Route': 3, 'B Route': 2, 'Env 1 Attack': 0.001, 'Env 1 Decay': 1.2, 'Env 1 Sustain': 0,
      'Env 1 Release': 2.5, 'R1 Type': 1, 'R1 Cutoff': 9000, 'App 1 Device': D('Reverbica') },   // the original uses Tunica (pitch correction), which is not ported
    { 'A Type': 3, 'A Wavetable': 6, 'A Shape': 0.35, 'A Mod': 0, 'B Type': 1, 'B Coarse': 0, 'B Fine': 12, 'B Mod': 0.4, 'B Shape': 0.05, 'B Level': 0.35, 'Env 1 Attack': 1.2, 'Env 1 Release': 2.5, 'R1 Cutoff': 2400, 'R1 Env 2 amount': 0, 'Wire 1 Source': 4, 'Wire 1 Destination': 10, 'Wire 1 Amount': 0.5,
      'LFO 2 Rate': 0.18, 'Lab age (tolerance)': 0.5, 'App 1 Device': D('Delayica'), 'App 2 Device': D('Seancica') },
    { 'A Type': 4, 'A Noise': 1, 'A Colour': 0.9, 'A Level': 1.0, 'B Type': 4, 'B Noise': 18, 'B Colour': 0.8, 'B Shape': 0.4, 'B Level': 0.8, 'Env 1 Decay': 0.25, 'Env 1 Sustain': 0.3, 'Wire 1 Source': 6, 'Wire 1 Destination': 1, 'Wire 1 Amount': 0.5, 'Wire 2 Source': 6, 'Wire 2 Destination': 2, 'Wire 2 Amount': 0.25,
      'Seq rate': 2, 'Seq length': 8, 'Seq 1': 0, 'Seq 2': 0.33, 'Seq 3': 0.58, 'Seq 4': 0.25, 'Seq 5': 0.75, 'Seq 6': 0.5, 'Seq 7': 0.17, 'Seq 8': 0.42, 'App 1 Device': D('Bodica') },
    { 'A Type': 2, 'A Shape': 0.7, 'A Mod': 0.8, 'A Colour': 0.4, 'B Type': 7, 'B Shape': 0.6, 'B Mod': 0.5, 'B Colour': 0.9, 'B Coarse': 7, 'B Cross source': 1, 'B Cross amount': 0.4, 'A Cross source': 2, 'A Cross amount': 0.3, 'A Cross mode': 1,
      'R1 Type': 8, 'Wire 1 Source': 5, 'Wire 1 Destination': 25, 'Wire 1 Amount': 0.6, 'Wire 2 Source': 5, 'Wire 2 Destination': 10, 'Wire 2 Amount': 0.4, 'Wire 3 Source': 5, 'Wire 3 Destination': 5, 'Wire 3 Amount': 0.3, 'Tesla speed': 6, 'App 1 Device': D('Bitsmashica') },
    { 'A Type': 6, 'A Shape': 0.55, 'A Colour': 0.55, 'A Mod': 0.6, 'A Level': 0.8, 'B Type': 5, 'B Body': 3, 'B Level': 0.5, 'B Shape': 0.8, 'B Cross source': 1, 'B Cross mode': 4, 'B Cross amount': 0.45, 'Tuning': 3, 'Tonic': 2, 'Env 1 Attack': 0.002, 'Env 1 Sustain': 0.9, 'Env 1 Release': 1.5, 'R1 Cutoff': 8000,
      'App 1 Device': D('Resonica') },
    { 'A Type': 1, 'A Shape': 0, 'B Type': 1, 'B Fine': 8, 'R1 Cutoff': 280, 'R1 Resonance': 0.55, 'R1 Drive': 0.4, 'R1 Env 2 amount': 0, 'LFO 1 Sync': 4, 'LFO 1 Shape': 0, 'Wire 1 Source': 4, 'Wire 1 Destination': 25, 'Wire 1 Amount': 0.75, 'Wire 2 Source': 15, 'Wire 2 Destination': 25, 'Wire 2 Amount': 0.5, 'Mode': 1, 'A Coarse': -12, 'B Coarse': -12 },
    { 'A Type': 5, 'A Body': 8, 'A Shape': 0.7, 'A Mod': 0.7, 'A Level': 0.8, 'B Type': 5, 'B Body': 7, 'B Coarse': 7, 'B Level': 0.4, 'Tuning': 7, 'Env 1 Release': 3, 'App 1 Device': D('Reelica') },
    { 'A Type': 4, 'A Noise': 0, 'A Colour': 0.6, 'A Level': 0.8, 'R1 Type': 3, 'R1 Cutoff': 400, 'R1 Resonance': 0.8, 'R1 Env 2 amount': 0.7, 'Env 2 Attack': 0.4, 'Env 2 Decay': 0.8, 'Env 1 Sustain': 0.9, 'Wire 1 Source': 3, 'Wire 1 Destination': 25, 'Wire 1 Amount': 0.3, 'LFO 1 Rate': 0.3, 'App 1 Device': D('Noiszical') },
    { 'A Type': 3, 'A Wavetable': 2, 'A Shape': 0.1, 'A Level': 0.75, 'Env 1 Attack': 0.05, 'Env 1 Release': 0.6, 'Wire 1 Source': 13, 'Wire 1 Destination': 9, 'Wire 1 Amount': 1, 'Wire 2 Source': 4, 'Wire 2 Destination': 9, 'Wire 2 Amount': 0.15, 'LFO 2 Rate': 0.4, 'R1 Type': 8, 'R1 Cutoff': 600, 'Voices': 8 },
  ];
  const deviceInfo = FXLIST.map(f => ({ name: f.name, params: f.ps.map(p => p.name) }));
  OCC.engines.modica = {
    name: 'Modica',
    blurb: 'The laboratory: a polyphonic modular synth. Four specimens (analog, FM, wavetable, noise, bell body, string, chaos) that can phase-/ring-/amp-modulate, sync or excite each other, two Reagent filters, three envelopes, two LFOs, a Tesla (Lorenz) chaos source, a 16-step sequencer, four lever macros, twelve patch wires and three Apparatus pedal slots (eight dials per page map onto the pedal\'s parameters in order, 8 per page; see deviceInfo). Mutate rewrites the patch within limits. Web version: there is no host tempo, so the Tempo parameter drives synced LFOs, the per-voice sequencer and tempo-based pedals; 19 of the 44 Boardica pedals are ported (the rest are left out).',
    specs, groups, make: sr => new Modica(sr), E, deviceInfo
  };
})();
/* Physica - electro-mechanical synth: 23 modelled machines in 4 slots, 8 "room made of things" effects in 3 slots. Port of plugins/physica/physica.h */
(function () {
  const TWO_PI = 6.2831853, kSlots = 4, kFx = 3, kPoly = 4, kSrcTypes = 24, kFxTypes = 9;
  const SRC_NAMES = ['- Off -', 'Balloon', 'Motor', 'Siren disc', 'Bowed squeal', 'Bottle', 'Dripping water', 'Slinky', 'Mousetrap', 'Twanged ruler', 'Fan', 'Electric arc', 'Vortex whistle', 'Edge-tone pipe', 'Hurdy-gurdy wheel', 'Card in spokes', 'Washboard', 'Singing bowl', 'Relay buzzer', 'Solenoid chime', 'Vibration motor', 'Hard-drive arm', 'Rubber-band wheel', 'Chime carousel'];
  const FX_NAMES = ['- Off -', 'Spring tube', 'Underwater mic', 'Slinky echo', 'Garden hose', 'Fan tremolo', 'Vacuum pump', 'Paper cups', 'Bucket'];
  const PRESET_NAMES = ['Default', 'Breakfast Machine', 'Submarine', 'Haunted Garage', 'Balloon Orchestra', 'Mad Scientist', 'Plumbing', 'Toy Factory', 'Input Eater'];
  const DRIVE_NAMES = ['None', 'Input', 'Slot 1', 'Slot 2', 'Slot 3', 'Slot 4', 'Chaos'];
  // enum
  const E = { Preset: 0, Volume: 1, Mode: 2, Input: 3, Dry: 4, Chaos: 5, Wear: 6, Gravity: 7, Overload: 8 };
  const SlotBase = 9, SlotParams = 8, FxBase = SlotBase + kSlots * SlotParams, FxParams = 4;
  const SType = 0, SLevel = 1, STune = 2, SA = 3, SB = 4, SDrive = 5, SDriveAmt = 6, SPlay = 7, FType = 0, FA = 1, FB = 2, FMix = 3;
  const slotParam = (s, p) => SlotBase + s * SlotParams + p, fxParam = (f, p) => FxBase + f * FxParams + p;
  E.Count = FxBase + kFx * FxParams; E.slot = slotParam; E.fx = fxParam;
  const specs = [
    P('Preset', '', 0, PRESET_NAMES.length - 1, 0, '%.0f', false, PRESET_NAMES),
    P('Volume', 'dB', -24, 12, 0, '%.1f dB'),
    P('Mode', '', 0, 2, 2, '%.0f', false, ['Synth (notes)', 'Effect (input)', 'Both']),
    P('Input', '', 0, 1, 1, '%.2f'), P('Dry', '', 0, 1, 0, '%.2f'), P('Chaos', '', 0, 1, 0, '%.2f'), P('Wear', '', 0, 1, 0, '%.2f'), P('Gravity', 'g', 0.2, 3, 1, '%.2f g'), P('Overload', '', 0, 1, 0, '%.2f'),
  ];
  for (let s = 0; s < kSlots; ++s) {
    const n = 'Slot ' + (s + 1) + ' ';
    specs.push(P(n + 'Type', '', 0, kSrcTypes - 1, s === 0 ? 2 : s === 1 ? 6 : s === 2 ? 5 : 9, '%.0f', false, SRC_NAMES), P(n + 'Level', '', 0, 1, 0.7, '%.2f'), P(n + 'Tune', 'st', -36, 36, 0, '%.1f st'),
      P(n + 'Amount', '', 0, 1, 0.5, '%.2f'), P(n + 'Character', '', 0, 1, 0.5, '%.2f'), P(n + 'Driven by', '', 0, 6, 0, '%.0f', false, DRIVE_NAMES), P(n + 'Drive amount', '', -1, 1, 0, '%.2f'), P(n + 'Plays', '', 0, 1, 0, '%.0f', false, ['Played', 'Drone']));
  }
  for (let f = 0; f < kFx; ++f) {
    const n = 'Fx ' + (f + 1) + ' ';
    specs.push(P(n + 'Type', '', 0, kFxTypes - 1, f === 0 ? 1 : f === 1 ? 8 : 0, '%.0f', false, FX_NAMES), P(n + 'A', '', 0, 1, 0.5, '%.2f'), P(n + 'B', '', 0, 1, 0.5, '%.2f'), P(n + 'Mix', '', 0, 1, f === 0 ? 0.35 : 0.25, '%.2f'));
  }
  const groups = [['Machines 1-2', [slotParam(0, 0), slotParam(0, 1), slotParam(0, 3), slotParam(0, 4), slotParam(0, 2), slotParam(0, 7), slotParam(0, 5), slotParam(0, 6), slotParam(1, 0), slotParam(1, 1), slotParam(1, 3), slotParam(1, 4), slotParam(1, 2), slotParam(1, 7), slotParam(1, 5), slotParam(1, 6)]],
    ['Machines 3-4', [slotParam(2, 0), slotParam(2, 1), slotParam(2, 3), slotParam(2, 4), slotParam(2, 2), slotParam(2, 7), slotParam(2, 5), slotParam(2, 6), slotParam(3, 0), slotParam(3, 1), slotParam(3, 3), slotParam(3, 4), slotParam(3, 2), slotParam(3, 7), slotParam(3, 5), slotParam(3, 6)]],
    ['Rooms made of things', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => FxBase + i)],
    ['Master and wild controls', [E.Volume, E.Mode, E.Input, E.Dry, E.Chaos, E.Wear, E.Gravity, E.Overload]]];

  /* ---- small DSP helpers */
  class Rng { constructor(s) { this.s = (s >>> 0) || 0x1234567; } uni() { let s = this.s; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; this.s = s; return (s >>> 8) * (1 / 16777216); } bi() { return this.uni() * 2 - 1; } }
  class Bq { // RBJ biquad (low-pass, high-pass, band-pass)
    constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; }
    set(t, f, q, sr) { // t: 3 low-pass, 4 high-pass, 5 band-pass
      f = clampf(f, 5, sr * 0.49); q = Math.max(0.05, q); const w = 2 * Math.PI * f / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * q); let B0, B1, B2;
      if (t === 3) { B0 = (1 - cw) / 2; B1 = 1 - cw; B2 = B0; } else if (t === 4) { B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = B0; } else { B0 = al; B1 = 0; B2 = -al; }
      const A0 = 1 + al; this.b0 = B0 / A0; this.b1 = B1 / A0; this.b2 = B2 / A0; this.a1 = -2 * cw / A0; this.a2 = (1 - al) / A0;
    }
    run(x) { const y = this.b0 * x + this.z1; this.z1 = this.b1 * x - this.a1 * y + this.z2; this.z2 = this.b2 * x - this.a2 * y; return y; }
    reset() { this.z1 = this.z2 = 0; }
  }
  const wrap1 = x => x - Math.floor(x);
  const rdBuf = (buf, mask, wi, d) => { d = clampf(d, 1, mask - 2); const i = d | 0, fr = d - i, a = buf[(wi - i) & mask], b = buf[(wi - i - 1) & mask]; return a + (b - a) * fr; };
  let oBp = 0, oLp = 0, oHp = 0; // outputs of svf()
  function svf(st, o, x, fc, q, sr) {
    const g = 2 * Math.sin(Math.PI * Math.min(fc, sr * 0.1) / sr), qi = 1 / Math.max(0.6, q);
    const hp = x - st[o] - qi * st[o + 1]; st[o + 1] += g * hp; st[o] += g * st[o + 1]; oBp = st[o + 1]; oLp = st[o]; oHp = hp;
  }
  function resSet(cf, o, freq, t60, sr) { const w = TWO_PI * Math.min(freq, sr * 0.45) / sr, R = Math.exp(-6.9078 / Math.max(1, t60 * sr)); cf[o] = 2 * R * Math.cos(w); cf[o + 1] = R * R; cf[o + 2] = Math.sin(w); }
  function resRun(st, so, cf, co, x) { const y = cf[co] * st[so] - cf[co + 1] * st[so + 1] + x; st[so + 1] = st[so]; st[so] = y; return y; }
  function resKick(st, so, cf, co, a) { st[so] += a * cf[co + 2]; }

  class V {
    constructor(seed) { this.rng = new Rng(seed); this.buf = new Float64Array(4096); this.ap = new Float64Array(24); this.s = new Float64Array(6); this.sv = new Float64Array(4); this.r1 = new Float64Array(2); this.r2 = new Float64Array(2); this.bub = []; for (let i = 0; i < 6; ++i) this.bub.push({ on: false, ph: 0, f: 0, k: 0, env: 0, dec: 0 }); this.clear(); }
    clear() {
      this.on = false; this.gate = false; this.drone = false; this.note = -1; this.age = 0; this.f0 = 220; this.vel = 1;
      this.env = this.ph = this.ph2 = this.w = this.p = this.y = this.vv = this.lp = this.lp2 = 0; this.ctr = this.k = this.quiet = this.wi = 0; this.t = this.gap = this.amp = 0;
      this.buf.fill(0); this.ap.fill(0); this.s.fill(0); this.sv.fill(0); this.r1.fill(0); this.r2.fill(0); for (const b of this.bub) b.on = false;
    }
  }
  const mkPar = () => ({ f: 220, e: 0.5, b: 0.5, g: 1, wear: 0, sr: 48000, dt: 1 / 48000, vel: 1, pm: 1, drone: false });

  function trigger(v, type, p) {
    v.age = 0; v.quiet = 0;
    switch (type) {
      case 1: v.p = Math.min(1.3, 0.55 + 0.6 * v.vel * (0.6 + p.e)); break;
      case 7: v.ctr = 14; v.amp = 0.4 + 0.6 * v.vel; break;
      case 8: { v.k = 0; v.t = 0; const q = 1 - clampf(p.e, 0, 1); v.gap = 0.035 + 0.16 * q * q + 0.02; v.amp = 0.5 + 0.5 * v.vel; v.ctr = 1; break; }
      case 9: v.amp = 0.35 + 0.65 * v.vel; v.s[0] = 1; break;
      case 19: case 22: case 23: v.t = 1e9; break;
    }
  }
  const THR13 = [0.3, 0.6, 0.9], RAT13 = [1, 1.5, 2, 3], RAT17 = [1, 2.71, 5.15, 8.4, 1], GAIN17 = [1, 0.55, 0.3, 0.15, 0.7], RAT19 = [1, 2.76, 5.4], GN19 = [1, 0.6, 0.3], RAT22 = [1, 1.125, 1.25, 1.5, 1.667], RAT23 = [1, 1.125, 1.25, 1.5, 1.667, 2];
  function tick(v, type, P) {
    const dt = P.dt, sr = P.sr, f = clampf(v.f0 * P.pm, 8, sr * 0.4), e = clampf(P.e, 0, 1.5), b = clampf(P.b, 0, 1), n = v.rng.bi(); let out = 0; ++v.age;
    const vel = 0.5 + 0.5 * v.vel, sv = v.sv;
    switch (type) {
      case 1: { // balloon
        const tau = v.gate ? (0.25 + (2.4 - 0.25) * (1 - clampf(e, 0, 1))) / Math.max(0.2, P.g) : 0.07;
        v.p -= v.p * dt / tau; if (v.p < 1e-4) v.p = 0;
        if (v.drone && v.p < 0.03) { v.ctr = (sr * 0.35) | 0; trigger(v, 1, P); }
        const fs = f * (0.55 + 0.9 * v.p) * (1 + 0.45 * b) * (1 + 0.02 * v.lp2); v.lp2 += (n - v.lp2) * 0.004; v.ph = wrap1(v.ph + fs * dt);
        const tone = Math.tanh(3 * Math.sin(TWO_PI * v.ph)) + 0.35 * Math.sin(12.566371 * v.ph + 1);
        svf(sv, 0, n, 2.2 * fs, 2.5, sr); const nzmix = 0.15 + 0.6 * (1 - b);
        out = v.p * Math.sqrt(v.p) * ((1 - nzmix) * tone * 0.4 + nzmix * oBp * 1.6) * vel; break; }
      case 2: { // motor
        const tgt = v.gate ? f : 0, tau = 0.03 + b * b * 1.6; v.w += (tgt - v.w) * Math.min(1, dt / tau * (v.gate ? 1 : 0.5)); if (v.w < 0.5 && !v.gate) v.w = 0;
        v.ph = wrap1(v.ph + v.w * dt); v.ph2 = wrap1(v.ph2 + v.w * dt / 7); const a = TWO_PI * v.ph;
        const s = Math.sin(a) + 0.5 * Math.sin(2 * a + 0.6) + 0.3 * Math.sin(3 * a + 1.1) + 0.18 * Math.sin(5 * a);
        v.lp += (n - v.lp) * 0.5; const brush = n - v.lp, sp = clampf(v.w / f, 0, 1);
        out = Math.pow(sp, 0.7) * (0.25 + 0.75 * clampf(e, 0, 1)) * (s * 0.38 + brush * 0.12 * sp) * (0.7 + 0.3 * Math.sin(TWO_PI * v.ph2)) * vel; v.p = sp; break; }
      case 3: { // siren disc
        const tgt = v.gate ? f : 0, tau = 0.05 + b * 2.2; v.w += (tgt - v.w) * Math.min(1, dt / tau); if (v.w < 0.01 * f && !v.gate) v.w = 0;
        v.ph = wrap1(v.ph + v.w * dt); const pulse = v.ph < 0.3 ? 1 : 0, fc = Math.max(150, 5 * v.w);
        v.lp += (pulse - v.lp) * Math.min(1, TWO_PI * fc * dt); v.lp2 += (n - v.lp2) * 0.15; const sp = clampf(v.w / f, 0, 1);
        out = sp * (0.2 + 0.8 * clampf(e, 0, 1)) * ((v.lp - 0.3) * 0.9 + (n - v.lp2) * 0.07) * vel; v.p = sp; break; }
      case 4: { // bowed squeal
        const fr = Math.min(f * 1.34, sr * 0.06), w = TWO_PI * fr;
        v.env += ((v.gate ? 1 : 0) - v.env) * Math.min(1, dt / (v.gate ? 0.02 : 0.09));
        const vb = (0.08 + 0.92 * clampf(e, 0, 1.2)) * v.env * 0.55, N = 0.35 + 1.9 * b, vrel = v.vv - vb, mu = 0.35 + 0.65 * Math.exp(-Math.abs(vrel) * 3), F = -N * mu * Math.tanh(vrel * 25);
        const acc = -w * w * v.y - 2 * 0.0015 * w * v.vv + F * w * 0.8; v.vv += acc * dt; v.vv = clampf(v.vv, -3, 3); v.y += v.vv * dt; v.y = clampf(v.y, -1, 1);
        v.lp += (n - v.lp) * 0.3; out = (v.vv * 0.55 + 0.02 * (n - v.lp) * v.env) * Math.min(1, v.env * 3) * vel; v.p = v.env; break; }
      case 5: { // bottle
        v.env += ((v.gate ? 1 : 0) - v.env) * Math.min(1, dt / (v.gate ? 0.06 : 0.12));
        const breath = (0.2 + 0.8 * clampf(e, 0, 1.2)) * v.env; v.lp2 += (n - v.lp2) * 0.02;
        const vib = 1 + 0.004 * Math.sin(TWO_PI * 5 * v.age * dt) + 0.01 * v.lp2 * 8;
        svf(sv, 0, n * (0.4 + 0.6 * b), f * vib, 25 + 160 * (1 - b), sr); const bp = oBp;
        svf(sv, 2, n, f * 2 * vib, 40, sr); const bq = oBp;
        v.ph = wrap1(v.ph + f * vib * dt);
        out = breath * (bp * 0.55 * (0.5 + b) + bq * 0.08 + (1 - b) * 0.2 * Math.sin(TWO_PI * v.ph) * (0.6 + 0.4 * v.rng.uni()) + (n - v.lp2) * 0.03 * (0.3 + b)) * vel; v.p = v.env; break; }
      case 6: { // dripping water
        const rate = (0.8 + clampf(e, 0, 1.2) * 12) * Math.sqrt(P.g);
        if (v.gate && v.rng.uni() < rate * dt) {
          for (const bb of v.bub) if (!bb.on) { bb.on = true; bb.ph = 0; bb.f = Math.min(sr * 0.3, f * (0.55 + 0.95 * v.rng.uni())); bb.k = 6 + 22 * v.rng.uni(); bb.env = (0.25 + 0.75 * v.rng.uni()) * vel; bb.dec = Math.exp(-dt / (0.006 + 0.06 * (1 - b) * (0.4 + v.rng.uni()))); break; }
        }
        for (const bb of v.bub) if (bb.on) { bb.ph = wrap1(bb.ph + bb.f * dt); bb.f *= 1 + bb.k * dt; if (bb.f > sr * 0.35) bb.f = sr * 0.35; out += bb.env * Math.sin(TWO_PI * bb.ph) * 0.35; bb.env *= bb.dec; if (bb.env < 1e-4) bb.on = false; }
        v.p = 1; break; }
      case 7: { // slinky
        const N = 22, a = clampf(0.25 + 0.6 * b + 0.04 * (P.g - 1), 0.1, 0.85), Ld = clampf(sr / f - 2 - N * (1 - a) / (1 + a), 6, 4000);
        const tau = v.gate ? 0.35 + clampf(e, 0, 1.2) * 3 : 0.12, g = Math.pow(0.001, 1 / Math.max(1, tau * f)); let x = rdBuf(v.buf, 4095, v.wi, Ld);
        const ap = v.ap; for (let i = 0; i < N; ++i) { const y = a * x + ap[i]; ap[i] = x - a * y; x = y; }
        x *= g; v.lp += (x - v.lp) * 0.65; let exc = 0; if (v.ctr > 0) { --v.ctr; exc = n * v.amp; }
        v.buf[v.wi & 4095] = clampf(v.lp + exc, -4, 4); ++v.wi; out = v.lp * 0.5; v.p = Math.abs(v.lp);
        if (v.drone && v.age > ((sr * (0.5 + 2 / (0.4 + e))) | 0)) trigger(v, 7, P);
        break; }
      case 8: { // mousetrap
        if (v.ctr === 1) {
          v.t += dt; const nclicks = 6 + ((e * 12) | 0);
          if (v.t >= v.gap) {
            v.t = 0; v.gap *= 0.8;
            if (v.k < nclicks) { v.s[0] = (0.25 + 0.5 * v.rng.uni()) * v.amp * (0.4 + 1 * v.k / nclicks); v.s[1] = f * (0.7 + 1.4 * v.rng.uni()); v.k++; }
            else { v.ctr = 2; v.s[0] = 1.2 * v.amp; const w1 = TWO_PI * f / sr, w2 = TWO_PI * f * 2.4 / sr, R = Math.exp(-1 / (0.15 * sr));
              v.r1[0] = (0.5 + 1.5 * b) * v.amp * Math.sin(w1); v.r2[0] = (0.3 + 1 * b) * v.amp * Math.sin(w2); v.r1[1] = v.r2[1] = 0; v.s[2] = 2 * R * Math.cos(w1); v.s[3] = 2 * R * Math.cos(w2); v.s[4] = R * R; }
          }
        }
        const cl = v.s[0] * n; v.s[0] *= Math.exp(-dt / 0.0015); const fc = clampf(v.s[1], 300, 9000); svf(sv, 0, cl, fc, 1.2, sr); out = oBp * 1.5;
        if (v.ctr === 2) {
          const y1 = v.s[2] * v.r1[0] - v.s[4] * v.r1[1]; v.r1[1] = v.r1[0]; v.r1[0] = y1; const y2 = v.s[3] * v.r2[0] - v.s[4] * v.r2[1]; v.r2[1] = v.r2[0]; v.r2[0] = y2;
          out += (y1 + y2) * 0.35; if (Math.abs(y1) < 1e-4 && v.s[0] < 1e-4) v.ctr = 3;
        }
        out *= 0.8; v.p = v.ctr < 3 ? 1 : 0;
        if (v.drone && v.ctr === 3) { v.ctr = 4; v.t = 0; }
        if (v.drone && v.ctr === 4) { v.t += dt; if (v.t > 0.4 + 1.6 * (1 - clampf(e, 0, 1))) trigger(v, 8, P); }
        break; }
      case 9: { // twanged ruler
        const tau = v.gate ? 0.08 + 1.3 * clampf(e, 0, 1.2) : 0.05; v.s[0] *= Math.exp(-dt / tau); v.s[1] *= Math.exp(-dt / 0.03); const a = v.s[0] * v.amp;
        v.ph = wrap1(v.ph + f * (1 + 0.12 * P.g * a * a) * dt); v.ph2 = wrap1(v.ph2 + f * 6.27 * dt);
        let y = a * Math.sin(TWO_PI * v.ph) + 0.22 * a * v.s[1] * Math.sin(TWO_PI * v.ph2); const thr = 0.95 - 0.78 * b;
        if (Math.abs(y) > thr) { const sgn = y > 0 ? 1 : -1, over = Math.abs(y) - thr; y = sgn * (thr + 0.25 * over); y += 0.9 * over * n; }
        out = y * 0.7 * vel; v.p = a; if (v.drone && v.s[0] < 0.02) { trigger(v, 9, P); v.s[1] = 1; }
        break; }
      case 10: { // fan
        const tgt = v.gate ? f / 8 : 0, tau = 0.05 + b * 1.6; v.w += (tgt - v.w) * Math.min(1, dt / tau); if (v.w < 0.05 && !v.gate) v.w = 0;
        v.ph = wrap1(v.ph + v.w * dt); const sp = clampf(v.w / Math.max(1, f / 8), 0, 1), pulse = Math.pow(0.5 + 0.5 * Math.cos(TWO_PI * v.ph), 1.5 + 2 * clampf(e, 0, 1));
        svf(sv, 0, n, 250 + 1800 * clampf(e, 0, 1) * sp, 0.9, sr); out = sp * ((0.25 + 0.75 * pulse) * oBp * 0.9 + pulse * Math.sin(TWO_PI * v.ph * 2) * 0.2) * vel; v.p = sp; break; }
      case 11: { // electric arc
        v.env += ((v.gate ? 1 : 0) - v.env) * Math.min(1, dt / (v.gate ? 0.004 : 0.04)); v.ph = wrap1(v.ph + f * dt);
        const saw = 2 * v.ph - 1; v.lp += (saw - v.lp) * 0.2; const hum = Math.abs(Math.sin(Math.PI * v.ph)) * 2 - 1, rate = 12 + clampf(e, 0, 1.2) * 500;
        if (v.rng.uni() < rate * dt) v.s[0] = 0.25 + 0.75 * v.rng.uni(); v.s[0] *= Math.exp(-dt / (0.0006 + 0.0025 * v.rng.uni()));
        v.lp2 += (n - v.lp2) * 0.35; const hn = n - v.lp2;
        out = v.env * ((1 - b) * (v.lp * 0.12 + hum * 0.1) * (0.4 + 0.6 * clampf(e, 0, 1)) + (0.25 + b) * v.s[0] * hn * 0.8) * vel; v.p = v.env; break; }
      case 12: { // vortex whistle
        v.env += ((v.gate ? 1 : 0) - v.env) * Math.min(1, dt / (v.gate ? 0.05 : 0.1)); v.lp2 += (n - v.lp2) * 0.002;
        const ft = Math.min(sr * 0.4, f * 2 * (0.85 + 0.3 * clampf(e, 0, 1.2)) * (1 + 0.012 * Math.sin(TWO_PI * 4.5 * v.age * dt) + 0.8 * v.lp2));
        v.ph = wrap1(v.ph + ft * dt); const tone = Math.sin(TWO_PI * v.ph) + 0.12 * Math.sin(12.566371 * v.ph); svf(sv, 0, n, ft, 30, sr);
        out = v.env * (0.25 + 0.75 * clampf(e, 0, 1)) * ((0.35 + 0.65 * b) * tone * 0.5 + (1 - b) * oBp * 0.9) * vel; v.p = v.env; break; }
      case 13: { // edge tone
        v.env += ((v.gate ? 1 : 0) - v.env) * Math.min(1, dt / (v.gate ? 0.03 : 0.08)); const jet = clampf(e, 0, 1.2);
        if (v.k < 3 && jet > THR13[v.k] + 0.04) { ++v.k; v.s[0] = 0.5; } else if (v.k > 0 && jet < THR13[v.k - 1] - 0.04) { --v.k; v.s[0] = 0.5; }
        if (v.y === 0) v.y = f * RAT13[v.k]; v.y += (f * RAT13[v.k] - v.y) * Math.min(1, dt / 0.004); v.s[0] *= Math.exp(-dt / 0.01);
        v.ph = wrap1(v.ph + v.y * dt); const a = TWO_PI * v.ph, tone = Math.sin(a) + (0.1 + 0.5 * b) * Math.sin(2 * a) + 0.3 * b * Math.sin(3 * a);
        svf(sv, 0, n, v.y, 6, sr); out = v.env * (0.3 + 0.7 * jet) * (tone * 0.4 + oBp * 0.3 + v.s[0] * n * 0.5) * vel; v.p = v.env; break; }
      case 14: { // hurdy-gurdy
        const fr = Math.min(f * 1.34, sr * 0.06), w = TWO_PI * fr; v.env += ((v.gate ? 1 : 0) - v.env) * Math.min(1, dt / (v.gate ? 0.25 : 0.15));
        const vb = (0.12 + 0.5 * clampf(e, 0, 1)) * v.env * (1 + 0.03 * Math.sin(TWO_PI * 3 * v.age * dt)), vrel = v.vv - vb, mu = 0.35 + 0.65 * Math.exp(-Math.abs(vrel) * 3), F = -0.9 * mu * Math.tanh(vrel * 25);
        const acc = -w * w * v.y - 2 * 0.003 * w * v.vv + F * w * 0.8; v.vv += acc * dt; v.vv = clampf(v.vv, -3, 3); v.y += v.vv * dt; v.y = clampf(v.y, -1, 1);
        const thr = 0.25 * (1.1 - b); let buzz = 0; if (Math.abs(v.vv) > thr) buzz = (v.vv > 0 ? 1 : -1) * (Math.abs(v.vv) - thr) * (0.5 + 0.5 * v.rng.uni()) * b * 3;
        v.lp += (n - v.lp) * 0.2; out = (v.vv * 0.55 + buzz + 0.03 * (n - v.lp) * v.env) * Math.min(1, v.env * 3) * vel; v.p = v.env; break; }
      case 15: { // card in the spokes
        const tgt = v.gate ? f : 0; v.w += (tgt - v.w) * Math.min(1, dt / (0.02 + b * 0.8)); if (v.w < 0.5 && !v.gate) v.w = 0;
        v.ph += v.w * dt; if (v.ph >= 1) { v.ph -= 1; v.s[0] = (0.5 + 0.5 * v.rng.uni()) * (0.4 + 0.6 * clampf(e, 0, 1)); }
        v.s[0] *= Math.exp(-dt / 0.0004); const sp = clampf(v.w / f, 0, 1); svf(sv, 0, v.s[0] * n, 1800 + 2200 * (1 - b), 3, sr);
        out = sp * (oBp * 1.2 + v.s[0] * n * 0.3) * vel; v.p = sp; break; }
      case 16: { // washboard
        const tgt = v.gate ? f : 0; v.w += (tgt - v.w) * Math.min(1, dt / 0.05); if (v.w < 0.5 && !v.gate) v.w = 0;
        v.lp2 += (n - v.lp2) * 0.01; v.ph += v.w * dt * (1 + 0.35 * b * v.lp2 * 6);
        if (v.ph >= 1) { v.ph -= 1; v.s[0] = (0.3 + 0.7 * v.rng.uni()) * (0.3 + 0.7 * clampf(e, 0, 1)); }
        v.s[0] *= Math.exp(-dt / 0.0012); const sp = clampf(v.w / f, 0, 1), x = v.s[0] * n + 0.03 * b * clampf(e, 0, 1) * n * sp;
        svf(sv, 0, x, 1100, 5, sr); const b1 = oBp; svf(sv, 2, x, 2300, 8, sr); const b2 = oBp;
        out = sp * (b1 * 0.8 + b2 * 0.5 + v.s[0] * n * 0.3) * vel; v.p = sp; break; }
      case 17: { // singing bowl
        const B = v.buf;
        if ((v.age & 63) === 1) for (let k = 0; k < 5; ++k) resSet(B, 64 + 3 * k, f * RAT17[k] + (k === 4 ? 0.35 + 0.6 * b : 0), 5, sr);
        v.env += ((v.gate ? 1 : 0) - v.env) * Math.min(1, dt / (v.gate ? 0.7 : 0.4)); v.lp2 += (n - v.lp2) * 0.3;
        const rub = v.lp2 * v.env * (0.05 + clampf(e, 0, 1.2)) * (0.7 + 0.3 * Math.sin(TWO_PI * 0.7 * v.age * dt)) * 0.0006; let acc = 0;
        for (let k = 0; k < 5; ++k) acc += resRun(B, 2 * k, B, 64 + 3 * k, rub * (k >= 1 && k < 4 ? 0.4 + 1.2 * b : 1)) * GAIN17[k];
        out = acc * 0.25 * vel; v.p = v.env; break; }
      case 18: { // relay buzzer
        const volt = clampf(e, 0, 1.2); v.lp2 += (n - v.lp2) * 0.01; const rate = f * (0.55 + 0.45 * Math.min(volt, 1)) * (1 + 0.03 * v.lp2 * 6);
        v.env += ((v.gate ? 1 : 0) - v.env) * Math.min(1, dt / (v.gate ? 0.003 : 0.02)); v.ph = wrap1(v.ph + rate * dt); const closed = v.ph < 0.5 ? 1 : 0;
        if (closed !== v.k) { v.k = closed; if (closed) { v.s[0] = 1; if (v.rng.uni() < b * 0.5) v.s[2] = 0.5; } else { v.s[0] = -0.8; v.s[1] = 0.6; } }
        v.s[2] *= Math.exp(-dt / 0.0002); const imp = v.s[0] + v.s[2] * n; v.s[0] *= Math.exp(-dt / 0.0006); v.s[1] *= Math.exp(-dt / 0.0003);
        svf(sv, 0, imp, 600 + 900 * volt, 6, sr); out = v.env * (0.4 + 0.6 * Math.min(volt, 1)) * (oBp * 1.5 + v.s[0] * 0.3 + v.s[1] * n * 0.4) * vel; v.p = v.env; break; }
      case 19: { // solenoid chime
        const B = v.buf; v.t += dt; const rr = 2 + 16 * clampf(e, 0, 1.2);
        if (v.gate && v.t >= 1 / rr) { v.t = 0; const t60 = 0.3 + 2.7 * b; for (let k = 0; k < 3; ++k) { resSet(B, 64 + 3 * k, f * RAT19[k], t60 / (1 + 0.6 * k), sr); resKick(B, 2 * k, B, 64 + 3 * k, GN19[k] * v.vel * (0.7 + 0.3 * v.rng.uni())); } v.s[0] = 0.5; }
        let acc = 0; for (let k = 0; k < 3; ++k) acc += resRun(B, 2 * k, B, 64 + 3 * k, 0);
        out = (acc * 0.6 + v.s[0] * n * 0.25) * vel; v.s[0] *= Math.exp(-dt / 0.0008); v.p = 1; break; }
      case 20: { // vibration motor on a hollow box
        const tgt = v.gate ? f : 0; v.w += (tgt - v.w) * Math.min(1, dt / 0.12); if (v.w < 0.5 && !v.gate) v.w = 0;
        const old = v.ph; v.ph = wrap1(v.ph + v.w * dt); if (v.ph < old) v.s[0] = 1; v.s[0] *= Math.exp(-dt / 0.004);
        const sp = clampf(v.w / f, 0, 1), x = v.s[0] + 0.3 * Math.sin(TWO_PI * v.ph); svf(sv, 0, x, 100 + 400 * Math.pow(0.3, b * 1.5), 6, sr);
        out = sp * (oBp * 1.1 + 0.1 * Math.sin(TWO_PI * 5 * v.ph) * (0.5 + clampf(e, 0, 1)) + 0.2 * Math.sin(TWO_PI * v.ph)) * (0.3 + 0.7 * clampf(e, 0, 1)) * vel; v.p = sp; break; }
      case 21: { // hard-drive arm
        v.env += ((v.gate ? 1 : 0) - v.env) * Math.min(1, dt / (v.gate ? 0.004 : 0.03));
        const w0 = TWO_PI * (40 + 210 * b), k0 = w0 * w0, c = 2 * 0.3 * w0; v.ph = wrap1(v.ph + f * dt);
        const F = (v.ph < 0.5 ? 1 : -1) * (1.2 + 6 * clampf(e, 0, 1.2)) * v.env, a = -k0 * v.y - c * v.vv + F * k0; v.vv += a * dt; v.y += v.vv * dt;
        if (Math.abs(v.y) > 1) { const sg = v.y > 0 ? 1 : -1; v.y = sg; v.s[0] = Math.min(1, 0.5 * Math.abs(v.vv) / w0); v.vv = -0.35 * v.vv; }
        v.s[0] *= Math.exp(-dt / 0.0008); svf(sv, 0, v.s[0] * n, 1700, 5, sr); out = (0.45 * v.y + 0.5 * v.vv / w0 + oBp * 0.9) * vel; v.p = v.env; break; }
      case 22: { // rubber-band wheel
        const B = v.buf; v.t += dt; const rr = (3 + 16 * clampf(e, 0, 1.2)) * (0.8 + 0.4 * v.rng.uni());
        if (v.gate && v.t >= 1 / rr) { v.t = 0; const bnd = Math.min(4, (v.rng.uni() * 5) | 0); resSet(B, 64 + 3 * bnd, f * RAT22[bnd], 0.12 + 1.1 * b, sr); resKick(B, 2 * bnd, B, 64 + 3 * bnd, (0.5 + 0.5 * v.rng.uni()) * v.vel); v.s[0] = 0.4; }
        let acc = 0; for (let k = 0; k < 5; ++k) acc += resRun(B, 2 * k, B, 64 + 3 * k, 0);
        out = (acc * 0.5 + v.s[0] * n * 0.15) * vel; v.s[0] *= Math.exp(-dt / 0.0006); v.p = 1; break; }
      case 23: { // chime carousel
        const B = v.buf; v.t += dt; const rr = 0.8 + 9 * clampf(e, 0, 1.2);
        if (v.gate && v.t >= 1 / rr) { v.t = 0; const pp = v.k % 6; v.k++; const t60 = 1 + 3 * b;
          resSet(B, 64 + 6 * pp, f * RAT23[pp], t60, sr); resSet(B, 64 + 6 * pp + 3, f * RAT23[pp] * 2.76, t60 * 0.4, sr);
          resKick(B, 4 * pp, B, 64 + 6 * pp, v.vel); resKick(B, 4 * pp + 2, B, 64 + 6 * pp + 3, 0.5 * v.vel); v.s[0] = 0.4; }
        let acc = 0; for (let k = 0; k < 12; ++k) acc += resRun(B, 2 * k, B, 64 + 3 * k, 0);
        out = (acc * 0.4 + v.s[0] * n * 0.15) * vel; v.s[0] *= Math.exp(-dt / 0.0008); v.p = 1; break; }
    }
    if (P.wear > 0) out += P.wear * 0.002 * v.rng.bi() * (v.p > 0 ? 1 : 0);
    if (!isFinite(out)) { out = 0; v.y = v.vv = 0; v.p = 0; v.buf.fill(0); v.ap.fill(0); v.lp = v.lp2 = 0; v.sv.fill(0); }
    return out < -8 ? -8 : (out > 8 ? 8 : out);
  }

  const normCache = {};
  function calibrate(sr) {
    if (normCache[sr]) return normCache[sr];
    const norm = new Float64Array(kSrcTypes).fill(1);
    for (let t = 1; t < kSrcTypes; ++t) {
      const v = new V(0xC0FFEE + t); v.on = true; v.gate = true; v.vel = 1; v.f0 = 220;
      const p = mkPar(); p.sr = sr; p.dt = 1 / sr; p.e = 0.5; p.b = 0.5; trigger(v, t, p);
      const N = (0.8 * sr) | 0, h = (0.5 * sr) | 0; let sum = 0, pk = 0, cnt = 0;
      for (let i = 0; i < N; ++i) { if (i === h) v.gate = false; const y = tick(v, t, p); if (i < h) { sum += y * y; ++cnt; pk = Math.max(pk, Math.abs(y)); } }
      const rms = Math.sqrt(sum / Math.max(1, cnt)); norm[t] = clampf(Math.min(0.1 / Math.max(1e-4, rms), 0.45 / Math.max(1e-4, pk)), 0.05, 40);
    }
    return normCache[sr] = norm;
  }

  /* effect slot state */
  class Fx {
    constructor(sr) {
      const n = (3.3 * sr) | 0; this.dl = [new DelayLine(n), new DelayLine(n)]; this.ap = new Float64Array(80); this.lp = new Float64Array(28); this.lp2 = new Float64Array(4); this.svl = new Float64Array(4);
      this.tapLp = new Float64Array(24); this.apc = new Float64Array(24); this.hp = [new Bq(), new Bq()]; this.lpb = [new Bq(), new Bq()]; this.bq = [[new Bq(), new Bq(), new Bq(), new Bq()], [new Bq(), new Bq(), new Bq(), new Bq()]];
      this.ph = 0; this.w = 0; this.env = 0; this.sup = 0; this.pop = 0; this.popEnv = 0; this.bubEnv = 0; this.bubF = 0; this.bubPh = 0; this.nz = 0; this.nz2 = 0; this.wob = 0; this.a = 0.5; this.b = 0.5;
      this.lastType = -1; this.lastA = -1; this.lastB = -1; this.rng = new Rng(0xABCDEF1); this.vv = [0, 0];
    }
    wipe() { this.ap.fill(0); this.lp.fill(0); this.lp2.fill(0); this.svl.fill(0); this.tapLp.fill(0); this.apc.fill(0); this.dl[0].clear(); this.dl[1].clear(); this.sup = this.pop = this.popEnv = this.env = 0; for (let c = 0; c < 2; ++c) { this.hp[c].reset(); this.lpb[c].reset(); for (const q of this.bq[c]) q.reset(); } }
  }

  class Physica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); this.norm = calibrate(sr); this.rng = new Rng(0x1234567);
      this.vo = []; for (let s = 0; s < kSlots; ++s) { const a = []; for (let k = 0; k < kPoly; ++k) a.push(new V(0x1234567 + (s * 97 + k * 31 + 1) * 40503)); this.vo.push(a); }
      this.fx = []; for (let f = 0; f < kFx; ++f) this.fx.push(new Fx(sr));
      this.env = new Float64Array(kSlots); this.fxLev = new Float64Array(kFx); this.chaosT = new Float64Array(kSlots); this.chaosS = new Float64Array(kSlots); this.chaosB = new Float64Array(kSlots); this.wearJ = new Float64Array(kSlots);
      this.par = mkPar(); this.par.sr = sr; this.par.dt = 1 / sr; this.bend = 0; this.mod = 0;
      this.inEnv = 0; this.outLevel = 0; this.heat = 0; this.chaosN = 0; this.chaosTarget = 0; this.chaosCtr = 0; this.blow = 0; this.blowGain = 1; this.pw = 0;
      this.reset();
    }
    reset() {
      const V_ = this.v, sr = this.sr;
      for (let s = 0; s < kSlots; ++s) for (let k = 0; k < kPoly; ++k) { const v = this.vo[s][k]; v.clear(); v.rng.s = (0x1234567 + (s * 97 + k * 31 + 1) * 40503) >>> 0; }
      for (let f = 0; f < kFx; ++f) { const x = this.fx[f]; x.wipe(); x.w = x.wob = x.bubEnv = 0; x.lastType = -1; x.rng.s = (0xABCDEF1 + f * 7919) >>> 0; x.a = V_[fxParam(f, FA)]; x.b = V_[fxParam(f, FB)]; }
      this.env.fill(0); this.fxLev.fill(0); this.inEnv = this.outLevel = this.heat = 0; this.blow = 0; this.blowGain = 1; this.pw = 0;
      for (let s = 0; s < kSlots; ++s) { this.chaosT[s] = this.chaosS[s] = this.chaosB[s] = this.wearJ[s] = 0; if (V_[slotParam(s, SPlay)] > 0.5) { const v = this.vo[s][0]; v.on = true; v.gate = true; v.drone = true; v.f0 = 110; v.vel = 0.9; v.age = 0; } }
    }
    startDrone(s) {
      const vv = this.vo[s][0], V_ = this.v; vv.on = true; vv.gate = true; vv.drone = true; vv.f0 = 110; vv.vel = 0.9;
      const p = mkPar(); p.e = V_[slotParam(s, SA)]; p.b = V_[slotParam(s, SB)]; p.sr = this.sr; p.dt = 1 / this.sr; p.drone = true; trigger(vv, Math.round(V_[slotParam(s, SType)]), p);
    }
    set(id, x) {
      if (id < 0 || id >= E.Count) return;
      this.v[id] = x;
      if (id === E.Preset) { this.loadPreset(Math.round(x)); return; }
      if (id >= SlotBase && id < FxBase) {
        const s = ((id - SlotBase) / SlotParams) | 0, q = (id - SlotBase) % SlotParams;
        if (q === SPlay || q === SType) {
          const drone = this.v[slotParam(s, SPlay)] > 0.5 && this.v[slotParam(s, SType)] > 0.5;
          for (let k = 0; k < kPoly; ++k) { const vv = this.vo[s][k]; vv.clear(); vv.rng.s = (0x7777 + (s * 131 + k * 17 + 1) * 2246822519) >>> 0 || 1; }
          if (drone) this.startDrone(s);
        }
      }
    }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.mod = m; } pressure(p) { }
    allNotesOff() { for (const sl of this.vo) for (const v of sl) v.gate = false; }
    noteOn(note, vel) {
      const V_ = this.v; if (V_[E.Mode] > 0.5 && V_[E.Mode] < 1.5) return;
      for (let s = 0; s < kSlots; ++s) {
        const type = Math.round(V_[slotParam(s, SType)]); if (type <= 0 || V_[slotParam(s, SPlay)] > 0.5) continue;
        let pick = -1, oldest = -1;
        for (let k = 0; k < kPoly; ++k) { if (!this.vo[s][k].on) { pick = k; break; } if (this.vo[s][k].age > oldest) { oldest = this.vo[s][k].age; pick = k; } }
        const v = this.vo[s][pick], keep = v.rng.s; v.clear(); v.rng.s = (keep ^ 0x5bd1e995) >>> 0 || 1;
        v.on = true; v.gate = true; v.note = note; v.vel = clampf(vel, 0.05, 1); v.f0 = 440 * Math.pow(2, (note - 69 + this.noteTune / 100) / 12);
        const p = this.par; p.e = V_[slotParam(s, SA)]; p.b = V_[slotParam(s, SB)]; p.vel = v.vel; p.g = V_[E.Gravity]; p.drone = false; trigger(v, type, p);
      }
    }
    noteOff(note) { for (let s = 0; s < kSlots; ++s) for (const v of this.vo[s]) if (v.on && v.note === note && !v.drone) v.gate = false; }
    loadPreset(pn) {
      const t = PRESETS[clampf(pn, 0, PRESETS.length - 1)], put = (id, x) => { this.set(id, x); this.v[id] = x; this.writeParam(id, x); };
      put(E.Mode, t.mode); put(E.Chaos, t.chaos); put(E.Wear, t.wear); put(E.Gravity, t.grav); put(E.Overload, t.ovl);
      for (let s = 0; s < kSlots; ++s) { const x = t.s[s]; put(slotParam(s, SType), x[0]); put(slotParam(s, SLevel), x[1]); put(slotParam(s, STune), x[2]); put(slotParam(s, SA), x[3]); put(slotParam(s, SB), x[4]); put(slotParam(s, SDrive), x[5]); put(slotParam(s, SDriveAmt), x[6]); put(slotParam(s, SPlay), x[7]); }
      for (let f = 0; f < kFx; ++f) { const x = t.f[f]; put(fxParam(f, FType), x[0]); put(fxParam(f, FA), x[1]); put(fxParam(f, FB), x[2]); put(fxParam(f, FMix), x[3]); }
    }
    applyFx(f) {
      const x = this.fx[f], V_ = this.v, type = Math.round(V_[fxParam(f, FType)]), A = V_[fxParam(f, FA)], B = V_[fxParam(f, FB)], sr = this.sr;
      if (type === x.lastType && Math.abs(A - x.lastA) < 1e-4 && Math.abs(B - x.lastB) < 1e-4) return;
      if (type !== x.lastType) x.wipe();
      x.lastType = type; x.lastA = A; x.lastB = B;
      if (type === 7) for (let c = 0; c < 2; ++c) { x.hp[c].set(4, 280 + 450 * A, 0.9, sr); x.lpb[c].set(3, 2200 + 2200 * A, 0.9, sr); }
      if (type === 8) { const ratio = [1, 2.32, 4.1, 6.2], f0 = 90 + 520 * Math.pow(A, 1.3), q = 5 + 55 * B; for (let c = 0; c < 2; ++c) for (let k = 0; k < 4; ++k) x.bq[c][k].set(5, f0 * ratio[k] * (c ? 1.012 : 1), q, sr); }
    }
    process(outL, outR, n) {
      const V_ = this.v, mode = Math.round(V_[E.Mode]), effect = mode >= 1, inGain = effect ? V_[E.Input] : 0, dry = effect ? V_[E.Dry] : 0;
      const chaos = V_[E.Chaos], wear = V_[E.Wear], grav = V_[E.Gravity], ovl = V_[E.Overload], vol = Math.pow(10, V_[E.Volume] / 20), srf = this.sr, dt = 1 / srf;
      for (let f = 0; f < kFx; ++f) this.applyFx(f);
      const p = this.par, env = this.env, norm = this.norm; p.sr = srf; p.dt = dt; p.g = grav; p.wear = wear;
      const types = [0, 0, 0, 0], baseA = [0, 0, 0, 0], baseB = [0, 0, 0, 0], lvl = [0, 0, 0, 0], tune = [0, 0, 0, 0], drvs = [0, 0, 0, 0], damt = [0, 0, 0, 0];
      for (let s = 0; s < kSlots; ++s) { types[s] = Math.round(V_[slotParam(s, SType)]); baseA[s] = V_[slotParam(s, SA)]; baseB[s] = V_[slotParam(s, SB)]; lvl[s] = V_[slotParam(s, SLevel)]; tune[s] = V_[slotParam(s, STune)]; drvs[s] = Math.round(V_[slotParam(s, SDrive)]); damt[s] = V_[slotParam(s, SDriveAmt)]; }
      const io = this._io || (this._io = [0, 0]);
      for (let i = 0; i < n; ++i) {
        const xl = 0, xr = 0; this.inEnv += (0 - this.inEnv) * 0.0008;
        if (--this.chaosCtr <= 0) { this.chaosCtr = (srf * 0.07) | 0; this.chaosTarget = this.rng.uni(); for (let s = 0; s < kSlots; ++s) { this.chaosT[s] = this.rng.bi(); this.chaosB[s] = this.rng.uni() < chaos * 0.2 ? 0.5 * chaos : 0; } }
        this.chaosN += (this.chaosTarget - this.chaosN) * 0.0006;
        let sl = 0, sr = 0;
        for (let s = 0; s < kSlots; ++s) {
          const type = types[s]; if (type <= 0) { env[s] *= 0.999; continue; }
          this.chaosS[s] += (this.chaosT[s] - this.chaosS[s]) * 0.0002; this.wearJ[s] += (this.rng.bi() - this.wearJ[s]) * 0.02;
          const drv = drvs[s]; let dv = 0;
          if (drv === 1) dv = clampf(this.inEnv * 3, 0, 1); else if (drv >= 2 && drv <= 5 && drv - 2 !== s) dv = clampf(env[drv - 2] * 4, 0, 1); else if (drv === 6) dv = this.chaosN;
          const eBase = clampf(baseA[s] + damt[s] * dv, 0, 1.5); p.e = eBase; p.b = baseB[s];
          p.pm = Math.pow(2, (tune[s] + this.chaosS[s] * chaos * 3 + this.wearJ[s] * wear * 0.35 + this.bend * 2) / 12);
          let acc = 0; const cb = this.chaosB[s], vs = this.vo[s];
          for (let k = 0; k < kPoly; ++k) {
            const v = vs[k]; if (!v.on) continue;
            p.vel = v.vel; p.drone = v.drone; p.e = clampf(eBase + cb, 0, 1.5);
            const y = tick(v, type, p); acc += y;
            if (!v.gate && !v.drone) { if (Math.abs(y) < 1e-6) { if (++v.quiet > ((0.5 * srf) | 0)) v.on = false; } else v.quiet = 0; }
          }
          acc *= norm[type] * lvl[s]; const aa = Math.abs(acc); env[s] += (aa - env[s]) * (aa > env[s] ? 0.01 : 0.0005);
          const pan = (s - 1.5) * 0.3; sl += acc * (1 - Math.max(0, pan)) * 0.7; sr += acc * (1 + Math.min(0, pan)) * 0.7;
        }
        let l = sl + xl * inGain, r = sr + xr * inGain;
        io[0] = l; io[1] = r; for (let f = 0; f < kFx; ++f) this.fxProcess(f, io); l = io[0] + xl * dry; r = io[1] + xr * dry;
        l *= vol; r *= vol;
        const m2 = 0.5 * (l * l + r * r); this.pw += (m2 - this.pw) * 0.0003;
        if (ovl > 0) this.heat += dt * (ovl * 12 * this.pw - 0.15 * this.heat); else this.heat -= this.heat * dt * 0.5; if (this.heat < 0) this.heat = 0;
        if (this.heat > 1 && this.blow <= 0) { this.blow = 1.8; this.heat = 0.1; this.blowGain = 1; }
        let clunk = 0;
        if (this.blow > 0) { this.blow -= dt; this.blowGain = Math.max(0, this.blowGain - dt / 0.005); const t = 1.8 - this.blow; clunk = 0.35 * Math.sin(TWO_PI * 70 * t) * Math.exp(-t / 0.12) + 0.5 * this.rng.bi() * Math.exp(-t / 0.02); }
        else if (this.blowGain < 1) this.blowGain = Math.min(1, this.blowGain + dt / 0.3);
        l = l * this.blowGain + clunk; r = r * this.blowGain + clunk;
        if (!isFinite(l) || !isFinite(r)) { l = r = 0; }
        l = clampf(l, -16, 16); r = clampf(r, -16, 16); let a = Math.abs(l);
        if (a >= 0.8) l = (l < 0 ? -1 : 1) * (0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2));
        a = Math.abs(r); if (a >= 0.8) r = (r < 0 ? -1 : 1) * (0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2));
        outL[i] = l; outR[i] = r;
      }
    }
    fxProcess(f, io) {
      const x = this.fx[f], type = x.lastType; if (type <= 0) { this.fxLev[f] *= 0.9995; return; }
      const V_ = this.v, mix = V_[fxParam(f, FMix)], inL = io[0], inR = io[1], sr = this.sr, dt = 1 / sr;
      x.a += (V_[fxParam(f, FA)] - x.a) * 0.0004; x.b += (V_[fxParam(f, FB)] - x.b) * 0.0015; const a = x.a, b = x.b;
      let wl = 0, wr = 0; const nz = x.rng.bi(), dl = x.dl;
      switch (type) {
        case 1: { // spring in a tube
          const D = (0.02 + 0.1 * a) * sr, fb = 0.35 + 0.52 * b, shake = b * b; x.wob += dt * (3 + 5 * x.rng.uni()); x.nz += (nz - x.nz) * 0.0006;
          for (let c = 0; c < 2; ++c) {
            const inp = (c ? inR : inL) * 0.5, Dc = D * (c ? 1.09 : 1) * (1 + shake * 0.012 * (Math.sin(TWO_PI * x.wob * (c ? 1.1 : 1)) + 8 * x.nz));
            let d = dl[c].read(Dc); const ap = x.ap, o0 = c * 40;
            for (let i = 0; i < 40; ++i) { const y = 0.6 * d + ap[o0 + i]; ap[o0 + i] = d - 0.6 * y; d = y; }
            x.lp[c * 14] += (d - x.lp[c * 14]) * 0.5; const o = x.lp[c * 14]; dl[c].push(clampf(inp + fb * o, -4, 4)); if (c) wr = o * 1.2; else wl = o * 1.2;
          }
          break; }
        case 2: { // underwater microphone
          const fc = 9000 * Math.pow(0.04, a), co = Math.exp(-TWO_PI * fc / sr); x.wob += dt * (0.4 + 1.2 * b); x.nz += (nz - x.nz) * 0.00005;
          if (x.rng.uni() < (0.5 + b * 14) * dt) { x.bubEnv = 0.4 + 0.6 * x.rng.uni(); x.bubF = 500 + 2200 * x.rng.uni(); x.bubPh = 0; }
          x.bubPh = wrap1(x.bubPh + x.bubF * dt); x.bubF *= 1 + 14 * dt; x.bubEnv *= Math.exp(-dt / 0.012); const bubble = x.bubEnv * Math.sin(TWO_PI * x.bubPh) * 0.05 * b;
          for (let c = 0; c < 2; ++c) {
            const inp = c ? inR : inL; dl[c].push(inp);
            const mod = (0.0012 + 0.004 * b) * sr * (Math.sin(TWO_PI * (x.wob + 0.37 * c)) * 0.6 + Math.sin(TWO_PI * x.wob * 2.3 + 1 + c) * 0.25 + 8 * x.nz);
            const s = dl[c].read(0.006 * sr + mod), L = x.lp, o = c * 14;
            L[o] = s + (L[o] - s) * co; L[o + 1] = L[o] + (L[o + 1] - L[o]) * co; x.lp2[c * 2] += (L[o + 1] - x.lp2[c * 2]) * 0.014;
            const w = L[o + 1] * (1 + 0.4 * a) + x.lp2[c * 2] * a * 0.9 + bubble; if (c) wr = w; else wl = w;
          }
          break; }
        case 3: { // slinky echo
          const T0 = (0.04 + 0.4 * a) * sr, rr = 0.5 + 0.42 * b; dl[0].push(inL); dl[1].push(inR); let tl = 0, tr = 0, tt = 0, g = 0.9, gap = T0;
          for (let n = 0; n < 12; ++n) {
            tt += gap; gap *= rr; if (tt > 3.1 * sr) break; const co = clampf(0.62 - 0.04 * n, 0.15, 0.7);
            for (let c = 0; c < 2; ++c) { const s = dl[c].read(tt); x.tapLp[c * 12 + n] += (s - x.tapLp[c * 12 + n]) * co; }
            const even = (n & 1) === 0, t0 = x.tapLp[n], t1 = x.tapLp[12 + n];
            tl += t0 * g * (even ? 1 : 0.45) + t1 * g * (even ? 0.2 : 0.45); tr += t1 * g * (even ? 0.45 : 1) + t0 * g * (even ? 0.2 : 0.45); g *= 0.8;
          }
          const da = 0.3 + 0.4 * b, vv = x.vv; vv[0] = tl; vv[1] = tr;
          for (let c = 0; c < 2; ++c) { let s = vv[c]; for (let i = 0; i < 12; ++i) { const y = da * s + x.apc[c * 12 + i]; x.apc[c * 12 + i] = s - da * y; s = y; } vv[c] = s; }
          wl = vv[0] * 0.8; wr = vv[1] * 0.8; break; }
        case 4: { // garden hose
          const D = (0.005 + a * a * 0.4) * sr, fc = 7500 * Math.pow(0.08, b), co = Math.exp(-TWO_PI * fc / sr);
          for (let c = 0; c < 2; ++c) {
            const inp = c ? inR : inL, d = dl[c].read(D * (c ? 1.031 : 1)), d2 = dl[c].read(D * 0.5 * (c ? 1.031 : 1)), o = c * 14;
            x.lp[o] = d + (x.lp[o] - d) * co; dl[c].push(clampf(inp + 0.58 * x.lp[o], -4, 4)); const w = x.lp[o] - 0.25 * d2; if (c) wr = w; else wl = w;
          }
          break; }
        case 5: { // fan-blade tremolo
          const target = 0.4 + 14 * a * a; x.w += (target - x.w) * dt / 0.4; x.ph = wrap1(x.ph + x.w * dt); const depth = 0.2 + 0.8 * b, ex = 1 + 2 * a;
          const g0 = 1 - depth * Math.pow(0.5 + 0.5 * Math.cos(TWO_PI * x.ph), ex), g1 = 1 - depth * Math.pow(0.5 + 0.5 * Math.cos(TWO_PI * (x.ph + 0.25)), ex); wl = inL * g0; wr = inR * g1; break; }
        case 6: { // vacuum pump
          const e = Math.max(Math.abs(inL), Math.abs(inR)); x.env += (e - x.env) * (e > x.env ? 0.02 : 0.0004);
          const tgt = clampf(x.env * 3, 0, 1); x.sup += (tgt - x.sup) * (tgt > x.sup ? dt / 0.08 : dt / 0.45); const fc = 200 + 13000 * Math.pow(1 - a * 0.97 * x.sup, 2.2);
          if (x.env < 0.01 && x.sup > 0.12 && x.pop < 0.5) { x.pop = 1; x.popEnv = b * x.sup; }
          if (x.env > 0.05) x.pop = 0; x.popEnv *= Math.exp(-dt / 0.012); const pk = x.popEnv * nz * 0.5;
          svf(x.svl, 0, inL + pk, fc, 0.7 + 2.5 * b, sr); wl = oLp; svf(x.svl, 2, inR + pk, fc, 0.7 + 2.5 * b, sr); wr = oLp; break; }
        case 7: { // paper-cup telephone
          x.nz += (nz - x.nz) * 0.03;
          for (let c = 0; c < 2; ++c) {
            let s = Math.tanh((c ? inR : inL) * 2) * 0.6; s = x.hp[c].run(s); s = x.lpb[c].run(s); s *= 1 + b * 3.2 * x.nz; s += x.nz * b * 0.2 * Math.abs(s);
            dl[c].push(s); const d = dl[c].read(0.0031 * sr * (c ? 1.07 : 1)), w = (s + 0.35 * d) * 1.3; if (c) wr = w; else wl = w;
          }
          break; }
        case 8: { // bucket
          for (let c = 0; c < 2; ++c) { const inp = c ? inR : inL, bq = x.bq[c]; const s = inp * 0.2 + (bq[0].run(inp) * 1 + bq[1].run(inp) * 0.8 + bq[2].run(inp) * 0.55 + bq[3].run(inp) * 0.4) * 1.4; if (c) wr = s; else wl = s; }
          break; }
      }
      if (!isFinite(wl) || !isFinite(wr)) { wl = wr = 0; x.wipe(); }
      wl = clampf(wl, -16, 16); wr = clampf(wr, -16, 16); io[0] = inL * (1 - mix) + wl * mix; io[1] = inR * (1 - mix) + wr * mix;
      this.fxLev[f] += (Math.max(Math.abs(wl), Math.abs(wr)) * mix - this.fxLev[f]) * 0.002;
    }
  }

  /* presets: mode, chaos, wear, gravity, overload, 4 slots [type, level, tune, A, B, drive, driveAmt, play], 3 fx [type, A, B, mix] */
  const PRESETS = [
    { mode: 2, chaos: 0, wear: 0, grav: 1, ovl: 0, s: [[2, .7, 0, .5, .5, 0, 0, 0], [6, .7, 0, .5, .5, 0, 0, 0], [5, .7, 0, .5, .5, 0, 0, 0], [9, .7, 0, .5, .5, 0, 0, 0]], f: [[1, .5, .5, .35], [8, .5, .5, .25], [0, .5, .5, .3]] },
    { mode: 2, chaos: .15, wear: .2, grav: 1, ovl: 0, s: [[2, .6, -12, .5, .4, 0, 0, 1], [6, .7, 0, .6, .5, 2, .5, 1], [8, .8, 0, .5, .6, 0, 0, 0], [9, .8, 0, .5, .5, 0, 0, 0]], f: [[1, .4, .5, .3], [8, .3, .6, .25], [0, .5, .5, .3]] },
    { mode: 2, chaos: .1, wear: 0, grav: 1.4, ovl: 0, s: [[3, .55, -24, .5, .85, 0, 0, 1], [6, .6, 0, .5, .8, 0, 0, 1], [5, .8, 0, .5, .6, 0, 0, 0], [4, .7, -12, .4, .5, 0, 0, 0]], f: [[2, .8, .6, .9], [4, .6, .7, .3], [0, .5, .5, .3]] },
    { mode: 2, chaos: .5, wear: .7, grav: .8, ovl: 0, s: [[11, .45, -12, .3, .5, 0, 0, 1], [4, .7, 0, .6, .6, 0, 0, 0], [10, .6, -12, .2, .6, 6, .6, 1], [8, .8, 0, .5, .5, 3, .7, 0]], f: [[1, .8, .8, .5], [7, .3, .7, .2], [6, .5, .6, .3]] },
    { mode: 2, chaos: 0, wear: .1, grav: 1, ovl: 0, s: [[1, .8, 0, .5, .4, 0, 0, 0], [1, .6, 7, .4, .6, 0, 0, 0], [1, .6, 12, .6, .8, 0, 0, 0], [5, .6, 0, .5, .6, 0, 0, 0]], f: [[4, .3, .5, .2], [5, .4, .3, 1], [0, .5, .5, .3]] },
    { mode: 2, chaos: .3, wear: .3, grav: 1, ovl: 0, s: [[11, .5, -12, .6, .6, 0, 0, 1], [2, .7, -12, .5, .5, 0, 0, 0], [3, .5, 0, .5, .4, 3, .8, 1], [7, .8, 0, .6, .6, 0, 0, 0]], f: [[3, .4, .7, .5], [6, .6, .5, 1], [1, .5, .5, .2]] },
    { mode: 2, chaos: .1, wear: 0, grav: 1, ovl: 0, s: [[6, .8, 0, .7, .5, 0, 0, 1], [5, .8, 0, .5, .7, 0, 0, 0], [6, .5, -12, .3, .8, 2, .6, 1], [0, .7, 0, .5, .5, 0, 0, 0]], f: [[4, .5, .5, .4], [8, .4, .4, .3], [1, .4, .5, .2]] },
    { mode: 2, chaos: .1, wear: .2, grav: 1, ovl: 0, s: [[9, .8, 0, .4, .6, 0, 0, 0], [8, .8, 0, .5, .5, 0, 0, 0], [2, .6, -12, .5, .3, 0, 0, 0], [7, .7, 0, .5, .4, 0, 0, 0]], f: [[5, .4, .5, 1], [7, .3, .4, .2], [0, .5, .5, .3]] },
    { mode: 1, chaos: .1, wear: .2, grav: 1, ovl: 0, s: [[2, .6, 0, .4, .5, 1, 1, 1], [10, .7, 0, .3, .5, 1, 1, 1], [3, .5, -12, .3, .5, 1, 1, 1], [11, .35, 0, .2, .5, 1, 1, 1]], f: [[6, .6, .6, 1], [2, .5, .5, .6], [8, .4, .5, .3]] },
  ];

  OCC.engines.physica = {
    name: 'Physica',
    blurb: 'Electro-mechanical synth: 23 modelled machines (balloon, motor, siren, bowed squeal, bottle, drips, slinky, mousetrap, ruler, fan, arc, ...) in four slots, wired to drive one another, through three "rooms made of things" (spring tube, underwater mic, slinky echo, hose, fan tremolo, vacuum pump, paper cups, bucket). Slots can be played or left droning; Chaos, Wear, Gravity and an Overload fuse that can blow are the wild controls. Web version: no audio input, so the Input / Effect mode is silent and Input-driven slots hear nothing (the Input Eater preset runs on drones). The plugin\'s "Load chain" selector is the Preset selector here.',
    specs, groups, make: sr => new Physica(sr), E
  };
})();
/* Beachica - the shore and the sea, modelled: surf bed, wind, gulls, whales, bubbles, pebbles, crickets and 14 voices, with a Waterline control and Fibonacci shell/coral filters.
   Port of plugins/beachica/beachica.h (+ Biquad/Rng from dsp.h, Rev from avoidica.h, scale offsets from scales.h). */
(function () {
  const E = {}; ['Preset', 'Volume', 'Waterline', 'Day', 'Surf', 'Wind', 'Gulls', 'Whales', 'Bubbles', 'Pebbles', 'Night', 'BedMode', 'WaveSize', 'WavePeriod', 'Foam', 'Backwash', 'Storm', 'TideSync',
    'FibAmount', 'FibMode', 'FibRoot', 'FibQ', 'FibSpin', 'Pressure', 'Current', 'Attack', 'Release', 'Bright', 'Focus', 'Spread', 'ModWheel', 'Scale', 'Tonic', 'Tune', 'Octave', 'ReverbMix', 'ReverbSize', 'Count'].forEach((n, i) => E[n] = i);
  const VOICES = ['Surf wash', 'Tide choir', 'Shell', 'Coral glass', 'Deep drone', 'Sonar', 'Whale song', 'Dolphin', 'Gull', 'Bubbles', 'Stones', 'Buoy bell', 'Foghorn', 'Kelp pad'];
  const SCALES = ['12-tone equal', 'Just (Shuddha)', 'Raga Bhairav', 'Raga Yaman', 'Raga Todi', 'Raga Kafi', 'Pythagorean', 'Chinese pentatonic', 'Japanese In', 'Maqam Rast', 'Maqam Bayati', 'Maqam Hijaz', 'Slendro-ish', 'Mongolian pentatonic'];
  const JI = [0, 11.7, 3.9, 15.6, -13.7, -2.0, -9.8, 2.0, 13.7, -15.6, 17.6, -11.7];
  const SCALE_OFF = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], JI, JI, JI, JI, JI, [0, -9.8, 3.9, -5.9, 7.8, -2.0, 11.7, 2.0, -7.8, 5.9, -3.9, 9.8], [0, 0, 3.9, 0, 7.8, 0, 0, 2.0, 0, 5.9, 0, 0], [0, 0, 0, 0, 0, 0, 0, 2.0, 0, 0, 0, 0],
    [0, 0, 0, 50, 0, 0, 0, 0, 0, 0, 50, 0], [0, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 40, 0, 0, -20, 0, 20, 0, 0, -40, 0], [0, 0, 3.9, 0, -13.7, 0, 0, 2.0, 0, -15.6, 0, 0]];
  const specs = [
    P('Preset', '', 0, 13, 13, '%.0f', false, VOICES),
    P('Volume', 'dB', -24, 12, 0, '%.1f dB'), P('Waterline', '', -100, 100, 35, '%.0f'), P('Time of day', '', 0, 2, 1, '%.0f', false, ['Day', 'Golden hour', 'Night']),
    P('Surf', '%', 0, 100, 55, '%.0f %%'), P('Wind', '%', 0, 100, 30, '%.0f %%'), P('Gulls', '%', 0, 100, 30, '%.0f %%'), P('Whales', '%', 0, 100, 20, '%.0f %%'),
    P('Bubbles', '%', 0, 100, 25, '%.0f %%'), P('Pebbles', '%', 0, 100, 25, '%.0f %%'), P('Night life', '%', 0, 100, 40, '%.0f %%'), P('Bed', '', 0, 1, 0, '%.0f', false, ['Always', 'With keys']),
    P('Wave size', '%', 0, 100, 55, '%.0f %%'), P('Wave period', 's', 3, 16, 8, '%.1f s'), P('Foam', '%', 0, 100, 50, '%.0f %%'), P('Backwash', '%', 0, 100, 50, '%.0f %%'),
    P('Storm', '%', 0, 100, 0, '%.0f %%'), P('Tide sync', '%', 0, 100, 35, '%.0f %%'),
    P('Shell/coral', '%', 0, 100, 25, '%.0f %%'), P('Filter mode', '', 0, 4, 0, '%.0f', false, ['Auto', 'Shell', 'Coral', 'Spiral', 'Follow key']),
    P('Filter root', 'Hz', 60, 800, 220, '%.0f Hz', true), P('Filter Q', '', 5, 80, 25, '%.0f'), P('Spiral rate', 'Hz', 0.02, 1, 0.1, '%.2f Hz', true),
    P('Pressure', '%', 0, 100, 40, '%.0f %%'), P('Current', '%', 0, 100, 30, '%.0f %%'),
    P('Attack', 'ms', 5, 4000, 1500, '%.0f ms', true), P('Release', 'ms', 20, 8000, 3500, '%.0f ms', true), P('Brightness', '%', 0, 100, 50, '%.0f %%'),
    P('Focus', '%', 0, 100, 50, '%.0f %%'), P('Spread', '%', 0, 100, 40, '%.0f %%'),
    P('Mod wheel', '', 0, 4, 0, '%.0f', false, ['Waterline', 'Storm', 'Wave size', 'Shell/coral', 'Brightness']),
    P('Scale', '', 0, 13, 0, '%.0f', false, SCALES),
    P('Tonic', '', 0, 11, 0, '%.0f', false, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']),
    P('Tune', 'cents', -50, 50, 0, '%.0f c'), P('Octave', '', -2, 2, 0, '%.0f'), P('Reverb mix', '%', 0, 100, 25, '%.0f %%'), P('Reverb size', '%', 0, 100, 55, '%.0f %%'),
  ];
  const groups = [
    ['Scene', [E.Waterline, E.Day, E.BedMode, E.Volume]],
    ['Bed', [E.Surf, E.Wind, E.Gulls, E.Whales, E.Bubbles, E.Pebbles, E.Night, E.Storm]],
    ['Waves', [E.WaveSize, E.WavePeriod, E.Foam, E.Backwash, E.TideSync]],
    ['Shell and coral', [E.FibAmount, E.FibMode, E.FibRoot, E.FibQ, E.FibSpin]],
    ['Water', [E.Pressure, E.Current]],
    ['Keys', [E.Attack, E.Release, E.Bright, E.Focus, E.Spread, E.ModWheel]],
    ['Tuning', [E.Scale, E.Tonic, E.Tune, E.Octave]],
    ['Room', [E.ReverbMix, E.ReverbSize]],
  ];
  // voice table: attack, release, bright, focus, oneShot
  const VD = [[900, 2500, 55, 40, 0], [700, 1800, 55, 50, 0], [30, 2500, 60, 50, 0], [1200, 3000, 60, 50, 0], [1800, 4000, 35, 50, 0], [5, 600, 60, 50, 1], [600, 3000, 45, 50, 0],
    [20, 400, 70, 50, 0], [5, 200, 70, 50, 1], [5, 200, 60, 50, 1], [5, 300, 60, 50, 1], [10, 2500, 55, 50, 0], [250, 1800, 40, 50, 0], [1500, 3500, 50, 50, 0]];
  const PHI = 1.6180339887, TWO_PI = 6.2831853, HP = 1.5708;

  class Rng { constructor(s) { this.s = s >>> 0; } uni() { let s = this.s; s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; this.s = s; return (s >>> 8) * (1 / 16777216); } bi() { return this.uni() * 2 - 1; } }
  class Bq { // types: 3 LowPass, 4 HighPass, 5 BandPass
    constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; }
    set(t, f, q, sr) {
      f = clampf(f, 5, sr * 0.49); q = Math.max(0.05, q); const w = 2 * Math.PI * f / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * q); let B0, B1, B2;
      if (t === 3) { B0 = (1 - cw) / 2; B1 = 1 - cw; B2 = B0; } else if (t === 4) { B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = B0; } else { B0 = al; B1 = 0; B2 = -al; }
      const A0 = 1 + al; this.b0 = B0 / A0; this.b1 = B1 / A0; this.b2 = B2 / A0; this.a1 = -2 * cw / A0; this.a2 = (1 - al) / A0;
    }
    cp(o) { this.b0 = o.b0; this.b1 = o.b1; this.b2 = o.b2; this.a1 = o.a1; this.a2 = o.a2; }
    run(x) { const y = this.b0 * x + this.z1; this.z1 = this.b1 * x - this.a1 * y + this.z2; this.z2 = this.b2 * x - this.a2 * y; return y; }
    reset() { this.z1 = this.z2 = 0; }
  }
  class Rev { // Freeverb-style room (avoidica.h)
    constructor(sr) {
      const ct = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], at = [556, 441, 341, 225];
      this.cb = []; this.ci = []; this.cz = []; this.ab = []; this.ai = [];
      for (let ch = 0; ch < 2; ++ch) { this.cb.push(ct.map(t => new Float32Array(Math.floor((t + ch * 23) * sr / 44100) + 1))); this.ab.push(at.map(t => new Float32Array(Math.floor((t + ch * 23) * sr / 44100) + 1)));
        this.ci.push(new Int32Array(8)); this.cz.push(new Float64Array(8)); this.ai.push(new Int32Array(4)); }
    }
    clear() { for (let ch = 0; ch < 2; ++ch) { this.cb[ch].forEach(b => b.fill(0)); this.ab[ch].forEach(b => b.fill(0)); this.ci[ch].fill(0); this.cz[ch].fill(0); this.ai[ch].fill(0); } }
    tick(ch, inp, fb, damp) {
      let s = 0; const cb = this.cb[ch], ci = this.ci[ch], cz = this.cz[ch], d1 = 1 - damp;
      for (let k = 0; k < 8; ++k) { const b = cb[k], i = ci[k], y = b[i]; cz[k] = y * d1 + cz[k] * damp; b[i] = inp + cz[k] * fb; ci[k] = i + 1 >= b.length ? 0 : i + 1; s += y; }
      const ab = this.ab[ch], ai = this.ai[ch];
      for (let k = 0; k < 4; ++k) { const b = ab[k], i = ai[k], bo = b[i], y = -s + bo; b[i] = s + bo * 0.5; ai[k] = i + 1 >= b.length ? 0 : i + 1; s = y; }
      return s;
    }
  }
  const ar2gain = (c1, c2) => { const v = (1 - c2) / ((1 + c2) * ((1 - c2) * (1 - c2) - c1 * c1)); return 1 / Math.sqrt(Math.max(1e-9, v)); };
  const WH = new Float64Array(9); for (let h = 1; h <= 8; ++h) WH[h] = Math.pow(h, -1.1) * (0.7 + 0.3 * Math.cos(h * 1.7)); // whale-song harmonic weights (voice 6)
  const WH2 = new Float64Array(8); for (let h = 1; h <= 7; ++h) WH2[h] = Math.pow(h, -1.15) * (0.7 + 0.3 * Math.cos(h * 1.7));

  class Gull {
    constructor() { this.on = false; this.left = 0; this.gap = 0; this.t = 0; this.dur = 0.3; this.fa = 1200; this.fb = 2000; this.fc = 900; this.vib = 0.03; this.vr = 30; this.amp = 0.3; this.pan = 0.5; this.rasp = 0.4; this.rz = 0; this.base = 1400; this.ph = 0; this.w = new Float64Array(16); this.H = 8; this.cnt = 0; }
    syllable(r) { const b = this.base; this.fa = b * (0.8 + 0.15 * r.uni()); this.fb = b * (1.3 + 0.2 * r.uni()); this.fc = b * (0.5 + 0.15 * r.uni()); this.dur = 0.16 + 0.18 * r.uni(); this.vib = 0.01 + 0.04 * r.uni(); this.vr = 24 + 14 * r.uni(); this.t = 0; }
    start(b, a, p, syl, r) { this.on = true; this.base = b; this.amp = a; this.pan = p; this.left = syl - 1; this.gap = 0; this.rasp = 0.2 + 0.5 * r.uni(); this.syllable(r); }
    step(sr, r) {
      if (!this.on) return 0;
      if (this.gap > 0) { this.gap -= 1 / sr; if (this.gap <= 0) { this.gap = 0; this.syllable(r); this.base *= 0.92 + 0.12 * r.uni(); } return 0; }
      const u = this.t / this.dur; let f = u < 0.28 ? this.fa + (this.fb - this.fa) * Math.pow(u / 0.28, 0.8) : this.fb + (this.fc - this.fb) * Math.pow((u - 0.28) / 0.72, 0.9);
      f *= 1 + this.vib * Math.sin(TWO_PI * this.vr * this.t);
      const w = this.w;
      if ((this.cnt++ & 31) === 0) {
        this.H = clampf(Math.trunc(0.42 * sr / Math.max(200, f)), 2, 14); let s2 = 0;
        for (let h = 1; h <= this.H; ++h) { const fh = h * f; w[h] = Math.pow(h, -0.65) * (0.25 + 1.8 * Math.exp(-Math.pow((fh - 1900) / 800, 2)) + 0.8 * Math.exp(-Math.pow((fh - 3800) / 1100, 2))); s2 += w[h] * w[h]; }
        const g = 1 / Math.sqrt(Math.max(1e-6, s2)); for (let h = 1; h <= this.H; ++h) w[h] *= g;
      }
      this.ph += TWO_PI * f / sr; if (this.ph > TWO_PI) this.ph -= TWO_PI;
      const s1 = Math.sin(this.ph), c1 = Math.cos(this.ph); let sp = 0, sc = s1, sum = w[1] * s1;
      for (let h = 2; h <= this.H; ++h) { const sn = 2 * c1 * sc - sp; sum += w[h] * sn; sp = sc; sc = sn; }
      this.rz = 0.8 * this.rz + 0.2 * r.bi(); const env = Math.sqrt(Math.max(0, Math.sin(3.14159 * Math.min(1, u)))) * Math.min(1, this.t / 0.008);
      this.t += 1 / sr; if (this.t >= this.dur) { if (this.left > 0) { --this.left; this.gap = 0.05 + 0.1 * r.uni(); } else this.on = false; }
      return sum * env * this.amp * 0.35 * (1 + this.rasp * 3.5 * this.rz);
    }
  }
  class Whale {
    constructor() { this.on = false; this.mode = 0; this.left = 0; this.gap = 0; this.t = 0; this.dur = 2; this.f0 = 150; this.f1 = 150; this.amp = 0.2; this.pan = 0.5; this.ph = 0; this.nextClick = 0; this.clickEnv = 0; this.rate = 18; this.clicks = 0; this.bp = new Bq(); }
    note(r, first) { if (first) this.f0 = 110 + 220 * r.uni(); else this.f0 = this.f1; this.f1 = clampf(this.f0 * Math.pow(2, (r.uni() - 0.5) * 1.4), 90, 420); this.dur = 1.4 + 1.8 * r.uni(); this.t = 0; }
    startSong(r, a, p, notes) { this.on = true; this.mode = 0; this.amp = a; this.pan = p; this.left = notes - 1; this.gap = 0; this.note(r, true); }
    startClicks(r, a, p, sr) { this.on = true; this.mode = 1; this.amp = a; this.pan = p; this.clicks = 20 + Math.trunc(r.uni() * 24); this.rate = 18; this.nextClick = 0; this.clickEnv = 0; this.bp.reset(); this.bp.set(5, 2800, 1.1, sr); }
    step(sr, r) {
      if (!this.on) return 0;
      if (this.mode === 1) {
        this.nextClick -= 1 / sr; if (this.nextClick <= 0 && this.clicks > 0) { this.clickEnv = 1; --this.clicks; this.rate = Math.max(8, this.rate * 0.96); this.nextClick = 1 / this.rate; }
        if (this.clicks <= 0 && this.clickEnv < 1e-3) this.on = false;
        this.clickEnv *= Math.exp(-1 / (sr * 0.0012)); return this.bp.run(r.bi() * this.clickEnv) * this.amp * 3;
      }
      if (this.gap > 0) { this.gap -= 1 / sr; if (this.gap <= 0) this.note(r, false); return 0; }
      const u = this.t / this.dur, sm = u * u * (3 - 2 * u); let f = this.f0 * Math.pow(this.f1 / this.f0, sm); f *= 1 + 0.004 * Math.sin(TWO_PI * 3.2 * this.t);
      this.ph += TWO_PI * f / sr; if (this.ph > TWO_PI) this.ph -= TWO_PI; let sum = 0; for (let h = 1; h <= 7; ++h) sum += WH2[h] * Math.sin(h * this.ph);
      const env = Math.pow(Math.max(0, Math.sin(3.14159 * Math.min(1, u))), 1.4); this.t += 1 / sr;
      if (this.t >= this.dur) { if (this.left > 0) { --this.left; this.gap = 0.2 + 0.5 * r.uni(); } else this.on = false; }
      return sum * env * this.amp * 0.9;
    }
  }
  const mkVox = () => ({ on: false, gate: false, note: 60, type: 0, f: 440, vel: 0.7, env: 0, age: 0, pan: 0.5, relK: 0.9999, atkK: 0.001, ph: new Float64Array(6), aux: new Float64Array(8), y1: new Float64Array(6), y2: new Float64Array(6), c1: new Float64Array(6), c2: new Float64Array(6), bk: new Float64Array(6), nm: 0, bq: [new Bq(), new Bq(), new Bq()], lpA: 0, lpZ: 0, quiet: 0 });
  const FIBN = [1, 2, 3, 5, 8, 13, 21, 34];

  class Beachica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); this.rng = new Rng(0x2545F491);
      this.ph = [0.2, 0.6]; this.body = [new Bq(), new Bq()]; this.rum = [new Bq(), new Bq()]; this.foam = [new Bq(), new Bq()]; this.back = [new Bq(), new Bq()]; this.wind = [new Bq(), new Bq()]; this.rain = [new Bq(), new Bq()];
      this.swL = 0; this.swR = 0; this.crL = 0; this.crR = 0; this.bkL = 0; this.bkR = 0; this.swellMix = 0; this.backMix = 0; this.crashMix = 0; this.gust = 0.5;
      this.gulls = Array.from({ length: 4 }, () => new Gull()); this.keyGulls = Array.from({ length: 6 }, () => new Gull()); this.whales = [new Whale(), new Whale()];
      this.bubs = Array.from({ length: 40 }, () => ({ on: false, delay: 0, ph: 0, f: 800, k: 2, a: 0.2, dec: 0.999, pan: 0.5 }));
      this.pings = Array.from({ length: 64 }, () => ({ on: false, y1: 0, y2: 0, c1: 0, c2: 0, pan: 0.5, life: 0 }));
      this.crickets = Array.from({ length: 3 }, (_, i) => ({ ph: 0, fc: 4300 + 450 * i, chirp: 0.3 * i, pulse: 0, period: 0.5 + 0.09 * i, rate: 26 + 3 * i, pan: 0.3 + 0.2 * i }));
      this.gullT = 2; this.whaleT = 6; this.bubT = 0.5;
      this.voices = Array.from({ length: 16 }, mkVox); this.sb = [new Bq(), new Bq()]; this.ub = [new Bq(), new Bq()]; this.kb = [new Bq(), new Bq()]; this.sbF = 20000; this.ubF = 9000; this.kbF = 20000;
      this.age = 0; this.keysHeld = 0; this.bedGate = 1; this.lastHz = 0;
      this.fib = [Array.from({ length: 8 }, () => new Bq()), Array.from({ length: 8 }, () => new Bq())]; this.lf = new Float64Array(8); this.fw = new Float64Array(8); this.spinPh = 0; this.fibInit = false;
      this.cur = [new DelayLine(Math.floor(0.06 * sr)), new DelayLine(Math.floor(0.06 * sr))]; this.curPh = 0; this.rumPh = 0; this.rumA = Math.exp(-TWO_PI * 70 / sr); this.rumZ = 0; this.rev = new Rev(sr);
      this.wlS = 35; this.wlE = 35; this.bend = 0; this.bendS = 0; this.mw = 0; this.mwS = 0; this.expS = 1; this.tAbs = 0; this.nonFinite = 0; this.flash = 0;
      this.sh = [0, 0, 0]; this.shR = [0, 0, 0]; this.sh2 = [0, 0, 0]; this.sh3 = [0, 0, 0];
    }
    set(id, x) {
      if (id < 0 || id >= E.Count) return; this.v[id] = x;
      if (id === E.Preset) { const d = VD[clampf(Math.round(x), 0, 13)]; const put = (i, val) => { this.v[i] = val; this.writeParam(i, val); }; put(E.Attack, d[0]); put(E.Release, d[1]); put(E.Bright, d[2]); put(E.Focus, d[3]); }
    }
    allNotesOff() { for (const v of this.voices) if (v.on) v.gate = false; this.keysHeld = 0; }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.mw = m; } pressure(p) { }
    noteHz(note, extra) { const V = this.v; return 440 * Math.pow(2, (note + 12 * V[E.Octave] - 69 + (V[E.Tune] + SCALE_OFF[Math.round(V[E.Scale])][(((note - Math.round(V[E.Tonic])) % 12) + 12) % 12] + extra) / 100) / 12); }
    spawnGull(base, amp, pan, syl, pool) {
      const n = pool.length; let slot = -1; for (let i = 0; i < n; ++i) if (!pool[i].on) { slot = i; break; } if (slot < 0) slot = Math.trunc(this.rng.uni() * n) % n; pool[slot].start(base, amp, pan, syl, this.rng);
    }
    spawnBubble(f, a, pan, delay) {
      let slot = -1; for (let i = 0; i < 40; ++i) if (!this.bubs[i].on) { slot = i; break; } if (slot < 0) return; const b = this.bubs[slot];
      b.on = true; b.delay = delay; b.ph = 0; b.f = f; b.k = 1.2 + 1.5 * this.rng.uni(); b.a = a; b.pan = pan; b.dec = Math.exp(-1 / (this.sr * (9 / f)));
    }
    spawnPing(f, t60, a, pan) {
      let slot = -1; for (let i = 0; i < 64; ++i) if (!this.pings[i].on) { slot = i; break; } if (slot < 0) return; const p = this.pings[slot], sr = this.sr;
      f = Math.min(f, sr * 0.45); const w = TWO_PI * f / sr, r = Math.exp(-6.9078 / (t60 * sr)); p.on = true; p.c1 = 2 * r * Math.cos(w); p.c2 = -r * r; p.y1 = a * Math.sin(w); p.y2 = 0; p.pan = pan; p.life = Math.trunc(t60 * 1.2 * sr);
    }
    startVox(v, note, vel) {
      const V = this.v, sr = this.sr, rng = this.rng, type = clampf(Math.round(V[E.Preset]), 0, 13);
      v.on = true; v.gate = true; v.note = note; v.type = type; v.vel = vel; v.f = this.noteHz(note, this.noteTune); v.age = 0; v.env = 0; v.quiet = 0; v.nm = 0; v.lpZ = 0; v.lpA = 0;
      v.ph.fill(0); v.aux.fill(0); v.y1.fill(0); v.y2.fill(0); v.c1.fill(0); v.c2.fill(0); v.bk.fill(0); v.bq.forEach(b => { b.reset(); });
      const spr = V[E.Spread] * 0.01; v.pan = clampf(0.5 + ((note - 60) / 48) * 0.3 * spr + (rng.uni() - 0.5) * 0.25 * spr, 0.05, 0.95); ++this.age;
      v.atkK = 1 - Math.exp(-1 / (sr * 0.001 * Math.max(5, V[E.Attack]) * 0.35)); v.relK = Math.exp(-1 / (sr * 0.001 * Math.max(20, V[E.Release]) * 0.35));
      if (VD[type][4]) v.env = 1;
      const foc = V[E.Focus] * 0.01, bri = V[E.Bright] * 0.01, lpHz = hz => { v.lpA = Math.exp(-TWO_PI * hz / sr); };
      const modes = (ratio, amp, t60, tScale, strike) => {
        let k = 0; for (let j = 0; j < ratio.length; ++j) { if (k >= 6) break; const fm = v.f * ratio[j]; if (fm > sr * 0.45) { ++k; continue; }
          const w = TWO_PI * fm / sr, rr = Math.exp(-6.9078 / (Math.max(0.02, t60[j] * tScale) * sr)); v.c1[k] = 2 * rr * Math.cos(w); v.c2[k] = -rr * rr; v.bk[k] = amp[j] * ar2gain(v.c1[k], v.c2[k]); v.y1[k] = amp[j] * strike * Math.sin(w); ++k; }
        v.nm = k;
      };
      switch (type) {
        case 0: { const q = 8 + foc * 50; for (let k = 0; k < 3; ++k) v.bq[k].set(5, Math.min(v.f * (k + 1), sr * 0.4), q, sr); v.aux[0] = Math.sqrt(q * sr / (3.14159 * v.f)) * 0.25; v.aux[0] = Math.min(v.aux[0], 40); break; }
        case 1: v.bq[0].set(5, 300 + 500 * foc, 4, sr); v.bq[1].set(5, 800 + 1200 * foc, 6, sr); v.bq[2].set(3, 700 + 7000 * bri, 0.7, sr); v.ph[0] = rng.uni(); v.ph[1] = rng.uni(); v.ph[2] = rng.uni(); break;
        case 2: modes([1, PHI, PHI * PHI, PHI * PHI * PHI, PHI * PHI * PHI * PHI], [1, 0.6, 0.45, 0.3, 0.2], [2.2, 1.6, 1.2, 0.9, 0.6], 0.5 + foc, 0.5); v.aux[1] = 0.05; break;
        case 3: modes([1, 2, 3, 5, 8, 13], [1, 0.5, 0.35, 0.25, 0.15, 0.08], [3, 2.6, 2.2, 1.8, 1.4, 1], 0.5 + foc, 0.1); break;
        case 4: v.ph[0] = rng.uni(); v.ph[1] = rng.uni(); v.ph[2] = rng.uni(); v.ph[3] = rng.uni(); lpHz(120 + 900 * bri); break;
        case 5: v.ph[0] = 0; break;
        case 6: lpHz(500 + 3000 * bri); break;
        case 7: v.bq[0].set(5, 2800, 1.1, sr); break;
        case 8: this.spawnGull(clampf(v.f * 2, 500, 3200), 0.6 * vel, v.pan, 2 + Math.trunc(rng.uni() * 2.5), this.keyGulls); v.on = false; this.flash = Math.min(1.5, this.flash + 0.6); break;
        case 9: { const nb = 5 + Math.trunc(rng.uni() * 5); for (let i = 0; i < nb; ++i) this.spawnBubble(v.f * (0.8 + 0.5 * rng.uni()), 0.3 * vel * (0.5 + 0.5 * rng.uni()), clampf(v.pan + (rng.uni() - 0.5) * 0.3, 0.05, 0.95), Math.trunc(sr * (0.01 + 0.07 * i * (0.4 + rng.uni())))); v.on = false; this.flash = Math.min(1.5, this.flash + 0.6); break; }
        case 10: { const tS = 0.5 + foc; this.spawnPing(v.f, 0.35 * tS, 0.5 * vel, v.pan); this.spawnPing(v.f * 2.76, 0.2 * tS, 0.3 * vel, v.pan); this.spawnPing(v.f * 5.4, 0.12 * tS, 0.15 * vel, v.pan); this.spawnPing(Math.min(3500, v.f * 7), 0.004, 0.4 * vel, v.pan); v.on = false; this.flash = Math.min(1.5, this.flash + 0.6); break; }
        case 11: modes([1, 2.0, 2.57, 3.7, 4.9], [1, 0.55, 0.4, 0.25, 0.15], [5, 3.5, 2.8, 1.8, 1.2], 0.5 + foc, 0.6); v.aux[2] = rng.uni() * 6.28; break;
        case 12: lpHz(300 + 1500 * bri); v.ph[0] = 0; v.ph[1] = 0.3; break;
        case 13: for (let k = 0; k < 6; ++k) { v.ph[k] = rng.uni(); v.aux[k] = 0.07 + 0.25 * rng.uni(); } lpHz(400 + 4000 * bri); break;
      }
      this.flash = Math.min(1.5, this.flash + 0.3 + 0.4 * vel);
    }
    noteOn(note, vel) {
      vel = clampf(vel, 0.02, 1); this.lastHz = this.noteHz(note, 0); this.keysHeld += 1; const vs = this.voices;
      let slot = -1; for (let i = 0; i < 16; ++i) if (!vs[i].on) { slot = i; break; }
      if (slot < 0) { let low = 1e9; for (let i = 0; i < 16; ++i) { const s = vs[i].env * (vs[i].gate ? 2 : 1) / (1 + vs[i].age); if (s < low) { low = s; slot = i; } } }
      this.startVox(vs[slot], note, vel);
    }
    noteOff(note) { this.keysHeld = Math.max(0, this.keysHeld - 1); for (const v of this.voices) if (v.on && v.gate && v.note === note) v.gate = false; }
    // one key voice for one sample, added into l/r (stored in this.ol/this.or)
    stepVox(v, swell, bf, spr, br, foc, cf) {
      const sr = this.sr, dt = 1 / sr, type = v.type, oneShot = VD[type][4] === 1; v.age += dt;
      if (!oneShot) { if (v.gate) v.env += (1 - v.env) * v.atkK; else v.env *= v.relK; }
      const f = v.f * bf, rng = this.rng; let o = 0, oL = 0, oR = 0, stereo = false, age = v.age;
      switch (type) {
        case 0: { const n = rng.bi(); const s = v.bq[0].run(n) + 0.6 * v.bq[1].run(n) + 0.35 * v.bq[2].run(n); o = s * v.aux[0] * (0.25 + 0.75 * swell) * (0.4 + 0.6 * br); break; }
        case 1: {
          const vib = 1 + 0.003 * Math.sin(TWO_PI * 5 * age); let s0 = 0, s1 = 0, s2 = 0;
          for (let k = 0; k < 3; ++k) { const fk = f * vib * cf[k]; const dtp = Math.min(0.4, fk / sr); let p = v.ph[k] + dtp; if (p >= 1) p -= 1; v.ph[k] = p; const s = 2 * p - 1 - polyBlep(p, dtp); if (k === 0) s0 = s; else if (k === 1) s1 = s; else s2 = s; }
          const mid = s0 + s1 + s2; const fm = v.bq[0].run(mid) * 1.6 + v.bq[1].run(mid) * 1.2; const lpv = v.bq[2].run(mid) * 0.35; o = (fm + lpv) * 0.5; oL = o + 0.3 * lpv * (s0 - s2); oR = o - 0.3 * lpv * (s0 - s2); stereo = true; break;
        }
        case 2: case 3: case 11: {
          const x = rng.bi() * (type === 2 ? (v.gate ? 0.03 : 0) : (type === 3 ? 0.5 : 0)); let s = 0;
          for (let k = 0; k < v.nm; ++k) { const y = v.bk[k] * x + v.c1[k] * v.y1[k] + v.c2[k] * v.y2[k]; v.y2[k] = v.y1[k]; v.y1[k] = y; s += y; }
          if (type === 11) { s *= (1 + 0.12 * Math.sin(TWO_PI * 0.9 * age + v.aux[2])) * 1.5; } if (type === 3) s *= (1 + 0.1 * Math.sin(TWO_PI * 4 * age)) * 0.6; o = s * (0.4 + 0.6 * br); break;
        }
        case 4: {
          const drift = 1 + 0.0007 * Math.sin(TWO_PI * 0.07 * age); const f2 = f * drift * 1.0007, f3 = f / drift * 0.9993;
          v.ph[0] += f * 0.5 / sr; v.ph[1] += f / sr; const s0 = Math.sin(TWO_PI * v.ph[0]), s1 = Math.sin(TWO_PI * v.ph[1]);
          const d2 = Math.min(0.4, f2 / sr); v.ph[2] += d2; if (v.ph[2] >= 1) v.ph[2] -= 1; const s2 = 2 * v.ph[2] - 1 - polyBlep(v.ph[2], d2);
          const d3 = Math.min(0.4, f3 / sr); v.ph[3] += d3; if (v.ph[3] >= 1) v.ph[3] -= 1; const s3 = 2 * v.ph[3] - 1 - polyBlep(v.ph[3], d3);
          v.lpZ = v.lpA * v.lpZ + (1 - v.lpA) * (0.5 * (s2 + s3)); const saws = v.lpZ; const breathe = 0.85 + 0.15 * Math.sin(TWO_PI * 0.11 * age);
          o = (0.6 * s0 + 0.3 * s1 + 0.9 * saws) * breathe * 0.6; oL = o + 0.15 * saws * spr * 2; oR = o - 0.15 * saws * spr * 2; stereo = true; break;
        }
        case 5: {
          const fq = f * (1 + 0.012 * Math.exp(-age / 0.2)); v.ph[0] += TWO_PI * fq / sr; if (v.ph[0] > TWO_PI) v.ph[0] -= TWO_PI;
          let e = 0; // echoes at 0, 0.55, 1.3, 2.2 s
          if (age >= 0) { const a = age; e += Math.exp(-a / (0.35 + 0.5 * foc)) * (1 - Math.exp(-a / 0.003)); }
          if (age >= 0.55) { const a = age - 0.55; e += 0.4 * Math.exp(-a / (0.35 + 0.5 * foc)) * (1 - Math.exp(-a / 0.003)); }
          if (age >= 1.3) { const a = age - 1.3; e += 0.2 * Math.exp(-a / (0.35 + 0.5 * foc)) * (1 - Math.exp(-a / 0.003)); }
          if (age >= 2.2) { const a = age - 2.2; e += 0.1 * Math.exp(-a / (0.35 + 0.5 * foc)) * (1 - Math.exp(-a / 0.003)); }
          o = Math.sin(v.ph[0]) * e * 0.7; if (age > 6) v.on = false; break;
        }
        case 6: {
          const glide = 1 - 0.2 * Math.exp(-age / 0.5); const vib = 1 + 0.005 * Math.sin(TWO_PI * 0.5 * age) * Math.min(1, age) + 0.003 * Math.sin(TWO_PI * 4 * age) * Math.min(1, age * 0.5);
          const fw = f * glide * vib; v.ph[0] += TWO_PI * fw / sr; if (v.ph[0] > TWO_PI) v.ph[0] -= TWO_PI; let s = 0; const ph = v.ph[0];
          for (let h = 1; h <= 8; ++h) { if (h * fw > sr * 0.45) break; s += WH[h] * Math.sin(h * ph); }
          v.lpZ = v.lpA * v.lpZ + (1 - v.lpA) * s; o = v.lpZ * 0.9; break;
        }
        case 7: {
          const fq = f * (0.6 + 0.4 * (1 - Math.exp(-age / 0.12)) * 2.25 * 0.6 + 0.4 * 0) * (1 + 0.04 * Math.sin(TWO_PI * 7 * age)); v.ph[0] += TWO_PI * fq / sr; if (v.ph[0] > TWO_PI) v.ph[0] -= TWO_PI;
          let s = Math.sin(v.ph[0]) + 0.35 * Math.sin(2 * v.ph[0]) * br * 2 + 0.12 * Math.sin(3 * v.ph[0]);
          if (age < 0.45) { v.aux[0] -= dt; if (v.aux[0] <= 0) { v.aux[1] = 1; v.aux[0] = 1 / 45; } } v.aux[1] *= Math.exp(-1 / (sr * 0.0008)); s = s * 0.5 + v.bq[0].run(rng.bi() * v.aux[1]) * 1.4; o = s * 0.7; break;
        }
        case 12: {
          const fq = f * (1 + 0.04 * Math.exp(-age / 0.12)) * (1 + 0.002 * Math.sin(TWO_PI * 0.12 * age)); let s = 0;
          for (let k = 0; k < 2; ++k) { const dtp = Math.min(0.4, fq * (k ? 1.003 : 1) / sr); v.ph[k] += dtp; if (v.ph[k] >= 1) v.ph[k] -= 1; s += 2 * v.ph[k] - 1 - polyBlep(v.ph[k], dtp); }
          v.lpZ = v.lpA * v.lpZ + (1 - v.lpA) * (0.5 * s + 0.05 * rng.bi()); o = v.lpZ * 1.5; break;
        }
        case 13: {
          let s = 0; for (let k = 0; k < 6; ++k) { const m = MUL13[k]; if (f * m > sr * 0.45) break; v.ph[k] += f * m * (1 + ((k & 1) ? 0.0012 : -0.0008)) / sr; if (v.ph[k] >= 1) v.ph[k] -= 1; s += AMP13[k] * Math.sin(TWO_PI * v.ph[k]) * (0.55 + 0.45 * Math.sin(TWO_PI * v.aux[k] * age + k * 1.3)); }
          v.lpZ = v.lpA * v.lpZ + (1 - v.lpA) * s; o = v.lpZ * 0.45; oL = o; oR = o; stereo = true; break;
        }
      }
      if (!stereo) { oL = oR = o; }
      if (!(Math.abs(oL) < 50 && Math.abs(oR) < 50)) { v.on = false; ++this.nonFinite; return; }
      const g = v.env * (0.3 + 0.7 * v.vel) * this.expS, pl = Math.cos(v.pan * HP) * 1.414, pr = Math.sin(v.pan * HP) * 1.414;
      this.vl += oL * g * pl; this.vr += oR * g * pr;
      if (!oneShot) { if (!v.gate && v.env < 1e-4) v.on = false; } else if (v.age > 12) v.on = false;
    }
    updateFib(wlE) {
      const V = this.v, mode = Math.round(V[E.FibMode]), sr = this.sr; let eff = mode; if (mode === 0) eff = wlE > -8 ? 1 : 2; if (mode === 4) eff = 1;
      let root = V[E.FibRoot]; if (mode === 4 && this.lastHz > 0) root = clampf(this.lastHz, 60, 1200); const s = this.spinPh - Math.floor(this.spinPh), q = V[E.FibQ];
      for (let k = 0; k < 8; ++k) {
        let tf, w;
        if (eff === 1) { tf = root * Math.pow(PHI, k); w = 1 / (1 + 0.12 * k); }
        else if (eff === 2) { tf = root * 0.5 * FIBN[k]; w = 1 / (1 + 0.1 * k); }
        else { tf = root * Math.pow(PHI, k + s); const u = (k + s) / 8; w = Math.sin(3.14159 * clampf(u, 0, 1)) * 1.3; }
        tf = clampf(tf, 40, sr * 0.42); const lt = Math.log(tf);
        if (!this.fibInit) { this.lf[k] = lt; this.fw[k] = w; } else { this.lf[k] += (lt - this.lf[k]) * (eff === 3 ? 0.2 : 0.03); this.fw[k] += (w - this.fw[k]) * 0.05; }
        this.fib[0][k].set(5, Math.exp(this.lf[k]), q, sr); this.fib[1][k].cp(this.fib[0][k]);
      }
      this.fibInit = true;
    }
    shape(p, out) { p -= Math.floor(p); out[0] = p < 0.55 ? Math.pow(p / 0.55, 2.2) : Math.exp(-(p - 0.55) * 6); const x = (p - 0.58) / 0.05; out[1] = Math.exp(-x * x); out[2] = p > 0.7 ? Math.sin(3.14159 * (p - 0.7) / 0.3) : 0; }
    process(outL, outR, n) {
      const V = this.v, sr = this.sr, dt = 1 / sr, rng = this.rng, sh = this.sh, shR = this.shR; let done = 0;
      const rvMix = V[E.ReverbMix] * 0.01, vg = Math.pow(10, V[E.Volume] / 20), cu = V[E.Current] * 0.01, ts = V[E.TideSync] * 0.01, pressure = V[E.Pressure], foamK = V[E.Foam] * 0.02, backK = V[E.Backwash] * 0.02, surfPct = V[E.Surf] * 0.01, windPct = V[E.Wind] * 0.01;
      const fibQ = V[E.FibQ];
      while (done < n) {
        const blk = Math.min(32, n - done);
        this.mwS += (this.mw - this.mwS) * 0.05; this.bendS += (this.bend - this.bendS) * 0.2; this.expS += (1 - this.expS) * 0.02; const mwm = Math.round(V[E.ModWheel]), mwS = this.mwS;
        const wlT = clampf(V[E.Waterline] - (mwm === 0 ? 130 * mwS : 0), -100, 100); this.wlS += (wlT - this.wlS) * 0.01; const wlE = this.wlE = this.wlS;
        const storm = clampf(V[E.Storm] * 0.01 + (mwm === 1 ? mwS : 0), 0, 1), wsize = clampf(V[E.WaveSize] * 0.01 + (mwm === 2 ? mwS * 0.6 : 0), 0, 1), fibA = clampf(V[E.FibAmount] * 0.01 + (mwm === 3 ? mwS : 0), 0, 1);
        const brightEff = V[E.Bright]; // (the plugin lists wheel->Brightness but its code never applies it; same here)
        const depth = clampf(-wlE * 0.01, 0, 1), height = clampf(wlE * 0.01, 0, 1);
        const bob = (1 - Math.min(1, Math.abs(wlE) / 30)) * 0.3 * Math.sin(TWO_PI * (this.ph[0] + 0.1)), dEff = clampf(depth + bob, 0, 1);
        const day = Math.round(V[E.Day]), gullDay = day === 0 ? 1 : (day === 1 ? 0.7 : 0.04), cricketDay = day === 0 ? 0 : (day === 1 ? 0.25 : 1);
        if (Math.round(V[E.BedMode]) === 1) { const want = this.keysHeld > 0.5 ? 1 : 0; this.bedGate += (want - this.bedGate) * (want > this.bedGate ? 0.002 : 0.00012); } else this.bedGate += (1 - this.bedGate) * 0.01;
        const bedGate = this.bedGate;
        const surfG = 1 - 0.35 * dEff, windG = Math.pow(1 - dEff, 1.5), gullG = Math.pow(1 - dEff, 2), cricG = gullG, pebG = 1 - 0.5 * dEff, whaleG = 0.25 + 0.75 * dEff, bubG = 0.08 + 0.92 * dEff;
        const period = Math.max(3, V[E.WavePeriod]); const ph = this.ph;
        this.shape(ph[0], sh); const sw0 = sh[0], cr0 = sh[1], bk0 = sh[2]; this.shape(ph[1], sh); const sw1 = sh[0], cr1 = sh[1], bk1 = sh[2];
        this.shape(ph[0] - 0.06, shR); const swR0 = shR[0], crR0 = shR[1], bkR0 = shR[2]; this.shape(ph[1] - 0.06, shR); const swR1 = shR[0], crR1 = shR[1], bkR1 = shR[2];
        const tL = 0.65 * sw0 + 0.45 * sw1, tR = 0.65 * swR0 + 0.45 * swR1, cL = 0.65 * cr0 + 0.45 * cr1, cR = 0.65 * crR0 + 0.45 * crR1, bL = 0.65 * bk0 + 0.45 * bk1, bR = 0.65 * bkR0 + 0.45 * bkR1;
        const swellMix = this.swellMix = 0.5 * (tL + tR) * 0.9; const backMix = this.backMix = 0.5 * (bL + bR), crashMix = this.crashMix = 0.5 * (cL + cR);
        { const s = 0.5 * (tL + tR); this.body[0].set(3, 250 + 2600 * s * (0.5 + wsize) + 800 * storm, 0.7, sr); this.body[1].cp(this.body[0]); }
        this.rum[0].set(3, 90, 0.9, sr); this.rum[1].cp(this.rum[0]); this.foam[0].set(5, 4500, 0.4, sr); this.foam[1].cp(this.foam[0]); this.back[0].set(5, 1100, 0.6, sr); this.back[1].cp(this.back[0]);
        this.gust = 0.5 + 0.25 * Math.sin(this.tAbs * 0.31) + 0.15 * Math.sin(this.tAbs * 0.77 + 1) + 0.1 * Math.sin(this.tAbs * 1.9 + 2); const gu = clampf(this.gust * (1 + 1.5 * storm), 0.1, 2);
        const wfc = 280 + 800 * gu + 400 * storm; this.wind[0].set(5, wfc, 1.3, sr); this.wind[1].cp(this.wind[0]); const windComp = Math.sqrt(1.3 * sr / (3.14159 * wfc)) * 0.3;
        this.rain[0].set(4, 4000, 0.7, sr); this.rain[1].cp(this.rain[0]);
        const sbT = 20000 * Math.pow(10, -2 * dEff), ubT = 9000 - 4500 * dEff, kbT = 20000 * Math.pow(10, -1.3 * dEff) * (0.35 + 0.65 * (0.4 + 0.6 * Math.min(1, brightEff * 0.02)));
        this.sbF += (sbT - this.sbF) * 0.2; this.ubF += (ubT - this.ubF) * 0.2; this.kbF += (kbT - this.kbF) * 0.2;
        this.sb[0].set(3, this.sbF, 0.7, sr); this.sb[1].cp(this.sb[0]); this.ub[0].set(3, this.ubF, 0.7, sr); this.ub[1].cp(this.ub[0]); this.kb[0].set(3, this.kbF, 0.7, sr); this.kb[1].cp(this.kb[0]);
        this.spinPh += dt * blk * V[E.FibSpin]; if (fibA > 0.001) this.updateFib(wlE);
        const gl = V[E.Gulls] * 0.01, wh = V[E.Whales] * 0.01, bu = V[E.Bubbles] * 0.01, pe = V[E.Pebbles] * 0.01, ni = V[E.Night] * 0.01;
        this.gullT -= dt * blk; if (this.gullT <= 0) { this.gullT = (2.5 + 6.5 * rng.uni()) / (0.3 + 1.5 * gl); if (gl * gullG * gullDay > 0.02) this.spawnGull(1100 + 700 * rng.uni(), 0.5 * gl * gullG * gullDay * (0.4 + 0.6 * rng.uni()), 0.15 + 0.7 * rng.uni(), 1 + Math.trunc(rng.uni() * 4), this.gulls); }
        this.whaleT -= dt * blk; if (this.whaleT <= 0) { this.whaleT = (12 + 18 * rng.uni()) / (0.4 + 1.5 * wh); if (wh * whaleG > 0.02) { for (const w of this.whales) if (!w.on) { const a = 0.5 * wh * whaleG, p = 0.15 + 0.7 * rng.uni(); if (rng.uni() < 0.8) w.startSong(rng, a, p, 3 + Math.trunc(rng.uni() * 3)); else w.startClicks(rng, a, p, sr); break; } } }
        const bubRate = (0.3 + 22 * dEff + 5 * storm * height) * (0.2 + bu * 1.6); this.bubT -= dt * blk;
        if (this.bubT <= 0) { this.bubT = -Math.log(Math.max(1e-4, rng.uni())) / Math.max(0.05, bubRate); if (bu * bubG > 0.01) this.spawnBubble(Math.exp(Math.log(350) + Math.log(10) * rng.uni()), 0.25 * bu * (0.3 + 0.7 * rng.uni()) * (0.3 + 0.7 * bubG), rng.uni(), 0); }
        const pebRate = 160 * (backMix * 0.9 + crashMix * 0.5) * pe * (0.3 + 0.7 * wsize) * pebG, pebP = pebRate * dt;
        const surfLvl0 = surfPct * (1 + 0.8 * storm) * surfG, sz = 0.3 + 1.2 * wsize, swellK = (1 - ts) + ts * (0.3 + 0.7 * Math.min(1, swellMix * 1.2)), swellV = Math.min(1, swellMix * 1.2);
        const spr = V[E.Spread] * 0.01, br = V[E.Bright] * 0.01, foc = V[E.Focus] * 0.01, bf = Math.pow(2, this.bendS * 2 / 12);
        const cf = [Math.pow(2, -(2 + 18 * spr) / 1200), 1, Math.pow(2, (2 + 18 * spr) / 1200)];
        let gAct = 0; for (const g of this.gulls) if (g.on) gAct += 1; let wAct = 0; for (const w of this.whales) if (w.on) wAct += 1; // (activity meters of the window are not exposed)
        const useGull = gullG, bodyE = this.body, rumE = this.rum, foamE = this.foam, backE = this.back, windE = this.wind, rainE = this.rain;
        const cricketOn = cricketDay * ni * cricG > 0.002, voices = this.voices, gulls = this.gulls, keyGulls = this.keyGulls, whales = this.whales, bubs = this.bubs, pings = this.pings;
        const rainK = 0.25 * storm * Math.min(1, 0.3 + windG) * (1 - 0.5 * dEff), windK = windPct * gu * windG * 0.5 * windComp;
        for (let j = 0; j < blk; ++j) {
          const i = done + j;
          this.swL += (tL - this.swL) * 0.01; this.swR += (tR - this.swR) * 0.01; this.crL += (cL - this.crL) * 0.01; this.crR += (cR - this.crR) * 0.01; this.bkL += (bL - this.bkL) * 0.01; this.bkR += (bR - this.bkR) * 0.01;
          let sbL = 0, sbR = 0, ubL = 0, ubR = 0;
          for (let c = 0; c < 2; ++c) {
            const sw = c ? this.swR : this.swL, cr = c ? this.crR : this.crL, bk = c ? this.bkR : this.bkL;
            const body = bodyE[c].run(rng.bi()) * 1.4 * Math.pow(sw, 0.9) * sz, rum = rumE[c].run(rng.bi()) * 8 * (0.5 * sw * sw + cr) * sz, foam = foamE[c].run(rng.bi()) * 0.9 * (cr + 0.3 * sw * sw * sw) * foamK * sz,
              back = backE[c].run(rng.bi()) * 1.6 * bk * backK * (0.4 + 0.6 * sz);
            let s = (body + rum + foam + back) * surfLvl0; s += windE[c].run(rng.bi()) * windK; s += rainE[c].run(rng.bi()) * rainK;
            if (c) sbR = s; else sbL = s;
          }
          for (let q = 0; q < 4; ++q) { const g = gulls[q]; if (g.on) { const y = g.step(sr, rng); sbL += y * Math.cos(g.pan * HP) * useGull; sbR += y * Math.sin(g.pan * HP) * useGull; } }
          for (let q = 0; q < 6; ++q) { const g = keyGulls[q]; if (g.on) { const y = g.step(sr, rng); sbL += y * Math.cos(g.pan * HP); sbR += y * Math.sin(g.pan * HP); } }
          if (cricketOn) for (const k of this.crickets) {
            k.chirp += dt / k.period; if (k.chirp >= 1) k.chirp -= 1; let p = 0; if (k.chirp < 0.35) { k.pulse += k.rate * dt; const f = k.pulse - Math.floor(k.pulse); p = Math.sin(3.14159 * f); p *= p; } k.ph += TWO_PI * k.fc / sr; if (k.ph > TWO_PI) k.ph -= TWO_PI;
            const y = Math.sin(k.ph) * p * 0.05 * cricketDay * ni * cricG; sbL += y * Math.cos(k.pan * HP); sbR += y * Math.sin(k.pan * HP);
          }
          if (pebP > 0 && rng.uni() < pebP) this.spawnPing(700 + 4300 * rng.uni() * rng.uni(), 0.006 + 0.012 * rng.uni(), 0.25 * (0.3 + 0.7 * rng.uni()), rng.uni());
          for (let q = 0; q < 64; ++q) { const p = pings[q]; if (!p.on) continue; const y = p.c1 * p.y1 + p.c2 * p.y2; p.y2 = p.y1; p.y1 = y; if (--p.life <= 0) p.on = false; if (p.life > 0 && p.c1 !== 0 && Math.abs(p.y1) < 1e-6 && Math.abs(p.y2) < 1e-6) p.on = false; sbL += y * Math.cos(p.pan * HP); sbR += y * Math.sin(p.pan * HP); }
          for (let q = 0; q < 2; ++q) { const w = whales[q]; if (w.on) { const y = w.step(sr, rng) * whaleG; ubL += y * Math.cos(w.pan * HP); ubR += y * Math.sin(w.pan * HP); } }
          for (let q = 0; q < 40; ++q) { const b = bubs[q]; if (!b.on) continue; if (b.delay > 0) { --b.delay; continue; } const y = Math.sin(b.ph) * b.a; b.ph += TWO_PI * b.f / sr; if (b.ph > TWO_PI) b.ph -= TWO_PI; b.f *= 1 + b.k * dt * 3; b.a *= b.dec; if (b.a < 1e-4 || b.f > sr * 0.4) b.on = false; ubL += y * Math.cos(b.pan * HP); ubR += y * Math.sin(b.pan * HP); }
          this.vl = 0; this.vr = 0; for (let q = 0; q < 16; ++q) { const v = voices[q]; if (v.on) this.stepVox(v, swellV, bf, spr, br, foc, cf); }
          let mL = this.sb[0].run(sbL * bedGate) + this.ub[0].run(ubL * bedGate) + this.kb[0].run(this.vl * swellK), mR = this.sb[1].run(sbR * bedGate) + this.ub[1].run(ubR * bedGate) + this.kb[1].run(this.vr * swellK);
          if (dEff > 0.02 && pressure > 0.5) { this.rumPh += 41 * dt; if (this.rumPh > 1) this.rumPh -= 1; this.rumZ = this.rumA * this.rumZ + (1 - this.rumA) * rng.bi(); const rn = this.rumZ * 5; const pr = (Math.sin(TWO_PI * this.rumPh) * 0.5 + rn * 0.25) * pressure * 0.01 * dEff * dEff * 0.22 * (0.8 + 0.2 * Math.sin(TWO_PI * 0.13 * this.tAbs)); mL += pr; mR += pr; }
          if (fibA > 0.001) { const comp = 0.9 * Math.sqrt(fibQ * 0.1); let wl = 0, wr = 0; const f0 = this.fib[0], f1 = this.fib[1], fw = this.fw; for (let k = 0; k < 8; ++k) { wl += fw[k] * f0[k].run(mL); wr += fw[k] * f1[k].run(mR); } mL = mL * (1 - 0.5 * fibA) + wl * fibA * comp; mR = mR * (1 - 0.5 * fibA) + wr * fibA * comp; }
          this.cur[0].push(mL); this.cur[1].push(mR);
          if (cu > 0.001) { this.curPh += dt * 0.27; if (this.curPh > 1) this.curPh -= 1; const dl = (8 + 5 * Math.sin(TWO_PI * this.curPh)) * 0.001 * sr, dr = (8 + 5 * Math.sin(TWO_PI * this.curPh * 1.31 + 1.7)) * 0.001 * sr; const mixc = cu * (0.25 + 0.35 * dEff); mL = mL * (1 - mixc * 0.5) + this.cur[0].read(dl) * mixc; mR = mR * (1 - mixc * 0.5) + this.cur[1].read(dr) * mixc; }
          let oL = mL, oR = mR;
          if (rvMix > 0.001) { const x = (mL + mR) * 0.015, fb = 0.7 + 0.28 * (V[E.ReverbSize] * 0.01) + 0.02 * dEff, dm = 0.35 + 0.3 * dEff; const wl2 = this.rev.tick(0, x, fb, dm), wr2 = this.rev.tick(1, x, fb, dm); oL = mL * (1 - rvMix * 0.3) + wl2 * 3 * rvMix; oR = mR * (1 - rvMix * 0.3) + wr2 * 3 * rvMix; }
          oL = Math.tanh(oL * vg * 0.9) * 1.15; oR = Math.tanh(oR * vg * 0.9) * 1.15;
          if (!(oL - oL === 0) || !(oR - oR === 0)) { ++this.nonFinite; oL = oR = 0; }
          outL[i] = oL; outR[i] = oR;
        }
        for (let j = 0; j < 2; ++j) { ph[j] += blk * dt / (period * (j ? 1.31 : 1)); if (ph[j] >= 1) ph[j] -= 1; }
        this.tAbs += blk * dt; done += blk;
      }
      this.flash *= Math.exp(-n / (0.35 * sr));
    }
  }
  const MUL13 = [1, 2, 3, 4, 6, 8], AMP13 = [1, 0.6, 0.4, 0.3, 0.2, 0.12];
  OCC.engines.beachica = { name: 'Beachica', blurb: 'The shore and the sea, modelled: surf, wind, gulls, whales, bubbles and 14 playable voices. The Waterline slider moves from sand through the surface to the deep; Shell/coral adds golden-ratio and Fibonacci resonators. Preset picks the key voice (and loads its attack, release, brightness and focus). The bed plays by itself unless Bed is set to With keys.', specs, groups, make: sr => new Beachica(sr), E };
})();
/* Percussica - modal percussion, 49 instruments: tuned bars and bells, skin drums, hand percussion, cymbals and gongs, plus a drum kit and a world kit.
   Every sound is a bank of resonators struck by a mallet pulse and/or bursts of noise. Port of plugins/percussica/percussica.h (Biquad/Rng from dsp.h, Rev from avoidica.h, scale offsets from scales.h). */
(function () {
  const E = {}; ['Preset', 'Volume', 'Articulation', 'Layers', 'Spread', 'Strike', 'Position', 'Damping', 'Size', 'Resonance', 'Noise', 'Snare', 'Bend', 'BendTime', 'Motor', 'MotorRate', 'Rub', 'Roll', 'RollRate', 'Flam', 'Humanize',
    'VelCurve', 'ModWheel', 'BendRange', 'Release', 'Choke', 'Bright', 'Body', 'Scale', 'Tonic', 'Tune', 'Octave', 'ReverbMix', 'ReverbSize', 'Count'].forEach((n, i) => E[n] = i);
  const NAMES = ['Marimba', 'Xylophone', 'Vibraphone', 'Glockenspiel', 'Tubular bells', 'Kalimba', 'Steel pan', 'Gender', 'Saron', 'Bonang', 'Handbell', 'Crotales',
    'Timpani', 'Taiko', 'Tom', 'Djembe', 'Conga', 'Bongo', 'Tabla', 'Bayan', 'Frame drum', 'Dhol', 'Cajon', 'Darbuka', 'Talking drum',
    'Kick', 'Snare', 'Side stick', 'Clap', 'Hi-hat closed', 'Hi-hat open', 'Hi-hat pedal', 'Crash', 'Ride', 'China', 'Cowbell', 'Tambourine', 'Shaker', 'Claves', 'Woodblock', 'Triangle', 'Cabasa', 'Guiro', 'Gong', 'Singing bowl',
    'Wind chimes', 'Splash', 'Drum kit', 'World kit'];
  const SCALES = ['12-tone equal', 'Just (Shuddha)', 'Raga Bhairav', 'Raga Yaman', 'Raga Todi', 'Raga Kafi', 'Pythagorean', 'Chinese pentatonic', 'Japanese In', 'Maqam Rast', 'Maqam Bayati', 'Maqam Hijaz', 'Slendro-ish', 'Mongolian pentatonic'];
  const JI = [0, 11.7, 3.9, 15.6, -13.7, -2.0, -9.8, 2.0, 13.7, -15.6, 17.6, -11.7];
  const SCALE_OFF = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], JI, JI, JI, JI, JI, [0, -9.8, 3.9, -5.9, 7.8, -2.0, 11.7, 2.0, -7.8, 5.9, -3.9, 9.8], [0, 0, 3.9, 0, 7.8, 0, 0, 2.0, 0, 5.9, 0, 0], [0, 0, 0, 0, 0, 0, 0, 2.0, 0, 0, 0, 0],
    [0, 0, 0, 50, 0, 0, 0, 0, 0, 0, 50, 0], [0, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 40, 0, 0, -20, 0, 20, 0, 0, -40, 0], [0, 0, 3.9, 0, -13.7, 0, 0, 2.0, 0, -15.6, 0, 0]];
  const KA = 47, KB = 48, kHits = 48, kModes = 28;
  // the defaults of the parameters that an instrument loads are those of the first instrument (Marimba)
  const specs = [
    P('Preset', '', 0, 48, 0, '%.0f', false, NAMES),
    P('Volume', 'dB', -24, 12, 0, '%.1f dB'), P('Articulation', '', 0, 4, 0, '%.0f', false, ['Open', 'Edge / slap', 'Muted', 'Rim / ping', 'Brush']), P('Layers', '', 0, 2, 0, '%.0f', false, ['Single', 'Pair', 'Ensemble 4']),
    P('Spread', '%', 0, 100, 35, '%.0f %%'), P('Strike', '%', 0, 100, 45, '%.0f %%'), P('Position', '%', 0, 100, 50, '%.0f %%'), P('Damping', '%', 0, 100, 50, '%.0f %%'),
    P('Size', '%', -100, 100, 0, '%.0f %%'), P('Resonance', '%', 0, 100, 60, '%.0f %%'), P('Stick noise', '%', 0, 100, 14, '%.0f %%'), P('Snare wires', '%', 0, 100, 0, '%.0f %%'),
    P('Pitch bend', 'cents', -1200, 2400, 0, '%.0f c'), P('Bend time', 'ms', 5, 600, 80, '%.0f ms', true), P('Motor depth', '%', 0, 100, 0, '%.0f %%'), P('Motor rate', 'Hz', 0.5, 12, 5, '%.1f Hz'),
    P('Rub', '%', 0, 100, 0, '%.0f %%'), P('Roll', '', 0, 1, 0, '%.0f', false, ['Off', 'Roll on hold']), P('Roll rate', 'Hz', 4, 40, 16, '%.0f Hz'), P('Flam', 'ms', 0, 60, 0, '%.0f ms'),
    P('Humanize', '%', 0, 100, 30, '%.0f %%'), P('Velocity', '', 0, 2, 1, '%.0f', false, ['Soft', 'Linear', 'Hard']), P('Mod wheel', '', 0, 3, 0, '%.0f', false, ['Damping', 'Position', 'Strike', 'Pitch bend']),
    P('Bend range', 'st', 1, 12, 2, '%.0f st'), P('Release', 'ms', 10, 4000, 220, '%.0f ms', true), P('Choke', '', 0, 1, 1, '%.0f', false, ['Off', 'Hi-hat groups']),
    P('Brightness', '%', 0, 100, 60, '%.0f %%'), P('Body', '%', 0, 100, 50, '%.0f %%'),
    P('Scale', '', 0, 13, 0, '%.0f', false, SCALES), P('Tonic', '', 0, 11, 0, '%.0f', false, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']),
    P('Tune', 'cents', -50, 50, 0, '%.0f c'), P('Octave', '', -2, 2, 0, '%.0f'), P('Reverb mix', '%', 0, 100, 18, '%.0f %%'), P('Reverb size', '%', 0, 100, 45, '%.0f %%'),
  ];
  const groups = [
    ['Strike', [E.Articulation, E.Strike, E.Position, E.Damping, E.Size, E.Resonance, E.Noise, E.Snare]],
    ['Player', [E.Layers, E.Spread, E.Humanize, E.VelCurve, E.Flam, E.Roll, E.RollRate, E.Choke]],
    ['Pitch and motion', [E.Bend, E.BendTime, E.BendRange, E.Motor, E.MotorRate, E.Rub, E.ModWheel]],
    ['Tuning', [E.Scale, E.Tonic, E.Tune, E.Octave]],
    ['Output', [E.Volume, E.Release, E.Bright, E.Body, E.ReverbMix, E.ReverbSize]],
  ];
  // ---- the instrument table. kind: 0 bars and bells (a set of mode ratios), 1 skin (membrane modes), 2 metal (generated, inharmonic), 3 noise-driven
  const TABLE = [];
  function A(name, o, r, a) {
    const d = Object.assign({ name, kind: 0, pitched: false, f0: 440, baseNote: 60, track: 0, nm: 0, r: new Float64Array(12), a: new Float64Array(12), t0: 1, dexp: 0.8, beat: 0, shell: 0, pulseAmp: 1, nb: 0, sp: 0, atk: 3, dec: 80, nzAmp: 0,
      strike: 50, pos: 50, damp: 50, res: 40, noise: 15, snare: 0, bend: 0, bendMs: 80, motor: 0, rel: 800, choke: 0, pan: 0.5, gain: 1, hp: 40, lp: 16000, gen: 0, gLo: 0, gHi: 0, gPw: 1, gSeed: 1 }, o);
    if (r) { d.nm = Math.min(12, r.length); for (let i = 0; i < d.nm; ++i) d.r[i] = r[i]; let i = 0; for (; i < Math.min(12, a.length); ++i) d.a[i] = a[i]; for (; i < d.nm; ++i) d.a[i] = d.a[i - 1] * 0.6; }
    TABLE.push(d);
  }
    A("Marimba",{kind:0, pitched:true, t0:2.0, dexp:0.9, strike:45, res:60, damp:50, rel:220, noise:14, shell:0.5, pan:0.5, gain:1.1, hp:50, lp:9000},[1, 4.0, 9.9, 16.5],[1, 0.42, 0.16, 0.06]);
    A("Xylophone",{kind:0, pitched:true, t0:0.9, dexp:0.9, strike:75, res:35, rel:150, noise:20, gain:1.0, hp:120, lp:14000},[1, 3.0, 6.2, 10.4],[1, 0.55, 0.28, 0.12]);
    A("Vibraphone",{kind:0, pitched:true, t0:5.5, dexp:0.55, strike:40, res:55, rel:600, noise:10, motor:55, gain:1.05, hp:80, lp:11000},[1, 3.99, 9.6],[1, 0.35, 0.10]);
    A("Glockenspiel",{kind:0, pitched:true, t0:3.0, dexp:0.5, strike:80, rel:400, noise:18, hp:400, lp:16000, gain:0.9},[1, 2.76, 5.40, 8.93],[1, 0.5, 0.3, 0.15]);
    A("Tubular bells",{kind:0, pitched:true, t0:7.0, dexp:0.45, strike:70, rel:1500, noise:12, hp:100, lp:12000, gain:0.9},[1, 2.02, 3.12, 4.31, 5.9, 7.6],[1, 0.7, 0.55, 0.4, 0.25, 0.12]);
    A("Kalimba",{kind:0, pitched:true, t0:1.6, dexp:0.6, strike:55, res:60, rel:600, noise:10, shell:0.4, hp:150, lp:9000, gain:1.2},[1, 6.27, 17.5],[1, 0.20, 0.04]);
    A("Steel pan",{kind:0, pitched:true, t0:1.9, dexp:0.6, strike:55, rel:800, noise:12, hp:150, lp:8000, gain:0.95},[1, 1.004, 2.0, 2.007, 3.0, 4.012, 5.1],[1, 0.7, 0.6, 0.4, 0.35, 0.2, 0.1]);
    A("Gender",{kind:0, pitched:true, beat:5.5, t0:4.0, dexp:0.55, strike:35, res:60, rel:500, noise:8, hp:100, lp:7000, gain:1.0},[1, 2.4, 5.6],[1, 0.45, 0.18]);
    A("Saron",{kind:0, pitched:true, t0:1.4, dexp:0.7, strike:60, rel:250, noise:16, hp:150, lp:9000, gain:1.0},[1, 2.76, 5.4, 8.9],[1, 0.4, 0.2, 0.1]);
    A("Bonang",{kind:0, pitched:true, beat:3.0, t0:2.6, dexp:0.6, strike:50, rel:700, noise:10, hp:150, lp:8000, gain:1.0},[1, 1.42, 2.2, 2.9, 3.6],[1, 0.6, 0.4, 0.25, 0.15]);
    A("Handbell",{kind:0, pitched:true, beat:1.2, t0:3.5, dexp:0.5, strike:65, rel:1200, noise:10, hp:300, lp:14000, gain:0.9},[1, 2.0, 2.4, 3.0, 4.1],[1, 0.6, 0.4, 0.3, 0.15]);
    A("Crotales",{kind:0, pitched:true, t0:6.0, dexp:0.4, strike:85, rel:1500, noise:12, hp:800, lp:18000, gain:0.75},[1, 2.76, 5.4, 8.9],[1, 0.5, 0.3, 0.15]);
    A("Timpani",{kind:1, pitched:true, t0:2.8, dexp:0.7, shell:0.3, strike:40, res:50, bend:60, bendMs:120, rel:2500, noise:10, hp:30, lp:7000, gain:1.3},[1, 1.5, 1.99, 2.44, 2.89],[1, 0.7, 0.45, 0.3, 0.15]);
    A("Taiko",{kind:1, pitched:true, t0:1.5, dexp:0.85, shell:0.7, strike:55, pos:55, res:60, bend:-60, bendMs:90, rel:1500, noise:22, hp:28, lp:6500, gain:1.4});
    A("Tom",{kind:1, pitched:true, t0:1.0, dexp:0.9, shell:0.5, strike:55, res:55, bend:160, bendMs:60, rel:1200, noise:24, hp:40, lp:9000, gain:1.3});
    A("Djembe",{kind:1, pitched:true, t0:0.55, dexp:1.0, shell:0.8, strike:60, pos:45, res:55, bend:80, bendMs:50, rel:600, noise:30, hp:40, lp:9000, gain:1.3});
    A("Conga",{kind:1, pitched:true, t0:0.7, dexp:1.0, shell:0.6, strike:55, pos:40, res:55, bend:60, bendMs:45, rel:700, noise:26, hp:60, lp:8500, gain:1.2});
    A("Bongo",{kind:1, pitched:true, t0:0.28, dexp:1.0, shell:0.2, strike:70, pos:35, res:40, bend:40, bendMs:30, rel:300, noise:30, hp:120, lp:11000, gain:1.1});
    A("Tabla",{kind:1, pitched:true, t0:1.1, dexp:0.5, shell:0.0, strike:65, pos:25, res:30, bend:0, rel:700, noise:20, hp:100, lp:11000, gain:1.1},[1, 2.0, 3.0, 4.0, 5.0, 6.0],[1, 0.7, 0.5, 0.3, 0.2, 0.1]);
    A("Bayan",{kind:1, pitched:true, t0:1.0, dexp:0.9, shell:0.6, strike:40, pos:60, res:60, bend:-350, bendMs:260, rel:1200, noise:16, hp:40, lp:6000, gain:1.3});
    A("Frame drum",{kind:1, pitched:true, t0:0.9, dexp:0.8, shell:0.2, strike:45, pos:45, res:40, bend:30, bendMs:60, rel:900, noise:22, hp:60, lp:8000, gain:1.1});
    A("Dhol",{kind:1, pitched:true, t0:0.9, dexp:0.9, shell:0.6, strike:60, pos:55, res:55, bend:90, bendMs:55, rel:800, noise:28, snare:12, hp:40, lp:9500, gain:1.3});
    A("Cajon",{kind:1, pitched:true, t0:0.28, dexp:1.0, shell:0.9, strike:60, pos:50, res:65, bend:30, bendMs:30, rel:300, noise:38, snare:18, hp:45, lp:9000, gain:1.4},[1, 1.9, 2.7, 3.9, 5.2],[1, 0.6, 0.4, 0.25, 0.12]);
    A("Darbuka",{kind:1, pitched:true, t0:0.55, dexp:1.0, shell:0.45, strike:62, pos:40, res:50, bend:70, bendMs:40, rel:500, noise:26, hp:70, lp:11000, gain:1.15});
    A("Talking drum",{kind:1, pitched:true, t0:0.9, dexp:0.6, shell:0.3, strike:45, res:40, bend:0, rel:900, noise:14, hp:60, lp:7000, gain:1.2},[1, 2.0, 3.0, 4.0],[1, 0.5, 0.3, 0.15]);
    A("Kick",{kind:1, pitched:false, f0:58, baseNote:36, track:0.15, t0:0.45, dexp:1.1, shell:0.9, strike:45, pos:70, res:70, bend:700, bendMs:38, rel:600, noise:38, hp:25, lp:8000, gain:1.6, pan:0.5});
    A("Snare",{kind:1, pitched:false, f0:190, baseNote:38, track:0.1, t0:0.22, dexp:1.0, shell:0.4, strike:62, pos:55, res:40, bend:120, bendMs:24, rel:400, noise:36, snare:62, hp:70, lp:14000, gain:1.3, pan:0.48});
    A("Side stick",{kind:0, pitched:false, f0:1700, baseNote:37, track:0.1, t0:0.06, dexp:0.7, strike:90, rel:100, noise:55, hp:400, lp:12000, gain:1.1},[1, 1.9, 3.3],[1, 0.7, 0.4]);
    A("Clap",{kind:3, pitched:false, f0:1200, baseNote:39, track:0.05, t0:0.03, dexp:0.2, pulseAmp:0, nb:4, sp:9, atk:0.5, dec:130, nzAmp:1.8, rel:200, hp:400, lp:9000, gain:1.0},[1, 2.0, 3.2],[1, 0.7, 0.4]);
    A("Hi-hat closed",{kind:2, pitched:false, f0:1, baseNote:42, track:0.0, gen:1, nm:20, gLo:3200, gHi:12500, gPw:1.2, gSeed:3, t0:0.07, dexp:0.3, strike:75, nb:1, atk:1, dec:35, nzAmp:0.5, choke:1, rel:60, noise:8, hp:600, lp:18000, gain:0.8, pan:0.62});
    A("Hi-hat open",{kind:2, pitched:false, f0:1, baseNote:46, track:0.0, gen:1, nm:22, gLo:3000, gHi:12500, gPw:1.2, gSeed:3, t0:0.9, dexp:0.35, strike:70, nb:1, atk:3, dec:220, nzAmp:0.55, choke:1, rel:120, noise:8, hp:600, lp:18000, gain:0.75, pan:0.62});
    A("Hi-hat pedal",{kind:2, pitched:false, f0:1, baseNote:44, track:0.0, gen:1, nm:16, gLo:2600, gHi:11000, gPw:1.2, gSeed:3, t0:0.05, dexp:0.3, strike:40, nb:1, atk:1, dec:22, nzAmp:0.3, choke:1, rel:40, noise:4, hp:500, lp:12000, gain:0.7, pan:0.62});
    A("Crash",{kind:2, pitched:false, f0:1, baseNote:49, track:0.0, gen:1, nm:26, gLo:350, gHi:12000, gPw:1.3, gSeed:7, t0:2.6, dexp:0.4, strike:70, nb:1, atk:12, dec:380, nzAmp:0.7, rel:1500, noise:10, hp:300, lp:18000, gain:0.7, pan:0.3});
    A("Ride",{kind:2, pitched:false, f0:1, baseNote:51, track:0.0, gen:1, nm:24, gLo:500, gHi:11000, gPw:1.4, gSeed:11, t0:3.2, dexp:0.35, strike:60, nb:1, atk:18, dec:200, nzAmp:0.35, rel:2000, noise:10, hp:350, lp:16000, gain:0.65, pan:0.72});
    A("China",{kind:2, pitched:false, f0:1, baseNote:52, track:0.0, gen:1, nm:24, gLo:260, gHi:9500, gPw:1.0, gSeed:19, t0:1.6, dexp:0.3, strike:80, nb:1, atk:6, dec:300, nzAmp:1.1, rel:1000, noise:14, hp:250, lp:16000, gain:0.7, pan:0.78});
    A("Cowbell",{kind:0, pitched:false, f0:560, baseNote:56, track:0.2, t0:0.4, dexp:0.3, strike:80, rel:250, noise:20, hp:300, lp:7000, gain:1.0},[1, 1.504, 2.74],[1, 0.9, 0.25]);
    A("Tambourine",{kind:2, pitched:false, f0:1, baseNote:54, track:0.0, gen:1, nm:12, gLo:4200, gHi:10500, gPw:1.0, gSeed:23, t0:0.32, dexp:0.2, strike:60, nb:3, sp:11, atk:1, dec:60, nzAmp:0.9, rel:300, noise:8, hp:1000, lp:17000, gain:0.8});
    A("Shaker",{kind:3, pitched:false, f0:5200, baseNote:70, track:0.0, t0:0.012, dexp:0.1, pulseAmp:0, nb:2, sp:62, atk:12, dec:55, nzAmp:3.0, rel:100, hp:1800, lp:14000, gain:1.0},[1, 1.5],[1, 0.6]);
    A("Claves",{kind:0, pitched:false, f0:2400, baseNote:75, track:0.2, t0:0.09, dexp:0.5, strike:85, rel:100, noise:20, hp:600, lp:9000, gain:1.1},[1, 2.3],[1, 0.3]);
    A("Woodblock",{kind:0, pitched:false, f0:1050, baseNote:76, track:0.3, t0:0.13, dexp:0.6, strike:80, rel:150, noise:24, hp:300, lp:7000, gain:1.1},[1, 2.4, 4.6],[1, 0.5, 0.2]);
    A("Triangle",{kind:2, pitched:false, f0:1, baseNote:81, track:0.0, gen:1, nm:9, gLo:3300, gHi:13500, gPw:0.9, gSeed:29, t0:3.8, dexp:0.25, strike:85, rel:1500, noise:8, hp:1500, lp:19000, gain:1.5});
    A("Cabasa",{kind:3, pitched:false, f0:4200, baseNote:69, track:0.0, t0:0.01, dexp:0.1, pulseAmp:0, nb:5, sp:15, atk:3, dec:24, nzAmp:2.6, rel:100, hp:1800, lp:14000, gain:1.0},[1, 1.7],[1, 0.7]);
    A("Guiro",{kind:3, pitched:false, f0:2300, baseNote:73, track:0.0, t0:0.008, dexp:0.1, pulseAmp:0, nb:9, sp:17, atk:0.8, dec:9, nzAmp:3.2, rel:100, hp:900, lp:11000, gain:1.0},[1, 1.55, 2.4],[1, 0.8, 0.5]);
    A("Gong",{kind:2, pitched:false, f0:1, baseNote:48, track:0.0, gen:1, nm:24, gLo:85, gHi:4200, gPw:1.5, gSeed:31, t0:7.5, dexp:0.6, strike:35, nb:1, atk:220, dec:700, nzAmp:0.5, rel:3000, noise:6, hp:30, lp:9000, gain:1.2});
    A("Singing bowl",{kind:0, pitched:true, beat:0.7, t0:9.0, dexp:0.35, strike:25, rel:3500, noise:4, hp:150, lp:9000, gain:0.9},[1, 2.71, 5.15, 8.4],[1, 0.5, 0.25, 0.1]);
    A("Wind chimes",{kind:0, pitched:false, f0:2100, baseNote:84, track:0.6, t0:3.0, dexp:0.4, strike:80, rel:1500, noise:6, hp:800, lp:16000, gain:0.7},[1, 2.76, 5.4],[1, 0.4, 0.15]);
    A("Splash",{kind:2, pitched:false, f0:1, baseNote:55, track:0.0, gen:1, nm:20, gLo:900, gHi:13500, gPw:1.2, gSeed:37, t0:0.9, dexp:0.35, strike:78, nb:1, atk:5, dec:150, nzAmp:0.6, rel:800, noise:10, hp:600, lp:18000, gain:0.7, pan:0.7});
    A("Drum kit",{kind:1, pitched:false, f0:100, baseNote:36});
    A("World kit",{kind:1, pitched:false, f0:100, baseNote:36});
  const inst = i => TABLE[clampf(i, 0, 48)];
  const IDX = {}; TABLE.forEach((t, i) => IDX[t.name] = i);
  const hashf = (x, y) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; h = (h ^ (h >>> 16)) >>> 0; return (h & 0xFFFFFF) / 16777215; };
  const MEM = [1, 1.593, 2.136, 2.296, 2.653, 2.918, 3.156, 3.500, 3.600, 3.652], MEMM = [0, 1, 2, 0, 3, 1, 4, 2, 0, 5], MEMA = [1, 0.6, 0.45, 0.35, 0.3, 0.22, 0.18, 0.14, 0.1, 0.08];
  const TOMS = [41, 43, 45, 47, 48, 50];

  class Rng { constructor(s) { this.s = s >>> 0; } uni() { let s = this.s; s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; this.s = s; return (s >>> 8) * (1 / 16777216); } bi() { return this.uni() * 2 - 1; } }
  class Bq { // types: 1 LowShelf, 4 HighPass
    constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; }
    set(t, f, q, gdb, sr) {
      f = clampf(f, 5, sr * 0.49); q = Math.max(0.05, q); const A = Math.pow(10, gdb / 40), w = 2 * Math.PI * f / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * q); let B0, B1, B2, A0, A1, A2;
      if (t === 1) { const s = 2 * Math.sqrt(A) * al; B0 = A * ((A + 1) - (A - 1) * cw + s); B1 = 2 * A * ((A - 1) - (A + 1) * cw); B2 = A * ((A + 1) - (A - 1) * cw - s); A0 = (A + 1) + (A - 1) * cw + s; A1 = -2 * ((A - 1) + (A + 1) * cw); A2 = (A + 1) + (A - 1) * cw - s; }
      else { B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = B0; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; }
      this.b0 = B0 / A0; this.b1 = B1 / A0; this.b2 = B2 / A0; this.a1 = A1 / A0; this.a2 = A2 / A0;
    }
    run(x) { const y = this.b0 * x + this.z1; this.z1 = this.b1 * x - this.a1 * y + this.z2; this.z2 = this.b2 * x - this.a2 * y; return y; }
  }
  class Rev {
    constructor(sr) {
      const ct = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], at = [556, 441, 341, 225]; this.cb = []; this.ab = []; this.ci = []; this.cz = []; this.ai = [];
      for (let ch = 0; ch < 2; ++ch) { this.cb.push(ct.map(t => new Float32Array(Math.floor((t + ch * 23) * sr / 44100) + 1))); this.ab.push(at.map(t => new Float32Array(Math.floor((t + ch * 23) * sr / 44100) + 1))); this.ci.push(new Int32Array(8)); this.cz.push(new Float64Array(8)); this.ai.push(new Int32Array(4)); }
    }
    tick(ch, inp, fb, damp) {
      let s = 0; const cb = this.cb[ch], ci = this.ci[ch], cz = this.cz[ch], d1 = 1 - damp;
      for (let k = 0; k < 8; ++k) { const b = cb[k], i = ci[k], y = b[i]; cz[k] = y * d1 + cz[k] * damp; b[i] = inp + cz[k] * fb; ci[k] = i + 1 >= b.length ? 0 : i + 1; s += y; }
      const ab = this.ab[ch], ai = this.ai[ch];
      for (let k = 0; k < 4; ++k) { const b = ab[k], i = ai[k], bo = b[i], y = -s + bo; b[i] = s + bo * 0.5; ai[k] = i + 1 >= b.length ? 0 : i + 1; s = y; }
      return s;
    }
  }
  const mkHit = () => ({ on: false, nm: 0, inst: 0, note: 0, group: 0, startDelay: 0, held: false, live: false, c1: new Float64Array(kModes), c2: new Float64Array(kModes), bk: new Float64Array(kModes), y1: new Float64Array(kModes), y2: new Float64Array(kModes), w: new Float64Array(kModes), rr: new Float64Array(kModes),
    level: 1, pan: 0.5, pl: 0.7, pr: 0.7, age: 0, maxAge: 4, fade: 1, relK: 1, chokeK: 1, follow: 0, quiet: 0, pw: 40, pn: 0, pulseAmp: 1, eRaw: 0, eSm: 0, decK: 0.999, atkK: 0.1, nzAmp: 0, burstsLeft: 0, nextBurst: 0, spacing: 0,
    stick: 0, snare: 0, snz1: 0, snz2: 0, clk: 0, rub: 0, rubLp: 0, bendCents: 0, bendK: 0.999, bendK8: 1, curBend: 0, updC: 0, seed: 1 });

  class Percussica extends EngineBase {
    constructor(sr) {
      super(sr); this.initParams(specs); this.rng = new Rng(0x9E3779B9); this.hits = Array.from({ length: kHits }, mkHit); this.pend = []; this.rolls = Array.from({ length: 6 }, () => ({ on: false, note: 0, vel: 0.7, timer: 0, n: 0 }));
      this.eq = [[new Bq(), new Bq()], [new Bq(), new Bq()]]; this.lpz = [0, 0]; this.lpA = 0.5; this.rev = new Rev(sr); this.bend = 0; this.bendS = 0; this.mw = 0; this.mwSeen = false; this.expS = 1; this.sampleCtr = 0; this.ageCtr = 0; this.motorPh = 0; this.volG = 1; this.nonFinite = 0; this.flash = 0;
      this.configure();
    }
    set(id, x) {
      if (id < 0 || id >= E.Count) return; this.v[id] = x;
      if (id === E.Preset) { const n = inst(Math.round(x)), V = this.v; const put = (i, val) => { V[i] = val; this.writeParam(i, val); };
        put(E.Strike, n.strike); put(E.Position, n.pos); put(E.Damping, n.damp); put(E.Resonance, n.res); put(E.Noise, n.noise); put(E.Snare, n.snare); put(E.Bend, n.bend); put(E.BendTime, n.bendMs); put(E.Motor, n.motor); put(E.Release, n.rel); }
      this.configure();
    }
    pitchBend(b) { this.bend = b; } modWheel(m) { this.mw = m; this.mwSeen = true; } pressure(p) { }
    allNotesOff() { for (const r of this.rolls) r.on = false; for (const h of this.hits) if (h.on) h.relK = 0.9995; }
    configure() {
      const V = this.v, sr = this.sr;
      for (let c = 0; c < 2; ++c) { this.eq[c][0].set(1, 180, 0.7, (V[E.Body] - 50) * 0.14, sr); this.eq[c][1].set(4, 28, 0.7, 0, sr); }
      this.lpA = Math.exp(-2 * Math.PI * Math.min(1800 + 17000 * Math.pow(V[E.Bright] / 100, 1.6), sr * 0.45) / sr); this.volG = Math.pow(10, V[E.Volume] / 20);
    }
    noteHz(note, extra) { const V = this.v; return 440 * Math.pow(2, (note + 12 * V[E.Octave] - 69 + (V[E.Tune] + SCALE_OFF[Math.round(V[E.Scale])][(((note - Math.round(V[E.Tonic])) % 12) + 12) % 12] + extra) / 100) / 12); }
    pieceFor(note) {
      const cur = Math.round(this.v[E.Preset]), I = nm => IDX[nm], pc = (inst, art, nt, vel) => ({ inst, art, note: nt, vel });
      if (cur === KA) {
        switch (note) {
          case 35: case 36: return pc(I('Kick'), -1, note, 1); case 37: return pc(I('Side stick'), -1, note, 1); case 38: return pc(I('Snare'), -1, note, 1); case 40: return pc(I('Snare'), 1, note, 0.9);
          case 39: return pc(I('Clap'), -1, note, 1); case 42: return pc(I('Hi-hat closed'), -1, note, 1); case 44: return pc(I('Hi-hat pedal'), -1, note, 1); case 46: return pc(I('Hi-hat open'), -1, note, 1);
          case 49: case 57: return pc(I('Crash'), -1, note, 1); case 51: case 59: return pc(I('Ride'), -1, note, 1); case 53: return pc(I('Ride'), 3, note, 1); case 52: return pc(I('China'), -1, note, 1);
          case 55: return pc(I('Splash'), -1, note, 1); case 54: return pc(I('Tambourine'), -1, note, 1); case 56: return pc(I('Cowbell'), -1, note, 1); case 69: case 70: return pc(I('Shaker'), -1, note, 1);
          case 75: return pc(I('Claves'), -1, note, 1); case 76: case 77: return pc(I('Woodblock'), -1, note, 1); case 81: case 80: return pc(I('Triangle'), note === 80 ? 2 : -1, note, 1);
        }
        if (TOMS.indexOf(note) >= 0) return pc(I('Tom'), -1, note, 1);
        return pc(-1, -1, note, 1);
      }
      if (cur === KB) {
        switch (note) {
          case 35: case 36: return pc(I('Taiko'), -1, 39, 1); case 37: return pc(I('Frame drum'), 3, 50, 1); case 38: return pc(I('Djembe'), -1, 52, 1); case 40: return pc(I('Djembe'), 1, 57, 1); case 39: return pc(I('Clap'), -1, note, 1);
          case 41: return pc(I('Conga'), -1, 52, 1); case 43: return pc(I('Conga'), -1, 57, 1); case 45: return pc(I('Conga'), 1, 62, 1); case 47: return pc(I('Bongo'), -1, 64, 1); case 48: return pc(I('Bongo'), -1, 69, 1);
          case 50: return pc(I('Darbuka'), -1, 50, 1); case 52: return pc(I('Darbuka'), 1, 62, 1); case 53: return pc(I('Tabla'), -1, 55, 1); case 55: return pc(I('Bayan'), -1, 41, 1); case 54: return pc(I('Tambourine'), -1, note, 1);
          case 56: return pc(I('Cowbell'), -1, note, 1); case 58: return pc(I('Frame drum'), -1, 45, 1); case 60: return pc(I('Dhol'), -1, 43, 1); case 62: return pc(I('Dhol'), 1, 55, 1); case 69: case 70: return pc(I('Shaker'), -1, note, 1);
          case 73: return pc(I('Guiro'), -1, note, 1); case 75: return pc(I('Claves'), -1, note, 1); case 76: return pc(I('Woodblock'), -1, note, 1); case 81: return pc(I('Triangle'), -1, note, 1); case 84: return pc(I('Wind chimes'), -1, note, 1);
        }
        return pc(-1, -1, note, 1);
      }
      return pc(cur, -1, note, 1);
    }
    buildHit(h, instIdx, note, vel, art, player, nPl, seed) {
      const V = this.v, cur = inst(Math.round(V[E.Preset])), n = inst(instIdx), sr = this.sr, spread = V[E.Spread] * 0.01, hum = V[E.Humanize] * 0.01;
      const hr = hashf(seed, 5 + player), hr2 = hashf(seed, 9 + player), hr3 = hashf(seed, 13 + player), rng = this.rng;
      // reset the hit (h = Hit())
      h.c1.fill(0); h.c2.fill(0); h.bk.fill(0); h.y1.fill(0); h.y2.fill(0); h.w.fill(0); h.rr.fill(0);
      h.on = true; h.nm = 0; h.inst = instIdx; h.note = note; h.group = (V[E.Choke] > 0.5) ? n.choke : 0; h.startDelay = 0; h.held = false; h.live = false; h.follow = 0; h.quiet = 0; h.pn = 0; h.eRaw = 0; h.eSm = 0; h.nextBurst = 0;
      h.snz1 = 0; h.snz2 = 0; h.clk = 0; h.rubLp = 0; h.updC = 0; h.age = 0; h.seed = seed;
      const knob = (id, pieceVal, curVal) => pieceVal + (V[id] - curVal);
      let strike = clampf(knob(E.Strike, n.strike, cur.strike) * 0.01, 0, 1), pos = clampf(knob(E.Position, n.pos, cur.pos) * 0.01, 0, 1);
      let damp = knob(E.Damping, n.damp, cur.damp); const res = clampf(knob(E.Resonance, n.res, cur.res) * 0.01, 0, 1), noise = clampf(knob(E.Noise, n.noise, cur.noise) * 0.01, 0, 1);
      const snare = clampf(knob(E.Snare, n.snare, cur.snare) * 0.01, 0, 1), bend = knob(E.Bend, n.bend, cur.bend), bendMs = Math.max(5, n.bendMs * (V[E.BendTime] / Math.max(5, cur.bendMs)));
      const mwMode = Math.round(V[E.ModWheel]), mw = this.mwSeen ? this.mw : 0;
      if (mwMode === 0) damp += mw * 50; else if (mwMode === 1) pos = clampf(pos + mw * 0.5, 0, 1); else if (mwMode === 2) strike = clampf(strike + mw * 0.5, 0, 1);
      let tScale = 1, noiseExtra = 0, resScale = res;
      switch (art) {
        case 1: pos *= 0.3; strike = Math.min(1, strike + 0.2); noiseExtra = 0.15; tScale = 0.6; break;
        case 2: tScale = 0.2; resScale = 0; break;
        case 3: pos = 0.05; strike = 1; noiseExtra = 0.35; tScale = 0.5; break;
      }
      const brush = art === 4, vcm = Math.round(V[E.VelCurve]), vc = vcm === 0 ? 0.6 : (vcm === 2 ? 1.6 : 1);
      let v = Math.pow(clampf(vel, 0.02, 1), vc) * (1 + hum * 0.25 * (hr - 0.5)); v = clampf(v, 0.02, 1.2);
      h.level = n.gain * v * (0.15 + 0.85 * v);
      if (nPl > 1) h.pan = clampf(0.5 + ((player + 0.5) / nPl - 0.5) * (0.3 + 0.7 * spread) * 1.2 + (hr3 - 0.5) * 0.1 * spread, 0.05, 0.95);
      else if (n.pitched) h.pan = clampf(0.3 + 0.4 * clampf((note - 36) / 60, 0, 1), 0.2, 0.8); else h.pan = n.pan;
      h.pl = Math.cos(h.pan * 1.5708); h.pr = Math.sin(h.pan * 1.5708);
      const sizeK = Math.pow(2, V[E.Size] * 0.01 * 0.5);
      let f0 = n.pitched ? this.noteHz(note, this.noteTune) : n.f0 * Math.pow(2, (note - n.baseNote) * n.track / 12 + (V[E.Tune] + 0) / 1200 + 12 * V[E.Octave] * n.track / 12);
      f0 *= sizeK; f0 *= Math.pow(2, (nPl > 1 ? (hr - 0.5) * 2 * 10 * spread : 0) / 1200) * Math.pow(2, hum * (hr2 - 0.5) * 6 / 1200);
      const tk = Math.pow(2, (50 - damp) / 25) * tScale;
      let nm = 0; const amp = this._amp, fr = this._fr, t60 = this._t60, edge = 1 - pos;
      const push = (f, a, t) => { if (nm >= kModes || f < 15 || f > sr * 0.45) return; fr[nm] = f; amp[nm] = a; t60[nm] = t; ++nm; };
      if (n.kind === 0 || (n.kind === 1 && n.nm > 0) || (n.kind === 3 && n.nm > 0)) {
        const posD = Math.abs(pos - 0.5) * 2;
        for (let k = 0; k < n.nm; ++k) {
          let a = n.a[k]; if (n.kind === 0) a *= (k === 0 ? 1 : 0.35 + 0.65 * Math.abs(Math.sin(3.1416 * k * posD * 0.5 + 0.4 * (1 - posD))));
          else if (n.kind === 1) a *= (k === 0 ? (0.7 + 0.3 * pos) : 0.4 + 0.6 * edge);
          if (art === 3) a *= 0.3 + k / Math.max(1, n.nm - 1);
          const f = f0 * n.r[k], t = n.t0 * tk * Math.pow(Math.max(0.05, 1 / n.r[k]), n.dexp);
          push(f, a, t); if (n.beat > 0 && nm < kModes) push(f + n.beat * (k === 0 ? 1 : 1 + 0.3 * k), a * 0.8, t);
        }
      } else if (n.kind === 1) {
        for (let k = 0; k < 10; ++k) { let a = MEMA[k] * (MEMM[k] === 0 ? (0.7 + 0.3 * pos) : 0.25 + 0.75 * edge); if (art === 3) a *= 0.3 + 0.1 * k; push(f0 * MEM[k], a, n.t0 * tk * Math.pow(1 / MEM[k], n.dexp)); }
      } else if (n.kind === 2) {
        const cnt = n.nm, lo = n.gLo * sizeK, hi = n.gHi * sizeK;
        for (let k = 0; k < cnt; ++k) {
          const u = (k + hashf(n.gSeed * 17 + k, 3) * 0.9) / cnt, f = lo * Math.pow(hi / lo, Math.pow(u, n.gPw)), a = Math.pow(lo / f, 0.35) * (0.5 + 0.5 * hashf(n.gSeed * 31 + k, 7));
          const t = n.t0 * tk * (0.4 + 0.6 * hashf(n.gSeed * 13 + k, 11)) * Math.pow(lo / f, n.dexp); push(f, a * (art === 3 ? 0.4 + 1.2 * u : 1), t);
        }
      }
      if (n.shell > 0 && resScale > 0 && n.kind === 1) push(f0 * 0.55, n.shell * resScale * 0.9, 0.12 + 0.25 * tk * n.t0);
      if ((n.kind === 0 && n.shell > 0) && resScale > 0) push(f0, n.shell * resScale * 0.6, n.t0 * tk * 0.8);
      const eff = clampf(strike * (0.6 + 0.4 * v), 0, 1); h.pw = Math.max(3, sr * 0.001 * (0.25 + 4.5 * (1 - eff))); h.pulseAmp = brush ? 0.1 : n.pulseAmp;
      h.nzAmp = n.nzAmp; h.decK = Math.exp(-1 / (sr * 0.001 * Math.max(1, n.dec))); h.atkK = 1 - Math.exp(-1 / (sr * 0.001 * Math.max(0.3, n.atk)));
      h.burstsLeft = n.nb; h.spacing = sr * 0.001 * n.sp; h.nextBurst = 0; h.eRaw = 0;
      if (brush) { h.nzAmp = 0.8; h.burstsLeft = 1; h.decK = Math.exp(-1 / (sr * 0.25)); h.atkK = 1 - Math.exp(-1 / (sr * 0.05)); }
      h.stick = n.pulseAmp > 0 ? (noise + noiseExtra) : 0; h.snare = snare * (art === 2 ? 0.3 : 1); h.rub = V[E.Rub] * 0.01; h.maxAge = 0.2;
      h.nm = nm; let maxT = 0.1;
      for (let k = 0; k < nm; ++k) { const w = 2 * 3.14159265 * fr[k] / sr, r = Math.exp(-6.9078 / (Math.max(0.004, t60[k]) * sr)); h.w[k] = w; h.rr[k] = r; h.c1[k] = 2 * r * Math.cos(w); h.c2[k] = -r * r; h.bk[k] = amp[k] * Math.sin(w); maxT = Math.max(maxT, t60[k]); }
      h.maxAge = Math.min(12, maxT * 1.3 + (n.nb > 0 ? n.dec * 0.004 + n.nb * n.sp * 0.001 : 0)); if (h.rub > 0) h.maxAge = 20;
      h.bendCents = bend * (1 + 0.3 * (hr2 - 0.5) * hum); h.bendK = Math.exp(-1 / (sr * 0.001 * bendMs)); h.bendK8 = Math.pow(h.bendK, 8); h.live = n.kind === 1 || n.nm > 0; h.curBend = h.bendCents;
      h.relK = 1; h.fade = 1; h.chokeK = 1;
    }
    trigger(instIdx, note, vel, art, delay, seed, grace) {
      if (instIdx < 0) return; const V = this.v, hits = this.hits, sr = this.sr;
      const nPl = V[E.Layers] < 0.5 ? 1 : (V[E.Layers] < 1.5 ? 2 : 4);
      for (let j = 0; j < nPl; ++j) {
        let slot = -1; for (let i = 0; i < kHits; ++i) if (!hits[i].on) { slot = i; break; }
        if (slot < 0) { let low = 1e9; for (let i = 0; i < kHits; ++i) { const s = hits[i].level * hits[i].fade / (1 + hits[i].age * 2); if (s < low) { low = s; slot = i; } } }
        const h = hits[slot]; this.buildHit(h, instIdx, note, vel * (grace ? 0.45 : 1) * (nPl > 1 ? 1 / Math.sqrt(nPl) * 1.4 : 1), art, j, nPl, (seed + j * 7919) >>> 0);
        h.startDelay = delay + (nPl > 1 && j > 0 ? Math.trunc(hashf(seed, 77 + j) * V[E.Spread] * 0.01 * 0.012 * sr) : 0); h.held = true; h.age = 0;
        if (V[E.Choke] > 0.5 && h.group > 0) for (const o of hits) if (o !== h && o.on && o.group === h.group) o.chokeK = 0.9992;
      }
      this.flash = Math.min(1.5, this.flash + 0.5 + 0.5 * vel);
    }
    noteOn(note, vel) {
      const V = this.v;
      if (note >= 24 && note <= 28) { V[E.Articulation] = note - 24; this.writeParam(E.Articulation, V[E.Articulation]); return; }
      vel = clampf(vel, 0.02, 1); const pc = this.pieceFor(note); if (pc.inst < 0) return;
      const art = pc.art >= 0 ? pc.art : Math.round(V[E.Articulation]), seed = (Math.imul(note, 2654435761) ^ Math.imul(++this.ageCtr, 40503)) >>> 0;
      let vv = vel * pc.vel; const hum = V[E.Humanize] * 0.01; vv = clampf(vv * (1 + hum * 0.2 * this.rng.bi()), 0.02, 1); const flam = V[E.Flam];
      if (flam > 0.5) { this.trigger(pc.inst, pc.note, vv, art, 0, (seed ^ 0xA5A5) >>> 0, true); this.trigger(pc.inst, pc.note, vv, art, Math.trunc(this.sr * 0.001 * flam), seed, false); }
      else this.trigger(pc.inst, pc.note, vv, art, 0, seed, false);
      if (V[E.Roll] > 0.5) for (const r of this.rolls) if (!r.on) { r.on = true; r.note = note; r.vel = vv; r.timer = this.sr / Math.max(1, V[E.RollRate]); r.n = 0; break; }
    }
    noteOff(note) {
      for (const r of this.rolls) if (r.on && r.note === note) r.on = false;
      const pc = this.pieceFor(note); if (pc.inst < 0) return; const k = Math.exp(-1 / (this.sr * 0.001 * Math.max(10, this.v[E.Release])));
      for (const h of this.hits) if (h.on && h.held && h.note === note && h.inst === pc.inst) { h.held = false; h.relK = k; }
    }
    stepHit(h) {
      if (h.startDelay > 0) { --h.startDelay; return 0; }
      const sr = this.sr, rng = this.rng; h.age += 1 / sr;
      let x = 0; if (h.pn < h.pw) { x = h.pulseAmp * Math.sin(3.14159265 * h.pn / h.pw) * (1.5708 / h.pw); h.pn += 1; }
      let nz = 0;
      if (h.burstsLeft > 0 || h.eRaw > 1e-4 || h.eSm > 1e-4) {
        if (h.burstsLeft > 0 && h.nextBurst <= 0) { h.eRaw += 1; --h.burstsLeft; h.nextBurst = h.spacing * (0.8 + 0.4 * (rng.bi() * 0.5 + 0.5)); } else h.nextBurst -= 1;
        h.eRaw *= h.decK; h.eSm += (h.eRaw - h.eSm) * h.atkK; nz = rng.bi() * h.eSm * h.nzAmp * 0.12;
      }
      let rubIn = 0; if (h.rub > 0 && h.held) { h.rubLp += (rng.bi() - h.rubLp) * 0.02; rubIn = h.rubLp * h.rub * 0.5 * Math.min(1, h.age * 2); }
      const drive = x + nz + rubIn, nm = h.nm, c1 = h.c1, c2 = h.c2, y1 = h.y1, y2 = h.y2, bk = h.bk;
      if (h.live && ((h.updC++ & 7) === 0)) {
        const bw = Math.abs(h.curBend) > 0.5 || Math.abs(this.bendS) > 1e-4;
        if (bw) { const f = Math.pow(2, (h.curBend + this.bendS * this.v[E.BendRange] * 100) / 1200); for (let k = 0; k < nm; ++k) c1[k] = 2 * h.rr[k] * Math.cos(Math.min(h.w[k] * f, 3)); }
        else if (h.curBend !== 0) { for (let k = 0; k < nm; ++k) c1[k] = 2 * h.rr[k] * Math.cos(h.w[k]); h.curBend = 0; }
      }
      if (Math.abs(h.curBend) > 0.5 && (h.updC & 7) === 1) h.curBend *= h.bendK8;
      let y = 0; for (let k = 0; k < nm; ++k) { const o = bk[k] * drive + c1[k] * y1[k] + c2[k] * y2[k]; y2[k] = y1[k]; y1[k] = o; y += o; }
      y *= h.level;
      if (h.stick > 0 && h.age < 0.012) { h.clk = h.clk * 0.5 + rng.bi() * 0.5; const e = Math.exp(-h.age * 1100); y += (rng.bi() - h.clk * 0.5) * e * h.stick * 0.35 * h.level; }
      if (h.snare > 0) { h.follow += (Math.abs(y) - h.follow) * 0.01; const n1 = rng.bi(); h.snz1 += (n1 - h.snz1) * 0.55; h.snz2 += (h.snz1 - h.snz2) * 0.5; y += (h.snz1 - h.snz2) * Math.min(2.5, h.follow * 30) * h.snare * 3; }
      if (!h.held) h.fade *= h.relK; h.fade *= h.chokeK; y *= h.fade;
      h.quiet = Math.abs(y) > 2e-5 ? 0 : h.quiet + 1 / sr;
      if (!(Math.abs(y) < 30)) { h.on = false; ++this.nonFinite; return 0; }
      if (h.age > h.maxAge || h.fade < 1e-4 || (h.quiet > 0.15 && h.age > 0.1 && h.burstsLeft === 0 && !(h.rub > 0 && h.held))) h.on = false;
      return y;
    }
    process(outL, outR, n) {
      const V = this.v, sr = this.sr, rng = this.rng, hits = this.hits, rvMix = V[E.ReverbMix] * 0.01, motorD = V[E.Motor] * 0.01, motorInc = 6.2832 * V[E.MotorRate] / sr, eq = this.eq, lpz = this.lpz, lpA = this.lpA, volG = this.volG;
      const rfb = 0.7 + 0.28 * (V[E.ReverbSize] * 0.01);
      for (let i = 0; i < n; ++i) {
        this.bendS += (this.bend - this.bendS) * 0.01; this.expS += (1 - this.expS) * 0.002; const ctr = ++this.sampleCtr;
        if (ctr % 8 === 0) for (let q = 0; q < kHits; ++q) { const h = hits[q]; if (h.on && h.curBend !== 0 && h.startDelay === 0) { h.curBend *= h.bendK8; if (Math.abs(h.curBend) < 0.5) h.curBend = 0.001; } }
        for (const r of this.rolls) if (r.on) {
          r.timer -= 1;
          if (r.timer <= 0) { r.timer += (sr / Math.max(1, V[E.RollRate])) * (0.9 + 0.2 * (rng.bi() * 0.5 + 0.5)); ++r.n; const pc = this.pieceFor(r.note); if (pc.inst >= 0) this.trigger(pc.inst, pc.note, r.vel * (0.55 + 0.2 * (rng.bi() * 0.5 + 0.5)), pc.art >= 0 ? pc.art : Math.round(V[E.Articulation]), 0, (Math.imul(r.n, 2654435761) + r.note) >>> 0, false); }
        }
        let l = 0, r = 0;
        for (let q = 0; q < kHits; ++q) { const h = hits[q]; if (h.on) { const y = this.stepHit(h); l += y * h.pl; r += y * h.pr; } }
        this.motorPh += motorInc; if (this.motorPh > 6.2832) this.motorPh -= 6.2832; if (motorD > 0) { const mod = 1 - motorD * 0.5 * (1 - Math.cos(this.motorPh)) * 0.6; l *= mod; r *= mod; }
        let bl = eq[0][1].run(eq[0][0].run(l)), br = eq[1][1].run(eq[1][0].run(r)); lpz[0] = bl * (1 - lpA) + lpz[0] * lpA; bl = lpz[0]; lpz[1] = br * (1 - lpA) + lpz[1] * lpA; br = lpz[1];
        let oL = bl * volG * this.expS * 0.9, oR = br * volG * this.expS * 0.9;
        if (rvMix > 0.001) { const x = (oL + oR) * 0.015, wl = this.rev.tick(0, x, rfb, 0.35), wr = this.rev.tick(1, x, rfb, 0.35); oL = oL * (1 - rvMix * 0.3) + wl * 3 * rvMix; oR = oR * (1 - rvMix * 0.3) + wr * 3 * rvMix; }
        oL = Math.tanh(oL * 0.8) * 1.25; oR = Math.tanh(oR * 0.8) * 1.25;
        if (!(oL - oL === 0) || !(oR - oR === 0)) { ++this.nonFinite; oL = oR = 0; }
        outL[i] = oL; outR[i] = oR;
      }
      this.flash *= Math.exp(-n / (0.35 * sr));
    }
  }
  Percussica.prototype._amp = new Float64Array(kModes); Percussica.prototype._fr = new Float64Array(kModes); Percussica.prototype._t60 = new Float64Array(kModes);
  OCC.engines.percussica = { name: 'Percussica', blurb: 'Modelled percussion, 49 instruments: bars and bells, skin drums, hand percussion, cymbals and gongs, and two kits (Drum kit and World kit map keys to pieces, General-MIDI style). Keys 24 to 28 switch the articulation (open, edge/slap, muted, rim/ping, brush). Turn Roll on to roll while a key is held. Choosing an instrument also loads its strike, damping, noise and release settings.', specs, groups, make: sr => new Percussica(sr), E };
})();
/* Industrica - metal and machine sounds, modelled, with a 16-step pattern sequencer (8 tracks). 37 sounds: struck metal, drops and scatters, clicks, friction and machines.
   Port of plugins/industrica/industrica.h (Biquad/Rng from dsp.h). Own tempo clock replaces the host transport. */
(function () {
  const kTracks = 8, kSteps = 16, kSounds = 37, kVoices = 32, kPend = 192, kMaxModes = 16, kPatterns = 9, kKits = 7, kTrackParams = 6;
  const E = {}; ['Preset', 'Volume', 'PlayMode', 'Run', 'Bpm', 'Rate', 'Steps', 'Swing', 'Humanize', 'Probability', 'Gate', 'Worn', 'Overheat', 'Material', 'Size', 'Damage', 'Drive', 'Tone', 'KeySound', 'LoadPattern', 'LoadKit', 'GlobalCount'].forEach((n, i) => E[n] = i);
  const TB = E.GlobalCount, CB = TB + kTracks * kTrackParams, COUNT = CB + kTracks * kSteps; E.TrackBase = TB; E.CellBase = CB; E.Count = COUNT;
  const trackParam = (t, p) => TB + t * kTrackParams + p, cellParam = (t, s) => CB + t * kSteps + s; E.trackParam = trackParam; E.cellParam = cellParam;
  const TSound = 0, TTune = 1, TDecay = 2, TLevel = 3, TPan = 4, TMute = 5;
  // ---- the sounds
  const SOUNDS = [];
  function S(name, o, r, a) {
    const d = Object.assign({ name, f0: 400, gain: 1, nm: 0, r: new Float64Array(kMaxModes), a: new Float64Array(kMaxModes), T0: 0.5, tilt: 1, hard: 0.7, excNoise: 0, imp: 1, bLo: 0, bHi: 0, bAtk: 1, bDec: 0, bLvl: 0, sLo: 0, sHi: 0, sLvl: 0, sAmHz: 0, sAmDepth: 0,
      oType: 0, oF: 100, oS0: 1, oS1: 1, oSweepMs: 0, oLvl: 0, oLp: 6000, oVib: 0, oVibHz: 5, oFeed: 0, oAlt: 1, oAltHz: 0, oLfo: 0, oLfoHz: 0, oDecMs: 0, oAtk: 5, qF: 0, qLvl: 0, qHz: 0, qDrift: 0,
      rep: 0, repMs: 0, repRatio: 1, repV: 1, repSpread: 0, repJit: 0, loopMs: 0, loopJit: 0, loopV: 0.7, loopSpread: 0, sustain: false, rel: 60 }, o);
    if (r) { d.nm = Math.min(kMaxModes, r.length); for (let i = 0; i < d.nm; ++i) d.r[i] = r[i]; let i = 0; for (; i < Math.min(kMaxModes, a.length); ++i) d.a[i] = a[i]; for (; i < d.nm; ++i) d.a[i] = d.a[i - 1] * 0.7; }
    SOUNDS.push(d);
  }
  S("Anvil",{f0:520, T0:1.5, tilt:1.2, hard:0.85, excNoise:0.35},[1, 2.32, 4.25, 6.63, 9.38, 12.6],[1, 0.8, 0.6, 0.45, 0.3, 0.2]);
  S("Steel sheet",{f0:310, T0:0.9, tilt:0.8, hard:0.8, excNoise:0.3, bLo:800, bHi:8000, bDec:30, bLvl:0.15},[1, 1.59, 2.14, 2.30, 2.65, 2.92, 3.16, 3.5, 4.06, 4.64],[1, 0.8, 0.9, 0.6, 0.7, 0.5, 0.5, 0.4, 0.3, 0.3]);
  S("Pipe",{f0:220, T0:1.8, tilt:1, hard:0.6, excNoise:0.15},[1, 2.76, 5.4, 8.93, 13.3],[1, 0.7, 0.45, 0.3, 0.2]);
  S("Girder",{f0:88, T0:2.6, tilt:0.7, hard:0.5, excNoise:0.4, bLo:60, bHi:1200, bDec:60, bLvl:0.3},[1, 2.76, 5.4, 8.93, 13.3],[1, 0.8, 0.55, 0.35, 0.2]);
  S("Oil drum",{f0:135, T0:0.55, tilt:1.6, hard:0.55, excNoise:0.35, bLo:100, bHi:2500, bDec:40, bLvl:0.25},[1, 1.7, 2.4, 3.1, 4.2, 5],[1, 0.8, 0.7, 0.5, 0.4, 0.3]);
  S("Bell plate",{f0:700, T0:3, tilt:0.6, hard:0.9, excNoise:0.1},[1, 2, 3, 4.16, 5.43, 6.8, 8.2],[1, 0.8, 0.7, 0.55, 0.45, 0.35, 0.25]);
  S("Cast pan",{f0:420, T0:0.35, tilt:1.6, hard:0.6, excNoise:0.25},[1, 2.25, 3.7, 5.3, 7.1],[1, 0.7, 0.5, 0.35, 0.25]);
  S("Rail",{f0:160, T0:4, tilt:0.5, hard:0.75, excNoise:0.2},[1, 2.76, 5.4, 8.93, 13.3, 18.6],[1, 0.9, 0.7, 0.5, 0.35, 0.25]);
  S("Hull gong",{f0:70, T0:6, tilt:0.4, hard:0.35, excNoise:0.3, bLo:40, bHi:800, bDec:120, bLvl:0.25},[1, 1.5, 2, 2.5, 3.1, 3.9, 4.7],[1, 0.8, 0.8, 0.6, 0.5, 0.4, 0.3]);
  S("Chain drop",{f0:2200, T0:0.08, tilt:1, hard:0.9, excNoise:0.2, rep:9, repMs:12, repRatio:1.12, repV:0.85, repSpread:0.3, repJit:0.5},[1, 2.9, 5.1, 7.3],[1, 0.6, 0.4, 0.25]);
  S("Bolt bounce",{f0:1700, T0:0.15, hard:0.9, rep:7, repMs:130, repRatio:0.72, repV:0.72, repSpread:0.04},[1, 2.5, 4.1, 6.2],[1, 0.7, 0.5, 0.3]);
  S("Pipe drop",{f0:260, T0:0.7, hard:0.6, excNoise:0.2, rep:4, repMs:190, repRatio:0.62, repV:0.6, repSpread:0.02},[1, 2.76, 5.4, 8.93],[1, 0.7, 0.45, 0.3]);
  S("Scrap rattle",{f0:3000, T0:0.05, hard:0.95, excNoise:0.3, rep:22, repMs:20, repRatio:0.96, repV:0.9, repSpread:0.8, repJit:1},[1, 3.1, 6.2, 9.7],[1, 0.6, 0.4, 0.2]);
  S("Relay click",{f0:3800, T0:0.02, hard:1, bLo:2000, bHi:7000, bDec:3, bLvl:0.5, rep:1, repMs:8, repV:0.7},[1, 2.7],[1, 0.5]);
  S("Latch clack",{f0:1100, T0:0.07, hard:0.8, excNoise:0.3, bLo:600, bHi:5000, bDec:8, bLvl:0.3},[1, 2.3, 4.8],[1, 0.6, 0.3]);
  S("Rivet gun",{f0:900, T0:0.06, hard:0.85, bLo:500, bHi:6000, bDec:6, bLvl:0.4, rep:8, repMs:34, repV:0.92, repJit:0.08},[1, 2.4, 4.4],[1, 0.6, 0.3]);
  S("Hammer smack",{f0:280, T0:0.15, hard:0.5, bLo:300, bHi:3000, bDec:25, bLvl:0.6},[1, 2.4],[1, 0.5]);
  S("Stamp press",{f0:500, T0:0.25, hard:0.7, bLo:40, bHi:1500, bDec:50, bLvl:0.6, oType:3, oF:90, oS0:1, oS1:0.4, oSweepMs:120, oDecMs:110, oLvl:1, rep:1, repMs:45, repV:0.6},[1, 2.7, 5.2],[0.6, 0.4, 0.25]);
  S("Valve thunk",{f0:380, T0:0.12, hard:0.6, bLo:2500, bHi:9000, bAtk:4, bDec:70, bLvl:0.2, oType:3, oF:160, oS0:1, oS1:0.38, oSweepMs:80, oDecMs:90, oLvl:0.9},[1, 2.6],[0.7, 0.4]);
  S("Squeak",{f0:2600, T0:0.1, sustain:true, qF:2400, qLvl:0.5, qHz:11, qDrift:0.06, oFeed:0.3, rel:40},[1, 2.2],[0.4, 0.2]);
  S("Rusty hinge",{f0:900, T0:0.12, sustain:true, qF:720, qLvl:0.55, qHz:7, qDrift:0.25, sLo:800, sHi:4000, sLvl:0.05, oFeed:0.4, rel:90},[1, 2.6, 4.7],[0.5, 0.3, 0.15]);
  S("Metal scrape",{f0:2600, T0:0.15, sustain:true, sLo:800, sHi:7000, sLvl:0.5, sAmHz:38, sAmDepth:0.8, qF:2400, qLvl:0.12, qHz:14, qDrift:0.1, oFeed:0.35, rel:70},[1, 2.3, 3.9],[0.5, 0.3, 0.2]);
  S("Grinder",{sustain:true, oType:1, oF:210, oLp:4500, oLvl:0.5, oAtk:120, sLo:2000, sHi:9000, sLvl:0.5, sAmHz:120, sAmDepth:0.4, loopMs:7, loopJit:1, loopV:0.5, loopSpread:0.5, bLo:4000, bHi:12000, bDec:3, bLvl:0.4, rel:140});
  S("Brake squeal",{sustain:true, f0:3800, T0:0.2, qF:3800, qLvl:0.5, qHz:3, qDrift:0.05, oType:3, oF:3800, oS0:1.06, oS1:0.96, oSweepMs:1400, oLvl:0.12, oFeed:0.3, rel:120},[1, 1.6],[0.3, 0.15]);
  S("Chain drag",{sustain:true, f0:2300, T0:0.06, hard:0.9, loopMs:12, loopJit:0.8, loopV:0.8, loopSpread:0.3, sLo:800, sHi:4000, sLvl:0.08, rel:60},[1, 2.9, 5.1, 7.3],[1, 0.6, 0.4, 0.25]);
  S("Saw cut",{sustain:true, oType:1, oF:130, oLp:3500, oLvl:0.5, oLfo:0.06, oLfoHz:0.7, oAtk:200, oS0:0.5, oS1:1, oSweepMs:300, sLo:2500, sHi:9000, sLvl:0.45, sAmHz:95, sAmDepth:0.7, rel:220});
  S("Lathe",{sustain:true, oType:1, oF:95, oLp:1800, oLvl:0.45, oAtk:250, oS0:0.4, oS1:1, oSweepMs:600, qF:3400, qLvl:0.15, qHz:3, qDrift:0.02, sLo:1000, sHi:6000, sLvl:0.2, rel:300});
  S("Drill",{sustain:true, oType:1, oF:520, oS0:0.3, oS1:1, oSweepMs:220, oLp:5000, oLvl:0.5, oAtk:30, sLo:1500, sHi:8000, sLvl:0.3, sAmHz:28, sAmDepth:0.5, rel:160});
  S("Plasma cutter",{sustain:true, sLo:2000, sHi:12000, sLvl:0.6, sAmHz:100, sAmDepth:0.3, oType:1, oF:100, oLp:800, oLvl:0.3, loopMs:15, loopJit:1, loopV:0.5, bLo:5000, bHi:14000, bDec:3, bLvl:0.4, rel:80});
  S("Sparks",{sustain:true, sLo:6000, sHi:12000, sLvl:0.04, loopMs:5, loopJit:1, loopV:0.8, loopSpread:0.5, bLo:3000, bHi:14000, bDec:4, bLvl:0.8, f0:6000, T0:0.01, rel:40},[1, 1.9],[0.3, 0.2]);
  S("Pneumatic hiss",{bLo:3000, bHi:14000, bAtk:6, bDec:220, bLvl:1, oType:3, oF:120, oS0:1, oS1:0.5, oSweepMs:80, oDecMs:90, oLvl:0.6});
  S("Hydraulic piston",{f0:220, T0:0.2, hard:0.6, oType:3, oF:48, oS0:0.7, oS1:1.2, oSweepMs:300, oDecMs:500, oLvl:0.8, bLo:150, bHi:800, bAtk:20, bDec:300, bLvl:0.5, rep:1, repMs:380, repV:0.8},[1, 2.5, 4.4],[0.8, 0.5, 0.3]);
  S("Klaxon",{sustain:true, oType:2, oF:440, oAlt:0.84, oAltHz:3.3, oLp:3500, oLvl:0.5, oAtk:8, rel:50});
  S("Siren",{sustain:true, oType:3, oF:720, oLfo:0.35, oLfoHz:0.6, oLvl:0.6, oAtk:40, rel:200});
  S("Turbine",{sustain:true, oType:1, oF:900, oS0:0.4, oS1:1, oSweepMs:1500, oLp:7000, oLvl:0.25, oAtk:300, sLo:3500, sHi:11000, sLvl:0.2, rel:500});
  S("Conveyor",{sustain:true, f0:650, T0:0.05, hard:0.8, loopMs:95, loopJit:0.08, loopV:0.8, loopSpread:0.02, bLo:800, bHi:5000, bDec:8, bLvl:0.3, sLo:150, sHi:900, sLvl:0.25, rel:150},[1, 2.6, 5],[1, 0.5, 0.25]);
  S("Motor hum",{sustain:true, oType:1, oF:60, oLp:900, oLvl:0.5, oAtk:400, oS0:0.6, oS1:1, oSweepMs:800, oVib:0.003, oVibHz:5, rel:400});
  const SN = SOUNDS.map(s => s.name);
  const PAT_NAMES = ['- (keep)', 'Press line', 'Conveyor', 'Foundry', 'Hull knock', 'Assembly', 'Scrap yard', 'Power hall', 'Clear'], KIT_NAMES = ['- (keep)', 'Foundry', 'Shipyard', 'Machine hall', 'Scrap yard', 'Workshop', 'Power plant'];
  const PATS = [
    ['', '', '', '', '', '', '', ''],
    ['3.......2.......', '....2.......2...', '1.1.1.1.1.1.1.1.', '3.......3.....2.', '..........1....5', '......2.......2.', '................', '............2..1'],
    ['2...2...2...2...', '..1...1...1...1.', '2.2.2.2.2.2.2.2.', '1.1.1.1.1.1.1.1.', '...1.......1....', '................', '3...............', '....2.......2..4'],
    ['3..2..3...2..3..', '..2.....2.......', '1...1...1...1...', '........3.......', '5.......5.....5.', '....2.......3...', '................', '..1...1...1...1.'],
    ['................', '3.......2.......', '........1.......', '................', '................', '......3.........', '................', '3...............'],
    ['2.2.2.2.2.2.2.4.', '..2.......2.....', '1.1.1.1.1.1.1.1.', '2...............', '......1.......1.', '....3...........', '................', '..2...2...2...3.'],
    ['1.1.1.1.1.1.1.1.', '3...2...3...2...', '..2...2..2...2..', '......1.......1.', '5..3....5....3..', '..2.............', '2...........2...', '1..1..1..1..1..1'],
    ['2...............', '................', '2.2.2.2.2.2.2.2.', '3.......3.......', '................', '..2...........3.', '4...............', '......2.........'],
    ['', '', '', '', '', '', '', ''],
  ];
  const KITS = [[0, 4, 13, 17, 9, 30, 22, 10], [0, 3, 14, 17, 9, 30, 22, 1], [8, 7, 15, 16, 11, 18, 33, 5], [13, 14, 18, 31, 27, 25, 26, 28], [12, 9, 4, 6, 10, 11, 21, 29], [16, 6, 15, 19, 14, 25, 27, 5], [36, 34, 13, 32, 29, 31, 18, 33]];
  // presets: [name, pattern, kit, bpm]
  const PRESETS = [['Init', 8, 0, 120], ['Press line', 1, 1, 112], ['Conveyor', 2, 3, 124], ['Foundry', 3, 1, 96], ['Hull knock', 4, 2, 70], ['Assembly', 5, 5, 128], ['Scrap yard', 6, 4, 104], ['Power hall', 7, 6, 84]];
  const DEF_SOUND = [0, 4, 13, 17, 9, 30, 22, 10];
  const specs = [
    P('Preset', '', 0, PRESETS.length - 1, 0, '%.0f', false, PRESETS.map(p => p[0])),
    P('Volume', 'dB', -24, 12, 0, '%.1f dB'), P('Play', '', 0, 2, 0, '%.0f', false, ['Pattern + keys', 'Pattern only', 'Keys only']), P('Run', '', 0, 1, 0, '%.0f', false, ['Stopped', 'Running']),
    P('Tempo', 'bpm', 40, 240, 120, '%.0f bpm'), P('Rate', '', 0, 5, 2, '%.0f', false, ['1/4', '1/8', '1/16', '1/32', '1/8 triplet', '1/16 triplet']), P('Steps', '', 1, 16, 16, '%.0f'),
    P('Swing', '%', 0, 100, 0, '%.0f %%'), P('Humanize', '%', 0, 100, 15, '%.0f %%'), P('Probability', '%', 0, 100, 100, '%.0f %%'), P('Gate', '%', 10, 400, 80, '%.0f %%', true),
    P('Worn', '%', 0, 100, 0, '%.0f %%'), P('Overheat', '%', 0, 100, 0, '%.0f %%'), P('Material', '', 0, 5, 0, '%.0f', false, ['Steel', 'Cast iron', 'Aluminium', 'Brass', 'Rusty', 'Tin']),
    P('Size', '%', -100, 100, 0, '%.0f %%'), P('Damage', '%', 0, 100, 0, '%.0f %%'), P('Drive', '%', 0, 100, 10, '%.0f %%'), P('Tone', '%', -100, 100, 0, '%.0f %%'),
    P('Key sound', '', 0, kSounds - 1, 0, '%.0f', false, SN), P('Load pattern', '', 0, kPatterns - 1, 0, '%.0f', false, PAT_NAMES), P('Load kit', '', 0, kKits - 1, 0, '%.0f', false, KIT_NAMES),
  ];
  const tp = ['sound', 'tune', 'decay', 'level', 'pan', 'mute'];
  for (let t = 0; t < kTracks; ++t) for (let q = 0; q < kTrackParams; ++q) {
    const nm = 'Track ' + (t + 1) + ' ' + tp[q];
    if (q === 0) specs.push(P(nm, '', 0, kSounds - 1, DEF_SOUND[t], '%.0f', false, SN)); else if (q === 1) specs.push(P(nm, 'st', -24, 24, 0, '%.0f st')); else if (q === 2) specs.push(P(nm, '%', -100, 100, 0, '%.0f %%'));
    else if (q === 3) specs.push(P(nm, 'dB', -24, 6, 0, '%.1f dB')); else if (q === 4) specs.push(P(nm, '%', -100, 100, 0, '%.0f %%')); else specs.push(P(nm, '', 0, 1, 0, '%.0f', false, ['On', 'Muted']));
  }
  for (let t = 0; t < kTracks; ++t) for (let s = 0; s < kSteps; ++s) specs.push(P('T' + (t + 1) + ' step ' + (s + 1), '', 0, 6, 0, '%.0f', false, ['Off', 'Ghost', 'Normal', 'Accent', 'x2', 'x3', 'x4']));
  const groups = [
    ['Sequencer', [E.Run, E.Bpm, E.Rate, E.Steps, E.Swing, E.Humanize, E.Probability, E.Gate, E.Worn, E.Overheat, E.LoadPattern, E.LoadKit, E.PlayMode]],
    ['Sound', [E.KeySound, E.Material, E.Size, E.Damage, E.Drive, E.Tone, E.Volume]],
  ];
  for (let t = 0; t < kTracks; ++t) groups.push(['Track ' + (t + 1), [0, 1, 2, 3, 4, 5].map(q => trackParam(t, q))]);
  for (let t = 0; t < kTracks; ++t) { const g = []; for (let s = 0; s < kSteps; ++s) g.push(cellParam(t, s)); groups.push(['Pattern ' + (t + 1), g]); }
  // per-sound loudness normalisation (peak of a held key hit at velocity 1 scaled to 0.35); 1 = not measured
  const NORM = [0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.3508,0.35,0.3502,0.3502,0.3505,0.3509,0.3812,0.3532,0.35,0.3949,0.35,0.3501,0.4169,0.5235,0.438,0.3741,0.3835,0.3549,0.3506,0.7574,0.6556,0.7001,0.3502,0.7681];

  class Rng { constructor(s) { this.s = s >>> 0; } uni() { let s = this.s; s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; this.s = s; return (s >>> 8) * (1 / 16777216); } bi() { return this.uni() * 2 - 1; } }
  class Shelf { // high shelf biquad
    constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; }
    set(f, q, gdb, sr) {
      f = clampf(f, 5, sr * 0.49); const A = Math.pow(10, gdb / 40), w = 2 * Math.PI * f / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * q), s = 2 * Math.sqrt(A) * al;
      const B0 = A * ((A + 1) + (A - 1) * cw + s), B1 = -2 * A * ((A - 1) + (A + 1) * cw), B2 = A * ((A + 1) + (A - 1) * cw - s), A0 = (A + 1) - (A - 1) * cw + s, A1 = 2 * ((A - 1) - (A + 1) * cw), A2 = (A + 1) - (A - 1) * cw - s;
      this.b0 = B0 / A0; this.b1 = B1 / A0; this.b2 = B2 / A0; this.a1 = A1 / A0; this.a2 = A2 / A0;
    }
    run(x) { const y = this.b0 * x + this.z1; this.z1 = this.b1 * x - this.a1 * y + this.z2; this.z2 = this.b2 * x - this.a2 * y; return y; }
    reset() { this.z1 = this.z2 = 0; }
  }
  const mkVoice = () => ({ on: false, snd: 0, vel: 1, pan: 0, pitch: 1, decMul: 1, lvl: 1, sub: false, track: -1, key: -1, age: 0, gateLeft: 0, released: false, relEnv: 1, nm: 0,
    c1: new Float64Array(kMaxModes), c2: new Float64Array(kMaxModes), b: new Float64Array(kMaxModes), y1: new Float64Array(kMaxModes), y2: new Float64Array(kMaxModes),
    exLp: 0, exA: 0, bandHi1: 0, bandLo1: 0, bandHi2: 0, bandLo2: 0, bEnv: 0, oPh: 0, oLpS: 0, sqPh: 0, sqDrift: 0, sqAm: 0, sqLp: 0, vibPh: 0, lfoPh: 0, altPh: 0, amPh: 0, quiet: 0, loopT: 0, damageNoise: 0 });
  const MATDEC = [1, 0.55, 1.5, 1.3, 0.45, 0.4], MATHARD = [1, 0.7, 1.2, 0.9, 0.8, 1.4], MATTILT = [1, 1.5, 0.6, 0.8, 1.8, 1.7], MATDMG = [0, 0.05, 0, 0, 0.5, 0.1], RATEQ = [1, 0.5, 0.25, 0.125, 1 / 3, 1 / 6];
  const GATE_HELD = 1 << 28, GATE_LIM = 1 << 27;

  class Industrica extends EngineBase {
    constructor(sr, probe) {
      super(sr); this.initParams(specs); this.probe = !!probe; this.rng = new Rng(0xA11CE5); this.voices = Array.from({ length: kVoices }, mkVoice); this.pend = Array.from({ length: kPend }, () => ({ on: false, t: 0, snd: 0, gate: 0, track: -1, key: -1, vel: 1, pitch: 1, pan: 0, lvl: 1, decMul: 1, sub: false })); this.pendN = 0;
      this.stepPhase = 1; this.lastStep = -1; this.stepNow = -1; this.wasRunning = false; this.heat = 0; this.drift = new Float64Array(kTracks); this.flash = new Float64Array(kTracks); this.mod = 0; this.nonFinite = 0; this.hits = 0;
      this.tone = [new Shelf(), new Shelf()]; this.tone[0].set(3500, 0.7, 0, sr); this.tone[1].set(3500, 0.7, 0, sr); this.mode = 0;
      // per-sound constants that only depend on the sample rate
      const fmax = 0.45 * sr, TP = 6.2831853;
      this.dd = SOUNDS.map(d => ({ oLpK: 1 - Math.exp(-TP * Math.min(d.oLp, fmax) / sr), sA1: Math.exp(-TP * Math.min(d.sHi, fmax) / sr), sA2: Math.exp(-TP * Math.max(d.sLo, 10) / sr), bA1: Math.exp(-TP * Math.min(d.bHi, fmax) / sr), bA2: Math.exp(-TP * Math.max(d.bLo, 10) / sr),
        qK: Math.min(1, TP * Math.max(0.5, d.qHz) / sr * 3), bAtt: Math.max(1, d.bAtk) * 0.001 * sr, relK: Math.exp(-1 / (Math.max(2, d.rel) * 0.001 * sr)) }));
    }
    set(id, x) {
      if (id < 0 || id >= COUNT) return; const V = this.v; V[id] = x;
      if (id === E.Preset) this.loadPreset(Math.round(x));
      else if (id === E.Tone) { this.tone[0].set(3500, 0.7, x * 0.12, this.sr); this.tone[1].set(3500, 0.7, x * 0.12, this.sr); }
      else if (id === E.LoadPattern && x >= 1) { this.applyPattern(Math.round(x)); V[E.LoadPattern] = 0; this.writeParam(E.LoadPattern, 0); }
      else if (id === E.LoadKit && x >= 1) { this.applyKit(Math.round(x)); V[E.LoadKit] = 0; this.writeParam(E.LoadKit, 0); }
    }
    put(i, val) { this.v[i] = val; this.writeParam(i, val); }
    loadPreset(n) {
      const p = PRESETS[clampf(n, 0, PRESETS.length - 1)]; this.applyPattern(p[1]); this.applyKit(p[2]); this.put(E.Bpm, p[3]); this.put(E.Run, n > 0 ? 1 : 0);
    }
    applyPattern(p) {
      for (let t = 0; t < kTracks; ++t) { const row = PATS[clampf(p, 0, kPatterns - 1)][t]; for (let s = 0; s < kSteps; ++s) { const c = row.length > s ? row[s] : '.'; const val = (c >= '1' && c <= '6') ? c.charCodeAt(0) - 48 : 0; this.put(cellParam(t, s), val); } }
    }
    applyKit(k) { for (let t = 0; t < kTracks; ++t) this.put(trackParam(t, TSound), KITS[clampf(k, 0, kKits - 1)][t]); }
    modWheel(m) { this.mod = m; } pitchBend(b) { } pressure(p) { }
    allNotesOff() { for (const v of this.voices) if (v.on) v.gateLeft = 0; }
    schedule(delay, snd, vel, pitch, pan, gate, track, key, sub, lvl, decMul) {
      if (delay <= 0) { this.startVoice(snd, vel, pitch, pan, gate, track, key, sub, lvl, decMul); return; }
      for (const p of this.pend) if (!p.on) { p.on = true; p.t = delay; p.snd = snd; p.gate = gate; p.track = track; p.key = key; p.vel = vel; p.pitch = pitch; p.pan = pan; p.lvl = lvl; p.decMul = decMul; p.sub = sub; ++this.pendN; return; }
    }
    startVoice(snd, vel, pitch, pan, gate, track, key, sub, lvl, decMul) {
      const V = this.v, sr = this.sr, rng = this.rng, d = SOUNDS[snd]; let v = null; for (const x of this.voices) if (!x.on) { v = x; break; }
      if (!v) { let best = -1; for (const x of this.voices) if (best < 0 || x.age > best) { best = x.age; v = x; } }
      v.c1.fill(0); v.c2.fill(0); v.b.fill(0); v.y1.fill(0); v.y2.fill(0);
      v.on = true; v.snd = snd; v.vel = vel; v.pan = pan; v.pitch = pitch; v.sub = sub; v.track = track; v.key = key; v.age = 0; v.gateLeft = gate; v.lvl = lvl; v.decMul = decMul; v.released = false; v.relEnv = 1;
      v.exLp = 0; v.bandHi1 = v.bandLo1 = v.bandHi2 = v.bandLo2 = 0; v.bEnv = 0; v.oPh = 0; v.oLpS = 0; v.sqPh = 0; v.sqDrift = 0; v.sqAm = 0; v.sqLp = 0; v.vibPh = 0; v.lfoPh = 0; v.altPh = 0; v.amPh = 0; ++this.hits;
      if (track >= 0 && track < kTracks) this.flash[track] = 1;
      const mat = clampf(Math.round(V[E.Material]), 0, 5), size = V[E.Size] * 0.01, fMul = Math.pow(2, -size * 1.2), dMul = Math.pow(2, size * 0.8), dmg = clampf(V[E.Damage] * 0.01 + MATDMG[mat], 0, 1);
      v.nm = 0; const fmax = 0.45 * sr;
      for (let k = 0; k < d.nm; ++k) {
        const f = d.f0 * pitch * d.r[k] * fMul * (1 + dmg * 0.03 * rng.bi()); if (f > fmax || f < 15) continue;
        const T = clampf(d.T0 * MATDEC[mat] * decMul * dMul / (1 + d.tilt * MATTILT[mat] * (d.r[k] - 1) * 0.35) * (1 - 0.5 * dmg), 0.004, 20), r = Math.exp(-6.9078 / (T * sr)), w = 6.2831853 * f / sr;
        const i = v.nm++; v.c1[i] = 2 * r * Math.cos(w); v.c2[i] = -r * r; v.b[i] = Math.sin(w) * d.a[k];
      }
      const fcEx = 500 + d.hard * d.hard * 15000 * MATHARD[mat]; v.exA = Math.exp(-6.2831853 * Math.min(fcEx, 0.45 * sr) / sr);
      v.damageNoise = dmg * 0.35; v.quiet = 0; v.loopT = Math.trunc(d.loopMs * 0.001 * sr); v.vibPh = rng.uni(); v.amPh = rng.uni(); v.sqPh = rng.uni();
      if (!sub && d.rep > 0) {
        let t = 0, vv = vel, dt = d.repMs;
        for (let i = 0; i < d.rep; ++i) { t += dt * (1 + d.repJit * 0.6 * rng.bi()); vv *= d.repV; dt *= d.repRatio; if (vv < 0.02) break; this.schedule(Math.trunc(t * 0.001 * sr), snd, vv, pitch * (1 + d.repSpread * 0.5 * rng.bi()), pan, 0, track, -1, true, lvl, decMul); }
      }
    }
    noteOn(note, vel) {
      const V = this.v; if (Math.round(V[E.PlayMode]) === 1) return; const tune = Math.pow(2, this.noteTune / 1200);
      if (note >= 36 && note < 36 + kTracks) { const t = note - 36; this.triggerTrack(t, Math.max(0.05, vel), 0, GATE_HELD, tune); for (const x of this.voices) if (x.on && x.track === t && x.key < 0 && x.gateLeft === GATE_HELD) x.key = note; }
      else if (note >= 48 && note <= 83) this.schedule(0, Math.round(V[E.KeySound]), Math.max(0.05, vel), Math.pow(2, (note - 60) / 12) * tune, 0, GATE_HELD, -1, note, false, 1, 1);
    }
    noteOff(note) { for (const x of this.voices) if (x.on && x.key === note && x.gateLeft > 0) x.gateLeft = 0; for (const p of this.pend) if (p.on && p.key === note) p.gate = 0; }
    triggerTrack(t, vel, delay, gate, pitchMul) {
      const V = this.v, snd = Math.round(V[trackParam(t, TSound)]), tune = Math.pow(2, V[trackParam(t, TTune)] / 12), decMul = Math.pow(2, V[trackParam(t, TDecay)] / 50), lvl = Math.pow(10, V[trackParam(t, TLevel)] / 20), pan = V[trackParam(t, TPan)] * 0.01;
      this.schedule(delay, snd, vel, tune * pitchMul, pan, gate, t, -1, false, lvl, decMul);
    }
    fireStep(step, stepSamples) {
      const V = this.v, rng = this.rng, sr = this.sr; this.stepNow = step; const hum = V[E.Humanize] * 0.01, worn = V[E.Worn] * 0.01, swing = V[E.Swing] * 0.01, over = V[E.Overheat] * 0.01, prob = V[E.Probability] * 0.01;
      this.heat = over > 0 ? Math.min(1, this.heat + 0.012 + 0.01 * rng.uni()) : Math.max(0, this.heat - 0.05); if (rng.uni() < 0.04) this.heat *= 0.6;
      const gateBase = Math.trunc(stepSamples * V[E.Gate] * 0.01), swingDelay = (step & 1) ? Math.trunc(swing * 0.5 * stepSamples) : 0;
      for (let t = 0; t < kTracks; ++t) {
        const cell = Math.round(V[cellParam(t, step)]); if (cell <= 0 || V[trackParam(t, TMute)] > 0.5) continue;
        if (rng.uni() > prob) continue;
        let mult = 1; if (over > 0 && rng.uni() < this.heat * over * 0.5) { if (rng.uni() < 0.5) continue; mult = 2; }
        this.drift[t] = clampf(this.drift[t] * 0.97 + rng.bi() * worn * 0.0006 * sr, 0, worn * 0.02 * sr);
        const hits = cell >= 4 ? cell - 2 : 1, base = cell === 1 ? 0.32 : (cell === 3 ? 1 : (cell >= 4 ? 0.78 : 0.65));
        for (let h = 0; h < hits * mult; ++h) {
          const spacing = Math.trunc(stepSamples / Math.max(1, hits * mult)), vel = clampf(base * (1 - 0.06 * h) * (1 + hum * 0.25 * rng.bi() + worn * 0.2 * rng.bi()), 0.05, 1);
          const delay = swingDelay + h * spacing + Math.trunc(Math.abs(rng.bi()) * hum * 0.015 * sr) + Math.trunc(this.drift[t]);
          this.triggerTrack(t, vel, delay, Math.max(40, (h === 0 && hits * mult === 1 ? gateBase : Math.trunc(spacing * V[E.Gate] * 0.01))), 1);
        }
      }
    }
    process(outL, outR, n) {
      const V = this.v, sr = this.sr, steps = clampf(Math.round(V[E.Steps]), 1, kSteps), stepQ = RATEQ[clampf(Math.round(V[E.Rate]), 0, 5)];
      const running = Math.round(V[E.PlayMode]) !== 2 && V[E.Run] > 0.5, bpm = Math.max(20, V[E.Bpm]), stepSamples = stepQ * 60 / bpm * sr, stepInc = 1 / stepSamples;
      if (running && !this.wasRunning) { this.stepPhase = 1; this.lastStep = -1; } if (!running && this.wasRunning) this.stepNow = -1; this.wasRunning = running;
      const vol = Math.pow(10, V[E.Volume] / 20), drive = V[E.Drive] * 0.01, pre = 1 + drive * 7, post = 1 / (1 + drive * 1.8), toneOn = Math.abs(V[E.Tone]) > 0.5, voices = this.voices, pend = this.pend, useNorm = !this.probe;
      for (let i = 0; i < n; ++i) {
        if (running) { this.stepPhase += stepInc; if (this.stepPhase >= 1) { this.stepPhase -= 1; ++this.lastStep; if (this.lastStep < 0) this.lastStep = 0; this.fireStep(this.lastStep % steps, Math.trunc(stepSamples)); } }
        if (this.pendN > 0) for (let q = 0; q < kPend; ++q) { const p = pend[q]; if (p.on && --p.t <= 0) { p.on = false; --this.pendN; this.startVoice(p.snd, p.vel, p.pitch, p.pan, p.gate, p.track, p.key, p.sub, p.lvl, p.decMul); } }
        let l = 0, r = 0;
        for (let q = 0; q < kVoices; ++q) { const v = voices[q]; if (v.on) { const m = this.renderVoice(v) * v.vel * v.lvl * (useNorm ? NORM[v.snd] : 1), pn = clampf(v.pan, -1, 1), a = (pn + 1) * 0.7853982; l += m * Math.cos(a) * 1.4142; r += m * Math.sin(a) * 1.4142; } }
        l = Math.tanh(l * pre) * post * vol; r = Math.tanh(r * pre) * post * vol;
        if (toneOn) { l = this.tone[0].run(l); r = this.tone[1].run(r); }
        if (!(Math.abs(l) < 64 && Math.abs(r) < 64)) { l = r = 0; ++this.nonFinite; }
        outL[i] = l; outR[i] = r;
      }
      const fd = Math.pow(0.5, n / sr * 8); for (let t = 0; t < kTracks; ++t) this.flash[t] *= fd;
    }
    renderVoice(v) {
      const d = SOUNDS[v.snd], c = this.dd[v.snd], srf = this.sr, sub = v.sub, rng = this.rng, TP = 6.2831853;
      if (v.gateLeft > 0 && v.gateLeft < GATE_LIM) --v.gateLeft;
      const held = v.gateLeft > 0 || !d.sustain || sub; if (!held && !v.released) v.released = true;
      if (v.released && d.sustain) v.relEnv *= c.relK;
      const ageS = v.age / srf; let o = 0, feedIn = 0;
      if (!sub && d.oType > 0) {
        const u = d.oSweepMs > 0 ? Math.min(1, ageS * 1000 / d.oSweepMs) : 1; let mult = d.oS0 + (d.oS1 - d.oS0) * u;
        if (d.oLfo > 0) { v.lfoPh += d.oLfoHz / srf; mult *= 1 + d.oLfo * Math.sin(TP * v.lfoPh); }
        if (d.oVib > 0) { v.vibPh += d.oVibHz / srf; mult *= 1 + d.oVib * Math.sin(TP * v.vibPh); }
        if (d.oAltHz > 0) { v.altPh += d.oAltHz / srf; if (Math.sin(TP * v.altPh) < 0) mult *= d.oAlt; }
        const f = d.oF * v.pitch * mult; v.oPh += f / srf; v.oPh -= Math.floor(v.oPh);
        let w = d.oType === 1 ? 2 * v.oPh - 1 : (d.oType === 2 ? (v.oPh < 0.5 ? 1 : -1) : (d.oType === 3 ? Math.sin(TP * v.oPh) : (v.oPh < 0.25 ? 1 : -1)));
        v.oLpS += (w - v.oLpS) * c.oLpK; w = v.oLpS;
        const env = d.oDecMs > 0 ? Math.exp(-ageS * 1000 / d.oDecMs) : Math.min(1, ageS * 1000 / Math.max(1, d.oAtk)) * v.relEnv;
        const ov = w * env * d.oLvl; o += ov; feedIn += ov;
      }
      if (!sub && d.sLvl > 0) {
        const nz = rng.bi(); v.bandHi2 = c.sA1 * v.bandHi2 + (1 - c.sA1) * nz; v.bandLo2 = c.sA2 * v.bandLo2 + (1 - c.sA2) * nz; const band = (v.bandHi2 - v.bandLo2) * 3;
        v.amPh += d.sAmHz / srf; v.amPh -= Math.floor(v.amPh); const am = d.sAmHz > 0 ? 1 - d.sAmDepth * (0.5 + 0.5 * Math.sin(TP * v.amPh)) : 1;
        const sv = band * d.sLvl * am * Math.min(1, ageS * 200) * v.relEnv; o += sv; feedIn += sv;
      }
      if (!sub && d.qLvl > 0) {
        v.sqLp += (rng.bi() - v.sqLp) * c.qK; const target = clampf(v.sqLp * 2.4 + 0.55, 0, 1); v.sqAm += (target - v.sqAm) * 0.01;
        v.sqPh += d.qF * v.pitch * (1 + v.sqLp * d.qDrift * 3) / srf; v.sqPh -= Math.floor(v.sqPh); const w = 2 * v.sqPh - 1; v.sqDrift += (w - v.sqDrift) * 0.35;
        const qv = v.sqDrift * v.sqAm * d.qLvl * Math.min(1, ageS * 80) * v.relEnv; o += qv; feedIn += qv;
      }
      if (d.bLvl > 0 && d.bDec > 0) {
        const att = c.bAtt; if (v.age < Math.trunc(att)) v.bEnv = (v.age + 1) / att; else v.bEnv = Math.exp(-(ageS - att / srf) * 1000 / d.bDec);
        if (v.bEnv > 1e-4) { const nz = rng.bi(); v.bandHi1 = c.bA1 * v.bandHi1 + (1 - c.bA1) * nz; v.bandLo1 = c.bA2 * v.bandLo1 + (1 - c.bA2) * nz; o += (v.bandHi1 - v.bandLo1) * 3 * v.bEnv * d.bLvl; }
      }
      if (v.nm > 0) {
        let x = 0; if (v.age === 0) x += d.imp; if (v.age < Math.trunc(0.004 * srf)) x += rng.bi() * d.excNoise * (1 - v.age / (0.004 * srf)); x += feedIn * d.oFeed * 0.5;
        v.exLp = v.exA * v.exLp + (1 - v.exA) * x; const xin = v.exLp * 3; let s = 0; const nm = v.nm, b = v.b, c1 = v.c1, c2 = v.c2, y1 = v.y1, y2 = v.y2;
        for (let k = 0; k < nm; ++k) { const y = b[k] * xin + c1[k] * y1[k] + c2[k] * y2[k]; y2[k] = y1[k]; y1[k] = y; s += y; }
        o += s;
      }
      if (v.damageNoise > 0.001) { v.damageNoise *= Math.exp(-1 / (0.09 * srf)); o += rng.bi() * v.damageNoise * 0.3; }
      if (!sub && d.loopMs > 0 && v.gateLeft > 0) { if (--v.loopT <= 0) { v.loopT = Math.max(8, Math.trunc(d.loopMs * 0.001 * srf * (1 + d.loopJit * 0.7 * rng.bi())));
        this.schedule(0, v.snd, v.vel * d.loopV * (0.5 + 0.5 * rng.uni()), v.pitch * (1 + d.loopSpread * 0.5 * rng.bi()), v.pan, 0, v.track, -1, true, v.lvl, v.decMul); } }
      ++v.age;
      if (Math.abs(o) < 1e-5 && (v.released || !d.sustain)) { if (++v.quiet > 4800) v.on = false; } else v.quiet = 0;
      if (v.age > Math.trunc(14 * srf)) v.on = false; if (d.sustain && v.released && v.relEnv < 1e-3 && v.quiet > 2400) v.on = false;
      return o;
    }
  }
  // measure the loudness of every sound (used to build the NORM table; not called at run time)
  function measureNorm(sr) {
    const table = [], len = Math.trunc(1.6 * sr), bl = new Float32Array(512), br = new Float32Array(512);
    for (let s = 0; s < kSounds; ++s) {
      const e = new Industrica(sr, true); e.set(E.Run, 0); e.set(E.Humanize, 0); e.set(E.Drive, 0); e.set(E.Tone, 0); e.set(E.KeySound, s); e.noteOn(60, 1); let done = 0, pk = 0;
      while (done < len) { const nn = Math.min(512, len - done); if (done > Math.trunc(0.4 * sr)) e.noteOff(60); e.process(bl, br, nn); for (let i = 0; i < nn; ++i) pk = Math.max(pk, Math.abs(bl[i]), Math.abs(br[i])); done += nn; }
      table.push(pk > 1e-6 ? 0.35 / pk : 1);
    }
    return table;
  }
  OCC.engines.industrica = { name: 'Industrica', blurb: 'Metal and machine sounds with a pattern sequencer: 37 modelled sounds (struck metal, drops, clicks, friction, machines). Keys C1 to G1 (36 to 43) play the eight tracks, keys 48 to 83 play the Key sound up the keyboard. Press Run to start the 16-step pattern on the built-in clock (Tempo, Rate, Steps, Swing); choosing a Preset loads a pattern and kit and starts it. Click each step to set off, ghost, normal, accent or a x2 to x4 ratchet.', specs, groups, make: sr => new Industrica(sr), E, measureNorm };
})();
/* AudioWorklet host: runs one engine at a time */
if (typeof registerProcessor !== 'undefined') {
  class OccSynth extends AudioWorkletProcessor {
    constructor() {
      super(); this.eng = null; this.id = null; this.peak = 0; this.frames = 0; this.q = [];
      this.port.onmessage = e => this.msg(e.data);
    }
    msg(m) {
      if (m.engine) { try { const d = OCC.engines[m.engine]; this.eng = d.make(sampleRate); this.id = m.engine; d.specs.forEach((s, i) => { if (i > 0) this.eng.set(i, s.def); }); this.eng.writes = []; this.port.postMessage({ ready: m.engine }); } catch (err) { this.port.postMessage({ error: String(err && err.stack || err) }); } return; }
      const e = this.eng; if (!e) return;
      if (m.set) { e.set(m.set[0], m.set[1]); const w = e.takeWrites(); if (w.length) this.port.postMessage({ writes: w }); }
      else if (m.on) { e.noteTune = 0; e.noteOn(m.on[0], m.on[1]); }
      else if (m.off != null) e.noteOff(m.off);
      else if (m.bend != null) e.pitchBend(m.bend);
      else if (m.mod != null) e.modWheel(m.mod);
      else if (m.panic) e.allNotesOff();
    }
    process(inputs, outputs) {
      const o = outputs[0], L = o[0], R = o[1] || o[0]; if (!this.eng) return true;
      try { this.eng.process(L, R, L.length); } catch (err) { this.port.postMessage({ error: String(err && err.stack || err) }); this.eng = null; return true; }
      const lim = x => { const a = x < 0 ? -x : x; if (!(a < 1e9)) return 0; if (a <= 0.8) return x; const y = 0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2); return x < 0 ? -y : y; };
      let pk = 0; for (let i = 0; i < L.length; ++i) { L[i] = lim(L[i]); if (R !== L) R[i] = lim(R[i]); const a = Math.abs(L[i]); if (a > pk) pk = a; }
      if (pk > this.peak) this.peak = pk; this.frames += L.length;
      if (this.frames >= 2048) { this.port.postMessage({ peak: this.peak }); this.peak = 0; this.frames = 0; }
      return true;
    }
  }
  registerProcessor('occsynth', OccSynth);
}
