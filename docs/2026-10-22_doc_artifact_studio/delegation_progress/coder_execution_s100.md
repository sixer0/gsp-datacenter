# S100 coder-execution: Playground JSON (`/studio/playground`)

Status: complete (penjaga lulus; diuji ujung-ke-ujung terhadap server dev v2.1 port 3217, lalu server dihentikan).

## Berkas (10)
- `src/app/studio/playground/page.tsx` (halaman + metadata).
- `src/components/studio/playground/`: `playground.tsx` (komponen utama), `json-editor.tsx` (textarea mono, nomor baris, sorot baris, Tab = 2 spasi), `json-locate.ts` (JSON Pointer -> baris, galat sintaks baris/kolom), `example.ts` (contoh minimal dari JSON Schema R03: `$ref` absolut, oneOf berdiskriminator, if/then/else const, pola), `hints.ts` (nilai dari registri: slug template, `doc.typeCode` versi, chart `drawn` kategorikal), `panels.tsx` (galat, lint, pratinjau iframe `sandbox=""`, hasil simpan), `api.ts` (POST bergalat terketik + penjaga percobaan 3/6/12 s maks 3), `draft.ts` (localStorage try/catch), `types.ts`.

## Bukti integrasi (curl, x-internal-secret, DB `gsp_agent_hq_v21`)
- R01 200 (1 template `datum-kanonik`); R02 200 `{template, version, versions}`; R03 schema 200 `application/schema+json`; R03 charts 76 item (P-01 drawn kategorikal).
- R08: sah 200 `valid:true` + `previewHtml` 447.979 karakter tanpa `<script>`; tak sah 200 `valid:false` pointer `/document/...`; `{bad` 400 `JSON_MALFORMED`; chart tanpa data 200 `valid:false` pointer relatif spec.
- R04: 201 `{document, revision, outputs, job, releaseStatus, lint, errors, addresses, url}`; tak sah 400 `SCHEMA_INVALID` + `details`. R09 201. R10 200 DOCX.
- Contoh 5 jenis dibangkitkan dari skema registri -> R08 `valid=true` 5/5.
- E2E headless (playwright-core, Chromium 1234): contoh dimuat; Validasi -> Valid + iframe sandbox ""; 2 galat dipetakan ke baris 8 dan 27, klik menyorot baris; galat sintaks "baris 4, kolom 1"; 4 jenis lain valid; Render + Simpan -> dokumen 002/GSP/KT/X/2026, tautan `/studio/documents/<id>`; draf localStorage 2.307 byte; lebar 420 px tanpa gulir horizontal.

## Penjaga
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/(app/studio/playground|components/studio/playground)"` -> kosong (exit 1).
- `npx eslint src/app/studio/playground src/components/studio/playground` -> exit 0, tanpa keluaran.

## Keputusan
- K1: isian panel (template/versi, tier, misi) menimpa medan JSON saat kirim; kosong = ikuti JSON. Misi untuk artefak dikirim di badan R09.
- K2: memakai ulang lapis data S60 (`document-viewer/api`, `feedback`, `labels`) hanya lewat impor; log galat klien = JSON konsol (repo belum punya endpoint log klien, sama dengan S60).
- K3: unggah aset raster multipart untuk jenis gambar tidak dibuat (di luar brief); aset lewat `dataBase64` di JSON.

## Temuan (tidak diperbaiki, di luar area)
- F1: render HTML dokumen gagal `FILE_MISSING_ON_DISK: writeOutput: invalid mime (mime)` (job PARTIAL, DOCX tetap jadi) - jalur S51/S52.
- F2: data uji di DB v21: dokumen `cmvju4s5e0001v1eotkl4womc` (001/GSP/KT/X/2026), `cmvjugnl00001v170gct9wfj0` (002/...), 1 artefak chart P-01 (agentId kosong) - memakai nomor sekuens 001-002.
- F3: `/api/auth/me` 401 untuk pemanggil x-internal-secret (shell HQ, bukan Studio).
- Review recommended (S86): playground.tsx, json-locate.ts, example.ts.
