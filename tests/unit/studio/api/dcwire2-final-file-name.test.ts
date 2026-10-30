// DC-WIRE2 (D-389, register 05 §10 FN-03, AM-09): `finalFileName` WAJIB dan selalu string
// untuk setiap baris berkas keluaran (pemilik dokumen + artefak); baris revisi tanpa relasi
// pemilik dimuat = galat pemrograman (TypeError + log persisten), bukan medan absen.
import { describe, expect, it } from 'vitest';
import type { StudioArtifact } from '@prisma/client';
import { FINAL_FILENAME_PATTERN } from '@/lib/studio/contract/env';
import type { OutputFileDto } from '@/lib/studio/contract/types/api';
import { finalFileNameOfRow, setStorageLogSink, toOutputFileDto, type OutputFileRow } from '@/lib/studio/services/storage';
import { toArtifactListItem } from '@/app/api/studio/artifacts/_lib/dto';

const C51 = new RegExp(FINAL_FILENAME_PATTERN);
const SHA = 'ab12cd34' + 'e'.repeat(56);
const CREATED = new Date('2026-10-30T08:15:42.900Z');

function row(over: Partial<OutputFileRow> = {}): OutputFileRow {
  return {
    id: 'of1',
    documentId: 'd1',
    revisionId: 'r1',
    artifactId: null,
    renderJobId: null,
    format: 'PDF',
    role: 'PRIMARY',
    figureLabel: null,
    relPath: 'docs/x/rev-3/a.pdf',
    fileName: 'a.pdf',
    bytes: 1,
    sha256: SHA,
    mime: 'application/pdf',
    lintVerdict: 'PASS',
    createdAt: CREATED,
    scopeKind: 'DOCUMENT',
    scopeKey: null,
    draft: false,
    ...over,
  } as OutputFileRow;
}

const docOwner = { document: { docNumber: '014/GSP/LAP/X/2026', contractKind: 'agentWorkReport' }, revision: { revisionNo: 3 } };

describe('DC-WIRE2 AM-09: finalFileName selalu string', () => {
  it('pemilik dokumen: nama dari docNumber + revisi, cocok C51', () => {
    const dto: OutputFileDto = toOutputFileDto(row(docOwner));
    const name: string = dto.finalFileName; // tipe kontrak WAJIB: string (tanpa `!`)
    expect(name).toBe('014-GSP-LAP-X-2026_rev3_20261030T081542Z_ab12cd34.pdf');
    expect(C51.test(name)).toBe(true);
  });

  it('artefak: prefiks ART- dan rev0 (FN-03), tanpa relasi pemilik', () => {
    const name = finalFileNameOfRow(row({ documentId: null, revisionId: null, artifactId: 'cm_art-7', format: 'PNG', mime: 'image/png' }));
    expect(name).toBe('ART-cmart-7_rev0_20261030T081542Z_ab12cd34.png');
    expect(C51.test(name)).toBe(true);
  });

  it('R09 galeri: setiap outputs[] artefak membawa finalFileName string', () => {
    const art = { id: 'cm_9', kind: 'CHART', spec: { kind: 'P-01' } } as unknown as StudioArtifact;
    const outputs = [
      row({ id: 'o1', documentId: null, revisionId: null, artifactId: 'cm_9', format: 'SVG', mime: 'image/svg+xml' }),
      row({ id: 'o2', documentId: null, revisionId: null, artifactId: 'cm_9', format: 'PNG', mime: 'image/png' }),
    ];
    const item = toArtifactListItem({ ...art, createdAt: CREATED, updatedAt: CREATED, outputs } as never);
    expect(item.outputs).toHaveLength(2);
    for (const o of item.outputs) {
      expect(typeof o.finalFileName).toBe('string');
      expect(o.finalFileName.startsWith('ART-cm9_rev0_')).toBe(true);
      expect(C51.test(o.finalFileName)).toBe(true);
    }
  });

  it('baris revisi tanpa OUTPUT_FILE_OWNER_INCLUDE -> TypeError + log error OUTPUT_FILE_OWNER_MISSING', () => {
    const logged: Array<Record<string, unknown>> = [];
    setStorageLogSink((e) => {
      logged.push(e as unknown as Record<string, unknown>);
    });
    try {
      expect(() => toOutputFileDto(row())).toThrow(/OUTPUT_FILE_OWNER_INCLUDE/);
      expect(() => finalFileNameOfRow(row({ document: docOwner.document }))).toThrow(TypeError);
    } finally {
      setStorageLogSink(null);
    }
    expect(logged.map((e) => [e.level, e.code])).toEqual([
      ['error', 'OUTPUT_FILE_OWNER_MISSING'],
      ['error', 'OUTPUT_FILE_OWNER_MISSING'],
    ]);
    expect((logged[0].context as Record<string, unknown>).id).toBe('of1');
  });

  it('baris tanpa revisionId maupun artifactId (melanggar M08) -> TypeError', () => {
    setStorageLogSink(() => undefined);
    try {
      expect(() => finalFileNameOfRow(row({ revisionId: null, ...docOwner }))).toThrow(/neither revisionId nor artifactId/);
    } finally {
      setStorageLogSink(null);
    }
  });
});
