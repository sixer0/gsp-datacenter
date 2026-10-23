/**
 * Akses Prisma malas untuk services/render (D-155, permintaan IP-43a).
 *
 * `@/lib/prisma` membuat `PrismaClient` saat modul dievaluasi, dan
 * `@prisma/client` memuat `.env` repo ke `process.env` saat diimpor (tanpa
 * koneksi). Modul render yang juga dipakai orkestrator murni (`pure/`, CLI
 * render SR-33, runner benchmark) karenanya tidak mengimpornya secara statis:
 * klien baru dimuat pada panggilan DB pertama. Impor tipe (`import type`)
 * tetap boleh karena terhapus saat kompilasi.
 */
import type { PrismaClient } from "@prisma/client";

let cached: Promise<PrismaClient> | null = null;

/** Klien Prisma proses (singleton `@/lib/prisma`), dimuat saat pertama dipakai. */
export function db(): Promise<PrismaClient> {
  cached ??= import("@/lib/prisma").then((m) => m.prisma);
  return cached;
}
