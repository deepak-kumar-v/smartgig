-- CreateIndex
CREATE INDEX "EscrowLock_escrowId_released_idx" ON "EscrowLock"("escrowId", "released");

-- CreateIndex
CREATE INDEX "EscrowLock_milestoneId_idx" ON "EscrowLock"("milestoneId");

-- CreateIndex
CREATE INDEX "FinancialErrorLog_createdAt_idx" ON "FinancialErrorLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "FinancialErrorLog_action_idx" ON "FinancialErrorLog"("action");

-- CreateIndex
CREATE INDEX "FinancialMutationLog_createdAt_idx" ON "FinancialMutationLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "FinancialMutationLog_action_idx" ON "FinancialMutationLog"("action");

-- CreateIndex
CREATE INDEX "WalletLedger_walletId_createdAt_idx" ON "WalletLedger"("walletId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WalletLedger_milestoneId_type_idx" ON "WalletLedger"("milestoneId", "type");

-- CreateIndex
CREATE INDEX "WalletLedger_contractId_type_idx" ON "WalletLedger"("contractId", "type");

-- CreateIndex
CREATE INDEX "WalletLedger_type_createdAt_idx" ON "WalletLedger"("type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WithdrawalRequest_userId_status_idx" ON "WithdrawalRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_status_createdAt_idx" ON "WithdrawalRequest"("status", "createdAt");
