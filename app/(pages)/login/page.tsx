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

  // Animate gradient background subtly
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      transition: { duration: 15, repeat: Infinity, ease: "linear" },
    });
  }, [controls]);

  // Particle canvas setup
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let particles: { x: number; y: number; dx: number; dy: number }[] = [];
    const num = 40;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = Array.from({ length: num }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        dx: (Math.random() - 0.5) * 0.6,
        dy: (Math.random() - 0.5) * 0.6,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0,255,255,0.7)";
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      requestAnimationFrame(draw);
    };
    draw();

    return () => window.removeEventListener("resize", resize);
  }, []);

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (!response?.ok) {
        toast.error((response?.error as string) || "Login failed");
        setLoading(false);
        return;
      }
      toast.success("Login successful!");
      router.refresh();
    } catch {
      toast.error("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="relative p-8 min-h-screen flex items-center justify-center overflow-hidden"
      animate={controls}
      style={{
        backgroundImage:
          "linear-gradient(-45deg, #001F3F, #003C5F, #00A6A6, #00C6B3)",
        backgroundSize: "300% 300%",
      }}
    >
      {/* Canvas Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Glassy Login Card */}
      <motion.div
        className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold text-white mb-1 tracking-wide">
            Welcome Back
          </h1>
          <p className="text-cyan-200 text-sm">
            Sign in to your account to continue
          </p>
        </motion.div>

        <form onSubmit={login} className="space-y-5">
          {/* Username */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FiUser className="absolute left-3 top-3 text-cyan-300" />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              placeholder="Username"
              required
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-cyan-300/60 focus:ring-2 focus:ring-cyan-400 outline-none transition-all duration-200"
            />
          </motion.div>

          {/* Password */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <FiLock className="absolute left-3 top-3 text-cyan-300" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              required
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-cyan-300/60 focus:ring-2 focus:ring-cyan-400 outline-none transition-all duration-200"
            />
          </motion.div>

          {/* Sign In Button */}
          <motion.button
            disabled={loading}
            type="submit"
            className="w-full mt-4 py-3 rounded-xl font-semibold bg-cyan-500 text-white hover:bg-cyan-400 active:bg-cyan-600 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                Sign In
                <FiArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer Links */}
        <motion.div
          className="text-center mt-6 text-cyan-100 text-sm space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p>
            Don’t have an account?{" "}
            <Link
              href="/register"
              className="text-cyan-300 hover:text-white font-semibold transition-colors"
            >
              Create one
            </Link>
          </p>
          <Link
            href="/forgot-password"
            className="text-cyan-200 hover:text-white transition-colors"
          >
            Forgot your password?
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
