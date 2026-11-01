"""Run ElegooSlicer (or OrcaSlicer, which it is built on) with no window to turn an STL into printer G-code.
It uses the slicer's command line:  <slicer> --slice 0 --outputdir <dir> --load-settings "<machine>.json;<process>.json" --load-filaments <filament>.json <model>.stl
and takes machine / process / filament settings from the presets the slicer already has on this computer."""
import glob, json, os, re, subprocess, tempfile, time, shutil

def data_dir():
    d = os.environ.get("P3D_DATA") or os.path.join(os.environ.get("LOCALAPPDATA") or os.path.expanduser("~/.local/share"), "3DPrintica")
    os.makedirs(d, exist_ok=True); return d


HERE = data_dir()
CFG = os.path.join(HERE, "config.json")


def load_cfg():
    try: return json.load(open(CFG))
    except Exception: return {}


def save_cfg(d):
    c = load_cfg(); c.update(d)
    json.dump(c, open(CFG, "w"), indent=1); return c


def find_exes():
    """Installed slicer programs (Windows and others)."""
    roots = [os.environ.get(k) for k in ("ProgramFiles", "ProgramFiles(x86)", "LOCALAPPDATA", "ProgramW6432")] + ["C:\\", "D:\\", os.path.expanduser("~")]
    out = []
    pats = ("*lego*lic*r*.exe", "*rca*lic*r*.exe", "*lego-slicer*.exe")
    for r in filter(None, set(roots)):
        for name in ("ElegooSlicer", "Elegoo Slicer", "OrcaSlicer", "Orca-Slicer", "Elegoo", "Programs"):
            for pat in ("*.exe",):
                for p in glob.glob(os.path.join(r, name, pat)) + glob.glob(os.path.join(r, name, "*", pat)):
                    b = os.path.basename(p).lower()
                    if ("slicer" in b) and not any(x in b for x in ("uninst", "unins", "crash", "updater")): out.append(p)
    own = os.path.join(HERE, "orca")
    for p in glob.glob(os.path.join(own, "**", "orca-slicer.exe"), recursive=True) + glob.glob(os.path.join(own, "**", "orca-slicer"), recursive=True): out.insert(0, p)
    seen, res = set(), []
    for p in out:
        if p.lower() not in seen: seen.add(p.lower()); res.append(p)
    return res


def profile_roots():
    roots = []
    for env in ("APPDATA", "LOCALAPPDATA"):
        b = os.environ.get(env)
        if b:
            for n in ("ElegooSlicer", "Elegoo Slicer", "OrcaSlicer", "Orca-Slicer"): roots.append(os.path.join(b, n))
    for exe in find_exes() + [load_cfg().get("exe", "")]:
        if exe: d = os.path.dirname(exe); roots += [os.path.join(d, "resources", "profiles"), os.path.join(d, "..", "resources", "profiles")]
    roots += [os.path.dirname(p) for p in glob.glob(os.path.join(HERE, "orca", "**", "profiles"), recursive=True)]
    return [r for r in dict.fromkeys(roots) if os.path.isdir(r)]


def list_presets(extra_roots=None):
    """Find machine / process / filament preset files by reading them (their 'type' and 'name')."""
    found = {"machine": [], "process": [], "filament": []}
    for root in (extra_roots or []) + profile_roots():
        for dp, dn, fn in os.walk(root):
            if dp[len(root):].count(os.sep) > 7: dn[:] = []; continue
            for f in fn:
                if not f.endswith(".json"): continue
                p = os.path.join(dp, f)
                try:
                    if os.path.getsize(p) > 3_000_000: continue
                    j = json.load(open(p, encoding="utf-8"))
                except Exception: continue
                t, n = j.get("type"), j.get("name")
                if t in found and n and j.get("instantiation", "true") != "false":
                    found[t].append({"name": n, "path": p, "user": "user" + os.sep in p.lower()})
    for t in found:
        seen, out = set(), []
        for e in found[t]:
            if e["path"] not in seen: seen.add(e["path"]); out.append(e)
        found[t] = sorted(out, key=lambda e: (not ("centauri" in e["name"].lower()), not e["user"], e["name"]))
    return found


def status():
    c = load_cfg(); exes = find_exes(); exe = c.get("exe") if valid_exe(c.get("exe")) else (exes[0] if exes else "")
    return {"exe": exe, "exe_found": bool(exe and os.path.exists(exe)), "exes": exes, "printer_ip": c.get("printer_ip", ""), "mainboard": c.get("mainboard", ""),
            "profile": c.get("profile", {})}


def _index():
    idx = {}
    for root in profile_roots():
        for dp, dn, fn in os.walk(root):
            for f in fn:
                if f.endswith(".json"):
                    p = os.path.join(dp, f)
                    try:
                        if os.path.getsize(p) > 3_000_000: continue
                        j = json.load(open(p, encoding="utf-8"))
                    except Exception: continue
                    if isinstance(j, dict) and j.get("name") and j.get("type") in ("machine", "process", "filament"): idx.setdefault((j["type"], j["name"]), p)
    return idx


def flatten(path, kind, work):
    """Orca's command line wants a complete preset. Merge a preset with everything it 'inherits' from, parent first."""
    idx = _index(); chain = []; cur = json.load(open(path, encoding="utf-8")); guard = 0
    while cur is not None and guard < 12:
        chain.append(cur); guard += 1
        par = cur.get("inherits")
        cur = json.load(open(idx[(kind, par)], encoding="utf-8")) if par and (kind, par) in idx else None
    out = {}
    for d in reversed(chain): out.update(d)
    out.pop("inherits", None); out["from"] = "User"; out["instantiation"] = "true"
    p = os.path.join(work, kind + "_flat.json"); json.dump(out, open(p, "w")); return p


def resolve_presets(names):
    """Turn preset NAMES (from the picker) into files. Only files the slicer's own preset folders contain can be chosen."""
    allp = list_presets(); out = {}
    for k in ("machine", "process", "filament"):
        hit = [e for e in allp[k] if e["name"] == (names or {}).get(k)]
        if not hit: raise RuntimeError("Choose your %s settings first (the slicer's saved presets are listed in the panel)." % k)
        out[k] = hit[0]["path"]
    return out


def valid_exe(p):
    b = os.path.basename(p or "").lower()
    return bool(p) and os.path.isfile(p) and "slicer" in b and not any(x in b for x in ("uninst", "unins"))


def slice_stl(stl_bytes, names=None, name="model", timeout=900, log=None):
    """names = {"machine":..., "process":..., "filament":...} preset names. Returns (gcode_path, tool_output)."""
    c = load_cfg(); st = status()
    if not st["exe_found"]: raise RuntimeError("ElegooSlicer was not found on this computer. Install it, or set its path in the helper settings.")
    files = resolve_presets(names or c.get("profile") or {})
    work = tempfile.mkdtemp(prefix="p3d_"); out = os.path.join(work, "out"); os.makedirs(out)
    if c.get("flatten", True): files = {k: flatten(v, k, work) for k, v in files.items()}
    safe = re.sub(r"[^A-Za-z0-9_-]+", "_", name)[:40] or "model"; model = os.path.join(work, safe + ".stl")
    open(model, "wb").write(stl_bytes)
    cmd = [st["exe"], "--slice", "0", "--arrange", "1", "--outputdir", out, "--load-settings", files["machine"] + ";" + files["process"], "--load-filaments", files["filament"], model]
    if log: log("Slicing with " + os.path.basename(st["exe"]) + "...")
    try: r = subprocess.run(cmd, capture_output=True, timeout=timeout, cwd=work)
    except subprocess.TimeoutExpired: raise RuntimeError("The slicer took too long (over %d minutes)." % (timeout // 60))
    outtxt = (r.stdout.decode("utf-8", "replace") + "\n" + r.stderr.decode("utf-8", "replace")).strip()
    gs = sorted(glob.glob(os.path.join(out, "*.gcode")) + glob.glob(os.path.join(work, "**", "*.gcode"), recursive=True), key=os.path.getmtime)
    if not gs:
        raise RuntimeError("The slicer ran but produced no G-code (exit code %s). Last output: %s" % (r.returncode, outtxt[-600:] or "(none)"))
    final = os.path.join(work, safe + ".gcode"); shutil.copy(gs[-1], final)
    return final, outtxt[-1500:]
