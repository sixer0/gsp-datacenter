// DC-35 (BA-35, BA-03) — golden generator md2contract (I64, register 05 §16) atas 3 laporan kerja
// nyata di workspace Hermes (DIBACA SAJA). Golden = sha256 keluaran (bentuk stdout CLI:
// JSON 2 spasi + "\n") + ringkasan record/bab/peringatan, BUKAN salinan isi. `--reported-at` tetap
// (laporan tidak memberi waktu ber-zona, KD-42); laporan verifier tanpa kunci Status butuh `--status`.
// Masukan dipin dengan sha256-nya: bila berkas Hermes berubah, uji pin gagal dengan pesan jelas
// (golden harus dibangkitkan ulang), bukan diam-diam lolos. Berkas tidak ada -> skip.
// Judul bab dan baris peringatan diperiksa terhadap judul `##` sumber (grep sumber, independen).
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ContractImportError, markdownToContract, type ContractImportOptions } from '@/lib/studio/services/import/contract';

const HERMES_DOCS = 'C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs';
const ROOT = path.resolve(__dirname, '../../../..');
const TSX = path.join(ROOT, 'node_modules/tsx/dist/cli.mjs');
const CLI = path.join(ROOT, 'scripts/studio/md2contract.ts');
const REPORTED_AT = '2026-10-30T12:00+07:00';

const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const stdoutForm = (doc: unknown) => `${JSON.stringify(doc, null, 2)}\n`;

interface Golden {
  name: string;
  rel: string;
  /** Opsi selain kind/reportedAt (mis. --status untuk laporan tanpa kunci Status). */
  extra: Partial<ContractImportOptions>;
  inputSha256: string;
  outputSha256: string;
  record: Record<string, unknown>;
  chapters: Array<[string, string]>;
  warnings: Array<[string, number]>;
  missingChapters: string[];
  /** Judul `##` sumber tanpa penomoran awal (grep `^## ` atas berkas). */
  headings: string[];
  /** Potongan teks badan yang harus tetap ada (tidak ada teks yang dibuang). */
  keptText: string[];
  /** Token sumber (>= 6 alfanumerik) yang boleh hilang: hanya kunci kepala yang dipetakan ke record. */
  consumed: string[];
}

const GOLDENS: Golden[] = [
  {
    name: 'K2 LAPORAN-SELESAI prompt-manual t_ac989baa',
    rel: '2026-10-04-prompt-manual/_work/t_ac989baa/LAPORAN-SELESAI.md',
    extra: {},
    inputSha256: '04497341b590a09b49f4477f815d1c73a4df0041393258c74b9060973b0898f7',
    outputSha256: '5cad8776e88827594c9d078c44b60e2d479ddc18e7f759a3f5fb40dafb571d80',
    record: { type: 'contractRecord', status: 'complete', reportedAt: REPORTED_AT, cardIds: ['t_ac989baa'] },
    chapters: [
      ['3', 'Bukti'],
      ['6', 'Pemetaan kontrak'],
      ['7', 'Field dinamis placeholder (6 basis, 11 kemunculan; refresh Step 13)'],
      ['8', 'Healing loop (satu loop, sesuai batas VERIF-SHORT)'],
      ['9', 'Catatan distribusi skill (AWARENESS)'],
    ],
    warnings: [
      ['CONTRACT_HEADING_UNMAPPED', 29],
      ['CONTRACT_HEADING_UNMAPPED', 38],
      ['CONTRACT_HEADING_UNMAPPED', 47],
      ['CONTRACT_HEADING_UNMAPPED', 51],
    ],
    missingChapters: ['1', '2', '4', '5'],
    headings: [
      'Artefak',
      'Gerbang (diukur pada state akhir disk, bukan ingatan)',
      'Pemetaan kontrak',
      'Field dinamis placeholder (6 basis, 11 kemunculan; refresh Step 13)',
      'Healing loop (satu loop, sesuai batas VERIF-SHORT)',
      'Catatan distribusi skill (AWARENESS)',
    ],
    keptText: ['92a60eca7944055b', 'CHECK 7 sub-bab 21.1..21.11 lengkap 11/11'],
    consumed: ['STATUS'],
  },
  {
    name: 'K6 verifier report game-success-formula GSF-20',
    rel: '2026-10-12-game-success-formula/verification/01_verifier_report.md',
    extra: { status: 'needs-review' },
    inputSha256: '5852de3eee615b0fbe946b2c5f2d8310df23a48ca00ee9e5c83efaeaab899fc3',
    outputSha256: 'f35b10bd92d34990c2c386c4d4df367c0422c828837591906f93649d1ea7007e',
    record: {
      type: 'contractRecord',
      status: 'needs-review',
      verdict: 'FAIL',
      reportedAt: REPORTED_AT,
      cardIds: ['t_40cefa7e', 't_e2acd3ae', 't_d9804756', 't_d371afd9'],
    },
    chapters: [
      ['1', 'Ringkasan'],
      ['6', 'VERDICT PER KRITERIA S4 (G-1..G-11) + beban-rilis SPK-002'],
      ['7', 'CACAT AKURASI (akar + lokasi + reproduksi, untuk kartu fix presisi)'],
      ['8', 'Uji G-5 (rincian, karena kartu menagih jumlah pertanyaan klarifikasi)'],
      ['9', 'Sampel ber-seed dan rehitung populasi kunci (bukti CHECK 12 sisi PASS-nya)'],
      ['10', 'Berkas bukti yang dicek ada di disk (ukur byte, bukan klaim)'],
      ['11', 'Batas verifikasi ini (jujur soal yang TIDAK dikerjakan)'],
      ['12', 'Short check kartu ini (3 langkah)'],
    ],
    warnings: [
      ['CONTRACT_FIELD_UNMAPPED', 3],
      ['CONTRACT_FIELD_UNMAPPED', 4],
      ['CONTRACT_FIELD_UNMAPPED', 7],
      ['CONTRACT_HEADING_UNMAPPED', 10],
      ['CONTRACT_HEADING_UNMAPPED', 32],
      ['CONTRACT_HEADING_UNMAPPED', 50],
      ['CONTRACT_HEADING_UNMAPPED', 60],
      ['CONTRACT_HEADING_UNMAPPED', 65],
      ['CONTRACT_HEADING_UNMAPPED', 69],
      ['CONTRACT_HEADING_UNMAPPED', 76],
    ],
    missingChapters: ['2', '3', '4', '5'],
    headings: [
      'VERDICT PER KRITERIA S4 (G-1..G-11) + beban-rilis SPK-002',
      'CACAT AKURASI (akar + lokasi + reproduksi, untuk kartu fix presisi)',
      'Uji G-5 (rincian, karena kartu menagih jumlah pertanyaan klarifikasi)',
      'Sampel ber-seed dan rehitung populasi kunci (bukti CHECK 12 sisi PASS-nya)',
      'Berkas bukti yang dicek ada di disk (ukur byte, bukan klaim)',
      'Batas verifikasi ini (jujur soal yang TIDAK dikerjakan)',
      'Short check kartu ini (3 langkah)',
    ],
    keptText: ['GAME-SUCCFORMULA-1012', 'satu FAIL pada CHECK 12 membatalkan PASS menyeluruh'],
    consumed: [],
  },
  {
    name: 'R3 laporan tracero-dispatcher-1010',
    rel: '2026-10-10-tracero-dispatcher-1010/laporan.md',
    extra: {},
    inputSha256: '746f79e265182bc02a5b6a086f6b140fe884794240c9d093016cef6e51f9296c',
    outputSha256: 'eff5a14aa5e7483e2a04994bb30723b10e8689db4cb1fb30099b22526e59ba19',
    record: { type: 'contractRecord', status: 'complete', reportedAt: REPORTED_AT, cardIds: ['t_57ff71c4'] },
    chapters: [
      ['1', 'Ringkasan'],
      ['4', 'Isu terbuka'],
      ['6', 'Ringkasan vonis'],
      ['7', 'Bukti papan per kasus (ukur ulang dari kanban.db)'],
      ['8', 'Diagnosis akar kernel (dengan rujukan baris)'],
      ['9', 'Uji merah-hijau'],
      ['10', 'Rekomendasi patch (spesifik, siap implementasi)'],
      ['11', 'File artefak'],
    ],
    warnings: [
      ['CONTRACT_HEADING_UNMAPPED', 15],
      ['CONTRACT_HEADING_UNMAPPED', 41],
      ['CONTRACT_HEADING_UNMAPPED', 104],
      ['CONTRACT_HEADING_UNMAPPED', 155],
      ['CONTRACT_HEADING_UNMAPPED', 186],
      ['CONTRACT_HEADING_UNMAPPED', 243],
    ],
    missingChapters: ['2', '3', '5'],
    headings: [
      'Ringkasan vonis',
      'Bukti papan per kasus (ukur ulang dari kanban.db)',
      'Diagnosis akar kernel (dengan rujukan baris)',
      'Uji merah-hijau',
      'Rekomendasi patch (spesifik, siap implementasi)',
      'Batas klaim',
      'File artefak',
    ],
    keptText: ['Tiket R3 dari AUDIT-DURASI-1010', 'AKAR TERKONFIRMASI'],
    consumed: [],
  },
];

function runCli(args: string[]): { code: number | null; out: Buffer; err: string } {
  const r = spawnSync(process.execPath, [TSX, CLI, ...args], { cwd: ROOT, timeout: 90_000 });
  return { code: r.status, out: r.stdout, err: r.stderr.toString('utf8') };
}
function cliArgs(file: string, g: Golden): string[] {
  return [file, '--kind', 'agentWorkReport', '--reported-at', REPORTED_AT, ...(g.extra.status ? ['--status', g.extra.status] : [])];
}

for (const g of GOLDENS) {
  const file = path.join(HERMES_DOCS, g.rel);
  const present = fs.existsSync(file);

  describe.skipIf(!present)(`DC-35 golden md2contract: ${g.name}`, () => {
    const source = present ? fs.readFileSync(file, 'utf8') : '';
    const opts: ContractImportOptions = { kind: 'agentWorkReport', reportedAt: REPORTED_AT, ...g.extra };
    const result = () => markdownToContract(source, opts);

    it('masukan = berkas yang dipin (sha256); bila berubah, golden harus dibangkitkan ulang', () => {
      expect(sha256(source), `masukan ${g.rel} berubah sejak golden dipin`).toBe(g.inputSha256);
    });

    it('sha256 keluaran = golden; dua jalan byte-identik (tanpa cap waktu)', () => {
      const a = stdoutForm(result().doc);
      expect(sha256(a)).toBe(g.outputSha256);
      expect(stdoutForm(result().doc)).toBe(a);
    });

    it('ringkasan: record, bab (kunci + judul), peringatan (kode + baris), bab wajib kosong, valid', () => {
      const r = result();
      expect(r.doc.$schema).toBe('studio.doc/v2');
      expect(r.doc.template).toEqual({ slug: 'laporan-kerja-agen' });
      expect(r.doc.sections!.record).toEqual(g.record);
      const chapters = (r.doc.sections!.content as { chapters: Array<{ key: string; title: { text: string } }> }).chapters;
      expect(chapters.map((c) => [c.key, c.title.text])).toEqual(g.chapters);
      expect(r.report.generator).toBe('md2contract/v1');
      expect(r.report.warnings.map((w) => [w.code, w.line])).toEqual(g.warnings);
      expect((r.report.mapping as { missingChapters: string[] }).missingChapters).toEqual(g.missingChapters);
      expect(r.validation).toEqual({ valid: true, issues: [] });
      expect(r.doc.sections!.references).toBeUndefined();
    });

    it('baris peringatan CW-03 menunjuk judul `##` di sumber (nomor baris 1-based)', () => {
      const lines = source.replace(/\r\n/g, '\n').split('\n');
      for (const [code, line] of g.warnings) {
        if (code === 'CONTRACT_HEADING_UNMAPPED') expect(lines[line - 1]).toMatch(/^## /);
      }
    });

    it('teks tidak dibuang: setiap judul `##` sumber dan potongan badan ada di dokumen', () => {
      const json = JSON.stringify(result().doc);
      for (const h of g.headings) expect(json, `judul "${h}"`).toContain(h);
      for (const t of g.keptText) expect(json, `teks "${t}"`).toContain(t);
    });

    it('teks tidak dibuang (menyeluruh): setiap token sumber >= 6 alfanumerik ada di dokumen, kecuali kunci kepala yang dipetakan', () => {
      const json = JSON.stringify(result().doc);
      const tokens = [...new Set(source.match(/[A-Za-z0-9_]{6,}/g) ?? [])];
      expect(tokens.length).toBeGreaterThan(100);
      expect(tokens.filter((t) => !json.includes(t))).toEqual(g.consumed);
    });

    it('CLI --reported-at tetap: exit 0, stdout sha256 = golden', () => {
      const r = runCli(cliArgs(file, g));
      expect(r.code, r.err).toBe(0);
      expect(sha256(r.out)).toBe(g.outputSha256);
    });
  });
}

const VERIFIER = GOLDENS[1];
describe.skipIf(!fs.existsSync(path.join(HERMES_DOCS, VERIFIER.rel)))('DC-35 golden: KD-42 status tidak ditebak (laporan verifier)', () => {
  const file = path.join(HERMES_DOCS, VERIFIER.rel);

  it('tanpa status -> ContractImportError MD2CONTRACT_REQUIRED_MISSING [status], exit 3, peringatan tetap terlapor', () => {
    let err: unknown;
    try {
      markdownToContract(fs.readFileSync(file, 'utf8'), { kind: 'agentWorkReport', reportedAt: REPORTED_AT });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ContractImportError);
    const e = err as ContractImportError;
    expect([e.code, e.exitCode, [...e.missing]]).toEqual(['MD2CONTRACT_REQUIRED_MISSING', 3, ['status']]);
    expect(e.report?.warnings.map((w) => [w.code, w.line])).toEqual(VERIFIER.warnings);
  });

  it('CLI tanpa --status -> exit 3, stdout kosong', () => {
    const r = runCli([file, '--kind', 'agentWorkReport', '--reported-at', REPORTED_AT]);
    expect(r.code).toBe(3);
    expect(r.out.length).toBe(0);
    expect(r.err).toContain('--status');
  });
});
