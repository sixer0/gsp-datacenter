// FIX-SEC N-03 (SR-57, D-247): safeNext menolak target ?next= yang setelah
// normalisasi URL bisa menjadi protocol-relative (`//host`), backslash, atau
// keluar origin, dan mengembalikan bentuk ternormalisasi (bukan masukan mentah).
import { describe, expect, it } from 'vitest';
import { LOGIN_DEFAULT_DEST, safeNext } from '@/app/login/safe-next';

const REJECTED: Array<[string, string]> = [
  ['dot segment + double slash', '/.//evil.com'],
  ['dot-dot segment + double slash', '/..//evil.com'],
  ['dot segment mid path', '/a/./b'],
  ['dot-dot traversal', '/studio/../../evil.com'],
  ['trailing dot', '/studio/.'],
  ['trailing dot-dot', '/studio/..'],
  ['encoded slash after root', '/%2fevil.com'],
  ['encoded slash upper case', '/%2Fevil.com'],
  ['encoded backslash', '/%5cevil.com'],
  ['encoded backslash upper', '/%5Cevil.com'],
  ['encoded dot segment', '/%2e%2e//evil.com'],
  ['encoded single dot', '/%2e/evil.com'],
  ['double encoded slash', '/%252f%252fevil.com'],
  ['encoded tab', '/%09/evil.com'],
  ['encoded newline', '/%0a/evil.com'],
  ['encoded carriage return', '/%0D/evil.com'],
  ['encoded NUL', '/studio%00'],
  ['encoded DEL', '/studio%7f'],
  ['encoded control in query', '/studio?x=%0a'],
  ['protocol relative', '//evil.com'],
  ['backslash host', '/\\evil.com'],
  ['backslash later', '/studio\\evil'],
  ['absolute URL', 'https://evil.com'],
  ['javascript scheme', 'javascript:alert(1)'],
  ['raw tab', '/\t/evil.com'],
  ['raw newline', '/\n/evil.com'],
  ['raw space', '/ /evil.com'],
  ['relative without slash', 'studio'],
  ['empty', ''],
  ['login page', '/login'],
  ['login page trailing slash', '/login/'],
  ['too long', '/' + 'a'.repeat(2048)],
];

const ACCEPTED: Array<[string, string, string]> = [
  ['plain path', '/studio/documents', '/studio/documents'],
  ['root', '/', '/'],
  ['query kept', '/studio?tab=buat&x=1', '/studio?tab=buat&x=1'],
  ['encoded slash in query is fine', '/studio?q=a%2Fb', '/studio?q=a%2Fb'],
  ['hash kept', '/studio/documents#bab-2', '/studio/documents#bab-2'],
  ['encoded space in path', '/studio/a%20b', '/studio/a%20b'],
  ['dots inside a segment name', '/studio/v1.2/file..x', '/studio/v1.2/file..x'],
];

describe('safeNext N-03: varian normalisasi jalur ditolak', () => {
  it.each(REJECTED)('%s -> fallback', (_label, raw) => {
    expect(safeNext(raw)).toBe(LOGIN_DEFAULT_DEST);
  });

  it('null / undefined / non-string -> fallback', () => {
    expect(safeNext(null)).toBe('/');
    expect(safeNext(undefined)).toBe('/');
    expect(safeNext(42 as unknown as string)).toBe('/');
  });

  it('fallback khusus dihormati', () => {
    expect(safeNext('/.//evil.com', '/studio')).toBe('/studio');
  });
});

describe('safeNext N-03: jalur relatif sah diterima dalam bentuk ternormalisasi', () => {
  it.each(ACCEPTED)('%s', (_label, raw, want) => {
    expect(safeNext(raw)).toBe(want);
  });

  it('hasil tidak pernah diawali // atau memuat backslash', () => {
    for (const [, raw] of [...REJECTED, ...ACCEPTED.map(([l, r]) => [l, r] as [string, string])]) {
      const out = safeNext(raw);
      expect(out.startsWith('//')).toBe(false);
      expect(out.includes('\\')).toBe(false);
      expect(out.startsWith('/')).toBe(true);
    }
  });
});
