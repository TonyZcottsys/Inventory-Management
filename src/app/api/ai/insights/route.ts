import { getSession, canViewAnalytics } from "@/lib/auth";
import { getInsights } from "@/lib/ai-mock";
import { apiSuccess, apiUnauthorized, apiForbidden } from "@/lib/api-response";

export async function GET() {
  const session = await getSession();
  if (!session) return apiUnauthorized();
  if (!canViewAnalytics(session)) return apiForbidden();
  const insights = await getInsights();
  return apiSuccess(insights);
}
