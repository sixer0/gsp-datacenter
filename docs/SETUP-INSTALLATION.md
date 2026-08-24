# Setup & Instalasi — GSP Agent Headquarter

Panduan lengkap dari nol hingga sistem berjalan: prasyarat, environment, database,
menjalankan website, bridge, dan deploy.

---

## 1. Prasyarat

| Kebutuhan | Versi / Keterangan |
|---|---|
| Node.js | 20+ (22 disarankan) |
| npm | bawaan Node |
| PostgreSQL | 14+ — lokal (`brew install postgresql@17`) atau hosted (Neon/Supabase/Vercel) |
| Hermes/Brahma CLI | `hermes` tersedia di PATH (mesin agen) — `~/.local/bin/hermes` |
| git | untuk clone |
| Google Cloud (opsional, produksi) | OAuth 2.0 Client ID + Secret |

Cek:

```sh
node -v && npm -v
which hermes
psql --version
```

## 2. Ambil Codebase

Dari backup ini (lihat README → Backup & restore), atau dari repo asal:

```sh
# opsi A: dari backup ini
rsync -a "/Users/mbp/documents/Project/GSP AI/GSP Agent HQ/" ~/gsp-agent-headquarter/
cd ~/gsp-agent-headquarter

# opsi B: dari git
git clone <repo-url> gsp-agent-headquarter && cd gsp-agent-headquarter
```

## 3. Instal Dependensi

```sh
npm install
```

`postinstall` otomatis menjalankan `prisma generate`. Bila gagal, jalankan manual:
`npx prisma generate`.

## 4. Konfigurasi Environment

```sh
cp .env.example .env
nano .env   # atau editor apa pun
```

### Variabel wajib (Core)

| Variabel | Contoh | Keterangan |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/gsp_agent_hq` | Koneksi utama — **wajib URL langsung** (`postgres://`), bukan `prisma://` Accelerate |
| `POSTGRES_URL` | sama seperti di atas | Beberapa tooling membaca ini |
| `NEXTAUTH_URL` | `http://localhost:9011` | URL situs (lokal: host:port dev) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Secret sesi |
| `GOOGLE_CLIENT_ID` | `…apps.googleusercontent.com` | Opsional di dev (bypass aktif) |
| `GOOGLE_CLIENT_SECRET` | — | Opsional di dev |
| `ALLOWED_EMAILS` | `owner@example.com` | Allowlist login (koma untuk banyak) |
| `NEXT_PUBLIC_OWNER_NAME` | `Owner` | Nama tampilan |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:9011` | Base URL publik |

### Variabel Hermes/bridge

| Variabel | Default | Keterangan |
|---|---|---|
| `HERMES_BOARD` | `default` | Board kanban yang dimirror |
| `HERMES_BIN` | `hermes` | Path CLI bila tidak di PATH |
| `HERMES_WIKI` | `~/.hermes/wiki` | Root memori-wiki |
| `BRIEF_HOUR` | `7` | Jam daily brief (0–23) |
| `INTERNAL_API_SECRET` | — | Secret route internal (`openssl rand -hex 32`) |
| `CRON_SECRET` | — | Secret endpoint terjadwal |

### Variabel opsional

Isi hanya bila memakai fitur terkait: `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `XAI_API_KEY`,
`BRAVE_API_KEY`, `YOUTUBE_API_KEY` + `YOUTUBE_CHANNEL_ID`, `TWITTER_BEARER_TOKEN`,
`NOTION_API_KEY`, `CLIENT_PULSE_ADMIN_SECRET`, `HL_WALLET`, `WEBUI_RBAC_TOKEN`.

## 5. Siapkan Database

```sh
# pastikan Postgres berjalan, lalu buat database
createdb gsp_agent_hq        # (opsional, sesuai DATABASE_URL Anda)

# sinkronkan schema
npx prisma db push

# seed awal (opsional)
npm run db:seed

# seed admin RBAC WebUI (opsional)
WEBUI_ADMIN_USERNAME=admin WEBUI_ADMIN_PASSWORD='pilih-password-kuat' node scripts/seed-webui-admin.mjs
```

> Proyek ini tanpa folder `prisma/migrations` — `db push` adalah cara standar.
> Untuk produksi yang serius, pertimbangkan membuat migrations resmi:
> `npx prisma migrate dev --name init`.

## 6. Jalankan Website

### Development

```sh
npm run dev
```

- Port default `3000`; deployment GSP memakai **9011** (atur `NEXT_PUBLIC_BASE_URL`/`NEXTAUTH_URL`
  sesuai, mis. `npm run dev -- -p 9011`).
- Di dev, middleware melewati auth (lihat `src/middleware.ts`).

### Production

```sh
npm run build   # prisma generate + next build
npm start       # next start
```

## 7. Bridge (hubungkan agen)

Di mesin tempat Brahma/Hermes berjalan (bisa mesin yang sama):

```sh
cd hermes-bridge
npm install

# uji sekali (foreground)
DATABASE_URL='postgres://…sama dengan website…' \
HERMES_BOARD=default \
HERMES_BIN="$HOME/.local/bin/hermes" \
node bridge.mjs
```

Tanda sukses: log `hermes-bridge up …` dan event **"Bridge connected"** di activity feed website.

### Menjalankan selamanya

**macOS (launchd):** edit placeholder di `ai.gspagenthq.bridge.plist` (path, DATABASE_URL, PATH),
lalu:

```sh
cp ai.gspagenthq.bridge.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/ai.gspagenthq.bridge.plist
# log: /tmp/hermes-bridge.out.log, /tmp/hermes-bridge.err.log
```

**Linux (systemd):** buat unit `hermes-bridge.service` dengan `Environment=DATABASE_URL=…`,
`ExecStart=/usr/bin/node /path/hermes-bridge/bridge.mjs`, `Restart=always`.

**GSP fleet (watchdog):** fleet `gsp-*` memakai cron watchdog
(`~/.hermes/scripts/gsp_gateway_watchdog.sh`) yang memastikan semua gateway profil hidup;
bridge berjalan sebagai proses terpisah (lihat OPERATIONS-RUNBOOK.md).

### Env bridge (ringkas)

| Variabel | Default | Keterangan |
|---|---|---|
| `DATABASE_URL` | wajib | URL Postgres langsung |
| `HERMES_BOARD` | `default` | board kanban |
| `BRIDGE_POLL_MS` | `5000` | interval cek request baru |
| `BRIDGE_MIRROR_MS` | `30000` | interval mirror kanban/cron/health |
| `BRIDGE_RUN_TIMEOUT_MS` | `1800000` | timeout 1x run agen (30 menit) |
| `HERMES_BIN` | `hermes` | path CLI |
| `HERMES_WIKI` | `~/.hermes/wiki` | root wiki |
| `BRIEF_HOUR` | `8` | jam daily brief |

## 8. Deploy Vercel

```sh
npm i -g vercel
vercel          # link + preview
vercel --prod   # produksi
```

1. Set **semua** env var dari `.env` di **Project → Settings → Environment Variables**.
2. `NEXTAUTH_URL` & `NEXT_PUBLIC_BASE_URL` → URL produksi.
3. Google Cloud console → tambah redirect URI `https://<domain>/api/auth/callback/google`.
4. `vercel.json` sudah berisi region `iad1` + cron `/api/cron/x-stats` (08.00) — pastikan
   `CRON_SECRET` terpasang.

## 9. Verifikasi Instalasi

```sh
curl -s http://localhost:9011/api/brahma/health | head
curl -s http://localhost:9011/api/agents | head -20
```

- `/api/brahma/health` → status bridge/agen.
- `/api/agents` → daftar roster fleet.
- UI: buka `http://localhost:9011`, cek dashboard, `/brahma`, `/information-library`.

## 10. Troubleshooting Singkat

| Gejala | Solusi |
|---|---|
| `prisma generate` gagal | pastikan `DATABASE_URL` terisi; coba `npx prisma generate` |
| Bridge error "Prisma Accelerate URL" | pakai URL `postgres://` langsung di `DATABASE_URL` |
| Login Google gagal di produksi | cek redirect URI + `ALLOWED_EMAILS` |
| Port bentrok | `npm run dev -- -p <port>` dan sesuaikan env |
| Dispatch menggantung >15 menit | lihat OPERATIONS-RUNBOOK.md (pola hang + pemulihan) |
