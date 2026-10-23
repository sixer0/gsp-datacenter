// SR-45: lingkungan uji API struktur. Diimpor PERTAMA di setiap berkas uji, sebelum
// modul Studio dievaluasi (getStudioEnv di-cache). Secret uji (bukan .env), workspace
// di temp OS (berkas aset/render tidak pernah ke repo), batas laju render dinaikkan agar
// rangkaian kiriman tidak terkena 429 (uji 429 memakai berkas tersendiri).
// DB: Prisma membaca DATABASE_URL dari .env repo (gsp_agent_hq_v21); setiap berkas
// memverifikasi `current_database()` sebelum menulis (lihat _db.ts).
import os from 'node:os';
import path from 'node:path';

export const TEST_NEXTAUTH_SECRET = 'sr45-unit-nextauth-secret';
export const TEST_INTERNAL_SECRET = 'sr45-unit-internal-secret';
export const RUN_ID = `${process.pid}${Date.now().toString(36)}`;
export const TEST_WORKSPACE = path.join(os.tmpdir(), `gsp-studio-sr45-${RUN_ID}`);

export function applySr45Env(opts: { renderRateLimit?: number } = {}): void {
  process.env.NEXTAUTH_SECRET = TEST_NEXTAUTH_SECRET;
  process.env.INTERNAL_API_SECRET = TEST_INTERNAL_SECRET;
  process.env.STUDIO_WORKSPACE_ROOT = TEST_WORKSPACE;
  process.env.SHARED_WORKSPACE = path.join(os.tmpdir(), `gsp-studio-sr45-shared-${RUN_ID}`);
  process.env.NEXTAUTH_URL = 'https://127.0.0.1:9021';
  process.env.STUDIO_RENDER_RATE_LIMIT = String(opts.renderRateLimit ?? 10000);
  delete process.env.VERCEL;
  delete process.env.AUTH_SECRET;
}

applySr45Env();
