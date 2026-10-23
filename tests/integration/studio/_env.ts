// SR-49: lingkungan uji integrasi DB Studio. Diimpor PERTAMA (sebelum modul Studio/Prisma).
//
// Suite ini HANYA aktif bila dijalankan lewat `node tests/integration/studio/uji-run.mjs -- npx vitest ...`
// (pembungkus menyetel DATABASE_URL ke `gsp_agent_hq_v21_uji` di lingkungan proses, tanpa
// mengubah `.env`, dan STUDIO_IT_DB). Tanpa itu suite di-SKIP: `npx vitest run` biasa tidak
// pernah menyentuh DB apa pun (Prisma akan membaca `.env` = v21, jadi modul Prisma tidak
// dimuat sama sekali saat skip; impor dinamis di dalam beforeAll).
import os from 'node:os';
import path from 'node:path';

export const UJI_DB = 'gsp_agent_hq_v21_uji';
export const UJI_WORKSPACE = process.env.STUDIO_WORKSPACE_ROOT ?? path.join(os.tmpdir(), 'gsp-studio-sr49-uji');

/** true hanya bila DATABASE_URL proses menunjuk DB uji dan pembungkus uji-run aktif. */
export function ujiActive(): boolean {
  const u = process.env.DATABASE_URL;
  if (!u || process.env.STUDIO_IT_DB !== UJI_DB) return false;
  try {
    return decodeURIComponent(new URL(u).pathname) === `/${UJI_DB}`;
  } catch {
    return false;
  }
}

// Rahasia uji in-process (bukan nilai `.env`; tidak pernah dicetak). Header internal hanya
// dipakai untuk route agen (INTERNAL_AGENT); operasi ADMIN memanggil layanan dengan objek
// pemanggil ADMIN langsung (tanpa cookie sesi).
export const IT_INTERNAL_SECRET = 'sr49-internal-test-secret';
process.env.INTERNAL_API_SECRET = IT_INTERNAL_SECRET;
process.env.NEXTAUTH_SECRET = 'sr49-nextauth-test-secret';
process.env.NEXTAUTH_URL = 'https://127.0.0.1:9021';
delete process.env.VERCEL;
delete process.env.AUTH_SECRET;
process.env.STUDIO_WORKSPACE_ROOT = UJI_WORKSPACE;
process.env.SHARED_WORKSPACE = path.join(os.tmpdir(), 'gsp-studio-sr49-shared');
