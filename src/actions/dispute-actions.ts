'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { recordLifecycleEvent } from '@/lib/lifecycle-events';
import { emitScopedUpdate } from '@/lib/emit-scoped-update';
import { assertEscrowIntegrity } from '@/lib/escrow-integrity';
import { assertDecimalNonNegative } from '@/lib/financial-assertions';
import { getPlatformWallet } from '@/lib/platform-wallet';
import {
    ContractStatus,
    DisputeStatus,
    DisputeOutcome,
    EscrowStatus,
    MilestoneStatus,
    WalletTransactionType,
    RefundReason,
    Prisma,
} from '@prisma/client';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';

// Type for Prisma interactive transaction client
type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

// ============================================================================
// Dispute Resolution Actions — Production-Grade, Fintech-Safe
// ============================================================================

const VALID_REASONS = [
    'QUALITY_ISSUES', 'NON_DELIVERY', 'SCOPE_CREEP',
    'MISSED_DEADLINE', 'COMMUNICATION', 'PAYMENT_DISPUTE', 'OTHER',
] as const;

const DISCUSSION_DAYS = 5;
const PROPOSAL_DAYS = 3;
const AUTO_SETTLE_THRESHOLD = 15; // percent

// ============================================================================
// openDispute — Creates dispute record, snapshots milestone, freezes escrow
// ============================================================================

export async function openDispute(
    milestoneId: string,
    reason: string,
    description: string
): Promise<{ success?: boolean; error?: string; disputeId?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        if (!VALID_REASONS.includes(reason as typeof VALID_REASONS[number])) {
            return { error: `Invalid reason. Must be one of: ${VALID_REASONS.join(', ')}` };
        }
        if (!description || description.trim().length < 10) {
            return { error: 'Description must be at least 10 characters.' };
        }

        const milestone = await db.milestone.findUnique({
            where: { id: milestoneId },
            include: {
                contract: {
                    include: {
                        client: { select: { userId: true } },
                        freelancer: { select: { userId: true } },
                        escrowAccount: { include: { locks: true } },
                    },
                },
                deliverables: { select: { id: true, fileUrl: true, comment: true, createdAt: true } },
                dispute: { select: { id: true } },
            },
        });

        if (!milestone) return { error: 'Milestone not found' };

        const contract = milestone.contract;
        const isClient = contract.client.userId === session.user.id;
        const isFreelancer = contract.freelancer.userId === session.user.id;

        if (!isClient && !isFreelancer) {
            return { error: 'Unauthorized. Only contract parties can open disputes.' };
        }

        // Contract status guard
        if (contract.status !== ContractStatus.ACTIVE) {
            return { error: `Cannot open dispute. Contract status is ${contract.status}, must be ACTIVE.` };
        }

        // Milestone status guard: SUBMITTED only
        if (milestone.status !== MilestoneStatus.SUBMITTED) {
            return { error: `Cannot dispute milestone "${milestone.title}". Status is ${milestone.status} — disputes are only for SUBMITTED milestones.` };
        }

        // Already disputed guard
        if (milestone.dispute) {
            return { error: 'A dispute already exists for this milestone.' };
        }

        // Escrow lock guard
        const lock = contract.escrowAccount?.locks.find(
            (l: { milestoneId: string | null; released: boolean }) => l.milestoneId === milestoneId && !l.released
        );
        if (!lock) {
            return { error: 'No unreleased escrow lock found for this milestone.' };
        }

        const openedById = session.user.id;
        const againstUserId = isClient ? contract.freelancer.userId : contract.client.userId;

        // Build immutable snapshot
        const snapshot = {
            milestoneTitle: milestone.title,
            milestoneDescription: milestone.description,
            amount: new Prisma.Decimal(milestone.amount).toFixed(2),
            dueDate: milestone.dueDate?.toISOString() ?? null,
            submittedAt: milestone.submittedAt?.toISOString() ?? null,
            deliverables: milestone.deliverables.map(d => ({
                id: d.id,
                fileUrl: d.fileUrl,
                comment: d.comment,
                createdAt: d.createdAt.toISOString(),
            })),
            contractId: contract.id,
            clientUserId: contract.client.userId,
            freelancerUserId: contract.freelancer.userId,
            escrowLockAmount: new Prisma.Decimal(lock.amount).toFixed(2),
        };
        const snapshotJson = JSON.stringify(snapshot, null, 0);
        const snapshotHash = crypto.createHash('sha256').update(snapshotJson).digest('hex');

        const discussionDeadline = new Date();
        discussionDeadline.setDate(discussionDeadline.getDate() + DISCUSSION_DAYS);
        const proposalDeadline = new Date(discussionDeadline);
        proposalDeadline.setDate(proposalDeadline.getDate() + PROPOSAL_DAYS);

        // Create dispute + set milestone to DISPUTED atomically
        const dispute = await db.$transaction(async (tx) => {
            // Set milestone to DISPUTED
            await tx.milestone.update({
                where: { id: milestoneId },
                data: { status: MilestoneStatus.DISPUTED },
            });

            // Create dispute record
            const d = await tx.dispute.create({
                data: {
                    milestoneId,
                    contractId: contract.id,
                    openedById,
                    againstUserId,
                    reason,
                    description: description.trim(),
                    status: DisputeStatus.DISCUSSION,
                    snapshot,
                    snapshotHash,
                    discussionDeadline,
                    proposalDeadline,
                },
            });

            // System message
            await tx.disputeMessage.create({
                data: {
                    disputeId: d.id,
                    senderId: openedById,
                    content: `Dispute opened by ${isClient ? 'client' : 'freelancer'} for reason: ${reason.replace(/_/g, ' ').toLowerCase()}. Discussion phase ends ${discussionDeadline.toLocaleDateString()}.`,
                    isSystem: true,
                },
            });

            return d;
        });

        // Post-tx: lifecycle event + notification
        recordLifecycleEvent({
            contractId: contract.id,
            milestoneId,
            eventType: 'DISPUTE_OPENED',
            devState: 'ACTIVE',
            userMessage: `${isClient ? 'Client' : 'Freelancer'} opened dispute for milestone "${milestone.title}" — ${reason.replace(/_/g, ' ')}`,
            actorId: openedById,
            actorRole: isClient ? 'CLIENT' : 'FREELANCER',
            metadata: { disputeId: dispute.id, reason },
        });

        db.notification.create({
            data: {
                userId: againstUserId,
                title: 'Dispute Opened',
                message: `A dispute has been opened for milestone "${milestone.title}". Escrow funds are frozen until resolved.`,
                type: 'DISPUTE_OPENED',
            },
        }).catch(err => console.error('[Notification] Failed:', err));

        db.auditLog.create({
            data: {
                userId: openedById,
                actorRole: isClient ? 'CLIENT' : 'FREELANCER',
                action: 'DISPUTE_OPENED',
                entityType: 'DISPUTE',
                entityId: dispute.id,
                details: { milestoneId, contractId: contract.id, reason },
            },
        }).catch(err => console.error('[AuditLog] Failed:', err));

        revalidatePath(`/client/contracts/${contract.id}`);
        revalidatePath(`/freelancer/contracts/${contract.id}`);
        revalidatePath('/client/disputes');
        revalidatePath('/freelancer/disputes');

        emitScopedUpdate('dispute:updated');

        return { success: true, disputeId: dispute.id };
    } catch (error) {
        console.error('[openDispute] Error:', error);
        return { error: error instanceof Error ? error.message : 'Failed to open dispute' };
    }
}

// ============================================================================
// submitDisputeMessage — Send a message in the dispute thread
// ============================================================================

export async function submitDisputeMessage(
    disputeId: string,
    content: string
): Promise<{ success?: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        if (!content || content.trim().length === 0) {
            return { error: 'Message cannot be empty.' };
        }

        const dispute = await db.dispute.findUnique({
            where: { id: disputeId },
            include: {
                milestone: {
                    include: {
                        contract: {
                            include: {
                                client: { select: { userId: true } },
                                freelancer: { select: { userId: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!dispute) return { error: 'Dispute not found' };

        const contract = dispute.milestone.contract;
        const isParty = contract.client.userId === session.user.id ||
            contract.freelancer.userId === session.user.id;
        const isAdmin = (session.user as { role?: string }).role === 'ADMIN';

        if (!isParty && !isAdmin) {
            return { error: 'Unauthorized. Only dispute parties or admins can send messages.' };
        }

        // Active dispute guard
        const activeStatuses: DisputeStatus[] = [
            DisputeStatus.OPEN, DisputeStatus.DISCUSSION,
            DisputeStatus.PROPOSAL, DisputeStatus.ADMIN_REVIEW,
        ];
        if (!activeStatuses.includes(dispute.status)) {
            return { error: 'Cannot send messages on a resolved or closed dispute.' };
        }

        const createdMessage = await db.disputeMessage.create({
            data: {
                disputeId,
                senderId: session.user.id,
                content: content.trim(),
                isSystem: false,
            },
        });

        // Emit real-time update via Socket.IO (fire-and-forget, never blocks)
        try {
            const io = (globalThis as any).__socketIO;
            if (io) {
                io.to(`dispute:${disputeId}`).emit('dispute:new-message', {
                    id: createdMessage.id,
                    disputeId: createdMessage.disputeId,
                    senderId: createdMessage.senderId,
                    content: createdMessage.content,
                    isSystem: createdMessage.isSystem,
                    createdAt: createdMessage.createdAt.toISOString(),
                });
            }
        } catch (socketErr) {
            console.error('[submitDisputeMessage] Socket emit failed (non-blocking):', socketErr);
        }

        revalidatePath(`/client/disputes/${disputeId}`);
        revalidatePath(`/freelancer/disputes/${disputeId}`);

        emitScopedUpdate('dispute:updated');

        return { success: true };
    } catch (error) {
        console.error('[submitDisputeMessage] Error:', error);
        return { error: 'Failed to send message' };
    }
}

// ============================================================================
// uploadDisputeEvidence — Upload evidence files with SHA-256 hashing
// ============================================================================

export async function uploadDisputeEvidence(
    disputeId: string,
    formData: FormData
): Promise<{ success?: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const file = formData.get('file') as File | null;
        const description = formData.get('description') as string | null;

        if (!file || file.size === 0) return { error: 'No file provided' };
        if (file.size > 50 * 1024 * 1024) return { error: 'File too large (max 50MB)' };

        const dispute = await db.dispute.findUnique({
            where: { id: disputeId },
            include: {
                milestone: {
                    include: {
                        contract: {
                            include: {
                                client: { select: { userId: true } },
                                freelancer: { select: { userId: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!dispute) return { error: 'Dispute not found' };

        const contract = dispute.milestone.contract;
        const isParty = contract.client.userId === session.user.id ||
            contract.freelancer.userId === session.user.id;

        if (!isParty) {
            return { error: 'Unauthorized. Only dispute parties can upload evidence.' };
        }

        // Evidence uploads restricted to DISCUSSION phase only
        const evidenceStatuses: DisputeStatus[] = [
            DisputeStatus.OPEN, DisputeStatus.DISCUSSION,
        ];
        if (!evidenceStatuses.includes(dispute.status)) {
            return { error: 'Evidence can only be uploaded during the Discussion phase.' };
        }

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');

        const ext = path.extname(file.name) || '.bin';
        const fileName = `${crypto.randomUUID()}${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'disputes', disputeId);
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, fileName), buffer);

        const fileUrl = `/uploads/disputes/${disputeId}/${fileName}`;

        const createdEvidence = await db.disputeEvidence.create({
            data: {
                disputeId,
                uploadedById: session.user.id,
                fileUrl,
                fileName: file.name,
                fileType: file.type || 'application/octet-stream',
                description: description?.trim() || null,
                contentHash,
            },
        });

        // System message about evidence upload
        const sysMsg = await db.disputeMessage.create({
            data: {
                disputeId,
                senderId: session.user.id,
                content: `Evidence uploaded: "${file.name}"`,
                isSystem: true,
            },
        });

        // Emit real-time updates via Socket.IO (fire-and-forget)
        try {
            const io = (globalThis as any).__socketIO;
            if (io) {
                io.to(`dispute:${disputeId}`).emit('dispute:new-evidence', {
                    id: createdEvidence.id,
                    disputeId: createdEvidence.disputeId,
                    uploadedById: createdEvidence.uploadedById,
                    fileUrl: createdEvidence.fileUrl,
                    fileName: createdEvidence.fileName,
                    fileType: createdEvidence.fileType,
                    description: createdEvidence.description,
                    createdAt: createdEvidence.createdAt.toISOString(),
                });
                io.to(`dispute:${disputeId}`).emit('dispute:new-message', {
                    id: sysMsg.id,
                    disputeId: sysMsg.disputeId,
                    senderId: sysMsg.senderId,
                    content: sysMsg.content,
                    isSystem: sysMsg.isSystem,
                    createdAt: sysMsg.createdAt.toISOString(),
                });
            }
        } catch (socketErr) {
            console.error('[uploadDisputeEvidence] Socket emit failed (non-blocking):', socketErr);
        }

        revalidatePath(`/client/disputes/${disputeId}`);
        revalidatePath(`/freelancer/disputes/${disputeId}`);

        emitScopedUpdate('dispute:updated');

        return { success: true };
    } catch (error) {
        console.error('[uploadDisputeEvidence] Error:', error);
        return { error: 'Failed to upload evidence' };
    }
}

// ============================================================================
// submitProposal — Submit or counter a resolution proposal
// ============================================================================

export async function submitProposal(
    disputeId: string,
    freelancerPercent: number,
    reason?: string
): Promise<{ success?: boolean; error?: string; autoSettled?: boolean }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        if (freelancerPercent < 0 || freelancerPercent > 100 || !Number.isInteger(freelancerPercent)) {
            return { error: 'Freelancer percent must be an integer between 0 and 100.' };
        }

        const dispute = await db.dispute.findUnique({
            where: { id: disputeId },
            include: {
                proposals: { orderBy: { createdAt: 'desc' } },
                milestone: {
                    include: {
                        contract: {
                            include: {
                                client: { select: { userId: true } },
                                freelancer: { select: { userId: true } },
                                escrowAccount: { include: { locks: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!dispute) return { error: 'Dispute not found' };

        const contract = dispute.milestone.contract;
        const isClient = contract.client.userId === session.user.id;
        const isFreelancer = contract.freelancer.userId === session.user.id;

        if (!isClient && !isFreelancer) {
            return { error: 'Unauthorized. Only dispute parties can submit proposals.' };
        }

        // Already resolved guard
        if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
            return { error: 'This dispute has already been resolved.' };
        }

        // Active phase guard — proposals only in PROPOSAL phase
        if (dispute.status !== DisputeStatus.PROPOSAL) {
            return { error: 'Proposals can only be submitted during the Proposal phase.' };
        }

        // Prevent consecutive proposal spam — same user cannot submit two in a row
        if (dispute.proposals.length > 0 && dispute.proposals[0].proposedById === session.user.id) {
            return { error: 'You must wait for the other party to respond before submitting another proposal.' };
        }

        const userId = session.user.id!;

        // Escrow data needed for potential auto-settlement
        const escrow = contract.escrowAccount;
        if (!escrow) return { error: 'Escrow account not found' };
        const lock = escrow.locks.find(
            (l: { milestoneId: string; released: boolean }) => l.milestoneId === dispute.milestoneId && !l.released
        );
        if (!lock) return { error: 'No unreleased escrow lock for this milestone.' };

        // Create proposal, check auto-settlement, and execute resolution atomically
        const result = await db.$transaction(async (tx) => {
            // Re-check dispute status inside tx (guard against concurrent resolution)
            const freshDispute = await tx.dispute.findUnique({
                where: { id: disputeId },
                select: { status: true },
            });
            if (!freshDispute || freshDispute.status === DisputeStatus.RESOLVED || freshDispute.status === DisputeStatus.CLOSED) {
                throw new Error('DISPUTE_ALREADY_RESOLVED');
            }

            await tx.disputeProposal.create({
                data: {
                    disputeId,
                    proposedById: userId,
                    freelancerPercent,
                    reason: reason?.trim() || null,
                },
            });



            // System message
            await tx.disputeMessage.create({
                data: {
                    disputeId,
                    senderId: userId,
                    content: `Proposal submitted: ${freelancerPercent}% to freelancer, ${100 - freelancerPercent}% refund to client.`,
                    isSystem: true,
                },
            });

            // Auto-settlement check: need proposals from both parties
            const allProposals = await tx.disputeProposal.findMany({
                where: { disputeId },
                orderBy: { createdAt: 'desc' },
            });

            // Get latest from each party
            const latestClientProposal = allProposals.find(p => p.proposedById === contract.client.userId);
            const latestFreelancerProposal = allProposals.find(p => p.proposedById === contract.freelancer.userId);

            if (latestClientProposal && latestFreelancerProposal) {
                const diff = Math.abs(latestClientProposal.freelancerPercent - latestFreelancerProposal.freelancerPercent);
                if (diff <= AUTO_SETTLE_THRESHOLD) {
                    const settledPercent = Math.round(
                        (latestClientProposal.freelancerPercent + latestFreelancerProposal.freelancerPercent) / 2
                    );

                    // Execute resolution INSIDE this transaction
                    const resolutionResult = await executeResolutionCore(
                        tx, disputeId, dispute, contract, escrow, lock,
                        settledPercent, null, 'Auto-settled: proposals within 15% threshold',
                        `auto-settle-${disputeId}`
                    );

                    return { autoSettle: true, settledPercent, resolutionResult };
                }
            }

            return { autoSettle: false, settledPercent: 0, resolutionResult: null };
        }, { isolationLevel: 'Serializable' });

        // Lifecycle event for proposal
        recordLifecycleEvent({
            contractId: contract.id,
            milestoneId: dispute.milestoneId,
            eventType: 'DISPUTE_PROPOSAL_SUBMITTED',
            devState: 'ACTIVE',
            userMessage: `${isClient ? 'Client' : 'Freelancer'} proposed: ${freelancerPercent}% to freelancer`,
            actorId: userId,
            actorRole: isClient ? 'CLIENT' : 'FREELANCER',
            metadata: { disputeId, freelancerPercent },
        });

        // Post-tx: auto-settlement lifecycle events and notifications
        if (result.autoSettle && result.resolutionResult) {
            const r = result.resolutionResult;
            recordLifecycleEvent({
                contractId: contract.id,
                milestoneId: dispute.milestoneId,
                eventType: 'DISPUTE_AUTO_SETTLED',
                devState: 'ACTIVE',
                userMessage: `Dispute auto-settled: ${result.settledPercent}% → freelancer ($${r.freelancerPayout}), ${100 - result.settledPercent}% → client ($${r.clientRefund})`,
                actorId: 'SYSTEM',
                actorRole: 'SYSTEM',
                metadata: { disputeId, outcome: r.outcome, payout: r.freelancerPayout, refund: r.clientRefund },
            });

            // Notify both parties
            const resolvedMsg = `Dispute for milestone "${dispute.milestone.title}" auto-settled: ${result.settledPercent}% to freelancer, ${100 - result.settledPercent}% refund to client.`;
            for (const uid of [contract.freelancer.userId, contract.client.userId]) {
                db.notification.create({
                    data: {
                        userId: uid,
                        title: 'Dispute Auto-Settled',
                        message: resolvedMsg,
                        type: 'DISPUTE_RESOLVED',
                    },
                }).catch(err => console.error('[Notification] Failed:', err));
            }

            revalidatePath(`/client/contracts/${contract.id}`);
            revalidatePath(`/freelancer/contracts/${contract.id}`);
            revalidatePath(`/client/disputes/${disputeId}`);
            revalidatePath(`/freelancer/disputes/${disputeId}`);
            revalidatePath('/admin/disputes');

            emitScopedUpdate('dispute:updated');

            return { success: true, autoSettled: true };
        }

        revalidatePath(`/client/disputes/${disputeId}`);
        revalidatePath(`/freelancer/disputes/${disputeId}`);

        emitScopedUpdate('dispute:updated');

        return { success: true };
    } catch (error) {

        // Sanitize internal errors — never expose raw system messages to UI
        if (error instanceof Error) {
            if (error.message.includes('ESCROW_INTEGRITY') || error.message.includes('SPLIT_INCONSISTENT')) {
                return { error: 'Auto-settlement could not be completed due to a system validation error. No funds were moved. You may continue negotiation or escalate to admin review.' };
            }
            if (error.message === 'DUPLICATE_REQUEST') {
                return { error: 'This request has already been processed.' };
            }
            if (error.message === 'DISPUTE_ALREADY_RESOLVED') {
                return { error: 'This dispute has already been resolved.' };
            }
            if (error.message.includes('LOCK_ALREADY_RELEASED')) {
                return { error: 'Escrow lock has already been released. The dispute may have been resolved concurrently.' };
            }
            if (error.message.includes('WALLET_NEGATIVE')) {
                return { error: 'Settlement failed due to a wallet balance issue. Please contact support.' };
            }
            return { error: error.message };
        }
        return { error: 'Failed to submit proposal' };
    }
}

// ============================================================================
// escalateToAdmin — Move dispute to ADMIN_REVIEW phase
// ============================================================================

export async function escalateToAdmin(
    disputeId: string
): Promise<{ success?: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };
        const escalateUserId = session.user.id;

        const dispute = await db.dispute.findUnique({
            where: { id: disputeId },
            include: {
                milestone: {
                    include: {
                        contract: {
                            include: {
                                client: { select: { userId: true } },
                                freelancer: { select: { userId: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!dispute) return { error: 'Dispute not found' };

        const contract = dispute.milestone.contract;
        const isParty = contract.client.userId === session.user.id ||
            contract.freelancer.userId === session.user.id;

        if (!isParty) return { error: 'Unauthorized' };

        if (dispute.status !== DisputeStatus.PROPOSAL) {
            return { error: 'Dispute can only be escalated during the Proposal phase.' };
        }

        await db.$transaction(async (tx) => {
            await tx.dispute.update({
                where: { id: disputeId },
                data: {
                    status: DisputeStatus.ADMIN_REVIEW,
                    escalatedAt: new Date(),
                },
            });

            await tx.disputeMessage.create({
                data: {
                    disputeId,
                    senderId: escalateUserId,
                    content: 'Dispute escalated to admin review.',
                    isSystem: true,
                },
            });
        });

        recordLifecycleEvent({
            contractId: contract.id,
            milestoneId: dispute.milestoneId,
            eventType: 'DISPUTE_ESCALATED',
            devState: 'ACTIVE',
            userMessage: 'Dispute escalated to admin review',
            actorId: escalateUserId,
            actorRole: contract.client.userId === escalateUserId ? 'CLIENT' : 'FREELANCER',
            metadata: { disputeId },
        });

        revalidatePath(`/client/disputes/${disputeId}`);
        revalidatePath(`/freelancer/disputes/${disputeId}`);
        revalidatePath('/admin/disputes');

        emitScopedUpdate('dispute:updated');

        return { success: true };
    } catch (error) {
        console.error('[escalateToAdmin] Error:', error);
        return { error: 'Failed to escalate dispute' };
    }
}

// ============================================================================
// requestPhaseTransition — Mutual fast-forward to next dispute phase
// ============================================================================

export async function requestPhaseTransition(
    disputeId: string
): Promise<{ success?: boolean; error?: string; transitioned?: boolean }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const dispute = await db.dispute.findUnique({
            where: { id: disputeId },
            include: {
                milestone: {
                    include: {
                        contract: {
                            include: {
                                client: { select: { userId: true } },
                                freelancer: { select: { userId: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!dispute) return { error: 'Dispute not found' };

        const contract = dispute.milestone.contract;
        const isClient = contract.client.userId === session.user.id;
        const isFreelancer = contract.freelancer.userId === session.user.id;

        if (!isClient && !isFreelancer) {
            return { error: 'Unauthorized. Only dispute parties can request phase transitions.' };
        }

        // Only DISCUSSION and PROPOSAL phases support fast-forward
        if (dispute.status !== DisputeStatus.DISCUSSION && dispute.status !== DisputeStatus.PROPOSAL) {
            return { error: 'Phase transition is only available during DISCUSSION or PROPOSAL phases.' };
        }

        // Check if this user already requested
        const alreadyRequested = isClient ? dispute.phaseAdvanceClient : dispute.phaseAdvanceFreelancer;
        if (alreadyRequested) {
            return { error: 'You have already requested to advance. Waiting for the other party.' };
        }

        // Set the flag for this user
        const flagUpdate = isClient
            ? { phaseAdvanceClient: true }
            : { phaseAdvanceFreelancer: true };

        // Check if other party already requested
        const otherReady = isClient ? dispute.phaseAdvanceFreelancer : dispute.phaseAdvanceClient;
        const bothReady = otherReady; // other already true, we're about to set ours

        const userId = session.user.id!;

        await db.$transaction(async (tx) => {
            if (bothReady) {
                // Both parties agree — transition!
                if (dispute.status === DisputeStatus.DISCUSSION) {
                    await tx.dispute.update({
                        where: { id: disputeId },
                        data: {
                            ...flagUpdate,
                            status: DisputeStatus.PROPOSAL,
                            discussionEndedAt: new Date(),
                            phaseAdvanceClient: false,
                            phaseAdvanceFreelancer: false,
                        },
                    });
                    await tx.disputeMessage.create({
                        data: {
                            disputeId,
                            senderId: userId,
                            content: 'Both parties agreed to move to Proposal phase early.',
                            isSystem: true,
                        },
                    });
                } else {
                    // PROPOSAL → ADMIN_REVIEW
                    await tx.dispute.update({
                        where: { id: disputeId },
                        data: {
                            ...flagUpdate,
                            status: DisputeStatus.ADMIN_REVIEW,
                            escalatedAt: new Date(),
                            proposalEndedAt: new Date(),
                            phaseAdvanceClient: false,
                            phaseAdvanceFreelancer: false,
                        },
                    });
                    await tx.disputeMessage.create({
                        data: {
                            disputeId,
                            senderId: userId,
                            content: 'Both parties agreed to escalate to admin review.',
                            isSystem: true,
                        },
                    });
                }
            } else {
                // Only this user — just set flag + system message
                await tx.dispute.update({
                    where: { id: disputeId },
                    data: flagUpdate,
                });
                const phaseLabel = dispute.status === DisputeStatus.DISCUSSION ? 'Proposal phase' : 'admin review';
                await tx.disputeMessage.create({
                    data: {
                        disputeId,
                        senderId: userId,
                        content: `${isClient ? 'Client' : 'Freelancer'} requested to move to ${phaseLabel}. Waiting for the other party to confirm.`,
                        isSystem: true,
                    },
                });
            }
        });

        // Lifecycle event for mutual escalation
        if (bothReady && dispute.status === DisputeStatus.PROPOSAL) {
            recordLifecycleEvent({
                contractId: contract.id,
                milestoneId: dispute.milestoneId,
                eventType: 'DISPUTE_ESCALATED',
                devState: 'ACTIVE',
                userMessage: 'Both parties agreed to escalate dispute to admin review',
                actorId: userId,
                actorRole: isClient ? 'CLIENT' : 'FREELANCER',
                metadata: { disputeId, reason: 'MUTUAL_ESCALATION' },
            });
        }

        revalidatePath(`/client/disputes/${disputeId}`);
        revalidatePath(`/freelancer/disputes/${disputeId}`);
        revalidatePath('/admin/disputes');

        emitScopedUpdate('dispute:updated');

        return { success: true, transitioned: bothReady };
    } catch (error) {
        console.error('[requestPhaseTransition] Error:', error);
        return { error: 'Failed to request phase transition' };
    }
}

// ============================================================================
// resolveDisputeAdmin — Admin resolves dispute with financial split
// ============================================================================

export async function resolveDisputeAdmin(
    disputeId: string,
    freelancerPercent: number,
    resolutionNote: string,
    idempotencyKey?: string
): Promise<{ success?: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const isAdmin = (session.user as { role?: string }).role === 'ADMIN';
        if (!isAdmin) return { error: 'Admin access required' };

        if (freelancerPercent < 0 || freelancerPercent > 100 || !Number.isInteger(freelancerPercent)) {
            return { error: 'Freelancer percent must be an integer between 0 and 100.' };
        }
        if (!resolutionNote || resolutionNote.trim().length < 5) {
            return { error: 'Resolution note must be at least 5 characters.' };
        }

        return await executeResolution(disputeId, freelancerPercent, session.user.id, resolutionNote.trim(), idempotencyKey);
    } catch (error) {
        console.error('[resolveDisputeAdmin] Error:', error);
        return { error: 'Failed to resolve dispute' };
    }
}

// ============================================================================
// executeResolution — Core financial resolution logic (shared by auto+admin)
// ============================================================================

// ============================================================================
// executeResolutionCore — Centralized financial resolution logic
// Called from both submitProposal (auto-settle) and executeResolution (admin)
// ============================================================================

async function executeResolutionCore(
    tx: TxClient,
    disputeId: string,
    dispute: { milestoneId: string; milestone: { title: string } },
    contract: { id: string; client: { userId: string }; freelancer: { userId: string }; escrowAccount?: { id: string } | null },
    escrow: { id: string },
    lock: { id: string; amount: unknown },
    freelancerPercent: number,
    resolvedById: string | null,
    resolutionNote: string,
    idempotencyKey?: string
): Promise<{ outcome: string; freelancerPayout: string; clientRefund: string }> {
    // Idempotency guard inside tx
    if (idempotencyKey) {
        const existing = await tx.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
        if (existing) throw new Error('DUPLICATE_REQUEST');
        await tx.idempotencyKey.create({
            data: { key: idempotencyKey, action: 'DISPUTE_RESOLUTION' },
        });
    }

    // Re-fetch lock inside tx to prevent concurrent resolution
    const freshLock = await tx.escrowLock.findUnique({ where: { id: lock.id } });
    if (!freshLock || freshLock.released) {
        throw new Error('LOCK_ALREADY_RELEASED: concurrent resolution detected');
    }

    // Fee-free dispute settlement: escrow is split 100% between freelancer and client
    const lockAmount = new Prisma.Decimal(lock.amount as Prisma.Decimal.Value);
    const freelancerPayout = lockAmount.mul(new Prisma.Decimal(freelancerPercent)).div(new Prisma.Decimal(100));
    const clientRefund = lockAmount.minus(freelancerPayout);

    // Determine outcome
    let outcome: DisputeOutcome;
    if (freelancerPercent === 100) outcome = DisputeOutcome.FULL_RELEASE;
    else if (freelancerPercent === 0) outcome = DisputeOutcome.FULL_REFUND;
    else outcome = DisputeOutcome.PARTIAL_SPLIT;

    // Invariant: payout + refund === lockAmount
    const total = freelancerPayout.plus(clientRefund);
    if (!total.equals(lockAmount)) {
        throw new Error(`SPLIT_INCONSISTENT: payout=${freelancerPayout} + refund=${clientRefund} = ${total} != lock=${lockAmount}`);
    }

    assertDecimalNonNegative(freelancerPayout, 'freelancerPayout');
    assertDecimalNonNegative(clientRefund, 'clientRefund');

    const isAutoSettled = resolvedById === null;
    const freelancerUserId = contract.freelancer.userId;
    const clientUserId = contract.client.userId;

    // ── Double-settlement guard ──
    // Prevent duplicate settlement execution for the same milestone
    const existingSettlement = await tx.walletLedger.findFirst({
        where: {
            milestoneId: dispute.milestoneId,
            OR: [
                { type: WalletTransactionType.ESCROW_RELEASE },
                { type: WalletTransactionType.REFUND, refundReason: RefundReason.DISPUTE_SETTLEMENT },
            ],
        },
    });
    if (existingSettlement) {
        throw new Error('DOUBLE_SETTLEMENT: settlement already exists for this milestone');
    }

    // A. Freelancer payout (ESCROW_RELEASE)
    //    ESCROW_RELEASE + REFUND = lockAmount (fee-free dispute settlement)
    if (freelancerPayout.isPositive()) {
        let freelancerWallet = await tx.wallet.findUnique({ where: { userId: freelancerUserId } });
        if (!freelancerWallet) {
            freelancerWallet = await tx.wallet.create({ data: { userId: freelancerUserId } });
        }
        await tx.walletLedger.create({
            data: {
                walletId: freelancerWallet.id,
                amount: freelancerPayout,
                type: WalletTransactionType.ESCROW_RELEASE,
                contractId: contract.id,
                milestoneId: dispute.milestoneId,
            },
        });
    }

    // C. Client refund
    if (clientRefund.isPositive()) {
        let clientWallet = await tx.wallet.findUnique({ where: { userId: clientUserId } });
        if (!clientWallet) {
            clientWallet = await tx.wallet.create({ data: { userId: clientUserId } });
        }
        await tx.walletLedger.create({
            data: {
                walletId: clientWallet.id,
                amount: clientRefund,
                type: WalletTransactionType.REFUND,
                refundReason: RefundReason.DISPUTE_SETTLEMENT,
                contractId: contract.id,
                milestoneId: dispute.milestoneId,
            },
        });
    }

    // D. Mark EscrowLock released
    await tx.escrowLock.update({
        where: { id: lock.id },
        data: { released: true },
    });

    // E. Milestone → PAID
    await tx.milestone.update({
        where: { id: dispute.milestoneId },
        data: { status: MilestoneStatus.PAID },
    });

    // F. Dispute → RESOLVED
    await tx.dispute.update({
        where: { id: disputeId },
        data: {
            status: DisputeStatus.RESOLVED,
            outcome,
            freelancerPercent,
            resolvedById,
            resolutionNote,
            resolvedAt: new Date(),
        },
    });

    // G. System message
    await tx.disputeMessage.create({
        data: {
            disputeId,
            senderId: resolvedById ?? 'SYSTEM',
            content: `Dispute ${isAutoSettled ? 'auto-settled' : 'resolved by admin'}: ${freelancerPercent}% to freelancer ($${freelancerPayout.toFixed(2)}), ${100 - freelancerPercent}% refund to client ($${clientRefund.toFixed(2)}).`,
            isSystem: true,
        },
    });

    // H. Check if all milestones PAID → contract COMPLETED
    const remainingUnpaid = await tx.milestone.findFirst({
        where: {
            contractId: contract.id,
            status: { not: MilestoneStatus.PAID },
        },
        select: { id: true },
    });
    if (!remainingUnpaid) {
        await tx.contract.update({
            where: { id: contract.id },
            data: { status: ContractStatus.COMPLETED },
        });
        await tx.escrowAccount.update({
            where: { id: escrow.id },
            data: { status: EscrowStatus.CLOSED },
        });
    }

    // I. assertEscrowIntegrity
    await assertEscrowIntegrity(tx, escrow.id, contract.id);

    // J. Wallet consistency assertions
    if (freelancerPayout.isPositive()) {
        const fWallet = await tx.wallet.findUnique({ where: { userId: freelancerUserId } });
        if (fWallet) {
            const fSum = await tx.walletLedger.aggregate({
                where: { walletId: fWallet.id },
                _sum: { amount: true },
            });
            const fAvail = new Prisma.Decimal(fSum._sum.amount ?? 0);
            if (fAvail.isNegative()) {
                throw new Error(`WALLET_NEGATIVE: freelancer available=${fAvail}`);
            }
        }
    }

    // K. FinancialMutationLog
    await tx.financialMutationLog.create({
        data: {
            action: 'DISPUTE_RESOLVED',
            userId: resolvedById,
            contractId: contract.id,
            milestoneId: dispute.milestoneId,
            metadata: {
                disputeId,
                resolutionOutcome: outcome,
                freelancerPercent,
                payout: freelancerPayout.toFixed(2),
                refund: clientRefund.toFixed(2),
                isAutoSettled,
            },
        },
    });

    return {
        outcome,
        freelancerPayout: freelancerPayout.toFixed(2),
        clientRefund: clientRefund.toFixed(2),
    };
}

// ============================================================================
// executeResolution — Wrapper for admin/standalone resolution calls
// ============================================================================

async function executeResolution(
    disputeId: string,
    freelancerPercent: number,
    resolvedById: string | null,
    resolutionNote: string,
    idempotencyKey?: string
): Promise<{ success?: boolean; error?: string; autoSettled?: boolean }> {
    try {
        const dispute = await db.dispute.findUnique({
            where: { id: disputeId },
            include: {
                milestone: {
                    include: {
                        contract: {
                            include: {
                                client: { select: { userId: true } },
                                freelancer: { select: { userId: true } },
                                escrowAccount: { include: { locks: true } },
                                milestones: { select: { id: true, status: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!dispute) return { error: 'Dispute not found' };

        // Guard: already resolved
        if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
            return { error: 'Dispute is already resolved' };
        }

        const contract = dispute.milestone.contract;
        const escrow = contract.escrowAccount;
        if (!escrow) return { error: 'Escrow account not found' };

        const lock = escrow.locks.find(
            (l: { milestoneId: string; released: boolean }) => l.milestoneId === dispute.milestoneId && !l.released
        );
        if (!lock) return { error: 'No unreleased escrow lock for this milestone' };

        // Idempotency pre-check (fast path outside tx)
        if (idempotencyKey) {
            const existing = await db.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
            if (existing) return { error: 'DUPLICATE_REQUEST' };
        }

        const isAutoSettled = resolvedById === null;
        const freelancerUserId = contract.freelancer.userId;
        const clientUserId = contract.client.userId;

        // ── Atomic Financial Transaction — delegates to core ──
        const resolutionResult = await db.$transaction(async (tx) => {
            return await executeResolutionCore(
                tx, disputeId, dispute, contract, escrow, lock,
                freelancerPercent, resolvedById, resolutionNote, idempotencyKey
            );
        }, { isolationLevel: 'Serializable' });

        // Post-tx lifecycle events
        recordLifecycleEvent({
            contractId: contract.id,
            milestoneId: dispute.milestoneId,
            eventType: isAutoSettled ? 'DISPUTE_AUTO_SETTLED' : 'DISPUTE_RESOLVED',
            devState: 'ACTIVE',
            userMessage: `Dispute ${isAutoSettled ? 'auto-settled' : 'resolved'}: ${freelancerPercent}% → freelancer ($${resolutionResult.freelancerPayout}), ${100 - freelancerPercent}% → client ($${resolutionResult.clientRefund})`,
            actorId: resolvedById ?? 'SYSTEM',
            actorRole: isAutoSettled ? 'SYSTEM' : 'CLIENT',
            metadata: { disputeId, outcome: resolutionResult.outcome, payout: resolutionResult.freelancerPayout, refund: resolutionResult.clientRefund },
        });

        // Notify both parties
        const resolvedMsg = `Dispute for milestone "${dispute.milestone.title}" resolved: ${freelancerPercent}% to freelancer, ${100 - freelancerPercent}% refund to client.`;
        for (const uid of [freelancerUserId, clientUserId]) {
            db.notification.create({
                data: {
                    userId: uid,
                    title: 'Dispute Resolved',
                    message: resolvedMsg,
                    type: 'DISPUTE_RESOLVED',
                },
            }).catch((err: Error) => console.error('[Notification] Failed:', err));
        }

        revalidatePath(`/client/contracts/${contract.id}`);
        revalidatePath(`/freelancer/contracts/${contract.id}`);
        revalidatePath(`/client/disputes/${disputeId}`);
        revalidatePath(`/freelancer/disputes/${disputeId}`);
        revalidatePath('/admin/disputes');

        emitScopedUpdate('dispute:updated');

        return { success: true, autoSettled: isAutoSettled };
    } catch (error) {
        db.financialErrorLog.create({
            data: {
                action: 'DISPUTE_RESOLUTION',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                stackTrace: error instanceof Error ? error.stack ?? null : null,
            },
        }).catch(() => { });
        console.error('[executeResolution] Error:', error);
        return { error: error instanceof Error ? error.message : 'Resolution failed' };
    }
}

// ============================================================================
// getDispute — Full dispute data for detail pages
// ============================================================================

export async function getDispute(disputeId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const dispute = await db.dispute.findUnique({
            where: { id: disputeId },
            include: {
                messages: { orderBy: { createdAt: 'asc' } },
                evidence: { orderBy: { createdAt: 'desc' } },
                proposals: { orderBy: { createdAt: 'desc' } },
                adminMessages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: { select: { id: true, name: true, image: true, role: true } },
                        recipient: { select: { id: true, name: true } },
                    },
                },
                milestone: {
                    include: {
                        contract: {
                            select: {
                                id: true,
                                title: true,
                                client: { select: { userId: true, user: { select: { name: true } } } },
                                freelancer: { select: { userId: true, user: { select: { name: true } } } },
                                escrowAccount: { include: { locks: { where: { released: false } } } },
                            },
                        },
                    },
                },
            },
        });

        if (!dispute) return { error: 'Dispute not found' };

        const contract = dispute.milestone.contract;
        const isParty = contract.client.userId === session.user.id ||
            contract.freelancer.userId === session.user.id;
        const isAdmin = (session.user as { role?: string }).role === 'ADMIN';

        if (!isParty && !isAdmin) return { error: 'Unauthorized' };

        // ── Lazy phase transition ──
        const now = new Date();
        if (dispute.status === DisputeStatus.DISCUSSION && dispute.discussionDeadline && now > dispute.discussionDeadline) {
            await db.dispute.update({
                where: { id: disputeId },
                data: {
                    status: DisputeStatus.PROPOSAL,
                    discussionEndedAt: dispute.discussionDeadline,
                    phaseAdvanceClient: false,
                    phaseAdvanceFreelancer: false,
                },
            });
            dispute.status = DisputeStatus.PROPOSAL;
            dispute.discussionEndedAt = dispute.discussionDeadline;
            dispute.phaseAdvanceClient = false;
            dispute.phaseAdvanceFreelancer = false;

            emitScopedUpdate('dispute:updated');
        }
        if (dispute.status === DisputeStatus.PROPOSAL && dispute.proposalDeadline && now > dispute.proposalDeadline) {
            await db.dispute.update({
                where: { id: disputeId },
                data: {
                    status: DisputeStatus.ADMIN_REVIEW,
                    escalatedAt: now,
                    proposalEndedAt: dispute.proposalDeadline,
                    phaseAdvanceClient: false,
                    phaseAdvanceFreelancer: false,
                },
            });
            dispute.status = DisputeStatus.ADMIN_REVIEW;
            dispute.escalatedAt = now;
            dispute.proposalEndedAt = dispute.proposalDeadline;
            dispute.phaseAdvanceClient = false;
            dispute.phaseAdvanceFreelancer = false;

            emitScopedUpdate('dispute:updated');

            // Emit lifecycle event for auto-escalation
            recordLifecycleEvent({
                contractId: contract.id,
                milestoneId: dispute.milestoneId,
                eventType: 'DISPUTE_ESCALATED',
                devState: 'ACTIVE',
                userMessage: 'Dispute automatically escalated to admin review — proposal deadline exceeded',
                actorId: 'SYSTEM',
                actorRole: 'SYSTEM',
                metadata: { disputeId, reason: 'PROPOSAL_DEADLINE_EXCEEDED' },
            });
        }

        // Find the lock amount for the disputed milestone
        const lock = contract.escrowAccount?.locks.find(
            (l: { milestoneId: string }) => l.milestoneId === dispute.milestoneId
        );

        return {
            dispute: {
                ...dispute,
                createdAt: dispute.createdAt.toISOString(),
                escalatedAt: dispute.escalatedAt?.toISOString() ?? null,
                resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
                discussionDeadline: dispute.discussionDeadline?.toISOString() ?? null,
                proposalDeadline: dispute.proposalDeadline?.toISOString() ?? null,
                discussionEndedAt: dispute.discussionEndedAt?.toISOString() ?? null,
                proposalEndedAt: dispute.proposalEndedAt?.toISOString() ?? null,
                messages: dispute.messages.map(m => ({
                    ...m,
                    createdAt: m.createdAt.toISOString(),
                })),
                evidence: dispute.evidence.map(e => ({
                    ...e,
                    createdAt: e.createdAt.toISOString(),
                })),
                proposals: dispute.proposals.map(p => ({
                    ...p,
                    createdAt: p.createdAt.toISOString(),
                    respondedAt: p.respondedAt?.toISOString() ?? null,
                })),
                // Admin messages filtered by viewer role
                adminMessages: dispute.adminMessages
                    .filter(m => {
                        if (isAdmin) return true; // Admin sees all
                        if (!m.isPrivate) return true; // Group messages visible to all
                        // Private messages: only visible if user is sender or recipient
                        return m.senderId === session.user.id || m.recipientId === session.user.id;
                    })
                    .map(m => ({
                        id: m.id,
                        senderId: m.senderId,
                        recipientId: m.recipientId,
                        content: m.content,
                        isPrivate: m.isPrivate,
                        senderName: (m.sender as any).name ?? 'Unknown',
                        senderRole: (m.sender as any).role ?? 'ADMIN',
                        recipientName: (m.recipient as any)?.name ?? null,
                        createdAt: m.createdAt.toISOString(),
                    })),
                // Moderation fields
                adminInquiryOpen: dispute.adminInquiryOpen,
                clientMutedUntil: dispute.clientMutedUntil?.toISOString() ?? null,
                freelancerMutedUntil: dispute.freelancerMutedUntil?.toISOString() ?? null,
            },
            contract: {
                id: contract.id,
                title: contract.title,
                clientName: contract.client.user?.name ?? 'Client',
                freelancerName: contract.freelancer.user?.name ?? 'Freelancer',
                clientUserId: contract.client.userId,
                freelancerUserId: contract.freelancer.userId,
            },
            milestone: {
                id: dispute.milestoneId,
                title: dispute.milestone.title,
            },
            lockAmount: lock ? new Prisma.Decimal(lock.amount).toFixed(2) : (dispute.snapshot as Record<string, string>).escrowLockAmount ?? '0.00',
            currentUserId: session.user.id,
            isAdmin,

        };
    } catch (error) {
        console.error('[getDispute] Error:', error);
        return { error: 'Failed to load dispute' };
    }
}

// ============================================================================
// getDisputesForUser — List disputes for the current user
// ============================================================================

export async function getDisputesForUser() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const isAdmin = (session.user as { role?: string }).role === 'ADMIN';

        const disputes = await db.dispute.findMany({
            where: isAdmin ? {} : {
                OR: [
                    { openedById: session.user.id },
                    { againstUserId: session.user.id },
                ],
            },
            include: {
                milestone: {
                    select: {
                        title: true,
                        amount: true,
                        contract: {
                            select: {
                                id: true,
                                title: true,
                                client: { select: { userId: true, user: { select: { name: true } } } },
                                freelancer: { select: { userId: true, user: { select: { name: true } } } },
                            },
                        },
                    },
                },
                _count: { select: { messages: true, evidence: true, proposals: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return {
            disputes: disputes.map(d => ({
                id: d.id,
                reason: d.reason,
                description: d.description,
                status: d.status,
                outcome: d.outcome,
                freelancerPercent: d.freelancerPercent,
                createdAt: d.createdAt.toISOString(),
                resolvedAt: d.resolvedAt?.toISOString() ?? null,
                discussionDeadline: d.discussionDeadline?.toISOString() ?? null,
                proposalDeadline: d.proposalDeadline?.toISOString() ?? null,
                milestoneTitle: d.milestone.title,
                milestoneAmount: new Prisma.Decimal(d.milestone.amount).toFixed(2),
                contractId: d.milestone.contract.id,
                contractTitle: d.milestone.contract.title,
                clientName: d.milestone.contract.client.user?.name ?? 'Client',
                freelancerName: d.milestone.contract.freelancer.user?.name ?? 'Freelancer',
                clientUserId: d.milestone.contract.client.userId,
                freelancerUserId: d.milestone.contract.freelancer.userId,
                openedById: d.openedById,
                messageCount: d._count.messages,
                evidenceCount: d._count.evidence,
                proposalCount: d._count.proposals,
            })),
            currentUserId: session.user.id,
            isAdmin,
        };
    } catch (error) {
        console.error('[getDisputesForUser] Error:', error);
        return { error: 'Failed to load disputes' };
    }
}

// ============================================================================
// sendArbitrationMessage — Client/Freelancer sends message in admin arbitration chat
// ============================================================================

export async function sendArbitrationMessage(
    disputeId: string,
    content: string,
    isPrivate: boolean = false // when true, it's a private message to admin
): Promise<{ success?: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        if (!content || content.trim().length === 0) {
            return { error: 'Message cannot be empty' };
        }

        const dispute = await db.dispute.findUnique({
            where: { id: disputeId },
            include: {
                milestone: {
                    include: {
                        contract: {
                            select: {
                                client: { select: { userId: true } },
                                freelancer: { select: { userId: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!dispute) return { error: 'Dispute not found' };
        if (dispute.status !== DisputeStatus.ADMIN_REVIEW) {
            return { error: 'Arbitration chat is only available during admin review' };
        }

        const clientUserId = dispute.milestone.contract.client.userId;
        const freelancerUserId = dispute.milestone.contract.freelancer.userId;
        const userId = session.user.id;

        const isClient = userId === clientUserId;
        const isFreelancer = userId === freelancerUserId;

        if (!isClient && !isFreelancer) {
            return { error: 'You are not a party in this dispute' };
        }

        // Check mute status
        const now = new Date();
        if (isClient && dispute.clientMutedUntil && dispute.clientMutedUntil > now) {
            return { error: 'You are temporarily muted by the dispute moderator.' };
        }
        if (isFreelancer && dispute.freelancerMutedUntil && dispute.freelancerMutedUntil > now) {
            return { error: 'You are temporarily muted by the dispute moderator.' };
        }

        // For private messages from client/freelancer, recipientId is null (goes to admin)
        // For group messages, recipientId is also null but isPrivate is false
        const message = await db.$transaction(async (tx) => {
            const msg = await tx.disputeAdminMessage.create({
                data: {
                    disputeId,
                    senderId: userId,
                    recipientId: null, // client/freelancer messages go to admin (or group)
                    content: content.trim(),
                    isPrivate,
                },
                include: {
                    sender: { select: { id: true, name: true, image: true, role: true } },
                },
            });

            // Auto-unlock inquiry when both parties have responded
            if (dispute.adminInquiryOpen) {
                // Find the latest admin message timestamp
                const latestAdminMsg = await tx.disputeAdminMessage.findFirst({
                    where: {
                        disputeId,
                        sender: { role: 'ADMIN' },
                    },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true },
                });

                if (latestAdminMsg) {
                    // Check if both parties have responded after the admin's last message
                    const clientReplied = await tx.disputeAdminMessage.findFirst({
                        where: {
                            disputeId,
                            senderId: clientUserId,
                            createdAt: { gt: latestAdminMsg.createdAt },
                        },
                    });
                    const freelancerReplied = await tx.disputeAdminMessage.findFirst({
                        where: {
                            disputeId,
                            senderId: freelancerUserId,
                            createdAt: { gt: latestAdminMsg.createdAt },
                        },
                    });

                    if (clientReplied && freelancerReplied) {
                        await tx.dispute.update({
                            where: { id: disputeId },
                            data: { adminInquiryOpen: false },
                        });
                    }
                }
            }

            return msg;
        });

        // Socket emit
        try {
            const io = (globalThis as any).__socketIO;
            if (io) {
                io.to(`dispute:${disputeId}`).emit('dispute:admin-message', {
                    id: message.id,
                    disputeId,
                    senderId: message.senderId,
                    recipientId: message.recipientId,
                    content: message.content,
                    isPrivate: message.isPrivate,
                    senderName: message.sender.name ?? 'Unknown',
                    senderRole: (message.sender as any).role ?? 'CLIENT',
                    recipientName: null,
                    createdAt: message.createdAt.toISOString(),
                });
            }
        } catch {}

        emitScopedUpdate('dispute:updated');
        return { success: true };
    } catch (error) {
        console.error('[sendArbitrationMessage] Error:', error);
        return { error: 'Failed to send message' };
    }
}
