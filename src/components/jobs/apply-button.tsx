'use client';

import React, { useState, useTransition } from 'react';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassModal } from '@/components/ui/glass-modal';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassTextarea } from '@/components/ui/glass-textarea';
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

        // Append hidden jobId
        formData.append('jobId', jobId);

        startTransition(async () => {
            const result = await submitProposal(formData);

            if (result.error) {
                // Handle zod array errors or string errors
                const errorMsg = typeof result.error === 'string'
                    ? result.error
                    : Object.values(result.error).flat().join(', ');

                setMessage({ type: 'error', text: errorMsg });
            } else {
                setMessage({ type: 'success', text: result.success as string });
                // Close after a delay and refresh
                setTimeout(() => {
                    setIsOpen(false);
                    // router.refresh(); // Server action already revalidates
                }, 2000);
            }
        });
    };

    return (
        <>
            <GlassButton
                variant="primary"
                size="lg"
                onClick={() => setIsOpen(true)}
                className="w-full md:w-auto"
            >
                Apply Now <Send className="w-4 h-4 ml-2" />
            </GlassButton>

            <GlassModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={`Apply for: ${jobTitle}`}
            >
                {message && message.type === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 text-green-500">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Proposal Sent!</h3>
                        <p className="text-white/60">Good luck! The client will review your application shortly.</p>
                    </div>
                ) : (
                    <form action={handleSubmit} className="space-y-6">
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
            </GlassModal>
        </>
    );
};
