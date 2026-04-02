-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "proposalEscalatedAt" TIMESTAMP(3),
ADD COLUMN     "proposalEscalatedById" TEXT;
