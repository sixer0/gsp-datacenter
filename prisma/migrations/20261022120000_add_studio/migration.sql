-- CreateEnum
CREATE TYPE "StudioTier" AS ENUM ('NOTA', 'TERBIT', 'SERAH');

-- CreateEnum
CREATE TYPE "StudioParamClass" AS ENUM ('B', 'K', 'T');

-- CreateEnum
CREATE TYPE "StudioReleaseStatus" AS ENUM ('PENDING', 'PASS', 'FAIL', 'NOT_RUN');

-- CreateEnum
CREATE TYPE "StudioOutputFormat" AS ENUM ('DOCX', 'PDF', 'HTML', 'SVG', 'PNG');

-- CreateEnum
CREATE TYPE "StudioRenderJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "StudioArtifactKind" AS ENUM ('CHART', 'DIAGRAM', 'IMAGE', 'HTML');

-- CreateEnum
CREATE TYPE "StudioTemplateKind" AS ENUM ('DOCUMENT', 'CHART', 'DIAGRAM', 'IMAGE', 'HTML');

-- CreateEnum
CREATE TYPE "StudioSectionGroup" AS ENUM ('DOCUMENT', 'PAGE_DEVICE', 'CHANNEL');

-- CreateEnum
CREATE TYPE "StudioSectionRegister" AS ENUM ('WRAPPER', 'INTERIOR', 'NONE');

-- CreateEnum
CREATE TYPE "StudioOutputRole" AS ENUM ('PRIMARY', 'FIGURE');

-- CreateEnum
CREATE TYPE "StudioNumberSource" AS ENUM ('AGENT', 'SEQUENCE');

-- CreateTable
CREATE TABLE "StudioTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "StudioTemplateKind" NOT NULL,
    "description" TEXT,
    "isCanonical" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "latestVersionNo" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "baseVersionId" TEXT,
    "overrides" JSONB NOT NULL,
    "resolvedParams" JSONB NOT NULL,
    "paramsSha256" TEXT NOT NULL,
    "roleFormats" JSONB NOT NULL,
    "sectionPlan" JSONB NOT NULL,
    "assets" JSONB NOT NULL,
    "provenance" JSONB NOT NULL,
    "changeNote" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioSectionType" (
    "key" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "group" "StudioSectionGroup" NOT NULL,
    "register" "StudioSectionRegister" NOT NULL,
    "name" TEXT NOT NULL,
    "elements" JSONB NOT NULL,
    "paramRefs" TEXT[],
    "ruleRefs" TEXT[],
    "activeTiers" "StudioTier"[],
    "renderable" BOOLEAN NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "registryVersion" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioSectionType_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "StudioDocument" (
    "id" TEXT NOT NULL,
    "docNumber" TEXT NOT NULL,
    "numberSource" "StudioNumberSource" NOT NULL,
    "title" TEXT NOT NULL,
    "typeCode" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ID',
    "classification" TEXT NOT NULL,
    "tier" "StudioTier" NOT NULL,
    "templateId" TEXT NOT NULL,
    "currentRevisionNo" INTEGER NOT NULL DEFAULT 1,
    "missionFolder" TEXT,
    "agentRequestId" TEXT,
    "hermesTaskId" TEXT,
    "createdBy" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioRevision" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "revisionNo" INTEGER NOT NULL,
    "parentRevisionNo" INTEGER,
    "templateVersionId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "snapshotSha256" TEXT NOT NULL,
    "inputSha256" TEXT NOT NULL,
    "docRev" TEXT NOT NULL,
    "changeWhat" TEXT NOT NULL,
    "changeWhy" TEXT NOT NULL,
    "changeImpact" TEXT NOT NULL,
    "changedAddresses" TEXT[],
    "releaseStatus" "StudioReleaseStatus" NOT NULL DEFAULT 'PENDING',
    "lintReport" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioBlock" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "artifactLabel" TEXT,
    "ordinal" INTEGER NOT NULL,
    "chapterKey" TEXT NOT NULL,
    "sectionNo" INTEGER,
    "paraNo" INTEGER,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "textPlain" TEXT NOT NULL,
    "contentSha256" TEXT NOT NULL,

    CONSTRAINT "StudioBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioArtifact" (
    "id" TEXT NOT NULL,
    "kind" "StudioArtifactKind" NOT NULL,
    "schemaId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "label" TEXT,
    "spec" JSONB NOT NULL,
    "specSha256" TEXT NOT NULL,
    "templateVersionId" TEXT,
    "missionFolder" TEXT,
    "agentRequestId" TEXT,
    "hermesTaskId" TEXT,
    "releaseStatus" "StudioReleaseStatus" NOT NULL DEFAULT 'PENDING',
    "lintReport" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioOutputFile" (
    "id" TEXT NOT NULL,
    "documentId" TEXT,
    "revisionId" TEXT,
    "artifactId" TEXT,
    "renderJobId" TEXT,
    "format" "StudioOutputFormat" NOT NULL,
    "role" "StudioOutputRole" NOT NULL,
    "figureLabel" TEXT,
    "relPath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "lintVerdict" "StudioReleaseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioOutputFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioRenderJob" (
    "id" TEXT NOT NULL,
    "documentId" TEXT,
    "revisionId" TEXT,
    "artifactId" TEXT,
    "formats" "StudioOutputFormat"[],
    "status" "StudioRenderJobStatus" NOT NULL DEFAULT 'QUEUED',
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "engine" JSONB,
    "requestedBy" TEXT NOT NULL,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,

    CONSTRAINT "StudioRenderJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudioTemplate_slug_key" ON "StudioTemplate"("slug");

-- CreateIndex
CREATE INDEX "StudioTemplate_kind_idx" ON "StudioTemplate"("kind");

-- CreateIndex
CREATE INDEX "StudioTemplate_archived_idx" ON "StudioTemplate"("archived");

-- CreateIndex
CREATE INDEX "StudioTemplateVersion_baseVersionId_idx" ON "StudioTemplateVersion"("baseVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioTemplateVersion_templateId_versionNo_key" ON "StudioTemplateVersion"("templateId", "versionNo");

-- CreateIndex
CREATE UNIQUE INDEX "StudioSectionType_catalogId_key" ON "StudioSectionType"("catalogId");

-- CreateIndex
CREATE INDEX "StudioSectionType_group_idx" ON "StudioSectionType"("group");

-- CreateIndex
CREATE UNIQUE INDEX "StudioDocument_docNumber_key" ON "StudioDocument"("docNumber");

-- CreateIndex
CREATE INDEX "StudioDocument_missionFolder_idx" ON "StudioDocument"("missionFolder");

-- CreateIndex
CREATE INDEX "StudioDocument_agentRequestId_idx" ON "StudioDocument"("agentRequestId");

-- CreateIndex
CREATE INDEX "StudioDocument_hermesTaskId_idx" ON "StudioDocument"("hermesTaskId");

-- CreateIndex
CREATE INDEX "StudioDocument_templateId_idx" ON "StudioDocument"("templateId");

-- CreateIndex
CREATE INDEX "StudioDocument_createdAt_idx" ON "StudioDocument"("createdAt");

-- CreateIndex
CREATE INDEX "StudioRevision_templateVersionId_idx" ON "StudioRevision"("templateVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioRevision_documentId_revisionNo_key" ON "StudioRevision"("documentId", "revisionNo");

-- CreateIndex
CREATE INDEX "StudioBlock_revisionId_blockId_idx" ON "StudioBlock"("revisionId", "blockId");

-- CreateIndex
CREATE INDEX "StudioBlock_revisionId_artifactLabel_idx" ON "StudioBlock"("revisionId", "artifactLabel");

-- CreateIndex
CREATE INDEX "StudioBlock_revisionId_type_idx" ON "StudioBlock"("revisionId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "StudioBlock_revisionId_address_key" ON "StudioBlock"("revisionId", "address");

-- CreateIndex
CREATE UNIQUE INDEX "StudioBlock_revisionId_ordinal_key" ON "StudioBlock"("revisionId", "ordinal");

-- CreateIndex
CREATE INDEX "StudioArtifact_kind_idx" ON "StudioArtifact"("kind");

-- CreateIndex
CREATE INDEX "StudioArtifact_missionFolder_idx" ON "StudioArtifact"("missionFolder");

-- CreateIndex
CREATE INDEX "StudioArtifact_agentRequestId_idx" ON "StudioArtifact"("agentRequestId");

-- CreateIndex
CREATE INDEX "StudioArtifact_createdAt_idx" ON "StudioArtifact"("createdAt");

-- CreateIndex
CREATE INDEX "StudioOutputFile_documentId_revisionId_idx" ON "StudioOutputFile"("documentId", "revisionId");

-- CreateIndex
CREATE INDEX "StudioOutputFile_artifactId_idx" ON "StudioOutputFile"("artifactId");

-- CreateIndex
CREATE INDEX "StudioOutputFile_sha256_idx" ON "StudioOutputFile"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "StudioOutputFile_relPath_key" ON "StudioOutputFile"("relPath");

-- CreateIndex
CREATE INDEX "StudioRenderJob_status_idx" ON "StudioRenderJob"("status");

-- CreateIndex
CREATE INDEX "StudioRenderJob_documentId_idx" ON "StudioRenderJob"("documentId");

-- CreateIndex
CREATE INDEX "StudioRenderJob_artifactId_idx" ON "StudioRenderJob"("artifactId");

-- CreateIndex
CREATE INDEX "StudioRenderJob_queuedAt_idx" ON "StudioRenderJob"("queuedAt");

-- AddForeignKey
ALTER TABLE "StudioTemplateVersion" ADD CONSTRAINT "StudioTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "StudioTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioTemplateVersion" ADD CONSTRAINT "StudioTemplateVersion_baseVersionId_fkey" FOREIGN KEY ("baseVersionId") REFERENCES "StudioTemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocument" ADD CONSTRAINT "StudioDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "StudioTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioRevision" ADD CONSTRAINT "StudioRevision_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "StudioDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioRevision" ADD CONSTRAINT "StudioRevision_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "StudioTemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioBlock" ADD CONSTRAINT "StudioBlock_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "StudioRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioArtifact" ADD CONSTRAINT "StudioArtifact_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "StudioTemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioOutputFile" ADD CONSTRAINT "StudioOutputFile_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "StudioDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioOutputFile" ADD CONSTRAINT "StudioOutputFile_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "StudioRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioOutputFile" ADD CONSTRAINT "StudioOutputFile_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "StudioArtifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioOutputFile" ADD CONSTRAINT "StudioOutputFile_renderJobId_fkey" FOREIGN KEY ("renderJobId") REFERENCES "StudioRenderJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioRenderJob" ADD CONSTRAINT "StudioRenderJob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "StudioDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioRenderJob" ADD CONSTRAINT "StudioRenderJob_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "StudioRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioRenderJob" ADD CONSTRAINT "StudioRenderJob_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "StudioArtifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
