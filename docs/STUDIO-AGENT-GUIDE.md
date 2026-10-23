# Panduan Agent: Doc Artifact Studio (kontrak v2)

## 0. Prinsip: agen mengirim isi, Studio mengurus tampilan

> "agent tidak perlu mikirin bagaimana cara membuat outputnya lagi. agent cuma kirim konten data
> dan read/edit via api" (user, D-139)

Aturan yang mengikat setiap pemanggilan:

1. **Kirim isi saja.** JSON v2 berisi data konten per slot, bab, section, dan paragraf. Tidak ada
   gaya, penomoran, tata letak, ukuran figur, atau wajah huruf. Medan tampilan ditolak
   `400 SCHEMA_INVALID` dengan `checkId: "DISPLAY_FIELD"`.
2. **Sebut templat dengan slug, tidak pernah dengan parameter.** `"template": { "slug": "datum-gsp" }`
   sudah cukup. Agen tidak pernah mengirim `overrides`, `params`, `setup`, `format`, atau lebar.
3. **Semua keputusan keluaran milik templat dan mesin:** penomoran bab, gambar, dan tabel; kepala
   halaman; daftar isi; tanda tangan; pemenggalan; lebar figur; glif simbol provenans; DOCX, PDF,
   dan HTML.
4. **API agen hanya empat aksi:** kirim isi, baca (kelengkapan, struktur, isi per id), sunting
   (per pid paragraf, bab, atau slot), dan minta render. Build dokumen HANYA lewat
   `POST /api/studio/documents/[id]/render`; agen sendiri yang menentukan kapan build. Kiriman dan
   sunting tidak pernah memicu build; medan `render` di badannya ditolak `400 SCHEMA_INVALID`
   dengan `checkId: "RENDER_FIELD"` (D-247).
5. **Respons dan galat dapat diteruskan apa adanya.** Setiap respons memuat ringkasan kelengkapan;
   bila dokumen belum lengkap, `forwardToController` berisi kalimat siap kirim ke controller agen.

Apa pun yang memaksa agen memahami format keluaran adalah cacat desain. Laporkan sebagai temuan,
jangan diakali dengan medan tambahan.

| Aksi | Route | Seksi |
|---|---|---|
| Kirim dokumen, bab, atau slot | `POST /api/studio/documents`, `POST /api/studio/chapters`, `POST /api/studio/slots` | 5 |
| Baca kelengkapan, struktur, isi | `GET .../completeness`, `GET .../structure`, `GET .../content`, `GET .../paragraphs/[pid]` | 6 |
| Sunting per pid | `PATCH /api/studio/documents/[id]/paragraphs/[pid]` | 9 |
| Minta render (satu-satunya pemicu build) | `POST /api/studio/documents/[id]/render` | 8 |

Sumber kebenaran tetap kode: kontrak `src/lib/studio/contract/**`, handler
`src/app/api/studio/**/route.ts`, register `docs/2026-10-22_doc_artifact_studio/masterplan/03_structural_sections_specs.md`.
Peta route rinci: `docs/API-REFERENCE.md` seksi 12. Setiap contoh JSON permintaan bertanda
`studio:validate` diuji terhadap skema v2 kontrak (ajv, `STUDIO_SCHEMA_LOAD_ORDER`,
`STUDIO_AJV_OPTIONS`, pemeta `classifySchemaV2Errors`).

---

## 1. Alur kerja dalam satu halaman

1. **Kirim.** Satu agen per bab: `POST /api/studio/chapters` dengan `studio.chapter/v2`. Bila dokumen
   misi belum ada, Studio membuatnya berkerangka bawaan templat pada revisi yang sama. Isi halaman
   depan (Lembar Kendali, Tanda Tangan, Referensi) lewat `POST /api/studio/slots`.
2. **Baca kelengkapan** di setiap respons (`completeness`), atau lewat
   `GET /api/studio/documents/[id]/completeness`. Ikuti `nextSteps`; teruskan `forwardToController`
   ke controller bila ada bagian milik agen lain.
3. **Sunting per pid.** Ambil pid dari respons kirim atau `GET .../content`, lalu
   `PATCH .../paragraphs/[pid]` dengan `change` yang jujur.
4. **Minta render** lewat `POST /api/studio/documents/[id]/render` sesudah kiriman tersimpan. Bab
   dan slot selalu boleh dirender sebagai draf. Render penuh hanya bila respons terakhir memuat
   `completeness.fullRenderAllowed: true`; selain itu `409 DOCUMENT_INCOMPLETE`.

Simpan `document.id`, `revision.revisionNo`, dan header `x-correlation-id` di catatan misi.

---

## 2. Autentikasi agent

Semua route Studio menolak pemanggil anonim dengan `401 {"error":"Unauthorized"}`.

1. Header `x-internal-secret` berisi nilai env `INTERNAL_API_SECRET` server HQ. Ambil dari
   lingkungan proses agent. Jangan pernah menulis nilai ini ke log, prompt, berkas, URL, atau isi
   dokumen.
2. Medan `agentId` di badan JSON (maks 80 karakter), mis. `"gsp-analis-01"`. Nilai ini tercatat
   sebagai `agent:<agentId>` di revisi, kelengkapan (`by`), dan job render. `agentId` adalah label,
   bukan identitas: tidak memberi hak dan tidak membuka kuota laju baru. Route GET tidak membawanya.

POST/PATCH JSON wajib `Content-Type: application/json`; jenis lain ditolak
`415 UNSUPPORTED_MEDIA_TYPE` (multipart hanya untuk `POST /api/studio/assets`).

```bash
curl -sS -X POST "$HQ_URL/api/studio/chapters" \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: $INTERNAL_API_SECRET" \
  --data-binary @bab-3.json
```

Setiap respons non-401 membawa `x-correlation-id`; nilai yang sama tercatat di log tahan lama
`<STUDIO_WORKSPACE_ROOT>/logs/api/studio-api-YYYY-MM-DD.jsonl`. Sertakan nilai itu saat
melaporkan galat.

---

## 3. Memilih templat

Agen hanya memilih slug. `GET /api/studio/templates` mengembalikan daftar dengan tanda `isPreset`
dan `restricted`.

| Slug | Untuk | Catatan |
|---|---|---|
| `datum-gsp` | dokumen GSP DATUM (laporan, kajian) | kerangka bawaan 7 slot (tabel di bawah) |
| `datum-kanonik` | profil DATUM kanonik | |
| `datum-manual-000` | Manual 000 | TERBATAS: pemanggil selain ADMIN mendapat `403 FORBIDDEN` (`details.reason = "TEMPLATE_RESTRICTED"`) |

Kerangka bawaan `datum-gsp` (urutan slot dokumen):

| pos | slotKey | Isi | Wajib | Cara mengisi |
|---|---|---|---|---|
| 1 | `cover` | Sampul | TERBIT, SERAH | otomatis dari `meta`; boleh dikirim lewat `/slots` |
| 2 | `controlSheet` | Lembar Kendali | TERBIT, SERAH | `/slots` |
| 3 | `signature` | Tanda Tangan | TERBIT, SERAH | `/slots` (dicetak di Lembar Kendali) |
| 4 | `toc` | Daftar Isi | TERBIT, SERAH | otomatis; jangan dikirim |
| 5 | `content` | Isi (bab berulang, minimal 1) | semua tier | `/chapters` |
| 6 | `references` | Referensi | tidak | `/slots` |
| 7 | `appendices` | Lampiran (berulang, kunci `A`..`Z`) | tidak | `/chapters` dengan `"slot": "appendices"` |

Untuk tier `NOTA`, slot 1-4 tidak aktif. Dokumen mematok satu versi templat saat dibuat; perubahan
templat sesudahnya tidak memengaruhi dokumen itu (D-153).

---

## 4. Bentuk isi v2

Tiga skema kiriman agen:

| `$schema` | Route | Isi |
|---|---|---|
| `studio.doc/v2` | `POST /api/studio/documents` | dokumen (kosong, sebagian, atau lengkap) |
| `studio.chapter/v2` | `POST /api/studio/chapters` | satu bab atau satu lampiran |
| `studio.slot/v2` | `POST /api/studio/slots` | satu slot tak-berulang |

Medan bersama kiriman: `agentId?`, `template?` (`{ slug }`), `meta?`, `register?`, `assets?`,
`baseRevisionNo?`, `change?`. Tidak ada medan `render` (build lewat seksi 8). Kiriman bab dan slot
memilih dokumen lewat `target` dengan TEPAT SATU cara: `documentId`, `docNumber`, atau
`mission.folder` (+ `docKey` opsional, bawaan = slug templat). Selain itu
`400 DOC_TARGET_AMBIGUOUS`. Kiriman `studio.doc/v2` ke dokumen yang SUDAH ada memakai
`target: { documentId }` + `baseRevisionNo` opsional: slot dan bab yang dikirim di-upsert dalam
satu revisi (`changeScope` `document;<lingkup>`), yang tidak dikirim tetap; `target.docNumber`,
`target.mission`, atau `target` bersama `mission.folder`/`docKey` ditolak
`400 DOC_TARGET_AMBIGUOUS`.

`meta` diisi bila medan itu masih kosong di dokumen; medan yang sudah terisi dengan nilai lain
menghasilkan `409 META_CONFLICT` (ubah lewat `PATCH .../structure` op `setMeta`). `lastFilledBy`
dan `by` dicatat dari identitas pemanggil (`agent:<agentId>` untuk pemegang rahasia internal,
`user:<nama>` atau `google:<email>` untuk sesi), bukan dari isi kiriman.

Hierarki: bab `{ key, id?, title, shortTitle?, partId?, intro?, sections }`, section
`{ id?, title, blocks }`, blok `{ type, id?, ... }`. `id` adalah pid opsional (seksi 11). Kunci bab
`"3"` adalah identitas isi; label "BAB 3", "Tabel 3.1", dan "Gambar 3.1" dibangkitkan mesin.

Teks (`Inline`) memakai tepat satu dari:

- `text`: md-lite, hanya `**tebal**`, `*miring*`, `` `mono` ``, dan tautan otomatis;
- `runs`: `{ "t": "..." }` dengan penanda makna opsional `strong`, `em`, `code`, `sup`, `sub`;
  atau `{ "tab": true }`; atau `{ "br": "line" }`.

| Blok (`type`) | Medan isi |
|---|---|
| `paragraph` | teks; `role`: `body` (bawaan), `lede`, `note`, `subheading` |
| `list` | `ordered`, `items[]` |
| `table` (dan 10 jenis tabel lain) | `caption?`, `columns[]` `{ role: text/numeral/id/unit/glyph, unit? }`, `rows[]` `{ kind: header/body/group/total, cells[] }`, `source?` |
| `image` | `asset` (kunci `assets` atau `sha256:<64 heks>`), `caption`, `source` (wajib) |
| `chart` | `code`, tepat satu dari `data` / `panels` (komposit, 1..24 panel) / `artifactId`, `highlight?`, `unit?`, `dec?`, `limit?`, `note?`, `caption`, `source`; rinci di 4.1 |
| `diagram` | `spec` (simpul dan penghubung, tanpa ukuran/warna), `caption`, `source` |
| `aside`, `monoBlock`, `assumptionInline`, `derivation`, `symbolSheet` | lihat `GET /api/studio/registry?kind=schema&schemaId=studio.doc/v2` |

`source` = teks + `provenance` opsional (`TERUKUR`, `DITURUNKAN`, `PEMASOK`, `ASUMSI`). Studio
menambahkan label SUMBER dan PROVENANS sendiri.

Yang ditolak (`400 SCHEMA_INVALID`):

- medan tampilan (`checkId: "DISPLAY_FIELD"`), mis. `format`, `setup`, `layout`, `widthMm`, `widthClass`,
  `widthTw`, `borders`, `caps`, `face`, `color`, `kicker`, `number`, `caption.label`;
- medan v1 (`checkId: "V1_FIELD"`, pesan menyebut penggantinya), mis. `blockId` (pakai `id`),
  `b`/`i` (pakai `strong`/`em`), `front`/`chapters` tingkat dokumen (pakai `sections`);
- primitif tata letak `spacer` dan `device`.

Contoh yang DITOLAK (lebar figur adalah keputusan templat):

<!-- studio:invalid studio.chapter/v2 DISPLAY_FIELD -->
```json
{
  "$schema": "studio.chapter/v2",
  "agentId": "gsp-analis-01",
  "target": { "documentId": "cmw1doc8k2p4x7q9z3" },
  "chapter": {
    "key": "3",
    "title": { "text": "Analisis Kondisi Peralatan" },
    "sections": [
      { "title": { "text": "Kondisi Pemutus Tenaga" }, "blocks": [
        { "type": "image", "asset": "sha256:c14cc4c48a5e9c2b04a2bb79a2cc8a5e32ed40638edfa0213d576176162406f2", "widthMm": 128,
          "caption": { "text": "Korosi pada terminal PMT-2." },
          "source": { "text": "Foto lapangan 2026-10-20", "provenance": ["TERUKUR"] } } ] } ]
  }
}
```

Respons:

<!-- studio:response -->
```json
{
  "error": "Kiriman tidak sesuai studio.chapter/v2; perbaiki medan yang disebut di details.",
  "code": "SCHEMA_INVALID",
  "details": [
    { "pointer": "/chapter/sections/0/blocks/0/widthMm", "keyword": "additionalProperties",
      "message": "medan tampilan tidak diterima; tampilan diatur templat", "checkId": "DISPLAY_FIELD" }
  ]
}
```

Tindakan: hapus medan di `pointer`, kirim ulang. Jangan mencari medan pengganti.

Medan `x` (hanya tingkat dokumen `studio.doc/v2`) dicadangkan untuk harness. Agen tidak
mengirimnya. Kunci `x.benchmark`, `x.enforcement`, dan `x.lintEnforcement` DITAFSIRKAN, lalu
dibuang untuk pemanggil tak tepercaya dengan REPORT `BENCHMARK_MARKER_STRIPPED` atau
`ENFORCEMENT_OVERRIDE_STRIPPED`.

### 4.1 Figur: chart dan gambar

Setiap figur (`image`, `chart`, `diagram`, `symbolSheet`) wajib membawa `caption` dan `source`.
Sumber figur adalah isi, bukan tampilan: standar DATUM meminta setiap figur mencantumkan asal
datanya (D-222). Figur tanpa `source` ditolak `400 SCHEMA_INVALID`
(`keyword: required`, `message` menyebut `source`).

Chart berisi data dan maknanya saja. Medan isi yang diterima:

| Medan | Tempat | Isi |
|---|---|---|
| `data` | blok atau panel | bentuk data (`shape`): `categorical`, `series`, `xy`, `matrix`, `intervals`, `graph`, `distribution`, `tiles`, `ohlc`, `sets`, `steps` |
| `panels` | blok `code: "composite"` | 1..24 panel `{ name, code, data, highlight?, unit?, dec?, limit?, caption?, axisNote? }` |
| `points[].target` | `data` bentuk `categorical` | sasaran per baris dalam satuan data (mis. bullet P-09) |
| `divider` | `data` bentuk `xy` | garis bagi kuadran dalam satuan data `{ x?, y? }`, minimal satu sumbu (mis. P-13) |
| `binEdges` | `data` bentuk `distribution` | 2..201 tepi bin tempat nilai dikelompokkan (mis. histogram S-01) |
| `sectors` | `data` bentuk `distribution` | jumlah sektor arah 4..72 tempat sudut dikelompokkan (mis. radial S-08) |
| `limit` | blok atau panel | ambang `{ value, label? }` dalam satuan data, mis. batas 55,0 dB(A) |
| `highlight` | blok atau panel | 1..64 butir yang ditekankan (aturan di bawah) |
| `unit`, `dec` | blok atau panel | satuan dan jumlah desimal angka |

Aturan `highlight`:

- `categorical` dan `xy`: label titik yang ditekankan, atau indeks 0-based.
- `series`: nama seri saja = seluruh seri; nama kategori saja = kategori itu; nama kategori plus
  tepat satu nama seri = SATU titik di dalam seri itu. `["K3", "real"]` menekankan nilai K3 seri
  `real` saja, bukan seluruh kategori K3 dan seluruh seri `real`.
- `distribution`: butir pertama; angka = indeks grup. Pada chart arah S-08 angka selalu indeks
  sektor 0-based, dengan 36 sektor bila `sectors` tidak dikirim. Untuk 36 sektor, arah 75 derajat
  = sektor 7.
- bentuk lain: butir pertama (satu penekanan per chart).

Studio menentukan sendiri domain sumbu, warna, label arah mata angin, label median,
tata letak komposit, dan lebar figur. Medan `axis`, `max`, `belowTargetColour`, `compassLabels`,
dan `medianLabel` (di blok chart, panel, atau `data`), `widthClass` di figur atau panel mana pun, `max`
di `limit`, dan `params` di chart adalah medan tampilan: ditolak `400 SCHEMA_INVALID` dengan `checkId: "DISPLAY_FIELD"`,
`pointer` menunjuk medan itu. `accent` di `data` ditolak dengan `checkId: "V1_FIELD"` (pakai
`highlight`). Tindakannya sama dengan medan tampilan lain: hapus medan di `pointer`, kirim ulang.

Lebar figur tidak dikirim per figur. Templat menetapkan satu kelas lebar per jenis figur (chart,
diagram, gambar, lembar simbol), sehingga semua gambar dalam dokumen yang sama selebar kolom teks
atau semuanya selebar bentang halaman. Lebar dalam mm diturunkan dari ukuran kertas templat
(A4 = 128 atau 166 mm; kertas lain menghasilkan lebar lain), dan domain sumbu chart yang perlu
dipatok juga parameter templat. Bila satu figur tampak perlu lebar lain, laporkan ke
pemilik templat; jangan menambah medan.

Contoh satu section berisi chart kategoris bersasaran, chart komposit dengan ambang panel, dan
gambar bersumber:

<!-- studio:validate studio.chapter/v2 -->
```json
{
  "$schema": "studio.chapter/v2",
  "agentId": "gsp-analis-01",
  "target": { "documentId": "cmw1doc8k2p4x7q9z3" },
  "chapter": {
    "key": "4",
    "title": { "text": "Kinerja Pemeliharaan" },
    "sections": [
      { "title": { "text": "Capaian terhadap Sasaran" }, "blocks": [
        { "type": "chart", "code": "P-09",
          "data": { "shape": "categorical", "points": [
            { "label": "Gardu A", "value": 78, "target": 85 },
            { "label": "Gardu B", "value": 82, "target": 80 },
            { "label": "Gardu C", "value": 64, "target": 70 } ] },
          "highlight": ["Gardu C"], "unit": "%", "dec": 0,
          "caption": { "text": "Capaian indeks kesiapan terhadap sasaran per gardu." },
          "source": { "text": "Rekap pemeliharaan Q3 2026", "provenance": ["TERUKUR"] } },
        { "type": "chart", "code": "composite",
          "panels": [
            { "name": "Kebisingan", "code": "P-11",
              "data": { "shape": "categorical", "points": [
                { "label": "Jul", "value": 52.1 }, { "label": "Agu", "value": 54.8 }, { "label": "Sep", "value": 56.2 } ] },
              "unit": "dB(A)", "dec": 1, "limit": { "value": 55, "label": "batas 55,0 dB(A)" } },
            { "name": "Realisasi", "code": "P-03",
              "data": { "shape": "series", "categories": ["K1", "K2", "K3"],
                        "series": [{ "name": "rencana", "values": [10, 12, 14] },
                                   { "name": "real", "values": [9, 12, 11] }] },
              "highlight": ["K3", "real"] } ],
          "caption": { "text": "Kebisingan trafo per bulan dan realisasi pekerjaan per triwulan." },
          "source": { "text": "Log pengukuran dan laporan bulanan 2026", "provenance": ["TERUKUR"] } },
        { "type": "image", "asset": "sha256:c14cc4c48a5e9c2b04a2bb79a2cc8a5e32ed40638edfa0213d576176162406f2",
          "caption": { "text": "Panel kendali Gardu C setelah pembersihan." },
          "source": { "text": "Foto lapangan 2026-10-21", "provenance": ["TERUKUR"] } } ] } ]
  }
}
```

---

## 5. Mengirim isi

### 5.1 E0: dokumen kosong berkerangka

Opsional. Berguna bila controller ingin nomor dokumen dan `document.id` sebelum agen bab mulai.
Tanpa langkah ini, kiriman bab pertama membuat dokumen yang sama (5.2).

`POST /api/studio/documents`:

<!-- studio:validate studio.doc/v2 -->
```json
{
  "$schema": "studio.doc/v2",
  "agentId": "gsp-controller-01",
  "template": { "slug": "datum-gsp" },
  "mission": { "folder": "2026-10-23_misi_a", "hermesTaskId": "ht_7f3a" },
  "docKey": "laporan-survei",
  "meta": { "title": "Laporan Survei Gardu Induk Cikupa" }
}
```

Respons `201`:

<!-- studio:response -->
```json
{
  "document": { "id": "cmw1doc8k2p4x7q9z3", "docNumber": "014/GSP/KT/X/2026", "missionFolder": "2026-10-23_misi_a",
                "docKey": "laporan-survei", "template": { "slug": "datum-gsp", "versionNo": 2 }, "tier": "TERBIT" },
  "created": true, "unchanged": false, "rebased": false,
  "revision": { "revisionNo": 1, "changeScope": "create", "changeAuto": true },
  "completeness": {
    "status": "INCOMPLETE", "revisionNo": 1, "fullRenderAllowed": false,
    "slots": [
      { "slotKey": "cover", "label": "Sampul", "sectionType": "cover", "state": "AUTO_READY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "controlSheet", "label": "Lembar Kendali", "sectionType": "controlSheet", "state": "EMPTY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "signature", "label": "Tanda Tangan", "sectionType": "signatureBlock", "state": "EMPTY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "toc", "label": "Daftar Isi", "sectionType": "toc", "state": "AUTO_READY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "content", "label": "Isi", "sectionType": "chapter", "state": "EMPTY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "references", "label": "Referensi", "sectionType": "sourceRegister", "state": "OPTIONAL_EMPTY", "required": false, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "appendices", "label": "Lampiran", "sectionType": "appendix", "state": "OPTIONAL_EMPTY", "required": false, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null } ],
    "chapters": {
      "content": { "expected": [], "expectedSource": "contiguous", "present": [], "missing": [], "minItems": 1 },
      "appendices": { "expected": [], "expectedSource": "contiguous", "present": [], "missing": [] } },
    "missingRequired": ["controlSheet", "signature", "content"],
    "nextSteps": [
      "Kirim isi Lembar Kendali, Tanda Tangan: POST /api/studio/slots",
      "Kirim bab pertama: POST /api/studio/chapters",
      "Opsional: tetapkan daftar bab yang direncanakan: PATCH /api/studio/documents/cmw1doc8k2p4x7q9z3/structure {op: setOutline}" ],
    "message": "Dokumen 014/GSP/KT/X/2026 (misi 2026-10-23_misi_a, laporan-survei) belum lengkap pada revisi 1: isi wajib belum ada untuk Lembar Kendali, Tanda Tangan, Isi. Render penuh ditolak; render bab/slot tersedia sebagai draf.",
    "forwardToController": "Dokumen 014/GSP/KT/X/2026 (misi 2026-10-23_misi_a) dibuat kosong pada revisi 1. Isi wajib belum ada: Lembar Kendali, Tanda Tangan, Isi. Langkah berikut: kirim Lembar Kendali dan Tanda Tangan (POST /api/studio/slots) serta bab (POST /api/studio/chapters), lalu minta render penuh."
  }
}
```

Meta yang tidak dikirim diisi templat: `docNumber` dari sekuens HQ, `rev`, `typeCode`, `tier`,
`classification`, dan `language` dari default templat, `author` dari `agentId`, `issueDate` =
tanggal pembuatan (Asia/Jakarta). Ubah meta kemudian lewat `PATCH .../structure` op `setMeta`.

Nama folder misi: pola folder misi IL `YYYY-MM-DD_<misi>` (contoh `2026-10-23_misi_a`). Folder misi
adalah path infrastruktur dan tidak diuji cek `N1`. `hermesTaskId` dan
`agentRequestId` harus merujuk baris yang ada (selain itu `404 MISSION_REF_NOT_FOUND`).

### 5.2 E2: bab 3 misi A, gambar di posisi paragraf 3.2.3, dan tabel (D-128)

Use case utama: agen analis mengirim bab 3 per section per paragraf. Gambar menempati posisi ke-3
section 3.2, sehingga mendapat alamat `3.2.3` dan label `Gambar 3.1`. Agen tidak menulis nomor,
lebar, atau label apa pun.

`POST /api/studio/chapters`:

<!-- studio:validate studio.chapter/v2 -->
```json
{
  "$schema": "studio.chapter/v2",
  "agentId": "gsp-analis-01",
  "target": { "mission": { "folder": "2026-10-23_misi_a", "hermesTaskId": "ht_7f3a" }, "docKey": "laporan-survei" },
  "template": { "slug": "datum-gsp" },
  "meta": { "title": "Laporan Survei Gardu Induk Cikupa" },
  "chapter": {
    "key": "3",
    "title": { "text": "Analisis Kondisi Peralatan" },
    "sections": [
      { "title": { "text": "Metode Penilaian" }, "blocks": [
        { "type": "paragraph", "text": "Penilaian memakai skor kondisi 1 sampai 5 per peralatan." },
        { "type": "paragraph", "text": "Skor diberikan dari inspeksi visual dan uji tahanan isolasi." } ] },
      { "title": { "text": "Kondisi Pemutus Tenaga" }, "blocks": [
        { "type": "paragraph", "text": "Tiga pemutus tenaga diperiksa pada 2026-10-20." },
        { "type": "paragraph", "text": "PMT-2 menunjukkan korosi pada terminal sisi beban." },
        { "type": "image", "asset": "foto-pmt2",
          "caption": { "text": "Korosi pada terminal PMT-2." },
          "source": { "text": "Foto lapangan 2026-10-20", "provenance": ["TERUKUR"] } },
        { "type": "paragraph", "text": "Korosi ini menurunkan tahanan kontak dan perlu pembersihan." } ] },
      { "title": { "text": "Ringkasan Skor" }, "blocks": [
        { "type": "paragraph", "text": "Tabel berikut merangkum skor kondisi." },
        { "type": "table", "caption": { "text": "Skor kondisi pemutus tenaga." },
          "columns": [{ "role": "id" }, { "role": "numeral" }],
          "rows": [
            { "kind": "header", "cells": [{ "text": "Unit" }, { "text": "Skor" }] },
            { "cells": [{ "text": "PMT-1" }, { "text": "4" }] },
            { "cells": [{ "text": "PMT-2" }, { "text": "2" }] } ],
          "source": { "text": "Inspeksi 2026-10-20", "provenance": ["TERUKUR"] } } ] } ]
  },
  "assets": { "foto-pmt2": { "assetRef": "sha256:c14cc4c48a5e9c2b04a2bb79a2cc8a5e32ed40638edfa0213d576176162406f2" } }
}
```

`template` dan `meta.title` wajib hanya bila dokumen belum ada (selain itu
`400 META_REQUIRED_FOR_CREATE`); bila dokumen ada, keduanya boleh dibuang. `assetRef` berasal dari
unggahan `POST /api/studio/assets` (seksi 10). `slot` bawaan = slot berulang pertama (`content`);
untuk lampiran tambahkan `"slot": "appendices"` dan kunci huruf.

Respons `201` (dokumen dibuat pada revisi yang sama). Kiriman tidak membangun berkas, jadi respons
tidak memuat `job` atau `outputs`; draf bab 3 diminta terpisah lewat seksi 8:

<!-- studio:response -->
```json
{
  "document": { "id": "cmw1doc8k2p4x7q9z3", "docNumber": "014/GSP/KT/X/2026", "missionFolder": "2026-10-23_misi_a",
                "docKey": "laporan-survei", "template": { "slug": "datum-gsp", "versionNo": 2 }, "tier": "TERBIT" },
  "created": true, "unchanged": false, "rebased": false,
  "revision": { "revisionNo": 1, "changeScope": "create;chapter:3", "changeAuto": true },
  "chapter": { "slotKey": "content", "chapterKey": "3", "pid": "bab-3", "sha256": "5b0c2f9e7a1d4c6b8e0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b",
    "blocks": [
      { "address": "3.1.1", "pid": "p-a7k2m9q4xz", "type": "paragraph" },
      { "address": "3.1.2", "pid": "p-b3n8r1t6yw", "type": "paragraph" },
      { "address": "3.2.1", "pid": "p-c9d4f2h7jk", "type": "paragraph" },
      { "address": "3.2.2", "pid": "p-d1g5j8n3mq", "type": "paragraph" },
      { "address": "3.2.3", "pid": "p-e6h2k9p4qr", "type": "image", "artifactLabel": "Gambar 3.1" },
      { "address": "3.2.4", "pid": "p-f8j3m6s1tv", "type": "paragraph" },
      { "address": "3.3.1", "pid": "p-g2k7n4v9wx", "type": "paragraph" },
      { "address": "3.3.2", "pid": "p-h5m1q8v3yz", "type": "table", "artifactLabel": "Tabel 3.1" } ] },
  "completeness": {
    "status": "INCOMPLETE", "revisionNo": 1, "fullRenderAllowed": false,
    "slots": [
      { "slotKey": "cover", "label": "Sampul", "sectionType": "cover", "state": "AUTO_READY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "controlSheet", "label": "Lembar Kendali", "sectionType": "controlSheet", "state": "EMPTY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "signature", "label": "Tanda Tangan", "sectionType": "signatureBlock", "state": "EMPTY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "toc", "label": "Daftar Isi", "sectionType": "toc", "state": "AUTO_READY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "content", "label": "Isi", "sectionType": "chapter", "state": "PARTIAL", "required": true, "lastFilledBy": "agent:gsp-analis-01", "lastFilledAt": "2026-10-23T02:05:11.000Z", "lastFilledRevisionNo": 1 },
      { "slotKey": "references", "label": "Referensi", "sectionType": "sourceRegister", "state": "OPTIONAL_EMPTY", "required": false, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "appendices", "label": "Lampiran", "sectionType": "appendix", "state": "OPTIONAL_EMPTY", "required": false, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null } ],
    "chapters": {
      "content": { "expected": ["1", "2", "3"], "expectedSource": "contiguous",
                   "present": [{ "key": "3", "pid": "bab-3", "by": "agent:gsp-analis-01", "at": "2026-10-23T02:05:11.000Z", "revisionNo": 1 }],
                   "missing": ["1", "2"], "minItems": 1 },
      "appendices": { "expected": [], "expectedSource": "contiguous", "present": [], "missing": [] } },
    "missingRequired": ["controlSheet", "signature", "content:1", "content:2"],
    "nextSteps": [
      "Kirim isi Lembar Kendali, Tanda Tangan: POST /api/studio/slots",
      "Kirim bab 1, 2: POST /api/studio/chapters",
      "Opsional: tetapkan daftar bab yang direncanakan: PATCH /api/studio/documents/cmw1doc8k2p4x7q9z3/structure {op: setOutline}" ],
    "message": "Dokumen 014/GSP/KT/X/2026 (misi 2026-10-23_misi_a, laporan-survei) belum lengkap pada revisi 1: isi wajib belum ada untuk Lembar Kendali, Tanda Tangan; bab belum ada 1, 2. Render penuh ditolak; render bab/slot tersedia sebagai draf.",
    "forwardToController": "Dokumen 014/GSP/KT/X/2026 (misi 2026-10-23_misi_a) belum lengkap pada revisi 1. Isi wajib belum ada: Lembar Kendali, Tanda Tangan. Bab belum ada: 1, 2. Terakhir mengisi: bab 3 oleh agent:gsp-analis-01 pukul 09:05 WIB. Langkah berikut: kirim Lembar Kendali dan Tanda Tangan (POST /api/studio/slots) serta bab 1 dan 2 (POST /api/studio/chapters), lalu minta render penuh."
  }
}
```

Waktu di `message` dan `forwardToController` memakai WIB (Asia/Jakarta, UTC+7); medan `at` dan
`lastFilledAt` tetap ISO 8601 UTC. `02:05:11Z` = pukul 09:05 WIB. Medan `by`, `lastFilledBy`, dan
`changedBy` berisi label pemanggil (`agent:<agentId>` untuk agen).

Bila dokumen sudah ada (mis. dibuat lewat E0), kiriman yang sama menghasilkan `created: false`,
revisi berikutnya, dan `changeScope: "chapter:3"`.

### 5.3 Kirim ulang dan perbarui bab

- Kiriman ulang identik: `200 { "created": false, "unchanged": true, "revision": { "revisionNo": n } }`
  tanpa revisi baru. Aman diulang setelah timeout jaringan.
- Bab 3 berubah: `201`, revisi n+1, `changeScope: "chapter:3"`; bab lain tidak tersentuh.
- Pid dipertahankan tanpa agen menulis `id`: blok di posisi yang sama dalam section yang sama
  mewarisi pid lama, blok tambahan mendapat pid baru, blok yang hilang dipensiunkan. Untuk
  memindah paragraf tanpa kehilangan riwayatnya, kirim `id` lama di blok itu atau pakai PATCH
  `move` (seksi 9).
- `baseRevisionNo` opsional di kiriman bab dan slot. Tanpa nilai itu penulis terakhir untuk bab
  yang sama menang. Dengan nilai itu, bab yang sama yang berubah sejak revisi tersebut ditolak
  `409 SCOPE_CONFLICT`; bab lain digabung (`rebased: true`).

### 5.4 Mengisi slot halaman depan

`POST /api/studio/slots`, satu slot per kiriman. Lembar Kendali:

<!-- studio:validate studio.slot/v2 -->
```json
{
  "$schema": "studio.slot/v2",
  "agentId": "gsp-analis-03",
  "target": { "documentId": "cmw1doc8k2p4x7q9z3" },
  "slot": "controlSheet",
  "payload": {
    "type": "controlSheet",
    "revisionHistory": [{ "rev": "A", "date": "2026-10-23", "what": "Terbit pertama", "by": "Tim Survei" }],
    "verificationChain": [
      { "layer": "1", "role": "Penyusun", "name": "A. Pratama" },
      { "layer": "2", "role": "Pemeriksa", "name": "B. Santoso" } ],
    "methodStatement": { "text": "Pengukuran langsung di lapangan; metode rinci di Bab 3." },
    "distribution": [{ "copy": "1", "holder": "Manajer Proyek" }]
  }
}
```

Tanda Tangan (penempatan di Lembar Kendali diatur templat):

<!-- studio:validate studio.slot/v2 -->
```json
{
  "$schema": "studio.slot/v2",
  "agentId": "gsp-analis-03",
  "target": { "documentId": "cmw1doc8k2p4x7q9z3" },
  "slot": "signature",
  "payload": {
    "type": "signatureBlock",
    "roles": [
      { "role": { "text": "Disusun" }, "holder": { "text": "A. Pratama" }, "date": { "text": "2026-10-23" } },
      { "role": { "text": "Diperiksa" }, "holder": { "text": "B. Santoso" } },
      { "role": { "text": "Disetujui" }, "holder": { "text": "C. Wijaya" } } ]
  }
}
```

Referensi (opsional):

<!-- studio:validate studio.slot/v2 -->
```json
{
  "$schema": "studio.slot/v2",
  "agentId": "gsp-analis-02",
  "target": { "docNumber": "014/GSP/KT/X/2026" },
  "slot": "references",
  "payload": {
    "type": "sourceRegister",
    "entries": [
      { "id": "r1", "citation": { "text": "SPLN T5.008:2019 Pemeliharaan Trafo Tenaga" }, "kind": "standar" },
      { "id": "r2", "citation": { "text": "Laporan inspeksi PMT GI Cikupa 2025" }, "kind": "laporan", "accessed": "2026-10-20" } ]
  }
}
```

Respons `201 SubmitResultV2` dengan `slot: { slotKey, pid?, sha256, address }` (alamat
`F:controlSheet`, `F:signature`, entri referensi `F:references/1`, `F:references/2`) dan
`completeness` terbaru. Aturan:

- `type` payload harus sama dengan jenis slot (`signature` berjenis `signatureBlock`), selain itu
  `422 SLOT_TYPE_MISMATCH`.
- Slot berulang (`content`, `appendices`) lewat `/slots`: `422 SLOT_USE_CHAPTER_ENDPOINT` dengan
  `details.use = "POST /api/studio/chapters"`.
- Slot otomatis (`toc`) menolak isi: `422 SLOT_INPUT_NOT_ACCEPTED`. Sampul (`cover`) otomatis dari
  `meta`; kirim payload `cover` hanya untuk baris yang memang isi (`titleLines`, `standfirst`,
  `scopeLine`).

### 5.5 Uji kiriman tanpa menyimpan (R08)

`POST /api/studio/validate` menerima badan yang sama persis dengan `/documents`, `/chapters`, atau
`/slots` (atau bentuk `{ "schemaId": "...", "spec": {...} }`). Studio menjalankan seluruh jalur
kiriman, termasuk penggabungan dengan dokumen yang ada, cek dasar revisi, dan gerbang
by-construction, di transaksi baca-saja: tidak ada revisi baru, tidak ada berkas, tidak ada build.

Respons selalu `200`, kecuali `401` (tanpa autentikasi), `403` (templat terbatas), `413` (badan terlalu besar), `415` (bukan JSON), `400 JSON_MALFORMED`, dan `429`: setiap panggilan R08 dihitung di kuota validasi tersendiri (bawaan 120 per 60 detik per identitas), dan `?preview=html` juga dihitung di kuota render bersama (30 per 60 detik):

| Medan | Isi |
|---|---|
| `valid` | `true` bila kiriman nyata akan diterima |
| `issues` | isu yang sama dengan galat kiriman nyata (mis. `DATUM-04`, `RENDER_FIELD`, `SCOPE_CONFLICT`, `DOCUMENT_NOT_FOUND`) dengan `pointer` relatif badan (prefiks `/spec` untuk bentuk `{ schemaId, spec }`) |
| `lint` | hasil lint ingest |
| `completenessPreview` | kelengkapan dokumen SESUDAH kiriman digabung |
| `submitPreview` | khusus bab/slot: `{ documentId \| null, docNumber, created, unchanged, rebased, revisionNo, changeScope, chapter? \| slot? }` = respons yang akan terjadi; `documentId: null` berarti dokumen akan dibuat |

`?preview=html` menambah `previewHtml` (dokumen tergabung, bertanda draf bila belum lengkap).
Pakai R08 sebelum kiriman besar atau bila ragu apakah bab akan lolos gerbang.

---

## 6. Membaca: kelengkapan, struktur, isi

| Route | Isi |
|---|---|
| `GET /api/studio/documents/[id]/completeness?rev=n` | `{ documentId, completeness }` |
| `GET /api/studio/documents?mission=<folder>&docKey=<kunci>` | daftar dokumen misi + `completeness { status, missingRequired }` |
| `GET /api/studio/documents/[id]?rev=n` | pohon `slots[]` (slot, bab, section, blok dengan alamat dan pid) + `completeness` + `outputs` (berkas dari render yang sudah diminta) |
| `GET /api/studio/documents/[id]/structure?rev=n` | urutan slot, outline, meta, versi templat, kelengkapan |
| `GET /api/studio/documents/[id]/content?slot=&chapter=&rev=n` | isi dalam bentuk kiriman v2 + pid |
| `GET /api/studio/documents/[id]/paragraphs/[pid]?rev=n&history=1` | satu identitas (blok, section, atau bab) + riwayat |

State slot:

| State | Arti |
|---|---|
| `FILLED` | slot berisi (slot berulang: semua bab yang diharapkan ada) |
| `AUTO_READY` | slot otomatis, atau MIXED tanpa isi, yang dibangkitkan mesin |
| `EMPTY` | slot wajib tanpa isi |
| `PARTIAL` | slot berulang wajib yang sebagian babnya ada |
| `OPTIONAL_EMPTY` | slot opsional tanpa isi |
| `OMITTED` | slot opsional yang dihapus lewat struktur |

Dokumen `COMPLETE` bila `missingRequired` kosong. Bab yang diharapkan = outline (`setOutline`);
tanpa outline, `1..` kunci terbesar yang ada. Bab di luar outline tetap diterima.

Baca bab 3 untuk disunting: `GET /api/studio/documents/cmw1doc8k2p4x7q9z3/content?slot=content&chapter=3`.

<!-- studio:response -->
```json
{
  "document": { "id": "cmw1doc8k2p4x7q9z3", "docNumber": "014/GSP/KT/X/2026" },
  "revisionNo": 7,
  "slot": "content",
  "content": {
    "key": "3", "id": "bab-3",
    "title": { "text": "Analisis Kondisi Peralatan" },
    "sections": [
      { "id": "p-3r8kq2m7vd", "title": { "text": "Metode Penilaian" }, "blocks": [
        { "type": "paragraph", "id": "p-a7k2m9q4xz", "text": "Penilaian memakai skor kondisi 1 sampai 5 per peralatan." },
        { "type": "paragraph", "id": "p-b3n8r1t6yw", "text": "Skor diberikan dari inspeksi visual dan uji tahanan isolasi." } ] },
      { "id": "p-4s9mr3n8we", "title": { "text": "Kondisi Pemutus Tenaga" }, "blocks": [
        { "type": "paragraph", "id": "p-c9d4f2h7jk", "text": "Tiga pemutus tenaga diperiksa pada 2026-10-20." },
        { "type": "paragraph", "id": "p-d1g5j8n3mq", "text": "PMT-2 menunjukkan korosi pada terminal sisi beban." },
        { "type": "image", "id": "p-e6h2k9p4qr", "asset": "sha256:c14cc4c48a5e9c2b04a2bb79a2cc8a5e32ed40638edfa0213d576176162406f2",
          "caption": { "text": "Korosi pada terminal PMT-2." },
          "source": { "text": "Foto lapangan 2026-10-20", "provenance": ["TERUKUR"] } },
        { "type": "paragraph", "id": "p-f8j3m6s1tv", "text": "Korosi ini menurunkan tahanan kontak dan perlu pembersihan." } ] },
      { "id": "p-5t0ns4p9xf", "title": { "text": "Ringkasan Skor" }, "blocks": [
        { "type": "paragraph", "id": "p-g2k7n4v9wx", "text": "Tabel berikut merangkum skor kondisi." },
        { "type": "table", "id": "p-h5m1q8v3yz", "caption": { "text": "Skor kondisi pemutus tenaga." },
          "columns": [{ "role": "id" }, { "role": "numeral" }],
          "rows": [
            { "kind": "header", "cells": [{ "text": "Unit" }, { "text": "Skor" }] },
            { "cells": [{ "text": "PMT-1" }, { "text": "4" }] },
            { "cells": [{ "text": "PMT-2" }, { "text": "2" }] } ],
          "source": { "text": "Inspeksi 2026-10-20", "provenance": ["TERUKUR"] } } ] } ]
  }
}
```

Isi ini dapat diubah lalu dikirim balik utuh lewat `POST /api/studio/chapters` (pid ikut, sehingga
identitas tetap), atau disunting per pid (seksi 9).

---

## 7. Kerja paralel: E3a

Kiriman ke bab berbeda tidak pernah saling 409. Setiap penulisan memegang kunci dokumen,
membaca revisi terbaru n, menerapkan lingkupnya, lalu menulis n+1.

Keadaan awal (revisi 4): bab 1, 2, dan 3 ada; outline 1-5 ditetapkan lewat struktur:

<!-- studio:validate structure-patch -->
```json
{
  "op": "setOutline",
  "baseRevisionNo": 3,
  "agentId": "gsp-controller-01",
  "outline": [{ "key": "1" }, { "key": "2" }, { "key": "3" }, { "key": "4" }, { "key": "5" }],
  "change": { "what": "Tetapkan rencana lima bab", "why": "Pembagian kerja agen analis", "impact": "Kelengkapan menghitung bab 1-5" }
}
```

(`PATCH /api/studio/documents/cmw1doc8k2p4x7q9z3/structure`)

Lalu dua agen mengirim bersamaan, keduanya membaca revisi 4.

Agen 1 (`gsp-analis-01`), bab 4:

<!-- studio:validate studio.chapter/v2 -->
```json
{
  "$schema": "studio.chapter/v2",
  "agentId": "gsp-analis-01",
  "target": { "documentId": "cmw1doc8k2p4x7q9z3" },
  "baseRevisionNo": 4,
  "chapter": {
    "key": "4",
    "title": { "text": "Kondisi Transformator Daya" },
    "sections": [
      { "title": { "text": "Suhu Minyak" }, "blocks": [
        { "type": "paragraph", "runs": [ { "t": "Suhu minyak TD-1 " }, { "t": "di atas batas", "strong": true }, { "t": " operasi normal." } ] } ] } ]
  }
}
```

Agen 2 (`gsp-analis-02`), bab 5:

<!-- studio:validate studio.chapter/v2 -->
```json
{
  "$schema": "studio.chapter/v2",
  "agentId": "gsp-analis-02",
  "target": { "documentId": "cmw1doc8k2p4x7q9z3" },
  "baseRevisionNo": 4,
  "chapter": {
    "key": "5",
    "title": { "text": "Rekomendasi Pemeliharaan" },
    "sections": [
      { "title": { "text": "Prioritas" }, "blocks": [
        { "type": "list", "ordered": true, "items": [
          { "text": "Bersihkan terminal PMT-2 dalam 30 hari." },
          { "text": "Ukur ulang suhu minyak TD-1 setelah perbaikan pendingin." } ] } ] } ]
  }
}
```

Respons agen 1 (`201`, revisi 5; `document` dan `chapter` dihilangkan di sini):

<!-- studio:response -->
```json
{
  "created": false, "unchanged": false, "rebased": false,
  "revision": { "revisionNo": 5, "changeScope": "chapter:4", "changeAuto": true },
  "completeness": {
    "status": "INCOMPLETE", "revisionNo": 5, "fullRenderAllowed": false,
    "slots": [
      { "slotKey": "cover", "label": "Sampul", "sectionType": "cover", "state": "AUTO_READY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "controlSheet", "label": "Lembar Kendali", "sectionType": "controlSheet", "state": "EMPTY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "signature", "label": "Tanda Tangan", "sectionType": "signatureBlock", "state": "EMPTY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "toc", "label": "Daftar Isi", "sectionType": "toc", "state": "AUTO_READY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "content", "label": "Isi", "sectionType": "chapter", "state": "PARTIAL", "required": true, "lastFilledBy": "agent:gsp-analis-01", "lastFilledAt": "2026-10-23T09:12:04.000Z", "lastFilledRevisionNo": 5 },
      { "slotKey": "references", "label": "Referensi", "sectionType": "sourceRegister", "state": "OPTIONAL_EMPTY", "required": false, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "appendices", "label": "Lampiran", "sectionType": "appendix", "state": "OPTIONAL_EMPTY", "required": false, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null } ],
    "chapters": {
      "content": { "expected": ["1", "2", "3", "4", "5"], "expectedSource": "outline",
        "present": [
          { "key": "1", "pid": "bab-1", "by": "agent:gsp-analis-03", "at": "2026-10-23T08:40:11.000Z", "revisionNo": 2 },
          { "key": "2", "pid": "bab-2", "by": "agent:gsp-analis-03", "at": "2026-10-23T08:41:02.000Z", "revisionNo": 3 },
          { "key": "3", "pid": "bab-3", "by": "agent:gsp-analis-01", "at": "2026-10-23T02:05:11.000Z", "revisionNo": 1 },
          { "key": "4", "pid": "bab-4", "by": "agent:gsp-analis-01", "at": "2026-10-23T09:12:04.000Z", "revisionNo": 5 } ],
        "missing": ["5"], "minItems": 1 },
      "appendices": { "expected": [], "expectedSource": "contiguous", "present": [], "missing": [] } },
    "missingRequired": ["controlSheet", "signature", "content:5"],
    "nextSteps": [
      "Kirim isi Lembar Kendali, Tanda Tangan: POST /api/studio/slots",
      "Kirim bab 5: POST /api/studio/chapters" ],
    "message": "Dokumen 014/GSP/KT/X/2026 (misi 2026-10-23_misi_a, laporan-survei) belum lengkap pada revisi 5: isi wajib belum ada untuk Lembar Kendali, Tanda Tangan; bab belum ada 5. Render penuh ditolak; render bab/slot tersedia sebagai draf.",
    "forwardToController": "Dokumen 014/GSP/KT/X/2026 (misi 2026-10-23_misi_a) belum lengkap pada revisi 5. Isi wajib belum ada: Lembar Kendali, Tanda Tangan. Bab belum ada: 5. Terakhir mengisi: bab 4 oleh agent:gsp-analis-01 pukul 16:12 WIB. Langkah berikut: kirim Lembar Kendali dan Tanda Tangan (POST /api/studio/slots) serta bab 5 (POST /api/studio/chapters), lalu minta render penuh."
  }
}
```

Respons agen 2 (`201`, berbasis revisi 4, digabung di atas revisi 5):

<!-- studio:response -->
```json
{
  "created": false, "unchanged": false, "rebased": true, "baseRevisionNo": 4, "appliedOnRevisionNo": 5,
  "revision": { "revisionNo": 6, "changeScope": "chapter:5", "changeAuto": true },
  "completeness": {
    "status": "INCOMPLETE", "revisionNo": 6, "fullRenderAllowed": false,
    "slots": [
      { "slotKey": "cover", "label": "Sampul", "sectionType": "cover", "state": "AUTO_READY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "controlSheet", "label": "Lembar Kendali", "sectionType": "controlSheet", "state": "EMPTY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "signature", "label": "Tanda Tangan", "sectionType": "signatureBlock", "state": "EMPTY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "toc", "label": "Daftar Isi", "sectionType": "toc", "state": "AUTO_READY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "content", "label": "Isi", "sectionType": "chapter", "state": "FILLED", "required": true, "lastFilledBy": "agent:gsp-analis-02", "lastFilledAt": "2026-10-23T09:12:05.000Z", "lastFilledRevisionNo": 6 },
      { "slotKey": "references", "label": "Referensi", "sectionType": "sourceRegister", "state": "OPTIONAL_EMPTY", "required": false, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "appendices", "label": "Lampiran", "sectionType": "appendix", "state": "OPTIONAL_EMPTY", "required": false, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null } ],
    "chapters": {
      "content": { "expected": ["1", "2", "3", "4", "5"], "expectedSource": "outline",
        "present": [
          { "key": "1", "pid": "bab-1", "by": "agent:gsp-analis-03", "at": "2026-10-23T08:40:11.000Z", "revisionNo": 2 },
          { "key": "2", "pid": "bab-2", "by": "agent:gsp-analis-03", "at": "2026-10-23T08:41:02.000Z", "revisionNo": 3 },
          { "key": "3", "pid": "bab-3", "by": "agent:gsp-analis-01", "at": "2026-10-23T02:05:11.000Z", "revisionNo": 1 },
          { "key": "4", "pid": "bab-4", "by": "agent:gsp-analis-01", "at": "2026-10-23T09:12:04.000Z", "revisionNo": 5 },
          { "key": "5", "pid": "bab-5", "by": "agent:gsp-analis-02", "at": "2026-10-23T09:12:05.000Z", "revisionNo": 6 } ],
        "missing": [], "minItems": 1 },
      "appendices": { "expected": [], "expectedSource": "contiguous", "present": [], "missing": [] } },
    "missingRequired": ["controlSheet", "signature"],
    "nextSteps": ["Kirim isi Lembar Kendali, Tanda Tangan: POST /api/studio/slots"],
    "message": "Dokumen 014/GSP/KT/X/2026 (misi 2026-10-23_misi_a, laporan-survei) belum lengkap pada revisi 6: isi wajib belum ada untuk Lembar Kendali, Tanda Tangan. Render penuh ditolak; render bab/slot tersedia sebagai draf.",
    "forwardToController": "Dokumen 014/GSP/KT/X/2026 (misi 2026-10-23_misi_a) belum lengkap pada revisi 6. Isi wajib belum ada: Lembar Kendali, Tanda Tangan. Terakhir mengisi: bab 5 oleh agent:gsp-analis-02 pukul 16:12 WIB. Langkah berikut: kirim Lembar Kendali dan Tanda Tangan (POST /api/studio/slots), lalu minta render penuh."
  }
}
```

Penomoran artefak dihitung per kunci bab, jadi bab yang tiba tidak berurutan tidak saling
menggeser nomor `Tabel 4.n` dan `Gambar 5.n`. Rujukan di prosa ("lihat Tabel 3.1") tidak ditulis
ulang mesin.

---

## 8. Render

| Permintaan | Hasil |
|---|---|
| `scope: "chapter"` + `key`, atau `scope: "slot"` + `key` | selalu boleh; berkas bertanda draf (`draft: true`) di folder `rev-<n>/bab-<kunci>/` atau `rev-<n>/slot-<slotKey>/` |
| `scope: "document"` pada dokumen `COMPLETE` | render penuh, `draft: false` |
| `scope: "document"` pada dokumen `INCOMPLETE` | `409 DOCUMENT_INCOMPLETE` (E3b) |
| medan `render` di badan kiriman (`/documents`, `/chapters`, `/slots`) atau sunting (PATCH pid, alamat, struktur) | `400 SCHEMA_INVALID` `checkId: "RENDER_FIELD"`, pointer `/render`; tidak ada yang disimpan |

Route ini satu-satunya pemicu build. Urutan yang benar: kirim atau sunting, baca
`completeness.fullRenderAllowed` di respons, lalu panggil route render dengan lingkup yang sesuai.

Render draf bab 3: `POST /api/studio/documents/cmw1doc8k2p4x7q9z3/render`

<!-- studio:validate render -->
```json
{ "scope": "chapter", "key": "3", "formats": ["docx", "pdf"], "agentId": "gsp-analis-01" }
```

Render penuh:

<!-- studio:validate render -->
```json
{ "scope": "document", "formats": ["docx", "pdf"], "agentId": "gsp-controller-01" }
```

`key` wajib untuk `chapter`/`slot` dan dilarang untuk `document`. `formats` ⊆ `docx`, `pdf`,
`html`; `figures` ⊆ `svg`, `png`; `revisionNo` opsional (bawaan terbaru). Respons `200
{ job: { ..., scope, draft }, outputs, completeness }`.

### 8.1 E3b: render penuh ditolak

Render penuh pada revisi 6 (Lembar Kendali dan Tanda Tangan belum ada) menghasilkan `409`:

<!-- studio:response -->
```json
{
  "error": "Dokumen belum lengkap; render penuh ditolak",
  "code": "DOCUMENT_INCOMPLETE",
  "details": {
    "completeness": {
      "status": "INCOMPLETE", "revisionNo": 6, "fullRenderAllowed": false,
      "slots": [
        { "slotKey": "controlSheet", "label": "Lembar Kendali", "sectionType": "controlSheet", "state": "EMPTY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
        { "slotKey": "signature", "label": "Tanda Tangan", "sectionType": "signatureBlock", "state": "EMPTY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null } ],
      "missingRequired": ["controlSheet", "signature"],
      "nextSteps": ["Kirim isi Lembar Kendali, Tanda Tangan: POST /api/studio/slots"],
      "message": "Dokumen 014/GSP/KT/X/2026 (misi 2026-10-23_misi_a, laporan-survei) belum lengkap pada revisi 6: isi wajib belum ada untuk Lembar Kendali, Tanda Tangan. Render penuh ditolak; render bab/slot tersedia sebagai draf."
    },
    "allowedScopes": ["chapter", "slot"],
    "forwardToController": "Dokumen 014/GSP/KT/X/2026 (misi 2026-10-23_misi_a) belum lengkap pada revisi 6. Isi wajib belum ada: Lembar Kendali, Tanda Tangan. Terakhir mengisi: bab 5 oleh agent:gsp-analis-02 pukul 16:12 WIB. Langkah berikut: kirim Lembar Kendali dan Tanda Tangan (POST /api/studio/slots), lalu minta render penuh."
  }
}
```

(`details.completeness` dipersingkat di sini: hanya slot yang kosong. Respons nyata memuat laporan
lengkap seperti seksi 7.)

Tindakan agen: jangan mengulang render penuh. Teruskan `details.forwardToController` apa adanya ke
controller, atau isi sendiri bagian yang memang tugasmu, lalu minta render penuh lagi. Render
`chapter`/`slot` tetap tersedia sebagai pratinjau.

### 8.2 Kiriman dengan medan `render` ditolak

Contoh yang DITOLAK (build tidak diminta lewat kiriman):

<!-- studio:invalid studio.chapter/v2 RENDER_FIELD -->
```json
{
  "$schema": "studio.chapter/v2",
  "agentId": "gsp-analis-01",
  "target": { "documentId": "cmw1doc8k2p4x7q9z3" },
  "chapter": {
    "key": "3",
    "title": { "text": "Analisis Kondisi Peralatan" },
    "sections": [
      { "title": { "text": "Kondisi Pemutus Tenaga" }, "blocks": [
        { "type": "paragraph", "text": "Tiga pemutus tenaga diperiksa pada 2026-10-20." } ] } ]
  },
  "render": { "scope": "chapter", "formats": ["docx"] }
}
```

Respons:

<!-- studio:response -->
```json
{
  "error": "render tidak diterima di kiriman atau sunting; build dokumen lewat POST /api/studio/documents/{id}/render sesudah kiriman tersimpan (render penuh hanya bila completeness.fullRenderAllowed = true; render bab/slot = draf)",
  "code": "SCHEMA_INVALID",
  "details": [
    { "pointer": "/render", "keyword": "additionalProperties", "checkId": "RENDER_FIELD",
      "message": "render tidak diterima di kiriman atau sunting; build dokumen lewat POST /api/studio/documents/{id}/render sesudah kiriman tersimpan (render penuh hanya bila completeness.fullRenderAllowed = true; render bab/slot = draf)" }
  ]
}
```

Tindakan: hapus `render`, kirim ulang, lalu panggil `POST /api/studio/documents/[id]/render`.
Aturan yang sama berlaku untuk `PATCH .../paragraphs/[pid]`, `PATCH .../blocks/[address]`, dan
`PATCH .../structure`.

Riwayat render: `POST /api/studio/documents/[id]/revisions` `{ "revisionNo": n }` merender ulang
revisi lama tanpa revisi baru; revisi INCOMPLETE ditolak `409 DOCUMENT_INCOMPLETE`. Unduh berkas
lewat `outputs[].url` (`GET /api/studio/files/<id>`; cocokkan header `X-Studio-Sha256` dengan
`outputs[].sha256`).

---

## 9. Menyunting per pid

`PATCH /api/studio/documents/[id]/paragraphs/[pid]` membuat revisi baru. Revisi lama tidak pernah
berubah.

| Medan | Wajib | Isi |
|---|---|---|
| `op` | ya | lihat tabel op |
| `baseRevisionNo` | ya | revisi tempat agen membaca pid |
| `block` / `section` / `chapter` | menurut op | fragmen v2 (bentuk seksi 4), tanpa medan tampilan |
| `to` | `move` | `{ before?: pid, after?: pid, section?: { chapterKey, sectionNo, at } }` |
| `change` | ya | `{ what, why, impact }`, masing-masing kalimat nyata (maks 2.000 karakter) |
| `agentId` | tidak | label pencatat |

Tidak ada medan `render` (ditolak `RENDER_FIELD`); build sesudah PATCH lewat seksi 8. Isi yang
melanggar cek by-construction ditolak `422 BY_CONSTRUCTION_FAILED` seperti kiriman.

| `op` | Jenis identitas | Hasil |
|---|---|---|
| `replace` | blok, section, bab | isi diganti, pid tetap; blok boleh berganti jenis (paragraf menjadi gambar, dan sebaliknya) |
| `insertBefore`, `insertAfter` | blok, section | respons memuat `newPid` dan `addressMap` |
| `delete` | blok, section, bab | pid dipensiunkan (tidak dapat dipakai ulang) |
| `move` | blok | pindah lintas section atau bab; respons memuat `addressMap` |

Op yang tidak cocok dengan jenis identitas: `400 SCHEMA_INVALID` `checkId: "PID_OP_KIND"`.

### 9.1 E3c: PATCH satu paragraf lalu minta render penuh

Dokumen sudah `COMPLETE` (revisi 9). Agen membaca bab 3 pada revisi 7, lalu memperbarui paragraf
3.2.2 (`p-d1g5j8n3mq`):

`PATCH /api/studio/documents/cmw1doc8k2p4x7q9z3/paragraphs/p-d1g5j8n3mq`

<!-- studio:validate pid-patch -->
```json
{
  "op": "replace",
  "baseRevisionNo": 7,
  "agentId": "gsp-analis-01",
  "block": { "type": "paragraph", "text": "PMT-2 menunjukkan korosi berat pada terminal sisi beban dan sisi sumber." },
  "change": { "what": "Perbarui temuan PMT-2", "why": "Hasil inspeksi ulang 2026-10-22", "impact": "Paragraf 3.2.2 saja" }
}
```

Respons `200` (`completeness` dipersingkat):

<!-- studio:response -->
```json
{
  "revision": { "revisionNo": 10, "changeScope": "pid:p-d1g5j8n3mq", "changeAuto": false },
  "pid": "p-d1g5j8n3mq", "address": "3.2.2", "addressMap": {},
  "rebased": true, "baseRevisionNo": 7, "appliedOnRevisionNo": 9,
  "completeness": { "status": "COMPLETE", "revisionNo": 10, "fullRenderAllowed": true, "missingRequired": [],
    "nextSteps": ["Minta render penuh: POST /api/studio/documents/cmw1doc8k2p4x7q9z3/render {scope: \"document\"}"],
    "message": "Dokumen 014/GSP/KT/X/2026 lengkap pada revisi 10; render penuh tersedia." }
}
```

`fullRenderAllowed: true`, jadi agen lalu memanggil
`POST /api/studio/documents/cmw1doc8k2p4x7q9z3/render` dengan `{ "scope": "document" }` (seksi 8).

Konflik hanya terjadi bila pid itu sendiri (atau pid jangkar `insert*`/`move`) berubah sejak
`baseRevisionNo`. Revisi 8 dan 9 mengubah slot lain, jadi PATCH ini digabung (`rebased: true`).

### 9.2 Paragraf diganti gambar (D-131)

Paragraf 3.2.4 diganti foto detail. Di PATCH, aset dirujuk langsung dengan `sha256:<heks>` karena
tidak ada peta `assets`:

<!-- studio:validate pid-patch -->
```json
{
  "op": "replace",
  "baseRevisionNo": 10,
  "agentId": "gsp-analis-01",
  "block": { "type": "image", "asset": "sha256:bc8894ce6e70dc4e15b67070d7e30209af62b390d6908c1ef862b5a94df8bd4e",
    "caption": { "text": "Detail korosi terminal sisi sumber PMT-2." },
    "source": { "text": "Foto lapangan 2026-10-22", "provenance": ["TERUKUR"] } },
  "change": { "what": "Ganti paragraf 3.2.4 dengan foto detail", "why": "Foto lebih jelas dari uraian", "impact": "Gambar 3.2 baru di 3.2.4" }
}
```

Respons memuat `pid` yang sama (`p-f8j3m6s1tv`), `address: "3.2.4"`, dan label artefak baru di
pohon dokumen (`Gambar 3.2`).

### 9.3 Konflik lingkup

Agen lain yang masih memegang revisi 9 lalu menyunting pid yang sama mendapat `409`:

<!-- studio:response -->
```json
{
  "error": "pid p-d1g5j8n3mq diubah pada revisi 10 oleh agent:gsp-analis-01 setelah revisi 9; baca isi terbaru lalu ulangi sunting",
  "code": "SCOPE_CONFLICT",
  "details": {
    "scope": "pid:p-d1g5j8n3mq", "pid": "p-d1g5j8n3mq", "baseRevisionNo": 9, "changedInRevisionNo": 10,
    "changedBy": "agent:gsp-analis-01",
    "currentContent": { "type": "paragraph", "id": "p-d1g5j8n3mq", "text": "PMT-2 menunjukkan korosi berat pada terminal sisi beban dan sisi sumber." }
  }
}
```

Tindakan: bandingkan `currentContent` dengan maksud perubahanmu, gabungkan, lalu kirim ulang
dengan `baseRevisionNo` = `changedInRevisionNo`. Bila tidak bisa digabung, teruskan ke controller.

### 9.4 Alternatif: sunting per alamat dan op struktur

- `PATCH /api/studio/documents/[id]/blocks/[address]` (alamat C.S.P, label artefak, sel tabel)
  tetap tersedia dengan badan yang sama (`op`, `baseRevisionNo`, `block`/`cell`, `change`). Pid
  lebih aman: alamat bergeser saat blok disisipkan atau dihapus, pid tidak.
- `PATCH /api/studio/documents/[id]/structure`: `reorder`, `omitSlot`, `restoreSlot`, `setOutline`,
  `setMeta`, `templateVersion`; `renumberChapters` hanya ADMIN (`403 FORBIDDEN`). Semua wajib
  `baseRevisionNo` dan `change`.
- Riwayat satu pid: `GET .../paragraphs/[pid]?history=1` →
  `[{ revisionNo, changeScope, by, at, contentSha256, address, retired }]`.

---

## 10. Aset gambar

Dua cara:

1. **Unggah terpisah (disarankan).** `POST /api/studio/assets` dengan multipart `file`, atau JSON
   `{ mime, dataBase64 }`. Opsional `?mission=<folder>`. Respons `201 { asset, created: true }`,
   atau `200 { asset, created: false }` bila sha256 sudah ada (idempoten). Lalu rujuk
   `"assetRef": "sha256:<asset.sha256>"` di peta `assets` kiriman, atau langsung di `block.asset`.

   ```bash
   curl -sS -X POST "$HQ_URL/api/studio/assets?mission=2026-10-23_misi_a" \
     -H "x-internal-secret: $INTERNAL_API_SECRET" \
     -F "file=@foto-pmt2.png"
   ```

   Badan JSON (gambar kecil):

   <!-- studio:validate asset-upload -->
   ```json
   { "mime": "image/png", "dataBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" }
   ```

   Respons: `{ "asset": { "sha256", "mime", "widthPx", "heightPx", "bytes", "createdAt" }, "created" }`
   (tanpa path berkas). `GET /api/studio/assets?sha256=<heks>` membaca satu aset (tak dikenal:
   `404 FILE_NOT_FOUND`).

2. **Base64 di kiriman.** Isi peta `assets` dengan bentuk berikut (sha dihitung server). Badan
   total tetap maks 5 MiB, jadi hanya untuk gambar kecil:

   <!-- studio:validate fragment AssetInputV2 -->
   ```json
   { "mime": "image/png", "dataBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" }
   ```

| Batas | Nilai | Galat |
|---|---|---|
| Badan JSON | 5 MiB | `413 PAYLOAD_TOO_LARGE` |
| Satu aset | 20 MiB; sisi maks 20.000 px; maks 80 MP | `413 ASSET_TOO_LARGE` |
| Jenis | PNG atau JPEG menurut isi berkas (SVG ditolak) | `415 ASSET_TYPE_UNSUPPORTED` |
| Kunci peta `assets` | `^[a-z0-9][a-z0-9-]{0,63}$` | `400 SCHEMA_INVALID` |
| Rujukan tak dikenal | | `422 ASSET_NOT_FOUND` |
| Unggah per pemanggil | 60 per menit | `429 RATE_LIMITED` + `Retry-After` |
| Byte aset BARU per 24 jam bergulir (unggah dan `assets` base64; aset yang sha-nya sudah ada tidak dihitung) | sesi pengguna: 512 MiB per pengguna; semua pemegang rahasia internal berbagi satu kuota 2 GiB | `429 RATE_LIMITED` + `Retry-After` (`reason: "asset_quota_exceeded"`) |
| Ruang disk server sesudah tulis | minimal 2 GiB | `500 STORAGE_WRITE_FAILED` (`reason: "insufficient_disk_space"`): aset TIDAK tersimpan; jangan mengulang, laporkan ke operator |

Lebar dan resolusi cetak gambar diputuskan templat. Agen tidak mengirim `widthMm`, `widthClass`,
atau `dpi`.

---

## 11. Alamat dan pid

**Pid** adalah id stabil satu blok, section, atau bab. Pid tidak berubah saat paragraf lain
disisipkan atau dihapus. Bentuk: `^[a-z0-9][a-z0-9-]{2,63}$`. Pid bangkitan = `p-` + 10 karakter
(mis. `p-d1g5j8n3mq`); pid bab = `bab-<kunci>`, pid lampiran = `lamp-<kunci huruf kecil>`. Agen
boleh memberi `id` sendiri (mis. `s1-tujuan-1`); pid yang sudah dipakai lingkup lain atau sudah
pensiun ditolak `422 PID_CONFLICT`. Pid pensiun pada PATCH: `404 PID_NOT_FOUND` dengan
`details.retiredRevisionNo`.

**Alamat** dihitung ulang setiap revisi. Pakai alamat dari respons terakhir, jangan menebak.

| Bentuk | Contoh | Arti |
|---|---|---|
| `C` | `3`, `A` | bab 3 / lampiran A |
| `C.S` | `3.2` | section 3.2 |
| `C.S.P` | `3.2.3` | blok ke-3 di section 3.2 |
| `C.0.P` | `3.0.1` | blok intro bab 3 |
| `C.S.P/n` | `3.2.4/2` | butir ke-2 sebuah blok (butir list, baris turunan) |
| `Tabel C.n`, `Gambar C.n`, `Turunan D-C.n` | `Tabel 3.1`, `Gambar 3.1` | artefak ber-caption ke-n di bab C |
| `Tabel C.n/r.c` | `Tabel 3.1/2.2` | sel baris 2 kolom 2 (1-based, termasuk kepala) |
| `F:<slotKey>` | `F:controlSheet`, `F:signature` | slot tak-berulang |
| `F:<slotKey>/n` | `F:references/1` | entri ke-n slot referensi |
| `P:n` | `P:1` | pembatas bagian ke-1 |

Di URL, alamat dan pid dienkode `encodeURIComponent` (`Tabel 3.1/2.2` menjadi `Tabel%203.1%2F2.2`).

---

## 12. Kode galat dan tindakan agen

Bentuk galat: `{ "error": "<pesan Indonesia yang menyebut perbaikan>", "code": "<KODE>", "details": ... }`.
Galat validasi: `details[] = { pointer, keyword, message, checkId? }`. Galat 500 tidak memuat stack
trace; laporkan `x-correlation-id`.

| HTTP | Kode | Penyebab | Tindakan agen |
|---|---|---|---|
| 400 | `JSON_MALFORMED` | badan bukan JSON sah | perbaiki serialisasi; jangan ulang tanpa perubahan |
| 400 | `SCHEMA_INVALID` | gagal skema; `checkId` `DISPLAY_FIELD` (medan tampilan), `V1_FIELD` (medan v1), `RENDER_FIELD` (`render` di badan kiriman/sunting), `PID_OP_KIND`, atau `maxDepth` | perbaiki medan di `details[].pointer`; untuk `DISPLAY_FIELD` hapus medannya; untuk `RENDER_FIELD` hapus `render` dan pakai `POST .../render` |
| 400 | `DOC_TARGET_AMBIGUOUS` | `target` tidak tepat satu cara (`/documents` v2 ke dokumen yang ada: hanya `documentId`) | pakai satu: `documentId`, `docNumber`, atau `mission` (+ `docKey`) |
| 400 | `META_REQUIRED_FOR_CREATE` | dokumen belum ada dan `template`/`meta.title` absen | tambahkan keduanya pada kiriman pertama |
| 400 | `CHANGE_FIELDS_REQUIRED` | `change.what/why/impact` kosong pada PATCH | isi ketiganya dengan kalimat nyata |
| 400 | `CHANGE_NOTE_REQUIRED` | versi templat tanpa `changeNote` | isi `changeNote` (pengguna templat) |
| 400 | `ADDRESS_INVALID` | alamat tidak sesuai tata bahasa | ambil alamat dari respons terakhir, enkode URL |
| 400 | `PARAM_CLASS_T_READONLY` | menulis kunci turunan (kelas T) | buang kunci itu; agen tidak mengirim parameter |
| 400 | `REGISTRY_KIND_UNKNOWN` | `kind`/`schemaId` registri salah | pakai nilai dari pesan galat |
| 401 | `UNAUTHORIZED` | header rahasia tidak ada atau salah | periksa konfigurasi env; jangan mencoba nilai lain |
| 403 | `FORBIDDEN` | templat TERBATAS (`details.reason = "TEMPLATE_RESTRICTED"`, mis. `datum-manual-000`) pada kirim, validate, PATCH, atau artefak; `renumberChapters` non-ADMIN; refresh render-env | pakai templat lain atau teruskan ke controller; jangan ulang |
| 403 | `PARAM_CLASS_K_FORBIDDEN` | menulis kunci kelas K | buang kunci itu |
| 403 | `PARAM_SURFACE_FORBIDDEN` | menulis kunci lanjutan atau internal tanpa hak ADMIN | pengguna templat: pakai kenop esensial saja |
| 403 | `PRESET_READONLY` | mengubah preset gaya tanpa hak ADMIN | buat templat dari preset, bukan mengubah preset |
| 403 | `PATH_OUTSIDE_ROOT` | penjaga traversal berkas | laporkan ke operator |
| 404 | `DOCUMENT_NOT_FOUND`, `REVISION_NOT_FOUND`, `TEMPLATE_NOT_FOUND`, `ARTIFACT_NOT_FOUND`, `FILE_NOT_FOUND` | id, revisi, slug, atau sha tidak ada | cek ulang id dari respons sebelumnya; templat: `GET /templates` |
| 404 | `ADDRESS_NOT_FOUND` | alamat atau kunci bab tidak ada di revisi itu | muat ulang pohon revisi terkini |
| 404 | `MISSION_REF_NOT_FOUND` | `agentRequestId`/`hermesTaskId` tidak ada | kirim tanpa medan itu atau dengan id yang benar |
| 404 | `PID_NOT_FOUND` | pid tidak dikenal atau pensiun (`details.retiredRevisionNo`) | baca `GET .../content` untuk pid terkini |
| 409 | `SCOPE_CONFLICT` | lingkup yang sama (bab, slot, pid, struktur) berubah sejak `baseRevisionNo` | gabungkan dengan `details.currentContent`, kirim ulang dengan `changedInRevisionNo` |
| 409 | `DOCUMENT_INCOMPLETE` | render penuh pada revisi INCOMPLETE | teruskan `details.forwardToController`; render `chapter`/`slot` tetap boleh |
| 409 | `META_CONFLICT` | medan `meta` yang sudah terisi di dokumen dikirim dengan nilai lain (medan kosong diisi tanpa galat) | buang medan itu dari kiriman; ubah lewat `setMeta` |
| 409 | `TEMPLATE_MISMATCH` | dokumen ada dengan templat atau versi lain | buang `template` dari kiriman atau pakai slug dokumen |
| 409 | `DOC_NUMBER_EXISTS` | `docNumber` sudah dipakai | kosongkan `docNumber` atau cari dokumennya lewat `GET /documents` |
| 409 | `REVISION_CONFLICT` | PATCH alamat jalur v1 dengan `baseRevisionNo` usang | baca ulang, terapkan ulang, kirim dengan `details.currentRevisionNo` |
| 409 | `RENDER_IN_PROGRESS` | render revisi itu masih berjalan | tunggu lalu ulang dengan jeda (bawah) |
| 409 | `TEMPLATE_SLUG_EXISTS`, `VERSION_CONFLICT` | slug templat ada / versi dasar usang | pengguna templat: pilih slug lain / baca versi terbaru lalu ulang |
| 410 | `FILE_MISSING_ON_DISK` | baris ada, berkas hilang | render ulang revisi (`POST .../revisions`) |
| 413 | `PAYLOAD_TOO_LARGE` | badan JSON > 5 MiB | unggah aset lewat `POST /api/studio/assets`, rujuk `sha256:` |
| 413 | `ASSET_TOO_LARGE` | aset > 20 MiB, sisi > 20.000 px, atau > 80 MP | perkecil gambar |
| 415 | `ASSET_TYPE_UNSUPPORTED` | isi bukan PNG/JPEG | konversi ke PNG/JPEG |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | `Content-Type` badan bukan JSON | kirim `Content-Type: application/json` |
| 422 | `SLOT_UNKNOWN` | slotKey di luar kerangka (`details.known`) | pakai salah satu `details.known` |
| 422 | `SLOT_REQUIRED_MISSING` | `structure`/`omitSlot` membuang slot wajib | sertakan slot wajib; isi kosong bukan galat |
| 422 | `SLOT_DUPLICATE` | kunci slot ganda di `structure` | hapus duplikat |
| 422 | `SLOT_POSITION_LOCKED` | slot terkunci (sampul, lampiran) dipindah | kembalikan urutan slot terkunci |
| 422 | `SLOT_TYPE_MISMATCH` | `type` payload bukan jenis slot | samakan `type` dengan `details.expected` |
| 422 | `SLOT_FORBIDDEN_FOR_TIER` | slot tidak aktif untuk tier dokumen | jangan kirim slot itu untuk tier ini |
| 422 | `SLOT_INPUT_NOT_ACCEPTED` | isi ke slot otomatis (mis. `toc`) | jangan kirim slot itu |
| 422 | `SLOT_ITEMS_OUT_OF_RANGE` | jumlah bab melebihi `maxItems` | gabungkan bab atau teruskan ke controller |
| 422 | `SLOT_USE_CHAPTER_ENDPOINT` | slot berulang dikirim ke `/slots` | kirim per bab ke `POST /api/studio/chapters` |
| 422 | `SLOT_PARAM_SCOPE_INVALID` | simpan templat: kunci di luar cakupan slot | pengguna templat: pindahkan kunci ke tingkat dokumen |
| 422 | `BLOCK_TYPE_NOT_ADMITTED` | jenis blok tidak diterima slot itu | ganti jenis blok atau pindah ke slot lain |
| 422 | `CHAPTER_KEY_INVALID` | kunci bab salah pola (angka untuk `content`, huruf untuk `appendices`) atau bentrok | perbaiki `chapter.key` |
| 422 | `PID_CONFLICT` | `id` klien milik lingkup lain atau pensiun (diperiksa juga pada kiriman ulang identik) | buang `id` itu (biar Studio membangkitkan) |
| 422 | `ASSET_NOT_FOUND` | kunci aset atau `assetRef` tak dikenal | unggah aset dulu, atau perbaiki kunci di `assets` |
| 422 | `INLINE_FORMAT_REJECTED` | kiriman v1 bertampilan pada templat `reject` | kirim v2 tanpa medan tampilan |
| 422 | `BY_CONSTRUCTION_FAILED` | cek by-construction gagal pada kiriman dokumen, bab, slot, atau sunting (`details[].checkId`, mis. `DATUM-04` judul berakhiran `?`, `G1`, `D03`); kiriman bab menunjuk `/chapter/...`, kiriman slot menunjuk `/payload`, dengan `mergedPointer` = lokasi di dokumen tergabung | perbaiki isi di `pointer`; makna cek di `GET /registry?kind=lint` |
| 422 | `PARAM_UNKNOWN_KEY` | kunci parameter tidak ada di registri | pengguna templat: cek `GET /registry?kind=essentials` |
| 422 | `CHART_KIND_NOT_DRAWN` | kode chart tidak digambar (`details.alternatives`) | pakai salah satu alternatif |
| 422 | `CHART_KIND_UNKNOWN` | kode chart tidak ada | pilih dari `GET /registry?kind=charts` |
| 422 | `DATUM-31` | diagram berupa Mermaid | tulis ulang sebagai `spec` simpul dan penghubung |
| 422 | `DATUM-39` | resolusi gambar terlalu kecil untuk templat | kirim gambar lebih besar |
| 429 | `RATE_LIMITED` | batas laju per identitas terlampaui: kiriman, PATCH, render, render ulang, artefak, dan validate `?preview=html` berbagi bawaan 30 per 60 detik (kiriman dihitung walau tidak merender); unggah aset 60 per menit; atau kuota byte aset 24 jam habis | tunggu `Retry-After` detik, lalu ulang sekali; untuk banyak bab, beri jeda antar kiriman |
| 500 | `PDF_CONVERT_FAILED`, `HTML_RENDER_FAILED`, `RENDER_FAILED`, `STORAGE_ROOT_FORBIDDEN`, `STORAGE_WRITE_FAILED` pada render | galat render atau penyimpanan berkas keluaran | isi sudah tersimpan: render ulang; bila berulang laporkan `x-correlation-id` |
| 500 | `STORAGE_WRITE_FAILED` pada unggah aset atau kiriman ber-`assets` (`details.reason = "insufficient_disk_space"`) | ruang disk server kurang | aset dan kiriman TIDAK tersimpan; jangan mengulang, laporkan ke operator dengan `x-correlation-id` |
| 503 | `RENDER_QUEUE_FULL` | antrean render penuh | tunggu `Retry-After` lalu ulang render; kiriman isi tidak terpengaruh |
| 503 | `PDF_ENGINE_UNAVAILABLE`, `BROWSER_UNAVAILABLE` | mesin PDF/Chromium tidak siap | jangan kirim ulang isi; render ulang setelah `GET /render-env` siap |
| 504 | `RENDER_TIMEOUT` | render melewati batas waktu | render ulang lingkup lebih kecil (bab) atau ulang dengan jeda |

Lint rilis (`SLOT_CONTENT_MISSING`, `CONTENT_CHAPTER_GAP`, `SCHEMA_V1_ADAPTED`,
`INLINE_FORMAT_STRIPPED`) tidak menahan berkas; hasilnya ada di status rilis revisi.

**Ulang dengan jeda** (429, 503, 500, 409 `RENDER_IN_PROGRESS`): tunggu 3, 6, lalu 12 detik, atau
nilai header `Retry-After` bila lebih besar. Maksimal 3 kali, lalu berhenti dan laporkan. Galat
4xx lain tidak diulang tanpa mengubah permintaan.

---

## 13. Batas

| Batas | Nilai | Galat |
|---|---|---|
| Badan JSON | 5 MiB (5.242.880 byte) | 413 `PAYLOAD_TOO_LARGE` |
| Kedalaman JSON | 64 tingkat | 400 `SCHEMA_INVALID` |
| Kiriman, PATCH, render, render ulang, artefak, validate `?preview=html` per identitas | bawaan 30 per 60 detik (satu kuota bersama) | 429 `RATE_LIMITED` |
| Kolom per tabel | 1..20; tabel bersarang 1 tingkat | 400 |
| Panel per chart komposit | 1..24 | 400 `SCHEMA_INVALID` (`maxItems`) |
| Butir `highlight` per chart atau panel | 1..64 | 400 `SCHEMA_INVALID` |
| `agentId` | 80 karakter | 400 |
| `change.what/why/impact` | 2.000 karakter per medan untuk kiriman v2, PATCH pid, dan PATCH struktur (route struktur memeriksa 4.000, lalu layanan menolak di atas 2.000); 4.000 untuk PATCH alamat (`.../blocks/[address]`) | 400 `SCHEMA_INVALID` (`maxLength`) |
| `take` daftar | maks 200 (bawaan 50) | 400 |

---

## 14. JSON v1: masa berlaku

JSON `studio.doc/v1` (`POST /api/studio/documents` tanpa `$schema` tingkat atas, badan
`{ agentId?, document }`) TETAP diterima lewat adaptor sampai rilis v2.2 (KC-1). Kirimkan
v2 untuk semua pekerjaan baru. Kiriman v1 juga tidak membangun berkas: `render` dan `outputs`
v1 dibuang adaptor (dihitung di laporan adaptasi `stripped.render`/`stripped.outputs`), respons
memuat `job: null` dan `outputs: []`; build lewat seksi 8.

- Adaptor memetakan `front.*` ke slot, `parts`/`chapters` ke `content`, `appendices` ke
  `appendices`, `blockId` ke `id`, `b`/`i` ke `strong`/`em`.
- Medan tampilan v1 diperlakukan menurut parameter templat `ingest.inlineFormat`: `strip`
  (bawaan, dibuang + REPORT `INLINE_FORMAT_STRIPPED`), `reject` (`422 INLINE_FORMAT_REJECTED`),
  atau `allow` (hanya pemanggil tepercaya). `spacer`, `device`, dan run glif simbol selalu dibuang.
- Setiap revisi hasil adaptor membawa REPORT `SCHEMA_V1_ADAPTED` di lint, dan respons v1
  ditambah `completeness` (termasuk `fullRenderAllowed`).
- Kiriman `studio.chapter/v2` atau `studio.slot/v2` ke `/documents` ditolak `400 SCHEMA_INVALID`
  (pointer `/$schema`); kirim ke `/chapters` atau `/slots`.

Spec artefak mandiri v1 (`studio.chart/v1`, `studio.diagram/v1`, `studio.image/v1`,
`studio.html/v1`, `POST /api/studio/artifacts`) tetap untuk figur di luar dokumen. Di dalam
dokumen, chart, diagram, dan gambar adalah blok v2 biasa (seksi 4).

---

## 15. Untuk pengguna templat: preset dan kenop esensial

Bagian ini untuk manusia pemilik templat, bukan agen. Agen tidak pernah mengirim parameter.

1. **Pilih satu preset gaya** saat membuat templat: "DATUM Kanonik", "GSP DATUM", atau
   "DATUM Manual 000" (terbatas). Preset berisi nilai lengkap semua kunci rinci; daftar aktif:
   `GET /api/studio/registry?kind=presets`.
2. **Atur kenop esensial** bila perlu. Hanya kenop di tabel ini yang tampil di editor templat dan
   boleh diubah pemilik templat. Kunci rinci lain bersifat lanjutan (ADMIN), turunan (dihitung dari
   kenop), atau internal. Daftar mesin: `GET /api/studio/registry?kind=essentials`.
3. **Atur kerangka** (urutan slot, wajib, berulang) di halaman Kerangka templat (route R19:
   `GET /api/studio/templates/[id]/skeleton` membaca kerangka dan kenop esensial per slot;
   `POST` menyimpan kerangka sebagai versi templat baru, parameter tingkat templat dibawa utuh;
   galat 403 bila kunci di luar izin pemanggil, 422 `SLOT_PARAM_SCOPE_INVALID` bila parameter
   salah lingkup, 409 `VERSION_CONFLICT`). Dokumen lama tetap memakai versi patokannya.

| ID | Lingkup | Kenop |
|---|---|---|
| EK-G01 | Dokumen | Ukuran kertas |
| EK-G02 | Dokumen | Orientasi |
| EK-G03 | Dokumen | Kerapatan margin |
| EK-G04 | Dokumen | Warna aksen |
| EK-G05 | Dokumen | Ukuran huruf dasar |
| EK-G06 | Dokumen | Bahasa |
| EK-G07 | Dokumen | Klasifikasi bawaan |
| EK-G08 | Dokumen | Rel bukti |
| EK-cover-01 | Sampul | Tampilkan logo |
| EK-cover-02 | Sampul | Tampilkan paragraf pengantar |
| EK-cover-03 | Sampul | Tampilkan baris cakupan |
| EK-cover-04 | Sampul | Tampilkan blok kendali |
| EK-cover-05 | Sampul | Tampilkan pita segel |
| EK-cover-06 | Sampul | Tampilkan string punggung |
| EK-cover-07 | Sampul | Teks jenis dokumen |
| EK-controlSheet-01 | Lembar Kendali | Tampilkan pita segel |
| EK-signatureBlock-01 | Tanda Tangan | Letak tanda tangan |
| EK-toc-01 | Daftar Isi | Nomor halaman daftar isi |
| EK-toc-02 | Daftar Isi | Tampilkan pita segel |
| EK-chapter-01 | Isi | Label nomor bab |
| EK-chapter-02 | Isi | Garis Datum di atas judul bab |
| EK-chapter-03 | Isi | Lebar tabel |
| EK-chapter-04 | Isi | Lebar chart |
| EK-chapter-05 | Isi | Lebar diagram |
| EK-chapter-06 | Isi | Bab mulai di halaman baru |
| EK-chapter-07 | Isi | Kepala berjalan |
| EK-sourceRegister-01 | Referensi | Kolom daftar sumber |
| EK-appendix-01 | Lampiran | Label nomor lampiran |
| EK-appendix-02 | Lampiran | Orientasi halaman lampiran |
| EK-appendix-03 | Lampiran | Garis Datum di atas judul lampiran |

Kunci lanjutan (ADMIN) yang menyangkut figur dan daftar isi, semuanya parameter templat dan tidak
pernah dikirim agen:

| Kunci | Nilai | Pengaruh |
|---|---|---|
| `render.toc.title` | teks, atau null (bawaan) | judul di atas daftar isi; null = tanpa judul (kicker "Daftar Isi" tetap dari mesin) |
| `render.toc.note` | teks, atau null (bawaan) | catatan di bawah tabel daftar isi; null = tanpa catatan |
| `image.widthClass` | `text` (bawaan) atau `full` | lebar SEMUA gambar dalam dokumen: kolom teks atau bentang penuh |
| `symbolSheet.widthClass` | `text` (bawaan) atau `full` | lebar SEMUA lembar simbol dalam dokumen |
| `image.rasterDpi` | bilangan bulat 150..600 (bawaan 150 = lantai mutu raster DATUM-39) | gambar raster tidak diperbesar melewati ukuran aslinya pada resolusi ini (lebar asli = piksel / dpi); kelas lebar gambar menjadi batas atas |
| `chart.kind.<KODE>.axis` (mis. P-04, P-05, P-06, P-11, P-13, P-14, S-01..S-04; daftar lengkap `GET /api/studio/registry?kind=params`) | `[min, maks]`, atau null (bawaan, domain dari data) | domain sumbu nilai yang dicetak untuk jenis chart itu |

Lebar dalam mm (`image.widthMm`, `symbolSheet.widthMm`, juga chart dan diagram) diturunkan dari
kelas dan ukuran kertas, hanya-baca (`400 PARAM_CLASS_T_READONLY`). Kelas lebar berlaku per jenis figur, tidak per figur;
chart dan diagram memakai kenop esensial EK-chapter-04 dan EK-chapter-05. Judul dan catatan daftar
isi yang dikirim lewat isi ditolak (`checkId: "DISPLAY_FIELD"`; slot `toc` sendiri menolak isi
dengan `422 SLOT_INPUT_NOT_ACCEPTED`).

Pratinjau templat yang belum disimpan: `POST /api/studio/validate?preview=html` dengan badan
`studio.doc/v2` ditambah medan tingkat atas `draftTemplate: { template: <studio.template/v2>,
base?: { slug, version? } }`. Tidak ada yang disimpan; isu draf menunjuk `/draftTemplate/template/...`;
`draftTemplate` pada skema lain = `valid: false` di `/draftTemplate`; draf atau dasar terbatas
ditolak `403` untuk pemanggil yang tidak berhak. Draf yang mengubah kunci di luar hak simpan
pemanggil (kelas K, lanjutan, preset) menghasilkan `valid: false` dengan isu yang `keyword`-nya =
kode galat simpan (mis. `PARAM_CLASS_K_FORBIDDEN`, `PARAM_SURFACE_FORBIDDEN`) dan `pointer` ke
kunci draf itu, sama dengan penolakan saat menyimpan versi templat.

Galat yang mungkin muncul bagi pengguna templat: `403 PARAM_SURFACE_FORBIDDEN` (kunci lanjutan atau
internal), `400 PARAM_CLASS_T_READONLY` (kunci turunan), `403 PRESET_READONLY` (mengubah preset),
`409 VERSION_CONFLICT` (versi dasar usang).

---

## 16. Peta route

Rincian permintaan, respons, dan galat: `docs/API-REFERENCE.md` seksi 12.

| ID | Metode | Path | Dipakai untuk |
|---|---|---|---|
| R01 | GET, POST | `/api/studio/templates` | memilih slug (agen); membuat templat dari preset (pengguna templat) |
| R02 | GET, POST, PATCH | `/api/studio/templates/[id]` | membaca templat; versi baru (pengguna templat) |
| R03 | GET | `/api/studio/registry` | skema v2, preset, kenop esensial, slot, lint |
| R04 | GET, POST | `/api/studio/documents` | daftar dokumen misi; E0, dokumen v2, atau v1 lewat adaptor |
| R05 | GET | `/api/studio/documents/[id]` | pohon slot/bab/section/blok + kelengkapan |
| R06 | GET, PATCH | `/api/studio/documents/[id]/blocks/[address]` | baca dan sunting per alamat |
| R07 | GET, POST | `/api/studio/documents/[id]/revisions` | riwayat; render ulang revisi lama |
| R08 | POST | `/api/studio/validate` | dry-run doc/chapter/slot v2 (gabung + gerbang, tanpa tulis/build) + `completenessPreview`, `submitPreview`; `draftTemplate` untuk pratinjau templat |
| R09 | GET, POST | `/api/studio/artifacts` | figur mandiri di luar dokumen |
| R10 | GET | `/api/studio/files/[id]` | mengunduh berkas |
| R11 | GET | `/api/studio/render-env` | kesiapan mesin PDF/Chromium |
| R12 | POST | `/api/studio/chapters` | kirim satu bab atau lampiran |
| R13 | POST | `/api/studio/slots` | kirim satu slot tak-berulang |
| R14 | GET, PATCH | `/api/studio/documents/[id]/structure` | baca struktur; op struktur |
| R15 | GET | `/api/studio/documents/[id]/completeness` | kelengkapan |
| R16 | GET, PATCH | `/api/studio/documents/[id]/paragraphs/[pid]` | baca dan sunting per pid |
| R17 | POST | `/api/studio/documents/[id]/render` | render bab, slot, atau dokumen (satu-satunya pemicu build) |
| R18 | GET, POST | `/api/studio/assets` | unggah dan baca aset |
| R19 | GET, POST | `/api/studio/templates/[id]/skeleton` | baca kerangka + kenop esensial slot; simpan kerangka = versi templat baru (pengguna templat) |
| R20 | GET | `/api/studio/documents/[id]/content` | isi bentuk v2 + pid |
