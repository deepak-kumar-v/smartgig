/*
  Warnings:

  - You are about to alter the column `amount` on the `EscrowLock` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `amount` on the `Milestone` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `amount` on the `WalletLedger` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - A unique constraint covering the columns `[escrowId,milestoneId]` on the table `EscrowLock` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "EscrowLock" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "Milestone" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "WalletLedger" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- CreateIndex
CREATE UNIQUE INDEX "EscrowLock_escrowId_milestoneId_key" ON "EscrowLock"("escrowId", "milestoneId");
