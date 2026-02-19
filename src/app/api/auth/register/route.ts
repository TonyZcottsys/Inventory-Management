import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { apiSuccess, apiError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }
    const { email, password, name } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return apiError("Email already registered", 409);
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashed, name: name || null, role: "STAFF" },
      select: { id: true, email: true, name: true, role: true },
    });
    const token = await createToken({ sub: user.id, email: user.email, role: user.role });
    await setSessionCookie(token);
    try {
      await logActivity({
        action: "REGISTER",
        entity: "User",
        entityId: user.id,
        details: `New user: ${user.email}`,
        userId: user.id,
      });
    } catch (activityErr) {
      console.error("[POST /api/auth/register] logActivity failed:", activityErr);
    }
    return apiSuccess({ user });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[POST /api/auth/register]", message, e);
    // Missing table = migrations not run (common on first deploy)
    if (typeof message === "string" && (message.includes("does not exist") || message.includes("relation"))) {
      return apiError("Database not ready. Please try again in a minute or contact support.", 503);
    }
    return apiError("Registration failed", 500);
  }
}
