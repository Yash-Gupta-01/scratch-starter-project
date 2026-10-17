import React, { useState } from "react";
import Icon from "./Icon";
import { createBlockItem } from "../state/ScratchContext";

export default function BlockItem({
  block,
  index,
  spriteId,
  isRunning,
  parentBlockId = null,
  onUpdateParams,
  onRemove,
  onReorder,
  onAddChild,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isInnerDragOver, setIsInnerDragOver] = useState(false);

  const handleDragStart = (e) => {
    if (isRunning) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        isReorder: true,
        blockId: block.id,
        fromIndex: index,
        parentBlockId,
      })
    );
  };

  const handleDragOver = (e) => {
    if (isRunning) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    if (isRunning) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.isReorder && typeof onReorder === "function") {
        onReorder(data.fromIndex, index, data.parentBlockId, parentBlockId);
      } else if (data.isNew && data.type && typeof onAddChild === "function" && parentBlockId) {
        onAddChild(parentBlockId, createBlockItem(data.type), index);
      }
    } catch (err) {
      // Ignore invalid drag data
    }
  };

  const handleInnerDrop = (e) => {
    if (isRunning) return;
    e.preventDefault();
    e.stopPropagation();
    setIsInnerDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.isNew && data.type) {
        // Enforce 1-level cap: cannot drop Repeat inside Repeat
        if (data.type === "REPEAT") return;
        if (typeof onAddChild === "function") {
          onAddChild(block.id, createBlockItem(data.type));
        }
      }
    } catch (err) {
      // Ignore
    }
  };

  const updateField = (field, value) => {
    if (isRunning) return;
    onUpdateParams(block.id, { [field]: value });
  };

  const isMotion = ["MOVE", "TURN_CW", "TURN_CCW", "GOTO"].includes(block.type);
  const isLooks = ["SAY", "THINK"].includes(block.type);
  const isControl = block.type === "REPEAT";

  let headerColor = "bg-blue-500 hover:bg-blue-600";
  if (isLooks) headerColor = "bg-purple-500 hover:bg-purple-600";
  if (isControl) headerColor = "bg-yellow-500 hover:bg-yellow-600";

  return (
    <div
      className={`my-1 transition-all ${isDragOver ? "border-t-4 border-blue-400" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        draggable={!isRunning}
        onDragStart={handleDragStart}
        className={`flex items-center text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm cursor-grab active:cursor-grabbing ${headerColor} ${
          isRunning ? "opacity-90 cursor-not-allowed" : ""
        }`}
      >
        {/* Block Type Content */}
        <div className="flex-1 flex items-center flex-wrap gap-1.5">
          {block.type === "MOVE" && (
            <>
              <span>Move</span>
              <input
                type="number"
                disabled={isRunning}
                value={block.params.steps ?? 10}
                onChange={(e) => updateField("steps", parseInt(e.target.value, 10) || 0)}
                className="w-14 bg-white text-gray-800 text-center font-bold text-xs rounded-full px-1.5 py-0.5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:opacity-75"
              />
              <span>steps</span>
            </>
          )}

          {block.type === "TURN_CW" && (
            <>
              <span>Turn</span>
              <Icon name="redo" size={14} className="text-white mx-0.5 inline" />
              <input
                type="number"
                disabled={isRunning}
                value={block.params.degrees ?? 15}
                onChange={(e) => updateField("degrees", parseInt(e.target.value, 10) || 0)}
                className="w-14 bg-white text-gray-800 text-center font-bold text-xs rounded-full px-1.5 py-0.5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:opacity-75"
              />
              <span>degrees</span>
            </>
          )}

          {block.type === "TURN_CCW" && (
            <>
              <span>Turn</span>
              <Icon name="undo" size={14} className="text-white mx-0.5 inline" />
              <input
                type="number"
                disabled={isRunning}
                value={block.params.degrees ?? 15}
                onChange={(e) => updateField("degrees", parseInt(e.target.value, 10) || 0)}
                className="w-14 bg-white text-gray-800 text-center font-bold text-xs rounded-full px-1.5 py-0.5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:opacity-75"
              />
              <span>degrees</span>
            </>
          )}

          {block.type === "GOTO" && (
            <>
              <span>Go to x:</span>
              <input
                type="number"
                disabled={isRunning}
                value={block.params.x ?? 0}
                onChange={(e) => updateField("x", parseInt(e.target.value, 10) || 0)}
                className="w-12 bg-white text-gray-800 text-center font-bold text-xs rounded-full px-1.5 py-0.5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:opacity-75"
              />
              <span>y:</span>
              <input
                type="number"
                disabled={isRunning}
                value={block.params.y ?? 0}
                onChange={(e) => updateField("y", parseInt(e.target.value, 10) || 0)}
                className="w-12 bg-white text-gray-800 text-center font-bold text-xs rounded-full px-1.5 py-0.5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:opacity-75"
              />
            </>
          )}

          {block.type === "SAY" && (
            <>
              <span>Say</span>
              <input
                type="text"
                disabled={isRunning}
                value={block.params.text ?? "Hello!"}
                onChange={(e) => updateField("text", e.target.value)}
                className="w-24 bg-white text-gray-800 text-center font-bold text-xs rounded-full px-2 py-0.5 shadow-inner focus:outline-none focus:ring-1 focus:ring-purple-300 disabled:opacity-75"
              />
              <span>for</span>
              <input
                type="number"
                min="0.5"
                step="0.5"
                disabled={isRunning}
                value={block.params.duration ?? 2}
                onChange={(e) => updateField("duration", parseFloat(e.target.value) || 1)}
                className="w-12 bg-white text-gray-800 text-center font-bold text-xs rounded-full px-1 py-0.5 shadow-inner focus:outline-none focus:ring-1 focus:ring-purple-300 disabled:opacity-75"
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
                value={block.params.text ?? "Hmm..."}
                onChange={(e) => updateField("text", e.target.value)}
                className="w-24 bg-white text-gray-800 text-center font-bold text-xs rounded-full px-2 py-0.5 shadow-inner focus:outline-none focus:ring-1 focus:ring-purple-300 disabled:opacity-75"
              />
              <span>for</span>
              <input
                type="number"
                min="0.5"
                step="0.5"
                disabled={isRunning}
                value={block.params.duration ?? 2}
                onChange={(e) => updateField("duration", parseFloat(e.target.value) || 1)}
                className="w-12 bg-white text-gray-800 text-center font-bold text-xs rounded-full px-1 py-0.5 shadow-inner focus:outline-none focus:ring-1 focus:ring-purple-300 disabled:opacity-75"
              />
              <span>secs</span>
            </>
          )}

          {block.type === "REPEAT" && (
            <>
              <span>Repeat</span>
              <input
                type="number"
                min="1"
                disabled={isRunning}
                value={block.params.repeatCount ?? 10}
                onChange={(e) => updateField("repeatCount", Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-14 bg-white text-gray-800 text-center font-bold text-xs rounded-full px-1.5 py-0.5 shadow-inner focus:outline-none focus:ring-1 focus:ring-yellow-300 disabled:opacity-75"
              />
              <span>times</span>
            </>
          )}
        </div>

        {/* Delete Block Button */}
        {!isRunning && (
          <button
            type="button"
            title="Delete Block"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(block.id);
            }}
            className="ml-2 text-white/80 hover:text-white hover:bg-black/20 p-1 rounded transition-colors"
          >
            <Icon name="trash" size={13} className="text-white fill-current" />
          </button>
        )}
      </div>

      {/* Repeat Block Nested Container */}
      {block.type === "REPEAT" && (
        <div className="ml-4 pl-3 py-1 my-0.5 border-l-8 border-yellow-500 bg-yellow-50/40 rounded-r-lg">
          <div
            className={`min-h-[36px] rounded p-1 transition-colors ${
              isInnerDragOver ? "bg-yellow-100 border border-dashed border-yellow-400" : ""
            }`}
            onDragOver={(e) => {
              if (isRunning) return;
              e.preventDefault();
              e.stopPropagation();
              setIsInnerDragOver(true);
            }}
            onDragLeave={(e) => {
              e.stopPropagation();
              setIsInnerDragOver(false);
            }}
            onDrop={handleInnerDrop}
          >
            {block.children && block.children.length > 0 ? (
              block.children.map((childBlock, childIndex) => (
                <BlockItem
                  key={childBlock.id}
                  block={childBlock}
                  index={childIndex}
                  spriteId={spriteId}
                  isRunning={isRunning}
                  parentBlockId={block.id}
                  onUpdateParams={onUpdateParams}
                  onRemove={onRemove}
                  onReorder={onReorder}
                  onAddChild={onAddChild}
                />
              ))
            ) : (
              <div className="text-xs text-yellow-700 italic py-1 px-2 border border-dashed border-yellow-300 rounded text-center">
                Drag blocks here to repeat
              </div>
            )}
          </div>
          {/* Bottom shelf of Repeat block */}
          <div className="h-3 w-16 bg-yellow-500 rounded-b-md" />
        </div>
      )}
    </div>
  );
}
