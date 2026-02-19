import { prisma } from "@/lib/db";
import { getSession, canViewAnalytics } from "@/lib/auth";
import { apiSuccess, apiUnauthorized, apiForbidden, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiUnauthorized();

    const items = await prisma.inventoryItem.findMany({
      select: { quantity: true, price: true, status: true, category: true, reorderLevel: true },
    });

    const totalValue = items.reduce(
      (sum, i) => sum + (i.quantity * (i.price ? Number(i.price) : 0)),
      0
    );
    const belowReorder = items.filter(
      (i) => i.quantity <= i.reorderLevel && i.status !== "DISCONTINUED"
    ).length;
    const lowStock = items.filter((i) => i.status === "LOW_STOCK").length;

    const basic = {
      totalItems: items.length,
      lowStockCount: lowStock,
      belowReorderCount: belowReorder,
      totalInventoryValue: Math.round(totalValue * 100) / 100,
    };

    if (!canViewAnalytics(session)) {
      return apiSuccess(basic);
    }

    const [byStatus, byCategory] = await Promise.all([
      prisma.inventoryItem.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.inventoryItem.groupBy({ by: ["category"], _count: { id: true }, where: { category: { not: null } } }),
    ]);

    return apiSuccess({
      ...basic,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byCategory: byCategory.map((c) => ({ category: c.category || "Uncategorized", count: c._count.id })),
    });
  } catch (e) {
    console.error("[GET /api/analytics]", e);
    return apiError("Failed to load analytics", 500);
  }
}
