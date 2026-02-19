import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canManageUsers } from "@/lib/auth";
import { apiSuccess, apiUnauthorized, apiForbidden, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiUnauthorized();
    if (!canManageUsers(session)) return apiForbidden();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { user: { select: { email: true, name: true } } },
      }),
      prisma.activityLog.count(),
    ]);
    return apiSuccess({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error("[GET /api/activity]", e);
    return apiError("Failed to load activity", 500);
  }
}
