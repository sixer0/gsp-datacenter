// S74 — Alur revisi (R06 GET|PATCH /documents/[id]/blocks/[address], R07 /revisions; layanan
// patchBlock/getBlock/rerenderRevision I40). Sumber ekspektasi: 01_specs.md §4.1-§4.2 (alamat C.S.P,
// D-06 sunting = revisi baru), §6.2-§6.3; kriteria §7 butir 5 ("PATCH tanpa apa/mengapa/dampak
// ditolak 400. PATCH sah membuat revisi n+1, dan revisi n tetap terbaca"); D-90/IP-30 (by-construction
// saat sunting memakai templat terpin); D-107 (patchBlock -> assertTemplateUsable purpose revision).
// Prisma DI-MOCK; renderRevision (mesin S51) ditiru.
import './_env';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const render = vi.hoisted(() => ({ renderRevision: vi.fn(), renderArtifact: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/render', async (orig) => ({ ...(await orig<object>()), ...render }));

import { callsOf, clearDbCalls, dbCalls, dbWrites, on, resetDb } from './_prisma';
import {
  canonicalTemplate,
  captureServiceLogs,
  fakeJob,
  installMemoryStore,
  installTemplates,
  jsonOf,
  OK_PARAGRAPH,
  params,
  req,
  restrictedTemplate,
  STRUCTURE_MODELS,
  studioDoc,
  T_FIXED,
  type AuthKind,
  type TemplateFixture,
} from './_studio';
import { GET as getBlockRoute, PATCH as patchBlockRoute } from '@/app/api/studio/documents/[id]/blocks/[address]/route';
import { POST as rerenderRoute } from '@/app/api/studio/documents/[id]/revisions/route';
import { ingestDocument } from '@/lib/studio/services/ingest';
import { patchBlock } from '@/lib/studio/services/revisions';
import type { StudioCaller } from '@/lib/studio/contract/auth';

const T0 = T_FIXED;
const ADMIN: StudioCaller = { kind: 'ADMIN_SESSION', requester: 'user:adm', canWriteClassK: true };
const NON_ADMIN: AuthKind[] = ['user', 'google', 'agent'];
const NEW_TEXT = 'Beban puncak trafo A1 turun menjadi 610 kVA pada Oktober 2026 setelah pemindahan beban pendingin ke trafo A2.';
const PPN_TEXT = 'Harga penawaran sudah termasuk PPN 10 % sesuai kontrak induk.';
const CHANGE = { what: 'Perbarui angka beban', why: 'Data Oktober tersedia', impact: 'Ringkasan memakai beban terbaru' };

interface Base {
  revision: Record<string, any>;
}

/**
 * Dokumen doc1 dengan revisi 1 dan currentRevisionNo `current`. Templat terpin = versi 1 fixture.
 *
 * SR-43: sejak SR-12/SR-14 (D-210, D-196) revisi dibuat lewat ingest v1 -> v2 (snapshot norm/v2 +
 * baris struktur M14-M18) dan R06 pada dokumen v2 memetakan alamat -> pid lalu membaca baris
 * revisi dasar. Fixture S74 (revisi tiruan dari ingest dryRun) tidak lagi memadai: revisi 1 kini
 * DITULIS oleh ingest nyata (persist, ADMIN) ke penyimpanan dalam memori, lalu riwayat panggilan
 * dikosongkan agar `dbWrites()` hanya memuat tulisan PATCH.
 */
async function setupDocument(fx: TemplateFixture, opts: { current?: number } = {}): Promise<Base> {
  installTemplates(canonicalTemplate(), ...(fx.template.slug === 'datum-kanonik' ? [] : [fx]));
  const tables = installMemoryStore({}, STRUCTURE_MODELS);
  on('studioDocument', 'create', async ({ data }: any) => {
    const row = { id: 'doc1', archived: false, missionDocKey: null, createdAt: T0, updatedAt: T0, ...data };
    tables.studioDocument.push(row);
    return row;
  });
  on('studioRevision', 'create', async ({ data }: any) => {
    const row = { id: `rev${data.revisionNo}`, releaseStatus: 'PENDING', createdAt: T0, ...data };
    tables.studioRevision.push(row);
    return row;
  });
  const ingested = await ingestDocument({ agentId: 'gsp-analis', document: studioDoc({ slug: fx.template.slug }) } as any, ADMIN, { dryRun: false });
  expect(ingested.revision?.id).toBe('rev1');
  const revision = tables.studioRevision.find((r) => r.id === 'rev1');
  if (opts.current !== undefined) tables.studioDocument[0].currentRevisionNo = opts.current;
  on('studioOutputFile', 'findMany', async () => []);
  render.renderRevision.mockResolvedValue({ job: fakeJob({ revisionId: 'rev2' }), outputs: [], errors: [] });
  clearDbCalls();
  return { revision };
}

/** SR-43: tulisan DATA (tanpa kunci advisory transaksi `$executeRaw`, D-202) sejak reset. */
function dataWrites(): string[] {
  return dbWrites().filter((c) => c !== '$executeRaw');
}

/** Blok snapshot revisi (norm/v1 `blocks` atau norm/v2 `blocks`) per alamat. */
function blockAt(snapshot: any, address: string): any {
  return (snapshot?.blocks ?? []).find((x: any) => x.address === address);
}

const patchReq = async (address: string, body: Record<string, unknown>, auth: AuthKind = 'agent') =>
  patchBlockRoute(await req(`/api/studio/documents/doc1/blocks/${encodeURIComponent(address)}`, { method: 'PATCH', auth, body }), params({ id: 'doc1', address }));

const replaceBody = (text: string, extra: Record<string, unknown> = {}) => ({
  baseRevisionNo: 1,
  op: 'replace',
  block: { type: 'paragraph', text },
  change: CHANGE,
  agentId: 'gsp-analis',
  ...extra,
});

beforeEach(() => {
  resetDb();
  captureServiceLogs();
  render.renderRevision.mockReset();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('PATCH blok per alamat C.S.P -> revisi n+1 (D-06)', () => {
  it('replace 1.1.1 -> 200, revisi 2 berinduk 1, apa/mengapa/dampak tersimpan, kunci optimistik currentRevisionNo', async () => {
    const base = await setupDocument(canonicalTemplate());
    const res = await patchReq('1.1.1', replaceBody(NEW_TEXT));
    expect(res.status).toBe(200);
    const b = await jsonOf(res);
    expect(b.revision).toMatchObject({ revisionNo: 2, parentRevisionNo: 1, changeWhat: CHANGE.what, changeWhy: CHANGE.why, changeImpact: CHANGE.impact });
    expect(b.revision.changedAddresses).toContain('1.1.1');
    expect(b.revision.createdBy).toBe('agent:gsp-analis'); // SR-43: D-134 (S87 L-02) prefiks jenis
    // SR-43 (D-196, register 03 KD-27): R06 pada dokumen v2 merender HANYA bila `render` diminta.
    expect(b.job).toBeNull();
    expect(b.pid).toBe(blockAt(base.revision.snapshot, '1.1.1').pid); // alamat -> pid (KD-23)

    const upd = callsOf('studioDocument', 'updateMany')[0][0] as any;
    // SR-43: kunci optimistik tetap; kolom kelengkapan dokumen ikut diperbarui (SR-11/D-131).
    expect(upd).toEqual({ where: { id: 'doc1', currentRevisionNo: 1 }, data: { currentRevisionNo: 2, completeness: 'COMPLETE' } });
    const created = callsOf('studioRevision', 'create')[0][0] as any;
    expect(created.data.templateVersionId).toBe(base.revision.templateVersionId); // templat terpin sama
    const newBlock = created.data.snapshot.blocks.find((x: any) => x.address === '1.1.1');
    const oldBlock = base.revision.snapshot.blocks.find((x: any) => x.address === '1.1.1');
    expect(newBlock.blockId).toBe(oldBlock.blockId); // identitas blok dipertahankan (§4.2 butir 2)
    expect(JSON.stringify(newBlock)).toContain('610 kVA');
    // Indeks blok revisi baru ditulis untuk rev2 saja.
    const rows = (callsOf('studioBlock', 'createMany')[0][0] as any).data;
    expect(rows.every((r: any) => r.revisionId === 'rev2')).toBe(true);
    // SR-43 (D-196): tanpa `render` di badan PATCH, mesin render tidak dipanggil.
    expect(render.renderRevision).not.toHaveBeenCalled();
  });

  // SR-43 (D-183/D-196): revisi v2 = salinan penuh baris M14-M17 + dual-write M06 untuk revisi BARU,
  // di bawah kunci advisory transaksi ($executeRaw pg_advisory_xact_lock, D-202). Tidak ada
  // update/delete atas baris revisi lama; satu-satunya update = kunci optimistik dokumen.
  it('revisi n tidak pernah diubah: tulis = kunci advisory, create revisi + baris struktur rev2, updateMany dokumen', async () => {
    const base = await setupDocument(canonicalTemplate());
    const snapBefore = JSON.stringify(base.revision.snapshot);
    await patchReq('1.1.1', replaceBody(NEW_TEXT));
    expect(dbWrites()).toEqual([
      '$executeRaw',
      'studioRevision.create',
      'studioDocSection.createMany',
      'studioDocChapter.createMany',
      'studioDocSubsection.createMany',
      'studioDocBlock.createMany',
      'studioBlock.createMany',
      'studioDocument.updateMany',
    ]);
    for (const m of ['studioDocSection', 'studioDocChapter', 'studioDocSubsection', 'studioDocBlock', 'studioBlock']) {
      const rows = (callsOf(m, 'createMany')[0][0] as any).data;
      expect(rows.every((r: any) => r.revisionId === 'rev2')).toBe(true);
    }
    expect(JSON.stringify(base.revision.snapshot)).toBe(snapBefore);
  });

  it('insertAfter 1.1.1 -> blok baru di 1.1.2 dengan blockId baru', async () => {
    const base = await setupDocument(canonicalTemplate());
    const res = await patchReq('1.1.1', { baseRevisionNo: 1, op: 'insertAfter', block: { type: 'paragraph', text: NEW_TEXT }, change: CHANGE });
    expect(res.status).toBe(200);
    const b = await jsonOf(res);
    expect(b.revision.changedAddresses).toContain('1.1.2');
    const created = callsOf('studioRevision', 'create')[0][0] as any;
    const inserted = created.data.snapshot.blocks.find((x: any) => x.address === '1.1.2');
    const original = base.revision.snapshot.blocks.find((x: any) => x.address === '1.1.1');
    expect(inserted).toBeDefined();
    expect(inserted.blockId).not.toBe(original.blockId);
  });

  it('isi identik dengan revisi terkini -> 400 SCHEMA_INVALID (tanpa revisi kosong)', async () => {
    await setupDocument(canonicalTemplate());
    const res = await patchReq('1.1.1', replaceBody(OK_PARAGRAPH));
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('SCHEMA_INVALID');
    expect(dataWrites()).toEqual([]); // SR-43: kunci advisory transaksi bukan tulis data (D-202)
  });
});

describe('PATCH — validasi kontrak (400/404/409)', () => {
  it.each(['what', 'why', 'impact'])('change.%s kosong -> 400 CHANGE_FIELDS_REQUIRED berpointer, tanpa akses DB', async (k) => {
    const res = await patchReq('1.1.1', replaceBody(NEW_TEXT, { change: { ...CHANGE, [k]: '   ' } }));
    expect(res.status).toBe(400);
    const b = await jsonOf(res);
    expect(b.code).toBe('CHANGE_FIELDS_REQUIRED');
    expect(b.details).toEqual([{ pointer: `/change/${k}`, keyword: 'required', message: 'must be a non-empty string' }]);
    expect(dbCalls()).toEqual([]);
  });

  it('LAYANAN patchBlock tanpa change -> CHANGE_FIELDS_REQUIRED (pertahanan berlapis)', async () => {
    const err = await patchBlock('doc1', '1.1.1', { baseRevisionNo: 1, op: 'replace', block: { type: 'paragraph', text: NEW_TEXT } } as any, ADMIN).catch((e) => e);
    expect(err.code).toBe('CHANGE_FIELDS_REQUIRED');
    expect(dbCalls()).toEqual([]);
  });

  it.each(['bukan-alamat', '1..2', 'Tabel'])('alamat "%s" di luar tata bahasa §4.1 -> 400 ADDRESS_INVALID', async (address) => {
    const res = await patchReq(address, replaceBody(NEW_TEXT));
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('ADDRESS_INVALID');
    expect(dbCalls()).toEqual([]);
  });

  it('alamat sah tetapi tidak ada di revisi (9.9.9) -> 404 ADDRESS_NOT_FOUND', async () => {
    await setupDocument(canonicalTemplate());
    const res = await patchReq('9.9.9', replaceBody(NEW_TEXT));
    expect(res.status).toBe(404);
    expect((await jsonOf(res)).code).toBe('ADDRESS_NOT_FOUND');
    expect(dataWrites()).toEqual([]); // SR-43: kunci advisory transaksi bukan tulis data (D-202)
  });

  it('dokumen tidak ada -> 404 DOCUMENT_NOT_FOUND', async () => {
    on('studioDocument', 'findUnique', async () => null);
    const res = await patchBlockRoute(
      await req('/api/studio/documents/docX/blocks/1.1.1', { method: 'PATCH', auth: 'agent', body: replaceBody(NEW_TEXT) }),
      params({ id: 'docX', address: '1.1.1' }),
    );
    expect(res.status).toBe(404);
    expect((await jsonOf(res)).code).toBe('DOCUMENT_NOT_FOUND');
  });

  it('baseRevisionNo usang (dokumen sudah di revisi 2) -> 409 REVISION_CONFLICT', async () => {
    await setupDocument(canonicalTemplate(), { current: 2 });
    const res = await patchReq('1.1.1', replaceBody(NEW_TEXT));
    expect(res.status).toBe(409);
    const b = await jsonOf(res);
    expect(b.code).toBe('REVISION_CONFLICT');
    expect(b.details).toEqual({ baseRevisionNo: 1, currentRevisionNo: 2 });
    expect(dbWrites()).toEqual([]);
  });

  // SR-43: di jalur v2 (SR-14) revisi + baris dibuat lebih dulu lalu kunci optimistik dokumen
  // diperiksa; count 0 melempar DI DALAM $transaction sehingga DB membatalkan seluruh tulisan.
  // Tiruan tanpa rollback: yang diuji = galat dilempar di dalam transaksi (rollback nyata = SR-49).
  it('balapan di transaksi (updateMany count 0) -> 409 REVISION_CONFLICT, dilempar di dalam transaksi', async () => {
    await setupDocument(canonicalTemplate());
    on('studioDocument', 'updateMany', async () => ({ count: 0 }));
    const res = await patchReq('1.1.1', replaceBody(NEW_TEXT));
    expect(res.status).toBe(409);
    expect((await jsonOf(res)).code).toBe('REVISION_CONFLICT');
    const tx = (await import('./_prisma')).db.$transaction as any;
    expect(tx.mock.results.at(-1).type).toBe('return');
    await expect(tx.mock.results.at(-1).value).rejects.toMatchObject({ code: 'REVISION_CONFLICT' });
  });

  // SR-43 lanjutan (D-247, D-261): `render` di badan PATCH alamat (R06) -> 400 SCHEMA_INVALID
  // checkId RENDER_FIELD (build lewat endpoint render), tanpa revisi baru dan tanpa render.
  it('render di badan PATCH -> 400 SCHEMA_INVALID checkId RENDER_FIELD, tanpa tulis data', async () => {
    await setupDocument(canonicalTemplate());
    const res = await patchReq('1.1.1', replaceBody(NEW_TEXT, { render: { scope: 'document', formats: ['docx'] } }));
    expect(res.status).toBe(400);
    const b = await jsonOf(res);
    expect(b.code).toBe('SCHEMA_INVALID');
    expect(b.details).toContainEqual(expect.objectContaining({ checkId: 'RENDER_FIELD' }));
    expect(dataWrites()).toEqual([]);
    expect(render.renderRevision).not.toHaveBeenCalled();
  });

  it('baseRevisionNo bukan bilangan -> 400 SCHEMA_INVALID pointer /baseRevisionNo', async () => {
    const res = await patchReq('1.1.1', replaceBody(NEW_TEXT, { baseRevisionNo: '1' }));
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).details).toContainEqual(expect.objectContaining({ pointer: '/baseRevisionNo' }));
  });
});

describe('PATCH — by-construction dan templat terpin (IP-30, D-107)', () => {
  // SR-43: jalur v2 (SR-14) memeriksa di dalam transaksi berkunci advisory (D-202), jadi syarat
  // "tanpa transaksi" S74 diganti "tanpa tulis data". 422 by-construction tetap (D-90/IP-30; register
  // 03 §11.1 butir 9 berlaku untuk setiap tulis).
  it.each([...NON_ADMIN, 'admin'] as AuthKind[])('%s: sunting memasukkan PPN 10 % (TERBIT, kanonik) -> 422 DATUM-19, tanpa tulis data', async (auth) => {
    await setupDocument(canonicalTemplate());
    const res = await patchReq('1.1.1', replaceBody(PPN_TEXT), auth);
    expect(res.status).toBe(422);
    const b = await jsonOf(res);
    expect(b.code).toBe('BY_CONSTRUCTION_FAILED');
    expect(b.details.map((d: any) => d.checkId)).toContain('DATUM-19');
    expect(dataWrites()).toEqual([]);
  });

  it.each(NON_ADMIN)('%s: dokumen berpin templat TERBATAS -> 403 FORBIDDEN (assertTemplateUsable purpose revision)', async (auth) => {
    await setupDocument(restrictedTemplate());
    const res = await patchReq('1.1.1', replaceBody(NEW_TEXT), auth);
    expect(res.status).toBe(403);
    const b = await jsonOf(res);
    expect(b.code).toBe('FORBIDDEN');
    expect(b.details.reason).toBe('TEMPLATE_RESTRICTED');
    expect(dataWrites()).toEqual([]); // SR-43: kunci advisory transaksi bukan tulis data (D-202)
  });

  it('ADMINISTRATOR: templat terbatas + PPN 10 % -> 200 (DATUM-19 dilepas profil terpin)', async () => {
    await setupDocument(restrictedTemplate());
    const res = await patchReq('1.1.1', replaceBody(PPN_TEXT), 'admin');
    expect(res.status).toBe(200);
    expect((await jsonOf(res)).revision.revisionNo).toBe(2);
  });
});

describe('GET blok per alamat (R06)', () => {
  it('GET 1.1.1?rev=1 -> 200 { address, blockId, type, content, revisionNo }', async () => {
    const base = await setupDocument(canonicalTemplate());
    const blk = base.revision.snapshot.blocks.find((x: any) => x.address === '1.1.1');
    on('studioBlock', 'findUnique', async ({ where }: any) =>
      where.revisionId_address?.revisionId === 'rev1' && where.revisionId_address?.address === '1.1.1'
        ? { blockId: blk.blockId, type: 'paragraph', content: { type: 'paragraph', text: OK_PARAGRAPH } }
        : null,
    );
    const res = await getBlockRoute(await req('/api/studio/documents/doc1/blocks/1.1.1?rev=1', { auth: 'google' }), params({ id: 'doc1', address: '1.1.1' }));
    expect(res.status).toBe(200);
    expect(await jsonOf(res)).toEqual({ address: '1.1.1', blockId: blk.blockId, type: 'paragraph', content: { type: 'paragraph', text: OK_PARAGRAPH }, revisionNo: 1 });
  });

  it('GET ?rev=0 -> 400 SCHEMA_INVALID; ?rev=5 -> 404 REVISION_NOT_FOUND', async () => {
    await setupDocument(canonicalTemplate());
    const bad = await getBlockRoute(await req('/api/studio/documents/doc1/blocks/1.1.1?rev=0', { auth: 'agent' }), params({ id: 'doc1', address: '1.1.1' }));
    expect(bad.status).toBe(400);
    const missing = await getBlockRoute(await req('/api/studio/documents/doc1/blocks/1.1.1?rev=5', { auth: 'agent' }), params({ id: 'doc1', address: '1.1.1' }));
    expect(missing.status).toBe(404);
    expect((await jsonOf(missing)).code).toBe('REVISION_NOT_FOUND');
  });
});

describe('R07 POST /revisions — render ulang revisi lama tanpa revisi baru', () => {
  it('job render masih berjalan -> 409 RENDER_IN_PROGRESS', async () => {
    await setupDocument(canonicalTemplate());
    on('studioRenderJob', 'findFirst', async () => ({ id: 'job-running' }));
    const res = await rerenderRoute(await req('/api/studio/documents/doc1/revisions', { auth: 'agent', body: { revisionNo: 1 } }), params({ id: 'doc1' }));
    expect(res.status).toBe(409);
    expect((await jsonOf(res)).code).toBe('RENDER_IN_PROGRESS');
    expect(render.renderRevision).not.toHaveBeenCalled();
  });

  it('sha256 keluaran sama dengan render pertama -> 200 identical:true, tanpa revisi baru', async () => {
    await setupDocument(canonicalTemplate());
    on('studioRenderJob', 'findFirst', async () => null);
    on('studioOutputFile', 'findMany', async () => [{ format: 'DOCX', role: 'PRIMARY', figureLabel: null, sha256: 'abc' }]);
    render.renderRevision.mockResolvedValue({ job: fakeJob(), outputs: [{ format: 'DOCX', role: 'PRIMARY', figureLabel: null, sha256: 'abc' }], errors: [] });
    const res = await rerenderRoute(await req('/api/studio/documents/doc1/revisions', { auth: 'agent', body: { revisionNo: 1, formats: ['DOCX'] } }), params({ id: 'doc1' }));
    expect(res.status).toBe(200);
    expect((await jsonOf(res)).identical).toBe(true);
    expect(render.renderRevision.mock.calls[0][0]).toBe('rev1');
    expect(dbWrites()).toEqual([]);
  });

  it('format tak dikenal -> 400 SCHEMA_INVALID; revisi tidak ada -> 404 REVISION_NOT_FOUND', async () => {
    await setupDocument(canonicalTemplate());
    const bad = await rerenderRoute(await req('/api/studio/documents/doc1/revisions', { auth: 'agent', body: { revisionNo: 1, formats: ['EXE'] } }), params({ id: 'doc1' }));
    expect(bad.status).toBe(400);
    const missing = await rerenderRoute(await req('/api/studio/documents/doc1/revisions', { auth: 'agent', body: { revisionNo: 7 } }), params({ id: 'doc1' }));
    expect(missing.status).toBe(404);
    expect((await jsonOf(missing)).code).toBe('REVISION_NOT_FOUND');
  });
});

