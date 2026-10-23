/**
 * Backfill struktur revisi lama (baris SR-37; blueprint 05 §2.8 butir 2;
 * register 03_structural_sections_specs.md §3.1 M14-M18, §6.3, §10; D-166 KC-8,
 * D-179, D-183).
 *
 * Untuk setiap revisi `studio.norm/v1` yang belum punya baris struktur:
 *   1. `snapshot.doc` (v1) -> `adaptV1` (SR-09, kebijakan `strip`) -> `sections` v2;
 *   2. kerangka implisit versi templat revisi (SR-06 `getSkeleton`, tier dokumen);
 *      baris M14 untuk slot wajib + slot yang berisi (slot opsional kosong = OMIT, KD-08);
 *   3. pid: id hasil adaptor (blockId v1 ternormalisasi) dipertahankan; baris `F:`
 *      memakai blockId v1 beralamat sama; sisanya dibangkitkan `dbPidAllocator`;
 *      revisi berikutnya dokumen yang sama mewarisi pid bab/section per kunci;
 *   4. baris ditulis lewat repositori SR-10 (`writeRevisionRows`, salinan penuh,
 *      `onRetiredPid: "revive"`, TANPA tulis ganda `StudioBlock` karena M06 revisi
 *      lama sudah ada); label artefak disamakan dengan snapshot v1 per alamat;
 *   5. rekonstruksi dicek di dalam transaksi sebelum commit (lihat di bawah).
 *
 * Snapshot lama (`StudioRevision.snapshot`/`snapshotSha256`) dan semua kolom
 * `StudioRevision`/`StudioDocument` TIDAK ditulis; kelengkapan revisi lama tetap
 * COMPLETE (KC-8) dan dicek ulang dari baris.
 *
 * Rekonstruksi norm/v1: snapshot v1 tetap dirender jalur lama (§2.8), dan adaptor
 * v1->v2 membuang spacer/device/glyph/format inline sehingga snapshot v1 tidak
 * dapat dikomposisi ulang byte-identik dari baris v2. Rekomposer v1 runtime
 * (`services/structure/legacy-v1`, dipakai `verifyReconstruction` SR-10; IP-52
 * memindahkannya dari skrip ini, satu sumber) membangun ulang `sections` dari
 * baris, menuntut kesetaraan isi tanpa pid terhadap `adaptV1(snapshot.doc)` dan
 * kesamaan pid adaptor, lalu mengembalikan snapshot jalur lama; `canonicalSha256`
 * hasilnya dibandingkan dengan `snapshotSha256`.
 *
 * Idempoten: revisi yang sudah punya baris M14 dilewati (dicek di dalam kunci
 * advisory dokumen); jalan kedua tidak menulis apa pun selain menautkan aset
 * gambar yang tertunda bila barisnya kini ada di M13.
 *
 * Pemakaian: `npx tsx prisma/backfill-studio-structure.ts [--dry-run] [--rewrite-v1-rows]`
 *   --dry-run          tulis + verifikasi di dalam transaksi lalu rollback.
 *   --rewrite-v1-rows  (bawaan mati; SR-38, D-228) tulis ulang baris revisi norm/v1 yang
 *                      tidak lagi mereproduksi `adaptV1(snapshot.doc)` terkini, dengan pid
 *                      baris lama (lihat `rewriteRevision`); revisi yang sudah cocok = `unchanged`.
 * Penjaga DB: hanya `gsp_agent_hq_v21` / `gsp_agent_hq_v21_uji`.
 * Log: JSON per baris ke stdout/stderr + JSONL harian `<STUDIO_WORKSPACE_ROOT>/logs/backfill/`.
 * Exit 1 bila ada revisi gagal atau rekonstruksi tidak cocok.
 */
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import {
  isNormSnapshotV2,
  STUDIO_LOCK_DOC_PREFIX,
  type AnyNormSnapshot,
  type ChapterV2,
  type DocMeta,
  type NormDocSnapshot,
  type StudioDocV2Resolved,
  type StudioTier,
} from "../src/lib/studio/contract";
import { appendJsonlDaily } from "../src/lib/studio/http/jsonl";
import { PidMapper } from "../src/lib/studio/services/adapt-v1/ids";
import { AdaptRecorder } from "../src/lib/studio/services/adapt-v1/report";
import { computeCompleteness } from "../src/lib/studio/services/completeness";
import { canonicalSha256 } from "../src/lib/studio/services/revisions/canonical";
import { getSkeleton, isSlotActive } from "../src/lib/studio/services/skeleton";
import {
  adaptLegacySnapshot,
  assignMissingPids,
  carryFillStamps,
  dbPidAllocator,
  isRepeatableSectionType,
  readRows,
  rowsFromSource,
  StructureIntegrityError,
  verifyReconstruction,
  writeRevisionRows,
  type LegacyAdaptation,
  type SlotRowSpec,
  type StructureDb,
  type StructureRows,
  type TrackingPidAllocator,
} from "../src/lib/studio/services/structure";

const SOURCE = "prisma/backfill-studio-structure.ts";
const RUN_ID = randomUUID();
const ALLOWED_DATABASES = new Set(["gsp_agent_hq_v21", "gsp_agent_hq_v21_uji"]);
const REPO_ROOT = path.resolve(__dirname, "..");
const TX_TIMEOUT_MS = 120_000;
/** Tabel milik backfill (M14-M18); semua tabel lain wajib berhitungan sama sebelum/sesudah. */
const STRUCTURE_TABLES = new Set(["StudioDocSection", "StudioDocChapter", "StudioDocSubsection", "StudioDocBlock", "StudioDocIdentity"]);
const SAFE_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const SHA256_REF = /^sha256:([0-9a-f]{64})$/;

class DryRunRollback extends Error {
  constructor() {
    super("dry-run rollback");
    this.name = "DryRunRollback";
  }
}

// ── Log (konsol + JSONL tahan lama) ─────────────────────────────────────

const pendingLogs: Promise<void>[] = [];

function log(level: "info" | "warn" | "error", message: string, context: Record<string, unknown> = {}, err?: unknown): void {
  const row = {
    timestamp: new Date().toISOString(),
    level,
    source: SOURCE,
    correlationId: RUN_ID,
    message,
    code: err && typeof err === "object" && "code" in err && typeof (err as { code: unknown }).code === "string" ? (err as { code: string }).code : undefined,
    stack_trace: err instanceof Error ? (err.stack ?? null) : null,
    context,
  };
  (level === "error" ? process.stderr : process.stdout).write(`${JSON.stringify(row)}\n`);
  pendingLogs.push(
    appendJsonlDaily("backfill", "backfill-structure", row).catch((e: unknown) => {
      process.stderr.write(`${JSON.stringify({ source: SOURCE, level: "error", message: "backfill log sink failed", detail: String(e) })}\n`);
    }),
  );
}

// ── Penjaga dan hitungan ────────────────────────────────────────────────

async function assertDatabase(): Promise<string> {
  const rows = await prisma.$queryRaw<{ db: string }[]>`select current_database() as db`;
  const name = rows[0]?.db ?? "";
  if (!ALLOWED_DATABASES.has(name)) throw new Error(`DB '${name}' ditolak; backfill struktur hanya untuk ${[...ALLOWED_DATABASES].join(", ")}`);
  return name;
}

/** Hitungan baris semua tabel `public` (nama dari katalog, divalidasi sebagai identifier). */
async function tableCounts(): Promise<Record<string, number>> {
  const tables = await prisma.$queryRaw<{ t: string }[]>`
    select table_name as t from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name`;
  const out: Record<string, number> = {};
  for (const { t } of tables) {
    if (!SAFE_IDENT.test(t)) throw new Error(`nama tabel tidak aman: ${t}`);
    const r = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`select count(*)::bigint as n from "${t}"`);
    out[t] = Number(r[0]?.n ?? 0);
  }
  return out;
}

interface SnapshotFingerprint {
  revisionId: string;
  stored: string;
  recomputed: string;
}

async function snapshotFingerprints(): Promise<SnapshotFingerprint[]> {
  const revs = await prisma.studioRevision.findMany({
    orderBy: [{ documentId: "asc" }, { revisionNo: "asc" }],
    select: { id: true, snapshot: true, snapshotSha256: true },
  });
  return revs.map((r) => ({ revisionId: r.id, stored: r.snapshotSha256, recomputed: canonicalSha256(r.snapshot) }));
}

// ── Adaptasi -> sumber v2 ───────────────────────────────────────────────

type SectionsMap = NonNullable<StudioDocV2Resolved["sections"]>;

interface LegacyRevision {
  id: string;
  documentId: string;
  revisionNo: number;
  createdBy: string;
  createdAt: Date;
  templateVersionId: string;
  snapshot: NormDocSnapshot;
  snapshotSha256: string;
  docNumber: string;
  tier: StudioTier;
  templateSlug: string;
  templateVersionNo: number;
}

type Adapted = LegacyAdaptation;

/** Adaptasi deterministik snapshot v1 (satu sumber `services/structure/legacy-v1`, IP-52). */
function adaptLegacy(rev: LegacyRevision): Adapted {
  return adaptLegacySnapshot(rev.snapshot);
}

/** Warisi pid bab/section dari revisi sebelumnya dokumen yang sama (mutasi di tempat). */
function inheritPids(sections: SectionsMap, prev: StructureRows | null): void {
  if (!prev) return;
  const chapterPid = new Map(prev.chapters.map((c) => [c.chapterKey, c.pid]));
  const subPid = new Map(prev.subsections.filter((s) => s.sectionNo > 0).map((s) => [`${s.chapterKey}\u0000${s.sectionNo}`, s.pid]));
  for (const v of Object.values(sections)) {
    for (const c of (v as unknown as { chapters?: ChapterV2[] }).chapters ?? []) {
      if (!c.id && chapterPid.has(c.key)) c.id = chapterPid.get(c.key);
      c.sections?.forEach((s, i) => {
        const p = subPid.get(`${c.key}\u0000${i + 1}`);
        if (!s.id && p) s.id = p;
      });
    }
  }
}

/** Allocator yang memberi baris `F:<slot>` pid blockId v1 beralamat sama bila bebas. */
function frontAwareAllocator(base: TrackingPidAllocator, frontPids: ReadonlyMap<string, string>): TrackingPidAllocator {
  return {
    isUsed: (pid) => base.isUsed(pid),
    reserve: (pid) => base.reserve(pid),
    next(kind, hint) {
      const mapped = kind === "BLOCK" ? frontPids.get(hint) : undefined;
      if (mapped && !base.isUsed(mapped)) {
        base.reserve(mapped);
        return mapped;
      }
      return base.next(kind, hint);
    },
  };
}

function frontPidMap(snapshot: NormDocSnapshot): Map<string, string> {
  const mapper = new PidMapper(new AdaptRecorder("strip"));
  const out = new Map<string, string>();
  for (const b of snapshot.blocks) {
    if (!b.address || !b.address.startsWith("F:")) continue;
    const pid = mapper.map(b.blockId);
    if (pid) out.set(b.address, pid);
  }
  return out;
}

function v1Labels(snapshot: NormDocSnapshot): Map<string, string | null> {
  const out = new Map<string, string | null>();
  for (const b of snapshot.blocks) {
    if (!b.address || b.address.startsWith("F:")) continue;
    out.set(b.address, b.artifactLabel ?? snapshot.numbering?.[b.blockId] ?? null);
  }
  return out;
}

// ── Satu revisi ─────────────────────────────────────────────────────────

interface RevisionOutcome {
  revisionId: string;
  docNumber: string;
  revisionNo: number;
  outcome: "written" | "skipped-existing" | "skipped-later-structured" | "failed";
  counts?: { sections: number; chapters: number; subsections: number; blocks: number };
  identities?: { created: number; retired: number; revived: number };
  slots?: string[];
  labelFixes?: number;
  addressesMissingInV1?: number;
  v1AddressesWithoutRow?: number;
  pendingAssetLinks?: number;
  adaptDropped?: Record<string, number>;
  error?: string;
}

async function templateSlotIds(db: StructureDb, templateVersionId: string): Promise<Map<string, string>> {
  const rows = await db.studioTemplateSlot.findMany({ where: { templateVersionId }, select: { id: true, slotKey: true } });
  return new Map(rows.map((r) => [r.slotKey, r.id]));
}

/**
 * Langkah akhir bersama tulis-awal dan tulis-ulang: label artefak = snapshot v1 per alamat,
 * tautan aset tertunda bila M13 belum punya baris, cap pengisi terhadap revisi sebelumnya.
 */
async function finishLegacyRows(tx: Prisma.TransactionClient, rev: LegacyRevision, built: StructureRows, prev: StructureRows | null) {
  let rows = built;
  // Label artefak = snapshot v1 per alamat (jalur lama tetap acuan penomoran).
  const labels = v1Labels(rev.snapshot);
  let labelFixes = 0;
  let addressesMissingInV1 = 0;
  const rowAddresses = new Set<string>();
  rows.blocks = rows.blocks.map((b) => {
    if (b.chapterKey === null) return b;
    rowAddresses.add(b.address);
    if (!labels.has(b.address)) {
      addressesMissingInV1++;
      return b;
    }
    const want = labels.get(b.address) ?? null;
    if (want === b.artifactLabel) return b;
    labelFixes++;
    return { ...b, artifactLabel: want };
  });
  const v1AddressesWithoutRow = [...labels.keys()].filter((a) => !rowAddresses.has(a)).length;

  // Aset gambar tanpa baris M13: tautan ditunda (isi blok tetap memuat kunci aset).
  const shas = [...new Set(rows.blocks.map((b) => b.assetSha256).filter((s): s is string => !!s))];
  const known = new Set(
    shas.length > 0 ? (await tx.studioAsset.findMany({ where: { sha256: { in: shas } }, select: { sha256: true } })).map((a) => a.sha256) : [],
  );
  let pendingAssetLinks = 0;
  rows.blocks = rows.blocks.map((b) => {
    if (!b.assetSha256 || known.has(b.assetSha256)) return b;
    pendingAssetLinks++;
    return { ...b, assetSha256: null };
  });

  // Cap pengisi: slot/bab terisi yang berubah terhadap revisi sebelumnya.
  const prevSec = new Map((prev?.sections ?? []).map((s) => [s.slotKey, s.payloadSha256]));
  const prevCh = new Map((prev?.chapters ?? []).map((c) => [c.chapterKey, c.contentSha256]));
  rows = carryFillStamps(
    rows,
    prev,
    {
      slots: rows.sections.filter((s) => s.filled && prevSec.get(s.slotKey) !== s.payloadSha256).map((s) => s.slotKey),
      chapters: rows.chapters.filter((c) => prevCh.get(c.chapterKey) !== c.contentSha256).map((c) => c.chapterKey),
    },
    { lastFilledBy: rev.createdBy, lastFilledAt: rev.createdAt.toISOString(), lastFilledRevisionNo: rev.revisionNo },
  );
  return { rows, labelFixes, addressesMissingInV1, v1AddressesWithoutRow, pendingAssetLinks };
}

async function previousRows(tx: Prisma.TransactionClient, rev: LegacyRevision): Promise<StructureRows | null> {
  const prevRev = await tx.studioRevision.findFirst({
    where: { documentId: rev.documentId, revisionNo: { lt: rev.revisionNo }, docSections: { some: {} } },
    orderBy: { revisionNo: "desc" },
    select: { id: true },
  });
  return prevRev ? await readRows(prevRev.id, tx) : null;
}

async function backfillRevision(rev: LegacyRevision, dryRun: boolean): Promise<RevisionOutcome> {
  const base = { revisionId: rev.id, docNumber: rev.docNumber, revisionNo: rev.revisionNo };
  const skeleton = await getSkeleton(rev.templateVersionId, { tier: rev.tier });
  const adapted = adaptLegacy(rev);
  let outcome: RevisionOutcome | null = null;
  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${STUDIO_LOCK_DOC_PREFIX + rev.documentId}))`;
        if ((await tx.studioDocSection.count({ where: { revisionId: rev.id } })) > 0) {
          outcome = { ...base, outcome: "skipped-existing" };
          return;
        }
        const later = await tx.studioDocSection.findFirst({
          where: { revision: { documentId: rev.documentId, revisionNo: { gt: rev.revisionNo } } },
          select: { id: true },
        });
        if (later) {
          // Menyisipkan revisi lama di bawah revisi berstruktur akan merusak pensiun identitas.
          outcome = { ...base, outcome: "skipped-later-structured" };
          return;
        }
        const prev = await previousRows(tx, rev);

        // Slot: wajib + berisi, urut kerangka, posisi kontigu (KD-08).
        const sections = JSON.parse(JSON.stringify(adapted.sections)) as SectionsMap;
        const slotIds = skeleton.implicit ? new Map<string, string>() : await templateSlotIds(tx, rev.templateVersionId);
        const specs: SlotRowSpec[] = [];
        for (const s of skeleton.skeleton.slots) {
          if (!isSlotActive(s, rev.tier)) continue;
          if (!s.required && sections[s.slotKey] === undefined) continue;
          specs.push({ slotKey: s.slotKey, sectionTypeKey: s.sectionType, templateSlotId: slotIds.get(s.slotKey) ?? null, position: specs.length + 1 });
        }
        const slotTypes = new Map(specs.map((s) => [s.slotKey, s.sectionTypeKey]));

        // Pid: adaptor -> warisan -> bangkitan.
        inheritPids(sections, prev);
        const allocator = frontAwareAllocator(await dbPidAllocator(tx, rev.documentId), frontPidMap(rev.snapshot));
        assignMissingPids(sections, slotTypes, allocator);

        const source: StudioDocV2Resolved = {
          $schema: "studio.doc/v2",
          template: { slug: rev.templateSlug, version: rev.templateVersionNo },
          meta: (rev.snapshot.doc?.meta ?? {}) as DocMeta,
          sections,
          ...(Object.keys(adapted.assets).length > 0 ? { assets: adapted.assets } : {}),
        };
        const fin = await finishLegacyRows(tx, rev, rowsFromSource({ source, slots: specs, allocator, ...(prev ? { prev } : {}) }), prev);
        const { rows, labelFixes, addressesMissingInV1, v1AddressesWithoutRow, pendingAssetLinks } = fin;

        const written = await writeRevisionRows(tx, rev.id, rows, {
          onRetiredPid: "revive",
          dualWriteLegacy: false,
          correlationId: RUN_ID,
        });

        // Gerbang sebelum commit: rekonstruksi dari baris yang baru ditulis.
        const recon = await verifyReconstruction(rev.id, tx);
        if (!recon.matches) {
          throw new StructureIntegrityError("reconstruction sha256 differs before commit", {
            revisionId: rev.id,
            expected: recon.expectedSha256,
            actual: recon.actualSha256,
          });
        }
        outcome = {
          ...base,
          outcome: "written",
          counts: { sections: written.counts.sections, chapters: written.counts.chapters, subsections: written.counts.subsections, blocks: written.counts.blocks },
          identities: written.identities,
          slots: specs.map((s) => s.slotKey),
          labelFixes,
          addressesMissingInV1,
          v1AddressesWithoutRow,
          pendingAssetLinks,
          adaptDropped: adapted.report.dropped,
        };
        if (dryRun) throw new DryRunRollback();
      },
      { timeout: TX_TIMEOUT_MS, maxWait: 10_000 },
    );
  } catch (err) {
    if (err instanceof DryRunRollback && outcome) return outcome;
    log("error", "backfill revisi gagal", { ...base }, err);
    return { ...base, outcome: "failed", error: err instanceof Error ? err.message : String(err) };
  }
  return outcome ?? { ...base, outcome: "failed", error: "no outcome" };
}

// ── Tulis ulang baris norm/v1 yang menyimpang dari adaptor terkini (D-228) ──

type BlockWithId = { id?: string; type: string };

/** Sinyal lewati di dalam transaksi (rollback, bukan galat). */
class RewriteSkip extends Error {
  constructor(
    readonly outcome: RewriteOutcome["outcome"],
    readonly reason: string,
    readonly detail: Record<string, unknown> = {},
  ) {
    super(reason);
    this.name = "RewriteSkip";
  }
}

interface RewriteOutcome {
  revisionId: string;
  docNumber: string;
  revisionNo: number;
  outcome: "rewritten" | "unchanged" | "skipped-no-rows" | "skipped-built-upon" | "skipped-pid-mismatch" | "failed";
  reason?: string;
  detail?: Record<string, unknown>;
  before?: { sections: number; chapters: number; subsections: number; blocks: number; sectionsSha256?: string };
  after?: { sections: number; chapters: number; subsections: number; blocks: number; sectionsSha256?: string };
  changedBlocks?: number;
  identities?: { created: number; retired: number; revived: number };
  labelFixes?: number;
  pendingAssetLinks?: number;
  error?: string;
}

/**
 * Salin pid bab/section/blok baris lama ke `sections` adaptor terkini (posisi sama).
 * Bentuk wajib identik (slot, kunci bab, jumlah section/blok, jenis blok); pid
 * adaptor yang sudah ada wajib sama dengan pid baris. Mengembalikan alasan
 * ketidaksesuaian pertama atau null.
 */
function copyRowPids(target: SectionsMap, old: SectionsMap): string | null {
  const keys = (m: SectionsMap) => Object.keys(m).sort().join(",");
  if (keys(target) !== keys(old)) return `slot berbeda: ${keys(target)} vs ${keys(old)}`;
  const take = (t: { id?: string }, o: { id?: string }, where: string): string | null => {
    if (!o.id) return `pid baris lama kosong di ${where}`;
    if (t.id && t.id !== o.id) return `pid adaptor ${t.id} != pid baris ${o.id} di ${where}`;
    t.id = o.id;
    return null;
  };
  const blocks = (tb: readonly BlockWithId[] | undefined, ob: readonly BlockWithId[] | undefined, where: string): string | null => {
    if ((tb === undefined) !== (ob === undefined)) return `intro ada/tidak berbeda di ${where}`;
    const a = tb ?? [];
    const b = ob ?? [];
    if (a.length !== b.length) return `jumlah blok ${a.length} != ${b.length} di ${where}`;
    for (let i = 0; i < a.length; i++) {
      if (a[i].type !== b[i].type) return `jenis blok ${a[i].type} != ${b[i].type} di ${where}.${i + 1}`;
      const e = take(a[i], b[i], `${where}.${i + 1}`);
      if (e) return e;
    }
    return null;
  };
  for (const slot of Object.keys(target)) {
    const tc = (target[slot] as unknown as { chapters?: ChapterV2[] }).chapters;
    const oc = (old[slot] as unknown as { chapters?: ChapterV2[] }).chapters;
    if (!tc && !oc) continue;
    if (!tc || !oc || tc.length !== oc.length) return `jumlah bab berbeda di slot ${slot}`;
    for (let ci = 0; ci < tc.length; ci++) {
      const t = tc[ci];
      const o = oc[ci];
      if (t.key !== o.key) return `kunci bab ${t.key} != ${o.key} di slot ${slot}`;
      const e1 = take(t, o, `${slot}/${t.key}`) ?? blocks(t.intro as BlockWithId[] | undefined, o.intro as BlockWithId[] | undefined, `${t.key}.0`);
      if (e1) return e1;
      if (t.sections.length !== o.sections.length) return `jumlah section bab ${t.key} ${t.sections.length} != ${o.sections.length}`;
      for (let si = 0; si < t.sections.length; si++) {
        const e2 = take(t.sections[si], o.sections[si], `${t.key}.${si + 1}`) ?? blocks(t.sections[si].blocks as BlockWithId[], o.sections[si].blocks as BlockWithId[], `${t.key}.${si + 1}`);
        if (e2) return e2;
      }
    }
  }
  return null;
}

/** Peta pid baris (bab, sub-bagian, blok) per kunci posisi, terurut (pembanding identitas). */
function pidMap(rows: StructureRows): string[] {
  return [
    ...rows.chapters.map((c) => `C ${c.slotKey}/${c.chapterKey}=${c.pid}`),
    ...rows.subsections.map((s) => `S ${s.chapterKey}.${s.sectionNo}=${s.pid}`),
    ...rows.blocks.map((b) => `B ${b.slotKey}@${b.address}=${b.pid}`),
  ].sort();
}

const rowCounts = (r: StructureRows) => ({ sections: r.sections.length, chapters: r.chapters.length, subsections: r.subsections.length, blocks: r.blocks.length });

/**
 * `--rewrite-v1-rows`: baris M14-M17 revisi norm/v1 yang tidak lagi mereproduksi
 * `adaptV1(snapshot.doc)` (adaptor berubah sesudah backfill, mis. RQ-10) ditulis ulang
 * dari adaptor terkini dengan pid baris lama (M18 tetap). Syarat: revisi terakhir
 * dokumennya (belum dibangun-di-atasi revisi lain/sunting pid); urutan dan himpunan pid
 * identik (0 pid baru/pensiun/revive) — selain itu dilewati + dilaporkan. Snapshot dan
 * kolom revisi tidak disentuh. Satu transaksi per revisi; rekonstruksi dicek sebelum commit.
 * Idempoten: baris yang sudah cocok = `unchanged`.
 */
async function rewriteRevision(rev: LegacyRevision, dryRun: boolean): Promise<RewriteOutcome> {
  const base = { revisionId: rev.id, docNumber: rev.docNumber, revisionNo: rev.revisionNo };
  const adapted = adaptLegacy(rev);
  let outcome: RewriteOutcome | null = null;
  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${STUDIO_LOCK_DOC_PREFIX + rev.documentId}))`;
        if ((await tx.studioDocSection.count({ where: { revisionId: rev.id } })) === 0) throw new RewriteSkip("skipped-no-rows", "revisi belum berbaris (pakai backfill biasa)");
        const later = await tx.studioRevision.count({ where: { documentId: rev.documentId, revisionNo: { gt: rev.revisionNo } } });
        const laterIdentities = await tx.studioDocIdentity.count({
          where: { documentId: rev.documentId, OR: [{ createdRevisionNo: { gt: rev.revisionNo } }, { retiredRevisionNo: { not: null } }] },
        });
        if (later > 0 || laterIdentities > 0) {
          throw new RewriteSkip("skipped-built-upon", "baris sudah dibangun-di-atasi revisi lain / sunting pid", { laterRevisions: later, laterOrRetiredIdentities: laterIdentities });
        }
        const recon = await verifyReconstruction(rev.id, tx);
        const oldRows = await readRows(rev.id, tx);
        const before = { ...rowCounts(oldRows), sectionsSha256: recon.legacyV1?.rebuiltSectionsSha256 };
        if (recon.matches) {
          outcome = { ...base, outcome: "unchanged", before };
          return;
        }
        if (recon.actualSha256 !== rev.snapshotSha256 || (recon.legacyV1?.pidMismatches ?? 0) !== 0) {
          throw new RewriteSkip("skipped-pid-mismatch", "hanya isi menyimpang yang ditulis ulang; snapshot/pid adaptor tidak cocok", {
            actualSha256: recon.actualSha256,
            pidMismatches: recon.legacyV1?.pidMismatches ?? null,
          });
        }

        // Isi = adaptor terkini; pid bab/section/blok = baris lama (posisi sama).
        const sections = JSON.parse(JSON.stringify(adapted.sections)) as SectionsMap;
        const shapeError = copyRowPids(sections, (recon.source.sections ?? {}) as SectionsMap);
        if (shapeError) throw new RewriteSkip("skipped-pid-mismatch", shapeError);

        // Pid intro (sub-bagian 0) dan baris slot F: diwarisi dari baris lama lewat `prev`;
        // permintaan pid baru apa pun = ketidaksamaan identitas (dilewati).
        const fresh: string[] = [];
        const dbAlloc = await dbPidAllocator(tx, rev.documentId);
        const guarded: TrackingPidAllocator = {
          isUsed: (pid) => dbAlloc.isUsed(pid),
          reserve: () => undefined,
          next(kind, hint) {
            const pid = dbAlloc.next(kind, hint);
            fresh.push(`${kind}:${hint}->${pid}`);
            return pid;
          },
        };
        const specs: SlotRowSpec[] = [...oldRows.sections]
          .sort((a, b) => a.position - b.position)
          .map((s) => ({ slotKey: s.slotKey, sectionTypeKey: s.sectionTypeKey, templateSlotId: s.templateSlotId, position: s.position }));
        const source: StudioDocV2Resolved = {
          $schema: "studio.doc/v2",
          template: { slug: rev.templateSlug, version: rev.templateVersionNo },
          meta: (rev.snapshot.doc?.meta ?? {}) as DocMeta,
          sections,
          ...(Object.keys(adapted.assets).length > 0 ? { assets: adapted.assets } : {}),
        };
        const built = rowsFromSource({ source, slots: specs, allocator: guarded, prev: oldRows });
        if (fresh.length > 0) throw new RewriteSkip("skipped-pid-mismatch", "tulis ulang membutuhkan pid baru", { fresh: fresh.slice(0, 20) });
        const fin = await finishLegacyRows(tx, rev, built, await previousRows(tx, rev));
        const a = pidMap(oldRows);
        const b = pidMap(fin.rows);
        if (a.length !== b.length || a.some((x, i) => x !== b[i])) {
          const missing = a.filter((x) => !b.includes(x)).slice(0, 10);
          const extra = b.filter((x) => !a.includes(x)).slice(0, 10);
          throw new RewriteSkip("skipped-pid-mismatch", "urutan/himpunan pid berbeda dari baris lama", { old: a.length, next: b.length, missing, extra });
        }
        const oldBlockSha = new Map(oldRows.blocks.map((x) => [x.pid, x.contentSha256]));
        const changedBlocks = fin.rows.blocks.filter((x) => oldBlockSha.get(x.pid) !== x.contentSha256).length;

        await tx.studioDocSection.deleteMany({ where: { revisionId: rev.id } }); // kaskade M15-M17
        const written = await writeRevisionRows(tx, rev.id, fin.rows, { onRetiredPid: "revive", dualWriteLegacy: false, correlationId: RUN_ID });
        const { created, retired, revived } = written.identities;
        if (created !== 0 || retired !== 0 || revived !== 0) {
          throw new RewriteSkip("skipped-pid-mismatch", "identitas M18 berubah saat tulis ulang", { ...written.identities });
        }
        const after = await verifyReconstruction(rev.id, tx);
        if (!after.matches) {
          throw new StructureIntegrityError("rewritten rows do not reproduce the snapshot before commit", {
            revisionId: rev.id,
            expected: after.expectedSha256,
            actual: after.actualSha256,
            legacyV1: after.legacyV1,
          });
        }
        outcome = {
          ...base,
          outcome: "rewritten",
          before,
          after: { ...rowCounts(fin.rows), sectionsSha256: after.legacyV1?.rebuiltSectionsSha256 },
          changedBlocks,
          identities: written.identities,
          labelFixes: fin.labelFixes,
          pendingAssetLinks: fin.pendingAssetLinks,
        };
        if (dryRun) throw new DryRunRollback();
      },
      { timeout: TX_TIMEOUT_MS, maxWait: 10_000 },
    );
  } catch (err) {
    if (err instanceof DryRunRollback && outcome) return outcome;
    if (err instanceof RewriteSkip) return { ...base, outcome: err.outcome, reason: err.reason, detail: err.detail };
    log("error", "tulis ulang baris revisi gagal", { ...base }, err);
    return { ...base, outcome: "failed", error: err instanceof Error ? err.message : String(err) };
  }
  return outcome ?? { ...base, outcome: "failed", error: "no outcome" };
}

// ── Tautan aset tertunda (idempoten) ────────────────────────────────────

async function relinkPendingAssets(rev: LegacyRevision): Promise<{ pending: number; linked: number }> {
  const images = await prisma.studioDocBlock.findMany({
    where: { revisionId: rev.id, type: "image", assetId: null },
    select: { id: true, content: true },
  });
  if (images.length === 0) return { pending: 0, linked: 0 };
  const assets = adaptLegacy(rev).assets;
  const shaOf = (content: unknown): string | null => {
    const key = (content as { asset?: unknown } | null)?.asset;
    if (typeof key !== "string") return null;
    const m = SHA256_REF.exec(key) ?? SHA256_REF.exec(assets[key]?.assetRef ?? "");
    return m ? m[1] : null;
  };
  const wanted = images.map((b) => ({ id: b.id, sha: shaOf(b.content) }));
  const shas = [...new Set(wanted.map((w) => w.sha).filter((s): s is string => !!s))];
  const found = new Map(
    (await prisma.studioAsset.findMany({ where: { sha256: { in: shas } }, select: { id: true, sha256: true } })).map((a) => [a.sha256, a.id]),
  );
  let linked = 0;
  for (const w of wanted) {
    const assetId = w.sha ? found.get(w.sha) : undefined;
    if (!assetId) continue;
    await prisma.studioDocBlock.update({ where: { id: w.id }, data: { assetId } });
    linked++;
  }
  return { pending: images.length - linked, linked };
}

// ── Verifikasi seluruh revisi lama ──────────────────────────────────────

interface VerifyRow {
  revisionId: string;
  docNumber: string;
  revisionNo: number;
  rows: { M14: number; M15: number; M16: number; M17: number };
  snapshotSha256: string;
  reconstructedSha256: string | null;
  matches: boolean;
  completeness: { column: string; document: string; fromRows: string | null };
  error?: string;
}

async function completenessFromRows(rev: LegacyRevision): Promise<string> {
  const skeleton = await getSkeleton(rev.templateVersionId, { tier: rev.tier });
  const rows = await readRows(rev.id);
  const sec = new Map(rows.sections.map((s) => [s.slotKey, s]));
  const report = computeCompleteness({
    revisionNo: rev.revisionNo,
    doc: { docId: rev.documentId, docNumber: rev.docNumber },
    slots: skeleton.skeleton.slots.map((s) => {
      const row = sec.get(s.slotKey);
      return {
        slotKey: s.slotKey,
        sectionType: s.sectionType,
        label: s.label,
        required: s.required,
        repeatable: s.repeatable,
        minItems: s.minItems ?? null,
        maxItems: s.maxItems ?? null,
        contentMode: s.contentMode,
        active: isSlotActive(s, rev.tier),
        row: row
          ? { filled: row.filled, payload: row.payload, lastFilledBy: row.lastFilledBy, lastFilledAt: row.lastFilledAt, lastFilledRevisionNo: row.lastFilledRevisionNo }
          : null,
        ...(isRepeatableSectionType(s.sectionType)
          ? {
              chapters: rows.chapters
                .filter((c) => c.slotKey === s.slotKey)
                .map((c) => ({ key: c.chapterKey, pid: c.pid, by: c.lastFilledBy, at: c.lastFilledAt, revisionNo: c.lastFilledRevisionNo })),
            }
          : {}),
      };
    }),
  });
  return report.status;
}

async function verifyAll(revs: LegacyRevision[]): Promise<VerifyRow[]> {
  const out: VerifyRow[] = [];
  for (const rev of revs) {
    const [m14, m15, m16, m17, state] = await Promise.all([
      prisma.studioDocSection.count({ where: { revisionId: rev.id } }),
      prisma.studioDocChapter.count({ where: { revisionId: rev.id } }),
      prisma.studioDocSubsection.count({ where: { revisionId: rev.id } }),
      prisma.studioDocBlock.count({ where: { revisionId: rev.id } }),
      prisma.studioRevision.findUniqueOrThrow({ where: { id: rev.id }, select: { completeness: true, document: { select: { completeness: true } } } }),
    ]);
    const row: VerifyRow = {
      revisionId: rev.id,
      docNumber: rev.docNumber,
      revisionNo: rev.revisionNo,
      rows: { M14: m14, M15: m15, M16: m16, M17: m17 },
      snapshotSha256: rev.snapshotSha256,
      reconstructedSha256: null,
      matches: false,
      completeness: { column: state.completeness, document: state.document.completeness, fromRows: null },
    };
    try {
      const r = await verifyReconstruction(rev.id);
      row.reconstructedSha256 = r.actualSha256;
      row.matches = r.matches && r.actualSha256 === rev.snapshotSha256;
      row.completeness.fromRows = await completenessFromRows(rev);
    } catch (err) {
      row.error = err instanceof Error ? err.message : String(err);
      log("error", "verifikasi rekonstruksi gagal", { revisionId: rev.id, docNumber: rev.docNumber }, err);
    }
    out.push(row);
  }
  return out;
}

// ── Main ────────────────────────────────────────────────────────────────

async function loadLegacyRevisions(): Promise<LegacyRevision[]> {
  const revs = await prisma.studioRevision.findMany({
    orderBy: [{ documentId: "asc" }, { revisionNo: "asc" }],
    select: {
      id: true,
      documentId: true,
      revisionNo: true,
      createdBy: true,
      createdAt: true,
      templateVersionId: true,
      snapshot: true,
      snapshotSha256: true,
      document: { select: { docNumber: true, tier: true } },
      templateVersion: { select: { versionNo: true, template: { select: { slug: true } } } },
    },
  });
  const out: LegacyRevision[] = [];
  for (const r of revs) {
    const snap = r.snapshot as unknown as AnyNormSnapshot | null;
    if (!snap || isNormSnapshotV2(snap) || snap.schema !== "studio.norm/v1") continue;
    out.push({
      id: r.id,
      documentId: r.documentId,
      revisionNo: r.revisionNo,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
      templateVersionId: r.templateVersionId,
      snapshot: snap,
      snapshotSha256: r.snapshotSha256,
      docNumber: r.document.docNumber,
      tier: r.document.tier as StudioTier,
      templateSlug: (snap.doc?.template as { slug?: string } | undefined)?.slug ?? r.templateVersion.template.slug,
      templateVersionNo: r.templateVersion.versionNo,
    });
  }
  return out;
}

function diffCounts(before: Record<string, number>, after: Record<string, number>): { structure: Record<string, string>; otherChanged: Record<string, string> } {
  const structure: Record<string, string> = {};
  const otherChanged: Record<string, string> = {};
  for (const t of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const v = `${before[t] ?? "-"} -> ${after[t] ?? "-"}`;
    if (STRUCTURE_TABLES.has(t)) structure[t] = v;
    else if (before[t] !== after[t]) otherChanged[t] = v;
  }
  return { structure, otherChanged };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const unknown = argv.filter((a) => a !== "--dry-run" && a !== "--rewrite-v1-rows");
  if (unknown.length > 0) throw new Error(`argumen tidak dikenal: ${unknown.join(" ")} (pakai: [--dry-run] [--rewrite-v1-rows])`);
  const dryRun = argv.includes("--dry-run");
  const rewrite = argv.includes("--rewrite-v1-rows");
  if (path.resolve(process.cwd()) !== REPO_ROOT) process.chdir(REPO_ROOT);
  try {
    const database = await assertDatabase();
    const countsBefore = await tableCounts();
    const fpBefore = await snapshotFingerprints();
    const legacy = await loadLegacyRevisions();
    log("info", "backfill mulai", { database, dryRun, rewrite, legacyRevisions: legacy.length, totalRevisions: fpBefore.length });

    const outcomes: RevisionOutcome[] = [];
    for (const rev of legacy) {
      const o = await backfillRevision(rev, dryRun);
      outcomes.push(o);
      log(o.outcome === "failed" ? "warn" : "info", `revisi ${rev.docNumber} rev ${rev.revisionNo}: ${o.outcome}`, { ...o });
    }
    const rewrites: RewriteOutcome[] = [];
    if (rewrite) {
      for (const rev of legacy) {
        const r = await rewriteRevision(rev, dryRun);
        rewrites.push(r);
        log(r.outcome === "failed" ? "warn" : "info", `tulis ulang ${rev.docNumber} rev ${rev.revisionNo}: ${r.outcome}`, { ...r });
      }
    }
    const relinks = dryRun ? [] : await Promise.all(legacy.map(async (r) => ({ revisionId: r.id, ...(await relinkPendingAssets(r)) })));

    const verify = dryRun ? [] : await verifyAll(legacy);
    for (const v of verify) log(v.matches ? "info" : "error", `verifikasi ${v.docNumber} rev ${v.revisionNo}: ${v.matches ? "cocok" : "TIDAK cocok"}`, { ...v });

    const countsAfter = await tableCounts();
    const fpAfter = await snapshotFingerprints();
    const fpBeforeById = new Map(fpBefore.map((f) => [f.revisionId, f]));
    const snapshotChanged = fpAfter.filter((f) => {
      const b = fpBeforeById.get(f.revisionId);
      return !b || b.stored !== f.stored || b.recomputed !== f.recomputed;
    });
    const diff = diffCounts(countsBefore, countsAfter);
    const failed =
      outcomes.filter((o) => o.outcome === "failed").length + rewrites.filter((r) => r.outcome === "failed").length + verify.filter((v) => !v.matches).length;
    log(failed === 0 ? "info" : "error", "backfill selesai", {
      database,
      dryRun,
      outcomes: outcomes.map((o) => `${o.docNumber}#${o.revisionNo}:${o.outcome}`),
      ...(rewrite ? { rewrites: rewrites.map((r) => `${r.docNumber}#${r.revisionNo}:${r.outcome}${r.reason ? ` (${r.reason})` : ""}`) } : {}),
      relinks,
      structureCounts: diff.structure,
      otherTablesChanged: diff.otherChanged,
      snapshots: {
        checked: fpAfter.length,
        changed: snapshotChanged.length,
        storedEqualsRecomputed: fpAfter.every((f) => f.stored === f.recomputed),
        before: fpBefore.map((f) => `${f.revisionId}:${f.stored}`),
        after: fpAfter.map((f) => `${f.revisionId}:${f.stored}`),
      },
      failed,
    });
    if (failed > 0 || snapshotChanged.length > 0) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await Promise.all(pendingLogs);
  }
}

main().catch(async (err: unknown) => {
  log("error", err instanceof Error ? err.message : String(err), { argv: process.argv.slice(2) }, err);
  await Promise.all(pendingLogs);
  process.exitCode = 1;
});

