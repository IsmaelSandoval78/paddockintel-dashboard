# media/ — herramientas de video y data de PaddockIntel

Código de las herramientas que convierten el live timing de F1 en videos para redes.
**Solo código**: las grabaciones, sesiones decodificadas, videos y música viven fuera
del repo, en `$PI_DATA_DIR` (default `~/PaddockIntel-Data`). Los tokens de F1 TV se
quedan en la carpeta home (`~/.f1tv_token`, `~/.local/share/fastf1/f1auth.json`) —
nunca en el repo.

| Carpeta | Qué es | Doc |
|---|---|---|
| `recorder/` | Graba el live timing de cada sesión (FastF1 SignalR) y exporta CSVs | `recorder/README.md` |
| `pipeline/` | Grabación → CSVs → `session.json` / `cars.json` para el template 3D | `pipeline/README.md` |
| `3d/` | Template Three.js + Vite (carrera y clasificación en 3D) | `3d/LEEME.md` |
| `kinetic/` | Tipografía cinética: HTML + `render.py` → MP4 vertical con música | `kinetic/LEEME.md` |

Flujo completo de un fin de semana: `docs/MEDIA-PIPELINE.md` (en la raíz del repo).

```
~/PaddockIntel-Data/
  recordings/   grabaciones .txt del live timing
  sessions/     zips decodificados y session.json de archivo
  renders/      videos terminados
  music/        PaddockIntel Decoded.wav y ediciones
  cache/        caché de FastF1 (se regenera solo)
```
