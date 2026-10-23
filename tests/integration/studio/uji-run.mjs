// SR-49: pembungkus perintah untuk DB uji `gsp_agent_hq_v21_uji`.
// - Membaca DATABASE_URL dari `.env` repo (TIDAK pernah dicetak, `.env` tidak diubah),
//   mengganti nama DB menjadi `gsp_agent_hq_v21_uji`, lalu menjalankan perintah anak
//   dengan DATABASE_URL tersebut hanya di lingkungan proses anak.
// - Keluaran anak disaring: setiap kemunculan URL/kata sandi diganti `[REDACTED]`.
// Pemakaian:
//   node tests/integration/studio/uji-run.mjs ensure-db        (CREATE DATABASE bila belum ada)
//   node tests/integration/studio/uji-run.mjs whoami           (cetak current_database())
//   node tests/integration/studio/uji-run.mjs reset            (DROP+CREATE DB uji, migrate deploy, salin templat lama v21)
//   node tests/integration/studio/uji-run.mjs suite            (reset lalu vitest tests/integration/studio)
//   node tests/integration/studio/uji-run.mjs fresh-seed       (N2/D-267: DB uji segar, seed dari registri kini + preset/kerangka x2)
//   node tests/integration/studio/uji-run.mjs -- <perintah...>  (mis. -- npx prisma migrate deploy)
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const UJI_DB = 'gsp_agent_hq_v21_uji';
export const UJI_WORKSPACE = path.join(os.tmpdir(), 'gsp-studio-sr49-uji');
const ALLOWED_SOURCE = new Set(['gsp_agent_hq_v21', 'gsp_agent_hq_v21_uji']);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function readEnvUrl() {
  const text = readFileSync(path.join(REPO_ROOT, '.env'), 'utf8');
  const line = text.split(/\r?\n/).find((l) => /^\s*DATABASE_URL\s*=/.test(l));
  if (!line) throw new Error('DATABASE_URL tidak ada di .env');
  let v = line.replace(/^\s*DATABASE_URL\s*=\s*/, '').trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  return v;
}

export function ujiUrl() {
  const u = new URL(readEnvUrl());
  const src = decodeURIComponent(u.pathname.replace(/^\//, ''));
  if (!ALLOWED_SOURCE.has(src)) throw new Error(`DB sumber .env bukan v21 (ditolak): ${src}`);
  u.pathname = `/${UJI_DB}`;
  return u;
}

function secrets(u) {
  const out = [u.toString(), readEnvUrl()];
  if (u.password) out.push(u.password, decodeURIComponent(u.password));
  return out.filter((s) => s && s.length >= 4);
}

function redactor(u) {
  const list = secrets(u);
  return (s) => list.reduce((acc, x) => acc.split(x).join('[REDACTED]'), s);
}

async function pgClient(dbName) {
  const { default: pg } = await import('pg');
  const u = ujiUrl();
  u.pathname = `/${dbName}`;
  u.search = '';
  const c = new pg.Client({ connectionString: u.toString() });
  await c.connect();
  return c;
}

async function ensureDb() {
  const c = await pgClient('postgres');
  try {
    const r = await c.query('select 1 from pg_database where datname = $1', [UJI_DB]);
    if (r.rowCount === 0) {
      await c.query(`create database "${UJI_DB}"`);
      console.log(`created database ${UJI_DB}`);
    } else console.log(`database ${UJI_DB} exists`);
  } finally {
    await c.end();
  }
}

async function dropDb() {
  const c = await pgClient('postgres');
  try {
    // Hanya DB uji; nama tetap (bukan masukan pengguna).
    await c.query(`drop database if exists "${UJI_DB}" with (force)`);
    console.log(`dropped database ${UJI_DB} (if existed)`);
  } finally {
    await c.end();
  }
}

async function reset() {
  await dropDb();
  await ensureDb();
  let code = await runChild('npx', ['prisma', 'migrate', 'deploy']);
  if (code !== 0) return code;
  code = await runChild('npx', ['prisma', 'migrate', 'status']);
  if (code !== 0) return code;
  // Templat gaya lama (tanpa kerangka) = salinan baris versi lama v21 (baca-saja di v21):
  // datum-kanonik v1..v5, datum-gsp v1, datum-manual-000 v1..v2 (baseline penjaga D-213/D-228).
  // Catatan: jalur seed dasar dari registri kini (`--import-benchmark --import-datum-gsp`) membuat
  // baseline datum-gsp v1 780 kunci yang membuat penjaga --presets-and-skeletons gagal (temuan SR-49).
  return runChild('node', ['tests/integration/studio/v21-legacy-templates.mjs']);
}

// N2 (D-267): seed DB SEGAR dari registri kini (tanpa salinan v21): dasar + preset/kerangka + Manual 000, lalu ulang.
async function freshSeed() {
  await dropDb();
  await ensureDb();
  let code = await runChild('npx', ['prisma', 'migrate', 'deploy']);
  if (code !== 0) return code;
  for (const args of [
    ['--import-benchmark', '--import-datum-gsp'],
    ['--presets-and-skeletons', '--import-manual000-v2'],
    ['--presets-and-skeletons', '--import-manual000-v2'],
  ]) {
    console.log(`### seed-studio ${args.join(' ')}`);
    code = await runChild('npx', ['tsx', 'prisma/seed-studio.ts', ...args]);
    console.log(`### exit=${code}`);
    if (code !== 0) return code;
  }
  return 0;
}

async function whoami() {
  const c = await pgClient(UJI_DB);
  try {
    const r = await c.query('select current_database() as db');
    console.log(`current_database() = ${r.rows[0].db}`);
  } finally {
    await c.end();
  }
}

function runChild(cmd, args) {
  const u = ujiUrl();
  const red = redactor(u);
  const env = {
    ...process.env,
    DATABASE_URL: u.toString(),
    POSTGRES_URL: u.toString(),
    STUDIO_IT_DB: UJI_DB,
    // Workspace Studio terpisah dari `data/studio-workspace` repo (berkas render/log uji).
    STUDIO_WORKSPACE_ROOT: process.env.STUDIO_WORKSPACE_ROOT ?? UJI_WORKSPACE,
  };
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: REPO_ROOT, env, shell: process.platform === 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (d) => process.stdout.write(red(d.toString())));
    child.stderr.on('data', (d) => process.stderr.write(red(d.toString())));
    child.on('close', (code) => resolve(code ?? 1));
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [sub, ...rest] = process.argv.slice(2);
  const main = async () => {
    if (sub === 'ensure-db') return ensureDb().then(() => 0);
    if (sub === 'whoami') return whoami().then(() => 0);
    if (sub === 'reset') return reset();
    if (sub === 'fresh-seed') return freshSeed();
    if (sub === 'suite') {
      const code = await reset();
      if (code !== 0) return code;
      return runChild('npx', ['vitest', 'run', 'tests/integration/studio', ...rest]);
    }
    if (sub === '--') return runChild(rest[0], rest.slice(1));
    throw new Error('pakai: ensure-db | whoami | -- <perintah...>');
  };
  main().then(
    (code) => process.exit(code),
    (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      let safe = msg;
      try { safe = redactor(ujiUrl())(msg); } catch { /* abaikan */ }
      console.error(`uji-run gagal: ${safe}`);
      process.exit(1);
    },
  );
}
