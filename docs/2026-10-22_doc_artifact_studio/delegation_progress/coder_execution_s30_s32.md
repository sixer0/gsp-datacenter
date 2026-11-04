---
task_id: doc_artifact_studio_datum_rev_a
task_slug: doc_artifact_studio
row: S30, S31, S32
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: needs-review
---

# Laporan: S30, S31, S32 (tabel slug di tiga dokumen)

Status `needs-review`: dokumen selesai dan terverifikasi, tetapi satu uji lama (`s29-usage-parity.test.ts`, uji pertama) menegaskan cacat yang diperbaiki D-605 (3), jadi kini gagal. Uji itu di luar kepemilikan baris ini.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| S30 | how-to: tabel slug + kalimat `latest` + perbaikan sampel §2 | complete | tanpa instruksi pemakaian baru |
| S31 | SKILL.md: tabel slug ringkas + kalimat `latest` | complete | |
| S32 | AGENT-GUIDE §3: 10 baris slug di tabel templat | complete | hanya tabel itu |

## Changes Made
| File | Change | Description |
|---|---|---|
| `docs/STUDIO-HOWTO-DOCUMENT.md` | modify | `meta.author` = `Tim Kajian`; tabel berketerangan diberi `source` = `Register ancaman proyek` (nilai persis seperti `completedSample()` di uji S29); kalimat `template: "latest"` = `datum-gsp` dan tabel 10 slug (jenis, bahasa, slug, kode, tier, kicker) setelah paragraf `studio_file_verify` di §2, setelah blok JSON |
| `docs/hermes-skills/gsp-studio-write/SKILL.md` | modify | bagian `## Slug templat` (kalimat `latest` + tabel ringkas: jenis, slug ID, slug EN, kode, tier) sebelum `## References` |
| `docs/STUDIO-AGENT-GUIDE.md` | modify | 10 baris slug ditambahkan ke tabel §3 setelah `datum-kanonik` (kolom Catatan: kode, tier bawaan, kicker sampul) |

Catatan nilai sampel: percobaan pertama memakai `"source":"<sumber tabel>"`; gerbang DATUM-10 tetap melaporkan "tabel bercaption tanpa baris SUMBER" (4 uji gagal), jadi nilai diganti teks biasa seperti di uji S29.

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Uji pembaca how-to | `npx vitest run tests/unit/studio/compose/s29-usage-parity.test.ts` | 13 lulus, 1 gagal | gagal: "sampel how-to apa adanya (tanpa number) ditolak klien IDENTIK untuk ke-11 templat (META_MISSING author)": `expected 'tidak ditolak' to match /^META_MISSING.../` |
| Uji terkait dokumen lain | `npx vitest run tests/unit/studio/fix1/fix1.test.ts tests/unit/studio/api-structure/fixf-filler-format.test.ts` | 45 lulus | hanya menyebut guide di komentar/JSON, tidak parse tabel |
| Uji pembaca how-to (daftar) | `grep -rl "STUDIO-HOWTO-DOCUMENT" tests` | satu berkas | `s29-usage-parity.test.ts` |

Empat uji "sampel dilengkapi" di berkas S29 yang sempat gagal pada percobaan pertama (source berupa placeholder) lulus kembali sesudah `source` memakai teks biasa.

## Verification
Pemeriksaan slug demi slug terhadap register (`research/31` §1 tabel, diparse dengan skrip; kolom bahasa, kode, tier, kicker dibandingkan), juga cocok dengan `DOC_TYPE_LAYERS` di `prisma/seed-doc-type-templates.ts:71-75`:

| # | Slug | Bahasa | Kode | Tier | Kicker | how-to | SKILL | guide |
|---|---|---|---|---|---|---|---|---|
| 1 | datum-proposal-teknis | ID | PT | SERAH | PROPOSAL TEKNIS | ya | ya | ya |
| 2 | datum-proposal-teknis-en | EN | PT | SERAH | TECHNICAL PROPOSAL | ya | ya | ya |
| 3 | datum-laporan | ID | LAP | TERBIT | LAPORAN | ya | ya | ya |
| 4 | datum-laporan-en | EN | LAP | TERBIT | REPORT | ya | ya | ya |
| 5 | datum-laporan-verifikasi | ID | VER | TERBIT | LAPORAN VERIFIKASI | ya | ya | ya |
| 6 | datum-laporan-verifikasi-en | EN | VER | TERBIT | VERIFICATION REPORT | ya | ya | ya |
| 7 | datum-standar | ID | STD | TERBIT | STANDAR | ya | ya | ya |
| 8 | datum-standar-en | EN | STD | TERBIT | STANDARD | ya | ya | ya |
| 9 | datum-nota | ID | NOT | NOTA | NOTA INTERNAL | ya | ya | ya |
| 10 | datum-nota-en | EN | NOT | NOTA | INTERNAL NOTE | ya | ya | ya |

`git diff --stat` (3 berkas): AGENT-GUIDE +10, HOWTO +19/-2, SKILL +12; total 39 insertions, 2 deletions. Satu hunk di AGENT-GUIDE (`@@ -194,0 +195,10`, tabel §3). Dua baris dihapus di HOWTO = dua baris JSON sampel §2 yang diperbaiki.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Uji S29 pertama (`s29-usage-parity.test.ts` baris 254-266) gagal | 0 (di luar kepemilikan) | Uji menegaskan sampel apa adanya ditolak `META_MISSING author`; D-605 (3) memang menghapus cacat itu | Perlu keputusan controller | Tidak untuk dokumen; ya untuk suite hijau |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| S30 | Uji lama bergantung pada cacat sampel | Dokumen mengikuti D-605 (3); usul: controller (S29 owner) mengubah uji itu menjadi "sampel apa adanya valid" (tidak ditolak), atau membuang uji dan memakai `completedSample()` yang kini identik dengan sampel apa adanya |
| S30 | Placeholder `<sumber tabel>` ditolak DATUM-10 | Nilai teks biasa, sama dengan uji |
| S30 | Tabel slug ditaruh setelah blok JSON pertama di §2 | Regex uji `## 2.` + blok ```json pertama tetap menangkap sampel yang sama |
| S30-S32 | Berkas bersumber LF; git memberi peringatan LF->CRLF | Tidak diubah, perilaku git yang sudah ada |

## Next Steps
- Controller memutuskan perubahan uji S29 pertama (di luar 3 dokumen); lalu jalankan ulang `npx vitest run tests/unit/studio/compose/s29-usage-parity.test.ts`.
- Tidak ada commit dibuat.

## Catatan D-607: koreksi sampel §2 (coder-execution, 2026-11-04)
- Berkas ditulis: hanya `docs/STUDIO-HOWTO-DOCUMENT.md` (sampel §2 + contoh deskriptif baris 19 dan 21). Tanpa commit.
- Klasifikasi: sampel semula tidak memuat `classification`; ditambah `"classification":"TERBATAS"` (kapital, sesuai EG-50 dan `manual_id.txt` baris 20 dst).
- Revisi: nilai tunggal `"Rev A, Terbit pertama"` TIDAK terpecah seperti perkiraan (probe `buildClient`: rev "Rev A", catatan "Rev A, Terbit pertama", peringatan REV_SPLIT). Dipakai dua kunci yang sudah dikenal klien (`META_ALIASES`, `revisionNote` ada di STUDIO-MCP.md:639): `"revision":"A"` + `"revisionNote":"Terbit pertama"` -> `revisionHistory` rev "A", what "Terbit pertama", tanpa peringatan REV_SPLIT/REV_DISPLAY_ONLY. Controller dapat menolak ini bila `revisionNote` dianggap medan baru (D-594).
- Judul bab: "Bab N." ditangani `SRC_WORD` (`write-client.ts:408`) persis seperti "Chapter N."; mode sumber, label 1 dan 6, judul dicetak apa adanya. Sub-judul "1.1 Background" ikut diubah menjadi "1.1 Latar Belakang" (konsistensi contoh baris 21).
- Tidak diubah (di luar daftar): isi tabel/grafik berbahasa Inggris di sampel ("Threat", "Threat register", "Critical", "High", "Low"), dan §3 butir 6 yang masih menyebut `revision` sebagai "teks revisi lengkap, mis. Rev 1, ...". Usul tindak lanjut controller.
- Uji: `s29-usage-parity.test.ts` 14/14 hijau; `tests/unit/studio/mcp` 32 berkas, 411 uji hijau. Tidak ada pin nilai lama di uji S29.
