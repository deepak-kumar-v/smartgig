/*
  Warnings:

  - You are about to drop the column `attachments` on the `Proposal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Proposal" DROP COLUMN "attachments",
ADD COLUMN     "attachmentsMeta" TEXT;
