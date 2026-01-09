'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    const urlError = searchParams.get('error');
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                username,
                password,
                redirect: false,
                callbackUrl,
            });

            if (result?.error) {
                if (result.error === 'ACCESS_DENIED') {
                    setError('Access denied. Admin privileges required.');
                } else {
                    setError('Invalid username or password');
                }
            } else if (result?.ok) {
                window.location.href = callbackUrl;
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm animate-fade-in">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 shadow-inner">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Secure Node</span>
                </div>
                <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white mb-2 selection:bg-white selection:text-zinc-950">
                    JChatAI <span className="text-zinc-700">Admin</span>
                </h1>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-loose">
                    Controlled Environment &bull; Authorized Only
                </p>
            </div>

            {/* Login Card */}
            <div className="card-premium p-10 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

                {(error || urlError === 'AccessDenied') && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl mb-8 text-[10px] font-black uppercase tracking-widest text-center animate-fade-in flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {error || 'Access denied. Administrator privileges required.'}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 ml-1">Identity</label>
                        <input
                            type="text"
                            className="w-full px-5 py-3.5 bg-white/3 border border-white/5 rounded-2xl text-white text-xs font-bold focus:outline-none focus:border-white/10 focus:bg-white/5 transition-all placeholder:text-zinc-700 shadow-inner"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username or Email"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 ml-1">Access Code</label>
                        <input
                            type="password"
                            className="w-full px-5 py-3.5 bg-white/3 border border-white/5 rounded-2xl text-white text-xs font-bold focus:outline-none focus:border-white/10 focus:bg-white/5 transition-all placeholder:text-zinc-700 shadow-inner"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 rounded-2xl bg-white text-zinc-950 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-zinc-200 active:scale-95 disabled:opacity-50 shadow-xl shadow-black/20 mt-4 cursor-pointer"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-3">
                                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Authenticating...
                            </span>
                        ) : (
                            'Initialize Session'
                        )}
                    </button>
                </form>
            </div>

            <div className="mt-12 flex items-center justify-center gap-3 opacity-30 grayscale hover:opacity-80 hover:grayscale-0 transition-all cursor-default">
                <div className="h-px w-8 bg-white/20" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">System Core v2.0</span>
                <div className="h-px w-8 bg-white/20" />
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-(--background) p-4">
            <Suspense fallback={<div className="text-(--muted)">Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
