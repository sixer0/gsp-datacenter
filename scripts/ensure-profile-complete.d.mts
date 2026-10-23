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

/** Lean skill set per lane (INT-K; mirrors ensure-profile-complete.mjs). */
export declare const LEAN_CONTROLLER_SKILLS: string[];

export declare const LEAN_WORKER_SKILLS: string[];

export interface LeanProvisionResult {
  name: string;
  lane: "controller" | "worker";
  lean: true;
  existedBefore: boolean;
  created: boolean;
  changed: string[];
  skillCount: number;
  missingSkills: string[];
  ok: boolean;
  error: string | null;
}

export declare function provisionLeanProfile(
  name: string,
  opts?: { lane?: "controller" | "worker"; force?: boolean },
): LeanProvisionResult;
