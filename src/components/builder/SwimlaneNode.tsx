"use client";

import { NodeResizer, type Node, type NodeProps } from "@xyflow/react";
import {
  SWIMLANE,
  swimlaneBoardHeight,
  swimlaneBoardWidth,
  swimlaneRowHeight,
  swimlaneRowsHeight,
  swimlaneStageWidth,
  swimlaneStagesWidth,
  type SwimlaneData,
} from "./diagram";

const FF = "'Manrope', sans-serif";

export function SwimlaneNode({ data, selected, width, height }: NodeProps<Node<SwimlaneData>>) {
  const rows = data.rows.length ? data.rows : [{ id: "row_fallback", label: "Role" }];
  const stages = data.stages.length ? data.stages : [{ id: "stage_fallback", label: "Stage" }];
  const rowHeaderWidth = data.rowHeaderWidth || SWIMLANE.rowHeaderWidth;
  const stageHeaderHeight = data.stageHeaderHeight || SWIMLANE.stageHeaderHeight;
  const fallbackData = { ...data, rows, stages, rowHeaderWidth, stageHeaderHeight };
  const nodeWidth = typeof width === "number" ? width : swimlaneBoardWidth(fallbackData);
  const nodeHeight = typeof height === "number" ? height : swimlaneBoardHeight(fallbackData);
  const bodyWidth = swimlaneStagesWidth(stages);
  const bodyHeight = swimlaneRowsHeight(rows);
  const color = data.color || "#00037C";
  const stageLayouts = stages.reduce<Array<{ id: string; label: string; left: number; width: number }>>((layouts, stage) => {
    const previous = layouts.at(-1);
    const left = previous ? previous.left + previous.width : rowHeaderWidth;
    return [...layouts, { id: stage.id, label: stage.label, left, width: swimlaneStageWidth(stage) }];
  }, []);
  const rowLayouts = rows.reduce<Array<{ id: string; label: string; color?: string; top: number; height: number }>>((layouts, row) => {
    const previous = layouts.at(-1);
    const top = previous ? previous.top + previous.height : stageHeaderHeight;
    return [...layouts, { id: row.id, label: row.label, color: row.color, top, height: swimlaneRowHeight(row) }];
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", fontFamily: FF }}>
      <NodeResizer
        isVisible={!!selected}
        minWidth={Math.max(rowHeaderWidth + bodyWidth, nodeWidth)}
        minHeight={Math.max(stageHeaderHeight + bodyHeight, nodeHeight)}
        color={color}
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
        lineStyle={{ borderColor: color }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          borderRadius: 14,
          border: `1.5px solid ${color}66`,
          background: "#fff",
          boxShadow: selected ? `0 0 0 2px ${color}` : "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: rowHeaderWidth,
            height: stageHeaderHeight,
            background: `${color}18`,
            borderRight: `1px solid ${color}38`,
            borderBottom: `1px solid ${color}38`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 10px",
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1.2, wordBreak: "break-word" }}>
            {data.title || "Swimlane"}
          </span>
        </div>

        {stageLayouts.map((stage, index) => {
          return (
            <div
              key={stage.id}
              style={{
                position: "absolute",
                left: stage.left,
                top: 0,
                width: stage.width,
                height: stageHeaderHeight,
                background: `${color}0d`,
                borderRight: index < stages.length - 1 ? "1px solid #e4e4e4" : "none",
                borderBottom: `1px solid ${color}38`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 10px",
                boxSizing: "border-box",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: "#1f1f1b", lineHeight: 1.2, wordBreak: "break-word" }}>
                {stage.label}
              </span>
            </div>
          );
        })}

        {rowLayouts.map((row, index) => {
          return (
            <div key={row.id}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: row.top,
                  width: rowHeaderWidth,
                  height: row.height,
                  background: `${row.color || color}10`,
                  borderRight: `1px solid ${color}38`,
                  borderBottom: index < rows.length - 1 ? "1px solid #e4e4e4" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px 12px",
                  boxSizing: "border-box",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: row.color || color, lineHeight: 1.25, wordBreak: "break-word" }}>
                  {row.label}
                </span>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: rowHeaderWidth,
                  top: row.top,
                  width: bodyWidth,
                  height: row.height,
                  borderBottom: index < rows.length - 1 ? "1px solid #e4e4e4" : "none",
                  background: index % 2 === 0 ? "#fff" : "#fafafa",
                }}
              />
            </div>
          );
        })}

        {stageLayouts.slice(0, -1).map((stage) => {
          return (
            <div
              key={`${stage.id}-divider`}
              style={{
                position: "absolute",
                left: stage.left + stage.width,
                top: stageHeaderHeight,
                width: 1,
                height: bodyHeight,
                background: "#e4e4e4",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
