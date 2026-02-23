'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { approveWithdrawal, rejectWithdrawal } from '@/actions/withdrawal-actions';
import type { PendingWithdrawalRow } from '@/actions/withdrawal-actions';

// ============================================================================
// Admin Withdrawals Panel — Dark Fintech Terminal
// ============================================================================

export default function AdminWithdrawalsPanel({
    initialRequests,
}: {
    initialRequests: PendingWithdrawalRow[];
}) {
    const [requests, setRequests] = useState<PendingWithdrawalRow[]>(initialRequests);
    const [isPending, startTransition] = useTransition();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const router = useRouter();

    function handleApprove(id: string) {
        setProcessingId(id);
        startTransition(async () => {
            const result = await approveWithdrawal(id);
            setProcessingId(null);
            if ('error' in result && result.error) {
                toast.error(result.error);
            } else {
                toast.success('Withdrawal approved — ledger debited');
                setRequests((prev) => prev.filter((r) => r.id !== id));
                router.refresh();
            }
        });
    }

    function handleReject(id: string) {
        setProcessingId(id);
        startTransition(async () => {
            const result = await rejectWithdrawal(id);
            setProcessingId(null);
            if ('error' in result && result.error) {
                toast.error(result.error);
            } else {
                toast.success('Withdrawal rejected');
                setRequests((prev) => prev.filter((r) => r.id !== id));
                router.refresh();
            }
        });
    }

    return (
        <div className="w-full px-6 md:px-8 xl:px-16 py-8" style={{ color: '#e4e4e7' }}>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[22px] font-semibold tracking-tight text-white">
                    Pending Withdrawal Requests
                </h1>
                <p className="text-[13px] mt-1" style={{ color: '#71717a' }}>
                    {requests.length} request{requests.length !== 1 ? 's' : ''} awaiting review
                </p>
            </div>

            {/* Table */}
            <div
                className="rounded-lg border overflow-hidden"
                style={{ backgroundColor: '#111318', borderColor: '#1E2328' }}
            >
                {/* Table Header */}
                <div
                    className="grid grid-cols-[1fr_1.2fr_120px_140px_180px] gap-2 px-6 py-3 text-[12px] text-zinc-500 uppercase tracking-wider font-medium border-b"
                    style={{ borderColor: '#1E2328' }}
                >
                    <div>User</div>
                    <div>Email</div>
                    <div className="text-right">Amount</div>
                    <div>Requested At</div>
                    <div className="text-right">Actions</div>
                </div>

                {/* Table Body */}
                {requests.length === 0 ? (
                    <div className="px-6 py-16 text-center text-zinc-600 text-[14px]">
                        No pending withdrawal requests
                    </div>
                ) : (
                    <div>
                        {requests.map((req) => {
                            const isProcessing = processingId === req.id;
                            return (
                                <div
                                    key={req.id}
                                    className="grid grid-cols-[1fr_1.2fr_120px_140px_180px] gap-2 px-6 py-3 text-[14px] border-b items-center"
                                    style={{ borderColor: '#1A1E24' }}
                                >
                                    <div className="text-zinc-300 truncate">
                                        {req.userName || 'Unknown'}
                                    </div>
                                    <div className="text-zinc-400 truncate">
                                        {req.userEmail}
                                    </div>
                                    <div className="text-right tabular-nums font-medium text-white">
                                        ${req.amount}
                                    </div>
                                    <div className="text-zinc-500 tabular-nums text-[13px]">
                                        {new Date(req.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleApprove(req.id)}
                                            disabled={isPending || isProcessing}
                                            className="text-[12px] font-medium px-3 py-1.5 rounded-sm border transition-colors disabled:opacity-40"
                                            style={{
                                                color: '#34d399',
                                                borderColor: 'rgba(52,211,153,0.3)',
                                                backgroundColor: 'rgba(52,211,153,0.08)',
                                            }}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(req.id)}
                                            disabled={isPending || isProcessing}
                                            className="text-[12px] font-medium px-3 py-1.5 rounded-sm border transition-colors disabled:opacity-40"
                                            style={{
                                                color: '#f87171',
                                                borderColor: 'rgba(248,113,113,0.3)',
                                                backgroundColor: 'rgba(248,113,113,0.08)',
                                            }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
