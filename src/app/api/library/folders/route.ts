import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Create a folder (no-op if the name already exists). */
export async function POST(request: Request) {
  let name = "";
  try {
    const body = await request.json();
    name = typeof body?.name === "string" ? body.name.trim() : "";
  } catch {
    /* handled below */
  }
  if (!name) return NextResponse.json({ error: "Missing folder name" }, { status: 400 });

  try {
    const existing = await prisma.folder.findUnique({ where: { name } });
    if (existing) return NextResponse.json({ name: existing.name });
    const count = await prisma.folder.count();
    const folder = await prisma.folder.create({ data: { name, position: count } });
    return NextResponse.json({ name: folder.name }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
