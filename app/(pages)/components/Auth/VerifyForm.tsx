"use client";

import { useAuthModalStore } from "@/app/hooks/useAuthModalStore";
import { toast } from '@/app/lib/toast';
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";

export const VerifyForm = () => {
    const { verifyEmail, setView, closeModal } = useAuthModalStore();
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState(verifyEmail || "");
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
        if (pastedData.length === 6 && pastedData.every(char => /^\d$/.test(char))) {
            setCode(pastedData);
            inputRefs.current[5]?.focus();
        }
    };

    const resendCode = async () => {
        if (!email) {
            toast.error("Email is required for resending code");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Verification code resent!");
            } else {
                toast.error(data.message || "Failed to resend code");
            }
        } catch {
            toast.error("Network error while resending");
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async () => {
        const fullCode = code.join("");
        if (fullCode.length !== 6) {
            toast.error("Please enter a complete 6-digit code");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/verify-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, code: fullCode }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Account Verified!");
                setTimeout(() => {
                    setView('login');
                    // Optionally autofill login or just let them login
                }, 1000);
            } else {
                toast.error(data.message || "Verification failed");
            }
        } catch {
            toast.error("An error occurred during verification");
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
                        Verify <span className="text-transparent bg-clip-text bg-linear-to-r from-white to-white/60">Identity</span>
                    </h1>
                    <p className="text-xs text-zinc-400 font-medium tracking-wide">
                        Enter code sent to {verifyEmail ? <span className="text-white">{verifyEmail}</span> : "your email"}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-2 max-w-[280px] mx-auto leading-relaxed">
                        If you don't receive the code, please check your <span className="text-zinc-400 font-semibold">spam folder</span>.
                    </p>
                </motion.div>
            </div>

            <div className="space-y-6">
                {!verifyEmail && (
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 ml-1">Email</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            placeholder="Enter your email"
                            className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl focus:border-white/20 focus:bg-white/10 focus:ring-4 focus:ring-white/5 outline-none transition-all placeholder:text-zinc-600 text-sm text-white font-medium"
                        />
                    </div>
                )}

                <div className="flex justify-center gap-2">
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            className="w-11 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:border-white/30 focus:bg-white/10 focus:ring-4 focus:ring-white/5 outline-none transition-all placeholder-white/10"
                        />
                    ))}
                </div>

                <button
                    disabled={loading || code.join("").length !== 6}
                    onClick={verifyCode}
                    className="relative w-full h-12 bg-white text-black font-bold text-sm tracking-wide rounded-xl overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    <div className="relative flex items-center justify-center gap-2">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Verify Code</span>
                                <FiCheckCircle className="group-hover:scale-110 transition-transform" />
                            </>
                        )}
                    </div>
                </button>
            </div>

            <div className="text-center border-t border-white/5 pt-6">
                <p className="text-xs text-zinc-500">
                    Did not receive?{" "}
                    <button
                        onClick={resendCode}
                        disabled={loading}
                        className="text-white font-bold hover:underline decoration-white/30 underline-offset-4 transition-all disabled:opacity-50"
                    >
                        Resend
                    </button>
                </p>
            </div>
        </div>
    );
};
