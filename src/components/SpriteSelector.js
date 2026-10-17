import React from "react";
import CatSprite from "./CatSprite";
import HorseSprite from "./HorseSprite";
import Icon from "./Icon";
import { useScratch } from "../state/ScratchContext";

export default function SpriteSelector() {
  const { state, dispatch } = useScratch();
  const spritesList = Object.values(state.sprites);
  const isRunning = state.isRunning;

  const handleSelect = (id) => {
    dispatch({ type: "SELECT_SPRITE", spriteId: id });
  };

  const handleAddSprite = () => {
    if (isRunning) return;
    dispatch({ type: "ADD_SPRITE" });
  };

  const handleDeleteSprite = (e, id) => {
    e.stopPropagation();
    if (isRunning || spritesList.length <= 1) return;
    dispatch({ type: "DELETE_SPRITE", spriteId: id });
  };

  return (
    <div className="mt-3 bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100">
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
            Sprites Dock
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
            {spritesList.length}
          </span>
        </div>

        {/* Add Sprite Button */}
        <button
          type="button"
          disabled={isRunning}
          onClick={handleAddSprite}
          title="Add a new sprite"
          className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name="plus" size={11} className="fill-current text-blue-600" />
          <span>Add Sprite</span>
        </button>
      </div>

      {/* Sprites Card List */}
      <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-0.5">
        {spritesList.map((sprite) => {
          const isSelected = sprite.id === state.activeSpriteId;

          return (
            <div
              key={sprite.id}
              onClick={() => handleSelect(sprite.id)}
              className={`relative flex items-center p-2 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? "bg-blue-50 border-2 border-blue-500 shadow-sm"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 flex-none bg-white border border-gray-200 rounded p-1 flex items-center justify-center mr-2 shadow-inner">
                {sprite.avatar === "horse" ? (
                  <HorseSprite className="w-full h-full object-contain" />
                ) : (
                  <CatSprite />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-gray-800 truncate">
                  {sprite.name}
                </p>
                <p style={{ fontSize: 10 }} className="text-gray-500 font-mono">
                  x: {Math.round(sprite.x)}, y: {Math.round(sprite.y)}
                </p>
                <p style={{ fontSize: 10 }} className="text-gray-400">
                  {sprite.script.length} {sprite.script.length === 1 ? "block" : "blocks"}
                </p>
              </div>

              {/* Delete Button (×) */}
              {!isRunning && spritesList.length > 1 && (
                <button
                  type="button"
                  title={`Delete ${sprite.name}`}
                  onClick={(e) => handleDeleteSprite(e, sprite.id)}
                  className="absolute top-1 right-1 text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                >
                  <Icon name="times" size={10} className="fill-current" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
