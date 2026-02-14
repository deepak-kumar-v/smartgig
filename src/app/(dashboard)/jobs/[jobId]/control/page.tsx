import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { JobControlCenter } from '@/components/control-center/job-control-center';

interface ControlPageProps {
    params: Promise<{ jobId: string }>;
}

export default async function ControlPage({ params }: ControlPageProps) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const { jobId } = await params;

    // Fetch job to determine role
    const job = await db.jobPost.findUnique({
        where: { id: jobId },
        select: {
            id: true,
            title: true,
            status: true,
            client: {
                select: {
                    userId: true,
                    user: { select: { name: true } },
                },
            },
        },
    });

    if (!job) redirect('/dashboard');

    // Check if client
    const isClient = job.client.userId === session.user.id;

    // Check if linked freelancer
    let isFreelancer = false;
    if (!isClient) {
        const linkedProposal = await db.proposal.findFirst({
            where: {
                jobId,
                freelancer: { userId: session.user.id },
            },
        });
        isFreelancer = !!linkedProposal;
    }

    if (!isClient && !isFreelancer) redirect('/dashboard');

    const role = isClient ? 'CLIENT' : 'FREELANCER';

    return (
        <JobControlCenter
            jobId={job.id}
            jobTitle={job.title}
            role={role as 'CLIENT' | 'FREELANCER'}
        />
    );
}
