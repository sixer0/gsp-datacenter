// UI-02 (audit UI-01 UA-M03, UA-M04, UA-M06, UA-M07, UA-M12): label riwayat terdeduplikasi,
// nama tampilan agen/seed, deskripsi templat awam, catatan format berkas.
import { describe, expect, it } from 'vitest';
import { changedLabel, fileFormatsNote, isAutoChangeWhy } from '@/components/studio/document-viewer/doc-model';
import { actorLabel, agentDisplayName, templateDescription } from '@/components/studio/shared/labels';
import { creatorLabel } from '@/components/studio/template-editor/model';

const SLOTS = new Map([
  ['record', 'Catatan Laporan'],
  ['content', 'Isi Laporan'],
  ['references', 'Referensi'],
]);

describe('changedLabel: deduplikasi label setelah pemetaan (UA-M03)', () => {
  it('beberapa medan satu bagian -> satu label (bukan "Catatan Laporan, Catatan Laporan")', () => {
    expect(changedLabel(['F:record/title', 'F:record/agent', 'F:record/period'], SLOTS)).toBe('Catatan Laporan');
  });

  it('kasus audit: dua medan bagian sama + satu bab -> dua label, tanpa "dan 1 lainnya"', () => {
    expect(changedLabel(['F:record/title', 'F:record/agent', '1'], SLOTS)).toBe('Catatan Laporan, Bab 1');
  });

  it('lebih dari dua label unik -> dipotong 2 + "dan n lainnya" dihitung dari label unik', () => {
    const out = changedLabel(['F:record/a', 'F:record/b', '1', '2', 'F:references/x'], SLOTS);
    expect(out).toBe('Catatan Laporan, Bab 1 dan 2 lainnya');
  });

  it('perilaku lama tetap: kosong -> Dokumen; satu nomor -> label nomor', () => {
    expect(changedLabel([], SLOTS)).toBe('Dokumen');
    expect(changedLabel(['3.2.1'], SLOTS)).toBe('Paragraf 3.2.1');
  });
});

describe('nama tampilan pelaku (UA-M06)', () => {
  it('prefiks runtime hermes- dibuang dan profil GSP dibaca sebagai nama', () => {
    expect(agentDisplayName('hermes-gsp-master01')).toBe('GSP Master 01');
    expect(agentDisplayName('gsp-worker-fast')).toBe('GSP Worker Fast');
    expect(actorLabel('agent:hermes-gsp-master01')).toBe('Agen GSP Master 01');
  });

  it('ID agen lain tetap apa adanya (kontrak D-297/D-313 tidak berubah)', () => {
    expect(actorLabel('agent:analis-01')).toBe('Agen analis-01');
    expect(actorLabel('user:budi')).toBe('budi');
    expect(actorLabel(null)).toBe('Sistem');
  });

  it('seed-studio -> "Sistem (bawaan)" di pelaku dan pembuat templat', () => {
    expect(actorLabel('seed-studio')).toBe('Sistem (bawaan)');
    expect(creatorLabel('seed-studio')).toBe('Sistem (bawaan)');
    expect(creatorLabel('user:budi')).toBe('budi');
    expect(creatorLabel(null)).toBe('-');
  });
});

describe('deskripsi templat awam (UA-M07)', () => {
  it('templat bawaan memakai satu kalimat awam tanpa jargon internal', () => {
    const raw = 'Profil DATUM-kanonik terkunci: default katalog manual DATUM GSP (673 parameter) + 25 parameter renderer kontrak.';
    const out = templateDescription('datum-kanonik', raw);
    expect(out).not.toMatch(/parameter|lint\.|P4S-|CK-01|renderer/);
    expect(out.length).toBeGreaterThan(10);
    expect(templateDescription('laporan-kerja-agen', 'x')).not.toMatch(/agentWorkReport|CK-01|LAP/);
  });

  it('templat pengguna memakai deskripsinya sendiri', () => {
    expect(templateDescription('templat-saya', '  Catatan rapat mingguan  ')).toBe('Catatan rapat mingguan');
    expect(templateDescription('templat-saya', null)).toBe('');
  });
});

describe('riwayat ringkas dan berkas (UA-M04, UA-M12)', () => {
  it('alasan bawaan otomatis dikenali; alasan manusia tidak', () => {
    expect(isAutoChangeWhy('Kiriman agen (otomatis)')).toBe(true);
    expect(isAutoChangeWhy('Kiriman ingest (otomatis)')).toBe(true);
    expect(isAutoChangeWhy('Perbaikan salah ketik di bab 2')).toBe(false);
    expect(isAutoChangeWhy(null)).toBe(false);
  });

  it('catatan format menyebut format yang ada dan yang belum', () => {
    expect(fileFormatsNote(['HTML'])).toBe('HTML tersedia; PDF/Word belum ada');
    expect(fileFormatsNote(['DOCX', 'HTML'])).toBe('Word, HTML tersedia; PDF belum ada');
    expect(fileFormatsNote(['PDF', 'DOCX', 'HTML'])).toBeNull();
    expect(fileFormatsNote(['SVG'])).toBeNull();
  });
});
