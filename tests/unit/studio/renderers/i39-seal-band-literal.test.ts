// I39-1 (verification/25 security review, CWE-20 integritas teks): `{kelas}` pita segel diisi
// klasifikasi apa adanya. Pola pengganti `String.prototype.replace` (`$&`, `$$`, `` $` ``, `$'`)
// di nilai klasifikasi tidak boleh diperluas.
import { describe, expect, it } from 'vitest';
import type { DocMeta } from '@/lib/studio/contract';
import { sealBandTextsOf } from '@/lib/studio/engine/front/texts';

const META = { classification: 'TERBATAS', language: 'ID', issueDate: '2026-10-08' } as unknown as DocMeta;

describe('I39-1: klasifikasi pita segel disisipkan literal', () => {
  it.each([
    ['A$&B', 'KLASIFIKASI · A$&B'],
    ['A$$B', 'KLASIFIKASI · A$$B'],
    ['A$`B', 'KLASIFIKASI · A$`B'],
    ["A$'B", "KLASIFIKASI · A$'B"],
  ])('ID bawaan: %s', (cls, want) => {
    expect(sealBandTextsOf({ ...META, classification: cls }, {}, 'ID')[0]).toBe(want);
  });

  it('pasangan templat dan EN juga literal', () => {
    expect(sealBandTextsOf({ ...META, classification: 'x$&y' }, { 'wrapper.header': ['KELAS {kelas}', 'R {kelas}'] }, 'ID')).toEqual(['KELAS X$&Y', 'R X$&Y']);
    expect(sealBandTextsOf({ ...META, language: 'EN', classification: '$&' }, {}, 'EN')[0]).toBe('CLASSIFICATION · $&');
  });

  it('klasifikasi biasa tidak berubah', () => {
    expect(sealBandTextsOf(META, {}, 'ID')[0]).toBe('KLASIFIKASI · TERBATAS');
  });
});
