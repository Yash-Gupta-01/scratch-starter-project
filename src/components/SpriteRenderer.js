import React from "react";
import CatSprite from "./CatSprite";
import HorseSprite from "./HorseSprite";
import { STAGE_W, STAGE_H, SPRITE_W, SPRITE_H } from "../state/ScratchContext";

const toScreenX = (x) => Math.round(STAGE_W / 2 + x - SPRITE_W / 2);
const toScreenY = (y) => Math.round(STAGE_H / 2 - y - SPRITE_H / 2); // +y is UP in Scratch

function Bubble({ text, type }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 65,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#ffffff",
        color: "#111827",
        fontSize: 12,
        maxWidth: 140,
        whiteSpace: "nowrap",
        padding: "4px 8px",
        borderRadius: type === "say" ? 8 : 14,
        border: "1px solid #d1d5db",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      <span>{text}</span>
      {type === "say" ? (
        <div
          style={{
            position: "absolute",
            bottom: -6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "6px solid #ffffff",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            bottom: -8,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#ffffff",
              border: "1px solid #d1d5db",
            }}
          />
          <div
            style={{
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "#ffffff",
              border: "1px solid #d1d5db",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function SpriteRenderer({ sprite }) {
  const { x, y, angle, avatar, speech } = sprite;

  return (
    <div
      style={{
        position: "absolute",
        width: SPRITE_W,
        height: SPRITE_H,
        transform: `translate3d(${toScreenX(x)}px, ${toScreenY(y)}px, 0)`,
        transition: "transform 0.15s ease-out",
      }}
    >
      {speech && <Bubble {...speech} />} {/* on the UNROTATED wrapper */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `rotate(${angle}deg)`,
          transition: "transform 0.15s ease-out",
          transformOrigin: "50% 50%",
        }}
      >
        {avatar === "cat" ? <CatSprite /> : <HorseSprite />}
      </div>
    </div>
  );
}
