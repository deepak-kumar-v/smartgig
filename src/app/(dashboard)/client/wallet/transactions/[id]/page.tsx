import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ClientTransactionDetailPage({ params }: PageProps) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    // Fetch wallet for auth
    const wallet = await db.wallet.findUnique({ where: { userId: session.user.id } });
    if (!wallet) notFound();

    // Fetch ledger entry
    const entry = await db.walletLedger.findUnique({ where: { id } });
    if (!entry || entry.walletId !== wallet.id) notFound();

    // Fetch related contract and milestone titles
    const [contract, milestone] = await Promise.all([
        entry.contractId ? db.contract.findUnique({ where: { id: entry.contractId }, select: { id: true, title: true } }) : null,
        entry.milestoneId ? db.milestone.findUnique({ where: { id: entry.milestoneId }, select: { id: true, title: true } }) : null,
    ]);

    const amount = new Prisma.Decimal(entry.amount);
    const isCredit = amount.greaterThan(0);

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#0B0F14' }}>
            <div className="w-full px-6 md:px-8 xl:px-16 py-8 max-w-3xl">

                <Link href="/client/wallet" className="text-[14px] text-zinc-500 hover:text-zinc-300 transition-colors mb-6 inline-block">
                    ← Back to Wallet
                </Link>

                <h1 className="text-[20px] font-semibold text-white mb-8">Transaction Detail</h1>

                <div className="rounded-lg border p-6 space-y-6" style={{ backgroundColor: '#111318', borderColor: '#1E2328' }}>

                    {/* Amount */}
                    <div className="text-center pb-6 border-b" style={{ borderColor: '#1E2328' }}>
                        <span className={`text-[32px] font-bold tabular-nums ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isCredit ? '+' : ''}${amount.toFixed(2)}
                        </span>
                        <div className="text-[12px] text-zinc-500 mt-2 uppercase tracking-widest">{entry.type.replace(/_/g, ' ')}</div>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-4">
                        <Row label="Transaction ID" value={entry.id} mono />
                        <Row label="Type" value={entry.type.replace(/_/g, ' ')} />
                        <Row label="Timestamp" value={entry.createdAt.toLocaleString()} />
                        {contract && (
                            <Row label="Contract" value={contract.title} link={`/client/contracts/${contract.id}`} />
                        )}
                        {milestone && (
                            <Row label="Milestone" value={milestone.title} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Row({ label, value, mono, link }: { label: string; value: string; mono?: boolean; link?: string }) {
    return (
        <div className="flex justify-between items-baseline py-2 border-b" style={{ borderColor: '#1A1E24' }}>
            <span className="text-[12px] text-zinc-500 uppercase tracking-wider">{label}</span>
            {link ? (
                <Link href={link} className="text-[14px] text-blue-400 hover:text-blue-300 transition-colors">
                    {value}
                </Link>
            ) : (
                <span className={`text-[14px] text-zinc-300 ${mono ? 'font-mono text-[12px]' : ''}`}>{value}</span>
            )}
        </div>
    );
}
