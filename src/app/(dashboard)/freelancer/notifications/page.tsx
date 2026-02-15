'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import Link from 'next/link';
import {
    Bell, CheckCheck, Settings, Briefcase, DollarSign, FileText,
    MessageSquare, AlertTriangle, Star, Clock, Trash2, Check,
    ChevronRight, Filter
} from 'lucide-react';

// Mock notifications data
const notifications = [
    {
        id: 'n-1',
        type: 'contract',
        title: 'Milestone Approved',
        message: 'Sarah Chen approved your milestone "API Documentation" for Backend API Development',
        link: '/contracts/contract-1',
        read: false,
        createdAt: '5 min ago',
    },
    {
        id: 'n-2',
        type: 'payment',
        title: 'Payment Released',
        message: '$1,500 has been released to your wallet for the completed milestone',
        link: '/payments',
        read: false,
        createdAt: '1 hour ago',
    },
    {
        id: 'n-3',
        type: 'job',
        title: 'New Job Match',
        message: 'A new job matching your skills "React Developer Needed" was posted',
        link: '/job/job-123',
        read: false,
        createdAt: '2 hours ago',
    },
    {
        id: 'n-4',
        type: 'message',
        title: 'New Message',
        message: 'Mike Johnson sent you a message about React Dashboard Project',
        link: '/messages',
        read: true,
        createdAt: '3 hours ago',
    },
    {
        id: 'n-5',
        type: 'review',
        title: 'New Review',
        message: 'TechCorp Solutions left you a 5-star review',
        link: '/freelancer/profile',
        read: true,
        createdAt: 'Yesterday',
    },
    {
        id: 'n-6',
        type: 'system',
        title: 'Profile Update Reminder',
        message: 'Complete your profile to increase visibility by 40%',
        link: '/freelancer/profile/edit',
        read: true,
        createdAt: '2 days ago',
    },
    {
        id: 'n-7',
        type: 'dispute',
        title: 'Dispute Update',
        message: 'The dispute for contract #1234 has been resolved in your favor',
        link: '/disputes/dispute-1',
        read: true,
        createdAt: '3 days ago',
    },
];

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    contract: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    payment: { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    job: { icon: Briefcase, color: 'text-violet-400', bg: 'bg-violet-500/20' },
    message: { icon: MessageSquare, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
    review: { icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    dispute: { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/20' },
    system: { icon: Bell, color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
};

type FilterType = 'all' | 'unread' | 'contract' | 'payment' | 'job' | 'message';

export default function NotificationsPage() {
    const { data: session } = useSession();
    const userRole = session?.user?.role ? session.user.role.toLowerCase() as 'freelancer' | 'client' | 'admin' : 'freelancer';
    const [filter, setFilter] = useState<FilterType>('all');
    const [notificationList, setNotificationList] = useState(notifications);

    const filteredNotifications = notificationList.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'all') return true;
        return n.type === filter;
    });

    const unreadCount = notificationList.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotificationList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotificationList(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotificationList(prev => prev.filter(n => n.id !== id));
    };

    const filters: { value: FilterType; label: string }[] = [
        { value: 'all', label: 'All' },
        { value: 'unread', label: 'Unread' },
        { value: 'contract', label: 'Contracts' },
        { value: 'payment', label: 'Payments' },
        { value: 'job', label: 'Jobs' },
        { value: 'message', label: 'Messages' },
    ];

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="px-2.5 py-0.5 bg-indigo-500 text-white text-sm rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </h1>
                        <p className="text-zinc-400">Stay updated on your projects and activity</p>
                    </div>
                    <div className="flex gap-2">
                        {unreadCount > 0 && (
                            <GlassButton variant="secondary" onClick={markAllAsRead}>
                                <CheckCheck className="w-4 h-4 mr-2" /> Mark All Read
                            </GlassButton>
                        )}
                        <Link href="/settings/notifications">
                            <GlassButton variant="ghost">
                                <Settings className="w-4 h-4" />
                            </GlassButton>
                        </Link>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {filters.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${filter === f.value
                                ? 'bg-indigo-500 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            {f.label}
                            {f.value === 'unread' && unreadCount > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                        <GlassCard className="p-12 text-center">
                            <Bell className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <p className="text-zinc-400">No notifications to show</p>
                        </GlassCard>
                    ) : (
                        filteredNotifications.map((notification) => {
                            const config = typeConfig[notification.type];
                            const Icon = config.icon;

                            return (
                                <GlassCard
                                    key={notification.id}
                                    className={`p-4 transition-all ${!notification.read ? 'border-l-2 border-l-indigo-500' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${config.bg}`}>
                                            <Icon className={`w-5 h-5 ${config.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className={`font-medium ${!notification.read ? 'text-white' : 'text-zinc-300'}`}>
                                                    {notification.title}
                                                </h3>
                                                {!notification.read && (
                                                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                                )}
                                            </div>
                                            <p className="text-zinc-400 text-sm mb-2">{notification.message}</p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-zinc-500 text-xs flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {notification.createdAt}
                                                </span>
                                                <Link href={notification.link} className="text-indigo-400 text-xs hover:underline">
                                                    View details →
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-4 h-4 text-zinc-500 hover:text-emerald-400" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 text-zinc-500 hover:text-rose-400" />
                                            </button>
                                        </div>
                                    </div>
                                </GlassCard>
                            );
                        })
                    )}
                </div>

                {/* Load More */}
                {filteredNotifications.length > 0 && (
                    <div className="text-center">
                        <GlassButton variant="secondary">
                            Load More
                        </GlassButton>
                    </div>
                )}
            </div>
        </>
    );
}
