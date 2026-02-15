'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassTextarea } from '@/components/ui/glass-textarea';
import {
    User, MapPin, Globe, DollarSign, Clock, Briefcase,
    GraduationCap, Award, Languages, Link2, Plus, Trash2,
    CheckCircle, AlertCircle, ChevronRight, ChevronLeft,
    Save, Camera, Shield, Star
} from 'lucide-react';
import { countries, timezones, skillsList, jobCategories } from '@/lib/mock-data';
import type { FreelancerProfileFormData, ProficiencyLevel, LanguageLevel } from '@/lib/types';

// Step indicator component
function StepIndicator({ steps, currentStep }: { steps: string[]; currentStep: number }) {
    return (
        <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
                <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${index < currentStep
                                ? 'bg-emerald-500 text-white'
                                : index === currentStep
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-zinc-800 text-zinc-500'
                                }`}
                        >
                            {index < currentStep ? <CheckCircle className="w-5 h-5" /> : index + 1}
                        </div>
                        <span className={`text-xs mt-2 ${index <= currentStep ? 'text-white' : 'text-zinc-500'
                            }`}>
                            {step}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-4 ${index < currentStep ? 'bg-emerald-500' : 'bg-zinc-800'
                            }`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

// Skill Input Component
function SkillInput({
    skills,
    onAdd,
    onRemove,
    onUpdate
}: {
    skills: { name: string; proficiency: ProficiencyLevel; yearsOfExperience?: number }[];
    onAdd: () => void;
    onRemove: (index: number) => void;
    onUpdate: (index: number, field: string, value: string | number) => void;
}) {
    return (
        <div className="space-y-4">
            {skills.map((skill, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={skill.name}
                            onChange={(e) => onUpdate(index, 'name', e.target.value)}
                            placeholder="Skill name"
                            list="skills-list"
                            className="w-full bg-transparent border-none text-white placeholder-zinc-500 focus:outline-none"
                        />
                    </div>
                    <select
                        value={skill.proficiency}
                        onChange={(e) => onUpdate(index, 'proficiency', e.target.value)}
                        className="bg-zinc-700 text-white text-sm rounded px-2 py-1 border-none focus:outline-none"
                    >
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                        <option value="EXPERT">Expert</option>
                    </select>
                    <input
                        type="number"
                        value={skill.yearsOfExperience || ''}
                        onChange={(e) => onUpdate(index, 'yearsOfExperience', parseInt(e.target.value) || 0)}
                        placeholder="Years"
                        className="w-16 bg-zinc-700 text-white text-sm rounded px-2 py-1 border-none focus:outline-none"
                    />
                    <button
                        onClick={() => onRemove(index)}
                        className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <datalist id="skills-list">
                {skillsList.map((s) => <option key={s} value={s} />)}
            </datalist>
            <button
                onClick={onAdd}
                className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
                <Plus className="w-4 h-4" /> Add Skill
            </button>
        </div>
    );
}

// Education Entry Component
function EducationEntry({
    education,
    onUpdate,
    onRemove
}: {
    education: { institution: string; degree: string; fieldOfStudy: string; startYear: number; endYear?: number; current: boolean };
    onUpdate: (field: string, value: string | number | boolean) => void;
    onRemove: () => void;
}) {
    return (
        <div className="p-4 bg-zinc-800/50 rounded-xl space-y-4">
            <div className="flex justify-between items-start">
                <h4 className="text-white font-medium">Education Entry</h4>
                <button onClick={onRemove} className="text-zinc-500 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <input
                    type="text"
                    value={education.institution}
                    onChange={(e) => onUpdate('institution', e.target.value)}
                    placeholder="Institution"
                    className="bg-zinc-700 text-white rounded-lg px-3 py-2 text-sm border-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                    type="text"
                    value={education.degree}
                    onChange={(e) => onUpdate('degree', e.target.value)}
                    placeholder="Degree (e.g., Bachelor's)"
                    className="bg-zinc-700 text-white rounded-lg px-3 py-2 text-sm border-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                    type="text"
                    value={education.fieldOfStudy}
                    onChange={(e) => onUpdate('fieldOfStudy', e.target.value)}
                    placeholder="Field of Study"
                    className="bg-zinc-700 text-white rounded-lg px-3 py-2 text-sm border-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={education.startYear || ''}
                        onChange={(e) => onUpdate('startYear', parseInt(e.target.value))}
                        placeholder="Start Year"
                        className="flex-1 bg-zinc-700 text-white rounded-lg px-3 py-2 text-sm border-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                        type="number"
                        value={education.endYear || ''}
                        onChange={(e) => onUpdate('endYear', parseInt(e.target.value))}
                        placeholder="End Year"
                        disabled={education.current}
                        className="flex-1 bg-zinc-700 text-white rounded-lg px-3 py-2 text-sm border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    />
                </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input
                    type="checkbox"
                    checked={education.current}
                    onChange={(e) => onUpdate('current', e.target.checked)}
                    className="rounded bg-zinc-700 border-zinc-600"
                />
                Currently studying here
            </label>
        </div>
    );
}

export default function EditProfilePage() {
    const steps = ['Personal', 'Professional', 'Skills', 'Experience', 'Portfolio', 'Verification'];
    const [currentStep, setCurrentStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form state
    const [formData, setFormData] = useState<Partial<FreelancerProfileFormData>>({
        displayName: 'David Kim',
        headline: 'Senior Full-Stack Developer | React & Node.js Expert',
        bio: 'With over 8 years of experience in web development, I specialize in building scalable applications using modern technologies.',
        country: 'US',
        city: 'San Francisco',
        timezone: 'America/Los_Angeles',
        hourlyRate: 85,
        currency: 'USD',
        availability: 'AVAILABLE',
        weeklyHours: 40,
        skills: [
            { name: 'React', proficiency: 'EXPERT', yearsOfExperience: 6 },
            { name: 'TypeScript', proficiency: 'EXPERT', yearsOfExperience: 5 },
            { name: 'Node.js', proficiency: 'EXPERT', yearsOfExperience: 7 },
        ],
        categories: ['Web Development'],
        experienceLevel: 'EXPERT',
        languages: [
            { code: 'en', name: 'English', level: 'NATIVE' },
        ],
        education: [
            { institution: 'Stanford University', degree: 'Master of Science', fieldOfStudy: 'Computer Science', startYear: 2014, endYear: 2016, current: false },
        ],
        employment: [],
        certifications: [],
        socialLinks: [
            { platform: 'github', url: 'https://github.com/davidkim' },
        ],
    });

    const updateField = (field: string, value: unknown) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
                        <p className="text-zinc-400">Complete your profile to attract more clients</p>
                    </div>
                    {saved && (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                            <CheckCircle className="w-4 h-4" /> Changes saved
                        </div>
                    )}
                </div>

                {/* Step Indicator */}
                <StepIndicator steps={steps} currentStep={currentStep} />

                {/* Form Content */}
                <GlassCard className="p-6">
                    {/* Step 1: Personal Information */}
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-indigo-500/20">
                                    <User className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Personal Information</h2>
                                    <p className="text-sm text-zinc-500">Basic info about you</p>
                                </div>
                            </div>

                            {/* Profile Photo */}
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white">
                                        DK
                                    </div>
                                    <button className="absolute bottom-0 right-0 p-2 bg-indigo-500 rounded-full text-white hover:bg-indigo-600 transition-colors">
                                        <Camera className="w-4 h-4" />
                                    </button>
                                </div>
                                <div>
                                    <p className="text-white font-medium">Profile Photo</p>
                                    <p className="text-sm text-zinc-500">JPG, PNG or GIF. Max 5MB.</p>
                                </div>
                            </div>

                            {/* Display Name */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Display Name *</label>
                                <GlassInput
                                    value={formData.displayName || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('displayName', e.target.value)}
                                    placeholder="How you want to be called"
                                />
                            </div>

                            {/* Headline */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Professional Headline *</label>
                                <GlassInput
                                    value={formData.headline || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('headline', e.target.value)}
                                    placeholder="e.g., Senior Full-Stack Developer | React Expert"
                                />
                                <p className="text-xs text-zinc-500">This appears below your name in search results</p>
                            </div>

                            {/* Bio */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Bio *</label>
                                <GlassTextarea
                                    value={formData.bio || ''}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('bio', e.target.value)}
                                    placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                                    rows={5}
                                />
                                <p className="text-xs text-zinc-500">{(formData.bio || '').length}/2000 characters</p>
                            </div>

                            {/* Location */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">Country *</label>
                                    <select
                                        value={formData.country || ''}
                                        onChange={(e) => updateField('country', e.target.value)}
                                        className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">Select country</option>
                                        {countries.map(c => (
                                            <option key={c.code} value={c.code}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">City</label>
                                    <GlassInput
                                        value={formData.city || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('city', e.target.value)}
                                        placeholder="Your city"
                                    />
                                </div>
                            </div>

                            {/* Timezone */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Timezone *</label>
                                <select
                                    value={formData.timezone || ''}
                                    onChange={(e) => updateField('timezone', e.target.value)}
                                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="">Select timezone</option>
                                    {timezones.map(tz => (
                                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Languages */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Languages</label>
                                <div className="space-y-2">
                                    {(formData.languages || []).map((lang, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                                            <input
                                                type="text"
                                                value={lang.name}
                                                onChange={(e) => {
                                                    const updated = [...(formData.languages || [])];
                                                    updated[index] = { ...updated[index], name: e.target.value };
                                                    updateField('languages', updated);
                                                }}
                                                placeholder="Language"
                                                className="flex-1 bg-transparent text-white border-none focus:outline-none"
                                            />
                                            <select
                                                value={lang.level}
                                                onChange={(e) => {
                                                    const updated = [...(formData.languages || [])];
                                                    updated[index] = { ...updated[index], level: e.target.value as LanguageLevel };
                                                    updateField('languages', updated);
                                                }}
                                                className="bg-zinc-700 text-white text-sm rounded px-2 py-1"
                                            >
                                                <option value="BASIC">Basic</option>
                                                <option value="CONVERSATIONAL">Conversational</option>
                                                <option value="FLUENT">Fluent</option>
                                                <option value="NATIVE">Native</option>
                                            </select>
                                            <button
                                                onClick={() => {
                                                    const updated = (formData.languages || []).filter((_, i) => i !== index);
                                                    updateField('languages', updated);
                                                }}
                                                className="text-zinc-500 hover:text-rose-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const updated = [...(formData.languages || []), { code: '', name: '', level: 'CONVERSATIONAL' as LanguageLevel }];
                                            updateField('languages', updated);
                                        }}
                                        className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
                                    >
                                        <Plus className="w-4 h-4" /> Add Language
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Professional Details */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-emerald-500/20">
                                    <DollarSign className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Professional Details</h2>
                                    <p className="text-sm text-zinc-500">Your rates and availability</p>
                                </div>
                            </div>

                            {/* Hourly Rate */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">Hourly Rate *</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                                        <input
                                            type="number"
                                            value={formData.hourlyRate || ''}
                                            onChange={(e) => updateField('hourlyRate', parseInt(e.target.value))}
                                            className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">Currency</label>
                                    <select
                                        value={formData.currency || 'USD'}
                                        onChange={(e) => updateField('currency', e.target.value)}
                                        className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="USD">USD - US Dollar</option>
                                        <option value="EUR">EUR - Euro</option>
                                        <option value="GBP">GBP - British Pound</option>
                                        <option value="CAD">CAD - Canadian Dollar</option>
                                        <option value="AUD">AUD - Australian Dollar</option>
                                    </select>
                                </div>
                            </div>

                            {/* Availability */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Availability Status</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'AVAILABLE', label: 'Available', color: 'emerald' },
                                        { value: 'BUSY', label: 'Busy', color: 'amber' },
                                        { value: 'NOT_AVAILABLE', label: 'Not Available', color: 'rose' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => updateField('availability', option.value)}
                                            className={`p-4 rounded-xl border transition-all ${formData.availability === option.value
                                                ? `border-${option.color}-500 bg-${option.color}-500/10`
                                                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                                }`}
                                        >
                                            <div className={`w-3 h-3 rounded-full mb-2 ${option.value === 'AVAILABLE' ? 'bg-emerald-400' :
                                                option.value === 'BUSY' ? 'bg-amber-400' : 'bg-rose-400'
                                                }`} />
                                            <span className="text-white text-sm">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Weekly Hours */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Weekly Hours Available</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="5"
                                        max="60"
                                        step="5"
                                        value={formData.weeklyHours || 40}
                                        onChange={(e) => updateField('weeklyHours', parseInt(e.target.value))}
                                        className="flex-1 h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                                    />
                                    <span className="text-white font-bold w-20 text-center">{formData.weeklyHours}h/week</span>
                                </div>
                            </div>

                            {/* Experience Level */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Experience Level</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'ENTRY', label: 'Entry Level', desc: '0-2 years' },
                                        { value: 'INTERMEDIATE', label: 'Intermediate', desc: '3-5 years' },
                                        { value: 'EXPERT', label: 'Expert', desc: '6+ years' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => updateField('experienceLevel', option.value)}
                                            className={`p-4 rounded-xl border text-left transition-all ${formData.experienceLevel === option.value
                                                ? 'border-indigo-500 bg-indigo-500/10'
                                                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                                }`}
                                        >
                                            <span className="text-white text-sm font-medium block">{option.label}</span>
                                            <span className="text-zinc-500 text-xs">{option.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Service Categories</label>
                                <div className="flex flex-wrap gap-2">
                                    {jobCategories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                const current = formData.categories || [];
                                                const updated = current.includes(cat.name)
                                                    ? current.filter(c => c !== cat.name)
                                                    : [...current, cat.name];
                                                updateField('categories', updated);
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-sm transition-all ${(formData.categories || []).includes(cat.name)
                                                ? 'bg-indigo-500 text-white'
                                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Skills */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-cyan-500/20">
                                    <Star className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Skills & Expertise</h2>
                                    <p className="text-sm text-zinc-500">Add your skills with proficiency levels</p>
                                </div>
                            </div>

                            <SkillInput
                                skills={formData.skills || []}
                                onAdd={() => {
                                    const updated = [...(formData.skills || []), { name: '', proficiency: 'INTERMEDIATE' as ProficiencyLevel, yearsOfExperience: 1 }];
                                    updateField('skills', updated);
                                }}
                                onRemove={(index) => {
                                    const updated = (formData.skills || []).filter((_, i) => i !== index);
                                    updateField('skills', updated);
                                }}
                                onUpdate={(index, field, value) => {
                                    const updated = [...(formData.skills || [])];
                                    updated[index] = { ...updated[index], [field]: value };
                                    updateField('skills', updated);
                                }}
                            />

                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                                    <div>
                                        <p className="text-amber-400 font-medium text-sm">Tip: Add at least 5 skills</p>
                                        <p className="text-amber-400/70 text-xs mt-1">
                                            Profiles with 5+ skills get 2x more views from clients.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Experience */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-violet-500/20">
                                    <GraduationCap className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Education & Experience</h2>
                                    <p className="text-sm text-zinc-500">Your background and qualifications</p>
                                </div>
                            </div>

                            {/* Education */}
                            <div className="space-y-4">
                                <h3 className="text-white font-medium">Education</h3>
                                {(formData.education || []).map((edu, index) => (
                                    <EducationEntry
                                        key={index}
                                        education={edu}
                                        onUpdate={(field, value) => {
                                            const updated = [...(formData.education || [])];
                                            updated[index] = { ...updated[index], [field]: value };
                                            updateField('education', updated);
                                        }}
                                        onRemove={() => {
                                            const updated = (formData.education || []).filter((_, i) => i !== index);
                                            updateField('education', updated);
                                        }}
                                    />
                                ))}
                                <button
                                    onClick={() => {
                                        const updated = [...(formData.education || []), {
                                            institution: '', degree: '', fieldOfStudy: '', startYear: new Date().getFullYear(), current: false
                                        }];
                                        updateField('education', updated);
                                    }}
                                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
                                >
                                    <Plus className="w-4 h-4" /> Add Education
                                </button>
                            </div>

                            {/* Certifications */}
                            <div className="space-y-4 pt-6 border-t border-zinc-800">
                                <h3 className="text-white font-medium">Certifications</h3>
                                {(formData.certifications || []).map((cert, index) => (
                                    <div key={index} className="p-4 bg-zinc-800/50 rounded-xl flex items-center justify-between">
                                        <div>
                                            <input
                                                type="text"
                                                value={cert.name}
                                                onChange={(e) => {
                                                    const updated = [...(formData.certifications || [])];
                                                    updated[index] = { ...updated[index], name: e.target.value };
                                                    updateField('certifications', updated);
                                                }}
                                                placeholder="Certification name"
                                                className="bg-transparent text-white font-medium border-none focus:outline-none"
                                            />
                                            <input
                                                type="text"
                                                value={cert.issuingOrganization}
                                                onChange={(e) => {
                                                    const updated = [...(formData.certifications || [])];
                                                    updated[index] = { ...updated[index], issuingOrganization: e.target.value };
                                                    updateField('certifications', updated);
                                                }}
                                                placeholder="Issuing organization"
                                                className="bg-transparent text-zinc-400 text-sm border-none focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const updated = (formData.certifications || []).filter((_, i) => i !== index);
                                                updateField('certifications', updated);
                                            }}
                                            className="text-zinc-500 hover:text-rose-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const updated = [...(formData.certifications || []), {
                                            name: '', issuingOrganization: '', issueDate: new Date()
                                        }];
                                        updateField('certifications', updated);
                                    }}
                                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
                                >
                                    <Plus className="w-4 h-4" /> Add Certification
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Portfolio */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-rose-500/20">
                                    <Briefcase className="w-5 h-5 text-rose-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Portfolio & Work Samples</h2>
                                    <p className="text-sm text-zinc-500">Showcase your best work</p>
                                </div>
                            </div>

                            <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-colors cursor-pointer">
                                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                                    <Plus className="w-8 h-8 text-zinc-500" />
                                </div>
                                <p className="text-white font-medium mb-1">Add Portfolio Item</p>
                                <p className="text-zinc-500 text-sm">Upload images, PDFs, or link to your work</p>
                            </div>

                            {/* Social Links */}
                            <div className="space-y-4 pt-6 border-t border-zinc-800">
                                <h3 className="text-white font-medium">Social & Portfolio Links</h3>
                                {(formData.socialLinks || []).map((link, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                                        <select
                                            value={link.platform}
                                            onChange={(e) => {
                                                const updated = [...(formData.socialLinks || [])];
                                                updated[index] = { ...updated[index], platform: e.target.value as 'github' | 'linkedin' | 'twitter' | 'dribbble' | 'behance' | 'website' | 'other' };
                                                updateField('socialLinks', updated);
                                            }}
                                            className="bg-zinc-700 text-white text-sm rounded px-2 py-1"
                                        >
                                            <option value="github">GitHub</option>
                                            <option value="linkedin">LinkedIn</option>
                                            <option value="twitter">Twitter/X</option>
                                            <option value="dribbble">Dribbble</option>
                                            <option value="behance">Behance</option>
                                            <option value="website">Website</option>
                                        </select>
                                        <input
                                            type="url"
                                            value={link.url}
                                            onChange={(e) => {
                                                const updated = [...(formData.socialLinks || [])];
                                                updated[index] = { ...updated[index], url: e.target.value };
                                                updateField('socialLinks', updated);
                                            }}
                                            placeholder="https://..."
                                            className="flex-1 bg-transparent text-white border-none focus:outline-none"
                                        />
                                        <button
                                            onClick={() => {
                                                const updated = (formData.socialLinks || []).filter((_, i) => i !== index);
                                                updateField('socialLinks', updated);
                                            }}
                                            className="text-zinc-500 hover:text-rose-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const updated = [...(formData.socialLinks || []), { platform: 'github' as const, url: '' }];
                                        updateField('socialLinks', updated);
                                    }}
                                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
                                >
                                    <Plus className="w-4 h-4" /> Add Link
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Verification */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-emerald-500/20">
                                    <Shield className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Identity Verification</h2>
                                    <p className="text-sm text-zinc-500">Verify your identity to build trust</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Email Verification */}
                                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-500/20">
                                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">Email Verified</p>
                                            <p className="text-zinc-500 text-sm">david.kim@email.com</p>
                                        </div>
                                    </div>
                                    <span className="text-emerald-400 text-sm font-medium">Verified</span>
                                </div>

                                {/* Phone Verification */}
                                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-500/20">
                                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">Phone Verified</p>
                                            <p className="text-zinc-500 text-sm">+1 *** *** **89</p>
                                        </div>
                                    </div>
                                    <span className="text-emerald-400 text-sm font-medium">Verified</span>
                                </div>

                                {/* ID Verification */}
                                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-amber-500/20">
                                            <AlertCircle className="w-5 h-5 text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">Government ID</p>
                                            <p className="text-zinc-500 text-sm">Enhanced verification for premium badge</p>
                                        </div>
                                    </div>
                                    <GlassButton variant="secondary" size="sm">Verify Now</GlassButton>
                                </div>

                                {/* Payment Method */}
                                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-zinc-700">
                                            <DollarSign className="w-5 h-5 text-zinc-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">Payment Method</p>
                                            <p className="text-zinc-500 text-sm">Connect to receive payments</p>
                                        </div>
                                    </div>
                                    <GlassButton variant="secondary" size="sm">Connect</GlassButton>
                                </div>
                            </div>

                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                <p className="text-indigo-400 text-sm">
                                    <strong>Tip:</strong> Verified profiles get 3x more client invitations and higher trust scores.
                                </p>
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
                        <GlassButton variant="ghost" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Draft'}
                        </GlassButton>
                        {currentStep < steps.length - 1 ? (
                            <GlassButton variant="primary" onClick={nextStep}>
                                Next <ChevronRight className="w-4 h-4 ml-2" />
                            </GlassButton>
                        ) : (
                            <GlassButton variant="primary" onClick={handleSave} disabled={saving}>
                                <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Profile'}
                            </GlassButton>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
