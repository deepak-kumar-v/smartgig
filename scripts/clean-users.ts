
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning up user data...");

    try {
        // 1. Delete lowest level dependents first
        await prisma.deliverable.deleteMany();
        await prisma.milestone.deleteMany();

        // 2. Clear financial/transactional
        await prisma.escrowTransaction.deleteMany();
        await prisma.escrowAccount.deleteMany();
        await prisma.walletLedger.deleteMany();

        // 3. Communications
        await prisma.attachment.deleteMany();
        await prisma.message.deleteMany();
        await prisma.conversationParticipant.deleteMany();
        await prisma.conversation.deleteMany();
        await prisma.notification.deleteMany();

        // 4. Core Business Logic (Contracts, Proposals, Jobs)
        await prisma.contract.deleteMany();
        await prisma.proposal.deleteMany();

        // Note: Deleting JobPosts. 
        await prisma.jobPost.deleteMany();

        await prisma.serviceListing.deleteMany();
        await prisma.portfolioItem.deleteMany();
        await prisma.review.deleteMany();
        await prisma.invoice.deleteMany();
        await prisma.invoiceLineItem.deleteMany();
        await prisma.withdrawal.deleteMany();
        await prisma.paymentMethod.deleteMany();
        await prisma.videoRoom.deleteMany();
        await prisma.callParticipant.deleteMany();

        // 5. Profiles
        await prisma.freelancerProfile.deleteMany();
        await prisma.clientProfile.deleteMany();

        // 6. Auth/System
        await prisma.account.deleteMany();
        await prisma.session.deleteMany();
        await prisma.auditLog.deleteMany();
        await prisma.strike.deleteMany();
        await prisma.deviceFingerprint.deleteMany();

        // 7. finally Users
        const { count } = await prisma.user.deleteMany();

        console.log(`Successfully deleted ${count} users and all related data.`);

    } catch (error) {
        console.error("Error cleaning database:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
