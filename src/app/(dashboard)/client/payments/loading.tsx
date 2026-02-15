import { SkeletonList, Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/ui/glass-card';

export default function PaymentsLoading() {
    return (
        <>
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="w-[200px] h-[32px]" />
                        <Skeleton className="w-[300px] h-[20px] mt-2" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="w-[100px] h-[40px] rounded" />
                        <Skeleton className="w-[100px] h-[40px] rounded" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <GlassCard key={i} className="p-6">
                            <Skeleton className="w-1/2 h-4" />
                            <Skeleton className="w-[100px] h-[32px] mt-2" />
                            <Skeleton className="w-[70%] h-4 mt-2" />
                        </GlassCard>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <GlassCard className="p-6">
                            <Skeleton className="w-[200px] h-[24px] mb-6" />
                            <SkeletonList items={5} />
                        </GlassCard>
                    </div>
                    <div className="space-y-6">
                        <GlassCard className="p-6">
                            <Skeleton className="w-[150px] h-[20px] mb-4" />
                            <Skeleton className="h-[60px] rounded" />
                            <Skeleton className="h-[60px] mt-3 rounded" />
                        </GlassCard>
                    </div>
                </div>
            </div>
        </>
    );
}
