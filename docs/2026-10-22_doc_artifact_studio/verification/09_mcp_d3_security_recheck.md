---
task_id: MCP-D3-SEC
task_slug: doc_artifact_studio
row: MCP-D3 security re-check (sempit)
date: 2026-11-02
agent: security-review
source: delegation_progress/coder_execution_mcp_d3.md; gateway_check/18_review_security_mcp_docs.md (F-1..F-3); D-480
status: complete
verdict: CAUTION
---

# Cek Ulang Keamanan MCP-D3 (F-1, F-2, F-3)

## 1. Ringkasan

| Butir | Nilai |
|---|---|
| Vonis keseluruhan | **CAUTION** (0 High, 2 Medium, 6 Low) |
| F-1 (galat server dibungkus `<data-tak-tepercaya>`) | **CAUTION**: jalur 409 utama benar. Jalur dry-run R08 masih membawa label dan isi pihak lain di luar blok tanpa `untrusted` (M-1). Ada residu Low (L-1, L-2) |
| F-2 (`DOCUMENT_OWNED_BY_OTHER` kecuali `adoptExisting`) | **CAUTION**: alat dokumen benar. Bisa dilewati lewat alat alias `studio_report_submit` dengan draf json (M-2). Identitas pemilik dinyatakan sendiri oleh pemanggil (L-4) |
| F-3 (`BASIS_MISSING` tanpa basis) | **CAUTION**: alat dokumen benar. Bisa dilewati lewat alias yang sama (M-2). Basis sesi tetap maju walau server melaporkan `rebased` (L-3) |
| Regresi baru | Tidak ada kebocoran rahasia/env. `safety.ts` hanya berubah tipe (tidak ada regresi path). Penanda penutup literal dinetralkan, tetapi beberapa varian lolos (L-2) |
| Uji | `npx vitest run tests/unit/studio/mcp`: 4 berkas, 84/84 lulus (dijalankan ulang 2026-11-02 10:32). Asersi uji D3 nyata (kanari, isi blok, 0 panggilan jaringan). Jalur M-1, M-2, L-1, L-2, dan L-3 tidak teruji |
| Ketidaksesuaian GDPR | 0. Dimensi dilewati, alasan di bawah |
| Celah kontrol ISO 27001 | A.9 PARTIAL (M-2, L-4), A.14.2 PARTIAL (uji jalur bypass belum ada, dok L-6) |
| Tingkat review | **L3** (audit mendalam: baca kode adaptor + sisi server yang diandalkan, probe `executeTool` dengan fetch tiruan) |
| Dimensi dilewati | GDPR/ISO 27701: lingkup sempit (adaptor MCP). D3 tidak mengubah pemrosesan PII: tidak ada medan, penyimpanan, atau aliran data pribadi baru. ISO A.10, A.13, A.16, A.18: tidak ada perubahan kripto, jaringan, insiden, atau kepatuhan di diff |

Metode: `git diff HEAD` untuk berkas terlacak. `doc-tools.ts` dan `tool-kit.ts` belum terlacak, jadi dibaca utuh. Rute server yang diandalkan guard juga dibaca: `documents/route.ts` GET, `submit/target.ts`, `pipeline.ts` checkBase, `validate/_shared/error-issues.ts`, dan skema `DocTargetV2`. Probe dijalankan di scratchpad, di luar repo: `executeTool` dengan fetch tiruan, tanpa jaringan, tanpa DB, tanpa port 9011, dan tanpa membaca `.env`. Rahasia uji bersifat palsu dan disensor dari keluaran. `src/lib/studio/engine/**` tidak disentuh. Tidak ada kode yang diubah.

## 2. Tabel Temuan

| ID | Severity | Tipe | Lokasi | Deskripsi | Remediasi |
|---|---|---|---|---|---|
| M-1 | Medium | OWASP LLM01 / CWE-1427 (injeksi prompt tidak langsung); F-1 belum tuntas | `scripts/studio/mcp/doc-tools.ts:270-283` (`dryRunOutput`), dipakai di `:633` (`studio_chapter_submit dryRun`) dan `:694` (`studio_slot_fill dryRun`); `scripts/studio/mcp/tools.ts:872-884` + `scripts/studio/draft-check.ts:247,263` (`studio_draft_check`, `studio_report_check` remote); sumber: `src/app/api/studio/validate/_shared/error-issues.ts:28`, `src/lib/studio/services/submit/pipeline.ts:553-565` | Dry-run R08 dengan `baseRevisionNo` lama menjalankan checkBase yang sama (`pipeline.ts:912-921`). R08 mengubah 409 `SCOPE_CONFLICT` menjadi isu `{ keyword, message: "... oleh agent:<label>", details: { changedBy, currentContent } }`. `dryRunOutput` mencetak `i.message` polos di teks (`:277`). `structuredContent.issues[].details.currentContent` (isi bab pihak lain) dinetralkan, tetapi TANPA `untrusted: true`/`untrustedFields`. Ini kanal yang sama dengan F-1 asli, lewat jawaban sukses. Probe P3a/P3b: `ok=true untrusted=undefined canaryOutsideBlock=true`. `studio_draft_check` remote juga mencetak pesan isu server di luar blok (probe d3b) | Perlakukan isi jawaban R08 sebagai isi server. Di `dryRunOutput`: pindahkan baris isu ke `untrustedBlock(..., { jenis: "isu-dry-run" })` dan tambahkan `untrustedFields(["issues", "issues[].details", "completenessPreview"])` (juga untuk `detail: true`). Di `studio_draft_check`/`studio_report_check`: bungkus baris isu remote dan tandai `untrusted` bila ada isu dari server |
| M-2 | Medium | CWE-639 + CWE-362 / OWASP A01, A04; F-2 dan F-3 dapat dilewati lewat alat alias | `scripts/studio/mcp/tools.ts:386-414` (`studio_report_submit`, toolset `reports`, aktif bawaan: `config.ts:119-122`); `scripts/studio/studio-report.ts:939-941` (submit: basis null), `:1148-1162` (`runSubmit` mengirim tiap blok apa adanya), `:1800` | `studio_report_submit { format: "json" }` menerima draf berisi blok `studio.chapter/v2` dengan target apa pun: `documentId` dokumen klien yang ada, atau `mission`+`docKey` milik agen lain, dengan templat klien (mis. `datum-gsp`). Blok itu dikirim ke R12 tanpa `baseRevisionNo` dan tanpa pra-cek pemilik GET R04. Probe d3c: untuk kedua bentuk target, `R12 dipanggil=true baseRevisionNo=undefined GET R04 pra-cek=false`, dan cek lokal lolos. Hasilnya sama dengan temuan asli: timpa diam-diam (last-writer-wins) dan pengambilalihan dokumen agen lain. Laporan kerja MD (`studio_report_submit` format md) atas misi+docKey laporan milik agen lain juga tidak diperiksa pemiliknya | Pilih satu: (a) di `studio_report_submit`, tolak blok bertarget `documentId`/`docNumber` (submit = buat baru; dokumen yang ada lewat `studio_report_update`, yang mewajibkan basis), lalu untuk tiap target `mission`+`docKey` jalankan `findMissionDoc` + `checkOwnership` + aturan basis yang sama dengan `preflightMission` sebelum `runReport`; atau (b) batasi draf json `studio_report_submit` ke templat `laporan-kerja-agen`, dan tolak bila dokumen misi+docKey sudah ada dan bukan milik pemanggil (atau sudah ada sama sekali, arahkan ke update). Tambahkan uji untuk kedua bentuk target |
| L-1 | Low | CWE-1427; F-1 residu (pesan server di baris kepala) | `scripts/studio/mcp/tools.ts:937-941` (`untrustedError` mensyaratkan `details`), `:1002` (asal server = ada cid), `:1019-1020` (`moveMessage`); `tools.ts:193-211` (`toToolError` tidak meneruskan `serverMessage` dari `ReportError`/`DraftCheckUsageError`); `scripts/studio/studio-report.ts:530`; `scripts/studio/draft-check.ts:187-188` | Pesan teks server tetap di baris kepala, di luar blok, bila: (1) galat server tanpa `details` (probe P1: `canaryOutsideBlock=true`, `untrusted=undefined`); (2) jawaban tanpa cid header/badan, sehingga dianggap galat MCP dan `details` ikut tak dibungkus (probe P2); (3) alat laporan memakai kode di luar `SERVER_TEXT_CODES` (pesan `ReportError` = `body.error` server; `REMOTE_ERROR` draft-check menempelkan `body.error`). Penelusuran pesan galat server (`grep StudioEngineError` di `services`) belum menemukan pesan tanpa `details` yang memuat teks pihak lain. Karena itu risikonya rendah hari ini, tetapi syarat D-480 ("pesan server di dalam blok") belum terpenuhi secara umum | Jadikan `serverMessage` syarat cukup: `serverContent = untrusted \|\| serverMessage \|\| (fromServer && details)`, `moveMessage = serverContent && (serverMessage \|\| SERVER_TEXT_CODES.has(code))`. Tentukan asal server dari `httpStatus` (jawaban HTTP ada), bukan dari ada/tidaknya cid. Di `toToolError`: `ReportError` dengan `info.httpStatus` dan pesan dari `httpFailureOf`, serta `DraftCheckUsageError` `REMOTE_ERROR`, diberi `serverMessage: true` |
| L-2 | Low | CWE-116 (netralisasi keluaran tidak lengkap); spoofing penanda | `scripts/studio/mcp/tool-kit.ts:211-213` (`neutralizeMarkers`) | Regex hanya menangkap `<` yang langsung diikuti `/?` dan spasi opsional. Probe P4: `</data-tak-tepercaya>`, `</ data-...>`, dan huruf besar dinetralkan. `< /data-tak-tepercaya>`, `<`+ZWSP+`/data-...`, versi fullwidth `＜/data-tak-tepercaya＞`, dan tanda hubung non-breaking (U+2011) lolos apa adanya. Penutup palsu yang mirip bisa membuat model mengira blok sudah selesai | Escape setiap `<` di isi blok (`&lt;`). Atau normalisasi NFKC, buang karakter format/zero-width, dan izinkan spasi sesudah `<` sebelum mencocokkan. Lebih kokoh: nonce acak per panggilan di atribut tag (`<data-tak-tepercaya n="x7f3">` … `</data-tak-tepercaya n="x7f3">`), disebut di catatan peringatan, sehingga isi tidak dapat menebak penutupnya |
| L-3 | Low | CWE-362 (lost update) residu F-3 | `scripts/studio/mcp/doc-tools.ts:242-246` (`rememberResult` selalu maju); bandingkan `nextBasisOf` di `studio-report.ts` (alat laporan tidak memajukan basis bila ada penulis lain di sela) | Basis sesi = revisi hasil kiriman sendiri, juga ketika server menjawab `rebased: true` (ada penulis lain di antara basis dan revisi terkini). Contoh: A buat (rev1), B ubah bab 1 (rev2), A isi slot dengan basis 1 (tidak bentrok, rev3, basis A = 3), lalu A kirim bab 1 tanpa basis eksplisit dengan basis 3. Perubahan B tidak memicu konflik dan tertimpa. Batas ini tercatat di `docs/STUDIO-MCP.md:264-265` dan sesuai rumusan D-480, tetapi perbaikannya murah | Jangan memajukan (atau lupakan) basis sesi bila `b.rebased === true`. Pertahankan basis lama agar kiriman berikut ke bagian yang diubah pihak lain mendapat 409 `SCOPE_CONFLICT` |
| L-4 | Low | CWE-290 / OWASP A07 (identitas dinyatakan sendiri); batas F-2 | `scripts/studio/mcp/doc-tools.ts:165-168,202-204`; `scripts/studio/mcp/tool-kit.ts:183-188`; `scripts/studio/mcp/config.ts:93-94` (kunci agentId mati bawaan) | Tanpa `STUDIO_MCP_LOCK_AGENT_ID`, pemanggil bebas mengisi `agentId` = id pemilik. Label pemilik justru ditampilkan di rincian `DOCUMENT_OWNED_BY_OTHER`. Dengan itu `createdBy === requesterOf(agentId)` dan F-2 lolos, dan tulisan tercatat atas nama agen lain. Dua pemanggil tanpa agentId sama-sama `anonymous-internal` dan saling dianggap pemilik. Ini model kepercayaan lama (rahasia bersama, server mempercayai agentId), bukan regresi D3. Akibatnya F-2 hanya melindungi dari salah ambil, bukan dari agen yang berniat | Untuk banyak agen per misi, wajibkan `STUDIO_MCP_LOCK_AGENT_ID=1` + `STUDIO_AGENT_ID` per proses (catat di STUDIO-MCP.md sebagai prasyarat F-2). Pertimbangkan: tanpa agentId efektif, perlakukan pemanggil sebagai bukan-pemilik untuk dokumen yang ada |
| L-5 | Low | CWE-1427 (hardening); jalur sukses lama | `scripts/studio/mcp/tools.ts:767-771` (`studio_render`: `errors`/`job` tanpa `untrusted`), `:854` (`finalFileName` header dicetak polos walau gagal pola C51); `scripts/studio/mcp/doc-tools.ts:561-562` (pesan isu/peringatan importer polos), `:829-830` (`lint` JSON + `finalFileName` di luar blok) | Teks asal server pada jalur sukses ini sudah ada sebelum D3. Isinya kebanyakan teks mesin atau isi milik pemanggil sendiri, jadi risikonya rendah. Namun jalur ini masuk lingkup "setiap jalur yang mengembalikan teks server" | Bungkus `errors` render dan pesan isu importer dalam blok bertanda (atau tandai `untrustedFields`). Cetak `finalFileName` hanya bila lolos `safeFinalName`. Pindahkan baris `lint` ke dalam blok status |
| L-6 | Low | ISO A.14.2 (dokumentasi tidak sesuai perilaku) | `docs/STUDIO-MCP.md:253-265,278-283`; `delegation_progress/coder_execution_mcp_d3.md:95` | Laporan coder menyebut celah balapan GET R04 -> R12 (dokumen dibuat pihak lain di sela pra-cek) "dicatat di STUDIO-MCP.md", tetapi `grep -i "balapan\|race"` tidak menemukannya. Kalimat "Pesan teks server ... ikut masuk blok" terlalu luas (lihat L-1) | Tambahkan batas balapan TOCTOU ke paragraf MCP-D3. Persempit klaim F-1 sesuai perilaku nyata, atau perbaiki L-1 lebih dulu |

## 3. Hasil Gerbang (security-review-gate)

| Cek | Hasil | Rincian |
|---|---|---|
| Credential leak | **PASS** | Semua teks dan `structuredContent` alat melewati `redactSecret` (`server.ts:123-124`). Log stderr juga disensor (`:72`). Galat baru (`DOCUMENT_OWNED_BY_OTHER`, `BASIS_MISSING`, `TOOL_INACTIVE`, `CHAPTER_INVALID`) tidak memuat env/rahasia. `TOOL_INACTIVE` hanya menyebut nilai `STUDIO_MCP_TOOLSETS` (bukan rahasia). Probe: rahasia uji palsu tidak muncul di keluaran |
| Destructive operation | **CAUTION** | Alat dokumen kini mencegah timpa tanpa basis (0 HTTP, teruji). Alias `studio_report_submit` json masih bisa menimpa bab dokumen klien tanpa basis (M-2). Dampaknya bisa dibalik lewat riwayat revisi. Tidak ada tulis berkas baru |
| External call | **PASS** | Panggilan baru hanya GET R04 `?mission=&docKey=&take=1` ke origin yang sama lewat `guardedFetch`. Kueri dirakit `URLSearchParams`. Tidak ada host baru |
| Injection | **CAUTION** | Tidak ada shell/SQL/eval. Injeksi prompt tidak langsung masih terbuka di dry-run R08 (M-1), baris kepala galat tertentu (L-1), dan varian penanda (L-2) |
| Permission escalation | **CAUTION** | Penulisan ke dokumen milik agen lain bisa lewat alias (M-2). Identitas pemilik dinyatakan sendiri bila kunci agentId mati (L-4). Gerbang toolset kini juga di `executeTool` (L-2 review 18, `tools.ts:977-979`): PASS |

Cek tambahan yang LULUS (bukan temuan):
- Bentuk target `studio_chapter_submit`: `documentId: ""` atau `docNumber: ""` + `mission` (MCP mengambil cabang id, server menganggap misi) ditolak server lewat skema `DocTargetV2` `minLength: 1` (`contract/schema/v2/common.schema.ts:376-384`), yang divalidasi sebelum tulis (`chapters/_shared/submit-kit.ts:163-165`). Target ganda -> `DOC_TARGET_AMBIGUOUS` (`submit/target.ts:26-40`). Misi tanpa docKey/templat -> MCP `INVALID_ARGUMENT` (gagal tertutup).
- Varian huruf/flag: ajv `strict`, tanpa koersi tipe, `additionalProperties: false` di tingkat atas. `adoptExisting` hanya `=== true`. `AdoptExisting` ditolak skema.
- Kecocokan misi: folder misi server berpola `^\d{4}-\d{2}-\d{2}[_-][a-z0-9][a-z0-9_-]{0,80}$` (`contract/schema/doc.schema.ts:167`), jadi `trim()` GET R04 (`documents/route.ts:85-94`) tidak bisa menimbulkan selisih spasi atau huruf. GET tanpa `archived` menyertakan arsip (`:219`). `FILTER_MAX` 200 > batas skema MCP 120.
- Kunci ingatan basis/adopsi = `documentId` server, dan tiap proses punya sesi sendiri. Basis dokumen lain tidak bisa dipakai ulang. `baseRevisionNo` eksplisit di atas revisi terkini ditolak server `REVISION_NOT_FOUND` (`pipeline.ts:481-484`).
- `requesterOf` cocok dengan `auth.ts:80-87` (trim, potong 80, `agent:` / `anonymous-internal`).
- Importer `?validate=1` hanya baca (`import/markdown/route.ts:9-13`). Dry-run R08 berjalan dalam transaksi READ ONLY.
- `safety.ts`: diff hanya menambah medan tipe `serverMessage?`/`untrusted?`; logika path tidak berubah, dan uji path/UNC tetap lulus.

## 4. Penilaian GDPR / ISO 27701

| Pasal / kontrol | Status | Temuan | Remediasi |
|---|---|---|---|
| GDPR Art. 5, 7, 15-17, 20, 25, 30, 32-33, 35 | N/A | Cek ulang sempit atas adaptor MCP. D3 tidak menambah medan, penyimpanan, retensi, atau aliran data pribadi. Isi dokumen klien (mis. nama pemegang tanda tangan) melewati adaptor seperti sebelumnya | Di luar lingkup. Ikuti penilaian privasi Studio induk |
| Inventaris PII | N/A | Tidak ada model/konfigurasi PII baru di diff | - |
| ISO 27701 / ISO 27001 A.18.1.4 | N/A | Tidak ada perubahan peran PII controller/processor | - |

## 5. Pemetaan ISO 27001 Annex A

| Kontrol | Status | Temuan | Remediasi |
|---|---|---|---|
| A.9 Kontrol akses | PARTIAL | Pemilik dokumen kini diperiksa di alat dokumen (F-2), dan toolset digerbang di `executeTool`. Alias M-2 melewati pemeriksaan itu. Identitas dinyatakan sendiri (L-4) | M-2. Kunci agentId untuk banyak agen (L-4) |
| A.10 Kriptografi | N/A | Tidak berubah | - |
| A.12.1 Prosedur operasional | OK | Perubahan dilacak lewat D-480, laporan coder, dan branch `v2.1` (belum di-commit, wajar untuk tahap review) | Commit sesudah keputusan atas temuan ini |
| A.12.4 Logging | OK | Log stderr tersensor, dan cid server/MCP ada di setiap hasil | - |
| A.12.6 Kerentanan teknis | OK | Tidak ada dependensi baru (laporan coder; diff tanpa perubahan paket) | - |
| A.13 Komunikasi | OK | Origin dikunci `guardedFetch`, pengalihan `manual` | - |
| A.14.2 Pengembangan aman | PARTIAL | 84/84 uji lulus. Asersi D3 nyata. Belum ada uji untuk dry-run R08 (M-1), alias (M-2), galat tanpa details/cid (L-1), varian penanda (L-2), dan `rebased` (L-3). Dok tidak sesuai di dua kalimat (L-6) | Tambahkan uji negatif tersebut bersama perbaikan |
| A.16 Insiden | N/A | Tidak berubah | - |
| A.18 Kepatuhan | N/A | Tidak berubah | - |

## 6. Penilaian Uji (permintaan 3)

| Perbaikan | Yang diasersikan dengan benar | Yang belum |
|---|---|---|
| F-1 | 409 `SCOPE_CONFLICT` R12/R13/R14: kanari dan label hanya di dalam blok, `untrusted`, `untrustedFields`, penutup literal dinetralkan di teks dan data (`mcp-doc-tools.test.ts:524-554`). `CHAPTER_INVALID` dan 422 server dibungkus, sedangkan galat MCP murni tidak (`:556-577`) | Dry-run R08 dengan isu konflik (M-1). Galat server tanpa `details` atau tanpa cid (L-1). Alat laporan dengan kode di luar daftar (L-1). Varian penanda (L-2) |
| F-2 | Create, impor, dan chapter_submit bertarget misi berhenti sebelum POST, dengan urutan panggilan diperiksa (`['GET']`). Adopsi diingat sesi. `requesterOf` (`:581-642`) | Alias `studio_report_submit` json (M-2). `agentId` argumen = pemilik dengan kunci mati (L-4) |
| F-3 | `BASIS_MISSING` tanpa jaringan (`m.calls` 0) untuk impor, slot, chapter_submit (documentId/docNumber). Misi baru tanpa basis. Basis sesi berantai create -> slot -> impor. Konflik diteruskan berpenanda (`:645-709`) | Alias (M-2). Kasus `rebased: true` (L-3) |

Uji mutasi yang dilaporkan coder (mematikan cabang `fromServer && details`) tidak diulang di sini.

## 7. Prioritas Remediasi

1. **Sebelum uji multi-penulis per misi atau dipakai luas (Medium):** M-2 (tutup alias `studio_report_submit` json, atau batasi toolset `reports` untuk agen dokumen dengan `STUDIO_MCP_TOOLSETS=documents` sebagai mitigasi sementara) dan M-1 (bungkus isu dry-run R08).
2. **Pengerasan (Low):** L-1 (`serverMessage` sebagai syarat cukup), L-2 (escape `<` / nonce), L-3 (basis tidak maju saat `rebased`), L-4 (wajibkan kunci agentId untuk banyak agen), L-5, L-6 (dok).
3. GDPR / ISO 27701: tidak ada celah dari D3.
4. Kesiapan sertifikasi ISO: A.9 dan A.14.2 menjadi OK sesudah M-2 ditutup dan uji negatif ditambahkan.

Keputusan atas vonis CAUTION ini (perbaiki / terima risiko tercatat / ubah lingkup) dibuat USER lewat controller. Laporan ini tidak menyetujui apa pun.

## 8. Log Review Keamanan

| Waktu | Lingkup | Level | Hasil | Keputusan |
|---|---|---|---|---|
| 2026-11-02 ~10:30 WIB | Diff MCP-D3 (`scripts/studio/mcp/{tools,doc-tools,tool-kit,safety,resources,server}.ts`, uji `mcp-doc-tools.test.ts`, `docs/STUDIO-MCP.md`) + rute server yang diandalkan guard | L3 | `vitest tests/unit/studio/mcp` 84/84 lulus | - |
| 2026-11-02 ~10:40 WIB | Probe scratchpad `probe_d3.ts`, `probe_d3b.ts`, `probe_d3c.ts` (fetch tiruan; tanpa DEV/DB/9011/.env; rahasia palsu disensor) | L3 | P1/P2 (L-1), P3a/P3b + d3b (M-1), P4 (L-2), d3c (M-2) terkonfirmasi | - |
| 2026-11-02 | Vonis | L3 | CAUTION: 0 High, 2 Medium, 6 Low; rahasia 0 | Menunggu USER lewat controller |

---

# Siklus 2: Cek Ulang Perbaikan MCP-D4 (2026-11-02)

Dasar: `delegation_progress/coder_execution_mcp_d4.md` (D-484). Berkas berubah: `scripts/studio/mcp/{tool-kit,doc-tools,tools}.ts`, `scripts/studio/studio-report.ts` (aditif `SubmitPlanItem`, `submitPlanOf`, `CliIo.beforeSubmit`), `tests/unit/studio/mcp/mcp-d4-security.test.ts` (baru), `tests/unit/studio/mcp/mcp-harness.ts`, `docs/STUDIO-MCP.md`. L-4 sengaja tidak diubah (menunggu USER). Tingkat review: **L3**. Hanya baca: tidak ada kode yang diubah. Tidak ada DEV, DB, port 9011, atau `.env`. `probe_d4_dev.ts` (menyasar DEV) TIDAK dijalankan. `src/lib/studio/engine/**` tidak disentuh.

## S2.1 Ringkasan

| Butir | Nilai |
|---|---|
| Vonis keseluruhan siklus 2 | **CAUTION**: 0 High, 1 Medium baru (N-1), 2 Low baru (N-2, N-3); L-4 tetap terbuka (Low) |
| Uji | `npx vitest run tests/unit/studio/mcp`: `Test Files 5 passed (5)`, `Tests 102 passed (102)` (dijalankan ulang 11:20) |
| Probe ulang (fetch tiruan) | `probe_d3.ts` P1/P2: `untrusted=true canaryOutsideBlock=false`. P3a/P3b: `ok=true untrusted=true canaryOutsideBlock=false`. P4: ketujuh varian `neutralized=true`. `probe_d3b.ts`: `untrusted=true canaryBeforeBlock=false`. `probe_d3c.ts`: documentId -> `BASIS_MISSING calls=` (0 panggilan); mission+docKey -> `R12 dipanggil=false`. `probe_d4c.ts`: milik lain -> `DOCUMENT_OWNED_BY_OTHER`, klien milik sendiri -> `BASIS_MISSING`, keduanya `R12 dipanggil=false` |
| Probe baru siklus 2 | `probe_d4x.ts` (scratchpad, fetch tiruan): (a) L-3 dilewati lewat kiriman identik (N-1); (b) L-2 mengubah isi `shape: submission` yang memuat frasa "data tak tepercaya" (N-2); (c1) draf campuran ditolak sebelum tulis; (c2) blok bergantung diarahkan ke dokumen buatan blok pembuat (benar) |

## S2.2 Vonis per Temuan

| Temuan | Vonis | Dasar |
|---|---|---|
| M-1 dry-run R08 | **PASS** | `doc-tools.ts:313-328`: isu di `serverBlock` `isu-dry-run`, kepala hanya SAH/TIDAK SAH + jumlah + lingkup `tok()`, `untrustedFields` di bentuk ringkas dan detail. `studio_draft_check`/`studio_report_check` remote ditandai (`tools.ts:340,923`). Probe P3a/P3b/d3b lulus. Uji `mcp-d4-security.test.ts:60-120` |
| M-2 alias `studio_report_submit` | **PASS** (residu: N-3 Low, TOCTOU tercatat) | `guardReportSubmit` (`doc-tools.ts:915-950`) dipanggil lewat `CliIo.beforeSubmit` dengan rencana yang SAMA dengan yang dikirim (`studio-report.ts` `submitPlanOf` dipakai `runSubmit` dan kait). Lihat analisis S2.3 |
| L-1 baris kepala galat | **PASS** | `tools.ts` `executeTool`: asal server = cid ATAU status HTTP, `serverMessage` sebagai syarat cukup, kode/cid/pointer tak aman dipindah ke blok. `toToolError` menandai `serverMessage` untuk ReportError/DraftCheckUsageError asal server. Probe P1/P2 lulus. Uji `:176-229` |
| L-2 varian penanda | **CAUTION** | Keamanan: lulus. Blok teks meng-escape SETIAP `<`/mirip (`tool-kit.ts:232`), dan P4 + 11 varian uji dinetralkan. Namun pencocokan structuredContent terlalu luas dan mengubah isi yang dikirim ulang (N-2) |
| L-3 basis saat `rebased` | **CAUTION** | `rebased: true` kini melupakan basis + `BASIS_REBASED` di semua alat tulis dokumen (`doc-tools.ts:259-273`; pemanggil `:504,636,697,744,825`). Namun alur ini dapat dilewati lewat jawaban idempoten `unchanged` (N-1) |
| L-4 identitas pemilik | **terbuka (tidak diubah, sesuai brief)** | Tercatat di `docs/STUDIO-MCP.md:273-275`. Tetap Low, menunggu keputusan USER |
| L-5 jalur sukses lama | **PASS** | Render, file_verify, impor, dan status memakai `serverBlock`/`tok()`. Uji `:293-358` |
| L-6 dokumentasi | **PASS** (catatan kecil) | TOCTOU (`STUDIO-MCP.md:268-272`), L-4, rebased, aturan M-2, dan klaim F-1 yang dipersempit kini ada. Dok belum menyebut N-1 dan N-2 (kalimat `:279-280` "basis sesi = revisi hasil kiriman Anda" dan `:455-458` "string lain tidak diubah" tidak sepenuhnya akurat) |

## S2.3 Analisis Fokus Koordinator

**M-2: bypass baru dari pemeriksaan per target?**
- *GET pemeriksaan berbalapan dengan tulis*: ya, TOCTOU (GET R04 lalu R04/R12, tidak atomik). Bila pihak lain membuat misi+docKey di sela, blok pertama jatuh ke dokumen itu tanpa basis, dan blok bergantung diarahkan ke `documentId` yang dikembalikan. Batas ini tercatat di `STUDIO-MCP.md:268-272,292`, dan API HTTP tidak boleh berubah (D-484). Tetap Low, tidak dihitung sebagai temuan baru. Opsi pengerasan murah: hentikan `runSubmit` bila blok yang diperiksa sebagai "belum ada" dijawab `created: false`. Kiriman pertama sudah terjadi, tetapi blok berikutnya tidak.
- *Target diselesaikan berbeda dari server*: tidak ditemukan. docKey efektif `docKey ?? template.slug` sama dengan `submit/target.ts:50` (bab/slot) dan `resolveDocTarget` (doc/v2). `studio.doc/v2` diperiksa di tingkat atas, bab/slot di `target`. `documentId`/`docNumber` dengan nilai apa pun (termasuk `null`/`""`) ditolak gagal-tertutup. docKey `""` membuat GET tanpa filter docKey, tetapi skema server menolak docKey kosong sebelum tulis. Pola folder misi server tidak memberi ruang selisih spasi/huruf (siklus 1).
- *Draf campuran*: probe (c1): blok 1 dokumen baru + blok 2 bab ke misi+docKey milik agen lain -> `DOCUMENT_OWNED_BY_OTHER`, kedua target diperiksa, `R12=0`. Lewatan `sourceBlock !== null` (`doc-tools.ts:918`) aman karena `runSubmit` mengganti target blok itu dengan `documentId` hasil blok pembuat (probe c2: `{"documentId":"cmvnew…"}`). Peta sumber dihitung dari draf mentah, tetapi override `--mission`/`--doc-key` berlaku seragam, jadi relasi tidak berubah. Satu-satunya celah teoretis: jawaban 2xx tanpa `document.id`, sehingga target asli dikirim tanpa diperiksa. Itu jawaban server yang cacat, bukan jalur penyerang. Pengerasan opsional: lempar galat bila `sourceBlock` ada tetapi dokumen pembuat tidak tercatat.
- *Draf MD*: konversi MD terjadi sebelum `submitPlanOf`, jadi kait yang sama berlaku. Uji `mcp-d4-security.test.ts:157-174` (laporan MD milik lain ditolak, milik sendiri tetap dikirim). Residu: N-3.

**L-2: apakah escaping merusak kiriman ulang yang sah?** Ya, untuk satu kelas isi (N-2). Blok teks tidak dikirim ulang, jadi aman. Namun `neutralizeDeep` di structuredContent (mis. `studio_document_get shape: submission`, `tools.ts:748`) mengubah SETIAP `<` dalam string yang "menyebut penanda". `mentionsMarker` membuang spasi dan tanda hubung sebelum mencocokkan (`tool-kit.ts:213,217-219`), sehingga frasa prosa biasa "data tak tepercaya" (dan "metadata tak tepercaya") ikut cocok.

**L-3: dapatkah alur `BASIS_REBASED` dilewati?** Ya, lewat kiriman identik (N-1). Jalur lain tertutup: semua alat dokumen lewat `rememberRevision`. `studio_report_update`/`submit` memakai `nextBasis` (yang sudah menangani penulis di sela). `studio_report_refresh` mengingat revisi yang benar-benar dibaca. `baseRevisionNo` eksplisit di atas terkini ditolak server.

## S2.4 Temuan Baru

| ID | Severity | Tipe | Lokasi | Deskripsi | Remediasi | Verifikasi |
|---|---|---|---|---|---|---|
| N-1 | Medium | CWE-362 (lost update); alur L-3/F-3 dilewati | `scripts/studio/mcp/doc-tools.ts:259-273` (`rememberResult`/`rememberRevision` mengingat `revision.revisionNo` bila `rebased !== true`); server `src/lib/studio/services/submit/pipeline.ts:872-881` (jalur idempoten `unchanged` mengembalikan `rebased: false` + `revisionNo: latest.revisionNo` SEBELUM cek dasar `:912-921`) | Bila kiriman bab/slot identik dengan isi terkini, server menjawab `unchanged: true, rebased: false` dengan revisi TERKINI, walau basis yang dikirim lama. MCP lalu mengingat revisi terkini itu (yang belum pernah dibaca pemanggil) sebagai basis sesi, tanpa `BASIS_REBASED`. Kiriman berikut ke bagian lain tanpa basis eksplisit memakai basis itu, sehingga perubahan pihak lain di antaranya tidak memicu 409 dan tertimpa diam-diam. Probe d4x (a): create rev1 -> slot identik (base 1) dijawab `unchanged` rev5 -> slot berikut dikirim `base=5`, `warnings1=[]`. Pemicunya realistis: alat diiklankan idempoten (`idempotentHint: true`), jadi agen wajar mengulang kiriman yang sama. Ini kembali ke "revisi terkini server dipakai sebagai basis", yang justru dicegah F-3/C2 | Di `rememberResult`/`rememberRevision`: jangan memajukan basis bila `b.unchanged === true` (biarkan basis lama, atau lupakan + peringatan seperti rebased). Lebih ketat: majukan hanya bila dokumen baru dibuat, atau bila `revisionNo === basisDikirim + 1` dan `rebased !== true`; selain itu lupakan. Terapkan juga pada R14 struktur. Perbarui `STUDIO-MCP.md:279-280` | Ulangi `probe_d4x.ts` (a): kiriman kedua tanpa basis eksplisit harus `base=1` atau `BASIS_MISSING`, bukan `base=5`. Tambah uji unit `unchanged` dengan revisi terkini > basis |
| N-2 | Low | CWE-116 (encoding berlebih) / integritas data; regresi dari L-2 | `scripts/studio/mcp/tool-kit.ts:213,217-219,227-229` (`MARKER_NOISE`, `mentionsMarker`, `neutralizeMarkers`); dipakai `neutralizeDeep` di `tools.ts:748` (`studio_document_get` `shape: submission`) dan jalur lain | `mentionsMarker` membuang spasi/tanda hubung lalu mencari `datataktepercaya` di mana pun dalam string. Frasa Indonesia biasa "data tak tepercaya" (sering muncul di dokumen proyek ini) ikut cocok, begitu juga "metadata tak tepercaya". Akibatnya SETIAP `<` di string itu menjadi `&lt;` di structuredContent, termasuk `< 5`, komentar peran md/v1 `<!-- role: … -->`, dan penanda `<<<<<<<`. Probe d4x (b): `"Nilai < 5 dianggap data tak tepercaya; <!-- role: identity -->"` -> `"Nilai &lt; 5 …; &lt;!-- role: identity -->"`, dan `submission dikirim ulang apa adanya? false`. Agen yang mengirim ulang badan itu menyimpan `&lt;` harfiah. Sebelum D4, hanya `<` yang langsung mengawali penanda yang diubah. Dok `STUDIO-MCP.md:455-458` menjanjikan "string lain tidak diubah" | Netralkan secara posisional: hanya karakter `<`/mirip yang (sesudah melewati noise: spasi, `\p{Cf}`, tanda hubung) diikuti `/` opsional lalu nama penanda yang dinormalkan. Jangan escape semua `<` dalam string. Atau syaratkan ada `<`/mirip yang berdekatan dengan nama sebelum string dianggap "menyebut penanda" | `neutralizeMarkers("Nilai < 5 dianggap data tak tepercaya")` tidak berubah. Ketujuh varian P4 + 11 varian uji tetap dinetralkan. Tambah uji kiriman ulang `shape: submission` berisi frasa tersebut |
| N-3 | Low | CWE-362 (lost update) pada laporan kerja milik sendiri; residu M-2 (keputusan desain) | `scripts/studio/mcp/doc-tools.ts:943` (milik sendiri + laporan kerja -> lolos); `studio-report.ts` `runSubmit` (kiriman tanpa `baseRevisionNo`) | `studio_report_submit` atas laporan kerja milik pemanggil yang SUDAH ADA tetap dikirim tanpa basis (perilaku CLI lama, sengaja diizinkan D-484). Bila agen lain mengadopsi laporan itu dan menulis bab lewat `studio_report_update` (dengan basis), kirim ulang MD oleh pemilik akan menimpa bab tersebut tanpa konflik. Dok menyebut "kirim ulang laporan sendiri" tetapi tidak menyebut akibat ini | Pilih: (a) catat akibatnya di `STUDIO-MCP.md` paragraf M-2 sebagai batas yang diketahui; atau (b) untuk laporan milik sendiri yang sudah ada, tolak (`BASIS_MISSING`, arahkan ke `studio_report_update`) bila penulis terakhir (R15 `lastFilledBy`) suatu bagian yang berubah bukan pemanggil | Dok memuat batasnya, atau uji: laporan sendiri dengan bab terakhir ditulis agen lain -> submit ditolak tanpa R12 |

## S2.5 Gerbang (siklus 2)

| Cek | Hasil | Rincian |
|---|---|---|
| Credential leak | PASS | Tidak ada jalur baru yang mencetak env/rahasia. `redactSecret` tetap di `server.ts`. Probe: rahasia palsu tidak muncul di keluaran (disensor `sed` sebagai lapis kedua) |
| Destructive operation | CAUTION | Alias M-2 tertutup. Lost update masih mungkin lewat basis yang diambil dari jawaban `unchanged` (N-1), lewat TOCTOU (tercatat), dan lewat kirim ulang laporan sendiri (N-3). Semua dapat dibalik lewat riwayat revisi |
| External call | PASS | Hanya GET R04/R21 tambahan ke origin yang sama |
| Injection | PASS | M-1, L-1, L-2 (spoofing), L-5 tertutup. N-2 adalah encoding berlebih, bukan celah injeksi |
| Permission escalation | CAUTION | Hanya karena L-4 (terbuka, menunggu USER). Alias M-2 tertutup |

## S2.6 GDPR / ISO

GDPR/ISO 27701: tetap N/A (alasan sama dengan siklus 1). ISO 27001: A.9 PARTIAL (L-4 saja). A.14.2 PARTIAL (N-1, N-2 tanpa uji; dok `:279-280,455-458` tidak akurat). Kontrol lain tidak berubah.

## S2.7 Prioritas

1. N-1 (Medium) sebelum uji multi-penulis per dokumen: jangan memajukan basis sesi dari jawaban `unchanged`.
2. N-2 (Low): netralisasi posisional agar kiriman ulang `shape: submission` tetap utuh.
3. N-3 (Low): catat atau perketat. L-4: keputusan USER.

Menurut kontrak orkestrasi, ini siklus perbaikan 2 dari 3 untuk kriteria yang sama. Keputusan atas CAUTION (perbaiki / terima risiko tercatat / ubah lingkup) dibuat USER lewat controller.

## S2.8 Log Review Keamanan

| Waktu | Lingkup | Level | Hasil | Keputusan |
|---|---|---|---|---|
| 2026-11-02 ~11:15 WIB | Diff MCP-D4 + `studio-report.ts` `submitPlanOf`/`beforeSubmit` + rute server yang diandalkan (`pipeline.ts` jalur idempoten dan checkBase) | L3 | `vitest tests/unit/studio/mcp` 102/102 lulus | - |
| 2026-11-02 ~11:20 WIB | Probe ulang `probe_d3.ts`, `probe_d3b.ts`, `probe_d3c.ts`, `probe_d4c.ts`; probe baru `probe_d4x.ts` (fetch tiruan; `probe_d4_dev.ts` tidak dijalankan) | L3 | M-1/L-1/L-2/M-2 tertutup; N-1, N-2 terkonfirmasi; draf campuran aman | - |
| 2026-11-02 | Vonis siklus 2 | L3 | CAUTION: 0 High, 1 Medium (N-1), 2 Low baru (N-2, N-3) + L-4 terbuka; rahasia 0 | Menunggu USER lewat controller |

---

# Siklus 3: Cek Ulang Perbaikan MCP-D5 (siklus terakhir, 2026-11-02)

Dasar: `delegation_progress/coder_execution_mcp_d5.md`. Berkas berubah: `scripts/studio/mcp/doc-tools.ts` (`SendOutcome`, `rememberRevision`, `requireLastWriter`), `scripts/studio/mcp/tool-kit.ts` (`opensMarker`, `neutralizeMarkers`), `tests/unit/studio/mcp/mcp-d5-security.test.ts` (baru), `tests/unit/studio/mcp/mcp-doc-tools.test.ts` (fixture), `tests/unit/studio/mcp/mcp-d4-security.test.ts`, `docs/STUDIO-MCP.md`. Tingkat review: **L3**. Hanya baca: tidak ada kode yang diubah. Hanya probe fetch tiruan: tidak ada DEV, DB, port 9011, atau rahasia (`probe_d4_dev.ts` tidak dijalankan). `src/lib/studio/engine/**` tidak disentuh.

## S3.1 Ringkasan

| Butir | Nilai |
|---|---|
| Vonis keseluruhan siklus 3 | **PASS** (0 High, 0 Medium). Sisa: 1 temuan Low baru (N-4) + residu Low yang harus diputuskan USER (S3.5) |
| Uji | `npx vitest run tests/unit/studio/mcp`: `Tests 111 passed (111)`, 6 berkas (dijalankan ulang 11:50) |
| Probe ulang | `probe_d3.ts` P1-P4, `probe_d3b.ts`, `probe_d3c.ts`, `probe_d4c.ts`: hasil sama dengan siklus 2 (semua lulus). `probe_d4x.ts`: (a) `kirim2 … base=1` (sebelumnya 5); (b) `submission dikirim ulang apa adanya? true`; (c1)/(c2) tetap benar |
| Probe baru | `probe_d5x.ts` (scratchpad): N-1 dengan medan jawaban hilang/aneh, 16 varian penanda N-2, dan 8 bentuk penulis R05 untuk N-3 |

## S3.2 Vonis per Temuan

| Temuan | Vonis | Bukti |
|---|---|---|
| N-1 (Medium) basis dari jawaban `unchanged` | **PASS** | `doc-tools.ts:280-288`: `unchanged` (dan bukan created) -> basis lama dipertahankan. Basis maju hanya bila `created`, atau `revisionNo === sentBase + 1` tanpa `rebased`. Selain itu basis dilupakan + `BASIS_REBASED`. Semua pemanggil meneruskan basis yang benar-benar dikirim (`:518,650,711,758,840`). Lihat S3.3 |
| N-2 (Low) escaping berlebih | **PASS** | `tool-kit.ts` `opensMarker`/`neutralizeMarkers` (posisional). Prosa "data tak tepercaya", `< 5`, `<!-- role -->`, dan `<<<<<<<` byte-identik (probe d5x, d4x (b)). `shape: submission` dikirim ulang utuh (uji `mcp-d5-security.test.ts:121`). Varian P4 tetap dinetralkan. Residu varian: N-4 |
| N-3 (Low) kirim ulang laporan sendiri | **PASS** (residu Low R-3) | `requireLastWriter` (`doc-tools.ts:925-946`) gagal tertutup untuk semua bentuk penulis yang hilang atau aneh (S3.3). Residu: pemeriksaan di tingkat revisi terkini, bukan per bagian |
| M-1 (regresi) | PASS | P3a/P3b/d3b: `untrusted=true`, tidak ada kanari di luar blok |
| M-2 (regresi) | PASS | d3c/d4c/d4x (c1, c2): tidak ada R12 ke dokumen yang bukan milik pemanggil atau yang tanpa basis. Blok bergantung diarahkan ke dokumen buatan blok pembuat |
| L-1 (regresi) | PASS | P1/P2: kepala galat tanpa teks server |
| L-2 (regresi) | PASS | P4 7/7 dinetralkan, dan blok teks tetap meng-escape setiap `<` dalam daftar `LT_LIKE` |
| L-3 (regresi) | PASS | `rebased: true` atau revisi > basis+1 -> `BASIS_REBASED` + `BASIS_MISSING` pada kiriman berikut (d5x) |
| L-5 (regresi) | PASS | Uji D4 L-5 lulus dalam 111/111 |
| L-4 | Terbuka (sesuai brief) | Menunggu keputusan USER (S3.5) |

Fixture `mcp-doc-tools.test.ts:685-710`: rantai diubah dari 1->3->4 menjadi 1->2->3. Uji tetap menjaga maksud aslinya: basis berantai antaralat (create -> slot memakai 1 -> impor memakai 2 -> slot memakai 3) dan 409 diteruskan berpenanda (`untrusted`). Fixture lama (rev 3 sesudah basis 1 tanpa `rebased`) justru kasus yang kini benar dianggap "ada penulis lain". Kasus itu diuji eksplisit di `mcp-d5-security.test.ts:67-79`. Penyesuaian ini tidak melemahkan penjagaan.

## S3.3 Analisis Fokus Koordinator

**Bypass baru aturan basis (N-1).** Hasil `probe_d5x.ts`:

| Jawaban kiriman 1 (sesudah create rev 1) | Kiriman 1 | Kiriman 2 tanpa basis eksplisit |
|---|---|---|
| `rebased` tidak ada, rev = basis+2 | `BASIS_REBASED` | `BASIS_MISSING` |
| `rebased` tidak ada, rev = basis+1 | - | `base=2` (benar: tidak ada penulis lain, karena server hanya menulis basis+1 bila basis = terkini, `pipeline.ts:485`) |
| `created: "true"` (string), rev 9 | `BASIS_REBASED` | `BASIS_MISSING` |
| `unchanged: "true"` (string), rev 9 | `BASIS_REBASED` | `BASIS_MISSING` |
| `rebased: "false"` (string), rev 9 | `BASIS_REBASED` | `BASIS_MISSING` |
| `revisionNo: "2"` (string) | - | `base=1` (basis lama dipertahankan, konservatif) |
| chapter_submit misi, pra-cek "belum ada", jawaban `created: false` (balapan) | `BASIS_REBASED` | `BASIS_MISSING` |

Aturan `revisionNo === sentBase + 1` sendiri sudah cukup walau medan `rebased` hilang. Bendera hanya dipercaya bila bernilai `=== true`, dan bentuk aneh berakhir di "lupakan basis". Deteksi dokumen baru hanya lewat `created === true` dari server, dan create tool hanya memajukan basis bila `created` (`:518`). Tidak ditemukan bypass.

**Varian penanda yang lolos (N-2 dan blok teks).** Hasil `probe_d5x.ts`, 16 varian:
- Dinetralkan di structuredContent DAN di-escape di blok teks: ASCII, `< / data…`, nama berspasi, ZWSP di nama, huruf fullwidth, soft hyphen.
- Tidak diubah di structuredContent, tetapi di-escape di blok teks: `<//data…`, `<\/data…`, `<`+tanda gabung U+0301, nama dengan huruf Kiril (а/е). structuredContent tidak punya pembungkus (penandanya medan `untrusted: true`), jadi dampaknya kecil.
- **Tidak diubah di keduanya**: karakter mirip `<` di luar daftar `LT_LIKE`: `ᐸ` U+1438, `≺` U+227A, `⧼` U+29FC, `˱` U+02F1, `«` U+00AB, serta entitas `&#60;`. Varian ini sudah ada sejak D4 (daftar `LT_LIKE` tidak berubah), jadi bukan regresi D5. Dicatat sebagai N-4 (Low). Entitas `&#60;` tampil setara bentuk yang sudah dinetralkan (`&lt;`), jadi tidak dihitung sebagai jalan keluar blok.

**`REPORT_CHANGED_BY_OTHER` gagal terbuka?** Tidak. Hasil `probe_d5x.ts`:

| R05 `revision.createdBy` | Hasil | R12 |
|---|---|---|
| `"agent:cod-a"` (= pemanggil) | dikirim (galat akhirnya 404 R15 dari mock) | 1 |
| hilang | `REPORT_CHANGED_BY_OTHER` | 0 |
| angka `7` | `REPORT_CHANGED_BY_OTHER` | 0 |
| `"Agent:cod-a"` (beda huruf) | `REPORT_CHANGED_BY_OTHER` | 0 |
| `"agent:cod-a "` (spasi) | `REPORT_CHANGED_BY_OTHER` | 0 |
| `revision` hilang | `REPORT_CHANGED_BY_OTHER` | 0 |
| R05 500 | galat server (`INTERNAL`) | 0 |
| badan berupa array | `REPORT_CHANGED_BY_OTHER` | 0 |

Hanya kesetaraan persis dengan `requesterOf(agentId)` yang lolos (`doc-tools.ts:929-930`). Semua bentuk lain berakhir tertutup.

## S3.4 Temuan Baru dan Residu

| ID | Severity | Tipe | Lokasi | Deskripsi | Remediasi | Verifikasi |
|---|---|---|---|---|---|---|
| N-4 | Low | CWE-116 / CWE-1427 (netralisasi daftar-hitam tidak lengkap) | `scripts/studio/mcp/tool-kit.ts` `LT_LIKE` (dipakai `escapeBlockBody` dan `neutralizeMarkers`) | Blok teks meng-escape hanya `<` dan 9 karakter mirip di daftar. Karakter mirip lain (`ᐸ`, `≺`, `⧼`, `˱`, `«`) diteruskan apa adanya, jadi `ᐸ/data-tak-tepercaya>` muncul utuh di dalam blok teks. Apakah model menganggapnya penutup blok tidak pasti, sehingga risikonya rendah. Bukan regresi D5 | Netralkan berdasarkan NAMA, bukan glyph `<`: di isi blok, ganti setiap kemunculan nama penanda yang dinormalkan (NFKC, buang derau, termasuk homoglif Kiril umum) dengan bentuk yang dijinakkan. Atau pakai nonce acak per panggilan di tag pembungkus (disarankan sejak siklus 1, L-2). Keduanya menutup semua glyph mirip sekaligus | Varian `probe_d5x.ts` U+1438/U+227A/U+29FC/U+02F1/U+00AB tidak lagi utuh di dalam blok teks. Uji L-2/N-2 tetap lulus |
| R-3 | Low (residu N-3) | CWE-362 | `doc-tools.ts:925-946` | `requireLastWriter` memeriksa penulis revisi TERKINI dokumen, bukan penulis terakhir per bagian. Bila B (pengadopsi) menulis bab 3, lalu A menulis bagian lain sesudahnya tanpa menggabungkan bab 3 (mis. update dengan bagian `stale` yang tidak dikirim, atau slot lewat alat dokumen dengan `BASIS_REBASED`), revisi terkini ditulis A. Kirim ulang MD lama oleh A lewat `studio_report_submit` lalu diizinkan dan menimpa bab 3 milik B. Implementer mencatat batas ini di laporannya; STUDIO-MCP.md menyatakan aturannya tetapi tidak menyebut akibat ini | Periksa per bagian: R15 `lastFilledBy` (sudah dipakai `studio-report.ts` untuk "penulis terakhir") untuk setiap bagian yang akan berubah harus pemanggil. Atau catat batas ini di STUDIO-MCP.md | Uji: laporan sendiri, revisi terkini oleh A, tetapi bab 3 terakhir diisi B -> submit ditolak tanpa R12 |

## S3.5 Risiko Sisa yang Harus Diputuskan USER

Siklus perbaikan 3 dari 3 sudah habis untuk kriteria ini. Butir di bawah tidak boleh dianggap disetujui. Controller menyajikannya ke USER (perbaiki di tugas baru / terima risiko tercatat / ubah lingkup), dan keputusannya dicatat di `decisions/decisions.md`.

| # | Risiko | Severity | Kondisi pemicu | Pilihan |
|---|---|---|---|---|
| 1 | L-4: identitas pemilik dinyatakan pemanggil (`agentId` bebas bila `STUDIO_MCP_LOCK_AGENT_ID` mati; dua pemanggil tanpa agentId saling dianggap pemilik). F-2, M-2, dan N-3 hanya mencegah salah ambil, bukan agen yang berniat | Low | Banyak agen per misi dengan kunci agentId mati (bawaan) | Wajibkan `STUDIO_MCP_LOCK_AGENT_ID=1` + `STUDIO_AGENT_ID` per proses; dan/atau perlakukan pemanggil tanpa agentId sebagai bukan-pemilik; atau terima |
| 2 | TOCTOU pra-cek -> tulis (F-2, M-2, N-3): GET pemilik/penulis dan kiriman tidak atomik. Tercatat di `STUDIO-MCP.md:268-272` | Low | Dua agen membuat atau menulis misi+docKey yang sama dalam jendela milidetik | Terima (jendela kecil); atau tugas baru untuk mengubah API (syarat pemilik/`expectCreate` di server), yang dikecualikan D-480/D-484 |
| 3 | R-3: N-3 hanya melihat penulis revisi terkini, bukan per bagian | Low | Pengadopsi menulis, lalu pemilik menulis bagian lain tanpa menggabungkan, lalu mengirim ulang MD lama | Pemeriksaan per bagian lewat R15 `lastFilledBy`; atau catat dan terima |
| 4 | N-4: glyph mirip `<` di luar daftar tidak di-escape di blok teks | Low | Teks server memuat `ᐸ/data-tak-tepercaya>` atau sejenisnya, dan model menafsirkannya sebagai penutup | Netralisasi berbasis nama atau nonce tag; atau terima |

## S3.6 Gerbang (siklus 3)

| Cek | Hasil | Rincian |
|---|---|---|
| Credential leak | PASS | Tidak ada jalur baru yang mencetak env/rahasia. Rahasia palsu probe tidak muncul |
| Destructive operation | PASS (residu Low #2, #3) | N-1 tertutup. Tidak ada R12/R13 tanpa basis yang sah dalam probe |
| External call | PASS | Tambahan hanya GET R05 ke origin yang sama |
| Injection | PASS (residu Low #4) | Prosa tidak lagi diubah. Penanda ASCII/NFKC dinetralkan |
| Permission escalation | PASS (residu Low #1) | Hanya L-4 yang terbuka |

GDPR/ISO 27701: tetap N/A. ISO 27001 A.9: PARTIAL hanya karena L-4. A.14.2: OK (uji N-1..N-3 ada dan asersinya nyata; dok sesuai perilaku kecuali R-3 yang belum disebut).

## S3.7 Log Review Keamanan

| Waktu | Lingkup | Level | Hasil | Keputusan |
|---|---|---|---|---|
| 2026-11-02 ~11:45 WIB | Diff MCP-D5 (`rememberRevision`, `requireLastWriter`, `opensMarker`), uji D5, fixture `mcp-doc-tools.test.ts`, STUDIO-MCP.md | L3 | `vitest tests/unit/studio/mcp` 111/111 lulus | - |
| 2026-11-02 ~11:50 WIB | Probe ulang d3/d3b/d3c/d4c/d4x + probe baru `probe_d5x.ts` (fetch tiruan) | L3 | N-1/N-2/N-3 tertutup; gagal tertutup terkonfirmasi; N-4 dan R-3 dicatat | - |
| 2026-11-02 | Vonis siklus 3 (terakhir) | L3 | PASS: 0 High, 0 Medium; 4 risiko sisa Low (S3.5); rahasia 0 | Risiko sisa menunggu USER lewat controller |
