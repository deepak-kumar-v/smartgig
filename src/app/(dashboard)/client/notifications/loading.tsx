import { SkeletonList, Skeleton } from '@/components/ui/skeleton';

export default function NotificationsLoading() {
    return (
        <>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="w-[150px] h-[32px]" />
                        <Skeleton className="w-[250px] h-[20px] mt-2" />
                    </div>
                    <Skeleton className="w-[120px] h-[36px] rounded" />
                </div>

                <SkeletonList items={8} />
            </div>
        </>
    );
}
