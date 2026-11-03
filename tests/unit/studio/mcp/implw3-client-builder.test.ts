// IMPL-W3 butir 5, 8-13 (dokumen klien, murni): nomor bab eksplisit dihormati, nomor sumber sub-judul dibuang (mesin
// menomori), prefiks "Gambar N.M"/"Tabel N.M" di caption dibuang, sumber TIDAK dikarang, revisi pendek + teks penuh di
// catatan, satuan hanya dari agen (caption/unit -> metadata kolom, tanpa kolom baru), wrap keras digabung, semua isu
// yang tidak dapat diperbaiki dalam SATU jawaban.
/* eslint-disable @typescript-eslint/no-explicit-any -- payload bebas bentuk */
import { describe, it, expect } from 'vitest';
import { buildClient } from '../../../../scripts/studio/mcp/write-client';

const META = { title: 'Kajian', author: 'Tim Riset' };
const build = (sections: any[], meta: Record<string, string> = META) => buildClient({ meta, title: null, sections, today: '2026-11-03' });
const codes = (b: { warnings: Array<{ code: string }> }) => b.warnings.map((w) => w.code);
const text = (h: any): string => (typeof h?.text === 'string' ? h.text : (h?.runs ?? []).map((r: any) => r.t).join(''));
const SRC = 'Data lapangan 2026';

describe('butir 8: penomoran bab dan sub-judul', () => {
  it('nomor bab eksplisit dihormati walau ada bagian tanpa nomor di depannya (tanpa CHAPTER_RENUMBERED)', () => {
    const b = build([
      { heading: 'Ringkasan Eksekutif', blocks: ['ringkas'] },
      { heading: '4. Konsep Produk', blocks: [{ subheading: '1.1 Product concept' }, 'isi'] },
      { heading: '5. Analisis', blocks: ['analisis'] },
    ]);
    const keys = b.chapters.map((c: any) => c.key);
    expect(keys).toContain('4');
    expect(keys).toContain('5');
    expect(codes(b)).not.toContain('CHAPTER_RENUMBERED');
    const ch4 = b.chapters.find((c: any) => c.key === '4') as any;
    expect(ch4.sections.map((s: any) => text(s.title))).toContain('Product concept');
    expect(JSON.stringify(b.chapters)).not.toContain('1.1 Product');
    expect(codes(b)).toContain('SUBHEADING_NUMBER_STRIPPED');
  });
});

describe('butir 9: prefiks nomor caption dibuang', () => {
  it.each(['Gambar 6.1 Kesiapan gardu', 'Gambar 6.1: Kesiapan gardu', 'Figure 3 - Kesiapan gardu', 'Tabel 2.1 – Kesiapan gardu'])('%s', (cap) => {
    const b = build([{ heading: '6. Hasil', blocks: [{ chart: { categories: ['A', 'B'], series: [{ name: 'MW', values: [1, 2] }], caption: cap, source: SRC, unit: 'MW' } }, { table: [['Gardu', 'Daya (MW)'], ['A', '1']], caption: cap, source: SRC }] }]);
    const blocks = (b.chapters[0] as any).intro;
    expect(text(blocks[0].caption)).toBe('Kesiapan gardu');
    expect(text(blocks[1].caption)).toBe('Kesiapan gardu');
    expect(codes(b)).toContain('CAPTION_PREFIX_STRIPPED');
  });
});

describe('butir 10/12: sumber dan satuan tidak dikarang; satu jawaban untuk semua isu', () => {
  it('tanpa sumber -> tidak ada baris "Diolah oleh"; tabel angka tanpa satuan -> satu galat dengan SEMUA tabel', () => {
    let err: any;
    try {
      build([{ heading: '1. A', blocks: [{ table: [['Gardu', 'Daya'], ['A', '12'], ['B', '15']], caption: 'Daya per gardu' }, { chart: { categories: ['A'], series: [{ name: 's', values: [1] }], caption: 'Grafik' } }] }]);
    } catch (e) {
      err = e;
    }
    expect(err?.code).toBe('CONTENT_INVALID');
    const issues = err.extra.details.issues.map((i: any) => i.code);
    expect(issues).toEqual(expect.arrayContaining(['SOURCE_MISSING', 'TABLE_UNIT_MISSING']));
    expect(err.extra.details.issues.filter((i: any) => i.code === 'SOURCE_MISSING')).toHaveLength(2);
    expect(JSON.stringify(err.extra.details)).not.toContain('Diolah oleh');
  });

  it('satuan di caption -> metadata unit kolom angka; struktur tabel tetap (tanpa kolom baru)', () => {
    const b = build([{ heading: '1. A', blocks: [{ table: [['Gardu', 'Daya'], ['A', '12'], ['B', '15']], caption: 'Daya per gardu (MW)', source: SRC }] }]);
    const t = (b.chapters[0] as any).intro[0];
    expect(t.rows[0].cells.map(text)).toEqual(['Gardu', 'Daya']);
    expect(t.columns).toEqual([{ role: 'text' }, { role: 'numeral', unit: 'MW' }]);
    expect(codes(b)).toContain('UNIT_FROM_CAPTION');
    expect(codes(b)).not.toContain('SOURCE_DEFAULTED');
  });

  it('meta.source (diberi agen) dipakai untuk tabel tanpa sumber, dengan peringatan', () => {
    const b = build([{ heading: '1. A', blocks: [{ table: [['Gardu', 'Status'], ['A', 'siap']], caption: 'Status gardu' }] }], { ...META, source: 'Survei PLN' });
    expect(text((b.chapters[0] as any).intro[0].source)).toBe('Survei PLN');
    expect(codes(b)).toContain('SOURCE_FROM_META');
  });
});

describe('butir 5/11: revisi', () => {
  it('"Rev 0, terbitan pertama" -> rev "Rev 0" (<= 16) + teks penuh di catatan revisi', () => {
    const b = build([{ heading: '1. A', blocks: ['x'] }], { ...META, revision: 'Rev 0, terbitan pertama untuk tinjauan klien' });
    const h = (b.slots.controlSheet as any).revisionHistory[0];
    expect(h.rev).toBe('Rev 0');
    expect(h.rev.length).toBeLessThanOrEqual(16);
    expect(h.what).toContain('Rev 0, terbitan pertama untuk tinjauan klien');
  });
});

describe('butir 13: teks ter-wrap keras', () => {
  it('baris tunggal digabung; baris kosong = paragraf baru; backtick -> kode', () => {
    const b = build([{ heading: '1. A', blocks: ['baris satu\nbaris dua dengan `kode`\n\nparagraf dua'] }]);
    const intro = (b.chapters[0] as any).intro;
    expect(intro).toHaveLength(2);
    expect(text(intro[0])).toBe('baris satu baris dua dengan kode');
    expect(intro[0].runs.some((r: any) => r.code === true && r.t === 'kode')).toBe(true);
  });
});
