import { cookies } from "next/headers";
import { db } from "./db";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING } from "./products";

export type CartItem = { product_id: string; name: string; category: string; price_cents: number; image_url: string; quantity: number };

export async function getCartId() {
  const jar = await cookies();
  const id = jar.get("ff_cart")?.value;
  return id && /^[0-9a-f-]{36}$/.test(id) ? id : null;
}

export async function ensureCart() {
  const sql = db();
  const oldId = await getCartId();
  if (oldId) {
    const rows = await sql`SELECT id FROM carts WHERE id = ${oldId} AND NOT EXISTS (SELECT 1 FROM orders WHERE cart_id = ${oldId})`;
    if (rows.length) return oldId;
  }
  const rows = await sql`INSERT INTO carts DEFAULT VALUES RETURNING id`;
  const id = rows[0].id as string;
  (await cookies()).set("ff_cart", id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return id;
}

export async function getCartItems(cartId: string): Promise<CartItem[]> {
  return await db()`SELECT ci.product_id, ci.quantity, p.name, p.category, p.price_cents, p.image_url
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = ${cartId} AND p.active = true ORDER BY p.sort_order` as CartItem[];
}

export const shippingFor = (subtotal: number) => subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING;
