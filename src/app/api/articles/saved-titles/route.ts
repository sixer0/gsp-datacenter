export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from '@/lib/require-session';

// GET /api/articles/saved-titles — list saved titles
export async function GET() {
  try {
    const titles = await prisma.savedTitle.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(titles);
  } catch (err: any) {
    console.error("GET /api/articles/saved-titles error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

// POST /api/articles/saved-titles — save a title
export async function POST(req: NextRequest) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const { title, track, themes } = body;

    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    const saved = await prisma.savedTitle.create({
      data: {
        title,
        track: track || "local-viral",
        themes: themes || null,
      },
    });

    return NextResponse.json(saved);
  } catch (err: any) {
    console.error("POST /api/articles/saved-titles error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

// DELETE /api/articles/saved-titles — remove a saved title
export async function DELETE(req: NextRequest) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(req);
  if (denied) return denied;
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await prisma.savedTitle.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/articles/saved-titles error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
