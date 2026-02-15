'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import Link from 'next/link';
import {
    DollarSign, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle,
    AlertCircle, Download, Filter, ChevronRight, CreditCard,
    Building, Wallet, TrendingUp, Calendar, FileText, Shield, Smartphone
} from 'lucide-react';
import { format } from 'date-fns';
import {
    type Wallet as WalletModel, type LedgerTransaction, type PaymentMethod, type LedgerTransactionType,
    formatCurrency, getPaymentMethodDisplay, getWallet, getPaymentMethods
} from '@/lib/payments-service';
import { paymentsApi } from '@/services/api/payments';

const transactionTypeConfig: Record<LedgerTransactionType, { icon: React.ElementType; color: string; bgColor: string }> = {
    DEPOSIT: { icon: ArrowDownLeft, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    ESCROW_LOCK: { icon: Shield, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
    ESCROW_RELEASE: { icon: ArrowDownLeft, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    ESCROW_REFUND: { icon: ArrowDownLeft, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    WITHDRAWAL: { icon: ArrowUpRight, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    WITHDRAWAL_FEE: { icon: DollarSign, color: 'text-zinc-400', bgColor: 'bg-zinc-700' },
    PLATFORM_FEE: { icon: DollarSign, color: 'text-zinc-400', bgColor: 'bg-zinc-700' },
    BONUS: { icon: TrendingUp, color: 'text-violet-400', bgColor: 'bg-violet-500/20' },
    ADJUSTMENT: { icon: DollarSign, color: 'text-zinc-400', bgColor: 'bg-zinc-700' },
};

export default function PaymentsPage() {
    const [wallet, setWallet] = useState<WalletModel | null>(null);
    const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
    const [paymentMethods, setPaymentMethodsList] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<LedgerTransactionType | 'all'>('all');
    const { data: session } = useSession();
    const userRole = session?.user?.role ? session.user.role.toLowerCase() as 'freelancer' | 'client' | 'admin' : 'freelancer';

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const [walletData, txData, methodsData] = await Promise.all([
                getWallet('user-1'), // [MOCK] Wallet balance simulation
                paymentsApi.getLedger({ limit: 50 }), // [REAL] Fetches actual transactions from DB
                getPaymentMethods(), // [MOCK] Static list for UI demo
            ]);
            setWallet(walletData);
            setTransactions(txData.transactions);
            setPaymentMethodsList(methodsData);
            setLoading(false);
        }
        loadData();
    }, []);

    const filteredTransactions = filter === 'all'
        ? transactions
        : transactions.filter(t => t.type === filter);

    if (loading || !wallet) {
        return (
            <>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </>
        );
    }

    return (
        <>
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Payments & Earnings</h1>
                        <p className="text-zinc-400">Manage your earnings and payment methods</p>
                    </div>
                    <div className="flex gap-2">
                        <GlassButton variant="secondary">
                            <Download className="w-4 h-4 mr-2" />Export
                        </GlassButton>
                        <Link href="/withdraw">
                            <GlassButton variant="primary">
                                <Wallet className="w-4 h-4 mr-2" />Withdraw
                            </GlassButton>
                        </Link>
                    </div>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-500 text-sm">Available Balance</span>
                            <Wallet className="w-5 h-5 text-emerald-400" />
                        </div>
                        <p className="text-2xl font-bold text-white">{formatCurrency(wallet.availableBalance)}</p>
                        <p className="text-emerald-400 text-xs mt-1">Ready to withdraw</p>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-500 text-sm">Pending</span>
                            <Clock className="w-5 h-5 text-amber-400" />
                        </div>
                        <p className="text-2xl font-bold text-white">{formatCurrency(wallet.pendingBalance)}</p>
                        <p className="text-amber-400 text-xs mt-1">Awaiting clearance</p>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-500 text-sm">In Escrow</span>
                            <Shield className="w-5 h-5 text-indigo-400" />
                        </div>
                        <p className="text-2xl font-bold text-white">{formatCurrency(wallet.lockedBalance)}</p>
                        <p className="text-indigo-400 text-xs mt-1">Active contracts</p>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-500 text-sm">Total Earned</span>
                            <TrendingUp className="w-5 h-5 text-violet-400" />
                        </div>
                        <p className="text-2xl font-bold text-white">{formatCurrency(wallet.totalEarnings)}</p>
                        <p className="text-violet-400 text-xs mt-1">All time</p>
                    </GlassCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Ledger */}
                    <div className="lg:col-span-2 space-y-6">
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-white">Transaction Ledger</h2>
                                <div className="flex gap-2 flex-wrap">
                                    {(['all', 'ESCROW_RELEASE', 'WITHDRAWAL', 'PLATFORM_FEE'] as const).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-3 py-1 rounded-lg text-xs transition-all ${filter === f
                                                ? 'bg-indigo-500 text-white'
                                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                }`}
                                        >
                                            {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                {filteredTransactions.length === 0 ? (
                                    <div className="text-center py-8 text-zinc-500">No transactions found</div>
                                ) : (
                                    filteredTransactions.map((tx) => {
                                        const config = transactionTypeConfig[tx.type];
                                        const Icon = config.icon;
                                        return (
                                            <div key={tx.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor}`}>
                                                        <Icon className={`w-5 h-5 ${config.color}`} />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium text-sm">{tx.description}</p>
                                                        <p className="text-zinc-500 text-xs">
                                                            {tx.contractId && <span className="mr-2">Contract: {tx.contractId}</span>}
                                                            {format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                                    </p>
                                                    <p className="text-zinc-500 text-xs">
                                                        Balance: {formatCurrency(tx.balanceAfter)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="mt-4 text-center">
                                <GlassButton variant="ghost" size="sm">
                                    View Full Ledger <ChevronRight className="w-4 h-4 ml-1" />
                                </GlassButton>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Payment Methods */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-white">Payment Methods</h3>
                                <Link href="/payments/methods">
                                    <GlassButton variant="ghost" size="sm">
                                        <span className="text-xs">Manage</span>
                                    </GlassButton>
                                </Link>
                            </div>
                            <div className="space-y-3">
                                {paymentMethods.map((method) => (
                                    <div key={method.id} className={`flex items-center gap-3 p-3 rounded-xl border ${method.isDefault ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-zinc-700 bg-zinc-800/50'
                                        }`}>
                                        <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
                                            {method.type === 'bank' ? (
                                                <Building className="w-5 h-5 text-zinc-400" />
                                            ) : method.type === 'upi' ? (
                                                <Smartphone className="w-5 h-5 text-zinc-400" />
                                            ) : (
                                                <CreditCard className="w-5 h-5 text-zinc-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white text-sm font-medium">{getPaymentMethodDisplay(method)}</p>
                                            {method.isDefault && (
                                                <span className="text-indigo-400 text-xs">Default</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Quick Actions */}
                        <GlassCard className="p-6">
                            <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <Link href="/invoices">
                                    <GlassButton variant="ghost" className="w-full justify-start">
                                        <FileText className="w-4 h-4 mr-2" />View Invoices
                                    </GlassButton>
                                </Link>
                                <GlassButton variant="ghost" className="w-full justify-start">
                                    <Download className="w-4 h-4 mr-2" />Download Tax Report
                                </GlassButton>
                                <GlassButton variant="ghost" className="w-full justify-start">
                                    <Calendar className="w-4 h-4 mr-2" />Payment Schedule
                                </GlassButton>
                            </div>
                        </GlassCard>

                        {/* Summary */}
                        <GlassCard className="p-6">
                            <h3 className="font-semibold text-white mb-4">Lifetime Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">Total Earnings</span>
                                    <span className="text-white font-medium">{formatCurrency(wallet.totalEarnings)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">Total Withdrawn</span>
                                    <span className="text-blue-400 font-medium">{formatCurrency(wallet.totalWithdrawn)}</span>
                                </div>
                                <div className="flex justify-between pt-3 border-t border-zinc-700">
                                    <span className="text-white font-medium">Net Balance</span>
                                    <span className="text-emerald-400 font-bold">
                                        {formatCurrency(wallet.availableBalance + wallet.pendingBalance + wallet.lockedBalance)}
                                    </span>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </>
    );
}
