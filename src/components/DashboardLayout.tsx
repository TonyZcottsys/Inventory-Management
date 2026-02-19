"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Users,
  FileText,
  Bot,
  Download,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/ai", label: "AI Assistant", icon: Bot },
  { href: "/dashboard/activity", label: "Activity Log", icon: FileText },
  { href: "/dashboard/users", label: "Users", icon: Users },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, canManageUsers, canViewAnalytics } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  const filteredNav = nav.filter((n) => {
    if (n.href === "/dashboard/users" && !canManageUsers) return false;
    if (n.href === "/dashboard/activity" && !canManageUsers) return false;
    if ((n.href === "/dashboard/analytics" || n.href === "/dashboard/ai") && !canViewAnalytics) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4 lg:justify-center">
          <span className="font-semibold text-foreground">IMS</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden rounded p-2 hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 p-2">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-2">
          <div className="mb-2 truncate px-3 text-xs text-muted-foreground">
            {user?.email} · {user?.role}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded p-2 hover:bg-accent lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            {pathname === "/dashboard" && "Overview"}
            {pathname === "/dashboard/inventory" && "Inventory"}
            {pathname === "/dashboard/analytics" && "Analytics"}
            {pathname === "/dashboard/ai" && "AI Assistant"}
            {pathname === "/dashboard/activity" && "Activity Log"}
            {pathname === "/dashboard/users" && "Users"}
          </span>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
