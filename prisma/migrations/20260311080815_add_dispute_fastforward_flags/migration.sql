-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "phaseAdvanceClient" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phaseAdvanceFreelancer" BOOLEAN NOT NULL DEFAULT false;
