import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Skeleton, SkeletonList } from '@/components/ui/skeleton';

export default function ClientProposalsLoading() {
    return (
        <DashboardShell role="client">
            <div className="mb-8">
                <Skeleton className="w-[250px] h-[32px] mb-2" />
                <Skeleton className="w-[400px] h-4" />
            </div>

            <SkeletonList items={5} />
        </DashboardShell>
    );
}
