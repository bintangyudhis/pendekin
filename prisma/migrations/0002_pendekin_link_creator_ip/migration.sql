-- AlterTable
ALTER TABLE "Link" ADD COLUMN "creatorIp" TEXT;

-- CreateIndex
CREATE INDEX "Link_creatorIp_createdAt_idx" ON "Link"("creatorIp", "createdAt");
