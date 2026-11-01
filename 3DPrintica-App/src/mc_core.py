"""Marching cubes on the CPU with scikit-image. TripoSR normally needs the 'torchmcubes' package,
which has to be compiled on Windows. This gives the same result without any compiling."""
import numpy as np
from skimage import measure

def mc_numpy(vol, thresh):
    """vol[i,j,k] is high inside. Returns (verts, faces) with vertices ordered (k, j, i), the order
    torchmcubes uses (TripoSR flips them back with [2,1,0]), and outward-facing triangles."""
    vol = np.asarray(vol, dtype=np.float32)
    if not (vol.min() < thresh < vol.max()):
        raise ValueError("No object was found in the picture. Try a clearer photo with the whole subject in view.")
    verts, faces, _n, _v = measure.marching_cubes(vol, level=thresh, gradient_direction="ascent")
    return np.ascontiguousarray(verts[:, ::-1], dtype=np.float32), np.ascontiguousarray(faces, dtype=np.int64)
