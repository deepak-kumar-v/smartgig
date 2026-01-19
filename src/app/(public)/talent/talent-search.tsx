'use client';

import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

const skillCategories = [
    { name: 'All Skills', value: 'all' },
    { name: 'Web Development', value: 'web' },
    { name: 'Mobile Development', value: 'mobile' },
    { name: 'UI/UX Design', value: 'design' },
    { name: 'Data Science', value: 'data' },
    { name: 'DevOps', value: 'devops' },
    { name: 'Marketing', value: 'marketing' },
];

const rateRanges = [
    { label: 'Any Rate', value: 'any' },
    { label: '$0 - $50/hr', value: '0-50' },
    { label: '$50 - $100/hr', value: '50-100' },
    { label: '$100 - $150/hr', value: '100-150' },
    { label: '$150+/hr', value: '150+' },
];

export function TalentSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedRate, setSelectedRate] = useState('any');
    const [showFilters, setShowFilters] = useState(false);

    const hasActiveFilters = selectedCategory !== 'all' || selectedRate !== 'any';

    const clearFilters = () => {
        setSelectedCategory('all');
        setSelectedRate('any');
        setSearchQuery('');
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Main Search Bar */}
            <div className="relative">
                <div className="flex gap-3">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search by skill, name, or expertise..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-base"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Toggle Button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-5 py-4 rounded-xl border transition-all ${showFilters || hasActiveFilters
                                ? 'bg-violet-600 border-violet-600 text-white'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filters</span>
                        {hasActiveFilters && (
                            <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center">
                                {(selectedCategory !== 'all' ? 1 : 0) + (selectedRate !== 'any' ? 1 : 0)}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="mt-4 p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category Filter */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-3">
                                Skill Category
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-violet-500/50"
                                >
                                    {skillCategories.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* Rate Filter */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-3">
                                Hourly Rate
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedRate}
                                    onChange={(e) => setSelectedRate(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-violet-500/50"
                                >
                                    {rateRanges.map((rate) => (
                                        <option key={rate.value} value={rate.value}>
                                            {rate.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
                        <button
                            onClick={clearFilters}
                            className="text-sm text-zinc-500 hover:text-white transition-colors"
                        >
                            Clear all filters
                        </button>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-500 transition-colors"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Active Filter Tags */}
            {hasActiveFilters && !showFilters && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="text-sm text-zinc-500">Active filters:</span>
                    {selectedCategory !== 'all' && (
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 text-violet-400 rounded-lg text-sm hover:bg-violet-500/30 transition-colors"
                        >
                            {skillCategories.find(c => c.value === selectedCategory)?.name}
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    {selectedRate !== 'any' && (
                        <button
                            onClick={() => setSelectedRate('any')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 text-violet-400 rounded-lg text-sm hover:bg-violet-500/30 transition-colors"
                        >
                            {rateRanges.find(r => r.value === selectedRate)?.label}
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <button
                        onClick={clearFilters}
                        className="text-sm text-zinc-500 hover:text-white transition-colors ml-2"
                    >
                        Clear all
                    </button>
                </div>
            )}
        </div>
    );
}
