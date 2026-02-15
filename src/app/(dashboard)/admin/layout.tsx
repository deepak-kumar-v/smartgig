'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import type { NavItem } from '@/components/dashboard/dashboard-layout';
import {
    LayoutDashboard, Users, Briefcase, FileText,
    AlertTriangle, Wallet, Shield
} from 'lucide-react';

const adminNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Jobs', href: '/admin/jobs', icon: Briefcase },
    { name: 'Contracts', href: '/admin/contracts', icon: FileText },
    { name: 'Disputes', href: '/admin/disputes', icon: AlertTriangle },
    { name: 'Payments', href: '/payments', icon: Wallet },
    { name: 'Trust & Safety', href: '/admin/trust', icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Role validation: redirect if session role doesn't match namespace
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role && session.user.role !== 'ADMIN') {
            router.replace(`/${session.user.role.toLowerCase()}/dashboard`);
        }
    }, [status, session?.user?.role, router]);

    return (
        <DashboardLayout
            navItems={adminNavItems}
            roleLabel="Admin"
            settingsHref="/admin/dashboard"
        >
            {children}
        </DashboardLayout>
    );
}
