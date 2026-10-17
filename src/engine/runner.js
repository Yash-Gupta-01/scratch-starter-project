export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function cancellableSleep(ms, cancelRef, spriteId, scriptVersion, stateRef) {
  const step = 50;
  let elapsed = 0;
  while (elapsed < ms) {
    if (cancelRef.current) {
      throw new Error("ABORT_CANCEL");
    }
    const currentSprite = stateRef.current?.sprites?.[spriteId];
    if (currentSprite && currentSprite.scriptVersion !== scriptVersion) {
      throw new Error("ABORT_SWAP");
    }
    await sleep(Math.min(step, ms - elapsed));
    elapsed += step;
  }
}

export async function executeBlock(
  spriteId,
  block,
  dispatch,
  cancelRef,
  stateRef,
  scriptVersion
) {
  if (cancelRef.current) throw new Error("ABORT_CANCEL");
  const currentSprite = stateRef.current?.sprites?.[spriteId];
  if (currentSprite && currentSprite.scriptVersion !== scriptVersion) {
    throw new Error("ABORT_SWAP");
  }

  switch (block.type) {
    case "MOVE": {
      const sprite = stateRef.current.sprites[spriteId];
      if (!sprite) return;
      const steps = Number(block.params.steps ?? 10);
      const rad = (sprite.angle * Math.PI) / 180;
      const dx = steps * Math.cos(rad);
      const dy = -steps * Math.sin(rad); // Scratch +y is UP

      const newX = Math.max(-210, Math.min(210, Math.round(sprite.x + dx)));
      const newY = Math.max(-150, Math.min(150, Math.round(sprite.y + dy)));

      dispatch({
        type: "UPDATE_SPRITE",
        spriteId,
        changes: { x: newX, y: newY },
      });
      await cancellableSleep(150, cancelRef, spriteId, scriptVersion, stateRef);
      break;
    }

    case "TURN_CW": {
      const sprite = stateRef.current.sprites[spriteId];
      if (!sprite) return;
      const deg = Number(block.params.degrees ?? 15);
      const newAngle = (sprite.angle + deg) % 360;

      dispatch({
        type: "UPDATE_SPRITE",
        spriteId,
        changes: { angle: newAngle },
      });
      await cancellableSleep(150, cancelRef, spriteId, scriptVersion, stateRef);
      break;
    }

    case "TURN_CCW": {
      const sprite = stateRef.current.sprites[spriteId];
      if (!sprite) return;
      const deg = Number(block.params.degrees ?? 15);
      const newAngle = (sprite.angle - deg) % 360;

      dispatch({
        type: "UPDATE_SPRITE",
        spriteId,
        changes: { angle: newAngle },
      });
      await cancellableSleep(150, cancelRef, spriteId, scriptVersion, stateRef);
      break;
    }

    case "GOTO": {
      const targetX = Number(block.params.x ?? 0);
      const targetY = Number(block.params.y ?? 0);
      const newX = Math.max(-210, Math.min(210, targetX));
      const newY = Math.max(-150, Math.min(150, targetY));

      dispatch({
        type: "UPDATE_SPRITE",
        spriteId,
        changes: { x: newX, y: newY },
      });
      await cancellableSleep(150, cancelRef, spriteId, scriptVersion, stateRef);
      break;
    }

    case "SAY":
    case "THINK": {
      const text = block.params.text ?? (block.type === "SAY" ? "Hello!" : "Hmm...");
      const duration = Number(block.params.duration ?? 2);
      const type = block.type === "SAY" ? "say" : "think";

      try {
        dispatch({
          type: "UPDATE_SPRITE",
          spriteId,
          changes: { speech: { text, type } },
        });
        await cancellableSleep(duration * 1000, cancelRef, spriteId, scriptVersion, stateRef);
      } finally {
        dispatch({
          type: "UPDATE_SPRITE",
          spriteId,
          changes: { speech: null },
        });
      }
      break;
    }

    case "REPEAT": {
      const count = Math.max(1, Number(block.params.repeatCount ?? 10));
      const children = block.children || [];

      for (let i = 0; i < count; i++) {
        if (cancelRef.current) throw new Error("ABORT_CANCEL");

        if (children.length === 0) {
          // Empty loop guard: avoid locking the JavaScript thread
          await cancellableSleep(50, cancelRef, spriteId, scriptVersion, stateRef);
        } else {
          for (const child of children) {
            await executeBlock(spriteId, child, dispatch, cancelRef, stateRef, scriptVersion);
          }
        }
      }
      break;
    }

    default:
      break;
  }
}

export function createExecutionEngine(dispatch, cancelRef, stateRef) {
  const activeRunners = new Set();
  let rafId = null;
  let wasColliding = false;
  let lastSwapTimestamp = 0;

  const checkCompletion = () => {
    if (activeRunners.size === 0 && !cancelRef.current) {
      dispatch({ type: "SET_RUNNING", isRunning: false });
      stopCollisionLoop();
    }
  };

  const runSprite = async (spriteId) => {
    activeRunners.add(spriteId);

    try {
      while (!cancelRef.current) {
        const sprite = stateRef.current.sprites[spriteId];
        if (!sprite || !sprite.script || sprite.script.length === 0) {
          break;
        }

        const scriptVersion = sprite.scriptVersion;

        try {
          for (const block of sprite.script) {
            await executeBlock(
              spriteId,
              block,
              dispatch,
              cancelRef,
              stateRef,
              scriptVersion
            );
          }
          // Script completed normally without swap interruption
          break;
        } catch (err) {
          if (err.message === "ABORT_SWAP") {
            // Version mismatch detected due to collision swap -> restart newly assigned script from block 0
            continue;
          }
          // ABORT_CANCEL or other error
          break;
        }
      }
    } finally {
      activeRunners.delete(spriteId);
      checkCompletion();
    }
  };

  const startCollisionLoop = () => {
    const loop = () => {
      if (cancelRef.current) return;

      const s1 = stateRef.current.sprites["sprite-1"];
      const s2 = stateRef.current.sprites["sprite-2"];

      if (s1 && s2) {
        // Continuous unrotated AABB collision check
        const isColliding = Math.abs(s1.x - s2.x) < 55 && Math.abs(s1.y - s2.y) < 55;

        // Edge-triggered swap on false -> true transition with 700ms cooldown backstop
        if (isColliding && !wasColliding && Date.now() - lastSwapTimestamp > 700) {
          wasColliding = true;
          lastSwapTimestamp = Date.now();

          // Dispatch atomic script swap in central state
          dispatch({
            type: "SWAP_SCRIPTS",
            spriteA: "sprite-1",
            spriteB: "sprite-2",
          });

          // Revive any swapped sprite whose previous script had already finished
          ["sprite-1", "sprite-2"].forEach((id) => {
            if (!activeRunners.has(id)) {
              runSprite(id);
            }
          });
        } else if (!isColliding) {
          // Reset edge trigger when sprites separate
          wasColliding = false;
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
  };

  const stopCollisionLoop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const start = () => {
    cancelRef.current = false;
    dispatch({ type: "SET_RUNNING", isRunning: true });
    activeRunners.clear();
    wasColliding = false;
    lastSwapTimestamp = 0;

    // Launch runner for each sprite
    const spriteIds = Object.keys(stateRef.current.sprites);
    spriteIds.forEach((id) => {
      runSprite(id);
    });

    startCollisionLoop();
  };

  const stop = () => {
    cancelRef.current = true;
    stopCollisionLoop();
    activeRunners.clear();
    dispatch({ type: "RESET_SPRITES" });
  };

  return {
    start,
    stop,
  };
}
