import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import Link from 'next/link';
import {
    MapPin, Clock, Star, CheckCircle, Shield,
    Briefcase, DollarSign, Calendar, TrendingUp, Users,
    AlertCircle, GraduationCap, Globe
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { getCurrencySymbol } from '@/lib/currency';
import { getFreelancerWorkload } from '@/lib/workload';
import { getReviewBreakdown } from '@/actions/review-actions';

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
                    contracts: {
                        where: { status: 'COMPLETED' },
                        select: { id: true },
                    },
                }
            },
        }
    });

    if (!user) {
        return (
            <div className="text-center text-zinc-400 mt-20">User not found</div>
        );
    }

    const profile = user.freelancerProfile;

    if (!profile) {
        return (
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
        );
    }

    // Computed stats from real data
    const reviews = profile.reviews || [];
    const skills = profile.skills || [];
    const portfolio = profile.portfolio || [];
    const completedJobs = profile.contracts?.length || 0;
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    // Workload data — pure read-only
    const workload = await getFreelancerWorkload(profile.id);

    // Review breakdown — pure read-only
    const reviewBreakdown = await getReviewBreakdown(profile.id);

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
                                        {(profile.city || profile.country) && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {[profile.city, profile.country].filter(Boolean).join(', ')}
                                            </span>
                                        )}
                                        {profile.timezone && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" /> {profile.timezone}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" /> Member since {new Date(user.createdAt).getFullYear()}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-6 mt-4">
                                        {totalReviews > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                                <span className="text-white font-bold">{avgRating.toFixed(1)}</span>
                                                <span className="text-zinc-500 text-sm">({totalReviews} reviews)</span>
                                            </div>
                                        )}
                                        {completedJobs > 0 && (
                                            <div className="text-sm text-zinc-500">
                                                <span className="text-emerald-400 font-medium">{completedJobs}</span> jobs completed
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* About */}
                        {profile.bio && (
                            <GlassCard className="p-6">
                                <h2 className="text-lg font-semibold text-white mb-4">About</h2>
                                <p className="text-zinc-400 whitespace-pre-line leading-relaxed">{profile.bio}</p>
                            </GlassCard>
                        )}

                        {/* Professional Details */}
                        {(profile.education || profile.experienceYears != null || profile.experienceSummary || (profile.languages && profile.languages.length > 0)) && (
                            <GlassCard className="p-6">
                                <h2 className="text-lg font-semibold text-white mb-4">Professional Details</h2>
                                <div className="space-y-4">
                                    {profile.education && (
                                        <div className="flex items-start gap-3">
                                            <GraduationCap className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-zinc-500">Education</p>
                                                <p className="text-white">{profile.education}</p>
                                            </div>
                                        </div>
                                    )}
                                    {profile.experienceYears != null && (
                                        <div className="flex items-start gap-3">
                                            <Briefcase className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-zinc-500">Experience</p>
                                                <p className="text-white">{profile.experienceYears} {profile.experienceYears === 1 ? 'year' : 'years'} experience</p>
                                            </div>
                                        </div>
                                    )}
                                    {profile.experienceSummary && (
                                        <div className="flex items-start gap-3">
                                            <TrendingUp className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-zinc-500">Experience Summary</p>
                                                <p className="text-zinc-400 whitespace-pre-line leading-relaxed">{profile.experienceSummary}</p>
                                            </div>
                                        </div>
                                    )}
                                    {profile.languages && profile.languages.length > 0 && (
                                        <div className="flex items-start gap-3">
                                            <Globe className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-zinc-500 mb-2">Languages</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.languages.map((lang: string) => (
                                                        <span key={lang} className="px-3 py-1 rounded-full text-sm bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                                            {lang}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                                <p className="text-zinc-500 text-sm">No skills listed yet. <Link href="/freelancer/profile/edit" className="text-indigo-400 hover:text-indigo-300">Add skills</Link></p>
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
                                            <div>
                                                <h3 className="font-medium text-white">{item.title}</h3>
                                                <p className="text-sm text-zinc-500 line-clamp-2">{item.description}</p>
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
                                <span className="text-sm text-zinc-500">{totalReviews} reviews</span>
                            </div>
                            {reviews.length > 0 ? (
                                <div className="space-y-6">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="pb-6 border-b border-zinc-800 last:border-0">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
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
                        {/* Availability */}
                        <GlassCard className="p-6">
                            <h3 className="font-semibold text-white mb-4">Availability</h3>
                            <div className="flex items-center gap-2 mb-4">
                                <div className={`w-3 h-3 rounded-full ${
                                    workload.status === 'AVAILABLE' ? 'bg-emerald-400 animate-pulse' :
                                    workload.status === 'LIMITED' ? 'bg-amber-400' : 'bg-red-400'
                                }`} />
                                <span className={`text-sm font-medium ${
                                    workload.status === 'AVAILABLE' ? 'text-emerald-400' :
                                    workload.status === 'LIMITED' ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                    {workload.status === 'AVAILABLE' ? 'Available for new work' :
                                     workload.status === 'LIMITED' ? 'Limited availability' : 'Fully booked'}
                                </span>
                            </div>
                            <div className="space-y-3">
                                <p className="text-sm text-zinc-400">
                                    Currently handling <span className="text-white font-medium">{workload.activeProjects}</span> active project{workload.activeProjects !== 1 ? 's' : ''}
                                </p>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Workload</span>
                                    <span className="text-white">{workload.currentWorkload}h / {workload.capacity}h</span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${
                                            workload.status === 'AVAILABLE' ? 'bg-emerald-500' :
                                            workload.status === 'LIMITED' ? 'bg-amber-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${Math.min(workload.utilization, 100)}%` }}
                                    />
                                </div>
                                <div className="text-xs text-zinc-600 text-right">{workload.utilization}% utilized</div>
                            </div>
                        </GlassCard>
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
                                <ReputationBar label="Platform Standing" score={Math.round(user.trustScore)} />
                            </div>
                        </GlassCard>

                        {/* Rating Breakdown */}
                        <GlassCard className="p-6">
                            <h3 className="font-semibold text-white mb-4">Rating Breakdown</h3>
                            {reviewBreakdown.totalReviews > 0 ? (
                                <div className="space-y-3">
                                    {[
                                        { label: 'Quality', value: reviewBreakdown.avgQuality },
                                        { label: 'Communication', value: reviewBreakdown.avgCommunication },
                                        { label: 'Timeliness', value: reviewBreakdown.avgTimeliness },
                                        { label: 'Professionalism', value: reviewBreakdown.avgProfessionalism },
                                        { label: 'Reliability', value: reviewBreakdown.avgReliability },
                                    ].map(dim => (
                                        <div key={dim.label}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-zinc-400">{dim.label}</span>
                                                <span className="text-white">{dim.value.toFixed(1)}/5</span>
                                            </div>
                                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-500 rounded-full"
                                                    style={{ width: `${(dim.value / 5) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="pt-2 text-center text-xs text-zinc-500">
                                        Based on {reviewBreakdown.totalReviews} review{reviewBreakdown.totalReviews > 1 ? 's' : ''}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-zinc-500 text-sm text-center py-2">No ratings yet</p>
                            )}
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
                                        <Star className="w-4 h-4" /> Avg Rating
                                    </span>
                                    <span className="text-white font-medium">
                                        {totalReviews > 0 ? `${avgRating.toFixed(1)}/5` : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" /> Hourly Rate
                                    </span>
                                    <span className="text-white font-medium">
                                        {getCurrencySymbol(profile.currency)}{profile.hourlyRate}/hr
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Availability
                                    </span>
                                    <span className="text-white font-medium capitalize">
                                        {profile.availability?.toLowerCase().replace('_', ' ')}
                                    </span>
                                </div>
                                {profile.weeklyHours && (
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500 flex items-center gap-2">
                                            <Clock className="w-4 h-4" /> Weekly Hours
                                        </span>
                                        <span className="text-white font-medium">{profile.weeklyHours}h/week</span>
                                    </div>
                                )}
                                {profile.experienceLevel && (
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" /> Experience
                                        </span>
                                        <span className="text-white font-medium capitalize">
                                            {profile.experienceLevel.toLowerCase()}
                                        </span>
                                    </div>
                                )}
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
                                    <span className={user.phone ? 'text-zinc-300' : 'text-zinc-500'}>Phone Number</span>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </>
    );
}
