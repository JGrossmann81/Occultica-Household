"""Mesh clean-up for printing, using only numpy and scipy: drop floating bits, smooth the stair-steps left by
marching cubes, close small holes, make the faces point outward, and write a binary STL."""
import numpy as np
from scipy import sparse
from scipy.sparse import csgraph


def weld(v, f, tol=1e-6):
    key = np.round(v / tol).astype(np.int64)
    _, idx, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    inv = np.asarray(inv).reshape(-1)
    f2 = inv[f]
    ok = (f2[:, 0] != f2[:, 1]) & (f2[:, 1] != f2[:, 2]) & (f2[:, 0] != f2[:, 2])
    return v[idx], f2[ok]


def compact(v, f):
    used = np.unique(f)
    remap = -np.ones(len(v), dtype=np.int64); remap[used] = np.arange(len(used))
    return v[used], remap[f]


def keep_main(v, f, min_share=0.02):
    """Keep the biggest piece and any piece with at least min_share of its faces; drop the floating specks."""
    n = len(v)
    a = sparse.coo_matrix((np.ones(len(f) * 3), (f[:, 0].tolist() + f[:, 1].tolist() + f[:, 2].tolist(), f[:, 1].tolist() + f[:, 2].tolist() + f[:, 0].tolist())), shape=(n, n))
    k, lab = csgraph.connected_components(a, directed=False)
    if k <= 1: return v, f, 0
    cnt = np.bincount(lab[f[:, 0]], minlength=k)
    keep = cnt >= max(1, cnt.max() * min_share)
    mask = keep[lab[f[:, 0]]]
    v2, f2 = compact(v, f[mask])
    return v2, f2, int(k - keep.sum())


def smooth(v, f, iters=10, lam=0.5, mu=-0.53):
    """Taubin smoothing: removes surface noise without shrinking the model."""
    if iters <= 0: return v
    n = len(v)
    e = np.vstack([f[:, [0, 1]], f[:, [1, 2]], f[:, [2, 0]]])
    a = sparse.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n)).tocsr()
    a = ((a + a.T) > 0).astype(np.float64)
    d = np.asarray(a.sum(1)).reshape(-1); d[d == 0] = 1
    w = sparse.diags(1.0 / d) @ a
    v = v.astype(np.float64).copy()
    for _ in range(iters):
        v += lam * (w @ v - v)
        v += mu * (w @ v - v)
    return v


def boundary_loops(f):
    e = np.vstack([f[:, [0, 1]], f[:, [1, 2]], f[:, [2, 0]]])
    s = {(int(a), int(b)) for a, b in e}
    nxt = {}
    for a, b in s:
        if (b, a) not in s: nxt.setdefault(a, []).append(b)
    loops, seen = [], set()
    for a0 in list(nxt):
        if a0 in seen: continue
        loop, cur, guard = [], a0, 0
        while cur is not None and cur not in seen and guard < 100000:
            seen.add(cur); loop.append(cur); guard += 1
            n = nxt.get(cur); cur = n[0] if n else None
        if len(loop) >= 3: loops.append(loop)
    return loops


def fill_holes(v, f, max_edges=400):
    """Close holes up to max_edges edges around with a fan from the middle."""
    loops = [l for l in boundary_loops(f) if len(l) <= max_edges]
    if not loops: return v, f, 0
    add_v, add_f, base = [], [], len(v)
    for l in loops:
        c = v[l].mean(0); ci = base + len(add_v); add_v.append(c)
        for i in range(len(l)):
            a, b = l[i], l[(i + 1) % len(l)]
            add_f.append([b, a, ci])  # the hole edge runs a->b in the surface, so the fan runs b->a
    return np.vstack([v, np.array(add_v)]), np.vstack([f, np.array(add_f)]), len(loops)


def signed_volume(v, f):
    t = v[f]
    return float(np.einsum('ij,ij->i', t[:, 0], np.cross(t[:, 1], t[:, 2])).sum() / 6)


def open_edges(f):
    e = np.vstack([f[:, [0, 1]], f[:, [1, 2]], f[:, [2, 0]]])
    s = {(int(a), int(b)) for a, b in e}
    return sum(1 for a, b in s if (b, a) not in s)


def clean(v, f, smooth_iters=10, target_faces=0, reducer=None):
    """Returns (vertices, faces, info). reducer(v, f, n) -> (v, f) can shrink the triangle count."""
    v = np.asarray(v, dtype=np.float64); f = np.asarray(f, dtype=np.int64)
    info = {}
    v, f = weld(v, f)
    v, f, dropped = keep_main(v, f); info['dropped_pieces'] = dropped
    v = smooth(v, f, smooth_iters)
    if target_faces and len(f) > target_faces and reducer:
        try:
            v, f = reducer(v, f, int(target_faces)); v, f = weld(np.asarray(v, dtype=np.float64), np.asarray(f, dtype=np.int64))
        except Exception as e:
            info['reduce_error'] = str(e)
    v, f, holes = fill_holes(v, f); info['holes_closed'] = holes
    if signed_volume(v, f) < 0: f = f[:, ::-1].copy(); info['flipped'] = True
    info['faces'] = int(len(f)); info['open_edges'] = open_edges(f); info['watertight'] = info['open_edges'] == 0
    return v, f, info


def stl_bytes(v, f, name=b'3DPrintica'):
    t = v[f].astype(np.float32)
    nrm = np.cross(t[:, 1] - t[:, 0], t[:, 2] - t[:, 0]); ln = np.linalg.norm(nrm, axis=1, keepdims=True); ln[ln == 0] = 1; nrm = (nrm / ln).astype(np.float32)
    rec = np.zeros(len(f), dtype=[('n', '<f4', 3), ('v', '<f4', (3, 3)), ('a', '<u2')])
    rec['n'] = nrm; rec['v'] = t
    return name.ljust(80, b'\0')[:80] + np.uint32(len(f)).tobytes() + rec.tobytes()
