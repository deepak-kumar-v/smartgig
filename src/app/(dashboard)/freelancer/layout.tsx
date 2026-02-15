'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import type { NavItem } from '@/components/dashboard/dashboard-layout';
import {
    LayoutDashboard, User, Search, FileText, Briefcase, Image,
    MessageSquare, Wallet, Receipt, ArrowDownToLine, AlertTriangle,
    Star, Bell, Shield, Settings
} from 'lucide-react';

const freelancerNavItems: NavItem[] = [
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
];

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Role validation: redirect if session role doesn't match namespace
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role && session.user.role !== 'FREELANCER') {
            router.replace(`/${session.user.role.toLowerCase()}/dashboard`);
        }
    }, [status, session?.user?.role, router]);

    return (
        <DashboardLayout
            navItems={freelancerNavItems}
            roleLabel="Freelancer"
            settingsHref="/freelancer/settings"
        >
            {children}
        </DashboardLayout>
    );
}
