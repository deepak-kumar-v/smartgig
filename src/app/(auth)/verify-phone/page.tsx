'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { Logo } from '@/components/ui/logo';
import { Phone, CheckCircle, AlertCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';

type PageState = 'phone_entry' | 'code_entry' | 'loading' | 'success' | 'error';

export default function VerifyPhonePage() {
    const [pageState, setPageState] = useState<PageState>('phone_entry');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+1');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Resend timer countdown
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const formatPhoneNumber = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setPageState('loading');
        await new Promise(resolve => setTimeout(resolve, 1500));

        setPageState('code_entry');
        setResendTimer(60);

        // Focus first OTP input
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all filled
        if (newOtp.every(d => d !== '') && index === 5) {
            handleVerifyCode(newOtp.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyCode = async (code: string) => {
        setPageState('loading');
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock: code "000000" is invalid
        if (code === '000000') {
            setError('Invalid verification code. Please try again.');
            setPageState('code_entry');
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        } else {
            setPageState('success');
        }
    };

    const handleResendCode = async () => {
        if (resendTimer > 0) return;

        setPageState('loading');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPageState('code_entry');
        setResendTimer(60);
        setOtp(['', '', '', '', '', '']);
        setError('');
        otpRefs.current[0]?.focus();
    };

    // Success state
    if (pageState === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <GlassCard className="w-full max-w-md p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Phone Verified!</h1>
                    <p className="text-zinc-400 mb-6">
                        Your phone number has been successfully verified.
                    </p>
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6">
                        <p className="text-emerald-400 text-sm">
                            ✓ {countryCode} {phoneNumber} verified
                        </p>
                    </div>
                    <Link href="/dashboard">
                        <GlassButton variant="primary" className="w-full">
                            Continue to Dashboard
                        </GlassButton>
                    </Link>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            <GlassCard className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-6">
                        <Logo />
                    </Link>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {pageState === 'code_entry' ? 'Enter Verification Code' : 'Verify Phone Number'}
                    </h1>
                    <p className="text-zinc-400">
                        {pageState === 'code_entry'
                            ? `We sent a 6-digit code to ${countryCode} ${phoneNumber}`
                            : 'Secure your account with phone verification'
                        }
                    </p>
                </div>

                {pageState === 'phone_entry' && (
                    <form onSubmit={handlePhoneSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-white text-sm font-medium">Phone Number</label>
                            <div className="flex gap-2">
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-3 py-3 focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="+1">+1 US</option>
                                    <option value="+44">+44 UK</option>
                                    <option value="+91">+91 IN</option>
                                    <option value="+61">+61 AU</option>
                                    <option value="+49">+49 DE</option>
                                </select>
                                <div className="relative flex-1">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <GlassInput
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                                        placeholder="555-123-4567"
                                        className="pl-12"
                                        maxLength={12}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-rose-400" />
                                <span className="text-rose-400 text-sm">{error}</span>
                            </div>
                        )}

                        <GlassButton variant="primary" className="w-full">
                            Send Verification Code
                        </GlassButton>
                    </form>
                )}

                {pageState === 'code_entry' && (
                    <div className="space-y-6">
                        {/* OTP Input */}
                        <div className="flex justify-center gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { otpRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-2xl font-bold bg-zinc-800/50 border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                                    maxLength={1}
                                />
                            ))}
                        </div>

                        {error && (
                            <div className="flex items-center justify-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-rose-400" />
                                <span className="text-rose-400 text-sm">{error}</span>
                            </div>
                        )}

                        {/* Resend */}
                        <div className="text-center">
                            {resendTimer > 0 ? (
                                <p className="text-zinc-500 text-sm">
                                    Resend code in {resendTimer}s
                                </p>
                            ) : (
                                <button
                                    onClick={handleResendCode}
                                    className="text-indigo-400 hover:text-indigo-300 text-sm inline-flex items-center gap-1"
                                >
                                    <RefreshCw className="w-4 h-4" /> Resend Code
                                </button>
                            )}
                        </div>

                        {/* Change number */}
                        <button
                            onClick={() => {
                                setPageState('phone_entry');
                                setOtp(['', '', '', '', '', '']);
                                setError('');
                            }}
                            className="w-full text-zinc-400 hover:text-white text-sm inline-flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Change phone number
                        </button>
                    </div>
                )}

                {pageState === 'loading' && (
                    <div className="py-8 text-center">
                        <Loader2 className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-spin" />
                        <p className="text-zinc-400">Please wait...</p>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <Link
                        href="/dashboard"
                        className="text-zinc-500 hover:text-zinc-400 text-sm"
                    >
                        Skip for now
                    </Link>
                </div>
            </GlassCard>
        </div>
    );
}
