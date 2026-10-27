/* Birthica engine for the web: a port of the Birthica plugin's sound engines (two analog-style drum machines,
   an acid bass and a poly synth), each with a 16-step pattern. Everything is synthesized, no samples. */
'use strict';
const TWO_PI = 6.283185307179586, PI = Math.PI;
const NV = 11, STEPS = 16, MACH = 4;      // drum voices, steps, machines (0 Rhythm 8, 1 Rhythm 9, 2 Acid Bass, 3 Poly Synth)
const P = { master: 0, swing: 1, vol: 2, mute: 6, drum: 10, acid: 76, poly: 84, sat: 95, count: 99 };
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const decayCoef = (sec, sr) => Math.exp(-1 / Math.max(1, sec * sr));
const semis = st => Math.pow(2, st / 12);
const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
const dbToGain = db => Math.pow(10, db / 20);

class Noise { constructor(s) { this.s = s | 0 || 0x9E3779B9 | 0; } next() { let s = this.s; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; this.s = s; return s / 2147483648; } }

class Biquad {
  constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; }
  set(type, f, q, sr) {
    f = clamp(f, 5, sr * 0.49); q = Math.max(0.05, q);
    const w = 2 * PI * f / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * q);
    let B0, B1, B2;
    if (type === 'lp') { B0 = (1 - cw) / 2; B1 = 1 - cw; B2 = (1 - cw) / 2; }
    else if (type === 'hp') { B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = (1 + cw) / 2; }
    else { B0 = al; B1 = 0; B2 = -al; }
    const A0 = 1 + al, A1 = -2 * cw, A2 = 1 - al;
    this.b0 = B0 / A0; this.b1 = B1 / A0; this.b2 = B2 / A0; this.a1 = A1 / A0; this.a2 = A2 / A0;
  }
  run(x) { const y = this.b0 * x + this.z1; this.z1 = this.b1 * x - this.a1 * y + this.z2; this.z2 = this.b2 * x - this.a2 * y; return y; }
}
class OnePoleLP { constructor() { this.a = 0; this.z = 0; } set(hz, sr) { this.a = Math.exp(-2 * PI * clamp(hz, 1, sr * 0.49) / sr); } run(x) { this.z = x * (1 - this.a) + this.z * this.a; return this.z; } }

class Saturator {
  constructor() { this.drive = 0; this.x1 = [0, 0]; this.y1 = [0, 0]; }
  process(x, ch) {
    ch = ch | 0;
    if (this.drive <= 0.001) { this.x1[ch] = this.y1[ch] = 0; return x; }
    const d = this.drive, g = 1 + d * 7, b = 0.12 * d, norm = 0.5 / Math.tanh(g * 0.5), off = Math.tanh(g * b);
    let y = (Math.tanh(g * (x + b)) - off) * norm;
    y = x + (y - x) * Math.min(1, d * 5);
    const o = y - this.x1[ch] + 0.995 * this.y1[ch]; this.x1[ch] = y; this.y1[ch] = o;
    return o;
  }
  reset() { this.x1 = [0, 0]; this.y1 = [0, 0]; }
}

function polyBlep(t, dt) {
  if (t < dt) { t /= dt; return t + t - t * t - 1; }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
  return 0;
}
class Osc {
  constructor() { this.ph = 0; }
  saw(dt) { const v = 2 * this.ph - 1 - polyBlep(this.ph, dt); this.ph += dt; if (this.ph >= 1) this.ph -= 1; return v; }
  square(dt) {
    let v = this.ph < 0.5 ? 1 : -1;
    v += polyBlep(this.ph, dt); let t2 = this.ph + 0.5; if (t2 >= 1) t2 -= 1; v -= polyBlep(t2, dt);
    this.ph += dt; if (this.ph >= 1) this.ph -= 1; return v;
  }
}

/* ---------------------------------------------------------------- drums */
const METAL8 = [205.3, 304.4, 369.6, 522.7, 540, 800];
class DrumVoice {
  constructor(sr) {
    this.kind = 'Kick8'; this.baseHz = 100; this.level = 0.8; this.tune = 0; this.decay = 1; this.sr = sr;
    this.on = false; this.gain = 0; this.ph = [0, 0, 0, 0, 0, 0]; this.amp = 0; this.amp2 = 0; this.penv = 0; this.click = 0;
    this.kA = 0; this.kA2 = 0; this.kP = 0; this.kC = 0; this.f0 = 50; this.f1hz = 0; this.f2hz = 0; this.pm = 1; this.t = 0;
    this.b1 = new Biquad(); this.b2 = new Biquad(); this.lp = new OnePoleLP(); this.rng = new Noise(1);
  }
  choke() { if (this.on) { const c = decayCoef(0.004, this.sr); this.kA = Math.min(this.kA, c); this.kA2 = Math.min(this.kA2, c); } }
  trigger(vel) {
    const sr = this.sr, d = this.decay, k = this.kind;
    this.on = true; this.gain = this.level * vel; this.t = 0; this.pm = semis(this.tune); const pm = this.pm;
    this.ph.fill(0); this.amp = 1; this.amp2 = 0; this.penv = 1; this.click = 1;
    if (/^(Snare|Tom|Clap|Cowbell|Cymbal|Crash|Ride)/.test(k)) this.amp2 = 1;
    const b1 = this.b1, b2 = this.b2;
    switch (k) {
      case 'Kick8': this.f0 = 52 * pm; this.kA = decayCoef(0.28 * d, sr); this.kP = decayCoef(0.012, sr); this.kC = decayCoef(0.0015, sr); break;
      case 'Kick9': this.f0 = 50 * pm; this.kA = decayCoef(0.13 * d, sr); this.kP = decayCoef(0.022, sr); this.kC = decayCoef(0.003, sr); b1.set('hp', 1800, 0.7, sr); break;
      case 'Snare8': this.f1hz = 185 * pm; this.f2hz = 330 * pm; this.kA = decayCoef(0.06 * d, sr); this.kA2 = decayCoef(0.07 * d, sr); b1.set('hp', 1600 * pm, 0.7, sr); b2.set('lp', 9000, 0.7, sr); break;
      case 'Snare9': this.f1hz = 180 * pm; this.f2hz = 332 * pm; this.kA = decayCoef(0.05 * d, sr); this.kA2 = decayCoef(0.1 * d, sr); this.kP = decayCoef(0.02, sr); b1.set('hp', 900 * pm, 0.7, sr); b2.set('lp', 11000, 0.7, sr); break;
      case 'Tom8': this.f0 = this.baseHz * pm; this.kA = decayCoef((0.22 - this.baseHz / 2000) * d, sr); this.kP = decayCoef(0.09, sr); this.kA2 = decayCoef(0.03, sr); break;
      case 'Tom9': this.f0 = this.baseHz * pm; this.kA = decayCoef((0.2 - this.baseHz / 2200) * d, sr); this.kP = decayCoef(0.05, sr); this.kA2 = decayCoef(0.05, sr); this.lp.set(2500, sr); break;
      case 'Rim8': this.f1hz = 1720 * pm; this.f2hz = 480 * pm; this.kA = decayCoef(0.022 * d, sr); b1.set('hp', 350, 0.7, sr); break;
      case 'Rim9': this.f1hz = 2200 * pm; this.f2hz = 650 * pm; this.kA = decayCoef(0.018 * d, sr); b1.set('hp', 500, 0.7, sr); break;
      case 'Clap8': this.kA2 = decayCoef(0.075 * d, sr); b1.set('bp', 1100 * pm, 1.3, sr); break;
      case 'Clap9': this.kA2 = decayCoef(0.09 * d, sr); b1.set('bp', 1450 * pm, 1.1, sr); b2.set('hp', 700, 0.7, sr); break;
      case 'Cowbell8': this.f1hz = 540 * pm; this.f2hz = 800 * pm; this.kA = decayCoef(0.012, sr); this.kA2 = decayCoef(0.085 * d, sr); b1.set('bp', 830 * pm, 1.6, sr); break;
      case 'Closed8': case 'Open8': this.kA = decayCoef((k === 'Closed8' ? 0.03 : 0.17) * d, sr); b1.set('bp', 7600 * pm, 0.9, sr); b2.set('hp', 6800 * pm, 0.7, sr); break;
      case 'Cymbal8': this.kA = decayCoef(0.55 * d, sr); this.kA2 = decayCoef(0.05, sr); b1.set('bp', 5200 * pm, 0.6, sr); b2.set('hp', 3600 * pm, 0.7, sr); break;
      case 'Closed9': case 'Open9': this.kA = decayCoef((k === 'Closed9' ? 0.03 : 0.2) * d, sr); b1.set('hp', 8200 * pm, 0.8, sr); b2.set('hp', 6000 * pm, 0.6, sr); break;
      case 'Crash9': this.kA = decayCoef(0.6 * d, sr); this.kA2 = decayCoef(0.08, sr); b1.set('bp', 6200 * pm, 0.5, sr); b2.set('hp', 4200 * pm, 0.7, sr); break;
      case 'Ride9': this.kA = decayCoef(0.45 * d, sr); this.kA2 = decayCoef(0.04, sr); b1.set('bp', 8400 * pm, 1.1, sr); b2.set('hp', 5200 * pm, 0.7, sr); break;
    }
  }
  metal(mul) { let s = 0; for (let i = 0; i < 6; i++) { this.ph[i] += METAL8[i] * mul * this.pm / this.sr; if (this.ph[i] >= 1) this.ph[i] -= 1; s += this.ph[i] < 0.5 ? 1 : -1; } return s / 6; }
  sine(i, hz) { this.ph[i] += hz / this.sr; if (this.ph[i] >= 1) this.ph[i] -= 1; return Math.sin(TWO_PI * this.ph[i]); }
  tick() {
    if (!this.on) return 0;
    const k = this.kind; let o = 0;
    switch (k) {
      case 'Kick8': { const s = this.sine(0, this.f0 * (1 + 1.3 * this.penv)); o = Math.tanh(1.4 * s * this.amp) * 0.95 + 0.25 * this.click * s; this.penv *= this.kP; this.amp *= this.kA; this.click *= this.kC; break; }
      case 'Kick9': { const s = this.sine(0, this.f0 * (1 + 3.6 * this.penv)), n = this.b1.run(this.rng.next()) * this.click; o = Math.tanh(2.2 * s * this.amp) * 0.85 + 0.5 * n; this.penv *= this.kP; this.amp *= this.kA; this.click *= this.kC; break; }
      case 'Snare8': { const tone = 0.6 * this.sine(0, this.f1hz) + 0.4 * this.sine(1, this.f2hz), n = this.b2.run(this.b1.run(this.rng.next())); o = 0.6 * tone * this.amp + 0.75 * n * this.amp2; this.amp *= this.kA; this.amp2 *= this.kA2; break; }
      case 'Snare9': { const pmul = 1 + 0.35 * this.penv, tone = 0.55 * this.sine(0, this.f1hz * pmul) + 0.45 * this.sine(1, this.f2hz * pmul), n = this.b2.run(this.b1.run(this.rng.next())); o = 0.55 * tone * this.amp + 0.85 * n * this.amp2; this.amp *= this.kA; this.amp2 *= this.kA2; this.penv *= this.kP; break; }
      case 'Tom8': { o = this.sine(0, this.f0 * (1 + 0.25 * this.penv)) * this.amp + 0.05 * this.rng.next() * this.amp2; this.amp *= this.kA; this.amp2 *= this.kA2; this.penv *= this.kP; break; }
      case 'Tom9': { o = 0.9 * this.sine(0, this.f0 * (1 + 0.55 * this.penv)) * this.amp + 0.25 * this.lp.run(this.rng.next()) * this.amp2; this.amp *= this.kA; this.amp2 *= this.kA2; this.penv *= this.kP; break; }
      case 'Rim8': case 'Rim9': { o = this.b1.run(0.6 * this.sine(0, this.f1hz) + 0.55 * this.sine(1, this.f2hz)) * this.amp; this.amp *= this.kA; break; }
      case 'Clap8': case 'Clap9': {
        const ms = this.t * 1000 / this.sr; let e;
        if (ms < 30) e = Math.exp(-(ms % 10) / 2.2); else { e = 0.75 * this.amp2; this.amp2 *= this.kA2; }
        let n = this.b1.run(this.rng.next()); if (k === 'Clap9') n = this.b2.run(n);
        o = n * e * 3; if (ms >= 30 && this.amp2 < 1e-4) this.on = false; break; }
      case 'Cowbell8': { const sq = (this.sine(0, this.f1hz) > 0 ? 1 : -1) + (this.sine(1, this.f2hz) > 0 ? 1 : -1); o = this.b1.run(sq * 0.5) * (0.65 * this.amp + 0.5 * this.amp2) * 1.05; this.amp *= this.kA; this.amp2 *= this.kA2; break; }
      case 'Closed8': case 'Open8': { o = this.b2.run(this.b1.run(this.metal(1))) * this.amp * 2.2; this.amp *= this.kA; break; }
      case 'Cymbal8': { o = this.b2.run(this.b1.run(this.metal(1))) * (0.7 * this.amp + 0.5 * this.amp2) * 2; this.amp *= this.kA; this.amp2 *= this.kA2; break; }
      case 'Closed9': case 'Open9': { o = this.b2.run(this.b1.run(0.6 * this.metal(1.55) + 0.6 * this.rng.next())) * this.amp * 1.2; this.amp *= this.kA; break; }
      case 'Crash9': { o = this.b2.run(this.b1.run(0.55 * this.metal(1.3) + 0.7 * this.rng.next())) * (0.7 * this.amp + 0.5 * this.amp2) * 1.2; this.amp *= this.kA; this.amp2 *= this.kA2; break; }
      case 'Ride9': { o = this.b2.run(this.b1.run(0.8 * this.metal(2.1) + 0.25 * this.rng.next())) * (0.7 * this.amp + 0.4 * this.amp2) * 1.8; this.amp *= this.kA; this.amp2 *= this.kA2; break; }
    }
    this.t++;
    if (k !== 'Clap8' && k !== 'Clap9' && this.amp < 1e-4 && this.amp2 < 1e-4) this.on = false;
    return o * this.gain;
  }
}
class DrumMachine {
  constructor(nine, sr) {
    const k8 = ['Kick8', 'Snare8', 'Tom8', 'Tom8', 'Tom8', 'Rim8', 'Clap8', 'Cowbell8', 'Closed8', 'Open8', 'Cymbal8'];
    const k9 = ['Kick9', 'Snare9', 'Tom9', 'Tom9', 'Tom9', 'Rim9', 'Clap9', 'Closed9', 'Open9', 'Crash9', 'Ride9'];
    this.v = (nine ? k9 : k8).map((k, i) => { const d = new DrumVoice(sr); d.kind = k; d.rng = new Noise(0x1234567 + i * 7919 + (nine ? 99991 : 0)); return d; });
    this.v[2].baseHz = nine ? 95 : 82; this.v[3].baseHz = nine ? 135 : 122; this.v[4].baseHz = nine ? 190 : 168;
    this.choker = nine ? 7 : 8; this.choked = nine ? 8 : 9;
  }
  hit(i, vel) { if (i === this.choker) this.v[this.choked].choke(); this.v[i].trigger(vel); }
  tick() { let s = 0; for (let i = 0; i < NV; i++) s += this.v[i].tick(); return s; }
  reset() { this.v.forEach(x => x.on = false); }
}

/* ---------------------------------------------------------------- acid bass */
class AcidVoice {
  constructor(sr) {
    this.sr = sr; this.wave = 0; this.tune = 0; this.cutoff = 500; this.reso = 0.7; this.envMod = 0.6; this.decaySec = 0.4; this.accentAmt = 0.6; this.drive = 0.2;
    this.osc = new Osc(); this.pitch = 36; this.target = 36; this.glideCoef = decayCoef(0.045, sr);
    this.gate = false; this.amp = 0; this.fenv = 0; this.kF = 0; this.accent = 0; this.accEnv = 0; this.s = [0, 0, 0, 0]; this.gateLeft = -1;
  }
  reset() { this.gate = false; this.amp = this.fenv = this.accEnv = 0; this.s = [0, 0, 0, 0]; this.gateLeft = -1; }
  noteOn(note, acc, slide, gateSamples) {
    this.target = note;
    if (!(slide && this.gate)) { this.pitch = this.target; this.fenv = 1; this.accent = acc ? 1 : 0; this.kF = decayCoef(acc ? 0.2 : this.decaySec, this.sr); if (acc) this.accEnv = 1; }
    this.gate = true; this.gateLeft = gateSamples;
  }
  noteOff() { this.gate = false; this.gateLeft = -1; }
  tick() {
    const sr = this.sr;
    if (this.gateLeft > 0 && --this.gateLeft === 0) this.gate = false;
    this.amp += ((this.gate ? 1 : 0) - this.amp) * (this.gate ? 0.02 : 0.004);
    if (!this.gate && this.amp < 1e-5) { this.amp = 0; return 0; }
    this.pitch = this.target + (this.pitch - this.target) * this.glideCoef;
    const hz = mtof(this.pitch + this.tune), dt = Math.min(0.45, hz / sr);
    const x = this.wave === 0 ? this.osc.saw(dt) : this.osc.square(dt) * 0.8;
    const sweep = this.fenv * (this.envMod * 4.5 + this.accent * this.accentAmt * 2) + this.accEnv * this.accentAmt * 1.2;
    const fc = clamp(this.cutoff * Math.pow(2, sweep), 20, sr * 0.42);
    this.fenv *= this.kF; this.accEnv *= decayCoef(0.12, sr);
    const g = Math.tan(PI * fc / sr), G = g / (1 + g), k = this.reso * 3.9, G2 = G * G, G3 = G2 * G, G4 = G3 * G, b = 1 - G, s = this.s;
    const S = G3 * b * s[0] + G2 * b * s[1] + G * b * s[2] + b * s[3];
    const y4 = (G4 * x + S) / (1 + k * G4);
    let u = Math.tanh(x - k * y4);
    for (let i = 0; i < 4; i++) { const v = (u - s[i]) * G, y = v + s[i]; s[i] = y + v; u = y; }
    let out = u * (1 + k * 0.35);
    const accGain = 1 + this.accent * this.accentAmt * 0.6;
    out = Math.tanh(out * (1 + this.drive * 6)) / Math.tanh(1 + this.drive * 6) * 0.9;
    return out * this.amp * accGain;
  }
}

/* ---------------------------------------------------------------- poly synth */
class PolyVoice { constructor() { this.o1 = new Osc(); this.o2 = new Osc(); this.note = -1; this.gate = false; this.vel = 1; this.env = 0; this.stage = 0; this.gateLeft = -1; this.s1 = 0; this.s2 = 0; this.age = 0; } }
class PolySynth {
  constructor(sr) {
    this.sr = sr; this.wave = 0; this.detune = 12; this.cutoff = 2500; this.reso = 0.2; this.envAmt = 0.4; this.att = 0.005; this.dec = 0.4; this.sus = 0.6; this.rel = 0.4; this.chorus = 0.4;
    this.v = []; for (let i = 0; i < 10; i++) this.v.push(new PolyVoice()); this.counter = 0;
    this.dl = new Float32Array(Math.floor(sr * 0.05) + 4); this.dw = 0; this.lfo1 = 0; this.lfo2 = 0.25; this.L = 0; this.R = 0;
  }
  reset() { this.v = []; for (let i = 0; i < 10; i++) this.v.push(new PolyVoice()); this.dl.fill(0); }
  noteOn(note, vel, gateSamples) {
    let pick = null;
    for (const x of this.v) if (x.note === note && x.stage) { pick = x; break; }
    if (!pick) for (const x of this.v) if (!x.stage) { pick = x; break; }
    if (!pick) { pick = this.v[0]; for (const x of this.v) if (x.age < pick.age) pick = x; }
    pick.note = note; pick.vel = vel; pick.gate = true; pick.stage = 1; pick.gateLeft = gateSamples; pick.age = ++this.counter;
  }
  noteOff(note) { for (const x of this.v) if (x.note === note && x.gate) { x.gate = false; x.stage = 3; x.gateLeft = -1; } }
  allOff() { for (const x of this.v) if (x.gate) { x.gate = false; x.stage = 3; } }
  tick() {
    const sr = this.sr, aC = 1 - decayCoef(this.att, sr), dC = 1 - decayCoef(this.dec, sr), rC = 1 - decayCoef(this.rel, sr);
    let sum = 0;
    for (const x of this.v) {
      if (!x.stage) continue;
      if (x.gateLeft > 0 && --x.gateLeft === 0) { x.gate = false; x.stage = 3; }
      if (x.stage === 1) { x.env += (1.2 - x.env) * aC; if (x.env >= 1) { x.env = 1; x.stage = 2; } }
      else if (x.stage === 2) x.env += (this.sus - x.env) * dC;
      else { x.env -= x.env * rC; if (x.env < 1e-5) { x.stage = 0; x.note = -1; continue; } }
      const hz = mtof(x.note), d = semis(this.detune / 100), dt1 = Math.min(0.45, hz / sr), dt2 = Math.min(0.45, hz * d / sr);
      let o;
      if (this.wave === 0) o = 0.5 * (x.o1.saw(dt1) + x.o2.saw(dt2));
      else if (this.wave === 1) o = 0.45 * (x.o1.square(dt1) + x.o2.square(dt2));
      else o = 0.5 * x.o1.saw(dt1) + 0.4 * x.o2.square(dt2);
      const fc = clamp(this.cutoff * Math.pow(2, this.envAmt * 5 * x.env), 20, sr * 0.42);
      const g = Math.tan(PI * fc / sr), k = 2 - 1.9 * this.reso, a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2;
      const v3 = o - x.s2, v1 = a1 * x.s1 + a2 * v3, v2 = x.s2 + a2 * x.s1 + a3 * v3;
      x.s1 = 2 * v1 - x.s1; x.s2 = 2 * v2 - x.s2;
      sum += v2 * x.env * x.vel;
    }
    sum *= 0.32;
    const N = this.dl.length, dl = this.dl; dl[this.dw] = sum;
    const tap = ms => { let pos = this.dw - ms * 0.001 * sr; while (pos < 0) pos += N; const i0 = Math.floor(pos), fr = pos - i0; return dl[i0 % N] * (1 - fr) + dl[(i0 + 1) % N] * fr; };
    this.lfo1 += 0.45 / sr; if (this.lfo1 >= 1) this.lfo1 -= 1; this.lfo2 += 0.53 / sr; if (this.lfo2 >= 1) this.lfo2 -= 1;
    const cl = tap(9 + 3 * Math.sin(TWO_PI * this.lfo1)), cr = tap(11 + 3 * Math.sin(TWO_PI * this.lfo2));
    this.dw = (this.dw + 1) % N;
    this.L = sum + this.chorus * 0.8 * (cl - 0.35 * sum); this.R = sum + this.chorus * 0.8 * (cr - 0.35 * sum);
  }
}

const CHORDS = [[0], [0, 4, 7], [0, 3, 7], [0, 4, 7, 11], [0, 3, 7, 10], [0, 5, 7], [0, 7, 12]];
const softLimit = x => { const k = 0.7, a = Math.abs(x); if (a <= k) return x; return Math.sign(x) * (k + (1 - k) * Math.tanh((a - k) / (1 - k))); };

class Engine {
  constructor(sr) {
    this.sr = sr; this.drums = [new DrumMachine(false, sr), new DrumMachine(true, sr)]; this.acid = new AcidVoice(sr); this.poly = new PolySynth(sr);
    this.sat = [new Saturator(), new Saturator(), new Saturator(), new Saturator()];
    this.values = new Float64Array(P.count); this.gain = [1, 1, 1, 1]; this.master = 0.7; this.swing = 0;
    this.pat = { drum: [0, 1].map(() => Array.from({ length: NV }, () => new Array(STEPS).fill(0))),
      acid: Array.from({ length: STEPS }, () => ({ note: 0, oct: 1, gate: 0, accent: 0, slide: 0 })),
      poly: Array.from({ length: STEPS }, () => ({ note: 0, oct: 1, gate: 0, chord: 0 })) };
    this.playing = false; this.tempo = 110; this.pos = 0; this.nextK = 0; this.stepSamples = 6000; this.onStep = null;
  }
  setValues(obj) { for (const k in obj) { const id = +k; if (id >= 0 && id < P.count) this.values[id] = obj[k]; } this.apply(); }
  apply() {
    const v = this.values;
    this.master = dbToGain(v[P.master]); this.swing = v[P.swing] / 100;
    for (let m = 0; m < 2; m++) for (let i = 0; i < NV; i++) { const d = this.drums[m].v[i], b = P.drum + m * NV * 3 + i * 3; d.level = v[b] / 100 * 0.9; d.tune = v[b + 1]; d.decay = v[b + 2] / 100; }
    const a = this.acid, A = P.acid;
    a.wave = v[A] | 0; a.tune = v[A + 1]; a.cutoff = v[A + 2]; a.reso = v[A + 3] / 100; a.envMod = v[A + 4] / 100; a.decaySec = v[A + 5] / 1000; a.accentAmt = v[A + 6] / 100; a.drive = v[A + 7] / 100;
    const y = this.poly, Y = P.poly;
    y.wave = v[Y] | 0; y.detune = v[Y + 1]; y.cutoff = v[Y + 2]; y.reso = v[Y + 3] / 100; y.envAmt = v[Y + 4] / 100; y.att = v[Y + 5] / 1000; y.dec = v[Y + 6] / 1000; y.sus = v[Y + 7] / 100; y.rel = v[Y + 8] / 1000; y.gate = v[Y + 9]; y.chorus = v[Y + 10] / 100;
    for (let m = 0; m < MACH; m++) { this.sat[m].drive = v[P.sat + m] / 100; this.gain[m] = v[P.mute + m] > 0.5 ? 0 : dbToGain(v[P.vol + m]); }
  }
  setTempo(t) { this.tempo = clamp(t, 40, 240); this.stepSamples = Math.max(1, Math.floor(this.sr / (this.tempo / 60 * 4))); }
  start() { this.playing = true; this.pos = 0; this.nextK = 0; }
  stop() { this.playing = false; this.acid.noteOff(); this.poly.allOff(); if (this.onStep) this.onStep(-1); }
  triggerStep(step) {
    const i = ((step % STEPS) + STEPS) % STEPS, p = this.pat;
    for (let m = 0; m < 2; m++) for (let v = 0; v < NV; v++) { const s = p.drum[m][v][i]; if (s) this.drums[m].hit(v, s === 2 ? 1 : 0.72); }
    const a = p.acid[i], prev = p.acid[(i + STEPS - 1) % STEPS], next = p.acid[(i + 1) % STEPS];
    if (a.gate) {
      const note = 36 + a.note + (a.oct - 1) * 12, slideIn = prev.gate && prev.slide, tie = a.slide && next.gate;
      this.acid.noteOn(note, !!a.accent, !!slideIn, tie ? -1 : Math.max(1, this.stepSamples >> 1));
      if (tie) this.acid.gateLeft = this.stepSamples + (this.stepSamples >> 2);
    } else if (this.acid.gate && this.acid.gateLeft < 0) this.acid.noteOff();
    const q = p.poly[i];
    if (q.gate) {
      const root = 48 + q.note + (q.oct - 1) * 12, len = Math.max(1, Math.floor(this.stepSamples * this.values[P.poly + 9] / 100));
      for (const iv of CHORDS[clamp(q.chord | 0, 0, 6)]) this.poly.noteOn(root + iv, 0.85, len);
    }
    if (this.onStep) this.onStep(i);
  }
  render(L, R, n) {
    const perSample = this.tempo / 60 * 4 / this.sr, g = this.gain, S = this.sat;
    for (let i = 0; i < n; i++) {
      if (this.playing) {
        for (;;) {
          const k = this.nextK, t = k + ((k & 1) ? this.swing * 0.34 : 0);
          if (t <= this.pos + 1e-9) { this.triggerStep(k); this.nextK++; } else break;
        }
        this.pos += perSample;
      }
      const d8 = S[0].process(this.drums[0].tick(), 0) * g[0], d9 = S[1].process(this.drums[1].tick(), 0) * g[1];
      const a = S[2].process(this.acid.tick(), 0) * g[2] * 0.55;
      this.poly.tick(); const pl = S[3].process(this.poly.L, 0) * g[3], pr = S[3].process(this.poly.R, 1) * g[3];
      const mono = (d8 + d9) * 0.5 + a;
      L[i] = softLimit((mono + pl) * this.master); R[i] = softLimit((mono + pr) * this.master);
    }
  }
  /* live playing */
  hit(m, v, vel) { if (m < 2 && v >= 0 && v < NV) this.drums[m].hit(v, 0.4 + 0.6 * (vel == null ? 0.85 : vel)); }
  noteOn(m, note, vel) { if (m === 2) this.acid.noteOn(note, vel > 0.85, this.acid.gate, -1); else this.poly.noteOn(note, 0.3 + 0.7 * vel, -1); }
  noteOff(m, note) { if (m === 2) { if (Math.round(this.acid.target) === note) this.acid.noteOff(); } else this.poly.noteOff(note); }
}

if (typeof registerProcessor !== 'undefined') {
  class BirthicaProcessor extends AudioWorkletProcessor {
    constructor() {
      super(); this.e = new Engine(sampleRate); this.last = -2;
      this.e.onStep = s => { this.port.postMessage({ step: s }); };
      this.port.onmessage = ev => {
        const m = ev.data, e = this.e;
        if (m.values) e.setValues(m.values);
        if (m.pattern) e.pat = m.pattern;
        if (m.tempo) e.setTempo(m.tempo);
        if (m.play === true) { e.setTempo(e.tempo); e.start(); } else if (m.play === false) e.stop();
        if (m.hit) e.hit(m.hit[0], m.hit[1], m.hit[2]);
        if (m.on) e.noteOn(m.on[0], m.on[1], m.on[2]);
        if (m.off) e.noteOff(m.off[0], m.off[1]);
      };
    }
    process(inputs, outputs) { const o = outputs[0]; if (o.length >= 2) this.e.render(o[0], o[1], o[0].length); else if (o.length === 1) { const r = new Float32Array(o[0].length); this.e.render(o[0], r, o[0].length); } return true; }
  }
  registerProcessor('birthica', BirthicaProcessor);
}
if (typeof module !== 'undefined') module.exports = { Engine, P, NV, STEPS };
