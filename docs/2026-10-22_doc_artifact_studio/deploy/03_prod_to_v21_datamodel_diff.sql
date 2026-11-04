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

-- CreateEnum
CREATE TYPE "StudioSlotContentMode" AS ENUM ('AUTO', 'INPUT', 'MIXED');

-- CreateEnum
CREATE TYPE "StudioRenderScopeKind" AS ENUM ('DOCUMENT', 'CHAPTER', 'SLOT');

-- CreateEnum
CREATE TYPE "StudioCompleteness" AS ENUM ('INCOMPLETE', 'COMPLETE');

-- CreateTable
CREATE TABLE "IlSearchDoc" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "domain" TEXT,
    "project" TEXT,
    "type" TEXT NOT NULL DEFAULT 'note',
    "status" TEXT NOT NULL DEFAULT 'active',
    "rank" INTEGER NOT NULL DEFAULT 3,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tsv" tsvector,

    CONSTRAINT "IlSearchDoc_pkey" PRIMARY KEY ("id")
);

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
    "isPreset" BOOLEAN NOT NULL DEFAULT false,
    "contractKind" TEXT,

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
    "skeletonSha256" TEXT,

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
    "missionDocKey" TEXT,
    "completeness" "StudioCompleteness" NOT NULL DEFAULT 'COMPLETE',
    "contractKind" TEXT,
    "contractStatus" TEXT,
    "contractOwner" TEXT,
    "contractTaskRef" TEXT,
    "contractDueOn" DATE,
    "contractCardIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

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
    "schemaId" TEXT NOT NULL DEFAULT 'studio.doc/v1',
    "structureSha256" TEXT,
    "completeness" "StudioCompleteness" NOT NULL DEFAULT 'COMPLETE',
    "completenessReport" JSONB,
    "changeScope" TEXT,

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
    "scopeKind" "StudioRenderScopeKind" NOT NULL DEFAULT 'DOCUMENT',
    "scopeKey" TEXT,
    "draft" BOOLEAN NOT NULL DEFAULT false,

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
    "scopeKind" "StudioRenderScopeKind" NOT NULL DEFAULT 'DOCUMENT',
    "scopeKey" TEXT,

    CONSTRAINT "StudioRenderJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioTemplateSlot" (
    "id" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "sectionTypeKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "positionLocked" BOOLEAN NOT NULL DEFAULT false,
    "repeatable" BOOLEAN NOT NULL DEFAULT false,
    "minItems" INTEGER,
    "maxItems" INTEGER,
    "contentMode" "StudioSlotContentMode" NOT NULL,
    "tiers" "StudioTier"[],
    "admits" TEXT[],
    "configSha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioTemplateSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioTemplateSlotParam" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "paramKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "paramClass" "StudioParamClass" NOT NULL,
    "surface" TEXT NOT NULL,

    CONSTRAINT "StudioTemplateSlotParam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioTemplateSlotRoleFormat" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "format" JSONB NOT NULL,

    CONSTRAINT "StudioTemplateSlotRoleFormat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioAsset" (
    "id" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "widthPx" INTEGER NOT NULL,
    "heightPx" INTEGER NOT NULL,
    "relPath" TEXT NOT NULL,
    "missionFolder" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioDocSection" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "templateSlotId" TEXT,
    "slotKey" TEXT NOT NULL,
    "sectionTypeKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "filled" BOOLEAN NOT NULL,
    "payload" JSONB,
    "payloadSha256" TEXT NOT NULL,
    "lastFilledBy" TEXT,
    "lastFilledAt" TIMESTAMP(3),
    "lastFilledRevisionNo" INTEGER,

    CONSTRAINT "StudioDocSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioDocChapter" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "docSectionId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "chapterKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "partKey" TEXT,
    "title" JSONB NOT NULL,
    "shortTitle" TEXT,
    "contentSha256" TEXT NOT NULL,
    "lastFilledBy" TEXT,
    "lastFilledAt" TIMESTAMP(3),
    "lastFilledRevisionNo" INTEGER,

    CONSTRAINT "StudioDocChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioDocSubsection" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "sectionNo" INTEGER NOT NULL,
    "title" JSONB,
    "contentSha256" TEXT NOT NULL,

    CONSTRAINT "StudioDocSubsection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioDocBlock" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "docSectionId" TEXT NOT NULL,
    "chapterId" TEXT,
    "subsectionId" TEXT,
    "identityId" TEXT NOT NULL,
    "pid" TEXT NOT NULL,
    "address" TEXT,
    "artifactLabel" TEXT,
    "ordinal" INTEGER NOT NULL,
    "paraNo" INTEGER,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "textPlain" TEXT NOT NULL,
    "contentSha256" TEXT NOT NULL,
    "assetId" TEXT,
    "tsv" tsvector,

    CONSTRAINT "StudioDocBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioDocIdentity" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "pid" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdRevisionNo" INTEGER NOT NULL,
    "retiredRevisionNo" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioDocIdentity_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "StudioTemplate_slug_key" ON "StudioTemplate"("slug");

-- CreateIndex
CREATE INDEX "StudioTemplate_kind_idx" ON "StudioTemplate"("kind");

-- CreateIndex
CREATE INDEX "StudioTemplate_archived_idx" ON "StudioTemplate"("archived");

-- CreateIndex
CREATE INDEX "StudioTemplate_isPreset_idx" ON "StudioTemplate"("isPreset");

-- CreateIndex
CREATE INDEX "StudioTemplate_contractKind_idx" ON "StudioTemplate"("contractKind");

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
CREATE UNIQUE INDEX "StudioDocument_missionFolder_missionDocKey_key" ON "StudioDocument"("missionFolder", "missionDocKey");

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

-- CreateIndex
CREATE INDEX "StudioTemplateSlot_sectionTypeKey_idx" ON "StudioTemplateSlot"("sectionTypeKey");

-- CreateIndex
CREATE UNIQUE INDEX "StudioTemplateSlot_templateVersionId_slotKey_key" ON "StudioTemplateSlot"("templateVersionId", "slotKey");

-- CreateIndex
CREATE UNIQUE INDEX "StudioTemplateSlot_templateVersionId_position_key" ON "StudioTemplateSlot"("templateVersionId", "position");

-- CreateIndex
CREATE INDEX "StudioTemplateSlotParam_paramKey_idx" ON "StudioTemplateSlotParam"("paramKey");

-- CreateIndex
CREATE UNIQUE INDEX "StudioTemplateSlotParam_slotId_paramKey_key" ON "StudioTemplateSlotParam"("slotId", "paramKey");

-- CreateIndex
CREATE UNIQUE INDEX "StudioTemplateSlotRoleFormat_slotId_roleKey_key" ON "StudioTemplateSlotRoleFormat"("slotId", "roleKey");

-- CreateIndex
CREATE UNIQUE INDEX "StudioAsset_sha256_key" ON "StudioAsset"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "StudioAsset_relPath_key" ON "StudioAsset"("relPath");

-- CreateIndex
CREATE INDEX "StudioAsset_missionFolder_idx" ON "StudioAsset"("missionFolder");

-- CreateIndex
CREATE INDEX "StudioDocSection_templateSlotId_idx" ON "StudioDocSection"("templateSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioDocSection_revisionId_slotKey_key" ON "StudioDocSection"("revisionId", "slotKey");

-- CreateIndex
CREATE UNIQUE INDEX "StudioDocSection_revisionId_position_key" ON "StudioDocSection"("revisionId", "position");

-- CreateIndex
CREATE INDEX "StudioDocChapter_revisionId_contentSha256_idx" ON "StudioDocChapter"("revisionId", "contentSha256");

-- CreateIndex
CREATE INDEX "StudioDocChapter_identityId_idx" ON "StudioDocChapter"("identityId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioDocChapter_revisionId_chapterKey_key" ON "StudioDocChapter"("revisionId", "chapterKey");

-- CreateIndex
CREATE UNIQUE INDEX "StudioDocChapter_docSectionId_position_key" ON "StudioDocChapter"("docSectionId", "position");

-- CreateIndex
CREATE INDEX "StudioDocSubsection_identityId_idx" ON "StudioDocSubsection"("identityId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioDocSubsection_chapterId_sectionNo_key" ON "StudioDocSubsection"("chapterId", "sectionNo");

-- CreateIndex
CREATE INDEX "StudioDocBlock_subsectionId_paraNo_idx" ON "StudioDocBlock"("subsectionId", "paraNo");

-- CreateIndex
CREATE INDEX "StudioDocBlock_identityId_idx" ON "StudioDocBlock"("identityId");

-- CreateIndex
CREATE INDEX "StudioDocBlock_revisionId_artifactLabel_idx" ON "StudioDocBlock"("revisionId", "artifactLabel");

-- CreateIndex
CREATE INDEX "StudioDocBlock_revisionId_type_idx" ON "StudioDocBlock"("revisionId", "type");

-- CreateIndex
CREATE INDEX "StudioDocBlock_assetId_idx" ON "StudioDocBlock"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioDocBlock_revisionId_ordinal_key" ON "StudioDocBlock"("revisionId", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "StudioDocBlock_revisionId_pid_key" ON "StudioDocBlock"("revisionId", "pid");

-- CreateIndex
CREATE UNIQUE INDEX "StudioDocBlock_revisionId_address_key" ON "StudioDocBlock"("revisionId", "address");

-- CreateIndex
CREATE INDEX "StudioDocIdentity_documentId_kind_idx" ON "StudioDocIdentity"("documentId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "StudioDocIdentity_documentId_pid_key" ON "StudioDocIdentity"("documentId", "pid");

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

-- AddForeignKey
ALTER TABLE "StudioTemplateSlot" ADD CONSTRAINT "StudioTemplateSlot_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "StudioTemplateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioTemplateSlot" ADD CONSTRAINT "StudioTemplateSlot_sectionTypeKey_fkey" FOREIGN KEY ("sectionTypeKey") REFERENCES "StudioSectionType"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioTemplateSlotParam" ADD CONSTRAINT "StudioTemplateSlotParam_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "StudioTemplateSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioTemplateSlotRoleFormat" ADD CONSTRAINT "StudioTemplateSlotRoleFormat_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "StudioTemplateSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocSection" ADD CONSTRAINT "StudioDocSection_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "StudioRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocSection" ADD CONSTRAINT "StudioDocSection_templateSlotId_fkey" FOREIGN KEY ("templateSlotId") REFERENCES "StudioTemplateSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocSection" ADD CONSTRAINT "StudioDocSection_sectionTypeKey_fkey" FOREIGN KEY ("sectionTypeKey") REFERENCES "StudioSectionType"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocChapter" ADD CONSTRAINT "StudioDocChapter_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "StudioRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocChapter" ADD CONSTRAINT "StudioDocChapter_docSectionId_fkey" FOREIGN KEY ("docSectionId") REFERENCES "StudioDocSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocChapter" ADD CONSTRAINT "StudioDocChapter_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "StudioDocIdentity"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocSubsection" ADD CONSTRAINT "StudioDocSubsection_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "StudioRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocSubsection" ADD CONSTRAINT "StudioDocSubsection_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "StudioDocChapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocSubsection" ADD CONSTRAINT "StudioDocSubsection_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "StudioDocIdentity"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocBlock" ADD CONSTRAINT "StudioDocBlock_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "StudioRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocBlock" ADD CONSTRAINT "StudioDocBlock_docSectionId_fkey" FOREIGN KEY ("docSectionId") REFERENCES "StudioDocSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocBlock" ADD CONSTRAINT "StudioDocBlock_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "StudioDocChapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocBlock" ADD CONSTRAINT "StudioDocBlock_subsectionId_fkey" FOREIGN KEY ("subsectionId") REFERENCES "StudioDocSubsection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocBlock" ADD CONSTRAINT "StudioDocBlock_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "StudioDocIdentity"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocBlock" ADD CONSTRAINT "StudioDocBlock_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "StudioAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocIdentity" ADD CONSTRAINT "StudioDocIdentity_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "StudioDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioContractRecord" ADD CONSTRAINT "StudioContractRecord_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "StudioRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioContractRecord" ADD CONSTRAINT "StudioContractRecord_docSectionId_fkey" FOREIGN KEY ("docSectionId") REFERENCES "StudioDocSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioContractItem" ADD CONSTRAINT "StudioContractItem_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "StudioContractRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioDocRef" ADD CONSTRAINT "StudioDocRef_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "StudioContractRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

