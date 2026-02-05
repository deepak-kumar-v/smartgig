'use client';

import { useSession } from 'next-auth/react';
import { AccessDeniedState } from '@/components/ui/access-denied-state';

type UserRole = 'FREELANCER' | 'CLIENT' | 'ADMIN';

interface UseRoleGuardOptions {
    allowedRoles: UserRole[];
    requireAuth?: boolean;
}

/**
 * Client-side role guard hook
 * Use this for component-level role protection
 * 
 * @example
 * const { isAllowed, isLoading, RoleGuard } = useRoleGuard({ allowedRoles: ['FREELANCER'] });
 * if (!isAllowed) return <RoleGuard />;
 */
export function useRoleGuard({ allowedRoles, requireAuth = true }: UseRoleGuardOptions) {
    const { data: session, status } = useSession();

    const isLoading = status === 'loading';
    const isAuthenticated = status === 'authenticated';
    const userRole = session?.user?.role as UserRole | undefined;

    const isAllowed = !requireAuth || (isAuthenticated && userRole && allowedRoles.includes(userRole));

    const RoleGuard = () => {
        if (isLoading) {
            return (
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            );
        }

        if (!isAuthenticated) {
            return (
                <AccessDeniedState
                    title="Authentication Required"
                    message="Please sign in to access this page."
                    showLogin={true}
                    showHome={true}
                    backHref="/"
                />
            );
        }

        return (
            <AccessDeniedState
                title="Access Denied"
                message={`This page is restricted to ${allowedRoles.join(' or ')} accounts.`}
                showLogin={false}
                showHome={true}
                backHref="/"
            />
        );
    };

    return {
        isAllowed,
        isLoading,
        isAuthenticated,
        userRole,
        RoleGuard,
    };
}

/**
 * Higher-order component for role protection
 */
export function withRoleGuard<P extends object>(
    Component: React.ComponentType<P>,
    options: UseRoleGuardOptions
) {
    return function GuardedComponent(props: P) {
        const { isAllowed, isLoading, RoleGuard } = useRoleGuard(options);

        if (isLoading || !isAllowed) {
            return <RoleGuard />;
        }

        return <Component {...props} />;
    };
}
