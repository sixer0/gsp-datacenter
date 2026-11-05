// U04 (D-627 "Preview pane grouping", D-630 satu helper bersama): utilitas parameter
// panel pratinjau mengelompokkan per kategori lewat groupByCategory yang sama dengan
// editor; pengelompokan bab (chapterRank) dihapus dari template-preview.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_PARAMS } from '@/lib/studio/params';
import { groupByCategory } from '@/components/studio/template-editor/param-categories';
import * as tools from '@/components/studio/template-preview/param-tools';
import * as pane from '@/components/studio/template-preview';

const ROOT = join(__dirname, '..', '..', '..', '..');
const PREVIEW_DIR = join(ROOT, 'src', 'components', 'studio', 'template-preview');

describe('U04 param-tools per kategori', () => {
  it('groupParamsByCategory = struktur groupByCategory editor (kategori, subkelompok, urutan, id)', () => {
    const g = tools.groupParamsByCategory(ALL_PARAMS);
    const shared = groupByCategory(ALL_PARAMS);
    expect(g.map((c) => c.id)).toEqual(shared.map((c) => c.id));
    expect(g.map((c) => c.namespaces.map((n) => n.id))).toEqual(shared.map((c) => c.subgroups.map((s) => s.id)));
    expect(g.map((c) => c.namespaces.map((n) => n.label))).toEqual(shared.map((c) => c.subgroups.map((s) => s.label)));
    expect(g.map((c) => c.namespaces.map((n) => n.params.map((p) => p.key)))).toEqual(shared.map((c) => c.subgroups.map((s) => s.defs.map((d) => d.key))));
    expect(g[0].category.label).toBe('Warna');
  });

  it('hitungan kelas B/K/T per subkelompok dan per kategori konsisten dengan total', () => {
    const g = tools.groupParamsByCategory(ALL_PARAMS);
    let all = 0;
    for (const c of g) {
      const sum = c.counts.B + c.counts.K + c.counts.T;
      expect(sum).toBe(c.total);
      expect(c.namespaces.reduce((n, s) => n + s.params.length, 0)).toBe(c.total);
      for (const s of c.namespaces) {
        expect(s.counts.B + s.counts.K + s.counts.T).toBe(s.params.length);
        expect(s.counts.K).toBe(s.params.filter((p) => p.class === 'K').length);
      }
      all += c.total;
    }
    expect(all).toBe(802); // C06: 788 + R-67..R-80
  });

  it('kategori kosong disembunyikan pada subset (permukaan lanjutan)', () => {
    const ids = tools.groupParamsByCategory(ALL_PARAMS.filter((d) => d.surface === 'advanced')).map((c) => c.category.id);
    expect(ids).not.toContain('bahasa');
    expect(ids).not.toContain('lint-pemeriksaan');
    expect(tools.groupParamsByCategory([])).toEqual([]);
  });

  it('searchParams menyaring per kategori (opsi chapter diganti category)', () => {
    const r = tools.searchParams(ALL_PARAMS, '', { category: 'sampul' });
    expect(r.length).toBe(24); // C06: + cover.title.maxWidthMm, cover.controlBlock.preparerUnit
    const q = tools.searchParams(ALL_PARAMS, 'rules', { category: 'lint-pemeriksaan' });
    expect(q.map((p) => p.key)).toEqual(['rules.index']);
  });

  it('pengelompokan bab dihapus: tanpa chapterRank/groupParams di modul dan barrel; 0 chapterRank di template-preview', () => {
    expect('chapterRank' in tools).toBe(false);
    expect('groupParams' in tools).toBe(false);
    expect('chapterRank' in pane).toBe(false);
    expect('groupParams' in pane).toBe(false);
    expect(typeof pane.groupParamsByCategory).toBe('function');
    for (const f of readdirSync(PREVIEW_DIR)) {
      const src = readFileSync(join(PREVIEW_DIR, f), 'utf8');
      expect(src, f).not.toMatch(/chapterRank/);
      expect(src, f).not.toMatch(/\.chapter\b/);
    }
  });
});
