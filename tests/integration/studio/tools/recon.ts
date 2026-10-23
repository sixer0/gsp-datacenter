// SR-49 diagnostik (DB uji saja): ringkasan verifyReconstruction untuk revisi yang tidak cocok.
// Pakai: node tests/integration/studio/uji-run.mjs -- npx tsx tests/integration/studio/tools/recon.ts
import { prisma } from '../../../../src/lib/prisma';
import '../../../../src/lib/studio/services/compose/register';
import { verifyReconstruction } from '../../../../src/lib/studio/services/structure';

async function main() {
  const db = (await prisma.$queryRawUnsafe<{ db: string }[]>('select current_database() as db'))[0].db;
  // --allow-v21: baca-saja di v21 (verifyReconstruction hanya SELECT) untuk pembanding sejarah.
  const allowed = process.argv.includes('--allow-v21') ? ['gsp_agent_hq_v21_uji', 'gsp_agent_hq_v21'] : ['gsp_agent_hq_v21_uji'];
  if (!allowed.includes(db)) throw new Error(`DB ditolak: ${db}`);
  console.log(`database = ${db}`);
  await prisma.$executeRawUnsafe('set default_transaction_read_only = on');
  const revs = await prisma.studioRevision.findMany({ select: { id: true, revisionNo: true, changeScope: true, document: { select: { docNumber: true } } }, orderBy: [{ documentId: 'asc' }, { revisionNo: 'asc' }] });
  for (const r of revs) {
    try {
      const x = await verifyReconstruction(r.id);
      const tag = x.matches ? 'OK ' : 'BAD';
      console.log(`${tag} ${r.document.docNumber} r${r.revisionNo} ${r.changeScope ?? ''} ${x.snapshot.schema} exp ${x.expectedSha256.slice(0, 10)} act ${x.actualSha256.slice(0, 10)} recomposed ${x.recomposed} blockMismatches ${x.blockMismatches.length}`);
      if (!x.matches) {
        console.log('   mismatches:', JSON.stringify(x.blockMismatches.slice(0, 6)));
        if (x.legacyV1) console.log('   legacy:', JSON.stringify(x.legacyV1).slice(0, 600));
        {
          const st = ((await prisma.studioRevision.findUniqueOrThrow({ where: { id: r.id }, select: { snapshot: true } })).snapshot as { source?: Record<string, unknown> }).source ?? {};
          const rb = (x.source ?? {}) as unknown as Record<string, unknown>;
          const keys = [...new Set([...Object.keys(st), ...Object.keys(rb)])].sort();
          console.log('   source keys stored :', Object.keys(st).sort().join(','));
          console.log('   source keys rebuilt:', Object.keys(rb).sort().join(','));
          console.log('   source keys differ :', keys.filter((k) => JSON.stringify(st[k]) !== JSON.stringify(rb[k])).join(','));
          const stab = (v: unknown): string => (v === null || typeof v !== 'object' ? JSON.stringify(v ?? null) : Array.isArray(v) ? `[${v.map(stab).join(',')}]` : `{${Object.keys(v as object).sort().filter((k) => (v as Record<string, unknown>)[k] !== undefined).map((k) => `${JSON.stringify(k)}:${stab((v as Record<string, unknown>)[k])}`).join(',')}}`);
          const ss = (st.sections ?? {}) as Record<string, unknown>;
          const rs = (rb.sections ?? {}) as Record<string, unknown>;
          for (const k of [...new Set([...Object.keys(ss), ...Object.keys(rs)])]) {
            const a = stab(ss[k]);
            const b = stab(rs[k]);
            if (a === b) continue;
            let i = 0;
            while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
            console.log(`   slot ${k} differs @${i}/${a.length}|${b.length}
     stored : ${a.slice(Math.max(0, i - 150), i + 150)}
     rebuilt: ${b.slice(Math.max(0, i - 150), i + 150)}`);
          }
          console.log('   stored.template=', JSON.stringify(st.template ?? null), ' rebuilt.template=', JSON.stringify(rb.template ?? null), ' stored.x keys=', Object.keys((st.x as object) ?? {}).join('|'), ' rebuilt.x keys=', Object.keys((rb.x as object) ?? {}).join('|'));
        }
        if (process.argv.includes('--diff')) {
          const stored = (await prisma.studioRevision.findUniqueOrThrow({ where: { id: r.id }, select: { snapshot: true } })).snapshot as Record<string, unknown>;
          const rebuilt = x.snapshot as unknown as Record<string, unknown>;
          for (const k of new Set([...Object.keys(stored), ...Object.keys(rebuilt)])) {
            const st2 = (v: unknown): string => (v === null || typeof v !== 'object' ? JSON.stringify(v ?? null) : Array.isArray(v) ? `[${v.map(st2).join(',')}]` : `{${Object.keys(v as object).sort().filter((q) => (v as Record<string, unknown>)[q] !== undefined).map((q) => `${JSON.stringify(q)}:${st2((v as Record<string, unknown>)[q])}`).join(',')}}`);
            const a = st2(stored[k]);
            const b = st2(rebuilt[k]);
            if (a !== b) {
              let i = 0;
              while (i < Math.min(a?.length ?? 0, b?.length ?? 0) && a[i] === b[i]) i++;
              console.log(`   key ${k}: differs @${i}\n     stored : ${a?.slice(Math.max(0, i - 120), i + 200)}\n     rebuilt: ${b?.slice(Math.max(0, i - 120), i + 200)}`);
            }
          }
        }
      }
    } catch (e) {
      console.log(`ERR ${r.document.docNumber} r${r.revisionNo}: ${(e as Error).message.slice(0, 200)}`);
    }
  }
  await prisma.$disconnect();
}
main();
