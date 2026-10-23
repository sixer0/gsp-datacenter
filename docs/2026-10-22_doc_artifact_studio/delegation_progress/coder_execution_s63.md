# Catatan baris S63 (coder-execution)

**Status:** complete. Review direkomendasikan (S86).

**Berkas** (semua baru, area `tests/parity/fixtures/`, 77 berkas): `manifest.json`; `doc/` 4 (`doc_nota_memo`, `doc_nota_tables`, `doc_terbit_report`, `doc_serah_handover`); `chart/` 46 (`p01.json`..`g04.json`); `diagram/` 10 spec kontrak + `diagram/garis_a/good_layered.json`, `good_sld.json` (salinan byte-identik HS); `symbol/` `symbols.json` (41 id) + `sheet_{iec,isa,sec,mil}.json`; `src/` 9 TS (`kit`, `docs`, `charts`, `literal_s65`, `diagrams`, `symbols`, `paths`, `build_fixtures`, `validate_fixtures`). JSON dibangun dari objek bertipe kontrak (KS-01) oleh `build_fixtures.ts`; build ulang byte-identik (68/68 sha256 sama).

**Penjaga data** (`npx tsx tests/parity/fixtures/src/validate_fixtures.ts`, exit 0, "HASIL: LOLOS (0 kegagalan)"):
- ajv dari `STUDIO_SCHEMA_LOAD_ORDER` + `STUDIO_AJV_OPTIONS`: doc 4/4, diagram 10/10, chart 46/46 VALID. Uji negatif (p01 dirusak): 2 kegagalan terdeteksi, exit 1.
- Cek ingest tanpa DB (limitIssues, normalizeDocument, G1/DATUM-10, bindRegister + turunan, resolveDocAssets, typeCode P3-20): 0 isu di 4 dokumen.
- Cakupan: section dokumen 29/29; tier 3/3; keluarga tabel 11/11, preset registerTable 8/8, financialTable 3/3; aside 5/5; perangkat 6/6; moda rel A/B (`overrides["layout.railMode"]`); cover/controlSheet auto+explicit; toc field+static; diagram 9/9 keluarga (bentuk 10/10, konektor 6/6); chart beracuan 46/46 (CA 4, CB1 34, CB2 8), batas `CHART_DATA_CONSTRAINTS` 30/30; simbol 41/41 (iec 16, isa 12, sec 7, mil 6) = `SYMBOL_IDS` Node, lembar 4/4.
- Klaim = berkas tertulis: manifest 105 entri, 105/105 ada + sha256 cocok, 0 JSON tak terdaftar.
- `tsc` grep `tests/parity/fixtures`: 0 baris. `npx eslint tests/parity/fixtures`: exit 0, 0 masalah.

**Uji acuan Python (bukan gerbang, bukti tambahan; VENV -I -B, cwd pendek di %TEMP%, keluaran dihapus):** `ref_fig.py` atas 101 fixture figur: 100 exit 0 status ok tanpa peringatan (ukuran = kanvas registri acuan), `specMatchesLiteral` P-07/W-03 = True, lembar simbol 1 halaman per dialek. `ref_doc.py` 4 dokumen: exit 0, 0 rejected, 0 error (unsupported = batas S64 yang tercatat: aside, device, parts, front).

**Keputusan:**
- K1 Salinan Garis A apa adanya ditaruh di `diagram/garis_a/` sebagai sumber (tanpa `$schema`, memuat `_provenans`, tidak lolos skema v1 by design); fixture kontraknya `dg_layered_good.json`/`dg_sld_good.json` = isi sama + `$schema`, provenans dipindah ke manifest.
- K2 P-07/W-03 memakai `literalData` ref_report S65 (`src/literal_s65.ts`). D-63: P-01 urut menurun, aksen titik pertama, non-negatif, tanpa `sub`.
- K3 Lebar/tinggi chart pustakachart = `lebar_mm`/`tinggi_mm` registri acuan; K-01/K-02 `heightMm` 50.
- K4 `dg_flow` dipendekkan ke 4 simpul dan `dg_sequence` ke 4 pesan karena acuan menolak DATUM-33 (338 dan 252 mm > 247 mm); varian panjang tetap lewat `dg_flow_wrapped` (per_row 3).
- K5 Templat semua dokumen `datum-kanonik` v1; typeCode KT/STD/BA (daftar default P3-20).

**Temuan:** F1 acuan K-01 gagal untuk data apa pun: `pustakachart.py:421` `np.sum(generator)` ditolak numpy VENV (TypeError) pada `_stack_rows(total100=False)`; paritas CB1 K-01 tidak dapat dijalankan (dicatat di manifest; pemilik: acuan HS / S65 / S79).

**Permintaan lintas pemilik:** tidak ada.
