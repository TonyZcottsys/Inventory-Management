import { prisma } from "./db";

export async function logActivity(params: {
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  userId?: string;
  itemId?: string;
}) {
  await prisma.activityLog.create({ data: params });
}
