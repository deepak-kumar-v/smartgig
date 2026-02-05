import { SkeletonCard } from '@/components/ui/skeleton';
import { Navbar } from '@/components/global/navbar';
import { GlassCard } from '@/components/ui/glass-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExploreLoading() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="mb-10">
                    <Skeleton variant="text" width="200px" height={40} className="mb-4" />
                    <GlassCard className="p-4">
                        <Skeleton variant="rounded" height={48} className="w-full" />
                    </GlassCard>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="hidden lg:block space-y-4">
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="80%" />
                        <Skeleton variant="text" width="70%" />
                    </div>
                    <div className="lg:col-span-3 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
