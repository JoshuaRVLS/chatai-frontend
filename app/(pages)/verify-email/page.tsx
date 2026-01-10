"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useRef, useEffect } from "react";
import { toast } from "@/app/lib/toast";
import { motion } from "motion/react";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";

const VerifyEmailComponent = () => {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const router = useRouter();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(emailParam || "");
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
    } catch (error) {
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
        toast.success("Verification successful! Redirecting...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        toast.error(data.message || "Verification failed");
      }
    } catch (error) {
      toast.error("An error occurred during verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden pt-24">
      {/* Aurora Background */}
      <div className="aurora-bg absolute inset-0 pointer-events-none">
        <div className="aurora-blob w-[500px] h-[500px] bg-primary/20 top-[-10%] left-[-10%]" />
        <div className="aurora-blob w-[600px] h-[600px] bg-secondary/15 bottom-[-20%] right-[-10%] animate-delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md z-10"
      >
        <div className="card-premium space-y-8 relative">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-black tracking-tighter text-white">
                VERIFY <span className="text-primary italic">IDENTITY</span>
              </h1>
              <div className="h-1 w-20 bg-primary/50 mx-auto mt-2 rounded-full" />
            </motion.div>
            <p className="text-xs text-white/50 uppercase tracking-[0.2em] font-medium">
              Enter the transmission code sent to
              {email && <span className="block text-primary mt-1">{email}</span>}
            </p>
          </div>

          {!emailParam && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-4">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="input-modern h-12 bg-white/3! border-white/5! focus:border-primary/40! w-full"
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
                className="w-12 h-14 bg-white/5 border border-white/10 rounded-lg text-center text-2xl font-bold text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-white/10"
              />
            ))}
          </div>

          <button
            disabled={loading || code.join("").length !== 6}
            onClick={verifyCode}
            className="btn-primary w-full h-14 text-xs uppercase tracking-[0.3em] font-black flex items-center justify-center gap-3 overflow-hidden group/btn disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="relative z-10">Confirm Code</span>
                <FiCheckCircle className="relative z-10 group-hover/btn:translate-x-1 transition-transform duration-500" />
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
              Did not receive?{" "}
              <button
                onClick={resendCode}
                disabled={loading}
                className="text-primary font-bold hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Resend
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailComponent />
    </Suspense>
  );
}
