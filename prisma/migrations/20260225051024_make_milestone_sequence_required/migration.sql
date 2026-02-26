/*
  Warnings:

  - A unique constraint covering the columns `[contractId,sequence]` on the table `Milestone` will be added. If there are existing duplicate values, this will fail.
  - Made the column `sequence` on table `Milestone` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Milestone" ALTER COLUMN "sequence" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_contractId_sequence_key" ON "Milestone"("contractId", "sequence");
