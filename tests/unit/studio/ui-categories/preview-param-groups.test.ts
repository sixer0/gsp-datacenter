// C34 tindak lanjut #16 (D-650; permintaan USER D-627 "Preview pane grouping"): panel pratinjau merender daftar
// pengaturan terkelompok per kategori lewat helper bersama, dengan gaya editor (D-633, D-637): akordeon saja (tanpa
// chip), label polos, deskripsi satu baris, jumlah, semua tertutup pada awalnya. Tanpa judul bab. Tampilan diuji
// lewat renderToStaticMarkup (tanpa dependensi baru), termasuk pemasangan di TemplatePreviewPane.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ALL_PARAMS } from '@/lib/studio/params';
import { PARAM_CATEGORIES, categoryOf, groupByCategory } from '@/components/studio/template-editor/param-categories';
import { PreviewParamGroups, previewParamDefs } from '@/components/studio/template-preview/param-groups';
import { TemplatePreviewPane } from '@/components/studio/template-preview';

/** Satu kunci per kategori untuk beberapa kategori berbeda (registri hidup, bukan pin). */
const SAMPLE_KEYS = (() => {
  const seen = new Map<string, string>();
  for (const d of ALL_PARAMS) if (!d.inactive && !seen.has(categoryOf(d))) seen.set(categoryOf(d), d.key);
  return [...seen.values()].slice(0, 4);
})();
const VALUES = Object.fromEntries(SAMPLE_KEYS.map((k) => [k, ALL_PARAMS.find((d) => d.key === k)!.default ?? null]));
const CATEGORY_IDS = SAMPLE_KEYS.map((k) => categoryOf(ALL_PARAMS.find((d) => d.key === k)!));
const help = (id: string) => PARAM_CATEGORIES.find((c) => c.id === id)!;
const esc = (s: string) => s.replace(/&/g, "&amp;");
const render = (values: Record<string, unknown>, initialOpen?: string[]) =>
  renderToStaticMarkup(createElement(PreviewParamGroups, { registry: ALL_PARAMS, values: values as never, initialOpen }));

describe('C34 #16: daftar pengaturan pratinjau per kategori', () => {
  it('previewParamDefs: hanya kunci registri yang punya nilai, urutan registri, kunci asing diabaikan', () => {
    const defs = previewParamDefs(ALL_PARAMS, { ...VALUES, 'tidak.ada': 1 });
    expect(defs.map((d) => d.key).sort()).toEqual([...SAMPLE_KEYS].sort());
    const pos = defs.map((d) => ALL_PARAMS.findIndex((p) => p.key === d.key));
    expect(pos).toEqual([...pos].sort((a, b) => a - b));
  });

  it('kategori tampil sebagai akordeon berlabel polos dengan deskripsi satu baris dan jumlah; urutan = helper bersama', () => {
    const html = render(VALUES);
    const order = groupByCategory(previewParamDefs(ALL_PARAMS, VALUES)).map((g) => g.category.id);
    expect([...html.matchAll(/data-category="([^"]+)"/g)].map((m) => m[1])).toEqual(order);
    expect(order.sort()).toEqual([...CATEGORY_IDS].sort());
    for (const id of CATEGORY_IDS) {
      expect(html).toContain(`>${esc(help(id).label)}<`);
      expect(html).toContain(esc(help(id).help));
    }
    expect(html).toContain('1 pengaturan');
    expect(html).toContain(`Pengaturan yang dipakai pratinjau: ${SAMPLE_KEYS.length} pengaturan, per kategori.`);
    expect((html.match(/<h3/g) ?? []).length).toBe(CATEGORY_IDS.length);
    expect((html.match(/aria-expanded="false"/g) ?? []).length).toBe(CATEGORY_IDS.length);
  });

  it('awal tenang: semua kategori tertutup, panel hidden, tanpa baris; tanpa chip dan tanpa judul bab', () => {
    const html = render(VALUES);
    expect(html).not.toContain('aria-expanded="true"');
    expect((html.match(/hidden=""/g) ?? []).length).toBe(CATEGORY_IDS.length);
    expect(html).not.toContain('<li');
    expect(html).not.toMatch(/chip/i);
    expect(html).not.toMatch(/\bBab \d/);
    expect(html).not.toContain('data-chapter');
  });

  it('kategori terbuka: baris berlabel polos dengan nilai, tanpa kunci teknis', () => {
    const first = CATEGORY_IDS[0];
    const html = render(VALUES, [`cat:${first}`]);
    expect(html).toContain('aria-expanded="true"');
    const def = ALL_PARAMS.find((d) => d.key === SAMPLE_KEYS[0])!;
    expect(html).toContain('<li');
    expect(html).not.toContain(`>${def.key}<`);
    expect(html).not.toMatch(/\bBab \d/);
  });

  it('tanpa nilai yang dikenal registri: tidak merender apa pun', () => {
    expect(render({})).toBe('');
    expect(render({ 'tidak.ada': 1 })).toBe('');
  });
});

describe('C34 #16: terpasang di TemplatePreviewPane', () => {
  const pane = (extra: Record<string, unknown>) =>
    renderToStaticMarkup(createElement(TemplatePreviewPane, { templateId: 'tpl-x', draftOverrides: {}, ...extra } as never));

  it('dengan registri: daftar terkelompok tampil di panel pratinjau (nilai esensial + lanjutan draf)', () => {
    const [a, b, ...rest] = SAMPLE_KEYS;
    const html = pane({ paramRegistry: ALL_PARAMS, essentials: { [a]: VALUES[a], [b]: VALUES[b] }, advanced: Object.fromEntries(rest.map((k) => [k, VALUES[k]])) });
    expect(html).toContain('data-preview-param-groups');
    expect([...html.matchAll(/data-category="([^"]+)"/g)].map((m) => m[1]).sort()).toEqual([...CATEGORY_IDS].sort());
    expect(html).not.toMatch(/\bBab \d/);
    // Perilaku pratinjau tetap: judul panel, iframe/placeholder, catatan PDF.
    expect(html).toContain('Pratinjau');
    expect(html).toContain('Pratinjau perkiraan; hasil akhir ada di berkas PDF.');
  });

  it('jalur kerangka v2: nilai diambil dari draftTemplate (esensial + lanjutan)', () => {
    const [a, b] = SAMPLE_KEYS;
    const draftTemplate = { preset: { slug: 'p', version: 1 }, essentials: { [a]: VALUES[a] }, advanced: { [b]: VALUES[b] }, skeleton: { slots: [{ slotKey: 'content', sectionType: 'chapter', tiers: [] }] } };
    const html = pane({ paramRegistry: ALL_PARAMS, draftTemplate });
    expect(html).toContain('Pengaturan yang dipakai pratinjau: 2 pengaturan, per kategori.');
  });

  it('tanpa registri (belum dimuat): panel tetap seperti sebelumnya, tanpa daftar', () => {
    const html = pane({ essentials: VALUES });
    expect(html).not.toContain('data-preview-param-groups');
    expect(html).toContain('Pratinjau perkiraan; hasil akhir ada di berkas PDF.');
  });
});
