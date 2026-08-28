/**
 * Type declarations for scripts/ensure-profile-complete.mjs
 * (Hermes profile provisioning guard used by /api/user-access and ops CLI.)
 */

export declare function resolveBaseHome(): string;

export declare function isValidProfileName(name: unknown): boolean;

export declare function profilesRoot(baseHome?: string): string;

export declare function profileDir(name: string, baseHome?: string): string;

export declare function countLeafSkills(root: string): number;

export interface EnsureResult {
  name: string;
  existedBefore: boolean;
  created: boolean;
  changed: string[];
  copiedFiles: string[];
  addedSkills: number;
  updatedSkills: number;
  skillCount: number;
  soul: { action: string; identity: string | null };
  ok: boolean;
  error: string | null;
}

export declare function ensureProfileComplete(
  name: string,
  opts?: { force?: boolean },
): EnsureResult;

export interface ProfileInspection {
  name: string;
  exists: boolean;
  config: boolean;
  env: boolean;
  soulIdentity: string | null;
  skillCount: number;
}

export declare function inspectProfile(name: string): ProfileInspection;
