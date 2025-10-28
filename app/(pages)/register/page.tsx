"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FiUser, FiMail, FiLock, FiArrowRight } from "react-icons/fi";

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

  return (
    <div className="min-h-screen bg-var-color-primary-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-var-color-primary-text mb-2">
              Create Account
            </h1>
            <p className="text-var-color-secondary-text">
              Join our community today
            </p>
          </div>

          <form onSubmit={register} className="space-y-5">
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
                  <FiMail className="text-var-color-disabled w-5 h-5" />
                </div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email address"
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

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-var-color-disabled w-5 h-5" />
                </div>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="Confirm password"
                  className={`w-full pl-10 pr-4 py-3 bg-var-color-primary-background border rounded-lg focus:ring-2 focus:border-transparent text-var-color-primary-text placeholder-var-color-disabled transition-all ${
                    error && confirmPassword.length > 0
                      ? "border-var-color-error focus:ring-var-color-error"
                      : "border-var-color-borders focus:ring-var-color-primary-button"
                  }`}
                  required
                />
              </div>

              {error && (
                <div className="text-var-color-error text-sm flex items-center gap-2 animate-pulse">
                  <div className="w-2 h-2 bg-var-color-error rounded-full" />
                  {error}
                </div>
              )}
            </div>

            <button
              disabled={loading || !!error}
              type="submit"
              className="w-full bg-var-color-primary-button text-white py-3 px-4 rounded-lg font-semibold hover:bg-var-color-primary-hover-state active:bg-var-color-primary-active-state disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-var-color-secondary-text">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-var-color-primary-button hover:text-var-color-primary-hover-state font-semibold transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-var-color-borders">
            <div className="text-center">
              <p className="text-var-color-disabled text-sm">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="text-var-color-primary-button hover:underline">
                  Terms of Service
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}