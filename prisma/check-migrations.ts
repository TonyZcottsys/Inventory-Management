/**
 * One-off script to list migration status in the database.
 * Run with: npx tsx prisma/check-migrations.ts
 * Ensure .env has DATABASE_URL set (e.g. Render External URL).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Row = { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null; applied_steps_count: number };

async function main() {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT migration_name, finished_at, rolled_back_at, applied_steps_count
     FROM public._prisma_migrations
     ORDER BY started_at`
  );
  console.table(rows);
  const failed = rows.filter((r) => r.finished_at == null && r.rolled_back_at == null);
  if (failed.length) {
    console.log("\nFailed or in-progress migrations (resolve these):", failed.map((r) => r.migration_name).join(", "));
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
