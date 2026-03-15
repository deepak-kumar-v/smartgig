-- CreateTable
CREATE TABLE "DisputeAdminMessage" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeAdminMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeAdminEvidence" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "description" TEXT,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeAdminEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DisputeAdminMessage_disputeId_idx" ON "DisputeAdminMessage"("disputeId");

-- CreateIndex
CREATE INDEX "DisputeAdminMessage_senderId_idx" ON "DisputeAdminMessage"("senderId");

-- CreateIndex
CREATE INDEX "DisputeAdminEvidence_disputeId_idx" ON "DisputeAdminEvidence"("disputeId");

-- AddForeignKey
ALTER TABLE "DisputeAdminMessage" ADD CONSTRAINT "DisputeAdminMessage_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeAdminMessage" ADD CONSTRAINT "DisputeAdminMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeAdminMessage" ADD CONSTRAINT "DisputeAdminMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeAdminEvidence" ADD CONSTRAINT "DisputeAdminEvidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeAdminEvidence" ADD CONSTRAINT "DisputeAdminEvidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
