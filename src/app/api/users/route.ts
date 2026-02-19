import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canManageUsers } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { createUserSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiUnauthorized();
    if (!canManageUsers(session)) return apiForbidden();
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess({ users });
  } catch (e) {
    console.error("[GET /api/users]", e);
    return apiError("Failed to load users", 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiUnauthorized();
  if (!canManageUsers(session)) return apiForbidden();
  try {
    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    const { email, password, name, role } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return apiError("Email already registered", 409);
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashed, name: name ?? null, role },
      select: { id: true, email: true, name: true, role: true },
    });
    await logActivity({
      action: "CREATE_USER",
      entity: "User",
      entityId: user.id,
      details: user.email,
      userId: session.sub,
    });
    return apiSuccess({ user }, 201);
  } catch (e) {
    console.error(e);
    return apiError("Failed to create user", 500);
  }
}
