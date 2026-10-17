import React, { useState } from "react";
import Icon from "./Icon";
import { useScratch } from "../state/ScratchContext";

export default function Sidebar() {
  const { state, dispatch } = useScratch();
  const [isDragOverTrash, setIsDragOverTrash] = useState(false);
  const isRunning = state.isRunning;

  const handlePaletteDragStart = (e, type) => {
    if (isRunning) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type, isNew: true })
    );
  };

  const handleSidebarDragOver = (e) => {
    if (isRunning) return;
    e.preventDefault();
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
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.isReorder && data.blockId) {
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
      className={`w-64 flex-none h-full overflow-y-auto flex flex-col p-3 border-r border-gray-200 bg-gray-50 transition-colors ${
        isDragOverTrash ? "bg-red-50 border-r-2 border-red-400" : ""
      }`}
    >
      {/* Drop-to-delete banner indicator */}
      {isDragOverTrash && (
        <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
          <Icon name="trash" size={14} className="fill-current text-red-600" />
          <span>Drop block here to delete</span>
        </div>
      )}

      {/* MOTION CATEGORY */}
      <div className="font-extrabold text-xs uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
        <span>Motion</span>
      </div>

      <div
        draggable={!isRunning}
        onDragStart={(e) => handlePaletteDragStart(e, "MOVE")}
        className={`flex items-center bg-blue-500 text-white px-3 py-1.5 my-1 text-sm font-medium rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-blue-600 transition-colors ${
          isRunning ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span>Move 10 steps</span>
      </div>

      <div
        draggable={!isRunning}
        onDragStart={(e) => handlePaletteDragStart(e, "TURN_CW")}
        className={`flex items-center bg-blue-500 text-white px-3 py-1.5 my-1 text-sm font-medium rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-blue-600 transition-colors ${
          isRunning ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span>Turn</span>
        <Icon name="redo" size={14} className="text-white mx-1.5 inline fill-current" />
        <span>15 degrees</span>
      </div>

      <div
        draggable={!isRunning}
        onDragStart={(e) => handlePaletteDragStart(e, "TURN_CCW")}
        className={`flex items-center bg-blue-500 text-white px-3 py-1.5 my-1 text-sm font-medium rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-blue-600 transition-colors ${
          isRunning ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span>Turn</span>
        <Icon name="undo" size={14} className="text-white mx-1.5 inline fill-current" />
        <span>15 degrees</span>
      </div>

      <div
        draggable={!isRunning}
        onDragStart={(e) => handlePaletteDragStart(e, "GOTO")}
        className={`flex items-center bg-blue-500 text-white px-3 py-1.5 my-1 text-sm font-medium rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-blue-600 transition-colors ${
          isRunning ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span>Go to x: 0 y: 0</span>
      </div>

      {/* LOOKS CATEGORY */}
      <div className="font-extrabold text-xs uppercase tracking-wider text-purple-700 mt-4 mb-2 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
        <span>Looks</span>
      </div>

      <div
        draggable={!isRunning}
        onDragStart={(e) => handlePaletteDragStart(e, "SAY")}
        className={`flex items-center bg-purple-500 text-white px-3 py-1.5 my-1 text-sm font-medium rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-purple-600 transition-colors ${
          isRunning ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span>Say Hello! for 2 secs</span>
      </div>

      <div
        draggable={!isRunning}
        onDragStart={(e) => handlePaletteDragStart(e, "THINK")}
        className={`flex items-center bg-purple-500 text-white px-3 py-1.5 my-1 text-sm font-medium rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-purple-600 transition-colors ${
          isRunning ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span>Think Hmm... for 2 secs</span>
      </div>

      {/* CONTROL CATEGORY */}
      <div className="font-extrabold text-xs uppercase tracking-wider text-yellow-700 mt-4 mb-2 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
        <span>Control</span>
      </div>

      <div
        draggable={!isRunning}
        onDragStart={(e) => handlePaletteDragStart(e, "REPEAT")}
        className={`flex items-center bg-yellow-500 text-white px-3 py-1.5 my-1 text-sm font-medium rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-yellow-600 transition-colors ${
          isRunning ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span>Repeat 10</span>
      </div>

      {/* Footer Hint */}
      <div className="mt-auto pt-4 border-t border-gray-200 text-xs text-gray-400">
        <p>Drag blocks into the workspace to build scripts.</p>
        <p className="mt-1">Drag workspace blocks here to delete.</p>
      </div>
    </div>
  );
}
