"""3DPrintica: one program from photo or model to a printed part. This is the main program (standard library only).
It serves the 3DPrintica page, runs the slicer, talks to the printer, installs the big parts on first use, and starts the AI worker."""
import re, socket, base64, ipaddress, json, mimetypes, os, subprocess, sys, threading, time, traceback
import secrets, hmac, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

BASE = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE)
import printer, slicer, sdcp, setupmgr

PORT = int(os.environ.get("P3D_PORT", "8788"))
AI_PORT = int(os.environ.get("P3D_AI_PORT", "8789"))
UI_DIR = os.environ.get("P3D_UI") or os.path.join(BASE, "ui")
LAN = False
LAST_PING = [0.0]
W = {"proc": None}

# ---------- slice and send (runs on the computer that has ElegooSlicer, normally the shop PC) ----------
# Safety: by default this helper only listens on this computer. "Shop mode" (start-shop.bat) also lets OTHER computers on your
# network send a model to be sliced, but only with the PIN, and they can only send a model and read the result. They can never
# choose which program runs or give it any text: the slicer command is fixed in slicer.py and settings are picked by preset name.
JOBS = {}
FAILS = {}
MAX_BODY = 120 * 1024 * 1024
LAN_PATHS = ("/shop/status", "/shop/slice", "/shop/job", "/shop/gcode")
MB_RE = re.compile(r"^[0-9A-Za-z]{8,40}$")


def lan_pin():
    c = slicer.load_cfg()
    if not c.get("pin"): c = slicer.save_cfg({"pin": secrets.token_urlsafe(9)})
    return c["pin"]


def private_ip(ip):
    try: a = ipaddress.ip_address(ip); return a.version == 4 and a.is_private and not a.is_loopback and not a.is_unspecified
    except Exception: return False


def pin_ok(addr, given):
    now = time.time(); f = [t for t in FAILS.get(addr, []) if now - t < 300]
    if len(f) >= 8: return False
    if hmac.compare_digest(str(given or ""), lan_pin()): return True
    f.append(now); FAILS[addr] = f; return False


def job_run(jid, req):
    j = JOBS[jid]
    def upd(**k): j.update(k)
    try:
        c = slicer.load_cfg()
        upd(stage="slicing", msg="Slicing with your slicer settings...", pct=5)
        gcode, tool = slicer.slice_stl(base64.b64decode(req["stl"]), names=req.get("profile"), name=req.get("name", "model"), log=lambda m: upd(msg=m))
        size = os.path.getsize(gcode); j["gcode"] = gcode; upd(stage="sliced", msg="Sliced: %.1f MB of G-code." % (size / 1e6), pct=40, tool=tool[-300:])
        if not (req.get("send") or req.get("start")): upd(stage="done", done=True, msg="Sliced. Download the G-code below.", pct=100); return
        ip = req.get("ip") or c.get("printer_ip")
        if not private_ip(ip or ""): raise RuntimeError("No printer address yet. Press Find my printer first.")
        mb = c.get("mainboard") if c.get("printer_ip") == ip else ""
        if not (mb and MB_RE.match(mb)):
            info = printer.ask(ip, 2.0) or printer.ask(ip, 2.0)
            mb = (info or {}).get("id", "")
            if not MB_RE.match(mb or ""): raise RuntimeError("The printer at %s did not answer. Is it on and on the same network?" % ip)
            slicer.save_cfg({"printer_ip": ip, "mainboard": mb})
        upd(stage="uploading", msg="Sending to the printer...", pct=45)
        name = re.sub(r"[^A-Za-z0-9_-]+", "_", req.get("name", "model"))[:40] + "_" + time.strftime("%H%M") + ".gcode"
        sdcp.upload(ip, gcode, name, progress=lambda a, b: upd(pct=45 + int(45 * a / b), msg="Sending to the printer... %d%%" % (100 * a // b)))
        if req.get("start"):
            upd(stage="starting", msg="Starting the print...", pct=95)
            r = sdcp.start_print(ip, mb, name, leveling=bool(req.get("leveling", True)))
            if not r.get("ok"): raise RuntimeError("The file is on the printer, but it would not start it (code %s). Start it from the printer's screen." % r.get("ack"))
            upd(stage="done", done=True, pct=100, msg="Printing started: " + name)
        else:
            upd(stage="done", done=True, pct=100, msg="Sent to the printer as " + name + ". Start it from the printer's screen.")
    except Exception as e:
        traceback.print_exc(); upd(stage="error", done=True, error=str(e), msg=str(e))


def shop_get(path, q, local):
    if path == "/shop/status":
        st = slicer.status(); pres = slicer.list_presets()
        st["presets"] = {k: [e["name"] for e in v] for k, v in pres.items()}; st["host"] = socket.gethostname()
        c = slicer.load_cfg(); st["remote"] = c.get("remote", "") if local else ""
        if local and LAN: st["lan"] = True; st["pin"] = lan_pin(); st["addresses"] = ["http://%s:%d" % (i, PORT) for i in printer.local_ips()]
        if not local: st.pop("exe", None); st.pop("exes", None)
        return 200, json.dumps(st), "application/json"
    if path == "/shop/job":
        j = JOBS.get(q.get("id", [""])[0])
        if not j: return 404, "{}", "application/json"
        return 200, json.dumps({k: v for k, v in j.items() if k != "gcode"}), "application/json"
    if path == "/shop/gcode":
        j = JOBS.get(q.get("id", [""])[0])
        if not j or not j.get("gcode"): return 404, "{}", "application/json"
        return 200, open(j["gcode"], "rb").read(), "application/octet-stream"
    return 404, "{}", "application/json"


def shop_post(path, body, local):
    req = json.loads(body or b"{}")
    if path == "/shop/config":
        if not local: return 403, json.dumps({"error": "Settings can only be changed on the shop computer itself."}), "application/json"
        keep = {}
        if isinstance(req.get("profile"), dict): keep["profile"] = {k: str(req["profile"].get(k, ""))[:200] for k in ("machine", "process", "filament")}
        if req.get("printer_ip") is not None:
            if req["printer_ip"] and not private_ip(req["printer_ip"]): return 400, json.dumps({"error": "That is not an address on your own network."}), "application/json"
            keep["printer_ip"] = req["printer_ip"]
        if req.get("mainboard") is not None and (req["mainboard"] == "" or MB_RE.match(str(req["mainboard"]))): keep["mainboard"] = req["mainboard"]
        if req.get("exe") is not None:
            if req["exe"] and not slicer.valid_exe(req["exe"]): return 400, json.dumps({"error": "That file does not look like a slicer program."}), "application/json"
            keep["exe"] = req["exe"]
        if req.get("remote") is not None:
            m = re.match(r"^http://(\d+\.\d+\.\d+\.\d+):(\d{2,5})$", req["remote"] or "")
            if req["remote"] and not (m and private_ip(m.group(1))): return 400, json.dumps({"error": "Use the shop computer's address like http://192.168.1.50:8788"}), "application/json"
            keep["remote"] = req["remote"]
        if "remote_pin" in req: keep["remote_pin"] = str(req["remote_pin"])[:40]
        if "lan" in req: keep["lan"] = bool(req["lan"])
        slicer.save_cfg(keep); return 200, json.dumps({"ok": True}), "application/json"
    if path == "/shop/slice":
        if len(req.get("stl", "")) < 20: return 400, json.dumps({"error": "No model was sent."}), "application/json"
        if req.get("ip") and not private_ip(req["ip"]): return 400, json.dumps({"error": "That is not an address on your own network."}), "application/json"
        safe = {k: req.get(k) for k in ("stl", "name", "send", "start", "leveling", "ip")}; safe["profile"] = req.get("profile") if isinstance(req.get("profile"), dict) else {}
        jid = secrets.token_urlsafe(6); JOBS[jid] = {"stage": "queued", "msg": "Queued...", "pct": 0}
        threading.Thread(target=job_run, args=(jid, safe), daemon=True).start()
        return 200, json.dumps({"id": jid}), "application/json"
    return 404, "{}", "application/json"


def proxy(method, pathq, body, remote, pin):
    rq = urllib.request.Request(remote.rstrip("/") + pathq, data=body if method == "POST" else None, method=method, headers={"X-Pin": pin, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(rq, timeout=900) as r: return r.status, r.read(), r.headers.get("Content-Type", "application/json")
    except urllib.error.HTTPError as e: return e.code, e.read(), "application/json"
    except Exception as e: return 502, json.dumps({"error": "Could not reach the shop computer's helper (" + str(e) + "). Is start-shop.bat running there, and are both computers on the same network?"}).encode(), "application/json"




# ---------- the AI worker (a separate program inside its own Python environment) ----------
def worker_get(path, timeout=1.5):
    with urllib.request.urlopen("http://127.0.0.1:%d%s" % (AI_PORT, path), timeout=timeout) as r: return json.loads(r.read())


def ensure_worker():
    if not setupmgr.ai_ready(): return False
    try: worker_get("/ping"); return True
    except Exception: pass
    p = W["proc"]
    if p is None or p.poll() is not None:
        setupmgr.copy_worker_files()
        env = dict(os.environ, P3D_AI_PORT=str(AI_PORT), P3D_OUT=os.path.join(slicer.HERE, "outputs"), PYTHONIOENCODING="utf-8")
        logf = open(os.path.join(setupmgr.AI, "worker.log"), "ab")
        W["proc"] = subprocess.Popen([setupmgr.envpy(), os.path.join(setupmgr.AI, "ai_worker.py")], cwd=setupmgr.AI, env=env, stdout=logf, stderr=logf, creationflags=0x08000000 if os.name == "nt" else 0)
    return True


def ping_payload():
    base = {"ok": True, "app": "3dprintica-photo3d", "device": "-", "vram": 0, "pct": 0}
    if not setupmgr.ai_ready(): return dict(base, state="noai", msg="The AI engine is not installed yet. Open Setup at the top of the page and press Install.")
    ensure_worker()
    try: return dict(base, **worker_get("/ping"))
    except Exception: return dict(base, state="loading", msg="Starting the AI engine...")


MIME = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".zip": "application/zip", ".svg": "image/svg+xml"}


class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def local(self): return self.client_address[0] in ("127.0.0.1", "::1")
    def cors(self):
        o = self.headers.get("Origin", "")
        if o.startswith(("https://jgrossmann81.github.io", "http://localhost", "http://127.0.0.1")) or not o: self.send_header("Access-Control-Allow-Origin", o or "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Pin")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Expose-Headers", "X-Info")
    def reply(self, code, body, ctype="application/json", extra=None):
        b = body.encode() if isinstance(body, str) else body
        self.send_response(code); self.cors()
        for k, v in (extra or {}).items(): self.send_header(k, v)
        self.send_header("Cache-Control", "no-store"); self.send_header("Content-Type", ctype); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def shop(self, method, body=b""):
        u = urlparse(self.path)
        if not self.local():
            if u.path not in LAN_PATHS: return self.reply(403, json.dumps({"error": "Not allowed from another computer."}))
            if not pin_ok(self.client_address[0], self.headers.get("X-Pin", "")): return self.reply(401, json.dumps({"error": "Wrong PIN for the shop helper."}))
        else:
            c = slicer.load_cfg()
            if c.get("remote") and not u.path.startswith("/shop/config"):
                code, b, ct = proxy(method, self.path, body, c["remote"], c.get("remote_pin", ""))
                return self.reply(code, b, ct)
        try:
            code, b, ct = shop_get(u.path, parse_qs(u.query), self.local()) if method == "GET" else shop_post(u.path, body, self.local())
            self.reply(code, b, ct)
        except Exception as e: traceback.print_exc(); self.reply(500, json.dumps({"error": str(e)}))
    def do_OPTIONS(self): self.reply(204, "")
    def static(self, path):
        rel = "index.html" if path in ("", "/") else path.lstrip("/")
        full = os.path.normpath(os.path.join(UI_DIR, rel))
        if not full.startswith(os.path.normpath(UI_DIR) + os.sep) or not os.path.isfile(full): return self.reply(404, "Not found", "text/plain")
        self.reply(200, open(full, "rb").read(), MIME.get(os.path.splitext(full)[1].lower(), mimetypes.guess_type(full)[0] or "application/octet-stream"))
    def do_GET(self):
        u = urlparse(self.path); p = u.path
        if p.startswith("/shop/"): return self.shop("GET")
        if not self.local(): return self.reply(403, "{}")
        if p == "/ping": LAST_PING[0] = time.time(); return self.reply(200, json.dumps(ping_payload()))
        if p == "/printer/find":
            try: pr, notes = printer.find(); return self.reply(200, json.dumps({"printers": pr, "notes": notes}))
            except Exception as e: return self.reply(500, json.dumps({"error": str(e)}))
        if p == "/printer/check":
            try:
                ip = parse_qs(u.query).get("ip", [""])[0]
                if not private_ip(ip): raise ValueError("Only addresses on your own network can be checked.")
                return self.reply(200, json.dumps({"ip": ip, "reachable": printer.port_open(ip, printer.WS_PORT, 1.5), "info": printer.ask(ip, 1.5)}))
            except Exception as e: return self.reply(400, json.dumps({"error": str(e)}))
        if p == "/setup/status": return self.reply(200, json.dumps(setupmgr.status()))
        if p == "/setup/log":
            try: return self.reply(200, open(setupmgr.LOG, encoding="utf-8").read()[-6000:], "text/plain; charset=utf-8")
            except Exception: return self.reply(200, "", "text/plain")
        return self.static(p)
    def do_POST(self):
        n = int(self.headers.get("Content-Length", "0")); u = urlparse(self.path)
        if n > MAX_BODY: return self.reply(413, json.dumps({"error": "That file is too large."}))
        body = self.rfile.read(n)
        if u.path.startswith("/shop/"): return self.shop("POST", body)
        if not self.local(): return self.reply(403, "{}")
        if u.path == "/setup/install":
            what = parse_qs(u.query).get("what", [""])[0]
            if what == "slicer": setupmgr.install_slicer()
            elif what == "ai": setupmgr.install_ai()
            else: return self.reply(400, json.dumps({"error": "unknown"}))
            return self.reply(200, json.dumps({"ok": True}))
        if u.path == "/make":
            if not setupmgr.ai_ready(): return self.reply(503, json.dumps({"error": "The AI engine is not installed yet. Open Setup at the top of the page."}))
            ensure_worker()
            rq = urllib.request.Request("http://127.0.0.1:%d/make" % AI_PORT, data=body, method="POST", headers={"Content-Type": "application/json"})
            try:
                with urllib.request.urlopen(rq, timeout=3600) as r: return self.reply(200, r.read(), "application/octet-stream", {"X-Info": r.headers.get("X-Info", "{}")})
            except urllib.error.HTTPError as e: return self.reply(e.code, e.read(), "application/json")
            except Exception as e: return self.reply(502, json.dumps({"error": "The AI engine is not answering yet (%s). Wait a moment and try again." % e}))
        return self.reply(404, "{}")


def find_browser():
    cands = [os.path.join(os.environ.get(k, ""), p) for k in ("ProgramFiles(x86)", "ProgramFiles", "LOCALAPPDATA") for p in ("Microsoft\\Edge\\Application\\msedge.exe", "Google\\Chrome\\Application\\chrome.exe")]
    return next((c for c in cands if c and os.path.isfile(c)), None)


def open_window():
    url = "http://127.0.0.1:%d/" % PORT; b = find_browser()
    if b: subprocess.Popen([b, "--app=" + url, "--user-data-dir=" + os.path.join(slicer.HERE, "window"), "--window-size=1320,920", "--no-first-run", "--no-default-browser-check"])
    else:
        import webbrowser; webbrowser.open(url)


def already_running():
    try:
        with urllib.request.urlopen("http://127.0.0.1:%d/ping" % PORT, timeout=1.5) as r: return json.loads(r.read()).get("app") == "3dprintica-photo3d"
    except Exception: return False


def main():
    global LAN, PORT
    args = sys.argv[1:]; LAN = "--shop" in args or os.environ.get("P3D_LAN") == "1"
    if already_running():
        if "--nowindow" not in args: open_window()
        return
    setupmgr.copy_worker_files() if setupmgr.ai_ready() else None
    srv = ThreadingHTTPServer(("0.0.0.0" if LAN else "127.0.0.1", PORT), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    if LAN: print("SHOP MODE: PIN %s" % lan_pin(), flush=True)
    if "--nowindow" not in args: open_window()
    start = time.time()
    try:
        while True:  # stop a little after the window is closed (the page pings once a second)
            time.sleep(2)
            if "--nowindow" in args: continue
            if (LAST_PING[0] and time.time() - LAST_PING[0] > 25) or (not LAST_PING[0] and time.time() - start > 120): break
    finally:
        if W["proc"] and W["proc"].poll() is None: W["proc"].terminate()


if __name__ == "__main__":
    main()
