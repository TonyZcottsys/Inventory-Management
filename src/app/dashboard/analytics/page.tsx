"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<{
    totalItems?: number;
    lowStockCount?: number;
    totalInventoryValue?: number;
    belowReorderCount?: number;
    byStatus?: { status: string; count: number }[];
    byCategory?: { category: string; count: number }[];
  } | null>(null);
  const [insights, setInsights] = useState<{
    frequentlyLowStock?: { name: string; id: string; count: number }[];
    categoryTrends?: { category: string; totalQty: number; itemCount: number }[];
    valueBreakdown?: { category: string; value: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics", { credentials: "include" }).then((r) => r.ok ? r.json() : null),
      fetch("/api/ai/insights", { credentials: "include" }).then((r) => r.ok ? r.json() : null),
    ]).then(([a, i]) => {
      setAnalytics(a || null);
      setInsights(i || null);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const byStatus = analytics?.byStatus ?? [];
  const valueBreakdown = insights?.valueBreakdown ?? [];
  const categoryTrends = insights?.categoryTrends ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
      <p className="mt-1 text-muted-foreground">Inventory value and trends</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-sm text-muted-foreground">Total inventory value</p>
          <p className="text-2xl font-semibold text-foreground">
            ${Number(analytics?.totalInventoryValue ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted-foreground">Total items</p>
          <p className="text-2xl font-semibold text-foreground">{analytics?.totalItems ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted-foreground">Low stock count</p>
          <p className="text-2xl font-semibold text-amber-600">{analytics?.lowStockCount ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted-foreground">Below reorder level</p>
          <p className="text-2xl font-semibold text-foreground">{analytics?.belowReorderCount ?? 0}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="font-semibold text-foreground">Items by status</h3>
          {byStatus.length > 0 ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStatus}>
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No data</p>
          )}
        </div>
        <div className="card p-4">
          <h3 className="font-semibold text-foreground">Value by category</h3>
          {valueBreakdown.length > 0 ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={valueBreakdown}
                    dataKey="value"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {valueBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No data</p>
          )}
        </div>
      </div>

      {insights?.frequentlyLowStock && insights.frequentlyLowStock.length > 0 && (
        <div className="card mt-6 p-4">
          <h3 className="font-semibold text-foreground">Frequently low stock (AI insight)</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
            {insights.frequentlyLowStock.map((f) => (
              <li key={f.id}>{f.name}</li>
            ))}
          </ul>
        </div>
      )}

      {categoryTrends.length > 0 && (
        <div className="card mt-6 p-4">
          <h3 className="font-semibold text-foreground">Category trends</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryTrends} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="category" width={80} />
                <Tooltip />
                <Bar dataKey="totalQty" name="Total quantity" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
