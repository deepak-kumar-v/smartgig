import React from 'react';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import EditJobForm from './edit-job-form';
import type { JobPostFormData } from '@/lib/types';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

interface PageProps {
    params: Promise<{ jobId: string }>;
}

export default async function EditJobPage({ params }: PageProps) {
    const { jobId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const userId = session.user.id;

    let job = null;
    let isOwner = false;

    try {
        job = await db.jobPost.findUnique({
            where: { id: jobId },
            include: {
                client: {
                    include: { user: true }
                },
                skills: true
            }
        });

        if (job) {
            isOwner = job.client.user.id === userId;
        }
    } catch (error) {
        console.error('[Edit Job] Database error:', error);
    }

    if (!job) {
        return (
            <DashboardShell role="client">
                <div className="max-w-2xl mx-auto">
                    <GlassCard className="p-12 text-center">
                        <h3 className="text-lg font-medium text-white mb-2">Job Not Found</h3>
                        <Link href="/client/jobs">
                            <GlassButton variant="secondary" asDiv>
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
                            </GlassButton>
                        </Link>
                    </GlassCard>
                </div>
            </DashboardShell>
        );
    }

    if (!isOwner) {
        return (
            <DashboardShell role="client">
                <div className="max-w-2xl mx-auto">
                    <GlassCard className="p-12 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-rose-400" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Access Denied</h3>
                        <p className="text-zinc-400 mb-6">You don&apos;t have permission to edit this job.</p>
                        <Link href="/client/jobs">
                            <GlassButton variant="secondary" asDiv>
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
                            </GlassButton>
                        </Link>
                    </GlassCard>
                </div>
            </DashboardShell>
        );
    }

    // Map existing data to form data
    // Note: Some fields are not in DB, so we use defaults or best guess
    const initialData: Partial<JobPostFormData> = {
        title: job.title,
        description: job.descriptionMd,
        budgetMax: job.budgetMax,
        // Default budgetMin/Type since not in DB
        budgetMin: Math.max(0, job.budgetMax - 1000),
        budgetType: 'FIXED',

        skills: job.skills.map(s => s.name),
        isRemote: job.isRemote,

        // Fields dropped by DB schema limitations (reserving for future fixes)
        duration: '1-3 months',
        experienceLevel: 'INTERMEDIATE',
        category: 'Web Development', // Default
        visibility: 'PUBLIC'
    };

    return (
        <DashboardShell role="client">
            {/* Replaced JobForm with dedicated EditJobForm (Clone of PostJobPage) for strict parity */}
            <EditJobForm jobId={jobId} initialData={initialData} />
        </DashboardShell>
    );
}
