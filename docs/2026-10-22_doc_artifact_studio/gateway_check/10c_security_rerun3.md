# SR-57 siklus 3 — Security review delta setelah 10:05 (D-305 M-2)

| Medan | Isi |
|---|---|
| Baris | SR-57 (ulang 3). Delta: FIX-S2 (D-290), FIX-U2, FIX-Z, FIX-SERAH (D-302), FIX-2 (D-308), FIX-C2 (D-300/301), FIX-A2, FIX-B2, FIX-H (D-303), multipart/traversal (D-306) |
| Agen / skill | `security-review` / `security-review-gate` |
| Tanggal | 2026-10-23 |
| Laporan sebelumnya | `10_security_rerun.md`, `10b_security_rerun2.md` (keduanya tidak ditimpa) |
| Batasan yang dipatuhi | Review-only, 0 perubahan `src/**`/`prisma/**`/`scripts/**`. Tidak ada tulis atau baca DB. Uji dinamis hanya di `127.0.0.1:9021`, **tanpa cookie apa pun** (tidak ada cookie palsu) dan tanpa sesi. Port 9011 tidak disentuh. Tidak ada panggilan keluar. Tidak ada rahasia dikutip |
| Status | **complete**: vonis PASS, tanpa CAUTION/FAIL |

## 1. Ringkasan

**Vonis: PASS.** 0 High, 0 Medium, 0 Low baru, 3 Info.

Berkas yang direview: 72 berkas berubah sejak laporan siklus 2 (10:05), yaitu `src/**` dan `scripts/parity/**`, ditemukan dengan `find -newer`.

- **XSS di HTML pembungkus baru (FIX-2/FIX-SERAH): tidak ada.** Teks templat bersama (`engine/front/texts.ts`) dan isi agen semuanya lewat `escapeHtml`, run `t` ter-escape (`html/blocks/inline.ts:74`), atau `attr()`. Rinciannya di §3.
- **Pratinjau R08 (FIX-S2):** S2-01 tertutup. Draf templat USER kini dicek hak simpan penuh (`checkTemplateWrite` + `assertAdminOnlyFields`) sebelum dipratinjau.
- **Rate limit (FIX-S2):** S2-03 tertutup. Setiap panggilan R08 dihitung (120/menit, ember terpisah). PATCH pid kini selalu kena limiter render.
- **Injeksi lewat medan internal:** `keyRowOnPage` ditolak pada input agen di v1 (`{not:{}}`) maupun v2 (`additionalProperties: false`). Medan `field` DOCX dibatasi enum `PAGE|NUMPAGES`.
- **Pembacaan berkas:** tidak ada pembacaan berkas baru dari masukan. Aset raster templat tetap lewat path terbatas (L-06). Nama berkas multipart diabaikan dan disimpan per sha (D-306).
- **Masih terbuka dari siklus 2 (tidak berubah):** S2-02 (IP-68 laten, backlog). S2-04 (kuota aset lunak + ember agen bersama) diterima controller di D-255, dan keputusan user diminta lewat laporan akhir (D-280).
- **Tingkat review: L3.** Dimensi GDPR/ISO tidak berubah dari siklus 2: tidak ada pemrosesan PII baru di delta.

## 2. Status temuan terbuka siklus sebelumnya

| ID | Status | Bukti |
|---|---|---|
| S2-01 hak draf R08 | **Tertutup** | `src/app/api/studio/validate/_shared/template-draft.ts:190-205` (`checkTemplateWrite` + `assertAdminOnlyFields`) dan `:308-330` (perubahan per kunci `diffEffective` pada lapis templat dan slot, roleFormats khusus ADMIN, `isPreset` dari base). Isu → `valid:false` tanpa pratinjau. Restriksi D-98 tetap ada (`:113`, `:193`) |
| S2-03 rate limit R08 | **Tertutup** | `validate/_shared/validate-rate.ts:22-60` (120/60 s per identitas terautentikasi `renderRateIdentity`, bukan `agentId`), dipanggil di `validate/route.ts:439`. `?preview=html` juga tetap dihitung ember render (`:444`) |
| S2-02 IP-68 | Terbuka (Low laten, backlog) | Tidak berubah; jalur render artefak tetap hanya oleh pembuat |
| S2-04 kuota aset | Terbuka (Low; **diterima controller D-255, keputusan user via laporan akhir D-280**) | Tidak berubah |
| N-01..N-08, F-065..F-068 | Tetap tertutup | Fungsi terkait masih ada dan tidak melemah: `render/common.ts:208-216` (F-068), `revisions/v2/commit.ts` (N-01), `submit/meta.ts:20-28` `fillerOf` (N-04, kini satu helper untuk semua jalur tulis v2, `commit.ts:208-211`) |

## 3. Pemeriksaan delta per area

| Area | Hasil | Bukti |
|---|---|---|
| HTML pembungkus (teks templat + isi agen) | PASS | `engine/html/blocks/wrapper.ts`: judul sampul dari `meta.title` → run → `inlineHtml` (`:276-285`); kicker/label TOC dan pembatas bagian dari `texts.ts` → `escapeHtml` (`:353,355,425,470`) atau run `t` (`:399,412,415`); tabel blok kendali dan kolofon otomatis dari meta → `runText` → `inlineHtml` (`:128-139,222-235`); halaman TOC `escapeHtml` (`:438`). Penyusunan elemen lewat `el()` + `attr()` (`html/blocks/common.ts:37-39`). Data URI logo/aset memakai MIME hasil sniff dan base64 yang divalidasi pola (`html/blocks/device.ts:46-61`, `html/tables/svg.ts:296-301`). `engine/front/texts.ts` dan `apparatus.ts` murni (tanpa I/O, tanpa HTML) |
| DOCX pembungkus (FIX-2/FIX-SERAH) | PASS | Teks lewat `textXml` → `escapeXml`/`escapeXmlStrict` (`docx/package/xml.ts:356-361`). `w:fldSimple` hanya untuk `field` ber-enum `PAGE|NUMPAGES` (`contract/schema/common.schema.ts:282`; `docx/blocks/runs.ts:78-80` literal) |
| Kiriman bertarget / upsert misi R04 (FIX-S2) | PASS | `services/ingest/v2.ts:220-239` memilih patokan dokumen yang ada. `:273-293` resolve versi **tersemat** + `assertTemplateUsable`. `:728-795` gabung lalu digerbang lewat layanan kiriman (gerbang bersama di transaksi, D-261); dry-run memakai `dryRunDocumentV2` READ ONLY |
| Pratinjau R08 (eskalasi hak) | PASS | Lihat S2-01 |
| PATCH pid (FIX-U2 reader) | PASS | `documents/[id]/paragraphs/[pid]/route.ts:110-112` limiter selalu aktif. UI reader memanggil PATCH lalu R17 lewat `studioRoutePath` (`components/studio/document-viewer/doc-api.ts:73-90`); otorisasi tetap di server |
| BlockMenu portal (FIX-U2) | PASS | `reader/reader-tab.tsx:248-275`: `createPortal` dengan elemen React (label sebagai teks, tanpa `dangerouslySetInnerHTML`). grep `dangerouslySetInnerHTML\|innerHTML\|eval(\|new Function` di `components/studio` = 0. Pratinjau tetap `<iframe sandbox="">` (`playground/panels.tsx:180-188`, `template-preview/index.tsx:326-328`) |
| Medan internal `keyRowOnPage` (FIX-Z/FIX-B2) | PASS | `contract/schema/diagram.schema.ts:103` `{not:{}}` (v1). v2 `DIAGRAM_SPEC_V2` `additionalProperties:false` (`contract/schema/v2/common.schema.ts:150-162`). Hanya ditulis compose (`services/compose/blocks.ts:461`). Dampak bila terlewat hanya tampilan (kunci SVG tidak digambar) |
| `services/inline-format/policy.ts` | PASS | Daun murni (`:12-20`). `allow` tetap diturunkan untuk pemanggil tak tepercaya (`effectiveInlinePolicy`, `render/common.ts:208`) |
| SQL / proses | PASS | `ingest/repository.ts:152,266` `$executeRaw` bertag. grep `queryRawUnsafe\|executeRawUnsafe\|shell: true` di `src/lib/studio` dan `scripts/parity/run` = 0. Harness Python FIX-H tanpa `subprocess`/`eval` (grep 0) dan alat dev lokal, bukan permukaan server |
| Multipart / traversal (D-306) | PASS | Nama berkas tidak dipakai; `relPath` dari sha (`services/images/asset-store.ts:189`). Probe 9021 multipart anonim dengan `filename=../../etc/passwd` → 401 |

## 4. Informasional

| ID | Pokok |
|---|---|
| I-1 | `checkValidateRate` dihitung setelah badan dibaca (`validate/route.ts:430-439`), sehingga badan JSON hingga 5 MiB tetap diurai sebelum 429. Pola ini sama dengan route kiriman lain dan sudah diterima sejak FIX-1, bukan regresi |
| I-2 | Uji permanen N-01 (catatan siklus 2) masih tercatat di SR-45 lanjutan (D-280). Tidak diperiksa ulang di sini |
| I-3 | `scripts/parity/**` (FIX-H) membaca berkas keluaran lokal untuk pembandingan. Ini alat pengembang yang tidak dipanggil server HQ, dan tidak berpengaruh pada permukaan serang |

## 5. Hasil gerbang (security-review-gate, 5 cek)

| Cek | Hasil | Rincian |
|---|---|---|
| Credential Leak | PASS | Tidak ada pola kredensial baru di 72 berkas delta |
| Destructive Operation | PASS | Tidak ada handler DELETE/`deleteMany` baru |
| External Call | PASS | Tidak ada panggilan keluar baru |
| Injection | PASS | HTML/XML ter-escape, SQL bertag, tanpa shell. Medan internal ditolak skema |
| Permission Escalation | PASS | Hak draf R08 = hak simpan. Gerbang versi tersemat untuk R04 bertarget/upsert misi. F-068/N-01 utuh |

**Keseluruhan: PASS.**

## 6. Log dan bukti

| # | Waktu | Lingkup | Level | Hasil | Keputusan | Peninjau |
|---|---|---|---|---|---|---|
| 1 | 2026-10-23 | SR-57 siklus 1 | L3 | CAUTION | User: perbaiki semua (D-247) | security-review |
| 2 | 2026-10-23 | SR-57 siklus 2 | L3 | PASS (4 Low) | S2-01/S2-03 → FIX-S2; S2-04 → user (D-280) | security-review |
| 3 | 2026-10-23 | SR-57 siklus 3: delta 72 berkas setelah 10:05 | L3 | PASS (0 Low baru, 3 Info) | Tidak perlu keputusan user di luar S2-04 yang sudah dijadwalkan | security-review |

- `npx vitest run tests/unit/studio/security tests/unit/studio/api-structure tests/unit/studio/api`: 21 berkas, **620/620 lulus**.
- 9021 tanpa cookie: 21 route x GET/POST/PATCH = **63/63 → 401**. `x-internal-secret` salah → 401. Multipart anonim dengan nama traversal → 401. `/studio` → 307 `/login?next=%2Fstudio`. `/.//evil.com` → 308 same-origin. `/login` → 200.
- Pembacaan kode dengan rujukan `berkas:baris` di atas.

Tidak ada rahasia yang dikutip dalam laporan ini.
