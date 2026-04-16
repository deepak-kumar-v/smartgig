import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getPendingReviews } from '@/actions/review-actions';
import {
    Star, Clock, CheckCircle, ArrowRight, MessageSquare, AlertCircle
} from 'lucide-react';

export default async function FreelancerReviewsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const userId = session.user.id;

    // Fetch pending reviews (non-blocking read-only)
    const pendingReviews = await getPendingReviews(userId);

    // Fetch submitted reviews
    const submittedReviews = await db.review.findMany({
        where: { reviewerId: userId },
        include: {
            contract: {
                select: {
                    title: true,
                    type: true,
                    totalBudget: true,
                    client: {
                        select: { user: { select: { name: true } } },
                    },
                    freelancer: {
                        select: { user: { select: { name: true } } },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Reviews</h1>
                    <p className="text-zinc-400">Manage your reviews and feedback</p>
                </div>

                {/* Pending Reviews Section */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-amber-400" />
                        <h2 className="text-xl font-semibold text-white">Pending Reviews</h2>
                        {pendingReviews.length > 0 && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                                {pendingReviews.length}
                            </span>
                        )}
                    </div>

                    {pendingReviews.length > 0 ? (
                        <div className="space-y-3">
                            {pendingReviews.map((pr) => (
                                <GlassCard key={pr.contractId} className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                                                {pr.otherPartyName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{pr.title}</p>
                                                <p className="text-zinc-500 text-sm">
                                                    {pr.otherPartyName} • {pr.type}
                                                </p>
                                            </div>
                                        </div>
                                        <Link href={`/freelancer/reviews/new?contractId=${pr.contractId}`}>
                                            <GlassButton variant="primary" size="sm" asDiv>
                                                <Star className="w-4 h-4 mr-2" />
                                                Leave Review
                                            </GlassButton>
                                        </Link>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    ) : (
                        <GlassCard className="p-8 text-center">
                            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                            <p className="text-zinc-400">All caught up! No pending reviews.</p>
                        </GlassCard>
                    )}
                </div>

                {/* Completed Reviews Section */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-xl font-semibold text-white">Submitted Reviews</h2>
                        {submittedReviews.length > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                                {submittedReviews.length}
                            </span>
                        )}
                    </div>

                    {submittedReviews.length > 0 ? (
                        <div className="space-y-3">
                            {submittedReviews.map((review) => {
                                const otherParty = review.reviewerRole === 'FREELANCER'
                                    ? review.contract.client.user.name
                                    : review.contract.freelancer.user.name;

                                return (
                                    <GlassCard key={review.id} className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="text-white font-medium">{review.contract.title}</p>
                                                <p className="text-zinc-500 text-sm">
                                                    Reviewed: {otherParty} • {review.contract.type}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg">
                                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                                <span className="text-amber-400 font-bold text-sm">{review.rating}/5</span>
                                            </div>
                                        </div>

                                        {/* Dimensional breakdown */}
                                        <div className="grid grid-cols-5 gap-2 mb-3">
                                            {[
                                                { label: 'Quality', value: review.quality },
                                                { label: 'Comms', value: review.communication },
                                                { label: 'Time', value: review.timeliness },
                                                { label: 'Prof.', value: review.professionalism },
                                                { label: 'Reliable', value: review.reliability },
                                            ].map(dim => (
                                                <div key={dim.label} className="text-center p-2 bg-zinc-800/50 rounded-lg">
                                                    <div className="text-white font-bold text-sm">{dim.value}/5</div>
                                                    <div className="text-zinc-500 text-[10px]">{dim.label}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Comment */}
                                        <div className="flex items-start gap-2 p-3 bg-zinc-800/30 rounded-lg">
                                            <MessageSquare className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                                            <p className="text-zinc-400 text-sm">{review.comment}</p>
                                        </div>

                                        <div className="mt-2 text-right">
                                            <span className="text-zinc-600 text-xs">
                                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric', month: 'short', day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </GlassCard>
                                );
                            })}
                        </div>
                    ) : (
                        <GlassCard className="p-8 text-center">
                            <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                            <p className="text-zinc-500">No reviews submitted yet</p>
                            <p className="text-zinc-600 text-xs mt-1">Reviews will appear here after you complete contracts</p>
                        </GlassCard>
                    )}
                </div>
            </div>
        </>
    );
}
