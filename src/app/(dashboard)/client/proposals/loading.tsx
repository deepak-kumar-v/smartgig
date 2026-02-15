import React from 'react';
import { Skeleton, SkeletonList } from '@/components/ui/skeleton';

export default function ClientProposalsLoading() {
    return (
        <>
            <div className="mb-8">
                <Skeleton className="w-[250px] h-[32px] mb-2" />
                <Skeleton className="w-[400px] h-4" />
            </div>

            <SkeletonList items={5} />
        </>
    );
}
