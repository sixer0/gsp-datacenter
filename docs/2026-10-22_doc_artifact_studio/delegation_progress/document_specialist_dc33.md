# DC-33 Panduan agen: bab Laporan kerja agen + amandemen register 05

- Pelaksana: document-specialist, 2026-10-30. Skill: `document-quality-standards` (A, B, D, E, F, H).
- Acuan: blueprint 07 baris DC-33; register 05 (BA-33, §4-§16); D-361..D-394; gerbang `gateway_check/11_contract_integration_gate.md`.
- Status: **complete**. Tanpa kode diubah; server DEV :9021 tidak disentuh selain GET/dry-run (0 tulis).

## Berkas

| Berkas | Perubahan | Ukuran sesudah |
|---|---|---|
| `docs/STUDIO-AGENT-GUIDE.md` | +574/-4 baris: bab baru §17 (17.1-17.13); §0 baris tabel aksi; §1.1 butir 9; §12 4 kode EC25-EC28 + checkId kontrak + 413 R23 + kuota query; §13 4 baris batas; §16 R10 HEAD + R21-R23 | 2.298 baris, 140.051 byte |
| `masterplan/05_document_contract_specs.md` | +16/-1: 8 amandemen bertanda "Amandemen DC-33" (9 tempat) | 1.342 baris, 105.676 byte |
| `C:/Users/TRIAL/AppData/Local/Temp/dc33_examples/` | contoh draf, keluaran draft-check, skrip ekstrak/banding (di luar repo) | - |

## Tugas A: isi bab 17

Kapan dipakai (D-361 U-4, U-3) · templat dan kerangka dari `GET /api/studio/registry?kind=contracts` · medan payload `contractRecord` + enum + pola + refs/evidence · membuat laporan (slot `record` amplop buat, lalu bab 1..5) · memperbarui status (`content?slot=record&shape=submission` lalu kirim ulang slot) · kelengkapan bab wajib 1..5 · R21 dan R22 (parameter, bentuk respons, contoh curl) · render HTML bawaan + nama final + `HEAD ?verify=1` · draf MD + `draft-check` CLI dan R23 + aturan agentId dan medan jam (D-393) · `md2contract` (KD-42, kode keluar 3) · header kuota per proses (D-366) · `chart.custom` (9 bentuk) · EC25-EC28 + urutan evaluasi sesuai register §5.6 / 03 §11.1 (isi 400/422 sebelum 409 `SCOPE_CONFLICT`; FIX-C1 menyelaraskan kode).

## Bukti

| Cek | Perintah | Hasil |
|---|---|---|
| Contoh JSON lolos server | ekstrak semua blok ```` ```json ```` bab 17 dari panduan final (`extract.py`) lalu `INTERNAL_API_SECRET=... npx tsx scripts/studio/draft-check.ts <berkas> --remote http://127.0.0.1:9021 --json` | 4 blok + 1 contoh draf: semua `exit 0`, `valid: true`, `issues []` (slot/v2 ×2, chapter/v2 ×2, draf slot/v2) |
| CLI = R23 (D-393) | R23 `POST /drafts/check` (rahasia internal, agentId sama) vs CLI `--remote --agent-id --json`, medan `lastFilledAt`/`at` disamarkan (`cmp.py`) | `identik: True`; R23 200, `x-studio-quota-bucket: validate`, cid `b2b599fd-3451-4349-bd91-0c2c30ffd68a` |
| md2contract KD-42 | laporan contoh tanpa status/waktu | exit 3, pesan menyebut `--status` dan `--reported-at`; dengan opsi exit 0 `valid=true` |
| Route/kode ada di kode | 45 identifier HURUF_BESAR bab 17 di-grep di `src`/`scripts` | 0 hilang (kecuali `HQ_URL` = variabel shell, sudah dipakai §2); R21-R23 di `STUDIO_ROUTES` (`env.ts:56-82`), HEAD di `files/[id]/route.ts:89`, `?rev` di `documents/[id]/route.ts:283` |
| Rahasia | `grep -F` nilai rahasia di semua keluaran | tidak ada |
| Glosarium | `npx tsx scripts/studio/glossary-check.ts` (cara pakai berkas: akar UI bawaan) | exit 0, `files=125 HITS_MAIN=0` |

## Isu dan keputusan

1. **glossary-check pada panduan tidak bermakna.** Alat mem-parse `.ts/.tsx` (layar UI, UX-01 §1.2); bila diarahkan ke `STUDIO-AGENT-GUIDE.md` ia mem-parse Markdown sebagai TS dan menghitung kosakata API (pid, JSON, slot). Baseline HEAD sebelum DC-33 = 226 hit, sesudah = 265; tidak dapat menjadi 0 tanpa membuang istilah kontrak. Kriteria "0" dipenuhi pada cara pakai resmi (akar UI). Controller memutuskan apakah kriteria blueprint diubah.
2. Contoh memakai id dokumen uji DEV (dokumen A/B gerbang DC-31) agar `--remote` dapat memeriksa rujukan; panduan menyatakan id harus diganti.
3. Penanda `studio:validate` tidak dipakai di contoh baru (tidak ada harness yang membacanya); bab 17 menyatakan contoh diperiksa `draft-check --remote`.
4. Amandemen `warnings` R16/R06/R14 dirujuk D-386 (penugasan) dan D-389 (implementasi).

## Tugas B: amandemen register 05

D-367 `alsoAt` (§5.5) · D-377 `validation` I64 (§15) · D-371/D-384 `activeTiers` NONE (§6.1) · D-384 E41 `enums.ts:436-452` (§0.3, §5.4) · D-386/D-389 `warnings` R16/R06/R14 (§9.5) · D-393 agentId + medan jam (§11.3) · D-370 status nullable (§9.1) · D-390 `finalFileName` wajib (§9.5). Rujukan baris dicek terhadap kode sesi ini.

## Self-check (bukan review)

Struktur sesuai jenis (panduan teknis, audiens agen pengembang), contoh teruji, istilah konsisten dengan register (status/vonis/kunci), tanpa duplikasi isi §5/§8 (dirujuk silang), tanpa emoji: PASS. Penilaian independen milik `document-reviewer` (DC-42).

Next: send to document-reviewer
