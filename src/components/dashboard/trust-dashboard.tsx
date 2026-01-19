'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import {
    Shield, AlertTriangle, CheckCircle, Clock, Scale,
    ChevronRight, X, Send, Info
} from 'lucide-react';

interface Strike {
    id: string;
    reason: string;
    severity: number;
    createdAt: Date;
    expiresAt: Date;
    appeal?: {
        id: string;
        reason: string;
        status: string;
    };
}

interface TrustDashboardProps {
    trustScore: number;
    strikes: Strike[];
    totalStrikes: number;
}

function getSeverityConfig(severity: number) {
    switch (severity) {
        case 1: return { label: 'Warning', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' };
        case 2: return { label: 'Minor Violation', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
        case 3: return { label: 'Moderate Violation', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' };
        case 4: return { label: 'Severe Violation', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
        case 5: return { label: 'Critical Violation', color: 'text-red-500', bg: 'bg-red-600/20', border: 'border-red-600/30' };
        default: return { label: 'Unknown', color: 'text-zinc-400', bg: 'bg-zinc-500/20', border: 'border-zinc-500/30' };
    }
}

function getAccountStatus(activeStrikes: number) {
    if (activeStrikes === 0) return { status: 'Good Standing', color: 'text-emerald-400', icon: CheckCircle };
    if (activeStrikes === 1) return { status: 'Warning', color: 'text-amber-400', icon: AlertTriangle };
    if (activeStrikes === 2) return { status: 'Restricted', color: 'text-orange-400', icon: AlertTriangle };
    if (activeStrikes >= 3) return { status: 'At Risk', color: 'text-rose-400', icon: AlertTriangle };
    return { status: 'Unknown', color: 'text-zinc-400', icon: Info };
}

function AppealModal({
    strike,
    onClose,
    onSubmit
}: {
    strike: Strike;
    onClose: () => void;
    onSubmit: (reason: string) => void;
}) {
    const [reason, setReason] = useState('');
    const severity = getSeverityConfig(strike.severity);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <GlassCard className="w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-500/20">
                            <Scale className="w-5 h-5 text-violet-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Submit Appeal</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Strike Details */}
                <div className={`p-4 rounded-xl ${severity.bg} ${severity.border} border mb-6`}>
                    <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 ${severity.color} mt-0.5`} />
                        <div>
                            <div className={`text-sm font-medium ${severity.color}`}>{severity.label}</div>
                            <p className="text-sm text-zinc-300 mt-1">{strike.reason}</p>
                            <p className="text-xs text-zinc-500 mt-2">
                                Issued: {new Date(strike.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Appeal Form */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Why should this be reconsidered?
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain your side of the situation. Be specific and provide any relevant context or evidence..."
                            rows={5}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 resize-none"
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            Appeals are reviewed by our Trust & Safety team within 48 hours.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-start gap-3">
                            <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                            <div className="text-sm text-zinc-300">
                                <strong className="text-blue-400">Fair Process Guarantee:</strong> We review
                                both sides before making a decision. Successful appeals will remove the strike
                                from your record.
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <GlassButton variant="secondary" className="flex-1" onClick={onClose}>
                            Cancel
                        </GlassButton>
                        <GlassButton
                            variant="primary"
                            className="flex-1"
                            onClick={() => onSubmit(reason)}
                            disabled={!reason.trim()}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Submit Appeal
                        </GlassButton>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}

export function TrustDashboard({ trustScore, strikes, totalStrikes }: TrustDashboardProps) {
    const [appealingStrike, setAppealingStrike] = useState<Strike | null>(null);

    const activeStrikes = strikes.filter(s => new Date(s.expiresAt) > new Date());
    const accountStatus = getAccountStatus(activeStrikes.length);
    const StatusIcon = accountStatus.icon;

    const handleSubmitAppeal = (reason: string) => {
        // TODO: Implement API call to submit appeal
        console.log('Submitting appeal:', reason);
        setAppealingStrike(null);
    };

    return (
        <div className="space-y-6">
            {/* Trust Score Overview */}
            <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-violet-500/20">
                            <Shield className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Your Trust Score</h3>
                            <p className="text-sm text-zinc-400">Transparent account standing</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white">{trustScore.toFixed(0)}%</div>
                        <div className={`text-sm ${accountStatus.color} flex items-center gap-1 justify-end`}>
                            <StatusIcon className="w-4 h-4" />
                            {accountStatus.status}
                        </div>
                    </div>
                </div>

                {/* Trust Score Bar */}
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-4">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${trustScore >= 80 ? 'bg-emerald-500' :
                                trustScore >= 60 ? 'bg-amber-500' :
                                    trustScore >= 40 ? 'bg-orange-500' :
                                        'bg-rose-500'
                            }`}
                        style={{ width: `${trustScore}%` }}
                    />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-zinc-800/50">
                        <div className="text-xl font-bold text-white">{activeStrikes.length}</div>
                        <div className="text-xs text-zinc-500">Active Strikes</div>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-800/50">
                        <div className="text-xl font-bold text-white">{totalStrikes}</div>
                        <div className="text-xs text-zinc-500">Total Ever</div>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-800/50">
                        <div className="text-xl font-bold text-white">{5 - activeStrikes.length}</div>
                        <div className="text-xs text-zinc-500">Until Ban</div>
                    </div>
                </div>
            </GlassCard>

            {/* N-Strike System Info */}
            <GlassCard className="p-5 border-blue-500/20 bg-blue-500/5">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-blue-400 mb-1">How Our Strike System Works</h4>
                        <p className="text-sm text-zinc-400">
                            We use a fair, transparent n-strike system. Strikes expire after 12 months
                            and can be appealed. 5 active strikes result in account suspension. This
                            system applies equally to all users - freelancers and clients alike.
                        </p>
                    </div>
                </div>
            </GlassCard>

            {/* Strike History */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Strike History</h3>

                {strikes.length > 0 ? (
                    <div className="space-y-3">
                        {strikes.map((strike) => {
                            const severity = getSeverityConfig(strike.severity);
                            const isExpired = new Date(strike.expiresAt) < new Date();
                            const hasAppeal = !!strike.appeal;
                            const appealStatus = strike.appeal?.status;

                            return (
                                <div
                                    key={strike.id}
                                    className={`p-4 rounded-xl border ${isExpired ? 'bg-zinc-800/30 border-zinc-800' : `${severity.bg} ${severity.border}`
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className={`w-5 h-5 ${isExpired ? 'text-zinc-600' : severity.color} mt-0.5`} />
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-sm font-medium ${isExpired ? 'text-zinc-500' : severity.color}`}>
                                                        {severity.label}
                                                    </span>
                                                    {isExpired && (
                                                        <span className="px-2 py-0.5 rounded text-xs bg-zinc-700 text-zinc-400">
                                                            Expired
                                                        </span>
                                                    )}
                                                    {hasAppeal && (
                                                        <span className={`px-2 py-0.5 rounded text-xs ${appealStatus === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                appealStatus === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' :
                                                                    'bg-violet-500/20 text-violet-400'
                                                            }`}>
                                                            Appeal {appealStatus?.toLowerCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-sm mt-1 ${isExpired ? 'text-zinc-600' : 'text-zinc-300'}`}>
                                                    {strike.reason}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                                                    <span>Issued: {new Date(strike.createdAt).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>Expires: {new Date(strike.expiresAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {!isExpired && !hasAppeal && (
                                            <button
                                                onClick={() => setAppealingStrike(strike)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 text-sm hover:bg-violet-500/30 transition-colors"
                                            >
                                                <Scale className="w-3.5 h-3.5" />
                                                Appeal
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Shield className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-white mb-1">Clean Record</h4>
                        <p className="text-zinc-400">You have no strikes on your account. Keep up the great work!</p>
                    </div>
                )}
            </GlassCard>

            {/* Appeal Modal */}
            {appealingStrike && (
                <AppealModal
                    strike={appealingStrike}
                    onClose={() => setAppealingStrike(null)}
                    onSubmit={handleSubmitAppeal}
                />
            )}
        </div>
    );
}
