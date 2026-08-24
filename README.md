# GSP Agent Headquarter — Markas Besar Agen AI (Brahma HQ)

> **Mission-control dashboard** untuk agen AI self-hosted milik **PT. Gemilang Satria Perkasa (GSP)**.
> Antarmuka web untuk mengawaki agen Brahma (Hermes Agent): dispatch tugas, tinjau rencana, setujui aksi berisiko, jelajahi memori, dan pantau seluruh fleet agen — dari satu tempat.

| | |
|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 + TypeScript |
| **UI** | Tailwind CSS v4, Recharts, react-dnd, lucide-react |
| **Database** | PostgreSQL via Prisma ORM |
| **Auth** | NextAuth (Google OAuth) + RBAC WebUI (username/password) |
| **Agent** | Brahma / Hermes Agent (`hermes` CLI) |
| **Bridge** | `hermes-bridge` (Node.js, hanya dependensi `pg`) |
| **Desktop wrapper** | Tauri 2 (`src-tauri/`) |
| **Deploy** | Vercel (web) + launchd/systemd (bridge) |

---

## Daftar Isi

1. [Ringkasan](#ringkasan)
2. [Fitur](#fitur)
3. [Arsitektur sekilas](#arsitektur-sekilas)
4. [Struktur repositori](#struktur-repositori)
5. [Quick start](#quick-start)
6. [Variabel environment](#variabel-environment)
7. [Bridge (hermes-bridge)](#bridge-hermes-bridge)
8. [Halaman & API](#halaman--api)
9. [Model data](#model-data)
10. [Operasional harian](#operasional-harian)
11. [Keamanan](#keamanan)
12. [Deploy](#deploy)
13. [Backup & restore](#backup--restore)
14. [Dokumentasi lengkap](#dokumentasi-lengkap)

---

## Ringkasan

GSP Agent Headquarter adalah **dashboard kendali misi** yang terpasang di samping agen Brahma
yang berjalan lokal di mesin Anda. Situs ini adalah kokpit Anda:

- **Dispatch pekerjaan** — kirim instruksi sekali jalan (*one-shot*) atau tugas kanban ke agen (termasuk profil agen spesialis fleet `gsp-*`).
- **Tinjau rencana** — lihat rencana dan hasil kerja agen sebelum dieksekusi.
- **Setujui aksi berisiko** — setiap permintaan dengan efek samping menunggu persetujuan eksplisit Anda di *Approval Inbox*.
- **Jelajahi memori** — baca/kelola knowledge base agen lewat Information Library (wiki + workspace + vault).
- **Pantau fleet** — roster agen, status live, telemetry orkestrasi lintas profil, dan biaya.

Pola komunikasi utama: **website dan agen tidak pernah bicara langsung**. Keduanya membaca/menulis
**database PostgreSQL yang sama** yang berfungsi sebagai *message bus*. Proses kecil bernama
`hermes-bridge` berjalan di mesin tempat Brahma hidup untuk menjembatani bus dengan CLI `hermes`.

> Folder ini adalah **backup lengkap codebase** (diambil 24 Agustus 2026 dari `~/gsp-agent-headquarter`)
> plus dokumentasi komprehensif. Lihat [Backup & restore](#backup--restore) untuk detail isi backup.

---

## Fitur

### Kokpit (Cockpit)
- **Dashboard home** — ringkasan status agen, tugas, dan aktivitas harian.
- **⌘K Command palette** — lompat ke halaman mana pun atau picu aksi cepat.
- **Daily brief Chief-of-Staff** — ringkasan harian yang dibuat terjadwal (via bridge).

### Control hub Brahma (`/brahma`)
- **Dispatch** — kirim *one-shot prompt* atau *kanban task* ke agen; dukung target profil (`gsp-*`).
- **Approval Inbox** — permintaan berisiko (side-effecting) menunggu persetujuan Anda.
- **Live activity feed & run history** — pantau eksekusi agen secara real-time.
- **Cron & health** — daftar jadwal dan status kesehatan agen yang dicerminkan dari Hermes.

### Memory & Knowledge
- **Information Library** (`/information-library`, eks `Memory Wiki`) — jelajahi & edit memori agen:
  - scope **Wiki** (HermesMemory → DB), **Workspace** (file `.md` di shared GSP workspace), dan **Vault** (staging entri untuk librarian).
  - Entri project menampilkan `files[]` sebagai link yang bisa diklik.

### Work & Content
- **Tasks & Ideas boards** — papan tugas dan ide.
- **Content OS** — pipeline konten X/Twitter: draft, skor viral, kalender, feedback.
- **Longform & YouTube studios** — studio skrip longform + ide/skrip YouTube dengan SEO package.
- **Articles** — pipeline artikel (mega-viral / local-viral / icp-viral).
- **Client Pulse** — papan kesehatan klien (ingestion data sendiri).
- **Agents roster, Garden, Watchlist Radar, X Analytics, Trends**.

> Sebagian fitur butuh API key sendiri (YouTube, X/Twitter, OpenAI, dll). Semuanya opsional
> dan dikonfigurasi via env — dashboard inti tetap jalan tanpa API key.

### Orkestrasi & RBAC (kustomisasi GSP)
- **Orchestration** (`/orchestration`) — graf + timeline telemetry orkestrasi lintas profil (model `OrchestrationRecord`).
- **RBAC WebUI** — pengguna `ADMINISTRATOR` / `USER` dengan pin ke profil Hermes masing-masing.
- **Roster agen dinamis** — `/api/agents` menggabungkan roster statis + user WebUI (controller).

---

## Arsitektur sekilas

```
        ┌──────────────────────────┐          ┌───────────────────────────┐
        │  GSP Agent Headquarter   │          │  Mesin Anda (Mac/Server)  │
        │  (Next.js web dashboard) │          │                           │
        │                          │          │  ┌───────────────────┐    │
        │  • dispatch requests     │          │  │  hermes-bridge    │    │
        │  • approval inbox        │          │  │  (bridge.mjs)     │    │
        │  • activity / runs       │          │  └───────┬───────────┘    │
        │  • information library   │          │          │ hermes CLI     │
        │  • orchestration map     │          │  ┌───────▼───────────┐    │
        └──────────┬───────────────┘          │  │  Brahma / fleet   │    │
                   │                          │  │  (profil gsp-*)   │    │
                   │                          │  └───────────────────┘    │
                   ▼                          └───────────┬───────────────┘
        ┌─────────────────────────────────────────────────────────────────┐
        │            PostgreSQL — message bus (gsp_agent_hq)              │
        │  AgentRequest · AgentEvent · HermesTask · HermesMemory          │
        │  DataStore · Brief · OrchestrationRecord · WebUiUser · …        │
        └─────────────────────────────────────────────────────────────────┘
```

**Alur utama:**

1. **Website → Agen:** situs menyisipkan baris `AgentRequest`. Request aman berstatus `queued`;
   request dengan efek samping berstatus `awaiting_approval` sampai Anda setujui di inbox.
2. **Bridge → Agen:** `hermes-bridge` mem-poll Postgres, menjalankan request `queued`/`approved`
   lewat CLI `hermes`, lalu menulis hasil kembali. Bridge **tidak pernah** menjalankan `awaiting_approval`.
3. **Agen → Website:** bridge mencerminkan kanban (`HermesTask`), cron + health (`DataStore`),
   memori wiki (`HermesMemory`), daily brief (`Brief`), dan aktivitas (`AgentEvent`) kembali ke
   Postgres, lalu website membacanya.
4. **Telemetry orkestrasi:** setiap dispatch lintas profil menulis `OrchestrationRecord`
   (kind: `delegate|handoff|verify|report|review|gate|dispatch`; status: `running|done|blocked|needs-review|failed|rejected`)
   yang dirender sebagai graf di `/orchestration`.

Tidak ada komponen di mesin Anda yang terbuka ke internet — bridge hanya butuh akses **keluar**
ke Postgres dan CLI `hermes` lokal. Lihat [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) untuk detail.

---

## Struktur repositori

```
gsp-agent-headquarter/
├── src/                    # Next.js App Router — dashboard & seluruh API
│   ├── app/                # halaman (pages) + API routes (route.ts)
│   │   ├── api/            # ±60 endpoint — lihat docs/API-REFERENCE.md
│   │   ├── brahma/         # control hub (dispatch, approval, runs)
│   │   ├── information-library/   # memory wiki + workspace + vault
│   │   ├── orchestration/  # graf telemetry lintas profil
│   │   ├── tasks/          # kanban tasks
│   │   ├── user-access/    # manajemen user RBAC
│   │   └── …               # content-os, youtube, longform, articles, x, client-pulse, …
│   ├── components/         # sidebar, command-palette, approval-inbox, briefing, chart, …
│   ├── lib/                # auth.ts, prisma.ts, webui-rbac.ts, google-creds.ts, …
│   └── middleware.ts       # guard auth (dev-bypass, NextAuth JWT, x-internal-secret)
├── prisma/
│   ├── schema.prisma       # seluruh model data (message bus + fitur) — lihat docs/DATA-MODEL.md
│   └── seed.ts             # seed data awal
├── hermes-bridge/          # bridge Node.js (poll Postgres ↔ jalankan hermes CLI)
│   ├── bridge.mjs          # inti bridge (ESM, dependensi hanya pg)
│   ├── ai.gspagenthq.bridge.plist   # template launchd macOS
│   └── wiki-skill/         # skill pendukung wiki
├── scripts/
│   └── seed-webui-admin.mjs # seed admin RBAC WebUI
├── scanner/
│   └── outlier-scanner.js  # scanner data outlier (X analytics)
├── src-tauri/              # desktop wrapper Tauri 2 (opsional)
├── public/                 # aset statis + banner
├── .env.example            # SEMUA variabel environment terdokumentasi
├── next.config.ts          # redirect /memory-wiki → /information-library, dll
├── vercel.json             # region + cron (x-stats setiap 08.00)
└── docs/                   # dokumentasi komprehensif (folder ini)
```

---

## Quick start

### Prasyarat

- **Node.js 20+** (22 disarankan) dan **git**
- **PostgreSQL** — URL koneksi, mis. Neon/Supabase/Vercel Postgres, atau Postgres lokal
- **Brahma / Hermes agent** terpasang di mesin yang Anda kontrol (`hermes` CLI tersedia di PATH)
- **Google OAuth** (Client ID + Secret) — opsional di dev (mode bypass aktif), wajib di produksi
- Akun **Vercel** (atau host Node apa pun) untuk deploy website

### 1. Instal dependensi

```sh
cd gsp-agent-headquarter
npm install          # menjalankan prisma generate via postinstall
```

### 2. Konfigurasi environment

```sh
cp .env.example .env
```

Isi minimal variabel **Core**: `DATABASE_URL`, `POSTGRES_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_EMAILS`, `NEXT_PUBLIC_OWNER_NAME`.
Generate secret:

```sh
openssl rand -base64 32
```

> Setiap variabel didokumentasikan inline di [`.env.example`](./.env.example).
> Jangan pernah commit `.env` asli.

### 3. Buat tabel database

```sh
npx prisma db push     # proyek ini tanpa folder migrations — db push adalah cara standar
npm run db:seed        # seed data awal (opsional)
```

### 4. Jalankan lokal

```sh
npm run dev
```

Buka <http://localhost:3000> (deployment GSP saat ini memakai port **9011** via `NEXT_PUBLIC_BASE_URL`).
Di mode development, middleware melewati autentikasi; di produksi, login Google/RBAC aktif.

### 5. Hubungkan agen (bridge)

Di mesin tempat Brahma berjalan:

```sh
cd hermes-bridge
npm install
DATABASE_URL='postgres://…sama dengan website…' HERMES_BOARD=default node bridge.mjs
```

Anda akan melihat `hermes-bridge up …` dan event **"Bridge connected"** muncul di activity feed website.
Untuk menjalankan selamanya: launchd (macOS) / systemd (Linux) — lihat [docs/SETUP-INSTALLATION.md](./docs/SETUP-INSTALLATION.md).

### 6. Deploy ke Vercel (opsional)

```sh
npm i -g vercel
vercel && vercel --prod
```

Set **semua** env var di Project → Settings → Environment Variables, atur `NEXTAUTH_URL` dan
`NEXT_PUBLIC_BASE_URL` ke URL produksi, dan daftarkan redirect URI
`https://<domain>/api/auth/callback/google` di Google Cloud console.

---

## Variabel environment

Dikelompokkan per fungsi (detail lengkap di [`.env.example`](./.env.example)):

| Grup | Variabel | Keterangan |
|---|---|---|
| **Core (wajib)** | `DATABASE_URL`, `POSTGRES_URL` | Koneksi Postgres — message bus yang sama dipakai website & bridge |
| | `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | URL publik + secret penandatangan sesi |
| | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_EMAILS` | Login Google + allowlist email |
| | `NEXT_PUBLIC_OWNER_NAME`, `NEXT_PUBLIC_BASE_URL` | Nama pemilik & base URL (publik) |
| **Hermes/bridge** | `HERMES_BOARD` | Slug board kanban yang dicerminkan (`default`) |
| | `HERMES_BIN` | Path CLI `hermes` bila tidak di PATH |
| | `HERMES_WIKI` | Root memori-wiki (markdown git) untuk mirror `HermesMemory` |
| | `BRIEF_HOUR` | Jam (0–23) pembuatan daily brief |
| | `INTERNAL_API_SECRET`, `CRON_SECRET` | Secret internal API & endpoint terjadwal |
| **Opsional** | `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `XAI_API_KEY`, `BRAVE_API_KEY` | Provider AI (brief, scoring, konten) |
| | `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` | Fitur YouTube |
| | `TWITTER_BEARER_TOKEN` | Content OS metrics X/Twitter |
| | `NOTION_API_KEY` | Sinkronisasi klien/data dari Notion |
| | `CLIENT_PULSE_ADMIN_SECRET` | Secret admin Client Pulse (fallback ke `CRON_SECRET`) |
| | `HL_WALLET` | Alamat wallet publik untuk Watchlist Radar |
| | `WEBUI_RBAC_TOKEN` | Token RBAC WebUI |

---

## Bridge (hermes-bridge)

`hermes-bridge` adalah proses Node.js kecil (ESM, dependensi hanya `pg`) yang menghubungkan
website dengan agen via Postgres sebagai message bus.

**Env bridge:** `DATABASE_URL` (wajib, URL langsung `postgres://`, **bukan** `prisma://` Accelerate),
`HERMES_BOARD` (default `default`), `BRIDGE_POLL_MS` (5000), `BRIDGE_MIRROR_MS` (30000),
`BRIDGE_RUN_TIMEOUT_MS` (default **1800000** = 30 menit), `HERMES_BIN` (default `hermes`),
`HERMES_WIKI` (default `~/.hermes/wiki`), `BRIEF_HOUR` (default 8).

Lihat [hermes-bridge/README.md](./hermes-bridge/README.md) dan [docs/SETUP-INSTALLATION.md](./docs/SETUP-INSTALLATION.md).

---

## Halaman & API

**Halaman utama:** `/` (dashboard) · `/brahma` (control hub) · `/information-library` ·
`/orchestration` · `/tasks` · `/agents` · `/user-access` · `/content-os` · `/articles` ·
`/youtube` · `/longform` · `/ideas` · `/x`, `/x-content`, `/x-analytics` · `/client-pulse` ·
`/garden` · `/watchlist-radar` · `/login`.

**API:** ±60 endpoint di `src/app/api/` — kelompok utama:
`/api/brahma/*` (activity, briefing, cost, crons, dispatch, health, memory, requests, tasks, rbac),
`/api/agents`, `/api/orchestration`, `/api/information-library` (+ `/file`),
`/api/tasks`, `/api/user-access`, `/api/x-content/*`, `/api/youtube/*`, `/api/articles/*`,
`/api/client-pulse/*`, dan lainnya.

Referensi lengkap endpoint dengan contoh request/response: **[docs/API-REFERENCE.md](./docs/API-REFERENCE.md)**.

---

## Model data

±30 model Prisma, dikelompokkan:

- **Auth (NextAuth):** `Account`, `Session`, `User`, `VerificationToken`
- **Hermes bus:** `AgentRequest`, `AgentEvent`, `HermesTask`, `HermesMemory`, `DataStore`, `Brief`, `Mission`, `AgentState`, `AgentBusMessage`
- **Orkestrasi GSP:** `OrchestrationRecord`
- **Konten:** `Draft`, `TweetMetric`, `Idea`, `ContentCalendar`, `YoutubeIdea`, `YoutubeScript`, `YoutubeFeedback`, `LongformScript`, `Article`, `SavedTitle`, `ContentRequest`
- **Client Pulse:** `ClientPulseClient`, `ClientPulseChat`, `ClientPulseMessage`, `ClientPulseAnalysis`, `ClientPulseAlert`
- **RBAC WebUI:** `WebUiUser` (+ enum `Role: ADMINISTRATOR | USER`)
- **Lainnya:** `BattleRoyaleBot`

Diagram ER dan deskripsi tiap model: **[docs/DATA-MODEL.md](./docs/DATA-MODEL.md)**.

---

## Operasional harian

| Aksi | Perintah |
|---|---|
| Dev server | `npm run dev` (GSP: port 9011) |
| Build produksi | `npm run build` (prisma generate + next build) |
| Jalankan produksi | `npm start` |
| Lint | `npm run lint` |
| Sinkronisasi schema DB | `npx prisma db push` |
| Prisma Studio | `npm run db:studio` |
| Seed awal | `npm run db:seed` |
| Seed admin RBAC | `WEBUI_ADMIN_USERNAME=admin WEBUI_ADMIN_PASSWORD='…' node scripts/seed-webui-admin.mjs` |
| Bridge (foreground) | `cd hermes-bridge && node bridge.mjs` |
| Bridge (launchd) | lihat `ai.gspagenthq.bridge.plist` |

Runbook lengkap (start/stop, watchdog, troubleshooting, pemulihan dispatch yang hang):
**[docs/OPERATIONS-RUNBOOK.md](./docs/OPERATIONS-RUNBOOK.md)**.

---

## Keamanan

- **Approval gate:** request side-effecting tidak pernah dijalankan bridge sebelum Anda setujui.
- **Bridge inbound-free:** hanya akses keluar ke Postgres + CLI `hermes` lokal; tidak ada port terbuka.
- **Auth:** Google OAuth (allowlist email) di produksi + RBAC WebUI; di development middleware melewati auth.
- **Internal API:** endpoint internal dilindungi `x-internal-secret` (`INTERNAL_API_SECRET`).
- **Endpoint terjadwal:** dilindungi `CRON_SECRET`.
- **Information Library file:** endpoint file punya proteksi path traversal (403).

---

## Deploy

- **Website:** Vercel — `vercel.json` menetapkan region `iad1` + cron harian `/api/cron/x-stats` (08.00).
- **Bridge:** launchd (macOS) via `ai.gspagenthq.bridge.plist`, atau systemd (Linux).
- **Desktop:** `src-tauri/` — wrapper desktop Tauri 2 (opsional, belum dikonfigurasi build).

---

## Backup & restore

Folder ini adalah **backup utuh codebase** `~/gsp-agent-headquarter` per **24 Agustus 2026**:

- **Isi:** seluruh source (`src/`, `prisma/`, `hermes-bridge/`, `src-tauri/`, `scripts/`, `scanner/`, `public/`),
  konfigurasi (`package.json`, `package-lock.json`, `next.config.ts`, `vercel.json`, `tsconfig.json`, `.env.example`, `.env`),
  riwayat git (`.git/`), dan dokumentasi (`README.md` + `docs/`).
- **Tidak disertakan (diregenerasi):** `node_modules/` (±1.1 GB), `.next/` (±500 MB), `tsconfig.tsbuildinfo`.
- **Restore:**
  ```sh
  rsync -a "/Users/mbp/documents/Project/GSP AI/GSP Agent HQ/" ~/gsp-agent-headquarter-restored/
  cd ~/gsp-agent-headquarter-restored
  npm install        # membangun ulang node_modules + prisma generate
  npx prisma db push # memastikan schema DB sinkron
  npm run dev
  ```
- **Catatan keamanan:** folder ini berisi `.env` asli (kredensial lokal). Jangan membagikan folder ini
  atau meng-commit ke repositori publik tanpa mengganti secret.

---

## Dokumentasi lengkap

| Dokumen | Isi |
|---|---|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Arsitektur sistem, alur data, komponen, kustomisasi GSP |
| [docs/API-REFERENCE.md](./docs/API-REFERENCE.md) | Referensi seluruh endpoint API + contoh request/response |
| [docs/DATA-MODEL.md](./docs/DATA-MODEL.md) | Model data Prisma + diagram ER |
| [docs/SETUP-INSTALLATION.md](./docs/SETUP-INSTALLATION.md) | Instalasi lengkap: prasyarat, env, DB, run, bridge, Vercel |
| [docs/OPERATIONS-RUNBOOK.md](./docs/OPERATIONS-RUNBOOK.md) | Operasional harian, watchdog, troubleshooting |
| [docs/legacy/README-original.md](./docs/legacy/README-original.md) | README asli (arsip) |
| [docs/legacy/ONBOARDING.md](./docs/legacy/ONBOARDING.md) | Panduan instalasi berbasis agen (arsip) |

---

© PT. Gemilang Satria Perkasa (GSP) — template self-hosted, silakan fork & adaptasi.
