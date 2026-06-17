"use client";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
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
import { useUndoRedo } from "./useUndoRedo";
import { usePresenting } from "@/components/presentation";
import { Toolbar } from "./Toolbar";
import { LibraryPanel } from "./LibraryPanel";
import { AiChat, AiSettings } from "./AiChat";
import { Inspector, LaneInspector, EdgeInspector, NodePopupCard, AlignBar } from "./Inspectors";
import {
  FF,
  BRAND_BLUE,
  AI_PREFS_KEY,
  EdgeMarkerDefs,
  EmptyState,
  applyEdgePatch,
  buildDoc,
  imageSize,
  readAsDataUrl,
  readPrefs,
  libApi,
  EMPTY_STORE,
  DEFAULT_PREFS,
  SAMPLE_TEXT,
  type EndCap,
  type LineStyle,
  type ChatMsg,
  type AiStatus,
  type AiPrefs,
  type LibraryItem,
  type LibraryStore,
} from "./kit";
import {
  applyCanonical,
  builderToCanonical,
  createLane,
  createMedia,
  createNode,
  hasPopup,
  isLane,
  isMedia,
  autoLayout,
  parseProcessText,
  coerceCanonical,
  LANE,
  type BuilderEdge,
  type BuilderNode,
  type BuilderNodeData,
  type DiagramDoc,
  type LaneData,
  type MediaKind,
  type NodeShape,
} from "./diagram";

const defaultEdgeOptions = {
  type: "smoothstep" as const,
  markerEnd: "ep-arrow",
  style: { stroke: "#7a7a7a", strokeWidth: 1.8 },
};

const nodeTypes = { custom: CustomNode, lane: LaneNode, media: MediaNode };

/** Stack order: media backdrop, then lanes (parents before children), then shapes. */
function orderNodes(nodes: Node[]): Node[] {
  const media = nodes.filter((n) => isMedia(n));
  const lanes = nodes.filter((n) => isLane(n));
  const rest = nodes.filter((n) => !isMedia(n) && !isLane(n));
  return [...media, ...lanes, ...rest];
}

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

  const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo();

  // Cmd/Ctrl+Z to undo, Cmd/Ctrl+Shift+Z (or Ctrl+Y) to redo.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return; // let the field handle its own undo
      }
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

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

  // Load the library from Postgres + AI prefs from localStorage on mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(readPrefs());
    libApi
      .load()
      .then((store) => setLib({ store, ready: true }))
      .catch(() => {
        setLib({ store: EMPTY_STORE, ready: true });
        setGenNote("Couldn't reach the database. Run `npm run db:up` and `npm run db:migrate`.");
      });
  }, []);

  // Check whether a live AI key is configured the first time the panel opens.
  useEffect(() => {
    if (!aiOpen || aiStatus) return;
    fetch("/api/converge")
      .then((r) => r.json())
      .then((s: AiStatus) => setAiStatus(s))
      .catch(() => setAiStatus({ configured: false, envVar: "ANTHROPIC_API_KEY", model: "", provider: "anthropic" }));
  }, [aiOpen, aiStatus]);

  // Update local library state without a round-trip.
  const patchLibState = useCallback(
    (fn: (s: LibraryStore) => LibraryStore) => setLib((l) => ({ store: fn(l.store), ready: true })),
    [],
  );

  // Re-fit the diagram when entering presentation mode.
  useEffect(() => {
    if (presenting) window.setTimeout(() => fitView({ padding: 0.12, duration: 400 }), 80);
  }, [presenting, fitView]);

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
    (params: Connection) => {
      takeSnapshot();
      setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
    },
    [setEdges, takeSnapshot],
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
      takeSnapshot("edge");
      setEdges((eds) =>
        eds.map((e) => (e.id === selectedEdgeId ? applyEdgePatch(e as BuilderEdge, patch) : e)),
      );
    },
    [selectedEdgeId, setEdges, takeSnapshot],
  );

  const deleteEdge = useCallback(() => {
    if (!selectedEdgeId) return;
    takeSnapshot();
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  }, [selectedEdgeId, setEdges, takeSnapshot]);

  /* ── Add node at viewport centre ── */
  const addShape = useCallback(
    (shape: NodeShape) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      const center = rect
        ? screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        : { x: 0, y: 0 };
      const node = createNode(shape, { x: center.x - 90, y: center.y - 45 });
      takeSnapshot();
      setNodes((nds) => orderNodes([...nds, node]));
    },
    [screenToFlowPosition, setNodes, takeSnapshot],
  );

  /* ── Add a swim lane, stacked beneath any existing lanes ── */
  const addLane = useCallback(() => {
    takeSnapshot();
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
  }, [fitView, setNodes, takeSnapshot]);

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
    takeSnapshot();
    setNodes((nds) => orderNodes(autoLayout(nds, edges as BuilderEdge[], direction)));
    window.setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 60);
  }, [direction, edges, fitView, setNodes, takeSnapshot]);

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
      takeSnapshot();
      setNodes((prevNodes) => {
        const { nodes: merged, edges: mergedEdges, relayout } = applyCanonical(
          prevNodes,
          edges as BuilderEdge[],
          canonical,
        );
        setEdges(mergedEdges);
        const positioned = relayout ? autoLayout(merged, mergedEdges, direction) : merged;
        return orderNodes(positioned);
      });
      setSelectedId(null);
      setSelectedEdgeId(null);
      window.setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 80);
    },
    [direction, edges, fitView, setEdges, setNodes, takeSnapshot],
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

  const save = useCallback(async () => {
    const name = title.trim() || "Untitled diagram";
    try {
      if (currentItemId) {
        const updated = await libApi.update(currentItemId, { name, doc: currentDoc() });
        patchLibState((s) => ({ ...s, items: s.items.map((it) => (it.id === updated.id ? updated : it)) }));
        setGenNote(`Saved "${name}".`);
        return;
      }
      const folder = lib.store.folders[lib.store.folders.length - 1] ?? "Unsorted";
      const item = await libApi.create({ name, folder, kind: "flow", doc: currentDoc() });
      patchLibState((s) => ({ ...s, items: [...s.items, item] }));
      setCurrentItemId(item.id);
      setGenNote(`Saved "${name}" to ${folder}.`);
    } catch {
      setGenNote("Couldn't save to the database.");
    }
  }, [currentDoc, currentItemId, lib.store.folders, patchLibState, title]);

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

  const newFolder = useCallback(async () => {
    const name = window.prompt("New folder name:");
    if (!name || lib.store.folders.includes(name)) return;
    try {
      const created = await libApi.addFolder(name);
      patchLibState((s) => (s.folders.includes(created) ? s : { ...s, folders: [...s.folders, created] }));
    } catch {
      setGenNote("Couldn't create the folder.");
    }
  }, [lib.store.folders, patchLibState]);

  const newInFolder = useCallback(
    async (folder: string) => {
      try {
        const item = await libApi.create({ name: "Untitled diagram", folder, kind: "flow", doc: { nodes: [], edges: [] } });
        patchLibState((s) => ({ ...s, items: [...s.items, item] }));
        setNodes([]);
        setEdges([]);
        setSelectedId(null);
        setCurrentItemId(item.id);
        setTitle("Untitled diagram");
      } catch {
        setGenNote("Couldn't create the diagram.");
      }
    },
    [patchLibState, setEdges, setNodes],
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

      try {
        const item = await libApi.create({ name, folder: pendingFolderRef.current, kind: "media", doc });
        patchLibState((s) => ({ ...s, items: [...s.items, item] }));
        setNodes(doc.nodes);
        setEdges([]);
        setSelectedId(null);
        setSelectedEdgeId(null);
        setCurrentItemId(item.id);
        setTitle(name);
        setGenNote(`Imported "${file.name}". Add shapes or arrows to mark it up.`);
        window.setTimeout(() => fitView({ padding: 0.12, duration: 400 }), 80);
      } catch {
        setGenNote("Couldn't save the upload to the database.");
      }
    },
    [fitView, patchLibState, setEdges, setNodes],
  );

  const setArchived = useCallback(
    async (itemId: string, archived: boolean) => {
      try {
        const updated = await libApi.update(itemId, { archived });
        patchLibState((s) => ({ ...s, items: s.items.map((it) => (it.id === updated.id ? updated : it)) }));
      } catch {
        setGenNote("Couldn't update the diagram.");
      }
    },
    [patchLibState],
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      if (!window.confirm("Delete this diagram permanently?")) return;
      try {
        await libApi.remove(itemId);
        patchLibState((s) => ({ ...s, items: s.items.filter((it) => it.id !== itemId) }));
        if (currentItemId === itemId) setCurrentItemId(null);
      } catch {
        setGenNote("Couldn't delete the diagram.");
      }
    },
    [currentItemId, patchLibState],
  );

  /* ── Inspector edits ── */
  const patchSelected = useCallback(
    (patch: Record<string, unknown>) => {
      if (!selectedId) return;
      takeSnapshot("inspector");
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n,
        ),
      );
    },
    [selectedId, setNodes, takeSnapshot],
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    takeSnapshot();
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
  }, [selectedId, setEdges, setNodes, takeSnapshot]);

  /* ── Align / distribute the current multi-selection ── */
  const sizeOf = (n: Node) => ({
    w: n.measured?.width ?? (typeof n.width === "number" ? n.width : 170),
    h: n.measured?.height ?? (typeof n.height === "number" ? n.height : 80),
  });

  const alignSelected = useCallback(
    (mode: "left" | "centerH" | "right" | "top" | "middleV" | "bottom") => {
      takeSnapshot();
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
    [selectedIds, setNodes, takeSnapshot],
  );

  const distributeSelected = useCallback(
    (axis: "h" | "v") => {
      takeSnapshot();
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
    [selectedIds, setNodes, takeSnapshot],
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
          onReveal={() => {}}
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
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
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
              onNodeDragStart={() => takeSnapshot("drag")}
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

export function ProcessBuilder() {
  return (
    <ReactFlowProvider>
      <BuilderInner />
    </ReactFlowProvider>
  );
}
