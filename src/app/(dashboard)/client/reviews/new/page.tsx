'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassTextarea } from '@/components/ui/glass-textarea';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    Star, Send, ArrowLeft, CheckCircle, Clock, MessageSquare,
    RefreshCw, DollarSign, Loader2, Lock, AlertCircle
} from 'lucide-react';
import { useSession } from 'next-auth/react';

// Mock contract data
const mockContract = {
    id: 'contract-1',
    title: 'Backend API Development',
    freelancer: { id: 'f-1', name: 'David Kim', avatar: null },
    client: { id: 'c-1', name: 'Sarah Chen', company: 'TechCorp Solutions' },
    totalAmount: 6500,
    completedAt: '2025-01-15',
};

interface RatingCategory {
    id: string;
    label: string;
    description: string;
    icon: React.ElementType;
    value: number;
}

function StarRating({
    value,
    onChange,
    size = 'md',
    readonly = false
}: {
    value: number;
    onChange?: (val: number) => void;
    size?: 'sm' | 'md' | 'lg';
    readonly?: boolean;
}) {
    const [hovered, setHovered] = useState<number | null>(null);
    const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(star)}
                    onMouseEnter={() => !readonly && setHovered(star)}
                    onMouseLeave={() => setHovered(null)}
                    className={`transition-transform ${!readonly && 'hover:scale-110'}`}
                >
                    <Star
                        className={`${sizeClass} transition-colors ${(hovered !== null ? star <= hovered : star <= value)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-zinc-700 text-zinc-600'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
}

export default function NewReviewPage() {
    const searchParams = useSearchParams();
    const contractId = searchParams.get('contractId') || mockContract.id;
    const { data: session } = useSession();
    const userRole = session?.user?.role ? session.user.role.toLowerCase() as 'freelancer' | 'client' | 'admin' : 'freelancer';
    const isFreelancer = userRole === 'freelancer';

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Rating categories
    const [ratings, setRatings] = useState<RatingCategory[]>([
        { id: 'overall', label: 'Overall Experience', description: 'How was your overall experience?', icon: Star, value: 0 },
        { id: 'quality', label: 'Quality of Work', description: 'How was the quality of deliverables?', icon: CheckCircle, value: 0 },
        { id: 'timeliness', label: 'Timeliness', description: 'Were deadlines met consistently?', icon: Clock, value: 0 },
        { id: 'communication', label: 'Communication', description: 'How responsive and clear was communication?', icon: MessageSquare, value: 0 },
        { id: 'revisions', label: 'Revision Handling', description: 'How well were revision requests handled?', icon: RefreshCw, value: 0 },
        { id: 'value', label: isFreelancer ? 'Payment Fairness' : 'Value for Money', description: isFreelancer ? 'Was payment timely and fair?' : 'Was the work worth the cost?', icon: DollarSign, value: 0 },
    ]);

    const [publicReview, setPublicReview] = useState('');
    const [privateNote, setPrivateNote] = useState('');
    const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

    const updateRating = (id: string, value: number) => {
        setRatings(prev => prev.map(r => r.id === id ? { ...r, value } : r));
    };

    const averageRating = ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length;
    const canSubmit = ratings.every(r => r.value > 0) && publicReview.length >= 50 && wouldRecommend !== null;

    const handleSubmit = async () => {
        if (!canSubmit) return;

        setSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSubmitting(false);
        setSubmitted(true);
    };

    // Success state
    if (submitted) {
        return (
            <>
                <div className="max-w-2xl mx-auto text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Review Submitted!</h1>
                    <p className="text-zinc-400 mb-6">
                        Thank you for your feedback. Your review helps maintain quality on SmartGIG.
                    </p>
                    <div className="p-4 bg-zinc-800/50 rounded-xl mb-6 inline-block">
                        <StarRating value={Math.round(averageRating)} readonly size="lg" />
                        <p className="text-white font-bold text-lg mt-2">{averageRating.toFixed(1)} / 5.0</p>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <Link href={`/contracts/${contractId}`}>
                            <GlassButton variant="secondary">
                                View Contract
                            </GlassButton>
                        </Link>
                        <Link href={isFreelancer ? '/freelancer/dashboard' : '/client/dashboard'}>
                            <GlassButton variant="primary">
                                Go to Dashboard
                            </GlassButton>
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <Link href={`/contracts/${contractId}`} className="text-zinc-500 hover:text-white text-sm inline-flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Contract
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Leave a Review</h1>
                    <p className="text-zinc-400">Share your experience working on this project</p>
                </div>

                {/* Contract Summary */}
                <GlassCard className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                {isFreelancer
                                    ? mockContract.client.name.split(' ').map(n => n[0]).join('')
                                    : mockContract.freelancer.name.split(' ').map(n => n[0]).join('')
                                }
                            </div>
                            <div>
                                <p className="text-white font-medium">{mockContract.title}</p>
                                <p className="text-zinc-500 text-sm">
                                    {isFreelancer ? `Client: ${mockContract.client.name}` : `Freelancer: ${mockContract.freelancer.name}`}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-emerald-400 font-bold">${mockContract.totalAmount.toLocaleString()}</p>
                            <p className="text-zinc-500 text-xs">Completed {mockContract.completedAt}</p>
                        </div>
                    </div>
                </GlassCard>

                {/* Rating Categories */}
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-white mb-6">Rate Your Experience</h2>
                    <div className="space-y-6">
                        {ratings.map((rating) => (
                            <div key={rating.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-zinc-700/50">
                                        <rating.icon className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{rating.label}</p>
                                        <p className="text-zinc-500 text-sm">{rating.description}</p>
                                    </div>
                                </div>
                                <StarRating
                                    value={rating.value}
                                    onChange={(val) => updateRating(rating.id, val)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Average Display */}
                    {ratings.every(r => r.value > 0) && (
                        <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
                            <p className="text-indigo-400 text-sm mb-2">Average Rating</p>
                            <div className="flex items-center justify-center gap-2">
                                <StarRating value={Math.round(averageRating)} readonly size="lg" />
                                <span className="text-white text-2xl font-bold">{averageRating.toFixed(1)}</span>
                            </div>
                        </div>
                    )}
                </GlassCard>

                {/* Written Review */}
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Written Review</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-white text-sm font-medium">Public Review *</label>
                            <GlassTextarea
                                value={publicReview}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPublicReview(e.target.value)}
                                placeholder="Share your experience. What went well? What could be improved? This will be visible on their profile."
                                rows={5}
                            />
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">{publicReview.length}/2000 characters</span>
                                <span className={publicReview.length >= 50 ? 'text-emerald-400' : 'text-amber-400'}>
                                    Minimum 50 characters required
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-white text-sm font-medium flex items-center gap-2">
                                <Lock className="w-4 h-4 text-zinc-500" />
                                Private Note for SmartGIG (Optional)
                            </label>
                            <GlassTextarea
                                value={privateNote}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrivateNote(e.target.value)}
                                placeholder="Any private feedback for our team? This won't be shared with the other party."
                                rows={3}
                            />
                            <p className="text-zinc-500 text-xs">Only SmartGIG admins will see this</p>
                        </div>
                    </div>
                </GlassCard>

                {/* Recommendation */}
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Would you recommend?</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setWouldRecommend(true)}
                            className={`flex-1 p-4 rounded-xl border transition-all ${wouldRecommend === true
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                }`}
                        >
                            <span className="text-3xl mb-2">👍</span>
                            <p className={`font-medium ${wouldRecommend === true ? 'text-emerald-400' : 'text-white'}`}>
                                Yes, I would!
                            </p>
                        </button>
                        <button
                            onClick={() => setWouldRecommend(false)}
                            className={`flex-1 p-4 rounded-xl border transition-all ${wouldRecommend === false
                                ? 'border-rose-500 bg-rose-500/10'
                                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                }`}
                        >
                            <span className="text-3xl mb-2">👎</span>
                            <p className={`font-medium ${wouldRecommend === false ? 'text-rose-400' : 'text-white'}`}>
                                No, not really
                            </p>
                        </button>
                    </div>
                </GlassCard>

                {/* Validation Warning */}
                {!canSubmit && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                            <div>
                                <p className="text-amber-400 font-medium">Please complete all fields</p>
                                <ul className="text-amber-400/70 text-sm mt-1 space-y-1">
                                    {ratings.some(r => r.value === 0) && <li>• Rate all categories</li>}
                                    {publicReview.length < 50 && <li>• Write at least 50 characters in your review</li>}
                                    {wouldRecommend === null && <li>• Select whether you would recommend</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <Link href={`/contracts/${contractId}`}>
                        <GlassButton variant="secondary">Cancel</GlassButton>
                    </Link>
                    <GlassButton
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Submit Review
                            </>
                        )}
                    </GlassButton>
                </div>
            </div>
        </>
    );
}
