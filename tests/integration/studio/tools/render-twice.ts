// SR-49 diagnostik (DB uji saja): render satu revisi DOCX dua kali lalu bandingkan isi per bagian zip.
// Pakai: node tests/integration/studio/uji-run.mjs -- npx tsx tests/integration/studio/tools/render-twice.ts <docNumber> <revNo>
import os from 'node:os';
import path from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';
import { prisma } from '../../../../src/lib/prisma';
import { renderRevision } from '../../../../src/lib/studio/services/render';

const ADMIN = { kind: 'ADMIN_SESSION', requester: 'sr49-admin', canWriteClassK: true } as never;
const root = process.env.STUDIO_WORKSPACE_ROOT ?? path.join(os.tmpdir(), 'gsp-studio-sr49-uji');

let n = 0;
async function once(revId: string): Promise<Record<string, string>> {
  const r = await renderRevision(revId, ['DOCX'], ADMIN);
  const o = r.outputs.find((x) => x.format === 'DOCX' && x.role === 'PRIMARY')!;
  const files = unzipSync(readFileSync(path.join(root, ...o.relPath.split('/'))));
  const out: Record<string, string> = { __sha: o.sha256 };
  n++;
  const dir = path.join(__dirname, '..', 'out', 'diag');
  mkdirSync(dir, { recursive: true });
  for (const [k, v] of Object.entries(files)) {
    out[k] = strFromU8(v, true);
    if (k.endsWith('.png')) writeFileSync(path.join(dir, `run${n}-${path.basename(k)}`), v);
  }
  return out;
}

async function main() {
  const db = (await prisma.$queryRawUnsafe<{ db: string }[]>('select current_database() as db'))[0].db;
  if (db !== 'gsp_agent_hq_v21_uji') throw new Error('bukan DB uji');
  const [docNumber, revNo] = process.argv.slice(2);
  const doc = await prisma.studioDocument.findUniqueOrThrow({ where: { docNumber } });
  const rev = await prisma.studioRevision.findUniqueOrThrow({ where: { documentId_revisionNo: { documentId: doc.id, revisionNo: Number(revNo) } } });
  const a = await once(rev.id);
  const b = await once(rev.id);
  const c = await once(rev.id);
  console.log(`third ${c.__sha.slice(0, 12)} equalsSecond=${c.__sha === b.__sha}`);
  console.log(`sha ${a.__sha.slice(0, 12)} vs ${b.__sha.slice(0, 12)} equal=${a.__sha === b.__sha}`);
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (k === '__sha' || a[k] === b[k]) continue;
    const x = a[k] ?? '';
    const y = b[k] ?? '';
    let i = 0;
    while (i < Math.min(x.length, y.length) && x[i] === y[i]) i++;
    console.log(`part ${k} differs @${i}\n  A: ${JSON.stringify(x.slice(Math.max(0, i - 80), i + 80))}\n  B: ${JSON.stringify(y.slice(Math.max(0, i - 80), i + 80))}`);
  }
  await prisma.$disconnect();
  process.exit(0);
}
main();
