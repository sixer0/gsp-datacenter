/**
 * SEC-FIX3 (D-508): pindai BACA SAJA figur chart/diagram tersimpan di DB DEV v2.1 yang sudah melampaui batas render
 * (figur seperti itu dilewati diam-diam saat render berikutnya). Cek = fungsi yang SAMA dengan render/pratinjau:
 * `figureCapacityIssuesFor` + `figureBytesIssues` (`services/render/figure-limits.ts`) atas blok figur revisi
 * TERKINI setiap dokumen (rujukan `artifactId` diselesaikan ke spec artefak), `figureTextErrorsV2` atas sumber v2
 * revisi terkini, dan cek kapasitas atas setiap artefak CHART/DIAGRAM.
 *
 * Keamanan:
 *  - HANYA basis data `gsp_agent_hq_v21`: nama dari DATABASE_URL diperiksa SEBELUM koneksi, lalu `current_database()`
 *    diperiksa lagi sesudahnya; selain itu berhenti (exit 2). URL/kredensial tidak pernah dicetak.
 *  - Hanya SELECT, di dalam transaksi `READ ONLY` (Postgres menolak tulis apa pun).
 *  - Keluaran: jumlah dan id dokumen/artefak/alamat blok saja, tanpa isi.
 *
 * Pakai: `npx tsx scripts/studio/scan-figure-limits.ts` (dari akar repo).
 */
import { REPO_ROOT } from "./_repo-alias";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { figureTextErrorsV2 } from "../../src/lib/studio/contract/schema/v2/figure-text";
import { figureBytesIssues, figureCapacityIssuesFor, type CapacityIssue } from "../../src/lib/studio/services/render/figure-limits";

const EXPECTED_DB = "gsp_agent_hq_v21";

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);

/** Nama basis data dari URL koneksi (tanpa mencetak URL). */
function dbNameOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return decodeURIComponent(new URL(url).pathname.replace(/^\//, "")) || null;
  } catch {
    return null;
  }
}

interface Finding {
  documentId?: string;
  artifactId?: string;
  revisionNo?: number;
  where: string;
  type: string;
  checks: string[];
}

const summarize = (issues: readonly CapacityIssue[]): string[] => issues.slice(0, 5).map((i) => `${i.pointer} ${i.keyword} ${i.actual}>${i.limit}`);

async function main(): Promise<number> {
  // Prisma memuat `.env` sendiri saat konstruksi; muat lebih dulu (Node >= 20.12) agar nama basis data dapat diperiksa
  // SEBELUM koneksi apa pun. Variabel yang sudah ada di lingkungan tidak ditimpa.
  if (process.env.DATABASE_URL === undefined) {
    try {
      process.loadEnvFile(path.join(REPO_ROOT, ".env"));
    } catch {
      /* tanpa .env: pemeriksaan di bawah berhenti dengan "tidak terbaca" */
    }
  }
  const named = dbNameOf(process.env.DATABASE_URL);
  if (named !== EXPECTED_DB) {
    console.error(`ABORT: basis data target bukan ${EXPECTED_DB} (nama dari koneksi: ${named ?? "tidak terbaca"}); tidak ada koneksi dibuka.`);
    return 2;
  }
  const prisma = new PrismaClient();
  try {
    return await prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
        const [{ db }] = await tx.$queryRaw<Array<{ db: string }>>`SELECT current_database() AS db`;
        if (db !== EXPECTED_DB) {
          console.error(`ABORT: current_database() = ${db}, bukan ${EXPECTED_DB}.`);
          return 2;
        }
        console.log(`database confirmed: ${db} (transaction READ ONLY)`);

        const findings: Finding[] = [];
        const artifacts = await tx.studioArtifact.findMany({ where: { kind: { in: ["CHART", "DIAGRAM"] } }, select: { id: true, kind: true, spec: true } });
        const artifactSpec = new Map(artifacts.map((a) => [a.id, a.spec as unknown]));
        for (const a of artifacts) {
          const type = a.kind === "CHART" ? "chart" : "diagram";
          const issues = figureCapacityIssuesFor(type, a.spec);
          if (issues.length > 0) findings.push({ artifactId: a.id, where: "artifact", type, checks: summarize(issues) });
        }

        const docs = await tx.studioDocument.findMany({ select: { id: true, currentRevisionNo: true }, orderBy: { createdAt: "asc" } });
        let figureBlocks = 0;
        let v2Sources = 0;
        let unresolvedRefs = 0;
        for (const d of docs) {
          const rev = await tx.studioRevision.findUnique({
            where: { documentId_revisionNo: { documentId: d.id, revisionNo: d.currentRevisionNo } },
            select: { revisionNo: true, snapshot: true },
          });
          const snap = rev?.snapshot;
          if (!rev || !isRec(snap)) continue;
          if (isRec(snap.source)) {
            v2Sources++;
            const text = figureTextErrorsV2(snap.source);
            if (text.length > 0) {
              findings.push({ documentId: d.id, revisionNo: rev.revisionNo, where: "source(v2)", type: "figureText", checks: text.slice(0, 5).map((e) => `${e.instancePath} ${JSON.stringify(e.params)}`) });
            }
          }
          for (const b of Array.isArray(snap.blocks) ? snap.blocks : []) {
            if (!isRec(b) || (b.type !== "chart" && b.type !== "diagram")) continue;
            figureBlocks++;
            const content = isRec(b.content) ? b.content : {};
            let spec: unknown = content.spec;
            if (isRec(spec) && typeof spec.artifactId === "string") {
              spec = artifactSpec.get(spec.artifactId);
              if (spec === undefined) {
                unresolvedRefs++;
                continue;
              }
            }
            const issues = [...figureBytesIssues(b.content, "/content"), ...figureCapacityIssuesFor(b.type, spec)];
            if (issues.length > 0) {
              const where = typeof b.address === "string" ? b.address : String(b.blockId ?? "?");
              findings.push({ documentId: d.id, revisionNo: rev.revisionNo, where: `block ${where}`, type: b.type, checks: summarize(issues) });
            }
          }
        }

        const docIds = [...new Set(findings.filter((f) => f.documentId).map((f) => f.documentId))];
        const artIds = findings.filter((f) => f.artifactId).map((f) => f.artifactId);
        console.log(
          JSON.stringify(
            {
              scanned: { documents: docs.length, currentRevisionFigureBlocks: figureBlocks, v2Sources, artifacts: artifacts.length, unresolvedArtifactRefs: unresolvedRefs },
              overLimit: {
                findings: findings.length,
                blocks: findings.filter((f) => f.where.startsWith("block")).length,
                v2SourceTextFindings: findings.filter((f) => f.where === "source(v2)").length,
                artifacts: artIds.length,
                documentIds: docIds,
                artifactIds: artIds,
              },
              details: findings,
            },
            null,
            2,
          ),
        );
        return 0;
      },
      { timeout: 300_000, maxWait: 30_000 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    // Pesan galat Prisma dapat memuat host; cetak nama kelas + kode saja.
    const e = err as { name?: string; code?: string };
    console.error(`scan failed: ${e?.name ?? "Error"}${e?.code ? ` ${e.code}` : ""}`);
    process.exit(1);
  },
);
