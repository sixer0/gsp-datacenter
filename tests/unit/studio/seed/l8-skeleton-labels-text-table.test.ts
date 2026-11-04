/**
 * L8 (D-610; review `verification/24_datum_rev_a_code_review.md` L8): label slot ID kerangka datum-gsp untuk lembar
 * kendali dan daftar isi berasal dari tabel teks pembungkus, jadi terjemahan EN (`controlSheetLabelText`) tetap
 * bekerja setelah satu suntingan; nilai tersimpan tetap byte-sama ("Lembar Kendali", "Daftar Isi").
 */
import { describe, expect, it } from 'vitest';
import { controlSheetLabelText, WRAPPER_TEXT } from '../../../../src/lib/studio/engine/front/texts';
import { DATUM_SKELETON_SLOTS } from '../../../../prisma/seed-studio-templates';

const label = (key: string) => DATUM_SKELETON_SLOTS.find((s) => s.slotKey === key)?.label;

describe('L8: label slot kerangka datum-gsp dari tabel teks', () => {
  it('nilai tersimpan tetap literal lama (kerangka byte-sama)', () => {
    expect(label('controlSheet')).toBe('Lembar Kendali');
    expect(label('toc')).toBe('Daftar Isi');
  });

  it('label = entri ID tabel teks, sehingga dokumen EN menerjemahkan label lembar kendali', () => {
    expect(label('controlSheet')).toBe(WRAPPER_TEXT.controlKicker.ID);
    expect(label('toc')).toBe(WRAPPER_TEXT.tocKicker.ID);
    expect(controlSheetLabelText(label('controlSheet') as string, 'EN')).toBe('Control Sheet');
  });
});
