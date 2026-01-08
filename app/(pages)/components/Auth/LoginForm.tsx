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
    const setView = useAuthModalStore((state) => state.setView);
    const closeModal = useAuthModalStore((state) => state.closeModal);

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
                    errorMessage = "Please verify your account first!";
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
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black tracking-tighter text-white">
                    JCHAT <span className="text-primary italic">AI</span>
                </h1>
                <p className="text-[10px] text-white/50 uppercase tracking-[0.4em] font-medium">Access Portal</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-4">Identity</label>
                        <div className="group/input relative">
                            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-primary transition-colors duration-300" />
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                type="text"
                                placeholder="Enter Username"
                                required
                                className="input-modern has-icon h-11 bg-white/3! border-white/5! focus:border-primary/40!"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-4">Access Key</label>
                        <div className="group/input relative">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-primary transition-colors duration-300" />
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                placeholder="Enter Password"
                                required
                                className="input-modern has-icon h-11 bg-white/3! border-white/5! focus:border-primary/40!"
                            />
                        </div>
                    </div>
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    className="btn-primary w-full h-11 text-[10px] uppercase tracking-[0.3em] font-black flex items-center justify-center gap-3 overflow-hidden group/btn"
                >
                    {loading ? (
                        <div className="bg-zinc-900 border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] rounded-4xl overflow-hidden">
                            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <span className="relative z-10">Login</span>
                            <FiArrowRight className="relative z-10 group-hover/btn:translate-x-2 transition-transform duration-500" />
                        </>
                    )}
                </button>
            </form>

            <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                    New here?{" "}
                    <button
                        onClick={() => setView('register')}
                        className="text-primary font-bold hover:text-white transition-colors"
                    >
                        Register
                    </button>
                </p>
            </div>
        </div>
    );
};
