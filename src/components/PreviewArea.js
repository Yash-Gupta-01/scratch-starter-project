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

  const spritesList = Object.values(state.sprites);
  const hasMoved = spritesList.some(
    (s) =>
      s.x !== s.initialX ||
      s.y !== s.initialY ||
      s.angle !== s.initialAngle ||
      s.speech !== null
  );

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
            title="Stop Execution"
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

          {/* Reset Button (shows up when sprites have moved, disappears on reset) */}
          {!isRunning && hasMoved && (
            <button
              type="button"
              aria-label="Reset stage"
              title="Reset Sprites to Starting Positions"
              onClick={() => dispatch({ type: "RESET_SPRITES" })}
              style={{ minHeight: 32 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow cursor-pointer transition-colors"
            >
              <Icon name="undo" size={12} className="fill-current text-white" />
              <span>Reset</span>
            </button>
          )}
        </div>

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
