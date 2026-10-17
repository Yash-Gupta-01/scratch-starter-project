import React, { useState, useEffect } from "react";
import Icon from "./Icon";
import { useScratch } from "../state/ScratchContext";

function ParamInput({
  field,
  defaultValue,
  value,
  isWide = false,
  isRunning,
  onChangeParam,
}) {
  const isNumeric = field !== "text";
  const [localVal, setLocalVal] = useState(String(value ?? defaultValue));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setLocalVal(String(value ?? defaultValue));
    setHasError(false);
  }, [value, defaultValue]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalVal(val);

    if (isNumeric) {
      if (val === "" || val === "-") {
        setHasError(false);
        return;
      }
      if (Number.isNaN(Number(val))) {
        setHasError(true);
        return;
      }
      setHasError(false);
      onChangeParam(field, Number(val));
    } else {
      onChangeParam(field, val);
    }
  };

  const handleBlur = () => {
    if (isNumeric) {
      if (localVal === "" || localVal === "-" || Number.isNaN(Number(localVal))) {
        const fallback = Number(localVal) || 0;
        setLocalVal(String(fallback));
        setHasError(false);
        onChangeParam(field, fallback);
      }
    }
  };

  const widthClass = isWide ? "w-24" : "w-14";
  const errorClass = hasError
    ? "border-2 border-red-500 bg-red-50 text-red-700"
    : "border border-transparent";

  return (
    <input
      type="text"
      disabled={isRunning}
      value={localVal}
      title={hasError ? "Please enter a valid number" : undefined}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`bg-white text-black rounded-full px-2 ${widthClass} text-center font-bold text-xs outline-none ${errorClass}`}
    />
  );
}

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

  const isLooks = ["SAY", "THINK"].includes(block.type);
  const isControl = block.type === "REPEAT";

  let colorClasses = "bg-blue-500 text-white";
  if (isLooks) colorClasses = "bg-purple-500 text-white";
  if (isControl) colorClasses = "bg-yellow-500 text-black";

  const renderParamInput = (field, defaultValue, isWide = false) => (
    <ParamInput
      field={field}
      defaultValue={defaultValue}
      value={p[field]}
      isWide={isWide}
      isRunning={isRunning}
      onChangeParam={handleParamChange}
    />
  );

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
            {renderParamInput("steps", 10)}
            <span>steps</span>
          </>
        )}

        {block.type === "TURN_CW" && (
          <>
            <span>Turn ↻</span>
            {renderParamInput("degrees", 15)}
            <span>degrees</span>
          </>
        )}

        {block.type === "TURN_CCW" && (
          <>
            <span>Turn ↺</span>
            {renderParamInput("degrees", 15)}
            <span>degrees</span>
          </>
        )}

        {block.type === "GOTO" && (
          <>
            <span>Go to x:</span>
            {renderParamInput("x", 0)}
            <span>y:</span>
            {renderParamInput("y", 0)}
          </>
        )}

        {block.type === "SAY" && (
          <>
            <span>Say</span>
            {renderParamInput("text", "Hello!", true)}
            <span>for</span>
            {renderParamInput("duration", 2)}
            <span>secs</span>
          </>
        )}

        {block.type === "THINK" && (
          <>
            <span>Think</span>
            {renderParamInput("text", "Hmm...", true)}
            <span>for</span>
            {renderParamInput("duration", 2)}
            <span>secs</span>
          </>
        )}

        {block.type === "REPEAT" && (
          <>
            <span>Repeat</span>
            {renderParamInput("repeatCount", 10)}
            <span>times</span>
          </>
        )}

        {/* Trash button */}
        <button
          type="button"
          disabled={isRunning}
          onClick={handleRemove}
          title="Delete block"
          className="ml-auto p-1 text-xs opacity-90 hover:opacity-100 disabled:opacity-30"
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
              <div className="text-xs text-yellow-900 font-medium italic py-1 text-center select-none">
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
