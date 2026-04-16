import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { Navbar } from '@/components/global/navbar';
import { Footer } from '@/components/global/footer';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import {
    MapPin, Clock, Star, CheckCircle, Shield,
    Briefcase, GraduationCap, Award, MessageSquare,
    DollarSign, Calendar, TrendingUp, Users, ExternalLink,
    Globe
} from 'lucide-react';
import { getCurrencySymbol } from '@/lib/currency';

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

export default async function PublicFreelancerProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // Fetch the freelancer profile by its ID
    const profile = await db.freelancerProfile.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    trustScore: true,
                    isVerified: true,
                    emailVerified: true,
                    phone: true,
                    createdAt: true,
                },
            },
            skills: true,
            portfolio: true,
            reviews: true,
            contracts: {
                where: { status: 'COMPLETED' },
                select: { id: true },
            },
        },
    });

    // If no profile found, also try by userId
    const resolvedProfile = profile || await db.freelancerProfile.findUnique({
        where: { userId: id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    trustScore: true,
                    isVerified: true,
                    emailVerified: true,
                    phone: true,
                    createdAt: true,
                },
            },
            skills: true,
            portfolio: true,
            reviews: true,
            contracts: {
                where: { status: 'COMPLETED' },
                select: { id: true },
            },
        },
    });

    if (!resolvedProfile || !resolvedProfile.user) {
        notFound();
    }

    const user = resolvedProfile.user;
    const skills = resolvedProfile.skills || [];
    const portfolioItems = resolvedProfile.portfolio || [];
    const reviews = resolvedProfile.reviews || [];
    const completedJobs = resolvedProfile.contracts?.length || 0;

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-6xl mx-auto">
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
                                                <img src={user.image} alt={user.name || 'Freelancer'} className="w-full h-full object-cover" />
                                            ) : (
                                                (user.name?.charAt(0) || 'U')
                                            )}
                                        </div>
                                        {resolvedProfile.availability === 'AVAILABLE' && (
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
                                        <p className="text-zinc-400 mb-4">{resolvedProfile.title}</p>

                                        <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                                            {(resolvedProfile.city || resolvedProfile.country) && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {[resolvedProfile.city, resolvedProfile.country].filter(Boolean).join(', ')}
                                                </span>
                                            )}
                                            {resolvedProfile.timezone && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" /> {resolvedProfile.timezone}
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

                            {/* Bio */}
                            {resolvedProfile.bio && (
                                <GlassCard className="p-6">
                                    <h2 className="text-lg font-semibold text-white mb-4">About</h2>
                                    <p className="text-zinc-400 whitespace-pre-line leading-relaxed">{resolvedProfile.bio}</p>
                                </GlassCard>
                            )}

                            {/* Professional Details */}
                            {(resolvedProfile.education || resolvedProfile.experienceYears != null || resolvedProfile.experienceSummary || (resolvedProfile.languages && resolvedProfile.languages.length > 0)) && (
                                <GlassCard className="p-6">
                                    <h2 className="text-lg font-semibold text-white mb-4">Professional Details</h2>
                                    <div className="space-y-4">
                                        {resolvedProfile.education && (
                                            <div className="flex items-start gap-3">
                                                <GraduationCap className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm text-zinc-500">Education</p>
                                                    <p className="text-white">{resolvedProfile.education}</p>
                                                </div>
                                            </div>
                                        )}
                                        {resolvedProfile.experienceYears != null && (
                                            <div className="flex items-start gap-3">
                                                <Briefcase className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm text-zinc-500">Experience</p>
                                                    <p className="text-white">{resolvedProfile.experienceYears} {resolvedProfile.experienceYears === 1 ? 'year' : 'years'} experience</p>
                                                </div>
                                            </div>
                                        )}
                                        {resolvedProfile.experienceSummary && (
                                            <div className="flex items-start gap-3">
                                                <TrendingUp className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm text-zinc-500">Experience Summary</p>
                                                    <p className="text-zinc-400 whitespace-pre-line leading-relaxed">{resolvedProfile.experienceSummary}</p>
                                                </div>
                                            </div>
                                        )}
                                        {resolvedProfile.languages && resolvedProfile.languages.length > 0 && (
                                            <div className="flex items-start gap-3">
                                                <Globe className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm text-zinc-500 mb-2">Languages</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {resolvedProfile.languages.map((lang: string) => (
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
                            {skills.length > 0 && (
                                <GlassCard className="p-6">
                                    <h2 className="text-lg font-semibold text-white mb-4">Skills</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((skill) => (
                                            <div
                                                key={skill.id}
                                                className="px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                            >
                                                {skill.name}
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            )}

                            {/* Portfolio */}
                            {portfolioItems.length > 0 && (
                                <GlassCard className="p-6">
                                    <h2 className="text-lg font-semibold text-white mb-4">Portfolio</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {portfolioItems.map((item) => (
                                            <div key={item.id} className="p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors">
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
                                                    {item.projectUrl && (
                                                        <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-violet-400 transition-colors flex-shrink-0 ml-2">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            )}

                            {/* Reviews */}
                            {reviews.length > 0 && (
                                <GlassCard className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-lg font-semibold text-white">Work History & Reviews</h2>
                                        <span className="text-sm text-zinc-500">{totalReviews} reviews</span>
                                    </div>
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
                                </GlassCard>
                            )}
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="space-y-6">
                            {/* Hire Card */}
                            <GlassCard className="p-6">
                                <div className="text-center mb-6">
                                    <p className="text-3xl font-bold text-white">
                                        {getCurrencySymbol(resolvedProfile.currency)}{resolvedProfile.hourlyRate}
                                    </p>
                                    <p className="text-zinc-500 text-sm">per hour</p>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <GlassButton variant="primary" className="w-full">
                                        <MessageSquare className="w-4 h-4 mr-2" /> Contact
                                    </GlassButton>
                                    <GlassButton variant="secondary" className="w-full">
                                        Invite to Job
                                    </GlassButton>
                                </div>

                                {resolvedProfile.availability === 'AVAILABLE' && resolvedProfile.weeklyHours && (
                                    <div className="flex items-center gap-2 text-sm text-emerald-400 justify-center">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                        Available now • {resolvedProfile.weeklyHours}h/week
                                    </div>
                                )}
                                {resolvedProfile.availability === 'BUSY' && (
                                    <div className="flex items-center gap-2 text-sm text-amber-400 justify-center">
                                        <div className="w-2 h-2 bg-amber-400 rounded-full" />
                                        Currently Busy
                                    </div>
                                )}
                                {resolvedProfile.availability === 'NOT_AVAILABLE' && (
                                    <div className="flex items-center gap-2 text-sm text-zinc-500 justify-center">
                                        <div className="w-2 h-2 bg-zinc-500 rounded-full" />
                                        Not Available
                                    </div>
                                )}
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
                                    {totalReviews > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500 flex items-center gap-2">
                                                <Star className="w-4 h-4" /> Avg Rating
                                            </span>
                                            <span className="text-white font-medium">{avgRating.toFixed(1)}/5</span>
                                        </div>
                                    )}
                                    {resolvedProfile.experienceLevel && (
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500 flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4" /> Experience
                                            </span>
                                            <span className="text-white font-medium capitalize">
                                                {resolvedProfile.experienceLevel.toLowerCase()}
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
            </main>

            <Footer />
        </div>
    );
}
