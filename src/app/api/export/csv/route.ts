import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiUnauthorized } from "@/lib/api-response";

function escapeCsv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiUnauthorized();
  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
  const headers = ["id", "name", "description", "quantity", "category", "price", "supplier", "reorderLevel", "status", "createdAt", "updatedAt"];
  const rows = items.map((i) =>
    headers.map((h) => escapeCsv(String((i as Record<string, unknown>)[h] ?? ""))).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=inventory-export.csv",
    },
  });
}
