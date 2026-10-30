---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-HR3
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-332 C3; D-98, D-134, D-168..D-172, D-330)
status: complete
---

# FIX-HR3: D16 NOT_APPLICABLE rel bukti hanya dari lapis ADMIN (D-332 C3)

Skill yang dipakai: security-and-hardening (gagal tertutup, satu sumber hak tulis) dan dry-run-verify-fix.
Klaim tercatat di `file_claims.md` (baris FIX-HR3). Penulisan kode memakai berkas `.fixhr3tmp` lalu `os.replace`. Sisa `.fixhr3tmp` = 0.
Registri `params/**` dan `registry/**` hanya dibaca, tidak diubah.

## Kelas kunci (ditentukan lebih dulu)

| Fakta | Sumber | Isi |
|---|---|---|
| Definisi | `src/lib/studio/params/page.ts:227` | P4S-07 `device.evidenceRail.enabled`, bool, bawaan `true`, kelas B |
| Lapis | `src/lib/studio/registry/essentials.ts:63-110` | `ids("P4S-", [4, 8], ...)` ada di daftar `advanced`. Lapis = **advanced**, bukan essential |
| Kenop esensial | `registry/essentials.ts:285-296` | Tidak ada kenop yang memetakan kunci ini. Kenop USER "Rel bukti" (EK-G08) hanya menulis `layout.railMode` (A/B/auto). Kenop itu memilih tata letak dan tidak melonggarkan D16 (diuji) |
| Templat (R01/R02/kerangka/draf validasi) | `services/skeleton/access.ts:1-25, 254-270` | advanced/internal hanya ADMIN, selain itu 403 `PARAM_SURFACE_FORBIDDEN` (D-163 T-1). `expertMode` tidak membuka lapis ini |
| Impor profil | `services/templates/index.ts:1255` | Hanya dipanggil seed server (`prisma/seed-studio.ts:230,275`, `ADMIN_CALLER`). Tidak ada route HTTP |
| Override dokumen | `services/ingest/index.ts:264-270`, `services/ingest/v2.ts:869-875`, `services/adapt-v1/index.ts:16-17,101-103`, `services/render/common.ts:185-225` | v2: medan `overrides` terlarang (DF-41). Adaptor v1: override hanya dipertahankan untuk `allow` tepercaya, selain itu dibuang. Jalur v1 lama: hanya pemanggil tepercaya. Render inline: kunci non-esensial dari pemanggil bukan ADMIN dikupas (`gateInlineDocOverrides`, diuji) |

Kesimpulan: USER **tidak dapat** mematikan rel lewat templat buatan sendiri maupun override dokumen. Nilai `false` hanya dapat berasal dari preset/templat ADMIN, termasuk yang diwarisi lewat `baseVersionId`, atau dari override pemanggil tepercaya. Kasus "templat USER mematikan" hanya mungkin bila registri kelak menaikkan kunci ke lapis esensial. Kasus itu diuji dengan simulasi reklasifikasi.

## Perubahan

| Berkas | Jenis | Isi |
|---|---|---|
| `src/lib/studio/engine/lint/structure/checks-d.ts` | ubah (d16 + helper baru) | Menambah `EVIDENCE_RAIL_ENABLED_KEY`, `isUserWritableParam(key)`, `RailOffAuthority`, dan `evidenceRailOffAuthority(ctx)`. `isUserWritableParam` bernilai true bila lapis `essential`, lapis tidak ada, kunci tidak dikenal (gagal tertutup), atau ada kenop esensial yang memetakan kunci itu. Registri dibaca saat dipanggil. Aturan D16: pengecualian rel berlaku hanya bila `adminControlled`, yaitu kunci tidak dapat ditulis USER ATAU templat terbatas D-98 (`releasedBlockingChecks`). Selain itu syarat rel tetap ketat, dan pesan FAIL ditambah alasan: "rel bukti dimatikan templat/override dokumen (… = false), tetapi kunci itu dapat diubah USER dan templat tidak terbatas D-98, jadi syarat rel tetap berlaku: tambahkan baris rel … atau minta ADMINISTRATOR …". Detail NOT_APPLICABLE kini menyebut asal: "preset atau templat yang disimpan ADMINISTRATOR", "override dokumen pemanggil tepercaya (KD-26)", atau "templat terbatas D-98 (melepas …)". Rel menyala: perilaku dan teks tidak berubah |
| `tests/unit/studio/structure/fixhr3-d16-rail-authority.test.ts` | baru | 16 uji, lihat Bukti |

Uji FIX-HZ2 (`fixhz2-decorative-d16.test.ts`) tidak perlu diubah. Substring yang dikuncinya tetap ada, dan 11/11 lulus.

## Bukti

| Cek | Perintah | Hasil |
|---|---|---|
| Uji baru | `npx vitest run tests/unit/studio/structure/fixhr3-d16-rail-authority.test.ts` | 16/16 lulus. Registri: P4S-07 B/advanced/true, 0 kenop, `isUserWritableParam` false. EK-G08 `layout.railMode` B tetap FAIL. Kunci asing dianggap dapat ditulis USER. Templat USER 403 `PARAM_SURFACE_FORBIDDEN`, ADMIN boleh. Render inline: kunci dikupas untuk USER walau `allow`+trusted, dipertahankan untuk ADMIN. **Preset/ADMIN mematikan = NOT_APPLICABLE**. **Templat terbatas mematikan (kunci disimulasikan esensial) = NOT_APPLICABLE**. Override tepercaya pada kunci lanjutan = NOT_APPLICABLE. **Templat USER mematikan (simulasi esensial, tidak terbatas) = FAIL berpenjelasan** (wajib tanpa rel). Terlarang + rel = FAIL. Wajib + rel = PASS biasa. Override pada kunci esensial = FAIL. **Rel menyala = ketat** (wajib tanpa rel dan terlarang + rel = FAIL dengan teks lama persis). Lapis dipulihkan setelah simulasi |
| Cek merah | Logika d16 HZ2 dipasang sementara, lalu jalankan berkas uji yang sama | 7 gagal / 9 lulus: 4 gagal perilaku (kasus USER dapat ubah tidak ketat) + 3 gagal teks asal. Berkas dipulihkan (`cmp` sama) |
| Uji FIX-HZ2 | `npx vitest run tests/unit/studio/renderers/fixhz2-decorative-d16.test.ts` | 11/11 lulus |
| Unit studio | `npx vitest run tests/unit/studio` | 83 berkas lulus; 2254 lulus, 1 dilewati, 0 gagal (termasuk uji baris paralel di pohon kerja) |
| tsc | `npx tsc --noEmit -p tsconfig.json` | exit 0 |
| eslint area | `npx eslint src/lib/studio/engine/lint/structure/checks-d.ts tests/unit/studio/structure/fixhr3-d16-rail-authority.test.ts` | exit 0 |
| Lint Manual 000 | `npx tsx benchmark/harness/run/run_benchmark.ts --schema v2 --official --skip-pdf --skip-compare --out benchmark/out/fixhr3/{before,after}`. `before` = checks-d HZ2 dipasang sementara, `after` = versi baru, pohon kerja dan host sama | `run_summary.json` `lint` identik dan `ingest.lint` identik: 172 cek, 19 FAIL, rilis TERBIT FAIL (sama dengan angka D-330). DOCX sha `888f281f…` sama di kedua run. Exit 1 = vonis INCOMPLETE karena PDF/compare sengaja dilewati; langkah lint:OK |

Keluaran (gitignore): `benchmark/out/fixhr3/{before,after}`.

## Persistent Issues

| Isu | Percobaan | Akar | Status | Memblokir? |
|---|---|---|---|---|
| - | - | - | Tidak ada | Tidak |

## Issues & Decisions

| Langkah | Isu / keputusan | Resolusi |
|---|---|---|
| Asal nilai | `ResolvedTemplate` hanya membawa parameter terselesaikan, tanpa jejak lapis. Lint tidak dapat membedakan nilai preset dari override USER | Asal dibuktikan dari dua hal yang dapat diperiksa di parameter: (1) lapis kunci di registri (tidak dapat ditulis USER = semua jalur tulis hanya ADMIN/tepercaya), (2) status terbatas D-98 yang dihitung ulang dari `lint.enforcementOverride`. Bila kunci kelak menjadi esensial, asal preset tidak terbukti, jadi gagal tertutup (FAIL), kecuali templat terbatas. Tidak ada medan baru di kontrak dan tidak ada perubahan pemanggil |
| Registri | Kelas/lapis P4S-07 tidak perlu diubah: sudah advanced (hanya ADMIN) | Registri tidak disentuh. Uji mengunci klasifikasi itu, jadi reklasifikasi diam-diam akan terlihat. D16 juga otomatis kembali ketat |
| Override dokumen | `ctx.doc.overrides` hanya dipakai untuk kalimat asal. Keputusan tetap mengikuti lapis/terbatas | Override pada kunci yang dapat ditulis USER = FAIL (diuji) |
| Simulasi di uji | Kasus "USER dapat mematikan" disimulasikan dengan mengubah `surface` objek registri selama satu uji, dipulihkan di `finally` | Isolasi berkas vitest mencegah kebocoran ke berkas lain. Uji terakhir memastikan lapis kembali `advanced` |
| Catatan keamanan | Jalur v1 lama (`ingest/index.ts:463`) memeriksa override hanya untuk K/T, tanpa lapis | Jalur itu hanya untuk pemanggil tepercaya (`opts.legacyV1` + trusted, `ingest/index.ts:264-267`), jadi bukan celah USER. Dicatat untuk SR-57 |

## Lanjutan

- Review direkomendasikan: `senior-code-reviewer`/`security-review` atas `checks-d.ts` (`isUserWritableParam`, `evidenceRailOffAuthority`, d16).
