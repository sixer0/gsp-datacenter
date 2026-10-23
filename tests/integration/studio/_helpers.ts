/* eslint-disable @typescript-eslint/no-explicit-any -- uji integrasi: hasil layanan/route dibaca longgar */
// SR-49: utilitas uji integrasi DB Studio (tanpa impor Prisma/Studio statis).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { inflateSync } from 'node:zlib';
import { IT_INTERNAL_SECRET, UJI_WORKSPACE } from './_env';

export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
export const OUT_DIR = path.join(__dirname, 'out');

export function sha256Hex(b: Buffer | string): string {
  return createHash('sha256').update(b).digest('hex');
}

/** Tulis atomik (F-063): berkas sementara lalu rename. */
export function writeAtomic(file: string, content: string): void {
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, file);
}

/** Saring nilai rahasia apa pun dari teks log sebelum ditulis ke disk. */
function redact(s: string): string {
  const secrets = [process.env.DATABASE_URL, process.env.POSTGRES_URL].filter((x): x is string => !!x && x.length > 8);
  let out = s;
  for (const x of secrets) out = out.split(x).join('[REDACTED]');
  try {
    const pw = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).password : '';
    if (pw && pw.length >= 4) out = out.split(pw).join('[REDACTED]').split(decodeURIComponent(pw)).join('[REDACTED]');
  } catch {
    /* abaikan */
  }
  return out;
}

export interface ScriptRun {
  code: number;
  lines: Array<Record<string, any>>;
  logFile: string;
}

/** Jalankan skrip tsx repo (seed/backfill) dengan env proses ini (DB uji); log disimpan ke out/. */
export function runRepoScript(script: string, args: string[], logName: string): ScriptRun {
  const r = spawnSync('npx', ['tsx', script, ...args], {
    cwd: REPO_ROOT,
    env: { ...process.env, STUDIO_WORKSPACE_ROOT: UJI_WORKSPACE },
    shell: process.platform === 'win32',
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    timeout: 900_000,
  });
  const text = redact(`${r.stdout ?? ''}\n${r.stderr ?? ''}`);
  const logFile = path.join(OUT_DIR, logName);
  writeAtomic(logFile, `# ${script} ${args.join(' ')}\n# exit=${r.status}\n${text}`);
  const lines: Array<Record<string, any>> = [];
  for (const l of text.split(/\r?\n/)) {
    const t = l.trim();
    if (!t.startsWith('{')) continue;
    try {
      lines.push(JSON.parse(t));
    } catch {
      /* bukan JSON */
    }
  }
  return { code: r.status ?? 1, lines, logFile };
}

export function lastLine(run: ScriptRun, message: string): Record<string, any> {
  const hit = [...run.lines].reverse().find((l) => l.message === message);
  if (!hit) throw new Error(`baris log "${message}" tidak ada di ${run.logFile} (exit ${run.code})`);
  return hit;
}

/** NextRequest untuk route agen (header internal uji). */
export async function agentReq(urlPath: string, method: string, body?: unknown): Promise<any> {
  const { NextRequest } = await import('next/server');
  const headers: Record<string, string> = { 'x-internal-secret': IT_INTERNAL_SECRET };
  const init: Record<string, unknown> = { method, headers };
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(urlPath, 'https://127.0.0.1:9021'), init as never);
}

export function routeParams<T extends Record<string, string>>(p: T): { params: Promise<T> } {
  return { params: Promise.resolve(p) };
}

/** Byte berkas keluaran dari akar workspace Studio uji. */
export function readOutput(relPath: string): Buffer {
  return readFileSync(path.join(UJI_WORKSPACE, ...relPath.split('/')));
}

/**
 * Tanda isi PDF yang tidak peka urutan objek: soffice menulis objek fon tersemat dalam urutan
 * yang berbeda antar jalan (diamati SR-49: semua stream identik, hanya urutan objek fon
 * berubah), sehingga sha mentah PDF tidak stabil walau isi sama. Tanda = sha256 atas daftar
 * terurut sha256 setiap stream yang didekompresi (halaman, fon, gambar, CMap), ditambah
 * panjang berkas dan daftar terurut /FontName. Stream metadata XMP (memuat waktu) dikecualikan.
 */
export function pdfNormalizedSha256(b: Buffer): string {
  const s = b.toString('latin1');
  const hashes: string[] = [];
  let pos = 0;
  for (;;) {
    const re = /stream\r?\n/g;
    re.lastIndex = pos;
    const m = re.exec(s);
    if (!m) break;
    const start = m.index + m[0].length;
    const end = s.indexOf('endstream', start);
    if (end < 0) break;
    const raw = Buffer.from(s.slice(start, end), 'latin1');
    let dec: Buffer;
    try {
      dec = inflateSync(raw);
    } catch {
      try {
        dec = inflateSync(raw.subarray(0, raw.length - 1));
      } catch {
        dec = raw;
      }
    }
    const t = dec.toString('latin1');
    if (!t.includes('<x:xmpmeta')) hashes.push(sha256Hex(dec));
    pos = end + 9;
  }
  hashes.sort();
  const fonts = [...s.matchAll(/\/FontName\s*\/([A-Za-z0-9+#_-]+)/g)].map((x) => x[1]).sort();
  return sha256Hex(`${b.length}|${fonts.join(',')}|${hashes.join(',')}`);
}

export function stableJson(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(stableJson).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .sort()
    .filter((k) => o[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${stableJson(o[k])}`)
    .join(',')}}`;
}

export function readJson<T = any>(rel: string): T {
  return JSON.parse(readFileSync(path.join(REPO_ROOT, rel), 'utf8').replace(/^﻿/, '')) as T;
}
