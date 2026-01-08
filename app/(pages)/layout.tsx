import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Raleway } from "next/font/google";
import "../globals.css";
import AuthProvider from "./providers/AuthProvider";
import { ToastContainer } from "./components/Toast/ToastContainer";
import Navbar from "./components/Navbar/Navbar";
import ScrollProvider from "./providers/ScrollProvider";
import QueryProvider from "./providers/QueryProvider";
import { ConfirmationProvider } from "./providers/ConfirmationProvider";
import { Analytics } from "@vercel/analytics/next";
import Footer from "./components/Footer/Footer";

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
                <ToastContainer />
                <Navbar />
                <main className="relative min-h-screen">
                  {children}
                </main>
                <Footer />
              </ConfirmationProvider>
            </AuthProvider>
          </ScrollProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
