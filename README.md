# Mario World Three.js

Mario World Three.js is a browser-based 2.5D demo/game scene built with Three.js. It renders a scrolling Mario-style background, overlays animated Mario sprites, and drives a reactive ghost opponent with keyboard-controlled behavior modes.

Current documented version: **v2.0**

## What Is The Project?

This project is a lightweight interactive web experience that combines:

- A Three.js scene and camera setup
- Sprite and video-texture based characters
- Keyboard-driven mode switching (normal, super, superfly)
- Game state controls (start, pause, resume, restart)
- Continuous animation loop with motion smoothing and collision rules

Live demo: [https://georges034302.github.io/mario-world-threejs/](https://georges034302.github.io/mario-world-threejs/)

## Project Structure (Tree)

```text
mario-world-threejs/
├── index.html
├── README.md
├── css/
│   └── layout.css
├── js/
│   └── three.min.js
├── media/
│   ├── background.png
│   ├── ghost.gif
│   ├── ghost.mp4
│   ├── mario.gif
│   ├── mario.mp4
│   └── super.gif
└── src/
	├── animate.js
	├── build.js
	├── run.js
	└── setup.js
```

## src Folder Explained

| File | Responsibility |
|---|---|
| src/setup.js | Initializes scene, camera, renderer, shared globals, responsive resize logic, and base character positions. |
| src/build.js | Builds world objects and media sprites (background, Mario overlay, ghost sprite/video), including fallback behavior. |
| src/animate.js | Handles game loop timing, keyboard state, mode transitions, ghost AI movement, collision rules, and per-frame rendering updates. |
| src/run.js | Entry flow that calls setup/build/animate and registers resize events. |

## Controls And Behavior

| Input | State/Mode | Mario Behavior | World/Ghost Behavior |
|---|---|---|---|
| Space | `ready` -> `running` | Starts the game from the ready screen. | World animation and AI become active. |
| Space | `running` -> `paused` | Freezes Mario and input-driven movement. | Background/video motion pauses and status overlay shows "Paused". |
| Space | `paused` -> `running` | Resumes gameplay. | World and AI continue from paused state. |
| Tab (after Game Over) | `gameover` -> `running` | Resets Mario to baseline and starts a new run. | Ghost returns to base position and world scroll resets. |
| No arrow key | `normal` | Mario uses `mario.gif` and stays on ground level. | Background scroll returns to idle speed, ghost smoothly returns to base. |
| Arrow Left | `normal` + slow run | Mario remains normal mode. | Background scroll slows down. |
| Arrow Right | `normal` + fast run | Mario remains normal mode. | Background scroll speeds up. |
| Arrow Up | `super` (up-only flight) | Mario switches to `super.gif` and rises to mid-air fly height. | Ghost uses attack behavior and tracks Mario. |
| Arrow Up released while airborne | `super` while descending | Mario stays in `super.gif` and descends smoothly to ground. | Ghost keeps attack behavior until Mario lands; then normal behavior resumes. |
| Arrow Up + Arrow Right | `superfly` | Mario uses `super.gif` and flies with superfly handling. | Background scroll is fastest and ghost uses superfly pursuit behavior. |

### Notes

- Mode transitions are smoothed each frame (no instant jumps in movement).
- Ghost playback speed and movement intensity increase during attack/superfly states.
- Game over occurs when ghost and Mario collision distance falls below the configured threshold.
- On game over, a red "Game Over" popup is positioned above Mario/ghost and gameplay is halted until restart.

---

<small><em>👤 Author: Georgess Bou Ghantouss</em></small>