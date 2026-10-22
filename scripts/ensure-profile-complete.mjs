#!/usr/bin/env node
/**
 * ensure-profile-complete.mjs — Hermes profile provisioning guard for RBAC accounts.
 *
 * Problem it solves (2026-08-27 audit):
 *   Accounts created through Agent HQ "create account" could reference a
 *   hermesProfile that does not exist on disk, or point at a half-built
 *   profile (missing skills / stock SOUL). The HQ endpoint previously wrote
 *   the WebUiUser row blind and never touched the filesystem.
 *
 * What "complete" means (mirrors hermes_cli.profiles.create_profile(clone_config=True)):
 *   - config.yaml, .env, SOUL.md cloned from the default (root) profile when absent
 *   - skills/ recursively merged from the root profile (added + refreshed)
 *   - memories/MEMORY.md & memories/USER.md copied ONLY when absent (curated state,
 *     never overwritten)
 *   - SOUL.md: replaced only when it is missing or contains the STOCK Hermes
 *     identity ("You are Hermes Agent…") — a real persona (Brahma / fleet
 *     personas) is NEVER overwritten unless --force.
 *
 *
 * PROV-HASH-GATE (05-10-2026, kartu t_6430ee67):
 *   - All skill copy decisions compare sha256 content (lean branch: was
 *     existsSync-skip; non-lean: was size compare), so patched fleet skills
 *     refresh existing profile copies instead of leaving stale bytes.
 *   - Recovery source decision: the root (default) profile mirror at
 *     <hermesHome>/skills/gsp/ KEEPS the live trio + naturalization packages
 *     and stays the recovery source on re-ensure (probe 05-10: root mirror
 *     PRESENT — the "root has no trio" line in the reporting card was stale).
 * Usage:
 *   node ensure-profile-complete.mjs check  <profile> [<profile> ...]
 *   node ensure-profile-complete.mjs ensure <profile> [<profile> ...] [--force]
 *
 * Output: single JSON object on stdout. Exit 0 = ok, 1 = usage error,
 * 2 = one or more profiles failed.
 */

import fs from "fs";
import crypto from "crypto";
import os from "os";
import path from "path";

// ── Base Hermes home resolution (mirrors WebUI _resolve_base_hermes_home) ──
export function resolveBaseHome() {
  const candidates = [];
  const envBase = (process.env.HERMES_BASE_HOME || "").trim();
  if (envBase) candidates.push(envBase);
  const envHome = (process.env.HERMES_HOME || "").trim();
  if (envHome && path.basename(path.dirname(envHome)) !== "profiles") {
    // Not a per-profile home → acceptable base candidate.
    candidates.push(envHome);
  }
  const localAppData = process.env.LOCALAPPDATA || "";
  if (localAppData) candidates.push(path.join(localAppData, "hermes"));
  candidates.push(path.join(os.homedir(), ".hermes"));
  // Prefer the first candidate that actually contains a profiles/ directory;
  // otherwise fall back to the first existing directory, else the last candidate.
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "profiles"))) return c;
  }
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[candidates.length - 1];
}

const NAME_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export function isValidProfileName(name) {
  return typeof name === "string" && NAME_RE.test(name);
}

export function profilesRoot(baseHome = resolveBaseHome()) {
  return path.join(baseHome, "profiles");
}

export function profileDir(name, baseHome = resolveBaseHome()) {
  return path.join(profilesRoot(baseHome), name);
}

function isStockSoul(text) {
  return /^\uFEFF?\s*You are Hermes Agent/.test(text || "");
}

function readIfExists(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

/** Count leaf skills: directories containing a SKILL.md (flat or categorized). */
export function countLeafSkills(root) {
  let n = 0;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    let hasSkillMd = false;
    for (const e of entries) {
      if (e.isFile() && e.name === "SKILL.md") hasSkillMd = true;
      else if (e.isDirectory()) stack.push(path.join(dir, e.name));
    }
    if (hasSkillMd) n += 1;
  }
  return n;
}

/** sha256 (hex) of a file, or null when unreadable. */
function sha256File(file) {
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  } catch {
    return null;
  }
}

/**
 * Recursively merge-copy a directory tree. Returns {added, updated}.
 * PROV-HASH-GATE t_6430ee67 (05-10-2026): copy decision compares sha256
 * content (was: file size comparison — missed same-length edits).
 */
function mergeTreeCounted(srcRoot, dstRoot) {
  let added = 0;
  let updated = 0;
  const walk = (src, dst) => {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const s = path.join(src, entry.name);
      const d = path.join(dst, entry.name);
      if (entry.isDirectory()) walk(s, d);
      else if (entry.isFile()) {
        const destExists = fs.existsSync(d);
        let needCopy = true;
        if (destExists) {
          try {
            needCopy = sha256File(s) !== sha256File(d);
          } catch {
            needCopy = true;
          }
        }
        if (needCopy) {
          fs.copyFileSync(s, d);
          if (destExists) updated += 1;
          else added += 1;
        }
      }
    }
  };
  walk(srcRoot, dstRoot);
  return { added, updated };
}

/** True when dst contains every file of src with identical sha256 content. */
function treesIdentical(srcRoot, dstRoot) {
  const stack = [["", srcRoot, dstRoot]];
  while (stack.length) {
    const [rel, src, dst] = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(src, { withFileTypes: true });
    } catch {
      return false;
    }
    for (const entry of entries) {
      const s = path.join(src, entry.name);
      const d = path.join(dst, entry.name);
      if (entry.isDirectory()) {
        if (!fs.existsSync(d)) return false;
        stack.push([rel, s, d]);
      } else if (entry.isFile()) {
        const hS = sha256File(s);
        const hD = sha256File(d);
        if (!hS || hS !== hD) return false;
      }
    }
  }
  return true;
}

/**
 * Ensure a profile is complete relative to the root (default) profile.
 * Idempotent — safe to run repeatedly.
 */
export function ensureProfileComplete(name, opts = {}) {
  const force = !!opts.force;
  const baseHome = resolveBaseHome();
  const rootDir = baseHome;
  const pDir = profileDir(name, baseHome);
  const result = {
    name,
    existedBefore: false,
    created: false,
    changed: [],
    copiedFiles: [],
    addedSkills: 0,
    updatedSkills: 0,
    skillCount: 0,
    soul: { action: "kept", identity: null },
    ok: true,
    error: null,
  };

  try {
    result.existedBefore = fs.existsSync(pDir);
    if (!result.existedBefore) result.created = true;

    fs.mkdirSync(pDir, { recursive: true });

    // 1) Top-level config files: copy ONLY when absent (never clobber live config/.env).
    for (const fname of ["config.yaml", ".env", "SOUL.md"]) {
      const src = path.join(rootDir, fname);
      const dst = path.join(pDir, fname);
      if (fname === "SOUL.md") continue; // handled below with identity guard
      if (!fs.existsSync(dst) && fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
        result.changed.push(fname);
        result.copiedFiles.push(fname);
      }
    }

    // 2) SOUL.md — surgical identity guard.
    const soulDst = path.join(pDir, "SOUL.md");
    const soulSrc = path.join(rootDir, "SOUL.md");
    const current = readIfExists(soulDst);
    const currentTrim = (current || "").trim();
    const stock = current === null || currentTrim === "" || isStockSoul(current);
    if ((stock || force) && fs.existsSync(soulSrc)) {
      fs.copyFileSync(soulSrc, soulDst);
      result.soul.action = current === null ? "copied" : stock ? "replaced-stock" : "forced-replaced";
      if (result.soul.action !== "copied") result.changed.push("SOUL.md");
    } else {
      result.soul.action = "kept";
    }
    const after = readIfExists(soulDst) || "";
    result.soul.identity = /^#.*Brahma/m.test(after)
      ? "BRAHMA"
      : isStockSoul(after)
        ? "STOCK"
        : after.trim()
          ? "custom"
          : "missing";

    // 3) Skills tree — merge from root (source of truth).
    //    LEAN POLICY (31-08-2026): a profile carrying a .lean-policy marker opted into
    //    the lean fleet policy (physical skills = ALWAYS LOAD only). Merging the full
    //    root tree here would silently re-bloat it (~141 skills). Respect the marker:
    //    only ensure the marker's always_load skills exist, copying each from root.
    const leanMarkerPath = path.join(pDir, ".lean-policy");
    if (fs.existsSync(leanMarkerPath)) {
      let marker = null;
      try { marker = JSON.parse(fs.readFileSync(leanMarkerPath, "utf8")); } catch { marker = null; }
      const keep = marker && Array.isArray(marker.always_load) ? marker.always_load : [];
      const skillsDst2 = path.join(pDir, "skills");
      fs.mkdirSync(skillsDst2, { recursive: true });
      const skillsSrc2 = path.join(rootDir, "skills");
      let ensured = 0;
      for (const s of keep) {
        const dst = path.join(skillsDst2, s);
        // find in root skills tree (flat, gsp/ category, or any category)
        let src = path.join(skillsSrc2, s);
        if (!fs.existsSync(path.join(src, "SKILL.md"))) {
          src = path.join(skillsSrc2, "gsp", s);
        }
        if (!fs.existsSync(path.join(src, "SKILL.md"))) {
          const cats = fs.readdirSync(skillsSrc2, { withFileTypes: true }).filter((e) => e.isDirectory());
          for (const c of cats) {
            const cand = path.join(skillsSrc2, c.name, s);
            if (fs.existsSync(path.join(cand, "SKILL.md"))) { src = cand; break; }
          }
        }
        if (!fs.existsSync(path.join(src, "SKILL.md"))) {
          result.changed.push(`lean-skill-missing:${s}`);
          continue;
        }
        // PROV-HASH-GATE t_6430ee67 (05-10-2026): an existing copy is REFRESHED
        // whenever its sha256 differs from the source mirror. The old
        // existsSync(SKILL.md)-continue left stale ALWAYS LOAD skills unpatched
        // (preseden: 38 salinan basi t_f4d9c72c) until a manual re-sync card ran.
        if (treesIdentical(src, dst)) continue;
        mergeTreeCounted(src, dst);
        ensured += 1;
        result.copiedFiles.push(`skills/${s}`);
      }
      if (ensured) result.changed.push(`lean-ensured(+${ensured})`);
      result.skillCount = countLeafSkills(skillsDst2);
      result.leanPolicy = true;
      return result;
    }
    const skillsSrc = path.join(rootDir, "skills");
    const skillsDst = path.join(pDir, "skills");
    if (fs.existsSync(skillsSrc)) {
      const { added, updated } = mergeTreeCounted(skillsSrc, skillsDst);
      result.addedSkills = added;
      result.updatedSkills = updated;
      if (added + updated > 0) result.changed.push(`skills(+${added}/~${updated})`);
    }

    // 4) Curated memory files — only when absent.
    for (const rel of ["memories/MEMORY.md", "memories/USER.md"]) {
      const src = path.join(rootDir, rel);
      const dst = path.join(pDir, rel);
      if (!fs.existsSync(dst) && fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.copyFileSync(src, dst);
        result.changed.push(rel);
      }
    }

    result.skillCount = countLeafSkills(skillsDst);
  } catch (err) {
    result.ok = false;
    result.error = String(err && err.stack ? err.stack : err);
  }

  return result;
}

// ── LEAN provisioning (FIX 02-09-2026, temuan #2 & #3) ─────────────────────
// Akun RBAC baru (USER maupun ADMINISTRATOR) dulu diprovisioni dengan clone
// PENUH: ~141 skill root ditimbun + engine men-seed bundled packs -> profil
// gemuk, melanggar kebijakan lean+enforcement 31-08. Preseden manual:
// gspuser01 (docs/2026-09-02-lean-gspuser01-gateway/) dan misi 31-08.
// Fungsi ini membuat profil lean sejak lahir: config/.env/SOUL + fisik hanya
// skill lane (controller: trio orkestrasi+verif+LAD, maks 5; worker: verif
// saja) + marker ganda .lean-policy & .no-bundled-skills agar provisioning
// berikutnya dan skills_sync engine tidak menggemukkan lagi.

export const LEAN_CONTROLLER_SKILLS = [
  "gsp-orchestrator-worker",
  "gsp-orchestration-execution",
  "gsp-verification-before-completion",
  "gsp-limit-aware-delegation",
];
export const LEAN_WORKER_SKILLS = ["gsp-verification-before-completion"];

function findSkillSrc(rootSkills, name) {
  const candidates = [
    path.join(rootSkills, name),
    path.join(rootSkills, "gsp", name),
  ];
  for (const c of candidates) if (fs.existsSync(path.join(c, "SKILL.md"))) return c;
  try {
    for (const e of fs.readdirSync(rootSkills, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const cand = path.join(rootSkills, e.name, name);
      if (fs.existsSync(path.join(cand, "SKILL.md"))) return cand;
    }
  } catch { /* no root tree */ }
  return null;
}

/**
 * Create/repair a LEAN profile for an RBAC account. Idempotent.
 * opts: { lane: "controller"|"worker", force }
 * Never clobbers live config/.env or a custom SOUL (same guards as ensure).
 */
export function provisionLeanProfile(name, opts = {}) {
  const lane = opts.lane === "worker" ? "worker" : "controller";
  const keep = lane === "worker" ? LEAN_WORKER_SKILLS : LEAN_CONTROLLER_SKILLS;
  const baseHome = resolveBaseHome();
  const rootDir = baseHome;
  const pDir = profileDir(name, baseHome);
  const result = {
    name, lane, lean: true, existedBefore: false, created: false,
    changed: [], skillCount: 0, missingSkills: [], ok: true, error: null,
  };
  try {
    result.existedBefore = fs.existsSync(pDir);
    if (!result.existedBefore) result.created = true;
    fs.mkdirSync(pDir, { recursive: true });

    // 1) config.yaml + .env from root ONLY when absent (never clobber live).
    for (const fname of ["config.yaml", ".env"]) {
      const src = path.join(rootDir, fname);
      const dst = path.join(pDir, fname);
      if (!fs.existsSync(dst) && fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
        result.changed.push(fname);
      }
    }

    // 2) SOUL.md — copy from root only when missing/empty/stock (identity guard).
    const soulDst = path.join(pDir, "SOUL.md");
    const soulSrc = path.join(rootDir, "SOUL.md");
    const current = readIfExists(soulDst);
    const stock = current === null || (current || "").trim() === "" || isStockSoul(current);
    if (stock && fs.existsSync(soulSrc)) {
      fs.copyFileSync(soulSrc, soulDst);
      result.changed.push("SOUL.md");
    }

    // 3) Skills — physical set = lane skills, copied from root or fleet registry.
    const skillsDst = path.join(pDir, "skills");
    fs.mkdirSync(skillsDst, { recursive: true });
    const registry = path.join(rootDir, "skills", "gsp");
    for (const s of keep) {
      const dst = path.join(skillsDst, s);
      if (fs.existsSync(path.join(dst, "SKILL.md"))) continue;
      const src = findSkillSrc(path.join(rootDir, "skills"), s) || findSkillSrc(registry, s);
      if (src) {
        mergeTreeCounted(src, dst);
        result.changed.push(`skills/${s}`);
      } else {
        result.missingSkills.push(s);
      }
    }

    // 4) Markers — the pair that keeps leanness durable (preseden gsp-budi/gspuser01).
    const lpPath = path.join(pDir, ".lean-policy");
    if (!fs.existsSync(lpPath)) {
      fs.writeFileSync(
        lpPath,
        JSON.stringify({
          policy: "lean+enforcement",
          lean: true,
          date: new Date().toISOString().slice(0, 10),
          lane,
          always_load: keep,
          rbac: true,
          contract: "docs/2026-08-31-enforcement-fleet/contract.md",
          provisionedBy: "ensure-profile-complete.provisionLeanProfile",
        }, null, 1) + "\n",
        "utf8"
      );
      result.changed.push(".lean-policy");
    }
    const nbPath = path.join(pDir, ".no-bundled-skills");
    if (!fs.existsSync(nbPath)) {
      fs.writeFileSync(nbPath, `lean ${lane}: no bundled seeding\n`, "utf8");
      result.changed.push(".no-bundled-skills");
    }
    // Stale artifacts that would re-seed/re-bloat: remove so engine rebuilds lean.
    for (const junk of [path.join(skillsDst, ".bundled_manifest"), path.join(pDir, ".skills_prompt_snapshot.json")]) {
      if (fs.existsSync(junk)) { fs.rmSync(junk, { recursive: true, force: true }); result.changed.push("purged:" + path.basename(junk)); }
    }

    // 5) Curated memory files — only when absent (same rule as ensure).
    for (const rel of ["memories/MEMORY.md", "memories/USER.md"]) {
      const src = path.join(rootDir, rel);
      const dst = path.join(pDir, rel);
      if (!fs.existsSync(dst) && fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.copyFileSync(src, dst);
        result.changed.push(rel);
      }
    }

    result.skillCount = countLeafSkills(skillsDst);
    if (result.missingSkills.length) {
      result.ok = false;
      result.error = `lean skills not found in root/registry: ${result.missingSkills.join(", ")}`;
    }
  } catch (err) {
    result.ok = false;
    result.error = String(err && err.stack ? err.stack : err);
  }
  return result;
}

/** Non-mutating inspection. */
export function inspectProfile(name) {
  const pDir = profileDir(name);
  const exists = fs.existsSync(pDir);
  const soulText = exists ? readIfExists(path.join(pDir, "SOUL.md")) : null;
  const identity = soulText === null ? "missing" : /^#.*Brahma/m.test(soulText) ? "BRAHMA" : isStockSoul(soulText) ? "STOCK" : soulText.trim() ? "custom" : "empty";
  const skills = path.join(pDir, "skills");
  return {
    name,
    exists,
    config: exists && fs.existsSync(path.join(pDir, "config.yaml")),
    env: exists && fs.existsSync(path.join(pDir, ".env")),
    soulIdentity: exists ? identity : null,
    skillCount: exists ? countLeafSkills(skills) : 0,
  };
}

// ─────────────────────────── CLI ───────────────────────────
function main(argv) {
  const [mode, ...rest] = argv;
  const flags = rest.filter((a) => a.startsWith("--"));
  const names = rest.filter((a) => !a.startsWith("--"));

  if (!mode || !["check", "ensure"].includes(mode) || names.length === 0) {
    console.error(JSON.stringify({ ok: false, error: "Usage: ensure-profile-complete.mjs <check|ensure> <profile>..." }));
    process.exit(1);
  }
  const invalid = names.filter((n) => !isValidProfileName(n) || n === "default");
  if (invalid.length) {
    console.error(JSON.stringify({ ok: false, error: `Invalid profile name(s): ${invalid.join(", ")}` }));
    process.exit(1);
  }
  if (mode === "ensure" && !isValidProfileName(names[0]) ) process.exit(1);

  const force = flags.includes("--force");
  let results;
  if (mode === "check") {
    results = names.map((n) => inspectProfile(n));
  } else {
    results = names.map((n) => ensureProfileComplete(n, { force }));
  }
  const ok = results.every((r) => r.ok !== false);
  console.log(JSON.stringify({ ok, mode, baseHome: resolveBaseHome(), results }));
  process.exit(ok ? 0 : 2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"))) {
  main(process.argv.slice(2));
}
