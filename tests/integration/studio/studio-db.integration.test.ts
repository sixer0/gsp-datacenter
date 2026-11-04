/* eslint-disable @typescript-eslint/no-explicit-any -- uji integrasi: hasil layanan/route dibaca longgar */
// SR-49 (S75 diperluas; blueprint 05 SR-49, SC-5/SC-6/SC-7; D-21, D-209, D-213, D-228, D-238).
//
// Uji integrasi Studio terhadap DB NYATA `gsp_agent_hq_v21_uji` (bukan Prisma tiruan):
//   F0  penjaga DB + migrasi (7 migrasi, termasuk add_studio dan add_studio_structure)
//   F1  ingest v1 jalur lama (norm/v1, tanpa baris struktur) + render baseline revisi lama
//   F2  seed preset + kerangka: nilai efektif (paramsSha256 terproyeksi) sama dengan versi lama
//   F3  backfill struktur (jalan 1, jalan 2 idempoten + relink aset) dan --rewrite-v1-rows idempoten
//   F4  rekonstruksi snapshot dari tabel M14-M18 = snapshotSha256 (revisi lama)
//   F5  render ulang revisi lama identik (DOCX/HTML byte-identik; PDF ternormalisasi)
//   F6  ingest v1 lewat adaptor dan v2 (dokumen 000 bertarget: R14 templateVersion + setMeta + R04)
//   F7  kiriman parsial (dokumen kosong, bab, slot, kirim ulang, pembaruan bab, konflik, rebase)
//       + render lingkup draf (bab/slot), penolakan render penuh INCOMPLETE, render penuh COMPLETE
//   F8  rekonstruksi SETIAP revisi di DB uji = snapshotSha256; render ulang revisi v2 lama identik
//   F9  F-062: karakterisasi releaseStatus FAIL dokumen 000 (cek yang FAIL dikutip, aturan tidak diubah)
//
// Jalankan: `node tests/integration/studio/uji-run.mjs suite` (reset DB uji + seed dasar + vitest).
// Tanpa pembungkus, suite di-skip dan tidak memuat Prisma sama sekali.
import './_env';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UJI_DB, ujiActive } from './_env';
import {
  agentReq,
  lastLine,
  OUT_DIR,
  pdfNormalizedSha256,
  readJson,
  readOutput,
  REPO_ROOT,
  routeParams,
  runRepoScript,
  sha256Hex,
  stableJson,
  writeAtomic,
} from './_helpers';

const ACTIVE = ujiActive();
const T = 900_000;

type Any = any;

const ADMIN = { kind: 'ADMIN_SESSION', requester: 'sr49-admin', username: 'sr49-admin', role: 'ADMINISTRATOR', canWriteClassK: true } as Any;
const CHANGE = { what: 'Uji integrasi SR-49', why: 'Verifikasi DB uji', impact: 'Tidak ada (DB uji)' };

// Modul dimuat dinamis hanya bila ACTIVE.
let prisma: Any;
let ingest: Any;
let render: Any;
let structure: Any;
let canonical: Any;
let submit: Any;
let revisionsV2: Any;
let assets: Any;
let routes: Any = {};

/** Bukti yang dikumpulkan untuk laporan (out/evidence.json). */
const E: Record<string, Any> = { database: null, steps: {} };
const pdfCopies = new Map<string, number>();
const S: Record<string, Any> = {};

async function dbName(): Promise<string> {
  const r = await prisma.$queryRawUnsafe('select current_database() as db');
  return r[0].db as string;
}

async function renderShas(revisionId: string, formats: string[]): Promise<{ jobId: string; status: string; releaseStatus: string | null; errors: string[]; sha: Record<string, string>; pdfNorm?: string; diskEqualsDb: boolean }> {
  const r = await render.renderRevision(revisionId, formats, ADMIN);
  const prim = r.outputs.filter((o: Any) => o.role === 'PRIMARY');
  const sha: Record<string, string> = {};
  let pdfNorm: string | undefined;
  let diskEqualsDb = true;
  for (const o of prim) {
    const bytes = readOutput(o.relPath);
    const disk = sha256Hex(bytes);
    if (disk !== o.sha256) diskEqualsDb = false;
    sha[o.format] = o.sha256;
    if (o.format === 'PDF') {
      pdfNorm = pdfNormalizedSha256(bytes);
      // Salinan untuk diagnosis beda PDF antar jalan (berkas keluaran ditimpa pada render ulang).
      const n = (pdfCopies.get(revisionId) ?? 0) + 1;
      pdfCopies.set(revisionId, n);
      mkdirSync(path.join(OUT_DIR, 'pdf'), { recursive: true });
      writeFileSync(path.join(OUT_DIR, 'pdf', `${revisionId}-${n}.pdf`), bytes);
    }
  }
  return {
    jobId: r.job.id,
    status: r.job.status,
    releaseStatus: r.lint?.releaseStatus ?? null,
    errors: r.errors.map((e: Any) => `${e.code}: ${String(e.message).slice(0, 160)}`),
    sha,
    ...(pdfNorm ? { pdfNorm } : {}),
    diskEqualsDb,
  };
}

async function structureCounts(): Promise<Record<string, number>> {
  const [m14, m15, m16, m17, m18, blk, asset] = await Promise.all([
    prisma.studioDocSection.count(),
    prisma.studioDocChapter.count(),
    prisma.studioDocSubsection.count(),
    prisma.studioDocBlock.count(),
    prisma.studioDocIdentity.count(),
    prisma.studioBlock.count(),
    prisma.studioAsset.count(),
  ]);
  return { M14: m14, M15: m15, M16: m16, M17: m17, M18: m18, StudioBlock: blk, StudioAsset: asset };
}

async function reconstruct(revisionId: string): Promise<{ revisionNo: number; schema: string; expected: string; actual: string; matches: boolean; recomposed: boolean; rebuildOk: boolean }> {
  const rep = await structure.verifyReconstruction(revisionId);
  let rebuildOk = false;
  try {
    const snap = await structure.rebuildSnapshot(revisionId);
    rebuildOk = canonical.canonicalSha256(snap) === rep.expectedSha256;
  } catch {
    rebuildOk = false;
  }
  return { revisionNo: rep.revisionNo, schema: rep.snapshot.schema, expected: rep.expectedSha256, actual: rep.actualSha256, matches: rep.matches, recomposed: rep.recomposed, rebuildOk };
}

async function postJson(mod: Any, method: string, urlPath: string, body: unknown, params?: Record<string, string>): Promise<{ status: number; body: Any }> {
  const req = await agentReq(urlPath, method, body);
  const res = params ? await mod[method](req, routeParams(params)) : await mod[method](req);
  const text = await res.text();
  let parsed: Any = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

describe.skipIf(!ACTIVE)(`SR-49 integrasi DB Studio (${UJI_DB})`, () => {
  beforeAll(async () => {
    rmSync(path.join(OUT_DIR, 'pdf'), { recursive: true, force: true });
    ({ prisma } = await import('@/lib/prisma'));
    ingest = await import('@/lib/studio/services/ingest');
    render = await import('@/lib/studio/services/render');
    structure = await import('@/lib/studio/services/structure');
    await import('@/lib/studio/services/compose/register');
    canonical = await import('@/lib/studio/services/revisions/canonical');
    submit = await import('@/lib/studio/services/submit');
    revisionsV2 = await import('@/lib/studio/services/revisions');
    assets = await import('@/lib/studio/services/images/asset-store');
    routes = {
      chapters: await import('@/app/api/studio/chapters/route'),
      slots: await import('@/app/api/studio/slots/route'),
      documents: await import('@/app/api/studio/documents/route'),
      render: await import('@/app/api/studio/documents/[id]/render/route'),
    };
  }, T);

  afterAll(async () => {
    try {
      const { closeBrowser } = await import('@/lib/studio/engine/browser');
      await closeBrowser();
    } catch {
      /* abaikan */
    }
    writeAtomic(path.join(OUT_DIR, 'evidence.json'), JSON.stringify(E, null, 2));
    await prisma?.$disconnect();
  }, T);

  // ── F0 ────────────────────────────────────────────────────────────────
  describe.sequential('F0 penjaga DB dan migrasi', () => {
    it('koneksi Prisma uji = gsp_agent_hq_v21_uji; 8 migrasi selesai; tabel struktur ada', async () => {
      const db = await dbName();
      E.database = db;
      expect(db).toBe(UJI_DB);
      const mig = await prisma.$queryRawUnsafe('select migration_name, finished_at is not null as done, rolled_back_at is null as live from "_prisma_migrations" order by migration_name');
      E.steps.migrations = mig.map((m: Any) => `${m.migration_name}:${m.done && m.live ? 'applied' : 'NOT'}`);
      // 8 migrasi: ke-8 = 20261030220000_add_studio_contract (commit 2a6f78e, 2026-10-30, delta aditif DC-04).
      expect(mig).toHaveLength(8);
      expect(mig.every((m: Any) => m.done && m.live)).toBe(true);
      expect(mig.map((m: Any) => m.migration_name)).toEqual(expect.arrayContaining(['20261022120000_add_studio', '20261023200000_add_studio_structure']));
      const tables = await prisma.$queryRawUnsafe(`select table_name as t from information_schema.tables where table_schema='public' and table_name like 'Studio%' order by 1`);
      const names = tables.map((r: Any) => r.t);
      for (const t of ['StudioDocSection', 'StudioDocChapter', 'StudioDocSubsection', 'StudioDocBlock', 'StudioDocIdentity', 'StudioAsset', 'StudioTemplateSlot']) expect(names).toContain(t);
      const tpl = await prisma.studioTemplate.findMany({ select: { slug: true, latestVersionNo: true }, orderBy: { slug: 'asc' } });
      E.steps.baseTemplates = tpl;
      // Versi gaya lama hasil salinan v21 (v21-legacy-templates.mjs): gsp v1, kanonik v5, manual-000 v2.
      expect(tpl).toEqual([
        { slug: 'datum-gsp', latestVersionNo: 1 },
        { slug: 'datum-kanonik', latestVersionNo: 5 },
        { slug: 'datum-manual-000', latestVersionNo: 2 },
      ]);
      const skel = await prisma.studioTemplateVersion.count({ where: { skeletonSha256: { not: null } } });
      expect(skel).toBe(0);
    });
  });

  // ── F1 ────────────────────────────────────────────────────────────────
  describe.sequential('F1 ingest v1 jalur lama (norm/v1) + render baseline', () => {
    const LEGACY = [
      { key: 'L1', file: 'tests/parity/fixtures/doc/doc_nota_memo.json', slug: 'datum-kanonik' },
      { key: 'L2', file: 'tests/parity/fixtures/doc/doc_terbit_report.json', slug: 'datum-gsp' },
      { key: 'L3', file: 'benchmark/manual000/doc.json', slug: 'datum-manual-000', assetIndexPath: 'benchmark/manual000/figures/index.json' },
    ] as const;

    it('tiga dokumen v1 masuk sebagai studio.norm/v1 tanpa baris M14-M18', async () => {
      S.legacy = {};
      for (const spec of LEGACY) {
        const doc = readJson(spec.file);
        // Templat = versi gaya lama terbaru (tanpa pin); `mission` fixture dibuang (folder IL tidak ada di DB uji).
        doc.template = { slug: spec.slug };
        delete doc.mission;
        const opts = {
          dryRun: false,
          legacyV1: true,
          trustedHarness: true,
          correlationId: `sr49-${spec.key}`,
          ...('assetIndexPath' in spec ? { assetIndexPath: path.join(REPO_ROOT, spec.assetIndexPath) } : {}),
        };
        const res = await ingest.ingestDocument({ document: doc }, ADMIN, opts);
        expect(res.valid, `${spec.key} valid`).toBe(true);
        const rev = await prisma.studioRevision.findUniqueOrThrow({ where: { id: res.revision.id } });
        expect((rev.snapshot as Any).schema).toBe('studio.norm/v1');
        expect(rev.schemaId).toBe('studio.doc/v1');
        expect(canonical.canonicalSha256(rev.snapshot)).toBe(rev.snapshotSha256);
        expect(await prisma.studioDocSection.count({ where: { revisionId: rev.id } })).toBe(0);
        S.legacy[spec.key] = { documentId: res.document.id, docNumber: res.document.docNumber, revisions: [{ id: rev.id, revisionNo: rev.revisionNo, snapshotSha256: rev.snapshotSha256 }] };
      }
      E.steps.legacyIngest = S.legacy;
    }, T);

    it('revisi lama ke-2 (PATCH blok jalur v1) tetap norm/v1', async () => {
      const L1 = S.legacy.L1;
      const blk = await prisma.studioBlock.findFirst({ where: { revisionId: L1.revisions[0].id, type: 'paragraph' }, orderBy: { ordinal: 'asc' } });
      expect(blk).toBeTruthy();
      const content = { ...(blk.content as Any) };
      content.text = `${String(content.text ?? '').trim()} Revisi uji SR-49 menambah satu kalimat penjelas pada paragraf ini.`;
      delete content.runs;
      const r = await revisionsV2.patchBlock(L1.documentId, blk.address, { baseRevisionNo: 1, op: 'replace', block: content, change: CHANGE }, ADMIN);
      expect(r.revision.revisionNo).toBe(2);
      const rev = await prisma.studioRevision.findUniqueOrThrow({ where: { documentId_revisionNo: { documentId: L1.documentId, revisionNo: 2 } } });
      expect((rev.snapshot as Any).schema).toBe('studio.norm/v1');
      expect(await prisma.studioDocSection.count({ where: { revisionId: rev.id } })).toBe(0);
      L1.revisions.push({ id: rev.id, revisionNo: 2, snapshotSha256: rev.snapshotSha256, address: blk.address });
    }, T);

    it('render baseline revisi lama (DOCX/HTML/PDF): job SUCCEEDED, sha disk = DB', async () => {
      S.baseline = {};
      for (const key of ['L1', 'L2', 'L3']) {
        for (const rev of S.legacy[key].revisions) {
          const r = await renderShas(rev.id, ['DOCX', 'HTML', 'PDF']);
          expect(r.status, `${key} rev ${rev.revisionNo} ${r.errors.join('; ')}`).toBe('SUCCEEDED');
          expect(r.diskEqualsDb).toBe(true);
          expect(Object.keys(r.sha).sort()).toEqual(['DOCX', 'HTML', 'PDF']);
          S.baseline[rev.id] = r;
        }
      }
      E.steps.baselineRender = S.baseline;
    }, T);
  });

  // ── F2 ────────────────────────────────────────────────────────────────
  describe.sequential('F2 seed preset + kerangka (nilai efektif sama)', () => {
    it('--presets-and-skeletons lalu --import-manual000-v2: exit 0, penjaga ok', async () => {
      const a = runRepoScript('prisma/seed-studio.ts', ['--presets-and-skeletons'], '10_seed_presets.log');
      expect(a.code, a.logFile).toBe(0);
      const ga = a.lines.filter((l) => String(l.message).startsWith('Preset + kerangka'));
      expect(ga.length).toBe(2);
      for (const g of ga) expect(g.context.guard.ok, g.context.slug).toBe(true);
      const b = runRepoScript('prisma/seed-studio.ts', ['--import-manual000-v2'], '11_seed_manual000_v2.log');
      expect(b.code, b.logFile).toBe(0);
      const gb = b.lines.filter((l) => String(l.message).startsWith('Preset + kerangka'));
      expect(gb.length).toBe(1);
      expect(gb[0].context.guard.ok).toBe(true);
      E.steps.seedGuards = [...ga, ...gb].map((g) => ({
        slug: g.context.slug,
        outcome: g.context.template?.outcome,
        versionNo: g.context.template?.versionNo,
        guardOk: g.context.guard.ok,
        baselineParamsSha256: g.context.guard.baselineParamsSha256,
        projectedNewSha256: g.context.guard.projectedNewSha256,
        projectedOutsideDelta: g.context.guard.projectedOutsideDelta,
        delta: (g.context.guard.delta ?? []).map((d: Any) => d.key),
      }));
    }, T);

    it('seed ulang = unchanged (idempoten)', async () => {
      const c = runRepoScript('prisma/seed-studio.ts', ['--presets-and-skeletons', '--import-manual000-v2'], '12_seed_rerun.log');
      expect(c.code, c.logFile).toBe(0);
      const g = c.lines.filter((l) => String(l.message).startsWith('Preset + kerangka'));
      expect(g.length).toBe(3);
      for (const x of g) {
        expect(x.context.template.outcome, x.context.slug).toBe('unchanged');
        expect(x.context.preset.outcome, x.context.slug).toBe('unchanged');
      }
      E.steps.seedRerun = g.map((x) => `${x.context.slug}: template ${x.context.template.outcome}, preset ${x.context.preset.outcome}`);
    }, T);

    it('verifikasi independen: proyeksi resolvedParams versi baru ke kunci versi lama = versi lama (di luar Δ)', async () => {
      const deltaBySlug: Record<string, string[]> = {
        'datum-kanonik': [],
        // render.rail.renderer: table3col (v1, warisan profil Manual 000) -> framePr = Δ disengaja,
        // D-327 (FIX-H4/FIX-HZ3), commit c2620b3 (2026-10-30), seed-studio.ts PRESET_MIGRATIONS datum-gsp delta.
        'datum-gsp': ['device.registerBlock.boldFields', 'render.rail.renderer'],
      };
      const out: Any[] = [];
      for (const slug of ['datum-kanonik', 'datum-gsp', 'datum-manual-000']) {
        const t = await prisma.studioTemplate.findUniqueOrThrow({ where: { slug } });
        const versions = await prisma.studioTemplateVersion.findMany({ where: { templateId: t.id }, orderBy: { versionNo: 'asc' } });
        const old = [...versions].reverse().find((v: Any) => v.skeletonSha256 === null);
        const neu = versions[versions.length - 1];
        expect(old, slug).toBeTruthy();
        expect(neu.skeletonSha256, slug).toBeTruthy();
        const oldP = old.resolvedParams as Record<string, unknown>;
        const newP = neu.resolvedParams as Record<string, unknown>;
        // Algoritma paramsSha256 = sha256(stableStringify(resolvedParams)) (cek mandiri).
        const algoOk = sha256Hex(ingest.stableStringify(oldP)) === old.paramsSha256;
        const legacyKeys = Object.keys(oldP);
        const delta =
          slug === 'datum-manual-000'
            ? (readJson('benchmark/manual000/datum-manual-000.preset.json').meta?.intendedDelta ?? []).map((d: Any) => d.key)
            : deltaBySlug[slug];
        const keys = legacyKeys.filter((k) => !delta.includes(k));
        const missing = legacyKeys.filter((k) => !(k in newP));
        const diff = keys.filter((k) => stableJson(newP[k]) !== stableJson(oldP[k]));
        const pick = (p: Record<string, unknown>, ks: string[]) => Object.fromEntries(ks.filter((k) => k in p).map((k) => [k, p[k]]));
        const projOld = sha256Hex(ingest.stableStringify(pick(oldP, keys)));
        const projNew = sha256Hex(ingest.stableStringify(pick(newP, keys)));
        const projNewAll = sha256Hex(ingest.stableStringify(pick(newP, legacyKeys)));
        const row = {
          slug,
          oldVersionNo: old.versionNo,
          newVersionNo: neu.versionNo,
          oldParamsSha256: old.paramsSha256,
          paramsShaAlgorithmConfirmed: algoOk,
          legacyKeys: legacyKeys.length,
          delta,
          projectedNewAllKeysSha256: projNewAll,
          projectedOutsideDelta: { old: projOld, new: projNew },
          missing: missing.slice(0, 20),
          diffOutsideDelta: diff.slice(0, 20),
          diffValues: diff.slice(0, 8).map((k) => ({ key: k, old: oldP[k], new: newP[k] })),
        };
        out.push(row);
      }
      E.steps.paramsProjection = out;
      const kan = out.find((r) => r.slug === 'datum-kanonik');
      expect(kan.paramsShaAlgorithmConfirmed).toBe(true);
      expect(kan.missing).toEqual([]);
      expect(kan.diffOutsideDelta).toEqual([]);
      expect(kan.projectedNewAllKeysSha256).toBe(kan.oldParamsSha256); // Kanonik: persis sama dengan versi lama
      const gsp = out.find((r) => r.slug === 'datum-gsp');
      expect(gsp.missing).toEqual([]);
      expect(gsp.diffOutsideDelta).toEqual([]);
      expect(gsp.projectedOutsideDelta.new).toBe(gsp.projectedOutsideDelta.old);
      // Manual 000: baseline penjaga seed = berkas profil benchmark (bukan baris v1 DB); hasil
      // terhadap baris v1 DB dicatat sebagai bukti (lihat laporan), penjaga seed sudah diasersi di atas.
    }, T);
  });

  // ── F3 ────────────────────────────────────────────────────────────────
  describe.sequential('F3 backfill struktur + --rewrite-v1-rows', () => {
    it('jalan 1: semua revisi norm/v1 mendapat baris, verifikasi cocok, snapshot tak berubah', async () => {
      const before = await structureCounts();
      const r = runRepoScript('prisma/backfill-studio-structure.ts', [], '20_backfill_run1.log');
      expect(r.code, r.logFile).toBe(0);
      const done = lastLine(r, 'backfill selesai');
      expect(done.context.database).toBe(UJI_DB);
      expect(done.context.failed).toBe(0);
      expect(done.context.snapshots.changed).toBe(0);
      expect(done.context.snapshots.storedEqualsRecomputed).toBe(true);
      expect(done.context.otherTablesChanged).toEqual({});
      const n = Object.values(S.legacy).reduce((a: number, d: Any) => a + d.revisions.length, 0);
      expect(done.context.outcomes).toHaveLength(n);
      expect(done.context.outcomes.every((o: string) => !o.endsWith(':failed') && !o.endsWith(':skipped-existing'))).toBe(true);
      const after = await structureCounts();
      E.steps.backfillRun1 = { outcomes: done.context.outcomes, structureCounts: done.context.structureCounts, before, after, relinks: done.context.relinks };
      expect(after.M14).toBeGreaterThan(before.M14);
      expect(after.StudioBlock).toBe(before.StudioBlock);
    }, T);

    it('aset M13 dokumen 000 disimpan lalu jalan 2: skipped-existing, tanpa duplikat, relink gambar tertunda', async () => {
      const doc = readJson('benchmark/manual000/doc.v2.json');
      // Peta sha256 -> berkas dibangun dari byte berkas aset (bukan medan indeks).
      const bySha = new Map<string, string>();
      const dir = path.join(REPO_ROOT, 'benchmark', 'manual000', 'figures', 'assets');
      for (const name of readdirSync(dir)) {
        if (!/\.(png|jpe?g)$/i.test(name)) continue;
        bySha.set(sha256Hex(readFileSync(path.join(dir, name))), `benchmark/manual000/figures/assets/${name}`);
      }
      let stored = 0;
      const missing: string[] = [];
      for (const [, v] of Object.entries<Any>(doc.assets)) {
        const sha = String(v.assetRef).replace(/^sha256:/, '');
        const rel = bySha.get(sha);
        if (!rel || !existsSync(path.join(REPO_ROOT, rel))) {
          missing.push(sha);
          continue;
        }
        const bytes = readFileSync(path.join(REPO_ROOT, rel));
        expect(sha256Hex(bytes)).toBe(sha);
        const mime = rel.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        await assets.storeAsset(ADMIN, { file: bytes, mime });
        stored++;
      }
      expect(missing).toEqual([]);
      const before = await structureCounts();
      const r = runRepoScript('prisma/backfill-studio-structure.ts', [], '21_backfill_run2.log');
      expect(r.code, r.logFile).toBe(0);
      const done = lastLine(r, 'backfill selesai');
      expect(done.context.failed).toBe(0);
      expect(done.context.outcomes.every((o: string) => o.endsWith(':skipped-existing'))).toBe(true);
      const after = await structureCounts();
      for (const k of ['M14', 'M15', 'M16', 'M17', 'M18', 'StudioBlock']) expect(after[k], k).toBe(before[k]);
      const linked = await prisma.studioDocBlock.count({ where: { revision: { documentId: S.legacy.L3.documentId }, type: 'image', assetId: { not: null } } });
      const images = await prisma.studioDocBlock.count({ where: { revision: { documentId: S.legacy.L3.documentId }, type: 'image' } });
      E.steps.backfillRun2 = { assetsStored: stored, outcomes: done.context.outcomes, relinks: done.context.relinks, counts: after, image000: { linked, images } };
      expect(images).toBeGreaterThan(0);
      expect(linked).toBe(images);
    }, T);

    it('--rewrite-v1-rows menolak revisi yang sudah dibangun-di-atasi (001 rev 1): skipped-built-upon, exit 1, baris tidak ditimpa', async () => {
      const L1 = S.legacy.L1;
      const rev1 = L1.revisions[0];
      const victim = await prisma.studioDocBlock.findFirst({ where: { revisionId: rev1.id, type: 'paragraph' }, orderBy: { ordinal: 'asc' } });
      const original = victim.content;
      await prisma.studioDocBlock.update({ where: { id: victim.id }, data: { content: { ...(original as Any), text: `${String((original as Any).text ?? '')} [BASI]` } } });
      expect((await structure.verifyReconstruction(rev1.id)).matches).toBe(false);
      const a = runRepoScript('prisma/backfill-studio-structure.ts', ['--rewrite-v1-rows'], '22_backfill_rewrite_builtupon.log');
      const da = lastLine(a, 'backfill selesai');
      expect(a.code).toBe(1); // verifikasi menandai baris basi yang tidak boleh ditulis ulang
      expect(da.context.rewrites.find((x: string) => x.startsWith(`${L1.docNumber}#1:`))).toMatch(/:skipped-built-upon/);
      expect(da.context.snapshots.changed).toBe(0);
      const still = await prisma.studioDocBlock.findUniqueOrThrow({ where: { id: victim.id }, select: { content: true } });
      expect(String((still.content as Any).text)).toContain('[BASI]');
      await prisma.studioDocBlock.update({ where: { id: victim.id }, data: { content: original } });
      expect((await structure.verifyReconstruction(rev1.id)).matches).toBe(true);
      E.steps.rewriteBuiltUpon = { exit: a.code, rewrites: da.context.rewrites };
    }, T);

    it('--rewrite-v1-rows: baris basi (disimulasikan) revisi tanpa penerus (003 rev 1) ditulis ulang dengan pid sama; jalan kedua 0 perubahan', async () => {
      const L1 = S.legacy.L2; // dokumen 003 (datum-gsp), satu revisi
      const rev1 = L1.revisions[0];
      const pidsBefore = (await prisma.studioDocBlock.findMany({ where: { revisionId: rev1.id }, orderBy: { ordinal: 'asc' }, select: { pid: true } })).map((b: Any) => b.pid);
      const identBefore = await prisma.studioDocIdentity.count({ where: { documentId: L1.documentId } });
      // Simulasi baris turunan basi (pola D-228: baris dari adaptor lama berbeda dari adaptor kini).
      const victim = await prisma.studioDocBlock.findFirst({ where: { revisionId: rev1.id, type: 'paragraph' }, orderBy: { ordinal: 'asc' } });
      const stale = { ...(victim.content as Any), text: `${String((victim.content as Any).text ?? '')} [BASI]` };
      await prisma.studioDocBlock.update({ where: { id: victim.id }, data: { content: stale } });
      const broken = await structure.verifyReconstruction(rev1.id);
      expect(broken.matches).toBe(false);

      const a = runRepoScript('prisma/backfill-studio-structure.ts', ['--rewrite-v1-rows'], '23_backfill_rewrite1.log');
      expect(a.code, a.logFile).toBe(0);
      const da = lastLine(a, 'backfill selesai');
      expect(da.context.failed).toBe(0);
      expect(da.context.snapshots.changed).toBe(0);
      const rewrites: string[] = da.context.rewrites;
      expect(rewrites.find((x) => x.startsWith(`${L1.docNumber}#1:`))).toMatch(/:rewritten/);
      expect(rewrites.filter((x) => !x.startsWith(`${L1.docNumber}#1:`)).every((x) => !/:(rewritten|failed)/.test(x))).toBe(true);
      const pidsAfter = (await prisma.studioDocBlock.findMany({ where: { revisionId: rev1.id }, orderBy: { ordinal: 'asc' }, select: { pid: true } })).map((b: Any) => b.pid);
      expect(pidsAfter).toEqual(pidsBefore);
      expect(await prisma.studioDocIdentity.count({ where: { documentId: L1.documentId } })).toBe(identBefore);
      const fixed = await structure.verifyReconstruction(rev1.id);
      expect(fixed.matches).toBe(true);

      const countsBefore2 = await structureCounts();
      const b = runRepoScript('prisma/backfill-studio-structure.ts', ['--rewrite-v1-rows'], '24_backfill_rewrite2.log');
      expect(b.code, b.logFile).toBe(0);
      const db2 = lastLine(b, 'backfill selesai');
      expect(db2.context.failed).toBe(0);
      expect(db2.context.rewrites.every((x: string) => !/:(rewritten|failed)/.test(x))).toBe(true);
      expect(db2.context.rewrites.find((x: string) => x.startsWith(`${L1.docNumber}#1:`))).toMatch(/:unchanged/);
      expect(await structureCounts()).toEqual(countsBefore2);
      E.steps.rewriteV1Rows = { run1: rewrites, run2: db2.context.rewrites, pidOrderPreserved: true, pidCount: pidsAfter.length };
    }, T);
  });

  // ── F4 / F5 ───────────────────────────────────────────────────────────
  describe.sequential('F4 rekonstruksi revisi lama + F5 render ulang identik', () => {
    it('sha256 rekonstruksi dari M14-M18 = snapshotSha256 untuk setiap revisi norm/v1', async () => {
      const rows: Any[] = [];
      for (const key of ['L1', 'L2', 'L3']) {
        for (const rev of S.legacy[key].revisions) {
          const r = await reconstruct(rev.id);
          rows.push({ doc: S.legacy[key].docNumber, ...r });
          expect(r.schema).toBe('studio.norm/v1');
          expect(r.actual).toBe(rev.snapshotSha256);
          expect(r.matches).toBe(true);
          expect(r.rebuildOk).toBe(true);
        }
      }
      E.steps.reconstructLegacy = rows;
    }, T);

    it('render ulang revisi lama sesudah preset+backfill: DOCX/HTML byte-identik, PDF identik setelah normalisasi metadata', async () => {
      const cmp: Any[] = [];
      for (const key of ['L1', 'L2', 'L3']) {
        for (const rev of S.legacy[key].revisions) {
          const base = S.baseline[rev.id];
          const now = await renderShas(rev.id, ['DOCX', 'HTML', 'PDF']);
          expect(now.status).toBe('SUCCEEDED');
          cmp.push({
            doc: S.legacy[key].docNumber,
            revisionNo: rev.revisionNo,
            docx: now.sha.DOCX === base.sha.DOCX,
            html: now.sha.HTML === base.sha.HTML,
            pdfRaw: now.sha.PDF === base.sha.PDF,
            pdfNormalized: now.pdfNorm === base.pdfNorm,
            sha: now.sha,
            releaseStatus: { before: base.releaseStatus, after: now.releaseStatus },
          });
          expect(now.sha.DOCX, `${key}#${rev.revisionNo} DOCX`).toBe(base.sha.DOCX);
          expect(now.sha.HTML, `${key}#${rev.revisionNo} HTML`).toBe(base.sha.HTML);
          expect(now.pdfNorm, `${key}#${rev.revisionNo} PDF`).toBe(base.pdfNorm);
          expect(now.releaseStatus).toBe(base.releaseStatus);
        }
      }
      E.steps.rerenderLegacy = cmp;
    }, T);
  });

  // ── F6 ────────────────────────────────────────────────────────────────
  describe.sequential('F6 ingest v1 lewat adaptor + v2 bertarget (dokumen 000)', () => {
    it('v1 lewat adaptor (route R04, agen) -> studio.norm/v2 + baris struktur, rekonstruksi cocok', async () => {
      const doc = readJson('tests/parity/fixtures/doc/doc_nota_tables.json');
      doc.template = { slug: 'datum-gsp' };
      const r = await postJson(routes.documents, 'POST', '/api/studio/documents', { agentId: 'sr49-agen', document: doc });
      expect([200, 201], JSON.stringify(r.body).slice(0, 600)).toContain(r.status);
      const docId = r.body.document?.id;
      expect(docId).toBeTruthy();
      const rev = await prisma.studioRevision.findFirstOrThrow({ where: { documentId: docId }, orderBy: { revisionNo: 'desc' } });
      expect((rev.snapshot as Any).schema).toBe('studio.norm/v2');
      expect(await prisma.studioDocSection.count({ where: { revisionId: rev.id } })).toBeGreaterThan(0);
      const rc = await reconstruct(rev.id);
      expect(rc.matches).toBe(true);
      expect(rc.recomposed).toBe(true);
      S.adapted = { documentId: docId, docNumber: r.body.document.docNumber, revisionId: rev.id };
      E.steps.adaptedV1 = { status: r.status, docNumber: r.body.document.docNumber, schema: (rev.snapshot as Any).schema, schemaId: rev.schemaId, reconstruct: rc };
    }, T);

    it('dokumen 000: R14 templateVersion -> setMeta -> R04 doc.v2 bertarget (201) -> kirim ulang unchanged', async () => {
      const L3 = S.legacy.L3;
      const t = await prisma.studioTemplate.findUniqueOrThrow({ where: { slug: 'datum-manual-000' } });
      const a = await revisionsV2.patchStructure(ADMIN, L3.documentId, { op: 'templateVersion', versionNo: t.latestVersionNo, baseRevisionNo: 1, change: CHANGE });
      expect(a.revision.revisionNo).toBe(2);
      const v2doc = readJson('benchmark/manual000/doc.v2.json');
      delete v2doc.render;
      // IP-66: kiriman bertarget menolak META_CONFLICT bila meta dokumen null; bila terjadi, R14
      // setMeta lebih dulu (alur SR-38/D-238). Di DB uji `subject` dapat sudah terisi dari doc.json v1.
      let conflict: Any = null;
      let c: Any;
      try {
        c = await submit.submitDocumentV2(ADMIN, v2doc, { target: { documentId: L3.documentId }, baseRevisionNo: 2 });
      } catch (e) {
        conflict = { code: (e as Any).code, message: String((e as Any).message).slice(0, 200) };
      }
      let setMetaRev: number | null = null;
      if (conflict) {
        expect(conflict.code).toBe('META_CONFLICT');
        const b = await revisionsV2.patchStructure(ADMIN, L3.documentId, { op: 'setMeta', meta: { subject: v2doc.meta.subject }, baseRevisionNo: 2, change: CHANGE });
        setMetaRev = b.revision.revisionNo;
        c = await submit.submitDocumentV2(ADMIN, v2doc, { target: { documentId: L3.documentId }, baseRevisionNo: setMetaRev });
      }
      const contentRev = setMetaRev ? setMetaRev + 1 : 3;
      expect(c.created).toBe(false);
      expect(c.unchanged).toBe(false);
      expect(c.revision.revisionNo).toBe(contentRev);
      expect(c.revision.changeScope.startsWith('document')).toBe(true);
      expect(c.completeness.status).toBe('COMPLETE');
      const d = await submit.submitDocumentV2(ADMIN, v2doc, { target: { documentId: L3.documentId }, baseRevisionNo: contentRev });
      expect(d.unchanged).toBe(true);
      expect(d.revision.revisionNo).toBe(contentRev);
      // R14 setMeta tanpa perubahan ditolak (bukan revisi kosong).
      let noChange: Any = null;
      try {
        await revisionsV2.patchStructure(ADMIN, L3.documentId, { op: 'setMeta', meta: { subject: v2doc.meta.subject }, baseRevisionNo: contentRev, change: CHANGE });
      } catch (e) {
        noChange = { code: (e as Any).code, message: String((e as Any).message).slice(0, 120) };
      }
      expect(noChange).not.toBeNull();
      const imgs = await prisma.studioDocBlock.findMany({ where: { revision: { documentId: L3.documentId, revisionNo: contentRev }, type: 'image' }, select: { assetId: true } });
      E.steps.doc000 = {
        templateVersion: { revisionNo: a.revision.revisionNo, versionNo: t.latestVersionNo },
        metaConflictAtBase2: conflict,
        setMetaRevision: setMetaRev,
        setMetaNoChange: noChange,
        targeted: { revisionNo: c.revision.revisionNo, changeScope: c.revision.changeScope, completeness: c.completeness.status },
        resend: { unchanged: d.unchanged, revisionNo: d.revision.revisionNo },
        images: { total: imgs.length, linked: imgs.filter((x: Any) => x.assetId).length },
      };
      expect(imgs.length).toBeGreaterThan(0);
      expect(imgs.every((x: Any) => x.assetId)).toBe(true);
      S.doc000 = { documentId: L3.documentId, contentRev, templateVersionRev: a.revision.revisionNo };
    }, T);
    it('rekonstruksi revisi R14 templateVersion di atas basis backfill norm/v1 = snapshotSha256', async () => {
      const id = S.doc000.documentId;
      const rev = await prisma.studioRevision.findUniqueOrThrow({ where: { documentId_revisionNo: { documentId: id, revisionNo: S.doc000.templateVersionRev } } });
      const rep = await structure.verifyReconstruction(rev.id);
      const stored = (rev.snapshot as Any).blocks.find((b: Any) => b.address === 'F:cover');
      const rebuilt = (rep.snapshot as Any).blocks.find((b: Any) => b.address === 'F:cover');
      const rowPid = (await prisma.studioDocBlock.findFirst({ where: { revisionId: rev.id, address: 'F:cover' }, select: { pid: true } }))?.pid ?? null;
      E.steps.r14OnBackfilled = {
        revisionNo: rev.revisionNo,
        changeScope: rev.changeScope,
        expected: rep.expectedSha256,
        actual: rep.actualSha256,
        matches: rep.matches,
        coverPid: { storedSnapshot: stored?.pid ?? null, rowM17: rowPid, recomposed: rebuilt?.pid ?? null },
      };
      expect(rep.actualSha256).toBe(rev.snapshotSha256);
    }, T);
  });

  // ── F7 ────────────────────────────────────────────────────────────────
  describe.sequential('F7 kiriman parsial + render lingkup', () => {
    const mission = { folder: '2026-10-23_sr49_uji' };
    const docKey = 'laporan-uji';
    const chapter = (key: string, title: string, extraParagraph?: string) => ({
      key,
      title: { text: title },
      sections: [
        {
          title: { text: 'Metode Penilaian' },
          blocks: [
            { type: 'paragraph', text: 'Penilaian memakai skor kondisi 1 sampai 5 per peralatan.' },
            { type: 'paragraph', text: extraParagraph ?? 'Skor diberikan dari inspeksi visual dan uji tahanan isolasi.' },
          ],
        },
        {
          title: { text: 'Kondisi Pemutus Tenaga' },
          blocks: [
            { type: 'paragraph', text: 'Tiga pemutus tenaga diperiksa pada 2026-10-20.' },
            { type: 'paragraph', text: 'PMT-2 menunjukkan korosi pada terminal sisi beban.' },
            { type: 'image', asset: 'foto-uji', caption: { text: 'Korosi pada terminal PMT-2.' }, source: { text: 'Foto lapangan 2026-10-20', provenance: ['TERUKUR'] } },
            { type: 'paragraph', text: 'Korosi ini menurunkan tahanan kontak dan perlu pembersihan.' },
          ],
        },
        {
          title: { text: 'Ringkasan Skor' },
          blocks: [
            { type: 'paragraph', text: 'Tabel berikut merangkum skor kondisi.' },
            {
              type: 'table',
              caption: { text: 'Skor kondisi pemutus tenaga.' },
              columns: [{ role: 'id' }, { role: 'numeral' }],
              rows: [
                { kind: 'header', cells: [{ text: 'Unit' }, { text: 'Skor' }] },
                { cells: [{ text: 'PMT-1' }, { text: '4' }] },
                { cells: [{ text: 'PMT-2' }, { text: '2' }] },
              ],
              source: { text: 'Inspeksi 2026-10-20', provenance: ['TERUKUR'] },
            },
          ],
        },
      ],
    });

    it('E0 dokumen kosong berkerangka (R04 v2, agen) -> 201 rev 1 INCOMPLETE', async () => {
      const a = await prisma.studioAsset.findFirstOrThrow({ orderBy: { createdAt: 'asc' } });
      S.assetRef = `sha256:${a.sha256}`;
      const r = await postJson(routes.documents, 'POST', '/api/studio/documents', {
        $schema: 'studio.doc/v2',
        agentId: 'sr49-controller',
        template: { slug: 'datum-gsp' },
        mission,
        docKey,
        meta: { title: 'Laporan Uji Integrasi Gardu Induk' },
      });
      expect(r.status, JSON.stringify(r.body).slice(0, 600)).toBe(201);
      expect(r.body.created).toBe(true);
      expect(r.body.revision.revisionNo).toBe(1);
      expect(r.body.completeness.status).toBe('INCOMPLETE');
      S.p = { documentId: r.body.document.id, docNumber: r.body.document.docNumber, log: [{ step: 'E0', status: r.status, rev: 1, scope: r.body.revision.changeScope, completeness: 'INCOMPLETE' }] };
    }, T);

    it('bab 3 (R12): 201, scope chapter:3, Gambar 3.1 di 3.2.3, Tabel 3.1 di 3.3.2; kirim ulang identik 200 unchanged', async () => {
      const body = { $schema: 'studio.chapter/v2', agentId: 'sr49-analis', target: { mission, docKey }, chapter: chapter('3', 'Analisis Kondisi Peralatan'), assets: { 'foto-uji': { assetRef: S.assetRef } } };
      const r = await postJson(routes.chapters, 'POST', '/api/studio/chapters', body);
      expect(r.status, JSON.stringify(r.body).slice(0, 800)).toBe(201);
      expect(r.body.revision.revisionNo).toBe(2);
      expect(r.body.revision.changeScope).toBe('chapter:3');
      const img = r.body.chapter.blocks.find((b: Any) => b.type === 'image');
      const tbl = r.body.chapter.blocks.find((b: Any) => b.type === 'table');
      expect(img).toMatchObject({ address: '3.2.3', artifactLabel: 'Gambar 3.1' });
      expect(tbl).toMatchObject({ address: '3.3.2', artifactLabel: 'Tabel 3.1' });
      S.p.ch3 = r.body.chapter;
      const again = await postJson(routes.chapters, 'POST', '/api/studio/chapters', body);
      expect(again.status).toBe(200);
      expect(again.body.unchanged).toBe(true);
      expect(again.body.revision.revisionNo).toBe(2);
      // D-247: build hanya lewat endpoint render; medan `render` di badan kiriman ditolak, 0 revisi/job baru.
      const jobsBefore = await prisma.studioRenderJob.count();
      const withRender = await postJson(routes.chapters, 'POST', '/api/studio/chapters', { ...body, render: { scope: 'chapter', formats: ['docx'] } });
      expect(withRender.status).toBe(400);
      expect(JSON.stringify(withRender.body)).toContain('RENDER_FIELD');
      expect(await prisma.studioRenderJob.count()).toBe(jobsBefore);
      expect((await prisma.studioDocument.findUniqueOrThrow({ where: { id: S.p.documentId } })).currentRevisionNo).toBe(2);
      S.p.log.push(
        { step: 'chapter 3', status: r.status, rev: 2, scope: r.body.revision.changeScope, labels: [img, tbl] },
        { step: 'chapter 3 resend', status: again.status, unchanged: true, rev: 2 },
        { step: 'chapter 3 with render field (D-247)', status: withRender.status, code: 'RENDER_FIELD' },
      );
    }, T);

    it('render bab 3 draf (R17 scope chapter) = 200 draft; render penuh = 409 DOCUMENT_INCOMPLETE', async () => {
      const id = S.p.documentId;
      const c = await postJson(routes.render, 'POST', `/api/studio/documents/${id}/render`, { scope: 'chapter', key: '3', formats: ['docx', 'html'] }, { id });
      expect(c.status, JSON.stringify(c.body).slice(0, 800)).toBe(200);
      expect(c.body.job.draft).toBe(true);
      expect(c.body.job.scope).toEqual({ kind: 'CHAPTER', key: '3' });
      expect(c.body.job.status).toBe('SUCCEEDED');
      expect(c.body.outputs.length).toBeGreaterThan(0);
      expect(c.body.outputs.every((o: Any) => o.draft === true)).toBe(true);
      const d = await postJson(routes.render, 'POST', `/api/studio/documents/${id}/render`, { scope: 'document', formats: ['docx'] }, { id });
      expect(d.status).toBe(409);
      expect(JSON.stringify(d.body)).toContain('DOCUMENT_INCOMPLETE');
      S.p.log.push({ step: 'render chapter 3 draft', status: c.status, job: c.body.job.status, files: c.body.outputs.map((o: Any) => o.fileName) }, { step: 'render document INCOMPLETE', status: d.status });
    }, T);

    it('slot controlSheet + signature (R13), render slot draf, bab 1 dan 2 -> COMPLETE', async () => {
      const id = S.p.documentId;
      const cs = await postJson(routes.slots, 'POST', '/api/studio/slots', {
        $schema: 'studio.slot/v2',
        agentId: 'sr49-analis',
        target: { documentId: id },
        slot: 'controlSheet',
        payload: {
          type: 'controlSheet',
          revisionHistory: [{ rev: 'A', date: '2026-10-23', what: 'Terbit pertama', by: 'Tim Uji' }],
          verificationChain: [
            { layer: '1', role: 'Penyusun', name: 'A. Pratama' },
            { layer: '2', role: 'Pemeriksa', name: 'B. Santoso' },
          ],
          methodStatement: { text: 'Pengukuran langsung di lapangan; metode rinci di Bab 3.' },
          distribution: [{ copy: '1', holder: 'Manajer Proyek' }],
        },
      });
      expect(cs.status, JSON.stringify(cs.body).slice(0, 800)).toBe(201);
      expect(cs.body.revision.changeScope).toBe('slot:controlSheet');
      expect(cs.body.slot.address).toBe('F:controlSheet');
      const sg = await postJson(routes.slots, 'POST', '/api/studio/slots', {
        $schema: 'studio.slot/v2',
        agentId: 'sr49-analis',
        target: { documentId: id },
        slot: 'signature',
        payload: {
          type: 'signatureBlock',
          roles: [
            { role: { text: 'Disusun' }, holder: { text: 'A. Pratama' }, date: { text: '2026-10-23' } },
            { role: { text: 'Diperiksa' }, holder: { text: 'B. Santoso' } },
            { role: { text: 'Disetujui' }, holder: { text: 'C. Wijaya' } },
          ],
        },
      });
      expect(sg.status, JSON.stringify(sg.body).slice(0, 800)).toBe(201);
      const sr = await postJson(routes.render, 'POST', `/api/studio/documents/${id}/render`, { scope: 'slot', key: 'controlSheet', formats: ['docx'] }, { id });
      expect(sr.status, JSON.stringify(sr.body).slice(0, 600)).toBe(200);
      expect(sr.body.job.draft).toBe(true);
      expect(sr.body.job.scope).toEqual({ kind: 'SLOT', key: 'controlSheet' });
      expect(sr.body.job.status).toBe('SUCCEEDED');
      const c1 = await postJson(routes.chapters, 'POST', '/api/studio/chapters', { $schema: 'studio.chapter/v2', agentId: 'sr49-analis-1', target: { documentId: id }, chapter: chapter('1', 'Pendahuluan Kajian'), assets: { 'foto-uji': { assetRef: S.assetRef } } });
      expect(c1.status, JSON.stringify(c1.body).slice(0, 800)).toBe(201);
      const c2 = await postJson(routes.chapters, 'POST', '/api/studio/chapters', { $schema: 'studio.chapter/v2', agentId: 'sr49-analis-2', target: { documentId: id }, chapter: chapter('2', 'Data Lapangan'), assets: { 'foto-uji': { assetRef: S.assetRef } } });
      expect(c2.status, JSON.stringify(c2.body).slice(0, 800)).toBe(201);
      expect(c2.body.completeness.status).toBe('COMPLETE');
      S.p.completeRev = c2.body.revision.revisionNo;
      S.p.log.push(
        { step: 'slot controlSheet', status: cs.status, rev: cs.body.revision.revisionNo, scope: cs.body.revision.changeScope },
        { step: 'slot signature', status: sg.status, rev: sg.body.revision.revisionNo, scope: sg.body.revision.changeScope },
        { step: 'render slot draft', status: sr.status, job: sr.body.job.status },
        { step: 'chapter 1', status: c1.status, rev: c1.body.revision.revisionNo, scope: c1.body.revision.changeScope },
        { step: 'chapter 2', status: c2.status, rev: c2.body.revision.revisionNo, completeness: c2.body.completeness.status },
      );
    }, T);

    it('render penuh revisi COMPLETE (R17 document) -> SUCCEEDED; dicatat untuk render ulang', async () => {
      const id = S.p.documentId;
      const rev = await prisma.studioRevision.findUniqueOrThrow({ where: { documentId_revisionNo: { documentId: id, revisionNo: S.p.completeRev } } });
      const r = await renderShas(rev.id, ['DOCX', 'HTML', 'PDF']);
      expect(r.status, r.errors.join('; ')).toBe('SUCCEEDED');
      expect(r.diskEqualsDb).toBe(true);
      S.p.fullRender = { revisionId: rev.id, ...r };
      const viaRoute = await postJson(routes.render, 'POST', `/api/studio/documents/${id}/render`, { scope: 'document', formats: ['docx'] }, { id });
      expect(viaRoute.status, JSON.stringify(viaRoute.body).slice(0, 600)).toBe(200);
      expect(viaRoute.body.job.draft).toBe(false);
      S.p.log.push({ step: 'render document COMPLETE', job: r.status, releaseStatus: r.releaseStatus, sha: r.sha }, { step: 'render document via R17', status: viaRoute.status, draft: viaRoute.body.job.draft });
    }, T);

    it('pembaruan bab 3 (n+1): changedAddresses hanya 3.x; pid bab lain tetap; baseRevisionNo basi bab sama -> 409 SCOPE_CONFLICT; bab lain -> rebased', async () => {
      const id = S.p.documentId;
      const base = S.p.completeRev;
      const pidsOther = async (revNo: number) =>
        (
          await prisma.studioDocBlock.findMany({
            where: { revision: { documentId: id, revisionNo: revNo }, address: { not: null } },
            select: { pid: true, address: true, contentSha256: true },
            orderBy: { ordinal: 'asc' },
          })
        ).filter((b: Any) => !String(b.address).startsWith('3.'));
      const before = await pidsOther(base);
      const up = await postJson(routes.chapters, 'POST', '/api/studio/chapters', {
        $schema: 'studio.chapter/v2',
        agentId: 'sr49-analis',
        target: { documentId: id },
        chapter: chapter('3', 'Analisis Kondisi Peralatan', 'Skor diberikan dari inspeksi visual, termografi, dan uji tahanan isolasi.'),
        assets: { 'foto-uji': { assetRef: S.assetRef } },
        baseRevisionNo: base,
      });
      expect(up.status, JSON.stringify(up.body).slice(0, 800)).toBe(201);
      expect(up.body.revision.revisionNo).toBe(base + 1);
      expect(up.body.revision.changeScope).toBe('chapter:3');
      const rev = await prisma.studioRevision.findUniqueOrThrow({ where: { documentId_revisionNo: { documentId: id, revisionNo: base + 1 } } });
      expect(rev.changedAddresses.length).toBeGreaterThan(0);
      expect(rev.changedAddresses.every((a: string) => a.startsWith('3.'))).toBe(true);
      expect(await pidsOther(base + 1)).toEqual(before);
      const pid312 = S.p.ch3.blocks.find((b: Any) => b.address === '3.1.2').pid;
      const now312 = await prisma.studioDocBlock.findFirst({ where: { revisionId: rev.id, address: '3.1.2' }, select: { pid: true } });
      expect(now312.pid).toBe(pid312); // posisi sama -> pid diwarisi

      const stale = await postJson(routes.chapters, 'POST', '/api/studio/chapters', {
        $schema: 'studio.chapter/v2',
        agentId: 'sr49-analis',
        target: { documentId: id },
        chapter: chapter('3', 'Analisis Kondisi Peralatan', 'Kalimat lain dari agen yang memakai revisi dasar basi untuk bab yang sama.'),
        assets: { 'foto-uji': { assetRef: S.assetRef } },
        baseRevisionNo: base,
      });
      expect(stale.status).toBe(409);
      expect(JSON.stringify(stale.body)).toContain('SCOPE_CONFLICT');
      const rb = await postJson(routes.chapters, 'POST', '/api/studio/chapters', {
        $schema: 'studio.chapter/v2',
        agentId: 'sr49-analis-1',
        target: { documentId: id },
        chapter: chapter('1', 'Pendahuluan Kajian', 'Skor diberikan dari inspeksi visual dan pengukuran tahanan pentanahan.'),
        assets: { 'foto-uji': { assetRef: S.assetRef } },
        baseRevisionNo: base,
      });
      expect(rb.status, JSON.stringify(rb.body).slice(0, 800)).toBe(201);
      expect(rb.body.rebased).toBe(true);
      expect(rb.body.revision.revisionNo).toBe(base + 2);
      S.p.log.push(
        { step: 'chapter 3 update', status: up.status, rev: base + 1, changedAddresses: rev.changedAddresses },
        { step: 'chapter 3 stale base', status: stale.status, code: 'SCOPE_CONFLICT' },
        { step: 'chapter 1 stale base other chapter', status: rb.status, rebased: rb.body.rebased, rev: base + 2 },
      );
      E.steps.partial = S.p.log;
    }, T);
  });

  // ── F8 ────────────────────────────────────────────────────────────────
  describe.sequential('F8 rekonstruksi semua revisi + render ulang revisi v2 lama', () => {
    it('setiap revisi di DB uji: sha256 rekonstruksi dari tabel = snapshotSha256', async () => {
      const revs = await prisma.studioRevision.findMany({ select: { id: true, revisionNo: true, snapshotSha256: true, document: { select: { docNumber: true } } }, orderBy: [{ documentId: 'asc' }, { revisionNo: 'asc' }] });
      const rows: Any[] = [];
      for (const r of revs) {
        const x = await reconstruct(r.id);
        rows.push({ doc: r.document.docNumber, rev: r.revisionNo, schema: x.schema, sha: x.actual.slice(0, 12), matches: x.matches && x.actual === r.snapshotSha256 && x.rebuildOk });
      }
      E.steps.reconstructAll = { total: rows.length, matched: rows.filter((r) => r.matches).length, rows };
      expect(rows.length).toBeGreaterThanOrEqual(14);
      expect(rows.filter((r) => !r.matches)).toEqual([]);
    }, T);

    it('render ulang revisi v2 COMPLETE lama (sesudah 2 revisi baru) identik', async () => {
      const f = S.p.fullRender;
      const now = await renderShas(f.revisionId, ['DOCX', 'HTML', 'PDF']);
      E.steps.rerenderV2 = { docx: now.sha.DOCX === f.sha.DOCX, html: now.sha.HTML === f.sha.HTML, pdfRaw: now.sha.PDF === f.sha.PDF, pdfNormalized: now.pdfNorm === f.pdfNorm, sha: now.sha };
      expect(now.sha.DOCX).toBe(f.sha.DOCX);
      expect(now.sha.HTML).toBe(f.sha.HTML);
      expect(now.pdfNorm).toBe(f.pdfNorm);
    }, T);
  });

  // ── F9 ────────────────────────────────────────────────────────────────
  describe.sequential('F9 F-062 karakterisasi releaseStatus dokumen 000', () => {
    it('render rev 4 dokumen 000: job SUCCEEDED; cek FAIL dikutip (aturan tidak dilonggarkan)', async () => {
      const id = S.doc000.documentId;
      const rev = await prisma.studioRevision.findUniqueOrThrow({ where: { documentId_revisionNo: { documentId: id, revisionNo: S.doc000.contentRev } } });
      const r = await render.renderRevision(rev.id, ['DOCX', 'HTML', 'PDF'], ADMIN);
      expect(r.job.status).toBe('SUCCEEDED');
      const lint = r.lint;
      const checks: Any[] = lint?.checks ?? [];
      const fails = checks.filter((c) => c.status === 'FAIL');
      const group = new Map<string, { n: number; sample: Any[] }>();
      for (const c of fails) {
        const g = group.get(c.checkId) ?? { n: 0, sample: [] };
        g.n++;
        if (g.sample.length < 3) g.sample.push({ address: c.address ?? null, pointer: c.pointer ?? null, detail: String(c.detail ?? c.message ?? '').slice(0, 220) });
        group.set(c.checkId, g);
      }
      const legacyRel = S.baseline[S.legacy.L3.revisions[0].id].releaseStatus;
      const legacyLint = (await prisma.studioRevision.findUniqueOrThrow({ where: { id: S.legacy.L3.revisions[0].id }, select: { lintReport: true } })).lintReport as Any;
      const legacyFails = ((legacyLint?.checks ?? []) as Any[]).filter((c) => c.status === 'FAIL');
      const legacyGroup: Record<string, number> = {};
      for (const c of legacyFails) legacyGroup[c.checkId] = (legacyGroup[c.checkId] ?? 0) + 1;
      E.steps.f062 = {
        contentRevision: { revisionNo: S.doc000.contentRev, job: r.job.status, releaseStatus: lint?.releaseStatus ?? null, tier: lint?.tier ?? null, failChecks: Object.fromEntries([...group].map(([k, v]) => [k, v])) },
        revision1Legacy: { releaseStatus: legacyRel, failChecks: legacyGroup },
        summary: lint?.summary ?? null,
      };
      // F-062 DITUTUP (D-263, D-269): FAIL tersisa = selisih isi acuan terhadap aturan DATUM yang
      // terjelaskan. Positif palsu presisi (DATUM-04/09/17, D05) tidak boleh muncul lagi; cek FAIL
      // di luar daftar terjelaskan = regresi/temuan baru.
      const EXPLAINED = ['C-27', 'C-34', 'C-SG-L2-04', 'D18', 'D20', 'DATUM-03', 'G3'];
      if (lint?.releaseStatus === 'FAIL') expect(fails.length).toBeGreaterThan(0);
      const unexplained = [...group.keys()].filter((k) => !EXPLAINED.includes(k));
      E.steps.f062.unexplained = unexplained;
      expect(unexplained).toEqual([]);
      // Revisi lama norm/v1 (isi sama, aturan sama) -> himpunan cek FAIL sama.
      expect(Object.keys(legacyGroup).sort()).toEqual([...group.keys()].sort());
    }, T);
  });
});

describe.skipIf(ACTIVE)('SR-49 integrasi DB Studio (skip)', () => {
  it('di-skip: jalankan lewat node tests/integration/studio/uji-run.mjs suite', () => {
    expect(ACTIVE).toBe(false);
  });
});
