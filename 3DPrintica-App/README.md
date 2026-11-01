# 3DPrintica (program)

One Windows program from photo or model to printed part. The page itself lives in `../3DPrintica/`; this folder wraps it with a small local
server (`src/main.py`, standard library only), the slicer and printer code, and an installer.

* `src/main.py`      the program: serves the page, slices, talks to the printer, installs the big parts, starts the AI worker, opens its own window
* `src/ai_worker.py` photo to 3D (runs inside its own Python environment that the program installs on first use)
* `src/slicer.py`    runs OrcaSlicer on the command line (Elegoo profiles come with it)
* `src/sdcp.py`      uploads G-code to the Centauri Carbon and starts the print
* `src/printer.py`   finds the printer on the network
* `src/setupmgr.py`  downloads OrcaSlicer, `uv`, PyTorch and the AI code on first use
* `ci-draft/`        the GitHub Actions build (Windows .exe + installer). NOT active until it is copied to `.github/workflows/`

Shop mode (`3DPrintica.exe --shop`) lets another computer on your network send a model to be sliced and printed; it needs the PIN shown in the window.
Licences: OrcaSlicer is AGPL-3.0 (downloaded separately, unmodified). Hunyuan3D 2 is non-commercial. TripoSR is MIT.
