/*
 * Satu pembangun URL berkas Studio (FIX-4a; UX-01 §3d; menutup S86 R06 + SEC-3).
 *
 * - `fileUrl(file, "inline")`  -> `/api/studio/files/<id>?inline=1`   (Buka = pratinjau)
 * - `fileUrl(file, "download")` -> `/api/studio/files/<id>?download=1` (Unduh = attachment)
 *
 * URL dari server (`OutputFileDto.url`) hanya dipakai bila jalurnya sama-asal
 * dan berawalan `/api/studio/files/` (tanpa skema, tanpa `//`, tanpa `..`,
 * tanpa backslash/karakter kontrol). Bila tidak lolos, URL dibangun dari `id`.
 * Bila `id` juga tidak sah, hasilnya `null` — pemanggil tidak merender tautan.
 * Query bawaan server dibuang; hanya `inline=1` atau `download=1` yang dipasang.
 *
 * Word (DOCX) tidak dapat dipratinjau di peramban: `canOpenInline("DOCX") === false`
 * (W9: "Word: hanya Unduh").
 */

export const STUDIO_FILES_PREFIX = "/api/studio/files/";

export type FileUrlMode = "inline" | "download";

/** Bentuk minimum yang dibutuhkan (kompatibel dengan `OutputFileDto`). */
export interface StudioFileRef {
  id: string;
  url?: string | null;
}

/** Id berkas aman (cuid/uuid/slug): huruf, angka, `_`, `-`; 1-128 karakter. */
const FILE_ID = /^[A-Za-z0-9_-]{1,128}$/;
const UNSAFE_CHARS = /[\u0000-\u001f\u007f\\]/;

/** `true` bila `u` adalah jalur berkas Studio sama-asal yang aman (SEC-3). */
export function isStudioFileUrl(u: unknown): u is string {
  if (typeof u !== "string" || u.length === 0 || u.length > 2048) return false;
  if (UNSAFE_CHARS.test(u)) return false;
  if (!u.startsWith(STUDIO_FILES_PREFIX)) return false; // menolak skema, `//host`, jalur relatif
  const path = u.split(/[?#]/, 1)[0];
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return false;
  }
  if (decoded.includes("..") || UNSAFE_CHARS.test(decoded) || decoded.includes("//")) return false;
  const rest = decoded.slice(STUDIO_FILES_PREFIX.length);
  // Tepat satu segmen id setelah awalan.
  return FILE_ID.test(rest);
}

function modeQuery(mode: FileUrlMode): string {
  return mode === "inline" ? "inline=1" : "download=1";
}

/**
 * URL berkas untuk Buka (`inline`) atau Unduh (`download`); `null` bila tidak
 * ada URL aman yang dapat dibangun.
 */
export function fileUrl(file: StudioFileRef, mode: FileUrlMode): string | null {
  if (file.url && isStudioFileUrl(file.url)) {
    return `${file.url.split(/[?#]/, 1)[0]}?${modeQuery(mode)}`;
  }
  if (typeof file.id === "string" && FILE_ID.test(file.id)) {
    return `${STUDIO_FILES_PREFIX}${encodeURIComponent(file.id)}?${modeQuery(mode)}`;
  }
  return null;
}

/** Format yang dapat dipratinjau di dalam Studio (W9). Word hanya Unduh. */
const INLINE_FORMATS = new Set(["PDF", "HTML", "SVG", "PNG", "JPG", "JPEG"]);

export function canOpenInline(format: string | null | undefined): boolean {
  return !!format && INLINE_FORMATS.has(format.toUpperCase());
}
