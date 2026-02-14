import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { LifecycleRoadmap } from '@/components/roadmap/lifecycle-roadmap';

interface RoadmapPageProps {
    params: Promise<{ id: string }>;
}

export default async function RoadmapPage({ params }: RoadmapPageProps) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const { id: contractId } = await params;

    // Fetch contract with related data
    const contract = await db.contract.findUnique({
        where: { id: contractId },
        select: {
            id: true,
            title: true,
            status: true,
            type: true,
            proposalId: true,
            proposal: {
                select: {
                    jobId: true,
                    job: { select: { title: true } },
                },
            },
            client: {
                select: {
                    userId: true,
                    user: { select: { name: true, image: true } },
                },
            },
            freelancer: {
                select: {
                    userId: true,
                    user: { select: { name: true, image: true } },
                },
            },
        },
    });

    if (!contract) redirect('/dashboard');

    const isClient = contract.client.userId === session.user.id;
    const isFreelancer = contract.freelancer.userId === session.user.id;

    if (!isClient && !isFreelancer) redirect('/dashboard');

    const role = isClient ? 'CLIENT' : 'FREELANCER';

    return (
        <div className="min-h-screen p-4 md:p-8">
            <LifecycleRoadmap
                contractId={contract.id}
                contractTitle={contract.title}
                contractStatus={contract.status}
                contractType={contract.type}
                role={role as 'CLIENT' | 'FREELANCER'}
                clientName={contract.client.user.name || 'Client'}
                freelancerName={contract.freelancer.user.name || 'Freelancer'}
                jobTitle={contract.proposal?.job?.title || contract.title}
            />
        </div>
    );
}
