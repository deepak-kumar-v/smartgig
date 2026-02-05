/*
  Warnings:

  - You are about to drop the column `proposalId` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `attachmentsMeta` on the `Proposal` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[jobId,freelancerId]` on the table `Proposal` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_proposalId_fkey";

-- AlterTable
ALTER TABLE "Attachment" DROP COLUMN "proposalId";

-- AlterTable
ALTER TABLE "Proposal" DROP COLUMN "attachmentsMeta",
ADD COLUMN     "attachments" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_jobId_freelancerId_key" ON "Proposal"("jobId", "freelancerId");
