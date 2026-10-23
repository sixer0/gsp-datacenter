# coder-execution IP-49 — middleware ?next= (D-192)

status: complete
Berkas: `src/middleware.ts` (satu-satunya; klaim di `file_claims.md` prefiks IP-49).

## Perubahan
Pengalihan halaman (non-API) tanpa sesi ke `/login` kini membawa `?next=<pathname+search>` yang di-encode lewat `URLSearchParams` (jalur relatif, tanpa host). Dilewati bila pathname `/`, berawalan `//`, atau panjang > 2048 (selaras batas `safeNext`). `/login` tetap dikecualikan lebih awal (tidak ada parameter). Logika autentikasi lain dan respons API 401 tidak diubah. Pertahanan open-redirect utama tetap `safeNext()` di halaman login (IP-46).

## Bukti
- `npx eslint src/middleware.ts` → exit 0.
- `npx tsc --noEmit -p .` → 145 galat, 0 di `middleware` (semua di luar berkas, mis. `src/components/studio/template-editor/*`; dicatat saja).
- Asap dev server 127.0.0.1:9021 (tanpa kredensial):
  - `/studio/documents` → `307 http://127.0.0.1:9021/login?next=%2Fstudio%2Fdocuments`
  - `/studio/documents?tab=a&x=1` → `307 .../login?next=%2Fstudio%2Fdocuments%3Ftab%3Da%26x%3D1`
  - `/` → `307 .../login` ; `/login` → `200`
  - `/api/studio/registry?kind=slots` → `401 {"error":"Unauthorized"}`

## Catatan
Berkas auth HQ: masuk cakupan security review SR-57 (review recommended).
