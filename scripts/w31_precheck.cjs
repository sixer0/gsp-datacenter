// W3.1 pre-check: kondisi WebUiUser sebelum @@unique([hermesProfile]).
const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  const rows = await p.webUiUser.findMany({ select: { id: true, username: true, hermesProfile: true, role: true } });
  console.log('count =', rows.length);
  const seen = {}, dups = [];
  for (const r of rows) { if (seen[r.hermesProfile]) dups.push(r.hermesProfile); seen[r.hermesProfile] = 1; }
  console.log('duplikat hermesProfile =', dups.length ? dups.join(',') : '0');
  for (const r of rows) console.log(` - ${r.username} | ${r.hermesProfile} | ${r.role}`);
  await p.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
