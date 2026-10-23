---
task_slug: doc_artifact_studio
row: FIX-U2 (loop perbaikan siklus 3, D-290)
date: 2026-10-23
agent: coder-execution
source: test/06_e2e_session.md (SR52-F1..F5)
status: complete
---

# FIX-U2: perbaikan temuan sesi E2E Studio (SR52-F1..F5)

Area eksklusif: `src/components/studio/**`, `src/app/studio/**`. Tidak ada berkas yang dihapus. Penulisan lewat berkas sementara lalu rename (atau Edit). Skill yang dipakai: receiving-code-review, frontend-integration, accessibility-review, dry-run-verify-fix.

## Langkah dan hasil

| # | Temuan | Perbaikan | Status |
|---|---|---|---|
| 1 | SR52-F1 MAYOR: "Buat ulang berkas lengkap" mengirim `render` di badan PATCH (D-247), lalu 400 dan suntingan hilang | `reader-tab.tsx` `doSave`: badan PATCH tanpa `render`. Bila PATCH sukses, opsi dicentang, dan `completeness.fullRenderAllowed`, dipanggil `rebuildFullFile()` = `POST /api/studio/documents/{id}/render` `{scope:"document", formats:["docx","pdf"], revisionNo}` (R17, `renderDocument` yang sudah ada). Status awam: "Berkas lengkap sedang dibuat…" lalu "berkas siap / sebagian / sedang dibuat / gagal". Galat render tampil sebagai notifikasi peringatan "Perubahan tersimpan, tetapi berkas lengkap belum dibuat. <judul>. <isi>" (`errorMessages`). Editor sudah ditutup karena suntingan tersimpan, jadi penolakan render tidak menghapusnya. Dokumen belum lengkap: "Perubahan tersimpan. Berkas lengkap belum dibuat karena dokumen belum lengkap." `PatchPidBody` (doc-model) tidak lagi punya medan `render`, sehingga regresi tertangkap tsc | selesai |
| 2 | SR52-F2 MAYOR: menu "Tindakan lain" tertutup aside "Daftar isi" pada 1440 px | Akar masalah: `<section>` bab memakai `content-visibility: auto` (penahanan paint), jadi menu dan talang tombol (`-left-9`) terpotong. Selain itu `main.page-enter` HQ ber-`transform`, yang menggeser acuan `fixed`. Perbaikan: (a) menu dirender lewat `createPortal(document.body)` dengan `position: fixed` dari `getBoundingClientRect` tombol, membuka ke kanan (ke lembar), berbalik ke kiri atau atas bila ruang kurang, dan posisi diperbarui saat scroll/resize (capture); (b) kotak `<section>` bab dilebarkan (`-mx-3 px-3 lg:-ml-12 lg:pl-12`, isi tidak bergeser) agar talang Sunting/Tindakan lain terlihat; (c) talang tetap tampil selama menu terbuka (`onOpenChange`); (d) pola tombol menu WAI-ARIA: buka lalu fokus ke item pertama, panah atas/bawah/Home/End, Escape/Tab menutup dan fokus kembali ke tombol (fokus dikembalikan sebelum menu ditutup) | selesai |
| 3 | SR52-F4 (A2): Riwayat menampilkan `chapter:3` / `create;chapter:3` / `agent:<id>` mentah | `shared/labels.ts`: `actorLabel` ("agent:x" jadi "Agen x", "user:x" jadi "x", kosong/system jadi "Sistem"), `isChangeScopeCode`, `changeScopeLabel(scope, resolvers)` (tata bahasa register §9.5, termasuk `rebase`), `changeImpactLabel`, `changeWhatLabel` (teks otomatis "Kiriman slot X oleh agent:y" menjadi "Kiriman <label bagian> oleh Agen y"). `doc-model.changeScopeLabel` kini mendelegasikan ke label bersama (`scopeResolvers`). Dipakai di `history-tab.tsx` (pelaku, Apa, Dampak; nilai mentah dipindah ke InfoTeknis ADMIN), `paragraph-history.tsx`, `completeness-tab.tsx`, `document-list.tsx`, `shared/completeness-rail.tsx` | selesai |
| 4 | SR52-F3: swatch "Warna aksen" hitam untuk nilai registri `B45309` | `template-editor/model.ts` `colorSwatchValue()` menerima `RRGGBB`, `#RRGGBB`, `RGB`, dan `#RGB`. `essential-knob.tsx`: swatch memakai nilai yang dinormalisasi. Saat diubah, format tulis mengikuti nilai saat ini (bawaan format registri tanpa `#`) | selesai |
| 5 | SR52-F5 (A14): kontras `--text-3` | `shared/studio-tokens.css`: `.studio-root { --text-3: #8a8d93 }`, yaitu 5,92:1 (bg), 5,68:1 (surface-1), 5,35:1 (surface-2), 5,12:1 (pil #1b1c1f), 4,90:1 (surface-3). Nilai ini tetap di bawah `--text-2`, jadi hierarki terjaga. Lembar baca terang tidak memakai token ini (`--studio-ink*`) | selesai (area Studio) |

## Berkas diubah

| Berkas | Jenis | Isi |
|---|---|---|
| `src/components/studio/document-viewer/reader/reader-tab.tsx` | ubah | F1 (PATCH lalu R17), F2 (menu portal + talang) |
| `src/components/studio/document-viewer/doc-model.ts` | ubah | `PatchPidBody` tanpa `render`; `scopeResolvers` + delegasi `changeScopeLabel`. Suntingan FIX-Z (D-294, `renderRefused` tipe lokal) dipertahankan |
| `src/components/studio/document-viewer/history-tab.tsx` | ubah | F4 label awam + mentah ke InfoTeknis |
| `src/components/studio/document-viewer/reader/paragraph-history.tsx` | ubah | `actorLabel` |
| `src/components/studio/document-viewer/completeness-tab.tsx`, `document-list.tsx`, `src/components/studio/shared/completeness-rail.tsx` | ubah | `actorLabel` untuk "diisi oleh" |
| `src/components/studio/shared/labels.ts` | ubah (aditif) | label pelaku dan lingkup perubahan |
| `src/components/studio/template-editor/model.ts`, `essential-knob.tsx` | ubah | F3 |
| `src/components/studio/shared/studio-tokens.css` | ubah | F5 |

## Bukti

| Uji | Perintah | Hasil |
|---|---|---|
| E2E sesi (skrip SR-52, tidak diubah) | `node tests/e2e/studio/run-session.mjs` | `HASIL: 94 PASS / 1 FAIL (95 cek, 55 tangkapan, 164 s)` (sebelumnya 87/8). Kini PASS: T.8 `{"value":"#b45309","label":"B45309"}`; E.incomplete.9 dan E.complete.9 `kode mentah=[]; label pelaku berprefiks 'agent:'=0`; E.A9.menu `kotak menuitem x=601..831; elemen di titik tengah = button[role=menuitem] 'Ganti dengan gambar'`; E.edit.2 `PATCH=200 patchMemuatRender=false render=200 job=SUCCEEDED rev 13->14 pesan='Berkas lengkap: berkas siap'`; CON.1 `0 tak terduga`; A14.2 `0` |
| axe W1-W9 | (dalam skrip E2E) | Area Studio serius/kritis = 0. Sisa A14.1: 63 node, semua `shell:true` (sidebar HQ "Overview/Content/Studio/Data/System/USER/All systems online", `#4b4e54`/`#6b6e74` pada `src/components/sidebar.tsx`), di luar area FIX-U2 dan pra-ada |
| Menu tetikus 1280/1440/1920 + keyboard | skrip scratch (fixture pengguna SR-52, dok 001 hanya dibaca, 0 sisa) | Di ketiga lebar: `btnHit=true hit=menuitem trialClick=true focusFirst=menuitem arrowDown='Sisipkan paragraf di bawah' escFocus='Tindakan lain untuk Paragraf 1.1.2' menusAfterEsc=0 keyboardOpenFocus=menuitem`; `pageerrors=0`; `cleanup users=2 residue users=0 documents=0` |
| Glosarium | `npx tsx scripts/studio/glossary-check.ts` | `files=125 texts_checked=2172 HITS_MAIN=0` (exit 0) |
| tsc repo | `npx tsc --noEmit -p .` | exit 0, 0 baris |
| eslint area | `npx eslint src/components/studio src/app/studio` | exit 0, 0 masalah |
| vitest | `npx vitest run tests/unit/studio` | `Test Files 60 passed (60) / Tests 1987 passed (1987)` |

## Masalah tersisa

| Masalah | Percobaan | Akar | Status | Memblokir? |
|---|---|---|---|---|
| A14.1 halaman utuh: kontras label grup sidebar HQ (2,35:1) dan "All systems online" (3,85:1) | 0 (di luar area) | `src/components/sidebar.tsx` memakai `--text-4`/`--text-3` global di shell HQ | diserahkan ke controller (berkas HQ non-Studio, perlu izin; pola IP-46) | tidak untuk area Studio |
| `meta-viewport` (moderat, `user-scalable=no`) | 0 | layout akar app, di luar area | dicatat | tidak (bukan serius/kritis) |
| `--text-4` di Studio (placeholder galeri, cap waktu `render-status/jobs.tsx` khusus ADMIN) di bawah 4,5:1 | 0 | token "ghost"; axe tidak melaporkannya di W1-W9 | dicatat untuk review | tidak |

## Keputusan dan isu

| Langkah | Keputusan | Alasan |
|---|---|---|
| F1 | `revisionNo` revisi hasil PATCH disematkan ke R17 | Berkas lengkap dibuat dari versi yang baru disimpan pengguna, bukan dari versi yang mungkin datang belakangan |
| F1 | Render berjalan setelah editor ditutup (tidak memblokir) | Suntingan sudah aman; hasil render tampil sebagai notifikasi dengan tindakan "Lihat berkas" |
| F2 | Portal ke `document.body`, bukan `.studio-root` | `main.page-enter` (`transform`, `animation-fill-mode: forwards`) menjadi acuan `fixed`. Pada run 1 menu tergeser +245 px (x=841 di 1440). Menu hanya memakai token global `:root` |
| F2 | `content-visibility` dipertahankan (kinerja dokumen panjang); kotak bagian dilebarkan | Perubahan minimal tanpa menurunkan kinerja W7 |
| F4 | Mentah tetap tersedia di InfoTeknis (ADMIN) | UX-01 §1.2: kunci teknis hanya di Info teknis |
| F5 | Token ditimpa di `.studio-root`, bukan di `globals.css` | Area eksklusif Studio; shell HQ tidak berubah |
| Koordinasi | doc-model.ts juga disunting FIX-Z (D-294) | Suntingan FIX-Z (tipe lokal `renderRefused`, baris 129) utuh. `reader-tab` tidak lagi membaca `renderRefused`/`job` dari respons PATCH |

Review disarankan: `reader-tab.tsx` (BlockMenu portal + alur rebuild) dan `shared/labels.ts`.
