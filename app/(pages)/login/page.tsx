"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, useAnimation } from "motion/react";
import { FiUser, FiLock, FiArrowRight } from "react-icons/fi";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        toast.error((response?.error as string) || "Invalid credentials");
        setLoading(false);
        return;
      }
      toast.success("Welcome back!");
      window.location.href = "/";
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
              WELCOME <span className="text-primary italic">BACK</span>
            </h1>
            <p className="text-sm text-white/40 uppercase tracking-[0.2em] font-medium">Continue your journey</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 relative">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-4">Username</label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="Enter your username"
                    required
                    className="input-modern has-icon h-14"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-4">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Enter your password"
                    required
                    className="input-modern has-icon h-14"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="btn-primary w-full h-14 text-sm uppercase tracking-widest font-black flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Connect Now
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4 relative">
            <p className="text-xs text-white/40">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary font-bold hover:underline transition-all">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
