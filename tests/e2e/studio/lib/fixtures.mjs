// SR-52: fixture uji berprefiks `e2e-sr52-` di DB gsp_agent_hq_v21 dan pembersihannya (0 sisa).
// Pengguna ADMIN dibuat lewat skrip seed proyek `scripts/seed-webui-admin.mjs`; pengguna USER
// lewat jalur fixture proyek `POST /api/brahma/rbac/signup` (dipakai scripts/verify_login_hq.mjs).
// Kata sandi dibangkitkan acak per run, hanya hidup di memori proses, tidak dicetak/disimpan,
// dan akunnya dihapus di akhir sesi.
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { rmSync, existsSync, readdirSync, rmdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { ROOT, envValue, assertV21 } from "./env.mjs";
import { BASE } from "./api.mjs";
import { withDb } from "./db.mjs";

export const PREFIX = "e2e-sr52-";
export const WORKSPACE = resolve(ROOT, "data/studio-workspace");

export function newRun() {
  const tag = randomBytes(3).toString("hex");
  return {
    tag,
    admin: { username: `${PREFIX}a-${tag}`, password: randomBytes(18).toString("base64url") },
    user: { username: `${PREFIX}u-${tag}`, password: randomBytes(18).toString("base64url") },
    mission: `2026-10-23_e2e_sr52_${tag}`,
    docKey: "laporan-e2e",
  };
}

export async function createUsers(run) {
  assertV21();
  const out = execFileSync(process.execPath, [resolve(ROOT, "scripts/seed-webui-admin.mjs")], {
    cwd: ROOT,
    env: {
      ...process.env,
      WEBUI_ADMIN_USERNAME: run.admin.username,
      WEBUI_ADMIN_PASSWORD: run.admin.password,
      WEBUI_ADMIN_PROFILE: run.admin.username,
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const adminOk = /Created admin/.test(out);
  const r = await fetch(`${BASE}/api/brahma/rbac/signup`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-rbac-token": envValue("WEBUI_RBAC_TOKEN") },
    body: JSON.stringify({ username: run.user.username, password: run.user.password, displayName: "E2E SR-52 USER", hermesProfile: run.user.username }),
  });
  return { adminOk, adminLog: out.replace(/id=[^)]*/, "id=…").trim(), userStatus: r.status };
}

const TABLES = [
  "StudioDocument", "StudioRevision", "StudioOutputFile", "StudioRenderJob", "StudioAsset", "StudioArtifact",
  "StudioTemplate", "StudioTemplateVersion", "StudioDocIdentity", "StudioBlock", "StudioDocBlock", "StudioDocSection",
  "StudioDocChapter", "StudioDocSubsection", "WebUiUser",
];

export async function tableCounts() {
  return withDb(async (c) => {
    const o = {};
    for (const t of TABLES) o[t] = (await c.query(`SELECT count(*)::int n FROM "${t}"`)).rows[0].n;
    return o;
  });
}

function pruneEmptyParents(file, stopAt) {
  let d = dirname(file);
  while (d.startsWith(stopAt) && d !== stopAt) {
    try {
      if (readdirSync(d).length > 0) break;
      rmdirSync(d);
    } catch { break; }
    d = dirname(d);
  }
}

/** Hapus semua fixture run ini: dokumen misi (kaskade revisi/identitas/berkas/job), berkas di disk, aset baru, pengguna. */
export async function cleanup(run, createdAssetShas = []) {
  const report = { documents: 0, outputFilesOnDisk: 0, assets: 0, assetFiles: 0, users: 0, missionDirs: 0, templates: 0, templateVersions: 0 };
  await withDb(async (c) => {
    const docs = (await c.query(`SELECT id FROM "StudioDocument" WHERE "missionFolder" = $1`, [run.mission])).rows.map((r) => r.id);
    for (const id of docs) {
      const files = (await c.query(`SELECT "relPath" FROM "StudioOutputFile" WHERE "documentId"=$1`, [id])).rows;
      for (const f of files) {
        const p = resolve(WORKSPACE, f.relPath);
        if (p.startsWith(WORKSPACE) && existsSync(p)) { rmSync(p, { force: true }); report.outputFilesOnDisk++; pruneEmptyParents(p, WORKSPACE); }
      }
      report.documents += (await c.query(`DELETE FROM "StudioDocument" WHERE id=$1`, [id])).rowCount;
    }
    for (const sha of createdAssetShas) {
      const row = (await c.query(`SELECT "relPath" FROM "StudioAsset" WHERE sha256=$1`, [sha])).rows[0];
      const used = (await c.query(`SELECT count(*)::int n FROM "StudioDocBlock" b JOIN "StudioAsset" a ON a.id=b."assetId" WHERE a.sha256=$1`, [sha]).catch(() => ({ rows: [{ n: 0 }] }))).rows[0].n;
      if (row && used === 0) {
        report.assets += (await c.query(`DELETE FROM "StudioAsset" WHERE sha256=$1`, [sha])).rowCount;
        const p = resolve(WORKSPACE, row.relPath);
        if (p.startsWith(WORKSPACE) && existsSync(p)) { rmSync(p, { force: true }); report.assetFiles++; pruneEmptyParents(p, WORKSPACE); }
      }
    }
    // Templat salinan milik pengguna uji (alur T): slug berprefiks e2e-sr52- atau createdBy pengguna uji.
    const tpls = (await c.query(
      `SELECT id FROM "StudioTemplate" WHERE slug LIKE 'e2e-sr52-%' OR "createdBy" = ANY($1)`,
      [[run.user.username, `user:${run.user.username}`, run.admin.username, `user:${run.admin.username}`]])).rows.map((r) => r.id);
    for (const tid of tpls) {
      const docsUsing = (await c.query(`SELECT count(*)::int n FROM "StudioDocument" WHERE "templateId"=$1`, [tid])).rows[0].n;
      if (docsUsing > 0) continue;
      const vers = (await c.query(`SELECT id FROM "StudioTemplateVersion" WHERE "templateId"=$1 ORDER BY "versionNo" DESC`, [tid])).rows;
      for (const v of vers) report.templateVersions += (await c.query(`DELETE FROM "StudioTemplateVersion" WHERE id=$1`, [v.id])).rowCount;
      report.templates += (await c.query(`DELETE FROM "StudioTemplate" WHERE id=$1`, [tid])).rowCount;
    }
    report.users += (await c.query(`DELETE FROM "WebUiUser" WHERE username = ANY($1)`, [[run.admin.username, run.user.username]])).rowCount;
  });
  // Folder misi fixture di workspace (bila tersisa kosong / berisi sisa render).
  for (const sub of ["docs"]) {
    const d = resolve(WORKSPACE, sub, run.mission);
    if (d.startsWith(WORKSPACE) && existsSync(d)) { rmSync(d, { recursive: true, force: true }); report.missionDirs++; }
  }
  return report;
}

/** Sisa fixture setelah pembersihan (harus 0 semua). */
export async function residue(run, createdAssetShas = []) {
  return withDb(async (c) => ({
    documents: (await c.query(`SELECT count(*)::int n FROM "StudioDocument" WHERE "missionFolder" LIKE '2026-10-23_e2e_sr52_%'`)).rows[0].n,
    users: (await c.query(`SELECT count(*)::int n FROM "WebUiUser" WHERE username LIKE $1`, [`${PREFIX}%`])).rows[0].n,
    templates: (await c.query(`SELECT count(*)::int n FROM "StudioTemplate" WHERE slug LIKE 'e2e-sr52-%' OR "createdBy" LIKE '%e2e-sr52-%'`)).rows[0].n,
    assets: (await c.query(`SELECT count(*)::int n FROM "StudioAsset" WHERE sha256 = ANY($1)`, [createdAssetShas])).rows[0].n,
    renderJobsOrphan: (await c.query(`SELECT count(*)::int n FROM "StudioRenderJob" WHERE "documentId" IS NULL `)).rows[0].n,
    missionDir: existsSync(resolve(WORKSPACE, "docs", run.mission)) ? 1 : 0,
  }));
}
