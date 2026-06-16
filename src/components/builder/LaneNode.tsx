"use client";

import { NodeResizer, useReactFlow, type NodeProps, type Node } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";
import { LANE, type LaneData } from "./diagram";

const FF = "'Manrope', sans-serif";

export function LaneNode({ id, data, selected }: NodeProps<Node<LaneData>>) {
  const { setNodes } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: draft.trim() || "Lane" } } : n)),
    );
    setEditing(false);
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", fontFamily: FF }}>
      <NodeResizer
        isVisible={!!selected}
        minWidth={520}
        minHeight={130}
        color={data.color}
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
        lineStyle={{ borderColor: data.color }}
      />

      {/* Lane band */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `${data.color}0a`,
          border: `1.5px solid ${data.color}66`,
          borderRadius: 14,
          boxSizing: "border-box",
          boxShadow: selected ? `0 0 0 2px ${data.color}` : "none",
        }}
      />

      {/* Header strip (left) */}
      <div
        onDoubleClick={() => {
          setDraft(data.label);
          setEditing(true);
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: LANE.headerWidth,
          background: `${data.color}1f`,
          borderRight: `1.5px solid ${data.color}66`,
          borderRadius: "14px 0 0 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px 12px",
          boxSizing: "border-box",
        }}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="nodrag"
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "#fff",
              borderRadius: 6,
              padding: "4px 6px",
              fontFamily: FF,
              fontSize: 14,
              fontWeight: 700,
              color: "#1f1f1b",
              textAlign: "center",
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: data.color,
              textAlign: "center",
              lineHeight: 1.25,
              wordBreak: "break-word",
            }}
          >
            {data.label}
          </span>
        )}
      </div>
    </div>
  );
}
