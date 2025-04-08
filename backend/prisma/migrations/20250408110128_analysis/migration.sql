-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "codeAnalysisId" TEXT,
ADD COLUMN     "qaAnalysisId" TEXT;

-- CreateTable
CREATE TABLE "QaAnalysis" (
    "id" TEXT NOT NULL,
    "correctness" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "questionAnswerId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interviewId" TEXT NOT NULL,

    CONSTRAINT "QaAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeAnalysis" (
    "id" TEXT NOT NULL,
    "review" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codeProblemId" TEXT NOT NULL,

    CONSTRAINT "CodeAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodeAnalysis_interviewId_key" ON "CodeAnalysis"("interviewId");

-- AddForeignKey
ALTER TABLE "QaAnalysis" ADD CONSTRAINT "QaAnalysis_questionAnswerId_fkey" FOREIGN KEY ("questionAnswerId") REFERENCES "QuestionAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QaAnalysis" ADD CONSTRAINT "QaAnalysis_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeAnalysis" ADD CONSTRAINT "CodeAnalysis_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeAnalysis" ADD CONSTRAINT "CodeAnalysis_codeProblemId_fkey" FOREIGN KEY ("codeProblemId") REFERENCES "CodeProblem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
