# DC-25 CLI md2contract (coder-execution)

Status: complete.

- Baru: `scripts/studio/md2contract.ts` (opsi --kind --mission --doc-key --doc-number --doc-title --status --reported-at --entry --strict --out; exit 0/1/2/3; stdout studio.doc/v2, laporan ke stderr).
- Ubah: `services/import/contract/index.ts` butir 2 saja: keunikan kunci butir lewat I54 `checkContractRecord` (helper `itemKeyRepeats`); perilaku lain tidak berubah.
- Uji baru: `tests/unit/studio/import/dc25-md2contract-cli.test.ts` (proses nyata tsx).
- Bukti: vitest import 8 berkas / 131 lulus (dc24 19/19 hijau); eslint 0; tsc: 1 galat di luar milik saya (`tests/unit/studio/structure/dc09-contract-rows.test.ts(55,190)` TS2345), 0 pada berkas saya.
- Asap 3 laporan nyata Hermes (baca saja): tanpa opsi exit 3 (A, C: reportedAt; B: status + reportedAt); `--reported-at 2026-10-30T00:00:00Z` (+ `--status complete` untuk B) exit 0, valid, dua run cmp byte-identik; `--strict` exit 1 (A 4, B 10, C 6 peringatan).
