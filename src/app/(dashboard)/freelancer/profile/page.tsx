
import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import Link from 'next/link';
import {
    MapPin, Globe, Clock, Star, CheckCircle, Shield,
    Briefcase, GraduationCap, Award, MessageSquare,
    DollarSign, Calendar, TrendingUp, Users, ExternalLink,
    AlertCircle
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

function ReputationBar({ label, score }: { label: string; score: number }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-zinc-400">{label}</span>
                <span className="text-white font-medium">{score}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}

export default async function FreelancerProfilePage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect('/login');
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: {
            freelancerProfile: {
                include: {
                    skills: true,
                    portfolio: true,
                    reviews: true,
                }
            },
            wallet: true, // For earnings (if needed later)
        }
    });

    if (!user) {
        return (
            <>
                <div className="text-center text-zinc-400 mt-20">User not found</div>
            </>
        );
    }

    const profile = user.freelancerProfile;

    if (!profile) {
        return (
            <>
                <div className="max-w-2xl mx-auto mt-20 text-center space-y-4">
                    <div className="p-4 bg-zinc-800/50 rounded-xl inline-block">
                        <AlertCircle className="w-10 h-10 text-zinc-500 mx-auto" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Profile Not Found</h1>
                    <p className="text-zinc-400">Please complete your freelancer profile to view this page.</p>
                    <Link href="/onboarding/freelancer">
                        <GlassButton variant="primary">Create Profile</GlassButton>
                    </Link>
                </div>
            </>
        );
    }

    // Adapt DB data to match UI expectations where possible
    // Note: Some fields like City, Country, Timezone, Education, Certs are not in DB yet
    // I will use placeholders or hide sections based on data availability

    const reviews = profile.reviews || [];
    const skills = profile.skills || [];
    const portfolio = profile.portfolio || [];

    // Calculate aggregated stats if possible, or use defaults
    const completedJobs = 0; // Requires Contract relation aggregation
    const successRate = 100; // Default/Mock logic or calculate from reviews
    const totalEarnings = 0; // Requires WalletLedger aggregation

    // Default Mock Reputation for now (since not in DB)
    const reputation = {
        overallScore: user.trustScore,
        totalReviews: reviews.length,
        qualityScore: 98,
        communicationScore: 95,
        timelinessScore: 92,
        cooperationScore: 99,
    };

    return (
        <>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
                        <p className="text-zinc-400">Manage your public appearance and portfolio</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/freelancer/profile/edit">
                            <GlassButton variant="secondary" asDiv>Edit Profile</GlassButton>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column - Main Profile */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Header Card */}
                        <GlassCard className="p-8">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
                                        {user.image ? (
                                            <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
                                        ) : (
                                            (user.name?.charAt(0) || 'U')
                                        )}
                                    </div>
                                    {profile.availability === 'AVAILABLE' && (
                                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-zinc-900" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                                        {user.isVerified && (
                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 rounded text-xs text-emerald-400">
                                                <Shield className="w-3 h-3" /> Verified
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-zinc-400 mb-4">{profile.title}</p>

                                    <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                                        {/* Mock Location for now as not in DB */}
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" /> Global
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" /> Member since {new Date(user.createdAt).getFullYear()}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-6 mt-4">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                            <span className="text-white font-bold">{reputation.overallScore.toFixed(0)}</span>
                                            <span className="text-zinc-500 text-sm">({reputation.totalReviews} reviews)</span>
                                        </div>
                                        <div className="text-sm text-zinc-500">
                                            <span className="text-emerald-400 font-medium">{successRate}%</span> success rate
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Bio */}
                        {profile.bio && (
                            <GlassCard className="p-6">
                                <h2 className="text-lg font-semibold text-white mb-4">About</h2>
                                <p className="text-zinc-400 whitespace-pre-line leading-relaxed">{profile.bio}</p>
                            </GlassCard>
                        )}

                        {/* Skills */}
                        <GlassCard className="p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Skills</h2>
                            {skills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((skill) => (
                                        <div
                                            key={skill.id}
                                            className="px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 bg-zinc-800 text-zinc-400 border border-zinc-700"
                                        >
                                            {skill.name}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-zinc-500 text-sm">No skills listed yet.</p>
                            )}
                        </GlassCard>

                        {/* Portfolio */}
                        <GlassCard className="p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Portfolio</h2>
                            {portfolio.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {portfolio.map((item) => (
                                        <div key={item.id} className="p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer">
                                            <div className="aspect-video bg-zinc-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                                {item.thumbnailUrl ? (
                                                    <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Briefcase className="w-8 h-8 text-zinc-500" />
                                                )}
                                            </div>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-medium text-white">{item.title}</h3>
                                                    <p className="text-sm text-zinc-500 line-clamp-2">{item.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-zinc-500 text-sm">No portfolio items yet.</p>
                            )}
                        </GlassCard>

                        {/* Reviews */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-white">Work History & Reviews</h2>
                                <span className="text-sm text-zinc-500">{reviews.length} reviews</span>
                            </div>
                            {reviews.length > 0 ? (
                                <div className="space-y-6">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="pb-6 border-b border-zinc-800 last:border-0">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    {/* Ideally fetch Project Name from Contract/Review relation if user included */}
                                                    <h3 className="font-medium text-white">Project Review</h3>
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-4 h-4 ${i < review.rating
                                                                    ? 'text-amber-400 fill-amber-400'
                                                                    : 'text-zinc-700'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="text-zinc-600 text-xs">{new Date(review.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-zinc-400 text-sm">{review.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-zinc-500 text-sm">No reviews yet.</p>
                            )}
                        </GlassCard>

                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Trust Score */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-white">Trust Score</h3>
                                <div className="flex items-center gap-1 text-2xl font-bold text-white">
                                    <Shield className="w-6 h-6 text-indigo-400" />
                                    {user.trustScore}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <ReputationBar label="Quality" score={reputation.qualityScore} />
                                <ReputationBar label="Communication" score={reputation.communicationScore} />
                                <ReputationBar label="Timeliness" score={reputation.timelinessScore} />
                                <ReputationBar label="Cooperation" score={reputation.cooperationScore} />
                            </div>
                        </GlassCard>

                        {/* Stats */}
                        <GlassCard className="p-6">
                            <h3 className="font-semibold text-white mb-4">Statistics</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" /> Jobs Completed
                                    </span>
                                    <span className="text-white font-medium">{completedJobs}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> Success Rate
                                    </span>
                                    <span className="text-emerald-400 font-medium">{successRate}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" /> Hourly Rate
                                    </span>
                                    <span className="text-white font-medium">${profile.hourlyRate}/hr</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Availability
                                    </span>
                                    <span className="text-white font-medium capitalize">{profile.availability?.toLowerCase().replace('_', ' ')}</span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Verification Badges */}
                        <GlassCard className="p-6">
                            <h3 className="font-semibold text-white mb-4">Verifications</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className={`w-5 h-5 ${user.isVerified ? 'text-emerald-400' : 'text-zinc-600'}`} />
                                    <span className={user.isVerified ? 'text-zinc-300' : 'text-zinc-500'}>Identity Verified</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className={`w-5 h-5 ${user.emailVerified ? 'text-emerald-400' : 'text-zinc-600'}`} />
                                    <span className={user.emailVerified ? 'text-zinc-300' : 'text-zinc-500'}>Email Verified</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className={`w-5 h-5 ${user.phone ? 'text-emerald-400' : 'text-zinc-600'}`} />
                                    <span className={user.phone ? 'text-zinc-300' : 'text-zinc-500'}>Phone Verified</span>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </>
    );
}
