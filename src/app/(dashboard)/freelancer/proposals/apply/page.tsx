import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import ProposalForm from './proposal-form';

// ============================================================================
// Types matching ProposalForm expectations
// ============================================================================

interface ScreeningQuestion {
    id: string;
    question: string;
    type: 'text' | 'yesno' | 'choice';
    options?: string[];
    required: boolean;
}

// ============================================================================
// Server Component
// ============================================================================

interface PageProps {
    searchParams: Promise<{ jobId?: string }>;
}

export default async function SubmitProposalPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const jobId = params.jobId;

    // Route guard: redirect if no jobId
    if (!jobId) {
        redirect('/freelancer/find-work');
    }

    // Fetch real job data
    const job = await db.jobPost.findUnique({
        where: { id: jobId },
        include: {
            client: {
                include: {
                    user: {
                        select: {
                            name: true,
                        }
                    }
                }
            },
            skills: {
                select: {
                    id: true,
                    name: true,
                }
            },
            _count: {
                select: {
                    proposals: true,
                }
            }
        }
    });

    // Route guard: redirect if job not found
    if (!job) {
        redirect('/freelancer/find-work');
    }

    // Parse screeningQuestions from JSON string
    let screeningQuestions: ScreeningQuestion[] = [];
    if (job.screeningQuestions) {
        try {
            const parsed = JSON.parse(job.screeningQuestions);
            screeningQuestions = Array.isArray(parsed) ? parsed.map((q: any, index: number) => ({
                id: q.id || `sq-${index}`,
                question: q.question || '',
                type: q.type || 'text',
                options: q.options,
                required: q.required ?? false,
            })) : [];
        } catch {
            screeningQuestions = [];
        }
    }

    // Transform to match ProposalForm's JobData interface
    const jobData = {
        id: job.id,
        title: job.title,
        overview: job.overview,
        descriptionMd: job.descriptionMd,
        category: job.category,
        budgetType: job.budgetType,
        budgetMin: job.budgetMin,
        budgetMax: job.budgetMax,
        duration: job.duration,
        experienceLevel: job.experienceLevel,
        allowTrialTask: job.allowTrialTask,
        createdAt: job.createdAt,
        skills: job.skills,
        screeningQuestions,
        proposalCount: job._count.proposals,
        client: {
            companyName: job.client.companyName,
            location: null, // TODO: add location to ClientProfile if needed
            totalSpent: 0,  // TODO: calculate from contracts
            hireRate: 0,    // TODO: calculate from proposals
            user: {
                name: job.client.user.name,
            }
        }
    };

    return <ProposalForm job={jobData} />;
}
