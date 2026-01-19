'use client';

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import {
    Plus, Image, Link as LinkIcon, Upload, FileCheck,
    CheckCircle, Clock, AlertCircle, ExternalLink, Edit2,
    Trash2, Eye, Award, Star, X
} from 'lucide-react';

interface PortfolioItem {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    projectUrl?: string;
    skills: string[];
    status: 'pending' | 'verified' | 'rejected';
    verifiedAt?: Date;
}

// Sample data - would come from database
const samplePortfolio: PortfolioItem[] = [
    {
        id: '1',
        title: 'E-Commerce Dashboard',
        description: 'A modern admin dashboard for an e-commerce platform built with Next.js, featuring real-time analytics, order management, and inventory tracking.',
        imageUrl: '/portfolio/dashboard.png',
        projectUrl: 'https://example.com/dashboard',
        skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
        status: 'verified',
        verifiedAt: new Date('2024-01-15')
    },
    {
        id: '2',
        title: 'Mobile Banking App UI',
        description: 'Complete UI/UX design for a mobile banking application with dark mode support and accessibility features.',
        imageUrl: '/portfolio/banking.png',
        skills: ['Figma', 'UI Design', 'Mobile Design'],
        status: 'pending'
    },
    {
        id: '3',
        title: 'AI Chatbot Integration',
        description: 'Full-stack implementation of an AI-powered customer service chatbot with natural language processing.',
        imageUrl: '/portfolio/chatbot.png',
        projectUrl: 'https://example.com/chatbot',
        skills: ['Python', 'OpenAI', 'Node.js', 'WebSocket'],
        status: 'verified',
        verifiedAt: new Date('2024-02-01')
    }
];

function PortfolioCard({ item }: { item: PortfolioItem }) {
    const statusConfig = {
        verified: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Verified' },
        pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Pending Review' },
        rejected: { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/20', label: 'Not Approved' }
    };

    const status = statusConfig[item.status];
    const StatusIcon = status.icon;

    return (
        <GlassCard className="overflow-hidden group">
            {/* Image */}
            <div className="aspect-video bg-zinc-800 relative">
                <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                    <Image className="w-12 h-12" />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                        <Eye className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                        <Edit2 className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg bg-white/10 text-rose-400 hover:bg-rose-500/20 transition-colors">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Status Badge */}
                <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg} backdrop-blur-sm`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                    <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    {item.projectUrl && (
                        <a
                            href={item.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-violet-400 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </div>

                <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{item.description}</p>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5">
                    {item.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-300 rounded">
                            {skill}
                        </span>
                    ))}
                    {item.skills.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-zinc-500">
                            +{item.skills.length - 3}
                        </span>
                    )}
                </div>

                {/* Verified Badge */}
                {item.status === 'verified' && item.verifiedAt && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
                        <Award className="w-3.5 h-3.5 text-violet-400" />
                        Verified on {item.verifiedAt.toLocaleDateString()}
                    </div>
                )}
            </div>
        </GlassCard>
    );
}

function AddPortfolioModal({ onClose }: { onClose: () => void }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [projectUrl, setProjectUrl] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');

    const addSkill = () => {
        if (skillInput && !skills.includes(skillInput)) {
            setSkills([...skills, skillInput]);
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        setSkills(skills.filter(s => s !== skill));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <GlassCard className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Add Work Sample</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-5">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Project Screenshot/Image *
                        </label>
                        <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-violet-500/50 transition-colors cursor-pointer">
                            <Upload className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                            <p className="text-sm text-zinc-400">
                                Drag and drop or <span className="text-violet-400">browse</span>
                            </p>
                            <p className="text-xs text-zinc-600 mt-1">PNG, JPG up to 5MB</p>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Project Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="E.g., E-Commerce Dashboard"
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Description *
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the project, your role, and the technologies used..."
                            rows={4}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 resize-none"
                        />
                    </div>

                    {/* Project URL */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Live Project URL (Optional)
                        </label>
                        <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="url"
                                value={projectUrl}
                                onChange={(e) => setProjectUrl(e.target.value)}
                                placeholder="https://example.com/project"
                                className="w-full pl-11 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
                            />
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Skills Demonstrated *
                        </label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                placeholder="Add a skill (press Enter)"
                                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 text-sm"
                            />
                            <button
                                onClick={addSkill}
                                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors text-sm"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 text-violet-400 rounded-lg text-sm"
                                >
                                    {skill}
                                    <button
                                        onClick={() => removeSkill(skill)}
                                        className="hover:text-white"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Verification Note */}
                    <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <div className="flex items-start gap-3">
                            <FileCheck className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-violet-400 mb-1">Skill Validation</h4>
                                <p className="text-sm text-zinc-400">
                                    Your work sample will be reviewed by our team. Verified samples
                                    receive a badge and boost your profile visibility.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <GlassButton variant="secondary" className="flex-1" onClick={onClose}>
                            Cancel
                        </GlassButton>
                        <GlassButton variant="primary" className="flex-1">
                            Submit for Review
                        </GlassButton>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}

export default function PortfolioPage() {
    const [showAddModal, setShowAddModal] = useState(false);
    const portfolio = samplePortfolio;

    const verifiedCount = portfolio.filter(p => p.status === 'verified').length;
    const pendingCount = portfolio.filter(p => p.status === 'pending').length;

    return (
        <DashboardShell role="freelancer">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Portfolio & Work Samples</h1>
                        <p className="text-zinc-400">
                            Showcase your skills with verified work samples
                        </p>
                    </div>
                    <GlassButton variant="primary" onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Work Sample
                    </GlassButton>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-violet-500/20">
                                <Image className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{portfolio.length}</div>
                                <div className="text-xs text-zinc-500">Total Samples</div>
                            </div>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/20">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{verifiedCount}</div>
                                <div className="text-xs text-zinc-500">Verified</div>
                            </div>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/20">
                                <Clock className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{pendingCount}</div>
                                <div className="text-xs text-zinc-500">Pending Review</div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Info Banner */}
                <GlassCard className="p-5 border-violet-500/20 bg-violet-500/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-violet-500/20">
                            <FileCheck className="w-6 h-6 text-violet-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-white mb-1">Why Skill Validation Matters</h3>
                            <p className="text-sm text-zinc-400">
                                Verified work samples prove your abilities beyond profile claims.
                                Freelancers with verified portfolios get <span className="text-violet-400 font-medium">3x more job invitations</span> on average.
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* Portfolio Grid */}
                {portfolio.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {portfolio.map((item) => (
                            <PortfolioCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <GlassCard className="p-12 text-center">
                        <Image className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No Work Samples Yet</h3>
                        <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                            Add your best work to showcase your skills and get verified.
                            Clients trust freelancers with verified portfolios.
                        </p>
                        <GlassButton variant="primary" onClick={() => setShowAddModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Sample
                        </GlassButton>
                    </GlassCard>
                )}
            </div>

            {/* Add Portfolio Modal */}
            {showAddModal && <AddPortfolioModal onClose={() => setShowAddModal(false)} />}
        </DashboardShell>
    );
}
