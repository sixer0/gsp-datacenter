# Runbook Operasional — GSP Agent Headquarter

Prosedur harian: menjalankan, memantau, memulihkan, dan troubleshooting sistem.
Berlaku untuk deployment lokal GSP (Next dev di port 9011, Postgres lokal `gsp_agent_hq`,
bridge via `node bridge.mjs`) maupun deployment produksi.

---

## 1. Status & Siklus Hidup Layanan

### Website (Next.js)

| Aksi | Perintah |
|---|---|
| Dev server | `cd ~/gsp-agent-headquarter && npm run dev -- -p 9011` |
| Build produksi | `npm run build` |
| Produksi | `npm start` |
| Cek hidup | `curl -s http://localhost:9011/api/brahma/health` |
| Log dev | output terminal / `~/.hermes/webui.log` (jika via ctl daemon) |

> **Pitfall WebUI:** bila memakai WebUI Hermes (port 9012), setiap edit `static/` mengharuskan
> restart server agar browser mendapat versi baru (`__WEBUI_VERSION__` = hash git diff).
> Tanpa restart, browser/Service Worker memakai JS lama — fitur baru tampak "mati" walau file benar.

### Bridge

| Aksi | Perintah |
|---|---|
| Jalankan (foreground) | `cd ~/gsp-agent-headquarter/hermes-bridge && node bridge.mjs` |
| Jalankan (launchd) | `launchctl load ~/Library/LaunchAgents/ai.gspagenthq.bridge.plist` |
| Hentikan | `launchctl unload ~/Library/LaunchAgents/ai.gspagenthq.bridge.plist` |
| Log | `/tmp/hermes-bridge.out.log`, `/tmp/hermes-bridge.err.log` |
| Cek hidup | event "Bridge connected" di activity feed website; `ps aux | grep bridge.mjs` |

### Database (Postgres lokal GSP)

```sh
# Postgres 17 via pg_ctl (brew services gagal dengan exit 5 di mesin ini)
pg_ctl -D /usr/local/var/postgresql@17 start
pg_ctl -D /usr/local/var/postgresql@17 status
createdb gsp_agent_hq   # sekali
```

### Fleet GSP (gateway profil `gsp-*`)

Watchdog otomatis: cron `GSP Gateway Watchdog` (`hermes cron run 68bef0578111`) tiap 30 menit —
menyalakan gateway profil yang mati, silent saat sehat. Log: `~/.hermes/gateway-logs/`.
PID per profil: `~/.hermes/gateway-logs/<profile>.pid`.

---

## 2. Tabel Perintah Cepat

| Kebutuhan | Perintah |
|---|---|
| Lint | `npm run lint` |
| Sinkron schema | `npx prisma db push` |
| Prisma Studio | `npm run db:studio` |
| Seed awal | `npm run db:seed` |
| Seed admin RBAC | `WEBUI_ADMIN_USERNAME=… WEBUI_ADMIN_PASSWORD='…' node scripts/seed-webui-admin.mjs` |
| Backup DB | `pg_dump gsp_agent_hq > backup-$(date +%F).sql` |
| Restore DB | `psql gsp_agent_hq < backup-2026-08-24.sql` |
| Cek request antre | `psql gsp_agent_hq -c "select id,status,profile,title from \"AgentRequest\" order by \"createdAt\" desc limit 10;"` |
| Cek telemetry | `psql gsp_agent_hq -c "select \"fromAgent\",\"toAgent\",kind,status,count(*) from \"OrchestrationRecord\" group by 1,2,3,4 order by 5 desc;"` |

---

## 3. Alur Dispatch & Pemulihan

### Status `AgentRequest`

`queued` → (approve bila side-effecting: `approved`) → `running` → `done` / `failed` / `rejected`.

### Pola hang dispatch (terjadi 2x di GSP)

Gejala: proses `hermes -p <profil>` menggantung (CPU 0%, >15 menit) **setelah** artefak final dan
handoff tercatat — respons tidak kunjung selesai.

Pemulihan (orkestrator):

1. **Verifikasi artefak mandiri** — cek file hasil di shared workspace/docs (jangan percaya status).
2. **Kill proses** yang menggantung.
3. **Update `AgentRequest`** → `status=done`, isi `result` ringkas dengan hasil nyata.
4. **Update `OrchestrationRecord`** terkait → `status=done`, tutup edge telemetry.
5. Catat di decision log bila ada ambiguitas artefak (lihat rekonsiliasi korpus di bawah).

### Rekonsiliasi artefak ganda

Bila dua sumber menghasilkan artefak tidak sinkron (mis. `items.jsonl` 1025 vs retry 970):

1. Tentukan kanonik (mis. versi retry terverifikasi).
2. Tandai non-kanonik (mis. rename/archive).
3. Tulis `decisions/*.md` mencatat keputusan.
4. Resolve status task/request jadi `done`.

### Konflik tulis sesi paralel

Dispatch paralel ke profil yang sama dapat menimpa file shared workspace.
Mitigasi: **salinan kanonik per-job** (mis. `f2_retry/`), instruksi sub-agent membaca path stabil,
dan verifikasi file final sebelum klaim sukses.

---

## 4. Timeout & Batas

| Parameter | Default | Kapan dinaikkan |
|---|---|---|
| `BRIDGE_RUN_TIMEOUT_MS` | 1800000 (30 mnt) | Dispatch berat multi-fetch perlu >4 menit; instruksikan sub-task fokus & sempit agar selesai <15 menit |

Override sementara: `BRIDGE_RUN_TIMEOUT_MS=3600000 node bridge.mjs`.

---

## 5. Troubleshooting

### Website

| Gejala | Kemungkinan & solusi |
|---|---|
| Halaman redirect ke `/login` di produksi | Sesi NextAuth tidak valid / belum login; cek `NEXTAUTH_URL` |
| API balas 401 | Token hilang; atau perlu header `x-internal-secret` untuk route internal |
| `/memory-wiki` muncul 404 | Sudah di-rename; pakai `/information-library` (redirect permanen 308) |
| Perubahan UI tidak muncul | WebUI: restart server (hash `__WEBUI_VERSION__`); browser: hard refresh |
| Error Prisma | `npx prisma db push` + `npx prisma generate` |

### Bridge

| Gejala | Kemungkinan & solusi |
|---|---|
| `DATABASE_URL is required` | env tidak ter-set; pakai URL `postgres://` langsung |
| "Prisma Accelerate URL" | ganti `prisma://` → `postgres://` (mis. ambil dari `POSTGRES_URL`) |
| Dispatch tidak pernah `running` | cek bridge hidup, `BRIDGE_POLL_MS`, koneksi DB |
| Dispatch selalu `failed` | cek `error` kolom; coba jalankan prompt manual: `hermes -p <profile> "<prompt>"` |
| Daily brief hang memblokir loop queue | kill proses brief + restart bridge (`main()` await mirrorTick) |

### Database

| Gejala | Solusi |
|---|---|
| Postgres tidak jalan | `pg_ctl -D … start` (jangan brew services — exit 5 di mesin ini) |
| `db push` gagal | cek `DATABASE_URL`, hak akses user, Postgres hidup |
| Tabel hilang/berubah | restore dari `pg_dump`; jangan jalankan `db push` destruktif tanpa backup |

### Fleet / Gateway

| Gejala | Solusi |
|---|---|
| Profil mati | `hermes cron run 68bef0578111` (watchdog) atau jalankan manual `nohup hermes -p <profil> gateway run` |
| Roster UI tidak menampilkan profil baru | tambahkan entri ke roster statis `src/app/api/agents/route.ts` + update komentar jumlah (helper: `~/workspace/gsp-hermes/scripts/add_hq_roster.py`) |

---

## 6. Keamanan & Praktik Baik

- **Jangan commit `.env`** — berisi secret (DB URL, OAuth, token). Backup ini menyertakan `.env`
  untuk kemudahan restore; jangan bagikan folder ini ke publik.
- **Approval gate**: jangan pernah menyetujui request side-effecting tanpa membaca detailnya.
- **Backup rutin**: `pg_dump` database + rsync folder kode ke lokasi backup (pola folder ini).
- **Update schema**: selalu backup DB sebelum `npx prisma db push` yang mengubah/drop kolom.
- **Secret internal**: rotasi `INTERNAL_API_SECRET` / `CRON_SECRET` bila bocor atau staf keluar.

---

## 7. Escalation Path

1. Gejala UI/API → cek `npm run dev` log + `psql` status request.
2. Gejala dispatch → cek bridge log (`/tmp/hermes-bridge.err.log`) + proses `hermes`.
3. Gejala fleet → `~/.hermes/gateway-logs/` + watchdog cron.
4. Tetap macet → pull log lengkap, reproduksi manual (`hermes -p <profile> "<prompt>"`),
   dan libatkan owner teknis GSP.
