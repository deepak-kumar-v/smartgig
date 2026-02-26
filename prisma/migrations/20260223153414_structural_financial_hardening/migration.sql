/*
  Warnings:

  - A unique constraint covering the columns `[milestoneId,type]` on the table `WalletLedger` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WalletLedger_milestoneId_type_key" ON "WalletLedger"("milestoneId", "type");
