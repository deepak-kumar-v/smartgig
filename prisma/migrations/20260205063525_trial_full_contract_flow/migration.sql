/*
  Warnings:

  - A unique constraint covering the columns `[proposalId,type]` on the table `Contract` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Contract_proposalId_key";

-- AlterTable
ALTER TABLE "Contract" ALTER COLUMN "type" SET DEFAULT 'FULL';

-- CreateIndex
CREATE UNIQUE INDEX "Contract_proposalId_type_key" ON "Contract"("proposalId", "type");
