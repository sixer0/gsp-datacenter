# Catatan S04 (coder-execution, G1a)

Status: complete (penjaga lolos; uji ditunda ke fase final, D-07).

Berkas: `src/lib/studio/params/governance-language.ts` (satu-satunya berkas kode; klaim di file_claims.md).

Angka (skrip pemeriksa di scratchpad, impor modul langsung):
- length 115 = COUNT 115; id unik 115; key unik 115; origin catalog 115.
- Per awalan id: P1 4, P3 24, P11 44 (P11-14 semua berawalan P11-xx di katalog), P15 31, P16 8, PA/PB/PC/PD 1 each.
- Kelas: K 86, B 21, T 8 (semua T berderive; 8 fungsi dari daftar kontrak, tidak ada permintaan delta).
- inactive: 31 (seluruh P15, A5/D-05). rek: P11-36, P11-37, P15-01, P16-02. unreadable: P15-31 (default null).

Keputusan/penerapan:
- [REK] diganti dari research/04: T120 (P11-36/37: SARING "tidak ada dimensi 1-3 <= 2"; LEPAS >= 4,4,4 dan dimensi 4 >= 3), T127 (P15-01, pasangan sheet-fungsi), T133/T134/T135 (P16-02/03/06). Nilai lain dari T119, T022, T026, T147, T148, T150.
- D-22 KT-06: P11-41 `prose.emDash` default {maxPer1000Words: 0, inHeadings: 0}; conflictRef K-09. KT-10: K-14/K-15/K-26/K-29/K-30/K-33 memakai usulan katalog (conflictRef dicatat).
- Kunci tetap memakai kunci katalog (`prose.emDash`), bukan `lint.emDash.*` yang disebut blueprint §10; S10/S44 yang membaca K-09 perlu memetakan ke `prose.emDash` atau mengajukan delta.
- Enum himpunan (P1-04, P3-20, P15-28) berdefault larik (himpunan sah/default DATUM), karena katalog tidak punya satu nilai tunggal; ditandai di classNote.
- P11-32 bertipe ratio 0.05 (1 per 20 kata); P11-25 percent 20; P16-02 default 39 id `DATUM-01..39`.

Permintaan lintas pemilik: tidak ada. Temuan: tsc total repo tidak diperiksa di luar area (hanya grep area S04, kosong).
