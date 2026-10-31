/**
 * Resolusi alias `@/*` -> `<repo>/src/*` untuk CLI `scripts/studio/*` (U-05c, D-419).
 *
 * `tsx` membaca `paths` dari tsconfig di cwd, sehingga `npx tsx <repo>/scripts/studio/draft-check.ts`
 * yang dijalankan dari luar repo gagal `MODULE_NOT_FOUND '@/lib/...'` pada modul transitif. Modul ini
 * diimpor PERTAMA oleh CLI (urutan `require` CJS dipertahankan tsx) dan membungkus
 * `Module._resolveFilename` agar `@/x` dipetakan ke path absolut `<repo>/src/x` sebelum resolver tsx
 * (ekstensi `.ts`, berkas index) bekerja. Tanpa efek di bawah vitest/ESM (alias diurus vite).
 */
import Module from "node:module";
import path from "node:path";

/** Akar repo (dua tingkat di atas `scripts/studio`). */
export const REPO_ROOT = path.resolve(typeof __dirname === "string" ? __dirname : process.cwd(), "..", "..");

type ResolveFilename = (request: string, parent: unknown, isMain: boolean, options?: unknown) => string;
const PATCHED = Symbol.for("gsp.studio.cli.repoAlias");

const mod = Module as unknown as { _resolveFilename?: ResolveFilename } & Record<symbol, boolean>;
if (typeof require !== "undefined" && typeof mod._resolveFilename === "function" && !mod[PATCHED]) {
  const original = mod._resolveFilename;
  const src = path.join(REPO_ROOT, "src");
  mod._resolveFilename = function resolveWithRepoAlias(this: unknown, request: string, parent: unknown, isMain: boolean, options?: unknown): string {
    const mapped = request.startsWith("@/") ? path.join(src, request.slice(2)) : request;
    return original.call(this, mapped, parent, isMain, options);
  };
  mod[PATCHED] = true;
}
