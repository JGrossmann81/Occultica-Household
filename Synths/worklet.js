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
      let pk = 0; for (let i = 0; i < L.length; ++i) { const a = Math.abs(L[i]); if (a > pk) pk = a; if (a !== a) { L[i] = 0; R[i] = 0; } }
      if (pk > this.peak) this.peak = pk; this.frames += L.length;
      if (this.frames >= 2048) { this.port.postMessage({ peak: this.peak }); this.peak = 0; this.frames = 0; }
      return true;
    }
  }
  registerProcessor('occsynth', OccSynth);
}
