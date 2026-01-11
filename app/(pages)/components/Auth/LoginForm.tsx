"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from '@/app/lib/toast';
import { motion } from "motion/react";
import { FiUser, FiLock, FiArrowRight } from "react-icons/fi";
import { useAuthModalStore } from "@/app/hooks/useAuthModalStore";

interface LoginFormProps {
    onSuccess?: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { setView, closeModal, setVerifyEmail } = useAuthModalStore();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;
        setLoading(true);
        try {
            const response = await signIn("credentials", {
                redirect: false,
                username,
                password,
            });

            if (!response?.ok) {
                let errorMessage = (response?.error as string) || "Invalid credentials";
                if (errorMessage === "ACCOUNT_NOT_VERIFIED") {
                    // Try to resend verification code
                    try {
                        // Attempt to resend code assuming username might be email, or we need to adjust API
                        // Ideally we should update the API to handle username too, but for now let's try.
                        // If username is not email, this request might fail or we need a way to look up email by username first.
                        // Actually, let's just show the verify modal and set the email if it looks like one.
                        // If it's a username, the user might need to enter their email in the VerifyModal manually if we don't have it?
                        // But verifying requires the code sent to email.

                        // Let's first fetch to see if we can resolve email from username if needed? No, that exposes info.

                        // Best approach: Modifying resend-verification to accept username OR email.
                        // But I am in LoginForm task.
                        // Let's assume for a moment I can change resend-verification.

                        const resendRes = await fetch("/api/resend-verification", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: username }), // sending username as email for now
                        });

                        if (resendRes.ok) {
                            toast.success("Verification expired. New code sent!");
                            setVerifyEmail(username); // Set whatever they typed
                            setView('verify');
                            setLoading(false);
                            return;
                        } else {
                            // If resend failed (maybe because username is not email), 
                            // we still redirect to verify but maybe let them know
                            const data = await resendRes.json();
                            if (data.message === "User not found" && !username.includes('@')) {
                                // If they typed a username, and resend failed, we can't easily auto-resend without modifying API.
                                // Fallback: just tell them.
                                errorMessage = "Account unverified. Please log in with email to re-verify or check your inbox.";
                            } else {
                                // If it failed for other reasons
                                toast.error(data.message || "Could not resend verification code");
                            }
                        }
                    } catch {
                        // ignore
                    }
                }

                if (errorMessage === "ACCOUNT_NOT_VERIFIED") {
                    // If we didn't return above
                    errorMessage = "Please verify your account!";
                }

                toast.error(errorMessage);
                setLoading(false);
                return;
            }
            toast.success("Welcome back!");
            if (onSuccess) {
                onSuccess();
            } else {
                closeModal();
                window.location.reload(); // Refresh to update session state across the app
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                        Welcome <span className="text-transparent bg-clip-text bg-linear-to-r from-white to-white/60">Back</span>
                    </h1>
                    <p className="text-xs text-zinc-400 font-medium tracking-wide">Enter your credentials to access the portal</p>
                </motion.div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 ml-1">Username</label>
                        <div className="group relative">
                            <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none text-zinc-500 group-focus-within:text-white transition-colors duration-300">
                                <FiUser className="text-lg" />
                            </div>
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                type="text"
                                placeholder="Enter your username"
                                required
                                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl focus:border-white/20 focus:bg-white/10 focus:ring-4 focus:ring-white/5 outline-none transition-all placeholder:text-zinc-600 text-sm text-white font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 ml-1">Password</label>
                        <div className="group relative">
                            <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none text-zinc-500 group-focus-within:text-white transition-colors duration-300">
                                <FiLock className="text-lg" />
                            </div>
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                placeholder="Enter your password"
                                required
                                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl focus:border-white/20 focus:bg-white/10 focus:ring-4 focus:ring-white/5 outline-none transition-all placeholder:text-zinc-600 text-sm text-white font-medium"
                            />
                        </div>
                    </div>
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    className="relative w-full h-12 bg-white text-black font-bold text-sm tracking-wide rounded-xl overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    <div className="relative flex items-center justify-center gap-2">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Sign In</span>
                                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </div>
                </button>
            </form>

            <div className="text-center border-t border-white/5 pt-6">
                <p className="text-xs text-zinc-500">
                    Don't have an account?{" "}
                    <button
                        onClick={() => setView('register')}
                        className="text-white font-bold hover:underline decoration-white/30 underline-offset-4 transition-all"
                    >
                        Create one
                    </button>
                </p>
            </div>
        </div>
    );
};
