import React from "react";
import Sidebar from "./components/Sidebar";
import MidArea from "./components/MidArea";
import PreviewArea from "./components/PreviewArea";
import { ScratchProvider } from "./state/ScratchContext";

export default function App() {
  return (
    <ScratchProvider>
      <div className="bg-blue-50 font-sans flex flex-col h-screen overflow-hidden select-none">
        {/* Top Navigation Bar */}
        <header className="bg-purple-600 text-white px-4 py-2 flex items-center justify-between shadow flex-none h-12">
          <div className="flex items-center space-x-3">
            <span className="font-extrabold text-xl tracking-wide bg-yellow-400 text-purple-900 px-2 py-0.5 rounded font-mono shadow-sm">
              Scratch
            </span>
            <span className="text-sm font-medium text-purple-100 hidden sm:inline">
              Visual Coding Playground
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-purple-200">
            <span className="bg-purple-700 px-2.5 py-1 rounded-full font-semibold text-white">
              React 17 + FP
            </span>
          </div>
        </header>

        {/* Main Work Area */}
        <div className="flex-1 flex flex-row overflow-hidden p-2 gap-2">
          {/* Left + Mid: Sidebar Palette & Workspace */}
          <div className="flex-1 flex flex-row bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <Sidebar />
            <MidArea />
          </div>

          {/* Right: Stage Canvas & Sprite Manager */}
          <div className="w-1/3 min-w-[500px] flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <PreviewArea />
          </div>
        </div>
      </div>
    </ScratchProvider>
  );
}
