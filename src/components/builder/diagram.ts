import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";

/* ──────────────────────────────────────────────────────────────────────────
 * Shared diagram model
 *
 * The whole builder revolves around one shape: a list of nodes and a list of
 * edges. The canvas renders that data; "Converge with AI" simply produces it.
 * Positions are never hand-authored — they come from the dagre layout step.
 * ────────────────────────────────────────────────────────────────────────── */

export type NodeShape = "rectangle" | "circle" | "diamond";

/** Default canvas footprint for each shape (px). Nodes are resizable from here. */
export const DEFAULT_SIZE: Record<NodeShape, { width: number; height: number }> = {
  rectangle: { width: 190, height: 88 },
  circle: { width: 140, height: 140 },
  diamond: { width: 170, height: 120 },
};

export type PopupLink = { label: string; url: string };

/** Rich detail attached to a node, shown in a popup when the node is clicked. */
export type NodePopup = {
  title?: string;
  text?: string;
  links?: PopupLink[];
};

/** Data carried by every custom canvas node. */
export type BuilderNodeData = {
  /** One or more lines of text rendered inside the shape. */
  texts: string[];
  shape: NodeShape;
  /** Accent / border colour (any CSS colour). */
  color: string;
  /** Background fill. */
  fill: string;
  dashed: boolean;
  /** Rich detail shown in a popup on click. */
  popup?: NodePopup;
  /** Legacy single-line note (migrated into popup.text on read). */
  note?: string;
  [key: string]: unknown;
};

/** Normalise legacy `note` + `popup` into one popup shape. */
export function normalizePopup(data: BuilderNodeData): NodePopup {
  const p = data.popup ?? {};
  return {
    title: p.title ?? "",
    text: p.text ?? data.note ?? "",
    links: p.links ?? [],
  };
}

/** Does a node have any popup content worth showing a badge / popup for? */
export function hasPopup(data: BuilderNodeData): boolean {
  const p = normalizePopup(data);
  return Boolean(p.title?.trim() || p.text?.trim() || (p.links && p.links.length > 0));
}

export type BuilderNode = Node<BuilderNodeData>;
export type BuilderEdge = Edge;

/** A horizontal swim lane. Shape nodes can be parented to it and snapped centre. */
export type LaneData = {
  label: string;
  color: string;
  [key: string]: unknown;
};
export type LaneNode = Node<LaneData>;

export const LANE = { defaultWidth: 1040, defaultHeight: 200, headerWidth: 132, gap: 16 };

export function isLane(node: { type?: string }): boolean {
  return node.type === "lane";
}

/** An uploaded file (PNG/SVG/PDF) shown as a backdrop you can mark up. */
export type MediaKind = "img" | "pdf";
export type MediaData = {
  src: string;
  mediaKind: MediaKind;
  label: string;
  [key: string]: unknown;
};
export type MediaNode = Node<MediaData>;

export function isMedia(node: { type?: string }): boolean {
  return node.type === "media";
}

export function createMedia(
  src: string,
  mediaKind: MediaKind,
  label: string,
  width: number,
  height: number,
): MediaNode {
  return {
    id: makeId("media"),
    type: "media",
    position: { x: 0, y: 0 },
    width,
    height,
    data: { src, mediaKind, label },
    draggable: false,
    selectable: false,
    deletable: false,
    zIndex: 0,
  };
}

export function createLane(index: number, width: number, startY: number): LaneNode {
  const palette = ["#31BAF0", "#6d28d9", "#2a5634", "#c8923a", "#9a2a2a", "#00037C"];
  return {
    id: makeId("lane"),
    type: "lane",
    position: { x: 0, y: startY },
    width: Math.max(620, width),
    height: LANE.defaultHeight,
    data: { label: `Lane ${index + 1}`, color: palette[index % palette.length] },
    zIndex: 0,
  };
}

/** A serialisable diagram (what we save to localStorage). */
export type DiagramDoc = {
  // May contain shape nodes and lane nodes, so type as the base Node.
  nodes: Node[];
  edges: BuilderEdge[];
};

/* ──────────────────────────────────────────────────────────────────────────
 * Canonical "process" shape — what the AI route / text parser emits.
 * The canvas only ever cares about BuilderNode, so we convert into it.
 * ────────────────────────────────────────────────────────────────────────── */

export type CanonicalNodeType = "start" | "end" | "task" | "decision";

export type CanonicalNode = {
  id: string;
  type: CanonicalNodeType;
  label: string;
};

export type CanonicalEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type CanonicalDiagram = {
  nodes: CanonicalNode[];
  edges: CanonicalEdge[];
};

/* ── Brand palette (matches the rest of Process Hub) ── */
const BRAND_BLUE = "#00037C";

const TYPE_STYLE: Record<
  CanonicalNodeType,
  { shape: NodeShape; color: string; fill: string; dashed: boolean }
> = {
  start: { shape: "circle", color: "#2a5634", fill: "#e9f4f3", dashed: false },
  end: { shape: "circle", color: "#9a2a2a", fill: "#fdeded", dashed: false },
  task: { shape: "rectangle", color: BRAND_BLUE, fill: "#eef0ff", dashed: false },
  decision: { shape: "diamond", color: "#c8923a", fill: "#fbf5e5", dashed: false },
};

const NEW_NODE_DEFAULTS: Record<
  NodeShape,
  { label: string; color: string; fill: string }
> = {
  rectangle: { label: "New step", color: BRAND_BLUE, fill: "#eef0ff" },
  circle: { label: "Step", color: "#2a5634", fill: "#eaf6ff" },
  diamond: { label: "Decision?", color: "#c8923a", fill: "#fbf5e5" },
};

/** A blank node for the toolbar "add" buttons. */
export function createNode(
  shape: NodeShape,
  position: { x: number; y: number },
): BuilderNode {
  const size = DEFAULT_SIZE[shape];
  const d = NEW_NODE_DEFAULTS[shape];
  return {
    id: makeId("n"),
    type: "custom",
    position,
    width: size.width,
    height: size.height,
    data: {
      texts: [d.label],
      shape,
      color: d.color,
      fill: d.fill,
      dashed: false,
    },
  };
}

let counter = 0;
/**
 * Unique id. Combines a per-session monotonic counter with a time + random
 * suffix so ids never collide across page reloads (a plain counter resets and
 * would clash with previously-persisted items). Only called from client-side
 * event handlers, so Date.now()/Math.random() are safe here.
 */
export function makeId(prefix: string) {
  counter += 1;
  const rand = Math.floor(Math.random() * 1e9).toString(36);
  return `${prefix}_${Date.now().toString(36)}_${counter}_${rand}`;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Convert a canonical diagram into editable canvas nodes/edges.
 * ────────────────────────────────────────────────────────────────────────── */

export function canonicalToBuilder(diagram: CanonicalDiagram): DiagramDoc {
  const nodes: BuilderNode[] = diagram.nodes.map((n) => {
    const style = TYPE_STYLE[n.type] ?? TYPE_STYLE.task;
    const size = DEFAULT_SIZE[style.shape];
    return {
      id: n.id,
      type: "custom",
      position: { x: 0, y: 0 },
      width: size.width,
      height: size.height,
      data: {
        texts: [n.label],
        shape: style.shape,
        color: style.color,
        fill: style.fill,
        dashed: style.dashed,
      },
    };
  });

  const edges: BuilderEdge[] = diagram.edges.map((e) =>
    styledEdge(e.id, e.source, e.target, e.label),
  );

  return { nodes, edges };
}

/** A default-styled edge (smoothstep, grey, colour-following arrow marker). */
export function styledEdge(
  id: string,
  source: string,
  target: string,
  label?: string,
): BuilderEdge {
  return {
    id,
    source,
    target,
    label,
    type: "smoothstep",
    // Custom marker whose colour follows the line stroke (see ProcessBuilder defs).
    markerEnd: "ep-arrow",
    style: { stroke: "#7a7a7a", strokeWidth: 1.8 },
    labelStyle: { fontFamily: "'Manrope', sans-serif", fontSize: 12, fill: "#3f3f38", fontWeight: 600 },
    labelBgStyle: { fill: "#fff", fillOpacity: 0.9 },
    labelBgPadding: [6, 3] as [number, number],
    labelBgBorderRadius: 4,
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Convert the editable canvas back into the canonical schema, so the AI can be
 * given the current diagram as context and return an updated version.
 * ────────────────────────────────────────────────────────────────────────── */

function inferType(
  node: Node,
  incoming: Set<string>,
  outgoing: Set<string>,
): CanonicalNodeType {
  const shape = (node.data as BuilderNodeData | undefined)?.shape;
  if (shape === "diamond") return "decision";
  if (shape === "circle") {
    if (!incoming.has(node.id)) return "start";
    if (!outgoing.has(node.id)) return "end";
  }
  return "task";
}

export function builderToCanonical(nodes: Node[], edges: Edge[]): CanonicalDiagram {
  const custom = nodes.filter((n) => n.type === "custom");
  const ids = new Set(custom.map((n) => n.id));
  const incoming = new Set(edges.map((e) => e.target));
  const outgoing = new Set(edges.map((e) => e.source));
  return {
    nodes: custom.map((n) => ({
      id: n.id,
      type: inferType(n, incoming, outgoing),
      label: (n.data as BuilderNodeData).texts?.[0] ?? "",
    })),
    edges: edges
      .filter((e) => ids.has(e.source) && ids.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: typeof e.label === "string" ? e.label : undefined,
      })),
  };
}

/**
 * Apply an AI-returned canonical diagram onto the current canvas, preserving
 * the styling/position/popup of any node that already exists (matched by id),
 * and only re-running layout when the structure actually changed.
 */
export function applyCanonical(
  prevNodes: Node[],
  prevEdges: Edge[],
  canonical: CanonicalDiagram,
): { nodes: Node[]; edges: Edge[]; relayout: boolean } {
  const prevCustom = new Map(prevNodes.filter((n) => n.type === "custom").map((n) => [n.id, n]));
  const others = prevNodes.filter((n) => n.type !== "custom"); // lanes, media
  let relayout = false;

  const nodes: Node[] = canonical.nodes.map((cn) => {
    const prev = prevCustom.get(cn.id);
    if (prev) {
      const d = prev.data as BuilderNodeData;
      const texts = d.texts && d.texts.length ? [...d.texts] : [""];
      texts[0] = cn.label;
      return { ...prev, data: { ...d, texts } };
    }
    relayout = true;
    const style = TYPE_STYLE[cn.type] ?? TYPE_STYLE.task;
    const size = DEFAULT_SIZE[style.shape];
    return {
      id: cn.id,
      type: "custom",
      position: { x: 0, y: 0 },
      width: size.width,
      height: size.height,
      data: { texts: [cn.label], shape: style.shape, color: style.color, fill: style.fill, dashed: style.dashed },
    };
  });
  if (nodes.length !== prevCustom.size) relayout = true;

  const prevEdgeById = new Map(prevEdges.map((e) => [e.id, e]));
  const edges: Edge[] = canonical.edges.map((ce) => {
    const prev = prevEdgeById.get(ce.id);
    if (prev) return { ...prev, source: ce.source, target: ce.target, label: ce.label };
    return styledEdge(ce.id, ce.source, ce.target, ce.label);
  });

  return { nodes: [...others, ...nodes], edges, relayout };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Auto-layout (dagre, top-to-bottom). Only run on generate and on "Tidy".
 * ────────────────────────────────────────────────────────────────────────── */

function nodeSize(node: Node) {
  const shape = (node.data as BuilderNodeData | undefined)?.shape;
  const fallback = (shape && DEFAULT_SIZE[shape]) || DEFAULT_SIZE.rectangle;
  return {
    width: typeof node.width === "number" ? node.width : fallback.width,
    height: typeof node.height === "number" ? node.height : fallback.height,
  };
}

export function layoutDiagram(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB",
): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 70, ranksep: 90, marginx: 40, marginy: 40 });

  // Lanes, media backdrops and parented nodes are positioned by hand, not dagre.
  const laidOut = nodes.filter((n) => !isLane(n) && !isMedia(n) && !n.parentId);
  const sizes = new Map<string, { width: number; height: number }>();
  laidOut.forEach((node) => {
    const size = nodeSize(node);
    sizes.set(node.id, size);
    g.setNode(node.id, size);
  });
  edges.forEach((edge) => {
    if (sizes.has(edge.source) && sizes.has(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    const size = sizes.get(node.id);
    if (!pos || !size) return node;
    return {
      ...node,
      // dagre centres nodes; React Flow positions by top-left.
      position: { x: pos.x - size.width / 2, y: pos.y - size.height / 2 },
    };
  });
}

/* ──────────────────────────────────────────────────────────────────────────
 * Deterministic text parser (fallback when no AI key is configured, and the
 * engine that runs entirely in the browser).
 *
 * Format:
 *   Start: New hire needed
 *   Create JD
 *   Decision: Goldenday needed?
 *   - Yes: Run Goldenday process
 *   - No: Skip Goldenday
 *   End: Posting complete
 * ────────────────────────────────────────────────────────────────────────── */

export function parseProcessText(input: string): CanonicalDiagram {
  const lines = input
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const nodes: CanonicalNode[] = [];
  const edges: CanonicalEdge[] = [];
  // Unique ids so a parsed diagram never collides with ids already on the
  // canvas (which would make the apply-merge preserve the wrong node's style).
  const nextId = () => makeId("n");
  const edge = (source: string, target: string, label?: string) =>
    edges.push({ id: makeId("e"), source, target, label });

  // The node(s) the next plain line should flow from.
  let flowFrom: string[] = [];
  // The decision currently collecting its - Yes/- No branches.
  let openDecision: string | null = null;
  // Branch leaves that should re-converge into the next normal step.
  let pendingBranchLeaves: string[] = [];

  for (const raw of lines) {
    const branchMatch = /^-\s*(yes|no|[^:]+):\s*(.+)$/i.exec(raw);

    if (branchMatch && openDecision) {
      const label = branchMatch[1].trim();
      const text = branchMatch[2].trim();
      const id = nextId();
      nodes.push({ id, type: "task", label: text });
      edge(openDecision, id, capitalize(label));
      pendingBranchLeaves.push(id);
      continue;
    }

    // A non-branch line closes any open decision; its branch leaves re-converge.
    let type: CanonicalNodeType = "task";
    let label = raw;

    if (/^start:/i.test(raw)) {
      type = "start";
      label = raw.replace(/^start:/i, "").trim();
    } else if (/^end:/i.test(raw)) {
      type = "end";
      label = raw.replace(/^end:/i, "").trim();
    } else if (/^decision:/i.test(raw)) {
      type = "decision";
      label = raw.replace(/^decision:/i, "").trim();
    } else if (raw.endsWith("?")) {
      type = "decision";
    }

    const id = nextId();
    nodes.push({ id, type, label });

    // Connect from whatever currently feeds the flow.
    const sources = pendingBranchLeaves.length > 0 ? pendingBranchLeaves : flowFrom;
    sources.forEach((s) => edge(s, id));
    pendingBranchLeaves = [];

    if (type === "decision") {
      openDecision = id;
      flowFrom = [id];
    } else {
      openDecision = null;
      flowFrom = [id];
    }
  }

  return { nodes, edges };
}

function capitalize(s: string) {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

/* Loose runtime validation for whatever the AI returns. */
export function coerceCanonical(value: unknown): CanonicalDiagram | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.nodes) || !Array.isArray(v.edges)) return null;

  const validTypes: CanonicalNodeType[] = ["start", "end", "task", "decision"];
  const nodes: CanonicalNode[] = [];
  for (const raw of v.nodes) {
    if (!raw || typeof raw !== "object") continue;
    const n = raw as Record<string, unknown>;
    if (typeof n.id !== "string" || typeof n.label !== "string") continue;
    const type = validTypes.includes(n.type as CanonicalNodeType)
      ? (n.type as CanonicalNodeType)
      : "task";
    nodes.push({ id: n.id, type, label: n.label });
  }

  const ids = new Set(nodes.map((n) => n.id));
  const edges: CanonicalEdge[] = [];
  for (const raw of v.edges) {
    if (!raw || typeof raw !== "object") continue;
    const e = raw as Record<string, unknown>;
    if (typeof e.source !== "string" || typeof e.target !== "string") continue;
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    edges.push({
      id: typeof e.id === "string" ? e.id : `e_${edges.length + 1}`,
      source: e.source,
      target: e.target,
      label: typeof e.label === "string" ? e.label : undefined,
    });
  }

  if (nodes.length === 0) return null;
  return { nodes, edges };
}
