'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassTextarea } from '@/components/ui/glass-textarea';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Star, Send, ArrowLeft, CheckCircle, Clock, MessageSquare,
    Loader2, AlertCircle, Shield, Zap
} from 'lucide-react';
import { submitReview } from '@/actions/review-actions';
import { toast } from 'sonner';

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

interface ContractData {
    id: string;
    title: string;
    otherPartyName: string;
    totalBudget: number;
    type: string;
}

interface RatingCategory {
    id: string;
    label: string;
    description: string;
    icon: React.ElementType;
    value: number;
}

export default function ClientNewReviewPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const contractId = searchParams.get('contractId') || '';

    const [contract, setContract] = useState<ContractData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [ratings, setRatings] = useState<RatingCategory[]>([
        { id: 'quality', label: 'Quality of Work', description: 'How was the quality of deliverables?', icon: CheckCircle, value: 0 },
        { id: 'communication', label: 'Communication', description: 'How responsive and clear was communication?', icon: MessageSquare, value: 0 },
        { id: 'timeliness', label: 'Timeliness', description: 'Were deadlines met consistently?', icon: Clock, value: 0 },
        { id: 'professionalism', label: 'Professionalism', description: 'How professional was the overall conduct?', icon: Shield, value: 0 },
        { id: 'reliability', label: 'Reliability', description: 'How dependable and consistent was the work?', icon: Zap, value: 0 },
    ]);

    const [publicReview, setPublicReview] = useState('');

    useEffect(() => {
        async function loadContract() {
            if (!contractId) {
                // Redirect to reviews page instead of showing error
                router.replace('/client/reviews');
                return;
            }
            try {
                const res = await fetch(`/api/contracts/${contractId}/review-data`);
                if (!res.ok) {
                    setError('Contract not found or not eligible for review');
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                setContract(data);
            } catch {
                setError('Failed to load contract data');
            }
            setLoading(false);
        }
        loadContract();
    }, [contractId]);

    const updateRating = (id: string, value: number) => {
        setRatings(prev => prev.map(r => r.id === id ? { ...r, value } : r));
    };

    const averageRating = ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length;
    const canSubmit = ratings.every(r => r.value > 0) && publicReview.length >= 20;

    const handleSubmit = async () => {
        if (!canSubmit || !contractId) return;

        setSubmitting(true);
        const result = await submitReview({
            contractId,
            quality: ratings.find(r => r.id === 'quality')!.value,
            communication: ratings.find(r => r.id === 'communication')!.value,
            timeliness: ratings.find(r => r.id === 'timeliness')!.value,
            professionalism: ratings.find(r => r.id === 'professionalism')!.value,
            reliability: ratings.find(r => r.id === 'reliability')!.value,
            comment: publicReview,
        });

        setSubmitting(false);

        if (result.error) {
            toast.error(result.error);
            return;
        }

        setSubmitted(true);
        toast.success('Review submitted successfully!');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
        );
    }

    if (error || !contract) {
        return (
            <>
                <div className="max-w-2xl mx-auto text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">{error || 'Contract not found'}</h1>
                    <p className="text-zinc-400 mb-6">Please select a valid completed contract to review.</p>
                    <Link href="/client/dashboard">
                        <GlassButton variant="secondary">Back to Dashboard</GlassButton>
                    </Link>
                </div>
            </>
        );
    }

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
                        <Link href="/client/dashboard">
                            <GlassButton variant="primary">Go to Dashboard</GlassButton>
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <Link href="/client/dashboard" className="text-zinc-500 hover:text-white text-sm inline-flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Leave a Review</h1>
                    <p className="text-zinc-400">Share your experience working with this freelancer</p>
                </div>

                <GlassCard className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                {contract.otherPartyName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                                <p className="text-white font-medium">{contract.title}</p>
                                <p className="text-zinc-500 text-sm">Freelancer: {contract.otherPartyName}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-emerald-400 font-bold">${contract.totalBudget.toLocaleString()}</p>
                            <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-400">{contract.type}</span>
                        </div>
                    </div>
                </GlassCard>

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
                                <StarRating value={rating.value} onChange={(val) => updateRating(rating.id, val)} />
                            </div>
                        ))}
                    </div>

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

                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Written Review</h2>
                    <div className="space-y-2">
                        <label className="text-white text-sm font-medium">Public Review *</label>
                        <GlassTextarea
                            value={publicReview}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPublicReview(e.target.value)}
                            placeholder="Share your experience. What went well? What could be improved?"
                            rows={5}
                        />
                        <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">{publicReview.length}/2000 characters</span>
                            <span className={publicReview.length >= 20 ? 'text-emerald-400' : 'text-amber-400'}>
                                Minimum 20 characters required
                            </span>
                        </div>
                    </div>
                </GlassCard>

                {!canSubmit && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                            <div>
                                <p className="text-amber-400 font-medium">Please complete all fields</p>
                                <ul className="text-amber-400/70 text-sm mt-1 space-y-1">
                                    {ratings.some(r => r.value === 0) && <li>• Rate all categories</li>}
                                    {publicReview.length < 20 && <li>• Write at least 20 characters</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-4">
                    <Link href="/client/dashboard">
                        <GlassButton variant="secondary">Cancel</GlassButton>
                    </Link>
                    <GlassButton variant="primary" onClick={handleSubmit} disabled={!canSubmit || submitting}>
                        {submitting ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                        ) : (
                            <><Send className="w-4 h-4 mr-2" />Submit Review</>
                        )}
                    </GlassButton>
                </div>
            </div>
        </>
    );
}
