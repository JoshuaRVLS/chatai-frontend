import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Raleway } from "next/font/google";
import "../globals.css";
import AuthProvider from "./providers/AuthProvider";
import { ToastContainer } from "./components/Toast/ToastContainer";
import { AuthModal } from "./components/Auth/AuthModal";
import Navbar from "./components/Navbar/Navbar";
import ScrollProvider from "./providers/ScrollProvider";
import QueryProvider from "./providers/QueryProvider";
import { ConfirmationProvider } from "./providers/ConfirmationProvider";
import Footer from "./components/Footer/Footer";
import { db } from "../utils/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../utils/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jchatai.space"),
  title: {
    default: "JChatAI - Premium AI Conversations",
    template: "%s | JChatAI"
  },
  description: "Experience the next level of AI interaction with JChatAI. Modern, fast, and secure AI character chat and roleplay.",
  keywords: ["AI chat", "AI roleplay", "character AI", "virtual companion", "premium AI"],
  authors: [{ name: "JChatAI Team" }],
  creator: "JChatAI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jchatai.space",
    siteName: "JChatAI",
    title: "JChatAI - Premium AI Conversations",
    description: "Experience the next level of AI interaction with JChatAI.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "JChatAI",
      },
    ],
  },

  icons: {
    icon: "/jchatai-icon.png",
    shortcut: "/jchatai-icon.png",
    apple: "/jchatai-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Access Control Check
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  let shouldRedirect = false;
  let redirectPath = "";

  const [maintenanceSetting, whitelistSetting] = await Promise.all([
    db.systemSetting.findUnique({ where: { key: "maintenanceMode" } }),
    db.systemSetting.findUnique({ where: { key: "whitelistMode" } })
  ]);

  const session = await getServerSession(authOptions);
  let isAdmin = false;
  let isWhitelisted = false;
  let isSuspended = false;

  const isMaintenanceMode = maintenanceSetting?.value === "true";
  const isWhitelistMode = whitelistSetting?.value === "true";

  if (session?.user?.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, isWhitelisted: true, suspendedUntil: true }
    });

    if (user) {
      isAdmin = user.isAdmin;
      // Admins are always whitelisted
      isWhitelisted = user.isWhitelisted || user.isAdmin;

      // Check suspension
      if (user.suspendedUntil && !user.isAdmin) {
        isSuspended = new Date(user.suspendedUntil) > new Date();
      }
    }
  }

  const publicRoutes = ['/login', '/register', '/maintenance', '/suspended', '/access-denied', '/privacy', '/terms'];
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  // 1. Maintenance Mode Check
  if (isMaintenanceMode && !isAdmin) {
    if (pathname !== "/maintenance") {
      shouldRedirect = true;
      redirectPath = "/maintenance";
    }
  }
  // 2. Suspension Check
  else if (isSuspended) {
    if (pathname !== "/suspended") {
      shouldRedirect = true;
      redirectPath = "/suspended";
    }
  }
  // 3. Whitelist Mode Check
  else if (isWhitelistMode && !isWhitelisted) {
    // If not logged in, allow public routes (like login). 
    // If logged in (but not whitelisted), block access.
    if (!isPublicRoute) {
      shouldRedirect = true;
      redirectPath = "/access-denied";
    }
  }

  // Reverse Checks - Redirect back to home if condition is CLEARED
  if (pathname === "/maintenance" && (!isMaintenanceMode || isAdmin)) {
    shouldRedirect = true;
    redirectPath = "/";
  }
  if (pathname === "/suspended" && !isSuspended) {
    shouldRedirect = true;
    redirectPath = "/";
  }
  if (pathname === "/access-denied" && (!isWhitelistMode || isWhitelisted)) {
    shouldRedirect = true;
    redirectPath = "/";
  }

  if (shouldRedirect && redirectPath) {
    redirect(redirectPath);
  }

  return (
    <html lang="en" className={`dark ${inter.variable} ${playfair.variable} ${raleway.variable}`}>
      <body className="antialiased bg-background-custom text-foreground overflow-x-hidden">
        <QueryProvider>
          <ScrollProvider>
            <AuthProvider>
              <ConfirmationProvider>
                <div className={`min-h-screen flex flex-col ${((isMaintenanceMode && isAdmin) || isWhitelistMode) ? 'pt-12' : ''}`}>
                  {/* Maintenance indicator - admin only */}
                  {isMaintenanceMode && isAdmin && (
                    <div className="fixed top-0 left-0 right-0 z-[9999] py-2 px-4 text-center shadow-lg flex items-center justify-center gap-4" style={{ background: '#f59e0b' }}>
                      <p className="text-xs uppercase tracking-widest font-bold text-black">
                        ⚠️ Maintenance Mode Active — Admin Bypass
                      </p>
                    </div>
                  )}
                  {/* Whitelist indicator - all users */}
                  {isWhitelistMode && !isMaintenanceMode && (
                    <div className="fixed top-0 left-0 right-0 z-[9999] py-2 px-4 text-center shadow-lg flex items-center justify-center gap-4" style={{ background: '#3b82f6' }}>
                      <p className="text-xs uppercase tracking-widest font-bold text-white">
                        🔒 Whitelist Mode Active — Restricted Access
                      </p>
                    </div>
                  )}
                  <AuthModal />
                  <ToastContainer />
                  <Navbar />
                  <main className="flex-1 relative">
                    {children}
                  </main>
                  <Footer />
                </div>
              </ConfirmationProvider>
            </AuthProvider>
          </ScrollProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
