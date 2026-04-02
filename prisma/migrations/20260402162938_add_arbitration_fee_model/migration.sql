-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WalletTransactionType" ADD VALUE 'ARBITRATION_FEE';
ALTER TYPE "WalletTransactionType" ADD VALUE 'ARBITRATION_FEE_REFUND';

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "arbitrationFeePaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "arbitrationFeePayerId" TEXT;

-- AlterTable
ALTER TABLE "WalletLedger" ADD COLUMN     "disputeId" TEXT;

-- CreateIndex
CREATE INDEX "WalletLedger_disputeId_type_idx" ON "WalletLedger"("disputeId", "type");
