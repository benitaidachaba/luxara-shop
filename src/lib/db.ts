import { neon } from "@neondatabase/serverless";

export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return neon(process.env.DATABASE_URL);
}

export type DbProduct = {
  id: string; name: string; category: string; price_cents: number; color: string;
  image_url: string; tag: string; description: string; origin_country: string;
  sample: boolean; active: boolean;
};

export async function getProducts(): Promise<DbProduct[]> {
  return await db()`SELECT * FROM products WHERE active = true ORDER BY sort_order, id` as DbProduct[];
}

export async function getProduct(id: string): Promise<DbProduct | null> {
  const rows = await db()`SELECT * FROM products WHERE id = ${id} AND active = true LIMIT 1` as DbProduct[];
  return rows[0] ?? null;
}
