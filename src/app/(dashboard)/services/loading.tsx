import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { SkeletonCard, Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/ui/glass-card';

export default function ServicesLoading() {
    return (
        <DashboardShell role="freelancer">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton variant="text" width={180} height={32} />
                        <Skeleton variant="text" width={280} height={20} className="mt-2" />
                    </div>
                    <Skeleton variant="rounded" width={160} height={40} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </div>
        </DashboardShell>
    );
}
