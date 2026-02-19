import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createToken, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { apiSuccess, apiError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return apiError("Invalid email or password", 400);
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password)))
      return apiError("Invalid email or password", 401);
    const token = await createToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    await setSessionCookie(token);
    await logActivity({
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      userId: user.id,
    });
    return apiSuccess({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (e) {
    console.error(e);
    return apiError("Login failed", 500);
  }
}
