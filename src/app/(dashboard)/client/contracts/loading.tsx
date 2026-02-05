import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function ClientContractsLoading() {
    return (
        <DashboardShell role="client">
            <div className="mb-8">
                <Skeleton variant="text" width={200} height={32} className="mb-2" />
                <Skeleton variant="text" width={300} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </DashboardShell>
    );
}
