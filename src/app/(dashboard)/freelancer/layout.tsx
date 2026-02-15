import React from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import type { NavItem } from '@/components/dashboard/dashboard-layout';

const freelancerNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/freelancer/dashboard', icon: 'dashboard' },
    { name: 'Profile', href: '/freelancer/profile', icon: 'user' },
    { name: 'Find Work', href: '/freelancer/find-work', icon: 'search' },
    { name: 'My Proposals', href: '/freelancer/proposals', icon: 'file' },
    { name: 'Contracts', href: '/freelancer/contracts', icon: 'briefcase' },
    { name: 'Portfolio', href: '/freelancer/portfolio', icon: 'image' },
    { name: 'Messages', href: '/freelancer/messages', icon: 'message' },
    { name: 'My Services', href: '/freelancer/services', icon: 'briefcase' },
    { name: 'Payments', href: '/freelancer/payments', icon: 'wallet' },
    { name: 'Invoices', href: '/freelancer/invoices', icon: 'receipt' },
    { name: 'Withdraw', href: '/freelancer/withdraw', icon: 'withdraw' },
    { name: 'Disputes', href: '/freelancer/disputes', icon: 'alert' },
    { name: 'Reviews', href: '/freelancer/reviews/new', icon: 'star' },
    { name: 'Notifications', href: '/freelancer/notifications', icon: 'bell' },
    { name: 'Trust & Safety', href: '/freelancer/trust', icon: 'shield' },
    { name: 'Settings', href: '/freelancer/settings', icon: 'settings' },
];

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default async function FreelancerLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    if (session.user.role && session.user.role !== 'FREELANCER') {
        redirect(`/${session.user.role.toLowerCase()}/dashboard`);
    }

    const userName = session.user.name || 'User';
    const userInitials = session.user.name ? getInitials(session.user.name) : '??';

    return (
        <DashboardLayout
            navItems={freelancerNavItems}
            roleLabel="Freelancer"
            settingsHref="/freelancer/settings"
            userName={userName}
            userInitials={userInitials}
        >
            {children}
        </DashboardLayout>
    );
}
