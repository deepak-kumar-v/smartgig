'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { SocketProvider } from '@/providers/socket-provider';

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <SessionProvider>
            <SocketProvider>
                {children}
            </SocketProvider>
        </SessionProvider>
    );
}
