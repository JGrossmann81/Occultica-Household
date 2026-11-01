"""Find an Elegoo Centauri Carbon (SDCP v3) on your network. Standard library only.
Method 1: send the UDP text "M99999" to port 3000 on every network card (the printer answers with its name and IP).
Method 2 (if broadcasts are blocked by the router or Windows): try every address on the same /24 network on port 3030, the printer's control port,
then ask each one that answers directly."""
import json, socket, select, time, concurrent.futures as cf

UDP_PORT, WS_PORT = 3000, 3030


def local_ips():
    ips = set()
    try:
        for r in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET): ips.add(r[4][0])
    except Exception: pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(("10.255.255.255", 1)); ips.add(s.getsockname()[0]); s.close()
    except Exception: pass
    return sorted(i for i in ips if not i.startswith(("127.", "169.254.", "0.")))


def parse(data, addr):
    try:
        j = json.loads(data.decode("utf-8", "replace")); d = j.get("Data") or {}
        return {"ip": d.get("MainboardIP") or addr[0], "name": d.get("Name", ""), "model": d.get("MachineName", ""), "brand": d.get("BrandName", ""),
                "id": d.get("MainboardID", ""), "firmware": d.get("FirmwareVersion", ""), "protocol": d.get("ProtocolVersion", ""), "how": "broadcast"}
    except Exception:
        return None


def discover(targets=None, bind_ips=None, timeout=2.5):
    """UDP discovery. targets: addresses to send to; default is the broadcast address of each network card."""
    found, socks = {}, []
    for ip in (bind_ips if bind_ips is not None else local_ips()):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1); s.bind((ip, 0)); s.setblocking(False)
            tg = targets or ["255.255.255.255", ip.rsplit(".", 1)[0] + ".255"]
            for t in tg:
                try: s.sendto(b"M99999", (t, UDP_PORT))
                except Exception: pass
            socks.append(s)
        except Exception: pass
    end = time.time() + timeout
    while socks and time.time() < end:
        r, _, _ = select.select(socks, [], [], 0.2)
        for s in r:
            try:
                data, addr = s.recvfrom(4096); p = parse(data, addr)
                if p: found[p["ip"]] = p
            except Exception: pass
    for s in socks: s.close()
    return list(found.values())


def ask(ip, timeout=1.0, port=UDP_PORT):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.settimeout(timeout)
    try:
        s.sendto(b"M99999", (ip, port)); data, addr = s.recvfrom(4096); p = parse(data, addr)
        if p: p["ip"] = p["ip"] or ip; p["how"] = "direct"
        return p
    except Exception: return None
    finally: s.close()


def port_open(ip, port=WS_PORT, timeout=0.5):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.settimeout(timeout)
    try: return s.connect_ex((ip, port)) == 0
    except Exception: return False
    finally: s.close()


def scan(hosts=None, workers=96, port=WS_PORT, udp_port=UDP_PORT):
    if hosts is None:
        hosts = []
        for ip in local_ips():
            base = ip.rsplit(".", 1)[0]; hosts += [base + "." + str(i) for i in range(1, 255) if base + "." + str(i) != ip]
    hosts = sorted(set(hosts)); out = []
    with cf.ThreadPoolExecutor(workers) as ex:
        hits = [h for h, ok in zip(hosts, ex.map(lambda h: port_open(h, port), hosts)) if ok]
    for h in hits:
        p = ask(h, port=udp_port) or {"ip": h, "name": "", "model": "", "id": "", "firmware": "", "how": "port 3030 open"}
        p["how"] = p.get("how", "scan") if p.get("how") != "broadcast" else "direct"; out.append(p)
    return out


def find(fast_only=False):
    """Best effort: broadcast first, then a scan. Returns (printers, notes)."""
    notes, ips = [], local_ips()
    if not ips: return [], ["This computer has no network address. Check that it is connected to your Wi-Fi or router."]
    notes.append("Network cards tried: " + ", ".join(ips))
    res = discover()
    if res: return res, notes
    notes.append("No answer to the broadcast. Your router or Windows firewall may be blocking it. Trying every address instead...")
    if fast_only: return [], notes
    res = scan()
    if not res: notes.append("Nothing answered on port 3030 either. Check the printer is on, connected to the same Wi-Fi or router (not a guest network), and not in a mode that disables the network.")
    return res, notes


if __name__ == "__main__":
    import sys
    pr, notes = find()
    for n in notes: print(n)
    if not pr: print("\nNo Elegoo printer found."); sys.exit(1)
    for p in pr:
        print("\nFOUND: %s  %s\n  IP address: %s\n  Firmware: %s   Serial/ID: %s   (%s)" % (p.get("name") or "(unnamed)", p.get("model", ""), p["ip"], p.get("firmware", ""), p.get("id", ""), p.get("how")))
    try:
        import subprocess; subprocess.run("clip", input=pr[0]["ip"].encode(), shell=True, check=False); print("\nThe IP address %s was copied. In ElegooSlicer: Device tab > add printer > paste it into the IP box." % pr[0]["ip"])
    except Exception: pass
