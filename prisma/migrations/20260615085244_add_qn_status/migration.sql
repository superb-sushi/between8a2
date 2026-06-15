/*
  Warnings:

  - The values [APPROVED] on the enum `QuestionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QuestionStatus_new" AS ENUM ('PENDING', 'APPROVED');
ALTER TABLE "public"."Question" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Question" ALTER COLUMN "status" TYPE "QuestionStatus_new" USING ("status"::text::"QuestionStatus_new");
ALTER TYPE "QuestionStatus" RENAME TO "QuestionStatus_old";
ALTER TYPE "QuestionStatus_new" RENAME TO "QuestionStatus";
DROP TYPE "public"."QuestionStatus_old";
ALTER TABLE "Question" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
