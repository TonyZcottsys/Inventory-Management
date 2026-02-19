import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createInventorySchema } from "@/lib/validations";
import { computeStatus } from "@/lib/inventory";
import { logActivity } from "@/lib/activity";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/api-response";
import { InventoryStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiUnauthorized();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? "";
  const minQty = searchParams.get("minQty");
  const maxQty = searchParams.get("maxQty");
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const skip = (page - 1) * limit;

  const where: { name?: { contains: string; mode: "insensitive" }; category?: string; status?: InventoryStatus; quantity?: { gte?: number; lte?: number } } = {};
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (category) where.category = category;
  if (status) where.status = status as InventoryStatus;
  if (minQty != null && minQty !== "") {
    where.quantity = where.quantity ?? {}; where.quantity.gte = parseInt(minQty, 10);
  }
  if (maxQty != null && maxQty !== "") {
    where.quantity = where.quantity ?? {}; where.quantity.lte = parseInt(maxQty, 10);
  }

  const orderBy = { [sortBy]: sortOrder as "asc" | "desc" };
  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return apiSuccess({
    items: items.map((i) => ({
      ...i,
      price: i.price ? Number(i.price) : null,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiUnauthorized();
  const { canFullCrud, canUpdateQuantity } = await import("@/lib/auth");
  if (!canFullCrud(session) && !canUpdateQuantity(session)) return apiError("Forbidden", 403);

  try {
    const body = await req.json();
    const parsed = createInventorySchema.safeParse({
      ...body,
      quantity: body.quantity != null ? Number(body.quantity) : undefined,
      price: body.price != null ? Number(body.price) : undefined,
      reorderLevel: body.reorderLevel != null ? Number(body.reorderLevel) : 0,
    });
    if (!parsed.success) return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    const data = parsed.data;
    const status = computeStatus(
      data.quantity,
      data.reorderLevel,
      (data.status as InventoryStatus) ?? "IN_STOCK"
    );
    const item = await prisma.inventoryItem.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        quantity: data.quantity,
        category: data.category ?? null,
        price: data.price ?? null,
        supplier: data.supplier ?? null,
        reorderLevel: data.reorderLevel,
        status,
      },
    });
    await logActivity({
      action: "CREATE",
      entity: "InventoryItem",
      entityId: item.id,
      details: item.name,
      userId: session.sub,
      itemId: item.id,
    });
    return apiSuccess({ item: { ...item, price: item.price ? Number(item.price) : null } }, 201);
  } catch (e) {
    console.error(e);
    return apiError("Failed to create item", 500);
  }
}
