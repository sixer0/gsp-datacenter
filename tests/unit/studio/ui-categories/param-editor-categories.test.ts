// U03 (D-626/D-627/D-630): ParamEditor dikelompokkan per kategori (tingkat bab dihapus),
// subkelompok namespace di dalamnya. Uji tampilan memakai react-dom/server
// (renderToStaticMarkup, tanpa dependensi baru) dan uji view-model murni untuk pencarian.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ALL_PARAMS } from '@/lib/studio/params';
import type { ParamDef } from '@/lib/studio/contract/types/params';
import {
  ParamEditor,
  filterParamDefs,
  paramEditorView,
  type ParamEditorProps,
} from '@/components/studio/template-editor/param-editor';
import { PARAM_CATEGORIES } from '@/components/studio/template-editor/param-categories';

const REGISTRY: readonly ParamDef[] = ALL_PARAMS;
const ADVANCED: readonly ParamDef[] = ALL_PARAMS.filter((d) => d.surface === 'advanced');

const noop = () => {};
const props = (over: Partial<ParamEditorProps> = {}): ParamEditorProps => ({
  registry: REGISTRY,
  parentValues: {},
  parentLabel: 'Gaya dasar',
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

/** Teks tombol kepala kategori (h3 > button) berurutan. */
function categoryHeadings(html: string): string[] {
  const out: string[] = [];
  const re = /<h3[^>]*><button[^>]*data-category="([^"]+)"/g;
  for (let m = re.exec(html); m; m = re.exec(html)) out.push(m[1]);
  return out;
}

const label = (id: string) => PARAM_CATEGORIES.find((c) => c.id === id)!.label;

describe('U03 ParamEditor per kategori (render statis)', () => {
  it('mode preset: kepala kategori urut research/39, tanpa kepala "Bab", tertutup (aria-expanded=false)', () => {
    const html = render();
    const ids = categoryHeadings(html);
    expect(ids).toEqual(PARAM_CATEGORIES.map((c) => c.id).filter((id) => id !== 'lainnya'));
    expect(html).not.toMatch(/>Bab \d/);
    expect(html).not.toMatch(/>Renderer</);
    for (const id of ids) expect(html).toContain(escapeHtml(label(id)));
    expect(html).toMatch(/<h3[^>]*><button[^>]*aria-expanded="false"/);
    expect(html).not.toMatch(/<h3[^>]*><button[^>]*aria-expanded="true"/);
    // D-632: deskripsi kategori tampil sebagai teks (bukan hanya tooltip).
    expect(html).toContain('>Font, ketebalan, dan ukuran teks untuk judul, isi, dan caption.</span>');
    // Jumlah per kategori tetap tampil.
    expect(html).toContain('181 pengaturan');
  });

  it('permukaan lanjutan: kategori kosong (Bahasa, Pemeriksaan otomatis) disembunyikan', () => {
    const ids = categoryHeadings(render({ registry: ADVANCED }));
    expect(ids).not.toContain('bahasa');
    expect(ids).not.toContain('lint-pemeriksaan');
    expect(ids).not.toContain('lainnya');
    expect(ids[0]).toBe('warna');
    expect(ids.length).toBe(12);
  });

  it('saringan rujukan (refFilter) = mode cari: kategori terbuka otomatis dengan label subkelompok', () => {
    const html = render({ refFilter: ['P4V-01..16'] });
    expect(categoryHeadings(html)).toEqual(['sampul', 'kepala-kaki']);
    expect(html).toMatch(/<h3[^>]*><button[^>]*aria-expanded="true"/);
    expect(html).toContain('Unsur sampul');
    expect(html).toContain('Identitas organisasi');
    expect(html).toContain('title="cover"');
    // D-632: Header & footer hanya punya 1 hasil, jadi tampil datar (tanpa tombol subkelompok).
    const kk = html.slice(html.indexOf('data-category="kepala-kaki"'));
    expect(kk).not.toMatch(/data-subgroup=/);
    expect(kk).toContain('Kepala halaman pembungkus');
  });

  it('hitungan "n diubah" per kategori dari draf vs versi dimuat', () => {
    const html = render({ draft: { 'grid.textColumnMm': 120, 'color.accent': '#112233' }, loaded: {} });
    const seg = (id: string) => {
      const start = html.indexOf(`data-category="${id}"`);
      return html.slice(start, html.indexOf('</h3>', start));
    };
    expect(seg('halaman-grid')).toContain('1 diubah');
    expect(seg('tipografi')).not.toContain('diubah');
  });
});

describe('U03 view-model murni (pencarian dan pengelompokan)', () => {
  const base = { query: '', classFilter: 'all' as const, onlyOverridden: false, showInactive: true, refMatchers: [], draft: {}, loaded: {} };

  it('pencarian menyaring lalu mengelompokkan per kategori; mode cari membuka semua kelompok', () => {
    const filtered = filterParamDefs(REGISTRY, { ...base, query: 'runningHead' });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((d) => /runninghead/i.test(`${d.key} ${d.label} ${d.id} ${d.ruleRef}`))).toBe(true);
    const view = paramEditorView(filtered, { searching: true, open: new Set(), draft: {}, loaded: {} });
    expect(view.map((c) => c.id)).toContain('cat:kepala-kaki');
    for (const c of view) {
      expect(c.open).toBe(true);
      for (const s of c.subgroups) expect(s.open).toBe(true);
    }
  });

  it('tanpa mencari: status buka/tutup memakai id cat:<id> dan ns:<kategori>:<subkelompok>', () => {
    const view = paramEditorView(REGISTRY, {
      searching: false,
      open: new Set(['cat:gambar-chart', 'ns:gambar-chart:chart.kind']),
      draft: {},
      loaded: {},
    });
    const chart = view.find((c) => c.id === 'cat:gambar-chart')!;
    expect(chart.open).toBe(true);
    expect(chart.subgroups.find((s) => s.id === 'ns:gambar-chart:chart.kind')!.open).toBe(true);
    expect(chart.subgroups.find((s) => s.id === 'ns:gambar-chart:chart')!.open).toBe(false);
    expect(view.find((c) => c.id === 'cat:warna')!.open).toBe(false);
  });

  it('saringan kelas dan nonaktif tetap berlaku', () => {
    const k = filterParamDefs(REGISTRY, { ...base, classFilter: 'K' });
    expect(k.length).toBeGreaterThan(0);
    expect(k.every((d) => d.class === 'K')).toBe(true);
    const active = filterParamDefs(REGISTRY, { ...base, showInactive: false });
    expect(active.some((d) => d.inactive)).toBe(false);
  });
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;');
}
