import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { chatQuery } from "@/lib/ai-mock";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiUnauthorized();
  try {
    const body = await req.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query) return apiError("Query is required", 400);
    const answer = await chatQuery(query);
    return apiSuccess({ answer });
  } catch (e) {
    console.error(e);
    return apiError("Failed to process query", 500);
  }
}
