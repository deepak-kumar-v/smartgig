'use client';

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { LayoutDashboard, Briefcase, FileText, MessageSquare, Settings, LogOut, Bell, Search, Menu, User, Image, Shield, Users, AlertTriangle, Wallet, Receipt, ArrowDownToLine, Star, Video } from 'lucide-react';
import { GlassButton } from '@/components/ui/glass-button';
import { motion, AnimatePresence } from 'framer-motion';

// Navigation items based on role
const navItems = {
    freelancer: [
        { name: 'Dashboard', href: '/freelancer/dashboard', icon: LayoutDashboard },
        { name: 'Profile', href: '/freelancer/profile', icon: User },
        { name: 'Find Work', href: '/freelancer/find-work', icon: Search },
        { name: 'My Proposals', href: '/freelancer/proposals', icon: FileText },
        { name: 'Contracts', href: '/freelancer/contracts', icon: Briefcase },
        { name: 'Portfolio', href: '/freelancer/portfolio', icon: Image },
        { name: 'Messages', href: '/messages', icon: MessageSquare },
        { name: 'My Services', href: '/freelancer/services', icon: Briefcase },
        { name: 'Payments', href: '/payments', icon: Wallet },
        { name: 'Invoices', href: '/invoices', icon: Receipt },
        { name: 'Withdraw', href: '/withdraw', icon: ArrowDownToLine },
        { name: 'Disputes', href: '/disputes', icon: AlertTriangle },
        { name: 'Reviews', href: '/reviews/new', icon: Star },
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'Trust & Safety', href: '/freelancer/trust', icon: Shield },
        { name: 'Settings', href: '/freelancer/settings', icon: Settings },
    ],
    client: [
        { name: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
        { name: 'Post a Job', href: '/client/post-job', icon: Briefcase },
        { name: 'My Jobs', href: '/client/jobs', icon: FileText },
        { name: 'Proposals', href: '/client/proposals', icon: User },
        { name: 'Contracts', href: '/client/contracts', icon: Briefcase },
        { name: 'Messages', href: '/messages', icon: MessageSquare },
        { name: 'Payments', href: '/payments', icon: Wallet },
        { name: 'Invoices', href: '/invoices', icon: Receipt },
        { name: 'Disputes', href: '/disputes', icon: AlertTriangle },
        { name: 'Reviews', href: '/reviews/new', icon: Star },
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'Settings', href: '/settings/security', icon: Settings },
    ],
    admin: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Jobs', href: '/admin/jobs', icon: Briefcase },
        { name: 'Contracts', href: '/admin/contracts', icon: FileText },
        { name: 'Disputes', href: '/admin/disputes', icon: AlertTriangle },
        { name: 'Payments', href: '/payments', icon: Wallet },
        { name: 'Trust & Safety', href: '/admin/trust', icon: Shield },
    ]
};

interface DashboardShellProps {
    children: React.ReactNode;
    role?: 'freelancer' | 'client' | 'admin';
}

export function DashboardShell({ children, role = 'freelancer' }: DashboardShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const menu = navItems[role as keyof typeof navItems] || navItems.freelancer;

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-white/5 backdrop-blur-xl h-screen sticky top-0" data-testid="dashboard-sidebar">
                <div className="p-6">
                    <Logo />
                </div>

                <div className="flex-1 px-4 space-y-2 mt-4">
                    <div className="text-xs font-medium text-white/30 px-3 uppercase tracking-wider mb-2">Menu</div>
                    {menu.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                    isActive
                                        ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                )}>
                                    <item.icon className={cn("w-4 h-4", isActive ? "text-indigo-400" : "text-white/40 group-hover:text-white")} />
                                    {item.name}
                                </div>
                            </Link>
                        )
                    })}
                </div>

                <div className="p-4 mt-auto border-t border-white/5">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 gradient-avatar flex items-center justify-center text-xs font-bold">AK</div>
                        <div className="overflow-hidden">
                            <div className="text-sm text-white font-medium truncate">Alex Knight</div>
                            <div className="text-xs text-white/40 truncate">Freelancer</div>
                        </div>
                        <Settings className="w-4 h-4 ml-auto text-white/30 cursor-pointer hover:text-white" />
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="p-1.5 text-white/30 hover:text-rose-400 transition-colors"
                            title="Sign Out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                            onClick={() => setSidebarOpen(false)}
                            aria-hidden="true"
                        />
                        <motion.div
                            initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
                            className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-white/10 lg:hidden p-4"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Mobile Navigation"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <Logo />
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    aria-label="Close menu"
                                    className="p-1 rounded-full hover:bg-white/10"
                                >
                                    <LogOut className="w-5 h-5 text-white/50" />
                                </button>
                            </div>
                            {/* Mobile Menu Items Repeated */}
                            <nav className="space-y-2">
                                {menu.map((item) => (
                                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                                        <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/70 hover:bg-white/10">
                                            <item.icon className="w-5 h-5" />
                                            {item.name}
                                        </div>
                                    </Link>
                                ))}
                                <div className="pt-4 mt-4 border-t border-white/10">
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/login' })}
                                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-rose-400 hover:bg-white/10 transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Log Out
                                    </button>
                                </div>
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>


            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-16 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
                    <button
                        className="lg:hidden text-white/70 p-2 -ml-2 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex-1 max-w-xl mx-4 hidden md:block">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                type="text"
                                placeholder="Search jobs, clients, contracts..."
                                aria-label="Search"
                                className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-white/20 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            className="relative p-2 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                            aria-label="Notifications"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-black" />
                        </button>
                    </div>
                </header>

                <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
