'use client';

import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarV3 } from '@/components/client/sidebar-v3';

export default function DashboardV3Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen bg-[#0A0A0A] w-full">
                <SidebarV3 />
                <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0A0A0A] sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <SidebarTrigger className="text-zinc-400 hover:text-white" />
                            <span className="text-sm text-zinc-500">Dashboard V3 Preview</span>
                        </div>
                    </div>
                    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
