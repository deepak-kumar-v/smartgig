'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassTextarea } from '@/components/ui/glass-textarea';
import { GlassButton } from '@/components/ui/glass-button';
import { FileUpload } from '@/components/ui/file-upload';
import { updateJobPost } from '@/actions/job-actions-v2';
import { jobCategories, skillsList } from '@/lib/mock-data';
import type { JobPostFormData } from '@/lib/types';
import {
    Briefcase, DollarSign, Layers, Clock, MapPin, Users,
    FileText, HelpCircle, Eye, CheckCircle, ChevronRight,
    ChevronLeft, Plus, Trash2, AlertCircle, Save, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

// Step indicator component
function StepIndicator({ steps, currentStep }: { steps: { title: string; icon: React.ElementType }[]; currentStep: number }) {
    return (
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
            {steps.map((step, index) => (
                <React.Fragment key={step.title}>
                    <div className="flex flex-col items-center min-w-[80px]">
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

// Skill Tag Input
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

// Screening Question Builder
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
        <div className="space-y-4">
            {questions.map((q, index) => (
                <div key={index} className="p-4 bg-zinc-800/50 rounded-xl space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={q.question}
                                onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                                placeholder="Enter your question..."
                                className="w-full bg-transparent text-white border-none focus:outline-none"
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
                            className="bg-zinc-700 text-white text-sm rounded px-3 py-1.5"
                        >
                            <option value="text">Text Answer</option>
                            <option value="yesno">Yes/No</option>
                            <option value="choice">Multiple Choice</option>
                        </select>
                        <label className="flex items-center gap-2 text-sm text-zinc-400">
                            <input
                                type="checkbox"
                                checked={q.required}
                                onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                                className="rounded bg-zinc-700"
                            />
                            Required
                        </label>
                    </div>
                    {q.type === 'choice' && (
                        <input
                            type="text"
                            value={q.options?.join(', ') || ''}
                            onChange={(e) => updateQuestion(index, 'options', e.target.value.split(',').map(o => o.trim()))}
                            placeholder="Option 1, Option 2, Option 3"
                            className="w-full bg-zinc-700 text-white text-sm rounded px-3 py-2"
                        />
                    )}
                </div>
            ))}
            <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
            >
                <Plus className="w-4 h-4" /> Add Screening Question
            </button>
        </div>
    );
}

interface EditJobFormProps {
    jobId: string;
    initialData: Partial<JobPostFormData>;
}

export default function EditJobForm({ jobId, initialData }: EditJobFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [draftSaved, setDraftSaved] = useState(false);

    // Prefetch job details for instant navigation
    useEffect(() => {
        router.prefetch(`/client/jobs/${jobId}`);
    }, [router, jobId]);

    const steps = [
        { title: 'Basic Info', icon: FileText },
        { title: 'Skills', icon: Layers },
        { title: 'Budget', icon: DollarSign },
        { title: 'Timeline', icon: Clock },
        { title: 'Screening', icon: HelpCircle },
        { title: 'Review', icon: Eye },
    ];

    // Form state
    const [formData, setFormData] = useState<Partial<JobPostFormData>>({
        title: '',
        category: '',
        subcategory: '',
        description: '',
        attachments: [],
        skills: [],
        experienceLevel: 'INTERMEDIATE',
        budgetType: 'FIXED',
        budgetMin: 1000,
        budgetMax: 5000,
        projectType: 'ONE_TIME',
        duration: '1-3 months',
        weeklyHours: undefined,
        isRemote: true,
        locationRestrictions: [],
        visibility: 'PUBLIC',
        allowTrialTask: false,
        contractToHire: false,
        screeningQuestions: [],
        ...initialData // Merge initial data
    });

    const [selectedCategory, setSelectedCategory] = useState<string>(initialData.category || '');

    const updateField = (field: string, value: unknown) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
        } else {
            toast.error("Please fill in all required fields to proceed");
        }
    };
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const saveDraft = () => {
        setDraftSaved(true);
        toast.success('Draft saved successfully');
        setTimeout(() => setDraftSaved(false), 3000);
    };

    const handleSubmit = async () => {
        setError(null);
        startTransition(async () => {
            // Create FormData for the action
            const fd = new FormData();
            fd.append('title', formData.title || '');
            fd.append('description', formData.description || '');
            fd.append('budget', String(formData.budgetMax || 0));
            fd.append('skills', (formData.skills || []).join(','));
            fd.append('categoryId', 'cat_general');

            // Use updateJobPost instead of createJobPost
            const res = await updateJobPost(jobId, fd);

            if (res?.error) {
                toast.error(typeof res.error === 'string' ? res.error : 'Failed to update job');
                setError(typeof res.error === 'string' ? res.error : 'Failed to update job');
            } else if (res?.success) {
                toast.success('Job updated successfully!');
                // Redirect after a brief delay so user sees the toast
                setTimeout(() => {
                    router.push(`/client/jobs/${jobId}`);
                }, 1000);
            }
        });
    };

    // Validation
    const validateStep = (step: number): boolean => {
        switch (step) {
            case 0:
                const isTitleValid = !!(formData.title && formData.title.length >= 10);
                const isDescValid = !!(formData.description && formData.description.length >= 100);
                // Allow category to be pre-filled so check if it exists
                const isCatValid = !!formData.category;
                return isTitleValid && isDescValid && isCatValid;
            case 1:
                return !!(formData.skills && formData.skills.length >= 1);
            case 2:
                // Relaxed budget validation to prevent getting stuck if types mismatch
                return !!(formData.budgetMax && formData.budgetMax > 0);
            case 3:
                return !!(formData.duration);
            default:
                return true;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Edit Job Post</h1>
                    <p className="text-zinc-400">Update your job details</p>
                </div>
                {draftSaved && (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <CheckCircle className="w-4 h-4" /> Draft saved
                    </div>
                )}
            </div>

            {/* Step Indicator */}
            <StepIndicator steps={steps} currentStep={currentStep} />

            {/* Form Content */}
            <GlassCard className="p-6">
                {/* Step 1: Basic Info */}
                {currentStep === 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-indigo-500/20">
                                <FileText className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                                <p className="text-sm text-zinc-500">Tell us about your project</p>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-white text-sm font-medium">Job Title *</label>
                            <GlassInput
                                value={formData.title || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('title', e.target.value)}
                                placeholder="e.g., Senior React Developer for E-Commerce Platform"
                            />
                            <p className="text-xs text-zinc-500">Be specific to attract the right candidates (Min 10 chars)</p>
                        </div>

                        {/* Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Category *</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        updateField('category', e.target.value);
                                    }}
                                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="">Select category</option>
                                    {jobCategories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Subcategory</label>
                                <select
                                    value={formData.subcategory || ''}
                                    onChange={(e) => updateField('subcategory', e.target.value)}
                                    disabled={!selectedCategory}
                                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                                >
                                    <option value="">Select subcategory</option>
                                    {jobCategories.find(c => c.name === selectedCategory)?.subcategories.map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-white text-sm font-medium">Project Description *</label>
                            <GlassTextarea
                                value={formData.description || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('description', e.target.value)}
                                placeholder={`Describe your project in detail...

Include:
• What you're building
• Key features and requirements
• Deliverables expected
• Any specific technologies to use`}
                                rows={8}
                            />
                            <div className="flex justify-between text-xs text-zinc-500">
                                <span>{(formData.description || '').length}/5000 characters</span>
                                <span className={(formData.description || '').length >= 100 ? 'text-emerald-400' : 'text-amber-400'}>
                                    Min 100 characters
                                </span>
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="space-y-2">
                            <label className="text-white text-sm font-medium">Attachments (Optional)</label>
                            <FileUpload
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
                                maxSize={10}
                                maxFiles={5}
                                onFilesSelected={(files) => updateField('attachments', [...(formData.attachments || []), ...files])}
                            />
                            <p className="text-zinc-500 text-xs">PDF, DOC, images up to 10MB each (max 5 files)</p>
                        </div>
                    </div>
                )}

                {/* Step 2: Skills & Requirements */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-cyan-500/20">
                                <Layers className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Skills & Requirements</h2>
                                <p className="text-sm text-zinc-500">What expertise do you need?</p>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="space-y-2">
                            <label className="text-white text-sm font-medium">Required Skills *</label>
                            <SkillTagInput
                                skills={formData.skills || []}
                                onChange={(skills) => updateField('skills', skills)}
                            />
                        </div>

                        {/* Experience Level */}
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

                {/* Step 3: Budget */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-emerald-500/20">
                                <DollarSign className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Budget</h2>
                                <p className="text-sm text-zinc-500">Set your budget for this project</p>
                            </div>
                        </div>

                        {/* Budget Type */}
                        <div className="space-y-2">
                            <label className="text-white text-sm font-medium">Budget Type *</label>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { value: 'FIXED', label: 'Fixed Price', desc: 'Pay a fixed amount for the entire project' },
                                    { value: 'HOURLY', label: 'Hourly Rate', desc: 'Pay by the hour as work progresses' },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => updateField('budgetType', option.value)}
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

                        {/* Budget Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">
                                    {formData.budgetType === 'HOURLY' ? 'Min Rate ($/hr)' : 'Min Budget ($)'} *
                                </label>
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
                                <label className="text-white text-sm font-medium">
                                    {formData.budgetType === 'HOURLY' ? 'Max Rate ($/hr)' : 'Max Budget ($)'} *
                                </label>
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
                        </div>

                        {formData.budgetType === 'HOURLY' && (
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Weekly Hours</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['<10', '10-20', '20-30', '30-40', '40+'].map((hours) => (
                                        <button
                                            key={hours}
                                            type="button"
                                            onClick={() => updateField('weeklyHours', parseInt(hours) || 10)}
                                            className={`py-2 px-3 rounded-lg text-sm transition-all ${formData.weeklyHours === (parseInt(hours) || 10)
                                                ? 'bg-indigo-500 text-white'
                                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                }`}
                                        >
                                            {hours}h
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                            <div className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-indigo-400 mt-0.5" />
                                <div>
                                    <p className="text-indigo-400 font-medium text-sm">AI Budget Suggestion</p>
                                    <p className="text-indigo-400/70 text-xs mt-1">
                                        Based on similar projects, we recommend a budget of $3,000-$8,000 for this type of work.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Timeline & Scope */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-violet-500/20">
                                <Clock className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Timeline & Scope</h2>
                                <p className="text-sm text-zinc-500">When do you need this done?</p>
                            </div>
                        </div>

                        {/* Project Type */}
                        <div className="space-y-2">
                            <label className="text-white text-sm font-medium">Project Type *</label>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { value: 'ONE_TIME', label: 'One-Time Project', desc: 'Specific scope with clear end' },
                                    { value: 'ONGOING', label: 'Ongoing Project', desc: 'Long-term collaboration' },
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
                                {['<1 week', '1-2 weeks', '1-3 months', '3-6 months', '6+ months'].map((dur) => (
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

                        {/* Location */}
                        <div className="space-y-2">
                            <label className="text-white text-sm font-medium">Location Requirement</label>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={formData.isRemote === true}
                                        onChange={() => updateField('isRemote', true)}
                                        className="text-indigo-500"
                                    />
                                    <span className="text-zinc-300">Remote (Worldwide)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={formData.isRemote === false}
                                        onChange={() => updateField('isRemote', false)}
                                        className="text-indigo-500"
                                    />
                                    <span className="text-zinc-300">Specific Regions</span>
                                </label>
                            </div>
                        </div>

                        {/* Additional Options */}
                        <div className="space-y-3 pt-4 border-t border-zinc-800">
                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.allowTrialTask}
                                    onChange={(e) => updateField('allowTrialTask', e.target.checked)}
                                    className="rounded bg-zinc-700"
                                />
                                <div>
                                    <span className="text-white font-medium block">Allow Trial Task</span>
                                    <span className="text-zinc-500 text-xs">Let freelancers demonstrate skills with a paid trial</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.contractToHire}
                                    onChange={(e) => updateField('contractToHire', e.target.checked)}
                                    className="rounded bg-zinc-700"
                                />
                                <div>
                                    <span className="text-white font-medium block">Contract-to-Hire</span>
                                    <span className="text-zinc-500 text-xs">Potential to convert to full-time employment</span>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Step 5: Screening Questions */}
                {currentStep === 4 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-amber-500/20">
                                <HelpCircle className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Screening Questions</h2>
                                <p className="text-sm text-zinc-500">Pre-qualify candidates (optional)</p>
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

                {/* Step 6: Review */}
                {currentStep === 5 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-emerald-500/20">
                                <Eye className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Review & Publish</h2>
                                <p className="text-sm text-zinc-500">Review your job post before publishing</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Summary Card */}
                            <div className="p-6 bg-zinc-800/50 rounded-xl space-y-4">
                                <h3 className="text-xl font-bold text-white">{formData.title || 'Untitled Job'}</h3>

                                <div className="flex flex-wrap gap-4 text-sm">
                                    <span className="text-zinc-400">
                                        <strong className="text-white">{formData.category}</strong> {formData.subcategory && `/ ${formData.subcategory}`}
                                    </span>
                                    <span className="text-emerald-400 font-medium">
                                        ${formData.budgetMin?.toLocaleString()} - ${formData.budgetMax?.toLocaleString()}
                                        {formData.budgetType === 'HOURLY' && '/hr'}
                                    </span>
                                    <span className="text-zinc-400">{formData.duration}</span>
                                    <span className="text-zinc-400">{formData.experienceLevel}</span>
                                </div>

                                <p className="text-zinc-400 text-sm line-clamp-3">{formData.description}</p>

                                <div className="flex flex-wrap gap-2">
                                    {(formData.skills || []).map((skill) => (
                                        <span key={skill} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs">
                                            {skill}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-4 text-xs text-zinc-500 pt-2 border-t border-zinc-700">
                                    <span>{formData.isRemote ? '🌍 Remote' : '📍 Location Specific'}</span>
                                    <span>{formData.visibility === 'PUBLIC' ? '👁 Public' : '🔒 Invite Only'}</span>
                                    {formData.allowTrialTask && <span>✓ Trial Task</span>}
                                    {formData.contractToHire && <span>✓ Contract-to-Hire</span>}
                                    {(formData.screeningQuestions?.length || 0) > 0 && <span>{formData.screeningQuestions?.length} Screening Questions</span>}
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </GlassCard>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
                <GlassButton
                    variant="secondary"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </GlassButton>

                <div className="flex gap-3">
                    <GlassButton variant="ghost" onClick={saveDraft}>
                        <Save className="w-4 h-4 mr-2" /> Save Draft
                    </GlassButton>
                    {currentStep < steps.length - 1 ? (
                        <GlassButton
                            variant="primary"
                            onClick={nextStep}
                        >
                            Next <ChevronRight className="w-4 h-4 ml-2" />
                        </GlassButton>
                    ) : (
                        <GlassButton
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={isPending}
                        >
                            {isPending ? 'Saving...' : 'Update Job'}
                        </GlassButton>
                    )}
                </div>
            </div>
        </div>
    );
}
