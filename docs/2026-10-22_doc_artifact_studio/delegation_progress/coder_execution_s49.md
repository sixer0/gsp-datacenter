# S49 layanan templat (services/templates), coder-execution, 2026-10-23

Status: complete

Berkas (area eksklusif `src/lib/studio/services/templates/`): `index.ts` (I39 persis: listTemplates, getTemplate, createTemplate, createTemplateVersion, resolveTemplate + ekstra resolveTemplateVersion, ensureCanonicalTemplate, importTemplateProfile), `profile.ts` (murni: validasi kunci, rencana section kanonik, komposisi versi, parser berkas profil, resolusi di memori), `import.ts` (baca berkas profil, loadResolvedProfileFile untuk CLI S67/S97 tanpa DB), `assets.ts` (penjaga path aset, pindaian aset kanonik opsional), `log.ts` (JSONL harian `<STUDIO_WORKSPACE_ROOT>/logs/templates/`).

Penjaga:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/services/templates"` -> kosong (grep exit 1)
- `npx eslint src/lib/studio/services/templates` -> exit 0, tanpa keluaran
- Cek runtime `npx tsx <scratchpad>/s49_check.ts` di DB v21 (baris uji `s49-uji-*` dihapus sesudahnya; DB kembali: 1 templat `datum-kanonik`, 1 versi): 49 lulus, 3 gagal yang SEMUANYA karena registri berubah di tengah sesi (lihat Temuan 1). Run sebelum delta: paramsSha256 + sectionPlan kanonik identik dengan seed S70. Terbukti: K oleh USER 403 (create, versi, hapus K, impor Manual 000), ADMIN lolos; T 400; kunci asing 422 (parameter, peran, medan RoleFormat, section, tier); catatan kosong 400; slug ganda 409; baseVersionNo basi 409; 3 simpan serentak -> tepat 1 OK + 2 VERSION_CONFLICT; v1 tetap setelah v2..v6; resolveTemplate beku; impor `template.json` (S95) -> v1 berbase kanonik, changeNote dari berkas, meta+gaps tersimpan, paramsSha256 = resolusi di memori, impor ulang `unchanged`; turunan dari turunan mewarisi override + roleFormats Manual 000; railColsTw turunan [7257,340,1814].

Keputusan (dicatat controller):
1. Lapisan: default registri <- overrides rantai baseVersionId (akar -> induk) <- overrides versi; T dihitung ulang (S11 resolveParams), hanya di resolvedParams. paramsSha256 = sha256 JSON stabil (skema sama dengan seed S70).
2. createTemplate tanpa baseVersionId -> berbase versi terbaru `datum-kanonik` (bila di-seed). createTemplateVersion: `overrides` = lapisan milik LENGKAP; roleFormats/sectionPlan diisi = ditimpakan per peran/per tier di atas dasar, kosong = dibawa dari versi sebelumnya; base tetap sama dengan versi sebelumnya.
3. Hak K hanya untuk kunci yang BERUBAH (tambah/ubah/hapus) agar USER tetap bisa mengubah B pada templat yang memuat K dari admin. Versi baru profil kanonik dan roleFormats/sectionPlan-nya: hanya ADMIN_SESSION (403 PARAM_CLASS_K_FORBIDDEN). roleFormats di templat non-kanonik tidak dibatasi kelas (KT-16 hanya parameter).
4. Penomoran versi: transaksi Prisma, `updateMany where latestVersionNo = baseVersionNo` (kunci optimistik) + unik (templateId, versionNo) sebagai penjaga akhir (P2002 -> 409).
5. D-50 diterapkan: medan atas tak dikenal diabaikan + dilaporkan; meta.slug/name/kind sebagai identitas cadangan; `meta` disimpan di JSON `provenance.meta` (M02 tanpa kolom meta); T di profil dibuang + dilaporkan (template.json: 0); sectionPlan kosong = dasar registri.
6. Rencana section kanonik dan provenans default disamakan dengan seed S70 (`CANONICAL_REQUIRED_BY_TIER`). getTemplate menerima id ATAU slug. Ekspor konstanta `DATUM_CANONICAL_SLUG`, `MANUAL000_SLUG`.

Temuan:
1. Delta S03-d1 (params/render.ts 25 -> 34, 00:47) membuat versi 1 `datum-kanonik` hasil seed S70 BASI (paramsSha DB 3d6e5f.. vs registri kini 9a1578..; resolvedParams kini 708 kunci). Perlu re-seed S70 `--refresh-v1` (bila v1 belum dipin) atau `ensureCanonicalTemplate({ createdBy, syncRegistry: true })` -> v2. Bukan blocking untuk S49.
2. resolvedParams memuat kunci turunan berkunci S11 di luar registri (mis. margin bawah D-33), sehingga jumlah kunci > jumlah ParamDef; benar menurut S11.

Permintaan lintas pemilik: tidak ada. Review direkomendasikan (S85/S87: hak K, impor profil).
