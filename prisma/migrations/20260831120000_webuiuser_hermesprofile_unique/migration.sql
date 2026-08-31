-- DropIndex
DROP INDEX "WebUiUser_hermesProfile_idx";

-- CreateIndex
CREATE UNIQUE INDEX "WebUiUser_hermesProfile_key" ON "WebUiUser"("hermesProfile");

