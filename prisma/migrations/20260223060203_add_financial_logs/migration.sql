-- CreateTable
CREATE TABLE "FinancialMutationLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "contractId" TEXT,
    "milestoneId" TEXT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialMutationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialErrorLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "contractId" TEXT,
    "milestoneId" TEXT,
    "errorMessage" TEXT NOT NULL,
    "stackTrace" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialErrorLog_pkey" PRIMARY KEY ("id")
);
