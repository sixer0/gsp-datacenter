// UI-04 (review UI-03 `gateway_check/17_review_ui.md`, D-464): perbaikan teks/label UI.
// H-1 daftar isi, M-1 satuan, M-2 ID mentah, M-3 klaim pemberitahuan admin, M-4 teks tepi sampul,
// L-1 istilah, L-3 aria bilah kelengkapan. Hanya teks: kunci dan nilai simpan tidak berubah.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { derivedUnit, paramDisplayLabel } from '@/components/studio/template-editor/param-labels';
import { unitOf } from '@/components/studio/template-editor/values';
import { editabilityOf } from '@/components/studio/template-editor/model';
import { actorLabel, actorLabelWithId, rawIdTitle, withRawId } from '@/components/studio/shared/labels';
import { railAriaLabel, type RailSegment } from '@/components/studio/shared/completeness-rail';
import { ESSENTIAL_KNOBS } from '@/lib/studio/registry/essentials';
import { ALL_PARAMS, PARAMS_BY_KEY } from '@/lib/studio/params';

const ROOT = join(__dirname, '..', '..', '..', '..');
const src = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');
const knob = (id: string) => ESSENTIAL_KNOBS.find((k) => k.id === id)!;

describe('H-1: daftar isi = bentuk daftar, bukan ada/tidaknya nomor halaman', () => {
  it('kenop dan registri tidak lagi menyebut "tanpa nomor halaman"; nilai simpan tetap field/static', () => {
    const k = knob('EK-toc-01');
    expect(k.keys).toEqual(['render.toc.mode']);
    expect(k.options?.map((o) => o.value)).toEqual(['field', 'static']);
    const texts = [k.label, k.help ?? '', ...(k.options ?? []).map((o) => o.label)];
    for (const t of texts) expect(t).not.toMatch(/tanpa nomor halaman|Nomor halaman daftar isi/i);
    expect(k.label).toBe('Bentuk daftar isi di Word');
    expect(PARAMS_BY_KEY.get('render.toc.mode')?.label).toBe(k.label);
    expect(PARAMS_BY_KEY.get('render.toc.mode')?.enum).toEqual(['field', 'static']);
  });

  it('bantuan menyatakan kedua bentuk memuat kolom nomor halaman (pages.ts staticTocTable + fieldTocXml)', () => {
    const k = knob('EK-toc-01');
    expect(k.help).toMatch(/Keduanya memuat kolom nomor halaman/);
    expect(k.options?.find((o) => o.value === 'static')?.label).toMatch(/nomor halaman dari rujukan judul/);
    expect(k.options?.find((o) => o.value === 'field')?.label).toMatch(/nomor halaman ikut diperbarui/);
  });
});

describe('M-1: satuan tidak hilang untuk tipe tanpa satuan', () => {
  it('page.customSizeMm (pair) mempertahankan "(mm)"; satuan turunan = mm', () => {
    const d = PARAMS_BY_KEY.get('page.customSizeMm')!;
    expect(unitOf(d.type)).toBe('');
    expect(paramDisplayLabel(d.key, d.label, unitOf(d.type))).toBe('Ukuran kertas kustom (mm)');
    expect(derivedUnit(d.key, d.label)).toBe('mm');
  });

  it('tipe bersatuan tetap dibuang akhirannya (satuan tampil di samping kontrol)', () => {
    expect(paramDisplayLabel('grid.evidenceRailMm', 'Lebar kolom catatan bukti (mm)', 'mm')).toBe('Lebar kolom catatan bukti');
    expect(paramDisplayLabel('device.spine.rotationDeg', 'Putaran teks tepi sampul (derajat)', '°')).toBe('Putaran teks tepi sampul');
    // Panel lanjutan (nilai mentah tanpa satuan) -> akhiran dipertahankan.
    expect(paramDisplayLabel('grid.evidenceRailMm', 'Lebar kolom catatan bukti (mm)', null)).toBe('Lebar kolom catatan bukti (mm)');
  });

  it('probe registri: 0 label kehilangan satuan di editor (sebelumnya 12)', () => {
    const RE = /\((mm|pt|%|em|deg|derajat|px|tw|x)\)\s*$/i;
    const withSuffix = ALL_PARAMS.filter((d) => RE.test(d.label));
    expect(withSuffix.length).toBeGreaterThan(0);
    const lost = withSuffix.filter((d) => {
      const shown = unitOf(d.type);
      const label = paramDisplayLabel(d.key, d.label, shown);
      return !RE.test(label) && !shown;
    });
    expect(lost.map((d) => d.key)).toEqual([]);
  });

  it('satuan turunan dari kunci bila label tanpa akhiran', () => {
    expect(derivedUnit('diagram.dashPatternMm.dashed', 'Pola')).toBe('mm');
    expect(derivedUnit('rules.diagramFillHatchDeg', null)).toBe('°');
    expect(derivedUnit('doc.title', 'Judul')).toBe('');
  });
});

describe('M-2: ID mentah agen/misi tetap terjangkau', () => {
  it('rawIdTitle/withRawId/actorLabelWithId', () => {
    expect(rawIdTitle('agent:hermes-gsp-master01')).toBe('ID: agent:hermes-gsp-master01');
    expect(rawIdTitle('  ')).toBeUndefined();
    expect(actorLabelWithId('agent:hermes-gsp-master01')).toBe(`${actorLabel('agent:hermes-gsp-master01')} (ID: agent:hermes-gsp-master01)`);
    expect(withRawId('budi', 'budi')).toBe('budi');
    expect(actorLabel('agent:analis-01')).toBe('Agen analis-01');
  });

  it('dua ID yang hanya beda prefiks hermes- tetap dapat dibedakan lewat ID', () => {
    const a = actorLabelWithId('agent:hermes-gsp-master01');
    const b = actorLabelWithId('agent:gsp-master01');
    expect(actorLabel('agent:hermes-gsp-master01')).toBe(actorLabel('agent:gsp-master01'));
    expect(a).not.toBe(b);
  });

  it('alasan baca-saja templat orang lain memuat ID pembuat', () => {
    const t = { createdBy: 'agent:hermes-gsp-master01', isPreset: false, isCanonical: false, restricted: false } as unknown as Parameters<typeof editabilityOf>[0];
    const e = editabilityOf(t, { isAdmin: false, username: 'budi' }, false);
    expect(e.reason).toContain('ID: agent:hermes-gsp-master01');
  });

  it('setiap permukaan nama pelaku/misi membawa ID mentah (ActorName/MissionName/rawIdTitle/withRawId)', () => {
    const surfaces: Array<[string, RegExp]> = [
      ['src/components/studio/template-editor/version-history.tsx', /<ActorName by=\{v\.createdBy\}/],
      ['src/components/studio/template-editor/template-list.tsx', /<ActorName by=\{t\.createdBy\}/],
      ['src/components/studio/document-viewer/reader/paragraph-history.tsx', /<ActorName by=\{e\.by\}/],
      ['src/components/studio/shared/completeness-rail.tsx', /actorLabelWithId\(seg\.by\)/],
      ['src/components/studio/document-viewer/completeness-tab.tsx', /actorLabelWithId\(p\.by\)/],
      ['src/components/studio/document-viewer/completeness-tab.tsx', /title=\{s\.state === "AUTO_READY" \? undefined : rawIdTitle\(s\.lastFilledBy\)\}/],
      ['src/components/studio/document-viewer/history-tab.tsx', /title=\{rawIdTitle\(r\.createdBy\)\}/],
      ['src/components/studio/artifact-gallery/gallery.tsx', /<MissionName folder=\{item\.missionFolder\}/],
      ['src/components/studio/document-viewer/studio-home.tsx', /<MissionName folder=\{doc\.missionFolder\}/],
      ['src/components/studio/playground/panels.tsx', /<MissionName folder=\{doc\.missionFolder\}/],
      ['src/components/studio/playground/playground.tsx', /withRawId\(missionLabel\(target\.missionFolder\)/],
    ];
    for (const [file, re] of surfaces) expect(src(file), file).toMatch(re);
  });
});

describe('M-3: tanpa klaim pemberitahuan admin', () => {
  it('teks tidak lagi menyatakan "Admin sudah diberi tahu"', () => {
    for (const f of ['src/components/studio/render-status/index.tsx', 'src/components/studio/document-viewer/studio-home.tsx']) {
      const s = src(f);
      expect(s, f).not.toMatch(/diberi tahu/);
      expect(s, f).toMatch(/Status ini juga tampil untuk admin di halaman Sistem/);
    }
  });
});

describe('M-4: teks tepi sampul sesuai medan dan penempatan (page.ts P4S-24/25)', () => {
  it('bantuan menyebut medan nyata (tanpa "nomor") dan halaman pembatas', () => {
    const k = knob('EK-cover-06');
    expect(k.keys).toEqual(['device.spine.enabled']);
    expect(k.help).not.toMatch(/nomor/);
    const fields = PARAMS_BY_KEY.get('device.spine.fields')?.enum ?? [];
    expect(fields).toEqual(['jenis', 'subjek', 'bahasa', 'revisi', 'bulan', 'tahun']);
    for (const f of ['subjek', 'bahasa', 'revisi', 'bulan', 'tahun']) expect(k.help).toContain(f);
    expect(k.help).toMatch(/pembatas/);
  });
});

describe('L-1: satu istilah per perangkat', () => {
  it('label registri tidak lagi mencampur Datum Rule / Rel bukti / string punggung / Wajah huruf', () => {
    const keys = [
      'device.datumRule.weightMm', 'device.datumRule.ticks', 'device.datumRule.frontSegmentMm', 'device.datumRule.placements',
      'cover.datumRule.widthMm', 'chapter.datumRule.onlyAboveChapterTitle',
      'grid.evidenceRailMm', 'device.evidenceRail.enabled', 'device.evidenceRail.contents', 'device.evidenceRail.emptyAllowed',
      'device.spine.face', 'device.spine.sizePt', 'device.spine.rotationDeg', 'device.spine.fields', 'device.spine.placements',
      'type.face.condensed', 'type.face.mono', 'cover.kicker.colour',
    ];
    for (const key of keys) {
      const l = PARAMS_BY_KEY.get(key)?.label ?? '';
      expect(l, key).not.toMatch(/Datum Rule|Rel bukti|rel bukti|string punggung|Wajah huruf|kicker/);
    }
  });
});

describe('L-3: aria-label bilah = hitungan bagian wajib', () => {
  it('opsional kosong tidak dihitung kurang', () => {
    const seg = (key: string, state: RailSegment['state'], required: boolean): RailSegment => ({ key, slotKey: key, label: key, state, required, by: null, at: null });
    const label = railAriaLabel([seg('a', 'FILLED', true), seg('b', 'AUTO_READY', true), seg('c', 'OPTIONAL_EMPTY', false)]);
    expect(label).toBe('2 dari 2 bagian wajib terisi, 1 opsional kosong');
  });
});
