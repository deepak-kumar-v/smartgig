-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "adminInquiryOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "clientMutedUntil" TIMESTAMP(3),
ADD COLUMN     "freelancerMutedUntil" TIMESTAMP(3);
