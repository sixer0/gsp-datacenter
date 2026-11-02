// ENG-FIX #3: render fixture paritas yang lint-bersih harus byte-identik dengan sidik sha256 yang
// di-commit (`__fixtures__/clean-svg-manifest.json`). Perubahan sah memperbarui manifes secara
// eksplisit di diff: jalankan dengan `UPDATE_CLEAN_SVG_MANIFEST=1` lalu tinjau perubahan sha.
import { describe, it, expect } from 'vitest';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { readJson } from './_helpers';
import { CLEAN_SVG_MANIFEST, type CleanSvgManifest, parityRenders, sha256 } from './_svgManifest';

const NOTE =
  'ENG-FIX #3: sha256 render fixture paritas (chart datum/gallery, diagram rel/draf). renders = lint-bersih (wajib byte-identik); fitted = render fit (terkunci). ' +
  'Dibuat ulang hanya dengan UPDATE_CLEAN_SVG_MANIFEST=1; setiap sha yang berubah wajib dijelaskan di laporan baris.';

describe('penjaga byte-identik render bersih (manifest sha256)', () => {
  const renders = parityRenders();
  const clean = renders.filter((r) => r.clean);

  if (process.env.UPDATE_CLEAN_SVG_MANIFEST === '1') {
    it('menulis ulang manifest (mode pembaruan eksplisit)', () => {
      const out: CleanSvgManifest = {
        note: NOTE,
        renders: Object.fromEntries(clean.map((r) => [r.id, sha256(r.svg)])),
        fitted: Object.fromEntries(renders.filter((r) => !r.clean).map((r) => [r.id, sha256(r.svg)])),
      };
      mkdirSync(path.dirname(CLEAN_SVG_MANIFEST), { recursive: true });
      writeFileSync(CLEAN_SVG_MANIFEST, `${JSON.stringify(out, null, 2)}\n`);
      expect(clean.length).toBeGreaterThan(0);
    });
    return;
  }

  it('manifest ada dan memuat render chart serta diagram', () => {
    expect(existsSync(CLEAN_SVG_MANIFEST)).toBe(true);
    const m = readJson<CleanSvgManifest>(CLEAN_SVG_MANIFEST);
    const ids = Object.keys(m.renders);
    expect(ids.filter((id) => id.startsWith('chart/')).length).toBeGreaterThan(60);
    expect(ids.filter((id) => id.startsWith('diagram/')).length).toBeGreaterThanOrEqual(6);
    expect(Object.keys(m.fitted).filter((id) => id.startsWith('diagram/')).length).toBeGreaterThan(10);
  });

  it('setiap render di manifest masih bersih dan sha256-nya sama persis', () => {
    const m = readJson<CleanSvgManifest>(CLEAN_SVG_MANIFEST);
    const byId = new Map(renders.map((r) => [r.id, r]));
    const mismatch: string[] = [];
    for (const [id, want] of Object.entries(m.renders)) {
      const r = byId.get(id);
      if (!r) mismatch.push(`${id}: tidak lagi dirender`);
      else if (!r.clean) mismatch.push(`${id}: tidak lagi lint-bersih`);
      else if (sha256(r.svg) !== want) mismatch.push(`${id}: sha ${want.slice(0, 16)} -> ${sha256(r.svg).slice(0, 16)}`);
    }
    expect(mismatch).toEqual([]);
  });

  it('render fit (bercacat di render pertama) juga terkunci: perubahan wajib lewat pembaruan manifest', () => {
    const m = readJson<CleanSvgManifest>(CLEAN_SVG_MANIFEST);
    const byId = new Map(renders.map((r) => [r.id, r]));
    const mismatch = Object.entries(m.fitted)
      .filter(([id, want]) => !byId.has(id) || sha256(byId.get(id)!.svg) !== want)
      .map(([id, want]) => `${id}: sha ${want.slice(0, 16)} -> ${byId.has(id) ? sha256(byId.get(id)!.svg).slice(0, 16) : 'tidak dirender'}`);
    expect(mismatch).toEqual([]);
    expect(renders.filter((r) => !(r.id in m.renders) && !(r.id in m.fitted)).map((r) => r.id)).toEqual([]);
  });

  it('render bersih baru wajib ditambahkan ke manifest secara eksplisit', () => {
    const m = readJson<CleanSvgManifest>(CLEAN_SVG_MANIFEST);
    expect(clean.map((r) => r.id).filter((id) => !(id in m.renders))).toEqual([]);
  });
});
