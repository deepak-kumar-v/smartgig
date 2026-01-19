'use client';

import React from 'react';
import { Navbar } from '@/components/global/navbar';
import { Footer } from '@/components/global/footer';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { EscrowSection } from '@/components/landing/escrow-section';

export default function Home() {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <EscrowSection />

            {/* Call to Action pre-footer */}
            <section className="py-32 relative text-center px-6">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent pointer-events-none" />
                <div className="max-w-3xl mx-auto relative z-10">
                    <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8">
                        Ready to work smart?
                    </h2>
                    <p className="text-xl text-white/60 mb-10">
                        Join 10,000+ top-tier professionals building the future.
                    </p>
                    <button className="h-14 px-10 rounded-full bg-white text-black font-semibold text-lg hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                        Get Started Now
                    </button>
                </div>
            </section>

            <Footer />
        </main>
    );
}
