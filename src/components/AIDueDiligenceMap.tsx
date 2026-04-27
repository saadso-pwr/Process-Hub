"use client";

/* ── AI IT Due Diligence process map ── */

const W = 1450;
const H = 700;

/* ── colours ── */
const COL = {
  phaseBg:    "#EEF2FF",
  phaseBorder:"#C7D2FE",
  inputBg:    "#FDE8EE",
  inputBorder:"#F9A8C9",
  inputText:  "#6B3C51",
  darkBg:     "#1E1B4B",
  darkText:   "#fff",
  aiBg:       "#EEF2FF",
  aiBorder:   "#A5B4FC",
  aiText:     "#3730A3",
  mainBg:     "#fff",
  mainBorder: "#6366F1",
  mainText:   "#1E1B4B",
  defBg:      "#fff",
  defBorder:  "#C7D5E8",
  defText:    "#374151",
  line:       "#B0BEC5",
  chartGreen: "#22C55E",
  chartAmber: "#F59E0B",
  chartRed:   "#EF4444",
};

/* ── types ── */
type NType = "input" | "dark" | "ai" | "main" | "default" | "ai-small";
type N = {
  id: string; x: number; y: number; w: number; h: number;
  type: NType; label: string[];
  hasAI?: boolean; hasChart?: boolean; hasHumanReview?: boolean;
};
type E = { from: string; to: string; fromSide?: "bottom"; toSide?: "bottom" | "top" };

/* ── nodes ── */
const NODES: N[] = [
  // ── Phase 1 ──
  { id:"template",    x:196, y:108, w:134, h:44, type:"dark",    label:["Template Bank"] },
  { id:"emails",      x:10,  y:258, w:80,  h:44, type:"input",   label:["Project","Emails"] },
  { id:"client",      x:10,  y:388, w:80,  h:44, type:"input",   label:["Client","Research"] },
  { id:"previous",    x:10,  y:506, w:80,  h:44, type:"input",   label:["Previous","Projects"] },
  { id:"ai-ctx",      x:100, y:372, w:90,  h:62, type:"ai",      label:["AI","Context","Synthesis"],   hasAI:true },
  { id:"proj-ctx",    x:192, y:346, w:92,  h:116,type:"dark",    label:["Project","Context"] },
  { id:"ai-q-sel",    x:290, y:372, w:92,  h:62, type:"ai",      label:["AI","Questions","Selection"], hasAI:true },
  // ── Phase 2 ──
  { id:"score-mx",    x:378, y:360, w:90,  h:86, type:"main",    label:["Project","Scoring","Matrix"] },
  { id:"ai-init",     x:474, y:372, w:86,  h:62, type:"ai",      label:["AI","Initial","Scoring"],     hasAI:true },
  { id:"init-scored", x:566, y:332, w:104, h:130,type:"main",    label:["Initial AI","Scored Matrix"], hasChart:true },
  { id:"neos",        x:398, y:596, w:104, h:52, type:"dark",    label:["Neos","Data Site"] },
  // ── Phase 3 ──
  { id:"ai-gap",      x:668, y:372, w:86,  h:62, type:"ai",      label:["AI","Gap","Summary"],         hasAI:true },
  { id:"gap-list",    x:760, y:372, w:78,  h:62, type:"default", label:["Gap","List"] },
  { id:"ai-q-draft",  x:848, y:372, w:88,  h:62, type:"ai",      label:["AI","Questions","Draft"],     hasAI:true },
  { id:"e-interview", x:946, y:250, w:88,  h:62, type:"default", label:["E-Interview","Questions"] },
  { id:"ai-meeting",  x:1048,y:254, w:84,  h:50, type:"ai-small",label:["AI Meeting","Recording"],    hasAI:true },
  { id:"site-visit",  x:946, y:374, w:88,  h:62, type:"default", label:["Site Visit","Questions"] },
  { id:"email-q",     x:946, y:490, w:88,  h:62, type:"default", label:["Email","Questions"] },
  { id:"ai-email",    x:1048,y:498, w:80,  h:46, type:"ai-small",label:["AI Email","Draft"],          hasAI:true },
  // ── Phase 4 ──
  { id:"ai-capture",  x:1148,y:354, w:90,  h:108,type:"ai",      label:["AI Capture","Notes &","Update Scoring"], hasAI:true },
  { id:"complete",    x:1252,y:342, w:92,  h:122,type:"main",    label:["Complete","Scoring","Matrix"], hasHumanReview:true },
  { id:"presentation",x:1366,y:370, w:74,  h:62, type:"default", label:["Presentation"] },
];

const EDGES: E[] = [
  // inputs → AI context
  { from:"emails",   to:"ai-ctx" },
  { from:"client",   to:"ai-ctx" },
  { from:"previous", to:"ai-ctx" },
  // phase 1 flow
  { from:"ai-ctx",   to:"proj-ctx" },
  { from:"template", to:"proj-ctx",   fromSide:"bottom" },
  { from:"proj-ctx", to:"ai-q-sel" },
  // phase 1 → 2
  { from:"ai-q-sel", to:"score-mx" },
  // neos data (vertical up to scoring matrix)
  { from:"neos",     to:"score-mx",   fromSide:"bottom", toSide:"bottom" },
  // phase 2 flow
  { from:"score-mx", to:"ai-init" },
  { from:"ai-init",  to:"init-scored" },
  // phase 2 → 3
  { from:"init-scored", to:"ai-gap" },
  // phase 3 flow
  { from:"ai-gap",   to:"gap-list" },
  { from:"gap-list", to:"ai-q-draft" },
  { from:"ai-q-draft", to:"e-interview" },
  { from:"ai-q-draft", to:"site-visit" },
  { from:"ai-q-draft", to:"email-q" },
  { from:"e-interview", to:"ai-meeting" },
  { from:"email-q",  to:"ai-email" },
  // phase 3 → 4
  { from:"ai-meeting",  to:"ai-capture" },
  { from:"site-visit",  to:"ai-capture" },
  { from:"ai-email",    to:"ai-capture" },
  // phase 4
  { from:"ai-capture",  to:"complete" },
  { from:"complete",    to:"presentation" },
];

/* ── helpers ── */
function node(id: string) { return NODES.find(n => n.id === id)!; }

function path(e: E): string {
  const f = node(e.from);
  const t = node(e.to);

  let sx: number, sy: number, tx: number, ty: number;

  if (e.fromSide === "bottom") {
    sx = f.x + f.w / 2; sy = f.y + f.h;
  } else {
    sx = f.x + f.w;     sy = f.y + f.h / 2;
  }

  if (e.toSide === "bottom") {
    tx = t.x + t.w / 2; ty = t.y + t.h;
  } else if (e.toSide === "top") {
    tx = t.x + t.w / 2; ty = t.y;
  } else {
    tx = t.x;            ty = t.y + t.h / 2;
  }

  // vertical paths
  if (e.fromSide === "bottom" && !e.toSide) {
    const mx = (sx + tx) / 2;
    return `M${sx},${sy} C${sx},${sy + 40} ${mx},${(sy + ty) / 2} ${tx},${ty}`;
  }
  if (e.fromSide === "bottom" && e.toSide === "bottom") {
    return `M${sx},${sy} C${sx},${sy + 60} ${tx},${ty + 60} ${tx},${ty}`;
  }

  // standard horizontal bezier
  const dx = Math.abs(tx - sx);
  const cp = Math.max(40, dx * 0.5);
  return `M${sx},${sy} C${sx + cp},${sy} ${tx - cp},${ty} ${tx},${ty}`;
}

/* ── node visuals ── */
function nodeStyle(type: NType): React.CSSProperties {
  switch (type) {
    case "input":    return { background: COL.inputBg, border: `1px solid ${COL.inputBorder}`, color: COL.inputText };
    case "dark":     return { background: COL.darkBg,  border: "none",                          color: COL.darkText };
    case "ai":
    case "ai-small": return { background: COL.aiBg,    border: `1px solid ${COL.aiBorder}`,     color: COL.aiText };
    case "main":     return { background: COL.mainBg,  border: `2px solid ${COL.mainBorder}`,   color: COL.mainText };
    default:         return { background: COL.defBg,   border: `1px solid ${COL.defBorder}`,    color: COL.defText };
  }
}

/* ── donut chart ── */
function Donut() {
  const r = 16; const cx = 24; const cy = 24; const sw = 6;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={sw} />
      {/* green 99% */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COL.chartGreen} strokeWidth={sw}
        strokeDasharray={`${circ * 0.99} ${circ}`} strokeDashoffset={circ * 0.25} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
      {/* amber 50% – inner ring */}
      <circle cx={cx} cy={cy} r={r - sw - 1} fill="none" stroke={COL.chartAmber} strokeWidth={4}
        strokeDasharray={`${(2 * Math.PI * (r - sw - 1)) * 0.5} ${2 * Math.PI * (r - sw - 1)}`} transform={`rotate(-90 ${cx} ${cy})`} />
      {/* red 10% – innermost */}
      <circle cx={cx} cy={cy} r={r - sw * 2 - 2} fill="none" stroke={COL.chartRed} strokeWidth={3}
        strokeDasharray={`${(2 * Math.PI * (r - sw * 2 - 2)) * 0.1} ${2 * Math.PI * (r - sw * 2 - 2)}`} transform={`rotate(-90 ${cx} ${cy})`} />
    </svg>
  );
}

/* ── AI sparkle ── */
function Sparkle({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill={COL.aiText} className="shrink-0">
      <path d="M6 0l1.2 4.8L12 6l-4.8 1.2L6 12 4.8 7.2 0 6l4.8-1.2z" />
    </svg>
  );
}

/* ── phase background ── */
const PHASES = [
  { label: "Context Establishment", x: 0,    w: 360 },
  { label: "Initial AI Scoring",    x: 368,  w: 282 },
  { label: "Gap Filling",           x: 658,  w: 580 },
  { label: "Final Delivery",        x: 1246, w: 204 },
];

/* ── main component ── */
export function AIDueDiligenceMap() {
  return (
    <div style={{ overflowX: "auto", overflowY: "visible" }}>
      <div style={{ position: "relative", width: W, height: H, fontFamily: "'Inter Tight', system-ui, sans-serif" }}>

        {/* phase backgrounds */}
        {PHASES.map(p => (
          <div key={p.label} style={{
            position: "absolute", top: 0, left: p.x, width: p.w, height: H,
            background: COL.phaseBg, borderRadius: 10,
            border: `1px solid ${COL.phaseBorder}`,
          }}>
            <span style={{
              position: "absolute", top: 16, left: 18,
              fontFamily: "'Fraunces', serif", fontStyle: "italic",
              fontWeight: 700, fontSize: 18, color: "#312E81",
              letterSpacing: "-0.01em",
            }}>{p.label}</span>
          </div>
        ))}

        {/* SVG edge layer */}
        <svg style={{ position: "absolute", inset: 0, width: W, height: H, pointerEvents: "none", zIndex: 1 }}>
          {EDGES.map((e, i) => (
            <path key={i} d={path(e)}
              fill="none" stroke={COL.line} strokeWidth={1.5}
              strokeLinecap="round" />
          ))}
        </svg>

        {/* nodes */}
        {NODES.map(n => {
          const s = nodeStyle(n.type);
          const isSmall = n.type === "ai-small";
          const fontSize = isSmall ? 10 : 11;

          return (
            <div key={n.id} style={{
              position: "absolute",
              left: n.x, top: n.y, width: n.w, height: n.h,
              ...s,
              borderRadius: 10,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              textAlign: "center",
              padding: "6px 8px",
              zIndex: 2,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              gap: 2,
            }}>
              {/* AI sparkle icon */}
              {n.hasAI && <Sparkle size={isSmall ? 8 : 10} />}

              {/* donut chart */}
              {n.hasChart && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <Donut />
                  <div style={{ fontSize: 9, lineHeight: 1.3, textAlign: "left", color: "#374151" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:COL.chartGreen }} />
                      <span>99% Confidence</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:COL.chartAmber }} />
                      <span>50% Confidence</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:COL.chartRed }} />
                      <span>10% Confidence</span>
                    </div>
                  </div>
                </div>
              )}

              {/* label lines */}
              {!n.hasChart && n.label.map((line, i) => (
                <span key={i} style={{
                  fontSize, lineHeight: 1.25, fontWeight: n.type === "dark" ? 600 : 500,
                  display: "block",
                }}>
                  {line}
                </span>
              ))}

              {/* human review badge */}
              {n.hasHumanReview && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 3,
                  marginTop: 4, fontSize: 9.5, color: "#2563EB",
                  fontWeight: 600,
                }}>
                  <svg width="10" height="10" viewBox="0 0 20 20" fill="#2563EB">
                    <path d="M10 12a4 4 0 100-8 4 4 0 000 8zm-7 6a7 7 0 0114 0H3z" />
                  </svg>
                  Human Review
                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}
