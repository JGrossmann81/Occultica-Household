"""3DPrintica AI worker. Runs on YOUR PC and turns photos into 3D models with free, open AI models.
Engines: Hunyuan3D 2 (best), Hunyuan3D 2 Turbo (fast), Hunyuan3D 2 mini (light), Hunyuan3D 2 multi-view (2 to 4 photos),
and TripoSR (MIT licence). Start it with start.bat, then use the "Photo to 3D" tab on the 3DPrintica page.
Nothing leaves your computer except the one-time model downloads from Hugging Face."""
import base64, gc, io, json, os, sys, time, threading, types, traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
PORT = int(os.environ.get("P3D_AI_PORT", "8789"))
HY_DIR = os.environ.get("HY_DIR", os.path.join(HERE, "Hunyuan3D-2"))
TSR_DIR = os.environ.get("TSR_DIR", os.path.join(HERE, "TripoSR"))
OUT = os.environ.get("P3D_OUT") or os.path.join(HERE, "outputs"); os.makedirs(OUT, exist_ok=True)
STATE = {"state": "starting", "msg": "Starting...", "device": "?", "vram": 0, "pct": 0, "engine": ""}
LOCK = threading.Lock()
M = {}

ENGINES = {
    "hy2":      dict(label="Hunyuan3D 2 (best quality)", repo="tencent/Hunyuan3D-2", sub="hunyuan3d-dit-v2-0", steps=(20, 30, 40, 50), up="y"),
    "hy2turbo": dict(label="Hunyuan3D 2 Turbo (fast)", repo="tencent/Hunyuan3D-2", sub="hunyuan3d-dit-v2-0-turbo", steps=(3, 5, 5, 8), up="y", flash=True),
    "hy2mini":  dict(label="Hunyuan3D 2 mini (light)", repo="tencent/Hunyuan3D-2mini", sub="hunyuan3d-dit-v2-mini", steps=(20, 30, 40, 50), up="y"),
    "hy2mv":    dict(label="Hunyuan3D 2 multi-view (2 to 4 photos)", repo="tencent/Hunyuan3D-2mv", sub="hunyuan3d-dit-v2-mv", steps=(20, 30, 40, 50), up="y", mv=True),
    "triposr":  dict(label="TripoSR (fast, MIT licence)", up="z"),
}
QUALITY = {"draft": (0, 256), "good": (1, 320), "high": (2, 384), "max": (3, 512)}  # (index into steps, octree resolution)


def say(msg, state=None, pct=None):
    STATE["msg"] = msg
    if state: STATE["state"] = state
    if pct is not None: STATE["pct"] = pct
    print(msg, flush=True)


def init():
    try:
        say("Starting up...", "loading")
        import torch
        dev = "cuda" if torch.cuda.is_available() else "cpu"
        M["torch"], M["dev"] = torch, dev
        if dev == "cuda":
            p = torch.cuda.get_device_properties(0)
            STATE["vram"] = round(p.total_memory / 2**30, 1); STATE["device"] = p.name
        else:
            STATE["device"] = "cpu"
        if not os.path.isdir(os.path.join(HY_DIR, "hy3dgen")) and not os.path.isdir(os.path.join(TSR_DIR, "tsr")):
            raise RuntimeError("The AI code was not found. Run setup.bat first.")
        say("Ready. The first photo downloads the AI model (a few GB), so it takes longer.", "ready")
    except Exception as e:
        traceback.print_exc(); say("Could not start: " + str(e), "error")


def unload():
    for k in ("pipe", "tsr"):
        M.pop(k, None)
    M["engine"] = None
    gc.collect()
    if M["dev"] == "cuda": M["torch"].cuda.empty_cache()


def install_mc_shim():
    try:
        import torchmcubes  # noqa
        return
    except Exception:
        pass
    import torch
    from mc_core import mc_numpy
    mod = types.ModuleType("torchmcubes")
    def marching_cubes(vol, thresh):
        v, f = mc_numpy(vol.detach().cpu().numpy(), float(thresh))
        return torch.from_numpy(v), torch.from_numpy(f)
    mod.marching_cubes = marching_cubes
    sys.modules["torchmcubes"] = mod


def load_engine(name):
    if M.get("engine") == name: return
    unload(); torch, dev = M["torch"], M["dev"]
    cfg = ENGINES[name]
    say("Loading " + cfg["label"] + ". The first time this downloads the model, which can take several minutes...", pct=0)
    if name == "triposr":
        sys.path.insert(0, TSR_DIR); install_mc_shim()
        from tsr.system import TSR
        m = TSR.from_pretrained("stabilityai/TripoSR", config_name="config.yaml", weight_name="model.ckpt")
        m.renderer.set_chunk_size(8192); m.to(dev); M["tsr"] = m
    else:
        if HY_DIR not in sys.path: sys.path.insert(0, HY_DIR)
        from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline
        pipe = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(cfg["repo"], subfolder=cfg["sub"], use_safetensors=True, device=dev)
        if cfg.get("flash"):
            try: pipe.enable_flashvdm(mc_algo="mc")
            except Exception as e: print("FlashVDM not available:", e)
        M["pipe"] = pipe
    M["engine"] = name


def cut_out(img, strip):
    """Hunyuan wants the subject on a transparent background."""
    if strip or img.mode != "RGBA":
        if "rb" not in M:
            from hy3dgen.rembg import BackgroundRemover
            M["rb"] = BackgroundRemover()
        return M["rb"](img.convert("RGB"))
    return img


def reducer(v, f, n):
    import pymeshlab
    ms = pymeshlab.MeshSet(); ms.add_mesh(pymeshlab.Mesh(vertex_matrix=v, face_matrix=f))
    ms.meshing_decimation_quadric_edge_collapse(targetfacenum=n, preserveboundary=True, preservenormal=True, preservetopology=True, qualitythr=0.5)
    m = ms.current_mesh(); return m.vertex_matrix(), m.face_matrix()


def run_hunyuan(req, imgs, steps, octree):
    torch, np = M["torch"], M["np"]
    cfg = ENGINES[req["engine"]]; pipe = M["pipe"]
    strip = bool(req.get("strip", True))
    if cfg.get("mv"):
        image = {k: cut_out(v, strip) for k, v in imgs.items()}
    else:
        image = cut_out(imgs["front"], strip)
    gen = torch.Generator().manual_seed(int(req.get("seed", 1234)))
    chunks = 8000 if STATE["vram"] < 12 else 20000
    def cb(i, t, outputs):
        STATE["pct"] = int(100 * (i + 1) / max(1, steps)); STATE["msg"] = "Shaping the model: step %d of %d" % (i + 1, steps)
        if i + 1 >= steps: STATE["msg"] = "Building the surface (resolution %d). This part can take a minute..." % octree
    kw = dict(image=image, num_inference_steps=steps, guidance_scale=float(req.get("guidance", 5.0)), generator=gen,
              octree_resolution=octree, num_chunks=chunks, callback=cb, callback_steps=1)
    mesh = pipe(**kw)[0]
    if mesh is None: raise RuntimeError("No object was found in the photo. Try a clearer photo with the whole subject in view.")
    return np.asarray(mesh.vertices, dtype=np.float64), np.asarray(mesh.faces, dtype=np.int64)


def run_triposr(req, imgs, octree):
    torch, np = M["torch"], M["np"]
    from PIL import Image
    import rembg
    from tsr.utils import remove_background, resize_foreground
    img = imgs["front"]
    if req.get("strip", True) or img.mode != "RGBA":
        if "sess" not in M: M["sess"] = rembg.new_session()
        img = resize_foreground(remove_background(img, M["sess"]), 0.85)
        a = np.array(img).astype(np.float32) / 255.0
        a = a[:, :, :3] * a[:, :, 3:4] + (1 - a[:, :, 3:4]) * 0.5
        img = Image.fromarray((a * 255.0).astype(np.uint8))
    else:
        img = img.convert("RGB")
    with torch.no_grad():
        codes = M["tsr"]([img], device=M["dev"])
        mesh = M["tsr"].extract_mesh(codes, False, resolution=min(octree, 512))[0]
    return np.asarray(mesh.vertices, dtype=np.float64), np.asarray(mesh.faces, dtype=np.int64)


def make(req):
    import numpy as np
    from PIL import Image
    import meshfix
    M["np"] = np
    name = req.get("engine", "hy2")
    if name not in ENGINES: raise ValueError("Unknown engine " + str(name))
    cfg = ENGINES[name]
    imgs = {k: Image.open(io.BytesIO(base64.b64decode(b))) for k, b in (req.get("views") or {}).items() if b}
    for k in imgs: imgs[k].load()
    if "front" not in imgs: raise ValueError("Add a front photo first.")
    if cfg.get("mv") and len(imgs) < 2: raise ValueError("Multi-view needs at least two photos: the front and one more (back, left or right).")
    qi, octree = QUALITY.get(req.get("quality", "high"), QUALITY["high"])
    steps = (cfg.get("steps") or (0, 0, 0, 0))[qi]
    if STATE["vram"] and STATE["vram"] < 12: octree = min(octree, 448)
    t0 = time.time(); stamp = time.strftime("%Y%m%d_%H%M%S")
    load_engine(name)
    say("Working..."); STATE["pct"] = 0
    while True:
        try:
            v, f = run_triposr(req, imgs, octree) if name == "triposr" else run_hunyuan(req, imgs, steps, octree)
            break
        except M["torch"].cuda.OutOfMemoryError:
            M["torch"].cuda.empty_cache(); gc.collect()
            if octree <= 256: raise RuntimeError("The graphics card ran out of memory. Close other programs, or pick Draft quality or the mini engine.")
            octree = max(256, octree - 64); say("Out of video memory, trying again at resolution %d..." % octree)
    say("Cleaning up the mesh for printing...", pct=100)
    smooth = int(req.get("smooth", 2)) * 5
    v, f, info = meshfix.clean(v, f, smooth_iters=smooth, target_faces=int(req.get("faces", 300000)), reducer=reducer)
    data = meshfix.stl_bytes(v, f)
    with open(os.path.join(OUT, stamp + "_" + name + ".stl"), "wb") as fh: fh.write(data)
    imgs["front"].save(os.path.join(OUT, stamp + "_input.png"))
    info.update(engine=cfg["label"], up=cfg["up"], seconds=round(time.time() - t0, 1), octree=octree, steps=steps)
    return data, info



class H(BaseHTTPRequestHandler):
    """Only this computer may talk to the worker."""
    def log_message(self, *a): pass
    def local(self): return self.client_address[0] in ("127.0.0.1", "::1")
    def reply(self, code, body, ctype="application/json", extra=None):
        b = body.encode() if isinstance(body, str) else body
        self.send_response(code)
        for k, v in (extra or {}).items(): self.send_header(k, v)
        self.send_header("Content-Type", ctype); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if not self.local(): return self.reply(403, "{}")
        if urlparse(self.path).path == "/ping": self.reply(200, json.dumps(dict(STATE, ok=True, engines={k: v["label"] for k, v in ENGINES.items()})))
        else: self.reply(404, "{}")
    def do_POST(self):
        if not self.local() or urlparse(self.path).path != "/make": return self.reply(403, "{}")
        n = int(self.headers.get("Content-Length", "0"))
        if n > 200 * 1024 * 1024: return self.reply(413, json.dumps({"error": "Too large."}))
        body = self.rfile.read(n)
        if STATE["state"] != "ready": return self.reply(503, json.dumps({"error": STATE["msg"]}))
        try:
            req = json.loads(body)
            with LOCK:
                STATE["state"] = "busy"
                try: data, info = make(req)
                finally: STATE["state"] = "ready"
            say("Done in %.0f s: %d triangles, %s. Ready." % (info["seconds"], info["faces"], "solid" if info["watertight"] else "has small gaps"), pct=100)
            self.reply(200, data, "application/octet-stream", {"X-Info": json.dumps(info)})
        except Exception as e:
            traceback.print_exc(); say("Ready.")
            self.reply(500, json.dumps({"error": str(e)}))


if __name__ == "__main__":
    threading.Thread(target=init, daemon=True).start()
    print("3DPrintica AI worker on 127.0.0.1:%d" % PORT, flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
