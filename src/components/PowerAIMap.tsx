"use client";
import { useRef, useEffect, useState } from "react";

/* ───────────────────────────────────────────────────────────────
   POWER AI — Conceptual Model v1.0
   Faithful pixel-level implementation of Figma node 2:7600
   ─────────────────────────────────────────────────────────────── */

/* ── inline SVG icons (replacing Figma-local image assets) ── */
const ICON_GRID = (
  <svg viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[30px]">
    <rect x="3" y="3" width="10" height="10" rx="1" /><rect x="17" y="3" width="10" height="10" rx="1" />
    <rect x="3" y="17" width="10" height="10" rx="1" /><rect x="17" y="17" width="10" height="10" rx="1" />
  </svg>
);
const ICON_LAYERS = (
  <svg viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[30px]">
    <path d="M4 8h22M4 14h22M4 20h22" strokeLinecap="round" />
  </svg>
);
const ICON_CARD = (
  <svg viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[30px]">
    <rect x="3" y="7" width="24" height="16" rx="2" /><circle cx="10" cy="15" r="3" />
    <path d="M16 13h8M16 17h5" strokeLinecap="round" />
  </svg>
);
const ICON_WAVE = (
  <svg viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[30px]">
    <path d="M3 15 Q7 8 11 15 Q15 22 19 15 Q23 8 27 15" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ICON_CHECK = (
  <svg viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[30px]">
    <circle cx="15" cy="15" r="11" /><path d="M9 15l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CHEVRON = (
  <svg viewBox="0 0 9 19" fill="none" className="w-[9px] h-[19px] shrink-0">
    <path d="M1 1l7 8.5L1 18" stroke="#b7b7b7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Layer left-panel ── */
function LayerLabel({
  num, title, desc, accentColor, fromColor, titleColor,
}: {
  num: string; title: string; desc: string;
  accentColor: string; fromColor: string; titleColor?: string;
}) {
  return (
    <div
      className="shrink-0 w-[221px] overflow-clip relative rounded-bl-[12px] rounded-tl-[12px]"
      style={{
        background: `linear-gradient(to right, ${fromColor} 1%, rgba(255,255,255,0.83) 78%)`,
        borderLeft: `6px solid ${accentColor}`,
        padding: "18px 15px",
        minHeight: "100%",
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <p style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, fontSize: 14, letterSpacing: "2.52px", color: "#000" }}>
          {num}
        </p>
        <p style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 24, color: titleColor ?? "#000", lineHeight: 1.15 }}>
          {title}
        </p>
        <p style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, fontSize: 14, color: "#000", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

/* ── Thin vertical divider line between left-panel and content ── */
function VDivider() {
  return <div style={{ width: 1, alignSelf: "stretch", background: "#e0e0e0", flexShrink: 0 }} />;
}

/* ── Right description panel ── */
function RightDesc({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="shrink-0 w-[241px] self-stretch overflow-clip"
      style={{
        background: "#f8fafd",
        borderLeft: "1px solid #c2c2c2",
        padding: "16px 20px",
      }}
    >
      <p style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 18, color: "#000", marginBottom: 8 }}>
        {title}
      </p>
      <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, fontSize: 14, color: "#000", lineHeight: 1.6, textAlign: "justify" }}>
        {children}
      </div>
    </div>
  );
}

/* ── Outer row wrapper ── */
function LayerRow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      border: "1px solid #b7b7b7", borderRadius: 12, overflow: "clip",
      display: "flex", flexDirection: "row", alignItems: "stretch",
      width: "100%", ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Small signal card (Layer 03) ── */
function SignalCard({ title, sub, borderColor }: { title: string; sub: string; borderColor: string }) {
  return (
    <div style={{
      flex: "1 0 140px", border: `1px solid ${borderColor}`, borderRadius: 8,
      background: "#fff", padding: "8px", height: 58,
      display: "flex", flexDirection: "column", justifyContent: "center", gap: 4,
    }}>
      <p style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 14, color: "#000" }}>{title}</p>
      <p style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, fontSize: 12, color: "#000" }}>{sub}</p>
    </div>
  );
}

const DESIGN_WIDTH = 1961;

/* ── Main component ── */
export function PowerAIMap() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale]             = useState(1);
  const [wrapperHeight, setWrapperHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const update = () => {
      const available = wrapper.clientWidth;
      const s = Math.min(1, available / DESIGN_WIDTH);
      setScale(s);
      setWrapperHeight(content.scrollHeight * s);
    };

    const obs = new ResizeObserver(update);
    obs.observe(wrapper);
    update();
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: wrapperHeight }}>
      <div ref={contentRef} style={{ background: "#fff", fontFamily: "'Manrope', sans-serif", color: "#000", width: DESIGN_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}>

      {/* ════════════════ HEADER ════════════════ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, marginBottom: 4 }}>
        {/* left: logo + tagline */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: 440 }}>
          <div style={{ position: "relative", height: 62, width: 194, flexShrink: 0, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/power-tech-logo.png" alt="Power Technology" style={{ position: "absolute", maxWidth: "none", width: "254%", height: "560%", top: "-230%", left: "-77%" }} />
          </div>
          <div style={{ width: 1, alignSelf: "stretch", background: "#ccc" }} />
          <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, fontSize: 12, lineHeight: 1.6 }}>
            <span>A </span><span style={{ fontWeight: 700, color: "#162485" }}>POWER TECHNOLOGY</span><span> INITIATIVE</span>
            <br />
            <span>BACKED BY </span><span style={{ fontWeight: 700, color: "#162485" }}>NEOS PARTNERS</span>
          </div>
        </div>

        {/* center: title */}
        <div style={{ textAlign: "center", flex: 1 }}>
          <p style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 58, color: "#42c0f1", lineHeight: 1, margin: 0 }}>
            POWER AI
          </p>
          <p style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, fontSize: 24, color: "#000", margin: "6px 0 0" }}>
            Industrial Task Intelligence Platform Architecture &amp; System Model
          </p>
        </div>

        {/* right: metadata */}
        <div style={{ textAlign: "right", width: 440, fontFamily: "'Manrope', sans-serif", fontWeight: 300, fontSize: 14, letterSpacing: "2.38px", lineHeight: 2.2 }}>
          <p style={{ margin: 0 }}>CONCEPTUAL MODEL v1.0</p>
          <p style={{ margin: 0 }}>APRIL 2026</p>
          <p style={{ margin: 0 }}>CONFIDENTIAL</p>
        </div>
      </div>

      <div style={{ height: 1, background: "#ccc", marginBottom: 12 }} />

      {/* ════════════════ LAYERS ════════════════ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ── Layer 01: Factory Floor ── */}
        <LayerRow>
          <LayerLabel
            num="LAYER 01" title="FACTORY FLOOR"
            desc={"Switchgear assembly line • one plant, one pilot cell"}
            accentColor="#091d49" fromColor="rgba(186,232,250,0.47)"
          />
          <VDivider />

          {/* content */}
          <div style={{ flex: 1, padding: "12px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
            {/* task cards row */}
            <div style={{ display: "flex", alignItems: "center", gap: 0, height: 155 }}>
              {/* Structure */}
              <div style={{ flex: 1, border: "1px solid #42c0f1", borderRadius: 8, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, padding: "6px 8px", background: "#fff" }}>
                <div style={{ color: "#000" }}>{ICON_GRID}</div>
                <p style={{ fontWeight: 700, fontSize: 18, textAlign: "center", margin: 0 }}>Structure</p>
                <p style={{ fontWeight: 400, fontSize: 12, textAlign: "center", margin: 0 }}>Frame Assembly</p>
              </div>
              {CHEVRON}
              {/* Busbar Install — PILOT CELL */}
              <div style={{ flex: 1, border: "1px solid #42c0f1", borderRadius: 8, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, padding: "6px 8px", position: "relative", background: "linear-gradient(to bottom, rgba(186,232,250,0.6) 0%, #fff 72%)" }}>
                <div style={{ color: "#000" }}>{ICON_LAYERS}</div>
                <p style={{ fontWeight: 700, fontSize: 18, textAlign: "center", margin: 0 }}>Busbar Install</p>
                <p style={{ fontWeight: 400, fontSize: 12, textAlign: "center", margin: 0 }}>Lug termination · MV</p>
                <p style={{ fontWeight: 500, fontSize: 12, color: "#2426b6", letterSpacing: "1.2px", margin: 0, position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>PILOT CELL</p>
              </div>
              {CHEVRON}
              {/* Breaker Assy */}
              <div style={{ flex: 1, border: "1px solid #42c0f1", borderRadius: 8, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, padding: "6px 8px", background: "#fff" }}>
                <div style={{ color: "#000" }}>{ICON_CARD}</div>
                <p style={{ fontWeight: 700, fontSize: 18, textAlign: "center", margin: 0 }}>Breaker Assy</p>
                <p style={{ fontWeight: 400, fontSize: 12, textAlign: "center", margin: 0 }}>Component mount</p>
              </div>
              {CHEVRON}
              {/* Control Wire — PILOT CELL */}
              <div style={{ flex: 1, border: "1px solid #42c0f1", borderRadius: 8, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, padding: "6px 8px", position: "relative", background: "linear-gradient(to bottom, rgba(186,232,250,0.6) 0%, #fff 72%)" }}>
                <div style={{ color: "#000" }}>{ICON_WAVE}</div>
                <p style={{ fontWeight: 700, fontSize: 18, textAlign: "center", margin: 0 }}>Control Wire</p>
                <p style={{ fontWeight: 400, fontSize: 12, textAlign: "center", margin: 0 }}>Routing · termination</p>
                <p style={{ fontWeight: 500, fontSize: 12, color: "#2426b6", letterSpacing: "1.2px", margin: 0, position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>PILOT CELL</p>
              </div>
              {CHEVRON}
              {/* Final/QC */}
              <div style={{ flex: 1, border: "1px solid #42c0f1", borderRadius: 8, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, padding: "6px 8px", background: "#fff" }}>
                <div style={{ color: "#000" }}>{ICON_CHECK}</div>
                <p style={{ fontWeight: 700, fontSize: 18, textAlign: "center", margin: 0 }}>Final / QC</p>
                <p style={{ fontWeight: 400, fontSize: 12, textAlign: "center", margin: 0 }}>Test · inspect</p>
              </div>
            </div>
            <p style={{ fontWeight: 400, fontSize: 12, textAlign: "center", color: "#000", margin: 0 }}>
              Everything that follows serves these two pilot stations first.
            </p>
          </div>

          <RightDesc title="FACTORY FLOOR">
            The physical scope. One plant, one cell, two tasks:{" "}
            <strong>busbar installation</strong> and <strong>control wire routing</strong>.
            Every layer above exists to serve these two stations first, before scaling across the portfolio.
          </RightDesc>
        </LayerRow>

        {/* ── Layer 02: Capture Layer ── */}
        <LayerRow>
          <LayerLabel
            num="LAYER 02" title="CAPTURE LAYER"
            desc="Multi-modal instrumentation of the pilot stations"
            accentColor="#091d49" fromColor="rgba(186,232,250,0.47)"
          />
          <VDivider />
          <div style={{ flex: 1, padding: "12px 24px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
            {/* row 1 */}
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { title: "Fixed Cameras",    sub: "4K-wide + close-up · always-on exocentric" },
                { title: "Depth Cameras",    sub: "Intel RealSense D455 · part placement" },
                { title: "Head / Chest Cam", sub: "Aria Gen 2 · GoPro · scheduled egocentric" },
                { title: "Wearables · IMU",  sub: "Xsens · biomechanics campaigns only" },
                { title: "Torque Tools",     sub: "Atlas Copco · digital Open Protocol" },
              ].map((d) => (
                <div key={d.title} style={{ flex: 1, border: "1px solid #d9d9d9", borderRadius: 8, background: "#fff", padding: 12, display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
                  <p style={{ fontWeight: 700, fontSize: 18, margin: 0, whiteSpace: "nowrap" }}>{d.title}</p>
                  <p style={{ fontWeight: 400, fontSize: 12, margin: 0 }}>{d.sub}</p>
                </div>
              ))}
            </div>
            {/* row 2 */}
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { title: "Scanners · Tablets", sub: "WO scan · drawing display at the station" },
                { title: "Edge Compute",        sub: "NVIDIA Jetson AGX Orin · per station" },
              ].map((d) => (
                <div key={d.title} style={{ flex: 1, border: "1px solid #d9d9d9", borderRadius: 8, background: "#fff", padding: 12, display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
                  <p style={{ fontWeight: 700, fontSize: 18, margin: 0, whiteSpace: "nowrap" }}>{d.title}</p>
                  <p style={{ fontWeight: 400, fontSize: 12, margin: 0 }}>{d.sub}</p>
                </div>
              ))}
              {/* spacer */}
              <div style={{ flex: 3 }} />
            </div>
          </div>
          <RightDesc title="CAPTURE LAYER">
            Fixed cameras run continuously. Egocentric and wearable capture run{" "}
            <strong>only in consented, scheduled campaigns</strong>. Commodity hardware — we leverage
            NVIDIA, Axis, Intel, Atlas Copco. No hardware is built in-house.
          </RightDesc>
        </LayerRow>

        {/* ── Layer 03: Signal Layer ── */}
        <LayerRow>
          <LayerLabel
            num="LAYER 03" title="SIGNAL LAYER"
            desc="Two convergent streams enter the platform"
            accentColor="#091d49" fromColor="rgba(186,232,250,0.47)"
          />
          <VDivider />
          <div style={{ flex: 1, padding: "12px 24px", display: "flex", alignItems: "center", gap: 14 }}>
            {/* Sensor Signals */}
            <div style={{ flex: 1, border: "1px dashed #2426b6", borderRadius: 12, background: "#fbfafd", padding: 12, display: "flex", flexDirection: "column", gap: 7, alignSelf: "stretch" }}>
              <p style={{ fontWeight: 700, fontSize: 18, color: "#2426b6", margin: 0, whiteSpace: "nowrap" }}>SENSOR SIGNALS</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {[
                  ["Video Streams",   "fixed · 4K"],
                  ["Egocentric Clips","Aria · GoPro"],
                  ["Depth · Motion",  "RealSense"],
                  ["Tool Events",     "torque · fastner"],
                  ["Cycle Events",    "start / stop"],
                  ["Operator ID",     "hashed"],
                ].map(([t, s]) => (
                  <SignalCard key={t} title={t} sub={s} borderColor="#2426b6" />
                ))}
              </div>
            </div>

            {/* THE JOIN badge */}
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 35, height: 86 }}>
              <div style={{ transform: "rotate(-90deg)", whiteSpace: "nowrap" }}>
                <div style={{ border: "1px solid #2426b6", borderRadius: 8, background: "#fff", padding: "8px 12px" }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#2426b6", margin: 0 }}>THE JOIN</p>
                </div>
              </div>
            </div>

            {/* Enterprise Signals */}
            <div style={{ flex: 1, border: "1px dashed #42c0f1", borderRadius: 12, background: "#f0fafe", padding: 12, display: "flex", flexDirection: "column", gap: 7, alignSelf: "stretch" }}>
              <p style={{ fontWeight: 700, fontSize: 18, color: "#42c0f1", margin: 0, whiteSpace: "nowrap" }}>ENTERPRISE SIGNALS</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {[
                  ["BOM",         "ERP"],
                  ["Work Order",  "ERP · MES"],
                  ["Drawing Rev", "PLM"],
                  ["Quality",     "MES · Async"],
                  ["Project",     "Monday.com"],
                  ["Operator HR", "hashed"],
                ].map(([t, s]) => (
                  <SignalCard key={t} title={t} sub={s} borderColor="#42c0f1" />
                ))}
              </div>
            </div>
          </div>
          <RightDesc title="SIGNAL LAYER">
            The physical world records <strong>what happened</strong>. The enterprise systems record{" "}
            <strong>what was supposed to happen.</strong> Intelligence lives in the delta between the two
            streams — the join nobody else has built for ETO.
          </RightDesc>
        </LayerRow>

        {/* ── Layer 04: Data Foundation ── */}
        <LayerRow>
          <LayerLabel
            num="LAYER 04" title="DATA FOUNDATION"
            desc={"Raw → cleaned → business-ready  ·  three-tier lakehouse"}
            accentColor="#ffa912" fromColor="#fdf5e7"
            titleColor="#ffa912"
          />
          <VDivider />
          <div style={{ flex: 1, padding: "12px 24px", display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", border: "1px solid #b7b7b7", borderRadius: 16, overflow: "clip", width: "100%", height: 188 }}>
              {/* Bronze */}
              <div style={{ flex: 1, background: "linear-gradient(to bottom, rgba(175,115,62,0.3) 0%, #fff 80%)", borderRight: "1px solid #b7b7b7" }}>
                <div style={{ background: "#af733e", height: 51, display: "flex", alignItems: "center", padding: "0 12px" }}>
                  <p style={{ fontWeight: 800, fontSize: 21, color: "#fff", letterSpacing: "3.78px", margin: 0 }}>BRONZE</p>
                </div>
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>Raw &amp; Ingested</p>
                  <p style={{ fontWeight: 400, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                    Sensor clips, tool events, ERP pulls land untouched. Time-synced, tagged, parked on Delta + Azure Blob.
                  </p>
                </div>
              </div>
              {/* Silver */}
              <div style={{ flex: 1, background: "linear-gradient(to bottom, rgba(112,144,192,0.3) 5%, #fff 77%)", borderRight: "1px solid #b7b7b7" }}>
                <div style={{ background: "#7090c0", height: 51, display: "flex", alignItems: "center", padding: "0 12px" }}>
                  <p style={{ fontWeight: 800, fontSize: 21, color: "#fff", letterSpacing: "3.78px", margin: 0 }}>SILVER</p>
                </div>
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>Cleaned &amp; Joined</p>
                  <p style={{ fontWeight: 400, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                    Clips segmented. BOM, WO, drawing, operator, quality joined on the timeline. Standardized schema.
                  </p>
                </div>
              </div>
              {/* Gold */}
              <div style={{ flex: 1, background: "linear-gradient(to bottom, rgba(200,145,58,0.3) 5%, #fff 77%)" }}>
                <div style={{ background: "#c8913a", height: 51, display: "flex", alignItems: "center", padding: "0 12px" }}>
                  <p style={{ fontWeight: 800, fontSize: 21, color: "#fff", letterSpacing: "3.78px", margin: 0 }}>GOLD</p>
                </div>
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>Curated &amp; Task-Ready</p>
                  <p style={{ fontWeight: 400, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                    Labeled task episodes. Human-reviewed. Versioned ontology. The structured corpus that powers everything above.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <RightDesc title="DATA FOUNDATION">
            The core enabler. Raw sensor and enterprise data is cleansed, joined, validated, and elevated to Gold status. Includes{" "}
            <strong>task-episode mastering,</strong> standardized ontology, and drawing-revision reference integration.
          </RightDesc>
        </LayerRow>

        {/* ── Layer 05: Task Intelligence Core ── */}
        <LayerRow style={{ minHeight: 324 }}>
          <LayerLabel
            num="LAYER 05"
            title={"TASK\nINTELLIGENCE\nCORE"}
            desc="Where fused data becomes one structured object"
            accentColor="#2426b6" fromColor="rgba(141,142,235,0)"
            titleColor="#2426b6"
          />
          <VDivider />
          <div style={{ flex: 1, padding: "12px 24px", display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 36, width: "100%", alignItems: "stretch" }}>
              {/* TASK EPISODE card */}
              <div style={{ flex: 1, border: "1px solid #b7b7b7", borderRadius: 8, overflow: "clip", height: 300, display: "flex", flexDirection: "column" }}>
                <div style={{ borderTop: "6px solid #42c0f1", padding: 12, flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontWeight: 700, fontSize: 16, color: "#00037c", margin: 0 }}>TASK EPISODE</p>
                    <p style={{ fontWeight: 500, fontSize: 12, color: "#42bff1", letterSpacing: "1.44px", margin: 0 }}>v1.0 · the object</p>
                  </div>
                  <div style={{ height: 1, background: "#e0e0e0" }} />
                  <div style={{ display: "flex", gap: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#000", flex: 1 }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {["task_id","work_order_id","bom_snapshot_id","drawing_rev_id","operator_id","cycle_time","tool_events","quality_outcome","video_clips","human_labels"].map(k => (
                        <p key={k} style={{ lineHeight: "23px", margin: 0 }}>{k}</p>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {["busbar_install_MV","WO-78432","BOM-v4.2","DRW-117-C","(hashed)","184 sec","torque × 6","pass · no rework","3 angles · 30 sec","reviewed by SME"].map(v => (
                        <p key={v} style={{ lineHeight: "23px", margin: 0, whiteSpace: "nowrap" }}>{v}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* DERIVED ASSETS */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7, justifyContent: "center" }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#00037c", margin: 0 }}>DERIVED ASSETS</p>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, gap: 8 }}>
                  {[
                    { title: "Labeled clips",          sub: "Event-aligned, ontology-versioned" },
                    { title: "Cycle-time features",    sub: "Distributions, drift, outliers" },
                    { title: "Rework markers",         sub: "Root-cause clips linked to defects" },
                    { title: "Ergonomic indicators",   sub: "Posture, reach, strain by operator" },
                    { title: "Variant-aware metadata", sub: "BOM · drawing revision context" },
                  ].map((item) => (
                    <div key={item.title} style={{ border: "1px solid rgba(183,183,183,0.5)", borderRadius: 8, overflow: "clip" }}>
                      <div style={{ borderLeft: "4px solid #42c0f1", padding: "7px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{item.title}</p>
                        <p style={{ fontWeight: 400, fontSize: 10, margin: 0 }}>{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <RightDesc title="TASK INTELLIGENCE CORE">
            The moat. Not a video archive — a structured record of{" "}
            <strong>how this specific thing was built, by this specific person, against this specific drawing revision,
            with this specific outcome</strong>. This is what compounds in value over years.
          </RightDesc>
        </LayerRow>

        {/* ── Layer 06: Intelligence & Product ── */}
        <LayerRow style={{ minHeight: 212 }}>
          <LayerLabel
            num="LAYER 06" title={"INTELLIGENCE &\nPRODUCT"}
            desc={"Three strategic questions  ·  nine capabilities"}
            accentColor="#42c0f1" fromColor="rgba(186,232,250,0.47)"
            titleColor="#42c0f1"
          />
          <VDivider />
          <div style={{ flex: 1, padding: "12px 24px", display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 16, width: "100%", alignSelf: "stretch" }}>
              {[
                { q: "Where are we?",    title: "Operational Visibility", bullets: ["Cycle-time & throughput", "Bottleneck detection", "Standard-work compliance"] },
                { q: "What went wrong?", title: "Root-Cause & Risk",      bullets: ["Rework attribution", "Ergonomic insights", "Semantic task search"] },
                { q: "What's Next?",     title: "Knowledge & Feedback",   bullets: ["Task knowledge graph", "Training library", "Design feedback loop"] },
              ].map((col) => (
                <div key={col.q} style={{ flex: 1, border: "1px solid #b7b7b7", borderRadius: 16, overflow: "clip", display: "flex", flexDirection: "column" }}>
                  <div style={{ borderTop: "4px solid #42c0f1", padding: 12, flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    <p style={{ fontWeight: 700, fontSize: 16, color: "#42c0f1", margin: 0 }}>{col.q}</p>
                    <p style={{ fontWeight: 700, fontSize: 18, color: "#000", margin: 0 }}>{col.title}</p>
                    <div style={{ fontWeight: 400, fontSize: 14, lineHeight: "27px" }}>
                      {col.bullets.map(b => <p key={b} style={{ margin: 0 }}>• {b}</p>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <RightDesc title="INTELLIGENCE & PRODUCT">
            The product surface. Answers three questions plant leaders ask every day. Delivered as role-based dashboards, self-service views, and natural-language search —{" "}
            <strong>&ldquo;Show me every busbar crimp on a 3000A section that later had a QC hold.&rdquo;</strong>
          </RightDesc>
        </LayerRow>

        {/* ── Layer 07: Strategic Outcome ── */}
        <LayerRow style={{ minHeight: 212 }}>
          <LayerLabel
            num="LAYER 07" title="STRATEGIC OUTCOME"
            desc={"What compounds across years  ·  NOW · NEXT · LATER"}
            accentColor="#64cbf4" fromColor="rgba(186,232,250,0.47)"
          />
          <VDivider />
          <div style={{ flex: 1, padding: "12px 24px", display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 16, width: "100%", alignSelf: "stretch" }}>
              {/* NOW */}
              <div style={{ flex: 1, border: "1px solid #b7b7b7", borderRadius: 16, overflow: "clip", display: "flex", flexDirection: "column" }}>
                <div style={{ borderTop: "4px solid #000", padding: 12, flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                  <p style={{ fontWeight: 800, fontSize: 14, letterSpacing: "2.38px", margin: 0 }}>NOW</p>
                  <p style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>Operations Intelligence</p>
                  <p style={{ fontWeight: 400, fontSize: 14, lineHeight: "24px", margin: 0 }}>
                    Revenue engine. Cycle time, rework attribution, ergonomics, standard work — sold per station per month to plant leadership.
                  </p>
                </div>
              </div>
              {/* NEXT */}
              <div style={{ flex: 1, border: "1px solid #b7b7b7", borderRadius: 16, overflow: "clip", display: "flex", flexDirection: "column", background: "linear-gradient(to bottom, rgba(240,229,255,0.24) 0%, #fff 60%)" }}>
                <div style={{ borderTop: "4px solid #162485", padding: 12, flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                  <p style={{ fontWeight: 800, fontSize: 14, color: "#162485", letterSpacing: "2.38px", margin: 0 }}>NEXT</p>
                  <p style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>Multi-Plant Learning</p>
                  <p style={{ fontWeight: 400, fontSize: 14, lineHeight: "24px", margin: 0 }}>
                    Templated deployment across Neos portfolio. Cross-plant benchmarking and knowledge transfer. The differentiator.
                  </p>
                </div>
              </div>
              {/* LATER */}
              <div style={{ flex: 1, border: "1px solid #b7b7b7", borderRadius: 16, overflow: "clip", display: "flex", flexDirection: "column", background: "linear-gradient(to bottom, #e3f7ff 10%, #fff 73%)" }}>
                <div style={{ borderTop: "4px solid #42c0f1", padding: 12, flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                  <p style={{ fontWeight: 800, fontSize: 14, color: "#42c0f1", letterSpacing: "2.38px", margin: 0 }}>LATER</p>
                  <p style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>Robotics Readiness</p>
                  <p style={{ fontWeight: 400, fontSize: 14, lineHeight: "24px", margin: 0 }}>
                    Proprietary ETO task corpus. Licensing and co-development with humanoid and VLA partners. The long game.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <RightDesc title="STRATEGIC OUTCOME">
            We build the operations intelligence system of record for complex ETO electrical manufacturing.{" "}
            <strong>The proprietary robotics-ready dataset compounds quietly underneath it.</strong>
          </RightDesc>
        </LayerRow>

        {/* ════════════════ PHASED ROADMAP ════════════════ */}
        <div style={{ height: 1, background: "#ccc", margin: "4px 0" }} />

        <div style={{ border: "1px solid #b7b7b7", borderRadius: 16, overflow: "clip", display: "flex", height: 157 }}>
          {/* header cell */}
          <div style={{ background: "#0a1d4a", borderLeft: "6px solid #42c0f1", padding: "12px 21px", display: "flex", flexDirection: "column", gap: 14, justifyContent: "center", minWidth: 220, flexShrink: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: "#42c0f1", letterSpacing: "2.88px", margin: 0 }}>PHASED ROADMAP</p>
            <p style={{ fontWeight: 700, fontSize: 24, color: "#fff", margin: 0 }}>24-Month Execution</p>
            <p style={{ fontWeight: 400, fontSize: 14, color: "#fff", margin: 0 }}>From one pilot cell to a platform ready for robotics partnerships.</p>
          </div>

          {/* Phase 0 — NOW (highlighted) */}
          <div style={{ flex: 1, background: "#ddf3fc", borderTop: "4px solid #42c0f1", borderLeft: "1px solid #b7b7b7", padding: 12, display: "flex", flexDirection: "column", gap: 9 }}>
            <p style={{ fontWeight: 700, fontSize: 12, color: "#162485", letterSpacing: "2.04px", margin: 0 }}>PHASE 0 · NOW</p>
            <p style={{ fontWeight: 700, fontSize: 16, color: "#000", margin: 0 }}>Pilot Definition</p>
            <p style={{ fontWeight: 700, fontSize: 12, color: "#686868", letterSpacing: "2.04px", margin: 0 }}>WEEKS 1–4</p>
            <p style={{ fontWeight: 400, fontSize: 12, lineHeight: "24px", color: "#000", margin: 0 }}>Plant chosen, tasks locked, consent signed, budget committed.</p>
          </div>

          {/* Phases 1–4 */}
          {[
            { label: "PHASE 1",    title: "Data Capture",         time: "MONTH 0–3",   desc: "Instrument the cell, stand up labeling, link video to ERP & drawings." },
            { label: "PHASE 2",    title: "Operational ROI",      time: "MONTH 3–6",   desc: "First dashboards live. Rework root-cause proven. Cycle time reduced." },
            { label: "PHASE 3",    title: "Multi-Plant Rollout",  time: "MONTH 6–12",  desc: "Templated deployment to second portco. Semantic search shipped." },
            { label: "PHASE 4",    title: "Robotics Partnerships",time: "MONTH 12–24", desc: "Five plants live. First LOI with a humanoid or VLA partner." },
          ].map((p) => (
            <div key={p.label} style={{ flex: 1, borderLeft: "1px solid #b7b7b7", padding: 12, display: "flex", flexDirection: "column", gap: 9 }}>
              <p style={{ fontWeight: 700, fontSize: 12, color: "#162485", letterSpacing: "2.04px", margin: 0 }}>{p.label}</p>
              <p style={{ fontWeight: 700, fontSize: 16, color: "#000", margin: 0 }}>{p.title}</p>
              <p style={{ fontWeight: 700, fontSize: 12, color: "#686868", letterSpacing: "2.04px", margin: 0 }}>{p.time}</p>
              <p style={{ fontWeight: 400, fontSize: 12, lineHeight: "24px", color: "#000", margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
    </div>
  );
}
