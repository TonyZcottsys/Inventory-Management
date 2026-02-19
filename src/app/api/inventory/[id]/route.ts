import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canFullCrud, canDeleteItem, canUpdateQuantity } from "@/lib/auth";
import { updateInventorySchema } from "@/lib/validations";
import { computeStatus } from "@/lib/inventory";
import { logActivity } from "@/lib/activity";
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from "@/lib/api-response";
import { InventoryStatus } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiUnauthorized();
  const { id } = await params;
  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) return apiNotFound("Item not found");
  return apiSuccess({ item: { ...item, price: item.price ? Number(item.price) : null } });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiUnauthorized();
  const { id } = await params;
  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) return apiNotFound("Item not found");

  const canDelete = canDeleteItem(session);
  const canUpdate = canFullCrud(session) || canUpdateQuantity(session);

  try {
    const body = await req.json();
    const parsed = updateInventorySchema.safeParse({
      ...body,
      quantity: body.quantity != null ? Number(body.quantity) : undefined,
      price: body.price != null ? Number(body.price) : undefined,
      reorderLevel: body.reorderLevel != null ? Number(body.reorderLevel) : undefined,
    });
    if (!parsed.success) return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    const data = parsed.data;

    if (data.status !== undefined && !canFullCrud(session)) {
      delete (data as Record<string, unknown>).status;
    }

    const newQty = data.quantity ?? item.quantity;
    const newReorder = data.reorderLevel ?? item.reorderLevel;
    const newStatus =
      data.status ??
      computeStatus(newQty, newReorder, item.status);

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description ?? null }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.category !== undefined && { category: data.category ?? null }),
        ...(data.price !== undefined && { price: data.price ?? null }),
        ...(data.supplier !== undefined && { supplier: data.supplier ?? null }),
        ...(data.reorderLevel !== undefined && { reorderLevel: data.reorderLevel }),
        status: newStatus,
      },
    });
    await logActivity({
      action: "UPDATE",
      entity: "InventoryItem",
      entityId: id,
      details: updated.name,
      userId: session.sub,
      itemId: id,
    });
    return apiSuccess({ item: { ...updated, price: updated.price ? Number(updated.price) : null } });
  } catch (e) {
    console.error(e);
    return apiError("Failed to update item", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiUnauthorized();
  if (!canDeleteItem(session)) return apiError("Forbidden", 403);
  const { id } = await params;
  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) return apiNotFound("Item not found");
  await prisma.inventoryItem.delete({ where: { id } });
  await logActivity({
    action: "DELETE",
    entity: "InventoryItem",
    entityId: id,
    details: item.name,
    userId: session.sub,
  });
  return apiSuccess({ ok: true });
}
