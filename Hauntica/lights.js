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
  const HUE = '932c32bd-0000-47a2-835a-a8d455b859dd', HC = n => '932c32bd-000' + n + '-47a2-835a-a8d455b859dd';
  const lin = v => { v /= 255; return v > .04045 ? Math.pow((v + .055) / 1.055, 2.4) : v / 12.92; };
  function xyOf(r, g, b) { r = lin(r); g = lin(g); b = lin(b); const X = r * .649926 + g * .103455 + b * .197109, Y = r * .234327 + g * .743075 + b * .022598, Z = g * .053077 + b * 1.035763, sum = X + Y + Z; return sum > 0 ? [X / sum, Y / sum] : [.3127, .329]; }
  const L = { lights: [], on: false, mode: 'off', color: '#ff2a00', bright: 1, t0: 0, timer: null, last: 0 };
  const hex = c => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); const v = m ? parseInt(m[1], 16) : 0xff2a00; return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
  L.supported = () => !!(navigator.bluetooth && navigator.bluetooth.requestDevice);
  L.fams = FAM;
  async function write(li, bytes) { if (!li.chr) return; const d = new Uint8Array(bytes); li.q = (li.q || Promise.resolve()).then(() => (li.chr.writeValueWithoutResponse ? li.chr.writeValueWithoutResponse(d) : li.chr.writeValue(d))).catch(() => { }); return li.q; }
  L.connect = async function () {
    const dev = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: FAM.map(f => f.svc) });
    if (L.lights.some(x => x.dev.id === dev.id)) return;
    const server = await dev.gatt.connect(); let fam = null, chr = null;
    try { const hs = await server.getPrimaryService(HUE); const ch = { pw: await hs.getCharacteristic(HC(2)), br: await hs.getCharacteristic(HC(3)), xy: await hs.getCharacteristic(HC(5)) }; const li = { dev, server, hue: ch, fam: { id: 'hue', label: 'Philips Hue (Bluetooth)' }, name: dev.name || 'Hue light', bright: 1, ready: true }; L.lights.push(li); dev.addEventListener('gattserverdisconnected', () => { li.ready = false; if (L.onchange) L.onchange(); }); await ch.pw.writeValue(new Uint8Array([1])); if (L.onchange) L.onchange(); return li; } catch (e) { if (e && e.name === 'SecurityError') throw e; }
    for (const f of FAM) { try { const s = await server.getPrimaryService(f.svc); chr = await s.getCharacteristic(f.chr); fam = f; break; } catch (e) { } }
    if (!fam) { try { dev.gatt.disconnect(); } catch (e) { } throw new Error('Connected to ' + (dev.name || 'a device') + ' but it does not use a known light protocol'); }
    const li = { dev, server, chr, fam, name: dev.name || 'Light', off: 0, bright: 1, ready: true }; L.lights.push(li);
    dev.addEventListener('gattserverdisconnected', () => { li.chr = null; li.ready = false; if (L.onchange) L.onchange(); });
    await write(li, fam.on); if (L.onchange) L.onchange(); return li;
  };
  L.reconnect = async li => { if (li.hue) { li.server = await li.dev.gatt.connect(); const hs = await li.server.getPrimaryService(HUE); li.hue = { pw: await hs.getCharacteristic(HC(2)), br: await hs.getCharacteristic(HC(3)), xy: await hs.getCharacteristic(HC(5)) }; li.ready = true; if (L.onchange) L.onchange(); return; } li.server = await li.dev.gatt.connect(); const s = await li.server.getPrimaryService(li.fam.svc); li.chr = await s.getCharacteristic(li.fam.chr); li.ready = true; await write(li, li.fam.on); if (L.onchange) L.onchange(); };
  L.disconnect = li => { try { if (li.dev) li.dev.gatt.disconnect(); } catch (e) { } L.lights = L.lights.filter(x => x !== li); if (L.onchange) L.onchange(); };
  /* Hue: brightness = the largest colour component, colour = the same colour at full strength, sent as CIE xy */
  function hueSet(li, r, g, b, k) {
    const m = Math.max(r, g, b) * k, on = m >= 2, bri = Math.max(1, Math.min(254, Math.round(m / 255 * 254))), n = Math.max(r, g, b) || 1, xy = xyOf(r / n * 255, g / n * 255, b / n * 255);
    if (li.bridge) { const B = li.bridge, body = on ? { on: true, bri, xy: [+xy[0].toFixed(4), +xy[1].toFixed(4)], transitiontime: 1 } : { on: false, transitiontime: 1 }; return fetch('https://' + B.ip + '/api/' + B.user + '/lights/' + li.lid + '/state', { method: 'PUT', body: JSON.stringify(body) }).catch(() => { li.ready = false; }); }
    const H = li.hue, u16 = v => Math.round(Math.max(0, Math.min(1, v)) * 65535), d = new Uint8Array([u16(xy[0]) & 255, u16(xy[0]) >> 8, u16(xy[1]) & 255, u16(xy[1]) >> 8]);
    li.q = (li.q || Promise.resolve()).then(async () => { await H.pw.writeValue(new Uint8Array([on ? 1 : 0])); if (on) { await H.br.writeValue(new Uint8Array([bri])); await H.xy.writeValue(d); } }).catch(() => { }); return li.q;
  }
  L.setRGB = (li, r, g, b) => { const k = L.bright * li.bright; if (li.hue || li.bridge) return hueSet(li, r, g, b, k); const c = v => Math.max(0, Math.min(255, Math.round(v * k))); return write(li, li.fam.rgb(c(r), c(g), c(b))); };
  /* Hue Bridge (local network): press the round bridge button, then Link. Needs the bridge address; the browser must have accepted the bridge's certificate once (open https://address in a tab). */
  L.bridgeLink = async ip => { const r = await fetch('https://' + ip + '/api', { method: 'POST', body: JSON.stringify({ devicetype: 'hauntica#browser' }) }), j = await r.json(); if (j[0] && j[0].error) throw new Error(j[0].error.type === 101 ? 'Press the round button on the bridge first, then try again' : j[0].error.description); return j[0].success.username; };
  L.bridgeLights = async (ip, user) => { const r = await fetch('https://' + ip + '/api/' + user + '/lights'), j = await r.json(); return Object.keys(j).map(id => ({ id, name: j[id].name, color: !!(j[id].state && j[id].state.xy) })); };
  L.addBridgeLight = (ip, user, id, name) => { if (L.lights.some(x => x.bridge && x.bridge.ip === ip && x.lid === id)) return; L.lights.push({ bridge: { ip, user }, lid: id, fam: { id: 'hueb', label: 'Philips Hue (bridge)' }, name, bright: 1, ready: true }); if (L.onchange) L.onchange(); };
  L.all = (r, g, b) => L.lights.forEach(li => L.setRGB(li, r, g, b));
  L.power = on => L.lights.forEach(li => { if (li.hue || li.bridge) hueSet(li, on ? 255 : 0, on ? 255 : 0, on ? 255 : 0, 1); else write(li, on ? li.fam.on : li.fam.off); });
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
    const tick = () => { const t = (performance.now() - L.t0) / 1000, base = hex(L.color); L.lights.forEach((li, k) => { if (!li.ready) return; let r = FX[mode](t, k), c = base; if (r && typeof r === 'object') { c = r.c || base; r = r.b; } L.setRGB(li, c[0] * r, c[1] * r, c[2] * r); }); };
    tick(); if (mode !== 'solid') L.timer = setInterval(tick, L.lights.some(x => x.bridge) ? 250 : 90);
  };
  window.HL = L;
})();
