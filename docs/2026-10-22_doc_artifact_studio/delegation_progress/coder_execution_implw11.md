---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: IMPL-W11
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/verification/17_loop_code_review.md (Cek ulang penutupan 2026-11-04, R1-R4)
status: complete
---

# Laporan Implementasi: IMPL-W11 (R1-R4 cek ulang review 17)

Basis: branch `v2.1`, HEAD `044a1f7` ditambah perubahan IMPL-W10 yang belum di-commit. Tidak ada commit. `decisions.md`
tidak disentuh. Jalur peringatan risiko diterima (M16-2, M16-3) tidak disentuh. Skill: `tdd`, `verification-before-completion`.

## Langkah yang Dijalankan

| Langkah | Tugas | Status | Catatan |
|---|---|---|---|
| 1 | Baca temuan R1-R4, laporan IMPL-W10, probe `r17b/` | selesai | `probe_sub.mts`, `probe_keyless.mts` |
| 2 | Test merah lebih dulu (`implw11-span.test.ts`) | selesai | 12 dari 16 gagal pada kode IMPL-W10 (lihat Hasil Test) |
| 3 | R1: rentang sub-judul, tabel bawaan addRow, pagar bentuk append | selesai | `write-edit.ts`, `write-tools.ts` |
| 4 | R3: baris n-1 berawalan kunci -> `EDIT_INVALID` | selesai | `write-edit.ts` |
| 5 | R2 + R4: dokumentasi saja (`STUDIO-MCP.md` §5.s) | selesai | tanpa perubahan kode |
| 6 | Gerbang: tsc, eslint, vitest studio, convert_v2 x3, probe ulang | selesai | semua lulus |

## Perubahan

| Berkas | Jenis | Deskripsi |
|---|---|---|
| `scripts/studio/mcp/write-edit.ts` | modify | `sectionsOf`: rentang sub-judul berakhir di judul berikutnya bertingkat sama atau lebih tinggi. Rentang `#`/`##` tetap berakhir di `#`/`##` berikutnya (perbaikan IMPL-W10 dipertahankan). `SecRef.own` = akhir isi milik judul sendiri. `SecRef.subAt` = indeks sub-judul tempat rentang berakhir. `pickTable(tables, own, sel)`: bawaan = tabel terakhir milik sendiri. Bila tidak punya tabel sendiri tetapi sub-judulnya bertabel, hasilnya `TEXT_AMBIGUOUS` + daftar. `table` bernomor/teks memilih di seluruh rentang. `blockShape` kini mengembalikan `seq` (penanda `SUB_MARK` untuk blok `{subheading}`). `plan.appended` membawa `beforeSub`/`seq` (tipe `AppendedShape`). `standardSection` memilih section induk terakhir. R3: `looksLikeKey` (`K-` + 8 heksa [+ `-n`], kunci yang sudah dipakai, atau bentuk sama dengan kunci terpakai, mis. `R3F2-#`) menolak baris n-1 dengan `EDIT_INVALID` + `expectedHeader`. |
| `scripts/studio/mcp/write-tools.ts` | modify | `kindsAfterAppend`: sub-judul (paragraf `role: subheading`) dijadikan penanda posisi. Append ber-`beforeSub` disisipkan sebelum sub-judul ke-n, lalu penanda dibuang. Tanpa ini, append daftar ke Sub A (saat Sub B bertabel) memicu `CONTENT_INJECTION` palsu. Import `SUB_MARK`, `AppendedShape`. |
| `tests/unit/studio/mcp/implw11-span.test.ts` | add | 16 test (lihat Verifikasi). |
| `docs/STUDIO-MCP.md` | modify | §5.w addRow: catatan R3 + rujukan tabel bawaan. §5.s: aturan rentang sub-judul dan contoh T0/TA/TB (R1), lingkup `find`/`after`/`cell` ber-`section` (R4), batas ruang tepi label dekat cap (R2). Indeks test: IMPL-W11. |

## Hasil Test

| Jenis | Perintah | Hasil | Catatan |
|---|---|---|---|
| Merah (sebelum perbaikan) | `npx vitest run tests/unit/studio/mcp/implw11-span.test.ts` | `Tests 12 failed \| 4 passed (16)` | 4 yang lulus: append ke induk, TEXT_NOT_FOUND tanpa tabel, R4 find, tabel datar. Kegagalan sesuai R1/R3. |
| Hijau | sama | `Tests 16 passed (16)` | |
| Typecheck | `npx tsc --noEmit -p .` | `tsc exit 0` | |
| Lint | `npx eslint scripts/studio/mcp/write-edit.ts scripts/studio/mcp/write-tools.ts tests/unit/studio/mcp/implw11-span.test.ts` | `eslint exit 0` | |
| Unit studio penuh | `npx vitest run tests/unit/studio` | `Test Files 227 passed (227)`, `Tests 4228 passed \| 1 skipped (4229)` | Termasuk `implw10-final.test.ts` (test sub-judul tunggal tetap lulus) dan manifest SVG bersih. |
| Benchmark | `npx tsx benchmark/extract/convert_v2.ts --check` x3 | 3x `SAME benchmark/manual000/datum-manual-000.preset.json sha256=a951b149180345951355c1935e42093334f19789a583e6c7b495cd6abb18804c` | |
| Probe Q1 ulang | `npx tsx r17b/probe_sub.mts` (baris W10 = kode baru) | append->Sub A: `BARU` sesudah `\| x \| y \|`, sebelum `### Sub B`. addRow->Sub A: masuk TA. addRow->Bukti: masuk T0 (sebelum `### Sub A`). find section Bukti 'isi A': `TEXT_NOT_FOUND` (R4, didokumentasikan) | |
| Probe Q3 ulang | `npx tsx r17b/probe_keyless.mts` | `McpToolError ... code: 'EDIT_INVALID'` ("sel pertamanya tampak seperti kunci butir; kirim 4 sel lengkap ...") | Probe tidak menangkap galat, jadi keluar dengan stack. Itu perilaku yang diharapkan. |
| Asap live DEV | - | tidak dijalankan | Tidak murah dan tidak wajib. Jalur MCP sudah diuji lewat harness `studio_edit` berkeadaan. Tidak menyentuh 9011/DB produksi. |

## Verifikasi (per kriteria)

- **R1 append Sub A** -> akhir isi Sub A, sebelum `### Sub B`: test `append ke "Sub A" mendarat di akhir isi Sub A`.
- **R1 append induk** -> sesudah isi Sub B, sebelum `## Lain` (perbaikan IMPL-W10 tetap): test `append ke "Bukti" (induk)`. Sub-judul terakhir = akhir section. `####` ikut rentang `###`. Sasaran `####` berakhir di `###` berikutnya.
- **R1 addRow Sub A -> TA, Sub B -> TB** (semua tabel 2 kolom, jadi salah sasaran tidak akan galat): test `addRow ke "Sub A" masuk TA; ke "Sub B" masuk TB`.
- **R1 addRow induk -> T0**: test `addRow ke "Bukti" (induk) tanpa table`. Nomor `table` 2/3 dan teks `kc` memilih TA/TB.
- **R1 induk tanpa tabel sendiri** -> `TEXT_AMBIGUOUS` + `details.tables` = `['ka | kb','kc | kd']`. `table: 1` memilih TA. Satu kandidat pun tetap ambigu (sesuai brief controller: tidak dipilih diam-diam).
- **R1 lewat `studio_edit`**: append daftar ke Sub A (Sub B bertabel) -> ok, urutan blok `table, sub, paragraph, table, list, sub, paragraph, table`, tanpa `CONTENT_INJECTION` palsu. addRow Sub A + induk dalam satu batch -> T0 berisi `m1`, TA berisi `n1`, TB tidak berubah.
- **R3**: `R3F2-9` (bentuk kunci tabel), `R3F2-1` (kunci ada), `K-deadbeef`, `K-deadbeef-2` -> `EDIT_INVALID` + `expectedHeader ['key','judul','status','bukti']`. Judul how-to `X-B5: tugas lima` tetap diterima dan diberi `K-xxxxxxxx`.
- **R2/R4**: hanya dokumen (§5.s), tanpa perubahan kode. R4 dikunci oleh test `find dengan section induk hanya mencakup teks section itu sendiri`.

## Isu Persisten

| Isu | Percobaan | Akar Masalah | Status | Memblokir? |
|---|---|---|---|---|
| - | - | - | - | tidak |

Siklus perbaikan yang terpakai: 1, untuk kesalahan test sendiri: array `body` ter-alias antar-run, `e.details` -> `e.extra.details`, dan status `berjalan` dinormalkan ke `running`. Tidak ada siklus perbaikan kode produksi tambahan.

## Isu & Keputusan

| Langkah | Isu / Keputusan | Resolusi |
|---|---|---|
| 3 | Pagar bentuk append (`kindsAfterAppend`) mengasumsikan append selalu di akhir section. Dengan rentang Sub A yang benar, append bukan-paragraf ke sub-judul tengah akan memicu `CONTENT_INJECTION` palsu. | Ditambah `beforeSub` + penanda sub-judul. Blok `{subheading}` yang di-append ikut sebagai penanda (`seq`), agar append berikutnya dalam batch yang sama tetap sinkron. Dipilih karena lebih aman daripada melonggarkan pagar. |
| 3 | Induk tanpa tabel sendiri dengan tepat SATU tabel di sub-judul: reviewer menyarankan ambigu "bila >1 kandidat", sedangkan brief controller "bila sub-judul bertabel". | Mengikuti brief controller: selalu `TEXT_AMBIGUOUS` (tidak ada pemilihan diam-diam). Didokumentasikan di §5.s. |
| 3 | Penomoran `table` pada induk. | Nomor 1..n dihitung di seluruh rentang induk (T0, TA, TB), sama dengan daftar di galat. |
| 4 | R3: pola kunci. Brief: `K-`+heksa atau sama dengan kunci baris yang ada. Probe Q3 (`R3F2-9`) tidak tertangkap oleh dua aturan itu saja. | Ditambah "bentuk sama dengan kunci terpakai": token tanpa spasi, berhuruf, berakhiran angka, dengan angka akhir diganti `#`. Contoh: `R3F2-9` ~ `R3F2-1`. Judul berspasi/berkolon (bentuk how-to) tidak terkena. Risiko salah tolak rendah, dan pesannya dapat ditindaklanjuti (kirim n sel). |
| 4 | `standardSection` (bab sudah ada, judul lain) memakai entri terakhir. | Kini memilih section induk (`#`/`##`) terakhir. Pendaratannya identik, tetapi maksudnya lebih jelas. |

## Rekomendasi

- **review recommended**, lingkup: `scripts/studio/mcp/write-edit.ts` (`sectionsOf`, `pickTable`, `looksLikeKey`, cabang append/addRow) dan `scripts/studio/mcp/write-tools.ts` (`kindsAfterAppend`), plus `tests/unit/studio/mcp/implw11-span.test.ts`.

## Langkah Berikutnya

- Opsional: asap live DEV 9021 (`2026-11-04_smoke-implw11`) untuk append/addRow pada laporan bersub-judul tersimpan.
- Selain itu: tidak ada.
