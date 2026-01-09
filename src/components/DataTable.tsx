'use client';

import { useState } from 'react';

interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (item: T) => void;
    pagination?: {
        page: number;
        total: number;
        limit: number;
        onPageChange: (newPage: number) => void;
    };
}

export default function DataTable<T extends { id: string | number }>({
    columns,
    data,
    onRowClick,
    pagination,
}: DataTableProps<T>) {
    const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());

    const toggleRow = (id: string | number) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedRows(newSelected);
    };

    const toggleAll = () => {
        if (selectedRows.size === data.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(data.map((item) => item.id)));
        }
    };

    return (
        <div className="glass rounded-2xl overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/2.5">
                            <th className="px-6 py-4 w-12">
                                <input
                                    type="checkbox"
                                    checked={selectedRows.size === data.length && data.length > 0}
                                    onChange={toggleAll}
                                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-white focus:ring-white/20 focus:ring-offset-0 cursor-pointer"
                                />
                            </th>
                            {columns.map((column) => (
                                <th
                                    key={String(column.key)}
                                    className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]"
                                >
                                    {column.header}
                                </th>
                            ))}
                            <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map((item) => (
                            <tr
                                key={item.id}
                                onClick={() => onRowClick?.(item)}
                                className={`group/row transition-all duration-300 ${onRowClick ? 'cursor-pointer' : ''
                                    } ${selectedRows.has(item.id) ? 'bg-white/5' : 'hover:bg-white/2.5'}`}
                            >
                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.has(item.id)}
                                        onChange={() => toggleRow(item.id)}
                                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-white focus:ring-white/20 focus:ring-offset-0 cursor-pointer"
                                    />
                                </td>
                                {columns.map((column) => (
                                    <td key={String(column.key)} className="px-6 py-4 text-xs font-medium text-zinc-300">
                                        {column.render
                                            ? column.render(item)
                                            : String(item[column.key as keyof T] ?? '')}
                                    </td>
                                ))}
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <button className="p-2 rounded-lg bg-white/5 border border-white/5 text-zinc-600 group-hover/row:text-white group-hover/row:border-white/10 transition-all">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/2.5">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                        Page <span className="text-zinc-400">{pagination.page}</span> of {Math.ceil(pagination.total / pagination.limit)}
                    </p>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                            disabled={pagination.page === 1}
                            className="btn btn-secondary px-3 py-1.5 text-[10px]"
                        >
                            Prev
                        </button>
                        <button 
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                            className="btn btn-secondary px-3 py-1.5 text-[10px]"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
