// SR-49: salin baris templat GAYA LAMA (versi `skeletonSha256` null) dari `gsp_agent_hq_v21`
// ke `gsp_agent_hq_v21_uji`, agar migrasi preset + kerangka (SR-36/SR-38) di DB uji memakai
// versi lama yang SAMA dengan sejarah v21 (baseline penjaga paramsSha256 D-213).
// - Koneksi v21 dibuka READ ONLY (default_transaction_read_only=on); hanya SELECT.
// - Tulis hanya ke DB uji; penjaga nama DB tujuan.
// - URL tidak pernah dicetak.
// Pemakaian: node tests/integration/studio/v21-legacy-templates.mjs [--inspect]
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const UJI_DB = 'gsp_agent_hq_v21_uji';
const SRC_DB = 'gsp_agent_hq_v21';
const SLUGS = ['datum-kanonik', 'datum-gsp', 'datum-manual-000'];
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function baseUrl() {
  const text = readFileSync(path.join(REPO_ROOT, '.env'), 'utf8');
  const line = text.split(/\r?\n/).find((l) => /^\s*DATABASE_URL\s*=/.test(l));
  let v = line.replace(/^\s*DATABASE_URL\s*=\s*/, '').trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  const u = new URL(v);
  u.search = '';
  return u;
}
function urlFor(db) {
  const u = baseUrl();
  u.pathname = `/${db}`;
  return u.toString();
}

async function main() {
  const inspect = process.argv.includes('--inspect');
  const src = new pg.Client({ connectionString: urlFor(SRC_DB), options: '-c default_transaction_read_only=on' });
  await src.connect();
  const who = await src.query('select current_database() as db, current_setting(\'default_transaction_read_only\') as ro');
  if (who.rows[0].db !== SRC_DB || who.rows[0].ro !== 'on') throw new Error('sumber bukan v21 read-only');
  const tpl = await src.query('select * from "StudioTemplate" where slug = any($1) order by slug', [SLUGS]);
  const ver = await src.query(
    'select v.* from "StudioTemplateVersion" v join "StudioTemplate" t on t.id = v."templateId" where t.slug = any($1) and v."skeletonSha256" is null order by t.slug, v."versionNo"',
    [SLUGS],
  );
  await src.end();
  const summary = tpl.rows.map((t) => {
    const vs = ver.rows.filter((v) => v.templateId === t.id);
    return { slug: t.slug, legacyVersions: vs.map((v) => `v${v.versionNo}:${v.paramsSha256.slice(0, 8)}:${Object.keys(v.resolvedParams).length}k`) };
  });
  console.log(JSON.stringify({ source: SRC_DB, readOnly: true, templates: summary }));
  if (inspect) return;

  const dst = new pg.Client({ connectionString: urlFor(UJI_DB) });
  await dst.connect();
  const d = await dst.query('select current_database() as db');
  if (d.rows[0].db !== UJI_DB) throw new Error('tujuan bukan DB uji');
  await dst.query('begin');
  try {
    // 1) templat; 2) versi tanpa base; 3) tautan base (base dapat lintas templat, mis. turunan kanonik).
    const ids = new Set(ver.rows.map((v) => v.id));
    const missingBase = ver.rows.filter((v) => v.baseVersionId && !ids.has(v.baseVersionId)).map((v) => `${v.id}->${v.baseVersionId}`);
    if (missingBase.length > 0) throw new Error(`base versi di luar himpunan salinan: ${missingBase.join(', ')}`);
    for (const t of tpl.rows) {
      const vs = ver.rows.filter((v) => v.templateId === t.id);
      const latest = Math.max(...vs.map((v) => v.versionNo));
      await dst.query(
        'insert into "StudioTemplate" (id, slug, name, kind, description, "isCanonical", archived, "latestVersionNo", "createdBy", "createdAt", "updatedAt", "isPreset") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
        [t.id, t.slug, t.name, t.kind, t.description, t.isCanonical, t.archived, latest, t.createdBy, t.createdAt, t.updatedAt, false],
      );
    }
    for (const v of ver.rows) {
      await dst.query(
        'insert into "StudioTemplateVersion" (id, "templateId", "versionNo", "baseVersionId", overrides, "resolvedParams", "paramsSha256", "roleFormats", "sectionPlan", assets, provenance, "changeNote", "createdBy", "createdAt", "skeletonSha256") values ($1,$2,$3,null,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,null)',
        [v.id, v.templateId, v.versionNo, JSON.stringify(v.overrides), JSON.stringify(v.resolvedParams), v.paramsSha256, JSON.stringify(v.roleFormats), JSON.stringify(v.sectionPlan), JSON.stringify(v.assets), JSON.stringify(v.provenance), v.changeNote, v.createdBy, v.createdAt],
      );
    }
    for (const v of ver.rows) {
      if (v.baseVersionId) await dst.query('update "StudioTemplateVersion" set "baseVersionId" = $1 where id = $2', [v.baseVersionId, v.id]);
    }
    await dst.query('commit');
  } catch (e) {
    await dst.query('rollback');
    throw e;
  } finally {
    await dst.end();
  }
  console.log(JSON.stringify({ copiedTo: UJI_DB, templates: tpl.rows.length, versions: ver.rows.length }));
}

main().catch((e) => {
  console.error(`v21-legacy-templates gagal: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
