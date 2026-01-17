'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SuspendedPage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [suspensionInfo, setSuspensionInfo] = useState<{
        suspendedUntil: string | null;
        suspensionReason: string | null;
    }>({ suspendedUntil: null, suspensionReason: null });
    const [isUnsuspended, setIsUnsuspended] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.email) {
            fetch(`/api/settings/suspended?email=${encodeURIComponent(session.user.email)}`)
                .then(res => res.json())
                .then(data => {
                    const until = data.suspendedUntil;
                    const isNowSuspended = until ? new Date(until) > new Date() : false;

                    setSuspensionInfo({
                        suspendedUntil: until,
                        suspensionReason: data.suspensionReason
                    });

                    if (!isNowSuspended && until !== undefined) {
                        setIsUnsuspended(true);
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        } else if (status !== "loading") {
            setLoading(false);
        }
    }, [session]);

    const handleRefresh = async () => {
        await update(); // Refreshes the token via DB fetch
        window.location.href = '/'; // Force hard reload to ensure middleware receives fresh cookie
    };

    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return 'Unknown';
        const date = new Date(dateStr);
        if (date.getFullYear() >= 2099) return 'Permanent';
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isPermanent = suspensionInfo.suspendedUntil
        ? new Date(suspensionInfo.suspendedUntil).getFullYear() >= 2099
        : false;

    // Render Logic for Unsuspended
    if (isUnsuspended) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center p-6 relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-500/10 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[100px] rounded-full" />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-border-default border-t-red-500 rounded-full animate-spin" />
                        <p className="text-text-muted font-black uppercase tracking-[0.3em] text-[10px]">Loading Status...</p>
                    </div>
                ) : (
                    <div className="max-w-lg w-full text-center relative z-10">
                        <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-8">
                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-text-primary mb-4">
                            Access Restored
                        </h1>
                        <p className="text-xs uppercase tracking-widest font-bold text-text-muted mb-8">
                            Your suspension has ended. You may now return to the application.
                        </p>
                        <button
                            onClick={handleRefresh}
                            className="px-6 py-3 bg-surface-hover border border-border-default rounded-xl text-xs font-black uppercase tracking-widest text-text-primary hover:bg-surface transition-all"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page flex items-center justify-center p-6 relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[100px] rounded-full" />
            </div>

            {loading ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-border-default border-t-red-500 rounded-full animate-spin" />
                    <p className="text-text-muted font-black uppercase tracking-[0.3em] text-[10px]">Loading Status...</p>
                </div>
            ) : (
                <div className="max-w-lg w-full text-center relative z-10">
                    {/* Icon */}
                    <div className="mx-auto w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-8 animate-pulse">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-text-primary mb-4">
                        Account Suspended
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xs uppercase tracking-widest font-bold text-text-muted mb-8">
                        Your access to JChatAI has been temporarily restricted
                    </p>

                    {/* Info Card */}
                    <div className="bg-surface-hover border border-border-default rounded-2xl p-6 mb-8 text-left space-y-4">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest font-black text-text-muted mb-1">Duration</p>
                            <p className={`text-sm font-bold ${isPermanent ? 'text-red-400' : 'text-text-primary'}`}>
                                {formatDate(suspensionInfo.suspendedUntil)}
                            </p>
                        </div>

                        {suspensionInfo.suspensionReason && (
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-black text-text-muted mb-1">Reason</p>
                                <p className="text-sm font-bold text-text-secondary">{suspensionInfo.suspensionReason}</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="px-6 py-3 bg-surface-hover border border-border-default rounded-xl text-xs font-black uppercase tracking-widest text-text-primary hover:bg-surface transition-all"
                        >
                            Sign Out
                        </button>
                        <a
                            href="mailto:support@jchatai.space"
                            className="px-6 py-3 bg-text-primary text-white dark:text-black rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                            Contact Support
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
