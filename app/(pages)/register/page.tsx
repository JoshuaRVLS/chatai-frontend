"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { toast } from '@/app/lib/toast';
import { useRouter } from "next/navigation";
import { FiUser, FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { motion } from "motion/react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
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

      toast.success("Identity established! Transmission initiated.");
      console.log("Redirecting to verify-email...");
      // Small delay to ensure toast is visible and navigation handles correctly
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }, 1000);
    } catch {
      toast.error("Subsystem failure");
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
        <div className="aurora-blob w-[400px] h-[400px] bg-accent/10 top-[20%] right-[10%] animate-delay-2000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-lg z-10"
      >
        <div className="card-premium space-y-10 relative group">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-5xl font-black tracking-tighter text-white">
                NEW <span className="text-primary italic">ENTITY</span>
              </h1>
              <div className="h-1 w-20 bg-primary/50 mx-auto mt-2 rounded-full" />
            </motion.div>
            <p className="text-xs text-white/50 uppercase tracking-[0.4em] font-medium">Establish Credentials</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-4">Handle</label>
                <div className="group/input relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-primary transition-colors duration-300" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="Username"
                    required
                    className="input-modern has-icon h-14 bg-white/3! border-white/5! focus:border-primary/40!"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-4">Mail Link</label>
                <div className="group/input relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-primary transition-colors duration-300" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="Email Address"
                    required
                    className="input-modern has-icon h-14 bg-white/3! border-white/5! focus:border-primary/40!"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-4">Primary Key</label>
                <div className="group/input relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-primary transition-colors duration-300" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    required
                    className="input-modern has-icon h-14 bg-white/3! border-white/5! focus:border-primary/40!"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-4">Verify Key</label>
                <div className="group/input relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-primary transition-colors duration-300" />
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    required
                    className={`input-modern has-icon h-14 bg-white/3! border-white/5! focus:border-primary/40! ${formError ? 'border-error/40 ring-1 ring-error/10' : ''}`}
                  />
                </div>
              </div>
            </div>

            {formError && (
              <p className="text-[10px] text-error font-bold uppercase tracking-widest text-center animate-pulse">{formError}</p>
            )}

            <button
              disabled={loading || !!formError}
              type="submit"
              className="btn-primary w-full h-15 text-xs uppercase tracking-[0.3em] font-black flex items-center justify-center gap-3 overflow-hidden group/btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="relative z-10">Establish Identity</span>
                  <FiArrowRight className="relative z-10 group-hover/btn:translate-x-2 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
              Internalized?{" "}
              <Link href="/login" className="text-primary font-bold hover:text-white transition-colors">
                Initiate Login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

