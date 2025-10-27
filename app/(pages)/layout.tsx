import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./providers/AuthProvider";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar/Navbar";
import ScrollProvider from "./providers/ScrollProvider";
import QueryProvider from "./providers/QueryProvider";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "Chat AI",
  description: "Chat AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased `}>
        <Analytics />
        <QueryProvider>
          <ScrollProvider>
            <AuthProvider>
              <Toaster
                //<Toaster
                position="top-center"
                gutter={12}
                containerStyle={{ margin: "8px" }}
                toastOptions={{
                  success: {
                    duration: 3000,
                    style: {
                      background: "#4CAF50",
                      color: "#fff",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: 500,
                      padding: "12px 20px",
                    },
                    iconTheme: {
                      primary: "#fff",
                      secondary: "#10B981",
                    },
                  },
                  error: {
                    duration: 4000,
                    style: {
                      background: "#FF5252",
                      color: "#fff",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: 500,
                      padding: "12px 20px",
                    },
                    iconTheme: {
                      primary: "#fff",
                      secondary: "#EF4444",
                    },
                  },
                  loading: {
                    style: {
                      background: "#3B82F6",
                      color: "#fff",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: 500,
                      padding: "12px 20px",
                    },
                  },
                  blank: {
                    style: {
                      background: "#fff",
                      color: "#374151",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: 500,
                      padding: "12px 20px",
                      border: "1px solid #E5E7EB",
                    },
                  },
                }}
              />
              <Navbar />
              {children}
            </AuthProvider>
          </ScrollProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
