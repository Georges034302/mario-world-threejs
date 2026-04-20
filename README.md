# Mario World Three.js

Mario World Three.js is a browser-based 2.5D action scene built with Three.js. It combines Mario movement modes, ghost pursuit behavior, a procedural night forest, and bat hazards with score/health/time HUD tracking.

Current documented version: **v3.0**

Live demo: [https://georges034302.github.io/mario-world-threejs/](https://georges034302.github.io/mario-world-threejs/)

## v3.0 Highlights

- Procedural **night forest** background (moon, stars, clouds, trees, bushes, grass) with layered parallax motion.
- **Ready/Pause freeze** behavior for Mario and ghost media playback.
- Random **bat hazard system**:
	- Spawns every 3.5 seconds
	- Spawns **2 bats per cycle**
	- Right-to-left flight with oscillating trajectory
	- 3 bat hits = game over
- HUD metrics at bottom-left:
	- Score
	- Health (hearts)
	- Speed
	- Time (`mm:ss.mmm`)
- Score rule update:
	- Bat pass adds score **only** when Mario mode is `super` or `superfly`
	- Normal running mode does not score from bat passes

## Project Structure

```text
mario-world-threejs/
├── index.html
├── README.md
├── css/
│   └── layout.css
├── js/
│   └── three.min.js
├── media/
│   ├── ghost.gif
│   ├── ghost.mp4
│   ├── mario.gif
│   └── super.gif
└── src/
		├── animate.js
		├── bats.js
		├── build.js
		├── forest_theme.js
		├── run.js
		└── setup.js
```

## Source Files

| File | Responsibility |
|---|---|
| src/setup.js | Initializes scene/camera/renderer, shared globals, character base positioning, and responsive resize behavior. |
| src/build.js | Creates scene entities (forest theme init, bats init, ghost sprite/video, Mario overlay). |
| src/forest_theme.js | Builds and updates the procedural night forest layers and parallax movement. |
| src/bats.js | Spawns/updates bats, handles bat collision and score rules, and resets bat state. |
| src/animate.js | Main animation loop, game state machine, controls, Mario/ghost movement rules, HUD updates, and game over flow. |
| src/run.js | Startup sequence and initial ready-state animation freeze handling. |

## Controls

| Input | Effect |
|---|---|
| Space | Start, pause, or resume gameplay |
| Tab | Restart only after game over |
| Arrow Left | Slow run |
| Arrow Right | Fast run |
| Arrow Up | Super mode (lift/air control) |
| Arrow Up + Arrow Right | Superfly mode |

## Gameplay Rules (v3.0)

1. Initial state is `ready` with animations frozen until Space starts the run.
2. Ghost collision with Mario triggers game over.
3. Bat collision reduces health by one heart; health reaches zero after 3 hits and triggers game over.
4. Bat passes only increase score when Mario is in `super` or `superfly` mode.
5. Tab starts a new run only from `gameover` state.

## HUD Metrics

- **Score**: Number of bats that pass Mario while Mario is in score-eligible mode.
- **Health**: Three-heart system (`♥♥♥` to `♡♡♡`).
- **Speed**: Current background speed value.
- **Time**: Elapsed run time in `mm:ss.mmm`.

---

<small><em>Author: Georgess Bou Ghantouss</em></small>