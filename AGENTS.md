# Juspay ReactJS Challenge — Project Memory & Architecture Guide

## 1. Project Overview & Deadlines
- **Task:** Build a visual coding playground web application modeled after MIT Scratch.
- **Deadline:** 3-day delivery timeline (weekend delivery by Monday).
- **Deliverables:**
  1. GitHub Repository Link (clean commits, comprehensive README).
  2. Live Deployed Link (Vercel deployment pointing to `public/` directory).
  3. Screen Recording (1–2 min walkthrough demonstrating block DnD, parameter editing, Cat & Horse sprites, Play execution, and collision swap).
- **Evaluation Criteria:** Functional Programming (FP) patterns, code cleanliness, visual aesthetics, state immutability, and 100% adherence to specified feature requirements.

---

## 2. Technical Stack & Architectural Decisions
- **Stack:** React 17.0.2, Tailwind CSS 2.0.1, Webpack 5.112.0, Native HTML5 Drag-and-Drop.
- **Language:** JavaScript (ES6+). Zero TypeScript or ReScript conversion — starter is JS, converting introduces build overhead without adding eval points.
- **Zero New Dependencies:** Everything ships with what's already in `package.json`. No `react-beautiful-dnd`, `framer-motion`, `uuid`, or Redux.
- **FP Purity Boundary:**
  > *All side effects are strictly quarantined in `engine/runner.js`; everything else in the codebase is pure functions, deterministic reducers, and declarative JSX.*
- **Tailwind 2.0.1 Rules (No JIT):**
  - Tailwind 2.0.1 lacks JIT. Arbitrary bracket syntax (e.g., `w-[480px]`, `min-w-[500px]`, `bg-[...]`) is **silently ignored** by PostCSS.
  - Stage dimensions and fixed sizes must use inline styles: `style={{ width: 480, height: 360 }}`.
  - Never use dynamic template-literal class names (`bg-${color}-500`); PurgeCSS strips them in production.
- **Why No `framer-motion` for "Motion":**
  - "Motion" in Scratch is a block category (`Move steps`, `Turn degrees`, `Go to x, y`), not an animation library.
  - Sprites maintain explicit `x, y, angle` coordinates in state for accurate trigonometric updates and deterministic $AABB$ collision math.
  - Visual smoothing is achieved via CSS transforms:
    - Outer wrapper handles position: `transform: translate3d(${cssX}px, ${cssY}px, 0); transition: transform 0.15s ease-out;`
    - Inner avatar container handles rotation: `transform: rotate(${angle}deg); transition: transform 0.15s ease-out;`
    - Speech/thought bubbles sit on the unrotated outer wrapper so text stays upright regardless of sprite orientation.
- **Deployment Output:** Webpack outputs to `public/` (not `dist/` or `build/`). Vercel `outputDirectory` must be configured as `public`.

---

## 3. Data Shapes & Type Contracts

### A. Block Item
```javascript
/**
 * Block types enum:
 * 'MOVE' | 'TURN_CW' | 'TURN_CCW' | 'GOTO' | 'REPEAT' | 'SAY' | 'THINK'
 * Note: Spec lists 6 functional requirements. TURN is split into CW and CCW
 * directional variants (7 palette chips total).
 */
const BlockItemShape = {
  id: 'blk-1',              // Deterministically minted by reducer
  type: 'MOVE',             // BlockType
  params: {
    steps: 10,              // MOVE: default 10 (always Number)
    degrees: 15,            // TURN_CW / TURN_CCW: default 15 (always Number)
    x: 0,                   // GOTO: default 0 (always Number)
    y: 0,                   // GOTO: default 0 (always Number)
    repeatCount: 10,        // REPEAT: default 10 (always Number)
    text: 'Hello!',         // SAY / THINK: default text (string)
    duration: 2,            // SAY / THINK: default 2 (always Number, seconds)
  },
  children: [],             // BlockItem[] (only used when type === 'REPEAT', capped at 1 level)
};
```

### B. Sprite Shape
```javascript
const SpriteShape = {
  id: 'sprite-1',           // Unique sprite key ('sprite-1', 'sprite-2')
  name: 'Cat',              // Display label ('Cat', 'Horse')
  avatar: 'cat',            // 'cat' | 'horse'
  x: -80,                   // Scratch coordinates (-240 to +240, 0 is center)
  y: 0,                     // Scratch coordinates (-180 to +180, 0 is center)
  angle: 0,                 // Degrees (0 = facing right, clockwise positive)
  speech: null,             // null | { text: string, type: 'say' | 'think' }
  script: [],               // BlockItem[]
  initialX: -80,            // Snapshot for Reset
  initialY: 0,
  initialAngle: 0,
  scriptVersion: 0,         // Incremented on SWAP to restart active runner
};
```

### C. Global State
```javascript
const InitialState = {
  sprites: {
    'sprite-1': {
      id: 'sprite-1',
      name: 'Cat',
      avatar: 'cat',
      x: -80, y: 0, angle: 0,
      speech: null,
      script: [],
      initialX: -80, initialY: 0, initialAngle: 0,
      scriptVersion: 0,
    },
    'sprite-2': {
      id: 'sprite-2',
      name: 'Horse',
      avatar: 'horse',
      x: 80, y: 0, angle: 0,
      speech: null,
      script: [],
      initialX: 80, initialY: 0, initialAngle: 0,
      scriptVersion: 0,
    },
  },
  activeSpriteId: 'sprite-1',
  isRunning: false,
  nextSpriteNum: 3,         // Counter for sprite IDs
  nextBlockNum: 1,          // FP state-owned counter for deterministic block ID minting
};
```

---

## 4. Action Payload Shapes & Reducer Contracts

All state transitions are pure and deterministic. No module-level mutable variables.

| Action Type | Payload Properties | State Transformation & Guards |
|---|---|---|
| `SELECT_SPRITE` | `{ spriteId: string }` | Sets `activeSpriteId`. No-op if `spriteId` does not exist. |
| `ADD_BLOCK` | `{ spriteId: string, blockType: string, customParams?: object, index?: number }` | Mints ID `blk-${state.nextBlockNum}`, increments `state.nextBlockNum`. Inserts block at `index` or appends to `script`. |
| `REMOVE_BLOCK` | `{ spriteId: string, blockId: string }` | Filters `blockId` from top-level script and any `REPEAT` children. |
| `CLEAR_SCRIPT` | `{ spriteId: string }` | Sets `script: []` for target sprite. |
| `UPDATE_BLOCK_PARAMS` | `{ spriteId: string, blockId: string, params: object }` | Merges sanitized params (`Number(v) \|\| 0` for numeric keys) into target block (or repeat child). |
| `REORDER_BLOCKS` | `{ spriteId: string, fromIndex: number, toIndex: number }` | Moves block from `fromIndex` to `toIndex`. Guarded against out-of-bounds. |
| `ADD_CHILD_BLOCK` | `{ spriteId: string, parentBlockId: string, blockType: string, customParams?: object, index?: number }` | Mints ID `blk-${state.nextBlockNum}`, increments `state.nextBlockNum`. Enforces **1-level cap**: ignores `blockType === 'REPEAT'`. |
| `ADD_SPRITE` | none | Mints `sprite-${state.nextSpriteNum}`, alternates avatar (`cat` / `horse`), spawns off-lane at $(0, -100)$ or $(0, 100)$, increments `nextSpriteNum`. |
| `DELETE_SPRITE` | `{ spriteId: string }` | Guarded: length > 1 and `!isRunning`. Reassigns `activeSpriteId` if active sprite was deleted. |
| `UPDATE_SPRITE` | `{ spriteId: string, changes: object }` | Shallow merges position, angle, or speech into target sprite. |
| `SWAP_SCRIPTS` | `{ spriteA: string, spriteB: string }` | Atomically swaps `script` between `spriteA` and `spriteB`. Increments `scriptVersion` on both. |
| `SET_RUNNING` | `{ isRunning: boolean }` | Sets `isRunning` boolean flag. |
| `RESET_SPRITES` | none | Restores all sprites to initial coordinates, angles, clears speech, and sets `isRunning: false`. |

---

## 5. Module Contracts

### A. Context Hook Contract
```javascript
function useScratch(): {
  state: GlobalState,
  dispatch: (action: Action) => void,
}
```

### B. Execution Engine Contract
`engine/runner.js` owns its own constants and imports **nothing** from the React app (eliminating circular module dependencies):
```javascript
function createExecutionEngine(
  dispatch: (action: Action) => void,
  cancelRef: { current: boolean },
  stateRef: { current: GlobalState }
): {
  start: () => void,
  stop: () => void,
}
```

---

## 6. Coordinate System & Mathematical Invariants

1. **Stage Dimensions:**
   - Width: `STAGE_W = 480px`, Height: `STAGE_H = 360px` (standard 4:3 MIT Scratch ratio).
   - Origin `(0, 0)` is at the exact center of the stage.
   - $x$-range: `[-240, 240]`. $y$-range: `[-180, 180]`.
2. **Sprite Dimensions:**
   - Bounding box: `SPRITE_W = 60px`, `SPRITE_H = 60px`.
3. **Screen / CSS Coordinate Conversion:**
   ```javascript
   const toScreenX = (x) => Math.round(STAGE_W / 2 + x - SPRITE_W / 2);
   const toScreenY = (y) => Math.round(STAGE_H / 2 - y - SPRITE_H / 2); // Scratch +y is UP
   ```
4. **Trigonometric Movement (`Move steps`):**
   - Angle convention: $0^\circ$ points right ($+x$). Clockwise rotation increases $\theta$.
   - $\Delta x = \text{steps} \times \cos(\theta \times \frac{\pi}{180})$
   - $\Delta y = - \text{steps} \times \sin(\theta \times \frac{\pi}{180})$ (negative because $+y$ in Scratch is upwards)
5. **Clamping Invariant:**
   - $x = \max(-210, \min(210, x))$ (prevents drifting beyond stage edges).
   - $y = \max(-150, \min(150, y))$.

---

## 7. Execution & Runtime Semantics

### A. Async Execution, State Ref Mirror & Pre-Registration
- **State Ref Mirror:** `stateRef.current = state` is synchronized via `useLayoutEffect`. In React 17, `useLayoutEffect` commits synchronously before paint and async ticks, completely eliminating stale closure windows.
- **Pre-Registration (Play Race Guard):** When Play starts:
  1. `cancelRef.current = false`
  2. `isEngineRunning = true`
  3. Pre-register all sprite IDs into `activeRunners` **before** kicking off any async loops.
  4. Launch `runSprite(id)` for each sprite.
  This prevents sprites with empty scripts from completing synchronously and prematurely triggering `SET_RUNNING(false)` before other sprites have even started.
- **Completion Check:** A sprite runner deletes its ID from `activeRunners` in `finally`. `maybeFinish()` checks `if (isEngineRunning && activeRunners.size === 0)`. When true, it sets `isEngineRunning = false` and dispatches `SET_RUNNING(false)`.

### B. Wake-on-Stop Timer Tracking (No Zombie Runners)
- The sleeper tracks active `{ timeoutId, resolve }` pairs in an engine-scoped Set.
- When `stop()` / Reset is called:
  1. Sets `cancelRef.current = true`.
  2. Iterates all pending sleepers: calls `clearTimeout(timeoutId)` **AND immediately invokes `resolve()`**.
  3. All sleeping runners wake up immediately, detect `cancelRef.current === true`, throw `ABORT_CANCEL`, and run their `finally` cleanup blocks.
  Zero hanging promises, zero zombie closures.

### C. Input Sanitization (Number Coercion)
- HTML number inputs produce strings (`"10"`). In JavaScript, `s.x + "10"` produces string concatenation (`"-8010"`).
- All numeric fields (`steps`, `degrees`, `x`, `y`, `duration`, `repeatCount`) are strictly coerced using `Number(val) || 0` both in `UPDATE_BLOCK_PARAMS` and at the start of block execution.

### D. Synchronous Post-Movement Collision Check (No Detached rAF)
- Collisions are an immediate physical consequence of sprite movement.
- Eliminates the detached `requestAnimationFrame` loop entirely:
  - Eliminates browser tab-hidden pauses.
  - Eliminates extra timer lifecycle management and timer leak risks.
  - Makes the entire execution and collision engine testable in headless Node.
- Immediately after any `MOVE` or `GOTO` action dispatches new coordinates for a sprite:
  1. The runner calls `checkCollisions()`.
  2. Bounding box check: `isColliding = Math.abs(s1.x - s2.x) < 55 && Math.abs(s1.y - s2.y) < 55`.
  3. Edge-trigger evaluation:
     - At Play start, `wasColliding` is initialized to the **current initial overlap state** (preventing false swap at $t=0$).
     - Swap triggers only on `isColliding && !wasColliding && Date.now() - lastSwapTimestamp > 700`.
     - When sprites separate (`!isColliding`), `wasColliding` resets to `false`.
  4. On collision trigger:
     - Sets `wasColliding = true`, updates `lastSwapTimestamp = Date.now()`.
     - Dispatches `SWAP_SCRIPTS({ spriteA: 'sprite-1', spriteB: 'sprite-2' })`.
     - Swapped sprites increment `scriptVersion` and restart execution from block 0.
     - Swapped sprites that had already finished are revived by invoking `runSprite(id)`.

### E. Blocking Looks Actions & Guaranteed Cleanup
- Setting a speech bubble is a blocking action for that specific sprite:
  1. Dispatch `UPDATE_SPRITE(id, { speech: { text, type } })`
  2. `try { await cancellableSleep(duration * 1000); }`
  3. `finally { dispatch(UPDATE_SPRITE(id, { speech: null })); }`
- Using `finally` guarantees speech bubbles are cleaned up immediately even if aborted by Stop or Swap.

---

## 8. Hard Invariants

1. **No new npm packages.** Everything must run on React 17 + Tailwind v2 already installed.
2. **Pure FP state updates.** Zero direct object mutation; every reducer branch returns a new shallow copy. ID minting belongs in reducer state (`nextBlockNum`).
3. **No detached timer subsystems.** Collisions checked synchronously post-movement. All sleepers cancellable and woken on stop.
4. **Collision edge-trigger + debounce.** Edge trigger on `false → true` plus 700ms cooldown backstop.
5. **Speech bubble uprightness.** Speech bubble sits on unrotated outer wrapper.
6. **Tailwind 2.0.1 compliance.** Inline styles for stage and sprite dimensions. No JIT bracket syntax.
