"use client";

import { STATUS_LABELS, STATUS_COLORS } from "@/lib/inventory";
import type { InventoryStatus } from "@prisma/client";

export function StatusBadge({ status }: { status: InventoryStatus }) {
  return (
    <span className={`badge ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
