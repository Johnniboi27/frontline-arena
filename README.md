# Frontline Arena

Frontline Arena is a browser-playable 3D FPS prototype. The game runs from the `outputs/` folder and includes pointer-lock mouse aim, WASD movement, weapon classes, grenades, smoke, flashbangs, knife attacks, med kits, vehicles, tanks, helicopters, jets, recoil, reload motion, shell effects, AI squads, and a compact battlefield map.

## Play Locally

```bash
python3 -m http.server 4173 --bind 127.0.0.1 --directory outputs
```

Open `http://127.0.0.1:4173/`.

## Publish Online With GitHub Pages

The root `index.html` is a bundled single-file build for GitHub Pages. The editable source version remains in `outputs/`.

1. Push this project to a GitHub repository's `main` branch.
2. In GitHub, open `Settings -> Pages`.
3. Set `Build and deployment` to `Deploy from a branch`.
4. Select `main` and `/root`, then save.

The published site will serve the root `index.html`.
