'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import Link from 'next/link';
import {
    MapPin, Globe, Clock, Star, CheckCircle, Shield,
    Briefcase, GraduationCap, Award, MessageSquare,
    DollarSign, Calendar, TrendingUp, Users, ExternalLink
} from 'lucide-react';

// Mock profile data - in real app would come from API
const profile = {
    id: 'fp-1',
    user: {
        name: 'David Kim',
        displayName: 'David K.',
        image: null,
        trustScore: 98,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: 'VERIFIED',
    },
    headline: 'Senior Full-Stack Developer | React & Node.js Expert',
    bio: `With over 8 years of experience in web development, I specialize in building scalable applications using modern technologies. I've worked with Fortune 500 companies and fast-growing startups alike, delivering high-quality solutions on time and within budget.

My expertise includes React, Next.js, Node.js, TypeScript, and cloud services (AWS, GCP). I'm passionate about clean code, performance optimization, and creating exceptional user experiences.`,
    hourlyRate: 85,
    currency: 'USD',
    country: 'United States',
    city: 'San Francisco',
    timezone: 'America/Los_Angeles',
    availability: 'AVAILABLE',
    weeklyHours: 40,
    skills: [
        { name: 'React', proficiency: 'EXPERT', yearsOfExperience: 6, isVerified: true },
        { name: 'TypeScript', proficiency: 'EXPERT', yearsOfExperience: 5, isVerified: true },
        { name: 'Node.js', proficiency: 'EXPERT', yearsOfExperience: 7, isVerified: true },
        { name: 'Next.js', proficiency: 'ADVANCED', yearsOfExperience: 4, isVerified: true },
        { name: 'PostgreSQL', proficiency: 'ADVANCED', yearsOfExperience: 5, isVerified: false },
        { name: 'AWS', proficiency: 'INTERMEDIATE', yearsOfExperience: 3, isVerified: false },
    ],
    categories: ['Web Development', 'Mobile Development', 'API Development'],
    languages: [
        { name: 'English', level: 'NATIVE' },
        { name: 'Korean', level: 'FLUENT' },
    ],
    education: [
        { institution: 'Stanford University', degree: 'Master of Science', fieldOfStudy: 'Computer Science', endYear: 2016 },
        { institution: 'UC Berkeley', degree: 'Bachelor of Science', fieldOfStudy: 'Computer Science', endYear: 2014 },
    ],
    certifications: [
        { name: 'AWS Solutions Architect', issuingOrganization: 'Amazon Web Services', isVerified: true },
    ],
    portfolio: [
        { title: 'E-Commerce Platform', description: 'Built a complete e-commerce solution', category: 'Web Development', isVerified: true },
        { title: 'SaaS Dashboard', description: 'Analytics dashboard with real-time data visualization', category: 'Web Development', isVerified: true },
    ],
    socialLinks: [
        { platform: 'github', url: 'https://github.com/davidkim' },
        { platform: 'linkedin', url: 'https://linkedin.com/in/davidkim' },
    ],
    totalEarnings: 285000,
    completedJobs: 47,
    ongoingJobs: 2,
    successRate: 98,
    responseTime: 2,
    reputation: {
        overallScore: 98,
        totalReviews: 45,
        qualityScore: 99,
        communicationScore: 97,
        timelinessScore: 96,
        cooperationScore: 98,
    },
    memberSince: '2024',
};

const reviews = [
    {
        id: 1,
        reviewer: 'Sarah C.',
        company: 'TechCorp Solutions',
        rating: 5,
        title: 'Exceptional developer!',
        content: 'David exceeded all expectations. His code was clean, well-documented, and delivered ahead of schedule.',
        date: 'Dec 2024',
        project: 'E-Commerce Redesign',
    },
    {
        id: 2,
        reviewer: 'Emily W.',
        company: 'Startup.io',
        rating: 5,
        title: 'Best freelancer I\'ve worked with',
        content: 'The project was complex but David handled it with professionalism. Would definitely work with him again.',
        date: 'Nov 2024',
        project: 'API Integration',
    },
];

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

export default function FreelancerProfilePage() {
    return (
        <DashboardShell role="freelancer">
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
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-4xl font-bold text-white">
                                        DK
                                    </div>
                                    {profile.availability === 'AVAILABLE' && (
                                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-zinc-900" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-2xl font-bold text-white">{profile.user.name}</h1>
                                        {profile.user.identityVerified === 'VERIFIED' && (
                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 rounded text-xs text-emerald-400">
                                                <Shield className="w-3 h-3" /> Verified
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-zinc-400 mb-4">{profile.headline}</p>

                                    <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" /> {profile.city}, {profile.country}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" /> {profile.timezone.replace('America/', '')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" /> Member since {profile.memberSince}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-6 mt-4">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                            <span className="text-white font-bold">{profile.reputation.overallScore}%</span>
                                            <span className="text-zinc-500 text-sm">({profile.reputation.totalReviews} reviews)</span>
                                        </div>
                                        <div className="text-sm text-zinc-500">
                                            <span className="text-emerald-400 font-medium">{profile.successRate}%</span> success rate
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Bio */}
                        <GlassCard className="p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">About</h2>
                            <p className="text-zinc-400 whitespace-pre-line leading-relaxed">{profile.bio}</p>
                        </GlassCard>

                        {/* Skills */}
                        <GlassCard className="p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Skills</h2>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill) => (
                                    <div
                                        key={skill.name}
                                        className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 ${skill.isVerified
                                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                            }`}
                                    >
                                        {skill.name}
                                        {skill.isVerified && <CheckCircle className="w-3 h-3" />}
                                        <span className="text-xs opacity-60">{skill.yearsOfExperience}y</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Portfolio */}
                        <GlassCard className="p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Portfolio</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profile.portfolio.map((item, index) => (
                                    <div key={index} className="p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer">
                                        <div className="aspect-video bg-zinc-700 rounded-lg mb-3 flex items-center justify-center">
                                            <Briefcase className="w-8 h-8 text-zinc-500" />
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-medium text-white">{item.title}</h3>
                                                <p className="text-sm text-zinc-500">{item.description}</p>
                                            </div>
                                            {item.isVerified && (
                                                <span className="text-xs text-emerald-400">Verified</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Work History / Reviews */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-white">Work History & Reviews</h2>
                                <span className="text-sm text-zinc-500">{reviews.length} reviews</span>
                            </div>
                            <div className="space-y-6">
                                {reviews.map((review) => (
                                    <div key={review.id} className="pb-6 border-b border-zinc-800 last:border-0">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-medium text-white">{review.project}</h3>
                                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                                    <span>{review.reviewer}</span>
                                                    <span>•</span>
                                                    <span>{review.company}</span>
                                                </div>
                                            </div>
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
                                        <p className="text-white font-medium text-sm mb-1">&quot;{review.title}&quot;</p>
                                        <p className="text-zinc-400 text-sm">{review.content}</p>
                                        <p className="text-zinc-600 text-xs mt-2">{review.date}</p>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Education & Certifications */}
                        <GlassCard className="p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Education & Certifications</h2>

                            <div className="space-y-4 mb-6">
                                <h3 className="text-sm text-zinc-500 font-medium uppercase tracking-wide">Education</h3>
                                {profile.education.map((edu, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-violet-500/20">
                                            <GraduationCap className="w-4 h-4 text-violet-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{edu.degree} in {edu.fieldOfStudy}</p>
                                            <p className="text-zinc-500 text-sm">{edu.institution} • {edu.endYear}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm text-zinc-500 font-medium uppercase tracking-wide">Certifications</h3>
                                {profile.certifications.map((cert, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-amber-500/20">
                                            <Award className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-white font-medium">{cert.name}</p>
                                                {cert.isVerified && (
                                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                )}
                                            </div>
                                            <p className="text-zinc-500 text-sm">{cert.issuingOrganization}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                    {profile.user.trustScore}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <ReputationBar label="Quality" score={profile.reputation.qualityScore} />
                                <ReputationBar label="Communication" score={profile.reputation.communicationScore} />
                                <ReputationBar label="Timeliness" score={profile.reputation.timelinessScore} />
                                <ReputationBar label="Cooperation" score={profile.reputation.cooperationScore} />
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
                                    <span className="text-white font-medium">{profile.completedJobs}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> Success Rate
                                    </span>
                                    <span className="text-emerald-400 font-medium">{profile.successRate}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" /> Total Earned
                                    </span>
                                    <span className="text-white font-medium">${(profile.totalEarnings / 1000).toFixed(0)}k+</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Avg Response
                                    </span>
                                    <span className="text-white font-medium">{profile.responseTime}h</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Ongoing Jobs
                                    </span>
                                    <span className="text-white font-medium">{profile.ongoingJobs}</span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Verification Badges */}
                        <GlassCard className="p-6">
                            <h3 className="font-semibold text-white mb-4">Verifications</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    <span className="text-zinc-300">Identity Verified</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    <span className="text-zinc-300">Email Verified</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    <span className="text-zinc-300">Phone Verified</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    <span className="text-zinc-300">Payment Verified</span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Languages */}
                        <GlassCard className="p-6">
                            <h3 className="font-semibold text-white mb-4">Languages</h3>
                            <div className="space-y-2">
                                {profile.languages.map((lang, index) => (
                                    <div key={index} className="flex justify-between">
                                        <span className="text-zinc-300">{lang.name}</span>
                                        <span className="text-zinc-500 text-sm">{lang.level}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Social Links */}
                        <GlassCard className="p-6">
                            <h3 className="font-semibold text-white mb-4">Links</h3>
                            <div className="space-y-2">
                                {profile.socialLinks.map((link, index) => (
                                    <a
                                        key={index}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <span className="text-zinc-300 capitalize">{link.platform}</span>
                                        <ExternalLink className="w-4 h-4 text-zinc-500" />
                                    </a>
                                ))}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
