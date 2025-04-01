/*
  Warnings:

  - You are about to drop the column `problemStatement` on the `CodeProblem` table. All the data in the column will be lost.
  - Added the required column `description` to the `CodeProblem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `CodeProblem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProblemDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable
ALTER TABLE "CodeProblem" DROP COLUMN "problemStatement",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "difficulty" "ProblemDifficulty" NOT NULL DEFAULT 'EASY',
ADD COLUMN     "title" TEXT NOT NULL;
