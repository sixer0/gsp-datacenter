# IP-43d coder-execution (tier D, mekanis)
Status: complete
- Ubah: `src/lib/studio/engine/html/base/fonts.ts` `fontBase64`: `details` galat `BY_CONSTRUCTION_FAILED` (sha256 fon tidak cocok) kini hanya `{ expected }`; medan `actual` dibuang (sha256 dihitung inline, tanpa variabel). Tidak ada log server di jalur ini, jadi tidak ada yang dipertahankan di sana.
- tsc seluruh repo (`npx tsc --noEmit -p .`): exit 0.
- `npx eslint src/lib/studio/engine/html/base/fonts.ts`: exit 0.
- Asap (skrip scratch, `fontFaceCssDetailed` dengan aset fon sha256 salah): `BY_CONSTRUCTION_FAILED | sha256 fon tidak cocok: Foo-Regular.ttf | {"expected":"000...0"}` (tanpa `actual`).
- Catatan: `expected` (sha terkunci templat/manifest) tetap di details; di luar lingkup baris.
