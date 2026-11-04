/* eslint-disable @typescript-eslint/no-explicit-any -- fixture JSON kontrak dibaca bebas-bentuk di uji */
// FIX-2 (F-055 H1, D-46, D-116): teks bawaan halaman pembungkus HTML = DOCX.
// Satu sumber teks (`engine/front/texts.ts`) dipakai perakit DOCX dan renderer HTML.
// Uji paritas merender dokumen yang SAMA ke DOCX dan HTML lalu membandingkan teks di
// empat tempat F-055: (1) kicker/judul/judul blok lembar kendali, (2) kicker/judul/
// catatan + label entri daftar isi (termasuk kenop render.toc.title/note, RQ-8),
// (3) kicker pembuka lampiran (dan bab), (4) varian EN. Ditambah label daftar bab
// pembatas bagian (generator label yang sama).
import { beforeAll, describe, expect, it } from 'vitest';
import type { NormDocSnapshot, ResolvedTemplate, StudioDocV1 } from '@/lib/studio/contract';
import { assembleDocxDetailed } from '@/lib/studio/engine/docx/assemble';
import { assembleHtml } from '@/lib/studio/engine/html/assemble';
import {
  WRAPPER_TEXT,
  appendixOpenerKickerText,
  chapterKickerText,
  chapterLabelText,
  colophonTexts,
  controlBlockRowsText,
  controlSheetBlockHeading,
  controlSheetKickerText,
  defaultPartLabelText,
  tocKickerText,
} from '@/lib/studio/engine/front/texts';
import { defaultPartLabelText as apparatusPartLabel } from '@/lib/studio/engine/front/apparatus';
import { composeV2 } from '@/lib/studio/services/compose';
import { withParams } from '../engine-core/fixtures';
import { datumSlots, defaultParams, e1, merge, skeletonInput } from '../structure/_kit';
import { canonicalTemplate, loadFixtureDoc, makeCtx, partText, snapshotOf, unzip } from './_kit';

// ── Sumber teks bersama ──────────────────────────────────────────────────

describe('engine/front/texts: tabel teks bawaan pembungkus', () => {
  it('nilai ID/EN = keluaran DOCX sebelum FIX-2 (DOCX byte-identik)', () => {
    expect(controlSheetKickerText('ID')).toBe('Lembar Kendali');
    expect(controlSheetKickerText('EN')).toBe('Control Sheet');
    expect(tocKickerText('ID')).toBe('Daftar Isi');
    expect(tocKickerText('EN')).toBe('Contents');
    expect(controlSheetBlockHeading(0, 'revision', 'ID')).toBe('A · Riwayat revisi');
    expect(controlSheetBlockHeading(3, 'distribution', 'ID')).toBe('D · Distribusi terkendali');
    expect(controlSheetBlockHeading(1, 'method', 'EN')).toBe('B · Method statement');
    expect(chapterLabelText('3', false, 'ID')).toBe('Bab 3');
    expect(chapterLabelText('B', true, 'EN')).toBe('Annex B'); // G-FIX1 LB-08 (D-606): EN:223-247, EN:4326
    expect(appendixOpenerKickerText('A', 'ID')).toBe('Lampiran A');
    expect(defaultPartLabelText('P2', 'ID')).toBe('Bagian II');
    expect(defaultPartLabelText('P1', 'EN')).toBe('Part I');
    expect(apparatusPartLabel).toBe(defaultPartLabelText);
    expect(Object.keys(WRAPPER_TEXT).sort()).toEqual(
      ['appendix', 'chapter', 'controlKicker', 'distribution', 'method', 'part', 'revision', 'tocKicker', 'tocPlaceholder', 'verification'].sort(),
    );
  });

  it('kicker bab: pola P4A-04, pola lampiran atau kata turunan (ID tidak berubah)', () => {
    expect(chapterKickerText(undefined, undefined, '2', false, 'ID')).toBe('BAB 2');
    expect(chapterKickerText('Bab {n}', undefined, '2', false, 'ID')).toBe('Bab 2');
    expect(chapterKickerText('tanpa pola', undefined, '2', false, 'ID')).toBe('BAB 2');
    // Perilaku DOCX yang dipertahankan (dicatat FIX-2): deteksi huruf besar membandingkan pola utuh
    // termasuk "{n}" (huruf kecil), sehingga cabang huruf besar tidak pernah terpakai: "BAB {n}" -> "Lampiran".
    expect(chapterKickerText('BAB {n}', undefined, 'A', true, 'ID')).toBe('Lampiran A');
    expect(chapterKickerText('Bab {n}', undefined, 'A', true, 'ID')).toBe('Lampiran A');
    expect(chapterKickerText('BAB {n}', 'ANNEX {n}', 'A', true, 'ID')).toBe('ANNEX A');
  });

  it('O-1: dokumen EN dengan pola bawaan = "CHAPTER {n}"; pola templat lain tetap menang', () => {
    expect(chapterKickerText(undefined, undefined, '2', false, 'EN')).toBe('CHAPTER 2');
    expect(chapterKickerText('BAB {n}', undefined, '2', false, 'EN')).toBe('CHAPTER 2');
    expect(chapterKickerText('Bab {n}', undefined, '2', false, 'EN')).toBe('Bab 2');
    expect(chapterKickerText('BAB {n}', undefined, 'A', true, 'EN')).toBe('Annex A'); // G-FIX1 LB-08 (D-606)
    expect(chapterKickerText('BAB {n}', 'Annex {n}', 'A', true, 'EN')).toBe('Annex A');
  });

  it('O-2: pembuka lampiran memakai appendix.kicker.pattern bila sah', () => {
    expect(appendixOpenerKickerText('B', 'ID', 'ANEKS {n}')).toBe('ANEKS B');
    expect(appendixOpenerKickerText('B', 'EN', 'Annex {n}')).toBe('Annex B');
    expect(appendixOpenerKickerText('B', 'ID', null)).toBe('Lampiran B');
    expect(appendixOpenerKickerText('B', 'EN', 'tanpa pola')).toBe('Annex B');
  });

  it('O-3: blok kendali dan kolofon sampul auto', () => {
    const meta = { title: 'T', docNumber: '009/GSP/KT/X/2026', rev: 'A', typeCode: 'KT', tier: 'TERBIT', classification: 'TERBATAS', language: 'ID', author: 'Tim', issueDate: '2026-10-08' } as any;
    expect(controlBlockRowsText(meta, {}, 'ID')).toEqual([
      ['Nomor dokumen', '009/GSP/KT/X/2026', 'Revisi', 'A · 8 Oktober 2026'],
      ['Penyusun', 'Tim', 'Tier', 'TERBIT'],
      ['Bahasa', 'Indonesia', '', ''],
    ]);
    expect(controlBlockRowsText({ ...meta, language: 'EN' }, { 'cover.controlBlock.fields': ['REVISI', 'BAHASA'] }, 'EN')).toEqual([['Revision', 'A · 8 October 2026', 'Language', 'English (UK)']]); // G-FIX1 LB-07 (D-606): EN:18, EN:883
    expect(controlBlockRowsText(meta, { 'cover.controlBlock.fields': ['KUSTODIAN'] }, 'ID')).toBeUndefined();
    expect(colophonTexts(meta, { 'org.nib': '123' })).toEqual({ left: 'PT GEMILANG SATRIA PERKASA · NIB 123', right: '// 20261008 ID T -- TERBITAN 1' });
    expect(colophonTexts(meta, { 'cover.colophon.fields': ['entitas'], 'org.entityName': 'X' })).toEqual({ left: 'X', right: '' });
  });
});

// ── Ekstraksi teks dari keluaran nyata ───────────────────────────────────

const KICK = /^(BAB|Bab|CHAPTER|Chapter|LAMPIRAN|Lampiran|APPENDIX|Appendix|ANNEX|Annex)\s+\S+$/;

interface FrontTexts {
  cover: { control: string[]; colophon: string[] };
  cs: { kicker?: string; title?: string; headings: string[] };
  toc: { kicker?: string; title?: string; note?: string; labels: string[] };
  partLists: string[];
  kickers: string[];
}

type Tok = { kind: 'p'; text: string; tab: boolean } | { kind: 'tbl'; rows: string[][] };

function decode(s: string): string {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

function wText(xml: string): string {
  return decode((xml.match(/<w:t[^>]*>[^<]*<\/w:t>|<w:tab\/>/g) ?? []).map((t) => (t === '<w:tab/>' ? '\t' : t.replace(/<[^>]+>/g, ''))).join(''));
}

/** Seksi DOCX (dipisah paragraf pemegang sectPr) berisi token paragraf/tabel tingkat atas. */
function docxSections(xml: string): Tok[][] {
  const body = xml.slice(xml.indexOf('<w:body>'));
  const sections: Tok[][] = [[]];
  for (const m of body.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>/g)) {
    const x = m[0];
    if (x.startsWith('<w:tbl>')) {
      const rows = (x.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) ?? []).map((tr) => (tr.match(/<w:tc>[\s\S]*?<\/w:tc>/g) ?? []).map(wText));
      sections[sections.length - 1].push({ kind: 'tbl', rows });
    } else {
      const text = wText(x);
      sections[sections.length - 1].push({ kind: 'p', text, tab: text.includes('\t') });
      if (x.includes('<w:sectPr')) sections.push([]);
    }
  }
  return sections;
}

/** Urutan unit pembungkus dari HTML (cover, controlSheet, toc, ...) untuk memetakan seksi DOCX. */
function htmlWrappers(html: string): string[] {
  return [...html.matchAll(/data-wrapper="(\w+)"/g)].map((m) => m[1]);
}

function docxTexts(bytes: Uint8Array, wrappers: string[]): FrontTexts {
  const secs = docxSections(partText(unzip(bytes), 'word/document.xml'));
  const out: FrontTexts = { cover: { control: [], colophon: [] }, cs: { headings: [] }, toc: { labels: [] }, partLists: [], kickers: [] };
  const coverIdx = wrappers.indexOf('cover');
  if (coverIdx >= 0) {
    const tbls = secs[coverIdx].filter((t): t is Extract<Tok, { kind: 'tbl' }> => t.kind === 'tbl');
    // Blok kendali = tabel 4 kolom; kolofon = tabel satu baris 2 kolom terakhir (sesudah blok kendali).
    out.cover.control = tbls.filter((t) => t.rows.every((r) => r.length === 4)).flatMap((t) => t.rows.flat());
    const col = [...tbls].reverse().find((t) => t.rows.length === 1 && t.rows[0].length === 2);
    out.cover.colophon = col ? col.rows[0] : [];
  }
  const csIdx = wrappers.indexOf('controlSheet');
  const tocIdx = wrappers.indexOf('toc');
  const paras = (s: Tok[]) => s.filter((t): t is Extract<Tok, { kind: 'p' }> => t.kind === 'p' && t.text.trim() !== '');
  if (csIdx >= 0) {
    const ps = paras(secs[csIdx]).map((t) => t.text);
    out.cs = { kicker: ps[0], title: ps[1], headings: ps.filter((p) => /^[A-D] · /.test(p)) };
  }
  if (tocIdx >= 0) {
    const sec = secs[tocIdx];
    const before: string[] = [];
    const after: string[] = [];
    let seenEntries = false;
    for (const t of sec) {
      if (t.kind === 'tbl') {
        const entryRows = t.rows.filter((r) => r.length === 3);
        if (entryRows.length > 0) {
          seenEntries = true;
          out.toc.labels.push(...entryRows.map((r) => r[0]));
        }
      } else if (t.tab) {
        seenEntries = true;
        out.toc.labels.push(t.text.split('\t')[0]);
      } else if (t.text.trim() !== '') {
        (seenEntries ? after : before).push(t.text);
      }
    }
    out.toc.kicker = before[0];
    out.toc.title = before[1];
    out.toc.note = after[0];
  }
  secs.forEach((s, i) => {
    if (i === tocIdx || i === csIdx) return;
    for (const t of s) {
      if (t.kind === 'p' && KICK.test(t.text.trim())) out.kickers.push(t.text.trim());
      // Daftar bab pembatas bagian: tabel 2 kolom berlabel bawaan (seksi bab di antara bagian membuat indeks wrapper tak sejajar).
      if (t.kind === 'tbl') out.partLists.push(...t.rows.filter((r) => r.length === 2 && KICK.test(r[0])).map((r) => r[0]));
    }
  });
  return out;
}

function roleTexts(html: string, role: string): string[] {
  const re = new RegExp(`<(\\w+)[^>]*data-role="${role.replace('.', '\\.')}"[^>]*>([\\s\\S]*?)</\\1>`, 'g');
  return [...html.matchAll(re)].map((m) => decode(m[2].replace(/<[^>]+>/g, '')).trim());
}

function unitHtml(html: string, kind: string): string {
  const start = html.search(new RegExp(`<(section|nav)[^>]*data-wrapper="${kind}"`));
  if (start < 0) return '';
  const tag = html.slice(start + 1, start + 4) === 'nav' ? 'nav' : 'section';
  return html.slice(start, html.indexOf(`</${tag}>`, start));
}

function htmlTexts(html: string): FrontTexts {
  const cs = unitHtml(html, 'controlSheet');
  const toc = unitHtml(html, 'toc');
  const cover = unitHtml(html, 'cover');
  const control = [...cover.matchAll(/data-role="cover\.control(?:Label|Value)"[^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => decode(m[1].replace(/<[^>]+>/g, '')).trim());
  const parts = [...html.matchAll(/<section[^>]*data-wrapper="part"[\s\S]*?<\/section>/g)].map((m) => m[0]).join('');
  return {
    cover: { control, colophon: [...roleTexts(cover, 'cover.colophonLeft'), ...roleTexts(cover, 'cover.colophonRight')] },
    cs: { kicker: roleTexts(cs, 'front.kicker')[0], title: roleTexts(cs, 'front.pageTitle')[0], headings: roleTexts(cs, 'controlSheet.blockHeading') },
    toc: {
      kicker: roleTexts(toc, 'front.kicker')[0],
      title: roleTexts(toc, 'toc.title')[0],
      note: roleTexts(toc, 'toc.note')[0],
      // FIX-TL (D-351/D-352): entri section memakai peran toc.sectionLabel (lampiran toc.appendixLabel bila disetel templat).
      labels: [...toc.matchAll(/data-role="toc\.(?:chapter|part|section|appendix)Label"[^>]*>([\s\S]*?)<\/td>/g)].map((m) => decode(m[1].replace(/<[^>]+>/g, '')).trim()),
    },
    // Kicker/label konten (bukan teks bawaan) tidak bisa dikenali di DOCX: bandingkan yang berpola bawaan.
    partLists: roleTexts(parts, 'part.chapterNo').filter((t) => KICK.test(t)),
    kickers: roleTexts(html, 'chapter.kicker').filter((t) => KICK.test(t)),
  };
}

async function renderBoth(snapshot: NormDocSnapshot, tpl: ResolvedTemplate): Promise<{ docx: FrontTexts; html: FrontTexts; rawHtml: string }> {
  const rawHtml = await assembleHtml(makeCtx(snapshot, tpl).ctx, { preview: false });
  const detail = await assembleDocxDetailed(makeCtx(snapshot, tpl).ctx);
  return { docx: docxTexts(detail.bytes, htmlWrappers(rawHtml)), html: htmlTexts(rawHtml), rawHtml };
}

function terbit(mutate?: (d: any) => void): StudioDocV1 {
  const d = JSON.parse(JSON.stringify(loadFixtureDoc('doc_terbit_report'))) as any;
  mutate?.(d);
  return d as StudioDocV1;
}

// ── Paritas DOCX = HTML pada render nyata ───────────────────────────────

describe('paritas teks bawaan pembungkus DOCX = HTML (F-055)', () => {
  let tpl: ResolvedTemplate;
  beforeAll(async () => {
    tpl = await canonicalTemplate();
  });

  it('TERBIT v1 (ID): lembar kendali, daftar isi, kicker bab/lampiran sama', async () => {
    const { docx, html } = await renderBoth(snapshotOf(terbit()), tpl);
    expect(html).toEqual(docx);
    expect(html.cs.kicker).toBe('Lembar Kendali');
    expect(html.cs.headings).toEqual(['A · Riwayat revisi', 'B · Rantai verifikasi', 'C · Pernyataan metode', 'D · Distribusi terkendali']);
    expect(html.toc.kicker).toBe('Daftar Isi');
    expect(html.toc.title).toBeUndefined();
    // FIX-T2 (D-342 S2): TOC turunan bawaan memuat section (kedalaman 2).
    expect(html.toc.labels).toEqual(['Bagian I', 'Bab 1', '1.1', '1.2', 'Bab 2', '2.1', 'Bagian II', 'Bab 3', '3.1', 'Lampiran A', 'A.1']);
    expect(html.kickers).toEqual(['BAB 1', 'BAB 2', 'BAB 3', 'Lampiran A']);
  }, 120_000);

  it('TERBIT v1 (EN): varian EN sama di kedua format', async () => {
    const { docx, html } = await renderBoth(snapshotOf(terbit((d) => (d.meta.language = 'EN'))), tpl);
    expect(html).toEqual(docx);
    expect(html.cs.kicker).toBe('Control Sheet');
    expect(html.cs.headings).toEqual(['A · Revision history', 'B · Verification chain', 'C · Method statement', 'D · Controlled distribution']);
    expect(html.toc.kicker).toBe('Contents');
    // Label bagian fixture = konten ("Bagian I"); label bab/lampiran = teks bawaan EN.
    // FIX-T2 (D-342 S2): TOC turunan bawaan memuat section (kedalaman 2).
    expect(html.toc.labels).toEqual(['Bagian I', 'Chapter 1', '1.1', '1.2', 'Chapter 2', '2.1', 'Bagian II', 'Chapter 3', '3.1', 'Annex A', 'A.1']);
    // O-1: kicker bab EN = "CHAPTER {n}" di kedua format.
    expect(html.kickers).toEqual(['CHAPTER 1', 'CHAPTER 2', 'CHAPTER 3', 'Annex A']);
  }, 120_000);

  it('O-1/O-2: pola templat (bab "Bab {n}" pada EN, lampiran "Annex {n}") sama di kedua format', async () => {
    const t2 = withParams(tpl, { 'chapter.kicker.pattern': 'Bab {n}', 'appendix.kicker.pattern': 'Annex {n}' });
    const { docx, html } = await renderBoth(snapshotOf(terbit((d) => (d.meta.language = 'EN'))), t2);
    expect(html).toEqual(docx);
    expect(html.kickers).toEqual(['Bab 1', 'Bab 2', 'Bab 3', 'Annex A']);
  }, 120_000);

  it('O-3: blok kendali + kolofon sampul auto (tanpa data konten) sama, ID dan EN', async () => {
    for (const lang of ['ID', 'EN']) {
      const doc = terbit((d) => {
        d.meta.language = lang;
        delete d.front.cover.data.control;
        delete d.front.cover.data.colophon;
      });
      const { docx, html } = await renderBoth(snapshotOf(doc), tpl);
      expect(html).toEqual(docx);
      expect(html.cover.control.length).toBeGreaterThanOrEqual(8);
      expect(html.cover.control[0]).toBe(lang === 'EN' ? 'Document number' : 'Nomor dokumen');
      expect(html.cover.colophon[0]).toMatch(/^PT GEMILANG SATRIA PERKASA/);
      expect(html.cover.colophon[1]).toMatch(/^\/\/ \d{8} /);
    }
  }, 120_000);

  it('lembar kendali tanpa kicker/judul/riwayat revisi, TOC statis berjudul+catatan, kicker bab konten', async () => {
    const doc = terbit((d) => {
      delete d.front.controlSheet.data.title;
      delete d.front.controlSheet.data.kicker;
      delete d.front.controlSheet.data.revisionHistory;
      d.front.toc = { mode: 'static', title: { text: 'Peta Isi' }, note: { text: 'Catatan daftar isi uji.' } };
      d.chapters[0].kicker = { text: '**Pembuka**' };
    });
    const { docx, html, rawHtml } = await renderBoth(snapshotOf(doc), tpl);
    expect(html).toEqual(docx);
    expect(html.cs.kicker).toBe('Lembar Kendali');
    expect(html.cs.title).toBe(doc.meta.title);
    expect(html.cs.headings).toEqual(['A · Rantai verifikasi', 'B · Pernyataan metode', 'C · Distribusi terkendali']);
    expect(html.toc).toMatchObject({ kicker: 'Daftar Isi', title: 'Peta Isi', note: 'Catatan daftar isi uji.' });
    // FIX-T2 (D-342 S2): TOC turunan bawaan memuat section (kedalaman 2).
    expect(html.toc.labels).toEqual(['Bagian I', 'Pembuka', '1.1', '1.2', 'Bab 2', '2.1', 'Bagian II', 'Bab 3', '3.1', 'Lampiran A', 'A.1']);
    expect(html.partLists).toEqual(['Bab 2', 'Bab 3']);
    expect(roleTexts(rawHtml, 'part.chapterNo')).toEqual(['Pembuka', 'Bab 2', 'Bab 3']);
    expect(roleTexts(rawHtml, 'chapter.kicker')[0]).toBe('Pembuka');
    // Urutan C6: kicker -> judul -> tabel entri -> catatan.
    const toc = unitHtml(rawHtml, 'toc');
    expect(toc.indexOf('data-role="toc.note"')).toBeGreaterThan(toc.indexOf('</table>'));
  }, 120_000);

  it('v2 compose dengan kenop render.toc.title/note (RQ-8): judul/catatan TOC sama', async () => {
    const slots = datumSlots();
    const params = { ...defaultParams(), 'render.toc.title': 'Peta Isi Manual', 'render.toc.note': 'Nomor halaman dari PDF.' };
    const r = composeV2({ source: merge(e1(), undefined, { slots }).doc, skeleton: skeletonInput(slots), params });
    const { docx, html } = await renderBoth(r.snapshot as unknown as NormDocSnapshot, tpl);
    expect(html).toEqual(docx);
    expect(html.toc).toMatchObject({ kicker: 'Daftar Isi', title: 'Peta Isi Manual', note: 'Nomor halaman dari PDF.' });
  }, 120_000);
});
