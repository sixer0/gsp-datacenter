# IP-39b coder-execution: mesin diagram + simbol (S84 #2/#3/#4/#6/#7 + Low)

- Status: needs-review (kode selesai dan konsisten; keputusan controller untuk D-50 baru, kelas paritas DATUM-25, dan opsi tinggi benchmark). Laporan: `implementation/ip39b_diagram_symbols_fix.md`.
- Klaim: 5 baris `IP-39b` di `file_claims.md`. Permintaan lintas pemilik: 2 baris `IP-39b` di `file_requests.md` (fixture `dg_layered_good` ke FIX-3; tinggi benchmark/width spec S94 ke controller).
- Instruksi controller (user) diterima saat penutupan: tahan pengujian. Tidak ada run yang masih berjalan; semua run di bawah sudah selesai sebelum instruksi.

## Perubahan
- Baru: `diagram/core/xml.ts` (karakter tidak sah XML + komentar aman), `diagram/core/colour.ts` (DATUM-25 dari SVG + model emisi), `diagram/core/geometry.ts` (geometri tunggal).
- Ubah: core `svg/spec/tokens/sheet/estimate/pyfmt/index`, `build/svg.ts`, layout-a/b/c `geometry.ts` (jadi pengekspor ulang), layout-a `flow.ts`/`layered.ts`, symbols `primitives.ts`/`index.ts`.

## Bukti (2026-10-23)
- `npx tsc --noEmit -p tsconfig.json`: exit 0, 0 galat (seluruh repo).
- `npx eslint src/lib/studio/engine/diagram src/lib/studio/engine/symbols`: exit 0.
- Paritas DG 10 PASS + `dg_layered_good` DATUM-25 disengaja + 2 `garis_a` F-S78-2; SY 45/45 PASS (`tests/parity/out/ip39b/`).
- Python HS 8 spec D-106: 7/8 byte-identik (1 = DATUM-25 disengaja). Determinisme 166 keluaran x 2 proses: 0 beda.
- vitest figur: 5 gagal milik area ini, semua akibat fixture `dg_layered_good` (uji S73 tidak diubah).

## Tinggi benchmark (FIX-5)
- Bukan bug skala: SVG 1 unit = 1 mm, mesin = Python HS. BM digambar pembangkit lain (ilustrasi berikon; lembar simbol RL `datum_symbols.py --sheet` isi-pas). Tabel dan opsi A-D di laporan.

## Sisa
- Opsi tinggi benchmark (belum dimulai, menunggu keputusan): lembar simbol isi-pas (opsi `fit` aditif) dan/atau koreksi kuirk geometri Garis A.
