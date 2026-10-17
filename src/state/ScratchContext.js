import React, { createContext, useContext, useReducer, useRef, useLayoutEffect } from "react";
import { createExecutionEngine } from "../engine/runner";

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

const withSprite = (state, id, fn) =>
  state.sprites[id]
    ? { ...state, sprites: { ...state.sprites, [id]: fn(state.sprites[id]) } }
    : state;

const NUMERIC_KEYS = new Set(['steps', 'degrees', 'x', 'y', 'repeatCount', 'duration']);

const sanitizeParams = (params = {}) => {
  const result = {};
  for (const key of Object.keys(params)) {
    if (NUMERIC_KEYS.has(key)) {
      result[key] = Number(params[key]) || 0;
    } else if (key === 'text') {
      result[key] = String(params[key] ?? '');
    } else {
      result[key] = params[key];
    }
  }
  return result;
};

// Mental test:
// ADD_BLOCK twice yields ids 'blk-1', 'blk-2'
// ADD_CHILD_BLOCK with blockType:'REPEAT' is a no-op
// UPDATE_SPRITE with x: 900 stores 210
export function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_SPRITE': {
      if (!state.sprites[action.spriteId]) return state;
      return { ...state, activeSpriteId: action.spriteId };
    }

    case 'ADD_BLOCK': {
      if (!state.sprites[action.spriteId] || !action.blockType) return state;
      const id = `blk-${state.nextBlockNum}`;
      const block = {
        id,
        type: action.blockType,
        params: { ...BLOCK_DEFAULTS[action.blockType] },
        children: [],
      };

      const nextState = withSprite(state, action.spriteId, (s) => {
        const nextScript =
          typeof action.index === 'number' &&
          action.index >= 0 &&
          action.index <= s.script.length
            ? [...s.script.slice(0, action.index), block, ...s.script.slice(action.index)]
            : [...s.script, block];
        return { ...s, script: nextScript };
      });

      return { ...nextState, nextBlockNum: state.nextBlockNum + 1 };
    }

    case 'ADD_CHILD_BLOCK': {
      const targetSprite = state.sprites[action.spriteId];
      if (
        !targetSprite ||
        !action.parentBlockId ||
        action.blockType === 'REPEAT' ||
        !action.blockType
      ) {
        return state;
      }

      const parentExists = targetSprite.script.some(
        (b) => b.id === action.parentBlockId && b.type === 'REPEAT'
      );
      if (!parentExists) return state;

      const childId = `blk-${state.nextBlockNum}`;
      const childBlock = {
        id: childId,
        type: action.blockType,
        params: { ...BLOCK_DEFAULTS[action.blockType] },
        children: [],
      };

      const insertIntoChildren = (blocks) =>
        blocks.map((b) => {
          if (b.id === action.parentBlockId && b.type === 'REPEAT') {
            const nextChildren =
              typeof action.index === 'number' &&
              action.index >= 0 &&
              action.index <= b.children.length
                ? [
                    ...b.children.slice(0, action.index),
                    childBlock,
                    ...b.children.slice(action.index),
                  ]
                : [...b.children, childBlock];
            return { ...b, children: nextChildren };
          }
          return b;
        });

      const nextState = withSprite(state, action.spriteId, (s) => ({
        ...s,
        script: insertIntoChildren(s.script),
      }));

      return { ...nextState, nextBlockNum: state.nextBlockNum + 1 };
    }

    case 'REMOVE_BLOCK': {
      const filterRecursive = (blocks) =>
        blocks
          .filter((b) => b.id !== action.blockId)
          .map((b) =>
            b.children && b.children.length > 0
              ? { ...b, children: filterRecursive(b.children) }
              : b
          );

      return withSprite(state, action.spriteId, (s) => ({
        ...s,
        script: filterRecursive(s.script),
      }));
    }

    case 'CLEAR_SCRIPT': {
      return withSprite(state, action.spriteId, (s) => ({
        ...s,
        script: [],
      }));
    }

    case 'UPDATE_BLOCK_PARAMS': {
      const sanitized = sanitizeParams(action.params);
      const updateRecursive = (blocks) =>
        blocks.map((b) => {
          if (b.id === action.blockId) {
            return { ...b, params: { ...b.params, ...sanitized } };
          }
          if (b.children && b.children.length > 0) {
            return { ...b, children: updateRecursive(b.children) };
          }
          return b;
        });

      return withSprite(state, action.spriteId, (s) => ({
        ...s,
        script: updateRecursive(s.script),
      }));
    }

    case 'REORDER_BLOCKS': {
      return withSprite(state, action.spriteId, (s) => {
        const len = s.script.length;
        if (
          action.fromIndex < 0 ||
          action.fromIndex >= len ||
          action.toIndex < 0 ||
          action.toIndex >= len ||
          action.fromIndex === action.toIndex
        ) {
          return s;
        }
        const next = [...s.script];
        const [m] = next.splice(action.fromIndex, 1);
        next.splice(action.toIndex, 0, m);
        return { ...s, script: next };
      });
    }

    case 'ADD_SPRITE': {
      const n = state.nextSpriteNum;
      const id = `sprite-${n}`;
      const avatar = n % 2 === 1 ? 'cat' : 'horse';
      const name = (avatar === 'cat' ? 'Cat ' : 'Horse ') + n;
      const newSprite = makeSprite(id, name, avatar, 0, n % 2 === 1 ? -100 : 100);
      return {
        ...state,
        sprites: { ...state.sprites, [id]: newSprite },
        activeSpriteId: id,
        nextSpriteNum: n + 1,
      };
    }

    case 'DELETE_SPRITE': {
      if (state.isRunning || Object.keys(state.sprites).length <= 1) return state;
      if (!state.sprites[action.spriteId]) return state;

      const nextSprites = { ...state.sprites };
      delete nextSprites[action.spriteId];

      const remainingKeys = Object.keys(nextSprites);
      const nextActiveId =
        state.activeSpriteId === action.spriteId
          ? remainingKeys[0]
          : state.activeSpriteId;

      return {
        ...state,
        sprites: nextSprites,
        activeSpriteId: nextActiveId,
      };
    }

    case 'UPDATE_SPRITE': {
      return withSprite(state, action.spriteId, (s) => {
        const changes = { ...action.changes };
        if (typeof changes.x === 'number') {
          changes.x = Math.max(-X_MAX, Math.min(X_MAX, changes.x));
        }
        if (typeof changes.y === 'number') {
          changes.y = Math.max(-Y_MAX, Math.min(Y_MAX, changes.y));
        }
        return { ...s, ...changes };
      });
    }

    case 'SWAP_SCRIPTS': {
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

    case 'SET_RUNNING': {
      return { ...state, isRunning: Boolean(action.isRunning) };
    }

    case 'RESET_SPRITES': {
      const resetMap = {};
      for (const id of Object.keys(state.sprites)) {
        const s = state.sprites[id];
        resetMap[id] = {
          ...s,
          x: s.initialX,
          y: s.initialY,
          angle: s.initialAngle,
          speech: null,
        };
      }
      return { ...state, isRunning: false, sprites: resetMap };
    }

    default:
      return state;
  }
}

const ScratchContext = createContext(null);

export function ScratchProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  const engineRef = useRef(null);
  if (engineRef.current === null) {
    engineRef.current = createExecutionEngine(dispatch, stateRef);
  }

  return (
    <ScratchContext.Provider value={{ state, dispatch, engine: engineRef.current }}>
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
