import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { SkeletonList, Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/ui/glass-card';

export default function InvoicesLoading() {
    return (
        <DashboardShell role="freelancer">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton variant="text" width={120} height={32} />
                        <Skeleton variant="text" width={200} height={20} className="mt-2" />
                    </div>
                    <Skeleton variant="rounded" width={140} height={40} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <GlassCard key={i} className="p-4">
                            <Skeleton variant="text" width="50%" />
                            <Skeleton variant="text" width={80} height={28} className="mt-2" />
                        </GlassCard>
                    ))}
                </div>

                <SkeletonList items={6} />
            </div>
        </DashboardShell>
    );
}
