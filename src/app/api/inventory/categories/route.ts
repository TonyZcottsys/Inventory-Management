import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiSuccess, apiUnauthorized, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiUnauthorized();

    const result = await prisma.inventoryItem.groupBy({
      by: ["category"],
      where: { category: { not: null } },
      _count: { id: true },
    });
    const categories = result.map((r) => r.category).filter(Boolean) as string[];
    return apiSuccess({ categories });
  } catch (e) {
    console.error("[GET /api/inventory/categories]", e);
    return apiError("Failed to load categories", 500);
  }
}
