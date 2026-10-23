---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: SR-30
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/05_structural_sections_blueprint.md (SR-30, §2.12); masterplan/04_studio_ux_spec.md (W1, W5-W9, §7 SR-30)
status: complete
---

# Implementation Report: SR-30 UI Dokumen (ramah pengguna awam)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca UX-01 (§1.2, §2, §3b-§3d, W1/W5-W9, §5, §6, §7, §9), blueprint SR-30 + §2.6/§2.12, register R04/R05/R14-R18/R20, D-153/D-161/D-163/D-164/D-172, driver_rules, file_requests | selesai | |
| 2 | Klaim jalur `file_claims.md` (prefiks SR-30) | selesai | |
| 3 | Endpoint: curl :9021 + baca kode route | selesai | tanpa sesi semua route 401 `{"error":"Unauthorized"}`; bentuk 200 diketik dari kode route yang sudah mendarat (lihat Issues) |
| 4 | Model + klien (`doc-model.ts`, `doc-api.ts` di atas `shared/http`) | selesai | |
| 5 | W5 daftar per misi + Buat dokumen (D-153, `?buat=1`) | selesai | |
| 6 | W6 kepala + rel + kartu Buat berkas + tab Kelengkapan | selesai | |
| 7 | W7 Lembar baca terang + sunting di tempat + gambar + sisip/pindah/hapus + konflik | selesai | |
| 8 | W8 Riwayat dokumen + per paragraf; W9 Berkas + pratinjau | selesai | |
| 9 | W1 Beranda; pengalihan `/edit`, `/revisions`, `/revisions/[rev]` (T-11) | selesai | |
| 10 | Gerbang D-133 (tsc, eslint, curl asap, glosarium) | selesai | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/components/studio/document-viewer/doc-model.ts | add | Bentuk respons R04/R05/R07/R14-R18/R20; adaptor laporan -> rel FIX-4a; label awam kekurangan/lingkup/nomor/berkas; editor teks <-> `runs` (tebal, miring, kode, sup, sub); kunci misi dari judul |
| src/components/studio/document-viewer/doc-api.ts | add | Semua panggilan lewat `shared/http.requestJson` + `studioRoutePath`; sumber log `studio.ui.documents.*` |
| src/components/studio/document-viewer/doc-context.tsx | add | Kepala (R05 + R14) dimuat sekali untuk 4 tab; muat ulang 30 s bila terlihat dan tidak menyunting; pengumuman aria-live bagian baru terisi |
| src/components/studio/document-viewer/document-viewer.tsx | modify (tulis ulang) | Halaman dokumen: URL `tab/versi/p/ke`, tablist ARIA (panah), galat/404 awam |
| src/components/studio/document-viewer/meta-panel.tsx | modify (tulis ulang) | Kepala W6: remah roti, judul, nomor, tingkat terbitan, templat dipatok, rel `md`, Info teknis; menu Tindakan admin K-8/K-9 |
| src/components/studio/document-viewer/render-card.tsx | add | Buat berkas: berkas lengkap hanya `fullRenderAllowed` (aria-disabled + daftar kekurangan + alternatif), draf bab/bagian, 409/429/503 awam + jeda |
| src/components/studio/document-viewer/completeness-tab.tsx | add | Tabel per bagian (kartu di ponsel), chip bab, "Buat draf bagian ini", salin ringkasan kekurangan, Info teknis `forwardToController` |
| src/components/studio/document-viewer/reader/reader-tab.tsx | add | Lembar baca, daftar isi (sticky / lembar bawah), sunting per paragraf, menu blok, lembar perubahan, konflik, versi lama baca saja, 403 baca saja, PID hilang |
| src/components/studio/document-viewer/reader/blocks.tsx | add | Tampilan sederhana 21 jenis blok (tabel sederhana; tabel kompleks/grafik/gambar = kartu + "Lihat di PDF") |
| src/components/studio/document-viewer/reader/slot-view.tsx | add | Bagian otomatis/kosong/terisi (tanda tangan, daftar sumber, lembar kendali, sampul) |
| src/components/studio/document-viewer/reader/paragraph-editor.tsx | add | Editor di tempat + bilah penanda makna; Esc/Ctrl+Enter; draf localStorage (try/catch) |
| src/components/studio/document-viewer/reader/paragraph-history.tsx | add | Panel Riwayat paragraf + perbandingan teks (`revision/text-diff`) + "Pakai teks ini lagi" |
| src/components/studio/document-viewer/reader/dialogs.tsx | add | ChangeSheet, ImageDialog (R18, PNG/JPG, batas `STUDIO_MAX_ASSET_BYTES`), MoveDialog, ConflictDialog (+K-5) |
| src/components/studio/document-viewer/history-tab.tsx | add | Riwayat dokumen: Lihat versi ini, Bandingkan dengan terbaru (`revision/diff-view`), Buat berkas dari versi ini |
| src/components/studio/document-viewer/output-files.tsx | modify (tulis ulang) | Tab Berkas per versi, `FileActions` (Buka/Unduh lewat `fileUrl`, Word hanya Unduh), `FilePreviewDialog` (SEC-1/SEC-2) |
| src/components/studio/document-viewer/address-tree.tsx | modify (tulis ulang) | Daftar isi dokumen (bagian, bab, subbab bernomor) |
| src/components/studio/document-viewer/document-list.tsx | modify (tulis ulang) | W5 per misi, rel per baris, filter URL, muat lebih banyak, `?buat=1` |
| src/components/studio/document-viewer/create-document-dialog.tsx | add | Dialog Buat dokumen (D-153) |
| src/components/studio/document-viewer/studio-home.tsx | modify (tulis ulang) | W1 Beranda tanpa statistik angka besar |
| src/components/studio/document-viewer/index.ts | modify | Ekspor baru; ekspor lama `api/feedback/labels` dipertahankan (dipakai modul lain sampai FIX-4b) |
| src/app/studio/page.tsx, src/app/studio/documents/page.tsx, src/app/studio/documents/[id]/page.tsx | modify | `studioPageTitle` |
| src/app/studio/documents/[id]/edit/page.tsx, revisions/page.tsx, revisions/[rev]/page.tsx | modify | Pengalihan ke `?tab=baca`, `?tab=riwayat`, `?tab=baca&versi=n` (T-11) |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck repo | `npx tsc --noEmit -p tsconfig.json` | area 0 galat; repo 1 galat di luar area | `benchmark/extract/convert_v2.ts(290,39)` TS2353 |
| Lint area | `npx eslint --max-warnings=0 src/components/studio/document-viewer src/app/studio/documents src/app/studio/page.tsx` | exit 0 | |
| Asap rute | `curl -s -o /dev/null -w "%{http_code} %{redirect_url}"` ke :9021 | 8/8 = 307 -> `/login?next=...` | `/studio`, `/studio/documents`, `?buat=1`, `/studio/documents/cmw1sampel`, `?tab=riwayat`, `/edit`, `/revisions`, `/revisions/3` |
| Asap API tanpa sesi | curl R04, R05, R07, R14-R18, R20, R01 | 401 `{"error":"Unauthorized"}` | semua route ada |
| Glosarium §1.2 | `python -I sr30_glossary.py` (scratchpad) | `files=28 texts_checked=347 HITS=0` | string + teks JSX area |
| Asap logika murni | `npx tsx sr30_smoke.ts` (scratchpad) | 16/16 PASS | bukan suite uji (D-133) |

## Verification
- A7: tombol Berkas lengkap pada Belum lengkap membuka daftar kekurangan, tidak memanggil R17 lingkup dokumen (`render-card.tsx` `makeFull`: `!allowed` -> tampilkan daftar).
- A8: isi tampil sebagai lembar bernomor (bukan JSON); klik/Enter membuka sunting; simpan mewajibkan Apa/Mengapa/Dampak (`ChangeSheet`).
- A9: gambar = unggah R18 lalu `replace` pid sama; tanpa medan ukuran.
- A10: 409 SCOPE_CONFLICT -> dialog dua teks + tiga pilihan.
- A11: semua tautan berkas lewat `fileUrl`; Word hanya Unduh.
- A16: grep `fetch(` / `class ...Error extends Error` di area baru = 0 (hanya `api.ts` lama).
- Render dengan sesi nyata TIDAK diverifikasi di peramban (tanpa sesi uji) -> E2E SR-52.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Curl bersesi tidak tersedia | 1 | tidak ada sesi uji; membuat cookie sesi ditolak izin | tipe dari kode route; verifikasi E2E SR-52 | tidak |
| 1 galat tsc di luar area | 0 | `benchmark/extract/convert_v2.ts` (baris lain) | dicatat | tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | Bentuk respons tidak dapat di-curl bersesi | Diketik dari kode route yang sudah mendarat + register §12 |
| 7 | Sunting menyimpan `runs` berpenanda makna, bukan md-lite | Hindari tafsir ganda; sup/sub didukung |
| 7 | Sumber gambar dibuat WAJIB | Skema `ImageV2.source` wajib (spesifikasi W7 menyebut opsional) |
| 7 | Gambar mini di Lembar baca tidak ada | R18 tidak menyajikan berkas aset; kartu + "Lihat di PDF"; permintaan R18 |
| 5 | Kunci dokumen misi dari judul | Agar dua dokumen bertemplat sama dalam satu misi tidak tergabung (bawaan `docKey` = slug templat) |
| 6 | R17 sinkron (tidak ada endpoint status job) | Muat ulang kepala 2/4/8 s bila job QUEUED/RUNNING, hanya saat tab terlihat |
| 5 | R04 ringkas (tanpa slot/berkas) | Rel per baris via R15; status berkas di daftar diganti status pemeriksaan; permintaan R04 |
| 8 | `diff-view.tsx` memuat "alamat"/"Revisi" | Dipakai ulang sesuai brief; dicatat untuk FIX-4b |
| 9 | Boundary lama `edit/error.tsx`, `revisions/error.tsx` | Tidak dihapus (T-11); rute kini hanya mengalihkan |

## Next Steps
- Permintaan lintas pemilik (7 baris `file_requests.md`).
- E2E SR-52 dengan sesi USER/ADMIN (A6-A11, A14, A15); review recommended (senior-code-reviewer, area SR-30).
