import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

/** Create a diagram. */
export async function POST(request: Request) {
  let body: { name?: string; folder?: string; kind?: string; doc?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = (body.name ?? "Untitled diagram").trim() || "Untitled diagram";
  const folder = (body.folder ?? "Unsorted").trim() || "Unsorted";
  const kind = body.kind === "media" ? "media" : "flow";
  const doc = body.doc ?? { nodes: [], edges: [] };

  try {
    const d = await prisma.diagram.create({
      data: { name, folder, kind, doc: doc as Prisma.InputJsonValue },
    });
    return NextResponse.json(
      { id: d.id, name: d.name, folder: d.folder, archived: d.archived, kind: d.kind, doc: d.doc },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
