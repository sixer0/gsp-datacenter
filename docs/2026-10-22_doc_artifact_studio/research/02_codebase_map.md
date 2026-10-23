---
task_id: doc_artifact_studio
date: 2026-10-22
agent: data-collector
items_collected: 10 kategori (stack, struktur src, prisma, IL, auth, pola API, eksekusi proses, testing, dokumen arsitektur, fitur dokumen/upload) + 11 butir tambahan
tier: 2 (temuan eksplorasi / kumpulan data) -- apa ditemukan, mengapa relevan, cara verifikasi, sitasi
---

# 02 Codebase Map: Swarm HQ v2.1 (untuk modul "Doc Artifact Studio")

Catatan batas: dokumen ini hanya mengumpulkan dan mengutip. Tidak ada analisis desain atau saran implementasi. Rahasia dari `.env` tidak dicetak (hanya nama variabel). Semua path relatif terhadap `C:\Users\TRIAL\gsp-swarm-hq-v2.1` kecuali disebut lain. Branch aktif: `v2.1` (`git branch --show-current`). Satu-satunya perubahan belum ter-commit: folder `docs/2026-10-22_doc_artifact_studio/` (`git status --short`).

## 1. Task Overview

Sumber maksud: `docs/2026-10-22_doc_artifact_studio/identification/01_translated.md:1-35` dan `01_original.md`. Modul diminta: template dokumen/chart/diagram/gambar/HTML yang dapat dikustom, render dari JSON, struktur section/chapter/paragraph beralamat, penyimpanan per misi/task di Information Library (IL), pengguna utama AI agent.

Bagian pembuka `01_translated.md:30-35` menyebut batas awal: kerja hanya di `~/gsp-swarm-hq-v2.1` dan DB `gsp_agent_hq_v21`. Diverifikasi: `DATABASE_URL` di `.env` menunjuk database `gsp_agent_hq_v21` pada `localhost:5433` (hanya nama DB/host/port yang dibaca, kredensial tidak dicetak).

## 2. Files Collected

### 2.1 Stack dan versi (kategori 1)

| Komponen | Versi di package.json | Versi terpasang (node_modules) | Sitasi |
|---|---|---|---|
| next | 16.1.6 | 16.1.6 | `package.json:27` |
| react / react-dom | 19.2.3 | 19.2.3 | `package.json:31,34` |
| prisma / @prisma/client | ^6.19.2 | 6.19.2 | `package.json:20,30` |
| next-auth | ^4.24.13 | 4.24.13 | `package.json:28` |
| @auth/prisma-adapter | ^1.6.0 | (tidak dipakai; `src/lib/auth.ts:4-6` menyatakan pure JWT, tanpa adapter) | `package.json:19` |
| pg | ^8.19.0 | 8.19.0 | `package.json:29` |
| tailwindcss / @tailwindcss/postcss | ^4 | 4.1.18 | `package.json:38,46`; `postcss.config.mjs:1-7` |
| recharts (satu-satunya chart lib) | ^3.7.0 | 3.7.0 | `package.json:35` |
| lucide-react (ikon) | ^0.564.0 | - | `package.json:26` |
| react-dnd, react-dnd-html5-backend | ^16.0.1 | - | `package.json:32-33` |
| formidable, @types/formidable | ^3.5.4 / ^3.4.6 | - | `package.json:21-22` |
| jsonrepair | ^3.15.0 | - | `package.json:25` (dipakai `src/app/information-library/page.tsx:46`) |
| googleapis, grammy | ^171.4.0, ^1.44.0 | - | `package.json:23-24` |
| vitest | ^4.1.11 | 4.1.11 | `package.json:49` |
| typescript | ^5 | 5.9.3 | `package.json:48` |
| Node runtime (mesin ini) | - | v24.18.0; Python 3.14.7 | `node --version`, `python --version` |

Tidak ada di `package.json` (diverifikasi dengan membaca seluruh berkas, 52 baris): library editor rich-text/markdown, library DOCX/PDF/XLSX/PPTX, puppeteer/playwright, sharp/canvas, library validasi (zod/yup). `zod` 4.3.6 ada di `node_modules` hanya sebagai dependensi transitif dev (`package-lock.json:10483-10487`, `"dev": true`), tidak dideklarasikan di `package.json` dan tidak diimpor di `src` (`grep -rn "from ['\"]zod" src` kosong).

Scripts npm (`package.json:5-17`): `dev`, `build` (= `prisma generate && next build`), `start`, `lint`, `db:push`, `db:migrate`, `db:studio`, `db:seed` (`npx tsx prisma/seed.ts`), `test` (`vitest run`), `test:watch`.

tsconfig (`tsconfig.json:1-44`): `strict: true`, `moduleResolution: bundler`, `jsx: react-jsx`, `target: ES2017`; path alias tunggal `@/*` -> `./src/*` (`tsconfig.json:25-29`). `include` mencakup `**/*.ts`, `**/*.tsx`, `**/*.mts` (`tsconfig.json:31-40`).

next.config.ts (`next.config.ts:1-36`):
- `typescript.ignoreBuildErrors: true` (baris 12-14; komentar baris 9-11: 19 error tipe warisan di halaman UI).
- `experimental.serverActions.bodySizeLimit: "4mb"` (baris 15-19).
- `images.unoptimized: false` (baris 6-8); `output: undefined` (baris 5).
- Redirect permanen `/memory-wiki` dan `/memory-wiki/:path*` ke `/information-library` (baris 20-33).

hq-server.mjs (`hq-server.mjs:1-43`):
- Port: `parseInt(process.env.HQ_PORT || "9011", 10)` (baris 16); `HQ_PORT` tidak ada di `.env` (diverifikasi) sehingga default 9011.
- Host: `process.env.HQ_HOSTS || "0.0.0.0"` (baris 19; komentar baris 2-8, HQ-BIND-002).
- TLS: membaca `certs/hq-key.pem` dan `certs/hq-cert.pem` (baris 20-21, 34-35); bila ada keduanya memakai `createHttpsServer`, jika tidak HTTP biasa (baris 38). Direktori `certs/` berisi `hq-cert.pem` dan `hq-key.pem` (`ls certs`). `*.pem` ada di `.gitignore`.
- `process.env.NODE_ENV = "production"` dipaksa (baris 14); `next({ dev: false ... })` (baris 23).
- `NEXTAUTH_URL` di `.env` berorigin `https://localhost:9011`.

Nama variabel di `.env` (nilai tidak dicetak): `DATABASE_URL`, `POSTGRES_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_EMAILS`, `NEXT_PUBLIC_BASE_URL`, `HERMES_BOARD`, `HERMES_BIN`, `HERMES_WIKI`, `BRIEF_HOUR`, `INTERNAL_API_SECRET`, `CRON_SECRET`, `WEBUI_RBAC_TOKEN`, `SHARED_WORKSPACE`. Variabel tambahan hanya di `.env.example` (nama saja): `NEXT_PUBLIC_OWNER_NAME`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `XAI_API_KEY`, `BRAVE_API_KEY`, `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`, `TWITTER_BEARER_TOKEN`, `NOTION_API_KEY`, `CLIENT_PULSE_ADMIN_SECRET`, `HL_WALLET`. Berkas lain: `.env.bak-prod`, `.env.example`.

Konfigurasi lain: `vercel.json:1-4` (region iad1, satu cron `/api/cron/x-stats`); `.vercelignore` meng-ignore `scanner/`, `data/`, `scripts/`, `prisma/migrations/`, `.env*`.

### 2.2 Struktur `src/` (kategori 2)

Isi `src/`: `app/`, `components/`, `lib/`, `middleware.ts`, `types/` (`types/next-auth.d.ts`).

**Halaman (`src/app/**/page.tsx`, 21 berkas)**. Tujuan satu baris diambil dari `<h1>`/komentar/nama komponen; kolom "baris" = jumlah baris berkas.

| Route | Berkas | Baris | Tujuan |
|---|---|---|---|
| `/` | `src/app/page.tsx` | 588 | Dashboard (`Dashboard`) |
| `/login` | `src/app/login/page.tsx` | 107 | Form username/password (login terpadu) |
| `/brahma` | `src/app/brahma/page.tsx` | 941 | Control hub Swarm (dispatch, approval, runs, briefing) |
| `/tasks` | `src/app/tasks/page.tsx` | 305 | Papan task (mirror HermesTask) |
| `/orchestration` | `src/app/orchestration/page.tsx` | 918 | Graf + timeline interaksi lintas profil |
| `/dispatch-kpi` | `src/app/dispatch-kpi/page.tsx` | 141 | KPI kesehatan dispatch |
| `/x`, `/x-content`, `/x-analytics` | `src/app/x/page.tsx` (75), `x-content/page.tsx` (981), `x-analytics/page.tsx` (250) | - | Konten dan analitik X |
| `/content-os` | `src/app/content-os/page.tsx` | 519 | Pipeline konten |
| `/articles` | `src/app/articles/page.tsx` | 2401 | Penyusun dan penerbit artikel ("Compose & publish") |
| `/longform` | `src/app/longform/page.tsx` | 969 | Skrip longform |
| `/youtube` | `src/app/youtube/page.tsx` | 879 | Ide/skrip YouTube |
| `/client-pulse` | `src/app/client-pulse/page.tsx` | 206 | Papan kesehatan klien |
| `/agents` | `src/app/agents/page.tsx` | 371 | Roster agen ("Your AI Team") dan chat |
| `/user-access` | `src/app/user-access/page.tsx` | 281 | Manajemen user RBAC |
| `/information-library` | `src/app/information-library/page.tsx` | 2972 | Information Library (browse, Ask Librarian, Propose) |
| `/memory-wiki` | `src/app/memory-wiki/page.tsx` | 886 | Halaman lama; di-redirect ke `/information-library` (`next.config.ts:20-33`) |
| `/ideas` | `src/app/ideas/page.tsx` | 411 | Papan ide |
| `/garden` | `src/app/garden/page.tsx` | 258 | "Our Garden" |
| `/watchlist-radar` | `src/app/watchlist-radar/page.tsx` | 166 | Watchlist radar |

**Route API (`src/app/api/**/route.ts`, 75 berkas)**. Kolom "metode" diekstrak dari `export async function`; "guard" = jumlah kemunculan teks `requireSession` di berkas (0 = tidak ada guard level-route, hanya middleware, kecuali ditandai).

| Route | Metode | Guard | Tujuan |
|---|---|---|---|
| `/api/agent-bus` | GET POST PATCH | 3 | Pesan antar-agen (`AgentBusMessage`) |
| `/api/agent-chat` | POST | 2 | Chat ke profil Hermes via CLI `execFile` |
| `/api/agents` | GET POST | 2 | Roster agen dari disk (`src/lib/agent-roster.ts`) + user WebUI |
| `/api/articles` (+ `generate-article`, `generate-qt`, `generate-titles`, `generate-visuals`, `revise`, `saved-titles`, `scrape`) | beragam | 2-4 | CRUD dan generator artikel (`Article`, `SavedTitle`) |
| `/api/auth/[...nextauth]` | - | 0 | NextAuth (Google OAuth) |
| `/api/auth/login` | POST | 0 | Login username/password -> cookie `gsp_hq_session` |
| `/api/auth/logout` | POST | 0 | Hapus cookie sesi |
| `/api/auth/me` | GET | 0 | Identitas sesi saat ini |
| `/api/brahma/activity`, `/cost`, `/health`, `/dispatch-kpi`, `/tasks`, `/requests` | GET | 0 | Feed aktivitas, biaya, kesehatan, KPI, kartu kanban, daftar AgentRequest |
| `/api/brahma/briefing`, `/briefing/settings`, `/crons` | GET POST/PUT | 2 | Brief harian, pengaturan, cron |
| `/api/brahma/dispatch` | POST | 2 | Buat `AgentRequest` (jalur utama agent/UI) |
| `/api/brahma/memory` | GET POST | 2 | Wiki (GET) dan usulan library (POST -> librarian) |
| `/api/brahma/requests/[id]` | GET PATCH | 2 | Detail request; PATCH approve/reject/edit/force-done/request-changes |
| `/api/brahma/rbac`, `/rbac/login`, `/rbac/signup`, `/rbac/users/[id]` | GET POST PATCH DELETE | 0 (dijaga `x-rbac-token`) | Jembatan RBAC untuk WebUI Brahma (port 9012) |
| `/api/cache/clear`, `/api/cron/x-stats` | POST/GET | 0 | Utilitas cache dan cron |
| `/api/client-pulse`, `/client-pulse/map-chat` | GET / POST | 0 | Papan klien; pemetaan chat Telegram |
| `/api/garden` | GET PUT | 3 | Garden (GET publik; PUT butuh sesi) |
| `/api/home` | GET | 0 | Data dashboard |
| `/api/ideas` | GET POST PUT DELETE | 4 | Papan ide |
| `/api/information-library` | GET | 0 | Daftar/cari entri IL gabungan (wiki+workspace+vault) |
| `/api/information-library/file` | GET | 0 | Sajikan file mentah dari workspace atau wiki |
| `/api/information-library/ask` | POST | 2 | Ask Librarian (dispatch ke `gsp-librarian`, kind `instant`) |
| `/api/information-library/propose` | POST | 2 | Usulan knowledge ke librarian |
| `/api/information-library/propose/upload` | POST | 2 | Unggah lampiran ke `<SHARED_WORKSPACE>/library/proposals/raw/<token>/` |
| `/api/longform`, `/longform/generate`, `/longform/tweak` | beragam | 2-3 | Skrip longform |
| `/api/orchestration` | GET POST DELETE | 3 | Telemetri orkestrasi (`OrchestrationRecord`) |
| `/api/score`, `/scrape-metrics`, `/trends`, `/trends/snipe`, `/watchlist-radar`, `/x-analytics` | GET/POST | 0-2 | Skor, metrik, tren, radar, analitik |
| `/api/tasks` | GET POST PATCH | 3 | Task (Notion/mock) |
| `/api/user-access`, `/user-access/[id]` | GET POST / PATCH DELETE | 2-3 | Manajemen user RBAC dari UI HQ |
| `/api/x-content` (+ `calendar`, `feedback`, `generate-visual`, `mark-posted`, `request`, `top-tweets`, `tweak`, `viral-score`, `visual`) | beragam | 0-4 | Draf konten X |
| `/api/youtube` (+ `generate`, `ideas`, `ideas/dismiss`, `ideas/generate`, `ideas/update`, `outliers`, `performance`, `scripts`), `/api/youtube-scrape` | beragam | 0-3 | Ide/skrip YouTube |

Sumber tabel: Glob `src/app/api/**/route.ts` dan loop `grep` atas `export async function`/`requireSession` (dijalankan 2026-10-22). Perhatian dokumen: `docs/API-REFERENCE.md:61` menulis `PUT` untuk `/api/brahma/requests/[id]`, sedangkan kode mengekspor `PATCH` (`src/app/api/brahma/requests/[id]/route.ts:17`).

**Komponen bersama (`src/components/`)**: `sidebar.tsx` (241 baris), `conditional-layout.tsx` (36), `command-palette.tsx` (341), `breadcrumbs.tsx`, `user-chip.tsx`, `brand-guard.tsx`, `approval-inbox.tsx`, `brahma-briefing.tsx`, `brahma-dispatches.tsx`, `brahma-runs.tsx`, `OfficeView.tsx`, `OutlierFeed.tsx`, `HLPnlChart.tsx`, `donut-chart.tsx`, `sparkline.tsx`, dan `ui/kit.tsx`, `ui/metric-card.tsx`, `ui/paged.tsx`.
- `ui/kit.tsx` mengekspor: `useCountUp` (13), `rise` (40), `Eyebrow` (45), `SectionHeader` (50), `Panel` (80), `Delta` (109), `Button` (145), `Skeleton` (177), `EmptyState` (182), `Pill` (206). `ui/paged.tsx`: `PAGE_SIZE=10` (10), `usePaged` (25), `PagedBar` (53), `PagedLoadMore` (103). `ui/metric-card.tsx`: `MetricCard` (49).
- Token desain CSS di `src/app/globals.css:172-216` (`--bg #0a0b0d`, `--surface-1..3`, `--line`, `--text..-4`, `--accent #6ea8fe`, `--up/--down/--warn`, `--r-sm/md/lg`). Root layout memakai font Geist dan kelas `dark` (`src/app/layout.tsx:6-7,27-28`).

**Bagaimana menu baru ditambahkan (fakta kode)**:
- Menu sidebar adalah array statis `navGroups` di `src/components/sidebar.tsx:27-63`, empat grup: Overview, Content, Data, System; setiap item `{ href, label, icon }` dengan ikon dari `lucide-react` (impor baris 7-25). Entri Information Library ada di baris 58 (grup System). Penanda aktif: `pathname === item.href || pathname.startsWith(item.href + "/")` (baris 178-179). Blok sub-anchor opsional dibaca dari properti `anchors` pada grup (baris 201-217); tidak ada grup yang mendefinisikannya saat ini.
- Tab bawah mobile adalah array terpisah `mobileTabsRaw` berisi 5 item (`sidebar.tsx:66-72`).
- Command palette memiliki daftar navigasi sendiri `NAV` sepuluh item (`src/components/command-palette.tsx:35-44`); Information Library, Orchestration, User Access tidak ada di daftar itu (grep `information-library` di berkas itu kosong).
- Pembungkus layout: `ConditionalLayout` merender `Sidebar` + `<main>` + `CommandPalette` untuk semua path kecuali `/login` (`conditional-layout.tsx:8-36`).
- Halaman baru = berkas `src/app/<nama>/page.tsx`; middleware matcher mencakup semua path selain `_next/static`, `_next/image`, `favicon.ico` (`src/middleware.ts:121-123`).

**Lib (`src/lib/*`, 9 berkas)**:

| Berkas | Isi | Sitasi |
|---|---|---|
| `prisma.ts` | Singleton `PrismaClient` (cache global di non-production) | `prisma.ts:1-9` |
| `auth.ts` | `authOptions` NextAuth: JWT, Google provider, allowlist `ALLOWED_EMAILS`, `pages.signIn=/login` | `auth.ts:7-43` |
| `hq-session.ts` | Cookie sesi HMAC `gsp_hq_session`, `createSessionToken`, `readSessionToken`, `getRequester` | `hq-session.ts:16-109` |
| `require-session.ts` | `requireSession(req)` guard level-route | `require-session.ts:32-73` |
| `webui-rbac.ts` | `rbacTokenOk`, `hashPassword`/`verifyPassword` (scrypt), `USERNAME_RE`, `publicUser` | `webui-rbac.ts:14-68` |
| `agent-roster.ts` | Roster agen dari folder profil Hermes di disk; label peran per profil (mis. `gsp-document-writer`: "Produksi PDF, DOCX, XLSX, PPTX") | `agent-roster.ts:89,107` |
| `fetch-url-content.ts` | Pengambil konten URL | berkas utuh |
| `garden-public.ts` | Proyeksi whitelist data garden publik | `tests/unit/garden-public.test.ts` |
| `google-creds.ts` | Kredensial Google | berkas utuh |

### 2.3 Prisma schema lengkap (kategori 3)

Berkas: `prisma/schema.prisma` (606 baris). Generator `prisma-client-js` dengan `binaryTargets = ["native", "linux-arm64-openssl-3.0.x"]` (baris 1-4); datasource `postgresql`, `url = env("DATABASE_URL")` (baris 6-9). 33 model + 1 enum (`grep -c "^model "` = 33). Migrasi di `prisma/migrations/`: `0_init`, `20260831120000_webuiuser_hermesprofile_unique`, `20260927154000_add_ilsearchdoc`, `20260927170000_agentrequest_requestedby_backfill`, plus `migration_lock.toml`.

Daftar semua model (field kunci dan relasi):

| # | Model (baris) | Field kunci | Relasi |
|---|---|---|---|
| 1 | Account (11) | id cuid, userId, provider, providerAccountId, tokens | -> User (cascade) |
| 2 | Session (29) | sessionToken unik, userId, expires | -> User |
| 3 | User (37) | id cuid, email unik | accounts[], sessions[] |
| 4 | VerificationToken (47) | identifier, token unik, expires | - |
| 5 | Draft (55) | id uuid, text, status, viralScore Json, visualUrl, tweetId, engagementTier | - |
| 6 | TweetMetric (95) | draftId, checkpoints Json | (tanpa relasi Prisma) |
| 7 | Idea (107) | title, category, type, status | - |
| 8 | ContentCalendar (121) | week unik, data Json | - |
| 9 | YoutubeIdea (127) | title, hook, status, competitionData Json | - |
| 10 | YoutubeScript (145) | title, fullScript, seo*, status | - |
| 11 | YoutubeFeedback (174) | title, reason | - |
| 12 | LongformScript (182) | title, fullScript, platforms Json, metrik, status | - |
| 13 | AgentState (217) | id (string), status, currentTask, recentActivity Json | - |
| 14 | AgentBusMessage (231) | fromAgent, toAgent, type, content, metadata Json, read | - |
| 15 | OrchestrationRecord (249) | runId, fromAgent, toAgent, kind, status, taskId, taskTitle, message, **artifactPath**, meta Json | - |
| 16 | BattleRoyaleBot (272) | id, state Json | - |
| 17 | ContentRequest (278) | prompt, status, resultDraftIds Json | - |
| 18 | DataStore (289) | key (PK), data Json | - |
| 19 | Brief (297) | date unik, content Text | - |
| 20 | Mission (307) | agentId, title, description Text, status, priority, result Text | - |
| 21 | Article (324) | title, body Text, track, status, **heroImageHtml Text**, heroImageUrl | - |
| 22 | SavedTitle (350) | title, track | - |
| 23 | ClientPulseClient (362) | notionPageId unik, clientName, services Json | chats[], analyses[], alerts[] |
| 24 | ClientPulseChat (384) | telegramChatId unik, linkedClientId | -> Client (SetNull); messages[], alerts[] |
| 25 | ClientPulseMessage (402) | telegramMessageId, text, sentAt, intent | -> Chat (SetNull) |
| 26 | ClientPulseAnalysis (426) | clientId, skor, category, evidence Json | -> Client (cascade) |
| 27 | ClientPulseAlert (451) | clientId, chatId, severity, reason | -> Client, Chat (SetNull) |
| 28 | **AgentRequest** (478) | lihat blok di bawah | - |
| 29 | AgentEvent (505) | kind, title, agent, level, meta Json | - |
| 30 | **HermesTask** (518) | id (task Hermes), board, assignee, status | - |
| 31 | **HermesMemory** (534) | id slug, path, type, tags[], links[], body | - |
| 32 | **IlSearchDoc** (564) | id, source, path, title, body, domain, project, type, tsv | - |
| 33 | **WebUiUser** (589) + enum Role (584) | username unik, passwordHash, role, hermesProfile unik | - |

Hanya 3 model punya relasi Prisma eksplisit: grup NextAuth (Account/Session/User) dan grup ClientPulse. Tidak ada relasi Prisma antara `AgentRequest`, `HermesTask`, `OrchestrationRecord`, `HermesMemory`, `IlSearchDoc`, `WebUiUser`; hubungan antar-tabel lewat kolom string (`hermesTaskId`, `taskId`, `runId`, `requestedBy`).

Drift DB terhadap schema (query read-only `pg_tables` pada `gsp_agent_hq_v21`, 2026-10-22): DB memiliki 34 tabel domain + `_prisma_migrations`; tabel `WorkerTrace` ada di DB tetapi TIDAK ada di `schema.prisma` dan tidak muncul di repo (`grep -rn WorkerTrace` kosong). Kolom `WorkerTrace`: `id text, task_id text, profile text, started_at timestamp, ended_at timestamp, outcome text, source text`. Migrasi terapan di DB: keempat nama di atas. Jumlah baris saat diukur: AgentRequest 757, HermesMemory 878, IlSearchDoc 18186, WebUiUser 9, HermesTask 2680, OrchestrationRecord 681, WorkerTrace 1488.

Peringatan dalam schema: `IlSearchDoc` dilarang `prisma db push` (`schema.prisma:554-563`), perubahan lewat migrasi SQL baru. `docs/ARCHITECTURE.md:118` dan `docs/DATA-MODEL.md:4,134` menyatakan "tanpa folder migrations / pakai db push", sedangkan folder `prisma/migrations/` ada dengan 4 migrasi.

**Blok model relevan (kutipan apa adanya)**

`AgentRequest` (`prisma/schema.prisma:478-503`):

```prisma
model AgentRequest {
  id            String    @id @default(cuid())
  origin        String    @default("web")     // "web" | "hermes"
  // FIX 02-09-2026 (temuan #4): inisiator sebenarnya. Username login utk jalur
  // browser ("user:<u>"), id agen utk dispatch antar-profil. Null = belum
  // tercatat (data lama) -> telemetri fallback ke "brahma".
  requestedBy   String?
  kind          String    @default("oneshot") // "oneshot" | "kanban" | "chat" | "instant" (Ask Librarian: hasil langsung done, tanpa review gate)
  title         String
  prompt        String?
  profile       String?                       // target Hermes profile (gsp-*) — null = default/brahma
  sideEffecting Boolean   @default(false)
  status        String    @default("queued")  // queued | awaiting_approval | approved | running | done | failed | rejected
  result        String?
  error         String?
  hermesTaskId  String?
  decidedAt     DateTime?
  startedAt     DateTime?
  finishedAt    DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([status])
  @@index([createdAt])
  @@index([profile])
}
```

`HermesTask` (`prisma/schema.prisma:518-531`):

```prisma
model HermesTask {
  id        String   @id                   // Hermes task id
  board     String   @default("default")
  title     String
  assignee  String?
  status    String   @default("todo")
  priority  Int?
  result    String?
  updatedAt DateTime @default(now())
  syncedAt  DateTime @updatedAt

  @@index([board])
  @@index([status])
}
```

`AgentEvent` (`prisma/schema.prisma:505-516`):

```prisma
model AgentEvent {
  id        String   @id @default(cuid())
  kind      String   @default("activity") // activity | run | status | memory
  title     String
  detail    String?
  agent     String?
  level     String   @default("info")     // info | up | warn | down
  meta      Json?
  createdAt DateTime @default(now())

  @@index([createdAt])
}
```

`OrchestrationRecord` (`prisma/schema.prisma:249-270`):

```prisma
model OrchestrationRecord {
  id           String   @id @default(uuid())
  runId        String?                       // pengelompok satu run orkestrasi (opsional)
  fromAgent    String                        // id profil pengirim (mis. gsp-master-controller / brahma)
  toAgent      String                        // id profil penerima
  kind         String   @default("delegate") // delegate | handoff | verify | report | review | gate | dispatch
  status       String   @default("running")  // running | done | blocked | needs-review | failed | rejected
  taskId       String?                       // id task/request (mis. id AgentRequest)
  taskTitle    String?                       // judul tugas singkat
  message      String?                       // catatan singkat / ringkasan hasil
  artifactPath String?                       // path artefak docs/[date]_[task]/... (Documentation Contract)
  meta         Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([fromAgent])
  @@index([toAgent])
  @@index([status])
  @@index([kind])
  @@index([runId])
  @@index([createdAt])
}
```

`Mission` (`prisma/schema.prisma:307-320`; model bernama "Mission", tidak ada pemakaian di `src/` maupun `bridge.mjs` per grep):

```prisma
model Mission {
  id          String   @id @default(uuid())
  agentId     String
  title       String
  description String   @db.Text
  status      String   @default("pending") // pending, active, completed, failed
  priority    String   @default("medium") // high, medium, low
  result      String?  @db.Text
  createdAt   DateTime @default(now())
  completedAt DateTime?

  @@index([agentId])
  @@index([status])
}
```

`DataStore` (`prisma/schema.prisma:289-293`):

```prisma
model DataStore {
  key       String   @id
  data      Json
  updatedAt DateTime @updatedAt
}
```

`HermesMemory` (`prisma/schema.prisma:534-552`):

```prisma
model HermesMemory {
  id         String    @id            // wiki entry slug (relative path w/o .md)
  path       String                   // file path relative to wiki root
  type       String    @default("fact")
  title      String
  status     String    @default("active")
  confidence String?
  provenance String?
  tags       String[]
  links      String[]
  body       String    @default("")
  validFrom  DateTime?
  validTo    DateTime?
  updatedAt  DateTime  @default(now())
  syncedAt   DateTime  @updatedAt

  @@index([type])
  @@index([status])
}
```

`IlSearchDoc` (`prisma/schema.prisma:564-578`; komentar 554-563 memuat larangan `db push`):

```prisma
model IlSearchDoc {
  id        String   @id // wiki: slug HermesMemory; workspace/vault: prefix ws:/vault: + path relatif
  source    String // wiki | workspace | vault
  path      String
  title     String
  body      String   @default("")
  domain    String?
  project   String?
  type      String   @default("note")
  status    String   @default("active")
  rank      Int      @default(3)
  updatedAt DateTime @default(now()) @db.Timestamptz(6)
  syncedAt  DateTime @default(now()) @db.Timestamptz(6)
  tsv       Unsupported("tsvector")?
}
```

Indeks DB di luar Prisma (`prisma/migrations/20260927154000_add_ilsearchdoc/migration.sql`): kolom `tsv` generated `to_tsvector('simple', title || ' ' || body)`, indeks GIN `ilsearchdoc_tsv_gin`, `ilsearchdoc_trgm_body`, `ilsearchdoc_trgm_title` (extension `pg_trgm`), `ilsearchdoc_source_idx`.

`WebUiUser` + `Role` (`prisma/schema.prisma:584-606`):

```prisma
enum Role {
  ADMINISTRATOR
  USER
}

model WebUiUser {
  id            String   @id @default(cuid())
  username      String   @unique
  passwordHash  String
  displayName   String?
  role          Role     @default(USER)
  // W3.1 (F-ARCH-003, 31-08): satu profil Hermes = satu akun. Unique ditegakkan
  // di LEVEL DATABASE (@@unique di bawah), bukan hanya app code. (komentar lanjutan dipersingkat di sini; lihat berkas)
  hermesProfile String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([role])
  @@unique([hermesProfile])
}
```

`Article` (kolom HTML artifact existing, `prisma/schema.prisma:324-348`, kutipan field relevan): `heroImageUrl String?` (332), `heroImageHtml String? @db.Text` (333), `body String @db.Text` (327).

### 2.4 Information Library: model misi/kontrak/task (kategori 4)

**Fakta inti**: IL tidak memiliki tabel DB untuk "misi/kontrak/task". Entri IL dibentuk saat request GET dari tiga sumber (`src/app/api/information-library/route.ts:181-187`): `wiki` (DB `HermesMemory`), `workspace` (file di folder `SHARED_WORKSPACE`), `vault` (file markdown staging di `<SHARED_WORKSPACE>/vault`). Tabel `IlSearchDoc` adalah mirror FTS (data turunan) yang hanya dipakai untuk menyaring kandidat pencarian (`route.ts:203-249`); sync-nya dilakukan skrip di luar repo (`C:\Users\TRIAL\workspace\gsp-hermes\workspace\scripts\il_ingest\sync_index.py`, docstring baris 1-28; menolak menulis DB produksi tanpa `--allow-production`).

`GET /api/information-library` (`route.ts:188-589`):
- Parameter: `q`, `scope` (`all|wiki|workspace|vault|archive`, default `all`), `type`, `status` (default `active`), `domain`, `project` (`route.ts:190-195`).
- Respons: `{ entries, domainCounts, projectCounts, typeCounts, statusCounts, total, lastSync }`, header `Cache-Control: no-store` (`route.ts:585-588`).
- Root workspace: `process.env.SHARED_WORKSPACE || "/Users/mbp/workspace/gsp-hermes/workspace"` (`route.ts:82-83`). Direktori diabaikan walker: `node_modules .git .next dist build .cache __pycache__ .venv venv vault` (`route.ts:85-96`). Walker markdown `walkMd` (106-131) hanya `.md/.markdown/.mdx`; `walkFiles` (133-159) semua ekstensi.
- Entri dokumen markdown: `id = ws-<path-slug>`, `type = inferType(rel)`, `domain/project = classifyPath(rel)`, `provenance = "shared-workspace"`, body dipotong 6000 karakter, `source: "workspace"` (`route.ts:340-358`).
- **Entri folder misi** (`route.ts:361-444`): untuk setiap subfolder langsung di `<SHARED_WS>/docs/` yang berisi minimal satu file non-markdown, dibuat satu entri sintetis `id = ws-docs-<dir>`, `path = docs/<dir>/`, `type = "project"`, `title = "📁 <nama tanpa prefix tanggal>"`, `files = [daftar path non-md]`, body berisi daftar maksimal 60 file dengan ukuran KB.
- `classifyPath(rel)` (`route.ts:628-676`): `docs/<YYYY-MM-DD>_<slug>/...` -> `{ domain: "operations", project: <slug tanpa prefix tanggal> }` (baris 668-671); `docs/01_DOMAIN/<d>/` -> domain `<d>`; `docs/00_INDEX` -> `core`; `docs/02_PROJECT` -> `docs`; `docs/03_REFERENCE` -> `reference`; `vault/<seg>/...` -> `{ domain: "library", project: <seg> }` (637-640); `ekas/` -> `engineering`; `memory/` -> `operations`; `legacy-archive/` -> `legacy`; `agents.md`/`memory.md` -> `core`.
- `inferType(rel)` (`route.ts:591-623`): folder bertanggal berakhiran `/` -> `project`; dokumen di dalam project -> `document`; path berisi `lesson|refs` -> `lesson`; berisi `decision` -> `decision`; `memory/` -> `note`; `docs/03_reference` -> `reference`; default `note`. Tipe di UI: `src/app/information-library/page.tsx:49-63` (`MemType`).
- `entryRank` (`route.ts:681-700`): wiki 0, vault 1, docs dengan kata insight/final/ringkasan/dst. 1, docs lain 2, memory 3, legacy-archive 4.
- Vault (`route.ts:447-520`): membaca `.md` di `vault/` dengan frontmatter satu-baris `key: value` (`parseFm`, 165-175); kolom dipakai: `title`, `type`, `status` (default `usulan`), `domain`, `tags`, `perkara`, `sumber`, `sensitif`, `kelas_bukti`, `halaman`, `di-attest-oleh`, `catatan_keputusan` (493-517). `project = classifyPath(...).project || fm.perkara`.
- Domain wiki: ditebak dari tag HermesMemory lewat alias (`defense-intel, corporate, digital, engineering, operations, library`), fallback `wiki` (`route.ts:271-291`).

Cara entri di-tag domain/project/type (ringkasan fakta): dihitung dari path folder (workspace/vault) atau tag (wiki), bukan disimpan di kolom DB milik misi. Registry domain resmi di `C:\Users\TRIAL\workspace\gsp-hermes\workspace\docs\standards\01_ORGANIZATION-STANDARD.md:107-119` (`engineering, defense-intel, corporate, digital, operations, library`). Skema frontmatter wajib di `docs/standards/02_METADATA-STANDARD.md:26-55` (kunci: `title, type, status, created, updated, writer, editor, version, domain, project, tags, sumber, halaman, tanggal_akses, kelas_bukti, links, supersedes, superseded-by`; opsional vault/wiki: `id, sensitif, perkara, catatan_keputusan, di-attest-oleh, di-attest-pada, dipromosikan-ke, persetujuan-ref, verifikasi-oleh`). Tipe vault valid menurut prompt propose: `vendor, produk, standar, proyek, dosir, catatan, keputusan, pelajaran, fakta` (`src/app/api/information-library/propose/route.ts:87`).

Halaman IL (`src/app/information-library/page.tsx`, 2972 baris, client component): memanggil `GET /api/information-library?...` dengan polling tiap 10 detik (`page.tsx:2352-2387`), `POST /api/information-library/ask` (`1955`), `POST /api/information-library/propose` (`2215`), `POST /api/information-library/propose/upload` (`1466`), `POST /api/brahma/memory` (`764`, editor entri). Komponen internal: `Markdown` (335), `EntryCard` (435), `EntryEditor` (722), `AskPanel` (1104), `ProposePanel` (1380), `GroupCard` (2881), `FilterChip` (2928). State filter: `scope` (`Scope = all|wiki|workspace|vault|archive`, baris 103), `typeFilter`, `domainFilter`, `projectFilter`, `vaultStatus` (1842-1847). Tidak ada pratinjau gambar/PDF/DOCX: markdown dirender oleh fungsi `Markdown` buatan sendiri (335-434) tanpa library markdown.

`GET /api/information-library/file?path=<rel>&root=workspace|wiki` (`src/app/api/information-library/file/route.ts:16-50`):
- `root=wiki` -> `HERMES_WIKI` (default `~/.hermes/wiki`), selain itu -> `SHARED_WORKSPACE` (baris 13-19). Nilai `root=vault` yang disebut prompt Ask (`ask/route.ts:30`) tidak ditangani khusus; jatuh ke root workspace.
- Proteksi path traversal: `abs` harus di dalam root, jika tidak 403 (baris 23-28); 404 bila bukan file (29-31).
- Content-Type hanya untuk `.md/.markdown`, `.json`, `.py`, `.csv`, `.txt/.log`; ekstensi lain (termasuk `.png`, `.svg`, `.pdf`, `.docx`, `.html`) -> `application/octet-stream` (baris 35-41). `Content-Disposition: inline` (47). Tanpa `requireSession` di handler (bergantung middleware).

**Struktur folder `docs/<misi>/` di SHARED_WORKSPACE** (`C:\Users\TRIAL\workspace\gsp-hermes\workspace\docs`):
- 761 entri langsung di `docs/` (`ls | wc -l`); 181 folder punya subfolder `identification/`, 449 punya `contract.md` (`ls -d */identification`, `ls -d */contract.md`).
- Standar organisasi (`docs/standards/01_ORGANIZATION-STANDARD.md:60-90`): folder tugas bernama `YYYY-MM-DD_<task-slug>` snake_case (baris 84-85); topologi 3 tingkat WIKI / VAULT (`<ws>/vault/<perkara>/<YYYY-MM-DD>_<slug>.md`) / RAW (46-58); tabel penamaan baris 96-101 (objek vault baris 100). Baris 104 melarang akhiran versi (`_v2`, `_final`) di nama file; baris 86 mengatur siklus hidup folder tugas (arsip setelah selesai dan berumur 30 hari).
- Contoh 1: `docs/2026-10-21_eosda-kajian/` berisi `PHASE-REPORTS.md`, `contract.md`, `decisions/`, `figur/` (`FIG-EOS-1..4.png` + `.svg`), `identification/` (`01_translated.md`, `02_blueprint.md`), `naskah/` (`bagian_A.md`, `bagian_B.md`), `output/` (`EOSDA-KAJIAN-1021.docx`, `.pdf`, `build_rakit.py`, `build-log.txt`, `register_kuantitas.json`, `rail-chips.json`, dll.), `qa/` (JSON hasil cek), `research/`, `verification/`, `work/` (`spek_figur/`, skrip, `k*_body.md`). `contract.md` memuat judul kontrak, kartu kanban, tenant id (`EOSDA-KAJIAN-1021`), tabel "RANTAI & JEJAK DISPATCH", "TABEL KARTU" (kolom Kartu, Id `t_xxxxxxxx`, Judul, Assignee, Parents, LOCK, Status), "GERBANG MENEMPEL", "DECISION LOG" (`contract.md:1-45`). `identification/01_translated.md:1-12` memakai kunci `task_id`, `tanggal`, `kanal_keluaran`, `REKOMENDASI_SKALA`, `KELAS`, `MODE`; `02_blueprint.md:1-20` memuat frontmatter `task_id, task_slug, date, agent, tiering, source_translated_task, status, KELAS, MODE, PLAFON_DOK`.
- Contoh 2: `docs/2026-10-21_adint-gsdi-transcript-brief/` berisi `PHASE-REPORTS.md`, `contract.md` (tabel butir, tabel kartu `t_...`), `fig/` (`dia/`, `gra-tab/`), `identification/` (`01_translated.md`, `02_structured.md`, `02_variant-twin-arsip.md`), `naskah/` (5 berkas per bab/lampiran), `output/` (`ADINT-GSDSI-BRIEF-1021-Transcript-Brief.docx`, `.pdf`), `research/` (3 berkas), `verification/` (4 berkas), `work/` (`build_rakit.py`, `build_log.txt`, `card*.md`).
- Contoh 3: `docs/2026-10-22_cabut-batas-minimum-panjang/` berisi `PHASE-REPORTS.md`, `contract.md` (Decision Log D-01..D-06 dan tabel 15 kartu), `identification/` (`01_translated.md`, `02_structured.md`), `work/` (`AUDIT-FINAL.md` dan lain-lain).
- Contoh tambahan dengan bukti: `docs/2026-10-19_nearlink-research-plan/` (`contract.md`, `evidence/`, `identification/`, `masterplan/`).
- Pola: `contract.md` di akar folder misi, `identification/` berisi `01_*` dan `02_*`, keluaran akhir (DOCX/PDF) di `output/`, gambar di `figur/` atau `fig/`, folder `PHASE-REPORTS.md` di akar. Pola ini tidak seragam antar folder (nama subfolder bervariasi: `figur` vs `fig`, `naskah`, `work`, `qa`, `evidence`).
- Hook dan konvensi repo HQ sendiri: folder tugas di repo HQ memakai `docs/YYYY-MM-DD[-_]<slug>/` (`docs/2026-08-30-login-terpadu-hq/contract.md`, `docs/2026-10-22_doc_artifact_studio/`).
- Skill DATUM yang direncanakan dipakai ulang berada di `C:\Users\TRIAL\workspace\gsp-hermes\skills\datum-house-style\` (salinan runtime: `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\datum-house-style`): `datum_docx.py`, `datum_pptx.py`, `datum_xlsx.py`, `datum_diagram.py`, `datum_figur.py`, `datumcheck.py`, `datumbind.py`, `datumsimbol.py`, `pustakachart.py`, `pustakachart_data.py`, `embed_fonts.py`, `tokens.json`, `SKILL.md`, `scripts/datumbuku.py`, `scripts/datum_lint.py`, fixture JSON `fixtures_diagram/` dan selftest `selftest_*.py` (`ls`).

Alur tulis IL yang ada (semua melalui agen, bukan tulis langsung dari HQ):
- `POST /api/information-library/propose` membuat `AgentRequest` untuk profil `gsp-librarian` dengan prompt panjang yang memerintahkan pipeline vault: `vault_propose.py` -> verifikasi `gsp-custodian` -> `vault_promote.py` (`propose/route.ts:72-111`). `sideEffecting = sensitif` (125). Judul `Kurasi proposa: <title>` (113-116).
- `POST /api/brahma/memory` melakukan hal serupa dan "TIDAK lagi menulis langsung" (`brahma/memory/route.ts:29-34`).
- Satu-satunya tulis file langsung ke workspace dari HQ: `propose/upload` (lihat bagian 2.7).

### 2.5 Auth dan otorisasi (kategori 5)

Tiga identitas diterima (`src/middleware.ts:10-24`): (1) sesi NextAuth Google (JWT), (2) cookie HQ terpadu `gsp_hq_session` (akun `WebUiUser`), (3) header `x-internal-secret` sama dengan `INTERNAL_API_SECRET`.

Urutan di `middleware` (`src/middleware.ts:63-119`):
1. Dev bypass hanya bila `NODE_ENV==='development'` dan `ALLOW_DEV_BYPASS==='1'` (70-75).
2. Lewat tanpa auth: `/api/auth/*`, `GET /api/garden`, `/api/brahma/rbac*`, `/_next/*`, `/favicon.ico`, `/login` (79-90).
3. `x-internal-secret` dibandingkan constant-time (92-104).
4. Cookie `gsp_hq_session` diverifikasi HMAC-SHA256 dengan `NEXTAUTH_SECRET` via Web Crypto (35-61, 106-109).
5. `getToken` NextAuth (111-113).
6. Gagal: `/api/*` -> `401 { error: "Unauthorized" }`, halaman -> redirect `/login` (115-118).
- Matcher: `/((?!_next/static|_next/image|favicon.ico).*)` (121-123).

Guard level-route `requireSession(req)` (`src/lib/require-session.ts:32-73`): urutan NextAuth JWT -> cookie `gsp_hq_session` (`readSessionToken`) -> `x-internal-secret` (constant-time, fail-closed bila env kosong) -> `NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`. Pemakaian: `const denied = await requireSession(req); if (denied) return denied;` (komentar `require-session.ts:22-27`). Handler GET tidak selalu memakainya (kolom guard 0 pada tabel 2.2), misalnya `GET /api/information-library`, `/file`, `/api/brahma/requests`, `/api/brahma/tasks` hanya dijaga middleware.

Sesi HQ (`src/lib/hq-session.ts`): cookie `gsp_hq_session` (16), TTL 24 jam (17), format `base64url(JSON payload) + "." + base64url(HMAC-SHA256)`, payload `{ u: username, r: role, p: hermesProfile, exp }` (12-14, 19-24). `createSessionToken` gagal-tertutup (null) tanpa `NEXTAUTH_SECRET` (39-60). `getRequester(req, agentId)` mengembalikan `user:<username>` bila cookie valid, selain itu `agentId` (maks 80 karakter) atau null (95-109).

Login: `POST /api/auth/login { username, password }` -> verifikasi `WebUiUser` dengan `verifyPassword` (scrypt `salt:hash`), throttle per IP 10 percobaan / 15 menit (`src/app/api/auth/login/route.ts:14-37,56-80`). `GET /api/auth/me` mengembalikan `{ user: { username, role, hermesProfile, displayName } }` (`auth/me/route.ts:9-33`).

RBAC: enum `Role { ADMINISTRATOR, USER }` dan `WebUiUser.hermesProfile` unik (`schema.prisma:584-606`). Peran dicatat di cookie (`r`). Pencarian `grep` atas `ADMINISTRATOR|.role|readSessionToken|getRequester` di `src` menunjukkan tidak ada handler di luar `auth/me` yang membaca peran pemanggil dari sesi untuk membatasi akses; pengecekan `ADMINISTRATOR` ada pada validasi nilai peran saat membuat/mengubah user (`src/app/api/user-access/route.ts:63-64,87`; `user-access/[id]/route.ts:71-91,162-163`; `brahma/rbac/route.ts:36`; `brahma/rbac/users/[id]/route.ts:26-31,56-58`) dan pada roster (`src/app/api/agents/route.ts:87`). Doc `docs/ARCHITECTURE.md:99-100` menulis "akses panel dibatasi"; kontrak `docs/2026-08-30-login-terpadu-hq/contract.md:4` menyebut "role TIDAK membatasi akses halaman dulu (semua yang login = akses penuh)".

Jembatan RBAC WebUI: `/api/brahma/rbac/*` dijaga header `x-rbac-token == WEBUI_RBAC_TOKEN` via `rbacTokenOk` (`src/lib/webui-rbac.ts:14-23`).

Cara agent memanggil API HQ: kirim header `x-internal-secret: <INTERNAL_API_SECRET>` ke `https://localhost:9011/...` (contoh `curl -sk` di prompt Ask Librarian `information-library/ask/route.ts:24-26`; `tests/unit/reject-reason-route.test.ts:23-24` memakai header ini). Untuk request yang lewat `/api/brahma/dispatch`, `getRequester` memakai `agentId` dari body sebagai `requestedBy` (`dispatch/route.ts:22`). Nilai secret tidak dicetak di sini.

### 2.6 Pola API (kategori 6)

Validasi input: manual tanpa library (zod tidak dipakai). Pola yang berulang: `const b = await req.json().catch(() => ({}))`; `(b.field || "").toString().trim()`; batas panjang dengan `.slice(n)` atau tolak 400 (mis. `propose/route.ts:18-23`, `dispatch/route.ts:17-18`, `ask/route.ts:15-18`). Parameter query dibaca dengan `new URL(req.url).searchParams` (mis. `brahma/requests/route.ts:9-14`). Validasi enumerasi dengan array konstanta: `KINDS`, `STATUSES` di `orchestration/route.ts:15-16,96-98`.

Format respons: sukses `NextResponse.json({ ... })`, galat `NextResponse.json({ error: "<pesan>" }, { status: <kode> })` dengan kode 400, 401, 403, 404, 409, 413, 429, 500 (contoh: `file/route.ts:21,27,30`; `brahma/requests/[id]/route.ts:14,38`; `upload/route.ts:47`; `auth/login/route.ts:36-37`). Sebagian route mengembalikan `{ ok: true, record }` (`orchestration/route.ts:101,118,129`). `docs/API-REFERENCE.md:222`: "error standar `{ "error": "…" }`". Route dinamis memakai `export const dynamic = "force-dynamic"` (mis. `propose/route.ts:5`, `file/route.ts:6`). Param route dinamis Next 16: `{ params }: { params: Promise<{ id: string }> }` (`brahma/requests/[id]/route.ts:7,17`).

Contoh POST lengkap yang dipakai agent/UI. Catatan: `/api/brahma/requests/route.ts` hanya mengekspor `GET` (26 baris); POST pembuat request ada di `/api/brahma/dispatch`. Kutipan `src/app/api/brahma/dispatch/route.ts:1-37` apa adanya:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from '@/lib/require-session';
import { getRequester } from "@/lib/hq-session";

// POST { kind?, title, prompt?, profile?, sideEffecting?, hermesTaskId?, agentId? } → queue work for Brahma.
// profile = target Hermes profile id (mis. "gsp-master-controller"); null = default/brahma.
// hermesTaskId = id kartu kanban KONTAK (dari gsp-kanban-contract) — bridge akan
// mengeksekusi & menutup kartu itu (tanpa membuat kartu duplikat).
// agentId (FIX 02-09, temuan #4): utk pemanggil mesin (bridge/skill helper),
// isi id profil pengirim agar telemetri tidak menyamakan semua edge dgn brahma.
// Side-effecting work waits for approval; safe work is queued immediately.
export async function POST(req: Request) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(req);
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const title = (b.title || b.prompt || "").toString().trim();
  if (!title) return NextResponse.json({ error: "title or prompt required" }, { status: 400 });
  const sideEffecting = Boolean(b.sideEffecting);
  const hermesTaskId = b.hermesTaskId ? b.hermesTaskId.toString().trim().slice(0, 80) || null : null;
  const requestedBy = getRequester(req, b.agentId ? String(b.agentId) : null);
  const row = await prisma.agentRequest.create({
    data: {
      origin: "web",
      requestedBy,
      kind: (b.kind || "oneshot").toString(),
      title: title.slice(0, 200),
      prompt: (b.prompt ?? b.title ?? "").toString() || null,
      profile: b.profile ? b.profile.toString().trim().slice(0, 80) || null : null,
      sideEffecting,
      hermesTaskId,
      status: sideEffecting ? "awaiting_approval" : "queued",
    },
  });
  return NextResponse.json({ request: row });
}
```

Route lain yang berguna sebagai pola:
- `PATCH /api/brahma/requests/[id]` (`brahma/requests/[id]/route.ts:17-64`): aksi `approve|reject|edit|force-done|request-changes`; tabel aksi sah per status (31-38); 409 bila aksi tidak sah; `GET` memilih kolom (`select`, 9-12).
- `GET /api/brahma/requests?status=&title=&take=&light=1` (`brahma/requests/route.ts:8-26`): `take` maksimum 200; `light=1` tanpa kolom `result/error/prompt`; respons `{ requests, pending }`.
- `POST /api/orchestration` upsert idempoten dengan `id` atau `runId+from+to+kind` (`orchestration/route.ts:85-146`).
- `POST /api/information-library/propose/upload` untuk multipart/form-data (`req.formData()`; `upload/route.ts:23-59`).
- Siklus status `AgentRequest` hasil kerja agen: `queued -> running -> needs-review` (default untuk oneshot/chat, `bridge.mjs:759-796` dan `semanticStatus` 148-160); `instant` langsung `done` (`bridge.mjs:769,794`); status `done` hanya lewat `PATCH action=force-done` oleh asignor (`bridge.mjs:759-762`). `trimResult` membatasi `result` ke `BRIDGE_RESULT_MAX` (default 200000 karakter; `bridge.mjs:35,634-650`).

### 2.7 Eksekusi proses eksternal dan lokasi keluaran (kategori 7)

**hermes-bridge** (`hermes-bridge/bridge.mjs`, 918 baris, Node ESM, dependensi `pg`; README `hermes-bridge/README.md`):
- Wrapper CLI `hermes(args, { timeout, maxOut })` memakai `spawn(HERMES, args, { windowsHide: true })` dengan hard timeout dan tree-kill `taskkill /PID <pid> /T /F` (`bridge.mjs:60-98`); `HERMES = process.env.HERMES_BIN || "hermes"` (30). `stdout` dibatasi 1 MB default (66-70).
- Env bridge: `HERMES_BOARD`, `BRIDGE_POLL_MS` (5000), `BRIDGE_MIRROR_MS` (30000), `BRIDGE_RUN_TIMEOUT_MS` (default kode 1800000; `launch-bridge.sh:11` dan `launch-bridge-worker2.sh:9` mengekspor 3600000), `BRIDGE_RESULT_MAX` (200000), `HERMES_WIKI`, `BRIEF_HOUR`, `BRIDGE_CARD_POLL_MS` (`bridge.mjs:30-37,296`).
- Antrian: dua lane. `processQueue` mengklaim satu `AgentRequest` berstatus `queued|approved` yang `kind <> 'instant'` dan judul bukan `Ask Librarian%` dengan `FOR UPDATE SKIP LOCKED` (`bridge.mjs:823-839`); `askLane` untuk `kind='instant'` atau judul `Ask Librarian%` (841-862). Loop terdaftar di `main()` (900-918; `setInterval` mirror di 915).
- Eksekusi per `kind` (`bridge.mjs:715-758`): `oneshot|chat|instant` -> `hermes [-p <profile>] -z <prompt>` (718); `kanban` -> `hermes kanban --board <BOARD> create --json <title>` (722-724); `cron.*` -> `hermes cron ...` dengan validasi `safeId/safeSched` (725-745); `memory.write` -> `writeWikiEntry` + git commit di `WIKI_DIR` (746-751); `briefing.generate` (752-755); selain itu error `unknown kind`.
- Untuk request berprofil: `recordOrch` (dispatch edge) dan `setAgentState`, lalu buat atau pakai-ulang kartu kanban (`createKanbanCard` 234-263; dedup `findExistingMissionCard` 202-224 berdasarkan path artefak kontrak yang diekstrak regex `docs|workspace|library|analysis|collection|memory/...\.(md|json|csv|pdf|docx|xlsx|pptx)` di `extractContractPaths` 192-200). Kartu ber-assignee dikerjakan dispatcher Hermes dan bridge hanya menunggu (`awaitCardCompletion` 297-). Detail D1/D2 di komentar 175-191.
- Hard-gate pra-penyampaian: `gateForDelivery` dari `hermes-bridge/gate_transport.mjs` memindai keluaran agen dengan scanner Python sebelum ditulis ke `AgentRequest` (`bridge.mjs:26-27,770-793`; konfigurasi env `BRIDGE_GATE_*` di `gate_transport.mjs:19-39`; kanal default `kanban` bersifat info-only).
- Mirror: kanban -> `HermesTask`, cron/health -> `DataStore`, wiki -> `HermesMemory`, brief -> `Brief`, aktivitas -> `AgentEvent` (`docs/ARCHITECTURE.md:73-79`; fungsi `mirrorKanban` 364, `mirrorWiki` 507).

**Proses eksternal lain dari kode Next.js**:
- `src/app/api/agent-chat/route.ts`: `execFile(HERMES_BIN || 'hermes', ['chat','-q', message] atau ['-p', profile,'chat','-q', message], { timeout: 120_000, maxBuffer: 4*1024*1024 })` (baris 6, 105-117); tabel `PROFILE_MAP` agentId -> profil (14-58) memuat antara lain `gsp-document-writer`, `gsp-document-converter`, `gsp-image-specialist`, `gsp-design-system-specialist`, `gsp-document-controller`.
- `execSync` dengan `curl` ke API eksternal: `src/app/api/youtube/generate/route.ts:11-15` (menulis payload JSON sementara ke `path.join("/tmp", ...)` lalu `curl`), `youtube/ideas/generate/route.ts:15`, `x-content/mark-posted/route.ts:39`, `x-content/tweak/route.ts:29`.
- `src/app/api/agents/route.ts`: membaca file PID di `~/.hermes/gateway-logs/<profil>.pid` dan `~/.hermes/gateway_state.json`, memakai `process.kill(pid, 0)` untuk status hidup (baris 20-50).
- Skrip operasional: `scripts/hq_restart.mjs` (memakai `child_process`), `scripts/verify_login_hq.mjs`, `scripts/seed-webui-admin.mjs`, `scripts/ensure-profile-complete.mjs`, dan beberapa `.py`/`.cjs` verifikasi di `scripts/`.
- Tidak ada pemanggilan Python/render dokumen dari kode Next.js (`grep` `child_process|spawn(|execFile|execSync` di `src`: lima berkas di atas, tidak satu pun Python atau render DOCX/PDF).

**Lokasi penyimpanan file keluaran saat ini**:
- Output agen (hasil DOCX/PDF/figur dst.) ditulis oleh agen/skrip Hermes ke folder misi di workspace: contoh nyata `docs/2026-10-21_eosda-kajian/output/EOSDA-KAJIAN-1021.docx|.pdf`, `figur/*.png|.svg` (path absolut `C:\Users\TRIAL\workspace\gsp-hermes\workspace\docs\...`). HQ tidak menulis file tersebut; HQ hanya membaca/menyajikan lewat `/api/information-library` dan `/file`.
- Upload dari HQ: `<SHARED_WORKSPACE>/library/proposals/raw/<token>/<timestamp>-<namaAman>` (`propose/upload/route.ts:49-56`); ekstensi diizinkan `.pdf .docx .doc .xlsx .xls .pptx .md .txt .csv .jpg .jpeg .png .json` (12-15); batas 25 MB (16); token `^[a-zA-Z0-9-]{8,64}$` (36); `safeName` menormalkan karakter (18-21); default workspace untuk route ini `C:/Users/TRIAL/workspace/gsp-hermes/workspace` (10-11) sedangkan route IL lain default ke `/Users/mbp/workspace/gsp-hermes/workspace` (macOS lama) bila env tidak diset (`route.ts:82-83`, `file/route.ts:13`).
- Gambar visual X: `public/draft-visuals/<draftId>.png|.jpg` (`src/app/api/x-content/visual/route.ts:9,48-55`; validasi `image/png|image/jpeg`, 10 MB, baris 25-34), URL disimpan di `Draft.visualUrl` (58-62). Direktori `public/draft-visuals/` ada.
- Hasil Ask Librarian/proposal/dispatch: kolom `AgentRequest.result` (teks, dipotong 200000 karakter).
- Gate-hold dan keluaran NAT-R3: `./gate-hold` di `hermes-bridge` (default `BRIDGE_GATE_HOLD_DIR`, `gate_transport.mjs:19-39`).
- Direktori `data/` di repo kosong (`ls data`).

### 2.8 Testing (kategori 8)

- Konfigurasi: `vitest.config.ts:10-21`: `include: ['tests/**/*.test.ts']`, `environment: 'node'`, `fileParallelism: false`, alias `@` -> `./src`. Komentar baris 4-9: suite `tests/unit/**` (murni) dan `tests/smoke/**` (probe HTTPS ke HQ live `127.0.0.1:9011`, auto-skip bila HQ mati).
- Jumlah (diukur dengan `npx vitest list`, tanpa mengeksekusi tes, 2026-10-22): 60 tes terdaftar pada 7 berkas; `tests/smoke/login-contract.test.ts` tidak terdaftar karena `describe.skipIf` (aktif hanya dengan `HQ_LOGIN_CONTRACT=1` dan HQ hidup; ia menulis akun uji ke DB, `login-contract.test.ts:1-8`). Rincian: `unit/agent-roster.test.ts` 14, `information-library.test.ts` 8, `smoke/anonymous-401.test.ts` 14, `unit/middleware-devbypass.test.ts` 7, `unit/require-session.test.ts` 8, `unit/reject-reason-route.test.ts` 5, `unit/garden-public.test.ts` 4. Total baris berkas tes 1029 (`wc -l`).
- Pola unit rute: mock `@/lib/prisma` dengan `vi.mock`, impor handler langsung (`import { PATCH } from '@/app/api/brahma/requests/[id]/route'`), buat `new Request(url, { headers: { 'x-internal-secret': ... } })`, set `process.env.INTERNAL_API_SECRET` di `beforeEach` (`tests/unit/reject-reason-route.test.ts:7-47`).
- Pola smoke: `net.createConnection` ke 127.0.0.1:9011 untuk deteksi hidup, `NODE_TLS_REJECT_UNAUTHORIZED='0'`, `describe.skipIf(!alive)` (`tests/smoke/anonymous-401.test.ts:7-40`).
- Tes IL `tests/information-library.test.ts` (393 baris): memakai DB uji terpisah (`ilfix_uji`, `postgres`, `jira_clone`) dan fixture `SHARED_WORKSPACE`, aturan "tidak pernah menyentuh gsp_agent_hq produksi" (baris 21-24); gerbang statis "nol interpolasi `${}`" pada blok `pool.query` (baris 379).
- Lint: ESLint 9 dengan `eslint.config.mjs` (`package.json:44,10`).

### 2.9 Dokumen arsitektur repo (kategori 9)

`docs/ARCHITECTURE.md` (121 baris), seksi: 1 Konteks dan Tujuan; 2 Komponen; 3 Alur Data (3.1 Dispatch, 3.2 Mirror, 3.3 Telemetry Orkestrasi); 4 Keamanan Lapisan; 5 Kustomisasi GSP; 6 Asumsi dan Batasan. Poin relevan:
- Prinsip: website dan agen tidak berkomunikasi langsung; keduanya membaca/menulis Postgres yang sama sebagai message bus (`ARCHITECTURE.md:17-18`).
- Komponen: Next.js 16 + React 19 + Tailwind v4; PostgreSQL; hermes-bridge (Node ESM, `pg`); Brahma/fleet via CLI `hermes` (22-27).
- Dispatch: UI/API menyisipkan `AgentRequest`; `sideEffecting=false` -> `queued`, `true` -> `awaiting_approval`; bridge poll 5 detik; menjalankan `hermes -p <profile> <prompt>`; hasil kembali ke `result`; kartu kanban dibuat untuk dispatch berprofil; deteksi status semantik `STATUS: blocked|needs-review|failed|complete` (53-67).
- Telemetri orkestrasi: `OrchestrationRecord` dengan `artifactPath` (81-89).
- Kustomisasi IL: `/api/information-library` menggabungkan wiki, workspace (`~/workspace/gsp-hermes/workspace`), vault; entri project punya `files[]`; POST simpan via librarian (110).
- Batasan: dokumen menyatakan "tanpa folder migrations / db push" (118) dan CLI args best-effort untuk Hermes v0.17.x (120).

`docs/DATA-MODEL.md` (140 baris), seksi: 1 Diagram ER; 2 Kelompok Model (Auth, Hermes Bus, Orkestrasi GSP, Konten, Client Pulse, RBAC WebUI, Lainnya); 3 Catatan Operasional. Poin relevan: deskripsi `AgentRequest` (inti dispatch), `Mission` ("Misi per agen") di tabel Hermes Bus (`DATA-MODEL.md:89`), `WebUiUser` (125). Dokumen belum memuat `IlSearchDoc` dan `WorkerTrace` pada ringkasan kelompok (`grep` hasil: tidak disebut di bagian 2).

`docs/API-REFERENCE.md` (224 baris), seksi: 1 Autentikasi; 2 Agents; 3 Brahma Control Hub; 4 Information Library; 5 Orkestrasi; 6 Tasks dan User Access; 7 Content OS; 8 YouTube; 9 Articles dan Longform; 10 Client Pulse; 11 Lainnya; Catatan Umum. Poin relevan: contoh `POST /api/brahma/dispatch` (65-79), tabel IL hanya mencantumkan `GET /api/information-library` dan `/file` (85-88; `ask`, `propose`, `propose/upload` belum tercatat), format error `{ "error": "…" }` (222), catatan "file `route.ts` adalah sumber kebenaran" (223-224).

Dokumen lain di `docs/`: `OPERATIONS-RUNBOOK.md` (170), `SETUP-INSTALLATION.md` (207), folder `legacy/`, `docs/2026-08-30-login-terpadu-hq/contract.md`. Root: `README.md` (397 baris, seksi "Halaman dan API" baris 289, "Model data" 306, "Keamanan" 342), `CHANGELOG.md` (98).

### 2.10 Fitur dokumen/template/render/artifact/upload yang sudah ada (kategori 10)

Grep (`template|docx|pdf|render|artifact|upload|attachment|puppeteer|html`) atas `src`, `hermes-bridge/bridge.mjs`, `prisma/schema.prisma`, `package.json`:

| Temuan | Sitasi | Keterangan faktual |
|---|---|---|
| Upload lampiran proposa (multipart) | `src/app/api/information-library/propose/upload/route.ts:8-59` | Satu-satunya route upload dokumen; ekstensi `.pdf .docx .xlsx .pptx` dll. diterima sebagai lampiran mentah, tidak diproses atau dirender |
| Lampiran di UI Propose | `src/app/information-library/page.tsx:1043-1076,1438-1492` | `ProposeAttachment` kind `file`/`url`; ikon `Paperclip`, `Upload` |
| Upload gambar draf X | `src/app/api/x-content/visual/route.ts:9-62` | Menyimpan PNG/JPG ke `public/draft-visuals/` |
| `Article.heroImageHtml` (HTML artifact) | `prisma/schema.prisma:333`; `src/app/api/articles/route.ts:49,95`; `src/app/articles/page.tsx:18,1634,1762-1763,2193-2209` | HTML hero disimpan sebagai teks di DB dan dirender di `<iframe srcDoc={article.heroImageHtml}>` (`articles/page.tsx:2198`); dihasilkan oleh `src/app/api/articles/generate-visuals/route.ts` (baris 86-93 memakai contoh `heroImageHtml`) |
| `OrchestrationRecord.artifactPath` | `schema.prisma:259`; `orchestration/route.ts:77,107`; `orchestration/page.tsx:34,763,796,898-902` | Menyimpan path artefak (maks 500 karakter) dan ditampilkan sebagai teks |
| Regex jalur artefak kontrak | `hermes-bridge/bridge.mjs:196` | Mengenali `.md/.json/.csv/.pdf/.docx/.xlsx/.pptx` di prompt untuk dedup kartu |
| Label peran agen | `src/lib/agent-roster.ts:89,107`; `src/app/api/agent-chat/route.ts:14-58` | `gsp-document-writer` "Produksi PDF, DOCX, XLSX, PPTX"; `gsp-document-reader` "Parse PDF, DOCX, XLSX, PPTX"; profil `gsp-document-converter`, `gsp-document-translator`, `gsp-image-specialist` terdaftar di PROFILE_MAP |
| Template teks pada prompt artikel | `src/app/api/articles/generate-article/route.ts:102-103` | Kata "templates" hanya dalam teks prompt (email template dalam code block) |
| Daftar jenis dokumen IL | `src/app/information-library/page.tsx:49-63` | Tipe entri `fact ... document, reference, catatan, fakta, cycle` |
| Model chart di UI | `package.json:35`, `src/components/HLPnlChart.tsx`, `donut-chart.tsx`, `sparkline.tsx` | Chart React via recharts untuk dashboard (bukan render artefak) |

Tidak ditemukan di repo (diverifikasi lewat grep dan `package.json`): model/tabel template, model dokumen/section/chapter/paragraph, library render DOCX/PDF/XLSX/PPTX, penyimpanan blob/file di DB, route yang memanggil Python atau skill DATUM, renderer SVG/diagram sisi server, route pembuat artefak berbasis JSON. File `prisma/schema.prisma` memiliki tipe `Json` pada beberapa model (mis. `DataStore.data`, `AgentState.recentActivity`, `Draft.viralScore`) dan `@db.Text` pada kolom besar.

## 3. Code Context (kutipan load-bearing)

Middleware: urutan keputusan auth, lihat `src/middleware.ts:63-119` (disajikan di 2.5). Matcher:

```ts
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```
(`src/middleware.ts:121-123`)

Daftar menu sidebar, `src/components/sidebar.tsx:27-63` (kutipan grup System, baris 53-62):

```tsx
  {
    name: "System",
    items: [
      { href: "/agents", label: "Agents", icon: Bot },
      { href: "/user-access", label: "User Access", icon: Users },
      { href: "/information-library", label: "Information Library", icon: BookOpen },
      { href: "/ideas", label: "Ideas", icon: Lightbulb },
      { href: "/garden", label: "Garden", icon: Flower2 },
    ],
  },
```

Pembentukan entri folder misi di IL, `src/app/api/information-library/route.ts:361-366` dan `420-443` (id, path, type, title, files):

```ts
    const docsRoot = path.join(SHARED_WS, "docs");
    ...
        const pretty = dir.replace(/^\d{4}[-_]\d{2}[-_]\d{2}[-_]/, "").replace(/[-_]+/g, " ").trim();
        const cls = classifyPath(`docs/${dir}/`);
        wsEntries.push({
          id: `ws-docs-${dir.replace(/[^a-z0-9]+/gi, "-")}`,
          path: `docs/${dir}/`,
          type: "project",
          ...
          files: nonMd.map((f) => f.rel),
```

Content-Type pada route file, `src/app/api/information-library/file/route.ts:35-41`:

```ts
  const contentType =
    ext === ".md" || ext === ".markdown" ? "text/markdown; charset=utf-8"
    : ext === ".json" ? "application/json; charset=utf-8"
    : ext === ".py" ? "text/x-python; charset=utf-8"
    : ext === ".csv" ? "text/csv; charset=utf-8"
    : ext === ".txt" || ext === ".log" ? "text/plain; charset=utf-8"
    : "application/octet-stream";
```

Eksekusi CLI di bridge, `hermes-bridge/bridge.mjs:717-718`:

```js
    if (r.kind === "oneshot" || r.kind === "chat" || r.kind === "instant") {
      result = (await hermes([...(isProfile ? ["-p", r.profile] : []), "-z", r.prompt || r.title], { timeout: RUN_TIMEOUT_MS })).trim();
```

## 4. Online Resources / External Research Findings

Dimensi riset eksternal (tujuh dimensi): tidak dalam lingkup tugas ini (tugas hanya peta codebase lokal). 1 Technology Trends: not in scope. 2 Technology Evaluation: not in scope. 3 Vendor Evaluation: not in scope. 4 Market Share: not in scope. 5 Regulatory: not in scope. 6 Competitive Landscape: not in scope. 7 Industry Trends: not in scope. Tidak ada akses web yang dilakukan.

## 5. Collection Log

| Langkah | Alat | Hasil |
|---|---|---|
| Daftar halaman dan route API | Glob `src/app/**/page.tsx`, `src/app/api/**/route.ts`; `find ... | wc -l` | 21 halaman, 75 route |
| Stack | Read `package.json`, `tsconfig.json`, `next.config.ts`, `hq-server.mjs`, `vitest.config.ts`, `postcss.config.mjs`; `node -p require('./node_modules/<p>/package.json').version` | Versi pada 2.1 |
| Schema | Read penuh `prisma/schema.prisma` (606 baris); `grep -c "^model "` = 33 | Bagian 2.3 |
| Cek DB (read-only) | skrip `node` dengan `pg`: `SELECT` atas `pg_tables`, `_prisma_migrations`, `information_schema.columns`, `count(*)`; tidak ada INSERT/UPDATE/DDL; kredensial tidak dicetak | 35 tabel, 4 migrasi, `WorkerTrace` di luar schema |
| IL | Read `src/app/api/information-library/route.ts`, `file`, `ask`, `propose`, `propose/upload`; `grep` pada `page.tsx` | Bagian 2.4 |
| Workspace | `ls`/`find`/`head` pada `C:\Users\TRIAL\workspace\gsp-hermes\workspace\docs` (read-only) | 3 contoh folder misi + standar |
| Auth | Read `middleware.ts`, `require-session.ts`, `hq-session.ts`, `webui-rbac.ts`, `auth.ts`, `auth/login`, `auth/me` | Bagian 2.5 |
| Tes | `npx vitest list` (hanya mengoleksi, tidak menjalankan tes); Read tes terpilih | 60 tes |
| Dokumen | Read `docs/ARCHITECTURE.md`, `API-REFERENCE.md`, `DATA-MODEL.md` | Bagian 2.9 |
| Fitur dokumen | `grep -rn` pola kata kunci | Bagian 2.10 |
| `.env` | `sed 's/=.*/=<redacted>/'` untuk nama variabel saja; skrip `node` hanya mencetak nama DB/host/port dan origin `NEXTAUTH_URL` | Tanpa secret tercetak |
| Perubahan repo | Tidak ada selain pembuatan berkas ini di `docs/2026-10-22_doc_artifact_studio/research/` | `git status` hanya folder docs baru |

## 6. Gaps dan Needs More Data

1. Isi penuh `Manual_Komprehensif_DATUM_GSP_...pdf/.docx` tidak dibaca (di luar 10 butir permintaan). Lokasi: `C:\Users\TRIAL\workspace\Manual DATUM GSP\` (`01_original.md`).
2. `SKILL.md` dan isi skrip `datum-house-style` tidak dibaca, hanya daftar berkas; antarmuka CLI/API Python-nya belum dikumpulkan.
3. Tidak ditemukan di repo: tempat penyimpanan/pencatatan "kontrak misi" sebagai entitas DB. Definisi kontrak hanya berupa berkas `contract.md` bebas bentuk di folder misi; tidak ada skema baku isi `contract.md` (tiga contoh berbeda struktur).
4. Model `Mission` ada di schema; `grep -rn "prisma.mission\|\.mission" src hermes-bridge/bridge.mjs` tidak menemukan pemakaian. Tabel `WorkerTrace` di DB tanpa model Prisma: asal penulis tabel tidak ditemukan di repo.
5. Cara kerja `vault_propose.py`/`vault_promote.py` (skrip di workspace `scripts/`) tidak dibaca; hanya dikutip dari prompt propose.
6. Isi `docs/OPERATIONS-RUNBOOK.md`, `SETUP-INSTALLATION.md`, `README.md` seksi lain tidak dirangkum.
7. Hook `docs_accountability`/aturan snake_case untuk folder misi workspace tidak diverifikasi di sisi HQ; folder repo HQ memakai campuran `2026-08-30-login-terpadu-hq` (tanda hubung) dan `2026-10-22_doc_artifact_studio` (garis bawah).
8. Perbedaan default `SHARED_WORKSPACE` antar route (macOS `/Users/mbp/...` vs Windows `C:/Users/TRIAL/...`) dicatat apa adanya; nilai `.env` aktual tidak dicetak.
9. Halaman/komponen UI selain IL dan sidebar (mis. `brahma/page.tsx`, `tasks/page.tsx`) tidak dibaca isinya; tujuan satu baris berasal dari judul/komentar/ukuran berkas.
10. Tidak ada tes yang dijalankan (hanya `vitest list`); status lulus/gagal tes tidak diketahui.
