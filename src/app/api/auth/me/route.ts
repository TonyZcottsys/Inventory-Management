import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/auth";
import { apiSuccess, apiUnauthorized, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiUnauthorized();
    const user = await getUserById(session.sub);
    if (!user) return apiUnauthorized();
    return apiSuccess({ user });
  } catch (e) {
    console.error("[GET /api/auth/me]", e);
    return apiError("Failed to load session", 500);
  }
}
