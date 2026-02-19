"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function HomePage() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">Welcome, {user.email}</h1>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <h1 className="text-3xl font-bold text-foreground">Inventory Management System</h1>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-primary px-6 py-2 text-primary-foreground hover:opacity-90"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-border bg-card px-6 py-2 hover:bg-accent"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
