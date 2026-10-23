# IP-41b - parser busur lint render H-08 (DATUM-32)

Status: complete. Agen: coder-execution. Skills: backend-execution, dry-run-verify-fix. Masukan: D-122, D-136, `test/05_parity_chart.md` L1/R7.

## Berkas
- `src/lib/studio/engine/lint/render/svg.ts` (modify): `pathPoints(d, { arcs })` baru; `arcArgs` (bendera busur ringkas `0186`), `arcSamples` (titik ujung ke pusat SVG 1.1 F.6.5, koreksi radius lambda, langkah 5 derajat, maks 720 titik/busur). Hanya `linkPoints` (konektor DATUM-32) memakai `{ arcs: true }`; `nodeShape` path tetap titik ujung (perilaku lama), cek lain tidak tersentuh. Komentar `SvgLink.points` diperbarui.

## Keputusan
- Cuplikan busur dibatasi pada konektor; bentuk simpul path ber-busur tetap poligon titik ujung (di luar lingkup baris, tidak mengubah hasil cek lain).
- Kurva Bezier `C/S/Q/T` tetap titik ujung (R7 menyebut "busur dan kurva"; baris IP-41b hanya busur) -> kandidat backlog bila ada konektor Bezier.

## Bukti (2026-10-23)
- `npx tsc --noEmit -p tsconfig.json`: 0 galat di `lint/render`; 5 galat di luar area, semua `src/lib/studio/engine/docx/figures/figure.ts` (milik baris lain, tidak disentuh).
- `npx eslint src/lib/studio/engine/lint/render` -> exit 0.
- Render segar `npx tsx scripts/parity/run/render_cli.ts --doc tests/parity/out/s79/lint_fixtures/chart/h08_{datum,gallery}.json --formats svg`: exit 0; DATUM-32 "PASS 1 gambar, 7 konektor; tidak ada yang melewati simpul tak terkait (inset 0.4 mm)"; banner "FAIL 0 ... rilis: PASS" (S79: FAIL 12).
- SVG S79 tersimpan (`tests/parity/out/s79/lint/chart_h08_*/node/*.svg`) via `lintRendered`: PASS keduanya (sebelumnya DATUM-32 x12).
- SVG uji sintetis: busur nyata menembus simpul -> "FAIL: konektor #0 melewati simpul tak terkait 'TOP' sepanjang 10.0 mm" (simpul di bawah tali busur 'B' tidak lagi dilaporkan); busur rendah -> PASS; garis lurus menembus B -> "FAIL ... 'B' sepanjang 9.2 mm". Bendera ringkas `a43 15 0 0186 0` berakhir tepat di (93,40), 37 titik; mode simpul `pathPoints("M7 40A43 15 0 0 1 93 40")` = 2 titik ujung (tidak berubah).

## Permintaan lintas pemilik / temuan
- Tidak ada permintaan. Temuan: galat tsc `docx/figures/figure.ts` (5) untuk dicatat controller.
