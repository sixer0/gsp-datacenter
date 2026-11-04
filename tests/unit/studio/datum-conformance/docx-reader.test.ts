/**
 * S20 (blueprint 02_structured_datum_rev_a.md; research/32 §0.4 R0): pembaca DOCX harness konformitas.
 * Seam: `DocxDocument` (bagian, seksi, paragraf/run/teks, tabel, medan, format efektif).
 */
import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { DocxDocument, DocxReadError } from '../../../../benchmark/datum_conformance/lib/docx';
import { buildDocx, p, tbl } from './_docx_kit';

const STYLES =
  '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="IBM Plex Serif" w:hAnsi="IBM Plex Serif"/><w:sz w:val="19"/></w:rPr></w:rPrDefault></w:docDefaults>' +
  '<w:style w:type="paragraph" w:styleId="Base"><w:rPr><w:color w:val="6B7783"/></w:rPr></w:style>' +
  '<w:style w:type="paragraph" w:styleId="Kicker"><w:basedOn w:val="Base"/><w:rPr><w:caps/><w:sz w:val="14"/></w:rPr></w:style>' +
  '<w:style w:type="character" w:styleId="Strong"><w:rPr><w:b/></w:rPr></w:style>';

function sample(): DocxDocument {
  const bytes = buildDocx({
    styles: STYLES,
    sections: [
      {
        body: p('Sampul') + tbl([['KLASIFIKASI · TERBATAS', 'SALINAN INDUK']]),
        header: '<w:p/>',
        footer: '<w:p/>',
      },
      {
        body:
          '<w:p><w:pPr><w:pStyle w:val="Kicker"/></w:pPr><w:r><w:t>bab 1</w:t></w:r></w:p>' +
          '<w:p><w:r><w:rPr><w:rStyle w:val="Strong"/></w:rPr><w:t>A</w:t><w:tab/><w:t>B</w:t><w:br/><w:t>C</w:t><w:noBreakHyphen/></w:r>' +
          '<w:r><w:instrText> PAGE </w:instrText></w:r></w:p>',
        header: p('PT GEMILANG SATRIA PERKASA'),
        footer: '<w:p><w:fldSimple w:instr=" PAGE "><w:r><w:t>1</w:t></w:r></w:fldSimple></w:p>',
        extraSectPr: '<w:pgNumType w:start="1"/>',
      },
      { body: p('Lanjutan') },
    ],
  });
  return DocxDocument.fromBytes(bytes, { path: 'sample.docx' });
}

describe('DocxDocument: bagian dan seksi', () => {
  it('membaca bagian XML dan sha256 masukan', () => {
    const doc = sample();
    expect(doc.hasPart('word/document.xml')).toBe(true);
    expect(doc.headerParts()).toEqual(['word/header1.xml', 'word/header2.xml']);
    expect(doc.footerParts()).toEqual(['word/footer1.xml', 'word/footer2.xml']);
    expect(doc.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(doc.styles?.name).toBe('w:styles');
    expect(doc.settings?.name).toBe('w:settings');
  });

  it('memotong body per sectPr, geometri dan rujukan header/footer diwarisi', () => {
    const secs = sample().sections();
    expect(secs).toHaveLength(3);
    expect(secs[0].pgSz).toEqual({ w: 11906, h: 16838, orient: 'portrait' });
    expect(secs[0].pgMar.left).toBe(1361);
    expect(secs[0].pgMar.footer).toBe(737);
    expect(secs[1].headers.default).toBe('word/header2.xml');
    expect(secs[1].pgNumStart).toBe(1);
    // seksi 3 tanpa rujukan: warisan seksi 2
    expect(secs[2].headers.default).toBe('word/header2.xml');
    expect(secs[2].footers.default).toBe('word/footer2.xml');
    expect(secs[2].inherited.header).toBe(true);
    // paragraf pembawa sectPr tidak dihitung sebagai blok isi
    expect(secs[0].blocks.map((b) => b.name)).toEqual(['w:p', 'w:tbl']);
  });
});

describe('DocxDocument: teks, tabel, medan, format efektif', () => {
  it('teks sumber: tab, br, noBreakHyphen; instrText bukan teks; teks tampak ikut caps', () => {
    const doc = sample();
    const [kicker, para] = doc.sections()[1].blocks;
    expect(doc.paragraphText(para)).toBe('A\tB\nC-');
    expect(doc.paragraphText(kicker)).toBe('bab 1');
    expect(doc.paragraphText(kicker, { visible: true })).toBe('BAB 1');
  });

  it('tabel: baris, sel, teks sel, kolom grid', () => {
    const doc = sample();
    const t = doc.tables(doc.sections()[0].blocks)[0];
    const rows = doc.tableRows(t);
    expect(rows).toHaveLength(1);
    expect(doc.rowCells(rows[0]).map((c) => doc.cellText(c))).toEqual(['KLASIFIKASI · TERBATAS', 'SALINAN INDUK']);
    expect(doc.gridCols(t)).toEqual([2000, 2000]);
  });

  it('medan sederhana dan kompleks', () => {
    const doc = sample();
    const footer = doc.part('word/footer2.xml')!;
    expect(doc.fieldInstructions(footer).map((f) => f.instr)).toEqual(['PAGE']);
    const body = doc.fieldInstructions(doc.sections()[1].blocks);
    expect(body.map((f) => [f.kind, f.instr])).toEqual([['complex', 'PAGE']]);
  });

  it('format efektif: run -> rStyle -> gaya paragraf -> basedOn -> docDefaults', () => {
    const doc = sample();
    const [kicker, para] = doc.sections()[1].blocks;
    const kr = doc.effectiveRunProps(doc.runs(kicker)[0]);
    expect(kr.caps).toBe(true);
    expect(kr.sz).toBe(14);
    expect(kr.color).toBe('6B7783');
    expect(kr.fonts.ascii).toBe('IBM Plex Serif');
    const pr = doc.effectiveRunProps(doc.runs(para)[0]);
    expect(pr.bold).toBe(true);
    expect(pr.sz).toBe(19);
    expect(doc.effectiveParaProps(kicker).styleId).toBe('Kicker');
  });

  it('inventaris fon dan ukuran terpakai', () => {
    const doc = sample();
    expect(doc.fontsUsed()).toContain('IBM Plex Serif');
    expect(doc.sizesUsed().get(14)).toBeGreaterThan(0);
  });
});

describe('DocxDocument: masukan tak tepercaya', () => {
  it('menolak berkas yang bukan ZIP', () => {
    expect(() => DocxDocument.fromBytes(strToU8('bukan zip'))).toThrow(DocxReadError);
  });

  it('menolak paket tanpa word/document.xml', () => {
    expect(() => DocxDocument.fromBytes(zipSync({ 'a.txt': strToU8('x') }))).toThrow(/word\/document\.xml/);
  });

  it('menolak DOCTYPE (tanpa ekspansi entitas)', () => {
    const bad = zipSync({
      'word/document.xml': strToU8('<?xml version="1.0"?><!DOCTYPE x [<!ENTITY a "b">]><w:document><w:body/></w:document>'),
    });
    expect(() => DocxDocument.fromBytes(bad).sections()).toThrow(/DOCTYPE/);
  });

  it('menolak bagian yang melebihi batas ukuran', () => {
    const big = zipSync({ 'word/document.xml': strToU8('<w:document><w:body/></w:document>'), 'word/header1.xml': new Uint8Array(2048) });
    expect(() => DocxDocument.fromBytes(big, { maxPartBytes: 1024 })).toThrow(/batas/);
  });
});
