/* 3DPrintida model reader: STL (binary and text), OBJ and GLB/glTF to a flat triangle array [x,y,z,...] in the file's own units and axes. */
(function () {
  const M = {};
  const sv = t => { let v = 0; for (let i = 0; i < t.length; i += 9) v += (t[i] * (t[i + 4] * t[i + 8] - t[i + 5] * t[i + 7]) - t[i + 1] * (t[i + 3] * t[i + 8] - t[i + 5] * t[i + 6]) + t[i + 2] * (t[i + 3] * t[i + 7] - t[i + 4] * t[i + 6])) / 6; return v; };
  M.signedVolume = sv;
  function stl(buf) {
    const dv = new DataView(buf), n = dv.byteLength >= 84 ? dv.getUint32(80, true) : 0;
    if (dv.byteLength === 84 + n * 50 && n > 0) { const o = new Float32Array(n * 9); for (let i = 0; i < n; i++) for (let k = 0; k < 9; k++) o[i * 9 + k] = dv.getFloat32(84 + i * 50 + 12 + k * 4, true); return o; }
    const s = new TextDecoder().decode(buf), re = /vertex\s+(\S+)\s+(\S+)\s+(\S+)/g, a = []; let m; while ((m = re.exec(s))) a.push(+m[1], +m[2], +m[3]);
    if (a.length % 9) a.length -= a.length % 9; return Float32Array.from(a);
  }
  function obj(buf) {
    const lines = new TextDecoder().decode(buf).split(/\r?\n/), v = [], out = [];
    for (const L of lines) {
      if (L[0] === 'v' && L[1] === ' ') { const p = L.trim().split(/\s+/); v.push(+p[1], +p[2], +p[3]); }
      else if (L[0] === 'f' && L[1] === ' ') {
        const p = L.trim().split(/\s+/).slice(1).map(s => { let i = parseInt(s, 10); if (i < 0) i = v.length / 3 + i + 1; return (i - 1) * 3; });
        for (let k = 1; k + 1 < p.length; k++) for (const j of [p[0], p[k], p[k + 1]]) out.push(v[j], v[j + 1], v[j + 2]);
      }
    }
    return Float32Array.from(out);
  }
  const CT = { 5120: [Int8Array, 1], 5121: [Uint8Array, 1], 5122: [Int16Array, 2], 5123: [Uint16Array, 2], 5125: [Uint32Array, 4], 5126: [Float32Array, 4] }, NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  function gltf(json, bins) {
    if ((json.extensionsRequired || []).some(e => /draco|meshopt/i.test(e))) throw new Error('This model is compressed (Draco or Meshopt). Export it again without compression, or use OBJ or STL.');
    const buffers = json.buffers.map((b, i) => { if (bins[i]) return bins[i]; if (b.uri && b.uri.startsWith('data:')) { const s = atob(b.uri.split(',')[1]), u = new Uint8Array(s.length); for (let k = 0; k < s.length; k++) u[k] = s.charCodeAt(k); return u.buffer; } throw new Error('This glTF uses a separate .bin file. Use a .glb file instead.'); });
    const read = ai => {
      const a = json.accessors[ai], bv = json.bufferViews[a.bufferView], [T, sz] = CT[a.componentType], nc = NC[a.type], stride = bv.byteStride || sz * nc, base = (bv.byteOffset || 0) + (a.byteOffset || 0), src = buffers[bv.buffer], dv = new DataView(src), out = new Float64Array(a.count * nc);
      const g = { 5126: 'getFloat32', 5125: 'getUint32', 5123: 'getUint16', 5121: 'getUint8', 5122: 'getInt16', 5120: 'getInt8' }[a.componentType];
      for (let i = 0; i < a.count; i++) for (let k = 0; k < nc; k++) out[i * nc + k] = dv[g](base + i * stride + k * sz, true);
      return out;
    };
    const mul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o; };
    const local = n => { if (n.matrix) return n.matrix; const t = n.translation || [0, 0, 0], q = n.rotation || [0, 0, 0, 1], s = n.scale || [1, 1, 1], [x, y, z, w] = q;
      return [(1 - 2 * (y * y + z * z)) * s[0], (2 * (x * y + z * w)) * s[0], (2 * (x * z - y * w)) * s[0], 0, (2 * (x * y - z * w)) * s[1], (1 - 2 * (x * x + z * z)) * s[1], (2 * (y * z + x * w)) * s[1], 0, (2 * (x * z + y * w)) * s[2], (2 * (y * z - x * w)) * s[2], (1 - 2 * (x * x + y * y)) * s[2], 0, t[0], t[1], t[2], 1]; };
    const out = [];
    const walk = (ni, parent) => {
      const n = json.nodes[ni], m = mul(parent, local(n));
      if (n.mesh != null) for (const pr of json.meshes[n.mesh].primitives) {
        if (pr.mode != null && pr.mode < 4) continue; const P = read(pr.attributes.POSITION), idx = pr.indices != null ? read(pr.indices) : null, cnt = idx ? idx.length : P.length / 3, ix = i => idx ? idx[i] : i;
        const flip = (m[0] * (m[5] * m[10] - m[6] * m[9]) - m[1] * (m[4] * m[10] - m[6] * m[8]) + m[2] * (m[4] * m[9] - m[5] * m[8])) < 0, tri = [];
        const mode = pr.mode == null ? 4 : pr.mode;
        if (mode === 4) for (let i = 0; i + 2 < cnt; i += 3) tri.push([ix(i), ix(i + 1), ix(i + 2)]);
        else if (mode === 5) for (let i = 0; i + 2 < cnt; i++) tri.push(i % 2 ? [ix(i + 1), ix(i), ix(i + 2)] : [ix(i), ix(i + 1), ix(i + 2)]);
        else for (let i = 1; i + 1 < cnt; i++) tri.push([ix(0), ix(i), ix(i + 1)]);
        for (const t of tri) { const o = flip ? [t[0], t[2], t[1]] : t; for (const j of o) { const x = P[j * 3], y = P[j * 3 + 1], z = P[j * 3 + 2]; out.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]); } }
      }
      (n.children || []).forEach(c => walk(c, m));
    };
    const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], sc = (json.scenes || [])[json.scene || 0];
    (sc ? sc.nodes : json.nodes.map((_, i) => i)).forEach(n => walk(n, I));
    return Float32Array.from(out);
  }
  function glb(buf) {
    const dv = new DataView(buf); if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('Not a GLB file.');
    let off = 12, json = null, bin = null;
    while (off + 8 <= buf.byteLength) { const len = dv.getUint32(off, true), ty = dv.getUint32(off + 4, true); if (ty === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, off + 8, len))); else if (ty === 0x004E4942 && !bin) bin = buf.slice(off + 8, off + 8 + len); off += 8 + len + (len % 4 ? 4 - len % 4 : 0); }
    return gltf(json, [bin]);
  }
  M.parse = (buf, name) => {
    const e = (name.split('.').pop() || '').toLowerCase(); let t;
    if (e === 'stl') t = stl(buf); else if (e === 'obj') t = obj(buf); else if (e === 'glb') t = glb(buf);
    else if (e === 'gltf') t = gltf(JSON.parse(new TextDecoder().decode(buf)), []); else throw new Error('Use an STL, OBJ or GLB file.');
    if (!t.length) throw new Error('No triangles found in that file.'); return t;
  };
  window.MODEL = M;
})();
