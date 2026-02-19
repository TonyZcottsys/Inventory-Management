import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);
  const managerPassword = await bcrypt.hash("manager123", 12);
  const staffPassword = await bcrypt.hash("staff123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: adminPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  });
  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      password: managerPassword,
      name: "Manager User",
      role: "MANAGER",
    },
  });
  const staff = await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: {},
    create: {
      email: "staff@example.com",
      password: staffPassword,
      name: "Staff User",
      role: "STAFF",
    },
  });

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

  await prisma.activityLog.deleteMany({});
  await prisma.inventoryItem.deleteMany({});

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const category = categories[i % categories.length];
    const quantity = Math.floor(Math.random() * 80) + 5;
    const reorderLevel = Math.floor(Math.random() * 20) + 5;
    const status =
      quantity <= reorderLevel ? "LOW_STOCK" : quantity <= reorderLevel * 1.5 ? "LOW_STOCK" : "IN_STOCK";
    await prisma.inventoryItem.create({
      data: {
        name,
        description: `Quality ${name.toLowerCase()} for office use.`,
        quantity,
        category,
        price: Math.round((Math.random() * 100 + 10) * 100) / 100,
        supplier: suppliers[i % suppliers.length],
        reorderLevel,
        status,
      },
    });
  }

  console.log("Seed complete. Users: admin@example.com / admin123, manager@example.com / manager123, staff@example.com / staff123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
