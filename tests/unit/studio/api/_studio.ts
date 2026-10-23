// S74: fixture bersama uji route/layanan Studio (tanpa DB nyata).
// - Identitas: cookie gsp_hq_session (HMAC persis hq-session.createSessionToken),
//   JWT NextAuth asli (`encode` next-auth/jwt, cookie next-auth.session-token),
//   header x-internal-secret.
// - Templat: baris StudioTemplate/StudioTemplateVersion dibangun dengan
//   `composeVersion` layanan S49 (parameter efektif + sha256 nyata), lalu
//   dipasang ke Prisma tiruan.
// - Dokumen: bentuk minimal `studio.doc/v1` dari docs/STUDIO-AGENT-GUIDE.md §3.
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';
import { TEST_INTERNAL_SECRET, TEST_NEXTAUTH_SECRET } from './_env';
import { on } from './_prisma';
import { canonicalSectionPlan, composeVersion, setTemplatesLogSink, type ParamRecord } from '@/lib/studio/services/templates';
import { setIngestLogSink } from '@/lib/studio/services/ingest';
import { setRevisionLogSink } from '@/lib/studio/services/revisions';

export const BASE_URL = 'https://127.0.0.1:9011';

// ── Identitas ───────────────────────────────────────────────────────────

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function hqCookie(opts: { u?: string; r?: string; expOffsetSec?: number; secret?: string } = {}): string {
  const payload = b64url(
    Buffer.from(
      JSON.stringify({
        u: opts.u ?? 'tester',
        r: opts.r ?? 'ADMINISTRATOR',
        p: 'gsp-test',
        exp: Math.floor(Date.now() / 1000) + (opts.expOffsetSec ?? 3600),
      }),
    ),
  );
  const sig = b64url(crypto.createHmac('sha256', opts.secret ?? TEST_NEXTAUTH_SECRET).update(payload).digest());
  return `gsp_hq_session=${payload}.${sig}`;
}

export async function nextAuthCookie(claims: Record<string, unknown> = { email: 'agen@gsp.test', sub: 'g-1' }, secret = TEST_NEXTAUTH_SECRET): Promise<string> {
  const token = await encode({ token: claims, secret });
  // Nama cookie mengikuti aturan getToken next-auth v4 (secureCookie = NEXTAUTH_URL https).
  const name = process.env.NEXTAUTH_URL?.startsWith('https://') ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
  return `${name}=${token}`;
}

export type AuthKind = 'none' | 'admin' | 'user' | 'google' | 'agent';

export interface ReqOpts {
  method?: string;
  auth?: AuthKind;
  /** Nama pengguna cookie HQ (admin/user). */
  user?: string;
  /** Objek -> JSON; string/Uint8Array/ReadableStream apa adanya. */
  body?: unknown;
  headers?: Record<string, string>;
}

export async function authHeaders(auth: AuthKind, user?: string): Promise<Record<string, string>> {
  switch (auth) {
    case 'admin':
      return { cookie: hqCookie({ u: user ?? 'admin1', r: 'ADMINISTRATOR' }) };
    case 'user':
      return { cookie: hqCookie({ u: user ?? 'user1', r: 'USER' }) };
    case 'google':
      return { cookie: await nextAuthCookie() };
    case 'agent':
      return { 'x-internal-secret': TEST_INTERNAL_SECRET };
    default:
      return {};
  }
}

export async function req(path: string, opts: ReqOpts = {}): Promise<NextRequest> {
  const headers: Record<string, string> = { ...(await authHeaders(opts.auth ?? 'none', opts.user)), ...(opts.headers ?? {}) };
  let body: BodyInit | undefined;
  const init: RequestInit & { duplex?: 'half' } = { method: opts.method ?? (opts.body === undefined ? 'GET' : 'POST'), headers };
  if (opts.body !== undefined) {
    if (typeof opts.body === 'string' || opts.body instanceof Uint8Array || opts.body instanceof ReadableStream) {
      body = opts.body as BodyInit;
    } else {
      body = JSON.stringify(opts.body);
      if (!Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) headers['content-type'] = 'application/json';
    }
    init.body = body;
    if (opts.body instanceof ReadableStream) init.duplex = 'half';
  }
  return new NextRequest(new URL(path, BASE_URL), init as ConstructorParameters<typeof NextRequest>[1]);
}

export function params<T extends Record<string, string>>(p: T): { params: Promise<T> } {
  return { params: Promise.resolve(p) };
}

export async function jsonOf(res: Response): Promise<any> {
  return res.json();
}

// ── Dokumen ─────────────────────────────────────────────────────────────

export interface DocOpts {
  tier?: 'NOTA' | 'TERBIT' | 'SERAH';
  slug?: string;
  version?: number;
  sectionTitle?: string;
  paragraph?: string;
  x?: Record<string, unknown>;
  overrides?: Record<string, unknown>;
  /**
   * SR-43: tanpa `front.controlSheet` (bentuk minimal panduan §3). Sejak D-131/SR-11
   * slot wajib `controlSheet` kosong -> revisi INCOMPLETE dan render penuh ditolak
   * (201 + renderRefused). Bawaan = dengan lembar kendali agar jalur render S74 tetap teruji.
   */
  minimal?: boolean;
}

export const OK_PARAGRAPH =
  'Beban puncak trafo A1 mencapai 640 kVA pada September 2026, setara 80 % kapasitas terpasang, sehingga trafo masih bekerja di bawah batas operasi 85 %.';

/** Judul berupa pertanyaan: DATUM-04 (penahan ingest tier TERBIT/SERAH). */
export const QUESTION_TITLE = 'Apa temuan utama kajian ini?';

export function studioDoc(o: DocOpts = {}): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    $schema: 'studio.doc/v1',
    template: { slug: o.slug ?? 'datum-kanonik', ...(o.version ? { version: o.version } : {}) },
    meta: {
      title: 'Kajian Beban Trafo Gedung A',
      rev: 'A',
      typeCode: 'KT',
      tier: o.tier ?? 'TERBIT',
      classification: 'TERBATAS',
      language: 'ID',
      author: 'Divisi Engineering PT GSP',
      issueDate: '2026-10-23',
    },
    chapters: [
      {
        title: { text: 'Ringkasan' },
        sections: [
          {
            title: { text: o.sectionTitle ?? 'Temuan utama kajian beban trafo' },
            blocks: [{ type: 'paragraph', text: o.paragraph ?? OK_PARAGRAPH }],
          },
        ],
      },
    ],
  };
  if (!o.minimal) doc.front = { controlSheet: { mode: 'auto', data: { title: { text: 'Lembar Kendali' } } } };
  if (o.x) doc.x = o.x;
  if (o.overrides) doc.overrides = o.overrides;
  return doc;
}

// ── Templat ─────────────────────────────────────────────────────────────

/** Profil yang melepas cek penolak DATUM-04 dan DATUM-19 (templat TERBATAS, D-98/D-102). */
export const RESTRICTING_OVERRIDES: ParamRecord = {
  'lint.enforcementOverride': { 'DATUM-04': 'release', 'DATUM-19': 'release' },
} as ParamRecord;

export interface TemplateFixture {
  template: Record<string, any>;
  versions: Record<string, any>[];
}

const T0 = new Date('2026-10-23T00:00:00.000Z');

export function makeTemplate(o: {
  id: string;
  slug: string;
  isCanonical?: boolean;
  /** overrides per versi (indeks 0 = versi 1). */
  versions?: ParamRecord[];
}): TemplateFixture {
  const layers = o.versions ?? [{}];
  const versions = layers.map((overrides, i) => {
    const p = composeVersion({ baseOverrides: {}, overrides, baseRoleFormats: {}, baseSectionPlan: canonicalSectionPlan(), assets: {} });
    return {
      id: `${o.id}-v${i + 1}`,
      templateId: o.id,
      versionNo: i + 1,
      baseVersionId: null,
      overrides: p.overrides,
      resolvedParams: p.resolvedParams,
      paramsSha256: p.paramsSha256,
      roleFormats: p.roleFormats,
      sectionPlan: p.sectionPlan,
      assets: p.assets,
      provenance: p.provenance,
      // SR-43: kolom v2 (SR-03/SR-06). Versi seed v1 = tanpa baris slot -> kerangka implisit (D-160).
      skeletonSha256: null,
      slots: [] as unknown[],
      changeNote: `versi ${i + 1}`,
      createdBy: 'seed',
      createdAt: T0,
    };
  });
  return {
    template: {
      id: o.id,
      slug: o.slug,
      name: o.slug,
      kind: 'DOCUMENT',
      description: null,
      isCanonical: o.isCanonical ?? false,
      // SR-43: kolom v2 (D-166 preset; SR-03). Fixture S74 bukan preset.
      isPreset: false,
      archived: false,
      latestVersionNo: versions.length,
      createdBy: 'seed',
      createdAt: T0,
      updatedAt: T0,
    },
    versions,
  };
}

export const canonicalTemplate = (): TemplateFixture => makeTemplate({ id: 'tpl-canon', slug: 'datum-kanonik', isCanonical: true });
export const restrictedTemplate = (): TemplateFixture =>
  makeTemplate({ id: 'tpl-restr', slug: 'datum-terbatas', versions: [RESTRICTING_OVERRIDES] });

/** Proyeksi `select` Prisma (termasuk relasi bersarang `rel: { select }`) atas baris fixture. */
function project(row: any, select: Record<string, any>, rel: Record<string, any> = {}): any {
  const out: Record<string, any> = {};
  for (const [k, sel] of Object.entries(select)) {
    if (sel === true) out[k] = row?.[k];
    else if (sel && typeof sel === 'object') {
      const target = k in rel ? rel[k] : row?.[k];
      if (Array.isArray(target)) out[k] = target;
      else out[k] = target && sel.select ? project(target, sel.select) : (target ?? null);
    }
  }
  return out;
}

/**
 * Pasang templat ke Prisma tiruan: findUnique/findFirst StudioTemplate (id/slug),
 * findUnique/findMany StudioTemplateVersion (id, templateId_versionNo; `include.template`).
 */
export function installTemplates(...fixtures: TemplateFixture[]): void {
  const templates = fixtures.map((f) => f.template);
  const versions = fixtures.flatMap((f) => f.versions);
  const byWhere = (w: any) =>
    templates.find((t) => (w?.id !== undefined && t.id === w.id) || (w?.slug !== undefined && t.slug === w.slug)) ?? null;
  on('studioTemplate', 'findUnique', async ({ where, select }: any) => {
    const t = byWhere(where);
    if (!t) return null;
    return select ? Object.fromEntries(Object.keys(select).map((k) => [k, t[k]])) : t;
  });
  on('studioTemplate', 'findFirst', async ({ where }: any) => {
    const ors: any[] = where?.OR ?? [where];
    for (const w of ors) {
      const t = byWhere(w);
      if (t) return t;
    }
    return null;
  });
  on('studioTemplateVersion', 'findUnique', async ({ where, include, select }: any) => {
    let v: any = null;
    if (where?.id !== undefined) v = versions.find((x) => x.id === where.id) ?? null;
    else if (where?.templateId_versionNo) {
      const k = where.templateId_versionNo;
      v = versions.find((x) => x.templateId === k.templateId && x.versionNo === k.versionNo) ?? null;
    }
    if (!v) return null;
    const t = templates.find((x) => x.id === v.templateId);
    if (include?.template) {
      return { ...v, template: { id: t?.id, slug: t?.slug, isPreset: t?.isPreset ?? false } };
    }
    // SR-43: select bersarang (`template: { select }`) dipakai layanan kerangka SR-06 (loadLayers).
    if (select) return project(v, select, { template: t });
    return v;
  });
  on('studioTemplateVersion', 'findMany', async ({ where }: any) => {
    if (where?.templateId) return versions.filter((v) => v.templateId === where.templateId).sort((a, b) => b.versionNo - a.versionNo);
    if (where?.OR) return versions.filter((v) => where.OR.some((w: any) => w.templateId === v.templateId && w.versionNo === v.versionNo));
    return versions;
  });
}

// ── Log ─────────────────────────────────────────────────────────────────

export interface CapturedLog {
  code?: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
}

/** Tangkap log layanan (templat, ingest, revisi) ke memori; kembalikan larik bersama. */
export function captureServiceLogs(): CapturedLog[] {
  const out: CapturedLog[] = [];
  const sink = (e: CapturedLog) => {
    out.push(e);
  };
  setTemplatesLogSink(sink);
  setIngestLogSink(sink);
  setRevisionLogSink(sink);
  return out;
}

// ── Render tiruan (mesin render S51 = di luar seam S74) ─────────────────

export function fakeJob(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'job-1',
    documentId: null,
    revisionId: null,
    artifactId: null,
    formats: ['DOCX'],
    status: 'SUCCEEDED',
    errorCode: null,
    errorMessage: null,
    engine: null,
    requestedBy: 'test',
    queuedAt: T0.toISOString(),
    startedAt: T0.toISOString(),
    finishedAt: T0.toISOString(),
    durationMs: 1,
    ...over,
  };
}

export const T_FIXED = T0;

// ── Tulis struktur v2 (SR-43) ───────────────────────────────────────────

/**
 * SR-43: sejak SR-10/SR-12 (D-183, D-210) setiap revisi baru juga menulis baris
 * struktur M14-M17 + identitas M18 + dual-write M06 (`writeRevisionRows`) di
 * transaksi yang sama. Tiruan ini menyimpan revisi yang dibuat agar
 * `studioRevision.findUnique({ where: { id } })` di dalam transaksi menemukannya,
 * dan menerima tulis tabel struktur (tidak ada baris lama).
 * `seed` = revisi yang sudah ada (mis. revisi 1 dokumen uji revisions.test).
 */
export function installStructureWrites(seed: Record<string, any>[] = []): { revisions: Map<string, any> } {
  const revisions = new Map<string, any>(seed.map((r) => [r.id, r]));
  on('studioRevision', 'create', async ({ data }: any) => {
    const row = { id: revisions.size === seed.length ? 'rev-new' : `rev-new-${revisions.size}`, createdAt: T0, ...data };
    revisions.set(row.id, row);
    return row;
  });
  on('studioRevision', 'findUnique', async ({ where, select, include }: any) => {
    // Baca ulang route R04 (`include.document`) tetap null seperti S74: route memakai hasil layanan.
    if (include?.document) return null;
    const r = where?.id !== undefined ? revisions.get(where.id) : [...revisions.values()].find((x) => where?.documentId_revisionNo && x.documentId === where.documentId_revisionNo.documentId && x.revisionNo === where.documentId_revisionNo.revisionNo);
    if (!r) return null;
    return select ? project(r, select) : r;
  });
  on('studioDocSection', 'count', async () => 0);
  on('studioDocIdentity', 'findMany', async () => []);
  on('studioDocIdentity', 'createMany', async ({ data }: any) => ({ count: data.length }));
  on('studioDocIdentity', 'updateMany', async () => ({ count: 0 }));
  on('studioAsset', 'findMany', async () => []);
  for (const m of ['studioDocSection', 'studioDocChapter', 'studioDocSubsection', 'studioDocBlock', 'studioBlock']) {
    on(m, 'createMany', async ({ data }: any) => ({ count: data.length }));
  }
  return { revisions };
}

// ── Penyimpanan struktur dalam memori (SR-43) ───────────────────────────

/**
 * SR-43: tabel dalam memori untuk jalur sunting v2 (SR-14 D-196: R06 pada dokumen v2 memetakan
 * alamat -> pid lalu membaca baris M14-M18 revisi dasar dan menulis salinan penuh revisi baru).
 * Mendukung subset kueri Prisma yang dipakai layanan: where (kesetaraan, kunci unik gabungan,
 * in/notIn/lt/lte/gt/gte/not, AND/OR/NOT), select/include relasi sederhana, orderBy satu medan,
 * create/createMany/update/updateMany/count. Bukan pengganti DB nyata (itu SR-49).
 */
export type MemoryTables = Record<string, any[]>;

const RELATIONS: Record<string, { model: string; fk: string }> = {
  identity: { model: 'studioDocIdentity', fk: 'identityId' },
  asset: { model: 'studioAsset', fk: 'assetId' },
  document: { model: 'studioDocument', fk: 'documentId' },
  revision: { model: 'studioRevision', fk: 'revisionId' },
};

function matchValue(v: any, cond: any): boolean {
  if (cond === null || typeof cond !== 'object' || cond instanceof Date || Array.isArray(cond)) {
    const a = v instanceof Date ? v.getTime() : v;
    const b = cond instanceof Date ? cond.getTime() : cond;
    return (a ?? null) === (b ?? null);
  }
  for (const [op, x] of Object.entries(cond)) {
    if (op === 'equals' && !matchValue(v, x)) return false;
    if (op === 'in' && !(x as any[]).some((y) => matchValue(v, y))) return false;
    if (op === 'notIn' && (x as any[]).some((y) => matchValue(v, y))) return false;
    if (op === 'not' && matchValue(v, x)) return false;
    if (op === 'lt' && !(v !== null && v < (x as any))) return false;
    if (op === 'lte' && !(v !== null && v <= (x as any))) return false;
    if (op === 'gt' && !(v !== null && v > (x as any))) return false;
    if (op === 'gte' && !(v !== null && v >= (x as any))) return false;
  }
  return true;
}

function matchWhere(row: any, where: any): boolean {
  if (!where) return true;
  for (const [k, cond] of Object.entries(where)) {
    if (cond === undefined) continue;
    if (k === 'AND') { if (!(cond as any[]).every((w) => matchWhere(row, w))) return false; continue; }
    if (k === 'OR') { if (!(cond as any[]).some((w) => matchWhere(row, w))) return false; continue; }
    if (k === 'NOT') { const ws = Array.isArray(cond) ? cond : [cond]; if (ws.some((w) => matchWhere(row, w))) return false; continue; }
    if (k.includes('_') && cond && typeof cond === 'object' && !(k in row)) {
      // Kunci unik gabungan (mis. documentId_revisionNo).
      if (!matchWhere(row, cond)) return false;
      continue;
    }
    if (!matchValue(row[k], cond)) return false;
  }
  return true;
}

export function installMemoryStore(tables: MemoryTables, models: string[]): MemoryTables {
  let seq = 0;
  const tableOf = (m: string) => (tables[m] ??= []);
  const shape = (m: string, row: any, args: any): any => {
    if (!row) return null;
    const out: any = args?.select ? {} : { ...row };
    const sel = args?.select ?? {};
    const inc = args?.include ?? {};
    for (const [k, v] of Object.entries(sel)) if (v === true) out[k] = row[k];
    for (const [k, v] of Object.entries({ ...sel, ...inc })) {
      if (v === true && !(k in RELATIONS)) continue;
      const rel = RELATIONS[k];
      if (!rel || !v) continue;
      const target = tableOf(rel.model).find((r) => r.id === row[rel.fk]) ?? null;
      out[k] = target && typeof v === 'object' ? shape(rel.model, target, v) : target;
    }
    return out;
  };
  const sortRows = (rows: any[], orderBy: any) => {
    const ob = Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : [];
    return [...rows].sort((a, b) => {
      for (const o of ob) {
        const [k, dir] = Object.entries(o)[0] as [string, string];
        if (a[k] === b[k]) continue;
        return (a[k] < b[k] ? -1 : 1) * (dir === 'desc' ? -1 : 1);
      }
      return 0;
    });
  };
  const mk = (m: string, data: any) => {
    const row = { id: data.id ?? `${m}-${++seq}`, createdAt: T0, updatedAt: T0, ...data };
    tableOf(m).push(row);
    return row;
  };
  const apply = (row: any, data: any) => {
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) && 'increment' in (v as any)) row[k] = (row[k] ?? 0) + (v as any).increment;
      else row[k] = v;
    }
  };
  for (const m of models) tableOf(m);
  for (const m of models) {
    on(m, 'findMany', async (args: any = {}) => {
      let rows = sortRows(tableOf(m).filter((r) => matchWhere(r, args.where)), args.orderBy);
      if (args.take !== undefined) rows = rows.slice(0, args.take);
      return rows.map((r) => shape(m, r, args));
    });
    on(m, 'findFirst', async (args: any = {}) => shape(m, sortRows(tableOf(m).filter((r) => matchWhere(r, args.where)), args.orderBy)[0], args));
    on(m, 'findUnique', async (args: any = {}) => shape(m, tableOf(m).find((r) => matchWhere(r, args.where)), args));
    on(m, 'findUniqueOrThrow', async (args: any = {}) => {
      const r = tableOf(m).find((x) => matchWhere(x, args.where));
      if (!r) throw new Error(`memory store: ${m} not found`);
      return shape(m, r, args);
    });
    on(m, 'count', async (args: any = {}) => tableOf(m).filter((r) => matchWhere(r, args.where)).length);
    on(m, 'create', async (args: any) => shape(m, mk(m, args.data), args));
    on(m, 'createMany', async ({ data }: any) => {
      for (const d of data) mk(m, d);
      return { count: data.length };
    });
    on(m, 'updateMany', async ({ where, data }: any) => {
      const rows = tableOf(m).filter((r) => matchWhere(r, where));
      rows.forEach((r) => apply(r, data));
      return { count: rows.length };
    });
    on(m, 'update', async (args: any) => {
      const r = tableOf(m).find((x) => matchWhere(x, args.where));
      if (!r) throw new Error(`memory store: ${m} not found for update`);
      apply(r, args.data);
      return shape(m, r, args);
    });
  }
  return tables;
}

/** Model yang disimpan `installMemoryStore` untuk dokumen + revisi + struktur v2. */
export const STRUCTURE_MODELS = [
  'studioDocument',
  'studioRevision',
  'studioDocSection',
  'studioDocChapter',
  'studioDocSubsection',
  'studioDocBlock',
  'studioBlock',
  'studioDocIdentity',
  'studioAsset',
];
