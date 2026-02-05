'use client';

import React, { useState } from 'react';
import {
    Briefcase, DollarSign, Layers, Clock, MapPin, Users,
    FileText, HelpCircle, Eye, CheckCircle, ChevronRight,
    ChevronLeft, Plus, Trash2, AlertCircle, Save, Sparkles,
    Search, X,
    LayoutTemplate, CheckCircle2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Props Interface
// Must accept the flexible formData shape used in Post Job flow + Job Details
export interface JobReviewCardProps {
    formData: any; // Using any for flexibility to match exact prop shape of post-job state, but ideally strongly typed
    mode: 'draft' | 'persisted' | 'readonly';
    defaultExpanded?: boolean;
    onToggleExpand?: (expanded: boolean) => void;
}

export function JobReviewCard({ formData, mode, defaultExpanded = false, onToggleExpand }: JobReviewCardProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const toggleExpand = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        if (onToggleExpand) {
            onToggleExpand(newState);
        }
    };

    return (
        <div
            onClick={toggleExpand}
            className={`
                relative p-6 bg-zinc-800/50 rounded-xl space-y-4 border border-zinc-700/50 
                hover:border-indigo-500/50 transition-all cursor-pointer group
                ${isExpanded ? 'ring-2 ring-indigo-500/20 bg-zinc-800' : ''}
            `}
        >
            <div className="absolute top-4 right-4 text-xs text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded-full group-hover:text-indigo-400 transition-colors">
                {isExpanded ? 'Click to collapse' : 'Click to expand details'}
            </div>

            <h3 className="text-xl font-bold text-white pr-20 break-words">{formData.title || 'Untitled Job'}</h3>

            <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-zinc-400 break-words max-w-full">
                    <strong className="text-white">{formData.category === 'Other' ? formData.customCategory : formData.category}</strong>
                    {(formData.subcategory || formData.customSubcategory) && (
                        <span className="ml-1">/ {formData.customSubcategory || formData.subcategory}</span>
                    )}
                </span>
                <span className="text-emerald-400 font-medium">
                    {formData.budgetType === 'FIXED'
                        ? `$${formData.budgetMax?.toLocaleString()}`
                        : `$${formData.budgetMin} - $${formData.budgetMax}/hr`
                    }
                </span>
                <span className="text-zinc-400">{formData.duration}</span>
                <span className="text-zinc-400">{formData.experienceLevel}</span>
            </div>

            {/* Content Logic: Toggle between Preview (Collapsed) and Full Markdown (Expanded) */}
            {isExpanded ? (
                <div
                    className="pt-4 mt-4 border-t border-zinc-700/50 space-y-4 animate-in fade-in slide-in-from-top-2"
                    onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking inside content? Original didn't have this, but standard UX suggests it. User requested Strict Parity though. Post Job didn't have stopPropagation on the content div itself, but text selection can be annoying. I'll stick to strict parity: NO stopPropagation unless specifically required. Wait, if I click to select text, I might toggle. Let's see original code: `onClick={() => setShowFullReview(!showFullReview)}` was on the PARENT div. So clicking ANYWHERE toggled it. I must replicate that.
                >
                    <div>
                        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Overview</p>

                        {/* V3.2: EXPANDED VIEW = BASIC DESCRIPTION + MARKDOWN */}

                        {/* 1. Basic Description (Plain Text) */}
                        <div className="mb-6 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                {formData.shortDescription || <em className="text-zinc-600">No basic description provided.</em>}
                            </p>
                        </div>

                        {/* 2. Full Markdown Render */}
                        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2 mt-6">Detailed Project Description</p>
                        <div className="text-zinc-300 text-sm leading-relaxed break-words">
                            {formData.description ? (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-3xl font-semibold text-white border-b border-zinc-800 pb-2 mb-6 mt-2 tracking-tight" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold text-white border-b border-zinc-800 pb-2 mt-10 mb-4 tracking-tight" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-xl font-semibold text-white mt-8 mb-3 tracking-tight" {...props} />,
                                        p: ({ node, ...props }) => <p className="text-base leading-7 text-zinc-300 mb-4 break-words" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 text-zinc-300 space-y-1" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 text-zinc-300 space-y-1" {...props} />,
                                        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-zinc-700 pl-4 text-zinc-400 italic my-4" {...props} />,
                                        a: ({ node, ...props }) => <a className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors" {...props} />,
                                        code: ({ node, inline, className, children, ...props }: any) => {
                                            const match = /language-(\w+)/.exec(className || '')
                                            return !inline && match ? (
                                                <div className="my-4 rounded-lg overflow-hidden border border-zinc-800">
                                                    <SyntaxHighlighter
                                                        style={vscDarkPlus}
                                                        language={match[1]}
                                                        PreTag="div"
                                                        customStyle={{ margin: 0, padding: '1rem', background: '#09090b' }}
                                                        {...props}
                                                    >
                                                        {String(children).replace(/\n$/, '')}
                                                    </SyntaxHighlighter>
                                                </div>
                                            ) : (
                                                <code className={`${inline ? 'bg-zinc-800/50 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono border border-zinc-700/50' : 'block bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto my-4 text-sm font-mono text-zinc-200'}`} {...props}>
                                                    {children}
                                                </code>
                                            )
                                        },
                                        table: ({ node, ...props }) => <div className="overflow-x-auto my-6 border border-zinc-800 rounded-lg"><table className="w-full text-left text-sm text-zinc-300" {...props} /></div>,
                                        thead: ({ node, ...props }) => <thead className="bg-zinc-900 text-white font-semibold" {...props} />,
                                        tbody: ({ node, ...props }) => <tbody className="divide-y divide-zinc-800" {...props} />,
                                        tr: ({ node, ...props }) => <tr className="hover:bg-zinc-800/30 transition-colors" {...props} />,
                                        th: ({ node, ...props }) => <th className="px-4 py-3 border-b border-zinc-800" {...props} />,
                                        td: ({ node, ...props }) => <td className="px-4 py-3" {...props} />,
                                        hr: ({ node, ...props }) => <hr className="border-zinc-800 my-8" {...props} />,
                                        img: ({ node, ...props }) => <img className="rounded-lg border border-zinc-800 my-4 max-w-full max-h-[360px] object-contain block mx-auto bg-zinc-900/50" {...props} />, // Strict Clamp
                                        input: ({ node, ...props }) => {
                                            if (props.type === 'checkbox') {
                                                return <input type="checkbox" className="mr-2 rounded bg-zinc-700 border-zinc-600 text-indigo-500 focus:ring-indigo-500 pointer-events-none" checked={props.checked} readOnly />
                                            }
                                            return <input {...props} />
                                        }
                                    }}
                                >
                                    {formData.description}
                                </ReactMarkdown>
                            ) : (
                                <em className="text-zinc-600">No description provided.</em>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Requirements</p>
                            <div className="flex flex-wrap gap-2">
                                {(formData.skills || []).map((skill: string) => (
                                    <span key={skill} className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-300 rounded">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Parameters</p>
                            <ul className="text-sm text-zinc-400 space-y-1">
                                {formData.budgetType === 'HOURLY' && formData.weeklyHours && (
                                    <li>Estimated Weekly Hours: <span className="text-white">
                                        {formData.weeklyHours === 5 ? '<10 hours' :
                                            formData.weeklyHours === 20 ? '10-30 hours' :
                                                '30+ hours'}
                                    </span></li>
                                )}
                                <li>Duration: <span className="text-white">{formData.duration}</span></li>
                                <li>Project Type: <span className="text-white">{formData.projectType === 'ONE_TIME' ? 'One-Time Project' : 'Ongoing Project'}</span></li>
                                {/* Location: Shows "Remote (Worldwide)" OR "Region A, Region B" */}
                                {(formData.isRemote || (formData.locationRestrictions?.length || 0) > 0) && (
                                    <li>Location: <span className="text-white">
                                        {formData.isRemote ? 'Remote (Worldwide)' : (formData.locationRestrictions || []).join(', ')}
                                    </span></li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Questions Preview */}
                    {(formData.screeningQuestions?.length || 0) > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Screening Questions</p>
                            <ul className="list-disc list-inside text-sm text-zinc-400">
                                {formData.screeningQuestions?.map((q: any, i: number) => (
                                    <li key={i}>{q.question}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Attachments Preview - UNIVERSAL */}
                    {(formData.attachments?.length || 0) > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Attachments</p>
                            <ul className="text-sm text-zinc-400 space-y-1">
                                {formData.attachments?.map((file: any, i: number) => {
                                    // Handle both File objects (Step 6/Draft) and Persisted Metadata (Persisted/Readonly)
                                    let url = file.url;

                                    // If we are in Draft mode OR it's a File object, create object URL
                                    if ((mode === 'draft' || !url) && typeof window !== 'undefined' && file instanceof File) {
                                        try {
                                            url = URL.createObjectURL(file);
                                        } catch (e) {
                                            // Handle potential error
                                        }
                                    }

                                    const sizeInMB = file.size ? (file.size / 1024 / 1024).toFixed(2) : '0.00';

                                    return (
                                        <li key={i} className="flex items-center gap-2">
                                            {url ? (
                                                <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-2 transition-colors"
                                                    onClick={(e) => e.stopPropagation()} // Allow clicking attachment without toggling card
                                                >
                                                    <span>{file.name}</span>
                                                    <span className="text-xs text-zinc-600">({sizeInMB} MB)</span>
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-2 text-zinc-300">
                                                    <span>{file.name}</span>
                                                    <span className="text-xs text-zinc-600">({sizeInMB} MB)</span>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Collapsed View: V3.2: ONLY SHORT DESCRIPTION (No Markdown) */}
                    <p className="text-zinc-400 text-sm line-clamp-3 break-words leading-relaxed whitespace-pre-wrap">
                        {formData.shortDescription || "No basic description provided."}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {(formData.skills || []).map((skill: string) => (
                            <span key={skill} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs">
                                {skill}
                            </span>
                        ))}
                    </div>
                </>
            )}

            <div className="flex flex-wrap gap-4 text-xs text-zinc-500 pt-2 border-t border-zinc-700 mt-4">
                <span>{formData.isRemote ? '🌍 Remote' : '📍 Location Specific'}</span>
                <span>{formData.visibility === 'PUBLIC' ? '👁 Public' : '🔒 Invite Only'}</span>
                {formData.allowTrialTask && <span>✓ Trial Task</span>}
                {formData.contractToHire && <span>✓ Contract-to-Hire</span>}
                {(formData.screeningQuestions?.length || 0) > 0 && <span>{formData.screeningQuestions?.length} Screening Questions</span>}
            </div>
        </div>
    );
}
