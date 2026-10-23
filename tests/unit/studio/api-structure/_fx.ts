// SR-45: fixture konten. Contoh E2 = blueprint 05 §2.5 (tanpa medan tampilan/parameter).
// PNG dibangkitkan acak per panggilan sehingga sha tidak pernah bentrok dengan aset nyata.
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { trackSha } from './_db';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** PNG sah (RGB 8-bit, piksel acak) atau PNG 1-bit abu-abu berdimensi besar (server hanya membaca header). */
export function makePng(w = 4, h = 4, mode: 'rgb' | 'bit1' = 'rgb'): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = mode === 'rgb' ? 8 : 1;
  ihdr[9] = mode === 'rgb' ? 2 : 0;
  const rowBytes = mode === 'rgb' ? w * 3 : Math.ceil(w / 8);
  const raw = Buffer.alloc((rowBytes + 1) * h);
  if (mode === 'rgb') {
    for (let y = 0; y < h; y++) crypto.randomFillSync(raw, y * (rowBytes + 1) + 1, rowBytes);
  } else {
    crypto.randomFillSync(raw, 1, Math.min(rowBytes, 16));
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  trackSha(sha256Hex(png));
  return png;
}

export function sha256Hex(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export const GIF_1X1 = Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

export const E2_TITLE = 'Laporan Survei Gardu Induk Cikupa';

/** Bab 3 contoh E2 (8 blok: 3.2.3 gambar, 3.3.2 tabel). */
export function e2Chapter(key = '3', variant = ''): Record<string, unknown> {
  return {
    key,
    title: { text: 'Analisis Kondisi Peralatan' },
    sections: [
      {
        title: { text: 'Metode Penilaian' },
        blocks: [
          { type: 'paragraph', text: 'Penilaian memakai skor kondisi 1 sampai 5 per peralatan.' },
          { type: 'paragraph', text: 'Skor diberikan dari inspeksi visual dan uji tahanan isolasi.' },
        ],
      },
      {
        title: { text: 'Kondisi Pemutus Tenaga' },
        blocks: [
          { type: 'paragraph', text: 'Tiga pemutus tenaga diperiksa pada 2026-10-20.' },
          { type: 'paragraph', text: `PMT-2 menunjukkan korosi pada terminal sisi beban.${variant}` },
          {
            type: 'image',
            asset: 'foto-pmt2',
            caption: { text: 'Korosi pada terminal PMT-2' },
            source: { text: 'Foto lapangan 2026-10-20', provenance: ['TERUKUR'] },
          },
          { type: 'paragraph', text: 'Korosi ini menurunkan tahanan kontak dan perlu pembersihan.' },
        ],
      },
      {
        title: { text: 'Ringkasan Skor' },
        blocks: [
          { type: 'paragraph', text: 'Tabel berikut merangkum skor kondisi.' },
          {
            type: 'table',
            caption: { text: 'Skor kondisi pemutus tenaga' },
            columns: [{ role: 'id' }, { role: 'numeral' }],
            rows: [
              { kind: 'header', cells: [{ text: 'Unit' }, { text: 'Skor' }] },
              { cells: [{ text: 'PMT-1' }, { text: '4' }] },
              { cells: [{ text: 'PMT-2' }, { text: '2' }] },
            ],
            source: { text: 'Inspeksi 2026-10-20', provenance: ['TERUKUR'] },
          },
        ],
      },
    ],
  };
}

/** Bab sederhana tanpa aset (satu section, dua paragraf). */
export function simpleChapter(key: string, text = `Isi bab ${key}`): Record<string, unknown> {
  return {
    key,
    title: { text: `Bab ${key} uji struktur` },
    sections: [
      {
        title: { text: `Bagian pertama bab ${key}` },
        blocks: [
          { type: 'paragraph', text: `${text}: pengukuran beban dilakukan pada jam puncak.` },
          { type: 'paragraph', text: `${text}: hasil pengukuran dicatat di lembar data lapangan.` },
        ],
      },
    ],
  };
}

export interface E2Opts {
  folder: string;
  docKey?: string;
  template?: string;
  chapterKey?: string;
  variant?: string;
  png?: Buffer;
  extra?: Record<string, unknown>;
}

/** Badan `studio.chapter/v2` E2 dengan aset base64 (sha dihitung server). */
export function e2Body(o: E2Opts): Record<string, unknown> {
  const png = o.png ?? makePng();
  return {
    $schema: 'studio.chapter/v2',
    target: { mission: { folder: o.folder, hermesTaskId: 'ht_sr45' }, docKey: o.docKey ?? 'laporan-survei' },
    template: { slug: o.template ?? 'datum-gsp' },
    meta: { title: E2_TITLE },
    chapter: e2Chapter(o.chapterKey ?? '3', o.variant ?? ''),
    assets: { 'foto-pmt2': { mime: 'image/png', dataBase64: png.toString('base64') } },
    ...(o.extra ?? {}),
  };
}

export function missionTarget(folder: string, docKey = 'laporan-survei'): Record<string, unknown> {
  return { mission: { folder }, docKey };
}

/** Kiriman bab ke dokumen baru di misi (template + judul) atau dokumen yang ada. */
export function chapterBody(target: Record<string, unknown>, chapter: Record<string, unknown>, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { $schema: 'studio.chapter/v2', target, chapter, ...extra };
}

export function createExtra(template = 'datum-gsp', title = 'Dokumen Uji Struktur SR-45'): Record<string, unknown> {
  return { template: { slug: template }, meta: { title } };
}

export const CONTROL_SHEET = {
  type: 'controlSheet',
  revisionHistory: [{ rev: 'A', date: '2026-10-23', what: 'Terbit pertama', by: 'Divisi Engineering' }],
  verificationChain: [{ layer: 'L1', role: 'Penyusun', name: 'Analis Uji' }],
};

export const SIGNATURE = {
  type: 'signatureBlock',
  roles: [
    { role: { text: 'Disusun' }, holder: { text: 'Analis Uji' } },
    { role: { text: 'Disetujui' }, holder: { text: 'Manajer Teknik' } },
  ],
};

export function slotBody(target: Record<string, unknown>, slot: string, payload: Record<string, unknown>, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { $schema: 'studio.slot/v2', target, slot, payload, ...extra };
}

export const CHANGE = { what: 'Perbarui isi uji', why: 'Uji SR-45', impact: 'Satu lingkup saja' };
