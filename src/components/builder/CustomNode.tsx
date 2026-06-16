"use client";

import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import { useEffect, useRef, useState } from "react";
import { hasPopup, type BuilderNodeData } from "./diagram";

const FF = "'Manrope', sans-serif";

// Large transparent hit area with a small visible dot drawn in the centre,
// so the connection points are easy to grab without looking oversized.
const sideHandle: React.CSSProperties = {
  width: 26,
  height: 26,
  background:
    "radial-gradient(circle at center, #fff 0 2.8px, #00037C 2.8px 5.2px, transparent 5.6px)",
  border: "none",
  borderRadius: "50%",
};

/** Source + target handle on each side, so any node can connect to any other. */
function Connectors({ visible }: { visible: boolean }) {
  const base: React.CSSProperties = {
    ...sideHandle,
    opacity: visible ? 1 : 0,
    transition: "opacity 120ms ease-out",
  };
  return (
    <>
      <Handle type="target" position={Position.Top} id="t" style={base} />
      <Handle type="source" position={Position.Top} id="t-s" style={base} />
      <Handle type="target" position={Position.Right} id="r-t" style={base} />
      <Handle type="source" position={Position.Right} id="r" style={base} />
      <Handle type="target" position={Position.Bottom} id="b-t" style={base} />
      <Handle type="source" position={Position.Bottom} id="b" style={base} />
      <Handle type="target" position={Position.Left} id="l" style={base} />
      <Handle type="source" position={Position.Left} id="l-s" style={base} />
    </>
  );
}

export function CustomNode({ id, data, selected }: NodeProps<Node<BuilderNodeData>>) {
  const { setNodes } = useReactFlow();
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isCircle = data.shape === "circle";
  const isDiamond = data.shape === "diamond";

  useEffect(() => {
    if (editing) {
      const ta = textareaRef.current;
      ta?.focus();
      ta?.select();
    }
  }, [editing]);

  function startEditing() {
    setDraft(data.texts.join("\n"));
    setEditing(true);
  }

  function commit() {
    const texts = draft
      .split("\n")
      .map((t) => t.trim())
      .filter((t, i, arr) => t.length > 0 || arr.length === 1);
    setNodes((nodes) =>
      nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, texts: texts.length ? texts : [""] } }
          : n,
      ),
    );
    setEditing(false);
  }

  const dash = data.dashed ? "4 3" : undefined;

  /* The visible shape. Diamonds/rounded-rects/circles share one box that fills
     the (resizable) node; the diamond uses an SVG so its stroke can be dashed. */
  const surface = isDiamond ? (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
    >
      <polygon
        points="50,3 97,50 50,97 3,50"
        fill={data.fill}
        stroke={data.color}
        strokeWidth={2}
        strokeDasharray={dash}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  ) : (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: data.fill,
        border: `2px ${data.dashed ? "dashed" : "solid"} ${data.color}`,
        borderRadius: isCircle ? "50%" : 12,
      }}
    />
  );

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={startEditing}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        fontFamily: FF,
        cursor: editing ? "text" : "grab",
        filter: selected
          ? `drop-shadow(0 0 0 #fff)`
          : hovered
            ? `drop-shadow(0 8px 16px ${data.color}33)`
            : "none",
      }}
    >
      <NodeResizer
        isVisible={!!selected}
        minWidth={isCircle ? 90 : 110}
        minHeight={isCircle ? 90 : 64}
        keepAspectRatio={isCircle}
        color={data.color}
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
        lineStyle={{ borderColor: data.color }}
      />

      {surface}

      <Connectors visible={hovered || !!selected} />

      {/* selection ring (drawn over the surface) */}
      {selected && !isDiamond && (
        <div
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: isCircle ? "50%" : 14,
            boxShadow: `0 0 0 2px ${data.color}`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* "Has more" badge — click the step to open its popup */}
      {hasPopup(data) && (
        <div
          title="Has details — click to open"
          style={{
            position: "absolute",
            top: isCircle || isDiamond ? "8%" : -8,
            right: isCircle || isDiamond ? "8%" : -8,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: data.color,
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            zIndex: 3,
          }}
        >
          +
        </div>
      )}

      {/* content */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          textAlign: "center",
          padding: isDiamond ? "0 24%" : isCircle ? "0 14%" : "10px 16px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setEditing(false);
              }
            }}
            rows={Math.max(1, draft.split("\n").length)}
            className="nodrag nowheel"
            style={{
              width: "100%",
              resize: "none",
              border: "none",
              outline: "none",
              background: "transparent",
              textAlign: "center",
              fontFamily: FF,
              fontSize: 13,
              fontWeight: 600,
              color: "#1f1f1b",
              lineHeight: 1.3,
            }}
          />
        ) : (
          data.texts.map((line, i) => (
            <span
              key={i}
              style={{
                fontSize: i === 0 ? 13 : 12,
                fontWeight: i === 0 ? 700 : 400,
                color: i === 0 ? "#1f1f1b" : "#55554e",
                lineHeight: 1.3,
                wordBreak: "break-word",
              }}
            >
              {line || (i === 0 ? "Double-click to edit" : "")}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
