"use client";

import type { NodeProps, Node } from "@xyflow/react";
import type { MediaData } from "./diagram";

const FF = "'Manrope', sans-serif";

/**
 * A backdrop showing an uploaded PNG / SVG / PDF. It sits behind the canvas so
 * the user can drop shapes, arrows and labels on top to "mark up" the file.
 * Images are click-through (so panning works); PDFs stay interactive to scroll.
 */
export function MediaNode({ data }: NodeProps<Node<MediaData>>) {
  const isPdf = data.mediaKind === "pdf";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fff",
        border: "1px solid #e4e4e4",
        borderRadius: 10,
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        overflow: "hidden",
        position: "relative",
        fontFamily: FF,
      }}
    >
      {isPdf ? (
        <iframe
          src={`${data.src}#toolbar=0&navpanes=0`}
          title={data.label}
          style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
        />
      ) : (
        // Uploaded data-URL image — next/image can't optimise these.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.src}
          alt={data.label}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      )}
    </div>
  );
}
