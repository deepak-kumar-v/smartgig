import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { SkeletonList, Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/ui/glass-card';

export default function MessagesLoading() {
    return (
        <DashboardShell role="freelancer">
            <div className="max-w-6xl mx-auto">
                <div className="flex h-[calc(100vh-180px)] rounded-xl overflow-hidden border border-zinc-800">
                    {/* Conversation List */}
                    <div className="w-80 border-r border-zinc-800 p-4 space-y-3">
                        <Skeleton variant="rounded" height={40} className="mb-4" />
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/30">
                                <Skeleton variant="circular" width={40} height={40} />
                                <div className="flex-1">
                                    <Skeleton variant="text" width="70%" />
                                    <Skeleton variant="text" width="50%" className="mt-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Chat Area */}
                    <div className="flex-1 p-6 flex flex-col">
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                            <Skeleton variant="circular" width={40} height={40} />
                            <div>
                                <Skeleton variant="text" width={120} />
                                <Skeleton variant="text" width={80} className="mt-1" />
                            </div>
                        </div>
                        <div className="flex-1 py-6 space-y-4">
                            <Skeleton variant="rounded" width="60%" height={60} />
                            <Skeleton variant="rounded" width="40%" height={40} className="ml-auto" />
                            <Skeleton variant="rounded" width="70%" height={80} />
                        </div>
                        <Skeleton variant="rounded" height={48} />
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
