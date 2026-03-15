'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { recordLifecycleEvent } from '@/lib/lifecycle-events';
import { emitScopedUpdate } from '@/lib/emit-scoped-update';
import { resolveDisputeAdmin } from '@/actions/dispute-actions';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';

// ============================================================================
// Admin Dispute Actions — Arbitration System
// ============================================================================

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

// ---- Helpers ----

async function assertAdmin(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    const role = (session.user as { role?: string }).role;
    if (role !== 'ADMIN') throw new Error('Admin access required');
    return session.user.id;
}

// ============================================================================
// getAdminDisputeDetail — Full dispute data + analytics for admin page
// ============================================================================

export async function getAdminDisputeDetail(disputeId: string) {
    try {
        const adminId = await assertAdmin();

        const dispute = await db.dispute.findUnique({
            where: { id: disputeId },
            include: {
                milestone: {
                    include: {
                        contract: {
                            include: {
                                client: { include: { user: { select: { id: true, name: true, image: true } } } },
                                freelancer: { include: { user: { select: { id: true, name: true, image: true } } } },
                                escrowAccount: {
                                    include: {
                                        locks: {
                                            where: { released: false },
                                            select: { id: true, amount: true, milestoneId: true, released: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                messages: { orderBy: { createdAt: 'asc' } },
                evidence: { orderBy: { createdAt: 'asc' } },
                proposals: { orderBy: { createdAt: 'asc' } },
                adminMessages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: { select: { id: true, name: true, image: true } },
                        recipient: { select: { id: true, name: true } },
                    },
                },
                adminEvidence: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        uploadedBy: { select: { id: true, name: true } },
                    },
                },
            },
        });

        if (!dispute) return { error: 'Dispute not found' };

        const contract = dispute.milestone.contract;
        const clientUserId = contract.client.userId;
        const freelancerUserId = contract.freelancer.userId;

        // Proposal analytics
        const clientProposals = dispute.proposals.filter(p => p.proposedById === clientUserId);
        const freelancerProposals = dispute.proposals.filter(p => p.proposedById === freelancerUserId);
        const latestClientProposal = clientProposals[clientProposals.length - 1] ?? null;
        const latestFreelancerProposal = freelancerProposals[freelancerProposals.length - 1] ?? null;

        let proposalDifference: number | null = null;
        let suggestedMidpoint: number | null = null;
        if (latestClientProposal && latestFreelancerProposal) {
            proposalDifference = Math.abs(latestClientProposal.freelancerPercent - latestFreelancerProposal.freelancerPercent);
            suggestedMidpoint = Math.round((latestClientProposal.freelancerPercent + latestFreelancerProposal.freelancerPercent) / 2);
        }

        // Escrow lock for this milestone
        const lock = contract.escrowAccount?.locks?.find(l => l.milestoneId === dispute.milestoneId) ?? null;

        return {
            dispute: {
                id: dispute.id,
                status: dispute.status,
                reason: dispute.reason,
                description: dispute.description,
                outcome: dispute.outcome,
                freelancerPercent: dispute.freelancerPercent,
                resolutionNote: dispute.resolutionNote,
                snapshot: dispute.snapshot,
                snapshotHash: dispute.snapshotHash,
                createdAt: dispute.createdAt.toISOString(),
                escalatedAt: dispute.escalatedAt?.toISOString() ?? null,
                resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
                messages: dispute.messages.map(m => ({
                    id: m.id, senderId: m.senderId, content: m.content,
                    isSystem: m.isSystem, createdAt: m.createdAt.toISOString(),
                })),
                evidence: dispute.evidence.map(e => ({
                    id: e.id, uploadedById: e.uploadedById, fileName: e.fileName,
                    fileUrl: e.fileUrl, fileType: e.fileType, description: e.description,
                    createdAt: e.createdAt.toISOString(),
                })),
                proposals: dispute.proposals.map(p => ({
                    id: p.id, proposedById: p.proposedById, freelancerPercent: p.freelancerPercent,
                    reason: p.reason, accepted: p.accepted, createdAt: p.createdAt.toISOString(),
                })),
                adminMessages: dispute.adminMessages.map(m => ({
                    id: m.id, senderId: m.senderId, recipientId: m.recipientId,
                    content: m.content, isPrivate: m.isPrivate,
                    senderName: m.sender.name ?? 'Admin',
                    recipientName: m.recipient?.name ?? null,
                    createdAt: m.createdAt.toISOString(),
                })),
                adminEvidence: dispute.adminEvidence.map(e => ({
                    id: e.id, uploadedById: e.uploadedById, fileName: e.fileName,
                    fileUrl: e.fileUrl, fileType: e.fileType, description: e.description,
                    uploaderName: e.uploadedBy.name ?? 'Admin',
                    createdAt: e.createdAt.toISOString(),
                })),
                // Moderation fields
                adminInquiryOpen: dispute.adminInquiryOpen,
                clientMutedUntil: dispute.clientMutedUntil?.toISOString() ?? null,
                freelancerMutedUntil: dispute.freelancerMutedUntil?.toISOString() ?? null,
            },
            contract: {
                id: contract.id,
                title: contract.title,
                clientUserId,
                freelancerUserId,
                clientName: contract.client.user.name ?? 'Client',
                freelancerName: contract.freelancer.user.name ?? 'Freelancer',
                clientImage: contract.client.user.image,
                freelancerImage: contract.freelancer.user.image,
            },
            milestone: {
                id: dispute.milestone.id,
                title: dispute.milestone.title,
                amount: dispute.milestone.amount.toString(),
            },
            escrow: {
                lockId: lock?.id ?? null,
                lockAmount: lock?.amount?.toString() ?? '0',
                isLocked: !!lock && !lock.released,
            },
            analytics: {
                latestClientProposal: latestClientProposal ? latestClientProposal.freelancerPercent : null,
                latestFreelancerProposal: latestFreelancerProposal ? latestFreelancerProposal.freelancerPercent : null,
                proposalDifference,
                suggestedMidpoint,
                autoSettlementThreshold: 15,
                totalProposals: dispute.proposals.length,
                totalMessages: dispute.messages.length,
                totalEvidence: dispute.evidence.length,
            },
            adminId,
        };
    } catch (error) {
        console.error('[getAdminDisputeDetail] Error:', error);
        return { error: 'Failed to load dispute details' };
    }
}

// ============================================================================
// sendAdminMessage — Group or Private admin message (in transaction)
// ============================================================================

export async function sendAdminMessage(
    disputeId: string,
    content: string,
    recipientId?: string | null
): Promise<{ success?: boolean; error?: string }> {
    try {
        const adminId = await assertAdmin();

        if (!content || content.trim().length === 0) {
            return { error: 'Message cannot be empty' };
        }

        const dispute = await db.dispute.findUnique({ where: { id: disputeId } });
        if (!dispute) return { error: 'Dispute not found' };

        const message = await db.$transaction(async (tx) => {
            const msg = await tx.disputeAdminMessage.create({
                data: {
                    disputeId,
                    senderId: adminId,
                    recipientId: recipientId ?? null,
                    content: content.trim(),
                    isPrivate: !!recipientId,
                },
                include: {
                    sender: { select: { id: true, name: true, image: true } },
                    recipient: { select: { id: true, name: true } },
                },
            });

            // Set inquiry flag only when not already open
            if (!dispute.adminInquiryOpen) {
                await tx.dispute.update({
                    where: { id: disputeId },
                    data: { adminInquiryOpen: true },
                });
            }

            return msg;
        });

        // Socket emit (fire-and-forget)
        try {
            const io = (globalThis as any).__socketIO;
            if (io) {
                io.to(`dispute:${disputeId}`).emit('dispute:admin-message', {
                    id: message.id,
                    disputeId: message.disputeId,
                    senderId: message.senderId,
                    recipientId: message.recipientId,
                    content: message.content,
                    isPrivate: message.isPrivate,
                    senderName: message.sender.name ?? 'Admin',
                    recipientName: message.recipient?.name ?? null,
                    createdAt: message.createdAt.toISOString(),
                });
            }
        } catch {}

        revalidatePath(`/admin/disputes/${disputeId}`);
        emitScopedUpdate('dispute:updated');

        return { success: true };
    } catch (error) {
        console.error('[sendAdminMessage] Error:', error);
        return { error: 'Failed to send message' };
    }
}

// ============================================================================
// uploadAdminEvidence — SHA-256 hash dedup, transaction-safe
// ============================================================================

export async function uploadAdminEvidence(
    disputeId: string,
    formData: FormData
): Promise<{ success?: boolean; error?: string }> {
    try {
        const adminId = await assertAdmin();

        const file = formData.get('file') as File | null;
        const description = formData.get('description') as string | null;

        if (!file || file.size === 0) return { error: 'No file provided' };
        if (file.size > 50 * 1024 * 1024) return { error: 'File too large (max 50MB)' };

        const dispute = await db.dispute.findUnique({ where: { id: disputeId } });
        if (!dispute) return { error: 'Dispute not found' };

        // Hash the file content
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');

        // Dedup check
        const existing = await db.disputeAdminEvidence.findFirst({
            where: { disputeId, contentHash },
        });
        if (existing) {
            return { error: 'Duplicate evidence file detected.' };
        }

        // Save file to disk
        const ext = path.extname(file.name) || '.bin';
        const fileName = `${crypto.randomUUID()}${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'disputes', 'admin', disputeId);
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, fileName), buffer);

        const fileUrl = `/uploads/disputes/admin/${disputeId}/${fileName}`;

        // DB insert in transaction
        const evidence = await db.$transaction(async (tx) => {
            return tx.disputeAdminEvidence.create({
                data: {
                    disputeId,
                    uploadedById: adminId,
                    fileUrl,
                    fileName: file.name,
                    fileType: file.type || 'application/octet-stream',
                    description: description?.trim() || null,
                    contentHash,
                },
            });
        });

        // Socket emit (fire-and-forget)
        try {
            const io = (globalThis as any).__socketIO;
            if (io) {
                io.to(`dispute:${disputeId}`).emit('dispute:admin-evidence', {
                    id: evidence.id,
                    disputeId: evidence.disputeId,
                    fileName: evidence.fileName,
                    fileUrl: evidence.fileUrl,
                    description: evidence.description,
                    createdAt: evidence.createdAt.toISOString(),
                });
            }
        } catch {}

        revalidatePath(`/admin/disputes/${disputeId}`);
        emitScopedUpdate('dispute:updated');

        return { success: true };
    } catch (error) {
        console.error('[uploadAdminEvidence] Error:', error);
        return { error: 'Failed to upload evidence' };
    }
}

// ============================================================================
// adminResolveDispute — Wraps resolveDisputeAdmin + audit log
// ============================================================================

export async function adminResolveDispute(
    disputeId: string,
    freelancerPercent: number,
    resolutionNote: string,
    idempotencyKey?: string
): Promise<{ success?: boolean; error?: string }> {
    try {
        const adminId = await assertAdmin();

        // Delegate to existing financial resolution engine
        const result = await resolveDisputeAdmin(disputeId, freelancerPercent, resolutionNote, idempotencyKey);

        if (result.success) {
            // Audit log — fire-and-forget via lifecycle events
            recordLifecycleEvent({
                contractId: undefined,
                milestoneId: undefined,
                eventType: 'ADMIN_DISPUTE_RESOLUTION',
                userMessage: `Admin resolved dispute ${disputeId}: ${freelancerPercent}% to freelancer. Note: ${resolutionNote}`,
                actorId: adminId,
                actorRole: 'SYSTEM',
                metadata: {
                    action: 'ADMIN_DISPUTE_RESOLUTION',
                    adminId,
                    disputeId,
                    freelancerPercent,
                    resolutionNote,
                    timestamp: new Date().toISOString(),
                },
                category: 'BUSINESS',
            });
        }

        return result;
    } catch (error) {
        console.error('[adminResolveDispute] Error:', error);
        return { error: 'Failed to resolve dispute' };
    }
}

// ============================================================================
// getAdminConversationMessages — Read contract chat for admin dispute review
// ============================================================================

export async function getAdminConversationMessages(
    contractId: string,
    cursor?: string | null,
    limit: number = 100
): Promise<{
    messages?: any[];
    nextCursor?: string | null;
    participants?: { clientUserId: string; clientName: string; freelancerUserId: string; freelancerName: string };
    totalCount?: number;
    error?: string;
}> {
    try {
        await assertAdmin();

        // Safety: only load contract-linked conversations (not proposal-only)
        const conversation = await db.conversation.findFirst({
            where: {
                contractId: contractId,
                NOT: { contractId: null },
            },
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, name: true, image: true, role: true } },
                    },
                },
            },
        });

        if (!conversation) {
            return { error: 'No conversation found for this contract' };
        }

        // Identify client and freelancer from participants
        const clientParticipant = conversation.participants.find(
            p => (p.user as any).role === 'CLIENT'
        );
        const freelancerParticipant = conversation.participants.find(
            p => (p.user as any).role === 'FREELANCER'
        );

        const totalCount = await db.message.count({
            where: { conversationId: conversation.id },
        });

        // Cursor-based pagination: fetch newest messages first, then reverse for chronological order
        const messages = await db.message.findMany({
            where: { conversationId: conversation.id },
            include: {
                sender: {
                    select: { id: true, name: true, image: true },
                },
                attachments: {
                    select: {
                        id: true,
                        name: true,
                        url: true,
                        fileType: true,
                        size: true,
                    },
                },
                reactions: {
                    select: {
                        id: true,
                        userId: true,
                        emoji: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'asc' as const },
                },
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        senderId: true,
                        sender: { select: { id: true, name: true } },
                        isDeleted: true,
                        isEdited: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });

        // Reverse to get chronological order
        const chronologicalMessages = [...messages].reverse();

        // Parse callMeta JSON
        const parsedMessages = chronologicalMessages.map((msg: any) => ({
            ...msg,
            createdAt: msg.createdAt.toISOString(),
            deliveredAt: msg.deliveredAt?.toISOString() ?? null,
            readAt: msg.readAt?.toISOString() ?? null,
            editedAt: msg.editedAt?.toISOString() ?? null,
            callMeta: msg.callMeta ? JSON.parse(msg.callMeta) : null,
            reactions: msg.reactions.map((r: any) => ({
                ...r,
                createdAt: r.createdAt?.toISOString() ?? null,
            })),
        }));

        // Next cursor is the oldest message in the current batch (for loading older messages)
        const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

        return {
            messages: parsedMessages,
            nextCursor,
            participants: {
                clientUserId: clientParticipant?.user.id ?? '',
                clientName: clientParticipant?.user.name ?? 'Client',
                freelancerUserId: freelancerParticipant?.user.id ?? '',
                freelancerName: freelancerParticipant?.user.name ?? 'Freelancer',
            },
            totalCount,
        };
    } catch (error) {
        console.error('[getAdminConversationMessages] Error:', error);
        return { error: 'Failed to load conversation messages' };
    }
}

// ============================================================================
// muteParticipant — Admin mutes a dispute participant for a specified duration
// ============================================================================

export async function muteParticipant(
    disputeId: string,
    target: 'client' | 'freelancer',
    durationMinutes: number
): Promise<{ success?: boolean; error?: string }> {
    try {
        await assertAdmin();

        if (durationMinutes <= 0 || durationMinutes > 1440) {
            return { error: 'Duration must be between 1 and 1440 minutes' };
        }

        const muteUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

        await db.dispute.update({
            where: { id: disputeId },
            data: target === 'client'
                ? { clientMutedUntil: muteUntil }
                : { freelancerMutedUntil: muteUntil },
        });

        emitScopedUpdate('dispute:updated');
        return { success: true };
    } catch (error) {
        console.error('[muteParticipant] Error:', error);
        return { error: 'Failed to mute participant' };
    }
}

// ============================================================================
// unmuteParticipant — Admin unmutes a dispute participant immediately
// ============================================================================

export async function unmuteParticipant(
    disputeId: string,
    target: 'client' | 'freelancer'
): Promise<{ success?: boolean; error?: string }> {
    try {
        await assertAdmin();

        await db.dispute.update({
            where: { id: disputeId },
            data: target === 'client'
                ? { clientMutedUntil: null }
                : { freelancerMutedUntil: null },
        });

        emitScopedUpdate('dispute:updated');
        return { success: true };
    } catch (error) {
        console.error('[unmuteParticipant] Error:', error);
        return { error: 'Failed to unmute participant' };
    }
}

// ============================================================================
// endInquiry — Admin manually unlocks the settlement panel
// ============================================================================

export async function endInquiry(
    disputeId: string
): Promise<{ success?: boolean; error?: string }> {
    try {
        await assertAdmin();

        await db.dispute.update({
            where: { id: disputeId },
            data: { adminInquiryOpen: false },
        });

        emitScopedUpdate('dispute:updated');
        return { success: true };
    } catch (error) {
        console.error('[endInquiry] Error:', error);
        return { error: 'Failed to end inquiry' };
    }
}
