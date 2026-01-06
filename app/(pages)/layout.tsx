import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Raleway } from "next/font/google";
import "../globals.css";
import AuthProvider from "./providers/AuthProvider";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar/Navbar";
import ScrollProvider from "./providers/ScrollProvider";
import QueryProvider from "./providers/QueryProvider";
import { ConfirmationProvider } from "./providers/ConfirmationProvider";
import { Analytics } from "@vercel/analytics/next";

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
  title: "JChatAI - Premium AI Conversations",
  description: "Experience the next level of AI interaction with JChatAI. Modern, fast, and secure.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${playfair.variable} ${raleway.variable}`}>
      <body className="antialiased bg-background-custom text-foreground">
        <Analytics />
        <QueryProvider>
          <ScrollProvider>
            <AuthProvider>
              <ConfirmationProvider>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    className: "glass-morphism border-white/10 text-white",
                    duration: 4000,
                    style: {
                      background: "rgba(17, 24, 39, 0.8)",
                      backdropFilter: "blur(12px)",
                      color: "#fff",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "16px",
                    },
                  }}
                />
                <Navbar />
                <main className="relative min-h-screen">
                  {children}
                </main>
              </ConfirmationProvider>
            </AuthProvider>
          </ScrollProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
