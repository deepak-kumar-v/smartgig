'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassTextarea } from '@/components/ui/glass-textarea';
import Link from 'next/link';
import {
    Building, Globe, Briefcase, Users, MapPin, CreditCard,
    Upload, Save, ChevronRight, CheckCircle, ArrowLeft, Camera,
    UserCircle, ShieldCheck, Mail, Phone, BadgeCheck, AlertCircle, Plus, X
} from 'lucide-react';
import { updateClientProfile } from '@/app/actions/client';

const industries = [
    'Technology', 'Finance', 'Healthcare', 'E-Commerce', 'Education',
    'Marketing', 'Media & Entertainment', 'Consulting', 'Manufacturing', 'Other'
];

const companySizes = [
    { value: '1', label: 'Just me' },
    { value: '2-10', label: '2-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '500+', label: '500+ employees' },
];

const availableLanguages = [
    'English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Korean', 'Hindi', 'Arabic', 'Portuguese'
];

interface FormData {
    // Company Identity
    companyName: string;
    website: string;
    industry: string;
    companySize: string;
    description: string;
    logoUrl: string;
    estYear: string;

    // Employer Profile
    employerRole: string; // My Role
    languages: string[];
    hiringPreferences: string[];

    // Location
    country: string;
    city: string;
    timezone: string;

    // Billing Profile
    billingStreet: string;
    billingCity: string;
    billingState: string;
    billingPostalCode: string;
    billingCountry: string;
    taxId: string;
    invoiceEmail: string;

    // Contact (kept for consistency with backend, though less emphasized in UI)
    contactEmail: string;
    contactPhone: string;
}

export default function ClientProfileEditPage() {
    const [currentSection, setCurrentSection] = useState(0);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Mock initial data
    const [formData, setFormData] = useState<FormData>({
        companyName: 'TechCorp Solutions',
        website: 'https://techcorp.example.com',
        industry: 'Technology',
        companySize: '51-200',
        description: 'We build innovative software solutions for enterprise clients, focusing on scalability and user experience.',
        logoUrl: '',
        estYear: '2018',
        employerRole: 'Senior HR Manager',
        languages: ['English', 'Spanish'],
        hiringPreferences: ['Remote Only', 'Fixed Price'],
        country: 'United States',
        city: 'New York',
        timezone: 'America/New_York',
        billingStreet: '123 Business Ave',
        billingCity: 'New York',
        billingState: 'NY',
        billingPostalCode: '10001',
        billingCountry: 'United States',
        taxId: 'US-12-3456789',
        invoiceEmail: 'billing@techcorp.example.com',
        contactEmail: 'sarah.chen@techcorp.example.com',
        contactPhone: '+1 555-123-4567',
    });

    const [newLanguage, setNewLanguage] = useState('');
    const [newPreference, setNewPreference] = useState('');

    const updateField = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const addLanguage = (lang: string) => {
        if (lang && !formData.languages.includes(lang)) {
            updateField('languages', [...formData.languages, lang]);
        }
        setNewLanguage('');
    };

    const removeLanguage = (lang: string) => {
        updateField('languages', formData.languages.filter(l => l !== lang));
    };

    const addPreference = () => {
        if (newPreference && !formData.hiringPreferences.includes(newPreference)) {
            updateField('hiringPreferences', [...formData.hiringPreferences, newPreference]);
            setNewPreference('');
        }
    };

    const removePreference = (pref: string) => {
        updateField('hiringPreferences', formData.hiringPreferences.filter(p => p !== pref));
    };

    const sections = [
        { id: 'company', label: 'Company Identity', icon: Building },
        { id: 'profile', label: 'Employer Profile', icon: UserCircle },
        { id: 'location', label: 'Location', icon: MapPin },
        { id: 'billing', label: 'Billing & Verification', icon: ShieldCheck },
    ];

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateClientProfile(formData);
            if (result.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                console.error("Validation error:", result.error);
                // In a real app, we'd show field-level errors here
            }
        } catch (error) {
            console.error("Failed to save:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/client/dashboard" className="text-zinc-500 hover:text-white text-sm inline-flex items-center gap-1 mb-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
                        <p className="text-zinc-400">Manage your company identity and settings</p>
                    </div>
                    <GlassButton
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            'Saving...'
                        ) : saved ? (
                            <><CheckCircle className="w-4 h-4 mr-2" /> Saved</>
                        ) : (
                            <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                        )}
                    </GlassButton>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-2 bg-zinc-900/50 rounded-xl p-2 overflow-x-auto">
                    {sections.map((section, index) => (
                        <button
                            key={section.id}
                            onClick={() => setCurrentSection(index)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${currentSection === index
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                        >
                            <section.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{section.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="min-h-[500px]">
                    {/* 1. Company Identity Section */}
                    {currentSection === 0 && (
                        <GlassCard className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
                                    <Building className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Company Identity</h2>
                                    <p className="text-zinc-400">Your business presence on SmartGIG</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Logo Upload */}
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-white/5">
                                    <div className="relative group cursor-pointer">
                                        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                                            {formData.companyName ? formData.companyName.charAt(0) : 'C'}
                                        </div>
                                        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                        <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg">
                                            <Upload className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <h3 className="text-lg font-medium text-white">Company Logo</h3>
                                        <p className="text-zinc-500 text-sm mt-1 mb-3 max-w-xs">
                                            Upload a professional logo to build trust. Recommended size: 400x400px.
                                        </p>
                                        <div className="flex gap-2 justify-center sm:justify-start">
                                            <GlassButton variant="secondary" size="sm">Remove</GlassButton>
                                            <GlassButton variant="ghost" size="sm">Upload New</GlassButton>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-zinc-300 text-sm font-medium">Company Name *</label>
                                        <GlassInput
                                            value={formData.companyName}
                                            onChange={(e) => updateField('companyName', e.target.value)}
                                            placeholder="e.g. Acme Corp"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-zinc-300 text-sm font-medium">Website</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <GlassInput
                                                value={formData.website}
                                                onChange={(e) => updateField('website', e.target.value)}
                                                placeholder="https://example.com"
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-zinc-300 text-sm font-medium">Industry *</label>
                                        <select
                                            value={formData.industry}
                                            onChange={(e) => updateField('industry', e.target.value)}
                                            className="w-full bg-zinc-900/50 border border-white/10 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
                                        >
                                            <option value="">Select industry</option>
                                            {industries.map(ind => (
                                                <option key={ind} value={ind}>{ind}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-zinc-300 text-sm font-medium">Size *</label>
                                            <select
                                                value={formData.companySize}
                                                onChange={(e) => updateField('companySize', e.target.value)}
                                                className="w-full bg-zinc-900/50 border border-white/10 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
                                            >
                                                <option value="">Select size</option>
                                                {companySizes.map(size => (
                                                    <option key={size.value} value={size.value}>{size.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-zinc-300 text-sm font-medium">Est. Year</label>
                                            <GlassInput
                                                value={formData.estYear}
                                                onChange={(e) => updateField('estYear', e.target.value)}
                                                placeholder="YYYY"
                                                maxLength={4}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-zinc-300 text-sm font-medium">Company Description</label>
                                    <GlassTextarea
                                        value={formData.description}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('description', e.target.value)}
                                        placeholder="Tell freelancers about your mission, culture, and what you do..."
                                        rows={5}
                                    />
                                    <p className="text-zinc-500 text-xs text-right">{formData.description.length}/1000</p>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {/* 2. Employer Profile Section */}
                    {currentSection === 1 && (
                        <GlassCard className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 rounded-xl bg-pink-500/20 border border-pink-500/30">
                                    <UserCircle className="w-6 h-6 text-pink-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Employer Profile</h2>
                                    <p className="text-zinc-400">Your personal role and hiring preferences</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-zinc-300 text-sm font-medium">Your Role in Company *</label>
                                        <GlassInput
                                            value={formData.employerRole}
                                            onChange={(e) => updateField('employerRole', e.target.value)}
                                            placeholder="e.g. HR Manager, CEO, Project Owner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-zinc-300 text-sm font-medium">Contact Email (Private)</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <GlassInput
                                                value={formData.contactEmail}
                                                readOnly
                                                className="pl-10 bg-zinc-900/30 text-zinc-400 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Languages */}
                                <div className="space-y-3">
                                    <label className="text-zinc-300 text-sm font-medium">Languages you speak</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.languages.map(lang => (
                                            <div key={lang} className="bg-zinc-800 text-zinc-100 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-zinc-700">
                                                {lang}
                                                <button onClick={() => removeLanguage(lang)} className="hover:text-pink-500"><X className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 max-w-sm">
                                        <select
                                            value={newLanguage}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setNewLanguage(val);
                                                addLanguage(val);
                                            }}
                                            className="w-full bg-zinc-900/50 border border-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-pink-500 transition-all appearance-none text-sm"
                                        >
                                            <option value="">Add a language...</option>
                                            {availableLanguages.filter(l => !formData.languages.includes(l)).map(l => (
                                                <option key={l} value={l}>{l}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Hiring Preferences */}
                                <div className="space-y-3">
                                    <label className="text-zinc-300 text-sm font-medium">Hiring Preferences & Requirements</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.hiringPreferences.map(pref => (
                                            <div key={pref} className="bg-indigo-500/10 text-indigo-200 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-indigo-500/20">
                                                {pref}
                                                <button onClick={() => removePreference(pref)} className="hover:text-white"><X className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 max-w-sm">
                                        <GlassInput
                                            value={newPreference}
                                            onChange={(e) => setNewPreference(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addPreference()}
                                            placeholder="Type and press Enter (e.g. 'Agile', 'Jira')"
                                            className="h-10 text-sm"
                                        />
                                        <GlassButton onClick={addPreference} variant="secondary" size="sm" disabled={!newPreference}>
                                            <Plus className="w-4 h-4" />
                                        </GlassButton>
                                    </div>
                                    <p className="text-xs text-zinc-500">Add keywords about your workflow, tools, or preferred freelancer qualities.</p>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {/* 3. Location Section */}
                    {currentSection === 2 && (
                        <GlassCard className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                                    <MapPin className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Location & Timezone</h2>
                                    <p className="text-zinc-400">Where are you located?</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-zinc-300 text-sm font-medium">Country *</label>
                                    <select
                                        value={formData.country}
                                        onChange={(e) => updateField('country', e.target.value)}
                                        className="w-full bg-zinc-900/50 border border-white/10 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
                                    >
                                        <option value="United States">United States</option>
                                        <option value="United Kingdom">United Kingdom</option>
                                        <option value="Canada">Canada</option>
                                        <option value="Australia">Australia</option>
                                        <option value="Germany">Germany</option>
                                        <option value="India">India</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-zinc-300 text-sm font-medium">City</label>
                                    <GlassInput
                                        value={formData.city}
                                        onChange={(e) => updateField('city', e.target.value)}
                                        placeholder="City"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-zinc-300 text-sm font-medium">Timezone *</label>
                                    <select
                                        value={formData.timezone}
                                        onChange={(e) => updateField('timezone', e.target.value)}
                                        className="w-full bg-zinc-900/50 border border-white/10 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
                                    >
                                        <option value="America/New_York">Eastern Time (ET)</option>
                                        <option value="America/Chicago">Central Time (CT)</option>
                                        <option value="America/Denver">Mountain Time (MT)</option>
                                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                        <option value="Europe/London">London (GMT)</option>
                                        <option value="Europe/Paris">Central European (CET)</option>
                                        <option value="Asia/Kolkata">India (IST)</option>
                                    </select>
                                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                                        <Globe className="w-3 h-3" />
                                        Current time in your timezone: {new Date().toLocaleTimeString('en-US', { timeZone: formData.timezone || 'UTC' })}
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {/* 4. Billing & Verification Section */}
                    {currentSection === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <GlassCard className="p-6 md:p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 rounded-xl bg-violet-500/20 border border-violet-500/30">
                                        <CreditCard className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Billing Information</h2>
                                        <p className="text-zinc-400">Manage your invoicing details</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-zinc-300 text-sm font-medium">Billing Address</label>
                                        <GlassInput
                                            value={formData.billingStreet}
                                            onChange={(e) => updateField('billingStreet', e.target.value)}
                                            placeholder="Street Address"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <GlassInput
                                            value={formData.billingCity}
                                            onChange={(e) => updateField('billingCity', e.target.value)}
                                            placeholder="City"
                                        />
                                        <GlassInput
                                            value={formData.billingState}
                                            onChange={(e) => updateField('billingState', e.target.value)}
                                            placeholder="State/Province"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <GlassInput
                                            value={formData.billingPostalCode}
                                            onChange={(e) => updateField('billingPostalCode', e.target.value)}
                                            placeholder="Postal Code"
                                        />
                                        <select
                                            value={formData.billingCountry}
                                            onChange={(e) => updateField('billingCountry', e.target.value)}
                                            className="w-full bg-zinc-900/50 border border-white/10 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all appearance-none"
                                        >
                                            <option value="United States">United States</option>
                                            <option value="United Kingdom">United Kingdom</option>
                                            <option value="Canada">Canada</option>
                                        </select>
                                    </div>

                                    <div className="border-t border-white/5 my-4"></div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-zinc-300 text-sm font-medium">Tax ID (VAT / GST / EIN)</label>
                                            <GlassInput
                                                value={formData.taxId}
                                                onChange={(e) => updateField('taxId', e.target.value)}
                                                placeholder="Optional"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-zinc-300 text-sm font-medium">Invoice Email</label>
                                            <GlassInput
                                                value={formData.invoiceEmail}
                                                onChange={(e) => updateField('invoiceEmail', e.target.value)}
                                                placeholder="Where to send invoices"
                                                type="email"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>

                            <GlassCard className="p-6 md:p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
                                        <BadgeCheck className="w-6 h-6 text-orange-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Trust & Verification</h2>
                                        <p className="text-zinc-400">Verified profiles attract 3x more proposals</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Email Verification */}
                                    <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/30 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">Email Address</p>
                                                <p className="text-xs text-green-400">Verified</p>
                                            </div>
                                        </div>
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>

                                    {/* Phone Verification */}
                                    <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/30 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">Phone Number</p>
                                                <p className="text-xs text-green-400">Verified</p>
                                            </div>
                                        </div>
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>

                                    {/* Payment Verification */}
                                    <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/30 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                                                <CreditCard className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">Payment Method</p>
                                                <p className="text-xs text-green-400">Verified</p>
                                            </div>
                                        </div>
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>

                                    {/* Identity Verification */}
                                    <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/30 flex items-center justify-between opacity-80">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-zinc-700/50 text-zinc-400">
                                                <ShieldCheck className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">Identity Check</p>
                                                <p className="text-xs text-zinc-500">Not Requested</p>
                                            </div>
                                        </div>
                                        <GlassButton variant="secondary" size="sm">Verify Now</GlassButton>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="flex justify-between pt-4 border-t border-white/5">
                    <GlassButton
                        variant="secondary"
                        onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
                        disabled={currentSection === 0}
                    >
                        Previous
                    </GlassButton>
                    {currentSection < sections.length - 1 ? (
                        <GlassButton
                            variant="primary"
                            onClick={() => setCurrentSection(prev => Math.min(sections.length - 1, prev + 1))}
                        >
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </GlassButton>
                    ) : (
                        <GlassButton variant="primary" onClick={handleSave} disabled={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Profile'}
                        </GlassButton>
                    )}
                </div>
            </div>
        </>
    );
}
