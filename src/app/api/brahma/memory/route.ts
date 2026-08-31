import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from '@/lib/require-session';

// GET ?q=&type=&status= → list/search wiki entries (mirrored by the bridge)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status") || "active";
  const where: Record<string, unknown> = {};
  if (status !== "all") where.status = status;
  if (type && type !== "all") where.type = type;
  if (q) where.OR = [
    { title: { contains: q, mode: "insensitive" } },
    { body: { contains: q, mode: "insensitive" } },
    { tags: { has: q.toLowerCase() } },
  ];
  const entries = await prisma.hermesMemory.findMany({ where, orderBy: { updatedAt: "desc" }, take: 300 });
  const all = await prisma.hermesMemory.findMany({ select: { type: true }, where: status === "all" ? {} : { status } });
  const typeCounts: Record<string, number> = {};
  for (const e of all) typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  const lastSync = entries[0]?.syncedAt ?? null;
  return NextResponse.json({ entries, typeCounts, total: all.length, lastSync });
}

// POST { type, title, body, tags?, links?, status?, confidence?, sensitif?, perkara?, sumber?, halaman?, kelas_bukti? }
// → TIDAK lagi menulis langsung (memory.write). Semua usulan library DIROUTEKAN ke
//   profil gsp-librarian (gatekeeper) untuk dikurasi, diverifikasi, dan di-attest
//   sebelum naik ke wiki/IL. Data sensitif (sensitif=ya) butuh persetujuan user
//   (sideEffecting → Approval Inbox) sebelum diproses.
export async function POST(req: Request) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(req);
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const title = (b.title || "").toString().trim();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const sensitif = (b.sensitif || "tidak").toString().toLowerCase() === "ya";

  const proposal = {
    tindakan: "kurasi-proposa",
    type: (b.type || "note").toString(),
    title,
    body: (b.body || "").toString(),
    tags: Array.isArray(b.tags) ? b.tags.map(String) : [],
    links: Array.isArray(b.links) ? b.links.map(String) : [],
    status: (b.status || "active").toString(),
    confidence: b.confidence ?? null,
    sensitif: sensitif ? "ya" : "tidak",
    perkara: (b.perkara || "").toString().trim() || undefined,
    sumber: (b.sumber || "").toString().trim() || undefined,
    halaman: (b.halaman || "").toString().trim() || undefined,
    kelas_bukti: (b.kelas_bukti || "sekunder").toString(),
  };

  const prompt = [
    "Kurasi proposa entri library berikut (kamu gsp-librarian, gatekeeper Information Library).",
    JSON.stringify(proposal, null, 2),
    "Ikuti gsp-library-workflow: verifikasi provenans -> dedup vs vault & wiki -> klasifikasi gate (sensitif/dosir) -> putuskan dengan alasan.",
    "Jika layak: buat objek vault via vault_propose.py lalu promote via vault_promote.py (satu-satunya promotor vault->wiki).",
    `Jika sensitif ("sensitif": "ya"): JANGAN promote tanpa persetujuan user. Tandai objek menunggu_persetujuan, jangan publish, laporkan STATUS: needs-review.`,
    "Akhi dengan baris STATUS: complete|needs-review|blocked|failed.",
  ].join("\n");

  const row = await prisma.agentRequest.create({
    data: {
      origin: "web",
      kind: "oneshot",
      title: `Kurasi proposa: ${title}`.slice(0, 200),
      prompt,
      profile: "gsp-librarian",
      sideEffecting: sensitif,
      status: sensitif ? "awaiting_approval" : "queued",
    },
  });
  return NextResponse.json({ request: row, proposal });
}
