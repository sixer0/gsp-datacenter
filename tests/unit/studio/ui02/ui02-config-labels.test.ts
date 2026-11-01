// UI-02 (audit UI-01 §3, L01-L11, L20-L28, L31, L35, UA-M01, UA-M05): format jarak baris,
// label konfigurasi templat, skala pratinjau, ringkasan kelengkapan.
import { describe, expect, it } from 'vitest';
import { formatLineSpacing, lineSpacingUnit, roleEnumLabel } from '@/components/studio/template-editor/role-format-labels';
import { enumOptionLabel, namespaceLabel, pairLabels, paramDisplayLabel, rangeText } from '@/components/studio/template-editor/param-labels';
import { knobValueLabel } from '@/components/studio/template-editor/model';
import { fitZoom, maxPageWidthMm, previewSrcDoc } from '@/components/studio/template-preview/preview-html';
import { progressText, requiredProgress } from '@/components/studio/shared/completeness-text';
import { ESSENTIAL_KNOBS } from '@/lib/studio/registry/essentials';
import { PARAMS_BY_KEY } from '@/lib/studio/params';

describe('jarak baris per lineRule (L26)', () => {
  it('auto: kelipatan per 240 (240 = 1,0 baris, bukan 12 pt)', () => {
    expect(formatLineSpacing(240, 'auto')).toBe('1,0 baris');
    expect(formatLineSpacing(360, 'auto')).toBe('1,5 baris');
    expect(formatLineSpacing(276, 'auto')).toBe('1,15 baris');
    // aturan tidak ditulis = Word memakai auto
    expect(formatLineSpacing(480, undefined)).toBe('2,0 baris');
  });

  it('exact/atLeast: poin', () => {
    expect(formatLineSpacing(240, 'exact')).toBe('tepat 12 pt');
    expect(formatLineSpacing(283, 'atLeast')).toBe('minimal 14,15 pt');
  });

  it('satuan di samping kotak mengikuti aturan', () => {
    expect(lineSpacingUnit('auto')).toBe('per 240 = 1 baris');
    expect(lineSpacingUnit('exact')).toBe('tw (1/20 pt)');
  });

  it('opsi enum format per peran berbahasa Indonesia (L27, L28, L31, L35)', () => {
    expect(roleEnumLabel('lineRule', 'atLeast')).toBe('Minimal');
    expect(roleEnumLabel('jc', 'both')).toBe('Rata kiri-kanan');
    expect(roleEnumLabel('faceRole', 'mono')).toBe('Data (mono)');
    expect(roleEnumLabel('vertAlign', 'superscript')).toBe('Superskrip');
    expect(roleEnumLabel('tidakAda', 'x')).toBe('x');
  });
});

describe('label kenop esensial (L01, L05, L07-L10)', () => {
  const byId = new Map(ESSENTIAL_KNOBS.map((k) => [k.id, k]));
  it('label baru tanpa jargon', () => {
    expect(byId.get('EK-G08')?.label).toBe('Kolom catatan bukti');
    expect(byId.get('EK-cover-06')?.label).toBe('Tampilkan teks tepi sampul');
    expect(byId.get('EK-chapter-02')?.label).toBe('Garis penanda di atas judul bab');
    expect(byId.get('EK-appendix-03')?.label).toBe('Garis penanda di atas judul lampiran');
    expect(byId.get('EK-chapter-07')?.label).toBe('Kepala halaman di halaman bab');
    expect(byId.get('EK-chapter-04')?.label).toBe('Lebar grafik');
  });

  it('opsi Kolom catatan bukti menjelaskan efek (nilai simpan tetap auto/A/B)', () => {
    const k = byId.get('EK-G08');
    expect(k?.options?.map((o) => o.value)).toEqual(['auto', 'A', 'B']);
    expect(k?.options?.map((o) => o.label)).toEqual([
      'Otomatis (muncul bila ada sitasi per paragraf)',
      'Selalu tampil (kolom catatan bukti di margin)',
      'Tidak tampil (teks lebih lebar)',
    ]);
  });

  it('daftar isi: tanpa istilah "Medan"', () => {
    const k = byId.get('EK-toc-01');
    expect(k?.options?.map((o) => o.value)).toEqual(['field', 'static']);
    for (const o of k?.options ?? []) expect(o.label).not.toMatch(/Medan|statis/);
  });

  it('warna aksen tampil dengan "#" (UA-m10)', () => {
    const k = byId.get('EK-G04');
    expect(k && knobValueLabel(k, 'b45309')).toBe('#B45309');
    expect(k && knobValueLabel(k, '#B45309')).toBe('#B45309');
  });
});

describe('satu label per kunci (L21) dan label parameter (L20, L23-L25)', () => {
  it('label registri = label kenop esensial untuk kunci 1:1', () => {
    for (const id of ['EK-G02', 'EK-G04', 'EK-G07', 'EK-G08', 'EK-cover-06', 'EK-cover-07', 'EK-toc-01', 'EK-chapter-01', 'EK-chapter-04']) {
      const knob = ESSENTIAL_KNOBS.find((k) => k.id === id)!;
      expect(PARAMS_BY_KEY.get(knob.keys[0])?.label, id).toBe(knob.label);
    }
  });

  it('akhiran satuan dibuang dari label (satuan dari tipe)', () => {
    expect(paramDisplayLabel('grid.evidenceRailMm', 'Rel bukti (mm)')).toBe('Rel bukti');
    expect(paramDisplayLabel('vat.rate', 'Tarif nominal PPN (%)')).toBe('Tarif nominal PPN');
    expect(paramDisplayLabel('x.y', '')).toBe('x.y');
  });

  it('opsi enum berlabel dari kenop esensial', () => {
    expect(enumOptionLabel('page.orientation', 'landscape')).toBe('Mendatar');
    expect(enumOptionLabel('grid.marginDensity', 'compact')).toBe('Rapat');
    expect(enumOptionLabel('layout.railMode', 'B')).toBe('Tidak tampil (teks lebih lebar)');
    expect(enumOptionLabel('tidak.ada', 'nilai')).toBe('nilai');
  });

  it('pasangan ukuran = Lebar/Tinggi; rentang tanpa simbol tak terbatas', () => {
    expect(pairLabels('page.customSizeMm')).toEqual(['Lebar', 'Tinggi']);
    expect(pairLabels('brief.slideSizeMm')).toEqual(['Lebar', 'Tinggi']);
    expect(rangeText({ min: 1, max: 90 }, 'mm')).toBe('1-90 mm');
    expect(rangeText({ min: 1 }, null)).toBe('minimal 1');
    expect(rangeText({ max: 90 }, 'pt')).toBe('maksimal 90 pt');
    expect(rangeText({}, 'pt')).toBeNull();
    expect(namespaceLabel('grid')).toBe('Kisi dan margin');
    expect(namespaceLabel('zzz')).toBe('zzz');
  });
});

describe('skala pratinjau agar muat (UA-M01)', () => {
  const html = '<section data-unit="cover" data-page-mm="210 297"></section><section data-unit="appendix" data-page-mm="297 210"></section>';
  it('lebar halaman terlebar dari data-page-mm (mendatar ikut)', () => {
    expect(maxPageWidthMm(html)).toBe(297);
    expect(maxPageWidthMm('<p>tanpa unit</p>')).toBeNull();
  });

  it('faktor skala <= 1, dibulatkan ke bawah per 0,01', () => {
    // A4 210 mm = 793,7 px; panel 368 px -> 0,46
    expect(fitZoom(368, 210)).toBe(0.46);
    expect(fitZoom(2000, 210)).toBe(1);
    expect(fitZoom(0, 210)).toBe(1);
    expect(fitZoom(400, null)).toBe(1);
  });

  it('tanpa unit dan tanpa skala -> HTML apa adanya', () => {
    expect(previewSrcDoc(html, null, 1)).toBe(html);
  });
});

describe('satu indikator kelengkapan (UA-M05)', () => {
  it('bagian opsional kosong disebut, tidak dihitung kurang', () => {
    const segs = [
      ...Array.from({ length: 6 }, () => ({ state: 'FILLED' as const, required: true })),
      { state: 'OPTIONAL_EMPTY' as const, required: false },
    ];
    const p = requiredProgress(segs);
    expect(p).toEqual({ requiredDone: 6, requiredTotal: 6, optionalDone: 0, optionalEmpty: 1 });
    expect(progressText(p)).toBe('6/6 bagian wajib terisi · 1 opsional kosong');
  });

  it('tanpa opsional kosong -> hanya bagian wajib', () => {
    expect(progressText(requiredProgress([{ state: 'FILLED', required: true }, { state: 'EMPTY', required: true }]))).toBe('1/2 bagian wajib terisi');
  });
});
