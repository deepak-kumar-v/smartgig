'use client';

import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { Laptop, Smartphone, Globe, Clock, LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';

const mockSessions = [
    {
        id: 'sess-1',
        device: 'MacBook Pro',
        type: 'desktop',
        browser: 'Chrome',
        location: 'San Francisco, US',
        ip: '192.168.1.1',
        lastActive: 'Current Session',
        isCurrent: true,
    },
    {
        id: 'sess-2',
        device: 'iPhone 13',
        type: 'mobile',
        browser: 'Safari',
        location: 'San Francisco, US',
        ip: '192.168.1.5',
        lastActive: '2 hours ago',
        isCurrent: false,
    },
    {
        id: 'sess-3',
        device: 'Windows PC',
        type: 'desktop',
        browser: 'Firefox',
        location: 'New York, US',
        ip: '10.0.0.1',
        lastActive: '3 days ago',
        isCurrent: false,
    },
];

export default function DeviceSettingsPage() {
    const handleLogout = (sessionId: string) => {
        toast.success("Session terminated");
        // In real app, call server action to revoke session
    };

    const handleLogoutAll = () => {
        toast.success("All other sessions terminated");
    };

    return (
        <DashboardShell role="freelancer">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Device Management</h1>
                        <p className="text-zinc-400">Manage your active sessions and trusted devices</p>
                    </div>
                    <GlassButton variant="secondary" onClick={handleLogoutAll}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out All Other Devices
                    </GlassButton>
                </div>

                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                        <div className="p-3 rounded-xl bg-violet-500/20">
                            <Shield className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Active Sessions</h3>
                            <p className="text-sm text-zinc-400">
                                You are currently logged in on these devices. If you don't recognize a session, revoke it immediately.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {mockSessions.map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-zinc-700/50">
                                        {session.type === 'mobile' ? (
                                            <Smartphone className="w-6 h-6 text-zinc-400" />
                                        ) : (
                                            <Laptop className="w-6 h-6 text-zinc-400" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-white">{session.device}</h4>
                                            {session.isCurrent && (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                                                    Current Device
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-zinc-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Globe className="w-3 h-3" /> {session.location}
                                            </span>
                                            <span>•</span>
                                            <span>{session.browser}</span>
                                            <span>•</span>
                                            <span>{session.ip}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right text-sm text-zinc-500">
                                        <div className="flex items-center gap-1 justify-end">
                                            <Clock className="w-3 h-3" /> {session.lastActive}
                                        </div>
                                    </div>
                                    {!session.isCurrent && (
                                        <GlassButton
                                            variant="ghost"
                                            size="sm"
                                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                            onClick={() => handleLogout(session.id)}
                                        >
                                            Revoke
                                        </GlassButton>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </DashboardShell>
    );
}
