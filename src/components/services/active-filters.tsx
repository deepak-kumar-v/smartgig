'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

export function ActiveFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Derived state from URL params
    const filters = [
        { key: 'query', label: searchParams.get('query') ? `Search: "${searchParams.get('query')}"` : null },
        { key: 'category', label: searchParams.get('category') },
        { key: 'minPrice', label: searchParams.get('minPrice') ? `Min: $${searchParams.get('minPrice')}` : null },
        { key: 'maxPrice', label: searchParams.get('maxPrice') ? `Max: $${searchParams.get('maxPrice')}` : null },
        { key: 'deliveryTime', label: searchParams.get('deliveryTime') ? `Delivery: < ${searchParams.get('deliveryTime')} days` : null },
    ].filter(f => f.label);

    if (filters.length === 0) return null;

    const removeFilter = (key: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete(key);
        router.push(`/services?${params.toString()}`);
    };

    const clearAll = () => {
        router.push('/services');
    };

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-zinc-400 mr-2">Active Filters:</span>
            {filters.map((filter) => (
                <button
                    key={filter.key}
                    onClick={() => removeFilter(filter.key)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm hover:bg-violet-500/20 transition-colors"
                >
                    {filter.label}
                    <X className="w-3 h-3 ml-1 opacity-70" />
                </button>
            ))}
            <button
                onClick={clearAll}
                className="text-sm text-zinc-500 hover:text-white transition-colors ml-2 hover:underline"
            >
                Clear all
            </button>
        </div>
    );
}
