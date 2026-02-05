'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import Link from 'next/link';
import {
    ArrowLeft, Wallet, ArrowDownCircle, Building, CreditCard, Smartphone,
    AlertCircle, CheckCircle, Loader2, Clock, DollarSign, History
} from 'lucide-react';
import { format } from 'date-fns';
import {
    getWallet, getPaymentMethods, getWithdrawals, requestWithdrawal,
    type Wallet as WalletModel, type PaymentMethod, type Withdrawal, type WithdrawalStatus,
    formatCurrency, getPaymentMethodDisplay
} from '@/lib/payments-service';

const statusConfig: Record<WithdrawalStatus, { icon: React.ElementType; color: string; bgColor: string }> = {
    REQUESTED: { icon: Clock, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    PROCESSING: { icon: Loader2, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    COMPLETED: { icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    FAILED: { icon: AlertCircle, color: 'text-rose-400', bgColor: 'bg-rose-500/20' },
    CANCELLED: { icon: AlertCircle, color: 'text-zinc-400', bgColor: 'bg-zinc-500/20' },
};

export default function WithdrawPage() {
    const [wallet, setWallet] = useState<WalletModel | null>(null);
    const [paymentMethods, setPaymentMethodsList] = useState<PaymentMethod[]>([]);
    const [withdrawalHistory, setWithdrawalHistory] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [amount, setAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const minWithdrawal = 50;
    const withdrawalFee = 2.50;

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const [walletData, methodsData, historyData] = await Promise.all([
                getWallet('user-1'),
                getPaymentMethods(),
                getWithdrawals(),
            ]);
            setWallet(walletData);
            setPaymentMethodsList(methodsData);
            setWithdrawalHistory(historyData);
            setLoading(false);
        }
        loadData();
    }, []);

    const parsedAmount = parseFloat(amount) || 0;
    const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);
    const totalReceive = parsedAmount - withdrawalFee;

    const isValidAmount = wallet && parsedAmount >= minWithdrawal && parsedAmount <= wallet.availableBalance;

    const handleSubmit = async () => {
        if (!selectedMethod || !wallet) return;

        setSubmitting(true);
        setError(null);

        const result = await requestWithdrawal({
            amount: parsedAmount,
            paymentMethodId: selectedMethod,
            userId: 'user-1',
            userRole: 'FREELANCER',
        });

        if (result.success) {
            setStep(3);
        } else {
            setError(result.error || 'Failed to process withdrawal');
        }

        setSubmitting(false);
    };

    const getMethodIcon = (type: string) => {
        switch (type) {
            case 'bank': return Building;
            case 'upi': return Smartphone;
            default: return CreditCard;
        }
    };

    if (loading || !wallet) {
        return (
            <DashboardShell role="freelancer">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell role="freelancer">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <Link href="/payments" className="text-zinc-500 hover:text-white text-sm inline-flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" />Back to Payments
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Withdraw Funds</h1>
                    <p className="text-zinc-400">Transfer your earnings to your bank account</p>
                </div>

                {/* Balance Card */}
                <GlassCard className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-sm">Available for Withdrawal</p>
                            <p className="text-3xl font-bold text-white">{formatCurrency(wallet.availableBalance)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-500/20">
                            <Wallet className="w-8 h-8 text-emerald-400" />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-4">
                        <div className="flex items-center gap-2 text-amber-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{formatCurrency(wallet.pendingBalance)} pending</span>
                        </div>
                    </div>
                </GlassCard>

                {/* Step 1: Amount */}
                {step === 1 && (
                    <GlassCard className="p-6 space-y-6">
                        <h2 className="text-lg font-semibold text-white">Enter Amount</h2>

                        <div className="space-y-2">
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500" />
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-3xl font-bold rounded-xl pl-14 pr-4 py-6 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Min: {formatCurrency(minWithdrawal)} | Fee: {formatCurrency(withdrawalFee)}</span>
                                <button
                                    onClick={() => setAmount(wallet.availableBalance.toString())}
                                    className="text-indigo-400 hover:underline"
                                >
                                    Withdraw All
                                </button>
                            </div>
                        </div>

                        {parsedAmount > wallet.availableBalance && (
                            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-rose-400" />
                                <span className="text-rose-400 text-sm">Amount exceeds available balance</span>
                            </div>
                        )}

                        {parsedAmount > 0 && parsedAmount < minWithdrawal && (
                            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                <span className="text-amber-400 text-sm">Minimum withdrawal is {formatCurrency(minWithdrawal)}</span>
                            </div>
                        )}

                        <GlassButton
                            variant="primary"
                            className="w-full"
                            disabled={!isValidAmount}
                            onClick={() => setStep(2)}
                        >
                            Continue
                        </GlassButton>
                    </GlassCard>
                )}

                {/* Step 2: Select Method */}
                {step === 2 && (
                    <GlassCard className="p-6 space-y-6">
                        <h2 className="text-lg font-semibold text-white">Select Withdrawal Method</h2>

                        <div className="space-y-3">
                            {paymentMethods.map((method) => {
                                const Icon = getMethodIcon(method.type);
                                return (
                                    <button
                                        key={method.id}
                                        onClick={() => setSelectedMethod(method.id)}
                                        className={`w-full p-4 rounded-xl border transition-all text-left ${selectedMethod === method.id
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-zinc-700">
                                                    <Icon className="w-5 h-5 text-zinc-400" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{getPaymentMethodDisplay(method)}</p>
                                                    <p className="text-zinc-500 text-sm">
                                                        {method.type === 'bank' ? '3-5 business days' : method.type === 'upi' ? 'Instant' : '1-2 business days'}
                                                    </p>
                                                </div>
                                            </div>
                                            {method.isDefault && (
                                                <span className="text-indigo-400 text-xs">Default</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <Link href="/payments/methods">
                            <GlassButton variant="ghost" className="w-full">
                                + Add New Withdrawal Method
                            </GlassButton>
                        </Link>

                        {selectedMethod && (
                            <div className="p-4 bg-zinc-800/50 rounded-xl space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Amount</span>
                                    <span className="text-white">{formatCurrency(parsedAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Processing Fee</span>
                                    <span className="text-rose-400">-{formatCurrency(withdrawalFee)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-zinc-700">
                                    <span className="text-white font-medium">You'll receive</span>
                                    <span className="text-emerald-400 font-bold">{formatCurrency(totalReceive)}</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-rose-400" />
                                <span className="text-rose-400 text-sm">{error}</span>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <GlassButton variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                                Back
                            </GlassButton>
                            <GlassButton
                                variant="primary"
                                className="flex-1"
                                disabled={!selectedMethod || submitting}
                                onClick={handleSubmit}
                            >
                                {submitting ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                                ) : (
                                    <><ArrowDownCircle className="w-4 h-4 mr-2" />Withdraw</>
                                )}
                            </GlassButton>
                        </div>
                    </GlassCard>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                    <GlassCard className="p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Withdrawal Initiated!</h2>
                        <p className="text-zinc-400 mb-6">
                            Your withdrawal of {formatCurrency(totalReceive)} is being processed.
                        </p>
                        <div className="p-4 bg-zinc-800/50 rounded-xl mb-6 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Status</span>
                                <span className="text-amber-400">Requested</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Estimated arrival</span>
                                <span className="text-white">3-5 business days</span>
                            </div>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <Link href="/payments">
                                <GlassButton variant="secondary" asDiv>Back to Payments</GlassButton>
                            </Link>
                        </div>
                    </GlassCard>
                )}

                {/* Withdrawal History */}
                {step === 1 && withdrawalHistory.length > 0 && (
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <History className="w-5 h-5 text-zinc-400" />
                            Recent Withdrawals
                        </h3>
                        <div className="space-y-3">
                            {withdrawalHistory.slice(0, 5).map((wd) => {
                                const status = statusConfig[wd.status];
                                const StatusIcon = status.icon;
                                return (
                                    <div key={wd.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${status.bgColor}`}>
                                                <StatusIcon className={`w-4 h-4 ${status.color} ${wd.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{formatCurrency(wd.netAmount)}</p>
                                                <p className="text-zinc-500 text-xs">
                                                    {wd.paymentMethodType.toUpperCase()} •••• {wd.paymentMethodLast4}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs ${status.color}`}>{wd.status}</span>
                                            <p className="text-zinc-500 text-xs">
                                                {format(new Date(wd.requestedAt), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </GlassCard>
                )}
            </div>
        </DashboardShell>
    );
}
