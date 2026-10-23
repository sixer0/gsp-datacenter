# IP-46: login menghormati ?next= (D-164)

Status: complete

- Baru `src/app/login/safe-next.ts`: `safeNext(raw, fallback="/")` menerima hanya jalur relatif diawali `/`; menolak `//`, `/` + backslash, skema/host (`https:`, `javascript:`), karakter kontrol/spasi, panjang > 2048, dan `/login` (hindari loop); validasi akhir `new URL` origin sama.
- `src/app/login/page.tsx`: setelah login sukses `router.replace(safeNext(?next=))`, dibaca dari `window.location.search` saat submit (tanpa `useSearchParams`/Suspense). Alur auth lain tidak diubah.
- Bukti: skrip tsx: `/studio/documents`, `/studio?a=1&b=2#x` diterima; `//evil.com`, `https://evil.com`, `javascript:alert(1)`, backslash, kontrol, kosong, null, `/login` ditolak -> `/`. eslint 2 berkas exit 0. tsc seluruh repo: 0 galat di `src/app/login` (galat lain milik berkas Studio berjalan, tidak disentuh). curl `http://127.0.0.1:9021/login?next=/studio` -> 200.
- Catatan: `src/middleware.ts` masih redirect ke `/login` tanpa `?next=` (di luar area IP-46); agar fitur efektif, middleware perlu menyertakan `next` (IP lanjutan).
