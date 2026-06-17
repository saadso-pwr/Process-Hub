import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

/** Update a diagram (name / folder / archived / doc). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { name?: string; folder?: string; archived?: boolean; doc?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data: Prisma.DiagramUpdateInput = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.folder === "string") data.folder = body.folder;
  if (typeof body.archived === "boolean") data.archived = body.archived;
  if (body.doc !== undefined) data.doc = body.doc as Prisma.InputJsonValue;

  try {
    const d = await prisma.diagram.update({ where: { id }, data });
    return NextResponse.json({
      id: d.id,
      name: d.name,
      folder: d.folder,
      archived: d.archived,
      kind: d.kind,
      doc: d.doc,
    });
  } catch {
    return NextResponse.json({ error: "Not found or database error" }, { status: 404 });
  }
}

/** Permanently delete a diagram. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.diagram.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
