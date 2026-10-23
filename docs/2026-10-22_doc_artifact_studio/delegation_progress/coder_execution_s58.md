# S58 — UI daftar template dan editor parameter (coder-execution)

Status: complete (penjaga lolos; integrasi terhadap backend hidup ditunda ke S80 karena S49/R02/R03 belum mendarat).

Berkas (13): `src/app/studio/templates/page.tsx`, `src/app/studio/templates/[id]/page.tsx`, `src/app/studio/templates/[id]/versions/page.tsx`; `src/components/studio/template-editor/{index.ts, api.ts, values.ts, shared.tsx, param-rules.ts, param-control.tsx, param-editor.tsx, role-formats-editor.tsx, template-editor.tsx, template-list.tsx, version-history.tsx}`.

Fitur: daftar (nama, slug, jenis, versi terkini, pemilik, turunan dari = versi dasar dipetakan dari detail 40 templat pertama); buat templat turunan (dasar kanonik/profil lain + versi, catatan wajib); impor profil JSON `POST ?import=profile` (UI hanya aktif untuk ADMINISTRATOR via `/api/auth/me`); editor dari `GET /api/studio/registry?kind=params` per bab -> namespace, kontrol per tipe (hex + swatch + color picker, numerik dengan rentang/satuan, enum, multi-pilih list ber-enum, bool, string/char/tokenRef/ratio, list baris, range/pair dua isian, map/object JSON tervalidasi); kelas B dapat disunting, K terkunci dengan alasan kecuali ADMINISTRATOR, T hanya nilai terhitung (`resolvedParams`); kelas bersyarat D-37 lewat `effectiveClass`/`validateParamValue` S11 (`engine/tokens/merge.ts`, hanya-tipe, aman klien); nilai induk vs override + reset per kunci; editor `roleFormats` 70 peran terstruktur; simpan = versi baru (R02 POST, `baseVersionNo`, catatan wajib, galat `details` dipetakan per kunci, 409 VERSION_CONFLICT); riwayat + bandingkan dua versi (override, resolvedParams, peran, sectionPlan); `<TemplatePreviewPane templateId versionNo draftOverrides>` dipasang di kolom samping (stub S03 saat ini).

Penjaga:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/(app/studio/templates|components/studio/template-editor)"` -> kosong (exit 1).
- `npx eslint src/app/studio/templates src/components/studio/template-editor` -> exit 0, tanpa keluaran.
- Smoke SSR (`npx tsx`, skrip scratch dihapus): 707 ParamDef dirender sebagai kontrol + nilai hanya-baca tanpa galat; ParamEditor 13 bab; RoleFormatsEditor; `lockOf` K user=false/admin=true, T=false; `draftErrors` menolak tipe, rentang, kunci asing.

Keputusan/asumsi:
1. Simpan mengirim lapisan override MILIK versi utuh (bukan delta), `roleFormats` efektif utuh, dan `sectionPlan` versi apa adanya (milik S59) agar tidak ada yang hilang apa pun semantik S49.
2. Nilai induk = `resolvedParams` versi dasar (dicari lewat daftar + detail templat); tanpa dasar = default registri.
3. Galat K ditandai klien hanya untuk nilai yang DIUBAH (override K lama milik admin tidak memblok non-admin di klien; server tetap menegakkan).
4. `?kind=roles` berbentuk bebas: label diambil bila item objek ber-`key`; daftar peran = `ROLE_KEYS` kontrak.
5. `TemplatePreviewPane.draftOverrides` = lapisan override draf utuh (kunci yang di-reset tidak tampak di pratinjau sampai disimpan).
6. Versi lama (`?version=n` bukan terbaru) dibuka hanya-baca.

Temuan (D-19, tidak menghentikan): F-S58-1 HQ tidak punya endpoint log galat klien (`POST /api/logs/error`); UI mencatat JSON terstruktur ke console + id korelasi server. Butuh keputusan controller/baris pemilik API. F-S58-2 route R02 `[id]` dan R03 registry belum ada di disk saat S58 (hanya `templates/route.ts` S54); `services/templates` masih stub, jadi uji integrasi curl tidak mungkin — dialihkan ke S80.

Permintaan lintas pemilik: tidak ada.
