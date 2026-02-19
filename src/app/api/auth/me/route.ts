import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/auth";
import { apiSuccess, apiUnauthorized } from "@/lib/api-response";

export async function GET() {
  const session = await getSession();
  if (!session) return apiUnauthorized();
  const user = await getUserById(session.sub);
  if (!user) return apiUnauthorized();
  return apiSuccess({ user });
}
