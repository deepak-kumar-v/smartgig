/**
 * SmartGIG Video Room Service
 * 
 * Handles video call room management with contract-bound security.
 * Only participants in linked contracts/conversations can join rooms.
 */

import { logAuditEvent } from '@/lib/audit-service';

export type VideoRoomStatus = 'active' | 'ended' | 'scheduled';

export interface VideoRoom {
    roomId: string;
    contractId: string | null;
    conversationId: string | null;
    participantIds: string[];
    createdBy: string;
    createdAt: Date;
    endedAt: Date | null;
    status: VideoRoomStatus;
    allowedUserIds: string[]; // All users allowed to join (contract parties)
    metadata?: Record<string, unknown>;
}

export interface VideoRoomValidation {
    isValid: boolean;
    room: VideoRoom | null;
    error?: 'NOT_FOUND' | 'NOT_ACTIVE' | 'NOT_PARTICIPANT' | 'NOT_AUTHENTICATED' | 'CONTRACT_INACTIVE';
    message?: string;
}

// In-memory store for rooms (would be database in production)
const videoRooms: Map<string, VideoRoom> = new Map();

// Mock contract data for validation
const mockContracts: Record<string, { id: string; clientId: string; freelancerId: string; status: string }> = {
    'contract-1': { id: 'contract-1', clientId: 'user-client-1', freelancerId: 'user-freelancer-1', status: 'ACTIVE' },
    'contract-2': { id: 'contract-2', clientId: 'user-client-2', freelancerId: 'user-freelancer-2', status: 'ACTIVE' },
    'contract-789': { id: 'contract-789', clientId: 'user-1', freelancerId: 'user-2', status: 'ACTIVE' },
};

// Mock conversation data
const mockConversations: Record<string, { id: string; participantIds: string[] }> = {
    'conv-1': { id: 'conv-1', participantIds: ['user-1', 'user-2'] },
    'conv-2': { id: 'conv-2', participantIds: ['user-client-1', 'user-freelancer-1'] },
};

/**
 * Generate a unique room ID
 */
function generateRoomId(): string {
    return `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get allowed participant IDs from a contract
 */
function getContractParticipants(contractId: string): string[] {
    const contract = mockContracts[contractId];
    if (!contract) return [];
    return [contract.clientId, contract.freelancerId];
}

/**
 * Get allowed participant IDs from a conversation
 */
function getConversationParticipants(conversationId: string): string[] {
    const conversation = mockConversations[conversationId];
    if (!conversation) return [];
    return conversation.participantIds;
}

/**
 * Check if a contract is active and allows video calls
 */
function isContractActiveForCalls(contractId: string): boolean {
    const contract = mockContracts[contractId];
    if (!contract) return false;
    return ['ACTIVE', 'IN_PROGRESS', 'PENDING_COMPLETION'].includes(contract.status);
}

/**
 * Create a new video room tied to a contract or conversation
 */
export async function createVideoRoom(params: {
    creatorId: string;
    creatorRole: 'FREELANCER' | 'CLIENT' | 'ADMIN';
    contractId?: string;
    conversationId?: string;
}): Promise<{ success: boolean; roomId?: string; error?: string }> {
    const { creatorId, creatorRole, contractId, conversationId } = params;

    // Must have either contractId or conversationId
    if (!contractId && !conversationId) {
        return { success: false, error: 'Video rooms must be tied to a contract or conversation' };
    }

    // Determine allowed participants
    let allowedUserIds: string[] = [];

    if (contractId) {
        // Validate contract exists and is active
        if (!isContractActiveForCalls(contractId)) {
            return { success: false, error: 'Contract is not active or does not exist' };
        }

        allowedUserIds = getContractParticipants(contractId);

        // Verify creator is a contract participant
        if (!allowedUserIds.includes(creatorId)) {
            return { success: false, error: 'You are not a participant in this contract' };
        }
    } else if (conversationId) {
        allowedUserIds = getConversationParticipants(conversationId);

        // Verify creator is a conversation participant
        if (!allowedUserIds.includes(creatorId)) {
            return { success: false, error: 'You are not a participant in this conversation' };
        }
    }

    const roomId = generateRoomId();

    const room: VideoRoom = {
        roomId,
        contractId: contractId || null,
        conversationId: conversationId || null,
        participantIds: [creatorId],
        createdBy: creatorId,
        createdAt: new Date(),
        endedAt: null,
        status: 'active',
        allowedUserIds,
    };

    videoRooms.set(roomId, room);

    // Audit log
    await logAuditEvent({
        actorId: creatorId,
        actorRole: creatorRole,
        actionType: 'VIDEO_CALL_STARTED',
        entityType: 'VIDEO_CALL',
        entityId: roomId,
        metadata: {
            contractId,
            conversationId,
            allowedUserIds,
        },
    });

    return { success: true, roomId };
}

/**
 * Validate if a user can access a video room
 */
export async function validateRoomAccess(params: {
    roomId: string;
    userId: string | null;
}): Promise<VideoRoomValidation> {
    const { roomId, userId } = params;

    // Must be authenticated
    if (!userId) {
        return {
            isValid: false,
            room: null,
            error: 'NOT_AUTHENTICATED',
            message: 'You must be signed in to join a video call',
        };
    }

    // Check if room exists
    const room = videoRooms.get(roomId);
    if (!room) {
        return {
            isValid: false,
            room: null,
            error: 'NOT_FOUND',
            message: 'This video room does not exist or has expired',
        };
    }

    // Check if room is active
    if (room.status !== 'active') {
        return {
            isValid: false,
            room,
            error: 'NOT_ACTIVE',
            message: 'This video call has ended',
        };
    }

    // Check if user is allowed to join
    if (!room.allowedUserIds.includes(userId)) {
        return {
            isValid: false,
            room,
            error: 'NOT_PARTICIPANT',
            message: 'You are not authorized to join this video call',
        };
    }

    // If tied to a contract, verify contract is still active
    if (room.contractId && !isContractActiveForCalls(room.contractId)) {
        return {
            isValid: false,
            room,
            error: 'CONTRACT_INACTIVE',
            message: 'The contract for this video call is no longer active',
        };
    }

    return {
        isValid: true,
        room,
    };
}

/**
 * Record a user joining a room
 */
export async function joinVideoRoom(params: {
    roomId: string;
    userId: string;
    userRole: 'FREELANCER' | 'CLIENT' | 'ADMIN';
}): Promise<boolean> {
    const { roomId, userId, userRole } = params;

    const room = videoRooms.get(roomId);
    if (!room) return false;

    // Add to participants if not already there
    if (!room.participantIds.includes(userId)) {
        room.participantIds.push(userId);
    }

    // Audit log
    await logAuditEvent({
        actorId: userId,
        actorRole: userRole,
        actionType: 'VIDEO_CALL_JOINED',
        entityType: 'VIDEO_CALL',
        entityId: roomId,
        metadata: {
            contractId: room.contractId,
            currentParticipants: room.participantIds,
        },
    });

    return true;
}

/**
 * Record a user leaving a room
 */
export async function leaveVideoRoom(params: {
    roomId: string;
    userId: string;
    userRole: 'FREELANCER' | 'CLIENT' | 'ADMIN';
}): Promise<void> {
    const { roomId, userId, userRole } = params;

    const room = videoRooms.get(roomId);
    if (!room) return;

    // Remove from participants
    room.participantIds = room.participantIds.filter(id => id !== id);

    // Audit log
    await logAuditEvent({
        actorId: userId,
        actorRole: userRole,
        actionType: 'VIDEO_CALL_LEFT',
        entityType: 'VIDEO_CALL',
        entityId: roomId,
        metadata: {
            contractId: room.contractId,
            remainingParticipants: room.participantIds,
        },
    });

    // End room if no participants left
    if (room.participantIds.length === 0) {
        await endVideoRoom({ roomId, userId, userRole });
    }
}

/**
 * End a video room
 */
export async function endVideoRoom(params: {
    roomId: string;
    userId: string;
    userRole: 'FREELANCER' | 'CLIENT' | 'ADMIN';
}): Promise<void> {
    const { roomId, userId, userRole } = params;

    const room = videoRooms.get(roomId);
    if (!room) return;

    room.status = 'ended';
    room.endedAt = new Date();

    // Audit log
    await logAuditEvent({
        actorId: userId,
        actorRole: userRole,
        actionType: 'VIDEO_CALL_ENDED',
        entityType: 'VIDEO_CALL',
        entityId: roomId,
        metadata: {
            contractId: room.contractId,
            duration: room.endedAt.getTime() - room.createdAt.getTime(),
            totalParticipants: room.participantIds.length,
        },
    });
}

/**
 * Get a room by ID
 */
export async function getVideoRoom(roomId: string): Promise<VideoRoom | null> {
    return videoRooms.get(roomId) || null;
}

/**
 * Get or create a room for a contract
 */
export async function getOrCreateRoomForContract(params: {
    contractId: string;
    userId: string;
    userRole: 'FREELANCER' | 'CLIENT' | 'ADMIN';
}): Promise<{ success: boolean; roomId?: string; error?: string }> {
    const { contractId, userId, userRole } = params;

    // Check for existing active room for this contract
    for (const room of videoRooms.values()) {
        if (room.contractId === contractId && room.status === 'active') {
            // Verify user is allowed
            if (room.allowedUserIds.includes(userId)) {
                return { success: true, roomId: room.roomId };
            }
        }
    }

    // Create new room
    return createVideoRoom({
        creatorId: userId,
        creatorRole: userRole,
        contractId,
    });
}

// Seed demo room
const demoRoom: VideoRoom = {
    roomId: 'demo-room-001',
    contractId: 'contract-789',
    conversationId: null,
    participantIds: ['user-1'],
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
    endedAt: null,
    status: 'active',
    allowedUserIds: ['user-1', 'user-2'],
};
videoRooms.set(demoRoom.roomId, demoRoom);
