"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FiUser, FiLock, FiArrowRight } from "react-icons/fi";

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

  return (
    <div className="min-h-screen bg-var-color-primary-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-var-color-primary-text mb-2">
              Welcome Back
            </h1>
            <p className="text-var-color-secondary-text">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={login} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-var-color-disabled w-5 h-5" />
                </div>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  type="text"
                  placeholder="Username"
                  className="w-full pl-10 pr-4 py-3 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text placeholder-var-color-disabled transition-all"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-var-color-disabled w-5 h-5" />
                </div>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-3 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text placeholder-var-color-disabled transition-all"
                  required
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-var-color-primary-button text-white py-3 px-4 rounded-lg font-semibold hover:bg-var-color-primary-hover-state active:bg-var-color-primary-active-state disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-var-color-secondary-text">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-var-color-primary-button hover:text-var-color-primary-hover-state font-semibold transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-var-color-borders">
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-var-color-secondary-text hover:text-var-color-primary-text text-sm transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}