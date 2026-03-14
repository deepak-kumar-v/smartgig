'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { SocketProvider } from '@/providers/socket-provider';
import { IdentityProvider } from '@/providers/identity-provider';
import { GlobalRefreshProvider } from '@/providers/global-refresh-provider';
import { GlobalSyncListener } from '@/components/global-sync-listener';

interface ProvidersProps {
    children: React.ReactNode;
    session?: any;
}

export function Providers({ children, session }: ProvidersProps) {
    const userId = session?.user?.id || '';
    const userRole = session?.user?.role || null;
    const userName = session?.user?.name || null;
    const userImage = session?.user?.image || null;

    return (
        <SessionProvider session={session}>
            <IdentityProvider userId={userId} userRole={userRole} userName={userName} userImage={userImage}>
                <GlobalRefreshProvider>
                    <SocketProvider userId={userId} userRole={userRole}>
                        <GlobalSyncListener />
                        {children}
                    </SocketProvider>
                </GlobalRefreshProvider>
            </IdentityProvider>
        </SessionProvider>
    );
}
