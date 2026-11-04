/**
 * S26 (blueprint 02_structured_datum_rev_a.md; register research/31 §1-§3; D-594, D-595, D-598 F-3/F-6):
 * tabel spec 10 templat jenis dokumen DATUM Rev A (ID + EN) di `prisma/seed-doc-type-templates.ts`.
 *
 * Seam: ekspor modul tabel spec (data murni, tanpa DB) yang diiterasi `--doc-type-templates` (S27).
 * Nilai harapan = register S01 (`research/31` §1, §3.1, §3.3, §3.5, §6), ditulis literal di sini sebagai
 * sumber independen, bukan dihitung ulang dari modul.
 */
import { describe, expect, it } from 'vitest';
import { validateParamValue } from '@/lib/studio/engine/tokens';
import { PARAMS_BY_KEY } from '@/lib/studio/params';
import { contractRecordSkeletonIssues } from '@/lib/studio/registry/slots';
import { validateSkeleton } from '@/lib/studio/services/skeleton';
import { checkTemplateWrite } from '@/lib/studio/services/skeleton/access';
import { canonicalVersionPayload, type ParamRecord } from '@/lib/studio/services/templates';
import type { ParamValue } from '@/lib/studio/contract';
import { ADMIN_CALLER, DATUM_SKELETON_SLOTS, derivedTemplatePlan } from '../../../../prisma/seed-studio-templates';
import {
  DOC_TYPE_LAYERS,
  DOC_TYPE_TEMPLATE_SPECS,
  LANGUAGE_LAYERS,
  docTypeTemplateSpecJson,
} from '../../../../prisma/seed-doc-type-templates';

/** research/31 §1: slug, nama, bahasa, kode, tier bawaan, kicker. */
const REGISTER = [
  ['datum-proposal-teknis', 'Proposal Teknis (DATUM Rev A)', 'ID', 'PT', 'SERAH', 'PROPOSAL TEKNIS'],
  ['datum-proposal-teknis-en', 'Technical Proposal (DATUM Rev A, EN)', 'EN', 'PT', 'SERAH', 'TECHNICAL PROPOSAL'],
  ['datum-laporan', 'Laporan (DATUM Rev A)', 'ID', 'LAP', 'TERBIT', 'LAPORAN'],
  ['datum-laporan-en', 'Report (DATUM Rev A, EN)', 'EN', 'LAP', 'TERBIT', 'REPORT'],
  ['datum-laporan-verifikasi', 'Laporan Verifikasi dan Uji (DATUM Rev A)', 'ID', 'VER', 'TERBIT', 'LAPORAN VERIFIKASI'],
  ['datum-laporan-verifikasi-en', 'Verification and Test Report (DATUM Rev A, EN)', 'EN', 'VER', 'TERBIT', 'VERIFICATION REPORT'],
  ['datum-standar', 'Standar (DATUM Rev A)', 'ID', 'STD', 'TERBIT', 'STANDAR'],
  ['datum-standar-en', 'Standard (DATUM Rev A, EN)', 'EN', 'STD', 'TERBIT', 'STANDARD'],
  ['datum-nota', 'Nota Internal (DATUM Rev A)', 'ID', 'NOT', 'NOTA', 'NOTA INTERNAL'],
  ['datum-nota-en', 'Internal Note (DATUM Rev A, EN)', 'EN', 'NOT', 'NOTA', 'INTERNAL NOTE'],
] as const;

/** research/31 §3.1: daftar tertutup Rev A (Tabel 3.1 kolom kiri lalu kanan), tanpa DS, dengan NDA. */
const REV_A_TYPE_CODES = ['PT', 'KT', 'RAB', 'SPH', 'SP', 'BA', 'NDA', 'DEK', 'LAP', 'MAT', 'STD', 'NOT', 'MOD', 'VER'];

/** research/31 §3.3 + `seed-studio.ts` kerangka datum-gsp: label slot per bahasa. */
const LABELS = {
  ID: { cover: 'Sampul', controlSheet: 'Lembar Kendali', signature: 'Tanda Tangan', toc: 'Daftar Isi', content: 'Isi', references: 'Referensi', ruleIndex: 'Indeks Aturan', appendices: 'Lampiran' },
  EN: { cover: 'Cover', controlSheet: 'Control Sheet', signature: 'Signatures', toc: 'Contents', content: 'Content', references: 'References', ruleIndex: 'Rule Index', appendices: 'Appendices' },
} as const;

/** research/31 §6: daftar inti AC-6 (kritis CR-4). */
const AC6_CORE = ['Lembar Kendali', 'KLASIFIKASI', 'SALINAN INDUK', 'TERBITAN', 'Tanggal', 'Uraian', 'Oleh', 'Pemegang', 'LEMBAR', 'Penyusun', 'Rp'];

const DATUM_SECTION_TYPES = ['cover', 'controlSheet', 'signatureBlock', 'toc', 'chapter', 'sourceRegister', 'appendix'];
const STD_SECTION_TYPES = ['cover', 'controlSheet', 'signatureBlock', 'toc', 'chapter', 'sourceRegister', 'ruleIndex', 'appendix'];

const EFFECTIVE = canonicalVersionPayload().resolvedParams as ParamRecord;

/** Semua string di dalam nilai (rekursif). */
function stringsOf(v: unknown): string[] {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(stringsOf);
  if (v !== null && typeof v === 'object') return Object.values(v).flatMap(stringsOf);
  return [];
}

const withoutLabelPosition = (o: object) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'label' && k !== 'position'));

const wordHit = (text: string, token: string) => new RegExp(`(?<![\\p{L}\\p{N}])${token.replace(/ /g, '[ \\u00A0]')}(?![\\p{L}\\p{N}])`, 'u').test(text);

describe('S26 tabel spec templat jenis dokumen DATUM Rev A', () => {
  it('10 slug unik, urutan dan nilai = register research/31 §1', () => {
    const slugs = DOC_TYPE_TEMPLATE_SPECS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(10);
    expect(slugs).toEqual(REGISTER.map((r) => r[0]));
    for (const [slug, name, lang, code, tier, kicker] of REGISTER) {
      const s = DOC_TYPE_TEMPLATE_SPECS.find((x) => x.slug === slug)!;
      expect(s.name, slug).toBe(name);
      expect(s.presetSlug, slug).toBe('datum-gsp-preset');
      expect(s.contractKind, slug).toBeNull();
      // D-602: entitas kolofon kapital (ID:20, CV-16) = parameter templat `org.entityName`, lapis bersama.
      // G-FIX1 (D-606): rel bukti 32 mm selalu tampil (GF-24, EN:2764, ID:2711 "Rel yang kosong itu benar") dan
      // zebra tidak pernah menyala (GF-17, DT-11b ID:2749-2754 "tanpa zebra"): parameter templat yang sudah ada.
      expect(s.layer, slug).toEqual({
        'doc.defaultTypeCode': code,
        'doc.defaultTier': tier,
        'doc.typeCode': REV_A_TYPE_CODES,
        'doc.language': lang,
        'org.entityName': 'PT GEMILANG SATRIA PERKASA',
        'layout.railMode': 'A',
        'table.zebra.minRows': 1000,
      });
      // D-602 adendum 2 (kalibrasi S25 TR-03/TR-08): daftar isi = medan TOC Word, kenop slot toc bersama.
      expect(s.slotOverrides, slug).toEqual({ toc: { 'render.toc.mode': 'field' }, cover: { 'cover.kicker.text': kicker } });
    }
  });

  it('disusun dari 5 lapis jenis x 2 lapis bahasa (bukan 10 salinan tertulis)', () => {
    expect(DOC_TYPE_LAYERS).toHaveLength(5);
    expect(LANGUAGE_LAYERS.map((l) => l.language)).toEqual(['ID', 'EN']);
    expect(DOC_TYPE_TEMPLATE_SPECS).toHaveLength(DOC_TYPE_LAYERS.length * LANGUAGE_LAYERS.length);
    for (const l of LANGUAGE_LAYERS) expect(DOC_TYPE_TEMPLATE_SPECS.filter((s) => s.layer['doc.language'] === l.language)).toHaveLength(5);
  });

  it('pita segel, cap terbit, judul daftar isi, dan kicker bab tidak ditimpa templat (research/31 §3.4, F-6)', () => {
    for (const s of DOC_TYPE_TEMPLATE_SPECS) {
      const keys = [...Object.keys(s.layer), ...Object.values(s.slotOverrides ?? {}).flatMap((o) => Object.keys(o))];
      for (const k of ['wrapper.header', 'device.issueStamp.format', 'render.toc.title', 'chapter.kicker.pattern', 'device.registerBlock.cells']) expect(keys, s.slug).not.toContain(k);
    }
  });

  it('jenis slot = kerangka datum-gsp; STD + ruleIndex AUTO opsional sebelum lampiran; posisi 1..n', () => {
    for (const s of DOC_TYPE_TEMPLATE_SPECS) {
      const isStd = s.layer['doc.defaultTypeCode'] === 'STD';
      expect(s.slots.map((x) => x.sectionType), s.slug).toEqual(isStd ? STD_SECTION_TYPES : DATUM_SECTION_TYPES);
      expect(s.slots.map((x) => x.position), s.slug).toEqual(s.slots.map((_, i) => i + 1));
      // Selain label dan posisi, slot kerangka = slot datum-gsp apa adanya.
      for (const base of DATUM_SKELETON_SLOTS) {
        const slot = s.slots.find((x) => x.slotKey === base.slotKey)!;
        expect(withoutLabelPosition(slot), `${s.slug}/${base.slotKey}`).toEqual(withoutLabelPosition(base));
      }
      if (isStd) {
        const ri = s.slots.find((x) => x.slotKey === 'ruleIndex')!;
        expect(ri).toMatchObject({ sectionType: 'ruleIndex', required: false, positionLocked: false, repeatable: false, contentMode: 'AUTO', tiers: [], admits: [] });
      } else expect(s.slots.some((x) => x.slotKey === 'ruleIndex'), s.slug).toBe(false);
    }
  });

  it('label slot per bahasa = register §3.3', () => {
    for (const s of DOC_TYPE_TEMPLATE_SPECS) {
      const lang = s.layer['doc.language'] as 'ID' | 'EN';
      for (const slot of s.slots) expect(slot.label, `${s.slug}/${slot.slotKey}`).toBe(LABELS[lang][slot.slotKey as keyof (typeof LABELS)['ID']]);
    }
  });

  it('lapis EN bebas string inti AC-6 (nama, deskripsi, label, kicker, nilai lapis)', () => {
    const en = DOC_TYPE_TEMPLATE_SPECS.filter((s) => s.layer['doc.language'] === 'EN');
    expect(en).toHaveLength(5);
    for (const s of en) {
      const texts = stringsOf({ name: s.name, description: s.description, labels: s.slots.map((x) => x.label), layer: s.layer, over: s.slotOverrides, note: s.changeNote({ presetVersionNo: 2, slotCount: s.slots.length }) });
      for (const t of texts) for (const token of AC6_CORE) expect(wordHit(t, token), `${s.slug}: "${t}" memuat ${token}`).toBe(false);
    }
    // Kontrol detektor: label ID memang tertangkap.
    expect(wordHit('Lembar Kendali', 'Lembar Kendali')).toBe(true);
  });

  it('nilai lapis dan override sah menurut registri (NDA diterima, S11); tidak ada kunci baru', () => {
    for (const s of DOC_TYPE_TEMPLATE_SPECS) {
      for (const [k, v] of [...Object.entries(s.layer), ...Object.values(s.slotOverrides ?? {}).flatMap((o) => Object.entries(o))]) {
        const def = PARAMS_BY_KEY.get(k);
        expect(def, `${s.slug}: ${k}`).toBeDefined();
        expect(validateParamValue(def!, v as ParamValue), `${s.slug}: ${k}`).toBeNull();
      }
    }
  });

  it('rencana seed murni lolos validasi kerangka dan CH-06; kicker masuk kenop slot cover', () => {
    for (const s of DOC_TYPE_TEMPLATE_SPECS) {
      const plan = derivedTemplatePlan(s, EFFECTIVE);
      expect(() => validateSkeleton({ slots: plan.slots }), s.slug).not.toThrow();
      expect(contractRecordSkeletonIssues(plan.slots, s.contractKind), s.slug).toEqual([]);
      expect(plan.slots.find((x) => x.slotKey === 'cover')!.essentials['cover.kicker.text'], s.slug).toBe(s.slotOverrides!.cover['cover.kicker.text']);
      expect(plan.slots.find((x) => x.slotKey === 'toc')!.essentials['render.toc.mode'], s.slug).toBe('field');
      for (const [k, v] of Object.entries(s.layer)) expect(plan.overrides[k], `${s.slug}: ${k}`).toEqual(v);
    }
  });

  it('G-FIX1 (D-606): rel A dan ambang zebra = parameter yang sudah ada; seed ADMIN boleh menulisnya, USER tidak (zebra kelas K)', () => {
    const target = { isPreset: false, restricted: false, slug: 'datum-laporan' };
    const change = (key: string) => ({ key, value: DOC_TYPE_TEMPLATE_SPECS[0].layer[key] as ParamValue, previous: undefined });
    for (const key of ['layout.railMode', 'table.zebra.minRows']) {
      expect(PARAMS_BY_KEY.get(key), key).toBeDefined();
      expect(() => checkTemplateWrite(ADMIN_CALLER, target, [change(key)]), key).not.toThrow();
    }
    expect(PARAMS_BY_KEY.get('table.zebra.minRows')!.class).toBe('K');
    expect(() => checkTemplateWrite({ kind: 'USER_SESSION' }, target, [change('table.zebra.minRows')])).toThrow(/kelas K|ADMINISTRATOR/);
    // Bawaan registri tidak berubah (templat lama tetap auto dan zebra di atas 12 baris).
    expect(PARAMS_BY_KEY.get('layout.railMode')!.default).toBe('auto');
    expect(PARAMS_BY_KEY.get('table.zebra.minRows')!.default).toBe(12);
  });

  it('ekspor JSON --spec NU-03 (bentuk benchmark/datum_conformance/rules/language.ts): 10 baris = register', () => {
    const j = docTypeTemplateSpecJson();
    expect(j.schema).toBe('datum-template-spec/v1');
    expect(j.templates.map((t) => t.slug)).toEqual(REGISTER.map((r) => r[0]));
    for (const [slug, , lang, code, tier, kicker] of REGISTER) {
      expect(j.templates.find((t) => t.slug === slug)!.params).toEqual({
        'doc.typeCode': REV_A_TYPE_CODES,
        'doc.defaultTypeCode': code,
        'doc.defaultTier': tier,
        'doc.language': lang,
        'cover.kicker.text': kicker,
      });
    }
    // JSON murni (dapat ditulis ke berkas --spec apa adanya).
    expect(JSON.parse(JSON.stringify(j))).toEqual(j);
  });
});
