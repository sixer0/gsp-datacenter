# S61 coder-execution: UI sunting per alamat dan riwayat revisi

Status: complete (penjaga kompilasi/lint lolos; uji browser hidup = S80).

## Berkas (20, semua baru)
- `src/app/studio/documents/[id]/edit/{page,error}.tsx`; `src/app/studio/documents/[id]/revisions/{page,error}.tsx`; `src/app/studio/documents/[id]/revisions/[rev]/page.tsx`
- `src/components/studio/revision/`: `api.ts`, `labels.ts`, `retry.tsx`, `inline-editor.tsx`, `block-editor.tsx`, `change-dialog.tsx`, `text-diff.tsx`, `job-status.tsx`, `diff-view.tsx`, `rerender-panel.tsx`, `edit-workspace.tsx`, `revisions-workspace.tsx`, `revision-viewer.tsx`, `route-error.tsx`, `index.ts`

## Fungsi
- Sunting: `?address=` (D-65, didekode Next) langsung memuat blok; datalist alamat dari pohon R05; cek klien D-54 (bab/seksi/F:/P:/butir/sub-artefak ditolak dengan pesan jelas; 400 server `addressKind` juga dipetakan); editor paragraf teks md-lite ATAU runs bersegmen (B/I/U/caps/posisi; face/size/color dipertahankan), sel (teks/runs/paragraf; gridSpan/vMerge tetap), label artefak (caption/sumber + JSON); operasi ganti/sisip sebelum/sesudah/hapus untuk C.S.P; dialog `<dialog>` modal apa/mengapa/dampak wajib; PATCH `baseRevisionNo`; 409 -> revisi pihak lain (apa/mengapa) + diff teks alamat ini + "muat ulang (buang draf)" / "muat ulang, pertahankan draf"; hasil = revisi baru, addressMap, job, berkas.
- Riwayat: tabel (no, tanggal, oleh, apa/mengapa/dampak, status rilis, alamat); bandingkan dua revisi lewat R07 `?from&to` (diffRevisions S56) per kelompok ubah/tambah/hapus/geser, sorot teks per kata (LCS) dari R06 `?rev=`; buka revisi lama hanya baca (`revisions/[rev]`: pohon R05 `?rev=`, isi blok, berkas); render ulang -> status job + berkas + lencana `identical`.
- Galat: pesan Indonesia per kode, coba ulang 3/6/12 dtk maks 3 dengan hitung mundur, `error.tsx` per segmen, log klien terstruktur (konsol; 4xx = warn).

## Bukti penjaga
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/(app/studio/documents/\[id\]/(edit|revisions)|components/studio/revision)"` -> kosong (grep exit 1).
- `npx eslint "src/app/studio/documents/[id]/edit" "src/app/studio/documents/[id]/revisions" src/components/studio/revision` -> exit 0 tanpa keluaran.
- `npx tsx <scratch>/s61_check.ts`: diffWords "100->120", "normal.->puncak." benar; checkEditableAddress 4 sah (block/artifact/cell/Turunan), 7 ditolak.

## Keputusan / deviasi
- Bentuk API diambil dari kode route S56 (R06, R07 + diff aditif `?from&to`) dan §6.2 R05; tidak ada uji curl hidup (HQ 9011 tidak berjalan; integrasi hidup = S80).
- Tipe `RevisionDiff` dicerminkan di `api.ts` (modul diff S50 server-only via barrel prisma).

## Permintaan
- `file_requests.md`: endpoint log klien `/api/studio/client-log` (tidak blocking).

## Temuan
- R05 `GET /api/studio/documents/[id]` (S55) kini ada dan mengembalikan `{ document, revision, tree, outputs, lint }` (cocok dengan `DocumentDetail` UI; `lint` diabaikan). Bila R05 gagal, UI turun anggun (alamat tetap dapat diketik; pohon revisi tidak tampil).
