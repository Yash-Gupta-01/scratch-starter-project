# AGENTS.md — Juspay ReactJS Challenge (Scratch Clone)

This file is the contract. `PLAN.md` is the sequence. When they disagree, this file wins.
Read this file in full at the start of every session before touching code.

---

## 0. How to work in this repo (operating protocol)

1. **One sprint per session.** Open `PLAN.md`, find the first sprint whose Done-criteria are not all checked, do only that sprint.
2. **Read before you write.** `Sidebar.js`, `MidArea.js`, `PreviewArea.js`, `App.js`, `CatSprite.js`, `Icon.js` already exist. Read each one before editing it. Keep its existing Tailwind classes and three-column layout. Change only what the sprint requires.
3. **Never invent a payload, export, or signature.** Every action payload is in §5. Every module export is in §6. If something you need is not there, stop and ask — do not improvise.
4. **Copy the pseudocode in §8 structurally.** Rename nothing. It encodes race fixes that are invisible until the demo.
5. **No new npm packages. No TypeScript. No ReScript.** `package.json` is read-only.
6. **Numbers from inputs are strings.** Coerce with `Number(v) || 0` in the reducer (`UPDATE_BLOCK_PARAMS`) and again at the top of block execution. Never arithmetic on a raw param.
7. **After every sprint:** `npm start`, open `http://localhost:3000`, confirm zero red errors in the browser console, run the sprint's Done-criteria, then `git commit -m "Sprint N: <subject>"`. A sprint is not done because the code "looks right"; it is done when every Done-criterion is observed.
8. **Do not add features.** No sound, pen, sensing, variables, costumes, undo/redo, localStorage. If it is not in §3 it does not exist.

---

## 1. Project & deliverables

- **Task:** Visual coding playground modeled after MIT Scratch, built on the provided starter.
- **Deliverables:** (1) GitHub repo with clean commits + README, (2) live Vercel URL, (3) 1–2 min screen recording.
- **Evaluated on:** functional-programming discipline, code cleanliness, visual polish, state immutability, 100% feature adherence.
- **FP purity boundary (quote this in the README):**
  > All side effects are quarantined in `src/engine/runner.js`. Everything else is pure functions, a deterministic reducer, and declarative JSX.

---

## 2. Stack & environment gotchas

| Fact | Consequence |
|---|---|
| React **17.0.2** | Dispatches after an `await` are **not batched** — each one re-renders synchronously. Harmless at 150 ms ticks, but never put 50 dispatches in a tight sync loop. Use `useLayoutEffect` (not `useEffect`) to mirror state into a ref. |
| Tailwind **2.0.1, no JIT** | Bracket syntax (`w-[480px]`, `min-w-[500px]`) is **silently ignored**. Fixed pixel sizes go in `style={{ width: 480 }}`. Never build class names with template literals (`bg-${c}-500`) — purge strips them in production. Use the complete literal strings in §10. |
| Webpack **5** outputs to **`public/`** | `vercel.json` → `{ "outputDirectory": "public" }`. Confirm `public/` build artifacts are in `.gitignore` before the first commit. |
| Native **HTML5 DnD** | `dataTransfer` carries strings only (JSON-encode). `dragover` MUST call `preventDefault()` or `drop` never fires. See §9. |
| Language | JavaScript ES6+. Types are documented with the JSDoc `@typedef` blocks in §4 — copy them to the top of `ScratchContext.js`. |

---

## 3. Scope (exactly this, nothing more)

The PDF lists **6 functional requirements**; we ship **7 palette chips**.

| Category | Chip | Params | Spec line it satisfies |
|---|---|---|---|
| Motion | Move `[steps]` steps | `steps` | "Move ___ steps" |
| Motion | Turn ↻ `[degrees]` degrees | `degrees` | "turn ___ degrees" (CW half) |
| Motion | Turn ↺ `[degrees]` degrees | `degrees` | "turn ___ degrees" (CCW half) |
| Motion | Go to x: `[x]` y: `[y]` | `x`, `y` | "Go to x: y:" |
| Control | Repeat `[repeatCount]` times `{ children }` | `repeatCount` | "Repeat animation (inside controls)" |
| Looks | Say `[text]` for `[duration]` seconds | `text`, `duration` | "Say ___ for ___ seconds" |
| Looks | Think `[text]` for `[duration]` seconds | `text`, `duration` | "think ___ for ___ seconds" |

Also required: drag-and-drop workspace, Play button, Cat **and** Horse sprites, add-sprite, independent script per sprite, concurrent execution, **collision-based script swap (mandatory hero feature)**.

**Repeat nesting is capped at one level.** A Repeat cannot contain a Repeat. The reducer enforces it (§5 `ADD_CHILD_BLOCK`).

---

## 4. Data shapes (copy these JSDoc blocks verbatim into `ScratchContext.js`)

```js
/**
 * @typedef {'MOVE'|'TURN_CW'|'TURN_CCW'|'GOTO'|'REPEAT'|'SAY'|'THINK'} BlockType
 *
 * @typedef {Object} BlockParams
 * @property {number} [steps]        MOVE        default 10
 * @property {number} [degrees]      TURN_*      default 15
 * @property {number} [x]            GOTO        default 0
 * @property {number} [y]            GOTO        default 0
 * @property {number} [repeatCount]  REPEAT      default 10
 * @property {string} [text]         SAY/THINK   default 'Hello!' / 'Hmm...'
 * @property {number} [duration]     SAY/THINK   default 2 (seconds)
 *
 * @typedef {Object} BlockItem
 * @property {string}      id        'blk-<n>', minted by the reducer from state.nextBlockNum
 * @property {BlockType}   type
 * @property {BlockParams} params    numeric fields are ALWAYS numbers (sanitized in reducer)
 * @property {BlockItem[]} children  only non-empty for REPEAT; never contains a REPEAT
 *
 * @typedef {Object} Sprite
 * @property {string}  id             'sprite-<n>'
 * @property {string}  name           'Cat' | 'Horse' | 'Cat 3' ...
 * @property {'cat'|'horse'} avatar
 * @property {number}  x              Scratch coords, center origin, +x right, range [-240, 240]
 * @property {number}  y              Scratch coords, +y UP, range [-180, 180]
 * @property {number}  angle          degrees, 0 = facing right, clockwise positive
 * @property {{text:string,type:'say'|'think'}|null} speech
 * @property {BlockItem[]} script
 * @property {number}  initialX
 * @property {number}  initialY
 * @property {number}  initialAngle
 * @property {number}  scriptVersion  incremented ONLY by SWAP_SCRIPTS
 *
 * @typedef {Object} State
 * @property {Object<string, Sprite>} sprites
 * @property {string}  activeSpriteId
 * @property {boolean} isRunning
 * @property {number}  nextSpriteNum   starts at 3
 * @property {number}  nextBlockNum    starts at 1
 */
```

```js
export const STAGE_W = 480, STAGE_H = 360, SPRITE_W = 60, SPRITE_H = 60;
export const X_MAX = STAGE_W / 2 - SPRITE_W / 2;   // 210
export const Y_MAX = STAGE_H / 2 - SPRITE_H / 2;   // 150

export const BLOCK_DEFAULTS = {
  MOVE:     { steps: 10 },
  TURN_CW:  { degrees: 15 },
  TURN_CCW: { degrees: 15 },
  GOTO:     { x: 0, y: 0 },
  REPEAT:   { repeatCount: 10 },
  SAY:      { text: 'Hello!', duration: 2 },
  THINK:    { text: 'Hmm...', duration: 2 },
};

const makeSprite = (id, name, avatar, x, y) => ({
  id, name, avatar, x, y, angle: 0, speech: null, script: [],
  initialX: x, initialY: y, initialAngle: 0, scriptVersion: 0,
});

export const initialState = {
  sprites: {
    'sprite-1': makeSprite('sprite-1', 'Cat',   'cat',   -80, 0),
    'sprite-2': makeSprite('sprite-2', 'Horse', 'horse',  80, 0),
  },
  activeSpriteId: 'sprite-1',
  isRunning: false,
  nextSpriteNum: 3,
  nextBlockNum: 1,
};
```

---

## 5. Actions — payloads and exact reducer behavior

Every action is a flat object: `{ type, ...payload }`. No `payload:` wrapper. The reducer is a pure function `(state, action) => state`; every branch returns a new object; **no module-level mutable variables anywhere in `ScratchContext.js`**.

| `type` | Payload fields | Reducer behavior |
|---|---|---|
| `SELECT_SPRITE` | `spriteId` | Set `activeSpriteId`. No-op if id unknown. |
| `ADD_BLOCK` | `spriteId`, `blockType`, `index?` | Mint `id = 'blk-' + state.nextBlockNum`; `nextBlockNum + 1`; block = `{ id, type, params: { ...BLOCK_DEFAULTS[type] }, children: [] }`; insert at `index` (or push). |
| `ADD_CHILD_BLOCK` | `spriteId`, `parentBlockId`, `blockType`, `index?` | Same minting. **No-op if `blockType === 'REPEAT'`** or parent is not a REPEAT. Insert into `parent.children`. |
| `REMOVE_BLOCK` | `spriteId`, `blockId` | Remove from top level **and** from any `children` array. |
| `CLEAR_SCRIPT` | `spriteId` | `script: []`. |
| `UPDATE_BLOCK_PARAMS` | `spriteId`, `blockId`, `params` | Find block at top level or inside children; merge params; **sanitize**: for keys in `{steps, degrees, x, y, repeatCount, duration}` store `Number(v) \|\| 0`; `text` stored as `String(v)`. |
| `REORDER_BLOCKS` | `spriteId`, `fromIndex`, `toIndex` | Top-level only. No-op if either index out of range. `const next=[...script]; const [m]=next.splice(from,1); next.splice(to,0,m)`. |
| `ADD_SPRITE` | — | `n = nextSpriteNum`; `id='sprite-'+n`; `avatar = n % 2 === 1 ? 'cat' : 'horse'`; `name = (avatar==='cat'?'Cat ':'Horse ') + n`; spawn at `(0, n % 2 === 1 ? -100 : 100)`; `nextSpriteNum + 1`; set `activeSpriteId` to new id. |
| `DELETE_SPRITE` | `spriteId` | **No-op** if `isRunning` or only one sprite. Remove; if it was active, `activeSpriteId = first remaining key`. |
| `UPDATE_SPRITE` | `spriteId`, `changes` | Shallow-merge `changes` into sprite. **If `changes.x` present → clamp to `[-X_MAX, X_MAX]`; if `changes.y` present → clamp to `[-Y_MAX, Y_MAX]`.** This is the only place clamping lives. |
| `SWAP_SCRIPTS` | `spriteA`, `spriteB` | Swap the two `script` arrays; `scriptVersion + 1` on **both**. No-op if either id unknown. |
| `SET_RUNNING` | `isRunning` | Set flag. |
| `RESET_SPRITES` | — | Every sprite: `x=initialX, y=initialY, angle=initialAngle, speech=null`. `isRunning=false`. Scripts untouched. |

Helper pattern (use for every sprite-scoped action):
```js
const withSprite = (state, id, fn) =>
  state.sprites[id]
    ? { ...state, sprites: { ...state.sprites, [id]: fn(state.sprites[id]) } }
    : state;
```

---

## 6. Module contracts (exact exports — nothing else is exported)

### `src/state/ScratchContext.js`
```js
export { STAGE_W, STAGE_H, SPRITE_W, SPRITE_H, X_MAX, Y_MAX, BLOCK_DEFAULTS, initialState };
export function reducer(state, action) { ... }          // pure
export function ScratchProvider({ children }) { ... }   // owns everything stateful
export function useScratch() { return { state, dispatch, engine }; }
```
Inside `ScratchProvider`:
```js
const [state, dispatch] = useReducer(reducer, initialState);
const stateRef = useRef(state);
useLayoutEffect(() => { stateRef.current = state; }, [state]);   // layout, not effect
const engineRef = useRef(null);
if (engineRef.current === null) engineRef.current = createExecutionEngine(dispatch, stateRef);
// provide { state, dispatch, engine: engineRef.current }
```
`ScratchContext.js` imports `createExecutionEngine` from `../engine/runner`.

### `src/engine/runner.js`
```js
export function createExecutionEngine(dispatch, stateRef) { return { start, stop }; }
```
**Imports nothing from the app.** Owns its own constants: `TICK_MS = 150`, `POLL_MS = 50`, `COLLIDE_PX = 55`, `COOLDOWN_MS = 700`. Dispatches plain action objects using the `type` strings from §5. This is the only module allowed to contain `let`, `Set`, `Map`, `setTimeout`, or any mutation.

### Components
- `PreviewArea.js` → `const { state, engine } = useScratch()`; Play calls `engine.start()`, Stop calls `engine.stop()`.
- `MidArea.js`, `Sidebar.js`, `BlockItem.js`, `SpriteSelector.js` → `useScratch()` for `state` and `dispatch` only. They never touch `engine`.
- `SpriteRenderer.js` → receives one `sprite` prop; renders `CatSprite` or `HorseSprite` by `sprite.avatar`.

---

## 7. Coordinate math (copy exactly)

```js
// Scratch coords -> CSS translate (top-left of the 60x60 sprite box)
const toScreenX = (x) => Math.round(STAGE_W / 2 + x - SPRITE_W / 2);
const toScreenY = (y) => Math.round(STAGE_H / 2 - y - SPRITE_H / 2);   // +y is UP in Scratch

// MOVE: angle 0 = right, clockwise positive. Minus on sin because +y is up.
const rad = angle * Math.PI / 180;
const nx = x + steps * Math.cos(rad);
const ny = y - steps * Math.sin(rad);
```
CSS `rotate(angle deg)` is clockwise-positive on screen, so the same `angle` value drives both the math and the transform with no sign change.

Sprite markup (two wrappers — the bubble must not rotate):
```jsx
<div style={{ position:'absolute', width:SPRITE_W, height:SPRITE_H,
              transform:`translate3d(${toScreenX(x)}px, ${toScreenY(y)}px, 0)`,
              transition:'transform 0.15s ease-out' }}>
  {speech && <Bubble {...speech} />}          {/* on the UNROTATED wrapper */}
  <div style={{ width:'100%', height:'100%', transform:`rotate(${angle}deg)`,
                transition:'transform 0.15s ease-out', transformOrigin:'50% 50%' }}>
    {avatar === 'cat' ? <CatSprite /> : <HorseSprite />}
  </div>
</div>
```

---

## 8. Execution engine — reference pseudocode (replicate this structure exactly)

```js
const ABORT_CANCEL  = Symbol();   // Stop pressed      -> leave runner
const ABORT_RESTART = Symbol();   // scripts swapped   -> restart from block 0
const num = (v) => Number(v) || 0;
const pairKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
const isColliding = (a, b) => Math.abs(a.x - b.x) < COLLIDE_PX && Math.abs(a.y - b.y) < COLLIDE_PX;

export function createExecutionEngine(dispatch, stateRef) {
  let cancelled = false, engineRunning = false;
  const activeRunners = new Set();   // spriteIds with a live runner
  const sleepers = new Set();        // { timeoutId, resolve }
  const wasColliding = new Map();    // pairKey -> bool
  const lastSwapAt = new Map();      // pairKey -> ms
  const sprite = (id) => stateRef.current.sprites[id];

  // sleep that stop() can wake; caller re-checks abort right after it resolves
  const sleep = (ms, abort) => new Promise((resolve) => {
    const end = Date.now() + ms;
    const tick = () => {
      if (cancelled || Date.now() >= end) return resolve();
      const entry = { resolve };
      entry.timeoutId = setTimeout(() => { sleepers.delete(entry); tick(); },
                                   Math.min(POLL_MS, end - Date.now()));
      sleepers.add(entry);
    };
    tick();
  }).then(() => abort());

  // called SYNCHRONOUSLY after every MOVE / GOTO dispatch. No rAF anywhere.
  const checkCollisions = () => {
    const list = Object.values(stateRef.current.sprites);
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j], key = pairKey(a.id, b.id);
      const now = isColliding(a, b), was = wasColliding.get(key) || false;
      const cooled = Date.now() - (lastSwapAt.get(key) || 0) >= COOLDOWN_MS;
      if (now && !was && cooled) {
        lastSwapAt.set(key, Date.now());
        dispatch({ type: 'SWAP_SCRIPTS', spriteA: a.id, spriteB: b.id });
        [a.id, b.id].forEach((id) => { if (!activeRunners.has(id)) runSprite(id); }); // revive
      }
      wasColliding.set(key, now);
    }
  };

  const seedCollisionState = () => {          // so pre-overlapping sprites don't swap at t=0
    wasColliding.clear(); lastSwapAt.clear();
    const list = Object.values(stateRef.current.sprites);
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++)
      wasColliding.set(pairKey(list[i].id, list[j].id), isColliding(list[i], list[j]));
  };

  const execBlock = async (id, block, abort) => {
    const p = block.params;
    switch (block.type) {
      case 'MOVE': { const s = sprite(id), r = s.angle * Math.PI / 180, st = num(p.steps);
        dispatch({ type:'UPDATE_SPRITE', spriteId:id, changes:{ x: s.x + st*Math.cos(r), y: s.y - st*Math.sin(r) } });
        checkCollisions(); await sleep(TICK_MS, abort); break; }
      case 'TURN_CW':  dispatch({ type:'UPDATE_SPRITE', spriteId:id, changes:{ angle: sprite(id).angle + num(p.degrees) } }); await sleep(TICK_MS, abort); break;
      case 'TURN_CCW': dispatch({ type:'UPDATE_SPRITE', spriteId:id, changes:{ angle: sprite(id).angle - num(p.degrees) } }); await sleep(TICK_MS, abort); break;
      case 'GOTO':     dispatch({ type:'UPDATE_SPRITE', spriteId:id, changes:{ x: num(p.x), y: num(p.y) } });
                       checkCollisions(); await sleep(TICK_MS, abort); break;
      case 'REPEAT': { const n = Math.max(0, Math.floor(num(p.repeatCount)));
        for (let i = 0; i < n; i++) {
          abort();
          if (!block.children.length) { await sleep(POLL_MS, abort); continue; }   // empty loop can't starve
          for (const c of block.children) { abort(); await execBlock(id, c, abort); }
        } break; }
      case 'SAY': case 'THINK':
        dispatch({ type:'UPDATE_SPRITE', spriteId:id, changes:{ speech:{ text:String(p.text ?? ''), type: block.type==='SAY'?'say':'think' } } });
        try { await sleep(num(p.duration) * 1000, abort); }
        finally { dispatch({ type:'UPDATE_SPRITE', spriteId:id, changes:{ speech:null } }); }
        break;
    }
  };

  const maybeFinish = () => {
    if (engineRunning && activeRunners.size === 0) { engineRunning = false; dispatch({ type:'SET_RUNNING', isRunning:false }); }
  };

  async function runSprite(id) {
    activeRunners.add(id);                    // idempotent: covers pre-registration AND revival
    try {
      while (true) {                          // one iteration per scriptVersion
        const s = sprite(id); if (cancelled || !s) return;
        const version = s.scriptVersion;
        const abort = () => {
          if (cancelled || !sprite(id)) throw ABORT_CANCEL;
          if (sprite(id).scriptVersion !== version) throw ABORT_RESTART;
        };
        try { for (const b of s.script) { abort(); await execBlock(id, b, abort); } return; }
        catch (e) { if (e === ABORT_RESTART) continue; if (e === ABORT_CANCEL) return; throw e; }
      }
    } finally { activeRunners.delete(id); maybeFinish(); }
  }

  const start = () => {
    if (engineRunning) return;
    cancelled = false; engineRunning = true; seedCollisionState();
    dispatch({ type:'SET_RUNNING', isRunning:true });
    const ids = Object.keys(stateRef.current.sprites);
    ids.forEach((id) => activeRunners.add(id));   // pre-register BEFORE any runner can finish
    ids.forEach((id) => runSprite(id));
  };

  const stop = () => {
    cancelled = true; engineRunning = false;
    sleepers.forEach(({ timeoutId, resolve }) => { clearTimeout(timeoutId); resolve(); });  // wake, don't orphan
    sleepers.clear(); activeRunners.clear();
    dispatch({ type:'RESET_SPRITES' });
  };

  return { start, stop };
}
```

Why each odd-looking line exists (do not "simplify" them away):
- **Pre-register then start** — a sprite with an empty script finishes synchronously; without pre-registration `activeRunners` hits 0 before sprite 2 starts and `SET_RUNNING(false)` fires early.
- **`resolve()` in `stop()`** — `clearTimeout` alone leaves every `await sleep()` hanging forever; `finally` blocks never run.
- **`seedCollisionState()`** — edge-trigger defaults to "not colliding", so two sprites parked together would swap on the first move.
- **`finally` around Say/Think** — speech must clear when a Reset or swap interrupts the wait.
- **Revive in `checkCollisions`** — a sprite whose script already ended must still pick up the script it was handed.
- **No `requestAnimationFrame`** — collisions are a consequence of movement, so checking after each position dispatch is exact, tab-safe, and testable in Node.

---

## 9. Drag-and-drop recipe (native HTML5)

Transfer format — always one JSON string under one key:
```js
e.dataTransfer.setData('application/json', JSON.stringify(
  { source: 'palette', blockType: 'MOVE' }          // from Sidebar
  // or
  { source: 'workspace', blockId: 'blk-4', fromIndex: 2 }   // from MidArea / BlockItem
));
```

Every drop target needs **all five**:
```jsx
onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}  // without preventDefault, drop never fires
onDrop={(e) => {
  e.preventDefault();
  e.stopPropagation();                               // REQUIRED on the Repeat slot and on BlockItem, or the parent list also receives it
  const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}');
  ...dispatch...
}}
```

Dispatch mapping:
| Drop onto | `source === 'palette'` | `source === 'workspace'` |
|---|---|---|
| MidArea list (or a BlockItem at index `i`) | `ADD_BLOCK { spriteId, blockType, index:i }` | `REORDER_BLOCKS { spriteId, fromIndex, toIndex:i }` |
| Repeat slot of block `P` | `ADD_CHILD_BLOCK { spriteId, parentBlockId:P, blockType }` | ignore (no cross-container moves; keep it simple) |
| Sidebar | ignore | `REMOVE_BLOCK { spriteId, blockId }` |

Every draggable sets `draggable={!state.isRunning}` and `onDragStart` writes the JSON above. Inputs inside blocks must call `e.stopPropagation()` on `onMouseDown`, otherwise clicking an input starts a drag.

---

## 10. UI rules

- **Edit lock while `isRunning`:** palette `draggable=false`, inputs `disabled`, trash buttons `disabled`, reorder disabled, Sidebar drop target inert, sprite `×` disabled, "+" sprite disabled. Play button disabled while running; Stop enabled only while running.
- **Block colors (literal class strings, no templates):** Motion `bg-blue-500 text-white`; Looks `bg-purple-500 text-white`; Control `bg-yellow-500 text-black`. Inputs: `bg-white text-black rounded-full px-2 w-14 text-center` (text inputs `w-24`).
- **Stage:** `style={{ width: 480, height: 360, position: 'relative', overflow: 'hidden' }}`; light background with a subtle border.
- **Bubbles:** absolutely positioned above the sprite on the *unrotated* wrapper (§7). Say = rounded rectangle with a small triangle tail. Think = rounded rectangle with two small trailing circles. White background, dark text, 12px font, max-width 140px, `whiteSpace: 'nowrap'`.
- **SpriteSelector:** horizontal row under the stage. Card = thumbnail (sprite SVG scaled to 40px), name, `x`/`y` rounded to integers, `×` (guards per §5), active card has `border-2 border-blue-500`. A "+" card at the end.
- **MidArea header:** active sprite name, a "Clear" button → `CLEAR_SCRIPT`.
- **HorseSprite.js:** a hand-drawn SVG horse, `viewBox="0 0 95 100"`, same outer dimensions as `CatSprite`, brown/tan palette, facing right. Simple shapes are fine; it must read as a horse at 60px.

---

## 11. Hard invariants (the reviewer checks these)

1. No new npm packages. `package.json` unchanged.
2. `ScratchContext.js` has zero `let`, zero module-level mutable variables, zero mutation; every reducer branch returns a new object.
3. All timers, sets and maps live in `runner.js` and nowhere else.
4. Clamping happens in the reducer (`UPDATE_SPRITE`) only.
5. ID minting happens in the reducer from `nextBlockNum` / `nextSpriteNum` only.
6. Collision is edge-triggered per pair with a 700 ms cooldown; checked synchronously after position changes; no `requestAnimationFrame`.
7. Speech bubbles never rotate.
8. No bracket Tailwind syntax, no template-literal class names.
9. `runner.js` imports nothing from the app.
