# SR-14 layanan revisi v2: op per pid, op struktur, riwayat pid (coder-execution)

Status: complete (gerbang D-133). Skills: backend-execution, dry-run-verify-fix.

Berkas BARU `src/lib/studio/services/revisions/v2/`: `body.ts` (validasi R16/R14; fragmen lewat pembungkus chapter/slot/doc v2 + `classifySchemaV2Errors`, D-172), `tree.ts` (lokasi pid di pohon v2), `ops.ts` (op per jenis identitas, `PID_OP_KIND`, `newPid`, `PID_CONFLICT`), `structure-ops.ts` (reorder, omitSlot, restoreSlot, setOutline, setMeta, renumberChapters ADMIN, templateVersion), `rows.ts` (identitas M18, linimasa per revisi, cek lingkup §9.2), `history.ts` (`pidHistory`, `addressMapOf`), `commit.ts` (D-98 gerbang templat -> `validateStructure` -> `composeV2` -> `rowsFromSource` + cap pengisi -> `computeCompleteness` -> revisi -> `writeRevisionRows` -> dokumen), `service.ts` (`patchPid`, `patchStructure`, `patchAddressV2`, `isV2Document`).
UBAH `revisions/index.ts`: ekspor I50 + tipe; `patchBlock` (R06) pada dokumen norm/v2 -> alamat dipetakan ke pid di `baseRevisionNo` -> op pid (KD-23, tanpa REVISION_CONFLICT). Jalur v1 tidak berubah.

Bukti:
- `npx tsc --noEmit -p tsconfig.json`: 0 galat di `services/revisions`; 167 galat di luar area (baris paralel: `components/studio/**` UI, `api/studio/chapters/_shared/submit-kit.ts`, `api/studio/documents/route.ts`). Galat route R16 (`patchPid`/`pidHistory` belum ada) kini hilang.
- `npx eslint src/lib/studio/services/revisions`: exit 0.
- Asap transaksi-rollback `npx tsx <scratchpad>/sr14_smoke.ts`: current_database = gsp_agent_hq_v21; 20/20 PASS: replace pid -> rev 2 pid + alamat 1.1.2 sama; move 1.1.1 -> 2.1.2 dengan addressMap {1.1.1:2.1.2, 1.1.2:1.1.1, 1.1.3:1.1.2}; paragraf -> gambar pid tetap (type image, Gambar 1.1, rebased 2->3); SCOPE_CONFLICT pid sama dari base lama; PID_NOT_FOUND; PID_OP_KIND; PID_CONFLICT; insertBefore newPid; R06 alamat -> jalur pid; setOutline (INCOMPLETE content:3); setMeta cermin judul; SCOPE_CONFLICT struktur; pidHistory; delete memensiunkan pid. Hitungan 6 tabel sebelum = sesudah (0 baris tersisa).

Keputusan (perlu dicatat controller):
1. Pohon revisi n dibangun ulang dari baris (`readRows` + `rebuildSource`, SR-10); bab tersentuh digabung ulang lewat `mergeSubmission` compose (aturan pid §10 satu sumber; impor `submit/pids` dibatalkan karena SR-13 menghapusnya).
2. `structureSha256` = `computeStructureSha256` SR-10. SR-12/SR-13 wajib menulis kolom ini dengan fungsi yang sama; bila tidak, cek konflik struktur menganggap null != nilai sebagai perubahan.
3. `schemaId` revisi PATCH = milik revisi dasar (KD-10), kecuali migrasi v1 berbaris -> `studio.doc/v2` (D-196).
4. omitSlot membuang isi slot dari revisi baru (KD-08, tanpa baris M14); restoreSlot tanpa `position` menaruh slot menurut posisi kerangka.
5. `to.section.at` 1-based (len+1 = akhir); sectionNo 0 = intro.
6. (Diubah D-196) Revisi norm/v1 BERBARIS struktur (backfill SR-37) disunting lewat jalur v2 (amplop dari snapshot v1 + baris); revisi baru `schemaId` `studio.doc/v2`, snapshot norm/v2; R06 ikut jalur pid (`isV2Document` = norm/v2 atau v1 berbaris). Hanya v1 TANPA baris -> 400 `legacyRevision` (pesan menyarankan backfill); R06 v1 tanpa baris tetap jalur lama.
7. R06 v2 merender hanya bila `render` diminta (KD-27); jalur v1 tetap selalu merender.
8. Riwayat pid = entri saat muncul/berubah isi/berpindah alamat/pensiun (bukan setiap revisi).
9. `patchPid`/`patchStructure`/`patchAddressV2` menerima `opts.tx` opsional (transaksi pemanggil; render dilewati) dan memvalidasi ulang badan sendiri.
10. setMeta `docNumber` bentrok -> 409 DOC_NUMBER_EXISTS (unik DB).

Permintaan lintas pemilik: tidak ada yang blocking. Review direkomendasikan (lingkup: `services/revisions/v2/**`, jalur v2 di `patchBlock`).

D-196 (susulan): asap diulang 24/24 PASS (tambahan: v1 + baris via `writeRevisionRows` -> PATCH pid -> rev 2 schemaId studio.doc/v2, snapshot norm/v2, pid + alamat 1.1.2 tetap; R06 jalur pid pada dokumen termigrasi; v1 tanpa baris -> 400 legacyRevision); 0 baris tersisa; tsc area 0, eslint area 0.
