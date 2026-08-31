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
 * Usage:
 *   node ensure-profile-complete.mjs check  <profile> [<profile> ...]
 *   node ensure-profile-complete.mjs ensure <profile> [<profile> ...] [--force]
 *
 * Output: single JSON object on stdout. Exit 0 = ok, 1 = usage error,
 * 2 = one or more profiles failed.
 */

import fs from "fs";
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

/** Recursively merge-copy a directory tree. Returns {added, updated}. */
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
            needCopy = fs.statSync(s).size !== fs.statSync(d).size;
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
    if (!force && fs.existsSync(leanMarkerPath)) {
      let marker = null;
      try { marker = JSON.parse(fs.readFileSync(leanMarkerPath, "utf8")); } catch { marker = null; }
      const keep = marker && Array.isArray(marker.always_load) ? marker.always_load : [];
      const skillsDst2 = path.join(pDir, "skills");
      fs.mkdirSync(skillsDst2, { recursive: true });
      const skillsSrc2 = path.join(rootDir, "skills");
      let ensured = 0;
      for (const s of keep) {
        const dst = path.join(skillsDst2, s);
        if (fs.existsSync(path.join(dst, "SKILL.md"))) continue;
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
        if (fs.existsSync(path.join(src, "SKILL.md"))) {
          const { added } = mergeTreeCounted(src, dst);
          if (added) { ensured += 1; result.copiedFiles.push(`skills/${s}`); }
        } else {
          result.changed.push(`lean-skill-missing:${s}`);
        }
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
