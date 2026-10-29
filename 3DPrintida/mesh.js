/* 3DPrintida geometry: every shape is a flat array of triangles [x,y,z, x,y,z, x,y,z, ...] in millimetres, Z up, outward normals (counter-clockwise). */
(function () {
  const G = {};
  G.quad = (t, a, b, c, d) => { t.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]); };
  G.tri = (t, a, b, c) => { t.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); };
  G.box = (t, x0, y0, z0, x1, y1, z1) => {
    const q = G.quad;
    q(t, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); q(t, [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]);
    q(t, [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]); q(t, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    q(t, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]); q(t, [x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]);
  };
  /* vertical tube (ri = 0 for a solid cylinder) */
  G.tube = (t, cx, cy, ro, ri, z0, z1, n) => {
    n = n || 64; const P = (r, a, z) => [cx + r * Math.cos(a), cy + r * Math.sin(a), z];
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      G.quad(t, P(ro, a0, z0), P(ro, a1, z0), P(ro, a1, z1), P(ro, a0, z1));
      if (ri > 0) { G.quad(t, P(ri, a1, z0), P(ri, a0, z0), P(ri, a0, z1), P(ri, a1, z1)); G.quad(t, P(ro, a0, z1), P(ro, a1, z1), P(ri, a1, z1), P(ri, a0, z1)); G.quad(t, P(ri, a0, z0), P(ri, a1, z0), P(ro, a1, z0), P(ro, a0, z0)); }
      else { G.tri(t, [cx, cy, z1], P(ro, a0, z1), P(ro, a1, z1)); G.tri(t, [cx, cy, z0], P(ro, a1, z0), P(ro, a0, z0)); }
    }
  };
  /* polygon (counter-clockwise, in the X-Z plane) extruded along Y; ear-clipping triangulation */
  function area2(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
  function earclip(p) {
    const idx = p.map((_, i) => i), out = []; let guard = 0; const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    while (idx.length > 3 && guard++ < 5000) {
      let cut = false;
      for (let k = 0; k < idx.length; k++) {
        const i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length], a = p[i0], b = p[i1], c = p[i2];
        if (cr(a, b, c) <= 1e-9) continue; let ok = true;
        for (const j of idx) { if (j === i0 || j === i1 || j === i2) continue; const q = p[j]; if (cr(a, b, q) >= 0 && cr(b, c, q) >= 0 && cr(c, a, q) >= 0) { ok = false; break; } }
        if (ok) { out.push([i0, i1, i2]); idx.splice(k, 1); cut = true; break; }
      }
      if (!cut) break;
    }
    if (idx.length === 3) out.push([idx[0], idx[1], idx[2]]); return out;
  }
  G.extrudeXZ = (t, pts, y0, y1) => {
    if (area2(pts) < 0) pts = pts.slice().reverse(); const T = earclip(pts), P = (p, y) => [p[0], y, p[1]];
    T.forEach(([a, b, c]) => { G.tri(t, P(pts[a], y0), P(pts[b], y0), P(pts[c], y0)); G.tri(t, P(pts[a], y1), P(pts[c], y1), P(pts[b], y1)); });
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; G.quad(t, P(a, y0), P(a, y1), P(b, y1), P(b, y0)); }
  };
  /* binary mask (Uint8Array W*H, row 0 = TOP of the picture) -> prism between z0 and z1, pixel size px */
  G.maskPrism = (t, m, W, H, px, z0, z1) => {
    const f = (i, r) => i >= 0 && i < W && r >= 0 && r < H && m[(H - 1 - r) * W + i] > 0;      /* r counts upwards */
    const X = i => i * px, Y = r => r * px, q = G.quad;
    /* top and bottom: merge pixels along a row, then stack identical runs */
    let prev = {};
    const flush = (cur) => { for (const k in prev) if (!cur[k]) { const o = prev[k]; emit(o); } prev = cur; };
    const emit = o => { q(t, [X(o.i0), Y(o.r0), z1], [X(o.i1), Y(o.r0), z1], [X(o.i1), Y(o.r1), z1], [X(o.i0), Y(o.r1), z1]); q(t, [X(o.i0), Y(o.r0), z0], [X(o.i0), Y(o.r1), z0], [X(o.i1), Y(o.r1), z0], [X(o.i1), Y(o.r0), z0]); };
    for (let r = 0; r < H; r++) {
      const cur = {};
      for (let i = 0; i < W;) { if (!f(i, r)) { i++; continue; } let j = i; while (j < W && f(j, r)) j++; const key = i + ',' + j; cur[key] = prev[key] ? Object.assign(prev[key], { r1: r + 1 }) : { i0: i, i1: j, r0: r, r1: r + 1 }; i = j; }
      flush(cur);
    }
    flush({});
    /* walls */
    for (let i = 0; i <= W; i++) for (let r = 0; r < H;) {         /* faces toward -x / +x at x = i */
      const L = f(i, r) && !f(i - 1, r), Rr = f(i - 1, r) && !f(i, r); if (!L && !Rr) { r++; continue; } let e = r; while (e < H && (L ? (f(i, e) && !f(i - 1, e)) : (f(i - 1, e) && !f(i, e)))) e++;
      if (L) q(t, [X(i), Y(r), z0], [X(i), Y(r), z1], [X(i), Y(e), z1], [X(i), Y(e), z0]); else q(t, [X(i), Y(r), z0], [X(i), Y(e), z0], [X(i), Y(e), z1], [X(i), Y(r), z1]); r = e;
    }
    for (let r = 0; r <= H; r++) for (let i = 0; i < W;) {         /* faces toward -y / +y at y = r */
      const F = f(i, r) && !f(i, r - 1), B = f(i, r - 1) && !f(i, r); if (!F && !B) { i++; continue; } let e = i; while (e < W && (F ? (f(e, r) && !f(e, r - 1)) : (f(e, r - 1) && !f(e, r)))) e++;
      if (F) q(t, [X(i), Y(r), z0], [X(e), Y(r), z0], [X(e), Y(r), z1], [X(i), Y(r), z1]); else q(t, [X(i), Y(r), z0], [X(i), Y(r), z1], [X(e), Y(r), z1], [X(e), Y(r), z0]); i = e;
    }
  };
  /* height field (Float32Array W*H, row 0 = TOP) -> solid slab: top surface follows the heights, flat bottom. Vertices at pixel centres. */
  G.heightSlab = (t, h, W, H, px) => {
    const V = (i, j) => [i * px, (H - 1 - j) * px, h[j * W + i]], B = (i, j) => [i * px, (H - 1 - j) * px, 0];
    for (let j = 0; j < H - 1; j++) for (let i = 0; i < W - 1; i++) { G.tri(t, V(i, j), V(i, j + 1), V(i + 1, j)); G.tri(t, V(i + 1, j), V(i, j + 1), V(i + 1, j + 1)); }
    const per = []; for (let i = 0; i < W; i++) per.push([i, H - 1]); for (let j = H - 2; j >= 0; j--) per.push([W - 1, j]); for (let i = W - 2; i >= 0; i--) per.push([i, 0]); for (let j = 1; j < H - 1; j++) per.push([0, j]);
    for (let k = 0; k < per.length; k++) { const a = per[k], b = per[(k + 1) % per.length]; G.quad(t, B(a[0], a[1]), B(b[0], b[1]), V(b[0], b[1]), V(a[0], a[1])); }
    const c = [(W - 1) * px / 2, (H - 1) * px / 2, 0]; for (let k = 0; k < per.length; k++) { const a = per[k], b = per[(k + 1) % per.length]; G.tri(t, c, B(b[0], b[1]), B(a[0], a[1])); }
  };
  /* ---- analysis ---- */
  G.stats = tr => {
    let vol = 0, ov = 0, mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let i = 0; i < tr.length; i += 9) {
      const ax = tr[i], ay = tr[i + 1], az = tr[i + 2], bx = tr[i + 3], by = tr[i + 4], bz = tr[i + 5], cx = tr[i + 6], cy = tr[i + 7], cz = tr[i + 8];
      vol += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
      const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az, nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
      if (nz / l < -0.5 && Math.min(az, bz, cz) > 0.3) ov += l / 2;
      [[ax, ay, az], [bx, by, bz], [cx, cy, cz]].forEach(p => { for (let k = 0; k < 3; k++) { if (p[k] < mn[k]) mn[k] = p[k]; if (p[k] > mx[k]) mx[k] = p[k]; } });
    }
    return { vol: Math.abs(vol), overhang: ov, min: mn, max: mx, size: [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]], n: tr.length / 9 };
  };
  G.center = tr => { const s = G.stats(tr), dx = -(s.min[0] + s.max[0]) / 2, dy = -(s.min[1] + s.max[1]) / 2, dz = -s.min[2], o = new Float32Array(tr.length); for (let i = 0; i < tr.length; i += 3) { o[i] = tr[i] + dx; o[i + 1] = tr[i + 1] + dy; o[i + 2] = tr[i + 2] + dz; } return o; };
  /* ---- export ---- */
  G.stl = (tr, name) => {
    const n = tr.length / 9, buf = new ArrayBuffer(84 + n * 50), v = new DataView(buf), hd = ('3DPrintida ' + (name || '')).slice(0, 79); for (let i = 0; i < hd.length; i++) v.setUint8(i, hd.charCodeAt(i)); v.setUint32(80, n, true);
    for (let t = 0, o = 84; t < n; t++, o += 50) { const b = t * 9, ux = tr[b + 3] - tr[b], uy = tr[b + 4] - tr[b + 1], uz = tr[b + 5] - tr[b + 2], vx = tr[b + 6] - tr[b], vy = tr[b + 7] - tr[b + 1], vz = tr[b + 8] - tr[b + 2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; [nx, ny, nz].forEach((x, k) => v.setFloat32(o + k * 4, x, true)); for (let k = 0; k < 9; k++) v.setFloat32(o + 12 + k * 4, tr[b + k], true); }
    return new Blob([buf], { type: 'model/stl' });
  };
  const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc = u8 => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = crcT[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function zip(files) {   /* store-only zip */
    const enc = new TextEncoder(), parts = [], cd = []; let off = 0;
    files.forEach(f => { const nm = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, c = crc(data), h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(8, 0, true); h.setUint32(14, c, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true); parts.push(new Uint8Array(h.buffer), nm, data);
      const d = new DataView(new ArrayBuffer(46)); d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint32(16, c, true); d.setUint32(20, data.length, true); d.setUint32(24, data.length, true); d.setUint16(28, nm.length, true); d.setUint32(42, off, true); cd.push(new Uint8Array(d.buffer), nm); off += 30 + nm.length + data.length; });
    const cdLen = cd.reduce((s, x) => s + x.length, 0), e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdLen, true); e.setUint32(16, off, true);
    return new Blob(parts.concat(cd, [new Uint8Array(e.buffer)]), { type: 'application/octet-stream' });
  }
  G.threeMF = (tr, name) => {
    const map = new Map(), vs = [], ts = []; const key = (x, y, z) => Math.round(x * 1e4) + ',' + Math.round(y * 1e4) + ',' + Math.round(z * 1e4);
    for (let i = 0; i < tr.length; i += 3) { const k = key(tr[i], tr[i + 1], tr[i + 2]); let id = map.get(k); if (id === undefined) { id = vs.length / 3; map.set(k, id); vs.push(+tr[i].toFixed(4), +tr[i + 1].toFixed(4), +tr[i + 2].toFixed(4)); } ts.push(id); }
    let v = '', t = ''; for (let i = 0; i < vs.length; i += 3) v += '<vertex x="' + vs[i] + '" y="' + vs[i + 1] + '" z="' + vs[i + 2] + '"/>'; for (let i = 0; i < ts.length; i += 3) if (ts[i] !== ts[i + 1] && ts[i + 1] !== ts[i + 2] && ts[i] !== ts[i + 2]) t += '<triangle v1="' + ts[i] + '" v2="' + ts[i + 1] + '" v3="' + ts[i + 2] + '"/>';
    const model = '<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">' + (name || 'Part').replace(/[<>&"]/g, '') + '</metadata><metadata name="Application">3DPrintida</metadata><resources><object id="1" type="model"><mesh><vertices>' + v + '</vertices><triangles>' + t + '</triangles></mesh></object></resources><build><item objectid="1"/></build></model>';
    return zip([{ name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>' }, { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>' }, { name: '3D/3dmodel.model', data: model }]);
  };
  window.G3 = G;
})();
