---
task_slug: doc_artifact_studio
row: FIX-F (penutup review akhir SR-56c; D-313: C1, C2, C6, C8)
date: 2026-10-23
agent: coder-execution
status: complete
---

# FIX-F: C1 format pengisi, C2 kenop perangkat HTML, C6 KUNCI diagram artefak, C8 regex caption

Skill: receiving-code-review (keempat temuan diverifikasi terhadap kode sebelum diubah), dry-run-verify-fix. Klaim: `file_claims.md` baris FIX-F. Penulisan atomik: berkas lama lewat skrip (tmp di direktori yang sama lalu `os.replace`, tiap suntingan cocok tepat sekali, sadar CRLF untuk `selftest_compare.py`). Berkas uji baru ditulis langsung.

## Verifikasi temuan terhadap kode (sebelum perbaikan)
- C1 benar: `submit/meta.ts` `fillerOf` mengembalikan `caller.agentId` mentah untuk INTERNAL_AGENT, sedangkan `contract/auth.ts` `agentRequester` = `agent:<id>` dan `docs/STUDIO-AGENT-GUIDE.md:137-139`, `docs/API-REFERENCE.md:244-246` menjanjikan `agent:<agentId>`.
- C2 benar: HTML `wrapper.ts` (Datum Rule + string punggung sampul auto, Datum Rule pembatas) dan `text.ts` (Datum Rule kepala bab) tidak membaca `device.datumRule.placements` maupun `device.spine.enabled/placements`; pembatas HTML tidak pernah memasang string punggung. Dibuktikan uji paritas baru: 5/5 gagal di kode HTML lama (mis. `device.spine.enabled=false` tetap 1 string punggung sampul HTML, DOCX 0).
- C6 benar, tetapi titik perbaikannya bukan `render/artifact.ts`: blok dokumen yang merujuk artefak dibangun di `services/render/figures.ts` `buildFigures.svgFor` (dipakai `renderSnapshot` untuk render dokumen dan jalur HTML-dari-dokumen di `artifact.ts:440`). Jalur artefak mandiri di `artifact.ts` (SVG/PNG DIAGRAM dan HTML pembungkus artefak) tidak mencetak baris KUNCI halaman, jadi KEY di SVG di sana sudah benar menurut D-288.
- C8 benar: `^(TABEL|GAMBAR)\s+(\d+…)\b` dengan `re.I` mengecualikan kalimat isi "Tabel 3.2 merangkum …". Dibuktikan selftest baru gagal pada pembanding lama (`referenceArtifact {ref:3,node:3}` alih-alih `{1,1}`).

## Perubahan
| Berkas | Jenis | Isi |
|---|---|---|
| `src/lib/studio/services/submit/meta.ts` | ubah | `fillerOf`: INTERNAL_AGENT dengan id = `agent:<agentId>` (tanpa id: `requester` = `anonymous-internal`); sesi tetap `requester` (`user:`/`google:`). Konstanta `AGENT_FILLER_PREFIX = "agent:"` (literal agar modul tetap daun tanpa impor runtime next-auth; kesamaan dengan `REQUESTER_PREFIX.agent` dikunci uji). Satu helper untuk R04/R12/R13/R16/R06/R14 (pemakai tidak berubah) |
| `src/lib/studio/engine/front/apparatus.ts` | ubah | Predikat bersama `datumRulePlaced(params, "sampul"/"pembatas"/"atas judul bab")` dan `spinePlaced(params, "margin luar sampul"/"pembatas")` = semantik DOCX `rulePlaced`/`spinePlaced`/`datumRuleEnabled`; `coverApparatusEnabled` memakai keduanya (perilaku sama) |
| `src/lib/studio/engine/html/blocks/wrapper.ts` | ubah | Sampul auto/explicit: Datum Rule hanya bila `sampul`, string punggung hanya bila `margin luar sampul` + `device.spine.enabled`; pembatas: Datum Rule hanya bila `pembatas`, string punggung bila `pembatas` dan `!p.body` (sama dengan DOCX `renderPartDivider`: `body: []` memakai badan bawaan tanpa string punggung); helper `spineStringHtml` (peran `cover.identityString`, sama dengan DOCX `spineXml`) |
| `src/lib/studio/engine/html/blocks/text.ts` | ubah | Datum Rule kepala bab/lampiran hanya bila `atas judul bab` (lebar wajib dibaca hanya bila dipasang, seperti DOCX) |
| `src/lib/studio/services/render/figures.ts` | ubah (PERLUASAN AREA, diklaim) | `diagramSpecForBlock(spec, content)`: blok diagram yang merujuk artefak dan membawa `keyRow` mendapat `keyRowOnPage: true` pada salinan spec saat build (spec artefak tersimpan tidak diubah, IP-80); dipanggil di `svgFor` |
| `src/lib/studio/services/render/artifact.ts` | ubah (komentar saja) | Catatan D-288 di jalur DIAGRAM mandiri: tanpa `keyRowOnPage` karena tidak ada baris KUNCI halaman |
| `scripts/parity/compare/compare_docx.py` | ubah | `REF_ARTIFACT[0]` = `^(?i:TABEL|GAMBAR)\s+(\d+(\.\d+)*|[A-Z]\.\d+)` + lookahead bentuk caption (akhir baris, pemisah `. : · | - – —` yang bukan titik desimal, atau judul berawal huruf besar/angka/kutip) |
| `scripts/parity/compare/selftest_compare.py` | ubah (kasus baru) | `fixf_c8_body_sentence_starting_with_table_ref_is_scored` |
| `tests/unit/studio/api-structure/fixf-filler-format.test.ts` | baru | 5 uji C1 (format per jenis pemanggil, prefiks = `REQUESTER_PREFIX.agent`, barrel = helper sama, `actorLabel` -> "Agen analis-01") |
| `tests/unit/studio/renderers/fixf-device-placement-parity.test.ts` | baru | 8 uji C2: predikat + paritas render nyata TERBIT v1 DOCX vs HTML (bawaan, `spine.enabled=false`, `spine.placements=["pembatas"]`, `datumRule.placements=["sampul"]`, tanpa `sampul`) |
| `tests/unit/studio/figures/fixf-artifact-keyrow.test.ts` | baru | 3 uji C6 (`diagramSpecForBlock`, `buildFigures` dengan `InlineSpecReader` dan `prepareFigureStore` di-mock tanpa Chromium, artefak mandiri tetap KEY) |

## Bukti (perintah + keluaran)
| Pemeriksaan | Perintah | Keluaran |
|---|---|---|
| Uji baru di kode lama (mutasi) | 4 berkas TS lama dipulihkan sementara, `npx vitest run` 3 berkas uji baru | 10 gagal (C1 3, C2 5, C6 2); sesudah dikembalikan `cmp` identik |
| Uji baru di kode baru | `npx vitest run` 3 berkas uji baru | 16/16 lulus |
| Unit Studio | `npx vitest run tests/unit/studio` | 67 berkas, 2044/2044 lulus (2028 + 16 baru) |
| Selftest pembanding | `<venv harness> -I -B scripts/parity/compare/selftest_compare.py` | `selftest_compare: 36/36 lulus`; dengan `compare_docx.py` lama: kasus C8 FAIL |
| tsc | `npx tsc --noEmit -p .` | exit 0 |
| eslint | area + uji baru, lalu `npx eslint src/lib/studio` + uji baru | exit 0 |
| Manual 000 DOCX v1 | `render_cli --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats docx,html` (before/after di `tests/parity/out/fixf/`) | `53485ebc1eddd145…` sebelum = sesudah |
| Manual 000 DOCX v2 resmi | `run_benchmark.ts --schema v2 --official --out tests/parity/out/fixf/official` | `952f65d63c77f615106d82941d0838cb82798af310e3401cec2d4bcaff9bac2f` (= official3); BM1 4544/4544, BM2 102/102, BM3 99/102 (dikenal D-289), BM4 0,96707 |
| Manual 000 HTML | sha256 HTML v1 dan v2 (render_cli) sebelum/sesudah | v1 `8703aceb4001d095…` = `8703aceb4001d095…`; v2 `ef0aaa59d26d0ec3…` = `ef0aaa59d26d0ec3…`. TIDAK berubah: templat Manual 000 menyetel `device.spine.placements: ["margin luar sampul"]` (tanpa pembatas; `template.json:863`, preset `:122`) dan Datum Rule penempatan bawaan, jadi predikat baru menghasilkan keluaran yang sama |

## Issues & Decisions
| Butir | Isu / keputusan | Resolusi |
|---|---|---|
| C6 | Area brief menyebut `render/artifact.ts`, tetapi titik tunggal yang menutup aparatus ganda adalah `render/figures.ts` `svgFor` (semua render dokumen + HTML-dari-dokumen). `artifact.ts` sendiri tidak punya jalur yang mencetak KUNCI halaman | `figures.ts` diubah minimal (diklaim sebagai perluasan area di `file_claims.md`); `artifact.ts` hanya komentar. Mohon controller mengakui perluasan area ini |
| C1 | Data lama di DB menyimpan `lastFilledBy` agen sebagai id mentah; isian baru berformat `agent:<id>`. `actorLabel` menampilkan keduanya dengan benar ("analis-01" vs "Agen analis-01") | Tanpa migrasi data (di luar area); dicatat |
| C1 UI | `components/studio/document-viewer/completeness-tab.tsx:200` dan `:228` menampilkan `s.lastFilledBy` MENTAH (tidak lewat `actorLabel`), jadi slot yang diisi agen kini tampil "agent:analis-01" di tabel/teks kelengkapan. Rel kelengkapan, daftar dokumen, dan grid bab sudah memakai `actorLabel` | UI tidak diubah (baca saja sesuai brief); perlu baris UI: bungkus dua tempat itu dengan `actorLabel` |
| C2 | DOCX tetap memakai salinan predikatnya sendiri (`docx/wrapper/pages.ts:99-105`, `docx/blocks/structure.ts:57-62`, di luar area); semantik identik, dikunci uji paritas | Konsolidasi DOCX ke `apparatus.ts` = IP-93 (C3) |
| C2 | Temuan sampingan (pra-ada, `html/blocks/device.ts` di luar area): teks string punggung bawaan HTML memakai nama bulan ("OKTOBER", `device.ts:194,210`) dan melewati `revisi` kosong, sedangkan DOCX memakai bulan Romawi ("X", `docx/wrapper/render.ts:364`) dan huruf besar. Kini juga tampak di pembatas HTML bila templat memilih `pembatas` | Kelas F-055 (teks); usul baris FIX-2 lanjutan: satu `spineTexts()` di `engine/front/texts.ts` |
| C8 | Caption berhuruf besar penuh dari gaya `caps` dengan kalimat isi ("TABEL 3.2 MERANGKUM …") tetap dikecualikan karena tak bisa dibedakan dari caption tanpa peran paragraf | Diterima sebagai batas; peran paragraf belum tersedia di pembanding |

## Persistent Issues
Tidak ada.

## Next Steps
- Controller: akui perluasan area `figures.ts` (C6); dispatch baris UI untuk `completeness-tab.tsx:200,228` (`actorLabel`); pertimbangkan FIX-2 lanjutan untuk teks string punggung HTML vs DOCX.

## Lanjutan D-314 (label pengisi UI + teks string punggung satu sumber)

Klaim: `file_claims.md` baris "FIX-F lanjutan (D-314)". Penulisan atomik seperti di atas.

| Berkas | Jenis | Isi |
|---|---|---|
| `src/components/studio/document-viewer/completeness-tab.tsx` | ubah | `:200` (tabel) memakai `slotFillerText(s.lastFilledBy)` (= `actorLabel`, "-" bila kosong); kartu ponsel `Diisi oleh ${actorLabel(s.lastFilledBy)}`. Helper `slotFillerText` diekspor untuk uji |
| `src/lib/studio/engine/front/texts.ts` | ubah | `spineTextOf(meta, params)` = logika DOCX `spineText` yang dipindah utuh (bulan Romawi `ROMAN_MONTHS`, `REV {rev}`, `device.spine.fields`, pemisah " · ") |
| `src/lib/studio/engine/docx/wrapper/render.ts` | ubah (netral keluaran) | `spineText(b)` memanggil `spineTextOf`; impor `dateParts`/`ROMAN_MONTHS` yang tak terpakai dihapus |
| `src/lib/studio/engine/html/blocks/device.ts` | ubah | `spineText(ctx)` memanggil `spineTextOf` (dulu nama bulan "OKTOBER"); tabel `MONTHS` dan impor `paramList` dihapus |
| `tests/unit/studio/renderers/fixf-spine-text.test.ts` | baru | 2 uji: nilai `spineTextOf`; render nyata TERBIT v1 teks string punggung HTML = DOCX (sampul berkonten, pembatas bawaan, sampul tanpa `identityString`) |
| `tests/unit/studio/api-structure/fixf-completeness-filler-label.test.ts` | baru | 2 uji: `slotFillerText` + tidak ada render `lastFilledBy` mentah |

| Pemeriksaan | Perintah | Keluaran |
|---|---|---|
| Uji baru di kode lama (mutasi) | `device.ts` + `completeness-tab.tsx` lama dipulihkan sementara | 3 dari 4 gagal; dikembalikan, `cmp` identik |
| Uji baru | `npx vitest run` 2 berkas | 4/4 lulus |
| Unit Studio | `npx vitest run tests/unit/studio` | 2048/2048 lulus |
| tsc / eslint | `npx tsc --noEmit -p .`; `npx eslint src/lib/studio src/components/studio` + uji baru | 0 / 0 |
| Glosarium | `npx tsx scripts/studio/glossary-check.ts` | exit 0, `HITS_MAIN=0` (125 berkas) |
| Manual 000 DOCX v1 | `render_cli` (`tests/parity/out/fixf/after2`) | `53485ebc1eddd145…` (tetap) |
| Manual 000 DOCX v2 resmi | `run_benchmark.ts --schema v2 --official --out tests/parity/out/fixf/official2` | `952f65d63c77f615106d82941d0838cb82798af310e3401cec2d4bcaff9bac2f` (tetap) |
| Manual 000 HTML | sha256 v1/v2 | TIDAK berubah (`8703aceb…`, `ef0aaa59…`): string punggung sampul Manual 000 berasal dari `identityString` konten dan templatnya tanpa penempatan `pembatas`, sehingga teks bawaan tidak dipakai |

Catatan: huruf kapital string punggung adalah format (DOCX pembatas memberi `caps: true` pada run), bukan teks sumber; kesetaraan tampilan huruf besar di HTML tidak diperiksa di butir ini (yang disamakan adalah teks sumber).
