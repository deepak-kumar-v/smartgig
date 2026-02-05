'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    showFirstLast?: boolean;
    showPageNumbers?: boolean;
    maxVisiblePages?: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    showFirstLast = true,
    showPageNumbers = true,
    maxVisiblePages = 5,
    size = 'md',
    className = '',
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const sizeClasses = {
        sm: 'text-sm h-8 w-8',
        md: 'text-base h-10 w-10',
        lg: 'text-lg h-12 w-12',
    };

    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    const getVisiblePages = (): (number | string)[] => {
        const pages: (number | string)[] = [];

        if (totalPages <= maxVisiblePages) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        // Always show first page
        pages.push(1);

        const half = Math.floor(maxVisiblePages / 2);
        let start = Math.max(2, currentPage - half);
        let end = Math.min(totalPages - 1, currentPage + half);

        // Adjust if near start
        if (currentPage <= half + 1) {
            end = maxVisiblePages - 1;
        }
        // Adjust if near end
        if (currentPage >= totalPages - half) {
            start = totalPages - maxVisiblePages + 2;
        }

        // Add ellipsis if needed
        if (start > 2) {
            pages.push('...');
        }

        // Add middle pages
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        // Add ellipsis if needed
        if (end < totalPages - 1) {
            pages.push('...');
        }

        // Always show last page
        pages.push(totalPages);

        return pages;
    };

    const ButtonWrapper = ({
        onClick,
        disabled,
        active,
        children
    }: {
        onClick: () => void;
        disabled?: boolean;
        active?: boolean;
        children: React.ReactNode;
    }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                ${sizeClasses[size]} rounded-lg flex items-center justify-center transition-all
                ${active
                    ? 'bg-indigo-500 text-white'
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            {children}
        </button>
    );

    return (
        <nav className={`flex items-center gap-1 ${className}`}>
            {/* First */}
            {showFirstLast && (
                <ButtonWrapper onClick={() => onPageChange(1)} disabled={currentPage === 1}>
                    <ChevronsLeft className={iconSizes[size]} />
                </ButtonWrapper>
            )}

            {/* Previous */}
            <ButtonWrapper onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                <ChevronLeft className={iconSizes[size]} />
            </ButtonWrapper>

            {/* Page Numbers */}
            {showPageNumbers && getVisiblePages().map((page, index) => (
                typeof page === 'number' ? (
                    <ButtonWrapper
                        key={index}
                        onClick={() => onPageChange(page)}
                        active={page === currentPage}
                    >
                        {page}
                    </ButtonWrapper>
                ) : (
                    <span key={index} className="px-2 text-zinc-500">...</span>
                )
            ))}

            {/* Next */}
            <ButtonWrapper onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                <ChevronRight className={iconSizes[size]} />
            </ButtonWrapper>

            {/* Last */}
            {showFirstLast && (
                <ButtonWrapper onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
                    <ChevronsRight className={iconSizes[size]} />
                </ButtonWrapper>
            )}
        </nav>
    );
}

// Simple pagination with just showing "Page X of Y"
interface SimplePaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function SimplePagination({ currentPage, totalPages, onPageChange, className = '' }: SimplePaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className={`flex items-center gap-4 ${className}`}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                Previous
            </button>
            <span className="text-zinc-400">
                Page <span className="text-white font-medium">{currentPage}</span> of <span className="text-white font-medium">{totalPages}</span>
            </span>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                Next
            </button>
        </div>
    );
}
