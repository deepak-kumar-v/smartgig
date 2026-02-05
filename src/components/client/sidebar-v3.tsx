'use client';

import * as React from 'react';
import {
    Briefcase,
    FileText,
    LayoutDashboard,
    MessageSquare,
    ScrollText,
    Settings,
    Users,
    Search,
    LogOut,
    UserCircle,
    ChevronDown,
    ChevronRight,
    CreditCard
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Link from 'next/link';

// Navigation Data
const data = {
    platform: [
        {
            title: 'Dashboard',
            url: '/client/dashboard-v3',
            icon: LayoutDashboard,
        },
    ],
    hiring: [
        {
            title: 'Jobs',
            url: '/client/jobs',
            icon: Briefcase,
        },
        {
            title: 'Proposals',
            url: '/client/proposals',
            icon: FileText,
        },
        {
            title: 'Contracts',
            url: '/client/contracts',
            icon: ScrollText,
        },
        // {
        //     title: 'Talent',
        //     url: '/client/talent',
        //     icon: Users,
        // },
    ],
    communication: [
        {
            title: 'Messages',
            url: '/client/messages',
            icon: MessageSquare,
        },
    ],
    settings: [
        {
            title: 'Account',
            url: '/client/settings/account',
            icon: UserCircle,
        },
        {
            title: 'Billing',
            url: '/client/settings/billing',
            icon: CreditCard,
        },
    ]
};

export function SidebarV3({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" className="border-r border-white/10 bg-[#0A0A0A]" {...props}>
            <SidebarHeader className="border-b border-white/5 p-4 bg-[#0A0A0A]">
                {/* Brand / Logo Area */}
                <div className="flex items-center gap-2 px-1 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                        <span className="font-bold text-emerald-400">S</span>
                    </div>
                    <span className="font-semibold text-white tracking-tight group-data-[collapsible=icon]:hidden">
                        SmartGig
                    </span>
                </div>

                {/* Search - Liquid Glass Accent */}
                <div className="relative group-data-[collapsible=icon]:hidden">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-4 py-2 bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all"
                    />
                </div>
            </SidebarHeader>

            <SidebarContent className="bg-[#0A0A0A]">
                {/* Group 1: Platform (Collapsible) */}
                <Collapsible defaultOpen className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="text-zinc-500 hover:text-white transition-colors">
                                Platform
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {data.platform.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild tooltip={item.title} className="hover:bg-zinc-800/50 hover:text-white text-zinc-400 data-[active=true]:bg-zinc-800/50 data-[active=true]:text-white transition-all">
                                                <Link href={item.url}>
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>

                {/* Group 2: Hiring (Collapsible) */}
                <Collapsible defaultOpen className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="text-zinc-500 hover:text-white transition-colors">
                                Hiring
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {data.hiring.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild tooltip={item.title} className="hover:bg-zinc-800/50 hover:text-white text-zinc-400 data-[active=true]:bg-zinc-800/50 data-[active=true]:text-white transition-all">
                                                <Link href={item.url}>
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>

                {/* Group 3: Communication (Collapsible) */}
                <Collapsible defaultOpen className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="text-zinc-500 hover:text-white transition-colors">
                                Communication
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {data.communication.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild tooltip={item.title} className="hover:bg-zinc-800/50 hover:text-white text-zinc-400 data-[active=true]:bg-zinc-800/50 data-[active=true]:text-white transition-all">
                                                <Link href={item.url}>
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>

                {/* Group 4: Settings (Collapsible) */}
                <Collapsible className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="text-zinc-500 hover:text-white transition-colors">
                                Settings
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {data.settings.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild tooltip={item.title} className="hover:bg-zinc-800/50 hover:text-white text-zinc-400 data-[active=true]:bg-zinc-800/50 data-[active=true]:text-white transition-all">
                                                <Link href={item.url}>
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>
            </SidebarContent>

            <SidebarFooter className="border-t border-white/5 bg-[#0A0A0A] p-4">
                <SidebarMenu>
                    {/* User Profile - Liquid Glass Accent */}
                    <SidebarMenuItem>
                        <button className="w-full flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-900/80 border border-white/5 transition-all text-left group">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-white/5">
                                <UserCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                                <p className="text-sm font-medium text-white truncate">Client Account</p>
                                <p className="text-xs text-zinc-500 truncate">client@example.com</p>
                            </div>
                            <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-data-[collapsible=icon]:hidden" />
                        </button>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
