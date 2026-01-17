"use client";
import { User } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type AuthContextData = {
  user?: User;
  status: "loading" | "authenticated" | "unauthenticated";
};

export const AuthContext = createContext<AuthContextData>({
  status: "loading",
});

export const useAuth = () => useContext(AuthContext);

const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const [contextValue, setContextValue] = useState<AuthContextData>({
    status: "loading",
  });

  useEffect(() => {
    setContextValue({
      user: session?.user,
      status: status,
    });
  }, [session, status]);

  // Real-time Suspension Check
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Skip checking if already on the suspended page or public routes
    if (!session?.user?.email) return;
    if (pathname?.startsWith('/suspended') || pathname === '/login' || pathname === '/register') return;

    const checkSuspension = async () => {
      try {
        const res = await fetch(`/api/settings/suspended?email=${encodeURIComponent(session.user?.email || '')}`);
        const data = await res.json();

        if (data.isSuspended) {
          // If API says suspended but we are not on the page, force redirect
          // process.env.NEXT_PUBLIC_URL could be used, but absolute path is safer for hard redirect if needed
          // Using router.push is smoother, but if middleware is stubborn, window.location might be needed.
          // Let's try router.push first, but if the session is stale, we might need a hard refresh to update the cookie?
          // Actually, if we just push to /suspended, the suspended page will show.
          // If the middleware redirects BACK, then we have a loop. 
          // Middleware only redirects TO /suspended if token.isSuspended is true.
          // If token.isSuspended is FALSE (stale), middleware does NOTHING.
          // So router.push('/suspended') works fine.
          router.push('/suspended');
        }
      } catch (error) {
        // silent error
      }
    };

    // Check on mount and on path change
    checkSuspension();

    // Optional: Interval check (Every 1 minute)
    const interval = setInterval(checkSuspension, 60000);
    return () => clearInterval(interval);

  }, [pathname, session, router]);

  return (
    <AuthContext.Provider value={contextValue}>
      {status === "loading" ? null : children}
    </AuthContext.Provider>
  );
};

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}
