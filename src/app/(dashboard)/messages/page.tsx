import React from 'react';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MessagesLayout } from './messages-layout';

async function getUserConversations(userId: string) {
    const conversations = await db.conversationParticipant.findMany({
        where: { userId },
        include: {
            conversation: {
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true,
                                }
                            }
                        }
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    name: true,
                                }
                            }
                        }
                    },
                    proposal: {
                        include: {
                            job: {
                                select: {
                                    title: true,
                                }
                            }
                        }
                    },
                    contract: {
                        select: {
                            title: true,
                        }
                    }
                }
            }
        },
        orderBy: {
            conversation: {
                createdAt: 'desc'
            }
        }
    });

    return conversations.map(cp => ({
        ...cp.conversation,
        otherParticipant: cp.conversation.participants.find(p => p.userId !== userId)?.user,
        lastMessage: cp.conversation.messages[0] || null,
        context: cp.conversation.contract?.title || cp.conversation.proposal?.job?.title || 'Direct Message'
    }));
}

export default async function MessagesPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect('/login');
    }

    const conversations = await getUserConversations(session.user.id);

    return <MessagesLayout conversations={conversations} currentUserId={session.user.id} />;
}
