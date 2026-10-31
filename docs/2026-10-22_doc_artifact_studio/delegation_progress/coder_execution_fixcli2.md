# FIX-CLI2 (D-410, F-1 test/19) - status: complete

- `scripts/studio/md2contract.ts`: `collectDropped`/`printDropped` mencetak ke stderr unsur dibuang `mapping.prose[].dropped` per kode (jumlah, baris sumber, cuplikan), ringkasan memuat `dropped=N`; `--strict` keluar 1 bila ada peringatan atau dropped. stdout tidak berubah.
- Uji baru `tests/unit/studio/import/fixcli2-md2contract-dropped.test.ts` (3 uji).
- Bukti: tsc 0; eslint 0; CLI pada LAPORAN-SELESAI.md (--reported-at 2026-10-30T12:00+07:00) exit 0, stderr `dropped=2` + `LIST_NESTING x2 baris 7, 13`, sha stdout 5cad8776e88827594c9d078c44b60e2d479ddc18e7f759a3f5fb40dafb571d80 (= golden dc35); vitest import+contract hijau.
