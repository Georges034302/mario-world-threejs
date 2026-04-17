# Mario World Three.js

Mario World Three.js is a browser-based 2.5D demo/game scene built with Three.js. It renders a scrolling Mario-style background, overlays animated Mario sprites, and drives a reactive ghost opponent with keyboard-controlled behavior modes.

## What Is The Project?

This project is a lightweight interactive web experience that combines:

- A Three.js scene and camera setup
- Sprite and video-texture based characters
- Keyboard-driven mode switching (normal, super, superfly)
- Continuous animation loop with motion smoothing and collision rules

Open [index.html](index.html) in a browser to run the project.

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

| Input | Mode | Mario Behavior | World/Ghost Behavior |
|---|---|---|---|
| No key | `normal` | Mario uses `mario.gif` and stays on ground level. | Background scroll returns to idle speed, ghost returns to base position. |
| Arrow Left | `normal` + slow run | Mario remains normal mode. | Background scroll slows down. |
| Arrow Right | `normal` + fast run | Mario remains normal mode. | Background scroll speeds up. |
| Arrow Up | `super` | Mario switches to `super.gif` and remains near ground level. | Ghost enters attack behavior and moves toward Mario. |
| Arrow Up + Arrow Right | `superfly` | Mario switches to `super.gif` and flies upward smoothly. | Background scroll is fastest; ghost switches to superfly pursuit behavior. |

### Notes

- Mode transitions are smoothed each frame (no instant jumps in movement).
- Ghost playback speed and movement intensity increase during attack/superfly states.
- In `super` mode, collision rules prevent the ghost from overlapping Mario too closely.

---

<small><em>👤 Author: Georgess Bou Ghantouss</em></small>