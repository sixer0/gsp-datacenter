// SR-49 diagnostik: stream PDF (didekompresi) yang hanya ada di salah satu dari dua berkas.
import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
function streams(b) {
  const s = b.toString('latin1'); const out = new Map(); let pos = 0;
  for (;;) {
    const m = /stream\r?\n/g; m.lastIndex = pos; const r = m.exec(s); if (!r) break;
    const start = r.index + r[0].length; const end = s.indexOf('endstream', start); if (end < 0) break;
    const raw = Buffer.from(s.slice(start, end), 'latin1'); let dec;
    try { dec = zlib.inflateSync(raw); } catch { try { dec = zlib.inflateSync(raw.subarray(0, raw.length - 1)); } catch { dec = raw; } }
    const t = dec.toString('latin1'); out.set(crypto.createHash('sha256').update(t).digest('hex'), t); pos = end + 9;
  }
  return out;
}
const [fa, fb] = process.argv.slice(2);
const A = streams(fs.readFileSync(fa)), B = streams(fs.readFileSync(fb));
for (const [h, t] of A) if (!B.has(h)) console.log('A-only', t.length, JSON.stringify(t.slice(0, 260)));
for (const [h, t] of B) if (!A.has(h)) console.log('B-only', t.length, JSON.stringify(t.slice(0, 260)));
const fd = (x) => [...x.matchAll(/\/FontName\s*\/([A-Za-z0-9+#_-]+)/g)].map((m) => m[1]);
console.log('A fonts', fd(fs.readFileSync(fa).toString('latin1')).join(' '));
console.log('B fonts', fd(fs.readFileSync(fb).toString('latin1')).join(' '));
