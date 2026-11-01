// node render.js <id> <preset> <out.f32>  (runs the original web engine with the same events)
const fs = require('fs'); const vm = require('vm');
const code = fs.readFileSync(__dirname + '/../../Synths/worklet.js', 'utf8'); const ctx = { globalThis: null, Math, Float64Array, Float32Array, Int32Array, Uint32Array, Uint8Array, Array, Object, Infinity, console };
ctx.globalThis = ctx; vm.createContext(ctx); vm.runInContext(code, ctx);
const [, , id, preset, out] = process.argv; const d = ctx.OCC.engines[id]; const sr = 48000, e = d.make(sr);
d.specs.forEach((s, i) => { if (i > 0) e.set(i, s.def); }); e.writes = []; if (+preset >= 0) e.set(0, +preset);
const total = sr * 3, B = 128, L = new Float32Array(B), R = new Float32Array(B), o = new Float32Array(total * 2);
for (let pos = 0; pos < total; pos += B) {
  if (pos === 0) e.noteOn(60, 0.8); if (pos === 128 * 75) e.noteOn(64, 0.7); if (pos === 128 * 150) e.noteOff(60); if (pos === 128 * 170) e.noteOn(48, 1.0); if (pos === 128 * 225) e.noteOff(64);
  e.process(L, R, B); for (let i = 0; i < B; ++i) { o[(pos + i) * 2] = L[i]; o[(pos + i) * 2 + 1] = R[i]; }
}
fs.writeFileSync(out, Buffer.from(o.buffer));
