'use client';

import React, { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
        { name: 'Reviews', href: '/freelancer/reviews', icon: Star },
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
        { name: 'Reviews', href: '/client/reviews', icon: Star },
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

function getRoleFromPath(pathname: string): 'freelancer' | 'client' | 'admin' | null {
    if (pathname.startsWith('/client')) return 'client';
    if (pathname.startsWith('/freelancer')) return 'freelancer';
    if (pathname.startsWith('/admin')) return 'admin';
    return null;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function DashboardShell({ children, role: initialRole = 'freelancer' }: DashboardShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();

    // STRICT: Derive role from URL first, then session, then prop fallback
    const pathRole = getRoleFromPath(pathname);
    const sessionRole = session?.user?.role?.toLowerCase() as 'freelancer' | 'client' | 'admin' | undefined;
    // Priority: URL path > session role > prop fallback
    const effectiveRole = pathRole || sessionRole || initialRole;
    // On shared routes, sidebar must wait for session to resolve the role
    const isRoleResolved = pathRole !== null || status !== 'loading';

    const menu = navItems[effectiveRole as keyof typeof navItems] || navItems.freelancer;

    // Handle user card click
    const handleUserClick = () => {
        if (effectiveRole === 'freelancer') router.push('/freelancer/settings');
        else if (effectiveRole === 'client') router.push('/settings/security'); // Client has /settings/security
        else if (effectiveRole === 'admin') router.push('/admin/dashboard'); // Admin fallback
    };

    const userInitials = session?.user?.name ? getInitials(session.user.name) : '??';
    const userName = session?.user?.name || 'User';
    const userRoleLabel = session?.user?.role
        ? session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1).toLowerCase()
        : effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1).toLowerCase();

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-white/5 backdrop-blur-xl h-screen sticky top-0" data-testid="dashboard-sidebar">
                <div className="p-6">
                    <Logo />
                </div>

                <div className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <div className="text-xs font-medium text-white/30 px-3 uppercase tracking-wider mb-2">Menu</div>
                    {isRoleResolved ? menu.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
                    }) : (
                        /* Neutral skeleton while role resolves on shared routes */
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse">
                                <div className="w-4 h-4 rounded bg-white/10" />
                                <div className="h-3 rounded bg-white/10" style={{ width: `${60 + (i % 3) * 20}%` }} />
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 mt-auto border-t border-white/5">
                    {status === 'loading' ? (
                        // Skeleton Loader
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-20 bg-white/10 rounded" />
                                <div className="h-2 w-12 bg-white/10 rounded" />
                            </div>
                        </div>
                    ) : session ? (
                        // Real User Card
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
                                    {userRoleLabel}
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
                    ) : (
                        // Fallback (Should happen only briefly during redirect)
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 opacity-50">
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                            <div className="text-xs text-white/40">Not signed in</div>
                        </div>
                    )}
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

                            {/* Mobile Menu Items - Scrollable area */}
                            <nav className="space-y-2 flex-1 overflow-y-auto mb-4">
                                {isRoleResolved ? menu.map((item) => (
                                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                                        <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/70 hover:bg-white/10">
                                            <item.icon className="w-5 h-5" />
                                            {item.name}
                                        </div>
                                    </Link>
                                )) : (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg animate-pulse">
                                            <div className="w-5 h-5 rounded bg-white/10" />
                                            <div className="h-3 rounded bg-white/10" style={{ width: `${60 + (i % 3) * 20}%` }} />
                                        </div>
                                    ))
                                )}
                            </nav>

                            {/* Mobile Footer Area - Pinned to bottom */}
                            <div className="pt-4 mt-auto border-t border-white/10 shrink-0">
                                {session && (
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
                                            <div className="text-xs text-white/40 capitalize">{userRoleLabel}</div>
                                        </div>
                                    </div>
                                )}
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
