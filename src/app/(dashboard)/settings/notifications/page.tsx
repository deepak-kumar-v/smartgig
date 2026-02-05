'use client';

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import Link from 'next/link';
import {
    Bell, Mail, MessageSquare, Briefcase, DollarSign, FileText,
    AlertTriangle, Star, Smartphone, Monitor, ArrowLeft, Save, CheckCircle
} from 'lucide-react';

interface NotificationSetting {
    id: string;
    category: string;
    label: string;
    description: string;
    email: boolean;
    push: boolean;
    inApp: boolean;
}

const defaultSettings: NotificationSetting[] = [
    { id: 'jobs', category: 'Jobs', label: 'New Job Matches', description: 'Jobs that match your skills and preferences', email: true, push: true, inApp: true },
    { id: 'job-invites', category: 'Jobs', label: 'Job Invitations', description: 'Direct invitations from clients', email: true, push: true, inApp: true },
    { id: 'proposals', category: 'Proposals', label: 'Proposal Updates', description: 'When clients view, shortlist, or respond to proposals', email: true, push: true, inApp: true },
    { id: 'contracts', category: 'Contracts', label: 'Contract Activity', description: 'Milestone updates, approvals, and revisions', email: true, push: true, inApp: true },
    { id: 'payments', category: 'Payments', label: 'Payment Notifications', description: 'Payments received, pending releases, and withdrawals', email: true, push: true, inApp: true },
    { id: 'messages', category: 'Messages', label: 'New Messages', description: 'Direct messages from clients and team', email: false, push: true, inApp: true },
    { id: 'reviews', category: 'Reviews', label: 'Review Notifications', description: 'When you receive a new review', email: true, push: true, inApp: true },
    { id: 'disputes', category: 'Disputes', label: 'Dispute Updates', description: 'Updates on dispute cases', email: true, push: true, inApp: true },
    { id: 'marketing', category: 'SmartGIG', label: 'Tips & Recommendations', description: 'Platform tips and feature updates', email: false, push: false, inApp: true },
    { id: 'newsletter', category: 'SmartGIG', label: 'Newsletter', description: 'Weekly digest and industry news', email: true, push: false, inApp: false },
];

export default function NotificationSettingsPage() {
    const [settings, setSettings] = useState(defaultSettings);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const toggleSetting = (id: string, channel: 'email' | 'push' | 'inApp') => {
        setSettings(prev => prev.map(s =>
            s.id === id ? { ...s, [channel]: !s[channel] } : s
        ));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        setSaved(true);
    };

    const categories = [...new Set(settings.map(s => s.category))];

    return (
        <DashboardShell role="freelancer">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/notifications" className="text-zinc-500 hover:text-white text-sm inline-flex items-center gap-1 mb-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Notifications
                        </Link>
                        <h1 className="text-2xl font-bold text-white">Notification Preferences</h1>
                        <p className="text-zinc-400">Choose how you want to be notified</p>
                    </div>
                    <GlassButton variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? (
                            'Saving...'
                        ) : saved ? (
                            <><CheckCircle className="w-4 h-4 mr-2" /> Saved</>
                        ) : (
                            <><Save className="w-4 h-4 mr-2" /> Save Preferences</>
                        )}
                    </GlassButton>
                </div>

                {/* Channel Legend */}
                <GlassCard className="p-4">
                    <div className="flex flex-wrap gap-6 justify-center">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-indigo-400" />
                            <span className="text-zinc-400 text-sm">Email</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                            <span className="text-zinc-400 text-sm">Push Notification</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-amber-400" />
                            <span className="text-zinc-400 text-sm">In-App</span>
                        </div>
                    </div>
                </GlassCard>

                {/* Settings by Category */}
                {categories.map(category => (
                    <GlassCard key={category} className="p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">{category}</h2>
                        <div className="space-y-4">
                            {settings.filter(s => s.category === category).map(setting => (
                                <div key={setting.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{setting.label}</p>
                                        <p className="text-zinc-500 text-sm">{setting.description}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        {/* Email Toggle */}
                                        <button
                                            onClick={() => toggleSetting(setting.id, 'email')}
                                            className={`p-2 rounded-lg transition-all ${setting.email
                                                    ? 'bg-indigo-500/20 text-indigo-400'
                                                    : 'bg-zinc-800 text-zinc-600'
                                                }`}
                                            title="Email"
                                        >
                                            <Mail className="w-4 h-4" />
                                        </button>
                                        {/* Push Toggle */}
                                        <button
                                            onClick={() => toggleSetting(setting.id, 'push')}
                                            className={`p-2 rounded-lg transition-all ${setting.push
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-zinc-800 text-zinc-600'
                                                }`}
                                            title="Push"
                                        >
                                            <Smartphone className="w-4 h-4" />
                                        </button>
                                        {/* In-App Toggle */}
                                        <button
                                            onClick={() => toggleSetting(setting.id, 'inApp')}
                                            className={`p-2 rounded-lg transition-all ${setting.inApp
                                                    ? 'bg-amber-500/20 text-amber-400'
                                                    : 'bg-zinc-800 text-zinc-600'
                                                }`}
                                            title="In-App"
                                        >
                                            <Monitor className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                ))}

                {/* Quick Actions */}
                <div className="flex gap-4 justify-center">
                    <GlassButton
                        variant="ghost"
                        onClick={() => setSettings(prev => prev.map(s => ({ ...s, email: true, push: true, inApp: true })))}
                    >
                        Enable All
                    </GlassButton>
                    <GlassButton
                        variant="ghost"
                        onClick={() => setSettings(prev => prev.map(s => ({ ...s, email: false, push: false, inApp: true })))}
                    >
                        In-App Only
                    </GlassButton>
                    <GlassButton
                        variant="ghost"
                        onClick={() => setSettings(prev => prev.map(s => ({ ...s, email: false, push: false, inApp: false })))}
                    >
                        Disable All
                    </GlassButton>
                </div>
            </div>
        </DashboardShell>
    );
}
