-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "discussionEndedAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "discussionEndedAcceptedById" TEXT,
ADD COLUMN     "discussionEndedRequestedAt" TIMESTAMP(3),
ADD COLUMN     "discussionEndedRequestedById" TEXT,
ADD COLUMN     "proposalAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "proposalAcceptedById" TEXT,
ADD COLUMN     "proposalRequestedAt" TIMESTAMP(3),
ADD COLUMN     "proposalRequestedById" TEXT;
