'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { NotFoundState } from '@/components/ui/not-found-state';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    ArrowLeft, Download, Printer, FileText, CheckCircle, Building,
    User, Calendar, Hash, Clock, AlertCircle, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { type Invoice, formatCurrency } from '@/lib/payments-service';
import { paymentsApi } from '@/services/api/payments';

const statusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
    PAID: { icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', label: 'PAID' },
    PENDING: { icon: Clock, color: 'text-amber-400', bgColor: 'bg-amber-500/20', label: 'PENDING' },
    OVERDUE: { icon: AlertCircle, color: 'text-rose-400', bgColor: 'bg-rose-500/20', label: 'OVERDUE' },
    REFUNDED: { icon: RefreshCw, color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'REFUNDED' },
    DRAFT: { icon: FileText, color: 'text-zinc-400', bgColor: 'bg-zinc-500/20', label: 'DRAFT' },
    CANCELLED: { icon: AlertCircle, color: 'text-zinc-400', bgColor: 'bg-zinc-500/20', label: 'CANCELLED' },
};

export default function InvoiceDetailPage() {
    const params = useParams();
    const invoiceId = params.id as string;
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function loadInvoice() {
            setLoading(true);
            const data = await paymentsApi.getInvoice(invoiceId);
            if (!data) {
                setNotFound(true);
            } else {
                setInvoice(data);
            }
            setLoading(false);
        }
        loadInvoice();
    }, [invoiceId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (notFound || !invoice) {
        return (
            <NotFoundState
                title="Invoice Not Found"
                message="The invoice you're looking for doesn't exist or has been removed."
                backHref="/invoices"
            />
        );
    }

    const status = statusConfig[invoice.status] || statusConfig.PENDING;
    const StatusIcon = status.icon;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/invoices" className="text-zinc-500 hover:text-white text-sm inline-flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" />Back to Invoices
                    </Link>
                    <h1 className="text-2xl font-bold text-white">{invoice.invoiceNumber}</h1>
                </div>
                <div className="flex gap-2">
                    <GlassButton variant="secondary">
                        <Printer className="w-4 h-4 mr-2" />Print
                    </GlassButton>
                    <GlassButton variant="primary">
                        <Download className="w-4 h-4 mr-2" />Download PDF
                    </GlassButton>
                </div>
            </div>

            {/* Invoice Document */}
            <GlassCard className="p-8 print:shadow-none print:border-none">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-8 pb-8 border-b border-zinc-800">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-indigo-500/20">
                                <FileText className="w-6 h-6 text-indigo-400" />
                            </div>
                            <span className="text-2xl font-bold text-white">SmartGIG</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-1">INVOICE</h2>
                        <p className="text-zinc-500 font-mono">{invoice.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1.5 ${status.bgColor} ${status.color} rounded-full text-sm font-medium inline-flex items-center gap-1`}>
                            <StatusIcon className="w-4 h-4" />{status.label}
                        </span>
                    </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <p className="text-zinc-500 text-sm mb-3 uppercase tracking-wider">From (Freelancer)</p>
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-zinc-800">
                                <User className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-white font-medium">{invoice.freelancerName}</p>
                                <p className="text-zinc-400 text-sm">{invoice.freelancerEmail}</p>
                                {invoice.freelancerAddress && (
                                    <p className="text-zinc-500 text-sm mt-1">{invoice.freelancerAddress}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-sm mb-3 uppercase tracking-wider">Bill To (Client)</p>
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-zinc-800">
                                <Building className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-white font-medium">{invoice.clientName}</p>
                                <p className="text-zinc-400 text-sm">{invoice.clientEmail}</p>
                                {invoice.clientAddress && (
                                    <p className="text-zinc-500 text-sm mt-1">{invoice.clientAddress}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-500 text-sm">Issued:</span>
                        <span className="text-white">{format(new Date(invoice.issueDate), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-500 text-sm">Due:</span>
                        <span className="text-white">{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</span>
                    </div>
                    {invoice.paidDate && (
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span className="text-zinc-500 text-sm">Paid:</span>
                            <span className="text-emerald-400">{format(new Date(invoice.paidDate), 'MMM d, yyyy')}</span>
                        </div>
                    )}
                </div>

                {/* Line Items */}
                <div className="mb-8">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="text-left text-zinc-500 text-sm py-3 uppercase tracking-wider">Description</th>
                                <th className="text-center text-zinc-500 text-sm py-3 uppercase tracking-wider">Qty</th>
                                <th className="text-right text-zinc-500 text-sm py-3 uppercase tracking-wider">Unit Price</th>
                                <th className="text-right text-zinc-500 text-sm py-3 uppercase tracking-wider">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.lineItems.map((item) => (
                                <tr key={item.id} className="border-b border-zinc-800/50">
                                    <td className="py-4 text-white">{item.description}</td>
                                    <td className="py-4 text-zinc-400 text-center">{item.quantity}</td>
                                    <td className="py-4 text-zinc-400 text-right">{formatCurrency(item.unitPrice)}</td>
                                    <td className="py-4 text-white text-right font-medium">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-72 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Subtotal</span>
                            <span className="text-white">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        {invoice.taxAmount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Tax ({(invoice.taxRate * 100).toFixed(0)}%)</span>
                                <span className="text-white">{formatCurrency(invoice.taxAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Platform Fee (10%)</span>
                            <span className="text-rose-400">-{formatCurrency(invoice.platformFee)}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-zinc-700">
                            <span className="text-white font-bold">Total</span>
                            <span className="text-white font-bold text-xl">{formatCurrency(invoice.total)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500 text-sm">Net to Freelancer</span>
                            <span className="text-emerald-400 font-bold text-xl">
                                {formatCurrency(invoice.subtotal + invoice.taxAmount - invoice.platformFee)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                    <div className="mt-8 pt-6 border-t border-zinc-800">
                        <p className="text-zinc-500 text-sm mb-2">Notes</p>
                        <p className="text-zinc-400">{invoice.notes}</p>
                    </div>
                )}

                {/* Related Contract */}
                {invoice.contractId && (
                    <div className="mt-8 pt-6 border-t border-zinc-800">
                        <p className="text-zinc-500 text-sm mb-2">Related Contract</p>
                        <Link href={`/contracts/${invoice.contractId}`}>
                            <div className="inline-flex items-center gap-2 text-indigo-400 hover:underline">
                                <Hash className="w-4 h-4" />
                                {invoice.contractId}
                            </div>
                        </Link>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
