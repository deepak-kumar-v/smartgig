import React from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import type { NavItem } from '@/components/dashboard/dashboard-layout';

const adminNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
    { name: 'Users', href: '/admin/users', icon: 'users' },
    { name: 'Jobs', href: '/admin/jobs', icon: 'briefcase' },
    { name: 'Contracts', href: '/admin/contracts', icon: 'file' },
    { name: 'Disputes', href: '/admin/disputes', icon: 'alert' },
    { name: 'Financial Overview', href: '/admin/financial-overview', icon: 'wallet' },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: 'wallet' },
    { name: 'Diagnostics', href: '/admin/financial-diagnostics', icon: 'shield' },
    { name: 'Trust & Safety', href: '/admin/trust', icon: 'shield' },
    { name: 'Portfolio', href: '/admin/portfolio', icon: 'briefcase' },
];

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    if (session.user.role && session.user.role !== 'ADMIN') {
        redirect(`/${session.user.role.toLowerCase()}/dashboard`);
    }

    const userName = session.user.name || 'User';
    const userInitials = session.user.name ? getInitials(session.user.name) : '??';

    return (
        <DashboardLayout
            navItems={adminNavItems}
            roleLabel="Admin"
            settingsHref="/admin/dashboard"
            userName={userName}
            userInitials={userInitials}
        >
            {children}
        </DashboardLayout>
    );
}
