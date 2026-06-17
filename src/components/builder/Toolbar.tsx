"use client";

import { FF, BRAND_BLUE, Divider } from "./kit";

export function Toolbar(props: {
  title: string;
  onTitleChange: (v: string) => void;
  onAddBox: () => void;
  onAddCircle: () => void;
  onAddDiamond: () => void;
  onAddLane: () => void;
  direction: "TB" | "LR";
  onDirection: (d: "TB" | "LR") => void;
  onTidy: () => void;
  onSave: () => void;
  onAi: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  note: string | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        padding: "10px 16px",
        borderBottom: "1px solid #ececec",
        background: "#fff",
      }}
    >
      <input
        value={props.title}
        onChange={(e) => props.onTitleChange(e.target.value)}
        style={{
          fontFamily: FF,
          fontSize: 14,
          fontWeight: 700,
          color: "#1f1f1b",
          border: "1px solid transparent",
          borderRadius: 8,
          padding: "6px 8px",
          maxWidth: 220,
          outline: "none",
          background: "transparent",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#dcdcdc")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
      />
      <Divider />
      <TBtn onClick={props.onUndo} disabled={!props.canUndo} title="Undo (⌘Z)">↶</TBtn>
      <TBtn onClick={props.onRedo} disabled={!props.canRedo} title="Redo (⌘⇧Z)">↷</TBtn>
      <Divider />
      <TBtn onClick={props.onAddBox}>▭ Box</TBtn>
      <TBtn onClick={props.onAddCircle}>◯ Circle</TBtn>
      <TBtn onClick={props.onAddDiamond}>◇ Diamond</TBtn>
      <TBtn onClick={props.onAddLane}>☰ Swim lane</TBtn>
      <Divider />
      <div style={{ display: "flex", border: "1px solid #dcdcdc", borderRadius: 8, overflow: "hidden" }}>
        <FlowDirBtn active={props.direction === "TB"} onClick={() => props.onDirection("TB")} title="Top to bottom">
          ⬍
        </FlowDirBtn>
        <FlowDirBtn active={props.direction === "LR"} onClick={() => props.onDirection("LR")} title="Left to right">
          ⬌
        </FlowDirBtn>
      </div>
      <TBtn onClick={props.onTidy}>↹ Tidy</TBtn>
      <TBtn onClick={props.onSave}>Save</TBtn>
      <TBtn onClick={props.onAi} primary>
        ✨ Converge with AI
      </TBtn>
      {props.note && (
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b6b66" }}>{props.note}</span>
      )}
    </div>
  );
}

export function TBtn({
  children,
  onClick,
  primary,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        fontFamily: FF,
        fontSize: 13,
        fontWeight: 600,
        padding: "7px 12px",
        borderRadius: 8,
        border: `1px solid ${primary ? BRAND_BLUE : "#dcdcdc"}`,
        background: primary ? BRAND_BLUE : "#fff",
        color: primary ? "#fff" : disabled ? "#bbb" : "#2a2a2a",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export function FlowDirBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        fontFamily: FF,
        fontSize: 15,
        fontWeight: 700,
        padding: "6px 11px",
        border: "none",
        background: active ? BRAND_BLUE : "#fff",
        color: active ? "#fff" : "#666",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

/* ───────────────────────────── Lane inspector ───────────────────────────── */
