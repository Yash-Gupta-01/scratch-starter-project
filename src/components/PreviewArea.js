import React, { useRef, useLayoutEffect, useEffect } from "react";
import Icon from "./Icon";
import SpriteRenderer from "./SpriteRenderer";
import SpriteSelector from "./SpriteSelector";
import { useScratch, createBlockItem } from "../state/ScratchContext";
import { createExecutionEngine } from "../engine/runner";

export default function PreviewArea() {
  const { state, dispatch } = useScratch();
  const cancelRef = useRef(false);
  const stateRef = useRef(state);
  const engineRef = useRef(null);

  // Synchronize stateRef synchronously before paint/async ticks (React 17 FP standard)
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    engineRef.current = createExecutionEngine(dispatch, cancelRef, stateRef);
    return () => {
      cancelRef.current = true;
    };
  }, [dispatch]);

  const handlePlay = () => {
    if (state.isRunning || !engineRef.current) return;
    engineRef.current.start();
  };

  const handleReset = () => {
    if (!engineRef.current) return;
    engineRef.current.stop();
  };

  const handleLoadHeroDemo = () => {
    if (state.isRunning) return;
    // Set up Cat with: Repeat 10 [Move 10 steps]
    const catRepeat = createBlockItem("REPEAT", { repeatCount: 10 });
    catRepeat.children = [createBlockItem("MOVE", { steps: 10 })];

    // Set up Horse with: Repeat 10 [Move -10 steps]
    const horseRepeat = createBlockItem("REPEAT", { repeatCount: 10 });
    horseRepeat.children = [createBlockItem("MOVE", { steps: -10 })];

    // Dispatch setup to both sprites
    dispatch({ type: "CLEAR_SCRIPT", spriteId: "sprite-1" });
    dispatch({ type: "ADD_BLOCK", spriteId: "sprite-1", block: catRepeat });

    dispatch({ type: "CLEAR_SCRIPT", spriteId: "sprite-2" });
    dispatch({ type: "ADD_BLOCK", spriteId: "sprite-2", block: horseRepeat });
  };

  const spritesList = Object.values(state.sprites);

  return (
    <div className="flex-1 h-full flex flex-col p-3 bg-gray-50 overflow-y-auto">
      {/* Stage Control Bar (Play / Stop / Demo) */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center space-x-2">
          {/* Green Flag / Play */}
          <button
            type="button"
            title="Run All Scripts (Green Flag)"
            onClick={handlePlay}
            disabled={state.isRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs text-white shadow transition-transform ${
              state.isRunning
                ? "bg-green-400 opacity-60 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 active:scale-95 cursor-pointer"
            }`}
          >
            <Icon name="flag" size={15} className="fill-current text-white" />
            <span>Go (Play)</span>
          </button>

          {/* Red Stop / Reset */}
          <button
            type="button"
            title="Stop & Reset Sprites"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs text-white bg-red-600 hover:bg-red-700 active:scale-95 shadow transition-transform cursor-pointer"
          >
            <Icon name="stop" size={13} className="fill-current text-white" />
            <span>Reset</span>
          </button>
        </div>

        {/* Load Hero Demo Shortcut */}
        {!state.isRunning && (
          <button
            type="button"
            title="Auto-load Cat [Move 10] and Horse [Move -10] collision demo"
            onClick={handleLoadHeroDemo}
            className="text-xs text-purple-700 bg-purple-100 hover:bg-purple-200 border border-purple-300 font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            ⚡ Load Hero Demo
          </button>
        )}
      </div>

      {/* Stage Canvas Container (Strict 480x360 MIT Scratch Ratio) */}
      <div className="flex justify-center items-center">
        <div
          className="relative w-[480px] h-[360px] bg-white border-2 border-gray-300 rounded-xl shadow-inner overflow-hidden flex-none select-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #f3f4f6 1px, transparent 1px), linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        >
          {/* Stage Center Crosshair (0, 0) */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gray-200 pointer-events-none" />
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gray-200 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-gray-400 bg-gray-200/50 pointer-events-none" />

          {/* Render All Sprites */}
          {spritesList.map((sprite) => (
            <SpriteRenderer
              key={sprite.id}
              sprite={sprite}
              isSelected={sprite.id === state.activeSpriteId}
            />
          ))}
        </div>
      </div>

      {/* Sprites Dock & Manager (Sprint 4) */}
      <SpriteSelector />
    </div>
  );
}
