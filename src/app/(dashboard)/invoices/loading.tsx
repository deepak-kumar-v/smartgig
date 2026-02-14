import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { SkeletonList, Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/ui/glass-card';

export default function InvoicesLoading() {
    return (
        <DashboardShell>
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="w-[120px] h-[32px]" />
                        <Skeleton className="w-[200px] h-[20px] mt-2" />
                    </div>
                    <Skeleton className="w-[140px] h-[40px]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <GlassCard key={i} className="p-4">
                            <Skeleton className="w-1/2 h-4" />
                            <Skeleton className="w-[80px] h-[28px] mt-2" />
                        </GlassCard>
                    ))}
                </div>

                <SkeletonList items={6} />
            </div>
        </DashboardShell>
    );
}
