'use client';

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassTextarea } from '@/components/ui/glass-textarea';
import Link from 'next/link';
import {
    Flag, AlertTriangle, Shield, Upload, ChevronRight, ChevronLeft,
    FileText, Clock, CheckCircle, MessageSquare, Scale, User,
    DollarSign, Calendar, Info
} from 'lucide-react';

const disputeReasons = [
    { id: 'quality', label: 'Quality of Work', description: 'Work does not meet requirements or quality standards' },
    { id: 'incomplete', label: 'Incomplete Delivery', description: 'Deliverables are missing or incomplete' },
    { id: 'deadline', label: 'Missed Deadline', description: 'Work was not delivered on time' },
    { id: 'communication', label: 'Communication Issues', description: 'Unresponsive or poor communication' },
    { id: 'scope', label: 'Scope Creep', description: 'Client requesting work outside original scope' },
    { id: 'payment', label: 'Payment Issues', description: 'Payment not released or funding issues' },
    { id: 'other', label: 'Other', description: 'Other issues not listed above' },
];

// Mock contracts for selection
const contracts = [
    { id: 'contract-1', title: 'Backend API Development', client: 'Sarah Chen', amount: 6500 },
    { id: 'contract-2', title: 'React Dashboard Project', client: 'Mike Johnson', amount: 4500 },
];

export default function NewDisputePage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [selectedContract, setSelectedContract] = useState<string>('');
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [description, setDescription] = useState('');
    const [desiredResolution, setDesiredResolution] = useState('');
    const [evidence, setEvidence] = useState<File[]>([]);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const steps = ['Select Contract', 'Reason', 'Details', 'Evidence', 'Review'];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const handleSubmit = async () => {
        setSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSubmitting(false);
        // Would redirect to dispute detail page
    };

    return (
        <DashboardShell role="freelancer">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-white">Open a Dispute</h1>
                    <p className="text-zinc-400">We're here to help resolve issues between you and your client.</p>
                </div>

                {/* Warning */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                        <div>
                            <p className="text-amber-400 font-medium">Before opening a dispute</p>
                            <p className="text-amber-400/70 text-sm mt-1">
                                We recommend trying to resolve issues directly with the other party first.
                                Disputes may affect your profile and take 5-7 business days to resolve.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-between bg-zinc-900/50 rounded-xl p-4">
                    {steps.map((step, index) => (
                        <React.Fragment key={step}>
                            <button
                                onClick={() => setCurrentStep(index)}
                                disabled={index > currentStep}
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
                                <span className="text-sm hidden md:inline">{step}</span>
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
                    {/* Step 1: Select Contract */}
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-indigo-500/20">
                                    <FileText className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Select Contract</h2>
                                    <p className="text-sm text-zinc-500">Which contract is this dispute about?</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {contracts.map((contract) => (
                                    <button
                                        key={contract.id}
                                        onClick={() => setSelectedContract(contract.id)}
                                        className={`w-full p-4 rounded-xl border text-left transition-all ${selectedContract === contract.id
                                                ? 'border-indigo-500 bg-indigo-500/10'
                                                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">{contract.title}</p>
                                                <p className="text-zinc-500 text-sm">with {contract.client}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-bold">${contract.amount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Reason */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-rose-500/20">
                                    <Flag className="w-5 h-5 text-rose-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Reason for Dispute</h2>
                                    <p className="text-sm text-zinc-500">What is the main issue?</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {disputeReasons.map((reason) => (
                                    <button
                                        key={reason.id}
                                        onClick={() => setSelectedReason(reason.id)}
                                        className={`w-full p-4 rounded-xl border text-left transition-all ${selectedReason === reason.id
                                                ? 'border-indigo-500 bg-indigo-500/10'
                                                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                            }`}
                                    >
                                        <p className="text-white font-medium">{reason.label}</p>
                                        <p className="text-zinc-500 text-sm">{reason.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Details */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-violet-500/20">
                                    <MessageSquare className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Describe the Issue</h2>
                                    <p className="text-sm text-zinc-500">Provide as much detail as possible</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">What happened?</label>
                                    <GlassTextarea
                                        value={description}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                        placeholder="Describe the issue in detail. Include specific dates, milestones, and what you expected vs what was delivered..."
                                        rows={6}
                                    />
                                    <p className="text-xs text-zinc-500">{description.length}/2000 characters</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">Desired Resolution</label>
                                    <GlassTextarea
                                        value={desiredResolution}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDesiredResolution(e.target.value)}
                                        placeholder="What outcome would you like to see? (e.g., full refund, partial refund, work completion, etc.)"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Evidence */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-cyan-500/20">
                                    <Upload className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Upload Evidence</h2>
                                    <p className="text-sm text-zinc-500">Supporting documents help resolve disputes faster</p>
                                </div>
                            </div>

                            <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-colors cursor-pointer">
                                <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                                <p className="text-white font-medium mb-1">Drop files here or click to upload</p>
                                <p className="text-zinc-500 text-sm">Screenshots, contracts, messages, etc.</p>
                                <p className="text-zinc-600 text-xs mt-2">Max 10 files, 10MB each. PDF, PNG, JPG</p>
                            </div>

                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-indigo-400 mt-0.5" />
                                    <div>
                                        <p className="text-indigo-400 font-medium text-sm">What to include</p>
                                        <ul className="text-indigo-400/70 text-xs mt-1 space-y-1">
                                            <li>• Screenshots of relevant messages</li>
                                            <li>• Original project requirements</li>
                                            <li>• Delivered work samples</li>
                                            <li>• Any contracts or agreements</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Review */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/20">
                                    <Scale className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Review & Submit</h2>
                                    <p className="text-sm text-zinc-500">Confirm your dispute details</p>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="p-6 bg-zinc-800/50 rounded-xl space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-zinc-500 text-sm">Contract</p>
                                        <p className="text-white font-medium">
                                            {contracts.find(c => c.id === selectedContract)?.title || 'Not selected'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-zinc-500 text-sm">Value</p>
                                        <p className="text-white font-medium">
                                            ${contracts.find(c => c.id === selectedContract)?.amount.toLocaleString() || 0}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-700">
                                    <p className="text-zinc-500 text-sm">Reason</p>
                                    <p className="text-white font-medium">
                                        {disputeReasons.find(r => r.id === selectedReason)?.label || 'Not selected'}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-zinc-700">
                                    <p className="text-zinc-500 text-sm">Description</p>
                                    <p className="text-zinc-300 text-sm mt-1 line-clamp-3">{description || 'No description provided'}</p>
                                </div>

                                <div className="pt-4 border-t border-zinc-700">
                                    <p className="text-zinc-500 text-sm">Desired Resolution</p>
                                    <p className="text-zinc-300 text-sm mt-1">{desiredResolution || 'Not specified'}</p>
                                </div>

                                <div className="pt-4 border-t border-zinc-700">
                                    <p className="text-zinc-500 text-sm">Evidence</p>
                                    <p className="text-zinc-300 text-sm mt-1">{evidence.length} files uploaded</p>
                                </div>
                            </div>

                            {/* Terms */}
                            <label className="flex items-start gap-3 cursor-pointer p-4 bg-zinc-800/50 rounded-xl">
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className="mt-1 rounded bg-zinc-700 text-indigo-500"
                                />
                                <div>
                                    <span className="text-white text-sm">I agree to the dispute resolution process</span>
                                    <p className="text-zinc-500 text-xs mt-1">
                                        I understand that disputes typically take 5-7 business days to resolve and
                                        that my account may be temporarily restricted during the process.
                                    </p>
                                </div>
                            </label>

                            {/* Timeline info */}
                            <div className="p-4 bg-zinc-800/50 rounded-xl">
                                <h4 className="text-white font-medium text-sm mb-3">What happens next?</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs">1</div>
                                        <span className="text-zinc-400">Other party will be notified (24 hours to respond)</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs">2</div>
                                        <span className="text-zinc-400">Mediation period for direct resolution (3 days)</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs">3</div>
                                        <span className="text-zinc-400">Admin arbitration if no agreement reached</span>
                                    </div>
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

                    {currentStep < steps.length - 1 ? (
                        <GlassButton
                            variant="primary"
                            onClick={nextStep}
                            disabled={
                                (currentStep === 0 && !selectedContract) ||
                                (currentStep === 1 && !selectedReason) ||
                                (currentStep === 2 && !description)
                            }
                        >
                            Next <ChevronRight className="w-4 h-4 ml-2" />
                        </GlassButton>
                    ) : (
                        <GlassButton
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={submitting || !agreedToTerms}
                        >
                            <Flag className="w-4 h-4 mr-2" />
                            {submitting ? 'Submitting...' : 'Submit Dispute'}
                        </GlassButton>
                    )}
                </div>
            </div>
        </DashboardShell>
    );
}
