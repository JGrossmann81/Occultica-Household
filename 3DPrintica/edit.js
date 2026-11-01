/* 3DPrintica edit tools: pure functions on flat triangle arrays (Float32Array/Array, mm, Z up). Exposed as window.E3 (and module.exports for tests). */
(function () {
  const E = {};
  const F = a => (a instanceof Float32Array ? a : Float32Array.from(a));
  const bounds = t => { const mn = [1e30, 1e30, 1e30], mx = [-1e30, -1e30, -1e30]; for (let i = 0; i < t.length; i += 3) for (let k = 0; k < 3; k++) { const v = t[i + k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; } return { mn, mx, size: [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]] }; };
  E.bounds = bounds;

  /* ---- transforms ---- */
  E.translate = (t, dx, dy, dz) => { const o = F(t).slice(); for (let i = 0; i < o.length; i += 3) { o[i] += dx; o[i + 1] += dy; o[i + 2] += dz; } return o; };
  E.scale = (t, sx, sy, sz) => {
    sy = sy === undefined ? sx : sy; sz = sz === undefined ? sx : sz; const o = F(t).slice();
    for (let i = 0; i < o.length; i += 3) { o[i] *= sx; o[i + 1] *= sy; o[i + 2] *= sz; }
    return (sx * sy * sz < 0) ? E.flip(o) : o;
  };
  /* swap triangle winding so normals point the other way (needed after any mirror) */
  E.flip = t => { const o = F(t).slice(); for (let i = 0; i < o.length; i += 9) for (let k = 0; k < 3; k++) { const a = o[i + 3 + k]; o[i + 3 + k] = o[i + 6 + k]; o[i + 6 + k] = a; } return o; };
  E.mirror = (t, axis) => { const s = [1, 1, 1]; s[axis] = -1; return E.scale(t, s[0], s[1], s[2]); };
  /* rotate by degrees about X, Y or Z (axis 0,1,2) through the origin */
  E.rotate = (t, axis, deg) => {
    const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), o = F(t).slice(), i1 = (axis + 1) % 3, i2 = (axis + 2) % 3;
    for (let i = 0; i < o.length; i += 3) { const u = o[i + i1], v = o[i + i2]; o[i + i1] = u * c - v * s; o[i + i2] = u * s + v * c; }
    return o;
  };
  /* rotate so that unit vector n (a face normal) points straight down */
  E.rotateToDown = (t, n) => {
    const l = Math.hypot(n[0], n[1], n[2]); n = [n[0] / l, n[1] / l, n[2] / l];
    const d = n[2] * -1; /* dot(n, -z) */
    if (d > 0.999999) return F(t).slice();
    let ax = [-n[1], n[0], 0]; /* n x (-z) = (-n1*... ) rotation axis */
    ax = [n[1] * -1 - 0, n[0], 0]; /* cross(n, [0,0,-1]) = (n1*-1 - n2*0, n2*0 - n0*-1, 0) = (-n1, n0, 0) */
    let al = Math.hypot(ax[0], ax[1]);
    if (al < 1e-9) { /* pointing straight up: flip over X */ return E.rotate(t, 0, 180); }
    ax = [ax[0] / al, ax[1] / al, 0]; const ang = Math.acos(Math.max(-1, Math.min(1, d))), c = Math.cos(ang), s = Math.sin(ang), o = F(t).slice();
    for (let i = 0; i < o.length; i += 3) { /* Rodrigues */
      const x = o[i], y = o[i + 1], z = o[i + 2], kx = ax[0], ky = ax[1], dot = kx * x + ky * y;
      const cx = ky * z, cy = -kx * z, cz = kx * y - ky * x;
      o[i] = x * c + cx * s + kx * dot * (1 - c); o[i + 1] = y * c + cy * s + ky * dot * (1 - c); o[i + 2] = z * c + cz * s;
    }
    return o;
  };
  /* drop to z = 0 and centre on x/y */
  E.ground = t => { const b = bounds(t); return E.translate(t, -(b.mn[0] + b.mx[0]) / 2, -(b.mn[1] + b.mx[1]) / 2, -b.mn[2]); };

  /* ---- auto-orient: try each large flat face as the base, score = overhang area*3 + height*0.02 - contact ---- */
  E.orientScore = t => {
    let ov = 0, contact = 0, mnz = 1e30, mxz = -1e30;
    for (let i = 0; i < t.length; i += 3) { if (t[i + 2] < mnz) mnz = t[i + 2]; if (t[i + 2] > mxz) mxz = t[i + 2]; }
    for (let i = 0; i < t.length; i += 9) {
      const ux = t[i + 3] - t[i], uy = t[i + 4] - t[i + 1], uz = t[i + 5] - t[i + 2], vx = t[i + 6] - t[i], vy = t[i + 7] - t[i + 1], vz = t[i + 8] - t[i + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1, a = l / 2, zc = Math.min(t[i + 2], t[i + 5], t[i + 8]);
      if (nz / l < -0.7071) { if (zc - mnz < 0.2) contact += a; else ov += a; }
    }
    return { overhang: ov, contact, height: mxz - mnz };
  };
  E.autoOrient = t => {
    t = F(t); const groups = new Map();
    for (let i = 0; i < t.length; i += 9) {
      const ux = t[i + 3] - t[i], uy = t[i + 4] - t[i + 1], uz = t[i + 5] - t[i + 2], vx = t[i + 6] - t[i], vy = t[i + 7] - t[i + 1], vz = t[i + 8] - t[i + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz); if (l < 1e-12) continue;
      const key = Math.round(nx / l * 20) + ',' + Math.round(ny / l * 20) + ',' + Math.round(nz / l * 20), g = groups.get(key) || { n: [0, 0, 0], a: 0 };
      g.n[0] += nx / l * l / 2; g.n[1] += ny / l * l / 2; g.n[2] += nz / l * l / 2; g.a += l / 2; groups.set(key, g);
    }
    const cands = [...groups.values()].sort((a, b) => b.a - a.a).slice(0, 14).map(g => g.n);
    cands.push([0, 0, -1], [0, 0, 1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]);
    let best = null;
    for (const n of cands) {
      const r = E.rotateToDown(t, n), s = E.orientScore(r), score = s.overhang * 3 - s.contact * 1.5 + s.height * 2;
      if (!best || score < best.score) best = { score, t: r, s };
    }
    return { tris: E.ground(best.t), info: best.s };
  };

  /* ---- plane cut with cap. plane: axis (0,1,2) at position d. Returns {low, high}: closed solids ---- */
  E.cut = (t, axis, d) => {
    t = F(t); const low = [], high = [], segs = []; const A = axis, eps = 1e-6;
    const P = (t, i) => [t[i], t[i + 1], t[i + 2]];
    for (let i = 0; i < t.length; i += 9) {
      const v = [P(t, i), P(t, i + 3), P(t, i + 6)]; const s = v.map(p => { const q = p[A] - d; return Math.abs(q) < eps ? 0 : q; });
      const push = (arr, poly) => { for (let k = 1; k < poly.length - 1; k++) arr.push(...poly[0], ...poly[k], ...poly[k + 1]); };
      if (s.every(x => x >= 0)) { if (s.some(x => x > 0)) push(high, v); if (s.every(x => x === 0)) {} continue; }
      if (s.every(x => x <= 0)) { push(low, v); continue; }
      /* crosses: clip polygon against plane */
      const lo = [], hi = [], cross = [];
      for (let k = 0; k < 3; k++) {
        const a = v[k], b = v[(k + 1) % 3], sa = s[k], sb = s[(k + 1) % 3];
        if (sa <= 0) lo.push(a); if (sa >= 0) hi.push(a);
        if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) { const u = sa / (sa - sb), p = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; p[A] = d; lo.push(p); hi.push(p); cross.push(p); }
        else if (sa === 0) cross.push(a);
      }
      push(low, lo); push(high, hi);
      /* cut segment, directed so the solid-high side is on the left looking along +axis; used to build cap loops */
      if (cross.length >= 2) segs.push([cross[0], cross[1], v, s]);
    }
    /* edges lying exactly on the plane (all s==0 triangles whose neighbours are on one side) are handled by loop building from the cross segments only; coplanar faces already kept on the high side */
    const loops = E._loops(segs, A, t, d);
    const cap = E._capTris(loops, A, d);
    const capLow = cap.slice(), capHigh = E.flip(cap);
    /* the cap faces up (+axis) for the low part (closing its top) and down for the high part */
    return { low: F(low.concat(Array.from(capLow))), high: F(high.concat(Array.from(capHigh))), loops: loops.length };
  };
  /* build closed loops from cut segments by chaining matching endpoints; orientation chosen so that the loop is CCW seen from +axis for the LOW piece's top */
  E._loops = (segs, A, t, d) => {
    const key = p => Math.round(p[0] * 1e4) + ',' + Math.round(p[1] * 1e4) + ',' + Math.round(p[2] * 1e4);
    /* orient each segment: the low-side part of the triangle must be to the right when viewed from +axis -> use triangle normal */
    const u = (A + 1) % 3, w = (A + 2) % 3, edges = [];
    for (const [p, q, v] of segs) {
      /* triangle normal component along axis tells nothing; use cross of (q-p) with triangle normal: solid is on the side opposite the normal... use the triangle's own winding instead */
      const nx = (v[1][1] - v[0][1]) * (v[2][2] - v[0][2]) - (v[1][2] - v[0][2]) * (v[2][1] - v[0][1]), ny = (v[1][2] - v[0][2]) * (v[2][0] - v[0][0]) - (v[1][0] - v[0][0]) * (v[2][2] - v[0][2]), nz = (v[1][0] - v[0][0]) * (v[2][1] - v[0][1]) - (v[1][1] - v[0][1]) * (v[2][0] - v[0][0]), n = [nx, ny, nz];
      const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2];
      /* direction of travel such that (dir x n) points toward +axis side... compute side = dot(cross(dir,n), e_A) */
      const cr = [dy * n[2] - dz * n[1], dz * n[0] - dx * n[2], dx * n[1] - dy * n[0]];
      /* outward-normal solid lies on the -n side; surface material is "behind" n. For a loop CCW seen from +A, interior is to the left. */
      const a2 = cr[A] < 0 ? [p, q] : [q, p];
      edges.push(a2);
    }
    const next = new Map(); edges.forEach((e, i) => { const k = key(e[0]); if (!next.has(k)) next.set(k, []); next.get(k).push(i); });
    const used = new Uint8Array(edges.length), loops = [];
    for (let i = 0; i < edges.length; i++) {
      if (used[i]) continue; const loop = []; let cur = i, guard = 0;
      while (cur !== undefined && !used[cur] && guard++ < edges.length + 2) { used[cur] = 1; loop.push(edges[cur][0]); const cand = next.get(key(edges[cur][1])) || []; cur = cand.find(j => !used[j]); }
      if (loop.length >= 3) loops.push(loop);
    }
    return loops;
  };
  const area = (L, u, w) => { let s = 0; for (let i = 0; i < L.length; i++) { const a = L[i], b = L[(i + 1) % L.length]; s += a[u] * b[w] - b[u] * a[w]; } return s / 2; };
  const pip = (pt, L, u, w) => { let c = false; for (let i = 0, j = L.length - 1; i < L.length; j = i++) { const a = L[i], b = L[j]; if ((a[w] > pt[w]) !== (b[w] > pt[w]) && pt[u] < (b[u] - a[u]) * (pt[w] - a[w]) / (b[w] - a[w]) + a[u]) c = !c; } return c; };
  /* cap = triangles facing +axis, filling the loops (outer loops CCW seen from +A, holes CW), with hole bridging then ear clipping */
  E._capTris = (loops, A, d) => {
    const u = (A + 1) % 3, w = (A + 2) % 3, out = [];
    if (!loops.length) return out;
    /* make (u,w) a right-handed system seen from +A: for A=0:(y,z), A=1:(z,x), A=2:(x,y) -- all cyclic so yes */
    const info = loops.map(L => ({ L, a: area(L, u, w) }));
    const outers = info.filter(x => x.a > 0), holes = info.filter(x => x.a < 0);
    for (const o of outers) {
      let poly = o.L.map(p => [p[u], p[w]]);
      const mine = holes.filter(h => pip(h.L[0], o.L, u, w) && !outers.some(o2 => o2 !== o && Math.abs(o2.a) < Math.abs(o.a) && pip(h.L[0], o2.L, u, w)));
      mine.sort((a, b) => Math.max(...b.L.map(p => p[u])) - Math.max(...a.L.map(p => p[u])));
      for (const h of mine) {
        const hp = h.L.map(p => [p[u], p[w]]); let hi = 0; hp.forEach((p, i) => { if (p[0] > hp[hi][0]) hi = i; });
        /* nearest visible-ish outer vertex to the rightmost hole vertex */
        let bi = 0, bd = 1e30; poly.forEach((p, i) => { const dd = (p[0] - hp[hi][0]) ** 2 + (p[1] - hp[hi][1]) ** 2; if (dd < bd) { bd = dd; bi = i; } });
        const rot = hp.slice(hi).concat(hp.slice(0, hi)); poly = poly.slice(0, bi + 1).concat(rot, [rot[0]], [poly[bi]], poly.slice(bi + 1));
      }
      const T = E._ear(poly);
      const P = p => { const r = [0, 0, 0]; r[A] = d; r[u] = p[0]; r[w] = p[1]; return r; };
      for (const [a, b, c] of T) out.push(...P(poly[a]), ...P(poly[b]), ...P(poly[c]));
    }
    return out;
  };
  E._ear = p => {
    const idx = p.map((_, i) => i), out = []; let guard = 0; const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    while (idx.length > 3 && guard++ < 20000) {
      let cut = false;
      for (let k = 0; k < idx.length; k++) {
        const i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length], a = p[i0], b = p[i1], c = p[i2];
        if (cr(a, b, c) <= 1e-12) continue; let ok = true;
        for (const j of idx) { if (j === i0 || j === i1 || j === i2) continue; const q = p[j]; if ((q[0] === a[0] && q[1] === a[1]) || (q[0] === b[0] && q[1] === b[1]) || (q[0] === c[0] && q[1] === c[1])) continue; if (cr(a, b, q) >= 0 && cr(b, c, q) >= 0 && cr(c, a, q) >= 0) { ok = false; break; } }
        if (ok) { out.push([i0, i1, i2]); idx.splice(k, 1); cut = true; break; }
      }
      if (!cut) { /* no proper ear: remove a collinear vertex (zero-area ear) so the rest keeps going */
        let k2 = -1; for (let k = 0; k < idx.length; k++) { const a = p[idx[(k + idx.length - 1) % idx.length]], bq = p[idx[k]], c = p[idx[(k + 1) % idx.length]]; if (Math.abs(cr(a, bq, c)) <= 1e-9) { k2 = k; break; } }
        if (k2 < 0) k2 = 0; idx.splice(k2, 1);
      }
    }
    if (idx.length === 3) out.push([idx[0], idx[1], idx[2]]); return out;
  };

  /* ---- alignment pegs: a round peg on the low part's cap and a matching socket in the high part would need a boolean; instead we union a peg onto the low part (a stub that stands out of its cut face) and a loose
         socket plate is not needed: the high part gets a matching recess by being cut deeper -> we do the simple thing: add the peg to the low part and a recess to the high part via a second plane cut. ---- */
  E.cylinder = (cx, cy, r, z0, z1, n) => { const t = []; (window.G3 || E._G).tube(t, cx, cy, r, 0, z0, z1, n || 24); return F(t); };

  /* ---- split to fit: cut into a grid of cuts so every piece fits in bx x by x bz ---- */
  E.splitToFit = (t, bed, margin) => {
    margin = margin || 0; let parts = [F(t)]; const lim = [bed[0] - margin, bed[1] - margin, bed[2] - margin];
    for (let ax = 0; ax < 3; ax++) {
      let again = true, guard = 0;
      while (again && guard++ < 40) {
        again = false; const next = [];
        for (const p of parts) { const b = bounds(p); if (b.size[ax] > lim[ax] + 1e-6) { const n = Math.ceil(b.size[ax] / lim[ax]), d = b.mn[ax] + b.size[ax] / n * 1; const r = E.cut(p, ax, d); next.push(r.low, r.high); again = true; } else next.push(p); }
        parts = next;
      }
    }
    return parts.filter(p => p.length >= 9);
  };

  /* ---- voxel grid for hollow and thin-wall checks: inside = parity of Z-ray crossings ---- */
  E.voxelize = (t, res) => {
    t = F(t); const b = bounds(t), h = Math.max(b.size[0], b.size[1], b.size[2]) / res, pad = 2;
    const nx = Math.ceil(b.size[0] / h) + pad * 2, ny = Math.ceil(b.size[1] / h) + pad * 2, nz = Math.ceil(b.size[2] / h) + pad * 2, ox = b.mn[0] - pad * h, oy = b.mn[1] - pad * h, oz = b.mn[2] - pad * h;
    const g = new Uint8Array(nx * ny * nz), cols = new Array(nx * ny);
    for (let i = 0; i < t.length; i += 9) {
      const xs = [t[i], t[i + 3], t[i + 6]], ys = [t[i + 1], t[i + 4], t[i + 7]];
      const i0 = Math.max(0, Math.floor((Math.min(...xs) - ox) / h - 0.5)), i1 = Math.min(nx - 1, Math.ceil((Math.max(...xs) - ox) / h - 0.5)), j0 = Math.max(0, Math.floor((Math.min(...ys) - oy) / h - 0.5)), j1 = Math.min(ny - 1, Math.ceil((Math.max(...ys) - oy) / h - 0.5));
      const ax = t[i], ay = t[i + 1], az = t[i + 2], bx = t[i + 3], by = t[i + 4], bz = t[i + 5], cx = t[i + 6], cy = t[i + 7], cz = t[i + 8], det = (by - ay) * (cx - ax) - (bx - ax) * (cy - ay);
      if (Math.abs(det) < 1e-12) continue;
      for (let ii = i0; ii <= i1; ii++) for (let jj = j0; jj <= j1; jj++) {
        const px = ox + (ii + 0.5) * h + 1e-7, py = oy + (jj + 0.5) * h + 1.3e-7;
        const l1 = ((py - ay) * (cx - ax) - (px - ax) * (cy - ay)) / det, l2 = ((px - ax) * (by - ay) - (py - ay) * (bx - ax)) / det;
        if (l1 < 0 || l2 < 0 || l1 + l2 > 1) continue; const z = az + l1 * (bz - az) + l2 * (cz - az), k = ii * ny + jj; (cols[k] || (cols[k] = [])).push(z);
      }
    }
    for (let ii = 0; ii < nx; ii++) for (let jj = 0; jj < ny; jj++) {
      const c = cols[ii * ny + jj]; if (!c) continue; c.sort((a, b) => a - b);
      for (let m = 0; m + 1 < c.length; m += 2) { const k0 = Math.max(0, Math.ceil((c[m] - oz) / h - 0.5)), k1 = Math.min(nz - 1, Math.floor((c[m + 1] - oz) / h - 0.5)); for (let kk = k0; kk <= k1; kk++) g[(kk * ny + jj) * nx + ii] = 1; }
    }
    return { g, nx, ny, nz, h, ox, oy, oz };
  };
  /* squared distance (in voxels) from every voxel to the nearest voxel where g==target (Felzenszwalb) */
  E.edt = (V, targetVal) => {
    const { g, nx, ny, nz } = V, INF = 1e12, N = nx * ny * nz, d = new Float64Array(N);
    for (let i = 0; i < N; i++) d[i] = g[i] === targetVal ? 0 : INF;
    const f = new Float64Array(Math.max(nx, ny, nz)), v = new Int32Array(Math.max(nx, ny, nz)), z = new Float64Array(Math.max(nx, ny, nz) + 1), o = new Float64Array(Math.max(nx, ny, nz));
    const pass = (len, get, set) => {
      for (let i = 0; i < len; i++) f[i] = get(i);
      let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
      for (let q = 1; q < len; q++) { let s; do { const p = v[k]; s = ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p); if (s <= z[k]) k--; else break; } while (k >= 0); if (k < 0) { k = 0; v[0] = q; z[0] = -INF; z[1] = INF; continue; } k++; v[k] = q; z[k] = s; z[k + 1] = INF; }
      k = 0; for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; const p = v[k]; o[q] = (q - p) * (q - p) + f[p]; }
      for (let i = 0; i < len; i++) set(i, o[i]);
    };
    for (let kk = 0; kk < nz; kk++) for (let jj = 0; jj < ny; jj++) { const b = (kk * ny + jj) * nx; pass(nx, i => d[b + i], (i, x) => { d[b + i] = x; }); }
    for (let kk = 0; kk < nz; kk++) for (let ii = 0; ii < nx; ii++) pass(ny, j => d[(kk * ny + j) * nx + ii], (j, x) => { d[(kk * ny + j) * nx + ii] = x; });
    for (let jj = 0; jj < ny; jj++) for (let ii = 0; ii < nx; ii++) pass(nz, k => d[(k * ny + jj) * nx + ii], (k, x) => { d[(k * ny + jj) * nx + ii] = x; });
    return d;
  };
  /* ---- hollow: keep the original outside, add an inward-facing cavity wall `wall` mm thick. Optional drain hole at the bottom (needs the cavity to reach the surface: we carve a vertical shaft of radius r and
         remove the outer-skin triangles above it by cutting them out, then leaving the rim open: done by mesh-removal of triangles inside the cylinder at the lowest point). ---- */
  E.hollow = (t, wall, opts) => {
    opts = opts || {}; t = F(t); const b = bounds(t), res = opts.res || Math.min(140, Math.max(40, Math.round(Math.max(...b.size) / Math.max(wall / 2.2, 0.35))));
    const V = E.voxelize(t, res), { g, nx, ny, nz, h } = V, d2 = E.edt(V, 0), need = (wall / h) * (wall / h), cav = new Uint8Array(g.length);
    let count = 0; for (let i = 0; i < g.length; i++) if (g[i] && d2[i] > need) { cav[i] = 1; count++; }
    if (!count) return { tris: t, hollow: false, reason: 'The wall thickness is too big for this part, nothing to hollow.' };
    if (opts.drain) { /* carve a shaft from the lowest cavity voxel to below the part */
      const r = Math.max(1, Math.round((opts.drain.r || 1.5) / h)); let lx = 0, ly = 0, lk = nz; for (let k = 0; k < nz; k++) { for (let j = 0; j < ny && lk === nz; j++) for (let i = 0; i < nx; i++) if (cav[(k * ny + j) * nx + i]) { lx = i; ly = j; lk = k; break; } if (lk < nz) break; }
      for (let k = 0; k < lk; k++) for (let j = ly - r; j <= ly + r; j++) for (let i = lx - r; i <= lx + r; i++) if ((i - lx) ** 2 + (j - ly) ** 2 <= r * r && i >= 0 && j >= 0 && g[(k * ny + j) * nx + i]) cav[(k * ny + j) * nx + i] = 1;
      V.drain = { x: V.ox + (lx + 0.5) * h, y: V.oy + (ly + 0.5) * h, r: (r + 0.5) * h, zTop: V.oz + lk * h };
    }
    const out = []; const q = (a, bb, c, dd) => { out.push(...a, ...bb, ...c, ...a, ...c, ...dd); };
    const X = i => V.ox + i * h, Y = j => V.oy + j * h, Z = k => V.oz + k * h, C = (i, j, k) => (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz) ? 0 : cav[(k * ny + j) * nx + i];
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      if (!C(i, j, k)) continue; /* face of the void; normal must point INTO the void => opposite of the cavity voxel's outward normal */
      if (!C(i + 1, j, k)) q([X(i + 1), Y(j), Z(k)], [X(i + 1), Y(j), Z(k + 1)], [X(i + 1), Y(j + 1), Z(k + 1)], [X(i + 1), Y(j + 1), Z(k)]);
      if (!C(i - 1, j, k)) q([X(i), Y(j), Z(k)], [X(i), Y(j + 1), Z(k)], [X(i), Y(j + 1), Z(k + 1)], [X(i), Y(j), Z(k + 1)]);
      if (!C(i, j + 1, k)) q([X(i), Y(j + 1), Z(k)], [X(i + 1), Y(j + 1), Z(k)], [X(i + 1), Y(j + 1), Z(k + 1)], [X(i), Y(j + 1), Z(k + 1)]);
      if (!C(i, j - 1, k)) q([X(i), Y(j), Z(k)], [X(i), Y(j), Z(k + 1)], [X(i + 1), Y(j), Z(k + 1)], [X(i + 1), Y(j), Z(k)]);
      if (!C(i, j, k + 1)) q([X(i), Y(j), Z(k + 1)], [X(i), Y(j + 1), Z(k + 1)], [X(i + 1), Y(j + 1), Z(k + 1)], [X(i + 1), Y(j), Z(k + 1)]);
      if (!C(i, j, k - 1)) q([X(i), Y(j), Z(k)], [X(i + 1), Y(j), Z(k)], [X(i + 1), Y(j + 1), Z(k)], [X(i), Y(j + 1), Z(k)]);
    }
    /* the faces above were written with outward-from-cavity-voxel winding flipped by construction? verify by sign of volume in the caller/tests */
    return { tris: F(Array.from(t).concat(out)), hollow: true, cavityVoxels: count, voxel: h, drain: V.drain };
  };

  /* ---- print checks ---- */
  /* per-triangle flags: 1 = overhang steeper than `deg` from vertical-ish (needs support), measured against the printing direction (-Z) */
  E.overhangFlags = (t, deg) => {
    deg = deg === undefined ? 45 : deg; const lim = -Math.cos((90 - deg) * Math.PI / 180) * 0 - Math.sin((deg) * Math.PI / 180) * 0; const thr = -Math.cos(deg * Math.PI / 180); /* nz below -cos(deg)... see test */
    const n = t.length / 9, f = new Uint8Array(n); let mnz = 1e30; for (let i = 2; i < t.length; i += 3) if (t[i] < mnz) mnz = t[i];
    for (let k = 0; k < n; k++) {
      const i = k * 9, ux = t[i + 3] - t[i], uy = t[i + 4] - t[i + 1], uz = t[i + 5] - t[i + 2], vx = t[i + 6] - t[i], vy = t[i + 7] - t[i + 1], vz = t[i + 8] - t[i + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
      if (nz / l < -Math.sin((90 - deg) * Math.PI / 180) && Math.min(t[i + 2], t[i + 5], t[i + 8]) - mnz > 0.2) f[k] = 1;
    }
    return f;
  };
  /* thin walls: voxels inside the part that vanish after an opening of radius thr/2. Returns centres of thin spots and the share of volume */
  E.thinWalls = (t, thr, res) => {
    t = F(t); const b = bounds(t), V = E.voxelize(t, res || Math.min(160, Math.max(50, Math.round(Math.max(...b.size) / (thr / 2.5))))), { g, nx, ny, nz, h } = V, r = thr / 2 / h;
    const dOut = E.edt(V, 0), core = new Uint8Array(g.length), core2 = new Uint8Array(g.length);
    for (let i = 0; i < g.length; i++) core[i] = g[i] && dOut[i] >= r * r ? 1 : 0;       /* erosion */
    const dCore = E.edt({ g: core, nx, ny, nz }, 1), thin = []; let total = 0, bad = 0;
    for (let i = 0; i < g.length; i++) { if (!g[i]) continue; total++; if (dCore[i] > r * r) { bad++; core2[i] = 1; } }
    /* cluster-free: sample every thin voxel on a coarse stride so the list stays small */
    const step = Math.max(1, Math.round(1 / h)); for (let k = 0; k < nz; k += step) for (let j = 0; j < ny; j += step) for (let i = 0; i < nx; i += step) if (core2[(k * ny + j) * nx + i]) thin.push([V.ox + (i + 0.5) * h, V.oy + (j + 0.5) * h, V.oz + (k + 0.5) * h]);
    return { thin, share: total ? bad / total : 0, voxel: h };
  };
  /* per triangle: is it near a thin spot (within 1.5 voxels)? */
  E.thinFlags = (t, spots, voxel) => {
    const cell = Math.max(voxel * 2, 0.5), m = new Map(), K = (x, y, z) => Math.floor(x / cell) + ',' + Math.floor(y / cell) + ',' + Math.floor(z / cell);
    spots.forEach(s => { const k = K(s[0], s[1], s[2]); if (!m.has(k)) m.set(k, 1); });
    const f = new Uint8Array(t.length / 9);
    for (let k = 0; k < f.length; k++) { const i = k * 9, x = (t[i] + t[i + 3] + t[i + 6]) / 3, y = (t[i + 1] + t[i + 4] + t[i + 7]) / 3, z = (t[i + 2] + t[i + 5] + t[i + 8]) / 3; let hit = false; for (let a = -1; a <= 1 && !hit; a++) for (let c = -1; c <= 1 && !hit; c++) for (let e = -1; e <= 1; e++) if (m.has(K(x + a * cell, y + c * cell, z + e * cell))) { hit = true; break; } f[k] = hit ? 1 : 0; }
    return f;
  };

  /* ---- arrange: shelf-pack the parts' footprints on a bed (mm), gap between parts. Returns offsets [dx,dy] per part and which don't fit ---- */
  E.arrange = (parts, bed, gap) => {
    gap = gap === undefined ? 5 : gap; const items = parts.map((p, i) => { const b = bounds(p); return { i, w: b.size[0], h: b.size[1], mn: b.mn }; }).sort((a, b) => b.h - a.h);
    const pos = new Array(parts.length), over = []; let x = gap, y = gap, row = 0;
    for (const it of items) {
      if (x + it.w + gap > bed[0]) { x = gap; y += row + gap; row = 0; }
      if (y + it.h + gap > bed[1] || it.w + 2 * gap > bed[0]) { over.push(it.i); pos[it.i] = [0, 0]; continue; }
      pos[it.i] = [x - it.mn[0], y - it.mn[1]]; x += it.w + gap; row = Math.max(row, it.h);
    }
    return { offsets: pos, overflow: over };
  };
  /* keep E3 independent of G3 for tests */
  if (typeof window !== 'undefined') window.E3 = E; if (typeof module !== 'undefined') module.exports = E;
})();
