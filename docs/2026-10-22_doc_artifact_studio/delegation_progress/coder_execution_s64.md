# S64 coder-execution: adapter acuan Python dokumen (H02)

Status: complete (penjaga lulus; uji asap tunggal lulus). Review direkomendasikan (S86).

Berkas (semua baru, area `scripts/parity/reference/doc/`):
- `ref_doc.py` (169 baris): CLI H02 persis §11 `--doc <json> --out <dir> [--pdf]`; `--out` opsional, default `tests/parity/out/ref_doc/<stamp>`; exit 0/1/2; menulis `ref.docx`, `ref.pdf`, `ref_report.json` (schema `studio.parity.ref-doc/v1`: files sha256/bytes, counts, blocks per pointer JSON, unsupported[], pdf, errors dengan timestamp/level/source/stackTrace).
- `doc_adapter.py` (831): pemetaan §3.4 ke DatumDocx Garis A; status per blok supported/approximated/unsupported/rejected/error; rollback XML body bila guard skill menolak.
- `soffice_pdf.py` (111): perintah §8.4, profil `-env:UserInstallation` sementara per job, batas waktu `REF_DOC_SOFFICE_TIMEOUT_S` (180 s), `taskkill /PID /T /F`, sukses = exit 0 + `%PDF-`; direktori job dihapus di finally.
- `svg_raster.py` (143): SVG ke PNG 300 dpi via Chromium `set_content` (bukan `file://`, research/03 §11.2).

Pemetaan: paragraph (role -> skala tokens), list (marker+tab via para), monoBlock, assumptionInline (chip rail), 11 jenis tabel -> `table()`, derivation -> `datumbind.Derivation`, chart P-01/P-02/P-11/W-02 -> Rev L `datumchart` (D-10), diagram -> `datum_diagram.build_svg`, image, symbolSheet -> `datumsimbol.sheet_svg`, spacer -> `_spacer`. Unsupported (dicatat, tidak dipancarkan): aside, device, parts, front.controlSheet/toc/signature, cover explicit body, chart kode lain (acuan S65), spec `{artifactId}`.

Keputusan (perlu dicatat controller):
- K1 Setiap bab/lampiran = `start_interior()` sendiri (KS-06); judul bab tanpa nomor, judul seksi `"<C.S> <judul>"`.
- K2 front.cover absen -> `cover()` tetap dipanggil (Garis A selalu punya sampul), status approximated.
- K3 docNumber absen -> `REF-TANPA-NOMOR`; core created/modified = issueDate 00:00 (deterministik).
- K4 `format`/`runDefaults`/runs diterapkan lewat helper OOXML Garis A (oei, style_run) agar setara sisi Node.
- K5 Ekspresi `derivation.result.expr` divalidasi whitelist (kunci register, angka, operator, abs/round/sqrt/min/max, tanpa `__`) sebelum `Derivation.result` yang memakai `eval` skill.
- K6 Label derivasi `Turunan <id> · <title>`, id default `D-<bab>.<n>`; verdict greaterOrEqual tidak didukung Derivation (dicatat).

Bukti: `VENV -I -B -m py_compile` x4 OK; `ref_doc.py --help` exit 0; uji asap (doc 12 blok, --pdf): exit 0, status partial, counts supported 6/approximated 6/unsupported 3/rejected 2/error 0, PDF 2 halaman 60558 byte, soffice 3,9 s, raster chromium 151.0.7922.34; tabel tertolak CEK-10 tidak tersisa di PDF (TABEL count 1).

Temuan: F1 `-m py_compile` menulis `__pycache__` meski `-B` (dihapus). F2 path scratchpad terlalu panjang untuk cwd Win32; uji asap dijalankan di `%TEMP%\s64smoke` (dihapus). F3 caption JSON tabel diabaikan oleh `table()` Garis A (caption otomatis "TABEL n <slug>") -> selisih teks DX yang diharapkan; S66/S76 perlu tahu.
Permintaan lintas pemilik: tidak ada.
