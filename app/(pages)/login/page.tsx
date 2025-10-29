"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FiUser, FiLock, FiArrowRight } from "react-icons/fi";
import { motion } from "motion/react";

export default function LoginPage() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const login = async (e: FormEvent) => {
    setLoading(true);
    e.preventDefault();
    try {
      const response = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (!response?.ok) {
        toast.error((response?.error as string) || "Login Failed");
        return;
      }

      toast.success("Login Success");
      router.refresh();
    } catch (error) {
      console.log(error);
      toast.error("An unexpected error occurred");
    }
    setLoading(false);
  };

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
      className="min-h-screen bg-var-color-primary-background flex items-center justify-center px-4 py-8"
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
          className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl p-6 md:p-8 shadow-lg"
          variants={itemVariants}
          whileHover={{ boxShadow: "0 20px 40px rgba(0, 196, 179, 0.2)" }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="text-center mb-6 md:mb-8"
            variants={itemVariants}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-var-color-primary-text mb-2">
              Welcome Back
            </h1>
            <p className="text-var-color-secondary-text text-sm md:text-base">
              Sign in to your account to continue
            </p>
          </motion.div>

          <motion.form 
            onSubmit={login} 
            className="space-y-4 md:space-y-6"
            variants={containerVariants}
          >
            <motion.div 
              className="space-y-3 md:space-y-4"
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
                  className="w-full pl-9 md:pl-10 pr-4 py-3 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text placeholder-var-color-disabled transition-all text-base"
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
                  className="w-full pl-9 md:pl-10 pr-4 py-3 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text placeholder-var-color-disabled transition-all text-base"
                  required
                  whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
            </motion.div>

            <motion.button
              disabled={loading}
              type="submit"
              className="w-full bg-var-color-primary-button text-white py-3 px-4 rounded-lg font-semibold hover:bg-var-color-primary-hover-state active:bg-var-color-primary-active-state disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-base"
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
                  Sign In
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.form>

          <motion.div 
            className="mt-4 md:mt-6 text-center"
            variants={itemVariants}
          >
            <p className="text-var-color-secondary-text text-sm md:text-base">
              Don't have an account?{" "}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Link
                  href="/register"
                  className="text-var-color-primary-button hover:text-var-color-primary-hover-state font-semibold transition-colors"
                >
                  Create one here
                </Link>
              </motion.div>
            </p>
          </motion.div>

          <motion.div 
            className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-var-color-borders"
            variants={itemVariants}
          >
            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Link
                  href="/forgot-password"
                  className="text-var-color-secondary-text hover:text-var-color-primary-text text-sm transition-colors"
                >
                  Forgot your password?
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}