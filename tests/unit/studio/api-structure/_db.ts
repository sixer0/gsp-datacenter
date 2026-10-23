/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// SR-45: pengaman DB nyata. Uji ini menulis fixture sementara ke `gsp_agent_hq_v21`
// (brief fase akhir butir 5) lalu membersihkannya sampai 0 sisa. Dokumen 000/001/002
// tidak disentuh: sidik (id, currentRevisionNo, updatedAt, jumlah revisi) dibandingkan
// sebelum/sesudah. Penanda fixture (per run, RUN_ID): missionFolder `2099-01-01_sr45-fx-<run>-*`,
// requester berisi RUN_ID, slug templat `sr45-fx-*-<run>`, sha aset yang dibangkitkan uji ini.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prisma } from '@/lib/prisma';
import { RUN_ID } from './_env';

export const EXPECTED_DB = 'gsp_agent_hq_v21';
export const FX_PREFIX = 'sr45-fx-';
/** Pola C misi: `YYYY-MM-DD_<slug>`; penanda fixture = `_sr45-fx-`. */
export const MISSION_MARK = '_sr45-fx-';
export const MISSION_PREFIX = `2099-01-01${MISSION_MARK}${RUN_ID}`;
export const PROTECTED_DOC_NUMBERS = ['000/GSP/STD/X/2026', '001/GSP/KT/X/2026', '002/GSP/STD/X/2026'];

const createdDocIds = new Set<string>();
const createdTemplateIds = new Set<string>();
const generatedShas = new Set<string>();

export function trackDoc(id: string | undefined | null): void {
  if (id) createdDocIds.add(id);
}
export function trackTemplate(id: string | undefined | null): void {
  if (id) createdTemplateIds.add(id);
}
export function trackSha(sha: string): void {
  generatedShas.add(sha.replace(/^sha256:/, ''));
}

let seq = 0;
/** Folder misi unik per kasus (penanda fixture). */
export function missionFolder(tag: string): string {
  seq += 1;
  return `${MISSION_PREFIX}-${tag}-${seq}`.toLowerCase().slice(0, 90);
}

export async function currentDb(): Promise<string> {
  const rows = await prisma.$queryRawUnsafe<Array<{ d: string }>>('select current_database() as d');
  return rows[0]?.d ?? '';
}

export async function assertTestDb(): Promise<void> {
  const d = await currentDb();
  if (d !== EXPECTED_DB) throw new Error(`SR-45 menolak berjalan: current_database() = ${d}, harus ${EXPECTED_DB}`);
}

export interface Fingerprint {
  docNumber: string;
  id: string;
  currentRevisionNo: number;
  updatedAt: string;
  revisions: number;
}

export async function protectedFingerprint(): Promise<Fingerprint[]> {
  const docs = await prisma.studioDocument.findMany({
    where: { docNumber: { in: PROTECTED_DOC_NUMBERS } },
    select: { id: true, docNumber: true, currentRevisionNo: true, updatedAt: true, _count: { select: { revisions: true } } },
    orderBy: { docNumber: 'asc' },
  });
  return docs.map((d) => ({
    docNumber: d.docNumber,
    id: d.id,
    currentRevisionNo: d.currentRevisionNo,
    updatedAt: d.updatedAt.toISOString(),
    revisions: d._count.revisions,
  }));
}

const COUNTED = [
  'studioDocument',
  'studioRevision',
  'studioBlock',
  'studioOutputFile',
  'studioRenderJob',
  'studioAsset',
  'studioDocSection',
  'studioDocChapter',
  'studioDocSubsection',
  'studioDocBlock',
  'studioDocIdentity',
  'studioTemplate',
  'studioTemplateVersion',
  'studioTemplateSlot',
] as const;

export async function tableCounts(): Promise<Record<string, number>> {
  const p = prisma as any;
  const out: Record<string, number> = {};
  for (const n of COUNTED) out[n] = await p[n].count();
  return out;
}

function docWhere() {
  return { OR: [{ missionFolder: { contains: `${MISSION_MARK}${RUN_ID}` } }, { createdBy: { contains: RUN_ID } }, { id: { in: [...createdDocIds] } }] };
}
function assetWhere() {
  return { OR: [{ sha256: { in: [...generatedShas] } }, { createdBy: { contains: RUN_ID } }] };
}
function templateWhere() {
  return { OR: [{ slug: { startsWith: FX_PREFIX, contains: RUN_ID } }, { id: { in: [...createdTemplateIds] } }] };
}

/** Sisa fixture milik run SR-45 ini (RUN_ID). */
export async function fixtureResidue(): Promise<Record<string, number>> {
  return {
    docs: await prisma.studioDocument.count({ where: docWhere() }),
    assets: await prisma.studioAsset.count({ where: assetWhere() }),
    templates: await prisma.studioTemplate.count({ where: templateWhere() }),
    jobs: await prisma.studioRenderJob.count({ where: { requestedBy: { contains: RUN_ID } } }),
  };
}

/** Hapus semua fixture SR-45 (dokumen -> revisi/identitas/keluaran/job via cascade; aset; templat). */
export async function cleanupFixtures(): Promise<void> {
  const docs = await prisma.studioDocument.findMany({ where: docWhere(), select: { id: true, docNumber: true } });
  for (const d of docs) {
    if (PROTECTED_DOC_NUMBERS.includes(d.docNumber)) throw new Error(`pembersihan menolak menghapus dokumen terlindung ${d.docNumber}`);
  }
  const ids = docs.map((d) => d.id);
  if (ids.length) {
    await prisma.studioOutputFile.deleteMany({ where: { documentId: { in: ids } } });
    await prisma.studioRenderJob.deleteMany({ where: { documentId: { in: ids } } });
    for (const id of ids) await prisma.studioDocument.delete({ where: { id } });
  }
  await prisma.studioRenderJob.deleteMany({ where: { requestedBy: { contains: RUN_ID }, documentId: null } });
  await prisma.studioAsset.deleteMany({ where: assetWhere() });
  const tpls = await prisma.studioTemplate.findMany({ where: templateWhere(), select: { id: true, slug: true } });
  for (const t of tpls) {
    if (!t.slug.startsWith(FX_PREFIX)) throw new Error(`pembersihan menolak menghapus templat bukan fixture ${t.slug}`);
    const versions = await prisma.studioTemplateVersion.findMany({ where: { templateId: t.id }, orderBy: { versionNo: 'desc' }, select: { id: true } });
    for (const v of versions) await prisma.studioTemplateVersion.delete({ where: { id: v.id } });
    await prisma.studioTemplate.delete({ where: { id: t.id } });
  }
}

/** Catat bukti DB per berkas uji (dibaca laporan); tulis atomik. */
export function writeEvidence(file: string, data: unknown): void {
  const dir = path.join(os.tmpdir(), 'sr45-evidence');
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, `${file}.json`);
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, target);
}

/** Kait bersama: verifikasi DB + sidik sebelum; bersihkan + bandingkan sesudah. */
export function dbGuard(file: string) {
  let before: Fingerprint[] = [];
  let countsBefore: Record<string, number> = {};
  return {
    async setup(): Promise<void> {
      await assertTestDb();
      before = await protectedFingerprint();
      countsBefore = await tableCounts();
    },
    async teardown() {
      await cleanupFixtures();
      const after = await protectedFingerprint();
      const countsAfter = await tableCounts();
      const residue = await fixtureResidue();
      writeEvidence(file, { db: await currentDb(), before, after, countsBefore, countsAfter, residue });
      return { before, after, residue, countsBefore, countsAfter };
    },
  };
}
