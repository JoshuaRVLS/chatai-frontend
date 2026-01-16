"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from '@/app/lib/toast';
import { FiUser, FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { useAuthModalStore } from "@/app/hooks/useAuthModalStore";
import { motion } from "motion/react";

export const RegisterForm = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const { setView, setVerifyEmail } = useAuthModalStore();
    const router = useRouter();

    useEffect(() => {
        if (password !== confirmPassword && confirmPassword.length > 0) {
            setFormError("Key mismatch");
        } else {
            setFormError("");
        }
    }, [password, confirmPassword]);

    const calculateStrength = (pwd: string) => {
        let strength = 0;
        if (pwd.length > 6) strength++;
        if (pwd.length > 10) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/[0-9]/.test(pwd)) strength++;
        return strength; // 0-4
    };

    const getStrengthColor = (strength: number) => {
        if (strength <= 1) return "bg-red-500";
        if (strength === 2) return "bg-orange-500";
        if (strength === 3) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getStrengthTextAndColor = (strength: number) => {
        if (strength <= 1) return { text: "Weak", color: "text-red-500" };
        if (strength === 2) return { text: "Fair", color: "text-orange-500" };
        if (strength === 3) return { text: "Good", color: "text-yellow-500" };
        return { text: "Strong", color: "text-green-500" };
    };

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
                toast.error(data.message || "Account Registration failed");
                setLoading(false);
                return;
            }

            toast.success("Account Registered! Please check your email for verification.");
            setVerifyEmail(email);
            setView('verify');
        } catch {
            toast.error("Subsystem failure");
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
                        Create <span className="text-transparent bg-clip-text bg-linear-to-r from-white to-white/60">Account</span>
                    </h1>
                    <p className="text-xs text-zinc-400 font-medium tracking-wide">Join us to start your journey</p>
                </motion.div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
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
                            placeholder="Choose a username"
                            required
                            className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl focus:border-white/20 focus:bg-white/10 focus:ring-4 focus:ring-white/5 outline-none transition-all placeholder:text-zinc-600 text-sm text-white font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 ml-1">Email</label>
                    <div className="group relative">
                        <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none text-zinc-500 group-focus-within:text-white transition-colors duration-300">
                            <FiMail className="text-lg" />
                        </div>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            placeholder="Enter your email"
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
                            placeholder="Create password"
                            required
                            className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl focus:border-white/20 focus:bg-white/10 focus:ring-4 focus:ring-white/5 outline-none transition-all placeholder:text-zinc-600 text-sm text-white font-medium"
                        />
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                        <div className="space-y-1 pt-1">
                            <div className="flex gap-1 h-1">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-full rounded-full flex-1 transition-all duration-300 ${i < calculateStrength(password)
                                            ? getStrengthColor(calculateStrength(password))
                                            : "bg-white/5"
                                            }`}
                                    />
                                ))}
                            </div>
                            <p className={`text-[10px] uppercase tracking-wider font-bold text-right transition-colors ${getStrengthTextAndColor(calculateStrength(password)).color}`}>
                                {getStrengthTextAndColor(calculateStrength(password)).text}
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 ml-1">Confirm</label>
                    <div className="group relative">
                        <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none text-zinc-500 group-focus-within:text-white transition-colors duration-300">
                            <FiLock className="text-lg" />
                        </div>
                        <input
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            type="password"
                            placeholder="Confirm password"
                            required
                            className={`w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl focus:border-white/20 focus:bg-white/10 focus:ring-4 focus:ring-white/5 outline-none transition-all placeholder:text-zinc-600 text-sm text-white font-medium ${formError ? 'border-red-500/50 ring-1 ring-red-500/20' : ''}`}
                        />
                    </div>
                </div>

                {formError && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-xs text-red-400 font-medium text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20"
                    >
                        {formError}
                    </motion.p>
                )}

                <button
                    disabled={loading || !!formError}
                    type="submit"
                    className="relative w-full h-12 bg-white text-black font-bold text-sm tracking-wide rounded-xl overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
                >
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    <div className="relative flex items-center justify-center gap-2">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Register</span>
                                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </div>
                </button>
            </form>

            <div className="text-center border-t border-white/5 pt-6">
                <p className="text-xs text-zinc-500">
                    Already have an account?{" "}
                    <button
                        onClick={() => setView('login')}
                        className="text-white font-bold hover:underline decoration-white/30 underline-offset-4 transition-all"
                    >
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
};
