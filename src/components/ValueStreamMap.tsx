"use client";

/* ─── colour tokens (blue-only palette) ─── */
const C = {
  brand:      "#00037C",
  ink:        "#0f1115",
  muted:      "#6c6f76",
  rule:       "#1a1d23",
  ruleSoft:   "#ccd3ec",
  accent:     "#c5d0ff",   // main activity boxes
  accent2:    "#dce3ff",   // supporting-process boxes
  accent3:    "#eef1ff",   // tech / colleague boxes
  svcBorder:  "#b8c4f0",
  evidenceBg: "#ffffff",
  divLine:    "#9aaad4",
};

/* ─── inline SVG icon library ─── */
const ICONS: Record<string, string> = {
  sharepoint: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 9h18M8 5v14"/></svg>`,
  excel:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M9 8l6 8M15 8l-6 8"/></svg>`,
  fabric:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M5 19l3-3"/></svg>`,
  pbi:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="13" width="3" height="8"/><rect x="10.5" y="8" width="3" height="13"/><rect x="17" y="3" width="3" height="18"/></svg>`,
  doc:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>`,
  scope:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>`,
  workshop:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="11" rx="1.5"/><path d="M8 20h8M12 16v4"/></svg>`,
};

/* ─── Flash Report data (static) ─── */
const FLASH = {
  phases:   ["Discover", "Define KPIs", "Data Model", "Build Reports", "Pilot", "Rollout", "Operate"],
  time:     ["1–2 weeks", "2 weeks", "2–3 weeks", "3–4 weeks", "2 weeks", "1 week", "Weekly"],
  evidence: ["Kickoff deck", "KPI catalog", "Star schema spec", "Power BI report", "UAT sign-off", "Go-live note", "Weekly Flash"],
  client:   ["Defines goals & sponsors", "Confirms KPI list & targets", "Approves data sources", "Reviews mockups", "Tests with sample data", "Adopts in ops review", "Receives weekly report"],
  on:       ["Runs discovery sessions", "Facilitates KPI workshops", "Walks through model", "Demos report iterations", "Coaches users in UAT", "Trains business users", "Hosts weekly review"],
  back:     ["Reviews tech stack", "Drafts KPI definitions", "Designs star schema", "Develops measures & visuals", "Fixes UAT defects", "Hands over runbook", "Monitors refresh & SLAs"],
  sup:      ["Stack assessment", "KPI calc methods", "SharePoint extract pipeline", "Power BI workspace", "Defect log", "Operations RACI", "Refresh & alerting"],
  tools:    ["scope", "workshop", "sharepoint", "pbi", "excel", "doc", "fabric"],
  col: [
    { name: "Sponsor + PT lead",  who: "VP Ops · Mo" },
    { name: "BI + Finance + Ops", who: "Analyst · Controller" },
    { name: "Data engineer",      who: "Power Tech" },
    { name: "BI developer",       who: "Power Tech" },
    { name: "Pilot users",        who: "Ops managers" },
    { name: "Change owner",       who: "Sponsor" },
    { name: "Operate squad",      who: "PT support" },
  ],
};

/* ─── style shorthands ─── */
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const serif: React.CSSProperties = { fontFamily: "'Fraunces', serif" };
const sans: React.CSSProperties  = { fontFamily: "'Inter Tight', system-ui, sans-serif" };

const GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "160px repeat(7, minmax(0,1fr))",
  columnGap: 12,
};

/* ─── leaf components ─── */
function Box({ text, variant }: { text: string; variant?: "evidence" | "support" }) {
  const bg     = variant === "evidence" ? C.evidenceBg : variant === "support" ? C.accent2 : C.accent;
  const border = variant === "evidence" ? `1px solid ${C.rule}` : variant === "support" ? `1px solid #b8caf0` : "none";
  return (
    <div style={{ background: bg, border, borderRadius: 3, padding: "9px 10px", fontSize: 11.5, lineHeight: 1.25, textAlign: "center", color: C.ink, width: "100%", maxWidth: 170, fontWeight: variant === "evidence" ? 600 : 500, ...sans }}>
      {text}
    </div>
  );
}

function TimeVal({ text }: { text: string }) {
  return (
    <div style={{ ...mono, fontSize: 11, color: C.ink, background: "#fff", border: `1px dashed ${C.ruleSoft}`, padding: "6px 8px", borderRadius: 2, width: "100%", maxWidth: 170, textAlign: "center" }}>
      {text}
    </div>
  );
}

function IconCell({ iconKey }: { iconKey: string }) {
  return (
    <div style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", color: C.ink }}
      dangerouslySetInnerHTML={{ __html: ICONS[iconKey] ?? "" }} />
  );
}

function ColleagueCell({ name, who }: { name: string; who: string }) {
  return (
    <div style={{ background: C.accent3, border: `1px solid ${C.svcBorder}`, borderRadius: 3, padding: "8px 10px", fontSize: 10.5, lineHeight: 1.25, textAlign: "center", width: "100%", maxWidth: 200, ...sans }}>
      <div>{name}</div>
      <div style={{ ...mono, fontSize: 9.5, color: C.brand, marginTop: 3, letterSpacing: "0.04em" }}>{who}</div>
    </div>
  );
}

function DivLine({ label }: { label: string }) {
  return (
    <div style={{ gridColumn: "1 / -1", height: 0, borderTop: `1px dashed ${C.divLine}`, position: "relative", margin: 0 }}>
      <span style={{ position: "absolute", left: 0, top: -7, ...mono, fontSize: 9, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", background: "#fff", padding: "0 6px" }}>
        {label}
      </span>
    </div>
  );
}

function MapRow({ label, sub, cells, first, bandLine }: {
  label: string; sub: string; cells: React.ReactNode[]; first?: boolean; bandLine?: boolean;
}) {
  const borderTop = first ? "none" : `1px solid ${C.ruleSoft}`;
  const pt = first ? 6 : 14;
  return (
    <div style={{ display: "contents" }}>
      <div style={{ gridColumn: 1, padding: `${pt}px 12px 14px 0`, borderTop, display: "flex", flexDirection: "column", justifyContent: "flex-start", position: "relative" }}>
        {bandLine && <span style={{ position: "absolute", left: -2, top: 18, bottom: 18, width: 2, background: C.ink }} />}
        <div style={{ ...serif, fontWeight: 600, fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        <div style={{ ...mono, fontSize: 9.5, color: C.muted, marginTop: 4, letterSpacing: "0.05em" }}>{sub}</div>
      </div>
      {cells.map((child, i) => (
        <div key={i} className={`vsm-c${i + 1}`} style={{ gridColumn: i + 2, padding: `${pt}px 0 14px`, borderTop, minHeight: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {child}
        </div>
      ))}
    </div>
  );
}

/* ─── main export ─── */
export function ValueStreamMap() {
  return (
    <div style={{ ...sans, color: C.ink }}>

      {/* map */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 1100 }}>

          {/* phase header */}
          <div style={{ ...GRID, paddingBottom: 6, alignItems: "end" }}>
            <div />
            {FLASH.phases.map((p, i) => (
              <div key={i} style={{ textAlign: "center", ...mono, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.14em", paddingBottom: 6, borderBottom: `1px solid ${C.rule}` }}>
                {i + 1}. {p}
              </div>
            ))}
          </div>

          {/* rows */}
          <div className="vsm-animate" style={{ ...GRID, rowGap: 0, position: "relative" }}>

            <MapRow first label="Measures · Time" sub="duration / cadence"
              cells={FLASH.time.map((t, i) => <TimeVal key={i} text={t} />)} />

            <MapRow label="Physical Evidence" sub="artifacts / outputs"
              cells={FLASH.evidence.map((e, i) => <Box key={i} text={e} variant="evidence" />)} />

            <MapRow label="Client Actions" sub="portfolio company"
              cells={FLASH.client.map((c, i) => <Box key={i} text={c} />)} />

            <DivLine label="Line of interaction" />

            <MapRow bandLine label="Onstage Actions" sub="consultant facing"
              cells={FLASH.on.map((o, i) => <Box key={i} text={o} />)} />

            <DivLine label="Line of visibility" />

            <MapRow label="Backstage Actions" sub="internal delivery"
              cells={FLASH.back.map((b, i) => <Box key={i} text={b} />)} />

            <DivLine label="Line of internal interaction" />

            <MapRow label="Supporting Processes" sub="data & systems"
              cells={FLASH.sup.map((s, i) => <Box key={i} text={s} variant="support" />)} />

            <MapRow label="Tools, Software, Data" sub="platforms used"
              cells={FLASH.tools.map((t, i) => <IconCell key={i} iconKey={t} />)} />

            <MapRow label="Colleagues" sub="RACI roles"
              cells={FLASH.col.map((c, i) => <ColleagueCell key={i} {...c} />)} />

          </div>
        </div>
      </div>

      {/* footer */}
      <div style={{ borderTop: `1px solid ${C.rule}`, marginTop: 24, padding: "12px 0", display: "flex", justifyContent: "space-between", ...mono, fontSize: 10, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        <span style={{ color: C.ink, fontWeight: 600 }}>Power Technology · Neos Partners</span>
        <span>Flash Reports &amp; Performance Reporting · Value Stream Map</span>
      </div>

    </div>
  );
}
