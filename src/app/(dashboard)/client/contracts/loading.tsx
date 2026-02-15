import React from 'react';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function ClientContractsLoading() {
    return (
        <>
            <div className="mb-8">
                <Skeleton className="w-[200px] h-8 mb-2" />
                <Skeleton className="w-[300px] h-4" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </>
    );
}
