'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { Layers, Shield, Zap, Briefcase, Users, Lock, TrendingUp, Award } from 'lucide-react';

const features = [
    {
        icon: Shield,
        title: "Escrow-First Payments",
        description: "Funds are held securely in our smart vault. Released only when you approve the work.",
        color: "text-green-400"
    },
    {
        icon: Award,
        title: "Proof-of-Work Hiring",
        description: "Don't guess. Hire based on verified portfolio samples & paid trial tasks.",
        color: "text-indigo-400"
    },
    {
        icon: TrendingUp,
        title: "Career Growth Analytics",
        description: "Freelancers get deep insights into income consistency and skill progression.",
        color: "text-purple-400"
    },
    {
        icon: Zap,
        title: "AI Matchmaking",
        description: "Our neural engine analyzes thousands of data points to find your perfect match.",
        color: "text-yellow-400"
    },
    {
        icon: Lock,
        title: "Identity Verification",
        description: "Multi-layer ID checks and behavioral risk scoring for maximum safety.",
        color: "text-cyan-400"
    },
    {
        icon: Users,
        title: "Reverse Hiring",
        description: "Top talent posts 'Open to Work' signals. Employers apply to them.",
        color: "text-rose-400"
    }
];

export function FeaturesSection() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <ScrollReveal>
                        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                            Everything you need. <br />
                            <span className="text-white/40">Nothing you don't.</span>
                        </h2>
                    </ScrollReveal>
                    <ScrollReveal delay={0.2}>
                        <p className="text-white/60 text-lg">
                            SmartGIG reimagines the freelancing stack with safety and quality at the core.
                        </p>
                    </ScrollReveal>
                </div>

                <ScrollReveal
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    stagger={0.15}
                >
                    {features.map((feature, idx) => (
                        <GlassCard key={idx} variant="hoverable" className="h-full p-8 flex flex-col items-start gap-10 group">
                            <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                                <feature.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-white/50 leading-relaxed text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        </GlassCard>
                    ))}
                </ScrollReveal>
            </div>
        </section>
    );
}
