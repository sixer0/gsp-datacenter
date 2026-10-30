-- DC-04 (doc artifact studio, document contract) - delta murni aditif.
-- Register mengikat: docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md §7.
-- Dibuat lewat prosedur D-21: prisma migrate diff (shadow gsp_agent_hq_v21_shadow) dikurangi
-- drift baseline yang sudah ada sebelum edit (5 pernyataan, tidak disertakan), lalu SQL tangan
-- untuk kolom hasil tsvector + indeks GIN; diterapkan dengan prisma migrate deploy.
-- Rollback delta: prisma/rollback/03_rollback_studio_contract_delta.sql (§7.5).

-- AlterTable
ALTER TABLE "StudioDocument" ADD COLUMN     "contractCardIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "contractDueOn" DATE,
ADD COLUMN     "contractKind" TEXT,
ADD COLUMN     "contractOwner" TEXT,
ADD COLUMN     "contractStatus" TEXT,
ADD COLUMN     "contractTaskRef" TEXT;

-- AlterTable
ALTER TABLE "StudioTemplate" ADD COLUMN     "contractKind" TEXT;

-- CreateTable
CREATE TABLE "StudioContractRecord" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "docSectionId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "revisionNo" INTEGER NOT NULL,
    "contractKind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "verdict" TEXT,
    "owner" TEXT,
    "initiator" TEXT,
    "taskRef" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL,
    "dueOn" DATE,
    "phaseFrom" TEXT,
    "phaseTo" TEXT,
    "cardIds" TEXT[],
    "itemCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioContractRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioContractItem" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "revisionNo" INTEGER NOT NULL,
    "itemKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "pid" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "owner" TEXT,
    "phase" TEXT,
    "dueOn" DATE,
    "dependsOn" TEXT[],
    "titlePlain" TEXT NOT NULL,

    CONSTRAINT "StudioContractItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioDocRef" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "fromDocumentId" TEXT NOT NULL,
    "revisionNo" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "rel" TEXT NOT NULL,
    "targetDocumentId" TEXT NOT NULL,
    "targetPid" TEXT,
    "targetRevisionNo" INTEGER,

    CONSTRAINT "StudioDocRef_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudioContractRecord_contractKind_status_idx" ON "StudioContractRecord"("contractKind", "status");

-- CreateIndex
CREATE INDEX "StudioContractRecord_cardIds_idx" ON "StudioContractRecord" USING GIN ("cardIds");

-- CreateIndex
CREATE UNIQUE INDEX "StudioContractRecord_revisionId_key" ON "StudioContractRecord"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioContractRecord_docSectionId_key" ON "StudioContractRecord"("docSectionId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioContractRecord_documentId_revisionNo_key" ON "StudioContractRecord"("documentId", "revisionNo");

-- CreateIndex
CREATE INDEX "StudioContractItem_itemKey_idx" ON "StudioContractItem"("itemKey");

-- CreateIndex
CREATE INDEX "StudioContractItem_documentId_revisionNo_idx" ON "StudioContractItem"("documentId", "revisionNo");

-- CreateIndex
CREATE UNIQUE INDEX "StudioContractItem_recordId_itemKey_key" ON "StudioContractItem"("recordId", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "StudioContractItem_recordId_position_key" ON "StudioContractItem"("recordId", "position");

-- CreateIndex
CREATE INDEX "StudioDocRef_targetDocumentId_targetPid_idx" ON "StudioDocRef"("targetDocumentId", "targetPid");

-- CreateIndex
CREATE INDEX "StudioDocRef_fromDocumentId_revisionNo_idx" ON "StudioDocRef"("fromDocumentId", "revisionNo");

-- CreateIndex
CREATE UNIQUE INDEX "StudioDocRef_recordId_position_key" ON "StudioDocRef"("recordId", "position");

-- CreateIndex
CREATE INDEX "StudioDocument_contractKind_contractStatus_idx" ON "StudioDocument"("contractKind", "contractStatus");

-- CreateIndex
CREATE INDEX "StudioDocument_contractOwner_idx" ON "StudioDocument"("contractOwner");

-- CreateIndex
CREATE INDEX "StudioDocument_contractTaskRef_idx" ON "StudioDocument"("contractTaskRef");

-- CreateIndex
CREATE INDEX "StudioDocument_contractDueOn_idx" ON "StudioDocument"("contractDueOn");

-- CreateIndex
CREATE INDEX "StudioDocument_contractCardIds_idx" ON "StudioDocument" USING GIN ("contractCardIds");

-- CreateIndex
CREATE INDEX "StudioTemplate_contractKind_idx" ON "StudioTemplate"("contractKind");

-- AddForeignKey
ALTER TABLE "StudioContractRecord" ADD CONSTRAINT "StudioContractRecord_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "StudioRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioContractRecord" ADD CONSTRAINT "StudioContractRecord_docSectionId_fkey" FOREIGN KEY ("docSectionId") REFERENCES "StudioDocSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioContractItem" ADD CONSTRAINT "StudioContractItem_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "StudioContractRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocRef" ADD CONSTRAINT "StudioDocRef_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "StudioContractRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SQL tangan (preseden migrasi 20260927154000): kolom hasil tsvector diisi otomatis Postgres
-- (generated column, BUKAN oleh aplikasi); Prisma tidak mendukung generated column tsvector.
-- Hanya 100000 karakter pertama setiap blok yang terindeks (C42); konfigurasi 'simple' (C41).
ALTER TABLE "StudioDocBlock"
  ADD COLUMN "tsv" tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', left(coalesce("textPlain", ''), 100000))) STORED;

-- CreateIndex (SQL tangan, tidak dideklarasikan di Prisma)
CREATE INDEX "StudioDocBlock_tsv_idx" ON "StudioDocBlock" USING gin ("tsv");
