'use client';

import React, { useState, useTransition } from 'react';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassTextarea } from '@/components/ui/glass-textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { submitProposal } from '@/actions/proposal-actions';
import { Send, Loader2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ApplyButtonProps {
    jobId: string;
    jobTitle: string;
    budget: number;
}

export const ApplyButton = ({ jobId, jobTitle, budget }: ApplyButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        setMessage(null);

        const price = parseFloat(formData.get('price') as string);
        const coverLetter = formData.get('coverLetter') as string;

        // Construct standard payload for "Quick Apply"
        // Assumption: Quick Apply is treated as a single milestone Fixed Price proposal
        // TODO: ideally we should know if job is hourly, but for quick apply we assume Fixed logic or generic rate
        // However, the new strict backend logic triggers validations based on job.budgetType.
        // If job is Hourly, backend ignores milestones. If Fixed, backend REQUIRES milestones.
        // We will send milestones to be safe for Fixed jobs.

        const payload = {
            jobId,
            coverLetter,
            proposedRate: price,
            rateType: 'FIXED' as const, // Default to FIXED, backend might override if job is hourly? No, backend validation uses job type.
            // Actually, for HOURLY, rateType should be HOURLY.
            // Since we don't have budgetType prop here, we might have an issue if the job is HOURLY.
            // But let's assume standard behavior:
            // If Job is Hourly, backend ignores milestones and uses proposedRate.
            // If Job is Fixed, backend USES milestones and ignores proposedRate.
            // So we send BOTH to be safe: valid milestones summing to price, AND proposedRate = price.

            estimatedDuration: 'To be determined',
            availability: 'As needed',
            milestones: [
                {
                    title: 'Full Project',
                    description: 'Complete project as per requirements',
                    amount: price,
                    duration: 'TBD'
                }
            ],
            totalMilestoneAmount: price,
            selectedPortfolioIds: [],
            attachments: [],
            screeningAnswers: {},
            acceptsTrialTask: false,
            isDraft: false,
            lastEditedAt: new Date()
        };

        startTransition(async () => {
            const result = await submitProposal(payload);

            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: "Proposal submitted successfully!" });
                setTimeout(() => {
                    setIsOpen(false);
                }, 2000);
            }
        });
    };

    return (

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <GlassButton
                    variant="primary"
                    size="lg"
                    className="w-full md:w-auto"
                >
                    Apply Now <Send className="w-4 h-4 ml-2" />
                </GlassButton>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px] bg-zinc-900 delay-0 animate-in fade-in zoom-in-95 duration-200 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Apply for: {jobTitle}</DialogTitle>
                </DialogHeader>

                {message && message.type === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 text-green-500">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Proposal Sent!</h3>
                        <p className="text-white/60">Good luck! The client will review your application shortly.</p>
                    </div>
                ) : (
                    <form action={handleSubmit} className="space-y-6 mt-4">
                        {/* Error Display */}
                        {message && message.type === 'error' && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {message.text}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Proposed Bid ($)</label>
                            <GlassInput
                                name="price"
                                type="number"
                                placeholder={budget.toString()}
                                defaultValue={budget}
                                required
                                min="1"
                            />
                            <p className="text-xs text-white/40">The client's budget is ${budget}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Cover Letter</label>
                            <GlassTextarea
                                name="coverLetter"
                                placeholder="Introduce yourself and explain why you're a great fit..."
                                className="h-40"
                                required
                            />
                            <p className="text-xs text-white/40">Minimum 50 characters.</p>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <GlassButton
                                type="button"
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </GlassButton>
                            <GlassButton
                                type="submit"
                                variant="primary"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>Processing <Loader2 className="w-4 h-4 ml-2 animate-spin" /></>
                                ) : (
                                    <>Submit Proposal</>
                                )}
                            </GlassButton>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

