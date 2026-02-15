'use client';

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import {
    LogOut, Search, Menu, Settings, Bell,
    LayoutDashboard, User, FileText, Briefcase, Image,
    MessageSquare, Wallet, Receipt, ArrowDownToLine,
    AlertTriangle, Star, Shield, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

/* ── Icon resolution map ── */
const iconMap: Record<string, LucideIcon> = {
    dashboard: LayoutDashboard,
    user: User,
    users: Users,
    search: Search,
    file: FileText,
    briefcase: Briefcase,
    image: Image,
    message: MessageSquare,
    wallet: Wallet,
    receipt: Receipt,
    withdraw: ArrowDownToLine,
    alert: AlertTriangle,
    star: Star,
    bell: Bell,
    shield: Shield,
    settings: Settings,
};

export interface NavItem {
    name: string;
    href: string;
    /** String key resolved via iconMap inside this client component */
    icon: string;
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    navItems: NavItem[];
    roleLabel: string;
    settingsHref: string;
    userName: string;
    userInitials: string;
}

export function DashboardLayout({
    children,
    navItems,
    roleLabel,
    settingsHref,
    userName,
    userInitials,
}: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleUserClick = () => {
        router.push(settingsHref);
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-white/5 backdrop-blur-xl h-screen sticky top-0" data-testid="dashboard-sidebar">
                <div className="p-6">
                    <Logo />
                </div>

                <div className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <div className="text-xs font-medium text-white/30 px-3 uppercase tracking-wider mb-2">Menu</div>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        const Icon = iconMap[item.icon];
                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                    isActive
                                        ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                )}>
                                    {Icon && <Icon className={cn("w-4 h-4", isActive ? "text-indigo-400" : "text-white/40 group-hover:text-white")} />}
                                    {item.name}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 mt-auto border-t border-white/5">
                    <div
                        className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors group"
                        onClick={handleUserClick}
                    >
                        <div className="w-8 h-8 rounded-full bg-indigo-500 gradient-avatar flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {userInitials}
                        </div>
                        <div className="overflow-hidden flex-1 min-w-0">
                            <div className="text-sm text-white font-medium truncate group-hover:text-indigo-300 transition-colors">
                                {userName}
                            </div>
                            <div className="text-xs text-white/40 truncate capitalize">
                                {roleLabel}
                            </div>
                        </div>
                        <Settings className="w-4 h-4 ml-auto text-white/30 group-hover:text-indigo-400 transition-colors shrink-0" />
                        <div className="mx-1 w-px h-4 bg-white/10 shrink-0" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                signOut({ callbackUrl: '/login' });
                            }}
                            className="p-1.5 text-white/30 hover:text-rose-400 transition-colors rounded-lg hover:bg-white/5 shrink-0"
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
                            className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-white/10 lg:hidden p-4 flex flex-col items-stretch"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Mobile Navigation"
                        >
                            <div className="flex justify-between items-center mb-8 shrink-0">
                                <Logo />
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    aria-label="Close menu"
                                    className="p-1 rounded-full hover:bg-white/10"
                                >
                                    <LogOut className="w-5 h-5 text-white/50" />
                                </button>
                            </div>

                            <nav className="space-y-2 flex-1 overflow-y-auto mb-4">
                                {navItems.map((item) => {
                                    const Icon = iconMap[item.icon];
                                    return (
                                        <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                                            <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/70 hover:bg-white/10">
                                                {Icon && <Icon className="w-5 h-5" />}
                                                {item.name}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="pt-4 mt-auto border-t border-white/10 shrink-0">
                                <div
                                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 mb-3 cursor-pointer"
                                    onClick={() => {
                                        setSidebarOpen(false);
                                        handleUserClick();
                                    }}
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 gradient-avatar flex items-center justify-center text-xs font-bold text-white">
                                        {userInitials}
                                    </div>
                                    <div>
                                        <div className="text-sm text-white font-medium">{userName}</div>
                                        <div className="text-xs text-white/40 capitalize">{roleLabel}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-rose-400 hover:bg-white/10 transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Log Out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0">
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
