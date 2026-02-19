import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { Toasts } from "@/components/Toasts";

export const metadata: Metadata = {
  title: "Inventory Management System",
  description: "Production-ready inventory and stock management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
            <Toasts />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
