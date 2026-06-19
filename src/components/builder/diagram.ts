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

export type SwimlaneItem = {
  id: string;
  label: string;
  color?: string;
  width?: number;
  height?: number;
};

/** A structured swimlane board: role rows plus vertical stage columns. */
export type SwimlaneData = {
  title: string;
  rows: SwimlaneItem[];
  stages: SwimlaneItem[];
  color: string;
  rowHeaderWidth: number;
  stageHeaderHeight: number;
  [key: string]: unknown;
};
export type SwimlaneNode = Node<SwimlaneData>;

export const SWIMLANE = {
  defaultStageWidth: 240,
  defaultRowHeight: 150,
  rowHeaderWidth: 164,
  stageHeaderHeight: 56,
  minStageWidth: 120,
  minRowHeight: 92,
};

export function isSwimlane(node: { type?: string }): boolean {
  return node.type === "swimlane";
}

export function swimlaneStageWidth(stage: SwimlaneItem): number {
  return Math.max(SWIMLANE.minStageWidth, finiteOrDefault(stage.width, SWIMLANE.defaultStageWidth));
}

export function swimlaneRowHeight(row: SwimlaneItem): number {
  return Math.max(SWIMLANE.minRowHeight, finiteOrDefault(row.height, SWIMLANE.defaultRowHeight));
}

export function swimlaneStagesWidth(stages: SwimlaneItem[]): number {
  return stages.reduce((sum, stage) => sum + swimlaneStageWidth(stage), 0);
}

export function swimlaneRowsHeight(rows: SwimlaneItem[]): number {
  return rows.reduce((sum, row) => sum + swimlaneRowHeight(row), 0);
}

export function swimlaneBoardWidth(data: Pick<SwimlaneData, "rowHeaderWidth" | "stages">): number {
  return (data.rowHeaderWidth || SWIMLANE.rowHeaderWidth) + swimlaneStagesWidth(data.stages);
}

export function swimlaneBoardHeight(data: Pick<SwimlaneData, "stageHeaderHeight" | "rows">): number {
  return (data.stageHeaderHeight || SWIMLANE.stageHeaderHeight) + swimlaneRowsHeight(data.rows);
}

function finiteOrDefault(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function createSwimlane(position: { x: number; y: number }): SwimlaneNode {
  const rows = ["Role 1", "Role 2", "Role 3"].map((label) => ({
    id: makeId("row"),
    label,
    height: SWIMLANE.defaultRowHeight,
  }));
  const stages = ["Stage 1", "Stage 2", "Stage 3"].map((label) => ({
    id: makeId("stage"),
    label,
    width: SWIMLANE.defaultStageWidth,
  }));
  const data: SwimlaneData = {
    title: "Swimlane",
    rows,
    stages,
    color: BRAND_BLUE,
    rowHeaderWidth: SWIMLANE.rowHeaderWidth,
    stageHeaderHeight: SWIMLANE.stageHeaderHeight,
  };

  return {
    id: makeId("swimlane"),
    type: "swimlane",
    position,
    width: swimlaneBoardWidth(data),
    height: swimlaneBoardHeight(data),
    data,
    zIndex: 0,
  };
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
  /** Optional swimlane (actor/role) this step belongs to. */
  lane?: string;
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
  /** Optional ordered swimlanes (top to bottom). */
  lanes?: string[];
};

/** The lane names referenced by a canonical diagram, in order. */
function canonicalLaneNames(diagram: CanonicalDiagram): string[] {
  if (diagram.lanes && diagram.lanes.length) return diagram.lanes;
  const seen: string[] = [];
  for (const n of diagram.nodes) {
    if (n.lane && !seen.includes(n.lane)) seen.push(n.lane);
  }
  return seen;
}

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
  // Build any swimlanes the diagram references and map names → lane ids.
  const laneNames = canonicalLaneNames(diagram);
  const laneNodes: LaneNode[] = laneNames.map((name, i) => {
    const lane = createLane(i, LANE.defaultWidth, i * (LANE.defaultHeight + LANE.gap));
    return { ...lane, data: { ...lane.data, label: name } };
  });
  const laneIdByName = new Map(laneNames.map((name, i) => [name, laneNodes[i].id]));

  const nodes: BuilderNode[] = diagram.nodes.map((n) => {
    const style = TYPE_STYLE[n.type] ?? TYPE_STYLE.task;
    const size = DEFAULT_SIZE[style.shape];
    const laneId = n.lane ? laneIdByName.get(n.lane) : undefined;
    return {
      id: n.id,
      type: "custom",
      position: { x: 0, y: 0 },
      width: size.width,
      height: size.height,
      ...(laneId ? { parentId: laneId, extent: "parent" as const } : {}),
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

  return { nodes: [...laneNodes, ...nodes], edges };
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

  const lanes = nodes.filter(isLane);
  const laneNameById = new Map(lanes.map((l) => [l.id, (l.data as LaneData).label]));
  const laneNames = lanes
    .slice()
    .sort((a, b) => a.position.y - b.position.y)
    .map((l) => (l.data as LaneData).label);

  return {
    nodes: custom.map((n) => ({
      id: n.id,
      type: inferType(n, incoming, outgoing),
      label: (n.data as BuilderNodeData).texts?.[0] ?? "",
      ...(n.parentId && laneNameById.has(n.parentId)
        ? { lane: laneNameById.get(n.parentId) }
        : {}),
    })),
    edges: edges
      .filter((e) => ids.has(e.source) && ids.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: typeof e.label === "string" ? e.label : undefined,
      })),
    ...(laneNames.length ? { lanes: laneNames } : {}),
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
  const prevLanes = prevNodes.filter(isLane);
  const media = prevNodes.filter(isMedia);
  let relayout = false;

  // Reconcile swimlanes: reuse an existing lane when the name matches, else make one.
  const laneNames = canonicalLaneNames(canonical);
  const laneByName = new Map(prevLanes.map((l) => [(l.data as LaneData).label, l]));
  const laneIdByName = new Map<string, string>();
  const laneNodes: Node[] = laneNames.map((name, i) => {
    const existing = laneByName.get(name);
    if (existing) {
      laneIdByName.set(name, existing.id);
      return existing;
    }
    relayout = true;
    const lane = createLane(i, LANE.defaultWidth, 0);
    const made: Node = { ...lane, data: { ...lane.data, label: name } };
    laneIdByName.set(name, made.id);
    return made;
  });
  const finalLanes = laneNames.length ? laneNodes : prevLanes;

  const nodes: Node[] = canonical.nodes.map((cn) => {
    const prev = prevCustom.get(cn.id);
    const laneId = cn.lane ? laneIdByName.get(cn.lane) : undefined;
    if (prev) {
      const d = prev.data as BuilderNodeData;
      const texts = d.texts && d.texts.length ? [...d.texts] : [""];
      texts[0] = cn.label;
      const node: Node = { ...prev, data: { ...d, texts } };
      if (laneId !== prev.parentId) {
        relayout = true;
        node.parentId = laneId;
        node.extent = laneId ? "parent" : undefined;
      }
      return node;
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
      ...(laneId ? { parentId: laneId, extent: "parent" as const } : {}),
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

  return { nodes: [...media, ...finalLanes, ...nodes], edges, relayout };
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

  // Lanes, swimlane boards, media backdrops and parented nodes are positioned by hand, not dagre.
  const laidOut = nodes.filter((n) => !isLane(n) && !isSwimlane(n) && !isMedia(n) && !n.parentId);
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

/**
 * Swimlane-aware layout. dagre (left-to-right) decides the logical column order
 * from the edges; each step is then placed in its lane's row at its column's x,
 * vertically centred. Columns line up across lanes, and lanes are resized and
 * stacked to fit. Nodes with no lane are floated in a strip above the lanes.
 */
export function layoutLaned(nodes: Node[], edges: Edge[]): Node[] {
  const lanes = nodes.filter(isLane);
  if (lanes.length === 0) return layoutDiagram(nodes, edges);
  const media = nodes.filter(isMedia);
  const flow = nodes.filter((n) => n.type === "custom");

  // 1) Column order via a left-to-right dagre pass over the flow graph.
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 80, marginx: 0, marginy: 0 });
  const size = new Map<string, { width: number; height: number }>();
  flow.forEach((n) => {
    const s = nodeSize(n);
    size.set(n.id, s);
    g.setNode(n.id, s);
  });
  edges.forEach((e) => {
    if (size.has(e.source) && size.has(e.target)) g.setEdge(e.source, e.target);
  });
  dagre.layout(g);

  // 2) Bucket each node's dagre x into a column index (same rank ⇒ same x in LR).
  const xOf = (id: string) => Math.round(g.node(id)?.x ?? 0);
  const columnXs = [...new Set(flow.map((n) => xOf(n.id)))].sort((a, b) => a - b);
  const colIndex = new Map(columnXs.map((x, i) => [x, i]));
  const colOf = (id: string) => colIndex.get(xOf(id)) ?? 0;

  // 3) Column widths and x offsets (aligned across all lanes).
  const COL_GAP = 64;
  const colWidth = columnXs.map(() => 120);
  flow.forEach((n) => {
    const c = colOf(n.id);
    colWidth[c] = Math.max(colWidth[c], size.get(n.id)!.width);
  });
  const colX: number[] = [];
  let cursor = LANE.headerWidth + 40;
  columnXs.forEach((_, i) => {
    colX[i] = cursor;
    cursor += colWidth[i] + COL_GAP;
  });
  const laneWidth = Math.max(620, cursor + 8);

  // 4) Lane heights (fit tallest child) and vertical stacking.
  const laneOrder = [...lanes].sort((a, b) => a.position.y - b.position.y);
  const laneHeight = new Map<string, number>();
  laneOrder.forEach((l) => {
    const tallest = Math.max(0, ...flow.filter((n) => n.parentId === l.id).map((n) => size.get(n.id)!.height));
    laneHeight.set(l.id, Math.max(LANE.defaultHeight, tallest + 80));
  });

  let y = 0;
  const newLanes: Node[] = laneOrder.map((l) => {
    const h = laneHeight.get(l.id)!;
    const node: Node = { ...l, position: { x: 0, y }, width: laneWidth, height: h };
    y += h + LANE.gap;
    return node;
  });
  const lanesBottom = y;

  // 5) Place each step at its column x, centred in its lane (relative coords);
  //    unlaned steps float in a strip above the lanes (absolute coords).
  let floatX = LANE.headerWidth + 40;
  const newFlow: Node[] = flow.map((n) => {
    const c = colOf(n.id);
    const s = size.get(n.id)!;
    if (n.parentId && laneHeight.has(n.parentId)) {
      const h = laneHeight.get(n.parentId)!;
      return { ...n, extent: "parent" as const, position: { x: colX[c], y: (h - s.height) / 2 } };
    }
    const x = floatX;
    floatX += s.width + COL_GAP;
    return { ...n, parentId: undefined, extent: undefined, position: { x, y: lanesBottom + 24 } };
  });

  return [...media, ...newLanes, ...newFlow];
}

/** Pick the right layout: swimlane-aware when lanes exist, else plain dagre. */
export function autoLayout(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB",
): Node[] {
  return nodes.some(isLane) ? layoutLaned(nodes, edges) : layoutDiagram(nodes, edges, direction);
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
    nodes.push({
      id: n.id,
      type,
      label: n.label,
      ...(typeof n.lane === "string" && n.lane.trim() ? { lane: n.lane.trim() } : {}),
    });
  }

  const lanes = Array.isArray(v.lanes)
    ? (v.lanes.filter((l) => typeof l === "string" && l.trim()) as string[])
    : undefined;

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
  return { nodes, edges, ...(lanes && lanes.length ? { lanes } : {}) };
}
