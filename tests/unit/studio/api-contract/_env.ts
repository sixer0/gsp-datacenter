// DC-36: lingkungan uji API + DB fase document contract. Diimpor PERTAMA di setiap berkas
// (sebelum modul Studio dievaluasi; `getStudioEnv()` di-cache). Secret UJI (bukan .env),
// workspace + workspace bersama di temp OS (berkas keluaran / log baca tidak pernah ke repo),
// batas laju dinaikkan agar rangkaian kiriman tidak terkena 429 (uji 429 menurunkan batas
// lewat env + fungsi reset limiter). DB: Prisma membaca DATABASE_URL dari .env repo; setiap
// berkas DB memverifikasi `current_database()` = gsp_agent_hq_v21 dan bekerja di dalam SATU
// transaksi yang selalu di-ROLLBACK (`_rb.ts`). URL DB tidak pernah dicetak.
import os from 'node:os';
import path from 'node:path';

export const TEST_NEXTAUTH_SECRET = 'dc36-unit-nextauth-secret';
export const TEST_INTERNAL_SECRET = 'dc36-unit-internal-secret';
/** Penanda per run (proses + waktu): huruf kecil + angka, aman untuk folder misi / slug. */
export const RUN_ID = `${process.pid}${Date.now().toString(36)}`;
export const TEST_WORKSPACE = path.join(os.tmpdir(), `gsp-studio-dc36-${RUN_ID}`);

export const HIGH_LIMIT = '100000';

export function applyDc36Env(): void {
  process.env.NEXTAUTH_SECRET = TEST_NEXTAUTH_SECRET;
  process.env.INTERNAL_API_SECRET = TEST_INTERNAL_SECRET;
  process.env.STUDIO_WORKSPACE_ROOT = TEST_WORKSPACE;
  process.env.SHARED_WORKSPACE = path.join(os.tmpdir(), `gsp-studio-dc36-shared-${RUN_ID}`);
  process.env.NEXTAUTH_URL = 'https://127.0.0.1:9021';
  process.env.STUDIO_RENDER_RATE_LIMIT = HIGH_LIMIT;
  process.env.STUDIO_VALIDATE_RATE_LIMIT = HIGH_LIMIT;
  process.env.STUDIO_IMPORT_RATE_LIMIT = HIGH_LIMIT;
  process.env.STUDIO_QUERY_RATE_LIMIT = HIGH_LIMIT;
  delete process.env.STUDIO_QUOTA_AGENT_CEILING_FACTOR;
  delete process.env.VERCEL;
  delete process.env.AUTH_SECRET;
}

applyDc36Env();
