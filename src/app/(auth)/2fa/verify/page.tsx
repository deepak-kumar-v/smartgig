'use client';

import React, { useState, useTransition } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { Logo } from '@/components/ui/logo';
import { Shield, Lock } from 'lucide-react';
import { verifyTwoFactorToken } from '@/lib/security-services';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function TwoFactorVerifyPage() {
    const [otp, setOtp] = useState('');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleVerify = () => {
        if (otp.length < 6) return;

        startTransition(async () => {
            const isValid = await verifyTwoFactorToken(otp);
            if (isValid) {
                toast.success("Verified!");
                router.push('/dashboard');
            } else {
                toast.error("Invalid code. Try again.");
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-background z-0" />
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px]" />

            <GlassCard variant="heavy" className="w-full max-w-md p-8 relative z-10 flex flex-col gap-6">
                <div className="text-center mb-2">
                    <div className="flex justify-center mb-6">
                        <Logo />
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h1>
                    <p className="text-white/50 text-sm">Enter the code from your authenticator app.</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/70 ml-1">Verification Code</label>
                        <GlassInput
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="000 000"
                            className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                            maxLength={6}
                        />
                    </div>

                    <GlassButton
                        className="w-full"
                        size="lg"
                        onClick={handleVerify}
                        disabled={otp.length < 6 || isPending}
                    >
                        {isPending ? "Verifying..." : "Verify Identity"}
                    </GlassButton>
                </div>

                <button className="text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    Lost your device? Use a recovery code
                </button>
            </GlassCard>
        </div>
    );
}
