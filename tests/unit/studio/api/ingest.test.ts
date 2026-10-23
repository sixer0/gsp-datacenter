// S74 — Ingest dokumen (R04 POST /api/studio/documents), dry-run (R08 POST /api/studio/validate)
// dan layanan ingestDocument (I38). Sumber ekspektasi: 01_specs.md §6.2-§6.3; kriteria §7 butir
// 1, 2, 6; D-63/D-90 (gerbang by-construction), D-91/D-98 (penanda x.benchmark dan
// x.lintEnforcement hanya dari pemanggil tepercaya), D-102/D-107 (templat TERBATAS -> 403 untuk
// USER/AGENT, termasuk dryRun dan validate).
// Prisma DI-MOCK; mesin render S51 (DOCX/soffice/Chromium) ditiru — di luar seam S74 (diuji S75).
import './_env';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const render = vi.hoisted(() => ({ renderRevision: vi.fn(), renderArtifact: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/render', async (orig) => ({ ...(await orig<object>()), ...render }));

import { callsOf, dbWrites, on, resetDb } from './_prisma';
import {
  canonicalTemplate,
  captureServiceLogs,
  fakeJob,
  installStructureWrites,
  installTemplates,
  jsonOf,
  QUESTION_TITLE,
  req,
  restrictedTemplate,
  studioDoc,
  T_FIXED,
  type AuthKind,
  type CapturedLog,
} from './_studio';
import { POST as postDocument } from '@/app/api/studio/documents/route';
import { POST as postValidate } from '@/app/api/studio/validate/route';
import { ingestDocument, stripBenchmarkMarkers } from '@/lib/studio/services/ingest';
import type { StudioCaller } from '@/lib/studio/contract/auth';

const K_KEY = 'naming.underscore.allowed';
const T_KEY = 'grid.fullSpanMm';
const NON_ADMIN: AuthKind[] = ['user', 'google', 'agent'];
const ALL_AUTH: AuthKind[] = ['admin', 'user', 'google', 'agent'];

let logs: CapturedLog[];

/** Transaksi persistIngest (repository.ts) + baca ulang route R04. */
function installPersist(): void {
  on('studioDocument', 'findMany', async () => []);
  on('studioDocument', 'findUnique', async () => null);
  on('studioDocument', 'create', async ({ data }: any) => ({ id: 'doc-new', archived: false, createdAt: T_FIXED, updatedAt: T_FIXED, ...data }));
  // SR-43: revisi + baris struktur v2 (writeRevisionRows, D-183/D-210) di transaksi yang sama.
  installStructureWrites();
  on('studioBlock', 'findMany', async () => []);
}

function okRender() {
  render.renderRevision.mockResolvedValue({ job: fakeJob({ revisionId: 'rev-new' }), outputs: [], errors: [] });
}

const ingestBody = (doc: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({ agentId: 'gsp-analis', document: doc, ...extra });

beforeEach(() => {
  resetDb();
  logs = captureServiceLogs();
  render.renderRevision.mockReset();
  render.renderArtifact.mockReset();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// ── R04 POST /api/studio/documents ──────────────────────────────────────

describe('R04 POST /documents — jalur sukses untuk setiap identitas', () => {
  // SR-43 lanjutan (D-247 butir 1, D-261): build HANYA lewat endpoint render; kiriman v1 R04 tidak
  // lagi merender (`render` permintaan v1 dibuang adaptor, `stripped.render`). Respons: 201,
  // job null, outputs [], kelengkapan + fullRenderAllowed; mesin render TIDAK dipanggil.
  it.each(ALL_AUTH)('%s: dokumen sah (render diminta v1) -> 201, revisi 1 tersimpan, job null, outputs [], fullRenderAllowed, tanpa render', async (auth) => {
    installTemplates(canonicalTemplate());
    installPersist();
    okRender();
    const res = await postDocument(await req('/api/studio/documents', { auth, body: ingestBody(studioDoc(), { render: { formats: ['docx'] } }) }));
    expect(res.status).toBe(201);
    const b = await jsonOf(res);
    expect(b.document.id).toBe('doc-new');
    expect(b.revision.revisionNo).toBe(1);
    expect(b.url).toBe('/api/studio/documents/doc-new');
    expect(b.job).toBeNull();
    expect(b.outputs).toEqual([]);
    expect(b.completeness).toMatchObject({ status: 'COMPLETE', fullRenderAllowed: true });
    expect(b.renderRefused).toBeUndefined();
    expect(render.renderRevision).not.toHaveBeenCalled();
    const created = callsOf('studioDocument', 'create')[0][0] as any;
    // SR-43 (D-134, S87 L-02): createdBy berprefiks jenis — sesi HQ user:<nama>; Google google:<email>
    // (bukan agentId badan); agent agent:<agentId>.
    const expectedBy = { admin: 'user:admin1', user: 'user:user1', google: 'google:agen@gsp.test', agent: 'agent:gsp-analis' }[auth as 'admin'];
    expect(created.data.createdBy).toBe(expectedBy);
    expect(created.data.numberSource).toBe('SEQUENCE');
    expect(created.data.docNumber).toBe('001/GSP/KT/X/2026');
  });
});

describe('R04 POST /documents — 422 by-construction (kriteria §7 butir 6)', () => {
  it.each(ALL_AUTH)('%s: judul pertanyaan tier TERBIT -> 422 BY_CONSTRUCTION_FAILED details[].checkId DATUM-04, tanpa tulis DB/render', async (auth) => {
    installTemplates(canonicalTemplate());
    installPersist();
    const res = await postDocument(await req('/api/studio/documents', { auth, body: ingestBody(studioDoc({ sectionTitle: QUESTION_TITLE })) }));
    expect(res.status).toBe(422);
    const b = await jsonOf(res);
    expect(b.code).toBe('BY_CONSTRUCTION_FAILED');
    expect(b.details.map((d: any) => d.checkId)).toEqual(['DATUM-04']);
    expect(b.details[0].pointer).toMatch(/\/chapters\/0\/sections\/0\/title$/);
    expect(dbWrites()).toEqual([]);
    expect(render.renderRevision).not.toHaveBeenCalled();
  });

  it('tier NOTA: DATUM-04 tidak menahan (cek berlaku TERBIT/SERAH) -> 201', async () => {
    installTemplates(canonicalTemplate());
    installPersist();
    okRender();
    // SR-43: bentuk minimal (tanpa front.controlSheet) - slot lembar kendali tidak aktif pada tier NOTA.
    const res = await postDocument(
      await req('/api/studio/documents', { auth: 'user', body: ingestBody(studioDoc({ tier: 'NOTA', sectionTitle: QUESTION_TITLE, minimal: true })) }),
    );
    expect(res.status).toBe(201);
  });

  // SR-43: register 03 §11.2 EC06 SLOT_FORBIDDEN_FOR_TIER = "isi untuk slot tidak aktif pada tier
  // dokumen" (contoh details memuat slotKey, tier, activeTiers). Kiriman v1 tier NOTA yang membawa
  // front.controlSheet mengisi slot yang tidak aktif pada NOTA.
  it('tier NOTA + front.controlSheet (slot tidak aktif di NOTA) -> 422 SLOT_FORBIDDEN_FOR_TIER (EC06), tanpa tulis DB', async () => {
    installTemplates(canonicalTemplate());
    installPersist();
    const res = await postDocument(await req('/api/studio/documents', { auth: 'user', body: ingestBody(studioDoc({ tier: 'NOTA' })) }));
    expect(res.status).toBe(422);
    const b = await jsonOf(res);
    expect(b.code).toBe('SLOT_FORBIDDEN_FOR_TIER');
    expect(dbWrites()).toEqual([]);
  });

  // SR-43 (D-131) + lanjutan D-247/D-261: kiriman tanpa slot wajib tetap 201; tanpa build dan
  // tanpa renderRefused (render penuh = endpoint render), kelengkapan memberi fullRenderAllowed false.
  it('dokumen minimal tanpa lembar kendali (TERBIT) -> 201 INCOMPLETE, fullRenderAllowed false, job null, tanpa renderRefused/render', async () => {
    installTemplates(canonicalTemplate());
    installPersist();
    okRender();
    const res = await postDocument(await req('/api/studio/documents', { auth: 'agent', body: ingestBody(studioDoc({ minimal: true }), { render: { formats: ['docx'] } }) }));
    expect(res.status).toBe(201);
    const b = await jsonOf(res);
    expect(b.completeness).toMatchObject({ status: 'INCOMPLETE', fullRenderAllowed: false });
    expect(JSON.stringify(b.completeness)).toContain('Lembar Kendali');
    expect(b.job).toBeNull();
    expect(b.outputs).toEqual([]);
    expect(b.renderRefused).toBeUndefined();
    expect(render.renderRevision).not.toHaveBeenCalled();
  });

  // SR-43 lanjutan (D-247, D-261): `render` di badan kiriman v2 ditolak 400 SCHEMA_INVALID dengan
  // issue checkId RENDER_FIELD (pesan menunjuk endpoint render), tanpa tulis DB.
  it.each(ALL_AUTH)('%s: R04 studio.doc/v2 membawa render -> 400 SCHEMA_INVALID checkId RENDER_FIELD, tanpa tulis DB', async (auth) => {
    installTemplates(canonicalTemplate());
    installPersist();
    const doc = {
      $schema: 'studio.doc/v2',
      template: { slug: 'datum-kanonik' },
      meta: { title: 'Kajian Beban Trafo Gedung A', typeCode: 'KT', tier: 'TERBIT', language: 'ID' },
      sections: {},
      render: { scope: 'document', formats: ['docx'] },
    };
    const res = await postDocument(await req('/api/studio/documents', { auth, body: doc }));
    expect(res.status).toBe(400);
    const b = await jsonOf(res);
    expect(b.code).toBe('SCHEMA_INVALID');
    const hit = (b.details ?? []).find((d: any) => d.checkId === 'RENDER_FIELD');
    expect(hit).toMatchObject({ pointer: '/render' });
    expect(hit.message).toContain('/render');
    expect(dbWrites()).toEqual([]);
    expect(render.renderRevision).not.toHaveBeenCalled();
  });

  it('PPN 10 % tier TERBIT -> 422 dengan checkId DATUM-19', async () => {
    installTemplates(canonicalTemplate());
    const res = await postDocument(
      await req('/api/studio/documents', { auth: 'agent', body: ingestBody(studioDoc({ paragraph: 'Harga penawaran sudah termasuk PPN 10 % sesuai kontrak induk.' })) }),
    );
    expect(res.status).toBe(422);
    expect((await jsonOf(res)).details.map((d: any) => d.checkId)).toContain('DATUM-19');
  });
});

// SR-43: sejak adaptor v1 -> v2 (SR-09 D-179, ingest SR-12 D-210) `overrides` dokumen v1 = medan
// tampilan yang tunduk pada `ingest.inlineFormat` (register 03 KD-26 :119, AD-09 :1008; prinsip §0
// konten-saja D-139): kebijakan bawaan `strip` MEMBUANG overrides + REPORT, bukan 403/400. Kode
// PARAM_CLASS_K_FORBIDDEN/PARAM_CLASS_T_READONLY kini hanya untuk parameter templat (R01/R02/R19).
function strippedReport(b: any): any {
  return (b.lint?.checks ?? []).find((c: any) => c.checkId === 'INLINE_FORMAT_STRIPPED');
}

describe('R04 POST /documents — overrides dokumen v1 dibuang (KD-26/AD-09)', () => {
  it.each(NON_ADMIN)('%s: doc.overrides kelas K -> 201, overrides dibuang + REPORT INLINE_FORMAT_STRIPPED, K tidak masuk snapshot', async (auth) => {
    installTemplates(canonicalTemplate());
    installPersist();
    okRender();
    const res = await postDocument(await req('/api/studio/documents', { auth, body: ingestBody(studioDoc({ overrides: { [K_KEY]: true } })) }));
    expect(res.status).toBe(201);
    const b = await jsonOf(res);
    expect(strippedReport(b)).toMatchObject({ status: 'REPORT' });
    expect(strippedReport(b).detail).toContain('overrides 1');
    const rev = callsOf('studioRevision', 'create')[0][0] as any;
    expect(JSON.stringify(rev.data.snapshot)).not.toContain(K_KEY);
  });

  it('ADMINISTRATOR: doc.overrides kelas K -> 201', async () => {
    installTemplates(canonicalTemplate());
    installPersist();
    okRender();
    const res = await postDocument(await req('/api/studio/documents', { auth: 'admin', body: ingestBody(studioDoc({ overrides: { [K_KEY]: true } })) }));
    expect(res.status).toBe(201);
  });

  it('kelas T dari ADMIN -> 201, dibuang (kebijakan bawaan strip, KD-26), T tidak masuk snapshot', async () => {
    installTemplates(canonicalTemplate());
    installPersist();
    okRender();
    const res = await postDocument(await req('/api/studio/documents', { auth: 'admin', body: ingestBody(studioDoc({ overrides: { [T_KEY]: 170 } })) }));
    expect(res.status).toBe(201);
    expect(strippedReport(await jsonOf(res))).toMatchObject({ status: 'REPORT' });
    const rev = callsOf('studioRevision', 'create')[0][0] as any;
    expect(JSON.stringify(rev.data.snapshot)).not.toContain(T_KEY);
  });
});

describe('R04 POST /documents — templat TERBATAS (D-98/D-102)', () => {
  it.each(NON_ADMIN)('%s memakai templat terbatas -> 403 FORBIDDEN (reason TEMPLATE_RESTRICTED), tanpa tulis DB', async (auth) => {
    installTemplates(canonicalTemplate(), restrictedTemplate());
    const res = await postDocument(await req('/api/studio/documents', { auth, body: ingestBody(studioDoc({ slug: 'datum-terbatas' })) }));
    expect(res.status).toBe(403);
    const b = await jsonOf(res);
    expect(b.code).toBe('FORBIDDEN');
    expect(b.details.reason).toBe('TEMPLATE_RESTRICTED');
    expect(b.details.releasedChecks).toEqual(['DATUM-04', 'DATUM-19']);
    expect(dbWrites()).toEqual([]);
    expect(logs.some((l) => l.code === 'TEMPLATE_RESTRICTED_DENIED')).toBe(true);
  });

  it('ADMINISTRATOR + templat terbatas + judul pertanyaan -> 201 (DATUM-04 dilepas profil = penentu status rilis)', async () => {
    installTemplates(canonicalTemplate(), restrictedTemplate());
    installPersist();
    okRender();
    const res = await postDocument(
      await req('/api/studio/documents', { auth: 'admin', body: ingestBody(studioDoc({ slug: 'datum-terbatas', sectionTitle: QUESTION_TITLE })) }),
    );
    expect(res.status).toBe(201);
    const rev = callsOf('studioRevision', 'create')[0][0] as any;
    expect(rev.data.releaseStatus).toBe('FAIL');
  });
});

describe('R04 POST /documents — penanda pemanggil tak tepercaya dibuang (D-91, D-98)', () => {
  it.each(NON_ADMIN)('%s: doc.x.lintEnforcement {DATUM-04: release} dibuang -> tetap 422 DATUM-04', async (auth) => {
    installTemplates(canonicalTemplate());
    const doc = studioDoc({ sectionTitle: QUESTION_TITLE, x: { lintEnforcement: { 'DATUM-04': 'release' } } });
    const res = await postDocument(await req('/api/studio/documents', { auth, body: ingestBody(doc) }));
    expect(res.status).toBe(422);
    expect((await jsonOf(res)).details.map((d: any) => d.checkId)).toEqual(['DATUM-04']);
    expect(logs.some((l) => l.code === 'ENFORCEMENT_OVERRIDE_STRIPPED')).toBe(true);
  });

  it('ADMINISTRATOR: doc.x.lintEnforcement dihormati -> 201, penanda tersimpan di snapshot revisi', async () => {
    installTemplates(canonicalTemplate());
    installPersist();
    okRender();
    const doc = studioDoc({ sectionTitle: QUESTION_TITLE, x: { lintEnforcement: { 'DATUM-04': 'release' } } });
    const res = await postDocument(await req('/api/studio/documents', { auth: 'admin', body: ingestBody(doc) }));
    expect(res.status).toBe(201);
    const rev = callsOf('studioRevision', 'create')[0][0] as any;
    // SR-43: snapshot juga memuat `x.adaptReportV1` (laporan adaptor v1, D-210); penanda tetap utuh.
    expect(rev.data.snapshot.doc.x.lintEnforcement).toEqual({ 'DATUM-04': 'release' });
    expect(Object.keys(rev.data.snapshot.doc.x).sort()).toEqual(['adaptReportV1', 'lintEnforcement']);
  });

  it.each(NON_ADMIN)('%s: doc.x.benchmark dibuang -> tetap 422 (D-34 tidak aktif)', async (auth) => {
    installTemplates(canonicalTemplate());
    const doc = studioDoc({ sectionTitle: QUESTION_TITLE, x: { benchmark: true } });
    const res = await postDocument(await req('/api/studio/documents', { auth, body: ingestBody(doc) }));
    expect(res.status).toBe(422);
    expect(logs.some((l) => l.code === 'BENCHMARK_MARKER_STRIPPED')).toBe(true);
  });

  it('ADMINISTRATOR: doc.x.benchmark dihormati -> 201 (penahan diturunkan D-34)', async () => {
    installTemplates(canonicalTemplate());
    installPersist();
    okRender();
    const doc = studioDoc({ sectionTitle: QUESTION_TITLE, x: { benchmark: true } });
    const res = await postDocument(await req('/api/studio/documents', { auth: 'admin', body: ingestBody(doc) }));
    expect(res.status).toBe(201);
  });

  it('dokumen bersih tetap 201 dan tidak memicu log pembuangan', async () => {
    installTemplates(canonicalTemplate());
    installPersist();
    okRender();
    const res = await postDocument(await req('/api/studio/documents', { auth: 'agent', body: ingestBody(studioDoc()) }));
    expect(res.status).toBe(201);
    expect(logs.some((l) => l.code === 'BENCHMARK_MARKER_STRIPPED' || l.code === 'ENFORCEMENT_OVERRIDE_STRIPPED')).toBe(false);
  });
});

describe('R04 POST /documents — pemetaan galat kontrak lain', () => {
  it('skema tidak sah -> 400 SCHEMA_INVALID dengan pointer /document/...', async () => {
    installTemplates(canonicalTemplate());
    const doc = studioDoc();
    delete (doc.meta as any).title;
    const res = await postDocument(await req('/api/studio/documents', { auth: 'agent', body: ingestBody(doc) }));
    expect(res.status).toBe(400);
    const b = await jsonOf(res);
    expect(b.code).toBe('SCHEMA_INVALID');
    expect(b.details.every((d: any) => typeof d.pointer === 'string' && d.pointer.startsWith('/document'))).toBe(true);
  });

  it('badan bukan objek -> 400 SCHEMA_INVALID', async () => {
    const res = await postDocument(await req('/api/studio/documents', { auth: 'agent', body: '[1,2]', headers: { 'content-type': 'application/json' } }));
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('SCHEMA_INVALID');
  });

  it('slug templat tak dikenal -> 404 TEMPLATE_NOT_FOUND', async () => {
    installTemplates(canonicalTemplate());
    const res = await postDocument(await req('/api/studio/documents', { auth: 'agent', body: ingestBody(studioDoc({ slug: 'tidak-ada' })) }));
    expect(res.status).toBe(404);
    expect((await jsonOf(res)).code).toBe('TEMPLATE_NOT_FOUND');
  });

  it('meta.docNumber sudah dipakai -> 409 DOC_NUMBER_EXISTS', async () => {
    installTemplates(canonicalTemplate());
    installPersist();
    on('studioDocument', 'findUnique', async () => ({ id: 'doc-lama' }));
    const doc = studioDoc();
    (doc.meta as any).docNumber = '014/GSP/KT/X/2026';
    const res = await postDocument(await req('/api/studio/documents', { auth: 'agent', body: ingestBody(doc) }));
    expect(res.status).toBe(409);
    expect((await jsonOf(res)).code).toBe('DOC_NUMBER_EXISTS');
  });

  // SR-43 lanjutan (D-247, D-261): R04 v1 tidak membangun berkas, jadi kondisi mesin PDF tidak
  // relevan: dulu 503 PDF_ENGINE_UNAVAILABLE, kini 201 tanpa render (build lewat endpoint render).
  it('hanya PDF diminta (v1) dan mesin PDF tidak siap -> 201, job null, outputs [], render tidak dipanggil', async () => {
    installTemplates(canonicalTemplate());
    installPersist();
    render.renderRevision.mockResolvedValue({
      job: fakeJob({ status: 'PARTIAL' }),
      outputs: [],
      errors: [{ code: 'PDF_ENGINE_UNAVAILABLE', message: 'soffice tidak siap' }],
    });
    const res = await postDocument(await req('/api/studio/documents', { auth: 'agent', body: ingestBody(studioDoc(), { render: { formats: ['pdf'] } }) }));
    expect(res.status).toBe(201);
    const b = await jsonOf(res);
    expect(b.job).toBeNull();
    expect(b.outputs).toEqual([]);
    expect(b.completeness.fullRenderAllowed).toBe(true);
    expect(render.renderRevision).not.toHaveBeenCalled();
    expect(callsOf('studioDocument', 'create')).toHaveLength(1);
  });

  // SR-43 lanjutan (D-247, D-261): mesin render tidak dipanggil oleh R04 v1, jadi kegagalannya tidak
  // dapat memengaruhi respons (dulu 201 + errors RENDER_FAILED, D-134 R-09).
  it('mesin render yang akan melempar tidak dipanggil oleh R04 v1 -> 201, errors kosong, job null', async () => {
    installTemplates(canonicalTemplate());
    installPersist();
    render.renderRevision.mockRejectedValue(new Error('boom'));
    const res = await postDocument(await req('/api/studio/documents', { auth: 'agent', body: ingestBody(studioDoc()) }));
    expect(res.status).toBe(201);
    const b = await jsonOf(res);
    expect(b.job).toBeNull();
    expect(b.outputs).toEqual([]);
    expect(b.errors ?? []).toEqual([]);
    expect(render.renderRevision).not.toHaveBeenCalled();
    expect(JSON.stringify(b)).not.toContain('boom');
  });

  it('galat Prisma tak terduga -> 500 {error:"Internal error", correlationId} tanpa pesan internal', async () => {
    installTemplates(canonicalTemplate());
    installPersist();
    on('studioDocument', 'create', async () => {
      throw new Error('connection refused 10.0.0.5:5432 password=rahasia');
    });
    const res = await postDocument(await req('/api/studio/documents', { auth: 'agent', body: ingestBody(studioDoc()) }));
    expect(res.status).toBe(500);
    const b = await jsonOf(res);
    expect(b).toEqual({ error: 'Internal error', correlationId: res.headers.get('x-correlation-id') });
  });
});

// ── R08 POST /api/studio/validate ───────────────────────────────────────

describe('R08 POST /validate — dry-run tanpa tulis DB', () => {
  it.each(NON_ADMIN)('%s + templat terbatas -> 403 FORBIDDEN (otorisasi, bukan valid:false)', async (auth) => {
    installTemplates(canonicalTemplate(), restrictedTemplate());
    const res = await postValidate(await req('/api/studio/validate', { auth, body: ingestBody(studioDoc({ slug: 'datum-terbatas' })) }));
    expect(res.status).toBe(403);
    expect((await jsonOf(res)).code).toBe('FORBIDDEN');
    expect(dbWrites()).toEqual([]);
  });

  it.each(NON_ADMIN)('%s + templat terbatas lewat bentuk {schemaId, spec} -> 403 FORBIDDEN', async (auth) => {
    installTemplates(canonicalTemplate(), restrictedTemplate());
    const res = await postValidate(await req('/api/studio/validate', { auth, body: { schemaId: 'studio.doc/v1', spec: studioDoc({ slug: 'datum-terbatas' }) } }));
    expect(res.status).toBe(403);
    expect((await jsonOf(res)).code).toBe('FORBIDDEN');
  });

  it('USER + templat terbatas + roleFormats draf (jalur draftTemplate) -> 403 FORBIDDEN', async () => {
    installTemplates(canonicalTemplate(), restrictedTemplate());
    const res = await postValidate(await req('/api/studio/validate', { auth: 'user', body: { ...ingestBody(studioDoc({ slug: 'datum-terbatas' })), roleFormats: {} } }));
    expect(res.status).toBe(403);
    expect((await jsonOf(res)).code).toBe('FORBIDDEN');
  });

  it('ADMINISTRATOR + templat terbatas + judul pertanyaan -> 200 valid:true', async () => {
    installTemplates(canonicalTemplate(), restrictedTemplate());
    const res = await postValidate(
      await req('/api/studio/validate', { auth: 'admin', body: ingestBody(studioDoc({ slug: 'datum-terbatas', sectionTitle: QUESTION_TITLE })) }),
    );
    expect(res.status).toBe(200);
    expect((await jsonOf(res)).valid).toBe(true);
  });

  it.each(ALL_AUTH)('%s: pelanggaran by-construction -> 200 valid:false (422 TIDAK dipakai R08)', async (auth) => {
    installTemplates(canonicalTemplate());
    const res = await postValidate(await req('/api/studio/validate', { auth, body: ingestBody(studioDoc({ sectionTitle: QUESTION_TITLE })) }));
    expect(res.status).toBe(200);
    const b = await jsonOf(res);
    expect(b.valid).toBe(false);
    expect(b.issues.map((i: any) => i.checkId)).toEqual(['DATUM-04']);
    expect(dbWrites()).toEqual([]);
  });

  // SR-43 (KD-26/AD-09, D-179/D-210): overrides v1 dibuang + REPORT, bukan valid:false keyword K.
  it('USER: override kelas K -> 200 valid:true, overrides dibuang + REPORT INLINE_FORMAT_STRIPPED, tanpa tulis DB', async () => {
    installTemplates(canonicalTemplate());
    const res = await postValidate(await req('/api/studio/validate', { auth: 'user', body: ingestBody(studioDoc({ overrides: { [K_KEY]: true } })) }));
    expect(res.status).toBe(200);
    const b = await jsonOf(res);
    expect(b.valid).toBe(true);
    expect(b.issues).toEqual([]);
    expect(strippedReport(b)).toMatchObject({ status: 'REPORT' });
    expect(dbWrites()).toEqual([]);
  });

  it('agent: x.lintEnforcement dibuang -> valid:false + temuan REPORT ENFORCEMENT_OVERRIDE_STRIPPED di lint', async () => {
    installTemplates(canonicalTemplate());
    const doc = studioDoc({ sectionTitle: QUESTION_TITLE, x: { lintEnforcement: { 'DATUM-04': 'release' } } });
    const res = await postValidate(await req('/api/studio/validate', { auth: 'agent', body: ingestBody(doc) }));
    const b = await jsonOf(res);
    expect(b.valid).toBe(false);
    const notice = b.lint.checks.find((c: any) => c.checkId === 'ENFORCEMENT_OVERRIDE_STRIPPED');
    expect(notice).toMatchObject({ status: 'REPORT', pointer: '/document/x/lintEnforcement' });
  });

  it('user: x.benchmark dibuang -> valid:false + temuan REPORT BENCHMARK_MARKER_STRIPPED', async () => {
    installTemplates(canonicalTemplate());
    const doc = studioDoc({ sectionTitle: QUESTION_TITLE, x: { benchmark: true } });
    const b = await jsonOf(await postValidate(await req('/api/studio/validate', { auth: 'user', body: ingestBody(doc) })));
    expect(b.valid).toBe(false);
    expect(b.lint.checks.find((c: any) => c.checkId === 'BENCHMARK_MARKER_STRIPPED')).toMatchObject({ status: 'REPORT', pointer: '/document/x/benchmark' });
  });

  it('admin: x.lintEnforcement dihormati -> valid:true tanpa temuan pembuangan', async () => {
    installTemplates(canonicalTemplate());
    const doc = studioDoc({ sectionTitle: QUESTION_TITLE, x: { lintEnforcement: { 'DATUM-04': 'release' } } });
    const b = await jsonOf(await postValidate(await req('/api/studio/validate', { auth: 'admin', body: ingestBody(doc) })));
    expect(b.valid).toBe(true);
    expect(b.lint.checks.some((c: any) => c.checkId === 'ENFORCEMENT_OVERRIDE_STRIPPED')).toBe(false);
  });
});

// ── Layanan ingestDocument (I38) ────────────────────────────────────────

describe('layanan ingestDocument — gerbang kepercayaan', () => {
  const agent: StudioCaller = { kind: 'INTERNAL_AGENT', requester: 'gsp-analis', agentId: 'gsp-analis', canWriteClassK: false };
  const admin: StudioCaller = { kind: 'ADMIN_SESSION', requester: 'user:adm', canWriteClassK: true };

  it('dryRun + templat terbatas + INTERNAL_AGENT -> MELEMPAR FORBIDDEN (bukan valid:false)', async () => {
    installTemplates(restrictedTemplate());
    const err = await ingestDocument({ document: studioDoc({ slug: 'datum-terbatas' }) } as any, agent, { dryRun: true }).catch((e) => e);
    expect(err?.code).toBe('FORBIDDEN');
    expect(err?.httpStatus).toBe(403);
  });

  it('dryRun + templat terbatas + trustedHarness (flag server) -> valid:true', async () => {
    installTemplates(restrictedTemplate());
    const r = await ingestDocument({ document: studioDoc({ slug: 'datum-terbatas', sectionTitle: QUESTION_TITLE }) } as any, agent, { dryRun: true, trustedHarness: true });
    expect(r.valid).toBe(true);
  });

  it('opsi enforcement:"report" dari konteks tak tepercaya diabaikan -> DATUM-04 tetap menahan', async () => {
    installTemplates(canonicalTemplate());
    const r = await ingestDocument({ document: studioDoc({ sectionTitle: QUESTION_TITLE }) } as any, agent, { dryRun: true, enforcement: 'report' });
    expect(r.valid).toBe(false);
    expect(r.issues.map((i) => i.checkId)).toEqual(['DATUM-04']);
    expect(logs.find((l) => l.code === 'BENCHMARK_MARKER_STRIPPED')?.context?.stripped).toEqual(['opts.enforcement']);
  });

  it('opsi enforcement:"report" dari ADMIN dihormati -> valid:true (D-34)', async () => {
    installTemplates(canonicalTemplate());
    const r = await ingestDocument({ document: studioDoc({ sectionTitle: QUESTION_TITLE }) } as any, admin, { dryRun: true, enforcement: 'report' });
    expect(r.valid).toBe(true);
  });

  it('bukan dryRun + pelanggaran -> melempar BY_CONSTRUCTION_FAILED (422) dengan details ber-checkId', async () => {
    installTemplates(canonicalTemplate());
    const err = await ingestDocument({ document: studioDoc({ sectionTitle: QUESTION_TITLE }) } as any, agent, { dryRun: false }).catch((e) => e);
    expect(err.code).toBe('BY_CONSTRUCTION_FAILED');
    expect(err.httpStatus).toBe(422);
    expect(err.details.map((d: any) => d.checkId)).toEqual(['DATUM-04']);
    expect(dbWrites()).toEqual([]);
  });

  it('stripBenchmarkMarkers tidak memutasi dokumen asli dan membuang x kosong', () => {
    const doc = studioDoc({ x: { benchmark: true, enforcement: 'report' } });
    const s = stripBenchmarkMarkers(doc);
    expect(s.stripped).toEqual(['/document/x/benchmark', '/document/x/enforcement']);
    expect('x' in (s.doc as any)).toBe(false);
    expect((doc as any).x).toEqual({ benchmark: true, enforcement: 'report' });
  });
});
