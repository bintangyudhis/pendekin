-- Sistem akun pendekin: tabel pengguna + sesi dengan nama berprefiks
-- Pendekin, karena database ini dipakai bersama repo lain yang sudah
-- punya tabel "User" sendiri (dompetku-web).

-- CreateTable
CREATE TABLE "PendekinUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nama" TEXT,
    "kataSandiHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendekinUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendekinSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendekinSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendekinUser_email_key" ON "PendekinUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PendekinSession_tokenHash_key" ON "PendekinSession"("tokenHash");

-- CreateIndex
CREATE INDEX "PendekinSession_userId_idx" ON "PendekinSession"("userId");

-- AlterTable
ALTER TABLE "Link" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE INDEX "Link_userId_createdAt_idx" ON "Link"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PendekinSession" ADD CONSTRAINT "PendekinSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PendekinUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PendekinUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
