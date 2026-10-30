/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan kiriman JSON dinamis */
// FIX-S3 (D-342 S3): bentuk kiriman R20 `?shape=submission` lolos skema studio.chapter/v2 /
// studio.slot/v2 APA ADANYA, pid `id` utuh, baseRevisionNo = revisi yang dibaca. Murni (tanpa DB).
import { describe, expect, it } from 'vitest';
import { schemaIssues } from '@/app/api/studio/chapters/_shared/submit-kit';
import {
  CHAPTER_SUBMIT_TO,
  SLOT_SUBMIT_TO,
  SUBMISSION_EDIT_HINTS,
  toSubmissionShape,
} from '@/lib/studio/services/structure';

const DOC_ID = 'cmfixs3doc0000000000000001';

function chapterWithPids(): any {
  return {
    key: '4',
    id: 'bab-4',
    title: { text: 'Status Konstelasi' },
    intro: [{ type: 'paragraph', id: 'p-intro00001', text: 'Pengantar bab empat.' }],
    sections: [
      {
        id: 'p-sec0000001',
        title: { text: 'Rekaman' },
        blocks: [
          { type: 'paragraph', id: 'p-blk0000001', role: 'anchor', runs: [{ t: 'Durasi 93 menit.' }], rail: [{ kind: 'mark', mark: 'TERUKUR' }] },
          {
            type: 'table',
            id: 'p-tbl0000001',
            caption: { text: 'Ringkasan' },
            columns: [{ role: 'id' }, { role: 'numeral' }],
            rows: [
              { kind: 'header', cells: [{ text: 'Unit' }, { text: 'Skor' }] },
              { cells: [{ text: 'A' }, { text: '4' }] },
            ],
            source: { text: 'Inspeksi', provenance: ['TERUKUR'] },
          },
        ],
      },
    ],
  };
}

describe('FIX-S3 toSubmissionShape', () => {
  it('bab berpid -> badan studio.chapter/v2 lolos skema apa adanya, pid utuh, base = revisi dibaca', () => {
    const content = chapterWithPids();
    const shaped = toSubmissionShape({ documentId: DOC_ID, revisionNo: 9, slot: 'content', sectionType: 'chapter', content }, true, { agentId: 'hermes-uji' });
    expect(shaped.kind).toBe('chapter');
    expect(shaped.submitTo).toBe(CHAPTER_SUBMIT_TO);
    const sub: any = shaped.submission;
    expect(sub).toMatchObject({ $schema: 'studio.chapter/v2', agentId: 'hermes-uji', target: { documentId: DOC_ID }, slot: 'content', baseRevisionNo: 9 });
    expect(sub.chapter).toEqual(content);
    expect(sub.chapter.id).toBe('bab-4');
    expect(sub.chapter.sections[0].blocks[0].id).toBe('p-blk0000001');
    expect(schemaIssues('chapter', sub)).toEqual([]);
  });

  it('salinan dalam: mengubah submission tidak mengubah proyeksi', () => {
    const content = chapterWithPids();
    const shaped: any = toSubmissionShape({ documentId: DOC_ID, revisionNo: 2, slot: 'content', sectionType: 'chapter', content }, true);
    shaped.submission.chapter.sections[0].blocks[0].runs[0].t = 'diubah';
    expect(content.sections[0].blocks[0].runs[0].t).toBe('Durasi 93 menit.');
    expect('agentId' in shaped.submission).toBe(false);
  });

  it('slot tak-berulang -> badan studio.slot/v2 lolos skema', () => {
    const payload = {
      type: 'controlSheet',
      revisionHistory: [{ rev: 'A', date: '2026-10-23', what: 'Terbit pertama', by: 'Divisi Engineering' }],
      verificationChain: [{ layer: 'L1', role: 'Penyusun', name: 'Analis Uji' }],
    };
    const shaped: any = toSubmissionShape({ documentId: DOC_ID, revisionNo: 5, slot: 'controlSheet', sectionType: 'controlSheet', content: payload as any }, false);
    expect(shaped.kind).toBe('slot');
    expect(shaped.submitTo).toBe(SLOT_SUBMIT_TO);
    expect(shaped.submission).toMatchObject({ $schema: 'studio.slot/v2', target: { documentId: DOC_ID }, slot: 'controlSheet', baseRevisionNo: 5, payload });
    expect(schemaIssues('slot', shaped.submission)).toEqual([]);
  });

  it('slot kosong -> submission null', () => {
    const shaped = toSubmissionShape({ documentId: DOC_ID, revisionNo: 1, slot: 'appendicesX', sectionType: 'controlSheet', content: null }, false);
    expect(shaped.submission).toBeNull();
  });

  it('slot berulang tanpa chapter -> 422 SLOT_USE_CHAPTER_ENDPOINT berdaftar kunci bab', () => {
    const content: any = { type: 'chapter', chapters: [chapterWithPids(), { ...chapterWithPids(), key: '5', id: 'bab-5' }] };
    let err: any;
    try {
      toSubmissionShape({ documentId: DOC_ID, revisionNo: 3, slot: 'content', sectionType: 'chapter', content }, false);
    } catch (e) {
      err = e;
    }
    expect(err?.code).toBe('SLOT_USE_CHAPTER_ENDPOINT');
    expect(err.details).toEqual({ slotKey: 'content', use: CHAPTER_SUBMIT_TO, chapters: ['4', '5'] });
  });

  it('akar masalah Hermes S3: blok berisi `text` DAN `runs` ditolak skema; `id` sendiri tidak', () => {
    const shaped: any = toSubmissionShape({ documentId: DOC_ID, revisionNo: 9, slot: 'content', sectionType: 'chapter', content: chapterWithPids() }, true);
    const both = structuredClone(shaped.submission);
    both.chapter.sections[0].blocks[0].text = 'Durasi 94 menit.';
    expect(schemaIssues('chapter', both).map((i: any) => i.pointer)).toEqual(['/chapter/sections/0/blocks/0']);
    const fixed = structuredClone(both);
    delete fixed.chapter.sections[0].blocks[0].runs;
    expect(schemaIssues('chapter', fixed)).toEqual([]);
    expect(SUBMISSION_EDIT_HINTS.some((h) => h.includes('`text` ATAU `runs`'))).toBe(true);
  });
});
