import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/health
 * Verifies the app can connect to the database. No auth required.
 * Use this to confirm DATABASE_URL and connectivity on Render.
 */
export async function GET() {
  const hasDbUrl = !!process.env.DATABASE_URL;

  if (!hasDbUrl) {
    return NextResponse.json(
      { ok: false, database: "not_configured", message: "DATABASE_URL is not set" },
      { status: 503 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      database: "connected",
      message: "App can connect to the database.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[GET /api/health] Database check failed:", e);
    return NextResponse.json(
      { ok: false, database: "error", message },
      { status: 503 }
    );
  }
}
