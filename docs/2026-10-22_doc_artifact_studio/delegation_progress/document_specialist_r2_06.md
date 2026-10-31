---
task_slug: doc_artifact_studio
row: R2-06 (D-419, D-423; U-02, U-04, U-06, U-08 + draft-check baru)
date: 2026-10-31
agent: document-specialist
source: decisions/decisions.md D-419, D-423; research/12_contract_efficiency_results.md §9; delegation_progress/coder_execution_r2_01.md, coder_execution_r2_02.md
status: complete
---

# Laporan R2-06: panduan agen §17 resep satu halaman + API-REFERENCE §12

## Langkah yang dijalankan
| Langkah | Usulan | Status | Hasil |
|---|---|---|---|
| 1 | U-06 | selesai | §17.0 "Resep satu halaman" (baru, sebelum §17.1; nomor 17.1-17.13 tidak bergeser agar rujukan lama tetap sah): aturan berkas, `studio-report submit/update` (perilaku, tabel opsi, keluaran manusia dan `--json`, bentuk galat `{ok:false, exitCode, fatal}`, kode keluar 0/1/2/3, `--timing` + env `STUDIO_TIMING_*` hanya untuk uji), templat draf MD siap salin (kepala + blok `record` + bab 1..5 dari R03 `items[0].examples`), alur pembaruan, alternatif HTTP R03 -> R13/R04 -> R12 -> R15 -> R17 -> R10 untuk klien non-CLI. §1.1 butir 9 kini menunjuk §17.0 saja |
| 2 | U-02 | selesai | Contoh berkas badan dihapus: §17.4 `record.json` + `--data-binary @record.json` -> `draft-check --emit 1 \| curl --data-binary @-`; §17.9 `--emit 1 > blok1.json` -> pipa ke curl; §17.9 R23 `> badan.json` + `@badan.json` -> pipa Python ke curl `@-`; §17.10 `md2contract --out laporan.json` -> stdout + catatan; §2 `@bab-3.json` dan §5.6 `> bab1.json`/`> bab4.json` -> stdout/pipa. Aturan eksplisit di §17.0, §17.1, §17.9, §1.1 |
| 3 | U-04 | selesai | §17.13 "Bentuk galat": `{ error: <pesan string>, code, details }`, baca `body.code` bukan `error.code`, cid di header `x-correlation-id`; bukti D-419 (cid 3b684687) + probe ulang; R03 tanpa kind / kind tak dikenal -> `400 REGISTRY_KIND_UNKNOWN` `details` objek `{pointer, keyword required\|enum, message, received, validKinds (13), examples}`. §12 baris REGISTRY_KIND_UNKNOWN dan paragraf bentuk galat diselaraskan |
| 4 | U-08 | selesai | §17.7: `matchedItems` = butir `items[]` revisi terkini dengan `key` sama persis dengan `cardId` (dicek `services/query/contracts.ts:11-12,141-150`); laporan ikut hasil bila kartu di `cardIds` ATAU `key` butir (`services/contracts/project.ts:159-160`), jadi kartu hanya di `cardIds` -> `matchedItems: []` |
| 5 | draft-check baru | selesai | §17.9: simulasi berurutan (juga R23), `--json` selalu JSON + daftar kode `fatal`, cwd mana pun, `--with-payload` opt-in; pernyataan AC-19 dikoreksi ke `--json --with-payload` + penyamaran pid blok pembuat. §17.2 tabel registri + baris `examples` |
| 6 | API-REF §12 | selesai | Baris R03 (kind wajib, `examples`/`ContractKindExamplesV2`, 400 `details` objek); baris R23 (simulasi berurutan, setara CLI `--with-payload`); paragraf Galat (`code` tingkat atas, cid header, kecuali 401/405); catatan "Per 2026-10-31 (R2)" menyebut CLI `studio-report` dan perubahan draft-check. Tabel route tidak berubah (ekspor diperiksa: registry `GET`, drafts/check `POST`) |

## Berkas diubah
| Berkas | Perubahan |
|---|---|
| `docs/STUDIO-AGENT-GUIDE.md` | +346/-41 baris (git diff --numstat); §1.1, §2, §5.6, §12, §17.0 (baru, 225 baris termasuk templat 133 baris), §17.1, §17.2, §17.4, §17.7, §17.9, §17.10, §17.13 |
| `docs/API-REFERENCE.md` | +12/-3 baris; §12 paragraf Galat, baris R03, R23, catatan R2 |
| laporan ini | baru |

## Verifikasi (bukti segar, server :9021, 2026-10-31)
- Templat §17.0 diekstrak dari panduan, `diff` dengan berkas uji = IDENTIK; `draft-check <templat> --remote http://127.0.0.1:9021 --json` -> `valid: true`, 6/6 blok valid tanpa isu, rc 0.
- `studio-report submit` templat (agentId diganti `doc-r2-06`, `--mission 2026-10-31_r2_06_examples`, cwd di luar repo): 6x 201 rev1..rev6, COMPLETE, HTML 2.614.650 bita, sha16 `cc141694e358bf75`, `X-Studio-Sha256-Verified true`, rc 0; documentId `cmvw05sam01dmv1zgjhoc47bg` (015/GSP/LAP/X/2026), cid pertama `ead2e704-1d3a-42b5-9271-8e340742c156`.
- `studio-report update` (status partial): hanya record 201 rev7 cid `3f0d3a34-72f7-4937-b560-8f14de140e73`, 5 bab dilewati, verified true, rc 0.
- Pola pipa yang didokumentasikan diuji: `draft-check --emit 1 | curl R08 --data-binary @-` -> `valid: true`; pipa Python -> R23 -> 6/6 valid.
- Bentuk galat: 400 `/chapters` cid `044ab855-5f10-4c44-9374-b5d55e140b29` (`code` tingkat atas + header); R03 tanpa kind cid `509ee77f-623a-4eef-932b-7d2b95c1dd34`; `?kind=contract` -> keyword `enum`; 404 membawa code + cid; 401 dan 405 TANPA code dan cid.
- Pindai sisa: `grep record.json|badan.json|blok1.json|bab-3.json|> bab[0-9].json|--out laporan|data-binary @<berkas>` di panduan = 0. Rahasia tidak dicetak (dibaca ke env). Berkas sementara `%TEMP%/r2_06/` dihapus sesudah verifikasi.

## Swaperiksa (producer, bukan review)
Struktur sesuai (rujukan teknis, pembaca agen developer); kedalaman sesuai; setiap klaim membawa bukti (cid, berkas:baris); tidak ada kontradiksi yang tersisa antara §17.0, §17.4, §17.9, §17.13, §12 dan API-REF; istilah konsisten; tanpa emoji. LULUS.

## Isu dan keputusan
| Isu | Penyelesaian |
|---|---|
| Brief: "server selalu mengirim keduanya" | Dibatasi faktual: semua galat KECUALI 401 (`{"error":"Unauthorized"}`) dan 405 (tanpa badan) — terbukti probe |
| Lingkup U-02 "semua contoh" | Contoh di §2 dan §5.6 (di luar §17) ikut diganti agar tidak bertentangan dengan aturan berkas; §12 satu baris dan satu kalimat diselaraskan |
| Penomoran | §17.0 dipakai (bukan menggeser 17.1-17.13) agar rujukan `§17.7`, `§17.9`, `§17.13` di brief/protokol tetap sah |
| `refs` di templat | Dihapus dari templat (contoh registri merujuk dokumen DEV tertentu); dijelaskan di teks |
| Data uji DEV | Dokumen `015/GSP/LAP/X/2026` misi `2026-10-31_r2_06_examples` rev1..7 dibiarkan di :9021 |

## Langkah berikut
Siap untuk review independen (document-reviewer / R2-07). Belum di-commit.
