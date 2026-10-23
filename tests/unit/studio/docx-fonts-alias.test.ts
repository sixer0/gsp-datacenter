// FIX-6 (F-059): wajah berlabel untuk nama alias keluarga ("IBM Plex Sans
// Condensed" = "IBM Plex Sans Cond") dibangun saat runtime dengan aturan relabel
// S99, sha256 terkunci, deterministik; sumber salah = galat, bukan cadangan diam-diam.
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  findRelabelAlias,
  findRelabelFace,
  readSfntFaceInfo,
  RELABEL_ALIAS_FACES,
  relabelAliasSource,
  renameFontFamily,
} from '@/lib/studio/engine/docx/fonts';
import { StudioEngineError } from '@/lib/studio/contract/errors';

const REPO = path.resolve(__dirname, '..', '..', '..');
const ASSETS = path.join(REPO, 'src', 'lib', 'studio', 'assets');
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

describe('renameFontFamily + RELABEL_ALIAS_FACES', () => {
  it('alias hanya untuk slot tebal "IBM Plex Sans Condensed"; nama persis S99 tidak dialiaskan', () => {
    expect(RELABEL_ALIAS_FACES.map((a) => `${a.family}|${a.slot}`)).toEqual(['IBM Plex Sans Condensed|bold', 'IBM Plex Sans Condensed|boldItalic']);
    expect(findRelabelAlias('IBM Plex Sans Condensed', 'regular')).toBeUndefined();
    expect(findRelabelAlias('IBM Plex Sans Cond', 'bold')).toBeUndefined();
    expect(findRelabelFace('IBM Plex Sans Condensed', 'bold')).toBeUndefined();
  });

  it.each(RELABEL_ALIAS_FACES.map((a) => [a.slot, a] as const))('slot %s: bangun deterministik = sha256 terkunci, label keluarga/bobot/gaya benar', (_slot, alias) => {
    const base = findRelabelFace(alias.from, alias.slot)!;
    const src = new Uint8Array(readFileSync(path.join(ASSETS, ...base.key.split('/'))));
    const a = renameFontFamily(src, alias.family);
    const b = renameFontFamily(src, alias.family);
    expect(sha(a)).toBe(alias.sha256);
    expect(sha(b)).toBe(sha(a));
    const info = readSfntFaceInfo(a, alias.key);
    expect(info.family).toBe('IBM Plex Sans Condensed');
    expect(info.weightClass).toBe(700);
    expect(info.italic).toBe(alias.slot === 'boldItalic');
    // Nama PostScript dipertahankan (nama fon di PDF tetap *-SemiBold*).
    expect(info.postscriptName).toBe(readSfntFaceInfo(src, base.key).postscriptName);
  });

  it('relabelAliasSource menulis cache sekali dan memakainya ulang; sumber sha salah -> BY_CONSTRUCTION_FAILED', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'fix6-alias-'));
    try {
      const alias = RELABEL_ALIAS_FACES[0];
      const s1 = relabelAliasSource(alias, [], ASSETS, dir);
      expect(sha(new Uint8Array(readFileSync(s1.absPath)))).toBe(alias.sha256);
      const s2 = relabelAliasSource(alias, [], ASSETS, dir);
      expect(s2.absPath).toBe(s1.absPath);

      // Cache rusak dibangun ulang.
      writeFileSync(s1.absPath, 'rusak');
      relabelAliasSource(alias, [], ASSETS, dir);
      expect(sha(new Uint8Array(readFileSync(s1.absPath)))).toBe(alias.sha256);

      // Sumber templat dengan byte lain -> galat, bukan wajah salah.
      const dir2 = mkdtempSync(path.join(os.tmpdir(), 'fix6-alias-'));
      const fake = path.join(dir2, 'fake.ttf');
      writeFileSync(fake, readFileSync(path.join(ASSETS, 'fonts', 'IBMPlexSansCond-SemiBold.ttf')));
      const base = findRelabelFace(alias.from, alias.slot)!;
      try {
        expect(() => relabelAliasSource(alias, [{ key: base.key, absPath: fake }], ASSETS, dir2)).toThrow(StudioEngineError);
      } finally {
        rmSync(dir2, { recursive: true, force: true });
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
