// W2.3: integrasi scripts/verify_login_hq.mjs (kontrak login terpadu V1–V6)
// sebagai suite vitest. TIDAK ikut `npm test` biasa karena menulis akun uji ke DB
// (signup → login → hapus) dan memicu throttle login; hanya jalan saat
// HQ_LOGIN_CONTRACT=1 DAN HQ hidup DAN .env memuat token (dipakai verifier pada
// maintenance window). Sumber kebenaran tetap skrip .mjs-nya — suite ini hanya
// membungkus exit code + outputnya.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import net from 'node:net';

const SCRIPT = path.resolve(import.meta.dirname, '../../scripts/verify_login_hq.mjs');

async function hqAlive(): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createConnection({ host: '127.0.0.1', port: 9011 });
    const done = (v: boolean) => {
      s.destroy();
      resolve(v);
    };
    s.once('connect', () => done(true));
    s.once('error', () => done(false));
    setTimeout(() => done(false), 2000);
  });
}

const alive = await hqAlive();
const enabled = process.env.HQ_LOGIN_CONTRACT === '1' && alive && existsSync(SCRIPT);

describe.skipIf(!enabled)('kontrak login HQ V1–V6 (verify_login_hq.mjs)', () => {
  it('skrip verifikasi login exit 0 (semua V PASS, akun uji dibersihkan)', () => {
    let out = '';
    let failed = false;
    try {
      out = execFileSync('node', [SCRIPT], { encoding: 'utf8', timeout: 120_000, stdio: 'pipe' });
    } catch (e: any) {
      out = String(e.stdout ?? '') + String(e.stderr ?? '');
      failed = true;
    }
    // simpan transcript untuk audit verifier
    console.log(out);
    expect(failed, `verify_login_hq.mjs gagal — lihat transcript di atas`).toBe(false);
    expect(out).toMatch(/HASIL: \d+ PASS \/ 0 FAIL/);
  });
});
