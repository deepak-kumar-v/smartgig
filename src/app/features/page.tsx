import React from 'react';
import { Navbar } from '@/components/global/navbar';
import { Footer } from '@/components/global/footer';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import Link from 'next/link';
import {
    Shield, Zap, Clock, DollarSign, Users, MessageSquare,
    FileCheck, Star, Lock, Globe, Smartphone, BarChart3,
    CheckCircle, ArrowRight, Sparkles, Target, AlertTriangle,
    UserCheck, Briefcase, TrendingUp, Scale, Eye, Award,
    Fingerprint, Ban, FileText, Layers
} from 'lucide-react';

// Core SmartGIG Features from specifications
const coreFeatures = [
    {
        icon: DollarSign,
        title: 'Secure Escrow with 48-Hour Disputes',
        description: 'Industry-standard escrow protection with a twist: disputes are resolved within 48 hours, not weeks. Clear milestone approvals with automated releases upon completion.',
        color: 'from-emerald-500 to-teal-500',
        details: [
            '48-hour dispute resolution guarantee',
            'Stage-by-stage milestone releases',
            'Automated payment on approval',
            'Dedicated resolution specialists'
        ]
    },
    {
        icon: FileCheck,
        title: 'Skill Validation Through Work Samples',
        description: 'Move beyond profile claims. Freelancers demonstrate real skills through verified portfolio items and work samples that are reviewed and validated by our team.',
        color: 'from-blue-500 to-cyan-500',
        details: [
            'Upload verified work samples',
            'Portfolio review and validation',
            'Skill badges based on proven work',
            'Client-verified project outcomes'
        ]
    },
    {
        icon: Shield,
        title: 'Freelancer Workload Protection',
        description: 'Prevent burnout and ensure transparency. Freelancers control their capacity, while employers see real-time workload data that cannot be manipulated.',
        color: 'from-violet-500 to-fuchsia-500',
        details: [
            'Transparent "Current Projects" count (immutable)',
            'Set maximum concurrent projects limit',
            'Real-time workload visible to employers',
            'Automatic capacity warnings & analytics'
        ]
    },
    {
        icon: Target,
        title: 'Proof-of-Work Based Hiring',
        description: 'Small paid trial tasks secured via escrow validate freelancer capability before full project commitment. Reduce hiring risk and build trust from day one.',
        color: 'from-amber-500 to-orange-500',
        details: [
            'Paid micro-tasks before hiring',
            'Escrow-protected trial payments',
            'Skill verification in action',
            'Risk-free hiring decisions'
        ]
    },
    {
        icon: UserCheck,
        title: 'Curated "Open to Work" Profiles',
        description: 'Unlike generic marketplaces, top freelancers can flip the script: publish what you want to work on and let pre-screened employers come to you with matching projects.',
        color: 'from-pink-500 to-rose-500',
        details: [
            'Define your ideal project criteria',
            'Receive filtered employer applications',
            'Employers must meet your requirements',
            'Negotiate from a position of strength'
        ]
    },
    {
        icon: BarChart3,
        title: 'Multi-Dimensional Reputation',
        description: 'Trust scoring beyond simple stars. We measure delivery timeliness, communication quality, revision handling, and payment fairness for complete transparency.',
        color: 'from-indigo-500 to-purple-500',
        details: [
            'Delivery timeliness tracking',
            'Communication quality scores',
            'Revision handling metrics',
            'Payment fairness ratings'
        ]
    },
    {
        icon: TrendingUp,
        title: 'Career Growth Analytics',
        description: 'Comprehensive dashboards showing income consistency, skill progression, workload balance, and career trajectory insights to help freelancers grow.',
        color: 'from-cyan-500 to-blue-500',
        details: [
            'Income trend visualization',
            'Skill progression tracking',
            'Workload balance metrics',
            'Career trajectory insights'
        ]
    },
    {
        icon: Ban,
        title: 'Multi-Layer Violation System',
        description: 'Advanced protection against bad actors. We use device fingerprinting to detect ban evasion and enforce a fair, transparent n-strike system.',
        color: 'from-rose-500 to-red-500',
        details: [
            'Device Ban Evasion Detection',
            'Progressive penalty system',
            'Transparent strike tracking',
            'Fair appeal mechanisms'
        ]
    },
];

// Additional Platform Features
const additionalFeatures = [
    { icon: MessageSquare, title: 'Real-Time Messaging', description: 'Built-in chat with file sharing & video calls' },
    { icon: Lock, title: 'NDA Templates', description: 'One-click NDA protection for sensitive projects' },
    { icon: Globe, title: 'Global Payments', description: 'Accept payments in 50+ currencies worldwide' },
    { icon: Fingerprint, title: 'Device Fingerprinting', description: 'Hardware-level analysis to prevent fraud and multi-accounting' },
    { icon: Eye, title: 'Behavioral Analysis', description: 'AI-powered risk detection and fraud prevention' },
    { icon: Award, title: 'Skill Badges', description: 'Earn verified badges for demonstrated expertise' },
    { icon: Scale, title: 'Dispute Resolution', description: '48-hour resolution with dedicated support' },
    { icon: Layers, title: 'Project Templates', description: 'Pre-built milestone structures for common projects' },
];

// Comparison with traditional platforms - HONEST comparison
const comparisonData = [
    { feature: 'Dispute Resolution', smartgig: '48 hours', others: '7-14 days' },
    { feature: 'Ban Evasion Detection', smartgig: '✓ Device Fingerprinting', others: '✗ IP-based only' },
    { feature: 'Current Workload Visible', smartgig: '✓ Transparent to clients', others: '✗ Hidden' },
    { feature: 'Trial Tasks', smartgig: '✓ Formal + escrow', others: '✗ Informal only' },
    { feature: 'Reputation Dimensions', smartgig: '4 separate metrics', others: 'Single score' },
    { feature: 'Strike Transparency', smartgig: 'Full visibility + appeals', others: 'Opaque bans' },
    { feature: 'Career Analytics', smartgig: 'Growth tracking', others: 'Basic earnings' },
    { feature: 'Platform Fee', smartgig: '10%', others: '20% (Upwork)' },
];

function FeatureCard({ feature, index }: { feature: typeof coreFeatures[0]; index: number }) {
    const Icon = feature.icon;
    return (
        <GlassCard className="p-8 hover:border-violet-500/30 transition-all duration-300 group h-full">
            {/* Feature Number */}
            <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-5xl font-bold text-zinc-800 group-hover:text-zinc-700 transition-colors">
                    0{index + 1}
                </span>
            </div>

            {/* Content */}
            <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
            <p className="text-zinc-400 mb-6 leading-relaxed">{feature.description}</p>

            {/* Details */}
            <ul className="space-y-2">
                {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-zinc-300">
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        {detail}
                    </li>
                ))}
            </ul>
        </GlassCard>
    );
}

function SmallFeatureCard({ feature }: { feature: typeof additionalFeatures[0] }) {
    const Icon = feature.icon;
    return (
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors group">
            <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20 transition-colors">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-medium text-white mb-1">{feature.title}</h4>
                    <p className="text-sm text-zinc-500">{feature.description}</p>
                </div>
            </div>
        </div>
    );
}

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-fuchsia-500/5 rounded-full blur-3xl" />
            </div>

            <Navbar />

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="container mx-auto px-6 pt-32 pb-20">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            What Makes SmartGIG Different
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                            Features Built for{' '}
                            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                                Real Freelancers
                            </span>
                        </h1>

                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
                            We&apos;ve reimagined freelancing from the ground up. Every feature is designed to
                            protect both parties, ensure fair treatment, and help careers grow.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <Link href="/register">
                                <GlassButton variant="primary" className="px-8 py-4 text-base">
                                    Start Free Today
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </GlassButton>
                            </Link>
                            <Link href="/explore">
                                <GlassButton variant="secondary" className="px-8 py-4 text-base">
                                    Explore Platform
                                </GlassButton>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Core Features Grid */}
                <section className="container mx-auto px-6 py-20">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Core Features Done Right</h2>
                        <p className="text-zinc-400 max-w-xl mx-auto">
                            We took what works elsewhere and made it better. Plus added what others are missing.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                        {coreFeatures.map((feature, idx) => (
                            <FeatureCard key={idx} feature={feature} index={idx} />
                        ))}
                    </div>
                </section>

                {/* How It Works - Visual Flow */}
                <section className="container mx-auto px-6 py-20">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-white mb-4">How SmartGIG Protects You</h2>
                            <p className="text-zinc-400">A complete safety net for every project</p>
                        </div>

                        <div className="relative">
                            {/* Connection Line */}
                            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-fuchsia-500 to-emerald-500 hidden md:block" />

                            <div className="space-y-8">
                                {[
                                    { step: '1', title: 'Skill Validation', desc: 'Freelancers verify skills through work samples before getting hired', icon: FileCheck },
                                    { step: '2', title: 'Trial Task', desc: 'Optional paid mini-project to test collaboration before commitment', icon: Target },
                                    { step: '3', title: 'Escrow Deposit', desc: 'Client deposits funds into secure escrow before work begins', icon: Lock },
                                    { step: '4', title: 'Milestone Work', desc: 'Freelancer completes work in approved milestone stages', icon: Layers },
                                    { step: '5', title: 'Review & Release', desc: 'Client approves milestones, funds released automatically', icon: CheckCircle },
                                    { step: '6', title: 'Reputation Update', desc: 'Multi-dimensional ratings update for both parties', icon: Star },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-6 relative">
                                        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 z-10">
                                            <item.icon className="w-6 h-6 text-violet-400" />
                                        </div>
                                        <div className="pt-2">
                                            <h4 className="text-lg font-semibold text-white mb-1">
                                                Step {item.step}: {item.title}
                                            </h4>
                                            <p className="text-zinc-400">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Additional Features */}
                <section className="container mx-auto px-6 py-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">Plus Everything Else You Need</h2>
                        <p className="text-zinc-400">Additional tools to power your freelance business</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
                        {additionalFeatures.map((feature, idx) => (
                            <SmallFeatureCard key={idx} feature={feature} />
                        ))}
                    </div>
                </section>

                {/* Comparison Table */}
                <section className="container mx-auto px-6 py-20">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-white mb-4">SmartGIG vs Traditional Platforms</h2>
                            <p className="text-zinc-400">See the difference quality features make</p>
                        </div>

                        <GlassCard className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-zinc-800">
                                            <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Feature</th>
                                            <th className="text-center px-6 py-4">
                                                <span className="text-violet-400 font-semibold">SmartGIG</span>
                                            </th>
                                            <th className="text-center px-6 py-4 text-sm font-medium text-zinc-500">Others</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {comparisonData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-900/50">
                                                <td className="px-6 py-4 text-white">{row.feature}</td>
                                                <td className="px-6 py-4 text-center text-emerald-400 font-medium">{row.smartgig}</td>
                                                <td className="px-6 py-4 text-center text-zinc-500">{row.others}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="container mx-auto px-6 py-20">
                    <GlassCard className="p-12 text-center max-w-3xl mx-auto bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20">
                        <h2 className="text-3xl font-bold text-white mb-4">Ready to Experience the Difference?</h2>
                        <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
                            Join thousands of freelancers and clients who trust SmartGIG for fair, protected,
                            and transparent freelancing.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <Link href="/register">
                                <GlassButton variant="primary" className="px-8 py-4">
                                    Create Free Account
                                </GlassButton>
                            </Link>
                            <Link href="/pricing">
                                <GlassButton variant="secondary" className="px-8 py-4">
                                    View Pricing
                                </GlassButton>
                            </Link>
                        </div>
                    </GlassCard>
                </section>
            </main>

            <Footer />
        </div>
    );
}
