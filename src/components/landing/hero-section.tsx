'use client';

import React, { useRef, useLayoutEffect } from 'react';
import { HeroScene } from '@/components/3d/hero-scene';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassCard } from '@/components/ui/glass-card';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, Zap, Globe } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null);

    // Use useLayoutEffect for GSAP to avoid hydration mismatch
    useLayoutEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
            // Intro Animation
            const tl = gsap.timeline();
            tl.from(".hero-text", {
                y: 100,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: "power3.out"
            })
                .from(".hero-card", {
                    y: 50,
                    opacity: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "back.out(1.7)"
                }, "-=0.5");

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
            {/* 3D Background - Disabled for stability */}
            {/* <HeroScene /> */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-900/20 via-black to-cyan-900/20 pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Text Content */}
                    <div className="max-w-2xl">
                        <div className="hero-text inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6 backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            SmartGIG v1.0 Live
                        </div>

                        <h1 className="hero-text font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Future</span> of <br />
                            Freelance Work.
                        </h1>

                        <p className="hero-text text-lg text-white/60 mb-8 leading-relaxed max-w-lg">
                            SmartGIG is the first AI-enabled ecosystem connecting elite talent with proof-of-work hiring. Secure escrow, trust scoring, and zero friction.
                        </p>

                        <div className="hero-text flex flex-wrap gap-4">
                            <GlassButton size="lg" className="bg-white text-black hover:bg-white/90">
                                Find Talent
                            </GlassButton>
                            <GlassButton size="lg" variant="outline">
                                Find Work
                            </GlassButton>
                        </div>

                        <div className="hero-text mt-12 flex items-center gap-8 text-white/40 text-sm font-medium">
                            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Escrow Secured</span>
                            <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> AI Matching</span>
                            <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> Global Talent</span>
                        </div>
                    </div>

                    {/* Floating UI Cards (Visuals) */}
                    <div className="relative hidden lg:block h-[600px]">
                        {/* Abstract Composition of cards representing app features */}

                        {/* Card 1: Profile Snippet */}
                        <motion.div
                            className="hero-card absolute top-20 right-20 w-72 z-20"
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <GlassCard variant="hoverable" className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500" />
                                    <div>
                                        <div className="h-2 w-24 bg-white/20 rounded mb-1" />
                                        <div className="h-2 w-16 bg-white/10 rounded" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-white/5 rounded" />
                                    <div className="h-2 w-5/6 bg-white/5 rounded" />
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <div className="px-2 py-1 rounded bg-indigo-500/20 border border-indigo-500/30 text-[10px] text-indigo-300">React</div>
                                    <div className="px-2 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-[10px] text-cyan-300">Three.js</div>
                                </div>
                            </GlassCard>
                        </motion.div>

                        {/* Card 2: Escrow Notification */}
                        <motion.div
                            className="hero-card absolute top-1/2 right-1/2 translate-x-12 translate-y-12 w-64 z-30"
                            animate={{ y: [0, 15, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        >
                            <GlassCard variant="heavy" className="p-4 border-l-4 border-l-green-500">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs text-white/50 uppercase tracking-wider">Escrow Update</span>
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">$4,500.00</div>
                                <div className="text-xs text-green-400">Funds Secured & Locked</div>
                            </GlassCard>
                        </motion.div>

                        {/* Card 3: Trust Score */}
                        <motion.div
                            className="hero-card absolute bottom-20 right-10 w-48 z-10"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        >
                            <GlassCard className="p-4 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 flex items-center justify-center mb-2">
                                    <span className="text-lg font-bold text-white">98</span>
                                </div>
                                <span className="text-sm font-medium text-white/80">Trust Score</span>
                            </GlassCard>
                        </motion.div>

                    </div>
                </div>
            </div>
        </section>
    );
}
