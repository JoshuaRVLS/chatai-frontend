"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import DataTable from "@/components/DataTable";
import { getReports } from "@/actions/reports";
import Link from "next/link";
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import SkeletonLoader, { TableSkeleton } from '@/components/SkeletonLoader';

interface Report {
    id: string;
    reason: string;
    details: string | null;
    status: "PENDING" | "RESOLVED" | "DISMISSED";
    createdAt: Date;
    reporter: { username: string; email: string };
    targetUser: { username: string; email: string } | null;
    targetCharacter: { name: string } | null;
}

export default function ReportsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);

    const fetchReportsWrapper = async () => {
        const { reports, total } = await getReports(page, 10);
        return { reports, total };
    };

    const { data, isLoading, isPlaceholderData } = useQuery({
        queryKey: ['reports', page],
        queryFn: fetchReportsWrapper,
        placeholderData: keepPreviousData,
        refetchInterval: 10000,
    });

    const reportsList = (data?.reports as any) || [];
    const total = data?.total || 0;

    const columns = [
        {
            key: "status",
            header: "Status",
            render: (report: Report) => {
                let color = "bg-zinc-500/20 text-zinc-400";
                if (report.status === "PENDING") color = "bg-orange-500/20 text-orange-400";
                if (report.status === "RESOLVED") color = "bg-emerald-500/20 text-emerald-400";
                if (report.status === "DISMISSED") color = "bg-red-500/20 text-red-400";

                return (
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${color}`}>
                        {report.status}
                    </span>
                );
            },
        },
        {
            key: "reason",
            header: "Report",
            render: (report: Report) => (
                <div className="flex flex-col">
                    <span className="text-white font-bold text-xs">{report.reason}</span>
                    <span className="text-zinc-500 text-[10px] truncate max-w-[200px]">{report.details || "No details"}</span>
                </div>
            )
        },
        {
            key: "targets",
            header: "Involved Parties",
            render: (report: Report) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-zinc-500 uppercase tracking-wider">From:</span>
                        <span className="text-zinc-300 font-bold">{report.reporter.username}</span>
                    </div>
                    {report.targetUser && (
                        <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-zinc-500 uppercase tracking-wider">Target User:</span>
                            <span className="text-red-400 font-bold">{report.targetUser.username}</span>
                        </div>
                    )}
                    {report.targetCharacter && (
                        <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-zinc-500 uppercase tracking-wider">Target Char:</span>
                            <span className="text-red-400 font-bold">{report.targetCharacter.name}</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            key: "date",
            header: "Date",
            render: (report: Report) => (
                <span className="text-zinc-500 text-[10px] font-mono">
                    {new Date(report.createdAt).toLocaleDateString()}
                </span>
            )
        },
        {
            key: "actions",
            header: "Action",
            render: (report: Report) => (
                <Link
                    href={`/reports/${report.id}`}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-all"
                >
                    View Details
                </Link>
            )
        }
    ];

    return (
        <div className="flex flex-col">
            <Header title="Report Management" subtitle="Review and resolve user reports" />

            {/* Refetching indicator */}
            {data && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['reports'] })}
                        disabled={isLoading}
                        className="bg-white/5 border border-white/5 rounded-2xl p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-inner"
                        title="Refresh Data"
                    >
                        <svg
                            className={`w-5 h-5 ${isLoading && !isPlaceholderData ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="mt-8 transition-opacity">
                {isLoading && !data ? (
                    <TableSkeleton />
                ) : (
                    <DataTable
                        columns={columns as any}
                        data={reportsList}
                        pagination={{
                            page,
                            total,
                            limit: 10,
                            onPageChange: setPage
                        }}
                    />
                )}
            </div>
        </div>
    );
}
