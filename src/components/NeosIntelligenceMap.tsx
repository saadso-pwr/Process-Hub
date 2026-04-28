"use client";

import { useRef, useEffect, useState } from "react";

const DESIGN_WIDTH = 3551;
const DESIGN_HEIGHT = 3173;
const FF = "'Manrope', sans-serif";

const BLUE_DARK = "#00037c";
const BLUE_MID = "#162485";
const BLUE_CORE = "#2437bb";
const BLUE_ACCENT = "#42c0f1";
const PURPLE = "#9a5def";
const PURPLE_LIGHT = "#561da7";

// Trapezoid: wide at top, narrow at bottom (top section of pyramid)
const TRAP_TOP = "polygon(0% 0%, 100% 0%, 94.44% 100%, 5.56% 100%)";
// Trapezoid: narrow at top, wide at bottom (bottom section of pyramid)
const TRAP_BTM = "polygon(5.56% 0%, 94.44% 0%, 100% 100%, 0% 100%)";

function AnnotLine({ w, color = "#BAE8FA" }: { w: number; color?: string }) {
  const r = 2.67;
  const d = r * 2;
  return (
    <div style={{ position: "relative", width: w, height: d, flexShrink: 0, alignSelf: "center" }}>
      <div style={{ position: "absolute", width: d, height: d, borderRadius: "50%", background: color, top: 0, left: 0 }} />
      <div style={{ position: "absolute", top: r - 0.5, left: d, right: d, height: 1, background: color }} />
      <div style={{ position: "absolute", width: d, height: d, borderRadius: "50%", background: color, top: 0, right: 0 }} />
    </div>
  );
}

function AnnotBlock({
  x, y, w, h, lineW, lineColor = "#BAE8FA",
  title, titleColor = BLUE_ACCENT, children,
}: {
  x: number; y: number; w: number; h: number; lineW: number; lineColor?: string;
  title: string; titleColor?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, display: "flex", alignItems: "center", gap: 23 }}>
      <AnnotLine w={lineW} color={lineColor} />
      <div style={{ width: 470, flexShrink: 0 }}>
        <p style={{ fontFamily: FF, fontWeight: 700, fontSize: 28, color: titleColor, whiteSpace: "nowrap", margin: 0, marginBottom: 10, lineHeight: 1.2 }}>{title}</p>
        <div style={{ fontFamily: FF, fontWeight: 400, fontSize: 18, color: BLUE_MID, lineHeight: 1.5, textAlign: "justify" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function NeosIntelligenceMap() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [wrapperHeight, setWrapperHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const update = () => {
      const s = Math.min(1, wrapper.clientWidth / DESIGN_WIDTH);
      setScale(s);
      setWrapperHeight(DESIGN_HEIGHT * s);
    };
    const obs = new ResizeObserver(update);
    obs.observe(wrapper);
    update();
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: wrapperHeight }}>
      <div ref={contentRef} style={{
        position: "relative",
        width: DESIGN_WIDTH,
        height: DESIGN_HEIGHT,
        background: "#fff",
        fontFamily: FF,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}>

        {/* ── LAYER BANDS ── */}

        {/* DATA SOURCES — wide at top */}
        <div style={{ position: "absolute", left: 469, top: 273, width: 2019, height: 225, background: "#DDF3FC", clipPath: TRAP_TOP }} />

        {/* INTEGRATION PIPELINE */}
        <div style={{ position: "absolute", left: 597, top: 519, width: 1763, height: 225, background: "#CBEEFB", clipPath: TRAP_TOP }} />

        {/* DATA FOUNDATION */}
        <div style={{ position: "absolute", left: 711, top: 765, width: 1535, height: 225, background: "#FDF4E5", clipPath: TRAP_TOP }} />

        {/* AI AGENTS — fill-opacity 0.14 */}
        <div style={{ position: "absolute", left: 761, top: 1541, width: 1435, height: 225, background: "rgba(154,93,239,0.14)", clipPath: TRAP_BTM }} />

        {/* ASK NEO — fill-opacity 0.10 */}
        <div style={{ position: "absolute", left: 656, top: 1783, width: 1646, height: 225, background: "rgba(154,93,239,0.10)", clipPath: TRAP_BTM }} />

        {/* PRESENTATION & EXPERIENCE */}
        <div style={{ position: "absolute", left: 537, top: 2025, width: 1884, height: 225, background: "#BAE8FA", clipPath: TRAP_BTM }} />

        {/* ROLE BASED ACCESS */}
        <div style={{ position: "absolute", left: 407, top: 2266, width: 2144, height: 225, background: "#CBEEFB", clipPath: TRAP_BTM }} />

        {/* USERS */}
        <div style={{ position: "absolute", left: 248, top: 2512, width: 2462, height: 225, background: "#DDF3FC", clipPath: TRAP_BTM }} />

        {/* ── INTELLIGENCE CORE (x=713, y=1031, w=1531, h=469) ── */}

        {/* Outer pill glow */}
        <div style={{
          position: "absolute", left: 713 - 80, top: 1031 - 19, width: 1691, height: 506,
          borderRadius: 600, background: "rgba(203,238,251,0.29)",
        }} />
        {/* Inner pill */}
        <div style={{
          position: "absolute", left: 713, top: 1031 + 126, width: 1531, height: 272,
          borderRadius: 600, background: "#cbeefb",
        }} />
        {/* Concentric ellipses */}
        <div style={{ position: "absolute", left: 713 + 559, top: 1031 + 56, width: 412, height: 412, borderRadius: "50%", background: "#98DDF8" }} />
        <div style={{ position: "absolute", left: 713 + 605, top: 1031 + 101, width: 321, height: 322, borderRadius: "50%", background: "#A9E2F9" }} />
        <div style={{ position: "absolute", left: 713 + 652, top: 1031 + 149, width: 227, height: 226, borderRadius: "50%", background: "#CBEEFB" }} />
        <div style={{ position: "absolute", left: 713 + 701, top: 1031 + 197, width: 129, height: 130, borderRadius: "50%", background: "#DDF3FC" }} />

        {/* INTELLIGENCE CORE label */}
        <p style={{
          position: "absolute", left: 713 + 458, top: 1031 - 8, width: 598,
          fontFamily: FF, fontWeight: 700, fontSize: 46, color: BLUE_ACCENT, textAlign: "center",
          margin: 0, lineHeight: 1.2,
        }}>
          INTELLIGENCE CORE
        </p>

        {/* "Where are we?" */}
        <p style={{
          position: "absolute", left: 713 + 582, top: 1031 + 161, width: 183,
          fontFamily: FF, fontWeight: 800, fontSize: 22, color: BLUE_CORE, textAlign: "center",
          margin: 0,
        }}>
          Where are we?
        </p>

        {/* Left text block */}
        <div style={{
          position: "absolute", left: 713 + 7, top: 1031 + 180, width: 567,
          fontFamily: FF, fontWeight: 400, fontSize: 24, color: "#484ac2", textAlign: "center", lineHeight: 1.6,
        }}>
          <p style={{ margin: 0 }}>Master Data &amp; Common Definitions</p>
          <p style={{ margin: 0 }}>Cross-Portfolio Mapping</p>
          <p style={{ margin: 0 }}>Account &amp; Market Harmonization</p>
        </div>

        {/* Right text block */}
        <div style={{
          position: "absolute", left: 713 + 956, top: 1031 + 180, width: 567,
          fontFamily: FF, fontWeight: 400, fontSize: 24, color: "#484ac2", textAlign: "center", lineHeight: 1.6,
        }}>
          <p style={{ margin: 0 }}>Relationship Intelligence</p>
          <p style={{ margin: 0 }}>Whitespace &amp; Cross-Sell</p>
          <p style={{ margin: 0 }}>Intel Portfolio KPI Models</p>
        </div>

        {/* "What's next?" */}
        <p style={{
          position: "absolute", left: 713 + 830, top: 1031 + 245, width: 162,
          fontFamily: FF, fontWeight: 800, fontSize: 22, color: BLUE_CORE, textAlign: "center",
          margin: 0,
        }}>
          What&apos;s next?
        </p>

        {/* "Where's the opportunity?" */}
        <p style={{
          position: "absolute", left: 713 + 543, top: 1031 + 325, width: 318,
          fontFamily: FF, fontWeight: 800, fontSize: 22, color: BLUE_CORE, textAlign: "center",
          margin: 0,
        }}>
          Where&apos;s the opportunity?
        </p>

        {/* ── TITLE ── */}
        <div style={{ position: "absolute", left: 1080, top: 97, width: 799, textAlign: "center" }}>
          <p style={{ fontFamily: FF, fontWeight: 700, fontSize: 72, color: "#2326b6", margin: 0, lineHeight: 1.2 }}>
            NEOS INTELLIGENCE
          </p>
          <p style={{ fontFamily: FF, fontWeight: 400, fontSize: 24, color: BLUE_MID, margin: 0 }}>
            Unified Portfolio Intelligence Platform • Architecture &amp; Experience Model
          </p>
        </div>

        {/* ── DATA SOURCES CONTENT (x=964, y=311) ── */}
        <div style={{ position: "absolute", left: 964, top: 311, width: 1030, textAlign: "center" }}>
          <p style={{ fontFamily: FF, fontWeight: 800, fontSize: 36, color: BLUE_DARK, margin: 0, marginBottom: 16 }}>
            DATA SOURCES
          </p>
          <div style={{ display: "flex", gap: 90, justifyContent: "center" }}>
            <div style={{ width: 470 }}>
              <p style={{ fontFamily: FF, fontWeight: 700, fontSize: 33, color: BLUE_ACCENT, margin: 0, marginBottom: 7 }}>Commercial Data</p>
              <p style={{ fontFamily: FF, fontWeight: 400, fontSize: 24, color: BLUE_MID, margin: 0 }}>CRM • Pipeline • Accounts</p>
            </div>
            <div style={{ width: 470 }}>
              <p style={{ fontFamily: FF, fontWeight: 700, fontSize: 33, color: BLUE_ACCENT, margin: 0, marginBottom: 7 }}>Market &amp; Opportunity Intel</p>
              <p style={{ fontFamily: FF, fontWeight: 400, fontSize: 24, color: BLUE_MID, margin: 0 }}>Power Insights • TAM • SAM • Sector Data</p>
            </div>
          </div>
        </div>

        {/* ── INTEGRATION PIPELINE CONTENT (x=831, y=563) ── */}
        <div style={{ position: "absolute", left: 831, top: 563, width: 1295, textAlign: "center" }}>
          <p style={{ fontFamily: FF, fontWeight: 800, fontSize: 36, color: BLUE_DARK, margin: 0, marginBottom: 16 }}>
            INTEGRATION PIPELINE
          </p>
          <p style={{ fontFamily: FF, fontWeight: 400, fontSize: 24, color: BLUE_MID, margin: 0, marginBottom: 0 }}>
            API Connectors • Batch Pipelines • File &amp; Excel Ingestion • Webhooks • Scheduled Refresh
          </p>
          <p style={{ fontFamily: FF, fontWeight: 400, fontSize: 18, color: BLUE_MID, margin: 0, marginTop: 8 }}>
            Connects all portco systems into a single, unified ingestion layer
          </p>
        </div>

        {/* ── DATA FOUNDATION CONTENT (x=813, y=790) ── */}
        <div style={{ position: "absolute", left: 813, top: 790, width: 1331, textAlign: "center" }}>
          <p style={{ fontFamily: FF, fontWeight: 800, fontSize: 36, color: "#744700", margin: 0, marginBottom: 16 }}>
            DATA FOUNDATION
          </p>
          <div style={{ display: "flex", gap: 22, justifyContent: "center", height: 109 }}>
            {[
              { label: "BRONZE", sub: "Raw & Ingested", color: "#af733e" },
              { label: "SILVER", sub: "Cleaned, Standardized & Validated", color: "#7090c0" },
              { label: "GOLD", sub: "Curated & Business-Ready", color: "#c8913a" },
            ].map(({ label, sub, color }) => (
              <div key={label} style={{
                width: 429, height: "100%", border: `3px solid ${color}`, borderRadius: 16,
                background: "#fff", display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 7,
              }}>
                <p style={{ fontFamily: FF, fontWeight: 700, fontSize: 30, color, margin: 0 }}>{label}</p>
                <p style={{ fontFamily: FF, fontWeight: 400, fontSize: 24, color, margin: 0 }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI AGENTS CONTENT (x=794, y=1575) ── */}
        <div style={{ position: "absolute", left: 794, top: 1575, width: 1371, textAlign: "center" }}>
          <p style={{ fontFamily: FF, fontWeight: 700, fontSize: 36, color: PURPLE, margin: 0, marginBottom: 11, textTransform: "uppercase" }}>
            AI AGENTS
          </p>
          <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
            {[
              { name: "Market Coverage Agent", desc: "Monitors TAM penetration gaps and surfaces emerging whitespace" },
              { name: "Portfolio Signal Agent", desc: "Detects cross-portco patterns and flags strategic inflection points" },
              { name: "GTM Strategy Agent", desc: "Tracks SAM expansion progress and recommends target-setting shifts" },
            ].map(({ name, desc }) => (
              <div key={name} style={{ width: 425, display: "flex", flexDirection: "column", gap: 7, alignItems: "center" }}>
                <p style={{ fontFamily: FF, fontWeight: 600, fontSize: 27, color: "#000", margin: 0 }}>{name}</p>
                <p style={{ fontFamily: FF, fontWeight: 400, fontSize: 20, color: BLUE_MID, margin: 0, width: 389 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ASK NEO CONTENT (x=996, y=1820) ── */}
        <div style={{ position: "absolute", left: 996, top: 1820, width: 965, textAlign: "center" }}>
          <p style={{ fontFamily: FF, fontWeight: 700, fontSize: 36, color: PURPLE, margin: 0, textTransform: "uppercase" }}>Ask Neo</p>
          <p style={{ fontFamily: FF, fontWeight: 600, fontSize: 23, color: PURPLE, margin: 0, marginBottom: 8 }}>AI Assistant</p>
          <div style={{ fontFamily: FF, fontWeight: 600, fontSize: 21, color: PURPLE_LIGHT, whiteSpace: "nowrap" }}>
            <p style={{ margin: 0 }}>Natural Language Q&amp;A • Auto-Generated Charts • Recommendations</p>
            <p style={{ margin: 0 }}>• Predictive Signals • Proactive Alerts • Ask Neo</p>
          </div>
        </div>

        {/* ── PRESENTATION & EXPERIENCE CONTENT (x=833, y=2058) ── */}
        <div style={{ position: "absolute", left: 833, top: 2058, width: 1290, textAlign: "center" }}>
          <p style={{ fontFamily: FF, fontWeight: 800, fontSize: 36, color: BLUE_DARK, margin: 0, marginBottom: 16 }}>
            PRESENTATION &amp; EXPERIENCE
          </p>
          <div style={{ display: "flex", gap: 90, justifyContent: "center" }}>
            <div style={{ width: 600 }}>
              <p style={{ fontFamily: FF, fontWeight: 600, fontSize: 30, color: "#000", margin: 0, marginBottom: 7 }}>Predefined Dashboards</p>
              <p style={{ fontFamily: FF, fontWeight: 400, fontSize: 24, color: BLUE_MID, margin: 0 }}>Role-based • Always-on • Fixed views</p>
            </div>
            <div style={{ width: 600 }}>
              <p style={{ fontFamily: FF, fontWeight: 600, fontSize: 30, color: "#000", margin: 0, marginBottom: 7 }}>Self-Service Dashboards</p>
              <p style={{ fontFamily: FF, fontWeight: 400, fontSize: 24, color: BLUE_MID, margin: 0 }}>AI builds • Saved to account • Editable</p>
            </div>
          </div>
        </div>

        {/* ── ROLE BASED ACCESS CONTENT (x=618, y=2302) ── */}
        <div style={{ position: "absolute", left: 618, top: 2302, width: 1721, textAlign: "center" }}>
          <p style={{ fontFamily: FF, fontWeight: 800, fontSize: 36, color: BLUE_DARK, margin: 0, marginBottom: 16, textTransform: "uppercase" }}>
            Role Based Access &amp; Visibility
          </p>
          <div style={{ display: "flex", gap: 100, justifyContent: "center" }}>
            {[
              { title: "Full Portfolio View", sub: "Neos Execs • GTM Leaders • Deal Team" },
              { title: "Portco + High-Level Cross-Portfolio", sub: "Operating Partners • Senior Advisors" },
              { title: "Own Portco Only", sub: "CROs • CFOs • COOs • Portco Leadership" },
            ].map(({ title, sub }) => (
              <div key={title} style={{ width: 507, display: "flex", flexDirection: "column", gap: 7, alignItems: "center" }}>
                <p style={{ fontFamily: FF, fontWeight: 600, fontSize: 30, color: "#000", margin: 0 }}>{title}</p>
                <p style={{ fontFamily: FF, fontWeight: 400, fontSize: 24, color: BLUE_MID, margin: 0 }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── USERS CONTENT (x=636, y=2541) ── */}
        <div style={{ position: "absolute", left: 636, top: 2541, width: 1686, textAlign: "center" }}>
          <p style={{ fontFamily: FF, fontWeight: 800, fontSize: 36, color: BLUE_DARK, margin: 0, marginBottom: 16 }}>USERS</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
            {["Neos Executives", "Senior Advisors", "Deal team", "PortCo CROs", "PortCo Leadership"].map((name) => (
              <div key={name} style={{
                width: 300, height: 80, border: "1px solid #42c0f1", borderRadius: 16,
                background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <p style={{ fontFamily: FF, fontWeight: 400, fontSize: 24, color: "#000", margin: 0, textAlign: "center" }}>{name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT-SIDE ANNOTATIONS ── */}

        <AnnotBlock x={2452} y={313} w={851} h={145} lineW={355} title="DATA SOURCES">
          Three categories of input data enter the platform: commercial CRM data from all portcos (incl. Forgent historical), structured market intelligence from Power Insights, and broader external signals.
        </AnnotBlock>

        <AnnotBlock x={2330} y={572} w={973} h={120} lineW={480} title="INTEGRATION PIPELINE">
          All data — regardless of source system or format — is ingested via APIs, batch pipelines, file uploads, and scheduled connectors into a unified data layer.
        </AnnotBlock>

        <AnnotBlock x={2221} y={811} w={1082} h={145} lineW={589} title="DATA FOUNDATION">
          The core enabler. Raw data is cleansed, validated, and elevated to Gold status. Includes account, product, and stage mastering, standardized taxonomy, and Power Insights TAM reference data integration.
        </AnnotBlock>

        <AnnotBlock x={2342} y={1188} w={961} h={158} lineW={468} title="INTELLIGENCE CORE" titleColor={BLUE_ACCENT}>
          <p style={{ margin: 0, marginBottom: 4 }}>The platform&apos;s brain. Answers three strategic questions:</p>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            <li>Where are we? (E3 Sales Ops)</li>
            <li>Where&apos;s the opportunity? (E1 TAM • E2 Cross-Sell)</li>
            <li>What&apos;s next? (predictions, targets, signals)</li>
          </ol>
        </AnnotBlock>

        <AnnotBlock x={2172} y={1597} w={1132} h={120} lineW={639} lineColor="#DBC2FF" title="AI AGENTS • Phase 2+" titleColor={PURPLE}>
          Autonomous agents that monitor the core, detect strategic signals, and proactively surface portfolio-level insights — without waiting to be asked.
        </AnnotBlock>

        <AnnotBlock x={2274} y={1811} w={1030} h={170} lineW={537} lineColor="#DBC2FF" title="ASK NEO" titleColor={PURPLE}>
          The conversational interface to the platform. Users ask questions in plain language and receive instant answers as text, auto-generated charts, or actionable recommendations — powered by the Intelligence Core and tailored to each user&apos;s role and scope.
        </AnnotBlock>

        <AnnotBlock x={2386} y={2061} w={918} h={145} lineW={425} title="PRESENTATION & EXPERIENCE">
          Information surfaces as predefined role-based dashboards, self-service views built by or with AI, or via Ask Neo — a conversational AI assistant that answers questions in plain language.
        </AnnotBlock>

        <AnnotBlock x={2515} y={2309} w={788} h={145} lineW={295} title="ROLE-BASED ACCESS">
          Visibility is governed by role. Neos executives and GTM leaders see the full portfolio. CROs access only their own portco data. The CRO Hub is a lighter, role-scoped version of the platform.
        </AnnotBlock>

        <AnnotBlock x={2657} y={2555} w={647} h={145} lineW={154} title="USERS">
          All portfolio stakeholders — from Neos executives to portco CROs and the Deal Team — each receive an experience tailored to their role, scope, and decision-making context.
        </AnnotBlock>

        {/* ── PHASE SECTION (x=248, y=2758) ── */}
        <div style={{ position: "absolute", left: 248, top: 2758, width: 2462, display: "flex", gap: 16 }}>
          {/* Phase 1 */}
          <div style={{
            width: 1406, background: "#f0fafe", border: "1px solid #ddf3fc",
            borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 24,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontFamily: FF, fontWeight: 700, fontSize: 24, color: BLUE_MID, margin: 0 }}>Phase 1</p>
              <div style={{ fontFamily: FF, fontWeight: 400, fontSize: 18, color: "#000", lineHeight: 1.5, margin: 0 }}>
                <p style={{ margin: 0 }}>Foundation →</p>
                <p style={{ margin: 0 }}>Internal CRM • Account Mastering • Portfolio Visibility • Cross-Sell Basics • TAM Overlay</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {["E0 Data Foundation", "E1 TAM & SAM Expansion", "E2 Cross-Sell Intelligence"].map((label) => (
                <div key={label} style={{
                  width: 450, height: 126, border: "1px solid #42c0f1", borderRadius: 16,
                  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <p style={{ fontFamily: FF, fontWeight: 400, fontSize: 24, color: "#000", margin: 0, textAlign: "center" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Phase 2+ */}
          <div style={{
            flex: 1, background: "#f0fafe", border: "1px solid #ddf3fc",
            borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 24,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontFamily: FF, fontWeight: 700, fontSize: 24, color: BLUE_MID, margin: 0 }}>Phase 2+</p>
              <div style={{ fontFamily: FF, fontWeight: 400, fontSize: 18, color: "#000", lineHeight: 1.5 }}>
                <p style={{ margin: 0 }}>Expansion →</p>
                <p style={{ margin: 0 }}>External Market Intel • Whitespace Analysis • AI Recommendations • AI-Generated Dashboards • AI Agents</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {["E3 Sales Ops & Professionalization", "E4 AI Experience"].map((label) => (
                <div key={label} style={{
                  flex: 1, height: 126, border: "1px solid #42c0f1", borderRadius: 16,
                  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <p style={{ fontFamily: FF, fontWeight: 400, fontSize: 24, color: "#000", margin: 0, textAlign: "center" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
