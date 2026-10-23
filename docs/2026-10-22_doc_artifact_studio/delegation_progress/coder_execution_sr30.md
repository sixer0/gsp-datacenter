# SR-30 — UI Dokumen (coder-execution, 2026-10-23)

Status: complete (gerbang D-133). Skills: frontend-integration, frontend-design, dry-run-verify-fix. Laporan baris: `implementation/sr30_document_ui.md`.

Berkas (area eksklusif): `src/components/studio/document-viewer/` baru `doc-model.ts`, `doc-api.ts`, `doc-context.tsx`, `render-card.tsx`, `completeness-tab.tsx`, `history-tab.tsx`, `create-document-dialog.tsx`, `reader/{reader-tab,blocks,slot-view,paragraph-editor,paragraph-history,dialogs}.tsx`; tulis ulang `index.ts`, `studio-home.tsx` (W1), `document-list.tsx` (W5), `document-viewer.tsx` (kerangka + tab), `meta-panel.tsx` (kepala W6), `address-tree.tsx` (daftar isi W7), `output-files.tsx` (W9); `src/app/studio/page.tsx`, `documents/page.tsx`, `documents/[id]/page.tsx`; `edit/page.tsx`, `revisions/page.tsx`, `revisions/[rev]/page.tsx` = pengalihan (T-11, tidak dihapus). `api.ts`, `feedback.tsx`, `labels.ts`, `studio-subnav.tsx`, boundary `error.tsx` lama tidak diubah.

Isi: W1 Beranda (perlu perhatian, baru lengkap + Buka PDF/Unduh, templat, chip mesin cetak); W5 per misi + rel per baris + filter URL + `?buat=1` + dialog Buat dokumen (D-153); W6 kepala + rel md + kartu Buat berkas (penuh hanya `fullRenderAllowed`, aria-disabled + daftar kekurangan, draf bab/bagian) + tab Kelengkapan; W7 Lembar baca TERANG (D-164) + sunting di tempat (runs berpenanda makna) + lembar perubahan + ganti/sisip gambar (R18) + sisip/pindah/hapus (K-4) + konflik awam (K-5) + buang (K-7); W8 Riwayat dokumen + per paragraf (`text-diff`, `diff-view` dipakai ulang); W9 Berkas + dialog pratinjau (`fileUrl`; Word hanya Unduh).

Penjaga:
- `npx tsc --noEmit -p tsconfig.json`: 0 galat di area; 1 galat di luar area (`benchmark/extract/convert_v2.ts(290,39)` TS2353).
- `npx eslint --max-warnings=0 src/components/studio/document-viewer src/app/studio/documents src/app/studio/page.tsx`: exit 0.
- Asap curl :9021 (server yang sudah berjalan): `/studio`, `/studio/documents`, `?buat=1`, `/studio/documents/cmw1sampel` (+`?tab=riwayat`, `/edit`, `/revisions`, `/revisions/3`) semua 307 -> `/login?next=...` (tanpa sesi, wajar).
- Glosarium §1.2: skrip pindai string + teks JSX area: `files=28 texts_checked=347 HITS=0`.
- Asap logika murni `npx tsx sr30_smoke.ts` (scratchpad): 16/16 PASS (runs<->teks bolak-balik, rel 8 segmen + aria awam, label kekurangan, lingkup awam, golongan berkas, kunci misi).

Keputusan: tipe klien diketik dari kode route yang sudah mendarat (curl bersesi tidak tersedia; tanpa sesi semua route 401 `{"error":"Unauthorized"}`); sunting menyimpan `runs` (bukan md-lite); Sumber gambar WAJIB (skema `ImageV2.source` wajib; spesifikasi menyebut opsional); kunci dokumen misi dari judul (agar dua dokumen bertemplat sama dalam satu misi tidak tergabung); R17 sinkron -> "polling" = muat ulang kepala 2/4/8 s bila job masih berjalan; tujuan gulir di URL `&ke=`.

Permintaan lintas pemilik: 7 baris di `file_requests.md` (R04 ringkasan slot+berkas, R07 `changeScope`, DTO berkas `draft`, R18 pratinjau aset, Sheet lebar, tipe rel, `diff-view` memuat "alamat").

Temuan: render sesi nyata tidak diverifikasi di peramban (tanpa sesi uji) -> E2E SR-52; review recommended (senior-code-reviewer: area SR-30).
