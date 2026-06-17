"use client";

import { useCallback, useRef, useState } from "react";
import { useReactFlow, type Edge, type Node } from "@xyflow/react";

type Snapshot = { nodes: Node[]; edges: Edge[] };
const MAX_HISTORY = 100;

/**
 * History stack for the canvas. Call `takeSnapshot()` immediately *before* a
 * mutating action so it can be reverted. Continuous edits (typing in the
 * inspector, dragging) should pass a `group` so a burst collapses into one step.
 */
export function useUndoRedo() {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const lastGroup = useRef<{ group?: string; at: number }>({ at: 0 });
  const [counts, setCounts] = useState({ undo: 0, redo: 0 });

  const sync = useCallback(() => {
    setCounts({ undo: past.current.length, redo: future.current.length });
  }, []);

  const takeSnapshot = useCallback(
    (group?: string) => {
      const now = Date.now();
      // Coalesce rapid same-group snapshots into a single undo step.
      if (group && lastGroup.current.group === group && now - lastGroup.current.at < 700) {
        lastGroup.current.at = now;
        return;
      }
      lastGroup.current = { group, at: now };
      past.current.push({ nodes: getNodes(), edges: getEdges() });
      if (past.current.length > MAX_HISTORY) past.current.shift();
      future.current = [];
      sync();
    },
    [getNodes, getEdges, sync],
  );

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push({ nodes: getNodes(), edges: getEdges() });
    setNodes(prev.nodes);
    setEdges(prev.edges);
    lastGroup.current = { at: 0 };
    sync();
  }, [getNodes, getEdges, setNodes, setEdges, sync]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push({ nodes: getNodes(), edges: getEdges() });
    setNodes(next.nodes);
    setEdges(next.edges);
    lastGroup.current = { at: 0 };
    sync();
  }, [getNodes, getEdges, setNodes, setEdges, sync]);

  return { takeSnapshot, undo, redo, canUndo: counts.undo > 0, canRedo: counts.redo > 0 };
}
