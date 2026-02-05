'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { Shield, Smartphone, Key, Lock, Globe, AlertTriangle, CheckCircle, Copy } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { cn } from '@/lib/utils';
import { generateTwoFactorSecret, verifyTwoFactorToken, enableTwoFactor, disableTwoFactor, generateRecoveryCodes, getLoginHistory } from '@/lib/security-services';
import { toast } from 'sonner';

export default function SecuritySettingsPage() {
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [setupStep, setSetupStep] = useState<'idle' | 'qr' | 'verify' | 'codes'>('idle');
    const [secretData, setSecretData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
    const [otp, setOtp] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [loginHistory, setLoginHistory] = useState<any[]>([]);

    React.useEffect(() => {
        getLoginHistory().then(setLoginHistory);
    }, []);

    const handleEnable2FA = async () => {
        setSetupStep('qr');
        const data = await generateTwoFactorSecret();
        setSecretData(data);
    };

    const handleVerifyAndEnable = async () => {
        const isValid = await verifyTwoFactorToken(otp);
        if (isValid) {
            await enableTwoFactor('mock-user-id');
            const codes = await generateRecoveryCodes();
            setRecoveryCodes(codes);
            setSetupStep('codes');
            setIs2FAEnabled(true);
            toast.success("Two-Factor Authentication enabled!");
        } else {
            toast.error("Invalid code. Please try again.");
        }
    };

    const handleDisable2FA = async () => {
        if (confirm("Are you sure you want to disable 2FA? This will reduce your account security.")) {
            await disableTwoFactor('mock-user-id');
            setIs2FAEnabled(false);
            setSetupStep('idle');
            toast.info("Two-Factor Authentication disabled.");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    return (
        <DashboardShell role="freelancer"> {/* Role is dynamic ideally, but shell fits all */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Security Settings</h1>
                <p className="text-zinc-400">Manage your password, 2FA, and active sessions.</p>
            </div>

            <div className="space-y-6">
                {/* Two-Factor Authentication */}
                <GlassCard className="p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-xl", is2FAEnabled ? "bg-emerald-500/20" : "bg-zinc-800")}>
                                <Shield className={cn("w-6 h-6", is2FAEnabled ? "text-emerald-400" : "text-zinc-500")} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    Two-Factor Authentication (2FA)
                                    {is2FAEnabled && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Enabled</span>
                                    )}
                                </h2>
                                <p className="text-sm text-zinc-400 mt-1">
                                    Add an extra layer of security to your account.
                                </p>
                            </div>
                        </div>
                        {!is2FAEnabled ? (
                            <GlassButton onClick={handleEnable2FA} disabled={setupStep !== 'idle'}>
                                Setup 2FA
                            </GlassButton>
                        ) : (
                            <GlassButton variant="secondary" onClick={handleDisable2FA} className="text-rose-400 hover:text-rose-300 border-rose-500/20">
                                Disable 2FA
                            </GlassButton>
                        )}
                    </div>

                    {/* Setup Flow */}
                    {setupStep === 'qr' && secretData && (
                        <div className="bg-zinc-900/50 rounded-xl p-6 border border-white/5 animate-in fade-in slide-in-from-top-4">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-medium text-white">1. Scan QR Code</h3>
                                    <p className="text-sm text-zinc-400">
                                        Open your authenticator app (Google Authenticator, Authy, etc.) and scan this code.
                                    </p>
                                    <div className="bg-white p-2 rounded-lg w-fit">
                                        {/* Mock QR Visualization */}
                                        <img src={secretData.qrCodeUrl} alt="2FA QR Code" className="w-32 h-32" />
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        Can't scan? Manual key: <span className="font-mono text-white select-all">{secretData.secret}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-medium text-white">2. Enter Verification Code</h3>
                                    <p className="text-sm text-zinc-400">
                                        Enter the 6-digit code from your app to verify setup. (Mock: 123456)
                                    </p>
                                    <div className="flex gap-2">
                                        <GlassInput
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="000 000"
                                            className="font-mono text-center tracking-widest text-lg w-40"
                                            maxLength={6}
                                        />
                                        <GlassButton onClick={handleVerifyAndEnable} disabled={otp.length < 6}>
                                            Verify
                                        </GlassButton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {setupStep === 'codes' && (
                        <div className="bg-emerald-500/5 rounded-xl p-6 border border-emerald-500/20 animate-in fade-in">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-medium text-emerald-400">Setup Complete! Save your recovery codes.</h3>
                            </div>
                            <p className="text-sm text-zinc-400 mb-4">
                                If you lose access to your device, you can use these codes to log in. Keep them safe.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                                {recoveryCodes.map((code, i) => (
                                    <div key={i} className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 font-mono text-xs text-zinc-300 text-center">
                                        {code}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <GlassButton size="sm" variant="secondary" onClick={() => copyToClipboard(recoveryCodes.join('\\n'))}>
                                    <Copy className="w-3 h-3 mr-2" /> Copy All
                                </GlassButton>
                                <GlassButton size="sm" onClick={() => setSetupStep('idle')}>
                                    Done
                                </GlassButton>
                            </div>
                        </div>
                    )}
                </GlassCard>

                {/* Password Change */}
                <GlassCard className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-zinc-800">
                            <Key className="w-6 h-6 text-zinc-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Change Password</h2>
                            <p className="text-sm text-zinc-400 mt-1">
                                Ensure your account is using a long, random password.
                            </p>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-400">Current Password</label>
                            <GlassInput type="password" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-400">New Password</label>
                            <GlassInput type="password" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-400">Confirm Password</label>
                            <div className="flex gap-2">
                                <GlassInput type="password" placeholder="••••••••" className="flex-1" />
                                <GlassButton>Update</GlassButton>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Login History */}
                <GlassCard className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-zinc-800">
                            <Globe className="w-6 h-6 text-zinc-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Login History</h2>
                            <p className="text-sm text-zinc-400 mt-1">
                                Recent activity on your account.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        {loginHistory.map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <Smartphone className="w-4 h-4 text-zinc-500" />
                                    <div>
                                        <div className="text-sm font-medium text-white">{session.device}</div>
                                        <div className="text-xs text-zinc-500">{session.location} • {session.ip}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-zinc-400">{session.time}</div>
                                    {session.status === 'Active' && (
                                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5">Current Session</div>
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
