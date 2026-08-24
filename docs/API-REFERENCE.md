# Referensi API — GSP Agent Headquarter

Seluruh endpoint berada di `src/app/api/**/route.ts` (Next.js App Router). Dokumentasi ini
mengelompokkan endpoint per domain, dengan contoh request/response untuk endpoint utama.

---

## 1. Autentikasi & Otorisasi

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth (Google OAuth). Callback: `/api/auth/callback/google` |
| `/api/auth/login` | POST | Login manual (dev/RBAC) |
| `/api/brahma/rbac/login` | POST | Login RBAC WebUI (username/password) |
| `/api/brahma/rbac/signup` | POST | Signup user RBAC (role USER, pin ke profil baru) |
| `/api/brahma/rbac` | GET/POST | Daftar/kelola user RBAC (admin) |
| `/api/brahma/rbac/users/[id]` | GET/PUT/DELETE | Detail/edit/hapus user RBAC |

**Skema auth middleware** (`src/middleware.ts`):
- Dev mode → bypass. Header `x-internal-secret: <INTERNAL_API_SECRET>` → lolos.
- Selain itu butuh sesi NextAuth JWT; API → `401`, halaman → redirect `/login`.

---

## 2. Agents (roster)

### `GET /api/agents`
Daftar agen fleet. Menggabungkan **roster statis** (`src/app/api/agents/route.ts`) dengan
**user WebUI dinamis** (tabel `WebUiUser`, role USER di-scope ke profil sendiri).

Contoh respons (terpotong):
```json
[
  {
    "id": "gsp-vendor-crawler-orchestrator",
    "profile": "gsp-vendor-crawler-orchestrator",
    "name": "Vendor Crawler Orchestrator",
    "emoji": "🕸️",
    "role": "Controller",
    "model": "deepseek/deepseek-v4-flash-0731",
    "level": 3,
    "group": "CONTROLLER"
  }
]
```

---

## 3. Brahma Control Hub (`/api/brahma/*`)

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/brahma/activity` | GET | Activity feed (dari `AgentEvent`) |
| `/api/brahma/briefing` | GET | Daily brief hari ini (`Brief`) |
| `/api/brahma/briefing/settings` | GET/PUT | Pengaturan brief (jam, dsb.) |
| `/api/brahma/cost` | GET | Ringkasan biaya agen |
| `/api/brahma/crons` | GET | Daftar cron (dimirror dari Hermes via `DataStore`) |
| `/api/brahma/health` | GET | Status kesehatan bridge/agen |
| `/api/brahma/memory` | GET/POST | Memori: GET baca, POST simpan (dispatch ke librarian `gsp-librarian`) |
| `/api/brahma/requests` | GET | Daftar `AgentRequest` (riwayat dispatch) |
| `/api/brahma/requests/[id]` | GET/PUT | Detail request; PUT untuk approve/reject/update status |
| `/api/brahma/tasks` | GET | Tugas kanban yang dimirror (`HermesTask`) |
| `/api/brahma/dispatch` | POST | **Kirim tugas baru ke agen** (lihat contoh di bawah) |

### `POST /api/brahma/dispatch`
Membuat `AgentRequest` baru.

```json
{
  "title": "Riset kompetitor",
  "prompt": "Analisis 5 kompetitor teratas dan buat ringkasan 500 kata.",
  "profile": "gsp-data-analyst",
  "sideEffecting": false
}
```

- `sideEffecting: false` → status `queued` (dijalankan bridge).
- `sideEffecting: true` → status `awaiting_approval` (menunggu approval di inbox).
- `profile` kosong/`null` → profil default (`brahma`).

---

## 4. Information Library

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/information-library` | GET | Entri memori gabungan: scope `wiki` (HermesMemory) + `workspace` (file `.md` shared GSP workspace) + `vault` (staging librarian). Param: `scope`, `type`, `q`, `statusCounts` |
| `/api/information-library/file` | GET | Baca file dari workspace/vault (`?path=…`), proteksi path traversal (403) |

Contoh respons `GET /api/information-library?scope=all` (terpotong):
```json
{
  "entries": [
    {
      "id": "docs/2026-08-24_riset",
      "scope": "workspace",
      "type": "doc",
      "title": "Riset Kompetitor",
      "path": "docs/2026-08-24_riset/README.md",
      "files": ["data.json", "corpus.md"]
    }
  ],
  "statusCounts": { "active": 10, "archived": 2 }
}
```

---

## 5. Orkestrasi

### `GET /api/orchestration`
Graf + timeline telemetry lintas profil (dari `OrchestrationRecord`). Mendukung filter
`fromAgent`, `toAgent`, `status`, `kind`, `runId`.

Contoh entri:
```json
{
  "id": "uuid",
  "runId": "run-2026-08-24-01",
  "fromAgent": "brahma",
  "toAgent": "gsp-data-analyst",
  "kind": "dispatch",
  "status": "done",
  "taskId": "cm…",
  "taskTitle": "Riset kompetitor",
  "message": "Hasil tersimpan di docs/…",
  "artifactPath": "docs/2026-08-24_riset/",
  "meta": { "model": "deepseek/deepseek-v4-flash-0731" }
}
```

---

## 6. Tasks & User Access

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/tasks` | GET/POST | Kanban tasks (mirror `HermesTask`); POST = tambah task (dispatch kind kanban) |
| `/api/user-access` | GET/POST | Daftar/tambah akses user |
| `/api/user-access/[id]` | GET/PUT/DELETE | Detail/edit/hapus akses user |

---

## 7. Content OS (X/Twitter)

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/x-content` | GET/POST | Draf konten X (`Draft`) |
| `/api/x-content/calendar` | GET | Kalender konten (`ContentCalendar`) |
| `/api/x-content/request` | POST | Request pembuatan konten |
| `/api/x-content/tweak` | POST | Revisi/tweak konten |
| `/api/x-content/top-tweets` | GET | Tweet terbaik |
| `/api/x-content/viral-score` | GET/POST | Skor viral |
| `/api/x-content/generate-visual` | POST | Generate visual |
| `/api/x-content/visual` | GET | Ambil visual |
| `/api/x-content/feedback` | POST | Feedback rating |
| `/api/x-content/mark-posted` | POST | Tandai terposting |
| `/api/x-analytics` | GET | Analitik X |
| `/api/trends` | GET | Tren |
| `/api/trends/snipe` | POST | Ambil peluang tren |
| `/api/trends/update` | POST | Update data tren |
| `/api/score` | GET | Skor engagement |
| `/api/scrape-metrics` | GET | Metrik hasil scrape |

## 8. YouTube

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/youtube/ideas` | GET | Daftar ide video (`YoutubeIdea`) |
| `/api/youtube/ideas/generate` | POST | Generate ide baru |
| `/api/youtube/ideas/update` | PUT | Update ide |
| `/api/youtube/ideas/dismiss` | POST | Tolak ide |
| `/api/youtube/scripts` | GET | Daftar skrip (`YoutubeScript`) |
| `/api/youtube/generate` | POST | Generate skrip |
| `/api/youtube/performance` | GET | Performa kanal |
| `/api/youtube/outliers` | GET | Outlier data (dipakai `scanner/outlier-scanner.js`) |
| `/api/youtube-scrape` | GET | Scrape data YouTube |

## 9. Articles & Longform

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/articles` | GET/POST | Artikel (`Article`) |
| `/api/articles/generate-article` | POST | Generate artikel |
| `/api/articles/generate-titles` | POST | Generate judul |
| `/api/articles/generate-qt` | POST | Generate quote-tweet |
| `/api/articles/generate-visuals` | POST | Generate visual |
| `/api/articles/revise` | POST | Revisi artikel |
| `/api/articles/saved-titles` | GET | Judul tersimpan (`SavedTitle`) |
| `/api/articles/scrape` | POST | Scrape sumber artikel |
| `/api/longform` | GET/POST | Skrip longform (`LongformScript`) |
| `/api/longform/generate` | POST | Generate skrip longform |
| `/api/longform/tweak` | POST | Tweak skrip |

## 10. Client Pulse

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/client-pulse` | GET | Papan kesehatan klien (klien, chat, analisis, alert) |
| `/api/client-pulse/map-chat` | POST | Petakan Telegram chat ke klien (admin, `CLIENT_PULSE_ADMIN_SECRET`) |

## 11. Lainnya

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/agent-bus` | GET/POST | Bus pesan antar-agen (`AgentBusMessage`) |
| `/api/agent-chat` | POST | Chat ke agen |
| `/api/cache/clear` | POST | Bersihkan cache |
| `/api/cron/x-stats` | GET | Cron Vercel harian statistik X (dilindungi `CRON_SECRET`) |
| `/api/garden` | GET | Data garden (publik) |
| `/api/home` | GET | Data dashboard home |
| `/api/ideas` | GET/POST | Papan ide (`Idea`) |
| `/api/watchlist-radar` | GET | Watchlist radar |
| `/api/watchlist-radar/update` | POST | Update watchlist |

---

## Catatan Umum

- **Auth:** kecuali endpoint yang di-skip middleware (auth, garden, statis), semua butuh sesi.
- **Internal:** route internal membaca header `x-internal-secret` atau query `?secret=` (`CRON_SECRET`).
- **Format:** seluruh API JSON; error standar `{ "error": "…" }` dengan status HTTP sesuai.
- **Lokasi kode:** tiap file `route.ts` mendokumentasikan perilaku spesifiknya — referensi ini
  adalah peta; file adalah sumber kebenaran.
