import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

export const newToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type Customer = { id: string; email: string; name: string; picture: string | null };

export async function getCustomer(): Promise<Customer | null> {
  const token = (await cookies()).get("ff_session")?.value;
  if (!token) return null;
  const rows = await db()`SELECT c.id, c.email, c.name, c.picture FROM sessions s
    JOIN customers c ON c.id = s.customer_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now() LIMIT 1` as Customer[];
  return rows[0] ?? null;
}

export const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };
