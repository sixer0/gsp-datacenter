-- ILFIX-0927 F1-2 — tabel mirror FTS Information Library (murni aditif).
-- Skema mengikat: docs/2026-09-27-ilfix-ingest/f1/F1-DESIGN.md §3 (DDL dituang verbatim).
-- Data turunan: boleh dibangun ulang kapan pun (sinkron F1-3), bukan sumber kebenaran.
-- Rollback konkret (F1-DESIGN §6): DROP TABLE IF EXISTS "IlSearchDoc"; DROP EXTENSION IF EXISTS pg_trgm;

-- pg_trgm: trusted, user migrasi = postgres superuser (bukti probe P-3 di F1-DESIGN §1).
-- Dipasang di skema `public` (default) agar operator/opclass gin_trgm_ops terlihat sesi Prisma.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateTable
CREATE TABLE "IlSearchDoc" (
    "id"        TEXT        NOT NULL,
    "source"    TEXT        NOT NULL,
    "path"      TEXT        NOT NULL,
    "title"     TEXT        NOT NULL,
    "body"      TEXT        NOT NULL DEFAULT '',
    "domain"    TEXT,
    "project"   TEXT,
    "type"      TEXT        NOT NULL DEFAULT 'note',
    "status"    TEXT        NOT NULL DEFAULT 'active',
    "rank"      INTEGER     NOT NULL DEFAULT 3,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt"  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IlSearchDoc_pkey" PRIMARY KEY ("id")
);

-- Kolom hasil tsvector: diisi otomatis oleh Postgres (generated column), BUKAN oleh aplikasi.
-- Ditulis manual di sini karena Prisma tidak mendukung generated column tsvector.
ALTER TABLE "IlSearchDoc"
  ADD COLUMN "tsv" tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("body", ''))) STORED;

-- CreateIndex
CREATE INDEX "ilsearchdoc_tsv_gin"    ON "IlSearchDoc" USING gin ("tsv");
CREATE INDEX "ilsearchdoc_trgm_body"  ON "IlSearchDoc" USING gin ("body" gin_trgm_ops);
CREATE INDEX "ilsearchdoc_trgm_title" ON "IlSearchDoc" USING gin ("title" gin_trgm_ops);
CREATE INDEX "ilsearchdoc_source_idx" ON "IlSearchDoc" ("source");
