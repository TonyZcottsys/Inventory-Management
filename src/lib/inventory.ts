import { InventoryStatus } from "@prisma/client";

export function computeStatus(
  quantity: number,
  reorderLevel: number,
  currentStatus: InventoryStatus
): InventoryStatus {
  if (currentStatus === "DISCONTINUED") return "DISCONTINUED";
  if (currentStatus === "ORDERED") return "ORDERED";
  if (quantity <= 0) return "LOW_STOCK";
  if (quantity <= reorderLevel) return "LOW_STOCK";
  return "IN_STOCK";
}

export const STATUS_LABELS: Record<InventoryStatus, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  ORDERED: "Ordered",
  DISCONTINUED: "Discontinued",
};

export const STATUS_COLORS: Record<InventoryStatus, string> = {
  IN_STOCK: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  LOW_STOCK: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  ORDERED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DISCONTINUED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};
