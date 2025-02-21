-- DropForeignKey
ALTER TABLE "CodeProblem" DROP CONSTRAINT "CodeProblem_interviewId_fkey";

-- DropForeignKey
ALTER TABLE "Interview" DROP CONSTRAINT "Interview_userId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionAnswer" DROP CONSTRAINT "QuestionAnswer_interviewId_fkey";

-- DropForeignKey
ALTER TABLE "ResumeAnalysis" DROP CONSTRAINT "ResumeAnalysis_interviewId_fkey";

-- DropForeignKey
ALTER TABLE "TestCases" DROP CONSTRAINT "TestCases_codeProblemId_fkey";

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeAnalysis" ADD CONSTRAINT "ResumeAnalysis_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAnswer" ADD CONSTRAINT "QuestionAnswer_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeProblem" ADD CONSTRAINT "CodeProblem_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCases" ADD CONSTRAINT "TestCases_codeProblemId_fkey" FOREIGN KEY ("codeProblemId") REFERENCES "CodeProblem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
