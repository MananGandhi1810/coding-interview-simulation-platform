/*
  Warnings:

  - You are about to drop the column `interviewId` on the `CodeProblem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CodeProblem" DROP CONSTRAINT "CodeProblem_interviewId_fkey";

-- AlterTable
ALTER TABLE "CodeProblem" DROP COLUMN "interviewId";

-- CreateTable
CREATE TABLE "InterviewCodeProblem" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "codeProblemId" TEXT NOT NULL,

    CONSTRAINT "InterviewCodeProblem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InterviewCodeProblem" ADD CONSTRAINT "InterviewCodeProblem_codeProblemId_fkey" FOREIGN KEY ("codeProblemId") REFERENCES "CodeProblem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewCodeProblem" ADD CONSTRAINT "InterviewCodeProblem_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
