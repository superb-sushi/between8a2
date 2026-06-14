/*
  Warnings:

  - Added the required column `adminId` to the `Answer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "adminId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Answer_adminId_idx" ON "Answer"("adminId");

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
