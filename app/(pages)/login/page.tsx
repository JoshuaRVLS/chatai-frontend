"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from '@/app/lib/toast';
import { motion } from "motion/react";
import { FiUser, FiLock, FiArrowRight } from "react-icons/fi";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      window.location.href = "/";
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden pt-20">
      {/* Aurora Background - Forced absolute in style to override any CSS issues */}
      <div className="aurora-bg absolute inset-0 pointer-events-none">
        <div className="aurora-blob w-[500px] h-[500px] bg-primary/20 top-[-10%] left-[-10%]" />
        <div className="aurora-blob w-[600px] h-[600px] bg-secondary/15 bottom-[-20%] right-[-10%] animate-delay-1000" />
        <div className="aurora-blob w-[400px] h-[400px] bg-accent/10 top-[20%] right-[10%] animate-delay-2000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <div className="card-premium space-y-10 relative group">
          {/* Subtle reflection effect */}
          <div className="absolute inset-0 bg-linear-to-tr from-white/5 to-transparent pointer-events-none rounded-3xl" />

          <div className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-5xl font-black tracking-tighter text-white">
                JCHAT <span className="text-primary italic">AI</span>
              </h1>
              <div className="h-1 w-20 bg-primary/50 mx-auto mt-2 rounded-full" />
            </motion.div>
            <p className="text-xs text-white/50 uppercase tracking-[0.4em] font-medium">Authentication Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-4">Identity</label>
                <div className="group/input relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-primary transition-colors duration-300" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="Enter Username"
                    required
                    className="input-modern has-icon h-15 bg-white/3! border-white/5! focus:border-primary/40!"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-4">Access Key</label>
                <div className="group/input relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-primary transition-colors duration-300" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Enter Password"
                    required
                    className="input-modern has-icon h-15 bg-white/3! border-white/5! focus:border-primary/40!"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="btn-primary w-full h-15 text-xs uppercase tracking-[0.3em] font-black flex items-center justify-center gap-3 overflow-hidden group/btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="relative z-10">Login</span>
                  <FiArrowRight className="relative z-10 group-hover/btn:translate-x-2 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
              New here?{" "}
              <Link href="/register" className="text-primary font-bold hover:text-white transition-colors">
                Register
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

