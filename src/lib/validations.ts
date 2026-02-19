import { z } from "zod";

export const inventoryStatusEnum = z.enum(["IN_STOCK", "LOW_STOCK", "ORDERED", "DISCONTINUED"]);
export const roleEnum = z.enum(["ADMIN", "MANAGER", "STAFF"]);

export const createInventorySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  quantity: z.number().int().min(0, "Quantity must be >= 0"),
  category: z.string().max(100).optional(),
  price: z.number().min(0).optional(),
  supplier: z.string().max(200).optional(),
  reorderLevel: z.number().int().min(0).default(0),
  status: inventoryStatusEnum.optional(),
});

export const updateInventorySchema = createInventorySchema.partial();

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().max(100).optional(),
  role: roleEnum.optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createUserSchema = registerSchema.extend({
  role: roleEnum.default("STAFF"),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
