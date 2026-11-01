// ENG-01 (D-463, UA-M02): HTML menyelesaikan format peran dengan urutan yang SAMA dengan DOCX.
// Sebelumnya `engine/html/blocks/style.ts` hanya membaca `roleFormats` templat, sehingga templat
// tanpa roleFormats (DATUM-kanonik) merender judul sampul dengan gaya bawaan peramban (2em,
// line-height badan -> baris bertumpuk). Kini: halaman pembungkus = DOCX `wrapper/formats.ts`
// roleFormat (templat > katalog > benchmark), blok isi = `resolveRoleFormat` (templat > katalog).
// Ekspektasi dibaca dari XML DOCX yang dirender dari snapshot dan templat yang sama (paritas),
// bukan dari kode HTML.
import { beforeAll, describe, expect, it } from 'vitest';
import type { NormDocSnapshot, ResolvedTemplate } from '@/lib/studio/contract';
import { assembleDocxDetailed } from '@/lib/studio/engine/docx/assemble';
import { assembleHtml } from '@/lib/studio/engine/html/assemble';
import { composeV2 } from '@/lib/studio/services/compose';
import { datumSlots, defaultParams, e1, merge, skeletonInput } from '../structure/_kit';
import { benchmarkTemplate, canonicalTemplate, makeCtx, partText, unzip } from './_kit';

const TITLE_1 = 'Survei Gardu Induk Cikupa';
const TITLE_2 = 'Kondisi Peralatan 150 kV';

function composeDoc(): NormDocSnapshot {
  const d = e1();
  const slots = datumSlots();
  return composeV2({ source: merge(d, undefined, { slots }).doc, skeleton: skeletonInput(slots), params: defaultParams() }).snapshot as unknown as NormDocSnapshot;
}

async function renderBoth(tpl: ResolvedTemplate): Promise<{ html: string; docx: string }> {
  const snap = composeDoc();
  const html = await assembleHtml(makeCtx(snap, tpl).ctx, { preview: false });
  const docx = partText(unzip((await assembleDocxDetailed(makeCtx(composeDoc(), tpl).ctx)).bytes), 'word/document.xml');
  return { html, docx };
}

/** Atribut `style` elemen ber-data-role `role` yang memuat teks `text`. */
function htmlStyle(html: string, role: string, text: string): { style: string; cls: string } {
  const re = new RegExp(`<[a-z0-9]+ class="([^"]*)"(?: style="([^"]*)")?[^>]*data-role="${role.replace('.', '\.')}"[^>]*>(?:<[^>]+>)*${text}`);
  const m = html.match(re);
  expect(m, `elemen ${role} "${text}" tidak ditemukan`).not.toBeNull();
  return { cls: m![1], style: m![2] ?? '' };
}

interface Metrics {
  sizePt: number;
  linePt: number;
  bold: boolean;
  color?: string;
  font?: string;
}

/**
 * Metrik setiap paragraf DOCX di luar tabel (bukan entri daftar isi) yang teksnya persis `text`
 * (teks yang sama bisa muncul di beberapa peran, mis. kicker dan judul "Lembar Kendali").
 */
function docxCandidates(xml: string, text: string): Metrics[] {
  const body = xml.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, '');
  const plain = (x: string) => (x.match(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, '')).join('');
  const out = (body.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? [])
    .filter((x) => plain(x) === text)
    .map((p): Metrics | undefined => {
      const sz = /<w:sz w:val="(\d+)"\/>/.exec(p);
      const line = /<w:spacing [^>]*w:line="(\d+)"[^>]*w:lineRule="exact"/.exec(p);
      const color = /<w:color w:val="([0-9A-F]{6})"\/>/.exec(p);
      const font = /<w:rFonts w:ascii="([^"]+)"/.exec(p);
      return sz && line ? { sizePt: Number(sz[1]) / 2, linePt: Number(line[1]) / 20, bold: /<w:b\/>/.test(p), color: color?.[1], font: font?.[1] } : undefined;
    })
    .filter((m): m is Metrics => m !== undefined);
  expect(out.length, `paragraf DOCX "${text}" (w:sz + w:line exact) tidak ditemukan`).toBeGreaterThan(0);
  return out;
}

function htmlMetrics(h: { style: string; cls: string }): Metrics {
  return {
    sizePt: cssPt(h.style, 'font-size') ?? NaN,
    linePt: cssPt(h.style, 'line-height') ?? NaN,
    bold: h.cls.split(' ').includes('st-b'),
    color: /(?:^|;)color:#([0-9A-F]{6})/.exec(h.style)?.[1],
    // wajah peran (faceRole) ditulis inline sebagai keluarga `type.face.<peran>`, padanan rFonts DOCX
    font: /(?:^|;)font-family:(?:'|&#39;)([^'&]+)(?:'|&#39;)/.exec(h.style)?.[1],
  };
}

function cssPt(style: string, prop: string): number | undefined {
  const m = new RegExp(`(?:^|;)${prop}:([0-9.]+)pt`).exec(style);
  return m ? Number(m[1]) : undefined;
}

let CANON: ResolvedTemplate;
let BENCH: ResolvedTemplate;
beforeAll(async () => {
  CANON = await canonicalTemplate();
  BENCH = await benchmarkTemplate();
});

describe('ENG-01: templat tanpa roleFormats (DATUM-kanonik) - fallback katalog/benchmark seperti DOCX', () => {
  it('prasyarat: templat kanonik memang tanpa roleFormats', () => {
    expect(Object.keys(CANON.roleFormats ?? {})).toHaveLength(0);
  });

  it('judul sampul (h1) bergaya peran, ukuran dan spasi baris = DOCX (tidak jatuh ke bawaan peramban)', async () => {
    const { html, docx } = await renderBoth(CANON);
    for (const [role, text] of [['cover.titleFirst', TITLE_1], ['cover.titleLast', TITLE_2]] as const) {
      const h = htmlStyle(html, role, text);
      expect(h.style, `${role} tanpa gaya inline`).not.toBe('');
      expect(docxCandidates(docx, text)).toContainEqual(htmlMetrics(h));
      // spasi baris >= ukuran huruf: baris judul tidak bertumpuk (gejala UA-M02: 25,33 px vs 18 px)
      expect(cssPt(h.style, 'line-height')!).toBeGreaterThanOrEqual(cssPt(h.style, 'font-size')!);
    }
  }, 60_000);

  it('unsur pembungkus lain (standfirst, kicker dan judul halaman depan, judul blok kendali) = DOCX', async () => {
    const { html, docx } = await renderBoth(CANON);
    const roles = ['cover.standfirst', 'front.kicker', 'front.pageTitle', 'controlSheet.blockHeading'];
    for (const role of roles) {
      const m = html.match(new RegExp(`data-role="${role.replace('.', '\.')}"[^>]*>(?:<[^>]+>)*([^<]{6,})<`));
      expect(m, `${role} tidak ada`).not.toBeNull();
      const text = m![1];
      expect(docxCandidates(docx, text), role).toContainEqual(htmlMetrics(htmlStyle(html, role, text)));
    }
  }, 60_000);

  it('blok isi memakai rantai katalog (bukan benchmark pembungkus): judul bab = DOCX', async () => {
    const { html, docx } = await renderBoth(CANON);
    const m = html.match(/data-role="chapter\.title"[^>]*>(?:<[^>]+>)*([^<]{4,})</);
    expect(m).not.toBeNull();
    expect(docxCandidates(docx, m![1])).toContainEqual(htmlMetrics(htmlStyle(html, 'chapter.title', m![1])));
  }, 60_000);

  it('roleFormats templat tetap menang per sub-objek di atas fallback (semantik S11)', async () => {
    const own = { ...CANON, roleFormats: { 'cover.titleFirst': { run: { szHalfPt: 60 } } } } as ResolvedTemplate;
    const { html } = await renderBoth(own);
    const h = htmlStyle(html, 'cover.titleFirst', TITLE_1);
    expect(cssPt(h.style, 'font-size')).toBe(30);
    expect(h.style).not.toMatch(/color:/); // run templat utuh: warna benchmark tidak ditumpuk
    expect(cssPt(h.style, 'line-height')).toBe(29); // para tetap dari benchmark (580 tw)
  }, 60_000);
});

describe('ENG-01: templat dengan roleFormats (profil Manual 000) tidak berubah', () => {
  it('gaya judul sampul identik dengan keluaran sebelum ENG-01', async () => {
    const { html } = await renderBoth(BENCH);
    expect(htmlStyle(html, 'cover.titleFirst', TITLE_1).style).toBe(
      "margin-top:0pt;margin-bottom:0pt;line-height:29pt;font-family:&#39;IBM Plex Sans Cond&#39;;font-size:25pt;color:#14110F;font-style:normal",
    );
    expect(htmlStyle(html, 'cover.titleLast', TITLE_2).style).toBe(
      "margin-top:0pt;margin-bottom:9pt;line-height:29pt;font-family:&#39;IBM Plex Sans Cond&#39;;font-size:25pt;color:#14110F;font-style:normal",
    );
  }, 60_000);
});
