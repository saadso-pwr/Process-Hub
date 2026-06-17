import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { SEED_DIAGRAMS, SEED_FOLDERS } from "@/lib/seedLibrary";

export const dynamic = "force-dynamic";

type DiagramRow = {
  id: string;
  name: string;
  folder: string;
  archived: boolean;
  kind: string;
  doc: unknown;
};

function toItem(d: DiagramRow) {
  return { id: d.id, name: d.name, folder: d.folder, archived: d.archived, kind: d.kind, doc: d.doc };
}

/** Load the whole library; seed defaults the first time the DB is empty. */
export async function GET() {
  try {
    let [folders, diagrams] = await Promise.all([
      prisma.folder.findMany({ orderBy: { position: "asc" } }),
      prisma.diagram.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

    if (folders.length === 0 && diagrams.length === 0) {
      await prisma.$transaction([
        ...SEED_FOLDERS.map((name, i) => prisma.folder.create({ data: { name, position: i } })),
        ...SEED_DIAGRAMS.map((d) =>
          prisma.diagram.create({
            data: { name: d.name, folder: d.folder, kind: d.kind, doc: d.doc as unknown as Prisma.InputJsonValue },
          }),
        ),
      ]);
      [folders, diagrams] = await Promise.all([
        prisma.folder.findMany({ orderBy: { position: "asc" } }),
        prisma.diagram.findMany({ orderBy: { createdAt: "asc" } }),
      ]);
    }

    return NextResponse.json({
      folders: folders.map((f) => f.name),
      items: diagrams.map(toItem),
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the database. Is Postgres running (npm run db:up) and migrated?" },
      { status: 500 },
    );
  }
}
