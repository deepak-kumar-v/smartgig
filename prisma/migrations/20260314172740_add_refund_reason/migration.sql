-- CreateEnum
CREATE TYPE "RefundReason" AS ENUM ('OPERATIONAL', 'DISPUTE_SETTLEMENT', 'CONTRACT_CANCELLED', 'MANUAL_ADMIN_REFUND');

-- AlterTable
ALTER TABLE "WalletLedger" ADD COLUMN     "refundReason" "RefundReason";
