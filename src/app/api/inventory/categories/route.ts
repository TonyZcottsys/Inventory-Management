import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiSuccess, apiUnauthorized } from "@/lib/api-response";

export async function GET() {
  const session = await getSession();
  if (!session) return apiUnauthorized();
  const items = await prisma.inventoryItem.findMany({
    where: { category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  });
  const categories = items.map((i) => i.category).filter(Boolean) as string[];
  return apiSuccess({ categories });
}
