import type { Node, NodePositionChange } from "@xyflow/react";

export type HelperLinesResult = {
  horizontal?: number;
  vertical?: number;
  snapPosition: { x?: number; y?: number };
};

function nodeBox(n: Node, pos = n.position) {
  const w = n.measured?.width ?? (typeof n.width === "number" ? n.width : 0);
  const h = n.measured?.height ?? (typeof n.height === "number" ? n.height : 0);
  return {
    left: pos.x,
    right: pos.x + w,
    top: pos.y,
    bottom: pos.y + h,
    w,
    h,
    cx: pos.x + w / 2,
    cy: pos.y + h / 2,
  };
}

/**
 * Given the in-flight position change for the dragged node, find alignment with
 * other top-level nodes (left/centre/right and top/middle/bottom). Returns the
 * guide-line coordinates to draw and a snapped position when within `distance`.
 * Adapted from the React Flow "helper lines" example.
 */
export function getHelperLines(
  change: NodePositionChange,
  nodes: Node[],
  distance = 6,
): HelperLinesResult {
  const result: HelperLinesResult = { snapPosition: {} };
  if (!change.position) return result;

  const dragged = nodes.find((n) => n.id === change.id);
  if (!dragged) return result;
  const a = nodeBox(dragged, change.position);

  let vDist = distance; // best vertical-line (x) match so far
  let hDist = distance; // best horizontal-line (y) match so far

  for (const n of nodes) {
    if (n.id === change.id || n.parentId || n.type === "lane" || n.type === "swimlane" || n.type === "media") continue;
    const b = nodeBox(n);

    // Vertical guides (align x): left-left, right-right, centre-centre, left-right, right-left.
    const vCandidates: [number, number, number][] = [
      [Math.abs(a.left - b.left), b.left, b.left],
      [Math.abs(a.right - b.right), b.right - a.w, b.right],
      [Math.abs(a.cx - b.cx), b.cx - a.w / 2, b.cx],
      [Math.abs(a.left - b.right), b.right, b.right],
      [Math.abs(a.right - b.left), b.left - a.w, b.left],
    ];
    for (const [d, snapX, guideX] of vCandidates) {
      if (d < vDist) {
        vDist = d;
        result.snapPosition.x = snapX;
        result.vertical = guideX;
      }
    }

    // Horizontal guides (align y): top-top, bottom-bottom, middle-middle, top-bottom, bottom-top.
    const hCandidates: [number, number, number][] = [
      [Math.abs(a.top - b.top), b.top, b.top],
      [Math.abs(a.bottom - b.bottom), b.bottom - a.h, b.bottom],
      [Math.abs(a.cy - b.cy), b.cy - a.h / 2, b.cy],
      [Math.abs(a.top - b.bottom), b.bottom, b.bottom],
      [Math.abs(a.bottom - b.top), b.top - a.h, b.top],
    ];
    for (const [d, snapY, guideY] of hCandidates) {
      if (d < hDist) {
        hDist = d;
        result.snapPosition.y = snapY;
        result.horizontal = guideY;
      }
    }
  }

  return result;
}
