// Deklarasi tipe untuk readiness-rules.mjs (FIX-8, M8). Satu definisi "render-env siap"
// yang dipakai layanan engine/soffice dan skrip render-env/check_readiness.mjs.
import type { RenderEnvManifest, RenderEnvReadiness } from "../../contract/render-env";

export declare const HKCU_FONTS_KEY: string;
export declare function systemBinary(...segments: string[]): string;
export declare function regExePath(): string;
export declare function taskkillExePath(): string;
export declare function powershellExePath(): string;
export declare const REG_QUERY_ARGS: readonly string[];
export declare const SESSION_FAMILIES_ARGS: readonly string[];

export interface RegValue {
  type: string;
  data: string;
}

export declare function parseManifest(text: string, schema: string): { manifest: RenderEnvManifest | null; error: string | null };
export declare function parseSofficeVersion(text: string): string | null;
export declare function parseRegQuery(stdout: string): Map<string, RegValue>;
export declare function lookupRegValue(values: Map<string, RegValue>, name: string): RegValue | undefined;
export declare function registryPointsTo(data: string | undefined | null, file: string): boolean;
export declare function readFontNamesFromBuffer(bytes: Uint8Array): {
  gdiFamily: string;
  subfamily: string;
  fullName: string;
  family: string;
  style: string;
};
export declare function gdiFaceName(name: string): string;
export declare function familyLoaded(families: Set<string>, expected: string, otherExpected: Set<string>): boolean;
export declare function parseSessionFamilies(stdout: string): Set<string>;
export declare function resolveSofficePath(i: { explicit?: string | null; manifest: RenderEnvManifest | null; manifestPath: string; fallback: string }): string;
export declare function resolveChromiumPath(i: { explicit?: string | null; manifest: RenderEnvManifest | null; fallback: string }): string;
export declare function resolveFontFile(file: string, manifestPath: string, cwd: string): string;

export interface ReadinessFacts {
  checkedAt: string;
  required: { schema: string; sofficeVersion: string };
  manifestPath: string;
  manifest: { manifest: RenderEnvManifest | null; sha256: string | null; error: string | null; detail?: string | null };
  soffice: { path: string; found: boolean; version: string | null; failure: string | null; detail?: string | null };
  chromiumFound: boolean;
  fonts: Array<{
    entry: RenderEnvManifest["fonts"][number];
    abs: string;
    fileExists: boolean;
    sha256: string | null;
    gdiFamily: string | null;
    namesError?: string | null;
  }>;
  registry: { values: Map<string, RegValue> | null; error: string | null; detail?: string | null };
  session: { families: Set<string> | null; error: string | null; skipped: boolean; detail?: string | null };
}

export declare function evaluateReadiness(f: ReadinessFacts): { readiness: RenderEnvReadiness; details: string[] };
