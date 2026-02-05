'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import Link from 'next/link';
import {
    FileText, Search, Download, Filter, ChevronRight,
    Clock, CheckCircle, AlertCircle, DollarSign
} from 'lucide-react';
import { paymentsApi } from '@/services/api/payments';

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
    PAID: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle },
    PENDING: { color: 'text-amber-400', bg: 'bg-amber-500/20', icon: Clock },
    OVERDUE: { color: 'text-rose-400', bg: 'bg-rose-500/20', icon: AlertCircle },
    // Fallbacks
    DRAFT: { color: 'text-zinc-400', bg: 'bg-zinc-500/20', icon: FileText },
    REFUNDED: { color: 'text-purple-400', bg: 'bg-purple-500/20', icon: AlertCircle },
    CANCELLED: { color: 'text-gray-400', bg: 'bg-gray-500/20', icon: AlertCircle },
};

export default function InvoicesPage() {
    const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInvoices = async () => {
            try {
                const data = await paymentsApi.getInvoices();
                const mapped = data.invoices.map(inv => ({
                    id: inv.invoiceNumber || inv.id, // Display ID
                    rawId: inv.id,                  // Link ID
                    contract: inv.contractId ? 'Contract Project' : 'General Service', // Placeholder as contract title unavailable
                    client: inv.clientName || 'Unknown Client',
                    amount: inv.total,
                    status: inv.status,
                    issueDate: new Date(inv.issueDate).toLocaleDateString(),
                    paidDate: inv.paidDate ? new Date(inv.paidDate).toLocaleDateString() : null,
                    dueDate: new Date(inv.dueDate).toLocaleDateString()
                }));
                setInvoices(mapped);
            } catch (error) {
                console.error("Failed to load invoices", error);
            } finally {
                setLoading(false);
            }
        };
        loadInvoices();
    }, []);

    const filteredInvoices = invoices.filter(inv => {
        if (filter === 'paid') return inv.status === 'PAID';
        if (filter === 'pending') return inv.status === 'PENDING';
        return true;
    }).filter(inv =>
        inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.contract.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.client.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);
    const totalPending = invoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0);

    return (
        <DashboardShell role="freelancer">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Invoices</h1>
                        <p className="text-zinc-400">View and download your payment invoices</p>
                    </div>
                    <GlassButton variant="secondary">
                        <Download className="w-4 h-4 mr-2" /> Export All
                    </GlassButton>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <GlassCard className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-500 text-sm">Total Invoices</p>
                                <p className="text-2xl font-bold text-white">{loading ? '...' : invoices.length}</p>
                            </div>
                            <FileText className="w-8 h-8 text-zinc-500" />
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-500 text-sm">Total Received</p>
                                <p className="text-2xl font-bold text-emerald-400">{loading ? '...' : `$${totalPaid.toLocaleString()}`}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-emerald-400/50" />
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-500 text-sm">Pending</p>
                                <p className="text-2xl font-bold text-amber-400">{loading ? '...' : `$${totalPending.toLocaleString()}`}</p>
                            </div>
                            <Clock className="w-8 h-8 text-amber-400/50" />
                        </div>
                    </GlassCard>
                </div>

                {/* Filters */}
                <GlassCard className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search invoices..."
                                className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg pl-12 pr-4 py-2 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            {['all', 'paid', 'pending'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as typeof filter)}
                                    className={`px-4 py-2 rounded-lg text-sm transition-all ${filter === f
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                        }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </GlassCard>

                {/* Invoices List */}
                <div className="space-y-3">
                    {loading ? (
                        // Skeleton Loading
                        Array.from({ length: 3 }).map((_, i) => (
                            <GlassCard key={i} className="p-4 h-24 animate-pulse">
                                <div className="flex items-center justify-between h-full">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-zinc-800 rounded-xl" />
                                        <div className="space-y-2">
                                            <div className="w-32 h-4 bg-zinc-800 rounded" />
                                            <div className="w-24 h-3 bg-zinc-800 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        ))
                    ) : filteredInvoices.length === 0 ? (
                        <GlassCard className="p-12 text-center">
                            <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <p className="text-zinc-400">No invoices found</p>
                        </GlassCard>
                    ) : (
                        filteredInvoices.map((invoice) => {
                            const status = statusConfig[invoice.status] || statusConfig.DRAFT;
                            const StatusIcon = status.icon;

                            return (
                                <Link key={invoice.rawId} href={`/invoices/${invoice.rawId}`}>
                                    <GlassCard className="p-4 hover:border-zinc-600 transition-colors cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-xl bg-zinc-800">
                                                    <FileText className="w-5 h-5 text-zinc-400" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-white font-medium">{invoice.id}</p>
                                                        <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${status.bg} ${status.color}`}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {invoice.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-zinc-400 text-sm">{invoice.contract}</p>
                                                    <p className="text-zinc-500 text-xs">Client: {invoice.client}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div>
                                                    <p className="text-white font-bold">${invoice.amount.toLocaleString()}</p>
                                                    <p className="text-zinc-500 text-xs">
                                                        {invoice.status === 'PAID' ? `Paid ${invoice.paidDate}` : `Due ${invoice.dueDate}`}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-zinc-500" />
                                            </div>
                                        </div>
                                    </GlassCard>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </DashboardShell>
    );
}
