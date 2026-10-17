import React from "react";
import Icon from "./Icon";
import SpriteRenderer from "./SpriteRenderer";
import SpriteSelector from "./SpriteSelector";
import { useScratch } from "../state/ScratchContext";

export default function PreviewArea() {
  const { state, dispatch, engine } = useScratch();
  const isRunning = state.isRunning;

  const handlePlay = () => {
    if (isRunning || !engine) return;
    engine.start();
  };

  const handleStop = () => {
    if (!engine) return;
    engine.stop();
  };

  const handleLoadHeroDemo = () => {
    if (isRunning) return;
    // Step 1: Clear scripts
    dispatch({ type: "CLEAR_SCRIPT", spriteId: "sprite-1" });
    dispatch({ type: "CLEAR_SCRIPT", spriteId: "sprite-2" });

    // Step 2: Cat gets Repeat 10 [Move 10]
    const catRepeatNum = state.nextBlockNum;
    dispatch({ type: "ADD_BLOCK", spriteId: "sprite-1", blockType: "REPEAT" });
    dispatch({
      type: "ADD_CHILD_BLOCK",
      spriteId: "sprite-1",
      parentBlockId: `blk-${catRepeatNum}`,
      blockType: "MOVE",
    });

    // Step 3: Horse gets Repeat 10 [Move -10]
    const horseRepeatNum = catRepeatNum + 2;
    const horseMoveNum = catRepeatNum + 3;
    dispatch({ type: "ADD_BLOCK", spriteId: "sprite-2", blockType: "REPEAT" });
    dispatch({
      type: "ADD_CHILD_BLOCK",
      spriteId: "sprite-2",
      parentBlockId: `blk-${horseRepeatNum}`,
      blockType: "MOVE",
    });
    dispatch({
      type: "UPDATE_BLOCK_PARAMS",
      spriteId: "sprite-2",
      blockId: `blk-${horseMoveNum}`,
      params: { steps: -10 },
    });
  };

  const spritesList = Object.values(state.sprites);

  return (
    <div className="flex-1 h-full flex flex-col p-3 bg-gray-50 overflow-y-auto">
      {/* Stage Controls */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center space-x-2">
          {/* Green Flag Play */}
          <button
            type="button"
            title="Run All Scripts"
            onClick={handlePlay}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-xs text-white shadow ${
              isRunning
                ? "bg-green-400 opacity-60 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 cursor-pointer"
            }`}
          >
            <Icon name="flag" size={15} className="fill-current text-white" />
            <span>Go</span>
          </button>

          {/* Red Stop */}
          <button
            type="button"
            title="Stop & Reset"
            onClick={handleStop}
            disabled={!isRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-xs text-white shadow ${
              !isRunning
                ? "bg-red-400 opacity-60 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 cursor-pointer"
            }`}
          >
            <Icon name="stop" size={13} className="fill-current text-white" />
            <span>Stop</span>
          </button>
        </div>

        {/* Quick Hero Setup Button */}
        {!isRunning && (
          <button
            type="button"
            title="Auto-load Cat [Move 10] and Horse [Move -10] collision demo"
            onClick={handleLoadHeroDemo}
            className="text-xs text-purple-700 bg-purple-100 hover:bg-purple-200 border border-purple-300 font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer"
          >
            ⚡ Load Hero Demo
          </button>
        )}
      </div>

      {/* Stage Canvas (Strict inline styles per AGENTS §10) */}
      <div className="flex justify-center items-center">
        <div
          style={{ width: 480, height: 360, position: "relative", overflow: "hidden" }}
          className="bg-white border-2 border-gray-300 rounded shadow-inner flex-none select-none"
        >
          {/* Stage Center Crosshair (0, 0) */}
          <div style={{ height: 1 }} className="absolute top-1/2 left-0 right-0 bg-gray-200 pointer-events-none" />
          <div style={{ width: 1 }} className="absolute left-1/2 top-0 bottom-0 bg-gray-200 pointer-events-none" />

          {/* Sprites */}
          {spritesList.map((sprite) => (
            <SpriteRenderer key={sprite.id} sprite={sprite} />
          ))}
        </div>
      </div>

      {/* Sprite Selector Dock */}
      <SpriteSelector />
    </div>
  );
}
