import React from "react";
import BlockItem from "./BlockItem";
import { useScratch } from "../state/ScratchContext";

export default function MidArea() {
  const { state, dispatch } = useScratch();
  const activeSprite = state.sprites[state.activeSpriteId];
  const script = activeSprite ? activeSprite.script : [];
  const isRunning = state.isRunning;

  const handleRootDrop = (e) => {
    e.preventDefault();
    if (isRunning) return;

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json") || "{}");
      if (data.source === "palette" && data.blockType) {
        dispatch({
          type: "ADD_BLOCK",
          spriteId: state.activeSpriteId,
          blockType: data.blockType,
        });
      } else if (data.source === "workspace" && typeof data.fromIndex === "number") {
        dispatch({
          type: "REORDER_BLOCKS",
          spriteId: state.activeSpriteId,
          fromIndex: data.fromIndex,
          toIndex: Math.max(0, script.length - 1),
        });
      }
    } catch (err) {
      // Ignore
    }
  };

  const handleClear = () => {
    if (isRunning || script.length === 0) return;
    dispatch({
      type: "CLEAR_SCRIPT",
      spriteId: state.activeSpriteId,
    });
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="h-10 border-b border-gray-200 px-4 flex items-center justify-between bg-gray-50 flex-none select-none">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Sprite:
          </span>
          <span className="text-sm font-extrabold text-gray-800">
            {activeSprite ? activeSprite.name : "None"}
          </span>
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
            {script.length} {script.length === 1 ? "block" : "blocks"}
          </span>
        </div>

        <button
          type="button"
          disabled={isRunning || script.length === 0}
          onClick={handleClear}
          className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Script List Drop Target */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={handleRootDrop}
        className="flex-1 p-4 overflow-y-auto bg-gray-50"
        style={{
          backgroundImage:
            "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {script.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 select-none">
            <p className="font-semibold text-sm text-gray-500">
              Workspace is empty for {activeSprite ? activeSprite.name : "sprite"}
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
              Drag blocks from the palette into this area to build your script
            </p>
          </div>
        ) : (
          <div className="max-w-md">
            {script.map((b, i) => (
              <BlockItem
                key={b.id}
                block={b}
                index={i}
                spriteId={state.activeSpriteId}
                isChild={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
