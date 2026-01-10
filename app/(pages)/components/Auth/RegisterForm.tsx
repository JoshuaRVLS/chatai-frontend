"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from '@/app/lib/toast';
import { FiUser, FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { useAuthModalStore } from "@/app/hooks/useAuthModalStore";

export const RegisterForm = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const setView = useAuthModalStore((state) => state.setView);
    const router = useRouter();

    useEffect(() => {
        if (password !== confirmPassword && confirmPassword.length > 0) {
            setFormError("Key mismatch");
        } else {
            setFormError("");
        }
    }, [password, confirmPassword]);

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        if (formError) return toast.error("Please resolve security mismatch");
        setLoading(true);

        try {
            const response = await fetch("/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username.trim(),
                    email: email.trim(),
                    password,
                    confirmPassword,
                }),
            });

            const data = await response.json();
            if (!data.success) {
                toast.error(data.message || "Protocol activation failed");
                setLoading(false);
                return;
            }

            toast.success("Identity established! Check transmission (email).");
            // setView('login');
            router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        } catch {
            toast.error("Subsystem failure");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black tracking-tighter text-white">
                    NEW <span className="text-primary italic">ENTITY</span>
                </h1>
                <p className="text-[10px] text-white/50 uppercase tracking-[0.4em] font-medium">Establish Credentials</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-4">Handle</label>
                        <div className="group/input relative">
                            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-primary transition-colors duration-300" />
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                type="text"
                                placeholder="Username"
                                required
                                className="input-modern has-icon h-11 bg-white/3! border-white/5! focus:border-primary/40!"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-4">Mail Link</label>
                        <div className="group/input relative">
                            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-primary transition-colors duration-300" />
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                placeholder="Email Address"
                                required
                                className="input-modern has-icon h-11 bg-white/3! border-white/5! focus:border-primary/40!"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-4">Primary Key</label>
                            <div className="group/input relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-primary transition-colors duration-300" />
                                <input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="input-modern has-icon h-11 bg-white/3! border-white/5! focus:border-primary/40!"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-4">Verify Key</label>
                            <div className="group/input relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-primary transition-colors duration-300" />
                                <input
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className={`input-modern has-icon h-11 bg-white/3! border-white/5! focus:border-primary/40! ${formError ? 'border-error/40 ring-1 ring-error/10' : ''}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {formError && (
                    <p className="text-[8px] text-error font-bold uppercase tracking-widest text-center animate-pulse">{formError}</p>
                )}

                <button
                    disabled={loading || !!formError}
                    type="submit"
                    className="btn-primary w-full h-11 text-[10px] uppercase tracking-[0.3em] font-black flex items-center justify-center gap-3 overflow-hidden group/btn"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <span className="relative z-10">Establish Identity</span>
                            <FiArrowRight className="relative z-10 group-hover/btn:translate-x-2 transition-transform duration-500" />
                        </>
                    )}
                </button>
            </form>

            <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                    Internalized?{" "}
                    <button
                        onClick={() => setView('login')}
                        className="text-primary font-bold hover:text-white transition-colors"
                    >
                        Initiate Login
                    </button>
                </p>
            </div>
        </div>
    );
};
