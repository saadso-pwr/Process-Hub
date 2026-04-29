"use client";

import {
  ReactFlow,
  Background,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useState } from "react";

const FF = "'Manrope', sans-serif";

// Tokens lifted from Figma "Processframe"
const PALETTE = {
  sandbox:    { bg: "rgba(251,245,229,0.55)", border: "rgba(212,162,76,0.55)", label: "#c8923a" },
  production: { bg: "rgba(236,248,255,0.55)", border: "#b6e2fd",                label: "#1e7fbf" },
  intake:     { bg: "#f9f9f9", border: "#bfbfba", text: "#3a3a35" },
  build:      { bg: "#f0eefb", border: "#a099e0", text: "#3a2d7c" },
  blue:       { bg: "#e5f3ff", border: "#8aa8ce", text: "#193e78" },
  green:      { bg: "#e9f4f3", border: "#2a5634", text: "#2a5634" },
  doc:        { bg: "rgba(233,244,243,0.48)", border: "rgba(42,86,52,0.3)", text: "#2a5634" },
  edge:       "#7a7a7a",
  edgeDash:   "#9aa0a8",
};

const handleStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  opacity: 0,
  background: "transparent",
  border: "none",
  pointerEvents: "none",
};

// Reusable handle set (target+source on every side, so any edge can connect cleanly)
function FourHandles() {
  return (
    <>
      <Handle type="target" position={Position.Top}    id="t"   style={handleStyle} />
      <Handle type="source" position={Position.Top}    id="t-s" style={handleStyle} />
      <Handle type="target" position={Position.Left}   id="l"   style={handleStyle} />
      <Handle type="source" position={Position.Left}   id="l-s" style={handleStyle} />
      <Handle type="target" position={Position.Right}  id="r-t" style={handleStyle} />
      <Handle type="source" position={Position.Right}  id="r"   style={handleStyle} />
      <Handle type="target" position={Position.Bottom} id="b-t" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="b"   style={handleStyle} />
    </>
  );
}

// ── Phase card: number circle, bold title, regular subtitle ──
type PhaseData = {
  number: string;
  title: string;
  subtitle: string;
  width: number;
  height: number;
  bg: string;
  border: string;
  textColor: string;
};

function PhaseNode({ data }: NodeProps<Node<PhaseData>>) {
  const [hovered, setHovered] = useState(false);
  return (
    <>
      <FourHandles />
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: data.width,
          height: data.height,
          background: data.bg,
          border: `1.5px solid ${hovered ? data.textColor : data.border}`,
          borderRadius: 8,
          padding: "28px 26px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontFamily: FF,
          boxSizing: "border-box",
          cursor: "pointer",
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          boxShadow: hovered ? `0 10px 24px -4px ${data.textColor}33` : "0 0 0 rgba(0,0,0,0)",
          transition: "transform 180ms ease-out, box-shadow 180ms ease-out, border-color 180ms ease-out",
          willChange: "transform",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: hovered ? "scale(1.08)" : "scale(1)",
              transition: "transform 180ms ease-out",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 22, color: data.textColor, lineHeight: 1 }}>
              {data.number}
            </span>
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 22,
              color: data.textColor,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
            }}
          >
            {data.title}
          </span>
        </div>
        <span
          style={{
            fontWeight: 400,
            fontSize: 14,
            color: data.textColor,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {data.subtitle}
        </span>
      </div>
    </>
  );
}

// ── Gate diamond + label below ──
type GateData = {
  label: string;
  variant: "purple" | "blue";
};

function GateNode({ data }: NodeProps<Node<GateData>>) {
  const colors = data.variant === "purple" ? PALETTE.build : PALETTE.blue;
  const SIZE = 60;
  const [hovered, setHovered] = useState(false);
  // Anchor handles on the diamond (top of node) so edges meet the diamond's
  // edges rather than the midpoint of the diamond+label bounding box.
  const h = (top: number, left: number): React.CSSProperties => ({
    ...handleStyle,
    top,
    left,
  });
  return (
    <>
      <Handle type="target" position={Position.Top}    id="t"   style={h(0, SIZE / 2)} />
      <Handle type="source" position={Position.Top}    id="t-s" style={h(0, SIZE / 2)} />
      <Handle type="target" position={Position.Right}  id="r-t" style={h(SIZE / 2, SIZE)} />
      <Handle type="source" position={Position.Right}  id="r"   style={h(SIZE / 2, SIZE)} />
      <Handle type="target" position={Position.Bottom} id="b-t" style={h(SIZE, SIZE / 2)} />
      <Handle type="source" position={Position.Bottom} id="b"   style={h(SIZE, SIZE / 2)} />
      <Handle type="target" position={Position.Left}   id="l"   style={h(SIZE / 2, 0)} />
      <Handle type="source" position={Position.Left}   id="l-s" style={h(SIZE / 2, 0)} />
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: SIZE,
          fontFamily: FF,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          transition: "transform 180ms ease-out",
          willChange: "transform",
        }}
      >
        <div
          style={{
            width: SIZE,
            height: SIZE,
            position: "relative",
            transform: hovered ? "scale(1.06)" : "scale(1)",
            transition: "transform 180ms ease-out, filter 180ms ease-out",
            filter: hovered ? `drop-shadow(0 6px 12px ${colors.text}55)` : "none",
          }}
        >
          <svg width={SIZE} height={SIZE} style={{ display: "block", overflow: "visible" }}>
            {(() => {
              const side = SIZE / Math.SQRT2;
              const offset = (SIZE - side) / 2;
              return (
                <rect
                  x={offset}
                  y={offset}
                  width={side}
                  height={side}
                  rx={8}
                  ry={8}
                  fill={colors.bg}
                  stroke={hovered ? colors.text : colors.border}
                  strokeWidth={1.5}
                  transform={`rotate(45 ${SIZE / 2} ${SIZE / 2})`}
                  style={{ transition: "stroke 180ms ease-out" }}
                />
              );
            })()}
          </svg>
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: colors.text,
            textAlign: "center",
            lineHeight: 1.15,
            whiteSpace: "nowrap",
          }}
        >
          {data.label.split(" ").map((w, i) => (
            <span key={i} style={{ display: "block" }}>{w}</span>
          ))}
        </span>
      </div>
    </>
  );
}

// ── Gate popup: small explanatory card with diamond icon ──
type GatePopupContent = {
  title: string;
  description: string;
  variant: "purple" | "blue";
};

function GatePopupNode({ data }: NodeProps<Node<{ popup: GatePopupContent }>>) {
  const colors = data.popup.variant === "purple" ? PALETTE.build : PALETTE.blue;
  const ICON = 36;
  const side = ICON / Math.SQRT2;
  const offset = (ICON - side) / 2;
  return (
    <div
      style={{
        width: 340,
        background: "#fff",
        border: "1px solid #e4e2da",
        borderRadius: 14,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontFamily: FF,
        boxShadow: "0 12px 32px rgba(0,0,0,0.14), 0 2px 4px rgba(0,0,0,0.06)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <svg width={ICON} height={ICON} style={{ display: "block", flexShrink: 0 }}>
          <rect
            x={offset}
            y={offset}
            width={side}
            height={side}
            rx={5}
            ry={5}
            fill={colors.bg}
            stroke={colors.border}
            strokeWidth={1.5}
            transform={`rotate(45 ${ICON / 2} ${ICON / 2})`}
          />
        </svg>
        <p style={{ fontWeight: 700, fontSize: 20, color: colors.text, margin: 0, lineHeight: 1.15 }}>
          {data.popup.title}
        </p>
      </div>
      <p style={{ fontWeight: 400, fontSize: 14, color: "#3f3f38", lineHeight: 1.5, margin: 0 }}>
        {data.popup.description}
      </p>
    </div>
  );
}

// ── Tenant container with header label inside top-left ──
type ContainerData = {
  label: string;
  width: number;
  height: number;
  bg: string;
  border: string;
  labelColor: string;
  borderStyle?: "solid" | "dashed";
};

function ContainerNode({ data }: NodeProps<Node<ContainerData>>) {
  return (
    <div
      style={{
        width: data.width,
        height: data.height,
        background: data.bg,
        border: `1.5px ${data.borderStyle ?? "solid"} ${data.border}`,
        borderRadius: 12,
        position: "relative",
        fontFamily: FF,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 22,
          left: 32,
          fontWeight: 700,
          fontSize: 26,
          color: data.labelColor,
        }}
      >
        {data.label}
      </div>
    </div>
  );
}

// ── Documentation strip with circle + title + subtitle, centered ──
type DocData = {
  title: string;
  subtitle: string;
  width: number;
  height: number;
};

function DocNode({ data }: NodeProps<Node<DocData>>) {
  const [hovered, setHovered] = useState(false);
  return (
    <>
      <FourHandles />
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: data.width,
          height: data.height,
          background: PALETTE.doc.bg,
          border: `1.5px solid ${hovered ? PALETTE.doc.text : PALETTE.doc.border}`,
          borderRadius: 8,
          fontFamily: FF,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
          padding: "28px 24px",
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          boxShadow: hovered ? `0 10px 24px -4px ${PALETTE.doc.text}33` : "0 0 0 rgba(0,0,0,0)",
          transition: "transform 180ms ease-out, box-shadow 180ms ease-out, border-color 180ms ease-out",
          willChange: "transform",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: hovered ? "scale(1.08)" : "scale(1)",
              transition: "transform 180ms ease-out",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 22, color: PALETTE.doc.text, lineHeight: 1 }}>
              6
            </span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 22, color: PALETTE.doc.text }}>
            {data.title}
          </span>
        </div>
        <span style={{ fontWeight: 400, fontSize: 14, color: PALETTE.doc.text, textAlign: "center" }}>
          {data.subtitle}
        </span>
      </div>
    </>
  );
}

// ── Popup (carry-over from previous version, unchanged content) ──
type PhasePopup = {
  phaseLabel: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  sections: { label: string; items: string[] }[];
};

type PopupData = { popup: PhasePopup };

function PopupNode({ data }: NodeProps<Node<PopupData>>) {
  const { phaseLabel, title, subtitle, bullets, sections } = data.popup;
  return (
    <div
      style={{
        width: 340,
        background: "#fff",
        border: "1px solid #e4e2da",
        borderRadius: 14,
        padding: "24px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        fontFamily: FF,
        boxShadow: "0 12px 32px rgba(0,0,0,0.14), 0 2px 4px rgba(0,0,0,0.06)",
        boxSizing: "border-box",
      }}
    >
      <p style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.88px", color: "#8a8a82", margin: 0 }}>
        {phaseLabel}
      </p>
      <p style={{ fontWeight: 700, fontSize: 18, color: "#1f1f1b", lineHeight: "24px", margin: 0 }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ fontWeight: 400, fontSize: 13, color: "#6b6b66", lineHeight: "18px", margin: 0 }}>
          {subtitle}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
        {bullets.map((b, i) => (
          <p key={i} style={{ margin: 0, fontWeight: 400, fontSize: 13, color: "#3f3f38", lineHeight: "18px" }}>
            •&nbsp;&nbsp;{b}
          </p>
        ))}
      </div>
      {sections.map((s) => (
        <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 6 }}>
          <p style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.66px", color: "#7a5a20", margin: 0 }}>
            {s.label}
          </p>
          {s.items.map((item, i) => (
            <p key={i} style={{ margin: 0, fontWeight: 400, fontSize: 13, color: "#3f3f38", lineHeight: "18px" }}>
              •&nbsp;&nbsp;{item}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

const nodeTypes = {
  phase:     PhaseNode,
  gate:      GateNode,
  container: ContainerNode,
  doc:       DocNode,
  popup:     PopupNode,
  gatePopup: GatePopupNode,
};

// ── Layout (Figma "Processframe" coords, 1574×820 design space) ──
const PHASE_W = 252;
const PHASE_H = 145;

const baseNodes: Node[] = [
  // Containers
  {
    id: "sandbox",
    type: "container",
    position: { x: 0, y: 0 },
    data: {
      label: "Sandbox Tenant",
      width: 678,
      height: 656,
      bg: PALETTE.sandbox.bg,
      border: PALETTE.sandbox.border,
      labelColor: PALETTE.sandbox.label,
    },
    selectable: false,
    draggable: false,
    zIndex: 0,
  },
  {
    id: "production",
    type: "container",
    position: { x: 690, y: 0 },
    data: {
      label: "Production Tenant",
      width: 884,
      height: 656,
      bg: PALETTE.production.bg,
      border: PALETTE.production.border,
      labelColor: PALETTE.production.label,
      borderStyle: "dashed",
    },
    selectable: false,
    draggable: false,
    zIndex: 0,
  },

  // Sandbox phases
  {
    id: "intake",
    type: "phase",
    position: { x: 32, y: 84 },
    data: { number: "0", title: "Intake", subtitle: "Requests & Triage", width: PHASE_W, height: PHASE_H, bg: PALETTE.intake.bg, border: PALETTE.intake.border, textColor: PALETTE.intake.text },
    zIndex: 1,
  },
  {
    id: "mvp-build",
    type: "phase",
    position: { x: 329, y: 84 },
    data: { number: "1", title: "MVP Build", subtitle: "Design & Prototype", width: PHASE_W, height: PHASE_H, bg: PALETTE.build.bg, border: PALETTE.build.border, textColor: PALETTE.build.text },
    zIndex: 1,
  },
  {
    id: "review",
    type: "phase",
    position: { x: 329, y: 264.5 },
    data: { number: "2", title: "Review", subtitle: "Demo & Approve", width: PHASE_W, height: PHASE_H, bg: PALETTE.build.bg, border: PALETTE.build.border, textColor: PALETTE.build.text },
    zIndex: 1,
  },
  {
    id: "mvp-gate",
    type: "gate",
    position: { x: 425, y: 489 },
    data: { label: "MVP Gate", variant: "purple" },
    zIndex: 2,
  },

  // Production phases
  {
    id: "migration",
    type: "phase",
    position: { x: 725, y: 84 },
    data: { number: "3", title: "Migration", subtitle: "Deploy to Production", width: PHASE_W, height: PHASE_H, bg: PALETTE.blue.bg, border: PALETTE.blue.border, textColor: PALETTE.blue.text },
    zIndex: 1,
  },
  {
    id: "golive",
    type: "phase",
    position: { x: 725, y: 264.5 },
    data: { number: "4", title: "Go-Live", subtitle: "Release & Onboard", width: PHASE_W, height: PHASE_H, bg: PALETTE.blue.bg, border: PALETTE.blue.border, textColor: PALETTE.blue.text },
    zIndex: 1,
  },
  {
    id: "golive-gate",
    type: "gate",
    position: { x: 821, y: 484 },
    data: { label: "Go-Live Gate", variant: "blue" },
    zIndex: 2,
  },
  {
    id: "operate",
    type: "phase",
    position: { x: 1168, y: 84 },
    data: { number: "5", title: "Operate", subtitle: "Monitor & Support", width: PHASE_W, height: PHASE_H, bg: PALETTE.green.bg, border: PALETTE.green.border, textColor: PALETTE.green.text },
    zIndex: 1,
  },
  {
    id: "improve",
    type: "phase",
    position: { x: 1168, y: 264.5 },
    data: { number: "7", title: "Improve", subtitle: "Fixes & Feedback", width: PHASE_W, height: PHASE_H, bg: PALETTE.green.bg, border: PALETTE.green.border, textColor: PALETTE.green.text },
    zIndex: 1,
  },
  {
    id: "iterate",
    type: "phase",
    position: { x: 1168, y: 445 },
    data: { number: "8", title: "Iterate", subtitle: "New Versions", width: PHASE_W, height: PHASE_H, bg: PALETTE.intake.bg, border: PALETTE.intake.border, textColor: PALETTE.intake.text },
    zIndex: 1,
  },

  // Documentation strip
  {
    id: "docs",
    type: "doc",
    position: { x: 0, y: 675 },
    data: {
      title: "Documentation & Processes",
      subtitle: "Process maps, user docs, technical docs, operational SOPs — maintained across every phase",
      width: 1574,
      height: 145,
    },
    selectable: false,
    draggable: false,
    zIndex: 1,
  },
];

const solidEdge = {
  style: { stroke: PALETTE.edge, strokeWidth: 1.8 },
  markerEnd: { type: MarkerType.ArrowClosed, color: PALETTE.edge, width: 18, height: 18 },
};

const dashedEdge = {
  style: { stroke: PALETTE.edgeDash, strokeWidth: 1.8, strokeDasharray: "7 5" },
  markerEnd: { type: MarkerType.ArrowClosed, color: PALETTE.edgeDash, width: 18, height: 18 },
};

const edges: Edge[] = [
  // 0 Intake → 1 MVP Build (horizontal, sandbox top row)
  { id: "e-0-1", source: "intake", target: "mvp-build", sourceHandle: "r", targetHandle: "l", ...solidEdge },
  // 1 MVP Build → 2 Review (vertical down)
  { id: "e-1-2", source: "mvp-build", target: "review", sourceHandle: "b", targetHandle: "t", ...solidEdge },
  // 2 Review → MVP Gate (vertical down)
  { id: "e-2-mvpgate", source: "review", target: "mvp-gate", sourceHandle: "b", targetHandle: "t", ...solidEdge },
  // MVP Gate → 3 Migration (curve up-right, crosses tenant boundary)
  { id: "e-mvpgate-3", source: "mvp-gate", target: "migration", sourceHandle: "r", targetHandle: "l", type: "smoothstep", ...solidEdge },
  // 3 Migration → 4 Go-Live (vertical)
  { id: "e-3-4", source: "migration", target: "golive", sourceHandle: "b", targetHandle: "t", ...solidEdge },
  // 4 Go-Live → Go-Live Gate (vertical)
  { id: "e-4-glgate", source: "golive", target: "golive-gate", sourceHandle: "b", targetHandle: "t", ...solidEdge },
  // Go-Live Gate → 5 Operate (curve up-right)
  { id: "e-glgate-5", source: "golive-gate", target: "operate", sourceHandle: "r", targetHandle: "l", type: "smoothstep", ...solidEdge },
  // 5 Operate → 7 Improve (vertical)
  { id: "e-5-7", source: "operate", target: "improve", sourceHandle: "b", targetHandle: "t", ...solidEdge },
  // 7 Improve → 8 Iterate (vertical)
  { id: "e-7-8", source: "improve", target: "iterate", sourceHandle: "b", targetHandle: "t", ...solidEdge },
  // 8 Iterate → 0 Intake (dashed loop: down, across left, up)
  { id: "e-8-0", source: "iterate", target: "intake", sourceHandle: "b", targetHandle: "b-t", type: "smoothstep", ...dashedEdge },
];

// ── Popup data (Phase 0–8) ──
const POPUPS: Record<string, PhasePopup> = {
  intake: {
    phaseLabel: "STAGE 0",
    title: "Intake & Prioritization",
    bullets: [
      "Request or idea is submitted (system, feature, issue, improvement)",
      "Initial scoping and clarification",
      "Priority defined",
      "Decision to move forward",
    ],
    sections: [{ label: "OUTPUT", items: ["Approved request / backlog item"] }],
  },
  "mvp-build": {
    phaseLabel: "STAGE 1",
    title: "MVP Build",
    subtitle: "Power Technology tenant — sandbox",
    bullets: [
      "Process design (how it should work)",
      "Data + system design",
      "MVP build in sandbox",
      "Internal testing and iteration",
    ],
    sections: [
      { label: "ENVIRONMENT", items: ["Power Technology tenant (sandbox only)"] },
      { label: "OUTPUT", items: ["MVP ready for review"] },
    ],
  },
  review: {
    phaseLabel: "STAGE 2",
    title: "Review & Approval",
    bullets: [
      "Demo to stakeholders",
      "Feedback collection",
      "Iterations if needed",
      "Final approval decision",
    ],
    sections: [
      {
        label: "GOVERNANCE",
        items: [
          "Responsible: Power Technology",
          "Accountable: David Savage",
          "Consulted: Neos Ops",
          "Informed: Senior Advisors",
        ],
      },
      { label: "OUTPUT", items: ["Approved solution for production"] },
    ],
  },
  migration: {
    phaseLabel: "STAGE 3",
    title: "Production Migration",
    subtitle: "Neos tenant",
    bullets: [
      "Deploy solution into production environment",
      "Configure data connections",
      "Set permissions and access",
      "Validate system in production setup",
    ],
    sections: [
      { label: "ENVIRONMENT", items: ["Neos tenant (production)"] },
      { label: "OUTPUT", items: ["Production-ready system"] },
    ],
  },
  golive: {
    phaseLabel: "STAGE 4",
    title: "Release & Go-Live",
    bullets: [
      "Final quality checks",
      "Release approval confirmation",
      "User communication and onboarding",
      "System officially goes live",
    ],
    sections: [{ label: "OUTPUT", items: ["Live system"] }],
  },
  operate: {
    phaseLabel: "STAGE 5",
    title: "Operations, Monitoring & Support",
    bullets: [
      "Monitor system health (data refresh, errors, usage)",
      "Identify and flag issues",
      "Maintain system performance",
      "Handle user questions and support needs",
    ],
    sections: [
      {
        label: "ISSUE & TICKET HANDLING",
        items: [
          "All issues, requests, and questions go through a central ticketing system",
          "Tickets are categorized (bug, data issue, enhancement, access, question)",
          "Assigned to Power Technology",
          "Tracked until resolution",
        ],
      },
      { label: "OUTPUT", items: ["Stable and supported system"] },
    ],
  },
  docs: {
    phaseLabel: "STAGE 6",
    title: "Documentation & Process Management",
    bullets: [
      "Maintain full process maps (end-to-end and system-specific)",
      "Maintain user documentation (how to use, input data, request support)",
      "Maintain technical documentation (data flows, architecture, dependencies)",
      "Maintain operational SOPs (release process, issue handling, maintenance steps)",
    ],
    sections: [{ label: "OUTPUT", items: ["Complete, up-to-date system documentation"] }],
  },
  improve: {
    phaseLabel: "STAGE 7",
    title: "Maintenance & Continuous Improvement",
    bullets: [
      "Resolve recurring issues",
      "Improve performance and usability",
      "Clean and validate data continuously",
      "Incorporate user feedback",
      "Convert tickets and insights into improvements",
    ],
    sections: [{ label: "OUTPUT", items: ["Improved and optimized system over time"] }],
  },
  iterate: {
    phaseLabel: "STAGE 8",
    title: "Versioning & Major Releases",
    bullets: [
      "New features and major changes start in sandbox",
      "Repeat full cycle: Build → Review → Approval → Production → Release",
      "Maintain version control and release history",
    ],
    sections: [
      { label: "KEY RULE", items: ["No direct development in production"] },
      { label: "OUTPUT", items: ["Controlled system evolution (v1 → v2 → v3)"] },
    ],
  },
};

// Gate popup data
const GATE_POPUPS: Record<string, GatePopupContent> = {
  "mvp-gate": {
    title: "MVP Gate",
    description: "Executive sponsor and Neos operations co-approve before production migration",
    variant: "purple",
  },
  "golive-gate": {
    title: "Go-Live Gate",
    description: "Executive sponsor gives final release approval before users are onboarded",
    variant: "blue",
  },
};

// Popup placement per node (design-space coords; popup is 340px wide)
const POPUP_POSITIONS: Record<string, { x: number; y: number }> = {
  intake:        { x: 50,    y: 240 },
  "mvp-build":   { x: 600,   y: 80 },
  review:        { x: 600,   y: 260 },
  migration:     { x: 985,   y: 80 },
  golive:        { x: 380,   y: 260 },
  operate:       { x: 800,   y: 80 },
  improve:       { x: 800,   y: 260 },
  iterate:       { x: 800,   y: 440 },
  docs:          { x: 200,   y: 360 },
  "mvp-gate":    { x: 250,   y: 380 },
  "golive-gate": { x: 645,   y: 380 },
};

export function NBSSystemMap() {
  const [openId, setOpenId] = useState<string | null>(null);

  const handleNodeClick = useCallback((_e: React.MouseEvent, node: Node) => {
    if (POPUPS[node.id] || GATE_POPUPS[node.id]) {
      setOpenId((prev) => (prev === node.id ? null : node.id));
    } else {
      setOpenId(null);
    }
  }, []);

  const handlePaneClick = useCallback(() => setOpenId(null), []);

  const nodesWithPopup = useMemo(() => {
    if (!openId) return baseNodes;
    const pos = POPUP_POSITIONS[openId] ?? { x: 0, y: 0 };
    const phasePopup = POPUPS[openId];
    const gatePopup = GATE_POPUPS[openId];
    if (!phasePopup && !gatePopup) return baseNodes;
    return [
      ...baseNodes,
      {
        id: "__popup__",
        type: phasePopup ? "popup" : "gatePopup",
        position: pos,
        data: { popup: phasePopup ?? gatePopup },
        zIndex: 100,
        draggable: false,
        selectable: false,
      } satisfies Node,
    ];
  }, [openId]);

  return (
    <div
      style={{
        width: "100%",
        height: 720,
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <ReactFlow
        nodes={nodesWithPopup}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.04 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background color="#f0f0f0" gap={32} size={0.5} />
      </ReactFlow>
    </div>
  );
}
