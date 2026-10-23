-- Baseline WorkerTrace (INT-K, IP-19, F-003, D-21, D-24).
-- Tabel sudah ada di gsp_agent_hq_v21 (dan DB lama) tanpa riwayat migrasi; SQL = migrate diff penuh
-- dikurangi baseline drift IlSearchDoc, lalu diberi IF NOT EXISTS agar idempoten.
-- Di DB yang tabelnya sudah ada: tandai dengan `prisma migrate resolve --applied 20261023150000_worker_trace_baseline`
-- (tidak dieksekusi). DB baru: `prisma migrate deploy` membuat tabel. Tidak ada pernyataan penghapusan.

CREATE TABLE IF NOT EXISTS "WorkerTrace" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "profile" TEXT,
    "started_at" TIMESTAMP(6),
    "ended_at" TIMESTAMP(6),
    "outcome" TEXT,
    "source" TEXT NOT NULL DEFAULT 'mirror',

    CONSTRAINT "WorkerTrace_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WorkerTrace_task_id_idx" ON "WorkerTrace"("task_id");
