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
    // Nilai sebelum S11 (diukur 2026-11-04 di working tree v2.1, juga `registryParamsSha256` log seed dry-run DEV):
    // a18d36eafa6bdabe9035d1a68b410c439177c33c342937a281205ed5ac517a9f. Pin ini bergerak dengan setiap parameter
    // registri baru berbawaan (verification/30 R2): C06 (R-67..R-80, 2026-11-05) dihitung ulang, bukan ditebak,
    // dan sama dengan `registryParamsSha256` dry-run seed DEV C06. Tambahan enum saja tidak menggerakkannya.
    expect(canonicalVersionPayload().paramsSha256).toBe('dcb7166bc12ab7d6c34906b376a7da6d7562f0d8c1d70ea81a3fd4b396a5dfd9');
  });
});
