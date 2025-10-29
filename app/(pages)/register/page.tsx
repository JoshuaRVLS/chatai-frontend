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
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (password !== confirmPassword && confirmPassword.length > 0) {
      setError("Passwords don’t match");
    } else setError("");
  }, [password, confirmPassword]);

  const register = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (error) return toast.error("Please fix form errors first");
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
          toast.error(data.message);
          setLoading(false);
          return;
        }

        toast.success(data.message);
        router.push("/login");
      } catch {
        toast.error("Unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
    [username, email, password, confirmPassword, error]
  );

  // Animated gradient + floating particles
  const controls = useAnimation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    controls.start({
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      transition: { duration: 15, repeat: Infinity, ease: "linear" },
    });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let particles: { x: number; y: number; dx: number; dy: number }[] = [];
    const num = 50;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = Array.from({ length: num }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
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
  }, [controls]);

  return (
    <motion.div
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8"
      animate={controls}
      style={{
        backgroundImage:
          "linear-gradient(-45deg, #001F3F, #003C5F, #00A6A6, #00C6B3)",
        backgroundSize: "300% 300%",
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      <motion.div
        className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
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
            Create Account
          </h1>
          <p className="text-cyan-200 text-sm">Join our community today</p>
        </motion.div>

        <form onSubmit={register} className="space-y-5">
          {[
            {
              icon: <FiUser />,
              placeholder: "Username",
              type: "text",
              value: username,
              setValue: setUsername,
            },
            {
              icon: <FiMail />,
              placeholder: "Email address",
              type: "email",
              value: email,
              setValue: setEmail,
            },
            {
              icon: <FiLock />,
              placeholder: "Password",
              type: "password",
              value: password,
              setValue: setPassword,
            },
            {
              icon: <FiLock />,
              placeholder: "Confirm password",
              type: "password",
              value: confirmPassword,
              setValue: setConfirmPassword,
            },
          ].map((field, i) => (
            <motion.div
              key={i}
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="absolute left-3 top-3 text-cyan-300">
                {field.icon}
              </div>
              <input
                value={field.value}
                onChange={(e) => field.setValue(e.target.value)}
                type={field.type}
                placeholder={field.placeholder}
                required
                className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl text-white placeholder-cyan-300/60 focus:ring-2 focus:ring-cyan-400 outline-none transition-all duration-200 ${
                  error &&
                  field.placeholder.toLowerCase().includes("confirm") &&
                  confirmPassword.length > 0
                    ? "border-red-400 focus:ring-red-400"
                    : "border-white/20"
                }`}
              />
            </motion.div>
          ))}

          {error && (
            <motion.div
              className="text-red-400 text-sm flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              {error}
            </motion.div>
          )}

          <motion.button
            disabled={loading || !!error}
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
                Create Account
                <FiArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <motion.div
          className="text-center mt-6 text-cyan-100 text-sm space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p>
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-cyan-300 hover:text-white font-semibold transition-colors"
            >
              Sign in here
            </Link>
          </p>
          <p className="text-xs text-cyan-200/70">
            By creating an account, you agree to our{" "}
            <Link
              href="/terms"
              className="text-cyan-300 hover:underline transition-colors"
            >
              Terms of Service
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
