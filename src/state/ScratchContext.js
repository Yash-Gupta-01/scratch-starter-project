import React, { createContext, useContext, useReducer } from "react";

let blockCounter = 1;
export const createBlockId = () => `blk-${blockCounter++}`;

export const DEFAULT_BLOCK_PARAMS = {
  MOVE: { steps: 10 },
  TURN_CW: { degrees: 15 },
  TURN_CCW: { degrees: 15 },
  GOTO: { x: 0, y: 0 },
  REPEAT: { repeatCount: 10 },
  SAY: { text: "Hello!", duration: 2 },
  THINK: { text: "Hmm...", duration: 2 },
};

export const createBlockItem = (type, customParams = {}) => ({
  id: createBlockId(),
  type,
  params: { ...(DEFAULT_BLOCK_PARAMS[type] || {}), ...customParams },
  children: type === "REPEAT" ? [] : undefined,
});

export const INITIAL_STATE = {
  sprites: {
    "sprite-1": {
      id: "sprite-1",
      name: "Cat",
      avatar: "cat",
      x: -80,
      y: 0,
      angle: 0,
      speech: null, // { text: string, type: 'say' | 'think' } | null
      script: [],
      initialX: -80,
      initialY: 0,
      initialAngle: 0,
      scriptVersion: 0,
    },
    "sprite-2": {
      id: "sprite-2",
      name: "Horse",
      avatar: "horse",
      x: 80,
      y: 0,
      angle: 0,
      speech: null,
      script: [],
      initialX: 80,
      initialY: 0,
      initialAngle: 0,
      scriptVersion: 0,
    },
  },
  activeSpriteId: "sprite-1",
  isRunning: false,
  nextSpriteNum: 3,
};

export function scratchReducer(state, action) {
  switch (action.type) {
    case "SELECT_SPRITE": {
      if (!state.sprites[action.spriteId]) return state;
      return {
        ...state,
        activeSpriteId: action.spriteId,
      };
    }

    case "ADD_BLOCK": {
      const { spriteId, block, index } = action;
      const targetSprite = state.sprites[spriteId];
      if (!targetSprite) return state;

      const newScript = [...targetSprite.script];
      if (typeof index === "number" && index >= 0 && index <= newScript.length) {
        newScript.splice(index, 0, block);
      } else {
        newScript.push(block);
      }

      return {
        ...state,
        sprites: {
          ...state.sprites,
          [spriteId]: {
            ...targetSprite,
            script: newScript,
          },
        },
      };
    }

    case "REMOVE_BLOCK": {
      const { spriteId, blockId } = action;
      const targetSprite = state.sprites[spriteId];
      if (!targetSprite) return state;

      // Filter from top-level script and any repeat children
      const filterBlocks = (blocks) =>
        blocks
          .filter((b) => b.id !== blockId)
          .map((b) =>
            b.type === "REPEAT" && b.children
              ? { ...b, children: filterBlocks(b.children) }
              : b
          );

      return {
        ...state,
        sprites: {
          ...state.sprites,
          [spriteId]: {
            ...targetSprite,
            script: filterBlocks(targetSprite.script),
          },
        },
      };
    }

    case "CLEAR_SCRIPT": {
      const { spriteId } = action;
      const targetSprite = state.sprites[spriteId];
      if (!targetSprite) return state;

      return {
        ...state,
        sprites: {
          ...state.sprites,
          [spriteId]: {
            ...targetSprite,
            script: [],
          },
        },
      };
    }

    case "UPDATE_BLOCK_PARAMS": {
      const { spriteId, blockId, params } = action;
      const targetSprite = state.sprites[spriteId];
      if (!targetSprite) return state;

      const updateInBlocks = (blocks) =>
        blocks.map((b) => {
          if (b.id === blockId) {
            return { ...b, params: { ...b.params, ...params } };
          }
          if (b.type === "REPEAT" && b.children) {
            return { ...b, children: updateInBlocks(b.children) };
          }
          return b;
        });

      return {
        ...state,
        sprites: {
          ...state.sprites,
          [spriteId]: {
            ...targetSprite,
            script: updateInBlocks(targetSprite.script),
          },
        },
      };
    }

    case "REORDER_BLOCKS": {
      const { spriteId, fromIndex, toIndex } = action;
      const targetSprite = state.sprites[spriteId];
      if (!targetSprite) return state;

      const newScript = [...targetSprite.script];
      if (
        fromIndex < 0 ||
        fromIndex >= newScript.length ||
        toIndex < 0 ||
        toIndex >= newScript.length ||
        fromIndex === toIndex
      ) {
        return state;
      }

      const [moved] = newScript.splice(fromIndex, 1);
      newScript.splice(toIndex, 0, moved);

      return {
        ...state,
        sprites: {
          ...state.sprites,
          [spriteId]: {
            ...targetSprite,
            script: newScript,
          },
        },
      };
    }

    case "ADD_CHILD_BLOCK": {
      const { spriteId, parentBlockId, block, index } = action;
      const targetSprite = state.sprites[spriteId];
      if (!targetSprite) return state;

      // Strict rule: no Repeat inside Repeat
      if (block.type === "REPEAT") return state;

      const insertChild = (blocks) =>
        blocks.map((b) => {
          if (b.id === parentBlockId && b.type === "REPEAT") {
            const currentChildren = b.children || [];
            const newChildren = [...currentChildren];
            if (typeof index === "number" && index >= 0 && index <= newChildren.length) {
              newChildren.splice(index, 0, block);
            } else {
              newChildren.push(block);
            }
            return { ...b, children: newChildren };
          }
          return b;
        });

      return {
        ...state,
        sprites: {
          ...state.sprites,
          [spriteId]: {
            ...targetSprite,
            script: insertChild(targetSprite.script),
          },
        },
      };
    }

    case "ADD_SPRITE": {
      const num = state.nextSpriteNum;
      const newId = `sprite-${num}`;
      const isCat = num % 2 === 1;
      const avatar = isCat ? "cat" : "horse";
      const name = isCat ? `Cat ${Math.ceil(num / 2)}` : `Horse ${Math.ceil(num / 2)}`;
      // Alternate spawn coordinates off the horizontal collision lane
      const spawnY = num % 2 === 1 ? -100 : 100;

      const newSprite = {
        id: newId,
        name,
        avatar,
        x: 0,
        y: spawnY,
        angle: 0,
        speech: null,
        script: [],
        initialX: 0,
        initialY: spawnY,
        initialAngle: 0,
        scriptVersion: 0,
      };

      return {
        ...state,
        sprites: {
          ...state.sprites,
          [newId]: newSprite,
        },
        activeSpriteId: newId,
        nextSpriteNum: num + 1,
      };
    }

    case "DELETE_SPRITE": {
      const { spriteId } = action;
      const spriteKeys = Object.keys(state.sprites);
      // Guard: At least 1 sprite must remain; do not delete while running
      if (spriteKeys.length <= 1 || state.isRunning) return state;

      const remainingSprites = { ...state.sprites };
      delete remainingSprites[spriteId];

      let newActiveId = state.activeSpriteId;
      if (state.activeSpriteId === spriteId) {
        newActiveId = Object.keys(remainingSprites)[0];
      }

      return {
        ...state,
        sprites: remainingSprites,
        activeSpriteId: newActiveId,
      };
    }

    case "UPDATE_SPRITE": {
      const { spriteId, changes } = action;
      const targetSprite = state.sprites[spriteId];
      if (!targetSprite) return state;

      return {
        ...state,
        sprites: {
          ...state.sprites,
          [spriteId]: {
            ...targetSprite,
            ...changes,
          },
        },
      };
    }

    case "SWAP_SCRIPTS": {
      const { spriteA, spriteB } = action;
      const sA = state.sprites[spriteA];
      const sB = state.sprites[spriteB];
      if (!sA || !sB) return state;

      return {
        ...state,
        sprites: {
          ...state.sprites,
          [spriteA]: {
            ...sA,
            script: sB.script,
            scriptVersion: sA.scriptVersion + 1,
          },
          [spriteB]: {
            ...sB,
            script: sA.script,
            scriptVersion: sB.scriptVersion + 1,
          },
        },
      };
    }

    case "SET_RUNNING": {
      return {
        ...state,
        isRunning: Boolean(action.isRunning),
      };
    }

    case "RESET_SPRITES": {
      const resetSprites = {};
      Object.keys(state.sprites).forEach((id) => {
        const s = state.sprites[id];
        resetSprites[id] = {
          ...s,
          x: s.initialX,
          y: s.initialY,
          angle: s.initialAngle,
          speech: null,
        };
      });

      return {
        ...state,
        isRunning: false,
        sprites: resetSprites,
      };
    }

    default:
      return state;
  }
}

const ScratchContext = createContext(null);

export function ScratchProvider({ children }) {
  const [state, dispatch] = useReducer(scratchReducer, INITIAL_STATE);

  return (
    <ScratchContext.Provider value={{ state, dispatch }}>
      {children}
    </ScratchContext.Provider>
  );
}

export function useScratch() {
  const context = useContext(ScratchContext);
  if (!context) {
    throw new Error("useScratch must be used within a ScratchProvider");
  }
  return context;
}
