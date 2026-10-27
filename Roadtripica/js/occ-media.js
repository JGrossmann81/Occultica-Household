/* Occultica app shell, part 3: icons, photos, sharing, backup, small charts. */
(function () {
  'use strict';
  const OA = window.OA, esc = OA.esc;

  /* ----- icons: 24x24 line drawings ----- */
  const P = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
    tent: '<path d="M3 20L12 4l9 16z"/><path d="M12 4v16"/><path d="M9 20l3-6 3 6"/>',
    backpack: '<path d="M8 6a4 4 0 0 1 8 0"/><rect x="5" y="6" width="14" height="15" rx="4"/><path d="M9 13h6M9 17h6"/>',
    route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
    car: '<path d="M5 16l1.5-6A2 2 0 0 1 8.4 8.5h7.2a2 2 0 0 1 1.9 1.5L19 16"/><rect x="3" y="16" width="18" height="4" rx="1.5"/><circle cx="7.5" cy="18" r=".6"/><circle cx="16.5" cy="18" r=".6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="3.5"/>',
    heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    fork: '<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v6M9 3v6M17 21V3c-2 1-3 4-3 8h3"/>',
    bed: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    book: '<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a3 3 0 0 0-3 3"/><path d="M20 4v14h-6"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    pin: '<path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 11l7.6-4M8.2 13l7.6 4"/>',
    download: '<path d="M12 3v12M7 11l5 5 5-5M4 20h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    mountain: '<path d="M2 20l7-13 4 7 3-4 6 10z"/>',
    tree: '<path d="M12 3l6 8h-3l4 6H5l4-6H6z"/><path d="M12 17v4"/>',
    fuel: '<path d="M5 21V4h9v17M5 21h9M14 9h3a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3"/><path d="M7 8h5"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l3 12h11l2-8H6"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9.5 4 4 0 0 1 17 18z"/>',
    thermo: '<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    scale: '<path d="M12 3v18M6 21h12M5 7h14"/><path d="M5 7l-3 7a3.5 3.5 0 0 0 6 0zM19 7l-3 7a3.5 3.5 0 0 0 6 0z"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    boot: '<path d="M6 3h6v7l6 3v5H4V3"/><path d="M4 14h8"/>',
    water: '<path d="M3 9c2 2 4 2 6 0s4-2 6 0 4 2 6 0M3 15c2 2 4 2 6 0s4-2 6 0 4 2 6 0"/>',
    first: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M12 11v5M9.5 13.5h5"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    leaf: '<path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15z"/><path d="M5 19l8-8"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4v0a2 2 0 0 0 0-4V6H3z"/><path d="M13 6v12" stroke-dasharray="2 2"/>',
    wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r=".8"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    bear: '<circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="7" r="2.5"/><circle cx="12" cy="13" r="7"/><circle cx="12" cy="14" r="2"/>',
    snow: '<path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/>',
    tool: '<path d="M14.5 6.5a4 4 0 0 0-5 5L3 18l3 3 6.5-6.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z"/>'
  };
  OA.icon = (n, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || P.pin}</svg>`;
  OA.iconNames = () => Object.keys(P);

  /* ----- photos: take or choose, shrink, keep in the database with an optional GPS fix ----- */
  async function shrink(file, max, q) {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null);
    if (!bmp) return file;
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise(res => c.toBlob(b => res(b || file), 'image/jpeg', q || 0.82));
  }
  OA.photo = {
    /* opens the camera/gallery; returns the saved record {id, ts, lat, lon, note, blob, thumb} or null if cancelled */
    pick(opts) {
      opts = opts || {};
      return new Promise(res => {
        const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; if (opts.camera !== false) i.setAttribute('capture', 'environment');
        i.style.display = 'none'; document.body.appendChild(i);
        i.addEventListener('change', async () => {
          const f = i.files && i.files[0]; i.remove(); if (!f) return res(null);
          try {
            const blob = await shrink(f, opts.max || 1600, 0.82), thumb = await shrink(blob, 240, 0.7);
            let fix = null; if (opts.gps !== false) { try { fix = await OA.geo.position({ timeout: 6000, maximumAge: 60000 }); } catch (e) { fix = OA.geo.known(); } }
            const rec = { id: OA.uid(), ts: Date.now(), lat: fix ? fix.lat : null, lon: fix ? fix.lon : null, note: opts.note || '', blob, thumb, tag: opts.tag || '' };
            await OA.db.put('photos', rec); res(rec);
          } catch (e) { OA.toast('Could not save the photo: ' + e.message); res(null); }
        });
        i.addEventListener('cancel', () => { i.remove(); res(null); });
        i.click();
      });
    },
    all: () => OA.db.all('photos').then(a => a.sort((x, y) => y.ts - x.ts)),
    get: id => OA.db.get('photos', id),
    del: id => OA.db.del('photos', id),
    url: rec => URL.createObjectURL(rec.thumb || rec.blob),
    fullUrl: rec => URL.createObjectURL(rec.blob)
  };

  /* ----- sharing: share sheet with photo files when the phone allows it; otherwise text links ----- */
  OA.share = {
    async send(o) {   // {title, text, files:[Blob|File], url}
      const files = (o.files || []).map((b, i) => b instanceof File ? b : new File([b], 'photo' + (i + 1) + '.jpg', { type: b.type || 'image/jpeg' }));
      try {
        if (navigator.share) {
          const d = { title: o.title || '', text: o.text || '', url: o.url }; if (files.length && navigator.canShare && navigator.canShare({ files })) d.files = files;
          await navigator.share(d); return true;
        }
      } catch (e) { if (e && e.name === 'AbortError') return false; }
      try { await navigator.clipboard.writeText((o.text || '') + (o.url ? '\n' + o.url : '')); OA.toast('Copied. Paste it into a message.'); return true; } catch (e) { OA.toast('Sharing is not available here.'); return false; }
    },
    sms: (num, text) => 'sms:' + (num || '') + '?&body=' + encodeURIComponent(text),
    mail: (to, subj, text) => 'mailto:' + (to || '') + '?subject=' + encodeURIComponent(subj || '') + '&body=' + encodeURIComponent(text),
    /* a text blurb with coordinates and a map link, ready to send to loved ones */
    here(label, fix) { const f = fix || OA.geo.known(); if (!f) return label || ''; const l = OA.geo.mapLinks(f.lat, f.lon); return (label ? label + '\n' : '') + OA.geo.fmtCoord(f.lat, f.lon, 'dd') + (f.alt != null ? '  elev ' + Math.round(f.alt * 3.281) + ' ft' : '') + '\n' + l.google + '\n(' + new Date(f.ts || Date.now()).toLocaleString() + ')'; }
  };
  OA.download = (name, mime, data) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: mime })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); };

  /* ----- backup: file or text code (state only; photos are listed but not inside the code) ----- */
  const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
  async function gz(u8, dir) { const S = dir ? CompressionStream : DecompressionStream; return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new S('gzip'))).arrayBuffer()); }
  OA.backup = {
    make() { OA.save(); return { app: OA.app, v: 1, ts: Date.now(), state: OA.S }; },
    async code() { const raw = new TextEncoder().encode(JSON.stringify(OA.backup.make())); if (typeof CompressionStream === 'function') return 'OCCBAKZ:' + OA.app + ':' + b64(await gz(raw, true)); return 'OCCBAK:' + OA.app + ':' + b64(raw); },
    async parse(text) {
      text = String(text || '').trim(); let o;
      if (text.startsWith('{')) o = JSON.parse(text);
      else { const m = text.replace(/\s+/g, '').match(/^(OCCBAKZ?):([a-z]+):(.+)$/); if (!m) throw new Error('That is not a backup from this app.'); const u = unb64(m[3]); o = JSON.parse(new TextDecoder().decode(m[1] === 'OCCBAKZ' ? await gz(u, false) : u)); }
      if (!o || o.app !== OA.app || !o.state) throw new Error('That backup is from a different app or is damaged.');
      return o;
    },
    async restore(text) { const o = await OA.backup.parse(text); if (!await OA.confirm('Replace everything in this app with the backup from ' + new Date(o.ts).toLocaleString() + '?', 'Restore')) return false; OA.S = o.state; OA.load = OA.load; OA.save(); location.reload(); return true; }
  };
  OA.act({
    backupFile() { OA.download(OA.app + '-backup-' + OA.dkey() + '.json', 'application/json', JSON.stringify(OA.backup.make())); OA.toast('Backup file saved.'); },
    async backupCode() { const out = OA.$('#bkout'); const c = await OA.backup.code(); out.innerHTML = `<textarea class="in" rows="3" readonly id="bkcode">${esc(c)}</textarea>`; try { await navigator.clipboard.writeText(c); OA.toast('Backup code copied.'); } catch (e) { const t = OA.$('#bkcode'); t.focus(); t.select(); } },
    async restoreCode() { try { await OA.backup.restore(OA.$('#bkin').value); } catch (e) { OA.toast(e.message, 5000); } },
    async restoreFile(el) { const f = el.files && el.files[0]; if (!f) return; try { await OA.backup.restore(await f.text()); } catch (e) { OA.toast(e.message, 5000); } }
  });

  /* ----- small SVG charts (themed by CSS variables) ----- */
  OA.chart = {
    /* elevation or any x/y profile. pts [[x,y],...]; marks [{x, label, color}]; opt {w,h,xfmt,yfmt,fill,here} */
    profile(pts, marks, opt) {
      opt = opt || {}; const W = opt.w || 360, H = opt.h || 140, L = 38, Rr = 8, T = 10, B = 22;
      if (!pts || pts.length < 2) return '<div class="sm dim">No data to draw yet.</div>';
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; pts.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
      if (y1 - y0 < 1) y1 = y0 + 1; const pad = (y1 - y0) * 0.08; y0 -= pad; y1 += pad;
      const X = x => L + (x - x0) / ((x1 - x0) || 1) * (W - L - Rr), Y = y => T + (1 - (y - y0) / (y1 - y0)) * (H - T - B);
      const xf = opt.xfmt || (v => Math.round(v)), yf = opt.yfmt || (v => Math.round(v).toLocaleString());
      const step = Math.max(1, Math.floor(pts.length / 220)), s = pts.filter((p, i) => i % step === 0 || i === pts.length - 1);
      const line = s.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
      const area = line + 'L' + X(s[s.length - 1][0]).toFixed(1) + ' ' + (H - B) + 'L' + X(s[0][0]).toFixed(1) + ' ' + (H - B) + 'Z';
      let g = ''; for (let i = 0; i <= 3; i++) { const v = y0 + (y1 - y0) * i / 3, y = Y(v); g += `<line x1="${L}" x2="${W - Rr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width=".6"/><text x="${L - 4}" y="${(y + 3).toFixed(1)}" text-anchor="end">${yf(v)}</text>`; }
      for (let i = 0; i <= 4; i++) { const v = x0 + (x1 - x0) * i / 4; g += `<text x="${X(v).toFixed(1)}" y="${H - 6}" text-anchor="middle">${xf(v)}</text>`; }
      const mk = (marks || []).filter(m => m.x >= x0 && m.x <= x1).map(m => `<line x1="${X(m.x).toFixed(1)}" x2="${X(m.x).toFixed(1)}" y1="${T}" y2="${H - B}" stroke="${m.color || 'var(--accent)'}" stroke-width="1" stroke-dasharray="3 3"/>${m.label ? `<text x="${X(m.x).toFixed(1)}" y="${T + 8}" text-anchor="middle" style="fill:${m.color || 'var(--accent)'}">${esc(m.label)}</text>` : ''}`).join('');
      const here = opt.here != null && opt.here >= x0 && opt.here <= x1 ? `<circle cx="${X(opt.here).toFixed(1)}" cy="${Y(opt.hereY != null ? opt.hereY : y0).toFixed(1)}" r="4" fill="var(--gold)"/>` : '';
      return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label || 'profile')}">${g}<path d="${area}" fill="var(--accent)" opacity=".18"/><path d="${line}" fill="none" stroke="var(--accent)" stroke-width="1.6"/>${mk}${here}</svg>`;
    },
    /* horizontal bars: rows [{label, v, color, note}] */
    bars(rows, opt) { opt = opt || {}; const max = opt.max || Math.max.apply(null, rows.map(r => r.v)) || 1; return rows.map(r => `<div class="meter"><div class="mt"><b>${esc(r.label)}</b><span>${esc(r.note != null ? r.note : r.v)}</span></div><div class="bar"><i style="width:${Math.min(100, r.v / max * 100)}%;${r.color ? 'background:' + r.color : ''}"></i></div></div>`).join(''); },
    spark(vals, w, h) { w = w || 120; h = h || 28; if (!vals || vals.length < 2) return ''; const a = Math.min.apply(null, vals), b = Math.max.apply(null, vals) || 1, r = (b - a) || 1; return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path d="${vals.map((v, i) => (i ? 'L' : 'M') + (i / (vals.length - 1) * w).toFixed(1) + ' ' + (h - 2 - (v - a) / r * (h - 4)).toFixed(1)).join('')}" fill="none" stroke="var(--accent)" stroke-width="1.5"/></svg>`; }
  };
})();
