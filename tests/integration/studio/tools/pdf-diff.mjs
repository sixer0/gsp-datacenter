// SR-49 diagnostik: bandingkan dua PDF keluaran PRIMARY revisi yang sama (DB uji), tampilkan
// potongan pertama yang berbeda (tanpa rahasia). Pakai: uji-run.mjs -- node tools/pdf-diff.mjs
import os from 'node:os';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import pg from 'pg';
const root = process.env.STUDIO_WORKSPACE_ROOT ?? path.join(os.tmpdir(), 'gsp-studio-sr49-uji');
const c = new pg.Client({ connectionString: process.env.DATABASE_URL.split('?')[0] });
await c.connect();
if ((await c.query('select current_database() db')).rows[0].db !== 'gsp_agent_hq_v21_uji') throw new Error('bukan DB uji');
const r = await c.query(`select o."revisionId", o."relPath", o.sha256 from "StudioOutputFile" o where o.format='PDF' and o.role='PRIMARY' and o.draft=false order by o."createdAt"`);
await c.end();
const byRev = new Map();
for (const x of r.rows) byRev.set(x.revisionId, [...(byRev.get(x.revisionId) ?? []), x]);
for (const [rev, list] of byRev) {
  if (list.length < 2) continue;
  const [a, b] = list;
  const A = readFileSync(path.join(root, a.relPath)).toString('latin1');
  const B = readFileSync(path.join(root, b.relPath)).toString('latin1');
  console.log(`rev ${rev}: ${a.sha256.slice(0, 10)} vs ${b.sha256.slice(0, 10)} len ${A.length}/${B.length}`);
  let shown = 0;
  let i = 0;
  while (i < Math.min(A.length, B.length) && shown < 6) {
    if (A[i] !== B[i]) {
      const s = Math.max(0, i - 60);
      console.log(`  @${i}\n   A: ${JSON.stringify(A.slice(s, i + 80))}\n   B: ${JSON.stringify(B.slice(s, i + 80))}`);
      shown++;
      i += 200;
    } else i++;
  }
}
