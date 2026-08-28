import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/brahma/requests?status=&title=&take=&light=1
// `title` = filter substring judul (mis. "Ask Librarian") untuk riwayat Ask Librarian.
// `light=1` = hanya kolom ringan (id/title/status/kind/profile/createdAt) — tanpa
// result/error/prompt — agar list riwayat tetap cepat walau result besar (cap 200k).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status"); // e.g. "awaiting_approval"
  const title = url.searchParams.get("title"); // e.g. "Ask Librarian"
  const take = Math.min(Number(url.searchParams.get("take") || 50), 200);
  const light = url.searchParams.get("light") === "1";
  const where = status ? { status: { in: status.split(",") } } : {};
  if (title) (where as Record<string, unknown>).title = { contains: title };
  const requests = await prisma.agentRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    ...(light
      ? { select: { id: true, title: true, status: true, kind: true, profile: true, createdAt: true } }
      : {}),
  });
  const pending = await prisma.agentRequest.count({ where: { status: "awaiting_approval" } });
  return NextResponse.json({ requests, pending });
}
