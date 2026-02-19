import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// Raw upsert into inventory."User" with explicit inventory."Role" cast (avoids public."Role" in shared DB).
async function upsertUser(
  email: string,
  password: string,
  name: string,
  role: "ADMIN" | "MANAGER" | "STAFF"
) {
  const id = randomUUID();
  const now = new Date();
  await prisma.$executeRawUnsafe(
    `INSERT INTO inventory."User" (id, email, password, name, role, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5::inventory."Role", $6, $7)
     ON CONFLICT (email) DO UPDATE SET
       password = EXCLUDED.password,
       name = EXCLUDED.name,
       role = EXCLUDED.role,
       "updatedAt" = EXCLUDED."updatedAt"`,
    id,
    email,
    password,
    name,
    role,
    now,
    now
  );
}

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);
  const managerPassword = await bcrypt.hash("manager123", 12);
  const staffPassword = await bcrypt.hash("staff123", 12);

  await upsertUser("admin@example.com", adminPassword, "Admin User", "ADMIN");
  await upsertUser("manager@example.com", managerPassword, "Manager User", "MANAGER");
  await upsertUser("staff@example.com", staffPassword, "Staff User", "STAFF");

  const categories = ["Electronics", "Office Supplies", "Furniture", "Cleaning"];
  const suppliers = ["Acme Corp", "Global Supplies", "Office Depot"];
  const names = [
    "Laptop Stand",
    "Wireless Mouse",
    "USB-C Hub",
    "Monitor Arm",
    "Desk Lamp",
    "Notebook Pack",
    "Stapler",
    "Paper Clips Box",
    "Ergonomic Chair",
    "Standing Desk",
    "Filing Cabinet",
    "All-Purpose Cleaner",
    "Tissue Box",
  ];

  // Use raw SQL so we always target inventory schema (client may resolve to public in shared DB).
  await prisma.$executeRawUnsafe('DELETE FROM inventory."ActivityLog"');
  await prisma.$executeRawUnsafe('DELETE FROM inventory."InventoryItem"');

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const category = categories[i % categories.length];
    const quantity = Math.floor(Math.random() * 80) + 5;
    const reorderLevel = Math.floor(Math.random() * 20) + 5;
    const status =
      quantity <= reorderLevel ? "LOW_STOCK" : quantity <= reorderLevel * 1.5 ? "LOW_STOCK" : "IN_STOCK";
    const description = `Quality ${name.toLowerCase()} for office use.`;
    const price = Math.round((Math.random() * 100 + 10) * 100) / 100;
    const supplier = suppliers[i % suppliers.length];
    const now = new Date();
    await prisma.$executeRawUnsafe(
      `INSERT INTO inventory."InventoryItem" (id, name, description, quantity, category, price, supplier, "reorderLevel", status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::inventory."InventoryStatus", $10, $11)`,
      randomUUID(),
      name,
      description,
      quantity,
      category,
      price,
      supplier,
      reorderLevel,
      status,
      now,
      now
    );
  }

  console.log("Seed complete. Users: admin@example.com / admin123, manager@example.com / manager123, staff@example.com / staff123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
