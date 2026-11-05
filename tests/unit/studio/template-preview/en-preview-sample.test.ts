/**
 * Addendum USER (2026-11-05, "the template preview in web ui still show indonesian text when i select EN template"):
 * dokumen contoh pratinjau dipilih menurut bahasa dokumen templat (`doc.language`, data templat, bukan slug).
 * EN = terjemahan setia berstruktur sama (angka format EN); ID = contoh hari ini byte-identik (pin hash).
 *
 * Seam render: templat EN dari tabel spec seed (preset GSP DATUM + lapis jenis/bahasa, diresolusi dalam memori seperti
 * uji S29), contoh v2 lewat jalur server murni (skema doc/v2, `defaultMeta`, `mergeSubmission`, `composeV2`), lalu
 * perakit HTML yang sama dengan pratinjau.
 */
import { createHash } from 'node:crypto';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { NormDocSnapshot, ParamMap, ResolvedTemplate, StudioTier, TemplateSlotDef } from '@/lib/studio/contract';
import { assembleHtml } from '@/lib/studio/engine/html/assemble';
import { CONTROL_SHEET_COLUMNS, FRONT_PAYLOAD_LABELS } from '@/lib/studio/engine/front/texts';
import { resolveParams } from '@/lib/studio/engine/tokens';
import { ALL_PARAMS } from '@/lib/studio/params';
import { composeV2, defaultMeta, emptyResolvedDoc, mergeSubmission, seededPidAllocator, type SkeletonInput } from '@/lib/studio/services/compose';
import { validateV2Against } from '@/lib/studio/services/ingest';
import { resolveSkeletonSlots, resolveSlotParams, skeletonSha256, validateSkeleton } from '@/lib/studio/services/skeleton';
import { loadResolvedProfileFile, type ParamRecord } from '@/lib/studio/services/templates';
import { SAMPLE_DOCUMENT, SAMPLE_DOCUMENT_EN, sampleDocumentFor } from '@/components/studio/template-preview/sample-document';
import { sampleDocumentV2 } from '@/components/studio/template-preview/sample-document-v2';
import { previewLanguageOf } from '@/components/studio/template-preview/preview-language';
import { derivedTemplatePlan, type DerivedTemplateSpec } from '../../../../prisma/seed-studio-templates';
import { DERIVED_PRESET_SPECS } from '../../../../prisma/seed-derived-presets';
import { DOC_TYPE_TEMPLATE_SPECS } from '../../../../prisma/seed-doc-type-templates';
import { makeCtx } from '../renderers/_kit';

const REPO = path.resolve(__dirname, '..', '..', '..', '..');
const sha = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');

/** research/31 §6: daftar inti AC-6 (sama dengan uji S29). */
const AC6_CORE = ['Lembar Kendali', 'KLASIFIKASI', 'SALINAN INDUK', 'TERBITAN', 'Tanggal', 'Uraian', 'Oleh', 'Pemegang', 'LEMBAR', 'Penyusun', 'Rp'];
/** Kalimat dan label contoh ID hari ini (laporan controller dari panel pratinjau DEV). */
const ID_SAMPLE_STRINGS = [
  'Kepada tim penyusun templat', 'Contoh Pratinjau', 'Templat Dokumen', 'Dokumen contoh', 'Lingkup: pratinjau', 'Tim penyusun templat',
  'Divisi Engineering', 'Oktober 2026', 'Kendali dokumen', 'Terbit pertama', 'Angka diikat', 'Disusun', 'Diperiksa', 'Disetujui',
  'Penyusun dokumen', 'Pemeriksa teknis', 'Kepala divisi', 'Ruang lingkup pekerjaan', 'Lingkup dan angka kunci', 'Metode dan jadwal',
  'Urutan kerja', 'Pekerjaan mencakup', 'Penggalian', 'Uji tekan', 'Serah terima', 'Segmen', 'Utara', 'Selatan', 'Panjang', 'Survei lapangan',
  'Glosarium', 'Istilah', 'Arti', 'Mobilisasi', 'Pemasangan dimulai', 'Bab ini merangkum', '6.546,2', '3.120,0', '3.426,2',
];
const wordHit = (text: string, token: string) => new RegExp(`(?<![\\p{L}\\p{N}])${token.replace(/ /g, '[ \\u00A0]')}(?![\\p{L}\\p{N}])`, 'u').test(text);
/** Pin hash contoh ID sebelum addendum (dihitung dari kode sebelum perubahan, 2026-11-05). */
const ID_V1_SHA = '84c594599685392806c906e9748f1f44bdb6aecf870c48749d18cf078e56e794';
const ID_V2_SHA = 'f939b44db092e45832b56fd11213b182b89e4c23f2798f062ccd1f220d35162e';
const PIN_SLOTS = ['cover', 'controlSheet', 'signatureBlock', 'toc', 'chapter', 'appendix', 'ruleIndex'].map((t) => ({ slotKey: `s-${t}`, sectionType: t, tiers: [] as StudioTier[] }));

describe('EN preview sample: pemilihan bahasa dari data templat', () => {
  it('nilai draf terakhir menang, lalu nilai templat terresolusi, lalu ID', () => {
    expect(previewLanguageOf([], undefined)).toBe('ID');
    expect(previewLanguageOf([], 'EN')).toBe('EN');
    expect(previewLanguageOf([{ 'doc.language': 'ID' }], 'EN')).toBe('ID');
    expect(previewLanguageOf([{ 'doc.language': 'ID' }, { 'doc.language': 'EN' }], 'ID')).toBe('EN');
    expect(previewLanguageOf([undefined, { other: 1 }], 'EN')).toBe('EN');
    expect(previewLanguageOf([{ 'doc.language': 'FR' }], 'XX')).toBe('ID');
  });

  it('ID: contoh v1 dan v2 byte-identik dengan hari ini (pin hash)', () => {
    expect(sha(SAMPLE_DOCUMENT)).toBe(ID_V1_SHA);
    expect(sha(sampleDocumentFor('ID'))).toBe(ID_V1_SHA);
    expect(sha(sampleDocumentV2({ slug: 'x', tier: 'TERBIT', slots: PIN_SLOTS }))).toBe(ID_V2_SHA);
    expect(sha(sampleDocumentV2({ slug: 'x', tier: 'TERBIT', slots: PIN_SLOTS, language: 'ID' }))).toBe(ID_V2_SHA);
  });

  it('EN: contoh v1 dan v2 bebas string AC-6 dan kalimat contoh ID, angka format EN', () => {
    expect(sampleDocumentFor('EN')).toBe(SAMPLE_DOCUMENT_EN);
    for (const doc of [SAMPLE_DOCUMENT_EN, sampleDocumentV2({ slug: 'x', tier: 'TERBIT', slots: PIN_SLOTS, language: 'EN' })]) {
      const json = JSON.stringify(doc);
      for (const s of ID_SAMPLE_STRINGS) expect(wordHit(json, s), s).toBe(false);
      for (const s of AC6_CORE) expect(wordHit(json, s), s).toBe(false);
      expect(json).toContain('6,546.2 m');
      expect(json).toContain('3,120.0');
      expect(json).toContain('3,426.2');
    }
    expect(SAMPLE_DOCUMENT_EN.meta.language).toBe('EN');
  });

  it('EN: label depan yang tetap dikirim sama dengan tabel teks mesin (peran tanda tangan D-590)', () => {
    const doc = sampleDocumentV2({ slug: 'x', tier: 'TERBIT', slots: PIN_SLOTS, language: 'EN' }) as { sections: Record<string, { roles?: Array<{ role: { text: string } }> }> };
    expect(doc.sections['s-signatureBlock'].roles?.map((r) => r.role.text)).toEqual([FRONT_PAYLOAD_LABELS.made.EN, FRONT_PAYLOAD_LABELS.checked.EN, FRONT_PAYLOAD_LABELS.approved.EN]);
    // ID: literal hari ini = tabel teks mesin (satu sumber nilai, tanpa mengubah byte contoh ID).
    const id = sampleDocumentV2({ slug: 'x', tier: 'TERBIT', slots: PIN_SLOTS }) as { sections: Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(id.sections['s-signatureBlock'].roles.map((r: { role: { text: string } }) => r.role.text)).toEqual([FRONT_PAYLOAD_LABELS.made.ID, FRONT_PAYLOAD_LABELS.checked.ID, FRONT_PAYLOAD_LABELS.approved.ID]);
    expect(id.sections['s-controlSheet'].revisionHistory.rows[0].cells.map((c: { text: string }) => c.text)).toEqual([...CONTROL_SHEET_COLUMNS.revision.ID]);
  });
});

describe('EN preview sample: render HTML templat EN', () => {
  let PRESET: ResolvedTemplate;
  beforeAll(async () => {
    const r = await loadResolvedProfileFile(path.join(REPO, 'benchmark', 'manual000', 'template.json'), { repoRoot: REPO, withCanonicalAssets: true });
    const params = Object.fromEntries(Object.entries(r.template.params).filter(([k]) => !k.startsWith('lint.enforcement'))) as ParamMap;
    PRESET = { ...r.template, params };
  });

  /** Spec templat dari data (bahasa + slot lembar kendali), bukan slug. */
  const specOf = (lang: 'ID' | 'EN'): DerivedTemplateSpec =>
    DOC_TYPE_TEMPLATE_SPECS.find((s) => s.layer['doc.language'] === lang && s.slots.some((sl) => sl.sectionType === 'controlSheet') && s.slots.some((sl) => sl.sectionType === 'cover'))!;

  async function renderSample(lang: 'ID' | 'EN'): Promise<string> {
    const spec = specOf(lang);
    const derived = DERIVED_PRESET_SPECS.find((p) => p.slug === spec.presetSlug);
    const base = (derived ? { ...PRESET.params, ...derived.pins } : PRESET.params) as ParamMap;
    const plan = derivedTemplatePlan(spec, base as ParamRecord);
    const P = resolveParams({ base, overrides: plan.overrides, registry: ALL_PARAMS }).params;
    const tpl: ResolvedTemplate = { ...PRESET, templateId: `tpl-${spec.slug}`, versionId: `tv-${spec.slug}`, versionNo: 1, params: P };
    const slots: TemplateSlotDef[] = plan.slots;
    const skeleton = validateSkeleton({ slots });
    const skel: SkeletonInput = { templateVersionId: tpl.versionId, skeleton, skeletonSha256: skeletonSha256(skeleton), implicit: false };
    const tier = P['doc.defaultTier'] as StudioTier;
    const language = previewLanguageOf([], P['doc.language']);
    expect(language).toBe(lang);
    const sub = sampleDocumentV2({ slug: spec.slug, tier, slots, language }) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(validateV2Against('studio.doc/v2', sub)).toEqual([]);
    const meta = defaultMeta(sub.meta, P, { author: sub.meta.author, issueDate: '2026-10-01' });
    const empty = emptyResolvedDoc({ template: { slug: spec.slug, version: 1 }, meta, mission: { folder: 'pratinjau' }, docKey: 'pratinjau' });
    const merged = mergeSubmission(empty, { ...sub, template: { slug: spec.slug, version: 1 } } as never, { skeleton: skel, tier, pids: seededPidAllocator('en-preview') });
    const slotParams = Object.fromEntries(slots.map((s) => [s.slotKey, resolveSlotParams(tpl, s).params]));
    const composed = composeV2({ source: merged.doc, skeleton: skel, tier, params: P, slotParams });
    const resolvedSlots = resolveSkeletonSlots(tpl, slots, undefined, { tier }).slots;
    const { ctx } = makeCtx(composed.snapshot as unknown as NormDocSnapshot, tpl, { slots: resolvedSlots });
    return assembleHtml(ctx, { preview: true });
  }

  /** Teks yang terlihat: tanpa style/tag, entitas dasar didekode. */
  const visibleText = (html: string) =>
    html
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&#160;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ');

  it('templat EN: tanpa string AC-6 maupun kalimat contoh ID; angka EN; teks contoh EN tampil', async () => {
    const text = visibleText(await renderSample('EN'));
    for (const s of ID_SAMPLE_STRINGS) expect(wordHit(text, s), s).toBe(false);
    for (const s of AC6_CORE) expect(wordHit(text, s), s).toBe(false);
    expect(text).toContain('6,546.2 m');
    expect(text).toContain('3,120.0');
    expect(text).toContain('3,426.2');
    expect(text).toContain('Scope of work');
    expect(text).toContain('Prepared by');
  }, 120_000);

  it('templat ID: contoh ID tetap dipakai (kontrol)', async () => {
    const text = visibleText(await renderSample('ID'));
    expect(text).toContain('Ruang lingkup pekerjaan');
    expect(text).toContain('6.546,2 m');
  }, 120_000);
});
