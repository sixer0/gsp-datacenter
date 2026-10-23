# INT-J coder-execution: sld multi-bus di balik opsi eksplisit (IP-14, F-022)

- Status: complete (2026-10-23). Area: `src/lib/studio/engine/diagram/layout-c/**`. Klaim di `file_claims.md` (2 baris INT-J).
- Berkas (2): `layout-c/sld.ts` (ubah), `layout-c/index.ts` (ekspor tipe `SldBus`, `SldLayoutOptions` + catatan modul).
- Default (paritas Garis A): tepat satu rel = keluaran Python bit-identik. Lebih dari satu rel kini ditolak `StudioEngineError("BY_CONSTRUCTION_FAILED", "DIAGRAM DEFECT: E-17/MULTI-BUS: spec sld memuat N rel bus (ids); ...")`, `details.checkId = "E-17/MULTI-BUS"`. Tidak ada lagi simpul rel yang dibuang diam-diam.
- Opt-in eksplisit: `layoutSldDetail(s, sheet, { multiBus: true })`, atau spec `sld.multiBus === true` (dibaca defensif lewat `LayoutFn` `layoutSld`; kunci belum ada di kontrak, lihat permintaan). Tata letak: rel ditumpuk vertikal urut `nodes`; tiap rel diikuti satu baris cabang dengan rumus Python per segmen (lebar seragam, y = (atas rel + bh) + snap(2 baseline)); rel berikutnya mulai snap(2 baseline) di bawah tepi bawah segmen sebelumnya. Penugasan cabang: (1) edge pertama yang menghubungkan simpul dengan rel, (2) rel terdekat sebelum simpul dalam `nodes`, (3) rel pertama. `SldDetail.bus` = rel pertama (kompatibel `Sheet.bus`), `SldDetail.buses` = semua rel.
- multiBus pada spec satu rel = jalur default (identik).

## Penjaga dan bukti

- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/diagram/layout-c"`: 0 baris (grep exit 1).
- `npx eslint src/lib/studio/engine/diagram/layout-c`: exit 0, tanpa keluaran.
- Paritas S29 diulang (423 kasus `s29/cases.json`, Python VENV `-I -B` segar vs TS, float.hex): `total 423 identik 422 beda 1`. Satu-satunya beda = `sld_multi` (2 rel): Python membuang `b2`, TS kini menolak `E-17/MULTI-BUS` (disengaja). Kasus sld satu rel identik: good_sld, sld_one, sld_busonly, sld_nobus, bad E-17/DATUM-32/DATUM-37.
- Uji perilaku multi-rel (scratchpad `int_j/multi.ts`): `lulus 17 gagal 0` (multiBus pada spec 1 rel identik dengan default; kode galat + checkId; semua simpul ada; dua rel bertumpuk; cabang via edge dan urutan di bawah rel yang benar; tanpa tumpang-tindih; deterministik; seam `sld.multiBus`; rakitan penuh `buildDiagramSvgWith` validate+place+route+svg dengan LayoutFn opt-in = SVG 5749 byte; rakitan default menolak).

## Permintaan lintas pemilik (file_requests.md, tidak memblokir)

1. Kontrak (`contract/types/diagram.ts` + `schema/diagram.schema.ts`): medan opsional `sld?: { multiBus?: boolean }` agar opt-in dapat lolos skema.
2. S30 `build/place.ts` `pythonInsertionOrder` kasus sld: semua rel beserta cabangnya (kini hanya rel pertama; simpul tetap lengkap lewat fallback, hanya urutan untuk id bilangan bulat).

## Temuan

- Pra-ada, diwarisi Python: sld lebar 166 mm selalu gagal DATUM-37 di build (rel 166 di-snap ke 170,667 mm, kisi x 10,6667). Terbukti di Python (`build_svg` good_sld lebar 166: "DATUM-37: simpul bus keluar lebar lembar (0.000..170.667 dari 166.0 mm)") dan TS. Bukan area INT-J (core `Sheet.snapToLattice`, S26).
