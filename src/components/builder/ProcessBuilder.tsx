"use client";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  ViewportPortal,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Node,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CustomNode } from "./CustomNode";
import { LaneNode } from "./LaneNode";
import { MediaNode } from "./MediaNode";
import { usePresenting } from "@/components/presentation";
import {
  applyCanonical,
  builderToCanonical,
  canonicalToBuilder,
  createLane,
  createMedia,
  createNode,
  hasPopup,
  isLane,
  isMedia,
  layoutDiagram,
  makeId,
  normalizePopup,
  parseProcessText,
  coerceCanonical,
  LANE,
  type BuilderEdge,
  type BuilderNode,
  type BuilderNodeData,
  type DiagramDoc,
  type LaneData,
  type MediaKind,
  type NodePopup,
  type NodeShape,
  type PopupLink,
} from "./diagram";

const FF = "'Manrope', sans-serif";
const BRAND_BLUE = "#00037C";
const ACCENT = "#31BAF0";
const LIB_KEY = "process-hub.builder.library.v1";
const AI_PREFS_KEY = "process-hub.builder.ai-prefs.v1";

type ChatMsg = { role: "user" | "assistant"; content: string; applied?: boolean };
type AiStatus = { configured: boolean; envVar: string; model: string; provider: string };
type AiPrefs = { styleNotes: string; palette: string[]; reference: string };
const DEFAULT_PREFS: AiPrefs = { styleNotes: "", palette: [], reference: "" };

const STARTER_PROMPTS = [
  "Map our employee onboarding process",
  "Draft an invoice approval workflow with a manager sign-off",
  "Create an incident response process with a severity decision",
];

function readPrefs(): AiPrefs {
  try {
    const raw = window.localStorage.getItem(AI_PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as AiPrefs) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

const SAMPLE_TEXT = `Start: New hire needed
Create JD
Create job post
Post live
Decision: Goldenday needed?
- Yes: Run Goldenday process
- No: Skip Goldenday
End: Posting complete`;

const COLOR_SWATCHES = [
  "#00037C",
  "#31BAF0",
  "#2a5634",
  "#c8923a",
  "#9a2a2a",
  "#6d28d9",
  "#0f172a",
];

const defaultEdgeOptions = {
  type: "smoothstep" as const,
  markerEnd: "ep-arrow",
  style: { stroke: "#7a7a7a", strokeWidth: 1.8 },
};

/* Edge endpoint markers whose fill/stroke follows the line colour (context-stroke). */
function EdgeMarkerDefs() {
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

type EndCap = "none" | "ep-arrow" | "ep-arrow-open" | "ep-circle" | "ep-circle-open";
type LineStyle = "solid" | "dashed" | "dotted";

function readEdgeStyle(e: BuilderEdge) {
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

function applyEdgePatch(
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

const nodeTypes = { custom: CustomNode, lane: LaneNode, media: MediaNode };

/** Stack order: media backdrop, then lanes (parents before children), then shapes. */
function orderNodes(nodes: Node[]): Node[] {
  const media = nodes.filter((n) => isMedia(n));
  const lanes = nodes.filter((n) => isLane(n));
  const rest = nodes.filter((n) => !isMedia(n) && !isLane(n));
  return [...media, ...lanes, ...rest];
}

/* ──────────────────────────────────────────────────────────────────────────
 * Library store (localStorage) — folders + saved/archived diagrams.
 * ────────────────────────────────────────────────────────────────────────── */
type LibraryItem = {
  id: string;
  name: string;
  folder: string;
  archived: boolean;
  /** "media" items are an uploaded file you mark up; "flow" is a built diagram. */
  kind?: "flow" | "media";
  doc: DiagramDoc;
};
type LibraryStore = { folders: string[]; items: LibraryItem[] };

const EMPTY_STORE: LibraryStore = { folders: ["Unsorted"], items: [] };

function buildDoc(text: string): DiagramDoc {
  const built = canonicalToBuilder(parseProcessText(text));
  return { nodes: layoutDiagram(built.nodes, built.edges), edges: built.edges };
}

function seededStore(): LibraryStore {
  return {
    folders: ["Neos Intelligence", "Internal Processes", "Unsorted"],
    items: [
      {
        id: makeId("lib"),
        name: "Hire to Retire Process Map",
        folder: "Unsorted",
        archived: false,
        doc: buildDoc(SAMPLE_TEXT),
      },
      {
        id: makeId("lib"),
        name: "AI Lab Pilot Conceptual Model",
        folder: "Unsorted",
        archived: false,
        doc: buildDoc(
          "Start: Idea\nDefine hypothesis\nRun pilot\nDecision: Promising?\n- Yes: Scale up\n- No: Archive learnings\nEnd: Decision logged",
        ),
      },
      {
        id: makeId("lib"),
        name: "Physical AI Conceptual Model",
        folder: "Unsorted",
        archived: false,
        doc: buildDoc(
          "Start: Sensor input\nPerceive\nPlan\nAct\nEnd: Outcome",
        ),
      },
    ],
  };
}

function readStore(): LibraryStore {
  try {
    const raw = window.localStorage.getItem(LIB_KEY);
    if (!raw) {
      const seeded = seededStore();
      window.localStorage.setItem(LIB_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as LibraryStore;
  } catch {
    return EMPTY_STORE;
  }
}

function writeStore(store: LibraryStore): boolean {
  try {
    window.localStorage.setItem(LIB_KEY, JSON.stringify(store));
    return true;
  } catch {
    // Most likely the localStorage quota (large PDFs/images).
    return false;
  }
}

/** Read a File as a data URL. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Natural pixel size of an image data URL, capped to a sensible canvas size. */
function imageSize(src: string): Promise<{ width: number; height: number }> {
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

/* ──────────────────────────────────────────────────────────────────────────
 * Builder
 * ────────────────────────────────────────────────────────────────────────── */
function BuilderInner() {
  const { screenToFlowPosition, fitView, getIntersectingNodes, getInternalNode } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFolderRef = useRef<string>("Unsorted");
  const presenting = usePresenting();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<BuilderEdge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openPopupId, setOpenPopupId] = useState<string | null>(null);
  const [direction, setDirection] = useState<"TB" | "LR">("TB");
  const isMediaDoc = useMemo(() => nodes.some((n) => isMedia(n)), [nodes]);

  // Shapes (not lanes/media) currently selected — drives the alignment bar.
  const alignTargets = useMemo(
    () => nodes.filter((n) => selectedIds.includes(n.id) && !isLane(n) && !isMedia(n)),
    [nodes, selectedIds],
  );

  const popupNode = useMemo(
    () => (openPopupId ? nodes.find((n) => n.id === openPopupId) ?? null : null),
    [nodes, openPopupId],
  );

  // Library state — initialised once on the client (avoids SSR mismatch).
  const [lib, setLib] = useState<{ store: LibraryStore; ready: boolean }>({
    store: EMPTY_STORE,
    ready: false,
  });

  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [title, setTitle] = useState("Untitled diagram");

  const [aiOpen, setAiOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genNote, setGenNote] = useState<string | null>(null);

  // Conversational AI state
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [prefs, setPrefs] = useState<AiPrefs>(DEFAULT_PREFS);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const ensureLib = useCallback(() => {
    if (lib.ready) return lib.store;
    const store = readStore();
    setLib({ store, ready: true });
    return store;
  }, [lib]);

  // Populate the library + AI prefs on mount (client-only → no SSR mismatch).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setLib({ store: readStore(), ready: true });
    setPrefs(readPrefs());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Check whether a live AI key is configured the first time the panel opens.
  useEffect(() => {
    if (!aiOpen || aiStatus) return;
    fetch("/api/converge")
      .then((r) => r.json())
      .then((s: AiStatus) => setAiStatus(s))
      .catch(() => setAiStatus({ configured: false, envVar: "ANTHROPIC_API_KEY", model: "", provider: "anthropic" }));
  }, [aiOpen, aiStatus]);

  const commitLib = useCallback((store: LibraryStore) => {
    const ok = writeStore(store);
    setLib({ store, ready: true });
    if (!ok) setGenNote("Couldn't save — the file may be too large for browser storage.");
    return ok;
  }, []);

  // Re-fit the diagram when entering presentation mode.
  useEffect(() => {
    if (presenting) window.setTimeout(() => fitView({ padding: 0.12, duration: 400 }), 80);
  }, [presenting, fitView]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId],
  );
  const selectedEdge = useMemo(
    () => (edges as BuilderEdge[]).find((e) => e.id === selectedEdgeId) ?? null,
    [edges, selectedEdgeId],
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges],
  );

  // Only react to *positive* selections here. Clearing happens on pane click —
  // otherwise re-styling an edge (which momentarily drops RF's selection) would
  // close the inspector out from under the user.
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    if (params.nodes.length >= 1) {
      setSelectedIds(params.nodes.map((n) => n.id));
      setSelectedId(params.nodes.length === 1 ? params.nodes[0].id : null);
      setSelectedEdgeId(null);
    } else if (params.edges.length === 1) {
      setSelectedEdgeId(params.edges[0].id);
      setSelectedId(null);
      setSelectedIds([]);
    }
  }, []);

  const onNodeClick = useCallback((_e: React.MouseEvent, node: Node) => {
    if (isLane(node) || isMedia(node)) {
      setOpenPopupId(null);
      return;
    }
    const data = node.data as BuilderNodeData;
    setOpenPopupId((prev) => (hasPopup(data) ? (prev === node.id ? null : node.id) : null));
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedId(null);
    setSelectedEdgeId(null);
    setSelectedIds([]);
    setOpenPopupId(null);
  }, []);

  const patchEdge = useCallback(
    (patch: Partial<{ color: string; lineStyle: LineStyle; endCap: EndCap; startCap: EndCap; label: string }>) => {
      if (!selectedEdgeId) return;
      setEdges((eds) =>
        eds.map((e) => (e.id === selectedEdgeId ? applyEdgePatch(e as BuilderEdge, patch) : e)),
      );
    },
    [selectedEdgeId, setEdges],
  );

  const deleteEdge = useCallback(() => {
    if (!selectedEdgeId) return;
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  }, [selectedEdgeId, setEdges]);

  /* ── Add node at viewport centre ── */
  const addShape = useCallback(
    (shape: NodeShape) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      const center = rect
        ? screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        : { x: 0, y: 0 };
      const node = createNode(shape, { x: center.x - 90, y: center.y - 45 });
      setNodes((nds) => orderNodes([...nds, node]));
    },
    [screenToFlowPosition, setNodes],
  );

  /* ── Add a swim lane, stacked beneath any existing lanes ── */
  const addLane = useCallback(() => {
    setNodes((nds) => {
      const lanes = nds.filter((n) => isLane(n));
      const bottom = lanes.reduce(
        (max, l) => Math.max(max, l.position.y + (typeof l.height === "number" ? l.height : LANE.defaultHeight)),
        0,
      );
      const width = wrapperRef.current
        ? Math.max(720, wrapperRef.current.getBoundingClientRect().width / 1.1)
        : LANE.defaultWidth;
      const lane = createLane(lanes.length, width, lanes.length ? bottom + LANE.gap : 0);
      return orderNodes([...nds, lane]);
    });
    window.setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 60);
  }, [fitView, setNodes]);

  /* ── On drop: parent a shape to the lane under it and snap it centre ── */
  const onNodeDragStop = useCallback(
    (_e: React.MouseEvent, node: Node) => {
      if (isLane(node)) return;

      const lane = getIntersectingNodes(node).find((n) => isLane(n));
      const abs = getInternalNode(node.id)?.internals.positionAbsolute ?? node.position;
      const nodeH =
        node.measured?.height ?? (typeof node.height === "number" ? node.height : 88);

      setNodes((nds) =>
        orderNodes(
          nds.map((n) => {
            if (n.id !== node.id) return n;
            if (lane) {
              const laneAbs = getInternalNode(lane.id)?.internals.positionAbsolute ?? lane.position;
              const laneH =
                lane.measured?.height ?? (typeof lane.height === "number" ? lane.height : LANE.defaultHeight);
              return {
                ...n,
                parentId: lane.id,
                extent: "parent" as const,
                // keep horizontal position, snap to the lane's vertical centre
                position: { x: Math.max(LANE.headerWidth + 16, abs.x - laneAbs.x), y: (laneH - nodeH) / 2 },
              };
            }
            if (n.parentId) {
              // dragged out of every lane → detach, restore absolute position
              return { ...n, parentId: undefined, extent: undefined, position: abs };
            }
            return n;
          }),
        ),
      );
    },
    [getIntersectingNodes, getInternalNode, setNodes],
  );

  const tidy = useCallback(() => {
    setNodes((nds) => {
      const hasLanes = nds.some((n) => isLane(n));
      if (!hasLanes) return orderNodes(layoutDiagram(nds, edges as BuilderEdge[], direction));

      // With lanes present: re-centre each lane's children and space them evenly.
      return orderNodes(
        nds.map((n) => {
          if (isLane(n) || !n.parentId) return n;
          const lane = nds.find((l) => l.id === n.parentId);
          if (!lane) return n;
          const siblings = nds
            .filter((s) => s.parentId === n.parentId)
            .sort((a, b) => a.position.x - b.position.x);
          const idx = siblings.findIndex((s) => s.id === n.id);
          const laneH =
            lane.measured?.height ?? (typeof lane.height === "number" ? lane.height : LANE.defaultHeight);
          const nodeH = n.measured?.height ?? (typeof n.height === "number" ? n.height : 88);
          const nodeW = n.measured?.width ?? (typeof n.width === "number" ? n.width : 190);
          const step = nodeW + 60;
          return {
            ...n,
            position: { x: LANE.headerWidth + 40 + idx * step, y: (laneH - nodeH) / 2 },
          };
        }),
      );
    });
    window.setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 60);
  }, [direction, edges, fitView, setNodes]);

  const freshDiagram = useCallback(() => {
    if (nodes.length > 0 && !window.confirm("Start a fresh diagram? Unsaved changes are lost.")) return;
    setNodes([]);
    setEdges([]);
    setSelectedId(null);
    setCurrentItemId(null);
    setTitle("Untitled diagram");
    setGenNote(null);
  }, [nodes.length, setEdges, setNodes]);

  const loadTemplate = useCallback(() => {
    const doc = buildDoc(SAMPLE_TEXT);
    setNodes(doc.nodes);
    setEdges(doc.edges);
    setSelectedId(null);
    setCurrentItemId(null);
    setTitle("Untitled from template");
    window.setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 60);
  }, [fitView, setEdges, setNodes]);

  /* ── Converge with AI (conversational) ── */
  const savePrefs = useCallback((next: AiPrefs) => {
    setPrefs(next);
    try {
      window.localStorage.setItem(AI_PREFS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  // Apply an AI-returned canonical diagram, preserving styling/positions by id.
  const applyAiDiagram = useCallback(
    (canonical: ReturnType<typeof coerceCanonical>) => {
      if (!canonical) return;
      setNodes((prevNodes) => {
        const { nodes: merged, edges: mergedEdges, relayout } = applyCanonical(
          prevNodes,
          edges as BuilderEdge[],
          canonical,
        );
        setEdges(mergedEdges);
        const positioned = relayout ? layoutDiagram(merged, mergedEdges, direction) : merged;
        return orderNodes(positioned);
      });
      setSelectedId(null);
      setSelectedEdgeId(null);
      window.setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 80);
    },
    [direction, edges, fitView, setEdges, setNodes],
  );

  const sendChat = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || generating) return;
      const history: ChatMsg[] = [...messages, { role: "user", content: trimmed }];
      setMessages(history);
      setAiInput("");
      setGenerating(true);
      try {
        const res = await fetch("/api/converge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            diagram: builderToCanonical(nodes, edges as BuilderEdge[]),
            preferences: prefs,
          }),
        });
        const json = await res.json();
        const diagram = coerceCanonical(json.diagram);
        if (diagram) applyAiDiagram(diagram);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: json.reply ?? "Done.", applied: Boolean(diagram) },
        ]);
        if (json.source === "ai") {
          setAiStatus((s) => (s ? { ...s, configured: true } : s));
        }
      } catch {
        const diagram = parseProcessText(trimmed);
        applyAiDiagram(diagram);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "I'm offline, so I built that from your text with the built-in parser.", applied: true },
        ]);
      } finally {
        setGenerating(false);
      }
    },
    [applyAiDiagram, edges, generating, messages, nodes, prefs],
  );

  /* ── Save / Load / Library ops ── */
  const currentDoc = useCallback(
    (): DiagramDoc => ({ nodes: nodes as BuilderNode[], edges: edges as BuilderEdge[] }),
    [nodes, edges],
  );

  const save = useCallback(() => {
    const store = ensureLib();
    const name = title.trim() || "Untitled diagram";
    if (currentItemId) {
      const items = store.items.map((it) =>
        it.id === currentItemId ? { ...it, name, doc: currentDoc() } : it,
      );
      if (commitLib({ ...store, items })) setGenNote(`Saved "${name}".`);
      return;
    }
    // First save → drop it into the last folder; rename anytime via the title field.
    const folder = store.folders[store.folders.length - 1] ?? "Unsorted";
    const item: LibraryItem = { id: makeId("lib"), name, folder, archived: false, kind: "flow", doc: currentDoc() };
    if (commitLib({ ...store, items: [...store.items, item] })) {
      setCurrentItemId(item.id);
      setGenNote(`Saved "${name}" to ${folder}.`);
    }
  }, [commitLib, currentDoc, currentItemId, ensureLib, title]);

  const openItem = useCallback(
    (item: LibraryItem) => {
      setNodes(item.doc.nodes);
      setEdges(item.doc.edges);
      setSelectedId(null);
      setCurrentItemId(item.id);
      setTitle(item.name);
      window.setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 60);
    },
    [fitView, setEdges, setNodes],
  );

  const newFolder = useCallback(() => {
    const store = ensureLib();
    const name = window.prompt("New folder name:");
    if (!name || store.folders.includes(name)) return;
    commitLib({ ...store, folders: [...store.folders, name] });
  }, [commitLib, ensureLib]);

  const newInFolder = useCallback(
    (folder: string) => {
      const store = ensureLib();
      const item: LibraryItem = {
        id: makeId("lib"),
        name: "Untitled diagram",
        folder,
        archived: false,
        kind: "flow",
        doc: { nodes: [], edges: [] },
      };
      commitLib({ ...store, items: [...store.items, item] });
      setNodes([]);
      setEdges([]);
      setSelectedId(null);
      setCurrentItemId(item.id);
      setTitle("Untitled diagram");
    },
    [commitLib, ensureLib, setEdges, setNodes],
  );

  /* ── Upload a PDF / PNG / SVG into a folder as a markup-able diagram ── */
  const requestUpload = useCallback((folder: string) => {
    pendingFolderRef.current = folder;
    fileInputRef.current?.click();
  }, []);

  const onFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      const mediaKind: MediaKind = isPdf ? "pdf" : "img";
      let dataUrl: string;
      try {
        dataUrl = await readAsDataUrl(file);
      } catch {
        setGenNote("Couldn't read that file.");
        return;
      }

      const size = isPdf ? { width: 850, height: 1100 } : await imageSize(dataUrl);
      const name = file.name.replace(/\.[^.]+$/, "");
      const mediaNode = createMedia(dataUrl, mediaKind, name, size.width, size.height);
      const doc: DiagramDoc = { nodes: [mediaNode], edges: [] };

      const store = ensureLib();
      const folder = pendingFolderRef.current;
      const item: LibraryItem = { id: makeId("lib"), name, folder, archived: false, kind: "media", doc };
      if (!commitLib({ ...store, items: [...store.items, item] })) return;

      setNodes(doc.nodes);
      setEdges([]);
      setSelectedId(null);
      setSelectedEdgeId(null);
      setCurrentItemId(item.id);
      setTitle(name);
      setGenNote(`Imported "${file.name}". Add shapes or arrows to mark it up.`);
      window.setTimeout(() => fitView({ padding: 0.12, duration: 400 }), 80);
    },
    [commitLib, ensureLib, fitView, setEdges, setNodes],
  );

  const setArchived = useCallback(
    (itemId: string, archived: boolean) => {
      const store = ensureLib();
      commitLib({
        ...store,
        items: store.items.map((it) => (it.id === itemId ? { ...it, archived } : it)),
      });
    },
    [commitLib, ensureLib],
  );

  const deleteItem = useCallback(
    (itemId: string) => {
      const store = ensureLib();
      if (!window.confirm("Delete this diagram permanently?")) return;
      commitLib({ ...store, items: store.items.filter((it) => it.id !== itemId) });
      if (currentItemId === itemId) setCurrentItemId(null);
    },
    [commitLib, currentItemId, ensureLib],
  );

  /* ── Inspector edits ── */
  const patchSelected = useCallback(
    (patch: Record<string, unknown>) => {
      if (!selectedId) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n,
        ),
      );
    },
    [selectedId, setNodes],
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setNodes((nds) => {
      const target = nds.find((n) => n.id === selectedId);
      const lanePos = target?.position ?? { x: 0, y: 0 };
      return nds
        .filter((n) => n.id !== selectedId)
        .map((n) =>
          // Detach any children of a deleted lane back to absolute coordinates.
          n.parentId === selectedId
            ? {
                ...n,
                parentId: undefined,
                extent: undefined,
                position: { x: lanePos.x + n.position.x, y: lanePos.y + n.position.y },
              }
            : n,
        );
    });
    setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
  }, [selectedId, setEdges, setNodes]);

  /* ── Align / distribute the current multi-selection ── */
  const sizeOf = (n: Node) => ({
    w: n.measured?.width ?? (typeof n.width === "number" ? n.width : 170),
    h: n.measured?.height ?? (typeof n.height === "number" ? n.height : 80),
  });

  const alignSelected = useCallback(
    (mode: "left" | "centerH" | "right" | "top" | "middleV" | "bottom") => {
      setNodes((nds) => {
        const sel = nds.filter((n) => selectedIds.includes(n.id) && !isLane(n) && !isMedia(n));
        if (sel.length < 2) return nds;
        const b = sel.map((n) => ({ ...sizeOf(n), x: n.position.x, y: n.position.y }));
        const minX = Math.min(...b.map((p) => p.x));
        const maxR = Math.max(...b.map((p) => p.x + p.w));
        const minY = Math.min(...b.map((p) => p.y));
        const maxB = Math.max(...b.map((p) => p.y + p.h));
        const cx = (minX + maxR) / 2;
        const cy = (minY + maxB) / 2;
        const next = new Map<string, { x: number; y: number }>();
        sel.forEach((n, i) => {
          const p = b[i];
          let { x, y } = n.position;
          if (mode === "left") x = minX;
          else if (mode === "right") x = maxR - p.w;
          else if (mode === "centerH") x = cx - p.w / 2;
          else if (mode === "top") y = minY;
          else if (mode === "bottom") y = maxB - p.h;
          else if (mode === "middleV") y = cy - p.h / 2;
          next.set(n.id, { x, y });
        });
        return nds.map((n) => (next.has(n.id) ? { ...n, position: next.get(n.id)! } : n));
      });
    },
    [selectedIds, setNodes],
  );

  const distributeSelected = useCallback(
    (axis: "h" | "v") => {
      setNodes((nds) => {
        const sel = nds
          .filter((n) => selectedIds.includes(n.id) && !isLane(n) && !isMedia(n))
          .map((n) => ({ node: n, ...sizeOf(n) }))
          .sort((a, b) =>
            axis === "h"
              ? a.node.position.x - b.node.position.x
              : a.node.position.y - b.node.position.y,
          );
        if (sel.length < 3) return nds;
        const center = (s: (typeof sel)[number]) =>
          axis === "h" ? s.node.position.x + s.w / 2 : s.node.position.y + s.h / 2;
        const first = center(sel[0]);
        const last = center(sel[sel.length - 1]);
        const step = (last - first) / (sel.length - 1);
        const next = new Map<string, { x: number; y: number }>();
        sel.forEach((s, i) => {
          const c = first + step * i;
          next.set(
            s.node.id,
            axis === "h"
              ? { x: c - s.w / 2, y: s.node.position.y }
              : { x: s.node.position.x, y: c - s.h / 2 },
          );
        });
        return nds.map((n) => (next.has(n.id) ? { ...n, position: next.get(n.id)! } : n));
      });
    },
    [selectedIds, setNodes],
  );

  return (
    <div style={{ display: "flex", height: "100%", fontFamily: FF }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.svg,image/png,image/svg+xml,application/pdf"
        onChange={onFileSelected}
        style={{ display: "none" }}
      />

      {!presenting && (
        <LibraryPanel
          store={lib.store}
          ready={lib.ready}
          currentItemId={currentItemId}
          onReveal={ensureLib}
          onTemplate={loadTemplate}
          onFresh={freshDiagram}
          onAi={() => setAiOpen(true)}
          onOpenItem={openItem}
          onNewFolder={newFolder}
          onNewInFolder={newInFolder}
          onUploadToFolder={requestUpload}
          onArchive={(id) => setArchived(id, true)}
          onUnarchive={(id) => setArchived(id, false)}
          onDelete={deleteItem}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        {!presenting && (
          <Toolbar
            title={title}
            onTitleChange={setTitle}
            onAddBox={() => addShape("rectangle")}
            onAddCircle={() => addShape("circle")}
            onAddDiamond={() => addShape("diamond")}
            onAddLane={addLane}
            direction={direction}
            onDirection={setDirection}
            onTidy={tidy}
            onSave={save}
            onAi={() => setAiOpen(true)}
            note={genNote}
          />
        )}

        {!presenting && isMediaDoc && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 16px",
              background: "#fff7e6",
              borderBottom: "1px solid #f2e2bf",
              fontSize: 12.5,
              color: "#8a6d1f",
              fontWeight: 600,
            }}
          >
            <span aria-hidden="true">✎</span>
            Marking mode — add boxes, circles, diamonds or arrows on top of your file, then Save.
          </div>
        )}

        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <div ref={wrapperRef} style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onNodeDragStop={onNodeDragStop}
              defaultEdgeOptions={defaultEdgeOptions}
              deleteKeyCode={["Backspace", "Delete"]}
              selectionKeyCode="Shift"
              multiSelectionKeyCode={["Meta", "Shift"]}
              proOptions={{ hideAttribution: true }}
              fitView
              minZoom={0.2}
              maxZoom={2}
            >
              <Background color="#e7e7e7" gap={28} size={1} />
              <Controls showInteractive={false} />
              <MiniMap
                pannable
                zoomable
                nodeColor={(n) => ((n.data as BuilderNodeData)?.color as string) ?? BRAND_BLUE}
                style={{ background: "#fafafa" }}
              />
              {nodes.length === 0 && <EmptyState />}
              {popupNode && (
                <NodePopupCard
                  node={popupNode}
                  onClose={() => setOpenPopupId(null)}
                />
              )}
            </ReactFlow>
            <EdgeMarkerDefs />

            {alignTargets.length >= 2 && (
              <AlignBar
                count={alignTargets.length}
                onAlign={alignSelected}
                onDistribute={distributeSelected}
              />
            )}
          </div>

          {presenting ? null : selectedNode && isLane(selectedNode) ? (
            <LaneInspector
              node={selectedNode as Node<LaneData>}
              onPatch={(patch) => patchSelected(patch)}
              onDelete={deleteSelected}
              onClose={() => setSelectedId(null)}
            />
          ) : selectedNode ? (
            <Inspector
              node={selectedNode as BuilderNode}
              onPatch={patchSelected}
              onDelete={deleteSelected}
              onClose={() => setSelectedId(null)}
            />
          ) : selectedEdge ? (
            <EdgeInspector
              edge={selectedEdge}
              onPatch={patchEdge}
              onDelete={deleteEdge}
              onClose={() => setSelectedEdgeId(null)}
            />
          ) : null}
        </div>
      </div>

      {aiOpen && (
        <AiChat
          messages={messages}
          input={aiInput}
          setInput={setAiInput}
          onSend={sendChat}
          generating={generating}
          status={aiStatus}
          onClose={() => setAiOpen(false)}
          onOpenSettings={() => setSettingsOpen(true)}
          onClear={() => setMessages([])}
        />
      )}

      {settingsOpen && (
        <AiSettings prefs={prefs} onSave={savePrefs} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}

/* ───────────────────────────── Library panel ───────────────────────────── */
function LibraryPanel(props: {
  store: LibraryStore;
  ready: boolean;
  currentItemId: string | null;
  onReveal: () => void;
  onTemplate: () => void;
  onFresh: () => void;
  onAi: () => void;
  onOpenItem: (item: LibraryItem) => void;
  onNewFolder: () => void;
  onNewInFolder: (folder: string) => void;
  onUploadToFolder: (folder: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [addMenu, setAddMenu] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const active = props.store.items.filter((it) => !it.archived);
  const archived = props.store.items.filter((it) => it.archived);

  const byFolder = (folder: string) =>
    active.filter(
      (it) => it.folder === folder && (!q || it.name.toLowerCase().includes(q)),
    );

  return (
    <aside
      onMouseEnter={() => {
        if (!props.ready) props.onReveal();
      }}
      style={{
        width: 256,
        flexShrink: 0,
        borderRight: "1px solid #ececec",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        padding: "18px 16px",
        gap: 18,
      }}
    >
      {/* Generate */}
      <div>
        <SectionTitle>Generate</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          <GenCard label="Start From Template" onClick={props.onTemplate} icon={<TemplateIcon />} />
          <GenCard label="Fresh Diagram" onClick={props.onFresh} icon={<PaletteIcon />} />
          <GenCard label="Converge with AI" onClick={props.onAi} icon={<SparkIcon />} highlight />
        </div>
      </div>

      <Hr />

      {/* Library */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionTitle>Library</SectionTitle>
          <IconBtn title="New folder" onClick={props.onNewFolder}>
            <PlusGlyph />
          </IconBtn>
        </div>

        <div style={{ position: "relative", margin: "10px 0 6px" }}>
          <SearchGlyph />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={props.onReveal}
            placeholder="Search Processes"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "9px 10px 9px 32px",
              borderRadius: 10,
              border: "1px solid #e3e3e3",
              fontFamily: FF,
              fontSize: 13,
              outline: "none",
              color: "#2a2a2a",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {props.store.folders.map((folder) => {
            const items = byFolder(folder);
            const isCollapsed = collapsed[folder] ?? false;
            return (
              <div key={folder}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0" }}>
                  <button
                    type="button"
                    onClick={() => setCollapsed((c) => ({ ...c, [folder]: !isCollapsed }))}
                    style={chevBtn}
                    aria-label={isCollapsed ? "Expand" : "Collapse"}
                  >
                    <Chevron open={!isCollapsed} />
                  </button>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#1f1f1b" }}>
                    {folder}
                  </span>
                  <div style={{ position: "relative" }}>
                    <IconBtn
                      title={`Add to ${folder}`}
                      onClick={() => setAddMenu((m) => (m === folder ? null : folder))}
                    >
                      <PlusGlyph />
                    </IconBtn>
                    {addMenu === folder && (
                      <>
                        <div
                          onClick={() => setAddMenu(null)}
                          style={{ position: "fixed", inset: 0, zIndex: 40 }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 26,
                            right: 0,
                            zIndex: 41,
                            width: 196,
                            background: "#fff",
                            border: "1px solid #e4e4e4",
                            borderRadius: 10,
                            boxShadow: "0 12px 28px rgba(0,0,0,0.16)",
                            padding: 5,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <MenuItem
                            onClick={() => {
                              setAddMenu(null);
                              props.onNewInFolder(folder);
                            }}
                          >
                            ＋ Blank diagram
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              setAddMenu(null);
                              props.onUploadToFolder(folder);
                            }}
                          >
                            ⬆ Upload PDF / PNG / SVG
                          </MenuItem>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {!isCollapsed &&
                  items.map((it) => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      active={it.id === props.currentItemId}
                      onOpen={() => props.onOpenItem(it)}
                      onArchive={() => props.onArchive(it.id)}
                      onDelete={() => props.onDelete(it.id)}
                    />
                  ))}
                {!isCollapsed && items.length === 0 && (
                  <p style={{ margin: "0 0 6px 26px", fontSize: 12, color: "#bdbdbd" }}>Empty</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Hr />

      {/* Archive */}
      <div>
        <button
          type="button"
          onClick={() => {
            props.onReveal();
            setArchiveOpen((v) => !v);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "2px 0",
          }}
        >
          <ArchiveGlyph />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1f1f1b" }}>Archive</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#9a9a9a" }}>{archived.length}</span>
        </button>
        {archiveOpen &&
          archived.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              active={it.id === props.currentItemId}
              archivedRow
              onOpen={() => props.onOpenItem(it)}
              onArchive={() => props.onUnarchive(it.id)}
              onDelete={() => props.onDelete(it.id)}
            />
          ))}
      </div>
    </aside>
  );
}

function ItemRow(props: {
  item: LibraryItem;
  active: boolean;
  archivedRow?: boolean;
  onOpen: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        paddingLeft: 26,
        borderRadius: 7,
        background: props.active ? `${BRAND_BLUE}0d` : "transparent",
      }}
    >
      <button
        type="button"
        onClick={props.onOpen}
        title={props.item.name}
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: "left",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: "7px 2px",
          fontFamily: FF,
          fontSize: 13,
          color: props.active ? BRAND_BLUE : "#7c7c75",
          fontWeight: props.active ? 600 : 400,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {props.item.kind === "media" && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#fff",
              background: "#9a9a9a",
              borderRadius: 4,
              padding: "1px 4px",
              marginRight: 6,
              letterSpacing: "0.03em",
            }}
          >
            FILE
          </span>
        )}
        {props.item.name}
      </button>
      {hover && (
        <>
          <IconBtn title={props.archivedRow ? "Restore" : "Archive"} onClick={props.onArchive}>
            <ArchiveGlyph small />
          </IconBtn>
          <IconBtn title="Delete" onClick={props.onDelete}>
            <TrashGlyph />
          </IconBtn>
        </>
      )}
    </div>
  );
}

function GenCard({
  label,
  icon,
  onClick,
  highlight,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  highlight?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${highlight ? ACCENT : hover ? "#cfcfcf" : "#e6e6e6"}`,
        background: highlight ? `${ACCENT}12` : hover ? "#fafafa" : "#fff",
        cursor: "pointer",
        fontFamily: FF,
        fontSize: 14,
        fontWeight: 600,
        color: "#1f1f1b",
      }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ color: highlight ? ACCENT : "#6b6b66", display: "flex" }}>{icon}</span>
    </button>
  );
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111" }}>{children}</p>;
}
function Hr() {
  return <div style={{ height: 1, background: "#eee" }} />;
}

/* ───────────────────────────── Toolbar ───────────────────────────── */
function Toolbar(props: {
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

function TBtn({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: FF,
        fontSize: 13,
        fontWeight: 600,
        padding: "7px 12px",
        borderRadius: 8,
        border: `1px solid ${primary ? BRAND_BLUE : "#dcdcdc"}`,
        background: primary ? BRAND_BLUE : "#fff",
        color: primary ? "#fff" : "#2a2a2a",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 22, background: "#e4e4e4" }} />;
}

function FlowDirBtn({
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
function LaneInspector(props: {
  node: Node<LaneData>;
  onPatch: (patch: Partial<LaneData>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { node, onPatch } = props;
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

/* ───────────────────────────── AI modal ───────────────────────────── */
/* ───────────────────────────── AI chat drawer ───────────────────────────── */
function AiChat(props: {
  messages: ChatMsg[];
  input: string;
  setInput: (v: string) => void;
  onSend: (text: string) => void;
  generating: boolean;
  status: AiStatus | null;
  onClose: () => void;
  onOpenSettings: () => void;
  onClear: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [props.messages, props.generating]);

  const needsKey = props.status && !props.status.configured;

  return (
    <aside
      style={{
        width: 360,
        flexShrink: 0,
        borderLeft: "1px solid #ececec",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        fontFamily: FF,
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderBottom: "1px solid #ececec" }}>
        <span style={{ fontSize: 16 }}>✨</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#111" }}>Converge with AI</p>
          <p style={{ margin: 0, fontSize: 11, color: "#9a9a9a" }}>
            {props.status?.configured
              ? `Live · ${props.status.model}`
              : props.status
                ? "Offline parser (no key)"
                : "Checking…"}
          </p>
        </div>
        <IconBtn title="AI settings" onClick={props.onOpenSettings}>
          <GearGlyph />
        </IconBtn>
        {props.messages.length > 0 && (
          <IconBtn title="Clear conversation" onClick={props.onClear}>
            <TrashGlyph />
          </IconBtn>
        )}
        <IconBtn title="Close" onClick={props.onClose}>
          <span style={{ fontSize: 18, color: "#999", lineHeight: 1 }}>×</span>
        </IconBtn>
      </div>

      {/* Key setup banner */}
      {needsKey && (
        <div style={{ padding: "10px 14px", background: "#fff7e6", borderBottom: "1px solid #f2e2bf", fontSize: 12, color: "#7a5a1f", lineHeight: 1.5 }}>
          No AI key found. Add it to <code style={{ background: "#fbedcf", padding: "1px 4px", borderRadius: 4 }}>.env.local</code> in the
          project root and restart the dev server:
          <pre style={{ margin: "6px 0 0", background: "#fff", border: "1px solid #f0deb6", borderRadius: 6, padding: "8px 10px", fontSize: 11.5, overflowX: "auto", color: "#3f3f38" }}>
{`${props.status?.envVar ?? "ANTHROPIC_API_KEY"}=sk-ant-...`}
          </pre>
          You can still chat now — I&apos;ll build diagrams with the built-in parser until a key is set.
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
        {props.messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#6b6b66", lineHeight: 1.5 }}>
              Describe a process and I&apos;ll draw it on the canvas. Keep chatting to refine it —
              &ldquo;add an approval step&rdquo;, &ldquo;make it branch on budget&rdquo;, &ldquo;rename step 2&rdquo;.
            </p>
            {STARTER_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => props.onSend(p)}
                style={{
                  textAlign: "left",
                  border: "1px solid #e6e6e6",
                  borderRadius: 10,
                  background: "#fafafa",
                  padding: "10px 12px",
                  fontFamily: FF,
                  fontSize: 13,
                  color: "#2a2a2a",
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
        {props.messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "88%",
              background: m.role === "user" ? BRAND_BLUE : "#f2f3f7",
              color: m.role === "user" ? "#fff" : "#1f1f1b",
              borderRadius: 12,
              padding: "9px 12px",
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {m.content}
            {m.applied && (
              <div style={{ marginTop: 5, fontSize: 11, fontWeight: 700, color: m.role === "user" ? "#cfe6ff" : "#2a5634" }}>
                ✓ Applied to canvas
              </div>
            )}
          </div>
        ))}
        {props.generating && (
          <div style={{ alignSelf: "flex-start", background: "#f2f3f7", borderRadius: 12, padding: "9px 12px", fontSize: 13, color: "#6b6b66" }}>
            Thinking…
          </div>
        )}
      </div>

      {/* Composer */}
      <div style={{ borderTop: "1px solid #ececec", padding: 12, display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          value={props.input}
          onChange={(e) => props.setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              props.onSend(props.input);
            }
          }}
          placeholder="Describe or refine the process…"
          rows={2}
          style={{
            flex: 1,
            resize: "none",
            fontFamily: FF,
            fontSize: 13,
            lineHeight: 1.45,
            padding: "9px 11px",
            borderRadius: 10,
            border: "1px solid #dcdcdc",
            outline: "none",
            color: "#2a2a2a",
          }}
        />
        <button
          type="button"
          onClick={() => props.onSend(props.input)}
          disabled={props.generating || !props.input.trim()}
          style={{
            fontFamily: FF,
            fontSize: 13,
            fontWeight: 700,
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: props.generating || !props.input.trim() ? "#9aa0c8" : BRAND_BLUE,
            color: "#fff",
            cursor: props.generating || !props.input.trim() ? "default" : "pointer",
          }}
        >
          Send
        </button>
      </div>
    </aside>
  );
}

/* ───────────────────────────── AI settings ───────────────────────────── */
function AiSettings(props: { prefs: AiPrefs; onSave: (p: AiPrefs) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<AiPrefs>(props.prefs);
  const toggleColor = (c: string) =>
    setDraft((d) => ({
      ...d,
      palette: d.palette.includes(c) ? d.palette.filter((x) => x !== c) : [...d.palette, c],
    }));

  return (
    <div
      onClick={props.onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 480, maxWidth: "100%", maxHeight: "85vh", overflowY: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,0.3)", padding: 24, display: "flex", flexDirection: "column", gap: 16, fontFamily: FF }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111" }}>AI preferences</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b6b66" }}>
              These are sent with every message to tune the output — refine them over time for
              quicker, better diagrams.
            </p>
          </div>
          <button type="button" onClick={props.onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 22, color: "#999", lineHeight: 1 }} aria-label="Close">×</button>
        </div>

        <Field label="House style / conventions">
          <textarea
            value={draft.styleNotes}
            onChange={(e) => setDraft((d) => ({ ...d, styleNotes: e.target.value }))}
            placeholder="e.g. Top-to-bottom flow, concise verb-first labels, a diamond for every decision, one clear start and end."
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.45 }}
          />
        </Field>

        <Field label="Preferred colours">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleColor(c)}
                title={c}
                style={{ width: 26, height: 26, borderRadius: 7, background: c, border: draft.palette.includes(c) ? "3px solid #1f1f1b" : "1px solid #ddd", cursor: "pointer" }}
              />
            ))}
          </div>
        </Field>

        <Field label="Reference diagrams / examples">
          <textarea
            value={draft.reference}
            onChange={(e) => setDraft((d) => ({ ...d, reference: e.target.value }))}
            placeholder="Paste an example process, link conventions, or describe a reference diagram the AI should imitate."
            rows={4}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.45 }}
          />
        </Field>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={props.onClose} style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, padding: "10px 14px", borderRadius: 10, border: "1px solid #dcdcdc", background: "#fff", color: "#2a2a2a", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              props.onSave(draft);
              props.onClose();
            }}
            style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, padding: "10px 16px", borderRadius: 10, border: "none", background: BRAND_BLUE, color: "#fff", cursor: "pointer" }}
          >
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}

function GearGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ───────────────────────────── Inspector ───────────────────────────── */
/* ───────────────────────────── Node popup card ───────────────────────────── */
function normalizeHref(url: string) {
  const u = url.trim();
  if (!u) return "#";
  return /^(https?:|mailto:|tel:|\/)/i.test(u) ? u : `https://${u}`;
}

function NodePopupCard({ node, onClose }: { node: Node; onClose: () => void }) {
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
function AlignBar(props: {
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

function Inspector(props: {
  node: BuilderNode;
  onPatch: (patch: Partial<BuilderNodeData>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { node, onPatch } = props;
  const data = node.data;

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
const END_CAPS: { value: EndCap; label: string; glyph: string }[] = [
  { value: "none", label: "None", glyph: "—" },
  { value: "ep-arrow", label: "Arrow", glyph: "▶" },
  { value: "ep-arrow-open", label: "Open", glyph: "›" },
  { value: "ep-circle", label: "Dot", glyph: "●" },
  { value: "ep-circle-open", label: "Ring", glyph: "◦" },
];

function EdgeInspector(props: {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: "#8a8a82", textTransform: "uppercase" }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function Seg({
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

const inputStyle: React.CSSProperties = {
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
function EmptyState() {
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
function IconBtn({
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

function Chevron({ open }: { open: boolean }) {
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
const chevBtn: React.CSSProperties = {
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
function PlusGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function SearchGlyph() {
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
function ArchiveGlyph({ small }: { small?: boolean }) {
  const s = small ? 14 : 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="5" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function TrashGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TemplateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m13.5 11.5-4 4M16 13l-1.5-1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function PaletteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-.5-.2-.9-.5-1.2-.3-.4-.5-.8-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-3.9-4-7.4-9-7.4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="7.5" cy="11.5" r="1" fill="currentColor" />
      <circle cx="10.5" cy="7.5" r="1" fill="currentColor" />
      <circle cx="15" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="m12 3 1.7 4.6L18 9.3l-4.3 1.7L12 16l-1.7-5L6 9.3l4.3-1.7L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function ProcessBuilder() {
  return (
    <ReactFlowProvider>
      <BuilderInner />
    </ReactFlowProvider>
  );
}
