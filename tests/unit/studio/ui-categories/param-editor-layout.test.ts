// D-632 tata letak form pengaturan. Arahan USER: "tata letak uinya jg perlu kamu pikirkan agar
// experiencenya lebih smooth", lalu "filternya jadi bikin bingung karena dobel2 dengan accordeon
// drop down". Hasilnya: satu baris toolbar lengket (cari, Hanya yang diubah, Saringan lain,
// Buka/Tutup semua) tanpa baris chip; akordeon kategori satu-satunya navigasi (chevron, jumlah,
// lencana "n diubah"); kategori tertutup kecuali yang punya perubahan; kategori kecil tampil datar;
// keadaan kosong ramah. Logika murni diuji langsung; tampilan lewat renderToStaticMarkup (tanpa
// dependensi baru). Jumlah diturunkan dari registri hidup agar uji tidak bergantung pin hitungan.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ALL_PARAMS } from '@/lib/studio/params';
import type { ParamDef } from '@/lib/studio/contract/types/params';
import { ParamEditor, paramEditorView, type ParamEditorProps } from '@/components/studio/template-editor/param-editor';
import * as state from '@/components/studio/template-editor/param-editor-state';
import {
  allCategoriesOpen,
  defaultOpenIds,
  extraFilterCount,
  highlightParts,
  resultSummary,
  setAllCategoriesOpen,
} from '@/components/studio/template-editor/param-editor-state';
import { PARAM_CATEGORIES, categoryOf, subgroupKeyOf } from '@/components/studio/template-editor/param-categories';

const ADVANCED: readonly ParamDef[] = ALL_PARAMS.filter((d) => d.surface === 'advanced');
/** Kunci permukaan lanjutan pertama di kategori/subkelompok tertentu (registri hidup). */
const keyIn = (category: string, subgroup: string) => ADVANCED.find((d) => categoryOf(d) === category && subgroupKeyOf(d) === subgroup)!.key;
const GRID_KEY = keyIn('halaman-grid', 'grid');
const CONTROL_KEY = keyIn('lembar-kendali', 'controlSheet');
const help = (id: string) => PARAM_CATEGORIES.find((c) => c.id === id)!.help;
const noop = () => {};
const props = (over: Partial<ParamEditorProps> = {}): ParamEditorProps => ({
  registry: ADVANCED,
  parentValues: {},
  parentLabel: 'gaya bawaan',
  loaded: {},
  computed: {},
  draft: {},
  errors: {},
  isAdmin: true,
  tier: undefined,
  controlEpoch: {},
  onSet: noop,
  onReset: noop,
  onInvalid: noop,
  ...over,
});
const render = (over: Partial<ParamEditorProps> = {}) => renderToStaticMarkup(createElement(ParamEditor, props(over)));
const view = (draft = {}, loaded = {}, open: ReadonlySet<string> = new Set()) =>
  paramEditorView(ADVANCED, { searching: false, open, draft, loaded });

/** Potongan HTML satu bagian kategori. */
function sectionOf(html: string, categoryId: string): string {
  const start = html.lastIndexOf('<section', html.indexOf(`data-category="${categoryId}"`));
  return html.slice(start, html.indexOf('</section>', start));
}

/** Potongan HTML toolbar (sebelum ringkasan jumlah). */
function toolbarOf(html: string): string {
  return html.slice(0, html.indexOf('Menampilkan '));
}

describe('D-632 logika murni tata letak', () => {
  it('bawaan: semua kategori tertutup, kecuali kategori (dan subkelompok) yang punya perubahan', () => {
    expect(defaultOpenIds(view()).size).toBe(0);
    const v = view({ [GRID_KEY]: 120 }, {});
    const ids = defaultOpenIds(v);
    expect(ids.has('cat:halaman-grid')).toBe(true);
    expect(ids.has('cat:tipografi')).toBe(false);
    const gridSub = v.find((c) => c.id === 'cat:halaman-grid')!.subgroups.find((s) => s.defs.some((d) => d.key === GRID_KEY))!;
    expect([...ids].sort()).toEqual(['cat:halaman-grid', gridSub.id].sort());
  });

  it('Buka semua / Tutup semua: membuka atau menutup semua kategori, status subkelompok dipertahankan', () => {
    const closed = view();
    expect(allCategoriesOpen(closed)).toBe(false);
    const opened = setAllCategoriesOpen(closed, new Set(['ns:tipografi:type']), true);
    for (const c of closed) expect(opened.has(c.id)).toBe(true);
    expect(opened.has('ns:tipografi:type')).toBe(true);
    expect(allCategoriesOpen(view({}, {}, opened))).toBe(true);
    const shut = setAllCategoriesOpen(view({}, {}, opened), opened, false);
    expect([...shut]).toEqual(['ns:tipografi:type']);
    expect(allCategoriesOpen(view({}, {}, shut))).toBe(false);
    expect(allCategoriesOpen([])).toBe(false);
  });

  it('jumlah saringan lain yang aktif (kelas bukan "semua", nonaktif disembunyikan)', () => {
    expect(extraFilterCount({ classFilter: 'all', showInactive: true })).toBe(0);
    expect(extraFilterCount({ classFilter: 'K', showInactive: true })).toBe(1);
    expect(extraFilterCount({ classFilter: 'all', showInactive: false })).toBe(1);
    expect(extraFilterCount({ classFilter: 'T', showInactive: false })).toBe(2);
  });

  it('chip dan pipa gulir chip sudah dihapus dari modul status', () => {
    for (const name of ['categoryChips', 'requestScroll', 'pendingScrollTarget', 'scrollBehaviorFor', 'stickyScrollMarginPx', 'NO_SCROLL_REQUEST']) {
      expect(name in state, name).toBe(false);
    }
  });

  it('sorot kata yang dicari (tanpa membedakan huruf besar), teks utuh tetap sama', () => {
    expect(highlightParts('Margin dalam', 'margin')).toEqual([{ text: 'Margin', match: true }, { text: ' dalam', match: false }]);
    expect(highlightParts('Garis rambut garis', ' GARIS ')).toEqual([
      { text: 'Garis', match: true },
      { text: ' rambut ', match: false },
      { text: 'garis', match: true },
    ]);
    expect(highlightParts('Warna', '')).toEqual([{ text: 'Warna', match: false }]);
    expect(highlightParts('a.b (mm)', '(mm)')).toEqual([{ text: 'a.b ', match: false }, { text: '(mm)', match: true }]);
  });

  it('ringkasan jumlah memakai kata umum', () => {
    expect(resultSummary(366, 366)).toBe('Menampilkan 366 pengaturan');
    expect(resultSummary(12, 366)).toBe('Menampilkan 12 dari 366 pengaturan');
  });
});

describe('D-632 tampilan ParamEditor', () => {
  it('satu baris toolbar lengket: cari, Hanya yang diubah, Saringan lain, Buka semua; tanpa baris chip', () => {
    const html = render();
    const bar = toolbarOf(html);
    expect(bar).toMatch(/class="[^"]*sm:sticky/);
    expect(bar).toContain('type="search"');
    expect(bar).toContain('Hanya yang diubah');
    expect(bar).toContain('>Buka semua</button>');
    expect(html).not.toContain('Lompat ke kategori');
    expect(html).not.toMatch(/<nav/);
  });

  it('saringan kelas ada di balik "Saringan lain" (tertutup bawaan); nonaktif hanya bila registri punya kunci nonaktif', () => {
    const html = render();
    const toggle = /<button[^>]*aria-controls="([^"]+)"[^>]*>(?:(?!<\/button>).)*Saringan lain/.exec(html)!;
    expect(toggle[0]).toContain('aria-expanded="false"');
    const panel = new RegExp(`<div[^>]*id="${toggle[1]}"[^>]*>`).exec(html)![0];
    expect(panel).toContain('hidden=""');
    expect(html).toContain(`>Semua pengaturan (${ADVANCED.length})</option>`);
    expect(html).toContain('aria-label="Saring jenis pengaturan"');
    // Permukaan lanjutan tidak punya kunci nonaktif: kotak centangnya tidak ditawarkan.
    expect(ADVANCED.some((d) => d.inactive)).toBe(false);
    expect(html).not.toContain('Tampilkan yang nonaktif');
    // Mode gaya (seluruh registri) punya kunci nonaktif: kotak centang tersedia di Saringan lain.
    expect(ALL_PARAMS.some((d) => d.inactive)).toBe(true);
    expect(render({ registry: ALL_PARAMS })).toContain('Tampilkan yang nonaktif');
  });

  it('ringkasan: "Menampilkan N pengaturan · nilai asal: ..." tanpa kata "induk"/"parameter"', () => {
    const html = render();
    expect(html).toContain(`Menampilkan ${ADVANCED.length} pengaturan`);
    expect(html).toContain('nilai asal: <span');
    expect(html).not.toContain('induk:');
    expect(html).not.toMatch(/\d+ dari \d+ parameter/);
  });

  it('baris kategori: chevron, deskripsi terlihat, "N pengaturan", nama aksesibel bagian', () => {
    const html = render();
    const tipo = sectionOf(html, 'tipografi');
    const total = view().find((c) => c.id === 'cat:tipografi')!.total;
    expect(tipo).toContain(`>${help('tipografi')}</span>`);
    expect(tipo).toContain(`${total} pengaturan`);
    expect(tipo).toMatch(/<svg[^>]*lucide-chevron-right/);
    expect(html).not.toMatch(/\d+ kelompok/);
    const labelled = /<section[^>]*aria-labelledby="([^"]+)"/.exec(tipo)![1];
    expect(new RegExp(`id="${labelled}"[^>]*>Tipografi<`).test(tipo)).toBe(true);
    const controls = /<button[^>]*aria-controls="([^"]+)"[^>]*data-category="tipografi"/.exec(tipo)![1];
    expect(tipo).toContain(`id="${controls}"`);
  });

  it('tombol kategori bertipe button dan aktif di luar pencarian (temuan 8c)', () => {
    const html = render();
    const buttons = html.match(/<button[^>]*data-category="[^"]+"[^>]*>/g)!;
    expect(buttons.length).toBe(view().length);
    for (const b of buttons) {
      expect(b).toContain('type="button"');
      expect(b).not.toMatch(/\sdisabled=/);
    }
  });

  it('kategori kecil tampil datar (tanpa tombol subkelompok); kategori besar tetap bersubkelompok', () => {
    const v = view();
    expect(v.find((c) => c.id === 'cat:lembar-kendali')!.flat).toBe(true);
    expect(v.find((c) => c.id === 'cat:tipografi')!.flat).toBe(false);
    // Render: kategori yang punya perubahan terbuka sejak awal; Lembar kendali datar langsung menampilkan baris.
    const html = render({ draft: { [CONTROL_KEY]: ['a'] }, loaded: {} });
    const sec = sectionOf(html, 'lembar-kendali');
    expect(sec).toMatch(/<button[^>]*aria-expanded="true"[^>]*data-category="lembar-kendali"/);
    expect(sec).toContain('1 diubah');
    expect(sec).not.toMatch(/data-subgroup=/);
    expect(sec).toMatch(/<li /);
  });

  it('"n diubah": nilai sama dengan versi dimuat tidak dihitung; kunci yang dihapus dihitung (temuan 8b)', () => {
    const same = render({ draft: { [GRID_KEY]: 120 }, loaded: { [GRID_KEY]: 120 } });
    expect(sectionOf(same, 'halaman-grid')).not.toContain('diubah');
    const removed = render({ draft: {}, loaded: { [GRID_KEY]: 120 } });
    expect(sectionOf(removed, 'halaman-grid')).toContain('1 diubah');
    const changed = render({ draft: { [GRID_KEY]: 130 }, loaded: { [GRID_KEY]: 120 } });
    expect(sectionOf(changed, 'halaman-grid')).toContain('1 diubah');
  });

  it('kategori Lainnya yang tidak kosong tetap dirender (temuan 8a)', () => {
    const unknown = { ...ADVANCED[0], id: 'R-zzz', key: 'zzzBaru.pengaturan', group: 'R' } as ParamDef;
    const html = render({ registry: [...ADVANCED, unknown] });
    expect(html).toContain('data-category="lainnya"');
    expect(sectionOf(html, 'lainnya')).toContain(help('lainnya'));
  });

  it('tingkat judul dapat dinaikkan ke h2 (mode gaya tanpa lompatan h1 ke h3)', () => {
    expect(render()).toMatch(/<h3[^>]*><button[^>]*data-category="warna"/);
    const html = render({ headingLevel: 2 });
    expect(html).toMatch(/<h2[^>]*><button[^>]*data-category="warna"/);
    expect(html).not.toMatch(/<h3[^>]*><button[^>]*data-category=/);
  });

  it('keadaan kosong ramah dengan tombol menghapus pencarian', () => {
    const html = render({ refFilter: ['zzzz-tidak-ada-yang-cocok'] });
    expect(html).toContain('Tidak ada pengaturan yang cocok');
    expect(html).toContain('>Hapus pencarian</button>');
    expect(html).toContain(`Menampilkan 0 dari ${ADVANCED.length} pengaturan`);
  });
});
