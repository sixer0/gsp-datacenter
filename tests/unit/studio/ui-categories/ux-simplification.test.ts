// D-632 (arahan USER "ui uxnya tolong pikirkan agar eksperience user tidak merasa rumit ya" dan
// "gunakan istilah umum yang mudah dipahami saja, jangan over translate"): label kategori dan
// subkelompok berbahasa umum tanpa jargon pengembang, deskripsi satu baris per kategori, dan
// tingkat subkelompok dilewati untuk kategori kecil (fungsi murni atas data terkelompok).
import { describe, expect, it } from 'vitest';
import { ALL_PARAMS } from '@/lib/studio/params';
import * as categories from '@/components/studio/template-editor/param-categories';
import {
  PARAM_CATEGORIES,
  categoryOf,
  groupByCategory,
  showSubgroups,
  SUBGROUP_FLAT_MAX_SETTINGS,
  subgroupLabel,
} from '@/components/studio/template-editor/param-categories';
import { namespaceLabel } from '@/components/studio/template-editor/param-labels';
import { groupParamsByCategory } from '@/components/studio/template-preview/param-tools';

const label = (id: string) => PARAM_CATEGORIES.find((c) => c.id === id)!.label;
const norm = (s: string) => s.toLowerCase().replace(/&/g, 'dan').replace(/\s+/g, ' ').trim();

/** Jargon pengembang yang tidak boleh tampil di label kategori/subkelompok. */
const JARGON = /\b(lint|renderer|perender|run|namespace|v1|docx|tier|provenans|xlsx|pptx)\b/i;

describe('D-632 label kategori', () => {
  it('label umum; id kategori tetap (status buka tersimpan tidak berubah)', () => {
    expect(label('halaman-grid')).toBe('Halaman & grid');
    expect(label('gambar-chart')).toBe('Gambar & chart');
    expect(label('lint-pemeriksaan')).toBe('Pemeriksaan otomatis');
    expect(label('renderer-ekspor')).toBe('Pembuatan file & ekspor');
    expect(label('kepala-kaki')).toBe('Header & footer');
    for (const c of PARAM_CATEGORIES) expect(c.label, c.id).not.toMatch(JARGON);
  });

  it('setiap kategori punya deskripsi satu kalimat pendek tanpa jargon', () => {
    for (const c of PARAM_CATEGORIES) {
      expect(c.help.length, c.id).toBeGreaterThan(10);
      expect(c.help.length, c.id).toBeLessThanOrEqual(90);
      expect(c.help, c.id).toMatch(/\.$/);
      expect(c.help.slice(0, -1), c.id).not.toMatch(/[.;]/);
      expect(c.help, c.id).not.toMatch(JARGON);
    }
  });
});

describe('D-632 label subkelompok', () => {
  const live = groupByCategory(ALL_PARAMS);

  it('tanpa jargon pengembang dan tanpa mengulang nama kategorinya (temuan 2 dan 3)', () => {
    for (const c of live) {
      for (const s of c.subgroups) {
        expect(s.label, `${c.category.id}/${s.key}`).not.toMatch(JARGON);
        expect(norm(s.label), `${c.category.id}/${s.key}`).not.toBe(norm(c.category.label));
      }
    }
  });

  it('contoh label baru memakai istilah umum', () => {
    expect(subgroupLabel('tipografi', 'render')).toBe('Format teks dan bullet di file Word');
    expect(subgroupLabel('renderer-ekspor', 'ingest')).toBe('Format teks isi kiriman');
    expect(subgroupLabel('lembar-kendali', 'controlSheet')).toBe('Isi lembar kendali');
    expect(subgroupLabel('tabel', 'table')).toBe('Garis, isian, dan kepala tabel');
    expect(subgroupLabel('halaman-grid', 'grid')).toBe('Grid dan margin');
    expect(subgroupLabel('gambar-chart', 'chart')).toBe('Aturan umum chart');
  });

  it('kunci bernama anggota Object.prototype tidak bocor sebagai fungsi (temuan 7)', () => {
    expect(categoryOf({ group: 'constructor' as never, key: 'constructor.x' })).toBe('lainnya');
    expect(categoryOf({ group: 'toString' as never, key: 'a.b' })).toBe('lainnya');
    expect(namespaceLabel('constructor')).toBe('constructor');
    expect(subgroupLabel('warna', 'hasOwnProperty')).toBe('hasOwnProperty');
    const g = groupByCategory([{ group: 'constructor' as never, key: 'constructor.x' }]);
    expect(g.map((c) => c.category.id)).toEqual(['lainnya']);
    expect(g[0].total).toBe(1);
  });

  it('paramCategory() yang tidak terpakai sudah dihapus (temuan 6)', () => {
    expect('paramCategory' in categories).toBe(false);
  });
});

describe('D-632 tingkat subkelompok dilewati untuk kategori kecil', () => {
  it(`aturan murni: subkelompok tampil hanya bila > 1 subkelompok dan > ${SUBGROUP_FLAT_MAX_SETTINGS} pengaturan`, () => {
    expect(SUBGROUP_FLAT_MAX_SETTINGS).toBe(8);
    expect(showSubgroups({ subgroups: [1], total: 50 })).toBe(false);
    expect(showSubgroups({ subgroups: [1, 2], total: 8 })).toBe(false);
    expect(showSubgroups({ subgroups: [1, 2], total: 9 })).toBe(true);
    expect(showSubgroups({ subgroups: [], total: 0 })).toBe(false);
  });

  it('groupByCategory menandai flat dari data terkelompok (permukaan lanjutan)', () => {
    const adv = groupByCategory(ALL_PARAMS.filter((d) => d.surface === 'advanced'));
    const flat = Object.fromEntries(adv.map((c) => [c.category.id, c.flat]));
    // Lembar kendali (8 sejak C06, satu subkelompok) dan Pembuatan file (2 sejak C06, satu subkelompok) tampil datar.
    expect(flat['lembar-kendali']).toBe(true);
    expect(flat['renderer-ekspor']).toBe(true);
    // C06 (R-76, R-77, R-78): Penomoran lanjutan 8 -> 11 pengaturan dalam beberapa subkelompok, jadi melewati
    // batas SUBGROUP_FLAT_MAX_SETTINGS dan kini bersubkelompok (aturan D-632 yang sama, bukan perubahan aturan).
    expect(flat['penomoran-klasifikasi']).toBe(false);
    // Kategori besar tetap bersubkelompok.
    expect(flat['tipografi']).toBe(false);
    expect(flat['gambar-chart']).toBe(false);
    expect(flat['halaman-grid']).toBe(false);
    for (const c of adv) expect(c.flat).toBe(!showSubgroups(c));
  });

  it('panel pratinjau memakai aturan yang sama lewat helper bersama', () => {
    const adv = ALL_PARAMS.filter((d) => d.surface === 'advanced');
    const shared = groupByCategory(adv);
    expect(groupParamsByCategory(adv).map((c) => c.flat)).toEqual(shared.map((c) => c.flat));
  });
});
