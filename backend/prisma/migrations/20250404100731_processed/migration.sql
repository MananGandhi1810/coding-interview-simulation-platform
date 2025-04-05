-- CreateEnum
CREATE TYPE "ResultProcessingState" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'ERROR');

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "resultState" "ResultProcessingState" NOT NULL DEFAULT 'PENDING';
