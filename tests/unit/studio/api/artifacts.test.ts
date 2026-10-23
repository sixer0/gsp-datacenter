// S74 — R09 POST /api/studio/artifacts: otorisasi templat (403) dan gerbang dokumen inline (422)
// berjalan di prepareArtifact SEBELUM baris StudioArtifact dibuat (D-107 INT-R, D-114 INT-U,
// F-048). Sumber ekspektasi: 01_specs.md §6.2 R09, §6.3; API-REFERENCE §12; D-91/D-98 (penanda).
// Prisma DI-MOCK; renderArtifact (mesin S51) ditiru.
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
  installTemplates,
  jsonOf,
  QUESTION_TITLE,
  req,
  restrictedTemplate,
  studioDoc,
  T_FIXED,
  type AuthKind,
} from './_studio';
import { POST as postArtifact } from '@/app/api/studio/artifacts/route';
import { gateHtmlArtifact } from '@/lib/studio/services/render/artifact';
import type { StudioCaller } from '@/lib/studio/contract/auth';

const K_KEY = 'naming.underscore.allowed';
const NON_ADMIN: AuthKind[] = ['user', 'google', 'agent'];

const htmlSpec = (doc: Record<string, unknown>, slug = 'datum-kanonik') => ({
  $schema: 'studio.html/v1',
  template: { slug },
  source: { kind: 'inline', document: doc },
});

function installArtifactWrites(): void {
  on('studioArtifact', 'create', async ({ data }: any) => ({ id: 'art-1', createdAt: T_FIXED, updatedAt: T_FIXED, ...data }));
  on('studioArtifact', 'findUnique', async () => null);
  render.renderArtifact.mockResolvedValue({ job: fakeJob({ artifactId: 'art-1', formats: ['HTML'] }), outputs: [], errors: [] });
}

beforeEach(() => {
  resetDb();
  captureServiceLogs();
  render.renderArtifact.mockReset();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('R09 POST — HTML inline: 422 by-construction sebelum baris artefak', () => {
  it.each([...NON_ADMIN, 'admin'] as AuthKind[])(
    '%s: dokumen inline judul pertanyaan (TERBIT) -> 422 BY_CONSTRUCTION_FAILED, pointer relatif spec, tanpa StudioArtifact.create',
    async (auth) => {
      installTemplates(canonicalTemplate());
      installArtifactWrites();
      const res = await postArtifact(await req('/api/studio/artifacts', { auth, body: { spec: htmlSpec(studioDoc({ sectionTitle: QUESTION_TITLE })), formats: ['html'] } }));
      expect(res.status).toBe(422);
      const b = await jsonOf(res);
      expect(b.code).toBe('BY_CONSTRUCTION_FAILED');
      expect(b.details).toEqual([
        expect.objectContaining({ checkId: 'DATUM-04', pointer: '/source/document/chapters/0/sections/0/title' }),
      ]);
      expect(callsOf('studioArtifact', 'create')).toHaveLength(0);
      expect(dbWrites()).toEqual([]);
      expect(render.renderArtifact).not.toHaveBeenCalled();
    },
  );

  it.each(NON_ADMIN)('%s: x.lintEnforcement di dokumen inline dibuang -> tetap 422, tanpa baris', async (auth) => {
    installTemplates(canonicalTemplate());
    installArtifactWrites();
    const doc = studioDoc({ sectionTitle: QUESTION_TITLE, x: { lintEnforcement: { 'DATUM-04': 'release' } } });
    const res = await postArtifact(await req('/api/studio/artifacts', { auth, body: { spec: htmlSpec(doc) } }));
    expect(res.status).toBe(422);
    expect(callsOf('studioArtifact', 'create')).toHaveLength(0);
  });

  // SR-43: gerbang inline = ingest dryRun (F-048), yang sejak SR-09/SR-12 (D-179/D-210) MEMBUANG
  // overrides v1 (register 03 KD-26/AD-09, kebijakan bawaan strip) alih-alih 403. Sama dengan R04.
  it.each(NON_ADMIN)('%s: doc.overrides kelas K di dokumen inline -> 201 (dibuang di gerbang, KD-26)', async (auth) => {
    installTemplates(canonicalTemplate());
    installArtifactWrites();
    const res = await postArtifact(await req('/api/studio/artifacts', { auth, body: { spec: htmlSpec(studioDoc({ overrides: { [K_KEY]: true } })) } }));
    expect(res.status).toBe(201);
    expect(callsOf('studioArtifact', 'create')).toHaveLength(1);
  });

  // SR-43: dokumen yang DIRENDER = `gate.inlineDoc` (render/artifact.ts: "Render memakai dokumen yang
  // sama dengan yang lolos gerbang"). Bila gerbang membuang overrides (KD-26) tetapi inlineDoc masih
  // membawanya, templateForDoc menerapkan kunci K pemanggil tak tepercaya saat render (KT-16, §7 butir 1).
  it.each(NON_ADMIN)('%s: gateHtmlArtifact -> inlineDoc tanpa overrides kelas K (yang dirender = yang lolos gerbang)', async (auth) => {
    installTemplates(canonicalTemplate());
    const caller: StudioCaller =
      auth === 'agent'
        ? { kind: 'INTERNAL_AGENT', requester: 'agent:gsp-analis', agentId: 'gsp-analis', canWriteClassK: false }
        : auth === 'google'
          ? { kind: 'GOOGLE_SESSION', requester: 'google:agen@gsp.test', email: 'agen@gsp.test', canWriteClassK: false }
          : { kind: 'USER_SESSION', requester: 'user:user1', canWriteClassK: false };
    const gate = await gateHtmlArtifact(htmlSpec(studioDoc({ overrides: { [K_KEY]: true } })) as any, caller);
    expect((gate.inlineDoc as any)?.overrides?.[K_KEY]).toBeUndefined();
  });

  it('ADMINISTRATOR: x.lintEnforcement dihormati -> 201, baris dibuat lalu render dipanggil', async () => {
    installTemplates(canonicalTemplate());
    installArtifactWrites();
    const doc = studioDoc({ sectionTitle: QUESTION_TITLE, x: { lintEnforcement: { 'DATUM-04': 'release' } } });
    const res = await postArtifact(await req('/api/studio/artifacts', { auth: 'admin', body: { spec: htmlSpec(doc), formats: ['html'] } }));
    expect(res.status).toBe(201);
    expect(callsOf('studioArtifact', 'create')).toHaveLength(1);
    expect(render.renderArtifact).toHaveBeenCalledWith('art-1', ['HTML'], expect.objectContaining({ kind: 'ADMIN_SESSION' }));
  });
});

describe('R09 POST — HTML dengan templat TERBATAS: 403 sebelum baris artefak', () => {
  it.each(NON_ADMIN)('%s + templat terbatas (dokumen inline sah) -> 403 FORBIDDEN, tanpa StudioArtifact.create', async (auth) => {
    installTemplates(canonicalTemplate(), restrictedTemplate());
    installArtifactWrites();
    const res = await postArtifact(await req('/api/studio/artifacts', { auth, body: { spec: htmlSpec(studioDoc({ slug: 'datum-terbatas' }), 'datum-terbatas') } }));
    expect(res.status).toBe(403);
    expect((await jsonOf(res)).code).toBe('FORBIDDEN');
    expect(callsOf('studioArtifact', 'create')).toHaveLength(0);
    expect(dbWrites()).toEqual([]);
  });

  it('USER + templat terbatas + sumber dokumen tersimpan -> 403 juga (gerbang templat, bukan hanya inline)', async () => {
    installTemplates(canonicalTemplate(), restrictedTemplate());
    installArtifactWrites();
    const spec = { $schema: 'studio.html/v1', template: { slug: 'datum-terbatas' }, source: { kind: 'document', documentId: 'doc1' } };
    const res = await postArtifact(await req('/api/studio/artifacts', { auth: 'user', body: { spec } }));
    expect(res.status).toBe(403);
    expect(callsOf('studioArtifact', 'create')).toHaveLength(0);
  });

  it('ADMINISTRATOR + templat terbatas + judul pertanyaan -> 201, templateVersionId terpin di baris', async () => {
    installTemplates(canonicalTemplate(), restrictedTemplate());
    installArtifactWrites();
    const res = await postArtifact(
      await req('/api/studio/artifacts', { auth: 'admin', body: { spec: htmlSpec(studioDoc({ slug: 'datum-terbatas', sectionTitle: QUESTION_TITLE }), 'datum-terbatas') } }),
    );
    expect(res.status).toBe(201);
    const row = callsOf('studioArtifact', 'create')[0][0] as any;
    expect(row.data).toMatchObject({ kind: 'HTML', schemaId: 'studio.html/v1', templateVersionId: 'tpl-restr-v1', createdBy: 'user:admin1' });
  });
});

describe('R09 POST — amplop dan pemetaan kode galat', () => {
  it('medan amplop asing -> 400 SCHEMA_INVALID additionalProperties', async () => {
    const res = await postArtifact(await req('/api/studio/artifacts', { auth: 'agent', body: { spec: htmlSpec(studioDoc()), sesuatu: 1 } }));
    expect(res.status).toBe(400);
    const b = await jsonOf(res);
    expect(b.code).toBe('SCHEMA_INVALID');
    expect(b.details).toContainEqual(expect.objectContaining({ pointer: '/sesuatu', keyword: 'additionalProperties' }));
  });

  it('spec.$schema dokumen (studio.doc/v1) ditolak di R09 -> 400', async () => {
    const res = await postArtifact(await req('/api/studio/artifacts', { auth: 'agent', body: { spec: studioDoc() } }));
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).details[0].pointer).toBe('/spec/$schema');
  });

  it('format tidak sah untuk jenis (PNG untuk HTML) -> 400 SCHEMA_INVALID, tanpa baris', async () => {
    installTemplates(canonicalTemplate());
    const res = await postArtifact(await req('/api/studio/artifacts', { auth: 'agent', body: { spec: htmlSpec(studioDoc()), formats: ['png'] } }));
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).details[0].pointer).toBe('/formats/0');
    expect(dbWrites()).toEqual([]);
  });

  const chartSpec = (kind: string) => ({
    $schema: 'studio.chart/v1',
    kind,
    title: 'Beban trafo A1 tertinggi pada September.',
    source: 'Log SCADA gedung A',
    widthMm: 128,
    data: { shape: 'categorical', points: [{ label: 'Agu', value: 600 }, { label: 'Sep', value: 640 }] },
  });

  it('kode chart di luar registri -> 400 SCHEMA_INVALID pointer /kind (enum skema chart), tanpa baris', async () => {
    const res = await postArtifact(await req('/api/studio/artifacts', { auth: 'agent', body: { spec: chartSpec('ZZ-99') } }));
    expect(res.status).toBe(400);
    const b = await jsonOf(res);
    expect(b.code).toBe('SCHEMA_INVALID');
    expect(b.details.some((d: any) => d.pointer === '/kind')).toBe(true);
    expect(dbWrites()).toEqual([]);
  });

  it('kode chart terdaftar tetapi drawn=false -> 422 CHART_KIND_NOT_DRAWN + details.alternatives, tanpa baris', async () => {
    const { CHART_REGISTRY } = await import('@/lib/studio/registry/charts');
    const undrawn = CHART_REGISTRY.find((c) => !c.drawn);
    expect(undrawn).toBeDefined();
    const res = await postArtifact(await req('/api/studio/artifacts', { auth: 'agent', body: { spec: chartSpec(undrawn!.code) } }));
    expect(res.status).toBe(422);
    const b = await jsonOf(res);
    expect(b.code).toBe('CHART_KIND_NOT_DRAWN');
    expect(b.details).toMatchObject({ kind: undrawn!.code, pointer: '/kind' });
    expect(Array.isArray(b.details.alternatives)).toBe(true);
    expect(dbWrites()).toEqual([]);
  });

  it('badan JSON rusak -> 400 JSON_MALFORMED', async () => {
    const res = await postArtifact(await req('/api/studio/artifacts', { auth: 'agent', body: '{"spec":', headers: { 'content-type': 'application/json' } }));
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('JSON_MALFORMED');
  });
});
