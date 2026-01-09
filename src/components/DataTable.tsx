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
}

export default function DataTable<T extends { id: string | number }>({
    columns,
    data,
    onRowClick,
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
        <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--border)]">
                            <th className="px-4 py-3 text-left w-12">
                                <input
                                    type="checkbox"
                                    checked={selectedRows.size === data.length && data.length > 0}
                                    onChange={toggleAll}
                                    className="w-4 h-4 rounded border-[var(--border)] bg-[var(--card)] text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-offset-0"
                                />
                            </th>
                            {columns.map((column) => (
                                <th
                                    key={String(column.key)}
                                    className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider"
                                >
                                    {column.header}
                                </th>
                            ))}
                            <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {data.map((item) => (
                            <tr
                                key={item.id}
                                onClick={() => onRowClick?.(item)}
                                className={`hover:bg-[var(--card-hover)] transition-colors ${onRowClick ? 'cursor-pointer' : ''
                                    } ${selectedRows.has(item.id) ? 'bg-[var(--primary)]/5' : ''}`}
                            >
                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.has(item.id)}
                                        onChange={() => toggleRow(item.id)}
                                        className="w-4 h-4 rounded border-[var(--border)] bg-[var(--card)] text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-offset-0"
                                    />
                                </td>
                                {columns.map((column) => (
                                    <td key={String(column.key)} className="px-4 py-3 text-sm">
                                        {column.render
                                            ? column.render(item)
                                            : String(item[column.key as keyof T] ?? '')}
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                    <button className="p-1.5 rounded hover:bg-[var(--card)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--muted)]">
                    Showing <span className="font-medium">{data.length}</span> results
                </p>
                <div className="flex gap-2">
                    <button className="btn btn-secondary py-1.5 px-3 text-sm" disabled>
                        Previous
                    </button>
                    <button className="btn btn-secondary py-1.5 px-3 text-sm">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
