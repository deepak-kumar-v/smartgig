import { SkeletonList, Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/ui/glass-card';

export default function MessagesLoading() {
    return (
        <>
            <div className="max-w-6xl mx-auto">
                <div className="flex h-[calc(100vh-180px)] rounded-xl overflow-hidden border border-zinc-800">
                    {/* Conversation List */}
                    <div className="w-80 border-r border-zinc-800 p-4 space-y-3">
                        <Skeleton className="h-[40px] mb-4 rounded" />
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/30">
                                <Skeleton className="w-[40px] h-[40px] rounded-full" />
                                <div className="flex-1">
                                    <Skeleton className="w-[70%] h-4" />
                                    <Skeleton className="w-[50%] h-4 mt-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Chat Area */}
                    <div className="flex-1 p-6 flex flex-col">
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                            <Skeleton className="w-[40px] h-[40px] rounded-full" />
                            <div>
                                <Skeleton className="w-[120px] h-4" />
                                <Skeleton className="w-[80px] h-4 mt-1" />
                            </div>
                        </div>
                        <div className="flex-1 py-6 space-y-4">
                            <Skeleton className="w-[60%] h-[60px] rounded" />
                            <Skeleton className="w-[40%] h-[40px] ml-auto rounded" />
                            <Skeleton className="w-[70%] h-[80px] rounded" />
                        </div>
                        <Skeleton className="h-[48px] rounded" />
                    </div>
                </div>
            </div>
        </>
    );
}
