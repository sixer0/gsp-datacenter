# SR-01 data-analyst: catatan baris

- Status: complete (kode tidak diubah).
- Keluaran: `docs/2026-10-22_doc_artifact_studio/masterplan/03_structural_sections_specs.md` (register nama + spesifikasi refaktor struktur).
- Masukan dibaca: blueprint 05 §0-§2 + baris SR-01..SR-61 + §4 (`05:18-695, 711-800, 979-996`); 01_specs (§1-§4, §6, §15); D-06, D-21, D-98, D-127, D-128, D-131, D-133, D-134, D-138..D-141 (`decisions.md:157,26,103,132,133,136,138,139,143-146`); `prisma/schema.prisma:610-926`; `src/lib/studio/contract/{enums,errors,address,env}.ts`, `types/{doc,common,model,params}.ts`, `schema/doc.schema.ts:104-163`; `params/{render,page,color-type,governance-language,apparatus}.ts`; `services/render/pure/{index,render}.ts`; `registry/lint.ts:155-173`; `benchmark/manual000/doc.json:1-300`; spec komposit `bm-fig-17..21`.
- Dua pesan controller ditangani: pembuatan dokumen baru (§7, contoh E0) dan ukuran kertas (KD-25, R-44..R-47, PC-01..PC-05, DV-01..DV-03, §13.4, PT-09, KC-7).

## Klaim berkas (RK-17)

Tindakan pertama (append klaim SR-01 ke `delegation_progress/file_claims.md`) **tidak berhasil**: agen ini hanya punya alat tulis-ulang berkas penuh; dua percobaan ditolak alat karena berkas berubah oleh penulis paralel di antara baca dan tulis (baris IP-43a, IP-42a, SR-34 bertambah). Menulis ulang berkas bersama itu berisiko menimpa klaim baris lain, jadi dihentikan. Controller diminta menambahkan:

```
SR-01 docs/2026-10-22_doc_artifact_studio/masterplan/03_structural_sections_specs.md
SR-01 docs/2026-10-22_doc_artifact_studio/delegation_progress/data_analyst_sr01.md
```

## Verifikasi (kolom Verification SR-01)

Perintah: Grep (ripgrep) dengan `output_mode: content`, `-o`, atas berkas spesifikasi, pola awal baris tabel `^\| (M1\d|MX0\d|E[2-4]\d|SID0\d|EC\d\d|SL-0\d|R-(3[89]|4\d|5[0-2])|PC-0\d|DV-0\d|LD-0\d|DF-\d\d|VF-\d\d|AD-\d\d|C(1[89]|2\d|3[0-3])[a-c]?|I(4[4-9]|5[0-3])|KD-\d\d|PT-0\d|RK-\d\d|KC-\d+|AC-\d+|T2-\d\d[a-c]?) \|`. Hasil (baris definisi):

| Register | Baris definisi | Jumlah | Tepat sekali |
|---|---|---|---|
| Model M10-M18 | 131-139 | 9 | ya (baris 207-215 = kolom "Tabel" di tabel nama indeks, merujuk model yang sama, bukan definisi) |
| Kolom tambahan MX01-MX07 | 151-157 | 7 (14 kolom SQL) | ya |
| Enum Prisma E26-E28 | 165-167 | 3 | ya |
| Enum TS E29-E43 | 1120-1134 | 15 | ya |
| Id skema SID01-SID06 | 280-285 | 6 | ya |
| Tipe T2-01..T2-49 | 295-364 | 49 | ya; T2-50..T2-54, T2-56..T2-59, T2-60/60a/60b di komentar kode (374-433, 692-701), T2-55 baris 761, T2-60c baris 878 (Grep `// T2-(5\d|60[a-c]?)`) |
| Kode galat EC01-EC24 | 792-815 | 24 | ya (44 lama + 24 = 68) |
| Route R01-R20 | 848-876 | 20 ID / 29 baris metode | ya; konvensi 01_specs §6.2: satu ID = satu path, metode ganda berbagi ID |
| Slot bawaan SL-01-SL-07 | 562-568 | 7 | ya |
| Param baru R-38-R-52 | 890-904 | 15 | ya |
| Perubahan PC-01-PC-07 | 910-916 | 7 | ya |
| DeriveFnId DV-01-DV-04 | 922-925 | 4 | ya |
| LintDef LD-01-LD-04 | 835-838 | 4 | ya |
| Medan tampilan DF-01-DF-62 | 465-531 | 62 (52 global + 10 lokasi) | ya |
| Medan v1 VF-01-VF-14 | 539-552 | 14 | ya |
| Adaptor AD-01-AD-16 | 984-999 | 16 | ya |
| Konstanta C18-C33c | 1093-1112 | 20 | ya |
| Antarmuka I44-I53 | 1057-1066 | 10 | ya |

Adaptor mencakup setiap medan tingkat atas v1: Grep `required: \[|^    (\$schema|template|mission|meta|register|overrides|front|parts|chapters|appendices|assets|outputs|x|agentId|document|render):` dan Read `src/lib/studio/contract/schema/doc.schema.ts:104-163` → properti dokumen baris 112-133 = 13 (`$schema`, `template`, `mission`, `meta`, `register`, `overrides`, `front`, `parts`, `chapters`, `appendices`, `assets`, `outputs`, `x`), properti `StudioIngestRequest` baris 141-147 = 3 (`agentId`, `document`, `render`). 13 + 3 = 16 = baris AD-01..AD-16; setiap nama muncul di kolom "Medan v1" tepat sekali.

Rollback hanya objek delta: §3.5 mencocokkan setiap pernyataan rollback blueprint (`05:187-210`) dengan objek delta (9 tabel M10-M18, 14 kolom MX01-MX06, 2 indeks tabel lama, 3 tipe E26-E28, 1 baris `_prisma_migrations`); 0 objek lain.

## Penyimpangan dari blueprint (dicatat untuk controller)

KD-07 (FK identitas NoAction, hipotesis), KD-14 (`$schema` di template v2), KD-15 (`chapters.<slotKey>` menggantikan `content`), KD-16 (4 peran retoris dipertahankan, dipakai lint), KD-20 (penjaga paramsSha256 = proyeksi kunci lama), KD-24 (`ASSET_NOT_FOUND` = 422), R01 `?preset=1` (bukan `?kind=preset`, bentrok filter `kind`), EC24 `CHAPTER_KEY_INVALID` (kode baru di luar daftar blueprint), R-48..R-52 (parameter tambahan: meta bawaan, komposit chart, profil kolom tabel).

## Butir terbuka

KC-6..KC-11 (§17.2): lebar kolom tabel v2 (risiko D-17 tinggi, RK-01), pemilik berkas ukuran halaman, perilaku v1 INCOMPLETE, pemilik `registry/lint.ts`, pemilik delta `render/pure`, nilai F4.
