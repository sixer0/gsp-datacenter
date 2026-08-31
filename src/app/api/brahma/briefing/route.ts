import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export async function GET() {
  const row = await prisma.dataStore.findUnique({ where: { key: "hermes-briefing" } });
  return NextResponse.json(row?.data ?? { generatedAt: null, summary: null, sections: [] });
}

// POST → ask the bridge to (re)generate the chief-of-staff brief now.
export async function POST(req: NextRequest) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(req);
  if (denied) return denied;
  const row = await prisma.agentRequest.create({
    data: {
      origin: "web",
      kind: "briefing.generate",
      title: "Generate chief-of-staff brief",
      prompt: "now",
      sideEffecting: false,
      status: "queued",
    },
  });
  return NextResponse.json({ request: row });
}
