// app/verify-email/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from '@/app/lib/toast';

const VerifyEmailComponent = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "error"
  >("pending");

  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      router.push("/");
    }
  }, [token]);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationStatus("success");
        toast.success("Email verified successfully!");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setVerificationStatus("error");
        toast.error(data.message || "Verification failed");
      }
    } catch (error) {
      setVerificationStatus("error");
      toast.error("An error occurred during verification");
    }
  };

  return (
    <div className="center">
      <div className="form">
        <h1 className="title">Email Verification</h1>
        {verificationStatus === "pending" && <p>Verifying your email...</p>}
        {verificationStatus === "success" && (
          <p>
            Your email has been verified successfully! Redirecting to login...
          </p>
        )}
        {verificationStatus === "error" && (
          <p>Verification failed. The link may be expired or invalid.</p>
        )}
      </div>
    </div>
  );
};

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailComponent />
    </Suspense>
  );
}
