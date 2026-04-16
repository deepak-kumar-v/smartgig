'use client';

import React, { useState, useTransition } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import {
    Plus, Image, Link as LinkIcon, Upload, FileCheck,
    CheckCircle, Clock, AlertCircle, ExternalLink, Edit2,
    Trash2, Eye, Award, Star, X, Github
} from 'lucide-react';
import { createPortfolioItem, updatePortfolioItem, deletePortfolioItem } from '@/actions/portfolio-actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types (matches DB shape)
// ---------------------------------------------------------------------------

interface PortfolioItemData {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    projectUrl: string | null;
    githubUrl: string | null;
    techStack: string[];
    status: string;
    createdAt: Date;
}

// ---------------------------------------------------------------------------
// Portfolio Card
// ---------------------------------------------------------------------------

function PortfolioCard({
    item,
    onEdit,
    onDelete,
}: {
    item: PortfolioItemData;
    onEdit: (item: PortfolioItemData) => void;
    onDelete: (id: string) => void;
}) {
    const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
        VERIFIED: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Verified' },
        PENDING: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Pending Review' },
    };

    const status = statusConfig[item.status] || statusConfig['PENDING'];
    const StatusIcon = status.icon;

    return (
        <GlassCard className="overflow-hidden group">
            {/* Image */}
            <div className="aspect-video bg-zinc-800 relative">
                {item.thumbnailUrl && item.thumbnailUrl !== '/portfolio/placeholder.png' ? (
                    <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                        <Image className="w-12 h-12" />
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Link href={`/freelancer/portfolio/${item.id}`} className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                        <Eye className="w-5 h-5" />
                    </Link>
                    <button onClick={() => onEdit(item)} className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                        <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => onDelete(item.id)} className="p-2 rounded-lg bg-white/10 text-rose-400 hover:bg-rose-500/20 transition-colors">
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

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1.5">
                    {item.techStack.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-300 rounded">
                            {skill}
                        </span>
                    ))}
                    {item.techStack.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-zinc-500">
                            +{item.techStack.length - 3}
                        </span>
                    )}
                </div>

                {/* Verified Badge */}
                {item.status === 'VERIFIED' && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
                        <Award className="w-3.5 h-3.5 text-violet-400" />
                        Verified
                    </div>
                )}
            </div>
        </GlassCard>
    );
}

// ---------------------------------------------------------------------------
// Add/Edit Portfolio Modal
// ---------------------------------------------------------------------------

function PortfolioModal({
    onClose,
    editItem,
}: {
    onClose: () => void;
    editItem?: PortfolioItemData | null;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');

    const [title, setTitle] = useState(editItem?.title || '');
    const [description, setDescription] = useState(editItem?.description || '');
    const [projectUrl, setProjectUrl] = useState(editItem?.projectUrl || '');
    const [githubUrl, setGithubUrl] = useState(editItem?.githubUrl || '');
    const [thumbnailUrl, setThumbnailUrl] = useState(editItem?.thumbnailUrl || '');
    const [techStack, setTechStack] = useState<string[]>(editItem?.techStack || []);
    const [skillInput, setSkillInput] = useState('');

    const addSkill = () => {
        if (skillInput && !techStack.includes(skillInput)) {
            setTechStack([...techStack, skillInput]);
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        setTechStack(techStack.filter(s => s !== skill));
    };

    const handleSubmit = () => {
        setError('');
        startTransition(async () => {
            const payload = {
                title,
                description,
                thumbnailUrl: thumbnailUrl || '/portfolio/placeholder.png',
                projectUrl: projectUrl || undefined,
                githubUrl: githubUrl || undefined,
                techStack,
            };

            const result = editItem
                ? await updatePortfolioItem(editItem.id, payload)
                : await createPortfolioItem(payload);

            if (result.success) {
                router.refresh();
                onClose();
            } else {
                setError(result.error || 'Failed to save.');
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <GlassCard className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">
                        {editItem ? 'Edit Work Sample' : 'Add Work Sample'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-5">
                    {/* Thumbnail URL */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Thumbnail URL
                        </label>
                        <input
                            type="url"
                            value={thumbnailUrl}
                            onChange={(e) => setThumbnailUrl(e.target.value)}
                            placeholder="https://example.com/screenshot.png"
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
                        />
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

                    {/* GitHub URL */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            GitHub URL (Optional)
                        </label>
                        <div className="relative">
                            <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="url"
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                                placeholder="https://github.com/user/repo"
                                className="w-full pl-11 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
                            />
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Tech Stack / Skills *
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
                            {techStack.map((skill, idx) => (
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
                        <GlassButton
                            variant="primary"
                            className="flex-1"
                            onClick={handleSubmit}
                            disabled={isPending}
                        >
                            {isPending ? 'Saving...' : editItem ? 'Update' : 'Submit for Review'}
                        </GlassButton>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Page Component (Client Wrapper)
// ---------------------------------------------------------------------------

export function PortfolioClient({ initialPortfolio }: { initialPortfolio: PortfolioItemData[] }) {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<PortfolioItemData | null>(null);
    const [isPending, startTransition] = useTransition();

    const portfolio = initialPortfolio;
    const verifiedCount = portfolio.filter(p => p.status === 'VERIFIED').length;
    const pendingCount = portfolio.filter(p => p.status === 'PENDING').length;

    const handleEdit = (item: PortfolioItemData) => {
        setEditItem(item);
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        if (!confirm('Are you sure you want to delete this work sample?')) return;
        startTransition(async () => {
            await deletePortfolioItem(id);
            router.refresh();
        });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditItem(null);
    };

    return (
        <>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Portfolio & Work Samples</h1>
                        <p className="text-zinc-400">
                            Showcase your skills with verified work samples
                        </p>
                    </div>
                    <GlassButton variant="primary" onClick={() => { setEditItem(null); setShowModal(true); }}>
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
                            <PortfolioCard
                                key={item.id}
                                item={item}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
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
                        <GlassButton variant="primary" onClick={() => { setEditItem(null); setShowModal(true); }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Sample
                        </GlassButton>
                    </GlassCard>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <PortfolioModal
                    onClose={handleCloseModal}
                    editItem={editItem}
                />
            )}
        </>
    );
}
