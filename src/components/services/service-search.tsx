'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export function ServiceSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = React.useState(searchParams.get('query') || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (query) {
            params.set('query', query);
        } else {
            params.delete('query');
        }
        router.push(`/services?${params.toString()}`);
    };

    const handleSort = (sort: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', sort);
        router.push(`/services?${params.toString()}`);
    };

    return (
        <div className="mb-8 space-y-4">
            <GlassCard className="p-2 flex items-center gap-2">
                <Search className="w-5 h-5 text-zinc-400 ml-2" />
                <form onSubmit={handleSearch} className="flex-1">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for services..."
                        className="w-full bg-transparent border-none text-white focus:outline-none placeholder-zinc-500 py-2"
                    />
                </form>
                <div className="h-6 w-px bg-white/10 mx-2" />
                <div className="relative group">
                    {/* Sort Dropdown Trigger */}
                    <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg text-sm text-zinc-400 font-medium transition-colors">
                        <ArrowUpDown className="w-4 h-4" />
                        Sort by
                    </button>
                    {/* Simplified Dropdown Logic for Demo */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                        <div className="p-1">
                            {['Recommended', 'Newest', 'Price: Low to High', 'Price: High to Low'].map((label) => {
                                const value = label === 'Recommended' ? 'recommended' :
                                    label === 'Newest' ? 'newest' :
                                        label.includes('Low to High') ? 'price_low' : 'price_high';
                                return (
                                    <button
                                        key={value}
                                        onClick={() => handleSort(value)}
                                        className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white rounded-lg"
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
