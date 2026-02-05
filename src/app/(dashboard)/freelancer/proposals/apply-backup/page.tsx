/**
 * BACKUP — DO NOT MODIFY
 * This file preserves the original 6-step proposal UI.
 * Used as a reference for future refactors.
 */
'use client';

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassTextarea } from '@/components/ui/glass-textarea';
import Link from 'next/link';
import {
    FileText, DollarSign, Clock, Briefcase, Plus, Trash2,
    CheckCircle, ChevronRight, ChevronLeft, Paperclip, Image,
    Star, MapPin, AlertCircle, Send, Eye
} from 'lucide-react';

// Mock job data - in real app would come from params
const job = {
    id: 'job-1',
    title: 'Senior React Developer for E-Commerce Platform',
    description: 'We\'re looking for an experienced React developer to help build and maintain our e-commerce platform.',
    category: 'Web Development',
    client: {
        name: 'TechCorp Solutions',
        location: 'New York, US',
        totalSpent: 156000,
        hireRate: 85,
    },
    budgetType: 'HOURLY',
    budgetMin: 60,
    budgetMax: 100,
    duration: '3-6 months',
    experienceLevel: 'EXPERT',
    skills: ['React', 'TypeScript', 'Next.js', 'Redux', 'Tailwind CSS'],
    screeningQuestions: [
        { id: 'sq-1', question: 'How many years of React experience do you have?', type: 'text', required: true },
        { id: 'sq-2', question: 'Have you worked on e-commerce platforms before?', type: 'yesno', required: true },
        { id: 'sq-3', question: 'What is your availability to start?', type: 'choice', options: ['Immediately', 'Within 1 week', 'Within 2 weeks', 'More than 2 weeks'], required: true },
    ],
    allowTrialTask: true,
    proposalCount: 24,
    postedAt: '5 days ago',
};

// Mock portfolio items
const portfolioItems = [
    { id: 'port-1', title: 'E-Commerce Platform', category: 'Web Development', isVerified: true },
    { id: 'port-2', title: 'SaaS Dashboard', category: 'Web Development', isVerified: true },
    { id: 'port-3', title: 'Mobile Banking App', category: 'Mobile Development', isVerified: false },
];

interface Milestone {
    title: string;
    description: string;
    amount: number;
    duration: string;
}

export default function SubmitProposalPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [coverLetter, setCoverLetter] = useState('');
    const [proposedRate, setProposedRate] = useState(job.budgetMin);
    const [estimatedDuration, setEstimatedDuration] = useState('3 months');
    const [milestones, setMilestones] = useState<Milestone[]>([
        { title: '', description: '', amount: 0, duration: '1 week' },
    ]);
    const [selectedPortfolio, setSelectedPortfolio] = useState<string[]>([]);
    const [acceptsTrialTask, setAcceptsTrialTask] = useState(false);
    const [trialTaskProposal, setTrialTaskProposal] = useState('');
    const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});

    const steps = ['Cover Letter', 'Terms', 'Milestones', 'Portfolio', 'Screening', 'Review'];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const updateMilestone = (index: number, field: keyof Milestone, value: string | number) => {
        const updated = [...milestones];
        updated[index] = { ...updated[index], [field]: value };
        setMilestones(updated);
    };

    const addMilestone = () => {
        setMilestones([...milestones, { title: '', description: '', amount: 0, duration: '1 week' }]);
    };

    const removeMilestone = (index: number) => {
        setMilestones(milestones.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSubmitting(false);
        // Would redirect to success page
    };

    const totalMilestoneAmount = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);

    return (
        <DashboardShell role="freelancer">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Job Summary Header */}
                <GlassCard className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
                                <span>{job.category}</span>
                                <span>•</span>
                                <span>Posted {job.postedAt}</span>
                                <span>•</span>
                                <span>{job.proposalCount} proposals</span>
                            </div>
                            <h1 className="text-xl font-bold text-white mb-2">{job.title}</h1>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-emerald-400 font-medium">
                                    ${job.budgetMin}-${job.budgetMax}/hr
                                </span>
                                <span className="text-zinc-400">{job.duration}</span>
                                <span className="text-zinc-400">{job.experienceLevel}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-medium">{job.client.name}</p>
                            <p className="text-zinc-500 text-sm flex items-center gap-1 justify-end">
                                <MapPin className="w-3 h-3" /> {job.client.location}
                            </p>
                            <p className="text-zinc-500 text-xs mt-1">
                                ${(job.client.totalSpent / 1000).toFixed(0)}k+ spent • {job.client.hireRate}% hire rate
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* Step Indicator */}
                <div className="flex items-center justify-between bg-zinc-900/50 rounded-xl p-4">
                    {steps.map((step, index) => (
                        <React.Fragment key={step}>
                            <button
                                onClick={() => setCurrentStep(index)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${index === currentStep
                                    ? 'bg-indigo-500 text-white'
                                    : index < currentStep
                                        ? 'text-emerald-400'
                                        : 'text-zinc-500'
                                    }`}
                            >
                                {index < currentStep ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : (
                                    <span className="w-4 h-4 text-center text-xs">{index + 1}</span>
                                )}
                                <span className="text-sm hidden sm:inline">{step}</span>
                            </button>
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 ${index < currentStep ? 'bg-emerald-500' : 'bg-zinc-800'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Form Content */}
                <GlassCard className="p-6">
                    {/* Step 1: Cover Letter */}
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-indigo-500/20">
                                    <FileText className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Cover Letter</h2>
                                    <p className="text-sm text-zinc-500">Introduce yourself and explain why you're the right fit</p>
                                </div>
                            </div>

                            <GlassTextarea
                                value={coverLetter}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCoverLetter(e.target.value)}
                                placeholder="Dear Hiring Manager,

I'm excited to apply for this position. Here's why I'm the perfect fit...

• Highlight relevant experience
• Mention specific skills that match the requirements
• Show enthusiasm for the project
• Explain your approach to the work

Best regards,
[Your name]"
                                rows={12}
                            />
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">{coverLetter.length}/5000 characters</span>
                                <span className={coverLetter.length >= 100 ? 'text-emerald-400' : 'text-amber-400'}>
                                    Minimum 100 characters recommended
                                </span>
                            </div>

                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                                    <div>
                                        <p className="text-amber-400 font-medium text-sm">Pro Tip</p>
                                        <p className="text-amber-400/70 text-xs mt-1">
                                            Personalized cover letters get 2x more responses. Reference specific details from the job post.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Terms (Rate & Timeline) */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/20">
                                    <DollarSign className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Terms & Rate</h2>
                                    <p className="text-sm text-zinc-500">Your proposed rate and timeline</p>
                                </div>
                            </div>

                            {/* Proposed Rate */}
                            <div className="space-y-3">
                                <label className="text-white font-medium text-sm">
                                    Your {job.budgetType === 'HOURLY' ? 'Hourly Rate' : 'Fixed Price'}
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1 max-w-[200px]">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                                        <input
                                            type="number"
                                            value={proposedRate}
                                            onChange={(e) => setProposedRate(parseInt(e.target.value))}
                                            className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:border-indigo-500 text-lg font-bold"
                                        />
                                        {job.budgetType === 'HOURLY' && (
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">/hr</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-zinc-500">
                                        Client's budget: <span className="text-white">${job.budgetMin}-${job.budgetMax}</span>
                                        {job.budgetType === 'HOURLY' && '/hr'}
                                    </div>
                                </div>
                                <div className="p-3 bg-zinc-800/50 rounded-lg">
                                    <p className="text-sm text-zinc-400">
                                        You'll receive: <span className="text-emerald-400 font-bold">${(proposedRate * 0.9).toFixed(2)}</span>
                                        {job.budgetType === 'HOURLY' && '/hr'} after 10% platform fee
                                    </p>
                                </div>
                            </div>

                            {/* Estimated Duration */}
                            <div className="space-y-3">
                                <label className="text-white font-medium text-sm">Estimated Duration</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['<1 week', '1-2 weeks', '1 month', '2-3 months', '3-6 months'].map((dur) => (
                                        <button
                                            key={dur}
                                            type="button"
                                            onClick={() => setEstimatedDuration(dur)}
                                            className={`py-2 px-3 rounded-lg text-sm transition-all ${estimatedDuration === dur
                                                ? 'bg-indigo-500 text-white'
                                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                }`}
                                        >
                                            {dur}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Trial Task */}
                            {job.allowTrialTask && (
                                <div className="space-y-3 pt-4 border-t border-zinc-800">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={acceptsTrialTask}
                                            onChange={(e) => setAcceptsTrialTask(e.target.checked)}
                                            className="rounded bg-zinc-700 text-indigo-500"
                                        />
                                        <span className="text-white">I'm willing to complete a paid trial task</span>
                                    </label>
                                    {acceptsTrialTask && (
                                        <GlassTextarea
                                            value={trialTaskProposal}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTrialTaskProposal(e.target.value)}
                                            placeholder="Describe what you could deliver as a trial task..."
                                            rows={3}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Milestones */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-violet-500/20">
                                    <Briefcase className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Proposed Milestones</h2>
                                    <p className="text-sm text-zinc-500">Break down the project into deliverable phases</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {milestones.map((milestone, index) => (
                                    <div key={index} className="p-4 bg-zinc-800/50 rounded-xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-indigo-400 font-medium text-sm">Milestone {index + 1}</span>
                                            {milestones.length > 1 && (
                                                <button
                                                    onClick={() => removeMilestone(index)}
                                                    className="text-zinc-500 hover:text-rose-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            value={milestone.title}
                                            onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                                            placeholder="Milestone title (e.g., Project Setup & Architecture)"
                                            className="w-full bg-zinc-700 text-white rounded-lg px-4 py-2 border-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <textarea
                                            value={milestone.description}
                                            onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                                            placeholder="What will you deliver in this milestone?"
                                            rows={2}
                                            className="w-full bg-zinc-700 text-white rounded-lg px-4 py-2 border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                                                <input
                                                    type="number"
                                                    value={milestone.amount || ''}
                                                    onChange={(e) => updateMilestone(index, 'amount', parseInt(e.target.value) || 0)}
                                                    placeholder="Amount"
                                                    className="w-full bg-zinc-700 text-white rounded-lg pl-8 pr-4 py-2 border-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <select
                                                value={milestone.duration}
                                                onChange={(e) => updateMilestone(index, 'duration', e.target.value)}
                                                className="bg-zinc-700 text-white rounded-lg px-4 py-2"
                                            >
                                                <option value="1 day">1 day</option>
                                                <option value="2-3 days">2-3 days</option>
                                                <option value="1 week">1 week</option>
                                                <option value="2 weeks">2 weeks</option>
                                                <option value="1 month">1 month</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={addMilestone}
                                className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
                            >
                                <Plus className="w-4 h-4" /> Add Milestone
                            </button>

                            <div className="p-4 bg-zinc-800/50 rounded-xl flex items-center justify-between">
                                <span className="text-zinc-400">Total Project Value:</span>
                                <span className="text-white text-xl font-bold">${totalMilestoneAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Portfolio */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-rose-500/20">
                                    <Image className="w-5 h-5 text-rose-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Relevant Work Samples</h2>
                                    <p className="text-sm text-zinc-500">Select portfolio items that showcase relevant skills</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {portfolioItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            if (selectedPortfolio.includes(item.id)) {
                                                setSelectedPortfolio(selectedPortfolio.filter(id => id !== item.id));
                                            } else {
                                                setSelectedPortfolio([...selectedPortfolio, item.id]);
                                            }
                                        }}
                                        className={`p-4 rounded-xl border text-left transition-all ${selectedPortfolio.includes(item.id)
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                            }`}
                                    >
                                        <div className="aspect-video bg-zinc-700 rounded-lg mb-3 flex items-center justify-center">
                                            <Briefcase className="w-8 h-8 text-zinc-500" />
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-medium text-white">{item.title}</h3>
                                                <p className="text-sm text-zinc-500">{item.category}</p>
                                            </div>
                                            {item.isVerified && (
                                                <span className="text-xs text-emerald-400 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Verified
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center hover:border-indigo-500/50 transition-colors cursor-pointer">
                                <Paperclip className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                                <p className="text-zinc-400 text-sm">Add additional attachments</p>
                                <p className="text-zinc-500 text-xs mt-1">PDFs, images, or links</p>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Screening Questions */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-amber-500/20">
                                    <Star className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Screening Questions</h2>
                                    <p className="text-sm text-zinc-500">Answer these questions from the client</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {job.screeningQuestions.map((q, index) => (
                                    <div key={q.id} className="space-y-2">
                                        <label className="text-white font-medium text-sm flex items-center gap-2">
                                            {index + 1}. {q.question}
                                            {q.required && <span className="text-rose-400 text-xs">*</span>}
                                        </label>
                                        {q.type === 'text' && (
                                            <textarea
                                                value={screeningAnswers[q.id] || ''}
                                                onChange={(e) => setScreeningAnswers({
                                                    ...screeningAnswers,
                                                    [q.id]: e.target.value
                                                })}
                                                placeholder="Your answer..."
                                                rows={3}
                                                className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
                                            />
                                        )}
                                        {q.type === 'yesno' && (
                                            <div className="flex gap-4">
                                                {['Yes', 'No'].map((opt) => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setScreeningAnswers({
                                                            ...screeningAnswers,
                                                            [q.id]: opt
                                                        })}
                                                        className={`px-6 py-2 rounded-lg transition-all ${screeningAnswers[q.id] === opt
                                                            ? 'bg-indigo-500 text-white'
                                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                            }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {q.type === 'choice' && q.options && (
                                            <div className="flex flex-wrap gap-2">
                                                {q.options.map((opt) => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setScreeningAnswers({
                                                            ...screeningAnswers,
                                                            [q.id]: opt
                                                        })}
                                                        className={`px-4 py-2 rounded-lg text-sm transition-all ${screeningAnswers[q.id] === opt
                                                            ? 'bg-indigo-500 text-white'
                                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                            }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 6: Review */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/20">
                                    <Eye className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Review Your Proposal</h2>
                                    <p className="text-sm text-zinc-500">Make sure everything looks good before submitting</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Summary */}
                                <div className="p-6 bg-zinc-800/50 rounded-xl space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-zinc-500 text-sm">Proposed Rate</p>
                                            <p className="text-2xl font-bold text-white">
                                                ${proposedRate}{job.budgetType === 'HOURLY' && '/hr'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-zinc-500 text-sm">Duration</p>
                                            <p className="text-white font-medium">{estimatedDuration}</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-zinc-700">
                                        <p className="text-zinc-500 text-sm mb-2">Cover Letter Preview</p>
                                        <p className="text-zinc-300 text-sm line-clamp-3">{coverLetter || 'No cover letter provided'}</p>
                                    </div>

                                    <div className="pt-4 border-t border-zinc-700">
                                        <p className="text-zinc-500 text-sm mb-2">Milestones ({milestones.length})</p>
                                        <div className="space-y-2">
                                            {milestones.map((m, i) => (
                                                <div key={i} className="flex justify-between text-sm">
                                                    <span className="text-zinc-300">{m.title || `Milestone ${i + 1}`}</span>
                                                    <span className="text-emerald-400">${m.amount}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-zinc-700">
                                            <span className="text-white">Total</span>
                                            <span className="text-emerald-400">${totalMilestoneAmount}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-zinc-700">
                                        <p className="text-zinc-500 text-sm mb-2">Attachments</p>
                                        <p className="text-zinc-300 text-sm">
                                            {selectedPortfolio.length} portfolio items selected
                                        </p>
                                    </div>

                                    {acceptsTrialTask && (
                                        <div className="pt-4 border-t border-zinc-700">
                                            <p className="text-emerald-400 text-sm flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" /> Willing to complete trial task
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                    <p className="text-indigo-400 text-sm">
                                        <strong>Note:</strong> You'll spend 1 Connect to submit this proposal.
                                        You have 15 Connects remaining.
                                    </p>
                                </div>
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
                        {currentStep < steps.length - 1 ? (
                            <GlassButton variant="primary" onClick={nextStep}>
                                Next <ChevronRight className="w-4 h-4 ml-2" />
                            </GlassButton>
                        ) : (
                            <GlassButton
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                <Send className="w-4 h-4 mr-2" />
                                {submitting ? 'Submitting...' : 'Submit Proposal'}
                            </GlassButton>
                        )}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
