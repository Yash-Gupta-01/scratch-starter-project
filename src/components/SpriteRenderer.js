import React from "react";
import CatSprite from "./CatSprite";
import HorseSprite from "./HorseSprite";

const STAGE_W = 480;
const STAGE_H = 360;
const SPRITE_W = 60;
const SPRITE_H = 60;

export const toScreenX = (x) => Math.round(STAGE_W / 2 + x - SPRITE_W / 2);
export const toScreenY = (y) => Math.round(STAGE_H / 2 - y - SPRITE_H / 2); // Scratch +y is UP

export default function SpriteRenderer({ sprite, isSelected = false }) {
  const screenX = toScreenX(sprite.x);
  const screenY = toScreenY(sprite.y);

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none select-none"
      style={{
        width: `${SPRITE_W}px`,
        height: `${SPRITE_H}px`,
        transform: `translate3d(${screenX}px, ${screenY}px, 0)`,
        transition: "transform 0.15s ease-out",
        zIndex: isSelected ? 20 : 10,
      }}
    >
      {/* Speech / Thought Bubble (Unrotated: sits directly on outer wrapper) */}
      {sprite.speech && (
        <div
          className="absolute bottom-[66px] left-1/2 transform -translate-x-1/2 pointer-events-none z-30"
          style={{ minWidth: "60px", maxWidth: "160px" }}
        >
          {sprite.speech.type === "say" ? (
            <div className="relative bg-white text-gray-900 border border-gray-400 rounded-2xl px-3 py-1.5 text-xs font-bold shadow-lg text-center leading-snug">
              <span>{sprite.speech.text}</span>
              {/* Comic Speech Pointer Triangle */}
              <div
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white"
                style={{ filter: "drop-shadow(0 1px 0 #9ca3af)" }}
              />
            </div>
          ) : (
            <div className="relative bg-white text-gray-900 border border-gray-400 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg text-center leading-snug">
              <span>{sprite.speech.text}</span>
              {/* Cloud Thought Small Trailing Circles */}
              <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-0.5">
                <span className="w-2 h-2 rounded-full bg-white border border-gray-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-white border border-gray-400 -mt-0.5" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inner Avatar Container (Handles Rotation Only) */}
      <div
        className={`w-full h-full flex items-center justify-center transition-transform duration-150 ${
          isSelected ? "filter drop-shadow-[0_0_6px_rgba(59,130,246,0.7)]" : ""
        }`}
        style={{
          transform: `rotate(${sprite.angle}deg)`,
          transformOrigin: "center center",
        }}
      >
        {sprite.avatar === "horse" ? (
          <HorseSprite className="w-full h-full object-contain" />
        ) : (
          <CatSprite />
        )}
      </div>
    </div>
  );
}
