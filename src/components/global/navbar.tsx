'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { GlassButton } from '@/components/ui/glass-button';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
    { name: 'Features', href: '/features' },
    { name: 'Services', href: '/services' },
    { name: 'Explore', href: '/explore' },
    { name: 'Talent', href: '/talent' },
    { name: 'Pricing', href: '/pricing' },
];

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
            }}
            className={cn(
                'transition-all duration-300',
                scrolled ? 'py-3' : 'py-6'
            )}
        >
            <div className="container mx-auto px-4 sm:px-6">
                <nav
                    style={{
                        backdropFilter: scrolled ? 'blur(24px)' : 'none',
                        WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
                    }}
                    className={cn(
                        'mx-auto flex items-center justify-between rounded-full px-6 transition-all duration-300',
                        scrolled
                            ? 'bg-black/40 border border-white/10 shadow-lg py-3'
                            : 'bg-transparent border-transparent py-2'
                    )}
                >
                    {/* Logo */}
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <Logo />
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-white hover:text-indigo-300 transition-colors">
                            Log in
                        </Link>
                        <Link href="/register">
                            <GlassButton size="sm" variant="primary">Join SmartGIG</GlassButton>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden text-white p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-menu"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </nav>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        id="mobile-menu"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-full left-0 right-0 p-4 md:hidden"
                    >
                        <div className="glass-panel-heavy rounded-2xl p-6 flex flex-col gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-lg font-medium text-white/90"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="h-px bg-white/10 my-2" />
                            <Link href="/login" className="text-lg font-medium text-white/90">
                                Log in
                            </Link>
                            <Link href="/register">
                                <GlassButton className="w-full">Join Now</GlassButton>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
