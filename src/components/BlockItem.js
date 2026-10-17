import React from "react";
import Icon from "./Icon";
import { useScratch } from "../state/ScratchContext";

export default function BlockItem({ block, index, spriteId, isChild = false }) {
  const { state, dispatch } = useScratch();
  const isRunning = state.isRunning;
  const p = block.params || {};

  const handleDragStart = (e) => {
    if (isRunning || isChild) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        source: "workspace",
        blockId: block.id,
        fromIndex: index,
      })
    );
  };

  const handleDropOnItem = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRunning) return;

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json") || "{}");
      if (data.source === "palette" && data.blockType) {
        dispatch({
          type: "ADD_BLOCK",
          spriteId,
          blockType: data.blockType,
          index,
        });
      } else if (data.source === "workspace" && typeof data.fromIndex === "number") {
        dispatch({
          type: "REORDER_BLOCKS",
          spriteId,
          fromIndex: data.fromIndex,
          toIndex: index,
        });
      }
    } catch (err) {
      // Ignore
    }
  };

  const handleRepeatSlotDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRunning) return;

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json") || "{}");
      if (data.source === "palette" && data.blockType) {
        dispatch({
          type: "ADD_CHILD_BLOCK",
          spriteId,
          parentBlockId: block.id,
          blockType: data.blockType,
        });
      }
    } catch (err) {
      // Ignore
    }
  };

  const handleParamChange = (field, value) => {
    dispatch({
      type: "UPDATE_BLOCK_PARAMS",
      spriteId,
      blockId: block.id,
      params: { [field]: value },
    });
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (isRunning) return;
    dispatch({
      type: "REMOVE_BLOCK",
      spriteId,
      blockId: block.id,
    });
  };

  const isMotion = ["MOVE", "TURN_CW", "TURN_CCW", "GOTO"].includes(block.type);
  const isLooks = ["SAY", "THINK"].includes(block.type);
  const isControl = block.type === "REPEAT";

  let colorClasses = "bg-blue-500 text-white";
  if (isLooks) colorClasses = "bg-purple-500 text-white";
  if (isControl) colorClasses = "bg-yellow-500 text-black";

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={handleDropOnItem}
      className="my-1.5"
    >
      <div
        draggable={!isRunning && !isChild}
        onDragStart={handleDragStart}
        className={`flex items-center flex-wrap gap-1 px-3 py-1.5 rounded text-sm font-medium select-none shadow-sm ${colorClasses} ${
          !isChild && !isRunning ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        {block.type === "MOVE" && (
          <>
            <span>Move</span>
            <input
              type="text"
              disabled={isRunning}
              value={p.steps ?? 10}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => handleParamChange("steps", e.target.value)}
              className="bg-white text-black rounded-full px-2 w-14 text-center font-bold text-xs"
            />
            <span>steps</span>
          </>
        )}

        {block.type === "TURN_CW" && (
          <>
            <span>Turn ↻</span>
            <input
              type="text"
              disabled={isRunning}
              value={p.degrees ?? 15}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => handleParamChange("degrees", e.target.value)}
              className="bg-white text-black rounded-full px-2 w-14 text-center font-bold text-xs"
            />
            <span>degrees</span>
          </>
        )}

        {block.type === "TURN_CCW" && (
          <>
            <span>Turn ↺</span>
            <input
              type="text"
              disabled={isRunning}
              value={p.degrees ?? 15}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => handleParamChange("degrees", e.target.value)}
              className="bg-white text-black rounded-full px-2 w-14 text-center font-bold text-xs"
            />
            <span>degrees</span>
          </>
        )}

        {block.type === "GOTO" && (
          <>
            <span>Go to x:</span>
            <input
              type="text"
              disabled={isRunning}
              value={p.x ?? 0}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => handleParamChange("x", e.target.value)}
              className="bg-white text-black rounded-full px-2 w-14 text-center font-bold text-xs"
            />
            <span>y:</span>
            <input
              type="text"
              disabled={isRunning}
              value={p.y ?? 0}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => handleParamChange("y", e.target.value)}
              className="bg-white text-black rounded-full px-2 w-14 text-center font-bold text-xs"
            />
          </>
        )}

        {block.type === "SAY" && (
          <>
            <span>Say</span>
            <input
              type="text"
              disabled={isRunning}
              value={p.text ?? "Hello!"}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => handleParamChange("text", e.target.value)}
              className="bg-white text-black rounded-full px-2 w-24 text-center font-bold text-xs"
            />
            <span>for</span>
            <input
              type="text"
              disabled={isRunning}
              value={p.duration ?? 2}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => handleParamChange("duration", e.target.value)}
              className="bg-white text-black rounded-full px-2 w-14 text-center font-bold text-xs"
            />
            <span>secs</span>
          </>
        )}

        {block.type === "THINK" && (
          <>
            <span>Think</span>
            <input
              type="text"
              disabled={isRunning}
              value={p.text ?? "Hmm..."}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => handleParamChange("text", e.target.value)}
              className="bg-white text-black rounded-full px-2 w-24 text-center font-bold text-xs"
            />
            <span>for</span>
            <input
              type="text"
              disabled={isRunning}
              value={p.duration ?? 2}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => handleParamChange("duration", e.target.value)}
              className="bg-white text-black rounded-full px-2 w-14 text-center font-bold text-xs"
            />
            <span>secs</span>
          </>
        )}

        {block.type === "REPEAT" && (
          <>
            <span>Repeat</span>
            <input
              type="text"
              disabled={isRunning}
              value={p.repeatCount ?? 10}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => handleParamChange("repeatCount", e.target.value)}
              className="bg-white text-black rounded-full px-2 w-14 text-center font-bold text-xs"
            />
            <span>times</span>
          </>
        )}

        {/* Trash button */}
        <button
          type="button"
          disabled={isRunning}
          onClick={handleRemove}
          title="Delete block"
          className="ml-auto p-1 text-xs opacity-75 hover:opacity-100 disabled:opacity-30"
        >
          <Icon name="trash" size={12} className="fill-current" />
        </button>
      </div>

      {/* Repeat Child Slot */}
      {block.type === "REPEAT" && (
        <div className="ml-4 pl-3 py-1 border-l-8 border-yellow-500 bg-yellow-50 rounded-r">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={handleRepeatSlotDrop}
            style={{ minHeight: 32 }}
            className="p-1 border border-dashed border-yellow-400 rounded bg-yellow-100"
          >
            {block.children && block.children.length > 0 ? (
              block.children.map((child, childIdx) => (
                <BlockItem
                  key={child.id}
                  block={child}
                  index={childIdx}
                  spriteId={spriteId}
                  isChild={true}
                />
              ))
            ) : (
              <div className="text-xs text-yellow-800 italic py-1 text-center select-none">
                Drop block inside Repeat
              </div>
            )}
          </div>
          <div className="h-3 w-16 bg-yellow-500 rounded-b" />
        </div>
      )}
    </div>
  );
}
