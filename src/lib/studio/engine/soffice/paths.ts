/**
 * Pemilihan direktori kerja soffice yang aman terhadap batas path Windows
 * (IP-33, temuan INT-A 2).
 *
 * LibreOffice 24.2 di Windows tidak memakai path panjang (`\\?\`): profil
 * `-env:UserInstallation` atau berkas masuk/keluar yang melewati MAX_PATH
 * (260 karakter) membuat soffice menggantung sampai `RENDER_TIMEOUT`. Node
 * sendiri menulis path panjang tanpa masalah, jadi kegagalannya baru terlihat
 * setelah batas waktu. Modul ini memeriksa panjang SEBELUM soffice dijalankan:
 *  1. direktori job di bawah `<STUDIO_WORKSPACE_ROOT>/tmp/<nama>` bila semua
 *     path berada di bawah ambang;
 *  2. selain itu direktori sementara pendek `os.tmpdir()/gso-XXXXXX`
 *     (`mkdtemp`, nama berkas pendek) — hasilnya dibaca kembali sebagai byte
 *     oleh pemanggil, jadi tidak ada path panjang yang diserahkan ke soffice;
 *  3. bila direktori pendek pun melewati ambang -> `PathTooLongError`
 *     (pemanggil memetakannya ke kode kontrak, gagal cepat).
 */
import { mkdir, mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/** MAX_PATH Win32 (termasuk NUL penutup). */
export const WIN_MAX_PATH = 260;
/**
 * Ambang konservatif direktori profil: profil LibreOffice membuat subpath
 * sampai ~95 karakter di bawahnya (mis. `user/extensions/bundled/registry/
 * com.sun.star.comp.deployment.bundle.PackageRegistryBackend/backenddb.xml`),
 * jadi 160 + 95 < 260.
 */
export const PROFILE_DIR_MAX_CHARS = 160;
/** Ambang path berkas DOCX masuk / PDF keluar (dengan margin dari 260). */
export const IO_FILE_MAX_CHARS = 240;
/** Prefiks direktori sementara pendek (`mkdtemp` menambah 6 karakter acak). */
export const SHORT_DIR_PREFIX = "gso-";

export class PathTooLongError extends Error {
  readonly lengths: Readonly<Record<string, number>>;
  constructor(message: string, lengths: Record<string, number>) {
    super(message);
    this.name = "PathTooLongError";
    this.lengths = lengths;
  }
}

export interface SofficeWorkLayout {
  /** Direktori akar job (dihapus utuh oleh pemanggil di `finally`). */
  dir: string;
  profileDir: string;
  inDir: string;
  outDir: string;
  inFile: string;
  outFile: string;
  /** true bila direktori sementara pendek dipakai karena path workspace terlalu panjang. */
  short: boolean;
}

function layoutAt(dir: string, base: string, short: boolean): SofficeWorkLayout {
  const inDir = path.join(dir, "in");
  const outDir = path.join(dir, "out");
  return {
    dir,
    profileDir: path.join(dir, "lo-profile"),
    inDir,
    outDir,
    inFile: path.join(inDir, `${base}.docx`),
    outFile: path.join(outDir, `${base}.pdf`),
    short,
  };
}

/** Panjang path yang diserahkan ke soffice. */
export function layoutLengths(l: SofficeWorkLayout): { profileDir: number; inFile: number; outFile: number } {
  return { profileDir: l.profileDir.length, inFile: l.inFile.length, outFile: l.outFile.length };
}

/** Layout aman bila profil <= `PROFILE_DIR_MAX_CHARS` dan berkas I/O <= `IO_FILE_MAX_CHARS`. */
export function layoutFits(l: SofficeWorkLayout): boolean {
  const n = layoutLengths(l);
  return n.profileDir <= PROFILE_DIR_MAX_CHARS && n.inFile <= IO_FILE_MAX_CHARS && n.outFile <= IO_FILE_MAX_CHARS;
}

/** Layout di direktori job workspace (tanpa membuat apa pun). */
export function workspaceLayout(jobDir: string, base: string): SofficeWorkLayout {
  return layoutAt(jobDir, base, false);
}

/**
 * Siapkan direktori kerja: workspace bila muat, selain itu direktori sementara
 * pendek (nama berkas `d.docx`/`d.pdf`). Membuat direktori `in`/`out`/`lo-profile`.
 * Melempar `PathTooLongError` sebelum soffice dijalankan bila tidak ada yang muat.
 */
export async function prepareSofficeWorkDir(jobDir: string, base: string, opts: { tmpRoot?: string } = {}): Promise<SofficeWorkLayout> {
  const ws = workspaceLayout(jobDir, base);
  let l: SofficeWorkLayout;
  if (layoutFits(ws)) {
    l = ws;
  } else {
    const tmpRoot = path.resolve(opts.tmpRoot ?? os.tmpdir());
    // Cek sebelum membuat apa pun: `gso-XXXXXX` = prefiks + 6 karakter.
    const probe = layoutAt(path.join(tmpRoot, `${SHORT_DIR_PREFIX}XXXXXX`), "d", true);
    if (!layoutFits(probe)) {
      throw new PathTooLongError(
        `soffice work paths exceed the Windows-safe limit (profile <= ${PROFILE_DIR_MAX_CHARS}, files <= ${IO_FILE_MAX_CHARS} chars) ` +
          `for both STUDIO_WORKSPACE_ROOT and the system temp directory; shorten STUDIO_WORKSPACE_ROOT or TEMP`,
        { workspaceProfileDir: ws.profileDir.length, workspaceOutFile: ws.outFile.length, tempProfileDir: probe.profileDir.length },
      );
    }
    await mkdir(tmpRoot, { recursive: true });
    l = layoutAt(await mkdtemp(path.join(tmpRoot, SHORT_DIR_PREFIX)), "d", true);
    if (!layoutFits(l)) {
      throw new PathTooLongError("soffice short temp directory still exceeds the Windows-safe path limit", layoutLengths(l));
    }
  }
  await mkdir(l.inDir, { recursive: true });
  await mkdir(l.outDir, { recursive: true });
  await mkdir(l.profileDir, { recursive: true });
  return l;
}

/**
 * Direktori profil sementara untuk `--version` (kesiapan): `<root>/tmp/<nama>`
 * bila profil muat, selain itu `os.tmpdir()/gso-XXXXXX`. Mengembalikan direktori
 * akar yang harus dihapus pemanggil.
 */
export async function prepareProbeProfileDir(
  preferredDir: string,
  opts: { tmpRoot?: string } = {},
): Promise<{ dir: string; profileDir: string; short: boolean }> {
  const preferredProfile = path.join(preferredDir, "lo-profile");
  if (preferredProfile.length <= PROFILE_DIR_MAX_CHARS) {
    await mkdir(preferredProfile, { recursive: true });
    return { dir: preferredDir, profileDir: preferredProfile, short: false };
  }
  const tmpRoot = path.resolve(opts.tmpRoot ?? os.tmpdir());
  if (path.join(tmpRoot, `${SHORT_DIR_PREFIX}XXXXXX`, "lo-profile").length > PROFILE_DIR_MAX_CHARS) {
    throw new PathTooLongError("soffice probe profile path exceeds the Windows-safe limit for both workspace and system temp", {
      workspaceProfileDir: preferredProfile.length,
    });
  }
  await mkdir(tmpRoot, { recursive: true });
  const dir = await mkdtemp(path.join(tmpRoot, SHORT_DIR_PREFIX));
  const profileDir = path.join(dir, "lo-profile");
  await mkdir(profileDir, { recursive: true });
  return { dir, profileDir, short: true };
}
