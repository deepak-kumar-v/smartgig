'use client';

import React, { useState, useTransition } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import {
    User, MapPin, DollarSign, Clock, Briefcase,
    Plus, Trash2, CheckCircle, AlertCircle,
    ChevronRight, ChevronLeft, Save, Star, X,
    GraduationCap, Globe
} from 'lucide-react';
import { updateFreelancerProfile } from '@/actions/profile-actions';
import { useRouter } from 'next/navigation';
import { getCurrencySymbol } from '@/lib/currency';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProfileData {
    name: string;
    image: string | null;
    title: string;
    bio: string;
    hourlyRate: number;
    availability: string;
    country: string;
    city: string;
    timezone: string;
    weeklyHours: number;
    experienceLevel: string;
    currency: string;
    education: string;
    experienceYears: number | null;
    experienceSummary: string;
    languages: string[];
    skills: string[];
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

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
                        <span className={`text-xs mt-2 ${index <= currentStep ? 'text-white' : 'text-zinc-500'}`}>
                            {step}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-4 ${index < currentStep ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Form
// ---------------------------------------------------------------------------

export function EditProfileForm({ initialData }: { initialData: ProfileData }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const steps = ['Personal', 'Professional', 'Background', 'Skills'];
    const [currentStep, setCurrentStep] = useState(0);

    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // Form state — initialized from real DB data
    const [title, setTitle] = useState(initialData.title);
    const [bio, setBio] = useState(initialData.bio);
    const [hourlyRate, setHourlyRate] = useState(initialData.hourlyRate);
    const [currency, setCurrency] = useState(initialData.currency);
    const [availability, setAvailability] = useState(initialData.availability);
    const [weeklyHours, setWeeklyHours] = useState(initialData.weeklyHours);
    const [experienceLevel, setExperienceLevel] = useState(initialData.experienceLevel);
    const [country, setCountry] = useState(initialData.country);
    const [city, setCity] = useState(initialData.city);
    const [timezone, setTimezone] = useState(initialData.timezone);

    // New structured fields
    const [education, setEducation] = useState(initialData.education);
    const [experienceYears, setExperienceYears] = useState<number | null>(initialData.experienceYears);
    const [experienceSummary, setExperienceSummary] = useState(initialData.experienceSummary);
    const [languages, setLanguages] = useState<string[]>(initialData.languages);
    const [languageInput, setLanguageInput] = useState('');

    // Skills
    const [skills, setSkills] = useState<string[]>(initialData.skills);
    const [skillInput, setSkillInput] = useState('');

    const addSkill = () => {
        const trimmed = skillInput.trim();
        if (trimmed && !skills.includes(trimmed)) {
            setSkills([...skills, trimmed]);
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        setSkills(skills.filter(s => s !== skill));
    };

    const addLanguage = () => {
        const trimmed = languageInput.trim();
        if (trimmed && !languages.includes(trimmed)) {
            setLanguages([...languages, trimmed]);
            setLanguageInput('');
        }
    };

    const removeLanguage = (lang: string) => {
        setLanguages(languages.filter(l => l !== lang));
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const handleSave = () => {
        setError('');
        setSaved(false);

        startTransition(async () => {
            const result = await updateFreelancerProfile({
                title,
                bio: bio || undefined,
                hourlyRate,
                availability,
                country: country || undefined,
                city: city || undefined,
                timezone: timezone || undefined,
                weeklyHours,
                experienceLevel,
                currency,
                education: education || undefined,
                experienceYears: experienceYears ?? undefined,
                experienceSummary: experienceSummary || undefined,
                languages,
                skills,
            });

            if (result.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
                router.refresh();
            } else {
                setError(result.error || 'Failed to save.');
            }
        });
    };

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
                        <p className="text-zinc-400">Complete your profile to attract more clients</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {saved && (
                            <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                <CheckCircle className="w-4 h-4" /> Changes saved
                            </div>
                        )}
                        {error && (
                            <div className="flex items-center gap-2 text-rose-400 text-sm max-w-xs truncate">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                            </div>
                        )}
                    </div>
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

                            {/* Avatar Preview */}
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                                    {initialData.image ? (
                                        <img src={initialData.image} alt={initialData.name} className="w-full h-full object-cover" />
                                    ) : (
                                        initialData.name?.charAt(0) || 'U'
                                    )}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{initialData.name}</p>
                                    <p className="text-sm text-zinc-500">Profile photo managed via account settings</p>
                                </div>
                            </div>

                            {/* Title / Headline */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Professional Headline *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Senior Full-Stack Developer | React Expert"
                                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                                />
                                <p className="text-xs text-zinc-500">This appears below your name in search results</p>
                            </div>

                            {/* Bio */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Bio</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                                    rows={5}
                                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                                />
                                <p className="text-xs text-zinc-500">{bio.length}/2000 characters</p>
                            </div>

                            {/* Location */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">Country</label>
                                    <input
                                        type="text"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        placeholder="e.g., United States"
                                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">City</label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="e.g., San Francisco"
                                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Timezone */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Timezone</label>
                                <input
                                    type="text"
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    placeholder="e.g., America/New_York"
                                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                                />
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
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">{getCurrencySymbol(currency)}</span>
                                        <input
                                            type="number"
                                            value={hourlyRate}
                                            onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                                            className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">Currency</label>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="USD">USD - US Dollar</option>
                                        <option value="EUR">EUR - Euro</option>
                                        <option value="GBP">GBP - British Pound</option>
                                        <option value="INR">INR - Indian Rupee</option>
                                        <option value="CAD">CAD - Canadian Dollar</option>
                                        <option value="AUD">AUD - Australian Dollar</option>
                                    </select>
                                </div>
                            </div>

                            {/* Availability Status */}
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
                                            type="button"
                                            onClick={() => setAvailability(option.value)}
                                            className={`p-4 rounded-xl border transition-all ${availability === option.value
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
                                        value={weeklyHours}
                                        onChange={(e) => setWeeklyHours(parseInt(e.target.value))}
                                        className="flex-1 h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                                    />
                                    <span className="text-white font-bold w-20 text-center">{weeklyHours}h/week</span>
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
                                            type="button"
                                            onClick={() => setExperienceLevel(option.value)}
                                            className={`p-4 rounded-xl border text-left transition-all ${experienceLevel === option.value
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
                        </div>
                    )}

                    {/* Step 3: Background */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-violet-500/20">
                                    <GraduationCap className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Background</h2>
                                    <p className="text-sm text-zinc-500">Education, experience, and languages</p>
                                </div>
                            </div>

                            {/* Education */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Education</label>
                                <input
                                    type="text"
                                    value={education}
                                    onChange={(e) => setEducation(e.target.value)}
                                    placeholder="e.g., B.Tech Computer Science - IIT"
                                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            {/* Experience Years */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">Years of Experience</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={experienceYears ?? ''}
                                        onChange={(e) => setExperienceYears(e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder="e.g., 3"
                                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Experience Summary */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Experience Summary</label>
                                <textarea
                                    value={experienceSummary}
                                    onChange={(e) => setExperienceSummary(e.target.value)}
                                    placeholder="Briefly describe your professional experience and key achievements..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                                />
                                <p className="text-xs text-zinc-500">{experienceSummary.length}/1000 characters</p>
                            </div>

                            {/* Languages */}
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Languages</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={languageInput}
                                        onChange={(e) => setLanguageInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addLanguage();
                                            }
                                        }}
                                        placeholder="Type a language and press Enter"
                                        className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={addLanguage}
                                        className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                {languages.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {languages.map((lang) => (
                                            <span
                                                key={lang}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 text-violet-300 rounded-lg text-sm border border-violet-500/30"
                                            >
                                                <Globe className="w-3.5 h-3.5" />
                                                {lang}
                                                <button
                                                    type="button"
                                                    onClick={() => removeLanguage(lang)}
                                                    className="hover:text-white transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Skills */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-cyan-500/20">
                                    <Star className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Skills & Expertise</h2>
                                    <p className="text-sm text-zinc-500">Add your skills to match with relevant jobs</p>
                                </div>
                            </div>

                            {/* Add Skill Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addSkill();
                                        }
                                    }}
                                    placeholder="Type a skill and press Enter"
                                    className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                    type="button"
                                    onClick={addSkill}
                                    className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Current Skills */}
                            {skills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((skill) => (
                                        <span
                                            key={skill}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm border border-indigo-500/30"
                                        >
                                            {skill}
                                            <button
                                                type="button"
                                                onClick={() => removeSkill(skill)}
                                                className="hover:text-white transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 border-2 border-dashed border-zinc-700 rounded-xl text-center">
                                    <Briefcase className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                                    <p className="text-zinc-400 text-sm">No skills added yet. Start typing above.</p>
                                </div>
                            )}

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
                        <GlassButton variant="ghost" onClick={handleSave} disabled={isPending}>
                            {isPending ? 'Saving...' : 'Save Draft'}
                        </GlassButton>
                        {currentStep < steps.length - 1 ? (
                            <GlassButton variant="primary" onClick={nextStep}>
                                Next <ChevronRight className="w-4 h-4 ml-2" />
                            </GlassButton>
                        ) : (
                            <GlassButton variant="primary" onClick={handleSave} disabled={isPending}>
                                <Save className="w-4 h-4 mr-2" /> {isPending ? 'Saving...' : 'Save Profile'}
                            </GlassButton>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
