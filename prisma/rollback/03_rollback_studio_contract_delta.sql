-- Rollback delta document contract. Tanpa CASCADE: gagal keras bila ada ketergantungan tak terduga.
BEGIN;
DROP TABLE IF EXISTS "StudioDocRef";
DROP TABLE IF EXISTS "StudioContractItem";
DROP TABLE IF EXISTS "StudioContractRecord";
DROP INDEX IF EXISTS "StudioDocBlock_tsv_idx";
ALTER TABLE "StudioDocBlock" DROP COLUMN IF EXISTS "tsv";
DROP INDEX IF EXISTS "StudioDocument_contractKind_contractStatus_idx";
DROP INDEX IF EXISTS "StudioDocument_contractOwner_idx";
DROP INDEX IF EXISTS "StudioDocument_contractTaskRef_idx";
DROP INDEX IF EXISTS "StudioDocument_contractDueOn_idx";
DROP INDEX IF EXISTS "StudioDocument_contractCardIds_idx";
ALTER TABLE "StudioDocument" DROP COLUMN IF EXISTS "contractKind", DROP COLUMN IF EXISTS "contractStatus", DROP COLUMN IF EXISTS "contractOwner", DROP COLUMN IF EXISTS "contractTaskRef", DROP COLUMN IF EXISTS "contractDueOn", DROP COLUMN IF EXISTS "contractCardIds";
DROP INDEX IF EXISTS "StudioTemplate_contractKind_idx";
ALTER TABLE "StudioTemplate" DROP COLUMN IF EXISTS "contractKind";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261030220000_add_studio_contract';
COMMIT;
