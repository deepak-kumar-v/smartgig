import { notFound } from 'next/navigation';
import { getPortfolioById } from '@/actions/portfolio-actions';
import { GlassCard } from '@/components/ui/glass-card';
import Link from 'next/link';
import {
    ArrowLeft, ExternalLink, Github, CheckCircle, Clock,
    Award, Calendar
} from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PortfolioDetailPage({ params }: PageProps) {
    const { id } = await params;
    const item = await getPortfolioById(id);

    if (!item) {
        notFound();
    }

    const isVerified = item.status === 'VERIFIED';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back */}
            <Link
                href="/freelancer/portfolio"
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Portfolio
            </Link>

            {/* Thumbnail */}
            <GlassCard className="overflow-hidden">
                <div className="aspect-video bg-zinc-800 relative">
                    {item.thumbnailUrl && item.thumbnailUrl !== '/portfolio/placeholder.png' ? (
                        <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                            <Award className="w-16 h-16" />
                        </div>
                    )}

                    {/* Status Badge */}
                    <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm ${isVerified ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                        }`}>
                        {isVerified ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <Clock className="w-4 h-4 text-amber-400" />
                        )}
                        <span className={`text-sm font-medium ${isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {isVerified ? 'Verified' : 'Pending Review'}
                        </span>
                    </div>
                </div>
            </GlassCard>

            {/* Details */}
            <GlassCard className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <h1 className="text-2xl font-bold text-white">{item.title}</h1>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                </div>

                {/* Freelancer info */}
                {item.freelancer?.user && (
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-800">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold">
                            {item.freelancer.user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="text-white text-sm font-medium">{item.freelancer.user.name}</p>
                            <p className="text-zinc-500 text-xs">{item.freelancer.title}</p>
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="mb-6">
                    <h2 className="text-sm font-medium text-zinc-400 mb-2">Description</h2>
                    <p className="text-zinc-300 whitespace-pre-line leading-relaxed">{item.description}</p>
                </div>

                {/* Tech Stack */}
                {item.techStack.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-sm font-medium text-zinc-400 mb-3">Tech Stack</h2>
                        <div className="flex flex-wrap gap-2">
                            {item.techStack.map((tech, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1.5 rounded-lg text-sm bg-violet-500/10 text-violet-300 border border-violet-500/20"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Links */}
                {(item.projectUrl || item.githubUrl) && (
                    <div className="pt-6 border-t border-zinc-800">
                        <h2 className="text-sm font-medium text-zinc-400 mb-3">Links</h2>
                        <div className="flex flex-wrap gap-3">
                            {item.projectUrl && (
                                <a
                                    href={item.projectUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-colors text-sm"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Live Demo
                                </a>
                            )}
                            {item.githubUrl && (
                                <a
                                    href={item.githubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
                                >
                                    <Github className="w-4 h-4" />
                                    Source Code
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
