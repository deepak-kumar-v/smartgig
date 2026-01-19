'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/global/navbar';
import { Footer } from '@/components/global/footer';
import { GlassButton } from '@/components/ui/glass-button';
import { Check, Zap, Crown, Building2, Sparkles } from 'lucide-react';
import Link from 'next/link';

const pricingPlans = [
    {
        name: "Starter",
        icon: Zap,
        price: "Free",
        period: "forever",
        description: "Perfect for freelancers just getting started",
        features: [
            "Up to 5 proposals per month",
            "Basic profile page",
            "Access to public job listings",
            "Email support",
            "Community access"
        ],
        cta: "Get Started",
        popular: false,
        gradient: "from-blue-400 to-blue-600",
        glowColor: "rgba(59, 130, 246, 0.25)",
        iconBg: "bg-blue-500"
    },
    {
        name: "Pro",
        icon: Crown,
        price: "$29",
        period: "/month",
        description: "For serious freelancers ready to scale",
        features: [
            "Unlimited proposals",
            "Featured profile badge",
            "Priority in search results",
            "Advanced analytics",
            "Direct messaging",
            "Video portfolio support",
            "Priority support"
        ],
        cta: "Start Free Trial",
        popular: true,
        gradient: "from-violet-500 to-fuchsia-500",
        glowColor: "rgba(168, 85, 247, 0.35)",
        iconBg: "bg-gradient-to-br from-violet-500 to-fuchsia-500"
    },
    {
        name: "Enterprise",
        icon: Building2,
        price: "$99",
        period: "/month",
        description: "For agencies and large teams",
        features: [
            "Everything in Pro",
            "Team collaboration tools",
            "Custom branding",
            "Dedicated account manager",
            "API access",
            "Custom integrations",
            "SLA guarantee",
            "Bulk hiring tools"
        ],
        cta: "Contact Sales",
        popular: false,
        gradient: "from-emerald-400 to-teal-500",
        glowColor: "rgba(52, 211, 153, 0.25)",
        iconBg: "bg-emerald-500"
    }
];

function PricingCard({ plan, index }: { plan: typeof pricingPlans[0], index: number }) {
    const [isHovered, setIsHovered] = useState(false);
    const Icon = plan.icon;

    return (
        <div
            className="relative group perspective-1000"
            style={{
                transform: `translateY(${index === 1 ? '-20px' : '0'})`,
                zIndex: plan.popular ? 10 : 1
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Popular badge */}
            {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 blur-lg opacity-50" />
                        <span className="relative px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-bold flex items-center gap-2 shadow-xl">
                            <Sparkles className="w-4 h-4" /> Most Popular
                        </span>
                    </div>
                </div>
            )}

            {/* Main card - Shadcn-style sharp borders */}
            <div
                className={`
                    relative h-full rounded-xl overflow-hidden
                    border transition-all duration-300 ease-out
                    ${plan.popular
                        ? 'bg-zinc-900 border-violet-500/50'
                        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    }
                `}
                style={{
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                }}
            >

                <div className="relative p-8 flex flex-col h-full">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-5`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-1">{plan.name}</h3>
                    <p className="text-sm text-zinc-400 mb-6">{plan.description}</p>

                    {/* Price with gradient underline */}
                    <div className="mb-6">
                        <span className={`text-4xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                            {plan.price}
                        </span>
                        <span className="text-zinc-500 ml-1">{plan.period}</span>
                        <div className={`h-0.5 bg-gradient-to-r ${plan.gradient} rounded-full mt-2 w-16`} />
                    </div>

                    {/* Features list */}
                    <ul className="space-y-3 mb-8 flex-grow">
                        {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-sm text-zinc-300">
                                <Check className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-violet-400' : 'text-zinc-500'}`} />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTA Button - Premium style */}
                    <Link href="/register" className="block group">
                        <button
                            className={`
                                w-full py-3.5 px-4 rounded-lg font-medium text-sm transition-all duration-200
                                flex items-center justify-center gap-2
                                ${plan.popular
                                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500'
                                    : 'bg-zinc-800 text-zinc-100 border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-750'
                                }
                            `}
                        >
                            {plan.cta}
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* 3D Floating geometric elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {/* Gradient orbs */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-violet-500/15 rounded-full blur-3xl" />
                <div className="absolute bottom-32 right-20 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />
                <div className="absolute -bottom-20 left-1/2 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl" />

                {/* 3D Floating cube - top right */}
                <div
                    className="absolute top-32 right-[15%] w-16 h-16 border border-violet-500/50 rounded-xl backdrop-blur-sm shadow-2xl shadow-violet-500/20"
                    style={{
                        transform: 'perspective(500px) rotateX(15deg) rotateY(-15deg)',
                        animation: 'float 6s ease-in-out infinite',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)'
                    }}
                />

                {/* 3D Floating sphere - left side */}
                <div
                    className="absolute top-1/2 left-[10%] w-24 h-24 rounded-full"
                    style={{
                        background: 'radial-gradient(circle at 30% 30%, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 70%)',
                        animation: 'float 8s ease-in-out infinite reverse',
                        boxShadow: 'inset -10px -10px 30px rgba(0,0,0,0.2)'
                    }}
                />

                {/* 3D Ring - bottom left - REMOVED per user request */}

                {/* Small decorative dots */}
                <div className="absolute top-1/4 right-[25%] w-2 h-2 bg-violet-400/40 rounded-full" style={{ animation: 'pulse 3s infinite' }} />
                <div className="absolute top-[60%] right-[10%] w-3 h-3 bg-fuchsia-400/30 rounded-full" style={{ animation: 'pulse 4s infinite' }} />
                <div className="absolute bottom-[30%] left-[30%] w-2 h-2 bg-blue-400/40 rounded-full" style={{ animation: 'pulse 5s infinite' }} />
            </div>

            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20 relative z-10">
                {/* Header with glassmorphism */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-block mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 blur-xl opacity-30" />
                            <span className="relative inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-purple-400 text-sm font-medium">
                                <Sparkles className="w-4 h-4" />
                                Transparent Pricing
                            </span>
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                        Choose Your{' '}
                        <span className="relative inline-block">
                            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                                Perfect Plan
                            </span>
                            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 rounded-full opacity-50" />
                        </span>
                    </h1>

                    <p className="text-xl text-white/50 max-w-xl mx-auto">
                        Start free and scale as you grow. No hidden fees, cancel anytime.
                    </p>
                </div>

                {/* Pricing Cards with 3D perspective container */}
                <div
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start"
                    style={{ perspective: '1500px' }}
                >
                    {pricingPlans.map((plan, index) => (
                        <PricingCard key={plan.name} plan={plan} index={index} />
                    ))}
                </div>

                {/* Trust badges with glass effect */}
                <div className="mt-20 flex flex-wrap justify-center gap-8">
                    {['SSL Secured', '30-Day Guarantee', '24/7 Support', 'No Hidden Fees'].map((badge) => (
                        <div
                            key={badge}
                            className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white/60 text-sm flex items-center gap-2 hover:bg-white/10 transition-all duration-300"
                        >
                            <Check className="w-4 h-4 text-green-400" />
                            {badge}
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-16">
                    <p className="text-white/40">
                        Need a custom plan?{' '}
                        <Link href="/register" className="text-purple-400 hover:text-purple-300 underline underline-offset-4 transition-colors">
                            Contact our sales team
                        </Link>
                    </p>
                </div>
            </main>

            <Footer />

            {/* CSS Animations */}
            <style jsx global>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-30px) rotate(5deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.1; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.2; transform: translate(-50%, -50%) scale(1.1); }
                }
                @keyframes gradient-shift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .perspective-1000 {
                    perspective: 1000px;
                }
            `}</style>
        </div>
    );
}
