const ABORT_CANCEL = Symbol("ABORT_CANCEL"); // Stop pressed -> leave runner
const ABORT_RESTART = Symbol("ABORT_RESTART"); // scripts swapped -> restart from block 0
const num = (v) => Number(v) || 0;
const pairKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);

const TICK_MS = 150;
const POLL_MS = 50;
const COLLIDE_PX = 55;
const COOLDOWN_MS = 700;

const isColliding = (a, b) =>
  Math.abs(a.x - b.x) < COLLIDE_PX && Math.abs(a.y - b.y) < COLLIDE_PX;

export function createExecutionEngine(dispatch, stateRef) {
  let cancelled = false;
  let engineRunning = false;
  const activeRunners = new Set(); // spriteIds with a live runner
  const sleepers = new Set(); // { timeoutId, resolve }
  const wasColliding = new Map(); // pairKey -> bool
  const lastSwapAt = new Map(); // pairKey -> ms
  const sprite = (id) => stateRef.current.sprites[id];

  // sleep that stop() can wake; caller re-checks abort right after it resolves
  const sleep = (ms, abort) =>
    new Promise((resolve) => {
      const end = Date.now() + ms;
      const tick = () => {
        if (cancelled || Date.now() >= end) return resolve();
        const entry = { resolve };
        entry.timeoutId = setTimeout(() => {
          sleepers.delete(entry);
          tick();
        }, Math.min(POLL_MS, end - Date.now()));
        sleepers.add(entry);
      };
      tick();
    }).then(() => abort());

  // called SYNCHRONOUSLY after every MOVE / GOTO dispatch. No rAF anywhere.
  const checkCollisions = () => {
    const list = Object.values(stateRef.current.sprites);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const key = pairKey(a.id, b.id);
        const now = isColliding(a, b);
        const was = wasColliding.get(key) || false;
        const cooled = Date.now() - (lastSwapAt.get(key) || 0) >= COOLDOWN_MS;

        if (now && !was && cooled) {
          lastSwapAt.set(key, Date.now());
          dispatch({ type: "SWAP_SCRIPTS", spriteA: a.id, spriteB: b.id });
          [a.id, b.id].forEach((id) => {
            if (!activeRunners.has(id)) runSprite(id); // revive
          });
        }
        wasColliding.set(key, now);
      }
    }
  };

  const seedCollisionState = () => {
    // so pre-overlapping sprites don't swap at t=0
    wasColliding.clear();
    lastSwapAt.clear();
    const list = Object.values(stateRef.current.sprites);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        wasColliding.set(
          pairKey(list[i].id, list[j].id),
          isColliding(list[i], list[j])
        );
      }
    }
  };

  const execBlock = async (id, block, abort) => {
    const p = block.params || {};
    switch (block.type) {
      case "MOVE": {
        const s = sprite(id);
        if (!s) return;
        const r = (s.angle * Math.PI) / 180;
        const st = num(p.steps);
        dispatch({
          type: "UPDATE_SPRITE",
          spriteId: id,
          changes: { x: s.x + st * Math.cos(r), y: s.y - st * Math.sin(r) },
        });
        checkCollisions();
        await sleep(TICK_MS, abort);
        break;
      }

      case "TURN_CW": {
        const s = sprite(id);
        if (!s) return;
        dispatch({
          type: "UPDATE_SPRITE",
          spriteId: id,
          changes: { angle: s.angle + num(p.degrees) },
        });
        await sleep(TICK_MS, abort);
        break;
      }

      case "TURN_CCW": {
        const s = sprite(id);
        if (!s) return;
        dispatch({
          type: "UPDATE_SPRITE",
          spriteId: id,
          changes: { angle: s.angle - num(p.degrees) },
        });
        await sleep(TICK_MS, abort);
        break;
      }

      case "GOTO": {
        dispatch({
          type: "UPDATE_SPRITE",
          spriteId: id,
          changes: { x: num(p.x), y: num(p.y) },
        });
        checkCollisions();
        await sleep(TICK_MS, abort);
        break;
      }

      case "REPEAT": {
        const n = Math.max(0, Math.floor(num(p.repeatCount)));
        const children = block.children || [];
        for (let i = 0; i < n; i++) {
          abort();
          if (!children.length) {
            await sleep(POLL_MS, abort); // empty loop can't starve
            continue;
          }
          for (const c of children) {
            abort();
            await execBlock(id, c, abort);
          }
        }
        break;
      }

      case "SAY":
      case "THINK": {
        dispatch({
          type: "UPDATE_SPRITE",
          spriteId: id,
          changes: {
            speech: {
              text: String(p.text ?? ""),
              type: block.type === "SAY" ? "say" : "think",
            },
          },
        });
        try {
          await sleep(num(p.duration) * 1000, abort);
        } finally {
          dispatch({
            type: "UPDATE_SPRITE",
            spriteId: id,
            changes: { speech: null },
          });
        }
        break;
      }

      default:
        break;
    }
  };

  const maybeFinish = () => {
    if (engineRunning && activeRunners.size === 0) {
      engineRunning = false;
      dispatch({ type: "SET_RUNNING", isRunning: false });
    }
  };

  async function runSprite(id) {
    activeRunners.add(id); // idempotent: covers pre-registration AND revival
    try {
      while (true) {
        // one iteration per scriptVersion
        const s = sprite(id);
        if (cancelled || !s) return;
        const version = s.scriptVersion;
        const abort = () => {
          if (cancelled || !sprite(id)) throw ABORT_CANCEL;
          if (sprite(id).scriptVersion !== version) throw ABORT_RESTART;
        };

        try {
          for (const b of s.script) {
            abort();
            await execBlock(id, b, abort);
          }
          return;
        } catch (e) {
          if (e === ABORT_RESTART) continue;
          if (e === ABORT_CANCEL) return;
          throw e;
        }
      }
    } finally {
      activeRunners.delete(id);
      maybeFinish();
    }
  }

  const start = () => {
    if (engineRunning) return;
    cancelled = false;
    engineRunning = true;
    seedCollisionState();
    dispatch({ type: "SET_RUNNING", isRunning: true });
    const ids = Object.keys(stateRef.current.sprites);
    ids.forEach((id) => activeRunners.add(id)); // pre-register BEFORE any runner can finish
    ids.forEach((id) => runSprite(id));
  };

  const stop = () => {
    cancelled = true;
    engineRunning = false;
    sleepers.forEach(({ timeoutId, resolve }) => {
      clearTimeout(timeoutId);
      resolve();
    }); // wake, don't orphan
    sleepers.clear();
    activeRunners.clear();
    dispatch({ type: "RESET_SPRITES" });
  };

  return { start, stop };
}
