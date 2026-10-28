/* Hauntica lights: Bluetooth LE "Happy Lighting" style LED controllers through Web Bluetooth (Chrome or Edge).
   These cheap controllers come in a few families. Two common protocols are built in and the right one is picked from the services the light offers.
   NOT TESTED on real lights yet: use the Lights tab, Connect, then the red/green/blue test buttons. */
(function () {
  const U = h => ({ s: h, c: null });
  const FAM = [
    { id: 'elk', label: 'ELK-BLEDOM type (7E ... EF)', svc: 0xfff0, chr: 0xfff3, rgb: (r, g, b) => [0x7e, 0x07, 0x05, 0x03, r, g, b, 0x10, 0xef], on: [0x7e, 0x00, 0x04, 0xf0, 0x00, 0x01, 0xff, 0x00, 0xef], off: [0x7e, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0x00, 0xef] },
    { id: 'tri', label: 'Triones / LEDnet type (56 ... AA)', svc: 0xffd5, chr: 0xffd9, rgb: (r, g, b) => [0x56, r, g, b, 0x00, 0xf0, 0xaa], on: [0xcc, 0x23, 0x33], off: [0xcc, 0x24, 0x33] },
    { id: 'tri2', label: 'Triones type, alternate service', svc: 0xffe5, chr: 0xffe9, rgb: (r, g, b) => [0x56, r, g, b, 0x00, 0xf0, 0xaa], on: [0xcc, 0x23, 0x33], off: [0xcc, 0x24, 0x33] }
  ];
  const L = { lights: [], on: false, mode: 'off', color: '#ff2a00', bright: 1, t0: 0, timer: null, last: 0 };
  const hex = c => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); const v = m ? parseInt(m[1], 16) : 0xff2a00; return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
  L.supported = () => !!(navigator.bluetooth && navigator.bluetooth.requestDevice);
  L.fams = FAM;
  async function write(li, bytes) { if (!li.chr) return; const d = new Uint8Array(bytes); li.q = (li.q || Promise.resolve()).then(() => (li.chr.writeValueWithoutResponse ? li.chr.writeValueWithoutResponse(d) : li.chr.writeValue(d))).catch(() => { }); return li.q; }
  L.connect = async function () {
    const dev = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: FAM.map(f => f.svc) });
    if (L.lights.some(x => x.dev.id === dev.id)) return;
    const server = await dev.gatt.connect(); let fam = null, chr = null;
    for (const f of FAM) { try { const s = await server.getPrimaryService(f.svc); chr = await s.getCharacteristic(f.chr); fam = f; break; } catch (e) { } }
    if (!fam) { try { dev.gatt.disconnect(); } catch (e) { } throw new Error('Connected to ' + (dev.name || 'a device') + ' but it does not use a known light protocol'); }
    const li = { dev, server, chr, fam, name: dev.name || 'Light', off: 0, bright: 1 }; L.lights.push(li);
    dev.addEventListener('gattserverdisconnected', () => { li.chr = null; if (L.onchange) L.onchange(); });
    await write(li, fam.on); if (L.onchange) L.onchange(); return li;
  };
  L.reconnect = async li => { li.server = await li.dev.gatt.connect(); const s = await li.server.getPrimaryService(li.fam.svc); li.chr = await s.getCharacteristic(li.fam.chr); await write(li, li.fam.on); if (L.onchange) L.onchange(); };
  L.disconnect = li => { try { li.dev.gatt.disconnect(); } catch (e) { } L.lights = L.lights.filter(x => x !== li); if (L.onchange) L.onchange(); };
  L.setRGB = (li, r, g, b) => { const k = L.bright * li.bright, c = v => Math.max(0, Math.min(255, Math.round(v * k))); return write(li, li.fam.rgb(c(r), c(g), c(b))); };
  L.all = (r, g, b) => L.lights.forEach(li => L.setRGB(li, r, g, b));
  L.power = on => L.lights.forEach(li => write(li, on ? li.fam.on : li.fam.off));
  /* effects: f(t, k) returns a brightness 0..1 (and optionally a colour override) for light k */
  const noise = (t, s) => { const x = Math.sin(t * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
  const FX = {
    solid: () => 1,
    breathe: t => .15 + .85 * (.5 + .5 * Math.sin(t * 1.1)),
    pulse: t => { const p = t % .85; return .08 + .92 * Math.max(Math.exp(-p * 14), .7 * Math.exp(-Math.max(0, p - .28) * 14) * (p > .28 ? 1 : 0)); },
    flicker: (t, k) => .35 + .65 * noise(Math.floor(t * 14), k + 1) * (.6 + .4 * noise(Math.floor(t * 3), k)),
    fire: (t, k) => { const v = .4 + .6 * noise(Math.floor(t * 16), k + 3); return { b: v, c: [255, 30 + 90 * noise(Math.floor(t * 16), k + 9), 0] }; },
    lightning: (t, k) => { const cyc = t % 9 + k * 1.3, f = [[7.2, .12], [7.4, .08], [7.62, .25]].some(([a, d]) => cyc > a && cyc < a + d); return f ? { b: 1, c: [220, 230, 255] } : .06; }
  };
  L.modes = [['off', 'Lights off'], ['solid', 'Solid color'], ['breathe', 'Slow breathe'], ['pulse', 'Heartbeat pulse'], ['flicker', 'Candle flicker'], ['fire', 'Fire'], ['lightning', 'Lightning storm']];
  L.set = (mode, color) => {
    L.mode = mode; L.color = color || L.color; L.t0 = performance.now(); clearInterval(L.timer);
    if (mode === 'off') { L.all(0, 0, 0); return; }
    const tick = () => { const t = (performance.now() - L.t0) / 1000, base = hex(L.color); L.lights.forEach((li, k) => { if (!li.chr) return; let r = FX[mode](t, k), c = base; if (r && typeof r === 'object') { c = r.c || base; r = r.b; } L.setRGB(li, c[0] * r, c[1] * r, c[2] * r); }); };
    tick(); if (mode !== 'solid') L.timer = setInterval(tick, 90);
  };
  window.HL = L;
})();
