'use client';

import React, { useTransition, useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassTextarea } from '@/components/ui/glass-textarea';
import { GlassButton } from '@/components/ui/glass-button';
import { createJobPost } from '@/actions/job-actions';
import { Briefcase, DollarSign, Layers } from 'lucide-react';

export default function PostJobPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<any>(null);

    // Helper to handle form submission
    async function handleSubmit(formData: FormData) {
        setError(null);
        startTransition(async () => {
            const res = await createJobPost(formData);
            if (res?.error) {
                setError(res.error);
            }
        });
    }

    return (
        <DashboardShell role="client">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Post a New Job</h1>
                    <p className="text-white/50">Describe your project and find the perfect talent.</p>
                </div>

                <GlassCard variant="heavy" className="p-8">
                    <form action={handleSubmit} className="space-y-6">

                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70 ml-1">Job Title</label>
                            <GlassInput
                                name="title"
                                placeholder="e.g. Senior React Developer for Fintech App"
                                required
                                minLength={5}
                            />
                        </div>

                        {/* Category */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 ml-1">Category</label>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                                    <select
                                        name="categoryId"
                                        className="w-full bg-white/5 border border-white/10 rounded-md px-10 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                                    >
                                        <option value="cat_general" className="bg-gray-900">General Development</option>
                                        <option value="cat_design" className="bg-gray-900">Design & Creative</option>
                                        <option value="cat_marketing" className="bg-gray-900">Marketing</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 ml-1">Budget ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                                    <GlassInput
                                        name="budget"
                                        type="number"
                                        placeholder="5000"
                                        className="pl-10"
                                        required
                                        min={5}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70 ml-1">Project Description</label>
                            <GlassTextarea
                                name="description"
                                placeholder="Detailed explanation of your requirements, deliverables, and timeline..."
                                rows={8}
                                required
                                minLength={20}
                            />
                        </div>

                        {/* Skills */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70 ml-1">Required Skills (comma separated)</label>
                            <GlassInput
                                name="skills"
                                placeholder="React, TypeScript, Tailwind, Node.js"
                            />
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {typeof error === 'string' ? error : "Please check the form for errors."}
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <GlassButton type="submit" size="lg" disabled={isPending}>
                                {isPending ? "Publishing..." : "Post Job Now"}
                            </GlassButton>
                        </div>

                    </form>
                </GlassCard>
            </div>
        </DashboardShell>
    );
}
