"""Talk to an Elegoo Centauri Carbon (original, SDCP v3) from plain Python: upload a G-code file and start the print.
Protocol facts come from Elegoo's SDCP v3 document and the open pycentauri project (which tested V1.1.46):
  upload: HTTP POST http://<ip>:80/uploadFile/upload, 1 MiB chunks, multipart fields Check, S-File-MD5, Offset, Uuid, TotalSize, File; each reply {"code":"000000"}
  control: WebSocket ws://<ip>:3030/websocket, Cmd 128 = start print, Cmd 0 = status."""
import base64, hashlib, json, os, socket, struct, time, uuid, http.client

CHUNK = 1024 * 1024


# ---------- a tiny WebSocket client (RFC 6455), enough for JSON text frames ----------
class WS:
    def __init__(self, host, port=3030, path="/websocket", timeout=8):
        self.s = socket.create_connection((host, port), timeout=timeout); self.s.settimeout(timeout)
        key = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall(("GET %s HTTP/1.1\r\nHost: %s:%d\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n" % (path, host, port, key)).encode())
        head = b""
        while b"\r\n\r\n" not in head:
            c = self.s.recv(1024)
            if not c: raise ConnectionError("The printer closed the connection.")
            head += c
        head, self.buf = head.split(b"\r\n\r\n", 1)
        if b" 101 " not in head.split(b"\r\n")[0] + b" ":
            raise ConnectionError("The printer refused the connection: " + head.split(b"\r\n")[0].decode("latin1") + " (it allows only a few connections at once; close other apps that are connected to it).")
        want = base64.b64encode(hashlib.sha1((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode()).digest())
        if want not in head: raise ConnectionError("Unexpected WebSocket answer from the printer.")

    def send(self, text):
        data = text.encode(); n = len(data); mask = os.urandom(4)
        hdr = bytes([0x81]) + (bytes([0x80 | n]) if n < 126 else bytes([0x80 | 126]) + struct.pack(">H", n) if n < 65536 else bytes([0x80 | 127]) + struct.pack(">Q", n))
        self.s.sendall(hdr + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

    def _need(self, n):
        while len(self.buf) < n:
            c = self.s.recv(65536)
            if not c: raise ConnectionError("The printer closed the connection.")
            self.buf += c
        out, self.buf = self.buf[:n], self.buf[n:]; return out

    def recv(self):
        """Next text message, or None on close."""
        msg = b""
        while True:
            b1, b2 = self._need(2); op, fin, ln = b1 & 15, b1 & 128, b2 & 127
            if ln == 126: ln = struct.unpack(">H", self._need(2))[0]
            elif ln == 127: ln = struct.unpack(">Q", self._need(8))[0]
            mask = self._need(4) if b2 & 128 else None; data = self._need(ln)
            if mask: data = bytes(b ^ mask[i % 4] for i, b in enumerate(data))
            if op == 8: return None
            if op == 9: self.s.sendall(bytes([0x8A, 0x80]) + os.urandom(4)); continue   # answer a ping with an empty pong
            if op in (1, 2, 0): msg += data
            if fin and op in (1, 2, 0): return msg.decode("utf-8", "replace")

    def close(self):
        try: self.s.close()
        except Exception: pass


def request(ws, mainboard, cmd, data=None):
    rid = uuid.uuid4().hex[:16]
    ws.send(json.dumps({"Id": mainboard, "Topic": "sdcp/request/" + mainboard, "Data": {"Cmd": cmd, "Data": data or {}, "RequestID": rid, "MainboardID": mainboard, "TimeStamp": int(time.time() * 1000), "From": 1}}))
    end = time.time() + 10
    while time.time() < end:
        m = ws.recv()
        if m is None: raise ConnectionError("The printer closed the connection.")
        try: j = json.loads(m)
        except Exception: continue
        d = j.get("Data") or {}
        if str(j.get("Topic", "")).startswith("sdcp/response") and d.get("RequestID") == rid: return d
    raise TimeoutError("The printer did not answer.")


# ---------- upload ----------
def upload(ip, path, name=None, progress=None, port=80):
    name = name or os.path.basename(path); total = os.path.getsize(path)
    if total == 0: raise ValueError("The G-code file is empty.")
    md5 = hashlib.md5()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(CHUNK), b""): md5.update(b)
    md5 = md5.hexdigest(); uid = uuid.uuid4().hex; off = 0
    with open(path, "rb") as f:
        while True:
            chunk = f.read(CHUNK)
            if not chunk: break
            bd = uuid.uuid4().hex; body = b""
            for k, v in (("Check", "1"), ("S-File-MD5", md5), ("Offset", str(off)), ("Uuid", uid), ("TotalSize", str(total))):
                body += ('--%s\r\nContent-Disposition: form-data; name="%s"\r\n\r\n%s\r\n' % (bd, k, v)).encode()
            body += ('--%s\r\nContent-Disposition: form-data; name="File"; filename="%s"\r\nContent-Type: application/octet-stream\r\n\r\n' % (bd, name)).encode() + chunk + ("\r\n--%s--\r\n" % bd).encode()
            c = http.client.HTTPConnection(ip, port, timeout=120)
            try:
                c.request("POST", "/uploadFile/upload", body, {"Content-Type": "multipart/form-data; boundary=" + bd})
                r = c.getresponse(); txt = r.read().decode("utf-8", "replace")
            finally: c.close()
            if r.status != 200: raise RuntimeError("The printer refused part of the file (HTTP %d)." % r.status)
            try: ok = json.loads(txt).get("code") == "000000"
            except Exception: ok = False
            if not ok: raise RuntimeError("The printer did not accept the file: " + txt[:200])
            off += len(chunk)
            if progress: progress(off, total)
    return name


def start_print(ip, mainboard, name, leveling=True, port=3030):
    ws = WS(ip, port)
    try:
        for fn in (name, "/local/" + name):
            r = request(ws, mainboard, 128, {"Filename": fn, "StartLayer": 0, "Calibration_switch": 1 if leveling else 0, "PrintPlatformType": 0, "Tlp_Switch": 0, "slot_map": [], "path_prefix": "/local"})
            ack = (r.get("Data") or {}).get("Ack")
            if ack == 0: return {"ok": True, "filename": fn}
        return {"ok": False, "ack": ack}
    finally: ws.close()


def status(ip, port=3030):
    ws = WS(ip, port)
    try:
        end = time.time() + 6
        ws.send(json.dumps({"Id": "x", "Topic": "sdcp/request/x", "Data": {"Cmd": 0, "Data": {}, "RequestID": uuid.uuid4().hex[:16], "MainboardID": "", "TimeStamp": int(time.time() * 1000), "From": 1}}))
        while time.time() < end:
            m = ws.recv()
            if m is None: break
            try: j = json.loads(m)
            except Exception: continue
            if str(j.get("Topic", "")).startswith("sdcp/status"): return j.get("Status") or j.get("Data") or j
        return None
    finally: ws.close()
