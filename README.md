# Mario World Three.js

Mario World Three.js is a browser-based 2.5D action scene built with Three.js. It combines Mario movement modes, ghost pursuit behavior, a procedural night forest, and aerial/ground hazard systems with score/health/time/level tracking and a win celebration system.

Current documented version: **v5.0**

Live demo: [https://georges034302.github.io/mario-world-threejs/](https://georges034302.github.io/mario-world-threejs/)

## v5.0 Highlights

- Procedural **night forest** background (moon, stars, clouds, trees, bushes, grass) with layered parallax motion.
- **Ready/Pause freeze** behavior for Mario and ghost media playback.
- Random **bat hazard system**:
	- Spawns every 3.5 seconds
	- Spawns **2 bats per cycle** (Levels 1-3)
	- Spawns **3 bats per cycle** in Level 4
	- Always spawns from the right side and moves right-to-left
	- Bat collision uses body-to-body radius overlap
	- Level 3 introduces wider oscillation frequency variety
	- Level 4 diagonal bats receive additional speed boost (`+0.25`)
- Random **spider hazard system**:
	- Continuous single-spider spawns with random decimal interval (`1-8` seconds)
	- Right-to-left ground traversal with independent leg animation per leg
	- Random jump behavior integrated into movement/collision path
	- Jump height by level:
		- Levels 1-2: `0.5`
		- Levels 3-4: `1.0`
	- Jump spacing by level:
		- Level 1: `3.0-5.8` seconds
		- Level 2: `2.3-5.0` seconds
		- Level 3: `1.8-4.2` seconds
		- Level 4: `1.0-6.0` seconds
- Shared hazard health system:
	- Spider or bat collision removes one heart
	- 3 total hazard hits = game over
- HUD metrics at bottom-left:
	- Score
	- Health (hearts)
	- Speed
	- Time (`mm:ss.mmm`)
- Level progression shown beside the main title:
	- Level 1: score `0-24`
	- Level 2: score `25-49`
	- Level 3: score `50-74`
	- Level 4: score `75-99`
	- Score `100`: triggers **WIN** state
- Score rule update:
	- Bat pass adds score **only** when Mario mode is `super` or `superfly`
	- Normal running mode does not score from bat passes
	- Bat speed increases at Levels 2 and 3 (`+0.25`) and again at Level 4 (`+0.50` vs base)
- Level 3 and 4 bat trajectories:
	- `50%` horizontal right-to-left
	- `25%` bottom-right to top-left diagonal
	- `2%` top-right to bottom-left diagonal
	- Remaining probability currently falls back to horizontal right-to-left
	- In **Level 4**, each spawn wave always includes exactly 3 bats:
		- 1 top-right to bottom-left diagonal
		- 1 horizontal right-to-left
		- 1 bottom-right to top-left diagonal
- WIN presentation and effects:
	- WIN badge appears top-center with larger text and trophy on the right
	- Procedural, multi-color Three.js fireworks play around WIN for 5 seconds
	- Fireworks use denser particle bursts with sparser burst cadence

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
		├── setup.js
		└── spiders.js
```

## Source Files

| File | Responsibility |
|---|---|
| src/setup.js | Initializes scene/camera/renderer, shared globals, character base positioning, and responsive resize behavior. |
| src/build.js | Creates scene entities (forest theme init, bats init, spiders init, ghost sprite/video, Mario overlay). |
| src/spiders.js | Spawns/updates ground spiders, level-based jump behavior, spider animation, spider collision, and spider reset state. |
| src/forest_theme.js | Builds and updates the procedural night forest layers and parallax movement. |
| src/bats.js | Spawns/updates bats, applies level-based speed and trajectory patterns, handles body-radius bat collision/score/win trigger, and resets bat state. |
| src/animate.js | Main animation loop, game state machine, controls, shared hazard health handling, HUD + level display, game over/win flow, and Three.js fireworks lifecycle. |
| src/run.js | Startup sequence and initial ready-state animation freeze handling. |

## Controls

| Input | Effect |
|---|---|
| Space | Start, pause, or resume gameplay |
| Tab | Restart after game over or win |
| Arrow Left | Slow run |
| Arrow Right | Fast run |
| Arrow Up | Super mode (lift/air control) |
| Arrow Up + Arrow Right | Superfly mode |

## Gameplay Rules (v5.0)

1. Initial state is `ready` with animations frozen until Space starts the run.
2. Ghost collision with Mario triggers game over.
3. Bat and spider collisions each reduce health by one heart; health reaches zero after 3 total hazard hits and triggers game over.
4. Bat passes only increase score when Mario is in `super` or `superfly` mode.
5. Score thresholds change level and hazard behavior automatically.
6. At higher levels, bats gain stronger directional patterns and spiders gain higher/more dynamic jumps.
7. Score `100` triggers `win`; fireworks run for 5 seconds.
8. Tab starts a new run from `gameover` or `win` state.

## HUD Metrics

- **Score**: Number of bats that pass Mario while Mario is in score-eligible mode.
- **Health**: Three-heart system (`♥♥♥` to `♡♡♡`).
- **Speed**: Current background speed value.
- **Time**: Elapsed run time in `mm:ss.mmm`.

---

<sub><i><span style="color:#B0B0B0">👤 Author: Dr. Georges Bou Ghantous</span></i></sub>
