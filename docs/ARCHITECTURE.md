# Arsitektur GSP Agent Headquarter

Dokumen ini menjelaskan arsitektur sistem GSP Agent Headquarter: komponen, alur data,
pola komunikasi, dan kustomisasi yang dibuat untuk ekosistem GSP.

---

## 1. Konteks & Tujuan

GSP Agent Headquarter adalah **dashboard kendali misi** untuk agen AI self-hosted (Brahma /
Hermes Agent). Tujuannya:

- Memberi **satu kokpit** untuk dispatch, persetujuan, pemantauan, dan memori agen.
- Menjaga **agen tetap lokal & privat** — tidak ada endpoint publik yang mengarah ke mesin agen.
- Mendukung **fleet multi-profil** (`gsp-*`) dengan telemetry orkestrasi lintas profil.

Prinsip desain utama: **website dan agen tidak pernah berkomunikasi langsung**.
Keduanya membaca/menulis **database PostgreSQL yang sama** sebagai *message bus*.

## 2. Komponen

| Komponen | Teknologi | Peran |
|---|---|---|
| **Website (dashboard)** | Next.js 16 (App Router) + React 19 + Tailwind v4 | UI kokpit + API routes; hanya butuh akses ke Postgres |
| **PostgreSQL** | Postgres (lokal: `gsp_agent_hq`) | Message bus + penyimpanan data semua fitur |
| **hermes-bridge** | Node.js ESM (`bridge.mjs`, dep: `pg`) | Jembatan Postgres ↔ CLI `hermes`; berjalan di mesin agen |
| **Brahma / fleet** | Hermes Agent CLI (`hermes`, profil `default` + `gsp-*`) | Eksekusi tugas; membaca/writing state lokal (kanban, wiki, cron) |

Diagram:

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
                   ▼                          │  └───────────────────┘    │
        ┌─────────────────────────────────────────────────────────────────┐
        │            PostgreSQL — message bus (gsp_agent_hq)              │
        │  AgentRequest · AgentEvent · HermesTask · HermesMemory          │
        │  DataStore · Brief · OrchestrationRecord · WebUiUser · …        │
        └─────────────────────────────────────────────────────────────────┘
```

## 3. Alur Data

### 3.1 Dispatch (Website → Agen)

1. Pengguna mengirim tugas dari UI (`/brahma` dispatch atau halaman `/tasks`).
2. API menyisipkan baris `AgentRequest`:
   - `sideEffecting=false` → status `queued`
   - `sideEffecting=true` → status `awaiting_approval` (menunggu persetujuan di Approval Inbox)
   - `profile` menentukan target profil Hermes (`null`/kosong = default).
3. Bridge mem-poll tabel `AgentRequest` (default tiap 5 detik, `BRIDGE_POLL_MS`).
4. Untuk baris `queued`/`approved`, bridge menjalankan CLI `hermes -p <profile> <prompt>` (atau
   bentuk kanban) dengan timeout `BRIDGE_RUN_TIMEOUT_MS` (default 30 menit).
5. Hasil ditulis kembali ke `result` + `status=done` (atau `failed` + `error`).
6. Untuk dispatch berprofil, bridge juga membuat kartu kanban Hermes asli
   (`HermesTask` assignee=profil, body "HQ dispatch <id>") dan menutupnya `complete`/`block`.
   Deteksi status semantik dari respons agen: `STATUS: blocked|needs-review|failed|complete`,
   kode `RT_BYPASS` → edge ikut `blocked`.

### 3.2 Mirror (Agen → Website)

Bridge mencerminkan state lokal Hermes ke Postgres secara berkala (`BRIDGE_MIRROR_MS`, default 30 dtk):

| Sumber (Hermes) | Target (Postgres) | Dipakai oleh |
|---|---|---|
| Kanban board (`HERMES_BOARD`) | `HermesTask` | Halaman `/tasks` |
| Cron + health | `DataStore` (key `hermes-*`) | Halaman `/brahma` (cron, health) |
| Memory wiki (git markdown, `HERMES_WIKI`) | `HermesMemory` | `/information-library` (scope wiki) |
| Daily brief | `Brief` | Dashboard home |
| Aktivitas (up/down/runs) | `AgentEvent` | Activity feed |

### 3.3 Telemetry Orkestrasi

Setiap interaksi lintas profil menulis `OrchestrationRecord` (oleh bridge saat dispatch via HQ,
atau helper `gsp-hq-record` dari agen fleet):

- `fromAgent`, `toAgent`, `kind` (`delegate|handoff|verify|report|review|gate|dispatch`),
  `status` (`running|done|blocked|needs-review|failed|rejected`),
  `taskId`, `taskTitle`, `message`, `artifactPath`, `meta`, `runId`.
- Halaman `/orchestration` merender sebagai graf + timeline.

## 4. Keamanan Lapisan

1. **Middleware Next.js** (`src/middleware.ts`):
   - Dev mode (`NODE_ENV=development`) → bypass total (untuk kerja lokal).
   - Skip untuk `/api/auth/*`, `/api/garden`, `/_next/*`, `/favicon.ico`, `/login`.
   - Header `x-internal-secret` yang cocok dengan `INTERNAL_API_SECRET` → lolos.
   - Selain itu wajib token NextAuth JWT; API tanpa token → 401, halaman → redirect `/login`.
2. **Approval gate**: bridge hanya menjalankan `queued`/`approved`; `awaiting_approval` tidak pernah.
3. **RBAC WebUI** (`src/lib/webui-rbac.ts` + model `WebUiUser`): role `ADMINISTRATOR` vs `USER`;
   user dipin ke profil Hermes masing-masing, akses panel dibatasi.
4. **Proteksi path traversal** pada endpoint file Information Library (403).

## 5. Kustomisasi GSP

Perubahan/penambahan di atas template asli (Hermy → GSP):

| Area | Keterangan |
|---|---|
| **Rebranding** | UI labels Hermes→Brahma, route `/hermes` → `/brahma`, API `/api/brahma/*`; bridge mengirim `agent="brahma"` |
| **Information Library** | `/memory-wiki` → `/information-library` (redirect 308 via `next.config.ts`); endpoint `/api/information-library` menggabungkan scope `wiki` (HermesMemory) + `workspace` (file `.md` di shared GSP workspace `~/workspace/gsp-hermes/workspace`) + `vault` (staging librarian); entri project punya `files[]`; POST simpan via librarian (`/api/brahma/memory` dispatch ke profil `gsp-librarian`) |
| **Orchestration** | Model `OrchestrationRecord` + halaman `/orchestration` (graf + timeline lintas profil) |
| **RBAC & roster dinamis** | Model `WebUiUser`; `/api/agents` = roster statis (`src/app/api/agents/route.ts`) + merge user WebUI (level 3, grup controller); halaman `/user-access` untuk manajemen |
| **Daily brief** | Dijadwalkan bridge (`BRIEF_HOUR`), disimpan di `Brief` |
| **Seed admin** | `scripts/seed-webui-admin.mjs` membuat admin RBAC pertama |

## 6. Asumsi & Batasan

- Schema dikelola dengan **Prisma Migrate**: riwayat di `prisma/migrations/` (`0_init` s.d.
  `20261022120000_add_studio` dan `20261023150000_worker_trace_baseline`). Cara kerja yang berlaku
  (keputusan D-21/D-24 di `docs/2026-10-22_doc_artifact_studio/decisions/decisions.md`):
  - **Dilarang `prisma migrate dev` dan `prisma db push`** — keduanya dapat mendeteksi drift dan
    menawarkan reset DB (destruktif). Skrip `npm run db:migrate` = `prisma migrate deploy`.
  - Migrasi baru dibuat dengan `npx prisma migrate diff --from-migrations prisma/migrations
    --to-schema-datamodel prisma/schema.prisma --shadow-database-url <shadow> --script`, dikurangi
    baseline diff yang diambil sebelum schema disunting (drift indeks `IlSearchDoc` yang dikenal),
    dicek tanpa `DROP`, lalu diterapkan dengan `npx prisma migrate deploy`.
  - Tabel `WorkerTrace` dan `IlSearchDoc` tidak boleh dihapus. `WorkerTrace` dulu hanya ada di DB;
    kini dimodelkan di `schema.prisma` (hasil introspeksi) dan migrasi baselinenya memakai
    `CREATE TABLE IF NOT EXISTS`. Pada DB yang tabelnya sudah ada, tandai dengan
    `npx prisma migrate resolve --applied 20261023150000_worker_trace_baseline` alih-alih menjalankannya.
- Bridge butuh **URL Postgres langsung** (`postgres://`), bukan `prisma://` Accelerate.
- CLI arg shapes di `bridge.mjs` best-effort untuk Hermes v0.17.x — bila versi berubah, sesuaikan `runRequest()`.
- Dashboard inti berjalan tanpa API key; fitur konten (YouTube/X/LLM) baru aktif bila key diisi.
