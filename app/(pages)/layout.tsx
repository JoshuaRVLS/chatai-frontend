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
  twitter: {
    card: "summary_large_image",
    title: "JChatAI - Premium AI Conversations",
    description: "Experience the next level of AI interaction with JChatAI.",
    images: ["/og-image.png"],
    creator: "@jchatai",
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
  // Maintenance Mode Check
  const headerList = await headers();
  const pathname = headerList.get("x-invoke-path") || "";

  if (pathname !== "/maintenance") {
    try {
      const setting = await db.systemSetting.findUnique({
        where: { key: "maintenanceMode" }
      });

      if (setting?.value === "true") {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isAdmin) {
          redirect("/maintenance");
        }
      }
    } catch (error) {
      console.error("Maintenance check failed:", error);
    }
  }

  return (
    <html lang="en" className={`dark ${inter.variable} ${playfair.variable} ${raleway.variable}`}>
      <body className="antialiased bg-background-custom text-foreground overflow-x-hidden">
        <QueryProvider>
          <ScrollProvider>
            <AuthProvider>
              <ConfirmationProvider>
                <div className="min-h-screen flex flex-col">
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
