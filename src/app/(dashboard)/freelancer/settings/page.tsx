'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import {
    Shield, Clock, Briefcase, Bell, Eye, Lock,
    Save, AlertTriangle, CheckCircle, Info, ToggleLeft, ToggleRight,
    Calendar, Users, DollarSign
} from 'lucide-react';

export default function FreelancerSettingsPage() {
    // Workload Protection Settings
    const [availability, setAvailability] = useState(true);
    const [maxConcurrent, setMaxConcurrent] = useState(3);
    const [autoDecline, setAutoDecline] = useState(true);
    const [showCapacityBadge, setShowCapacityBadge] = useState(true);

    // Work Preferences
    const [minProjectBudget, setMinProjectBudget] = useState(500);
    const [preferredDuration, setPreferredDuration] = useState('any');
    const [acceptTrialTasks, setAcceptTrialTasks] = useState(true);

    // Privacy Settings
    const [showEarnings, setShowEarnings] = useState(false);
    const [allowDirectContact, setAllowDirectContact] = useState(true);

    // Notification Settings
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [jobMatchAlerts, setJobMatchAlerts] = useState(true);
    const [proposalUpdates, setProposalUpdates] = useState(true);

    const currentLoad = 2; // This would come from actual data
    const capacityPercentage = (currentLoad / maxConcurrent) * 100;

    const handleSave = () => {
        // TODO: Implement save to database
        console.log('Saving settings...');
    };

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Freelancer Settings</h1>
                    <p className="text-zinc-400">Manage your workload, availability, and preferences</p>
                </div>

                {/* Workload Protection Section */}
                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-violet-500/20">
                            <Shield className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Workload Protection</h2>
                            <p className="text-sm text-zinc-500">Control your capacity and prevent burnout</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Availability Toggle */}
                        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                            <div className="flex items-center gap-3">
                                {availability ? (
                                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                                ) : (
                                    <div className="w-3 h-3 rounded-full bg-zinc-600" />
                                )}
                                <div>
                                    <h3 className="font-medium text-white">Available for Work</h3>
                                    <p className="text-sm text-zinc-500">
                                        {availability ? 'You appear in talent searches' : 'You are hidden from searches'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAvailability(!availability)}
                                className="focus:outline-none"
                            >
                                {availability ? (
                                    <ToggleRight className="w-10 h-10 text-emerald-400" />
                                ) : (
                                    <ToggleLeft className="w-10 h-10 text-zinc-600" />
                                )}
                            </button>
                        </div>

                        {/* Max Concurrent Projects */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-white font-medium">Maximum Concurrent Projects</label>
                                <span className="text-violet-400 font-bold">{maxConcurrent}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={maxConcurrent}
                                onChange={(e) => setMaxConcurrent(parseInt(e.target.value))}
                                className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-violet-500"
                            />
                            <div className="flex justify-between text-xs text-zinc-500">
                                <span>1 project</span>
                                <span>10 projects</span>
                            </div>

                            {/* Current Load Indicator */}
                            <div className="p-4 bg-zinc-800/50 rounded-xl mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-zinc-400">Current Workload</span>
                                    <span className={`text-sm font-medium ${capacityPercentage >= 80 ? 'text-amber-400' : 'text-emerald-400'
                                        }`}>
                                        {currentLoad}/{maxConcurrent} projects
                                    </span>
                                </div>
                                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${capacityPercentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                        style={{ width: `${capacityPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Auto-Decline Option */}
                        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                            <div>
                                <h3 className="font-medium text-white">Auto-Decline When Full</h3>
                                <p className="text-sm text-zinc-500">
                                    Automatically decline new proposals when at capacity
                                </p>
                            </div>
                            <button
                                onClick={() => setAutoDecline(!autoDecline)}
                                className="focus:outline-none"
                            >
                                {autoDecline ? (
                                    <ToggleRight className="w-10 h-10 text-emerald-400" />
                                ) : (
                                    <ToggleLeft className="w-10 h-10 text-zinc-600" />
                                )}
                            </button>
                        </div>

                        {/* Show Capacity Badge */}
                        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                            <div>
                                <h3 className="font-medium text-white">Show Capacity Badge</h3>
                                <p className="text-sm text-zinc-500">
                                    Display your availability status on your profile
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCapacityBadge(!showCapacityBadge)}
                                className="focus:outline-none"
                            >
                                {showCapacityBadge ? (
                                    <ToggleRight className="w-10 h-10 text-emerald-400" />
                                ) : (
                                    <ToggleLeft className="w-10 h-10 text-zinc-600" />
                                )}
                            </button>
                        </div>
                    </div>
                </GlassCard>

                {/* Work Preferences Section */}
                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-blue-500/20">
                            <Briefcase className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Work Preferences</h2>
                            <p className="text-sm text-zinc-500">Set your project preferences</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Minimum Budget */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-white font-medium">Minimum Project Budget</label>
                                <span className="text-blue-400 font-bold">${minProjectBudget}</span>
                            </div>
                            <input
                                type="range"
                                min="100"
                                max="5000"
                                step="100"
                                value={minProjectBudget}
                                onChange={(e) => setMinProjectBudget(parseInt(e.target.value))}
                                className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                            />
                            <p className="text-xs text-zinc-500">
                                Only show jobs with budgets above this amount
                            </p>
                        </div>

                        {/* Preferred Duration */}
                        <div className="space-y-3">
                            <label className="text-white font-medium">Preferred Project Duration</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { value: 'any', label: 'Any' },
                                    { value: 'short', label: '< 1 week' },
                                    { value: 'medium', label: '1-4 weeks' },
                                    { value: 'long', label: '1+ month' },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setPreferredDuration(option.value)}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${preferredDuration === option.value
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Accept Trial Tasks */}
                        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                            <div>
                                <h3 className="font-medium text-white">Accept Trial Tasks</h3>
                                <p className="text-sm text-zinc-500">
                                    Allow clients to send paid trial task invitations
                                </p>
                            </div>
                            <button
                                onClick={() => setAcceptTrialTasks(!acceptTrialTasks)}
                                className="focus:outline-none"
                            >
                                {acceptTrialTasks ? (
                                    <ToggleRight className="w-10 h-10 text-emerald-400" />
                                ) : (
                                    <ToggleLeft className="w-10 h-10 text-zinc-600" />
                                )}
                            </button>
                        </div>
                    </div>
                </GlassCard>

                {/* Privacy Settings */}
                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-emerald-500/20">
                            <Eye className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Privacy Settings</h2>
                            <p className="text-sm text-zinc-500">Control what others can see</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                            <div>
                                <h3 className="font-medium text-white">Show Earnings on Profile</h3>
                                <p className="text-sm text-zinc-500">Display total earnings publicly</p>
                            </div>
                            <button
                                onClick={() => setShowEarnings(!showEarnings)}
                                className="focus:outline-none"
                            >
                                {showEarnings ? (
                                    <ToggleRight className="w-10 h-10 text-emerald-400" />
                                ) : (
                                    <ToggleLeft className="w-10 h-10 text-zinc-600" />
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                            <div>
                                <h3 className="font-medium text-white">Allow Direct Contact</h3>
                                <p className="text-sm text-zinc-500">Let clients message you directly</p>
                            </div>
                            <button
                                onClick={() => setAllowDirectContact(!allowDirectContact)}
                                className="focus:outline-none"
                            >
                                {allowDirectContact ? (
                                    <ToggleRight className="w-10 h-10 text-emerald-400" />
                                ) : (
                                    <ToggleLeft className="w-10 h-10 text-zinc-600" />
                                )}
                            </button>
                        </div>
                    </div>
                </GlassCard>

                {/* Notification Settings */}
                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-amber-500/20">
                            <Bell className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Notifications</h2>
                            <p className="text-sm text-zinc-500">Manage your notification preferences</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { label: 'Email Notifications', desc: 'Receive updates via email', state: emailNotifications, setter: setEmailNotifications },
                            { label: 'Job Match Alerts', desc: 'Get notified about matching jobs', state: jobMatchAlerts, setter: setJobMatchAlerts },
                            { label: 'Proposal Updates', desc: 'Updates on your proposals', state: proposalUpdates, setter: setProposalUpdates },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                                <div>
                                    <h3 className="font-medium text-white">{item.label}</h3>
                                    <p className="text-sm text-zinc-500">{item.desc}</p>
                                </div>
                                <button
                                    onClick={() => item.setter(!item.state)}
                                    className="focus:outline-none"
                                >
                                    {item.state ? (
                                        <ToggleRight className="w-10 h-10 text-emerald-400" />
                                    ) : (
                                        <ToggleLeft className="w-10 h-10 text-zinc-600" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Save Button */}
                <div className="flex justify-end gap-4">
                    <GlassButton variant="secondary">Cancel</GlassButton>
                    <GlassButton variant="primary" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                    </GlassButton>
                </div>
            </div>
        </>
    );
}
