import React from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import type { NavItem } from '@/components/dashboard/dashboard-layout';

const clientNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/client/dashboard', icon: 'dashboard' },
    { name: 'Post a Job', href: '/client/post-job', icon: 'briefcase' },
    { name: 'My Jobs', href: '/client/jobs', icon: 'file' },
    { name: 'Proposals', href: '/client/proposals', icon: 'user' },
    { name: 'Contracts', href: '/client/contracts', icon: 'briefcase' },
    { name: 'Messages', href: '/client/messages', icon: 'message' },
    { name: 'Payments', href: '/client/payments', icon: 'wallet' },
    { name: 'Invoices', href: '/client/invoices', icon: 'receipt' },
    { name: 'Disputes', href: '/client/disputes', icon: 'alert' },
    { name: 'Reviews', href: '/client/reviews/new', icon: 'star' },
    { name: 'Notifications', href: '/client/notifications', icon: 'bell' },
    { name: 'Settings', href: '/client/settings/security', icon: 'settings' },
];

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    if (session.user.role && session.user.role !== 'CLIENT') {
        redirect(`/${session.user.role.toLowerCase()}/dashboard`);
    }

    const userName = session.user.name || 'User';
    const userInitials = session.user.name ? getInitials(session.user.name) : '??';

    return (
        <DashboardLayout
            navItems={clientNavItems}
            roleLabel="Client"
            settingsHref="/client/settings/security"
            userName={userName}
            userInitials={userInitials}
        >
            {children}
        </DashboardLayout>
    );
}
