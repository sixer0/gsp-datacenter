// ILFIX-0927 F1-5 — uji permanen lapisan baca Information Library (IlSearchDoc).
// Kontrak mengikat: docs/2026-09-27-ilfix-ingest/f1/F1-DESIGN.md §4 + kartu t_65faf555.
// Butir: (a) 8 kueri golden gap_baseline mengembalikan >=1 hasil atas DB uji
// ilfix_uji + fixture SHARED_WORKSPACE; (b) bentuk respons jalur kandidat identik
// jalur lama (kunci entries..lastSync); (c) fallback indeks-kosong (DB `postgres`,
// IlSearchDoc 0 baris) dan tabel-tak-ada (DB `jira_clone`, tanpa IlSearchDoc) ->
// 200 + jalur LIKE lama; (d) token kosong (kueri <3 char / simbol saja) -> fallback
// LIKE; (e) injeksi tsquery (& | ! : kutip) ditangani lewat parameter, bukan
// concat — plus gerbang statis: NOL interpolasi `${}` pada blok pool.query route.ts.
//
// RESEP MERAH-HIJAU (kenapa fixture sengaja tidak memuat kalimat golden utuh):
// jalur LIKE lama mencocokkan SELURUH kalimat sebagai satu substring (baseline
// produksi 0/8, gap_baseline.py). Fixture menaruh kata-kata golden tersebar tanpa
// pernah merangkai kalimat golden utuh => LIKE lama MERAH, lapisan kandidat (token
// OR + ts_rank atas DB uji ilfix_uji yang berisi korpus nyata) HIJAU. Kalimat
// utuh hanya dipakai pada uji fallback (c) yang memang menguji perilaku LIKE.
//
// Aturan D-TA-06: HANYA DB uji (ilfix_uji fixture, postgres kosong, jira_clone) —
// tidak pernah menyentuh gsp_agent_hq produksi; tanpa deploy/restart.
// Pola skip mengikuti tests/smoke: `npm test` tetap hijau di mesin tanpa DB uji.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { createRequire } from 'node:module';

const req = createRequire(import.meta.url);
const ROOT = path.resolve(import.meta.dirname, '..');
const ENV_FILE = path.join(ROOT, '.env');

// Delapan kueri golden VERBATIM dari scripts/adint-pilot-0927/gap_baseline.py (QS).
const GOLDEN_QUERIES = [
  'vendor Shenzhen yang bikin power supply untuk keamanan',
  'perusahaan CCTV asal Guangdong yang ikut Security China 2024',
  'siapa saja vendor China di CIDEX 2024 bidang AI edukasi',
  'distributor alat pelacak iklan digital di Asia Tenggara',
  'vendor due diligence tier 1 north china',
  'sistem pengawasan video area gudang',
  'perangkat keras network video recorder',
  'analisis risiko rantai pasok vendor pertahanan China',
];

// Frasa pendek yang ADA utuh di fixture — dipakai menguji jalur LIKE lama pada
// kasus fallback (indeks kosong / tabel tak ada).
const LIKE_PHRASE = 'power supply';

const RESP_KEYS = [
  'entries',
  'domainCounts',
  'projectCounts',
  'typeCounts',
  'statusCounts',
  'total',
  'lastSync',
];

function readBaseUrl(): string | null {
  try {
    const env = fs.readFileSync(ENV_FILE, 'utf8');
    const m = env.match(/^DATABASE_URL="?([^"\r\n]+)"?/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function dbUrl(base: string, dbname: string): string {
  return base.replace(/\/[^/?]+(\?|$)/, '/' + dbname + '$1');
}

// ── Gerbang lingkungan ────────────────────────────────────────────────────────
// Aktif hanya bila .env ada, cluster Postgres hidup, DAN ilfix_uji punya indeks
// terisi (fixture F1-3). Selain itu suite skip — `npm test` tidak pernah merah
// karena lingkungan, bukan regresi (konvensi tests/vitest.config.ts).
const BASE_URL = readBaseUrl();
let envReady = false;
if (BASE_URL) {
  const alive = await new Promise<boolean>((resolve) => {
    const host = new URL(BASE_URL).hostname || '127.0.0.1';
    const port = Number(new URL(BASE_URL).port || 5432);
    const s = net.createConnection({ host, port });
    const done = (v: boolean) => {
      s.destroy();
      resolve(v);
    };
    s.once('connect', () => done(true));
    s.once('error', () => done(false));
    setTimeout(() => done(false), 2000);
  });
  if (alive) {
    try {
      const pg = req('pg');
      const pool = new pg.Pool({
        connectionString: dbUrl(BASE_URL, 'ilfix_uji'),
        connectionTimeoutMillis: 3000,
      });
      const r = await pool.query('select count(*)::int n from "IlSearchDoc"');
      envReady = Number(r.rows[0]?.n ?? 0) > 0;
      await pool.end();
    } catch {
      envReady = false;
    }
  }
}

// ── Fixture SHARED_WORKSPACE ──────────────────────────────────────────────────
// Kata kunci tiap kueri golden hadir TERSEBAR; tidak ada satu pun berkas yang
// memuat kalimat golden sebagai substring utuh (lihat RESEP MERAH-HIJAU di atas).
function makeFixtureWs(prefix: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'AGENTS.md'),
    [
      '# Panduan GSP',
      '',
      'Catatan pengadaan: sebuah vendor di Shenzhen membuat power supply untuk kebutuhan keamanan.',
      'Profil perusahaan CCTV dari Guangdong tercatat ikut pameran Security China 2024.',
      'Daftar siapa saja vendor China yang tampil di CIDEX 2024 pada bidang AI edukasi.',
      '',
    ].join('\n'),
  );
  fs.writeFileSync(
    path.join(root, 'docs', 'uji-f15.md'),
    [
      '# Uji F15',
      '',
      'Jaringan distributor alat pelacak iklan digital tersebar di Asia Tenggara.',
      'Tim audit meminta vendor due diligence untuk tier 1 north china sebelum kontrak.',
      'Kebutuhan sistem pengawasan video untuk area gudang mencakup NVR dan kamera.',
      'Perangkat keras berupa network video recorder kelas enterprise terlampir.',
      'Laporan analisis risiko terhadap rantai pasok vendor pertahanan China 2026 tersedia.',
      '',
    ].join('\n'),
  );
  return root;
}

interface Json {
  [k: string]: unknown;
}

// ── Helper panggilan rute ────────────────────────────────────────────────────
// Modul rute dibaca ulang HANYA saat DATABASE_URL berganti (pool pg & konstanta
// modul lain dievaluasi saat import). Singleton Prisma disimpan di globalThis —
// dibersihkan agar klien dibangun ulang dengan connection string baru.
let lastUrl: string | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteMod = { GET: (req: Request) => Promise<Response> };
let routeMod: RouteMod | null = null;

async function freshGet(params: string): Promise<{ status: number; json: Json }> {
  if (lastUrl !== process.env.DATABASE_URL || !routeMod) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).prisma = undefined;
    vi.resetModules();
    routeMod = (await import('../src/app/api/information-library/route')) as RouteMod;
    lastUrl = process.env.DATABASE_URL ?? null;
  }
  const res = await routeMod.GET(
    new Request(`http://local/api/information-library?${params}`),
  );
  const json = res.status === 200 ? ((await res.json()) as Json) : {};
  return { status: res.status, json };
}

const savedEnv = { ...process.env };

describe.skipIf(!envReady)(
  'ILFIX F1-5 lapisan baca IlSearchDoc (DB uji ilfix_uji)',
  () => {
    let wsRoot = '';
    beforeAll(() => {
      wsRoot = makeFixtureWs('ilfix-f15-');
      process.env.DATABASE_URL = dbUrl(BASE_URL!, 'ilfix_uji');
      process.env.SHARED_WORKSPACE = wsRoot;
    });
    afterAll(() => {
      if (wsRoot) fs.rmSync(wsRoot, { recursive: true, force: true });
      process.env = { ...savedEnv };
      lastUrl = null;
      routeMod = null;
    });

    it(
      '(a) 8 kueri golden mengembalikan >=1 hasil (FR1 end-to-end)',
      async () => {
        const zero: string[] = [];
        for (const q of GOLDEN_QUERIES) {
          const { status, json } = await freshGet('scope=workspace&q=' + encodeURIComponent(q));
          expect(status).toBe(200);
          if (!Array.isArray(json.entries) || json.entries.length < 1) zero.push(q);
        }
        expect(zero, 'kueri golden tanpa hasil: ' + zero.join(' || ')).toEqual([]);
      },
      120_000,
    );

    it(
      '(b) bentuk respons jalur kandidat identik dengan jalur browse lama',
      async () => {
        const browse = await freshGet('scope=workspace');
        expect(browse.status).toBe(200);
        const search = await freshGet('q=' + encodeURIComponent(LIKE_PHRASE));
        expect(search.status).toBe(200);
        for (const k of RESP_KEYS) {
          expect(browse.json).toHaveProperty(k);
          expect(search.json).toHaveProperty(k);
        }
        expect(Object.keys(search.json).sort()).toEqual(Object.keys(browse.json).sort());
        const e = (search.json.entries as Record<string, unknown>[])[0];
        for (const k of [
          'id', 'path', 'type', 'title', 'status', 'domain',
          'project', 'body', 'updatedAt', 'source',
        ])
          expect(e).toHaveProperty(k);
      },
      60_000,
    );

    it(
      '(d) token kosong (q<3 char, simbol-saja) -> fallback LIKE lama, 200+bentuk sama',
      async () => {
        // "di" substring sah dari isi fixture ("di Shenzhen", "di CIDEX") -> LIKE lama menemukan
        const short = await freshGet('scope=workspace&q=di');
        expect(short.status).toBe(200);
        for (const k of RESP_KEYS) expect(short.json).toHaveProperty(k);
        expect((short.json.entries as unknown[]).length).toBeGreaterThan(0);
        const sym = await freshGet('scope=workspace&q=' + encodeURIComponent('##@@'));
        expect(sym.status).toBe(200);
        for (const k of RESP_KEYS) expect(sym.json).toHaveProperty(k);
      },
      60_000,
    );

    it(
      '(e1) injeksi tsquery (& | ! : kutip) -> 200, bentuk utuh, tanpa exception',
      async () => {
        const nasty = [
          "vendor' & | ! : \" OR 1=1--",
          'power & supply | ! : <>',
          '!:*& | token panjang sekali',
        ];
        for (const q of nasty) {
          const { status, json } = await freshGet('scope=workspace&q=' + encodeURIComponent(q));
          expect(status, 'q=' + q).toBe(200);
          for (const k of RESP_KEYS) expect(json).toHaveProperty(k);
        }
      },
      60_000,
    );
  },
);

describe.skipIf(!envReady)(
  'ILFIX F1-5 fallback penuh (indeks-kosong & tabel-tak-ada) -> LIKE lama',
  () => {
    let wsRoot = '';
    beforeAll(() => {
      wsRoot = makeFixtureWs('ilfix-f15-fb-');
      process.env.SHARED_WORKSPACE = wsRoot;
    });
    afterAll(() => {
      if (wsRoot) fs.rmSync(wsRoot, { recursive: true, force: true });
      process.env = { ...savedEnv };
      lastUrl = null;
      routeMod = null;
    });

    it(
      '(c1) indeks kosong (DB postgres: IlSearchDoc ada, 0 baris) -> 200 + entri LIKE lama',
      async () => {
        process.env.DATABASE_URL = dbUrl(BASE_URL!, 'postgres');
        const { status, json } = await freshGet(
          'scope=workspace&q=' + encodeURIComponent(LIKE_PHRASE),
        );
        expect(status).toBe(200);
        for (const k of RESP_KEYS) expect(json).toHaveProperty(k);
        expect((json.entries as unknown[]).length).toBeGreaterThan(0);
      },
      60_000,
    );

    it(
      '(c2) tabel tak ada (DB jira_clone: tanpa IlSearchDoc) -> 200 + entri LIKE lama',
      async () => {
        process.env.DATABASE_URL = dbUrl(BASE_URL!, 'jira_clone');
        const { status, json } = await freshGet(
          'scope=workspace&q=' + encodeURIComponent(LIKE_PHRASE),
        );
        expect(status).toBe(200);
        for (const k of RESP_KEYS) expect(json).toHaveProperty(k);
        expect((json.entries as unknown[]).length).toBeGreaterThan(0);
      },
      60_000,
    );
  },
);

// ── F1-7 (D-10b): paritas recall scope wiki untuk token高频 ─────────────────
// Verdict F1 CHECK 7 (M-1): pada korpus nyata, LIKE-lama menemukan 549 baris wiki
// utk 'vendor' sementara gabungan kandidat unik tercap 200/kueri hanya 190 — klaim
// DIFF-NOTE "tidak pernah lebih sedikit dari LIKE" SALAH utk scope wiki karena
// hidrasi wiki hanya menyaring dgn himpunan id indeks + tag eksak (tanpa fallback
// token seperti jalur workspace :320). Tes ini meniru kondisi itu di DB uji:
// seed 550 baris HermesMemory (di atas gabungan cap FTS 200 + trgm 200) yang TIDAK
// ada di mirror IlSearchDoc — lapisan tanpa fallback token akan membuang semuanya
// (MERAH), lapisan tertambal menemukannya lewat token in-memory (HIJAU).
// Baseline pembanding dihitung INDEPENDEN lewat SQL LIKE mentah (bukan lewat rute),
// sesuai predikat LIKE lama route.ts: title/body contains + tags-has.
describe.skipIf(!envReady)(
  'ILFIX F1-7 paritas recall scope wiki (token高频 vendor, DB uji ilfix_uji)',
  () => {
    const SEED_N = 550; // > gabungan cap kandidat (200+200) => tanpa fallback PASTI kalah dari LIKE
    const TOKEN = 'vendor';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let seedPool: any = null;

    beforeAll(async () => {
      process.env.DATABASE_URL = dbUrl(BASE_URL!, 'ilfix_uji');
      seedPool = new (req('pg')).Pool({
        connectionString: dbUrl(BASE_URL!, 'ilfix_uji'),
        connectionTimeoutMillis: 3000,
      });
      // Bersihkan residu giliran sebelumnya sebelum mengukur.
      await seedPool.query(`DELETE FROM "HermesMemory" WHERE id LIKE 'f17v-%'`);
      await seedPool.query(
        `INSERT INTO "HermesMemory"
           (id, path, type, title, status, tags, links, body, "updatedAt", "syncedAt")
         SELECT 'f17v-' || g,
                'f17/vendor-' || g || '.md',
                'fact',
                'Profil vendor uji F1-7 nomor ' || g,
                'active',
                '{}', '{}',
                'Baris seed paritas F1-7: entri wiki menyebut vendor ke-' || g || '.',
                now(), now()
           FROM generate_series(1, $1) g`,
        [SEED_N],
      );
    });
    afterAll(async () => {
      if (seedPool) {
        await seedPool.query(`DELETE FROM "HermesMemory" WHERE id LIKE 'f17v-%'`);
        await seedPool.end();
        seedPool = null;
      }
      lastUrl = null;
      routeMod = null;
    });

    it(
      '(f17-a) scope=wiki token高频: hasil lapisan baru >= hasil LIKE-lama (paritas)',
      async () => {
        // Baseline LIKE-lama — predikat verbatim jalur lama, dihitung di luar rute.
        const base = await seedPool.query(
          `select count(*)::int n from "HermesMemory"
            where title ILIKE '%'||$1||'%' or body ILIKE '%'||$1||'%' or $1 = any(tags)`,
          [TOKEN],
        );
        const likeCount = Number(base.rows[0].n);
        expect(likeCount, 'sanity: seed harus terlihat predikat LIKE').toBe(SEED_N);
        const { status, json } = await freshGet(
          'scope=wiki&q=' + encodeURIComponent(TOKEN),
        );
        expect(status).toBe(200);
        const got = (json.entries as unknown[]).length;
        expect(
          got,
          `gap recall M-1: lapisan kandidat ${got} < LIKE-lama ${likeCount}`,
        ).toBeGreaterThanOrEqual(likeCount);
      },
      120_000,
    );
  },
);

describe('ILFIX F1-5 gerbang statis: nol concat SQL (tanpa DB)', () => {
  it('(e2) fungsi SQL memakai parameter $n, nol interpolasi ${}', () => {
    const src = fs.readFileSync(
      path.join(ROOT, 'src/app/api/information-library/route.ts'),
      'utf8',
    );
    const blocks = src.match(/pool\.query\([\s\S]*?\n\s*\)/g) ?? [];
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    for (const b of blocks) {
      expect(b, 'interpolasi ${} ditemukan dalam blok pool.query').not.toContain('${');
    }
    expect(src).toContain("websearch_to_tsquery('simple', $1)");
    expect(src).toContain("ILIKE '%' || $1 || '%'");
  });
});
