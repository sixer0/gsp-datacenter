// S71: injeksi cacat instrumen ke runner lint (engine/lint/scan runLint).
// Prinsip runner (runner.ts, A10/KT-13): cacat instrumen dilaporkan, bukan
// disembunyikan; status rilis PASS hanya bila cek yang berlaku benar-benar
// dijalankan. Uji ini memaksa modul scan (lewat tableGuards) dan modul
// struktur crash pada dokumen nyata, lalu memeriksa laporan.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runLint } from '@/lib/studio/engine/lint/scan';
import { canonicalTemplate, dataTable, makeDoc, snapshotOf, statuses } from './fixtures';

const fault = vi.hoisted(() => ({ scan: false, structure: false }));

vi.mock('@/lib/studio/engine/docx/tables', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/studio/engine/docx/tables')>();
  return {
    ...mod,
    tableGuards: (...args: Parameters<typeof mod.tableGuards>) => {
      if (fault.scan) throw new Error('cacat instrumen uji (scan)');
      return mod.tableGuards(...args);
    },
  };
});

vi.mock('@/lib/studio/engine/lint/structure', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/studio/engine/lint/structure')>();
  return {
    ...mod,
    lintStructure: (...args: Parameters<typeof mod.lintStructure>) => {
      if (fault.structure) throw new Error('cacat instrumen uji (structure)');
      return mod.lintStructure(...args);
    },
  };
});

beforeEach(() => {
  fault.scan = false;
  fault.structure = false;
});

// Dokumen TERBIT dengan pelanggaran penahan nyata (judul pertanyaan + G1).
const badDoc = () => makeDoc({ sectionTitle: 'Bagaimana cara memasang panel?', blocks: [dataTable({ badRow: true })] });

describe('runLint saat modul crash', () => {
  it('kontrol: tanpa cacat, dokumen bermasalah -> rilis FAIL', () => {
    const rep = runLint({ snapshot: snapshotOf(badDoc()), tpl: canonicalTemplate(), tier: 'TERBIT', stage: 'ingest' });
    expect(rep.releaseStatus).toBe('FAIL');
    expect(statuses(rep.checks, 'G1')).toContain('FAIL');
  });

  it('modul scan crash: cek scan dilaporkan NOT_RUN dengan galatnya dan runLint tidak melempar', () => {
    fault.scan = true;
    const rep = runLint({ snapshot: snapshotOf(badDoc()), tpl: canonicalTemplate(), tier: 'TERBIT', stage: 'ingest' });
    for (const id of ['G1', 'DATUM-04', 'N1']) {
      expect(statuses(rep.checks, id), id).toEqual(['NOT_RUN']);
      expect(rep.checks.find((c) => c.checkId === id)?.detail, id).toContain('cacat instrumen uji (scan)');
    }
  });

  // TEMUAN F-S71-1 (produksi, pemilik S44): runner.ts releaseStatusFor
  // mengembalikan PASS bila SATU cek berlaku saja berjalan, walau seluruh modul
  // scan dan struktur crash (G1/DATUM-04 tidak pernah dinilai). Ekspektasi di
  // bawah adalah perilaku yang diminta prinsip runner, bukan disesuaikan agar lulus.
  it('modul scan + struktur crash pada dokumen bermasalah -> status rilis TIDAK boleh PASS', () => {
    fault.scan = true;
    fault.structure = true;
    const rep = runLint({ snapshot: snapshotOf(badDoc()), tpl: canonicalTemplate(), tier: 'TERBIT', stage: 'ingest' });
    expect(statuses(rep.checks, 'G1')).toEqual(['NOT_RUN']);
    expect(statuses(rep.checks, 'DATUM-10')).toEqual(['NOT_RUN']);
    expect(rep.releaseStatus).not.toBe('PASS');
  });
});
