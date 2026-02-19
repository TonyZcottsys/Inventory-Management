import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { generateDescription } from "@/lib/ai-mock";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiUnauthorized();
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name : "";
    const category = typeof body.category === "string" ? body.category : undefined;
    if (!name.trim()) return apiError("Name is required", 400);
    const description = await generateDescription(name.trim(), category);
    return apiSuccess({ description });
  } catch (e) {
    console.error(e);
    return apiError("Failed to generate description", 500);
  }
}
