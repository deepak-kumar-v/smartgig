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
                    <Skeleton className="w-[200px] h-[40px] mb-4" />
                    <GlassCard className="p-4">
                        <Skeleton className="w-full h-[48px] rounded" />
                    </GlassCard>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="hidden lg:block space-y-4">
                        <Skeleton className="w-[60%] h-4" />
                        <Skeleton className="w-[80%] h-4" />
                        <Skeleton className="w-[70%] h-4" />
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
