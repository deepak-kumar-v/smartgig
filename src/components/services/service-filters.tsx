'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { jobCategories } from '@/lib/mock-data';

function FilterSection({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    return (
        <div className="border-b border-white/5 py-4 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full text-sm font-medium text-white mb-3"
            >
                {title}
                {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </button>
            {isOpen && <div className="space-y-2">{children}</div>}
        </div>
    );
}

export function ServiceFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const updateParam = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/services?${params.toString()}`);
    };

    const currentCategory = searchParams.get('category');
    const deliveryTime = searchParams.get('deliveryTime');

    return (
        <div className="w-64 flex-shrink-0 hidden lg:block pr-6 border-r border-white/5 h-fit sticky top-24">
            <h3 className="text-lg font-bold text-white mb-6">Filters</h3>

            <FilterSection title="Category">
                <div className="space-y-1">
                    <button
                        onClick={() => updateParam('category', null)}
                        className={cn(
                            "block w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors",
                            !currentCategory ? "bg-violet-500/10 text-violet-400 font-medium" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        All Categories
                    </button>
                    {jobCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => updateParam('category', cat.name)}
                            className={cn(
                                "block w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors",
                                currentCategory === cat.name ? "bg-violet-500/10 text-violet-400 font-medium" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Budget">
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-500">Min</label>
                        <input
                            type="number"
                            placeholder="$0"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                            onChange={(e) => {
                                // Debounce needed in real app, basic implementation for now
                                if (e.target.value) updateParam('minPrice', e.target.value);
                                else updateParam('minPrice', null);
                            }}
                            defaultValue={searchParams.get('minPrice') || ''}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-500">Max</label>
                        <input
                            type="number"
                            placeholder="$10k+"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                            onChange={(e) => {
                                if (e.target.value) updateParam('maxPrice', e.target.value);
                                else updateParam('maxPrice', null);
                            }}
                            defaultValue={searchParams.get('maxPrice') || ''}
                        />
                    </div>
                </div>
            </FilterSection>

            <FilterSection title="Delivery Time">
                <div className="space-y-2">
                    {[
                        { label: 'Any time', value: null },
                        { label: 'Up to 24 hours', value: '1' },
                        { label: 'Up to 3 days', value: '3' },
                        { label: 'Up to 7 days', value: '7' },
                    ].map((opt) => (
                        <label key={opt.label} className="flex items-center gap-3 cursor-pointer group">
                            <div className={cn(
                                "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                                deliveryTime === opt.value ? "border-violet-500 bg-violet-500" : "border-zinc-700 bg-transparent group-hover:border-zinc-500"
                            )}>
                                {deliveryTime === opt.value && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <input
                                type="radio"
                                name="delivery"
                                className="hidden"
                                checked={deliveryTime === opt.value}
                                onChange={() => updateParam('deliveryTime', opt.value)}
                            />
                            <span className={cn("text-sm group-hover:text-white transition-colors", deliveryTime === opt.value ? "text-white" : "text-zinc-400")}>
                                {opt.label}
                            </span>
                        </label>
                    ))}
                </div>
            </FilterSection>
        </div>
    );
}
