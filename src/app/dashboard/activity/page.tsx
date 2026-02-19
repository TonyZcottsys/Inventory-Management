"use client";

import { useEffect, useState } from "react";

type Log = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  userId: string | null;
  user: { email: string; name: string | null } | null;
  createdAt: string;
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity?limit=30", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs ?? []);
        setPagination(d.pagination ?? { page: 1, totalPages: 1 });
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
      <p className="mt-1 text-muted-foreground">Audit trail of actions</p>
      <div className="card mt-6 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-3 font-medium">Time</th>
                  <th className="p-3 font-medium">Action</th>
                  <th className="p-3 font-medium">Entity</th>
                  <th className="p-3 font-medium">Details</th>
                  <th className="p-3 font-medium">User</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border">
                    <td className="p-3 text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium">{log.action}</td>
                    <td className="p-3">{log.entity}</td>
                    <td className="p-3 text-muted-foreground">{log.details ?? "—"}</td>
                    <td className="p-3">{log.user?.email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
