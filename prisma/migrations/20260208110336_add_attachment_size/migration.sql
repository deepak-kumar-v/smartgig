/*
  Warnings:

  - A unique constraint covering the columns `[sourceTrialId]` on the table `Contract` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "size" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "escrowStatus" TEXT,
ADD COLUMN     "sourceTrialId" TEXT,
ADD COLUMN     "trialAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "callMeta" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'TEXT';

-- CreateTable
CREATE TABLE "MockEscrowTransaction" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockEscrowTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_sourceTrialId_key" ON "Contract"("sourceTrialId");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_sourceTrialId_fkey" FOREIGN KEY ("sourceTrialId") REFERENCES "Contract"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MockEscrowTransaction" ADD CONSTRAINT "MockEscrowTransaction_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
