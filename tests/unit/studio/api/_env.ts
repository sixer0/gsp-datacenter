// S74: lingkungan uji Studio. Diimpor PERTAMA di setiap berkas uji (sebelum
// modul Studio dievaluasi) agar `getStudioEnv()` (di-cache) membaca akar
// workspace sementara: log JSONL layanan/route tertulis ke direktori temp OS,
// tidak pernah ke `data/studio-workspace` repo maupun SHARED_WORKSPACE.
import os from 'node:os';
import path from 'node:path';

export const TEST_NEXTAUTH_SECRET = 'unit-test-secret';
export const TEST_INTERNAL_SECRET = 'unit-internal-secret';
export const TEST_WORKSPACE = path.join(os.tmpdir(), `gsp-studio-s74-${process.pid}`);
export const TEST_SHARED_WORKSPACE = path.join(os.tmpdir(), `gsp-studio-s74-shared-${process.pid}`);

export function applyStudioTestEnv(): void {
  process.env.NEXTAUTH_SECRET = TEST_NEXTAUTH_SECRET;
  process.env.INTERNAL_API_SECRET = TEST_INTERNAL_SECRET;
  process.env.STUDIO_WORKSPACE_ROOT = TEST_WORKSPACE;
  // Seperti produksi HQ (https): getToken NextAuth memakai cookie `__Secure-next-auth.session-token`.
  // Nilai di-set SEBELUM Next memuat `.env` repo (@next/env tidak menimpa variabel yang sudah ada).
  process.env.NEXTAUTH_URL = 'https://127.0.0.1:9011';
  delete process.env.VERCEL;
  delete process.env.AUTH_SECRET;
  // Workspace bersama tiruan di temp OS: uji tidak pernah membaca SHARED_WORKSPACE nyata dari `.env`.
  process.env.SHARED_WORKSPACE = TEST_SHARED_WORKSPACE;
}

applyStudioTestEnv();
