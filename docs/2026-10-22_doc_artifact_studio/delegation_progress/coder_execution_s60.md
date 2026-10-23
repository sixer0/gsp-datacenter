# S60 — UI beranda, layout, daftar dan penampil dokumen Studio

Status: complete (penjaga kompilasi/lint; tanpa uji runtime, sesuai driver_rules — E2E di S80)

Berkas (15): `src/app/studio/{page.tsx,layout.tsx}`, `src/app/studio/documents/page.tsx`, `src/app/studio/documents/[id]/page.tsx`, `src/components/studio/document-viewer/{api.ts,labels.ts,feedback.tsx,studio-subnav.tsx,studio-home.tsx,document-list.tsx,document-viewer.tsx,address-tree.tsx,meta-panel.tsx,output-files.tsx,index.ts}` (1.970 baris).

Penjaga:
- `npx tsc --noEmit -p tsconfig.json` -> grep area `src/(app/studio/(page|layout|documents)|components/studio/document-viewer)` = 0 baris. Galat di luar area (bukan milik S60): `src/app/api/studio/artifacts/_lib/request.ts` (S57), `src/app/api/user-access/*`, `src/app/api/information-library/propose/route.ts` (sudah ada sebelumnya).
- `npx eslint <5 path area>` exit 0, tanpa keluaran.

Keputusan:
1. Data via route spesifikasi §6.2: R04 (`take=50`, cursor), R05 (`?rev=`), R01, R09 (`take=200`), R11 (`?jobs=1&take=1`), R10 (`?inline=1` pratinjau, `?download=1` unduh). Filter tier/status rilis diterapkan di klien (R04 tidak memfilternya); filter disimpan di URL.
2. Tautan sunting (S61): `/studio/documents/[id]/edit?address=<encodeURIComponent>`; riwayat: `/studio/documents/[id]/revisions`. S61 perlu membaca `?address=`.
3. Pratinjau HTML/SVG: iframe `sandbox=""` (tanpa allow-scripts/allow-same-origin), tanpa tautan tab baru. PDF: Chromium memblokir penampil PDF di iframe ber-sandbox, jadi PDF memakai `<object type="application/pdf">` hanya bila `mime = application/pdf` (deviasi dari brief "iframe sandbox" untuk PDF).
4. Komponen klien bersama (subnav, beranda, daftar) ditaruh di `document-viewer/` karena itu satu-satunya folder komponen milik S60.
5. Galat: pesan bahasa awam + coba lagi berjeda 3/6/12 dtk (maks 3, hitung mundur, tombol nonaktif); 4xx tanpa coba lagi; 401 -> tautan /login.

Temuan:
- F1: HQ tidak punya endpoint log galat klien (mis. POST /api/logs/error); `reportClientError` sementara menulis JSON terstruktur ke konsol. Perlu pemilik baris jika sink tahan lama diwajibkan.
- F2: HQ tidak punya halaman detail per AgentRequest/HermesTask; meta menautkan ke daftar dokumen terfilter, `/brahma`, `/tasks`, `/information-library` + ID yang dapat disalin.
- F3: R10 di spesifikasi hanya menyebut `?download=1`; S57 sebaiknya memastikan default/`?inline=1` = `Content-Disposition: inline` dan `X-Content-Type-Options: nosniff`.
- F4: Probe `curl` ke localhost:9011 untuk R01/R04/R09/R11 timeout (kode 000); route R04/R05/R09/R10/R11 belum ada di disk saat ditulis. Integrasi nyata diverifikasi di S80.

Permintaan lintas pemilik: tidak ada (file_requests.md tidak disentuh).
