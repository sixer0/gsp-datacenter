-- ILFIX-0927 F1-3 / keputusan controller D-06 (contract.md)
-- Menambal DRIFT pre-existing: kolom "requestedBy" sudah ada di schema.prisma HEAD
-- (baris 484) dan sudah hidup di produksi gsp_agent_hq (dikonfirmasi via
-- information_schema oleh controller 27-09 ~15:5x, dan oleh gsp-coder-execution
-- kartu t_703ce887 hari ini), TAPI tidak pernah punya berkas migrasi (db push
-- masa lalu). Tanpa berkas ini, `prisma migrate diff --from-migrations` menuntut
-- kolom tersebut dan rantai migrasi tidak lengkap -> deploy produksi di F4 tidak
-- deterministik.
--
-- Sifat: murni aditif, idempoten (IF NOT EXISTS):
--   - produksi: kolom sudah ada -> statement no-op;
--   - DB uji bersih (ilfix_uji): kolom ditambahkan sehingga state == datamodel.
-- Tipe persis datamodel: `requestedBy String?` -> TEXT NULL (tanpa default).
-- DILARANG `prisma db push` terhadap DB yang memuat IlSearchDoc (MIGRATION-NOTE §7.2).

ALTER TABLE "AgentRequest" ADD COLUMN IF NOT EXISTS "requestedBy" TEXT;
