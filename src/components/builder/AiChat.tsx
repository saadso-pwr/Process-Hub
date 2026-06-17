"use client";

import { useEffect, useRef, useState } from "react";
import {
  FF,
  BRAND_BLUE,
  Field,
  IconBtn,
  GearGlyph,
  TrashGlyph,
  inputStyle,
  COLOR_SWATCHES,
  STARTER_PROMPTS,
  type ChatMsg,
  type AiStatus,
  type AiPrefs,
} from "./kit";

export function AiChat(props: {
  messages: ChatMsg[];
  input: string;
  setInput: (v: string) => void;
  onSend: (text: string) => void;
  generating: boolean;
  status: AiStatus | null;
  onClose: () => void;
  onOpenSettings: () => void;
  onClear: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [props.messages, props.generating]);

  const needsKey = props.status && !props.status.configured;

  return (
    <aside
      style={{
        width: 360,
        flexShrink: 0,
        borderLeft: "1px solid #ececec",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        fontFamily: FF,
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderBottom: "1px solid #ececec" }}>
        <span style={{ fontSize: 16 }}>✨</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#111" }}>Converge with AI</p>
          <p style={{ margin: 0, fontSize: 11, color: "#9a9a9a" }}>
            {props.status?.configured
              ? `Live · ${props.status.model}`
              : props.status
                ? "Offline parser (no key)"
                : "Checking…"}
          </p>
        </div>
        <IconBtn title="AI settings" onClick={props.onOpenSettings}>
          <GearGlyph />
        </IconBtn>
        {props.messages.length > 0 && (
          <IconBtn title="Clear conversation" onClick={props.onClear}>
            <TrashGlyph />
          </IconBtn>
        )}
        <IconBtn title="Close" onClick={props.onClose}>
          <span style={{ fontSize: 18, color: "#999", lineHeight: 1 }}>×</span>
        </IconBtn>
      </div>

      {/* Key setup banner */}
      {needsKey && (
        <div style={{ padding: "10px 14px", background: "#fff7e6", borderBottom: "1px solid #f2e2bf", fontSize: 12, color: "#7a5a1f", lineHeight: 1.5 }}>
          No AI key found. Add it to <code style={{ background: "#fbedcf", padding: "1px 4px", borderRadius: 4 }}>.env.local</code> in the
          project root and restart the dev server:
          <pre style={{ margin: "6px 0 0", background: "#fff", border: "1px solid #f0deb6", borderRadius: 6, padding: "8px 10px", fontSize: 11.5, overflowX: "auto", color: "#3f3f38" }}>
{`${props.status?.envVar ?? "ANTHROPIC_API_KEY"}=sk-ant-...`}
          </pre>
          You can still chat now — I&apos;ll build diagrams with the built-in parser until a key is set.
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
        {props.messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#6b6b66", lineHeight: 1.5 }}>
              Describe a process and I&apos;ll draw it on the canvas. Keep chatting to refine it —
              &ldquo;add an approval step&rdquo;, &ldquo;make it branch on budget&rdquo;, &ldquo;rename step 2&rdquo;.
            </p>
            {STARTER_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => props.onSend(p)}
                style={{
                  textAlign: "left",
                  border: "1px solid #e6e6e6",
                  borderRadius: 10,
                  background: "#fafafa",
                  padding: "10px 12px",
                  fontFamily: FF,
                  fontSize: 13,
                  color: "#2a2a2a",
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
        {props.messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "88%",
              background: m.role === "user" ? BRAND_BLUE : "#f2f3f7",
              color: m.role === "user" ? "#fff" : "#1f1f1b",
              borderRadius: 12,
              padding: "9px 12px",
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {m.content}
            {m.applied && (
              <div style={{ marginTop: 5, fontSize: 11, fontWeight: 700, color: m.role === "user" ? "#cfe6ff" : "#2a5634" }}>
                ✓ Applied to canvas
              </div>
            )}
          </div>
        ))}
        {props.generating && (
          <div style={{ alignSelf: "flex-start", background: "#f2f3f7", borderRadius: 12, padding: "9px 12px", fontSize: 13, color: "#6b6b66" }}>
            Thinking…
          </div>
        )}
      </div>

      {/* Composer */}
      <div style={{ borderTop: "1px solid #ececec", padding: 12, display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          value={props.input}
          onChange={(e) => props.setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              props.onSend(props.input);
            }
          }}
          placeholder="Describe or refine the process…"
          rows={2}
          style={{
            flex: 1,
            resize: "none",
            fontFamily: FF,
            fontSize: 13,
            lineHeight: 1.45,
            padding: "9px 11px",
            borderRadius: 10,
            border: "1px solid #dcdcdc",
            outline: "none",
            color: "#2a2a2a",
          }}
        />
        <button
          type="button"
          onClick={() => props.onSend(props.input)}
          disabled={props.generating || !props.input.trim()}
          style={{
            fontFamily: FF,
            fontSize: 13,
            fontWeight: 700,
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: props.generating || !props.input.trim() ? "#9aa0c8" : BRAND_BLUE,
            color: "#fff",
            cursor: props.generating || !props.input.trim() ? "default" : "pointer",
          }}
        >
          Send
        </button>
      </div>
    </aside>
  );
}

/* ───────────────────────────── AI settings ───────────────────────────── */
export function AiSettings(props: { prefs: AiPrefs; onSave: (p: AiPrefs) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<AiPrefs>(props.prefs);
  const toggleColor = (c: string) =>
    setDraft((d) => ({
      ...d,
      palette: d.palette.includes(c) ? d.palette.filter((x) => x !== c) : [...d.palette, c],
    }));

  return (
    <div
      onClick={props.onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 480, maxWidth: "100%", maxHeight: "85vh", overflowY: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,0.3)", padding: 24, display: "flex", flexDirection: "column", gap: 16, fontFamily: FF }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111" }}>AI preferences</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b6b66" }}>
              These are sent with every message to tune the output — refine them over time for
              quicker, better diagrams.
            </p>
          </div>
          <button type="button" onClick={props.onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 22, color: "#999", lineHeight: 1 }} aria-label="Close">×</button>
        </div>

        <Field label="House style / conventions">
          <textarea
            value={draft.styleNotes}
            onChange={(e) => setDraft((d) => ({ ...d, styleNotes: e.target.value }))}
            placeholder="e.g. Top-to-bottom flow, concise verb-first labels, a diamond for every decision, one clear start and end."
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.45 }}
          />
        </Field>

        <Field label="Preferred colours">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleColor(c)}
                title={c}
                style={{ width: 26, height: 26, borderRadius: 7, background: c, border: draft.palette.includes(c) ? "3px solid #1f1f1b" : "1px solid #ddd", cursor: "pointer" }}
              />
            ))}
          </div>
        </Field>

        <Field label="Reference diagrams / examples">
          <textarea
            value={draft.reference}
            onChange={(e) => setDraft((d) => ({ ...d, reference: e.target.value }))}
            placeholder="Paste an example process, link conventions, or describe a reference diagram the AI should imitate."
            rows={4}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.45 }}
          />
        </Field>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={props.onClose} style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, padding: "10px 14px", borderRadius: 10, border: "1px solid #dcdcdc", background: "#fff", color: "#2a2a2a", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              props.onSave(draft);
              props.onClose();
            }}
            style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, padding: "10px 16px", borderRadius: 10, border: "none", background: BRAND_BLUE, color: "#fff", cursor: "pointer" }}
          >
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}

