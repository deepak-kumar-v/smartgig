'use client';

import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarV3 } from '@/components/client/sidebar-v3';

export default function ControlCenterLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider defaultOpen={false}>
            <div className="flex min-h-screen w-full" style={{ background: 'linear-gradient(180deg, #060611 0%, #0f1022 50%, #060611 100%)' }}>
                <SidebarV3 />
                <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
                    <div className="p-3 border-b border-white/5 flex items-center bg-transparent sticky top-0 z-20">
                        <SidebarTrigger className="text-zinc-500 hover:text-white" />
                    </div>
                    <div className="w-full px-8 md:px-12 lg:px-20 py-8">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
