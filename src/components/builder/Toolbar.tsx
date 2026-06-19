"use client";

import { useState } from "react";
import { FF, BRAND_BLUE, Divider } from "./kit";

type ExportFormat = "png" | "svg" | "pdf" | "json";

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
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canCopy: boolean;
  canPaste: boolean;
  onExport: (format: ExportFormat) => void;
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
      <TBtn onClick={props.onCopy} disabled={!props.canCopy} title="Copy selected (⌘C)">Copy</TBtn>
      <TBtn onClick={props.onPaste} disabled={!props.canPaste} title="Paste copied (⌘V)">Paste</TBtn>
      <TBtn onClick={props.onDuplicate} disabled={!props.canCopy} title="Duplicate selected (⌘D)">Duplicate</TBtn>
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
      <ExportMenu onExport={props.onExport} />
      <TBtn onClick={props.onAi} primary>
        ✨ Converge with AI
      </TBtn>
      {props.note && (
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b6b66" }}>{props.note}</span>
      )}
    </div>
  );
}

const EXPORT_OPTIONS: { format: ExportFormat; label: string }[] = [
  { format: "png", label: "PNG image" },
  { format: "svg", label: "SVG vector" },
  { format: "pdf", label: "PDF document" },
  { format: "json", label: "JSON data" },
];

function ExportMenu({ onExport }: { onExport: (f: ExportFormat) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <TBtn onClick={() => setOpen((v) => !v)}>⤓ Export</TBtn>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div
            style={{
              position: "absolute",
              top: 38,
              left: 0,
              zIndex: 41,
              width: 168,
              background: "#fff",
              border: "1px solid #e4e4e4",
              borderRadius: 10,
              boxShadow: "0 12px 28px rgba(0,0,0,0.16)",
              padding: 5,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {EXPORT_OPTIONS.map((o) => (
              <button
                key={o.format}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onExport(o.format);
                }}
                style={{
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  borderRadius: 7,
                  padding: "9px 10px",
                  fontFamily: FF,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#2a2a2a",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f4f5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
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
