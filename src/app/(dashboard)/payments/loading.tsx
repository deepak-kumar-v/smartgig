import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { SkeletonList, Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/ui/glass-card';

export default function PaymentsLoading() {
    return (
        <DashboardShell role="freelancer">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton variant="text" width={200} height={32} />
                        <Skeleton variant="text" width={300} height={20} className="mt-2" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton variant="rounded" width={100} height={40} />
                        <Skeleton variant="rounded" width={100} height={40} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <GlassCard key={i} className="p-6">
                            <Skeleton variant="text" width="50%" />
                            <Skeleton variant="text" width={100} height={32} className="mt-2" />
                            <Skeleton variant="text" width="70%" className="mt-2" />
                        </GlassCard>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <GlassCard className="p-6">
                            <Skeleton variant="text" width={200} height={24} className="mb-6" />
                            <SkeletonList items={5} />
                        </GlassCard>
                    </div>
                    <div className="space-y-6">
                        <GlassCard className="p-6">
                            <Skeleton variant="text" width={150} height={20} className="mb-4" />
                            <Skeleton variant="rounded" height={60} />
                            <Skeleton variant="rounded" height={60} className="mt-3" />
                        </GlassCard>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
