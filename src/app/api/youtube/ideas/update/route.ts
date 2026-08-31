import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from '@/lib/require-session';

export async function POST(req: NextRequest) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(req);
  if (denied) return denied;
  const { title, status, rejectedReason } = await req.json();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  // Update the idea by title
  await prisma.youtubeIdea.updateMany({
    where: { title },
    data: {
      status: status || "rejected",
      rejectedReason: rejectedReason || undefined,
    },
  });

  // Also save feedback to learning table
  if (status === "rejected" && rejectedReason) {
    await prisma.youtubeFeedback.create({
      data: {
        title,
        reason: rejectedReason,
        type: "idea",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
