/*
  Warnings:

  - The values [ESCROW_DEPOSIT,ESCROW_REFUND,WITHDRAWAL_FEE,PLATFORM_FEE] on the enum `WalletTransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `balance` on the `EscrowAccount` table. All the data in the column will be lost.
  - You are about to drop the column `totalDeposited` on the `EscrowAccount` table. All the data in the column will be lost.
  - You are about to drop the column `totalRefunded` on the `EscrowAccount` table. All the data in the column will be lost.
  - You are about to drop the column `totalReleased` on the `EscrowAccount` table. All the data in the column will be lost.
  - You are about to drop the column `balanceAfter` on the `WalletLedger` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `WalletLedger` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `WalletLedger` table. All the data in the column will be lost.
  - You are about to drop the `EscrowTransaction` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `walletId` to the `WalletLedger` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WalletTransactionType_new" AS ENUM ('DEPOSIT', 'ESCROW_LOCK', 'ESCROW_RELEASE', 'REFUND', 'WITHDRAWAL', 'ADJUSTMENT');
ALTER TABLE "WalletLedger" ALTER COLUMN "type" TYPE "WalletTransactionType_new" USING ("type"::text::"WalletTransactionType_new");
ALTER TYPE "WalletTransactionType" RENAME TO "WalletTransactionType_old";
ALTER TYPE "WalletTransactionType_new" RENAME TO "WalletTransactionType";
DROP TYPE "WalletTransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "EscrowTransaction" DROP CONSTRAINT "EscrowTransaction_escrowId_fkey";

-- DropForeignKey
ALTER TABLE "EscrowTransaction" DROP CONSTRAINT "EscrowTransaction_milestoneId_fkey";

-- DropForeignKey
ALTER TABLE "WalletLedger" DROP CONSTRAINT "WalletLedger_userId_fkey";

-- AlterTable
ALTER TABLE "EscrowAccount" DROP COLUMN "balance",
DROP COLUMN "totalDeposited",
DROP COLUMN "totalRefunded",
DROP COLUMN "totalReleased";

-- AlterTable
ALTER TABLE "WalletLedger" DROP COLUMN "balanceAfter",
DROP COLUMN "reason",
DROP COLUMN "userId",
ADD COLUMN     "walletId" TEXT NOT NULL;

-- DropTable
DROP TABLE "EscrowTransaction";

-- DropEnum
DROP TYPE "EscrowTransactionType";

-- CreateTable
CREATE TABLE "EscrowLock" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "released" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscrowLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- AddForeignKey
ALTER TABLE "EscrowLock" ADD CONSTRAINT "EscrowLock_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "EscrowAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowLock" ADD CONSTRAINT "EscrowLock_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
