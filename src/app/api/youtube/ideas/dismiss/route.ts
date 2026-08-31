import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from '@/lib/require-session';

export async function POST(req: NextRequest) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(req);
  if (denied) return denied;
  const { title } = await req.json();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  // Delete ideas matching the title
  const result = await prisma.youtubeIdea.deleteMany({
    where: { title },
  });

  // Count remaining ideas
  const remaining = await prisma.youtubeIdea.count();

  return NextResponse.json({ remaining });
}
