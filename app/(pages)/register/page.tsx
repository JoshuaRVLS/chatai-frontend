"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FiUser, FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { motion, useAnimation } from "motion/react";

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
      setFormError("Passwords don’t match");
    } else {
      setFormError("");
    }
  }, [password, confirmPassword]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (formError) return toast.error("Please fix form errors first");
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
        toast.error(data.message || "Failed to register account");
        setLoading(false);
        return;
      }

      toast.success("Account created! Please check your email for verification.");
      router.push("/login");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="card-premium space-y-8 relative overflow-hidden group">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

          <div className="text-center space-y-2 relative">
            <h1 className="text-4xl font-black tracking-tighter text-white">
              JOIN <span className="text-primary italic">COMMUNITY</span>
            </h1>
            <p className="text-sm text-white/40 uppercase tracking-[0.2em] font-medium">Start your experience</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5 relative">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-4">Username</label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="Choose a username"
                    required
                    className="input-modern has-icon h-14"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-4">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="Enter your email"
                    required
                    className="input-modern has-icon h-14"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-4">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50" />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      placeholder="••••••••"
                      required
                      className="input-modern has-icon h-14"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-4">Confirm</label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50" />
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type="password"
                      placeholder="••••••••"
                      required
                      className={`input-modern has-icon h-14 ${formError ? 'border-error/50 ring-1 ring-error/20' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {formError && (
              <p className="text-[10px] text-error font-bold uppercase tracking-widest text-center">{formError}</p>
            )}

            <button
              disabled={loading || !!formError}
              type="submit"
              className="btn-primary w-full h-14 text-sm uppercase tracking-widest font-black flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4 relative">
            <p className="text-xs text-white/40">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline transition-all">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
