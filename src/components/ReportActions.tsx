"use client";

import { useState } from "react";
import { updateReportStatus } from "@/actions/reports";
import { useRouter } from "next/navigation";

export default function ReportActions({ reportId, currentStatus }: { reportId: string, currentStatus: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleStatusUpdate = async (status: "RESOLVED" | "DISMISSED") => {
        if (!confirm(`Are you sure you want to mark this report as ${status}?`)) return;
        setLoading(true);
        try {
            const res = await updateReportStatus(reportId, status);
            if (res.success) {
                router.refresh();
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (currentStatus !== "PENDING") {
        return (
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                    Report is {currentStatus}
                </p>
            </div>
        );
    }

    return (
        <div className="flex gap-4">
            <button
                onClick={() => handleStatusUpdate("RESOLVED")}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50"
            >
                Resolve
            </button>
            <button
                onClick={() => handleStatusUpdate("DISMISSED")}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
            >
                Dismiss
            </button>
        </div>
    );
}
