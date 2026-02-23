/*
  Warnings:

  - You are about to drop the column `escrowStatus` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `trialAmount` on the `Contract` table. All the data in the column will be lost.
  - The `status` column on the `Contract` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Milestone` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `MockEscrowTransaction` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `type` on the `EscrowTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `title` to the `Milestone` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `WalletLedger` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACCEPTED', 'FINALIZED', 'FUNDED', 'ACTIVE', 'COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'PAID', 'DISPUTED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('PENDING', 'FUNDED', 'DISPUTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "EscrowTransactionType" AS ENUM ('DEPOSIT', 'RELEASE', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('ESCROW_DEPOSIT', 'ESCROW_RELEASE', 'ESCROW_REFUND', 'WITHDRAWAL', 'WITHDRAWAL_FEE', 'PLATFORM_FEE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ChangeRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActorRole" AS ENUM ('CLIENT', 'FREELANCER', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "MockEscrowTransaction" DROP CONSTRAINT "MockEscrowTransaction_contractId_fkey";

-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "escrowStatus",
DROP COLUMN "trialAmount",
ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "finalizedAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "EscrowAccount" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "EscrowStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "totalRefunded" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "EscrowTransaction" ADD COLUMN     "description" TEXT,
ADD COLUMN     "milestoneId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "EscrowTransactionType" NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "replyToId" TEXT;

-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "title" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "WalletLedger" ADD COLUMN     "milestoneId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "WalletTransactionType" NOT NULL;

-- DropTable
DROP TABLE "MockEscrowTransaction";

-- CreateTable
CREATE TABLE "MilestoneChangeRequest" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "proposedTitle" TEXT,
    "proposedDescription" TEXT,
    "proposedAmount" DOUBLE PRECISION,
    "proposedDueDate" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "status" "ChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "MilestoneChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageVersion" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedBy" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "previousVersionId" TEXT,
    "contentHash" TEXT,

    CONSTRAINT "MessageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifecycleEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "proposalId" TEXT,
    "contractId" TEXT,
    "milestoneId" TEXT,
    "eventType" TEXT NOT NULL,
    "devState" TEXT,
    "userMessage" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" "ActorRole" NOT NULL,
    "metadata" JSONB,
    "category" TEXT NOT NULL DEFAULT 'BUSINESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifecycleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_key" ON "MessageReaction"("messageId", "userId");

-- CreateIndex
CREATE INDEX "MessageVersion_messageId_idx" ON "MessageVersion"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageVersion_messageId_versionNumber_key" ON "MessageVersion"("messageId", "versionNumber");

-- CreateIndex
CREATE INDEX "LifecycleEvent_contractId_idx" ON "LifecycleEvent"("contractId");

-- CreateIndex
CREATE INDEX "LifecycleEvent_jobId_idx" ON "LifecycleEvent"("jobId");

-- AddForeignKey
ALTER TABLE "EscrowTransaction" ADD CONSTRAINT "EscrowTransaction_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneChangeRequest" ADD CONSTRAINT "MilestoneChangeRequest_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneChangeRequest" ADD CONSTRAINT "MilestoneChangeRequest_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "FreelancerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageVersion" ADD CONSTRAINT "MessageVersion_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
