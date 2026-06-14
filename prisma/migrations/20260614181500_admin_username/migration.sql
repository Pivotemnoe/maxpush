-- AlterTable
ALTER TABLE "AdminCredential" ADD COLUMN "username" TEXT NOT NULL DEFAULT 'admin';

-- CreateIndex
CREATE UNIQUE INDEX "AdminCredential_username_key" ON "AdminCredential"("username");
