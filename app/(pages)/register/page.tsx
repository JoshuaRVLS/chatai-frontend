"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FiUser, FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { motion } from "motion/react";

export default function RegisterPage() {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (password !== confirmPassword && confirmPassword.length > 0) {
      setError("Passwords don't match");
    } else {
      setError("");
    }
  }, [password, confirmPassword]);

  const register = useCallback(
    async (e: FormEvent) => {
      setLoading(true);
      e.preventDefault();

      try {
        const response = await fetch("/api/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            password: password,
            confirmPassword: confirmPassword,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setLoading(false);
          return toast.error(data.message);
        }

        toast.success(data.message);
        router.push("/login");
      } catch (error) {
        if (error instanceof Error) {
          setLoading(false);
          toast.error(error.message);
        }
        toast.error("An unexpected error occurred");
      }
      setLoading(false);
    },
    [username, email, password, confirmPassword]
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div 
      className="min-h-[100dvh] bg-var-color-primary-background flex items-center justify-center px-4 py-4 md:py-8 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div 
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl p-4 md:p-8 shadow-lg"
          variants={itemVariants}
          whileHover={{ boxShadow: "0 20px 40px rgba(0, 196, 179, 0.2)" }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="text-center mb-4 md:mb-8"
            variants={itemVariants}
          >
            <h1 className="text-xl md:text-3xl font-bold text-var-color-primary-text mb-2">
              Create Account
            </h1>
            <span className="text-var-color-secondary-text text-sm md:text-base">
              Join our community today
            </span>
          </motion.div>

          <motion.form 
            onSubmit={register} 
            className="space-y-3 md:space-y-5"
            variants={containerVariants}
          >
            <motion.div 
              className="space-y-2 md:space-y-4"
              variants={containerVariants}
            >
              <motion.div 
                className="relative"
                variants={itemVariants}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-var-color-disabled w-4 h-4 md:w-5 md:h-5" />
                </div>
                <motion.input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  type="text"
                  placeholder="Username"
                  className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-3 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text placeholder-var-color-disabled transition-all text-base"
                  required
                  whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>

              <motion.div 
                className="relative"
                variants={itemVariants}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-var-color-disabled w-4 h-4 md:w-5 md:h-5" />
                </div>
                <motion.input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email address"
                  className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-3 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text placeholder-var-color-disabled transition-all text-base"
                  required
                  whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>

              <motion.div 
                className="relative"
                variants={itemVariants}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-var-color-disabled w-4 h-4 md:w-5 md:h-5" />
                </div>
                <motion.input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Password"
                  className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-3 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text placeholder-var-color-disabled transition-all text-base"
                  required
                  whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>

              <motion.div 
                className="relative"
                variants={itemVariants}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-var-color-disabled w-4 h-4 md:w-5 md:h-5" />
                </div>
                <motion.input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="Confirm password"
                  className={`w-full pl-9 md:pl-10 pr-4 py-2 md:py-3 bg-var-color-primary-background border rounded-lg focus:ring-2 focus:border-transparent text-var-color-primary-text placeholder-var-color-disabled transition-all text-base ${
                    error && confirmPassword.length > 0
                      ? "border-var-color-error focus:ring-var-color-error"
                      : "border-var-color-borders focus:ring-var-color-primary-button"
                  }`}
                  required
                  whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>

              {error && (
                <motion.div 
                  className="text-var-color-error text-sm flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  variants={itemVariants}
                >
                  <div className="w-2 h-2 bg-var-color-error rounded-full" />
                  {error}
                </motion.div>
              )}
            </motion.div>

            <motion.button
              disabled={loading || !!error}
              type="submit"
              className="w-full bg-var-color-primary-button text-white py-2 md:py-3 px-4 rounded-lg font-semibold hover:bg-var-color-primary-hover-state active:bg-var-color-primary-active-state disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-base"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0, 196, 179, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              variants={itemVariants}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  Create Account
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.form>

          <motion.div 
            className="mt-3 md:mt-6 text-center"
            variants={itemVariants}
          >
            <div className="text-var-color-secondary-text text-sm md:text-base">
              Already have an account?{" "}
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Link
                  href="/login"
                  className="text-var-color-primary-button hover:text-var-color-primary-hover-state font-semibold transition-colors"
                >
                  Sign in here
                </Link>
              </motion.span>
            </div>
          </motion.div>

          <motion.div 
            className="mt-4 md:mt-8 pt-3 md:pt-6 border-t border-var-color-borders"
            variants={itemVariants}
          >
            <div className="text-center">
              <span className="text-var-color-disabled text-sm">
                By creating an account, you agree to our{" "}
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block"
                >
                  <Link href="/terms" className="text-var-color-primary-button hover:underline">
                    Terms of Service
                  </Link>
                </motion.span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
