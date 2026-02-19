"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { canViewAnalytics } = useAuth();
  const [stats, setStats] = useState<{
    totalItems?: number;
    lowStockCount?: number;
    totalInventoryValue?: number;
    belowReorderCount?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        setStats(d || null);
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      title: "Total Items",
      value: loading ? "…" : (stats?.totalItems ?? 0),
      icon: Package,
      href: "/dashboard/inventory",
    },
    {
      title: "Low Stock",
      value: loading ? "…" : (stats?.lowStockCount ?? 0),
      icon: AlertTriangle,
      href: "/dashboard/inventory?status=LOW_STOCK",
      accent: true,
    },
    {
      title: "Inventory Value",
      value: loading ? "…" : (stats?.totalInventoryValue != null ? `$${Number(stats.totalInventoryValue).toLocaleString()}` : "$0"),
      icon: DollarSign,
      href: "/dashboard/inventory",
    },
    {
      title: "Below Reorder",
      value: loading ? "…" : (stats?.belowReorderCount ?? 0),
      icon: TrendingUp,
      href: "/dashboard/inventory",
      accent: true,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Overview of your inventory</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.title} href={c.href}>
              <div
                className={`card flex items-center gap-4 p-4 transition hover:shadow-md ${
                  c.accent ? "border-amber-200 dark:border-amber-800" : ""
                }`}
              >
                <div className={`rounded-lg p-2 ${c.accent ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"}`}>
                  <Icon className={`h-5 w-5 ${c.accent ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{c.title}</p>
                  <p className="text-xl font-semibold text-foreground">{c.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {canViewAnalytics && (
        <div className="mt-8">
          <Link
            href="/dashboard/ai"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            Ask AI Assistant
          </Link>
        </div>
      )}
    </div>
  );
}
