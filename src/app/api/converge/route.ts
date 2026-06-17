import { NextResponse } from "next/server";
import { parseProcessText, coerceCanonical } from "@/components/builder/diagram";

/**
 * Conversational diagram builder.
 *
 * The client holds a back-and-forth chat with the model (like talking to
 * Claude), and each turn can update the canvas. The model replies with a small
 * JSON envelope:
 *   { "reply": "<chat message>", "diagram": { nodes, edges } | null }
 * where `diagram` is the full updated canonical diagram, or null when the user
 * is just chatting and nothing should change on the canvas.
 *
 * Set ANTHROPIC_API_KEY in .env.local to enable live AI. Without it (and on any
 * error) we fall back to the deterministic text parser so the prototype always
 * works offline.
 */

const MODEL = process.env.CONVERGE_MODEL ?? "claude-sonnet-4-6";
const PROVIDER = "anthropic";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Preferences = {
  styleNotes?: string;
  palette?: string[];
  reference?: string;
};

function buildSystemPrompt(prefs?: Preferences, currentDiagram?: unknown): string {
  const lines = [
    "You are a process-mapping assistant inside a visual diagram builder.",
    "You converse with the user about a business process and maintain a flowchart for them.",
    "",
    "Always respond with ONLY a JSON object (no prose, no markdown fences) of this exact shape:",
    '{ "reply": "<a short, friendly chat message>", "diagram": <diagram-or-null> }',
    "",
    "`diagram` is either null (when the user is only asking a question or no change is needed)",
    "or the FULL updated diagram of this shape:",
    '{ "nodes": [ { "id": "n1", "type": "start|end|task|decision", "label": "short text", "lane": "optional swimlane" } ],',
    '  "edges": [ { "id": "e1", "source": "n1", "target": "n2", "label": "optional e.g. Yes/No" } ],',
    '  "lanes": [ "optional", "ordered", "swimlane names" ] }',
    "",
    "Rules for the diagram:",
    "- type is one of: start, end, task, decision.",
    "- Use exactly one start and at least one end.",
    "- A decision is a yes/no or branching question; label its outgoing edges.",
    "- Keep labels concise. Connect steps in logical order. No coordinates.",
    "- Swimlanes (optional): when the process spans distinct actors/roles/systems,",
    "  set `lanes` to the ordered role names and give each node a `lane`. If the user",
    "  asks for lanes/swimlanes, always include them. Otherwise lanes are optional.",
    "- When editing an existing diagram, REUSE the existing node ids and lane names you",
    "  were given for things that remain, so styling/position are preserved; only add",
    "  new ids for genuinely new steps.",
  ];

  if (prefs?.styleNotes?.trim()) {
    lines.push("", `User's preferred style: ${prefs.styleNotes.trim()}`);
  }
  if (prefs?.palette && prefs.palette.length) {
    lines.push(`Preferred colours: ${prefs.palette.join(", ")}.`);
  }
  if (prefs?.reference?.trim()) {
    lines.push("", "Reference / house conventions to follow:", prefs.reference.trim());
  }
  if (currentDiagram) {
    lines.push("", "Current diagram on the canvas (JSON):", JSON.stringify(currentDiagram));
  }
  return lines.join("\n");
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.ANTHROPIC_API_KEY),
    provider: PROVIDER,
    model: MODEL,
    envVar: "ANTHROPIC_API_KEY",
  });
}

export async function POST(request: Request) {
  let body: {
    messages?: ChatMessage[];
    prompt?: string;
    diagram?: unknown;
    preferences?: Preferences;
  } = {};
  try {
    body = await request.json();
  } catch {
    /* handled below */
  }

  const messages: ChatMessage[] =
    body.messages && body.messages.length
      ? body.messages
      : body.prompt
        ? [{ role: "user", content: body.prompt }]
        : [];

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (!lastUser.trim()) {
    return NextResponse.json({ error: "Nothing to process" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    try {
      const result = await chatWithClaude(messages, body.preferences, body.diagram, apiKey);
      if (result) {
        const diagram = result.diagram ? coerceCanonical(result.diagram) : null;
        return NextResponse.json({ source: "ai", reply: result.reply, diagram });
      }
    } catch {
      /* fall through to local parser */
    }
  }

  // Offline fallback: build a diagram from the latest user message.
  return NextResponse.json({
    source: "local",
    reply: apiKey
      ? "I couldn't reach the AI just now, so I built this from your description with the built-in parser. You can keep editing it by hand."
      : "No AI key is configured yet, so I built this from your description with the built-in parser. Add ANTHROPIC_API_KEY to .env.local to chat with live AI.",
    diagram: parseProcessText(lastUser),
  });
}

async function chatWithClaude(
  messages: ChatMessage[],
  prefs: Preferences | undefined,
  currentDiagram: unknown,
  apiKey: string,
): Promise<{ reply: string; diagram: unknown } | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2500,
      system: buildSystemPrompt(prefs, currentDiagram),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) return null;

  const json = await res.json();
  const text: string = (json?.content ?? [])
    .filter((b: { type?: string }) => b.type === "text")
    .map((b: { text?: string }) => b.text ?? "")
    .join("");

  const obj = extractJson(text);
  if (obj && typeof obj === "object") {
    const o = obj as Record<string, unknown>;
    return {
      reply: typeof o.reply === "string" ? o.reply : "Updated the diagram.",
      diagram: o.diagram ?? null,
    };
  }
  // Model didn't return our envelope — treat the whole reply as chat text.
  return { reply: text.trim() || "Done.", diagram: null };
}

/** Pull the first JSON object out of the model's reply, tolerating stray prose. */
function extractJson(text: string): unknown | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}
