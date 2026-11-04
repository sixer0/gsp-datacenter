/**
 * S11 (blueprint 02_structured_datum_rev_a.md, P0-2; D-590): kode jenis NDA diterima `doc.typeCode`
 * tanpa mengubah daftar bawaan; nilai bawaan masuk `paramsSha256`, jadi sidik profil kanonik tetap.
 */
import { describe, expect, it } from 'vitest';
import { PARAMS_BY_KEY } from '@/lib/studio/params';
import { resolveParams, validateParamValue } from '@/lib/studio/engine/tokens';
import { ALL_PARAMS } from '@/lib/studio/params';
import { canonicalVersionPayload } from '@/lib/studio/services/templates';

const DEF = PARAMS_BY_KEY.get('doc.typeCode')!;

describe('S11 doc.typeCode NDA', () => {
  it('NDA diterima sebagai anggota daftar kode jenis', () => {
    expect(validateParamValue(DEF, ['KT', 'NDA'])).toBeNull();
    const r = resolveParams({ base: {}, overrides: { 'doc.typeCode': ['KT', 'PT', 'NDA'] }, registry: ALL_PARAMS });
    expect(r.errors).toEqual([]);
    expect(r.params['doc.typeCode']).toEqual(['KT', 'PT', 'NDA']);
  });

  it('kode di luar daftar tertutup tetap ditolak', () => {
    expect(validateParamValue(DEF, ['KT', 'XYZ'])).not.toBeNull();
  });

  it('daftar bawaan tidak berubah (NDA tidak masuk bawaan)', () => {
    expect(DEF.default).toEqual(['KT', 'PT', 'RAB', 'SPH', 'SP', 'BA', 'DS', 'STD']);
  });

  it('paramsSha256 kanonik tidak berubah', () => {
    // Nilai sebelum S11 (diukur 2026-11-04 di working tree v2.1, juga `registryParamsSha256` log seed dry-run DEV).
    expect(canonicalVersionPayload().paramsSha256).toBe('a18d36eafa6bdabe9035d1a68b410c439177c33c342937a281205ed5ac517a9f');
  });
});
