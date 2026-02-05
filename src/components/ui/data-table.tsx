'use client';

import React, { useState, useMemo } from 'react';
import {
    ChevronUp, ChevronDown, Search, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';

export interface Column<T> {
    key: string;
    header: string;
    sortable?: boolean;
    width?: string;
    render?: (row: T, rowIndex: number) => React.ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (row: T) => string;
    searchable?: boolean;
    searchPlaceholder?: string;
    searchKeys?: string[];
    pageSize?: number;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
    selectable?: boolean;
    onSelectionChange?: (selectedRows: T[]) => void;
    className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
    data,
    columns,
    keyExtractor,
    searchable = true,
    searchPlaceholder = 'Search...',
    searchKeys = [],
    pageSize = 10,
    emptyMessage = 'No data found',
    onRowClick,
    selectable = false,
    onSelectionChange,
    className = '',
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

    // Filter data by search
    const filteredData = useMemo(() => {
        if (!searchQuery) return data;

        const query = searchQuery.toLowerCase();
        const keysToSearch = searchKeys.length > 0 ? searchKeys : columns.map(c => c.key);

        return data.filter(row =>
            keysToSearch.some(key => {
                const value = row[key];
                return value?.toString().toLowerCase().includes(query);
            })
        );
    }, [data, searchQuery, searchKeys, columns]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortColumn) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            const comparison = aVal < bVal ? -1 : 1;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [filteredData, sortColumn, sortDirection]);

    // Paginate data
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    const handleSort = (column: Column<T>) => {
        if (!column.sortable) return;

        if (sortColumn === column.key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column.key);
            setSortDirection('asc');
        }
    };

    const toggleRowSelection = (rowKey: string) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(rowKey)) {
            newSelected.delete(rowKey);
        } else {
            newSelected.add(rowKey);
        }
        setSelectedRows(newSelected);

        if (onSelectionChange) {
            const selectedData = data.filter(row => newSelected.has(keyExtractor(row)));
            onSelectionChange(selectedData);
        }
    };

    const toggleAllSelection = () => {
        if (selectedRows.size === paginatedData.length) {
            setSelectedRows(new Set());
            onSelectionChange?.([]);
        } else {
            const allKeys = new Set(paginatedData.map(keyExtractor));
            setSelectedRows(allKeys);
            onSelectionChange?.(paginatedData);
        }
    };

    return (
        <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
            {/* Search */}
            {searchable && (
                <div className="p-4 border-b border-zinc-800">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={searchPlaceholder}
                            className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            {selectable && (
                                <th className="w-10 p-4">
                                    <input
                                        type="checkbox"
                                        checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                                        onChange={toggleAllSelection}
                                        className="rounded border-zinc-600 bg-zinc-700 text-indigo-500 focus:ring-indigo-500"
                                    />
                                </th>
                            )}
                            {columns.map(column => (
                                <th
                                    key={column.key}
                                    onClick={() => handleSort(column)}
                                    className={`text-left p-4 text-zinc-400 font-medium text-sm ${column.sortable ? 'cursor-pointer hover:text-white transition-colors' : ''
                                        }`}
                                    style={{ width: column.width }}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.header}
                                        {column.sortable && sortColumn === column.key && (
                                            sortDirection === 'asc'
                                                ? <ChevronUp className="w-4 h-4" />
                                                : <ChevronDown className="w-4 h-4" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (selectable ? 1 : 0)}
                                    className="p-8 text-center text-zinc-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIndex) => {
                                const rowKey = keyExtractor(row);
                                const isSelected = selectedRows.has(rowKey);

                                return (
                                    <tr
                                        key={rowKey}
                                        onClick={() => onRowClick?.(row)}
                                        className={`border-t border-zinc-800 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-zinc-800/50' : ''
                                            } ${isSelected ? 'bg-indigo-500/10' : ''}`}
                                    >
                                        {selectable && (
                                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleRowSelection(rowKey)}
                                                    className="rounded border-zinc-600 bg-zinc-700 text-indigo-500 focus:ring-indigo-500"
                                                />
                                            </td>
                                        )}
                                        {columns.map(column => (
                                            <td key={column.key} className="p-4 text-white">
                                                {column.render
                                                    ? column.render(row, rowIndex)
                                                    : String(row[column.key] ?? '')}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500 text-sm">
                        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-white px-3">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
