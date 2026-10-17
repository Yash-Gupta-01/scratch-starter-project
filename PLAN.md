# Implementation Plan — Scratch Visual Coding Playground

> Resequenced Sprint Plan. Hero Collision Slice pulled forward. Hardened against FP and runtime edge cases.

---

## 1. Scope & Block Prototype Clarification

The official PDF requires **6 functional capabilities** across 3 categories:
1. **Motion (4 functionalities):**
   - `Move [steps] steps`
   - `turn [degrees] degrees` — Provided as **Turn CW** and **Turn CCW** (standard Scratch UI, 2 palette chips fulfilling this single spec)
   - `Go to x: [x] y: [y]`
   - `Repeat [count] times` (Control category loop container, capped at 1 level depth)
2. **Looks (2 functionalities):**
   - `Say [text] for [duration] seconds` (blocking async speech bubble with `finally` cleanup)
   - `Think [text] for [duration] seconds` (blocking async thought cloud bubble with `finally` cleanup)

**Total palette blocks:** 7 chips representing the 6 functional requirements.

---

## 2. File Budget (10 files total in `src/`)

```
src/
├── index.js                    # existing — mount App
├── App.js                      # existing — wire ScratchProvider & layout (inline styles for non-JIT)
├── state/
│   └── ScratchContext.js       # Context + Reducer + Provider + hook (state-owned nextBlockNum)
├── engine/
│   └── runner.js               # Async script executor + wake-on-stop timers + sync post-move collision
├── components/
│   ├── Sidebar.js              # Block palette + drop-to-delete target
│   ├── MidArea.js              # Drop zone + script stack editor + edit lock
│   ├── PreviewArea.js          # Stage canvas (inline styles) + Play/Reset buttons
│   ├── CatSprite.js            # 1:1 official Scratch cat SVG
│   ├── HorseSprite.js          # Matching Scratch-styled Horse SVG component
│   ├── Icon.js                 # SVG Icon helper
│   ├── SpriteRenderer.js       # Positioned sprite, unrotated speech bubbles, CSS motion
│   ├── BlockItem.js            # Editable block chip with white pill inputs
│   └── SpriteSelector.js       # Sprite switcher cards (Cat & Horse) + coordinates + delete
```

---

## 3. Resequenced Sprint Roadmap

### Sprint 1: State Architecture (`ScratchContext.js`, `App.js`)
- [ ] Implement `src/state/ScratchContext.js` with 100% pure reducer (zero module-level mutable variables).
- [ ] State includes `nextBlockNum: 1` and `nextSpriteNum: 3`. Reducer deterministically mints IDs.
- [ ] Initialize two default sprites:
  - `sprite-1`: Cat at $x = -80, y = 0, \theta = 0^\circ$
  - `sprite-2`: Horse at $x = 80, y = 0, \theta = 0^\circ$
- [ ] Implement all 13 reducer actions with strict action payload shapes from `AGENTS.md`.
- [ ] Sanitize numeric params in `UPDATE_BLOCK_PARAMS` using `Number(v) || 0`.
- [ ] Wrap `App.js` with `<ScratchProvider>`, replacing arbitrary bracket syntax with Tailwind 2 compliant inline styles (`style={{ minWidth: 500 }}`).
- **Verification:** App compiles cleanly; reducer state is pure, deterministic, and accessible.

---

### Sprint 2: Workspace & Drag-and-Drop (`Sidebar.js`, `MidArea.js`, `BlockItem.js`)
- [ ] Implement 7 palette block chips in `Sidebar.js` with `draggable="true"`:
  - Motion: Move, Turn CW, Turn CCW, Go to x/y.
  - Looks: Say, Think.
  - Control: Repeat.
- [ ] Implement `MidArea.js` as an HTML5 drop zone to receive and reorder blocks.
- [ ] Create `BlockItem.js` with inline white-pill editable inputs (number/text) and individual trash button.
- [ ] MidArea edit lock: palette dragging, inline inputs, reordering, and deleting in `MidArea` are locked while `isRunning === true`.
- [ ] Add drag-to-palette deletion: dropping a block onto `Sidebar` removes it from the script stack.
- [ ] Implement Repeat container block (capped strictly at 1 level of child blocks; empty loop yields `await cancellableSleep(50)`).
- **Verification:** Can drag any block into MidArea, edit parameters without string bugs, reorder, and delete blocks.

---

### Sprint 3: Stage, Sprites & Hero Collision Vertical Slice (`runner.js`, `PreviewArea.js`, `SpriteRenderer.js`, `HorseSprite.js`)
*Note: This sprint pulls the Hero Feature forward so the core risk is validated immediately.*
- [ ] Build `src/components/HorseSprite.js` matching Cat sprite dimensions ($60\times 60\text{px}$).
- [ ] Create `SpriteRenderer.js` with center-to-screen coordinate conversion, inline dimensions `style={{ width: 60, height: 60 }}`, outer wrapper translate, inner container rotate, and unrotated speech/thought bubble overlays.
- [ ] Build `src/engine/runner.js` (imports **nothing** from the app):
  - `stateRef` synchronization (`stateRef.current = state`) via `useLayoutEffect`.
  - Wake-on-stop timer tracking: active `{ timeoutId, resolve }` pairs in an engine-scoped Set. Stop clears timeout AND calls `resolve()` so runners exit cleanly through `finally` without zombie promises.
  - Pre-register all sprite IDs in `activeRunners` on Play **before** starting async loops; guard completion with `isEngineRunning` to prevent empty-script race conditions.
  - Per-sprite async script runner with 150ms sleep ticks and cancellation token check.
  - Blocking `Say` / `Think` execution with `finally` speech bubble cleanup.
  - **Synchronous Post-Movement Collision Check:** Call `checkCollisions()` immediately after every `MOVE` / `GOTO` coordinate update (no rAF).
  - Initialize `wasColliding` to current overlap state at Play start (prevents false swap at $t=0$).
  - Atomic `SWAP_SCRIPTS` dispatch on edge trigger (false→true) with 700ms cooldown backstop: swaps scripts, increments `scriptVersion`, restarts active runners, and revives finished runners.
- [ ] Wire Play (Green Flag) and Reset (Red Stop) in `PreviewArea.js` with inline styles for stage (`style={{ width: 480, height: 360 }}`).
- **Guaranteed Collision Verification Test (Out-of-the-Box Zero-Edit):**
  - Setup: Cat starts at $x = -80$ with `Repeat 10 [Move 10 steps]`. Horse starts at $x = 80$ with `Repeat 10 [Move -10 steps]`.
  - Result: Closing at $20\text{px/tick}$, $|dx| < 55\text{px}$ first holds at **tick 6** with Cat at $x = -20$ and Horse at $x = +20$ ($dx = 40\text{px}$). The swap triggers on the false→true edge before reaching center. Cat immediately inherits `Move -10 steps` and marches left; Horse inherits `Move 10 steps` and marches right. Both diverge smoothly without thrashing.
  - Reset test: Red stop button wakes all sleepers, cancels all running loops, dismisses speech bubbles, and resets Cat to $-80$ and Horse to $+80$.

---

### Sprint 4: Multi-Sprite Management & UI Dock (`SpriteSelector.js`)
- [ ] Create `SpriteSelector.js` docked below the stage.
- [ ] Render interactive sprite cards for Cat and Horse showing thumbnail, name, $x/y$ coordinates, delete `×` button (disabled when 1 sprite remains or while `isRunning`), and active selection border.
- [ ] Add "+" sprite button to spawn new sprites alternating avatars off-lane at $(0, -100)$ and $(0, 100)$.
- [ ] Selecting a sprite switches `activeSpriteId`, immediately displaying that sprite's independent script in `MidArea`.
- **Verification:** Switching between Cat and Horse cleanly swaps the MidArea script view; running scripts execute concurrently for both sprites.

---

### Sprint 5: UI Polish, Bounds Clamping & Boundary Verification
- [ ] Enforce coordinate clamping ($x \in [-210, 210]$, $y \in [-150, 150]$) so sprites never wander off the stage.
- [ ] Style speech bubbles (comic speech triangle for Say, floating bubbles for Think), staying upright during rotation.
- [ ] Verify complete timer cancellation on Reset: no lingering timers or zombie promises.
- [ ] Verify natural run completion: `maybeFinish()` triggers `SET_RUNNING(false)` when `activeRunners` is empty.
- **Verification:** Edge collisions keep sprites inside canvas; spamming Play/Reset leaves zero ghost intervals.

---

### Sprint 6: Documentation, Deployment & Demo Recording Guide
- [ ] Update `README.md`:
  - Highlight FP purity boundary: *"All side effects are quarantined in `engine/runner.js`; everything else is pure functions and declarative JSX."*
  - Document the exact **Collision Swap Semantics** (edge-triggered on entry, central state script exchange visible in MidArea, restart from block 0, finished sprites revived).
  - Why JavaScript over ReScript (standard Webpack starter, FP architecture, zero-dependency reliability).
  - Clarify Turn CW/CCW mapping to the single "turn ___ degrees" spec requirement.
  - Mention Webpack output directory is `public/`.
- [ ] Configure `vercel.json` with `"outputDirectory": "public"`.
- [ ] Execute `npm run build` to confirm zero warnings/errors.
- [ ] Provide 1–2 minute screen recording walkthrough script.
