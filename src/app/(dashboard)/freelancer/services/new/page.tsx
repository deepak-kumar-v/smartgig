'use client';

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassTextarea } from '@/components/ui/glass-textarea';
import Link from 'next/link';
import {
    ArrowLeft, ArrowRight, Package, Image as ImageIcon, HelpCircle, DollarSign,
    Plus, Trash2, Upload, CheckCircle, Save, Eye, Loader2, X, List, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

type Step = 1 | 2 | 3 | 4 | 5;

interface PackageTier {
    name: string;
    description: string;
    price: number;
    deliveryDays: number;
    revisions: number;
    features: string[];
}

interface FAQ {
    question: string;
    answer: string;
}

interface Requirement {
    question: string;
    type: 'text' | 'file' | 'choice';
    required: boolean;
}

export default function CreateServicePage() {
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [saving, setSaving] = useState(false);

    // Step 1: Overview
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    // Step 2: Pricing
    const [packages, setPackages] = useState<PackageTier[]>([
        { name: 'Basic', description: '', price: 50, deliveryDays: 7, revisions: 1, features: [] },
        { name: 'Standard', description: '', price: 100, deliveryDays: 5, revisions: 3, features: ['Source Files'] },
        { name: 'Premium', description: '', price: 200, deliveryDays: 3, revisions: -1, features: ['Source Files', 'Commercial Use'] },
    ]);

    // Step 3: Description & FAQ
    const [description, setDescription] = useState('');
    const [faqs, setFaqs] = useState<FAQ[]>([{ question: '', answer: '' }]);

    // Step 4: Requirements
    const [requirements, setRequirements] = useState<Requirement[]>([
        { question: 'Please provide project details', type: 'text', required: true }
    ]);

    // Step 5: Gallery
    const [images, setImages] = useState<string[]>([]); // Mock URLs
    const [videoLink, setVideoLink] = useState('');

    const steps = [
        { num: 1, label: 'Overview' },
        { num: 2, label: 'Pricing' },
        { num: 3, label: 'Description' },
        { num: 4, label: 'Requirements' },
        { num: 5, label: 'Gallery' },
    ];

    // Helper Functions
    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const updatePackage = (index: number, field: keyof PackageTier, value: any) => {
        setPackages(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
    };

    const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }]);
    const updateFaq = (index: number, field: keyof FAQ, value: string) => {
        setFaqs(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
    };
    const removeFaq = (index: number) => setFaqs(prev => prev.filter((_, i) => i !== index));

    const addRequirement = () => setRequirements([...requirements, { question: '', type: 'text', required: true }]);
    const updateRequirement = (index: number, field: keyof Requirement, value: any) => {
        setRequirements(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
    };
    const removeRequirement = (index: number) => setRequirements(prev => prev.filter((_, i) => i !== index));

    const handleSave = async (publish: boolean) => {
        if (!title || !category || !description) {
            toast.error('Please fill in all required fields (Title, Category, Description)');
            return;
        }

        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSaving(false);
        toast.success(publish ? 'Service Published Successfully!' : 'Draft Saved');

        // In real app: redirect
    };

    return (
        <DashboardShell role="freelancer">
            <div className="max-w-5xl mx-auto space-y-6 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/freelancer/services" className="text-zinc-500 hover:text-white text-sm inline-flex items-center gap-1 mb-2">
                            <ArrowLeft className="mb-0.5 w-4 h-4" /> Back to Services
                        </Link>
                        <h1 className="text-2xl font-bold text-white">Create New Service</h1>
                    </div>
                    <div className="flex gap-2">
                        <GlassButton variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
                            <Save className="w-4 h-4 mr-2" /> Save Draft
                        </GlassButton>
                    </div>
                </div>

                {/* Progress Stepper */}
                <div className="flex items-center justify-between px-4">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.num}>
                            <div className="flex flex-col items-center gap-2 relative z-10">
                                <button
                                    onClick={() => setCurrentStep(step.num as Step)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStep >= step.num
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                        }`}
                                >
                                    {currentStep > step.num ? <CheckCircle className="w-5 h-5" /> : step.num}
                                </button>
                                <span className={`text-xs font-medium ${currentStep >= step.num ? 'text-white' : 'text-zinc-500'}`}>
                                    {step.label}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 -mt-6 mx-2 transition-colors ${currentStep > step.num ? 'bg-indigo-500' : 'bg-zinc-800'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Step 1: Overview */}
                {currentStep === 1 && (
                    <GlassCard className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">Service Title</label>
                                    <GlassInput
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="I will build a modern Next.js application..."
                                        maxLength={80}
                                        className="text-lg py-3"
                                    />
                                    <div className="flex justify-between text-xs text-zinc-500">
                                        <span>Start with "I will..."</span>
                                        <span>{title.length}/80</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-white text-sm font-medium">Category</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                                        >
                                            <option value="">Select Category</option>
                                            <option value="dev">Development & IT</option>
                                            <option value="design">Design & Creative</option>
                                            <option value="marketing">Digital Marketing</option>
                                            <option value="writing">Writing & Translation</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-white text-sm font-medium">Subcategory</label>
                                        <select
                                            value={subcategory}
                                            onChange={(e) => setSubcategory(e.target.value)}
                                            className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                                        >
                                            <option value="">Select Subcategory</option>
                                            <option value="web">Web Development</option>
                                            <option value="mobile">Mobile Apps</option>
                                            <option value="desktop">Desktop Software</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">Search Tags</label>
                                    <div className="relative">
                                        <GlassInput
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                            placeholder="Press Enter to add tags (max 5)"
                                        />
                                        <GlassButton
                                            size="sm"
                                            variant="ghost"
                                            className="absolute right-1 top-1"
                                            onClick={addTag}
                                        >
                                            Add
                                        </GlassButton>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {tags.map((tag, i) => (
                                            <span key={i} className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-sm flex items-center gap-2">
                                                #{tag}
                                                <button onClick={() => setTags(tags.filter((_, j) => j !== i))} className="hover:text-white">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Tip */}
                            <div className="hidden md:block">
                                <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                                        <AlertCircle className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h3 className="text-white font-semibold mb-2">Pro Tip</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        Titles with specific deliverables perform 40% better. Include your main keyword at the beginning of the title.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                )}

                {/* Step 2: Pricing */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {packages.map((pkg, index) => (
                                <GlassCard key={index} className="p-0 overflow-hidden relative group">
                                    <div className={`p-4 border-b border-white/5 ${index === 1 ? 'bg-indigo-500/10' : 'bg-transparent'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-bold text-white text-lg">{pkg.name}</h3>
                                            {index === 1 && <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">Recommended</span>}
                                        </div>
                                        <GlassInput
                                            placeholder="Package Description"
                                            value={pkg.description}
                                            onChange={(e) => updatePackage(index, 'description', e.target.value)}
                                            className={`text-sm ${index === 1 ? 'border-indigo-500/30' : ''}`}
                                        />
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div>
                                            <label className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-2 block">Delivery</label>
                                            <div className="flex items-center gap-2">
                                                <ClockIcon />
                                                <select
                                                    className="bg-transparent text-white border-b border-zinc-700 w-full focus:outline-none focus:border-indigo-500 pb-1"
                                                    value={pkg.deliveryDays}
                                                    onChange={(e) => updatePackage(index, 'deliveryDays', parseInt(e.target.value))}
                                                >
                                                    {[1, 2, 3, 4, 5, 7, 10, 14, 21, 30].map(d => <option key={d} value={d} className="bg-zinc-900">{d} Days Delivery</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-2 block">Price</label>
                                            <div className="relative">
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">$</span>
                                                <input
                                                    type="number"
                                                    className="bg-transparent text-white text-3xl font-bold w-full pl-6 focus:outline-none"
                                                    value={pkg.price}
                                                    onChange={(e) => updatePackage(index, 'price', parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-2 block">Revisions</label>
                                            <select
                                                className="bg-zinc-800/50 border border-zinc-700 rounded-lg w-full text-sm text-white p-2"
                                                value={pkg.revisions}
                                                onChange={(e) => updatePackage(index, 'revisions', parseInt(e.target.value))}
                                            >
                                                <option value={0}>0 Revisions</option>
                                                <option value={1}>1 Revision</option>
                                                <option value={3}>3 Revisions</option>
                                                <option value={-1}>Unlimited</option>
                                            </select>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Description */}
                {currentStep === 3 && (
                    <GlassCard className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white">About This Service</h2>
                            <GlassTextarea
                                value={description}
                                onChange={(e: any) => setDescription(e.target.value)}
                                placeholder="Describe your service in detail..."
                                rows={10}
                                className="font-mono text-sm leading-relaxed"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white">FAQ</h2>
                                <GlassButton size="sm" variant="secondary" onClick={addFaq}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Question
                                </GlassButton>
                            </div>

                            {faqs.map((faq, i) => (
                                <div key={i} className="p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl space-y-3 group hover:border-zinc-600 transition-colors">
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-3">
                                            <GlassInput
                                                placeholder="Add a question (e.g., Do you translate to English?)"
                                                value={faq.question}
                                                onChange={(e) => updateFaq(i, 'question', e.target.value)}
                                            />
                                            <GlassTextarea
                                                placeholder="Add an answer"
                                                value={faq.answer}
                                                onChange={(e: any) => updateFaq(i, 'answer', e.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                        <button onClick={() => removeFaq(i)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-zinc-500 hover:text-rose-400 h-fit">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                )}

                {/* Step 4: Requirements */}
                {currentStep === 4 && (
                    <GlassCard className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Buyer Requirements</h2>
                                <p className="text-zinc-400 text-sm">Questions you need the buyer to answer to start the order.</p>
                            </div>
                            <GlassButton size="sm" variant="secondary" onClick={addRequirement}>
                                <Plus className="w-4 h-4 mr-2" /> Add Requirement
                            </GlassButton>
                        </div>

                        <div className="space-y-4">
                            {requirements.map((req, i) => (
                                <div key={i} className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl space-y-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-white font-medium">Requirement #{i + 1}</h3>
                                        <button onClick={() => removeRequirement(i)} className="text-zinc-500 hover:text-rose-400">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <GlassTextarea
                                        value={req.question}
                                        onChange={(e: any) => updateRequirement(i, 'question', e.target.value)}
                                        placeholder="e.g., Please upload your logo file in vector format"
                                    />

                                    <div className="flex items-center gap-6">
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-500 uppercase font-bold">Answer Type</label>
                                            <select
                                                value={req.type}
                                                onChange={(e) => updateRequirement(i, 'type', e.target.value)}
                                                className="block bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg p-2.5 w-40"
                                            >
                                                <option value="text">Free Text</option>
                                                <option value="file">File Attachment</option>
                                                <option value="choice">Multiple Choice</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2 mt-5">
                                            <input
                                                type="checkbox"
                                                checked={req.required}
                                                onChange={(e) => updateRequirement(i, 'required', e.target.checked)}
                                                className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-indigo-500 focus:ring-indigo-500"
                                            />
                                            <label className="text-sm text-zinc-300">Required answer</label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                )}

                {/* Step 5: Gallery */}
                {currentStep === 5 && (
                    <GlassCard className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-white">Work Showcase</h2>

                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Video Introduction (Optional)</label>
                                <GlassInput
                                    placeholder="YouTube or Vimeo Link"
                                    value={videoLink}
                                    onChange={(e) => setVideoLink(e.target.value)}
                                />
                            </div>

                            {/* Images */}
                            <div className="space-y-4">
                                <label className="text-white text-sm font-medium">Project Images (Up to 10)</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="aspect-square border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors bg-zinc-800/30 hover:bg-zinc-800/50">
                                        <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                                        <span className="text-zinc-500 text-xs text-center px-4">Drag & drop or Click to Upload</span>
                                    </div>

                                    {/* Mock placeholder for uploaded */}
                                    <div className="aspect-square bg-zinc-800 rounded-xl relative group overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-bold">Preview</div>
                                        <div className="absolute top-2 left-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">COVER</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                            <div className="flex items-center gap-4 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                                <CheckCircle className="w-6 h-6 text-emerald-400" />
                                <div>
                                    <h3 className="text-white font-medium">You're almost done!</h3>
                                    <p className="text-zinc-400 text-sm">Your service looks great. Ready to publish to the marketplace?</p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                )}

                {/* Footer Navigation */}
                <div className="mt-8 flex justify-between items-center bg-black/50 backdrop-blur-xl p-4 rounded-2xl border border-white/10 fixed bottom-4 left-4 right-4 max-w-5xl mx-auto z-50">
                    <GlassButton
                        variant="secondary"
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1) as Step)}
                        disabled={currentStep === 1}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                    </GlassButton>

                    <div className="flex gap-4">
                        {currentStep < 5 ? (
                            <GlassButton
                                variant="primary"
                                onClick={() => setCurrentStep(prev => Math.min(5, prev + 1) as Step)}
                            >
                                Next Step <ArrowRight className="w-4 h-4 ml-2" />
                            </GlassButton>
                        ) : (
                            <>
                                <GlassButton variant="secondary">
                                    <Eye className="w-4 h-4 mr-2" /> Preview
                                </GlassButton>
                                <GlassButton variant="primary" onClick={() => handleSave(true)} disabled={saving}>
                                    {saving ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</>
                                    ) : (
                                        <><CheckCircle className="w-4 h-4 mr-2" /> Publish Now</>
                                    )}
                                </GlassButton>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}

function ClockIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
    )
}
