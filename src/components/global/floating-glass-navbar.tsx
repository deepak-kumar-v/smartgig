'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { GlassButton } from '@/components/ui/glass-button';
import { Menu, X } from 'lucide-react';

const navLinks = [
    { name: 'Features', href: '/features' },
    { name: 'Services', href: '/services' },
    { name: 'Explore', href: '/explore' },
    { name: 'Talent', href: '/talent' },
    { name: 'Pricing', href: '/pricing' },
];

export function FloatingGlassNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {/* Sticky Glass Navbar */}
            <nav
                className={cn(
                    "sticky top-0 z-[9999] transition-all duration-300 ease-out",
                    scrolled ? "py-2" : "py-4"
                )}
                style={{
                    isolation: 'isolate',
                }}
            >
                <div
                    className={cn(
                        "container mx-auto px-4 sm:px-6",
                        scrolled ? "py-2" : "py-4"
                    )}
                >
                    {/* Glass Bar */}
                    <div
                        className={`
                            relative
                            flex items-center justify-between
                            rounded-3xl
                            transition-all duration-300 ease-out
                            ${scrolled ? 'px-6 py-3' : 'px-7 py-3.5'}
                        `}
                        style={{
                            background: scrolled
                                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))'
                                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                            backdropFilter: scrolled ? 'blur(32px) saturate(180%)' : 'blur(16px) saturate(150%)',
                            WebkitBackdropFilter: scrolled ? 'blur(32px) saturate(180%)' : 'blur(16px) saturate(150%)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: scrolled
                                ? '0 8px 32px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                                : '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                        }}
                    >
                        {/* Logo */}
                        <Link
                            href="/"
                            className="relative z-10 transition-opacity duration-200 hover:opacity-80"
                        >
                            <Logo />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="
                                        relative text-sm font-medium 
                                        text-white/70 hover:text-white
                                        transition-colors duration-200
                                    "
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-4">
                            <Link
                                href="/login"
                                className="
                                    text-sm font-medium 
                                    text-white/90 hover:text-indigo-300
                                    transition-colors duration-200
                                "
                            >
                                Log in
                            </Link>
                            <Link href="/register">
                                <GlassButton size="sm" variant="primary" asDiv>
                                    Join SmartGIG
                                </GlassButton>
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="
                                block md:hidden
                                p-2 text-white
                                transition-opacity duration-200 hover:opacity-70
                            "
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div
                            className="
                                mt-4 p-6 rounded-2xl
                                md:hidden
                                animate-in slide-in-from-top-4 fade-in duration-300
                            "
                            style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                                backdropFilter: 'blur(32px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                            }}
                        >
                            <div className="flex flex-col gap-6">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-lg font-medium text-white/90 hover:text-white transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                                <div className="h-px bg-white/10 my-2" />
                                <Link
                                    href="/login"
                                    className="text-lg font-medium text-white/90 hover:text-white transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link href="/register">
                                    <GlassButton className="w-full" asDiv>Join Now</GlassButton>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        </>
    );
}
