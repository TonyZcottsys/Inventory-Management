"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Role = "ADMIN" | "MANAGER" | "STAFF";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  canManageUsers: boolean;
  canDeleteItem: boolean;
  canFullCrud: boolean;
  canViewAnalytics: boolean;
  canUpdateQuantity: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const { user: u } = await res.json();
        setUser(u);
      } else setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || "Login failed" };
    await refresh();
    return {};
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || "Registration failed" };
    await refresh();
    return {};
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  };

  const canManageUsers = user?.role === "ADMIN";
  const canDeleteItem = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canFullCrud = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canViewAnalytics = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canUpdateQuantity = true;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refresh,
        canManageUsers,
        canDeleteItem,
        canFullCrud,
        canViewAnalytics,
        canUpdateQuantity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
