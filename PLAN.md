# PLAN.md — Sprint sequence with observable Done-criteria

`AGENTS.md` is the contract; this file is the order of work. Do one sprint per session.
A sprint is done only when **every** box under its Done-criteria has been observed, not assumed.
After each sprint: `npm start` → open `http://localhost:3000` → zero console errors → `git commit -m "Sprint N: <subject>"`.

---

## File budget (exactly these files inside `src/`)

```
src/
├── index.js                 existing  — leave untouched
├── App.js                   existing  — wrap in <ScratchProvider>; replace any bracket Tailwind with inline styles
├── state/ScratchContext.js  NEW       — typedefs, constants, initialState, reducer, Provider, useScratch
├── engine/runner.js         NEW       — createExecutionEngine (the only impure module)
└── components/
    ├── Sidebar.js           existing  — 7 palette chips (drag sources) + drop-to-delete target
    ├── MidArea.js           existing  — script list for active sprite; drop target; Clear button
    ├── BlockItem.js         NEW       — one editable block; Repeat renders a child slot
    ├── PreviewArea.js       existing  — stage + Play/Stop; renders SpriteRenderer per sprite; SpriteSelector below
    ├── SpriteRenderer.js    NEW       — positioned sprite + bubble (two-wrapper markup, AGENTS §7)
    ├── SpriteSelector.js    NEW       — sprite cards, ×, +
    ├── CatSprite.js         existing  — leave untouched
    ├── HorseSprite.js       NEW       — SVG horse
    └── Icon.js              existing  — leave untouched
```

---

## Sprint 1 — State (`ScratchContext.js`, `App.js`)

Steps
1. Create `src/state/ScratchContext.js`. Paste the JSDoc typedefs, constants, `BLOCK_DEFAULTS`, `makeSprite`, `initialState` from AGENTS §4 verbatim.
2. Implement `reducer` with all 13 actions from AGENTS §5, using the `withSprite` helper. Implement `UPDATE_BLOCK_PARAMS` sanitization and `UPDATE_SPRITE` clamping here.
3. Implement `ScratchProvider` exactly as AGENTS §6 (`useReducer`, `stateRef` via `useLayoutEffect`, `engineRef` created once). For this sprint `createExecutionEngine` may be a stub in `runner.js` returning `{ start(){}, stop(){} }`.
4. Export `useScratch`.
5. Read `App.js`; wrap its root in `<ScratchProvider>`; replace any `min-w-[...]` / `w-[...]` classes with `style={{ minWidth: ... }}`.

Done-criteria
- [x] `npm start` compiles with zero warnings about unused exports or missing modules.
- [x] In the browser console: `window.__scratchState` is **not** needed — instead temporarily `console.log(state)` in `App.js`, confirm it prints `sprites['sprite-1'].x === -80`, `nextBlockNum === 1`, then remove the log.
- [x] Grep check: `grep -n "let \|\.push(\|\.splice(" src/state/ScratchContext.js` returns **only** the `REORDER_BLOCKS` splice on a copied array. No other hits.
- [x] Mental test, written as a comment above the reducer: `ADD_BLOCK` twice yields ids `blk-1`, `blk-2`; `ADD_CHILD_BLOCK` with `blockType:'REPEAT'` is a no-op; `UPDATE_SPRITE` with `x: 900` stores `210`.

---

## Sprint 2 — Workspace & DnD (`Sidebar.js`, `MidArea.js`, `BlockItem.js`)

Steps
1. Read `Sidebar.js` and `MidArea.js` first. Keep their outer layout classes.
2. `Sidebar.js`: render the 7 chips from AGENTS §3 grouped under "Motion", "Control", "Looks" headers, colored per AGENTS §10. Each chip: `draggable={!isRunning}`, `onDragStart` writes `{ source:'palette', blockType }` (AGENTS §9). The Sidebar root is a drop target that dispatches `REMOVE_BLOCK` for `source === 'workspace'`.
3. `BlockItem.js`: props `{ block, index, spriteId, isChild }`. Renders the chip with inline inputs bound to `UPDATE_BLOCK_PARAMS` (`onChange` dispatches the raw string; reducer sanitizes). Trash button → `REMOVE_BLOCK`. Draggable (`source:'workspace'`) unless `isChild`. If `block.type === 'REPEAT'`, render a child slot `<div>` below the header that is a drop target dispatching `ADD_CHILD_BLOCK` (with `stopPropagation`) and maps `block.children` to `<BlockItem isChild />`.
4. `MidArea.js`: header with active sprite name + "Clear" → `CLEAR_SCRIPT`. List `script.map((b,i) => <BlockItem …/>)`. The list root is a drop target: palette → `ADD_BLOCK` (append); workspace → `REORDER_BLOCKS` to end. Each `BlockItem` is also a drop target with `stopPropagation` that uses its own `index` as the insert/target index.
5. Inputs: `onMouseDown={(e) => e.stopPropagation()}` and `disabled={isRunning}`.

Done-criteria
- [x] Drag Move chip into MidArea → one Move block appears with `10` in its input.
- [x] Change `10` to `25`, blur, re-read: input shows `25`; React DevTools (or a temporary log) shows `params.steps === 25` as a **number**.
- [x] Drag Repeat in, then drag Say into Repeat's slot → Say appears **inside** Repeat, **not** also in the top-level list.
- [x] Drag a Repeat chip into an existing Repeat's slot → nothing happens.
- [x] Drag the first top-level block onto the third → order changes to 2,3,1.
- [x] Drag a block onto the Sidebar → it disappears from the list.
- [x] Click inside a number input → the block does **not** start dragging.
- [x] Clear button empties the list.

---

## Sprint 3 — Stage, sprites, engine, HERO FEATURE (`runner.js`, `PreviewArea.js`, `SpriteRenderer.js`, `HorseSprite.js`)

Steps
1. `HorseSprite.js` per AGENTS §10.
2. `SpriteRenderer.js` per AGENTS §7 markup (two wrappers, bubble on the outer one). Bubble component inline in this file.
3. `runner.js`: replace the stub with the full engine, copying AGENTS §8 structurally. Constants `TICK_MS=150, POLL_MS=50, COLLIDE_PX=55, COOLDOWN_MS=700`.
4. `PreviewArea.js`: read it first; keep its container. Add the 480×360 stage with inline styles; render `Object.values(state.sprites).map(s => <SpriteRenderer key={s.id} sprite={s} />)`. Green-flag Play → `engine.start()` (disabled while running). Red Stop → `engine.stop()` (disabled while not running). Leave a slot below the stage for `SpriteSelector` (Sprint 4).

Done-criteria — the hero test, zero edits to defaults
- [x] Setup: with Cat active, drag Repeat, then drag Move into it (defaults: `10` and `10`). Switch to Horse (temporary: dispatch `SELECT_SPRITE` from a button or DevTools until Sprint 4), drag Repeat, drag Move into it, change Move steps to `-10`.
- [x] Press Play. Both move. **On the 6th tick** (≈0.9 s) Cat is at x ≈ −20 and Horse at x ≈ +20 and **they reverse**: Cat now walks left, Horse right. They end near x = −120 and x = +120. Play button re-enables on its own when both finish.
- [x] While they reverse, look at MidArea: Cat's script now shows **Move −10** (and Horse's shows Move 10). The swap is visible in state, not just in motion.
- [x] They swap **once**. No flicker, no back-and-forth.
- [x] Press Play, then Stop at ~0.5 s: both snap back to ±80 within one transition, buttons return to idle, console shows no unhandled-promise warnings. Press Play again: it runs normally.
- [x] Add `Say Hello! for 2 seconds` before Cat's Repeat. Play → bubble appears above Cat, upright, for 2 s, then Cat starts moving. Press Stop during the bubble → bubble vanishes immediately.
- [x] Add `Turn ↻ 90` to Horse before its Repeat → Horse rotates then walks **downward** (+y is up, clockwise from facing-right points down). Bubble, if any, stays upright.
- [x] Move 500 steps once → sprite stops at the stage edge, never leaves it.

---

## Sprint 4 — Sprite management (`SpriteSelector.js`)

Steps
1. Build `SpriteSelector.js` per AGENTS §10; mount it below the stage in `PreviewArea.js`. Remove any temporary sprite-switch button from Sprint 3.
2. Card click → `SELECT_SPRITE`. `×` → `DELETE_SPRITE` (disabled per guards). `+` → `ADD_SPRITE`.

Done-criteria
- [x] Click Horse card → MidArea header says Horse and shows Horse's script; click Cat → Cat's.
- [x] `+` adds "Cat 3" at (0, −100) i.e. **below** center on screen, becomes active with an empty script. `+` again adds "Horse 4" at (0, +100).
- [x] With 4 sprites, re-run the hero test → Cat and Horse still swap once; Cat 3 / Horse 4 are untouched.
- [x] `×` on the active sprite → another card becomes active, no crash. `×` is disabled while running and when one sprite remains.
- [x] Coordinates on each card update live during Play.

---

## Sprint 5 — Polish & robustness

Steps
1. Style bubbles (tail / trailing circles), chip spacing, stage border, hover states on buttons. Keep every class a literal.
2. Spam test (below). Fix anything it surfaces.

Done-criteria
- [x] Click Play/Stop alternately 10 times fast → final state is idle, sprites at initial positions, no console warnings, no "ghost" movement afterwards.
- [x] Say with `duration: 0` and Repeat with `repeatCount: 0` → run completes instantly, no hang.
- [x] Repeat with an empty slot and count 1000 → the page stays responsive; Stop works.
- [x] Resize the browser → stage stays 480×360, layout doesn't collapse.
- [x] `npm run build` → zero warnings. `public/` contains the bundle.

---

## Sprint 6 — Deploy, README, recording

Steps
1. `vercel.json`: `{ "outputDirectory": "public" }`. Confirm the build output file(s) in `public/` are in `.gitignore` (the committed `public/index.html` stays).
2. Deploy; open the URL; run the hero test on the live site.
3. Write `README.md` with these sections, in this order:
   - **Live demo** (URL) · **Run locally** (`npm i`, `npm start`).
   - **What's implemented** — the 7-chip table from AGENTS §3 with the spec line each satisfies; note Turn ↻/↺ are the two halves of "turn ___ degrees".
   - **Architecture** — the FP purity-boundary quote from AGENTS §1; one paragraph on `useReducer` + Context as the single source of truth; one on `runner.js` as the only effectful module, with `stateRef` mirroring.
   - **Hero feature: collision swap semantics** — edge-triggered on collision entry; scripts exchanged in state (visible in the editor); each sprite restarts its inherited script from block 0; finished sprites are revived; 700 ms cooldown as backstop; checked synchronously after every position change (no rAF).
   - **Why JavaScript** — starter is JS; converting adds build risk, no feature value; types documented via JSDoc.
   - **Known limits** — Repeat nests one level; Think/Say are blocking per sprite.
4. Record 60–90 s:
   1. (0–15 s) Drag Move, Turn, Go to, Say into Cat; edit two values.
   2. (15–30 s) Switch to Horse; show its empty script; add Repeat → Move −10.
   3. (30–45 s) Go back to Cat; replace its script with Repeat → Move 10.
   4. (45–70 s) Play. Narrate the collision and the swap; pause on MidArea showing Cat now holds Move −10.
   5. (70–90 s) Stop → reset. Add a sprite with `+`. Done.

Done-criteria
- [ ] Live URL loads in an incognito window and passes the hero test.
- [x] README renders on GitHub with the six sections above.
- [x] Commit history: one commit per sprint plus README/deploy, no "wip" commits.
- [ ] Recording shows the swap and the MidArea script change in the same frame.
