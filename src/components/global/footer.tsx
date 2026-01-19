import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export function Footer() {
    return (
        <footer className="relative border-t border-white/5 bg-black/20 pt-20 pb-10 overflow-hidden">
            {/* Glow behind footer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-1 bg-indigo-500/50 blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <Logo className="mb-6" />
                        <p className="text-white/50 text-sm leading-relaxed">
                            The world's most advanced AI-enabled freelancing marketplace.
                            Secure, transparent, and future-ready.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6">Platform</h4>
                        <ul className="space-y-4 text-sm text-white/60">
                            <li><Link href="/explore" className="hover:text-white transition-colors">Browse Jobs</Link></li>
                            <li><Link href="/talent" className="hover:text-white transition-colors">Find Talent</Link></li>
                            <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                            <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6">Company</h4>
                        <ul className="space-y-4 text-sm text-white/60">
                            <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                            <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                            <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm text-white/60">
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link href="/trust" className="hover:text-white transition-colors">Trust & Safety</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-white/30 text-xs">
                        © 2026 SmartGIG Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        {/* Social icons placeholders */}
                        <div className="w-5 h-5 bg-white/10 rounded-full" />
                        <div className="w-5 h-5 bg-white/10 rounded-full" />
                        <div className="w-5 h-5 bg-white/10 rounded-full" />
                    </div>
                </div>
            </div>
        </footer>
    );
}
