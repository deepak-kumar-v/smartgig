'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import type { NavItem } from '@/components/dashboard/dashboard-layout';
import {
    LayoutDashboard, Briefcase, FileText, User, MessageSquare,
    Wallet, Receipt, AlertTriangle, Star, Bell, Settings
} from 'lucide-react';

const clientNavItems: NavItem[] = [
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
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Role validation: redirect if session role doesn't match namespace
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role && session.user.role !== 'CLIENT') {
            router.replace(`/${session.user.role.toLowerCase()}/dashboard`);
        }
    }, [status, session?.user?.role, router]);

    return (
        <DashboardLayout
            navItems={clientNavItems}
            roleLabel="Client"
            settingsHref="/settings/security"
        >
            {children}
        </DashboardLayout>
    );
}
