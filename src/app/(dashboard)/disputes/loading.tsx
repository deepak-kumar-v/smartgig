import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { SkeletonList } from '@/components/ui/skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/ui/glass-card';

export default function DisputesLoading() {
    return (
        <DashboardShell role="freelancer">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton variant="text" width={150} height={32} />
                        <Skeleton variant="text" width={250} height={20} className="mt-2" />
                    </div>
                    <Skeleton variant="rounded" width={150} height={40} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <GlassCard key={i} className="p-4">
                            <Skeleton variant="text" width="60%" />
                            <Skeleton variant="text" width={80} height={32} className="mt-2" />
                        </GlassCard>
                    ))}
                </div>

                <GlassCard className="p-4">
                    <Skeleton variant="rounded" height={48} />
                </GlassCard>

                <SkeletonList items={5} />
            </div>
        </DashboardShell>
    );
}
