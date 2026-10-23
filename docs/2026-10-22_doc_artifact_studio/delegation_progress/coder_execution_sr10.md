# SR-10 repositori struktur (coder-execution)

Status: complete (gerbang D-133). Skills: backend-execution, dry-run-verify-fix.

Berkas BARU `src/lib/studio/services/structure/`: `index.ts` (ekspor I47), `types.ts` (`StructureRows` + baris M14-M17, `SlotRowSpec`, galat invarian/integritas), `pid.ts` (pid acak 50 bit, berbenih KD-22, `bab-k`/`lamp-k`, `dbPidAllocator`), `rows.ts` (murni: `rowsFromSource` <-> `rebuildSource`, sha lingkup KD-13, `carryFillStamps`, `attachInternal`, `validateRows`, `computeStructureSha256`), `repository.ts` (`writeRevisionRows` M14-M17 salinan penuh + M18 buat/pensiun + tulis ganda M06; `readRows`; `syncIdentities`), `snapshot.ts` (`rebuildSnapshot`/`verifyReconstruction` cek sha, `projectContent`/`projectContentDetailed` R20, seam `setSnapshotRecomposer`), `log.ts` (JSONL harian `logs/structure`).

Bukti:
- `npx tsc --noEmit -p tsconfig.json`: 0 galat di area; 9 galat di luar area (baris paralel belum selesai): chapters/_shared/submit-kit.ts + documents/route.ts (modul submit SR-13 belum ada), paragraphs/[pid]/route.ts (patchPid/pidHistory SR-14), templates/index.ts x3 (loadResolvedTemplateV2File SR-07), engine/docx/assemble/index.ts (hostCellRole SR-16), services/render/scope.ts (SR-15).
- `npx eslint src/lib/studio/services/structure`: exit 0.
- Asap transaksi-rollback (`npx tsx <scratchpad>/sr10_smoke.ts`): current_database = gsp_agent_hq_v21; E1 rev 1: M14 7, M15 3, M16 3, M17 8, M06 8, M18 14; alamat F:cover, F:controlSheet, F:signature, 1.1.1, 2.1.1, 2.1.2=Tabel 2.1, F:references/1, A.1.1; sha tersimpan = sha rekonstruksi `da06a90e…5e38e2` (sama), blockMismatches 0; proyeksi bab 2 tanpa pid = kiriman E1 (true), pid bab-2 + section + 2 blok ada dan cocok baris; pid klien `s1-tujuan-1` dipertahankan; proyeksi penuh = sumber; slot tak dikenal SLOT_UNKNOWN, bab 9 ADDRESS_NOT_FOUND; rev 2 (tabel dihapus): 0 identitas baru, 1 pensiun (retiredRevisionNo 2), sha rekonstruksi sama, cap bab 1 diwarisi dan bab 2 baru; pakai ulang pid pensiun -> PID_CONFLICT. Hitungan 8 tabel sebelum = sesudah (M14-M18 0, StudioBlock 446, revisi 3, dokumen 3); 0 baris tersisa.

Keputusan (perlu dicatat controller):
1. `StructureRows` didefinisikan di `structure/types.ts`; compose SR-08 mengimpornya (file_requests).
2. `dbPidAllocator` asinkron (`Promise<TrackingPidAllocator>`; memuat pid M18), `next` tetap sinkron (T2-55). Deviasi tanda tangan I47.
3. `readRows`/`rebuildSnapshot`/`projectContent` menerima `db` opsional ketiga (klien transaksi). `projectContent` mengembalikan nilai `content` R20 (I47 `unknown`); metadata lewat `projectContentDetailed`.
4. Rekonstruksi tanpa compose: `source` dibangun ulang dari baris menggantikan `source` tersimpan lalu sha dibandingkan + cek pid/alamat/label terhadap `snapshot.blocks`. Compose ulang penuh aktif setelah SR-08 mendaftarkan `setSnapshotRecomposer`. Snapshot norm/v1 memerlukan recomposer (dicatat untuk SR-37).
5. Baris slot tak-berulang: `filled` = payload memuat medan selain `type`; baris M17 `F:` hanya bila filled; pid baris slot diwarisi per alamat dari `prev`. Intro bab = M16 `sectionNo 0` dengan pid bangkitan (diwarisi dari prev).
6. Tulis ganda M06 tanpa isi internal memakai konten v2 + log warn (asap memakai isi internal tiruan).

Temuan: risiko `stripIds` rekursif di compose (id simpul diagram/register/part = data) -> file_requests SR-08. Permintaan lintas pemilik: 2 baris non-blocking di file_requests.md.
