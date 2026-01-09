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
                .catch(console.error);
        }
    }, [session]);

    const handleRefresh = async () => {
        await update(); // Refreshes the token via DB fetch
        router.push('/');
        router.refresh(); // Ensure middleware re-runs
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
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="max-w-lg w-full text-center">
                    <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-8">
                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-white mb-4">
                        Access Restored
                    </h1>
                    <p className="text-xs uppercase tracking-widest font-bold text-zinc-500 mb-8">
                        Your suspension has ended. You may now return to the application.
                    </p>
                    <button
                        onClick={handleRefresh}
                        className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-lg w-full text-center">
                {/* Icon */}
                <div className="mx-auto w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-8 animate-pulse">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-white mb-4">
                    Account Suspended
                </h1>

                {/* Subtitle */}
                <p className="text-xs uppercase tracking-widest font-bold text-zinc-500 mb-8">
                    Your access to JChatAI has been temporarily restricted
                </p>

                {/* Info Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left space-y-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-1">Duration</p>
                        <p className={`text-sm font-bold ${isPermanent ? 'text-red-400' : 'text-white'}`}>
                            {formatDate(suspensionInfo.suspendedUntil)}
                        </p>
                    </div>

                    {suspensionInfo.suspensionReason && (
                        <div>
                            <p className="text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-1">Reason</p>
                            <p className="text-sm font-bold text-zinc-300">{suspensionInfo.suspensionReason}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <a
                        href="mailto:support@jchatai.space"
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 transition-all"
                    >
                        Contact Support
                    </a>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
