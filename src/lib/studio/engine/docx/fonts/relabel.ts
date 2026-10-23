/**
 * Wajah berlabel keluarga persis (IP-20, D-74, F-001; diperluas INT-S, D-104,
 * F-049): adopsi teknik docx-embed S99. LibreOffice mencocokkan fon tertanam
 * menurut nama keluarga (nameID 1/16) + gaya, jadi wajah yang ditanam di slot
 * mana pun harus bernama persis seperti `w:rFonts`.
 *   - Slot bold/boldItalic keluarga Plex: wajah SemiBold yang DIBERI NAMA
 *     keluarga persis (gaya Bold, `usWeightClass` 700, nama PostScript
 *     `*-SemiBold` dipertahankan). Mengalahkan Bold per-user terpasang tanpa
 *     menyentuh HKCU; berkas SemiBold asli (keluarga "IBM Plex Serif SemiBold"
 *     dst.) tidak pernah cocok dengan permintaan tebal.
 *   - Slot regular/italic: hanya bila nama keluarga berkas kanonik berbeda dari
 *     yang diminta. Saat ini "IBM Plex Sans Cond" (berkas kanonik bernama
 *     "IBM Plex Sans Condensed"); tanpa wajah ini satu-satunya wajah bernama
 *     "IBM Plex Sans Cond" adalah SemiBold berlabel Bold, yang lalu dipakai LO
 *     untuk teks reguler (F-049). Serif/Mono/Sans/Inter/DejaVu: nama kanonik
 *     sudah cocok, berkas kanonik tetap dipakai.
 *
 * Berkas: salinan byte-identik set `same` S99
 * (`render-env/semibold-bundle/fonts/same/`, fontTools 4.63.0, sumber
 * datum-revl `assets/fonts` = fon tertanam BM.docx) di
 * `src/lib/studio/assets/fonts/renamed/`, agar runtime tidak bergantung pada
 * render-env. sha256 dikunci di sini (= `bundle_manifest.json` S99) dan
 * diverifikasi saat dimuat; selisih = BY_CONSTRUCTION_FAILED.
 *
 * Alias keluarga (FIX-6, F-059): profil kanonik meminta "IBM Plex Sans
 * Condensed" (P4T-02 `type.face.condensed`), sedangkan set S99 hanya memuat
 * "IBM Plex Sans Cond". Wajah SemiBold kanonik bernama "IBM Plex Sans
 * Condensed SemiBold" tidak pernah cocok dengan permintaan tebal, jadi slot
 * bold/boldItalic keluarga itu dulu dilewati. Wajah berlabel untuk nama alias
 * DIBANGUN saat runtime dari wajah S99 keluarga kembarannya dengan aturan
 * relabel yang sama (`rename.ts`), sha256 hasil dikunci di `RELABEL_ALIAS_FACES`
 * dan disimpan sekali di cache berkas (`relabelAliasCacheDir`).
 *
 * Lisensi: IBM Plex SIL OFL 1.1 (Reserved Font Name "Plex"); berkas ini
 * versi termodifikasi (label name/OS/2) yang tetap memakai nama Plex — dipakai
 * internal untuk penanaman DOCX; tinjau sebelum didistribusikan (temuan S99).
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { StudioEngineError } from "../../../contract/errors";
import { STUDIO_ASSETS_DIR, normalizeFamily, type FontSource } from "./catalog";
import { renameFontFamily } from "./rename";

/** Subfolder aset (kunci aset templat diawali nilai ini). */
export const RELABEL_ASSET_DIR = "fonts/renamed";

export type RelabelSlot = "regular" | "bold" | "italic" | "boldItalic";

export interface RelabelFace {
  /** Keluarga persis (`w:rFonts`), = nameID 1/16 berkas. */
  family: string;
  slot: RelabelSlot;
  /** Kunci aset relatif akar aset Studio. */
  key: string;
  /** sha256 berkas berlabel (terkunci). */
  sha256: string;
  /** Wajah sumber (berkas kanonik asli) dan sha256-nya, untuk jejak. */
  source: string;
  sourceSha256: string;
}

/** `usWeightClass` yang wajib dibawa wajah berlabel untuk slot itu (bold = 700, lainnya 400). */
export function relabelWeight(slot: RelabelSlot): number {
  return slot === "bold" || slot === "boldItalic" ? 700 : 400;
}

/** true untuk slot bergaya miring. */
export function relabelItalic(slot: RelabelSlot): boolean {
  return slot === "italic" || slot === "boldItalic";
}

/** Tabel terkunci (urut keluarga, slot). Sumber: bundle_manifest.json S99, set `same`. */
export const RELABEL_FACES: readonly RelabelFace[] = [
  {
    family: "IBM Plex Mono",
    slot: "bold",
    key: `${RELABEL_ASSET_DIR}/IBMPlexMono-Bold.ttf`,
    sha256: "37d92084cb713387fdabe35c6e243a3fe06b5dacf716c22d2204bf202941c585",
    source: "IBMPlexMono-SemiBold.ttf",
    sourceSha256: "5801cade8aa6cc81bdb3a463e05d55819339b738db383d55863e4a24139d99fd",
  },
  {
    family: "IBM Plex Mono",
    slot: "boldItalic",
    key: `${RELABEL_ASSET_DIR}/IBMPlexMono-BoldItalic.ttf`,
    sha256: "ed555c70e7c483681d757ac9441ee8bad17c384d3c1b94668e0cc7560dc3f7fe",
    source: "IBMPlexMono-SemiBoldItalic.ttf",
    sourceSha256: "34617bc3fd8a92b16adc6608896e39449336f2c22ef5cf12a261a36a4d6cd235",
  },
  {
    family: "IBM Plex Sans",
    slot: "bold",
    key: `${RELABEL_ASSET_DIR}/IBMPlexSans-Bold.ttf`,
    sha256: "532acd265ec1448a0e7717acf53ae9419dbae657a775e7db7345847a85f5cc13",
    source: "IBMPlexSans-SemiBold.ttf",
    sourceSha256: "90664322004606a83b106b28009200450aafe8622110367b8d4becd1bb5dd2a0",
  },
  {
    family: "IBM Plex Sans",
    slot: "boldItalic",
    key: `${RELABEL_ASSET_DIR}/IBMPlexSans-BoldItalic.ttf`,
    sha256: "55b6fd929a81e735f6657b2a5ad1585d08c9ed7e29cd138dc11886003c5eb5ab",
    source: "IBMPlexSans-SemiBoldItalic.ttf",
    sourceSha256: "e96c3c1ac695c642591aaebd2fe4068c5326f99507acbcb6c558cc4603451a21",
  },
  {
    // INT-S (F-049): kanonik bernama "IBM Plex Sans Condensed" != rFonts.
    family: "IBM Plex Sans Cond",
    slot: "regular",
    key: `${RELABEL_ASSET_DIR}/IBMPlexSansCond-Regular.ttf`,
    sha256: "cc28ffc672bd0a34f782018783d80d3a5dc497a9b2c2dd76bffa5a0e729e0566",
    source: "IBMPlexSansCond-Regular.ttf",
    sourceSha256: "d3057856ccc7ef347ea104b9b7fb3bf42b7b1befd8b06b9b91c33e5e787a5045",
  },
  {
    family: "IBM Plex Sans Cond",
    slot: "bold",
    key: `${RELABEL_ASSET_DIR}/IBMPlexSansCond-Bold.ttf`,
    sha256: "9584940bb7a22e8ccb74f28a59d0dc63f147582b09d91cdff70d955dd8b348fd",
    source: "IBMPlexSansCond-SemiBold.ttf",
    sourceSha256: "09d25ecc8ad8de40f73daa949cc45a5cb43fcc883b5475c0155f54d09c40a471",
  },
  {
    // INT-S (F-049): kanonik bernama "IBM Plex Sans Condensed" != rFonts.
    family: "IBM Plex Sans Cond",
    slot: "italic",
    key: `${RELABEL_ASSET_DIR}/IBMPlexSansCond-Italic.ttf`,
    sha256: "125399c2ce1b2d2d1db1272f36ba9123d57efdf9845cbba8dadb2238bbab27fb",
    source: "IBMPlexSansCond-Italic.ttf",
    sourceSha256: "be0b2f99eba64e5e27e7e2ea4610c48d8b097c8d68d9f08bad635252569db1da",
  },
  {
    family: "IBM Plex Sans Cond",
    slot: "boldItalic",
    key: `${RELABEL_ASSET_DIR}/IBMPlexSansCond-BoldItalic.ttf`,
    sha256: "7a2eab30c174c19c4502a65bca8cb0b25bde3aecc1506b748d08ac6107eba603",
    source: "IBMPlexSansCond-SemiBoldItalic.ttf",
    sourceSha256: "0d9e2ff27098bffd12c0e9d634a7705f50c52a36cd78f4ef8ce54d62bea97582",
  },
  {
    family: "IBM Plex Serif",
    slot: "bold",
    key: `${RELABEL_ASSET_DIR}/IBMPlexSerif-Bold.ttf`,
    sha256: "d1ead554e9e15090ff30921bef9b0969337d7f1210e7e4ce523b7b52bfeae8d4",
    source: "IBMPlexSerif-SemiBold.ttf",
    sourceSha256: "07866ea3cc7642e7c11035e557a747be2e61fe7f7487e62a6193cc2b85d2f8d7",
  },
  {
    family: "IBM Plex Serif",
    slot: "boldItalic",
    key: `${RELABEL_ASSET_DIR}/IBMPlexSerif-BoldItalic.ttf`,
    sha256: "008b779722cf2a4e627e2f11bb94bd2faf7a55ab1b71e25217b47b284795f0c5",
    source: "IBMPlexSerif-SemiBoldItalic.ttf",
    sourceSha256: "aaa6a27ef637f0c45248cdbed9675916441409b1db364162d3724b2b43a78f31",
  },
];

/**
 * Wajah berlabel turunan alias (FIX-6, F-059): keluarga `family` dibangun dari
 * wajah S99 keluarga `from` (slot sama) dengan `renameFontFamily`.
 */
export interface RelabelAliasFace {
  family: string;
  from: string;
  slot: RelabelSlot;
  /** Kunci virtual di bawah `fonts/renamed/` (tidak ada di manifest; dibangun runtime). */
  key: string;
  /** sha256 hasil bangun (terkunci; selisih = BY_CONSTRUCTION_FAILED). */
  sha256: string;
}

/**
 * Alias terkunci. Hanya slot tebal: wajah regular/italic kanonik sudah bernama
 * "IBM Plex Sans Condensed" sehingga dipakai apa adanya. sha256 = keluaran
 * `renameFontFamily` atas berkas S99 terkunci di atas (dua bangun identik;
 * divalidasi fontTools checkChecksums=2, FIX-6).
 */
export const RELABEL_ALIAS_FACES: readonly RelabelAliasFace[] = [
  {
    family: "IBM Plex Sans Condensed",
    from: "IBM Plex Sans Cond",
    slot: "bold",
    key: `${RELABEL_ASSET_DIR}/IBMPlexSansCondensed-Bold.ttf`,
    sha256: "9c8d482897666ed1d1c58756fad4d671c4d1dd33de5eb77d14c7f46cff1a2b37",
  },
  {
    family: "IBM Plex Sans Condensed",
    from: "IBM Plex Sans Cond",
    slot: "boldItalic",
    key: `${RELABEL_ASSET_DIR}/IBMPlexSansCondensed-BoldItalic.ttf`,
    sha256: "d80d29c09976c521ee840b6c4ee3148761d16a1d46ce521794cb2b089dfb21c8",
  },
];

/** Alias berlabel untuk (keluarga, slot) bila tidak ada wajah S99 dengan nama persis. */
export function findRelabelAlias(family: string, slot: string): RelabelAliasFace | undefined {
  const want = normalizeFamily(family);
  return RELABEL_ALIAS_FACES.find((f) => f.slot === slot && normalizeFamily(f.family) === want);
}

/** Direktori cache wajah alias: `STUDIO_FONT_CACHE_DIR` atau `<tmp>/gsp-studio-fonts/relabel`. */
export function relabelAliasCacheDir(): string {
  const env = process.env.STUDIO_FONT_CACHE_DIR;
  return env && env.trim() ? path.resolve(env.trim()) : path.join(os.tmpdir(), "gsp-studio-fonts", "relabel");
}

const sha256Hex = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");

function cachedOk(file: string, sha: string): boolean {
  return existsSync(file) && sha256Hex(new Uint8Array(readFileSync(file))) === sha;
}

/**
 * Bangun (sekali) berkas wajah alias dan kembalikan sumbernya. Sumber S99 harus
 * cocok sha256 terkunci; hasil bangun harus = `alias.sha256` (galat
 * BY_CONSTRUCTION_FAILED bila tidak, bukan cadangan diam-diam). Berkas cache
 * yang sudah ada dipakai bila sha256-nya cocok; selain itu ditulis ulang secara
 * atomik (tulis sementara lalu ganti nama). Galat FILE_MISSING_ON_DISK bila
 * wajah sumber tidak ada; galat I/O cache diteruskan ke pemanggil.
 */
export function relabelAliasSource(
  alias: RelabelAliasFace,
  templateAssets: ReadonlyArray<FontSource>,
  assetsRoot?: string,
  cacheDir = relabelAliasCacheDir(),
): FontSource {
  const base = findRelabelFace(alias.from, alias.slot);
  if (!base) {
    throw new StudioEngineError("BY_CONSTRUCTION_FAILED", `alias fon ${alias.family}/${alias.slot}: wajah sumber ${alias.from} tidak terdaftar`);
  }
  const target = path.join(cacheDir, `${alias.sha256}.ttf`);
  const out: FontSource = { key: alias.key, absPath: target, sha256: alias.sha256 };
  if (cachedOk(target, alias.sha256)) return out;

  const src = relabelSource(base, templateAssets, assetsRoot);
  if (!existsSync(src.absPath)) {
    throw new StudioEngineError("FILE_MISSING_ON_DISK", `Berkas fon tidak ada: ${src.absPath}`, { key: src.key });
  }
  const srcBytes = new Uint8Array(readFileSync(src.absPath));
  const srcSha = sha256Hex(srcBytes);
  if (srcSha !== base.sha256) {
    throw new StudioEngineError("BY_CONSTRUCTION_FAILED", `sha256 fon tidak cocok: ${src.key}`, { expected: base.sha256, actual: srcSha });
  }
  const built = renameFontFamily(srcBytes, alias.family, alias.key);
  const builtSha = sha256Hex(built);
  if (builtSha !== alias.sha256) {
    throw new StudioEngineError("BY_CONSTRUCTION_FAILED", `sha256 wajah alias tidak cocok: ${alias.key}`, {
      expected: alias.sha256,
      actual: builtSha,
    });
  }
  mkdirSync(cacheDir, { recursive: true });
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, built);
  try {
    renameSync(tmp, target);
  } catch (e) {
    // Windows: target bisa sedang dibuka job lain; isi sama (sha terkunci) = aman dipakai.
    rmSync(tmp, { force: true });
    if (!cachedOk(target, alias.sha256)) throw e;
  }
  return out;
}

/** true untuk kunci aset di bawah `fonts/renamed/` (tidak ikut pemilihan wajah biasa). */
export function isRelabelKey(key: string): boolean {
  return key.replace(/\\/g, "/").split("/").slice(-2, -1)[0] === RELABEL_ASSET_DIR.split("/")[1];
}

/**
 * Wajah berlabel untuk (keluarga, slot) yang diminta DOCX; pencocokan nama
 * keluarga EKSAK setelah normalisasi spasi/huruf (mis. "IBM Plex Sans Cond"
 * tidak cocok dengan "IBM Plex Sans Condensed": nama yang diminta harus sama
 * dengan nama di berkas, D-74).
 */
export function findRelabelFace(family: string, slot: string): RelabelFace | undefined {
  const want = normalizeFamily(family);
  return RELABEL_FACES.find((f) => f.slot === slot && normalizeFamily(f.family) === want);
}

/**
 * Sumber fon untuk wajah berlabel: aset templat dengan kunci sama (bila ada),
 * selain itu berkas di akar aset Studio. sha256 selalu dari tabel terkunci.
 */
export function relabelSource(face: RelabelFace, templateAssets: ReadonlyArray<FontSource>, assetsRoot?: string): FontSource {
  const fromTpl = templateAssets.find((s) => s.key.replace(/\\/g, "/").endsWith(face.key));
  const root = assetsRoot ?? path.resolve(process.cwd(), STUDIO_ASSETS_DIR);
  return {
    key: face.key,
    absPath: fromTpl?.absPath ?? path.join(root, ...face.key.split("/")),
    sha256: face.sha256,
  };
}
