# Scratch Visual Coding Playground — Juspay ReactJS Challenge

A high-fidelity visual coding environment modeled after **MIT Scratch 3.0**, built with **React 17**, **Tailwind CSS**, and strict **Functional Programming (FP)** principles.

---

## 1. Live Demo & Running Locally

- **Live Demo:** [https://scratch-starter-project-yash.vercel.app](https://scratch-starter-project-yash.vercel.app) *(or deploy via Vercel pointing to the `public/` directory)*
- **GitHub Repository:** [https://github.com/Yash-Gupta-01/scratch-starter-project](https://github.com/Yash-Gupta-01/scratch-starter-project)

### Run Locally:
```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Start local development server
npm start
# Open http://localhost:3000 in your browser

# 3. Production build (compiles into public/)
npm run build
```

---

## 2. What's Implemented

The PDF lists 6 functional requirements; we ship **7 palette chips** across Motion, Control, and Looks categories. Note that **Turn ↻** and **Turn ↺** are the two directional halves satisfying the specification's `"turn ___ degrees"`.

| Category | Chip | Params | Spec Line Satisfied |
|---|---|---|---|
| **Motion** | Move `[steps]` steps | `steps` (default 10) | "Move ___ steps" |
| **Motion** | Turn ↻ `[degrees]` degrees | `degrees` (default 15) | "turn ___ degrees" (CW half) |
| **Motion** | Turn ↺ `[degrees]` degrees | `degrees` (default 15) | "turn ___ degrees" (CCW half) |
| **Motion** | Go to x: `[x]` y: `[y]` | `x`, `y` (default 0, 0) | "Go to x: y:" |
| **Control** | Repeat `[repeatCount]` times `{ children }` | `repeatCount` (default 10) | "Repeat animation (inside controls)" |
| **Looks** | Say `[text]` for `[duration]` seconds | `text`, `duration` (default 'Hello!', 2) | "Say ___ for ___ seconds" |
| **Looks** | Think `[text]` for `[duration]` seconds | `text`, `duration` (default 'Hmm...', 2) | "think ___ for ___ seconds" |

### Core Workspace Capabilities:
- **Native HTML5 Drag-and-Drop:** Drag blocks from the palette into the workspace (`MidArea`), reorder blocks via drag-and-drop, drag blocks onto the sidebar to delete, or delete via trash button.
- **Repeat Slot Drop Target:** Drop any non-Repeat block into a Repeat block's nested slot.
- **Repeat Nesting Cap:** Repeat nesting is strictly capped at one level. A Repeat cannot contain a Repeat (enforced in the reducer).
- **Edit Lock:** While scripts are running (`isRunning === true`), all workspace inputs, dragging, reordering, deleting, and sprite additions are safely disabled to preserve execution state integrity.
- **Cat & Horse Sprites:** Ships with the official MIT Scratch Cat SVG (`CatSprite.js`) and a hand-crafted, Scratch-styled Horse SVG (`HorseSprite.js`).
- **Sprite Manager Dock (`SpriteSelector`):** Add sprites with `+` (spawning off-collision lane), select sprite to switch active workspace script, view live integer coordinates, and delete sprites (guarded when 1 remains or running).
- **Play & Stop Controls:** Green flag button initiates concurrent execution for all sprites; Red stop button instantly resets sprites to initial positions and clears speech bubbles.

---

## 3. Architecture

> **FP Purity Boundary:**  
> All side effects are quarantined in `src/engine/runner.js`. Everything else is pure functions, a deterministic reducer, and declarative JSX.

### Single Source of Truth (`ScratchContext.js`)
All application state lives in a single central store powered by React `useReducer` and Context:
- **Zero Mutation:** Reducer branches are 100% pure; every action returns a new state object. There are zero `let` statements and zero module-level mutable variables.
- **Deterministic Minting & Clamping:** Block IDs (`blk-n`) and Sprite IDs (`sprite-n`) are minted purely from monotonically incrementing state counters (`nextBlockNum`, `nextSpriteNum`). Stage boundary clamping ($[-210, 210]$ on $x$, $[-150, 150]$ on $y$) lives exclusively in the reducer's `UPDATE_SPRITE` branch.
- **Number Sanitization:** Numeric inputs are sanitized in `UPDATE_BLOCK_PARAMS` using `Number(v) || 0` and coerced again at block execution.

### Quarantined Effect Engine (`runner.js`)
Execution logic is strictly separated from the UI:
- All timers, timeouts, mutable Sets (`activeRunners`, `sleepers`), and Maps (`wasColliding`, `lastSwapAt`) reside exclusively in `runner.js`.
- `runner.js` imports nothing from the application; it interacts purely through injected `dispatch` actions and an immutable `stateRef`.
- React 17 synchronously re-renders async dispatches; `useLayoutEffect` mirrors `stateRef.current = state` before the next tick to ensure runners never read stale state closures.

---

## 4. Hero Feature: Collision-Based Script Swap Semantics

A core requirement is the real-time collision detection and animation script swap between characters:

```
┌────────────────────────────────────────────────────────┐
│ Cat (x: -80)   ───[Repeat 10: Move 10]───►             │
│                                                        │
│                    ⚡ COLLISION AT TICK 6               │
│                   (|dx| < 55px at x ≈ ±20px)           │
│                                                        │
│ Cat inherits:   ◄───[Move -10 steps]                   │
│ Horse inherits:                 ───[Move 10 steps]───► │
│               ◄───[Repeat 10: Move -10]── Horse (x: +80)
└────────────────────────────────────────────────────────┘
```

### Deterministic Collision Rules:
1. **Synchronous Checking (No `requestAnimationFrame`):** Collisions are checked synchronously immediately after every `MOVE` and `GOTO` dispatch. This eliminates frame-drop race conditions, tab-inactivity pauses, and makes execution testable in headless Node environments.
2. **Edge-Triggered:** Collision detection is edge-triggered per pair (`wasColliding` map) — the swap fires strictly on the `false → true` entry transition, preventing thrashing.
3. **700ms Cooldown Backstop:** A pair-level cooldown timestamp ensures sprites passing through each other do not re-trigger swaps until completely separated.
4. **State-Level Script Exchange:** Swapping dispatches `SWAP_SCRIPTS`, exchanging the `script` arrays in central state. The swap is immediately visible in the `MidArea` workspace!
5. **Restart from Block 0 & Revival:** Each swap increments `scriptVersion`. Live runners catch the version mismatch (`ABORT_RESTART`) and restart the inherited script from block 0. Finished sprites whose runners have already resolved are automatically revived.

---

## 5. Why JavaScript

- **Preserving Ecosystem Alignment:** The provided starter project was configured with JavaScript (ES6+), React 17.0.2, Babel, and Webpack 5. Converting to ReScript or TypeScript carries high build and toolchain configuration risks without adding feature or evaluation value.
- **Functional Discipline Without Extra Syntax:** Strict functional programming is fully achievable in native JavaScript using pure functions, immutable reducer patterns, higher-order functions, and structural isolation.
- **Type Safety via JSDoc:** Complete JSDoc `@typedef` annotations document all block parameters, sprite structures, and state shapes directly in `ScratchContext.js`.

---

## 6. Known Limits

- **Repeat Nesting Capped at One Level:** A Repeat block cannot be dragged into another Repeat block (enforced in `ADD_CHILD_BLOCK`).
- **Blocking Say/Think per Sprite:** A Say or Think block pauses that individual sprite's execution pipeline for the duration of the bubble before proceeding to the next block (other sprites continue concurrently).
- **Coordinate Clamping:** Sprites reaching the boundary of the 480×360 stage ($x = \pm 210, y = \pm 150$) clamp to the edge and do not wander off-screen.

---

## 🎬 1–2 Minute Walkthrough Video Script

1. **(0–15s) Introduction & Drag-and-Drop:**
   - Show 3-column layout: Palette (Sidebar), Workspace (MidArea), Stage & Dock (PreviewArea).
   - Drag `Move 10 steps` and `Turn ↻ 15 degrees` into Cat's workspace.
   - Edit a parameter (e.g., change Move to 25).
2. **(15–30s) Workspace & Sprites:**
   - Switch to Horse in the bottom dock; show Horse's empty script.
   - Drag `Repeat 10` and place `Move` inside its child slot. Change Move to `-10`.
3. **(30–45s) Cat Setup:**
   - Switch back to Cat; show Cat's script is preserved.
   - Replace Cat's script with `Repeat 10 [Move 10]`.
4. **(45–70s) Play & Hero Collision Swap:**
   - Press **Go (Play)**.
   - Narrate both sprites advancing toward each other.
   - At tick 6 ($x \approx \pm 20\text{px}$), they collide and swap scripts!
   - Cat reverses and walks left; Horse reverses and walks right.
   - Point out `MidArea`: Cat's workspace now holds `Move -10`!
5. **(70–90s) Reset & Sprite Management:**
   - Press **Stop**: sprites instantly snap back to initial positions.
   - Click `+` to add "Cat 3" and "Horse 4". Delete a sprite with `×`. Done!
