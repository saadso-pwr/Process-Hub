"use client";

import { useState } from "react";
import { ViewportPortal, useReactFlow, type Node } from "@xyflow/react";
import {
  FF,
  BRAND_BLUE,
  COLOR_SWATCHES,
  inputStyle,
  Field,
  Seg,
  END_CAPS,
  readEdgeStyle,
  normalizeHref,
  type EndCap,
  type LineStyle,
} from "./kit";
import {
  makeId,
  normalizePopup,
  SWIMLANE,
  swimlaneBoardHeight,
  swimlaneBoardWidth,
  swimlaneRowHeight,
  swimlaneRowsHeight,
  swimlaneStageWidth,
  swimlaneStagesWidth,
  type NodePopup,
  type PopupLink,
  type BuilderNode,
  type BuilderNodeData,
  type BuilderEdge,
  type LaneData,
  type SwimlaneData,
  type SwimlaneItem,
} from "./diagram";

export function LaneInspector(props: {
  node: Node<LaneData>;
  onPatch: (patch: Partial<LaneData>) => void;
  onResize: (size: Partial<{ width: number; height: number }>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { node, onPatch } = props;
  const size = readNodeSize(node, { width: 620, height: 200 });
  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        borderLeft: "1px solid #ececec",
        background: "#fff",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1f1f1b" }}>Edit swim lane</p>
        <button
          type="button"
          onClick={props.onClose}
          style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "#999", lineHeight: 1 }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <Field label="Lane name">
        <input
          value={node.data.label}
          onChange={(e) => onPatch({ label: e.target.value })}
          style={inputStyle}
        />
      </Field>

      <Field label="Colour">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onPatch({ color: c })}
              title={c}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: c,
                border: node.data.color === c ? "2px solid #1f1f1b" : "1px solid #ddd",
                cursor: "pointer",
              }}
            />
          ))}
          <input
            type="color"
            value={node.data.color}
            onChange={(e) => onPatch({ color: e.target.value })}
            style={{ width: 28, height: 28, padding: 0, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#fff" }}
            title="Custom colour"
          />
        </div>
      </Field>

      <DimensionFields
        width={size.width}
        height={size.height}
        minWidth={520}
        minHeight={130}
        onChange={props.onResize}
      />

      <p style={{ margin: 0, fontSize: 11, color: "#aaa", lineHeight: 1.5 }}>
        Drag steps onto this lane — they attach and snap to the lane&apos;s centre line. Resize the
        lane with the handles, and run Tidy to space the steps evenly.
      </p>

      <button
        type="button"
        onClick={props.onDelete}
        style={{
          marginTop: "auto",
          fontFamily: FF,
          fontSize: 13,
          fontWeight: 600,
          padding: "9px 12px",
          borderRadius: 8,
          border: "1px solid #f0caca",
          background: "#fdf2f2",
          color: "#9a2a2a",
          cursor: "pointer",
        }}
      >
        Delete lane
      </button>
    </div>
  );
}

export function SwimlaneInspector(props: {
  node: Node<SwimlaneData>;
  onPatch: (patch: Partial<SwimlaneData>) => void;
  onResize: (size: Partial<{ width: number; height: number }>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { node, onPatch } = props;
  const data = normalizeSwimlaneData(node.data);
  const size = readNodeSize(node, {
    width: swimlaneBoardWidth(data),
    height: swimlaneBoardHeight(data),
  });
  const minWidth = swimlaneBoardWidth(data);
  const minHeight = swimlaneBoardHeight(data);

  const patchRows = (rows: SwimlaneItem[]) => {
    onPatch({ rows });
    props.onResize({ height: data.stageHeaderHeight + swimlaneRowsHeight(rows) });
  };
  const patchStages = (stages: SwimlaneItem[]) => {
    onPatch({ stages });
    props.onResize({ width: data.rowHeaderWidth + swimlaneStagesWidth(stages) });
  };

  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        borderLeft: "1px solid #ececec",
        background: "#fff",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1f1f1b" }}>Edit swimlane board</p>
        <button
          type="button"
          onClick={props.onClose}
          style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "#999", lineHeight: 1 }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <Field label="Board title">
        <input
          value={data.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          style={inputStyle}
        />
      </Field>

      <Field label="Board colour">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onPatch({ color: c })}
              title={c}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: c,
                border: data.color === c ? "2px solid #1f1f1b" : "1px solid #ddd",
                cursor: "pointer",
              }}
            />
          ))}
          <input
            type="color"
            value={data.color}
            onChange={(e) => onPatch({ color: e.target.value })}
            style={{ width: 28, height: 28, padding: 0, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#fff" }}
            title="Custom colour"
          />
        </div>
      </Field>

      <DimensionFields
        width={size.width}
        height={size.height}
        minWidth={minWidth}
        minHeight={minHeight}
        onChange={props.onResize}
      />

      <AxisEditor
        label="Role rows"
        addLabel="+ Add row"
        itemPlaceholder="Role name"
        items={data.rows}
        onChange={patchRows}
        makeItemLabel={(index) => `Role ${index + 1}`}
        moveBackTitle="Move row up"
        moveForwardTitle="Move row down"
        moveBackGlyph="↑"
        moveForwardGlyph="↓"
        dimensionLabel="H"
        dimensionTitle="Row height"
        dimensionKey="height"
        minDimension={SWIMLANE.minRowHeight}
        defaultDimension={SWIMLANE.defaultRowHeight}
      />

      <AxisEditor
        label="Stages"
        addLabel="+ Add stage"
        itemPlaceholder="Stage name"
        items={data.stages}
        onChange={patchStages}
        makeItemLabel={(index) => `Stage ${index + 1}`}
        moveBackTitle="Move stage left"
        moveForwardTitle="Move stage right"
        moveBackGlyph="←"
        moveForwardGlyph="→"
        dimensionLabel="W"
        dimensionTitle="Column width"
        dimensionKey="width"
        minDimension={SWIMLANE.minStageWidth}
        defaultDimension={SWIMLANE.defaultStageWidth}
      />

      <p style={{ margin: 0, fontSize: 11, color: "#aaa", lineHeight: 1.5 }}>
        Drag steps onto the board to snap them into the nearest role row and stage column.
      </p>

      <button
        type="button"
        onClick={props.onDelete}
        style={{
          marginTop: "auto",
          fontFamily: FF,
          fontSize: 13,
          fontWeight: 600,
          padding: "9px 12px",
          borderRadius: 8,
          border: "1px solid #f0caca",
          background: "#fdf2f2",
          color: "#9a2a2a",
          cursor: "pointer",
        }}
      >
        Delete board
      </button>
    </div>
  );
}

function normalizeSwimlaneData(data: SwimlaneData): SwimlaneData {
  return {
    ...data,
    title: data.title || "Swimlane",
    color: data.color || BRAND_BLUE,
    rows: data.rows?.length
      ? data.rows.map((row) => ({ ...row, height: swimlaneRowHeight(row) }))
      : [{ id: makeId("row"), label: "Role 1", height: SWIMLANE.defaultRowHeight }],
    stages: data.stages?.length
      ? data.stages.map((stage) => ({ ...stage, width: swimlaneStageWidth(stage) }))
      : [{ id: makeId("stage"), label: "Stage 1", width: SWIMLANE.defaultStageWidth }],
    rowHeaderWidth: data.rowHeaderWidth || SWIMLANE.rowHeaderWidth,
    stageHeaderHeight: data.stageHeaderHeight || SWIMLANE.stageHeaderHeight,
  };
}

function AxisEditor({
  label,
  addLabel,
  itemPlaceholder,
  items,
  onChange,
  makeItemLabel,
  moveBackTitle,
  moveForwardTitle,
  moveBackGlyph,
  moveForwardGlyph,
  dimensionLabel,
  dimensionTitle,
  dimensionKey,
  minDimension,
  defaultDimension,
}: {
  label: string;
  addLabel: string;
  itemPlaceholder: string;
  items: SwimlaneItem[];
  onChange: (items: SwimlaneItem[]) => void;
  makeItemLabel: (index: number) => string;
  moveBackTitle: string;
  moveForwardTitle: string;
  moveBackGlyph: string;
  moveForwardGlyph: string;
  dimensionLabel: string;
  dimensionTitle: string;
  dimensionKey: "width" | "height";
  minDimension: number;
  defaultDimension: number;
}) {
  const updateItem = (id: string, patch: Partial<SwimlaneItem>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const moveItem = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <Field label={label}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, index) => (
          <div key={item.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 74px auto auto auto", gap: 5, alignItems: "center" }}>
            <input
              value={item.label}
              onChange={(e) => updateItem(item.id, { label: e.target.value })}
              placeholder={itemPlaceholder}
              style={inputStyle}
            />
            <SizeInput
              value={Math.round(Number(item[dimensionKey]) || defaultDimension)}
              min={minDimension}
              suffix={dimensionLabel}
              ariaLabel={`${item.label || label} ${dimensionTitle}`}
              title={dimensionTitle}
              compact
              onCommit={(next) => updateItem(item.id, { [dimensionKey]: next })}
            />
            <SmallIconButton
              title={moveBackTitle}
              disabled={index === 0}
              onClick={() => moveItem(index, -1)}
            >
              {moveBackGlyph}
            </SmallIconButton>
            <SmallIconButton
              title={moveForwardTitle}
              disabled={index === items.length - 1}
              onClick={() => moveItem(index, 1)}
            >
              {moveForwardGlyph}
            </SmallIconButton>
            <SmallIconButton
              title="Delete"
              disabled={items.length === 1}
              onClick={() => onChange(items.filter((x) => x.id !== item.id))}
            >
              −
            </SmallIconButton>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange([
              ...items,
              {
                id: makeId(label.toLowerCase().includes("stage") ? "stage" : "row"),
                label: makeItemLabel(items.length),
                [dimensionKey]: defaultDimension,
              },
            ])
          }
          style={{
            alignSelf: "flex-start",
            fontFamily: FF,
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 10px",
            borderRadius: 6,
            border: `1px dashed ${BRAND_BLUE}`,
            background: "#fff",
            color: BRAND_BLUE,
            cursor: "pointer",
          }}
        >
          {addLabel}
        </button>
      </div>
    </Field>
  );
}

function SmallIconButton({
  title,
  disabled,
  onClick,
  children,
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 26,
        height: 30,
        border: "1px solid #ddd",
        background: disabled ? "#f7f7f7" : "#fff",
        borderRadius: 6,
        cursor: disabled ? "default" : "pointer",
        color: disabled ? "#c3c3c3" : "#555",
        fontFamily: FF,
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

/* ───────────────────────────── AI modal ───────────────────────────── */
/* ───────────────────────────── AI chat drawer ───────────────────────────── */
export function NodePopupCard({ node, onClose }: { node: Node; onClose: () => void }) {
  const { getInternalNode } = useReactFlow();
  const internal = getInternalNode(node.id);
  const abs = internal?.internals.positionAbsolute ?? node.position;
  const w = node.measured?.width ?? (typeof node.width === "number" ? node.width : 170);
  const popup = normalizePopup(node.data as BuilderNodeData);
  const links = popup.links ?? [];

  return (
    <ViewportPortal>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          left: abs.x + w + 16,
          top: abs.y,
          width: 300,
          background: "#fff",
          border: "1px solid #e4e2da",
          borderRadius: 14,
          padding: "16px 18px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.16), 0 2px 4px rgba(0,0,0,0.06)",
          fontFamily: FF,
          pointerEvents: "all",
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <p style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 800, color: "#1f1f1b", lineHeight: 1.2 }}>
            {popup.title?.trim() || "Details"}
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "#999", lineHeight: 1 }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {popup.text?.trim() && (
          <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "#3f3f38", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
            {popup.text}
          </p>
        )}
        {links.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            {links.map((l, i) => (
              <a
                key={i}
                href={normalizeHref(l.url)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: BRAND_BLUE,
                  textDecoration: "none",
                  wordBreak: "break-all",
                }}
              >
                <span aria-hidden="true">🔗</span>
                {l.label.trim() || l.url}
              </a>
            ))}
          </div>
        )}
      </div>
    </ViewportPortal>
  );
}

/* ───────────────────────────── Alignment bar ───────────────────────────── */
export function AlignBar(props: {
  count: number;
  onAlign: (mode: "left" | "centerH" | "right" | "top" | "middleV" | "bottom") => void;
  onDistribute: (axis: "h" | "v") => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: "#fff",
        border: "1px solid #e4e4e4",
        borderRadius: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        padding: 5,
        fontFamily: FF,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: "#8a8a82", padding: "0 8px" }}>
        {props.count} selected
      </span>
      <AlignBtn title="Align left" onClick={() => props.onAlign("left")}>⫷</AlignBtn>
      <AlignBtn title="Align centres (horizontal)" onClick={() => props.onAlign("centerH")}>⊟</AlignBtn>
      <AlignBtn title="Align right" onClick={() => props.onAlign("right")}>⫸</AlignBtn>
      <span style={{ width: 1, height: 18, background: "#e4e4e4", margin: "0 3px" }} />
      <AlignBtn title="Align top" onClick={() => props.onAlign("top")}>⫯</AlignBtn>
      <AlignBtn title="Align middles (vertical)" onClick={() => props.onAlign("middleV")}>⊞</AlignBtn>
      <AlignBtn title="Align bottom" onClick={() => props.onAlign("bottom")}>⫰</AlignBtn>
      <span style={{ width: 1, height: 18, background: "#e4e4e4", margin: "0 3px" }} />
      <AlignBtn title="Distribute horizontally (3+)" onClick={() => props.onDistribute("h")}>⇿</AlignBtn>
      <AlignBtn title="Distribute vertically (3+)" onClick={() => props.onDistribute("v")}>⇕</AlignBtn>
    </div>
  );
}

function AlignBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 32,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: 7,
        background: hover ? "#f0f1f8" : "transparent",
        color: "#2a2a2a",
        cursor: "pointer",
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

function readNodeSize(node: Node, fallback: { width: number; height: number }) {
  return {
    width: Math.round(typeof node.width === "number" ? node.width : node.measured?.width ?? fallback.width),
    height: Math.round(typeof node.height === "number" ? node.height : node.measured?.height ?? fallback.height),
  };
}

function DimensionFields({
  width,
  height,
  minWidth,
  minHeight,
  onChange,
}: {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  onChange: (size: Partial<{ width: number; height: number }>) => void;
}) {
  return (
    <Field label="Dimensions">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <SizeInput value={width} min={minWidth} suffix="px" ariaLabel="Width" label="W" onCommit={(next) => onChange({ width: next })} />
        <SizeInput value={height} min={minHeight} suffix="px" ariaLabel="Height" label="H" onCommit={(next) => onChange({ height: next })} />
      </div>
    </Field>
  );
}

function SizeInput({
  value,
  min,
  suffix,
  ariaLabel,
  label,
  title,
  compact,
  onCommit,
}: {
  value: number;
  min: number;
  suffix: string;
  ariaLabel: string;
  label?: string;
  title?: string;
  compact?: boolean;
  onCommit: (value: number) => void;
}) {
  const commit = (raw: string, clamp = true) => {
    if (raw.trim() === "") return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    const next = Math.round(parsed);
    if (next >= min || clamp) onCommit(Math.max(min, next));
  };

  const input = (
    <span title={title} style={{ position: "relative", display: "block", minWidth: 0 }}>
      <input
        key={Math.round(value)}
        type="number"
        min={min}
        step={1}
        defaultValue={Math.round(value)}
        onChange={(e) => {
          const next = e.target.value;
          commit(next, false);
        }}
        onBlur={(e) => {
          commit(e.currentTarget.value);
          if (e.currentTarget.value.trim() === "" || Number(e.currentTarget.value) < min) {
            e.currentTarget.value = String(min);
          }
        }}
        style={{ ...inputStyle, minWidth: 0, paddingRight: compact ? 24 : 28 }}
        aria-label={ariaLabel}
      />
      <span style={{ position: "absolute", right: compact ? 7 : 8, top: "50%", transform: "translateY(-50%)", fontSize: compact ? 10 : 11, fontWeight: compact ? 700 : 400, color: "#999", pointerEvents: "none" }}>
        {suffix}
      </span>
    </span>
  );

  if (!label) return input;

  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#8a8a82" }}>{label}</span>
      {input}
    </label>
  );
}

export function Inspector(props: {
  node: BuilderNode;
  onPatch: (patch: Partial<BuilderNodeData>) => void;
  onResize: (size: Partial<{ width: number; height: number }>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { node, onPatch } = props;
  const data = node.data;
  const size = readNodeSize(node, { width: 170, height: 88 });
  const minSize =
    data.shape === "circle"
      ? { width: 90, height: 90 }
      : { width: 110, height: 64 };

  function patchText(index: number, value: string) {
    const texts = [...data.texts];
    texts[index] = value;
    onPatch({ texts });
  }
  function addText() {
    onPatch({ texts: [...data.texts, ""] });
  }
  function removeText(index: number) {
    const texts = data.texts.filter((_, i) => i !== index);
    onPatch({ texts: texts.length ? texts : [""] });
  }

  const popup = normalizePopup(data);
  const links = popup.links ?? [];
  // Write the whole popup and clear the legacy single-line note.
  const setPopup = (p: Partial<NodePopup>) =>
    onPatch({ popup: { ...popup, ...p }, note: undefined });
  const setLink = (i: number, key: keyof PopupLink, val: string) => {
    const next = links.map((l, j) => (j === i ? { ...l, [key]: val } : l));
    setPopup({ links: next });
  };

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        borderLeft: "1px solid #ececec",
        background: "#fff",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1f1f1b" }}>Edit step</p>
        <button
          type="button"
          onClick={props.onClose}
          style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "#999", lineHeight: 1 }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <Field label="Shape">
        <div style={{ display: "flex", gap: 6 }}>
          <Seg active={data.shape === "rectangle"} onClick={() => onPatch({ shape: "rectangle" })}>
            ▭ Box
          </Seg>
          <Seg active={data.shape === "circle"} onClick={() => onPatch({ shape: "circle" })}>
            ◯ Circle
          </Seg>
          <Seg active={data.shape === "diamond"} onClick={() => onPatch({ shape: "diamond" })}>
            ◇ Diamond
          </Seg>
        </div>
      </Field>

      <Field label="Border">
        <div style={{ display: "flex", gap: 8 }}>
          <Seg active={!data.dashed} onClick={() => onPatch({ dashed: false })}>
            Solid
          </Seg>
          <Seg active={data.dashed} onClick={() => onPatch({ dashed: true })}>
            Dashed
          </Seg>
        </div>
      </Field>

      <Field label="Colour">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onPatch({ color: c })}
              title={c}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: c,
                border: data.color === c ? "2px solid #1f1f1b" : "1px solid #ddd",
                cursor: "pointer",
              }}
            />
          ))}
          <input
            type="color"
            value={data.color}
            onChange={(e) => onPatch({ color: e.target.value })}
            style={{ width: 28, height: 28, padding: 0, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#fff" }}
            title="Custom colour"
          />
        </div>
      </Field>

      <Field label="Fill">
        <input
          type="color"
          value={data.fill}
          onChange={(e) => onPatch({ fill: e.target.value })}
          style={{ width: "100%", height: 32, padding: 0, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#fff" }}
        />
      </Field>

      <DimensionFields
        width={size.width}
        height={size.height}
        minWidth={minSize.width}
        minHeight={minSize.height}
        onChange={props.onResize}
      />

      <Field label="Text lines">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.texts.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 6 }}>
              <input
                value={t}
                onChange={(e) => patchText(i, e.target.value)}
                placeholder={i === 0 ? "Title" : "More text…"}
                style={inputStyle}
              />
              {data.texts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeText(i)}
                  style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 6, cursor: "pointer", width: 30, color: "#999" }}
                  aria-label="Remove line"
                >
                  −
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addText}
            style={{
              alignSelf: "flex-start",
              fontFamily: FF,
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 10px",
              borderRadius: 6,
              border: `1px dashed ${BRAND_BLUE}`,
              background: "#fff",
              color: BRAND_BLUE,
              cursor: "pointer",
            }}
          >
            + Add text line
          </button>
        </div>
      </Field>

      <div style={{ height: 1, background: "#eee", margin: "2px 0" }} />
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: "#8a8a82", textTransform: "uppercase" }}>
        Popup (click step to open)
      </p>

      <Field label="Popup title">
        <input
          value={popup.title ?? ""}
          onChange={(e) => setPopup({ title: e.target.value })}
          placeholder="e.g. Approval gate"
          style={inputStyle}
        />
      </Field>

      <Field label="Popup text">
        <textarea
          value={popup.text ?? ""}
          onChange={(e) => setPopup({ text: e.target.value })}
          placeholder="Detail shown when this step is clicked."
          rows={4}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.45 }}
        />
      </Field>

      <Field label="Links">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {links.map((l, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={l.label}
                  onChange={(e) => setLink(i, "label", e.target.value)}
                  placeholder="Label"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setPopup({ links: links.filter((_, j) => j !== i) })}
                  style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 6, cursor: "pointer", width: 30, color: "#999" }}
                  aria-label="Remove link"
                >
                  −
                </button>
              </div>
              <input
                value={l.url}
                onChange={(e) => setLink(i, "url", e.target.value)}
                placeholder="https://…"
                style={inputStyle}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPopup({ links: [...links, { label: "", url: "" }] })}
            style={{
              alignSelf: "flex-start",
              fontFamily: FF,
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 10px",
              borderRadius: 6,
              border: `1px dashed ${BRAND_BLUE}`,
              background: "#fff",
              color: BRAND_BLUE,
              cursor: "pointer",
            }}
          >
            + Add link
          </button>
        </div>
      </Field>

      <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>
        Tip: drag the square handles to resize. Shift-drag the canvas to select several steps and
        align them.
      </p>

      <button
        type="button"
        onClick={props.onDelete}
        style={{
          marginTop: "auto",
          fontFamily: FF,
          fontSize: 13,
          fontWeight: 600,
          padding: "9px 12px",
          borderRadius: 8,
          border: "1px solid #f0caca",
          background: "#fdf2f2",
          color: "#9a2a2a",
          cursor: "pointer",
        }}
      >
        Delete step
      </button>
    </div>
  );
}

/* ───────────────────────────── Edge inspector ───────────────────────────── */
export function EdgeInspector(props: {
  edge: BuilderEdge;
  onPatch: (patch: Partial<{ color: string; lineStyle: LineStyle; endCap: EndCap; startCap: EndCap; label: string }>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const cur = readEdgeStyle(props.edge);
  const dashArray = cur.lineStyle === "dashed" ? "8 5" : cur.lineStyle === "dotted" ? "1.5 6" : undefined;

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        borderLeft: "1px solid #ececec",
        background: "#fff",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1f1f1b" }}>Edit connector</p>
        <button
          type="button"
          onClick={props.onClose}
          style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "#999", lineHeight: 1 }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Live preview */}
      <svg width="100%" height="44" viewBox="0 0 240 44" style={{ background: "#fafafa", borderRadius: 8 }}>
        <line
          x1="20"
          y1="22"
          x2="220"
          y2="22"
          stroke={cur.color}
          strokeWidth={2}
          strokeDasharray={dashArray}
          strokeLinecap={cur.lineStyle === "dotted" ? "round" : "butt"}
          markerStart={cur.startCap === "none" ? undefined : `url(#${cur.startCap})`}
          markerEnd={cur.endCap === "none" ? undefined : `url(#${cur.endCap})`}
        />
      </svg>

      <Field label="Label">
        <input
          value={cur.label}
          onChange={(e) => props.onPatch({ label: e.target.value })}
          placeholder="e.g. Yes / No"
          style={inputStyle}
        />
      </Field>

      <Field label="Colour">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => props.onPatch({ color: c })}
              title={c}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: c,
                border: cur.color.toLowerCase() === c.toLowerCase() ? "2px solid #1f1f1b" : "1px solid #ddd",
                cursor: "pointer",
              }}
            />
          ))}
          <input
            type="color"
            value={cur.color}
            onChange={(e) => props.onPatch({ color: e.target.value })}
            style={{ width: 28, height: 28, padding: 0, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#fff" }}
            title="Custom colour"
          />
        </div>
      </Field>

      <Field label="Line style">
        <div style={{ display: "flex", gap: 6 }}>
          <Seg active={cur.lineStyle === "solid"} onClick={() => props.onPatch({ lineStyle: "solid" })}>
            Solid
          </Seg>
          <Seg active={cur.lineStyle === "dashed"} onClick={() => props.onPatch({ lineStyle: "dashed" })}>
            Dashed
          </Seg>
          <Seg active={cur.lineStyle === "dotted"} onClick={() => props.onPatch({ lineStyle: "dotted" })}>
            Dotted
          </Seg>
        </div>
      </Field>

      <Field label="Start point">
        <CapPicker value={cur.startCap} onChange={(v) => props.onPatch({ startCap: v })} />
      </Field>

      <Field label="End point">
        <CapPicker value={cur.endCap} onChange={(v) => props.onPatch({ endCap: v })} />
      </Field>

      <button
        type="button"
        onClick={props.onDelete}
        style={{
          marginTop: "auto",
          fontFamily: FF,
          fontSize: 13,
          fontWeight: 600,
          padding: "9px 12px",
          borderRadius: 8,
          border: "1px solid #f0caca",
          background: "#fdf2f2",
          color: "#9a2a2a",
          cursor: "pointer",
        }}
      >
        Delete connector
      </button>
    </div>
  );
}

function CapPicker({ value, onChange }: { value: EndCap; onChange: (v: EndCap) => void }) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {END_CAPS.map((cap) => {
        const active = value === cap.value;
        return (
          <button
            key={cap.value}
            type="button"
            onClick={() => onChange(cap.value)}
            title={cap.label}
            style={{
              width: 44,
              height: 38,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              borderRadius: 7,
              border: `1px solid ${active ? BRAND_BLUE : "#dcdcdc"}`,
              background: active ? `${BRAND_BLUE}10` : "#fff",
              color: active ? BRAND_BLUE : "#666",
              cursor: "pointer",
              fontFamily: FF,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>{cap.glyph}</span>
            <span style={{ fontSize: 9, fontWeight: 600 }}>{cap.label}</span>
          </button>
        );
      })}
    </div>
  );
}
