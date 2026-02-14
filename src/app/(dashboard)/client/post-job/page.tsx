
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { FileUpload } from '@/components/ui/file-upload';
import { skillsList } from '@/lib/mock-data';
import type { JobPostFormData } from '@/lib/types';
import {
    Briefcase, DollarSign, Layers, Clock, MapPin, Users,
    FileText, HelpCircle, Eye, CheckCircle, ChevronRight,
    ChevronLeft, Plus, Trash2, AlertCircle, Save, Sparkles,
    Search, X,
    LayoutTemplate, CheckCircle2 // Added from V3
} from 'lucide-react';
import { toast } from 'sonner';
import { createJobPostV2 } from '@/actions/job-actions-v2';
import { uploadJobAttachment } from '@/actions/upload-actions';

// --- MARKDOWN IMPORTS (FROM V3) ---
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { JobReviewCard } from '@/components/job/job-review-card';

// -----------------------------------------------------------------------------
// V3.1 - HYBRID EXPERIMENT - V2 STRUCTURE + V3 MARKDOWN - NO DB
// -----------------------------------------------------------------------------
// This file is ISOLATED using UI logic from V2 and V3.
// -----------------------------------------------------------------------------

// --- V3 MARKDOWN EDITOR COMPONENT (COPIED EXACTLY) ---

type Tab = 'write' | 'preview';

interface MarkdownEditorProps {
    value: string;
    onChange: (val: string) => void;
}

function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
    const [tab, setTab] = useState<Tab>('write');

    return (
        <div className="flex flex-col rounded-xl border border-zinc-700/50 bg-zinc-900/50 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-b border-zinc-700/50">
                <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-lg">
                    <button
                        type="button" // Explicit type to prevent form submission
                        onClick={() => setTab('write')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${tab === 'write'
                            ? 'bg-indigo-500/20 text-indigo-300 shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                            }`}
                    >
                        Write
                    </button>
                    <button
                        type="button" // Explicit type
                        onClick={() => setTab('preview')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${tab === 'preview'
                            ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                            }`}
                    >
                        <span className="flex items-center gap-1.5">
                            <Eye className="w-3 h-3" /> Preview
                        </span>
                    </button>
                </div>

                <div className="hidden md:flex gap-1 text-zinc-400">
                    <div className="text-[10px] uppercase font-bold tracking-wider px-2 py-1">Markdown Supported</div>
                </div>
            </div>

            {/* Editor Area */}
            <div className="relative min-h-[400px]">
                {tab === 'write' ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-full min-h-[400px] p-6 bg-transparent text-sm text-zinc-200 font-mono resize-y focus:outline-none placeholder:text-zinc-600"
                        placeholder="# Project Title&#10;&#10;Describe your project requirements here...&#10;&#10;| Feature | Support |&#10;| :--- | :--- |&#10;| Tables | Yes |&#10;&#10;- [ ] Task 1&#10;- [x] Task 2&#10;&#10;```javascript&#10;console.log('Hello');&#10;```"
                    />
                ) : (
                    <div className="w-full h-full min-h-[400px] p-8 overflow-y-auto bg-zinc-950/30">
                        {value ? (
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
                                {value}
                            </ReactMarkdown>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-600 opacity-50">
                                <LayoutTemplate className="w-12 h-12 mb-3" />
                                <p>Nothing to preview yet</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="bg-zinc-900 px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-500 flex justify-between items-center">
                <span className="hidden sm:inline-block opacity-75">
                    Tip: Tables require a header separator row (<code>|---|</code>) to render.
                </span>
                <div className="flex gap-4 ml-auto">
                    <span>{value.length} characters</span>
                    <span>{value.split(/\s+/).filter(Boolean).length} words</span>
                </div>
            </div>
        </div>
    );
}

// --- V2 ISOLATED CONSTANTS (COPIED EXACTLY) ---

const EXTENDED_CATEGORIES = [
    {
        id: 'cat-dev',
        name: 'Development & IT',
        subcategories: ['Web Development', 'Mobile App Development', 'Software Architecture', 'DevOps & Cloud', 'Data Science & AI', 'Game Development', 'Cybersecurity', 'QA & Testing', 'Scripts & Utilities']
    },
    {
        id: 'cat-design',
        name: 'Design & Creative',
        subcategories: ['Brand Identity', 'Logo Design', 'Web Design', 'App Design (UI/UX)', 'Illustration', 'Video Production', 'Animation', 'Photography', 'Graphic Design']
    },
    {
        id: 'cat-writing',
        name: 'Writing & Translation',
        subcategories: ['Content Writing', 'Copywriting', 'Technical Writing', 'Creative Writing', 'Proofreading & Editing', 'Translation', 'Localization']
    },
    {
        id: 'cat-admin',
        name: 'Admin & Customer Support',
        subcategories: ['Virtual Assistance', 'Data Entry', 'Customer Support', 'Project Management', 'Market Research', 'Transcription']
    },
    {
        id: 'cat-sales',
        name: 'Sales & Marketing',
        subcategories: ['SEO', 'Social Media Marketing', 'Email Marketing', 'Lead Generation', 'Telemarketing', 'Strategy & Planning']
    },
    {
        id: 'cat-other',
        name: 'Other',
        subcategories: ['Other']
    }
];

const DEFAULT_SCREENING_QUESTIONS = [
    "Describe your recent experience with similar projects.",
    "What is your preferred communication style?",
    "Are you available to start immediately?",
    "Do you have a link to your portfolio?",
    "What specific tools/stack would you use for this?"
];

// --- REGIONS CONSTANT (COPIED EXACTLY) ---
const REGIONS = [
    "North America", "South America", "Europe", "Africa", "Asia", "Oceania", "Middle East"
];

// --- COMPONENTS (COPIED EXACTLY) ---

function StepIndicator({ steps, currentStep, onStepClick }: { steps: { title: string; icon: React.ElementType }[]; currentStep: number; onStepClick?: (index: number) => void }) {
    return (
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
            {steps.map((step, index) => (
                <React.Fragment key={step.title}>
                    <div
                        className="flex flex-col items-center min-w-[80px]"
                        onClick={() => onStepClick?.(index)}
                    >
                        <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${index < currentStep
                                ? 'bg-emerald-500 text-white'
                                : index === currentStep
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-zinc-800 text-zinc-500'
                                }`}
                        >
                            {index < currentStep ? <CheckCircle className="w-6 h-6" /> : <step.icon className="w-5 h-5" />}
                        </div>
                        <span className={`text-xs mt-2 text-center ${index <= currentStep ? 'text-white' : 'text-zinc-500'
                            }`}>
                            {step.title}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 min-w-[20px] ${index < currentStep ? 'bg-emerald-500' : 'bg-zinc-800'
                            }`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

function SkillTagInput({ skills, onChange }: { skills: string[]; onChange: (skills: string[]) => void }) {
    const [input, setInput] = useState('');

    const addSkill = (skill: string) => {
        if (skill && !skills.includes(skill)) {
            onChange([...skills, skill]);
        }
        setInput('');
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addSkill(input.trim());
                        }
                    }}
                    placeholder="Type a skill and press Enter"
                    list="all-skills"
                    className="flex-1 bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
                />
                <GlassButton type="button" variant="secondary" onClick={() => addSkill(input.trim())}>
                    <Plus className="w-4 h-4" />
                </GlassButton>
            </div>
            <datalist id="all-skills">
                {skillsList.map((s) => <option key={s} value={s} />)}
            </datalist>
            <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                    <span
                        key={skill}
                        className="px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-sm flex items-center gap-2"
                    >
                        {skill}
                        <button
                            type="button"
                            onClick={() => onChange(skills.filter(s => s !== skill))}
                            className="hover:text-rose-400"
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
}

type ScreeningQuestion = {
    question: string;
    type: 'text' | 'yesno' | 'choice';
    options?: string[];
    required: boolean;
};

function ScreeningQuestionBuilder({
    questions,
    onChange
}: {
    questions: ScreeningQuestion[];
    onChange: (questions: ScreeningQuestion[]) => void;
}) {
    const addDefaultQuestion = (qText: string) => {
        if (!questions.some(q => q.question === qText)) {
            onChange([...questions, { question: qText, type: 'text', required: true }]);
        }
    };

    const addQuestion = () => {
        onChange([...questions, { question: '', type: 'text', required: true }]);
    };

    const updateQuestion = (index: number, field: string, value: unknown) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const removeQuestion = (index: number) => {
        onChange(questions.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6">
            <div className="space-y-3 p-4 bg-zinc-800/30 rounded-xl border border-dashed border-zinc-700">
                <p className="text-sm font-medium text-zinc-400">Add Recommended Questions:</p>
                <div className="flex flex-wrap gap-2">
                    {DEFAULT_SCREENING_QUESTIONS.map(q => (
                        <button
                            key={q}
                            type="button"
                            onClick={() => addDefaultQuestion(q)}
                            disabled={questions.some(existing => existing.question === q)}
                            className="text-xs px-3 py-1.5 rounded-full bg-zinc-700/50 hover:bg-zinc-700 text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            + {q}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {questions.map((q, index) => (
                    <div key={index} className="p-4 bg-zinc-800/50 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={q.question}
                                    onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                                    placeholder="Enter your question..."
                                    className="w-full bg-transparent text-white border-none focus:outline-none placeholder:text-zinc-600"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeQuestion(index)}
                                className="text-zinc-500 hover:text-rose-400"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-4">
                            <select
                                value={q.type}
                                onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                                className="bg-zinc-700 text-white text-sm rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="text">Text Answer</option>
                                <option value="yesno">Yes/No</option>
                                <option value="choice">Multiple Choice</option>
                            </select>
                            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                                    className="rounded bg-zinc-700 text-indigo-500 focus:ring-indigo-500"
                                />
                                Required
                            </label>
                        </div>
                        {q.type === 'choice' && (
                            <input
                                type="text"
                                value={q.options?.join(', ') || ''}
                                onChange={(e) => updateQuestion(index, 'options', e.target.value.split(',').map(o => o.trim()))}
                                placeholder="Option 1, Option 2, Option 3 (comma separated)"
                                className="w-full bg-zinc-700 text-white text-sm rounded px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500/50"
                            />
                        )}
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addQuestion}
                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1"
                >
                    <Plus className="w-4 h-4" /> Create Custom Question
                </button>
            </div>
        </div>
    );
}

// --- MAIN PAGE COMPONENT ---

export default function PostJobV32Page() { // Renamed component
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [maxCompletedStep, setMaxCompletedStep] = useState(0);
    const [draftSaved, setDraftSaved] = useState(false);
    const [showFullReview, setShowFullReview] = useState(false);

    // No prefetch needed for experiment

    const steps = [
        { title: 'Basic Info', icon: FileText },
        { title: 'Skills', icon: Layers },
        { title: 'Budget', icon: DollarSign },
        { title: 'Timeline', icon: Clock },
        { title: 'Screening', icon: HelpCircle },
        { title: 'Review', icon: Eye },
    ];

    interface ExtendedJobPostFormData extends Partial<JobPostFormData> {
        customCategory?: string;
        customSubcategory?: string;
        shortDescription?: string; // V3.2
    }

    const [formData, setFormData] = useState<ExtendedJobPostFormData>({
        title: '',
        category: '',
        subcategory: '',
        customCategory: '',
        description: '',
        shortDescription: '', // V3.2 - Basic Description
        attachments: [],
        skills: [],
        experienceLevel: 'INTERMEDIATE',
        budgetType: 'FIXED',
        budgetMin: 0,
        budgetMax: 0,
        projectType: 'ONE_TIME',
        duration: '1-3 months',
        weeklyHours: undefined,
        isRemote: true,
        locationRestrictions: [],
        visibility: 'PUBLIC',
        allowTrialTask: false,
        contractToHire: false,
        screeningQuestions: [],
    });

    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [isSubcategoryCustom, setIsSubcategoryCustom] = useState(false);

    const updateField = (field: string, value: unknown) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        if (currentStep === 4) {
            const cleanQuestions = (formData.screeningQuestions || []).filter(q => q.question.trim().length > 0);
            if (cleanQuestions.length !== (formData.screeningQuestions || []).length) {
                updateField('screeningQuestions', cleanQuestions);
            }
        }

        if (validateStep(currentStep)) {
            const next = Math.min(currentStep + 1, steps.length - 1);
            setCurrentStep(next);
            setMaxCompletedStep(prev => Math.max(prev, next));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            toast.error("Please fill in all required fields to proceed");
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const saveDraft = () => {
        setDraftSaved(true);
        toast.success('Draft saved successfully');
        setTimeout(() => setDraftSaved(false), 3000);
    };

    const handleSubmit = async () => {
        setError(null);
        startTransition(async () => {
            try {
                const submitData = new FormData();
                submitData.append('title', formData.title || '');

                // Core Content (V3.2 - No legacy fallback)
                submitData.append('overview', formData.shortDescription || '');
                submitData.append('descriptionMd', formData.description || '');

                // Budget
                submitData.append('budget', (formData.budgetMax || 0).toString());
                submitData.append('budgetMin', (formData.budgetMin || 0).toString());
                submitData.append('budgetType', formData.budgetType || 'FIXED');

                // Category logic - always send customSubcategory if provided (Issue 2 fix)
                if (formData.category === 'Other') {
                    submitData.append('categoryName', formData.customCategory || 'Other');
                } else {
                    submitData.append('categoryName', formData.category || '');
                }
                // Send BOTH subcategory and customSubcategory - server will use priority logic
                submitData.append('subcategory', formData.subcategory || '');
                submitData.append('customSubcategory', formData.customSubcategory || '');

                submitData.append('skills', (formData.skills || []).join(','));

                // V2 Fields
                submitData.append('experienceLevel', formData.experienceLevel || '');
                submitData.append('duration', formData.duration || '');
                submitData.append('projectType', formData.projectType || 'ONE_TIME');
                submitData.append('isRemote', formData.isRemote ? 'true' : 'false');

                // V3.2 Fields (PREVIOUSLY MISSING)
                submitData.append('allowTrialTask', formData.allowTrialTask ? 'true' : 'false');
                submitData.append('contractToHire', formData.contractToHire ? 'true' : 'false');
                submitData.append('weeklyHours', (formData.weeklyHours || 0).toString());
                submitData.append('visibility', formData.visibility || 'PUBLIC');

                if (formData.locationRestrictions && formData.locationRestrictions.length > 0) {
                    submitData.append('regions', formData.locationRestrictions.join(','));
                }

                if (formData.screeningQuestions && formData.screeningQuestions.length > 0) {
                    submitData.append('screenQuestions', JSON.stringify(formData.screeningQuestions));
                }

                // FIXED: Upload attachments and serialize metadata + URL
                if (formData.attachments && formData.attachments.length > 0) {
                    const uploadPromises = formData.attachments.map(async (file: File) => {
                        const uploadData = new FormData();
                        uploadData.append('file', file);
                        const result = await uploadJobAttachment(uploadData);

                        if (result.error || !result.url) {
                            throw new Error(`Failed to upload ${file.name}: ${result.error}`);
                        }

                        return {
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            url: result.url
                        };
                    });

                    try {
                        const uploadedAttachments = await Promise.all(uploadPromises);
                        submitData.append('attachments', JSON.stringify(uploadedAttachments));
                    } catch (uploadError) {
                        toast.error('Failed to upload attachments. Please try again.');
                        console.error(uploadError);
                        setError('Failed to upload attachments');
                        return; // Stop submission
                    }
                }

                const result = await createJobPostV2(submitData);

                if (result.error) {
                    let errorMsg = 'Failed to post job';
                    if (typeof result.error === 'string') errorMsg = result.error;
                    else if (typeof result.error === 'object') errorMsg = Object.values(result.error).flat().join(', ');
                    toast.error(errorMsg);
                    setError(errorMsg);
                } else {
                    toast.success('Job posted successfully!');
                    router.push('/client/dashboard');
                }
            } catch (err) {
                toast.error('An unexpected error occurred');
                console.error(err);
            }
        });
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 0:
                const isTitleValid = !!(formData.title && formData.title.length >= 10);
                // Description can be shorter in MD, but let's keep strictness.
                const isDescValid = !!(formData.description && formData.description.length >= 100);
                // V3.2 Correction: Validate Basic Description length
                const isShortDescValid = !!(formData.shortDescription && formData.shortDescription.length <= 300);
                const isCatValid = !!formData.category;
                const isCustomCatValid = formData.category === 'Other' ? !!formData.customCategory : true;
                return isTitleValid && isDescValid && isShortDescValid && isCatValid && isCustomCatValid;
            case 1:
                return !!(formData.skills && formData.skills.length >= 1);
            case 2:
                if (formData.budgetType === 'FIXED') {
                    return !!(formData.budgetMax && formData.budgetMax > 0);
                } else {
                    return !!(formData.budgetMin && formData.budgetMax && formData.budgetMax > formData.budgetMin);
                }
            case 3:
                return !!(formData.duration);
            default:
                return true;
        }
    };

    return (
        <DashboardShell role="client">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-white">Post a New Job</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">V3.2 PROTOTYPE</span>
                        </div>
                        <p className="text-zinc-400">Describe your project to find the perfect talent</p>
                    </div>
                    {draftSaved && (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                            <CheckCircle className="w-4 h-4" /> Draft saved
                        </div>
                    )}
                </div>

                <StepIndicator
                    steps={steps}
                    currentStep={currentStep}
                    onStepClick={(index) => {
                        if (index <= maxCompletedStep) {
                            setCurrentStep(index);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }}
                />

                <GlassCard className="p-6 transition-all duration-300">

                    {/* Step 1: Basic Info (ENHANCED WITH MARKDOWN) */}
                    {currentStep === 0 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-indigo-500/20">
                                    <FileText className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                                    <p className="text-sm text-zinc-500">Let's start with the basics.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">Category *</label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => {
                                            setSelectedCategory(e.target.value);
                                            updateField('category', e.target.value);
                                            updateField('subcategory', '');
                                            setIsSubcategoryCustom(false);
                                        }}
                                        className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                                    >
                                        <option value="">Select category</option>
                                        {EXTENDED_CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedCategory !== 'Other' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-white text-sm font-medium">Subcategory</label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newState = !isSubcategoryCustom;
                                                    setIsSubcategoryCustom(newState);
                                                    if (newState) {
                                                        updateField('subcategory', '');
                                                    } else {
                                                        updateField('customSubcategory', '');
                                                    }
                                                }}
                                                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                            >
                                                {isSubcategoryCustom ? 'Select from list' : "Can't find your subcategory?"}
                                            </button>
                                        </div>

                                        {isSubcategoryCustom ? (
                                            <GlassInput
                                                value={formData.customSubcategory || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('customSubcategory', e.target.value)}
                                                placeholder="e.g. Specialized Framework"
                                            />
                                        ) : (
                                            <select
                                                value={formData.subcategory || ''}
                                                onChange={(e) => updateField('subcategory', e.target.value)}
                                                disabled={!selectedCategory}
                                                className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors"
                                            >
                                                <option value="">Select subcategory</option>
                                                {EXTENDED_CATEGORIES.find(c => c.name === selectedCategory)?.subcategories.map(sub => (
                                                    <option key={sub} value={sub}>{sub}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}
                            </div>

                            {selectedCategory === 'Other' && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="space-y-2">
                                        <label className="text-white text-sm font-medium">Custom Category Name *</label>
                                        <GlassInput
                                            value={formData.customCategory || ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('customCategory', e.target.value)}
                                            placeholder="e.g. AI Prompt Engineering"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-white text-sm font-medium">Custom Subcategory</label>
                                        <GlassInput
                                            value={formData.customSubcategory || ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('customSubcategory', e.target.value)}
                                            placeholder="e.g. Midjourney Styles"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Job Title *</label>
                                <GlassInput
                                    value={formData.title || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('title', e.target.value)}
                                    placeholder="e.g., Senior React Developer for E-Commerce Platform"
                                />
                                <div className="flex justify-between text-xs text-zinc-500">
                                    <span>{(formData.title || '').length}/100 max</span>
                                    <span className={(formData.title || '').length >= 10 ? 'text-emerald-400' : 'text-zinc-500'}>
                                        {(formData.title || '').length < 10 ? 'Min 10 chars required' : '✓ Length ok'}
                                    </span>
                                </div>
                            </div>

                            {/* Step 1: Basic Info (ENHANCED WITH MARKDOWN) */}
                            {/* V3.2: BASIC DESCRIPTION (PLAIN TEXT, SHOWN IN PREVIEW) */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Overview *</label>
                                <textarea
                                    value={formData.shortDescription || ''}
                                    onChange={(e) => updateField('shortDescription', e.target.value.slice(0, 300))}
                                    maxLength={300}
                                    placeholder="Brief summary of the project (shown in collapsed preview)..."
                                    rows={3}
                                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 resize-none header-font"
                                />
                                <div className="flex justify-between text-xs text-zinc-500">
                                    <span>Shown in collapsed review preview</span>
                                    <span className={(formData.shortDescription || '').length >= 50 ? 'text-emerald-400' : 'text-zinc-500'}>
                                        {(formData.shortDescription || '').length}/300 chars
                                    </span>
                                </div>
                            </div>

                            {/* REPLACED DESCRIPTION WITH MARKDOWN EDITOR */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Project Description (Markdown) *</label>
                                <MarkdownEditor
                                    value={formData.description || ''}
                                    onChange={(val) => updateField('description', val)}
                                />
                                <div className="flex justify-end text-xs text-zinc-500">
                                    <span className={(formData.description || '').length >= 100 ? 'text-emerald-400' : 'text-amber-400'}>
                                        Min 100 characters required
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Attachments (Optional)</label>
                                <FileUpload
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
                                    maxSize={10}
                                    maxFiles={5}
                                    initialFiles={formData.attachments}
                                    onFilesSelected={(files) => updateField('attachments', files)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Skills (IDENTICAL) */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-cyan-500/20">
                                    <Layers className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Skills & Requirements</h2>
                                    <p className="text-sm text-zinc-500">What expertise do you need?</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Required Skills *</label>
                                <SkillTagInput
                                    skills={formData.skills || []}
                                    onChange={(skills) => updateField('skills', skills)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Experience Level *</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'ENTRY', label: 'Entry Level', desc: 'New to the field', rate: '$15-30/hr' },
                                        { value: 'INTERMEDIATE', label: 'Intermediate', desc: '3-5 years exp', rate: '$30-60/hr' },
                                        { value: 'EXPERT', label: 'Expert', desc: '6+ years exp', rate: '$60-150/hr' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => updateField('experienceLevel', option.value)}
                                            className={`p-4 rounded-xl border text-left transition-all ${formData.experienceLevel === option.value
                                                ? 'border-indigo-500 bg-indigo-500/10'
                                                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                                }`}
                                        >
                                            <span className="text-white font-medium block">{option.label}</span>
                                            <span className="text-zinc-500 text-xs block">{option.desc}</span>
                                            <span className="text-indigo-400 text-xs block mt-1">{option.rate}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Budget (IDENTICAL) */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-emerald-500/20">
                                    <DollarSign className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Budget</h2>
                                    <p className="text-sm text-zinc-500">Set your budget parameters</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Budget Type *</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { value: 'FIXED', label: 'Fixed Price', desc: 'One-time payment' },
                                        { value: 'HOURLY', label: 'Hourly Rate', desc: 'Pay as you go' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                                updateField('budgetType', option.value);
                                                updateField('budgetMin', 0);
                                                updateField('budgetMax', 0);
                                            }}
                                            className={`p-4 rounded-xl border text-left transition-all ${formData.budgetType === option.value
                                                ? 'border-indigo-500 bg-indigo-500/10'
                                                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                                }`}
                                        >
                                            <span className="text-white font-medium block">{option.label}</span>
                                            <span className="text-zinc-500 text-xs">{option.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formData.budgetType === 'FIXED' ? (
                                <div className="space-y-2 animate-in fade-in duration-200">
                                    <label className="text-white text-sm font-medium">Maximum Budget ($) *</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                                        <input
                                            type="number"
                                            value={formData.budgetMax || ''}
                                            onChange={(e) => updateField('budgetMax', parseInt(e.target.value))}
                                            placeholder="e.g. 500.00"
                                            className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <p className="text-zinc-500 text-xs">Total amount you are willing to spend.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                                    <div className="space-y-2">
                                        <label className="text-white text-sm font-medium">Min Rate ($/hr) *</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                                            <input
                                                type="number"
                                                value={formData.budgetMin || ''}
                                                onChange={(e) => updateField('budgetMin', parseInt(e.target.value))}
                                                className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-white text-sm font-medium">Max Rate ($/hr) *</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                                            <input
                                                type="number"
                                                value={formData.budgetMax || ''}
                                                onChange={(e) => updateField('budgetMax', parseInt(e.target.value))}
                                                className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    {(formData.budgetMin ?? 0) > 0 && (formData.budgetMax ?? 0) > 0 && (formData.budgetMin ?? 0) > (formData.budgetMax ?? 0) && (
                                        <p className="col-span-2 text-xs text-amber-400 font-medium animate-in fade-in slide-in-from-top-1">
                                            ⚠️ Minimum rate cannot be higher than maximum rate
                                        </p>
                                    )}
                                </div>
                            )}

                            {formData.budgetType === 'HOURLY' && (
                                <div className="space-y-2 pt-4 border-t border-zinc-800">
                                    <label className="text-white text-sm font-medium">Estimated Weekly Hours (Optional)</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { label: '<10', value: 5 },
                                            { label: '10-30', value: 20 },
                                            { label: '30+', value: 40 }
                                        ].map((opt) => (
                                            <button
                                                key={opt.label}
                                                type="button"
                                                onClick={() => updateField('weeklyHours', opt.value)}
                                                className={`py-2 px-3 rounded-lg text-sm transition-all ${formData.weeklyHours === opt.value
                                                    ? 'bg-indigo-500 text-white'
                                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                    }`}
                                            >
                                                {opt.label} Hours
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Timeline (Reuse v1 logic) */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-violet-500/20">
                                    <Clock className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Timeline & Scope</h2>
                                    <p className="text-sm text-zinc-500">Project duration and requirements</p>
                                </div>
                            </div>

                            {/* Project Type */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Project Type *</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { value: 'ONE_TIME', label: 'One-Time Project', desc: 'Specific scope' },
                                        { value: 'ONGOING', label: 'Ongoing Work', desc: 'Long-term role' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => updateField('projectType', option.value)}
                                            className={`p-4 rounded-xl border text-left transition-all ${formData.projectType === option.value
                                                ? 'border-indigo-500 bg-indigo-500/10'
                                                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                                }`}
                                        >
                                            <span className="text-white font-medium block">{option.label}</span>
                                            <span className="text-zinc-500 text-xs">{option.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Expected Duration *</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['<1 month', '1-3 months', '3-6 months', '6+ months'].map((dur) => (
                                        <button
                                            key={dur}
                                            type="button"
                                            onClick={() => updateField('duration', dur)}
                                            className={`py-3 px-3 rounded-lg text-sm transition-all ${formData.duration === dur
                                                ? 'bg-indigo-500 text-white'
                                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                }`}
                                        >
                                            {dur}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Location (Improved) */}
                            <div className="space-y-4 pt-4 border-t border-zinc-800">
                                <label className="text-white text-sm font-medium">Location Requirement</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`flex items-center gap-3 cursor-pointer p-3 border rounded-xl transition-all ${formData.isRemote ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 bg-zinc-800/50'
                                        }`}>
                                        <input
                                            type="radio"
                                            checked={formData.isRemote === true}
                                            onChange={() => updateField('isRemote', true)}
                                            className="text-indigo-500"
                                        />
                                        <div>
                                            <span className="text-white font-medium block">Remote (Worldwide)</span>
                                            <span className="text-zinc-500 text-xs">Access global talent pool</span>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-3 cursor-pointer p-3 border rounded-xl transition-all ${!formData.isRemote ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 bg-zinc-800/50'
                                        }`}>
                                        <input
                                            type="radio"
                                            checked={formData.isRemote === false}
                                            onChange={() => updateField('isRemote', false)}
                                            className="text-indigo-500"
                                        />
                                        <div>
                                            <span className="text-white font-medium block">Specific Regions</span>
                                            <span className="text-zinc-500 text-xs">Select target locations</span>
                                        </div>
                                    </label>
                                </div>

                                {/* Region Selector */}
                                {!formData.isRemote && (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                        <p className="text-xs text-zinc-400 mb-2">Select allowed regions:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {REGIONS.map(region => (
                                                <button
                                                    key={region}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = formData.locationRestrictions || [];
                                                        const updated = current.includes(region)
                                                            ? current.filter(r => r !== region)
                                                            : [...current, region];
                                                        updateField('locationRestrictions', updated);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${(formData.locationRestrictions || []).includes(region)
                                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                                                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                                                        }`}
                                                >
                                                    {region}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Additional Options (Premium UI) */}
                            <div className="space-y-4 pt-6 mt-6 border-t border-zinc-800">
                                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Strategic Options</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Trial Task Option */}
                                    <div
                                        onClick={() => updateField('allowTrialTask', !formData.allowTrialTask)}
                                        className={`group relative p-4 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${formData.allowTrialTask
                                            ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                                            : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/80'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-lg transition-colors ${formData.allowTrialTask ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'}`}>
                                                <Sparkles className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className={`font-semibold mb-1 transition-colors ${formData.allowTrialTask ? 'text-white' : 'text-zinc-300'}`}>
                                                    Paid Trial Task
                                                </h4>
                                                <p className="text-xs text-zinc-500 leading-relaxed">
                                                    Evaluate skills with a small, paid test project before committing.
                                                </p>
                                            </div>
                                        </div>
                                        {/* Premium active indicator */}
                                        {formData.allowTrialTask && (
                                            <div className="absolute top-2 right-2 text-indigo-400">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Contract-to-Hire Option */}
                                    <div
                                        onClick={() => updateField('contractToHire', !formData.contractToHire)}
                                        className={`group relative p-4 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${formData.contractToHire
                                            ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                            : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/80'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-lg transition-colors ${formData.contractToHire ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'}`}>
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className={`font-semibold mb-1 transition-colors ${formData.contractToHire ? 'text-white' : 'text-zinc-300'}`}>
                                                    Contract-to-Hire
                                                </h4>
                                                <p className="text-xs text-zinc-500 leading-relaxed">
                                                    Start with a freelance contract with intent to hire full-time.
                                                </p>
                                            </div>
                                        </div>
                                        {/* Premium active indicator */}
                                        {formData.contractToHire && (
                                            <div className="absolute top-2 right-2 text-emerald-400">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Screening (Enhanced with Defaults) */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-amber-500/20">
                                    <HelpCircle className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Screening Questions</h2>
                                    <p className="text-sm text-zinc-500">Filter for the best candidates</p>
                                </div>
                            </div>

                            <ScreeningQuestionBuilder
                                questions={formData.screeningQuestions || []}
                                onChange={(q) => updateField('screeningQuestions', q)}
                            />

                            <div className="space-y-2 pt-4 border-t border-zinc-800">
                                <label className="text-white text-sm font-medium">Job Visibility</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { value: 'PUBLIC', label: 'Public', desc: 'Anyone can view and apply' },
                                        { value: 'INVITE_ONLY', label: 'Invite Only', desc: 'Only invited freelancers can apply' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => updateField('visibility', option.value)}
                                            className={`p-4 rounded-xl border text-left transition-all ${formData.visibility === option.value
                                                ? 'border-indigo-500 bg-indigo-500/10'
                                                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                                }`}
                                        >
                                            <span className="text-white font-medium block">{option.label}</span>
                                            <span className="text-zinc-500 text-xs">{option.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Review (Expandable - STRICT V2 PARITY + MARKDOWN) */}
                    {currentStep === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-emerald-500/20">
                                    <Eye className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Review & Publish</h2>
                                    <p className="text-sm text-zinc-500">Double check everything.</p>
                                </div>
                            </div>

                            {/* Clickable Review Card (Strict v2 Parity) */}
                            <JobReviewCard
                                mode="draft"
                                formData={formData}
                                defaultExpanded={showFullReview}
                                onToggleExpand={setShowFullReview}
                            />


                        </div>
                    )}

                    {/* Unified Footer Nav (Fixed Layout for All Steps) */}
                    <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-center">
                        <GlassButton
                            variant="secondary"
                            disabled={currentStep === 0}
                            onClick={prevStep}
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" /> {currentStep === 5 ? 'Back to Edit' : 'Back'}
                        </GlassButton>

                        <div className="flex gap-3">
                            <GlassButton
                                variant="ghost"
                                onClick={saveDraft}
                            >
                                <Save className="w-4 h-4 mr-2" /> Save Draft
                            </GlassButton>

                            {currentStep === 5 ? (
                                <GlassButton
                                    variant="primary"
                                    onClick={handleSubmit}
                                    disabled={isPending}
                                    className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 border-none"
                                >
                                    {isPending ? 'Publishing...' : 'Publish Job Post'}
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </GlassButton>
                            ) : (
                                <GlassButton
                                    variant="primary"
                                    onClick={nextStep}
                                >
                                    Next Step <ChevronRight className="w-4 h-4 ml-2" />
                                </GlassButton>
                            )}
                        </div>
                    </div>

                </GlassCard>
            </div>
        </DashboardShell>
    );
}
