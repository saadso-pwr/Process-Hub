"use client";

/* Shared building blocks for the process builder: theme constants, small UI
 * primitives, glyphs, edge-style helpers, the library API client, and AI types.
 * Extracted from ProcessBuilder.tsx so the panels can live in their own files. */

import { useState } from "react";
import {
  autoLayout,
  canonicalToBuilder,
  parseProcessText,
  type BuilderEdge,
  type DiagramDoc,
} from "./diagram";

export const FF = "'Manrope', sans-serif";
export const BRAND_BLUE = "#00037C";
export const ACCENT = "#31BAF0";
export const SAMPLE_TEXT = `Start: New hire needed
Create JD
Create job post
Post live
Decision: Goldenday needed?
- Yes: Run Goldenday process
- No: Skip Goldenday
End: Posting complete`;

export const COLOR_SWATCHES = [
  "#00037C",
  "#31BAF0",
  "#2a5634",
  "#c8923a",
  "#9a2a2a",
  "#6d28d9",
  "#0f172a",
];
export const AI_PREFS_KEY = "process-hub.builder.ai-prefs.v1";

export type ChatMsg = { role: "user" | "assistant"; content: string; applied?: boolean };
export type AiStatus = { configured: boolean; envVar: string; model: string; provider: string };
export type AiPrefs = { styleNotes: string; palette: string[]; reference: string };
export const DEFAULT_PREFS: AiPrefs = { styleNotes: "", palette: [], reference: "" };

export const STARTER_PROMPTS = [
  "Map our employee onboarding process",
  "Draft an invoice approval workflow with a manager sign-off",
  "Create an incident response process with a severity decision",
];

export function readPrefs(): AiPrefs {
  try {
    const raw = window.localStorage.getItem(AI_PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as AiPrefs) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}
/* Edge endpoint markers whose fill/stroke follows the line colour (context-stroke). */
export function EdgeMarkerDefs() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
      <defs>
        <marker
          id="ep-arrow"
          viewBox="0 0 10 10"
          refX="8.5"
          refY="5"
          markerWidth="9"
          markerHeight="9"
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
        </marker>
        <marker
          id="ep-arrow-open"
          viewBox="0 0 12 12"
          refX="9.5"
          refY="6"
          markerWidth="11"
          markerHeight="11"
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path d="M1.5,1.5 L10.5,6 L1.5,10.5" fill="none" stroke="context-stroke" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        <marker
          id="ep-circle"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="9"
          markerHeight="9"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <circle cx="5" cy="5" r="3.6" fill="context-stroke" />
        </marker>
        <marker
          id="ep-circle-open"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="9"
          markerHeight="9"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <circle cx="5" cy="5" r="3.2" fill="#fff" stroke="context-stroke" strokeWidth="1.4" />
        </marker>
      </defs>
    </svg>
  );
}

export type EndCap = "none" | "ep-arrow" | "ep-arrow-open" | "ep-circle" | "ep-circle-open";
export type LineStyle = "solid" | "dashed" | "dotted";

export function readEdgeStyle(e: BuilderEdge) {
  const style = (e.style ?? {}) as React.CSSProperties;
  const da = style.strokeDasharray as string | undefined;
  const lineStyle: LineStyle = !da ? "solid" : style.strokeLinecap === "round" ? "dotted" : "dashed";
  const capOf = (m: unknown): EndCap => (typeof m === "string" ? (m as EndCap) : m ? "ep-arrow" : "none");
  return {
    color: (style.stroke as string) ?? "#7a7a7a",
    lineStyle,
    endCap: capOf(e.markerEnd),
    startCap: capOf(e.markerStart),
    label: typeof e.label === "string" ? e.label : "",
  };
}

export function applyEdgePatch(
  e: BuilderEdge,
  patch: Partial<{ color: string; lineStyle: LineStyle; endCap: EndCap; startCap: EndCap; label: string }>,
): BuilderEdge {
  const cur = readEdgeStyle(e);
  const next = { ...cur, ...patch };
  const dash =
    next.lineStyle === "dashed" ? "8 5" : next.lineStyle === "dotted" ? "1.5 6" : undefined;
  return {
    ...e,
    label: next.label,
    markerEnd: next.endCap === "none" ? undefined : next.endCap,
    markerStart: next.startCap === "none" ? undefined : next.startCap,
    style: {
      ...e.style,
      stroke: next.color,
      strokeWidth: (e.style?.strokeWidth as number) ?? 1.8,
      strokeDasharray: dash,
      strokeLinecap: next.lineStyle === "dotted" ? "round" : "butt",
    },
  };
}
export type LibraryItem = {
  id: string;
  name: string;
  folder: string;
  archived: boolean;
  /** "media" items are an uploaded file you mark up; "flow" is a built diagram. */
  kind?: "flow" | "media";
  doc: DiagramDoc;
};
export type LibraryStore = { folders: string[]; items: LibraryItem[] };

export const EMPTY_STORE: LibraryStore = { folders: ["Unsorted"], items: [] };

export function buildDoc(text: string): DiagramDoc {
  const built = canonicalToBuilder(parseProcessText(text));
  return { nodes: autoLayout(built.nodes, built.edges), edges: built.edges };
}

export const libApi = {
  async load(): Promise<LibraryStore> {
    const res = await fetch("/api/library");
    if (!res.ok) throw new Error("load failed");
    return (await res.json()) as LibraryStore;
  },
  async addFolder(name: string): Promise<string> {
    const res = await fetch("/api/library/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("folder failed");
    return (await res.json()).name as string;
  },
  async create(input: { name: string; folder: string; kind: string; doc: DiagramDoc }): Promise<LibraryItem> {
    const res = await fetch("/api/library/diagrams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("create failed");
    return (await res.json()) as LibraryItem;
  },
  async update(id: string, patch: Partial<Pick<LibraryItem, "name" | "folder" | "archived" | "doc">>): Promise<LibraryItem> {
    const res = await fetch(`/api/library/diagrams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("update failed");
    return (await res.json()) as LibraryItem;
  },
  async remove(id: string): Promise<void> {
    const res = await fetch(`/api/library/diagrams/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("delete failed");
  },
};

/** Read a File as a data URL. */
export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Natural pixel size of an image data URL, capped to a sensible canvas size. */
export function imageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 1000;
      const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
      resolve({
        width: Math.round((img.naturalWidth || 800) * scale),
        height: Math.round((img.naturalHeight || 600) * scale),
      });
    };
    img.onerror = () => resolve({ width: 800, height: 600 });
    img.src = src;
  });
}
export const END_CAPS: { value: EndCap; label: string; glyph: string }[] = [
  { value: "none", label: "None", glyph: "—" },
  { value: "ep-arrow", label: "Arrow", glyph: "▶" },
  { value: "ep-arrow-open", label: "Open", glyph: "›" },
  { value: "ep-circle", label: "Dot", glyph: "●" },
  { value: "ep-circle-open", label: "Ring", glyph: "◦" },
];

export function normalizeHref(url: string) {
  const u = url.trim();
  if (!u) return "#";
  return /^(https?:|mailto:|tel:|\/)/i.test(u) ? u : `https://${u}`;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: "#8a8a82", textTransform: "uppercase" }}>
        {label}
      </span>
      {children}
    </div>
  );
}

export function Seg({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        fontFamily: FF,
        fontSize: 12,
        fontWeight: 600,
        padding: "7px 6px",
        borderRadius: 7,
        border: `1px solid ${active ? BRAND_BLUE : "#dcdcdc"}`,
        background: active ? `${BRAND_BLUE}10` : "#fff",
        color: active ? BRAND_BLUE : "#555",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export const inputStyle: React.CSSProperties = {
  flex: 1,
  width: "100%",
  fontFamily: FF,
  fontSize: 13,
  padding: "7px 9px",
  borderRadius: 6,
  border: "1px solid #dcdcdc",
  outline: "none",
  color: "#2a2a2a",
  boxSizing: "border-box",
};

/* ───────────────────────────── Empty state ───────────────────────────── */
export function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: 6,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: "#6b6b66",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

export function Divider() {
  return <div style={{ width: 1, height: 22, background: "#e4e4e4" }} />;
}

export function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: "left",
        border: "none",
        background: hover ? "#f4f4f5" : "transparent",
        borderRadius: 7,
        padding: "9px 10px",
        fontFamily: FF,
        fontSize: 13,
        fontWeight: 600,
        color: "#2a2a2a",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111" }}>{children}</p>;
}
export function Hr() {
  return <div style={{ height: 1, background: "#eee" }} />;
}

/* ───────────────────────────── Toolbar ───────────────────────────── */
export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 120ms" }}
    >
      <path d="M6 9l6 6 6-6" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export const chevBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 18,
  height: 18,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 0,
};
export function PlusGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
export function SearchGlyph() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
    >
      <circle cx="11" cy="11" r="7" stroke="#9a9a9a" strokeWidth="2" />
      <path d="m16.5 16.5 4 4" stroke="#9a9a9a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
export function ArchiveGlyph({ small }: { small?: boolean }) {
  const s = small ? 14 : 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="5" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
export function TrashGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function TemplateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m13.5 11.5-4 4M16 13l-1.5-1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
export function PaletteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-.5-.2-.9-.5-1.2-.3-.4-.5-.8-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-3.9-4-7.4-9-7.4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="7.5" cy="11.5" r="1" fill="currentColor" />
      <circle cx="10.5" cy="7.5" r="1" fill="currentColor" />
      <circle cx="15" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}
export function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="m12 3 1.7 4.6L18 9.3l-4.3 1.7L12 16l-1.7-5L6 9.3l4.3-1.7L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function GearGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ───────────────────────────── Inspector ───────────────────────────── */
/* ───────────────────────────── Node popup card ───────────────────────────── */
export function EmptyState() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: `${BRAND_BLUE}12`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="2" stroke={BRAND_BLUE} strokeWidth="2" />
          <circle cx="17" cy="17" r="4" stroke={BRAND_BLUE} strokeWidth="2" />
          <path d="M11 7h4a2 2 0 0 1 2 2v4" stroke={BRAND_BLUE} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p style={{ margin: 0, fontFamily: FF, fontSize: 15, fontWeight: 700, color: "#1f1f1b" }}>
        Build a process diagram
      </p>
      <p style={{ margin: 0, fontFamily: FF, fontSize: 13, color: "#6b6b66", textAlign: "center", maxWidth: 340 }}>
        Add boxes, circles and diamonds from the toolbar, or pick a Generate option on the left.
        Drag to connect, double-click to rename, drag corners to resize.
      </p>
    </div>
  );
}

/* ───────────────────────────── Glyphs ───────────────────────────── */
