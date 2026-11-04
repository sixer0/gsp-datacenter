/**
 * L39-5 (verification/25_datum_rev_a_security_review.md): `ATTR_RE` di `lib/xml.ts` kuadratik pada
 * teks atribut yang panjang dan tak bertanda `=`. Seam: `parseXml` / `decodeEntities` (publik).
 * Dua kelompok: (1) karakterisasi perilaku atribut untuk masukan wajar dan menyimpang
 * (nilai harapan literal, bukan dihitung ulang dengan kode yang diuji), (2) masukan bermusuhan
 * 80.000+ karakter harus selesai di bawah 100 ms (sebelum perbaikan: ~4,1 s pada 80.000).
 */
import { describe, expect, it } from 'vitest';
import { XmlParseError, decodeEntities, parseXml } from '../../../../benchmark/datum_conformance/lib/xml';

function attrsOf(tag: string): Record<string, string> {
  return { ...parseXml(tag).attrs };
}

describe('parseXml atribut: perilaku yang dipertahankan', () => {
  it('membaca atribut berawalan namespace dengan tanda kutip ganda', () => {
    expect(attrsOf('<w:pgSz w:w="11906" w:h="16838" w:orient="portrait"/>')).toEqual({
      'w:w': '11906',
      'w:h': '16838',
      'w:orient': 'portrait',
    });
  });

  it('membaca tanda kutip tunggal, dan tanda kutip ganda di dalam kutip tunggal', () => {
    expect(attrsOf(`<a x='1' y='say "hi"' z="it's"/>`)).toEqual({ x: '1', y: 'say "hi"', z: "it's" });
  });

  it('mengizinkan spasi, tab, dan baris baru di sekitar "="', () => {
    expect(attrsOf('<a x = "1"  y\t=\n"2"\n  z="3"/>')).toEqual({ x: '1', y: '2', z: '3' });
  });

  it('mendekode entitas bawaan dan rujukan angka dalam nilai atribut', () => {
    expect(attrsOf('<a t="A &amp; B &lt;c&gt; &quot;d&quot; &apos;e&apos;" u="&#65;&#x42;" v="&bogus; &#xZZ;"/>')).toEqual({
      t: `A & B <c> "d" 'e'`,
      u: 'AB',
      v: '&bogus; &#xZZ;',
    });
  });

  it('mempertahankan nilai kosong dan nilai berisi baris baru', () => {
    expect(attrsOf('<a x="" y=\'\' z="l1\nl2"/>')).toEqual({ x: '', y: '', z: 'l1\nl2' });
  });

  it('atribut ganda: yang terakhir menang', () => {
    expect(attrsOf('<a x="1" x="2"/>')).toEqual({ x: '2' });
  });

  it('atribut berurutan tanpa spasi tetap terbaca', () => {
    expect(attrsOf('<a x="1"y="2"/>')).toEqual({ x: '1', y: '2' });
  });

  it('elemen bertanda penutup-sendiri dan elemen bersarang memakai atribut masing-masing', () => {
    const root = parseXml('<r a="1"><c b="2"/><d c="3">teks &amp; lain</d></r>');
    expect(root.attrs).toEqual({ a: '1' });
    expect(root.children).toHaveLength(2);
    const [c, d] = root.children as unknown as { attrs: Record<string, string>; children: { value?: string }[] }[];
    expect(c.attrs).toEqual({ b: '2' });
    expect(d.attrs).toEqual({ c: '3' });
    expect(d.children[0].value).toBe('teks & lain');
  });

  it('elemen tanpa atribut punya attrs kosong', () => {
    expect(attrsOf('<a/>')).toEqual({});
    expect(attrsOf('<a >x</a>')).toEqual({});
  });

  it('tanda ">" di dalam nilai atribut tidak mengakhiri tag', () => {
    expect(attrsOf('<a x="1>2" y=\'3>4\'/>')).toEqual({ x: '1>2', y: '3>4' });
  });

  it('teks atribut yang menyimpang diperlakukan seperti sebelumnya (nama tanpa nilai dilewati)', () => {
    // nama tanpa "=" dan nilai tanpa kutip tidak menghasilkan atribut; atribut sesudahnya tetap terbaca
    expect(attrsOf('<a lone b=c d="4"/>')).toEqual({ d: '4' });
    // "=" tanpa nama di depannya diabaikan
    expect(attrsOf('<a ="6" x="7"/>')).toEqual({ x: '7' });
  });

  it('decodeEntities tidak berubah', () => {
    expect(decodeEntities('plain')).toBe('plain');
    expect(decodeEntities('&amp;&lt;&gt;&quot;&apos;&#169;&#xA9;')).toBe(`&<>"'©©`);
    expect(decodeEntities('&unknown; &#99999999;')).toBe('&unknown; &#99999999;');
  });

  it('tag yang tak ditutup tetap ditolak', () => {
    expect(() => parseXml('<a x="1')).toThrow(XmlParseError);
  });
});

describe('parseXml atribut: masukan bermusuhan berukuran besar (L39-5)', () => {
  const LIMIT_MS = 100;

  function time(fn: () => void): number {
    const t0 = performance.now();
    fn();
    return performance.now() - t0;
  }

  it('80.000 karakter nama atribut tanpa "=" (bentuk yang diukur peninjau) selesai < 100 ms', () => {
    const xml = '<a ' + 'x'.repeat(80_000) + '/>';
    let attrs: Record<string, string> = { sentinel: '1' };
    const ms = time(() => {
      attrs = { ...parseXml(xml).attrs };
    });
    expect(attrs).toEqual({});
    expect(ms).toBeLessThan(LIMIT_MS);
  });

  it('160.000 karakter nama atribut tanpa "=" selesai < 100 ms', () => {
    const xml = '<a ' + 'x'.repeat(160_000) + '>t</a>';
    expect(time(() => parseXml(xml))).toBeLessThan(LIMIT_MS);
  });

  it('nama panjang diikuti "=" tetapi tanpa tanda kutip selesai < 100 ms', () => {
    const xml = '<a ' + 'x'.repeat(80_000) + '=y/>';
    expect(time(() => parseXml(xml))).toBeLessThan(LIMIT_MS);
  });

  it('nama panjang diikuti banyak spasi lalu tanpa "=" selesai < 100 ms', () => {
    const xml = '<a ' + 'x'.repeat(40_000) + ' '.repeat(40_000) + 'z/>';
    expect(time(() => parseXml(xml))).toBeLessThan(LIMIT_MS);
  });

  it('teks mirip atribut berulang tanpa kutip penutup (tag tak ditutup) ditolak cepat', () => {
    const xml = '<a ' + 'k=v '.repeat(20_000) + 'z="';
    let err: unknown;
    const ms = time(() => {
      try {
        parseXml(xml);
      } catch (e) {
        err = e;
      }
    });
    expect(err).toBeInstanceOf(XmlParseError);
    expect(ms).toBeLessThan(LIMIT_MS);
  });

  it('banyak atribut sah (80.000+ karakter) tetap terbaca lengkap dan cepat', () => {
    const n = 8_000;
    let src = '<a';
    for (let k = 0; k < n; k++) src += ` n${k}="v${k}"`;
    src += '/>';
    expect(src.length).toBeGreaterThan(80_000);
    let attrs: Record<string, string> = {};
    const ms = time(() => {
      attrs = { ...parseXml(src).attrs };
    });
    expect(Object.keys(attrs)).toHaveLength(n);
    expect(attrs.n0).toBe('v0');
    expect(attrs[`n${n - 1}`]).toBe(`v${n - 1}`);
    expect(ms).toBeLessThan(LIMIT_MS);
  });
});
