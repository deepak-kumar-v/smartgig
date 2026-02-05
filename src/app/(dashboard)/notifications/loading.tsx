import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { SkeletonList, Skeleton } from '@/components/ui/skeleton';

export default function NotificationsLoading() {
    return (
        <DashboardShell role="freelancer">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton variant="text" width={150} height={32} />
                        <Skeleton variant="text" width={250} height={20} className="mt-2" />
                    </div>
                    <Skeleton variant="rounded" width={120} height={36} />
                </div>

                <SkeletonList items={8} />
            </div>
        </DashboardShell>
    );
}
