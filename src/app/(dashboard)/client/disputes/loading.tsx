import { SkeletonList } from '@/components/ui/skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/ui/glass-card';

export default function DisputesLoading() {
    return (
        <>
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="w-[150px] h-[32px]" />
                        <Skeleton className="w-[250px] h-[20px] mt-2" />
                    </div>
                    <Skeleton className="w-[150px] h-[40px]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <GlassCard key={i} className="p-4">
                            <Skeleton className="w-[60%] h-4" />
                            <Skeleton className="w-[80px] h-[32px] mt-2" />
                        </GlassCard>
                    ))}
                </div>

                <GlassCard className="p-4">
                    <Skeleton className="h-[48px] w-full" />
                </GlassCard>

                <SkeletonList items={5} />
            </div>
        </>
    );
}
