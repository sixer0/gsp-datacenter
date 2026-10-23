-- CreateEnum
CREATE TYPE "StudioSlotContentMode" AS ENUM ('AUTO', 'INPUT', 'MIXED');

-- CreateEnum
CREATE TYPE "StudioRenderScopeKind" AS ENUM ('DOCUMENT', 'CHAPTER', 'SLOT');

-- CreateEnum
CREATE TYPE "StudioCompleteness" AS ENUM ('INCOMPLETE', 'COMPLETE');

-- AlterTable
ALTER TABLE "StudioDocument" ADD COLUMN     "completeness" "StudioCompleteness" NOT NULL DEFAULT 'COMPLETE',
ADD COLUMN     "missionDocKey" TEXT;

-- AlterTable
ALTER TABLE "StudioOutputFile" ADD COLUMN     "draft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scopeKey" TEXT,
ADD COLUMN     "scopeKind" "StudioRenderScopeKind" NOT NULL DEFAULT 'DOCUMENT';

-- AlterTable
ALTER TABLE "StudioRenderJob" ADD COLUMN     "scopeKey" TEXT,
ADD COLUMN     "scopeKind" "StudioRenderScopeKind" NOT NULL DEFAULT 'DOCUMENT';

-- AlterTable
ALTER TABLE "StudioRevision" ADD COLUMN     "changeScope" TEXT,
ADD COLUMN     "completeness" "StudioCompleteness" NOT NULL DEFAULT 'COMPLETE',
ADD COLUMN     "completenessReport" JSONB,
ADD COLUMN     "schemaId" TEXT NOT NULL DEFAULT 'studio.doc/v1',
ADD COLUMN     "structureSha256" TEXT;

-- AlterTable
ALTER TABLE "StudioTemplate" ADD COLUMN     "isPreset" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "StudioTemplateVersion" ADD COLUMN     "skeletonSha256" TEXT;

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
CREATE UNIQUE INDEX "StudioDocument_missionFolder_missionDocKey_key" ON "StudioDocument"("missionFolder", "missionDocKey");

-- CreateIndex
CREATE INDEX "StudioTemplate_isPreset_idx" ON "StudioTemplate"("isPreset");

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
