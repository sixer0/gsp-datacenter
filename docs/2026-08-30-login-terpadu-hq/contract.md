# Kontrak: Login Terpadu Swarm HQ (akun WebUI/Brahma)

- **Tanggal:** 2026-08-30 · **Eksekutor:** Swarm (orkestrator, eksekusi langsung — tanpa dispatch fleet)
- **Persetujuan user:** formil via clarify — "pasang sekarang (form username/password + sesi HMAC di middleware)"; role TIDAK membatasi akses halaman dulu (semua yang login = akses penuh).

## Masalah yang ditemukan (terverifikasi via probe HTTP)

1. HQ produksi (`node hq-server.mjs`, NODE_ENV=production) → middleware auth aktif, tapi **tidak ada jalur login yang berfungsi**: tombol Google mati (`GOOGLE_CLIENT_ID`/`ALLOWED_EMAILS` kosong), route password `/api/auth/login` fail-closed (`ADMIN_PASSWORD` tak diset) DAN cookie-nya tidak pernah dibaca middleware (dead end).
2. **Regression SEC-001:** middleware memblokir `/api/brahma/rbac/*` dengan 401 bahkan untuk pemanggil sah ber-`x-rbac-token` (WebUI Brahma 9012) → login WebUI ke DB HQ ikut mati sejak HQ pindah produksi.

## Perubahan

| File | Isi |
|---|---|
| `src/lib/hq-session.ts` (baru) | Sesi HMAC-SHA256 (secret = `NEXTAUTH_SECRET`), cookie `gsp_hq_session` httpOnly/secure/sameSite=lax, TTL 24 jam, payload `{u,r,p,exp}`, verifikasi constant-time, fail-closed tanpa secret. |
| `src/app/api/auth/login/route.ts` (ganti) | Username+password → verifikasi `WebUiUser` via `verifyPassword()` SHARED dari `webui-rbac.ts` (satu akun dgn WebUI Brahma). Throttle per-IP 10 kali/15 mnt. |
| `src/middleware.ts` (ganti) | Terima 3 identitas: NextAuth Google, cookie sesi HQ (validasi HMAC via Web Crypto, edge-safe; nama cookie didefinisikan ulang karena `node:crypto` tak tersedia di edge), `x-internal-secret`. **Lewat pre-session hanya utk `/api/brahma/rbac/*`** (handler sudah jaga diri via `x-rbac-token`) — fix regression #2. |
| `src/app/api/auth/logout/route.ts` (baru) | Hapus cookie sesi. |
| `src/app/api/auth/me/route.ts` (baru) | Siapa yang login (untuk UI). |
| `src/app/login/page.tsx` (ganti) | Form username/password; Google OAuth dihapus dari UI (env-nya pun kosong). |
| `src/components/user-chip.tsx` + `sidebar.tsx` | Nama+role user & tombol logout di footer sidebar. |

## Verifikasi (post-build, post-restart) — HASIL 30-08: 14/14 PASS

Eksekusi: `npm run build` → `node scripts/hq_restart.mjs` → `node scripts/verify_login_hq.mjs`.
Bukti: V1a 401 · V1b 429 setelah 10 percobaan · V1c throttle per-IP · V2a cookie httpOnly ·
V2b `GET /` 200 · V2c `/api/auth/me` = hqtest3008/USER · V3a cookie palsu 401 · V3b tanpa sesi → /login ·
V3c API tanpa sesi 401 · V4a rbac/login+token 200 (jalur WebUI PULIH) · V4b tanpa token 401 ·
V5a x-internal-secret 200 · V5b logout cabut cookie · V6 akun uji TERHAPUS (via /api/user-access DELETE;
catatan: `/api/brahma/rbac/users` list tidak ada — hanya users/[id]).
E2E WebUI 9012: `/api/rbac/status` → enabled:true, signup_enabled:true.

1. `POST /api/auth/login` password salah → 401; throttle → 429 setelah >10.
2. Login akun uji (dibuat via endpoint rbac/signup dgn token, lalu DIHAPUS) → cookie → `GET /` 200 (bukan 307), `/api/auth/me` menampilkan user.
3. Cookie palsu/kedaluwarsa → 401/redirect.
4. `POST /api/brahma/rbac/login` dgn `x-rbac-token` benar + password benar → 200 (jalur WebUI pulih); tanpa token → 401 (guard handler tetap).
5. Endpoint lain tanpa sesi → tetap 401/redirect.

## Known gaps (disetujui scope)

- Role ADMIN/USER belum membatasi halaman HQ (permintaan user: "tidak dulu").
- Cookie sesi tidak dicabut server-side saat logout (stateless; TTL 24 jam) — wajar untuk skala ini.
- 19 error tipe warisan masih di-ignore via `ignoreBuildErrors` (backlog lama).
