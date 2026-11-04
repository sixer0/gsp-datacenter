/**
 * S20: klasifikasi seksi R0 (research/32 §0.4): SAMPUL, PEMBUNGKUS, LEMBAR KENDALI, DAFTAR ISI, INTERIOR,
 * plus pengenal tabel pita segel dan tabel register.
 */
import { describe, expect, it } from 'vitest';
import { DocxDocument } from '../../../../benchmark/datum_conformance/lib/docx';
import { buildLayout, colorNear, isRegisterTable, isSealBandTable } from '../../../../benchmark/datum_conformance/lib/layout';
import { buildDocx, p, tbl } from './_docx_kit';

const SEAL = '<w:shd w:val="clear" w:color="auto" w:fill="6E1420"/>';
const band = (l: string, r: string) => tbl([[l, r]], '', SEAL);
const register = tbl([['GSP · 001/GSP/STD/XI/2026', 'REV A · 04-XI-2026', 'LEMBAR 1 DARI 9', 'TERBATAS']]).replace(
  'LEMBAR 1 DARI 9',
  'LEMBAR <w:fldSimple w:instr=" PAGE "><w:r><w:t>1</w:t></w:r></w:fldSimple>',
);
const tocField =
  '<w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> TOC \\o "1-2" \\h \\z \\u </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>';

function terbit(): DocxDocument {
  return DocxDocument.fromBytes(
    buildDocx({
      sections: [
        { body: band('KLASIFIKASI · TERBATAS', 'SALINAN INDUK · PENGGUNAAN INTERNAL GSP') + p('Judul'), header: '<w:p/>', footer: '<w:p/>' },
        { body: band('KLASIFIKASI · TERBATAS', 'SALINAN INDUK') + p('Lembar Kendali') + p('Lembar Kendali'), header: '<w:p/>', footer: '<w:p/>' },
        { body: p('Daftar Isi') + tocField, header: '<w:p/>', footer: '<w:p/>' },
        { body: p('BAB 1') + p('Pendahuluan'), header: p('PT GEMILANG SATRIA PERKASA'), footer: register },
        { body: p('BAB 2') },
      ],
    }),
  );
}

describe('buildLayout', () => {
  it('TERBIT: SAMPUL, LEMBAR KENDALI, DAFTAR ISI sebagai pembungkus, lalu interior', () => {
    const lay = buildLayout(terbit());
    expect(lay.cover?.index).toBe(0);
    expect(lay.controlSheet?.index).toBe(1);
    expect(lay.toc?.index).toBe(2);
    expect(lay.wrappers.map((s) => s.index)).toEqual([0, 1, 2]);
    expect(lay.interiors.map((s) => s.index)).toEqual([3, 4]);
    expect(lay.firstInteriorIndex).toBe(3);
    expect([...lay.sections[1].classes].sort()).toEqual(['controlSheet', 'wrapper']);
    expect(lay.sealBandTables.length).toBe(2);
    expect(lay.registerTables.get('word/footer4.xml')).toBeDefined();
  });

  it('NOTA: seksi pertama sudah interior, tanpa sampul dan pembungkus', () => {
    const doc = DocxDocument.fromBytes(
      buildDocx({ sections: [{ body: p('BAB 1'), header: p('PT GEMILANG SATRIA PERKASA'), footer: register }] }),
    );
    const lay = buildLayout(doc);
    expect(lay.cover).toBeUndefined();
    expect(lay.wrappers).toEqual([]);
    expect(lay.interiors.map((s) => s.index)).toEqual([0]);
  });

  it('dokumen tanpa footer ber-PAGE: tidak ada interior, firstInteriorIndex -1', () => {
    const doc = DocxDocument.fromBytes(buildDocx({ sections: [{ body: p('x') }] }));
    const lay = buildLayout(doc);
    expect(lay.interiors).toEqual([]);
    expect(lay.firstInteriorIndex).toBe(-1);
  });
});

describe('pengenal tabel dan warna', () => {
  it('pita segel = 1 baris x 2 sel berisian seal (+-3 per kanal); register = 1 x 4 di footer', () => {
    const doc = terbit();
    const [t0] = doc.tables(doc.sections()[0].blocks);
    expect(isSealBandTable(doc, t0)).toBe(true);
    const reg = doc.tables(doc.part('word/footer4.xml')!)[0];
    expect(isSealBandTable(doc, reg)).toBe(false);
    expect(isRegisterTable(doc, reg)).toBe(true);
  });

  it('colorNear: toleransi +-3 per kanal, auto/absen tidak cocok', () => {
    expect(colorNear('6e1420', '6E1420')).toBe(true);
    expect(colorNear('711723', '6E1420')).toBe(true);
    expect(colorNear('721420', '6E1420')).toBe(false);
    expect(colorNear('auto', '6E1420')).toBe(false);
    expect(colorNear(undefined, '6E1420')).toBe(false);
  });
});
