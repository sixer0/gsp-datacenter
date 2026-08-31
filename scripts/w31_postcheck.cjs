// W3.1 post-check: UNIQUE index terlihat + jumlah baris WebUiUser tidak berubah (B4).
const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  const idx = await p.$queryRawUnsafe(
    "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'WebUiUser'"
  );
  for (const r of idx) console.log(`${r.indexname} :: ${r.indexdef}`);
  const uniq = idx.filter((r) => /UNIQUE/.test(r.indexdef) && /hermesProfile/.test(r.indexdef));
  console.log('UNIQUE hermesProfile index =', uniq.length === 1 ? 'ADA' : 'TIDAK ADA (' + uniq.length + ')');
  const count = await p.webUiUser.count();
  console.log('count WebUiUser =', count, count === 6 ? '(tetap 6 — sesuai)' : '(BERUBAH!)');
  // uji penegakan: duplikat harus ditolak DB
  try {
    await p.webUiUser.create({ data: { username: '__w31_dup_probe__', passwordHash: 'x', hermesProfile: 'user01' } });
    console.log('PROBE GAGAL: duplikat diterima DB!');
    await p.webUiUser.delete({ where: { username: '__w31_dup_probe__' } });
  } catch (e) {
    console.log('probe duplikat → ditolak DB:', e.code === 'P2002' ? 'P2002 (unique violation) OK' : e.code);
  }
  await p.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
