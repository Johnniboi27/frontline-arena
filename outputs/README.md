# Frontline Arena

A browser FPS skirmish where the fictional Asterian Union squad fights the fictional Eisenmark Republic squad in a compact 3D arena. The game uses pointer-lock mouse aiming, WASD movement, AI teammates/enemies, seven detailed weapon classes, frag/smoke/flash throwables, RPGs, med kits, armored vehicles, tanks, helicopters, jets, reload motion, shell ejection, tracers, impact effects, health, armor, stance changes, score, and timed rounds.

## Run

From this folder:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173/
```

## Controls

- `W`, `A`, `S`, `D`: move
- Mouse: look around
- Left click: fire
- Left click in armed vehicle: fire missile
- Right click: zoom / aim down sights
- `G`: throw grenade
- `T`: throw smoke grenade
- `Q`: throw flashbang
- `F`: knife attack
- `H`: use med kit
- `R`: reload
- `1`-`7`: switch weapon class
- `E`: enter / exit a nearby ground or air vehicle
- `Space` in helicopter/jet: climb
- `Ctrl` in helicopter/jet: descend
- `Shift`: sprint
- `Ctrl`: crouch
- `Z`: toggle prone
- `Space`: jump
- `Esc`: release mouse
