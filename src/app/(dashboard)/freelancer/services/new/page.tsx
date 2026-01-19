import React from 'react';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { createService } from '@/app/actions/services';
import { Info, DollarSign, List, FileText, ArrowRight } from 'lucide-react';

async function getCategories() {
    return db.category.findMany({
        orderBy: { name: 'asc' }
    });
}

export default async function NewServicePage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const categories = await getCategories();

    return (
        <DashboardShell role="freelancer">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Create "Open to Work" Profile</h1>
                    <p className="text-zinc-400">
                        Define the service you want to offer. Clients will apply to work with you based on these criteria.
                    </p>
                </div>

                <form action={createService as any}>
                    <GlassCard className="p-8 space-y-8">
                        {/* Section 1: Basics */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-violet-400">
                                <List className="w-5 h-5" />
                                <h3 className="font-medium">Service Overview</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                                        Service Title <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        placeholder="e.g. I will build high-performance React web applications"
                                        required
                                        minLength={10}
                                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:bg-zinc-800 transition-all font-medium"
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Keep it short and descriptive. Start with "I will..."</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                                        Category <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        name="categoryId"
                                        required
                                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:bg-zinc-800 transition-all"
                                    >
                                        <option value="">Select a category...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-white/5" />

                        {/* Section 2: Pricing */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-emerald-400">
                                <DollarSign className="w-5 h-5" />
                                <h3 className="font-medium">Pricing & Rates</h3>
                            </div>

                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 mb-4 flex items-start gap-3">
                                <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-zinc-400">
                                    Set your minimum starting price. You can negotiate the final price with each client who applies, but this sets the baseline expectation.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">
                                    Starting Price ($) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative max-w-xs">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</div>
                                    <input
                                        type="number"
                                        name="basePrice"
                                        placeholder="100"
                                        required
                                        min={5}
                                        className="w-full pl-8 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-800 transition-all font-mono text-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-white/5" />

                        {/* Section 3: Details */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-blue-400">
                                <FileText className="w-5 h-5" />
                                <h3 className="font-medium">Service Description</h3>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">
                                    Description <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    required
                                    minLength={50}
                                    rows={8}
                                    placeholder="Describe your process, expertise, and what clients can expect..."
                                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:bg-zinc-800 transition-all resize-none"
                                />
                                <p className="text-xs text-zinc-500 mt-1">Minimum 50 characters.</p>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex items-center justify-end gap-4 pt-4">
                            <GlassButton variant="secondary" type="button">
                                Cancel
                            </GlassButton>
                            <GlassButton variant="primary" type="submit">
                                Publish Profile <ArrowRight className="w-4 h-4 ml-2" />
                            </GlassButton>
                        </div>
                    </GlassCard>
                </form>
            </div>
        </DashboardShell>
    );
}
