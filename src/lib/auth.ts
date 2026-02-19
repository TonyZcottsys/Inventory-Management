import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "inventory-jwt-secret-min-32-characters-long"
);
const COOKIE_NAME = "inventory-token";

export type Role = "ADMIN" | "MANAGER" | "STAFF";

export interface JWTPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function requireRole(allowed: Role[]): (payload: JWTPayload) => boolean {
  return (payload) => allowed.includes(payload.role);
}

export const canManageUsers: (p: JWTPayload) => boolean = requireRole(["ADMIN"]);
export const canDeleteItem: (p: JWTPayload) => boolean = requireRole(["ADMIN", "MANAGER"]);
export const canFullCrud: (p: JWTPayload) => boolean = requireRole(["ADMIN", "MANAGER"]);
export const canViewAnalytics: (p: JWTPayload) => boolean = requireRole(["ADMIN", "MANAGER"]);
export const canUpdateQuantity: (p: JWTPayload) => boolean = requireRole(["ADMIN", "MANAGER", "STAFF"]);

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true, role: true } });
}
