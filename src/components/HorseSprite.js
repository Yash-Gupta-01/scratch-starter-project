import React from "react";

export default function HorseSprite({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      className={className}
    >
      {/* Scratch-styled friendly Horse avatar */}
      <g stroke="#001026" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        {/* Tail */}
        <path
          d="M18 65 C10 68 8 82 14 88 C16 80 20 74 24 70 Z"
          fill="#5D4037"
        />

        {/* Hind Legs */}
        <path d="M25 65 L22 92 L28 92 L31 68 Z" fill="#8D6E63" />
        <path d="M22 88 L22 92 L28 92 L28 88 Z" fill="#2E1C14" /> {/* Hoof */}
        <path d="M33 65 L32 90 L38 90 L40 65 Z" fill="#795548" />
        <path d="M32 86 L32 90 L38 90 L38 86 Z" fill="#2E1C14" />

        {/* Body */}
        <path
          d="M22 48 C22 40 38 42 58 45 C68 47 72 52 70 65 C68 72 56 74 38 72 C26 70 22 60 22 48 Z"
          fill="#8D6E63"
        />

        {/* Forelegs */}
        <path d="M58 64 L56 92 L62 92 L65 65 Z" fill="#795548" />
        <path d="M56 88 L56 92 L62 92 L62 88 Z" fill="#2E1C14" />
        <path d="M68 62 L69 90 L75 90 L74 62 Z" fill="#8D6E63" />
        <path d="M69 86 L69 90 L75 90 L75 86 Z" fill="#2E1C14" />

        {/* Neck */}
        <path
          d="M56 46 L70 24 C74 25 78 30 80 38 L68 55 Z"
          fill="#8D6E63"
        />

        {/* Mane */}
        <path
          d="M58 42 C54 35 60 24 68 20 C66 26 64 34 68 38 C64 42 62 46 64 50 Z"
          fill="#4E342E"
        />

        {/* Head */}
        <path
          d="M68 24 L78 12 C82 14 88 17 92 24 C94 28 88 34 82 35 L70 32 Z"
          fill="#8D6E63"
        />

        {/* Muzzle / Nose */}
        <path
          d="M86 20 C90 22 93 26 91 30 C87 33 84 31 82 28 Z"
          fill="#D7CCC8"
        />
        <circle cx="88" cy="25" r="1.2" fill="#2E1C14" />

        {/* Ear */}
        <path d="M72 18 L76 9 L80 15 Z" fill="#795548" />

        {/* Eye (Scratch cartoon eye) */}
        <ellipse cx="78" cy="20" rx="4" ry="4.5" fill="#FFFFFF" />
        <circle cx="79.5" cy="19.5" r="2.2" fill="#001026" />
        <circle cx="80.5" cy="18.5" r="0.8" fill="#FFFFFF" />

        {/* Gentle smile */}
        <path d="M84 28 Q87 30 89 28" fill="none" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
