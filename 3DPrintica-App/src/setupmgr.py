"""Installs the program's big parts on first use: the slicer (OrcaSlicer, which ElegooSlicer is built on, with Elegoo profiles) and the AI engine."""
import glob, json, os, shutil, subprocess, sys, threading, time, urllib.request, zipfile
import slicer

DATA = slicer.HERE
BASE = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
AI = os.path.join(DATA, "ai")
UA = {"User-Agent": "3DPrintica"}
T = {"slicer": {"state": "idle", "pct": 0, "msg": ""}, "ai": {"state": "idle", "pct": 0, "msg": ""}}
LOG = os.path.join(DATA, "setup.log")


def log(m):
    try: open(LOG, "a", encoding="utf-8").write(time.strftime("%H:%M:%S ") + m + "\n")
    except Exception: pass


def envpy(): return os.path.join(AI, "env", "Scripts", "python.exe") if os.name == "nt" else os.path.join(AI, "env", "bin", "python")


def ai_ready(): return os.path.exists(os.path.join(AI, "ready.flag")) and os.path.exists(envpy())


def slicer_ready():
    st = slicer.status(); return bool(st["exe_found"])


def status():
    out = {}
    for k, ready in (("slicer", slicer_ready()), ("ai", ai_ready())):
        t = dict(T[k])
        if ready and t["state"] != "installing": t.update(state="ready", pct=100)
        elif t["state"] == "idle": t["state"] = "missing"
        out[k] = t
    out["nvidia"] = has_nvidia(); out["dir"] = DATA
    return out


def has_nvidia():
    try: return subprocess.run(["nvidia-smi"], capture_output=True, timeout=8).returncode == 0
    except Exception: return False


def download(url, dest, k, lo, hi):
    """Download with progress mapped into the pct range lo..hi."""
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        total = int(r.headers.get("Content-Length") or 0); got = 0
        while True:
            b = r.read(1 << 18)
            if not b: break
            f.write(b); got += len(b)
            if total: T[k]["pct"] = lo + int((hi - lo) * got / total); T[k]["msg"] = "Downloading %s... %d of %d MB" % (os.path.basename(dest), got >> 20, total >> 20)


def pick_orca_asset():
    for rel in json.load(urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/SoftFever/OrcaSlicer/releases?per_page=10", headers=UA), timeout=30)):
        if rel.get("draft") or rel.get("prerelease"): continue
        for a in rel.get("assets", []):
            n = a["name"].lower()
            if "windows" in n and "portable" in n and n.endswith(".zip"): return a["browser_download_url"], a["name"]
    raise RuntimeError("Could not find a portable OrcaSlicer download for Windows.")


def install_slicer():
    t = T["slicer"]
    if t["state"] == "installing": return
    t.update(state="installing", pct=1, msg="Finding the latest OrcaSlicer...")
    def run():
        try:
            url, name = pick_orca_asset(); log("orca asset " + name)
            os.makedirs(os.path.join(DATA, "dl"), exist_ok=True); z = os.path.join(DATA, "dl", name)
            download(url, z, "slicer", 3, 80)
            t.update(pct=82, msg="Unpacking..."); dst = os.path.join(DATA, "orca"); shutil.rmtree(dst, ignore_errors=True)
            with zipfile.ZipFile(z) as zf: zf.extractall(dst)
            os.remove(z)
            exes = glob.glob(os.path.join(dst, "**", "orca-slicer.exe"), recursive=True) or glob.glob(os.path.join(dst, "**", "orca-slicer"), recursive=True)
            if not exes: raise RuntimeError("The slicer download did not contain orca-slicer.exe.")
            slicer.save_cfg({"exe": exes[0]}); t.update(state="ready", pct=100, msg="Slicer installed.")
        except Exception as e:
            log("slicer error " + repr(e)); t.update(state="error", msg=str(e))
    threading.Thread(target=run, daemon=True).start()


def sh(cmd, k, lo, hi, env=None):
    """Run a command, show its last line as progress."""
    log("RUN " + " ".join(cmd)); T[k]["pct"] = lo
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env=env, creationflags=0x08000000 if os.name == "nt" else 0)
    last = []
    for line in iter(p.stdout.readline, b""):
        s = line.decode("utf-8", "replace").strip()
        if s: last.append(s); last[:] = last[-8:]; T[k]["msg"] = s[:140]; log(s)
    if p.wait() != 0: raise RuntimeError("A step failed: " + " | ".join(last[-3:]))
    T[k]["pct"] = hi


def copy_worker_files():
    os.makedirs(AI, exist_ok=True)
    for f in ("ai_worker.py", "meshfix.py", "mc_core.py"):
        for src in (os.path.join(BASE, f), os.path.join(BASE, "src", f)):
            if os.path.exists(src): shutil.copy(src, os.path.join(AI, f)); break


def install_ai():
    t = T["ai"]
    if t["state"] == "installing": return
    t.update(state="installing", pct=1, msg="Starting...")
    def run():
        try:
            os.makedirs(AI, exist_ok=True); os.makedirs(os.path.join(DATA, "dl"), exist_ok=True)
            uv = os.path.join(DATA, "uv", "uv.exe" if os.name == "nt" else "uv")
            if not os.path.exists(uv):
                z = os.path.join(DATA, "dl", "uv.zip"); download("https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-pc-windows-msvc.zip", z, "ai", 1, 4)
                with zipfile.ZipFile(z) as zf: zf.extractall(os.path.join(DATA, "uv"))
                for p in glob.glob(os.path.join(DATA, "uv", "**", "uv.exe"), recursive=True):
                    if p != uv: shutil.copy(p, uv)
            env = dict(os.environ, UV_PYTHON_INSTALL_DIR=os.path.join(DATA, "uvpy"), UV_CACHE_DIR=os.path.join(DATA, "uvcache"))
            py = envpy()
            if not os.path.exists(py): sh([uv, "venv", "--python", "3.11", os.path.join(AI, "env")], "ai", 5, 10, env)
            idx = "https://download.pytorch.org/whl/cu124" if has_nvidia() else "https://download.pytorch.org/whl/cpu"
            sh([uv, "pip", "install", "--python", py, "torch", "torchvision", "--index-url", idx], "ai", 10, 55, env)
            sh([uv, "pip", "install", "--python", py, "numpy<2", "scipy", "scikit-image", "Pillow", "opencv-python", "einops", "omegaconf", "pyyaml", "tqdm", "safetensors", "accelerate", "huggingface_hub<0.26", "transformers==4.46.3", "diffusers==0.31.0", "trimesh", "pymeshlab", "rembg", "onnxruntime"], "ai", 55, 75, env)
            try: sh([uv, "pip", "install", "--python", py, "xatlas", "moderngl", "imageio[ffmpeg]"], "ai", 75, 78, env)
            except Exception as e: log("optional TripoSR extras failed: " + str(e))
            for repo, d, top in (("Tencent-Hunyuan/Hunyuan3D-2", "Hunyuan3D-2", "Hunyuan3D-2-main"), ("VAST-AI-Research/TripoSR", "TripoSR", "TripoSR-main")):
                if os.path.isdir(os.path.join(AI, d)): continue
                z = os.path.join(DATA, "dl", d + ".zip"); download("https://codeload.github.com/%s/zip/refs/heads/main" % repo, z, "ai", 78 if d[0] == "H" else 88, 88 if d[0] == "H" else 96)
                with zipfile.ZipFile(z) as zf: zf.extractall(AI)
                os.rename(os.path.join(AI, top), os.path.join(AI, d)); os.remove(z)
            copy_worker_files(); open(os.path.join(AI, "ready.flag"), "w").write("ok")
            t.update(state="ready", pct=100, msg="AI engine installed.")
        except Exception as e:
            log("ai error " + repr(e)); t.update(state="error", msg=str(e))
    threading.Thread(target=run, daemon=True).start()
