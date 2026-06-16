import { NextResponse } from "next/server";
import { parseProcessText } from "@/components/builder/diagram";

/**
 * Converge a plain-language process description into the canonical diagram JSON
 * the canvas understands: { nodes:[{id,type,label}], edges:[{id,source,target,label}] }.
 *
 * When ANTHROPIC_API_KEY is set, this calls Claude to do the agentic generation.
 * Otherwise (and on any failure) it falls back to the deterministic text parser,
 * so the prototype always works offline.
 */

const MODEL = process.env.CONVERGE_MODEL ?? "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You convert a plain-language description of a business process into a clean flowchart as JSON.

Return ONLY a JSON object (no prose, no markdown fences) of this exact shape:
{
  "nodes": [ { "id": "n1", "type": "start|end|task|decision", "label": "short text" } ],
  "edges": [ { "id": "e1", "source": "n1", "target": "n2", "label": "optional, e.g. Yes/No" } ]
}

Rules:
- "type" must be one of: start, end, task, decision.
- Use exactly one "start" and at least one "end".
- A "decision" is a yes/no or branching question; its outgoing edges should be labelled (e.g. "Yes", "No").
- Keep labels concise (a few words). Connect steps in logical order.
- Do NOT include positions or coordinates — those are computed later.
- Output valid JSON only.`;

export async function POST(request: Request) {
  let prompt = "";
  try {
    const body = await request.json();
    prompt = typeof body?.prompt === "string" ? body.prompt : "";
  } catch {
    /* ignore — handled below */
  }

  if (!prompt.trim()) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    try {
      const diagram = await generateWithClaude(prompt, apiKey);
      if (diagram) {
        return NextResponse.json({ source: "ai", diagram });
      }
    } catch {
      /* fall through to local parser */
    }
  }

  return NextResponse.json({ source: "local", diagram: parseProcessText(prompt) });
}

async function generateWithClaude(prompt: string, apiKey: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Process description:\n\n${prompt}\n\nReturn the diagram JSON now.`,
        },
      ],
    }),
  });

  if (!res.ok) return null;

  const json = await res.json();
  const text: string = (json?.content ?? [])
    .filter((b: { type?: string }) => b.type === "text")
    .map((b: { text?: string }) => b.text ?? "")
    .join("");

  return extractJson(text);
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
