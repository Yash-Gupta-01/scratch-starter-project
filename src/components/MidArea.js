import React, { useState } from "react";
import BlockItem from "./BlockItem";
import Icon from "./Icon";
import { useScratch, createBlockItem } from "../state/ScratchContext";

export default function MidArea() {
  const { state, dispatch } = useScratch();
  const [isDragOver, setIsDragOver] = useState(false);

  const activeSprite = state.sprites[state.activeSpriteId];
  const script = activeSprite ? activeSprite.script : [];
  const isRunning = state.isRunning;

  const handleDragOver = (e) => {
    if (isRunning) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    if (isRunning) return;
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.isNew && data.type) {
        dispatch({
          type: "ADD_BLOCK",
          spriteId: state.activeSpriteId,
          block: createBlockItem(data.type),
        });
      }
    } catch (err) {
      // Ignore
    }
  };

  const handleUpdateParams = (blockId, params) => {
    dispatch({
      type: "UPDATE_BLOCK_PARAMS",
      spriteId: state.activeSpriteId,
      blockId,
      params,
    });
  };

  const handleRemoveBlock = (blockId) => {
    dispatch({
      type: "REMOVE_BLOCK",
      spriteId: state.activeSpriteId,
      blockId,
    });
  };

  const handleReorder = (fromIndex, toIndex, fromParentId, toParentId) => {
    // Only support reordering within the same parent level
    if (fromParentId === toParentId && !fromParentId) {
      dispatch({
        type: "REORDER_BLOCKS",
        spriteId: state.activeSpriteId,
        fromIndex,
        toIndex,
      });
    }
  };

  const handleAddChild = (parentBlockId, block, index) => {
    dispatch({
      type: "ADD_CHILD_BLOCK",
      spriteId: state.activeSpriteId,
      parentBlockId,
      block,
      index,
    });
  };

  const handleClearScript = () => {
    if (isRunning || script.length === 0) return;
    dispatch({
      type: "CLEAR_SCRIPT",
      spriteId: state.activeSpriteId,
    });
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-white overflow-hidden">
      {/* Workspace Header */}
      <div className="h-10 border-b border-gray-200 px-4 flex items-center justify-between bg-gray-50 flex-none">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Workspace:
          </span>
          <span className="text-sm font-extrabold text-gray-800">
            {activeSprite ? activeSprite.name : "No Sprite"}
          </span>
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
            {script.length} {script.length === 1 ? "block" : "blocks"}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {isRunning && (
            <span className="text-xs font-bold text-green-600 bg-green-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Running... (Editing Locked)
            </span>
          )}
          <button
            type="button"
            disabled={isRunning || script.length === 0}
            onClick={handleClearScript}
            className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Clear Script
          </button>
        </div>
      </div>

      {/* Script Canvas Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 p-4 overflow-y-auto relative transition-colors ${
          isDragOver ? "bg-blue-50/60 ring-2 ring-blue-300 ring-inset" : "bg-gray-50/30"
        }`}
        style={{
          backgroundImage:
            "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {script.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 select-none">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2 border border-gray-200">
              <Icon name="play" size={24} className="fill-current text-gray-300 ml-1" />
            </div>
            <p className="font-semibold text-sm text-gray-500">
              Script area is empty for {activeSprite ? activeSprite.name : "sprite"}
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
              Drag and drop blocks from the left palette to program actions
            </p>
          </div>
        ) : (
          <div className="max-w-md">
            {script.map((block, index) => (
              <BlockItem
                key={block.id}
                block={block}
                index={index}
                spriteId={state.activeSpriteId}
                isRunning={isRunning}
                onUpdateParams={handleUpdateParams}
                onRemove={handleRemoveBlock}
                onReorder={handleReorder}
                onAddChild={handleAddChild}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
