// FIX-F lanjutan (D-314): tab Kelengkapan menampilkan pengisi slot dalam label awam (`actorLabel`, D-297),
// bukan nilai mentah `lastFilledBy` (`agent:<id>` sejak C1 / D-313).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { slotFillerText } from '@/components/studio/document-viewer/completeness-tab';

const SRC = path.resolve(__dirname, '..', '..', '..', '..', 'src', 'components', 'studio', 'document-viewer', 'completeness-tab.tsx');

describe('completeness-tab: label pengisi slot', () => {
  it('slotFillerText memetakan format kontrak ke label awam', () => {
    expect(slotFillerText('agent:analis-01')).toBe('Agen analis-01');
    expect(slotFillerText('user:budi')).toBe('budi');
    expect(slotFillerText(null)).toBe('-');
    expect(slotFillerText(undefined)).toBe('-');
  });

  it('tidak ada tempat yang merender `lastFilledBy` mentah (tabel dan kartu ponsel)', () => {
    const src = readFileSync(SRC, 'utf8');
    expect(src).not.toMatch(/s\.lastFilledBy \?\? "-"/);
    expect(src).not.toMatch(/Diisi oleh \$\{s\.lastFilledBy\}/);
    expect(src).toMatch(/slotFillerText\(s\.lastFilledBy\)/);
    expect(src).toMatch(/Diisi oleh \$\{actorLabel\(s\.lastFilledBy\)\}/);
  });
});
