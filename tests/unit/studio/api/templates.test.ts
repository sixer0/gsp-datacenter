// S74 — Hak parameter templat (KT-16; 01_specs.md §6.1, §6.2 R01/R02, §6.3; kriteria §7 butir 1:
// "Override kelas K oleh USER atau agent ditolak 403; oleh ADMINISTRATOR diterima").
// Seam: handler R01 POST /api/studio/templates dan R02 POST|PATCH /api/studio/templates/[id]
// + layanan createTemplateVersion. Prisma DI-MOCK; kegagalan hak tidak boleh menulis DB.
import './_env';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());

import { callsOf, dbCalls, dbWrites, on, resetDb } from './_prisma';
import { canonicalTemplate, captureServiceLogs, installTemplates, jsonOf, makeTemplate, params, req, T_FIXED, type AuthKind } from './_studio';
import { GET as listTpl, POST as createTpl } from '@/app/api/studio/templates/route';
import { GET as getTpl, POST as saveVersion, PATCH as patchVersion } from '@/app/api/studio/templates/[id]/route';
import { createTemplateVersion } from '@/lib/studio/services/templates';
import { PARAMS_BY_KEY } from '@/lib/studio/params';
import type { StudioCaller } from '@/lib/studio/contract/auth';

// Kunci dari registri (kelas diperiksa di bawah agar fixture tidak diam-diam basi).
const K_KEY = 'naming.underscore.allowed'; // kelas K, bool
const T_KEY = 'grid.fullSpanMm'; // kelas T (turunan grid.textColumnMm)
const B_KEY = 'artifact.audience.outsideDivision'; // kelas B, bool - lapis INTERNAL (SR-05/D-168)
// SR-43: kunci kelas B berlapis ESENSIAL (SR-05/SR-59, D-168/D-170): satu-satunya lapis yang boleh
// ditulis non-ADMIN lewat v1 datar R01 dan lewat layanan (D-189: lainnya PARAM_SURFACE_FORBIDDEN).
const E_KEY = 'doc.language'; // kelas B, enum, esensial, bawaan "ID"

const NON_ADMIN: AuthKind[] = ['user', 'google', 'agent'];

function echoCreate(model: string, idPrefix: string) {
  on(model, 'create', async ({ data }: any) => ({ id: `${idPrefix}-new`, createdAt: T_FIXED, updatedAt: T_FIXED, archived: false, ...data }));
}

beforeEach(() => {
  resetDb();
  captureServiceLogs();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('fixture registri', () => {
  it('kelas kunci uji sesuai registri (K, T, B)', () => {
    expect(PARAMS_BY_KEY.get(K_KEY)?.class).toBe('K');
    expect(PARAMS_BY_KEY.get(T_KEY)?.class).toBe('T');
    expect(PARAMS_BY_KEY.get(B_KEY)?.class).toBe('B');
    expect(PARAMS_BY_KEY.get(E_KEY)?.class).toBe('B');
  });

  it('SR-43: lapis kunci uji sesuai registri (D-168): B_KEY dan K_KEY internal, E_KEY esensial', () => {
    expect((PARAMS_BY_KEY.get(B_KEY) as any)?.surface).toBe('internal');
    expect((PARAMS_BY_KEY.get(K_KEY) as any)?.surface).toBe('internal');
    expect((PARAMS_BY_KEY.get(E_KEY) as any)?.surface).toBe('essential');
  });
});

const createBody = (overrides: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  slug: 'turunan-uji',
  name: 'Turunan uji',
  kind: 'DOCUMENT',
  overrides,
  changeNote: 'buat turunan',
  ...extra,
});

describe('R01 POST /api/studio/templates — hak kelas K/T', () => {
  it.each(NON_ADMIN)('%s menulis kelas K -> 403 PARAM_CLASS_K_FORBIDDEN, tanpa tulis DB', async (auth) => {
    installTemplates(canonicalTemplate());
    const res = await createTpl(await req('/api/studio/templates', { auth, body: createBody({ [K_KEY]: true }) }));
    expect(res.status).toBe(403);
    const b = await jsonOf(res);
    expect(b.code).toBe('PARAM_CLASS_K_FORBIDDEN');
    expect(typeof b.error).toBe('string');
    expect(JSON.stringify(b)).not.toMatch(/\n\s+at\s/); // tanpa stack trace
    expect(dbWrites()).toEqual([]);
  });

  it('ADMINISTRATOR menulis kelas K -> 201, versi 1 menyimpan override K', async () => {
    installTemplates(canonicalTemplate());
    echoCreate('studioTemplate', 'tpl');
    echoCreate('studioTemplateVersion', 'ver');
    const res = await createTpl(await req('/api/studio/templates', { auth: 'admin', body: createBody({ [K_KEY]: true }) }));
    expect(res.status).toBe(201);
    const b = await jsonOf(res);
    expect(b.version.versionNo).toBe(1);
    expect(b.version.overrides).toEqual({ [K_KEY]: true });
    expect(b.version.resolvedParams[K_KEY]).toBe(true);
    // Dasar = versi terbaru profil kanonik (seed).
    const verData = callsOf('studioTemplateVersion', 'create')[0][0] as any;
    expect(verData.data.baseVersionId).toBe('tpl-canon-v1');
    expect(verData.data.createdBy).toBe('user:admin1');
  });

  it.each([...NON_ADMIN, 'admin'] as AuthKind[])('%s menulis kelas T -> 400 PARAM_CLASS_T_READONLY', async (auth) => {
    installTemplates(canonicalTemplate());
    const res = await createTpl(await req('/api/studio/templates', { auth, body: createBody({ [T_KEY]: 170 }) }));
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('PARAM_CLASS_T_READONLY');
    expect(dbWrites()).toEqual([]);
  });

  it('kunci di luar registri -> 422 PARAM_UNKNOWN_KEY', async () => {
    installTemplates(canonicalTemplate());
    const res = await createTpl(await req('/api/studio/templates', { auth: 'admin', body: createBody({ 'tidak.ada.di.registri': 1 }) }));
    expect(res.status).toBe(422);
    expect((await jsonOf(res)).code).toBe('PARAM_UNKNOWN_KEY');
  });

  it('K + T sekaligus oleh USER -> 403 didahulukan (urutan K, T, kunci asing)', async () => {
    installTemplates(canonicalTemplate());
    const res = await createTpl(await req('/api/studio/templates', { auth: 'user', body: createBody({ [K_KEY]: true, [T_KEY]: 170 }) }));
    expect(res.status).toBe(403);
    expect((await jsonOf(res)).code).toBe('PARAM_CLASS_K_FORBIDDEN');
  });

  // SR-43 (D-189/SR-61, register 03 EC12): v1 datar non-ADMIN hanya kunci esensial; kunci B
  // berlapis internal kini 403 PARAM_SURFACE_FORBIDDEN (dulu 201 di S74).
  it.each(NON_ADMIN)('%s menulis kunci B berlapis internal -> 403 PARAM_SURFACE_FORBIDDEN, tanpa tulis DB', async (auth) => {
    installTemplates(canonicalTemplate());
    const res = await createTpl(await req('/api/studio/templates', { auth, body: createBody({ [B_KEY]: true }, { agentId: 'gsp-analis' }) }));
    expect(res.status).toBe(403);
    const b = await jsonOf(res);
    expect(b.code).toBe('PARAM_SURFACE_FORBIDDEN');
    expect(b.details.keys).toEqual([B_KEY]);
    expect(dbWrites()).toEqual([]);
  });

  it('ADMINISTRATOR menulis kunci B berlapis internal -> 201 (lapis lanjutan/internal hanya ADMIN)', async () => {
    installTemplates(canonicalTemplate());
    echoCreate('studioTemplate', 'tpl');
    echoCreate('studioTemplateVersion', 'ver');
    const res = await createTpl(await req('/api/studio/templates', { auth: 'admin', body: createBody({ [B_KEY]: true }) }));
    expect(res.status).toBe(201);
  });

  it('agent menulis kelas B ESENSIAL saja -> 201 (agent boleh membuat turunan kenop esensial)', async () => {
    installTemplates(canonicalTemplate());
    echoCreate('studioTemplate', 'tpl');
    echoCreate('studioTemplateVersion', 'ver');
    const res = await createTpl(await req('/api/studio/templates', { auth: 'agent', body: createBody({ [E_KEY]: 'EN' }, { agentId: 'gsp-analis' }) }));
    expect(res.status).toBe(201);
    const verData = callsOf('studioTemplateVersion', 'create')[0][0] as any;
    expect(verData.data.createdBy).toBe('agent:gsp-analis'); // SR-43: D-134 (S87 L-02) prefiks jenis
  });

  it('changeNote kosong -> 400 CHANGE_NOTE_REQUIRED', async () => {
    installTemplates(canonicalTemplate());
    const res = await createTpl(await req('/api/studio/templates', { auth: 'admin', body: createBody({}, { changeNote: '   ' }) }));
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('CHANGE_NOTE_REQUIRED');
  });

  it('slug sudah dipakai -> 409 TEMPLATE_SLUG_EXISTS', async () => {
    installTemplates(canonicalTemplate(), makeTemplate({ id: 'tpl-x', slug: 'turunan-uji' }));
    const res = await createTpl(await req('/api/studio/templates', { auth: 'admin', body: createBody({}) }));
    expect(res.status).toBe(409);
    expect((await jsonOf(res)).code).toBe('TEMPLATE_SLUG_EXISTS');
  });

  // SR-43 (D-146, S85 R-13 IP-43b): penolakan berbasis PERAN = FORBIDDEN, bukan PARAM_CLASS_K_FORBIDDEN.
  it.each(NON_ADMIN)('%s ?import=profile -> 403 FORBIDDEN (impor profil hanya ADMIN, penolakan peran)', async (auth) => {
    const res = await createTpl(
      await req('/api/studio/templates?import=profile', { auth, body: { meta: { slug: 'p', name: 'p', kind: 'DOCUMENT' }, overrides: {}, changeNote: 'x' } }),
    );
    expect(res.status).toBe(403);
    expect((await jsonOf(res)).code).toBe('FORBIDDEN');
    expect(dbWrites()).toEqual([]);
  });

  // SR-43 (D-189/SR-61; D-146): preset gaya baru lewat v2 oleh non-ADMIN = penolakan peran.
  it.each(NON_ADMIN)('%s v2 isPreset:true -> 403 FORBIDDEN reason PRESET_ADMIN_ONLY, tanpa tulis DB', async (auth) => {
    const res = await createTpl(
      await req('/api/studio/templates', {
        auth,
        body: { slug: 'preset-uji', name: 'Preset uji', kind: 'DOCUMENT', isPreset: true, changeNote: 'preset baru', template: { $schema: 'studio.template/v2', essentials: {} } },
      }),
    );
    expect(res.status).toBe(403);
    const b = await jsonOf(res);
    expect(b.code).toBe('FORBIDDEN');
    expect(b.details).toMatchObject({ reason: 'PRESET_ADMIN_ONLY' });
    expect(dbWrites()).toEqual([]);
  });
});

// Templat turunan yang SUDAH memuat override K hasil admin (versi 1).
const derived = () => makeTemplate({ id: 'tpl-der', slug: 'turunan-a', versions: [{ [K_KEY]: true }] });

function installVersionWrites(): void {
  on('studioTemplate', 'updateMany', async () => ({ count: 1 }));
  echoCreate('studioTemplateVersion', 'ver');
  on('studioTemplate', 'findUniqueOrThrow', async () => ({ ...derived().template, latestVersionNo: 2 }));
}

describe('R02 POST|PATCH /api/studio/templates/[id] — versi baru dan hak kelas K', () => {
  const versionBody = (overrides: Record<string, unknown>, baseVersionNo = 1) => ({ baseVersionNo, overrides, changeNote: 'ubah' });

  // SR-43 (D-189/SR-61): simpan v1 datar R02 HANYA ADMIN; non-ADMIN 403 FORBIDDEN V1_FLAT_ADMIN_ONLY
  // SEBELUM cek kunci K (dulu S74: PARAM_CLASS_K_FORBIDDEN). Aturan K per kunci berubah diuji di layanan.
  it.each(NON_ADMIN)('%s v1 datar MENGUBAH nilai K -> 403 FORBIDDEN V1_FLAT_ADMIN_ONLY, tanpa tulis DB', async (auth) => {
    installTemplates(derived());
    const res = await saveVersion(await req('/api/studio/templates/tpl-der', { auth, body: versionBody({ [K_KEY]: false }) }), params({ id: 'tpl-der' }));
    expect(res.status).toBe(403);
    const b = await jsonOf(res);
    expect(b.code).toBe('FORBIDDEN');
    expect(b.details).toMatchObject({ reason: 'V1_FLAT_ADMIN_ONLY' });
    expect(dbWrites()).toEqual([]);
  });

  it('PATCH (alias POST) v1 datar oleh USER -> 403 FORBIDDEN V1_FLAT_ADMIN_ONLY yang sama', async () => {
    installTemplates(derived());
    const res = await patchVersion(
      await req('/api/studio/templates/tpl-der', { method: 'PATCH', auth: 'user', body: versionBody({ [K_KEY]: false }) }),
      params({ id: 'tpl-der' }),
    );
    expect(res.status).toBe(403);
    const b = await jsonOf(res);
    expect(b.code).toBe('FORBIDDEN');
    expect(b.details).toMatchObject({ reason: 'V1_FLAT_ADMIN_ONLY' });
    expect(dbWrites()).toEqual([]);
  });

  it('LAYANAN: USER MENGUBAH nilai K -> 403 PARAM_CLASS_K_FORBIDDEN (D-146: kode K hanya bila kunci K berubah)', async () => {
    installTemplates(derived());
    const user: StudioCaller = { kind: 'USER_SESSION', requester: 'user:u1', canWriteClassK: false };
    const err = await createTemplateVersion('tpl-der', { baseVersionNo: 1, overrides: { [K_KEY]: false }, changeNote: 'ubah K' }, user).catch((e) => e);
    expect(err.code).toBe('PARAM_CLASS_K_FORBIDDEN');
    expect(dbWrites()).toEqual([]);
  });

  it('ADMINISTRATOR mengubah K -> 201, versionNo naik 1 -> 2, kunci optimistik latestVersionNo=1', async () => {
    installTemplates(derived());
    installVersionWrites();
    const res = await saveVersion(await req('/api/studio/templates/tpl-der', { auth: 'admin', body: versionBody({ [K_KEY]: false }) }), params({ id: 'tpl-der' }));
    expect(res.status).toBe(201);
    const b = await jsonOf(res);
    expect(b.version.versionNo).toBe(2);
    expect(b.version.overrides).toEqual({ [K_KEY]: false });
    const upd = callsOf('studioTemplate', 'updateMany')[0][0] as any;
    expect(upd.where).toEqual({ id: 'tpl-der', latestVersionNo: 1 });
    // Versi lama tidak pernah disunting: hanya create versi baru, tanpa update versi.
    expect(dbWrites().filter((c) => c.startsWith('studioTemplateVersion.'))).toEqual(['studioTemplateVersion.create']);
  });

  it('baseVersionNo bukan versi terbaru -> 409 VERSION_CONFLICT', async () => {
    installTemplates(makeTemplate({ id: 'tpl-der', slug: 'turunan-a', versions: [{}, {}] }));
    const res = await saveVersion(await req('/api/studio/templates/tpl-der', { auth: 'admin', body: versionBody({}, 1) }), params({ id: 'tpl-der' }));
    expect(res.status).toBe(409);
    const b = await jsonOf(res);
    expect(b.code).toBe('VERSION_CONFLICT');
    expect(b.details).toEqual({ latestVersionNo: 2 });
  });

  // SR-43 (D-146 R-13): ubah profil kanonik oleh non-ADMIN = penolakan PERAN -> FORBIDDEN.
  it('profil kanonik diubah USER (kunci B sekalipun) -> 403 FORBIDDEN', async () => {
    installTemplates(canonicalTemplate());
    const res = await saveVersion(await req('/api/studio/templates/tpl-canon', { auth: 'user', body: versionBody({ [B_KEY]: true }) }), params({ id: 'tpl-canon' }));
    expect(res.status).toBe(403);
    expect((await jsonOf(res)).code).toBe('FORBIDDEN');
    expect(dbWrites()).toEqual([]);
  });

  it('LAYANAN: profil kanonik diubah USER (kunci esensial) -> 403 FORBIDDEN reason CANONICAL_ADMIN_ONLY (D-146)', async () => {
    installTemplates(canonicalTemplate());
    const user: StudioCaller = { kind: 'USER_SESSION', requester: 'user:u1', canWriteClassK: false };
    const err = await createTemplateVersion('tpl-canon', { baseVersionNo: 1, overrides: { [E_KEY]: 'EN' }, changeNote: 'ubah' }, user).catch((e) => e);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.details).toMatchObject({ reason: 'CANONICAL_ADMIN_ONLY' });
    expect(dbWrites()).toEqual([]);
  });

  it('versi tanpa changeNote -> 400 CHANGE_NOTE_REQUIRED', async () => {
    installTemplates(derived());
    const res = await saveVersion(
      await req('/api/studio/templates/tpl-der', { auth: 'admin', body: { baseVersionNo: 1, overrides: {} } }),
      params({ id: 'tpl-der' }),
    );
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('CHANGE_NOTE_REQUIRED');
  });

  // Kontrak layanan S49 (src/lib/studio/services/templates/index.ts header + createTemplateVersion):
  // `overrides` = lapisan override LENGKAP milik templat; "Hak kelas K diperiksa hanya untuk kunci
  // yang BERUBAH". USER yang hanya mengubah kunci B dan membawa K admin apa adanya harus lolos.
  // SR-43: kunci B yang diubah kini ESENSIAL (E_KEY). B_KEY berlapis internal -> PARAM_SURFACE_FORBIDDEN
  // (D-189; lapis per kunci berubah di layanan, D-134/D-170) - diuji terpisah di bawah.
  it('LAYANAN: USER membawa K tak berubah + mengubah B esensial -> versi 2 dibuat (hanya kunci berubah diperiksa)', async () => {
    installTemplates(derived());
    installVersionWrites();
    const user: StudioCaller = { kind: 'USER_SESSION', requester: 'user:u1', canWriteClassK: false };
    const out = await createTemplateVersion('tpl-der', { baseVersionNo: 1, overrides: { [K_KEY]: true, [E_KEY]: 'EN' }, changeNote: 'ubah B' }, user);
    expect(out.version.versionNo).toBe(2);
    expect(out.version.overrides).toEqual({ [K_KEY]: true, [E_KEY]: 'EN' });
  });

  it('LAYANAN: USER mengubah kunci B berlapis internal -> 403 PARAM_SURFACE_FORBIDDEN, tanpa tulis DB (D-189/EC12)', async () => {
    installTemplates(derived());
    const user: StudioCaller = { kind: 'USER_SESSION', requester: 'user:u1', canWriteClassK: false };
    const err = await createTemplateVersion('tpl-der', { baseVersionNo: 1, overrides: { [K_KEY]: true, [B_KEY]: true }, changeNote: 'ubah B' }, user).catch((e) => e);
    expect(err.code).toBe('PARAM_SURFACE_FORBIDDEN');
    expect(dbWrites()).toEqual([]);
  });

  it('LAYANAN: USER MENGHAPUS override K admin -> 403 (penghapusan = perubahan K)', async () => {
    installTemplates(derived());
    const user: StudioCaller = { kind: 'USER_SESSION', requester: 'user:u1', canWriteClassK: false };
    const err = await createTemplateVersion('tpl-der', { baseVersionNo: 1, overrides: { [B_KEY]: true }, changeNote: 'hapus K' }, user).catch((e) => e);
    expect(err.code).toBe('PARAM_CLASS_K_FORBIDDEN');
    expect(dbWrites()).toEqual([]);
  });

  // SR-43: skenario F-S74-1 (route v1 datar) dilampaui D-189: non-ADMIN wajib v2; v1 datar USER
  // -> 403 V1_FLAT_ADMIN_ONLY apa pun kuncinya. ADMIN v1 datar membawa K tak berubah tetap 201.
  it('ROUTE: USER v1 datar membawa K tak berubah + mengubah B esensial -> 403 FORBIDDEN V1_FLAT_ADMIN_ONLY (D-189)', async () => {
    installTemplates(derived());
    const res = await saveVersion(
      await req('/api/studio/templates/tpl-der', { auth: 'user', body: versionBody({ [K_KEY]: true, [E_KEY]: 'EN' }) }),
      params({ id: 'tpl-der' }),
    );
    expect(res.status).toBe(403);
    expect((await jsonOf(res)).details).toMatchObject({ reason: 'V1_FLAT_ADMIN_ONLY' });
    expect(dbWrites()).toEqual([]);
  });

  it('ROUTE: ADMINISTRATOR v1 datar membawa K tak berubah + mengubah B -> 201', async () => {
    installTemplates(derived());
    installVersionWrites();
    const res = await saveVersion(
      await req('/api/studio/templates/tpl-der', { auth: 'admin', body: versionBody({ [K_KEY]: true, [B_KEY]: true }) }),
      params({ id: 'tpl-der' }),
    );
    expect(res.status).toBe(201);
  });

  it('v2: badan memuat overrides datar bersama template -> 400 SCHEMA_INVALID pointer /overrides, tanpa tulis DB', async () => {
    installTemplates(derived());
    const res = await saveVersion(
      await req('/api/studio/templates/tpl-der', {
        auth: 'user',
        body: { baseVersionNo: 1, changeNote: 'x', overrides: {}, template: { $schema: 'studio.template/v2', essentials: {} } },
      }),
      params({ id: 'tpl-der' }),
    );
    expect(res.status).toBe(400);
    const b = await jsonOf(res);
    expect(b.code).toBe('SCHEMA_INVALID');
    expect(JSON.stringify(b.details)).toContain('/overrides');
    expect(dbWrites()).toEqual([]);
  });
});

// -- SR-43: API templat v2 baca (D-189/SR-61, D-166) ----------------------

describe('R01 GET ?preset / R02 GET ?expert dan proyeksi non-ADMIN (D-189, D-166)', () => {
  it.each(['x', '2', 'yes'])('R01 GET ?preset=%s -> 400 SCHEMA_INVALID, tanpa akses DB', async (v) => {
    const res = await listTpl(await req(`/api/studio/templates?preset=${v}`, { auth: 'user' }));
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('SCHEMA_INVALID');
    expect(dbCalls()).toEqual([]);
  });

  it('R01 GET ?preset=1 -> 200, filter isPreset:true diteruskan ke DB, isPreset boolean di respons', async () => {
    const preset = { ...makeTemplate({ id: 'tpl-p', slug: 'datum-gsp-preset' }).template, isPreset: true };
    on('studioTemplate', 'findMany', async () => [preset]);
    on('studioTemplateVersion', 'findMany', async () => [{ templateId: 'tpl-p', resolvedParams: {} }]);
    const res = await listTpl(await req('/api/studio/templates?preset=1', { auth: 'user' }));
    expect(res.status).toBe(200);
    const where = (callsOf('studioTemplate', 'findMany')[0][0] as any).where;
    expect(where.isPreset).toBe(true);
    const b = await jsonOf(res);
    expect(b.templates.map((t: any) => [t.slug, t.isPreset])).toEqual([['datum-gsp-preset', true]]);
  });

  it.each(['x', '2'])('R02 GET ?expert=%s -> 400 SCHEMA_INVALID, tanpa akses DB', async (v) => {
    const res = await getTpl(await req(`/api/studio/templates/tpl-der?expert=${v}`, { auth: 'user' }), params({ id: 'tpl-der' }));
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('SCHEMA_INVALID');
    expect(dbCalls()).toEqual([]);
  });

  // D-189 keputusan diterima: non-ADMIN GET memangkas overrides ke esensial + roleFormats {},
  // tetapi tetap memuat resolvedParams (nilai efektif baca saja).
  const mixed = () => makeTemplate({ id: 'tpl-mix', slug: 'turunan-mix', versions: [{ [K_KEY]: true, [E_KEY]: 'EN' }] });

  it.each(NON_ADMIN)('R02 GET %s (expert=1 sekalipun) -> overrides hanya esensial, roleFormats {}, resolvedParams utuh', async (auth) => {
    installTemplates(mixed());
    const res = await getTpl(await req('/api/studio/templates/tpl-mix?expert=1', { auth }), params({ id: 'tpl-mix' }));
    expect(res.status).toBe(200);
    const b = await jsonOf(res);
    expect(b.advancedIncluded).toBe(false);
    expect(b.version.overrides).toEqual({ [E_KEY]: 'EN' });
    expect(b.version.roleFormats).toEqual({});
    expect(b.version.resolvedParams[K_KEY]).toBe(true);
    expect(b.version.resolvedParams[E_KEY]).toBe('EN');
  });

  it('R02 GET ADMINISTRATOR -> overrides lengkap termasuk kunci internal, advancedIncluded true', async () => {
    installTemplates(mixed());
    const res = await getTpl(await req('/api/studio/templates/tpl-mix', { auth: 'admin' }), params({ id: 'tpl-mix' }));
    expect(res.status).toBe(200);
    const b = await jsonOf(res);
    expect(b.advancedIncluded).toBe(true);
    expect(b.version.overrides).toEqual({ [K_KEY]: true, [E_KEY]: 'EN' });
  });
});
