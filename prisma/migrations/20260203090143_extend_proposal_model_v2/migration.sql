/*
  Warnings:

  - Added the required column `updatedAt` to the `Proposal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "acceptsTrialTask" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "attachments" TEXT,
ADD COLUMN     "availability" TEXT,
ADD COLUMN     "availabilityHoursPerWeek" INTEGER,
ADD COLUMN     "boosted" BOOLEAN,
ADD COLUMN     "confidenceScore" DOUBLE PRECISION,
ADD COLUMN     "contractToHireAcceptance" BOOLEAN,
ADD COLUMN     "expectedStartDate" TIMESTAMP(3),
ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastEditedAt" TIMESTAMP(3),
ADD COLUMN     "milestones" TEXT,
ADD COLUMN     "privateNotes" TEXT,
ADD COLUMN     "rateType" TEXT NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "screeningAnswers" TEXT,
ADD COLUMN     "selectedPortfolioIds" TEXT,
ADD COLUMN     "totalMilestoneAmount" DOUBLE PRECISION,
ADD COLUMN     "trialTaskProposal" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
