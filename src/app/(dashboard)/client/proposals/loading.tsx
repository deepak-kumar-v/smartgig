import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Skeleton, SkeletonList } from '@/components/ui/skeleton';

export default function ClientProposalsLoading() {
    return (
        <DashboardShell role="client">
            <div className="mb-8">
                <Skeleton variant="text" width={250} height={32} className="mb-2" />
                <Skeleton variant="text" width={400} />
            </div>

            <SkeletonList items={5} />
        </DashboardShell>
    );
}
