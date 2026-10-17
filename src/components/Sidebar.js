import React, { useState } from "react";
import Icon from "./Icon";
import { useScratch } from "../state/ScratchContext";

export default function Sidebar() {
  const { state, dispatch } = useScratch();
  const [isDragOverTrash, setIsDragOverTrash] = useState(false);
  const isRunning = state.isRunning;

  const handlePaletteDragStart = (e, blockType) => {
    if (isRunning) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ source: "palette", blockType })
    );
  };

  const handleSidebarDragOver = (e) => {
    if (isRunning) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOverTrash(true);
  };

  const handleSidebarDragLeave = () => {
    setIsDragOverTrash(false);
  };

  const handleSidebarDrop = (e) => {
    if (isRunning) return;
    e.preventDefault();
    setIsDragOverTrash(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json") || "{}");
      if (data.source === "workspace" && data.blockId) {
        dispatch({
          type: "REMOVE_BLOCK",
          spriteId: state.activeSpriteId,
          blockId: data.blockId,
        });
      }
    } catch (err) {
      // Ignore
    }
  };

  return (
    <div
      onDragOver={handleSidebarDragOver}
      onDragLeave={handleSidebarDragLeave}
      onDrop={handleSidebarDrop}
      className={`w-60 flex-none h-full overflow-y-auto flex flex-col p-2 border-r border-gray-200 bg-gray-50 transition-colors ${
        isDragOverTrash ? "bg-red-50 border-r-2 border-red-400" : ""
      }`}
    >
      {isDragOverTrash && (
        <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
          <Icon name="trash" size={14} className="fill-current text-red-600" />
          <span>Drop to delete block</span>
        </div>
      )}

      {/* Motion */}
      <div className="font-bold text-sm text-gray-700 mt-1 mb-1">Motion</div>

      <div
        draggable={!isRunning}
        onDragStart={(e) => handlePaletteDragStart(e, "MOVE")}
        className="flex flex-row flex-wrap bg-blue-500 text-white px-3 py-1.5 my-1 text-sm rounded cursor-pointer select-none"
      >
        <span>Move 10 steps</span>
      </div>

      <div
        draggable={!isRunning}
        onDragStart={(e) => handlePaletteDragStart(e, "TURN_CW")}
        className="flex flex-row flex-wrap bg-blue-500 text-white px-3 py-1.5 my-1 text-sm rounded cursor-pointer select-none"
      >
        <span>Turn ↻ 15 degrees</span>
      </div>

      <div
        draggable={!isRunning}
        onDragStart={(e) => handlePaletteDragStart(e, "TURN_CCW")}
        className="flex flex-row flex-wrap bg-blue-500 text-white px-3 py-1.5 my-1 text-sm rounded cursor-pointer select-none"
      >
        <span>Turn ↺ 15 degrees</span>
      </div>

      <div
        draggable={!isRunning}
        onDragStart={(e) => handlePaletteDragStart(e, "GOTO")}
        className="flex flex-row flex-wrap bg-blue-500 text-white px-3 py-1.5 my-1 text-sm rounded cursor-pointer select-none"
      >
        <span>Go to x: 0 y: 0</span>
      </div>

      {/* Control */}
      <div className="font-bold text-sm text-gray-700 mt-3 mb-1">Control</div>

      <div
        draggable={!isRunning}
        onDragStart={(e) => handlePaletteDragStart(e, "REPEAT")}
        className="flex flex-row flex-wrap bg-yellow-500 text-black px-3 py-1.5 my-1 text-sm font-medium rounded cursor-pointer select-none"
      >
        <span>Repeat 10 times</span>
      </div>

      {/* Looks */}
      <div className="font-bold text-sm text-gray-700 mt-3 mb-1">Looks</div>

      <div
        draggable={!isRunning}
        onDragStart={(e) => handlePaletteDragStart(e, "SAY")}
        className="flex flex-row flex-wrap bg-purple-500 text-white px-3 py-1.5 my-1 text-sm rounded cursor-pointer select-none"
      >
        <span>Say Hello! for 2 secs</span>
      </div>

      <div
        draggable={!isRunning}
        onDragStart={(e) => handlePaletteDragStart(e, "THINK")}
        className="flex flex-row flex-wrap bg-purple-500 text-white px-3 py-1.5 my-1 text-sm rounded cursor-pointer select-none"
      >
        <span>Think Hmm... for 2 secs</span>
      </div>
    </div>
  );
}
